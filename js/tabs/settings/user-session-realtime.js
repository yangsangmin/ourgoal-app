/**
 * OurGoal User Session Realtime (설정 — 원격 로그아웃 실시간 채널 구독)
 *
 * setupUserSessionRealtime — 로그인한 사용자의 세션 채널(user_session_<사용자 id>)을 구독한다. 이미 열린 채널(USER_SESSION_CHANNEL)이 있으면 닫고 다시 연다.
 * 다른 기기에서 「모든 기기 원격 로그아웃」 방송(remote_logout)이 오면, 남기기로 한 기기가 이 기기가 아닐 때 로그아웃한다.
 * #TASK-ES-653(세션 실시간 채널 구독 함수 이전 — setupUserSessionRealtime): index.html 인라인 IIFE 의 구간(이전 전 3272~3289줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 3272~3289줄(#TASK-ES-653 생성기 표지) ---- */
  /* [#TASK-ES-545] setupRealtimeChannelsOnce → js/tabs/goals/team-comments.js 로 옮김(인라인 3단계 Z2 팀·소통 — 팀 목표 댓글·차단·목표 순서 — 앞 주석 포함) */
  function setupUserSessionRealtime(){
    if(!L.sb || typeof L.sb.channel !== 'function' || !L.state.profile || !L.state.profile.id) return;
    if(L.USER_SESSION_CHANNEL){
      try{ L.sb.removeChannel(L.USER_SESSION_CHANNEL); }catch(e){}
      L.USER_SESSION_CHANNEL = null;
    }
    var chName = 'user_session_' + L.state.profile.id;
    L.USER_SESSION_CHANNEL = L.sb.channel(chName, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'remote_logout' }, async function(msg){
        var payload = (msg && msg.payload) || {};
        var myDev = L.getDeviceId();
        if(payload.keptDeviceId && payload.keptDeviceId !== myDev){
          await L.performLogout('다른 기기에서 모든 기기 원격 로그아웃이 실행되어 로그아웃되었습니다.');
        }
      })
      .subscribe();
  }

  K.setupUserSessionRealtime = setupUserSessionRealtime;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
