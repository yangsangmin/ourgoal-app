'use strict';
// 인라인 스크립트 세포화 P1 구역 생성기(#TASK-ES-436~): index.html 인라인 IIFE 의 책임 묶음(scripts/inline-script-map.js 지도의 묶음)을 글자 그대로 세포 파일로 옮긴다.
// 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)를 일반화했다. 같은 점: 이름 참조만 바꾼다(인라인 IIFE 스코프 이름은 L.<이름>, 같은 세포 안 이름은 그대로,
// 같은 키트를 쓰는 다른 세포로 간 이름은 K.<이름>, 다른 키트 세포로 간 이름은 L.<이름>(IIFE 머리에서 가져온 이름을 getter 로 노출)). 손으로 옮기지 않는다.
// 다른 점(부분 묶음): 묶음 안의 모든 최상위 문이 옮길 수 있는 함수 선언이면 1차처럼 구획 주석부터 통째로 옮긴다(whole).
//   아니면(로드 중 바로 도는 문·최상위 변수·smoke-test FN_NAMES 함수·설정의 keep 이 있으면) 구획 주석과 그 문들은 원래 자리에 남기고
//   함수 선언만(바로 앞 자기 주석 포함) 옮긴다(part). 남는 문이 옮긴 함수를 부르면 IIFE 머리에서 같은 이름으로 가져온 것을 부른다.
// 검사(어기면 멈춘다): smoke-test FN_NAMES 함수 이동 0 · 옮길 함수 재대입/중복 선언 0 · 옮길 함수의 최상위 this/arguments 0 ·
//   L.<이름> 으로 부를 인라인 함수의 최상위 this 0(arguments 는 부르는 방식과 무관) · 옮길 코드 안 L/K/global 이름 충돌 0 · 덩어리 경계가 문 중간을 가르지 않음.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-p1.js <APP_DIR> <설정 .json> [이전 전 index.html] [--dry]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const [APP, CFG_FILE, SRC_ARG] = argv.filter(a => a !== '--dry');
const CFG = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
const TASK = CFG.task;
const SRC = SRC_ARG || path.join(APP, 'index.html');
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
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);

// smoke-test FN_NAMES(인라인에서 글자로 잘라 가는 함수)
const SMOKE = new Set();
{
  const smoke = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8');
  const m = smoke.match(/const FN_NAMES = \[([\s\S]*?)\];/);
  if (!m) throw new Error('smoke-test FN_NAMES 못 읽음');
  for (const x of m[1].matchAll(/'([A-Za-z_$][\w$]*)'/g)) SMOKE.add(x[1]);
}

// 묶음 경계(지도와 같은 규칙): 최상위 문 앞 구획 주석. 각 구획 주석 → 그 묶음의 최상위 문 목록
const headerAt = []; // {line, endLine, text, stmts:[]}
for (const st of top) {
  for (const c of (st.node.leadingComments || []).filter(isHeader)) {
    if (!headerAt.some(h => h.line === c.loc.start.line + off)) headerAt.push({ line: c.loc.start.line + off, endLine: c.loc.end.line + off, value: c.value, stmts: [] });
  }
  if (headerAt.length) headerAt[headerAt.length - 1].stmts.push(st);
}
const findGroup = header => {
  const hs = headerAt.filter(h => h.value.includes(header));
  if (hs.length !== 1) throw new Error('구획 주석이 하나가 아님(' + hs.length + '): ' + header);
  return hs[0];
};

const fnTopUses = (fnPath, thisOnly) => {
  let bad = 0;
  fnPath.get('body').traverse({
    Function(p) { if (!p.isArrowFunctionExpression()) p.skip(); },
    ThisExpression() { bad++; },
    Identifier(p) { if (!thisOnly && p.node.name === 'arguments' && p.isReferencedIdentifier()) bad++; },
  });
  return bad;
};

// 세포·묶음 → 옮길 함수
const DECL_CELL = {}; const CELL = {}; const plan = [];
for (const c of CFG.cells) {
  CELL[c.key] = c;
  for (const g of c.groups) {
    const grp = findGroup(g.header);
    const keep = new Set(g.keep || []);
    const cls = grp.stmts.map(st => {
      const n = st.node;
      if (!st.isFunctionDeclaration()) return { st, move: false, why: st.isVariableDeclaration() ? '최상위 변수' : '로드 중 문(' + n.type + ')' };
      const name = n.id.name;
      if (keep.has(name)) return { st, name, move: false, why: '설정 keep: ' + (g.keepWhy || '') };
      // #TASK-ES-441(#751) 뒤로 smoke-test 는 인라인 합본(원문 + js/tabs 세포, L. 접두 제거)에서 함수를 잘라 간다 — 설정이 smokeFromBundle 이면 옮겨도 같은 글자를 찾는다(K. 접두가 생기면 아래 검사에서 멈춘다)
      if (SMOKE.has(name) && !CFG.smokeFromBundle) return { st, name, move: false, why: 'smoke-test FN_NAMES' };
      const b = iScope.getBinding(name);
      if (!b || b.constantViolations.length) return { st, name, move: false, why: '재대입/중복 선언' };
      if (fnTopUses(st)) return { st, name, move: false, why: '최상위 this/arguments' };
      return { st, name, move: true };
    });
    const whole = cls.length > 0 && cls.every(x => x.move);
    for (const x of cls) if (x.move) DECL_CELL[x.name] = c.key;
    const title = (grp.value.split('\n').map(l => l.replace(/=+/g, ' ').replace(/\s+/g, ' ').trim()).find(l => l) || g.header);
    plan.push({ cell: c.key, header: g.header, title, groupLine: grp.line, headerEnd: grp.endLine, whole, cls });
  }
}
const MOVED_NAMES = Object.keys(DECL_CELL);
const MOVED = new Set(MOVED_NAMES);
if (DRY) {
  for (const p of plan) {
    console.log((p.whole ? '[통째]' : '[부분]') + ' ' + p.cell + ' ' + p.groupLine + ' ' + p.header);
    for (const x of p.cls) console.log('   ' + (x.move ? '옮김 ' : '남김 ') + H(x.st.node) + '~' + HE(x.st.node) + ' ' + (x.name || x.st.node.type) + (x.why ? ' — ' + x.why : ''));
  }
}

// 덩어리: whole = 구획 주석 첫 줄 ~ 마지막 문 끝 줄. part = 옮길 함수(앞 자기 주석 포함)의 연속 구간.
const chunks = [];
const prevEndOf = st => { const i = top.findIndex(t => t.node === st.node); return i > 0 ? HE(top[i - 1].node) : sLine; };
for (const p of plan) {
  if (p.whole) {
    const start = p.groupLine;
    const end = Math.max(...p.cls.map(x => HE(x.st.node)));
    if (lines[start - 1].slice(0, lines[start - 1].indexOf('/*')).trim()) throw new Error('구획 첫 줄 앞에 다른 코드: ' + start);
    chunks.push({ cell: p.cell, header: p.header, title: p.title, names: p.cls.map(x => x.name), start, end, whole: true });
    continue;
  }
  let cur = null;
  for (const x of p.cls) {
    if (!x.move) { if (cur) { chunks.push(cur); cur = null; } continue; }
    const n = x.st.node;
    const pe = prevEndOf(x.st);
    const own = (n.leadingComments || []).filter(c => !isHeader(c) && c.loc.start.line + off > Math.max(pe, p.headerEnd));
    const start = own.length ? Math.min(...own.map(c => c.loc.start.line + off)) : H(n);
    if (cur) { cur.end = HE(n); cur.names.push(x.name); }
    else cur = { cell: p.cell, header: p.header, title: p.title, names: [x.name], start, end: HE(n), whole: false };
  }
  if (cur) chunks.push(cur);
}
chunks.sort((a, b) => a.start - b.start);
for (let i = 1; i < chunks.length; i++) if (chunks[i].start <= chunks[i - 1].end) throw new Error('덩어리 겹침 ' + chunks[i].start);
for (const ch of chunks) {
  // 덩어리 안 최상위 문은 모두 이 세포로 옮기는 함수여야 한다
  for (const st of top) {
    const a = H(st.node), b = HE(st.node);
    if (b < ch.start || a > ch.end) continue;
    if (!(st.isFunctionDeclaration() && MOVED.has(st.node.id.name) && DECL_CELL[st.node.id.name] === ch.cell)) throw new Error('덩어리 안에 옮기지 않는 문: ' + a + ' ' + st.node.type);
    if (a < ch.start || b > ch.end) throw new Error('덩어리가 문을 가름: ' + a);
  }
  const first = lines[ch.start - 1];
  const firstCodeCol = first.search(/\S/);
  if (!/^(\/\*|\/\/|function|async function)/.test(first.slice(firstCodeCol))) throw new Error('덩어리 첫 줄이 주석/함수로 시작하지 않음: ' + ch.start + ' ' + first.slice(0, 80));
  const lastNode = top.map(t => t.node).find(n => HE(n) === ch.end && H(n) >= ch.start);
  const tail = lines[ch.end - 1].slice(lastNode.loc.end.column).trim();
  if (tail && !tail.startsWith('//')) throw new Error('끝 줄 뒤에 다른 코드: ' + ch.end + ' ' + tail);
}
const cellOfLine = l => { const ch = chunks.find(x => l >= x.start && l <= x.end); return ch ? ch.cell : null; };

// 옮길 코드 안 L·K·global 충돌 검사
for (const n of MOVED_NAMES) {
  iScope.getBinding(n).path.traverse({ Identifier(p) {
    if (!['L', 'K', 'global'].includes(p.node.name)) return;
    const par = p.parent;
    if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
    if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
    throw new Error('옮길 코드에 L/K/global 이름: ' + n + ' 줄 ' + H(p.node));
  } });
}

// 바꿔 쓸 식별자
const edits = []; const bridged = new Map(); const crossImports = new Set();
for (const n of MOVED_NAMES) {
  iScope.getBinding(n).path.traverse({
    Identifier(p) {
      const nm = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isClassMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = cellOfLine(H(p.node));
      if (!here) throw new Error('세포 미정 줄 ' + H(p.node));
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression();
      let repl;
      if (MOVED.has(nm)) {
        if (DECL_CELL[nm] === here) return;
        if (CELL[DECL_CELL[nm]].kit === CELL[here].kit) { repl = 'K.' + nm; if (SMOKE.has(n)) throw new Error('smoke 함수 안에 K. 접두가 생김(합본 추출이 L. 만 뗀다): ' + n + ' → ' + nm); }
        else { repl = 'L.' + nm; crossImports.add(nm); if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: 'moved' }); }
      } else {
        repl = 'L.' + nm;
        if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
        if (isWrite) bridged.get(nm).assigned = true;
        // L.<함수> 로 부르면 this 가 L 이 된다 — 그 함수가 최상위 this 를 쓰면 동작이 바뀐다
        if (b.path.isFunctionDeclaration() && fnTopUses(b.path, true)) throw new Error('L. 로 부를 인라인 함수가 최상위 this 를 씀: ' + nm);
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

// 옮긴 코드 밖(index.html 에 남는 코드)에서 부르는 이름 + 다른 키트 세포가 L. 로 부르는 이름 = IIFE 머리에서 가져올 이름
const IMPORTS = {}; const outsideRefs = {};
for (const n of MOVED_NAMES) {
  const outs = iScope.getBinding(n).referencePaths.filter(r => !cellOfLine(H(r.node)));
  if (outs.length || crossImports.has(n)) { (IMPORTS[DECL_CELL[n]] = IMPORTS[DECL_CELL[n]] || []).push(n); outsideRefs[n] = outs.map(r => H(r.node)); }
}

// 세포 파일
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
  ' * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,',
  ' * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.',
  ' * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.',
  ' * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
];
const namesOf = key => MOVED_NAMES.filter(n => DECL_CELL[n] === key).sort((a, b) => H(iScope.getBinding(a).path.node) - H(iScope.getBinding(b).path.node));
const out = {}; const cellChunkLines = [];
for (const c of CFG.cells) {
  const mine = chunks.filter(ch => ch.cell === c.key);
  const desc = [' * ' + c.title, ' *', ' * #' + TASK + ' (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —',
    ...mine.map(ch => ' *   ' + ch.names.join(' · ') + '(이전 전 ' + ch.start + '~' + ch.end + '줄' + (ch.whole ? ', 구획 주석 포함' : '') + ' · 구획 「' + ch.title.slice(0, 60) + '」)'),
    ...(c.desc || []).map(d => ' * ' + d)];
  const head = ['/**', ...desc, ...COMMON_NOTE, ' */', '(function(global) {', "  'use strict';", ...HEADER_BRIDGE(c.kit), ''];
  const body = [];
  mine.forEach((ch, i) => {
    if (i) body.push('');
    const at = head.length + body.length + 1;
    body.push(...range(ch.start, ch.end));
    cellChunkLines.push({ file: c.file, cellStart: at, cellEnd: at + (ch.end - ch.start), origStart: ch.start, origEnd: ch.end, names: ch.names, whole: ch.whole });
  });
  out[c.file] = [...head, ...body, '', ...FOOT(namesOf(c.key))];
}

// index.html 새 판: 덩어리마다 표지 주석 한 줄(같은 세포로 가는 이웃 덩어리는 사이가 빈 줄뿐이면 합친다)
const blankBetween = (a, b) => { for (let l = a + 1; l < b; l++) if (lines[l - 1].trim() !== '') return false; return true; };
const merged = [];
for (const ch of chunks) {
  const last = merged[merged.length - 1];
  if (last && last.cell === ch.cell && (last.end + 1 === ch.start || blankBetween(last.end, ch.start))) { last.end = ch.end; last.names.push(...ch.names); last.whole = last.whole || ch.whole; }
  else merged.push({ cell: ch.cell, start: ch.start, end: ch.end, names: ch.names.slice(), whole: ch.whole });
}
const newHtmlLines = lines.slice();
for (const m of merged.slice().sort((x, y) => y.start - x.start)) {
  const mk = '  /* [#' + TASK + '] ' + m.names.join(' · ') + ' → ' + CELL[m.cell].file + ' 로 옮김(인라인 스크립트 세포화 P1' + (m.whole ? ' — 구획 주석 포함' : '') + ') */';
  newHtmlLines.splice(m.start - 1, m.end - m.start + 1, mk);
}
// IIFE 머리 이음매: [#TASK-ES-423] 이음매 expose 블록 바로 다음(다른 구역 빌더와 같은 자리를 피한다)
const seamAnchor = CFG.seamAfter || '[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매';
const aIdx = newHtmlLines.findIndex(l => l.includes(seamAnchor));
if (aIdx < 0) throw new Error('이음매 기준 줄 없음: ' + seamAnchor);
let aEnd = -1;
for (let i = aIdx; i < newHtmlLines.length; i++) if (newHtmlLines[i] === '  });') { aEnd = i; break; }
if (aEnd < 0 || aEnd - aIdx > 120) throw new Error('기준 이음매 expose 끝 못 찾음');
// 이미 노출된 이름(인라인 전체의 expose getter/setter)
const usIdx0 = newHtmlLines.findIndex((l, i) => i >= sLine && l.includes('"use strict";'));
const exposedGet = new Set(), exposedSet = new Set();
for (let i = usIdx0; i < newHtmlLines.length && i < eLine; i++) {
  for (const m of newHtmlLines[i].matchAll(/get ([A-Za-z_$][\w$]*)\(\)\s*\{\s*return /g)) exposedGet.add(m[1]);
  for (const m of newHtmlLines[i].matchAll(/set ([A-Za-z_$][\w$]*)\(v\)/g)) exposedSet.add(m[1]);
}
const kitVarDeclared = new Set();
for (let i = usIdx0; i <= aEnd; i++) { const m = newHtmlLines[i].match(/^  var (_\w+Kit) = window\.(\w+);$/); if (m) kitVarDeclared.add(m[1] + '=' + m[2]); }
const bridgedSorted = [...bridged.keys()].sort();
const bridgedNew = bridgedSorted.filter(n => !exposedGet.has(n) || (bridged.get(n).assigned && !exposedSet.has(n)));
const header = ['',
  '  /* ============ [#' + TASK + '] ' + (CFG.seamTitle || '인라인 스크립트 세포화 P1 이음매') + ' (docs/architecture/INLINE-SCRIPT-MAP.md 지도 · docs/specs/MODULE-SPLIT-PROTOCOL.md, #TASK-ES-423 과 같은 틀) ============',
  '     ① 가져오기: ' + CFG.cells.map(c => c.file).join(' · ') + ' 로 옮긴 함수 중 이 스코프(또는 다른 키트 세포)에서 부르는 것을 같은 이름으로 가져온다(키트는 앞선 이음매의 탭 키트 변수를 그대로 쓴다 — 전역에 새 이름을 만들지 않는다).',
  '     ② 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프 이름 중 앞선 이음매가 아직 노출하지 않은 것만 getter 로 더한다(스코프 분석으로 뽑았다). 옮긴 코드가 대입하는 이름만 setter 를 단다. */',
];
for (const c of CFG.cells) {
  if (!kitVarDeclared.has(c.kitVar + '=' + c.kit)) throw new Error('앞선 이음매에 키트 변수 없음: ' + c.kitVar);
}
const importLines = [];
for (const c of CFG.cells) for (const n of (IMPORTS[c.key] || [])) importLines.push('  var ' + n + ' = ' + c.kitVar + '.' + n + ';');
header.push(...importLines);
if (bridgedNew.length) {
  header.push("  window.OurgoalAppScope.expose('index.html', {");
  bridgedNew.forEach((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedNew.length - 1 ? '' : ',';
    header.push('    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma);
  });
  header.push('  });');
}
newHtmlLines.splice(aEnd + 1, 0, ...header);
const seamRange = [aEnd + 2, aEnd + 1 + header.length]; // 새 index.html 1-기준 줄
// script 태그: 그 탭 index.js 태그 앞, 같은 줄(순증가 0줄)
const tagEdits = [];
for (const c of CFG.cells) {
  const idx = newHtmlLines.findIndex(l => l.includes(c.beforeTag));
  if (idx < 0) throw new Error('태그 없음 ' + c.beforeTag);
  const tag = '<script src="' + c.file + '"></script>';
  newHtmlLines[idx] = newHtmlLines[idx].replace(c.beforeTag, tag + c.beforeTag);
  tagEdits.push({ file: c.file, tag });
}
const meta = { task: TASK, scriptHtmlLines: [sLine + 1, eLine], plan: plan.map(p => ({ cell: p.cell, header: p.header, groupLine: p.groupLine, whole: p.whole, stmts: p.cls.map(x => ({ line: H(x.st.node), end: HE(x.st.node), name: x.name || null, type: x.st.node.type, moved: x.move, why: x.why || null })) })),
  chunks, cellChunkLines, markers: merged.map(m => ({ names: m.names, lines: [m.start, m.end], file: CELL[m.cell].file })),
  imports: IMPORTS, outsideRefs, crossImports: [...crossImports].sort(), seamRange, tagEdits,
  bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n), alreadyExposedBefore: exposedGet.has(n) })), newlyExposed: bridgedNew, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: newHtmlLines.length, cellFiles: Object.fromEntries(Object.entries(out).map(([f, a]) => [f, a.length - 1])) };
const metaOut = process.env.MODULE_SPLIT_OUT || require('os').tmpdir();
if (!DRY) {
  fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
  for (const [f, arr] of Object.entries(out)) { fs.mkdirSync(path.dirname(path.join(APP, f)), { recursive: true }); fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8'); }
  fs.writeFileSync(path.join(metaOut, 'gen-inline-p1-meta.json'), JSON.stringify(meta, null, 1));
}
console.log('moved', MOVED_NAMES.length, 'edits', uniq.length, 'bridged', bridgedSorted.length, 'newly exposed', bridgedNew.length, 'imports', JSON.stringify(IMPORTS));
console.log('index.html lines', lines.length, '->', newHtmlLines.length);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
