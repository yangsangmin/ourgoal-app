// tests/quest-task-exp.test.js
// #TASK-ES-284 [노션 33] 오늘의 퀘스트 미션 변경 ('핵심 마일스톤 1개' -> '할일 1개' 실행 및 10EXP 보상 조정) 검증 테스트

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { readComponentsBundle, componentsLoadOrder } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)

const SUITE_NAME = 'quest-task-exp';

async function runTests() {
  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8'));
  const compJs = readComponentsBundle();
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf-8');

  // 1. index.html 오늘의 퀘스트 2번 미션 '할일 1개 완료' 및 '+10 EXP' 검증
  assert(
    indexHtml.includes('할일 1개 완료') && indexHtml.includes('+10 EXP'),
    'Quest 2 must be "할일 1개 완료" with "+10 EXP"'
  );
  assert(
    indexHtml.includes('awardXP(10, \'데일리 퀘스트: 할일 1개 완료 (+10 EXP)\')'),
    'awardXP must award 10 EXP for Quest 2'
  );

  // 2. index.html 내 og-task-33 컨테이너 및 액션 버튼 마운트 검증
  assert(indexHtml.includes('id="og-task-33-container"'), 'Must contain #og-task-33-container');
  assert(indexHtml.includes('id="og-task-33-action-btn"'), 'Must contain #og-task-33-action-btn');
  assert(indexHtml.includes('handle홈탭_Item33Action(event)'), 'Action button must call handle홈탭_Item33Action(event)');

  // 3. js/components.js 내 핸들러 및 4위 1체 배선 검증
  assert(compJs.includes('async function handle홈탭_Item33Action('), 'Must declare handle홈탭_Item33Action');
  assert(compJs.includes('og_task-33_cache'), 'Must persist to og_task-33_cache');
  assert(compJs.includes('vibrate(12)'), 'Must trigger 12ms haptic feedback');
  assert(compJs.includes('window.handle홈탭_Item33Action = handle홈탭_Item33Action;'), 'Must export handle홈탭_Item33Action to window');

  // 4. ui.css 내 스타일 및 375px 모바일 미디어 쿼리 검증
  assert(uiCss.includes('#og-task-33-container'), 'ui.css must contain #og-task-33-container rules');
  assert(uiCss.includes('#og-task-33-action-btn'), 'ui.css must contain #og-task-33-action-btn rules');
  assert(uiCss.includes('min-height: 44px;'), 'Action button must have 44px min-height');

  // 5. 가상 DOM 환경에서 handle홈탭_Item33Action 동작 검증
  const mockStorage = {};
  global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); }
  };
  global.navigator = { vibrate: () => true };
  global.window = global;

  const btn = { textContent: 'Initial', disabled: false };
  global.document = {
    addEventListener: () => {},
    getElementById: (id) => {
      if (id === 'og-task-33-action-btn') return btn;
      return null;
    }
  };

  const context = {
    window: global.window,
    document: global.document,
    localStorage: global.localStorage,
    navigator: global.navigator
  };

  const vm = require('vm');
  vm.createContext(context);
  // #TASK-ES-412: 브라우저와 같은 순서(키트 부품 → js/components.js)로 읽는다. 부품이 없으면 js/components.js 하나(이전과 같은 글자).
  componentsLoadOrder().forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf-8'), context); });

  assert(typeof context.window.handle홈탭_Item33Action === 'function', 'handle홈탭_Item33Action must be a function in context');

  // Action 호출
  await context.window.handle홈탭_Item33Action({ stopPropagation: () => {} });

  // 영속화 검증
  const cached = JSON.parse(mockStorage['og_task-33_cache']);
  assert.strictEqual(cached.ticket, '33');
  assert.strictEqual(cached.quest_target, 'todo_1');
  assert.strictEqual(cached.exp_reward, 10);
  assert.strictEqual(cached.state, 'completed');
}

runTests().catch((err) => {
  console.error(err);
  throw err;
});
