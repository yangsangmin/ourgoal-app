/**
 * OurGoal Boot Early State (앱 시동 — 맨 먼저 하는 준비: 저장된 화면 테마 · 로그인 상태 듣기 · 테마 목록 · 아바타 레벨업 창 연결)
 *
 * 앱이 뜰 때 가장 먼저 도는 문들을 원래 순서 그대로 구역 함수로 묶었다.
 * bootApplySavedTheme — 저장해 둔 화면 테마 이름을 읽어 문서에 먼저 입힌다(화면이 그려지기 전에 색이 바뀌지 않게).
 * bootAuthStateListener — 로그인 세션 대기값을 만들고 로그인 상태가 바뀌는 것을 듣기 시작한다.
 * bootThemeList — 알림 글 타이머 자리와 화면 테마 목록을 만들고 window 에도 단다.
 * bootAvatarLevelUpWiring — 아바타 레벨업 창의 닫기·확인·바깥 누름·성장 문구 저장·공유·그림 저장 단추를 연결하고 인사 팝업 타이머 자리를 만든다.
 * bootExposeAppState — 앱의 상태 객체를 window 에 단다. bootPromptTabState — 프롬프트 백과 탭의 현재 칸 값을 만든다.
 * #TASK-ES-650(구역 이전 — 앱이 뜰 때 한 번 도는 문을 순서 그대로 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 2614~2621 · 2643~2644 · 2674~2693 · 2717~2733 · 2742~2742 · 2762~2762줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2614~2621줄(#TASK-ES-650 생성기 표지) ---- */
  function bootApplySavedTheme() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  try{
    var _initTh = localStorage.getItem('ourgoal_current_theme') || 'focus-sanctuary';
    if(_initTh === 'dark') _initTh = 'black';
    if(_initTh === 'light' || _initTh === 'system') _initTh = 'white';
    if(['focus-sanctuary', 'black', 'white', 'urban-city'].indexOf(_initTh) === -1) _initTh = 'focus-sanctuary';
    document.documentElement.setAttribute('data-theme', _initTh);
  }catch(e){}
  } /* bootApplySavedTheme */

  /* ---- 이전 전 index.html 2643~2644줄(#TASK-ES-650 생성기 표지) ---- */
  function bootAuthStateListener() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.OurgoalAppState.defineVar('_pendingAuthSession', null);
  L.bindSupabaseAuthStateListener(); /* [#TASK-ES-521] 로드 중 문(앞 주석 포함) → js/core/supabase-auth.js 의 bindSupabaseAuthStateListener 로 옮김 — 원래 자리에서 부른다 */
  } /* bootAuthStateListener */

  /* ---- 이전 전 index.html 2674~2693줄(#TASK-ES-650 생성기 표지) ---- */
  function bootThemeList() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ Confetti ============ */
  /* [#TASK-ES-482] burstConfetti → js/core/confetti.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  window.OurgoalAppState.defineVar('toastTimer',null);
  /* [#TASK-ES-569] toast → js/core/toast-renderer.js 로 옮김(기록 테마 분류와 공용 토스트 표시 책임 분열 — 앞 주석 포함) */
  /* [#TASK-ES-482] showUndoPrivacyToast → js/core/confetti.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  /* [#TASK-ES-442] defaultSettings → js/tabs/settings/app-defaults.js 로 옮김(인라인 스크립트 세포화 P0) */
  /* ============ 8대 화면 스타일 (테마) 정의 ============ */
  window.OurgoalAppState.define('THEMES', [
    { id: 'focus-sanctuary', name: '성소 (Sanctuary)', label: '포커스 (Focus)', desc: '오로라 에메랄드 다크 테마', preview: '#0B0F17', metaColor: '#0B0F17' },
    { id: 'black', name: '블랙 (Black)', desc: '선명한 딥 블랙 OLED 다크 테마', preview: '#000000', metaColor: '#000000' },
    { id: 'white', name: '화이트 (White)', desc: '화사하고 깔끔한 순백 라이트 테마', preview: '#FFFFFF', metaColor: '#FFFFFF' },
    { id: 'urban-city', name: '도심 (City)', desc: '세련된 모던 슬레이트 네이비 테마', preview: '#0B0F19', metaColor: '#0B0F19' }
  ]);

  /* [#TASK-ES-437] applyTheme → js/tabs/settings/theme-apply.js 로 옮김(인라인 스크립트 세포화 P0) */
  if(typeof window !== 'undefined'){
    window.THEMES = window.OurgoalAppScope.scope.THEMES;
  }
  } /* bootThemeList */

  /* ---- 이전 전 index.html 2717~2733줄(#TASK-ES-650 생성기 표지) ---- */
  function bootAvatarLevelUpWiring() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnAvLvClose) L.btnAvLvClose.addEventListener('click', L.closeAvatarLevelUpModal);
  var btnAvLvConfirm = document.getElementById('btnConfirmLevelUpClose');
  if(btnAvLvConfirm) btnAvLvConfirm.addEventListener('click', L.closeAvatarLevelUpModal);
  window.OurgoalAppState.define('avLvModalElem', document.getElementById('avatarLevelUpModal'));
  L.bindAvatarLevelUpBackdrop(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/avatar-levelup-modal.js 의 bindAvatarLevelUpBackdrop 로 옮김 — 원래 자리에서 부른다 */

  window.OurgoalAppState.define('btnSaveGrowth', document.getElementById('btnSaveGrowthPrompt'));
  L.bindAvatarGrowthPromptSave(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/avatar-levelup-modal.js 의 bindAvatarGrowthPromptSave 로 옮김 — 원래 자리에서 부른다 */

  window.OurgoalAppState.define('btnShareLv', document.getElementById('btnShareLevelUp'));
  L.bindAvatarLevelUpShare(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/avatar-levelup-modal.js 의 bindAvatarLevelUpShare 로 옮김 — 원래 자리에서 부른다 */

  window.OurgoalAppState.define('btnSaveLvImg', document.getElementById('btnSaveLevelUpImage'));
  L.bindAvatarLevelUpSaveImage(); /* [#TASK-ES-476] 로드 중 문(앞 주석 포함) → js/tabs/settings/avatar-levelup-modal.js 의 bindAvatarLevelUpSaveImage 로 옮김 — 원래 자리에서 부른다 */

  /* ============ #TASK-ES-165: 앱 진입 아바타 인사 팝업 (화면 절반 크기 & 시간대별 멘트) ============ */
  window.OurgoalAppState.defineVar('__avatarGreetTimer', null);
  } /* bootAvatarLevelUpWiring */

  /* ---- 이전 전 index.html 2742~2742줄(#TASK-ES-650 생성기 표지) ---- */
  function bootExposeAppState() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(typeof window !== 'undefined'){ window.state = L.state; }
  } /* bootExposeAppState */

  /* ---- 이전 전 index.html 2762~2762줄(#TASK-ES-650 생성기 표지) ---- */
  function bootPromptTabState() { /* [#TASK-ES-650] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.OurgoalAppState.defineVar('_promptTabState', 'real');
  } /* bootPromptTabState */

  K.bootApplySavedTheme = bootApplySavedTheme;
  K.bootAuthStateListener = bootAuthStateListener;
  K.bootThemeList = bootThemeList;
  K.bootAvatarLevelUpWiring = bootAvatarLevelUpWiring;
  K.bootExposeAppState = bootExposeAppState;
  K.bootPromptTabState = bootPromptTabState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
