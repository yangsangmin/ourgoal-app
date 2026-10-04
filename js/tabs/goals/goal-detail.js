/**
 * OurGoal Goal Detail Markup (목표 탭 — 선택한 목표의 상세 마크업)
 *
 * #TASK-ES-370 (목표 탭 세포 이전): index.html 인라인 renderGoalsScreen 의 상세 마크업 구간(이전 전 24380~24770줄)과
 *   그 구간만 쓰는 헬퍼 resultBadgeHtml(이전 전 8323~8332줄) · formatDateTimeBadge(이전 전 10293~10300줄)를 동작 그대로 옮겼다.
 * 마일스톤 목록·진행 요약·마감일·공개 범위·AI 상태 요약 미니바·내보내기 카드·선택 막대를 만들어 #goalDetailBody 에 넣는다.
 * renderGoalsScreen(js/tabs/goals/render.js)이 머리 다음에 K.renderGoalDetailBody(goal, body) 로 부르고,
 * 다음 구간(goal-detail-events.js)이 쓰는 지역 변수 allCollapsed·goalStatusHash·isDateStale·goalStatusStale 를 돌려준다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 목표 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(예: 같은 함수 안 var totalMs 두 번 선언 — 이 파일 안에 그대로 있다).
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 목표 키트: 목표 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function resultBadgeHtml(r){
    var pct = L.resultPct(r);
    if(!r || (!r.target && !r.result && !r.dbProperties && !r.pct && !r.summary)) return '<div class="result-btn">결과<br>입력</div>';
    if(pct === null) return '<div class="result-btn has">기록<br>완료</div>';
    var cls = pct>=100 ? 'has' : 'miss';
    if(r.target && r.result && r.unit !== '%'){
      return '<div class="result-btn '+cls+'">'+r.result+'/'+r.target+'<br>'+pct+'%</div>';
    }
    return '<div class="result-btn '+cls+'">달성률<br>'+pct+'%</div>';
  }

  function formatDateTimeBadge(str){
    if(!str) return '';
    if(str.indexOf('T') !== -1){
      var parts = str.split('T');
      return parts[0] + ' ' + parts[1].slice(0, 5);
    }
    return str;
  }

  /* renderGoalsScreen 의 상세 마크업 구간. goal·body 는 renderGoalsScreen 머리에서 정한 같은 값이다(재대입 없음). */
  function renderGoalDetailBody(goal, body){
    if(!L.state.msSel) L.state.msSel = {};
    if(!L.state.taskSel) L.state.taskSel = {};
    if(!L.state.collapsedMilestones) L.state.collapsedMilestones = {};
    L.state.msFilter = L.state.msFilter || 'all';

    var ddayText = goal.dueDate ? L.dDay(goal.dueDate) : '';
    var ddayPill = goal.dueDate ? '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);margin-left:8px;">'+ddayText+'</span>' : '';

    // 목표 도달 예정일 동적 재계산 알고리즘 (#TASK-ES-127)
    var msList = goal.milestones || [];
    var totalMs = msList.length;
    var doneMs = msList.filter(function(m){ return m.status === 'done'; }).length;
    var remainMs = totalMs - doneMs;
    var predictedPill = '';
    if(totalMs > 0){
      if(remainMs === 0){
        predictedPill = '<span class="dday-pill" style="background:rgba(34,197,94,0.15);color:#16a34a;font-weight:700;">🎯 100% 달성 완료</span>';
      } else {
        var createdMs = goal.createdAt ? new Date(goal.createdAt).getTime() : (Date.now() - 7 * 86400000);
        var elapsedDays = Math.max(1, Math.round((Date.now() - createdMs) / 86400000));
        var daysPerMilestone = (doneMs > 0) ? Math.max(1, Math.round(elapsedDays / doneMs)) : 7;
        var estDaysRemaining = remainMs * daysPerMilestone;
        var predictedDate = new Date(Date.now() + estDaysRemaining * 86400000);
        var predDateStr = (predictedDate.getMonth()+1) + '월 ' + predictedDate.getDate() + '일';
        predictedPill = '<span class="dday-pill" title="현재 마일스톤 완료 속도 기준 예상일" style="background:rgba(99,102,241,0.12);color:var(--primary);font-weight:700;">🚀 페이스 도달예정: ' + predDateStr + '</span>';
      }
    }

    /* 보기 모드: 토스식 목표 히어로 진행 원카드 (.toss-goal-hero-card, .meta-strip) */
    var visNow = goal.visibility || 'private';
    var formattedGoalDue = goal.dueDate ? formatDateTimeBadge(goal.dueDate) : '';
    var goalPct = L.goalAchievement(goal);
    var metaStrip = '<div class="toss-goal-hero-card meta-strip">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
          '<span style="font-size:1.2rem;">' + (goal.icon || '🎯') + '</span>' +
          '<span style="font-size:1.05rem;font-weight:800;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(goal.title) + '</span>' +
        '</div>' +
        '<div style="font-size:1.25rem;font-weight:900;color:var(--accent);">' + goalPct + '%</div>' +
      '</div>' +
      '<div style="width:100%;height:8px;background:var(--rule);border-radius:4px;overflow:hidden;margin-bottom:12px;">' +
        '<div style="width:'+goalPct+'%;height:100%;background:linear-gradient(90deg, #3182f6 0%, #60a5fa 100%);border-radius:4px;transition:width .3s ease;"></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
        L.formatSchedulePillHtml(goal, 'goal', goal.id) +
        '<button class="icon-btn" data-calsyncgoal="'+goal.id+'" type="button" aria-label="일정 반영" title="구글 캘린더 반영" style="padding:2px 4px;font-size:.75rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></button>' +
        '<span class="dday-pill" id="goalsPrivacyBadge" style="cursor:pointer;" title="탭하여 공개 범위 순환 변경">'+(visNow==='theme'?'🏷️ ':(visNow==='private'?'🔒 ':(visNow==='team'||visNow==='followers'?'👥 ':'🌐 ')))+((visNow==='team'||visNow==='followers')?'팀원 공개':(L.VISIBILITY_LABELS[visNow]||'같은 테마 공개'))+' ▾</span>' +
        (goal.topic ? L.topicPill(goal.topic) : '') +
        '<span class="dday-pill" style="background:var(--sage-soft);color:var(--sage);">달성 '+goalPct+'%</span>' +
        predictedPill +
        (!L.state.goalEditMode ?
          ('<button class="btn btn-ghost btn-sm" id="goalResultBtn" type="button" style="font-size:.75rem;padding:2px 8px;margin-left:auto;color:var(--ink-soft);border:1px solid var(--rule);">' +
            (goal.result ? '📝 결과 수정' : '+ 최종 결과') +
          '</button>') : '') +
      '</div>' +
    '</div>';
    var dueRow = '<div class="duedate-row"><span class="lbl">목표 마감일시 (년월일시분)</span>' +
      '<span style="display:flex;align-items:center;gap:6px;">' +
        (L.state.goalEditMode ?
          '<input type="datetime-local" id="goalDueInput" value="'+L.toDateTimeLocalValue(goal.dueDate)+'">' :
          '<span class="faint">'+(goal.dueDate ? formattedGoalDue : '설정 안 함')+'</span>') +
        ddayPill +
        L.formatSchedulePillHtml(goal, 'goal', goal.id) +
        '<button class="icon-btn" data-calsyncgoal="'+goal.id+'" type="button" aria-label="일정 반영" title="구글 캘린더 반영" style="padding:2px 4px;font-size:.75rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></button>' +
      '</span>' +
      '</div>';

    var vis = goal.visibility || 'private';
    var visRow = '<div class="duedate-row"><span class="lbl">공개 범위</span>' +
      (L.state.goalEditMode ?
        '<select id="goalVisInput">' +
          Object.keys(L.VISIBILITY_LABELS).map(function(k){
            return '<option value="'+k+'"'+(k===vis?' selected':'')+'>'+L.VISIBILITY_LABELS[k]+'</option>';
          }).join('') +
        '</select>' :
        '<span class="faint">'+(vis==='theme'?'🏷️ ':(vis==='private'?'🔒 ':(vis==='team'||vis==='followers'?'👥 ':'🌐 ')))+(L.VISIBILITY_LABELS[vis]||'같은 테마 공개')+'</span>') +
      '</div>';

    function ddayMini(dateStr){
      if(!dateStr) return '';
      var d = L.dDay(dateStr);
      var over = d && d.indexOf('D+')===0;
      return '<span class="dday-mini'+(over?' over':'')+'">'+d+'</span>';
    }

    var totalMs = goal.milestones.length;
    var doingCount = goal.milestones.filter(function(m){ return m.status==='doing'; }).length;
    var todoCount = goal.milestones.filter(function(m){ return m.status==='todo'; }).length;
    var doneCount = goal.milestones.filter(function(m){ return m.status==='done'; }).length;
    var allCollapsed = totalMs > 0 && goal.milestones.every(function(m){ return L.state.collapsedMilestones[m.id]; });
    var density = L.state.msDensity || 'compact';

    var densityBtnHtml = '<button class="btn btn-ghost btn-sm" id="msDensityToggleBtn" type="button" style="font-size:.75rem;padding:3px 8px;color:var(--ink-soft);" title="보기 모드 전환">' +
      (density === 'compact' ? '⊞ 상세' : '⊟ 간결') +
    '</button>';

    var gView = L.state.goalViewMode || 'default';
    var msFilterBar = totalMs > 0 ?
      '<div class="ms-filter-bar goals-filter-strip" style="display:flex;flex-direction:column;gap:5px;margin:4px 0 8px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;">' +
          '<div class="format-toggle seg-compact" id="msFilterToggle" style="flex:1;max-width:280px;min-width:200px;">' +
            '<div class="format-opt'+(L.state.msFilter==='all'?' active':'')+'" data-msfilter="all">전체 ('+totalMs+')</div>' +
            '<div class="format-opt'+(L.state.msFilter==='doing'?' active':'')+'" data-msfilter="doing">진행 ('+doingCount+')</div>' +
            '<div class="format-opt'+(L.state.msFilter==='todo'?' active':'')+'" data-msfilter="todo">대기 ('+todoCount+')</div>' +
            '<div class="format-opt'+(L.state.msFilter==='done'?' active':'')+'" data-msfilter="done">완료 ('+doneCount+')</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">' +
            densityBtnHtml +
            '<button class="btn btn-ghost btn-sm" id="msCollapseAllBtn" type="button" style="font-size:.75rem;padding:3px 8px;">' +
              (allCollapsed ? '모두 펼치기' : '모두 접기') +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div id="msViewToggle" style="display:flex;align-items:center;justify-content:space-between;gap:4px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;">' +
          '<div class="format-toggle seg-compact ms-view-main-group" style="flex:1;max-width:280px;min-width:180px;">' +
            '<div class="format-opt'+(gView==='default'?' active':'')+'" data-msview="default">기본</div>' +
            '<div class="format-opt'+(gView==='milestones_only'?' active':'')+'" data-msview="milestones_only">마일스톤</div>' +
            '<div class="format-opt'+(gView==='tasks_only'?' active':'')+'" data-msview="tasks_only">할일</div>' +
          '</div>' +
          '<div class="format-toggle seg-compact goals-only-wrap" style="flex-shrink:0;margin-left:4px;">' +
            '<div class="format-opt'+(gView==='goals_only'?' active':'')+'" data-msview="goals_only" style="font-weight:700;">🎯 목표만</div>' +
          '</div>' +
        '</div>' +
      '</div>' : '';

    var msHtml = (gView === 'goals_only') ?
      [(function(){
        var allGoals = (L.state.profile && L.state.profile.goals) || [];
        if(!allGoals.length) return '<div class="faint" style="padding:16px;text-align:center;">등록된 목표가 없습니다.</div>';
        return '<div class="goals-only-overview" style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);display:flex;align-items:center;justify-content:space-between;">' +
            '<span>전체 목표 마일스톤 현황 (' + allGoals.length + '개)</span>' +
            '<span style="font-size:.75rem;color:var(--ink-faint);font-weight:400;">카드를 클릭하면 해당 목표로 전환됩니다</span>' +
          '</div>' +
          allGoals.map(function(g){
            var gMs = g.milestones || [];
            var gDone = gMs.filter(function(m){ return m.status === 'done'; }).length;
            var gPct = gMs.length ? Math.round((gDone / gMs.length) * 100) : 0;
            var isCur = g.id === L.state.activeGoalId;
            var d = g.deadline ? ddayMini(g.deadline) : '';
            return '<div class="card goal-milestone-overview-card" data-selectgoal="'+g.id+'" style="padding:12px;background:var(--card);border:'+(isCur?'2px solid var(--accent)':'1px solid var(--rule)')+';border-radius:14px;cursor:pointer;transition:all .15s ease;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
                '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
                  '<span style="font-size:1.1rem;">' + (g.icon || '🎯') + '</span>' +
                  '<b style="font-size:.9rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(g.title) + '</b>' +
                  (isCur ? '<span class="badge" style="font-size:.6875rem;background:var(--accent);color:#fff;padding:1px 6px;border-radius:6px;font-weight:700;">선택됨</span>' : '') +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
                  d +
                  '<span style="font-size:.8125rem;font-weight:800;color:var(--accent);">' + gPct + '%</span>' +
                '</div>' +
              '</div>' +
              '<div style="width:100%;height:6px;background:var(--rule);border-radius:3px;overflow:hidden;margin-bottom:8px;">' +
                '<div style="width:'+gPct+'%;height:100%;background:var(--accent);transition:width .25s ease;"></div>' +
              '</div>' +
              (gMs.length ?
                '<div class="goal-sub-milestones-container" style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">' +
                  gMs.map(function(m){
                    var stBadge = m.status === 'done' ? '<span class="badge" style="font-size:.65rem;background:#10b981;color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;">완료</span>' :
                                  (m.status === 'doing' ? '<span class="badge" style="font-size:.65rem;background:var(--accent);color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;">진행중</span>' :
                                  '<span class="badge" style="font-size:.65rem;background:var(--rule);color:var(--ink-soft);padding:1px 6px;border-radius:4px;font-weight:600;">대기</span>');
                    var mTasks = m.tasks || [];
                    var tDone = mTasks.filter(function(t){ return t.done; }).length;
                    var tPct = mTasks.length ? Math.round((tDone / mTasks.length) * 100) : (m.status === 'done' ? 100 : 0);
                    var mDday = m.deadline ? ddayMini(m.deadline) : '';
                    return '<div class="goal-sub-milestone-item" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:var(--bg-subtle, rgba(0,0,0,0.02));border:1px solid var(--rule);border-radius:8px;">' +
                      '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;">' +
                        stBadge +
                        '<span style="font-size:.8125rem;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(m.title) + '</span>' +
                      '</div>' +
                      '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
                        (mDday ? mDday : '') +
                        '<span style="font-size:.72rem;color:var(--ink-faint);">' + (mTasks.length ? tDone + '/' + mTasks.length + ' (' + tPct + '%)' : '') + '</span>' +
                      '</div>' +
                    '</div>';
                  }).join('') +
                '</div>' :
                '<div class="faint" style="font-size:.75rem;padding:6px 0;">등록된 마일스톤이 없습니다.</div>') +
            '</div>';
          }).join('') +
        '</div>';
      })()] :
      (gView === 'tasks_only') ?
      [(function(){
        var allTasks = [];
        goal.milestones.forEach(function(m){
          if(L.state.msFilter !== 'all' && m.status !== L.state.msFilter) return;
          (m.tasks||[]).forEach(function(t){
            allTasks.push({ task: t, ms: m });
          });
        });
        if(!allTasks.length) return '<div class="faint" style="padding:14px;text-align:center;font-size:.8125rem;">해당 조건에 등록된 세부 할 일이 없습니다.</div>';
        return '<div class="card" style="padding:8px 12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;margin-top:6px;">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">집중 할 일 목록 (' + allTasks.length + '건)</div>' +
          allTasks.map(function(item){
            var t = item.task;
            var m = item.ms;
            return '<div class="task-row compact-task-row" data-taskid="'+t.id+'" data-msid="'+m.id+'" style="margin-bottom:4px;">' +
              '<div class="task-check'+(t.done?' done':'')+'" data-taskcheck="1">'+(t.done?'✓':'')+'</div>' +
              '<span class="task-title-inline'+(t.done?' done-text':'')+'" style="flex:1;">'+L.escapeHtml(t.title)+'</span>' +
              '<span class="faint" style="font-size:.6875rem;background:var(--surface-2);padding:1px 5px;border-radius:4px;">'+L.escapeHtml(m.title)+'</span>' +
            '</div>';
          }).join('') +
        '</div>';
      })()] :
      goal.milestones.map(function(m, idx){
      if(L.state.msFilter !== 'all' && m.status !== L.state.msFilter) return '';
      var statusIcon = m.status==='done' ? '✓' : '';
      var titleClass = m.status==='done' ? 'ms-title-compact done-text' : 'ms-title-compact';
      var isCollapsed = !!L.state.collapsedMilestones[m.id];
      var totalTasks = (m.tasks||[]).length;
      var doneTasks = (m.tasks||[]).filter(function(t){ return t.done; }).length;

      function renderSingleTaskRow(t){
        var tSel = !!L.state.taskSel[t.id];
        var tAttHtml = L.renderInlineAttachmentChips(t.attachments, 'task', t.id, m.id);
        var taskDueHtml = L.state.goalEditMode ?
          ('<input type="datetime-local" data-taskdate="1" value="'+L.toDateTimeLocalValue(t.dueDate)+'" style="font-size:.7rem;padding:1px 3px;max-width:130px;">' + (t.dueDate ? ddayMini(t.dueDate) : '')) : '';
        var tResHtml = t.result ? ('<button data-taskresult="1" type="button" style="border:none;background:none;padding:0;">'+resultBadgeHtml(t.result)+'</button>') : (L.state.goalEditMode ? '<button data-taskresult="1" type="button" style="border:none;background:none;padding:0;font-size:.7rem;color:var(--ink-faint);">+결과</button>' : '');

        return '<div class="task-row compact-task-row'+(tSel?' selected':'')+'" data-taskid="'+t.id+'" data-msid="'+m.id+'">' +
          (L.state.goalEditMode ? '<div class="sel-check'+(tSel?' on':'')+'" data-seltask="'+t.id+'">'+(tSel?'✓':'')+'</div>' : '') +
          '<div class="task-check'+(t.done?' done':'')+'" data-taskcheck="1">'+(t.done?'✓':'')+'</div>' +
          '<input class="task-title-inline'+(t.done?' done-text':'')+'" data-taskinput="1" value="'+L.escapeHtml(t.title)+'" '+(L.state.goalEditMode?'':'readonly')+'>' +
          '<div class="task-meta-inline">' +
            taskDueHtml +
            tAttHtml +
            '<button class="att-add-btn compact-att-btn" data-addatttask="'+t.id+'" data-msid="'+m.id+'" type="button" title="참고자료 첨부">+참고</button>' +
            L.formatSchedulePillHtml(t, 'task', goal.id, m.id, t.id) +
            '<button class="icon-btn" data-calsynctask="'+t.id+'" data-msid="'+m.id+'" type="button" aria-label="일정 반영" title="구글 캘린더 반영" style="padding:1px 3px;font-size:.75rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></button>' +
            tResHtml +
            (L.state.goalEditMode ? '<button class="icon-btn" data-deltask="1" aria-label="삭제" style="padding:1px 4px;font-size:.8rem;">×</button>' : '') +
          '</div>' +
        '</div>';
      }

      var taskRows = '';
      if(gView !== 'milestones_only'){
        var allMTasks = m.tasks || [];
        var activeMTasks = allMTasks.filter(function(t){ return !t.done; });
        var doneMTasks = allMTasks.filter(function(t){ return t.done; });
        var activeTaskHtml = activeMTasks.map(renderSingleTaskRow).join('');
        var doneTaskHtml = doneMTasks.map(renderSingleTaskRow).join('');

        if(L.state.goalEditMode || doneMTasks.length === 0){
          taskRows = activeTaskHtml + doneTaskHtml;
        } else {
          var isDoneExpanded = !!(L.state.expandedDoneTasks && L.state.expandedDoneTasks[m.id]);
          var doneToggleBar = '<div class="done-tasks-toggle-bar" data-toggledonetasks="'+m.id+'">' +
            '<span>✓ 완료된 할 일 ' + doneMTasks.length + '개 ' + (isDoneExpanded ? '접기' : '보기') + '</span>' +
            '<span style="font-size:.6875rem;">' + (isDoneExpanded ? '▲' : '▼') + '</span>' +
          '</div>';
          taskRows = activeTaskHtml + doneToggleBar + (isDoneExpanded ? '<div class="done-tasks-list">' + doneTaskHtml + '</div>' : '');
        }
      }

      var mSel = !!L.state.msSel[m.id];
      var ddayBadge = m.dueDate ? ('<span class="dday-pill milestone-dday-badge" style="font-size:12px;margin-left:4px;background:var(--brand-soft);color:var(--brand-strong);font-weight:700;padding:2px 8px;border-radius:6px;">' + L.dDay(m.dueDate) + '</span>') : '';
      var msPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      var progBadge = totalTasks > 0 ? (
        '<span class="faint" style="font-size:.6875rem;background:var(--card2);padding:1px 6px;border-radius:5px;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;">' +
          (msPct===100 ? '✓ ' : '') + '완료 ' + doneTasks + '/' + totalTasks +
        '</span>'
      ) : '';
      var msProgressBar = totalTasks > 0 ? (
        '<div class="ms-mini-progress-bar">' +
          '<div style="width:' + msPct + '%;height:100%;background:' + (msPct===100 ? 'var(--green, #10b981)' : 'var(--brand)') + ';transition:width .2s ease;"></div>' +
        '</div>'
      ) : '';
      var curPrio = m.priority || 'med';
      var prioLabel = curPrio === 'high' ? '높음' : (curPrio === 'low' ? '낮음' : '보통');
      var prioTagHtml = '<span class="ms-priority-tag ms-priority-' + curPrio + '" data-cyclepriority="' + m.id + '" title="우선순위 변경 (클릭)">' + prioLabel + '</span>';
      var calBtnHtml = '<button class="icon-btn" data-calsyncms="'+m.id+'" type="button" aria-label="일정 반영" title="구글 캘린더 반영" style="padding:2px 4px;font-size:.75rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></button>';
      var resBtnHtml = '<button data-msresult="1" type="button" style="border:none;background:none;padding:0;">'+resultBadgeHtml(m.result)+'</button>';

      var msDueHtml = L.state.goalEditMode ?
        ('<div class="ms-date" style="display:inline-flex;align-items:center;gap:4px;"><input type="datetime-local" data-msdate="1" value="'+L.toDateTimeLocalValue(m.dueDate)+'" style="font-size:.75rem;padding:2px 4px;max-width:140px;">' + (m.dueDate ? ddayMini(m.dueDate) : '') + '</div>') : '';
      var attSnippet = L.renderInlineAttachmentChips(m.attachments, 'ms', m.id);

      return '<div class="ms-row'+(m.status==='doing'?' doing':'')+(mSel?' selected':'')+'" data-msid="'+m.id+'" '+(L.state.goalEditMode?'draggable="true"':'')+'>' +
        '<div class="ms-grid-row">' +
          '<div class="ms-main-line">' +
            '<div class="ms-main-left">' +
              (L.state.goalEditMode ? '<div class="sel-check'+(mSel?' on':'')+'" data-selms="'+m.id+'">'+(mSel?'✓':'')+'</div>' : '') +
              (L.state.goalEditMode ? '<div class="drag-handle" title="드래그해서 순서 변경"><span></span><span></span><span></span></div>' : '') +
              (totalTasks > 0 ? '<button class="icon-btn" data-mstoggle="'+m.id+'" type="button" title="'+(isCollapsed?'하위 할 일 펼치기':'하위 할 일 접기')+'" style="padding:2px 5px;font-size:.75rem;color:var(--ink-soft);flex:0 0 auto;">'+(isCollapsed ? '▼' : '▲')+'</button>' : '') +
              '<div class="ms-status '+m.status+'" data-cyclestatus="1">'+statusIcon+'</div>' +
              '<input class="'+titleClass+'" data-msinput="1" value="'+L.escapeHtml(m.title)+'" '+(L.state.goalEditMode?'':'readonly')+'>' +
            '</div>' +
            '<div class="ms-main-right">' +
              progBadge +
              ddayBadge +
            '</div>' +
          '</div>' +
          msProgressBar +
          '<div class="ms-sub-meta-line">' +
            '<div class="ms-sub-meta-left">' +
              prioTagHtml +
              msDueHtml +
              attSnippet +
              '<button class="att-add-btn" data-addattms="'+m.id+'" type="button" style="padding:0 6px;min-height:20px;font-size:.6875rem;">+참고</button>' +
              resBtnHtml +
            '</div>' +
            '<div class="ms-sub-meta-right">' +
              L.formatSchedulePillHtml(m, 'ms', goal.id, m.id) +
              calBtnHtml +
              (L.state.goalEditMode ?
                ((idx>0?'<button class="icon-btn" data-msup="1" aria-label="위로">↑</button>':'') +
                 (idx<goal.milestones.length-1?'<button class="icon-btn" data-msdown="1" aria-label="아래로">↓</button>':'') +
                 '<button class="icon-btn" data-msdel="1" aria-label="삭제">×</button>') : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="task-list" style="margin-left:18px;'+(isCollapsed?'display:none;':'')+'">'+taskRows+'</div>' +
        (L.state.goalEditMode && !isCollapsed ? '<div class="task-add" data-addtask="1" style="margin-left:18px;font-size:.75rem;">+ 할 일 추가</div>' : '') +
      '</div>';
    }).join('');

    var goalStatusHash = L.computeGoalStatusHash(goal);
    if(!L.state.profile.settings.goalStatusSummaries) L.state.profile.settings.goalStatusSummaries = {};
    var goalStatusCache = L.state.profile.settings.goalStatusSummaries[goal.id];
    var todayKST = L.getKSTDateKey(L.nowISO());
    var todayEffective = typeof L.getEffectiveStandardDateKey === 'function' ? L.getEffectiveStandardDateKey(L.nowISO()) : todayKST;
    var isPending = !!(L.state.goalStatusPending && L.state.goalStatusPending[goal.id]);
    var hasValidCache = !!(goalStatusCache && goalStatusCache.text);
    var isDateStale = !!(goalStatusCache && (goalStatusCache.dateKey && goalStatusCache.dateKey !== todayKST));
    var goalStatusStale = !hasValidCache || goalStatusCache.hash !== goalStatusHash;
    var isStatusExpanded = !!L.state.goalStatusExpanded;
    var statusText = hasValidCache ? L.escapeHtml(goalStatusCache.text) : (goal.milestones.length ? '기록을 쌓으면 AI가 목표·마일스톤·할 일을 종합해 지금 상태를 요약해드려요.' : '마일스톤을 추가하면 AI가 진행 상황을 요약해드려요.');

    var statusBadgeText = '분석완료';
    var statusBadgeBg = 'rgba(16,185,129,.15)';
    var statusBadgeColor = '#10b981';
    var statusBadgeBorder = 'rgba(16,185,129,.3)';
    var statusSnippet = hasValidCache ? (L.escapeHtml(goalStatusCache.text).slice(0, 38) + (goalStatusCache.text.length > 38 ? '…' : '')) : '탭하여 현상태 분석 AI 조언 보기';

    if(!goal.milestones.length){
      statusBadgeText = '마일스톤 필요';
      statusBadgeBg = 'rgba(148,163,184,.15)';
      statusBadgeColor = 'var(--ink-faint)';
      statusBadgeBorder = 'rgba(148,163,184,.25)';
      statusSnippet = '마일스톤을 추가하면 분석을 시작해요';
    } else if(isPending || (goalStatusStale && !hasValidCache)){
      statusBadgeText = '진행 상황 분석 중…';
      statusBadgeBg = 'rgba(245,158,11,.15)';
      statusBadgeColor = '#f59e0b';
      statusBadgeBorder = 'rgba(245,158,11,.3)';
      if(!hasValidCache){
        statusSnippet = '목표·마일스톤 진행상황을 분석하고 있어요';
      }
    }

    var goalStatusRow = '<div class="goal-status-minibar' + (isStatusExpanded ? ' expanded' : '') + '" id="goalStatusMinibar" style="background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:12px;overflow:hidden;">' +
      '<div class="status-minibar-head" id="goalStatusToggleBtn" style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;user-select:none;flex-wrap:wrap;">' +
        '<span class="minibar-icon" style="font-size:1.05rem;">🤖</span>' +
        '<span class="minibar-title" style="font-weight:700;font-size:.875rem;color:var(--ink);">현상태 분석 AI 조언</span>' +
        '<span class="minibar-status-tag" id="goalStatusBadge" style="font-size:.6875rem;font-weight:600;padding:2px 8px;border-radius:999px;border:1px solid ' + statusBadgeBorder + ';background:' + statusBadgeBg + ';color:' + statusBadgeColor + ';white-space:nowrap;">' + statusBadgeText + '</span>' +
        '<span class="minibar-snippet" id="goalStatusSnippet" style="font-size:.78125rem;color:var(--ink-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:120px;">' + statusSnippet + '</span>' +
        '<span class="minibar-chevron" style="font-size:.75rem;color:var(--ink-faint);margin-left:auto;">' + (isStatusExpanded ? '▲' : '▼') + '</span>' +
      '</div>' +
      '<div class="status-minibar-body" style="' + (isStatusExpanded ? '' : 'display:none;') + 'padding:0 14px 12px 14px;border-top:1px solid var(--border);background:var(--bg-subtle, rgba(0,0,0,.02));">' +
        '<p class="faint" id="goalStatusText" style="margin:10px 0 0 0;line-height:1.6;font-size:.8125rem;">' + statusText + '</p>' +
      '</div>' +
    '</div>';

    var exportCardHtml = '<div class="export-card" style="margin-top:16px;margin-bottom:14px;">' +
      '<div class="ico"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M2 12h2M20 12h2"/></svg></div>' +
      '<div class="txt"><b>현 상태로 데이터 받기</b><span>목표·마일스톤·할 일·결과·체크인을 AI 분석용으로 내보내요</span></div>' +
      '<button class="btn btn-ghost btn-sm" id="goalExportBtn" type="button" style="margin-left:auto;">이 목표</button>' +
      '<button class="btn btn-ghost btn-sm" id="goalExportAllBtn" type="button" style="margin-left:6px;">전체</button>' +
    '</div>';

    var selCount = Object.keys(L.state.msSel).length + Object.keys(L.state.taskSel).length;
    var selBar = L.state.goalEditMode ?
      '<div class="sel-bar">' +
        '<b>'+(selCount ? '선택 '+selCount+'개' : '삭제할 항목을 선택하세요')+'</b>' +
        (selCount ? '<button class="btn btn-danger" id="selDeleteBtn" type="button">선택 삭제</button>' : '') +
        '<button class="btn btn-ghost" id="selAllBtn" type="button" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25);">'+(selCount ? '해제' : '전체 선택')+'</button>' +
        '<button class="btn btn-danger" id="selDeleteAllBtn" type="button">전체 삭제</button>' +
      '</div>' : '';

    body.innerHTML =
      (L.state.goalEditMode ? (window.OurgoalGoalEditUX?OurgoalGoalEditUX.renderTitleRow(L.state,goal):'') + dueRow + visRow : metaStrip) +
      (L.state.goalEditMode ? '' : goalStatusRow) +
      msFilterBar +
      '<div class="ms-list">'+msHtml+'</div>' +
      (goal.milestones.length===0 ? '<div class="empty-state"><div class="e-icon">🧭</div><p>마일스톤을 추가해서 목표를 잘게 나눠보세요.</p></div>' : '') +
      (L.state.goalEditMode ? '<div class="add-ms-btn" id="addMsBtn">+ 마일스톤 추가</div>' + (window.OurgoalGoalEditUX?OurgoalGoalEditUX.renderDoneInlineBtn(L.state,goal):'') + '<div class="drag-hint">탭해서 바로 수정 · 화살표로 순서 변경 · 왼쪽 체크로 선택 삭제</div>' : '') +
      selBar +
      exportCardHtml +
      L.renderPromptEncyclopediaHtml('goals');
    return { allCollapsed: allCollapsed, goalStatusHash: goalStatusHash, isDateStale: isDateStale, goalStatusStale: goalStatusStale };
  }

  K.resultBadgeHtml = resultBadgeHtml;
  K.formatDateTimeBadge = formatDateTimeBadge;
  K.renderGoalDetailBody = renderGoalDetailBody;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
