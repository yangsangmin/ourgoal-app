/**
 * OurGoal Adaptive UX (설정 — 적응형 화면 모드·망설임 기록)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   getUxMode · switchUxMode(이전 전 12760~12775줄 · 구획 「Adaptive UX Mode」)
 *   renderAdaptiveModeBar(이전 전 12778~12788줄 · 구획 「Adaptive UX Mode」)
 *   _recordHesitation(이전 전 13031~13036줄 · 구획 「UX Telemetry (Hesitation & Rage Tap)」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  function getUxMode(){
    try{ return localStorage.getItem('ourgoal_ux_mode') || 'minimal'; }catch(e){ return 'minimal'; }
  }
  function switchUxMode(mode){
    try{
      localStorage.setItem('ourgoal_ux_mode', mode);
      document.body.setAttribute('data-ux-mode', mode);
      var chips = document.querySelectorAll('#adaptiveModeSelector .mode-chip');
      chips.forEach(function(c){
        if(c.dataset.mode === mode) c.classList.add('active');
        else c.classList.remove('active');
      });
      L.triggerHaptic(25);
      if(window.announceToA11y) L.announceToA11y('UI 모드가 ' + (mode === 'minimal' ? '포커스 미니멀' : (mode === 'gamified' ? 'MZ 게이미피케이션' : '파워 분석가')) + '로 전환되었습니다.');
    }catch(e){}
  }

  function renderAdaptiveModeBar(){
    var bar = document.getElementById('adaptiveModeSelector');
    if(!bar) return;
    var mode = getUxMode();
    document.body.setAttribute('data-ux-mode', mode);
    var chips = bar.querySelectorAll('.mode-chip');
    chips.forEach(function(c){
      if(c.dataset.mode === mode) c.classList.add('active');
      else c.classList.remove('active');
    });
  }

  function _recordHesitation(targetName){
    var openTime = window._modalOpenAt || Date.now();
    var lat = Date.now() - openTime;
    L._uxTelemetry.hesitation.push({ target: targetName, latencyMs: lat, at: Date.now() });
    if(L._uxTelemetry.hesitation.length > 50) L._uxTelemetry.hesitation.shift();
  }

  K.getUxMode = getUxMode;
  K.switchUxMode = switchUxMode;
  K.renderAdaptiveModeBar = renderAdaptiveModeBar;
  K._recordHesitation = _recordHesitation;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
