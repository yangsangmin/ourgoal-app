/**
 * OurGoal Goal Math (목표 탭 — 진행률·마일스톤 수·결과 달성률 계산)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   goalProgress · msCounts — 「Goal math」(이전 전 7822~7832줄, 구획 주석 포함)
 *   resultPct — 「결과 기록 (체크박스 대신 수치 입력)」(이전 전 7872~7879줄)
 * 목표 진행률, 마일스톤 완료/전체 수, 결과 수치 달성률을 계산한다.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ Goal math ============ */
  function goalProgress(goal){
    if(!goal.milestones.length) return 0;
    var done = goal.milestones.filter(function(m){ return m.status==='done'; }).length;
    return Math.round((done/goal.milestones.length)*100);
  }
  function msCounts(goal){
    var c = {total:goal.milestones.length, todo:0, doing:0, done:0};
    goal.milestones.forEach(function(m){ c[m.status]++; });
    return c;
  }

  function resultPct(r){
    if(!r) return null;
    if(typeof r.pct === 'number' && !isNaN(r.pct)) return Math.min(999, r.pct);
    if(r.dbProperties && typeof r.dbProperties.progress === 'number' && !isNaN(r.dbProperties.progress)) return Math.min(999, r.dbProperties.progress);
    var target = Number(r.target), done = Number(r.result);
    if(!target || isNaN(target) || isNaN(done)) return null;
    return Math.min(999, Math.round((done / target) * 100));
  }

  K.goalProgress = goalProgress;
  K.msCounts = msCounts;
  K.resultPct = resultPct;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
