/**
 * OurGoal Goal Order (목표 탭 — 개인 목표 우선순위 정렬·이동)
 *
 * 「RENDER: 팀 목표」 묶음 중 목표 순서 몫: 저장된 순서대로 정렬(sortGoalsByOrder — smoke-test FN_NAMES) · 칩 ◀▶ 한 칸 이동(shiftGoalOrder) · 끌어 놓기 이동(reorderGoal). 순서는 프로필 settings.goalOrder 에 저장한다.
 * #TASK-ES-545(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서): index.html 인라인 IIFE 의 구간(이전 전 7439~7454 · 7455~7473 · 7474~7491줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 7439~7454줄(#TASK-ES-545 생성기 표지) ---- */

  /* 목표 우선순위 정렬 순수 함수 (TASK-BG-10) */
  function sortGoalsByOrder(goals, orderList){
    if(!goals || !Array.isArray(goals)) return [];
    if(!orderList || !Array.isArray(orderList) || !orderList.length) return goals.slice();
    var orderMap = {};
    orderList.forEach(function(id, idx){
      orderMap[id] = idx;
    });
    return goals.slice().sort(function(a, b){
      var aOrder = (a && a.id in orderMap) ? orderMap[a.id] : 999999;
      var bOrder = (b && b.id in orderMap) ? orderMap[b.id] : 999999;
      if(aOrder !== bOrder) return aOrder - bOrder;
      return 0;
    });
  }
  /* ---- 이전 전 index.html 7455~7473줄(#TASK-ES-545 생성기 표지) ---- */

  function shiftGoalOrder(goalId, dir){
    var rawGoals = (L.state.profile.goals || []).filter(function(g){ return !g.archivedAt; });
    var settings = L.state.profile.settings = L.state.profile.settings || {};
    var currentSorted = sortGoalsByOrder(rawGoals, settings.goalOrder || []);
    var ids = currentSorted.map(function(g){ return g.id; });
    var idx = ids.indexOf(goalId);
    if(idx === -1) return;
    var targetIdx = idx + dir;
    if(targetIdx < 0 || targetIdx >= ids.length) return;
    var temp = ids[idx];
    ids[idx] = ids[targetIdx];
    ids[targetIdx] = temp;
    settings.goalOrder = ids;
    L.saveProfile();
    L.renderHome();
    if(L.state.activeTab === 'goals') L.renderGoalsScreen();
    L.triggerHaptic(12);
  }
  /* ---- 이전 전 index.html 7474~7491줄(#TASK-ES-545 생성기 표지) ---- */

  function reorderGoal(fromId, toId){
    var rawGoals = (L.state.profile.goals || []).filter(function(g){ return !g.archivedAt; });
    var settings = L.state.profile.settings = L.state.profile.settings || {};
    var currentSorted = sortGoalsByOrder(rawGoals, settings.goalOrder || []);
    var ids = currentSorted.map(function(g){ return g.id; });
    var fromIdx = ids.indexOf(fromId);
    var toIdx = ids.indexOf(toId);
    if(fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, fromId);
    settings.goalOrder = ids;
    L.saveProfile();
    L.renderHome();
    if(L.state.activeTab === 'goals') L.renderGoalsScreen();
    L.toast('목표 순서를 변경했어요');
    L.triggerHaptic(15);
  }

  K.sortGoalsByOrder = sortGoalsByOrder;
  K.shiftGoalOrder = shiftGoalOrder;
  K.reorderGoal = reorderGoal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
