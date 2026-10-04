/**
 * OurGoal Calendar Screen Renderer (일정 탭 화면 렌더)
 *
 * #TASK-ES-360 (일정 탭 세포 이전): index.html 인라인 IIFE 에 있던 일정 탭 렌더 코드(이전 전 10314~10314, 10316~10316, 10660~10668, 11914~12156줄)를 동작 그대로 옮겼다.
 *   WEEKDAYS_KR(요일 머리글) · calWeekStart(주 시작일) · calShift(월·주·일 이동) · renderCalendarScreen(일정 화면 전체 렌더)
 * 날짜 칸 calCellHtml 은 index.html 에 남아 있다(동결 시험지 verify-integrity-gate #TASK-ES-197 이 index.html 에서 그 글자를 찾는다) — L.calCellHtml 로 부른다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 일정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalCalendarKit)의 renderCalendarScreen·calShift 를 같은 이름으로 가져와 부른다 — 호출하는 쪽 수십 곳은 그대로다.
 * window.renderCalendarScreen·window.calShift 노출 줄은 이전 전과 같은 자리(index.html)에 그대로 있다. 선례: 기록 탭 #TASK-ES-358.
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 일정 키트: 일정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  var WEEKDAYS_KR = ['일','월','화','수','목','금','토'];

  function calWeekStart(d){ var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()-x.getDay()); return x; }

  function calShift(dir){
    var view = L.state.calView || 'month';
    var d = new Date(L.state.calDate+'T00:00:00');
    if(view==='month') d.setMonth(d.getMonth()+dir, 1);
    else if(view==='week') d.setDate(d.getDate()+dir*7);
    else d.setDate(d.getDate()+dir);
    L.state.calDate = L.isoDate(d);
    renderCalendarScreen();
  }

  function renderCalendarScreen(){
    var view = L.state.calView || 'month';
    var refDate = new Date(L.state.calDate+'T00:00:00');
    var itemsByDate = L.calendarItemsByDate();
    var periodLabel, gridHtml;
    /* 구글 캘린더 연동 안내 배너 -> 헤더 미니 구글 배지화 (#TASK-ES-157) */
    var gBanner = document.getElementById('calGoogleBanner');
    if(gBanner){
      gBanner.style.display = 'none';
      gBanner.innerHTML = '';
    }
    var diaryGuide = document.getElementById('calSubGuideBanner') || document.querySelector('.cal-sub-guide');
    if(diaryGuide){
      diaryGuide.style.display = 'none';
      var closeBtn = diaryGuide.querySelector('#btnHideCalDiaryGuide');
      if(closeBtn && !closeBtn._bound){
        closeBtn._bound = true;
        closeBtn.onclick = function(e){
          e.stopPropagation();
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(10);
          diaryGuide.style.display = 'none';
          try { localStorage.setItem('ourgoal_hide_diary_guide', 'true'); } catch(err){}
        };
      }
    }
    // [#TASK-ES-345 CAL-02] 메모리에 남은 다른 계정 토큰으로 일정을 불러오지 않게 주인부터 확인한다.
    try { L.ensureGcalOwner(); } catch(ownErr){}
    var isConn = L.isGoogleCalendarConnected();
    var gEmail = (L.state.profile.settings && L.state.profile.settings.googleCalendarEmail) || '';
    var gTokState = isConn ? L.gcalTokenStatus() : 'missing';
    if(isConn){
      if(L.state.googleToken && L.state.googleToken.expiresAt > Date.now()){
        if(!L.state._lastGcalFetch || (Date.now() - L.state._lastGcalFetch > 60000)){
          L.state._lastGcalFetch = Date.now();
          L.fetchGoogleCalendarEvents(L.state.googleToken.accessToken).then(function(evs){
            if(evs && evs.length && L.state.activeTab==='calendar') renderCalendarScreen();
          }).catch(function(){});
        }
      } else {
        if(!L.state._lastGcalFetch || (Date.now() - L.state._lastGcalFetch > 60000)){
          L.state._lastGcalFetch = Date.now();
          L.getGoogleAccessToken(false).then(function(tok){
            if(tok) return L.fetchGoogleCalendarEvents(tok);
          }).then(function(evs){
            if(evs && evs.length && L.state.activeTab==='calendar') renderCalendarScreen();
          }).catch(function(){});
        }
      }
    }
    var gBadgeSlot = document.getElementById('calGcalMiniBadgeSlot');
    if(gBadgeSlot){
      var gIconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" style="flex:0 0 13px;display:inline-block;vertical-align:middle;">' +
        '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
        '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
        '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>' +
        '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>' +
      '</svg>';
      if(isConn && gTokState !== 'valid'){
        // [#TASK-ES-345 CAL-02] 토큰 만료·부재: 1줄 안내(title) + '다시 연결' 1탭 — 기존 연결 함수를 그대로 쓴다.
        gBadgeSlot.innerHTML =
          '<button class="dday-pill" id="calGcalMiniBadge" type="button" data-gcal-state="' + gTokState + '" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--rule);padding:2px 8px;min-height:22px;border-radius:20px;display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:600;" title="' + (gTokState === 'expired' ? '구글 캘린더 연결이 끊겼어요 · 눌러서 다시 연결' : '이 계정의 구글 캘린더 연결 정보가 없어요 · 눌러서 다시 연결') + '">' +
            gIconSvg +
            '<span style="color:var(--amber);">다시 연결</span>' +
          '</button>';
        var rBtn = gBadgeSlot.querySelector('#calGcalMiniBadge');
        if(rBtn){
          rBtn.onclick = function(){
            L.toast('구글 캘린더를 다시 연결해요');
            L.openGoogleCalendarConnectModal();
          };
        }
      } else if(isConn){
        gBadgeSlot.innerHTML =
          '<button class="dday-pill" id="calGcalMiniBadge" type="button" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--rule);padding:2px 8px;min-height:22px;border-radius:20px;display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:600;" title="구글 캘린더 연동됨' + (gEmail ? ' ('+L.escapeHtml(gEmail)+')' : '') + ' · 클릭하여 지금 동기화">' +
            gIconSvg +
            '<span style="color:var(--ink);">연동됨</span>' +
          '</button>';
        var bBtn = gBadgeSlot.querySelector('#calGcalMiniBadge');
        if(bBtn){
          bBtn.onclick = function(){
            L.toast('구글 캘린더와 동기화 중…');
            L.syncAllToGoogleCalendar(true);
          };
        }
      } else {
        gBadgeSlot.innerHTML =
          '<button class="dday-pill" id="calGcalMiniBadge" type="button" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--rule);padding:2px 8px;min-height:22px;border-radius:20px;display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:600;" title="구글 캘린더 연동하기">' +
            '<span style="opacity:.6;display:inline-flex;align-items:center;">' + gIconSvg + '</span>' +
            '<span style="color:var(--ink-soft);">+ 연동</span>' +
          '</button>';
        var cBtn = gBadgeSlot.querySelector('#calGcalMiniBadge');
        if(cBtn){
          cBtn.onclick = L.openGoogleCalendarConnectModal;
        }
      }
    }
    if(view==='month'){
      var y = refDate.getFullYear(), mo = refDate.getMonth();
      periodLabel = y+'년 '+(mo+1)+'월';
      var startCell = calWeekStart(new Date(y, mo, 1));
      var cells = [];
      for(var i=0;i<42;i++) cells.push(new Date(startCell.getFullYear(), startCell.getMonth(), startCell.getDate()+i));
      gridHtml = '<div class="cal-weekdays">'+WEEKDAYS_KR.map(function(w){ return '<div>'+w+'</div>'; }).join('')+'</div>' +
        '<div class="cal-grid">'+cells.map(function(cd){ return L.calCellHtml(cd, itemsByDate, cd.getMonth()!==mo); }).join('')+'</div>';
    } else if(view==='week'){
      var wkStart = calWeekStart(refDate);
      var wcells = [];
      for(var j=0;j<7;j++) wcells.push(new Date(wkStart.getFullYear(), wkStart.getMonth(), wkStart.getDate()+j));
      periodLabel = L.isoDate(wcells[0])+' ~ '+L.isoDate(wcells[6]);
      gridHtml = '<div class="cal-weekdays">'+WEEKDAYS_KR.map(function(w){ return '<div>'+w+'</div>'; }).join('')+'</div>' +
        '<div class="cal-grid cal-grid-week">'+wcells.map(function(cd){ return L.calCellHtml(cd, itemsByDate, false); }).join('')+'</div>';
    } else {
      periodLabel = L.isoDate(refDate)+' ('+WEEKDAYS_KR[refDate.getDay()]+')';
      L.state.calSelectedDate = L.isoDate(refDate);
      var dayEvs = itemsByDate[L.state.calSelectedDate] || [];
      var hours = [];
      for(var h = 6; h <= 23; h++){ hours.push(h); }
      var timelineSlots = hours.map(function(h){
        var hStr = L.pad(h);
        var matching = dayEvs.filter(function(e){
          if(e.date && e.date.indexOf('T') !== -1){
            var tPart = e.date.split('T')[1];
            return tPart && tPart.startsWith(hStr);
          }
          return false;
        });
        var matchingHtml = matching.map(function(e){
          var isDone = !!e.done;
          var goalBadgeHtml = (e.linkedGoalTitle || (e.goalTitle && e.goalTitle !== '일반 일정' && e.goalTitle !== '구글 캘린더')) ?
            '<span class="sched-goal-badge" style="font-size:.65rem;padding:1px 5px;">🎯 ' + L.escapeHtml(e.linkedGoalTitle || e.goalTitle) + '</span>' : '';
          var checkBtn = '<div class="sched-check' + (isDone ? ' done' : '') + '" data-togglesched="' + e.kind + ':' + (e.schedId || e.goalId || e.gcalId || '') + ':' + (e.msId || '') + ':' + (e.taskId || '') + '" style="cursor:pointer;width:18px;height:18px;font-size:.65rem;" title="' + (isDone ? '미완료로 변경' : '완료로 변경') + '">' + (isDone ? '✓' : '') + '</div>';
          return '<div class="timetable-chip' + (isDone ? ' done-chip' : '') + '" style="background:var(--card);border:1px solid ' + (isDone ? '#10b981' : 'var(--brand)') + ';border-left:3px solid ' + (isDone ? '#10b981' : 'var(--brand)') + ';border-radius:6px;padding:4px 8px;margin-bottom:3px;font-size:.8125rem;display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
            '<div style="display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;min-width:0;">' +
              checkBtn +
              '<span class="sched-title' + (isDone ? ' done-text' : '') + '" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--ink);">' +
                L.escapeHtml(e.title) +
              '</span>' +
              goalBadgeHtml +
            '</div>' +
            '<span class="faint" style="font-size:.6875rem;flex-shrink:0;">' + (e.date.split('T')[1].slice(0,5)) + '</span>' +
          '</div>';
        }).join('');
        return '<div class="timetable-slot" data-timeslot="'+hStr+':00" style="display:flex;border-bottom:1px solid var(--border-subtle, rgba(0,0,0,.06));min-height:38px;cursor:pointer;" title="클릭하여 '+hStr+':00 일정 추가">' +
          '<div class="slot-time" style="width:48px;padding:4px 6px;font-size:.75rem;font-weight:700;color:var(--ink-faint);border-right:1px solid var(--border-subtle, rgba(0,0,0,.06));display:flex;align-items:flex-start;justify-content:flex-end;">'+hStr+':00</div>' +
          '<div class="slot-content" style="flex:1;padding:2px 8px;display:flex;flex-direction:column;justify-content:center;">' +
            (matchingHtml || '<div style="color:var(--ink-faint);font-size:.71875rem;opacity:0.4;">+ 일정 추가</div>') +
          '</div>' +
        '</div>';
      }).join('');
      var ttDayBg = (L.state.profile && L.state.profile.calendarDayBackgrounds && L.state.profile.calendarDayBackgrounds[L.state.calSelectedDate]) || '';
      var ttDayBgHtml = ttDayBg ? '<div class="timetable-day-bg" style="background-image:url(\''+L.escapeHtml(ttDayBg)+'\');"></div>' : '';
      gridHtml = '<div class="card timetable-card" style="position:relative;overflow:hidden;padding:10px 12px;margin-bottom:14px;border-radius:12px;background:var(--card);border:1px solid var(--border);">' +
        ttDayBgHtml +
        '<div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">⏰ 시간표 타임라인</span>' +
            '<button class="btn btn-secondary btn-sm cal-day-bg-btn" id="btnPickDayBgTimetable" type="button" style="font-size:.75rem;padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">🖼️ 이날의 배경사진 고르기' + (ttDayBg ? ' (설정됨)' : '') + '</button>' +
          '</div>' +
          '<span class="faint" style="font-size:.75rem;">슬롯 터치 시 일정 추가</span>' +
        '</div>' +
        '<div class="timetable-grid" style="position:relative;z-index:1;max-height:360px;overflow-y:auto;">' +
          timelineSlots +
        '</div>' +
      '</div>';
    }
    document.getElementById('calPeriodLabel').textContent = periodLabel;
    document.getElementById('calGrid').innerHTML = gridHtml;
    document.querySelectorAll('#calGrid [data-togglesched]').forEach(function(chk){
      chk.onclick = async function(ev){
        ev.stopPropagation();
        var parts = chk.dataset.togglesched.split(':');
        var kind = parts[0];
        var schedOrGoalId = parts[1];
        var msId = parts[2] || null;
        var taskId = parts[3] || null;
        await L.toggleScheduleDone((kind==='custom'||kind==='gcal')?schedOrGoalId:null, kind, (kind!=='custom'&&kind!=='gcal')?schedOrGoalId:null, msId, taskId);
      };
    });
    var ttBgBtn = document.getElementById('btnPickDayBgTimetable');
    if(ttBgBtn){
      ttBgBtn.onclick = function(){
        L.openCalendarDayBgPickerModal(L.state.calSelectedDate);
      };
    }
    document.querySelectorAll('#calGrid .timetable-slot').forEach(function(slot){
      slot.onclick = function(){
        var tSlot = slot.dataset.timeslot || '09:00';
        L.openCalendarManualEditModal(L.state.calSelectedDate, null, 'custom', { title: '', date: L.state.calSelectedDate + 'T' + tSlot, note: '', done: false, attachments: [] });
      };
    });
    document.querySelectorAll('#calViewToggle [data-calview]').forEach(function(opt){
      opt.classList.toggle('active', opt.dataset.calview===view);
      opt.onclick = function(){
        L.state.calView = opt.dataset.calview;
        if(L.state.calView!=='month' && L.state.calSelectedDate) L.state.calDate = L.state.calSelectedDate;
        renderCalendarScreen();
      };
    });
    document.getElementById('calPrevBtn').onclick = function(){ calShift(-1); };
    document.getElementById('calNextBtn').onclick = function(){ calShift(1); };
    document.getElementById('calTodayBtn').onclick = function(){
      var t = L.isoDate(new Date());
      L.state.calDate = t; L.state.calSelectedDate = t;
      renderCalendarScreen();
    };
    var lockScreenBtn = document.getElementById('calLockScreenBtn');
    if(lockScreenBtn){
      lockScreenBtn.onclick = function(){
        L.openLockScreenHubModal();
      };
    }
    var calSend = document.getElementById('calAgentSendBtn');
    var calInp = document.getElementById('calAgentInput');
    if(calSend && calInp){
      calSend.onclick = async function(){
        var txt = calInp.value.trim();
        if(!txt) return;
        calInp.value = '';
        await K.executeCalAgentNaturalSchedule(txt);
      };
      calInp.onkeydown = async function(e){
        if(e.key === 'Enter'){
          var txt = calInp.value.trim();
          if(!txt) return;
          calInp.value = '';
          await K.executeCalAgentNaturalSchedule(txt);
        }
      };
    }
    document.querySelectorAll('#calGrid [data-caldate]').forEach(function(cell){
      cell.addEventListener('click', function(){
        var clickedDate = cell.dataset.caldate;
        L.state.calSelectedDate = clickedDate;
        document.querySelectorAll('#calGrid .cal-cell').forEach(function(c){ c.classList.toggle('selected', c.dataset.caldate===L.state.calSelectedDate); });
        K.renderCalDayDetail(itemsByDate);
        L.openCalendarDayEditHubModal(clickedDate);
      });
    });
    K.renderCalDayDetail(itemsByDate);
    if(typeof window.OurgoalSanctuaryV3 !== 'undefined' && window.OurgoalSanctuaryV3.render){
      window.OurgoalSanctuaryV3.render('calendar');
    }
  }

  K.calWeekStart = calWeekStart;
  K.calShift = calShift;
  K.renderCalendarScreen = renderCalendarScreen;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
