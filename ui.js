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

  /* 6) 주 버튼 눌림 햅틱 */
  d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn-primary, .mz-btn, .switch, .goal-chip, .comm-subtab, .format-opt');
    if (b) vibrate(6);
  }, { passive: true });
})();
