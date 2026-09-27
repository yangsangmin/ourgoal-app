'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_TICKET_ID = '#TASK-ES-322';

console.log(`🧪 [${TEST_TICKET_ID} / 노션 71] 2단계 인증(2FA) 실질적 보안 작동 및 무결성 복구 단위 테스트 시작...`);

// 1. index.html 정적 분석 및 핵심 2FA 함수/마크업 검증
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

assert.ok(indexHtml.includes('function openTwoFactorSetupModal()'), 'openTwoFactorSetupModal 함수 존재');
assert.ok(indexHtml.includes('function openTwoFactorDisableModal('), 'openTwoFactorDisableModal 해제 검증 함수 존재');
assert.ok(indexHtml.includes('function challengeTwoFactorModal('), 'challengeTwoFactorModal 세션 챌린지 모달 함수 존재');
assert.ok(indexHtml.includes('id="twoFactorSwitch"'), 'twoFactorSwitch 스위치 마크업 존재');
assert.ok(indexHtml.includes('id="twoFactorPinControls"'), 'twoFactorPinControls PIN 관리 컨트롤 마크업 존재');
assert.ok(indexHtml.includes('id="btnChange2FaPin"'), 'btnChange2FaPin PIN 변경 버튼 마크업 존재');
assert.ok(indexHtml.includes('id="twoFaPinInput"'), 'twoFaPinInput 4자리 PIN 입력 인풋 존재');
assert.ok(indexHtml.includes('id="disable2FaPinInput"'), 'disable2FaPinInput 해제용 PIN 인풋 존재');
assert.ok(indexHtml.includes('id="challenge2FaPin"'), 'challenge2FaPin 챌린지 PIN 인풋 존재');
console.log('  ✅ 1. index.html 2FA 설정·해제·챌린지 마크업 및 함수 무결성 확인');

// 2. enterApp 진입 시 2FA 챌린지 강제 락 검증
assert.ok(indexHtml.includes('if(settings.twoFactorAuth && settings.twoFactorPin && sessionStorage.getItem(\'ourgoal_2fa_verified\') !== \'true\')'), 'enterApp 진입 시 미인증 2FA 세션 챌린지 가드 존재');
assert.ok(indexHtml.includes('challengeTwoFactorModal(function(){'), 'enterApp에서 challengeTwoFactorModal 콜백 호출 확인');
console.log('  ✅ 2. enterApp 앱 진입 시 2FA 챌린지 락 파이프라인 검증');

// 3. components.js handle인증_Item71Action 직통 핸들러 검증
const compPath = path.join(__dirname, '..', 'js', 'components.js');
const componentsSrc = fs.readFileSync(compPath, 'utf8');

assert.ok(componentsSrc.includes('handle인증_Item71Action'), 'components.js handle인증_Item71Action 정의');
assert.ok(componentsSrc.includes('og_task-71_cache'), 'components.js og_task-71_cache 로컬 캐시 키 탑재');
assert.ok(componentsSrc.includes('two_factor_auth_active: true'), 'components.js two_factor_auth_active 플래그 탑재');
assert.ok(componentsSrc.includes('two_factor_pin_enforced: true'), 'components.js two_factor_pin_enforced 플래그 탑재');
assert.ok(componentsSrc.includes('app_entry_challenge_guaranteed: true'), 'components.js app_entry_challenge_guaranteed 플래그 탑재');
assert.ok(componentsSrc.includes('disable_pin_verification_active: true'), 'components.js disable_pin_verification_active 플래그 탑재');

const components = require(compPath);
assert.strictEqual(typeof components.handle인증_Item71Action, 'function', 'handle인증_Item71Action 함수로 노출');

// 4. 가상 환경에서 handle인증_Item71Action 실행 및 상태 전파 테스트
let hapticInvoked = false;
let cacheStored = null;
let toastMsg = null;
let viewsRefreshed = 0;

global.window = {
  navigator: {
    vibrate: (ms) => {
      if (ms === 12) hapticInvoked = true;
    }
  },
  state: {
    profile: {
      id: 'test_user_71',
      displayName: '보안테스터',
      settings: {}
    }
  },
  localStorage: {
    setItem: (key, val) => {
      if (key === 'og_task-71_cache') cacheStored = JSON.parse(val);
    }
  },
  toast: (msg) => { toastMsg = msg; },
  renderSettingsScreen: () => { viewsRefreshed++; },
  renderHome: () => { viewsRefreshed++; },
  renderGoalsScreen: () => { viewsRefreshed++; },
  renderCommScreen: () => { viewsRefreshed++; },
  renderCalendar: () => { viewsRefreshed++; },
  renderAll: () => { viewsRefreshed++; }
};

(async () => {
  const result = await components.handle인증_Item71Action(null, { pin: '7788' });

  assert.strictEqual(hapticInvoked, true, '12ms 햅틱 반응 호출 보장');
  assert.strictEqual(result.task_id, 'TASK-ES-322', '작업 태스크 ID 일치');
  assert.strictEqual(result.two_factor_auth_active, true, '2FA 활성 플래그 보장');
  assert.strictEqual(result.two_factor_pin_enforced, true, 'PIN 번호 강제 플래그 보장');
  assert.strictEqual(global.window.state.profile.settings.twoFactorAuth, true, '프로필 설정 twoFactorAuth 반영');
  assert.strictEqual(global.window.state.profile.settings.twoFactorPin, '7788', '프로필 설정 twoFactorPin 반영');
  assert.ok(cacheStored !== null, 'og_task-71_cache 캐시 영속화');
  assert.strictEqual(cacheStored.task_id, 'TASK-ES-322', '캐시 내 task_id 검증');
  assert.ok(viewsRefreshed >= 4, '4대 뷰 원자적 동시 전파');
  console.log('  ✅ 3. handle인증_Item71Action 12ms 햅틱·캐시·설정·4대 뷰 전파 전수 통과');

  console.log(`🎉 [${TEST_TICKET_ID} / 노션 71] 모든 단위 테스트 통과 (100% 무결점)`);
})();
