'use strict';
// 팀 세포 쪼개기 1차(#TASK-ES-382) 검사(verify-records.js 와 같은 기준):
//  ① 글자: 옮긴 함수마다 이전 전 js/team-invite-comm.js 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'T.'·'K.' 접두뿐)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, T.<이름> 이 모두 노출됐는가,
//          옮긴 함수 정의가 원본에 남지 않았는가, 원본이 쓰는 옮긴 함수가 모두 가져와졌는가
//  ③ 실행: 브라우저와 같은 순서(새 파일 2개 → 원본)로 읽었을 때 OurgoalTeamInviteComm 의 키·옮긴 함수가 키트 함수와 같은 객체인가,
//          원본 이름 노출(window.*) 목록이 이전 전과 같은가
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-team-split.js <이전 전 js/team-invite-comm.js> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ORIG = process.argv[2], APP = process.argv[3];
const MOVED = {
  'js/team-recruit.js': ['openTeamInviteModal', 'openScoutToTeamModal'],
  'js/team-share.js': ['postShareCardToFeed', 'shareCardExternal', 'saveCardImage', 'openFeedShareModal'],
};
const MAIN = 'js/team-invite-comm.js';
const ALL = [].concat(...Object.values(MOVED));
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
// 옮기기와 같은 PR 의 의도한 수정(별도 지시 항목 R): 이전 전 글자에 같은 수정을 적용한 뒤 비교한다. 이 목록 밖의 차이는 실패다.
const PATCHES = [
  { fn: 'openFeedShareModal', from: "var threadId = [myId, peerId].sort().join('_');", to: 'var threadId = getDmThreadId(myId, peerId);', why: '#TASK-ES-382 R 피드 공유 DM 대화방 id 를 getDmThreadId 로' },
];
const readOrig = f => { let t = read(f); for (const p of PATCHES) { if (t.split(p.from).length !== 2) throw new Error('수정 전 글자 1곳 아님: ' + p.from); t = t.replace(p.from, p.to); } return t; };
const norm = toks => {
  toks = toks.filter(t => t.type !== 'CommentLine' && t.type !== 'CommentBlock');
  const vals = toks.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i] === 'T' || vals[i] === 'K') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
const iifeBody = a => a.program.body[0].expression.callee.body.body;
const topFns = a => { const m = {}; for (const x of iifeBody(a)) if (x.type === 'FunctionDeclaration') m[x.id.name] = x; return m; };
// ① 글자
const oast = parser.parse(readOrig(ORIG), { sourceType: 'script', tokens: true });
const ofns = topFns(oast);
const equiv = [];
for (const [f, names] of Object.entries(MOVED)) {
  const fast = parser.parse(read(path.join(APP, f)), { sourceType: 'script', tokens: true });
  const nfns = topFns(fast);
  for (const n of names) {
    const a = norm(oast.tokens.filter(t => t.start >= ofns[n].start && t.end <= ofns[n].end));
    const b = norm(fast.tokens.filter(t => t.start >= nfns[n].start && t.end <= nfns[n].end));
    const same = a.length === b.length && a.every((v, i) => v === b[i]);
    let at = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    equiv.push({ fn: n, file: f, tokensOrig: a.length, tokensNew: b.length, same, firstDiff: same ? null : { i: at, orig: a.slice(at - 3, at + 5), neu: b.slice(at - 3, at + 5) } });
  }
}
// ② 누수
const mast = parser.parse(read(path.join(APP, MAIN)), { sourceType: 'script' });
let iife; traverse(mast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
const exposed = new Set(); const imported = new Set();
iife.traverse({
  ObjectMethod(p) { if (p.node.kind === 'get' && p.parentPath.parentPath.isCallExpression() && p.parentPath.parentPath.node.callee.type === 'MemberExpression' && p.parentPath.parentPath.node.callee.property.name === 'getOwnPropertyDescriptors') exposed.add(p.node.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_teamKit' && !i.computed) imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
const notImported = ALL.filter(n => !imported.has(n));
const files = {}; const usedT = new Set(); const usedK = new Set();
for (const f of Object.keys(MOVED)) {
  const fa = parser.parse(read(path.join(APP, f)), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'T') usedT.add(p.node.name);
        if (par.object.type === 'Identifier' && par.object.name === 'K' && !p.parentPath.parentPath.isAssignmentExpression()) usedK.add(p.node.name);
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
  const lines = read(path.join(APP, f)).split('\n').length;
  files[f] = { lines, globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
usedK.delete('scope');
const notExposed = [...usedT].filter(n => !exposed.has(n)).sort();
const exposedUnused = [...exposed].filter(n => !usedT.has(n)).sort();
const kNotDefined = [...usedK].filter(n => !ALL.includes(n));
// ③ 실행(브라우저와 같은 순서)
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); return w; };
const before = run(mkWin(), [MAIN], path.dirname(path.dirname(ORIG)));
const after = run(mkWin(), ['js/team-recruit.js', 'js/team-share.js', MAIN], APP);
const keys = o => Object.keys(o).filter(k => k !== 'window' && k !== 'console').sort();
const apiB = Object.keys(before.OurgoalTeamInviteComm), apiA = Object.keys(after.OurgoalTeamInviteComm);
const sameApi = JSON.stringify(apiB) === JSON.stringify(apiA);
const movedSame = ALL.every(n => typeof after.OurgoalTeamInviteComm[n] === 'function' && after.OurgoalTeamInviteComm[n] === after.OurgoalTeamCommKit[n]);
const globalsB = keys(before), globalsA = keys(after).filter(k => k !== 'OurgoalTeamCommKit');
const sameGlobals = JSON.stringify(globalsB) === JSON.stringify(globalsA);
const scopeOk = [...exposed].every(n => after.OurgoalTeamCommKit.scope[n] !== undefined);
const report = {
  patchesApplied: PATCHES.map(p => p.fn + ': ' + p.why),
  equivalent: equiv.every(r => r.same), equiv, exposed: [...exposed].sort(), imported: [...imported].sort(), notImported, leftFunctionDefsInMain: leftDefs, files,
  usedT: [...usedT].sort(), notExposed, exposedUnused, usedK: [...usedK].sort(), kNotDefined,
  runtime: { apiKeys: apiA.length, sameApiKeysAndOrder: sameApi, movedFunctionsAreKitFunctions: movedSame, windowNamesBefore: globalsB.length, sameWindowNamesExceptKit: sameGlobals, newWindowNames: keys(after).filter(k => !globalsB.includes(k)), scopeGettersResolve: scopeOk },
};
const ok = report.equivalent && leftDefs.length === 0 && notImported.length === 0 && notExposed.length === 0 && exposedUnused.length === 0 && kNotDefined.length === 0
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800) && sameApi && movedSame && sameGlobals && scopeOk;
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(T./K. 접두 제외) · 누수 0 · 미노출 0 · 남은 정의 0 · 노출 API·window 이름 동일' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-team-split.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
