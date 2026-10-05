'use strict';
// 팀 세포 쪼개기 3차(#TASK-ES-402) 검사(verify-team-split-2.js 와 같은 기준, 원본 3개):
//  ① 글자: 옮긴 함수마다 이전 전 원본의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'T.' 접두뿐, 주석 제외)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, T.<이름> 이 모두 노출됐는가(노출됐는데 안 씀 0),
//          옮긴 함수 정의가 원본에 남지 않았는가, 원본이 옮긴 함수를 모두 가져오는가, 대입하는 이름 = setter
//  ③ 실행: 브라우저와 같은 순서(부품 → 원본)로 읽었을 때 노출 객체의 키·순서가 이전 전과 같은가, 옮긴 함수가 키트 함수와 같은 객체인가,
//          window 이름이 이전 전과 같은가(새 이름은 키트 OurgoalTeamGoalsKit 1개뿐), node require 로 읽어도 노출 키·순서가 같은가
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-team-split-3.js <이전 전 앱(git archive)> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const SOURCES = [
  { src: 'js/team-visibility-levels.js', cell: 'js/team-level-group-modal.js', kit: 'visibilityLevels', api: 'OurgoalTeamVisibilityLevels', names: ['openLevelGroupDetailModal'] },
  { src: 'js/team-leader-check.js', cell: 'js/team-member-review.js', kit: 'leaderCheck', api: 'OurgoalTeamLeaderCheck', names: ['openLeaderStampSelectModal', 'openMemberProgressDetailModal'] },
  { src: 'js/team-linked-goals.js', cell: 'js/team-linked-goals-screen.js', kit: 'linkedGoals', api: 'OurgoalTeamLinkedGoals', names: ['renderTeamLinkedGoalsScreen'] },
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
const nodeKeys = (base, S0) => {
  const p = path.resolve(base, S0.src);
  for (const k of Object.keys(require.cache)) if (k.startsWith(path.resolve(base))) delete require.cache[k];
  let m = require(p); if (S0.api === 'OurgoalTeamLinkedGoals') m = m.OurgoalTeamLinkedGoals; // 이 파일은 node 에서 module.exports(this) 에 붙는다
  return { keys: Object.keys(m), fns: Object.keys(m).filter(k => typeof m[k] === 'function') };
};

const report = { sources: {} };
let ok = true;
for (const S0 of SOURCES) {
  const r = {};
  // ① 글자
  const oast = parser.parse(read(path.join(BASE, S0.src)), { sourceType: 'script', tokens: true });
  const ofns = topFns(oast);
  const fast = parser.parse(read(path.join(APP, S0.cell)), { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  r.equiv = S0.names.map(n => {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    return { fn: n, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } };
  });
  // ② 누수
  const mast = parser.parse(read(path.join(APP, S0.src)), { sourceType: 'script' });
  let iife; traverse(mast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const iifeNames = new Set(Object.keys(iife.scope.bindings));
  const exposed = new Set(), setters = new Set(), imported = new Set();
  iife.traverse({
    ObjectMethod(p) { if (p.node.kind === 'set') setters.add(p.node.key.name); if (p.node.kind === 'get' && p.parentPath.parentPath.isCallExpression() && p.parentPath.parentPath.node.callee.type === 'MemberExpression' && p.parentPath.parentPath.node.callee.property.name === 'getOwnPropertyDescriptors') exposed.add(p.node.key.name); },
    VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_goalsKit' && !i.computed) imported.add(p.node.id.name); }
  });
  r.leftFunctionDefsInMain = S0.names.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
  r.notImported = S0.names.filter(n => !imported.has(n));
  const usedT = new Set(), assignedT = new Set(), leaks = new Set(), globals = new Set();
  traverse(parser.parse(read(path.join(APP, S0.cell)), { sourceType: 'script' }), {
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
  r.cellLines = read(path.join(APP, S0.cell)).split('\n').length - 1;
  r.mainLinesBefore = read(path.join(BASE, S0.src)).split('\n').length - 1;
  r.mainLinesAfter = read(path.join(APP, S0.src)).split('\n').length - 1;
  r.cellGlobals = [...globals].sort();
  r.leaksIIFEName = [...leaks].sort();
  r.exposed = [...exposed].sort();
  r.notExposed = [...usedT].filter(n => !exposed.has(n)).sort();
  r.exposedUnused = [...exposed].filter(n => !usedT.has(n)).sort();
  r.setters = [...setters].sort();
  r.assignedNoSetter = [...assignedT].filter(n => !setters.has(n)).sort();
  r.settersUnused = [...setters].filter(n => !assignedT.has(n)).sort();
  // ③ 실행
  const before = run(mkWin(), [S0.src], BASE);
  const after = run(mkWin(), [S0.cell, S0.src], APP);
  const kit = after.OurgoalTeamGoalsKit && after.OurgoalTeamGoalsKit[S0.kit];
  const apiB = Object.keys(before[S0.api]), apiA = Object.keys(after[S0.api]);
  r.runtime = {
    apiKeys: apiA, sameApiKeysAndOrder: JSON.stringify(apiB) === JSON.stringify(apiA),
    movedFunctionsAreKitFunctions: !!kit && S0.names.every(n => typeof kit[n] === 'function' && (!(n in after[S0.api]) || after[S0.api][n] === kit[n])),
    windowNamesBefore: winKeys(before), newWindowNames: winKeys(after).filter(k => !winKeys(before).includes(k)), lostWindowNames: winKeys(before).filter(k => !winKeys(after).includes(k)),
    scopeGettersResolve: !!kit && [...exposed].every(n => Object.prototype.hasOwnProperty.call(kit.scope, n) && kit.scope[n] !== undefined),
  };
  const nb = nodeKeys(BASE, S0), na = nodeKeys(APP, S0);
  r.runtime.nodeRequireSameKeysAndOrder = JSON.stringify(nb.keys) === JSON.stringify(na.keys);
  r.runtime.nodeRequireSameFunctionKeys = JSON.stringify(nb.fns) === JSON.stringify(na.fns);
  r.ok = r.equiv.every(x => x.same) && !r.leftFunctionDefsInMain.length && !r.notImported.length && !r.leaksIIFEName.length && !r.notExposed.length && !r.exposedUnused.length
    && !r.assignedNoSetter.length && !r.settersUnused.length && r.cellLines <= 800 && r.mainLinesAfter <= 800
    && r.runtime.sameApiKeysAndOrder && r.runtime.movedFunctionsAreKitFunctions && r.runtime.scopeGettersResolve && !r.runtime.lostWindowNames.length
    && r.runtime.newWindowNames.length === 1 && r.runtime.newWindowNames[0] === 'OurgoalTeamGoalsKit' && r.runtime.nodeRequireSameKeysAndOrder && r.runtime.nodeRequireSameFunctionKeys;
  ok = ok && r.ok;
  report.sources[S0.src] = r;
}
// 부품 3개의 '잔디' 글자(용어 헌법 — 원본 한 파일만 보는 검사의 범위 밖이라 따로 잰다)
report.cellsWithJandi = SOURCES.filter(S0 => read(path.join(APP, S0.cell)).includes('잔디')).map(S0 => S0.cell);
ok = ok && report.cellsWithJandi.length === 0;
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(T. 접두 제외) · 누수 0 · 미노출 0 · 남은 정의 0 · setter 짝 맞음 · 노출 API·window 이름 동일(+키트 1)' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-team-split-3.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
