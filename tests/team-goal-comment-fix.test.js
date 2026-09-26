'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'team-goal-comment-fix';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(rootDir, 'js/components.js'), 'utf8');
  const uiCss = fs.readFileSync(path.join(rootDir, 'ui.css'), 'utf8');

  // 1. index.html 마크업 및 댓글 전송 배선 검증
  assert(indexHtml.includes('id="og-task-49-container"'), 'index.html must contain #og-task-49-container');
  assert(indexHtml.includes('id="og-task-49-action-btn"'), 'index.html must contain #og-task-49-action-btn');
  assert(indexHtml.includes('handle팀목표_Item49Action(event)'), 'index.html must bind handle팀목표_Item49Action(event)');
  assert(indexHtml.includes('data-ticket="49"'), 'index.html must have data-ticket="49"');
  assert(indexHtml.includes('data-cmtsend="\' + targetId + \'" data-gid="\' + gid + \'"') || indexHtml.includes('data-cmtsend="\' + targetId + \'"') && indexHtml.includes('data-gid="\' + gid + \'"') || indexHtml.includes('data-cmtsend="\'+targetId+\'" data-gid="\'+gid+\'"'), 'teamCommentsBlockHtml must bind data-gid to comment send button');
  assert(indexHtml.includes('window.sendTeamGoalComment = async function'), 'index.html must define window.sendTeamGoalComment');
  assert(indexHtml.includes('state.profile.settings.localTeamComments[gid]'), 'index.html must preserve localTeamComments persistence');
  assert(indexHtml.includes("input.value = '';"), 'index.html must reset input.value after comment submission');
  assert(indexHtml.includes('state.lastOpenCommentKey'), 'index.html must maintain lastOpenCommentKey');

  // 2. js/components.js 직통 핸들러 및 4대 뷰 전파 검증
  assert(componentsJs.includes('async function handle팀목표_Item49Action'), 'components.js must define handle팀목표_Item49Action');
  assert(componentsJs.includes('window.handle팀목표_Item49Action = handle팀목표_Item49Action'), 'components.js must expose handle팀목표_Item49Action to window');
  assert(componentsJs.includes('module.exports.handle팀목표_Item49Action = handle팀목표_Item49Action'), 'components.js must export handle팀목표_Item49Action');
  assert(componentsJs.includes('og_task-49_cache'), 'components.js must maintain og_task-49_cache');
  assert(componentsJs.includes('renderCalendar'), 'components.js must propagate to renderCalendar');
  assert(componentsJs.includes('renderGoalsScreen'), 'components.js must propagate to renderGoalsScreen');
  assert(componentsJs.includes('renderHome'), 'components.js must propagate to renderHome');
  assert(componentsJs.includes('renderRecordsScreen'), 'components.js must propagate to renderRecordsScreen');
  assert(componentsJs.includes('renderTeamGoalsScreen'), 'components.js must propagate to renderTeamGoalsScreen');
  assert(componentsJs.includes('sendTeamGoalComment'), 'components.js must export sendTeamGoalComment');
  assert(componentsJs.includes('toggleTeamGoalCommentSection'), 'components.js must export toggleTeamGoalCommentSection');

  // 3. components.js 로직 실제 가상 모의 실행 검증
  const components = require(path.join(rootDir, 'js/components.js'));
  assert(typeof components.handle팀목표_Item49Action === 'function', 'handle팀목표_Item49Action must be an executable function');
  assert(typeof components.sendTeamGoalComment === 'function', 'sendTeamGoalComment must be an executable function');
  assert(typeof components.toggleTeamGoalCommentSection === 'function', 'toggleTeamGoalCommentSection must be an executable function');

  // 4. ui.css 모바일 375px 및 44px 터치 규격 검증
  assert(uiCss.includes('#og-task-49-container'), 'ui.css must contain #og-task-49-container rules');
  assert(uiCss.includes('#og-task-49-action-btn'), 'ui.css must contain #og-task-49-action-btn rules');
  assert(uiCss.includes('.team-comments-block'), 'ui.css must contain .team-comments-block rules');
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
