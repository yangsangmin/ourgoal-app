/**
 * OurGoal Deep Link Gateway (기관 — 앱 진입 때 주소 쿼리 딥링크를 js/viral-sharing.js 에 넘기는 관문)
 *
 * 「통합 딥링크 게이트웨이 & 게스트 소프트 뷰어 3종 (js/viral-sharing.js 위임)」 묶음의 관문 함수 handleDeepLinkRouting — window.OurgoalViralSharing 이 있으면 그 handleDeepLinkRouting 을 부른다. 첫 화면(랜딩)·게스트 진입 끝에서 checkAndHandlePeerInviteUrl 이름으로 불린다.
 * 같은 묶음의 별칭 var checkAndHandlePeerInviteUrl(실행되는 초기값)·마니또 window 노출 문은 원래 자리에 둔다. 주소에 초대·피드·템플릿·인증서 쿼리가 붙은 경로는 법정 실행기가 쿼리 붙은 주소로 이동할 수 없어 화면 시나리오로 잴 수 없다.
 * #TASK-ES-536(인라인 3단계 Z3 — 알림·시간·주소): index.html 인라인 IIFE 의 구간(이전 전 13366~13366줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 13366~13366줄(#TASK-ES-536 생성기 표지) ---- */
  function handleDeepLinkRouting(){ if(window.OurgoalViralSharing) window.OurgoalViralSharing.handleDeepLinkRouting(); }

  K.handleDeepLinkRouting = handleDeepLinkRouting;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
