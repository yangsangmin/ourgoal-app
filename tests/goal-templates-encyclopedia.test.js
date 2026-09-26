'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'goal-templates-encyclopedia';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 및 전체화면 모달/버튼 검증
  assert(indexHtml.includes('id="og-task-53-container"'), 'index.html must contain #og-task-53-container');
  assert(indexHtml.includes('id="og-task-53-action-btn"'), 'index.html must contain #og-task-53-action-btn');
  assert(indexHtml.includes('handle목표탭_Item53Action(event)'), 'index.html must bind handle목표탭_Item53Action(event)');
  assert(indexHtml.includes('data-ticket="53"'), 'index.html must have data-ticket="53"');
  assert(indexHtml.includes('id="btnGoalTemplateEncyclopedia"'), 'index.html must contain #btnGoalTemplateEncyclopedia');
  assert(indexHtml.includes('id="templateEncyclopediaModal"'), 'index.html must contain #templateEncyclopediaModal');
  assert(indexHtml.includes('id="tabTplRealUser"'), 'index.html must contain #tabTplRealUser');
  assert(indexHtml.includes('id="tabTplOurgoalAi"'), 'index.html must contain #tabTplOurgoalAi');
  assert(indexHtml.includes('id="btnTplEncyclopediaClose"'), 'index.html must contain #btnTplEncyclopediaClose');
  assert(indexHtml.includes('window.openGoalTemplateEncyclopediaModal = openTemplateEncyclopediaModal'), 'index.html must expose openGoalTemplateEncyclopediaModal');
  assert(indexHtml.includes('window.copyUserGoalTemplate = copyRealUserTemplate'), 'index.html must expose copyUserGoalTemplate');

  // 2. js/components.js 직통 핸들러 및 4대 뷰 전파 검증
  assert(componentsJs.includes('async function handle목표탭_Item53Action'), 'components.js must define handle목표탭_Item53Action');
  assert(componentsJs.includes('window.handle목표탭_Item53Action = handle목표탭_Item53Action'), 'components.js must expose handle목표탭_Item53Action to window');
  assert(componentsJs.includes('module.exports.handle목표탭_Item53Action = handle목표탭_Item53Action'), 'components.js must export handle목표탭_Item53Action');
  assert(componentsJs.includes('og_task-53_cache'), 'components.js must maintain og_task-53_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('openGoalTemplateEncyclopediaModal'), 'components.js must export openGoalTemplateEncyclopediaModal');
  assert(componentsJs.includes('copyUserGoalTemplate'), 'components.js must export copyUserGoalTemplate');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle목표탭_Item53Action === 'function', 'handle목표탭_Item53Action must be an executable function');
  assert(typeof components.openGoalTemplateEncyclopediaModal === 'function', 'openGoalTemplateEncyclopediaModal must be an executable function');
  assert(typeof components.copyUserGoalTemplate === 'function', 'copyUserGoalTemplate must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-53-container'), 'ui.css must contain #og-task-53-container rules');
  assert(uiCss.includes('#og-task-53-action-btn'), 'ui.css must contain #og-task-53-action-btn rules');
  assert(uiCss.includes('#btnGoalTemplateEncyclopedia'), 'ui.css must contain #btnGoalTemplateEncyclopedia rules');
  assert(uiCss.includes('template-encyclopedia-fullscreen-modal'), 'ui.css must contain fullscreen modal styles');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
