/**
 * OurGoal Notify Soft Ask (설정 탭 — 웹 알림 허용 먼저 묻기 창)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G166.
 *   옮긴 선언(이전 전 줄): openNotificationSoftAskModal(33240~33287)
 * openNotificationSoftAskModal = 브라우저 알림 권한을 묻기 전에 앱 창으로 먼저 물어본다(TASK-RD-T020).
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ============ 웹알림 소프트 애스크 (TASK-RD-T020) ============ */
  function openNotificationSoftAskModal(){
    return new Promise(function(resolve){
      if(!('Notification' in window)){
        resolve(false);
        return;
      }
      if(Notification.permission === 'granted'){
        resolve(true);
        return;
      }
      if(Notification.permission === 'denied'){
        L.toast('브라우저 설정에서 알림 권한을 허용해주세요');
        resolve(false);
        return;
      }
      L.openModal(
        '<div class="soft-ask-card">' +
          '<div class="soft-ask-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div>' +
          '<h3>스트릭을 안전하게 지켜드릴까요?</h3>' +
          '<p class="muted" style="margin:6px 0 0;font-size:.875rem;line-height:1.45;">' +
            '저녁 8시까지 체크인이 없을 때 긴급 알림으로 연속 불꽃이 꺼지지 않게 지켜드려요.<br>' +
            '일요일 저녁에는 주간 성취 리캡도 전해드려요.' +
          '</p>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" id="softAskDismiss" type="button">나중에</button>' +
          '<button class="btn btn-primary" id="softAskAllow" type="button">알림 켜고 보호받기</button>' +
        '</div>',
        function(sheet){
          sheet.querySelector('#softAskDismiss').addEventListener('click', function(){
            L.closeModal();
            resolve(false);
          });
          sheet.querySelector('#softAskAllow').addEventListener('click', async function(){
            L.closeModal();
            try {
              var perm = await Notification.requestPermission();
              resolve(perm === 'granted');
            } catch(e){
              resolve(false);
            }
          });
        }
      );
    });
  }

  K.openNotificationSoftAskModal = openNotificationSoftAskModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
