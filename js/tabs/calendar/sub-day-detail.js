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
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('calendar/day-detail');
    },

    /**
     * 화면 렌더링
     * @param {Object} state
     */
    render: function(state) {
      var drew = false;
      try {
        var s = state || global.state;
        if (!s) return false;

        // [#TASK-ES-362 CAL-04] 선택한 날 상세 칸 렌더러 연동. 예전에는 어디에도 없는 global.renderCalendarDayDetail 을 찾아
        // 늘 그리지 않았다. 실제 함수는 같은 일정 세포의 day-detail.js 가 일정 키트에 올린 refreshCalDayDetail 이다(전역 이름을 늘리지 않는다).
        // 상세 칸(#calDayDetail)이나 프로필이 없으면 그리지 않고 false — 메가블록이 폴백한다.
        var kit = global.OurgoalCalendarKit;
        if (kit && typeof kit.refreshCalDayDetail === 'function') {
          drew = kit.refreshCalDayDetail() === true;
        }
      } catch (err) {
        drew = false;
        console.warn('[OurgoalCalendarDayDetail] Render warning:', err);
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
      // 소유자 키로 걸어 탭에 다시 들어와도 구독이 쌓이지 않고, 같은 틱의 요청은 'renderCalendarDayDetail' 키로 합쳐 1회만 그린다.
      var self = this;
      ev.on('view:sync', function() {
        if (typeof ev.requestRender === 'function') {
          ev.requestRender('renderCalendarDayDetail', function() { self.render(global.state); });
        } else {
          self.render(global.state);
        }
      }, { owner: 'calendar/day-detail' });
    }
  };

  // 전역 및 모듈 노출
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalCalendarDayDetail;
  }
  global.OurgoalCalendarDayDetail = OurgoalCalendarDayDetail;
})(typeof window !== 'undefined' ? window : globalThis);
