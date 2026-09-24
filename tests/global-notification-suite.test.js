/**
 * [TASK-ES-254] 백그라운드·앱종료·미확인 전역 알림(DM 포함) 전수 구현 및 세부 알림 설정창 구축 단위 검증
 */
const assert = require('assert');

// 가상 전역 브라우저 환경 모킹
global.window = global;
global.document = {
  hidden: false,
  getElementById: () => null,
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    querySelector: () => null
  }),
  body: { appendChild: () => {} }
};
global.navigator = {
  vibrate: (pattern) => { global._lastVibrate = pattern; return true; }
};
global.Notification = function(title, options) {
  global._lastNotification = { title, options };
};
global.Notification.permission = 'granted';
global.Notification.requestPermission = async () => 'granted';

// 테스트 전역 상태
global.state = {
  profile: {
    id: 'user_test_254',
    username: '테스트러너',
    settings: {
      notifications: {}
    }
  }
};
global.saveLocalSettings = (id, s) => { global.state.profile.settings = s; };
global.saveProfile = async () => true;
global.updateTopNotifBadge = () => { global._topNotifBadgeUpdated = true; };

// 모듈 로드
const Engine = require('../js/notify-engine.js');

console.log('[TEST] global-notification-suite.test.js: starting execution...');

// 1. 기본 환경설정 정규화 및 레거시 동기화 검증
{
  global.state.profile.settings = {};
  const config = Engine.getNotifConfig();
  assert.strictEqual(config.feedbackMode, 'all', '기본 feedbackMode는 all이어야 함');
  assert.strictEqual(config.privacyLevel, 'detail', '기본 privacyLevel은 detail이어야 함');
  assert.strictEqual(config.bgEnabled, true, '기본 bgEnabled는 true여야 함');
  assert.strictEqual(config.dmMessages, true, '기본 dmMessages는 true여야 함');
  assert.strictEqual(config.teamActivities, true, '기본 teamActivities는 true여야 함');
  assert.strictEqual(config.cheerActivities, true, '기본 cheerActivities는 true여야 함');
  assert.strictEqual(config.goalReminders, true, '기본 goalReminders는 true여야 함');
  assert.strictEqual(config.streakReminders, true, '기본 streakReminders는 true여야 함');
}

// 2. 프라이버시 수준(상세 vs 간략형 보안 마스킹) 검증
{
  global.state.profile.settings.notifications = {
    feedbackMode: 'all',
    privacyLevel: 'summary',
    dmMessages: true,
    cheerActivities: true
  };
  global.state.profile.settings.unreadNotifications = [];

  // DM 발송 시 마스킹 검증
  Engine.dispatchGlobalNotification({
    type: 'dm',
    title: '💬 상민',
    body: '내일 회의는 몇 시인가요?',
    senderName: '상민'
  });

  const unreads = Engine.getUnreadNotifications();
  assert.strictEqual(unreads.length, 1);
  assert.strictEqual(unreads[0].body, '상민님의 새로운 1:1 메시지가 도착했습니다.', '간략형(summary) 모드에서는 DM 본문이 마스킹되어야 함');

  // 응원 발송 시 마스킹 검증
  Engine.dispatchGlobalNotification({
    type: 'cheer',
    title: '🔥 러너A',
    body: '오늘도 파이팅입니다!',
    senderName: '러너A'
  });
  assert.strictEqual(unreads.length, 2);
  assert.strictEqual(unreads[1].body, '러너A님이 새로운 응원을 보냈습니다.', '간략형 모드에서는 응원 본문이 마스킹되어야 함');

  // 상세(detail) 모드로 전환 검증
  global.state.profile.settings.notifications.privacyLevel = 'detail';
  Engine.dispatchGlobalNotification({
    type: 'dm',
    title: '💬 상민',
    body: '세부 내용이 그대로 노출되어야 합니다.',
    senderName: '상민'
  });
  assert.strictEqual(unreads.length, 3);
  assert.strictEqual(unreads[2].body, '세부 내용이 그대로 노출되어야 합니다.', '상세(detail) 모드에서는 원본 본문이 유지되어야 함');
}

// 3. 유형별 알림 On/Off 필터링 검증
{
  global.state.profile.settings.notifications = {
    feedbackMode: 'all',
    privacyLevel: 'detail',
    dmMessages: false, // DM 차단
    teamActivities: false, // 팀 차단
    cheerActivities: false, // 응원 차단
    goalReminders: false, // 목표 차단
    streakReminders: false // 스트릭 차단
  };

  const resDm = Engine.dispatchGlobalNotification({ type: 'dm', title: '테스트 DM' });
  assert.strictEqual(resDm, false, 'dmMessages가 false이면 DM 알림이 차단되어야 함');

  const resTeam = Engine.dispatchGlobalNotification({ type: 'team', title: '테스트 팀' });
  assert.strictEqual(resTeam, false, 'teamActivities가 false이면 팀 알림이 차단되어야 함');

  const resCheer = Engine.dispatchGlobalNotification({ type: 'cheer', title: '테스트 응원' });
  assert.strictEqual(resCheer, false, 'cheerActivities가 false이면 응원 알림이 차단되어야 함');

  const resGoal = Engine.dispatchGlobalNotification({ type: 'goal', title: '테스트 목표' });
  assert.strictEqual(resGoal, false, 'goalReminders가 false이면 목표 알림이 차단되어야 함');

  const resStreak = Engine.dispatchGlobalNotification({ type: 'streak', title: '테스트 스트릭' });
  assert.strictEqual(resStreak, false, 'streakReminders가 false이면 스트릭 알림이 차단되어야 함');
}

// 4. 미확인 알림 큐 적재 및 markAllAsRead 검증
{
  global.state.profile.settings.notifications = {
    feedbackMode: 'all',
    privacyLevel: 'detail',
    dmMessages: true
  };
  global.state.profile.settings.unreadNotifications = [];

  Engine.dispatchGlobalNotification({ type: 'dm', title: '알림 1' });
  Engine.dispatchGlobalNotification({ type: 'dm', title: '알림 2' });

  assert.strictEqual(Engine.getUnreadCount(), 2, '미확인 알림 수는 2개여야 함');

  Engine.markAllAsRead();
  assert.strictEqual(Engine.getUnreadCount(), 0, 'markAllAsRead 호출 후 미확인 수는 0개여야 함');
}

// 5. 레거시 settings.* 플래그와 notifications.* 플래그 양방향 동기화 검증
{
  global.state.profile.settings = {
    notifDm: false,
    notifCheers: true,
    notifications: {}
  };
  const cfg = Engine.getNotifConfig();
  assert.strictEqual(cfg.dmMessages, false, 'settings.notifDm:false가 notifications.dmMessages에 반영되어야 함');
  assert.strictEqual(cfg.cheerActivities, true, 'settings.notifCheers:true가 notifications.cheerActivities에 반영되어야 함');
}

console.log('[TEST] global-notification-suite.test.js: all assertions completed.');
