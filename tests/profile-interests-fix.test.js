/**
 * tests/profile-interests-fix.test.js
 * #TASK-ES-325: [74] 프로필 편집 관심 카테고리(Interests) 선택 및 저장 작동 안함 오류 수정 및 아워골 본질 기반 UX 혁신 단위 테스트
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- [TASK-ES-325] 프로필 편집 관심 카테고리 수정 및 UX 혁신 단위 테스트 시작 ---');

  // 1. 소스 파일 정적 분석 검증
  const uiCss = fs.readFileSync(path.join(__dirname, '..', 'ui.css'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components.js'), 'utf8');

  // 1.1 ui.css 규격 검증
  assert.ok(uiCss.includes('.cat-sub-grid{display:flex;flex-wrap:wrap;gap:8px 6px;margin-bottom:14px;}'), 'ui.css 내 .cat-sub-grid 정식 정의 확인');
  assert.ok(uiCss.includes('.cat-sub{background:var(--surface-2);border-color:transparent;min-height:44px;'), 'ui.css 내 .cat-sub 최소 높이 44px 헌법 규격 준수 확인');
  assert.ok(uiCss.includes('.pv-selected-tray{'), 'ui.css 내 상단 선택 요약 트레이 .pv-selected-tray 정의 확인');
  assert.ok(uiCss.includes('.pv-selected-chip{'), 'ui.css 내 .pv-selected-chip 뱃지 정의 확인');
  assert.ok(uiCss.includes('.pv-major-anchor-bar{'), 'ui.css 내 6대 대분류 퀵 앵커 네비게이션 .pv-major-anchor-bar 정의 확인');
  assert.ok(uiCss.includes('.pv-smart-sync-card{'), 'ui.css 내 목표 기반 스마트 연동 카드 .pv-smart-sync-card 정의 확인');

  // 1.2 index.html 마크업 및 비즈니스 로직 검증
  assert.ok(indexHtml.includes('id="pvSmartGoalSyncContainer"'), 'index.html 내 목표 기반 1초 추천 컨테이너 탑재 확인');
  assert.ok(indexHtml.includes('id="pvSelectedTray"'), 'index.html 내 선택 요약 트레이 탑재 확인');
  assert.ok(indexHtml.includes('id="pvMajorAnchorBar"'), 'index.html 내 6대 대분류 앵커 바 탑재 확인');
  assert.ok(indexHtml.includes('id="pvValuePreview"'), 'index.html 내 선택의 가치 실시간 피드백 프리뷰 탑재 확인');
  assert.ok(indexHtml.includes('function updateSelectedTray()'), 'index.html 내 updateSelectedTray 함수 정의 확인');
  assert.ok(indexHtml.includes('function syncInterestsDraftToProfile()'), 'index.html 내 Zero Data Loss 즉시 동기화 함수 정의 확인');

  // 1.3 loadProfile 및 영속성 검증 (0개 빈 배열 보존 및 캐시 좀비 부활 차단)
  assert.ok(indexHtml.includes('var finalInterests = Array.isArray(urow.interests) ? urow.interests : ((localCachedProf && Array.isArray(localCachedProf.interests)) ? localCachedProf.interests : []);'), 'loadProfile 내 Array.isArray 정밀 검사로 0개 빈 배열 보존 확인');
  assert.ok(indexHtml.includes('if(!Array.isArray(finalInterests) && sData.user.interests) finalInterests = sData.user.interests;'), '세션 동기화 시 Array.isArray 기반 보존 확인');
  assert.ok(indexHtml.includes('if(!Array.isArray(state.profile.interests) && u.interests && u.interests.length){'), '로그인 프로필 동기화 시 Array.isArray 기반 보존 확인');

  // 1.4 js/components.js 내 직통 핸들러 배선 확인
  assert.ok(componentsJs.includes('async function handle프로필_Item74Action(event, customPayload)'), 'js/components.js 내 handle프로필_Item74Action 선언 확인');
  assert.ok(componentsJs.includes('OurgoalComponents.handle프로필_Item74Action = handle프로필_Item74Action;'), 'OurgoalComponents 노출 확인');
  assert.ok(componentsJs.includes('window.handle프로필_Item74Action = handle프로필_Item74Action;'), 'window 전역 노출 확인');
  assert.ok(componentsJs.includes('module.exports.handle프로필_Item74Action = handle프로필_Item74Action;'), 'module.exports 노출 확인');

  // 2. 가상 환경 모의 동작 검증 (Virtual Environment Simulation)
  const storage = {};
  let hapticDuration = 0;
  let viewRefreshes = { profileCard: 0, settings: 0, home: 0, goals: 0, comm: 0, all: 0 };

  const winMock = {
    navigator: {
      vibrate: function(ms) {
        hapticDuration = ms;
        return true;
      }
    },
    localStorage: {
      setItem: function(k, v) { storage[k] = v; },
      getItem: function(k) { return storage[k] || null; }
    },
    state: {
      profile: {
        id: 'usr_test_74',
        displayName: '상민',
        bio: '아워골로 매일 성장하는 중',
        avatarUrl: 'av_fox',
        interests: ['health/러닝·마라톤'],
        region: '서울 강남구',
        regionPublic: true,
        itItems: []
      }
    },
    renderProfileCard: function() { viewRefreshes.profileCard++; },
    renderSettingsScreen: function() { viewRefreshes.settings++; },
    renderHome: function() { viewRefreshes.home++; },
    renderGoalsScreen: function() { viewRefreshes.goals++; },
    renderCommScreen: function() { viewRefreshes.comm++; },
    renderAll: function() { viewRefreshes.all++; },
    toast: function(msg) {}
  };

  const componentsModule = require('../js/components.js');
  assert.strictEqual(typeof componentsModule.handle프로필_Item74Action, 'function', '컴포넌트 모듈 핸들러 함수 확인');

  // 2.1 핸들러 실행: 새 관심사 배열 주입 및 영속화 테스트
  const testPayload = {
    ticket: '74',
    interests: ['health/러닝·마라톤', 'study/독서', 'career/재테크·투자'],
    silent: true
  };

  const result = await componentsModule.handle프로필_Item74Action.call(winMock, null, testPayload);
  assert.strictEqual(result.task_id, 'TASK-ES-325', 'task_id 반환 일치 확인');
  assert.strictEqual(result.touch_target_44px_enforced, true, '44px 터치타겟 적용 플래그 확인');
  assert.strictEqual(result.interests_in_place_toggle_wired, true, '인-플레이스 토글 플래그 확인');

  // 2.2 로컬 캐시 및 프로필 상태 갱신 검증
  const cachedJson = storage['og_task-74_cache'];
  assert.ok(cachedJson, 'og_task-74_cache 영속화 확인');
  const parsedCache = JSON.parse(cachedJson);
  assert.strictEqual(parsedCache.state, 'completed');

  const profileBackup = JSON.parse(storage['ourgoal_profile_backup_usr_test_74']);
  assert.deepStrictEqual(profileBackup.interests, ['health/러닝·마라톤', 'study/독서', 'career/재테크·투자'], '프로필 백업 스토리지 내 관심사 동기화 확인');

  // 2.3 0개 빈 배열([]) 해제 저장 시 캐시 좀비 부활 방지 시뮬레이션
  const emptyPayload = {
    interests: [],
    silent: true
  };
  await componentsModule.handle프로필_Item74Action.call(winMock, null, emptyPayload);
  const emptyBackup = JSON.parse(storage['ourgoal_profile_backup_usr_test_74']);
  assert.deepStrictEqual(emptyBackup.interests, [], '0개 빈 배열 정상 영속화 및 보존 확인');

  // 2.4 4대 뷰 동시 전파 확인
  assert.ok(viewRefreshes.profileCard > 0, 'renderProfileCard 전파 확인');
  assert.ok(viewRefreshes.settings > 0, 'renderSettingsScreen 전파 확인');
  assert.ok(viewRefreshes.home > 0, 'renderHome 전파 확인');
  assert.ok(viewRefreshes.goals > 0, 'renderGoalsScreen 전파 확인');
  assert.ok(viewRefreshes.comm > 0, 'renderCommScreen 전파 확인');
  assert.ok(viewRefreshes.all > 0, 'renderAll 전파 확인');

  console.log('✅ [TASK-ES-325] 단위 테스트 전수 통과 완료 (PASS)!');
}

runTests().catch(function(err){
  console.error('❌ [TASK-ES-325] 단위 테스트 실패:', err);
  throw err;
});
