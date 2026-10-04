/**
 * OurGoal Community Sub-Block: Companions & DM (러닝메이트 동반자 및 DM)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalCommSubCompanions = {
    id: 'companions',
    megaBlockId: 'comm',
    name: '러닝메이트 동반자 및 DM',
    containerId: 'commSubBody',

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
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('comm/companions');
    },

    /**
     * 화면 렌더링 (비파괴 점진 위임)
     * @param {Object} state
     */
    render: function(state) {
      var drew = false;
      try {
        var s = state || global.state;
        if (!s || !s.profile) return false;

        var subBody = (typeof document !== 'undefined') ? document.getElementById(this.containerId) : null;
        if (s.commSubTab === 'companion' && typeof global.renderCommCompanions === 'function') {
          global.renderCommCompanions(subBody);
          drew = true;
        } else if (s.commSubTab === 'dm' && typeof global.renderCommDM === 'function') {
          global.renderCommDM(subBody);
          drew = true;
        }
      } catch (err) {
        drew = false;
        console.warn('[OurgoalCommSubCompanions] Render warning:', err);
      }
      return drew;
    },

    /**
     * 이벤트 버스 바인딩
     * @param {Object} events
     */
    bindEvents: function(events) {
      var ev = events || global.OurgoalEvents;
      if (!ev || typeof ev.on !== 'function') return;

      // #TASK-ES-353 CORE-04: 변경 이벤트는 1종(EVENTS.CHANGED = 'view:sync', dispatchFullViewPropagation 이 발행).
      // 소유자 키로 걸어 탭에 다시 들어와도 구독이 쌓이지 않고, 같은 틱의 요청은 'comm/companions' 키로 합쳐 1회만 그린다.
      var self = this;
      ev.on('view:sync', function() {
        if (typeof ev.requestRender === 'function') {
          ev.requestRender('comm/companions', function() { self.render(global.state); });
        } else {
          self.render(global.state);
        }
      }, { owner: 'comm/companions' });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCommSubCompanions;
  }
  global.OurgoalCommSubCompanions = OurgoalCommSubCompanions;
})(typeof window !== 'undefined' ? window : globalThis);
