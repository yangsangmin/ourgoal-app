/**
 * OurGoal Schedule Done Toggle (일정 탭 — 일정 완료 체크·목표 양방향 동기화)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   toggleScheduleDone — 「[#TASK-ES-151 & #TASK-ES-253] 일정 체크 완료 토글」(이전 전 9657~9854줄, 구획 주석 포함)
 * 일정 체크 완료를 켜고 끄며 연결된 목표 진행과 양방향으로 맞춘다.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  /* ============ [#TASK-ES-151 & #TASK-ES-253] 일정 체크 완료 토글 및 목표 양방향 동기화 ============ */
  async function toggleScheduleDone(schedId, kind, goalId, msId, taskId){
    var isNowDone = false;
    var wasLinked = false;
    if(kind === 'custom' && schedId){
      var csList = L.state.profile.settings.customSchedules || [];
      var sched = csList.find(function(c){
        return String(c.id) === String(schedId) || String(c.linkedId) === String(schedId) || c.id === ('sched_' + schedId);
      });
      if(!sched) return;
      sched.done = !sched.done;
      isNowDone = sched.done;

      // 연계된 목표/마일스톤/세부할일 식별
      var effGoalId = sched.linkedGoalId || goalId || (sched.linkedLevel === 'goal' ? sched.linkedId : null);
      var effMsId = sched.linkedMsId || msId || (sched.linkedLevel === 'ms' ? sched.linkedId : null);
      var effTaskId = sched.linkedTaskId || taskId || (sched.linkedLevel === 'task' ? sched.linkedId : null);

      if(!effGoalId && (effTaskId || effMsId)){
        (L.state.profile.goals || []).forEach(function(g){
          (g.milestones || []).forEach(function(m){
            if(effMsId && String(m.id) === String(effMsId)) effGoalId = g.id;
            (m.tasks || []).forEach(function(t){
              if(effTaskId && String(t.id) === String(effTaskId)){
                effGoalId = g.id;
                if(!effMsId) effMsId = m.id;
              }
            });
          });
        });
      }

      if(!effTaskId && !effMsId && effGoalId){
        (L.state.profile.goals || []).forEach(function(g){
          if(String(g.id) !== String(effGoalId)) return;
          (g.milestones || []).forEach(function(m){
            if(m.title === sched.title) effMsId = m.id;
            (m.tasks || []).forEach(function(t){
              if(t.title === sched.title){
                effTaskId = t.id;
                effMsId = m.id;
              }
            });
          });
        });
      }

      // 목표/마일스톤/할 일과 양방향 연동 동기화
      if(sched.linkedTaskId || sched.linkedGoalId || effTaskId || effMsId || effGoalId){
        wasLinked = true;
        (L.state.profile.goals || []).forEach(function(g){
          if(effGoalId && String(g.id) !== String(effGoalId)) return;
          (g.milestones || []).forEach(function(m){
            if(effMsId && String(m.id) !== String(effMsId)) return;
            (m.tasks || []).forEach(function(t){
              if((effTaskId && String(t.id) === String(effTaskId)) || (!effTaskId && !effMsId && t.title === sched.title)){
                t.done = isNowDone;
              }
            });
            if(m.tasks && m.tasks.length){
              var allTasksDone = m.tasks.every(function(tk){ return !!tk.done; });
              m.status = allTasksDone ? 'done' : (m.status === 'done' ? 'todo' : m.status);
            } else if((effMsId && String(m.id) === String(effMsId)) || (!effTaskId && m.title === sched.title)){
              m.status = isNowDone ? 'done' : 'todo';
            }
          });
        });

        // 동일 목표/할일에 연계된 다른 customSchedules 항목 동기화
        (L.state.profile.settings.customSchedules || []).forEach(function(otherCs){
          if(String(otherCs.id) === String(sched.id)) return;
          if(effTaskId && (String(otherCs.linkedTaskId) === String(effTaskId) || String(otherCs.linkedId) === String(effTaskId))){
            otherCs.done = isNowDone;
          } else if(effMsId && (String(otherCs.linkedMsId) === String(effMsId) || String(otherCs.linkedId) === String(effMsId))){
            otherCs.done = isNowDone;
          }
        });
      }
    } else if(kind === 'task' && (goalId || schedId) && (taskId || msId)){
      var effGoalId = goalId;
      var effTaskId = taskId || schedId;
      var effMsId = msId;
      var g = (L.state.profile.goals || []).find(function(x){ return String(x.id) === String(effGoalId); });
      if(g && g.milestones){
        g.milestones.forEach(function(m){
          if(effMsId && String(m.id) !== String(effMsId)) return;
          (m.tasks || []).forEach(function(t){
            if(String(t.id) === String(effTaskId)){
              t.done = !t.done;
              isNowDone = t.done;
              wasLinked = true;
              (L.state.profile.settings.customSchedules || []).forEach(function(cs){
                if(String(cs.linkedTaskId) === String(effTaskId) || String(cs.linkedId) === String(effTaskId) || (String(cs.linkedGoalId) === String(effGoalId) && cs.title === t.title)){
                  cs.done = isNowDone;
                }
              });
            }
          });
          if(m.tasks && m.tasks.length){
            var allTasksDone = m.tasks.every(function(tk){ return !!tk.done; });
            m.status = allTasksDone ? 'done' : (m.status === 'done' ? 'todo' : m.status);
          }
        });
      }
    } else if(kind === 'ms' && (goalId || schedId) && (msId || schedId)){
      var effGoalId = goalId;
      var effMsId = msId || schedId;
      var g = (L.state.profile.goals || []).find(function(x){ return String(x.id) === String(effGoalId); });
      if(g && g.milestones){
        var m = g.milestones.find(function(x){ return String(x.id) === String(effMsId); });
        if(m){
          m.status = (m.status === 'done') ? 'todo' : 'done';
          isNowDone = (m.status === 'done');
          wasLinked = true;
          (m.tasks || []).forEach(function(t){ t.done = isNowDone; });
          (L.state.profile.settings.customSchedules || []).forEach(function(cs){
            if(String(cs.linkedMsId) === String(effMsId) || String(cs.linkedId) === String(effMsId) || (String(cs.linkedGoalId) === String(effGoalId) && cs.title === m.title)){
              cs.done = isNowDone;
            }
          });
        }
      }
    } else if(kind === 'goal' && goalId){
      var g = (L.state.profile.goals || []).find(function(x){ return String(x.id) === String(goalId); });
      if(g){
        var allDone = g.milestones && g.milestones.length && g.milestones.every(function(m){ return m.status === 'done'; });
        isNowDone = !allDone;
        wasLinked = true;
        (g.milestones || []).forEach(function(m){
          m.status = isNowDone ? 'done' : 'todo';
          (m.tasks || []).forEach(function(t){ t.done = isNowDone; });
        });
        (L.state.profile.settings.customSchedules || []).forEach(function(cs){
          if(String(cs.linkedGoalId) === String(g.id) || String(cs.linkedId) === String(g.id)){
            cs.done = isNowDone;
          }
        });
      }
    } else if(kind === 'gcal' && (schedId || goalId)){
      var gcalTarget = schedId || goalId;
      L.state.gcalEventsCache = L.state.gcalEventsCache || [];
      var sched = L.state.gcalEventsCache.find(function(c){ return String(c.id) === String(gcalTarget); });
      if(sched){
        sched.done = !sched.done;
        isNowDone = sched.done;
      } else {
        isNowDone = true;
        L.state.gcalEventsCache.push({ id: gcalTarget, done: true, kind: 'gcal' });
      }
      try { localStorage.setItem(L.gcalEventsKey(), JSON.stringify(L.state.gcalEventsCache)); } catch(e){}
      if(!L.state.profile.settings) L.state.profile.settings = {};
      if(!L.state.profile.settings.gcalDoneEvents) L.state.profile.settings.gcalDoneEvents = {};
      L.state.profile.settings.gcalDoneEvents[gcalTarget] = isNowDone;
    } else if(kind === 'team_goal' && (schedId || msId || goalId)){
      var tgTarget = schedId || msId || goalId;
      if(!L.state.profile.settings) L.state.profile.settings = {};
      if(!L.state.profile.settings.teamGoalDoneEvents) L.state.profile.settings.teamGoalDoneEvents = {};
      var curDone = !!L.state.profile.settings.teamGoalDoneEvents[tgTarget];
      isNowDone = !curDone;
      L.state.profile.settings.teamGoalDoneEvents[tgTarget] = isNowDone;
      try {
        localStorage.setItem('ourgoal_team_goal_done_events', JSON.stringify(L.state.profile.settings.teamGoalDoneEvents));
      } catch(e){}
      if(typeof L.MOCK_GROUPS !== 'undefined'){
        L.MOCK_GROUPS.forEach(function(g){
          (g.teamGoals || []).forEach(function(tg){
            if(String(tg.id) === String(tgTarget)){
              (tg.milestones || []).forEach(function(m){ m.status = isNowDone ? 'done' : 'todo'; });
            }
            (tg.milestones || []).forEach(function(m){
              if(String(m.id) === String(tgTarget)){
                m.status = isNowDone ? 'done' : 'todo';
              }
            });
          });
        });
      }
    }

    if(isNowDone){
      if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
      L.triggerHaptic(15);
      L.awardXP(10, '일정 및 목표 달성');
      L.toast(wasLinked ? '일정 및 연계 목표를 달성했어요! 🎯 (+10 EXP)' : '일정을 완료했어요! 🎯 (+10 EXP)');
    } else {
      if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
      L.triggerHaptic(10);
      L.toast('일정을 미완료로 변경했어요');
    }

    L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
    await L.saveProfile();
    L.renderCalendarScreen();
    if(typeof L.renderGoalsScreen === 'function') L.renderGoalsScreen();
    if(typeof L.renderHome === 'function') L.renderHome();
    if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
    if(typeof renderStatsScreen === 'function') renderStatsScreen();
  }

  K.toggleScheduleDone = toggleScheduleDone;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
