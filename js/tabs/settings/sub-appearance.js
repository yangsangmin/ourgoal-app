/**
 * OurGoal Settings Sub-Block: Appearance (테마 · 고대비 · 글자 크기 · 데이터 절약)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 39205~39274줄)을 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 그리는 순서와 같은 settings 객체는 renderSettingsScreen(js/tabs/settings/render.js)이 정한다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // 공용 부품은 js/core 두 곳으로만 읽는다(설정 전용 통로 없음).
  //  U = js/core/ui-helpers.js — 여러 탭이 같이 쓰는 순수 헬퍼(escapeHtml·a11ySwitch·nowISO·download·triggerHaptic·triggerHapticFeedback), 코드가 실제로 옮겨 와 있다.
  //  L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var U = global.OurgoalUiHelpers || {};
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 설정 키트: 설정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* 섹션 렌더: renderSettingsScreen 이 원래 순서대로 부른다. settings = state.profile.settings (renderSettingsScreen 이 한 번 읽어 넘긴 같은 객체) */
  function renderAppearanceSection(settings){
    // 🎨 화면 스타일 (Req 10 - 8대 테마)
    var curTheme = (settings && settings.theme) || localStorage.getItem('ourgoal_current_theme') || 'focus-sanctuary';
    if(curTheme === 'dark') curTheme = 'black';
    if(curTheme === 'light' || curTheme === 'system') curTheme = 'white';
    var themeGrid = document.getElementById('themeGrid');
    if(themeGrid){
      themeGrid.innerHTML = L.THEMES.map(function(t){
        var isActive = (t.id === curTheme);
        return '<div class="theme-card' + (isActive ? ' active' : '') + '" data-themeid="' + t.id + '">' +
          '<div class="theme-dot theme-swatch" style="background:' + t.preview + '"></div>' +
          '<div class="theme-info">' +
            '<div class="theme-name">' + (t.label || t.name) + (isActive ? ' <span class="theme-check"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span>' : '') + '</div>' +
            '<div class="theme-desc">' + t.desc + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      themeGrid.querySelectorAll('.theme-card').forEach(function(card){
        card.onclick = async function(){
          var tid = card.dataset.themeid;
          if(settings){
            settings.theme = tid;
            await L.saveProfile();
          }
          L.applyTheme(tid);
          K.renderSettingsScreen();
          U.triggerHaptic(10);
          var found = L.THEMES.find(function(t){ return t.id === tid; });
          L.toast((found ? found.name : tid) + ' 테마가 적용되었어요');
        };
      });
    }
    var hcSw = document.getElementById('highContrastSwitch');
    if(hcSw){
      var hcOn = !!settings.highContrast;
      hcSw.className = 'switch' + (hcOn ? ' on' : '');
      U.a11ySwitch(hcSw, hcOn, '고대비 모드');
      hcSw.onclick = async function(){
        settings.highContrast = !hcOn;
        await L.saveProfile();
        L.applyAppSettings(settings);
        K.renderSettingsScreen();
        L.toast(settings.highContrast ? '고대비 모드가 켜졌어요' : '고대비 모드가 꺼졌어요');
        U.triggerHaptic(10);
      };
    }
    var curFs = settings.fontSize || 'normal';
    var fsWrap = document.getElementById('fontSizeToggle');
    if(fsWrap){
      fsWrap.querySelectorAll('.format-opt').forEach(function(o){
        o.classList.toggle('active', o.dataset.fs === curFs);
        o.onclick = async function(){
          settings.fontSize = o.dataset.fs;
          await L.saveProfile();
          L.applyAppSettings(settings);
          K.renderSettingsScreen();
        };
      });
    }
    var dsSw = document.getElementById('dataSaverSwitch');
    if(dsSw){
      var dsOn = !!settings.dataSaver;
      dsSw.className = 'switch' + (dsOn ? ' on' : '');
      U.a11ySwitch(dsSw, dsOn, '데이터 절약 모드');
      dsSw.onclick = async function(){
        settings.dataSaver = !dsOn;
        await L.saveProfile();
        K.renderSettingsScreen();
        L.toast(settings.dataSaver ? '데이터 절약 모드가 켜졌어요 (저용량 이미지)' : '데이터 절약 모드가 꺼졌어요');
      };
    }
  }

  var OurgoalSettingsSubAppearance = {
    id: 'appearance',
    megaBlockId: 'settings',
    name: '화면 스타일',
    containerId: 'themeGrid',

    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */
    render: renderAppearanceSection,

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
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/appearance');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubAppearance;
  }
  global.OurgoalSettingsSubAppearance = OurgoalSettingsSubAppearance;
})(typeof window !== 'undefined' ? window : globalThis);
