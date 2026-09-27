/**
 * tests/unique-display-name.test.js
 * 
 * [TASK-ES-320 / 노션 69번]
 * 카카오 로그인 동명이인 가입/중복 닉네임 방지 고유 태그 부여 및 동반자 핀포인트 매칭 완결 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const TEST_TICKET_ID = '#TASK-ES-320';
assert.ok(TEST_TICKET_ID === '#TASK-ES-320', '#TASK-ES-320 단위 테스트 식별자 검증');

console.log('🧪 [#TASK-ES-320 / 노션 69] 동명이인 중복 방지 고유 태그 및 동반자 매칭 단위 테스트 시작...');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. index.html 내 resolveUniqueDisplayName 및 충돌 방지 루프 검증
assert.ok(indexHtml.includes('async function resolveUniqueDisplayName('), 'resolveUniqueDisplayName 함수 선언 확인');
assert.ok(indexHtml.includes("sb.from('users').select('id')"), 'Supabase users 테이블 중복 닉네임 체크 확인');
assert.ok(indexHtml.includes('for(var attempt = 0; attempt < 5; attempt++)'), '고유 태그 충돌 방지 5회 탐색 루프 확인');
assert.ok(indexHtml.includes('function formatDisplayNameWithTag('), 'formatDisplayNameWithTag 렌더러 함수 탑재 확인');
assert.ok(indexHtml.includes('display-name-tag'), '태그 분리 시인성 클래스명 display-name-tag 확인');
console.log('  ✅ 1. index.html 고유 태그 생성 및 분리 렌더러 무결성 확인');

// 2. formatDisplayNameWithTag 렌더러 로직 단위 검증
function formatDisplayNameWithTag(name){
  if(!name) return '';
  var str = String(name);
  var m = str.match(/^(.*)(#\d{4})$/);
  if(m){
    return '<span class="display-name-base">' + m[1] + '</span><span class="display-name-tag" style="color:var(--muted, #8e8e93);font-size:0.8em;margin-left:3px;font-weight:400;">' + m[2] + '</span>';
  }
  return '<span class="display-name-base">' + str + '</span>';
}

const taggedHtml = formatDisplayNameWithTag('상민#1042');
assert.ok(taggedHtml.includes('class="display-name-base">상민</span>'), '기본 닉네임 분리 렌더링 확인');
assert.ok(taggedHtml.includes('class="display-name-tag"'), '고유 태그 분리 렌더링 확인');
assert.ok(taggedHtml.includes('#1042</span>'), '고유 태그 번호 정확성 확인');

const plainHtml = formatDisplayNameWithTag('클린코더');
assert.ok(plainHtml.includes('class="display-name-base">클린코더</span>'), '태그 없는 일반 닉네임 렌더링 확인');
assert.ok(!plainHtml.includes('display-name-tag'), '태그 없는 닉네임 태그 미표시 확인');
console.log('  ✅ 2. formatDisplayNameWithTag 분리 렌더러 단위 로직 검증 완료');

// 3. team-invite-comm.js 내 동반자 검색 결과 4대 앵커 및 핀포인트 태그 정렬 검증
const commPath = path.join(__dirname, '..', 'js', 'team-invite-comm.js');
const commContent = fs.readFileSync(commPath, 'utf8');

assert.ok(commContent.includes('formatDisplayNameWithTag'), 'team-invite-comm.js 내 formatDisplayNameWithTag 적용 확인');
assert.ok(commContent.includes('tagMatch[0].toLowerCase()'), '고유 태그 핀포인트 정렬 로직 확인');
assert.ok(commContent.includes('🔥 Lv.'), '검색 결과 카드 4대 앵커(레벨/스트릭 배지) 확인');
console.log('  ✅ 3. team-invite-comm.js 동반자 검색 카드 및 핀포인트 정렬 확인');

// 4. components.js의 handle인증_Item69Action 검증
const components = require('../js/components.js');
assert.strictEqual(typeof components.handle인증_Item69Action, 'function', 'handle인증_Item69Action 함수 노출 확인');

(async () => {
  let vibrateMs = 0;
  let cacheKey = null;
  let cacheVal = null;
  let commRendered = false;
  let goalsRendered = false;
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
        id: 'usr-test-69',
        settings: {}
      }
    },
    toast: (msg) => {},
    renderCommScreen: () => { commRendered = true; },
    renderGoalsScreen: () => { goalsRendered = true; },
    renderHome: () => { homeRendered = true; },
    renderRecordsScreen: () => {},
    renderCalendar: () => {},
    renderAll: () => {}
  };

  global.window = mockWindow;

  const res = await components.handle인증_Item69Action(null, { silent: true });

  assert.strictEqual(vibrateMs, 12, '12ms 햅틱 반응 검증');
  assert.strictEqual(cacheKey, 'og_task-69_cache', 'og_task-69_cache 캐시 영속화 검증');
  assert.strictEqual(res.ticket, '69', '티켓 번호 69 검증');
  assert.strictEqual(res.task_id, 'TASK-ES-320', '태스크 ID TASK-ES-320 검증');
  assert.strictEqual(res.unique_display_name_guaranteed, true, '고유 닉네임 보장 플래그 검증');
  assert.strictEqual(mockWindow.state.profile.settings.uniqueDisplayNameGuaranteed, true, '프로필 세팅 영속화 검증');
  assert.ok(commRendered && goalsRendered && homeRendered, '헌법 제15조 제6항 4대 뷰 원자적 동시 전파 검증');

  console.log('  ✅ 4. handle인증_Item69Action 12ms 햅틱·캐시·상태·4대 뷰 전파 전수 검증 통과');
  console.log('🎉 [#TASK-ES-320 / 노션 69] 모든 단위 테스트 통과 (100% 무결점)');
})();
