/**
 * OurGoal App State (상태 기관 — 미분화 덩어리의 공용 상태를 맡아 보관하고 통로에 내준다)
 *
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.3절 「기관 API — 확정」(#TASK-ES-634) · 구현 #TASK-ES-636.
 * index.html 인라인 IIFE 의 상태 변수(`var X = 초기값;` + 통로 getter/setter)를 생성기 unstate 모드가
 * `window.OurgoalAppState.define('X', 초기값);` / `defineVar('X', 초기값);` 로 바꿔 쓴다. 그 줄이 이 기관을 부른다.
 *
 *   define(name, value)      읽기 전용 — 값을 보관하고 통로(OurgoalAppScope.scope)에 getter 만 단다.
 *   defineVar(name, value)   읽기·쓰기 — 값을 보관하고 통로에 get/set 짝을 단다. setter 는 보관 값을 바꾼다.
 *   names() · kindOf(name)   점검용(읽기만) — 맡은 이름 목록, 그 이름의 종류('const' | 'var' | null).
 *
 * 계약(설계 3.3 표 그대로):
 *   · 접근자는 그 이름의 첫 define/defineVar 호출 때 한 번 단다 — OurgoalAppScope.expose('core/app-state', …).
 *   · 그 이름에 속성이 이미 있어도 다시 정의해 덮는다(예전에 선언 줄의 초기값 대입이 앞선 쓰기를 덮던 것과 같다).
 *   · 같은 이름을 두 번 정의하면 오류를 던진다(이름 하나에 선언 하나).
 *   · value 는 복사하지 않고 그대로 보관한다(같은 객체). 반환값은 없다.
 *   · window 에는 상태 이름을 달지 않는다(일회 복사 줄이 원래 자리에서 통로 값을 읽어 단다).
 *   · define 으로 단 이름에 쓰면 getter 전용 속성과 똑같이 동작한다(엄격 모드에서 TypeError) — 따로 막거나 풀지 않는다.
 * 새 전역은 OurgoalAppState 하나뿐이다. 로드될 때는 아무것도 만지지 않는다(통로·window 에 쓰는 것은 define 이 불릴 때뿐).
 */
(function (global) {
  'use strict';

  var OWNER = 'core/app-state';
  var values = Object.create(null); // name → 보관 값
  var kinds = Object.create(null);  // name → 'const'(define) | 'var'(defineVar)

  function stateError(code, message) {
    var err = new Error('[OurgoalAppState] ' + message);
    err.code = code;
    return err;
  }

  function put(name, value, writable) {
    if (typeof name !== 'string' || !name) throw stateError('NAME_REQUIRED', 'define(name, value) — name(글자열)이 없다');
    if (name in kinds) throw stateError('ALREADY_DEFINED', '같은 이름을 두 번 정의할 수 없다: ' + name);
    var scopeApi = global.OurgoalAppScope;
    if (!scopeApi || typeof scopeApi.expose !== 'function') throw stateError('SCOPE_MISSING', '통로(OurgoalAppScope)가 없다 — js/core/app-scope.js 가 먼저 로드돼야 한다: ' + name);
    values[name] = value;
    kinds[name] = writable ? 'var' : 'const';
    var descriptor = { get: function () { return values[name]; }, enumerable: true, configurable: true };
    if (writable) descriptor.set = function (v) { values[name] = v; };
    var source = {};
    Object.defineProperty(source, name, descriptor);
    scopeApi.expose(OWNER, source); // 통로가 속성을 다시 정의한다(이미 있던 속성은 덮인다)
  }

  var OurgoalAppState = {
    define: function (name, value) { put(name, value, false); },
    defineVar: function (name, value) { put(name, value, true); },
    names: function () { return Object.keys(kinds).sort(); },
    kindOf: function (name) { return name in kinds ? kinds[name] : null; }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalAppState;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalAppState = OurgoalAppState;
  }
})(typeof window !== 'undefined' ? window : globalThis);
