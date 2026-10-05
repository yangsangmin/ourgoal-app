'use strict';
// 공통 UI 컴포넌트 세포 쪼개기(#TASK-ES-411) 검사 — verify-time-tracker.js 와 같은 기준(원본 1개 · 부품 11개) + 원본 단독 로드:
//  ① 글자: 옮긴 함수마다 이전 전 원본의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'T.' 접두뿐, 주석 제외 — 이번 묶음은 T. 0개)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, 옮긴 코드의 window 는 부품 IIFE 인자에 묶임,
//          부품 IIFE 를 부르는 식이 원본과 같음, 옮긴 함수 정의가 원본에 남지 않음, 원본이 옮긴 함수를 모두 가져옴
//  ③ 실행: 브라우저와 같은 순서(부품 → 원본)로 읽었을 때 window 이름이 이전 전과 같은가(새 이름은 키트 OurgoalComponentsKit 1개뿐),
//          노출된 window 함수마다 소스 글자(Function.prototype.toString)가 이전 전과 같은가, 키트 함수와 같은 객체인가,
//          OurgoalComponents 키·순서·값 종류·함수 글자가 같은가, 별칭 handle팀목표_Item51Action === handle소통_Item51Action,
//          키트 없이 node require 로 읽어도(원본이 부품을 require) module.exports 키·순서·함수 글자가 같은가
//  ④ 원본 단독 로드(standaloneOk): 법정 모듈 로드 탐침(court/probes/module-load.js loadOne — 읽기만)으로 js/components.js 하나만 격리 vm 에서 돌려
//          던지지 않고 등록 전역 목록이 이전 전 단독 로드와 같은가. 부품 11개도 각각 단독 로드 성공.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-components.js <이전 전 앱(git archive)> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const SRC = 'js/components.js', API = 'OurgoalComponents', KITNAME = 'OurgoalComponentsKit';
const CELLS = require('./components-cells.js');
const CALL_EXPR = "typeof window !== 'undefined' ? window : global";
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const norm = toks => {
  toks = toks.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock');
  const vals = toks.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === 'T' && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
const iifeOf = a => a.program.body.find(s => s.type === 'ExpressionStatement').expression;
const topFns = a => { const m = {}; for (const x of iifeOf(a).callee.body.body) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); return w; };
const winKeys = o => Object.keys(o).filter(k => k !== 'window' && k !== 'console').sort();
const fnText = v => (typeof v === 'function' ? Function.prototype.toString.call(v).replace(/\r\n/g, '\n') : typeof v); // 줄 끝(CRLF·LF)만 맞춤

const report = { cells: {} };
let ok = true;
const baseCode = read(path.join(BASE, SRC));
const oast = parser.parse(baseCode, { sourceType: 'script', tokens: true });
const ofns = topFns(oast);
const mainCode = read(path.join(APP, SRC));
const mast = parser.parse(mainCode, { sourceType: 'script' });
let iife; traverse(mast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const imported = new Set();
iife.traverse({ VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && /^_c[A-Z]/.test(i.object.name) && !i.computed) imported.add(p.node.id.name); } });
for (const C of CELLS) {
  const r = {};
  const cellCode = read(path.join(APP, C.cell));
  const fast = parser.parse(cellCode, { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  r.equiv = C.names.map(n => {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = nfns[n] ? norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end)) : [];
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    return { fn: n, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(Math.max(0, at - 3), at + 5), neu: b.slice(Math.max(0, at - 3), at + 5) } };
  });
  r.leftFunctionDefsInMain = C.names.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
  r.notImported = C.names.filter(n => !imported.has(n));
  const ce = iifeOf(fast);
  r.cellIifeParams = ce.callee.params.map(p => p.name);
  r.cellCallExprSameAsMain = ce.arguments.length === 1 && cellCode.slice(ce.arguments[0].start, ce.arguments[0].end) === CALL_EXPR;
  const leaks = new Set(), globals = new Set(); let windowRefs = 0, windowBoundToParam = 0, usedT = 0;
  traverse(parser.parse(cellCode, { sourceType: 'script' }), {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) { if (par.object.type === 'Identifier' && par.object.name === 'T') usedT++; return; }
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.node.name === 'window' && p.getFunctionParent()) { windowRefs++; const b = p.scope.getBinding('window'); if (b && b.kind === 'param') windowBoundToParam++; }
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
      if (iifeNames.has(p.node.name) && p.getFunctionParent()) leaks.add(p.node.name); // 부품 IIFE 를 부르는 식(바깥)의 window 는 원본과 같은 전역 — 누수 아님
    }
  });
  r.cellLines = cellCode.split('\n').length - 1;
  r.cellGlobals = [...globals].sort();
  r.leaksIIFEName = [...leaks].sort();
  r.windowRefs = windowRefs; r.windowBoundToCellParam = windowBoundToParam;
  r.scopePrefixT = usedT;
  r.ok = r.equiv.every(x => x.same) && !r.leftFunctionDefsInMain.length && !r.notImported.length && !r.leaksIIFEName.length
    && r.cellLines <= 800 && JSON.stringify(r.cellIifeParams) === '["window"]' && r.cellCallExprSameAsMain && windowRefs === windowBoundToParam && usedT === 0;
  ok = ok && r.ok;
  report.cells[C.cell] = r;
}
report.movedFunctions = CELLS.reduce((a, C) => a + C.names.length, 0);
report.mainLinesBefore = baseCode.split('\n').length - 1;
report.mainLinesAfter = mainCode.split('\n').length - 1;
report.mainIifeCallExprSame = (() => { const e = iifeOf(mast); return mainCode.slice(e.arguments[0].start, e.arguments[0].end) === CALL_EXPR; })();
// ③ 실행 — 브라우저 순서(index.html: 부품 11개 → 원본)
const before = run(mkWin(), [SRC], BASE);
const after = run(mkWin(), [...CELLS.map(C => C.cell), SRC], APP);
const kit = after[KITNAME] || {};
const wb = winKeys(before), wa = winKeys(after);
const exposedFns = wb.filter(k => typeof before[k] === 'function');
const apiB = Object.keys(before[API]), apiA = Object.keys(after[API]);
const kitFn = {}; for (const C of CELLS) for (const n of C.names) kitFn[n] = kit[C.kit] && kit[C.kit][n];
report.runtime = {
  windowNamesBefore: wb.length, newWindowNames: wa.filter(k => !wb.includes(k)), lostWindowNames: wb.filter(k => !wa.includes(k)),
  exposedWindowFunctions: exposedFns.length,
  windowFunctionTextDiff: exposedFns.filter(k => fnText(before[k]) !== fnText(after[k])),
  windowValueTypeDiff: wb.filter(k => typeof before[k] !== typeof after[k]),
  windowMovedFnIsKitFn: Object.keys(kitFn).filter(n => wb.includes(n)).every(n => after[n] === kitFn[n]),
  movedExposedOnWindow: Object.keys(kitFn).filter(n => wb.includes(n)).length,
  kitSlots: Object.keys(kit),
  kitFunctionsPresent: CELLS.every(C => kit[C.kit] && C.names.every(n => typeof kit[C.kit][n] === 'function')),
  apiKeys: apiA.length, sameApiKeysAndOrder: JSON.stringify(apiB) === JSON.stringify(apiA),
  apiValueTypesSame: apiB.every(k => typeof before[API][k] === typeof after[API][k]),
  apiFunctionTextDiff: apiB.filter(k => fnText(before[API][k]) !== fnText(after[API][k])),
  aliasItem51Same: after['handle팀목표_Item51Action'] === after['handle소통_Item51Action'] && before['handle팀목표_Item51Action'] === before['handle소통_Item51Action'],
};
// node require 경로: 키트 없이 원본만 require → 원본 이음매가 부품 11개를 require 한다
function nodeExports(base) {
  for (const k of Object.keys(require.cache)) if (k.startsWith(path.resolve(base))) delete require.cache[k];
  const saved = global.window; const savedKit = global[KITNAME]; const w = mkWin(); global.window = w;
  try {
    const m = require(path.resolve(base, SRC));
    return { keys: Object.keys(m), texts: Object.keys(m).map(k => fnText(m[k])), kitSlots: Object.keys(w[KITNAME] || {}) };
  } finally { global.window = saved; if (saved === undefined) delete global.window; if (savedKit === undefined) delete global[KITNAME]; }
}
const nb = nodeExports(BASE), na = nodeExports(APP);
report.runtime.nodeExportsCount = na.keys.length;
report.runtime.nodeRequireSameKeysAndOrder = JSON.stringify(nb.keys) === JSON.stringify(na.keys);
report.runtime.nodeRequireFunctionTextDiff = nb.keys.filter((k, i) => nb.texts[i] !== na.texts[na.keys.indexOf(k)]);
report.runtime.nodeRequireKitSlots = na.kitSlots;
// ④ 원본 단독 로드 — 법정 탐침의 loadOne 을 그대로 부른다(읽기만, court/** 변경 0)
const { loadOne } = require(path.resolve(APP, 'court', 'probes', 'module-load.js'));
const sb = loadOne(path.join(BASE, SRC)), sa = loadOne(path.join(APP, SRC));
report.standalone = {
  base: { ok: sb.ok, error: sb.error, globals: sb.globals.length }, after: { ok: sa.ok, error: sa.error, globals: sa.globals.length },
  sameGlobals: JSON.stringify(sb.globals) === JSON.stringify(sa.globals),
  cells: CELLS.map(C => { const x = loadOne(path.join(APP, C.cell)); return { cell: C.cell, ok: x.ok, error: x.error, globals: x.globals }; }),
};
report.standaloneOk = sb.ok && sa.ok && report.standalone.sameGlobals && report.standalone.cells.every(c => c.ok && JSON.stringify(c.globals) === JSON.stringify([KITNAME]));
const R = report.runtime;
report.mainOk = report.mainLinesAfter <= 800 && report.mainIifeCallExprSame && !R.newWindowNames.filter(k => k !== KITNAME).length && R.newWindowNames.length === 1 && !R.lostWindowNames.length
  && !R.windowFunctionTextDiff.length && !R.windowValueTypeDiff.length && R.windowMovedFnIsKitFn && R.kitFunctionsPresent && R.sameApiKeysAndOrder && R.apiValueTypesSame
  && !R.apiFunctionTextDiff.length && R.aliasItem51Same && R.nodeRequireSameKeysAndOrder && !R.nodeRequireFunctionTextDiff.length && R.nodeRequireKitSlots.length === CELLS.length;
ok = ok && report.mainOk && report.standaloneOk;
report.cellsWithJandi = CELLS.filter(C => read(path.join(APP, C.cell)).includes('잔디')).map(C => C.cell);
ok = ok && report.cellsWithJandi.length === 0;
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일 · 누수 0 · 남은 정의 0 · window·OurgoalComponents·module.exports 이름·순서·함수 글자 동일(+키트 1) · 원본 단독 로드 성공' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-components.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
