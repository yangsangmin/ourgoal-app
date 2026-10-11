/**
 * OurGoal Boot Entry Wiring (앱 시동 — 첫 화면 · 로그인 · 계정 · 안내 단추 연결과 탭 이동 준비)
 *
 * 앱이 뜰 때 첫 화면과 계정 둘레의 단추를 원래 순서 그대로 연결하는 구역 함수다.
 * bootEntryAndAccountWiring — 인앱 브라우저 확인, 첫 화면의 둘러보기·로그인 단추, 소셜 로그인, 가입·로그인·비밀번호 찾기, 다시 동기화·로그아웃·초기화·탈퇴, 활용 가이드·문의·약관 링크, 다시 켜졌을 때 동기화와 오프라인 알림, 아래 탭 단추와 창 뒤로가기, 일정 알림 시작을 차례로 건다.
 * bootGoogleTokenState — 구글 캘린더 연결용 값 자리를 만든다.
 * #TASK-ES-650(구역 이전 — 앱이 뜰 때 한 번 도는 문을 순서 그대로 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 2782~2945 · 2950~2952줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 구역 안에서만 쓰던 var 는 그 함수의 지역 변수가 됐다.
 * 로드 중 바로 돌던 문들은 순서 그대로 함수 하나로 감싸 index.html 원래 자리에서 부른다. index.html 은 IIFE 머리에서 그 함수를 같은 이름으로 가져온다.
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 2782~2945줄(#TASK-ES-650 생성기 표지) ---- */
  function bootEntryAndAccountWiring() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ [#TASK-UIUX-PHASE3-HOME-COCKPIT] 홈 1초 조망 ↔ 무저항 체크인 콕핏 8대 과업 ============ */
  window._homeDateOffset = 0;
  /* [#TASK-ES-471] switchHomeDate → js/core/home-cockpit.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */
  /* [#TASK-ES-471] initDimensionSliders → js/core/home-cockpit.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */
  /* [#TASK-ES-471] initHomeCockpit → js/core/home-cockpit.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */
  /* [#TASK-ES-471] renderQuickCheckinGuideChips · saveProfile → js/core/home-cockpit.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */

  /* [#TASK-ES-522] syncServerRecords → js/core/server-records-sync.js 로 옮김(인라인 3단계 Z1 로그인·계정 2차 — 앞 주석 포함) */

  /* ============ Landing ============ */
  /* ============ [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android Chrome 자동 탈출 & iOS Safari 플로팅 가이드 배너 ============ */
  /* [#TASK-ES-476] escapeKakaoInAppBrowser · checkKakaoInAppBrowser → js/tabs/settings/inapp-landing.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  L.checkKakaoInAppBrowser();

  window.OurgoalAppState.define('landNickQuickLink', document.getElementById('landNickQuickLink'));
  L.bindLandNickQuickLink(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/inapp-landing.js 의 bindLandNickQuickLink 로 옮김 — 원래 자리에서 부른다 */
  L.bindLandLoginLink(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/inapp-landing.js 의 bindLandLoginLink 로 옮김 — 원래 자리에서 부른다 */
  window.OurgoalAppState.define('landGuestBtn', document.getElementById('landGuestBtn'));
  L.bindLandGuestBtn(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/inapp-landing.js 의 bindLandGuestBtn 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 2계정 상호작용 테스트 (테스터 B 직통 입장: #TASK-ES-169) ============ */
  /* [#TASK-ES-521] enterAsTesterB → js/tabs/settings/tester-entry.js 로 옮김(인라인 3단계 Z1 로그인·계정 1차 — 앞 주석 포함) */
  window.OurgoalAppState.define('landTesterBBtn', document.getElementById('landTesterBBtn'));
  L.bindLandTesterBButton(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/tabs/settings/tester-entry.js 의 bindLandTesterBButton 로 옮김 — 원래 자리에서 부른다 */
  window.OurgoalAppState.define('authTesterBBtn', document.getElementById('authTesterBBtn'));
  L.bindAuthTesterBButton(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/tabs/settings/tester-entry.js 의 bindAuthTesterBButton 로 옮김 — 원래 자리에서 부른다 */

  L.startDevDebugButtons(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/tabs/settings/boot-wiring.js 의 startDevDebugButtons 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) ============ */
  /* [#TASK-ES-591] sha256Hex · parseJwtPayload · handleGoogleUserSuccess → js/auth-social.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  window.OurgoalAppState.defineVar('_googleTokenClient', null);
  /* [#TASK-ES-591] getGoogleTokenClient · startGoogleLogin → js/auth-social.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  window.OurgoalAppState.defineVar('_googleOneTapNonce', null);
  /* [#TASK-ES-591] initGoogleOneTap · startOAuthLogin → js/auth-social.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  L.bindKakaoLoginClicks(); /* [#TASK-ES-591] 로드 중 문(앞 주석 포함) → js/auth-social.js 의 bindKakaoLoginClicks 로 옮김 — 원래 자리에서 부른다 */
  L.bindGoogleLoginClicks(); /* [#TASK-ES-591] 로드 중 문(앞 주석 포함) → js/auth-social.js 의 bindGoogleLoginClicks 로 옮김 — 원래 자리에서 부른다 */

  /* ============ [#TASK-ES-224] [생각 메모장 94번] 게스트(둘러보기) 3회 기록 시 안전 백업 넛지 및 카카오 무손실 계정 통합 ============ */
  /* [#TASK-ES-437] openGuestBackupNudgeModal · checkGuestBackupNudge → js/tabs/settings/guest-backup-nudge.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ [#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시 게스트 데이터 100% 무손실 비파괴 합집합(Union Merge) 이관 ============ */
  /* [#TASK-ES-442] migrateGuestDataToUser → js/tabs/settings/guest-migration.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ Goal category templates ============ */
  /* [#TASK-ES-562] GOAL_TEMPLATES · ONBOARDING_PRESETS · QUICK_ACTIONS_BY_CAT → js/tabs/goals/goal-category-templates.js 로 옮김(인라인 3단계 구역 Z5 표준 1 — 앞 주석 포함) */

  window.OurgoalAppState.define('authTabButtons', document.querySelectorAll('.auth-tab'));
  L.bindAuthTabButtons(); /* [#TASK-ES-562] 로드 중 문(앞 주석 포함) → js/tabs/settings/auth-screen-actions.js 의 bindAuthTabButtons 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-513] getDeviceId · getDeviceLoginTime · setDeviceLoginTime · performLogout · checkRemoteSessionRevoked → js/tabs/settings/device-session.js 로 옮김(인라인 3단계 시범 — 게스트로 못 재는 묶음(실계정 하네스) — 앞 주석 포함) */
  L.bindSignupSubmit(); /* [#TASK-ES-513] 로드 중 문(앞 주석 포함) → js/tabs/settings/device-session.js 의 bindSignupSubmit 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-437] showLastAuthBadge · initRememberedAuthFields → js/tabs/settings/account-entry.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ P0: 비밀번호 찾기 (이메일 재설정 링크 발송) ============ */
  /* [#TASK-ES-562] openForgotPasswordModal → js/tabs/settings/auth-screen-actions.js 로 옮김(인라인 3단계 구역 Z5 표준 1 — 앞 주석 포함) */

  var fpBtn = document.getElementById('forgotPassBtn');
  if(fpBtn) fpBtn.addEventListener('click', L.openForgotPasswordModal);

  /* [#TASK-ES-521] openNewPasswordModal → js/tabs/settings/account-actions.js 로 옮김(인라인 3단계 Z1 로그인·계정 1차 — 앞 주석 포함) */

  /* [#TASK-ES-437] openChangePasswordModal → js/tabs/settings/account-entry.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 ============ */
  L.bindLoginSubmit(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/tabs/settings/account-actions.js 의 bindLoginSubmit 로 옮김 — 원래 자리에서 부른다 */

  window.OurgoalAppState.define('resyncBtn', document.getElementById('resyncAccountDataBtn'));
  L.bindResyncAccountDataButton(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/tabs/settings/account-actions.js 의 bindResyncAccountDataButton 로 옮김 — 원래 자리에서 부른다 */
  L.bindLogoutButton(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/tabs/settings/account-actions.js 의 bindLogoutButton 로 옮김 — 원래 자리에서 부른다 */
  L.bindResetButton(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/tabs/settings/account-actions.js 의 bindResetButton 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 회원 탈퇴 전용 안내 모달 및 법적책임·데이터분실 사전 안내 (#TASK-ES-158) ============ */
  /* [#TASK-ES-522] closeWithdrawModal · submitWithdrawAccount · openWithdrawModal · withdrawAccount → js/tabs/settings/withdraw-modal.js 로 옮김(인라인 3단계 Z1 로그인·계정 2차 — 앞 주석 포함) */
  document.getElementById('withdrawBtn').addEventListener('click', L.openWithdrawModal);

  /* ============ [#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법 및 실제 우수 사용사례 쇼케이스 (최신 기능 전면 동기화) ============ */
  /* [#TASK-ES-442] TAB_GUIDE_DATA · renderTabGuideContent · openTabGuideHubModal → js/tabs/settings/tab-guide.js 로 옮김(인라인 스크립트 세포화 P0) */

  window.OurgoalAppState.define('tabGuideBtn', document.getElementById('btnTabGuideHub'));
  L.bindTabGuideHubButton(); /* [#TASK-ES-562] 로드 중 문(앞 주석 포함) → js/tabs/settings/guide-buttons.js 의 bindTabGuideHubButton 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 앱 활용 가이드 다시보기 ============ */
  window.OurgoalAppState.define('guideBtn', document.getElementById('btnRestartGuide'));
  L.bindRestartGuideButton(); /* [#TASK-ES-562] 로드 중 문(앞 주석 포함) → js/tabs/settings/guide-buttons.js 의 bindRestartGuideButton 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 1:1 고객 문의 / 버그 제보 (#TASK-ES-178) ============ */
  L.bindInquiryButtons(); /* [#TASK-ES-562] 로드 중 문(앞 주석 포함) → js/tabs/settings/support-inquiry-bind.js 의 bindInquiryButtons 로 옮김 — 원래 자리에서 부른다 */
  window.OurgoalAppState.define('footEmailEl', document.getElementById('footSupportEmailLink'));
  L.bindSupportEmailLink(); /* [#TASK-ES-562] 로드 중 문(앞 주석 포함) → js/tabs/settings/support-inquiry-bind.js 의 bindSupportEmailLink 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 이용약관 / 개인정보처리방침 열람 리스너 ============ */
  L.bindTermsLinks(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/tabs/settings/boot-wiring.js 의 bindTermsLinks 로 옮김 — 원래 자리에서 부른다 */
  L.bindPrivacyLinks(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/tabs/settings/boot-wiring.js 의 bindPrivacyLinks 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-548] enterApp → js/core/app-enter.js 로 옮김(인라인 3단계 구역 Z5 표준 2 — 앞 주석 포함) */
  L.bindFocusResync(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/core/app-enter.js 의 bindFocusResync 로 옮김 — 원래 자리에서 부른다 */
  L.bindVisibilityResync(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/core/app-enter.js 의 bindVisibilityResync 로 옮김 — 원래 자리에서 부른다 */
  L.bindRemoteLogoutStorageListener(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/core/app-enter.js 의 bindRemoteLogoutStorageListener 로 옮김 — 원래 자리에서 부른다 */
  L.startRemoteSessionPoll(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/core/app-enter.js 의 startRemoteSessionPoll 로 옮김 — 원래 자리에서 부른다 */
  L.bindOnlineSync(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/core/app-enter.js 의 bindOnlineSync 로 옮김 — 원래 자리에서 부른다 */
  L.bindOfflineNotice(); /* [#TASK-ES-548] 로드 중 문(앞 주석 포함) → js/core/app-enter.js 의 bindOfflineNotice 로 옮김 — 원래 자리에서 부른다 */

  /* [#TASK-ES-437] checkStreakFreeze → js/tabs/records/checkin-helpers.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ Onboarding (first-time, after signup) — 16종 동물 아바타 & 직관적 안착 융합 ============ */
  /* [#TASK-ES-442] ONBOARDING_AVATARS · startOnboarding → js/tabs/settings/onboarding.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 ============ */
  /* [#TASK-ES-476] renderFirstCheckinTutorialBanner · peerCategoryKey · getPeerRunnersForCategory → js/tabs/records/first-checkin-tutorial.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-476] canSendFirstCheckinWelcome · firstCheckinWelcomeSentToday · sendFirstCheckinWelcomeStamps → js/tabs/records/first-checkin-tutorial.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-476] triggerFirstCheckinCelebrationModal → js/tabs/records/first-checkin-tutorial.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /* [#TASK-ES-437] showCommTourModal → js/tabs/settings/comm-tour.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* ============ 최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합 ============ */
  /* [#TASK-ES-523] maybeShowFirstLoginGuide · startFirstLoginGuide → js/tabs/settings/first-login-guide.js 로 옮김(인라인 3단계 Z4 이동 2차(활용가이드·공개 범위 배지·스톱워치 시간 글자) — 앞 주석 포함) */

  window.OurgoalAppState.define('navButtons', document.querySelectorAll('.navbtn'));
  window.OurgoalAppState.define('screens', document.querySelectorAll('.screen'));
  /* [#TASK-ES-523] getPrivacyLabel · updatePrivacyBadges · openPrivacyPickerModal → js/tabs/settings/privacy-badges.js 로 옮김(인라인 3단계 Z4 이동 2차(활용가이드·공개 범위 배지·스톱워치 시간 글자) — 앞 주석 포함) */

  /* ============ 조선소 블록 레지스트리 6대 메가블록 초기화 (헌법 제3조 제9항) ============ */
  /* [#TASK-ES-471] initShipyardRegistry → js/core/registry-init.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */
  try { L.initShipyardRegistry(); } catch(e){ console.warn('[ShipyardRegistry] Init error:', e); }
  /* [#TASK-ES-471] setTab → js/core/registry-init.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */
  L.bindNavButtonsClick(); /* [#TASK-ES-471] 로드 중 문(앞 주석 포함) → js/core/registry-init.js 의 bindNavButtonsClick 로 옮김 — 원래 자리에서 부른다 */
  /* [#TASK-ES-471] switchTab → js/core/registry-init.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */
  if(typeof window !== 'undefined'){ window.switchTab = L.setTab; }

  /* ============ Modal helper & Android Hardware Back Handler ============ */
  window.OurgoalAppState.defineVar('_modalHistoryPushed', false);
  window.OurgoalAppState.defineVar('_modalDismissGraceUntil', 0);
  /* [#TASK-ES-591] openModal → js/core/modal-open.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-471] closeModal · openBottomSheetAlert · openBottomSheetConfirm → js/core/modal-helper.js 로 옮김(인라인 어려움 기관 묶음 이전 1차 — 앞 주석 포함) */

  L.bindModalPopstateBack(); /* [#TASK-ES-471] 로드 중 문(앞 주석 포함) → js/core/modal-helper.js 의 bindModalPopstateBack 로 옮김 — 원래 자리에서 부른다 */

  /* ============ 이용약관 & 개인정보처리방침 모달 ============ */
  /* [#TASK-ES-437] showLegalModal → js/tabs/settings/account-entry.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* [#TASK-ES-437] gaugeSvg → js/tabs/goals/result-input.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* [#TASK-ES-442] goalProgress · msCounts → js/tabs/goals/goal-math.js 로 옮김(인라인 스크립트 세포화 P0) */
  /* [#TASK-ES-601] rescaleGoal → js/tabs/goals/goal-rescale.js 로 옮김(목표 일정 리스케일링 분리 (G056) — 앞 주석 포함) */
  /* [#TASK-ES-437] hybridDashboardHtml → js/tabs/goals/result-input.js 로 옮김(인라인 스크립트 세포화 P0) */
  /* [#TASK-ES-562] RESULT_UNITS → js/tabs/goals/goal-category-templates.js 로 옮김(인라인 3단계 구역 Z5 표준 1 — 앞 주석 포함) */

  /* [#TASK-ES-442] resultPct → js/tabs/goals/goal-math.js 로 옮김(인라인 스크립트 세포화 P0) */
  /* [#TASK-ES-437] resultLineHtml · openAiResultAssistantModal → js/tabs/goals/result-input.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* [#TASK-ES-442] convertTextToNotionDbRecord → js/tabs/goals/notion-record-convert.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* [#TASK-ES-375] openResultModal → js/tabs/goals/result-modal.js 로 옮김(목표 탭 세포 2차) */

  /* ============ 프로필 ============ */
  /* [#TASK-ES-499] avatarHtml · renderProfileCard · resizeImageToDataUrl · openProfileEditor → js/core/profile-topbar.js 로 옮김(인라인 어려움 기관 묶음 이전 4차 — 앞 주석 포함) */
  /* [#TASK-ES-499] updateTopBar → js/core/profile-topbar.js 로 옮김(인라인 어려움 기관 묶음 이전 4차 — 앞 주석 포함) */
  /* [#TASK-ES-499] updateTopNotifBadge → js/core/profile-topbar.js 로 옮김(인라인 어려움 기관 묶음 이전 4차 — 앞 주석 포함) */
  /* [#TASK-ES-499] startScheduleReminderPoller → js/core/profile-topbar.js 로 옮김(인라인 어려움 기관 묶음 이전 4차 — 앞 주석 포함) */
  L.bindScheduleReminderStart(); /* [#TASK-ES-499] 로드 중 문(앞 주석 포함) → js/core/profile-topbar.js 의 bindScheduleReminderStart 로 옮김 — 원래 자리에서 부른다 */
  } /* bootEntryAndAccountWiring */

  /* ---- 이전 전 index.html 2950~2952줄(#TASK-ES-650 생성기 표지) ---- */
  function bootGoogleTokenState() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-482] getTrashList · autoPurgeExpiredTrash · moveToTrash · restoreFromTrash · permanentDeleteFromTrash · emptyTrash · toastWithTrashUndo · openTrashModal → js/core/trash-bin.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  window.OurgoalAppState.defineVar('googleTokenClient', null);
  } /* bootGoogleTokenState */

  K.bootEntryAndAccountWiring = bootEntryAndAccountWiring;
  K.bootGoogleTokenState = bootGoogleTokenState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
