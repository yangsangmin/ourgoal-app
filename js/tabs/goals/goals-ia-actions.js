/**
 * OurGoal Goals IA Actions (목표 탭 — 하위 탭 전환·성취 통계 기간·템플릿을 내 목표로 담기)
 *
 * 목표 탭 하위 탭 단추(switchGoalsSubTab) · 성취 통계 기간 단추와 리포트(switchGoalStatPeriod·renderGoalStatsChart) · 추천 템플릿을 내 목표로 담기(adoptTemplateAsMyGoal).
 * 마크업 onclick 과 js/tabs/goals/render.js · js/sanctuary-v3-engine.js 가 window 이름으로 부른다 — window 노출 줄(window.currentGoalStatPeriod 초기값 포함)은 index.html 원래 자리에 그대로 있다.
 * 같은 묶음의 스마트 태그 칩·빠른 목표 추가·목표 상세 서랍·루틴 매트릭스 함수(selectSmartTag·handleGoalFastAddSubmit·openGoalDetailDrawer·closeGoalDetailDrawer·toggleMilestoneInDrawer·renderRoutineMatrixGrid·toggleRoutineStamp)는 옮기지 않았다 — 그 화면이 게스트 화면에서 보이지 않거나(CSS 숨김) 여는 길이 없어 화면 시나리오로 잴 수 없다(별도 티켓).
 * #TASK-ES-481(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 15758~15763 · 15894~15905 · 15906~15930 · 15933~15973줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 15758~15763줄(#TASK-ES-481 생성기 표지) ---- */

  function switchGoalsSubTab(tab){
    L.triggerHapticFeedback(12);
    L.state.goalsSubTab = tab;
    L.renderGoalsScreen();
  }

  /* ---- 이전 전 index.html 15894~15905줄(#TASK-ES-481 생성기 표지) ---- */
  function switchGoalStatPeriod(period){
    L.triggerHapticFeedback(12);
    window.currentGoalStatPeriod = period;
    var nav = document.getElementById('goalsStatPeriodNav');
    if(nav){
      nav.querySelectorAll('.goals-stat-period-btn').forEach(function(b){ b.classList.remove('active'); });
      var map = { 'week':'btnGoalPeriodWeek', 'month':'btnGoalPeriodMonth', 'year':'btnGoalPeriodYear' };
      var target = document.getElementById(map[period]);
      if(target) target.classList.add('active');
    }
    renderGoalStatsChart(period);
  }
  /* ---- 이전 전 index.html 15906~15930줄(#TASK-ES-481 생성기 표지) ---- */
  function renderGoalStatsChart(period){
    var p = period || window.currentGoalStatPeriod || 'week';
    var container = document.getElementById('goalsStatChartContent');
    if(!container) return;
    var goals = L.state.profile.goals || [];
    var totalGoals = goals.length;
    var doneGoals = goals.filter(function(g){ return g.progress === 100 || g.status === 'completed'; }).length;
    var overallRate = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;
    var periodLabels = { 'week':'주간', 'month':'월간', 'year':'연간' };

    container.innerHTML = '<div class="card" style="padding:16px;border-radius:16px;background:var(--card);border:1px solid var(--rule);">' +
      '<div style="font-size:0.85rem;color:var(--ink-soft);margin-bottom:6px;">' + (periodLabels[p] || '주간') + ' 목표 달성 리포트</div>' +
      '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">' +
        '<span style="font-size:1.8rem;font-weight:800;color:var(--brand);">' + overallRate + '%</span>' +
        '<span style="font-size:0.85rem;color:var(--ink-soft);">(총 ' + totalGoals + '개 중 ' + doneGoals + '개 완주)</span>' +
      '</div>' +
      '<div class="goal-progress-track" style="height:10px;margin-bottom:14px;">' +
        '<div class="goal-progress-fill" style="width:' + overallRate + '%;"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem;">' +
        '<div style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">🎯 진행 중: ' + (totalGoals - doneGoals) + '개</div>' +
        '<div style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">🏆 완주: ' + doneGoals + '개</div>' +
      '</div>' +
    '</div>';
  }

  /* ---- 이전 전 index.html 15933~15973줄(#TASK-ES-481 생성기 표지) ---- */

  function adoptTemplateAsMyGoal(title, category){
    L.triggerHapticFeedback(12);
    var now = new Date();
    var d14 = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
    var d30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    var newGoal = {
      id: 'g_' + Date.now(),
      title: title || '새로운 템플릿 목표',
      category: category || '학습/성장',
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
      dueDate: d30,
      milestones: [
        { id: 'm_' + Date.now() + '_1', title: '1단계 시작하기 (기초 세팅)', status: 'doing', dueDate: d14 },
        { id: 'm_' + Date.now() + '_2', title: '2단계 꾸준히 실천하기 (습관화)', status: 'todo', dueDate: d30 }
      ]
    };
    if(!L.state.profile.goals) L.state.profile.goals = [];
    L.state.profile.goals.unshift(newGoal);
    L.state.activeGoalId = newGoal.id;
    if(!L.state.profile.settings) L.state.profile.settings = {};
    if(!Array.isArray(L.state.profile.settings.customSchedules)) L.state.profile.settings.customSchedules = [];
    L.state.profile.settings.customSchedules.push({
      id: 'sched_' + newGoal.milestones[0].id,
      linkedId: newGoal.milestones[0].id,
      linkedLevel: 'ms',
      linkedGoalId: newGoal.id,
      linkedGoalTitle: newGoal.title,
      title: newGoal.milestones[0].title,
      dueDate: d14,
      date: d14,
      category: newGoal.category,
      createdAt: new Date().toISOString()
    });
    if(typeof L.toast === 'function') L.toast('⚡ \'' + newGoal.title + '\' 템플릿이 내 목표에 1초 만에 담겼습니다! 🎉');
    if(typeof L.saveProfile === 'function') L.saveProfile();
    if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation();
    else L.renderGoalsScreen();
  }

  K.switchGoalsSubTab = switchGoalsSubTab;
  K.switchGoalStatPeriod = switchGoalStatPeriod;
  K.renderGoalStatsChart = renderGoalStatsChart;
  K.adoptTemplateAsMyGoal = adoptTemplateAsMyGoal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
