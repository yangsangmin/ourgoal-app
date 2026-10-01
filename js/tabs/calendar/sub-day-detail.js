/**
 * OurGoal Calendar Sub-Block: Day Detail Timeline (일자별 체크인 및 목표 실천 타임라인)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalCalendarDayDetail = {
    id: 'day-detail',
    megaBlockId: 'calendar',
    name: '일자별 체크인 및 목표 실천 타임라인',
    containerId: 'calDayDetailSlot',

    /**
     * 소블록 마운트
     * @param {HTMLElement} container
     * @param {Object} state
     * @param {Object} events
     */
    mount: function(container, state, events) {
      this.render(state);
      this.bindEvents(events);
      return true;
    },

    /**
     * 화면 렌더링
     * @param {Object} state
     */
    render: function(state) {
      try {
        var s = state || global.state;
        if (!s) return;

        // 기존 일별 상세 모달/시트 렌더러 연동
        if (typeof global.renderCalendarDayDetail === 'function') {
          global.renderCalendarDayDetail();
        }
      } catch (err) {
        console.warn('[OurgoalCalendarDayDetail] Render warning:', err);
      }
    },

    /**
     * 이벤트 버스 바인딩
     * @param {Object} events
     */
    bindEvents: function(events) {
      var ev = events || global.OurgoalEvents;
      if (!ev || typeof ev.on !== 'function') return;

      var self = this;
      ev.on('view:sync', function() {
        self.render(global.state);
      });
      ev.on('calendar:dayDetailOpened', function() {
        self.render(global.state);
      });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCalendarDayDetail;
  }
  global.OurgoalCalendarDayDetail = OurgoalCalendarDayDetail;
})(typeof window !== 'undefined' ? window : globalThis);
