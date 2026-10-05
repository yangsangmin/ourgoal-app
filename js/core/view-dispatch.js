/**
 * OurGoal View Dispatch (기관 — 4대 연계 뷰 동시 전파)
 *
 * 홈·목표·기록·일정 4대 연계 뷰를 한 번에 다시 그리는 디스패처(dispatchFullViewPropagation).
 * #TASK-ES-486(인라인 어려움 기관 묶음 이전 2차): index.html 인라인 IIFE 의 구간(이전 전 21940~21979줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 21940~21979줄(#TASK-ES-486 생성기 표지) ---- */
  function dispatchFullViewPropagation(specificViews){
    if(!L.state || !L.state.profile) return;
    var views = Array.isArray(specificViews) ? specificViews : ['home', 'records', 'stats', 'calendar'];
    var changeReason = (typeof specificViews === 'string') ? specificViews : null;
    /* [#TASK-ES-353 CORE-04] 같은 틱 렌더 합치기: 영역별 렌더를 버스의 requestRender 로 모으고 끝에서 1회씩 그린다(view:sync 구독 소블록과 같은 키) */
    var ev = window.OurgoalEvents;
    var queueRender = function(key, fn){
      if(ev && typeof ev.requestRender === 'function') ev.requestRender(key, fn);
      else { try { fn(); } catch(e){ console.warn('[FullViewPropagation] ' + key + ' error:', e); } }
    };
    if(views.includes('home') && typeof L.renderHome === 'function') queueRender('renderHome', L.renderHome);
    if(views.includes('records') && typeof L.renderRecordsScreen === 'function') queueRender('renderRecordsScreen', L.renderRecordsScreen);
    if(views.includes('stats')){
      if(typeof renderStatsScreen === 'function') queueRender('renderStatsScreen', renderStatsScreen);
      if(typeof universalStatsRender === 'function') queueRender('universalStatsRender', universalStatsRender);
    }
    if(views.includes('calendar') && typeof L.renderCalendarScreen === 'function') queueRender('renderCalendarScreen', L.renderCalendarScreen);
    try {
      if(window.OurgoalStore && typeof window.OurgoalStore.setState === 'function'){
        window.OurgoalStore.setState({
          'profile.records': L.state.profile.records || [],
          'profile.goals': L.state.profile.goals || []
        }, { silent: true });
      }
    } catch(storeErr){ console.warn('[FullViewPropagation] OurgoalStore error:', storeErr); }
    try {
      if(window.OurgoalEvents && typeof window.OurgoalEvents.emit === 'function'){
        window.OurgoalEvents.emit('view:sync', { views: views, state: L.state, reason: changeReason });
      }
    } catch(evErr){ console.warn('[FullViewPropagation] OurgoalEvents error:', evErr); }
    if(ev && typeof ev.flushRenders === 'function') ev.flushRenders();
    try {
      if(window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render && L.state.activeTab){
        window.OurgoalSanctuaryV3.render(L.state.activeTab);
      }
    } catch(e){ console.warn('[FullViewPropagation] SanctuaryV3 render error:', e); }
    try {
      if(typeof L.checkGuestBackupNudge === 'function') L.checkGuestBackupNudge();
    } catch(nudgeErr){}
  }

  K.dispatchFullViewPropagation = dispatchFullViewPropagation;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
