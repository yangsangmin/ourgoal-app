const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_ID = '#TASK-ES-324';
const TICKET_NAME = '[73] 프로필 편집 내 잇템등록 > 잇템추가 버튼 작동 안함 오류 수정';

console.log(`[TEST] Starting ${SUITE_ID} - ${TICKET_NAME}`);

// 1. Static file inspections
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const componentsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');
const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
const ticketsMd = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rules', 'TICKETS.md'), 'utf8');

// [R1] openProfileEditor & pvAddItItem 44px 터치타겟 및 토글
assert.ok(indexHtml.includes('id="pvAddItItem"'), '[R1] pvAddItItem 버튼이 index.html에 존재해야 함');
assert.ok(indexHtml.includes('min-height:44px'), '[R1] pvAddItItem 버튼 인라인 스타일에 min-height:44px 존재');
assert.ok(uiCss.includes('#pvAddItItem'), '[R1] ui.css 내에 #pvAddItItem 전용 스타일 정의 존재');
assert.ok(uiCss.includes('min-height: 44px !important'), '[R1] ui.css 내 #pvAddItItem min-height: 44px 터치타겟 보장');

// [R2] 빈 상태 잇템 안내 상자 클릭 트리거 배선
assert.ok(indexHtml.includes('id="pvEmptyItItemTrigger"'), '[R2] pvEmptyItItemTrigger 요소가 index.html에 정의되어 있어야 함');
assert.ok(indexHtml.includes('toggleInlineForm(true)'), '[R2] 빈 상태 클릭 시 toggleInlineForm(true) 연동 존재');

// [R3] 등록/삭제 즉각 Zero Data Loss 로컬 영속화
assert.ok(indexHtml.includes('draft.itItems.slice()'), '[R3] state.profile.itItems에 draft.itItems 즉시 동기화');
assert.ok(indexHtml.includes('ourgoal_profile_backup_'), '[R3] 잇템 추가/삭제 시 ourgoal_profile_backup_ 즉시 갱신');
assert.ok(indexHtml.includes('ourgoal_guest_profile'), '[R3] 잇템 추가/삭제 시 ourgoal_guest_profile 즉시 갱신');

// [R4] Supabase it_items 안전 영속화 및 복원
assert.ok(indexHtml.includes('it_items: state.profile.itItems || []'), '[R4] saveProfile 내 userUpsertObj에 it_items 포함');
assert.ok(indexHtml.includes('/it_items/i.test(uUpsertRes.error.message'), '[R4] it_items 컬럼 미존재 시 안전 재시도 폴백 존재');
assert.ok(indexHtml.includes('urow.it_items && Array.isArray(urow.it_items)'), '[R4] loadProfile 시 urow.it_items 배열 안전 복원');

// [R5] 설정창 퀵 프로필편집 연동
assert.ok(indexHtml.includes("onclick=\"if(typeof window.openProfileEditor === 'function'){ window.openProfileEditor(); }"), '[R5] btnSettingsQuickAvatar가 openProfileEditor를 1순위로 호출');

// [R6] 직통 핸들러 handle프로필_Item73Action
assert.ok(componentsJs.includes('function handle프로필_Item73Action(event, customPayload)'), '[R6] handle프로필_Item73Action 구현 존재');
assert.ok(componentsJs.includes('og_task-73_cache'), '[R6] og_task-73_cache 로컬 캐시 영속화');
assert.ok(componentsJs.includes('ititem_add_button_fixed'), '[R6] ititem_add_button_fixed 페이로드 플래그');
assert.ok(componentsJs.includes('window.handle프로필_Item73Action = handle프로필_Item73Action'), '[R6] 전역 노출 window.handle프로필_Item73Action');
assert.ok(componentsJs.includes('window.handle설정_Item73Action = handle프로필_Item73Action'), '[R6] 별칭 전역 노출 window.handle설정_Item73Action');

// [R8] TICKETS.md 등록
assert.ok(ticketsMd.includes('#TASK-ES-324'), '[R8] TICKETS.md 내 #TASK-ES-324 승인 티켓 등록 확인');

// 2. Functional Mock Simulation
console.log('[TEST] Running functional mock simulation...');

const mockStorage = {};
const mockWindow = {
  navigator: {
    vibratedMs: 0,
    vibrate: function(ms) { this.vibratedMs = ms; }
  },
  localStorage: {
    setItem: (k, v) => { mockStorage[k] = String(v); },
    getItem: (k) => mockStorage[k] || null
  },
  toastMsg: null,
  toast: function(msg) { this.toastMsg = msg; },
  state: {
    profile: {
      id: 'usr_73_test',
      displayName: '러너상민',
      itItems: []
    }
  },
  renderCount: { settings: 0, home: 0, all: 0 },
  renderSettingsScreen: function() { this.renderCount.settings++; },
  renderHome: function() { this.renderCount.home++; },
  renderAll: function() { this.renderCount.all++; }
};

// Test components.js handler
const components = require('../js/components.js');
assert.strictEqual(typeof components.handle프로필_Item73Action, 'function', 'handle프로필_Item73Action should be exported by components.js');

async function runMockTest() {
  global.window = mockWindow;
  global.state = mockWindow.state;
  global.localStorage = mockWindow.localStorage;
  global.navigator = mockWindow.navigator;

  // Run handle프로필_Item73Action
  const payload = await components.handle프로필_Item73Action(null, {
    itItem: { id: 'it_mock_1', name: '나이키 베이퍼플라이', buyUrl: 'https://nike.com', desc: '레이싱화', isAffiliate: false }
  });

  assert.ok(payload.ititem_add_button_fixed, 'payload should indicate ititem_add_button_fixed: true');
  assert.strictEqual(mockWindow.navigator.vibratedMs, 12, '12ms haptic vibration should be invoked');
  assert.strictEqual(mockWindow.state.profile.itItems.length, 1, 'itItem should be pushed to state.profile.itItems');
  assert.strictEqual(mockWindow.state.profile.itItems[0].name, '나이키 베이퍼플라이');

  const cache = JSON.parse(mockStorage['og_task-73_cache']);
  assert.strictEqual(cache.task_id, 'TASK-ES-324', 'Cache task_id must be TASK-ES-324');
  assert.strictEqual(cache.ticket, '73', 'Cache ticket must be 73');

  const backup = JSON.parse(mockStorage['ourgoal_profile_backup_usr_73_test']);
  assert.strictEqual(backup.itItems.length, 1, 'Local backup must contain 1 itItem immediately');

  assert.ok(mockWindow.renderCount.settings > 0, 'renderSettingsScreen should be called');
  assert.ok(mockWindow.renderCount.home > 0, 'renderHome should be called');

  console.log(`[TEST] ✅ All tests for ${SUITE_ID} passed with 100% integrity.`);
}

runMockTest().catch((err) => {
  console.error('[TEST] ❌ Test failed:', err);
  throw err;
});
