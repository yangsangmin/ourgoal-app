/**
 * OurGoal Cell Registry (세포 등록 기관 — 미분화 덩어리 배선 철거의 대조 기관)
 *
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1절(B0 #TASK-ES-594) · 첫 구현 B1(compare 모드만).
 * index.html 인라인 IIFE 의 배선(가져오기 `var X = _kit.X` → `OurgoalAppScope.expose` getter → `window.X = X`)을 지우기 위해,
 * 각 세포가 자기 이름을 이 기관에 스스로 등록하고(provide), 탐침이 옛 경로가 만든 값과 등록 값을 이름마다 `===` 로 대조한다(report).
 *
 *   provide(owner, { name: value, … }, { window: ['name', …] })   세포가 자기 이름을 등록한다. owner 는 세포 id(예: 'settings/quick-actions').
 *                                                                  opts.window 에 적은 이름은 window 노출 이름으로도 대조한다.
 *   mode(name)                                                     그 이름의 모드. B1 에서는 언제나 'compare'.
 *   mode(name, 'compare')                                          허용(변화 없음). mode(name, 'own') 은 B1 에서는 오류 — own 모드(기관이 직접 expose·window 대입)는 B3 부터.
 *   note(owner, name)                                              로드 중 호출(부팅 배선)의 순서 기록. report().callOrder 에 그대로 나온다(B10 대조 대비).
 *   report({ scopeNames, windowNames, callOrder })                 대조 결과: { mismatches:[{name, owner, kind}], missing:[{name, kind}], extra:[{name, owner}], conflicts, callOrder, counts }.
 *   names() · ownerOf(name)                                        점검용.
 *
 * compare 모드의 약속(동작 변화 0): 등록 값을 보관만 한다. OurgoalAppScope 와 window 에는 아무것도 쓰지 않는다 — 이 파일에는 scope 대입·window 대입이 없다.
 * 새 전역은 OurgoalCellRegistry 하나뿐이다.
 */
(function (global) {
  'use strict';

  var entries = {};   // name → { owner, value, window: boolean, seq }
  var conflicts = []; // 같은 이름을 다른 세포가 다시 등록한 기록(이중 등록은 0 이어야 한다 — 기록만 하고 값은 첫 등록을 지킨다)
  var calls = [];     // 로드 중 호출 순서 기록 [{ owner, name, seq }]
  var seq = 0;
  var hasOwn = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function regError(code, message) {
    var err = new Error('[OurgoalCellRegistry] ' + message);
    err.code = code;
    return err;
  }

  function provide(owner, values, opts) {
    if (typeof owner !== 'string' || !owner.trim()) throw regError('OWNER_REQUIRED', 'provide(owner, …) — owner(세포 id)가 없다');
    if (!values || typeof values !== 'object') return [];
    var winNames = opts && Array.isArray(opts.window) ? opts.window : [];
    var registered = [];
    Object.keys(values).forEach(function (name) {
      var isWindow = winNames.indexOf(name) >= 0;
      if (hasOwn(entries, name)) {
        if (entries[name].owner !== owner) conflicts.push({ name: name, owner: owner, firstOwner: entries[name].owner });
        else { entries[name].value = values[name]; entries[name].window = entries[name].window || isWindow; }
        return;
      }
      entries[name] = { owner: owner, value: values[name], window: isWindow, seq: ++seq };
      registered.push(name);
    });
    winNames.forEach(function (name) {
      if (hasOwn(entries, name) && entries[name].owner === owner) entries[name].window = true;
    });
    return registered;
  }

  function mode(name, value) {
    if (typeof name !== 'string' || !name) throw regError('NAME_REQUIRED', 'mode(name) — 이름이 없다');
    if (arguments.length < 2 || value === 'compare') return 'compare';
    if (value === 'own') throw regError('OWN_MODE_NOT_YET', "own 모드는 B1 에서는 동작하지 않는다(설계 3.1 — B3 배선 철거부터): " + name);
    throw regError('MODE_INVALID', "mode 값은 'compare' 또는 'own': " + String(value));
  }

  function note(owner, name) {
    calls.push({ owner: String(owner), name: String(name), seq: ++seq });
    return calls.length;
  }

  function readScope(name) {
    var scope = global.OurgoalAppScope && global.OurgoalAppScope.scope;
    if (!scope || !hasOwn(scope, name)) return { present: false };
    try { return { present: true, value: scope[name] }; }
    catch (e) { return { present: true, error: (e && e.message) || String(e) }; }
  }

  function sameArray(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function report(opts) {
    var o = opts || {};
    var scopeNames = Array.isArray(o.scopeNames) ? o.scopeNames.slice()
      : (global.OurgoalAppScope && typeof global.OurgoalAppScope.names === 'function' ? global.OurgoalAppScope.names() : []);
    var windowNames = Array.isArray(o.windowNames) ? o.windowNames.slice() : [];
    var mismatches = [], missing = [], extra = [], checked = 0;
    var registeredNames = Object.keys(entries).sort();
    var expected = {};
    scopeNames.forEach(function (n) { expected[n] = expected[n] || {}; expected[n].scope = true; });
    windowNames.forEach(function (n) { expected[n] = expected[n] || {}; expected[n].window = true; });

    registeredNames.forEach(function (name) {
      var e = entries[name];
      var exp = expected[name];
      if (!exp) { extra.push({ name: name, owner: e.owner }); return; }
      if (exp.scope) {
        checked++;
        var r = readScope(name);
        if (!r.present) mismatches.push({ name: name, owner: e.owner, kind: 'scope-missing' });
        else if (r.error !== undefined) mismatches.push({ name: name, owner: e.owner, kind: 'scope-getter-error', detail: r.error });
        else if (r.value !== e.value) mismatches.push({ name: name, owner: e.owner, kind: 'scope' });
      }
      if (exp.window) {
        checked++;
        if (!e.window) mismatches.push({ name: name, owner: e.owner, kind: 'window-not-declared' });
        else if (global[name] !== e.value) mismatches.push({ name: name, owner: e.owner, kind: 'window' });
      }
    });
    Object.keys(expected).sort().forEach(function (name) {
      if (hasOwn(entries, name)) return;
      if (expected[name].scope) missing.push({ name: name, kind: 'scope' });
      if (expected[name].window) missing.push({ name: name, kind: 'window' });
    });
    var recordedOrder = calls.map(function (c) { return c.owner + ':' + c.name; });
    var expectedOrder = Array.isArray(o.callOrder) ? o.callOrder.slice() : null;
    return {
      mode: 'compare',
      counts: { scopeNames: scopeNames.length, windowNames: windowNames.length, registered: registeredNames.length, checked: checked, mismatches: mismatches.length, missing: missing.length, extra: extra.length, conflicts: conflicts.length },
      mismatches: mismatches,
      missing: missing,
      extra: extra,
      conflicts: conflicts.slice(),
      callOrder: { recorded: recordedOrder, expected: expectedOrder, equal: expectedOrder ? sameArray(recordedOrder, expectedOrder) : null }
    };
  }

  var OurgoalCellRegistry = {
    provide: provide,
    mode: mode,
    note: note,
    report: report,
    names: function () { return Object.keys(entries).sort(); },
    ownerOf: function (name) { return hasOwn(entries, name) ? entries[name].owner : null; }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCellRegistry;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalCellRegistry = OurgoalCellRegistry;
  }
})(typeof window !== 'undefined' ? window : globalThis);
