'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'achievement-metric-multiselect';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-43-container"'), 'index.html must contain #og-task-43-container');
  assert(indexHtml.includes('id="og-task-43-action-btn"'), 'index.html must contain #og-task-43-action-btn');
  assert(indexHtml.includes('handle성취통계_Item43Action(event)'), 'index.html must bind handle성취통계_Item43Action(event)');
  assert(indexHtml.includes('data-ticket="43"'), 'index.html must have data-ticket="43"');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle성취통계_Item43Action'), 'components.js must define handle성취통계_Item43Action');
  assert(componentsJs.includes('window.handle성취통계_Item43Action = handle성취통계_Item43Action'), 'components.js must expose handle성취통계_Item43Action to window');
  assert(componentsJs.includes('module.exports.handle성취통계_Item43Action = handle성취통계_Item43Action'), 'components.js must export handle성취통계_Item43Action');
  assert(componentsJs.includes('og_task-43_cache'), 'components.js must maintain og_task-43_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  // 3. 다중선택 필터 헬퍼 함수 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert.strictEqual(typeof components.toggleAchievementMetricFilter, 'function', 'toggleAchievementMetricFilter must be a function');
  
  // 토글 추가 테스트
  const toggledAdd = components.toggleAchievementMetricFilter('focus_time', ['rate']);
  assert.deepStrictEqual(toggledAdd, ['rate', 'focus_time'], 'should add focus_time to filter');

  // 토글 제거 테스트
  const toggledRemove = components.toggleAchievementMetricFilter('rate', ['rate', 'focus_time']);
  assert.deepStrictEqual(toggledRemove, ['focus_time'], 'should remove rate from filter');

  // 최소 1개 유지 테스트
  const toggledKeep = components.toggleAchievementMetricFilter('focus_time', ['focus_time']);
  assert.deepStrictEqual(toggledKeep, ['focus_time'], 'should keep at least 1 metric');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-43-container'), 'ui.css must contain #og-task-43-container rules');
  assert(uiCss.includes('#og-task-43-action-btn'), 'ui.css must contain #og-task-43-action-btn rules');
  assert(uiCss.includes('.metric-multiselect-chip'), 'ui.css must contain .metric-multiselect-chip rules');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
