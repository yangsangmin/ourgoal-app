/**
 * OurGoal Community Screen Renderer (소통 탭 메인 렌더 — 화면 조립)
 *
 * #TASK-ES-379 (소통 탭 세포 이전 1차): index.html 인라인 IIFE 의 아래 함수를 동작 그대로 옮겼다.
 *   renderCommScreen(이전 전 32526~32573줄)
 *   renderCommDM(이전 전 35424~35428줄)
 *   renderCommCompanions(이전 전 35430~35434줄)
 * renderCommScreen = 소통 요약 카드 숫자(#commHeroGroupCount·#commHeroCompanionCount·#commHeroCheerCount) + 서브탭 칩(#commBody [data-sub]) + 서브탭별 화면 분기.
 * DM·동반자는 이 파일의 위임(js/team-invite-comm.js), 피드·공유·팀·마니또는 아직 index.html 에 있는 함수(L.<이름>)를 부른다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 소통 파일로 간 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalCommKit)의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 선례: 목표 탭 #TASK-ES-370 · #TASK-ES-375. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 소통 키트: 소통 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  function renderCommScreen(){
    // 토스 동류 소통 요약 원카드 (#TASK-ES-216) 통계 바인딩
    var heroGrpEl = document.getElementById('commHeroGroupCount');
    if(heroGrpEl) heroGrpEl.textContent = ((L.state.profile && L.state.profile.groups) ? L.state.profile.groups.length : 0) + '개';
    var heroCompEl = document.getElementById('commHeroCompanionCount');
    if(heroCompEl) heroCompEl.textContent = ((L.state.profile && L.state.profile.companions) ? L.state.profile.companions.length : 0) + '명';
    var heroCheerEl = document.getElementById('commHeroCheerCount');
    if(heroCheerEl) heroCheerEl.textContent = ((L.state.profile && L.state.profile.cheersReceived) ? L.state.profile.cheersReceived : 0) + '개';

    var body = document.getElementById('commBody');
    var subtabsList = [
      { key: 'feed', label: '피드', icon: '📰' },
      { key: 'group', label: '팀', icon: '👥' },
      { key: 'companion', label: '동반자', icon: '🤝' }, /* companion:동반자 */
      { key: 'dm', label: 'DM', icon: '💬' },
      { key: 'manito', label: '마니또', icon: '🎁' },
      { key: 'share', label: '공유', icon: '📤' }
    ];
    var hasBadge = window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.getDmUnreadStatus && window.OurgoalTeamInviteComm.getDmUnreadStatus();
    var subtabHtml = '<div class="comm-subtabs comm-subtabs-clean comm-subtabs-grid">' +
      subtabsList.map(function(s){
        var bHtml = (s.key === 'dm') ? '<span id="dmSubtabBadge" style="display:'+(hasBadge?'inline-block':'none')+';width:6px;height:6px;border-radius:50%;background:#ef4444;margin-left:4px;vertical-align:middle;"></span>' : '';
        return '<div class="comm-subtab'+(L.state.commSubTab===s.key?' active':'')+'" data-sub="'+s.key+'">'+s.icon+' '+s.label+bHtml+'</div>';
      }).join('') + '</div>';
    body.innerHTML = subtabHtml +
      '<div id="commTopCompanionBar" style="display:' + (L.state.commSubTab === 'companion' ? 'block' : 'none') + '"></div>' +
      '<div id="commSubBody"></div>';
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.renderCommTopInviteSearch){
      window.OurgoalTeamInviteComm.renderCommTopInviteSearch(document.getElementById('commTopCompanionBar'));
    }
    body.querySelectorAll('[data-sub]').forEach(function(t){
      t.addEventListener('click', function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        if(t.dataset.sub==='dm' && window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.updateDmUnreadBadge) window.OurgoalTeamInviteComm.updateDmUnreadBadge(false);
        L.state.commSubTab = t.dataset.sub;
        L.state.activeGroupId = null;
        L.state.manitoDm = null;
        L.state.dmActiveId = null; renderCommScreen();
      });
    });
    var subBody = document.getElementById('commSubBody');
    if(L.state.commSubTab==='share') L.renderCommShare(subBody);
    else if(L.state.commSubTab==='feed') L.renderCommFeed(subBody);
    else if(L.state.commSubTab==='group') L.renderCommGroups(subBody);
    else if(L.state.commSubTab==='manito') L.renderCommManito(subBody);
    else if(L.state.commSubTab==='dm') renderCommDM(subBody);
    else if(L.state.commSubTab==='companion') renderCommCompanions(subBody);
  }

  function renderCommDM(body){
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.renderCommDM){
      return window.OurgoalTeamInviteComm.renderCommDM(body);
    }
  }

  function renderCommCompanions(body){
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.renderCommCompanions){
      return window.OurgoalTeamInviteComm.renderCommCompanions(body);
    }
  }

  K.renderCommScreen = renderCommScreen;
  K.renderCommDM = renderCommDM;
  K.renderCommCompanions = renderCommCompanions;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
