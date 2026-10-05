'use strict';
// 공통 UI 컴포넌트 세포 쪼개기 생성기(#TASK-ES-411): js/components.js(3,861줄)에서 탭별 직통 핸들러 묶음을 글자 그대로 새 파일로 옮긴다.
//   CELLS 에 적은 묶음마다 새 파일 하나(js/components-<하는 일>-actions.js). 핸들러 이름의 탭 머리말(홈탭·기록스톱워치·팀목표 …)이 묶음 경계다.
//   한 묶음의 함수는 원본에서 탭끼리 섞여 있어 여러 덩어리(사이에 다른 문 없이 이어진 함수 선언 + 바로 위 주석)로 옮긴다 — 부품 안 순서는 원본 순서.
// 시간기록 쪼개기 생성기(gen-time-tracker.js)와 같은 꼴이다. 다른 점 두 가지:
//   ① 원본 IIFE 인자 이름이 window 다. 옮긴 코드는 window 를 그 인자로 읽는다 → 부품 IIFE 도 인자 이름을 window 로 두고 원본과 같은 식
//      (typeof window !== 'undefined' ? window : global)으로 부른다. window 글자는 바꾸지 않는다(부품과 원본이 같은 순간 같은 식으로 같은 객체를 받는다).
//   ② 원본 최상위 문(노출 window.X = X · OurgoalComponents.X = X · module.exports.X = X · 별칭 var)이 옮긴 함수를 값으로 읽는다.
//      원본 IIFE 맨 위('use strict' 바로 다음)에서 옮긴 함수를 같은 이름으로 가져오므로(이 줄보다 먼저 도는 문 없음) 함수 선언 끌어올림과 같은 값이다.
//      최상위 문이 옮긴 함수를 바로 부르는(호출) 곳은 0 이어야 한다(생성기가 검사) — 원본 단독 로드(부품 없음)에서도 던지지 않게.
// 원본 스코프 이름을 옮긴 코드가 읽으면 T.<이름>(키트 칸 scope 의 getter)으로 바꾼다 — 이번 묶음은 다른 묶음 함수를 부르지 않아 0개여야 정상이다(검사기가 잼).
// 키트: 새 전역 1개 window.OurgoalComponentsKit — 부품마다 칸 하나. node 에서 키트가 없으면 원본이 부품을 require 한다(부품 module.exports = 그 칸).
// 상태 값·로드 시점에 쓰이는 상수(OurgoalComponents 객체·escapeHtml·닫기 클릭 위임·노출 줄)는 원본에 둔다.
// 위치: js/ 바로 아래(팀·통계·시간기록 쪼개기와 같은 이유). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md. 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-components.js <APP_DIR>
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const TASK = '#TASK-ES-411';
const VER = '20261005-es411';
const SRC_REL = 'js/components.js';
const TAG = '<script src="js/components.js?v=20260917-es162"></script>';
const CELLS = require('./components-cells.js');
const isCommentLine = t => t.startsWith('/*') || t.startsWith('*') || t.startsWith('//');

const SRC = path.join(APP, SRC_REL);
const code = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
if (code.includes('[' + TASK + ']')) throw new Error('이미 옮긴 판: ' + SRC_REL);
const lines = code.split('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const PARAMS = new Set(iife.node.params.map(p => p.name));
if (PARAMS.size !== 1 || !PARAMS.has('window')) throw new Error('원본 IIFE 인자가 window 하나가 아님');
const callArg = code.slice(ast.program.body[0].expression.arguments[0].start, ast.program.body[0].expression.arguments[0].end);
if (callArg !== "typeof window !== 'undefined' ? window : global") throw new Error('원본 IIFE 부르는 식이 다름: ' + callArg);
const top = iife.get('body').get('body');
if (/\broot\b/.test(code)) throw new Error('원본에 root 이름이 있다 — 부품의 키트 별칭 root 와 겹칠 수 있음');
const S = n => n.loc.start.line, E = n => n.loc.end.line;
const fnStmt = name => { const f = top.find(s => s.isFunctionDeclaration() && s.node.id.name === name); if (!f) throw new Error('함수 없음 ' + name); return f; };
const ALL_MOVED = new Set([].concat(...CELLS.map(c => c.names)));
if (ALL_MOVED.size !== [].concat(...CELLS.map(c => c.names)).length) throw new Error('두 묶음에 같은 함수');
for (const n of ALL_MOVED) {
  const b = iScope.getBinding(n);
  if (!b || !b.path.isFunctionDeclaration()) throw new Error('최상위 함수 선언 아님: ' + n);
  if (b.constantViolations.length) throw new Error('이전 함수 재대입/중복 선언: ' + n);
}
// 원본 최상위 문(함수 선언 밖)이 옮길 함수를 IIFE 실행 중 바로 부르지 않는지 — 값으로 읽는 것(노출·별칭)만 허용
for (const s of top) {
  if (s.isFunctionDeclaration()) continue;
  s.traverse({ Identifier(p) {
    if (!ALL_MOVED.has(p.node.name) || !p.isReferencedIdentifier() || p.getFunctionParent()) return;
    if (p.parentPath.isCallExpression() && p.parent.callee === p.node) throw new Error('최상위 문이 옮길 함수를 바로 부름: ' + p.node.name);
  } });
}

const meta = {};
const edits = [];
const blocks = [];
for (const C of CELLS) {
  const MOVED = new Set(C.names);
  // 덩어리: 옮길 함수가 사이에 다른 문 없이 이어진 묶음. 첫 함수 바로 위(빈 줄 없이 붙은) 주석 줄을 함께 옮긴다.
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
  for (const bl of BL) for (let l = bl.from; l <= bl.to; l++) {
    if (bl.names.some(n => l >= S(fnStmt(n).node) && l <= E(fnStmt(n).node))) continue;
    const t = lines[l - 1].trim();
    if (t && !isCommentLine(t)) throw new Error('덩어리 안 함수 밖 코드 줄 ' + l + ': ' + t);
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
        if (PARAMS.has(nm)) return; // window — 부품 IIFE 인자도 window(같은 식으로 부른다), 글자 그대로
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
  blocks.push({ C, BL, bridged });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== lines.length) throw new Error('줄 수가 바뀜');
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(newLines[l - 1]); return o; };

const removed = new Set();
const lineCell = new Map(); // 옮긴 줄 → 부품 파일
const seam = [
  '',
  '  /* ============ [' + TASK + '] 공통 UI 컴포넌트 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
  '     탭별 직통 핸들러를 js/components-<하는 일>-actions.js 로 옮겼다(동작 그대로). 옮긴 함수를 이 스코프에서 같은 이름으로 가져온다',
  '     (브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require). 아래 노출 줄(window.X = X · module.exports.X = X)은 자리·순서 그대로다. */',
  '  var _cKit = window.OurgoalComponentsKit || {};',
];
const scopeSeam = [];
for (const { C, BL, bridged } of blocks) {
  const body = [];
  BL.forEach((bl, i) => { if (i) body.push(''); body.push(...range(bl.from, bl.to)); });
  const cellLinesOut = [
    '/**',
    ' * OurGoal Components Cell: ' + C.role + ' (' + TASK + ' · 공통 UI 컴포넌트 세포 쪼개기)',
    ' *',
    ' * ' + SRC_REL + '(' + (lines.length - 1) + '줄)에서 동작 그대로 옮겼다(이전 전 ' + BL.map(b => b.from + '~' + b.to).join(', ') + '줄).',
    ' *   ' + C.names.join(' · '),
    ' * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(window){',
    "  'use strict';",
    '  // K = 공통 UI 컴포넌트 세포 키트의 ' + C.kit + ' 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).',
    '  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).',
    '  var root = window;',
    '  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};',
    '  var K = KIT.' + C.kit + ' = KIT.' + C.kit + ' || {};',
    ...(bridged.size ? ['  var T = K.scope = K.scope || {};'] : []),
    '',
    ...body,
    '',
    ...C.names.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : global);",
    '',
  ];
  fs.writeFileSync(path.join(APP, C.cell), cellLinesOut.join('\n'), 'utf8');
  for (const bl of BL) {
    for (let l = bl.from; l <= bl.to; l++) { removed.add(l); lineCell.set(l, C.cell); }
    if (lines[bl.to] !== undefined && lines[bl.to].trim() === '') { removed.add(bl.to + 1); lineCell.set(bl.to + 1, C.cell); }
  }
  seam.push('  var ' + C.imp + ' = _cKit.' + C.kit + ";");
  seam.push('  if(!' + C.imp + " && typeof require === 'function'){ " + C.imp + " = require('./" + path.basename(C.cell) + "'); }");
  seam.push('  ' + C.imp + ' = ' + C.imp + ' || {};');
  scopeSeam.push(...C.names.map(n => '  var ' + n + ' = ' + C.imp + '.' + n + ';'));
  const bridgedSorted = [...bridged.keys()].sort();
  if (bridgedSorted.length) {
    const scopeLines = [];
    bridgedSorted.forEach(n => { scopeLines.push('    get ' + n + '(){ return ' + n + '; }'); if (bridged.get(n).set) scopeLines.push('    set ' + n + '(v){ ' + n + ' = v; }'); });
    scopeSeam.push('  Object.defineProperties(' + C.imp + '.scope || (' + C.imp + '.scope = {}), Object.getOwnPropertyDescriptors({');
    scopeSeam.push(...scopeLines.map((l, i) => l + (i === scopeLines.length - 1 ? '' : ',')));
    scopeSeam.push('  }));');
  }
  meta[C.cell] = { blocks: BL.map(b => ({ from: b.from, to: b.to, names: b.names })), bridged: bridgedSorted.map(n => n + (bridged.get(n).set ? ' (get/set)' : '')) };
}
seam.push(...scopeSeam);
const strictLine = S((iife.node.body.directives && iife.node.body.directives[0]) || iife.node.body.body[0]);
if (lines[strictLine - 1].trim() !== "'use strict';") throw new Error("IIFE 첫 문이 'use strict' 아님");
// 옮긴 덩어리 사이에 빈 줄만 남으면 그 빈 줄도 지운다(옮긴 구간을 하나로 잇는다)
for (let l = 1; l <= lines.length; l++) {
  if (removed.has(l) || lines[l - 1].trim()) continue;
  let a = l - 1; while (a >= 1 && !lines[a - 1].trim() && !removed.has(a)) a--;
  let b = l + 1; while (b <= lines.length && !lines[b - 1].trim() && !removed.has(b)) b++;
  if (removed.has(a) && removed.has(b)) removed.add(l);
}
// 옮긴 줄이 이어진 구간마다 원본 그 자리에 한 줄 안내 주석
const mainOut = [];
for (let l = 1; l <= lines.length; l++) {
  if (removed.has(l) && !removed.has(l - 1)) {
    const cells = [];
    for (let k = l; removed.has(k); k++) if (lineCell.has(k) && !cells.includes(lineCell.get(k))) cells.push(lineCell.get(k));
    let fns = 0;
    for (const C of CELLS) for (const n of C.names) { const s = S(fnStmt(n).node); let k = l; while (removed.has(k)) k++; if (s >= l && s < k) fns++; }
    mainOut.push('  /* [' + TASK + '] 직통 핸들러 ' + fns + '개 → js/components-*-actions.js(부품 ' + cells.length + '개) 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */', '');
  }
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
for (const C of CELLS) meta[C.cell].cellLines = fs.readFileSync(path.join(APP, C.cell), 'utf8').split('\n').length - 1;
console.log(JSON.stringify(meta, null, 1));
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-components-meta.json'), JSON.stringify(meta, null, 1));
