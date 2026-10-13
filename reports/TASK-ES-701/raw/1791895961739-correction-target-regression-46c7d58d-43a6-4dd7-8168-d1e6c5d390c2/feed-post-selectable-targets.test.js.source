/**
 * tests/feed-post-selectable-targets.test.js
 * #TASK-ES-308 [57] 소통탭 게시 시 공유 대상(목표·기록·AI피드백) 선택형 UI 구현 및 다짐 작성 유지 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)
const assert = require('assert');

console.log('[TEST START] feed-post-selectable-targets (#TASK-ES-308)');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');
const jsCompPath = path.join(__dirname, '..', 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const jsComp = readComponentsBundle();

// 1. index.html 핵심 식별자 및 선택형 칩 UI 검증
assert.ok(html.includes('feed-target-chips-bar'), 'index.html: .feed-target-chips-bar 마크업 확인');
assert.ok(html.includes('feed-target-goal-chips'), 'index.html: .feed-target-goal-chips 목표 칩 컨테이너 확인');
assert.ok(html.includes('feed-target-record-chips'), 'index.html: .feed-target-record-chips 기록 칩 컨테이너 확인');
assert.ok(html.includes('feed-target-feedback-chips'), 'index.html: .feed-target-feedback-chips 피드백 칩 컨테이너 확인');
assert.ok(html.includes('feed-target-chip'), 'index.html: .feed-target-chip 공통 칩 클래스 확인');
assert.ok(html.includes('data-targetgoal'), 'index.html: data-targetgoal 목표 선택 속성 확인');
assert.ok(html.includes('data-targetrec'), 'index.html: data-targetrec 기록 선택 속성 확인');
assert.ok(html.includes('data-targetfb'), 'index.html: data-targetfb 피드백 선택 속성 확인');
assert.ok(html.includes('shareCaptionInput'), 'index.html: #shareCaptionInput 다짐/한마디 입력창 유지 확인');
assert.ok(html.includes('shareGoalSelect'), 'index.html: #shareGoalSelect 셀렉트 연동 확인');
assert.ok(html.includes('shareRecordSelect'), 'index.html: #shareRecordSelect 셀렉트 연동 확인');
assert.ok(html.includes('shareFeedbackSelect'), 'index.html: #shareFeedbackSelect 셀렉트 연동 확인');
console.log('1. index.html 선택형 칩 UI 및 다짐 입력창 보존 검증 통과');

// 2. ui.css 스타일 및 모바일 375px 반응형 검증
assert.ok(css.includes('.feed-target-chips-bar'), 'CSS: .feed-target-chips-bar 스타일 정의 확인');
assert.ok(css.includes('.feed-target-chip'), 'CSS: .feed-target-chip 스타일 정의 확인');
assert.ok(css.includes('.feed-target-chip:hover'), 'CSS: .feed-target-chip:hover 스타일 정의 확인');
assert.ok(css.includes('.feed-target-chip.active'), 'CSS: .feed-target-chip.active 스타일 정의 확인');
assert.ok(css.includes('max-width: 375px'), 'CSS: 375px 모바일 반응형 미디어 쿼리 확인');
console.log('2. ui.css 스타일 및 모바일 반응형 검증 통과');

// 3. js/components.js 직통 액션 핸들러 및 원자적 트랜잭션 검증
assert.ok(jsComp.includes('handle소통_Item57Action'), 'components.js: handle소통_Item57Action 정의 확인');
assert.ok(jsComp.includes('og_task-57_cache'), 'components.js: og_task-57_cache 로컬스토리지 저장 확인');
assert.ok(jsComp.includes('caption_preserved'), 'components.js: caption_preserved 플래그 확인');
assert.ok(jsComp.includes('selectable_chips_enabled'), 'components.js: selectable_chips_enabled 플래그 확인');

const componentsModule = require(jsCompPath);
assert.ok(typeof componentsModule.handle소통_Item57Action === 'function', 'components.js: handle소통_Item57Action export 확인');
console.log('3. components.js 직통 액션 핸들러 및 export 검증 통과');

// 4. handle소통_Item57Action 단위 실행 검증
async function testActionHandler() {
  const mockStorage = {};
  const mockViews = {
    calendar: false,
    goals: false,
    home: false,
    records: false
  };

  const winMock = {
    state: {
      shareDraft: {
        goalId: 'goal_test_01',
        recordId: '0',
        feedbackId: 'fb_test_01',
        caption: '오늘의 멋진 다짐 한마디!'
      }
    },
    localStorage: {
      setItem: function(key, val) { mockStorage[key] = val; },
      getItem: function(key) { return mockStorage[key]; }
    },
    navigator: {
      vibrate: function(ms) { assert.strictEqual(ms, 12, '12ms 햅틱 확인'); }
    },
    renderCalendar: function() { mockViews.calendar = true; },
    renderGoalsScreen: function() { mockViews.goals = true; },
    renderHome: function() { mockViews.home = true; },
    renderRecordsScreen: function() { mockViews.records = true; },
    toast: function(msg) { assert.ok(msg.includes('공유 대상'), '토스트 메시지 검증'); }
  };

  global.window = winMock;
  global.state = winMock.state;
  global.localStorage = winMock.localStorage;
  global.renderCalendar = winMock.renderCalendar;
  global.renderGoalsScreen = winMock.renderGoalsScreen;
  global.renderHome = winMock.renderHome;
  global.renderRecordsScreen = winMock.renderRecordsScreen;
  global.toast = winMock.toast;

  const result = await componentsModule.handle소통_Item57Action(null, null);
  assert.strictEqual(result.ticket, '57', '티켓 57 반환 확인');
  assert.strictEqual(result.state, 'completed', '상태 completed 확인');
  assert.strictEqual(result.caption_preserved, true, '다짐 유지 플래그 확인');
  assert.strictEqual(result.selectable_chips_enabled, true, '선택형 칩 플래그 확인');
  assert.strictEqual(result.target_selection.selected_goal_id, 'goal_test_01', '선택된 목표 ID 확인');
  assert.strictEqual(result.target_selection.caption, '오늘의 멋진 다짐 한마디!', '다짐 문구 유지 확인');

  assert.ok(mockStorage['og_task-57_cache'], '로컬스토리지 og_task-57_cache 기록 확인');
  assert.strictEqual(mockViews.calendar, true, '헌법 제15조 제6항 4대 뷰: calendar 전파 확인');
  assert.strictEqual(mockViews.goals, true, '헌법 제15조 제6항 4대 뷰: goals 전파 확인');
  assert.strictEqual(mockViews.home, true, '헌법 제15조 제6항 4대 뷰: home 전파 확인');
  assert.strictEqual(mockViews.records, true, '헌법 제15조 제6항 4대 뷰: records 전파 확인');
  console.log('4. handle소통_Item57Action 단위 실행 및 4대 뷰 전파 검증 통과');
}

testActionHandler().then(function() {
  console.log('[TEST COMPLETED] feed-post-selectable-targets test completed successfully.');
}).catch(function(err) {
  console.error('[TEST ERROR]', err);
  throw err;
});

