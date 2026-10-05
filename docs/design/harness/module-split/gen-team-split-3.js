'use strict';
// 팀 세포 쪼개기 3차 생성기(#TASK-ES-402): 800줄을 조금 넘는 팀 파일 3개에서 응집된 책임 묶음 하나씩을 글자 그대로 새 파일로 옮긴다.
//   js/team-visibility-levels.js → js/team-level-group-modal.js (수준별 조 상세 모달 openLevelGroupDetailModal)
//   js/team-leader-check.js      → js/team-member-review.js     (팀장의 팀원 점검 모달 2개 — 확인 도장 선택·달성도 상세 점검)
//   js/team-linked-goals.js      → js/team-linked-goals-screen.js (팀 연계 개인목표 워크스페이스 화면 renderTeamLinkedGoalsScreen)
// 2차 생성기(gen-team-split-2.js)와 같은 꼴이다 — 바꾸는 글자는 이름 참조뿐:
//   원본 IIFE 스코프에 남는 이름 → T.<이름>(원본이 키트 scope 에 getter 로 노출하는 통로. 옮긴 코드가 대입하는 이름은 setter 도 둔다)
// 상태 변수는 모두 원본에 남긴다 — 원본을 다시 읽으면(시험의 require 캐시 비우기) 상태가 새로 시작되는 동작이 그대로다.
// 키트: 새 전역 1개 window.OurgoalTeamGoalsKit — 원본마다 칸 하나(visibilityLevels · leaderCheck · linkedGoals). 원본은 IIFE 맨 위에서 옮긴 함수를 같은 이름으로 가져온다
//   (var X = _goalsKit.X — 이 줄보다 먼저 도는 문이 없어 함수 선언 끌어올림과 같은 효과).
// node 에서는 원본이 부품을 require 한다(부품 module.exports = 그 칸). team-linked-goals.js 는 IIFE 인자가 node 에서 module.exports(this)라 키트를 require 반환값으로 받는다.
// 위치: js/ 바로 아래(1·2차와 같은 이유 — js/tabs/** 는 #TASK-ES-155 단언, js/<폴더>/ 는 verify-all-clicks 범위 밖).
// 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-team-split-3.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const TASK = '#TASK-ES-402';
const VER = '20261005-es402';
const SOURCES = [
  { src: 'js/team-visibility-levels.js', kit: 'visibilityLevels', cell: 'js/team-level-group-modal.js',
    role: '수준별 조 상세 모달 — 팀 통합/목표별 수준 그룹의 목표·마일스톤·할 일 편집 바텀시트', names: ['openLevelGroupDetailModal'],
    expose: 'window.OurgoalTeamVisibilityLevels.openLevelGroupDetailModal',
    tag: '<script src="js/team-visibility-levels.js?v=20260916-es110"></script>' },
  { src: 'js/team-leader-check.js', kit: 'leaderCheck', cell: 'js/team-member-review.js',
    role: '팀장의 팀원 점검 모달 — 확인 도장 선택·팀원 달성도 상세 점검 바텀시트', names: ['openLeaderStampSelectModal', 'openMemberProgressDetailModal'],
    expose: 'window.OurgoalTeamLeaderCheck.openLeaderStampSelectModal · openMemberProgressDetailModal',
    tag: '<script src="js/team-leader-check.js"></script>' },
  { src: 'js/team-linked-goals.js', kit: 'linkedGoals', cell: 'js/team-linked-goals-screen.js',
    role: "'팀 연계 개인목표' 워크스페이스 화면 — renderTeamLinkedGoalsScreen", names: ['renderTeamLinkedGoalsScreen'],
    expose: 'window.OurgoalTeamLinkedGoals.renderTeamLinkedGoalsScreen',
    tag: '<script src="js/team-linked-goals.js?v=20260916-es105"></script>' },
];
const isCommentLine = t => t.startsWith('/*') || t.startsWith('*') || t.startsWith('//');
const metaAll = {};
let html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');

for (const S0 of SOURCES) {
  const SRC = path.join(APP, S0.src);
  const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
  if (code.includes('[' + TASK + ']')) throw new Error('이미 옮긴 판: ' + S0.src);
  const lines = code.split('\n');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true });
  let iife = null;
  traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const iScope = iife.scope;
  const PARAMS = new Set(iife.node.params.map(p => p.name)); // global
  const top = iife.get('body').get('body');
  const S = n => n.loc.start.line, E = n => n.loc.end.line;
  const fnStmt = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };
  const MOVED = new Set(S0.names);
  for (const n of S0.names) {
    const b = iScope.getBinding(n);
    if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님: ' + n);
    if (b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
  }
  // 블록: 옮길 함수가 사이에 다른 문 없이 이어진 묶음. 첫 함수 바로 위(빈 줄 없이 붙은) 주석 줄을 함께 옮긴다.
  const BLOCKS = [];
  let cur = null;
  for (const s of top) {
    const nm = s.isFunctionDeclaration() ? s.node.id.name : null;
    const mv = nm && MOVED.has(nm);
    if (mv && cur) { cur.names.push(nm); cur.to = E(s.node); continue; }
    if (cur) { BLOCKS.push(cur); cur = null; }
    if (mv) {
      let from = S(s.node);
      while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim())) from--;
      cur = { names: [nm], from, to: E(s.node) };
    }
  }
  if (cur) BLOCKS.push(cur);
  if (BLOCKS.length !== 1) throw new Error('묶음이 한 덩어리가 아님 ' + S0.src + ': ' + BLOCKS.length);
  for (const b of BLOCKS) for (let l = b.from; l <= b.to; l++) {
    if (b.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
    const t = lines[l - 1].trim();
    if (t && !isCommentLine(t)) throw new Error('블록 안 함수 밖 코드 줄 ' + l + ': ' + t);
  }
  const edits = [];
  const bridged = new Map(); // 이름 → { set: bool }
  for (const n of S0.names) {
    fnStmt(n).traverse({
      ThisExpression(p) { if (!p.getFunctionParent() || p.getFunctionParent().node === fnStmt(n).node) throw new Error('옮길 함수 최상위 this: ' + n); },
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
        if (MOVED.has(nm)) return; // 같은 파일 안 호출
        const asg = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
        const repl = 'T.' + nm;
        const e = bridged.get(nm) || { set: false };
        if (asg) e.set = true;
        bridged.set(nm, e);
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
  const bl = BLOCKS[0];
  const base = path.basename(S0.src);
  const cellOut = [
    '/**',
    ' * OurGoal Team Cell: ' + S0.role + ' (' + TASK + ' · 팀 세포 쪼개기 3차)',
    ' *',
    ' * ' + S0.src + '(' + (lines.length - 1) + '줄)에서 동작 그대로 옮겼다(이전 전 ' + bl.from + '~' + bl.to + '줄).',
    ' *   ' + S0.names.join(' · '),
    ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 ' + S0.expose + ' 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    '  // T = ' + S0.src + ' 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태를 getter(대입하는 상태는 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.',
    '  // K = 팀 목표 세포 키트의 ' + S0.kit + ' 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).',
    '  var KIT = global.OurgoalTeamGoalsKit = global.OurgoalTeamGoalsKit || {};',
    '  var K = KIT.' + S0.kit + ' = KIT.' + S0.kit + ' || {};',
    '  var T = K.scope = K.scope || {};',
    '',
    ...range(bl.from, bl.to),
    '',
    ...S0.names.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
  // 원본 새 판: 블록을 지우고(블록 뒤 빈 줄 1개도 함께) 그 자리에 한 줄 안내 주석, IIFE 맨 위('use strict' 다음)에 이음매
  const removed = new Set();
  for (let l = bl.from; l <= bl.to; l++) removed.add(l);
  if (lines[bl.to] !== undefined && lines[bl.to].trim() === '') removed.add(bl.to + 1);
  const marker = '  /* [' + TASK + '] ' + bl.names.join(' · ') + ' → ' + S0.cell + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */';
  const strictLine = S((iife.node.body.directives && iife.node.body.directives[0]) || iife.node.body.body[0]);
  if (lines[strictLine - 1].trim() !== "'use strict';") throw new Error("IIFE 첫 문이 'use strict' 아님: " + S0.src);
  const bridgedSorted = [...bridged.keys()].sort();
  const scopeLines = [];
  bridgedSorted.forEach(n => { scopeLines.push('    get ' + n + '(){ return ' + n + '; }'); if (bridged.get(n).set) scopeLines.push('    set ' + n + '(v){ ' + n + ' = v; }'); });
  const seam = [
    '',
    '  /* ============ [' + TASK + '] 팀 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
    '     ① 가져오기: ' + S0.cell + ' 로 옮긴 함수(' + S0.names.join(' · ') + ')를 이 스코프에서 같은 이름으로 쓴다(브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require).',
    '     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTeamGoalsKit.' + S0.kit + '.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */',
    '  var _goalsKit = global.OurgoalTeamGoalsKit && global.OurgoalTeamGoalsKit.' + S0.kit + ';',
    "  if(!_goalsKit && typeof require === 'function'){ _goalsKit = require('./" + path.basename(S0.cell) + "'); }",
    '  _goalsKit = _goalsKit || {};',
    ...S0.names.map(n => '  var ' + n + ' = _goalsKit.' + n + ';'),
    '  Object.defineProperties(_goalsKit.scope || (_goalsKit.scope = {}), Object.getOwnPropertyDescriptors({',
    ...scopeLines.map((l, i) => l + (i === scopeLines.length - 1 ? '' : ',')),
    '  }));',
  ];
  const mainOut = [];
  for (let l = 1; l <= lines.length; l++) {
    if (l === bl.from) mainOut.push(marker, '');
    if (!removed.has(l)) mainOut.push(lines[l - 1]);
    if (l === strictLine) mainOut.push(...seam);
  }
  fs.writeFileSync(SRC, mainOut.join('\n'), 'utf8');
  fs.writeFileSync(path.join(APP, S0.cell), cellOut.join('\n'), 'utf8');
  // index.html: 원본 태그 바로 앞, 같은 줄에 새 태그(순증가 0줄)
  if (html.split(S0.tag).length !== 2) throw new Error('원본 태그 자리가 1곳이 아님: ' + S0.tag);
  const NEW_TAG = '<script src="' + S0.cell + '?v=' + VER + '"></script>';
  if (!html.includes(NEW_TAG)) html = html.replace(S0.tag, NEW_TAG + S0.tag);
  metaAll[S0.src] = { cell: S0.cell, block: bl, bridged: bridgedSorted.map(n => n + (bridged.get(n).set ? ' (get/set)' : '')), edits: uniq.length, linesBefore: lines.length - 1, linesAfter: mainOut.length - 1, cellLines: cellOut.length - 1 };
  console.log(S0.src, lines.length - 1, '->', mainOut.length - 1, '|', S0.cell, cellOut.length - 1, '| edits', uniq.length, '| bridged', metaAll[S0.src].bridged.join(','));
}
fs.writeFileSync(path.join(APP, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-team-split-3-meta.json'), JSON.stringify(metaAll, null, 1));
