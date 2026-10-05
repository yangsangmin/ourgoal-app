/**
 * OurGoal Check-in Helpers (기록 탭 — 스트릭 프리즈·체크인 예시 문구)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   applyQuickCunningText — 「[88] 오늘의 3초 체크인 목표 버튼 선택 시」(이전 전 5030~5043줄)
 *   checkStreakFreeze — 「스트릭 프리즈 (연속기록 보호권)」(이전 전 7137~7146줄, 구획 주석 포함)
 * 연속기록 보호권(스트릭 프리즈) 확인, 3초 체크인 목표 단추를 고르면 입력칸 예시 문구 채우기.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  function applyQuickCunningText(text){
    if(!text) return;
    var inp = document.getElementById('captureInput');
    if(!inp) return;
    // [#TASK-ES-217 / [88]] 지움 피로도 근절: inp.value 강제 주입 제거 및 placeholder 동적 가이드화
    inp.placeholder = '예: ' + text;
    if(!inp.value){
      inp.value = '';
    }
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.focus();
    if(typeof L.triggerHaptic === 'function') L.triggerHaptic(15);
    if(typeof L.toast === 'function') L.toast('💡 예시 가이드가 입력창 힌트로 설정되었습니다 ✨');
  }

  /* ============ 스트릭 프리즈 (연속기록 보호권) ============ */
  async function checkStreakFreeze(){
    if(!L.state.profile.settings.streakFreeze) L.state.profile.settings.streakFreeze = { available:1, usedDates:[], grantedTier:0 };
    var applied = L.maybeApplyStreakFreeze();
    var granted = L.maybeGrantStreakFreeze();
    var bonusGranted = L.maybeGrantAvatarCraftBonus();
    if(applied || granted || bonusGranted) await L.saveProfile();
    if(applied) L.toast('어제 기록을 못 남겼지만 스트릭 프리즈로 연속 기록이 지켜졌어요');
    else if(granted) L.toast('스트릭 프리즈를 1개 획득했어요! 하루를 놓쳐도 연속 기록이 지켜져요');
  }

  K.applyQuickCunningText = applyQuickCunningText;
  K.checkStreakFreeze = checkStreakFreeze;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
