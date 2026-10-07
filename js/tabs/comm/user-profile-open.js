/**
 * OurGoal User Profile Open (소통 — 사용자 프로필 창 열기 위임)
 *
 * 동반자·피드 작성자 프로필 창 열기 openUserProfileModal — js/team-invite-comm.js 의 OurgoalTeamInviteComm.openUserProfileModal 이 있으면 그쪽에 맡긴다.
 * #TASK-ES-596(A1 시범 — 남은 작은 함수 2개 이전(동작 보존 확인 경로 첫 사용)): index.html 인라인 IIFE 의 구간(이전 전 6220~6226줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 6220~6226줄(#TASK-ES-596 생성기 표지) ---- */
  /* [#TASK-ES-379] renderCommDM · renderCommCompanions → js/tabs/comm/render.js 로 옮김(소통 탭 세포 1차) */

  function openUserProfileModal(user){
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openUserProfileModal){
      return window.OurgoalTeamInviteComm.openUserProfileModal(user);
    }
  }

  K.openUserProfileModal = openUserProfileModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
