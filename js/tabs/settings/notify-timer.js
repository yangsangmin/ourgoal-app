/**
 * OurGoal Notify Timer (설정 — 탭이 열려 있을 때의 체크인 알림 시계·알림 띠)
 *
 * 「Notifications (best-effort, tab must be open)」 묶음 전체: 체크인 알림 시각마다 20초 간격으로 확인해 알림·띠를 띄우는 시계(setupNotifyTimer)와 앱 안 알림 띠(showNotifyBanner — #notifyBannerSlot, 「기록하기」 누르면 홈 기록 입력칸으로).
 * 게스트도 설정 「알림」 스위치(setupNotifyTimer)와 「테스트 알림」 단추(showNotifyBanner)로 닿는다. 시계가 체크인 시각에 맞춰 울리는 경로는 그 시각까지 기다려야 해서(법정 시험 한 번 3분) 화면 시나리오로 잴 수 없다.
 * #TASK-ES-536(인라인 3단계 Z3 — 알림·시간·주소): index.html 인라인 IIFE 의 구간(이전 전 13491~13510 · 13511~13521줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 13491~13510줄(#TASK-ES-536 생성기 표지) ---- */
  /* ============ Notifications (best-effort, tab must be open) ============ */
  function setupNotifyTimer(){
    if(L.state.notifyTimer){ clearInterval(L.state.notifyTimer); L.state.notifyTimer = null; }
    if(!L.state.profile.settings.notify) return;
    L.state.notifyTimer = setInterval(function(){
      var now = new Date();
      if(L.isWithinDND(now, L.state.profile.settings)) return;
      var hhmm = L.pad(now.getHours())+':'+L.pad(now.getMinutes());
      var todayKey = L.dateKey(L.nowISO());
      var slotKey = todayKey+'_'+hhmm;
      if(L.state.profile.settings.checkinTimes.indexOf(hhmm)!==-1 && !L.state.notifiedSlots[slotKey]){
        L.state.notifiedSlots[slotKey] = true;
        var msg = L.generateDynamicNotification(L.state.profile);
        if('Notification' in window && Notification.permission==='granted'){
          new Notification('아워골', { body: msg });
        }
        showNotifyBanner(msg);
      }
    }, 20000);
  }
  /* ---- 이전 전 index.html 13511~13521줄(#TASK-ES-536 생성기 표지) ---- */
  function showNotifyBanner(bodyText){
    var container = document.getElementById('notifyBannerSlot');
    if(!container) return;
    bodyText = bodyText || '지금 뭐 하고 있었어요?';
    container.innerHTML = '<div class="notify-banner"><div class="nb-txt"><b>질문이 도착했어요</b>'+L.escapeHtml(bodyText)+'</div><button id="nbOpen" type="button">기록하기</button></div>';
    document.getElementById('nbOpen').addEventListener('click', function(){
      container.innerHTML = '';
      L.setTab('home');
      document.getElementById('captureInput').focus();
    });
  }

  K.setupNotifyTimer = setupNotifyTimer;
  K.showNotifyBanner = showNotifyBanner;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
