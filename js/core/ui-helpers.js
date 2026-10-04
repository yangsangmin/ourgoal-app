/**
 * OurGoal UI Helpers (여러 탭이 같이 쓰는 순수 화면 헬퍼)
 *
 * #TASK-ES-354 (노션 CORE-07): index.html 인라인 IIFE 의 공용 헬퍼 중 설정 탭이 쓰고, 인라인 스코프 변수를 읽지 않는 것만 글자 그대로 옮겼다.
 * index.html 은 IIFE 맨 위에서 같은 이름으로 가져와 쓰고(호출하는 곳은 그대로), 옮긴 탭 파일은 U.<이름> 으로 읽는다.
 * window 노출은 이전과 같은 자리(index.html)에서만 한다(window.triggerHapticFeedback 등). 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
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

  function nowISO(){ return new Date().toISOString(); }

  function download(filename, content, mime){
    var blob = new Blob([content], {type: mime});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }

  function triggerHaptic(pattern){
    var HAPTIC_PATTERNS = {
      tap: 12,
      light: 8,
      checkin: [12, 35, 18],
      streak: [20, 45, 30],
      success: [15, 30, 25],
      drag: 10,
      warning: [25, 40, 25]
    };
    try{
      if(typeof navigator !== 'undefined' && navigator && navigator.vibrate){
        var p = pattern;
        if(typeof pattern === 'string' && HAPTIC_PATTERNS[pattern]){
          p = HAPTIC_PATTERNS[pattern];
        } else if(p === undefined || p === null){
          p = 12;
        }
        navigator.vibrate(p);
        return true;
      }
    }catch(e){}
    return false;
  }

  function triggerHapticFeedback(pattern){
    return triggerHaptic(pattern || 12);
  }

  var OurgoalUiHelpers = {
    escapeHtml: escapeHtml,
    a11ySwitch: a11ySwitch,
    nowISO: nowISO,
    download: download,
    triggerHaptic: triggerHaptic,
    triggerHapticFeedback: triggerHapticFeedback
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalUiHelpers;
  }
  global.OurgoalUiHelpers = OurgoalUiHelpers;
})(typeof window !== 'undefined' ? window : globalThis);
