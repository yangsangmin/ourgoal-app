/* 아워골 UI v2 — 화면 상호작용 보조 (앱 로직과 독립, 전역 상태를 건드리지 않는다)
 * 1) 백투탑  2) 당겨서 새로고침  3) 앱바 스크롤 헤어라인  4) 하단 탭 햅틱  5) 기록 카드 스와이프 삭제  6) 눌림 피드백
 */
(function () {
  'use strict';
  var d = document;
  var vibrate = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  /* 1) 백투탑 */
  var btt = d.getElementById('backToTopBtn');
  var topbar = d.querySelector('#appShell .topbar');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || d.documentElement.scrollTop || 0;
    if (btt) btt.classList.toggle('show', y > 600);
    if (topbar) topbar.classList.toggle('scrolled', y > 4);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (btt) btt.addEventListener('click', function () { vibrate(8); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* 2) 당겨서 새로고침 (홈·소통에서 맨 위에서 아래로 80px 이상 당기면 새로고침) */
  var ptr = d.getElementById('ptrIndicator');
  var startY = null, pulling = false, armed = false;
  d.addEventListener('touchstart', function (e) {
    if (!d.getElementById('appShell') || !d.getElementById('appShell').classList.contains('active')) return;
    var overlay = d.getElementById('modalOverlay');
    if (overlay && overlay.classList.contains('active')) return;
    if ((window.scrollY || 0) > 0) return;
    var active = d.querySelector('.screen.active');
    if (!active || !/screen-(home|comm)/.test(active.id)) return;
    startY = e.touches[0].clientY; pulling = true; armed = false;
  }, { passive: true });
  d.addEventListener('touchmove', function (e) {
    if (!pulling || startY === null) return;
    var dy = e.touches[0].clientY - startY;
    if (dy > 80 && !armed) { armed = true; if (ptr) ptr.classList.add('armed'); vibrate(10); }
    if (dy <= 80 && armed) { armed = false; if (ptr) ptr.classList.remove('armed'); }
  }, { passive: true });
  d.addEventListener('touchend', function () {
    if (!pulling) return;
    pulling = false; startY = null;
    if (armed) { armed = false; if (ptr) { ptr.classList.remove('armed'); ptr.classList.add('loading'); } setTimeout(function () { location.reload(); }, 250); }
  }, { passive: true });

  /* 3·4) 하단 탭 햅틱 + 스크롤 맨 위로 */
  d.addEventListener('click', function (e) {
    var nav = e.target.closest && e.target.closest('.navbtn');
    if (nav) { vibrate(8); if (nav.classList.contains('active')) window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, true);

  /* 5) 기록 카드 스와이프 → 삭제 버튼 노출 (기존 [data-recdel] 핸들러를 그대로 호출) */
  var swipeEl = null, sx = 0, sy = 0, dx = 0, swiping = false;
  d.addEventListener('touchstart', function (e) {
    var card = e.target.closest && e.target.closest('.rec-card');
    if (!card || !card.querySelector('[data-recdel]')) return;
    if (e.target.closest('button, input, textarea, a')) return;
    swipeEl = card; sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; swiping = false;
  }, { passive: true });
  d.addEventListener('touchmove', function (e) {
    if (!swipeEl) return;
    var mx = e.touches[0].clientX - sx, my = e.touches[0].clientY - sy;
    if (!swiping && Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my) * 1.5) swiping = true;
    if (!swiping) return;
    dx = Math.max(-88, Math.min(0, mx));
    swipeEl.style.transform = 'translateX(' + dx + 'px)';
    swipeEl.style.transition = 'none';
  }, { passive: true });
  d.addEventListener('touchend', function () {
    if (!swipeEl) return;
    var el = swipeEl; swipeEl = null;
    el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)';
    if (swiping && dx < -60) {
      el.style.transform = 'translateX(-88px)';
      var act = el.querySelector('.swipe-del');
      if (!act) {
        act = d.createElement('button'); act.type = 'button'; act.className = 'swipe-del'; act.textContent = '삭제'; act.setAttribute('aria-label', '기록 삭제');
        act.addEventListener('click', function (ev) { ev.stopPropagation(); vibrate(12); var b = el.querySelector('[data-recdel]'); if (b) b.click(); });
        el.appendChild(act);
      }
      vibrate(10);
      var close = function (ev) { if (ev && el.contains(ev.target)) return; el.style.transform = ''; d.removeEventListener('touchstart', close, true); };
      setTimeout(function () { d.addEventListener('touchstart', close, true); }, 50);
    } else {
      el.style.transform = '';
    }
    swiping = false; dx = 0;
  }, { passive: true });

  /* 6) 주 버튼 눌림 햅틱 & [Phase 0] 터치 타겟 햅틱 연동 */
  d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn-primary, .mz-btn, .switch, .goal-chip, .comm-subtab, .format-opt, .touch-target-44, .btn-touch-active, .action-chip');
    if (b) vibrate(12);
  }, { passive: true });

  /* [Phase 0] 전역 12ms 햅틱 촉각 손맛 유틸리티 */
  window.triggerHaptic = function (ms) { vibrate(ms || 12); };

  /* 7) [Phase 1: #UIUX-15] 네트워크 상태 인디케이터 */
  function initNetworkWatcher() {
    function updateNet(online) {
      var banner = d.getElementById('networkStatusBanner');
      var msg = d.getElementById('networkStatusMsg');
      if (!banner) return;
      if (!online) {
        banner.className = 'network-status-banner';
        if (msg) msg.textContent = '📡 오프라인 모드 — 데이터가 기기에 안전하게 보관됩니다';
        banner.style.display = 'flex';
      } else {
        banner.className = 'network-status-banner online-recovered';
        if (msg) msg.textContent = '⚡ 인터넷이 연결되었습니다 (원격 동기화 완료)';
        banner.style.display = 'flex';
        setTimeout(function () {
          if (banner.classList.contains('online-recovered')) banner.style.display = 'none';
        }, 2200);
      }
    }
    window.addEventListener('offline', function () { updateNet(false); });
    window.addEventListener('online', function () { updateNet(true); });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      updateNet(false);
    }
  }
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', initNetworkWatcher);
  } else {
    initNetworkWatcher();
  }

  /* 8) [Phase 1: #UIUX-16] 중첩 아코디언 모션 부드러운 높이 토글 헬퍼 */
  window.toggleSmoothAccordion = function (wrapEl) {
    if (!wrapEl) return;
    vibrate(10);
    wrapEl.classList.toggle('open');
  };

  /* 9) [Phase 2: #UIUX-18] 바텀시트 스와이프 다운 닫기 제스처 */
  var sheetTouchStartY = null, sheetTouchCurrentY = null, sheetEl = null, isSheetSwiping = false;
  d.addEventListener('touchstart', function (e) {
    var overlay = d.getElementById('modalOverlay');
    if (!overlay || !overlay.classList.contains('active')) return;
    var sheet = e.target.closest && e.target.closest('.modal-sheet');
    if (!sheet) return;
    if (sheet.scrollTop > 0) return;
    if (e.target.closest('button, input, textarea, select, a')) return;

    sheetEl = sheet;
    sheetTouchStartY = e.touches[0].clientY;
    sheetTouchCurrentY = sheetTouchStartY;
    isSheetSwiping = false;
  }, { passive: true });

  d.addEventListener('touchmove', function (e) {
    if (!sheetEl || sheetTouchStartY === null) return;
    sheetTouchCurrentY = e.touches[0].clientY;
    var dy = sheetTouchCurrentY - sheetTouchStartY;
    if (dy > 8) {
      isSheetSwiping = true;
      sheetEl.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
      sheetEl.style.transition = 'none';
    }
  }, { passive: true });

  d.addEventListener('touchend', function () {
    if (!sheetEl || sheetTouchStartY === null) return;
    var dy = (sheetTouchCurrentY || 0) - sheetTouchStartY;
    var target = sheetEl;
    sheetEl = null; sheetTouchStartY = null; sheetTouchCurrentY = null;
    if (isSheetSwiping && dy > 70) {
      vibrate(12);
      target.style.transition = 'transform .2s cubic-bezier(0.16, 1, 0.3, 1)';
      target.style.transform = 'translateY(100%)';
      setTimeout(function () {
        if (typeof window.closeModal === 'function') window.closeModal();
      }, 180);
    } else {
      target.style.transition = 'transform .2s cubic-bezier(0.16, 1, 0.3, 1)';
      target.style.transform = '';
    }
    isSheetSwiping = false;
  }, { passive: true });
})();

