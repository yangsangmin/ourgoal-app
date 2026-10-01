/**
 * OurGoal Goals Sub-Block: Team & Linked Goals (팀 목표 및 팀 연계)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalGoalsTeam = {
    id: 'team',
    megaBlockId: 'goals',
    name: '팀 목표 및 팀 연계',
    containerId: 'teamGoalsView',

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
     * 화면 렌더링 (비파괴 점진 위임)
     * @param {Object} state
     */
    render: function(state) {
      try {
        var s = state || global.state;
        if (!s) return;

        if (s.goalsSubTab === 'team') {
          if (typeof global.renderTeamGoalsScreen === 'function') {
            global.renderTeamGoalsScreen();
          }
        } else if (s.goalsSubTab === 'teamLinked') {
          if (global.OurgoalTeamLinkedGoals && typeof global.OurgoalTeamLinkedGoals.renderTeamLinkedGoalsScreen === 'function') {
            global.OurgoalTeamLinkedGoals.renderTeamLinkedGoalsScreen();
          }
        }
      } catch (err) {
        console.warn('[OurgoalGoalsTeam] Render warning:', err);
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
      ev.on('goal:updated', function() {
        self.render(global.state);
      });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalGoalsTeam;
  }
  global.OurgoalGoalsTeam = OurgoalGoalsTeam;
})(typeof window !== 'undefined' ? window : globalThis);
