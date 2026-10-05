/**
 * OurGoal Cheer Notify (소통 탭 — 받은 응원 알림 띠)
 *
 * #TASK-ES-432 (인라인 스크립트 세포화 2차): index.html 인라인 IIFE 의 받은 응원 알림 묶음을 동작 그대로 옮겼다.
 *   totalFeedCheers · checkSocialNotifications · showSocialNotifyBanner(이전 전 30818~30850줄)
 * checkSocialNotifications = 앱에 들어올 때(enterApp — 아직 index.html) 내 피드 글 응원 수·마니또 받은 응원 수를 지난번 본 수와 비교해 새 것이 있으면
 * 홈 #socialNotifySlot 에 「응원이 도착했어요」 띠를 그린다(「확인하기」 #sbOpen → 소통 탭).
 * 묶음을 통째로(구획 주석 포함) 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ============ 받은 응원 알림 (실제 내 게시물 응원 수 + 마니또 받은 응원함) ============ */
  function totalFeedCheers(){
    var myPosts = (L.FEED_POSTS_CACHE || []).filter(function(p){ return p.user_id === L.state.profile.id; });
    var sum = 0;
    myPosts.forEach(function(p){ sum += (p.cheers_count || 0); });
    return sum;
  }
  function checkSocialNotifications(){
    var s = L.state.profile.settings;
    if(!s.social) s.social = { cheersSeen:0, manitoSeen:0 };
    var cheerTotal = totalFeedCheers();
    var manitoTotal = L.manitoState().joined ? L.manitoInbox().length : 0;
    var newCheers = Math.max(0, cheerTotal - s.social.cheersSeen);
    var newManito = Math.max(0, manitoTotal - s.social.manitoSeen);
    s.social.cheersSeen = cheerTotal;
    s.social.manitoSeen = manitoTotal;
    if(newCheers > 0 || newManito > 0){
      showSocialNotifyBanner(newCheers, newManito);
      L.saveProfile();
    }
  }
  function showSocialNotifyBanner(newCheers, newManito){
    var container = document.getElementById('socialNotifySlot');
    if(!container) return;
    var parts = [];
    if(newCheers > 0) parts.push('내 기록에 응원 '+newCheers+'개');
    if(newManito > 0) parts.push('마니또 응원 '+newManito+'개');
    container.innerHTML = '<div class="notify-banner"><div class="nb-txt"><b>응원이 도착했어요</b>'+parts.join(' · ')+'</div><button id="sbOpen" type="button">확인하기</button></div>';
    document.getElementById('sbOpen').addEventListener('click', function(){
      container.innerHTML = '';
      L.setTab('comm');
    });
  }

  K.totalFeedCheers = totalFeedCheers;
  K.checkSocialNotifications = checkSocialNotifications;
  K.showSocialNotifyBanner = showSocialNotifyBanner;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
