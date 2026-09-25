/**
 * tests/tab-guides-showcase.test.js
 * #TASK-ES-273: 각 탭 활용법 내용 최신화 및 실제 우수 사용사례 이미지 첨부 검증
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const tabGuidesPath = path.join(__dirname, '..', 'js', 'tab-guides.js');
const cssPath = path.join(__dirname, '..', 'ui.css');

const guideCode = fs.readFileSync(tabGuidesPath, 'utf8');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// 1. 코드 정적 단언
assert.ok(guideCode.includes('tab-guide-showcase-card'), 'tab-guide-showcase-card must exist in js/tab-guides.js');
assert.ok(guideCode.includes('TAB_SHOWCASES'), 'TAB_SHOWCASES must exist in js/tab-guides.js');
assert.ok(guideCode.includes('renderBestPracticeShowcaseHtml'), 'renderBestPracticeShowcaseHtml must exist in js/tab-guides.js');

// 2. 용어 헌법 제17조: '잔디' 단어 0건 검증
assert.ok(!guideCode.includes('잔디'), 'tab-guides.js must not contain 잔디');
assert.ok(guideCode.includes('히트맵'), 'tab-guides.js must use 히트맵');

// 3. CSS 스타일 정적 단언
assert.ok(cssCode.includes('.tab-guide-showcase-card'), '.tab-guide-showcase-card must be defined in ui.css');
assert.ok(cssCode.includes('.showcase-mini-preview'), '.showcase-mini-preview must be defined in ui.css');
assert.ok(cssCode.includes('.showcase-persona-row'), '.showcase-persona-row must be defined in ui.css');

// 4. CommonJS 런타임 검증
const api = require(tabGuidesPath);
assert.ok(api, 'tab-guides.js must export API');
assert.strictEqual(typeof api.showTabUsageGuide, 'function', 'showTabUsageGuide must be a function');
assert.strictEqual(typeof api.renderTabContentHtml, 'function', 'renderTabContentHtml must be a function');
assert.strictEqual(typeof api.renderBestPracticeShowcaseHtml, 'function', 'renderBestPracticeShowcaseHtml must be a function');

// 5. 6대 탭(홈, 목표, 일정, 기록, 소통, 설정) 우수사례 쇼케이스 검증
const tabs = ['home', 'goals', 'calendar', 'records', 'comm', 'settings'];
tabs.forEach(tabKey => {
  const showcase = api.TAB_SHOWCASES[tabKey];
  assert.ok(showcase, 'Showcase for ' + tabKey + ' must exist');
  assert.ok(showcase.persona && showcase.persona.name, 'Persona name must exist for ' + tabKey);
  assert.ok(showcase.tagline, 'Tagline must exist for ' + tabKey);
  assert.ok(showcase.previewHtml, 'previewHtml must exist for ' + tabKey);
  assert.ok(showcase.story, 'story must exist for ' + tabKey);
  assert.ok(Array.isArray(showcase.tips) && showcase.tips.length > 0, 'tips must exist for ' + tabKey);

  // 렌더링 검증
  const renderedContent = api.renderTabContentHtml(tabKey);
  assert.ok(renderedContent.includes('tab-guide-showcase-card'), 'Rendered content must include showcase card for ' + tabKey);
  assert.ok(renderedContent.includes(showcase.persona.name), 'Rendered content must include persona name for ' + tabKey);
});

// 6. 6대 탭 최신 고도화 기능 명세 포함 검증
const homeHtml = api.renderTabContentHtml('home');
assert.ok(homeHtml.includes('3초 체크인'), 'Home guide must include 3초 체크인');
assert.ok(homeHtml.includes('나만의 홈 구성'), 'Home guide must include 나만의 홈 구성');

const goalsHtml = api.renderTabContentHtml('goals');
assert.ok(goalsHtml.includes('루틴'), 'Goals guide must include 루틴');
assert.ok(goalsHtml.includes('구글 캘린더'), 'Goals guide must include 구글 캘린더');

const calHtml = api.renderTabContentHtml('calendar');
assert.ok(calHtml.includes('사진형 일기'), 'Calendar guide must include 사진형 일기');
assert.ok(calHtml.includes('WebCal'), 'Calendar guide must include WebCal');

const recHtml = api.renderTabContentHtml('records');
assert.ok(recHtml.includes('3×2'), 'Records guide must include 3×2');
assert.ok(recHtml.includes('히트맵'), 'Records guide must include 히트맵');

const commHtml = api.renderTabContentHtml('comm');
assert.ok(commHtml.includes('러닝메이트'), 'Comm guide must include 러닝메이트');
assert.ok(commHtml.includes('마니또'), 'Comm guide must include 마니또');

const setHtml = api.renderTabContentHtml('settings');
assert.ok(setHtml.includes('320종'), 'Settings guide must include 320종');
assert.ok(setHtml.includes('30일 탈퇴 유예'), 'Settings guide must include 30일 탈퇴 유예');
