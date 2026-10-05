/**
 * OurGoal Telemetry (기관 — 익명 이벤트 계측)
 *
 * 온보딩 퍼널·유입 채널·알림 클릭률 익명 이벤트 계측 도우미(계측 묶음).
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 2970~2987 · 2988~2994 · 2995~3006 · 3007~3025 · 3026~3036 · 3037~3043 · 3044~3047 · 3048~3055 · 3056~3066줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 2970~2987줄(#TASK-ES-471 생성기 표지) ---- */
  /* ============ 계측(익명 이벤트) — 성장 백로그 P0 ①온보딩 퍼널 ②유입 채널 ③알림 클릭률 ============
     원칙: user_id는 저장하지 않고 기기별 익명 sid만 사용(개인정보 최소화). 계측 실패는 UX에 절대 영향을 주지 않는다. */
  function parseAttribution(search){
    var keys = ['utm_source','utm_medium','utm_campaign','ref'];
    var out = {};
    var q = String(search||'').replace(/^\?/, '');
    if(!q) return out;
    q.split('&').forEach(function(pair){
      var i = pair.indexOf('=');
      var rawK = i===-1 ? pair : pair.slice(0,i);
      var rawV = i===-1 ? '' : pair.slice(i+1);
      var k, v;
      try{ k = decodeURIComponent(rawK).trim(); v = decodeURIComponent(rawV.replace(/\+/g,' ')).trim(); } catch(e){ return; }
      if(keys.indexOf(k)===-1 || !v) return;
      out[k] = v.slice(0,80);
    });
    return out;
  }
  /* ---- 이전 전 index.html 2988~2994줄(#TASK-ES-471 생성기 표지) ---- */
  function getSid(){
    try{
      var sid = localStorage.getItem('ourgoal_sid');
      if(!sid){ sid = L.newId(); localStorage.setItem('ourgoal_sid', sid); }
      return sid;
    } catch(e){ return null; }
  }
  /* ---- 이전 전 index.html 2995~3006줄(#TASK-ES-471 생성기 표지) ---- */
  function getAttribution(search){
    try{
      var saved = localStorage.getItem('ourgoal_attrib');
      if(saved) return JSON.parse(saved);
      var fresh = parseAttribution(search === undefined ? location.search : search);
      if(Object.keys(fresh).length){
        fresh.landed_at = L.nowISO();
        localStorage.setItem('ourgoal_attrib', JSON.stringify(fresh)); /* 첫 유입(first-touch)만 보존 */
      }
      return fresh;
    } catch(e){ return {}; }
  }
  /* ---- 이전 전 index.html 3007~3025줄(#TASK-ES-471 생성기 표지) ---- */
  /* 랜딩 진입 처리 — 부트 IIFE 안에 있으면 테스트할 수 없어 이름 있는 함수로 뺀다 (AUD-8).
     유입 저장과 landing_view 기록은 주기가 다르다:
       - 유입(attribution)은 매 로드마다 확인한다. 첫 유입만 보존하되, 확인 자체를 거르면 안 된다.
       - landing_view 는 하루 1회만 남긴다. 같은 사람이 하루에 열 번 들어와도 조회수가 부풀지 않게.
     이 둘을 하나의 게이트에 묶으면, 오늘 이미 방문한 사람이 ?utm_source 를 달고 다시 들어와도
     유입이 통째로 유실된다. 그래서 순서를 고정한다: 유입 먼저, 그 다음 하루 1회 게이트. */
  function recordLanding(search, todayKey){
    var attrib = {};
    try{ attrib = getAttribution(search); } catch(e){ /* 계측 실패는 UX에 영향 없다 */ }
    var viewed = false;
    try{
      if(localStorage.getItem('ourgoal_lv_day') !== todayKey){
        localStorage.setItem('ourgoal_lv_day', todayKey);
        viewed = true;
      }
    } catch(e){ /* 스토리지 접근 실패는 무시 */ }
    if(viewed){ try{ track('landing_view', attrib); } catch(e){ } }
    return { attrib: attrib, viewed: viewed };
  }
  /* ---- 이전 전 index.html 3026~3036줄(#TASK-ES-471 생성기 표지) ---- */
  function track(name, props){
    try{
      if(typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function'){
        window.posthog.capture(name, props || {});
      }
    } catch(e){ /* 계측 실패는 조용히 무시 */ }
    try{
      if(!L.sb || !name) return;
      L.sb.from('events').insert({ sid: getSid(), name: name, props: props || {} }).then(function(){}, function(){});
    } catch(e){ /* 계측 실패는 조용히 무시 */ }
  }
  /* ---- 이전 전 index.html 3037~3043줄(#TASK-ES-471 생성기 표지) ---- */
  function dayIndexSinceSignup(){
    try{
      var c = L.state.profile && L.state.profile.createdAt;
      if(!c) return 0;
      return Math.max(0, Math.floor((Date.now() - new Date(c).getTime()) / 86400000));
    } catch(e){ return null; }
  }
  /* ---- 이전 전 index.html 3044~3047줄(#TASK-ES-471 생성기 표지) ---- */
  function trackGoalCreated(goal, source){
    var goals = (L.state.profile && L.state.profile.goals) || [];
    track('goal_created', { source: source, goal_type: goal && goal.category, category: goal && goal.category, first: goals.length<=1, day_index: dayIndexSinceSignup() });
  }
  /* ---- 이전 전 index.html 3048~3055줄(#TASK-ES-471 생성기 표지) ---- */
  function fmtDuration(ms){
    if(ms<0) ms=0;
    var mins = Math.round(ms/60000);
    var h = Math.floor(mins/60), m = mins%60;
    if(h<=0) return m+'분';
    if(m<=0) return h+'시간';
    return h+'시간 '+m+'분';
  }
  /* ---- 이전 전 index.html 3056~3066줄(#TASK-ES-471 생성기 표지) ---- */
  function dDay(dateStr){
    if(!dateStr) return null;
    var target = dateStr.indexOf('T')!==-1 ? new Date(dateStr) : new Date(dateStr+'T00:00:00');
    if(isNaN(target.getTime())) return null;
    var today = new Date(); today.setHours(0,0,0,0);
    var tDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    var diff = Math.round((tDay-today)/86400000);
    if(diff===0) return 'D-day';
    if(diff>0) return 'D-'+diff;
    return 'D+'+Math.abs(diff);
  }

  K.parseAttribution = parseAttribution;
  K.getSid = getSid;
  K.getAttribution = getAttribution;
  K.recordLanding = recordLanding;
  K.track = track;
  K.dayIndexSinceSignup = dayIndexSinceSignup;
  K.trackGoalCreated = trackGoalCreated;
  K.fmtDuration = fmtDuration;
  K.dDay = dDay;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
