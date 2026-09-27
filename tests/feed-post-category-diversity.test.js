/**
 * tests/feed-post-category-diversity.test.js
 * #TASK-ES-310 [59] 소통 피드 게시하기 카테고리 분류 다양화 및 가로 스크롤 선택 UI 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('[TEST START] feed-post-category-diversity (#TASK-ES-310)');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');
const jsCompPath = path.join(__dirname, '..', 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const jsComp = fs.readFileSync(jsCompPath, 'utf8');

// 1. index.html 카테고리 18종 및 가로 스크롤 UI 검증
const EXPECTED_18_CATS = [
  'study', 'dev', 'workout', 'running', 'diet',
  'career', 'sideproject', 'finance', 'life', 'morning',
  'parenting', 'pet', 'relation', 'reading', 'hobby',
  'mental', 'clean', 'travel'
];

EXPECTED_18_CATS.forEach(function(cat) {
  assert.ok(html.includes("'" + cat + "'") || html.includes('"' + cat + '"'), 'index.html: 카테고리 [' + cat + '] 정의 확인');
});

assert.ok(html.includes('FEED_CATEGORIES_10 = ['), 'index.html: FEED_CATEGORIES_10 선언 확인 (하위 호환)');
assert.ok(html.includes('id="shareCatPicker"'), 'index.html: #shareCatPicker 컨테이너 확인');
assert.ok(html.includes('data-shcat='), 'index.html: data-shcat 속성 확인');
assert.ok(html.includes('overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;white-space:nowrap;'), 'index.html: 모달 가로 스크롤 인라인 스타일 확인');
assert.ok(html.includes('overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch;white-space:nowrap;'), 'index.html: 메인 피드 가로 스크롤 스타일 확인');
console.log('1. index.html 카테고리 18종 및 가로 스크롤 UI 마크업 검증 통과');

// 2. ui.css 가로 스크롤바 숨김 및 375px 모바일 반응형 검증
assert.ok(css.includes('#shareCatPicker'), 'ui.css: #shareCatPicker 스타일 확인');
assert.ok(css.includes('scrollbar-width: none'), 'ui.css: scrollbar-width none 확인');
assert.ok(css.includes('#shareCatPicker::-webkit-scrollbar'), 'ui.css: 웹킷 스크롤바 숨김 확인');
assert.ok(css.includes('max-width: 375px'), 'ui.css: 375px 모바일 반응형 확인');
console.log('2. ui.css 가로 스크롤 스타일 및 375px 반응형 검증 통과');

// 3. js/components.js 직통 액션 핸들러 및 트랜잭션 검증
assert.ok(jsComp.includes('handle소통_Item59Action'), 'components.js: handle소통_Item59Action 정의 확인');
assert.ok(jsComp.includes('og_task-59_cache'), 'components.js: og_task-59_cache 로컬스토리지 저장 확인');
assert.ok(jsComp.includes('category_diversity'), 'components.js: category_diversity 필드 확인');

const componentsModule = require(jsCompPath);
assert.ok(typeof componentsModule.handle소통_Item59Action === 'function', 'components.js: handle소통_Item59Action export 확인');
console.log('3. components.js 직통 액션 핸들러 및 export 검증 통과');

// 4. handle소통_Item59Action 단위 실행 및 4대 뷰 전파 검증
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
        category: 'parenting',
        caption: '아이와 함께 책 읽기 목표 달성!'
      }
    },
    localStorage: {
      setItem: function(key, val) { mockStorage[key] = val; },
      getItem: function(key) { return mockStorage[key]; }
    },
    renderCalendar: function() { mockViews.calendar = true; },
    renderGoalsScreen: function() { mockViews.goals = true; },
    renderHome: function() { mockViews.home = true; },
    renderRecordsScreen: function() { mockViews.records = true; },
    toast: function(msg) { assert.ok(msg.includes('카테고리'), '토스트 메시지 검증'); }
  };

  global.window = winMock;
  global.state = winMock.state;
  global.localStorage = winMock.localStorage;
  global.renderCalendar = winMock.renderCalendar;
  global.renderGoalsScreen = winMock.renderGoalsScreen;
  global.renderHome = winMock.renderHome;
  global.renderRecordsScreen = winMock.renderRecordsScreen;
  global.toast = winMock.toast;

  const result = await componentsModule.handle소통_Item59Action(null, null);
  assert.strictEqual(result.ticket, '59', '티켓 59 반환 확인');
  assert.strictEqual(result.state, 'completed', '상태 completed 확인');
  assert.strictEqual(result.category_count, 18, '카테고리 18종 집계 확인');
  assert.strictEqual(result.category_diversity.category, 'parenting', '카테고리 바인딩 확인');

  assert.ok(mockStorage['og_task-59_cache'], '로컬스토리지 og_task-59_cache 기록 확인');
  assert.strictEqual(mockViews.calendar, true, '헌법 제15조 제6항 4대 뷰: calendar 전파 확인');
  assert.strictEqual(mockViews.goals, true, '헌법 제15조 제6항 4대 뷰: goals 전파 확인');
  assert.strictEqual(mockViews.home, true, '헌법 제15조 제6항 4대 뷰: home 전파 확인');
  assert.strictEqual(mockViews.records, true, '헌법 제15조 제6항 4대 뷰: records 전파 확인');
  console.log('4. handle소통_Item59Action 단위 실행 및 4대 뷰 전파 검증 통과');
}

testActionHandler().then(function() {
  console.log('[TEST COMPLETED] feed-post-category-diversity test completed successfully.');
}).catch(function(err) {
  console.error('[TEST ERROR]', err);
  throw err;
});
