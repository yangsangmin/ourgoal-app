/**
 * OurGoal Team Cell: 수준별 조 상세 모달 — 팀 통합/목표별 수준 그룹의 목표·마일스톤·할 일 편집 바텀시트 (#TASK-ES-402 · 팀 세포 쪼개기 3차)
 *
 * js/team-visibility-levels.js(837줄)에서 동작 그대로 옮겼다(이전 전 126~433줄).
 *   openLevelGroupDetailModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamVisibilityLevels.openLevelGroupDetailModal 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-visibility-levels.js 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태를 getter(대입하는 상태는 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 목표 세포 키트의 visibilityLevels 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var KIT = global.OurgoalTeamGoalsKit = global.OurgoalTeamGoalsKit || {};
  var K = KIT.visibilityLevels = KIT.visibilityLevels || {};
  var T = K.scope = K.scope || {};

  /* ------------------------------------------------------------
   * 2. 수준별 조 상세 모달 (목표별 tgid 지원)
   * ------------------------------------------------------------ */
  function openLevelGroupDetailModal(gid, lgId, tgid){
    var g = T.getMockGroups().find(function(x){ return x.id === gid; });
    var levelGroups = tgid ? T.getGoalLevelGoals(gid, tgid) : T.getGroupLevelGoals(gid);
    var lg = levelGroups.find(function(x){ return x.id === lgId; });
    if(!lg && tgid){
      levelGroups = T.getGroupLevelGoals(gid);
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
            '<input class="task-title' + (t.done ? ' done-text' : '') + '" data-lgtasktitle="' + goal.id + ':' + m.id + ':' + t.id + '" value="' + T.esc(t.title) + '" style="font-size:.875rem;">' +
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
                '<input class="ms-title' + (m.status === 'done' ? ' done-text' : '') + '" data-lgmtitle="' + goal.id + ':' + m.id + '" value="' + T.esc(m.title) + '" style="width:100%;font-size:.9375rem;">' +
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
          '<input data-lggoaltitle="' + goal.id + '" value="' + T.esc(goal.title) + '" style="font-weight:700;font-size:1rem;background:transparent;border:none;border-bottom:1px solid var(--rule);padding:2px 4px;flex:1;" placeholder="목표명을 입력하세요">' +
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
          '<div class="faint" style="font-size:.8125rem;">' + (g ? g.icon + ' ' + T.esc(g.name) : '') + (tgid ? ' (목표별 맞춤 조)' : ' (팀 통합 기본 조)') + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="dday-pill" style="background:var(--sage-soft);color:var(--sage);font-weight:700;">달성률 ' + lgProg + '%</span>' +
    '</div>' +

    '<div class="field" style="margin:12px 0 10px;">' +
      '<label style="font-weight:700;font-size:.8125rem;">조/그룹 이름 (수정 가능)</label>' +
      '<div style="display:flex;gap:6px;">' +
        '<input id="modalLgNameInput" type="text" value="' + T.esc(lg.name) + '" placeholder="예: A조 (상급/대회반)" style="font-weight:700;">' +
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

    T.openModal(modalHtml, function(sheet){
      sheet.querySelector('#modalSaveLgNameBtn').addEventListener('click', async function(){
        var newN = sheet.querySelector('#modalLgNameInput').value.trim();
        if(newN){
          lg.name = newN;
          await T.saveProfile();
          T.toast('조 이름을 수정했어요');
          T.renderTeamGoalsScreen();
        }
      });

      sheet.querySelector('#modalAddLgGoalBtn').addEventListener('click', async function(){
        if(!lg.goals) lg.goals = [];
        lg.goals.push({
          id: T.uid('lgg'),
          title: '새 수준별 목표',
          dueDate: T.daysFromNow(30),
          milestones: [
            { id: T.uid('lgm'), title: '1단계 실천 과제', status: 'todo', priority: 'med', tasks: [] }
          ]
        });
        await T.saveProfile();
        T.toast('목표를 추가했어요');
        T.closeModal();
        openLevelGroupDetailModal(gid, lgId, tgid);
        T.renderTeamGoalsScreen();
      });

      sheet.querySelector('#modalDelLgBtn').addEventListener('click', async function(){
        if(!(await T.askConfirm('정말 "' + lg.name + '" 조와 속한 모든 목표/할일을 삭제할까요?'))) return;
        var p = T.getProfile();
        p.settings = p.settings || {};
        if(tgid){
          p.settings.goalLevelGoals = p.settings.goalLevelGoals || {};
          p.settings.goalLevelGoals[tgid] = levelGroups.filter(function(x){ return x.id !== lgId; });
        } else {
          p.settings.groupLevelGoals = p.settings.groupLevelGoals || {};
          p.settings.groupLevelGoals[gid] = levelGroups.filter(function(x){ return x.id !== lgId; });
        }
        await T.saveProfile();
        T.toast('조를 삭제했어요');
        T.closeModal();
        T.renderTeamGoalsScreen();
      });

      sheet.querySelector('#modalCloseLgBtn').addEventListener('click', T.closeModal);

      // Goal title & due edits
      sheet.querySelectorAll('[data-lggoaltitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var goalId = inp.dataset.lggoaltitle;
          var goal = (lg.goals || []).find(function(x){ return x.id === goalId; });
          if(goal){ goal.title = inp.value.trim() || goal.title; await T.saveProfile(); T.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lggoaldue]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var goalId = inp.dataset.lggoaldue;
          var goal = (lg.goals || []).find(function(x){ return x.id === goalId; });
          if(goal){ goal.dueDate = inp.value || null; await T.saveProfile(); T.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdelgoal]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var goalId = btn.dataset.lgdelgoal;
          lg.goals = (lg.goals || []).filter(function(x){ return x.id !== goalId; });
          await T.saveProfile();
          T.toast('목표를 삭제했어요');
          T.closeModal();
          openLevelGroupDetailModal(gid, lgId, tgid);
          T.renderTeamGoalsScreen();
        });
      });

      // Milestones
      sheet.querySelectorAll('[data-lgaddms]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var goalId = btn.dataset.lgaddms;
          var goal = (lg.goals || []).find(function(x){ return x.id === goalId; });
          if(goal){
            if(!goal.milestones) goal.milestones = [];
            goal.milestones.push({ id: T.uid('lgm'), title: '새 마일스톤', status: 'todo', priority: 'med', tasks: [] });
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
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
            T.triggerHaptic(10);
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
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
            T.triggerHaptic(10);
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgmtitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var parts = inp.dataset.lgmtitle.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){ m.title = inp.value.trim() || m.title; await T.saveProfile(); T.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdelms]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgdelms.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          if(goal){
            goal.milestones = (goal.milestones || []).filter(function(x){ return x.id !== parts[1]; });
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
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
            m.tasks.push({ id: T.uid('lgt'), title: '새 세부 할 일', done: false });
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
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
            T.triggerHaptic(10);
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgtasktitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var parts = inp.dataset.lgtasktitle.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          var t = m && (m.tasks || []).find(function(x){ return x.id === parts[2]; });
          if(t){ t.title = inp.value.trim() || t.title; await T.saveProfile(); T.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdeltask]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgdeltask.split(':');
          var goal = (lg.goals || []).find(function(x){ return x.id === parts[0]; });
          var m = goal && (goal.milestones || []).find(function(x){ return x.id === parts[1]; });
          if(m){
            m.tasks = (m.tasks || []).filter(function(x){ return x.id !== parts[2]; });
            await T.saveProfile();
            T.closeModal();
            openLevelGroupDetailModal(gid, lgId, tgid);
            T.renderTeamGoalsScreen();
          }
        });
      });
    });
  }

  K.openLevelGroupDetailModal = openLevelGroupDetailModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
