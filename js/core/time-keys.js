/**
 * OurGoal Time Keys (기관 — 시간·날짜 키·id 도우미)
 *
 * 여러 탭이 같이 쓰는 시간 글자·날짜 키·고유 id 도우미(Utilities 묶음)와 표준 시간대 기준 날짜 키(#TASK-ES-264 묶음).
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 2950~2951 · 2952~2952 · 2953~2955 · 2956~2956 · 2957~2957 · 2958~2967 · 2968~2973 · 2975~2993 · 2994~2994줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2950~2951줄(#TASK-ES-471 생성기 표지) ---- */
  /* ============ Utilities ============ */
  function uid(p){ return (p||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  /* ---- 이전 전 index.html 2952~2952줄(#TASK-ES-471 생성기 표지) ---- */
  function newId(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid('id'); }
  /* ---- 이전 전 index.html 2953~2955줄(#TASK-ES-471 생성기 표지) ---- */
  /* [#TASK-ES-354 CORE-07] escapeHtml → js/core/ui-helpers.js 로 옮김(맨 위에서 같은 이름으로 가져온다) */
  /* [#TASK-ES-354 CORE-07] a11ySwitch → js/core/ui-helpers.js 로 옮김(맨 위에서 같은 이름으로 가져온다) */
  function pad(n){ return n<10?'0'+n:''+n; }
  /* ---- 이전 전 index.html 2956~2956줄(#TASK-ES-471 생성기 표지) ---- */
  function nowISO(){ return new Date().toISOString(); }
  /* ---- 이전 전 index.html 2957~2957줄(#TASK-ES-471 생성기 표지) ---- */
  function fmtTime(iso){ if(!iso) return ''; var d=new Date(iso); return pad(d.getHours())+':'+pad(d.getMinutes()); }
  /* ---- 이전 전 index.html 2958~2967줄(#TASK-ES-471 생성기 표지) ---- */
  function fmtDateLabel(iso){
    var d = new Date(iso); if(!iso || isNaN(d.getTime())) d = new Date();
    var today = new Date();
    var yest = new Date(); yest.setDate(today.getDate()-1);
    var sameDay = function(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); };
    if(sameDay(d,today)) return '오늘';
    if(sameDay(d,yest)) return '어제';
    if(d.getFullYear() !== today.getFullYear()) return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일';
    return (d.getMonth()+1)+'월 '+d.getDate()+'일';
  }
  /* ---- 이전 전 index.html 2968~2973줄(#TASK-ES-471 생성기 표지) ---- */
  function getKSTDateKey(iso){
    var d = iso ? new Date(iso) : new Date();
    if(isNaN(d.getTime())) d = new Date();
    var kst = new Date(d.getTime() + (9 * 3600000));
    return kst.getUTCFullYear() + '-' + pad(kst.getUTCMonth() + 1) + '-' + pad(kst.getUTCDate());
  }

  /* ---- 이전 전 index.html 2975~2993줄(#TASK-ES-471 생성기 표지) ---- */
  function getEffectiveStandardDateKey(iso, tz){
    var d = iso ? new Date(iso) : new Date();
    if(isNaN(d.getTime())) d = new Date();
    var targetTz = tz;
    if(!targetTz && typeof L.state !== 'undefined' && L.state && L.state.profile && L.state.profile.settings && L.state.profile.settings.timezone){
      targetTz = L.state.profile.settings.timezone;
    }
    if(!targetTz && typeof Intl !== 'undefined' && Intl.DateTimeFormat){
      try { targetTz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e){}
    }
    if(targetTz){
      try {
        var fmt = new Intl.DateTimeFormat('en-CA', { timeZone: targetTz, year: 'numeric', month: '2-digit', day: '2-digit' });
        var parts = fmt.format(d);
        if(parts && parts.length === 10) return parts;
      } catch(e){}
    }
    return getKSTDateKey(d.toISOString());
  }
  /* ---- 이전 전 index.html 2994~2994줄(#TASK-ES-471 생성기 표지) ---- */
  function dateKey(iso){ var d=new Date(iso); if(!iso || isNaN(d.getTime())) d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }

  K.uid = uid;
  K.newId = newId;
  K.pad = pad;
  K.nowISO = nowISO;
  K.fmtTime = fmtTime;
  K.fmtDateLabel = fmtDateLabel;
  K.getKSTDateKey = getKSTDateKey;
  K.getEffectiveStandardDateKey = getEffectiveStandardDateKey;
  K.dateKey = dateKey;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
