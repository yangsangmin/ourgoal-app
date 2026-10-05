/**
 * OurGoal PWA Install Guide (설정 — 홈 화면 추가 안내·키보드 가림 방지)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   renderIosPwaBanner · openIosPwaInstallGuideModal(이전 전 13018~13155줄 · 구획 「iOS 사파리 홈 화면 추가 안내 배너 & 실시간 알림 가이드 (#TASK-ES-234)」)
 *   initKeyboardShield(이전 전 22959~22978줄 · 구획 「[UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝」)
 *   openPwaInstallGuideModal(이전 전 22985~22996줄 · 구획 「[UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝」)
 *   closePwaInstallGuideModal(이전 전 22999~23003줄 · 구획 「[UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝」)
 *   switchPwaOsTab(이전 전 23006~23023줄 · 구획 「[UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝」)
 *   confirmPwaInstall(이전 전 23026~23033줄 · 구획 「[UI/UX 프레임워크 개편 Phase 7] 모바일 하드웨어 인터랙션 & 사용성 하드닝」)
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
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  function renderIosPwaBanner(){
    var slot = document.getElementById('iosPwaSlot');
    if(!slot) return;
    var isIos = (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || ''));
    var isStandalone = (typeof window !== 'undefined' && ((window.navigator && window.navigator.standalone) || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)));
    var dismissed = false;
    try { dismissed = (typeof localStorage !== 'undefined' && localStorage.getItem('ios_pwa_dismissed') === '1'); } catch(e){}
    if(!isIos || isStandalone || dismissed){
      slot.innerHTML = '';
      return;
    }
    slot.innerHTML = '<div class="ios-pwa-banner" style="margin:6px 0 12px;padding:14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:16px;animation:fadein .25s;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="font-weight:700;font-size:0.9375rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.1rem;">📲</span>' +
          '<span>아이폰 Safari 홈 화면에 추가 & 실시간 알림</span>' +
        '</div>' +
        '<button id="iosPwaDismissBtn" type="button" style="background:none;border:none;color:var(--ink-muted);font-size:1.1rem;cursor:pointer;padding:6px;min-width:32px;min-height:32px;display:flex;align-items:center;justify-content:center;" aria-label="닫기">✕</button>' +
      '</div>' +
      '<p style="font-size:0.8125rem;color:var(--ink-muted);margin:0 0 10px;line-height:1.45;">' +
        '홈 화면에 추가하시면 앱스토어 설치 없이 <b>전체화면 앱</b>과 <b>100% 실시간 리마인더 푸시</b>를 받아보실 수 있습니다.' +
      '</p>' +
      '<div class="ios-pwa-steps" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;">' +
        '<div class="ios-pwa-step-card" style="background:var(--surface);padding:8px 6px;border-radius:10px;border:1px solid var(--rule);text-align:center;">' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--primary);margin-bottom:2px;">1단계</div>' +
          '<div style="font-size:0.75rem;color:var(--ink);line-height:1.3;">하단 중앙<br><b>[공유 ⎋]</b> 탭</div>' +
        '</div>' +
        '<div class="ios-pwa-step-card" style="background:var(--surface);padding:8px 6px;border-radius:10px;border:1px solid var(--rule);text-align:center;">' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--primary);margin-bottom:2px;">2단계</div>' +
          '<div style="font-size:0.75rem;color:var(--ink);line-height:1.3;">메뉴에서<br><b>[홈 화면에 추가 +]</b></div>' +
        '</div>' +
        '<div class="ios-pwa-step-card" style="background:var(--surface);padding:8px 6px;border-radius:10px;border:1px solid var(--rule);text-align:center;">' +
          '<div style="font-size:0.75rem;font-weight:700;color:var(--primary);margin-bottom:2px;">3단계</div>' +
          '<div style="font-size:0.75rem;color:var(--ink);line-height:1.3;">우측 상단<br><b>[추가]</b> 완료!</div>' +
        '</div>' +
      '</div>' +
      '<button id="btnOpenIosPwaGuideModal" type="button" class="btn btn-secondary btn-block" style="font-size:0.8125rem;padding:8px 12px;width:100%;min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<span>📖 자세한 설치 & 푸시 알림 가이드 보기</span>' +
      '</button>' +
    '</div>';
    var closeBtn = document.getElementById('iosPwaDismissBtn');
    if(closeBtn){
      closeBtn.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        try { localStorage.setItem('ios_pwa_dismissed', '1'); } catch(e){}
        slot.innerHTML = '';
      };
    }
    var guideBtn = document.getElementById('btnOpenIosPwaGuideModal');
    if(guideBtn){
      guideBtn.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
        openIosPwaInstallGuideModal();
      };
    }
  }

  function openIosPwaInstallGuideModal(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
    var modalHtml = '<div style="padding:4px 0 12px;">' +
      '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:2.4rem;margin-bottom:6px;">📲</div>' +
        '<h3 style="font-size:1.15rem;font-weight:800;color:var(--ink);margin:0 0 4px;">아이폰(iOS Safari) 앱 설치 가이드</h3>' +
        '<p style="font-size:0.8125rem;color:var(--ink-muted);margin:0;">앱스토어 다운로드 없이 3초 만에 홈 화면에 추가하고 실시간 푸시를 받아보세요</p>' +
      '</div>' +
      '<div style="background:var(--surface-2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:14px;">' +
        '<div style="font-size:0.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
          '<span>✨ 왜 홈 화면에 추가해야 하나요?</span>' +
        '</div>' +
        '<ul style="margin:0;padding-left:18px;font-size:0.8125rem;color:var(--ink);line-height:1.6;">' +
          '<li><b>iOS 16.4+ 정식 지원:</b> 사파리 웹 브라우저 대신 홈 화면 앱으로 실행할 때만 실시간 Web Push 리마인더가 완벽 작동합니다.</li>' +
          '<li><b>풀스크린 몰입 경험:</b> 주소창이나 하단 툴바 없이 네이티브 앱처럼 쾌적하게 사용 가능합니다.</li>' +
          '<li><b>초고속 로딩:</b> 오프라인 캐시가 적용되어 배터리와 데이터 소모를 획기적으로 줄여줍니다.</li>' +
        '</ul>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="font-size:0.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;">📌 3초 설치 순서</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:10px;background:var(--surface);padding:10px;border-radius:10px;border:1px solid var(--rule);">' +
            '<span style="background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">1</span>' +
            '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">Safari 브라우저 하단 툴바의 <b>공유 버튼(⎋ 네모 위 화살표)</b>을 탭합니다.</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;background:var(--surface);padding:10px;border-radius:10px;border:1px solid var(--rule);">' +
            '<span style="background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">2</span>' +
            '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">공유 시트 목록을 아래로 스크롤하여 <b>[홈 화면에 추가]</b>를 선택합니다.</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;background:var(--surface);padding:10px;border-radius:10px;border:1px solid var(--rule);">' +
            '<span style="background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">3</span>' +
            '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">우측 상단의 <b>[추가]</b>를 누르면 아이폰 바탕화면에 아워골 앱 아이콘이 생성됩니다!</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<button id="btnRequestIosPushPermission" type="button" class="btn btn-primary btn-block" style="font-size:0.875rem;padding:10px 14px;width:100%;min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span>🔔 푸시 알림 권한 지금 요청</span>' +
        '</button>' +
        '<div id="iosPushPermissionStatus" style="font-size:0.75rem;color:var(--ink-muted);text-align:center;margin-top:6px;">' +
          '현재 알림 상태: ' + (typeof Notification !== 'undefined' ? (Notification.permission === 'granted' ? '✅ 허용됨' : (Notification.permission === 'denied' ? '🚫 차단됨 (iOS 설정 > Safari에서 변경)' : '⏳ 요청 대기')) : '지원 환경 확인 중') +
        '</div>' +
      '</div>' +
      '<button id="btnCloseIosPwaGuideModal" type="button" class="btn btn-secondary btn-block" style="min-height:44px;width:100%;">닫기</button>' +
    '</div>';

    L.openModal(modalHtml, function(sheet){
      var closeBtn = sheet.querySelector('#btnCloseIosPwaGuideModal');
      if(closeBtn){
        closeBtn.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          L.closeModal();
        };
      }
      var pushBtn = sheet.querySelector('#btnRequestIosPushPermission');
      if(pushBtn){
        pushBtn.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
          if(typeof Notification === 'undefined'){
            L.toast('이 브라우저는 웹 푸시를 지원하지 않습니다.');
            return;
          }
          Notification.requestPermission().then(function(perm){
            var statusEl = sheet.querySelector('#iosPushPermissionStatus');
            if(perm === 'granted'){
              L.toast('🔔 푸시 알림이 활성화되었습니다!');
              if(statusEl) statusEl.textContent = '현재 알림 상태: ✅ 허용됨';
            } else if(perm === 'denied'){
              L.toast('푸시 알림 권한이 차단되었습니다. 설정에서 허용해주세요.');
              if(statusEl) statusEl.textContent = '현재 알림 상태: 🚫 차단됨 (설정에서 변경)';
            } else {
              L.toast('푸시 알림 권한 요청이 보류되었습니다.');
            }
          }).catch(function(err){
            console.error('[iOS PWA Push]', err);
            L.toast('푸시 알림 권한 요청 중 오류가 발생했습니다.');
          });
        };
      }
    });
  }

  // 1. [#UIUX-57] [KEYBOARD-SHIELD] 가상 키보드 가림 방화벽
  function initKeyboardShield(){
    if(!window.visualViewport) return;
    function handleViewportChange(){
      var activeEl = document.activeElement;
      if(activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')){
        var offset = window.innerHeight - window.visualViewport.height;
        if(offset > 120){
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          document.body.classList.add('keyboard-shield-active');
        } else {
          document.body.classList.remove('keyboard-shield-active');
        }
      } else {
        document.body.classList.remove('keyboard-shield-active');
      }
    }
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
  }

  // 2. [#UIUX-62] [PWA-INSTALL] 크롬/사파리 홈화면 추가 3단계 카드뉴스 인앱 안내 모달
  function openPwaInstallGuideModal(){
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    var modal = document.getElementById('modalPwaInstallGuide');
    if(modal) {
      modal.style.display = 'flex';
      // [#TASK-ES-138] 기기 UserAgent 분석 기반 OS 플랫폼 자동 스위칭 (iOS vs Android)
      var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
      var isAndroid = /Android/i.test(ua);
      switchPwaOsTab(isAndroid ? 'android' : 'ios');
    }
  }

  function closePwaInstallGuideModal(){
    L.triggerHapticFeedback(12);
    var modal = document.getElementById('modalPwaInstallGuide');
    if(modal) modal.style.display = 'none';
  }

  function switchPwaOsTab(os){
    L.triggerHapticFeedback(12);
    var btnIos = document.getElementById('btnPwaOsIos');
    var btnAndroid = document.getElementById('btnPwaOsAndroid');
    var iosSteps = document.getElementById('pwaGuideIosSteps');
    var androidSteps = document.getElementById('pwaGuideAndroidSteps');
    if(os === 'ios'){
      if(btnIos) btnIos.classList.add('active');
      if(btnAndroid) btnAndroid.classList.remove('active');
      if(iosSteps) iosSteps.style.display = 'grid';
      if(androidSteps) androidSteps.style.display = 'none';
    } else {
      if(btnIos) btnIos.classList.remove('active');
      if(btnAndroid) btnAndroid.classList.add('active');
      if(iosSteps) iosSteps.style.display = 'none';
      if(androidSteps) androidSteps.style.display = 'grid';
    }
  }

  function confirmPwaInstall(){
    L.triggerHapticFeedback(12);
    closePwaInstallGuideModal();
    try {
      localStorage.setItem('ourgoal_pwa_guide_viewed', 'true');
    } catch(e){}
    if(typeof L.toast === 'function') L.toast('언제든 홈화면 아이콘으로 빠르게 접속하세요 📱✨');
  }

  K.renderIosPwaBanner = renderIosPwaBanner;
  K.openIosPwaInstallGuideModal = openIosPwaInstallGuideModal;
  K.initKeyboardShield = initKeyboardShield;
  K.openPwaInstallGuideModal = openPwaInstallGuideModal;
  K.closePwaInstallGuideModal = closePwaInstallGuideModal;
  K.switchPwaOsTab = switchPwaOsTab;
  K.confirmPwaInstall = confirmPwaInstall;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
