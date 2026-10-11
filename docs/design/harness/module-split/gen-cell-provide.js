#!/usr/bin/env node
'use strict';
// 세포 등록 줄 생성기 (B2 #TASK-ES-611 · docs/architecture/CELL-REGISTRY-DESIGN.md 2절 1단계·6절 3행)
//
// index.html 인라인 IIFE(미분화 덩어리)가 키트에서 끌어와(`var X = _kit.X`) 다시 통로(OurgoalAppScope.expose getter)·window 로 내주는 이름을,
// 그 이름을 키트에 단 세포 파일이 등록 기관(js/core/cell-registry.js)에 스스로 등록하게 한다. 등록 블록은 세포 파일 맨 끝에 덧붙인다.
// 등록 기관은 compare 모드라 값을 보관만 한다(OurgoalAppScope·window 는 건드리지 않는다) — 이 생성기는 index.html 을 쓰지 않고, 세포의 기존 글자도 바꾸지 않는다.
//
// 무엇을 등록하는가(이름 단위):
//   · 통로 이름 N: index.html `OurgoalAppScope.expose('index.html', { get N(){ return M; } })` 의 M 이 키트 가져오기 이름일 때
//   · window 이름 N: IIFE 최상위 `window.N = M`(대입만 담은 if 블록 포함)의 M 이 키트 가져오기 이름일 때
//   값은 M 을 키트에 단 세포가 든 그 키트 값(K.<member>)이다. 같은 키트 이름을 여러 파일이 달면 문서 순서상 마지막 파일이 등록한다(IIFE 가 읽는 값이 그것이다).
// 등록하지 않는 것(누락으로 남긴다 — 꾸미지 않는다):
//   · IIFE 안에 정의가 남은 이름(함수·상태·DOM 참조) — 세포가 없다(함수 이전·B9·B10 몫)
//   · setter 가 달린 통로 이름(다시 대입되는 상태 — 값 스냅샷이 어긋난다, B9 몫)
//   · 키트에 다는 파일을 글자로 찾지 못한 이름 · defer/async 로 IIFE 뒤에 도는 파일 · 등록 기관 태그보다 앞에서 도는 파일(계획 파일에 사유와 함께 적는다)
//
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node docs/design/harness/module-split/gen-cell-provide.js <저장소 루트> [--write] [--plan <out.json>] [--keep]
//   --write 없이 돌리면 계획만 낸다(파일 0 변경). --write 는 멱등이다 — 기존 등록 블록(표지 사이)을 걷어 내고 다시 붙이므로 두 번 돌려도 결과가 같다.
//   [#TASK-ES-664] --keep(기존 등록 보존): 철거가 진행된 뒤에 쓴다. index.html 의 배선은 이미 지운 이름을 더는 알려 주지 않으므로, --keep 없이 --write 하면 그 이름들의 등록이 사라진다.
//     --keep 은 세포 파일에 이미 있는 등록 블록을 읽어 그 이름을 전부 그대로 두고, 지금 index.html 이 내주는 이름 가운데 **아직 어느 세포도 등록하지 않은 이름만** 그 주인 세포의 블록에 더한다.
//     더할 이름이 없는 세포 파일은 건드리지 않는다(블록을 걷어 내지도 않는다). 블록 글자는 같은 함수(blockFor)가 만든다 — 기존 블록을 읽어 다시 만든 글자가 원래 글자와 다르면 멈춘다.
//     이미 등록된 이름인데 지금의 배선과 종류·파일이 다르면(예: window 전용으로 등록됐는데 지금은 통로 getter 가 있다) 바꾸지 않고 계획 파일 keep.differs 에 적는다.
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const argv = process.argv.slice(2);
const ROOT = path.resolve(argv[0] || '.');
const WRITE = argv.includes('--write');
const KEEP = argv.includes('--keep');
const PLAN_OUT = argv.indexOf('--plan') >= 0 ? argv[argv.indexOf('--plan') + 1] : null;
const REGISTRY_FILE = 'js/core/cell-registry.js';
const MARK_BEGIN = '/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */';
const MARK_END = '/* ==== [세포 등록 끝] ==== */';
const WRAP = 150; // 등록 블록 한 줄 너비(세포 파일 줄 수를 아끼되 읽을 수 있게)

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const isId = (n, name) => n && n.type === 'Identifier' && (name === undefined || n.name === name);
const propName = m => (m.computed ? (m.property.type === 'StringLiteral' ? m.property.value : null) : (m.property.type === 'Identifier' ? m.property.name : null));

// ───────────────────────── 1. index.html 읽기 ─────────────────────────
function readIndex() {
  const html = read('index.html');
  const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  if (s < 0) throw new Error('index.html 인라인 IIFE 를 찾지 못했다');
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script' });
  const iifeFn = ast.program.body[0].expression.callee;
  const top = iifeFn.body.body;
  const lineOf = n => n.loc.start.line + s;

  // IIFE 앞의 <script src> 태그(문서 순서). 주석 안 태그는 뺀다.
  const head = lines.slice(0, s - 1).join('\n').replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  const scripts = [];
  const tagRe = /<script\b([^>]*)>/g;
  let m;
  while ((m = tagRe.exec(head))) {
    const attrs = m[1];
    const src = /\bsrc\s*=\s*"([^"]*)"/.exec(attrs) || /\bsrc\s*=\s*'([^']*)'/.exec(attrs);
    if (!src) continue;
    const raw = src[1];
    const external = /^(https?:)?\/\//.test(raw);
    const file = external ? null : raw.replace(/[?#].*$/, '').replace(/^\.?\//, '');
    scripts.push({ order: scripts.length, src: raw, file, external, deferred: /\b(defer|async)\b/.test(attrs), line: head.slice(0, m.index).split('\n').length });
  }

  // 키트 변수 · 가져오기
  const chainOf = n => { const p = []; while (n && n.type === 'MemberExpression') { const k = propName(n); if (k === null) return null; p.unshift(k); n = n.object; } return isId(n) ? [n.name].concat(p) : null; };
  const kitVars = {}, imports = {};
  for (const st of top) {
    if (st.type !== 'VariableDeclaration') continue;
    for (const d of st.declarations) {
      if (!isId(d.id) || !d.init) continue;
      const c = chainOf(d.init);
      if (!c) continue;
      if (c[0] === 'window' && c.length >= 2) kitVars[d.id.name] = { path: c.slice(1).join('.'), line: lineOf(st) };
      else if (kitVars[c[0]] && c.length === 2) imports[d.id.name] = { name: d.id.name, kitVar: c[0], kitPath: kitVars[c[0]].path, member: c[1], line: lineOf(st) };
    }
  }

  // 통로 getter/setter · window 대입 · 가져오기 이름의 IIFE 안 참조 분류
  const getters = {}; // N → [{ returns, line }]
  const setters = {}; // N → true
  const windowSites = []; // { name, rhs, line, where }
  const isWA = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && isId(x.left.object, 'window');
  const recW = (x, where, st) => { const n = propName(x.left); if (n === null) return; windowSites.push({ name: n, rhs: isId(x.right) ? x.right.name : null, rhsType: x.right.type, line: lineOf(st), where }); };
  for (const st of top) {
    if (st.type === 'ExpressionStatement') {
      const x = st.expression;
      if (isWA(x)) recW(x, 'top', st);
      else if (x.type === 'SequenceExpression' && x.expressions.every(isWA)) x.expressions.forEach(y => recW(y, 'top-seq', st));
    } else if (st.type === 'IfStatement' && !st.alternate && st.consequent.type === 'BlockStatement' && st.consequent.body.length
      && st.consequent.body.every(b => b.type === 'ExpressionStatement' && (isWA(b.expression) || (b.expression.type === 'SequenceExpression' && b.expression.expressions.every(isWA))))) {
      for (const b of st.consequent.body) { const x = b.expression; if (isWA(x)) recW(x, 'if', b); else x.expressions.forEach(y => recW(y, 'if-seq', b)); }
    }
  }
  const refs = {}; // 가져오기 이름 → { getter, window, other, otherLines[] }
  Object.keys(imports).forEach(n => { refs[n] = { getter: 0, window: 0, other: 0, otherLines: [] }; });
  const isExposeCall = n => n && n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && propName(n.callee) === 'expose'
    && n.callee.object.type === 'MemberExpression' && propName(n.callee.object) === 'OurgoalAppScope';
  traverse(ast, {
    CallExpression(p) {
      if (!isExposeCall(p.node)) return;
      const obj = p.node.arguments[1];
      if (!obj || obj.type !== 'ObjectExpression') return;
      for (const pr of obj.properties) {
        if (pr.type !== 'ObjectMethod' || pr.computed) continue;
        const key = pr.key.type === 'Identifier' ? pr.key.name : (pr.key.type === 'StringLiteral' ? pr.key.value : null);
        if (key === null) continue;
        if (pr.kind === 'set') { setters[key] = true; continue; }
        if (pr.kind !== 'get') continue;
        const b = pr.body.body;
        const ret = b.length === 1 && b[0].type === 'ReturnStatement' && isId(b[0].argument) ? b[0].argument.name : null;
        (getters[key] = getters[key] || []).push({ returns: ret, line: lineOf(pr) });
      }
    },
    Identifier(p) {
      const n = p.node.name;
      if (!refs[n] || !p.isReferencedIdentifier()) return;
      const bind = p.scope.getBinding(n);
      if (!bind || bind.scope.block !== iifeFn) return; // 안쪽에서 가린 같은 이름은 세지 않는다
      // getter 본문의 `return M;`
      const fnP = p.getFunctionParent();
      if (fnP && fnP.node.type === 'ObjectMethod' && fnP.node.kind === 'get' && p.parent.type === 'ReturnStatement' && fnP.parentPath && fnP.parentPath.parentPath && isExposeCall(fnP.parentPath.parentPath.node)) { refs[n].getter++; return; }
      // 최상위 `window.N = M`
      if (p.parent.type === 'AssignmentExpression' && p.parent.right === p.node && isWA(p.parent)) {
        let q = p.parentPath; while (q && q.node.type !== 'ExpressionStatement') q = q.parentPath;
        const owner = q && q.getFunctionParent();
        if (owner && owner.node === iifeFn) { refs[n].window++; return; }
      }
      refs[n].other++;
      if (refs[n].otherLines.length < 5) refs[n].otherLines.push(lineOf(p.node));
    },
  });
  return { iifeLines: [s + 1, e], scripts, kitVars, imports, getters, setters, windowSites, refs };
}

// ───────────────────────── 2. 세포 파일에서 「키트에 이름을 다는 곳」 찾기 ─────────────────────────
function kitAssignmentsOf(file, kitPaths) {
  let code;
  try { code = read(file); } catch (e) { return { error: '파일 없음' }; }
  let ast;
  try { ast = parser.parse(code, { sourceType: 'script', errorRecovery: true, allowReturnOutsideFunction: true }); }
  catch (e) { return { error: '파싱 실패: ' + e.message.slice(0, 120) }; }
  const found = []; // { path, member, how }
  const dynamic = []; // 글자로 이름을 알 수 없는 대입(계획 파일에 그대로 적는다)
  const GLOBALS = { window: 1, globalThis: 1, self: 1 };
  function resolve(n, p, depth) {
    if (!n || depth > 8) return null;
    if (n.type === 'Identifier') {
      const b = p.scope.getBinding(n.name);
      if (!b) return GLOBALS[n.name] ? '' : null;
      if (b.kind === 'param') return ''; // 감싼 함수의 인자(global·root 등) — 전역 객체로 본다
      if (b.path.isVariableDeclarator() && b.path.node.init) return resolve(b.path.node.init, b.path, depth + 1);
      return null;
    }
    if (n.type === 'MemberExpression') {
      const k = propName(n); if (k === null) return null;
      const o = resolve(n.object, p, depth + 1);
      return o === null ? null : (o ? o + '.' + k : k);
    }
    if (n.type === 'AssignmentExpression' && n.operator === '=') { const l = resolve(n.left, p, depth + 1); return l !== null && l !== '' ? l : resolve(n.right, p, depth + 1); }
    if (n.type === 'LogicalExpression') { const l = resolve(n.left, p, depth + 1); return l !== null && l !== '' ? l : resolve(n.right, p, depth + 1); }
    if (n.type === 'ParenthesizedExpression') return resolve(n.expression, p, depth + 1);
    return null;
  }
  const isKit = s => s && Object.prototype.hasOwnProperty.call(kitPaths, s);
  function keysOf(n, p, kit, how, depth) {
    if (!n || depth > 6) return;
    if (n.type === 'ObjectExpression') {
      for (const pr of n.properties) {
        if (pr.type === 'SpreadElement') { dynamic.push({ path: kit, how: how + ' ...spread', line: pr.loc.start.line }); continue; }
        const k = pr.computed ? (pr.key.type === 'StringLiteral' ? pr.key.value : null) : (pr.key.type === 'Identifier' ? pr.key.name : (pr.key.type === 'StringLiteral' ? pr.key.value : null));
        if (k === null) dynamic.push({ path: kit, how: how + ' [computed]', line: pr.loc.start.line });
        else found.push({ path: kit, member: k, how, line: pr.loc.start.line });
      }
    } else if (n.type === 'LogicalExpression') { keysOf(n.left, p, kit, how, depth + 1); keysOf(n.right, p, kit, how, depth + 1); }
    else if (n.type === 'Identifier') { const b = p.scope.getBinding(n.name); if (b && b.path.isVariableDeclarator() && b.path.node.init && b.path.node.init.type === 'ObjectExpression') keysOf(b.path.node.init, b.path, kit, how, depth + 1); }
    else if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && isId(n.callee.object, 'Object') && propName(n.callee) === 'assign') n.arguments.forEach(a => keysOf(a, p, kit, how + ' Object.assign', depth + 1));
  }
  traverse(ast, {
    AssignmentExpression(p) {
      const n = p.node;
      if (n.operator !== '=' || n.left.type !== 'MemberExpression') return;
      const full = resolve(n.left, p, 0);
      if (isKit(full)) keysOf(n.right, p, full, '키트 = {…}', 0); // global.OurgoalXxx = { a: …, b: … }
      const obj = resolve(n.left.object, p, 0);
      if (!isKit(obj)) return;
      const k = propName(n.left);
      if (k === null) dynamic.push({ path: obj, how: 'K[식] = …', line: n.loc.start.line });
      else found.push({ path: obj, member: k, how: 'K.x = …', line: n.loc.start.line });
    },
    CallExpression(p) {
      const n = p.node;
      if (n.callee.type !== 'MemberExpression' || !isId(n.callee.object, 'Object')) return;
      const fn = propName(n.callee);
      if (fn === 'assign' && n.arguments.length >= 2) {
        const t = resolve(n.arguments[0], p, 0);
        if (isKit(t)) n.arguments.slice(1).forEach(a => keysOf(a, p, t, 'Object.assign(K, {…})', 0));
      } else if (fn === 'defineProperty' && n.arguments.length >= 2) {
        const t = resolve(n.arguments[0], p, 0);
        if (isKit(t)) { const a = n.arguments[1]; if (a.type === 'StringLiteral') found.push({ path: t, member: a.value, how: 'Object.defineProperty', line: n.loc.start.line }); else dynamic.push({ path: t, how: 'Object.defineProperty(식)', line: n.loc.start.line }); }
      }
    },
  });
  return { found, dynamic };
}

// ───────────────────────── 3. 계획 ─────────────────────────
function plan() {
  const ix = readIndex();
  const kitPaths = {};
  Object.values(ix.kitVars).forEach(k => { kitPaths[k.path] = true; });
  const modules = JSON.parse(read('docs/architecture/modules.json'));
  const cellByFile = {};
  modules.cells.forEach(c => { if (c.file) cellByFile[c.file] = c.id; });
  const regTag = ix.scripts.find(sc => sc.file === REGISTRY_FILE);
  if (!regTag) throw new Error('index.html 에 등록 기관 태그(' + REGISTRY_FILE + ')가 없다');

  // (키트 경로, 멤버) → 다는 파일들(문서 순서)
  const assigners = {};
  const fileNotes = [];
  for (const sc of ix.scripts) {
    if (!sc.file || !/\.js$/.test(sc.file)) continue;
    const r = kitAssignmentsOf(sc.file, kitPaths);
    if (r.error) { fileNotes.push({ file: sc.file, note: r.error }); continue; }
    if (r.dynamic.length) fileNotes.push({ file: sc.file, note: '글자로 이름을 알 수 없는 키트 대입', sites: r.dynamic });
    const seen = {};
    for (const f of r.found) {
      const key = f.path + '::' + f.member;
      if (seen[key]) continue; seen[key] = true;
      (assigners[key] = assigners[key] || []).push({ file: sc.file, order: sc.order, deferred: sc.deferred, how: f.how });
    }
  }

  // 이름 단위 기대값: 통로 이름 · window 이름 → 가져오기 이름
  const names = {}; // N → { scope: M|undef, window: M|undef }
  const iifeOwned = []; // 세포가 없는 이름(IIFE 안에 정의가 남아 있다) — 등록하지 않는다
  const skipped = [];
  for (const N of Object.keys(ix.getters)) {
    const last = ix.getters[N][ix.getters[N].length - 1]; // 같은 이름을 여러 번 노출하면 마지막 정의가 남는다(app-scope.js defineProperty)
    if (!last.returns || !ix.imports[last.returns]) { iifeOwned.push({ name: N, kind: 'scope', returns: last.returns, setter: !!ix.setters[N], line: last.line }); continue; } // IIFE 소유(가져오기 이름을 돌려주지 않는다)
    if (ix.setters[N]) { skipped.push({ name: N, kind: 'scope', reason: 'setter 가 달린 통로 이름(다시 대입되는 상태 — B9 몫)' }); continue; }
    (names[N] = names[N] || {}).scope = last.returns;
  }
  const winLast = {};
  ix.windowSites.forEach(w => { winLast[w.name] = w; });
  for (const N of Object.keys(winLast)) {
    const w = winLast[N];
    if (!w.rhs || !ix.imports[w.rhs]) { iifeOwned.push({ name: N, kind: 'window', rhs: w.rhs, rhsType: w.rhsType, line: w.line }); continue; } // IIFE 소유
    const all = ix.windowSites.filter(x => x.name === N);
    if (all.some(x => x.rhs !== w.rhs)) { skipped.push({ name: N, kind: 'window', reason: 'window 대입이 여러 곳이고 오른쪽이 서로 다르다' }); continue; }
    (names[N] = names[N] || {}).window = w.rhs;
  }

  const byFile = {}; // file → { owner, kits: { path: [{ name, member, window }] } }
  const registered = [];
  for (const N of Object.keys(names).sort()) {
    const e = names[N];
    if (e.scope && e.window && e.scope !== e.window) { skipped.push({ name: N, kind: 'scope+window', reason: '통로와 window 가 서로 다른 가져오기 이름을 가리킨다(' + e.scope + ' / ' + e.window + ')' }); continue; }
    const M = e.scope || e.window;
    const imp = ix.imports[M];
    const list = (assigners[imp.kitPath + '::' + imp.member] || []).slice().sort((a, b) => a.order - b.order);
    const kinds = [e.scope ? 'scope' : null, e.window ? 'window' : null].filter(Boolean).join('+');
    if (!list.length) { skipped.push({ name: N, kind: kinds, import: M, kit: imp.kitPath, reason: '이 이름을 키트에 다는 파일을 글자로 찾지 못했다' }); continue; }
    const own = list[list.length - 1];
    if (own.deferred) { skipped.push({ name: N, kind: kinds, import: M, kit: imp.kitPath, file: own.file, reason: 'defer/async 태그 파일(IIFE 뒤에 돈다)' }); continue; }
    if (own.order < regTag.order) { skipped.push({ name: N, kind: kinds, import: M, kit: imp.kitPath, file: own.file, reason: '등록 기관 태그보다 앞에서 로드된다(등록해도 기관이 아직 없다)' }); continue; }
    const owner = cellByFile[own.file];
    if (!owner) { skipped.push({ name: N, kind: kinds, import: M, kit: imp.kitPath, file: own.file, reason: '신고서(modules.json)에 이 파일의 세포가 없다' }); continue; }
    const f = byFile[own.file] = byFile[own.file] || { owner, kits: {} };
    (f.kits[imp.kitPath] = f.kits[imp.kitPath] || []).push({ name: N, member: imp.member, window: !!e.window, scope: !!e.scope });
    registered.push({ name: N, kinds, import: M, kit: imp.kitPath, kitVar: imp.kitVar, member: imp.member, file: own.file, owner, assigners: list.map(a => a.file) });
  }
  return { ix, byFile, registered, skipped, iifeOwned, fileNotes, regTag };
}

// ───────────────────────── 4. 등록 블록 ─────────────────────────
function packed(items, indent, sep) {
  const out = []; let cur = indent;
  items.forEach((it, i) => {
    const piece = it + (i < items.length - 1 ? sep : '');
    if (cur.length > indent.length && cur.length + piece.length + 1 > WRAP) { out.push(cur.replace(/\s+$/, '')); cur = indent; }
    cur += (cur.length > indent.length ? ' ' : '') + piece;
  });
  if (cur.trim()) out.push(cur);
  return out;
}
function blockFor(entry) {
  const kitPaths = Object.keys(entry.kits).sort();
  const L = [MARK_BEGIN, '(function (g) {', '  var R = g.OurgoalCellRegistry;', '  if (!R) return;'];
  kitPaths.forEach((kp, i) => {
    const parts = kp.split('.');
    const guard = parts.map((_, j) => 'g.' + parts.slice(0, j + 1).join('.')).join(' && ');
    const items = entry.kits[kp].slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const kv = 'K' + (kitPaths.length > 1 ? i : '');
    const win = items.filter(x => x.window).map(x => x.name);
    // [B3a #TASK-ES-614] window 에만 나가는 이름(통로 getter 가 없던 이름) — 등록 기관이 own 적용 때 통로에는 내주지 않게 따로 적는다. 없으면 블록 글자는 B2 와 같다.
    const winOnly = items.filter(x => x.window && !x.scope).map(x => x.name);
    L.push('  var ' + kv + ' = ' + guard + ';');
    L.push('  if (' + kv + ') R.provide(' + JSON.stringify(entry.owner).replace(/"/g, "'") + ', {');
    packed(items.map(x => x.name + ': ' + kv + '.' + x.member), '    ', ',').forEach(l => L.push(l));
    if (win.length) {
      L.push('  }, { window: [');
      packed(win.map(n => "'" + n + "'"), '    ', ',').forEach(l => L.push(l));
      if (winOnly.length) {
        L.push('  ], windowOnly: [');
        packed(winOnly.map(n => "'" + n + "'"), '    ', ',').forEach(l => L.push(l));
      }
      L.push('  ] });');
    } else L.push('  }, { window: [] });');
  });
  L.push("})(typeof window !== 'undefined' ? window : globalThis);", MARK_END);
  return L.join('\n');
}
function stripBlock(code) {
  const b = code.indexOf(MARK_BEGIN);
  if (b < 0) return code;
  const e = code.indexOf(MARK_END, b);
  if (e < 0) throw new Error('등록 블록 시작 표지는 있는데 끝 표지가 없다');
  let head = code.slice(0, b), tail = code.slice(e + MARK_END.length);
  if (tail.trim()) throw new Error('등록 블록 뒤에 다른 글자가 있다 — 블록은 파일 맨 끝이어야 한다');
  // 붙일 때 더한 글자만 걷는다: (';'?) + 줄바꿈 한 번. 원본 끝 글자는 손대지 않는다.
  if (head.endsWith('\r\n;\r\n')) head = head.slice(0, -3);
  else if (head.endsWith('\n;\n')) head = head.slice(0, -2);
  return head;
}
function applyBlock(orig, block, eol) {
  // 원본이 `})(x)` 처럼 ';' 없이 끝나면 덧붙인 `(function…` 이 앞 식의 호출로 읽힌다 → ';' 한 줄을 먼저 둔다
  const body = orig.replace(/\s+$/, '');
  const needSemi = !/;$/.test(body);
  const base = orig.endsWith('\n') ? orig : orig + eol;
  return base + (needSemi ? ';' + eol : '') + block.split('\n').join(eol) + eol;
}

// [#TASK-ES-664] 이미 붙어 있는 등록 블록을 읽는다(--keep): { owner, kits: { 키트 경로: [{ name, member, window, scope }] } } · 블록이 없으면 null.
// 블록은 이 생성기가 만든 꼴만 받는다 — 다른 꼴이면 멈춘다(손으로 고친 블록을 조용히 받아들이지 않는다).
function parseBlock(code, file) {
  const b = code.indexOf(MARK_BEGIN);
  if (b < 0) return null;
  const e = code.indexOf(MARK_END, b);
  if (e < 0) throw new Error(file + ': 등록 블록 시작 표지는 있는데 끝 표지가 없다');
  const text = code.slice(b + MARK_BEGIN.length, e).replace(/\r\n/g, '\n');
  const bad = why => { throw new Error(file + ': 등록 블록이 생성기 꼴이 아니다 — ' + why); };
  let ast;
  try { ast = parser.parse(text, { sourceType: 'script' }); } catch (err) { bad('파싱 실패: ' + err.message.slice(0, 80)); }
  const st0 = ast.program.body;
  if (st0.length !== 1 || st0[0].type !== 'ExpressionStatement' || st0[0].expression.type !== 'CallExpression' || st0[0].expression.callee.type !== 'FunctionExpression') bad('즉시 실행 함수 하나가 아니다');
  const body = st0[0].expression.callee.body.body;
  const chain = n => { const p = []; while (n && n.type === 'MemberExpression') { const k = propName(n); if (k === null) return null; p.unshift(k); n = n.object; } return isId(n, 'g') ? p : null; };
  const out = { owner: null, kits: {} };
  const kitOf = {};
  for (const st of body.slice(2)) {
    if (st.type === 'VariableDeclaration' && st.declarations.length === 1 && isId(st.declarations[0].id)) {
      let init = st.declarations[0].init; while (init && init.type === 'LogicalExpression' && init.operator === '&&') init = init.right;
      const c = chain(init); if (!c || !c.length) bad('키트 줄을 읽지 못했다');
      kitOf[st.declarations[0].id.name] = c.join('.');
      continue;
    }
    const call = st.type === 'IfStatement' && !st.alternate && isId(st.test) && st.consequent.type === 'ExpressionStatement' ? st.consequent.expression : null;
    if (!call || call.type !== 'CallExpression' || call.callee.type !== 'MemberExpression' || !isId(call.callee.object, 'R') || propName(call.callee) !== 'provide' || call.arguments.length !== 3) bad('provide 문이 아닌 문이 있다');
    const kv = st.test.name, kit = kitOf[kv]; if (!kit) bad('키트 변수 ' + kv + ' 의 줄이 없다');
    const [ow, vals, opts] = call.arguments;
    if (ow.type !== 'StringLiteral' || vals.type !== 'ObjectExpression' || opts.type !== 'ObjectExpression') bad('provide 인자 꼴이 다르다');
    if (out.owner !== null && out.owner !== ow.value) bad('한 블록에 주인이 둘이다');
    out.owner = ow.value;
    const strs = key => { const pr = opts.properties.find(x => x.type === 'ObjectProperty' && isId(x.key, key)); if (!pr) return []; if (pr.value.type !== 'ArrayExpression' || pr.value.elements.some(x => !x || x.type !== 'StringLiteral')) bad(key + ' 목록 꼴이 다르다'); return pr.value.elements.map(x => x.value); };
    const win = strs('window'), winOnly = strs('windowOnly');
    if (out.kits[kit]) bad('같은 키트의 provide 문이 둘이다');
    out.kits[kit] = vals.properties.map(pr => {
      if (pr.type !== 'ObjectProperty' || pr.computed || !isId(pr.key) || pr.value.type !== 'MemberExpression' || !isId(pr.value.object, kv) || propName(pr.value) === null) bad('등록 항목 꼴이 다르다');
      return { name: pr.key.name, member: propName(pr.value), window: win.includes(pr.key.name), scope: !winOnly.includes(pr.key.name) };
    });
    const known = out.kits[kit].map(x => x.name);
    if (win.concat(winOnly).some(n => !known.includes(n))) bad('window 목록에 등록 항목에 없는 이름이 있다');
  }
  if (out.owner === null) bad('provide 문이 없다');
  return out;
}

// ───────────────────────── 5. 실행 ─────────────────────────
const P = plan();
const MAX_LINES = 800; // 헌법 제3조 제3항 · scripts/module-metrics.js · court/lib/new-debt.js 와 같은 셈
const countLines = text => { const t = String(text).replace(/\r\n/g, '\n'); if (!t.length) return 0; const n = t.split('\n').length; return t.endsWith('\n') ? n - 1 : n; };
// [#TASK-ES-664] --keep: 기존 등록은 그대로 두고, 아직 어느 세포도 등록하지 않은 이름만 더한다
let KEEPINFO = null;
if (KEEP) {
  const existing = {}, nameAt = {};
  for (const sc of P.ix.scripts) {
    if (!sc.file || !/\.js$/.test(sc.file) || existing[sc.file]) continue;
    let cur; try { cur = read(sc.file); } catch (e) { continue; }
    const pb = parseBlock(cur, sc.file);
    if (!pb) continue;
    // 읽은 것으로 다시 만든 블록이 원래 글자와 같아야 한다 — 아니면 더하는 과정에서 기존 글자가 달라진다
    const b0 = cur.indexOf(MARK_BEGIN), e0 = cur.indexOf(MARK_END, b0) + MARK_END.length;
    if (blockFor(pb) !== cur.slice(b0, e0).replace(/\r\n/g, '\n')) throw new Error(sc.file + ': 기존 등록 블록을 읽어 다시 만든 글자가 원래 글자와 다르다 — --keep 을 멈춘다');
    existing[sc.file] = pb;
    Object.keys(pb.kits).forEach(kit => pb.kits[kit].forEach(x => {
      if (nameAt[x.name]) throw new Error('같은 이름을 두 세포가 등록하고 있다: ' + x.name + ' (' + nameAt[x.name].file + ' · ' + sc.file + ')');
      nameAt[x.name] = { file: sc.file, kit, member: x.member, window: x.window, scope: x.scope };
    }));
  }
  // --exclude <names.json>: 더하지 않을 이름과 사유({ "names": { "이름": "사유" } }) — 예: 통로 값과 window 값이 서로 다른 이름
  const EXCL = argv.indexOf('--exclude') >= 0 ? (JSON.parse(fs.readFileSync(path.resolve(argv[argv.indexOf('--exclude') + 1]), 'utf8')).names || {}) : {};
  const added = [], already = [], differs = [], upgraded = [], excluded = [], merged = {};
  const blockOf = (file, owner) => (merged[file] = merged[file] || (existing[file] ? { owner: existing[file].owner, kits: Object.fromEntries(Object.keys(existing[file].kits).map(k => [k, existing[file].kits[k].map(x => Object.assign({}, x))])) } : { owner, kits: {} }));
  for (const r of P.registered) {
    const ex = nameAt[r.name], wantScope = /scope/.test(r.kinds), wantWin = /window/.test(r.kinds);
    if (ex) {
      already.push(r.name);
      const sameSpot = ex.file === r.file && ex.kit === r.kit && ex.member === r.member;
      // window 전용으로 등록됐던 이름에 지금은 통로 getter 가 있다(세포가 L.이름 으로 읽게 됐다) → B3a 규칙대로 windowOnly 에서 뺀다(값·주인·window 목록은 그대로). 그 밖의 어긋남은 바꾸지 않고 적기만 한다.
      if (sameSpot && wantScope && !ex.scope && ex.window && !(wantWin && !ex.window) && !Object.prototype.hasOwnProperty.call(EXCL, r.name)) {
        const it = blockOf(r.file, r.owner).kits[r.kit].find(x => x.name === r.name);
        it.scope = true; upgraded.push(r);
      } else if (!sameSpot || (wantScope && !ex.scope) || (wantWin && !ex.window)) differs.push({ name: r.name, existing: ex, now: { file: r.file, kit: r.kit, member: r.member, kinds: r.kinds } });
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(EXCL, r.name)) { excluded.push(r.name); P.skipped.push({ name: r.name, kind: r.kinds, import: r.import, kit: r.kit, file: r.file, reason: '--exclude: ' + EXCL[r.name] }); continue; }
    added.push(r);
    const f = blockOf(r.file, r.owner);
    if (f.owner !== r.owner) throw new Error(r.file + ': 기존 등록 블록의 주인(' + f.owner + ')이 신고서의 세포 id(' + r.owner + ')와 다르다');
    (f.kits[r.kit] = f.kits[r.kit] || []).push({ name: r.name, member: r.member, window: wantWin, scope: wantScope });
  }
  KEEPINFO = { existingFiles: Object.keys(existing).length, existingNames: Object.keys(nameAt).length, plannedNow: P.registered.length, alreadyRegistered: already.length, added: added.length, addedNames: added.map(r => r.name).sort(), upgradedFromWindowOnly: upgraded.map(r => r.name).sort(), upgradedEntries: upgraded, excluded: excluded.sort(), filesToChange: Object.keys(merged).sort(), newBlockFiles: Object.keys(merged).filter(f => !existing[f]).sort(), differs };
  P.byFile = merged;
  P.registered = added;
}
// 등록 블록을 붙이면 800줄을 새로 넘는 세포는 붙이지 않는다(상한이 먼저다 — 그 세포는 책임 단위로 나눈 뒤 등록한다). 그 이름은 누락으로 남기고 사유를 적는다.
for (const f of Object.keys(P.byFile).sort()) {
  const orig = stripBlock(read(f));
  const eol0 = /\r\n/.test(orig) ? '\r\n' : '\n';
  const after = countLines(applyBlock(orig, blockFor(P.byFile[f]), eol0));
  if (after <= MAX_LINES) continue;
  const before = countLines(orig);
  const reason = '등록 블록을 붙이면 800줄 상한을 넘는다(' + before + ' → ' + after + '줄) — 세포를 책임 단위로 나눈 뒤 등록한다';
  P.registered = P.registered.filter(r => {
    if (r.file !== f) return true;
    P.skipped.push({ name: r.name, kind: r.kinds, import: r.import, kit: r.kit, file: f, reason });
    return false;
  });
  delete P.byFile[f];
}
if (KEEPINFO) { // 800줄 상한으로 건너뛴 세포를 뺀 뒤의 실제 값으로 맞춘다
  const left = f => Object.prototype.hasOwnProperty.call(P.byFile, f);
  KEEPINFO.added = P.registered.length; KEEPINFO.addedNames = P.registered.map(r => r.name).sort();
  KEEPINFO.upgradedEntries = KEEPINFO.upgradedEntries.filter(r => left(r.file)); KEEPINFO.upgradedFromWindowOnly = KEEPINFO.upgradedEntries.map(r => r.name).sort();
  KEEPINFO.filesToChange = KEEPINFO.filesToChange.filter(left); KEEPINFO.newBlockFiles = KEEPINFO.newBlockFiles.filter(left);
}
const files = Object.keys(P.byFile).sort();
const changed = [], unchanged = [], stale = [];
// 예전에 블록을 붙였으나 이번 계획에는 없는 파일(등록할 이름이 사라진 세포)도 걷어 낸다
const allJs = P.ix.scripts.filter(sc => sc.file && /\.js$/.test(sc.file)).map(sc => sc.file);
for (const f of allJs) {
  if (KEEP && !P.byFile[f]) continue; // --keep: 더할 이름이 없는 세포는 건드리지 않는다(기존 블록을 걷어 내지 않는다)
  let cur; try { cur = read(f); } catch (e) { continue; }
  const eol = /\r\n/.test(cur) ? '\r\n' : '\n';
  const orig = stripBlock(cur);
  const next = P.byFile[f] ? applyBlock(orig, blockFor(P.byFile[f]), eol) : orig;
  if (P.byFile[f]) {
    // 덧붙인 뒤에도 원본 문장 수 + 1(등록 IIFE)인지 — 앞 식에 붙어 읽히지 않았는지 파서로 확인한다
    const a = parser.parse(orig, { sourceType: 'script', errorRecovery: true, allowReturnOutsideFunction: true }).program.body.filter(x => x.type !== 'EmptyStatement').length;
    const b = parser.parse(next, { sourceType: 'script', errorRecovery: true, allowReturnOutsideFunction: true }).program.body.filter(x => x.type !== 'EmptyStatement').length;
    if (b !== a + 1) throw new Error(f + ': 등록 블록이 독립 문장으로 붙지 않았다(문장 수 ' + a + ' → ' + b + ')');
  } else if (next !== cur) stale.push(f);
  if (next === cur) { if (P.byFile[f]) unchanged.push(f); continue; }
  if (P.byFile[f]) changed.push(f);
  if (WRITE) fs.writeFileSync(path.join(ROOT, f), next, 'utf8');
}

const byKit = {};
Object.values(P.ix.imports).forEach(i => {
  const k = byKit[i.kitVar] = byKit[i.kitVar] || { kitPath: i.kitPath, imports: 0, registeredImports: 0, unwireReady: 0, blockedByIifeRefs: 0, notExposed: 0, notExposedNoRefs: 0 };
  k.imports++;
});
const regByImport = {};
P.registered.forEach(r => { (regByImport[r.import] = regByImport[r.import] || []).push(r.name); });
Object.values(P.ix.imports).forEach(i => {
  const k = byKit[i.kitVar], other = P.ix.refs[i.name].other;
  if (regByImport[i.name]) { k.registeredImports++; if (other === 0) k.unwireReady++; else k.blockedByIifeRefs++; }
  else if (P.ix.refs[i.name].getter === 0 && P.ix.refs[i.name].window === 0) { k.notExposed++; if (other === 0) k.notExposedNoRefs++; }
});
const out = {
  tool: 'docs/design/harness/module-split/gen-cell-provide.js', type: '생성기 계획(작업자 산출, 판정 아님)', write: WRITE,
  ...(KEEP ? { keep: KEEPINFO, keepNote: '--keep: registered · files · counts.registered* 는 이번에 **더하는** 이름만이다. 기존 등록(keep.existingNames 개)은 그대로 둔다' } : {}),
  index: { iifeLines: P.ix.iifeLines, scriptTags: P.ix.scripts.length, registryTagOrder: P.regTag.order, registryTagLine: P.regTag.line, kitVars: P.ix.kitVars, imports: Object.keys(P.ix.imports).length,
    scopeGetterNames: Object.keys(P.ix.getters).length, scopeSetterNames: Object.keys(P.ix.setters).length, windowNames: Array.from(new Set(P.ix.windowSites.map(w => w.name))).length, windowSites: P.ix.windowSites.length },
  counts: { registeredNames: P.registered.length, registeredScope: P.registered.filter(r => /scope/.test(r.kinds)).length, registeredWindow: P.registered.filter(r => /window/.test(r.kinds)).length,
    files: files.length, skipped: P.skipped.length, iifeOwnedScope: P.iifeOwned.filter(x => x.kind === 'scope').length, iifeOwnedWindow: P.iifeOwned.filter(x => x.kind === 'window').length, changedThisRun: changed.length, unchangedThisRun: unchanged.length, staleBlocksRemoved: stale.length },
  byKit,
  byKitNote: 'imports=IIFE 가 그 키트에서 가져오는 이름 수 · registeredImports=그중 통로/window 로 나가 등록된 것 · unwireReady=등록됐고 IIFE 안에 getter·window 대입 말고는 참조가 없는 것(철거 후보) · blockedByIifeRefs=등록됐지만 IIFE 안 다른 코드가 아직 그 이름을 쓰는 것 · notExposed=통로·window 로 나가지 않아 등록 대상이 아닌 가져오기(그중 notExposedNoRefs 는 IIFE 안 참조도 0)',
  files: files.map(f => ({ file: f, owner: P.byFile[f].owner, names: Object.values(P.byFile[f].kits).reduce((a, b) => a + b.length, 0), kits: Object.keys(P.byFile[f].kits) })),
  registered: P.registered,
  skipped: P.skipped,
  iifeOwned: P.iifeOwned,
  iifeOwnedNote: 'IIFE 안에 정의가 남아 있어 세포가 없는 이름(함수 이전·B9 상태 기관·B10 부팅 기관 몫). scope: 통로 getter 가 가져오기 이름을 돌려주지 않는다 · window: 대입 오른쪽이 가져오기 이름이 아니다',
  importRefs: P.ix.refs,
  fileNotes: P.fileNotes,
};
if (PLAN_OUT) { fs.mkdirSync(path.dirname(path.resolve(PLAN_OUT)), { recursive: true }); fs.writeFileSync(PLAN_OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
console.log(JSON.stringify({ write: WRITE, imports: out.index.imports, registeredNames: out.counts.registeredNames, scope: out.counts.registeredScope, window: out.counts.registeredWindow, files: out.counts.files, skipped: out.counts.skipped, changed: changed.length, unchanged: unchanged.length, stale: stale.length }));
