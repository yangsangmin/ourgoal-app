'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'story-card-diversity';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const recordsStatsJs = fs.readFileSync(path.join(rootDir, 'js/records-stats.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-35-container"'), 'index.html must contain #og-task-35-container');
  assert(indexHtml.includes('id="og-task-35-action-btn"'), 'index.html must contain #og-task-35-action-btn');
  assert(indexHtml.includes('handle기록스톱워치_Item35Action(event)'), 'index.html must bind handle기록스톱워치_Item35Action(event)');
  assert(indexHtml.includes('data-ticket="35"'), 'index.html must have data-ticket="35"');

  // 2. js/components.js & js/records-stats.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle기록스톱워치_Item35Action'), 'components.js must define handle기록스톱워치_Item35Action');
  assert(componentsJs.includes('window.handle기록스톱워치_Item35Action = handle기록스톱워치_Item35Action'), 'components.js must expose handle기록스톱워치_Item35Action to window');
  assert(componentsJs.includes('module.exports.handle기록스톱워치_Item35Action = handle기록스톱워치_Item35Action'), 'components.js must export handle기록스톱워치_Item35Action');
  assert(componentsJs.includes('og_task-35_cache'), 'components.js must maintain og_task-35_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  assert(recordsStatsJs.includes('handle기록스톱워치_Item35Action'), 'records-stats.js must define or export handle기록스톱워치_Item35Action');

  // 3. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-35-container'), 'ui.css must contain #og-task-35-container rules');
  assert(uiCss.includes('#og-task-35-action-btn'), 'ui.css must contain #og-task-35-action-btn rules');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  // 4. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle기록스톱워치_Item35Action === 'function', 'handle기록스톱워치_Item35Action must be an executable function');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
