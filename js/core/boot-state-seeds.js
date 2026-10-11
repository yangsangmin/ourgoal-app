/**
 * OurGoal Boot State Seeds (앱 시동 — 템플릿 하위 탭 초깃값 · 토큰 저장 함수의 window 손잡이)
 *
 * 앱이 뜰 때 한 번 도는 상태 정의 줄과 window 복사 줄을 원래 순서·원래 자리 그대로 구역 함수로 묶었다. 글자는 통로 접두 말고 그대로다.
 * bootGoogleTokenSaveHandle — 구글 캘린더 토큰 저장 함수를 window 에 단다.
 * bootTemplateSubtabFilterState — 템플릿 백과사전 하위 탭의 분류 · 검색어 초깃값을 상태 기관에 맡긴다.
 * bootTemplateSubtabKindState — 템플릿 백과사전 하위 탭의 영역(개인·루틴·팀) · 종류(AI·실제) 초깃값을 상태 기관에 맡긴다.
 * #TASK-ES-676(구역 이전 2차 — 남은 로드 시점 문(상태 기관 정의 줄 · window 복사 줄)을 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 2851~2855 · 2918~2920 · 2922~2925줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2851~2855줄(#TASK-ES-676 생성기 표지) ---- */
  function bootGoogleTokenSaveHandle() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-659] saveGoogleToken → js/core/gcal-token-save.js 로 옮김(구글 캘린더 토큰 저장 함수 이전 — saveGoogleToken — 앞 주석 포함) */
  /* [#TASK-ES-482] restoreGoogleToken · gcalTokenStatus → js/core/gcal-sync.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  if(typeof window !== 'undefined'){
    window.saveGoogleToken = L.saveGoogleToken;
  }
  } /* bootGoogleTokenSaveHandle */

  /* ---- 이전 전 index.html 2918~2920줄(#TASK-ES-676 생성기 표지) ---- */
  function bootTemplateSubtabFilterState() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ RENDER: TEMPLATE ENCYCLOPEDIA SUBTAB (#TASK-ES-187) ============ */
  window.OurgoalAppState.defineVar('_subtabTplCat', 'all');
  window.OurgoalAppState.defineVar('_subtabTplQuery', '');
  } /* bootTemplateSubtabFilterState */

  /* ---- 이전 전 index.html 2922~2925줄(#TASK-ES-676 생성기 표지) ---- */
  function bootTemplateSubtabKindState() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  // 'personal' | 'routine' | 'team'
  window.OurgoalAppState.defineVar('_subtabTplDomain', 'personal');
  // 'ai' | 'real'
  window.OurgoalAppState.defineVar('_subtabTplType', 'ai');
  } /* bootTemplateSubtabKindState */

  K.bootGoogleTokenSaveHandle = bootGoogleTokenSaveHandle;
  K.bootTemplateSubtabFilterState = bootTemplateSubtabFilterState;
  K.bootTemplateSubtabKindState = bootTemplateSubtabKindState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
