'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'time-record-modal-compact';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-47-container"'), 'index.html must contain #og-task-47-container');
  assert(indexHtml.includes('id="og-task-47-action-btn"'), 'index.html must contain #og-task-47-action-btn');
  assert(indexHtml.includes('id="timeRecordModalDesc"'), 'index.html must contain #timeRecordModalDesc');
  assert(indexHtml.includes('handle기록스톱워치_Item47Action(event)'), 'index.html must bind handle기록스톱워치_Item47Action(event)');
  assert(indexHtml.includes('data-ticket="47"'), 'index.html must have data-ticket="47"');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle기록스톱워치_Item47Action'), 'components.js must define handle기록스톱워치_Item47Action');
  assert(componentsJs.includes('window.handle기록스톱워치_Item47Action = handle기록스톱워치_Item47Action'), 'components.js must expose handle기록스톱워치_Item47Action to window');
  assert(componentsJs.includes('module.exports.handle기록스톱워치_Item47Action = handle기록스톱워치_Item47Action'), 'components.js must export handle기록스톱워치_Item47Action');
  assert(componentsJs.includes('og_task-47_cache'), 'components.js must maintain og_task-47_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('toggleTimeRecordModalCompact'), 'components.js must export toggleTimeRecordModalCompact');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle기록스톱워치_Item47Action === 'function', 'handle기록스톱워치_Item47Action must be an executable function');
  assert(typeof components.toggleTimeRecordModalCompact === 'function', 'toggleTimeRecordModalCompact must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-47-container'), 'ui.css must contain #og-task-47-container rules');
  assert(uiCss.includes('#og-task-47-action-btn'), 'ui.css must contain #og-task-47-action-btn rules');
  assert(uiCss.includes('.time-record-modal-compact'), 'ui.css must contain .time-record-modal-compact rules');
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
