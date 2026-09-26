'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_SUITE_NAME = 'component-modularization';
const TASK_TICKET_ID = 'TASK-ES-275';
const NOTION_MEMO_ID = '23';

// 1. Mock 환경 먼저 구성
let vibrateCalled = false;
let vibrateDuration = 0;
let toastMessage = '';
let calendarRendered = false;
let goalsRendered = false;
let homeRendered = false;
let recordsRendered = false;
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
    if (id === 'og-task-23-container') return { style: {} };
    if (id === 'og-task-23-action-btn') return { disabled: false };
    return null;
  },
  addEventListener: () => {}
};

// 2. OurgoalComponents 모듈 로드 및 task23ModularComponent 메서드 검증
const OurgoalComponents = require('../js/components.js');
assert.strictEqual(typeof OurgoalComponents.task23ModularComponent, 'function', 'task23ModularComponent must be a function');

const htmlOutput = OurgoalComponents.task23ModularComponent();
assert.ok(htmlOutput.includes('id="og-task-23-container"'), 'Container ID must be present in HTML');
assert.ok(htmlOutput.includes('id="og-task-23-action-btn"'), 'Action button ID must be present in HTML');
assert.ok(htmlOutput.includes('handle전체공통_Item23Action'), 'Handler must be bound in onclick');

// 3. handle전체공통_Item23Action 동작 검증
async function testActionHandler() {
  const handler = OurgoalComponents.handle전체공통_Item23Action;
  assert.strictEqual(typeof handler, 'function', 'handle전체공통_Item23Action must be exported');

  const result = await handler();
  assert.strictEqual(result.ticket, '23', 'Result payload ticket must be 23');
  assert.strictEqual(result.state, 'completed', 'Result payload state must be completed');

  // 햅틱 진동 검증 (12ms)
  assert.ok(vibrateCalled, 'vibrate must be called');
  assert.strictEqual(vibrateDuration, 12, 'vibrate duration must be 12ms');

  // 로컬 캐시 적재 검증
  assert.ok(mockLocalStorage['og_task-23_cache'], 'LocalStorage cache must exist');
  const cachedData = JSON.parse(mockLocalStorage['og_task-23_cache']);
  assert.strictEqual(cachedData.ticket, '23', 'Cached ticket must be 23');
  assert.strictEqual(cachedData.state, 'completed', 'Cached state must be completed');

  // 시각 토스트 검증
  assert.ok(toastMessage.includes('컴포넌트 모듈화'), 'Toast message must indicate component modularization');

  // 4대 뷰 동시 전파 검증 (헌법 제15조 제6항)
  assert.ok(calendarRendered, 'renderCalendar must be called');
  assert.ok(goalsRendered, 'renderGoalsScreen must be called');
  assert.ok(homeRendered, 'renderHome must be called');
  assert.ok(recordsRendered, 'renderRecordsScreen must be called');
}

// 4. index.html 정적 마크업 검증
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(indexHtml.includes('id="og-task-23-container"'), 'index.html must contain #og-task-23-container');
assert.ok(indexHtml.includes('id="og-task-23-action-btn"'), 'index.html must contain #og-task-23-action-btn');
assert.ok(indexHtml.includes('handle전체공통_Item23Action'), 'index.html must call handle전체공통_Item23Action');

// 5. ui.css 정적 스타일 검증
const uiCss = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');
assert.ok(uiCss.includes('#og-task-23-container'), 'ui.css must define #og-task-23-container');
assert.ok(uiCss.includes('#og-task-23-action-btn'), 'ui.css must define #og-task-23-action-btn');
assert.ok(uiCss.includes('min-width: 44px;'), 'Action button must have min-width 44px for a11y touch');
assert.ok(uiCss.includes('min-height: 44px;'), 'Action button must have min-height 44px for a11y touch');

testActionHandler().catch(err => {
  throw err;
});
