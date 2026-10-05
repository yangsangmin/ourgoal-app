/**
 * OurGoal Goal AI Local Fallback (목표 — 오늘의 미션·다음 행동 로컬 문장)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   localTodayMission(이전 전 19302~19307줄, 구획 주석 포함 · 구획 「오늘의 미션」)
 *   localNextActionSuggestion(이전 전 19387~19391줄, 구획 주석 포함 · 구획 「마일스톤 완료 축하 모달 (AI 다음 행동 제안)」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ 오늘의 미션 ============ */
  /* [#TASK-ES-436] milestonesForMission → js/tabs/goals/ai-status.js 로 옮김(인라인 스크립트 세포화 P1) */
  function localTodayMission(goal){
    var open = goal.milestones.find(function(m){ return m.status!=='done'; });
    return open ? '오늘은 "'+open.title+'" 마일스톤을 위해 작게 한 걸음 내딛어보세요.' : '오늘은 그동안의 기록을 돌아보며 다음 목표를 그려보세요.';
  }

  /* ============ 마일스톤 완료 축하 모달 (AI 다음 행동 제안) ============ */
  function localNextActionSuggestion(goal, completedId){
    var next = goal.milestones.find(function(m){ return m.id!==completedId && m.status!=='done'; });
    return next ? '다음은 "'+next.title+'" 마일스톤을 시작해볼까요?' : '모든 마일스톤을 마쳤어요! 목표 결과를 기록해보세요.';
  }

  K.localTodayMission = localTodayMission;
  K.localNextActionSuggestion = localNextActionSuggestion;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
