/**
 * 전체 화면 렌더 통합 (renderAll)
 *
 * 홈·목표·일정·기록·소통·설정 6대 화면 및 탑바를 한 번에 다시 그린다.
 * #TASK-ES-581(전체 화면 렌더·앱 부팅 원문 분열 (renderAll 및 appBoot)): index.html 인라인 IIFE 의 구간(이전 전 7823~7835줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 7823~7835줄(#TASK-ES-581 생성기 표지) ---- */
  /* ============ Render all ============ */
  function renderAll(){
    L.updateTopBar();
    document.getElementById('homeGreeting').textContent = L.state.profile.displayName + '님, 안녕하세요';
    if(typeof L.setupDateRolloverWatcher === 'function') L.setupDateRolloverWatcher();
    L.renderHome();
    L.renderGoalsScreen();
    L.renderCalendarScreen();
    L.renderRecordsScreen();
    L.renderCommScreen();
    L.renderSettingsScreen();
    if(window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render && L.state && L.state.activeTab) window.OurgoalSanctuaryV3.render(L.state.activeTab);
  }

  K.renderAll = renderAll;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
