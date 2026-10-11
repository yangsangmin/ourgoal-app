/**
 * OurGoal Boot Finish (앱 시동 — 소통 · 설정 연결과 앱 시작, 홈 화면 설치)
 *
 * 앱이 뜰 때 마지막에 도는 문들을 원래 순서 그대로 구역 함수로 묶었다.
 * bootSharedGroupsState — 모임 목록을 불러왔는지 표시하는 값 자리를 만든다.
 * bootCommSettingsAndStart — 초대 링크 처리 함수와 응원 관련 값 자리, 위젯 창 열기, 설정 화면의 정적 연결, 날짜 바뀜 감지 값, 로그인 구조 단추, 계정 보안 부품 연결, 앱 시작(runAppBoot), 반응·도움돼요·팀 초대·팀 연계 목표·팀 공개 범위 부품 연결을 차례로 한다.
 * bootInstallAndServiceWorker — 서비스 워커를 등록하고, 모임 견본 목록을 window 에 달고, 홈 화면에 설치됐을 때의 기록을 듣는다.
 * #TASK-ES-650(구역 이전 — 앱이 뜰 때 한 번 도는 문을 순서 그대로 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 4481~4481 · 4489~4551 · 4557~4561줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4481~4481줄(#TASK-ES-650 생성기 표지) ---- */
  function bootSharedGroupsState() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.OurgoalAppState.defineVar('SHARED_GROUPS_LOADED', false);
  } /* bootSharedGroupsState */

  /* ---- 이전 전 index.html 4489~4551줄(#TASK-ES-650 생성기 표지) ---- */
  function bootCommSettingsAndStart() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
    /* ============ 통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임) ============ */
  /* [#TASK-ES-536] handleDeepLinkRouting → js/core/deep-link-gateway.js 로 옮김(인라인 3단계 Z3 — 알림·시간·주소 — 앞 주석 포함) */
  window.OurgoalAppState.define('checkAndHandlePeerInviteUrl', L.handleDeepLinkRouting);
  /* [#TASK-ES-448] MANITO_ADJ · MANITO_NOUN · MANITO_EMOJI · MANITO_WELCOME_STAMPS → js/tabs/comm/manito-basics.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] MANITO_STAMPS → js/tabs/comm/manito-basics.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */

  /* 마니또 1분 쿨타임 및 원클릭 웰컴 스탬프 발송 엔진 */
  if(typeof window !== 'undefined' && !window.MANITO_STAMP_COOLDOWN){ window.MANITO_STAMP_COOLDOWN = {}; }
  /* [#TASK-ES-448] sendManitoWelcomeStamp · hashStr · manitoState · manitoMajors · genAnonName → js/tabs/comm/manito-basics.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* ============ 마니또 실 유저 익명 응원 연동 (#TASK-ES-133, #TASK-ES-145) ============ */
  window.OurgoalAppState.defineVar('REAL_MANITO_PARTNERS_CACHE', []);
  window.OurgoalAppState.defineVar('REAL_MANITO_INBOX_CACHE', []);
  window.OurgoalAppState.defineVar('MANITO_SERVER_LOADED', false);
  /* [#TASK-ES-461] isValidRealUser → js/tabs/comm/manito-real.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  /* [#TASK-ES-461] loadServerManitoData · manitoPartners · manitoSentToday · manitoStreak · manitoMutualCount · manitoInbox · renderCommManito · renderManitoDm → js/tabs/comm/manito-real.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /* ============ DM & 동반자 소통 시스템 (TASK-ES-105) ============ */
  /* [#TASK-ES-596] openUserProfileModal → js/tabs/comm/user-profile-open.js 로 옮김(A1 시범 — 남은 작은 함수 2개 이전(동작 보존 확인 경로 첫 사용) — 앞 주석 포함) */
  /* [#TASK-ES-448] openNotificationSoftAskModal → js/tabs/settings/notify-soft-ask.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] openCustomerInquiryModal → js/tabs/settings/support-modals.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] openItemReportModal → js/tabs/settings/support-modals.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  L.bindWidgetModalOpener(); /* [#TASK-ES-545] 로드 중 문(앞 주석 포함) → js/tabs/settings/widget-modal-opener.js 의 bindWidgetModalOpener 로 옮김 — 원래 자리에서 부른다 */

  /* ============ [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 ============
     renderSettingsHeroCard · collapseAllSettingsSections · toggleAdvancedSettings · formatStorageBytes · paintCacheUsage · renderSettingsScreen
     과 설정 화면 정적 바인딩. 함수는 이 IIFE 맨 위에서 같은 이름으로 가져온다. 아래 호출·노출 줄은 이전 전과 같은 순서를 지키려고 같은 자리에 둔다. */
  // 설정 아코디언 인터랙션 12ms 햅틱 배선 (#TASK-ES-218)
  L.bindSettingsHapticDelegate();
  // 체크인 시간 추가·테스트 알림·내보내기·가져오기 버튼 바인딩
  L.bindSettingsStaticHandlers();
  /* [#TASK-ES-572] isWithinDND · generateDynamicNotification → js/tabs/settings/notification-helper.js 로 옮김(알림 헬퍼·목표 상세 서랍 책임 분열 — 앞 주석 포함) */
  /* [#TASK-ES-536] setupNotifyTimer · showNotifyBanner → js/tabs/settings/notify-timer.js 로 옮김(인라인 3단계 Z3 — 알림·시간·주소 — 앞 주석 포함) */
  /* [#TASK-ES-536] urlBase64ToUint8Array · syncPushSubscription · removePushSubscription → js/tabs/settings/web-push.js 로 옮김(인라인 3단계 Z3 — 알림·시간·주소 — 앞 주석 포함) */
  /* [#TASK-ES-432] totalFeedCheers · checkSocialNotifications · showSocialNotifyBanner → js/tabs/comm/cheer-notify.js 로 옮김(인라인 스크립트 세포화 2차 — 구획 주석 포함) */

  /* ============ 4대 연계 뷰 원자적 동시 전파 디스패처 (헌법 제1조 제4항 제5호 & 제15조 제6항 제3호) ============ */
  /* [#TASK-ES-486] dispatchFullViewPropagation → js/core/view-dispatch.js 로 옮김(인라인 어려움 기관 묶음 이전 2차 — 앞 주석 포함) */

  /* ============ [#TASK-ES-264] 자정(00:00 KST / 현지 표준시) 날짜 변경 감지 및 자동 동기화 워처 ============ */
  window.OurgoalAppState.defineVar('_lastObservedDateKey', null);
  /* [#TASK-ES-536] checkAndHandleDateRollover · setupDateRolloverWatcher → js/core/date-rollover.js 로 옮김(인라인 3단계 Z3 — 알림·시간·주소 — 앞 주석 포함) */

  /* [#TASK-ES-581] renderAll → js/core/all-view-render.js 로 옮김(전체 화면 렌더·앱 부팅 원문 분열 (renderAll 및 appBoot) — 앞 주석 포함) */
  /* ============ 세션 복구 및 안전 앱 진입 유틸 ============ */
  window.OurgoalAppState.defineVar('_isEnteringApp', false);
  /* [#TASK-ES-461] restoreSessionAndEnter · loginWithDirectIdentifier · openLoginRescueModal · rescueLoginSession → js/tabs/settings/session-entry.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  L.bindLoginRescueButtons(); /* [#TASK-ES-461] 로드 중 문(앞 주석 포함) → js/tabs/settings/session-entry.js 의 bindLoginRescueButtons 로 옮김 — 원래 자리에서 부른다 */
  /* ============ #TASK-AUTH-P0-SAFETY: 로그인/계정 보안 패키지 모듈 연결 ============ */
  L.connectAuthSafety(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/core/module-connect.js 의 connectAuthSafety 로 옮김 — 원래 자리에서 부른다 */
  L.runAppBoot(); /* [#TASK-ES-581] 로드 중 문(앞 주석 포함) → js/core/app-boot.js 의 runAppBoot 로 옮김 — 원래 자리에서 부른다 */

  L.connectReactions(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/core/module-connect.js 의 connectReactions 로 옮김 — 원래 자리에서 부른다 */
  /* ============ KF-4 #TASK-ES-018: 카테고리별 도움이 된 글 슬롯 모듈(js/top-helpful.js) ============ */
  if(window.OurgoalTopHelpful && typeof window.OurgoalTopHelpful.init === 'function'){
    window.OurgoalTopHelpful.init({ sb: L.sb });
  }

  L.connectHelpfulReason(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/core/module-connect.js 의 connectHelpfulReason 로 옮김 — 원래 자리에서 부른다 */

  L.connectTeamInviteComm(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/core/module-connect.js 의 connectTeamInviteComm 로 옮김 — 원래 자리에서 부른다 */
  /* ============ #TASK-ES-105: 팀 연계 개인목표 및 상호 체크 모듈(js/team-linked-goals.js) 연결 ============ */
  L.connectTeamLinkedGoals(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/core/module-connect.js 의 connectTeamLinkedGoals 로 옮김 — 원래 자리에서 부른다 */
  if(window.OurgoalTeamVisibilityLevels && typeof window.OurgoalTeamVisibilityLevels.init==='function'){ window.OurgoalTeamVisibilityLevels.init({ getState:function(){return L.state;}, getProfile:function(){return L.state.profile;}, saveProfile:L.saveProfile, toast:L.toast, openModal:L.openModal, closeModal:L.closeModal, triggerHaptic:(typeof L.triggerHaptic==='function'?L.triggerHaptic:null), dDay:L.dDay, uid:L.uid, daysFromNow:L.daysFromNow, MOCK_GROUPS:L.MOCK_GROUPS, getGroupState:L.groupState, canManageTeamGoals:L.canManageTeamGoals, renderTeamGoalsScreen:L.renderTeamGoalsScreen, getGroupLevelGoals:L.getGroupLevelGoals, getTeamCommentsCache:function(){return L.TEAM_COMMENTS_CACHE;}, teamCommentsBlockHtml:L.teamCommentsBlockHtml }); }
  } /* bootCommSettingsAndStart */

  /* ---- 이전 전 index.html 4557~4561줄(#TASK-ES-650 생성기 표지) ---- */
  function bootInstallAndServiceWorker() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ PWA: Service Worker 등록 및 자동 업데이트 감지 (#TASK-ES-118) ============ */
  L.bindServiceWorker(); /* [#TASK-ES-638] 로드 중 문(앞 주석 포함) → js/core/pwa-service-worker.js 의 bindServiceWorker 로 옮김 — 원래 자리에서 부른다 */
  window.MOCK_GROUPS = L.MOCK_GROUPS;

  window.addEventListener('appinstalled', function(){ try{ L.track('app_installed_pwa', { source: 'pwa', goal_type: null, day_index: L.dayIndexSinceSignup() }); }catch(e){} });
  } /* bootInstallAndServiceWorker */

  K.bootSharedGroupsState = bootSharedGroupsState;
  K.bootCommSettingsAndStart = bootCommSettingsAndStart;
  K.bootInstallAndServiceWorker = bootInstallAndServiceWorker;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
