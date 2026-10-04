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
      this._renderQueue = new Map();
      this._renderScheduled = false;
    }

    /**
     * 이벤트 리스너 등록 (#TASK-ES-353 CORE-04: 중복 등록 방지)
     * - 같은 (이벤트, 핸들러) 를 다시 등록하면 새로 쌓지 않는다.
     * - options.owner(소유자 키)가 같은 (이벤트, 소유자) 가 이미 있으면 이전 것을 바꿔 끼운다.
     *   탭에 들어올 때마다 mount → bindEvents 가 다시 불려도 구독은 1개로 유지된다.
     * @param {string} event 이벤트 이름
     * @param {Function} handler 콜백 함수
     * @param {Object} [options] { once: boolean, owner: string }
     */
    on(event, handler, options) {
      if (typeof event !== 'string' || typeof handler !== 'function') {
        return () => {};
      }
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      const owner = options && typeof options.owner === 'string' && options.owner ? options.owner : null;
      let list = this._listeners.get(event);
      if (list.some(entry => entry.handler === handler)) {
        return () => this.off(event, handler);
      }
      if (owner) {
        list = list.filter(entry => entry.owner !== owner);
        this._listeners.set(event, list);
      }
      const entry = {
        handler,
        once: options && options.once === true,
        owner
      };
      list.push(entry);

      // 구독 해제 함수 반환
      return () => this.off(event, handler);
    }

    /**
     * 소유자 키로 등록된 구독 전부 해제 (소블록 dispose)
     * @param {string} owner 소유자 키 (예: 'records/timeline')
     * @returns {number} 해제한 구독 수
     */
    offOwner(owner) {
      if (typeof owner !== 'string' || !owner) return 0;
      let removed = 0;
      Array.from(this._listeners.keys()).forEach(event => {
        const list = this._listeners.get(event);
        const kept = list.filter(entry => entry.owner !== owner);
        removed += list.length - kept.length;
        if (kept.length > 0) this._listeners.set(event, kept);
        else this._listeners.delete(event);
      });
      return removed;
    }

    /**
     * 현재 구독 목록 (계측·점검용): [{ event, owner }]
     */
    subscriptions() {
      const out = [];
      this._listeners.forEach((list, event) => {
        list.forEach(entry => out.push({ event, owner: entry.owner || null }));
      });
      return out;
    }

    /**
     * 같은 틱 렌더 합치기: 같은 key 로 여러 번 요청해도 한 번만 그린다.
     * - flushRenders() 가 불리면 그 자리에서 동기로 한 번씩 그린다
     *   (dispatchFullViewPropagation 이 끝에서 부른다 — 기존처럼 전파 직후 화면이 맞아 있다).
     * - flushRenders() 가 불리지 않으면 마이크로태스크에서 그린다.
     * @param {string} key 렌더 영역 키 (렌더 함수 이름을 쓴다, 예: 'renderRecordsScreen')
     * @param {Function} fn 렌더 함수
     */
    requestRender(key, fn) {
      if (typeof key !== 'string' || typeof fn !== 'function') return false;
      if (!this._renderQueue.has(key)) this._renderQueue.set(key, fn);
      if (!this._renderScheduled) {
        this._renderScheduled = true;
        const run = () => this.flushRenders();
        if (typeof queueMicrotask === 'function') queueMicrotask(run);
        else Promise.resolve().then(run);
      }
      return true;
    }

    /**
     * 대기 중인 렌더를 지금 한 번씩 실행
     * @returns {number} 실행한 렌더 수
     */
    flushRenders() {
      this._renderScheduled = false;
      if (this._renderQueue.size === 0) return 0;
      const jobs = Array.from(this._renderQueue.entries());
      this._renderQueue.clear();
      jobs.forEach(([key, fn]) => {
        try {
          fn();
        } catch (err) {
          console.error(`[OurgoalEvents] Render error for "${key}":`, err);
        }
      });
      return jobs.length;
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
  // #TASK-ES-353 CORE-04: 구독은 실제로 발행되는 이름에만 건다. 발행처가 없는 이름은 여기 두지 않는다.
  const EVENTS = Object.freeze({
    // 변경 이벤트 1종 — 데이터가 바뀐 뒤 dispatchFullViewPropagation(index.html)이 발행한다.
    // 체크인·기록·목표·할일·일정·EXP·설정 어느 변경이든 이 이름 하나로 퍼진다. payload: { views, state, reason }
    CHANGED: 'view:sync',
    VIEW_SYNC: 'view:sync',
    // 체크인 저장 직후(captureSave·focusCheckin·saveQuickCheckin) — 뒤이어 CHANGED 가 온다
    CHECKIN_CREATED: 'checkin:created',
    RECORD_SAVED: 'record:saved',
    // 탭 전환(setTab)
    TAB_CHANGED: 'tab:changed',
    // OurgoalStore.set 의 상태 변경
    STATE_UPDATED: 'state:updated',
    // 레지스트리 준비·블록 오류
    REGISTRY_READY: 'registry:ready',
    BLOCK_ERROR: 'block:error'
  });

  // 변경 이벤트 사전: 무엇이 바뀌었는지(reason) → 발행 이름. 모든 영역이 EVENTS.CHANGED 하나로 퍼진다.
  // 받는 쪽은 reason 으로 거르지 않고 자기 영역만 requestRender 로 1회 다시 그린다(같은 틱 합치기).
  const CHANGE_DICTIONARY = Object.freeze({
    checkin: EVENTS.CHANGED,
    record: EVENTS.CHANGED,
    goal: EVENTS.CHANGED,
    todo: EVENTS.CHANGED,
    schedule: EVENTS.CHANGED,
    exp: EVENTS.CHANGED,
    settings: EVENTS.CHANGED
  });

  const instance = new EventBus();
  instance.EventBus = EventBus;
  instance.EVENTS = EVENTS;
  instance.CHANGE_DICTIONARY = CHANGE_DICTIONARY;

  // Node.js 및 브라우저 호환 바인딩
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalEvents = instance;
    global.OurgoalEventBus = EventBus;
  }
})(typeof window !== 'undefined' ? window : globalThis);
