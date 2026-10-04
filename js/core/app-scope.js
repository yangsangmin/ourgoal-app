/**
 * OurGoal App Scope (인라인 앱 스코프 → 분리 모듈 통로, 모든 탭 공용)
 *
 * #TASK-ES-354 (노션 CORE-07): index.html 인라인 IIFE 의 함수를 바깥 파일로 옮길 때,
 * 옮긴 코드가 읽는 IIFE 스코프의 공용 상태·헬퍼(state, saveProfile, toast, escapeHtml …)를 window 에 하나씩 흩뿌리지 않고
 * 이 객체의 scope 한 곳에만 getter 로 노출한다. 규칙은 docs/specs/MODULE-SPLIT-PROTOCOL.md.
 *
 * - 노출하는 쪽(index.html IIFE 맨 위): OurgoalAppScope.expose('index.html', { get state(){ return state; }, … })
 *   getter 라서 값은 읽을 때마다 살아 있는 값이다(나중에 다시 대입된 변수도 그대로 따라간다). 대입이 필요한 이름만 setter 를 둔다.
 * - 읽는 쪽(옮긴 파일): var L = OurgoalAppScope.scope; … L.state.profile, L.saveProfile() …
 * - 노출 목록은 스코프 분석으로 뽑은 "옮긴 코드가 실제로 쓰는 이름"만이다. names() 로 확인한다.
 */
(function (global) {
  'use strict';

  var scope = {};
  var owners = {};

  var OurgoalAppScope = {
    scope: scope,

    /**
     * source 객체의 속성(getter/setter 포함)을 scope 에 그대로 옮겨 단다.
     * @param {string} owner 노출하는 곳 이름(예: 'index.html')
     * @param {Object} source getter/setter 를 가진 객체
     * @returns {Object} scope
     */
    expose: function (owner, source) {
      if (!source || typeof source !== 'object') return scope;
      Object.getOwnPropertyNames(source).forEach(function (name) {
        var d = Object.getOwnPropertyDescriptor(source, name);
        d.enumerable = true;
        d.configurable = true;
        Object.defineProperty(scope, name, d);
        owners[name] = owner || null;
      });
      return scope;
    },

    /** 노출된 이름 목록(정렬) — 점검용 */
    names: function () {
      return Object.keys(owners).sort();
    },

    /** 이름을 노출한 곳 */
    ownerOf: function (name) {
      return Object.prototype.hasOwnProperty.call(owners, name) ? owners[name] : null;
    },

    /** 필요한 이름 중 노출되지 않은 것 — 점검용 */
    missing: function (names) {
      return (names || []).filter(function (n) { return !Object.prototype.hasOwnProperty.call(owners, n); });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalAppScope;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalAppScope = OurgoalAppScope;
  }
})(typeof window !== 'undefined' ? window : globalThis);
