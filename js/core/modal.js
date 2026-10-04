/**
 * OurGoal Core - Modal Channel (공용 모달 통로 — 능력 ui.modal)
 *
 * #TASK-ES-363 (쪼개는 순서 2번 나머지 · UI-COMPONENTS 3절 2번 앞부분): index.html 밖의 js 파일들이 각자 만들던
 * openModal/closeModal 연결 통로(team-linked-goals · team-visibility-levels)를 이 통로 하나로 모은다.
 * 그리는 일은 지금도 index.html 정본 openModal(html, onMount)·closeModal()(#modalOverlay·#modalSheet, 뒤로가기
 * history 처리 포함)이 한다 — 모양·동작 불변. 같은 방식의 앞선 통로: js/core/toast.js(#TASK-ES-361).
 *
 *   ui.modal(html, onMount, ...)  정본 모달을 연다. 정본이 아직 없으면(스크립트 로드 순서·init 전) 요청을 대기열에 두었다가
 *                                 정본이 생기는 순간(attach 또는 DOMContentLoaded 또는 다음 호출) 요청 순서대로 정본에 넘긴다.
 *   ui.modal.close(...)           정본 모달을 닫는다. 대기열이 비어 있고 정본이 없으면 열린 모달도 없으므로 아무것도 안 한다.
 *   ui.modal.bind(getOverrides)   세포용 { open, close } 를 만든다. getOverrides() 가 돌려준 객체에 openModal/closeModal
 *                                 (init 으로 넘겨받은 것)이 있으면 그것을 먼저 쓰고, 없으면 ui.modal. 예전 세포 통로와 같이
 *                                 open 은 (html, cb) 두 인자, close 는 인자 없이 넘긴다(클릭 이벤트 객체가 정본의
 *                                 skipHistoryBack 자리로 새지 않게). 이 통로가 만든 함수는 고르지 않는다 → 재귀 불가.
 *   attach({ open, close })       그리는 함수를 직접 붙인다(시험·향후 js/ui/sheet.js). 안 붙이면 index.html 이 단
 *                                 window.openModal / window.closeModal(정본)을 부를 때마다 찾아 쓴다.
 *
 * 전역에 새 이름을 달지 않는다 — 능력 등록부(OurgoalCapabilities) 한 통로로만 노출한다(MODULE-BLUEPRINT 5절).
 */
(function (global) {
  'use strict';

  var CELL = 'core/modal';
  var MAX_QUEUE = 20;

  var attached = null;
  var queue = [];
  var flushing = false;

  function isChannel(fn) {
    return typeof fn === 'function' && fn.__ourgoalModalChannel === true;
  }

  // 그리는 함수: 직접 붙인 것 → index.html 정본(window.openModal / window.closeModal). 이 통로가 만든 함수는 고르지 않는다.
  function renderer(op) {
    if (attached && typeof attached[op] === 'function') return attached[op];
    var g = global && global[op === 'open' ? 'openModal' : 'closeModal'];
    if (typeof g === 'function' && !isChannel(g)) return g;
    return null;
  }

  function flush() {
    if (flushing || !queue.length) return;
    flushing = true;
    try {
      while (queue.length) {
        var fn = renderer(queue[0].op);
        if (!fn) break;
        var item = queue.shift();
        try {
          fn.apply(null, item.args);
        } catch (e) {
          if (typeof console !== 'undefined') console.warn('[ui.modal] 대기열 모달 처리 실패:', e && e.message);
        }
      }
    } finally {
      flushing = false;
    }
  }

  function enqueue(op, args) {
    queue.push({ op: op, args: args });
    if (queue.length > MAX_QUEUE) queue.shift();
    flush();
  }

  function open() {
    var args = Array.prototype.slice.call(arguments);
    flush();
    if (!queue.length) {
      var fn = renderer('open');
      if (fn) return fn.apply(null, args);
    }
    enqueue('open', args);
  }
  open.__ourgoalModalChannel = true;

  function close() {
    var args = Array.prototype.slice.call(arguments);
    flush();
    if (!queue.length) {
      var fn = renderer('close');
      if (fn) return fn.apply(null, args);
      return;
    }
    enqueue('close', args);
  }
  close.__ourgoalModalChannel = true;

  function pick(getOverrides, key) {
    var o = null;
    try { o = typeof getOverrides === 'function' ? getOverrides() : null; } catch (e) { o = null; }
    var fn = o && o[key];
    return (typeof fn === 'function' && !isChannel(fn)) ? fn : null;
  }

  function bind(getOverrides) {
    function cellOpen(html, cb) {
      var o = pick(getOverrides, 'openModal');
      if (o) return o(html, cb);
      return open(html, cb);
    }
    function cellClose() {
      var o = pick(getOverrides, 'closeModal');
      if (o) return o();
      return close();
    }
    cellOpen.__ourgoalModalChannel = true;
    cellClose.__ourgoalModalChannel = true;
    return { open: cellOpen, close: cellClose };
  }

  function attach(impl) {
    attached = (impl && typeof impl === 'object') ? {
      open: (typeof impl.open === 'function' && !isChannel(impl.open)) ? impl.open : null,
      close: (typeof impl.close === 'function' && !isChannel(impl.close)) ? impl.close : null
    } : null;
    flush();
  }

  function pending() { return queue.length; }

  function reset() { attached = null; queue = []; flushing = false; }

  var caps = global && global.OurgoalCapabilities;
  if (!caps && typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    caps = require('./capabilities.js');
  }
  if (caps && typeof caps.provide === 'function') {
    caps.provide('ui.modal', open, {
      cell: CELL,
      description: '화면 가운데·아래 공용 모달(바텀시트)을 연다(index.html 정본 #modalOverlay·#modalSheet, 뒤로가기로 닫힘). 정본 준비 전이면 대기열에 두었다가 연다',
      sideEffect: 'screen',
      input: { html: 'string', onMount: 'function' },
      output: null
    });
    caps.provide('ui.modal.close', close, {
      cell: CELL,
      description: '열린 공용 모달을 닫는다(index.html 정본 closeModal)',
      sideEffect: 'screen',
      input: {},
      output: null
    });
    caps.provide('ui.modal.bind', bind, {
      cell: CELL,
      description: '세포용 모달 열기·닫기 함수 쌍을 만든다 — 주입받은 openModal/closeModal(getOverrides())이 있으면 그것, 없으면 ui.modal',
      sideEffect: 'none',
      input: { getOverrides: 'function' },
      output: { open: 'function', close: 'function' }
    });
  }

  if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', flush);
  }

  var api = { open: open, close: close, bind: bind, attach: attach, pending: pending, reset: reset, CELL: CELL };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
