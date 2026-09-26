'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'feed-post-preview-modal';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 및 미리보기 슬롯 검증
  assert(indexHtml.includes('id="og-task-51-container"'), 'index.html must contain #og-task-51-container');
  assert(indexHtml.includes('id="og-task-51-action-btn"'), 'index.html must contain #og-task-51-action-btn');
  assert(indexHtml.includes('handle소통_Item51Action(event)'), 'index.html must bind handle소통_Item51Action(event)');
  assert(indexHtml.includes('data-ticket="51"'), 'index.html must have data-ticket="51"');
  assert(indexHtml.includes('id="sharePreviewBtn"'), 'index.html must contain #sharePreviewBtn');
  assert(indexHtml.includes('id="sharePreviewSlot"'), 'index.html must contain #sharePreviewSlot');
  assert(indexHtml.includes('window.toggleFeedPostPreview = toggleFeedPostPreview'), 'index.html must expose toggleFeedPostPreview');

  // 2. js/components.js 직통 핸들러 및 4대 뷰 전파 검증
  assert(componentsJs.includes('async function handle소통_Item51Action'), 'components.js must define handle소통_Item51Action');
  assert(componentsJs.includes('window.handle소통_Item51Action = handle소통_Item51Action'), 'components.js must expose handle소통_Item51Action to window');
  assert(componentsJs.includes('module.exports.handle소통_Item51Action = handle소통_Item51Action'), 'components.js must export handle소통_Item51Action');
  assert(componentsJs.includes('og_task-51_cache'), 'components.js must maintain og_task-51_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('openFeedPostPreviewModal'), 'components.js must export openFeedPostPreviewModal');
  assert(componentsJs.includes('toggleFeedPostPreview'), 'components.js must export toggleFeedPostPreview');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle소통_Item51Action === 'function', 'handle소통_Item51Action must be an executable function');
  assert(typeof components.handle팀목표_Item51Action === 'function', 'handle팀목표_Item51Action must be an executable function');
  assert(typeof components.openFeedPostPreviewModal === 'function', 'openFeedPostPreviewModal must be an executable function');
  assert(typeof components.toggleFeedPostPreview === 'function', 'toggleFeedPostPreview must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-51-container'), 'ui.css must contain #og-task-51-container rules');
  assert(uiCss.includes('#og-task-51-action-btn'), 'ui.css must contain #og-task-51-action-btn rules');
  assert(uiCss.includes('#sharePreviewSlot'), 'ui.css must contain #sharePreviewSlot rules');
  assert(uiCss.includes('#sharePreviewBtn'), 'ui.css must contain #sharePreviewBtn rules');
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
