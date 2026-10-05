/**
 * OurGoal Goal Schedule Setup (목표 탭 — 3계층 일정 설정 창·디데이 표시)
 *
 * #TASK-ES-436 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   formatSchedulePillHtml · openScheduleSetupModal · applyScheduleUpdate(이전 전 20405~20633줄 · 구획 「목표 탭 3계층 일정설정 / 디데이·기간 표시 및 캘린더 연동 (#TASK-ES-259, 메모장 03항, #」)
 * openScheduleSetupModal = 목표·마일스톤·할일 일정 설정 바텀시트 · applyScheduleUpdate = 저장 · formatSchedulePillHtml = 디데이·기간 알약.
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function formatSchedulePillHtml(item, level, goalId, msId, taskId){
    var sDate = (item && item.startDate) ? String(item.startDate).slice(0, 10) : '';
    var dDate = (item && item.dueDate) ? String(item.dueDate).slice(0, 10) : '';
    var gid = goalId || '';
    var mid = msId || '';
    var tid = taskId || '';
    if(!sDate && !dDate){
      return '<button type="button" class="schedule-pill-btn empty" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="일정 설정">📅 일정 설정</button>';
    }
    if(sDate && dDate && sDate !== dDate){
      var sParts = sDate.split('-');
      var dParts = dDate.split('-');
      var sText = sParts[0] + '.' + parseInt(sParts[1], 10) + '.' + parseInt(sParts[2], 10) + '.';
      var dText = dParts[0] + '.' + parseInt(dParts[1], 10) + '.' + parseInt(dParts[2], 10) + '.';
      var rangeText = sText + '~' + dText;
      return '<button type="button" class="schedule-pill-btn has-date" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="일정 기간: '+rangeText+' (클릭하여 수정)">📅 '+rangeText+'</button>';
    }
    var singleDate = dDate || sDate;
    var dText = L.dDay(singleDate);
    return '<button type="button" class="schedule-pill-btn has-date" data-setschedule="1" data-schedlevel="'+level+'" data-schedgid="'+gid+'" data-schedmsid="'+mid+'" data-schedtid="'+tid+'" title="마감일 '+singleDate+' (클릭하여 수정)">📅 '+dText+'</button>';
  }

  function openScheduleSetupModal(levelOrOpts, maybeGid, maybeMsId, maybeTid){
    var opts = (typeof levelOrOpts === 'object' && levelOrOpts !== null) ? levelOrOpts : {
      level: levelOrOpts,
      gid: maybeGid,
      msId: maybeMsId,
      tid: maybeTid
    };
    var level = opts.level;
    var gid = opts.gid;
    var msId = opts.msId;
    var tid = opts.tid;
    var title = opts.title || '';
    var sVal = opts.startDate ? opts.startDate.slice(0, 10) : '';
    var dVal = opts.dueDate ? opts.dueDate.slice(0, 10) : '';
    var sTime = (opts.startDate && opts.startDate.length > 10) ? opts.startDate.slice(11, 16) : '09:00';
    var dTime = (opts.dueDate && opts.dueDate.length > 10) ? opts.dueDate.slice(11, 16) : '18:00';

    if((!title || !sVal || !dVal) && L.state.profile && L.state.profile.goals){
      var g = L.state.profile.goals.find(function(x){ return x.id === gid; });
      if(g){
        if(level === 'goal'){
          if(!title) title = g.title;
          if(!sVal && g.startDate) sVal = String(g.startDate).slice(0, 10);
          if(!dVal && g.dueDate) dVal = String(g.dueDate).slice(0, 10);
          if(g.startDate && String(g.startDate).length > 10) sTime = String(g.startDate).slice(11, 16);
          if(g.dueDate && String(g.dueDate).length > 10) dTime = String(g.dueDate).slice(11, 16);
        } else if(level === 'ms'){
          var m = (g.milestones || []).find(function(x){ return x.id === msId; });
          if(m){
            if(!title) title = m.title;
            if(!sVal && m.startDate) sVal = String(m.startDate).slice(0, 10);
            if(!dVal && m.dueDate) dVal = String(m.dueDate).slice(0, 10);
            if(m.startDate && String(m.startDate).length > 10) sTime = String(m.startDate).slice(11, 16);
            if(m.dueDate && String(m.dueDate).length > 10) dTime = String(m.dueDate).slice(11, 16);
          }
        } else if(level === 'task'){
          var m = (g.milestones || []).find(function(x){ return x.id === msId; });
          if(m){
            var t = (m.tasks || []).find(function(x){ return x.id === tid; });
            if(t){
              if(!title) title = t.title;
              if(!sVal && t.startDate) sVal = String(t.startDate).slice(0, 10);
              if(!dVal && t.dueDate) dVal = String(t.dueDate).slice(0, 10);
              if(t.startDate && String(t.startDate).length > 10) sTime = String(t.startDate).slice(11, 16);
              if(t.dueDate && String(t.dueDate).length > 10) dTime = String(t.dueDate).slice(11, 16);
            }
          }
        }
      }
    }
    var levelLabel = level === 'goal' ? '목표' : (level === 'ms' ? '마일스톤' : '할 일');
    var html = '<div class="schedule-setup-modal" style="padding:6px 2px;">' +
      '<h3 style="margin:0 0 6px;font-size:1.1rem;font-weight:700;">🗓️ ' + L.escapeHtml(levelLabel) + ' 일정 설정</h3>' +
      '<p style="font-size:.8125rem;color:var(--ink-soft);margin:0 0 14px;word-break:break-all;">' + L.escapeHtml(title) + '</p>' +
      '<div style="margin-bottom:12px;">' +
        '<label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px;color:var(--ink-soft);">시작일 (선택)</label>' +
        '<div style="display:flex;gap:6px;">' +
          '<input type="date" id="schedInpStart" class="input" value="' + sVal + '" style="flex:2;padding:8px;border-radius:8px;border:1px solid var(--line);font-size:.85rem;">' +
          '<input type="time" id="schedInpStartTime" class="input" value="' + sTime + '" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--line);font-size:.85rem;">' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px;color:var(--ink-soft);">종료/마감일</label>' +
        '<div style="display:flex;gap:6px;">' +
          '<input type="date" id="schedInpEnd" class="input" value="' + dVal + '" style="flex:2;padding:8px;border-radius:8px;border:1px solid var(--line);font-size:.85rem;">' +
          '<input type="time" id="schedInpEndTime" class="input" value="' + dTime + '" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--line);font-size:.85rem;">' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="schedPresetToday" style="font-size:.72rem;padding:3px 8px;">오늘 마감</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="schedPresetTomorrow" style="font-size:.72rem;padding:3px 8px;">내일 마감</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="schedPreset1W" style="font-size:.72rem;padding:3px 8px;">오늘부터 1주일</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="schedPreset1M" style="font-size:.72rem;padding:3px 8px;">오늘부터 1달</button>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;">' +
        (sVal || dVal ? '<button type="button" class="btn btn-danger btn-sm" id="schedDeleteBtn" style="font-size:.8rem;padding:7px 12px;">일정 삭제</button>' : '<div></div>') +
        '<div style="display:flex;gap:6px;">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="schedCancelBtn" style="font-size:.8rem;padding:7px 12px;">취소</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="schedSaveBtn" style="font-size:.8rem;padding:7px 14px;background:var(--brand);font-weight:700;">일정 저장</button>' +
        '</div>' +
      '</div>' +
    '</div>';
    L.openModal(html);
    var todayStr = new Date().toISOString().slice(0, 10);
    var pToday = document.getElementById('schedPresetToday');
    if(pToday) pToday.onclick = function(){
      document.getElementById('schedInpStart').value = todayStr;
      document.getElementById('schedInpEnd').value = todayStr;
    };
    var pTomorrow = document.getElementById('schedPresetTomorrow');
    if(pTomorrow){
      var tm = new Date(); tm.setDate(tm.getDate()+1);
      pTomorrow.onclick = function(){
        document.getElementById('schedInpStart').value = todayStr;
        document.getElementById('schedInpEnd').value = tm.toISOString().slice(0, 10);
      };
    }
    var p1W = document.getElementById('schedPreset1W');
    if(p1W){
      var w1 = new Date(); w1.setDate(w1.getDate()+7);
      p1W.onclick = function(){
        document.getElementById('schedInpStart').value = todayStr;
        document.getElementById('schedInpEnd').value = w1.toISOString().slice(0, 10);
      };
    }
    var p1M = document.getElementById('schedPreset1M');
    if(p1M){
      var m1 = new Date(); m1.setMonth(m1.getMonth()+1);
      p1M.onclick = function(){
        document.getElementById('schedInpStart').value = todayStr;
        document.getElementById('schedInpEnd').value = m1.toISOString().slice(0, 10);
      };
    }
    var cancelBtn = document.getElementById('schedCancelBtn');
    if(cancelBtn) cancelBtn.onclick = L.closeModal;
    var delBtn = document.getElementById('schedDeleteBtn');
    if(delBtn){
      delBtn.onclick = async function(){
        await applyScheduleUpdate(level, gid, msId, tid, null, null);
        L.closeModal();
        L.toast('일정을 삭제했습니다');
      };
    }
    var saveBtn = document.getElementById('schedSaveBtn');
    if(saveBtn){
      saveBtn.onclick = async function(){
        var sDate = document.getElementById('schedInpStart').value;
        var sTime = document.getElementById('schedInpStartTime').value || '09:00';
        var eDate = document.getElementById('schedInpEnd').value;
        var eTime = document.getElementById('schedInpEndTime').value || '18:00';
        if(!sDate && !eDate){
          L.toast('시작일이나 마감일을 선택해주세요');
          return;
        }
        var startISO = sDate ? (sDate + 'T' + sTime + ':00') : null;
        var endISO = eDate ? (eDate + 'T' + eTime + ':00') : startISO;
        if(startISO && endISO && startISO > endISO){
          var tmp = startISO; startISO = endISO; endISO = tmp;
        }
        await applyScheduleUpdate(level, gid, msId, tid, startISO, endISO);
        L.closeModal();
        L.toast('일정이 저장되었습니다 ✨');
      };
    }
  }

  async function applyScheduleUpdate(level, gid, msId, tid, startISO, endISO){
    if(!L.state.profile || !L.state.profile.goals) return;
    var goal = L.state.profile.goals.find(function(g){ return g.id === gid; });
    if(!goal) return;
    var targetTitle = goal.title;
    var targetId = gid;
    if(level === 'goal'){
      goal.startDate = startISO;
      goal.dueDate = endISO;
      targetTitle = goal.title;
      targetId = goal.id;
    } else if(level === 'ms'){
      var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
      if(ms){
        ms.startDate = startISO;
        ms.dueDate = endISO;
        targetTitle = ms.title;
        targetId = ms.id;
      }
    } else if(level === 'task'){
      var ms = (goal.milestones || []).find(function(m){ return m.id === msId; });
      if(ms){
        var task = (ms.tasks || []).find(function(t){ return t.id === tid; });
        if(task){
          task.startDate = startISO;
          task.dueDate = endISO;
          targetTitle = task.title;
          targetId = task.id;
        }
      }
    }
    if(!L.state.profile.settings) L.state.profile.settings = {};
    if(!Array.isArray(L.state.profile.settings.customSchedules)) L.state.profile.settings.customSchedules = [];
    var schedules = L.state.profile.settings.customSchedules;
    var schedIdx = schedules.findIndex(function(s){ return s.linkedId === targetId || s.id === ('sched_' + targetId); });
    if(schedIdx >= 0) schedules.splice(schedIdx, 1);
    if(endISO){
      schedules.push({
        id: 'sched_' + targetId,
        linkedId: targetId,
        linkedLevel: level,
        linkedGoalId: gid,
        linkedGoalTitle: goal.title,
        linkedMsId: (level === 'ms' || level === 'task') ? msId : null,
        linkedTaskId: (level === 'task') ? tid : null,
        linkedTaskTitle: (level === 'task') ? targetTitle : null,
        title: targetTitle,
        startDate: startISO || endISO,
        dueDate: endISO,
        date: endISO,
        category: goal.topic || '일정',
        createdAt: new Date().toISOString()
      });
    }
    await L.saveProfile();
    L.renderGoalsScreen();
    L.renderCalendarScreen();
    if(typeof L.renderHome === 'function') L.renderHome();
    if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
    if(typeof renderStatsScreen === 'function') renderStatsScreen();
  }

  K.formatSchedulePillHtml = formatSchedulePillHtml;
  K.openScheduleSetupModal = openScheduleSetupModal;
  K.applyScheduleUpdate = applyScheduleUpdate;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
