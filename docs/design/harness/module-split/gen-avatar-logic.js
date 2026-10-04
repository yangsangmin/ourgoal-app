'use strict';
// 아바타·EXP 쪼개기 PR-3 생성기(#TASK-ES-389, 설계 docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md 3-1·3-2절):
// js/avatar-system.js(UMD 팩토리) 의 로직 선언을 책임 단위로 글자 그대로 js/avatar/<부품>.js 6개로 옮긴다.
//   themes · render · craft-engine · wallet · dynamic-album (아래 DEST 표 — 설계 3-1 표 그대로)
// 설계 표의 6번째 세포 feature-cards(handle아바타_Item26/32/41/42Action·대사 2개)는 이번에 옮기지 않는다: 기준 시험지 scripts/smoke-test.js 가
//   앱 합본(APP_SRC)에 js/avatar/** 를 넣고(#TASK-ES-385) [#TASK-ES-155] 검사가 그 합본에 'showToast(' 글자가 없어야 한다고 단언한다 —
//   핸들러 4개의 win.showToast( 를 js/avatar/ 로 옮기면 기준 시험지가 깨진다(실측: 443 → 442). 시험지 선행 PR(합본 범위를 js/avatar/xp.js 로 좁힘) 병합 뒤 옮긴다.
// 남는 것: UMD 머리 · 상수 4개(askConfirm 포함) · 페르소나 조립(PR-2) · showAvatarLegalNotice · openAvatarModal(PR-4 몫) · api 객체 ·
//          기능 카드 핸들러 4개·대사 2개와 window.handle아바타_* 대입 if 문 4쌍·api.<이름> = … 4줄(원래 자리·원래 실행 시점 — components.js 덮어쓰기 순서 보존).
// 바꾸는 글자는 이름 참조뿐이다: 옮긴 코드가 다른 파일(다른 부품·남는 avatar-system.js)의 팩토리 스코프 이름을 부르면 AV.<이름>.
// 같은 부품 파일 안 이름은 그대로. 시험지(#700)는 AV. 접두를 떼고 읽는다.
// avatar-system.js 는 팩토리 맨 위에서 옮긴 이름을 같은 이름으로 가져온다(var X = AV.X) — 함수 선언 끌어올림과 같은 효과(이 줄보다 먼저 도는 문이 없다).
// 옮긴 코드가 읽는 avatar-system.js 의 이름은 AV 에 getter 로 노출한다(목록은 스코프 분석으로 뽑는다, 살아 있는 값).
// 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-avatar-logic.js <APP_DIR> <이전 전 js/avatar-system.js(LF)>
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3];
if (!APP || !SRC) throw new Error('사용: gen-avatar-logic.js <APP_DIR> <이전 전 avatar-system.js>');
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

const PARTS = ['themes', 'render', 'craft-engine', 'wallet', 'dynamic-album'];
const TITLE = {
  themes: '77종 바디 테마 · 320종 도감 조회 · 도감 목록 화면',
  render: '아바타·랭크 그리기 입구 (로봇 SVG · 나무망치 연출 · 5대 랭크 테마·날개 · renderAvatarHtml)',
  'craft-engine': '사진 → 3등신 합성 · 기간 페르소나 분석',
  wallet: '제작권(횟수·스트릭 보너스) · 보관함 10칸',
  'dynamic-album': '상황별 다이나믹 아바타 · 앨범',
};
const DEST = {
  BODY_THEMES_77: 'themes', getAllThemes: 'themes', getThemesByMbti: 'themes', getThemesByGroup: 'themes', searchThemes: 'themes', getThemeById: 'themes', renderPersona320ListHtml: 'themes',
  getRobotAvatarSvg: 'render', getWoodHammerMakerAnimationHtml: 'render', RANK_THEMES_5: 'render', getRankThemeInfo: 'render', getRankWingsSvg: 'render', renderAvatarHtml: 'render',
  composite3DeformedAvatar: 'craft-engine', getSmartFallbackFeatures: 'craft-engine', extractPersonalFeatures: 'craft-engine', drawCartoonHead: 'craft-engine', collectPeriodPersonaSummary: 'craft-engine', fetchAvatarPersona: 'craft-engine',
  isLegacyAccount: 'wallet', getMaxCrafts: 'wallet', getRemainingCrafts: 'wallet', maybeGrantStreakBonus: 'wallet', getSavedAvatars: 'wallet', addSavedAvatar: 'wallet', removeSavedAvatar: 'wallet', renderSavedAvatarsDeckHtml: 'wallet',
  DYNAMIC_SITUATIONS: 'dynamic-album', getDynamicAvatarSvg: 'dynamic-album', getDynamicAlbum: 'dynamic-album', saveDynamicAlbum: 'dynamic-album', openDynamicAlbumModal: 'dynamic-album',
};
const MOVED = Object.keys(DEST);

// 1) UMD 팩토리(인자 0개 함수식) 찾기
let fac = null;
traverse(ast, { FunctionExpression(p) { if (!fac && p.node.params.length === 0 && p.parentPath.isCallExpression()) fac = p; } });
if (!fac) throw new Error('팩토리 없음');
const fScope = fac.scope;
const top = fac.get('body').get('body');
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const declName = s => {
  if (s.isFunctionDeclaration()) return s.node.id.name;
  if (s.isVariableDeclaration() && s.node.declarations.length === 1) return s.node.declarations[0].id.name;
  return null;
};
const destOf = s => { const n = declName(s); return n && DEST[n] ? DEST[n] : 'main'; };
for (const n of MOVED) {
  const b = fScope.getBinding(n);
  if (!b) throw new Error('선언 없음 ' + n);
  if (b.constantViolations.length) throw new Error('옮길 이름 재대입/중복 선언: ' + n);
  if (!top.some(s => declName(s) === n)) throw new Error('최상위 선언 아님 ' + n);
}
if (fScope.hasBinding('AV') || /\bAV\b/.test(code)) throw new Error('원본에 AV 이름이 이미 있음');
// 2) 옮기는 var 데이터는 순수 리터럴이어야 한다(부품 파일이 먼저 실행돼도 값이 같다)
for (const s of top) {
  if (!s.isVariableDeclaration() || destOf(s) === 'main') continue;
  s.traverse({
    'CallExpression|NewExpression|FunctionExpression|ArrowFunctionExpression|ThisExpression'(p) { throw new Error('옮길 데이터에 실행 식: ' + declName(s) + ' 줄 ' + S(p.node)); },
    Identifier(p) {
      if (p.parentPath.isVariableDeclarator() && p.parent.id === p.node) return;
      if (p.parentPath.isObjectProperty() && p.parent.key === p.node && !p.parent.computed) return;
      if (p.parentPath.isMemberExpression() && p.parent.property === p.node && !p.parent.computed) return;
      throw new Error('옮길 데이터가 이름을 읽음: ' + declName(s) + ' → ' + p.node.name);
    }
  });
}
// 3) 문마다 덩어리(앞 주석 포함 시작 줄 ~ 끝 줄). 두 문이 한 줄을 같이 쓰면 멈춘다.
const comments = ast.comments;
const chunks = top.map((s, i) => {
  const prevEnd = i ? E(top[i - 1].node) : S(fac.node.body); // 팩토리 { 줄
  if (i && S(s.node) === prevEnd) throw new Error('두 문이 한 줄: ' + S(s.node));
  let start = S(s.node);
  for (const c of comments) if (c.loc.start.line > prevEnd && c.loc.end.line < S(s.node) && c.loc.start.line < start) start = c.loc.start.line;
  // 앞 주석 시작과 문 사이에 주석·빈 줄 말고 다른 글자가 없어야 한다
  return { i, name: declName(s), dest: destOf(s), from: start, to: E(s.node), stmtFrom: S(s.node) };
});
// 문 사이 틈(덩어리 밖 줄)은 빈 줄이어야 한다
for (let i = 0; i < chunks.length; i++) {
  const a = i ? chunks[i - 1].to + 1 : S(fac.node.body) + 1;
  for (let l = a; l < chunks[i].from; l++) if (lines[l - 1].trim() && lines[l - 1].trim() !== "'use strict';") throw new Error('문 사이 틈에 글자 줄 ' + l + ': ' + lines[l - 1]);
}
// 4) 이름 참조 바꾸기 — 옮긴 문 안에서 팩토리 스코프 이름을 읽는 곳
const fileOfLine = l => { const c = chunks.find(c => l >= c.from && l <= c.to); return c ? c.dest : null; };
const edits = [];
const bridged = new Map(); // avatar-system.js 에 남는 이름 → 종류
const crossUse = {}; // 부품 → 다른 부품에서 부르는 이름
const avCalled = new Set();
for (const s of top) {
  const here = destOf(s);
  if (here === 'main') continue;
  s.traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.node === (s.node.id || s.node.declarations[0].id)) return; // 옮기는 선언 자신의 이름
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== fScope) return;
      if (fileOfLine(S(p.node)) !== here) throw new Error('파일 미정 줄 ' + S(p.node));
      const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      const there = DEST[nm] || 'main';
      if (there === here) return;
      if (asg) throw new Error('다른 파일 이름에 대입: ' + nm + ' 줄 ' + S(p.node));
      if (there === 'main') { if (!bridged.has(nm)) bridged.set(nm, b.kind); }
      else (crossUse[here] = crossUse[here] || new Set()).add(nm);
      if (p.parentPath.isCallExpression() && par.callee === p.node) avCalled.add(nm);
      const repl = 'AV.' + nm;
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': ' + repl }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: repl });
    }
  });
}
// AV.<함수>() 로 부르면 this 가 AV 가 된다 — 그런 함수가 자기 몸통에서 this 를 쓰면 동작이 바뀌므로 멈춘다
for (const nm of avCalled) {
  const b = fScope.getBinding(nm);
  if (!b.path.isFunctionDeclaration()) throw new Error('AV 로 부르는 것이 함수 선언이 아님: ' + nm);
  b.path.traverse({
    ThisExpression(p) { if (p.getFunctionParent() === b.path) throw new Error('this 를 쓰는 함수를 AV. 로 부름: ' + nm); },
  });
}
// 옮긴 코드가 avatar-system.js 의 바뀌는 이름을 읽으면 getter 로 살아 있는 값을 준다 — 재대입이 없는지도 본다
for (const [nm] of bridged) {
  const b = fScope.getBinding(nm);
  if (b.constantViolations.length) throw new Error('getter 로 노출할 이름이 재대입됨(setter 필요): ' + nm);
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== lines.length) throw new Error('줄 수가 바뀜');
const NL = l => newLines[l - 1];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

// 5) 이어진 같은 부품 문들 = 덩어리 묶음(run). 묶음 사이 빈 줄도 그대로 담는다.
const runs = [];
for (const c of chunks) {
  if (c.dest === 'main') continue;
  const last = runs[runs.length - 1];
  if (last && last.dest === c.dest && last.lastIdx === c.i - 1) { last.to = c.to; last.names.push(c.name); last.lastIdx = c.i; }
  else runs.push({ dest: c.dest, from: c.from, to: c.to, names: [c.name], lastIdx: c.i });
}
const FILE = d => 'js/avatar/' + d + '.js';
const out = {};
for (const d of PARTS) {
  const rs = runs.filter(r => r.dest === d);
  const names = rs.flatMap(r => r.names);
  const fromAV = [...(crossUse[d] || [])].sort();
  const body = rs.flatMap((r, i) => [...(i ? [''] : []), ...range(r.from, r.to)]);
  out[FILE(d)] = [
    '/**',
    ' * OurGoal Avatar Cell: ' + TITLE[d] + ' (#TASK-ES-389 · 아바타·EXP 쪼개기 PR-3)',
    ' *',
    ' * js/avatar-system.js(이전 전 ' + (lines.length - 1) + '줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: ' + rs.map(r => r.from + '~' + r.to).join(', ') + ').',
    ' *   ' + names.join(' · '),
    ' * 바꾼 것은 이름 참조뿐이다 — 다른 부품·avatar-system.js 의 이름은 AV.<이름>(' + (fromAV.concat([...bridgedFor(d)]).sort().join(' · ') || '없음') + '). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 window.OurgoalAvatar.<이름> 으로 부른다(avatar-system.js 가 같은 이름으로 가져와 api 에 담는다).',
    ' * 브라우저: index.html 이 avatar-system.js 보다 먼저 읽어 OurgoalAvatarParts 에 담는다. Node: avatar-system.js 가 require 해서 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function (root, factory) {',
    "  if (typeof module === 'object' && module.exports) {",
    '    module.exports = factory;',
    '  } else {',
    '    factory(root.OurgoalAvatarParts = root.OurgoalAvatarParts || {});',
    '  }',
    "}(typeof self !== 'undefined' ? self : this, function (AV) {",
    "  'use strict';",
    '',
    ...body,
    '',
    ...names.map(n => '  AV.' + n + ' = ' + n + ';'),
    '}));',
    '',
  ];
}
function bridgedFor(d) {
  // 이 부품이 읽는 avatar-system.js 이름
  const set = new Set();
  for (const s of top) {
    if (destOf(s) !== d) continue;
    s.traverse({ Identifier(p) { const b = p.scope.getBinding(p.node.name); if (b && b.scope === fScope && bridged.has(p.node.name) && (DEST[p.node.name] || 'main') === 'main' && !(p.parentPath.isMemberExpression() && p.parent.property === p.node && !p.parent.computed)) set.add(p.node.name); } });
  }
  return set;
}

// 6) avatar-system.js 새 판: 묶음을 지우고 그 자리에 한 줄 안내 주석
const removed = new Set();
const markerAt = new Map();
for (const r of runs) {
  for (let l = r.from; l <= r.to; l++) removed.add(l);
  markerAt.set(r.from, '  /* [#TASK-ES-389] ' + r.names.join(' · ') + ' → ' + FILE(r.dest) + ' 로 옮김(동작 그대로). 이 팩토리 맨 위에서 같은 이름으로 가져온다. */');
}
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markerAt.has(l)) mainOut.push(markerAt.get(l));
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
}
const mainTidy = mainOut; // 묶음 앞뒤 빈 줄은 원래대로 남는다(빈 줄 · 안내 주석 · 빈 줄)
const usIdx = mainTidy.findIndex(l => l.trim() === "'use strict';");
if (usIdx < 0 || usIdx > 25) throw new Error("'use strict' 위치 다름");
const bridgedSorted = [...bridged.keys()].sort();
const NODE = "typeof module === 'object' && module && module.exports && typeof require === 'function'";
const header = [
  '  /* ============ [#TASK-ES-389] 아바타 부품 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md · 설계 REQ-TASK-ES-384 3-1절) ============',
  '     ① 가져오기: js/avatar/{' + PARTS.join(',') + '}.js 로 옮긴 선언을 이 팩토리에서 같은 이름으로 부른다(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다).',
  '        브라우저는 index.html 이 부품을 먼저 읽어 전역 OurgoalAvatarParts 에 담아 둔다(이 파일은 그 이름을 읽기만 한다). Node 는 여기서 require 해 부른다.',
  '     ② 통로: 옮긴 코드가 읽는 이 팩토리의 이름만 AV 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). 값은 읽을 때마다 살아 있는 값이다. */',
  '  var AV = (' + NODE + ') ? {} : ((typeof OurgoalAvatarParts !== \'undefined\' && OurgoalAvatarParts) || {});',
  '  if (' + NODE + ') {',
  ...PARTS.map(d => "    require('./avatar/" + d + ".js')(AV);"),
  '  }',
  ...MOVED.map(n => '  var ' + n + ' = AV.' + n + ';'),
  '  Object.defineProperties(AV, Object.getOwnPropertyDescriptors({',
  ...bridgedSorted.map((n, i) => '    get ' + n + '() { return ' + n + '; }' + (i === bridgedSorted.length - 1 ? '' : ',')),
  '  }));',
];
mainTidy.splice(usIdx + 1, 0, ...header);

fs.mkdirSync(path.join(APP, 'js', 'avatar'), { recursive: true });
fs.writeFileSync(path.join(APP, 'js', 'avatar-system.js'), mainTidy.join('\n'), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');

// 7) index.html: avatar-system.js <script> 바로 앞에 부품 6개(원본 태그·버전 글자는 그대로)
const htmlPath = path.join(APP, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const TAG = '  <script src="js/avatar-system.js?v=20260913-es054"></script>';
if (html.split(TAG).length !== 2) throw new Error('avatar-system.js script 태그가 1개가 아님');
const eol = html.includes('\r\n') ? '\r\n' : '\n';
const NEW_TAGS = PARTS.map(d => '  <script src="js/avatar/' + d + '.js?v=20261005-es389"></script>').join(eol) + eol;
if (!html.includes('js/avatar/themes.js')) fs.writeFileSync(htmlPath, html.replace(TAG, NEW_TAGS + TAG), 'utf8');

const meta = { runs: runs.map(r => ({ dest: r.dest, from: r.from, to: r.to, names: r.names })), bridged: bridgedSorted, crossUse: Object.fromEntries(Object.entries(crossUse).map(([k, v]) => [k, [...v].sort()])), avCalled: [...avCalled].sort(), edits: uniq.length, mainLines: mainTidy.length - (mainTidy[mainTidy.length - 1] === '' ? 1 : 0) };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-avatar-logic-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.join(','));
console.log('js/avatar-system.js', lines.length - 1, '->', meta.mainLines);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
