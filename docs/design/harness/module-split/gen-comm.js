'use strict';
// 소통 탭 이전 1차 생성기(#TASK-ES-379): index.html 인라인 IIFE 의 소통 탭 두 묶음을 글자 그대로 js/tabs/comm/*.js 로 옮긴다.
//   화면 조립: renderCommScreen(소통 탭 메인 렌더 — 요약 카드 숫자·서브탭 칩·서브탭 분기) + 그것만 부르는 위임 두 개(renderCommDM·renderCommCompanions) → js/tabs/comm/render.js
//   피드 댓글·리액션 헬퍼(SERVER_FEED_COMMENTS_CACHE·loadServerFeedComments·getFeedComments·setFeedComments·handleUserCommentSubmit·toggleFeedReaction) → js/tabs/comm/feed-comments.js
// 목표 탭 2차 생성기(gen-goals-2.js, #TASK-ES-375)와 같은 틀이다(함수 통째로 옮김, 구간 분할 없음 — 모두 800줄 이하).
// 더한 것 두 가지: ① 부작용 없는 빈 객체 var 한 줄(SERVER_FEED_COMMENTS_CACHE = {} — 옮기는 함수만 씀)도 같이 옮긴다
//                  ② 같은 파일로 가는 이웃 함수 사이가 빈 줄뿐이면 한 덩어리로 보고 표지 주석 한 줄로 바꾼다.
// 시험지가 index.html 에서 글자로 잘라 가는 함수(tests/guest-null-client-es377.test.js 의 setupFeedPostsRealtime·ensureFeedPostsLoaded)와
// smoke-test FN_NAMES 의 함수는 옮기지 않는다(MODULE-SPLIT-PROTOCOL 1절 (라)).
// 피드 화면 renderCommFeed 도 이번에는 옮기지 않는다: tests/core-confirm-es376.test.js 가 index.html 한 파일에서 「피드 게시물 신고」 확인창 줄을 정확히 1곳 센다
// (법정은 기준 커밋 시험지로 채점 — 옮기면 0곳이 되어 실패). 시험지를 합본 읽기로 고치는 선행 PR(제품 0·기대값 0)이 병합된 뒤 옮긴다. 구획 주석은 index.html 에 남긴다(그 구획에 남는 함수가 있다).
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 다른 소통 파일로 간 이전 함수는 K.<이름>(소통 키트 OurgoalCommKit).
// 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-comm.js <APP_DIR> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'index.html');
const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
}
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

const FILES = {
  render: 'js/tabs/comm/render.js',
  comments: 'js/tabs/comm/feed-comments.js',
};
// 옮기는 최상위 선언 → 파일. 파일 안 순서 = index.html 원래 순서.
const DECL_FILE = {
  renderCommScreen: 'render',
  SERVER_FEED_COMMENTS_CACHE: 'comments', loadServerFeedComments: 'comments', getFeedComments: 'comments',
  setFeedComments: 'comments', handleUserCommentSubmit: 'comments', toggleFeedReaction: 'comments',
  renderCommDM: 'render', renderCommCompanions: 'render',
};
const MOVED_NAMES = Object.keys(DECL_FILE);
const MOVED = new Set(MOVED_NAMES);
// 옮기는 var(부작용 없는 빈 객체 초기화만 허용)
const MOVED_VARS = new Set(['SERVER_FEED_COMMENTS_CACHE']);
// 함수 바로 위에 있지만 index.html 에 남기는 구획 주석(그 구획에 남는 것이 더 있다)
const KEEP_COMMENT = {
  SERVER_FEED_COMMENTS_CACHE: '/* ============ 피드 상호소통 댓글 & 리액션 헬퍼 (#TASK-ES-133 서버 DB 실시간 동기화) ============ */', // feedPostHtml(쓰는 곳 0)이 이 구획에 남는다
  renderCommDM: '/* ============ DM & 동반자 소통 시스템 (TASK-ES-105) ============ */', // 이 구획의 openUserProfileModal(피드 화면만 씀)은 index.html 에 남는다
};
// 시험지가 index.html 에서 글자로 잘라 가는 함수 — 옮기면 법정(기준 커밋 시험지)이 죽는다
const TEST_SLICED = ['setupFeedPostsRealtime', 'ensureFeedPostsLoaded', 'renderCommFeed'];

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const declOf = name => {
  const f = top.find(s => (s.isFunctionDeclaration() && s.node.id.name === name)
    || (s.isVariableDeclaration() && s.node.declarations.length === 1 && s.node.declarations[0].id.name === name));
  if (!f) throw new Error('선언 없음 ' + name);
  return f;
};
for (const n of TEST_SLICED) if (MOVED.has(n)) throw new Error('시험지가 잘라 가는 함수를 옮기려 함: ' + n);
{
  const smoke = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8');
  const m = smoke.match(/const FN_NAMES = \[([\s\S]*?)\];/);
  if (!m) throw new Error('smoke-test FN_NAMES 못 읽음');
  for (const n of MOVED_NAMES) if (new RegExp("'" + n + "'").test(m[1])) throw new Error('smoke-test FN_NAMES 함수를 옮기려 함: ' + n);
}

// 재대입·중복 선언 검사
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  if (!b) throw new Error('바인딩 없음 ' + n);
  if (b.constantViolations.length) throw new Error('이전 이름 재대입/중복 선언: ' + n);
  if (MOVED_VARS.has(n)) {
    const d = declOf(n).node.declarations[0];
    if (!d.init || d.init.type !== 'ObjectExpression' || d.init.properties.length) throw new Error('옮기는 var 초기값이 빈 객체가 아님: ' + n);
  } else if (!b.path.isFunctionDeclaration()) throw new Error('함수 선언이 아님: ' + n);
}
const movedNodes = MOVED_NAMES.map(n => declOf(n));
const inMoved = l => movedNodes.some(p => l >= H(p.node) && l <= HE(p.node));
// 옮긴 코드 밖에서 부르는 이름 = index.html 이 IIFE 머리에서 가져와야 하는 이름(스코프 분석으로 정한다)
const IMPORTS = [];
const outsideRefs = {};
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !inMoved(H(r.node)));
  if (outs.length) {
    if (MOVED_VARS.has(n)) throw new Error('옮기는 var 를 옮긴 코드 밖에서 씀: ' + n);
    IMPORTS.push(n); outsideRefs[n] = outs.map(r => H(r.node));
  }
}
// 옮기는 var 는 같은 파일 안에서만 쓰여야 한다(다른 파일에서 K. 로 읽으면 값 공유는 되지만 이번 틀에서는 막는다)
for (const n of MOVED_VARS) for (const r of iScope.getBinding(n).referencePaths) {
  const f = movedNodes.find(p => H(r.node) >= H(p.node) && H(r.node) <= HE(p.node));
  const owner = f.isFunctionDeclaration() ? f.node.id.name : f.node.declarations[0].id.name;
  if (DECL_FILE[owner] !== DECL_FILE[n]) throw new Error('옮기는 var 를 다른 파일 함수가 씀: ' + n + ' ← ' + owner);
}
// 옮기는 선언 바로 위 줄 검사(구획 주석은 남긴다, 그 밖의 설명 주석이 바로 위에 있으면 멈춘다)
for (const n of MOVED_NAMES) {
  const t = lines[H(declOf(n).node) - 2].trim();
  if (KEEP_COMMENT[n]) { if (t !== KEEP_COMMENT[n]) throw new Error('함수 위 구획 주석이 예상과 다름: ' + n + ' ' + t); continue; }
  if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) throw new Error('함수 위 설명 주석 처리 필요: ' + n + ' ' + t);
}
// 끝 줄 뒤에 같은 줄 코드가 붙어 있지 않은지(예: `} window.x = x;`) — 줄 단위로 옮기므로
for (const n of MOVED_NAMES) {
  const node = declOf(n).node;
  const lastLine = lines[HE(node) - 1];
  const tail = lastLine.slice(node.loc.end.column).trim();
  if (tail && !tail.startsWith('//')) throw new Error('끝 줄 뒤에 다른 코드: ' + n + ' ' + tail);
  if (lines[H(node) - 1].slice(0, node.loc.start.column).trim()) throw new Error('첫 줄 앞에 다른 코드: ' + n);
}

const fileOfLine = l => {
  for (const n of MOVED_NAMES) {
    const f = declOf(n).node;
    if (l >= H(f) && l <= HE(f)) return DECL_FILE[n];
  }
  return null;
};

// 바꿔 쓸 식별자
const edits = [];
const bridged = new Map();
for (const n of MOVED_NAMES) {
  declOf(n).traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = fileOfLine(H(p.node));
      if (!here) throw new Error('파일 미정 줄 ' + H(p.node));
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_FILE[nm] === here) return;
        if (isWrite) throw new Error('이전 이름에 대입: ' + nm);
        repl = 'K.' + nm;
      } else {
        repl = 'L.' + nm;
        if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
        if (isWrite) bridged.get(nm).assigned = true;
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
if (newLines.length !== code.split('\n').length) throw new Error('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };
const spanOf = n => [H(declOf(n).node), HE(declOf(n).node)];
const declRange = n => range(...spanOf(n));
const lbl = n => H(declOf(n).node) + '~' + HE(declOf(n).node);
const blankBetween = (a, b) => { for (let l = a + 1; l < b; l++) if (lines[l - 1].trim() !== '') return false; return true; };

const HEADER_BRIDGE = [
  "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 소통 키트: 소통 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)",
  "  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};",
];
const FOOT = (names) => [
  ...names.filter(n => !MOVED_VARS.has(n)).map(n => '  K.' + n + ' = ' + n + ';'),
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = K;',
  '  }',
  "})(typeof window !== 'undefined' ? window : globalThis);",
  '',
];
const namesIn = f => MOVED_NAMES.filter(n => DECL_FILE[n] === f).sort((a, b) => spanOf(a)[0] - spanOf(b)[0]);
// 원래 빈 줄 하나로 떨어져 있던 이웃은 빈 줄 하나, 붙어 있던 것은 붙여 둔다
const bodyOf = f => [].concat(...namesIn(f).map((n, i) => {
  const prev = namesIn(f)[i - 1];
  const glued = prev && spanOf(prev)[1] + 1 === spanOf(n)[0];
  return (i && !glued ? [''] : []).concat(declRange(n));
}));
const COMMON_NOTE = [
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 소통 파일로 간 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * index.html 은 IIFE 맨 위에서 이 키트(OurgoalCommKit)의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.',
  ' * 선례: 목표 탭 #TASK-ES-370 · #TASK-ES-375. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
];
const out = {};
out[FILES.render] = [
  '/**',
  ' * OurGoal Community Screen Renderer (소통 탭 메인 렌더 — 화면 조립)',
  ' *',
  ' * #TASK-ES-379 (소통 탭 세포 이전 1차): index.html 인라인 IIFE 의 아래 함수를 동작 그대로 옮겼다.',
  ...namesIn('render').map(n => ' *   ' + n + '(이전 전 ' + lbl(n) + '줄)'),
  ' * renderCommScreen = 소통 요약 카드 숫자(#commHeroGroupCount·#commHeroCompanionCount·#commHeroCheerCount) + 서브탭 칩(#commBody [data-sub]) + 서브탭별 화면 분기.',
  ' * DM·동반자는 이 파일의 위임(js/team-invite-comm.js), 피드·공유·팀·마니또는 아직 index.html 에 있는 함수(L.<이름>)를 부른다.',
  ...COMMON_NOTE,
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...bodyOf('render'),
  '',
  ...FOOT(namesIn('render')),
];
out[FILES.comments] = [
  '/**',
  ' * OurGoal Community Feed Comments & Reactions (소통 탭 — 피드 댓글·리액션 헬퍼)',
  ' *',
  ' * #TASK-ES-379 (소통 탭 세포 이전 1차): index.html 인라인 IIFE 의 피드 댓글·리액션 헬퍼(#TASK-ES-133 서버 DB 실시간 동기화)를 동작 그대로 옮겼다.',
  ...namesIn('comments').map(n => ' *   ' + n + '(이전 전 ' + lbl(n) + '줄)'),
  ' * index.html 에 남은 피드 화면(renderCommFeed)과 실시간 구독(setupFeedPostsRealtime)이 IIFE 머리에서 같은 이름으로 가져와 부른다.',
  ' * SERVER_FEED_COMMENTS_CACHE 는 loadServerFeedComments 만 쓰는 빈 객체라 이 파일 안 변수로 같이 옮겼다(키트에 달지 않는다).',
  ...COMMON_NOTE,
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...bodyOf('comments'),
  '',
  ...FOOT(namesIn('comments')),
];

// index.html 새 판: 같은 파일로 가는 이웃(붙어 있거나 사이가 빈 줄뿐)은 한 덩어리로 묶어 표지 주석 한 줄로 바꾼다
const spans = MOVED_NAMES.map(n => [...spanOf(n), n]).sort((a, b) => a[0] - b[0]);
const merged = [];
for (const s of spans) {
  const last = merged[merged.length - 1];
  if (last && DECL_FILE[last[2][0]] === DECL_FILE[s[2]] && (last[1] + 1 === s[0] || blankBetween(last[1], s[0]))) { last[1] = s[1]; last[2].push(s[2]); }
  else merged.push([s[0], s[1], [s[2]]]);
}
let newHtmlLines = lines.slice();
for (const [a, b, ns] of merged.slice().sort((x, y) => y[0] - x[0])) {
  const mk = '  /* [#TASK-ES-379] ' + ns.join(' · ') + ' → ' + FILES[DECL_FILE[ns[0]]] + ' 로 옮김(소통 탭 세포 1차) */';
  newHtmlLines.splice(a - 1, b - a + 1, mk);
}
// IIFE 머리: 목표 탭 이음매 2차(#TASK-ES-375) 바로 다음에 소통 이음매를 둔다
const g2 = newHtmlLines.findIndex(l => l.includes('[#TASK-ES-375] 목표 탭 모듈 이음매 2차'));
if (g2 < 0) throw new Error('목표 이음매 2차 없음');
let g2End = -1;
for (let i = g2; i < newHtmlLines.length; i++) if (newHtmlLines[i] === '  });') { g2End = i; break; }
if (g2End < 0 || g2End - g2 > 80) throw new Error('목표 2차 expose 끝 못 찾음');
const usIdx0 = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const alreadyExposed = new Set();
for (let i = usIdx0; i <= g2End; i++) { const re = /get ([A-Za-z_$][\w$]*)\(\)/g; let m; while ((m = re.exec(newHtmlLines[i]))) alreadyExposed.add(m[1]); }
if (!alreadyExposed.size) throw new Error('앞선 노출 목록을 못 읽음');
const bridgedSorted = [...bridged.keys()].sort();
const bridgedNew = bridgedSorted.filter(n => !alreadyExposed.has(n));
for (const n of bridgedSorted) if (alreadyExposed.has(n) && bridged.get(n).assigned && !newHtmlLines.slice(usIdx0, g2End + 1).some(l => l.includes('set ' + n + '(v)'))) throw new Error('대입하는 이름인데 기존 노출에 setter 없음: ' + n);
for (const n of IMPORTS) if (alreadyExposed.has(n)) { /* 앞선 노출 getter 가 있으면 가져온 var 를 읽게 된다 — 같은 함수 */ }
const header = [
  '',
  '  /* ============ [#TASK-ES-379] 소통 탭 모듈 이음매 1차 (docs/specs/MODULE-SPLIT-PROTOCOL.md, 목표 탭 #TASK-ES-370·#TASK-ES-375 와 같은 틀) ============',
  '     ① 가져오기: js/tabs/comm/render.js · feed-comments.js 로 옮긴 함수 중 이 스코프에서 부르는 것을 같은 이름으로 가져온다(전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프 이름 중 앞선 이음매(설정·기록·일정·목표)가 아직 노출하지 않은 것만 getter 로 더한다(스코프 분석으로 뽑았다). 옮긴 코드가 대입하는 이름만 setter 를 단다. */',
  '  var _commKit = window.OurgoalCommKit;',
  ...IMPORTS.map(n => '  var ' + n + ' = _commKit.' + n + ';'),
];
if (bridgedNew.length) {
  header.push("  window.OurgoalAppScope.expose('index.html', {");
  bridgedNew.forEach((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    header.push('    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma);
  });
  header.push('  });');
}
newHtmlLines.splice(g2End + 1, 0, ...header);
const crewTag = newHtmlLines.findIndex(l => l.trim() === '<script src="js/tabs/comm/sub-crew.js"></script>');
if (crewTag < 0) throw new Error('comm/sub-crew.js 태그 없음');
if (newHtmlLines[crewTag + 1].trim() !== '<script src="js/tabs/comm/index.js"></script>') throw new Error('comm/index.js 태그 위치 다름');
newHtmlLines.splice(crewTag + 1, 0, '<script src="js/tabs/comm/feed-comments.js"></script>', '<script src="js/tabs/comm/render.js"></script>');
if (!newHtmlLines.some(l => l.trim() === '<script src="js/core/app-scope.js"></script>')) throw new Error('app-scope.js 태그 없음');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine],
  moved: MOVED_NAMES.map(n => ({ n, file: FILES[DECL_FILE[n]], lines: spanOf(n), kind: MOVED_VARS.has(n) ? 'var' : 'function' })),
  markers: merged.map(([a, b, ns]) => ({ names: ns, lines: [a, b] })),
  imports: IMPORTS, outsideRefs,
  bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: bridgedNew, edits: uniq.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-comm-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'imports', IMPORTS.join(','));
console.log('setters', bridgedSorted.filter(n => bridged.get(n).assigned).join(','));
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
