/**
 * OurGoal Lock Screen Live Card (일정 탭 — 폰 잠금화면 실시간 정보 카드)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   buildLockScreenCardPayload · syncLockScreenLiveCard · closeLockScreenLiveCard(이전 전 11390~11635줄, 구획 주석 포함 · 구획 「[#TASK-ES-182] 폰 잠금화면 실시간 정보 연동 라이브 서비스 (Live Sync)」)
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
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  /* =========================================================================
     [#TASK-ES-182] 폰 잠금화면 실시간 정보 연동 라이브 서비스 (Live Sync)
  ========================================================================= */
  function buildLockScreenCardPayload(options){
    var opts = Object.assign({
      showMonthGrid: true,
      showGoalRate: true,
      showGoals: true,
      showSchedules: true,
      showDday: true,
      showStreak: true
    }, options || {});
    if(opts.showGoalRate === undefined && opts.showGoals !== undefined){
      opts.showGoalRate = opts.showGoals;
    }
    if(opts.showGoals === undefined && opts.showGoalRate !== undefined){
      opts.showGoals = opts.showGoalRate;
    }

    var now = new Date();
    var curYear = now.getFullYear();
    var curMonth = now.getMonth();
    var todayDate = now.getDate();
    var todayKey = (typeof L.dateKey === 'function') ? L.dateKey(now) : now.toISOString().slice(0, 10);
    var streak = (typeof L.computeStreakDays === 'function') ? L.computeStreakDays() : 0;

    // 1. 오늘 일정 및 태스크 집계 (캘린더 맵)
    var calMap = {};
    var todayItems = [];
    try {
      if(typeof L.calendarItemsByDate === 'function'){
        calMap = L.calendarItemsByDate() || {};
        todayItems = calMap[todayKey] || [];
      }
    } catch(e){}

    var totalScheds = todayItems.length;
    var doneScheds = todayItems.filter(function(it){ return !!it.done; }).length;

    // 미완료 일정 추출 (시간순 정렬 후 최대 3개)
    var uncompleted = todayItems.filter(function(it){ return !it.done; });
    uncompleted.sort(function(a, b){
      var ta = (a.date && a.date.length > 10) ? a.date.slice(11, 16) : '99:99';
      var tb = (b.date && b.date.length > 10) ? b.date.slice(11, 16) : '99:99';
      return ta.localeCompare(tb);
    });
    var top3Items = uncompleted.slice(0, 3);
    var schedules3 = top3Items.map(function(item){
      var timePart = '';
      if(item.date && item.date.length > 10){
        timePart = '[' + item.date.slice(11, 16) + '] ';
      }
      return '🕒 ' + timePart + (item.title || '일정');
    });
    var nextText = schedules3.length ? schedules3[0] : '';

    // 2. 오늘의 목표 및 달성률
    var activeGoals = (L.state.profile && L.state.profile.goals) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; }) : [];
    var topGoal = activeGoals[0] || null;

    // 핵심 D-Day
    var ddayText = '';
    if(opts.showDday && activeGoals.length){
      var withDue = activeGoals.filter(function(g){ return g.dueDate; }).sort(function(a,b){ return new Date(a.dueDate) - new Date(b.dueDate); });
      if(withDue.length && typeof L.dDay === 'function'){
        var dd = L.dDay(withDue[0].dueDate);
        if(dd){
          var ddStr = (typeof dd === 'string') ? dd : (dd === 0 ? 'D-Day' : (dd > 0 ? 'D-' + dd : 'D+' + Math.abs(dd)));
          ddayText = withDue[0].title + ' ' + ddStr;
        }
      }
    }

    // 오늘 체크인 수
    var recs = (L.state.profile && L.state.profile.records) ? L.state.profile.records : [];
    var todayRecs = recs.filter(function(r){
      var d = r && (r.startAt || r.start_at || r.createdAt || r.created_at);
      return d && (typeof L.dateKey === 'function' ? L.dateKey(d) : String(d).slice(0,10)) === todayKey;
    });

    // 달성률 계산
    var ratePct = 0;
    if(totalScheds > 0){
      ratePct = Math.round((doneScheds / totalScheds) * 100);
    } else if(todayRecs.length > 0){
      ratePct = 100;
    } else if(topGoal && typeof L.goalAchievement === 'function'){
      ratePct = L.goalAchievement(topGoal);
    }

    // 3. 폰 화면비용 월간 달력 그리드 데이터 생성
    var firstDayOfWeek = new Date(curYear, curMonth, 1).getDay(); // 0(일) ~ 6(토)
    var lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDate();
    var monthDates = [];
    for(var p = 0; p < firstDayOfWeek; p++){
      monthDates.push({ date: 0, isCurrent: false, hasSchedule: false, isToday: false });
    }
    for(var d = 1; d <= lastDayOfMonth; d++){
      var ymd = curYear + '-' + String(curMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var hasSched = !!(calMap[ymd] && calMap[ymd].length > 0);
      monthDates.push({
        date: d,
        isCurrent: true,
        hasSchedule: hasSched,
        isToday: (d === todayDate)
      });
    }

    // 4. 알림 타이틀 & 바디 조립
    var titleParts = ['[아워골 라이브]'];
    if(opts.showGoalRate || opts.showGoals){
      if(totalScheds > 0){
        titleParts.push('오늘 일정 ' + doneScheds + '/' + totalScheds + ' (' + ratePct + '%)');
      } else if(todayRecs.length > 0){
        titleParts.push('오늘 체크인 완료 (' + ratePct + '%)');
      } else {
        titleParts.push('오늘 목표 달성률 ' + ratePct + '%');
      }
    }
    if(opts.showStreak && streak > 0){
      titleParts.push('🔥 ' + streak + '일 연속');
    }
    var notifTitle = titleParts.join(' ');

    var bodyParts = [];
    if(opts.showSchedules && schedules3.length){
      bodyParts.push(schedules3.join(' · '));
    }
    if(topGoal && (opts.showGoalRate || opts.showGoals)){
      bodyParts.push('🎯 ' + topGoal.title);
    }
    if(opts.showDday && ddayText){
      bodyParts.push('⏳ ' + ddayText);
    }
    if(!bodyParts.length){
      bodyParts.push('오늘도 나만의 소중한 목표를 향해 한 걸음 나아가세요! ✨');
    }
    var notifBody = bodyParts.join(' · ');

    return {
      title: notifTitle,
      body: notifBody,
      streak: streak,
      ratePct: ratePct,
      doneScheds: doneScheds,
      totalScheds: totalScheds,
      todayCheckins: todayRecs.length,
      schedules3: schedules3,
      nextSchedule: nextText,
      ddayText: ddayText,
      topGoalTitle: topGoal ? topGoal.title : '',
      curYear: curYear,
      curMonth: curMonth + 1,
      todayDate: todayDate,
      monthDates: monthDates,
      tag: 'ourgoal-lockscreen-live'
    };
  }

  async function syncLockScreenLiveCard(force){
    if(!L.state.profile) return false;
    var settings = L.state.profile.settings || {};
    var lockLive = settings.lockScreenLive || null;
    if(!lockLive){
      try {
        var saved = localStorage.getItem('ourgoal_lockscreen_live_v1');
        if(saved) lockLive = JSON.parse(saved);
      } catch(e){}
    }
    if((!lockLive || !lockLive.enabled) && !force){
      return false;
    }

    var payload = buildLockScreenCardPayload(lockLive || {});

    if(!L.state.profile.settings) L.state.profile.settings = {};
    if(!L.state.profile.settings.lockScreenLive){
      L.state.profile.settings.lockScreenLive = lockLive || { enabled: !!force, showGoals: true, showSchedules: true, showDday: true, showStreak: true };
    }
    L.state.profile.settings.lockScreenLive.lastSyncAt = (typeof L.nowISO === 'function') ? L.nowISO() : new Date().toISOString();
    try {
      localStorage.setItem('ourgoal_lockscreen_live_v1', JSON.stringify(L.state.profile.settings.lockScreenLive));
    } catch(e){}

    if(typeof Notification === 'undefined'){
      return false;
    }

    if(Notification.permission !== 'granted'){
      return false;
    }

    var notifOptions = {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag,
      silent: true,
      renotify: false,
      requireInteraction: true,
      data: {
        url: '/?action=checkin',
        source: 'lockscreen-live',
        syncedAt: L.state.profile.settings.lockScreenLive.lastSyncAt
      },
      actions: [
        { action: 'action-checkin', title: '⚡ 빠른 체크인' },
        { action: 'action-calendar', title: '📅 일정 확인' }
      ]
    };

    try {
      if('serviceWorker' in navigator && navigator.serviceWorker.ready){
        var reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise(function(resolve){ setTimeout(function(){ resolve(null); }, 1500); })
        ]);
        if(reg && reg.showNotification){
          await reg.showNotification(payload.title, notifOptions);
          return true;
        }
      }
    } catch(swErr){
      console.warn('SW showNotification fallback:', swErr);
    }

    try {
      new Notification(payload.title, notifOptions);
      return true;
    } catch(notifErr){
      console.warn('Notification API fallback error:', notifErr);
      return false;
    }
  }

  async function closeLockScreenLiveCard(){
    try {
      if('serviceWorker' in navigator && navigator.serviceWorker.ready){
        var reg = await navigator.serviceWorker.ready;
        if(reg && reg.getNotifications){
          var notifs = await reg.getNotifications({ tag: 'ourgoal-lockscreen-live' });
          (notifs || []).forEach(function(n){ n.close(); });
        }
      }
    } catch(e){}
  }

  K.buildLockScreenCardPayload = buildLockScreenCardPayload;
  K.syncLockScreenLiveCard = syncLockScreenLiveCard;
  K.closeLockScreenLiveCard = closeLockScreenLiveCard;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
