/**
 * OurGoal Core - Toast Channel (공용 토스트 통로 — 능력 ui.toast)
 *
 * #TASK-ES-361 (쪼개는 순서 2번 · 노션 CORE-10): index.html 밖의 js 파일들이 각자 만들던 토스트 연결 통로 6벌
 * (auth-safety toastFn · helpful-reason · reactions · team-invite-comm showToast · team-linked-goals · team-visibility-levels)
 * 을 이 통로 하나로 모은다. 그리는 일은 지금도 index.html 정본 toast()(#toast 요소, 2.2초)가 한다 — 문구·시간·모양 불변.
 *
 *   ui.toast(msg, ...)          화면에 토스트. 정본이 아직 없으면(스크립트 로드 순서·init 전) 대기열에 두었다가
 *                               정본이 생기는 순간(attach 또는 DOMContentLoaded) 차례대로 띄운다 — 메시지를 잃지 않는다.
 *   ui.toast.bind(getOverride)  세포용 토스트 함수를 만든다. getOverride() 가 함수(예: init 으로 넘겨받은 deps.toast)를
 *                               돌려주면 그것을 먼저 쓰고, 없으면 ui.toast. 자기 자신을 다시 부르는 길이 없다(CORE-10 재귀 제거).
 *   attach(fn)                  그리는 함수를 직접 붙인다(시험·향후 js/ui/toast.js). 안 붙이면 index.html 이 단
 *                               window.toast(정본)를 부를 때마다 찾아 쓴다.
 *
 * 전역에 새 이름을 달지 않는다 — 능력 등록부(OurgoalCapabilities) 한 통로로만 노출한다(MODULE-BLUEPRINT 5절).
 */
(function (global) {
  'use strict';

  var CELL = 'core/toast';
  var MAX_QUEUE = 20;
  var FLUSH_GAP_MS = 2400; // 정본 toast 표시 시간(2.2초) 뒤에 다음 것을 띄운다 — 겹쳐 덮지 않게

  var attached = null;
  var queue = [];
  var flushing = false;

  function isChannel(fn) {
    return typeof fn === 'function' && fn.__ourgoalToastChannel === true;
  }

  // 그리는 함수: 직접 붙인 것 → index.html 정본(window.toast). 이 통로가 만든 함수는 고르지 않는다(재귀 차단).
  function renderer() {
    if (typeof attached === 'function') return attached;
    var g = global && global.toast;
    if (typeof g === 'function' && !isChannel(g)) return g;
    return null;
  }

  function draw(fn, args) {
    try {
      return fn.apply(null, args);
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[ui.toast] 토스트 표시 실패:', e && e.message);
    }
  }

  function flush() {
    if (flushing || !queue.length) return;
    var fn = renderer();
    if (!fn) return;
    flushing = true;
    (function next() {
      var item = queue.shift();
      draw(renderer() || fn, item);
      if (queue.length) setTimeout(next, FLUSH_GAP_MS);
      else flushing = false;
    })();
  }

  function show() {
    var args = Array.prototype.slice.call(arguments);
    if (!queue.length) {
      var fn = renderer();
      if (fn) return draw(fn, args);
    }
    queue.push(args);
    if (queue.length > MAX_QUEUE) queue.shift();
    flush();
  }
  show.__ourgoalToastChannel = true;

  function bind(getOverride) {
    function cellToast() {
      var o = null;
      try { o = typeof getOverride === 'function' ? getOverride() : null; } catch (e) { o = null; }
      if (typeof o === 'function' && !isChannel(o)) return draw(o, Array.prototype.slice.call(arguments));
      return show.apply(null, arguments);
    }
    cellToast.__ourgoalToastChannel = true;
    return cellToast;
  }

  function attach(fn) {
    attached = (typeof fn === 'function' && !isChannel(fn)) ? fn : null;
    flush();
  }

  function pending() { return queue.length; }

  function reset() { attached = null; queue = []; flushing = false; }

  var caps = global && global.OurgoalCapabilities;
  if (!caps && typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    caps = require('./capabilities.js');
  }
  if (caps && typeof caps.provide === 'function') {
    caps.provide('ui.toast', show, {
      cell: CELL,
      description: '화면 아래 토스트로 짧은 안내 문구를 띄운다(index.html 정본 #toast, 2.2초). 정본 준비 전이면 대기열에 두었다가 띄운다',
      sideEffect: 'screen',
      input: { message: 'string' },
      output: null
    });
    caps.provide('ui.toast.bind', bind, {
      cell: CELL,
      description: '세포용 토스트 함수를 만든다 — 주입받은 토스트(getOverride())가 있으면 그것, 없으면 ui.toast',
      sideEffect: 'none',
      input: { getOverride: 'function' },
      output: { toast: 'function' }
    });
  }

  if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', flush);
  }

  var api = { show: show, bind: bind, attach: attach, pending: pending, reset: reset, CELL: CELL };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
