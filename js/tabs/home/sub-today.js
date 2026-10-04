/**
 * OurGoal Home Sub-Block: Today's Mission & 1-Second Cockpit (오늘의 미션 & 1초 콕핏)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalHomeToday = {
    id: 'today',
    megaBlockId: 'home',
    name: '오늘의 1초 콕핏 및 미션',
    containerId: 'todayMissionCard',

    /**
     * 소블록 마운트
     * @param {HTMLElement} container
     * @param {Object} state
     * @param {Object} events
     */
    mount: function(container, state, events) {
      // #TASK-ES-353: 이전 mount 의 구독을 먼저 해제하고, '실제로 그렸는가'를 돌려준다(빈 소블록이면 메가블록이 폴백)
      this.dispose(events);
      var drew = this.render(state) === true;
      this.bindEvents(events);
      return drew;
    },

    /**
     * 이전 mount 에서 건 구독 해제 (#TASK-ES-353 CORE-04)
     * @param {Object} events
     */
    dispose: function(events) {
      var ev = events || global.OurgoalEvents;
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('home/today');
    },

    /**
     * 화면 렌더링 (비파괴 점진 위임)
     * @param {Object} state
     */
    render: function(state) {
      var drew = false;
      try {
        if (typeof global.renderQuickCheckinGuideChips === 'function') {
          global.renderQuickCheckinGuideChips();
          drew = true;
        }
        if (typeof global.renderTodayMissionCard === 'function') {
          global.renderTodayMissionCard();
          drew = true;
        }
        if (typeof global.initDimensionSliders === 'function') {
          global.initDimensionSliders();
          drew = true;
        }
      } catch (err) {
        drew = false;
        console.warn('[OurgoalHomeToday] Render warning:', err);
      }
      return drew;
    },

    /**
     * 이벤트 버스 바인딩
     * @param {Object} events
     */
    bindEvents: function(events) {
      // #TASK-ES-353 CORE-04: 홈은 변경 전파기(dispatchFullViewPropagation)가 renderHome 으로 1회 다시 그린다.
      // renderHome 이 이 소블록의 렌더 함수까지 부르므로, 여기서 따로 구독하면 같은 영역을 두 번 그린다 → 구독하지 않는다.
      return events || global.OurgoalEvents;
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalHomeToday;
  }
  global.OurgoalHomeToday = OurgoalHomeToday;
})(typeof window !== 'undefined' ? window : globalThis);
