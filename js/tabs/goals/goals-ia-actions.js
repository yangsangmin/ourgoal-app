/**
 * OurGoal Goals IA Actions (목표 탭 — 하위 탭 전환·성취 통계 기간·템플릿을 내 목표로 담기)
 *
 * 목표 탭 하위 탭 단추(switchGoalsSubTab) · 성취 통계 기간 단추와 리포트(switchGoalStatPeriod·renderGoalStatsChart) · 추천 템플릿을 내 목표로 담기(adoptTemplateAsMyGoal).
 * 마크업 onclick 과 js/tabs/goals/render.js · js/sanctuary-v3-engine.js 가 window 이름으로 부른다 — window 노출 줄(window.currentGoalStatPeriod 초기값 포함)은 index.html 원래 자리에 그대로 있다.
 * 같은 묶음의 스마트 태그 칩·빠른 목표 추가·목표 상세 서랍 함수(selectSmartTag·handleGoalFastAddSubmit·openGoalDetailDrawer·closeGoalDetailDrawer·toggleMilestoneInDrawer)는 옮기지 않았다 — 그 화면이 게스트 화면에서 보이지 않거나(CSS 숨김) 여는 길이 없어 화면 시나리오로 잴 수 없다(별도 티켓).
 * 같은 묶음에 있던 루틴 매트릭스 함수 두 개는 #TASK-ES-515 에서 지웠다(상민님 승인 2026-10-06 「숨김 정리 권장안 승인, 금고 변경 승인」).
 * #TASK-ES-481(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 15140~15145 · 15276~15287 · 15288~15312 · 15315~15355줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 15140~15145줄(#TASK-ES-481 생성기 표지) ---- */

  function switchGoalsSubTab(tab){
    L.triggerHapticFeedback(12);
    L.state.goalsSubTab = tab;
    L.renderGoalsScreen();
  }

  /* ---- 이전 전 index.html 15276~15287줄(#TASK-ES-481 생성기 표지) ---- */
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
  /* ---- 이전 전 index.html 15288~15312줄(#TASK-ES-481 생성기 표지) ---- */
  function renderGoalStatsChart(period){
    var p = period || window.currentGoalStatPeriod || 'week';
    var container = document.getElementById('goalsStatChartContent');
    if(!container) return;
    var profile = (L.state && L.state.profile) || {};
    var allGoals = (profile.goals || []).filter(function(g){ return !g.archivedAt; });
    var personalGoals = allGoals.filter(function(g){ return !g.teamLinked; });
    var linkedGoals = allGoals.filter(function(g){ return !!g.teamLinked; });
    var routines = (profile.settings && Array.isArray(profile.settings.routines)) ? profile.settings.routines : [];

    var periodDays = p === 'year' ? 365 : (p === 'month' ? 30 : 7);
    var periodLabels = { 'week':'주간 (최근 7일)', 'month':'월간 (최근 30일)', 'year':'연간 (최근 365일)' };
    var cutoffMs = Date.now() - periodDays * 86400000;

    // 기간 필터: 마감일 또는 생성일이 기간 내이거나 진행 중인 목표
    var periodGoals = personalGoals.filter(function(g){
      if(p === 'year') return true;
      var cTime = g.createdAt ? new Date(g.createdAt).getTime() : Date.now();
      var dTime = g.dueDate ? new Date(g.dueDate).getTime() : Date.now();
      if(p === 'week') return (dTime >= cutoffMs || cTime >= cutoffMs || g.status !== 'completed');
      return true;
    });
    if(periodGoals.length === 0) periodGoals = personalGoals;

    var totalGoals = periodGoals.length;
    var doneGoals = 0;
    var sumGoalPct = 0;
    var totalMs = 0, doneMs = 0, totalTasks = 0, doneTasks = 0;

    periodGoals.forEach(function(g){
      var pct = (typeof L.goalAchievement === 'function') ? L.goalAchievement(g) : (g.progress || 0);
      sumGoalPct += pct;
      if(pct === 100 || g.progress === 100 || g.status === 'completed') doneGoals++;
      (g.milestones || []).forEach(function(m){
        totalMs++;
        if(m.status === 'done' || m.done) doneMs++;
        (m.tasks || []).forEach(function(t){
          totalTasks++;
          if(t.done) doneTasks++;
        });
      });
    });

    var avgGoalPct = totalGoals > 0 ? Math.round(sumGoalPct / totalGoals) : 0;
    var msPct = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : 0;
    var taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : msPct;

    // 루틴 기간 내 실천 횟수 및 당일 달성률
    var todayKey = (typeof L.dateKey === 'function') ? L.dateKey(new Date()) : new Date().toISOString().slice(0, 10);
    var todayDoneRt = 0;
    var periodRtCheckCount = 0;
    routines.forEach(function(r){
      var dates = Array.isArray(r.completedDates) ? r.completedDates : [];
      if(dates.indexOf(todayKey) !== -1) todayDoneRt++;
      dates.forEach(function(dStr){
        var t = new Date(dStr + 'T00:00:00').getTime();
        if(!isNaN(t) && t >= cutoffMs) periodRtCheckCount++;
      });
    });
    var rtTodayPct = routines.length > 0 ? Math.round((todayDoneRt / routines.length) * 100) : 0;
    var expectedPeriodChecks = Math.max(1, routines.length * (p === 'week' ? 7 : (p === 'month' ? 30 : 90)));
    var rtPeriodPct = Math.min(100, Math.round((periodRtCheckCount / expectedPeriodChecks) * 100));

    // 팀 연계 목표 평균 달성률
    var linkedSum = 0;
    linkedGoals.forEach(function(lg){
      linkedSum += (typeof L.goalAchievement === 'function') ? L.goalAchievement(lg) : (lg.progress || 0);
    });
    var linkedAvgPct = linkedGoals.length > 0 ? Math.round(linkedSum / linkedGoals.length) : 0;

    // 통합 성취 지수 (목표 평균진행률 + 마일스톤 진행률 + 루틴 달성률 종합)
    var overallRate = totalGoals > 0
      ? Math.round((avgGoalPct * 0.5) + (msPct * 0.3) + (Math.max(rtTodayPct, rtPeriodPct) * 0.2))
      : rtTodayPct;

    var breakdownRowsHtml = periodGoals.slice(0, 5).map(function(g){
      var gPct = (typeof L.goalAchievement === 'function') ? L.goalAchievement(g) : (g.progress || 0);
      var gMsDone = (g.milestones || []).filter(function(m){ return m.status === 'done' || m.done; }).length;
      var gMsTotal = (g.milestones || []).length;
      return '<div data-stat-gotogoal="' + g.id + '" style="padding:9px 11px;background:var(--surface-2);border:1px solid var(--rule);border-radius:10px;cursor:pointer;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px;">' +
          '<span style="font-size:.84rem;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (g.icon || '🎯') + ' ' + L.escapeHtml(g.title) + '</span>' +
          '<span style="font-size:.78rem;font-weight:800;color:var(--brand);white-space:nowrap;flex-shrink:0;">' + gPct + '% (' + gMsDone + '/' + gMsTotal + ')</span>' +
        '</div>' +
        '<div class="goal-progress-track" style="height:6px;margin:0;"><div class="goal-progress-fill" style="width:' + gPct + '%;"></div></div>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div class="card" style="padding:16px;border-radius:16px;background:var(--card);border:1px solid var(--rule);margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="font-size:0.84rem;font-weight:700;color:var(--ink-soft);">📊 ' + (periodLabels[p] || '주간') + ' 통합 성장 리포트</div>' +
          '<span class="badge" style="font-size:.7rem;padding:2px 8px;border-radius:8px;background:rgba(99,102,241,0.12);color:var(--brand);font-weight:700;white-space:nowrap;">실시간 측정</span>' +
        '</div>' +
        '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
          '<span style="font-size:1.85rem;font-weight:800;color:var(--brand);">' + overallRate + '%</span>' +
          '<span style="font-size:0.8125rem;color:var(--ink-soft);">(총 ' + totalGoals + '개 중 ' + doneGoals + '개 완주 · 평균 진행률 ' + avgGoalPct + '%)</span>' +
        '</div>' +
        '<div class="goal-progress-track" style="height:10px;margin-bottom:14px;">' +
          '<div class="goal-progress-fill" style="width:' + overallRate + '%;"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.78rem;">' +
          '<div style="padding:9px 10px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:10px;color:var(--ink);">' +
            '<div class="faint" style="font-size:.7rem;margin-bottom:2px;">개인 목표 현황</div>' +
            '<b>🎯 진행 중: ' + (totalGoals - doneGoals) + '개 · 🏆 완주: ' + doneGoals + '개</b>' +
          '</div>' +
          '<div style="padding:9px 10px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:10px;color:var(--ink);">' +
            '<div class="faint" style="font-size:.7rem;margin-bottom:2px;">마일스톤 & 세부할일</div>' +
            '<b>🚩 ' + doneMs + '/' + totalMs + ' (' + msPct + '%) · ✓ ' + doneTasks + '/' + totalTasks + '</b>' +
          '</div>' +
          '<div style="padding:9px 10px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:10px;color:var(--ink);">' +
            '<div class="faint" style="font-size:.7rem;margin-bottom:2px;">데일리 루틴 실천</div>' +
            '<b>⏰ 오늘 ' + todayDoneRt + '/' + routines.length + ' · 기간 누적 ' + periodRtCheckCount + '회</b>' +
          '</div>' +
          '<div style="padding:9px 10px;background:var(--card2, var(--surface));border:1px solid var(--rule);border-radius:10px;color:var(--ink);">' +
            '<div class="faint" style="font-size:.7rem;margin-bottom:2px;">팀 연계 개인목표</div>' +
            '<b>🤝 참여 ' + linkedGoals.length + '개 (평균 ' + linkedAvgPct + '%)</b>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:14px 16px;border-radius:16px;background:var(--card);border:1px solid var(--rule);margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<b style="font-size:.9rem;color:var(--ink);">🏔️ 목표별 실시간 진척도 (터치 시 이동)</b>' +
          '<span class="faint" style="font-size:.75rem;">총 ' + periodGoals.length + '개</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          (breakdownRowsHtml || '<div class="faint" style="text-align:center;padding:12px 0;font-size:.8125rem;">등록된 목표가 없습니다.</div>') +
        '</div>' +
      '</div>' +
      '<div class="card" style="padding:14px 16px;border-radius:16px;background:var(--card);border:1px solid var(--rule);">' +
        '<div style="font-size:.9rem;font-weight:800;color:var(--ink);margin-bottom:4px;">🤖 AI 성취 코칭 & 데이터 허브</div>' +
        '<div class="faint" style="font-size:.75rem;margin-bottom:10px;">현재 목표·마일스톤·루틴 데이터를 AI 코칭 프롬프트나 JSON 백업으로 내보냅니다.</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnStatsCopyAiPrompt" style="flex:1;min-height:38px;font-size:.78rem;font-weight:700;border-radius:10px;white-space:nowrap;">🤖 AI 코칭 프롬프트 복사</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btnStatsExportJson" style="flex:1;min-height:38px;font-size:.78rem;font-weight:700;border:1px solid var(--rule);border-radius:10px;white-space:nowrap;">📥 목표·루틴 JSON 백업</button>' +
        '</div>' +
      '</div>';

    container.querySelectorAll('[data-stat-gotogoal]').forEach(function(row){
      row.onclick = function(){
        var gId = row.getAttribute('data-stat-gotogoal');
        if(gId){
          L.state.activeGoalId = gId;
          L.state.goalsSubTab = 'personal';
          L.renderGoalsScreen();
        }
      };
    });

    var btnCopyAi = container.querySelector('#btnStatsCopyAiPrompt');
    if(btnCopyAi){
      btnCopyAi.onclick = function(){
        var summaryLines = ['[아워골 ' + (periodLabels[p] || '주간') + ' 성취 데이터 요약]', '- 통합 성취율: ' + overallRate + '% (목표 평균 ' + avgGoalPct + '%, 마일스톤 ' + doneMs + '/' + totalMs + ', 루틴 오늘 ' + todayDoneRt + '/' + routines.length + ')'];
        periodGoals.forEach(function(g){
          var gPct = (typeof L.goalAchievement === 'function') ? L.goalAchievement(g) : (g.progress || 0);
          summaryLines.push('- 목표: ' + g.title + ' (' + gPct + '%, 마감: ' + (g.dueDate || '미정') + ')');
        });
        summaryLines.push('\n위 데이터를 바탕으로 이번 주 가장 집중해야 할 1순위 마일스톤과 데일리 루틴 개선 조언을 3줄로 코칭해줘.');
        var promptText = summaryLines.join('\n');
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(promptText).then(function(){
            if(typeof L.toast === 'function') L.toast('🤖 AI 코칭 프롬프트가 클립보드에 복사되었습니다!');
          }).catch(function(){
            if(typeof L.toast === 'function') L.toast('프롬프트 준비 완료: ' + summaryLines[1]);
          });
        } else if(typeof L.toast === 'function'){
          L.toast('🤖 AI 코칭 프롬프트가 생성되었습니다!');
        }
      };
    }

    var btnExportJson = container.querySelector('#btnStatsExportJson');
    if(btnExportJson){
      btnExportJson.onclick = function(){
        try {
          var payload = JSON.stringify({ exportedAt: new Date().toISOString(), period: p, goals: allGoals, routines: routines }, null, 2);
          var blob = new Blob([payload], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'ourgoal-goals-routines-' + todayKey + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          if(typeof L.toast === 'function') L.toast('📥 목표·루틴 JSON 파일이 다운로드되었습니다!');
        } catch(e){
          if(typeof L.toast === 'function') L.toast('데이터 내보내기 완료');
        }
      };
    }
  }

  /* ---- 이전 전 index.html 15315~15355줄(#TASK-ES-481 생성기 표지) ---- */

  function adoptTemplateAsMyGoal(title, category){
    L.triggerHapticFeedback(12);
    var now = new Date();
    var d14 = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
    var d30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    var newGoal = {
      id: 'g_' + Date.now(),
      title: title || '새로운 템플릿 목표',
      category: category || '학습/성장',
      topic: category || '학습/성장',
      icon: '🎯',
      visibility: 'private',
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
      dueDate: d30,
      milestones: [
        { id: 'm_' + Date.now() + '_1', title: '1단계 시작하기 (기초 세팅)', status: 'doing', done: false, dueDate: d14, tasks: [] },
        { id: 'm_' + Date.now() + '_2', title: '2단계 꾸준히 실천하기 (습관화)', status: 'todo', done: false, dueDate: d30, tasks: [] }
      ]
    };
    if(!L.state.profile.goals) L.state.profile.goals = [];
    L.state.profile.goals.unshift(newGoal);
    L.state.activeGoalId = newGoal.id;
    if(!L.state.profile.settings) L.state.profile.settings = {};
    if(Array.isArray(L.state.profile.settings.goalOrder)){
      L.state.profile.settings.goalOrder.unshift(newGoal.id);
    }
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
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalGoalsKit;
  if (K) R.provide('goals/goals-ia-actions', {
    adoptTemplateAsMyGoal: K.adoptTemplateAsMyGoal, renderGoalStatsChart: K.renderGoalStatsChart, switchGoalStatPeriod: K.switchGoalStatPeriod,
    switchGoalsSubTab: K.switchGoalsSubTab
  }, { window: [
    'adoptTemplateAsMyGoal', 'renderGoalStatsChart', 'switchGoalStatPeriod', 'switchGoalsSubTab'
  ], windowOnly: [
    'adoptTemplateAsMyGoal', 'switchGoalStatPeriod', 'switchGoalsSubTab'
  ] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
