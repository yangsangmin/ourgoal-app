'use strict';
// 인라인 스크립트 세포화 P0 구역 생성기(#TASK-ES-437~): 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)를 설정 파일로 돌게 넓힌 것.
//   설정(JSON): 세포 파일마다 키트(이미 있는 탭 키트) · 옮길 묶음(구획 주석 첫 줄 글자) · 묶음에서 옮길 함수 이름(없으면 묶음의 최상위 함수 선언 전부).
// 1차와 다른 점 — 묶음 안에 옮기지 않는 문(window 노출 줄·로드 중 바로 도는 if·var 선언)이 있어도 된다:
//   ㉮ 묶음의 최상위 문이 모두 옮길 함수면 1차처럼 구획 주석부터 마지막 선언 끝 줄까지 통째로 옮긴다.
//   ㉯ 아니면 옮길 함수 선언만(그 함수 바로 앞에 붙은 주석 포함) 옮기고, 구획 주석·window 노출 줄·var·로드 중 문은 원래 자리에 그대로 둔다(MODULE-SPLIT-PROTOCOL 3절).
//   ㉰ 설정의 moveVars 에 적은 최상위 var 는 초기값이 상수 글자(리터럴·배열·객체, 이름·호출 없음)이고 재대입이 없을 때만 함께 옮긴다.
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 같은 세포 안 이름은 그대로,
//   다른 세포로 간 이름도 L.<이름>(인라인이 가져온 같은 이름을 getter 로 노출). 글자는 그대로 — 원본에 있던 결함도 그대로 옮긴다.
// 시험지가 index.html 에서 글자로 잘라 가는 함수(smoke-test FN_NAMES)는 옮기지 않는다 — 생성기가 검사한다.
// 옮긴 코드가 L. 로 부르는 인라인 함수 중 최상위 this 를 쓰는 것이 있으면 멈춘다(L.f() 로 부르면 this 가 바뀐다).
// 손으로 옮기지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-p0.js <APP_DIR> <설정.json> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const CFG = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const SRC = process.argv[4] || path.join(APP, 'index.html');
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
const TASK = CFG.task;
const CELLS = CFG.cells;

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const isHeaderLine = l => /^  \/\* ={3,} /.test(l);

// smoke-test FN_NAMES
const smoke = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8').match(/const FN_NAMES = \[([\s\S]*?)\];/);
if (!smoke) throw new Error('smoke-test FN_NAMES 못 읽음');
const SMOKE = new Set([...smoke[1].matchAll(/'([^']+)'/g)].map(m => m[1]));

// 묶음 찾기: 구획 주석 줄 ~ 다음 구획 주석 줄 앞
const groupRange = header => {
  const idx = [];
  for (let i = sLine; i < eLine; i++) if (isHeaderLine(lines[i]) && lines[i].includes(header)) idx.push(i);
  if (idx.length !== 1) throw new Error('구획 주석이 ' + idx.length + '개: ' + header);
  let s = idx[0];
  while (!/^\s*\/\*/.test(lines[s])) s--;
  if (!isHeaderLine(lines[s])) throw new Error('구획 주석 줄 아님: ' + lines[s]);
  let e = s + 1;
  while (e < eLine && !isHeaderLine(lines[e])) e++;
  return { start: s + 1, end: e }; // 1부터 센 줄, end = 다음 구획 주석 바로 앞 줄(포함)
};
const isPureInit = n => {
  if (!n) return false;
  switch (n.type) {
    case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': case 'NullLiteral': return true;
    case 'TemplateLiteral': return n.expressions.length === 0;
    case 'UnaryExpression': return isPureInit(n.argument);
    case 'ArrayExpression': return n.elements.every(isPureInit);
    case 'ObjectExpression': return n.properties.every(p => p.type === 'ObjectProperty' && !p.computed && isPureInit(p.value));
    default: return false;
  }
};

// 옮길 단위(최상위 문) 정하기
const units = []; // { cell, group, name, kind:'fn'|'var', stmt }
const skipped = [];
for (const c of CELLS) for (const g of c.groups) {
  const r = groupRange(g.header);
  g._range = r;
  const stmts = top.filter(st => H(st.node) >= r.start && HE(st.node) <= r.end);
  g._stmts = stmts;
  const fnNames = stmts.filter(st => st.isFunctionDeclaration()).map(st => st.node.id.name);
  const want = g.names || fnNames;
  for (const n of want) {
    const st = stmts.find(x => x.isFunctionDeclaration() && x.node.id.name === n);
    if (!st) throw new Error('묶음에 함수 선언 없음 ' + n + ' @ ' + g.header);
    if (SMOKE.has(n)) { skipped.push({ name: n, why: 'smoke-test FN_NAMES' }); continue; }
    const b = iScope.getBinding(n);
    if (!b || b.constantViolations.length) { skipped.push({ name: n, why: '재대입/중복 선언' }); continue; }
    units.push({ cell: c.file, group: g.header, name: n, kind: 'fn', stmt: st });
  }
  for (const n of (g.moveVars || [])) {
    const st = stmts.find(x => x.isVariableDeclaration() && x.node.declarations.length === 1 && x.node.declarations[0].id.name === n);
    if (!st) throw new Error('묶음에 var 선언 없음 ' + n);
    if (st.node.kind !== 'var') throw new Error('var 아님 ' + n);
    const b = iScope.getBinding(n);
    if (b.constantViolations.length) throw new Error('재대입 있는 var 는 옮기지 않음 ' + n);
    if (!isPureInit(st.node.declarations[0].init)) throw new Error('초기값이 상수 글자가 아님 ' + n);
    units.push({ cell: c.file, group: g.header, name: n, kind: 'var', stmt: st });
  }
}
const UNIT_CELL = Object.fromEntries(units.map(u => [u.name, u.cell]));
const MOVED = new Set(units.map(u => u.name));

// 덩어리: 묶음마다 ㉮ 통째 / ㉯ 선언별
const chunks = [];
for (const c of CELLS) for (const g of c.groups) {
  const mine = units.filter(u => u.group === g.header);
  if (!mine.length) continue;
  const whole = g._stmts.every(st => mine.some(u => u.stmt === st));
  if (whole) {
    const end = Math.max(...mine.map(u => HE(u.stmt.node)));
    const lastNode = mine.find(u => HE(u.stmt.node) === end).stmt.node;
    const tail = lines[end - 1].slice(lastNode.loc.end.column).trim();
    if (tail && !tail.startsWith('//')) throw new Error('끝 줄 뒤에 다른 코드: ' + tail);
    chunks.push({ cell: c.file, group: g.header, names: mine.map(u => u.name), start: g._range.start, end, whole: true });
  } else {
    for (const u of mine) {
      const n = u.stmt.node;
      const idx = g._stmts.indexOf(u.stmt);
      const prevEnd = idx > 0 ? g._stmts[idx - 1].node.end : -1;
      // 바로 앞에 붙은 주석(구획 주석·앞 문보다 뒤에 있는 것만)
      const lead = (n.leadingComments || []).filter(cm => cm.start > prevEnd && (cm.loc.start.line + off) > g._range.start);
      let start = lead.length ? lead[0].loc.start.line + off : H(n);
      // 앞 주석이 구획 주석 줄과 이어진 여러 줄이면(구획 머리 일부) 안전하게 선언 줄부터
      if (lead.length && (lead[0].loc.start.line + off) <= g._range.start) start = H(n);
      const end = HE(n);
      const before = lines[start - 1].slice(0, lines[start - 1].search(/\S/));
      if (lines[start - 1].trim() === '' ) throw new Error('빈 줄 시작 ' + start);
      const firstCol = lead.length && start !== H(n) ? lead[0].loc.start.column : n.loc.start.column;
      if (lines[start - 1].slice(0, firstCol).trim()) throw new Error('첫 줄 앞에 다른 코드: ' + start);
      const tail = lines[end - 1].slice(n.loc.end.column).trim();
      if (tail && !tail.startsWith('//')) throw new Error('끝 줄 뒤에 다른 코드: ' + end + ' ' + tail);
      // 앞 문과 같은 줄을 나누지 않는지
      if (idx > 0 && HE(g._stmts[idx - 1].node) >= start) throw new Error('앞 문과 줄이 겹침 ' + start);
      void before;
      chunks.push({ cell: c.file, group: g.header, names: [u.name], start, end, whole: false });
    }
  }
}
chunks.sort((a, b) => a.start - b.start);
for (let i = 1; i < chunks.length; i++) if (chunks[i].start <= chunks[i - 1].end) throw new Error('덩어리 겹침');
const cellOfLine = l => { const ch = chunks.find(x => l >= x.start && l <= x.end); return ch ? ch.cell : null; };
// 덩어리 안 최상위 문은 옮기는 단위뿐
for (const st of top) {
  const a = H(st.node), b = HE(st.node);
  const ch = chunks.find(x => !(b < x.start || a > x.end));
  if (!ch) continue;
  const nm = st.isFunctionDeclaration() ? st.node.id.name : (st.isVariableDeclaration() && st.node.declarations.length === 1 ? st.node.declarations[0].id.name : null);
  if (!nm || !MOVED.has(nm) || UNIT_CELL[nm] !== ch.cell) throw new Error('덩어리 안에 옮기지 않는 문: ' + a + ' ' + st.node.type);
}

// 옮긴 이름 중 자기 세포 밖에서 쓰는 것 = index.html 이 가져와야 하는 이름
const IMPORTS = {}; const outsideRefs = {};
for (const n of MOVED) {
  const b = iScope.getBinding(n);
  const outs = b.referencePaths.filter(r => cellOfLine(H(r.node)) !== UNIT_CELL[n]);
  if (outs.length) { (IMPORTS[UNIT_CELL[n]] = IMPORTS[UNIT_CELL[n]] || []).push(n); outsideRefs[n] = outs.map(r => H(r.node)); }
}

// 바꿔 쓸 식별자
const edits = [];
const bridged = new Map();
for (const u of units) {
  u.stmt.traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if ((p.parentPath.isObjectMethod() || p.parentPath.isClassMethod()) && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return; // 자기 선언 이름
      if (p.parentPath.isVariableDeclarator() && par.id === p.node && p.parentPath.parentPath.parent === iife.node.body) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = cellOfLine(H(p.node));
      if (!here) throw new Error('세포 미정 줄 ' + H(p.node));
      if (MOVED.has(nm) && UNIT_CELL[nm] === here) return;
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      if (MOVED.has(nm) && isWrite) throw new Error('다른 세포로 간 이름에 대입: ' + nm);
      const repl = 'L.' + nm;
      if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind, moved: MOVED.has(nm) });
      if (isWrite) bridged.get(nm).assigned = true;
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': ' + repl }); return; }
      if (!p.isReferencedIdentifier() && !isWrite) throw new Error('알 수 없는 자리의 이름 ' + nm + ' @' + H(p.node));
      edits.push({ start: p.node.start, end: p.node.end, text: repl });
    }
  });
}
// L. 로 부를 인라인 함수의 최상위 this 검사
for (const [nm, info] of bridged) {
  const b = iScope.getBinding(nm);
  if (!b.path.isFunctionDeclaration()) continue;
  let bad = 0;
  b.path.get('body').traverse({ Function(p) { if (!p.isArrowFunctionExpression()) p.skip(); }, ThisExpression() { bad++; } });
  if (bad) throw new Error('L. 로 부를 인라인 함수가 최상위 this 를 씀: ' + nm);
  void info;
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== code.split('\n').length) throw new Error('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

const kitOf = file => CELLS.find(c => c.file === file);
const out = {};
for (const c of CELLS) {
  const mine = chunks.filter(ch => ch.cell === c.file);
  if (!mine.length) continue;
  const body = [];
  mine.forEach((ch, i) => { if (i) body.push(''); body.push(...range(ch.start, ch.end)); });
  const names = units.filter(u => u.cell === c.file).sort((a, b) => H(a.stmt.node) - H(b.stmt.node)).map(u => u.name);
  const head = [
    '/**',
    ' * ' + c.title,
    ' *',
    ' * #' + TASK + ' (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.',
    ...mine.map(ch => ' *   ' + ch.names.join(' · ') + ' — 「' + ch.group + '」(이전 전 ' + ch.start + '~' + ch.end + '줄' + (ch.whole ? ', 구획 주석 포함' : '') + ')'),
    ...(c.desc || []).map(d => ' * ' + d),
    ' * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.',
    ' * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    "  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.",
    '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
    '  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)',
    '  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};',
    '',
  ];
  const foot = ['', ...names.map(n => '  K.' + n + ' = ' + n + ';'), '', "  if (typeof module !== 'undefined' && module.exports) {", '    module.exports = K;', '  }', "})(typeof window !== 'undefined' ? window : globalThis);", ''];
  out[c.file] = [...head, ...body, ...foot];
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
  const mk = '  /* [#' + TASK + '] ' + m.names.join(' · ') + ' → ' + m.cell + ' 로 옮김(인라인 스크립트 세포화 P0) */';
  newHtmlLines.splice(m.start - 1, m.end - m.start + 1, mk);
}
// 이음매 자리: 설정의 anchor 줄(글자 그대로 한 줄) 바로 앞
const anchorIdx = newHtmlLines.findIndex((l, i) => i >= sLine && l === CFG.seamBefore);
if (anchorIdx < 0) throw new Error('이음매 자리 없음: ' + CFG.seamBefore);
const usIdx0 = newHtmlLines.findIndex((l, i) => i >= sLine && l.includes('"use strict";'));
const alreadyExposed = new Map();
for (let i = usIdx0; i < anchorIdx; i++) { const re = /get ([A-Za-z_$][\w$]*)\(\)/g; let m; while ((m = re.exec(newHtmlLines[i]))) alreadyExposed.set(m[1], (alreadyExposed.get(m[1]) || '') + newHtmlLines[i]); }
const kitVars = {};
for (let i = usIdx0; i < anchorIdx; i++) { const m = newHtmlLines[i].match(/^  var (_\w+Kit) = window\.(\w+);$/); if (m) kitVars[m[2]] = m[1]; }
const bridgedSorted = [...bridged.keys()].sort();
const needExpose = bridgedSorted.filter(n => !alreadyExposed.has(n) || (bridged.get(n).assigned && !/set /.test(alreadyExposed.get(n)) ));
const header = [
  '  /* ============ [#' + TASK + '] 인라인 스크립트 세포화 P0 이음매 (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs/MODULE-SPLIT-PROTOCOL.md, 1차 #TASK-ES-423 과 같은 틀) ============',
  '     ① 가져오기: ' + Object.keys(out).join(' · ') + ' 로 옮긴 선언 중 이 스코프에서 쓰는 것을 같은 이름으로 가져온다(키트는 앞선 이음매의 탭 키트 변수를 그대로 쓴다 — 전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프 이름 중 앞선 이음매가 아직 노출하지 않은 것만 getter 로 더한다(스코프 분석으로 뽑았다). 옮긴 코드가 대입하는 이름만 setter 를 단다. */',
];
for (const c of CELLS) {
  const imps = (IMPORTS[c.file] || []).slice().sort((a, b) => H(units.find(u => u.name === a).stmt.node) - H(units.find(u => u.name === b).stmt.node));
  if (!imps.length) continue;
  const kv = kitVars[c.kit];
  if (!kv) throw new Error('앞선 이음매에 키트 변수 없음: ' + c.kit);
  for (const n of imps) header.push('  var ' + n + ' = ' + kv + '.' + n + ';');
}
if (needExpose.length) {
  header.push("  window.OurgoalAppScope.expose('index.html', {");
  needExpose.forEach((n, i) => {
    const info = bridged.get(n);
    if (info.moved && !(IMPORTS[UNIT_CELL[n]] || []).includes(n)) throw new Error('다른 세포가 부르는 옮긴 이름이 가져오기에 없음 ' + n);
    const comma = i === needExpose.length - 1 ? '' : ',';
    header.push('    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma);
  });
  header.push('  });');
}
header.push('');
newHtmlLines.splice(anchorIdx, 0, ...header);
// script 태그: 설정의 beforeTag 줄 앞, 같은 줄(순증가 0줄)
for (const c of CELLS) {
  if (!out[c.file]) continue;
  const idx = newHtmlLines.findIndex(l => l.includes(c.beforeTag));
  if (idx < 0) throw new Error('태그 없음 ' + c.beforeTag);
  const tag = '<script src="' + c.file + '"></script>';
  newHtmlLines[idx] = newHtmlLines[idx].replace(c.beforeTag, tag + c.beforeTag);
}

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = {
  task: TASK, scriptHtmlLines: [sLine + 1, eLine],
  moved: Object.fromEntries(Object.keys(out).map(f => [f, units.filter(u => u.cell === f).map(u => u.name)])),
  movedKinds: Object.fromEntries(units.map(u => [u.name, u.kind])),
  chunks: chunks.map(ch => ({ cell: ch.cell, group: ch.group, names: ch.names, start: ch.start, end: ch.end, lines: ch.end - ch.start + 1, whole: ch.whole })),
  markers: merged.map(m => ({ names: m.names, lines: [m.start, m.end], file: m.cell })),
  imports: IMPORTS, outsideRefs, skipped,
  bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: alreadyExposed.has(n) })), newlyExposed: needExpose, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: newHtmlLines.length,
  files: Object.fromEntries(Object.entries(out).map(([f, a]) => [f, a.length - 1])),
};
const metaOut = process.env.MODULE_SPLIT_OUT || require('os').tmpdir();
fs.writeFileSync(path.join(metaOut, 'gen-inline-p0-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', needExpose.length, 'imports', JSON.stringify(IMPORTS));
console.log('skipped', JSON.stringify(skipped));
console.log('index.html lines', lines.length, '->', newHtmlLines.length);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
