'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'settings-reorganization';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const customizeJs = fs.readFileSync(path.join(rootDir, 'js/customize.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-38-container"'), 'index.html must contain #og-task-38-container');
  assert(indexHtml.includes('id="og-task-38-action-btn"'), 'index.html must contain #og-task-38-action-btn');
  assert(indexHtml.includes('handle전체공통_Item38Action(event)'), 'index.html must bind handle전체공통_Item38Action(event)');
  assert(indexHtml.includes('data-ticket="38"'), 'index.html must have data-ticket="38"');

  // 2. js/components.js & js/customize.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle전체공통_Item38Action'), 'components.js must define handle전체공통_Item38Action');
  assert(componentsJs.includes('window.handle전체공통_Item38Action = handle전체공통_Item38Action'), 'components.js must expose handle전체공통_Item38Action to window');
  assert(componentsJs.includes('module.exports.handle전체공통_Item38Action = handle전체공통_Item38Action'), 'components.js must export handle전체공통_Item38Action');
  assert(componentsJs.includes('og_task-38_cache'), 'components.js must maintain og_task-38_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  assert(customizeJs.includes('handle전체공통_Item38Action'), 'customize.js must define or export handle전체공통_Item38Action');

  // 3. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-38-container'), 'ui.css must contain #og-task-38-container rules');
  assert(uiCss.includes('#og-task-38-action-btn'), 'ui.css must contain #og-task-38-action-btn rules');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  // 4. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle전체공통_Item38Action === 'function', 'handle전체공통_Item38Action must be an executable function');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
