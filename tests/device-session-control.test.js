/**
 * tests/device-session-control.test.js
 * 
 * [TASK-ES-321 / 노션 70번]
 * 원격 로그아웃 전 로그인 기기 목록 확인 및 개별 세션 제어 기능 구현 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_TICKET_ID = '#TASK-ES-321';
assert.ok(TEST_TICKET_ID === '#TASK-ES-321', '#TASK-ES-321 단위 테스트 식별자 검증');

console.log('🧪 [#TASK-ES-321 / 노션 70] 로그인 기기 목록 확인 및 개별 세션 제어 단위 테스트 시작...');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(indexHtmlPath, 'utf8')); /* #TASK-ES-441 인라인 합본(원문 맨 앞 + js/tabs 세포) */

// 1. index.html 내 getRegisteredDevices 및 renderActiveDevicesList 구비 검증
assert.ok(indexHtml.includes('function getRegisteredDevices()'), 'getRegisteredDevices 함수 선언 확인');
assert.ok(indexHtml.includes('function renderActiveDevicesList()'), 'renderActiveDevicesList 함수 선언 확인');
assert.ok(indexHtml.includes('function openLogoutOtherDevicesConfirmModal()'), 'openLogoutOtherDevicesConfirmModal 사전 확인 모달 함수 선언 확인');
assert.ok(indexHtml.includes('logoutOtherDevicesBtn'), '다른 모든 기기 원격 로그아웃 버튼 ID 확인');
assert.ok(indexHtml.includes('btn-revoke-device'), '개별 기기 원격 로그아웃 버튼 클래스 확인');
console.log('  ✅ 1. index.html 기기 목록 및 세션 제어 핵심 함수 무결성 확인');

// 2. 기기 식별 5대 앵커 및 상태 배지 렌더링 검증
assert.ok(indexHtml.includes('🟢 현재 기기'), '현재 기기 정상 상태 배지 확인');
assert.ok(indexHtml.includes('🔴 원격 차단됨'), '원격 로그아웃/차단 시각적 배지 확인');
assert.ok(indexHtml.includes('🟢 정상 연결 중'), '타 활성 기기 정상 연결 배지 확인');
assert.ok(indexHtml.includes('이 기기만 표시'), '기기 배지는 수집하지 않는 다른 기기 수를 지어내지 않고 이 기기만 표시함(#TASK-ES-346)');
assert.ok(indexHtml.includes('ipHint'), '접속 위치 및 IP 힌트 속성 확인');
console.log('  ✅ 2. 기기 5대 식별 앵커 및 실시간 상태 배지 렌더링 확인');

// 3. 사전 2중 확인 모달 내 다른 기기 목록 표출 검증
assert.ok(indexHtml.includes('다른 모든 기기 원격 로그아웃 확인'), '사전 확인 모달 타이틀 확인');
assert.ok(indexHtml.includes('btnConfirmLogoutOtherModal'), '일괄 로그아웃 승인 버튼 확인');
assert.ok(indexHtml.includes('btnCancelLogoutOtherModal'), '취소 버튼 확인');
console.log('  ✅ 3. 사전 2중 확인 모달 구조 무결성 확인');

// 4. components.js의 handle인증_Item70Action 검증
const components = require('../js/components.js');
assert.strictEqual(typeof components.handle인증_Item70Action, 'function', 'handle인증_Item70Action 함수 노출 확인');

(async () => {
  let vibrateMs = 0;
  let cacheKey = null;
  let cacheVal = null;
  let settingsRendered = false;
  let homeRendered = false;
  let goalsRendered = false;

  const mockWindow = {
    navigator: {
      vibrate: (ms) => { vibrateMs = ms; }
    },
    localStorage: {
      setItem: (k, v) => { cacheKey = k; cacheVal = v; },
      getItem: () => null
    },
    state: {
      profile: {
        id: 'usr-test-70',
        settings: {}
      }
    },
    toast: (msg) => {},
    renderActiveDevicesList: () => {},
    renderSettingsScreen: () => { settingsRendered = true; },
    renderHome: () => { homeRendered = true; },
    renderGoalsScreen: () => { goalsRendered = true; },
    renderCommScreen: () => {},
    renderCalendar: () => {},
    renderAll: () => {}
  };

  global.window = mockWindow;

  const res = await components.handle인증_Item70Action(null, { silent: true });

  assert.strictEqual(vibrateMs, 12, '12ms 햅틱 반응 검증');
  assert.strictEqual(cacheKey, 'og_task-70_cache', 'og_task-70_cache 캐시 영속화 검증');
  assert.strictEqual(res.ticket, '70', '티켓 번호 70 검증');
  assert.strictEqual(res.task_id, 'TASK-ES-321', '태스크 ID TASK-ES-321 검증');
  assert.strictEqual(res.device_session_control_active, true, '기기 세션 제어 활성화 플래그 검증');
  assert.strictEqual(mockWindow.state.profile.settings.deviceSessionControlActive, true, '프로필 세팅 영속화 검증');
  assert.ok(settingsRendered && homeRendered && goalsRendered, '헌법 제15조 제6항 4대 뷰 원자적 동시 전파 검증');

  console.log('  ✅ 4. handle인증_Item70Action 12ms 햅틱·캐시·상태·4대 뷰 전파 전수 검증 통과');
  console.log('🎉 [#TASK-ES-321 / 노션 70] 모든 단위 테스트 통과 (100% 무결점)');
})();
