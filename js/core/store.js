/**
 * OurGoal Shipyard Architecture - State Store Wrapper (공통 상태 저장소)
 * 최고 헌법 제15조: 유저 자산 원격 원장화 및 수명주기 영속성 헌법
 * 
 * 기존 window.state 객체 및 localStorage 원장과 완벽히 동기화되며,
 * 각 블록이 안전하고 격리된 방식으로 전역 상태를 조회·구독할 수 있는 래퍼 인터페이스를 제공한다.
 */
(function (global) {
  'use strict';

  class StateStore {
    constructor() {
      this._subscribers = new Map();
      this._fallbackState = {
        user: null,
        profile: { nickname: '나', settings: {} },
        goals: [],
        records: []
      };
    }

    /**
     * 현재 전역 상태 객체 반환 (기존 window.state 우선)
     */
    getState() {
      if (global.state && typeof global.state === 'object') {
        return global.state;
      }
      return this._fallbackState;
    }

    /**
     * 경로 기반 안전한 값 조회 (예: 'profile.settings.theme')
     */
    get(path, fallback) {
      if (!path) return this.getState();
      const parts = path.split('.');
      let curr = this.getState();
      for (let i = 0; i < parts.length; i++) {
        if (curr == null || typeof curr !== 'object') return fallback;
        curr = curr[parts[i]];
      }
      return curr !== undefined ? curr : fallback;
    }

    /**
     * 경로 기반 값 갱신 및 이벤트 자동 발행
     */
    set(path, value, options) {
      if (!path) return;
      const state = this.getState();
      const parts = path.split('.');
      let curr = state;

      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (curr[p] == null || typeof curr[p] !== 'object') {
          curr[p] = {};
        }
        curr = curr[p];
      }

      const lastKey = parts[parts.length - 1];
      const oldValue = curr[lastKey];
      curr[lastKey] = value;

      const silent = options && options.silent === true;
      if (!silent) {
        this._notify(path, value, oldValue);
        if (global.OurgoalEvents && typeof global.OurgoalEvents.emit === 'function') {
          global.OurgoalEvents.emit('state:updated', { path, value, oldValue });
        }
      }
    }

    /**
     * 부분 상태 병합 갱신
     */
    setState(updates, options) {
      if (!updates || typeof updates !== 'object') return;
      const state = this.getState();
      const keys = Object.keys(updates);

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        this.set(k, updates[k], options);
      }
    }

    /**
     * 특정 상태 경로에 대한 구독 등록
     */
    subscribe(path, listener) {
      if (typeof path !== 'string' || typeof listener !== 'function') {
        return () => {};
      }
      if (!this._subscribers.has(path)) {
        this._subscribers.set(path, []);
      }
      this._subscribers.get(path).push(listener);

      return () => {
        if (!this._subscribers.has(path)) return;
        const list = this._subscribers.get(path).filter(l => l !== listener);
        if (list.length > 0) {
          this._subscribers.set(path, list);
        } else {
          this._subscribers.delete(path);
        }
      };
    }

    _notify(path, newValue, oldValue) {
      // 1. 완전 일치 경로 리스너 호출
      if (this._subscribers.has(path)) {
        const list = [...this._subscribers.get(path)];
        for (let i = 0; i < list.length; i++) {
          try {
            list[i](newValue, oldValue, path);
          } catch (e) {
            console.error(`[OurgoalStore] Error in subscriber for "${path}":`, e);
          }
        }
      }

      // 2. 상위 와일드카드 또는 루트 리스너 호출
      if (this._subscribers.has('*')) {
        const list = [...this._subscribers.get('*')];
        for (let i = 0; i < list.length; i++) {
          try {
            list[i](newValue, oldValue, path);
          } catch (e) {
            console.error('[OurgoalStore] Error in root subscriber:', e);
          }
        }
      }
    }
  }

  const instance = new StateStore();
  instance.StateStore = StateStore;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalStore = instance;
    global.OurgoalStateStore = StateStore;
  }
})(typeof window !== 'undefined' ? window : globalThis);
