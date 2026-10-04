'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

function runTest() {
  console.log('[TEST] #TASK-ES-318: DM 카카오톡 방식 전송/도착/읽음 확인 및 상세 시각 표시 검증 시작');

  // 1. js/team-invite-comm.js 소스 코드 정적 분석
  const commJsPath = path.resolve(__dirname, '../js/team-invite-comm.js');
  const commJs = readTeamCommBundle(path.resolve(__dirname, '..'));

  assert(commJs.includes('renderSingleDmMsg'), 'renderSingleDmMsg 함수가 team-invite-comm.js에 있어야 합니다.');
  assert(commJs.includes('formatDmDetailTime'), 'formatDmDetailTime 함수가 team-invite-comm.js에 있어야 합니다.');
  assert(commJs.includes('toggleDmMsgDetail'), 'toggleDmMsgDetail 함수가 team-invite-comm.js에 있어야 합니다.');
  assert(commJs.includes('markDmThreadAsRead'), 'markDmThreadAsRead 함수가 team-invite-comm.js에 있어야 합니다.');
  assert(commJs.includes('dm-unread-badge') && commJs.includes('#eab308'), '카카오톡 방식 노란색 1 안읽음 뱃지(#eab308)가 존재해야 합니다.');
  assert(commJs.includes('dm-msg-detail-box'), '상세 시각(전송·도착·읽음) 팝업 박스 dm-msg-detail-box가 렌더링되어야 합니다.');

  // 2. js/team-invite-comm.js 모듈 로드 및 렌더링 검증
  // 전역 mock 설정
  global.window = global;
  global.state = {
    profile: {
      id: 'user_sender',
      name: '상민님',
      settings: {}
    }
  };

  require('../js/team-invite-comm.js');
  const commMod = global.OurgoalTeamInviteComm;
  assert(commMod, 'OurgoalTeamInviteComm 모듈이 로드되어야 합니다.');
  assert(typeof commMod.renderSingleDmMsg === 'function', 'renderSingleDmMsg 함수가 제공되어야 합니다.');
  assert(typeof commMod.formatDmDetailTime === 'function', 'formatDmDetailTime 함수가 제공되어야 합니다.');

  // 2-1. 안 읽은 내 메시지 렌더링 검증 (노란색 숫자 1 확인)
  const unreadMsg = {
    id: 'test_msg_1',
    from: 'me',
    text: '테스트 메시지입니다',
    time: '2026-09-27T18:00:00.000Z',
    createdAt: '2026-09-27T18:00:00.000Z',
    sentAt: '2026-09-27T18:00:00.000Z',
    deliveredAt: '2026-09-27T18:00:01.000Z',
    readAt: null,
    status: 'delivered',
    read: false
  };
  const unreadHtml = commMod.renderSingleDmMsg(unreadMsg);
  assert(unreadHtml.includes('class="dm-unread-badge"'), '미확인 메시지에는 dm-unread-badge가 렌더링되어야 합니다.');
  assert(unreadHtml.includes('#eab308'), '미확인 뱃지는 카카오톡 시그니처 색상(#eab308)이어야 합니다.');
  assert(unreadHtml.includes('1</span>'), '미확인 뱃지 숫자는 1이어야 합니다.');
  assert(unreadHtml.includes('dm-msg-detail-box'), '상세 전송 정보 박스가 포함되어야 합니다.');

  // 2-2. 읽은 내 메시지 렌더링 검증 (숫자 1 사라짐 및 읽음 상태 표시)
  const readMsg = {
    id: 'test_msg_2',
    from: 'me',
    text: '확인된 메시지입니다',
    time: '2026-09-27T18:05:00.000Z',
    createdAt: '2026-09-27T18:05:00.000Z',
    sentAt: '2026-09-27T18:05:00.000Z',
    deliveredAt: '2026-09-27T18:05:01.000Z',
    readAt: '2026-09-27T18:06:00.000Z',
    status: 'read',
    read: true
  };
  const readHtml = commMod.renderSingleDmMsg(readMsg);
  assert(!readHtml.includes('dm-unread-badge'), '읽은 메시지에는 숫자 1 뱃지가 없어야 합니다.');
  assert(readHtml.includes('읽음'), '읽은 메시지에는 읽음 표시가 포함되어야 합니다.');
  assert(readHtml.includes('읽음 2026'), '상세 타임스탬프 박스에 읽은 시각 정보가 포함되어야 합니다.');

  // 3. js/components.js 직통 핸들러 동작 검증
  const components = require('../js/components.js');
  assert(typeof components.handle소통_Item67Action === 'function', 'handle소통_Item67Action 함수가 export 되어야 합니다.');

  let vibrateMs = null;
  let homeRendered = false;
  let goalsRendered = false;
  let recordsRendered = false;
  let commRendered = false;
  let calendarRendered = false;
  let allRendered = false;
  let toastMsg = null;
  let cachedPayload = null;

  global.window = {
    navigator: {
      vibrate: (ms) => { vibrateMs = ms; }
    },
    state: {
      profile: {
        id: 'user_sender',
        name: '상민님',
        settings: {}
      }
    },
    localStorage: {
      setItem: (key, val) => {
        if (key === 'og_task-67_cache') {
          cachedPayload = JSON.parse(val);
        }
      }
    },
    toast: (msg) => { toastMsg = msg; },
    renderCommScreen: () => { commRendered = true; },
    renderHome: () => { homeRendered = true; },
    renderGoalsScreen: () => { goalsRendered = true; },
    renderRecordsScreen: () => { recordsRendered = true; },
    renderCalendar: () => { calendarRendered = true; },
    renderAll: () => { allRendered = true; }
  };

  return components.handle소통_Item67Action(null, { testRun: true })
    .then(result => {
      assert.strictEqual(vibrateMs, 12, '12ms 햅틱 반응이 실행되어야 합니다.');
      assert.strictEqual(result.task_id, 'TASK-ES-318', 'task_id는 TASK-ES-318 이어야 합니다.');
      assert.strictEqual(result.kakaotalk_style_badge_enabled, true, '카카오톡 스타일 뱃지 활성화 플래그가 true 이어야 합니다.');
      assert(cachedPayload && cachedPayload.task_id === 'TASK-ES-318', '로컬 스토리지 og_task-67_cache에 캐시가 영속화되어야 합니다.');
      assert.strictEqual(commRendered, true, 'renderCommScreen이 호출되어야 합니다.');
      assert.strictEqual(homeRendered, true, 'renderHome이 호출되어야 합니다.');
      assert.strictEqual(goalsRendered, true, 'renderGoalsScreen이 호출되어야 합니다.');
      assert.strictEqual(recordsRendered, true, 'renderRecordsScreen이 호출되어야 합니다.');
      assert.strictEqual(calendarRendered, true, 'renderCalendar가 호출되어야 합니다.');
      assert(toastMsg && toastMsg.includes('카카오톡 방식'), '안내 토스트 메시지가 정상 출력되어야 합니다.');

      console.log('✔ [TEST] #TASK-ES-318 모든 단언문 무결점 통과!');
    });
}

try {
  runTest().catch(err => {
    console.error('❌ [TEST FAIL]', err);
    throw err;
  });
} catch (err) {
  console.error('❌ [TEST FAIL]', err);
  throw err;
}
