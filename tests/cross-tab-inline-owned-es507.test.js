'use strict';
// #TASK-ES-507 모듈 가드 ⑤(탭 간 직접 참조) 측정기 — index.html 인라인 스크립트가 window 에 다는 이름은 인라인이 주인이다.
//  · 오탐 사례: 인라인이 window.FLAG 를 만들고(var FLAG + window.FLAG = false), comm 세포가 그 값을 바꿔 쓰고(window.FLAG = true),
//    goals 세포가 window.FLAG 를 읽어도 탭 간 참조가 아니다(0건) — 둘 다 인라인 공용 상태를 쓰는 것.
//  · 진짜 사례: 인라인에 없는 새 전역을 comm 세포가 정의(window.openCommThing = function…)하고 goals 가 쓰면 여전히 잡힌다.
//  · 지금 저장소 값: ⑤ 는 0 그대로.
// 임시 폴더에 index.html·js/tabs/<탭>/ 파일을 만들어 scripts/module-metrics.js 의 crossTabRefs 를 그대로 돌린다.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const metrics = require('../scripts/module-metrics.js');

let pass = 0;
function check(name, fn) { fn(); pass++; console.log('  ok · ' + name); }

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'es507-'));
  for (const [rel, text] of Object.entries(files)) {
    const f = path.join(root, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, text, 'utf8');
  }
  return root;
}

const INDEX = '<!doctype html><html><body>\n<script src="js/tabs/comm/a.js"></script>\n<script>\n(function(){\n  "use strict";\n  var FLAG = false;\n  if(typeof window !== "undefined"){ window.FLAG = false; }\n})();\n</script>\n</body></html>\n';

console.log('[cross-tab-inline-owned-es507] 탭 간 직접 참조 — 인라인이 주인인 window 이름은 탭의 정의가 아니다');

check('인라인이 window 에 다는 이름을 모은다', () => {
  const root = fixture({ 'index.html': INDEX });
  assert.ok(metrics.inlineWindowSymbols(root).has('FLAG'));
});

check('오탐: 인라인 주인 이름을 comm 이 바꿔 쓰고 goals 가 읽어도 0건', () => {
  const root = fixture({
    'index.html': INDEX,
    'js/tabs/comm/a.js': "(function(){ var L = {}; L.FLAG = true; if(typeof window !== 'undefined'){ window.FLAG = true; } })();\n",
    'js/tabs/goals/b.js': "(function(){ if(!window.FLAG){ return 1; } })();\n"
  });
  assert.strictEqual(metrics.crossTabRefs(root).length, 0);
});

check('진짜: 인라인에 없는 새 전역을 comm 이 정의하고 goals 가 쓰면 1건 잡힌다', () => {
  const root = fixture({
    'index.html': INDEX,
    'js/tabs/comm/a.js': "(function(){ window.FLAG = true; window.openCommThing = function(){ return 1; }; })();\n",
    'js/tabs/goals/b.js': "(function(){ if(!window.FLAG){ openCommThing(); } })();\n"
  });
  const hits = metrics.crossTabRefs(root);
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].from, 'goals');
  assert.strictEqual(hits[0].to, 'comm');
  assert.ok(/openCommThing/.test(hits[0].text));
});

check('index.html 이 없으면 예전처럼 센다(인라인 주인 없음)', () => {
  const root = fixture({
    'js/tabs/comm/a.js': "(function(){ window.FLAG = true; })();\n",
    'js/tabs/goals/b.js': "(function(){ var x = window.FLAG; })();\n"
  });
  assert.strictEqual(metrics.crossTabRefs(root).length, 1);
});

check('지금 저장소: ⑤ 탭 간 직접 참조 0', () => {
  assert.strictEqual(metrics.crossTabRefs(path.join(__dirname, '..')).length, 0);
});

console.log('[cross-tab-inline-owned-es507] ' + pass + ' passed');
