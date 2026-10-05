/**
 * tests/team-creation-clean.test.js
 * 
 * [TASK-ES-319 / 노션 68번]
 * 팀 만들기 불필요 제약(정원 제한·인증 주기·챌린지 기간·인증 규칙·진행방식) 전면 점검 및 삭제 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_TICKET_ID = '#TASK-ES-319';
assert.ok(TEST_TICKET_ID === '#TASK-ES-319', '#TASK-ES-319 단위 테스트 식별자 검증');

console.log('🧪 [#TASK-ES-319 / 노션 68] 팀 만들기 불필요 제약 전면 삭제 단위 테스트 시작...');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(indexHtmlPath, 'utf8')); /* #TASK-ES-468 인라인 합본(원문 맨 앞 + js/tabs 세포) — 팀 만들기 기본값(promptNewGroup)이 소통 탭 세포로 옮겨 가도 같은 글자를 찾는다(인라인 어려움 구역 H4 선행) */

// 1. 5대 제약 필드(정원 제한·인증 주기·챌린지 기간·인증 규칙·진행방식) 부재 검증
assert.ok(!indexHtml.includes('<select id="grpMaxMembers">'), '팀 만들기 모달 정원 제한 선택란 영구 삭제 확인');
assert.ok(!indexHtml.includes('<select id="grpCadence">'), '팀 만들기 모달 인증 주기 선택란 영구 삭제 확인');
assert.ok(!indexHtml.includes('<select id="grpWeeks">'), '팀 만들기 모달 챌린지 기간 선택란 영구 삭제 확인');
assert.ok(!indexHtml.includes('<input id="grpRule"'), '팀 만들기 모달 인증 규칙 입력란 영구 삭제 확인');
assert.ok(!indexHtml.includes('<select id="grpMode">'), '팀 만들기 모달 진행 방식 선택란 영구 삭제 확인');
console.log('  ✅ 1. 5대 제약 폼 입력 필드 영구 삭제 상태 무결성 확인');

// 2. 팀 만들기 모달 내 자유로운 팀 안내 문구 검증
assert.ok(indexHtml.includes('정원·인증 주기·기간 제약 없는 자유로운 팀이에요'), '팀 만들기 모달 안내 문구 탑재 확인');
console.log('  ✅ 2. 팀 만들기 모달 자유 팀 안내 문구 탑재 확인');

// 3. 팀 생성 시 5대 제약 무해화 기본값(무제한 정원, 자유 주기, 상시 지속형 등) 주입 검증
assert.ok(indexHtml.includes('maxMembers: 999999'), '정원 제약 없는 무제한(999999) 기본값 확인');
assert.ok(indexHtml.includes("cadence: '자유'"), '자율 인증 주기 기본값 확인');
assert.ok(indexHtml.includes('endDate: null'), '챌린지 기간 제약 없는 상시 지속형(null) 기본값 확인');
assert.ok(indexHtml.includes("rule: '자유 실천 (누구나 부담 없이 자유롭게 실천하고 소통해요)'"), '자유 실천 규칙 기본값 확인');
assert.ok(indexHtml.includes("mode: 'open'"), '누구나 열린 팀 모드 기본값 확인');
console.log('  ✅ 3. 팀 생성 시 5대 제약 전면 무해화 기본값 자동 주입 확인');

// 4. components.js의 handle팀목표_Item68Action 검증
const components = require('../js/components.js');
assert.strictEqual(typeof components.handle팀목표_Item68Action, 'function', 'handle팀목표_Item68Action 함수 노출 확인');

(async () => {
  let vibrateMs = 0;
  let cacheKey = null;
  let cacheVal = null;
  let goalsRendered = false;
  let commRendered = false;
  let homeRendered = false;

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
        id: 'test-user-68',
        settings: {}
      }
    },
    toast: (msg) => {},
    renderGoalsScreen: () => { goalsRendered = true; },
    renderCommScreen: () => { commRendered = true; },
    renderHome: () => { homeRendered = true; },
    renderRecordsScreen: () => {},
    renderCalendar: () => {},
    renderAll: () => {}
  };

  global.window = mockWindow;

  const result = await components.handle팀목표_Item68Action(null, { testMode: true });

  assert.strictEqual(vibrateMs, 12, '12ms 햅틱 반응 트리거 확인');
  assert.strictEqual(cacheKey, 'og_task-68_cache', 'og_task-68_cache 캐시 키 저장 확인');
  const parsedCache = JSON.parse(cacheVal);
  assert.strictEqual(parsedCache.ticket, '68', '캐시 내 ticket 68 확인');
  assert.strictEqual(parsedCache.task_id, 'TASK-ES-319', '캐시 내 task_id 확인');
  assert.strictEqual(parsedCache.team_constraints_removed, true, 'team_constraints_removed 참 확인');
  assert.strictEqual(parsedCache.max_members_unlimited, true, 'max_members_unlimited 참 확인');
  assert.strictEqual(goalsRendered, true, '목표 탭 전파 확인');
  assert.strictEqual(commRendered, true, '소통 탭 전파 확인');
  assert.strictEqual(homeRendered, true, '홈 탭 전파 확인');
  assert.strictEqual(mockWindow.state.profile.settings.teamCreationConstraintsClean, true, '프로필 설정 영속화 확인');

  console.log('  ✅ 4. handle팀목표_Item68Action 12ms 햅틱/캐시/4대뷰 전파 검증 통과');
  console.log('🎉 [TASK-ES-319] 팀 만들기 불필요 제약 전면 삭제 단위 테스트 ALL PASS!');
})().catch(err => {
  console.error('❌ 단위 테스트 실패:', err);
  throw err;
});
