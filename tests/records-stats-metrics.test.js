'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_SUITE_NAME = 'records-stats-metrics';
const TASK_TICKET_ID = 'TASK-ES-276';
const NOTION_MEMO_ID = '24';

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
    if (id === 'og-task-24-container') return { style: {} };
    if (id === 'og-task-24-action-btn') return { disabled: false };
    return null;
  },
  addEventListener: () => {}
};

// 2. OurgoalRecordsStats 모듈 로드 및 handle기록스톱워치_Item24Action 검증
const OurgoalRecordsStats = require('../js/records-stats.js');
assert.ok(OurgoalRecordsStats, 'OurgoalRecordsStats must be defined');
assert.strictEqual(typeof OurgoalRecordsStats.handle기록스톱워치_Item24Action, 'function', 'handle기록스톱워치_Item24Action must be exported');

// 3. handle기록스톱워치_Item24Action 동작 검증
async function testActionHandler() {
  const handler = OurgoalRecordsStats.handle기록스톱워치_Item24Action;
  assert.strictEqual(typeof handler, 'function', 'handle기록스톱워치_Item24Action must be a function');

  const result = await handler();
  assert.strictEqual(result.ticket, '24', 'Result payload ticket must be 24');
  assert.strictEqual(result.state, 'completed', 'Result payload state must be completed');

  // 햅틱 진동 검증 (12ms)
  assert.ok(vibrateCalled, 'vibrate must be called');
  assert.strictEqual(vibrateDuration, 12, 'vibrate duration must be 12ms');

  // 로컬 캐시 적재 검증
  assert.ok(mockLocalStorage['og_task-24_cache'], 'LocalStorage cache must exist');
  const cachedData = JSON.parse(mockLocalStorage['og_task-24_cache']);
  assert.strictEqual(cachedData.ticket, '24', 'Cached ticket must be 24');
  assert.strictEqual(cachedData.state, 'completed', 'Cached state must be completed');

  // 시각 토스트 검증
  assert.ok(toastMessage.includes('측정지표 분석'), 'Toast message must indicate metrics analysis');

  // 4대 뷰 동시 전파 검증 (헌법 제15조 제6항)
  assert.ok(calendarRendered, 'renderCalendar must be called');
  assert.ok(goalsRendered, 'renderGoalsScreen must be called');
  assert.ok(homeRendered, 'renderHome must be called');
  assert.ok(recordsRendered, 'renderRecordsScreen must be called');
}

// 4. index.html 정적 마크업 검증
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(indexHtml.includes('id="og-task-24-container"'), 'index.html must contain #og-task-24-container');
assert.ok(indexHtml.includes('id="og-task-24-action-btn"'), 'index.html must contain #og-task-24-action-btn');
assert.ok(indexHtml.includes('handle기록스톱워치_Item24Action'), 'index.html must call handle기록스톱워치_Item24Action');

// 5. ui.css 정적 스타일 검증
const uiCss = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');
assert.ok(uiCss.includes('#og-task-24-container'), 'ui.css must define #og-task-24-container');
assert.ok(uiCss.includes('#og-task-24-action-btn'), 'ui.css must define #og-task-24-action-btn');
assert.ok(uiCss.includes('min-width: 44px;'), 'Action button must have min-width 44px for a11y touch');
assert.ok(uiCss.includes('min-height: 44px;'), 'Action button must have min-height 44px for a11y touch');

testActionHandler().catch(err => {
  throw err;
});
