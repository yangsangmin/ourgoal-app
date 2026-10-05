/**
 * OurGoal Comm Tour (설정 탭 — 첫 목표 뒤 소통 기능 짧은 투어)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   showCommTourModal — 「온보딩 직후 소통 기능 짧은 투어」(이전 전 7592~7610줄, 구획 주석 포함)
 * 첫 목표를 만든 직후 1회 소통 기능을 짧게 소개하는 창.
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

  /* ============ 온보딩 직후 소통 기능 짧은 투어 (첫 목표 생성 시 1회) ============ */
  function showCommTourModal(){
    L.openModal(
      '<h3>첫 목표를 만들었어요!</h3>' +
      '<p class="muted" style="margin:-6px 0 14px;">혼자보다 함께면 오래 갈 수 있어요. 소통 탭에서 이런 걸 할 수 있어요.</p>' +
      '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8"/><path d="M12 8v12"/><path d="M12 8c-2-3-6-3-6-1s3 1 6 1c3 0 6 1 6-1s-4-2-6 1z"/></svg></div><div><b>마니또</b><span>비슷한 목표를 가진 사람과 익명으로 매칭돼 서로 응원해요</span></div></div>' +
      '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div><b>팀</b><span>같은 목표의 사람들과 함께 인증하고 랭킹을 확인해요</span></div></div>' +
      '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/></svg></div><div><b>공유</b><span>내 진행 상황을 카드 이미지로 만들어 SNS에 자랑해요</span></div></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="tourSkip" type="button">나중에 볼게요</button><button class="btn btn-primary" id="tourGo" type="button">소통 탭 보러가기</button></div>',
      function(sheet){
        sheet.querySelector('#tourSkip').addEventListener('click', L.closeModal);
        sheet.querySelector('#tourGo').addEventListener('click', function(){
          L.closeModal();
          L.state.commSubTab = 'feed';
          L.setTab('comm');
        });
      }
    );
  }

  K.showCommTourModal = showCommTourModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
