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

// ---- #TASK-ES-667: 부팅 파일(js/app/boot.js)·js/core 기관이 「무조건」 다는 이름도 인라인과 같은 지위다(인라인이 비워져도 같은 주인) ----
//  · 오탐 사례: 인라인 IIFE 가 없는 index.html 에서, js/core 구역 세포(또는 부팅 파일)가 window.FLAG 를 만들고 comm 이 바꿔 쓰고 goals 가 읽어도 0건.
//  · 진짜 사례(여전히 잡힌다): 기관이 그 이름을 읽기만 한다 · 기관이 방어 초기화(없으면 채우기)만 한다 · js/ 바로 아래 옛 파일이나 js/core 하위 폴더가 단다 ·
//    기관에 없는 새 전역을 comm 이 정의한다.
const INDEX_NO_IIFE = '<!doctype html><html><body>\n<script src="js/core/boot-x.js"></script><script src="js/tabs/comm/a.js"></script><script src="js/app/boot.js"></script>\n</body></html>\n';
const COMM_WRITES = "(function(){ var L = {}; L.FLAG = true; if(typeof window !== 'undefined'){ window.FLAG = true; } })();\n";
const GOALS_READS = "(function(){ if(!window.FLAG){ return 1; } })();\n";

check('#667 기관이 무조건 다는 이름을 모은다(방어 초기화 두 꼴과 주석 줄은 뺀다)', () => {
  const root = fixture({
    'index.html': INDEX_NO_IIFE,
    'js/core/boot-x.js': "(function(global){\n  function bootX(){ if(typeof window !== 'undefined'){ window.FLAG = false; } }\n  if(!window.GUARDED) window.GUARDED = [];\n  window.OR_FILLED = window.OR_FILLED || {};\n  // window.IN_COMMENT = 1;\n  global.ALIAS_SET = 1;\n})(window);\n",
    'js/app/boot.js': "(function(){ window.BOOT_SET = 1; })();\n"
  });
  const names = metrics.organWindowSymbols(root);
  assert.ok(names.has('FLAG') && names.has('ALIAS_SET') && names.has('BOOT_SET'));
  assert.ok(!names.has('GUARDED') && !names.has('OR_FILLED') && !names.has('IN_COMMENT'));
});

check('#667 오탐: 인라인이 비워지고 js/core 구역 세포가 다는 이름을 comm 이 바꿔 쓰고 goals 가 읽어도 0건', () => {
  const root = fixture({
    'index.html': INDEX_NO_IIFE,
    'js/core/boot-x.js': "(function(){ function bootX(){ if(typeof window !== 'undefined'){ window.FLAG = false; } } })();\n",
    'js/tabs/comm/a.js': COMM_WRITES,
    'js/tabs/goals/b.js': GOALS_READS
  });
  assert.strictEqual(metrics.inlineWindowSymbols(root).has('FLAG'), false, '시험 전제: 인라인에는 그 이름이 없다');
  assert.strictEqual(metrics.crossTabRefs(root).length, 0);
});

check('#667 오탐: 부팅 파일 js/app/boot.js 가 다는 이름도 같다(0건)', () => {
  const root = fixture({
    'index.html': INDEX_NO_IIFE,
    'js/app/boot.js': "(function(){ window.FLAG = false; })();\n",
    'js/tabs/comm/a.js': COMM_WRITES,
    'js/tabs/goals/b.js': GOALS_READS
  });
  assert.strictEqual(metrics.crossTabRefs(root).length, 0);
});

check('#667 대조: 그 기관 줄을 지우면 같은 꼴이 1건으로 잡힌다(규칙이 그 줄을 보고 있다)', () => {
  const root = fixture({
    'index.html': INDEX_NO_IIFE,
    'js/core/boot-x.js': "(function(){ function bootX(){ return 1; } })();\n",
    'js/tabs/comm/a.js': COMM_WRITES,
    'js/tabs/goals/b.js': GOALS_READS
  });
  const hits = metrics.crossTabRefs(root);
  assert.strictEqual(hits.length, 1);
  assert.strictEqual(hits[0].from, 'goals');
  assert.strictEqual(hits[0].to, 'comm');
});

check('#667 진짜: 기관이 읽기만 하거나 방어 초기화만 하면 주인이 아니다 — 1건', () => {
  for (const core of ["(function(){ if(window.FLAG === true){ return 1; } var x = window.FLAG; })();\n", "(function(){ if(!window.FLAG) window.FLAG = false; })();\n", "(function(){ window.FLAG = window.FLAG || false; })();\n", "(function(){ /* window.FLAG = false; */\n  // window.FLAG = false;\n })();\n"]) {
    const root = fixture({ 'index.html': INDEX_NO_IIFE, 'js/core/boot-x.js': core, 'js/tabs/comm/a.js': COMM_WRITES, 'js/tabs/goals/b.js': GOALS_READS });
    assert.strictEqual(metrics.crossTabRefs(root).length, 1, core);
  }
});

check('#667 진짜: js/ 바로 아래 옛 파일·js/core 하위 폴더·js/app 의 다른 파일이 다는 이름은 기관의 것이 아니다 — 1건', () => {
  for (const rel of ['js/legacy-thing.js', 'js/core/sub/deep.js', 'js/app/other.js', 'js/tabs/home/c.js']) {
    const root = fixture({ 'index.html': INDEX_NO_IIFE, [rel]: "(function(){ window.FLAG = false; })();\n", 'js/tabs/comm/a.js': COMM_WRITES, 'js/tabs/goals/b.js': GOALS_READS });
    assert.ok(metrics.crossTabRefs(root).length >= 1, rel);
    assert.strictEqual(metrics.organWindowSymbols(root).has('FLAG'), false, rel);
  }
});

check('#667 진짜: 기관 주인 이름이 있어도, 기관에 없는 새 전역을 comm 이 정의하고 goals 가 쓰면 1건', () => {
  const root = fixture({
    'index.html': INDEX_NO_IIFE,
    'js/core/boot-x.js': "(function(){ window.FLAG = false; })();\n",
    'js/tabs/comm/a.js': "(function(){ window.FLAG = true; window.openCommThing = function(){ return 1; }; })();\n",
    'js/tabs/goals/b.js': "(function(){ if(!window.FLAG){ openCommThing(); } })();\n"
  });
  const hits = metrics.crossTabRefs(root);
  assert.strictEqual(hits.length, 1);
  assert.ok(/openCommThing/.test(hits[0].text));
});

check('#667 진짜: 탭 키트 이름(Ourgoal<탭>…)·탭 경로 참조는 기관이 같은 이름을 달아도 여전히 잡힌다', () => {
  const root = fixture({
    'index.html': INDEX_NO_IIFE,
    'js/core/boot-x.js': "(function(){ window.OurgoalCommKit = {}; })();\n",
    'js/tabs/comm/a.js': "(function(global){ global.OurgoalCommKit = global.OurgoalCommKit || {}; })(window);\n",
    'js/tabs/goals/b.js': "(function(){ var k = window.OurgoalCommKit; })();\n"
  });
  assert.strictEqual(metrics.crossTabRefs(root).length, 1);
});

console.log('[cross-tab-inline-owned-es507] ' + pass + ' passed');
