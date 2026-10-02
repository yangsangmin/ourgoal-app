/**
 * OurGoal Home Sub-Block: Heatmap & Streak Summary (상단 히트맵 요약 스트릭)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalHomeHeatmap = {
    id: 'heatmap',
    megaBlockId: 'home',
    name: '홈 히트맵 요약 스트릭',
    containerId: 'homeGrassSummaryCard',

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
        // 기존 렌더러가 존재하면 안전하게 위임 실행
        if (typeof global.renderHomeGrassSummary === 'function') {
          global.renderHomeGrassSummary();
        }

        // 스트릭 배지 갱신 연동
        if (typeof global.computeStreakDays === 'function') {
          var streak = global.computeStreakDays();
          if (typeof global.updateAppBadge === 'function') {
            global.updateAppBadge(streak);
          }
          var badgeEl = document.getElementById('streakBadge');
          if (badgeEl && typeof global.streakBadgeHtml === 'function') {
            badgeEl.innerHTML = streak > 0 ? global.streakBadgeHtml(streak) : '';
          }
        }
      } catch (err) {
        console.warn('[OurgoalHomeHeatmap] Render warning:', err);
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
      ev.on('checkin:created', function() {
        self.render(global.state);
      });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalHomeHeatmap;
  }
  global.OurgoalHomeHeatmap = OurgoalHomeHeatmap;
})(typeof window !== 'undefined' ? window : globalThis);
