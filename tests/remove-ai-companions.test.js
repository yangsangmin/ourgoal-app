'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)

// #TASK-ES-388 (팀 세포 쪼개기 2차 선행): 팀 코드가 js/team-invite-comm.js 에서 js/team-*.js 키트 부품(OurgoalTeamCommKit 에 함수를 담는 파일)으로 옮겨 가도
// 같은 단언이 같은 코드를 찾도록 '팀 합본' = js/team-invite-comm.js(원문 그대로, 맨 앞) + 키트 부품(이름순, 생성기 접두 T.·K. 를 떼고) 를 읽는다. 단언·기대값은 그대로다.
function listTeamCommParts(rootDir) {
  const dir = path.join(rootDir, 'js');
  return fs.readdirSync(dir).filter((n) => n.indexOf('team-') === 0 && n !== 'team-invite-comm.js' && n.endsWith('.js')).sort()
    .map((n) => path.join(dir, n)).filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalTeamCommKit') >= 0);
}
function readTeamCommBundle(rootDir) {
  const raw = fs.readFileSync(path.join(rootDir, 'js', 'team-invite-comm.js'), 'utf8');
  const parts = listTeamCommParts(rootDir);
  const src = [raw, ...parts.map((f) => fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g, '$1'))].join('\n');
  // 합본 맨 앞은 원문 그대로다(원본에서 찾던 글자는 같은 자리에서 찾는다). 부품 파일이 없으면 합본 = 원문.
  assert.strictEqual(src.slice(0, raw.length), raw, '팀 합본 맨 앞 = js/team-invite-comm.js 원문');
  if (parts.length === 0) assert.strictEqual(src, raw, '팀 합본 = js/team-invite-comm.js (부품 파일이 없을 때)');
  return src;
}

const SUITE_NAME = 'remove-ai-companions';

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const componentsJs = readComponentsBundle();
  const teamInviteJs = readTeamCommBundle(rootDir);
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
