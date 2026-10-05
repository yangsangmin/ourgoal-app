/**
 * OurGoal Web Push (설정 — 앱이 꺼져 있어도 오는 알림 구독·해제)
 *
 * 「Web Push (앱이 꺼져 있어도 오는 알림)」 묶음 전체: VAPID 공개키 변환(urlBase64ToUint8Array)·서버 푸시 구독 등록(syncPushSubscription — 로그인 세션 토큰이 있을 때만 Bearer 로)·구독 해제(removePushSubscription).
 * 서버 구독 등록은 알림 권한 허용 + 로그인 세션이 있어야 돌고, 실제 푸시 도착은 기기에서만 확인된다 — 앱 쪽 요청 모양은 tests/push-subscribe-auth-es400.test.js 가 옮긴 함수 글자를 노드에서 돌려 잰다.
 * #TASK-ES-536(인라인 3단계 Z3 — 알림·시간·주소): index.html 인라인 IIFE 의 구간(이전 전 13522~13530 · 13531~13558 · 13559~13573줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 13522~13530줄(#TASK-ES-536 생성기 표지) ---- */
  /* ============ Web Push (앱이 꺼져 있어도 오는 알림) ============ */
  function urlBase64ToUint8Array(base64String){
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for(var i=0; i<rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
  /* ---- 이전 전 index.html 13531~13558줄(#TASK-ES-536 생성기 표지) ---- */
  async function syncPushSubscription(){
    try{
      if(!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if(!('Notification' in window) || Notification.permission!=='granted') return;
      var pushSubToken = await L.getSupabaseAuthToken(); if(!pushSubToken) return; /* #TASK-ES-400 서버 구독은 로그인 세션 토큰으로만(게스트·세션 없음은 요청 안 함) */
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if(!sub){
        var keyRes = await fetch('/api/vapid-public-key');
        if(!keyRes.ok) return;
        var keyData = await keyRes.json();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
        });
      }
      var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
      await fetch('/api/push-subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + pushSubToken },
        body: JSON.stringify({
          userId: L.state.profile.id,
          subscription: sub.toJSON(),
          checkinTimes: L.state.profile.settings.checkinTimes,
          timezone: timezone
        })
      });
    } catch(e){ console.warn('Web Push 구독 실패:', e); }
  }
  /* ---- 이전 전 index.html 13559~13573줄(#TASK-ES-536 생성기 표지) ---- */
  async function removePushSubscription(){
    try{
      if(!('serviceWorker' in navigator)) return;
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if(!sub) return;
      var endpoint = sub.endpoint;
      await sub.unsubscribe();
      var pushUnsubToken = await L.getSupabaseAuthToken(); if(!pushUnsubToken) return;
      await fetch('/api/push-subscribe', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + pushUnsubToken },
        body: JSON.stringify({ endpoint: endpoint })
      });
    } catch(e){ console.warn('Web Push 구독 해제 실패:', e); }
  }

  K.urlBase64ToUint8Array = urlBase64ToUint8Array;
  K.syncPushSubscription = syncPushSubscription;
  K.removePushSubscription = removePushSubscription;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
