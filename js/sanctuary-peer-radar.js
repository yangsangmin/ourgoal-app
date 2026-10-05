/**
 * OurGoal Sanctuary Cell: 소통 탭 동반자 레이더 — 실제 러닝메이트 목록(getRealRunningMates)·아바타·레이더 접기·레이더 그리기(renderSanctuaryComm)와 응원·DM·상호작용·새로고침·동반자 찾기 메서드 (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   함수 renderPeerAvatarHtml·getRealRunningMates·toggleRadarCollapse·renderSanctuaryComm(1176~1317)
 *   메서드 cheerPost·openPeerDm(1743~1755)
 *   메서드 openPeerInteraction(1873~1889)
 *   메서드 refreshRadar·gotoCompanions(1893~1922)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 peerRadar 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.peerRadar = KIT.peerRadar || {};
  var T = K.scope = K.scope || {};

  /* =========================================================================
   * 4. 소통 탭: 실시간 러닝메이트 레이더 & 4위 1체 실기능 직결 (헌법 제13조 & 제4조 준수)
   * ========================================================================= */
  function renderPeerAvatarHtml(avatar) {
    if (!avatar) return '👤';
    if (typeof avatar === 'string' && (avatar.indexOf('data:image') === 0 || avatar.indexOf('http') === 0 || avatar.indexOf('/') === 0)) {
      return '<img src="' + T.escapeHtml(avatar) + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    }
    return T.escapeHtml(String(avatar)[0] || '👤');
  }

  function getRealRunningMates() {
    var peers = [];
    var seenIds = {};
    var myId = (window.state && window.state.profile && window.state.profile.id) ? String(window.state.profile.id).trim().toLowerCase() : '';

    // 1. 실제 동반자 목록 (state.profile.companions or state.companions)
    var companions = (window.state && window.state.profile && window.state.profile.companions) || (window.state && window.state.companions) || [];
    if (Array.isArray(companions)) {
      companions.forEach(function(c) {
        if (!c || !c.id) return;
        var cId = String(c.id).trim().toLowerCase();
        if (cId === myId || seenIds[cId]) return;
        seenIds[cId] = true;
        peers.push({
          id: c.id,
          name: c.nickname || c.name || '동반자',
          avatar: c.avatar || '👤',
          avatarUrl: c.avatarUrl || null,
          streak: c.streak || 1,
          goal: (c.goals && c.goals[0] && (c.goals[0].title || c.goals[0])) || c.goal || c.theme || '목표 실천',
          status: '함께 실천 중',
          theme: c.theme || '동반자',
          isCompanion: true,
          isTeam: false,
          raw: c
        });
      });
    }

    // 2. 내가 속한 팀원 풀 (OurgoalTeamInviteComm.getTeamMembersPool())
    if (window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.getTeamMembersPool === 'function') {
      try {
        var teamMems = window.OurgoalTeamInviteComm.getTeamMembersPool() || [];
        if (Array.isArray(teamMems)) {
          teamMems.forEach(function(m) {
            if (!m || !m.id) return;
            var mId = String(m.id).trim().toLowerCase();
            if (mId === myId || seenIds[mId]) return;
            seenIds[mId] = true;
            peers.push({
              id: m.id,
              name: m.name || m.nickname || '팀원',
              avatar: m.avatar || '👥',
              avatarUrl: m.avatarUrl || null,
              streak: m.streak || 1,
              goal: m.goal || m.role || '팀 목표 완주',
              status: m.role || '팀원',
              theme: m.groupName || '팀',
              isCompanion: false,
              isTeam: true,
              raw: m
            });
          });
        }
      } catch (e) {
        console.warn('[레이더] 팀원 풀 로드 경고:', e);
      }
    }

    return peers;
  }

  function toggleRadarCollapse() {
    var slot = document.getElementById('sanctuaryCommView');
    if (!slot) return;
    if (typeof triggerHapticFeedback === 'function') triggerHapticFeedback(12);
    var nextState = slot.dataset.collapsed === 'true' ? 'false' : 'true';
    slot.dataset.collapsed = nextState;
    try { localStorage.setItem('ourgoal_radar_collapsed', nextState); } catch(e){}
    renderSanctuaryComm();
  }

  function renderSanctuaryComm() {
    var slot = document.getElementById('sanctuaryCommView');
    if (!slot) return;

    if (!slot.dataset.collapsed) {
      try {
        var saved = localStorage.getItem('ourgoal_radar_collapsed');
        slot.dataset.collapsed = (saved !== null) ? saved : 'true';
      } catch(e){
        slot.dataset.collapsed = 'true';
      }
    }

    var peers = getRealRunningMates();
    var countText = peers.length > 0 ? (peers.length + '명') : '0명';
    var isCollapsed = slot.dataset.collapsed === 'true';

    var radarHtml = '<div class="s-peer-radar-card ' + (isCollapsed ? 'collapsed' : 'slim-mode') + '" id="sPeerRadarCard" style="margin-bottom:8px;padding:8px 12px;border-radius:12px;">' +
      '<div class="s-radar-head" style="margin:0;display:flex;align-items:center;justify-content:space-between;">' +
        '<div class="s-radar-title" style="display:flex;align-items:center;gap:6px;font-size:0.8rem;">' +
          '<span class="s-live-dot" style="width:8px;height:8px;"></span>' +
          '<span>함께 달리는 러닝메이트</span>' +
          '<span style="font-size:0.75rem;font-weight:800;color:var(--s-brand, #10B981);">' + countText + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button class="btn btn-ghost btn-xs s-radar-refresh-btn" type="button" title="누르면: 실시간 접속 중인 러닝메이트 현황을 새로고침합니다" onclick="window.OurgoalSanctuaryV3.refreshRadar(this);" style="padding:2px 6px;font-size:0.7rem;">새로고침</button>' +
          '<button class="btn btn-ghost btn-xs s-radar-toggle-btn" id="peerRadarToggleBtn" type="button" title="누르면: 러닝메이트 목록을 펼치거나 접습니다" onclick="window.OurgoalSanctuaryV3.toggleRadarCollapse();" style="padding:2px 6px;font-size:0.7rem;">' + (isCollapsed ? '펼치기 ▾' : '접기 ▴') + '</button>' +
        '</div>' +
      '</div>';

    if (isCollapsed) {
      radarHtml += '</div>';
      slot.innerHTML = radarHtml;
      return;
    }

    if (peers.length > 0) {
      radarHtml += '<div class="s-radar-scroll" style="margin-top:8px;">' +
        peers.map(function(p) {
          return '<div class="s-radar-item" data-peerid="' + T.escapeHtml(p.id) + '" role="button" tabindex="0" onclick="window.OurgoalSanctuaryV3.openPeerInteraction(\'' + T.escapeHtml(p.id) + '\');">' +
            '<div class="s-r-avatar-ring">' +
              '<span class="s-r-avatar">' + renderPeerAvatarHtml(p.avatarUrl || p.avatar) + '</span>' +
              '<span class="s-r-badge" title="함께 실천 중"></span>' +
            '</div>' +
            '<span class="s-r-name">' + T.escapeHtml(p.name) + '</span>' +
            '<span class="s-r-goal">' + T.escapeHtml(p.goal) + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
    } else {
      radarHtml += '<div class="s-radar-empty-card" style="padding:8px 12px;margin-top:6px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
        '<span style="font-size:.76rem;color:var(--ink-soft);">함께 달릴 동반자를 찾아보세요 🤝</span>' +
        '<button class="btn btn-primary btn-xs" id="sRadarEmptyBtn" type="button" title="누르면: 나와 같은 목표를 향해 달리는 동반자를 찾아 1:1 매칭합니다" onclick="window.OurgoalSanctuaryV3.gotoCompanions();" style="padding:3px 8px;font-size:.72rem;">+ 동반자 찾기</button>' +
      '</div>';
    }

    radarHtml += '</div>';
    slot.innerHTML = radarHtml;
  }

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 cheerPost·openPeerDm — 이전 전 1743~1755줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_cheerPost = {
    cheerPost: function(btn, emoji) {
      btn.classList.toggle('active');
      toast(emoji + ' 응원을 보냈습니다! (+2P)');
      if (window.triggerHaptic) window.triggerHaptic(10);
    },
    openPeerDm: function(peerName, peerGoal) {
      if (window.state) {
        window.state.commSubTab = 'dm';
      }
      if (typeof renderCommScreen === 'function') renderCommScreen();
      toast('[' + peerName + '] 님과의 1:1 DM 대화창으로 연결되었습니다 💬');
      if (window.triggerHaptic) window.triggerHaptic(15);
    },
  };

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 openPeerInteraction — 이전 전 1873~1889줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_openPeerInteraction = {
    openPeerInteraction: function(peerId) {
      var peers = getRealRunningMates();
      var p = peers.find(function(x) { return String(x.id).trim().toLowerCase() === String(peerId).trim().toLowerCase(); });
      if (!p) {
        p = peers.find(function(x) { return String(x.name).trim() === String(peerId).trim(); });
      }
      if (p && window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.openUserProfileModal === 'function') {
        window.OurgoalTeamInviteComm.openUserProfileModal(p.raw || p);
        return;
      }
      if (window.state) {
        window.state.commSubTab = 'dm';
        if (p && p.id) window.state.dmActiveId = p.id;
        if (typeof renderCommScreen === 'function') renderCommScreen();
        toast((p ? p.name : '러닝메이트') + '님과의 1:1 대화방으로 이동했습니다.');
      }
    },
  };

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 refreshRadar·gotoCompanions — 이전 전 1893~1922줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_refreshRadar = {
    refreshRadar: function(btn) {
      if (btn) {
        btn.disabled = true;
        btn.textContent = '스캔 중...';
      }
      if (window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.syncCompanionsFromDb === 'function') {
        try {
          window.OurgoalTeamInviteComm.syncCompanionsFromDb();
        } catch (e) {}
      }
      setTimeout(function() {
        renderSanctuaryComm();
        if (btn) {
          btn.disabled = false;
          btn.textContent = '새로고침';
        }
        var peers = getRealRunningMates();
        toast('러닝메이트 레이더 갱신 완료: 현재 ' + peers.length + '명 확인');
      }, 350);
    },
    gotoCompanions: function() {
      if (window.state) {
        window.state.commSubTab = 'companion';
        if (typeof renderCommScreen === 'function') renderCommScreen();
        setTimeout(function() {
          var inp = document.getElementById('companionNicknameSearchInput') || document.getElementById('companionSearchInput');
          if (inp) inp.focus();
        }, 150);
      }
    },
  };

  K.renderPeerAvatarHtml = renderPeerAvatarHtml;
  K.getRealRunningMates = getRealRunningMates;
  K.toggleRadarCollapse = toggleRadarCollapse;
  K.renderSanctuaryComm = renderSanctuaryComm;
})(window);
