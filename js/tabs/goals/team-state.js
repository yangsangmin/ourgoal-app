/**
 * OurGoal Team State (목표 탭 — 팀 참여 상태)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G160.
 *   옮긴 선언(이전 전 줄): groupState(31799~31806) · groupCheckedToday(31807~31809) · groupStreak(31810~31818)
 * groupState = 팀(모임) 참여 상태(localStorage 유지), groupCheckedToday·groupStreak = 오늘 인증 여부·연속 인증.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ 팀 참여 상태 (localStorage 유지) ============ */
  function groupState(gid){
    var s = L.state.profile.settings;
    if(!s.groupState) s.groupState = {};
    if(!s.groupState[gid]) s.groupState[gid] = { joined:false, checkins:[], cheers:0, myRole:'member' };
    return s.groupState[gid];
  }

  function groupCheckedToday(gid){
    return groupState(gid).checkins.indexOf(L.dateKey(L.nowISO())) !== -1;
  }

  function groupStreak(gid){
    var days = {};
    groupState(gid).checkins.forEach(function(d){ days[d] = true; });
    var streak = 0, cursor = new Date(); cursor.setHours(0,0,0,0);
    while(days[cursor.getFullYear()+'-'+L.pad(cursor.getMonth()+1)+'-'+L.pad(cursor.getDate())]){
      streak++; cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }

  K.groupState = groupState;
  K.groupCheckedToday = groupCheckedToday;
  K.groupStreak = groupStreak;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
