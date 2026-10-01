/**
 * OurGoal Shipyard Architecture - Core Event Bus (배관망)
 * 최고 헌법 제3조 제9항 제4호: 코어 이벤트 버스 기반 소통 및 결합도 제로 규범
 * 
 * 6대 메가블록 및 28대 소블록 간의 직접 결합(직접 함수 호출)을 차단하고,
 * 이벤트 기반의 완전한 비동기/반응형 통신 배관을 제공한다.
 */
(function (global) {
  'use strict';

  class EventBus {
    constructor() {
      this._listeners = new Map();
      this._depth = new Map();
      this._maxDepth = 10;
    }

    /**
     * 이벤트 리스너 등록
     * @param {string} event 이벤트 이름
     * @param {Function} handler 콜백 함수
     * @param {Object} [options] 옵션 { once: boolean }
     */
    on(event, handler, options) {
      if (typeof event !== 'string' || typeof handler !== 'function') {
        return () => {};
      }
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      const entry = {
        handler,
        once: options && options.once === true
      };
      this._listeners.get(event).push(entry);

      // 구독 해제 함수 반환
      return () => this.off(event, handler);
    }

    /**
     * 1회성 이벤트 리스너 등록
     */
    once(event, handler) {
      return this.on(event, handler, { once: true });
    }

    /**
     * 이벤트 리스너 해제
     */
    off(event, handler) {
      if (!this._listeners.has(event)) return;
      if (!handler) {
        this._listeners.delete(event);
        return;
      }
      const list = this._listeners.get(event);
      const filtered = list.filter(entry => entry.handler !== handler);
      if (filtered.length > 0) {
        this._listeners.set(event, filtered);
      } else {
        this._listeners.delete(event);
      }
    }

    /**
     * 이벤트 발행
     * @param {string} event 이벤트 이름
     * @param {*} [payload] 전달할 데이터
     */
    emit(event, payload) {
      if (!this._listeners.has(event)) return;

      // 재귀 호출 깊이 방어 (무한 루프 방지)
      const currentDepth = (this._depth.get(event) || 0) + 1;
      if (currentDepth > this._maxDepth) {
        console.warn(`[OurgoalEvents] Event loop detected on "${event}". Recursion halted at depth ${currentDepth}.`);
        return;
      }
      this._depth.set(event, currentDepth);

      const entries = [...this._listeners.get(event)];
      const toRemove = [];

      try {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          try {
            entry.handler(payload, event);
          } catch (err) {
            console.error(`[OurgoalEvents] Error in handler for event "${event}":`, err);
          }
          if (entry.once) {
            toRemove.push(entry.handler);
          }
        }
      } finally {
        this._depth.set(event, currentDepth - 1);
      }

      if (toRemove.length > 0) {
        toRemove.forEach(h => this.off(event, h));
      }
    }

    /**
     * 특정 이벤트에 등록된 리스너가 있는지 확인
     */
    has(event) {
      return this._listeners.has(event) && this._listeners.get(event).length > 0;
    }

    /**
     * 전체 또는 특정 이벤트 리스너 초기화
     */
    clear(event) {
      if (event) {
        this._listeners.delete(event);
      } else {
        this._listeners.clear();
      }
    }
  }

  // 표준 이벤트 상수 정본
  const EVENTS = Object.freeze({
    GOAL_CREATED: 'goal:created',
    GOAL_UPDATED: 'goal:updated',
    GOAL_DELETED: 'goal:deleted',
    RECORD_SAVED: 'record:saved',
    PROFILE_UPDATED: 'profile:updated',
    TAB_CHANGED: 'tab:changed',
    VIEW_SYNC: 'view:sync',
    THEME_CHANGED: 'theme:changed',
    AVATAR_CHANGED: 'avatar:changed'
  });

  const instance = new EventBus();
  instance.EventBus = EventBus;
  instance.EVENTS = EVENTS;

  // Node.js 및 브라우저 호환 바인딩
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalEvents = instance;
    global.OurgoalEventBus = EventBus;
  }
})(typeof window !== 'undefined' ? window : globalThis);
