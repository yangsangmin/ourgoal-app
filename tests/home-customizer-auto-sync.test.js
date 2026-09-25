const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const customizePath = path.join(__dirname, '..', 'js', 'customize.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const customizeSrc = fs.readFileSync(customizePath, 'utf8');

// 1. index.html 내 선언적 마크업 [data-home-widget] 전수조사 검증
console.log('Testing: index.html declarative data-home-widget attributes...');
const expectedWidgetIds = [
  'levelBadgeRow',
  'todayGlancePill',
  'todayMissionCard',
  'homeGrassSummaryCard',
  'captureCardBox',
  'customFeedbackBtn',
  'dailyQuestBarWrap',
  'crewPacingWidget',
  'homeChallengeRoomBtn',
  'mzShareBtn'
];

expectedWidgetIds.forEach(id => {
  assert.ok(
    html.includes(`data-home-widget="${id}"`),
    `index.html must declare data-home-widget="${id}"`
  );
});

// crewPacingWidget 선언적 라벨 및 힌트 확인
assert.ok(
  html.includes('data-home-widget="crewPacingWidget"') &&
  html.includes('data-widget-label="실시간 동류 레이스"'),
  'crewPacingWidget must be declared with proper label'
);

// captureCardBox 상단 고정 및 라벨 확인
assert.ok(
  html.includes('data-home-widget="captureCardBox"') &&
  html.includes('data-widget-fixed="true"'),
  'captureCardBox must be declared as fixed'
);

// 2. js/customize.js 내 discoverWidgets 및 getEffectiveWhitelist 엔진 탑재 검증
console.log('Testing: customize.js auto-discovery registry engine...');
assert.ok(customizeSrc.includes('function discoverWidgets'), 'discoverWidgets function must exist');
assert.ok(customizeSrc.includes('function getEffectiveWhitelist'), 'getEffectiveWhitelist function must exist');
assert.ok(customizeSrc.includes('discoverWidgets: discoverWidgets'), 'discoverWidgets must be exported');
assert.ok(customizeSrc.includes('getEffectiveWhitelist: getEffectiveWhitelist'), 'getEffectiveWhitelist must be exported');

// 3. 브라우저/DOM 환경 시뮬레이션: 동적 위젯 자동 탐색(Auto-Discovery) 테스트
console.log('Testing: dynamic auto-discovery simulation with DOM...');
const mockElements = expectedWidgetIds.map(id => {
  return {
    id: id,
    getAttribute: function(attr) {
      if (attr === 'data-home-widget') return id;
      if (attr === 'data-widget-label') return `Label for ${id}`;
      if (attr === 'data-widget-hint') return `Hint for ${id}`;
      if (attr === 'data-widget-fixed') return (id === 'levelBadgeRow' || id === 'captureCardBox') ? 'true' : 'false';
      return null;
    }
  };
});

const mockDocument = {
  querySelectorAll: function(selector) {
    if (selector === '[data-home-widget]') {
      return mockElements;
    }
    return [];
  },
  getElementById: function(id) {
    return {
      id: id,
      style: {},
      hasAttribute: function() { return false; },
      setAttribute: function() {},
      removeAttribute: function() {}
    };
  }
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: { getItem: () => null, setItem: () => {} }
};
sandbox.window.window = sandbox.window;

vm.runInNewContext(customizeSrc, sandbox);
const C = sandbox.window.OurgoalCustomize || sandbox.OurgoalCustomize;
assert.ok(C, 'OurgoalCustomize must be exposed');

// getEffectiveWhitelist가 mockDocument의 위젯들을 탐색하는지 검증
const effList = C.getEffectiveWhitelist();
const effIds = effList.map(item => item.id);

expectedWidgetIds.forEach(id => {
  assert.ok(effIds.includes(id), `Effective whitelist must include ${id}`);
});

// 4. 향후 신규 위젯 동적 추가 시 자동 연동(Auto-Sync) 시뮬레이션 검증
console.log('Testing: future widget dynamic auto-sync...');
const newWidget = {
  id: 'newAiGoalRecommendWidget',
  getAttribute: function(attr) {
    if (attr === 'data-home-widget') return 'newAiGoalRecommendWidget';
    if (attr === 'data-widget-label') return 'AI 목표 추천 카드';
    if (attr === 'data-widget-hint') return '새로운 맞춤형 목표 카드';
    if (attr === 'data-widget-fixed') return 'false';
    return null;
  }
};

mockElements.push(newWidget);

const updatedEffList = C.getEffectiveWhitelist();
const updatedIds = updatedEffList.map(item => item.id);
assert.ok(
  updatedIds.includes('newAiGoalRecommendWidget'),
  'Newly declared DOM widget must be automatically discovered and integrated into home customizer'
);

// 5. 상단 고정 필수 요소 잠금 및 normalize 무결성 검증
console.log('Testing: fixed widgets protection in normalize...');
const normalized = C.normalize({
  hidden: ['levelBadgeRow', 'captureCardBox', 'crewPacingWidget', 'ghostId']
});

assert.ok(!normalized.includes('levelBadgeRow'), 'levelBadgeRow must never be hidden');
assert.ok(!normalized.includes('captureCardBox'), 'captureCardBox must never be hidden');
assert.ok(!normalized.includes('ghostId'), 'ghostId must be filtered out');
assert.ok(normalized.includes('crewPacingWidget'), 'crewPacingWidget can be hidden by user preference');

console.log('All home customizer auto-sync tests passed successfully.');
