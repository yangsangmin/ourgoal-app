/**
 * OurGoal Boot App Handles (앱 시동 — 앱 환경설정 객체 · 템플릿 부품에 앱 손잡이 연결)
 *
 * 앱이 뜰 때 한 번 도는 두 곳을 원래 순서·원래 자리 그대로 구역 함수로 묶었다. 글자는 통로 접두 말고 그대로다.
 * bootAppConfig — 앱 환경설정 객체(빈 객체)를 만들어 window 에 단다. 다른 부품이 부를 때 window 의 이 객체를 읽는다.
 * bootTemplatePartHandles — 템플릿 부품이 로드돼 있으면 서버 연결 · 앱 상태 읽기 함수 · 알림 글 함수를 건넨다.
 * #TASK-ES-671(구역 이전 — 앱 환경설정 객체와 템플릿 부품의 앱 손잡이 연결): index.html 인라인 IIFE 의 연속 구역(이전 전 2767~2770 · 4130~4132줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2767~2770줄(#TASK-ES-671 생성기 표지) ---- */
  function bootAppConfig() { /* [#TASK-ES-671] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ 아워골 앱 환경설정 ============
     [#TASK-ES-516] 템플릿 복제 광고 설정 4개는 상민님 결정(2026-10-06)으로 지웠다. 크레딧 원장 플래그만 남는다. */
  var OURGOAL_CONFIG = {};
  if(typeof window !== 'undefined'){ window.OURGOAL_CONFIG = OURGOAL_CONFIG; }
  } /* bootAppConfig */

  /* ---- 이전 전 index.html 4130~4132줄(#TASK-ES-671 생성기 표지) ---- */
  function bootTemplatePartHandles() { /* [#TASK-ES-671] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(window.OurgoalTemplateCredit && typeof window.OurgoalTemplateCredit.init === 'function'){
    window.OurgoalTemplateCredit.init({ sb: L.sb, getState: function(){ return L.state; }, toast: L.toast });
  }
  } /* bootTemplatePartHandles */

  K.bootAppConfig = bootAppConfig;
  K.bootTemplatePartHandles = bootTemplatePartHandles;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
