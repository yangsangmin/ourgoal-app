// tests/enlarge-avatar-icons.test.js
// #TASK-ES-283 [노션 32] 홈 및 전 탭 우측 상단 아바타 아이콘 크기 확대 검증 테스트

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'enlarge-avatar-icons';

async function runTests() {
  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const avatarJs = fs.readFileSync(path.join(rootDir, 'js', 'avatar-system.js'), 'utf-8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf-8');

  // 1. index.html 탑바 #topAvatar 스타일 크기 (52px)
  assert(
    indexHtml.includes('id="topAvatar" style="width:52px;height:52px;"') ||
    indexHtml.includes('id="topAvatar" style="width: 52px; height: 52px;"'),
    'Top avatar container style must be 52px'
  );

  // 2. index.html levelBadgeHtml 내 아바타 렌더 사이즈 (72)
  assert(
    indexHtml.includes('renderAvatarHtml(p.level, state.profile, { size: 72,'),
    'levelBadgeHtml must render avatar with size 72'
  );
  assert(
    indexHtml.includes('class="avatar-placeholder" style="width:72px;height:72px;'),
    'Avatar placeholder in levelBadgeHtml must be 72px'
  );

  // 3. index.html updateTopAvatar 내 아바타 렌더 사이즈 (52)
  assert(
    indexHtml.includes('av.innerHTML = window.OurgoalAvatar.renderAvatarHtml(pLvl.level, p, { size: 52, compact: true });'),
    'updateTopAvatar must render avatar with size 52'
  );

  // 4. index.html 내 og-task-32 마운트 확인
  assert(indexHtml.includes('id="og-task-32-container"'), 'Must contain #og-task-32-container');
  assert(indexHtml.includes('id="og-task-32-action-btn"'), 'Must contain #og-task-32-action-btn');
  assert(indexHtml.includes('handle아바타_Item32Action(event)'), 'Action button must call handle아바타_Item32Action(event)');

  // 5. js/avatar-system.js 내 핸들러 및 원자적 영속화 검증
  assert(avatarJs.includes('function handle아바타_Item32Action(event)'), 'Must declare handle아바타_Item32Action');
  assert(avatarJs.includes('og_task-32_cache'), 'Must persist to og_task-32_cache');
  assert(avatarJs.includes('vibrate(12)'), 'Must trigger 12ms haptic feedback');
  assert(avatarJs.includes('window.handle아바타_Item32Action = handle아바타_Item32Action;'), 'Must export handle아바타_Item32Action to window');

  // 6. ui.css 내 스타일 및 375px 모바일 미디어 쿼리 검증
  assert(uiCss.includes('#og-task-32-container'), 'ui.css must contain #og-task-32-container rules');
  assert(uiCss.includes('#og-task-32-action-btn'), 'ui.css must contain #og-task-32-action-btn rules');
  assert(uiCss.includes('min-height: 44px;'), 'Action button must have 44px min-height');

  // 7. 가상 DOM 환경에서 handle아바타_Item32Action 동작 검증
  const mockStorage = {};
  global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); }
  };
  global.navigator = { vibrate: () => true };
  global.window = global;

  // DOM Mock
  const btn = { textContent: 'Initial', disabled: false };
  global.document = {
    getElementById: (id) => {
      if (id === 'og-task-32-action-btn') return btn;
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
  vm.runInContext(avatarJs, context);

  assert(typeof context.window.handle아바타_Item32Action === 'function', 'handle아바타_Item32Action must be a function in context');

  // Action 호출
  await context.window.handle아바타_Item32Action({ stopPropagation: () => {} });

  // 영속화 검증
  const cached = JSON.parse(mockStorage['og_task-32_cache']);
  assert.strictEqual(cached.home_badge_size, 72);
  assert.strictEqual(cached.topbar_size, 52);
  assert.strictEqual(cached.state, 'completed');
}

runTests().catch((err) => {
  console.error(err);
  throw err;
});
