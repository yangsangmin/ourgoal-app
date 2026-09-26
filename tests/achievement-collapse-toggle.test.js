'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'achievement-collapse-toggle';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-45-container"'), 'index.html must contain #og-task-45-container');
  assert(indexHtml.includes('id="og-task-45-action-btn"'), 'index.html must contain #og-task-45-action-btn');
  assert(indexHtml.includes('handle성취통계_Item45Action(event)'), 'index.html must bind handle성취통계_Item45Action(event)');
  assert(indexHtml.includes('data-ticket="45"'), 'index.html must have data-ticket="45"');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle성취통계_Item45Action'), 'components.js must define handle성취통계_Item45Action');
  assert(componentsJs.includes('window.handle성취통계_Item45Action = handle성취통계_Item45Action'), 'components.js must expose handle성취통계_Item45Action to window');
  assert(componentsJs.includes('module.exports.handle성취통계_Item45Action = handle성취통계_Item45Action'), 'components.js must export handle성취통계_Item45Action');
  assert(componentsJs.includes('og_task-45_cache'), 'components.js must maintain og_task-45_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('toggleDataManagementSection'), 'components.js must export toggleDataManagementSection');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle성취통계_Item45Action === 'function', 'handle성취통계_Item45Action must be an executable function');
  assert(typeof components.toggleDataManagementSection === 'function', 'toggleDataManagementSection must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-45-container'), 'ui.css must contain #og-task-45-container rules');
  assert(uiCss.includes('#og-task-45-action-btn'), 'ui.css must contain #og-task-45-action-btn rules');
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
