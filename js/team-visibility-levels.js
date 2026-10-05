/* ============================================================
 * 아워골(OurGoal) — 팀 목표 시인성 개선 및 수준관리(팀 통합 vs 목표별) 분리 시스템
 * #TASK-ES-110
 * 1. 1개 팀 목표 정보 과밀 해소 (마일스톤/댓글 기본 컴팩트 접힘, 핵심 메트릭 카드화)
 * 2. 공동 팀 목표 최초 진입 시 팀별 1개 노출 & 상단 슬라이드 칩 스위처 배선
 * 3. 팀 수준별 목표 관리 2계층 아코디언 (섹션 토글 + 조별 카드 인라인 아코디언)
 * 4. ‘팀 통합 수준관리’ vs ‘목표별 수준관리’ 분리 구축 및 상호 연동
 * ============================================================ */
(function(global){
  'use strict';

  /* ============ [#TASK-ES-402] 팀 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     ① 가져오기: js/team-level-group-modal.js 로 옮긴 함수(openLevelGroupDetailModal)를 이 스코프에서 같은 이름으로 쓴다(브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require).
     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalTeamGoalsKit.visibilityLevels.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다). */
  var _goalsKit = global.OurgoalTeamGoalsKit && global.OurgoalTeamGoalsKit.visibilityLevels;
  if(!_goalsKit && typeof require === 'function'){ _goalsKit = require('./team-level-group-modal.js'); }
  _goalsKit = _goalsKit || {};
  var openLevelGroupDetailModal = _goalsKit.openLevelGroupDetailModal;
  Object.defineProperties(_goalsKit.scope || (_goalsKit.scope = {}), Object.getOwnPropertyDescriptors({
    get askConfirm(){ return askConfirm; },
    get closeModal(){ return closeModal; },
    get daysFromNow(){ return daysFromNow; },
    get esc(){ return esc; },
    get getGoalLevelGoals(){ return getGoalLevelGoals; },
    get getGroupLevelGoals(){ return getGroupLevelGoals; },
    get getMockGroups(){ return getMockGroups; },
    get getProfile(){ return getProfile; },
    get openModal(){ return openModal; },
    get renderTeamGoalsScreen(){ return renderTeamGoalsScreen; },
    get saveProfile(){ return saveProfile; },
    get toast(){ return toast; },
    get triggerHaptic(){ return triggerHaptic; },
    get uid(){ return uid; }
  }));

  var _deps = {};

  function getState(){ return (_deps.getState ? _deps.getState() : global.state) || {}; }
  function getProfile(){ return (_deps.getProfile ? _deps.getProfile() : (getState().profile || {})) || {}; }
  function saveProfile(){ return (_deps.saveProfile ? _deps.saveProfile() : (global.saveProfile ? global.saveProfile() : Promise.resolve())); }
  var toast = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.toast.bind')) ? OurgoalCapabilities.request('ui.toast.bind') : typeof require === 'function' ? require('./core/toast.js').bind : function(get){ return function(m){ var o = get(); if(typeof o === 'function') return o(m); }; })(function(){ return _deps && _deps.toast; }); /* #TASK-ES-361: 공용 토스트 통로(js/core/toast.js · ui.toast) — 주입 토스트 우선, 없으면 공용(준비 전이면 대기열) */
  var _modal = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.modal.bind')) ? OurgoalCapabilities.request('ui.modal.bind') : typeof require === 'function' ? require('./core/modal.js').bind : function(get){ return { open: function(h, cb){ var o = get(); if(o && typeof o.openModal === 'function') return o.openModal(h, cb); }, close: function(){ var o = get(); if(o && typeof o.closeModal === 'function') return o.closeModal(); } }; })(function(){ return _deps; }); /* #TASK-ES-363: 공용 모달 통로(js/core/modal.js · ui.modal) — 주입 openModal/closeModal 우선, 없으면 정본(준비 전이면 대기열) */
  var openModal = _modal.open, closeModal = _modal.close;
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return _deps && _deps.confirm; });
  function triggerHaptic(ms){ if(_deps.triggerHaptic) _deps.triggerHaptic(ms); else if(global.triggerHaptic) global.triggerHaptic(ms); }
  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function dDay(dueDate){
    if(_deps.dDay) return _deps.dDay(dueDate);
    if(global.dDay) return global.dDay(dueDate);
    if(!dueDate) return '';
    var diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if(diff === 0) return 'D-Day';
    if(diff > 0) return 'D-' + diff;
    return 'D+' + Math.abs(diff);
  }
  function uid(p){
    if(_deps.uid) return _deps.uid(p);
    if(global.uid) return global.uid(p);
    return (p || 'id') + '_' + Math.random().toString(36).substr(2, 9);
  }
  function daysFromNow(n){
    if(_deps.daysFromNow) return _deps.daysFromNow(n);
    if(global.daysFromNow) return global.daysFromNow(n);
    var d = new Date();
    d.setDate(d.getDate() + n);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function getMockGroups(){ return _deps.MOCK_GROUPS || global.MOCK_GROUPS || []; }
  function getGroupState(gid){
    if(_deps.getGroupState) return _deps.getGroupState(gid);
    if(global.groupState) return global.groupState(gid);
    var p = getProfile();
    p.groupStates = p.groupStates || {};
    p.groupStates[gid] = p.groupStates[gid] || {};
    return p.groupStates[gid];
  }
  function canManageTeamGoals(gid){
    if(_deps.canManageTeamGoals) return _deps.canManageTeamGoals(gid);
    if(global.canManageTeamGoals) return global.canManageTeamGoals(gid);
    var gs = getGroupState(gid);
    return gs.myRole === 'owner' || gs.myRole === 'manager';
  }
  function renderTeamGoalsScreen(){
    if(_deps.renderTeamGoalsScreen) _deps.renderTeamGoalsScreen();
    else if(global.renderTeamGoalsScreen) global.renderTeamGoalsScreen();
  }
  function getTeamCommentsCache(){
    return _deps.TEAM_COMMENTS_CACHE || global.TEAM_COMMENTS_CACHE || {};
  }
  function teamCommentsBlockHtml(gid, targetId){
    if(_deps.teamCommentsBlockHtml) return _deps.teamCommentsBlockHtml(gid, targetId);
    if(global.teamCommentsBlockHtml) return global.teamCommentsBlockHtml(gid, targetId);
    return '';
  }
  /* ------------------------------------------------------------
   * 1. 팀 통합 수준 & 목표별 수준 데이터 헬퍼
   * ------------------------------------------------------------ */
  function getGroupLevelGoals(gid){
    if(_deps.getGroupLevelGoals) return _deps.getGroupLevelGoals(gid);
    if(global.getGroupLevelGoals) return global.getGroupLevelGoals(gid);
    var p = getProfile();
    p.settings = p.settings || {};
    p.settings.groupLevelGoals = p.settings.groupLevelGoals || {};
    return p.settings.groupLevelGoals[gid] || [];
  }

  function getGoalLevelGoals(gid, tgid){
    var p = getProfile();
    p.settings = p.settings || {};
    p.settings.goalLevelGoals = p.settings.goalLevelGoals || {};
    if(!p.settings.goalLevelGoals[tgid]){
      var g = getMockGroups().find(function(x){ return x.id === gid; });
      var tg = g && (g.teamGoals || []).find(function(x){ return x.id === tgid; });
      if(tg && Array.isArray(tg.levelGoals) && tg.levelGoals.length){
        p.settings.goalLevelGoals[tgid] = JSON.parse(JSON.stringify(tg.levelGoals));
      } else {
        p.settings.goalLevelGoals[tgid] = [];
      }
    }
    return p.settings.goalLevelGoals[tgid];
  }

  function copyTeamLevelsToGoal(gid, tgid){
    var teamLevels = getGroupLevelGoals(gid);
    var cloned = JSON.parse(JSON.stringify(teamLevels || []));
    cloned.forEach(function(lg, lidx){
      lg.id = 'lg_' + tgid + '_' + lidx;
      (lg.goals || []).forEach(function(goal, gidx){
        goal.id = 'lgg_' + tgid + '_' + lidx + '_' + gidx;
        (goal.milestones || []).forEach(function(m, midx){
          m.id = 'lgm_' + tgid + '_' + lidx + '_' + gidx + '_' + midx;
          (m.tasks || []).forEach(function(t, tidx){
            t.id = 'lgt_' + tgid + '_' + lidx + '_' + gidx + '_' + midx + '_' + tidx;
          });
        });
      });
    });
    var p = getProfile();
    p.settings = p.settings || {};
    p.settings.goalLevelGoals = p.settings.goalLevelGoals || {};
    p.settings.goalLevelGoals[tgid] = cloned;
    return cloned;
  }

  /* [#TASK-ES-402] openLevelGroupDetailModal → js/team-level-group-modal.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ------------------------------------------------------------
   * 3. 카드 내부 단일 대표 목표 및 수준관리 아코디언 렌더러
   * ------------------------------------------------------------ */
  function renderTeamCardContent(g, canManage, state){
    var goals = g.teamGoals || [];
    state.activeTeamGoalId = state.activeTeamGoalId || {};
    var curTgid = state.activeTeamGoalId[g.id];
    var activeTg = goals.find(function(x){ return x.id === curTgid; });
    if(!activeTg && goals.length > 0){
      activeTg = goals.find(function(x){
        return (x.milestones || []).some(function(m){ return m.status !== 'done'; });
      }) || goals[0];
      curTgid = activeTg.id;
      state.activeTeamGoalId[g.id] = curTgid;
    }

    // 3.1 상단 목표 스위처 칩 바 (목표가 2개 이상이거나 canManage일 때)
    var switcherChipsHtml = '';
    if(goals.length > 1 || canManage){
      switcherChipsHtml = '<div class="tg-goal-switcher" data-tgswitcher="' + g.id + '">' +
        goals.map(function(item){
          var isCur = item.id === curTgid;
          var dd = item.dueDate ? dDay(item.dueDate) : '';
          return '<button class="tg-goal-chip' + (isCur ? ' active' : '') + '" data-tgselectgoal="' + g.id + ':' + item.id + '" type="button">' +
            '<span>🎯 ' + esc(item.title) + '</span>' +
            (dd ? '<span class="tg-chip-dday">' + dd + '</span>' : '') +
          '</button>';
        }).join('') +
        (canManage ? '<button class="tg-goal-chip" data-addteamgoal="' + g.id + '" type="button" style="border-style:dashed;color:var(--brand-strong);background:var(--card);">+ 새 목표</button>' : '') +
      '</div>';
    }

    // 3.2 대표 1개 목표 카드 렌더링
    var isEdit = canManage && !!state.teamGoalEditMode;
    var singleGoalCardHtml = '';
    if(!goals.length){
      singleGoalCardHtml = isEdit
        ? '<div style="text-align:center;padding:20px;background:var(--card2);border-radius:12px;border:1px dashed var(--rule);margin:10px 0;"><p class="faint" style="margin:0 0 8px;">아직 공동 팀 목표가 없어요.</p><button class="btn btn-primary btn-sm" data-addteamgoal="' + g.id + '" type="button">+ 새 공동 팀 목표 추가 (추천 템플릿)</button></div>'
        : '<div style="text-align:center;padding:20px;background:var(--card2);border-radius:12px;border:1px dashed var(--rule);margin:10px 0;"><p class="faint" style="margin:0;">아직 공동 팀 목표가 없어요.</p></div>';
    } else if(activeTg){
      var tg = activeTg;
      var done = (tg.milestones || []).filter(function(m){ return m.status === 'done'; }).length;
      var total = (tg.milestones || []).length;
      var pct = total ? Math.round(done / total * 100) : 0;
      var tgPingBtn = (!canManage && global.OurgoalTeamLeaderCheck)
        ? global.OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(g.id, 'teamgoal', tg.id, tg.title, pct === 100)
        : '';
      var msHtml = (tg.milestones || []).map(function(m){
        var msPingBtn = (!canManage && global.OurgoalTeamLeaderCheck)
          ? global.OurgoalTeamLeaderCheck.renderMemberPingButtonHtml(g.id, 'milestone', m.id, m.title, m.status === 'done')
          : '';
        var tasks = m.tasks || [];
        var nT = tasks.length;
        var nDone = tasks.filter(function(t){ return t.done; }).length;
        var taskRows = tasks.map(function(t){
          return '<div class="task-row" style="padding:4px 0;display:flex;align-items:center;gap:6px;">' +
            '<div class="task-check' + (t.done ? ' done' : '') + '"' + (canManage ? ' data-tgtoggletask="' + tg.id + ':' + m.id + ':' + t.id + '" style="cursor:pointer;"' : '') + '>' + (t.done ? '✓' : '') + '</div>' +
            (isEdit
              ? '<input class="task-title' + (t.done ? ' done-text' : '') + '" data-tgtasktitle="' + tg.id + ':' + m.id + ':' + t.id + '" value="' + esc(t.title) + '" style="flex:1;font-size:.8125rem;">'
              : '<span class="task-title' + (t.done ? ' done-text' : '') + '" style="flex:1;font-size:.8125rem;">' + esc(t.title) + '</span>') +
            (isEdit ? '<button class="icon-btn" data-tgdeltask="' + tg.id + ':' + m.id + ':' + t.id + '" type="button" title="삭제" style="padding:2px 4px;">×</button>' : '') +
          '</div>';
        }).join('');

        var taskToggleBtn = nT > 0 ?
          '<button class="tg-task-toggle-btn" data-tgtoggletasks="' + tg.id + ':' + m.id + '" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-top:2px;">' +
            '세부 할 일 ' + nDone + '/' + nT + ' <span class="t-arrow">▼</span>' +
          '</button>' : (isEdit ? '<button class="tg-task-toggle-btn" data-tgaddtaskmodal="' + tg.id + ':' + m.id + '" type="button" style="background:transparent;border:none;color:var(--ink-faint);font-size:.75rem;padding:2px 0;cursor:pointer;">+ 할 일 추가</button>' : '');

        var tasksBox =
          '<div class="tg-subtask-box" data-tgtaskbox="' + tg.id + ':' + m.id + '" style="' + (isEdit ? '' : 'display:none;') + 'margin-top:6px;padding:6px 10px;background:var(--card2);border-radius:8px;border:1px dashed var(--rule);">' +
            taskRows +
            (isEdit ? '<div data-tgaddtask="' + tg.id + ':' + m.id + '" style="cursor:pointer;font-size:.75rem;color:var(--brand-strong);margin-top:4px;font-weight:700;">+ 세부 할 일 추가</div>' : '') +
          '</div>';

        var reorderBtns = isEdit ?
          '<div style="display:flex;align-items:center;gap:4px;margin-right:6px;">' +
            '<button class="tg-reorder-btn" data-tgmup="' + g.id + ':' + tg.id + ':' + m.id + '" type="button" title="위로" aria-label="위로 이동">▲</button>' +
            '<button class="tg-reorder-btn" data-tgmdown="' + g.id + ':' + tg.id + ':' + m.id + '" type="button" title="아래로" aria-label="아래로 이동">▼</button>' +
          '</div>' : '';

        var priorityBadgeOrSelect = isEdit ?
          '<select data-tgmprio="' + g.id + ':' + tg.id + ':' + m.id + '" style="font-size:.75rem;padding:2px 4px;border-radius:6px;border:1px solid var(--rule);background:var(--card);margin-right:6px;"><option value="high"' + (m.priority==='high'?' selected':'') + '>높음</option><option value="medium"' + (!m.priority||m.priority==='medium'?' selected':'') + '>보통</option><option value="low"' + (m.priority==='low'?' selected':'') + '>낮음</option></select>' :
          (m.priority ? '<span class="ms-priority-tag ms-priority-' + m.priority + '" style="margin-right:4px;">' + (m.priority==='high'?'높음':(m.priority==='low'?'낮음':'보통')) + '</span>' : '');

        var msCmtList = (getTeamCommentsCache()[g.id] || []).filter(function(c){ return c.target_id === m.id; });
        var msCmtCount = msCmtList.length;
        var msCommentsBox = '<div class="tg-ms-comments-wrap" style="margin-top:4px;">' +
          '<button class="tg-comments-toggle-bar" data-tgtogglemscomments="' + g.id + ':' + m.id + '" type="button">' +
            '💬 대화 ' + (msCmtCount ? '(' + msCmtCount + ')' : '') + ' <span class="c-arrow">▾</span>' +
          '</button>' +
          '<div class="tg-ms-comments-content" data-tgmscommentsbox="' + g.id + ':' + m.id + '" style="display:none;margin-top:6px;">' +
            teamCommentsBlockHtml(g.id, m.id) +
          '</div>' +
        '</div>';

        return '<div class="ms-row" data-tgmid="' + m.id + '" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              reorderBtns +
              '<div class="ms-status ' + m.status + '"' + (canManage ? ' data-tgcycle="1" style="cursor:pointer;"' : '') + '>' + (m.status === 'done' ? '✓' : '') + '</div>' +
              priorityBadgeOrSelect +
              '<div style="flex:1;min-width:0;">' +
                (isEdit
                  ? '<input class="' + (m.status === 'done' ? 'ms-title done-text' : 'ms-title') + '" data-tgmtitle="1" value="' + esc(m.title) + '" style="border-bottom:1.5px solid var(--brand);background:var(--surface-2);border-radius:6px;padding:3px 6px;">'
                  : '<span class="' + (m.status === 'done' ? 'ms-title done-text' : 'ms-title') + '" style="display:inline-block;">' + esc(m.title) + '</span>') +
                taskToggleBtn +
              '</div>' +
              msPingBtn +
              (isEdit ? '<div class="ms-actions"><button class="icon-btn" data-tgmdel="1" aria-label="마일스톤 삭제">×</button></div>' : '') +
            '</div>' +
            tasksBox +
            msCommentsBox +
          '</div>';
      }).join('');

      var tlSec = (global.OurgoalTeamLinkedGoals ? global.OurgoalTeamLinkedGoals.renderTeamGoalCardSections(g, tg, canManage) : { teamLinkedBtnHtml: '', participantsSectionHtml: '' });

      var goalCmtList = (getTeamCommentsCache()[g.id] || []).filter(function(c){ return c.target_id === tg.id; });
      var goalCmtCount = goalCmtList.length;
      var goalCommentsBox = '<div class="tg-goal-comments-wrap" style="margin-top:10px;">' +
        '<button class="tg-comments-toggle-bar" data-tgtogglegoalcomments="' + g.id + ':' + tg.id + '" type="button">' +
          '💬 팀 목표 전체 대화 ' + (goalCmtCount ? '(' + goalCmtCount + ')' : '') + ' <span class="c-arrow">▾</span>' +
        '</button>' +
        '<div class="tg-goal-comments-content" data-tggoalcommentsbox="' + g.id + ':' + tg.id + '" style="display:none;margin-top:6px;">' +
          teamCommentsBlockHtml(g.id, tg.id) +
        '</div>' +
      '</div>';

      var inlineDueHtml = isEdit
        ? '<div style="display:flex;align-items:center;gap:6px;margin:6px 0 8px;"><span class="faint" style="font-size:.75rem;">마감일</span><input type="date" data-tgdue="' + g.id + ':' + tg.id + '" value="' + (tg.dueDate || '') + '" style="font-size:.8125rem;padding:2px 6px;border-radius:6px;border:1px solid var(--rule);background:var(--card);"></div>'
        : '';

      singleGoalCardHtml = '<div class="tg-compact-goal-card" data-teamgoal="' + tg.id + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
            (isEdit
              ? '<input class="ms-title" data-tgtitle="1" value="' + esc(tg.title) + '" style="flex:1;font-weight:700;font-size:1rem;border-bottom:1.5px solid var(--brand);background:var(--surface-2);border-radius:6px;padding:3px 6px;">'
              : '<b style="font-size:1rem;color:var(--ink);">' + esc(tg.title) + '</b>') +
            tgPingBtn + (tg.dueDate ? '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);flex:0 0 auto;">' + dDay(tg.dueDate) + '</span>' : '') + (isEdit ? '<button class="icon-btn" data-tgdel="1" aria-label="팀 목표 삭제">×</button>' : '') +
          '</div>' +
          inlineDueHtml +
          '<div class="group-bar" style="margin-top:8px;"><span style="width:' + pct + '%;"></span></div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 8px;">' +
            '<span class="faint" style="font-size:.8125rem;font-weight:600;">달성률 ' + pct + '% · 마일스톤 ' + done + '/' + total + ' 완료</span>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              (isEdit ? '<button class="btn btn-ghost btn-sm" data-tgeditmodal="' + g.id + ':' + tg.id + '" type="button" style="font-size:.75rem;padding:2px 8px;border-color:var(--brand);color:var(--brand-strong);">✏️ 모달 상세 편집</button>' : '') +
              '<button class="btn btn-ghost btn-sm tg-fold-btn" data-tgfoldlist="' + tg.id + '" type="button" style="font-size:.75rem;padding:2px 7px;border-color:var(--rule);">' + ((state.profile && state.profile.settings && state.profile.settings.unfoldMsList && state.profile.settings.unfoldMsList[tg.id]) ? '마일스톤 접기 ▲' : '마일스톤 펼치기 ▼') + '</button>' +
            '</div>' +
          '</div>' +
          (tlSec.teamLinkedBtnHtml || '') + (tlSec.participantsSectionHtml || '') +
          '<div class="ms-list" data-tgmslist="' + tg.id + '" style="' + ((isEdit || (state.profile && state.profile.settings && state.profile.settings.unfoldMsList && state.profile.settings.unfoldMsList[tg.id])) ? '' : 'display:none;') + '">' + (msHtml || '<p class="faint" style="font-size:.8125rem;padding:6px 0;">등록된 마일스톤이 없어요.</p>') + '</div>' +
          (isEdit ? '<div class="add-ms-btn" data-tgaddms="1" style="margin-top:6px;cursor:pointer;">+ 마일스톤 추가</div>' : '') +
          goalCommentsBox +
        '</div>';
    }

    // 3.3 수준별 목표 관리 섹션 (2계층 아코디언 & 듀얼 모드 스위처)
    state.teamLevelMode = state.teamLevelMode || {};
    var curMode = state.teamLevelMode[g.id] || 'goal';
    var p = (state && state.profile) || getProfile();
    p.settings = p.settings || {};
    p.settings.foldLevelSection = p.settings.foldLevelSection || {};
    var isLevelFolded = p.settings.foldLevelSection[g.id] !== false;

    var levelGroups = (curMode === 'goal' && curTgid)
      ? getGoalLevelGoals(g.id, curTgid)
      : getGroupLevelGoals(g.id);

    var levelGroupsCount = levelGroups.length;

    var levelGroupsHtml = '';
    if(curMode === 'goal' && curTgid && levelGroupsCount === 0){
      levelGroupsHtml = '<div style="text-align:center;padding:16px 12px;background:var(--card2);border-radius:10px;border:1px dashed var(--rule);margin-bottom:8px;">' +
        '<p class="faint" style="font-size:.8125rem;margin:0 0 8px;">현재 선택된 목표에 등록된 수준별 조가 없어요.</p>' +
        '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">' +
          '<button class="btn btn-ghost btn-sm" data-tgcopyteamlevels="' + g.id + ':' + curTgid + '" type="button" style="font-size:.75rem;color:var(--brand-strong);border-color:var(--brand);font-weight:700;">🌐 팀 통합 수준 복사해오기</button>' +
          '<button class="btn btn-ghost btn-sm" data-addlevelgroup="' + g.id + ':' + curTgid + '" type="button" style="font-size:.75rem;color:var(--ink);">+ 새 조 만들기</button>' +
        '</div>' +
      '</div>';
    } else if(levelGroupsCount === 0){
      levelGroupsHtml = '<p class="faint" style="font-size:.8125rem;text-align:center;padding:12px 0;">등록된 수준별 조가 없어요.</p>';
    } else {
      levelGroupsHtml = levelGroups.map(function(lg){
        var nG = (lg.goals || []).length;
        var nM = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).length; }, 0);
        var nT = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).reduce(function(mAcc, ms){ return mAcc + (ms.tasks || []).length; }, 0); }, 0);
        var nDoneT = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).reduce(function(mAcc, ms){ return mAcc + (ms.tasks || []).filter(function(t){ return t.done; }).length; }, 0); }, 0);
        var nDoneM = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).filter(function(m){ return m.status === 'done'; }).length; }, 0);
        var lgProg = nT > 0 ? Math.round(nDoneT / nT * 100) : (nM > 0 ? Math.round(nDoneM / nM * 100) : 0);

        var goalsPreview = (lg.goals || []).map(function(goal){
          return '<div style="font-size:.8125rem;padding:3px 0;display:flex;align-items:center;justify-content:space-between;">' +
            '<span style="color:var(--ink);">• ' + esc(goal.title) + '</span>' +
            '<span class="faint" style="font-size:.6875rem;">마일스톤 ' + (goal.milestones || []).length + '</span>' +
          '</div>';
        }).join('');

        var openDetailKey = curMode === 'goal' ? (g.id + ':' + lg.id + ':' + curTgid) : (g.id + ':' + lg.id);

        return '<div class="tg-lg-accordion-row" data-lgrow="' + lg.id + '">' +
          '<div class="tg-lg-row-head" data-tgcardaccordion="' + g.id + ':' + lg.id + '">' +
            '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap;">' +
              '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">' + esc(lg.name) + '</span>' +
              '<span class="faint" style="font-size:.75rem;background:var(--card);padding:1px 6px;border-radius:6px;border:1px solid var(--rule);">' +
                '목표(' + nG + ') · 할일(' + nT + ')' +
              '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex:0 0 auto;">' +
              '<span class="dday-pill" style="font-size:.6875rem;padding:2px 7px;">' + lgProg + '%</span>' +
              '<button class="btn btn-ghost btn-sm" data-openleveldetail="' + openDetailKey + '" type="button" style="padding:2px 8px;font-size:.75rem;font-weight:700;color:var(--ink);border-color:var(--rule);">자세히보기</button>' +
              '<span class="tg-accordion-arrow tg-lg-arrow">▼</span>' +
            '</div>' +
          '</div>' +
          '<div class="tg-lg-row-body" data-tglgbody="' + lg.id + '" style="display:none;">' +
            '<div class="group-bar" style="margin-bottom:8px;height:5px;"><span style="width:' + lgProg + '%;"></span></div>' +
            (goalsPreview || '<p class="faint" style="font-size:.75rem;margin:0;">등록된 조별 세부 목표가 없어요.</p>') +
          '</div>' +
        '</div>';
      }).join('');
    }

    var activeTgTitle = activeTg ? (' (' + esc(activeTg.title).slice(0, 10) + (activeTg.title.length > 10 ? '...' : '') + ')') : '';
    var addGroupTargetKey = (curMode === 'goal' && curTgid) ? (g.id + ':' + curTgid) : g.id;

    var levelSectionHtml =
      '<div class="tg-accordion-section">' +
        '<div class="tg-accordion-header" data-tglevelaccordion="' + g.id + '">' +
          '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
            '<span style="font-size:1.0625rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span>' +
            '<b style="font-size:.9375rem;color:var(--ink);">팀 수준별 목표 관리</b>' +
            '<span class="faint" style="font-size:.8125rem;">(A·B·C조 맞춤 · ' + levelGroupsCount + '개 조)</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span class="tg-accordion-arrow ' + (isLevelFolded ? '' : 'rotated') + '">▼</span>' +
          '</div>' +
        '</div>' +
        '<div class="tg-accordion-body" data-tglevelbody="' + g.id + '" style="display:' + (isLevelFolded ? 'none' : 'block') + ';">' +
          '<div class="tg-level-dual-tabs">' +
            '<button class="tg-level-seg-btn' + (curMode === 'goal' ? ' active' : '') + '" data-tglevelmode="' + g.id + ':goal" type="button">' +
              '🎯 목표별 수준관리' + activeTgTitle +
            '</button>' +
            '<button class="tg-level-seg-btn' + (curMode === 'team' ? ' active' : '') + '" data-tglevelmode="' + g.id + ':team" type="button">' +
              '🌐 팀 통합 수준관리 (기본 조)' +
            '</button>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span class="faint" style="font-size:.75rem;">' + (curMode === 'goal' ? '💡 현재 선택된 목표 전용 조 목록입니다.' : '💡 팀 전반에 공통 적용되는 기본 조 목록입니다.') + '</span>' +
            (isEdit ? '<button class="btn btn-ghost btn-sm" data-addlevelgroup="' + addGroupTargetKey + '" type="button" style="padding:2px 8px;font-size:.75rem;color:var(--brand-strong);border-color:var(--red-line);flex:0 0 auto;">+ 조 추가</button>' : '') +
          '</div>' +
          (levelGroupsHtml || '<p class="faint" style="font-size:.8125rem;">등록된 수준별 조가 없어요.</p>') +
        '</div>' +
      '</div>';

    return switcherChipsHtml + singleGoalCardHtml + levelSectionHtml;
  }

  // #TASK-ES-406: 저장값(foldLevelSection[gid] === false)만 「펼침」이다. 렌더(isLevelFolded)·토글·일괄 접기(collapseAllTeamGoalAccordions)가 이 한 판정을 같이 쓴다.
  function isLevelSectionOpen(gid){
    var p = getProfile();
    var fold = (p.settings && p.settings.foldLevelSection) || {};
    return fold[gid] === false;
  }

  // #TASK-ES-409: 마일스톤 목록은 저장값(unfoldMsList[tgid])이 참일 때만 「펼침」이다. 렌더와 일괄 접기(collapseAllTeamGoalAccordions)가 같은 저장값을 따른다.
  function isMsListOpen(tgid){
    var p = getProfile();
    var unfold = (p.settings && p.settings.unfoldMsList) || {};
    return !!unfold[tgid];
  }

  /* ------------------------------------------------------------
   * 4. 이벤트 바인딩 헬퍼
   * ------------------------------------------------------------ */
  function bindEvents(view){
    if(!view) return;

    // 목표 전환 칩
    view.querySelectorAll('[data-tgselectgoal]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = btn.dataset.tgselectgoal.split(':');
        var state = getState();
        state.activeTeamGoalId = state.activeTeamGoalId || {};
        state.activeTeamGoalId[parts[0]] = parts[1];
        triggerHaptic(10);
        renderTeamGoalsScreen();
      });
    });

    // 수준별 섹션 아코디언 토글
    view.querySelectorAll('[data-tglevelaccordion]').forEach(function(el){
      el.addEventListener('click', async function(){
        var gid = el.dataset.tglevelaccordion;
        var p = getProfile();
        p.settings = p.settings || {};
        p.settings.foldLevelSection = p.settings.foldLevelSection || {};
        p.settings.foldLevelSection[gid] = isLevelSectionOpen(gid);
        triggerHaptic(10);
        await saveProfile();
        renderTeamGoalsScreen();
      });
    });

    // 개별 조 인라인 아코디언 토글
    view.querySelectorAll('[data-tgcardaccordion]').forEach(function(el){
      el.addEventListener('click', function(e){
        if(e.target.closest('[data-openleveldetail]')) return;
        var row = el.closest('.tg-lg-accordion-row');
        var body = row && row.querySelector('[data-tglgbody]');
        var arrow = el.querySelector('.tg-lg-arrow');
        if(!body) return;
        var isHidden = body.style.display === 'none' || !body.style.display;
        body.style.display = isHidden ? 'block' : 'none';
        if(arrow) arrow.classList.toggle('rotated', isHidden);
        triggerHaptic(5);
      });
    });

    // 목표별 vs 팀통합 모드 스위치
    view.querySelectorAll('[data-tglevelmode]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var parts = btn.dataset.tglevelmode.split(':');
        var state = getState();
        state.teamLevelMode = state.teamLevelMode || {};
        state.teamLevelMode[parts[0]] = parts[1];
        triggerHaptic(10);
        renderTeamGoalsScreen();
      });
    });

    // 팀 통합 수준 복사
    view.querySelectorAll('[data-tgcopyteamlevels]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.tgcopyteamlevels.split(':');
        copyTeamLevelsToGoal(parts[0], parts[1]);
        triggerHaptic(10);
        await saveProfile();
        toast('팀 통합 수준을 이 목표에 복사했어요');
        renderTeamGoalsScreen();
      });
    });

    // 댓글 토글 바
    view.querySelectorAll('[data-tgtogglemscomments]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var key = btn.dataset.tgtogglemscomments;
        var box = view.querySelector('[data-tgmscommentsbox="' + key + '"]');
        if(!box) return;
        var isHidden = box.style.display === 'none' || !box.style.display;
        box.style.display = isHidden ? 'block' : 'none';
        var arr = btn.querySelector('.c-arrow');
        if(arr) arr.textContent = isHidden ? '▲' : '▾';
      });
    });
    view.querySelectorAll('[data-tgtogglegoalcomments]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var key = btn.dataset.tgtogglegoalcomments;
        var box = view.querySelector('[data-tggoalcommentsbox="' + key + '"]');
        if(!box) return;
        var isHidden = box.style.display === 'none' || !box.style.display;
        box.style.display = isHidden ? 'block' : 'none';
        var arr = btn.querySelector('.c-arrow');
        if(arr) arr.textContent = isHidden ? '▲' : '▾';
      });
    });

    // 마일스톤 접기/펼치기 아코디언 토글
    view.querySelectorAll('[data-tgfoldlist]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var id = btn.dataset.tgfoldlist;
        var list = view.querySelector('[data-tgmslist="' + id + '"]');
        if(!list) return;
        var isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        btn.textContent = isHidden ? '마일스톤 접기 ▲' : '마일스톤 펼치기 ▼';
        var p = getProfile();
        p.settings = p.settings || {};
        p.settings.unfoldMsList = p.settings.unfoldMsList || {};
        p.settings.unfoldMsList[id] = isHidden;
        triggerHaptic(10);
        await saveProfile();
      });
    });

    // 세부 할 일 접기/펼치기 토글
    view.querySelectorAll('[data-tgtoggletasks]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var key = btn.dataset.tgtoggletasks;
        var box = view.querySelector('[data-tgtaskbox="' + key + '"]');
        if(!box) return;
        var isHidden = box.style.display === 'none' || !box.style.display;
        box.style.display = isHidden ? 'block' : 'none';
        var arr = btn.querySelector('.t-arrow');
        if(arr) arr.textContent = isHidden ? '▲' : '▼';
        triggerHaptic(5);
      });
    });
  }

  /* ------------------------------------------------------------
   * 5. 외부 노출 및 초기화
   * ------------------------------------------------------------ */
  var OurgoalTeamVisibilityLevels = {
    init: function(deps){
      _deps = deps || {};
    },
    getGoalLevelGoals: getGoalLevelGoals,
    copyTeamLevelsToGoal: copyTeamLevelsToGoal,
    openLevelGroupDetailModal: openLevelGroupDetailModal,
    renderTeamCardContent: renderTeamCardContent,
    bindEvents: bindEvents,
    isLevelSectionOpen: isLevelSectionOpen,
    isMsListOpen: isMsListOpen
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalTeamVisibilityLevels;
  }
  global.OurgoalTeamVisibilityLevels = OurgoalTeamVisibilityLevels;

})(typeof window !== 'undefined' ? window : global);
