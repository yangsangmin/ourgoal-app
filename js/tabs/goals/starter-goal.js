/**
 * OurGoal Starter Goal (목표 — 신규 유저 10초 갓생 스타터 목표 만들기)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   quickCreateStarterGoal(이전 전 13232~13253줄 · 구획 「신규 유저 10초 활성화: 갓생 스타터 목표 템플릿」)
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

  function quickCreateStarterGoal(starterKey){
    var tmpl = L.STARTER_GOAL_TEMPLATES[starterKey] || L.STARTER_GOAL_TEMPLATES.workout;
    var gId = L.newId();
    var ms = tmpl.milestones.map(function(m){
      return {
        id: L.newId(),
        title: m.title,
        status: m.status,
        dueDate: null,
        tasks: []
      };
    });
    return {
      id: gId,
      title: tmpl.title,
      category: tmpl.category,
      dueDate: null,
      milestones: ms,
      createdAt: L.nowISO(),
      visibility: 'private'
    };
  }

  K.quickCreateStarterGoal = quickCreateStarterGoal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
