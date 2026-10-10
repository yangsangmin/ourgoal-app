/**
 * OurGoal Cell Registry (세포 등록 기관 — 미분화 덩어리 배선 철거의 대조 기관)
 *
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1절(B0 #TASK-ES-594) · 첫 구현 B1(compare 모드만) · own 적용 B3a(#TASK-ES-614).
 * index.html 인라인 IIFE 의 배선(가져오기 `var X = _kit.X` → `OurgoalAppScope.expose` getter → `window.X = X`)을 지우기 위해,
 * 각 세포가 자기 이름을 이 기관에 스스로 등록하고(provide), 탐침이 옛 경로가 만든 값과 등록 값을 이름마다 `===` 로 대조한다(report).
 *
 *   provide(owner, { name: value, … }, { window: ['name', …], windowOnly: ['name', …] })
 *                                                                  세포가 자기 이름을 등록한다. owner 는 세포 id(예: 'settings/quick-actions').
 *                                                                  opts.window 에 적은 이름은 window 노출 이름이다. opts.windowOnly 에도 적은 이름은 통로(scope)에는 내주지 않는다.
 *   commit()                                                       own 적용 — 등록된 이름을 기관이 직접 통로(OurgoalAppScope.expose(owner, …))와 window 에 내준다. 한 번만 돈다.
 *                                                                  부르는 곳은 js/core/cell-registry-commit.js 하나(index.html 인라인 IIFE 바로 앞 태그)다. 바깥 스크립트가 전부 로드된 뒤라
 *                                                                  같은 window 이름을 쓰는 다른 파일보다 나중이고, 지금까지 IIFE 가 덮어쓰던 순서와 승자가 같다.
 *   mode(name)                                                     그 이름의 모드. commit 이 실제로 내준 이름은 'own', 그 밖은 'compare'.
 *   mode(name, 'compare') · mode(name, 'own')                      commit 전에만: 그 이름을 own 적용에서 빼거나(compare) 다시 넣는다(own). commit 뒤에 바꾸려 하면 오류.
 *   note(owner, name)                                              로드 중 호출(부팅 배선)의 순서 기록. report().callOrder 에 그대로 나온다(B10 대조 대비).
 *   report({ scopeNames, windowNames, callOrder })                 대조 결과: { mismatches:[{name, owner, kind}], missing:[{name, kind}], extra:[{name, owner}], conflicts, callOrder, counts }.
 *   names() · ownerOf(name)                                        점검용.
 *
 * 등록(provide)의 약속: 등록 값을 보관만 한다. OurgoalAppScope 와 window 는 commit() 만 쓴다.
 * own 적용(commit)의 약속: 내주는 값은 세포가 등록한 그 값이다(B2 대조에서 옛 배선 값과 === 로 같음을 확인한 값). 함수는 getter 로 감싸지 않고 값으로 둔다
 *   (다시 쓸 수 없는 속성 — 옛 getter 전용 노출처럼 엄격 모드 대입은 오류). index.html 의 옛 배선 줄이 남아 있는 동안에는 IIFE 가 같은 이름을 같은 값으로 다시 내준다(이중 노출, 값 동일).
 * 새 전역은 OurgoalCellRegistry 하나뿐이다.
 */
(function (global) {
  'use strict';

  var entries = {};   // name → { owner, value, window: boolean, scope: boolean, seq, own: boolean }
  var keepCompare = {}; // name → 사유. own 적용에서 뺀 이름(측정으로 값이 어긋난다고 확인된 이름만 넣는다)
  var committed = false;
  var commitLog = null; // commit() 이 한 일의 기록(가공 없음)
  var lateProvides = []; // commit 뒤에 온 등록(내주지 않는다 — 기록만)
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
    var winOnly = opts && Array.isArray(opts.windowOnly) ? opts.windowOnly : [];
    var registered = [];
    Object.keys(values).forEach(function (name) {
      var isWindow = winNames.indexOf(name) >= 0;
      if (hasOwn(entries, name)) {
        if (entries[name].owner !== owner) conflicts.push({ name: name, owner: owner, firstOwner: entries[name].owner });
        else if (committed) lateProvides.push({ name: name, owner: owner, kind: 're-provide' });
        else { entries[name].value = values[name]; entries[name].window = entries[name].window || isWindow; }
        return;
      }
      entries[name] = { owner: owner, value: values[name], window: isWindow, scope: winOnly.indexOf(name) < 0, seq: ++seq, own: false };
      if (committed) lateProvides.push({ name: name, owner: owner, kind: 'new' });
      registered.push(name);
    });
    winNames.forEach(function (name) {
      if (hasOwn(entries, name) && entries[name].owner === owner) entries[name].window = true;
    });
    return registered;
  }

  function mode(name, value) {
    if (typeof name !== 'string' || !name) throw regError('NAME_REQUIRED', 'mode(name) — 이름이 없다');
    if (arguments.length < 2) return hasOwn(entries, name) && entries[name].own ? 'own' : 'compare';
    if (value !== 'compare' && value !== 'own') throw regError('MODE_INVALID', "mode 값은 'compare' 또는 'own': " + String(value));
    if (committed) {
      var now = hasOwn(entries, name) && entries[name].own ? 'own' : 'compare';
      if (now !== value) throw regError('MODE_AFTER_COMMIT', 'commit 뒤에는 모드를 바꿀 수 없다(이미 내준 이름을 거두지 않는다): ' + name);
      return now;
    }
    if (value === 'compare') keepCompare[name] = 'mode(name, compare) 지정';
    else delete keepCompare[name];
    return value;
  }

  // own 적용: 등록 순서대로, 통로는 세포(owner)마다 한 번에 expose, window 는 이름마다 대입. 한 번만 돈다.
  function commit() {
    if (committed) return commitLog;
    committed = true;
    var S = global.OurgoalAppScope;
    var canScope = !!(S && typeof S.expose === 'function' && S.scope);
    var log = { scope: 0, window: 0, kept: [], scopeBefore: [], windowBefore: { undefined: 0, same: 0, different: [] }, scopeAvailable: canScope };
    var byOwner = {}, ownerOrder = [];
    Object.keys(entries).sort(function (a, b) { return entries[a].seq - entries[b].seq; }).forEach(function (name) {
      var e = entries[name];
      if (hasOwn(keepCompare, name)) { log.kept.push({ name: name, owner: e.owner, reason: keepCompare[name] }); return; }
      var toScope = e.scope && canScope;
      if (toScope) {
        if (hasOwn(S.scope, name)) log.scopeBefore.push({ name: name, owner: e.owner, firstOwner: typeof S.ownerOf === 'function' ? S.ownerOf(name) : null });
        if (!hasOwn(byOwner, e.owner)) { byOwner[e.owner] = {}; ownerOrder.push(e.owner); }
        Object.defineProperty(byOwner[e.owner], name, { value: e.value, writable: false, enumerable: true, configurable: true });
        log.scope++;
      }
      if (e.window) {
        var before = global[name];
        if (before === undefined) log.windowBefore.undefined++;
        else if (before === e.value) log.windowBefore.same++;
        else log.windowBefore.different.push({ name: name, owner: e.owner, beforeType: typeof before });
        global[name] = e.value;
        log.window++;
      }
      e.own = !!(toScope || e.window);
    });
    ownerOrder.forEach(function (owner) { S.expose(owner, byOwner[owner]); });
    commitLog = log;
    return log;
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
    var ownNames = registeredNames.filter(function (n) { return entries[n].own; });
    return {
      mode: committed ? 'own' : 'compare',
      counts: { scopeNames: scopeNames.length, windowNames: windowNames.length, registered: registeredNames.length, checked: checked, mismatches: mismatches.length, missing: missing.length, extra: extra.length, conflicts: conflicts.length,
        own: ownNames.length, ownScope: ownNames.filter(function (n) { return entries[n].scope; }).length, ownWindow: ownNames.filter(function (n) { return entries[n].window; }).length, lateProvides: lateProvides.length },
      commit: commitLog,
      lateProvides: lateProvides.slice(),
      mismatches: mismatches,
      missing: missing,
      extra: extra,
      conflicts: conflicts.slice(),
      callOrder: { recorded: recordedOrder, expected: expectedOrder, equal: expectedOrder ? sameArray(recordedOrder, expectedOrder) : null }
    };
  }

  var OurgoalCellRegistry = {
    provide: provide,
    commit: commit,
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
