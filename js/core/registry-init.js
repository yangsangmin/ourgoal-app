/**
 * OurGoal Registry Init (기관 — 조선소 블록 레지스트리 6대 메가블록 초기화)
 *
 * 조선소 블록 레지스트리에 6대 메가블록을 등록·초기화하는 묶음(헌법 제3조 제9항).
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 6078~6135 · 6137~6192 · 6193~6198 · 6199~6199줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 6078~6135줄(#TASK-ES-471 생성기 표지) ---- */
  function initShipyardRegistry(){
    if(!window.OurgoalRegistry) return;
    if(window.OurgoalHomeMegaBlock && typeof window.OurgoalHomeMegaBlock.init === 'function'){
      window.OurgoalHomeMegaBlock.init();
    } else {
      window.OurgoalRegistry.registerMegaBlock('home', {
        name: '홈 탭',
        containerId: 'screen-home',
        mount: function(el, s, ev){ if(typeof L.renderHome === 'function') L.renderHome(); }
      });
    }
    if(window.OurgoalGoalsMegaBlock && typeof window.OurgoalGoalsMegaBlock.init === 'function'){
      window.OurgoalGoalsMegaBlock.init();
    } else {
      window.OurgoalRegistry.registerMegaBlock('goals', {
        name: '목표 탭',
        containerId: 'screen-goals',
        mount: function(el, s, ev){ if(typeof L.renderGoalsScreen === 'function') L.renderGoalsScreen(); }
      });
    }
    if(window.OurgoalCalendarMegaBlock && typeof window.OurgoalCalendarMegaBlock.init === 'function'){
      window.OurgoalCalendarMegaBlock.init();
    } else {
      window.OurgoalRegistry.registerMegaBlock('calendar', {
        name: '일정 캘린더 탭',
        containerId: 'screen-calendar',
        mount: function(el, s, ev){ if(typeof L.renderCalendarScreen === 'function') L.renderCalendarScreen(); }
      });
    }
    if(window.OurgoalRecordsMegaBlock && typeof window.OurgoalRecordsMegaBlock.init === 'function'){
      window.OurgoalRecordsMegaBlock.init();
    } else {
      window.OurgoalRegistry.registerMegaBlock('records', {
        name: '기록/회고 탭',
        containerId: 'screen-records',
        mount: function(el, s, ev){ if(typeof L.renderRecordsScreen === 'function') L.renderRecordsScreen(); }
      });
    }
    if(window.OurgoalCommMegaBlock && typeof window.OurgoalCommMegaBlock.init === 'function'){
      window.OurgoalCommMegaBlock.init();
    } else {
      window.OurgoalRegistry.registerMegaBlock('comm', {
        name: '동류 소통 탭',
        containerId: 'screen-comm',
        mount: function(el, s, ev){ if(typeof L.renderCommScreen === 'function') L.renderCommScreen(); }
      });
    }
    if(window.OurgoalSettingsMegaBlock && typeof window.OurgoalSettingsMegaBlock.init === 'function'){
      window.OurgoalSettingsMegaBlock.init();
    } else {
      window.OurgoalRegistry.registerMegaBlock('settings', {
        name: '설정 탭',
        containerId: 'screen-settings',
        mount: function(el, s, ev){ if(typeof L.renderSettingsScreen === 'function') L.renderSettingsScreen(); }
      });
    }
    window.OurgoalRegistry.markReady();
  }

  /* ---- 이전 전 index.html 6137~6192줄(#TASK-ES-471 생성기 표지) ---- */



  function setTab(tab){
    // [#UIUX-13] 탭별 독립 스크롤 위치 영속 메모리 저장
    window._tabScrollMemory = window._tabScrollMemory || {};
    if(L.state && L.state.activeTab){
      window._tabScrollMemory[L.state.activeTab] = window.scrollY || document.documentElement.scrollTop || 0;
    }

    function updateTabDOM(){
      L.state.activeTab = tab;
      L.navButtons.forEach(function(b){ b.classList.toggle('active', b.dataset.tab===tab); });
      L.screens.forEach(function(s){ s.classList.toggle('active', s.id==='screen-'+tab); });

      // [#UIUX-13] 탭별 독립 스크롤 위치 복원 (처음 가는 탭은 맨 위 0, 보던 탭은 직전 위치 복원)
      var targetScrollY = (window._tabScrollMemory && typeof window._tabScrollMemory[tab] === 'number') ? window._tabScrollMemory[tab] : 0;
      window.scrollTo({top: targetScrollY, behavior:'auto'});

      /* [#TASK-ES-353] 레지스트리 마운트가 실패(false)하면 레거시 렌더로 폴백 */
      var mountedByRegistry = !!(window.OurgoalRegistry && window.OurgoalRegistry.isReady() && window.OurgoalRegistry.mount(tab, document.getElementById('screen-' + tab), L.state));
      if(!mountedByRegistry){
        if(tab==='home') L.renderHome();
        if(tab==='goals') L.renderGoalsScreen();
        if(tab==='calendar') L.renderCalendarScreen();
        if(tab==='records') L.renderRecordsScreen();
        if(tab==='comm') L.renderCommScreen();
        if(tab==='settings') L.renderSettingsScreen();
      }
      if(window.OurgoalEvents && typeof window.OurgoalEvents.emit === 'function'){
        window.OurgoalEvents.emit('tab:changed', { tab: tab });
      }
      if(tab==='records' && typeof location !== 'undefined'){
        try {
          var recapParam = new URLSearchParams(window.location.search).get('recap');
          if(recapParam === 'weekly' || (location.hash && location.hash.indexOf('recap=weekly') !== -1)){
            setTimeout(function(){ if(typeof L.openWeeklyRecapModal==='function') L.openWeeklyRecapModal(); }, 350);
          }
        } catch(e){}
      }
      L.updatePrivacyBadges(); if(window.OurgoalGoalEditUX) OurgoalGoalEditUX.handleTabChange(tab, L.state);
      if(window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render) window.OurgoalSanctuaryV3.render(tab);
      var topGuideBtn = document.getElementById('topHomeGuideBtn');
      if(topGuideBtn){
        var guideTabLabels = { home: '홈', goals: '목표', calendar: '일정', records: '기록/통계', comm: '소통', settings: '설정' };
        var guideLabel = guideTabLabels[tab] || '홈';
        topGuideBtn.title = '이 페이지 활용법 (' + guideLabel + ')';
        topGuideBtn.setAttribute('aria-label', '이 페이지 활용법 (' + guideLabel + ')');
      }
    }
    if(typeof document !== 'undefined' && typeof document.startViewTransition === 'function'){
      document.startViewTransition(updateTabDOM);
    } else {
      updateTabDOM();
    }
  }
  /* ---- 이전 전 index.html 6193~6198줄(#TASK-ES-471 생성기 표지) ---- */
  function bindNavButtonsClick() { /* [#TASK-ES-471] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  L.navButtons.forEach(function(b){
    b.addEventListener('click', function(){
      if(typeof window.triggerHaptic === 'function') window.triggerHaptic(12);
      setTab(b.dataset.tab);
    });
  });
  } /* bindNavButtonsClick */
  /* ---- 이전 전 index.html 6199~6199줄(#TASK-ES-471 생성기 표지) ---- */
  function switchTab(tab){ return setTab(tab); }

  K.initShipyardRegistry = initShipyardRegistry;
  K.setTab = setTab;
  K.bindNavButtonsClick = bindNavButtonsClick;
  K.switchTab = switchTab;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
