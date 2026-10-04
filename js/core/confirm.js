/**
 * OurGoal Core - Confirm Channel (공용 확인창 통로 — 능력 ui.confirm)
 *
 * #TASK-ES-374 (기본 확인창 → 앱 바텀시트 1단계): index.html 밖 js 파일들이 각자 부르던 브라우저 기본 확인창
 * confirm() 을 이 통로 하나로 모은다. 그리는 일은 index.html 정본 openBottomSheetConfirm(제목, 본문, 확인 글자,
 * 취소 글자, onOk, onCancel)이 한다. 문구는 호출부가 넘긴 그대로(본문), 제목·버튼 글자는 정본 기본값(확인/취소).
 * 같은 방식의 앞선 통로: js/core/toast.js(#TASK-ES-361) · js/core/modal.js(#TASK-ES-363).
 *
 *   ui.confirm(message, opts)   Promise<boolean>. 확인 → true, 취소·✕·바깥 탭·뒤로가기 → false.
 *                               정본이 없으면(로드 전·시험 환경) 브라우저 기본 확인창으로 떨어진다(동작 손실 방지).
 *                               한 번에 하나만 띄우고, 겹친 요청은 대기열에서 차례를 기다린다.
 *   ui.confirm.bind(getOverride) 세포용 확인 함수. getOverride() 가 함수(init 으로 넘겨받은 deps.confirm 등)를 돌려주면
 *                               그것을 먼저 쓰고, 없으면 ui.confirm. 이 통로가 만든 함수는 고르지 않는다 → 재귀 불가.
 *   attach(fn)                  그리는 함수를 직접 붙인다(시험용). 안 붙이면 window.openBottomSheetConfirm(정본)을 찾아 쓴다.
 *
 * 겹침: 정본 openModal 은 2중 적재를 막고(#UIUX-23) 열린 모달 내용을 덮어쓴다. 그래서 모달 안에서 확인창을 띄우면
 * 밑 모달의 노드(이벤트 연결 포함)를 잠시 떼어 두었다가, 확인창이 닫히면 같은 노드를 다시 붙인 뒤에 결과를 돌려준다.
 * 기본 확인창은 언제나 맨 위에 뜨므로, 확인창이 떠 있는 동안 #modalOverlay 를 맨 위 층으로 올린다(시간 기록 전체화면 등).
 *
 * 전역에 새 이름을 달지 않는다 — 능력 등록부(OurgoalCapabilities) 한 통로로만 노출한다(MODULE-BLUEPRINT 5절).
 */
(function (global) {
  'use strict';

  var CELL = 'core/confirm';
  var MAX_QUEUE = 20;
  var TOP_LAYER = '2147483000';
  var HISTORY_SETTLE_MS = 350;

  var attached = null;
  var queue = [];
  var busy = false;

  function isChannel(fn) {
    return typeof fn === 'function' && fn.__ourgoalConfirmChannel === true;
  }

  function renderer() {
    if (typeof attached === 'function') return attached;
    var g = global && global.openBottomSheetConfirm;
    if (typeof g === 'function' && !isChannel(g)) return g;
    return null;
  }

  function nativeConfirm(message) {
    var fn = global && global.confirm;
    if (typeof fn !== 'function') return false;
    try { return !!fn.call(global, message); } catch (e) { return false; }
  }

  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function doc() {
    return (global && global.document) || null;
  }

  function overlayEl() {
    var d = doc();
    return d && typeof d.getElementById === 'function' ? d.getElementById('modalOverlay') : null;
  }

  function isActive(el) {
    return !!(el && el.classList && el.classList.contains('active'));
  }

  // 열린 정본 모달의 노드를 떼어 둔다(이벤트 연결이 노드에 붙어 있으므로 다시 붙이면 그대로 산다).
  function suspendOpenModal() {
    var d = doc();
    var overlay = overlayEl();
    var sheet = d && typeof d.getElementById === 'function' ? d.getElementById('modalSheet') : null;
    if (!isActive(overlay) || !sheet || !sheet.firstChild || typeof d.createDocumentFragment !== 'function') return null;
    var frag = d.createDocumentFragment();
    while (sheet.firstChild) frag.appendChild(sheet.firstChild);
    return frag;
  }

  function modalOpener() {
    var caps = global && global.OurgoalCapabilities;
    if (caps && typeof caps.has === 'function' && caps.has('ui.modal')) return caps.request('ui.modal');
    return (global && typeof global.openModal === 'function') ? global.openModal : null;
  }

  function restoreModal(frag) {
    var open = modalOpener();
    if (!open) return;
    try {
      open('', function (sheet) {
        while (sheet.firstChild) sheet.removeChild(sheet.firstChild);
        sheet.appendChild(frag);
      });
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[ui.confirm] 밑 모달 복원 실패:', e && e.message);
    }
  }

  // 정본 closeModal 이 부른 history.back() 의 popstate 를 기다린다 — 그 전에 모달을 다시 열면 뒤늦은 popstate 가 닫아 버린다.
  function afterHistorySettles(done) {
    var g = global;
    if (!g || typeof g.addEventListener !== 'function' || typeof g.setTimeout !== 'function') { done(); return; }
    var fired = false;
    function go() {
      if (fired) return;
      fired = true;
      try { g.removeEventListener('popstate', go); } catch (e) {}
      done();
    }
    g.addEventListener('popstate', go);
    g.setTimeout(go, HISTORY_SETTLE_MS);
  }

  function run(item) {
    var fn = renderer();
    if (!fn) { finish(item, nativeConfirm(item.message)); return; }

    var overlay = overlayEl();
    var suspended = suspendOpenModal();
    var prevZ = overlay && overlay.style ? overlay.style.zIndex : null;
    var settled = false;
    var observer = null;

    function settle(value) {
      if (settled) return;
      settled = true;
      if (observer) { try { observer.disconnect(); } catch (e) {} }
      if (overlay && overlay.style) overlay.style.zIndex = prevZ || '';
      if (!overlay) { finish(item, value); return; }
      afterHistorySettles(function () {
        if (suspended) restoreModal(suspended);
        finish(item, value);
      });
    }

    var o = item.opts || {};
    try {
      if (overlay && overlay.style) overlay.style.zIndex = TOP_LAYER;
      fn(o.title ? escapeText(o.title) : '', escapeText(item.message),
        o.okText ? escapeText(o.okText) : '', o.cancelText ? escapeText(o.cancelText) : '',
        function () { settle(true); }, function () { settle(false); });
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[ui.confirm] 바텀시트 확인창 실패 — 기본 확인창으로:', e && e.message);
    }

    if (settled) return;
    if (overlay && !isActive(overlay)) {
      // 정본이 그리지 못했다(#modalOverlay 없음·예외) → 기본 확인창으로 떨어진다. 떼어 둔 밑 모달은 되돌린다.
      if (overlay.style) overlay.style.zIndex = prevZ || '';
      if (suspended) {
        var sheet = doc().getElementById('modalSheet');
        if (sheet) sheet.appendChild(suspended);
      }
      settled = true;
      finish(item, nativeConfirm(item.message));
      return;
    }
    // ✕·바깥 탭·뒤로가기로 닫히면 정본은 onOk/onCancel 을 부르지 않는다 → 취소로 본다.
    if (overlay && typeof global.MutationObserver === 'function') {
      observer = new global.MutationObserver(function () {
        if (!isActive(overlay)) settle(false);
      });
      observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function finish(item, value) {
    try { item.resolve(!!value); } finally {
      busy = false;
      next();
    }
  }

  function next() {
    if (busy || !queue.length) return;
    busy = true;
    run(queue.shift());
  }

  function ask(message, opts) {
    return new Promise(function (resolve) {
      if (queue.length >= MAX_QUEUE) { resolve(false); return; }
      queue.push({ message: message, opts: opts, resolve: resolve });
      next();
    });
  }
  ask.__ourgoalConfirmChannel = true;

  function bind(getOverride) {
    function cellConfirm(message, opts) {
      var o = null;
      try { o = typeof getOverride === 'function' ? getOverride() : null; } catch (e) { o = null; }
      if (typeof o === 'function' && !isChannel(o)) {
        try { return Promise.resolve(o(message, opts)).then(function (v) { return !!v; }); } catch (e) { return Promise.resolve(false); }
      }
      return ask(message, opts);
    }
    cellConfirm.__ourgoalConfirmChannel = true;
    return cellConfirm;
  }

  function attach(fn) {
    attached = (typeof fn === 'function' && !isChannel(fn)) ? fn : null;
  }

  function pending() { return queue.length + (busy ? 1 : 0); }

  function reset() { attached = null; queue = []; busy = false; }

  var caps = global && global.OurgoalCapabilities;
  if (!caps && typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    caps = require('./capabilities.js');
  }
  if (caps && typeof caps.provide === 'function') {
    caps.provide('ui.confirm', ask, {
      cell: CELL,
      description: '확인/취소 바텀시트를 띄우고 결과를 Promise<boolean> 으로 돌려준다(index.html 정본 openBottomSheetConfirm). 정본이 없으면 브라우저 기본 확인창',
      sideEffect: 'screen',
      input: { message: 'string', opts: 'object' },
      output: { confirmed: 'boolean' }
    });
    caps.provide('ui.confirm.bind', bind, {
      cell: CELL,
      description: '세포용 확인 함수를 만든다 — 주입받은 확인 함수(getOverride() 가 돌려준 것)가 있으면 그것, 없으면 ui.confirm',
      sideEffect: 'none',
      input: { getOverride: 'function' },
      output: { confirm: 'function' }
    });
  }

  var api = { confirm: ask, bind: bind, attach: attach, pending: pending, reset: reset, CELL: CELL };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
