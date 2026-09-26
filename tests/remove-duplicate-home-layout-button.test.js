'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_SUITE_NAME = 'remove-duplicate-home-layout-button';
const TASK_TICKET_ID = 'TASK-ES-282';
const NOTION_MEMO_ID = '31';

// 1. Mock 환경 구성
let vibrateCalled = false;
let vibrateDuration = 0;
let toastMessage = '';
let calendarRendered = false;
let goalsRendered = false;
let homeRendered = false;
let recordsRendered = false;
let customizerOpened = false;
const mockLocalStorage = {};

global.window = {
  navigator: {
    vibrate: (ms) => {
      vibrateCalled = true;
      vibrateDuration = ms;
      return true;
    }
  },
  showToast: (msg) => {
    toastMessage = msg;
  },
  openHomeCustomizer: () => {
    customizerOpened = true;
  },
  renderCalendar: () => {
    calendarRendered = true;
  },
  renderGoalsScreen: () => {
    goalsRendered = true;
  },
  renderHome: () => {
    homeRendered = true;
  },
  renderRecordsScreen: () => {
    recordsRendered = true;
  }
};

global.localStorage = {
  setItem: (k, v) => {
    mockLocalStorage[k] = v;
  },
  getItem: (k) => {
    return mockLocalStorage[k] || null;
  }
};

global.document = {
  getElementById: (id) => {
    if (id === 'og-task-31-container') return { style: {} };
    if (id === 'og-task-31-action-btn') return { disabled: false };
    if (id === 'btnCustomHomeLayout') return { disabled: false };
    return null;
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {}
};

// 2. OurgoalCustomize 모듈 로드 및 handle홈_Item31Action 검증
const OurgoalCustomize = require('../js/customize.js');
assert.ok(OurgoalCustomize, 'OurgoalCustomize must be defined');
assert.strictEqual(typeof OurgoalCustomize.handle홈_Item31Action, 'function', 'handle홈_Item31Action must be exported');

// 3. handle홈_Item31Action 동작 검증
async function testActionHandler() {
  const handler = OurgoalCustomize.handle홈_Item31Action;
  assert.strictEqual(typeof handler, 'function', 'handle홈_Item31Action must be a function');

  const result = await handler();
  assert.strictEqual(result.ticket, '31', 'Result payload ticket must be 31');
  assert.strictEqual(result.state, 'completed', 'Result payload state must be completed');
  assert.strictEqual(result.action, 'unify_home_layout_button', 'action must be unify_home_layout_button');

  // 홈 커스텀 모달 오픈 검증
  assert.ok(customizerOpened, 'openHomeCustomizer must be called');

  // 햅틱 진동 검증 (12ms)
  assert.ok(vibrateCalled, 'vibrate must be called');
  assert.strictEqual(vibrateDuration, 12, 'vibrate duration must be 12ms');

  // 로컬 캐시 적재 검증
  assert.ok(mockLocalStorage['og_task-31_cache'], 'LocalStorage cache must exist');
  const cachedData = JSON.parse(mockLocalStorage['og_task-31_cache']);
  assert.strictEqual(cachedData.ticket, '31', 'Cached ticket must be 31');
  assert.strictEqual(cachedData.state, 'completed', 'Cached state must be completed');
  assert.strictEqual(cachedData.modal_opened, true, 'modal_opened must be true');

  // 시각 토스트 검증
  assert.ok(toastMessage.includes('나만의 홈 구성'), 'Toast message must indicate home layout unification');

  // 4대 뷰 동시 전파 검증 (헌법 제15조 제6항)
  assert.ok(calendarRendered, 'renderCalendar must be called');
  assert.ok(goalsRendered, 'renderGoalsScreen must be called');
  assert.ok(homeRendered, 'renderHome must be called');
  assert.ok(recordsRendered, 'renderRecordsScreen must be called');
}

// 4. index.html 상단 바 중복 제거 및 본문 배선 정적 무결성 검증
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(!indexHtml.includes('id="topHomeLayoutBtn" style="display:none;font-size:11px;padding:3px 7px'), 'topHomeLayoutBtn must be removed from topbar');
assert.ok(indexHtml.includes('id="btnCustomHomeLayout"'), 'btnCustomHomeLayout must exist in index.html');
assert.ok(indexHtml.includes('handle홈_Item31Action'), 'handle홈_Item31Action must be bound in index.html');
assert.ok(indexHtml.includes('id="og-task-31-container"'), 'og-task-31-container must exist in index.html');
assert.ok(indexHtml.includes('id="og-task-31-action-btn"'), 'og-task-31-action-btn must exist in index.html');

// 5. ui.css 반응형 및 상단 버튼 소거 스타일 검증
const uiCss = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');
assert.ok(uiCss.includes('#topHomeLayoutBtn'), '#topHomeLayoutBtn rule must exist in ui.css');
assert.ok(uiCss.includes('#og-task-31-container'), '#og-task-31-container rule must exist in ui.css');
assert.ok(uiCss.includes('#og-task-31-action-btn'), '#og-task-31-action-btn rule must exist in ui.css');
assert.ok(uiCss.includes('min-width: 44px;'), 'Action button must have min-width 44px for a11y touch');
assert.ok(uiCss.includes('min-height: 44px;'), 'Action button must have min-height 44px for a11y touch');

testActionHandler().catch(err => {
  throw err;
});
