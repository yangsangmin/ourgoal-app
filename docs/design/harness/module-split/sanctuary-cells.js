'use strict';
// #TASK-ES-429 포커스 성소 엔진 세포 쪼개기 — 묶음 정의(생성기·검사기·신고서 스크립트가 같이 읽는다).
// 한 세포 = 한 화면 책임. 세 가지 모양의 코드를 옮긴다(모두 글자 그대로, 바꾸는 글자는 원본 스코프 이름 앞 T. 접두뿐):
//   fns      원본 IIFE 최상위 함수 선언(바로 위 붙은 주석 포함)
//   methods  window.OurgoalSanctuaryV3 객체 리터럴의 메서드 속성. 이어진 속성 덩어리마다 세포의 K.methodsFrom_<첫 키> 객체로 옮기고,
//            원본 객체 리터럴의 같은 자리에서 펼친다(...). 키·순서·값(같은 함수 글자)이 같다. 'openPeerDm#0' = 같은 키 중 첫째(둘째는 this 를 써 원본에 남는다).
//   sections 렌더 함수(fn) 안 if 사슬의 한 분기 본문. 세포의 함수(name)로 옮기고, 원본 분기 본문은 그 함수를 부르는 한 줄이 된다.
//            본문이 읽는 렌더 함수 지역 변수는 인자로 받고, 본문이 바꾸는 지역 변수(하나뿐이어야 함)는 돌려받는다.
// 원본에 남기는 것: engine 상태 객체 · 공용 도우미(isFocusSanctuary·escapeHtml·renderCalDayDetail·getTodayStr) · 홈·설정 렌더 · 각 렌더 함수의 머리(모드 바)와 if 사슬
//   · 히트맵·주간·통계 분기 · 목표 0건 분기 · 라우터 renderSanctuaryV3 · 객체 리터럴의 나머지 메서드(this 를 쓰는 setCalMode·openPeerDm 둘째 포함) · DOMContentLoaded 등록.
//   동결 무결성 게이트(scripts/verify-integrity-gate.js)가 js/sanctuary-v3-engine.js 한 파일에서 찾는 글자(모드 바 setCalMode·setRecMode, 주간 s-week-grid·dayDetailsHtml,
//   목표 알약 s-goal-pills-wrap empty·window.promptNewGoal(), openScheduleDetail 의 openCalendarManualEditModal 인자)는 모두 원본에 남는 구간에 있다.
module.exports = [
  { kit: 'peerRadar', cell: 'js/sanctuary-peer-radar.js', imp: '_sRadar',
    name: '동반자 레이더',
    role: '소통 탭 동반자 레이더 — 실제 러닝메이트 목록(getRealRunningMates)·아바타·레이더 접기·레이더 그리기(renderSanctuaryComm)와 응원·DM·상호작용·새로고침·동반자 찾기 메서드',
    fns: ['renderPeerAvatarHtml', 'getRealRunningMates', 'toggleRadarCollapse', 'renderSanctuaryComm'],
    methods: ['cheerPost', 'openPeerDm#0', 'openPeerInteraction', 'refreshRadar', 'gotoCompanions'],
    sections: [] },
  { kit: 'calendarViews', cell: 'js/sanctuary-calendar-views.js', imp: '_sCalViews',
    name: '성소 월간·일간 달력',
    role: '일정 탭 성소 달력의 월간 달력(renderSanctuaryCalendarMonth)과 일간 타임라인(renderSanctuaryCalendarTimeline) 그리기 — renderSanctuaryCalendar 의 두 분기 본문',
    fns: [], methods: [],
    sections: [
      { fn: 'renderSanctuaryCalendar', test: "engine.activeCalMode === 'month'", name: 'renderSanctuaryCalendarMonth' },
      { fn: 'renderSanctuaryCalendar', test: "engine.activeCalMode === 'timeline'", name: 'renderSanctuaryCalendarTimeline' },
    ] },
  { kit: 'calendarActions', cell: 'js/sanctuary-calendar-actions.js', imp: '_sCalActions',
    name: '성소 달력 이동·일정 열기',
    role: '일정 탭 성소 달력 조작 — 달·주·일 이동과 오늘·날짜 선택, 일정 추가·일자 허브·배경사진 창 열기, 일정 완료 토글(OurgoalSanctuaryV3 메서드)',
    fns: [],
    methods: ['shiftCal', 'selectToday', 'shiftWeek', 'shiftTimelineDay', 'selectCalDay', 'openAddScheduleModal', 'openDayHubModal', 'openBgPickerModal', 'toggleScheduleItem'],
    sections: [] },
  { kit: 'goalTrail', cell: 'js/sanctuary-goal-trail.js', imp: '_sGoalTrail',
    name: '목표 마운틴 트레일',
    role: '목표 탭 성소 마운틴 트레일 — 고른 목표의 마일스톤 길 그리기(renderSanctuaryGoalTrail)와 마일스톤·할 일 토글, 마일스톤 체크인 연결, 샘플 루틴 담기',
    fns: [],
    methods: ['toggleMilestone', 'toggleTask', 'openMilestoneCheckin', 'transplantSampleRoutine'],
    sections: [
      { fn: 'renderSanctuaryGoals', test: '!activeGoal', branch: 'else', name: 'renderSanctuaryGoalTrail' },
    ] },
  { kit: 'recordFeed', cell: 'js/sanctuary-record-feed.js', imp: '_sRecFeed',
    name: '성소 기록 피드·보관함',
    role: '기록 탭 성소 피드(renderSanctuaryRecordsFeed)와 보관함(renderSanctuaryRecordsArchive) 그리기, 기간·쪽·직접 기간 고르기 메서드',
    fns: [],
    methods: ['setFeedPeriod', 'setFeedPage', 'applyFeedCustomDate', 'setArchivePeriod', 'setArchivePage'],
    sections: [
      { fn: 'renderSanctuaryRecords', test: "engine.activeRecMode === 'feed'", name: 'renderSanctuaryRecordsFeed' },
      { fn: 'renderSanctuaryRecords', test: "engine.activeRecMode === 'archive'", name: 'renderSanctuaryRecordsArchive' },
    ] },
  { kit: 'weeklyRecap', cell: 'js/sanctuary-weekly-recap.js', imp: '_sRecap',
    name: '위클리 리캡',
    role: '기록 탭 위클리 리캡 — 리캡 카드 그리기(renderSanctuaryRecordsRecap)와 리캡 이미지 저장·리캡 창 열기',
    fns: [],
    methods: ['downloadRecapImage', 'openWeeklyRecapModal'],
    sections: [
      { fn: 'renderSanctuaryRecords', test: "engine.activeRecMode === 'recap'", name: 'renderSanctuaryRecordsRecap' },
    ] },
  { kit: 'focusTimer', cell: 'js/sanctuary-focus-timer.js', imp: '_sTimer',
    name: '뽀모도로 집중 타이머',
    role: '기록 탭 25분 뽀모도로 집중 타이머 — 타이머 카드 그리기(renderSanctuaryRecordsTimer)와 시작·멈춤·초기화·완료 기록 적립',
    fns: [],
    methods: ['togglePomodoro', 'resetPomodoro', 'finishPomodoroSession'],
    sections: [
      { fn: 'renderSanctuaryRecords', test: "engine.activeRecMode === 'timer'", name: 'renderSanctuaryRecordsTimer' },
    ] },
];
