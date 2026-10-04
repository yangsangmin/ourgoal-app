/**
 * OurGoal Goals Mega-Block Orchestrator (목표 메가블록 총괄 허브)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 3계층 구조: 도크(index.html) -> 메가블록(goals/index.js) -> 소블록(sub-*.js)
 * 800줄 이하 엄수 및 수밀 격벽(Watertight Boundary) 탑재
 */
(function(global) {
  'use strict';

  var OurgoalGoalsMegaBlock = {
    id: 'goals',
    name: '목표 탭',
    containerId: 'screen-goals',
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
        global.OurgoalRegistry.registerSubBlock('goals', subBlock.id, subBlock);
      }
    },

    /**
     * 메가블록 초기화 (자체 서브블록 수집 및 등록)
     */
    init: function() {
      // 1. 소블록 자동 발견 및 등록
      if (global.OurgoalGoalsPersonal) {
        this.registerSubBlock(global.OurgoalGoalsPersonal);
      }
      if (global.OurgoalGoalsRoutine) {
        this.registerSubBlock(global.OurgoalGoalsRoutine);
      }
      if (global.OurgoalGoalsTeam) {
        this.registerSubBlock(global.OurgoalGoalsTeam);
      }

      // 2. 도크 레지스트리에 목표 메가블록 자신을 등록
      if (global.OurgoalRegistry && typeof global.OurgoalRegistry.registerMegaBlock === 'function') {
        var self = this;
        global.OurgoalRegistry.registerMegaBlock('goals', {
          name: self.name,
          containerId: self.containerId,
          mount: function(container, state, events) {
            self.mount(container, state, events);
            return self.lastMountDrew === true;
          }
        });
      }
    },

    /**
     * 목표 메가블록 마운트 오케스트레이션 (수밀 격벽 및 이중 렌더링 방어)
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
      var fallbackDrew = false;
      for (var i = 0; i < blockIds.length; i++) {
        var bId = blockIds[i];
        var block = this.subBlocks[bId];
        try {
          if (block && typeof block.mount === 'function') {
            var subContainer = block.containerId && typeof document !== 'undefined'
              ? document.getElementById(block.containerId)
              : null;
            // #TASK-ES-353: '실제로 그렸다'(true)를 돌려준 소블록만 센다 — 빈 소블록뿐이면 아래 폴백이 돈다
            if (block.mount(subContainer, s, ev) === true) mountedCount++;
          }
        } catch (subErr) {
          console.warn('[OurgoalGoalsMegaBlock] Sub-block mount error in "' + bId + '":', subErr);
          if (ev && typeof ev.emit === 'function') {
            ev.emit('block:error', { megaBlockId: 'goals', subBlockId: bId, error: subErr });
          }
        }
      }

      // 2. 이중 렌더링 중복 방어 및 수밀 조율 (무손실 점진 전환 폴백)
      if (mountedCount === 0) {
        // 소블록이 없거나 아무 소블록도 실제로 그리지 못한 경우(#TASK-ES-353): 전체 목표 화면 레거시 렌더러 안전 폴백 호출
        try {
          if (typeof global.renderGoalsScreen === 'function') {
            global.renderGoalsScreen();
            fallbackDrew = true;
          }
        } catch (renderErr) {
          console.warn('[OurgoalGoalsMegaBlock] renderGoalsScreen fallback warning:', renderErr);
        }
      }

      // #TASK-ES-353: 실제로 그렸는가 — 레지스트리 경유 마운트는 이 값을 돌려줘 setTab 이 레거시 렌더로 폴백하게 한다
      this.lastMountDrew = mountedCount > 0 || fallbackDrew;

      // 3. 마운트 완료 이벤트 발행
      if (ev && typeof ev.emit === 'function') {
        ev.emit('goals:mounted', { timestamp: Date.now() });
      }

      return true;
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalGoalsMegaBlock;
  }
  global.OurgoalGoalsMegaBlock = OurgoalGoalsMegaBlock;

  // 브라우저 환경에서 자동 초기화 시도
  if (typeof window !== 'undefined') {
    OurgoalGoalsMegaBlock.init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
