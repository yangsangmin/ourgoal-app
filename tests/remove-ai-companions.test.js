'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'remove-ai-companions';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const teamInviteJs = fs.readFileSync(path.join(rootDir, 'js/team-invite-comm.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 검증
  assert(indexHtml.includes('id="og-task-37-container"'), 'index.html must contain #og-task-37-container');
  assert(indexHtml.includes('id="og-task-37-action-btn"'), 'index.html must contain #og-task-37-action-btn');
  assert(indexHtml.includes('handle팀목표_Item37Action(event)'), 'index.html must bind handle팀목표_Item37Action(event)');
  assert(indexHtml.includes('data-ticket="37"'), 'index.html must have data-ticket="37"');

  // 2. js/components.js & js/team-invite-comm.js 직통 핸들러 및 export 검증
  assert(componentsJs.includes('async function handle팀목표_Item37Action'), 'components.js must define handle팀목표_Item37Action');
  assert(componentsJs.includes('window.handle팀목표_Item37Action = handle팀목표_Item37Action'), 'components.js must expose handle팀목표_Item37Action to window');
  assert(componentsJs.includes('module.exports.handle팀목표_Item37Action = handle팀목표_Item37Action'), 'components.js must export handle팀목표_Item37Action');
  assert(componentsJs.includes('og_task-37_cache'), 'components.js must maintain og_task-37_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');

  assert(teamInviteJs.includes('handle팀목표_Item37Action'), 'team-invite-comm.js must define or export handle팀목표_Item37Action');

  // 3. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-37-container'), 'ui.css must contain #og-task-37-container rules');
  assert(uiCss.includes('#og-task-37-action-btn'), 'ui.css must contain #og-task-37-action-btn rules');
  assert(uiCss.includes('min-height: 44px'), 'ui.css must enforce min-height: 44px');
  assert(uiCss.includes('min-width: 44px'), 'ui.css must enforce min-width: 44px');

  // 4. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle팀목표_Item37Action === 'function', 'handle팀목표_Item37Action must be an executable function');

  console.log(`[TEST PASS] ${SUITE_NAME} - All assertions succeeded!`);
}

try {
  runTests();
} catch (err) {
  console.error(`[TEST FAILED] ${SUITE_NAME}:`, err);
  throw err;
}
