/**
 * OurGoal Shipyard Architecture - Block Registry (조선소 레지스트리 도크)
 * 최고 헌법 제3조 제9항 제2호: 진화형 블록 레지스트리 및 동적 조립 규범
 * 
 * 6대 독립 메가블록과 28대 소블록을 등록·관리·마운트하며,
 * 특정 블록의 장애가 타 블록으로 번지지 않도록 수밀 격벽(Watertight Boundary)을 제공한다.
 */
(function (global) {
  'use strict';

  class BlockRegistry {
    constructor() {
      // 6대 메가블록 레지스트리: Map<string, MegaBlockConfig>
      this._megaBlocks = new Map();
      // 등록된 블록 상태 관측
      this._isReady = false;
      this._errorLog = [];
    }

    /**
     * 메가블록 등록
     * @param {string} id 메가블록 식별자 (예: 'home', 'goals', 'calendar', 'records', 'comm', 'settings')
     * @param {Object} config 블록 설정
     *   - name: string (블록 명칭)
     *   - containerId: string (마운트 대상 DOM 요소 id)
     *   - mount: Function (마운트/렌더링 핸들러 (container, state, events))
     *   - unmount: Function (정리 핸들러)
     */
    registerMegaBlock(id, config) {
      if (!id || typeof id !== 'string') {
        throw new Error('[OurgoalRegistry] megaBlock id must be a non-empty string');
      }
      if (!config || typeof config !== 'object') {
        throw new Error(`[OurgoalRegistry] config for megaBlock "${id}" must be an object`);
      }

      const existing = this._megaBlocks.get(id);
      const subBlocks = existing ? existing.subBlocks : new Map();

      const blockConfig = {
        id,
        name: config.name || id,
        containerId: config.containerId || `screen-${id}`,
        mount: typeof config.mount === 'function' ? config.mount : null,
        unmount: typeof config.unmount === 'function' ? config.unmount : null,
        subBlocks,
        mounted: false,
        version: config.version || '1.0.0',
        metadata: config.metadata || {}
      };

      this._megaBlocks.set(id, blockConfig);
      return this;
    }

    /**
     * 소블록 등록 (메가블록 하위)
     * @param {string} megaId 상위 메가블록 id
     * @param {string} subId 소블록 id (예: 'cockpit', 'quest-board', 'grid', 'feed')
     * @param {Object} config 소블록 설정
     */
    registerSubBlock(megaId, subId, config) {
      if (!this._megaBlocks.has(megaId)) {
        // 상위 메가블록이 아직 없으면 뼈대 자동 생성
        this.registerMegaBlock(megaId, { name: megaId });
      }
      const mega = this._megaBlocks.get(megaId);
      const subConfig = {
        id: subId,
        megaId,
        name: config.name || subId,
        containerId: config.containerId || `${megaId}-${subId}-slot`,
        mount: typeof config.mount === 'function' ? config.mount : null,
        unmount: typeof config.unmount === 'function' ? config.unmount : null,
        version: config.version || '1.0.0',
        metadata: config.metadata || {}
      };
      mega.subBlocks.set(subId, subConfig);
      return this;
    }

    /**
     * 특정 메가블록 안전 마운트 (수밀 격벽 적용)
     * @param {string} id 메가블록 id
     * @param {HTMLElement|string} [container] 마운트할 컨테이너 (없으면 containerId로 검색)
     * @param {Object} [state] 주입할 상태
     */
    mount(id, container, state) {
      const block = this._megaBlocks.get(id);
      if (!block) {
        console.warn(`[OurgoalRegistry] MegaBlock "${id}" not found.`);
        return false;
      }

      let el = container;
      if (typeof el === 'string') {
        el = document.getElementById(el) || document.querySelector(el);
      }
      if (!el && typeof document !== 'undefined') {
        el = document.getElementById(block.containerId);
      }

      if (!block.mount) {
        // 마운트 함수가 아직 위임되지 않은 경우 (Strangler Fig 이행 중)
        return false;
      }

      // 수밀 격벽: 개별 블록의 오류가 전역 애플리케이션으로 전파되지 않도록 완벽 격리
      try {
        const result = block.mount(el, state || (global.OurgoalStore ? global.OurgoalStore.getState() : {}), global.OurgoalEvents);
        // #TASK-ES-353 CORE-04: 블록이 명시적으로 false(아무것도 못 그림)를 돌려주면 실패로 알려 호출자(setTab)가 폴백하게 한다.
        // 메가블록은 소블록이 하나도 그리지 못하면 자체 폴백을 먼저 돈다. undefined 를 돌려주는 옛 마운트 함수는 성공으로 본다.
        block.mounted = result !== false;
        block.mountCount = (block.mountCount || 0) + 1;
        return block.mounted;
      } catch (err) {
        const errorRecord = {
          blockId: id,
          timestamp: new Date().toISOString(),
          error: err && err.message ? err.message : String(err)
        };
        this._errorLog.push(errorRecord);
        console.error(`[OurgoalRegistry Watertight Boundary] Failed to mount block "${id}":`, err);

        // 이벤트 버스를 통한 장애 격리 알림
        if (global.OurgoalEvents && typeof global.OurgoalEvents.emit === 'function') {
          global.OurgoalEvents.emit('block:error', errorRecord);
        }
        return false;
      }
    }

    /**
     * 특정 블록 언마운트
     */
    unmount(id, container) {
      const block = this._megaBlocks.get(id);
      if (!block || !block.unmount) return false;
      try {
        block.unmount(container);
        block.mounted = false;
        return true;
      } catch (err) {
        console.error(`[OurgoalRegistry] Error unmounting block "${id}":`, err);
        return false;
      }
    }

    /**
     * 블록 조회
     */
    getBlock(megaId, subId) {
      const mega = this._megaBlocks.get(megaId);
      if (!mega) return null;
      if (!subId) return mega;
      return mega.subBlocks.get(subId) || null;
    }

    /**
     * 등록된 전체 메가블록 목록 조회
     */
    listMegaBlocks() {
      return Array.from(this._megaBlocks.values()).map(b => ({
        id: b.id,
        name: b.name,
        containerId: b.containerId,
        mounted: b.mounted,
        subBlockCount: b.subBlocks.size
      }));
    }

    /**
     * 특정 메가블록의 소블록 목록 조회
     */
    listSubBlocks(megaId) {
      const mega = this._megaBlocks.get(megaId);
      if (!mega) return [];
      return Array.from(mega.subBlocks.values());
    }

    /**
     * 레지스트리 준비 상태 표시
     */
    markReady() {
      this._isReady = true;
      if (global.OurgoalEvents && typeof global.OurgoalEvents.emit === 'function') {
        global.OurgoalEvents.emit('registry:ready', { blockCount: this._megaBlocks.size });
      }
    }

    isReady() {
      return this._isReady;
    }

    getErrorLog() {
      return [...this._errorLog];
    }
  }

  const instance = new BlockRegistry();
  instance.BlockRegistry = BlockRegistry;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalRegistry = instance;
    global.OurgoalBlockRegistry = BlockRegistry;
  }
})(typeof window !== 'undefined' ? window : globalThis);
