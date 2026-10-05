/**
 * OurGoal App Defaults (설정 탭 — 설정 기본값)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   defaultSettings — 「Storage (Supabase: goals & checkins; localStorage: settings)」(이전 전 3000~3017줄, 구획 주석 포함)
 * 처음 쓰는 사람의 설정 기본값(알림·테마·글자 크기 등)을 만든다.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ============ Storage (Supabase: goals & checkins; localStorage: settings) ============ */
  function defaultSettings(){
    return {
      checkinTimes: ["10:00","15:00","21:00"], notify:false, exportFormat:"csv", aiProvider:"gemini", geminiKey:"", geminiModel:"gemini-3.1-flash-lite",
      notionSync:false, notionWebhookUrl:"", notionApiKey:"", notionDatabaseId:"", notionAutoPush:false, autoUpdateSuggest:true, virtualCheerEnabled:false,
      gcalClientId:"", gcalSync:{ goals:{}, ms:{}, imported:{} },
      googleCalendarConnected:false, googleCalendarEmail:"", gcalAutoSync:true,
      privacy: { goals:"private", calendar:"private", records:"private", stats:"private" },
      theme: "focus-sanctuary", fontSize: "normal", dataSaver: false, twoFactorAuth: false,
      quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "08:00",
      notifTeamVerify: true, notifCheers: true, notifDday: true, notifStreak: true,
      onlineStatus: true, customSchedules: [],
      customFeedbackPrompt:"", customFeedbackActive:false, goalStatusSummaries:{}, feedReactions:{}, feedComments:{}, myFeedPosts:[], contentReports:{}, todayMissions:{},
      streakFreeze:{ available:1, usedDates:[], grantedTier:0 }, social:{ cheersSeen:0, manitoSeen:0 }, xp:{ total:0, log:[] },
      highContrast: false, challenges: [],
      hasSeenGuide:false, maxBaseCrafts:3, bonusCraftCredits:0, lastStreakAwarded:0
    };
  }

  K.defaultSettings = defaultSettings;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
