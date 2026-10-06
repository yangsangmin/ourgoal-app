/**
 * OurGoal Calendar Availability (기관 — 캘린더 사용 가능 판별)
 *
 * 앱 클라이언트 ID와 설정 클라이언트 ID 존재 여부의 순수 판별. 원문 trim·fallback 동작과 인접 토큰 저장·기존 통로를 보존한다.
 * #TASK-ES-575(캘린더 사용 가능 여부 판별 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 4274~4279줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4274~4279줄(#TASK-ES-575 생성기 표지) ---- */
  /* 캘린더 사용 가능 판단을 한 곳에: 앱 상수 우선, 비면 사용자가 설정에 넣은 ID로 폴백 (A2/R5/F4) */
  function calendarAvailable(appClientId, settings){
    var app = ((appClientId || '') + '').trim();
    var own = ((settings && settings.gcalClientId) || '').trim();
    return !!(app || own);
  }

  K.calendarAvailable = calendarAvailable;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
