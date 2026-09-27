/**
 * tests/achievement-stats-shell-button-removal.test.js
 * #TASK-ES-311 [60] 성취통계 메뉴 내 미작동 껍데기 버튼(목표연계·캘린더 등록) 영구 삭제 및 Zero Dead Click 완결 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('[TEST START] achievement-stats-shell-button-removal (#TASK-ES-311)');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const uStatsPath = path.join(rootDir, 'js', 'universal-stats.js');
const jsCompPath = path.join(rootDir, 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const uStats = fs.readFileSync(uStatsPath, 'utf8');
const jsComp = fs.readFileSync(jsCompPath, 'utf8');

// 1. universal-stats.js 및 index.html 미작동 껍데기 버튼 및 라벨 부재(Zero Dead Click) 검증
assert.ok(!uStats.includes('uLinkGoalBtn'), 'universal-stats.js: uLinkGoalBtn 미존재 확인');
assert.ok(!uStats.includes('uRegCalendarBtn'), 'universal-stats.js: uRegCalendarBtn 미존재 확인');
assert.ok(!uStats.includes('🎯 목표 연계'), 'universal-stats.js: 🎯 목표 연계 라벨 미존재 확인');
assert.ok(!uStats.includes('📅 캘린더 등록'), 'universal-stats.js: 📅 캘린더 등록 라벨 미존재 확인');

assert.ok(!html.includes('id="uLinkGoalBtn"'), 'index.html: id="uLinkGoalBtn" 미존재 확인');
assert.ok(!html.includes('id="uRegCalendarBtn"'), 'index.html: id="uRegCalendarBtn" 미존재 확인');
console.log('1. 성취통계 미작동 껍데기 버튼 영구 삭제 및 Zero Dead Click 전수 확인 통과');

// 2. js/components.js 직통 액션 핸들러 및 원자적 동시 전파 검증
assert.ok(jsComp.includes('handle성취통계_Item60Action'), 'components.js: handle성취통계_Item60Action 함수 정의 확인');
assert.ok(jsComp.includes('og_task-60_cache'), 'components.js: og_task-60_cache 로컬 캐시 키 확인');
assert.ok(jsComp.includes('no_dead_click: true'), 'components.js: no_dead_click 플래그 확인');
assert.ok(jsComp.includes('removed_buttons'), 'components.js: removed_buttons 확인');

const componentsModule = require(jsCompPath);
assert.ok(typeof componentsModule.handle성취통계_Item60Action === 'function', 'components.js: handle성취통계_Item60Action export 확인');
console.log('2. components.js 직통 액션 핸들러 및 export 검증 통과');

// 3. handle성취통계_Item60Action 단위 실행 및 4대 뷰 원자적 전파 모의 검증
async function testActionHandler() {
  const mockStorage = {};
  const mockViews = {
    calendar: false,
    goals: false,
    home: false,
    records: false
  };

  const winMock = {
    localStorage: {
      setItem: function(key, val) { mockStorage[key] = val; },
      getItem: function(key) { return mockStorage[key]; }
    },
    navigator: {
      vibrate: function(ms) {}
    },
    renderCalendar: function() { mockViews.calendar = true; },
    renderGoalsScreen: function() { mockViews.goals = true; },
    renderHome: function() { mockViews.home = true; },
    renderRecordsScreen: function() { mockViews.records = true; },
    toast: function(msg) {}
  };

  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;
  const originalRenderCalendar = global.renderCalendar;
  const originalRenderGoals = global.renderGoalsScreen;
  const originalRenderHome = global.renderHome;
  const originalRenderRecords = global.renderRecordsScreen;
  const originalToast = global.toast;

  global.window = winMock;
  global.localStorage = winMock.localStorage;
  global.renderCalendar = winMock.renderCalendar;
  global.renderGoalsScreen = winMock.renderGoalsScreen;
  global.renderHome = winMock.renderHome;
  global.renderRecordsScreen = winMock.renderRecordsScreen;
  global.toast = winMock.toast;

  try {
    const res = await componentsModule.handle성취통계_Item60Action(null);
    assert.ok(res, '결과 payload 반환 확인');
    assert.strictEqual(res.ticket, '60', 'payload ticket 60 일치');
    assert.strictEqual(res.no_dead_click, true, 'payload no_dead_click true 확인');
    assert.deepStrictEqual(res.removed_buttons, ['uLinkGoalBtn', 'uRegCalendarBtn'], 'payload removed_buttons 일치');
    assert.strictEqual(res.stats_clean_state, true, 'payload stats_clean_state true 확인');
    assert.strictEqual(res.state, 'completed', 'payload state completed 확인');

    assert.ok(mockStorage['og_task-60_cache'], 'localStorage에 og_task-60_cache 영속화 확인');
    const cached = JSON.parse(mockStorage['og_task-60_cache']);
    assert.strictEqual(cached.ticket, '60');
    assert.strictEqual(cached.no_dead_click, true);

    assert.strictEqual(mockViews.calendar, true, 'renderCalendar 뷰 전파 확인');
    assert.strictEqual(mockViews.goals, true, 'renderGoalsScreen 뷰 전파 확인');
    assert.strictEqual(mockViews.home, true, 'renderHome 뷰 전파 확인');
    assert.strictEqual(mockViews.records, true, 'renderRecordsScreen 뷰 전파 확인');
    console.log('3. handle성취통계_Item60Action 단위 실행 및 4대 뷰 원자적 전파 검증 통과');
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    global.renderCalendar = originalRenderCalendar;
    global.renderGoalsScreen = originalRenderGoals;
    global.renderHome = originalRenderHome;
    global.renderRecordsScreen = originalRenderRecords;
    global.toast = originalToast;
  }
}

testActionHandler()
  .then(() => {
    console.log('[TEST COMPLETE] achievement-stats-shell-button-removal (#TASK-ES-311) - SUCCESS');
  })
  .catch((err) => {
    console.error('[TEST ERROR]', err);
    throw err;
  });
