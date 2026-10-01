/**
 * OurGoal Calendar Sub-Block: Photo Diary Thumbnails (사진형 일기 썸네일 뷰어)
 * 
 * 최고 헌법 제3조 제9항(조선소 블록형 모듈화 및 진화형 아키텍처 규범)
 * 단일 책임 원칙(SRP) 및 800줄 이하 엄수
 */
(function(global) {
  'use strict';

  var OurgoalCalendarPhotoDiary = {
    id: 'photo-diary',
    megaBlockId: 'calendar',
    name: '사진형 일기 썸네일 뷰어',
    containerId: 'calSubGuideBanner',

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

        // 기존 사진 일기 썸네일 렌더러 연동
        if (typeof global.renderCalendarPhotoThumbnails === 'function') {
          global.renderCalendarPhotoThumbnails();
        }
      } catch (err) {
        console.warn('[OurgoalCalendarPhotoDiary] Render warning:', err);
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
      ev.on('photoDiary:uploaded', function() {
        self.render(global.state);
      });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCalendarPhotoDiary;
  }
  global.OurgoalCalendarPhotoDiary = OurgoalCalendarPhotoDiary;
})(typeof window !== 'undefined' ? window : globalThis);
