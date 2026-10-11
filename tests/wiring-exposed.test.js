'use strict';
// #TASK-ES-620 — tests/helpers/wiring-exposed.js 자체 시험.
// 넓힌 단언(옛 배선 글자 또는 등록)이 가짜로 통과하지 않는지를 저장소 밖 임시 트리(가짜 index.html + 세포 파일)에서 잰다.
//   · 배선도 등록도 없는 이름은 실패 · 값은 등록됐는데 window 목록에 없으면 window 단언 실패 · 엉뚱한 세포 파일(읽지 않는 파일·commit 뒤·defer)만 있으면 실패
//   · 등록 값이 옛 배선의 오른쪽 이름과 다르면 실패 · 세포가 그 값을 달지 않으면 실패 · 표지 밖의 provide 글자·주석·문자열은 등록이 아니다
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const wiring = require('./helpers/wiring-exposed');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wiring-exposed-test-'));
let seq = 0;
const START = '/* ==== [세포 등록 시작 · gen-cell-provide.js] 시험용 ==== */';
const END = '/* ==== [세포 등록 끝] ==== */';
const TAG = (src, attrs) => '<script src="' + src + '"' + (attrs ? ' ' + attrs : '') + '></script>';
const REG_TAG = TAG('js/core/cell-registry.js'), COMMIT_TAG = TAG('js/core/cell-registry-commit.js');

// 세포 본문: 키트에 alpha·beta 를 단다. 등록 블록: alpha(통로+window) · aliasA(=alpha, window) · beta(통로만) · onlyWin(=beta, window 전용)
const CELL_BODY = [
  '(function (global) {',
  '  var K = global.DemoKit = global.DemoKit || {};',
  '  function alpha() { return 1; }',
  '  function beta() { return 2; }',
  '  K.alpha = alpha;',
  '  K.beta = beta;',
  '})(typeof window !== "undefined" ? window : globalThis);',
].join('\n');
function block(owner, valuesSrc, optsSrc) {
  return [START, '(function (g) {', '  var R = g.OurgoalCellRegistry;', '  if (!R) return;', '  var K = g.DemoKit;',
    "  if (K) R.provide('" + owner + "', " + valuesSrc + ', ' + optsSrc + ');', '})(typeof window !== "undefined" ? window : globalThis);', END].join('\n');
}
const GOOD_BLOCK = block('demo/cell', '{ alpha: K.alpha, aliasA: K.alpha, beta: K.beta, onlyWin: K.beta }', "{ window: ['alpha', 'aliasA', 'onlyWin'], windowOnly: ['onlyWin'] }");

// 임시 트리 하나를 만든다. files: { 경로: 글자 }, tags: index.html 에 넣을 태그 줄들, inline: 인라인 IIFE 글자
function tree(opts) {
  const root = path.join(TMP, 't' + (++seq));
  const files = Object.assign({ 'js/core/cell-registry.js': '/* 등록 기관(시험용) */', 'js/core/cell-registry-commit.js': '/* commit(시험용) */' }, opts.files || {});
  for (const rel of Object.keys(files)) {
    if (files[rel] === null) continue;
    const f = path.join(root, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, files[rel], { encoding: 'utf8' });
  }
  const html = ['<!doctype html><html><head>', ...(opts.tags || []), '<script>', '(function(){', '"use strict";', opts.inline || '', '})();', '</script>', '</head><body></body></html>'].join('\n');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'index.html'), html, { encoding: 'utf8' });
  return { root, html, w: wiring.forRoot(root) };
}
const CELL = 'js/tabs/demo/cell.js';
const goodFiles = () => ({ [CELL]: CELL_BODY + '\n' + GOOD_BLOCK + '\n' });
const goodTags = () => [REG_TAG, TAG(CELL), COMMIT_TAG];

let n = 0;
function t(title, fn) { fn(); n++; console.log('  ok · ' + title); }

try {
  t('옛 배선 글자가 있으면 등록이 없어도 참(고치기 전 단언과 같은 판정)', () => {
    const x = tree({ tags: [], inline: '  window.legacyOnly = legacyOnly;\n  get legacyOnly(){ return legacyOnly; },' });
    assert.strictEqual(x.w.windowExposed(x.html, 'window.legacyOnly = legacyOnly;'), true);
    assert.strictEqual(x.w.scopeExposed(x.html, 'get legacyOnly(){ return legacyOnly; }'), true);
    assert.strictEqual(x.w.registeredOnWindow('legacyOnly'), false, '등록은 없다');
  });

  t('배선도 등록도 없는 이름은 거짓', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    assert.strictEqual(x.w.windowExposed(x.html, 'window.nowhere = nowhere;'), false);
    assert.strictEqual(x.w.scopeExposed(x.html, 'get nowhere(){ return nowhere; }'), false);
    assert.strictEqual(x.w.exposureEnd(x.html, 'window.nowhere = nowhere;', 0), -1);
  });

  t('옛 배선 글자가 없어도 등록으로 window 에 나가면 참', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    assert.strictEqual(x.html.includes('window.alpha = alpha;'), false, '시험 전제: 옛 배선 글자 없음');
    assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), true);
    assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha'), true, '세미콜론 없는 옛 글자도 같은 이름으로 읽는다');
  });

  t('값은 등록됐는데 window 목록에 없으면 window 단언은 거짓', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    assert.strictEqual(x.w.registeredOnScope('beta'), true, '시험 전제: beta 는 통로에는 등록돼 있다');
    assert.strictEqual(x.w.windowExposed(x.html, 'window.beta = beta;'), false);
  });

  t('별칭: 등록 값이 옛 배선의 오른쪽 이름과 같을 때만 참', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    assert.strictEqual(x.w.windowExposed(x.html, 'window.aliasA = alpha;'), true);
    assert.strictEqual(x.w.windowExposed(x.html, 'window.aliasA = aliasA;'), false, '값 이름이 다르다');
    assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = beta;'), false, '다른 값을 가리킨다');
  });

  t('통로: windowOnly 에 든 이름은 통로 단언이 거짓, 아니면 참', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    assert.strictEqual(x.w.scopeExposed(x.html, 'get alpha(){ return alpha; }'), true);
    assert.strictEqual(x.w.scopeExposed(x.html, 'get onlyWin(){ return beta; }'), false);
    assert.strictEqual(x.w.windowExposed(x.html, 'window.onlyWin = beta;'), true, 'window 에는 나간다');
  });

  t('엉뚱한 세포 파일: index.html 이 읽지 않는 파일의 등록은 등록이 아니다', () => {
    const x = tree({ files: goodFiles(), tags: [REG_TAG, TAG('js/tabs/demo/other.js'), COMMIT_TAG] });
    assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), false);
    const y = tree({ files: Object.assign(goodFiles(), { 'js/tabs/demo/other.js': CELL_BODY }), tags: [REG_TAG, TAG('js/tabs/demo/other.js'), COMMIT_TAG] });
    assert.strictEqual(y.w.windowExposed(y.html, 'window.alpha = alpha;'), false, '이름을 다는 파일만 읽고 등록 파일은 읽지 않는다');
  });

  t('읽는 순서: commit 뒤·기관 앞·defer·async·주석 안의 태그는 등록이 아니다', () => {
    for (const tags of [[REG_TAG, COMMIT_TAG, TAG(CELL)], [TAG(CELL), REG_TAG, COMMIT_TAG], [REG_TAG, TAG(CELL, 'defer'), COMMIT_TAG], [REG_TAG, TAG(CELL, 'async'), COMMIT_TAG], [REG_TAG, '<!-- ' + TAG(CELL) + ' -->', COMMIT_TAG]]) {
      const x = tree({ files: goodFiles(), tags });
      assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), false, tags.join(' '));
    }
  });

  t('등록 기관·commit 태그나 파일이 없으면 등록이 아니다', () => {
    for (const o of [{ tags: [TAG(CELL), COMMIT_TAG] }, { tags: [REG_TAG, TAG(CELL)] }, { tags: [COMMIT_TAG, TAG(CELL), REG_TAG] }, { tags: [REG_TAG, TAG(CELL), TAG('js/core/cell-registry-commit.js', 'defer')] },
      { tags: goodTags(), files: Object.assign(goodFiles(), { 'js/core/cell-registry-commit.js': null }) }]) {
      const x = tree({ files: o.files || goodFiles(), tags: o.tags });
      assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), false, o.tags.join(' '));
    }
  });

  t('표지 밖의 provide 글자·주석·문자열은 등록이 아니다', () => {
    const bare = GOOD_BLOCK.replace(START, '').replace(END, '');
    const cases = [CELL_BODY + '\n' + bare, CELL_BODY + '\n/* ' + GOOD_BLOCK.replace(/\*\//g, '* /') + ' */', CELL_BODY + '\nvar note = ' + JSON.stringify(GOOD_BLOCK) + ';'];
    for (const src of cases) {
      const x = tree({ files: { [CELL]: src }, tags: goodTags() });
      assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), false);
    }
    // 표지 안이어도 등록 문이 아닌 자리(함수 안쪽 깊은 곳, 문자열)는 읽지 않는다
    const deep = [START, '(function (g) {', '  var R = g.OurgoalCellRegistry; var K = g.DemoKit;', "  function never() { if (K) R.provide('demo/cell', { alpha: K.alpha }, { window: ['alpha'] }); }",
      "  var s = \"R.provide('demo/cell', { alpha: K.alpha }, { window: ['alpha'] })\";", '})(globalThis);', END].join('\n');
    const z = tree({ files: { [CELL]: CELL_BODY + '\n' + deep }, tags: goodTags() });
    assert.strictEqual(z.w.windowExposed(z.html, 'window.alpha = alpha;'), false);
  });

  t('세포가 그 값을 달지 않으면(등록만 있고 정의가 없으면) 거짓', () => {
    const noDef = CELL_BODY.replace('  K.alpha = alpha;\n', '');
    const x = tree({ files: { [CELL]: noDef + '\n' + GOOD_BLOCK }, tags: goodTags() });
    assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), false);
    assert.strictEqual(x.w.windowExposed(x.html, 'window.onlyWin = beta;'), true, '다는 값(beta)은 그대로 참');
  });

  t('등록 값이 `손잡이.속성` 꼴이 아니면 거짓', () => {
    for (const v of ['{ alpha: function () {} }', '{ alpha: g.alpha }', "{ alpha: K['alpha'] }", '{ alpha: alpha }']) {
      const x = tree({ files: { [CELL]: CELL_BODY + '\n' + block('demo/cell', v, "{ window: ['alpha'] }") }, tags: goodTags() });
      assert.strictEqual(x.w.windowExposed(x.html, 'window.alpha = alpha;'), false, v);
    }
  });

  t('같은 이름을 두 세포가 등록하면 먼저 읽는 세포의 등록만 본다', () => {
    const one = CELL_BODY + '\n' + block('demo/one', '{ dup: K.alpha }', "{ window: ['dup'] }");
    const two = CELL_BODY + '\n' + block('demo/two', '{ dup: K.beta }', "{ window: ['dup'] }");
    const x = tree({ files: { 'js/tabs/demo/one.js': one, 'js/tabs/demo/two.js': two }, tags: [REG_TAG, TAG('js/tabs/demo/one.js'), TAG('js/tabs/demo/two.js'), COMMIT_TAG] });
    assert.strictEqual(x.w.windowExposed(x.html, 'window.dup = alpha;'), true);
    assert.strictEqual(x.w.windowExposed(x.html, 'window.dup = beta;'), false);
  });

  t('끝 지점(exposureEnd): 옛 노출 줄 자리 → 없고 등록이면 글자 끝 → 둘 다 없으면 -1', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    const withLine = 'function alpha() {}\nwindow.alpha = alpha;\nrest';
    assert.strictEqual(x.w.exposureEnd(withLine, 'window.alpha = alpha;', 0), withLine.indexOf('window.alpha = alpha;'));
    const cut = '\nfunction alpha() {}\n';
    assert.strictEqual(x.w.exposureEnd(cut, 'window.alpha = alpha;', 1), cut.length);
    assert.strictEqual(x.w.exposureEnd(cut, 'window.beta = beta;', 1), -1);
  });

  t('옛 배선 글자가 정해진 꼴이 아니면 오류(엉뚱한 글자로 조용히 통과하지 않는다)', () => {
    const x = tree({ files: goodFiles(), tags: goodTags() });
    for (const bad of ['alpha', 'window.alpha', 'window.alpha = function () {}', 'window.alpha = alpha; window.beta = beta;', 'window.alpha == alpha', '']) {
      assert.throws(() => x.w.windowExposed(x.html, bad), /wiring-exposed/, bad);
    }
    assert.throws(() => x.w.scopeExposed(x.html, 'get alpha(){ return 1; }'), /wiring-exposed/);
  });

  t('이 저장소: 등록 기관이 읽히고, 등록된 window 이름은 참 · 지어낸 이름은 거짓', () => {
    const r = wiring.registry();
    assert.strictEqual(r.ok, true, '등록 기관 → commit 태그 순서: ' + r.why);
    assert.ok(r.files > 0, '등록 블록이 있는 세포 파일 수 ' + r.files);
    const names = Object.keys(r.entries).filter(k => r.entries[k].window && r.entries[k].from === k);
    assert.ok(names.length > 0, 'window 로 등록된 이름 수 ' + names.length);
    const pick = names[0];
    assert.strictEqual(wiring.registeredOnWindow(pick), true, pick);
    assert.strictEqual(wiring.windowExposed('', 'window.' + pick + ' = ' + pick + ';'), true, pick);
    assert.strictEqual(wiring.windowExposed('', 'window.__es620_no_such_name__ = __es620_no_such_name__;'), false);
    console.log('     (이 저장소: 등록 블록 세포 ' + r.files + '개 · 등록 이름 ' + Object.keys(r.entries).length + '개)');
  });

  console.log('wiring-exposed: ' + n + '개 검사 끝');
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* 임시 폴더 정리 실패는 무시 */ }
}
