'use strict';
// 시간기록 세포 쪼개기 생성기(#TASK-ES-407): js/time-tracker.js(1,220줄)에서 응집된 책임 묶음을 글자 그대로 새 파일로 옮긴다.
//   CELLS 에 적은 묶음마다 새 파일 하나(js/time-tracker-<하는 일>.js). 묶음 = 원본 IIFE 최상위에서 사이에 다른 문 없이 이어진 함수 선언들.
// 팀 세포 쪼개기 3차 생성기(gen-team-split-3.js)와 같은 꼴이다 — 바꾸는 글자는 이름 참조뿐:
//   원본 IIFE 스코프에 남는 이름(다른 부품으로 옮긴 함수 포함 — 원본이 같은 이름으로 가져와 둔다) → T.<이름>
//   (원본이 키트 칸 scope 에 getter 로 노출하는 통로. 옮긴 코드가 대입하는 이름은 setter 도 둔다)
// 상태(tracker 객체)는 원본에 남긴다. 옮긴 코드는 T.tracker 로 같은 객체를 읽는다.
// 키트: 새 전역 1개 window.OurgoalTimeTrackerKit — 부품마다 칸 하나. 원본은 IIFE 맨 위에서 옮긴 함수를 같은 이름으로 가져온다
//   (var X = _ttKit<칸>.X — 이 줄보다 먼저 도는 문이 없어 함수 선언 끌어올림과 같은 효과).
// node 에서 키트가 없으면 원본이 부품을 require 한다(부품 module.exports = 그 칸).
// 위치: js/ 바로 아래(팀·통계 쪼개기와 같은 이유 — js/tabs/** 는 #TASK-ES-155 단언, js/<폴더>/ 는 verify-all-clicks 범위 밖).
// 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-time-tracker.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const TASK = '#TASK-ES-407';
const VER = '20261005-es407';
const SRC_REL = 'js/time-tracker.js';
const TAG = '<script src="js/time-tracker.js?v=20260915-es090"></script>';
const CELLS = [
  { kit: 'screen', cell: 'js/time-tracker-screen.js', imp: '_ttScreen',
    role: '몰입 화면 만들기·버튼 배선 — 전체화면 덮개 #timeTrackerOverlay 의 DOM 을 한 번 만들고(initDOM) 모드 탭·프리셋·조절기·회전·닫기·취소·저장·ESC·회전 감지를 배선(bindEvents)',
    names: ['initDOM', 'bindEvents'] },
  { kit: 'lapMemo', cell: 'js/time-tracker-lap-memo.js', imp: '_ttLapMemo',
    role: '구간 메모 패널 — 측정 중 구간을 누르면 시간창 아래에 여는 인라인 메모(퀵 태그·취소·저장) openLapMemoModal',
    names: ['openLapMemoModal'] },
  { kit: 'review', cell: 'js/time-tracker-review.js', imp: '_ttReview',
    role: '기록 작성·내 기록 저장 — 측정을 마친 뒤 활동명·구간별 내용을 적는 화면(openReviewView)과 state.profile.records 저장(handleSaveRecord)',
    names: ['openReviewView', 'handleSaveRecord'] },
];
const isCommentLine = t => t.startsWith('/*') || t.startsWith('*') || t.startsWith('//');

const SRC = path.join(APP, SRC_REL);
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
if (code.includes('[' + TASK + ']')) throw new Error('이미 옮긴 판: ' + SRC_REL);
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name)); // global
const top = iife.get('body').get('body');
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const fnStmt = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };
const ALL_MOVED = new Set([].concat(...CELLS.map(c => c.names)));
for (const n of ALL_MOVED) {
  const b = iScope.getBinding(n);
  if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님: ' + n);
  if (b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
}
// 원본 최상위에서 IIFE 실행 중 바로 도는 문이 옮길 함수를 부르지 않는지(노출 객체의 값 참조는 원본에 남는 함수만이어야 한다)
for (const s of top) {
  if (s.isFunctionDeclaration()) continue;
  s.traverse({ Identifier(p) { if (ALL_MOVED.has(p.node.name) && p.isReferencedIdentifier() && !p.getFunctionParent()) throw new Error('최상위 문이 옮길 함수를 바로 참조: ' + p.node.name); } });
}

const meta = {};
const edits = [];
const blocks = [];
for (const C of CELLS) {
  const MOVED = new Set(C.names);
  // 블록: 옮길 함수가 사이에 다른 문 없이 이어진 묶음. 첫 함수 바로 위(빈 줄 없이 붙은) 주석 줄을 함께 옮긴다.
  const BL = [];
  let cur = null;
  for (const s of top) {
    const nm = s.isFunctionDeclaration() ? s.node.id.name : null;
    const mv = nm && MOVED.has(nm);
    if (mv && cur) { cur.names.push(nm); cur.to = E(s.node); continue; }
    if (cur) { BL.push(cur); cur = null; }
    if (mv) {
      let from = S(s.node);
      while (from > 1 && lines[from - 2].trim() && isCommentLine(lines[from - 2].trim())) from--;
      cur = { names: [nm], from, to: E(s.node) };
    }
  }
  if (cur) BL.push(cur);
  if (BL.length !== 1) throw new Error('묶음이 한 덩어리가 아님 ' + C.cell + ': ' + BL.length);
  const bl = BL[0];
  for (let l = bl.from; l <= bl.to; l++) {
    if (bl.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
    const t = lines[l - 1].trim();
    if (t && !isCommentLine(t)) throw new Error('블록 안 함수 밖 코드 줄 ' + l + ': ' + t);
  }
  const bridged = new Map(); // 이름 → { set: bool }
  for (const n of C.names) {
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
        if (PARAMS.has(nm)) throw new Error('옮길 코드가 IIFE 인자를 읽음: ' + nm);
        if (MOVED.has(nm)) return; // 같은 부품 안 호출
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
  blocks.push({ C, bl, bridged });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== lines.length) throw new Error('줄 수가 바뀜');
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(newLines[l - 1]); return o; };

const removed = new Set();
const markers = new Map(); // 블록 첫 줄 → 안내 주석
const seam = [
  '',
  '  /* ============ [' + TASK + '] 시간기록 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
  '     ① 가져오기: 부품으로 옮긴 함수를 이 스코프에서 같은 이름으로 쓴다(브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require).',
  '     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTimeTrackerKit.<칸>.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */',
  '  var _ttKit = global.OurgoalTimeTrackerKit || {};',
];
const scopeSeam = [];
for (const { C, bl, bridged } of blocks) {
  const cellLinesOut = [
    '/**',
    ' * OurGoal Time Tracker Cell: ' + C.role + ' (' + TASK + ' · 시간기록 세포 쪼개기)',
    ' *',
    ' * ' + SRC_REL + '(' + (lines.length - 1) + '줄)에서 동작 그대로 옮겼다(이전 전 ' + bl.from + '~' + bl.to + '줄).',
    ' *   ' + C.names.join(' · '),
    ' * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 window.OurgoalTimeTracker(open·close·switchMode·getState)로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    '  // T = ' + SRC_REL + ' 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태(tracker)를 getter(대입하는 이름은 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.',
    '  // K = 시간기록 세포 키트의 ' + C.kit + ' 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).',
    '  var KIT = global.OurgoalTimeTrackerKit = global.OurgoalTimeTrackerKit || {};',
    '  var K = KIT.' + C.kit + ' = KIT.' + C.kit + ' || {};',
    '  var T = K.scope = K.scope || {};',
    '',
    ...range(bl.from, bl.to),
    '',
    ...C.names.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
  fs.writeFileSync(path.join(APP, C.cell), cellLinesOut.join('\n'), 'utf8');
  for (let l = bl.from; l <= bl.to; l++) removed.add(l);
  if (lines[bl.to] !== undefined && lines[bl.to].trim() === '') removed.add(bl.to + 1);
  markers.set(bl.from, '  /* [' + TASK + '] ' + bl.names.join(' · ') + ' → ' + C.cell + ' 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */');
  seam.push('  var ' + C.imp + ' = _ttKit.' + C.kit + ";");
  seam.push('  if(!' + C.imp + " && typeof require === 'function'){ " + C.imp + " = require('./" + path.basename(C.cell) + "'); }");
  seam.push('  ' + C.imp + ' = ' + C.imp + ' || {};');
  const bridgedSorted = [...bridged.keys()].sort();
  const scopeLines = [];
  bridgedSorted.forEach(n => { scopeLines.push('    get ' + n + '(){ return ' + n + '; }'); if (bridged.get(n).set) scopeLines.push('    set ' + n + '(v){ ' + n + ' = v; }'); });
  scopeSeam.push(...C.names.map(n => '  var ' + n + ' = ' + C.imp + '.' + n + ';'));
  scopeSeam.push('  Object.defineProperties(' + C.imp + '.scope || (' + C.imp + '.scope = {}), Object.getOwnPropertyDescriptors({');
  scopeSeam.push(...scopeLines.map((l, i) => l + (i === scopeLines.length - 1 ? '' : ',')));
  scopeSeam.push('  }));');
  meta[C.cell] = { block: bl, bridged: bridgedSorted.map(n => n + (bridged.get(n).set ? ' (get/set)' : '')), cellLines: cellLinesOut.length - 1 };
}
seam.push(...scopeSeam);
const strictLine = S((iife.node.body.directives && iife.node.body.directives[0]) || iife.node.body.body[0]);
if (lines[strictLine - 1].trim() !== "'use strict';") throw new Error("IIFE 첫 문이 'use strict' 아님");
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (markers.has(l)) mainOut.push(markers.get(l), '');
  if (!removed.has(l)) mainOut.push(lines[l - 1]);
  if (l === strictLine) mainOut.push(...seam);
}
fs.writeFileSync(SRC, mainOut.join('\n'), 'utf8');
// index.html: 원본 태그 바로 앞, 같은 줄에 새 태그(순증가 0줄)
let html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
if (html.split(TAG).length !== 2) throw new Error('원본 태그 자리가 1곳이 아님: ' + TAG);
const NEW_TAGS = CELLS.map(C => '<script src="' + C.cell + '?v=' + VER + '"></script>').join('');
html = html.replace(TAG, NEW_TAGS + TAG);
fs.writeFileSync(path.join(APP, 'index.html'), html, 'utf8');
meta[SRC_REL] = { linesBefore: lines.length - 1, linesAfter: mainOut.length - 1, edits: uniq.length };
console.log(JSON.stringify(meta, null, 1));
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-time-tracker-meta.json'), JSON.stringify(meta, null, 1));
