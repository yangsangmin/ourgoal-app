/**
 * OurGoal Records Sub-Block: Retrospect & AI Review (5단위 회고 및 AI 피드백)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalRecordsRetrospect = {
    id: 'retrospect',
    megaBlockId: 'records',
    name: '5단위 회고 및 AI 피드백',
    containerId: 'recAiFeedbackSlot',

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
        if (!s || !s.profile) return;

        // 기존 AI 피드백 슬롯 동기화 위임
        if (typeof global.syncRealtimeAiFeedbackSlot === 'function') {
          global.syncRealtimeAiFeedbackSlot();
        }
      } catch (err) {
        console.warn('[OurgoalRecordsRetrospect] Render warning:', err);
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
      ev.on('retrospect:updated', function() {
        self.render(global.state);
      });
      ev.on('aiFeedback:refreshed', function() {
        self.render(global.state);
      });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalRecordsRetrospect;
  }
  global.OurgoalRecordsRetrospect = OurgoalRecordsRetrospect;
})(typeof window !== 'undefined' ? window : globalThis);
