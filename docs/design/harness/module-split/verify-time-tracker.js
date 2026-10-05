'use strict';
// 시간기록 세포 쪼개기(#TASK-ES-407) 검사 — verify-team-split-3.js 와 같은 기준(원본 1개 · 부품 3개):
//  ① 글자: 옮긴 함수마다 이전 전 원본의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'T.' 접두뿐, 주석 제외)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, T.<이름> 이 모두 노출됐는가(노출됐는데 안 씀 0),
//          옮긴 함수 정의가 원본에 남지 않았는가, 원본이 옮긴 함수를 모두 가져오는가, 대입하는 이름 = setter
//  ③ 실행: 브라우저와 같은 순서(부품 → 원본)로 읽었을 때 노출 객체 OurgoalTimeTracker 의 키·순서가 이전 전과 같은가, 키트 함수가 원본이 가져온 함수와 같은가,
//          window 이름이 이전 전과 같은가(새 이름은 키트 OurgoalTimeTrackerKit 1개뿐), 키트 없이 node require 로 읽어도(원본이 부품을 require) 노출 키·순서가 같은가
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-time-tracker.js <이전 전 앱(git archive)> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const SRC = 'js/time-tracker.js', API = 'OurgoalTimeTracker', KITNAME = 'OurgoalTimeTrackerKit';
const CELLS = [
  { cell: 'js/time-tracker-screen.js', kit: 'screen', imp: '_ttScreen', names: ['initDOM', 'bindEvents'] },
  { cell: 'js/time-tracker-lap-memo.js', kit: 'lapMemo', imp: '_ttLapMemo', names: ['openLapMemoModal'] },
  { cell: 'js/time-tracker-review.js', kit: 'review', imp: '_ttReview', names: ['openReviewView', 'handleSaveRecord'] },
];
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
const iifeBody = a => a.program.body.find(s => s.type === 'ExpressionStatement').expression.callee.body.body;
const topFns = a => { const m = {}; for (const x of iifeBody(a)) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); return w; };
const winKeys = o => Object.keys(o).filter(k => k !== 'window' && k !== 'console').sort();

const report = { cells: {} };
let ok = true;
const oast = parser.parse(read(path.join(BASE, SRC)), { sourceType: 'script', tokens: true });
const ofns = topFns(oast);
const mast = parser.parse(read(path.join(APP, SRC)), { sourceType: 'script' });
let iife; traverse(mast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
// 원본 이음매: 칸별 getter 목록·setter·가져온 함수
const exposedBy = {}, settersBy = {}, imported = new Set();
iife.traverse({
  ObjectMethod(p) {
    const call = p.parentPath.parentPath;
    if (!(call.isCallExpression() && call.node.callee.type === 'MemberExpression' && call.node.callee.property.name === 'getOwnPropertyDescriptors')) return;
    const outer = call.parentPath; // Object.defineProperties(<imp>.scope || ..., ...)
    const tgt = outer.node.arguments[0];
    const imp = tgt.type === 'LogicalExpression' ? tgt.left.object.name : null;
    (p.node.kind === 'get' ? (exposedBy[imp] = exposedBy[imp] || new Set()) : (settersBy[imp] = settersBy[imp] || new Set())).add(p.node.key.name);
  },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && /^_tt[A-Z]/.test(i.object.name) && !i.computed) imported.add(p.node.id.name); }
});
for (const C of CELLS) {
  const r = {};
  const fast = parser.parse(read(path.join(APP, C.cell)), { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  r.equiv = C.names.map(n => {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    return { fn: n, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } };
  });
  r.leftFunctionDefsInMain = C.names.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
  r.notImported = C.names.filter(n => !imported.has(n));
  const exposed = exposedBy[C.imp] || new Set(), setters = settersBy[C.imp] || new Set();
  const usedT = new Set(), assignedT = new Set(), leaks = new Set(), globals = new Set();
  traverse(parser.parse(read(path.join(APP, C.cell)), { sourceType: 'script' }), {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'T') { usedT.add(p.node.name); const gp = p.parentPath.parentPath; if ((gp.isAssignmentExpression() && gp.node.left === par) || gp.isUpdateExpression()) assignedT.add(p.node.name); }
        return;
      }
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
      if (iifeNames.has(p.node.name) && p.node.name !== 'global') leaks.add(p.node.name);
    }
  });
  r.cellLines = read(path.join(APP, C.cell)).split('\n').length - 1;
  r.cellGlobals = [...globals].sort();
  r.leaksIIFEName = [...leaks].sort();
  r.exposed = [...exposed].sort();
  r.notExposed = [...usedT].filter(n => !exposed.has(n)).sort();
  r.exposedUnused = [...exposed].filter(n => !usedT.has(n)).sort();
  r.setters = [...setters].sort();
  r.assignedNoSetter = [...assignedT].filter(n => !setters.has(n)).sort();
  r.settersUnused = [...setters].filter(n => !assignedT.has(n)).sort();
  r.ok = r.equiv.every(x => x.same) && !r.leftFunctionDefsInMain.length && !r.notImported.length && !r.leaksIIFEName.length && !r.notExposed.length
    && !r.exposedUnused.length && !r.assignedNoSetter.length && !r.settersUnused.length && r.cellLines <= 800;
  ok = ok && r.ok;
  report.cells[C.cell] = r;
}
report.mainLinesBefore = read(path.join(BASE, SRC)).split('\n').length - 1;
report.mainLinesAfter = read(path.join(APP, SRC)).split('\n').length - 1;
// ③ 실행 — 브라우저 순서(index.html: 부품 3개 → 원본)
const before = run(mkWin(), [SRC], BASE);
const after = run(mkWin(), [...CELLS.map(C => C.cell), SRC], APP);
const kit = after[KITNAME] || {};
const apiB = Object.keys(before[API]), apiA = Object.keys(after[API]);
report.runtime = {
  apiKeys: apiA, sameApiKeysAndOrder: JSON.stringify(apiB) === JSON.stringify(apiA),
  apiValueTypesSame: apiB.every(k => typeof before[API][k] === typeof after[API][k]),
  kitSlots: Object.keys(kit),
  kitFunctionsPresent: CELLS.every(C => kit[C.kit] && C.names.every(n => typeof kit[C.kit][n] === 'function')),
  windowNamesBefore: winKeys(before), newWindowNames: winKeys(after).filter(k => !winKeys(before).includes(k)), lostWindowNames: winKeys(before).filter(k => !winKeys(after).includes(k)),
  scopeGettersResolve: CELLS.every(C => kit[C.kit] && [...(exposedBy[C.imp] || [])].every(n => Object.prototype.hasOwnProperty.call(kit[C.kit].scope, n) && kit[C.kit].scope[n] !== undefined)),
  getStateIsLiveTrackerObject: after[API].getState() === kit.screen.scope.tracker && kit.screen.scope.tracker === kit.review.scope.tracker && kit.review.scope.tracker === kit.lapMemo.scope.tracker,
};
// node require 경로: 키트 없이 원본만 require(window 는 있음) → 원본 이음매가 부품 3개를 require 한다
function nodeKeys(base) {
  for (const k of Object.keys(require.cache)) if (k.startsWith(path.resolve(base))) delete require.cache[k];
  const saved = global.window; const w = mkWin(); global.window = w;
  try { require(path.resolve(base, SRC)); return { keys: Object.keys(w[API]), kitSlots: Object.keys(w[KITNAME] || {}) }; } finally { global.window = saved; if (saved === undefined) delete global.window; }
}
const nb = nodeKeys(BASE), na = nodeKeys(APP);
report.runtime.nodeRequireSameKeysAndOrder = JSON.stringify(nb.keys) === JSON.stringify(na.keys);
report.runtime.nodeRequireKitSlots = na.kitSlots;
const R = report.runtime;
report.mainOk = report.mainLinesAfter <= 800 && R.sameApiKeysAndOrder && R.apiValueTypesSame && R.kitFunctionsPresent && R.scopeGettersResolve && R.getStateIsLiveTrackerObject
  && !R.lostWindowNames.length && R.newWindowNames.length === 1 && R.newWindowNames[0] === KITNAME && R.nodeRequireSameKeysAndOrder && R.nodeRequireKitSlots.length === 3;
ok = ok && report.mainOk;
// 부품의 '잔디' 글자(용어 헌법 — 원본 한 파일만 보는 검사의 범위 밖이라 따로 잰다)
report.cellsWithJandi = CELLS.filter(C => read(path.join(APP, C.cell)).includes('잔디')).map(C => C.cell);
ok = ok && report.cellsWithJandi.length === 0;
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(T. 접두 제외) · 누수 0 · 미노출 0 · 남은 정의 0 · setter 짝 맞음 · 노출 API·window 이름 동일(+키트 1)' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-time-tracker.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
