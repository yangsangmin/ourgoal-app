/**
 * Level Badge UI
 *
 * 아바타 및 경험치 레벨 배지 렌더링, 커스텀 아바타 여부 확인
 * #TASK-ES-592(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 3542~3551 · 3552~3601 · 3602~3638줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalLevelBadgeKit = global.OurgoalLevelBadgeKit || {};

  /* ---- 이전 전 index.html 3542~3551줄(#TASK-ES-592 생성기 표지) ---- */
  function hasUserCustomizedAvatar(profile){
    if(!profile) return false;
    var s = profile.settings || {};
    return Boolean(
      s.avatarChangedOnce ||
      (s.savedAvatars && s.savedAvatars.length > 0) ||
      (s.avatarType === 'custom' && s.customAvatarUrl) ||
      (profile.avatarUrl && (profile.avatarUrl.indexOf('data:image') === 0 || profile.avatarUrl.indexOf('http') === 0))
    );
  }
  /* ---- 이전 전 index.html 3552~3601줄(#TASK-ES-592 생성기 표지) ---- */
  function levelBadgeHtml(xp){
    var p = L.levelProgress(xp);
    var hasCheckedInToday = false;
    var todayCheckinCount = 0;
    if(L.state.profile && L.state.profile.records){
      var today = L.dateKey(L.nowISO());
      todayCheckinCount = L.state.profile.records.filter(function(r){ return L.dateKey(r.startAt) === today; }).length;
      hasCheckedInToday = todayCheckinCount > 0;
    }
    var currentSitKey = 'checkin_1';
    if(todayCheckinCount >= 3) currentSitKey = 'checkin_3';
    else if(todayCheckinCount === 2) currentSitKey = 'checkin_2';
    else if(todayCheckinCount === 1) currentSitKey = 'checkin_1';
    else currentSitKey = (L.state.profile && L.state.profile.settings && L.state.profile.settings.equippedSituationKey) || 'checkin_1';
    var sitData = (window.OurgoalAvatar && window.OurgoalAvatar.DYNAMIC_SITUATIONS) ? window.OurgoalAvatar.DYNAMIC_SITUATIONS[currentSitKey] : null;

    var rankInfo = (window.OurgoalAvatar && window.OurgoalAvatar.getRankThemeInfo) ?
      window.OurgoalAvatar.getRankThemeInfo(p.level) :
      { stepTitle: 'Lv.' + p.level, stepFullName: 'Lv.' + p.level, mainColor: 'var(--brand)', badgeGradient: 'var(--brand)', stepInfo: { name: '' } };

    var avatarHtml = (window.OurgoalAvatar && window.OurgoalAvatar.renderAvatarHtml) ?
      window.OurgoalAvatar.renderAvatarHtml(p.level, L.state.profile, { size: 76, showGreeting: !hasCheckedInToday && !L.state.hasSeenAvatarGreeting, situationKey: currentSitKey }) :
      '<div class="avatar-placeholder" style="width:76px;height:76px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🤖</div>';
    /* [TASK-ES-283 compat: renderAvatarHtml(p.level, state.profile, { size: 72, width:72px;height:72px;] */
    /* [TASK-ES-174 compat: size: 54 width:54px;height:54px;] */

    var hasCustomAvatar = hasUserCustomizedAvatar(L.state.profile);
    var btnAvatarStyle = hasCustomAvatar ? 'display:none;' : '';

    return '<div class="level-badge" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;width:100%;box-sizing:border-box;">' +
      '<div class="level-badge-avatar-wrap" style="display:flex;align-items:center;gap:10px;cursor:pointer;" title="내 아바타 관리 (클릭하여 변경)">' +
        avatarHtml +
        '<div class="level-rank-info-col" style="display:flex;flex-direction:column;gap:1px;min-width:0;">' +
          '<div class="level-rank-title" style="font-weight:800;font-size:.825rem;color:var(--ink);display:flex;align-items:center;gap:4px;white-space:nowrap;">' +
            '<span>' + rankInfo.stepTitle + '</span>' +
            (rankInfo.stepInfo && rankInfo.stepInfo.name ? '<span class="level-rank-subname" style="font-size:.7rem;font-weight:600;color:' + rankInfo.mainColor + ';">' + rankInfo.stepInfo.name + '</span>' : '') +
          '</div>' +
          (sitData ? '<div class="dynamic-avatar-bubble-chip" style="font-size:.6875rem;font-weight:700;color:var(--ink-soft);display:flex;align-items:center;gap:4px;margin-top:1px;" title="' + sitData.title + '"><span style="font-size:10px;">' + sitData.icon + '</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;">' + sitData.greeting + '</span></div>' : '') +
          '<button type="button" class="btn btn-ghost btn-xs" id="btnOpenAvatarModal" style="font-size:.6875rem;padding:1px 6px;border-color:var(--rule);color:var(--ink-soft);white-space:nowrap;width:fit-content;' + btnAvatarStyle + '">내 아바타 바꾸기</button>' +
        '</div>' +
      '</div>' +
      '<div class="level-bar-wrap" style="flex:1;min-width:70px;margin:0 4px;display:flex;flex-direction:column;gap:3px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.7rem;color:var(--ink-soft);">' +
          '<span style="font-weight:700;color:' + rankInfo.mainColor + ';">Lv.' + p.level + '</span>' +
          '<span class="level-xp-txt">' + p.into + ' / ' + p.span + ' XP</span>' +
        '</div>' +
        '<div class="mini-bar"><span style="width:'+Math.max(0,Math.min(100,p.pct))+'%;background:' + rankInfo.badgeGradient + ';"></span></div>' +
      '</div>' +
    '</div>';
  }
  /* ---- 이전 전 index.html 3602~3638줄(#TASK-ES-592 생성기 표지) ---- */
  function renderLevelBadge(){
    var el = document.getElementById('levelBadgeRow');
    if(!el || !L.state.profile) return;
    var xpTotal = (L.state.profile.settings && L.state.profile.settings.xp && L.state.profile.settings.xp.total) || 0;
    el.innerHTML = '<div class="level-badge-row">'+levelBadgeHtml(xpTotal)+'</div>';

    var openAvatarTrigger = function(){
      if(window.OurgoalAvatar && window.OurgoalAvatar.openAvatarModal){
        var p = L.levelProgress(xpTotal);
        window.OurgoalAvatar.openAvatarModal({
          profile: L.state.profile,
          state: L.state,
          saveProfile: L.saveProfile,
          toast: L.toast,
          openModal: L.openModal,
          closeModal: L.closeModal,
          currentLevel: p.level, mockGroups: (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []),
          onAvatarChanged: function(){
            renderLevelBadge();
            if(typeof L.updateTopBar === 'function') L.updateTopBar(); if(typeof L.renderHome === 'function') L.renderHome();
          }
        });
      }
    };

    var btnChangeAvatar = el.querySelector('#btnOpenAvatarModal');
    if(btnChangeAvatar){
      btnChangeAvatar.onclick = openAvatarTrigger;
    }

    var avatarWrap = el.querySelector('.level-badge-avatar-wrap');
    if(avatarWrap){
      avatarWrap.onclick = function(e){
        openAvatarTrigger();
      };
    }
  }

  K.hasUserCustomizedAvatar = hasUserCustomizedAvatar;
  K.levelBadgeHtml = levelBadgeHtml;
  K.renderLevelBadge = renderLevelBadge;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
