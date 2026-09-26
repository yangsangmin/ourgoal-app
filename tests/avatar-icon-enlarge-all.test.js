'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'avatar-icon-enlarge-all';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 및 크기 검증
  assert(indexHtml.includes('id="og-task-48-container"'), 'index.html must contain #og-task-48-container');
  assert(indexHtml.includes('id="og-task-48-action-btn"'), 'index.html must contain #og-task-48-action-btn');
  assert(indexHtml.includes('handle아바타_Item48Action(event)'), 'index.html must bind handle아바타_Item48Action(event)');
  assert(indexHtml.includes('data-ticket="48"'), 'index.html must have data-ticket="48"');
  assert(indexHtml.includes('size: 76') && indexHtml.includes('width:76px;height:76px;'), 'levelBadgeHtml must render 76px avatar');
  assert(indexHtml.includes('id="topAvatar" style="width:56px;height:56px;"'), 'topAvatar must be sized 56px');
  assert(indexHtml.includes('avatarHtml(76)'), 'settings screen must render 76px avatar');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle아바타_Item48Action'), 'components.js must define handle아바타_Item48Action');
  assert(componentsJs.includes('window.handle아바타_Item48Action = handle아바타_Item48Action'), 'components.js must expose handle아바타_Item48Action to window');
  assert(componentsJs.includes('module.exports.handle아바타_Item48Action = handle아바타_Item48Action'), 'components.js must export handle아바타_Item48Action');
  assert(componentsJs.includes('og_task-48_cache'), 'components.js must maintain og_task-48_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('renderSettingsScreen'), 'components.js must propagate to renderSettingsScreen');
  assert(componentsJs.includes('enlargeAvatarIconsBatch'), 'components.js must export enlargeAvatarIconsBatch');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle아바타_Item48Action === 'function', 'handle아바타_Item48Action must be an executable function');
  assert(typeof components.enlargeAvatarIconsBatch === 'function', 'enlargeAvatarIconsBatch must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-48-container'), 'ui.css must contain #og-task-48-container rules');
  assert(uiCss.includes('#og-task-48-action-btn'), 'ui.css must contain #og-task-48-action-btn rules');
  assert(uiCss.includes('.toss-settings-avatar-wrap'), 'ui.css must contain .toss-settings-avatar-wrap rules');
  assert(uiCss.includes('width: 76px'), 'ui.css must define width: 76px for enlarged avatar wrap');
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
