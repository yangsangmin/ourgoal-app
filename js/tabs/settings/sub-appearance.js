/**
 * OurGoal Settings Sub-Block: Appearance & Themes (화면 테마 4종 및 알림/위젯 설정)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalSettingsSubAppearance = {
    id: 'appearance',
    megaBlockId: 'settings',
    name: '화면 테마 4종 및 알림/위젯 설정',
    containerId: 'screen-settings',

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
        if (!s || !s.profile) return;

        // 테마 및 프라이버시 배지 갱신 보조
        if (typeof global.updatePrivacyBadges === 'function') {
          global.updatePrivacyBadges();
        }
      } catch (err) {
        console.warn('[OurgoalSettingsSubAppearance] Render warning:', err);
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
      ev.on('theme:changed', function() {
        self.render(global.state);
      });
      ev.on('privacy:updated', function() {
        self.render(global.state);
      });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubAppearance;
  }
  global.OurgoalSettingsSubAppearance = OurgoalSettingsSubAppearance;
})(typeof window !== 'undefined' ? window : globalThis);
