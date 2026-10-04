/**
 * OurGoal Cell Skeleton - Capability Registry (신경 = 능력 등록부)
 *
 * #TASK-ES-356 (노션 CORE-08 · [청사진] 아워골 세포 골격 v0.1 3절): 세포는 다른 세포의 이름이 아니라 "능력"을 요청한다.
 * 능력을 주는 세포를 바꿔도 쓰는 세포는 깨지지 않는다. 능력 설명(meta)은 기계가 읽는 형태라 나중에 AI 비서 세포가 그대로 쓴다.
 * 규칙: docs/architecture/MODULE-BLUEPRINT.md 「연결망 — 신경」.
 *
 *   provide(name, impl, meta)  능력 등록. name 은 '영역.동작'(예: 'ui.toast', 'ledger.read'). meta.cell(주는 세포 id) 필수.
 *                              한 능력에 주는 세포는 하나 — 다른 세포가 같은 이름을 주면 CAPABILITY_CONFLICT.
 *                              같은 세포가 다시 주면(재마운트) 바꿔 끼운다. 돌려주는 값: 등록 해제 함수.
 *   request(name)              능력 받기. 없으면 CAPABILITY_MISSING 오류(누가 무엇을 찾았는지 메시지에 담는다).
 *   call(name, ...args)        request(name) 후 바로 부른다.
 *   has(name) / describe()     있는지 / 능력 목록(구현 없이 meta 만 — AI 비서·상태창이 읽는다).
 *   revoke(name, cell) / revokeCell(cell)  세포가 떨어질 때(dispose·소멸) 흔적 0.
 *
 * 지금(2026-10-04)은 index.html 에 붙지 않은 골격이다. 첫 사용처는 설정 탭 시범 이전(TASK-ES-354).
 */
(function (global) {
  'use strict';

  var NAME_RE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*)+$/;
  var SIDE_EFFECTS = ['none', 'screen', 'local', 'server', 'external'];

  function capError(code, message, extra) {
    var err = new Error('[OurgoalCapabilities] ' + message);
    err.code = code;
    if (extra) Object.keys(extra).forEach(function (k) { err[k] = extra[k]; });
    return err;
  }

  function CapabilityRegistry() {
    this._caps = new Map();
  }

  CapabilityRegistry.prototype.provide = function (name, impl, meta) {
    if (typeof name !== 'string' || !NAME_RE.test(name)) {
      throw capError('CAPABILITY_BAD_NAME', '능력 이름은 \'영역.동작\' 형식(소문자)이어야 한다: ' + name);
    }
    if (typeof impl !== 'function') {
      throw capError('CAPABILITY_BAD_IMPL', '능력 "' + name + '" 의 구현은 함수여야 한다');
    }
    var m = meta || {};
    if (typeof m.cell !== 'string' || !m.cell) {
      throw capError('CAPABILITY_NO_CELL', '능력 "' + name + '" 을 주는 세포 id(meta.cell)가 없다');
    }
    var existing = this._caps.get(name);
    if (existing && existing.meta.cell !== m.cell) {
      throw capError('CAPABILITY_CONFLICT', '능력 "' + name + '" 은 이미 세포 "' + existing.meta.cell + '" 가 준다(요청한 세포: ' + m.cell + ')', { capability: name });
    }
    var sideEffect = SIDE_EFFECTS.indexOf(m.sideEffect) >= 0 ? m.sideEffect : 'none';
    var record = {
      impl: impl,
      meta: {
        name: name,
        cell: m.cell,
        description: typeof m.description === 'string' ? m.description : '',
        input: m.input || null,
        output: m.output || null,
        sideEffect: sideEffect,
        // 승인선(돈·개인정보·삭제·외부 행위)에 닿는 능력은 AI 비서가 사람 확인 없이 부르지 않는다
        needsConfirm: m.needsConfirm === true || sideEffect === 'external',
        version: m.version || '1'
      }
    };
    this._caps.set(name, record);
    var self = this;
    return function () { self.revoke(name, m.cell); };
  };

  CapabilityRegistry.prototype.has = function (name) {
    return this._caps.has(name);
  };

  CapabilityRegistry.prototype.request = function (name, requester) {
    var rec = this._caps.get(name);
    if (!rec) {
      var known = Array.from(this._caps.keys()).sort();
      throw capError('CAPABILITY_MISSING', '능력 "' + name + '" 을 주는 세포가 없다' + (requester ? ' (요청한 세포: ' + requester + ')' : '') +
        ' — 지금 있는 능력: ' + (known.length ? known.join(', ') : '(없음)'), { capability: name });
    }
    return rec.impl;
  };

  CapabilityRegistry.prototype.call = function (name) {
    var impl = this.request(name);
    return impl.apply(null, Array.prototype.slice.call(arguments, 1));
  };

  CapabilityRegistry.prototype.describe = function () {
    return Array.from(this._caps.values()).map(function (r) {
      return JSON.parse(JSON.stringify(r.meta));
    }).sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  };

  CapabilityRegistry.prototype.revoke = function (name, cell) {
    var rec = this._caps.get(name);
    if (!rec) return false;
    if (cell && rec.meta.cell !== cell) return false;
    this._caps.delete(name);
    return true;
  };

  CapabilityRegistry.prototype.revokeCell = function (cell) {
    var removed = 0;
    var self = this;
    Array.from(this._caps.keys()).forEach(function (name) {
      if (self._caps.get(name).meta.cell === cell) {
        self._caps.delete(name);
        removed++;
      }
    });
    return removed;
  };

  CapabilityRegistry.prototype.clear = function () {
    this._caps.clear();
  };

  var instance = new CapabilityRegistry();
  instance.CapabilityRegistry = CapabilityRegistry;
  instance.NAME_RE = NAME_RE;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalCapabilities = instance;
  }
})(typeof window !== 'undefined' ? window : globalThis);
