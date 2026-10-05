/**
 * tests/achievement-stats-shell-button-removal.test.js
 * #TASK-ES-311 [60] 성취통계 메뉴 내 미작동 껍데기 버튼(목표연계·캘린더 등록) 영구 삭제 및 Zero Dead Click 완결 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)
const assert = require('assert');

console.log('[TEST START] achievement-stats-shell-button-removal (#TASK-ES-311)');

// #TASK-ES-393 (통계 세포 쪼개기 1차 선행): 통계 코드가 js/universal-stats.js 에서 js/stats-*.js 키트 부품(OurgoalUniversalStatsKit 에 함수를 담는 파일)으로 옮겨 가도
// 같은 단언이 같은 코드를 찾도록 '통계 합본' = js/universal-stats.js(원문 그대로, 맨 앞) + 키트 부품(이름순, 생성기 접두 S.·K. 를 떼고) 를 읽는다. 단언·기대값은 그대로다.
function listStatsParts(rootDir) {
  const dir = path.join(rootDir, 'js');
  return fs.readdirSync(dir).filter((n) => n.indexOf('stats-') === 0 && n.endsWith('.js')).sort()
    .map((n) => path.join(dir, n)).filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalUniversalStatsKit') >= 0);
}
function readStatsBundle(rootDir) {
  const raw = fs.readFileSync(path.join(rootDir, 'js', 'universal-stats.js'), 'utf8');
  const parts = listStatsParts(rootDir);
  const src = [raw, ...parts.map((f) => fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[SK]\.(?=[A-Za-z_$])/g, '$1'))].join('\n');
  // 합본 맨 앞은 원문 그대로다(원본에서 찾던 글자는 같은 자리에서 찾는다). 부품 파일이 없으면 합본 = 원문.
  assert.strictEqual(src.slice(0, raw.length), raw, '통계 합본 맨 앞 = js/universal-stats.js 원문');
  if (parts.length === 0) assert.strictEqual(src, raw, '통계 합본 = js/universal-stats.js (부품 파일이 없을 때)');
  return src;
}
const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const uStatsPath = path.join(rootDir, 'js', 'universal-stats.js');
const jsCompPath = path.join(rootDir, 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const uStats = readStatsBundle(rootDir);
const jsComp = readComponentsBundle();

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
