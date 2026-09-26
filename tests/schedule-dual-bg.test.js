'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'schedule-dual-bg';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const goalTemplatesJs = fs.readFileSync(path.join(rootDir, 'js/goal-templates-registry.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-40-container"'), 'index.html must contain #og-task-40-container');
  assert(indexHtml.includes('id="og-task-40-action-btn"'), 'index.html must contain #og-task-40-action-btn');
  assert(indexHtml.includes('handle목표탭_Item40Action(event)'), 'index.html must bind handle목표탭_Item40Action(event)');
  assert(indexHtml.includes('data-ticket="40"'), 'index.html must have data-ticket="40"');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle목표탭_Item40Action'), 'components.js must define handle목표탭_Item40Action');
  assert(componentsJs.includes('window.handle목표탭_Item40Action = handle목표탭_Item40Action'), 'components.js must expose handle목표탭_Item40Action to window');
  assert(componentsJs.includes('module.exports.handle목표탭_Item40Action = handle목표탭_Item40Action'), 'components.js must export handle목표탭_Item40Action');
  assert(componentsJs.includes('og_task-40_cache'), 'components.js must maintain og_task-40_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  // 3. js/goal-templates-registry.js 분할 레이아웃 유틸 검증
  assert(goalTemplatesJs.includes('function formatScheduleBackgroundLayout'), 'goal-templates-registry.js must define formatScheduleBackgroundLayout');
  assert(goalTemplatesJs.includes('formatScheduleBackgroundLayout: formatScheduleBackgroundLayout'), 'goal-templates-registry.js must export formatScheduleBackgroundLayout');

  const registry = require(path.join(rootDir, 'js/goal-templates-registry.js'));
  assert.strictEqual(typeof registry.formatScheduleBackgroundLayout, 'function');
  assert.deepStrictEqual(registry.formatScheduleBackgroundLayout([]), { count: 0, layout: 'none', images: [] });
  assert.deepStrictEqual(registry.formatScheduleBackgroundLayout(['bg1.jpg']), { count: 1, layout: 'single_full', images: ['bg1.jpg'] });
  assert.deepStrictEqual(registry.formatScheduleBackgroundLayout(['bg1.jpg', 'bg2.jpg']), { count: 2, layout: 'split_50_50', images: ['bg1.jpg', 'bg2.jpg'] });
  assert.deepStrictEqual(registry.formatScheduleBackgroundLayout(['bg1.jpg', 'bg2.jpg', 'bg3.jpg']), { count: 2, layout: 'split_50_50', images: ['bg1.jpg', 'bg2.jpg'] });

  // 4. ui.css 모바일 375px 및 44px 터치 규격 및 상하 분할 클래스 검증
  assert(uiCss.includes('#og-task-40-container'), 'ui.css must contain #og-task-40-container rules');
  assert(uiCss.includes('#og-task-40-action-btn'), 'ui.css must contain #og-task-40-action-btn rules');
  assert(uiCss.includes('.schedule-bg-split-container'), 'ui.css must contain .schedule-bg-split-container');
  assert(uiCss.includes('.schedule-bg-split-item'), 'ui.css must contain .schedule-bg-split-item');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  // 5. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle목표탭_Item40Action === 'function', 'handle목표탭_Item40Action must be an executable function');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
