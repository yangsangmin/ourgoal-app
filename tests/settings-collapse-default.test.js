'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'settings-collapse-default';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 및 기본 접힘 상태 검증
  assert(indexHtml.includes('id="og-task-50-container"'), 'index.html must contain #og-task-50-container');
  assert(indexHtml.includes('id="og-task-50-action-btn"'), 'index.html must contain #og-task-50-action-btn');
  assert(indexHtml.includes('handle전체공통_Item50Action(event)'), 'index.html must bind handle전체공통_Item50Action(event)');
  assert(indexHtml.includes('data-ticket="50"'), 'index.html must have data-ticket="50"');
  assert(!indexHtml.includes('<details class="settings-group-accordion" open>'), 'settings-group-accordion must not have default open attribute');
  assert(indexHtml.includes('collapseAllSettingsSections();'), 'renderSettingsScreen must invoke collapseAllSettingsSections()');
  assert(indexHtml.includes('window.collapseAllSettingsSections = collapseAllSettingsSections'), 'index.html must expose collapseAllSettingsSections');

  // 2. js/components.js 직통 핸들러 및 4대 뷰 전파 검증
  assert(componentsJs.includes('async function handle전체공통_Item50Action'), 'components.js must define handle전체공통_Item50Action');
  assert(componentsJs.includes('window.handle전체공통_Item50Action = handle전체공통_Item50Action'), 'components.js must expose handle전체공통_Item50Action to window');
  assert(componentsJs.includes('module.exports.handle전체공통_Item50Action = handle전체공통_Item50Action'), 'components.js must export handle전체공통_Item50Action');
  assert(componentsJs.includes('og_task-50_cache'), 'components.js must maintain og_task-50_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('renderSettingsScreen'), 'components.js must propagate to renderSettingsScreen');
  assert(componentsJs.includes('collapseAllSettingsSections'), 'components.js must export collapseAllSettingsSections');
  assert(componentsJs.includes('toggleSettingsSectionCollapse'), 'components.js must export toggleSettingsSectionCollapse');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle전체공통_Item50Action === 'function', 'handle전체공통_Item50Action must be an executable function');
  assert(typeof components.collapseAllSettingsSections === 'function', 'collapseAllSettingsSections must be an executable function');
  assert(typeof components.toggleSettingsSectionCollapse === 'function', 'toggleSettingsSectionCollapse must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-50-container'), 'ui.css must contain #og-task-50-container rules');
  assert(uiCss.includes('#og-task-50-action-btn'), 'ui.css must contain #og-task-50-action-btn rules');
  assert(uiCss.includes('.settings-group-accordion'), 'ui.css must contain .settings-group-accordion rules');
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
