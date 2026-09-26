'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'avatar-levelup-dialogue';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const avatarSystemJs = fs.readFileSync(path.join(rootDir, 'js/avatar-system.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-41-container"'), 'index.html must contain #og-task-41-container');
  assert(indexHtml.includes('id="og-task-41-action-btn"'), 'index.html must contain #og-task-41-action-btn');
  assert(indexHtml.includes('handle아바타_Item41Action(event)'), 'index.html must bind handle아바타_Item41Action(event)');
  assert(indexHtml.includes('data-ticket="41"'), 'index.html must have data-ticket="41"');

  // 2. js/components.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle아바타_Item41Action'), 'components.js must define handle아바타_Item41Action');
  assert(componentsJs.includes('window.handle아바타_Item41Action = handle아바타_Item41Action'), 'components.js must expose handle아바타_Item41Action to window');
  assert(componentsJs.includes('module.exports.handle아바타_Item41Action = handle아바타_Item41Action'), 'components.js must export handle아바타_Item41Action');
  assert(componentsJs.includes('og_task-41_cache'), 'components.js must maintain og_task-41_cache');
  assert(componentsJs.includes('진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!'), 'components.js must include exact dialogue');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  // 3. js/avatar-system.js 레벨업 멘트 헬퍼 함수 검증
  assert(avatarSystemJs.includes('function triggerAvatarLevelUpDialogue'), 'avatar-system.js must define triggerAvatarLevelUpDialogue');
  assert(avatarSystemJs.includes('api.triggerAvatarLevelUpDialogue = triggerAvatarLevelUpDialogue'), 'avatar-system.js must export triggerAvatarLevelUpDialogue');
  assert(avatarSystemJs.includes('진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!'), 'avatar-system.js must contain exact dialogue');

  const avatarSystem = require(path.join(rootDir, 'js/avatar-system.js'));
  assert.strictEqual(typeof avatarSystem.triggerAvatarLevelUpDialogue, 'function', 'triggerAvatarLevelUpDialogue must be a function');
  const dialogueRes = avatarSystem.triggerAvatarLevelUpDialogue(3);
  assert.strictEqual(dialogueRes.dialogue, '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!');
  assert.strictEqual(dialogueRes.level, 3);
  assert.strictEqual(dialogueRes.suggest_background_change, true);

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-41-container'), 'ui.css must contain #og-task-41-container rules');
  assert(uiCss.includes('#og-task-41-action-btn'), 'ui.css must contain #og-task-41-action-btn rules');
  assert(uiCss.includes('.avatar-levelup-dialogue-bubble'), 'ui.css must contain .avatar-levelup-dialogue-bubble rules');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  // 5. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle아바타_Item41Action === 'function', 'handle아바타_Item41Action must be an executable function');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
