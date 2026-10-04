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

  // [#TASK-ES-362 CAL-03] 한글 날짜 표현의 앞뒤 경계. JS 정규식의 단어 경계(\b)는 영문·숫자 기준이라 한글 사이에서는 늘 거짓이었다
  // (그래서 "내일"이 날짜로 안 읽히고, 요일 패턴이 "내일"의 "일"을 일요일로 잡아 제목이 "내 …"가 됐다).
  // 앞: 문장 처음 또는 한글이 아닌 글자. 뒤: 문장 끝·한글이 아닌 글자, 또는 조사(에·은·는·엔) 하나 뒤의 끝·한글 아닌 글자.
  var KO_BEFORE = '(^|[^가-힣])';
  var KO_AFTER = '(?:에|은|는|엔|까지|부터)?(?=$|[^가-힣])';

  function parseNaturalScheduleText(text, nowOverride){
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

    // 2. 날짜 분석 (기준일: 오늘 — 시험에서만 nowOverride 로 기준일을 고정한다)
    var now = (nowOverride instanceof Date && !isNaN(nowOverride.getTime())) ? nowOverride : new Date();
    var targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var dateMatched = false;
    // 찾은 날짜 표현을 제목에서 통째로 지운다(앞 경계 글자는 남긴다).
    function cut(re){
      var m = raw.match(re);
      if(!m) return null;
      raw = raw.replace(re, function(all, lead){ return (lead || '') + ' '; });
      return m;
    }

    // 2-1. 구체적 날짜 (YYYY년 M월 D일 or YYYY-MM-DD or YYYY.M.D) — 가장 구체적인 것이 먼저다
    var fullDateMatch = cut(/(^|[^\d])(\d{4})\s*[.\-\/년]\s*(\d{1,2})\s*[.\-\/월]\s*(\d{1,2})\s*일?(?:에)?/);
    if(fullDateMatch){
      targetDate = new Date(parseInt(fullDateMatch[2], 10), parseInt(fullDateMatch[3], 10) - 1, parseInt(fullDateMatch[4], 10));
      dateMatched = true;
    } else {
      // M월 D일 or M/D or M.D
      var monthDayMatch = cut(/(^|[^\d])(\d{1,2})\s*(?:월\s*|[.\/])(\d{1,2})\s*일?(?:에)?/);
      if(monthDayMatch){
        targetDate = new Date(now.getFullYear(), parseInt(monthDayMatch[2], 10) - 1, parseInt(monthDayMatch[3], 10));
        dateMatched = true;
      }
    }

    // 2-2. N일 후 / N일 뒤
    if(!dateMatched){
      var afterMatch = cut(/(^|[^\d])(\d{1,3})\s*일\s*(?:후|뒤)(?:에)?(?=$|[^가-힣])/);
      if(afterMatch){
        targetDate.setDate(targetDate.getDate() + parseInt(afterMatch[2], 10));
        dateMatched = true;
      }
    }

    // 2-3. 상대 날짜 (오늘·내일·모레·글피)
    if(!dateMatched){
      var relOffsets = { '오늘': 0, '내일': 1, '모레': 2, '내일모레': 2, '글피': 3 };
      var relMatch = cut(new RegExp(KO_BEFORE + '(내일\\s*모레|오늘|내일|모레|글피)' + KO_AFTER));
      if(relMatch){
        targetDate.setDate(targetDate.getDate() + relOffsets[relMatch[2].replace(/\s+/g, '')]);
        dateMatched = true;
      }
    }

    // 2-4. 이번 주 / 다음 주 요일 — "요일"을 붙이거나 "이번 주·다음 주"를 앞에 둔 경우만 요일로 읽는다
    //      (예전에는 아무 글자 "월·화·수·목·금·토·일"이나 요일로 잡아 "내일"·"수학"·"10월"이 깨졌다)
    var dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
    var weekMatch = cut(new RegExp(KO_BEFORE + '(?:(이번\\s*주|다음\\s*주|담주)\\s*)?([월화수목금토일])요일' + KO_AFTER));
    if(!weekMatch){
      weekMatch = cut(new RegExp(KO_BEFORE + '(이번\\s*주|다음\\s*주|담주)\\s*([월화수목금토일])' + KO_AFTER));
    }
    if(weekMatch && !dateMatched){
      var isNextWeek = !!weekMatch[2] && /다음|담주/.test(weekMatch[2]);
      var targetDay = dayMap[weekMatch[3]];
      var curDay = now.getDay();
      var diff = targetDay - curDay;
      if(isNextWeek){
        diff += 7;
      } else if(diff < 0){
        diff += 7;
      }
      targetDate.setDate(targetDate.getDate() + diff);
      dateMatched = true;
    }

    var y = targetDate.getFullYear();
    var m = String(targetDate.getMonth() + 1).padStart(2, '0');
    var d = String(targetDate.getDate()).padStart(2, '0');
    var dateStr = y + '-' + m + '-' + d;

    // 3. 시간 분석 (오전/오후/낮/저녁/밤 N시 M분 or HH:mm)
    var timeStr = '';
    // [#TASK-ES-362 CAL-03] 시간 뒤 조사 "에"도 시간 표현으로 함께 지운다("오후 3시에 치과" → 제목 "치과", 예전에는 "에 치과")
    var timeMatch1 = raw.match(/(오전|오후|낮|저녁|밤|새벽)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?(?:에)?/);
    var timeMatch2 = raw.match(/(\d{1,2}):(\d{2})(?:에)?/);

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
