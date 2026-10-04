'use strict';
// 위치: js/ 바로 아래(team-invite-comm.js 와 같은 자리). js/tabs/comm/ 에 두면 시험지 합본(APP_SRC·verify-all-clicks markupSrc)에 새로 들어가 기준 시험의 '없어야 한다' 단언(#TASK-ES-155 showToast( 금지)이 깨지고, js/team/ 에 두면 verify-all-clicks 핸들러 소스에서 빠진다 — js/ 바로 아래면 모든 시험의 읽는 범위가 이전과 같다.
// 팀 세포 쪼개기 1차 생성기(#TASK-ES-382): js/team-invite-comm.js(4,105줄 IIFE)의 책임 묶음 2개를 글자 그대로 js/team-recruit.js · js/team-share.js 로 옮긴다.
//   ① team-recruit.js — 팀 초대·영입 모달: openTeamInviteModal · openScoutToTeamModal
//   ② team-share.js   — 공유 카드 3대 버튼 + 피드 글 공유 모달: postShareCardToFeed · shareCardExternal · saveCardImage · openFeedShareModal
// 바꾸는 글자는 이름 참조뿐이다: 원본 IIFE 스코프 이름 → T.<이름>(원본이 getter 로 노출하는 통로), 다른 새 파일로 간 함수 → K.<이름>.
// IIFE 인자 global 은 새 파일도 같은 값(window)을 같은 이름으로 받으므로 그대로 둔다.
// 원본은 IIFE 맨 위에서 키트(OurgoalTeamCommKit)의 함수를 같은 이름으로 가져온다 — 내부 호출(820행 등)·노출 객체(OurgoalTeamInviteComm)는 그대로.
// 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-team-split.js <APP_DIR> [이전 전 js/team-invite-comm.js]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'js', 'team-invite-comm.js');
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n'); // 작업 트리는 core.autocrlf 로 CRLF, 저장소는 LF — LF 로 다룬다
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

const FILES = {
  recruit: 'js/team-recruit.js',
  share: 'js/team-share.js',
};
const DECL_FILE = {
  openTeamInviteModal: 'recruit', openScoutToTeamModal: 'recruit',
  postShareCardToFeed: 'share', shareCardExternal: 'share', saveCardImage: 'share', openFeedShareModal: 'share',
};
const MOVED_FN = Object.keys(DECL_FILE);
const MOVED = new Set(MOVED_FN);

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name)); // global
const top = iife.get('body').get('body');
const fnNode = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };
const S = n => n.loc.start.line, E = n => n.loc.end.line;

for (const n of MOVED_FN) {
  const b = iScope.getBinding(n);
  if (!b || b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
}

// 함수마다 바로 위의 섹션 머리 주석(/* ---- … ---- */)을 함께 옮긴다. 머리 주석이 없는 함수는 앞 함수와 붙어 있다(빈 줄 1).
const headOf = name => {
  const s = S(fnNode(name).node);
  const prev = lines[s - 2].trim();
  if (prev === '* ------------------------------------------------------------ */' || prev.endsWith('------ */')) {
    let i = s - 2; while (!lines[i - 1].trim().startsWith('/* ----')) i--; return i; // 1-based 시작 줄
  }
  return s;
};
// 옮기는 블록: [머리 주석 시작 ~ 함수 끝] 단위. 블록 사이 빈 줄은 원본 쪽 정리에서 처리.
const BLOCKS = [
  ['openTeamInviteModal'],
  ['postShareCardToFeed', 'shareCardExternal', 'saveCardImage'],
  ['openFeedShareModal'],
  ['openScoutToTeamModal'],
].map(names => ({ names, from: headOf(names[0]), to: E(fnNode(names[names.length - 1]).node), file: DECL_FILE[names[0]] }));
// 블록 안에 옮기는 함수 말고 다른 문이 끼어 있으면 멈춘다
for (const b of BLOCKS) {
  for (const s of top) {
    const l = S(s.node);
    if (l < b.from || l > b.to) continue;
    if (!(s.isFunctionDeclaration() && b.names.includes(s.node.id.name))) throw new Error('블록 안 예상 밖 문 ' + l + ': ' + lines[l - 1].trim().slice(0, 80));
  }
  // 블록 안 줄 중 함수 밖 줄은 주석·빈 줄뿐이어야 한다
  for (let l = b.from; l <= b.to; l++) {
    const inFn = b.names.some(n => l >= S(fnNode(n).node) && l <= E(fnNode(n).node));
    if (inFn) continue;
    const t = lines[l - 1].trim();
    if (t && !t.startsWith('/*') && !t.startsWith('*') && !t.startsWith('//')) throw new Error('블록 안 함수 밖 코드 줄 ' + l + ': ' + t);
  }
}
const fileOfLine = l => { for (const n of MOVED_FN) { const f = fnNode(n).node; if (l >= S(f) && l <= E(f)) return DECL_FILE[n]; } return null; };

const edits = [];
const bridged = new Map();
for (const n of MOVED_FN) {
  fnNode(n).traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return; // 옮기는 함수 자신의 이름
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      if (PARAMS.has(nm)) return; // global — 새 파일도 같은 인자
      const here = fileOfLine(S(p.node));
      if (!here) throw new Error('파일 미정 줄 ' + S(p.node));
      const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_FILE[nm] === here) return;
        if (asg) throw new Error('이전 함수에 대입: ' + nm);
        repl = 'K.' + nm;
      } else {
        if (asg) throw new Error('원본 스코프 변수에 대입(setter 필요): ' + nm);
        repl = 'T.' + nm;
        if (!bridged.has(nm)) bridged.set(nm, b.kind);
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
const NL = l => newLines[l - 1];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

const HEADER_BRIDGE = [
  "  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태(esc·showToast·ensureDefaultCompanions …)를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.",
  "  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).",
  '  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};',
  '  var T = K.scope = K.scope || {};',
];
const FOOT = names => [
  ...names.map(n => '  K.' + n + ' = ' + n + ';'),
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = K;',
  '  }',
  "})(typeof window !== 'undefined' ? window : globalThis);",
  '',
];
const blockLines = b => range(b.from, b.to);
const out = {};
const rec = BLOCKS.filter(b => b.file === 'recruit');
out[FILES.recruit] = [
  '/**',
  ' * OurGoal Community Cell: 팀 초대·영입 모달 (#TASK-ES-382 · 팀 세포 쪼개기 1차)',
  ' *',
  ' * js/team-invite-comm.js(이전 전 4,105줄)에서 "사람을 팀 목표로 데려오는" 두 모달을 동작 그대로 옮겼다.',
  ' *   openTeamInviteModal(gid, groupsPool) — 팀장이 팀 화면에서 동반자 원탭 초대·닉네임 검색 영입·외부 공유(이전 전 ' + rec[0].from + '~' + rec[0].to + '줄)',
  ' *   openScoutToTeamModal(targetUser)     — 피드에서 본 유저를 내가 이끄는 팀 목표로 영입(이전 전 ' + rec[1].from + '~' + rec[1].to + '줄)',
  ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.openTeamInviteModal / openScoutToTeamModal 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...rec.flatMap((b, i) => [...(i ? [''] : []), ...blockLines(b)]),
  '',
  ...FOOT(rec.flatMap(b => b.names)),
];
const sh = BLOCKS.filter(b => b.file === 'share');
out[FILES.share] = [
  '/**',
  ' * OurGoal Community Cell: 공유 — 외부 SNS 공유 카드 3대 버튼 + 피드 글 공유 모달 (#TASK-ES-382 · 팀 세포 쪼개기 1차)',
  ' *',
  ' * js/team-invite-comm.js(이전 전 4,105줄)에서 "기록·피드 글을 밖으로 내보내는" 코드를 동작 그대로 옮겼다.',
  ' *   postShareCardToFeed · shareCardExternal · saveCardImage — 공유 카드 피드 게시 / 외부 SNS 공유 / 이미지 저장(이전 전 ' + sh[0].from + '~' + sh[0].to + '줄)',
  ' *   openFeedShareModal(post) — 소통 피드 글을 동반자 DM·팀 채팅·외부로 공유하는 모달(이전 전 ' + sh[1].from + '~' + sh[1].to + '줄)',
  ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...sh.flatMap((b, i) => [...(i ? [''] : []), ...blockLines(b)]),
  '',
  ...FOOT(sh.flatMap(b => b.names)),
];

// 원본 새 판: 블록을 지우고(블록 뒤 빈 줄 1개도 함께), 그 자리에 한 줄 안내 주석을 남긴다
const removed = new Set();
const markerAt = new Map();
for (const b of BLOCKS) {
  for (let l = b.from; l <= b.to; l++) removed.add(l);
  if (lines[b.to] !== undefined && lines[b.to].trim() === '') removed.add(b.to + 1);
  markerAt.set(b.from, '  /* [#TASK-ES-382] ' + b.names.join(' · ') + ' → ' + FILES[b.file] + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */');
}
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markerAt.has(l)) mainOut.push(markerAt.get(l), '');
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
}
// IIFE 맨 위('use strict' 다음): ① 키트 가져오기 ② 스코프 통로 노출(스코프 분석으로 뽑은 이름만)
const usIdx = mainOut.findIndex(l => l.trim() === "'use strict';");
if (usIdx < 0 || usIdx > 12) throw new Error("'use strict' 위치 다름");
const bridgedSorted = [...bridged.keys()].sort();
const header = [
  '',
  '  /* ============ [#TASK-ES-382] 팀 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
  '     ① 가져오기: js/team-recruit.js · team-share.js 로 옮긴 함수를 이 스코프에서 같은 이름으로 부른다(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다).',
  '     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTeamCommKit.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */',
  '  var _teamKit = global.OurgoalTeamCommKit;',
  "  if(!_teamKit && typeof require === 'function'){ require('./team-recruit.js'); require('./team-share.js'); _teamKit = global.OurgoalTeamCommKit; }",
  '  _teamKit = _teamKit || {};',
  ...MOVED_FN.map(n => '  var ' + n + ' = _teamKit.' + n + ';'),
  '  Object.defineProperties(_teamKit.scope || (_teamKit.scope = {}), Object.getOwnPropertyDescriptors({',
  ...bridgedSorted.map((n, i) => '    get ' + n + '(){ return ' + n + '; }' + (i === bridgedSorted.length - 1 ? '' : ',')),
  '  }));',
];
mainOut.splice(usIdx + 1, 0, ...header);

// index.html: 원본 script 태그 바로 앞에 새 파일 2개(원본 태그·버전 글자는 그대로 — 시험이 고정)
const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const TAG = '<script src="js/team-invite-comm.js?v=20260916-es131"></script>';
if (html.split(TAG).length !== 2) throw new Error('원본 script 태그가 1개가 아님');
const NEW_TAGS = '<script src="js/team-recruit.js?v=20261005-es382"></script><script src="js/team-share.js?v=20261005-es382"></script>';
if (!html.includes(NEW_TAGS)) fs.writeFileSync(htmlPath, html.replace(TAG, NEW_TAGS + TAG), 'utf8');

fs.writeFileSync(path.join(APP, 'js', 'team-invite-comm.js'), mainOut.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { blocks: BLOCKS, bridged: bridgedSorted, edits: uniq.length, mainLines: mainOut.length - (mainOut[mainOut.length - 1] === '' ? 1 : 0) };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-team-split-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.join(','));
console.log('js/team-invite-comm.js', lines.length - 1, '->', mainOut.length - 1);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
