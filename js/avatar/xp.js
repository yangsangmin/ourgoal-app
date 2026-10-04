/**
 * OurGoal Avatar Cell: EXP·레벨 (#TASK-ES-395 · 아바타·EXP 쪼개기 PR-5, 설계 docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md 3-2절)
 *
 * index.html 인라인 IIFE 의 「XP/레벨 시스템」 구간(이전 전 3126~3193줄)의 선언을 동작 그대로 옮겼다(생성기 docs/design/harness/module-split/gen-avatar-xp.js).
 *   XP_RULES · XP_LOG_MAX · xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · awardXP · notifyXpGained
 * 바꾼 것: 인라인 스코프 이름은 L.<이름>(state · nowISO), 저장은 어댑터 xpStore 하나로 모음 — 저장 위치는 그대로 state.profile.settings.xp.
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalAvatarParts.xp — 새 전역 없음)의 이름을 같은 이름으로 가져온다 — 지급 호출처·app-scope getter 는 글자 그대로다.
 * window.xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · notifyXpGained 대입 줄은 이전 전과 같은 자리(index.html)에 있다.
 * 능력: xp.award(지급) · xp.read(읽기, 만들지 않음) 을 js/core/capabilities.js 에 준다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state · nowISO)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  var CELL = 'avatar/xp';

  var XP_RULES = { checkin: 10, milestoneDone: 50 };
  var XP_LOG_MAX = 200;
  function xpForLevel(level){
    // 레벨 1은 0 XP, 이후 레벨마다 필요 누적치가 50*(level-1)*level 만큼 늘어나는 성장 곡선.
    return 50 * (level - 1) * level;
  }
  function levelForXP(xp){
    var level = 1;
    while(xpForLevel(level + 1) <= xp) level++;
    return level;
  }
  function levelProgress(xp){
    var level = levelForXP(xp);
    var floor = xpForLevel(level);
    var ceil = xpForLevel(level + 1);
    return { level: level, xp: xp, into: xp - floor, span: ceil - floor, pct: Math.round(((xp - floor) / (ceil - floor)) * 100) };
  }
  function triggerAvatarCelebrationPopup(amount, reason){
    try {
      var oldPop = document.getElementById('avatarCelebrationToast');
      if(oldPop) oldPop.remove();
      var pop = document.createElement('div');
      pop.id = 'avatarCelebrationToast';
      pop.style.cssText = 'position:fixed;bottom:78px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(30,27,75,0.95),rgba(49,46,129,0.95));border:1.5px solid rgba(129,140,248,0.6);box-shadow:0 12px 30px rgba(0,0,0,0.35);backdrop-filter:blur(8px);border-radius:24px;padding:8px 16px;display:flex;align-items:center;gap:10px;z-index:99999;color:#fff;font-size:.875rem;font-weight:700;animation:animFadeInUp 0.3s cubic-bezier(0.16,1,0.3,1);cursor:pointer;user-select:none;pointer-events:auto;';
      var avImg = (L.state.profile && (L.state.profile.avatarUrl || (L.state.profile.settings && L.state.profile.settings.customAvatarUrl))) || '';
      var avIcon = avImg ? ('<img src="'+avImg+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1.5px solid #818cf8;">') : '<span style="font-size:1.4rem;">🧑‍🚀</span>';
      pop.innerHTML = avIcon + '<div><div style="font-size:.84rem;color:#e0e7ff;">"잘했다! 내 자신!"</div><div style="font-size:.72rem;color:#38bdf8;font-weight:800;">+' + amount + ' EXP 획득</div></div><span style="font-size:.75rem;color:#94a3b8;margin-left:4px;">✕</span>';
      pop.onclick = function(){ pop.remove(); };
      document.body.appendChild(pop);
      setTimeout(function(){
        if(pop.parentNode){
          pop.style.transition = 'opacity 0.4s, transform 0.4s';
          pop.style.opacity = '0';
          pop.style.transform = 'translateX(-50%) translateY(12px)';
          setTimeout(function(){ if(pop.parentNode) pop.remove(); }, 400);
        }
      }, 2500);
    } catch(e){}
  }

  // 저장 어댑터(1단계): EXP 를 어디에 두는지는 이 함수 하나만 안다 — 지금은 옮기기 전과 같은 state.profile.settings.xp.
  // create=true 면 없을 때 { total:0, log:[] } 를 만들어 둔다(옮기기 전 awardXP 머리 두 줄 글자 그대로), false 면 만들지 않고 없으면 null(프로필이 없어도 던지지 않음).
  // 서버 원장 이관(2단계, 결심 K-XP1 뒤)은 이 함수만 바꾼다 — 호출처는 다시 만지지 않는다.
  function xpStore(create){
    if(!create){
      var s = L.state && L.state.profile && L.state.profile.settings;
      return (s && s.xp) || null;
    }
    if(!L.state.profile.settings.xp) L.state.profile.settings.xp = { total:0, log:[] };
    return L.state.profile.settings.xp;
  }
  function awardXP(amount, reason){
    var xp = xpStore(true);
    var beforeLevel = levelForXP(xp.total);
    xp.total += amount;
    xp.log.unshift({ amount: amount, reason: reason, at: L.nowISO() });
    if(xp.log.length > XP_LOG_MAX) xp.log.length = XP_LOG_MAX;
    var leveledUp = levelForXP(xp.total) > beforeLevel;
    if(amount > 0){
      triggerAvatarCelebrationPopup(amount, reason);
    }
    notifyXpGained(amount, xp.total);
    return { total: xp.total, leveledUp: leveledUp };
  }
  // [HOME-19] 경험치가 바뀌면 홈 아바타 진행 링에 알린다(링 갱신 + +N EXP 0.5초 표시)
  function notifyXpGained(amount, total){
    try {
      if(window.OurgoalHomeOneScreen && typeof window.OurgoalHomeOneScreen.onXpGained === 'function'){
        window.OurgoalHomeOneScreen.onXpGained(amount, total);
      }
    } catch(e){}
  }

  // 읽기(만들지 않음): 지금 합계와 레벨 진행 — xp.read 능력
  function readXP(){
    var xp = xpStore(false);
    var total = xp ? xp.total : 0;
    return levelProgress(total);
  }

  // 키트: 아바타 부품 통로(OurgoalAvatarParts, #TASK-ES-389 의 전역) 안의 xp 칸 — 새 전역 이름을 만들지 않는다.
  var AVP = global.OurgoalAvatarParts = global.OurgoalAvatarParts || {};
  var K = AVP.xp = AVP.xp || {};
  K.XP_RULES = XP_RULES;
  K.XP_LOG_MAX = XP_LOG_MAX;
  K.xpForLevel = xpForLevel;
  K.levelForXP = levelForXP;
  K.levelProgress = levelProgress;
  K.triggerAvatarCelebrationPopup = triggerAvatarCelebrationPopup;
  K.awardXP = awardXP;
  K.notifyXpGained = notifyXpGained;
  K.xpStore = xpStore;
  K.readXP = readXP;
  K.CELL = CELL;

  var caps = global.OurgoalCapabilities;
  if (!caps && typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    caps = require('../core/capabilities.js');
  }
  if (caps && typeof caps.provide === 'function') {
    caps.provide('xp.award', awardXP, {
      cell: CELL,
      description: 'EXP 를 지급한다(합계 더하기 + 이력 맨 앞에 기록, 200건 상한) — 저장은 state.profile.settings.xp(기기). 0 보다 크면 축하 팝업, 홈 링에 알림',
      sideEffect: 'local',
      input: { amount: 'number', reason: 'string' },
      output: { total: 'number', leveledUp: 'boolean' }
    });
    caps.provide('xp.read', readXP, {
      cell: CELL,
      description: '지금 EXP 합계와 레벨 진행(level·xp·into·span·pct)을 읽는다. 저장 칸이 없으면 0 으로 계산하고 만들지 않는다',
      sideEffect: 'none',
      input: null,
      output: { level: 'number', xp: 'number', into: 'number', span: 'number', pct: 'number' }
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
