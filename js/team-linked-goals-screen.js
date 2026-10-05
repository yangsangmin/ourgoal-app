/**
 * OurGoal Team Cell: '팀 연계 개인목표' 워크스페이스 화면 — renderTeamLinkedGoalsScreen (#TASK-ES-402 · 팀 세포 쪼개기 3차)
 *
 * js/team-linked-goals.js(982줄)에서 동작 그대로 옮겼다(이전 전 260~661줄).
 *   renderTeamLinkedGoalsScreen
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamLinkedGoals.renderTeamLinkedGoalsScreen 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-linked-goals.js 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태를 getter(대입하는 상태는 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 목표 세포 키트의 linkedGoals 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var KIT = global.OurgoalTeamGoalsKit = global.OurgoalTeamGoalsKit || {};
  var K = KIT.linkedGoals = KIT.linkedGoals || {};
  var T = K.scope = K.scope || {};

  /* ------------------------------------------------------------
   * 3. '팀 연계 개인목표' 워크스페이스 화면 렌더링
   * ------------------------------------------------------------ */
  function renderTeamLinkedGoalsScreen(containerEl){
    var view = containerEl || document.getElementById('teamLinkedGoalsView');
    if(!view) return;

    var state = T.getState();
    var p = T.getProfile();
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
        '<div class="card" style="text-align:center;padding:30px 20px;background:var(--surface-2);border:1px dashed var(--rule);border-radius:16px;margin-top:12px;">' +
          '<div style="font-size:3rem;margin-bottom:10px;">🤝</div>' +
          '<h3 style="margin:0 0 8px;font-size:1.15rem;color:var(--ink);">아직 참여 중인 팀 연계 개인목표가 없어요</h3>' +
          '<p class="faint" style="font-size:.875rem;max-width:420px;margin:0 auto 16px;line-height:1.6;">' +
            '팀 크루들이 함께 만든 팀 목표에서 <b>[팀 연계 개인목표로 복사하며 참가]</b>를 누르면<br>' +
            '목표·마일스톤·세부할일 세트가 내 화면으로 복사되어 개별적으로 작성·체크하고,<br>' +
            '팀 목표 대시보드에서 다른 팀원들과 서로의 달성 정도를 상호 체크(찌르기/댓글/DM)할 수 있어요!' +
          '</p>' +
          '<button class="btn btn-primary" id="btnGoToTeamGoalsExplore" type="button" style="padding:10px 22px;font-weight:700;font-size:.9375rem;background:linear-gradient(135deg, var(--brand), #ec4899);border:none;border-radius:10px;box-shadow:0 3px 10px rgba(225,29,72,0.25);cursor:pointer;margin-bottom:24px;">' +
            '🎯 팀 목표 둘러보고 참가하기' +
          '</button>' +
          '<!-- 실제 우수 사용사례 예시 프리뷰 카드 (#TASK-ES-174) -->' +
          '<div id="tlSampleShowcaseCard" style="text-align:left;background:var(--card);border:1.5px solid rgba(99,102,241,0.3);border-radius:14px;padding:16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid var(--rule);padding-bottom:10px;">' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<span style="font-size:1.1rem;">💡</span>' +
                '<span style="font-size:.875rem;font-weight:800;color:var(--primary);">실제 우수 사용사례 예시 (참가 후 내 화면)</span>' +
              '</div>' +
              '<span class="badge" style="font-size:.7rem;padding:2px 8px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary);font-weight:700;">실제 동작 화면 예시</span>' +
            '</div>' +
            '<div style="background:var(--card2);border-radius:10px;padding:10px 12px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">' +
              '<div>' +
                '<div style="font-size:.75rem;color:var(--ink-soft);font-weight:600;">연계 팀: 🏃‍♂️ 모닝 러닝 크루</div>' +
                '<div style="font-size:.9375rem;font-weight:800;color:var(--ink);margin-top:2px;">가을 10km 완주 & 페이스 단축 프로젝트</div>' +
              '</div>' +
              '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);font-weight:700;">D-28</span>' +
            '</div>' +
            '<div style="margin-bottom:10px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                '<span style="font-size:.78125rem;font-weight:700;color:var(--ink);">내 개인 달성률 75%</span>' +
                '<span class="faint" style="font-size:.75rem;">마일스톤 3/4 완료</span>' +
              '</div>' +
              '<div class="group-bar" style="height:6px;margin:0;"><span style="width:75%;background:var(--primary);"></span></div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">' +
              '<div style="font-size:.8125rem;padding:6px 10px;background:var(--surface-2);border-radius:8px;display:flex;align-items:center;gap:8px;">' +
                '<span style="color:#10b981;font-weight:800;">✓</span>' +
                '<span style="text-decoration:line-through;color:var(--ink-faint);">1단계: 주 3회 3km 지속주 러닝 완주</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;padding:6px 10px;background:var(--surface-2);border-radius:8px;display:flex;align-items:center;gap:8px;">' +
                '<span style="color:#10b981;font-weight:800;">✓</span>' +
                '<span style="text-decoration:line-through;color:var(--ink-faint);">2단계: 5km 러닝 6분 30초 페이스 유지</span>' +
              '</div>' +
              '<div style="font-size:.8125rem;padding:6px 10px;background:var(--card);border:1px solid var(--primary);border-radius:8px;display:flex;align-items:center;gap:8px;">' +
                '<span style="color:var(--primary);font-weight:800;">●</span>' +
                '<span style="color:var(--ink);font-weight:700;">3단계: 주말 8km 빌드업 지속주 러닝 (오늘 실천 중)</span>' +
              '</div>' +
            '</div>' +
            '<div style="padding:8px 10px;background:var(--card2);border-radius:8px;font-size:.75rem;color:var(--ink-soft);display:flex;align-items:center;justify-content:space-between;">' +
              '<span>👥 <b>팀원 실시간 상호 체크</b>: 김민우(75%) · 이서연(50%) · 박진혁(25%)</span>' +
              '<span style="color:var(--primary);font-weight:700;">⚡ 찌르기 · 💬 대화</span>' +
            '</div>' +
            '<div style="margin-top:8px;font-size:.72rem;color:var(--ink-faint);text-align:right;">' +
              '* 팀 연계 개인목표를 생성하면 이 예시 카드는 자동으로 사라집니다.' +
            '</div>' +
          '</div>' +
        '</div>';

      var btnExplore = view.querySelector('#btnGoToTeamGoalsExplore');
      if(btnExplore){
        btnExplore.addEventListener('click', function(){
          state.goalsSubTab = 'team';
          T.renderGoalsScreen();
        });
      }
      return;
    }

    var goal = linkedGoals.find(function(g){ return g.id === state.activeTeamLinkedGoalId; }) || linkedGoals[0];
    var pct = T.getGoalAchievement(goal);
    var doneMCount = (goal.milestones || []).filter(function(m){ return m.status === 'done'; }).length;
    var totalMCount = (goal.milestones || []).length;
    var allTasks = (goal.milestones || []).reduce(function(acc, m){ return acc.concat(m.tasks || []); }, []);
    var doneTCount = allTasks.filter(function(t){ return t.done; }).length;
    var totalTCount = allTasks.length;

    var chipRowHtml = '<div class="goal-chip-row" id="tlGoalChipRow" style="margin-bottom:12px;">' +
      linkedGoals.map(function(g){
        var isAct = (g.id === goal.id);
        var gPct = T.getGoalAchievement(g);
        return '<button class="goal-chip' + (isAct ? ' active' : '') + '" data-tlchip="' + g.id + '" type="button">' +
          (g.groupIcon || '🎯') + ' ' + T.esc(g.title) + ' (' + gPct + '%)' +
        '</button>';
      }).join('') +
      '<button class="goal-chip addchip" id="btnExploreMoreTeamGoals" type="button" title="다른 팀 목표 복사하러 가기">+</button>' +
    '</div>';

    var originBannerHtml =
      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.3rem;">🏢</span>' +
          '<div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);font-weight:600;">연계된 팀 및 원본 팀 목표</div>' +
            '<div style="font-size:.9375rem;font-weight:700;color:var(--ink);">' +
              (goal.groupIcon || '🎯') + ' ' + T.esc(goal.groupName || '팀') + ' &gt; ' + T.esc(goal.originTitle || goal.title) +
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
            ? '<input class="task-title' + (t.done ? ' done-text' : '') + '" data-tltasktitle="' + ms.id + ':' + t.id + '" value="' + T.esc(t.title) + '" style="flex:1;font-size:.875rem;">'
            : '<span class="task-title' + (t.done ? ' done-text' : '') + '" data-tltoggletask="' + ms.id + ':' + t.id + '" style="flex:1;font-size:.875rem;cursor:pointer;">' + T.esc(t.title) + '</span>') +
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
              ? '<input class="' + (isDone ? 'ms-title done-text' : 'ms-title') + '" data-tlmstitle="' + ms.id + '" value="' + T.esc(ms.title) + '" style="font-weight:700;font-size:.9375rem;border-bottom:1.5px solid var(--brand);background:var(--surface-2);width:100%;">'
              : '<span class="' + (isDone ? 'ms-title done-text' : 'ms-title') + '" style="font-weight:700;font-size:.9375rem;">' + T.esc(ms.title) + '</span>') +
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
            (editMode ? '✓ 편집 완료' : '편집') +
          '</button>' +
        '</div>' +
      '</div>' +
      chipRowHtml +
      originBannerHtml +
      '<div class="card" style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px;">' +
          (editMode
            ? '<input id="tlGoalTitleInput" value="' + T.esc(goal.title) + '" style="font-weight:700;font-size:1.1rem;flex:1;border-bottom:1.5px solid var(--brand);background:var(--surface-2);">'
            : '<h3 style="margin:0;font-size:1.1rem;color:var(--ink);">' + T.esc(goal.title) + '</h3>') +
          (goal.dueDate ? '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);">' + T.getDDay(goal.dueDate) + '</span>' : '') +
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
      (msListHtml || '<p class="faint" style="padding:20px 0;text-align:center;">마일스톤이 없습니다.</p>') +
      (editMode ? '<button class="goal-edit-done-inline-btn" id="btnTlDoneInline" type="button">✓ 연계 목표 편집 완료 (저장)</button>' : '');

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
        T.renderGoalsScreen();
      });
    }

    var btnOrigin = view.querySelector('#btnGoToTeamOrigin');
    if(btnOrigin){
      btnOrigin.addEventListener('click', function(){
        state.goalsSubTab = 'team';
        T.renderGoalsScreen();
      });
    }

    async function commitAndFinishTlEdit(){
      if(document.activeElement && typeof document.activeElement.blur === 'function'){
        document.activeElement.blur();
      }
      var titleInp = view.querySelector('#tlGoalTitleInput');
      if(titleInp && titleInp.value.trim()){
        goal.title = titleInp.value.trim();
      }
      view.querySelectorAll('[data-tlminput]').forEach(function(inp){
        var mid = inp.dataset.tlminput;
        var m = (goal.milestones||[]).find(function(x){ return x.id===mid; });
        if(m){ var v = inp.value.trim(); if(v) m.title = v; }
      });
      state.teamLinkedEditMode = false;
      await T.saveProfile();
      T.toast('팀 연계 개인목표 편집을 완료했어요');
      renderTeamLinkedGoalsScreen(view);
    }

    var btnToggleEdit = view.querySelector('#btnToggleTlEdit');
    if(btnToggleEdit){
      btnToggleEdit.addEventListener('click', async function(){
        if(state.teamLinkedEditMode){
          await commitAndFinishTlEdit();
        } else {
          state.teamLinkedEditMode = true;
          renderTeamLinkedGoalsScreen(view);
        }
      });
    }

    var btnTlDone = view.querySelector('#btnTlDoneInline');
    if(btnTlDone){
      btnTlDone.addEventListener('click', async function(e){
        e.preventDefault();
        await commitAndFinishTlEdit();
      });
    }

    var btnDelGoal = view.querySelector('#btnDeleteTlGoal');
    if(btnDelGoal){
      btnDelGoal.addEventListener('click', async function(){
        if(!(await T.askConfirm('정말 "' + goal.title + '" 팀 연계 개인목표를 삭제할까요?'))) return;
        p.goals = (p.goals || []).filter(function(g){ return g.id !== goal.id; });
        state.activeTeamLinkedGoalId = null;
        state.teamLinkedEditMode = false;
        T.syncTeamGoalParticipantProgress(goal);
        await T.saveProfile();
        T.toast('팀 연계 개인목표를 삭제했어요');
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
        T.syncTeamGoalParticipantProgress(goal);
        await T.saveProfile();
        T.triggerHaptic(15);
        renderTeamLinkedGoalsScreen(view);
        T.toast(ms.status === 'done' ? '🎉 마일스톤을 달성했어요! 팀 목표에 실시간 반영되었습니다.' : '마일스톤을 진행 중으로 변경했어요.');
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
        T.syncTeamGoalParticipantProgress(goal);
        await T.saveProfile();
        T.triggerHaptic(12);
        renderTeamLinkedGoalsScreen(view);
        T.toast(t.done ? '✓ 할 일을 완료했어요! 팀 목표에 실시간 반영되었습니다.' : '할 일 완료를 취소했어요.');
      });
    });

    view.querySelectorAll('[data-tlmstitle]').forEach(function(inp){
      inp.addEventListener('change', async function(){
        var msId = inp.dataset.tlmstitle;
        var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
        if(ms){
          ms.title = inp.value.trim() || ms.title;
          await T.saveProfile();
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
            await T.saveProfile();
          }
        }
      });
    });

    view.querySelectorAll('[data-tlmsdel]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var msId = btn.dataset.tlmsdel;
        if(!(await T.askConfirm('이 마일스톤을 삭제할까요?'))) return;
        goal.milestones = (goal.milestones || []).filter(function(m){ return m.id !== msId; });
        T.syncTeamGoalParticipantProgress(goal);
        await T.saveProfile();
        renderTeamLinkedGoalsScreen(view);
      });
    });

    view.querySelectorAll('[data-tldeltask]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var parts = btn.dataset.tldeltask.split(':');
        var ms = (goal.milestones || []).find(function(m){ return m.id === parts[0]; });
        if(ms){
          ms.tasks = (ms.tasks || []).filter(function(item){ return item.id !== parts[1]; });
          T.syncTeamGoalParticipantProgress(goal);
          await T.saveProfile();
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
        T.syncTeamGoalParticipantProgress(goal);
        await T.saveProfile();
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
        T.syncTeamGoalParticipantProgress(goal);
        await T.saveProfile();
        renderTeamLinkedGoalsScreen(view);
      });
    }
  }

  K.renderTeamLinkedGoalsScreen = renderTeamLinkedGoalsScreen;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
