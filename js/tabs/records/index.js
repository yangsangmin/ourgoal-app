/**
 * OurGoal Records Mega-Block Orchestrator (기록 탭 메가블록 총괄 허브)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 3계층 구조: 도크(index.html) -> 메가블록(records/index.js) -> 소블록(sub-*.js)
 * 800줄 이하 엄수 및 수밀 격벽(Watertight Boundary) 탑재
 */
(function(global) {
  'use strict';

  var OurgoalRecordsMegaBlock = {
    id: 'records',
    name: '기록 탭',
    containerId: 'screen-records',
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
        global.OurgoalRegistry.registerSubBlock('records', subBlock.id, subBlock);
      }
    },

    /**
     * 메가블록 초기화 (자체 서브블록 수집 및 등록)
     */
    init: function() {
      // 1. 소블록 자동 발견 및 등록
      if (global.OurgoalRecordsTimeline) {
        this.registerSubBlock(global.OurgoalRecordsTimeline);
      }
      if (global.OurgoalRecordsTimer) {
        this.registerSubBlock(global.OurgoalRecordsTimer);
      }
      if (global.OurgoalRecordsRetrospect) {
        this.registerSubBlock(global.OurgoalRecordsRetrospect);
      }

      // 2. 도크 레지스트리에 기록 메가블록 자신을 등록
      if (global.OurgoalRegistry && typeof global.OurgoalRegistry.registerMegaBlock === 'function') {
        var self = this;
        global.OurgoalRegistry.registerMegaBlock('records', {
          name: self.name,
          containerId: self.containerId,
          mount: function(container, state, events) {
            return self.mount(container, state, events);
          }
        });
      }
    },

    /**
     * 기록 메가블록 마운트 오케스트레이션 (수밀 격벽 보장)
     * @param {HTMLElement} container
     * @param {Object} state
     * @param {Object} events
     */
    mount: function(container, state, events) {
      var s = state || global.state;
      var ev = events || global.OurgoalEvents;

      // 1. 하위 소블록 순차 수밀 마운트
      var blockIds = Object.keys(this.subBlocks);
      for (var i = 0; i < blockIds.length; i++) {
        var bId = blockIds[i];
        var block = this.subBlocks[bId];
        try {
          if (block && typeof block.mount === 'function') {
            var subContainer = block.containerId && typeof document !== 'undefined'
              ? document.getElementById(block.containerId)
              : null;
            block.mount(subContainer, s, ev);
          }
        } catch (subErr) {
          console.warn('[OurgoalRecordsMegaBlock] Sub-block mount error in "' + bId + '":', subErr);
          if (ev && typeof ev.emit === 'function') {
            ev.emit('block:error', { megaBlockId: 'records', subBlockId: bId, error: subErr });
          }
        }
      }

      // 2. 전체 기록 화면 조율 및 폴백 렌더러 안전 호출 (무손실 점진 전환)
      try {
        if (typeof global.renderRecordsScreen === 'function') {
          global.renderRecordsScreen();
        }
      } catch (renderErr) {
        console.warn('[OurgoalRecordsMegaBlock] renderRecordsScreen fallback warning:', renderErr);
      }

      // 3. 마운트 완료 이벤트 발행
      if (ev && typeof ev.emit === 'function') {
        ev.emit('records:mounted', { timestamp: Date.now() });
      }

      return true;
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalRecordsMegaBlock;
  }
  global.OurgoalRecordsMegaBlock = OurgoalRecordsMegaBlock;

  // 브라우저 환경에서 자동 초기화 시도
  if (typeof window !== 'undefined') {
    OurgoalRecordsMegaBlock.init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
