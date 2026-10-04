/**
 * OurGoal Calendar Natural-Language Schedule (일정 탭 AI 일정 비서 — 자연어 한 줄을 일정으로 등록)
 *
 * #TASK-ES-360 (일정 탭 세포 이전): index.html 인라인 IIFE 의 parseNaturalScheduleText · executeCalAgentNaturalSchedule(이전 전 11766~11873, 11875~11912줄)를 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 일정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다.
 * renderCalendarScreen(js/tabs/calendar/render.js)이 그리는 일정 비서 입력칸(#calAgentInput)의 버튼·Enter 가 K.executeCalAgentNaturalSchedule 로 부른다.
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 일정 키트: 일정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  function parseNaturalScheduleText(text){
    var raw = (text || '').trim();
    if(!raw) return null;

    // 1. 링크(URL) 추출 및 첨부 배열 구성
    var attachments = [];
    var urlMatches = raw.match(/https?:\/\/[^\s]+/g);
    if(urlMatches){
      urlMatches.forEach(function(u){
        attachments.push({ type: 'link', url: u, name: u });
      });
      raw = raw.replace(/https?:\/\/[^\s]+/g, ' ').trim();
    }

    // 2. 날짜 분석 (기준일: 오늘)
    var now = new Date();
    var targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var dateMatched = false;

    // 2-1. 상대 날짜
    if(/\b오늘\b/.test(raw)){
      dateMatched = true;
      raw = raw.replace(/\b오늘\b/, ' ');
    } else if(/\b내일\b/.test(raw)){
      targetDate.setDate(targetDate.getDate() + 1);
      dateMatched = true;
      raw = raw.replace(/\b내일\b/, ' ');
    } else if(/\b모레\b/.test(raw)){
      targetDate.setDate(targetDate.getDate() + 2);
      dateMatched = true;
      raw = raw.replace(/\b모레\b/, ' ');
    } else if(/\b글피\b/.test(raw)){
      targetDate.setDate(targetDate.getDate() + 3);
      dateMatched = true;
      raw = raw.replace(/\b글피\b/, ' ');
    }

    // 2-2. 이번 주 / 다음 주 요일
    var dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
    var weekMatch = raw.match(/(이번\s*주|다음\s*주)?\s*([월화수목금토일])(?:요일)?/);
    if(weekMatch && !dateMatched){
      var isNextWeek = weekMatch[1] && weekMatch[1].indexOf('다음') !== -1;
      var targetDay = dayMap[weekMatch[2]];
      var curDay = now.getDay();
      var diff = targetDay - curDay;
      if(isNextWeek){
        diff += 7;
      } else if(diff < 0){
        diff += 7;
      }
      targetDate.setDate(targetDate.getDate() + diff);
      dateMatched = true;
      raw = raw.replace(weekMatch[0], ' ');
    }

    // 2-3. 구체적 날짜 (YYYY년 M월 D일 or M월 D일 or M/D or YYYY-MM-DD)
    var fullDateMatch = raw.match(/(\d{4})[.\-\/년]\s*(\d{1,2})[.\-\/월]\s*(\d{1,2})일?/);
    if(fullDateMatch){
      targetDate = new Date(parseInt(fullDateMatch[1], 10), parseInt(fullDateMatch[2], 10) - 1, parseInt(fullDateMatch[3], 10));
      dateMatched = true;
      raw = raw.replace(fullDateMatch[0], ' ');
    } else {
      var monthDayMatch = raw.match(/(\d{1,2})[.\/월]\s*(\d{1,2})일?/);
      if(monthDayMatch){
        targetDate = new Date(now.getFullYear(), parseInt(monthDayMatch[1], 10) - 1, parseInt(monthDayMatch[2], 10));
        dateMatched = true;
        raw = raw.replace(monthDayMatch[0], ' ');
      }
    }

    var y = targetDate.getFullYear();
    var m = String(targetDate.getMonth() + 1).padStart(2, '0');
    var d = String(targetDate.getDate()).padStart(2, '0');
    var dateStr = y + '-' + m + '-' + d;

    // 3. 시간 분석 (오전/오후/낮/저녁/밤 N시 M분 or HH:mm)
    var timeStr = '';
    var timeMatch1 = raw.match(/(오전|오후|낮|저녁|밤|새벽)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
    var timeMatch2 = raw.match(/(\d{1,2}):(\d{2})/);

    if(timeMatch1){
      var meridiem = timeMatch1[1] || '';
      var hour = parseInt(timeMatch1[2], 10);
      var min = timeMatch1[3] ? parseInt(timeMatch1[3], 10) : 0;
      if(/오후|저녁|밤/.test(meridiem) && hour < 12) hour += 12;
      if(/오전|새벽/.test(meridiem) && hour === 12) hour = 0;
      timeStr = 'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
      raw = raw.replace(timeMatch1[0], ' ');
    } else if(timeMatch2){
      var hour = parseInt(timeMatch2[1], 10);
      var min = parseInt(timeMatch2[2], 10);
      timeStr = 'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
      raw = raw.replace(timeMatch2[0], ' ');
    }

    // 4. 불용어 및 서술어 제거하여 제목 정제
    raw = raw.replace(/\b(등록해줘|등록해|등록|추가해줘|추가해|추가|잡아줘|잡아|생성해줘|알려줘|일정)\b/g, ' ');
    raw = raw.replace(/\s+/g, ' ').trim();

    var title = raw || '새 일정';

    return {
      title: title,
      date: dateStr + timeStr,
      attachments: attachments,
      raw: text
    };
  }

  async function executeCalAgentNaturalSchedule(txt){
    var parsed = parseNaturalScheduleText(txt);
    if(!parsed){ L.toast('일정 내용을 입력해주세요'); return; }
    if(!L.state.profile.settings) L.state.profile.settings = {};
    if(!L.state.profile.settings.customSchedules) L.state.profile.settings.customSchedules = [];

    var newSched = {
      id: L.uid('sched'),
      title: parsed.title,
      date: parsed.date,
      note: parsed.attachments.length ? ('참고 링크: ' + parsed.attachments.map(function(a){ return a.url; }).join(', ')) : '',
      done: false,
      notifyEnabled: true,
      notifyMinutes: 10,
      linkedGoalId: null,
      linkedGoalTitle: null,
      attachments: parsed.attachments,
      createdAt: L.nowISO()
    };

    L.state.profile.settings.customSchedules.push(newSched);
    var targetDateKey = parsed.date.slice(0, 10);
    L.state.calSelectedDate = targetDateKey;
    L.state.calDate = targetDateKey;
    L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
    await L.saveProfile();

    K.renderCalendarScreen();
    if(typeof L.renderHome === 'function') L.renderHome();
    if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen();
    if(typeof renderStatsScreen === 'function') renderStatsScreen();

    L.toast('📅 AI 일정 등록 완료: "' + L.escapeHtml(parsed.title) + '" (' + parsed.date.replace('T', ' ') + ')');

    if(L.state.profile.settings.gcalAutoSync && L.isGoogleCalendarConnected()){
      L.syncAllToGoogleCalendar(false).catch(function(){});
    }
  }

  K.parseNaturalScheduleText = parseNaturalScheduleText;
  K.executeCalAgentNaturalSchedule = executeCalAgentNaturalSchedule;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
