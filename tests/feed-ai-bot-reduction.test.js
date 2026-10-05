/**
 * tests/feed-ai-bot-reduction.test.js
 * #TASK-ES-312 [61] 피드 내 AI 봇 활동내역 최하단 1개 축소 및 실 유저 20명 초과 시 전면 제거 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)
const assert = require('assert');

console.log('[TEST START] feed-ai-bot-reduction (#TASK-ES-312)');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const jsCompPath = path.join(rootDir, 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const jsComp = readComponentsBundle();

// 1. index.html 피드 및 사진인증 내 AI 봇 1개 축소 및 20명 초과 시 전면 제거 로직 검증
assert.ok(html.includes('!virtualCheerEnabled || realCount > 20'), 'index.html: 실 유저 20명 초과 시 AI 전면 제거 분기 확인');
assert.ok(html.includes('singleAiGuide'), 'index.html: AI 가이드 1개(singleAiGuide) 축소 확인');
assert.ok(html.includes('singleAiPhoto'), 'index.html: 사진인증 AI 가이드 1개(singleAiPhoto) 축소 확인');
assert.ok(html.includes('realPhotoItems.concat(singleAiPhoto)'), 'index.html: 사진인증 AI 가이드 최하단 결합 확인');
assert.ok(html.includes('curRealCount > 20'), 'index.html: 실 유저 20명 초과 시 AI 댓글 전면 제거 분기 확인');
console.log('1. index.html 피드 및 사진인증 AI 봇 제어 로직 검증 통과');

// 2. js/components.js 직통 핸들러 및 블렌딩 함수 검증
assert.ok(jsComp.includes('handle소통_Item61Action'), 'components.js: handle소통_Item61Action 함수 정의 확인');
assert.ok(jsComp.includes('blendFeedWithAiBotRule'), 'components.js: blendFeedWithAiBotRule 함수 정의 확인');
assert.ok(jsComp.includes('og_task-61_cache'), 'components.js: og_task-61_cache 로컬 캐시 키 확인');
assert.ok(jsComp.includes('ai_bot_reduced_to_one: true'), 'components.js: ai_bot_reduced_to_one 플래그 확인');
assert.ok(jsComp.includes('remove_ai_when_users_over_20: true'), 'components.js: remove_ai_when_users_over_20 플래그 확인');

const componentsModule = require(jsCompPath);
assert.ok(typeof componentsModule.handle소통_Item61Action === 'function', 'components.js: handle소통_Item61Action export 확인');
assert.ok(typeof componentsModule.blendFeedWithAiBotRule === 'function', 'components.js: blendFeedWithAiBotRule export 확인');
console.log('2. components.js 직통 액션 핸들러 및 blendFeedWithAiBotRule export 검증 통과');

// 3. blendFeedWithAiBotRule 알고리즘 4대 시나리오 정밀 검증
const mockAiPersonas = [
  { id: 'sim_p01', name: '김도윤', is_ai: true },
  { id: 'sim_p02', name: '박준서', is_ai: true },
  { id: 'sim_p03', name: '이현우', is_ai: true }
];

// 시나리오 A: 실 유저 글 0개 -> AI 봇 가이드 1개만 반환
const resultA = componentsModule.blendFeedWithAiBotRule([], mockAiPersonas, true);
assert.strictEqual(resultA.length, 1, '시나리오 A: 실 유저 0명일 때 AI 봇 1개 노출');
assert.strictEqual(resultA[0].id, 'sim_p01', '시나리오 A: 첫 번째 AI 가이드 노출');
assert.strictEqual(resultA[0].is_ai, true, '시나리오 A: AI 봇 확인');

// 시나리오 B: 실 유저 글 5개 (<= 20) -> 실 유저 글 5개 상단 + AI 봇 1개 최하단 (총 6개)
const mockRealPosts5 = [
  { id: 'real_1', name: '유저1', is_ai: false },
  { id: 'real_2', name: '유저2', is_ai: false },
  { id: 'real_3', name: '유저3', is_ai: false },
  { id: 'real_4', name: '유저4', is_ai: false },
  { id: 'real_5', name: '유저5', is_ai: false }
];
const resultB = componentsModule.blendFeedWithAiBotRule(mockRealPosts5, mockAiPersonas, true);
assert.strictEqual(resultB.length, 6, '시나리오 B: 실 유저 5개 + AI 봇 1개 = 총 6개');
assert.strictEqual(resultB[0].id, 'real_1', '시나리오 B: 첫 번째 항목은 실 유저 글');
assert.strictEqual(resultB[4].id, 'real_5', '시나리오 B: 5번째 항목까지 실 유저 글');
assert.strictEqual(resultB[5].id, 'sim_p01', '시나리오 B: 최하단(6번째) 항목만 AI 봇');
assert.strictEqual(resultB[5].is_ai, true, '시나리오 B: 최하단 항목 AI 봇 확인');
const aiCountB = resultB.filter(it => it.is_ai).length;
assert.strictEqual(aiCountB, 1, '시나리오 B: 전체 피드 내 AI 봇은 정확히 1개');

// 시나리오 C: 실 유저 글 25개 (> 20) -> AI 봇 0개(전면 제거), 실 유저 글만 25개 반환
const mockRealPosts25 = [];
for (let i = 1; i <= 25; i++) {
  mockRealPosts25.push({ id: 'real_' + i, name: '유저' + i, is_ai: false });
}
const resultC = componentsModule.blendFeedWithAiBotRule(mockRealPosts25, mockAiPersonas, true);
assert.strictEqual(resultC.length, 25, '시나리오 C: 실 유저 25명 초과 시 실 유저 글만 25개');
assert.ok(!resultC.some(it => it.is_ai), '시나리오 C: AI 봇 0건(전면 제거) 확인');

// 시나리오 D: virtualCheerEnabled === false -> 실 유저 글만 반환
const resultD = componentsModule.blendFeedWithAiBotRule(mockRealPosts5, mockAiPersonas, false);
assert.strictEqual(resultD.length, 5, '시나리오 D: virtualCheerEnabled false 시 AI 봇 0건');
assert.ok(!resultD.some(it => it.is_ai), '시나리오 D: AI 봇 미포함 확인');
console.log('3. blendFeedWithAiBotRule 알고리즘 4대 시나리오 정밀 검증 통과');

// 4. handle소통_Item61Action 단위 실행 및 4대 뷰 원자적 전파 모의 검증
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
    const res = await componentsModule.handle소통_Item61Action(null);
    assert.ok(res, '결과 payload 반환 확인');
    assert.strictEqual(res.ticket, '61', 'payload ticket 61 일치');
    assert.strictEqual(res.ai_bot_reduced_to_one, true, 'payload ai_bot_reduced_to_one 확인');
    assert.strictEqual(res.remove_ai_when_users_over_20, true, 'payload remove_ai_when_users_over_20 확인');
    assert.strictEqual(res.max_ai_bot_count, 1, 'payload max_ai_bot_count 1 확인');
    assert.strictEqual(res.placement, 'bottom_only', 'payload placement bottom_only 확인');
    assert.strictEqual(res.state, 'completed', 'payload state completed 확인');

    assert.ok(mockStorage['og_task-61_cache'], 'localStorage에 og_task-61_cache 영속화 확인');
    const cached = JSON.parse(mockStorage['og_task-61_cache']);
    assert.strictEqual(cached.ticket, '61');
    assert.strictEqual(cached.ai_bot_reduced_to_one, true);

    assert.strictEqual(mockViews.calendar, true, 'renderCalendar 뷰 전파 확인');
    assert.strictEqual(mockViews.goals, true, 'renderGoalsScreen 뷰 전파 확인');
    assert.strictEqual(mockViews.home, true, 'renderHome 뷰 전파 확인');
    assert.strictEqual(mockViews.records, true, 'renderRecordsScreen 뷰 전파 확인');
    console.log('4. handle소통_Item61Action 단위 실행 및 4대 뷰 원자적 전파 검증 통과');
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
    console.log('[TEST COMPLETE] feed-ai-bot-reduction (#TASK-ES-312) - SUCCESS');
  })
  .catch((err) => {
    console.error('[TEST ERROR]', err);
    throw err;
  });
