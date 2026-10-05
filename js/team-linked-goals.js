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

  /* ============ [#TASK-ES-402] 팀 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     ① 가져오기: js/team-linked-goals-screen.js 로 옮긴 함수(renderTeamLinkedGoalsScreen)를 이 스코프에서 같은 이름으로 쓴다(브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require).
     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTeamGoalsKit.linkedGoals.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */
  var _goalsKit = global.OurgoalTeamGoalsKit && global.OurgoalTeamGoalsKit.linkedGoals;
  if(!_goalsKit && typeof require === 'function'){ _goalsKit = require('./team-linked-goals-screen.js'); }
  _goalsKit = _goalsKit || {};
  var renderTeamLinkedGoalsScreen = _goalsKit.renderTeamLinkedGoalsScreen;
  Object.defineProperties(_goalsKit.scope || (_goalsKit.scope = {}), Object.getOwnPropertyDescriptors({
    get askConfirm(){ return askConfirm; },
    get esc(){ return esc; },
    get getDDay(){ return getDDay; },
    get getGoalAchievement(){ return getGoalAchievement; },
    get getProfile(){ return getProfile; },
    get getState(){ return getState; },
    get renderGoalsScreen(){ return renderGoalsScreen; },
    get saveProfile(){ return saveProfile; },
    get syncTeamGoalParticipantProgress(){ return syncTeamGoalParticipantProgress; },
    get toast(){ return toast; },
    get triggerHaptic(){ return triggerHaptic; }
  }));

  var _ctx = {};

  function getState(){ return (_ctx.getState ? _ctx.getState() : global.state) || {}; }
  function getProfile(){ return (_ctx.getProfile ? _ctx.getProfile() : (getState().profile || {})) || {}; }
  function saveProfile(){ return (_ctx.saveProfile ? _ctx.saveProfile() : (global.saveProfile ? global.saveProfile() : Promise.resolve())); }
  var toast = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.toast.bind')) ? OurgoalCapabilities.request('ui.toast.bind') : typeof require === 'function' ? require('./core/toast.js').bind : function(get){ return function(m){ var o = get(); if(typeof o === 'function') return o(m); }; })(function(){ return _ctx && _ctx.toast; }); /* #TASK-ES-361: 공용 토스트 통로(js/core/toast.js · ui.toast) — 주입 토스트 우선, 없으면 공용(준비 전이면 대기열) */
  var _modal = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.modal.bind')) ? OurgoalCapabilities.request('ui.modal.bind') : typeof require === 'function' ? require('./core/modal.js').bind : function(get){ return { open: function(h, cb){ var o = get(); if(o && typeof o.openModal === 'function') return o.openModal(h, cb); }, close: function(){ var o = get(); if(o && typeof o.closeModal === 'function') return o.closeModal(); } }; })(function(){ return _ctx; }); /* #TASK-ES-363: 공용 모달 통로(js/core/modal.js · ui.modal) — 주입 openModal/closeModal 우선, 없으면 정본(준비 전이면 대기열) */
  var openModal = _modal.open, closeModal = _modal.close;
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return _ctx && _ctx.confirm; });
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
      toast('팀 정보를 찾을 수 없습니다.');
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

  /* [#TASK-ES-402] renderTeamLinkedGoalsScreen → js/team-linked-goals-screen.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

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
    var isFolded = !isParticipantsOpen(tg.id);
    var participantsRows = participants.map(function(item){
      var isMe = item.isMe;
      var pActionsHtml = isMe ?
        '<button class="btn btn-ghost tg-p-action-btn" data-gotolinkedgoal="' + item.linkedGoalId + '" type="button" style="border-color:var(--sage);color:var(--sage);">내 목표 ➔</button>' :
        '<div class="tg-p-actions">' +
          '<button class="btn btn-ghost tg-p-action-btn" data-tgpnudge="' + g.id + ':' + tg.id + ':' + esc(item.name) + '" type="button" title="응원 찌르기" style="border-color:var(--gold);background:var(--gold-soft);color:var(--gold);">⚡ 찌르기</button>' +
          '<button class="btn btn-ghost tg-p-action-btn" data-tgpcmt="' + g.id + ':' + tg.id + ':' + esc(item.name) + '" type="button" title="댓글로 소통" style="border-color:var(--teal);background:rgba(20,184,166,0.1);color:var(--teal);">💬 댓글</button>' +
          '<button class="btn btn-ghost tg-p-action-btn" data-tgpdm="' + g.id + ':' + tg.id + ':' + esc(item.name) + ':' + esc(item.avatar) + '" type="button" title="1:1 메시지" style="border-color:var(--brand);background:var(--red-soft);color:var(--brand-strong);">✉️ DM</button>' +
        '</div>';

      var roleBadge = isMe ?
        '<span class="tg-p-role-badge me">나</span>' :
        (item.role ? '<span class="tg-p-role-badge peer">' + esc(item.role) + '</span>' : '');

      return '<div class="tg-participant-row">' +
        '<div class="tg-p-left">' +
          '<span class="tg-p-avatar">' + (item.avatar || '🏃‍♂️') + '</span>' +
          '<div class="tg-p-meta">' +
            '<b class="tg-p-name">' + esc(item.name) + '</b>' +
            roleBadge +
            '<span class="tg-p-divider">·</span>' +
            '<span class="tg-p-status" title="마일스톤 ' + item.doneMs + '/' + item.totalMs + ' 완료">마일스톤 ' + item.doneMs + '/' + item.totalMs + ' 완료</span>' +
          '</div>' +
        '</div>' +
        '<div class="tg-p-right">' +
          '<div class="tg-p-progress">' +
            '<span class="tg-p-pct">' + item.progressPct + '%</span>' +
            '<div class="group-bar tg-p-bar"><span style="width:' + item.progressPct + '%;"></span></div>' +
          '</div>' +
          pActionsHtml +
        '</div>' +
      '</div>';
    }).join('');

    var participantsSectionHtml =
      '<div class="tg-participants-section">' +
        '<div class="tg-p-header" data-tgparttoggle="' + g.id + ':' + tg.id + '">' +
          '<div class="tg-p-header-title">' +
            '<span>👥</span> <span>참가 팀원 달성 현황</span>' +
            '<span class="tg-p-header-badge">' + participants.length + '명</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span class="faint" style="font-size:.75rem;">실시간 상호 체크 &amp; 소통</span>' +
            '<span class="tg-accordion-arrow ' + (isFolded ? '' : 'rotated') + '" style="font-size:.6875rem;">▼</span>' +
          '</div>' +
        '</div>' +
        '<div class="tg-p-list" data-tgpartlist="' + tg.id + '" style="display:' + (isFolded ? 'none' : 'flex') + ';">' +
          (participantsRows || '<p class="faint" style="font-size:.8125rem;text-align:center;padding:8px 0;">아직 참가 팀원이 없어요.</p>') +
        '</div>' +
      '</div>';

    return {
      teamLinkedBtnHtml: teamLinkedBtnHtml,
      participantsSectionHtml: participantsSectionHtml
    };
  }

  // #TASK-ES-409: 참가 팀원 달성 현황 목록은 저장값 foldParticipants[tgid] 가 참이 아니면 「펼침」이다(기본 펼침). 렌더·일괄 접기(collapseAllTeamGoalAccordions)의 화살표가 이 한 판정을 같이 쓴다.
  function isParticipantsOpen(tgid){
    var p = getProfile();
    var fold = (p.settings && p.settings.foldParticipants) || {};
    return !fold[tgid];
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

    view.querySelectorAll('[data-tgparttoggle]').forEach(function(header){
      header.addEventListener('click', async function(e){
        e.stopPropagation();
        var parts = header.dataset.tgparttoggle.split(':');
        var tgid = parts[1];
        var list = view.querySelector('[data-tgpartlist="' + tgid + '"]');
        var arrow = header.querySelector('.tg-accordion-arrow');
        if(!list) return;
        var isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'flex' : 'none';
        if(arrow) arrow.classList.toggle('rotated', isHidden);
        var p = getProfile();
        p.settings = p.settings || {};
        p.settings.foldParticipants = p.settings.foldParticipants || {};
        p.settings.foldParticipants[tgid] = !isHidden;
        triggerHaptic(10);
        await saveProfile();
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
   * 6.5 팀 목표 수정/삭제 시 연계 개인목표(Linked Goals) 참조 무결성 자동 수호
   * #TASK-ES-176 (시너지 E2)
   * ------------------------------------------------------------ */
  function syncWithTeamGoals(teamGoals, groupId){
    if(!teamGoals || !Array.isArray(teamGoals) || !groupId) return;
    var p = getProfile();
    if(!p || !p.goals) return;

    var linkedGoals = p.goals.filter(function(gItem){
      return gItem.teamLinked && gItem.groupId === groupId;
    });

    linkedGoals.forEach(function(lg){
      var tg = teamGoals.find(function(item){ return item.id === lg.teamGoalId; });
      if(!tg){
        lg.teamLinkedStatus = 'detached';
        return;
      }

      lg.originTitle = tg.title;
      if(!lg.customizedTitle){
        lg.title = tg.title;
      }
      if(tg.dueDate) lg.dueDate = tg.dueDate;

      if(Array.isArray(tg.milestones)){
        var tgMilestones = tg.milestones;
        (lg.milestones || []).forEach(function(lm, idx){
          if(tgMilestones[idx]){
            lm.teamMilestoneTitle = tgMilestones[idx].title;
            if(!lm.customized){
              lm.title = tgMilestones[idx].title;
            }
          }
        });
      }

      syncTeamGoalParticipantProgress(lg);
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
    openTeamGoalMemberDmModal: openTeamGoalMemberDmModal,
    syncWithTeamGoals: syncWithTeamGoals,
    isParticipantsOpen: isParticipantsOpen
  };

  global.OurgoalTeamLinkedGoals = OurgoalTeamLinkedGoals;

})(typeof window !== 'undefined' ? window : this);
