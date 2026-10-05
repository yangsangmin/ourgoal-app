/**
 * OurGoal Goal Status Refresh (목표 탭 — 종합상황 AI 요약 새로 고침)
 *
 * #TASK-ES-453 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   refreshGoalStatusSummary(이전 전 17321~17368줄, 구획 주석 포함 · 구획 「현재 종합상황 (AI 요약)」)
 * #TASK-ES-436 에서 시험지(ai-conditional-call-optimization)가 index.html 한 파일만 읽어 남겼던 함수 — #TASK-ES-451 로 시험지가 인라인 합본을 읽게 되어 옮겼다.
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

  /* ============ 현재 종합상황 (AI 요약) ============ */
  /* [#TASK-ES-436] computeGoalStatusHash · localGoalStatusSummary · generateGoalStatusSummary → js/tabs/goals/ai-status.js 로 옮김(인라인 스크립트 세포화 P1) */
  function refreshGoalStatusSummary(goal, hash){
    if(!goal || !goal.id) return;
    if(!L.state.goalStatusPending) L.state.goalStatusPending = {};
    if(L.state.goalStatusPending[goal.id]) return;
    var summaries = (L.state.profile && L.state.profile.settings && L.state.profile.settings.goalStatusSummaries) || {};
    var existing = summaries[goal.id];
    var todayKey = typeof L.getEffectiveStandardDateKey === 'function' ? L.getEffectiveStandardDateKey(L.nowISO()) : L.getKSTDateKey(L.nowISO());
    if(existing && existing.text && existing.hash === hash && (!existing.dateKey || existing.dateKey === todayKey)) return;
    L.state.goalStatusPending[goal.id] = true;
    L.generateGoalStatusSummary(goal).then(async function(text){
      delete L.state.goalStatusPending[goal.id];
      if(!text) return;
      if(!L.state.profile.settings.goalStatusSummaries) L.state.profile.settings.goalStatusSummaries = {};
    var goalStatusCache = L.state.profile.settings.goalStatusSummaries[goal.id];
      L.state.profile.settings.goalStatusSummaries[goal.id] = { text: text, hash: hash, dateKey: L.getKSTDateKey(L.nowISO()), standardDateKey: todayKey, updatedAt: L.nowISO() };
      await L.saveProfile();
      if(L.state.activeGoalId===goal.id && L.state.activeTab==='goals' && !L.state.goalEditMode){
        var el = document.getElementById('goalStatusText');
        var badge = document.getElementById('goalStatusBadge');
        var snip = document.getElementById('goalStatusSnippet');
        if(el) el.textContent = text;
        if(badge){
          badge.textContent = '분석완료';
          badge.style.background = 'rgba(16,185,129,.15)';
          badge.style.color = '#10b981';
          badge.style.borderColor = 'rgba(16,185,129,.3)';
        }
        if(snip){
          snip.textContent = text.slice(0, 38) + (text.length > 38 ? '…' : '');
        }
      }
    }).catch(function(){
      delete L.state.goalStatusPending[goal.id];
      if(L.state.activeGoalId===goal.id && L.state.activeTab==='goals' && !L.state.goalEditMode){
        var badge = document.getElementById('goalStatusBadge');
        var curSummaries = (L.state.profile && L.state.profile.settings && L.state.profile.settings.goalStatusSummaries) || {};
        var c = curSummaries[goal.id];
        if(badge && c && c.text){
          badge.textContent = '분석완료';
          badge.style.background = 'rgba(16,185,129,.15)';
          badge.style.color = '#10b981';
          badge.style.borderColor = 'rgba(16,185,129,.3)';
        }
      }
    });
  }

  K.refreshGoalStatusSummary = refreshGoalStatusSummary;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
