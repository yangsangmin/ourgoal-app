/* ============================================================
 * 아워골(OurGoal) — 팀 연계 개인목표 및 상호 달성도 체크·소통 시스템
 * #TASK-ES-105
 * 1. 팀 목표와 개인목표 사이 '팀 연계 개인목표' 계층 신설
 * 2. 팀 목표(목표·마일스톤·할일) -> '팀 연계 개인목표로 복사하며 참가' 원클릭 배선
 * 3. 개인 독립적 로드맵 관리 전용 워크스페이스 구축
 * 4. 팀 목표 대시보드 내 참가 팀원 달성 정도 실시간 상호 체크
 * 5. 팀원 간 3대 상호작용 (⚡ 찌르기 · 💬 댓글 · ✉️ DM) 완전 연동
 * ============================================================ */
(function(global){
  'use strict';

  var _ctx = {};

  function getState(){ return (_ctx.getState ? _ctx.getState() : global.state) || {}; }
  function getProfile(){ return (_ctx.getProfile ? _ctx.getProfile() : (getState().profile || {})) || {}; }
  function saveProfile(){ return (_ctx.saveProfile ? _ctx.saveProfile() : (global.saveProfile ? global.saveProfile() : Promise.resolve())); }
  function toast(msg){ if(_ctx.toast) _ctx.toast(msg); else if(global.toast) global.toast(msg); }
  function openModal(html, cb){ if(_ctx.openModal) _ctx.openModal(html, cb); else if(global.openModal) global.openModal(html, cb); }
  function closeModal(){ if(_ctx.closeModal) _ctx.closeModal(); else if(global.closeModal) global.closeModal(); }
  function triggerHaptic(ms){ if(_ctx.triggerHaptic) _ctx.triggerHaptic(ms); else if(global.triggerHaptic) global.triggerHaptic(ms); }
  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function getGroupState(gid){
    if(_ctx.groupState) return _ctx.groupState(gid);
    if(global.groupState) return global.groupState(gid);
    var p = getProfile();
    p.groupStates = p.groupStates || {};
    p.groupStates[gid] = p.groupStates[gid] || {};
    return p.groupStates[gid];
  }
  function getMockGroups(){ return _ctx.MOCK_GROUPS || global.MOCK_GROUPS || []; }
  function getGoalAchievement(goal){
    if(_ctx.goalAchievement) return _ctx.goalAchievement(goal);
    if(global.goalAchievement) return global.goalAchievement(goal);
    if(!goal || !goal.milestones || !goal.milestones.length) return 0;
    var allTasks = goal.milestones.reduce(function(acc, m){ return acc.concat(m.tasks || []); }, []);
    if(allTasks.length > 0){
      var doneT = allTasks.filter(function(t){ return t.done; }).length;
      return Math.round((doneT / allTasks.length) * 100);
    }
    var doneM = goal.milestones.filter(function(m){ return m.status === 'done'; }).length;
    return Math.round((doneM / goal.milestones.length) * 100);
  }
  function getDDay(dueDate){
    if(_ctx.dDay) return _ctx.dDay(dueDate);
    if(global.dDay) return global.dDay(dueDate);
    if(!dueDate) return '';
    var diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if(diff === 0) return 'D-Day';
    if(diff > 0) return 'D-' + diff;
    return 'D+' + Math.abs(diff);
  }
  function renderGoalsScreen(){
    if(_ctx.renderGoalsScreen) _ctx.renderGoalsScreen();
    else if(global.renderGoalsScreen) global.renderGoalsScreen();
  }
  function renderTeamGoalsScreen(){
    if(_ctx.renderTeamGoalsScreen) _ctx.renderTeamGoalsScreen();
    else if(global.renderTeamGoalsScreen) global.renderTeamGoalsScreen();
  }

  /* ------------------------------------------------------------
   * 1. 참가자 목록 가져오기 & 실시간 달성도 동기화
   * ------------------------------------------------------------ */
  function getTeamGoalParticipants(gid, tg){
    var gs = getGroupState(gid);
    gs.teamGoalParticipants = gs.teamGoalParticipants || {};
    var tgid = tg.id;

    if(!gs.teamGoalParticipants[tgid]){
      var g = getMockGroups().find(function(item){ return item.id === gid; });
      var roster = (g && g.roster) || [
        { n: '김민우', c: 6 },
        { n: '이서연', c: 4 },
        { n: '박진혁', c: 2 }
      ];
      var seedList = roster.slice(0, 3).map(function(r, idx){
        var doneM = Math.min((tg.milestones || []).length, idx === 0 ? 2 : (idx === 1 ? 1 : 0));
        var totalM = Math.max(1, (tg.milestones || []).length);
        var pct = Math.round((doneM / totalM) * 100);
        return {
          userId: 'user_seed_' + gid + '_' + idx,
          name: r.n,
          avatar: (idx === 0 ? '🏃‍♂️' : (idx === 1 ? '🧘‍♀️' : '🚴‍♂️')),
          role: (idx === 0 ? '부팀장' : '크루원'),
          progressPct: pct,
          doneMs: doneM,
          totalMs: totalM,
          isMe: false,
          joinedAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString()
        };
      });
      gs.teamGoalParticipants[tgid] = seedList;
    }

    var list = gs.teamGoalParticipants[tgid];

    // 본인 연계 목표 반영
    var state = getState();
    var p = getProfile();
    var myLinkedGoal = (p.goals || []).find(function(gItem){
      return gItem.teamLinked && gItem.teamGoalId === tgid && gItem.groupId === gid;
    });

    var myName = p.displayName || '나';
    var myAvatar = p.avatar || '😎';
    var myIndex = list.findIndex(function(item){ return item.isMe || item.userId === p.id || item.name === myName; });

    if(myLinkedGoal){
      var myDoneMs = (myLinkedGoal.milestones || []).filter(function(m){ return m.status === 'done'; }).length;
      var myTotalMs = (myLinkedGoal.milestones || []).length;
      var myPct = getGoalAchievement(myLinkedGoal);
      var myRecord = {
        userId: p.id || 'user_me',
        name: myName,
        avatar: myAvatar,
        role: '참가자',
        progressPct: myPct,
        doneMs: myDoneMs,
        totalMs: myTotalMs,
        isMe: true,
        linkedGoalId: myLinkedGoal.id,
        joinedAt: myLinkedGoal.joinedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if(myIndex >= 0){
        list[myIndex] = myRecord;
      } else {
        list.unshift(myRecord);
      }
    } else {
      if(myIndex >= 0 && list[myIndex].isMe){
        list.splice(myIndex, 1);
      }
    }

    return list;
  }

  function syncTeamGoalParticipantProgress(linkedGoal){
    if(!linkedGoal || !linkedGoal.teamLinked || !linkedGoal.groupId || !linkedGoal.teamGoalId) return;
    var gid = linkedGoal.groupId;
    var tgid = linkedGoal.teamGoalId;
    var gs = getGroupState(gid);
    gs.teamGoalParticipants = gs.teamGoalParticipants || {};
    var list = gs.teamGoalParticipants[tgid] || [];

    var p = getProfile();
    var myName = p.displayName || '나';
    var myAvatar = p.avatar || '😎';
    var myDoneMs = (linkedGoal.milestones || []).filter(function(m){ return m.status === 'done'; }).length;
    var myTotalMs = (linkedGoal.milestones || []).length;
    var myPct = getGoalAchievement(linkedGoal);

    var idx = list.findIndex(function(item){ return item.isMe || item.userId === p.id || item.name === myName; });
    var record = {
      userId: p.id || 'user_me',
      name: myName,
      avatar: myAvatar,
      role: '참가자',
      progressPct: myPct,
      doneMs: myDoneMs,
      totalMs: myTotalMs,
      isMe: true,
      linkedGoalId: linkedGoal.id,
      joinedAt: linkedGoal.joinedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if(idx >= 0){
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    gs.teamGoalParticipants[tgid] = list;
  }

  /* ------------------------------------------------------------
   * 2. 원클릭 복사 및 참가 배선
   * ------------------------------------------------------------ */
  async function copyTeamGoalToPersonalLinked(gid, tgid){
    var g = getMockGroups().find(function(item){ return item.id === gid; });
    if(!g){
      toast('모임 정보를 찾을 수 없습니다.');
      return;
    }
    var tg = (g.teamGoals || []).find(function(item){ return item.id === tgid; });
    if(!tg){
      toast('팀 목표 정보를 찾을 수 없습니다.');
      return;
    }

    var state = getState();
    var p = getProfile();
    p.goals = p.goals || [];

    var existing = p.goals.find(function(item){
      return item.teamLinked && item.teamGoalId === tg.id && item.groupId === g.id;
    });
    if(existing){
      state.activeTeamLinkedGoalId = existing.id;
      state.goalsSubTab = 'teamLinked';
      renderGoalsScreen();
      toast('이미 참가 중인 팀 연계 개인목표로 이동했습니다.');
      return;
    }

    var newMilestones = (tg.milestones || []).map(function(m, mIdx){
      var newMid = 'ms_tl_' + Date.now() + '_' + mIdx + '_' + Math.random().toString(36).substr(2, 4);
      var newTasks = (m.tasks || []).map(function(t, tIdx){
        return {
          id: 'tk_tl_' + Date.now() + '_' + tIdx + '_' + Math.random().toString(36).substr(2, 4),
          title: t.title,
          done: false,
          dueDate: t.dueDate || ''
        };
      });
      return {
        id: newMid,
        title: m.title,
        status: 'todo',
        dueDate: m.dueDate || '',
        tasks: newTasks
      };
    });

    var newGoalId = 'goal_tl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    var linkedGoal = {
      id: newGoalId,
      title: tg.title,
      category: tg.category || 'team',
      dueDate: tg.dueDate || '',
      teamLinked: true,
      teamGoalId: tg.id,
      groupId: g.id,
      groupName: g.name,
      groupIcon: g.icon || '🎯',
      originTitle: tg.title,
      joinedAt: new Date().toISOString(),
      visibility: 'team',
      milestones: newMilestones
    };

    p.goals.unshift(linkedGoal);
    state.activeTeamLinkedGoalId = linkedGoal.id;

    syncTeamGoalParticipantProgress(linkedGoal);
    await saveProfile();

    state.goalsSubTab = 'teamLinked';
    renderGoalsScreen();
    triggerHaptic(20);
    toast('🎉 "' + tg.title + '" 팀 목표를 팀 연계 개인목표로 복사하고 참가했습니다!');
  }

  /* ------------------------------------------------------------
   * 3. '팀 연계 개인목표' 워크스페이스 화면 렌더링
   * ------------------------------------------------------------ */
  function renderTeamLinkedGoalsScreen(containerEl){
    var view = containerEl || document.getElementById('teamLinkedGoalsView');
    if(!view) return;

    var state = getState();
    var p = getProfile();
    var linkedGoals = (p.goals || []).filter(function(g){ return !g.archivedAt && g.teamLinked; });

    if(!state.activeTeamLinkedGoalId || !linkedGoals.find(function(g){ return g.id === state.activeTeamLinkedGoalId; })){
      state.activeTeamLinkedGoalId = linkedGoals.length ? linkedGoals[0].id : null;
    }

    var editMode = !!state.teamLinkedEditMode;

    if(linkedGoals.length === 0){
      view.innerHTML =
        '<div class="goal-head-row" style="margin-bottom:12px;">' +
          '<div class="goal-head-l">' +
            '<div style="display:flex;align-items:center;gap:6px;"><h2 style="margin:0;">팀 연계 개인목표</h2></div>' +
            '<span class="faint" style="font-size:.8125rem;">팀 로드맵을 복사해 나만의 페이스로 실행하고 팀원과 상호 체크해요</span>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="text-align:center;padding:36px 20px;background:var(--surface-2);border:1px dashed var(--rule);border-radius:16px;margin-top:12px;">' +
          '<div style="font-size:3rem;margin-bottom:12px;">🤝</div>' +
          '<h3 style="margin:0 0 8px;font-size:1.15rem;color:var(--ink);">아직 참여 중인 팀 연계 개인목표가 없어요</h3>' +
          '<p class="faint" style="font-size:.875rem;max-width:420px;margin:0 auto 20px;line-height:1.6;">' +
            '모임 크루들이 함께 만든 팀 목표에서 <b>[팀 연계 개인목표로 복사하며 참가]</b>를 누르면<br>' +
            '목표·마일스톤·세부할일 세트가 내 화면으로 복사되어 개별적으로 작성·체크하고,<br>' +
            '팀 목표 대시보드에서 다른 팀원들과 서로의 달성 정도를 상호 체크(찌르기/댓글/DM)할 수 있어요!' +
          '</p>' +
          '<button class="btn btn-primary" id="btnGoToTeamGoalsExplore" type="button" style="padding:10px 22px;font-weight:700;font-size:.9375rem;background:linear-gradient(135deg, var(--brand), #ec4899);border:none;border-radius:10px;box-shadow:0 3px 10px rgba(225,29,72,0.25);cursor:pointer;">' +
            '🎯 팀 목표 둘러보고 참가하기' +
          '</button>' +
        '</div>';

      var btnExplore = view.querySelector('#btnGoToTeamGoalsExplore');
      if(btnExplore){
        btnExplore.addEventListener('click', function(){
          state.goalsSubTab = 'team';
          renderGoalsScreen();
        });
      }
      return;
    }

    var goal = linkedGoals.find(function(g){ return g.id === state.activeTeamLinkedGoalId; }) || linkedGoals[0];
    var pct = getGoalAchievement(goal);
    var doneMCount = (goal.milestones || []).filter(function(m){ return m.status === 'done'; }).length;
    var totalMCount = (goal.milestones || []).length;
    var allTasks = (goal.milestones || []).reduce(function(acc, m){ return acc.concat(m.tasks || []); }, []);
    var doneTCount = allTasks.filter(function(t){ return t.done; }).length;
    var totalTCount = allTasks.length;

    var chipRowHtml = '<div class="goal-chip-row" id="tlGoalChipRow" style="margin-bottom:12px;">' +
      linkedGoals.map(function(g){
        var isAct = (g.id === goal.id);
        var gPct = getGoalAchievement(g);
        return '<button class="goal-chip' + (isAct ? ' active' : '') + '" data-tlchip="' + g.id + '" type="button">' +
          (g.groupIcon || '🎯') + ' ' + esc(g.title) + ' (' + gPct + '%)' +
        '</button>';
      }).join('') +
      '<button class="goal-chip addchip" id="btnExploreMoreTeamGoals" type="button" title="다른 팀 목표 복사하러 가기">+</button>' +
    '</div>';

    var originBannerHtml =
      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.3rem;">🏢</span>' +
          '<div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);font-weight:600;">연계된 모임 및 원본 팀 목표</div>' +
            '<div style="font-size:.9375rem;font-weight:700;color:var(--ink);">' +
              (goal.groupIcon || '🎯') + ' ' + esc(goal.groupName || '모임') + ' &gt; ' + esc(goal.originTitle || goal.title) +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" id="btnGoToTeamOrigin" type="button" style="font-size:.8125rem;font-weight:700;color:var(--brand-strong);border-color:var(--red-line);padding:4px 10px;cursor:pointer;">' +
          '팀 목표 대시보드 & 팀원 현황 보기 ➔' +
        '</button>' +
      '</div>';

    var msListHtml = (goal.milestones || []).map(function(ms){
      var isDone = ms.status === 'done';
      var msTasks = ms.tasks || [];
      var nTasksDone = msTasks.filter(function(t){ return t.done; }).length;

      var tasksHtml = msTasks.map(function(t){
        return '<div class="task-row" style="padding:5px 0;display:flex;align-items:center;gap:8px;">' +
          '<div class="task-check' + (t.done ? ' done' : '') + '" data-tltoggletask="' + ms.id + ':' + t.id + '" style="cursor:pointer;" title="할 일 완료 토글">' +
            (t.done ? '✓' : '') +
          '</div>' +
          (editMode
            ? '<input class="task-title' + (t.done ? ' done-text' : '') + '" data-tltasktitle="' + ms.id + ':' + t.id + '" value="' + esc(t.title) + '" style="flex:1;font-size:.875rem;">'
            : '<span class="task-title' + (t.done ? ' done-text' : '') + '" data-tltoggletask="' + ms.id + ':' + t.id + '" style="flex:1;font-size:.875rem;cursor:pointer;">' + esc(t.title) + '</span>') +
          (editMode ? '<button class="icon-btn" data-tldeltask="' + ms.id + ':' + t.id + '" type="button" title="삭제" style="padding:2px 6px;">×</button>' : '') +
        '</div>';
      }).join('');

      return '<div class="ms-row" style="padding:10px 12px;margin-bottom:10px;background:var(--card);border:1px solid var(--rule);border-radius:12px;">' +
        '<div class="ms-main" style="display:flex;align-items:center;gap:10px;">' +
          '<div class="ms-status ' + ms.status + '" data-tlcyclems="' + ms.id + '" style="cursor:pointer;" title="클릭하여 상태 변경">' +
            (isDone ? '✓' : '') +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            (editMode
              ? '<input class="' + (isDone ? 'ms-title done-text' : 'ms-title') + '" data-tlmstitle="' + ms.id + '" value="' + esc(ms.title) + '" style="font-weight:700;font-size:.9375rem;border-bottom:1.5px solid var(--brand);background:var(--surface-2);width:100%;">'
              : '<span class="' + (isDone ? 'ms-title done-text' : 'ms-title') + '" style="font-weight:700;font-size:.9375rem;">' + esc(ms.title) + '</span>') +
            '<div class="faint" style="font-size:.75rem;margin-top:2px;">' +
              '세부 할 일 ' + nTasksDone + '/' + msTasks.length + ' 완료' +
            '</div>' +
          '</div>' +
          (editMode ? '<button class="icon-btn" data-tlmsdel="' + ms.id + '" type="button" aria-label="마일스톤 삭제" style="padding:2px 6px;">×</button>' : '') +
        '</div>' +
        '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--rule);">' +
          tasksHtml +
          '<div style="margin-top:6px;">' +
            '<button class="btn btn-ghost btn-xs" data-tladdtask="' + ms.id + '" type="button" style="font-size:.75rem;color:var(--brand-strong);border-color:var(--red-line);padding:2px 8px;font-weight:700;">+ 세부 할 일 추가</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    view.innerHTML =
      '<div class="goal-head-row" style="margin-bottom:10px;">' +
        '<div class="goal-head-l">' +
          '<div style="display:flex;align-items:center;gap:6px;"><h2 style="margin:0;">팀 연계 개인목표</h2></div>' +
          '<span class="faint" style="font-size:.8125rem;">팀 로드맵을 개인 창에서 작성하고 달성도를 상호 체크해요</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          (editMode ? '<button class="btn btn-danger btn-sm" id="btnDeleteTlGoal" type="button" style="font-size:.8125rem;padding:3px 9px;">연계 목표 삭제</button>' : '') +
          '<button class="edit-toggle ' + (editMode ? 'on' : 'off') + '" id="btnToggleTlEdit" type="button" style="font-size:.8125rem;padding:3px 10px;">' +
            (editMode ? '완료' : '편집') +
          '</button>' +
        '</div>' +
      '</div>' +
      chipRowHtml +
      originBannerHtml +
      '<div class="card" style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px;">' +
          (editMode
            ? '<input id="tlGoalTitleInput" value="' + esc(goal.title) + '" style="font-weight:700;font-size:1.1rem;flex:1;border-bottom:1.5px solid var(--brand);background:var(--surface-2);">'
            : '<h3 style="margin:0;font-size:1.1rem;color:var(--ink);">' + esc(goal.title) + '</h3>') +
          (goal.dueDate ? '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);">' + getDDay(goal.dueDate) + '</span>' : '') +
        '</div>' +
        '<div class="group-bar" style="margin-top:10px;height:7px;"><span style="width:' + pct + '%;"></span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:.8125rem;">' +
          '<span style="font-weight:700;color:var(--brand-strong);">' + pct + '% 달성</span>' +
          '<span class="faint">마일스톤 ' + doneMCount + '/' + totalMCount + ' · 할 일 ' + doneTCount + '/' + totalTCount + ' 완료</span>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">' +
        '<b style="font-size:.9375rem;color:var(--ink);">마일스톤 및 세부 할 일 로드맵</b>' +
        '<button class="btn btn-ghost btn-sm" id="btnAddTlMs" type="button" style="font-size:.8125rem;color:var(--brand-strong);border-color:var(--red-line);padding:2px 8px;font-weight:700;">+ 마일스톤 추가</button>' +
      '</div>' +
      (msListHtml || '<p class="faint" style="padding:20px 0;text-align:center;">마일스톤이 없습니다.</p>');

    // 이벤트 바인딩
    view.querySelectorAll('[data-tlchip]').forEach(function(chip){
      chip.addEventListener('click', function(){
        state.activeTeamLinkedGoalId = chip.dataset.tlchip;
        renderTeamLinkedGoalsScreen(view);
      });
    });

    var btnExploreMore = view.querySelector('#btnExploreMoreTeamGoals');
    if(btnExploreMore){
      btnExploreMore.addEventListener('click', function(){
        state.goalsSubTab = 'team';
        renderGoalsScreen();
      });
    }

    var btnOrigin = view.querySelector('#btnGoToTeamOrigin');
    if(btnOrigin){
      btnOrigin.addEventListener('click', function(){
        state.goalsSubTab = 'team';
        renderGoalsScreen();
      });
    }

    var btnToggleEdit = view.querySelector('#btnToggleTlEdit');
    if(btnToggleEdit){
      btnToggleEdit.addEventListener('click', async function(){
        state.teamLinkedEditMode = !state.teamLinkedEditMode;
        if(!state.teamLinkedEditMode){
          var titleInp = view.querySelector('#tlGoalTitleInput');
          if(titleInp && titleInp.value.trim()){
            goal.title = titleInp.value.trim();
          }
          await saveProfile();
        }
        renderTeamLinkedGoalsScreen(view);
      });
    }

    var btnDelGoal = view.querySelector('#btnDeleteTlGoal');
    if(btnDelGoal){
      btnDelGoal.addEventListener('click', async function(){
        if(!confirm('정말 "' + goal.title + '" 팀 연계 개인목표를 삭제할까요?')) return;
        p.goals = (p.goals || []).filter(function(g){ return g.id !== goal.id; });
        state.activeTeamLinkedGoalId = null;
        state.teamLinkedEditMode = false;
        syncTeamGoalParticipantProgress(goal);
        await saveProfile();
        toast('팀 연계 개인목표를 삭제했어요');
        renderTeamLinkedGoalsScreen(view);
      });
    }

    view.querySelectorAll('[data-tlcyclems]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var msId = btn.dataset.tlcyclems;
        var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
        if(!ms) return;
        ms.status = (ms.status === 'done' ? 'todo' : 'done');
        if(ms.status === 'done' && ms.tasks){
          ms.tasks.forEach(function(t){ t.done = true; });
        }
        syncTeamGoalParticipantProgress(goal);
        await saveProfile();
        triggerHaptic(15);
        renderTeamLinkedGoalsScreen(view);
        toast(ms.status === 'done' ? '🎉 마일스톤을 달성했어요! 팀 목표에 실시간 반영되었습니다.' : '마일스톤을 진행 중으로 변경했어요.');
      });
    });

    view.querySelectorAll('[data-tltoggletask]').forEach(function(el){
      el.addEventListener('click', async function(){
        var parts = el.dataset.tltoggletask.split(':');
        var msId = parts[0], tId = parts[1];
        var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
        if(!ms) return;
        var t = (ms.tasks || []).find(function(item){ return item.id === tId; });
        if(!t) return;
        t.done = !t.done;
        if(ms.tasks.length > 0 && ms.tasks.every(function(item){ return item.done; })){
          ms.status = 'done';
        } else if(!t.done && ms.status === 'done'){
          ms.status = 'todo';
        }
        syncTeamGoalParticipantProgress(goal);
        await saveProfile();
        triggerHaptic(12);
        renderTeamLinkedGoalsScreen(view);
        toast(t.done ? '✓ 할 일을 완료했어요! 팀 목표에 실시간 반영되었습니다.' : '할 일 완료를 취소했어요.');
      });
    });

    view.querySelectorAll('[data-tlmstitle]').forEach(function(inp){
      inp.addEventListener('change', async function(){
        var msId = inp.dataset.tlmstitle;
        var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
        if(ms){
          ms.title = inp.value.trim() || ms.title;
          await saveProfile();
        }
      });
    });

    view.querySelectorAll('[data-tltasktitle]').forEach(function(inp){
      inp.addEventListener('change', async function(){
        var parts = inp.dataset.tltasktitle.split(':');
        var ms = (goal.milestones || []).find(function(m){ return m.id === parts[0]; });
        if(ms){
          var t = (ms.tasks || []).find(function(item){ return item.id === parts[1]; });
          if(t){
            t.title = inp.value.trim() || t.title;
            await saveProfile();
          }
        }
      });
    });

    view.querySelectorAll('[data-tlmsdel]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var msId = btn.dataset.tlmsdel;
        if(!confirm('이 마일스톤을 삭제할까요?')) return;
        goal.milestones = (goal.milestones || []).filter(function(m){ return m.id !== msId; });
        syncTeamGoalParticipantProgress(goal);
        await saveProfile();
        renderTeamLinkedGoalsScreen(view);
      });
    });

    view.querySelectorAll('[data-tldeltask]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.tldeltask.split(':');
        var ms = (goal.milestones || []).find(function(m){ return m.id === parts[0]; });
        if(ms){
          ms.tasks = (ms.tasks || []).filter(function(item){ return item.id !== parts[1]; });
          syncTeamGoalParticipantProgress(goal);
          await saveProfile();
          renderTeamLinkedGoalsScreen(view);
        }
      });
    });

    view.querySelectorAll('[data-tladdtask]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var msId = btn.dataset.tladdtask;
        var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
        if(!ms) return;
        ms.tasks = ms.tasks || [];
        ms.tasks.push({
          id: 'tk_tl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: '새 세부 할 일',
          done: false
        });
        syncTeamGoalParticipantProgress(goal);
        await saveProfile();
        renderTeamLinkedGoalsScreen(view);
      });
    });

    var btnAddMs = view.querySelector('#btnAddTlMs');
    if(btnAddMs){
      btnAddMs.addEventListener('click', async function(){
        goal.milestones = goal.milestones || [];
        goal.milestones.push({
          id: 'ms_tl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: '새 마일스톤',
          status: 'todo',
          tasks: []
        });
        syncTeamGoalParticipantProgress(goal);
        await saveProfile();
        renderTeamLinkedGoalsScreen(view);
      });
    }
  }

  /* ------------------------------------------------------------
   * 4. 팀 목표 카드 내 연계복사참가 버튼 & 참가팀원 현황 섹션 렌더링
   * ------------------------------------------------------------ */
  function renderTeamGoalCardSections(g, tg, canManage){
    var p = getProfile();
    var myLinked = (p.goals || []).find(function(gItem){
      return gItem.teamLinked && gItem.teamGoalId === tg.id && gItem.groupId === g.id;
    });

    var teamLinkedBtnHtml = myLinked ?
      '<button class="btn btn-ghost btn-sm" data-gotolinkedgoal="' + myLinked.id + '" type="button" style="width:100%;margin:8px 0 10px;padding:8px 12px;border-radius:10px;border:1.5px solid var(--sage);background:var(--sage-soft);color:var(--sage);font-weight:700;font-size:.8125rem;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">' +
        '<span>✅ 내 팀 연계 개인목표 참가 중 (' + getGoalAchievement(myLinked) + '%)</span> <span style="font-size:.75rem;">➔ 바로가기</span>' +
      '</button>' :
      '<button class="btn btn-primary btn-sm" data-copyteamgoal="' + g.id + ':' + tg.id + '" type="button" style="width:100%;margin:8px 0 10px;padding:8px 12px;border-radius:10px;background:linear-gradient(135deg, var(--brand), #ec4899);color:#fff;border:none;font-weight:700;font-size:.8125rem;box-shadow:0 2px 6px rgba(225,29,72,0.22);display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">' +
        '<span>📥</span> <span>팀 연계 개인목표로 복사하며 참가</span>' +
      '</button>';

    var participants = getTeamGoalParticipants(g.id, tg);
    var participantsRows = participants.map(function(item){
      var isMe = item.isMe;
      var pActionsHtml = isMe ?
        '<button class="btn btn-ghost btn-sm" data-gotolinkedgoal="' + item.linkedGoalId + '" type="button" style="padding:2px 8px;font-size:.75rem;font-weight:700;border-color:var(--sage);color:var(--sage);cursor:pointer;">내 목표 ➔</button>' :
        '<div style="display:flex;align-items:center;gap:4px;">' +
          '<button class="btn btn-ghost btn-sm" data-tgpnudge="' + g.id + ':' + tg.id + ':' + esc(item.name) + '" type="button" title="응원 찌르기" style="padding:2px 6px;font-size:.75rem;font-weight:700;border-color:var(--gold);background:var(--gold-soft);color:var(--gold);cursor:pointer;">⚡ 찌르기</button>' +
          '<button class="btn btn-ghost btn-sm" data-tgpcmt="' + g.id + ':' + tg.id + ':' + esc(item.name) + '" type="button" title="댓글로 소통" style="padding:2px 6px;font-size:.75rem;font-weight:700;border-color:var(--teal);background:rgba(20,184,166,0.1);color:var(--teal);cursor:pointer;">💬 댓글</button>' +
          '<button class="btn btn-ghost btn-sm" data-tgpdm="' + g.id + ':' + tg.id + ':' + esc(item.name) + ':' + esc(item.avatar) + '" type="button" title="1:1 메시지" style="padding:2px 6px;font-size:.75rem;font-weight:700;border-color:var(--brand);background:var(--red-soft);color:var(--brand-strong);cursor:pointer;">✉️ DM</button>' +
        '</div>';

      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--card);border-radius:8px;border:1px solid var(--rule);gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
          '<span style="font-size:1.2rem;">' + (item.avatar || '🏃‍♂️') + '</span>' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<b style="font-size:.8125rem;color:var(--ink);">' + esc(item.name) + '</b>' +
              (isMe ? '<span style="font-size:.6875rem;padding:1px 5px;background:var(--sage-soft);color:var(--sage);border-radius:4px;font-weight:700;">나</span>' : '<span class="faint" style="font-size:.6875rem;">' + esc(item.role || '') + '</span>') +
            '</div>' +
            '<div class="faint" style="font-size:.6875rem;">마일스톤 ' + item.doneMs + '/' + item.totalMs + ' 완료</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex:0 0 auto;">' +
          '<div style="text-align:right;">' +
            '<div style="font-weight:700;font-size:.8125rem;color:var(--brand-strong);">' + item.progressPct + '%</div>' +
            '<div class="group-bar" style="width:48px;height:4px;margin-top:2px;"><span style="width:' + item.progressPct + '%;"></span></div>' +
          '</div>' +
          pActionsHtml +
        '</div>' +
      '</div>';
    }).join('');

    var participantsSectionHtml =
      '<div style="margin:8px 0 10px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:5px;font-size:.8125rem;font-weight:700;color:var(--ink);">' +
            '<span>👥</span> <span>참가 팀원 달성 현황</span>' +
            '<span style="font-size:.75rem;background:var(--card);color:var(--brand-strong);padding:1px 6px;border-radius:999px;border:1px solid var(--rule);">' + participants.length + '명</span>' +
          '</div>' +
          '<span class="faint" style="font-size:.75rem;">실시간 상호 체크 &amp; 소통</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;">' +
          participantsRows +
        '</div>' +
      '</div>';

    return {
      teamLinkedBtnHtml: teamLinkedBtnHtml,
      participantsSectionHtml: participantsSectionHtml
    };
  }

  /* ------------------------------------------------------------
   * 5. 팀 목표 카드 이벤트 바인딩 (복사참가/바로가기/찌르기/댓글/DM)
   * ------------------------------------------------------------ */
  function bindTeamGoalEvents(view){
    if(!view) return;
    var state = getState();

    view.querySelectorAll('[data-copyteamgoal]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var parts = btn.dataset.copyteamgoal.split(':');
        await copyTeamGoalToPersonalLinked(parts[0], parts[1]);
      });
    });

    view.querySelectorAll('[data-gotolinkedgoal]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var gId = btn.dataset.gotolinkedgoal;
        state.activeTeamLinkedGoalId = gId;
        state.goalsSubTab = 'teamLinked';
        renderGoalsScreen();
        toast('내 팀 연계 개인목표 화면으로 이동했습니다.');
      });
    });

    view.querySelectorAll('[data-tgpnudge]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var parts = btn.dataset.tgpnudge.split(':');
        var gid = parts[0], tgid = parts[1], targetName = parts[2];
        var gs = getGroupState(gid);
        var p = getProfile();
        gs.nudges = gs.nudges || {};
        gs.nudges[targetName] = {
          from: p.displayName || '나',
          at: new Date().toISOString(),
          tgId: tgid
        };
        await saveProfile();
        triggerHaptic(15);
        toast('⚡ "' + targetName + '"님을 콕 찔러 응원했어요! ("함께 완주해요! 💪")');
      });
    });

    view.querySelectorAll('[data-tgpcmt]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var parts = btn.dataset.tgpcmt.split(':');
        var gid = parts[0], tgid = parts[1], targetName = parts[2];
        var cmtInput = view.querySelector('input[data-cmtinput="' + tgid + '"]');
        if(cmtInput){
          cmtInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cmtInput.value = '@' + targetName + ' ';
          cmtInput.focus();
          toast('💬 댓글 입력창으로 이동했습니다.');
        }
      });
    });

    view.querySelectorAll('[data-tgpdm]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var parts = btn.dataset.tgpdm.split(':');
        var gid = parts[0], tgid = parts[1], targetName = parts[2], targetAvatar = parts[3];
        openTeamGoalMemberDmModal(gid, tgid, targetName, targetAvatar);
      });
    });
  }

  /* ------------------------------------------------------------
   * 6. 1:1 DM 대화 모달
   * ------------------------------------------------------------ */
  function openTeamGoalMemberDmModal(gid, tgid, targetName, targetAvatar){
    var gs = getGroupState(gid);
    gs.teamGoalDms = gs.teamGoalDms || {};
    gs.teamGoalDms[targetName] = gs.teamGoalDms[targetName] || [];
    var messages = gs.teamGoalDms[targetName];

    var p = getProfile();
    var myName = p.displayName || '나';

    function renderModalContent(){
      var msgListHtml = messages.length === 0
        ? '<p class="faint" style="text-align:center;padding:24px 0;font-size:.875rem;">' + esc(targetName) + '님과의 첫 대화를 시작해보세요!</p>'
        : messages.map(function(m){
            var isMe = m.sender === myName;
            return '<div style="display:flex;flex-direction:column;align-items:' + (isMe ? 'flex-end' : 'flex-start') + ';margin-bottom:8px;">' +
              '<div style="font-size:.6875rem;color:var(--ink-soft);margin-bottom:2px;">' + (isMe ? '나' : esc(targetName)) + '</div>' +
              '<div style="max-width:80%;padding:8px 12px;border-radius:12px;font-size:.875rem;line-height:1.4;' +
                (isMe ? 'background:var(--brand);color:#fff;border-bottom-right-radius:2px;' : 'background:var(--card2);color:var(--ink);border:1px solid var(--rule);border-bottom-left-radius:2px;') + '">' +
                esc(m.text) +
              '</div>' +
            '</div>';
          }).join('');

      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:1.8rem;">' + (targetAvatar || '🏃‍♂️') + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<h3 style="margin:0;font-size:1.1rem;color:var(--ink);">' + esc(targetName) + '님과의 1:1 대화</h3>' +
          '<div class="faint" style="font-size:.75rem;">팀 목표 달성을 함께 응원하고 팁을 나눠보세요</div>' +
        '</div>' +
      '</div>' +
      '<div id="tgDmMessageScrollArea" style="max-height:260px;min-height:140px;overflow-y:auto;background:var(--surface-2);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid var(--rule);">' +
        msgListHtml +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<input id="tgDmInputText" type="text" placeholder="메시지를 입력하세요..." style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;">' +
        '<button class="btn btn-primary btn-sm" id="btnSendTgDm" type="button" style="padding:0 14px;font-weight:700;">전송</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="btnCloseTgDmModal" type="button">닫기</button>' +
      '</div>';
    }

    openModal(renderModalContent(), function(sheet){
      function setupDmHandlers(){
        sheet.querySelector('#btnCloseTgDmModal').addEventListener('click', closeModal);
        var scrollArea = sheet.querySelector('#tgDmMessageScrollArea');
        if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;

        var sendBtn = sheet.querySelector('#btnSendTgDm');
        var inputEl = sheet.querySelector('#tgDmInputText');

        async function doSend(){
          var text = (inputEl && inputEl.value.trim()) || '';
          if(!text) return;
          messages.push({ sender: myName, text: text, at: new Date().toISOString() });
          inputEl.value = '';
          await saveProfile();
          triggerHaptic(12);

          sheet.innerHTML = renderModalContent();
          setupDmHandlers();

          setTimeout(async function(){
            var replies = [
              '응원 감사해요! 오늘 꼭 마일스톤 할일 완료하고 체크인할게요! 💪',
              '메시지 확인했어요! 서로 페이스 맞춰서 끝까지 완주해봐요 😊',
              '와 화이팅입니다! 저도 방금 세부 할일 하나 끝냈어요 🚀'
            ];
            var botReply = replies[Math.floor(Math.random() * replies.length)];
            messages.push({ sender: targetName, text: botReply, at: new Date().toISOString() });
            await saveProfile();
            if(document.body.contains(sheet)){
              sheet.innerHTML = renderModalContent();
              setupDmHandlers();
            }
          }, 1000);
        }

        if(sendBtn) sendBtn.addEventListener('click', doSend);
        if(inputEl){
          inputEl.addEventListener('keypress', function(e){
            if(e.key === 'Enter'){ e.preventDefault(); doSend(); }
          });
        }
      }
      setupDmHandlers();
    });
  }

  /* ------------------------------------------------------------
   * 7. 전역 모듈 등록 및 init
   * ------------------------------------------------------------ */
  var OurgoalTeamLinkedGoals = {
    init: function(deps){
      _ctx = deps || {};
    },
    getTeamGoalParticipants: getTeamGoalParticipants,
    syncTeamGoalParticipantProgress: syncTeamGoalParticipantProgress,
    copyTeamGoalToPersonalLinked: copyTeamGoalToPersonalLinked,
    renderTeamLinkedGoalsScreen: renderTeamLinkedGoalsScreen,
    renderTeamGoalCardSections: renderTeamGoalCardSections,
    bindTeamGoalEvents: bindTeamGoalEvents,
    openTeamGoalMemberDmModal: openTeamGoalMemberDmModal
  };

  global.OurgoalTeamLinkedGoals = OurgoalTeamLinkedGoals;

})(typeof window !== 'undefined' ? window : this);
