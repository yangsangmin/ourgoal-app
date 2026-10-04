/**
 * OurGoal UI Helpers (여러 탭이 같이 쓰는 순수 화면 헬퍼)
 *
 * #TASK-ES-354 (노션 CORE-07): index.html 인라인 IIFE 의 공용 헬퍼 중 설정 탭이 쓰고, 인라인 스코프 변수를 읽지 않는 것만 글자 그대로 옮겼다.
 * index.html 은 IIFE 맨 위에서 같은 이름으로 가져와 쓰고(호출하는 곳은 그대로), 옮긴 탭 파일은 U.<이름> 으로 읽는다.
 * window 노출이 필요하면 이전과 같은 자리(index.html)에서만 한다. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';

  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }

  /* 접근성: div 기반 토글 스위치에 role/aria/키보드 조작 지원 부여 (클릭 동작은 그대로 유지) */
  function a11ySwitch(el, checked, label){
    el.setAttribute('role','switch');
    el.setAttribute('aria-checked', checked ? 'true' : 'false');
    el.setAttribute('tabindex','0');
    if(label) el.setAttribute('aria-label', label);
    el.onkeydown = function(e){
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); el.click(); }
    };
  }

  function download(filename, content, mime){
    var blob = new Blob([content], {type: mime});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }

  var OurgoalUiHelpers = {
    escapeHtml: escapeHtml,
    a11ySwitch: a11ySwitch,
    download: download
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalUiHelpers;
  }
  global.OurgoalUiHelpers = OurgoalUiHelpers;
})(typeof window !== 'undefined' ? window : globalThis);
