/**
 * tests/account-email-status.test.js
 * [TASK-ES-323 / 노션 생각메모장 72번]
 * 설정 > 계정 및 보안 로그인 상태 시 이메일 게스트모드 오표기 오류 수정 및 단일 정본 연동 검증
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SUITE_ID = '#TASK-ES-323';
console.log('[TEST] Starting account-email-status.test.js for ' + SUITE_ID + '...');
assert.ok(SUITE_ID.includes('#TASK-ES-323'), '#TASK-ES-323 테스트 스위트 식별자');

const htmlPath = path.join(__dirname, '..', 'index.html');
const compPath = path.join(__dirname, '..', 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const compCode = fs.readFileSync(compPath, 'utf8');

// 1. 소스 정적 구조 및 배선 단언 (HTML & components.js)
{
  console.log('[TEST] 1. Static code structure verification');

  // getAccountStatusInfo 정의 및 전역 노출
  assert.ok(html.includes('function getAccountStatusInfo('), 'getAccountStatusInfo 함수 정의 확인');
  assert.ok(html.includes('window.getAccountStatusInfo = getAccountStatusInfo;'), 'window.getAccountStatusInfo 전역 노출 확인');

  // state.user 동기화 배선 확인
  assert.ok(html.includes('state.user = session.user;'), '세션 복원 시 state.user 바인딩 확인');
  assert.ok(html.includes('state.user = res.data.user;'), '로그인/회원가입 시 state.user 바인딩 확인');
  assert.ok(html.includes('state.user = null;'), '로그아웃 시 state.user 초기화 확인');

  // loadProfile 내 email, provider 정규화 반환 확인
  assert.ok(html.includes('email: profEmail'), 'loadProfile 반환 객체에 email 정규화 주입 확인');
  assert.ok(html.includes('provider: profProvider'), 'loadProfile 반환 객체에 provider 정규화 주입 확인');

  // renderSettingsScreen 및 renderSettingsHeroCard 내 getAccountStatusInfo 호출 확인
  assert.ok(html.includes('var accInfo = getAccountStatusInfo(p, u);'), 'renderSettingsScreen 내 getAccountStatusInfo 호출 확인');
  assert.ok(html.includes('emailEl.textContent = accInfo.displayEmail;'), 'emailEl에 정본 displayEmail 할당 확인');
  assert.ok(html.includes('chgPassBtn.textContent = accInfo.passwordButtonText;'), 'chgPassBtn에 정본 passwordButtonText 할당 확인');

  // components.js 내 handle인증_Item72Action 정의 및 노출 확인
  assert.ok(compCode.includes('function handle인증_Item72Action('), 'handle인증_Item72Action 함수 정의 확인');
  assert.ok(compCode.includes('OurgoalComponents.handle인증_Item72Action = handle인증_Item72Action;'), 'OurgoalComponents에 바인딩 확인');
  assert.ok(compCode.includes('window.handle인증_Item72Action = handle인증_Item72Action;'), 'window에 바인딩 확인');
  assert.ok(compCode.includes('module.exports.handle인증_Item72Action = handle인증_Item72Action;'), 'module.exports에 바인딩 확인');
  assert.ok(compCode.includes('nav.vibrate(12);'), '12ms 햅틱 피드백 확인');
  assert.ok(compCode.includes("'og_task-72_cache'"), '로컬 캐시 키 확인');
}

// 2. getAccountStatusInfo 함수 로직 추출 및 5대 시나리오 단위 검증
{
  console.log('[TEST] 2. getAccountStatusInfo 5 scenarios verification');

  // HTML 내의 getAccountStatusInfo 함수 블록을 안전하게 파싱하여 평가
  const match = html.match(/function getAccountStatusInfo\([\s\S]*?return\s*\{[\s\S]*?\};\s*\}/);
  assert.ok(match, 'getAccountStatusInfo 함수 본문 추출 성공');

  const evalFn = new Function(`
    ${match[0]}
    return getAccountStatusInfo;
  `);
  const getAccountStatusInfo = evalFn();

  // 시나리오 1: 카카오 소셜 로그인 유저
  {
    const kakaoProfile = { id: 'k1234', email: 'kakao_user@kakao.com', provider: 'kakao' };
    const kakaoUser = { email: 'kakao_user@kakao.com', app_metadata: { provider: 'kakao' } };
    const res = getAccountStatusInfo(kakaoProfile, kakaoUser);

    assert.strictEqual(res.isGuest, false, '카카오 유저는 게스트가 아님');
    assert.strictEqual(res.isSocial, true, '카카오 유저는 소셜 로그인임');
    assert.strictEqual(res.provider, 'kakao', '프로바이더는 kakao');
    assert.strictEqual(res.displayEmail, 'kakao_user@kakao.com', '표시 이메일 일치');
    assert.strictEqual(res.badgeText, '카카오 연동', '히어로 뱃지 텍스트 일치');
    assert.strictEqual(res.passwordButtonText, '비밀번호 등록/설정 (소셜 연동)', '소셜 유저는 비밀번호 등록/설정 버튼');
  }

  // 시나리오 2: 구글 소셜 로그인 유저
  {
    const googleProfile = { id: 'g5678', email: 'google_user@gmail.com', provider: 'google' };
    const googleUser = { email: 'google_user@gmail.com', app_metadata: { provider: 'google' } };
    const res = getAccountStatusInfo(googleProfile, googleUser);

    assert.strictEqual(res.isGuest, false, '구글 유저는 게스트가 아님');
    assert.strictEqual(res.isSocial, true, '구글 유저는 소셜 로그인임');
    assert.strictEqual(res.provider, 'google', '프로바이더는 google');
    assert.strictEqual(res.displayEmail, 'google_user@gmail.com', '표시 이메일 일치');
    assert.strictEqual(res.badgeText, '구글 연동', '히어로 뱃지 텍스트 일치');
    assert.strictEqual(res.passwordButtonText, '비밀번호 등록/설정 (소셜 연동)', '소셜 유저는 비밀번호 등록/설정 버튼');
  }

  // 시나리오 3: 일반 이메일 가입 유저
  {
    const emailProfile = { id: 'user_norm', email: 'member@ourgoal.app', provider: 'email' };
    const emailUser = { email: 'member@ourgoal.app', app_metadata: { provider: 'email' } };
    const res = getAccountStatusInfo(emailProfile, emailUser);

    assert.strictEqual(res.isGuest, false, '일반 회원은 게스트가 아님');
    assert.strictEqual(res.isSocial, false, '일반 회원은 소셜 로그인이 아님');
    assert.strictEqual(res.provider, 'email', '프로바이더는 email');
    assert.strictEqual(res.displayEmail, 'member@ourgoal.app', '표시 이메일 일치');
    assert.strictEqual(res.badgeText, '이메일 회원', '히어로 뱃지 텍스트 일치');
    assert.strictEqual(res.passwordButtonText, '비밀번호 변경', '일반 회원은 비밀번호 변경 버튼');
  }

  // 시나리오 4: UUID 형태의 식별자를 가졌으나 state.user에 이메일이 있는 경우 (로그인 상태)
  {
    const uuidProfile = { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };
    const authUser = { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', email: 'authenticated@domain.com' };
    const res = getAccountStatusInfo(uuidProfile, authUser);

    assert.strictEqual(res.isGuest, false, '인증 세션이 있는 유저는 게스트가 아님');
    assert.strictEqual(res.displayEmail, 'authenticated@domain.com', 'state.user의 이메일이 정확히 표시됨');
    assert.strictEqual(res.passwordButtonText, '비밀번호 변경', '로그인 회원은 비밀번호 변경 버튼');
  }

  // 시나리오 5: 순수 게스트 모드 유저 (세션 없음, guest_ 로 시작하는 ID)
  {
    const guestProfile = { id: 'guest_1727400000000_abc', isGuest: true };
    const nullUser = null;
    const res = getAccountStatusInfo(guestProfile, nullUser);

    assert.strictEqual(res.isGuest, true, '순수 게스트로 정상 판별');
    assert.strictEqual(res.provider, 'guest', '프로바이더는 guest');
    assert.strictEqual(res.displayEmail, '게스트 체험 모드 (로컬 안전 보관)', '게스트 안내 문구 표시');
    assert.strictEqual(res.badgeText, '게스트 모드', '게스트 뱃지 표시');
    assert.strictEqual(res.passwordButtonText, '🔒 간편 회원가입 / 계정 연동', '게스트는 계정 연동 버튼 표시');
  }
}

// 3. OurgoalComponents.handle인증_Item72Action 기능 동작 및 4대 뷰 원자적 전파 검증
{
  console.log('[TEST] 3. handle인증_Item72Action execution and view propagation');

  const components = require(compPath);
  assert.strictEqual(typeof components.handle인증_Item72Action, 'function', 'handle인증_Item72Action 함수 존재 확인');

  // Mock 환경 설정
  let hapticVibrated = 0;
  let cachedPayload = null;
  let supabaseInserted = null;
  let viewsRefreshed = {
    settings: 0,
    home: 0,
    goals: 0,
    comm: 0,
    calendar: 0,
    all: 0
  };

  const mockWindow = {
    navigator: {
      vibrate: (ms) => { hapticVibrated = ms; }
    },
    localStorage: {
      setItem: (k, v) => { if (k === 'og_task-72_cache') cachedPayload = JSON.parse(v); },
      getItem: (k) => null
    },
    sb: {
      from: (table) => ({
        insert: (data) => {
          supabaseInserted = { table, data };
          return Promise.resolve({ data: null, error: null });
        }
      })
    },
    state: {
      user: null,
      profile: { id: 'user_test_72', email: 'initial@test.com' }
    },
    renderSettingsScreen: () => { viewsRefreshed.settings++; },
    renderHome: () => { viewsRefreshed.home++; },
    renderGoalsScreen: () => { viewsRefreshed.goals++; },
    renderCommScreen: () => { viewsRefreshed.comm++; },
    renderCalendar: () => { viewsRefreshed.calendar++; },
    renderAll: () => { viewsRefreshed.all++; },
    toast: (msg) => {}
  };

  // Node 전역 window에 바인딩
  global.window = mockWindow;

  (async () => {
    const payload = await components.handle인증_Item72Action(null, {
      silent: true,
      user: { id: 'u72', email: 'verified72@ourgoal.app' },
      profile: { email: 'verified72@ourgoal.app', provider: 'email' }
    });

    assert.ok(payload, '핸들러 반환 객체 확인');
    assert.strictEqual(hapticVibrated, 12, '12ms 햅틱 진동 발생 확인');
    assert.ok(cachedPayload, '로컬 스토리지 캐시 저장 확인');
    assert.strictEqual(cachedPayload.task_id, 'TASK-ES-323', '캐시 내 task_id 일치');
    assert.strictEqual(cachedPayload.account_email_display_fixed, true, '캐시 플래그 확인');
    assert.strictEqual(mockWindow.state.user.email, 'verified72@ourgoal.app', 'state.user 동기화 확인');
    assert.strictEqual(mockWindow.state.profile.email, 'verified72@ourgoal.app', 'state.profile 동기화 확인');

    // 4대 뷰 원자적 전파 검증
    assert.strictEqual(viewsRefreshed.settings, 1, '설정 화면 갱신 호출됨');
    assert.strictEqual(viewsRefreshed.home, 1, '홈 화면 갱신 호출됨');
    assert.strictEqual(viewsRefreshed.goals, 1, '목표 화면 갱신 호출됨');
    assert.strictEqual(viewsRefreshed.comm, 1, '소통 화면 갱신 호출됨');
    assert.strictEqual(viewsRefreshed.calendar, 1, '일정 화면 갱신 호출됨');
    assert.strictEqual(viewsRefreshed.all, 1, '전체 화면 갱신 호출됨');

    console.log('[TEST] PASS: All tests in account-email-status.test.js passed successfully!');
  })().catch(err => {
    console.error('[TEST] FAIL:', err);
    throw err;
  });
}
