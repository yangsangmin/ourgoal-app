/**
 * OurGoal Dev Debug Gate (설정 탭 — 개발 디버그 버튼 격리)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   initDevDebugButtons — 「[#TASK-ES-223] [생각 메모장 93번] 개발 디버그 버튼」(이전 전 5324~5338줄)
 * 로컬 개발 호스트에서 ?debug=true 일 때만 테스터 버튼을 보이고, 운영에서는 지운다.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  function initDevDebugButtons(){
    var forceDebug = typeof arguments[0] === 'boolean' ? arguments[0] : false;
    var isExplicitDebug = (typeof location !== 'undefined') && (location.search && location.search.indexOf('debug=true') !== -1);
    var isLocal = (typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || window.OurgoalDirectLoginGuard.isLocalDevHost(location.hostname));
    var isDev = isLocal && (forceDebug || isExplicitDebug);
    var lWrap = document.getElementById('landTesterBWrap');
    var aWrap = document.getElementById('authTesterBWrap');
    if(isDev){
      if(lWrap) lWrap.style.display = 'block';
      if(aWrap) aWrap.style.display = 'block';
    } else {
      if(lWrap) lWrap.remove();
      if(aWrap) aWrap.remove();
    }
  }

  K.initDevDebugButtons = initDevDebugButtons;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
