'use strict';
// 인라인 어려움 묶음 생성기(#TASK-ES-439) — 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md
// index.html 인라인 IIFE 의 책임 묶음(scripts/inline-script-map.js 지도의 묶음)을 설정 파일대로 세포 파일로 글자 그대로 옮긴다.
// 1차 생성기(gen-inline-split-1.js, #TASK-ES-423)는 "묶음 안에 옮기지 않는 문이 있으면 멈춘다". 이 생성기는 어려움 유형을 표준 이음매로 푼다:
//   · 함수 선언                      → 세포로 옮김. index.html 은 IIFE 머리에서 같은 이름으로 가져온다(var X = _kit.X — 끌어올림과 같은 효과).
//   · 순수 상수(초기값에 이름·호출 0, 재대입 0) → 세포로 옮김 + 같은 이름으로 가져옴(같은 객체 — 바깥의 내용 변경도 그대로 보인다).
//   · 상태 변수(재대입 있음·초기값이 실행되는 식) → 원래 자리에 그대로 둔다. 옮긴 코드는 L.<이름> getter 로 읽고, 대입하면 setter 를 단다(유형 A1·A2).
//   · window.X = … 노출 문(B1)       → 원래 자리에 그대로 둔다(노출 순서·바깥 파일 덮어쓰기 순서 보존, 인라인 on*="X()" 도 그대로 닿는다 — 유형 C·J).
//   · 설정 take 의 keepRest: true → 이 묶음에서 이름을 고르지 않은 문은 원래 자리에 둔다(묶음을 나눠 옮길 때).
//   · 로드 중 다른 문(B2·B3)         → 4줄 이상이고 감싸도 안전하면 본문을 세포 함수로 옮기고 원래 자리에 그 함수 부르는 한 줄을 남긴다(호출 순서 보존).
//                                       3줄 이하이거나 감쌀 수 없으면(IIFE 로 끌어올려지는 var·최상위 this/arguments/return) 그대로 둔다.
// 이름 참조만 바꾼다: 인라인 IIFE 스코프 이름은 L.<이름>(js/core/app-scope.js 통로), 같은 세포 안 이름은 그대로.
// 머리 이음매는 구역 자리 표지(`/* [어려움 이음매 자리 Hn] */`) 바로 아래에 넣는다 — 구역마다 자리가 달라 병렬 빌더의 병합 충돌이 나지 않는다.
// 손으로 옮기지 않는다. 결과를 바꾸려면 설정을 바꿔 다시 돌린다(입력 = 이전 전 index.html).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node gen-inline-hard.js <APP_DIR> <설정.json> [이전 전 index.html]
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const APP = process.argv[2];
const CFG = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const SRC = process.argv[4] || path.join(APP, 'index.html');
const TAG = CFG.task; // 예: 'TASK-ES-439'
const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const fail = m => { throw new Error(m); };

// smoke-test FN_NAMES(시험지가 인라인에서 함수를 잘라 실행) — 옮기지 않는다(MODULE-SPLIT-PROTOCOL 1절 (라), 유형 F2)
const smokeFn = (() => { const s = fs.readFileSync(path.join(APP, 'scripts', 'smoke-test.js'), 'utf8'); const m = s.match(/const FN_NAMES = \[([\s\S]*?)\];/); if (!m) fail('smoke-test FN_NAMES 못 읽음'); return new Set((m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1))); })();

// ── 묶음 경계(지도와 같은 규칙: 구획 주석 `/* ===` 에서 다음 구획 주석 앞까지)
const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
const headers = [];
for (const st of top) for (const c of (st.node.leadingComments || [])) if (isHeader(c)) headers.push({ line: c.loc.start.line + off, endLine: c.loc.end.line + off, text: c.value, stmt: st });
const groupRange = title => {
  const hs = headers.filter(h => h.text.includes(title));
  if (hs.length !== 1) fail('구획 주석이 ' + hs.length + '개: ' + title);
  const i = headers.indexOf(hs[0]);
  return { start: hs[0].line, hEnd: hs[0].endLine, end: i + 1 < headers.length ? headers[i + 1].line - 1 : eLine };
};

// ── 최상위 문 분류
const isPureInit = node => {
  if (!node) return true;
  let pure = true;
  const walk = n => {
    if (!pure || !n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    switch (n.type) {
      case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': case 'NullLiteral': case 'RegExpLiteral': case 'TemplateElement': return;
      case 'FunctionExpression': case 'ArrowFunctionExpression': return; // 본문은 부를 때 돈다
      case 'ObjectExpression': return n.properties.forEach(p => { if (p.type !== 'ObjectProperty' || p.computed) { if (p.type === 'ObjectMethod' && !p.computed) return; pure = false; return; } walk(p.value); });
      case 'ArrayExpression': return n.elements.forEach(walk);
      case 'TemplateLiteral': return n.expressions.length ? (pure = false) : undefined;
      case 'UnaryExpression': return n.operator === '-' ? walk(n.argument) : (pure = false);
      default: pure = false;
    }
  };
  walk(node);
  return pure;
};
const topThisArgs = p => {
  let bad = 0;
  p.traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
  return bad;
};
const wrapSafe = st => {
  const why = [];
  for (const [n, b] of Object.entries(iScope.bindings)) { const l = H(b.path.node); if (l >= H(st.node) && l <= HE(st.node)) why.push('IIFE 로 끌어올려지는 선언 ' + n); }
  if (topThisArgs(st)) why.push('최상위 this/arguments');
  st.traverse({ ReturnStatement(q) { if (q.getFunctionParent() === iife) why.push('최상위 return'); } });
  return why;
};

const cellByKey = Object.fromEntries(CFG.cells.map(c => [c.key, c]));
const plan = []; // { cell, action: move|wrap|keep, st, start, end, segStart, names, wrapName, why }
for (const c of CFG.cells) {
  for (const t of c.take) {
    const r = groupRange(t.group);
    const sts = top.filter(s => H(s.node) >= r.start && HE(s.node) <= r.end);
    let wrapK = 0;
    sts.forEach((st, k) => {
      const prevEnd = k ? HE(sts[k - 1].node) : r.start - 1;
      if (k && H(st.node) === prevEnd) fail('두 문이 한 줄에: ' + H(st.node));
      const tail = lines[HE(st.node) - 1].slice(st.node.loc.end.column).trim();
      if (tail && !tail.startsWith('//')) fail('문 끝 줄 뒤에 다른 코드: ' + HE(st.node));
      // 앞 주석·빈 줄은 그 문을 따라간다(묶음 첫 문은 구획 주석부터)
      const item = { cell: c.key, group: t.group, hEnd: r.hEnd, gStart: r.start, gEnd: r.end, st, start: H(st.node), end: HE(st.node), segStart: k ? prevEnd + 1 : r.start, names: [] };
      const mine = n => t.all || (t.names || []).includes(n);
      if (st.isFunctionDeclaration()) {
        const n = st.node.id.name; item.names = [n];
        if (!mine(n)) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) item.why = '이번 범위 밖(keepRest) — 원래 자리'; return plan.push(item); }
        const b = iScope.getBinding(n);
        if (smokeFn.has(n)) fail('smoke-test FN_NAMES 함수 — 시험지 선행 PR 이 먼저(유형 F2): ' + n);
        if (b.constantViolations.length) fail('함수 이름 재대입(유형 H) — 개별 설계: ' + n);
        if (topThisArgs(st.get('body'))) fail('최상위 this/arguments(유형 K) — 옮기지 않는다: ' + n);
        item.action = 'move';
      } else if (st.isVariableDeclaration()) {
        item.names = st.node.declarations.map(d => d.id.name);
        const movable = st.node.declarations.every(d => d.id.type === 'Identifier' && iScope.getBinding(d.id.name).constantViolations.length === 0 && isPureInit(d.init) && !smokeFn.has(d.id.name))
          && st.node.declarations.every(d => !d.init || !/Function|Arrow/.test(d.init.type) || topThisArgs(st) === 0);
        if (!item.names.some(mine)) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) item.why = '이번 범위 밖(keepRest) — 원래 자리'; return plan.push(item); }
        if (!item.names.every(mine)) fail('한 var 문의 이름을 일부만 가져감: ' + item.names.join(','));
        item.action = movable ? 'move' : 'keep';
        if (item.action === 'keep') item.why = '상태 변수(재대입 또는 실행되는 초기값) — 원래 자리에 두고 L getter/setter 로 읽는다';
      } else if (st.isClassDeclaration()) {
        item.names = [st.node.id.name]; item.action = 'keep'; item.why = 'class 선언은 이번 틀 밖';
      } else {
        const e = st.isExpressionStatement() && st.node.expression;
        const lineCount = HE(st.node) - H(st.node) + 1;
        if (e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window' && lineCount <= 3) { item.action = 'keep'; item.why = 'window 노출 — 원래 자리(순서 보존)'; }
        else if (!t.all && !(t.wrap || []).length) { item.action = t.keepRest ? 'keep' : 'skip'; if (t.keepRest) item.why = '이번 범위 밖(keepRest) — 원래 자리'; }
        else if (lineCount <= 3) { item.action = 'keep'; item.why = '3줄 이하 로드 중 문 — 원래 자리'; }
        else {
          const why = wrapSafe(st);
          if (why.length) { item.action = 'keep'; item.why = '감쌀 수 없음: ' + why.join(', '); }
          else {
            const wn = (t.wrap || [])[wrapK++];
            if (!wn) fail('감쌀 로드 중 문에 이름이 없다(설정 wrap): ' + H(st.node) + '~' + HE(st.node));
            if (iScope.hasBinding(wn) || iScope.hasGlobal && iScope.hasGlobal(wn)) fail('감쌀 함수 이름이 이미 있다: ' + wn);
            item.action = 'wrap'; item.wrapName = wn; item.names = [wn];
          }
        }
      }
      plan.push(item);
    });
    if ((t.wrap || []).length !== wrapK) fail('설정 wrap 이름 수(' + (t.wrap || []).length + ')와 감싼 문 수(' + wrapK + ')가 다르다: ' + t.group);
  }
}
// 같은 문을 두 세포가 가져가면 안 된다 · skip 은 다른 세포가 가져가야 한다
const byStart = new Map();
for (const it of plan) { const k = it.start; if (!byStart.has(k)) byStart.set(k, []); byStart.get(k).push(it); }
const finalPlan = [];
for (const [, its] of [...byStart].sort((a, b) => a[0] - b[0])) {
  const out = its.filter(i => i.action === 'move' || i.action === 'wrap');
  if (out.length > 1) fail('같은 문을 두 세포가 가져감: ' + its[0].start);
  if (out.length && its.some(i => i.action === 'keep')) fail('한 세포는 옮기고 다른 세포는 남김: ' + its[0].start);
  const real = out.length ? out : its.filter(i => i.action === 'keep').slice(0, 1);
  if (!real.length) { const s = its[0]; fail('어느 세포도 가져가지 않는 문(names 에 빠짐): ' + s.start + ' ' + (s.names.join(',') || s.st.node.type)); }
  finalPlan.push(real[0]);
}
// 묶음에 원래 자리에 남는 문이 있으면 구획 주석은 index.html 에 남긴다(지도의 묶음 이름·경계가 그대로 — 남은 문이 앞 묶음에 붙지 않는다)
for (const it of finalPlan) {
  if (it.segStart !== it.gStart || it.action === 'keep') continue;
  if (finalPlan.some(x => x.action === 'keep' && x.start >= it.gStart && x.end <= it.gEnd)) it.segStart = it.hEnd + 1;
}
const moved = finalPlan.filter(i => i.action === 'move');
const wrapped = finalPlan.filter(i => i.action === 'wrap');
const kept = finalPlan.filter(i => i.action === 'keep');
const MOVED_NAMES = new Set(moved.flatMap(i => i.names));
const CELL_OF = new Map(moved.flatMap(i => i.names.map(n => [n, i.cell])));
const outPieces = finalPlan.filter(i => i.action !== 'keep');
const cellOfLine = l => { const it = outPieces.find(x => l >= x.segStart && l <= x.end); return it ? it.cell : null; };

// ── 이름 바꿔 쓰기(옮기는 문·감싸는 문 안)
const edits = []; const bridged = new Map();
for (const it of outPieces) {
  it.st.traverse({
    Identifier(p) {
      const nm = p.node.name, par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isClassMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(nm);
      if (!b || b.scope !== iScope) return;
      const here = it.cell;
      if (MOVED_NAMES.has(nm) && CELL_OF.get(nm) === here) return; // 같은 세포 안 — 그대로
      if (it.action === 'move' && it.names.includes(nm) && (p.parentPath.isFunctionDeclaration() || p.parentPath.isVariableDeclarator()) && par.id === p.node) return;
      const isWrite = (p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression() || (p.parentPath.isAssignmentPattern() && par.left === p.node) || p.parentPath.isArrayPattern() || (p.parentPath.isObjectProperty() && p.parentPath.parentPath.isObjectPattern());
      if (isWrite && b.kind === 'const') fail('const 에 대입: ' + nm);
      if (!bridged.has(nm)) bridged.set(nm, { assigned: false, kind: b.kind });
      if (isWrite) bridged.get(nm).assigned = true;
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: nm + ': L.' + nm }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: 'L.' + nm });
    }
  });
}
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n');
if (newLines.length !== code.split('\n').length) fail('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off];
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };

// ── 세포 파일
const outFiles = {};
for (const c of CFG.cells) {
  const its = outPieces.filter(i => i.cell === c.key).sort((a, b) => a.segStart - b.segStart);
  if (!its.length) continue;
  const body = [];
  let prevEnd = -2;
  for (const it of its) {
    if (it.segStart !== prevEnd + 1 && body.length) body.push('');
    body.push('  /* ---- 이전 전 index.html ' + it.segStart + '~' + it.end + '줄(#' + TAG + ' 생성기 표지) ---- */');
    if (it.action === 'wrap') {
      body.push('  function ' + it.wrapName + '() { /* [#' + TAG + '] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */');
      body.push(...range(it.segStart, it.end));
      body.push('  } /* ' + it.wrapName + ' */');
    } else body.push(...range(it.segStart, it.end));
    prevEnd = it.end;
  }
  const exportNames = its.flatMap(i => i.names);
  const pieces = its.map(i => i.segStart + '~' + i.end).join(' · ');
  outFiles[c.file] = [
    '/**',
    ' * ' + c.title,
    ' *',
    ...c.desc.map(d => ' * ' + d),
    ' * #' + TAG + '(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 ' + pieces + '줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.',
    ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.',
    ' * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.',
    ' * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    '  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.',
    '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
    '  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다',
    '  var K = global.' + c.kit + ' = global.' + c.kit + ' || {};',
    '',
    ...body,
    '',
    ...exportNames.map(n => '  K.' + n + ' = ' + n + ';'),
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = K;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
}

// ── index.html 새 판
let nh = lines.slice();
// (1) 묶음 자리: 옮긴 연속 구간 → 표지 한 줄, 감싼 문 → 부르는 한 줄, 남긴 문 → 그대로
const repl = [];
{
  const sorted = finalPlan.slice().sort((a, b) => a.segStart - b.segStart);
  let run = null;
  const flush = () => { if (run) { repl.push(run); run = null; } };
  for (const it of sorted) {
    if (it.action === 'move') {
      if (run && run.kind === 'move' && run.cell === it.cell && run.end + 1 === it.segStart) { run.end = it.end; run.names.push(...it.names); }
      else { flush(); run = { kind: 'move', cell: it.cell, segStart: it.segStart, end: it.end, names: it.names.slice() }; }
    } else if (it.action === 'wrap') { flush(); repl.push({ kind: 'wrap', cell: it.cell, segStart: it.segStart, end: it.end, names: [it.wrapName] }); }
    else flush();
  }
  flush();
}
for (const r of repl.slice().sort((a, b) => b.segStart - a.segStart)) {
  const file = cellByKey[r.cell].file;
  const line = r.kind === 'move'
    ? '  /* [#' + TAG + '] ' + r.names.join(' · ') + ' → ' + file + ' 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */'
    : '  ' + r.names[0] + '(); /* [#' + TAG + '] 로드 중 문(앞 주석 포함) → ' + file + ' 의 ' + r.names[0] + ' 로 옮김 — 원래 자리에서 부른다 */';
  nh.splice(r.segStart - 1, r.end - r.segStart + 1, line);
}
// (2) 머리 이음매: 구역 자리 표지 아래(없으면 #TASK-ES-423 이음매 다음에 자리 표지 묶음을 만든다)
const usIdx = nh.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const SLOT_RE = s => new RegExp('^  /\\* \\[어려움 이음매 자리 ' + s + '[ \\]]');
if (!nh.some(l => SLOT_RE(CFG.slot).test(l))) {
  const a = nh.findIndex(l => l.includes('[#TASK-ES-423] 인라인 스크립트 세포화 1차 이음매'));
  if (a < 0) fail('1차 이음매(#TASK-ES-423) 없음');
  let aEnd = -1; for (let i = a; i < nh.length; i++) if (nh[i] === '  });') { aEnd = i; break; }
  if (aEnd < 0 || aEnd - a > 80) fail('1차 이음매 expose 끝 못 찾음');
  nh.splice(aEnd + 1, 0,
    '',
    '  /* [#TASK-ES-439] 인라인 어려움 묶음 이음매 자리 (docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 생성기 docs/design/harness/module-split/gen-inline-hard.js)',
    '     구역(H1~H4·HO 기관)마다 자기 자리 표지 바로 아래에 ① 가져오기(var X = _키트.X) ② 앱 스코프 통로(expose getter·setter)를 생성기가 넣는다.',
    '     자리가 서로 다른 줄이라 여러 빌더가 동시에 옮겨도 이 머리에서 병합 충돌이 나지 않는다(자리 표지는 지우지 않는다).',
    '     구획 주석(=== 줄)을 쓰지 않는다 — 지도(scripts/inline-script-map.js)의 묶음 번호가 밀리지 않게 1차 이음매 묶음에 붙는다. */',
    ...CFG.slots.map(s => '  /* [어려움 이음매 자리 ' + s + '] */'));
}
const slotIdx = nh.findIndex(l => SLOT_RE(CFG.slot).test(l));
let insertAt = slotIdx + 1;
while (insertAt < nh.length && !/^  \/\* \[어려움 이음매 자리 /.test(nh[insertAt]) && nh[insertAt].trim() !== '') insertAt++;
// 이미 노출된 이름(머리 전체의 expose getter·setter)
const headEnd = nh.findIndex((l, i) => i > usIdx && /^  try\{$/.test(l));
const headText = nh.slice(usIdx, headEnd > 0 ? headEnd : usIdx + 600);
const getters = new Set(), setters = new Set(), kitVars = new Set();
for (const l of headText) {
  let m; const g = /get ([A-Za-z_$][\w$]*)\(\)/g; while ((m = g.exec(l))) getters.add(m[1]);
  const s = /set ([A-Za-z_$][\w$]*)\(v\)/g; while ((m = s.exec(l))) setters.add(m[1]);
  const k = l.match(/^  var (_\w+Kit) = window\.(\w+);$/); if (k) kitVars.add(k[1] + '=' + k[2]);
}
// 가져올 이름: 옮긴 이름 중 옮긴 코드 밖(index.html 에 남은 곳 · 다른 세포)에서 쓰는 것 + 감싼 함수
const IMPORTS = [];
const outsideRefs = {};
for (const it of moved) for (const n of it.names) {
  const b = iScope.getBinding(n);
  const outs = b.referencePaths.filter(r => cellOfLine(H(r.node)) !== CELL_OF.get(n));
  if (outs.length) { IMPORTS.push({ n, cell: it.cell }); outsideRefs[n] = outs.map(r => H(r.node)); }
}
for (const it of wrapped) IMPORTS.push({ n: it.wrapName, cell: it.cell });
// 다른 세포로 간 이름을 L. 로 부르면 그 이름도 노출해야 한다(가져온 var 를 getter 로)
const head = ['  /* [#' + TAG + '] ' + CFG.cells.map(c => c.file).join(' · ') + ' — 가져오기 ' + IMPORTS.length + '개 · 통로 노출은 스코프 분석으로 뽑았다 */'];
for (const c of CFG.cells) {
  // 앞선 이음매에 그 키트 변수가 없으면(예: 홈 탭) 이 자리에서 지역 변수로 만든다 — 전역 이름은 늘지 않는다(이미 있는 전역을 읽을 뿐)
  if (!kitVars.has(c.kitVar + '=' + c.kit)) { if ([...kitVars].some(k => k.startsWith(c.kitVar + '='))) fail('키트 변수 이름이 다른 키트에 쓰였다: ' + c.kitVar); head.push('  var ' + c.kitVar + ' = window.' + c.kit + ';'); kitVars.add(c.kitVar + '=' + c.kit); }
  for (const x of IMPORTS.filter(i => i.cell === c.key)) head.push('  var ' + x.n + ' = ' + c.kitVar + '.' + x.n + ';');
}
const exposeList = [...bridged.keys()].sort().filter(n => !getters.has(n) || (bridged.get(n).assigned && !setters.has(n)));
if (exposeList.length) {
  head.push("  window.OurgoalAppScope.expose('index.html', {");
  exposeList.forEach((n, i) => head.push('    get ' + n + '(){ return ' + n + '; }' + (bridged.get(n).assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + (i === exposeList.length - 1 ? '' : ',')));
  head.push('  });');
}
nh.splice(insertAt, 0, ...head);
// (3) script 태그: 그 탭 index.js 태그 바로 앞, 같은 줄(순증가 0줄)
// 덮어쓰는 키트(유형 M): 어떤 js 파일이 global.<키트> = { … } 로 통째로 새로 대입하면, 그 파일 태그보다 앞에 넣은 세포의 K.x 는 지워진다 → 그 파일 태그 뒤(afterTag)에만 넣는다
const overwriters = kit => { const out = []; const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (!e.name.endsWith('.js') || path.resolve(p) === path.resolve(APP, CFG.cells.find(c => c.kit === kit).file)) return; const t = fs.readFileSync(p, 'utf8'); if (new RegExp('(?:global|window)\\.' + kit + '\\s*=(?!=)').test(t) && !new RegExp('(?:global|window)\\.' + kit + '\\s*=\\s*(?:global|window)\\.' + kit + '\\s*\\|\\|').test(t)) out.push(path.relative(APP, p).replace(/\\/g, '/')); }); walk(path.join(APP, 'js')); return out; };
for (const c of CFG.cells) {
  if (!outFiles[c.file]) continue;
  const tagStr = '<script src="' + c.file + '"></script>';
  const ow = overwriters(c.kit);
  if (c.afterTag) {
    const idx = nh.findIndex(l => l.includes(c.afterTag));
    if (idx < 0) fail('태그 없음 ' + c.afterTag);
    nh[idx] = nh[idx].replace(c.afterTag, c.afterTag + tagStr);
  } else {
    if (ow.length) fail('키트 ' + c.kit + ' 를 통째로 새로 대입하는 파일이 있다(' + ow.join(', ') + ') — 그 태그 뒤에 넣도록 설정에 afterTag 를 쓴다(유형 M)');
    const idx = nh.findIndex(l => l.includes(c.beforeTag));
    if (idx < 0) fail('태그 없음 ' + c.beforeTag);
    nh[idx] = nh[idx].replace(c.beforeTag, tagStr + c.beforeTag);
  }
}
// 세포 태그는 인라인 IIFE 보다 앞이어야 한다(머리에서 가져온다)
for (const c of CFG.cells) { const ti = nh.findIndex(l => l.includes('<script src="' + c.file + '"></script>')); if (outFiles[c.file] && !(ti >= 0 && ti < sLine)) fail('세포 태그가 인라인 IIFE 뒤에 있다: ' + c.file); }

fs.writeFileSync(path.join(APP, 'index.html'), nh.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(outFiles)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = {
  task: TAG, slot: CFG.slot, scriptHtmlLines: [sLine + 1, eLine],
  plan: finalPlan.map(i => ({ cell: i.cell, action: i.action, segment: [i.segStart, i.end], stmt: [i.start, i.end], names: i.names, why: i.why || null })),
  imports: IMPORTS, outsideRefs,
  bridged: [...bridged.keys()].sort().map(n => ({ n, ...bridged.get(n), exposedBefore: getters.has(n), setterBefore: setters.has(n) })), exposed: exposeList, edits: uniq.length,
  htmlLinesBefore: lines.length, htmlLinesAfter: nh.length,
  files: Object.fromEntries(Object.entries(outFiles).map(([f, a]) => [f, a.length - 1])),
};
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-inline-hard-meta.json'), JSON.stringify(meta, null, 1));
console.log('move', moved.length, 'wrap', wrapped.length, 'keep', kept.length, '· edits', uniq.length, '· bridged', bridged.size, '· exposed', exposeList.length, '· imports', IMPORTS.length);
for (const k of kept) console.log('  keep', k.start + '~' + k.end, k.names.join(',') || k.st.node.type, '—', k.why);
console.log('index.html lines', lines.length, '->', nh.length);
for (const [f, a] of Object.entries(outFiles)) console.log(f, a.length - 1);
