'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_SUITE_NAME = 'comm-post-feed-button-fix';
const TASK_TICKET_ID = 'TASK-ES-281';
const NOTION_MEMO_ID = '30';

// 1. Mock 환경 구성
let vibrateCalled = false;
let vibrateDuration = 0;
let toastMessage = '';
let calendarRendered = false;
let goalsRendered = false;
let homeRendered = false;
let recordsRendered = false;
let feedModalOpened = false;
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
  openShareToFeedModal: () => {
    feedModalOpened = true;
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
    if (id === 'og-task-30-container') return { style: {} };
    if (id === 'og-task-30-action-btn') return { disabled: false };
    if (id === 'btnCommPostFeed') return { disabled: false };
    if (id === 'modalShareToFeed') return { style: {}, classList: { add: () => {} } };
    return null;
  },
  querySelector: () => null,
  addEventListener: () => {}
};

// 2. OurgoalTeamInviteComm 모듈 로드 및 handle소통_Item30Action 검증
const OurgoalTeamInviteComm = require('../js/team-invite-comm.js');
assert.ok(OurgoalTeamInviteComm, 'OurgoalTeamInviteComm must be defined');
assert.strictEqual(typeof OurgoalTeamInviteComm.handle소통_Item30Action, 'function', 'handle소통_Item30Action must be exported');

// 3. handle소통_Item30Action 동작 검증
async function testActionHandler() {
  const handler = OurgoalTeamInviteComm.handle소통_Item30Action;
  assert.strictEqual(typeof handler, 'function', 'handle소통_Item30Action must be a function');

  const result = await handler();
  assert.strictEqual(result.ticket, '30', 'Result payload ticket must be 30');
  assert.strictEqual(result.state, 'completed', 'Result payload state must be completed');
  assert.strictEqual(result.action, 'comm_post_feed', 'action must be comm_post_feed');

  // 모달 오픈 함수 호출 검증
  assert.ok(feedModalOpened, 'openShareToFeedModal must be called');

  // 햅틱 진동 검증 (12ms)
  assert.ok(vibrateCalled, 'vibrate must be called');
  assert.strictEqual(vibrateDuration, 12, 'vibrate duration must be 12ms');

  // 로컬 캐시 적재 검증
  assert.ok(mockLocalStorage['og_task-30_cache'], 'LocalStorage cache must exist');
  const cachedData = JSON.parse(mockLocalStorage['og_task-30_cache']);
  assert.strictEqual(cachedData.ticket, '30', 'Cached ticket must be 30');
  assert.strictEqual(cachedData.state, 'completed', 'Cached state must be completed');
  assert.strictEqual(cachedData.modal_opened, true, 'modal_opened must be true');

  // 시각 토스트 검증
  assert.ok(toastMessage.includes('소통 피드 게시하기 모달'), 'Toast message must indicate comm post feed modal');

  // 4대 뷰 동시 전파 검증 (헌법 제15조 제6항)
  assert.ok(calendarRendered, 'renderCalendar must be called');
  assert.ok(goalsRendered, 'renderGoalsScreen must be called');
  assert.ok(homeRendered, 'renderHome must be called');
  assert.ok(recordsRendered, 'renderRecordsScreen must be called');
}

// 4. index.html 배선 정적 무결성 검증
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(indexHtml.includes('id="btnCommPostFeed"'), 'btnCommPostFeed must exist in index.html');
assert.ok(indexHtml.includes('handle소통_Item30Action'), 'handle소통_Item30Action must be bound in index.html');
assert.ok(indexHtml.includes('id="og-task-30-container"'), 'og-task-30-container must exist in index.html');
assert.ok(indexHtml.includes('id="og-task-30-action-btn"'), 'og-task-30-action-btn must exist in index.html');

// 5. ui.css 반응형 및 모바일 터치 규격(44px) 검증
const uiCss = fs.readFileSync(path.join(__dirname, '../ui.css'), 'utf8');
assert.ok(uiCss.includes('#og-task-30-container'), '#og-task-30-container rule must exist in ui.css');
assert.ok(uiCss.includes('#og-task-30-action-btn'), '#og-task-30-action-btn rule must exist in ui.css');
assert.ok(uiCss.includes('min-width: 44px;'), 'Action button must have min-width 44px for a11y touch');
assert.ok(uiCss.includes('min-height: 44px;'), 'Action button must have min-height 44px for a11y touch');

testActionHandler().catch(err => {
  throw err;
});
