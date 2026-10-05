/**
 * OurGoal Widget Modal Opener (설정 — 「위젯 설정」 단추 문서 위임 클릭)
 *
 * 「DM & 동반자 소통 시스템 (TASK-ES-105)」 묶음의 로드 중 문: 문서 전체 클릭 위임으로 #btnOpenWidgetModal 을 누르면 위젯 설정 창(openWidgetSettingsModal)을 연다. 본문을 bindWidgetModalOpener 로 감싸 index.html 원래 자리에서 부른다(호출 순서 보존).
 * 같은 묶음의 openUserProfileModal(소통 사용자 프로필 창 예비 경로 — OurgoalTeamInviteComm 이 있으면 그쪽이 불려 게스트·로그인 모두 화면으로 닿지 않는다)은 잴 수 없어 원래 자리에 두었다.
 * #TASK-ES-545(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서): index.html 인라인 IIFE 의 구간(이전 전 10839~10845줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 10839~10845줄(#TASK-ES-545 생성기 표지) ---- */
  function bindWidgetModalOpener() { /* [#TASK-ES-545] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-448] openFaqModal → js/tabs/settings/support-modals.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] openWidgetSettingsModal → js/tabs/settings/widget-settings-modal.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('#btnOpenWidgetModal')){
      L.openWidgetSettingsModal();
    }
  });
  } /* bindWidgetModalOpener */

  K.bindWidgetModalOpener = bindWidgetModalOpener;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
