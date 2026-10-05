'use strict';
// 인라인 스크립트 세포화 구역 P2 생성기(#TASK-ES-438 ~): index.html 인라인 IIFE 의 책임 묶음(scripts/inline-script-map.js 지도 G129~G176 구역)을
// 글자 그대로 세포 파일로 옮긴다. 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)와 같은 틀이고 다른 점은 셋이다.
//  ① 묶음을 통째로가 아니라 "최상위 선언 단위"로 옮긴다: 옮기는 선언마다 바로 앞 최상위 문 끝 줄 다음 줄(앞 주석·구획 주석·빈 줄 포함) ~ 그 선언 끝 줄.
//     묶음 안의 로드 중 바로 도는 문(window.X = X 노출·document.addEventListener 위임 등)과 시험지가 index.html 에서 글자로 잘라 가는 함수(smoke-test FN_NAMES)는
//     제자리에 둔다 — 로드 순서·시험지 글자가 그대로다. 같은 세포로 가는 이웃 덩어리는 표지 주석 한 줄로 합친다.
//  ② 함수 선언 말고 재대입 0 인 최상위 변수(var/let/const)도 옮긴다. 초기값이 로드 중에 읽는 이름은 같은 세포 안의 옮긴 이름이어야 한다(인라인 이름을 읽으면 멈춘다 —
//     세포 파일은 인라인 스크립트보다 먼저 로드되므로). index.html 은 IIFE 머리에서 `var X = _키트.X` 로 같은 값(같은 객체)을 가져온다.
//  ③ 이음매는 앞선 인라인 세포화 이음매들 중 마지막 블록 바로 다음에 둔다(병렬 빌더가 같은 줄을 다투지 않게 — 합칠 때는 블록을 나란히 둔다).
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 같은 세포 안 이름은 그대로, 같은 키트의 다른 세포로 간 이름은 K.<이름>.
// 손으로 옮기지 않는다. 설정(옮길 묶음·세포)은 gen-inline-p2-<n>.config.js 에 있다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-p2.js <APP_DIR> <config.js> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const CFG = require(path.resolve(process.argv[3]));
const SRC = process.argv[4] || path.join(APP, 'index.html');
const TASK = CFG.task; // 'TASK-ES-438'
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

const CELLS = CFG.cells;
const DECL_CELL = {};
for (const c of CELLS) for (const g of c.groups) for (const n of g.names) { if (DECL_CELL[n]) throw new Error('이름 중복 ' + n); DECL_CELL[n] = c.key; }
const CELL = Object.fromEntries(CELLS.map(c => [c.key, c]));
const MOVED_NAMES = Object.keys(DECL_CELL);
const MOVED = new Set(MOVED_NAMES);

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
// 이름 → 최상위 문(함수 선언 또는 선언자 하나짜리 변수 선언)
const stmtOf = name => {
  const s = top.find(st => (st.isFunctionDeclaration() && st.node.id.name === name) || (st.isVariableDeclaration() && st.node.declarations.some(d => d.id.type === 'Identifier' && d.id.name === name)));
  if (!s) throw new Error('최상위 선언 없음 ' + name);
  if (s.isVariableDeclaration() && s.node.declarations.length !== 1) throw new Error('선언자가 여럿인 변수 선언(이번 틀 밖): ' + name);
  return s;
};
const isVar = n => stmtOf(n).isVariableDeclaration();
// smoke-test FN_NAMES 의 함수는 옮기지 않는다 + 그 함수가 읽는 이름도 옮기지 않는다(시험지가 글자를 잘라 따로 돌린다)
const smokeNames = (() => {
  const smoke = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8');
  const m = smoke.match(/const FN_NAMES = \[([\s\S]*?)\];/);
  if (!m) throw new Error('smoke-test FN_NAMES 못 읽음');
  return new Set([...m[1].matchAll(/'([A-Za-z_$][\w$]*)'/g)].map(x => x[1]));
})();
for (const n of MOVED_NAMES) if (smokeNames.has(n)) throw new Error('smoke-test FN_NAMES 함수를 옮기려 함: ' + n);
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  for (const r of b.referencePaths) {
    const fn = r.findParent(p => p.isFunctionDeclaration() && p.parentPath === iife.get('body'));
    // 예외(설정 smokeStubbed): smoke-test 가 그 이름을 index.html 에서 뽑지 않고 샌드박스 스텁으로 직접 정의하는 경우(예: MOCK_GROUPS — smoke-test.js 「실제 MOCK_GROUPS는 추출하지 않음」)
    if (fn && smokeNames.has(fn.node.id.name) && !(CFG.smokeStubbed || []).includes(n)) throw new Error('smoke-test FN_NAMES 함수(' + fn.node.id.name + ')가 읽는 이름을 옮기려 함: ' + n);
  }
}
// 재대입·중복 선언 검사, 최상위 this·arguments 0, 세포 머리 이름(L·K·global)과 겹치는 이름 0
for (const n of MOVED_NAMES) {
  const b = iScope.getBinding(n);
  if (!b) throw new Error('바인딩 없음 ' + n);
  if (b.constantViolations.length) throw new Error('이전 이름 재대입/중복 선언: ' + n);
  const st = stmtOf(n);
  let bad = 0, clash = 0;
  st.traverse({
    Function(p) { if (!p.isArrowFunctionExpression()) p.skip(); },
    ThisExpression() { bad++; },
    Identifier(p) { if (p.node.name === 'arguments' && p.isReferencedIdentifier()) bad++; },
  });
  st.traverse({ Identifier(p) { if (['L', 'K', 'global'].includes(p.node.name)) clash++; } });
  if (bad && st.isFunctionDeclaration()) throw new Error('옮길 함수의 최상위 this/arguments: ' + n);
  if (st.isVariableDeclaration()) {
    // 변수 초기값의 최상위 this/arguments(함수 밖) 0
    let badV = 0;
    st.traverse({ Function(p) { p.skip(); }, ThisExpression() { badV++; }, Identifier(p) { if (p.node.name === 'arguments' && p.isReferencedIdentifier()) badV++; } });
    if (badV) throw new Error('옮길 변수 초기값의 this/arguments: ' + n);
  }
  if (clash) throw new Error('세포 머리 이름(L·K·global)과 겹치는 식별자: ' + n);
}

// 덩어리: 옮기는 선언마다 (앞 최상위 문 끝 줄 + 1) ~ 선언 끝 줄
const topIdx = name => top.indexOf(stmtOf(name));
const chunks = [];
for (const c of CELLS) for (const g of c.groups) for (const n of g.names) {
  const st = stmtOf(n); const i = topIdx(n);
  const prevEnd = i > 0 ? HE(top[i - 1].node) : sLine + 1;
  if (prevEnd >= H(st.node)) throw new Error('앞 문과 같은 줄에서 시작(이번 틀 밖): ' + n);
  const end = HE(st.node);
  if (i + 1 < top.length && H(top[i + 1].node) <= end) throw new Error('끝 줄에 다음 문이 붙어 있음(이번 틀 밖): ' + n);
  const tail = lines[end - 1].slice(st.node.loc.end.column).trim();
  if (tail && !tail.startsWith('//')) throw new Error('끝 줄 뒤에 다른 코드: ' + n + ' ' + tail);
  if (g.header && !lines.slice(prevEnd, end).some(l => l.includes(g.header)) && g.names[0] === n && g.headerWithFirst) throw new Error('구획 주석이 첫 선언 덩어리에 없음: ' + g.header);
  chunks.push({ cell: c.key, group: g.id, names: [n], start: prevEnd + 1, end });
}
chunks.sort((a, b) => a.start - b.start);
for (let i = 1; i < chunks.length; i++) if (chunks[i].start <= chunks[i - 1].end) throw new Error('덩어리 겹침');
const cellOfLine = l => { const ch = chunks.find(x => l >= x.start && l <= x.end); return ch ? ch.cell : null; };

// 옮긴 함수가 (같은 세포의 옮긴 함수를 따라가며) 인라인 스코프 이름을 하나도 읽지 않는가 — 로드 중에 불려도 되는가
const pureMoved = (name, seen) => {
  if (seen.has(name)) return true; seen.add(name);
  const st = stmtOf(name); let pure = true;
  st.traverse({ Identifier(p) {
    if (!pure || !p.isReferencedIdentifier()) return;
    const b = p.scope.getBinding(p.node.name);
    if (!b || b.scope !== iScope || p.node.name === name) return;
    if (!MOVED.has(p.node.name) || DECL_CELL[p.node.name] !== DECL_CELL[name]) { pure = false; return; }
    if (!isVar(p.node.name) && !pureMoved(p.node.name, seen)) pure = false;
  } });
  return pure;
};
// 변수 초기값이 로드 중에 읽는 이름: 같은 세포의 옮긴 이름만(그 세포 안에서 먼저 선언됐거나 함수 선언 — 끌어올림)
for (const n of MOVED_NAMES) {
  const st = stmtOf(n); if (!st.isVariableDeclaration()) continue;
  st.traverse({ Function(p) { p.skip(); }, Identifier(p) {
    if (!p.isReferencedIdentifier()) return;
    const b = p.scope.getBinding(p.node.name);
    if (!b || b.scope !== iScope || p.node.name === n) return;
    if (!MOVED.has(p.node.name) || DECL_CELL[p.node.name] !== DECL_CELL[n]) throw new Error('변수 초기값이 로드 중에 인라인/다른 세포 이름을 읽음: ' + n + ' → ' + p.node.name);
    if (isVar(p.node.name) && H(stmtOf(p.node.name).node) > H(st.node)) throw new Error('변수 초기값이 뒤에 선언된 변수를 읽음: ' + n + ' → ' + p.node.name);
  } });
  // 초기값이 로드 중에 부르는 옮긴 함수는 (같은 세포 안에서 끝까지 따라가) 인라인 이름을 읽지 않아야 한다 — 세포 파일이 돌 때는 아직 통로(L.)가 비어 있다(#TASK-ES-441 추가)
  st.traverse({ Function(p) { p.skip(); }, CallExpression(p) {
    const c = p.node.callee;
    if (c.type === 'Identifier' && MOVED.has(c.name) && !pureMoved(c.name, new Set())) throw new Error('변수 초기값이 로드 중에 인라인 이름을 읽는 옮긴 함수를 부름: ' + n + ' → ' + c.name);
  } });
  // 초기값이 로드 중에 읽는 전역(스코프 밖 이름)은 로드 순서와 무관한 내장 이름만 허용한다 — 세포 파일은 다른 스크립트보다 먼저 돌 수 있다(#TASK-ES-441 추가)
  const SAFE_GLOBALS = new Set(['window', 'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Infinity', 'NaN', 'undefined', 'RegExp']);
  st.traverse({ Function(p) { p.skip(); }, Identifier(p) {
    if (!p.isReferencedIdentifier() || p.scope.getBinding(p.node.name)) return;
    if (!SAFE_GLOBALS.has(p.node.name)) throw new Error('변수 초기값이 로드 중에 전역을 읽음(로드 순서 의존): ' + n + ' → ' + p.node.name);
    if (p.node.name === 'window' && p.parentPath.isMemberExpression() && p.parent.object === p.node && p.parent.property.name !== 'location') throw new Error('변수 초기값이 로드 중에 window.' + (p.parent.property.name || '?') + ' 를 읽음(로드 순서 의존): ' + n);
  } });
}

// 옮긴 코드 밖에서 부르는 이름 = index.html 이 IIFE 머리에서 가져와야 하는 이름(스코프 분석으로 정한다)
const IMPORTS = {}; const outsideRefs = {};
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !cellOfLine(H(r.node)));
  if (outs.length) { (IMPORTS[DECL_CELL[n]] = IMPORTS[DECL_CELL[n]] || []).push(n); outsideRefs[n] = outs.map(r => H(r.node)); }
}

// 바꿔 쓸 식별자
const edits = [];
const bridged = new Map();
const crossCell = [];
for (const n of MOVED_NAMES) {
  stmtOf(n).traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isClassMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.parentPath.isVariableDeclarator() && par.id === p.node && p.parentPath.parentPath.parentPath === iife.get('body')) return; // 옮기는 변수 자신의 이름
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = cellOfLine(H(p.node));
      if (!here) throw new Error('세포 미정 줄 ' + H(p.node));
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_CELL[nm] === here) return;
        if (isWrite) throw new Error('다른 세포 이름에 대입: ' + nm);
        crossCell.push(nm + '@' + H(p.node));
        if (CELL[DECL_CELL[nm]].kit !== CELL[here].kit) {
          // 다른 탭 키트의 세포로 간 이름: 탭 사이 직접 참조를 만들지 않고 앱 스코프 통로(L.)로 읽는다 — index.html 이 그 이름을 가져와 getter 로 노출한다(#TASK-ES-441 추가)
          repl = 'L.' + nm;
          if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: 'moved-cross-kit' });
          if (!(IMPORTS[DECL_CELL[nm]] || []).includes(nm)) (IMPORTS[DECL_CELL[nm]] = IMPORTS[DECL_CELL[nm]] || []).push(nm);
        } else repl = 'K.' + nm;
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
// 구조 분해 등 다른 꼴의 대입도 setter 가 있어야 한다 — 바인딩의 constantViolations 로 다시 확인
for (const [nm, info] of bridged) {
  const b = iScope.getBinding(nm);
  if (b.constantViolations.some(cv => cellOfLine(H(cv.node)))) {
    for (const cv of b.constantViolations) if (cellOfLine(H(cv.node)) && !(cv.isAssignmentExpression() && cv.node.left.type === 'Identifier') && !cv.isUpdateExpression()) throw new Error('단순 대입이 아닌 꼴로 인라인 이름에 대입(이번 틀 밖): ' + nm);
    info.assigned = true;
  }
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== code.split('\n').length) throw new Error('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

const HEADER_BRIDGE = kit => [
  "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)",
  "  var K = global." + kit + " = global." + kit + " || {};",
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
const COMMON_NOTE = [
  ' * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
  ' * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.',
  ' * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.',
  ' * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
];
const bodyOf = key => {
  const out = [];
  const mine = chunks.filter(ch => ch.cell === key);
  mine.forEach((ch, i) => {
    let seg = range(ch.start, ch.end);
    // 덩어리 앞 빈 줄은 하나만 남긴다(글자 비교는 빈 줄 아닌 줄로 한다)
    while (seg.length && seg[0].trim() === '') seg = seg.slice(1);
    if (i) out.push('');
    out.push(...seg);
  });
  return out;
};
const namesOf = key => MOVED_NAMES.filter(n => DECL_CELL[n] === key).sort((a, b) => H(stmtOf(a).node) - H(stmtOf(b).node));
const out = {};
for (const c of CELLS) {
  const lbl = chunks.filter(ch => ch.cell === c.key).map(ch => ch.names[0] + '(' + ch.start + '~' + ch.end + ')').join(' · ');
  const desc = ['/**', ' * ' + c.title, ' *', ' * #' + TASK + ' (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 ' + [...new Set(c.groups.map(g => g.id))].join('·') + '.',
    ' *   옮긴 선언(이전 전 줄): ' + lbl, ...c.desc.map(d => ' * ' + d), ...COMMON_NOTE, ' */'];
  out[c.file] = [...desc, '(function(global) {', "  'use strict';", ...HEADER_BRIDGE(c.kit), '', ...bodyOf(c.key), '', ...FOOT(namesOf(c.key))];
}

// index.html 새 판: 덩어리마다(같은 세포로 가는 이웃 덩어리는 사이가 빈 줄뿐이면 합친다) 표지 주석 한 줄
const blankBetween = (a, b) => { for (let l = a + 1; l < b; l++) if (lines[l - 1].trim() !== '') return false; return true; };
const merged = [];
for (const ch of chunks) {
  const last = merged[merged.length - 1];
  if (last && last.cell === ch.cell && (last.end + 1 === ch.start || blankBetween(last.end, ch.start))) { last.end = ch.end; last.names.push(...ch.names); }
  else merged.push({ cell: ch.cell, start: ch.start, end: ch.end, names: ch.names.slice() });
}
let newHtmlLines = lines.slice();
for (const m of merged.slice().sort((x, y) => y.start - x.start)) {
  const mk = '  /* [#' + TASK + '] ' + m.names.join(' · ') + ' → ' + CELL[m.cell].file + ' 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */';
  newHtmlLines.splice(m.start - 1, m.end - m.start + 1, mk);
}
// IIFE 머리: 앞선 인라인 세포화 이음매 중 마지막 블록 바로 다음
const usIdx0 = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const seamIdx = [];
newHtmlLines.forEach((l, i) => { if (/^  \/\* =+ \[#TASK-ES-\d+\] 인라인 스크립트 세포화 .*이음매/.test(l)) seamIdx.push(i); });
if (!seamIdx.length) throw new Error('앞선 인라인 세포화 이음매 없음');
const lastSeam = seamIdx[seamIdx.length - 1];
let j = lastSeam;
while (j < newHtmlLines.length && !newHtmlLines[j].includes('*/')) j++;
j++;
let seamEnd = j - 1;
while (j < newHtmlLines.length) {
  const l = newHtmlLines[j];
  if (/^  var \w+ = _\w+Kit\.\w+;$/.test(l)) { seamEnd = j; j++; continue; }
  if (l === "  window.OurgoalAppScope.expose('index.html', {") { while (newHtmlLines[j] !== '  });') j++; seamEnd = j; j++; continue; }
  break;
}
if (seamEnd - lastSeam > 120) throw new Error('앞선 이음매 끝 못 찾음');
const alreadyExposed = new Set();
for (let i = usIdx0; i <= seamEnd; i++) { const re = /get ([A-Za-z_$][\w$]*)\(\)/g; let m; while ((m = re.exec(newHtmlLines[i]))) alreadyExposed.add(m[1]); }
if (!alreadyExposed.size) throw new Error('앞선 노출 목록을 못 읽음');
const kitVarDeclared = new Set();
for (let i = usIdx0; i <= seamEnd; i++) { const m = newHtmlLines[i].match(/^  var (_\w+Kit) = window\.(\w+);$/); if (m) kitVarDeclared.add(m[1] + '=' + m[2]); }
const bridgedSorted = [...bridged.keys()].sort();
// 앞선 이음매가 getter 만 노출한 이름을 옮긴 코드가 대입하면, 이번 이음매에서 getter+setter 로 다시 노출한다
// (app-scope expose 는 같은 이름을 configurable 로 다시 정의한다 — 나중 정의가 이긴다, #TASK-ES-441 추가)
const reExposed = bridgedSorted.filter(n => alreadyExposed.has(n) && bridged.get(n).assigned && !newHtmlLines.slice(usIdx0, seamEnd + 1).some(l => l.includes('set ' + n + '(v)')));
const bridgedNew = bridgedSorted.filter(n => !alreadyExposed.has(n) || reExposed.includes(n));
const files = CELLS.map(c => c.file).join(' · ');
const header = [
  '',
  '  /* ============ [#' + TASK + '] 인라인 스크립트 세포화 P2-' + CFG.n + ' 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-423 와 같은 틀) ============',
  '     ① 가져오기: ' + files + ' 로 옮긴 이름 중 이 스코프에서 쓰는 것을 같은 이름으로 가져온다(키트는 앞선 이음매의 탭 키트 변수를 그대로 쓴다 — 전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프 이름 중 앞선 이음매가 아직 노출하지 않은 것만 getter 로 더한다(스코프 분석으로 뽑았다). */',
];
for (const c of CELLS) {
  if (!kitVarDeclared.has(c.kitVar + '=' + c.kit)) throw new Error('앞선 이음매에 키트 변수 없음: ' + c.kitVar);
  for (const n of namesOf(c.key).filter(x => (IMPORTS[c.key] || []).includes(x))) header.push('  var ' + n + ' = ' + c.kitVar + '.' + n + ';');
}
if (bridgedNew.length) {
  header.push("  window.OurgoalAppScope.expose('index.html', {");
  bridgedNew.forEach((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    header.push('    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma);
  });
  header.push('  });');
}
newHtmlLines.splice(seamEnd + 1, 0, ...header);
// script 태그: 그 탭 index.js 태그 바로 앞, 같은 줄(순증가 0줄). 앞선 이전이 같은 줄에 태그를 붙여 두었어도 index.js 태그 글자 바로 앞에 넣는다.
for (const c of CELLS) {
  const hits = newHtmlLines.map((l, i) => [l, i]).filter(([l]) => l.includes(c.beforeTag));
  if (hits.length !== 1) throw new Error('태그 없음/여럿 ' + c.beforeTag + ' ' + hits.length);
  const idx = hits[0][1];
  const tag = '<script src="' + c.file + '"></script>';
  if (newHtmlLines[idx].includes(tag)) throw new Error('이미 있는 태그 ' + tag);
  newHtmlLines[idx] = newHtmlLines[idx].replace(c.beforeTag, tag + c.beforeTag);
}
if (!newHtmlLines.some(l => l.trim() === '<script src="js/core/app-scope.js"></script>')) throw new Error('app-scope.js 태그 없음');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { task: TASK, scriptHtmlLines: [sLine + 1, eLine],
  moved: Object.fromEntries(CELLS.map(c => [c.file, namesOf(c.key)])), kitVars: [...new Set(CELLS.map(c => c.kitVar))],
  chunks, markers: merged.map(m => ({ names: m.names, lines: [m.start, m.end], file: CELL[m.cell].file })),
  imports: IMPORTS, outsideRefs, crossCell,
  bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: bridgedNew, reExposedWithSetter: reExposed, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: newHtmlLines.length };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-p2-' + CFG.n + '-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'crossCell', crossCell.length, 'imports', JSON.stringify(IMPORTS));
console.log('index.html lines', lines.length, '->', newHtmlLines.length);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
