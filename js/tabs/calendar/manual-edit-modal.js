/**
 * OurGoal Calendar Manual Edit Modal (일정 — 수동 일정 편집 창)
 *
 * 「캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253)」 묶음 전체(openCalendarManualEditModal).
 * #TASK-ES-548(인라인 3단계 구역 Z5 표준 2): index.html 인라인 IIFE 의 구간(이전 전 5429~5914줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  /* ---- 이전 전 index.html 5429~5914줄(#TASK-ES-548 생성기 표지) ---- */
  /* ============ 캘린더 수동 일정 편집 모달 (Req 2 & #TASK-ES-253) ============ */
  function openCalendarManualEditModal(selectedDate, eventItem, kind, draft){
    var isNew = !eventItem;
    var selDate = selectedDate || L.state.calSelectedDate || L.isoDate(new Date());
    var defaultDateVal = (selDate.indexOf('T') !== -1 ? selDate : selDate + 'T09:00');
    var curTitle = draft ? draft.title : (eventItem ? eventItem.title : '');
    var curDate = draft ? draft.date : (eventItem && eventItem.dueDate ? L.toDateTimeLocalValue(eventItem.dueDate) : (eventItem && eventItem.date ? L.toDateTimeLocalValue(eventItem.date) : defaultDateVal));
    var curNote = draft ? draft.note : (eventItem ? (eventItem.note || '') : '');
    var curDone = draft ? !!draft.done : (eventItem ? (eventItem.done || eventItem.status==='done') : false);
    var curLinkedGoalId = draft ? draft.linkedGoalId : (eventItem ? (eventItem.linkedGoalId || (eventItem.linkedLevel==='goal'?eventItem.linkedId:(kind==='goal'?eventItem.id:(kind==='ms'||kind==='task'?eventItem.goalId:null)))) : null);
    var curLinkedMsId = draft ? draft.linkedMsId : (eventItem ? (eventItem.linkedMsId || (eventItem.linkedLevel==='ms'?eventItem.linkedId:(kind==='ms'?eventItem.id:null))) : null);
    var curLinkedTaskId = draft ? draft.linkedTaskId : (eventItem ? (eventItem.linkedTaskId || (eventItem.linkedLevel==='task'?eventItem.linkedId:(kind==='task'?eventItem.id:null))) : null);
    var curAttachments = draft ? [].concat(draft.attachments || []) : ((eventItem && eventItem.attachments) ? [].concat(eventItem.attachments) : []);

    var goalsList = (L.state.profile && L.state.profile.goals) || [];
    if(!curLinkedGoalId && (curLinkedMsId || curLinkedTaskId)){
      goalsList.forEach(function(g){
        (g.milestones || []).forEach(function(m){
          if(curLinkedMsId && String(m.id) === String(curLinkedMsId)) curLinkedGoalId = g.id;
          (m.tasks || []).forEach(function(t){
            if(curLinkedTaskId && String(t.id) === String(curLinkedTaskId)){
              curLinkedGoalId = g.id;
              if(!curLinkedMsId) curLinkedMsId = m.id;
            }
          });
        });
      });
    }

    function buildSubtaskOptions(gId, selMsId, selTaskId){
      var opts = '<option value="">-- 목표 전체 연계 (마일스톤/할일 미지정) --</option>';
      if(!gId) return opts;
      var g = (goalsList || []).find(function(x){ return String(x.id) === String(gId); });
      if(!g || !g.milestones || !g.milestones.length) return opts;
      g.milestones.forEach(function(m){
        var mVal = 'ms:' + m.id;
        var isMSel = (!selTaskId && selMsId && String(selMsId) === String(m.id)) ? ' selected' : '';
        opts += '<option value="' + mVal + '"' + isMSel + '>🏁 [마일스톤] ' + L.escapeHtml(m.title) + '</option>';
        (m.tasks || []).forEach(function(t){
          var tVal = 'task:' + m.id + ':' + t.id;
          var isTSel = (selTaskId && String(selTaskId) === String(t.id)) ? ' selected' : '';
          opts += '<option value="' + tVal + '"' + isTSel + '>&nbsp;&nbsp;└ 📌 [할일] ' + L.escapeHtml(t.title) + '</option>';
        });
      });
      return opts;
    }

    // [#TASK-ES-180], [65] 일정 사전 알림 설정 (기본 10분 전)
    var curNotifyEnabled = draft ? !!draft.notifyEnabled : (eventItem ? !!eventItem.notifyEnabled : false);
    var curNotifyMinutes = draft ? (typeof draft.notifyMinutes === 'number' ? draft.notifyMinutes : 10) : (eventItem && typeof eventItem.notifyMinutes === 'number' ? eventItem.notifyMinutes : 10);
    var goalSelectOptions = '<option value="">-- 목표 미연계 (일반 일정) --</option>' +
      goalsList.map(function(g){
        var isSel = (curLinkedGoalId === g.id) ? ' selected' : '';
        return '<option value="' + g.id + '"' + isSel + '>🎯 ' + L.escapeHtml(g.title) + '</option>';
      }).join('');
    L.openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<span class="dm-back" id="calEditBackToHubBtn" style="cursor:pointer;margin:0;font-size:.875rem;color:var(--ink);font-weight:700;">‹ ' + selDate + ' 일정 목록으로</span>' +
        '<span class="faint" style="font-size:.8125rem;">' + selDate + '</span>' +
      '</div>' +
      '<h3>' + (isNew ? '새 일정 추가' : '일정 수동 편집') + '</h3>' +
      '<div class="field">' +
        '<label>일정 제목 (필수)</label>' +
        '<input id="calEditTitle" type="text" value="' + L.escapeHtml(curTitle) + '" placeholder="예: 운동 모임 참석, 자격증 시험 접수">' +
      '</div>' +
      '<div class="field">' +
        '<label>날짜 및 시간</label>' +
        '<input id="calEditDate" type="datetime-local" value="' + curDate + '">' +
      '</div>' +
      '<div class="field">' +
        '<label>연계할 목표 (선택)</label>' +
        '<select id="calEditLinkedGoal" style="width:100%;">' +
          goalSelectOptions +
        '</select>' +
      '</div>' +
      '<div class="field" id="calEditLinkedSubtaskField" style="display:' + (curLinkedGoalId ? 'block' : 'none') + ';margin-top:8px;">' +
        '<label style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span>연계할 마일스톤 / 세부할일</span>' +
          '<span style="font-size:0.75rem;color:var(--brand);font-weight:600;">실시간 자동 체크 연동 ⚡</span>' +
        '</label>' +
        '<select id="calEditLinkedSubtask" style="width:100%;">' +
          buildSubtaskOptions(curLinkedGoalId, curLinkedMsId, curLinkedTaskId) +
        '</select>' +
      '</div>' +
      '<div class="field">' +
        '<label>메모 / 장소 (선택)</label>' +
        '<input id="calEditNote" type="text" value="' + L.escapeHtml(curNote) + '" placeholder="예: 강남역 11번 출구, 신분증 지참">' +
      '</div>' +
      (window.OurgoalCalendarAttachment ? window.OurgoalCalendarAttachment.renderSectionHtml(curAttachments) : '') +
      '<div class="toggle-row" style="margin-top:10px;">' +
        '<div class="t">⏰ 사전 알림 받기</div>' +
        '<div class="switch' + (curNotifyEnabled ? ' on' : '') + '" id="calEditNotifySwitch"></div>' +
      '</div>' +
      '<div class="field" id="calEditNotifyTimeField" style="display:' + (curNotifyEnabled ? 'block' : 'none') + ';margin-top:6px;">' +
        '<label>울릴 시간 (사전 알림)</label>' +
        '<select id="calEditNotifyOffset" style="width:100%;">' +
          '<option value="0"' + (curNotifyMinutes===0 ? ' selected' : '') + '>정시 (일정 시작 시각)</option>' +
          '<option value="5"' + (curNotifyMinutes===5 ? ' selected' : '') + '>5분 전</option>' +
          '<option value="10"' + (curNotifyMinutes===10 || !curNotifyMinutes ? ' selected' : '') + '>10분 전 (기본)</option>' +
          '<option value="15"' + (curNotifyMinutes===15 ? ' selected' : '') + '>15분 전</option>' +
          '<option value="30"' + (curNotifyMinutes===30 ? ' selected' : '') + '>30분 전</option>' +
          '<option value="60"' + (curNotifyMinutes===60 ? ' selected' : '') + '>1시간 전</option>' +
          '<option value="120"' + (curNotifyMinutes===120 ? ' selected' : '') + '>2시간 전</option>' +
          '<option value="1440"' + (curNotifyMinutes===1440 ? ' selected' : '') + '>1일 전</option>' +
          '<option value="custom"' + (([0,5,10,15,30,60,120,1440].indexOf(curNotifyMinutes)===-1) ? ' selected' : '') + '>직접 입력 (분 단위)</option>' +
        '</select>' +
        '<div id="calEditNotifyCustomWrap" style="display:' + (([0,5,10,15,30,60,120,1440].indexOf(curNotifyMinutes)===-1) ? 'flex' : 'none') + ';align-items:center;gap:6px;margin-top:6px;">' +
          '<input type="number" id="calEditNotifyCustomMin" min="1" max="10080" value="' + curNotifyMinutes + '" placeholder="예: 20" style="flex:1;">' +
          '<span style="font-size:0.875rem;color:var(--ink);font-weight:600;white-space:nowrap;">분 전 알림</span>' +
        '</div>' +
      '</div>' +
      (!isNew ?
        ('<div class="toggle-row" style="margin-top:12px;">' +
          '<div class="t">완료 여부</div>' +
          '<div class="switch' + (curDone ? ' on' : '') + '" id="calEditDoneSwitch"></div>' +
        '</div>') : '') +
      '<div class="modal-actions" style="margin-top:16px;gap:8px;">' +
        (!isNew ? '<button class="btn btn-danger btn-sm" id="calEditDeleteBtn" type="button">삭제</button>' : '') +
        '<button class="btn btn-ghost btn-sm" id="calEditCancelBtn" type="button">취소</button>' +
        '<button class="btn btn-primary btn-sm" id="calEditSaveBtn" type="button" style="flex:1;background:var(--primary, #10b981) !important;color:#fff !important;font-weight:700;box-shadow:0 2px 8px rgba(16,185,129,0.3);">저장</button>' +
      '</div>',
      function(sheet){
        var backBtn = sheet.querySelector('#calEditBackToHubBtn');
        if(backBtn){
          backBtn.onclick = function(){
            L.openCalendarDayEditHubModal(selDate);
          };
        }
        var goalSel = sheet.querySelector('#calEditLinkedGoal');
        var subtaskField = sheet.querySelector('#calEditLinkedSubtaskField');
        var subtaskSel = sheet.querySelector('#calEditLinkedSubtask');
        var titleInp = sheet.querySelector('#calEditTitle');

        if(goalSel){
          goalSel.onchange = function(){
            var gid = goalSel.value;
            if(gid){
              if(subtaskField) subtaskField.style.display = 'block';
              if(subtaskSel) subtaskSel.innerHTML = buildSubtaskOptions(gid, null, null);
            } else {
              if(subtaskField) subtaskField.style.display = 'none';
              if(subtaskSel) subtaskSel.innerHTML = '<option value="">-- 목표 전체 연계 (마일스톤/할일 미지정) --</option>';
            }
          };
        }

        if(subtaskSel){
          subtaskSel.onchange = function(){
            var val = subtaskSel.value;
            if(val && titleInp && (!titleInp.value.trim() || titleInp.dataset.autofilled === '1')){
              var gid = goalSel ? goalSel.value : null;
              var g = (goalsList || []).find(function(x){ return String(x.id) === String(gid); });
              if(g){
                if(val.startsWith('task:')){
                  var parts = val.split(':');
                  var m = (g.milestones || []).find(function(x){ return String(x.id) === String(parts[1]); });
                  if(m){
                    var t = (m.tasks || []).find(function(x){ return String(x.id) === String(parts[2]); });
                    if(t){
                      titleInp.value = t.title;
                      titleInp.dataset.autofilled = '1';
                    }
                  }
                } else if(val.startsWith('ms:')){
                  var parts = val.split(':');
                  var m = (g.milestones || []).find(function(x){ return String(x.id) === String(parts[1]); });
                  if(m){
                    titleInp.value = m.title;
                    titleInp.dataset.autofilled = '1';
                  }
                }
              }
            }
          };
        }
        if(titleInp){
          titleInp.oninput = function(){
            delete titleInp.dataset.autofilled;
          };
        }

        var doneSw = sheet.querySelector('#calEditDoneSwitch');
        var isDone = curDone;
        if(doneSw){
          doneSw.onclick = function(){
            isDone = !isDone;
            doneSw.classList.toggle('on', isDone);
          };
        }
        var notifySw = sheet.querySelector('#calEditNotifySwitch');
        var notifyField = sheet.querySelector('#calEditNotifyTimeField');
        var isNotifyOn = curNotifyEnabled;
        if(notifySw){
          notifySw.onclick = function(){
            isNotifyOn = !isNotifyOn;
            notifySw.classList.toggle('on', isNotifyOn);
            if(notifyField) notifyField.style.display = isNotifyOn ? 'block' : 'none';
          };
        }
        var notifyOffsetEl = sheet.querySelector('#calEditNotifyOffset');
        var customWrap = sheet.querySelector('#calEditNotifyCustomWrap');
        var customMinInp = sheet.querySelector('#calEditNotifyCustomMin');
        if(notifyOffsetEl && customWrap){
          notifyOffsetEl.onchange = function(){
            var isCustom = (notifyOffsetEl.value === 'custom');
            customWrap.style.display = isCustom ? 'flex' : 'none';
            if(isCustom && customMinInp){
              customMinInp.focus();
            }
          };
        }
        sheet.querySelector('#calEditCancelBtn').onclick = function(){
          L.openCalendarDayEditHubModal(selDate);
        };
        if(window.OurgoalCalendarAttachment){
          var wireAtts = function(){
            window.OurgoalCalendarAttachment.wireEditModalAttachments(sheet, function(){
              var curG = sheet.querySelector('#calEditLinkedGoal') ? sheet.querySelector('#calEditLinkedGoal').value : curLinkedGoalId;
              var curSub = sheet.querySelector('#calEditLinkedSubtask') ? sheet.querySelector('#calEditLinkedSubtask').value : '';
              var curM = null;
              var curT = null;
              if(curSub.startsWith('task:')){
                var p = curSub.split(':');
                curM = p[1]; curT = p[2];
              } else if(curSub.startsWith('ms:')){
                curM = curSub.split(':')[1];
              }
              var nMin = 10;
              if(notifyOffsetEl){
                if(notifyOffsetEl.value === 'custom'){
                  var cVal = parseInt(customMinInp ? customMinInp.value : '10', 10);
                  nMin = isNaN(cVal) || cVal < 0 ? 10 : cVal;
                } else {
                  var sVal = parseInt(notifyOffsetEl.value, 10);
                  nMin = isNaN(sVal) ? 10 : sVal;
                }
              }
              return { title: (sheet.querySelector('#calEditTitle').value || '').trim(), date: sheet.querySelector('#calEditDate').value, note: (sheet.querySelector('#calEditNote').value || '').trim(), done: isDone, linkedGoalId: curG, linkedMsId: curM, linkedTaskId: curT, attachments: curAttachments, notifyEnabled: isNotifyOn, notifyMinutes: nMin };
            }, function(updatedAtts, ctx){
              /* 참고자료 첨부/조회 모달이 단일 #modalSheet를 재사용해 이 화면을 덮어쓰므로,
                 패치가 아니라 입력값(ctx)을 보존한 채로 이 모달을 다시 완전히 열어야 한다. */
              openCalendarManualEditModal(
                selDate, eventItem, kind,
                {
                  title: ctx && ctx.title !== undefined ? ctx.title : curTitle,
                  date: ctx && ctx.date !== undefined ? ctx.date : curDate,
                  note: ctx && ctx.note !== undefined ? ctx.note : curNote,
                  done: ctx && ctx.done !== undefined ? ctx.done : isDone,
                  linkedGoalId: ctx && ctx.linkedGoalId !== undefined ? ctx.linkedGoalId : curLinkedGoalId,
                  linkedMsId: ctx && ctx.linkedMsId !== undefined ? ctx.linkedMsId : curLinkedMsId,
                  linkedTaskId: ctx && ctx.linkedTaskId !== undefined ? ctx.linkedTaskId : curLinkedTaskId,
                  attachments: updatedAtts,
                  notifyEnabled: ctx && ctx.notifyEnabled !== undefined ? ctx.notifyEnabled : isNotifyOn,
                  notifyMinutes: ctx && ctx.notifyMinutes !== undefined ? ctx.notifyMinutes : curNotifyMinutes
                }
              );
            });
          };
          wireAtts();
        }
        var delBtn = sheet.querySelector('#calEditDeleteBtn');
        if(delBtn){
          delBtn.onclick = async function(){
            if(!(await OurgoalCapabilities.call('ui.confirm', '이 일정을 휴지통으로 이동할까요?\n7일간 보관되며 언제든 원복할 수 있습니다.'))) return;
            if(kind==='custom'){
              await L.moveToTrash('schedule', eventItem.id, eventItem, 'in_app', eventItem.title);
            } else if(kind==='goal'){
              eventItem.dueDate = null;
              await L.saveProfile();
              L.renderCalendarScreen();
              if(typeof L.renderGoalsScreen === 'function') L.renderGoalsScreen();
              if(typeof L.renderHome === 'function') L.renderHome();
              if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
              if(typeof renderStatsScreen === 'function') renderStatsScreen();
            } else if(kind==='ms'||kind==='task'){
              eventItem.dueDate = null;
              await L.saveProfile();
              L.renderCalendarScreen();
              if(typeof L.renderGoalsScreen === 'function') L.renderGoalsScreen();
              if(typeof L.renderHome === 'function') L.renderHome();
              if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
              if(typeof renderStatsScreen === 'function') renderStatsScreen();
            } else if(kind==='gcal'){
              L.state.gcalEventsCache = (L.state.gcalEventsCache || []).filter(function(c){ return String(c.id) !== String(eventItem.id); });
              try { localStorage.setItem(L.gcalEventsKey(), JSON.stringify(L.state.gcalEventsCache)); } catch(e){}
              L.toast('구글 일정을 캘린더에서 제거했어요');
              L.renderCalendarScreen();
              if(typeof L.renderGoalsScreen === 'function') L.renderGoalsScreen();
              if(typeof L.renderHome === 'function') L.renderHome();
              if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
              if(typeof renderStatsScreen === 'function') renderStatsScreen();
            }
            L.openCalendarDayEditHubModal(selDate);
          };
        }
        sheet.querySelector('#calEditSaveBtn').onclick = async function(){
          var title = (sheet.querySelector('#calEditTitle').value || '').trim();
          var dtVal = sheet.querySelector('#calEditDate').value;
          var note = (sheet.querySelector('#calEditNote').value || '').trim();
          var goalSelEl = sheet.querySelector('#calEditLinkedGoal');
          var linkedGoalId = goalSelEl ? goalSelEl.value : null;
          var linkedGoalTitle = null;
          var linkedMsId = null;
          var linkedTaskId = null;
          var linkedTaskTitle = null;
          var linkedLevel = null;
          var linkedId = null;

          if(linkedGoalId){
            var matchedGoal = (L.state.profile.goals || []).find(function(g){ return String(g.id) === String(linkedGoalId); });
            if(matchedGoal){
              linkedGoalTitle = matchedGoal.title;
              linkedLevel = 'goal';
              linkedId = linkedGoalId;
              var subtaskSelEl = sheet.querySelector('#calEditLinkedSubtask');
              var subVal = subtaskSelEl ? subtaskSelEl.value : '';
              if(subVal && subVal.startsWith('task:')){
                var parts = subVal.split(':');
                linkedMsId = parts[1];
                linkedTaskId = parts[2];
                linkedLevel = 'task';
                linkedId = linkedTaskId;
                var foundMs = (matchedGoal.milestones || []).find(function(m){ return String(m.id) === String(linkedMsId); });
                if(foundMs){
                  var foundTask = (foundMs.tasks || []).find(function(t){ return String(t.id) === String(linkedTaskId); });
                  if(foundTask) linkedTaskTitle = foundTask.title;
                }
              } else if(subVal && subVal.startsWith('ms:')){
                var parts = subVal.split(':');
                linkedMsId = parts[1];
                linkedLevel = 'ms';
                linkedId = linkedMsId;
              }
            }
          }

          if(!title){ L.toast('일정 제목을 입력해주세요'); return; }
          if(!dtVal){ L.toast('날짜를 입력해주세요'); return; }
          var notifyOffsetEl = sheet.querySelector('#calEditNotifyOffset');
          var notifyMinutesVal = 10;
          if(notifyOffsetEl){
            if(notifyOffsetEl.value === 'custom'){
              var customMinInp = sheet.querySelector('#calEditNotifyCustomMin');
              var cVal = parseInt(customMinInp ? customMinInp.value : '10', 10);
              notifyMinutesVal = isNaN(cVal) || cVal < 0 ? 10 : cVal;
            } else {
              var sVal = parseInt(notifyOffsetEl.value, 10);
              notifyMinutesVal = isNaN(sVal) ? 10 : sVal;
            }
          }
          if(!L.state.profile.settings.customSchedules) L.state.profile.settings.customSchedules = [];

          // 연계된 목표/마일스톤/할일 상태 동기화
          if(linkedGoalId && (linkedTaskId || linkedMsId)){
            (L.state.profile.goals || []).forEach(function(g){
              if(String(g.id) !== String(linkedGoalId)) return;
              (g.milestones || []).forEach(function(m){
                if(linkedMsId && String(m.id) !== String(linkedMsId)) return;
                (m.tasks || []).forEach(function(t){
                  if(linkedTaskId && String(t.id) === String(linkedTaskId)){
                    t.done = isDone;
                  }
                });
                if(m.tasks && m.tasks.length){
                  var allTkDone = m.tasks.every(function(tk){ return !!tk.done; });
                  m.status = allTkDone ? 'done' : (m.status === 'done' ? 'todo' : m.status);
                } else if(linkedMsId && String(m.id) === String(linkedMsId)){
                  m.status = isDone ? 'done' : 'todo';
                }
              });
            });
          }

          if(isNew){
            L.state.profile.settings.customSchedules.push({
              id: L.uid('sched'),
              title: title,
              date: dtVal,
              note: note,
              done: isDone,
              notifyEnabled: isNotifyOn,
              notifyMinutes: notifyMinutesVal,
              linkedGoalId: linkedGoalId || null,
              linkedGoalTitle: linkedGoalTitle || null,
              linkedMsId: linkedMsId || null,
              linkedTaskId: linkedTaskId || null,
              linkedTaskTitle: linkedTaskTitle || null,
              linkedLevel: linkedLevel || null,
              linkedId: linkedId || null,
              attachments: curAttachments,
              createdAt: L.nowISO()
            });
            L.toast('일정을 추가했어요' + (isNotifyOn ? ' (' + (notifyMinutesVal === 0 ? '정시' : notifyMinutesVal + '분 전') + ' 알림)' : ''));
          } else {
            if(kind==='custom'){
              if(eventItem && typeof eventItem === 'object'){
                eventItem.title = title;
                eventItem.date = dtVal;
                eventItem.note = note;
                eventItem.done = isDone;
                eventItem.notifyEnabled = isNotifyOn;
                eventItem.notifyMinutes = notifyMinutesVal;
                eventItem.linkedGoalId = linkedGoalId || null;
                eventItem.linkedGoalTitle = linkedGoalTitle || null;
                eventItem.linkedMsId = linkedMsId || null;
                eventItem.linkedTaskId = linkedTaskId || null;
                eventItem.linkedTaskTitle = linkedTaskTitle || null;
                eventItem.linkedLevel = linkedLevel || null;
                eventItem.linkedId = linkedId || null;
                eventItem.attachments = curAttachments;
              }
              var targetSchedId = (eventItem && typeof eventItem === 'object') ? (eventItem.id || eventItem.schedId) : eventItem;
              var rawSched = (L.state.profile.settings.customSchedules || []).find(function(c){
                return String(c.id) === String(targetSchedId);
              });
              if(rawSched && rawSched !== eventItem){
                rawSched.title = title;
                rawSched.date = dtVal;
                rawSched.note = note;
                rawSched.done = isDone;
                rawSched.notifyEnabled = isNotifyOn;
                rawSched.notifyMinutes = notifyMinutesVal;
                rawSched.linkedGoalId = linkedGoalId || null;
                rawSched.linkedGoalTitle = linkedGoalTitle || null;
                rawSched.linkedMsId = linkedMsId || null;
                rawSched.linkedTaskId = linkedTaskId || null;
                rawSched.linkedTaskTitle = linkedTaskTitle || null;
                rawSched.linkedLevel = linkedLevel || null;
                rawSched.linkedId = linkedId || null;
                rawSched.attachments = curAttachments;
              }
            } else if(kind==='gcal'){
              eventItem.title = title;
              eventItem.date = dtVal;
              eventItem.note = note;
              eventItem.done = isDone;
              eventItem.notifyEnabled = isNotifyOn;
              eventItem.notifyMinutes = notifyMinutesVal;
              L.state.gcalEventsCache = L.state.gcalEventsCache || [];
              var gMatch = L.state.gcalEventsCache.find(function(c){ return String(c.id) === String(eventItem.id); });
              if(gMatch){
                gMatch.title = title;
                gMatch.date = dtVal;
                gMatch.note = note;
                gMatch.done = isDone;
                gMatch.notifyEnabled = isNotifyOn;
                gMatch.notifyMinutes = notifyMinutesVal;
              }
              try { localStorage.setItem(L.gcalEventsKey(), JSON.stringify(L.state.gcalEventsCache)); } catch(e){}
              if(!L.state.profile.settings) L.state.profile.settings = {};
              if(!L.state.profile.settings.gcalDoneEvents) L.state.profile.settings.gcalDoneEvents = {};
              L.state.profile.settings.gcalDoneEvents[eventItem.id] = isDone;
              if(L.isGoogleCalendarConnected()){
                L.getGoogleAccessToken(false).then(function(token){
                  if(token) L.pushCalendarEvent(token, title, dtVal, eventItem.id).catch(function(){});
                }).catch(function(){});
              }
            } else {
              eventItem.title = title;
              if(kind==='task') eventItem.done = isDone;
              else if(kind==='ms') eventItem.status = isDone ? 'done' : (eventItem.status==='done' ? 'todo' : eventItem.status);
              eventItem.dueDate = dtVal;
              eventItem.notifyEnabled = isNotifyOn;
              eventItem.notifyMinutes = notifyMinutesVal;
              if(curAttachments.length) eventItem.attachments = curAttachments;
            }
            L.toast('일정을 수정했어요' + (isNotifyOn ? ' (' + (notifyMinutesVal === 0 ? '정시' : notifyMinutesVal + '분 전') + ' 알림)' : ''));
          }
          var dayKey = dtVal.slice(0, 10);
          L.state.calSelectedDate = dayKey;
          L.state.calDate = dayKey;
          L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
          await L.saveProfile();
          L.renderCalendarScreen();
          if(typeof L.renderGoalsScreen === 'function') L.renderGoalsScreen();
          if(typeof L.renderHome === 'function') L.renderHome();
          if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
          if(typeof renderStatsScreen === 'function') renderStatsScreen();
          L.openCalendarDayEditHubModal(dayKey);
          if(L.state.profile.settings.gcalAutoSync && L.isGoogleCalendarConnected()){
            L.syncAllToGoogleCalendar(false).catch(function(){});
          }
        };
      }
    );
  }

  K.openCalendarManualEditModal = openCalendarManualEditModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
