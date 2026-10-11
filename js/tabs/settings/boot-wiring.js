/**
 * OurGoal Settings Boot Wiring (설정 — 앱이 뜰 때 한 번 거는 연결)
 *
 * 앱이 뜰 때 한 번 도는 연결 줄 네 개를 함수로 감쌌다.
 * bindTermsLinks · bindPrivacyLinks — 이용약관 링크 3곳(#viewTermsBtn · #authTermsLink · #setTermsLink)과 개인정보처리방침 링크 3곳(#viewPrivacyBtn · #authPrivacyLink · #setPrivacyLink)에 약관 창 열기(showLegalModal)를 연결한다.
 * startDevDebugButtons — 시험 계정 단추 영역(#landTesterBWrap · #authTesterBWrap)을 개발 환경에서만 보이게 하고 그 밖에서는 지우는 initDevDebugButtons 를 문서 준비 뒤 실행한다.
 * startKeyboardShield — 가상 키보드가 입력칸을 가리지 않게 하는 initKeyboardShield 를 문서 준비 뒤 실행한다.
 * #TASK-ES-638(시동 배선 감싸기 1차 — 설정 시동 연결 · AI 목표 어시스턴트 서랍 · 바깥 부품 연결 · 서비스 워커): index.html 인라인 IIFE 의 구간(이전 전 2850~2856 · 2924~2927 · 2928~2931 · 3472~3482줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 2850~2856줄(#TASK-ES-638 생성기 표지) ---- */
  function startDevDebugButtons() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ [#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼 프로덕션 완전 소거 및 로컬/디버그 격리 ============ */
  /* [#TASK-ES-442] initDevDebugButtons → js/tabs/settings/dev-debug-gate.js 로 옮김(인라인 스크립트 세포화 P0) */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', L.initDevDebugButtons);
  } else {
    L.initDevDebugButtons();
  }
  } /* startDevDebugButtons */

  /* ---- 이전 전 index.html 2924~2927줄(#TASK-ES-638 생성기 표지) ---- */
  function bindTermsLinks() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  ['viewTermsBtn', 'authTermsLink', 'setTermsLink'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(e){ e.preventDefault(); L.showLegalModal('terms'); });
  });
  } /* bindTermsLinks */
  /* ---- 이전 전 index.html 2928~2931줄(#TASK-ES-638 생성기 표지) ---- */
  function bindPrivacyLinks() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  ['viewPrivacyBtn', 'authPrivacyLink', 'setPrivacyLink'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(e){ e.preventDefault(); L.showLegalModal('privacy'); });
  });
  } /* bindPrivacyLinks */

  /* ---- 이전 전 index.html 3472~3482줄(#TASK-ES-638 생성기 표지) ---- */
  function startKeyboardShield() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ==========================================================================
     [UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝
     과업: #UIUX-57 ~ #UIUX-64
     ========================================================================== */

  /* [#TASK-ES-444] initKeyboardShield → js/tabs/settings/pwa-install.js 로 옮김(인라인 스크립트 세포화 P1) */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', L.initKeyboardShield);
  } else {
    L.initKeyboardShield();
  }
  } /* startKeyboardShield */

  K.startDevDebugButtons = startDevDebugButtons;
  K.bindTermsLinks = bindTermsLinks;
  K.bindPrivacyLinks = bindPrivacyLinks;
  K.startKeyboardShield = startKeyboardShield;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalSettingsKit;
  if (K) R.provide('settings/boot-wiring', {
    bindPrivacyLinks: K.bindPrivacyLinks, bindTermsLinks: K.bindTermsLinks, startDevDebugButtons: K.startDevDebugButtons,
    startKeyboardShield: K.startKeyboardShield
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
