/**
 * OurGoal Sanctuary Cell: 일정 탭 성소 달력 조작 — 달·주·일 이동과 오늘·날짜 선택, 일정 추가·일자 허브·배경사진 창 열기, 일정 완료 토글(OurgoalSanctuaryV3 메서드) (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   메서드 shiftCal·selectToday·shiftWeek·shiftTimelineDay·selectCalDay(1440~1515)
 *   메서드 openAddScheduleModal·openDayHubModal·openBgPickerModal·toggleScheduleItem(1533~1584)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 calendarActions 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.calendarActions = KIT.calendarActions || {};
  var T = K.scope = K.scope || {};

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 shiftCal·selectToday·shiftWeek·shiftTimelineDay·selectCalDay — 이전 전 1440~1515줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_shiftCal = {
    shiftCal: function(dir) {
      if (!T.engine.calYear || !T.engine.calMonth) {
        var d0 = new Date();
        T.engine.calYear = d0.getFullYear();
        T.engine.calMonth = d0.getMonth() + 1;
      }
      var newDate = new Date(T.engine.calYear, T.engine.calMonth - 1 + dir, 1);
      T.engine.calYear = newDate.getFullYear();
      T.engine.calMonth = newDate.getMonth() + 1;
      var newKey = T.engine.calYear + '-' + String(T.engine.calMonth).padStart(2, '0') + '-01';
      T.engine.selectedCalDate = newKey;
      if (window.state) {
        window.state.calDate = newKey;
        window.state.calSelectedDate = newKey;
      }
      toast(T.engine.calYear + '년 ' + T.engine.calMonth + '월로 이동했습니다.');
      T.renderSanctuaryCalendar();
      T.renderCalDayDetail();
    },
    selectToday: function() {
      var d = new Date();
      T.engine.calYear = d.getFullYear();
      T.engine.calMonth = d.getMonth() + 1;
      var tStr = T.getTodayStr();
      T.engine.selectedCalDate = tStr;
      if (window.state) {
        window.state.calDate = tStr;
        window.state.calSelectedDate = tStr;
      }
      toast('오늘(' + tStr + ')로 이동했습니다.');
      T.renderSanctuaryCalendar();
      T.renderCalDayDetail();
    },
    shiftWeek: function(dir) {
      var base = T.engine.selectedCalDate || T.getTodayStr();
      var parts = base.split('-');
      var dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + (dir * 7));
      if (isNaN(dt.getTime())) dt = new Date();
      var newKey = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      T.engine.selectedCalDate = newKey;
      T.engine.calYear = dt.getFullYear();
      T.engine.calMonth = dt.getMonth() + 1;
      if (window.state) {
        window.state.calDate = newKey;
        window.state.calSelectedDate = newKey;
      }
      toast(newKey + ' 주간으로 이동했습니다.');
      T.renderSanctuaryCalendar();
      T.renderCalDayDetail();
    },
    shiftTimelineDay: function(dir) {
      var base = T.engine.selectedCalDate || T.getTodayStr();
      var parts = base.split('-');
      var dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + dir);
      if (isNaN(dt.getTime())) dt = new Date();
      var newKey = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      T.engine.selectedCalDate = newKey;
      T.engine.calYear = dt.getFullYear();
      T.engine.calMonth = dt.getMonth() + 1;
      if (window.state) {
        window.state.calDate = newKey;
        window.state.calSelectedDate = newKey;
      }
      toast(newKey + ' 타임라인으로 이동했습니다.');
      T.renderSanctuaryCalendar();
      T.renderCalDayDetail();
    },
    selectCalDay: function(dateKey) {
      T.engine.selectedCalDate = dateKey;
      if (window.state) {
        window.state.calSelectedDate = dateKey;
      }
      toast(dateKey + ' 일정을 선택했습니다.');
      T.renderSanctuaryCalendar();
      T.renderCalDayDetail();
    },
  };

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 openAddScheduleModal·openDayHubModal·openBgPickerModal·toggleScheduleItem — 이전 전 1533~1584줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_openAddScheduleModal = {
    openAddScheduleModal: function(dateKey) {
      var dt = dateKey || T.engine.selectedCalDate || T.getTodayStr();
      if (typeof window.openCalendarManualEditModal === 'function') {
        window.openCalendarManualEditModal(dt, null, 'custom', {
          title: '',
          date: dt + 'T10:00',
          note: '',
          done: false,
          attachments: []
        });
      } else if (typeof window.openAddScheduleModal === 'function') {
        window.openAddScheduleModal(dt);
      } else {
        if (typeof window.switchTab === 'function') {
          window.switchTab('screen-calendar');
          toast('캘린더 일정 화면으로 이동했습니다.');
        } else {
          toast('일정을 등록할 날짜를 선택해주세요.');
        }
      }
    },
    openDayHubModal: function(dateKey) {
      var dt = dateKey || T.engine.selectedCalDate || T.getTodayStr();
      if (typeof window.openCalendarDayEditHubModal === 'function') {
        window.openCalendarDayEditHubModal(dt);
      } else {
        toast('일자 관리 종합 허브를 엽니다.');
      }
    },
    openBgPickerModal: function(dateKey, fromHub) {
      var dt = dateKey || T.engine.selectedCalDate || T.getTodayStr();
      if (typeof window.openCalendarDayBgPickerModal === 'function') {
        window.openCalendarDayBgPickerModal(dt, !!fromHub);
      } else {
        toast('배경사진 선택 모달을 엽니다.');
      }
    },
    toggleScheduleItem: async function(schedId, kind, goalId, msId, taskId) {
      if (typeof window.toggleScheduleDone === 'function') {
        await window.toggleScheduleDone(schedId, kind || 'custom', goalId, msId, taskId);
        T.renderSanctuaryCalendar();
      } else {
        var scheds = (window.state && window.state.profile && window.state.profile.settings && window.state.profile.settings.customSchedules) || [];
        var s = scheds.find(function(item) { return item.id === schedId; });
        if (s) {
          s.done = !s.done;
          if (window.saveProfile) await window.saveProfile();
          toast('일정을 ' + (s.done ? '완료 처리했습니다! (+5P)' : '미완료로 변경했습니다.'));
          T.renderSanctuaryCalendar();
        }
      }
    },
  };

})(window);
