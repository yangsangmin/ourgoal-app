/**
 * OurGoal First Cheer (소통 — 신규 유저 첫 응원 전달)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   triggerFirstCheerResponse · scheduleCheerDelivery(이전 전 15212~15248줄, 구획 주석 포함 · 구획 「신규 유저 온보딩: 가상 페르소나 3분 내 맞춤 응원 (TASK-OG-002, TASK-ES-332)」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ============ 신규 유저 온보딩: 가상 페르소나 3분 내 맞춤 응원 (TASK-OG-002, TASK-ES-332) ============ */
  function triggerFirstCheerResponse(goal, checkinText){
    // [TASK-ES-332] 헌법 제4조 제1항 1호/7호 및 결심 490108 준수: 가짜 봇 응원 전면 차단
    if(!L.state.profile || !L.state.profile.settings || L.state.profile.settings.virtualCheerEnabled === false) return;
    var isLocalDev = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
    if(!isLocalDev){
      var matched = (typeof L.SIM_PERSONAS !== 'undefined' && L.SIM_PERSONAS[0]);
      if(!matched) return;
      var cheerObj = {
        personaName: matched.name,
        avatar: matched.avatar,
        message: matched.name + '님이 첫 체크인을 격려합니다'
      };
      scheduleCheerDelivery(cheerObj);
      return;
    }
  }

  function scheduleCheerDelivery(cheer){
    // 신규 온보딩 체감: 4초 뒤 도착하여 유저에게 환영 메시지 전달
    setTimeout(function(){
      var msg = cheer.message || (cheer.personaName + '님이 첫 체크인을 응원합니다!');
      L.toast('🔥 ' + msg, 5000);
      if(window.OurgoalNotifyEngine && typeof window.OurgoalNotifyEngine.dispatchGlobalNotification === 'function'){
        window.OurgoalNotifyEngine.dispatchGlobalNotification({
          type: 'cheer',
          title: '🔥 ' + (cheer.personaName ? cheer.personaName + '님의 응원' : '동류의 응원'),
          body: msg,
          senderName: cheer.personaName || '동류 러너',
          targetTab: 'comm',
          icon: '🔥'
        });
      } else if('Notification' in window && Notification.permission==='granted'){
        new Notification('아워골 · ' + cheer.personaName + '님의 응원', { body: cheer.message });
      }
    }, 4000);
  }

  K.triggerFirstCheerResponse = triggerFirstCheerResponse;
  K.scheduleCheerDelivery = scheduleCheerDelivery;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
