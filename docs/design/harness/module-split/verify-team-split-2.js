'use strict';
// 팀 세포 쪼개기 2차(#TASK-ES-387) 검사(verify-records.js 와 같은 기준):
//  ① 글자: 옮긴 함수마다 이전 전 js/team-invite-comm.js 의 토큰열과 옮긴 파일의 토큰열이 같은가(차이 허용: 'T.'·'K.' 접두뿐)
//  ② 누수: 옮긴 파일에 원본 IIFE 스코프 이름이 접두 없이 남아(전역으로 새어) 다른 값을 읽는 곳 0, T.<이름> 이 모두 노출됐는가,
//          옮긴 함수 정의가 원본에 남지 않았는가, 원본이 쓰는 옮긴 함수가 모두 가져와졌는가
//  ③ 실행: 브라우저와 같은 순서(1차 파일 2개 → 2차 파일 8개 → 원본)로 읽었을 때 OurgoalTeamInviteComm 의 키·옮긴 함수가 키트 함수와 같은 객체인가,
//          원본 이름 노출(window.*) 목록이 이전 전과 같은가, 옮긴 코드가 대입하는 상태 변수가 setter 로 원본 변수를 바꾸는가
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node verify-team-split-2.js <이전 전 앱(git archive)> <APP_DIR>
const fs = require('fs'), path = require('path'), vm = require('vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BASE = process.argv[2], APP = process.argv[3];
const ORIG = path.join(BASE, 'js', 'team-invite-comm.js');
const FIRST = ['js/team-recruit.js', 'js/team-share.js'];
const FIRST_FNS = ['openTeamInviteModal', 'openScoutToTeamModal', 'postShareCardToFeed', 'shareCardExternal', 'saveCardImage', 'openFeedShareModal'];
const MOVED = {
  'js/team-chat.js': ['openTeamChatModal', 'handlePingSentAutoReply'],
  'js/team-templates.js': ['openTemplatePreviewModal', 'openRecommendTemplateModal', 'renderTemplatesAccordionHtml', 'wireTemplatesAccordionEvents'],
  'js/team-dm-inbox.js': ['getDmReadMap', 'markDmRoomRead', 'markDmThreadAsRead', 'updateDmUnreadBadge', 'getDmUnreadStatus', 'loadIncomingDmRooms', 'initIncomingDmListener', 'startSmartDmPolling'],
  'js/team-dm-room.js': ['formatDmTime', 'formatDmDetailTime', 'toggleDmMsgDetail', 'renderSingleDmMsg', 'loadDmMessagesFromDb', 'subscribeRealtimeDm', 'renderCommDM'],
  'js/team-profile.js': ['openUserProfileModal', 'copyCompanionInviteLink'],
  'js/team-companion-search.js': ['renderCommTopInviteSearch'],
  'js/team-companions.js': ['renderCommCompanions'],
  'js/team-auto-actions.js': ['handle팀목표_Item25Action', 'handle소통_Item28Action', 'handle소통_Item30Action', 'handle팀목표_Item37Action', 'handle팀목표_Item39Action'],
};
const MAIN = 'js/team-invite-comm.js';
const ALL = [].concat(...Object.values(MOVED));
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
// 옮기기와 같은 PR 의 의도한 수정(별도 지시 항목 R): 이전 전 글자에 같은 수정을 적용한 뒤 비교한다. 이 목록 밖의 차이는 실패다.
const PATCHES = []; // 2차는 옮기기만 — 의도한 수정 0
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
const exposed = new Set(); const setters = new Set(); const imported = new Set();
iife.traverse({
  ObjectMethod(p) { if (p.node.kind === 'set') setters.add(p.node.key.name); if (p.node.kind === 'get' && p.parentPath.parentPath.isCallExpression() && p.parentPath.parentPath.node.callee.type === 'MemberExpression' && p.parentPath.parentPath.node.callee.property.name === 'getOwnPropertyDescriptors') exposed.add(p.node.key.name); },
  VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_teamKit' && !i.computed) imported.add(p.node.id.name); }
});
const leftDefs = ALL.filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
const notImported = ALL.filter(n => !imported.has(n));
const files = {}; const usedT = new Set(); const usedK = new Set(); const assignedT = new Set();
for (const f of [...FIRST, ...Object.keys(MOVED)]) { // 1차 파일도 통로를 쓰므로 함께 센다
  const fa = parser.parse(read(path.join(APP, f)), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'T') { usedT.add(p.node.name); const gp = p.parentPath.parentPath; if ((gp.isAssignmentExpression() && gp.node.left === par) || gp.isUpdateExpression()) assignedT.add(p.node.name); }
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
const kNotDefined = [...usedK].filter(n => !ALL.includes(n) && !FIRST_FNS.includes(n));
const assignedNoSetter = [...assignedT].filter(n => !setters.has(n)).sort();
const settersUnused = [...setters].filter(n => !assignedT.has(n)).sort();
// ③ 실행(브라우저와 같은 순서)
const mkWin = () => { const w = { console: { log() {}, warn() {}, error() {} } }; w.window = w; return w; };
const run = (w, rels, base) => { const ctx = vm.createContext(w); for (const r of rels) vm.runInContext(read(path.join(base, r)), ctx, { filename: r }); return w; };
const before = run(mkWin(), [...FIRST, MAIN], BASE);
const after = run(mkWin(), [...FIRST, ...Object.keys(MOVED), MAIN], APP);
// setter 왕복: 키트 통로로 쓴 값이 원본 변수에 들어가고(원본 함수가 읽는 값), 다시 읽힌다
const setterRoundTrip = [...setters].every(n => { const sc = after.OurgoalTeamCommKit.scope; const old = sc[n]; const probe = { probe: n }; sc[n] = probe; const ok = sc[n] === probe; sc[n] = old; return ok && sc[n] === old; });
const keys = o => Object.keys(o).filter(k => k !== 'window' && k !== 'console').sort();
const apiB = Object.keys(before.OurgoalTeamInviteComm), apiA = Object.keys(after.OurgoalTeamInviteComm);
const sameApi = JSON.stringify(apiB) === JSON.stringify(apiA);
const kitFns = [...ALL, ...FIRST_FNS];
const movedSame = kitFns.every(n => typeof after.OurgoalTeamCommKit[n] === 'function') && kitFns.every(n => !(n in after.OurgoalTeamInviteComm) || after.OurgoalTeamInviteComm[n] === after.OurgoalTeamCommKit[n]) && kitFns.every(n => !(n in after) || after[n] === after.OurgoalTeamCommKit[n]);
const apiKitKeys = kitFns.filter(n => n in after.OurgoalTeamInviteComm).length, windowKitNames = kitFns.filter(n => n in after);
const globalsB = keys(before), globalsA = keys(after);
const sameGlobals = JSON.stringify(globalsB) === JSON.stringify(globalsA);
const scopeOk = [...exposed].every(n => Object.prototype.hasOwnProperty.call(after.OurgoalTeamCommKit.scope, n));
const report = {
  patchesApplied: PATCHES.map(p => p.fn + ': ' + p.why),
  equivalent: equiv.every(r => r.same), equiv, exposed: [...exposed].sort(), imported: [...imported].sort(), notImported, leftFunctionDefsInMain: leftDefs, files,
  usedT: [...usedT].sort(), notExposed, exposedUnused, setters: [...setters].sort(), assignedT: [...assignedT].sort(), assignedNoSetter, settersUnused, usedK: [...usedK].sort(), kNotDefined,
  runtime: { apiKeys: apiA.length, sameApiKeysAndOrder: sameApi, movedFunctionsAreKitFunctions: movedSame, apiKeysThatAreKitFunctions: apiKitKeys, windowNamesThatAreKitFunctions: windowKitNames, windowNamesBefore: globalsB.length, sameWindowNamesExceptKit: sameGlobals, newWindowNames: keys(after).filter(k => !globalsB.includes(k)), scopeGettersResolve: scopeOk, setterRoundTrip },
};
const ok = report.equivalent && leftDefs.length === 0 && notImported.length === 0 && notExposed.length === 0 && exposedUnused.length === 0 && kNotDefined.length === 0 && assignedNoSetter.length === 0 && settersUnused.length === 0 && setterRoundTrip
  && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800) && sameApi && movedSame && sameGlobals && scopeOk;
report.ok = ok;
console.log(JSON.stringify(report, null, 1));
console.log(ok ? 'OK: 토큰 동일(T./K. 접두 제외) · 누수 0 · 미노출 0 · 남은 정의 0 · setter 짝 맞음 · 노출 API·window 이름 동일' : 'FAIL');
if (process.env.MODULE_SPLIT_OUT) fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT, 'verify-team-split-2.json'), JSON.stringify(report, null, 1));
process.exitCode = ok ? 0 : 1;
