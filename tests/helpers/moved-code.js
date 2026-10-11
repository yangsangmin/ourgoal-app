'use strict';
// #TASK-ES-666 (덩어리 안 글자 단언 넓히기 — 시험지): index.html 의 큰 인라인 IIFE(미분화 덩어리)가 비워져도,
// 「덩어리 안에 이 글자가 있어야 한다」던 단언이 원래 재려던 것(그 함수·그 값이 실제로 있다)을 계속 재게 하는 공용 도우미다.
// 단언은 둘 중 하나가 참이면 참이고, 둘 다 없으면 거짓이다.
//   (가) 옛 글자 — 시험지가 읽은 글자(source)에 옛 글자가 그대로 있다. 고치기 전 단언과 글자 하나 다르지 않은 판정이다.
//   (나) 옮겨 간 자리 — 그 대상이 index.html 이 읽는 세포 파일에 실제로 있다. 글자를 긁지 않고 세포 파일을 @babel/parser 로 읽는다.
//        세포 파일 = index.html 이 defer·async 없는 <script src> 로 읽는 js/ 아래 파일(주석 안의 태그·읽지 않는 파일은 세포가 아니다).
// 세 가지를 본다:
//   textOrFunctionDefined(source, 옛 글자, 함수 이름)
//       (나) = 그 이름의 함수 선언이 어느 세포 파일의 맨 위(파일 맨 위 또는 파일을 감싼 IIFE 바로 안)에 있다.
//   textOrFunctionStartsWith(source, 옛 글자, 함수 이름, 첫 문 글자)
//       (나) = 위에 더해, 그 함수 본문의 첫 문이 주어진 글자와 같다(공백과 생성기 이름 접두 L.·K. 는 떼고 맞댄다).
//   textOrStateDefined(source, 옛 선언 글자 `이름 = 초기값;`)
//       (나) = 상태 기관(js/core/app-state.js)을 index.html 이 먼저 읽고, 그 뒤에 읽는 세포 파일에
//              `window.OurgoalAppState.define('이름', 초기값)`(또는 defineVar) 호출이 있으며 초기값 글자가 옛 선언의 초기값과 같다.
// 옛 글자가 정해진 꼴이 아니거나 이름이 식별자가 아니면 오류를 던진다(엉뚱한 글자로 조용히 통과하는 일을 막는다).
// 파서는 (나)를 볼 때만 읽는다. 없으면 오류를 던진다 — NODE_PATH 로 저장소의 node_modules(@babel/parser)를 알려 준다.
const fs = require('fs');
const path = require('path');
const { scriptTags } = require('./wiring-exposed');

const DEFAULT_ROOT = path.join(__dirname, '..', '..');
const APP_STATE_JS = 'js/core/app-state.js';
const ID_RE = /^[A-Za-z_$][\w$]*$/;
const STATE_DECL_RE = /^\s*(?:var\s+)?([A-Za-z_$][\w$]*)\s*=\s*([^;]+?)\s*;?\s*$/;

let parserMod = null;
function parser() {
  if (!parserMod) {
    try { parserMod = require('@babel/parser'); }
    catch (e) { throw new Error('moved-code: @babel/parser 를 찾지 못했다 — NODE_PATH 에 저장소의 node_modules 를 준다(' + ((e && e.code) || e) + ')'); }
  }
  return parserMod;
}
// 생성기가 붙이는 이름 접두(L.·K.)와 공백을 떼고 맞댄다
const squash = t => String(t).replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1').replace(/\s+/g, '');
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

const cache = new Map();
// index.html 이 읽는 세포 파일들(읽는 순서): [{ src, at, text }]
function cells(root) {
  const key = path.resolve(root || DEFAULT_ROOT);
  if (cache.has(key)) return cache.get(key);
  const out = [];
  cache.set(key, out);
  let html;
  try { html = fs.readFileSync(path.join(key, 'index.html'), 'utf8'); } catch (e) { return out; }
  const seen = new Set();
  for (const t of scriptTags(html)) {
    if (t.lazy || !/^js\/.+\.js$/.test(t.src) || seen.has(t.src)) continue;
    seen.add(t.src);
    let text;
    try { text = fs.readFileSync(path.join(key, t.src), 'utf8'); } catch (e) { continue; }
    out.push({ src: t.src, at: t.at, text, ast: null });
  }
  return out;
}
function astOf(cell) {
  if (cell.ast === null) {
    try { cell.ast = parser().parse(cell.text, { sourceType: 'script', errorRecovery: true }); }
    catch (e) { cell.ast = false; } // 코드로 읽히지 않는 파일은 세포로 보지 않는다
  }
  return cell.ast || null;
}
// 세포 파일의 「맨 위」 문들: 파일 맨 위의 문 + 파일을 감싼 IIFE(맨 위 식 문의 함수) 바로 안의 문
function topStatements(ast) {
  const out = [];
  for (const st of ast.program.body) {
    out.push(st);
    let x = st.type === 'ExpressionStatement' ? st.expression : null;
    if (x && x.type === 'UnaryExpression') x = x.argument;
    if (x && x.type === 'CallExpression') {
      let c = x.callee;
      if (c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier' && (c.property.name === 'call' || c.property.name === 'apply')) c = c.object;
      if ((c.type === 'FunctionExpression' || c.type === 'ArrowFunctionExpression') && c.body.type === 'BlockStatement') out.push(...c.body.body);
    }
  }
  return out;
}
// 그 이름의 함수 선언(세포 파일 맨 위): [{ file, firstStatement }]
function cellFunctions(name, root) {
  if (!ID_RE.test(String(name))) throw new Error('moved-code: 함수 이름이 식별자가 아니다: ' + JSON.stringify(name));
  const found = [];
  for (const cell of cells(root)) {
    if (cell.text.indexOf('function ' + name) < 0 && cell.text.indexOf('function  ' + name) < 0) continue; // 파서를 돌릴 파일을 줄인다(판정은 아래 AST 로만 한다)
    const ast = astOf(cell);
    if (!ast) continue;
    for (const st of topStatements(ast)) {
      if (st.type !== 'FunctionDeclaration' || !st.id || st.id.name !== name) continue;
      const first = st.body.body[0] || null;
      found.push({ file: cell.src, firstStatement: first ? cell.text.slice(first.start, first.end) : null });
    }
  }
  return found;
}
// 상태 기관 호출 `window.OurgoalAppState.define('이름', 초기값)`(defineVar 포함)을 세포 파일에서 찾는다: [{ file, kind, init }]
function stateDefines(name, root) {
  if (!ID_RE.test(String(name))) throw new Error('moved-code: 상태 이름이 식별자가 아니다: ' + JSON.stringify(name));
  const all = cells(root), organ = all.find(c => c.src === APP_STATE_JS);
  const found = [];
  if (!organ) return found; // 상태 기관을 읽지 않으면 define 호출은 값을 만들지 못한다
  for (const cell of all) {
    if (cell.at <= organ.at || cell.text.indexOf('OurgoalAppState') < 0 || cell.text.indexOf(name) < 0) continue;
    const ast = astOf(cell);
    if (!ast) continue;
    walkAst(ast.program, n => {
      if (n.type !== 'CallExpression' || n.arguments.length !== 2) return;
      const c = n.callee, a = n.arguments;
      if (c.type !== 'MemberExpression' || c.computed || c.property.type !== 'Identifier' || (c.property.name !== 'define' && c.property.name !== 'defineVar')) return;
      const o = c.object; // window.OurgoalAppState
      if (o.type !== 'MemberExpression' || o.computed || o.property.type !== 'Identifier' || o.property.name !== 'OurgoalAppState' || o.object.type !== 'Identifier' || ['window', 'global', 'globalThis'].indexOf(o.object.name) < 0) return;
      if (a[0].type !== 'StringLiteral' || a[0].value !== name) return;
      found.push({ file: cell.src, kind: c.property.name, init: cell.text.slice(a[1].start, a[1].end) });
    });
  }
  return found;
}
function parseStateDecl(text) {
  const m = STATE_DECL_RE.exec(String(text));
  if (!m) throw new Error('moved-code: 옛 선언 글자가 `이름 = 초기값;` 꼴이 아니다: ' + JSON.stringify(text));
  return { name: m[1], init: m[2] };
}
function needText(legacyText) {
  if (typeof legacyText !== 'string' || !legacyText.trim()) throw new Error('moved-code: 옛 글자가 비어 있다');
}

function api(root) {
  return {
    // 옛 단언 `source.includes('…함수 이름이 든 글자…')` 를 넓힌 것: 옛 글자가 있거나, 그 함수가 세포 파일에 선언돼 있다.
    textOrFunctionDefined(source, legacyText, fnName) {
      needText(legacyText);
      return String(source).includes(legacyText) || cellFunctions(fnName, root).length > 0;
    },
    // 옛 글자가 있거나, 그 함수가 세포 파일에 선언돼 있고 본문 첫 문이 주어진 글자와 같다.
    textOrFunctionStartsWith(source, legacyText, fnName, firstStatementText) {
      needText(legacyText); needText(firstStatementText);
      if (String(source).includes(legacyText)) return true;
      const want = squash(firstStatementText);
      return cellFunctions(fnName, root).some(f => f.firstStatement !== null && squash(f.firstStatement) === want);
    },
    // 옛 단언 `source.includes('이름 = 초기값;')` 을 넓힌 것: 옛 선언 글자가 있거나, 상태 기관 호출로 같은 이름·같은 초기값이 만들어진다.
    textOrStateDefined(source, legacyDeclText) {
      const d = parseStateDecl(legacyDeclText);
      if (String(source).includes(legacyDeclText)) return true;
      const want = squash(d.init);
      return stateDefines(d.name, root).some(x => squash(x.init) === want);
    },
    cellFunctions: name => cellFunctions(name, root),
    stateDefines: name => stateDefines(name, root),
    cells: () => cells(root).map(c => c.src),
  };
}

module.exports = Object.assign(api(DEFAULT_ROOT), { forRoot: root => api(root), parseStateDecl });
