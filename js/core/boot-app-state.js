/**
 * OurGoal Boot App State (앱 시동 — 상태 기관에 맡기는 초깃값: 앱 상태 객체 · 프롬프트 서랍 접힘 값)
 *
 * 앱이 뜰 때 한 번 도는 상태 정의 줄 둘을 원래 순서·원래 자리 그대로 구역 함수로 묶었다. 글자는 그대로다.
 * bootAppStateObject — 앱의 중심 상태 객체(프로필 · 열린 탭 · 고른 목표 등)의 초깃값을 상태 기관에 state 로 맡긴다.
 * bootPromptDrawerState — 프롬프트 백과사전 서랍의 접힘 값(처음에는 접힘 = false)을 상태 기관에 맡긴다.
 * #TASK-ES-682(구역 이전 3차 — 상태 이전 4차가 남긴 상태 기관 정의 줄 둘(state · _promptEncyclopediaOpen)을 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 2615~2617 · 2639~2639줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2615~2617줄(#TASK-ES-682 생성기 표지) ---- */
  function bootAppStateObject() { /* [#TASK-ES-682] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-574] defaultProfile → js/core/default-profile.js 로 옮김(기본 프로필 생성 책임 분열 — 앞 주석 포함) */

  window.OurgoalAppState.defineVar('state', { profile: null, activeTab: 'home', activeGoalId: null, goalEditMode: false, notifyTimer: null, notifiedSlots: {}, commSubTab: 'feed', goalsSubTab: 'personal', dmActiveId: null, activeGroupId: null, groupFilter: 'all', manitoDm: null, msSel: {}, taskSel: {}, shareComposer: null, googleToken: null, fbSetup: null, prevScreenTab: 'home', reportPeriod: 7, calView: 'month', calDate: L.isoDate(new Date()), calSelectedDate: L.isoDate(new Date()), selectedRecordTheme: 'all', recordsSegment: 'feed', recordsSlide: 0 });
  } /* bootAppStateObject */

  /* ---- 이전 전 index.html 2639~2639줄(#TASK-ES-682 생성기 표지) ---- */
  function bootPromptDrawerState() { /* [#TASK-ES-682] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.OurgoalAppState.defineVar('_promptEncyclopediaOpen', false);
  } /* bootPromptDrawerState */

  K.bootAppStateObject = bootAppStateObject;
  K.bootPromptDrawerState = bootPromptDrawerState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
