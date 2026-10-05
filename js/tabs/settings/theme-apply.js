/**
 * OurGoal Theme Apply (설정 탭 — 화면 테마·글자 크기 적용)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   applyTheme — 「8대 화면 스타일 (테마) 정의」(이전 전 2899~2919줄)
 *   applyAppSettings — 「8대 화면 스타일 (테마) 정의」(이전 전 2925~2941줄)
 * applyTheme = 테마 id 정리 → data-theme·theme-color·저장, 바뀔 때만 햅틱·성소 다시 그리기 / applyAppSettings = 설정 저장값(테마·고대비·글자 크기)을 문서에 적용.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  function applyTheme(themeId){
    if(!themeId) themeId = 'focus-sanctuary';
    if(themeId === 'dark') themeId = 'black';
    if(themeId === 'light' || themeId === 'system') themeId = 'white';
    if(['focus-sanctuary', 'black', 'white', 'urban-city'].indexOf(themeId) === -1) themeId = 'focus-sanctuary';
    /* [#TASK-ES-353] 설정 저장(saveLocalSettings→applyAppSettings)마다 같은 테마로 불려 햅틱·활성 탭 재렌더가 반복되던 것 차단 — 실제로 바뀔 때만 */
    var themeChanged = document.documentElement.getAttribute('data-theme') !== themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    if(themeChanged){ try{ if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12); } catch(e){} }
    var found = L.THEMES.find(function(t){ return t.id === themeId; });
    if(found && found.metaColor){
      var meta = document.querySelector('meta[name="theme-color"]');
      if(meta) meta.setAttribute('content', found.metaColor);
    }
    try{ localStorage.setItem('ourgoal_current_theme', themeId); } catch(e){}
    try{
      if(themeChanged && typeof window !== 'undefined' && window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render && window.state && window.state.activeTab){
        window.OurgoalSanctuaryV3.render(window.state.activeTab);
      }
    }catch(e){}
  }

  function applyAppSettings(settings){
    if(!settings) return;
    try{
      var th = settings.theme || localStorage.getItem('ourgoal_current_theme') || 'focus-sanctuary';
      applyTheme(th);
      if(settings.highContrast){
        document.documentElement.setAttribute('data-high-contrast', 'true');
      } else {
        document.documentElement.removeAttribute('data-high-contrast');
      }
      if(document.body){
        document.body.classList.toggle('font-small', settings.fontSize === 'small');
        document.body.classList.toggle('font-large', settings.fontSize === 'large');
        document.body.classList.toggle('font-xlarge', settings.fontSize === 'xlarge');
      }
    } catch(e){}
  }

  K.applyTheme = applyTheme;
  K.applyAppSettings = applyAppSettings;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
