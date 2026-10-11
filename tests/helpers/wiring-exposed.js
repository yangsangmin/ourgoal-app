'use strict';
// #TASK-ES-620 (배선 글자 단언 넓히기 — 시험지): index.html 인라인 IIFE 의 옛 배선 줄(`window.X = X;` · `get X(){ return X; }`)이
// 생성기의 배선 철거(unwire)로 지워져도, 「그 이름이 실제로 노출된다」를 보던 단언이 같은 것을 계속 재도록 하는 공용 도우미다.
// 이름이 노출되는 길은 둘이다. 단언은 둘 중 하나가 참이면 참이고, 둘 다 없으면 거짓이다.
//   (가) 옛 배선 — 시험지가 읽은 글자(source)에 옛 배선 글자가 그대로 있다. 고치기 전 단언과 글자 하나 다르지 않은 판정이다.
//   (나) 등록   — 세포 파일이 등록 기관(js/core/cell-registry.js)에 그 이름을 등록했고, 기관이 인라인 IIFE 직전(commit)에 같은 값으로 내준다.
//                아래 다섯 가지가 모두 참일 때만 「등록됨」으로 본다(글자를 긁지 않고 등록 블록을 @babel/parser 로 읽는다):
//        ① index.html 이 등록 기관 → 그 세포 파일 → commit 파일(js/core/cell-registry-commit.js) 순서로, defer·async 없는 <script src> 로 읽는다.
//        ② 그 세포 파일의 등록 블록(「세포 등록 시작 · gen-cell-provide.js」 ~ 「세포 등록 끝」)에 provide('세포id', { 이름: K.원래이름 }, …) 가 있다.
//        ③ 값이 옛 배선의 오른쪽 이름과 같은 키트 속성이다(`window.A = B;` 였으면 `A: K.B`).
//        ④ window 노출이면 opts.window 에 그 이름이 있고, 통로(getter) 노출이면 opts.windowOnly 에 그 이름이 없다.
//        ⑤ 그 세포 파일이 등록 블록 앞에서 그 키트 속성을 실제로 단다(`….B = …` 대입 또는 객체 속성 `B: …`).
// 같은 이름을 여러 세포가 등록하면 index.html 이 먼저 읽는 세포의 등록만 본다(기관이 첫 등록을 지킨다).
// 옛 배선 글자가 정해진 꼴이 아니면 오류를 던진다(엉뚱한 글자를 넣어 조용히 통과하는 일을 막는다).
// 파서는 (나)를 볼 때만 읽는다. 없으면 오류를 던진다 — NODE_PATH 로 저장소의 node_modules(@babel/parser)를 알려 준다(커밋 훅·법정과 같은 방식).
const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = path.join(__dirname, '..', '..');
const REGISTRY_JS = 'js/core/cell-registry.js';
const COMMIT_JS = 'js/core/cell-registry-commit.js';
const BLOCK_START = '/* ==== [세포 등록 시작 · gen-cell-provide.js]';
const BLOCK_END = '/* ==== [세포 등록 끝] ==== */';
const ID = '[A-Za-z_$][\\w$]*';
const WINDOW_WIRING_RE = new RegExp('^\\s*window\\.(' + ID + ')\\s*=\\s*(' + ID + ')\\s*;?\\s*$');
const GETTER_WIRING_RE = new RegExp('^\\s*get\\s+(' + ID + ')\\s*\\(\\s*\\)\\s*\\{\\s*return\\s+(' + ID + ')\\s*;?\\s*\\}\\s*,?\\s*$');

function parseWindowWiring(text) {
  const m = WINDOW_WIRING_RE.exec(String(text));
  if (!m) throw new Error('wiring-exposed: 옛 window 배선 글자가 `window.이름 = 이름;` 꼴이 아니다: ' + JSON.stringify(text));
  return { name: m[1], from: m[2] };
}
function parseGetterWiring(text) {
  const m = GETTER_WIRING_RE.exec(String(text));
  if (!m) throw new Error('wiring-exposed: 옛 통로 배선 글자가 `get 이름(){ return 이름; }` 꼴이 아니다: ' + JSON.stringify(text));
  return { name: m[1], from: m[2] };
}

let parserMod = null;
function parser() {
  if (!parserMod) {
    try { parserMod = require('@babel/parser'); }
    catch (e) { throw new Error('wiring-exposed: @babel/parser 를 찾지 못했다 — NODE_PATH 에 저장소의 node_modules 를 준다(' + ((e && e.code) || e) + ')'); }
  }
  return parserMod;
}

// AST 를 끝까지 걷는다(부모 없이 노드만).
function walkAst(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments') continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walkAst(c, visit); }
    else if (v && typeof v.type === 'string') walkAst(v, visit);
  }
}
const keyName = k => (k && k.type === 'Identifier' ? k.name : (k && k.type === 'StringLiteral' ? k.value : null));
const stringElements = arr => (arr && arr.type === 'ArrayExpression' ? arr.elements.filter(e => e && e.type === 'StringLiteral').map(e => e.value) : []);

// index.html 의 <script src> 태그(읽는 순서 그대로). 주석 안의 태그는 세지 않는다.
function scriptTags(html) {
  const live = html.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
  const out = [];
  const re = /<script\b([^>]*)>/gi;
  for (let m = re.exec(live); m; m = re.exec(live)) {
    const src = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(m[1]);
    if (!src) continue;
    out.push({ src: src[2].replace(/[?#].*$/, '').replace(/^\.?\//, ''), at: m.index, lazy: /(^|\s)(defer|async)(\s|=|$)/i.test(m[1].replace(/(["'])[^"']*\1/g, '""')) });
  }
  return out;
}

// 세포 파일 하나의 등록 블록에서 provide 호출을 읽는다. 블록이 없으면 빈 배열.
function readProvides(source) {
  const s = source.indexOf(BLOCK_START);
  if (s < 0) return { blockStart: -1, provides: [] };
  const e = source.indexOf(BLOCK_END, s);
  if (e < 0) return { blockStart: s, provides: [] };
  const P = parser();
  let ast;
  try { ast = P.parse(source.slice(s, e), { sourceType: 'script' }); }
  catch (err) { return { blockStart: s, provides: [] }; } // 표지 사이가 코드로 읽히지 않으면(문자열 안의 표지 등) 등록이 아니다
  const provides = [];
  // 블록 안 함수마다: 지역 var 선언(키트 손잡이)과 provide 호출을 같이 본다.
  walkAst(ast.program, fn => {
    if (fn.type !== 'FunctionExpression' && fn.type !== 'FunctionDeclaration' && fn.type !== 'ArrowFunctionExpression') return;
    if (!fn.body || fn.body.type !== 'BlockStatement') return;
    const declared = new Set();
    for (const st of fn.body.body) if (st.type === 'VariableDeclaration') for (const d of st.declarations) if (d.id.type === 'Identifier' && d.init) declared.add(d.id.name);
    for (const st of fn.body.body) {
      // 등록은 `if (K) R.provide(…)` 또는 `R.provide(…)` 문으로만 본다(함수 안쪽 깊은 곳·문자열·주석은 보지 않는다).
      let ex = null;
      if (st.type === 'ExpressionStatement') ex = st.expression;
      else if (st.type === 'IfStatement' && !st.alternate) { const c = st.consequent.type === 'BlockStatement' && st.consequent.body.length === 1 ? st.consequent.body[0] : st.consequent; if (c.type === 'ExpressionStatement') ex = c.expression; }
      if (!ex || ex.type !== 'CallExpression') continue;
      const cal = ex.callee;
      if (cal.type !== 'MemberExpression' || cal.computed || keyName(cal.property) !== 'provide' || cal.object.type !== 'Identifier' || !declared.has(cal.object.name)) continue;
      const a = ex.arguments;
      if (a.length < 2 || a[0].type !== 'StringLiteral' || !a[0].value.trim() || a[1].type !== 'ObjectExpression') continue;
      const values = {};
      for (const p of a[1].properties) {
        if (p.type !== 'ObjectProperty' || p.computed) continue;
        const n = keyName(p.key), v = p.value;
        if (n === null) continue;
        // 값은 `손잡이.속성` 이어야 하고, 손잡이는 이 함수에서 선언한 var 여야 한다.
        if (v.type === 'MemberExpression' && !v.computed && v.object.type === 'Identifier' && declared.has(v.object.name) && v.property.type === 'Identifier') values[n] = v.property.name;
        else values[n] = null;
      }
      let win = [], winOnly = [];
      if (a[2] && a[2].type === 'ObjectExpression') for (const p of a[2].properties) {
        if (p.type !== 'ObjectProperty' || p.computed) continue;
        if (keyName(p.key) === 'window') win = stringElements(p.value);
        if (keyName(p.key) === 'windowOnly') winOnly = stringElements(p.value);
      }
      provides.push({ owner: a[0].value, values, window: win, windowOnly: winOnly });
    }
  });
  return { blockStart: s, provides };
}

// 세포 파일이 등록 블록 앞에서 그 키트 속성을 다는가(`….member = …` 대입 또는 객체 속성 `member: …`).
function definesMember(source, blockStart, member) {
  const ast = parser().parse(source.slice(0, blockStart), { sourceType: 'script', errorRecovery: true });
  let found = false;
  walkAst(ast.program, n => {
    if (found) return;
    if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && !n.left.computed && keyName(n.left.property) === member) found = true;
    else if ((n.type === 'ObjectProperty' || n.type === 'ObjectMethod') && !n.computed && keyName(n.key) === member) found = true;
  });
  return found;
}

const cache = new Map();
// 한 트리의 등록 지도: 이름 → { file, owner, from, window, scope, defined }. index.html 이 기관과 commit 사이에 읽는 세포 파일만 본다.
function registry(root) {
  const key = path.resolve(root || DEFAULT_ROOT);
  if (cache.has(key)) return cache.get(key);
  const out = { root: key, ok: false, why: null, entries: {}, files: 0 };
  cache.set(key, out);
  let html;
  try { html = fs.readFileSync(path.join(key, 'index.html'), 'utf8'); } catch (e) { out.why = 'index.html 을 읽지 못했다'; return out; }
  const tags = scriptTags(html);
  const reg = tags.find(t => t.src === REGISTRY_JS), com = tags.find(t => t.src === COMMIT_JS);
  if (!reg || !com) { out.why = 'index.html 에 등록 기관 또는 commit 태그가 없다'; return out; }
  if (reg.lazy || com.lazy || !(reg.at < com.at)) { out.why = '등록 기관 → commit 순서의 동기 태그가 아니다'; return out; }
  if (!fs.existsSync(path.join(key, REGISTRY_JS)) || !fs.existsSync(path.join(key, COMMIT_JS))) { out.why = '등록 기관 또는 commit 파일이 없다'; return out; }
  out.ok = true;
  const sources = {};
  for (const t of tags) {
    if (!(t.at > reg.at && t.at < com.at) || t.lazy || !/^js\/.+\.js$/.test(t.src) || Object.prototype.hasOwnProperty.call(sources, t.src)) continue;
    let src;
    try { src = fs.readFileSync(path.join(key, t.src), 'utf8'); } catch (e) { continue; }
    sources[t.src] = src;
    if (src.indexOf(BLOCK_START) < 0) continue;
    const r = readProvides(src);
    out.files++;
    for (const p of r.provides) for (const name of Object.keys(p.values)) {
      if (Object.prototype.hasOwnProperty.call(out.entries, name)) continue; // 첫 등록만(읽는 순서)
      out.entries[name] = { file: t.src, owner: p.owner, from: p.values[name], window: p.window.indexOf(name) >= 0, scope: p.windowOnly.indexOf(name) < 0, blockStart: r.blockStart, defined: null };
    }
  }
  out.definedOf = function (name) {
    const e = out.entries[name];
    if (!e || e.from === null) return false;
    if (e.defined === null) e.defined = definesMember(sources[e.file], e.blockStart, e.from);
    return e.defined;
  };
  return out;
}

// 등록으로 window 에 나가는가(위 ①~⑤).
function registeredOnWindow(name, from, root) {
  const r = registry(root);
  if (!r.ok) return false;
  const e = Object.prototype.hasOwnProperty.call(r.entries, name) ? r.entries[name] : null;
  return !!(e && e.from === (from || name) && e.window && r.definedOf(name));
}
// 등록으로 통로(OurgoalAppScope)에 나가는가(위 ①~⑤).
function registeredOnScope(name, from, root) {
  const r = registry(root);
  if (!r.ok) return false;
  const e = Object.prototype.hasOwnProperty.call(r.entries, name) ? r.entries[name] : null;
  return !!(e && e.from === (from || name) && e.scope && r.definedOf(name));
}

function api(root) {
  return {
    // 옛 단언 `source.includes('window.A = B;')` 를 넓힌 것: 옛 배선 글자가 있거나, 같은 이름·같은 값이 등록으로 window 에 나간다.
    windowExposed(source, legacyText) {
      const w = parseWindowWiring(legacyText);
      return String(source).includes(legacyText) || registeredOnWindow(w.name, w.from, root);
    },
    // 옛 단언 `source.includes('get A(){ return B; }')` 를 넓힌 것: 옛 getter 글자가 있거나, 같은 이름·같은 값이 등록으로 통로에 나간다.
    scopeExposed(source, legacyText) {
      const w = parseGetterWiring(legacyText);
      return String(source).includes(legacyText) || registeredOnScope(w.name, w.from, root);
    },
    // 「함수 시작 ~ 노출 줄 앞」을 잘라 쓰는 시험지의 끝 지점. 옛 노출 줄이 있으면 그 자리(고치기 전과 같다),
    // 없는데 등록으로 window 에 나가면 글자 끝, 둘 다 아니면 -1(시험지의 「종료점 발견」 단언이 그대로 실패한다).
    exposureEnd(source, legacyText, fromIndex) {
      const w = parseWindowWiring(legacyText);
      const i = String(source).indexOf(legacyText, fromIndex || 0);
      if (i >= 0) return i;
      return registeredOnWindow(w.name, w.from, root) ? String(source).length : -1;
    },
    registeredOnWindow: (name, from) => registeredOnWindow(name, from, root),
    registeredOnScope: (name, from) => registeredOnScope(name, from, root),
    registry: () => registry(root),
  };
}

module.exports = Object.assign(api(DEFAULT_ROOT), { forRoot: root => api(root), parseWindowWiring, parseGetterWiring, scriptTags /* #TASK-ES-666: tests/helpers/moved-code.js 가 같은 태그 읽기를 쓴다 */ });
