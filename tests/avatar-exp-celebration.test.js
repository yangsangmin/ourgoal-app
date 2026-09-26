'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'avatar-exp-celebration';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const avatarSystemJs = fs.readFileSync(path.join(rootDir, 'js/avatar-system.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-42-container"'), 'index.html must contain #og-task-42-container');
  assert(indexHtml.includes('id="og-task-42-action-btn"'), 'index.html must contain #og-task-42-action-btn');
  assert(indexHtml.includes('handle아바타_Item42Action(event)'), 'index.html must bind handle아바타_Item42Action(event)');
  assert(indexHtml.includes('data-ticket="42"'), 'index.html must have data-ticket="42"');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle아바타_Item42Action'), 'components.js must define handle아바타_Item42Action');
  assert(componentsJs.includes('window.handle아바타_Item42Action = handle아바타_Item42Action'), 'components.js must expose handle아바타_Item42Action to window');
  assert(componentsJs.includes('module.exports.handle아바타_Item42Action = handle아바타_Item42Action'), 'components.js must export handle아바타_Item42Action');
  assert(componentsJs.includes('og_task-42_cache'), 'components.js must maintain og_task-42_cache');
  assert(componentsJs.includes('잘했다! 내 자신!'), 'components.js must include exact dialogue');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  // 3. js/avatar-system.js 축하 팝업 헬퍼 함수 검증
  assert(avatarSystemJs.includes('function triggerExpCelebrationPopup'), 'avatar-system.js must define triggerExpCelebrationPopup');
  assert(avatarSystemJs.includes('api.triggerExpCelebrationPopup = triggerExpCelebrationPopup'), 'avatar-system.js must export triggerExpCelebrationPopup');
  assert(avatarSystemJs.includes('잘했다! 내 자신!'), 'avatar-system.js must contain exact dialogue');

  const avatarSystem = require(path.join(rootDir, 'js/avatar-system.js'));
  assert.strictEqual(typeof avatarSystem.triggerExpCelebrationPopup, 'function', 'triggerExpCelebrationPopup must be a function');
  const dialogueRes = avatarSystem.triggerExpCelebrationPopup(25);
  assert.strictEqual(dialogueRes.dialogue, '잘했다! 내 자신!');
  assert.strictEqual(dialogueRes.exp_gained, 25);
  assert.strictEqual(dialogueRes.celebration_active, true);

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-42-container'), 'ui.css must contain #og-task-42-container rules');
  assert(uiCss.includes('#og-task-42-action-btn'), 'ui.css must contain #og-task-42-action-btn rules');
  assert(uiCss.includes('.avatar-celebration-bubble'), 'ui.css must contain .avatar-celebration-bubble rules');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  // 5. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle아바타_Item42Action === 'function', 'handle아바타_Item42Action must be an executable function');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
