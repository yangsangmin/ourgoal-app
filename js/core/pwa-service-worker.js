/**
 * OurGoal PWA Service Worker (기관 — 서비스 워커 등록 · 새 버전 알림 · 잠금화면 알림 단추 신호 받기)
 *
 * bindServiceWorker — 서비스 워커(/sw.js)를 등록하고, 새 버전이 깔리면 알림 글을 띄우며, 잠금화면 알림 단추(체크인 · 일정)가 보낸 신호를 받아 체크인 입력칸(#captureInput)에 초점을 주거나 일정 탭으로 옮긴다.
 * #TASK-ES-638(시동 배선 감싸기 1차 — 설정 시동 연결 · AI 목표 어시스턴트 서랍 · 바깥 부품 연결 · 서비스 워커): index.html 인라인 IIFE 의 구간(이전 전 5186~5216줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5186~5216줄(#TASK-ES-638 생성기 표지) ---- */
  function bindServiceWorker() { /* [#TASK-ES-638] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/sw.js').then(function(reg){
        reg.addEventListener('updatefound', function(){
          var newWorker = reg.installing;
          if(newWorker){
            newWorker.addEventListener('statechange', function(){
              if(newWorker.state === 'installed' && navigator.serviceWorker.controller && typeof L.toast === 'function'){
                L.toast('새 버전으로 업데이트되었어요! 새로고침하면 즉시 반영돼요.');
              }
            });
          }
        });
      }).catch(function(){});
    });
    navigator.serviceWorker.addEventListener('message', function(event){
      if(event.data && event.data.type === 'LOCKSCREEN_ACTION'){
        if(event.data.action === 'action-checkin'){
          var capInput = document.getElementById('captureInput');
          if(capInput){
            capInput.focus();
            capInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if(typeof L.openRecordModal === 'function'){
            L.openRecordModal();
          }
        } else if(event.data.action === 'action-calendar'){
          if(typeof L.setTab === 'function') L.setTab('calendar');
        }
      }
    });
  }
  } /* bindServiceWorker */

  K.bindServiceWorker = bindServiceWorker;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalUiHelpers;
  if (K) R.provide('core/pwa-service-worker', {
    bindServiceWorker: K.bindServiceWorker
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
