/**
 * OurGoal Sanctuary Cell: 기록 탭 25분 뽀모도로 집중 타이머 — 타이머 카드 그리기(renderSanctuaryRecordsTimer)와 시작·멈춤·초기화·완료 기록 적립 (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   분기 본문 renderSanctuaryRecordsTimer(1135~1170)
 *   메서드 togglePomodoro·resetPomodoro·finishPomodoroSession(1671~1742)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 focusTimer 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.focusTimer = KIT.focusTimer || {};
  var T = K.scope = K.scope || {};

  // [#TASK-ES-429] renderSanctuaryRecords 의 「engine.activeRecMode === 'timer'」 분기 본문 — 이전 전 1135~1170줄 글자 그대로.
  //   렌더 함수 지역 변수(contentHtml)는 인자로 받는다, 바뀐 contentHtml 을 돌려준다.
  function renderSanctuaryRecordsTimer(contentHtml) {
      var mins = Math.floor(T.engine.timerSeconds / 60);
      var secs = T.engine.timerSeconds % 60;
      var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var curGoal = goals.find(function(g) { return g.id === T.engine.activeGoalId; }) || goals[0];
      var todayKeyForTimer = T.getTodayStr();
      var itemsByDate = (typeof window.calendarItemsByDate === 'function') ? window.calendarItemsByDate() : {};
      var dayItemsForTimer = itemsByDate[todayKeyForTimer] || [];
      var firstActiveItem = dayItemsForTimer.find(function(it) { return !it.done; });
      var goalTitle = firstActiveItem ? ('[' + todayKeyForTimer + '] ' + (firstActiveItem.title || firstActiveItem.text)) : (curGoal ? curGoal.title : '25분 딥워크 몰입');

      contentHtml = '<div class="s-timer-card">' +
        '<div class="s-timer-header">' +
          '<span class="s-timer-badge">뽀모도로 딥워크 세션</span>' +
          '<h4>' + T.escapeHtml(goalTitle) + '</h4>' +
        '</div>' +
        '<div class="s-timer-dial-wrap">' +
          '<svg class="s-timer-svg" viewBox="0 0 200 200">' +
            '<circle class="s-dial-bg" cx="100" cy="100" r="85"></circle>' +
            '<circle class="s-dial-progress ' + (T.engine.timerRunning ? 'pulsing' : '') + '" cx="100" cy="100" r="85" style="stroke-dashoffset: ' + (534 * (1 - T.engine.timerSeconds / 1500)) + ';"></circle>' +
          '</svg>' +
          '<div class="s-timer-display" id="sPomodoroDisplay">' + timeStr + '</div>' +
        '</div>' +
        '<div class="s-timer-controls">' +
          '<button class="btn btn-primary s-timer-main-btn" type="button" onclick="window.OurgoalSanctuaryV3.togglePomodoro()">' +
            (T.engine.timerRunning ? '⏸️ 일시정지' : '▶️ 몰입 시작') +
          '</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.resetPomodoro()">' +
            '↺ 리셋' +
          '</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" style="color:var(--brand-strong);border:1px solid var(--brand);" onclick="window.OurgoalSanctuaryV3.finishPomodoroSession()">' +
            '✨ 완성 & 기록 적립' +
          '</button>' +
        '</div>' +
      '</div>';
    return contentHtml;
  }

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 togglePomodoro·resetPomodoro·finishPomodoroSession — 이전 전 1671~1742줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_togglePomodoro = {
    togglePomodoro: function() {
      T.engine.timerRunning = !T.engine.timerRunning;
      if (T.engine.timerRunning) {
        toast('25분 뽀모도로 포커스 타이머가 시작되었습니다! 🧘');
        if (!T.engine.timerInterval) {
          T.engine.timerInterval = setInterval(function() {
            if (T.engine.timerSeconds > 0) {
              T.engine.timerSeconds--;
              var disp = document.getElementById('sPomodoroDisplay');
              if (disp) {
                var mins = Math.floor(T.engine.timerSeconds / 60);
                var secs = T.engine.timerSeconds % 60;
                disp.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
              }
            } else {
              window.OurgoalSanctuaryV3.finishPomodoroSession();
            }
          }, 1000);
        }
      } else {
        toast('타이머가 일시정지되었습니다.');
        clearInterval(T.engine.timerInterval);
        T.engine.timerInterval = null;
      }
      T.renderSanctuaryRecords();
      T.renderSanctuaryCalendar();
    },
    resetPomodoro: function() {
      clearInterval(T.engine.timerInterval);
      T.engine.timerInterval = null;
      T.engine.timerRunning = false;
      T.engine.timerSeconds = 1500;
      toast('타이머가 리셋되었습니다.');
      T.renderSanctuaryRecords();
      T.renderSanctuaryCalendar();
    },
    finishPomodoroSession: async function() {
      clearInterval(T.engine.timerInterval);
      T.engine.timerInterval = null;
      T.engine.timerRunning = false;
      T.engine.timerSeconds = 1500;

      var goals = (window.state && window.state.profile && window.state.profile.goals) || [];
      var curGoal = goals.find(function(g) { return g.id === T.engine.activeGoalId; }) || goals[0];
      var goalTitle = curGoal ? curGoal.title : '집중 몰입';

      var newRecord = {
        id: 'rec_pomo_' + Date.now(),
        text: '뽀모도로 25분 몰입 완주 🧘 (' + goalTitle + ')',
        content: '뽀모도로 25분 몰입 완주 🧘 (' + goalTitle + ')',
        durationMinutes: 25,
        topic: (curGoal && curGoal.topic) || '운동/건강',
        startAt: new Date(Date.now() - 25 * 60000).toISOString(),
        created_at: new Date().toISOString()
      };

      if (!window.state) window.state = {};
      if (!window.state.profile) window.state.profile = { records: [] };
      if (!Array.isArray(window.state.profile.records)) window.state.profile.records = [];

      window.state.profile.records.unshift(newRecord);
      if (window.saveProfile) await window.saveProfile();
      if (window.playTimerBeep) window.playTimerBeep();

      toast('🎉 뽀모도로 세션 완료! 기록 탭에 25분이 자동 적립되었습니다 (+25 EXP).');
      T.renderSanctuaryRecords();
      T.renderSanctuaryCalendar();
      if (typeof renderCalendarScreen === 'function') renderCalendarScreen();
      if (typeof renderHome === 'function') renderHome();
      if (typeof renderRecordsScreen === 'function') renderRecordsScreen();
      if (typeof renderStatsScreen === 'function') renderStatsScreen();
    },
  };

  K.renderSanctuaryRecordsTimer = renderSanctuaryRecordsTimer;
})(window);
