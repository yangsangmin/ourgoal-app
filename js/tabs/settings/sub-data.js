/**
 * OurGoal Settings Sub-Block: AI · Storage · Export · Support (AI 키 · 자동 제안 · 캐시 · 내보내기 형식 · 고객지원 · 고급 설정 햅틱)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 39519~39593줄)을 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 그리는 순서와 같은 settings 객체는 renderSettingsScreen(js/tabs/settings/render.js)이 정한다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // 공용 부품은 js/core 두 곳으로만 읽는다(설정 전용 통로 없음).
  //  U = js/core/ui-helpers.js — 여러 탭이 같이 쓰는 순수 헬퍼(escapeHtml·a11ySwitch·download), 코드가 실제로 옮겨 와 있다.
  //  L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var U = global.OurgoalUiHelpers || {};
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 설정 키트: 설정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* 섹션 렌더: renderSettingsScreen 이 원래 순서대로 부른다. settings = state.profile.settings (renderSettingsScreen 이 한 번 읽어 넘긴 같은 객체) */
  function renderDataSection(settings){
    // AI 설정 (Gemini API 전면 단일화)
    settings.aiProvider = 'gemini';
    var aiWrap = document.getElementById('aiProviderToggle');
    if(aiWrap){
      aiWrap.querySelectorAll('.format-opt').forEach(function(o){
        o.classList.add('active');
        o.onclick = async function(){
          settings.aiProvider = 'gemini';
          await L.saveProfile();
          K.renderSettingsScreen();
        };
      });
    }
    var geminiBlock = document.getElementById('geminiKeyBlock');
    if(geminiBlock) geminiBlock.style.display = '';
    var keyInput = document.getElementById('geminiKeyInput');
    var modelInput = document.getElementById('geminiModelInput');
    if(keyInput){
      keyInput.value = settings.geminiKey || '';
      keyInput.onchange = async function(){ settings.geminiKey = keyInput.value.trim(); await L.saveProfile(); };
    }
    if(modelInput){
      modelInput.value = settings.geminiModel || 'gemini-3.1-flash-lite';
      modelInput.onchange = async function(){ settings.geminiModel = modelInput.value.trim() || 'gemini-3.1-flash-lite'; await L.saveProfile(); };
    }
    var autoSw = document.getElementById('autoUpdateSwitch');
    autoSw.className = 'switch' + (settings.autoUpdateSuggest!==false ? ' on' : '');
    U.a11ySwitch(autoSw, settings.autoUpdateSuggest!==false, '기록 보고 목표 진행 상황 자동 업데이트 제안');
    autoSw.onclick = async function(){
      settings.autoUpdateSuggest = settings.autoUpdateSuggest===false;
      await L.saveProfile();
      K.renderSettingsScreen();
    };
    // 💾 저장공간 및 캐시 관리 (Req 10)
    var clearCacheBtn = document.getElementById('clearCacheBtn');
    if(clearCacheBtn){
      /* [#TASK-ES-346 SET-01] 실측: 지우기 버튼은 화면 캐시(Cache API)만 지우고, 지운 뒤 다시 잰 값을 보여 준다.
         목표·기록·설정(localStorage)은 지우지 않는다. */
      clearCacheBtn.onclick = async function(){
        clearCacheBtn.disabled = true;
        var removed = 0, failed = false;
        try {
          if(window.caches && typeof caches.keys === 'function'){
            var keys = await caches.keys();
            for(var ci = 0; ci < keys.length; ci++){
              if(await caches.delete(keys[ci])) removed++;
            }
          } else {
            failed = true;
          }
        } catch(e){ failed = true; }
        await K.paintCacheUsage();
        clearCacheBtn.disabled = false;
        L.toast(failed ? '이 브라우저에서는 화면 캐시를 지울 수 없어요.' : ('화면 캐시 ' + removed + '개 묶음을 지웠어요. 목표·기록은 그대로예요.'));
      };
    }
    K.paintCacheUsage();
    var fmtWrap = document.getElementById('formatToggle');
    fmtWrap.querySelectorAll('.format-opt').forEach(function(o){
      o.classList.toggle('active', o.dataset.fmt===L.state.profile.settings.exportFormat);
      o.onclick = async function(){ L.state.profile.settings.exportFormat = o.dataset.fmt; await L.saveProfile(); K.renderSettingsScreen(); };
    });
    // 💬 고객지원 및 FAQ (Req 10)
    var inqBtn = document.getElementById('feedbackInquiryBtn');
    if(inqBtn) inqBtn.onclick = L.openCustomerInquiryModal;
    var faqBtn = document.getElementById('faqAccordionBtn');
    if(faqBtn) faqBtn.onclick = L.openFaqModal;

    var advAccordion = document.getElementById('advancedSettingsAccordion');
    if(advAccordion && !advAccordion._hapticBound){
      advAccordion._hapticBound = true;
      advAccordion.addEventListener('toggle', function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
      });
    }
  }

  var OurgoalSettingsSubData = {
    id: 'data',
    megaBlockId: 'settings',
    name: 'AI·저장공간·내보내기·지원',
    containerId: 'geminiKeyBlock',

    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */
    render: renderDataSection,

    /**
     * 소블록 단독 마운트는 그리지 않고 false('그리지 않음')를 돌려준다.
     * 설정 화면은 섹션끼리 settings 객체·호출 순서를 공유하므로 renderSettingsScreen 이 한 번에 그린다 —
     * 메가블록(index.js)은 이 false 를 보고 이전과 같은 경로(setTab 의 renderSettingsScreen)로 넘긴다. (#TASK-ES-353 '실제로 그렸는가' 판정 유지)
     */
    mount: function(container, state, events) {
      this.dispose(events);
      return false;
    },

    /** 이 소블록이 건 구독 해제(#TASK-ES-353 소유자 키). 설정 섹션은 view:sync 로 다시 그리지 않는다(이전과 같음). */
    dispose: function(events) {
      var ev = events || global.OurgoalEvents;
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/data');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubData;
  }
  global.OurgoalSettingsSubData = OurgoalSettingsSubData;
})(typeof window !== 'undefined' ? window : globalThis);
