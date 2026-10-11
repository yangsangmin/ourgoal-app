/**
 * OurGoal Google Calendar Token Save (기관 — 구글 캘린더 토큰 저장)
 *
 * saveGoogleToken — 구글 캘린더 접근 토큰을 지금 로그인한 계정(uid) 키에만 저장한다. 둘째 인자(이메일)는 arguments[1] 로 읽는다.
 * 계정 격리 도우미(키 이름·주인 확인·공용 키 정리)는 js/core/gcal-token.js, 토큰 받기·복원·동기화는 js/core/gcal-sync.js 가 맡는다. 이 세포는 저장 한 가지만 한다.
 * #TASK-ES-659(구글 캘린더 토큰 저장 함수 이전 — saveGoogleToken): index.html 인라인 IIFE 의 구간(이전 전 2947~2973줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 2947~2973줄(#TASK-ES-659 생성기 표지) ---- */
  /* [#TASK-ES-575] calendarAvailable → js/core/calendar-availability.js 로 옮김(캘린더 사용 가능 여부 판별 책임 분열 — 앞 주석 포함) */
  /* [#TASK-ES-482] effectiveGcalClientId · isGoogleCalendarConnected · tryConnectGoogleCalendar · openGoogleCalendarConnectModal · fetchGoogleCalendarEvents · syncAllToGoogleCalendar · nextDayISO → js/core/gcal-sync.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */
  function saveGoogleToken(tokenObj){
    var optEmail = arguments[1];
    if(!tokenObj || !tokenObj.accessToken) return;
    try {
      // [#TASK-ES-345 CAL-02] 현재 uid 키에만 저장한다. 계정 공용 _last 토큰·이메일 키는 쓰지 않는다.
      var uid = L.gcalCurrentUid();
      if(L.state._gcalOwnerUid !== uid){
        // 다른 계정의 일정 캐시가 메모리에 남아 있으면 새 계정 토큰과 섞이지 않게 버린다.
        L.state.gcalEventsCache = null;
        L.state._lastExpiredGoogleToken = null;
        L.state._gcalOwnerUid = uid;
      }
      var emailVal = optEmail || (L.state.profile && L.state.profile.settings && L.state.profile.settings.googleCalendarEmail) || '';
      var payload = JSON.stringify({
        accessToken: tokenObj.accessToken,
        expiresAt: tokenObj.expiresAt || (Date.now() + 3300000),
        email: emailVal,
        ownerUid: uid,
        updatedAt: Date.now()
      });
      localStorage.setItem('ourgoal_gcal_token_v1_' + uid, payload);
      L.purgeLegacySharedGcalKeys();
      sessionStorage.setItem('ourgoal_google_token', tokenObj.accessToken);
    } catch(e){}
  }

  K.saveGoogleToken = saveGoogleToken;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
