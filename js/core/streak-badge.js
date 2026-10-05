/**
 * OurGoal Streak & App Badge (기관 — 연속 기록·보호권·앱 아이콘 배지)
 *
 * 연속 기록 일수 계산·보호권(프리즈) 지급/사용·아바타 제작 보너스·연속 기록 배지 글자·앱 아이콘 배지 숫자(「폰 잠금화면에서 바로 보기 통합 허브 모달」 묶음 중 기관 몫).
 * #TASK-ES-486(인라인 어려움 기관 묶음 이전 2차): index.html 인라인 IIFE 의 구간(이전 전 8016~8023 · 8024~8044 · 8045~8054 · 8055~8055 · 8056~8065 · 8066~8080 · 8081~8092줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 8016~8023줄(#TASK-ES-486 생성기 표지) ---- */
  function streakBadgeHtml(streak){
    var tier, flames;
    if(streak>=30){ tier='streak-t4'; flames='🔥🔥🔥'; }
    else if(streak>=7){ tier='streak-t3'; flames='🔥🔥'; }
    else if(streak>=3){ tier='streak-t2'; flames='🔥'; }
    else { tier='streak-t1'; flames='🔥'; }
    return '<span class="streak-pill '+tier+'">'+flames+' '+streak+'일 연속</span>';
  }
  /* ---- 이전 전 index.html 8024~8044줄(#TASK-ES-486 생성기 표지) ---- */
  function computeStreakDays(){
    var recs = L.state.profile.records;
    var frozen = (L.state.profile.settings.streakFreeze && L.state.profile.settings.streakFreeze.usedDates) || [];
    if(!recs.length && !frozen.length) return 0;
    var days = {};
    recs.forEach(function(r){ days[L.dateKey(r.startAt)] = true; });
    frozen.forEach(function(k){ days[k] = true; });
    var streak = 0;
    var todayCursor = new Date(); todayCursor.setHours(0,0,0,0);
    var todayKeyStr = todayCursor.getFullYear()+'-'+L.pad(todayCursor.getMonth()+1)+'-'+L.pad(todayCursor.getDate());
    // 오늘 체크인을 이미 했으면 오늘부터, 아직 안 했으면 어제부터 역산하여 스트릭 유지 (#TASK-ES-043)
    var startCursor = new Date(todayCursor);
    if(!days[todayKeyStr]){
      startCursor.setDate(startCursor.getDate() - 1);
    }
    while(days[startCursor.getFullYear()+'-'+L.pad(startCursor.getMonth()+1)+'-'+L.pad(startCursor.getDate())]){
      streak++;
      startCursor.setDate(startCursor.getDate() - 1);
    }
    return streak;
  }
  /* ---- 이전 전 index.html 8045~8054줄(#TASK-ES-486 생성기 표지) ---- */
  /* PWA 앱 배지: 홈 화면 아이콘에 스트릭 일수 표시. 미지원 브라우저·비PWA에서는 no-op, 절대 throw하지 않는다 — 성장 백로그 P0 ⑥ */
  function updateAppBadge(streak){
    try{
      if(typeof navigator === 'undefined' || !navigator || typeof navigator.setAppBadge !== 'function') return false;
      var n = Number(streak) || 0;
      if(n > 0){ navigator.setAppBadge(n).catch(function(){}); }
      else if(typeof navigator.clearAppBadge === 'function'){ navigator.clearAppBadge().catch(function(){}); }
      return true;
    } catch(e){ return false; }
  }
  /* ---- 이전 전 index.html 8055~8055줄(#TASK-ES-486 생성기 표지) ---- */
  var STREAK_FREEZE_MAX = 3;
  /* ---- 이전 전 index.html 8056~8065줄(#TASK-ES-486 생성기 표지) ---- */
  function maybeGrantStreakFreeze(){
    var sf = L.state.profile.settings.streakFreeze;
    if(!sf) return false;
    var tier = Math.floor(computeStreakDays() / 7);
    if(tier <= (sf.grantedTier||0)) return false;
    sf.grantedTier = tier;
    if(sf.available >= STREAK_FREEZE_MAX) return false;
    sf.available = Math.min(STREAK_FREEZE_MAX, sf.available + 1);
    return true;
  }
  /* ---- 이전 전 index.html 8066~8080줄(#TASK-ES-486 생성기 표지) ---- */
  function maybeApplyStreakFreeze(){
    var sf = L.state.profile.settings.streakFreeze;
    if(!sf || sf.available <= 0) return false;
    var recs = L.state.profile.records;
    var hasRecordOn = function(k){ return recs.some(function(r){ return L.dateKey(r.startAt)===k; }); };
    var y = new Date(); y.setHours(0,0,0,0); y.setDate(y.getDate()-1);
    var yKey = y.getFullYear()+'-'+L.pad(y.getMonth()+1)+'-'+L.pad(y.getDate());
    if(hasRecordOn(yKey) || sf.usedDates.indexOf(yKey)!==-1) return false;
    var bb = new Date(y); bb.setDate(bb.getDate()-1);
    var bbKey = bb.getFullYear()+'-'+L.pad(bb.getMonth()+1)+'-'+L.pad(bb.getDate());
    if(!hasRecordOn(bbKey) && sf.usedDates.indexOf(bbKey)===-1) return false;
    sf.available--;
    sf.usedDates.push(yKey);
    return true;
  }
  /* ---- 이전 전 index.html 8081~8092줄(#TASK-ES-486 생성기 표지) ---- */
  function maybeGrantAvatarCraftBonus(){
    if(!L.state.profile || !L.state.profile.settings) return false;
    var streak = computeStreakDays();
    if(typeof OurgoalAvatar !== 'undefined' && typeof OurgoalAvatar.maybeGrantStreakBonus === 'function'){
      var res = OurgoalAvatar.maybeGrantStreakBonus(L.state.profile, streak);
      if(res && res.granted){
        L.toast('🎉 7일 연속 체크인 달성! 아바타 제작권 1회가 충전되었습니다! 🎨');
        return true;
      }
    }
    return false;
  }

  K.streakBadgeHtml = streakBadgeHtml;
  K.computeStreakDays = computeStreakDays;
  K.updateAppBadge = updateAppBadge;
  K.STREAK_FREEZE_MAX = STREAK_FREEZE_MAX;
  K.maybeGrantStreakFreeze = maybeGrantStreakFreeze;
  K.maybeApplyStreakFreeze = maybeApplyStreakFreeze;
  K.maybeGrantAvatarCraftBonus = maybeGrantAvatarCraftBonus;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
