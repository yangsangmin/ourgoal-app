/**
 * @file tests/schedule-notification-setting.test.js
 * #TASK-ES-316: [65] 일정 편집 내 사전 알림 설정(울릴 시간 N분 전 지정) 단위 테스트
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 1. 소스 정적 마크업 및 구조 검증
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const notifyEngineJs = fs.readFileSync(path.join(__dirname, '../js/notify-engine.js'), 'utf8');
const componentsJs = fs.readFileSync(path.join(__dirname, '../js/components.js'), 'utf8');

// [검증 1] openCalendarManualEditModal 내 사전 알림 토글 및 울릴 시간 선택/커스텀 입력 요소 확인
assert.ok(indexHtml.includes('id="calEditNotifySwitch"'), 'calEditNotifySwitch 토글 스위치 존재');
assert.ok(indexHtml.includes('id="calEditNotifyTimeField"'), 'calEditNotifyTimeField 필드 존재');
assert.ok(indexHtml.includes('id="calEditNotifyOffset"'), 'calEditNotifyOffset 셀렉트 존재');
assert.ok(indexHtml.includes('id="calEditNotifyCustomWrap"'), 'calEditNotifyCustomWrap 커스텀 영역 존재');
assert.ok(indexHtml.includes('id="calEditNotifyCustomMin"'), 'calEditNotifyCustomMin 커스텀 분 입력 인풋 존재');

// [검증 2] calendarItemsByDate 내 notifyEnabled 및 notifyMinutes 속성 매핑 확인
assert.ok(indexHtml.includes('notifyEnabled:!!cs.notifyEnabled'), 'customSchedules notifyEnabled 매핑 확인');
assert.ok(indexHtml.includes('notifyMinutes:(typeof cs.notifyMinutes===\'number\'?cs.notifyMinutes:10)'), 'customSchedules notifyMinutes 매핑 확인');

// [검증 3] openCalendarDayEditHubModal 및 renderCalDayDetail 내 sched-notify-badge 표출 로직 확인
assert.ok(indexHtml.includes('class="sched-notify-badge"'), 'sched-notify-badge 뱃지 마크업 존재');
assert.ok(indexHtml.includes('정시 알림'), '정시 알림 텍스트 분기 존재');

// [검증 4] startScheduleReminderPoller 타이머 루프 확인
assert.ok(indexHtml.includes('startScheduleReminderPoller'), 'startScheduleReminderPoller 함수 선언 존재');
assert.ok(indexHtml.includes('OurgoalNotifyEngine.checkScheduleReminders'), 'OurgoalNotifyEngine.checkScheduleReminders 호출 연결 확인');

// [검증 5] notify-engine.js 내 checkScheduleReminders 함수 구현 및 익스포트 확인
assert.ok(notifyEngineJs.includes('function checkScheduleReminders()'), 'checkScheduleReminders 함수 정의 확인');
assert.ok(notifyEngineJs.includes('checkScheduleReminders: checkScheduleReminders'), 'OurgoalNotifyEngine에 checkScheduleReminders 등록 확인');
assert.ok(notifyEngineJs.includes('ourgoal_notified_scheds'), 'ourgoal_notified_scheds 중복 방지 캐시 사용 확인');

// [검증 6] components.js 내 handle일정_Item65Action 구현 및 익스포트 확인
assert.ok(componentsJs.includes('handle일정_Item65Action'), 'handle일정_Item65Action 함수 정의 확인');
assert.ok(componentsJs.includes('og_task-65_cache'), 'og_task-65_cache 영속화 키 확인');

// 2. Mock 환경 동적 런타임 검증
const mockLocalStorage = {};
global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorage[k]; }
};

let hapticFired = 0;
global.triggerHapticFeedback = (ms) => { hapticFired += ms; };

let calendarRendered = 0;
global.renderCalendarScreen = () => { calendarRendered++; };
global.renderHome = () => {};
global.renderGoalsScreen = () => {};
global.renderRecordsScreen = () => {};

global.state = {
  profile: {
    id: 'user_test_65',
    settings: {
      customSchedules: []
    }
  }
};

const notifyEngine = require('../js/notify-engine');
const components = require('../js/components');

// [런타임 검증 1] handle일정_Item65Action 실행
(async () => {
  const result = await components.handle일정_Item65Action(null, {
    notifyEnabled: true,
    notifyMinutes: 15,
    showToast: false
  });

  assert.strictEqual(result.ticket, '65', '티켓 65 정상 반환');
  assert.strictEqual(result.notifyEnabled, true, 'notifyEnabled 정상 반영');
  assert.strictEqual(result.notifyMinutes, 15, 'notifyMinutes 15분 정상 반영');
  assert.strictEqual(global.state.profile.settings.scheduleNotificationEnabled, true, 'settings.scheduleNotificationEnabled 갱신');
  assert.strictEqual(global.state.profile.settings.defaultScheduleNotifyMinutes, 15, 'settings.defaultScheduleNotifyMinutes 갱신');
  assert.ok(mockLocalStorage['og_task-65_cache'], '로컬스토리지 og_task-65_cache 생성 확인');
  assert.strictEqual(hapticFired, 12, '12ms 햅틱 피드백 트리거 확인');
  assert.ok(calendarRendered >= 1, '캘린더 화면 동시 전파 확인');

  // [런타임 검증 2] OurgoalNotifyEngine.checkScheduleReminders 동작 확인
  let dispatchedNotifications = [];
  const origDispatch = notifyEngine.dispatchGlobalNotification;
  notifyEngine.dispatchGlobalNotification = (opts) => {
    dispatchedNotifications.push(opts);
    return true;
  };

  // 10분 뒤 시작하는 일정 추가
  const now = new Date();
  const schedTime = new Date(now.getTime() + 10 * 60 * 1000); // 10분 뒤
  global.state.profile.settings.customSchedules = [
    {
      id: 'sched_test_1',
      title: '알림 테스트 회의',
      date: schedTime.toISOString(),
      notifyEnabled: true,
      notifyMinutes: 10,
      done: false
    }
  ];

  const fired = notifyEngine.checkScheduleReminders();
  assert.strictEqual(fired.length, 1, '10분 전 알림 대상 1건 정상 감지');
  assert.strictEqual(dispatchedNotifications.length, 1, 'dispatchGlobalNotification 1회 호출');
  assert.ok(dispatchedNotifications[0].title.includes('10분 전'), '알림 제목에 10분 전 표기');
  assert.ok(dispatchedNotifications[0].body.includes('알림 테스트 회의'), '알림 본문에 일정 제목 포함');

  // 동일한 일정 재검사 시 중복 알림 방지 확인
  const firedAgain = notifyEngine.checkScheduleReminders();
  assert.strictEqual(firedAgain.length, 0, '중복 알림 0건 방지 확인');
  assert.strictEqual(dispatchedNotifications.length, 1, '추가 디스패치 없음 확인');

  // 원복
  notifyEngine.dispatchGlobalNotification = origDispatch;

})().catch(err => {
  throw err;
});
