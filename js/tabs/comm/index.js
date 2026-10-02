/**
 * OurGoal Community Mega-Block Orchestrator (소통 커뮤니티 탭 메가블록 총괄 허브)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 3계층 구조: 도크(index.html) -> 메가블록(comm/index.js) -> 소블록(sub-*.js)
 * 800줄 이하 엄수 및 수밀 격벽(Watertight Boundary) 탑재
 */
(function(global) {
  'use strict';

  var OurgoalCommMegaBlock = {
    id: 'comm',
    name: '소통 커뮤니티 탭',
    containerId: 'screen-comm',
    version: '1.0.0',
    subBlocks: {},

    /**
     * 서브블록 등록
     * @param {Object} subBlock
     */
    registerSubBlock: function(subBlock) {
      if (!subBlock || !subBlock.id) return;
      this.subBlocks[subBlock.id] = subBlock;

      // 선내 레지스트리에 소블록 등록
      if (global.OurgoalRegistry && typeof global.OurgoalRegistry.registerSubBlock === 'function') {
        global.OurgoalRegistry.registerSubBlock('comm', subBlock.id, subBlock);
      }
    },

    /**
     * 메가블록 초기화 (자체 서브블록 수집 및 등록)
     */
    init: function() {
      // 1. 소블록 자동 발견 및 등록
      if (global.OurgoalCommSubFeed) {
        this.registerSubBlock(global.OurgoalCommSubFeed);
      }
      if (global.OurgoalCommSubCompanions) {
        this.registerSubBlock(global.OurgoalCommSubCompanions);
      }
      if (global.OurgoalCommSubCrew) {
        this.registerSubBlock(global.OurgoalCommSubCrew);
      }

      // 2. 도크 레지스트리에 소통 메가블록 자신을 등록
      if (global.OurgoalRegistry && typeof global.OurgoalRegistry.registerMegaBlock === 'function') {
        var self = this;
        global.OurgoalRegistry.registerMegaBlock('comm', {
          name: self.name,
          containerId: self.containerId,
          mount: function(container, state, events) {
            return self.mount(container, state, events);
          }
        });
      }
    },

    /**
     * 소통 메가블록 마운트 오케스트레이션 (수밀 격벽 및 이중 렌더링 방어)
     * @param {HTMLElement} container
     * @param {Object} state
     * @param {Object} events
     */
    mount: function(container, state, events) {
      var s = state || global.state;
      var ev = events || global.OurgoalEvents;

      // 1. 하위 소블록 순차 수밀 마운트
      var blockIds = Object.keys(this.subBlocks);
      var mountedCount = 0;
      for (var i = 0; i < blockIds.length; i++) {
        var bId = blockIds[i];
        var block = this.subBlocks[bId];
        try {
          if (block && typeof block.mount === 'function') {
            var subContainer = block.containerId && typeof document !== 'undefined'
              ? document.getElementById(block.containerId)
              : null;
            block.mount(subContainer, s, ev);
            mountedCount++;
          }
        } catch (subErr) {
          console.warn('[OurgoalCommMegaBlock] Sub-block mount error in "' + bId + '":', subErr);
          if (ev && typeof ev.emit === 'function') {
            ev.emit('block:error', { megaBlockId: 'comm', subBlockId: bId, error: subErr });
          }
        }
      }

      // 2. 이중 렌더링 중복 방어 및 수밀 조율 (무손실 점진 전환 폴백)
      if (mountedCount === 0) {
        // 소블록이 없거나 마운트에 실패한 경우: 전체 소통 화면 레거시 렌더러 안전 폴백 호출
        try {
          if (typeof global.renderCommScreen === 'function') {
            global.renderCommScreen();
          }
        } catch (renderErr) {
          console.warn('[OurgoalCommMegaBlock] renderCommScreen fallback warning:', renderErr);
        }
      }

      // 3. 마운트 완료 이벤트 발행
      if (ev && typeof ev.emit === 'function') {
        ev.emit('comm:mounted', { timestamp: Date.now() });
      }

      return true;
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCommMegaBlock;
  }
  global.OurgoalCommMegaBlock = OurgoalCommMegaBlock;

  // 브라우저 환경에서 자동 초기화 시도
  if (typeof window !== 'undefined') {
    OurgoalCommMegaBlock.init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
