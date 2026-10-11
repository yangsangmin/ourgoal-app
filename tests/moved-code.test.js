'use strict';
// #TASK-ES-666 — tests/helpers/moved-code.js 자체 시험.
// 넓힌 단언(옛 글자 또는 옮겨 간 자리)이 가짜로 통과하지 않는지를 저장소 밖 임시 트리(가짜 index.html + 세포 파일)에서 잰다.
//   · 옛 글자도 옮겨 간 대상도 없으면 거짓 · index.html 이 읽지 않는 파일·defer 태그·주석 안의 태그의 파일은 세포가 아니다
//   · 주석·문자열 안의 글자, 함수 안쪽 깊은 곳의 선언, 함수 식은 「함수 선언」이 아니다 · 첫 문이 다르면 거짓
//   · 상태 기관을 읽지 않거나, 세포가 기관보다 먼저 읽히거나, 이름·초기값이 다르면 거짓
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const moved = require('./helpers/moved-code');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'moved-code-test-'));
let seq = 0;
const TAG = (src, attrs) => '<script src="' + src + '"' + (attrs ? ' ' + attrs : '') + '></script>';
const STATE_TAG = TAG('js/core/app-state.js');
const CELL = 'js/tabs/demo/cell.js', CORE = 'js/core/boot-demo.js';
const wrap = body => "(function(global) {\n  'use strict';\n  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};\n" + body + "\n})(typeof window !== 'undefined' ? window : globalThis);\n";
const FN_CELL = wrap("  function cleanWords(text){\n    if(!window.__FORCE_DEMO) return '';\n    return L.escapeHtml(text);\n  }\n  function emptyOne(){}\n");
const STATE_CELL = wrap("  function bootDemo() {\n    window.OurgoalAppState.defineVar('_demoOpen', false);\n    window.OurgoalAppState.define('DEMO_LIST', [ 'a', L.pad(1) ]);\n  }\n");

// 임시 트리: files { 경로: 글자 }, tags: index.html 에 넣을 태그들, inline: 인라인 IIFE 안 글자
function tree(opts) {
  const root = path.join(TMP, 't' + (++seq));
  const files = Object.assign({ 'js/core/app-state.js': '/* 상태 기관(시험용) */' }, opts.files || {});
  for (const rel of Object.keys(files)) { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, files[rel], { encoding: 'utf8' }); }
  // raw: index.html 머리 안의 줄을 통째로 준다(#TASK-ES-678 — 인라인 스크립트와 태그의 앞뒤 순서를 시험이 정한다)
  const html = ['<!doctype html><html><head>', ...(opts.raw || [...(opts.tags || []), ...(opts.inline === undefined ? [] : ['<script>', '(function(){', '"use strict";', opts.inline, '})();', '</script>'])]), '</head><body></body></html>'].join('\n');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'index.html'), html, { encoding: 'utf8' });
  return { root, html, m: moved.forRoot(root) };
}

let n = 0;
function t(title, fn) { fn(); n++; console.log('  ok · ' + title); }

try {
  t('옛 글자가 있으면 옮겨 간 대상이 없어도 참(고치기 전 단언과 같은 판정)', () => {
    const x = tree({ tags: [], inline: '  /* cleanWords → 옮김 */\n  var _demoOpen = false;' });
    assert.strictEqual(x.m.textOrFunctionDefined(x.html, 'cleanWords', 'cleanWords'), true);
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, 'cleanWords → 옮김', 'cleanWords', "if(!window.__FORCE_DEMO) return '';"), true);
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), true);
    assert.strictEqual(x.m.cellFunctions('cleanWords').length, 0, '세포에는 없다');
  });

  t('옛 글자도 옮겨 간 대상도 없으면 거짓', () => {
    const x = tree({ files: { [CELL]: FN_CELL, [CORE]: STATE_CELL }, tags: [STATE_TAG, TAG(CELL), TAG(CORE)] });
    assert.strictEqual(x.m.textOrFunctionDefined(x.html, 'nowhereFn', 'nowhereFn'), false);
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, 'nowhereFn', 'nowhereFn', 'return 1;'), false);
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_nowhere = false;'), false);
  });

  t('함수: 옛 글자가 없어도 세포 파일 맨 위에 선언돼 있으면 참', () => {
    const x = tree({ files: { [CELL]: FN_CELL }, tags: [TAG(CELL)] });
    assert.strictEqual(x.html.includes('cleanWords'), false, '시험 전제: index.html 에 그 글자 없음');
    assert.strictEqual(x.m.textOrFunctionDefined(x.html, 'cleanWords', 'cleanWords'), true);
    const bare = tree({ files: { [CELL]: 'function cleanWords(){ return 1; }\n' }, tags: [TAG(CELL)] });
    assert.strictEqual(bare.m.textOrFunctionDefined(bare.html, 'cleanWords', 'cleanWords'), true, '파일 맨 위 선언도 받는다');
  });

  t('함수: index.html 이 읽지 않는 파일·defer·async·주석 안의 태그는 세포가 아니다', () => {
    for (const tags of [[], [TAG('js/tabs/demo/other.js')], [TAG(CELL, 'defer')], [TAG(CELL, 'async')], ['<!-- ' + TAG(CELL) + ' -->']]) {
      const x = tree({ files: { [CELL]: FN_CELL, 'js/tabs/demo/other.js': wrap('  var a = 1;') }, tags });
      assert.strictEqual(x.m.textOrFunctionDefined(x.html, 'cleanWords', 'cleanWords'), false, tags.join(' '));
    }
  });

  t('함수: 주석·문자열 안의 글자, 안쪽 깊은 선언, 함수 식은 선언이 아니다', () => {
    const cases = [wrap('  /* function cleanWords(text){ return 1; } */'), wrap("  var s = 'function cleanWords(text){ return 1; }';"),
      wrap('  function outer(){ function cleanWords(text){ return 1; } return cleanWords; }'), wrap('  var cleanWords2 = function cleanWords(text){ return 1; };'), wrap('  if (true) { function cleanWords(){ return 1; } }')];
    for (const src of cases) {
      const x = tree({ files: { [CELL]: src }, tags: [TAG(CELL)] });
      assert.strictEqual(x.m.textOrFunctionDefined(x.html, 'cleanWords', 'cleanWords'), false, src.slice(40, 110));
    }
  });

  t('함수 첫 문: 같으면 참(공백·이름 접두 L. 차이는 같은 것으로), 다르면 거짓', () => {
    const x = tree({ files: { [CELL]: FN_CELL }, tags: [TAG(CELL)] });
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, '(옛 표지 글자)', 'cleanWords', "if(!window.__FORCE_DEMO) return '';"), true);
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, '(옛 표지 글자)', 'cleanWords', "if ( !window.__FORCE_DEMO )  return '';"), true);
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, '(옛 표지 글자)', 'cleanWords', "if(!window.__FORCE_DEMO) return 'x';"), false);
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, '(옛 표지 글자)', 'cleanWords', 'return L.escapeHtml(text);'), false, '둘째 문은 첫 문이 아니다');
    assert.strictEqual(x.m.textOrFunctionStartsWith(x.html, '(옛 표지 글자)', 'emptyOne', 'return 1;'), false, '빈 함수');
    const changed = tree({ files: { [CELL]: FN_CELL.replace("if(!window.__FORCE_DEMO) return '';", 'var keep = 1;') }, tags: [TAG(CELL)] });
    assert.strictEqual(changed.m.textOrFunctionStartsWith(changed.html, '(옛 표지 글자)', 'cleanWords', "if(!window.__FORCE_DEMO) return '';"), false, '첫 문을 바꾸면 거짓');
  });

  t('상태: 옛 선언 글자가 없어도 상태 기관 호출로 같은 이름·같은 초기값이 만들어지면 참', () => {
    const x = tree({ files: { [CORE]: STATE_CELL }, tags: [STATE_TAG, TAG(CORE)] });
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), true);
    assert.strictEqual(x.m.textOrStateDefined(x.html, 'var _demoOpen = false;'), true, 'var 가 붙은 옛 글자도 같은 이름으로 읽는다');
    assert.strictEqual(x.m.textOrStateDefined(x.html, "DEMO_LIST = ['a', pad(1)];"), true, '초기값은 공백·이름 접두를 떼고 맞댄다');
    assert.deepStrictEqual(x.m.stateDefines('_demoOpen').map(d => d.kind), ['defineVar']);
  });

  t('상태: 초기값·이름이 다르면 거짓', () => {
    const x = tree({ files: { [CORE]: STATE_CELL }, tags: [STATE_TAG, TAG(CORE)] });
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = true;'), false);
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpened = false;'), false);
    assert.strictEqual(x.m.textOrStateDefined(x.html, "DEMO_LIST = ['a'];"), false);
  });

  t('상태: 기관을 읽지 않거나, 세포가 기관보다 먼저 읽히거나, 세포를 읽지 않으면 거짓', () => {
    for (const tags of [[TAG(CORE)], [TAG(CORE), STATE_TAG], [STATE_TAG], [STATE_TAG, TAG(CORE, 'defer')], [TAG('js/core/app-state.js', 'defer'), TAG(CORE)]]) {
      const x = tree({ files: { [CORE]: STATE_CELL }, tags });
      assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), false, tags.join(' '));
    }
  });

  t('상태: 주석·문자열 안의 호출 글자, 다른 객체의 define 은 상태 선언이 아니다', () => {
    const cases = [wrap("  /* window.OurgoalAppState.defineVar('_demoOpen', false); */"), wrap("  var s = \"window.OurgoalAppState.defineVar('_demoOpen', false);\";"),
      wrap("  var other = { define: function(){} }; other.define('_demoOpen', false);"), wrap("  window.OtherState.define('_demoOpen', false);"), wrap("  window.OurgoalAppState.define(name, false);")];
    for (const src of cases) {
      const x = tree({ files: { [CORE]: src }, tags: [STATE_TAG, TAG(CORE)] });
      assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), false, src.slice(40, 120));
    }
  });

  // ---- #TASK-ES-678: 상태 기관 호출이 index.html 의 인라인 스크립트(덩어리) 안에 있는 중간 단계 ----
  // 상태 이전(unstate)은 먼저 덩어리 안에서 `var X = 초기값;` 을 `window.OurgoalAppState.defineVar('X', 초기값);` 으로 바꾼다. 그 줄이 세포로 가는 것은 그 뒤다.
  const IIFE = body => ['<script>', '(function(){', '"use strict";', body, '})();', '</script>'];
  const DEF_LINE = "  window.OurgoalAppState.defineVar('_demoOpen', false);";

  t('#678 상태: 호출이 상태 기관 태그 뒤의 인라인 스크립트(덩어리) 안에 있으면 참 — 옛 선언 글자도 세포 파일의 호출도 없다', () => {
    const x = tree({ raw: [STATE_TAG, ...IIFE(DEF_LINE + "\n  window.OurgoalAppState.define('DEMO_LIST', [ 'a', pad(1) ]);")] });
    assert.strictEqual(x.html.includes('_demoOpen = false;'), false, '시험 전제: 옛 선언 글자 없음');
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), true);
    assert.strictEqual(x.m.textOrStateDefined(x.html, 'var _demoOpen = false;'), true);
    assert.strictEqual(x.m.textOrStateDefined(x.html, "DEMO_LIST = ['a', pad(1)];"), true);
    assert.deepStrictEqual(x.m.stateDefines('_demoOpen').map(d => [d.file, d.kind]), [['index.html(인라인)', 'defineVar']]);
    const nested = tree({ raw: [STATE_TAG, ...IIFE('  function bootInline(){\n  ' + DEF_LINE + '\n  }\n  bootInline();')] });
    assert.strictEqual(nested.m.textOrStateDefined(nested.html, '_demoOpen = false;'), true, '인라인 안쪽 함수 속의 호출도 같다(세포 파일과 같은 식)');
  });

  t('#678 상태(인라인): 초기값·이름이 다르면 거짓', () => {
    const x = tree({ raw: [STATE_TAG, ...IIFE(DEF_LINE)] });
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = true;'), false);
    assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpened = false;'), false);
    const t2 = tree({ raw: [STATE_TAG, ...IIFE(DEF_LINE.replace('false', 'true'))] });
    assert.strictEqual(t2.m.textOrStateDefined(t2.html, '_demoOpen = false;'), false, '호출의 초기값이 true 면 false 선언과 다르다');
    const t3 = tree({ raw: [STATE_TAG, ...IIFE(DEF_LINE.replace('_demoOpen', '_demoOpenOther'))] });
    assert.strictEqual(t3.m.textOrStateDefined(t3.html, '_demoOpen = false;'), false);
  });

  t('#678 상태(인라인): 상태 기관 태그보다 앞의 스크립트 · 기관 태그 없음 · 미뤄 읽는 기관 태그는 거짓', () => {
    for (const raw of [[...IIFE(DEF_LINE), STATE_TAG], IIFE(DEF_LINE), [TAG('js/core/app-state.js', 'defer'), ...IIFE(DEF_LINE)], ['<!-- ' + STATE_TAG + ' -->', ...IIFE(DEF_LINE)]]) {
      const x = tree({ raw });
      assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), false, raw.join(' ').slice(0, 120));
    }
  });

  t('#678 상태(인라인): 주석·문자열 안의 호출 글자, 다른 객체의 define, HTML 주석 안의 스크립트, 자바스크립트가 아닌 type 은 거짓', () => {
    const bodies = ['  /* ' + DEF_LINE.trim() + ' */', '  // ' + DEF_LINE.trim(), '  var s = "' + DEF_LINE.trim() + '";', "  var tpl = `" + DEF_LINE.trim() + "`;",
      "  window.OtherState.defineVar('_demoOpen', false);", "  var o = { defineVar: function(){} }; o.defineVar('_demoOpen', false);", "  window.OurgoalAppState.defineVar(name, false);", "  window.OurgoalAppState.defineVar('_demoOpen');"];
    for (const body of bodies) {
      const x = tree({ raw: [STATE_TAG, ...IIFE(body)] });
      assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), false, body);
    }
    const inHtmlComment = tree({ raw: [STATE_TAG, '<!--', ...IIFE(DEF_LINE), '-->'] });
    assert.strictEqual(inHtmlComment.m.textOrStateDefined(inHtmlComment.html, '_demoOpen = false;'), false, 'HTML 주석 안의 스크립트');
    for (const type of ['text/template', 'application/json', 'text/plain']) {
      const x = tree({ raw: [STATE_TAG, '<script type="' + type + '">', DEF_LINE, '</script>'] });
      assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), false, type);
    }
    const srcTag = tree({ raw: [STATE_TAG, '<script src="js/none.js">' + DEF_LINE + '</script>'] });
    assert.strictEqual(srcTag.m.textOrStateDefined(srcTag.html, '_demoOpen = false;'), false, 'src 가 있는 태그 안의 글자는 실행되지 않는다');
  });

  t('#678 상태(인라인): type 이 없거나 자바스크립트인 스크립트는 읽는다 · 코드로 읽히지 않는 스크립트는 거짓', () => {
    for (const open of ['<script>', '<script type="text/javascript">', '<script type="module">']) {
      const x = tree({ raw: [STATE_TAG, open, DEF_LINE, '</script>'] });
      assert.strictEqual(x.m.textOrStateDefined(x.html, '_demoOpen = false;'), true, open);
    }
    const broken = tree({ raw: [STATE_TAG, '<script>', 'function (( {{{ ' + DEF_LINE, '</script>'] });
    assert.doesNotThrow(() => broken.m.textOrStateDefined(broken.html, '_demoOpen = false;'), '깨진 스크립트에서 던지지 않는다');
  });

  t('#678 함수 선언·첫 문 갈래는 인라인 스크립트를 보지 않는다(넓힌 것은 상태 기관 호출뿐이다)', () => {
    const x = tree({ raw: [STATE_TAG, ...IIFE("  function cleanWords(text){ if(!window.__FORCE_DEMO) return ''; return text; }")] });
    assert.strictEqual(x.m.cellFunctions('cleanWords').length, 0);
    assert.strictEqual(x.m.textOrFunctionDefined('(다른 글자)', '옛 표지', 'cleanWords'), false);
    assert.strictEqual(x.m.textOrFunctionStartsWith('(다른 글자)', '옛 표지', 'cleanWords', "if(!window.__FORCE_DEMO) return '';"), false);
  });

  t('정해진 꼴이 아닌 글자·이름은 오류(엉뚱한 글자로 조용히 통과하지 않는다)', () => {
    const x = tree({ files: { [CELL]: FN_CELL }, tags: [TAG(CELL)] });
    assert.throws(() => x.m.textOrStateDefined(x.html, '_demoOpen'), /moved-code/);
    assert.throws(() => x.m.textOrStateDefined(x.html, ''), /moved-code/);
    assert.throws(() => x.m.textOrFunctionDefined(x.html, '(글자)', 'clean Words'), /moved-code/);
    assert.throws(() => x.m.textOrFunctionDefined(x.html, '', 'cleanWords'), /moved-code/);
    assert.throws(() => x.m.textOrFunctionStartsWith(x.html, '(글자)', 'cleanWords', ''), /moved-code/);
  });

  t('이 저장소: 세포 파일을 읽고, 실제 상태 기관 호출 하나는 찾고, 지어낸 이름은 못 찾는다', () => {
    const list = moved.cells();
    assert.ok(list.length > 0, '세포 파일 수 ' + list.length);
    assert.ok(list.indexOf('js/core/app-state.js') >= 0, '상태 기관을 읽는다');
    const root = path.join(__dirname, '..');
    let name = null;
    for (const rel of list) { const m = /window\.OurgoalAppState\.define(?:Var)?\('([A-Za-z_$][\w$]*)'/.exec(fs.readFileSync(path.join(root, rel), 'utf8')); if (m && rel !== 'js/core/app-state.js') { name = m[1]; break; } }
    assert.ok(name, '저장소에 상태 기관 호출이 하나는 있다');
    assert.ok(moved.stateDefines(name).length > 0, name);
    assert.strictEqual(moved.stateDefines('__es666_no_such_state__').length, 0);
    assert.strictEqual(moved.cellFunctions('__es666_no_such_function__').length, 0);
    console.log('     (이 저장소: 세포 파일 ' + list.length + '개 · 찾아본 상태 이름 ' + name + ')');
  });

  console.log('moved-code: ' + n + '개 검사 끝');
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* 임시 폴더 정리 실패는 무시 */ }
}
