/**
 * OurGoal Calendar Core (일정 탭 — 날짜별 일정 모음·달력 칸·일정 넣기)
 *
 * 「일정(캘린더) 탭」 묶음: 날짜별 일정 모음(calendarItemsByDate)·달력 칸 그리기(calCellHtml)·날짜 글자 도우미·구글 캘린더 일정 넣기(pushCalendarEvent·quickSyncToCalendar).
 * #TASK-ES-486(인라인 어려움 기관 묶음 이전 2차): index.html 인라인 IIFE 의 구간(이전 전 7191~7193 · 7194~7202 · 7203~7206 · 7207~7247 · 7248~7299 · 7300~7452 · 7453~7530줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 7191~7193줄(#TASK-ES-486 생성기 표지) ---- */
  /* ============ 일정(캘린더) 탭 ============ */
  /* [#TASK-ES-360] WEEKDAYS_KR → js/tabs/calendar/render.js 로 옮김(일정 탭 세포) */
  function isoDate(d){ return d.getFullYear()+'-'+L.pad(d.getMonth()+1)+'-'+L.pad(d.getDate()); }
  /* ---- 이전 전 index.html 7194~7202줄(#TASK-ES-486 생성기 표지) ---- */
  /* [#TASK-ES-360] calWeekStart → js/tabs/calendar/render.js 로 옮김(일정 탭 세포) */
  /* [#TASK-ES-370] formatDateTimeBadge → js/tabs/goals/goal-detail.js 로 옮김(목표 탭 세포) */
  function toLocalInputValue(val){
    if(!val) return '';
    if(typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) return val;
    var d = (typeof val === 'string' || typeof val === 'number') ? new Date(val) : val;
    if(!d || isNaN(d.getTime())) return '';
    return d.getFullYear()+'-'+L.pad(d.getMonth()+1)+'-'+L.pad(d.getDate())+'T'+L.pad(d.getHours())+':'+L.pad(d.getMinutes());
  }
  /* ---- 이전 전 index.html 7203~7206줄(#TASK-ES-486 생성기 표지) ---- */
  function toDateTimeLocalValue(str){
    if(!str) return '';
    return toLocalInputValue(str);
  }
  /* ---- 이전 전 index.html 7207~7247줄(#TASK-ES-486 생성기 표지) ---- */
  async function pushCalendarEvent(token, label, date, existingEventId){
    var eventUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events' + (existingEventId ? '/'+existingEventId : '');
    var payload;
    if(date && date.indexOf('T') !== -1){
      var startDate = new Date(date);
      var endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      payload = {
        summary: label,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() }
      };
    } else {
      payload = {
        summary: label,
        start: { date: date },
        end: { date: L.nextDayISO(date) }
      };
    }
    try{
      var res = await fetch(eventUrl, {
        method: existingEventId ? 'PATCH' : 'POST',
        headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token },
        body: JSON.stringify(payload)
      });
      if(res.status === 404 || res.status === 410){
        // 기존 이벤트가 구글 캘린더에서 삭제됨 -> 신규 POST로 자가치유 재시도
        var postUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
        var res2 = await fetch(postUrl, {
          method: 'POST',
          headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token },
          body: JSON.stringify(payload)
        });
        if(!res2.ok) return null;
        var ev2 = await res2.json();
        return ev2.id;
      }
      if(!res.ok) return null;
      var ev = await res.json();
      return ev.id;
    } catch(e){ return null; }
  }
  /* ---- 이전 전 index.html 7248~7299줄(#TASK-ES-486 생성기 표지) ---- */
  async function quickSyncToCalendar(kind, goalId, msId, taskId, schedId){
    var schedTarget = schedId || ((kind==='custom') ? goalId : null);
    if(kind === 'custom' && schedTarget){
      var csList = (L.state.profile && L.state.profile.settings && L.state.profile.settings.customSchedules) || [];
      var cs = csList.find(function(c){ return String(c.id) === String(schedTarget); });
      if(!cs){ L.toast('일정을 찾을 수 없어요'); return; }
      var csDate = cs.date;
      if(!csDate){ L.toast('먼저 일시를 설정해주세요'); return; }
      var csLabel = cs.title + (cs.note ? ' (' + cs.note + ')' : '');
      if(!L.state.profile.settings.gcalSync) L.state.profile.settings.gcalSync = { goals:{}, ms:{}, tasks:{}, imported:{}, custom:{} };
      var sync = L.state.profile.settings.gcalSync;
      sync.custom = sync.custom || {};
      var existing = sync.custom[cs.id];
      var token;
      try{ token = await L.getGoogleAccessToken(); } catch(e){ L.toast('구글 인증에 실패했어요'); return; }
      L.toast('캘린더에 반영하는 중…');
      var evId = await pushCalendarEvent(token, csLabel, csDate, existing);
      if(!evId){ L.toast('캘린더 반영에 실패했어요'); return; }
      sync.custom[cs.id] = evId;
      await L.saveProfile();
      L.toast('"'+cs.title+'" 일정을 구글 캘린더에 반영했어요 📅');
      if(L.state.activeTab==='calendar') L.renderCalendarScreen();
      return;
    }
    var goal = L.state.profile.goals.find(function(g){ return g.id===goalId; });
    if(!goal) return;
    var ms = (kind==='ms'||kind==='task') ? (goal.milestones||[]).find(function(m){ return m.id===msId; }) : null;
    var task = (kind==='task' && ms) ? (ms.tasks||[]).find(function(t){ return t.id===taskId; }) : null;
    var date = kind==='goal' ? goal.dueDate : (kind==='ms' ? (ms && ms.dueDate) : (task && task.dueDate));
    if(!date){
      L.toast('먼저 일정을 설정해주세요 🗓️');
      if(typeof L.openScheduleSetupModal === 'function'){
        L.openScheduleSetupModal(kind, goalId, msId, taskId);
      }
      return;
    }
    var label = kind==='goal' ? (''+goal.title) : (kind==='ms' ? ('· '+ms.title+' ('+goal.title+')') : ('- '+task.title+' ('+ms.title+')'));
    if(!L.state.profile.settings.gcalSync) L.state.profile.settings.gcalSync = { goals:{}, ms:{}, tasks:{}, imported:{}, custom:{} };
    var sync = L.state.profile.settings.gcalSync;
    var existing = kind==='goal' ? (sync.goals&&sync.goals[goal.id]) : (kind==='ms' ? (sync.ms&&sync.ms[ms.id]) : (sync.tasks&&sync.tasks[task.id]));
    var token;
    try{ token = await L.getGoogleAccessToken(); } catch(e){ L.toast('구글 인증에 실패했어요'); return; }
    L.toast('캘린더에 반영하는 중…');
    var evId = await pushCalendarEvent(token, label, date, existing);
    if(!evId){ L.toast('캘린더 반영에 실패했어요'); return; }
    if(kind==='goal') { sync.goals = sync.goals || {}; sync.goals[goal.id] = evId; }
    else if(kind==='ms') { sync.ms = sync.ms || {}; sync.ms[ms.id] = evId; }
    else { sync.tasks = sync.tasks || {}; sync.tasks[task.id] = evId; }
    await L.saveProfile();
    L.toast('"'+(kind==='goal'?goal.title:(kind==='ms'?ms.title:task.title))+'" 일정을 캘린더에 반영했어요');
    if(L.state.activeTab==='calendar') L.renderCalendarScreen();
  }
  /* ---- 이전 전 index.html 7300~7452줄(#TASK-ES-486 생성기 표지) ---- */
  function calendarItemsByDate(){
    var map = {};
    function push(dateStr, item){
      if(!dateStr) return;
      var dayKey = dateStr.slice(0, 10);
      (map[dayKey] = map[dayKey] || []).push(item);
    }
    L.state.profile.goals.filter(function(g){ return !g.archivedAt; }).forEach(function(g){
      if(g.dueDate) push(g.dueDate, { date:g.dueDate, title:g.title, kind:'goal', goalId:g.id, msId:null, done:false, goalTitle:g.title, attachments:g.attachments||[], notifyEnabled:!!g.notifyEnabled, notifyMinutes:(typeof g.notifyMinutes==='number'?g.notifyMinutes:10) });
      (g.milestones||[]).forEach(function(m){
        if(m.dueDate) push(m.dueDate, { date:m.dueDate, title:m.title, kind:'ms', goalId:g.id, msId:m.id, done:m.status==='done', goalTitle:g.title, attachments:m.attachments||[], notifyEnabled:!!m.notifyEnabled, notifyMinutes:(typeof m.notifyMinutes==='number'?m.notifyMinutes:10) });
        (m.tasks||[]).forEach(function(t){
          if(t.dueDate) push(t.dueDate, { date:t.dueDate, title:t.title, kind:'task', goalId:g.id, msId:m.id, taskId:t.id, done:!!t.done, goalTitle:m.title, attachments:t.attachments||[], notifyEnabled:!!t.notifyEnabled, notifyMinutes:(typeof t.notifyMinutes==='number'?t.notifyMinutes:10) });
        });
      });
    });
    (L.state.profile.settings.customSchedules || []).forEach(function(cs){
      var gTitle = cs.note || '일반 일정';
      var effGoalId = cs.linkedGoalId || (cs.linkedLevel === 'goal' ? cs.linkedId : null);
      var effMsId = cs.linkedMsId || (cs.linkedLevel === 'ms' ? cs.linkedId : null);
      var effTaskId = cs.linkedTaskId || (cs.linkedLevel === 'task' ? cs.linkedId : null);
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
      if(cs.linkedGoalTitle) gTitle = cs.linkedGoalTitle;
      else if(effGoalId){
        var linkedG = (L.state.profile.goals || []).find(function(g){ return String(g.id) === String(effGoalId); });
        if(linkedG) gTitle = linkedG.title;
      }
      var schedDate = cs.date || cs.dueDate || cs.startDate;
      if(schedDate) push(schedDate, {
        date:schedDate,
        title:cs.title,
        kind:'custom',
        schedId:cs.id,
        done:!!cs.done,
        notifyEnabled:!!cs.notifyEnabled,
        notifyMinutes:(typeof cs.notifyMinutes==='number'?cs.notifyMinutes:10),
        goalTitle:gTitle,
        attachments:cs.attachments||[],
        recordId:cs.recordId||null,
        linkUrl:cs.linkUrl||null,
        isTemplateRecord:!!cs.isTemplateRecord,
        templateTitle:cs.templateTitle||null,
        linkedGoalId:effGoalId || null,
        linkedGoalTitle:cs.linkedGoalTitle || (gTitle !== '일반 일정' ? gTitle : null),
        linkedMsId:effMsId || null,
        linkedTaskId:effTaskId || null,
        linkedId:cs.linkedId || null,
        linkedLevel:cs.linkedLevel || null,
        goalId:effGoalId || null,
        msId:effMsId || null,
        taskId:effTaskId || null
      });
    });
    // 🗓️ 구글 캘린더 상호 연동 일정 (배지 없이 일반 일정과 동일하게 달력에 통합 표시)
    // [#TASK-ES-345 CAL-02] 메모리 캐시가 다른 계정 것이면 버리고, 로컬 캐시는 현재 uid 키에서만 읽는다.
    try { L.ensureGcalOwner(); } catch(ownErr){}
    var gcalEvs = L.state.gcalEventsCache;
    if(!gcalEvs || !gcalEvs.length){
      try{
        var localGcal = JSON.parse(localStorage.getItem(L.gcalEventsKey()) || '[]');
        if(localGcal && localGcal.length){
          gcalEvs = L.state.gcalEventsCache = localGcal;
        }
      }catch(e){ gcalEvs = []; }
    }
    if(Array.isArray(gcalEvs)){
      var gcalDoneMap = (L.state.profile && L.state.profile.settings && L.state.profile.settings.gcalDoneEvents) || {};
      gcalEvs.forEach(function(ge){
        var d = ge.date || ge.dayKey;
        if(d){
          var isGeDone = !!ge.done;
          if(!isGeDone && gcalDoneMap[ge.id]) isGeDone = true;
          push(d, {
            date: d,
            title: ge.title,
            kind: 'gcal',
            schedId: ge.id,
            gcalId: ge.id,
            done: isGeDone,
            notifyEnabled: !!ge.notifyEnabled,
            notifyMinutes: (typeof ge.notifyMinutes === 'number' ? ge.notifyMinutes : 10),
            goalTitle: ge.goalTitle || '구글 캘린더',
            htmlLink: ge.htmlLink || 'https://calendar.google.com'
          });
        }
      });
    }

    // 👥 참여 중인 팀 목표 D-Day 및 마일스톤 일정 자동 연동 (#TASK-CALENDAR-TEAM-GOAL-INTEGRATION)
    try {
      var joinedTeams = (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []).filter(function(g){
        return typeof L.groupState === 'function' && L.groupState(g.id).joined;
      });
      joinedTeams.forEach(function(g){
        (g.teamGoals || []).forEach(function(tg){
          var d = tg.dueDate;
          var tgDone = (tg.milestones || []).length > 0 && (tg.milestones || []).every(function(m){ return m.status === 'done'; });
          if(L.state.profile && L.state.profile.settings && L.state.profile.settings.teamGoalDoneEvents && L.state.profile.settings.teamGoalDoneEvents[tg.id] !== undefined){
            tgDone = !!L.state.profile.settings.teamGoalDoneEvents[tg.id];
          }
          if(d){
            push(d, {
              schedId: tg.id,
              id: tg.id,
              date: d,
              title: '👑 [' + g.name + '] ' + (tg.title || '목표') + ' D-Day',
              kind: 'team_goal',
              teamId: g.id,
              teamName: g.name,
              goalId: tg.id,
              goalTitle: '👥 ' + g.name,
              done: tgDone
            });
          }
          (tg.milestones || []).forEach(function(m){
            if(m.dueDate){
              var mDone = m.status === 'done';
              if(L.state.profile && L.state.profile.settings && L.state.profile.settings.teamGoalDoneEvents && L.state.profile.settings.teamGoalDoneEvents[m.id] !== undefined){
                mDone = !!L.state.profile.settings.teamGoalDoneEvents[m.id];
              }
              push(m.dueDate, {
                schedId: m.id,
                id: m.id,
                date: m.dueDate,
                title: '👥 [' + g.name + '] ' + m.title,
                kind: 'team_goal',
                teamId: g.id,
                teamName: g.name,
                goalId: tg.id,
                msId: m.id,
                goalTitle: '👥 ' + g.name,
                done: mDone
              });
            }
          });
        });
      });
    } catch(tgCalErr){ console.warn('team goal calendar mapping error', tgCalErr); }

    return map;
  }
  /* ---- 이전 전 index.html 7453~7530줄(#TASK-ES-486 생성기 표지) ---- */
  function calCellHtml(d, itemsByDate, dim){
    var iso = isoDate(d);
    var evs = itemsByDate[iso] || [];
    var cls = 'cal-cell'+(dim?' other-month':'')+(iso===isoDate(new Date())?' today':'')+(iso===L.state.calSelectedDate?' selected':'');
    var shown = evs.slice(0,2);
    var more = evs.length - shown.length;
    var dayBg = (L.state.profile && L.state.profile.calendarDayBackgrounds && L.state.profile.calendarDayBackgrounds[iso]) || '';
    var bgHtml = '';
    var photoUrl = '';

    // 사진형 일기(Photo Diary): 사용자가 등록한 체크인/기록의 사진 자동 추출 (#TASK-ES-197)
    if(!dayBg && L.state.profile && L.state.profile.records){
      for(var ri=0; ri<L.state.profile.records.length; ri++){
        var rec = L.state.profile.records[ri];
        var rDate = (rec.startAt || rec.createdAt || rec.date || '').slice(0, 10);
        if(rDate === iso){
          if(rec.photo){
            photoUrl = rec.photo;
            break;
          }
          if(rec.attachments && rec.attachments.length){
            var imgAtt = rec.attachments.find(function(a){
              return a.type === 'image' || (a.url && (a.url.startsWith('data:image') || a.url.match(/\.(png|jpe?g|webp|gif)/i)));
            });
            if(imgAtt){
              photoUrl = imgAtt.url;
              break;
            }
          }
        }
      }
    }
    if(!dayBg && !photoUrl && evs && evs.length){
      for(var ei=0; ei<evs.length; ei++){
        var ev = evs[ei];
        if(ev.attachments && ev.attachments.length){
          var evImg = ev.attachments.find(function(a){
            return a.type === 'image' || (a.url && (a.url.startsWith('data:image') || a.url.match(/\.(png|jpe?g|webp|gif)/i)));
          });
          if(evImg){
            photoUrl = evImg.url;
            break;
          }
        }
      }
    }

    var hasPhoto = !!(dayBg || photoUrl);
    if(hasPhoto) cls += ' has-photo';

    if(Array.isArray(dayBg) && dayBg.length > 1){
      bgHtml = '<div class="cal-cell-bg" style="position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;overflow:hidden;border-radius:6px;">' +
        '<div style="flex:1;background-image:url(\''+L.escapeHtml(dayBg[0])+'\');background-size:cover;background-position:center;opacity:0.5;"></div>' +
        '<div style="flex:1;background-image:url(\''+L.escapeHtml(dayBg[1])+'\');background-size:cover;background-position:center;opacity:0.5;border-top:1px solid rgba(255,255,255,0.2);"></div>' +
      '</div>';
    } else if(dayBg){
      var singleBg = Array.isArray(dayBg) ? dayBg[0] : dayBg;
      bgHtml = '<div class="cal-cell-bg" style="background-image:url(\''+L.escapeHtml(singleBg)+'\');"></div>';
    } else if(photoUrl){
      bgHtml = '<div class="cal-cell-bg cal-photo-diary-bg" style="background-image:url(\''+L.escapeHtml(photoUrl)+'\');"></div>';
    }

    var photoBadge = hasPhoto ? '<span class="cal-photo-badge" title="사진형 일기 포함">📸</span>' : '';
    var photoTag = (shown.length === 0 && hasPhoto) ? '<div class="cal-photo-tag">📷 사진 일기</div>' : '';

    return '<div class="'+cls+'" data-caldate="'+iso+'">' +
      bgHtml +
      '<div class="cal-daynum">'+d.getDate()+'</div>' +
      photoBadge +
      shown.map(function(e){
        var pillKind = e.isTemplateRecord ? ' tpl' : (e.kind==='team_goal'?' team':(e.kind==='ms'?' ms':(e.kind==='custom'?' custom':'')));
        var goalPrefix = (e.linkedGoalId || e.linkedGoalTitle) ? '🎯 ' : '';
        return '<div class="cal-pill'+pillKind+(e.done?' done':'')+'">'+goalPrefix+L.escapeHtml(e.title)+'</div>';
      }).join('') +
      (more>0 ? '<div class="cal-more">+'+more+'</div>' : '') +
      photoTag +
    '</div>';
  }

  K.isoDate = isoDate;
  K.toLocalInputValue = toLocalInputValue;
  K.toDateTimeLocalValue = toDateTimeLocalValue;
  K.pushCalendarEvent = pushCalendarEvent;
  K.quickSyncToCalendar = quickSyncToCalendar;
  K.calendarItemsByDate = calendarItemsByDate;
  K.calCellHtml = calCellHtml;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
