'use strict';
// 팀 세포 쪼개기 2차 생성기(#TASK-ES-387): js/team-invite-comm.js(1차 뒤 3,276줄 IIFE)에 남은 책임 묶음 8개를 글자 그대로 js/team-*.js 로 옮긴다.
// 1차 생성기(gen-team-split.js)와 같은 꼴이다 — 바꾸는 글자는 이름 참조뿐:
//   원본 IIFE 스코프에 남는 이름 → T.<이름>(원본이 OurgoalTeamCommKit.scope 에 getter 로 노출하는 통로. 옮긴 코드가 대입하는 이름은 setter 도 둔다)
//   다른 새 파일로 간 함수·1차에 옮긴 함수 → K.<이름>(팀 세포 키트)
// 상태 변수(var)는 모두 원본에 남긴다 — 원본을 다시 읽으면(시험의 require 캐시 비우기) 상태가 새로 시작되는 동작이 그대로다.
// 원본 머리 이음매는 옮긴 함수를 같은 이름으로 가져온다(var X = _teamKit.X — 이 줄보다 먼저 도는 문이 없어 함수 선언 끌어올림과 같은 효과).
// 위치: js/ 바로 아래(1차와 같은 이유 — js/tabs/comm 은 #TASK-ES-155 단언, js/team/ 은 verify-all-clicks 범위). 시험지는 #TASK-ES-388 팀 합본을 읽는다.
// 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-team-split-2.js <APP_DIR> [이전 전 js/team-invite-comm.js]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'js', 'team-invite-comm.js');
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

// 파일 → [역할 한 줄, 옮길 함수들]
const CELLS = {
  'js/team-chat.js': ['팀 톡방 — 팀 목표 팀원 대화 모달·찌르기 뒤 자동 답장', ['openTeamChatModal', 'handlePingSentAutoReply']],
  'js/team-templates.js': ['추천 템플릿 — 둘러보기 미리보기 모달·동반자 추천 모달·아코디언 렌더·이벤트', ['openTemplatePreviewModal', 'openRecommendTemplateModal', 'renderTemplatesAccordionHtml', 'wireTemplatesAccordionEvents']],
  'js/team-dm-inbox.js': ['DM 수신함 — 읽음 표시·안읽음 배지·받은 대화방 목록·수신 실시간 구독·30초 스마트 폴링', ['getDmReadMap', 'markDmRoomRead', 'markDmThreadAsRead', 'updateDmUnreadBadge', 'getDmUnreadStatus', 'loadIncomingDmRooms', 'initIncomingDmListener', 'startSmartDmPolling']],
  'js/team-dm-room.js': ['DM 대화방 — 시각 표기·메시지 상세·메시지 렌더·DB 로드·실시간 구독·DM 화면(renderCommDM)', ['formatDmTime', 'formatDmDetailTime', 'toggleDmMsgDetail', 'renderSingleDmMsg', 'loadDmMessagesFromDb', 'subscribeRealtimeDm', 'renderCommDM']],
  'js/team-profile.js': ['프로필 모달·동반자 초대 링크 — openUserProfileModal·copyCompanionInviteLink', ['openUserProfileModal', 'copyCompanionInviteLink']],
  'js/team-companion-search.js': ['소통 탭 상단 초대 링크·닉네임 검색 바 — renderCommTopInviteSearch', ['renderCommTopInviteSearch']],
  'js/team-companions.js': ['동반자 탭 화면 — renderCommCompanions', ['renderCommCompanions']],
  'js/team-auto-actions.js': ['자동 생성 직통 핸들러 5개(소통·팀목표 Item25·28·30·37·39)', ['handle팀목표_Item25Action', 'handle소통_Item28Action', 'handle소통_Item30Action', 'handle팀목표_Item37Action', 'handle팀목표_Item39Action']],
};
const FILE_OF = {};
for (const [f, [, names]] of Object.entries(CELLS)) for (const n of names) FILE_OF[n] = f;
const MOVED_FN = Object.keys(FILE_OF);
const MOVED = new Set(MOVED_FN);

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name)); // global
const top = iife.get('body').get('body');
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const fnStmt = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };

// 1차에 옮겨 키트에서 가져온 이름(var X = _teamKit.X)
const KIT_IMPORTED = new Set();
for (const s of top) if (s.isVariableDeclaration()) for (const d of s.node.declarations) {
  const i = d.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === '_teamKit' && !i.computed) KIT_IMPORTED.add(d.id.name);
}
for (const n of MOVED_FN) {
  const b = iScope.getBinding(n);
  if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님: ' + n);
  if (b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
}

// 블록: 같은 파일로 가는 함수가 사이에 다른 문 없이 이어진 묶음. 첫 함수 바로 위(빈 줄 없이 붙은) 주석 줄을 함께 옮긴다.
const isCommentLine = t => t.startsWith('/*') || t.startsWith('*') || t.startsWith('//');
const BLOCKS = [];
let cur = null;
for (const s of top) {
  const nm = s.isFunctionDeclaration() ? s.node.id.name : null;
  const f = nm && MOVED.has(nm) ? FILE_OF[nm] : null;
  if (f && cur && cur.file === f) { cur.names.push(nm); cur.to = E(s.node); continue; }
  if (cur) { BLOCKS.push(cur); cur = null; }
  if (f) {
    let from = S(s.node);
    while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim())) from--;
    cur = { file: f, names: [nm], from, to: E(s.node) };
  }
}
if (cur) BLOCKS.push(cur);
// 블록 안 줄 중 옮기는 함수 밖 줄은 주석·빈 줄뿐이어야 한다
for (const b of BLOCKS) for (let l = b.from; l <= b.to; l++) {
  if (b.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
  const t = lines[l - 1].trim();
  if (t && !isCommentLine(t)) throw new Error('블록 안 함수 밖 코드 줄 ' + l + ': ' + t);
}
// 블록 주석이 다른 블록·이전 표시 주석과 겹치지 않는가
for (const b of BLOCKS) for (let l = b.from; l <= b.to; l++) if (/\[#TASK-ES-382\]/.test(lines[l - 1])) throw new Error('1차 이전 표시 주석을 블록이 삼킴 ' + l);

const fileOfLine = l => { for (const n of MOVED_FN) { const f = fnStmt(n).node; if (l >= S(f) && l <= E(f)) return FILE_OF[n]; } return null; };
const edits = [];
const bridged = new Map(); // 이름 → { set: bool }
for (const n of MOVED_FN) {
  fnStmt(n).traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      if (PARAMS.has(nm)) return;
      const here = fileOfLine(S(p.node));
      if (!here) throw new Error('파일 미정 줄 ' + S(p.node));
      const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm) || KIT_IMPORTED.has(nm)) {
        if (MOVED.has(nm) && FILE_OF[nm] === here) return;
        if (asg) throw new Error('키트 함수에 대입: ' + nm);
        repl = 'K.' + nm;
      } else {
        if (p.parentPath.isAssignmentExpression() && par.left === p.node && par.operator !== '=' && false) throw new Error('unreachable');
        repl = 'T.' + nm;
        const e = bridged.get(nm) || { set: false };
        if (asg) e.set = true;
        bridged.set(nm, e);
      }
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': ' + repl }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: repl });
    }
  });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== lines.length) throw new Error('줄 수가 바뀜');
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(newLines[l - 1]); return o; };

const HEADER_BRIDGE = [
  "  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.",
  "  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).",
  '  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};',
  '  var T = K.scope = K.scope || {};',
];
const out = {};
for (const [f, [role, names]] of Object.entries(CELLS)) {
  const bl = BLOCKS.filter(b => b.file === f);
  const got = bl.flatMap(b => b.names);
  if (JSON.stringify(got.slice().sort()) !== JSON.stringify(names.slice().sort())) throw new Error('블록 함수 목록 다름 ' + f + ': ' + got.join(','));
  out[f] = [
    '/**',
    ' * OurGoal Community Cell: ' + role + ' (#TASK-ES-387 · 팀 세포 쪼개기 2차)',
    ' *',
    ' * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 ' + bl.map(b => b.from + '~' + b.to).join(', ') + '줄).',
    ' *   ' + names.join(' · '),
    ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    ...HEADER_BRIDGE,
    '',
    ...bl.flatMap((b, i) => [...(i ? [''] : []), ...range(b.from, b.to)]),
    '',
    ...names.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
}

// 원본 새 판: 블록을 지우고(블록 뒤 빈 줄 1개도 함께) 그 자리에 한 줄 안내 주석
const removed = new Set();
const markerAt = new Map();
for (const b of BLOCKS) {
  for (let l = b.from; l <= b.to; l++) removed.add(l);
  if (lines[b.to] !== undefined && lines[b.to].trim() === '') removed.add(b.to + 1);
  markerAt.set(b.from, '  /* [#TASK-ES-387] ' + b.names.join(' · ') + ' → ' + b.file + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */');
}
let mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markerAt.has(l)) mainOut.push(markerAt.get(l), '');
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
}
// 머리 이음매 고치기: ① require 줄에 새 파일 ② 가져오기 줄 추가 ③ 스코프 통로 다시 쓰기(1차 이름 + 이번 이름, setter 포함)
const REQ_OLD = "  if(!_teamKit && typeof require === 'function'){ require('./team-recruit.js'); require('./team-share.js'); _teamKit = global.OurgoalTeamCommKit; }";
const ri = mainOut.indexOf(REQ_OLD);
if (ri < 0) throw new Error('require 이음매 줄 없음');
const NEW_FILES = Object.keys(CELLS);
mainOut[ri] = "  if(!_teamKit && typeof require === 'function'){ require('./team-recruit.js'); require('./team-share.js'); " + NEW_FILES.map(f => "require('./" + path.basename(f) + "');").join(' ') + ' _teamKit = global.OurgoalTeamCommKit; }';
const lastImport = mainOut.findIndex(l => l === '  var openFeedShareModal = _teamKit.openFeedShareModal;');
if (lastImport < 0) throw new Error('1차 가져오기 줄 없음');
mainOut.splice(lastImport + 1, 0, '  /* [#TASK-ES-387] 2차로 옮긴 함수 — ' + NEW_FILES.map(f => path.basename(f)).join(' · ') + ' */', ...MOVED_FN.map(n => '  var ' + n + ' = _teamKit.' + n + ';'));
const dpStart = mainOut.findIndex(l => l.startsWith('  Object.defineProperties(_teamKit.scope || (_teamKit.scope = {}), Object.getOwnPropertyDescriptors({'));
const dpEnd = mainOut.findIndex((l, i) => i > dpStart && l === '  }));');
if (dpStart < 0 || dpEnd < 0) throw new Error('스코프 통로 블록 없음');
const oldGetters = mainOut.slice(dpStart + 1, dpEnd).map(l => { const m = /^\s*get (\w+)\(\)\{ return \1; \},?$/.exec(l); if (!m) throw new Error('통로 줄 꼴 다름: ' + l); return m[1]; });
for (const n of oldGetters) if (!bridged.has(n)) bridged.set(n, { set: false });
const bridgedSorted = [...bridged.keys()].sort();
const scopeLines = [];
bridgedSorted.forEach(n => { scopeLines.push('    get ' + n + '(){ return ' + n + '; }'); if (bridged.get(n).set) scopeLines.push('    set ' + n + '(v){ ' + n + ' = v; }'); });
mainOut.splice(dpStart + 1, dpEnd - dpStart - 1, ...scopeLines.map((l, i) => l + (i === scopeLines.length - 1 ? '' : ',')));
// 이음매 설명 주석의 ① 줄에 새 파일 이름
const c1 = mainOut.findIndex(l => l.startsWith('     ① 가져오기: js/team-recruit.js · team-share.js 로 옮긴 함수'));
if (c1 < 0) throw new Error('이음매 설명 주석 없음');
mainOut[c1] = mainOut[c1].replace('js/team-recruit.js · team-share.js 로', 'js/team-recruit.js · team-share.js(1차) · ' + NEW_FILES.map(f => path.basename(f)).join(' · ') + '(2차, #TASK-ES-387) 로');
const c2 = mainOut.findIndex(l => l.startsWith('     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만'));
if (c2 < 0) throw new Error('이음매 설명 주석 ② 없음');
mainOut[c2] = mainOut[c2].replace('getter 로 노출한다', 'getter 로 노출한다(옮긴 코드가 대입하는 상태 변수는 setter 도 — 상태는 이 스코프에 남는다)');

// index.html: 1차 태그 뒤, 원본 태그 앞에 새 파일들
const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const TAG = '<script src="js/team-share.js?v=20261005-es382"></script><script src="js/team-invite-comm.js?v=20260916-es131"></script>';
if (html.split(TAG).length !== 2) throw new Error('1차 태그·원본 태그 자리가 1곳이 아님');
const NEW_TAGS = NEW_FILES.map(f => '<script src="' + f + '?v=20261005-es387"></script>').join('');
if (!html.includes(NEW_TAGS)) fs.writeFileSync(htmlPath, html.replace(TAG, TAG.replace('<script src="js/team-invite-comm.js', NEW_TAGS + '<script src="js/team-invite-comm.js')), 'utf8');

fs.writeFileSync(path.join(APP, 'js', 'team-invite-comm.js'), mainOut.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { blocks: BLOCKS, bridged: bridgedSorted.map(n => n + (bridged.get(n).set ? ' (get/set)' : '')), edits: uniq.length, mainLines: mainOut.length - 1 };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-team-split-2-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', meta.bridged.join(','));
console.log('js/team-invite-comm.js', lines.length - 1, '->', mainOut.length - 1);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
