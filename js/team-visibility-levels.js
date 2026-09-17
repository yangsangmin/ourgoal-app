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

  var _deps = {};

  function getState(){ return (_deps.getState ? _deps.getState() : global.state) || {}; }
  function getProfile(){ return (_deps.getProfile ? _deps.getProfile() : (getState().profile || {})) || {}; }
  function saveProfile(){ return (_deps.saveProfile ? _deps.saveProfile() : (global.saveProfile ? global.saveProfile() : Promise.resolve())); }
  function toast(msg){ if(_deps.toast) _deps.toast(msg); else if(global.toast) global.toast(msg); }
  function openModal(html, cb){ if(_deps.openModal) _deps.openModal(html, cb); else if(global.openModal) global.openModal(html, cb); }
  function closeModal(){ if(_deps.closeModal) _deps.closeModal(); else if(global.closeModal) global.closeModal(); }
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

  /* ------------------------------------------------------------
   * 2. 수준별 조 상세 모달 (목표별 tgid 지원)
   * ------------------------------------------------------------ */
  function openLevelGroupDetailModal(gid, lgId, tgid){
    var g = getMockGroups().find(function(x){ return x.id === gid; });
    var levelGroups = tgid ? getGoalLevelGoals(gid, tgid) : getGroupLevelGoals(gid);
    var lg = levelGroups.find(function(x){ return x.id === lgId; });
    if(!lg && tgid){
      levelGroups = getGroupLevelGoals(gid);
      lg = levelGroups.find(function(x){ return x.id === lgId; });
      tgid = null;
    }
    if(!lg) return;

    var nG = (lg.goals || []).length;
    var nM = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).length; }, 0);
    var nT = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).reduce(function(mAcc, ms){ return mAcc + (ms.tasks || []).length; }, 0); }, 0);
    var nDoneT = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).reduce(function(mAcc, ms){ return mAcc + (ms.tasks || []).filter(function(t){ return t.done; }).length; }, 0); }, 0);
    var nDoneM = (lg.goals || []).reduce(function(acc, goal){ return acc + (goal.milestones || []).filter(function(m){ return m.status === 'done'; }).length; }, 0);
    var lgProg = nT > 0 ? Math.round(nDoneT / nT * 100) : (nM > 0 ? Math.round(nDoneM / nM * 100) : 0);

    var goalsHtml = (lg.goals || []).map(function(goal){
      var msListHtml = (goal.milestones || []).map(function(m){
        var curPrio = m.priority || 'med';
        var prioLabel = curPrio === 'high' ? '높음' : (curPrio === 'low' ? '낮음' : '보통');
        var prioTagHtml = '<span class="ms-priority-tag ms-priority-' + curPrio + '" data-lgcyclestatusprio="' + goal.id + ':' + m.id + '" title="우선순위 변경 (클릭)">' + prioLabel + '</span>';
        var tasks = m.tasks || [];
        var taskRows = tasks.map(function(t){
          return '<div class="task-row" style="padding:3px 0;">' +
            '<div class="task-check' + (t.done ? ' done' : '') + '" data-lgtoggletask="' + goal.id + ':' + m.id + ':' + t.id + '" style="cursor:pointer;">' + (t.done ? '✓' : '') + '</div>' +
            '<input class="task-title' + (t.done ? ' done-text' : '') + '" data-lgtasktitle="' + goal.id + ':' + m.id + ':' + t.id + '" value="' + esc(t.title) + '" style="font-size:.875rem;">' +
            '<button class="icon-btn" data-lgdeltask="' + goal.id + ':' + m.id + ':' + t.id + '" type="button" title="삭제">×</button>' +
          '</div>';
        }).join('');

        return '<div class="ms-row" style="margin-top:6px;padding:8px 10px;background:var(--card);border-radius:12px;border:1px solid var(--rule);">' +
          '<div class="ms-main" style="align-items:flex-start;">' +
            '<div class="ms-status ' + m.status + '" data-lgcyclestatus="' + goal.id + ':' + m.id + '" style="margin-top:2px;cursor:pointer;" title="상태 변경 (클릭)">' + (m.status === 'done' ? '✓' : '') + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;line-height:1;min-height:16px;">' +
                prioTagHtml +
                (tasks.length > 0 ? '<span class="faint" style="font-size:.6875rem;background:var(--card2);padding:1px 6px;border-radius:6px;">' + tasks.filter(function(t){ return t.done; }).length + '/' + tasks.length + ' 완료</span>' : '') +
              '</div>' +
              '<div style="display:flex;align-items:center;width:100%;">' +
                '<input class="ms-title' + (m.status === 'done' ? ' done-text' : '') + '" data-lgmtitle="' + goal.id + ':' + m.id + '" value="' + esc(m.title) + '" style="width:100%;font-size:.9375rem;">' +
              '</div>' +
            '</div>' +
            '<div class="ms-actions">' +
              '<button class="icon-btn" data-lgdelms="' + goal.id + ':' + m.id + '" type="button" title="마일스톤 삭제">×</button>' +
            '</div>' +
          '</div>' +
          (taskRows ? '<div class="task-list" style="margin-top:4px;">' + taskRows + '</div>' : '') +
          '<div class="task-add" data-lgaddtask="' + goal.id + ':' + m.id + '" style="cursor:pointer;margin-top:4px;font-size:.8125rem;padding:4px 8px;">+ 세부 할 일 추가</div>' +
        '</div>';
      }).join('');

      return '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
          '<input data-lggoaltitle="' + goal.id + '" value="' + esc(goal.title) + '" style="font-weight:700;font-size:1rem;background:transparent;border:none;border-bottom:1px solid var(--rule);padding:2px 4px;flex:1;" placeholder="목표명을 입력하세요">' +
          '<button class="icon-btn" data-lgdelgoal="' + goal.id + '" type="button" title="목표 삭제" style="color:var(--ink-faint);">×</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
          '<span class="faint" style="font-size:.8125rem;">마감일</span>' +
          '<input type="date" data-lggoaldue="' + goal.id + '" value="' + (goal.dueDate || '') + '" style="font-size:.8125rem;padding:2px 6px;border-radius:6px;border:1px solid var(--rule);background:var(--card);">' +
        '</div>' +
        '<div style="margin-top:6px;">' +
          msListHtml +
          '<div class="add-ms-btn" data-lgaddms="' + goal.id + '" style="cursor:pointer;margin-top:8px;padding:8px;font-size:.8125rem;">+ 마일스톤 추가</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var modalHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:1.5rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span>' +
        '<div>' +
          '<h3 style="margin:0;font-size:1.1rem;">수준별 목표 상세 관리</h3>' +
          '<div class="faint" style="font-size:.8125rem;">' + (g ? g.icon + ' ' + esc(g.name) : '') + (tgid ? ' (목표별 맞춤 조)' : ' (팀 통합 기본 조)') + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="dday-pill" style="background:var(--sage-soft);color:var(--sage);font-weight:700;">달성률 ' + lgProg + '%</span>' +
    '</div>' +

    '<div class="field" style="margin:12px 0 10px;">' +
      '<label style="font-weight:700;font-size:.8125rem;">조/그룹 이름 (수정 가능)</label>' +
      '<div style="display:flex;gap:6px;">' +
        '<input id="modalLgNameInput" type="text" value="' + esc(lg.name) + '" placeholder="예: A조 (상급/대회반)" style="font-weight:700;">' +
        '<button class="btn btn-ghost btn-sm" id="modalSaveLgNameBtn" type="button" style="flex:0 0 auto;">이름 저장</button>' +
      '</div>' +
    '</div>' +

    '<div style="background:var(--card2);border-radius:10px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">' +
      '<span class="faint" style="font-size:.8125rem;">요약: 목표 ' + nG + '개 · 마일스톤 ' + nM + '개 · 할일 ' + nT + '개</span>' +
      '<span class="faint" style="font-size:.8125rem;font-weight:700;">완료 할일 ' + nDoneT + '개</span>' +
    '</div>' +
    '<div class="group-bar" style="height:6px;margin-bottom:14px;"><span style="width:' + lgProg + '%;"></span></div>' +

    '<div style="max-height:55vh;overflow-y:auto;padding-right:2px;margin-bottom:12px;">' +
      (goalsHtml || '<p class="faint" style="text-align:center;padding:20px 0;">아직 등록된 조별 목표가 없어요. 아래 버튼으로 추가해보세요.</p>') +
    '</div>' +

    '<button class="btn btn-primary btn-sm btn-block" id="modalAddLgGoalBtn" type="button" style="margin-bottom:10px;">+ 이 조에 새 목표 추가</button>' +

    '<div class="modal-actions" style="margin-top:6px;">' +
      '<button class="btn btn-ghost btn-sm" id="modalDelLgBtn" type="button" style="color:var(--brand-strong);flex:0 0 auto;">조 삭제</button>' +
      '<button class="btn btn-ghost btn-sm" id="modalCloseLgBtn" type="button" style="flex:1;">닫기</button>' +
    '</div>';

    openModal(modalHtml, function(sheet){
      sheet.querySelector('#modalSaveLgNameBtn').addEventListener('click', async function(){
        var newN = sheet.querySelector('#modalLgNameInput').value.trim();
        if(newN){
          lg.name = newN;
          await saveProfile();
          toast('조 이름을 수정했어요');
          renderTeamGoalsScreen();
        }
      });

      sheet.querySelector('#modalAddLgGoalBtn').addEventListener('click', async function(){
        if(!lg.goals) lg.goals = [];
        lg.goals.push({
          id: uid('lgg'),
          title: '새 수준별 목표',
          dueDate: daysFromNow(30),
          milestones: [
            { id: uid('lgm'), title: '1단계 실천 과제', status: 'todo', priority: 'med', tasks: [] }
          ]
        });
        await saveProfile();
        toast('목표를 추가했어요');
        closeModal();
        openLevelGroupDetailModal(gid, lgId, tgid);
        renderTeamGoalsScreen();
      });

      sheet.querySelector('#modalDelLgBtn').addEventListener('click', async function(){
        if(!confirm('정말 "' + lg.name + '" 조와 속한 모든 목표/할일을 삭제할까요?')) return;
        var p = getProfile();
        p.settings = p.settings || {};
        if(tgid){
          p.settings.goalLevelGoals = p.settings.goalLevelGoals || {};
          p.settings.goalLevelGoals[tgid] = levelGroups.filter(function(x){ return x.id !== lgId; });
        } else {
          p.settings.groupLevelGoals = p.settings.groupLevelGoals || {};
          p.settings.groupLevelGoals[gid] = levelGroups.filter(function(x){ return x.id !== lgId; });
        }
        await saveProfile();
        toast('조를 삭제했어요');
        closeModal();
        renderTeamGoalsScreen();
      });

      sheet.querySelector('#modalCloseLgBtn').addEventListener('click', closeModal);

      // Goal title & due edits
      sheet.querySelectorAll('[data-lggoaltitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var goalId = inp.dataset.lggoaltitle;
          var goal = (lg.goals || []).find(function(x){ return x.id === goalId; });
          if(goal){ goal.title = inp.value.trim() || goal.title; await saveProfile(); renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lggoaldue]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var goalId = inp.dataset.lggoaldue;
          var goal = (lg.goals || []).find(function(x){ return x.id === goalId; });
          if(goal){ goal.dueDate = inp.value || null; await saveProfile(); renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdelgoal]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var goalId = btn.dataset.lgdelgoal;
          lg.goals = (lg.goals || []).filter(function(x){ return x.id !== goalId; });
          await saveProfile();
          toast('목표를 삭제했어요');
          closeModal();
          openLevelGroupDetailModal(gid, lgId, tgid);
          renderTeamGoalsScreen();
        });
      });

      // Milestones
      sheet.querySelectorAll('[data-lgaddms]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var goalId = btn.dataset.lgaddms;
          var goal = (lg.goals || []).find(function(x){ return x.id === goalId; });
          if(goal){
            if(!goal.milestones) goal.milestones = [];
            goal.milestones.push({ id: uid('lgm'), title: '새 마일스톤', status: 'todo', priority: 'med', tasks: [] });
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgcyclestatus]').forEach(function(el){
        el.addEventListener('click', async function(){
          var parts = el.dataset.lgcyclestatus.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){
            var order = ['todo', 'doing', 'done'];
            m.status = order[(order.indexOf(m.status) + 1) % 3];
            triggerHaptic(10);
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgcyclestatusprio]').forEach(function(el){
        el.addEventListener('click', async function(){
          var parts = el.dataset.lgcyclestatusprio.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){
            var pOrder = ['med', 'high', 'low'];
            m.priority = pOrder[(pOrder.indexOf(m.priority || 'med') + 1) % 3];
            triggerHaptic(10);
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgmtitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var parts = inp.dataset.lgmtitle.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){ m.title = inp.value.trim() || m.title; await saveProfile(); renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdelms]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgdelms.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          if(goal){
            goal.milestones = (goal.milestones || []).filter(function(x){ return x.id !== parts[1]; });
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });

      // Tasks
      sheet.querySelectorAll('[data-lgaddtask]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgaddtask.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){
            if(!m.tasks) m.tasks = [];
            m.tasks.push({ id: uid('lgt'), title: '새 세부 할 일', done: false });
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgtoggletask]').forEach(function(el){
        el.addEventListener('click', async function(){
          var parts = el.dataset.lgtoggletask.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          var t = m && (m.tasks || []).find(function(x){ return x.id === parts[2]; });
          if(t){
            t.done = !t.done;
            triggerHaptic(10);
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgtasktitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var parts = inp.dataset.lgtasktitle.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          var t = m && (m.tasks || []).find(function(x){ return x.id === parts[2]; });
          if(t){ t.title = inp.value.trim() || t.title; await saveProfile(); renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdeltask]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgdeltask.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){
            m.tasks = (m.tasks || []).filter(function(x){ return x.id !== parts[2]; });
            await saveProfile();
            closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            renderTeamGoalsScreen();
          }
        });
      });
    });
  }

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
    var p = getProfile();
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
        p.settings.foldLevelSection[gid] = !p.settings.foldLevelSection[gid];
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
    bindEvents: bindEvents
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalTeamVisibilityLevels;
  }
  global.OurgoalTeamVisibilityLevels = OurgoalTeamVisibilityLevels;

})(typeof window !== 'undefined' ? window : global);
