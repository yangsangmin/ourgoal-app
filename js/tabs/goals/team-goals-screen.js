/**
 * OurGoal Team Goals Screen (목표 탭 — 「팀목표」 하위 탭 화면)
 *
 * 목표 탭 「팀목표」 하위 탭 화면(renderTeamGoalsScreen) — 팀이 없으면 팀 만들기 빈 안내를, 팀이 있으면 팀 필터 칩·팀 목표 카드·마일스톤·할 일·댓글·수준별 목표 진입을 그리고 배선한다.
 * js/tabs/goals/render.js 와 다른 파일이 window·L 이름으로 부른다 — window 노출 줄은 index.html 원래 자리에 그대로 있다. 일괄 접기(collapseAllTeamGoalAccordions)는 시험지가 원래 자리 노출 줄까지 잘라 읽어 원래 자리에 남겼다.
 * 게스트(팀 0개)로 잴 수 있는 것은 빈 안내 분기뿐이다 — 팀이 있는 분기는 실계정 팀 소속이 있어야 잰다.
 * #TASK-ES-497(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 10571~11342줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 10571~11342줄(#TASK-ES-497 생성기 표지) ---- */

  function renderTeamGoalsScreen(){
    if(typeof L.loadSharedGroups === 'function' && !window.SHARED_GROUPS_LOADED){
      L.loadSharedGroups().then(function(){
        if(L.state.activeTab==='goals' && L.state.goalsSubTab==='team') renderTeamGoalsScreen();
      });
    }
    var view = document.getElementById('teamGoalsView');
    var myTeams = L.MOCK_GROUPS.filter(function(g){ return L.groupState(g.id).joined; });
    if(!myTeams.length){
      view.innerHTML = L.renderTeamGoalsEmptyGuideHtml();
      L.wireTeamGoalsGuideEvents(view);
      return;
    }
    myTeams.forEach(function(g){
      if(!L.TEAM_COMMENTS_CACHE[g.id]){
        L.ensureTeamCommentsLoaded(g.id).then(function(){
          if(L.state.activeTab==='goals' && L.state.goalsSubTab==='team') renderTeamGoalsScreen();
        });
      }
    });

    var roleLabels = { owner:'팀장', manager:'매니저', member:'팀원' };
    var canManageAny = myTeams.some(function(g){ return L.canManageTeamGoals(g.id); });
    var activeFilter = L.state.teamGoalFilterGid || 'all';
    var displayTeams = (activeFilter && activeFilter !== 'all')
      ? myTeams.filter(function(g){ return g.id === activeFilter; })
      : myTeams;
    if(!displayTeams.length){
      displayTeams = myTeams;
      L.state.teamGoalFilterGid = 'all';
      activeFilter = 'all';
    }

    var heroCardHtml = L.renderTeamCreateHeroCardHtml('goals');
    var headerAndFilterHtml =
      heroCardHtml +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;">' +
        '<span style="font-weight:700;font-size:1.0625rem;color:var(--ink);">참여 중인 팀 목표</span>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button class="btn btn-ghost btn-sm" id="btnShowTeamGuideModal" type="button" style="font-size:.8125rem;padding:3px 9px;">활용 가이드</button>' +
          (canManageAny ? '<button class="edit-toggle '+(L.state.teamGoalEditMode?'on':'off')+'" id="teamGoalEditToggle" type="button" style="font-size:.8125rem;padding:3px 10px;">'+(L.state.teamGoalEditMode?'✓ 편집 완료':'편집')+'</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="team-quick-action-bar" id="teamLinkedGoalQuickBar">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
          '<span style="font-size:1.25rem;">💡</span>' +
          '<div style="min-width:0;">' +
            '<div style="font-weight:700;font-size:0.875rem;color:var(--ink);">팀 목표와 나를 잇는 실천</div>' +
            '<div class="faint" style="font-size:0.75rem;">팀 연계 개인목표를 만들고 함께 완주해요 (+15 EXP)</div>' +
          '</div>' +
        '</div>' +
        '<button class="team-personal-goal-quick-btn" id="btnQuickCreateTeamLinkedGoal" type="button">' +
          '+ 개인목표 만들기' +
        '</button>' +
      '</div>' +
      '<div class="goal-chip-row" id="tgFilterChipRow" style="margin-bottom:12px;">' +
        '<button class="goal-chip'+(activeFilter==='all'?' active':'')+'" data-tgfilter="all" type="button">전체 보기 ('+myTeams.length+')</button>' +
        myTeams.map(function(tg){
          var isOwn = L.groupState(tg.id).myRole === 'owner';
          var active = activeFilter === tg.id;
          return '<button class="goal-chip'+(active?' active':'')+'" data-tgfilter="'+tg.id+'" type="button">' +
            (isOwn ? '👑 ' : '') + tg.icon + ' ' + L.escapeHtml(tg.name) +
          '</button>';
        }).join('') +
      '</div>';

    var cardsHtml = displayTeams.map(function(g){
      var canManage = L.canManageTeamGoals(g.id);
      var isOwner = L.groupState(g.id).myRole === 'owner';
      var gs = L.groupState(g.id);
      var isPreviewGroup = L.isMockGroup(g) || g.id === 'g-workshop' || g.id === 'g-travel' || g.id === 'g0' || !!gs.isPreview;
      var isMockTeam = isPreviewGroup || (g.isMock || (typeof g.id === 'string' && g.id.indexOf('g-') === 0));
      var mockTeamBadgeHtml = isMockTeam ? '<span class="badge-mock-team">[예시 팀]</span>' : '';
      var roleLabel = roleLabels[gs.myRole || 'member'];
      var goals = g.teamGoals || [];
      var teamLeaderDeps = {
        mockGroups: L.MOCK_GROUPS,
        getGroupState: L.groupState,
        getProfile: function(){ return L.state.profile; },
        getLevelGoals: L.getGroupLevelGoals,
        canManage: L.canManageTeamGoals,
        openModal: L.openModal,
        closeModal: L.closeModal,
        saveProfile: L.saveProfile,
        toast: L.toast,
        haptic: (typeof hapticFeedback === 'function') ? hapticFeedback : null,
        onRefresh: renderTeamGoalsScreen
      };
      var leaderDashboardHtml = (canManage && window.OurgoalTeamLeaderCheck)
        ? OurgoalTeamLeaderCheck.renderLeaderDashboardHtml(g, teamLeaderDeps)
        : '';
      var memberFeedbackBannerHtml = (!canManage && window.OurgoalTeamLeaderCheck)
        ? OurgoalTeamLeaderCheck.renderMemberFeedbackBannerHtml(g, teamLeaderDeps)
        : '';

      var previewBadgeHtml = isPreviewGroup ?
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:10px;padding:8px 10px;background:var(--gold-soft);border:1px solid var(--gold-line);border-radius:10px;">' +
          '<span style="font-size:.8125rem;font-weight:700;color:var(--gold);display:flex;align-items:center;gap:4px;">💡 이런 팀을 만들 수 있어요 (체험용 예시 팀)</span>' +
          '<div style="display:flex;gap:4px;align-items:center;">' +
            '<button class="btn btn-primary btn-sm" data-tplgroup-create="'+g.id+'" type="button" style="font-size:.75rem;padding:2px 8px;font-weight:700;">✨ 팀 개설</button>' +
            '<button class="btn btn-ghost btn-sm" data-tgleavepreview="'+g.id+'" type="button" style="font-size:.75rem;padding:2px 8px;color:var(--brand-strong);border-color:var(--red-line);background:var(--card);">체험 팀 나가기</button>' +
          '</div>' +
        '</div>' : '';

      var leaderCrownHtml = isOwner ?
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">' +
          '<span style="font-size:1.125rem;" title="내가 만든 팀 (팀장)"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="m4 8 4 5 4-7 4 7 4-5-1 10H5z"/></svg></span>' +
          '<span style="font-size:.8125rem;font-weight:700;color:var(--sage);background:var(--sage-soft);border:1px solid var(--sage-soft);padding:2px 8px;border-radius:999px;">팀장</span>' +
        '</div>' : '';

      var isEdit = canManage && !!L.state.teamGoalEditMode;
      var goalsHtml = goals.map(function(tg){
        var done = tg.milestones.filter(function(m){ return m.status==='done'; }).length;
        var total = tg.milestones.length;
        var pct = total ? Math.round(done/total*100) : 0;
        var tgPingBtn = (!canManage && window.OurgoalTeamLeaderCheck)
          ? OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(g.id, 'teamgoal', tg.id, tg.title, pct === 100)
          : '';
        var msHtml = tg.milestones.map(function(m){
          var msPingBtn = (!canManage && window.OurgoalTeamLeaderCheck)
            ? OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(g.id, 'milestone', m.id, m.title, m.status === 'done')
            : '';
          var tasks = m.tasks || [];
          var nT = tasks.length;
          var nDone = tasks.filter(function(t){ return t.done; }).length;
          var taskRows = tasks.map(function(t){
            return '<div class="task-row" style="padding:4px 0;display:flex;align-items:center;gap:6px;">' +
              '<div class="task-check'+(t.done?' done':'')+'"'+(canManage?' data-tgtoggletask="'+tg.id+':'+m.id+':'+t.id+'" style="cursor:pointer;"':'')+'>'+(t.done?'✓':'')+'</div>' +
              (isEdit
                ? '<input class="task-title'+(t.done?' done-text':'')+'" data-tgtasktitle="'+tg.id+':'+m.id+':'+t.id+'" value="'+L.escapeHtml(t.title)+'" style="flex:1;font-size:.8125rem;">'
                : '<span class="task-title'+(t.done?' done-text':'')+'" style="flex:1;font-size:.8125rem;">'+L.escapeHtml(t.title)+'</span>') +
              (isEdit ? '<button class="icon-btn" data-tgdeltask="'+tg.id+':'+m.id+':'+t.id+'" type="button" title="삭제" style="padding:2px 4px;">×</button>' : '') +
            '</div>';
          }).join('');

          var taskToggleBtn = nT > 0 ?
            '<button class="tg-task-toggle-btn" data-tgtoggletasks="'+tg.id+':'+m.id+'" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-top:2px;">' +
              '세부 할 일 ' + nDone + '/' + nT + ' <span class="t-arrow">▼</span>' +
            '</button>' : (isEdit ? '<button class="tg-task-toggle-btn" data-tgaddtaskmodal="'+tg.id+':'+m.id+'" type="button" style="background:transparent;border:none;color:var(--ink-faint);font-size:.75rem;padding:2px 0;cursor:pointer;">+ 할 일 추가</button>' : '');

          var tasksBox =
            '<div class="tg-subtask-box" data-tgtaskbox="'+tg.id+':'+m.id+'" style="'+(isEdit?'':'display:none;')+'margin-top:6px;padding:6px 10px;background:var(--card2);border-radius:8px;border:1px dashed var(--rule);">' +
              taskRows +
              (isEdit ? '<div data-tgaddtask="'+tg.id+':'+m.id+'" style="cursor:pointer;font-size:.75rem;color:var(--brand-strong);margin-top:4px;font-weight:700;">+ 세부 할 일 추가</div>' : '') +
            '</div>';

          var reorderBtns = isEdit ?
            '<div style="display:flex;align-items:center;gap:4px;margin-right:6px;">' +
              '<button class="tg-reorder-btn" data-tgmup="'+g.id+':'+tg.id+':'+m.id+'" type="button" title="위로" aria-label="위로 이동">▲</button>' +
              '<button class="tg-reorder-btn" data-tgmdown="'+g.id+':'+tg.id+':'+m.id+'" type="button" title="아래로" aria-label="아래로 이동">▼</button>' +
            '</div>' : '';

          var priorityBadgeOrSelect = isEdit ?
            '<select data-tgmprio="'+g.id+':'+tg.id+':'+m.id+'" style="font-size:.75rem;padding:2px 4px;border-radius:6px;border:1px solid var(--rule);background:var(--card);margin-right:6px;"><option value="high"'+(m.priority==='high'?' selected':'')+'>높음</option><option value="medium"'+(!m.priority||m.priority==='medium'?' selected':'')+'>보통</option><option value="low"'+(m.priority==='low'?' selected':'')+'>낮음</option></select>' :
            (m.priority ? '<span class="ms-priority-tag ms-priority-'+m.priority+'" style="margin-right:4px;">'+(m.priority==='high'?'높음':(m.priority==='low'?'낮음':'보통'))+'</span>' : '');

          return '<div class="ms-row" data-tgmid="'+m.id+'" style="padding:8px 10px;">' +
              '<div class="ms-main">' +
                reorderBtns +
                '<div class="ms-status '+m.status+'"'+(canManage?' data-tgcycle="1" style="cursor:pointer;"':'')+'>'+(m.status==='done'?'✓':'')+'</div>' +
                priorityBadgeOrSelect +
                '<div style="flex:1;min-width:0;">' +
                  (isEdit
                    ? '<input class="'+(m.status==='done'?'ms-title done-text':'ms-title')+'" data-tgmtitle="1" value="'+L.escapeHtml(m.title)+'" style="border-bottom:1.5px solid var(--brand);background:var(--surface-2);border-radius:6px;padding:3px 6px;">'
                    : '<span class="'+(m.status==='done'?'ms-title done-text':'ms-title')+'" style="display:inline-block;">'+L.escapeHtml(m.title)+'</span>') +
                  taskToggleBtn +
                '</div>' +
                msPingBtn +
                (isEdit ? '<div class="ms-actions"><button class="icon-btn" data-tgmdel="1" aria-label="마일스톤 삭제">×</button></div>' : '') +
              '</div>' +
              tasksBox +
              L.teamCommentsBlockHtml(g.id, m.id) +
            '</div>';
        }).join('');
        var tlSec = (window.OurgoalTeamLinkedGoals ? window.OurgoalTeamLinkedGoals.renderTeamGoalCardSections(g, tg, canManage) : { teamLinkedBtnHtml: '', participantsSectionHtml: '' });
        var inlineDueHtml = isEdit
          ? '<div style="display:flex;align-items:center;gap:6px;margin:6px 0 8px;"><span class="faint" style="font-size:.75rem;">마감일</span><input type="date" data-tgdue="'+g.id+':'+tg.id+'" value="'+(tg.dueDate||'')+'" style="font-size:.8125rem;padding:2px 6px;border-radius:6px;border:1px solid var(--rule);background:var(--card);"></div>'
          : '';
        return '<div data-teamgoal="'+tg.id+'" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--rule);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
              (isEdit
                ? '<input class="ms-title" data-tgtitle="1" value="'+L.escapeHtml(tg.title)+'" style="flex:1;font-weight:700;font-size:1rem;border-bottom:1.5px solid var(--brand);background:var(--surface-2);border-radius:6px;padding:3px 6px;">'
                : '<b style="font-size:1rem;color:var(--ink);">'+L.escapeHtml(tg.title)+'</b>') +
              tgPingBtn + (tg.dueDate ? '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);flex:0 0 auto;">'+L.dDay(tg.dueDate)+'</span>' : '') + (isEdit ? '<button class="icon-btn" data-tgdel="1" aria-label="팀 목표 삭제">×</button>' : '') +
            '</div>' +
            inlineDueHtml +
            '<div class="group-bar" style="margin-top:8px;"><span style="width:'+pct+'%;"></span></div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 8px;">' +
              '<span class="faint" style="font-size:.8125rem;font-weight:600;">달성률 '+pct+'% · 마일스톤 '+done+'/'+total+' 완료</span>' +
              '<div style="display:flex;align-items:center;gap:4px;">' +
                (pct === 100 ? '<button class="btn btn-sm btn-gold btn-feed-brag" data-tgbrag="'+g.id+':'+tg.id+'" type="button" style="font-size:.75rem;padding:3px 9px;background:linear-gradient(135deg, #f59e0b, #d97706);color:#fff;font-weight:800;border:none;border-radius:6px;box-shadow:0 2px 6px rgba(245,158,11,0.35);">🎉 완주 자랑</button>' : '') +
                (isEdit ? '<button class="btn btn-ghost btn-sm" data-tgeditmodal="'+g.id+':'+tg.id+'" type="button" style="font-size:.75rem;padding:2px 8px;border-color:var(--brand);color:var(--brand-strong);">✏️ 모달 상세 편집</button>' : '') +
                '<button class="btn btn-ghost btn-sm tg-fold-btn" data-tgfoldlist="'+tg.id+'" type="button" style="font-size:.75rem;padding:2px 7px;border-color:var(--rule);">마일스톤 접기 ▲</button>' +
              '</div>' +
            '</div>' +
            (tlSec.teamLinkedBtnHtml || '') + (tlSec.participantsSectionHtml || '') +
            '<div class="ms-list" data-tgmslist="'+tg.id+'" style="'+(isEdit?'':'display:none;')+'">'+msHtml+'</div>' +
            (isEdit ? '<div class="add-ms-btn" data-tgaddms="1" style="margin-top:6px;cursor:pointer;">+ 마일스톤 추가</div>' : '') +
            L.teamCommentsBlockHtml(g.id, tg.id) +
          '</div>';
      }).join('');

      var levelGroups = L.getGroupLevelGoals(g.id);
      var levelGroupsHtml = levelGroups.map(function(lg){
        var nG = (lg.goals||[]).length;
        var nM = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).length; }, 0);
        var nT = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).reduce(function(mAcc, ms){ return mAcc + (ms.tasks||[]).length; }, 0); }, 0);
        var nDoneT = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).reduce(function(mAcc, ms){ return mAcc + (ms.tasks||[]).filter(function(t){ return t.done; }).length; }, 0); }, 0);
        var nDoneM = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).filter(function(m){ return m.status === 'done'; }).length; }, 0);
        var lgProg = nT > 0 ? Math.round(nDoneT/nT*100) : (nM > 0 ? Math.round(nDoneM/nM*100) : 0);

        return '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:9px 12px;margin-bottom:7px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap;">' +
              '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">' + L.escapeHtml(lg.name) + '</span>' +
              '<span class="faint" style="font-size:.8125rem;background:var(--card);padding:1px 6px;border-radius:6px;border:1px solid var(--rule);">' +
                '목표(' + nG + ') · 마일스톤(' + nM + ') · 할일(' + nT + ')' +
              '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex:0 0 auto;">' +
              '<span class="dday-pill" style="font-size:.6875rem;padding:2px 7px;">' + lgProg + '%</span>' +
              '<button class="btn btn-ghost btn-sm" data-openleveldetail="' + g.id + ':' + lg.id + '" type="button" style="padding:3px 9px;font-size:.8125rem;font-weight:700;color:var(--ink);border-color:var(--rule);">자세히보기</button>' +
            '</div>' +
          '</div>' +
          '<div class="group-bar" style="margin-top:6px;height:5px;"><span style="width:' + lgProg + '%;"></span></div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px dashed var(--rule);font-size:.75rem;">' +
            '<div style="display:flex;align-items:center;gap:4px;overflow-x:auto;">' +
              '<span class="faint" style="margin-right:2px;">실 유저 편성:</span>' +
              '<span class="tag on" style="font-size:.6875rem;padding:1px 6px;border-radius:999px;" title="오늘 완수 완료">🏃 ' + L.escapeHtml(L.state.profile.displayName || '나') + ' ✓</span>' +
              '<span class="tag on" style="font-size:.6875rem;padding:1px 6px;border-radius:999px;" title="오늘 완수 완료">👟 러너상민 ✓</span>' +
              '<span class="tag" style="font-size:.6875rem;padding:1px 6px;border-radius:999px;" title="오늘 미완수">📚 새벽독서가</span>' +
            '</div>' +
            '<button type="button" class="btn btn-ghost btn-xs btn-toggle-group-verify" style="font-size:.6875rem;padding:2px 6px;color:var(--brand);border-color:rgba(108,92,231,0.25);" onclick="toast(\'조원 실시간 완수 인증이 동기화되었습니다 ✨\')">완수 통제</button>' +
          '</div>' +
        '</div>';
      }).join('');

      var levelSectionHtml =
        '<div style="margin-top:16px;padding-top:14px;border-top:1.5px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;">' +
            '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
              '<span style="font-size:1.0625rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span>' +
              '<b style="font-size:.9375rem;color:var(--ink);">팀 수준별 목표 관리</b>' +
              '<span class="faint" style="font-size:.8125rem;">(A·B·C조 맞춤)</span>' +
            '</div>' +
            '<button class="btn btn-ghost btn-sm" data-addlevelgroup="' + g.id + '" type="button" style="padding:3px 8px;font-size:.8125rem;color:var(--brand-strong);border-color:var(--red-line);flex:0 0 auto;">+ 조 추가</button>' +
          '</div>' +
          (levelGroupsHtml || '<p class="faint" style="font-size:.8125rem;">등록된 수준별 조가 없어요.</p>') +
        '</div>';

      return '<div class="card" data-teamcard="'+g.id+'" style="margin-bottom:16px;">' +
          leaderDashboardHtml +
          memberFeedbackBannerHtml +
          previewBadgeHtml +
          '<div class="card-title-row" style="align-items:flex-start;margin-bottom:10px;">' +
            '<div style="flex:1;min-width:0;">' +
              leaderCrownHtml +
              '<h3 style="margin:0;font-size:1.1rem;letter-spacing:-.01em;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">'+g.icon+' '+L.escapeHtml(g.name)+mockTeamBadgeHtml+'</h3>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:5px;flex:0 0 auto;flex-wrap:wrap;">' +
              '<button class="btn btn-ghost btn-sm btn-team-personal-goal team-personal-goal-pill-btn" data-teamid="'+g.id+'" data-teamname="'+L.escapeHtml(g.name)+'" type="button">🎯 팀 연계 개인목표</button>' +
              (canManage ? '<button class="btn btn-ghost btn-sm" data-inviteteam="'+g.id+'" data-teamname="'+L.escapeHtml(g.name)+'" type="button" style="font-size:.75rem;padding:2px 7px;border-color:var(--brand);color:var(--brand-strong);font-weight:700;">👥 팀원 초대</button>' : '') + '<button class="btn btn-ghost btn-sm" data-teamchat="'+g.id+'" type="button" style="font-size:.75rem;padding:2px 7px;border-color:var(--rule);color:var(--ink);font-weight:700;">💬 팀 대화</button><span class="dday-pill">'+roleLabel+'</span></div>' +
          '</div>' +
          (window.OurgoalTeamVisibilityLevels ? OurgoalTeamVisibilityLevels.renderTeamCardContent(g, canManage, L.state) : (
            '<div style="margin-bottom:6px;"><b style="font-size:.875rem;color:var(--ink-soft);">공동 팀 목표</b></div>' +
            (goals.length ? goalsHtml : '<p class="faint" style="margin-top:4px;">아직 공동 팀 목표가 없어요.</p>') +
            (canManage ? '<button class="btn btn-primary btn-sm" data-addteamgoal="'+g.id+'" type="button" style="margin-top:12px;width:100%;">+ 공동 팀 목표 추가</button>' : '') + levelSectionHtml)) +
        '</div>';
    }).join('');

    view.innerHTML = headerAndFilterHtml + cardsHtml + (window.OurgoalGoalEditUX ? OurgoalGoalEditUX.renderTeamDoneInlineBtn(L.state) : "");

    // [#TASK-ES-302] 팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 요소 기본 접힘(Collapsed) 처리
    if (typeof L.collapseAllTeamGoalAccordions === 'function') {
      L.collapseAllTeamGoalAccordions();
    }

    var heroGoalsBtn = view.querySelector('#btnHeroCreateTeamGoals');
    if(heroGoalsBtn){
      heroGoalsBtn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        L.promptNewGroup(null);
      });
    }
    view.querySelectorAll('[data-tgtplquick]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        var preset = L.getTeamGoalTemplatePreset(btn.dataset.tgtplquick);
        L.promptNewGroup(null, preset);
      });
    });

    var quickCreateBtn = view.querySelector('#btnQuickCreateTeamLinkedGoal');
    if(quickCreateBtn){
      quickCreateBtn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        var targetTeam = (activeFilter && activeFilter !== 'all') ? myTeams.find(function(t){ return t.id === activeFilter; }) : myTeams[0];
        if(targetTeam){
          L.openTeamLinkedPersonalGoalModal(targetTeam.id, targetTeam.name);
        } else {
          var sample = (typeof L.MOCK_GROUPS !== 'undefined' && L.MOCK_GROUPS.length) ? L.MOCK_GROUPS[0] : { id: 'g-workshop', name: '2026 하반기 전략 워크숍 TF' };
          L.openTeamLinkedPersonalGoalModal(sample.id, sample.name);
        }
      });
    }

    // Filter bar listener
    view.querySelectorAll('[data-tgfilter]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.state.teamGoalFilterGid = btn.dataset.tgfilter;
        renderTeamGoalsScreen();
      });
    });

    view.querySelectorAll('.btn-team-personal-goal').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.openTeamLinkedPersonalGoalModal(btn.dataset.teamid, btn.dataset.teamname);
      });
    });

    view.querySelectorAll('[data-inviteteam]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.openTeamInviteModal(btn.dataset.inviteteam, btn.dataset.teamname || '팀');
      });
    });

    var guideModalBtn = view.querySelector('#btnShowTeamGuideModal');
    if(guideModalBtn){
      guideModalBtn.addEventListener('click', function(){
        L.openModal(
          L.renderTeamGoalsEmptyGuideHtml() +
          '<div class="modal-actions"><button class="btn btn-primary btn-block" id="closeTeamGuideModal" type="button">확인</button></div>',
          function(sheet){
            sheet.querySelector('#closeTeamGuideModal').addEventListener('click', L.closeModal);
            L.wireTeamGoalsGuideEvents(sheet);
          }
        );
      });
    }
    view.querySelectorAll('[data-inviteteam]').forEach(function(b){ b.onclick = function(e){ e.stopPropagation(); if(window.OurgoalTeamInviteComm) window.OurgoalTeamInviteComm.openTeamInviteModal(b.dataset.inviteteam, L.MOCK_GROUPS); }; }); view.querySelectorAll('[data-teamchat]').forEach(function(b){ b.onclick = function(e){ e.stopPropagation(); if(window.OurgoalTeamInviteComm) window.OurgoalTeamInviteComm.openTeamChatModal(b.dataset.teamchat, L.MOCK_GROUPS); }; }); if(window.OurgoalTeamLinkedGoals) window.OurgoalTeamLinkedGoals.bindTeamGoalEvents(view); if(window.OurgoalTeamVisibilityLevels) OurgoalTeamVisibilityLevels.bindEvents(view);
    if(L.state.lastOpenCommentKey){
      var openBox = view.querySelector('[data-tggoalcommentsbox="' + L.state.lastOpenCommentKey + '"]') || view.querySelector('[data-tgmscommentsbox="' + L.state.lastOpenCommentKey + '"]');
      if(openBox){
        openBox.style.display = 'block';
        var toggleBtn = view.querySelector('[data-tgtogglegoalcomments="' + L.state.lastOpenCommentKey + '"]') || view.querySelector('[data-tgtogglemscomments="' + L.state.lastOpenCommentKey + '"]');
        if(toggleBtn){ var arr = toggleBtn.querySelector('.c-arrow'); if(arr) arr.textContent = '▲'; }
      }
    }
    if(window.OurgoalTeamLeaderCheck){
      OurgoalTeamLeaderCheck.bindEvents(view, {
        mockGroups: L.MOCK_GROUPS,
        getGroupState: L.groupState,
        getProfile: function(){ return L.state.profile; },
        getLevelGoals: L.getGroupLevelGoals,
        canManage: L.canManageTeamGoals,
        openModal: L.openModal,
        closeModal: L.closeModal,
        saveProfile: L.saveProfile,
        toast: L.toast,
        haptic: (typeof hapticFeedback === 'function') ? hapticFeedback : null,
        onRefresh: renderTeamGoalsScreen
      });
    }

    view.querySelectorAll('[data-openleveldetail]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = btn.dataset.openleveldetail.split(':');
        if(window.OurgoalTeamVisibilityLevels) OurgoalTeamVisibilityLevels.openLevelGroupDetailModal(parts[0], parts[1], parts[2]); else L.openLevelGroupDetailModal(parts[0], parts[1]);
      });
    });

    view.querySelectorAll('[data-addlevelgroup]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = (btn.dataset.addlevelgroup || '').split(':'); var gid = parts[0]; var tgid = parts[1];
        L.openModal(
          '<h3>새 수준별 조/그룹 추가</h3>' +
          '<div class="field"><label>조/그룹 이름</label><input id="newLgNameInput" type="text" placeholder="예: D조 (주말반) 또는 E조 (특훈반)"></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="cancelNewLgBtn" type="button">취소</button><button class="btn btn-primary" id="saveNewLgBtn" type="button">추가</button></div>',
          function(sheet){
            sheet.querySelector('#cancelNewLgBtn').addEventListener('click', L.closeModal);
            sheet.querySelector('#saveNewLgBtn').addEventListener('click', async function(){
              var name = sheet.querySelector('#newLgNameInput').value.trim();
              if(!name) return;
              var lgs = (tgid && window.OurgoalTeamVisibilityLevels) ? OurgoalTeamVisibilityLevels.getGoalLevelGoals(gid, tgid) : L.getGroupLevelGoals(gid);
              lgs.push({
                id: 'lg_' + L.uid('l'),
                name: name,
                goals: [
                  {
                    id: L.uid('lgg'),
                    title: name + ' 기본 목표',
                    dueDate: L.daysFromNow(30),
                    milestones: [
                      { id: L.uid('lgm'), title: '1단계 실천 과제', status: 'todo', priority: 'med', tasks: [] }
                    ]
                  }
                ]
              });
              await L.saveProfile();
              L.toast('"' + name + '" 조를 추가했어요');
              L.closeModal();
              renderTeamGoalsScreen();
            });
          }
        );
      });
    });

    var editToggle = view.querySelector('#teamGoalEditToggle');
    if(editToggle){
      editToggle.addEventListener('click', async function(){
        if(L.state.teamGoalEditMode && window.OurgoalGoalEditUX){ await OurgoalGoalEditUX.commitAndFinishTeamGoalEdit({ state:L.state, view:view, mockGroups:L.MOCK_GROUPS, saveProfile:L.saveProfile, toast:L.toast, renderTeamGoalsScreen:renderTeamGoalsScreen }); return; }
        L.state.teamGoalEditMode = !L.state.teamGoalEditMode; if(!L.state.teamGoalEditMode) await L.saveProfile(); renderTeamGoalsScreen();
      });
    }
    if(window.OurgoalGoalEditUX) OurgoalGoalEditUX.wireTeamGoalEdit({ state:L.state, view:view, mockGroups:L.MOCK_GROUPS, saveProfile:L.saveProfile, toast:L.toast, renderTeamGoalsScreen:renderTeamGoalsScreen });

    view.querySelectorAll('[data-tgleavepreview]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        L.triggerHapticFeedback(12);
        var gid = btn.dataset.tgleavepreview;
        var gs = L.groupState(gid);
        gs.joined = false;
        delete gs.isPreview;
        await L.saveProfile();
        L.toast('체험 팀에서 나갔어요');
        renderTeamGoalsScreen();
      });
    });

    view.querySelectorAll('[data-tplgroup-create]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        L.triggerHapticFeedback(12);
        var gid = btn.dataset.tplgroupCreate;
        var preset = L.getTeamGoalTemplatePreset(gid);
        L.promptNewGroup(null, preset);
      });
    });

    view.querySelectorAll('[data-tgbrag]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.tgbrag.split(':');
        var g = L.MOCK_GROUPS.find(function(x){ return x.id===parts[0]; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===parts[1]; });
        if(!g || !tg) return;
        L.triggerHaptic([20, 30, 40]);
        var myName = (L.state.profile && (L.state.profile.displayName || L.state.profile.name)) || '팀원';
        var myId = (L.state.profile && L.state.profile.id) || 'guest';
        var postId = 'post_brag_' + L.newId();
        var post = {
          id: postId,
          user_id: myId,
          display_name: myName,
          avatar_url: (L.state.profile && L.state.profile.avatarUrl) || null,
          goal_title: '[' + g.name + '] ' + tg.title,
          caption: '🏆 우리 팀 [' + g.name + '] 목표를 100% 완주했습니다! 함께 달려준 팀원 여러분 진심으로 수고 많으셨습니다! 🎉✨',
          cheers_count: 0,
          created_at: L.nowISO(),
          extra: {
            category: 'team',
            badge: '팀 완주 🏆',
            isTeamCompletion: true,
            teamName: g.name,
            teamGoalTitle: tg.title,
            goalPct: 100,
            milestones: tg.milestones || []
          }
        };
        try {
          if(window.sb) await window.sb.from('feed_posts').insert(post);
        } catch(e){ console.warn('Supabase feed post fallback', e); }
        L.state.profile.settings = L.state.profile.settings || {};
        L.state.profile.settings.myFeedPosts = L.state.profile.settings.myFeedPosts || [];
        L.state.profile.settings.myFeedPosts.unshift(post);
        await L.saveProfile();
        if(!window.FEED_POSTS_CACHE) window.FEED_POSTS_CACHE = [];
        window.FEED_POSTS_CACHE.unshift(post);
        L.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 40);
        L.toast('우리 팀의 100% 완주 소식이 소통 피드에 성공적으로 자랑되었어요! 🏆');
        L.state.commSubTab = 'feed';
        L.setTab('comm');
        L.renderCommScreen();
      });
    });

    view.querySelectorAll('[data-tgeditmodal]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = btn.dataset.tgeditmodal.split(':');
        L.openTeamGoalEditModal(parts[0], parts[1]);
      });
    });

    view.querySelectorAll('[data-tgmup]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.tgmup.split(':');
        var g = L.MOCK_GROUPS.find(function(x){ return x.id===parts[0]; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===parts[1]; });
        if(!tg || !tg.milestones) return;
        var idx = tg.milestones.findIndex(function(m){ return m.id===parts[2]; });
        if(idx > 0){
          var temp = tg.milestones[idx];
          tg.milestones[idx] = tg.milestones[idx-1];
          tg.milestones[idx-1] = temp;
          L.triggerHaptic(10);
          await L.saveProfile();
          renderTeamGoalsScreen();
        }
      });
    });

    view.querySelectorAll('[data-tgmdown]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.tgmdown.split(':');
        var g = L.MOCK_GROUPS.find(function(x){ return x.id===parts[0]; });
        var tg = g && (g.teamGoals||[]).find(function(x){ return x.id===parts[1]; });
        if(!tg || !tg.milestones) return;
        var idx = tg.milestones.findIndex(function(m){ return m.id===parts[2]; });
        if(idx >= 0 && idx < tg.milestones.length - 1){
          var temp = tg.milestones[idx];
          tg.milestones[idx] = tg.milestones[idx+1];
          tg.milestones[idx+1] = temp;
          L.triggerHaptic(10);
          await L.saveProfile();
          renderTeamGoalsScreen();
        }
      });
    });

    view.querySelectorAll('[data-teamcard]').forEach(function(card){
      var gid = card.dataset.teamcard;
      var g = L.MOCK_GROUPS.find(function(x){ return x.id===gid; });

      card.querySelectorAll('[data-teamgoal]').forEach(function(tgEl){
        var tgid = tgEl.dataset.teamgoal;
        var tg = (g.teamGoals||[]).find(function(x){ return x.id===tgid; });

        var tgTitleInput = tgEl.querySelector('[data-tgtitle]');
        if(tgTitleInput) tgTitleInput.addEventListener('change', async function(){
          tg.title = tgTitleInput.value.trim() || tg.title;
          await L.saveProfile();
        });
        var tgDelBtn = tgEl.querySelector('[data-tgdel]');
        if(tgDelBtn) tgDelBtn.addEventListener('click', function(){
          L.openModal(
            '<h3>팀 목표 삭제</h3>' +
            '<p class="faint" style="margin:8px 0 16px;">"' + L.escapeHtml(tg.title) + '" 팀 목표를 삭제할까요?<br>팀원들과 공유 중인 데이터가 삭제됩니다.</p>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-ghost" id="btnCancelDelTg" type="button">취소</button>' +
              '<button class="btn btn-primary" id="btnConfirmDelTg" type="button" style="background:var(--brand-strong);">삭제</button>' +
            '</div>',
            function(sheet){
              sheet.querySelector('#btnCancelDelTg').addEventListener('click', L.closeModal);
              sheet.querySelector('#btnConfirmDelTg').addEventListener('click', async function(){
                g.teamGoals = g.teamGoals.filter(function(x){ return x.id!==tgid; });
                L.closeModal();
                await L.saveProfile();
                L.toast('팀 목표를 삭제했어요');
                renderTeamGoalsScreen();
              });
            }
          );
        });
        var tgAddMsBtn = tgEl.querySelector('[data-tgaddms]');
        if(tgAddMsBtn) tgAddMsBtn.addEventListener('click', async function(){
          tg.milestones.push({ id: L.uid('tgm'), title:'새 마일스톤', status:'todo' });
          await L.saveProfile(); renderTeamGoalsScreen();
        });

        tgEl.querySelectorAll('[data-tgmid]').forEach(function(row){
          var mid = row.dataset.tgmid;
          var m = tg.milestones.find(function(x){ return x.id===mid; });
          var cycleEl = row.querySelector('[data-tgcycle]');
          if(cycleEl) cycleEl.addEventListener('click', async function(){
            var order = ['todo','doing','done'];
            m.status = order[(order.indexOf(m.status)+1)%3];
            await L.saveProfile(); renderTeamGoalsScreen();
          });
          var mTitleInput = row.querySelector('[data-tgmtitle]');
          if(mTitleInput) mTitleInput.addEventListener('change', async function(){
            m.title = mTitleInput.value.trim() || m.title;
            await L.saveProfile();
          });
          var mDelBtn = row.querySelector('[data-tgmdel]');
          if(mDelBtn) mDelBtn.addEventListener('click', function(){
            L.openModal(
              '<h3>마일스톤 삭제</h3>' +
              '<p class="faint" style="margin:8px 0 16px;">"' + L.escapeHtml(m.title) + '" 마일스톤을 삭제할까요?</p>' +
              '<div class="modal-actions">' +
                '<button class="btn btn-ghost" id="btnCancelDelMs" type="button">취소</button>' +
                '<button class="btn btn-primary" id="btnConfirmDelMs" type="button" style="background:var(--brand-strong);">삭제</button>' +
              '</div>',
              function(sheet){
                sheet.querySelector('#btnCancelDelMs').addEventListener('click', L.closeModal);
                sheet.querySelector('#btnConfirmDelMs').addEventListener('click', async function(){
                  tg.milestones = tg.milestones.filter(function(x){ return x.id!==mid; });
                  L.closeModal();
                  await L.saveProfile();
                  L.toast('마일스톤을 삭제했어요');
                  renderTeamGoalsScreen();
                });
              }
            );
          });
        });

        tgEl.querySelectorAll('[data-tgfoldlist]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var id = btn.dataset.tgfoldlist;
            var list = tgEl.querySelector('[data-tgmslist="'+id+'"]');
            if(!list || window.OurgoalTeamVisibilityLevels) return; // #TASK-ES-409: 모듈 bindEvents 가 같은 버튼을 이미 묶는다(두 손잡이가 한 번씩 뒤집어 펼침이 바로 접히던 죽은 클릭)
            var isHidden = list.style.display === 'none';
            list.style.display = isHidden ? 'block' : 'none';
            btn.textContent = isHidden ? '마일스톤 접기 ▲' : '마일스톤 펼치기 ▼';
            var p = (L.state && L.state.profile) || {};
            p.settings = p.settings || {};
            p.settings.unfoldMsList = p.settings.unfoldMsList || {};
            p.settings.unfoldMsList[id] = isHidden;
            if(typeof L.saveProfile === 'function') await L.saveProfile();
          });
        });
        tgEl.querySelectorAll('[data-tgtoggletasks]').forEach(function(btn){
          btn.addEventListener('click', function(){
            var key = btn.dataset.tgtoggletasks;
            var box = tgEl.querySelector('[data-tgtaskbox="'+key+'"]');
            if(!box || window.OurgoalTeamVisibilityLevels) return; // #TASK-ES-410: 모듈 bindEvents 가 같은 버튼을 이미 묶는다(두 손잡이가 한 번씩 뒤집어 세부 할 일 상자가 바로 접히던 죽은 클릭)
            var isHidden = box.style.display === 'none' || !box.style.display;
            box.style.display = isHidden ? 'block' : 'none';
            var arr = btn.querySelector('.t-arrow');
            if(arr) arr.textContent = isHidden ? '▲' : '▼';
          });
        });
        tgEl.querySelectorAll('[data-tgtoggletask]').forEach(function(el){
          el.addEventListener('click', async function(){
            var parts = el.dataset.tgtoggletask.split(':');
            var m = tg.milestones.find(function(x){ return x.id===parts[1]; });
            if(!m || !m.tasks) return;
            var t = m.tasks.find(function(x){ return x.id===parts[2]; });
            if(!t) return;
            t.done = !t.done;
            await L.saveProfile();
            renderTeamGoalsScreen();
          });
        });
        tgEl.querySelectorAll('[data-tgtasktitle]').forEach(function(inp){
          inp.addEventListener('change', async function(){
            var parts = inp.dataset.tgtasktitle.split(':');
            var m = tg.milestones.find(function(x){ return x.id===parts[1]; });
            if(!m || !m.tasks) return;
            var t = m.tasks.find(function(x){ return x.id===parts[2]; });
            if(!t) return;
            t.title = inp.value.trim() || t.title;
            await L.saveProfile();
          });
        });
        tgEl.querySelectorAll('[data-tgdeltask]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var parts = btn.dataset.tgdeltask.split(':');
            var m = tg.milestones.find(function(x){ return x.id===parts[1]; });
            if(!m || !m.tasks) return;
            m.tasks = m.tasks.filter(function(x){ return x.id!==parts[2]; });
            await L.saveProfile();
            renderTeamGoalsScreen();
          });
        });
        tgEl.querySelectorAll('[data-tgaddtask]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var parts = btn.dataset.tgaddtask.split(':');
            var title = prompt('추가할 세부 할 일을 입력하세요:');
            if(!title || !title.trim()) return;
            var m = tg.milestones.find(function(x){ return x.id===parts[1]; });
            if(!m) return;
            if(!m.tasks) m.tasks = [];
            m.tasks.push({ id: L.uid('tgt'), title: title.trim(), done: false });
            await L.saveProfile();
            renderTeamGoalsScreen();
          });
        });
        tgEl.querySelectorAll('[data-tgaddtaskmodal]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var parts = btn.dataset.tgaddtaskmodal.split(':');
            var title = prompt('추가할 세부 할 일을 입력하세요:');
            if(!title || !title.trim()) return;
            var m = tg.milestones.find(function(x){ return x.id===parts[1]; });
            if(!m) return;
            if(!m.tasks) m.tasks = [];
            m.tasks.push({ id: L.uid('tgt'), title: title.trim(), done: false });
            await L.saveProfile();
            renderTeamGoalsScreen();
          });
        });
      });

      var addGoalBtn = card.querySelector('[data-addteamgoal]');
      if(addGoalBtn) addGoalBtn.addEventListener('click', function(){ L.promptNewTeamGoal(gid); });

      card.querySelectorAll('[data-cmtsend]').forEach(function(btn){
        var targetId = btn.dataset.cmtsend;
        var input = card.querySelector('[data-cmtinput="'+targetId+'"]') || document.querySelector('[data-cmtinput="'+targetId+'"]');
        var submit = async function(){
          if(!input) return;
          var text = input.value.trim();
          if(!text) return;
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          var row = { id: L.uid('cmt'), group_id: gid, user_id: L.state.profile.id, display_name: L.state.profile.displayName, target_id: targetId, text: text, created_at: L.nowISO() };
          // 1. 낙관적 캐시 즉시 반영
          (L.TEAM_COMMENTS_CACHE[gid] = L.TEAM_COMMENTS_CACHE[gid] || []).push(row);
          // 2. 로컬 프로필 2중 영속화 (오프라인/게스트/원격오류 100% 무손실 보존 #TASK-ES-174)
          L.state.profile.settings = L.state.profile.settings || {};
          L.state.profile.settings.localTeamComments = L.state.profile.settings.localTeamComments || {};
          (L.state.profile.settings.localTeamComments[gid] = L.state.profile.settings.localTeamComments[gid] || []).push(row);
          await L.saveProfile();
          // 3. 입력창 초기화
          input.value = '';
          // 4. 댓글창 오픈 상태 유지
          L.state.lastOpenCommentKey = gid + ':' + targetId;
          L.toast('댓글을 남겼어요');
          renderTeamGoalsScreen();
          // 5. 서버 원격 전송 (비동기 처리)
          try {
            L.sb.from('team_comments').insert(row).catch(function(err){ console.warn('Team comment remote sync:', err); });
          } catch(e){}
        };
        btn.onclick = submit;
        input.onkeydown = function(e){ if(e.key==='Enter') submit(); };
      });

      card.querySelectorAll('[data-reportcmt]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var id = btn.dataset.reportcmt;
          if(!(await OurgoalCapabilities.call('ui.confirm', '이 댓글을 신고할까요? 신고가 여러 건 쌓이면 자동으로 숨겨져요.'))) return;
          btn.disabled = true;
          var res = await L.sb.rpc('report_content', { p_target_type: 'team_comment', p_target_id: id, p_reason: '' });
          if(res.error){
            if(!L.state.profile.settings.contentReports) L.state.profile.settings.contentReports = {};
            var localCount = (L.state.profile.settings.contentReports['local_rep_count:'+id] || 0) + 1;
            L.state.profile.settings.contentReports['local_rep_count:'+id] = localCount;
            L.state.profile.settings.contentReports['team_comment:'+id] = L.nowISO();
            if(localCount >= 3){
              Object.keys(L.TEAM_COMMENTS_CACHE).forEach(function(gkey){
                (L.TEAM_COMMENTS_CACHE[gkey]||[]).forEach(function(c){ if(c.id===id) c.hidden = true; });
              });
            }
            L.toast(localCount >= 3 ? '신고가 누적되어 댓글이 숨겨졌어요' : '신고가 접수되었어요');
            await L.saveProfile();
            renderTeamGoalsScreen();
            return;
          }
          if(!L.state.profile.settings.contentReports) L.state.profile.settings.contentReports = {};
          L.state.profile.settings.contentReports['team_comment:'+id] = L.nowISO();
          var hidden = !!(res.data && res.data.hidden);
          if(hidden){
            Object.keys(L.TEAM_COMMENTS_CACHE).forEach(function(gkey){
              (L.TEAM_COMMENTS_CACHE[gkey]||[]).forEach(function(c){ if(c.id===id) c.hidden = true; });
            });
          }
          L.track('content_reported', { target: 'team_comment', auto_hidden: hidden });
          L.toast(hidden ? '신고가 접수됐고 댓글이 숨겨졌어요' : '신고가 접수됐어요. 확인 후 조치할게요');
          await L.saveProfile();
          renderTeamGoalsScreen();
        });
      });

      card.querySelectorAll('[data-blockuser]').forEach(function(btn){
        btn.addEventListener('click', function(){
          L.blockUser(btn.dataset.blockuser, btn.dataset.blockname);
        });
      });
    });
  }

  K.renderTeamGoalsScreen = renderTeamGoalsScreen;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
