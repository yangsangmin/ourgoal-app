/**
 * OurGoal Goal Detail Events (목표 탭 — 선택한 목표의 상세 이벤트 배선)
 *
 * #TASK-ES-370 (목표 탭 세포 이전): index.html 인라인 renderGoalsScreen 의 상세 이벤트 배선 구간(이전 전 24771~25228줄)을 동작 그대로 옮겼다.
 * 프롬프트 백과사전·마감일·공개 범위·필터·보기 전환·접기·선택·내보내기·보관·마일스톤 행·할 일 체크·일정 지정·캘린더 동기화·마일스톤 추가 버튼을 잇는다.
 * renderGoalsScreen(js/tabs/goals/render.js)이 상세 마크업(goal-detail.js) 다음에 K.wireGoalDetailEvents(…) 로 부른다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 목표 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 목표 키트: 목표 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* renderGoalsScreen 의 상세 이벤트 배선 구간. goal·body 는 renderGoalsScreen 머리에서, 나머지 넷은 상세 마크업 구간(renderGoalDetailBody)이 돌려준 같은 값이다(재대입 없음). */
  function wireGoalDetailEvents(goal, body, allCollapsed, goalStatusHash, isDateStale, goalStatusStale){

    // wire events
L.wirePromptEncyclopediaEvents(body);
    var dueInput = document.getElementById('goalDueInput');
    if(dueInput) dueInput.addEventListener('change', async function(){ goal.dueDate = dueInput.value || null; await L.saveProfile(); K.renderGoalsScreen(); });

    var visInput = document.getElementById('goalVisInput');
    if(visInput) visInput.addEventListener('change', async function(){
      goal.visibility = visInput.value;
      await L.saveProfile();
      K.renderGoalsScreen();
      L.toast(L.VISIBILITY_LABELS[goal.visibility]+'(으)로 바꿨어요');
    });

    var privBadge = document.getElementById('goalsPrivacyBadge');
    if(privBadge){
      privBadge.addEventListener('click', async function(){
        var cur = goal.visibility || 'private';
        var next = 'private';
        var nextLbl = '나만 보기';
        if(cur === 'private'){
          next = 'theme';
          nextLbl = '같은 테마 공개';
        } else if(cur === 'theme'){
          next = 'team';
          nextLbl = '팀원 공개';
        } else if(cur === 'team' || cur === 'followers'){
          next = 'public';
          nextLbl = '전체 공개';
        } else {
          next = 'private';
          nextLbl = '나만 보기';
        }
        goal.visibility = next;
        await L.saveProfile();
        L.toast('목표 공개 범위: ' + nextLbl + '로 변경되었습니다', 1000);
        K.renderGoalsScreen();
      });
    }

    var filterToggle = document.getElementById('msFilterToggle');
    if(filterToggle){
      filterToggle.querySelectorAll('[data-msfilter]').forEach(function(opt){
        opt.addEventListener('click', function(){
          L.state.msFilter = opt.dataset.msfilter;
          K.renderGoalsScreen();
        });
      });
    }

    var msViewToggle = document.getElementById('msViewToggle');
    if(msViewToggle){
      msViewToggle.querySelectorAll('[data-msview]').forEach(function(opt){
        opt.addEventListener('click', function(){
          L.state.goalViewMode = opt.dataset.msview;
          K.renderGoalsScreen();
        });
      });
    }
    var collapseAllBtn = document.getElementById('msCollapseAllBtn');
    if(collapseAllBtn){
      collapseAllBtn.addEventListener('click', function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        if(allCollapsed){
          L.state.collapsedMilestones = {};
        } else {
          goal.milestones.forEach(function(m){ L.state.collapsedMilestones[m.id] = true; });
        }
        K.renderGoalsScreen();
      });
    }

    /* [#TASK-ES-239] 완료된 할 일 접기/펼치기 토글 배선 */
    body.querySelectorAll('[data-toggledonetasks]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!L.state.expandedDoneTasks) L.state.expandedDoneTasks = {};
        var mid = btn.dataset.toggledonetasks;
        L.state.expandedDoneTasks[mid] = !L.state.expandedDoneTasks[mid];
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(10);
        K.renderGoalsScreen();
      });
    });

    var densityToggleBtn = document.getElementById('msDensityToggleBtn');
    if(densityToggleBtn){
      densityToggleBtn.addEventListener('click', function(){
        L.state.msDensity = (L.state.msDensity === 'detailed') ? 'compact' : 'detailed';
        K.renderGoalsScreen();
      });
    }

    var statusToggleBtn = document.getElementById('goalStatusToggleBtn');
    if(statusToggleBtn){
      statusToggleBtn.addEventListener('click', function(){
        L.state.goalStatusExpanded = !L.state.goalStatusExpanded;
        K.renderGoalsScreen();
      });
    }

    /* 전체 목표 마일스톤 카드 클릭 시 목표 전환 (#TASK-ES-147) */
    body.querySelectorAll('[data-selectgoal]').forEach(function(el){
      el.addEventListener('click', function(){
        var targetGid = el.dataset.selectgoal;
        if(targetGid && targetGid !== L.state.activeGoalId){
          L.state.activeGoalId = targetGid;
          K.renderGoalsScreen();
        }
      });
    });

    /* 선택 삭제 / 전체 삭제 (마일스톤·할 일) */
    body.querySelectorAll('[data-selms]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var id = el.dataset.selms;
        if(L.state.msSel[id]) delete L.state.msSel[id]; else L.state.msSel[id] = true;
        K.renderGoalsScreen();
      });
    });
    body.querySelectorAll('[data-seltask]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var id = el.dataset.seltask;
        if(L.state.taskSel[id]) delete L.state.taskSel[id]; else L.state.taskSel[id] = true;
        K.renderGoalsScreen();
      });
    });
    var selAllBtn = document.getElementById('selAllBtn');
    if(selAllBtn) selAllBtn.addEventListener('click', function(){
      if(Object.keys(L.state.msSel).length || Object.keys(L.state.taskSel).length){
        L.state.msSel = {}; L.state.taskSel = {};
      } else {
        goal.milestones.forEach(function(m){
          L.state.msSel[m.id] = true;
          (m.tasks||[]).forEach(function(t){ L.state.taskSel[t.id] = true; });
        });
      }
      K.renderGoalsScreen();
    });
    var selDeleteBtn = document.getElementById('selDeleteBtn');
    if(selDeleteBtn) selDeleteBtn.addEventListener('click', async function(){
      var nMs = Object.keys(L.state.msSel).length, nTask = Object.keys(L.state.taskSel).length;
      if(!confirm('선택한 마일스톤 '+nMs+'개, 할 일 '+nTask+'개를 삭제할까요?')) return;
      goal.milestones = goal.milestones.filter(function(m){ return !L.state.msSel[m.id]; });
      goal.milestones.forEach(function(m){
        m.tasks = (m.tasks||[]).filter(function(t){ return !L.state.taskSel[t.id]; });
      });
      L.state.msSel = {}; L.state.taskSel = {};
      await L.saveProfile();
      K.renderGoalsScreen();
      L.toast('선택한 항목을 삭제했어요');
    });
    var selDeleteAllBtn = document.getElementById('selDeleteAllBtn');
    if(selDeleteAllBtn) selDeleteAllBtn.addEventListener('click', async function(){
      if(!goal.milestones.length){ L.toast('삭제할 마일스톤이 없어요'); return; }
      if(!confirm('이 목표의 마일스톤과 할 일을 전부 삭제할까요? 목표 자체는 남아요.')) return;
      goal.milestones = [];
      L.state.msSel = {}; L.state.taskSel = {};
      await L.saveProfile();
      K.renderGoalsScreen();
      L.toast('마일스톤을 전부 비웠어요');
    });

    var goalResultBtn = document.getElementById('goalResultBtn');
    if(goalResultBtn) goalResultBtn.addEventListener('click', function(){
      L.openResultModal('goal', goal, function(){ L.renderAll(); });
    });

    if(!L.state.goalEditMode && (goalStatusStale || isDateStale) && goal.milestones.length) L.refreshGoalStatusSummary(goal, goalStatusHash);

    var expBtn = document.getElementById('goalExportBtn');
    if(expBtn) expBtn.addEventListener('click', function(){ L.exportGoalSnapshot('one', goal); });
    var expAllBtn = document.getElementById('goalExportAllBtn');
    if(expAllBtn) expAllBtn.addEventListener('click', function(){ L.exportGoalSnapshot('all'); });

    var archiveBtn = document.getElementById('goalArchiveBtn');
    if(archiveBtn) archiveBtn.addEventListener('click', async function(){
      if(!goal.result){
        if(confirm('최종 결과를 먼저 입력할까요? (취소를 누르면 결과 없이 보관해요)')){
          L.openResultModal('goal', goal, function(){ L.archiveGoal(goal); });
          return;
        }
      }
      L.archiveGoal(goal);
    });

    body.querySelectorAll('.ms-row').forEach(function(row){
      var msid = row.dataset.msid;
      var ms = goal.milestones.find(function(x){ return x.id===msid; });
      if(!ms) return;

      var toggleBtn = row.querySelector('[data-mstoggle]');
      if(toggleBtn){
        toggleBtn.addEventListener('click', function(e){
          e.stopPropagation();
          L.state.collapsedMilestones[msid] = !L.state.collapsedMilestones[msid];
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          K.renderGoalsScreen();
        });
      }

      var gridRow = row.querySelector('.ms-grid-row');
      if(gridRow && !L.state.goalEditMode && (ms.tasks && ms.tasks.length > 0)){
        gridRow.classList.add('ms-header-clickable');
        gridRow.addEventListener('click', function(e){
          if(e.target.closest('[data-cyclestatus], [data-cyclepriority], [data-addattms], [data-msresult], [data-calsyncms], .att-add-btn, .sel-check, a, button')) return;
          L.state.collapsedMilestones[msid] = !L.state.collapsedMilestones[msid];
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          K.renderGoalsScreen();
        });
      }

      var addAttMsBtn = row.querySelector('[data-addattms]');
      if(addAttMsBtn){
        addAttMsBtn.addEventListener('click', function(e){
          e.stopPropagation();
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.openAddAttachmentModal(ms, async function(){
            await L.saveProfile();
            K.renderGoalsScreen();
          });
        });
      }

      if(L.state.goalEditMode){
        row.addEventListener('dragstart', function(e){
          row.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', msid);
        });
        row.addEventListener('dragend', function(){
          row.classList.remove('dragging');
          body.querySelectorAll('.ms-row').forEach(function(r){ r.classList.remove('drop-target'); });
        });
        row.addEventListener('dragover', function(e){
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          row.classList.add('drop-target');
        });
        row.addEventListener('dragleave', function(){ row.classList.remove('drop-target'); });
        row.addEventListener('drop', async function(e){
          e.preventDefault();
          row.classList.remove('drop-target');
          var draggedId = e.dataTransfer.getData('text/plain');
          if(!draggedId || draggedId===msid) return;
          var draggedMs = goal.milestones.find(function(x){ return x.id===draggedId; });
          var fromIdx = goal.milestones.indexOf(draggedMs);
          var toIdx = goal.milestones.indexOf(ms);
          if(fromIdx<0 || toIdx<0) return;
          goal.milestones.splice(fromIdx,1);
          goal.milestones.splice(toIdx,0,draggedMs);
          await L.saveProfile();
          K.renderGoalsScreen();
        });
      }

      var statusEl = row.querySelector('[data-cyclestatus]');
      statusEl.addEventListener('click', async function(){
        var order = ['todo','doing','done'];
        var wasDone = ms.status==='done';
        ms.status = order[(order.indexOf(ms.status)+1)%3];
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        var cycleXpRes = (!wasDone && ms.status==='done') ? L.awardXP(L.XP_RULES.milestoneDone, '마일스톤 완료') : null;
        await L.saveProfile();
        K.renderGoalsScreen();
        L.renderLevelBadge();
        if(cycleXpRes && cycleXpRes.leveledUp) L.showLevelUpBanner(L.levelForXP(cycleXpRes.total));
        if(!wasDone && ms.status==='done'){
          L.celebrateMilestoneDone(goal, ms);
          if(goal.teamLinkId){
            L.awardXP(10, '팀 연계 마일스톤 완수 (+10 EXP)');
            L.toast('🎯 [' + (goal.teamLinkName || '팀') + '] 연계 마일스톤 완수! 팀 기여도와 개인 경험치 동시 획득! (+10 EXP) ✨');
          }
        }
      });

      var titleInput = row.querySelector('[data-msinput]');
      titleInput.addEventListener('change', async function(){ ms.title = titleInput.value.trim() || ms.title; await L.saveProfile(); });

      var dateInput = row.querySelector('[data-msdate]');
      if(dateInput) dateInput.addEventListener('change', async function(){ ms.dueDate = dateInput.value || null; await L.saveProfile(); K.renderGoalsScreen(); });

      var prioTag = row.querySelector('[data-cyclepriority]');
      if(prioTag){
        prioTag.addEventListener('click', async function(e){
          e.stopPropagation();
          var pOrder = ['med', 'high', 'low'];
          var cur = ms.priority || 'med';
          ms.priority = pOrder[(pOrder.indexOf(cur)+1)%3];
          L.triggerHaptic(10);
          await L.saveProfile();
          K.renderGoalsScreen();
        });
      }

      var upBtn = row.querySelector('[data-msup]');
      if(upBtn) upBtn.addEventListener('click', async function(){
        var i = goal.milestones.indexOf(ms);
        if(i>0){ L.reorderMilestones(goal, i, i-1); L.triggerHaptic(10); await L.saveProfile(); K.renderGoalsScreen(); }
      });
      var downBtn = row.querySelector('[data-msdown]');
      if(downBtn) downBtn.addEventListener('click', async function(){
        var i = goal.milestones.indexOf(ms);
        if(i<goal.milestones.length-1){ L.reorderMilestones(goal, i, i+1); L.triggerHaptic(10); await L.saveProfile(); K.renderGoalsScreen(); }
      });
      var delBtn = row.querySelector('[data-msdel]');
      if(delBtn) delBtn.addEventListener('click', async function(){
        if(!confirm('이 마일스톤을 삭제할까요?')) return;
        goal.milestones = goal.milestones.filter(function(x){ return x.id!==msid; });
        await L.saveProfile(); K.renderGoalsScreen();
      });

      var msResultBtn = row.querySelector('[data-msresult]');
      if(msResultBtn) msResultBtn.addEventListener('click', function(){
        L.openResultModal('ms', ms, function(){ K.renderGoalsScreen(); }, goal);
      });

      var msCalBtn = row.querySelector('[data-calsyncms]');
      if(msCalBtn) msCalBtn.addEventListener('click', function(e){
        e.stopPropagation();
        L.quickSyncToCalendar('ms', goal.id, msid);
      });

      row.querySelectorAll('.task-row').forEach(function(trow){
        var tid = trow.dataset.taskid;
        var task = (ms.tasks||[]).find(function(t){ return t.id===tid; });
        if(!task) return;

        var addAttTaskBtn = trow.querySelector('[data-addatttask]');
        if(addAttTaskBtn){
          addAttTaskBtn.addEventListener('click', function(e){
            e.stopPropagation();
            if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
            L.openAddAttachmentModal(task, async function(){
              await L.saveProfile();
              K.renderGoalsScreen();
            });
          });
        }

        var tCalSyncBtn = trow.querySelector('[data-calsynctask]');
        if(tCalSyncBtn){
          tCalSyncBtn.addEventListener('click', function(e){
            e.stopPropagation();
            L.quickSyncToCalendar('task', goal.id, msid, tid);
          });
        }

        var tResultBtn = trow.querySelector('[data-taskresult]');
        if(tResultBtn) tResultBtn.addEventListener('click', function(){
          L.openResultModal('task', task, function(){ K.renderGoalsScreen(); }, goal);
        });
        var tinput = trow.querySelector('[data-taskinput]');
        tinput.addEventListener('change', async function(){ task.title = tinput.value.trim() || task.title; await L.saveProfile(); });
        var tdate = trow.querySelector('[data-taskdate]');
        if(tdate) tdate.addEventListener('change', async function(){
          task.dueDate = tdate.value || null;
          await L.saveProfile(); K.renderGoalsScreen();
        });
        var tdel = trow.querySelector('[data-deltask]');
        if(tdel) tdel.addEventListener('click', async function(){
          ms.tasks = ms.tasks.filter(function(t){ return t.id!==tid; });
          await L.saveProfile(); K.renderGoalsScreen();
        });
      });

      var addTask = row.querySelector('[data-addtask]');
      if(addTask) addTask.addEventListener('click', async function(){
        ms.tasks = ms.tasks || [];
        ms.tasks.push({ id: L.uid('task'), title:'새 할 일', done:false });
        await L.saveProfile(); K.renderGoalsScreen();
      });
    });

    L.wireAttachmentChipClicks(body);

    /* [#TASK-ES-151 & #TASK-ES-253] 개인 목표 태스크 완료 토글 및 캘린더 일정 양방향 동기화 */
    body.querySelectorAll('[data-taskcheck]').forEach(function(chk){
      chk.addEventListener('click', async function(ev){
        ev.stopPropagation();
        var rowEl = chk.closest('.task-row');
        if(!rowEl) return;
        var tid = rowEl.dataset.taskid;
        var mid = rowEl.dataset.msid;
        var targetTask = null;
        var targetMilestone = null;
        var targetGoal = goal;
        (goal.milestones || []).forEach(function(m){
          if(!mid || m.id === mid){
            (m.tasks || []).forEach(function(t){
              if(t.id === tid){
                targetTask = t;
                targetMilestone = m;
              }
            });
          }
        });
        if(!targetTask) return;
        targetTask.done = !targetTask.done;
        var isNowDone = targetTask.done;

        // 마일스톤 상태 자동 전진/후퇴
        if(targetMilestone && targetMilestone.tasks && targetMilestone.tasks.length){
          var allTasksDone = targetMilestone.tasks.every(function(tk){ return !!tk.done; });
          targetMilestone.status = allTasksDone ? 'done' : (targetMilestone.status === 'done' ? 'todo' : targetMilestone.status);
        }

        if(isNowDone){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.triggerHaptic(15);
          L.awardXP(10, '할 일 및 연계 일정 완료');
          L.toast('할 일 및 연계 일정을 완료했어요! 🎯 (+10 EXP)');
        } else {
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.triggerHaptic(10);
          L.toast('할 일을 미완료로 변경했어요');
        }
        (L.state.profile.settings.customSchedules || []).forEach(function(cs){
          if(cs.linkedTaskId === targetTask.id || cs.linkedId === targetTask.id || (cs.linkedGoalId === targetGoal.id && cs.title === targetTask.title)){
            cs.done = isNowDone;
          }
        });
        L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
        await L.saveProfile();
        K.renderGoalsScreen();
        L.renderCalendarScreen();
        if(typeof L.renderHome === 'function') L.renderHome();
        if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
        if(typeof renderStatsScreen === 'function') renderStatsScreen();
      });
    });

    body.querySelectorAll('[data-setschedule]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var level = btn.getAttribute('data-schedlevel');
        var gid = btn.getAttribute('data-schedgid');
        var msId = btn.getAttribute('data-schedmsid') || null;
        var tid = btn.getAttribute('data-schedtid') || null;
        L.openScheduleSetupModal(level, gid, msId, tid);
      });
    });

    body.querySelectorAll('[data-calsyncgoal]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var gid = btn.getAttribute('data-calsyncgoal') || goal.id;
        L.quickSyncToCalendar('goal', gid);
      });
    });

    var addMsBtn = document.getElementById('addMsBtn');
    if(addMsBtn) addMsBtn.addEventListener('click', async function(){
      goal.milestones.push({ id: L.uid('ms'), title:'새 마일스톤', status:'todo', dueDate:null, tasks:[] });
      await L.saveProfile(); K.renderGoalsScreen();
    });
    if(window.OurgoalGoalEditUX) OurgoalGoalEditUX.wirePersonalGoalEdit({ state:L.state, goal:goal, body:body, saveProfile:L.saveProfile, toast:L.toast, renderGoalsScreen:K.renderGoalsScreen, renderAll:L.renderAll });
  }

  K.wireGoalDetailEvents = wireGoalDetailEvents;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
