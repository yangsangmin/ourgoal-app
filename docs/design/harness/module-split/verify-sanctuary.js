'use strict';
// 포커스 성소 엔진 세포 쪼개기(#TASK-ES-429) 검사 — verify-components.js 와 같은 기준(원본 1개 · 부품 7개) + 원본 단독 로드:
//  ① 글자: 옮긴 코드마다 이전 전 원본의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'T.' 접두뿐, 주석 제외)
//          함수 = 함수 선언 전체 · 메서드 = 객체 속성 전체(키 포함) · 분기 본문 = 블록 안 문 전체(부품 함수의 끝 return <변수>; 는 이음매라 뺀다)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, 옮긴 코드의 window 는 부품 IIFE 인자에 묶임,
//          부품 IIFE 를 부르는 식이 원본과 같음(window), 옮긴 함수 정의·메서드 속성이 원본에 남지 않음, 원본이 옮긴 함수·분기 함수를 모두 가져옴
//  ③ 실행: 브라우저와 같은 순서(부품 → 원본)로 읽었을 때 window 이름이 이전 전과 같은가(새 이름은 키트 OurgoalSanctuaryV3Kit 1개뿐),
//          OurgoalSanctuaryV3 키·순서·값 종류·함수 이름(name)·함수 글자(T. 접두를 뗀 글자)가 같은가, 옮긴 메서드가 키트 묶음의 같은 함수 객체인가
//  ④ 원본 단독 로드(standaloneOk): 법정 모듈 로드 탐침(court/probes/module-load.js loadOne — 읽기만)으로 js/sanctuary-v3-engine.js 하나만 격리 vm 에서 돌려
//          던지지 않고 등록 전역 목록이 이전 전 단독 로드와 같은가. 부품 7개도 각각 단독 로드 성공(등록 전역 = 키트 1개).
//  ⑤ 동결 무결성 게이트(scripts/verify-integrity-gate.js)가 원본 한 파일에서 찾는 글자가 원본에 그대로 남았는가(같은 개수 이상)
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-sanctuary.js <이전 전 앱(git archive)> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const SRC = 'js/sanctuary-v3-engine.js', API = 'OurgoalSanctuaryV3', KITNAME = 'OurgoalSanctuaryV3Kit';
const CELLS = require('./sanctuary-cells.js');
const CALL_EXPR = 'window';
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const tokVals = toks => toks.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock')
  .map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
const norm = toks => { const v = tokVals(toks), out = []; for (let i = 0; i < v.length; i++) { if (v[i] === 'T' && v[i + 1] === '.' && /^[A-Za-z_$]/.test(v[i + 2] || '')) { i += 1; continue; } out.push(v[i]); } return out; };
const prefixT = toks => { const v = tokVals(toks); let n = 0; for (let i = 0; i < v.length; i++) if (v[i] === 'T' && v[i + 1] === '.') n++; return n; };
const between = (ast, a, b) => ast.tokens.filter(t => t.start >= a && t.end <= b);
const iifeOf = a => a.program.body.find(s => s.type === 'ExpressionStatement').expression;
const topFns = a => { const m = {}; for (const x of iifeOf(a).callee.body.body) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); return w; };
const winKeys = o => Object.keys(o).filter(k => k !== 'window' && k !== 'console').sort();
const stripT = s => s.replace(/(^|[^A-Za-z0-9_$.])T\.(?=[A-Za-z_$])/g, '$1');
const fnText = v => (typeof v === 'function' ? Function.prototype.toString.call(v).replace(/\r\n/g, '\n') : typeof v);
const sameArr = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
function firstDiff(a, b) { let at = -1; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; } return { i: at, orig: a.slice(Math.max(0, at - 3), at + 5), neu: b.slice(Math.max(0, at - 3), at + 5) }; }

const baseCode = read(path.join(BASE, SRC));
const oast = parser.parse(baseCode, { sourceType: 'script', tokens: true });
const ofns = topFns(oast);
const apiObj = ast => iifeOf(ast).callee.body.body.find(s => s.type === 'ExpressionStatement' && s.expression.type === 'AssignmentExpression' && s.expression.left.type === 'MemberExpression' && s.expression.left.property.name === API).expression.right;
const oprops = apiObj(oast).properties;
const baseProp = spec => { const [k, occ] = spec.split('#'); return oprops.filter(p => p.key.name === k)[occ === undefined ? 0 : Number(occ)]; };
// 이전 전 분기 본문 찾기
function baseSection(D) {
  let blk = null;
  traverse(oast, { IfStatement(p) {
    if (blk || p.getFunctionParent().node !== ofns[D.fn] || baseCode.slice(p.node.test.start, p.node.test.end) !== D.test) return;
    blk = D.branch === 'else' ? p.node.alternate : p.node.consequent;
  } });
  return blk;
}

const mainCode = read(path.join(APP, SRC));
const mast = parser.parse(mainCode, { sourceType: 'script', tokens: true });
let iife; traverse(mast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(parser.parse(baseCode, { sourceType: 'script' }) && (() => { let i; traverse(parser.parse(baseCode, { sourceType: 'script' }), { FunctionExpression(p) { if (!i) i = p; } }); return i.scope.bindings; })()));
const imported = new Set();
iife.traverse({ VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && /^_s[A-Z]/.test(i.object.name) && !i.computed) imported.add(p.node.id.name); } });
const mprops = apiObj(mast).properties;
const mainPropKeys = mprops.filter(p => p.type !== 'SpreadElement').map(p => p.key.name);
const spreads = mprops.filter(p => p.type === 'SpreadElement').map(p => mainCode.slice(p.argument.start, p.argument.end));

const report = { cells: {} };
let ok = true;
for (const C of CELLS) {
  const r = {};
  const cellCode = read(path.join(APP, C.cell));
  const fast = parser.parse(cellCode, { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  const cellBody = iifeOf(fast).callee.body.body;
  // 부품의 메서드 묶음 객체들 K.methodsFrom_x = { … }
  const cellProps = [];
  for (const s of cellBody) if (s.type === 'ExpressionStatement' && s.expression.type === 'AssignmentExpression' && s.expression.left.type === 'MemberExpression' && s.expression.left.object.name === 'K' && /^methodsFrom_/.test(s.expression.left.property.name)) cellProps.push(...s.expression.right.properties.map(p => ({ run: s.expression.left.property.name, p })));
  r.equiv = [];
  for (const n of C.fns) {
    const a = norm(between(oast, ofns[n].start, ofns[n].end)), b = nfns[n] ? norm(between(fast, nfns[n].start, nfns[n].end)) : [];
    r.equiv.push({ kind: 'fn', name: n, tokensOrig: a.length, tokensNew: b.length, prefixT: nfns[n] ? prefixT(between(fast, nfns[n].start, nfns[n].end)) : null, same: sameArr(a, b), firstDiff: sameArr(a, b) ? null : firstDiff(a, b) });
  }
  for (const spec of C.methods) {
    const bp = baseProp(spec); const k = spec.split('#')[0];
    const np = cellProps.find(x => x.p.key.name === k);
    const a = norm(between(oast, bp.start, bp.end)), b = np ? norm(between(fast, np.p.start, np.p.end)) : [];
    r.equiv.push({ kind: 'method', name: spec, run: np && np.run, tokensOrig: a.length, tokensNew: b.length, prefixT: np ? prefixT(between(fast, np.p.start, np.p.end)) : null, same: sameArr(a, b), firstDiff: sameArr(a, b) ? null : firstDiff(a, b) });
  }
  for (const D of C.sections) {
    const ob = baseSection(D);
    const nf = nfns[D.name];
    let nb = nf ? nf.body.body.slice() : [];
    const last = nb[nb.length - 1];
    const retVar = last && last.type === 'ReturnStatement' && last.argument && last.argument.type === 'Identifier' ? last.argument.name : null;
    if (retVar) nb = nb.slice(0, -1);
    const a = ob ? norm(between(oast, ob.body[0].start, ob.body[ob.body.length - 1].end)) : ['<분기 못 찾음>'];
    const b = nb.length ? norm(between(fast, nb[0].start, nb[nb.length - 1].end)) : [];
    r.equiv.push({ kind: 'section', name: D.name, of: D.fn + ' 「' + D.test + '」' + (D.branch === 'else' ? ' else' : ''), params: nf ? nf.params.map(p => p.name) : null, returns: retVar,
      tokensOrig: a.length, tokensNew: b.length, prefixT: nb.length ? prefixT(between(fast, nb[0].start, nb[nb.length - 1].end)) : null, same: sameArr(a, b), firstDiff: sameArr(a, b) ? null : firstDiff(a, b) });
  }
  const mainFnBindings = iife.scope.bindings;
  r.leftFunctionDefsInMain = C.fns.filter(n => mainFnBindings[n] && mainFnBindings[n].path.isFunctionDeclaration());
  r.notImported = [...C.fns, ...C.sections.map(s => s.name)].filter(n => !imported.has(n));
  // 메서드: 원본 객체에 같은 키 속성이 남아 있으면 안 된다(openPeerDm 둘째처럼 원본에 남기기로 한 같은 키는 개수로 본다)
  r.methodKeysLeftInMain = C.methods.filter(spec => { const k = spec.split('#')[0]; const baseCount = oprops.filter(p => p.key.name === k).length; const moved = CELLS.reduce((a, X) => a + X.methods.filter(m => m.split('#')[0] === k).length, 0); return mainPropKeys.filter(x => x === k).length !== baseCount - moved; });
  r.spreadsInMain = [...new Set(cellProps.map(x => x.run))].map(run => ({ run, spread: spreads.includes(C.imp + '.' + run) }));
  const ce = iifeOf(fast);
  r.cellIifeParams = ce.callee.params.map(p => p.name);
  r.cellCallExprSameAsMain = ce.arguments.length === 1 && cellCode.slice(ce.arguments[0].start, ce.arguments[0].end) === CALL_EXPR;
  const leaks = new Set(), globals = new Set(); let windowRefs = 0, windowBoundToParam = 0;
  traverse(parser.parse(cellCode, { sourceType: 'script' }), {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.node.name === 'window' && p.getFunctionParent()) { windowRefs++; const b = p.scope.getBinding('window'); if (b && b.kind === 'param') windowBoundToParam++; }
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
      if (iifeNames.has(p.node.name) && p.getFunctionParent()) leaks.add(p.node.name);
    }
  });
  r.cellLines = cellCode.split('\n').length - 1;
  r.cellGlobals = [...globals].sort();
  r.leaksIIFEName = [...leaks].sort();
  r.windowRefs = windowRefs; r.windowBoundToCellParam = windowBoundToParam;
  r.ok = r.equiv.every(x => x.same) && !r.leftFunctionDefsInMain.length && !r.notImported.length && !r.methodKeysLeftInMain.length && r.spreadsInMain.every(x => x.spread)
    && !r.leaksIIFEName.length && r.cellLines <= 800 && JSON.stringify(r.cellIifeParams) === '["window"]' && r.cellCallExprSameAsMain && windowRefs === windowBoundToParam;
  ok = ok && r.ok;
  report.cells[C.cell] = r;
}
report.moved = { fns: CELLS.reduce((a, C) => a + C.fns.length, 0), methods: CELLS.reduce((a, C) => a + C.methods.length, 0), sections: CELLS.reduce((a, C) => a + C.sections.length, 0) };
report.mainLinesBefore = baseCode.split('\n').length - 1;
report.mainLinesAfter = mainCode.split('\n').length - 1;
report.mainIifeCallExprSame = (() => { const e = iifeOf(mast); return mainCode.slice(e.arguments[0].start, e.arguments[0].end) === CALL_EXPR; })();
// ③ 실행 — 브라우저 순서(index.html: 부품 7개 → 원본)
const before = run(mkWin(), [SRC], BASE);
const after = run(mkWin(), [...CELLS.map(C => C.cell), SRC], APP);
const kit = after[KITNAME] || {};
const wb = winKeys(before), wa = winKeys(after);
const apiB = Object.keys(before[API]), apiA = Object.keys(after[API]);
const kitMethod = {}; for (const C of CELLS) for (const spec of C.methods) { const k = spec.split('#')[0]; for (const run of Object.keys(kit[C.kit] || {}).filter(x => /^methodsFrom_/.test(x))) if (Object.prototype.hasOwnProperty.call(kit[C.kit][run], k)) kitMethod[spec] = kit[C.kit][run][k]; }
const finalOwner = {}; // 최종 값이 어느 쪽에서 오는가(같은 키가 둘이면 뒤쪽)
for (const k of apiA) finalOwner[k] = Object.keys(kitMethod).filter(s => s.split('#')[0] === k);
report.runtime = {
  windowNamesBefore: wb.length, newWindowNames: wa.filter(k => !wb.includes(k)), lostWindowNames: wb.filter(k => !wa.includes(k)),
  windowValueTypeDiff: wb.filter(k => typeof before[k] !== typeof after[k]),
  kitSlots: Object.keys(kit),
  kitFunctionsPresent: CELLS.every(C => kit[C.kit] && [...C.fns, ...C.sections.map(s => s.name)].every(n => typeof kit[C.kit][n] === 'function')),
  apiKeys: apiA.length, sameApiKeysAndOrder: JSON.stringify(apiB) === JSON.stringify(apiA),
  apiValueTypesSame: apiB.every(k => typeof before[API][k] === typeof after[API][k]),
  apiFunctionNameDiff: apiB.filter(k => typeof before[API][k] === 'function' && before[API][k].name !== after[API][k].name),
  apiFunctionTextRawDiff: apiB.filter(k => fnText(before[API][k]) !== fnText(after[API][k])).length,
  apiFunctionTextDiffAfterStripT: apiB.filter(k => fnText(before[API][k]) !== stripT(fnText(after[API][k]))),
  movedMethodIsKitFunction: Object.keys(kitMethod).filter(s => { const k = s.split('#')[0]; const occ = Number(s.split('#')[1] || 0); const total = oprops.filter(p => p.key.name === k).length; return occ === total - 1; }).every(s => after[API][s.split('#')[0]] === kitMethod[s]),
  movedMethods: Object.keys(kitMethod).length,
};
// ④ 원본 단독 로드 — 법정 탐침의 loadOne 을 그대로 부른다(읽기만, court/** 변경 0)
const { loadOne } = require(path.resolve(APP, 'court', 'probes', 'module-load.js'));
const sb = loadOne(path.join(BASE, SRC)), sa = loadOne(path.join(APP, SRC));
report.standalone = {
  base: { ok: sb.ok, error: sb.error, globals: sb.globals }, after: { ok: sa.ok, error: sa.error, globals: sa.globals },
  sameGlobals: JSON.stringify(sb.globals) === JSON.stringify(sa.globals),
  cells: CELLS.map(C => { const x = loadOne(path.join(APP, C.cell)); return { cell: C.cell, ok: x.ok, error: x.error, globals: x.globals }; }),
};
report.standaloneOk = sb.ok && sa.ok && report.standalone.sameGlobals && report.standalone.cells.every(c => c.ok && JSON.stringify(c.globals) === JSON.stringify([KITNAME]));
// ⑤ 동결 무결성 게이트가 원본 한 파일에서 찾는 글자(scripts/verify-integrity-gate.js 의 sanctuaryContent/sanctContent.includes 인자를 그대로 뽑는다)
const gateSrc = read(path.join(APP, 'scripts', 'verify-integrity-gate.js'));
const gateNeedles = [];
const gast = parser.parse(gateSrc, { sourceType: 'script' });
traverse(gast, { CallExpression(p) {
  const c = p.node.callee;
  if (c.type !== 'MemberExpression' || c.property.name !== 'includes' || c.object.type !== 'Identifier' || !/^sanct/.test(c.object.name)) return;
  const arg = p.node.arguments[0]; if (!arg || arg.type !== 'StringLiteral') return;
  const neg = p.parentPath.isUnaryExpression({ operator: '!' });
  gateNeedles.push({ needle: arg.value, negative: neg });
} });
const count = (s, n) => s.split(n).length - 1;
report.integrityGateNeedles = gateNeedles.map(g => ({ needle: g.needle, negative: g.negative, base: count(baseCode, g.needle), after: count(mainCode, g.needle) }));
report.integrityGateOk = report.integrityGateNeedles.every(g => g.negative ? g.after === 0 : (g.after >= 1 && g.base >= 1));
const R = report.runtime;
report.mainOk = report.mainLinesAfter <= 800 && report.mainIifeCallExprSame && R.newWindowNames.length === 1 && R.newWindowNames[0] === KITNAME && !R.lostWindowNames.length
  && !R.windowValueTypeDiff.length && R.kitFunctionsPresent && R.sameApiKeysAndOrder && R.apiValueTypesSame && !R.apiFunctionNameDiff.length
  && !R.apiFunctionTextDiffAfterStripT.length && R.movedMethodIsKitFunction;
ok = ok && report.mainOk && report.standaloneOk && report.integrityGateOk;
report.cellsWithJandi = CELLS.filter(C => read(path.join(APP, C.cell)).includes('잔디')).map(C => C.cell);
ok = ok && report.cellsWithJandi.length === 0;
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일 · 누수 0 · 남은 정의 0 · window·OurgoalSanctuaryV3 이름·순서·함수 글자 동일(+키트 1) · 원본 단독 로드 성공 · 동결 게이트 글자 원본에 남음' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-sanctuary.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
