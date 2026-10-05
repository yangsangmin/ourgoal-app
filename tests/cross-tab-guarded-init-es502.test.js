'use strict';
// #TASK-ES-502 모듈 가드 ⑤(탭 간 직접 참조) 측정기 — 「없으면 만들어 두는」 방어 초기화를 그 탭의 전역 정의로 세지 않는다.
//  · 오탐 사례: 탭 A 가 if(!window.X) window.X = [] / window.X = window.X || {} 로만 X 를 건드리면, 탭 B 가 X 를 써도 탭 간 참조가 아니다(0건).
//  · 진짜 사례: 탭 A 가 window.Y = function… 로 새 전역을 정의하면, 탭 B 가 Y 를 쓰는 것은 여전히 탭 간 참조다(잡힘).
//  · 지금 저장소 값: ⑤ 는 0 그대로.
// 임시 폴더에 js/tabs/<탭>/ 파일만 만들어 scripts/module-metrics.js 의 crossTabRefs 를 그대로 돌린다(가짜 계산 없음).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const metrics = require('../scripts/module-metrics.js');

let pass = 0;
function check(name, fn) { fn(); pass++; console.log('  ok · ' + name); }

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'es502-'));
  for (const [rel, text] of Object.entries(files)) {
    const f = path.join(root, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, text, 'utf8');
  }
  return root;
}

console.log('[cross-tab-guarded-init-es502] 탭 간 직접 참조 — 방어 초기화는 정의가 아니다');

check('오탐 ①: if(!window.X) window.X = [] 만 있는 탭의 X 를 다른 탭이 써도 0건', () => {
  const root = fixture({
    'js/tabs/goals/a.js': "(function(){ if(!window.FEED_CACHE) window.FEED_CACHE = [];\n  window.FEED_CACHE.unshift(1); })();\n",
    'js/tabs/comm/b.js': "(function(){ var L = {}; if(L.FEED_CACHE) L.FEED_CACHE.forEach(function(){}); })();\n"
  });
  assert.strictEqual(metrics.crossTabRefs(root).length, 0);
  assert.strictEqual(metrics.tabDefinedSymbols([fs.readFileSync(path.join(root, 'js/tabs/goals/a.js'), 'utf8')]).has('FEED_CACHE'), false);
});

check('오탐 ②: window.X = window.X || {} 도 정의로 세지 않는다(global·globalThis·공백 변형 포함)', () => {
  const syms = metrics.tabDefinedSymbols([
    "window.SHARED = window.SHARED || {};\nglobal . OTHER=global.OTHER||[];\nif ( ! globalThis.THIRD ) globalThis.THIRD = 1;\n"
  ]);
  assert.deepStrictEqual(Array.from(syms).sort(), []);
});

check('진짜: window.Y = function… 로 새 전역을 정의한 탭의 Y 를 다른 탭이 쓰면 여전히 잡힌다', () => {
  const root = fixture({
    'js/tabs/goals/a.js': "(function(){ window.openGoalThing = function(){ return 1; }; if(!window.FEED_CACHE) window.FEED_CACHE = []; })();\n",
    'js/tabs/comm/b.js': "(function(){ openGoalThing(); var c = window.FEED_CACHE; })();\n"
  });
  const hits = metrics.crossTabRefs(root);
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].from, 'comm');
  assert.strictEqual(hits[0].to, 'goals');
  assert.ok(/openGoalThing/.test(hits[0].text));
});

check('진짜: 이름이 다른 방어 초기화(if(!window.A) window.B = …)는 B 의 정의로 센다', () => {
  const syms = metrics.tabDefinedSymbols(["if(!window.A) window.B = function(){};\n"]);
  assert.deepStrictEqual(Array.from(syms), ['B']);
});

check('진짜: 무조건 대입 window.X = X 는 그대로 정의로 센다', () => {
  const syms = metrics.tabDefinedSymbols(["function renderThing(){}\nwindow.renderThing = renderThing;\n"]);
  assert.deepStrictEqual(Array.from(syms), ['renderThing']);
});

check('지금 저장소: ⑤ 탭 간 직접 참조 0', () => {
  assert.strictEqual(metrics.crossTabRefs(path.join(__dirname, '..')).length, 0);
});

console.log('[cross-tab-guarded-init-es502] ' + pass + ' passed');
