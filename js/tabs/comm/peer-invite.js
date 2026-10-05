/**
 * OurGoal Comm Peer Invite (소통 탭 — '함께 목표' 방 초대 링크 복사·카카오 공유·초대 수락·초대 받은 화면)
 *
 * 클립보드 복사(copyTextToClipboard · fallbackCopyText) · 초대 기록(trackPeerInvite) · 카카오 공유(shareGroupToKakao) · 초대 링크 복사(copyGroupInviteLink) · 초대 성공 창(openPeerInviteSuccessModal) · 초대 수락(acceptPeerInvite) · 초대 받은 화면(showPeerInviteLandingModal).
 * 같은 묶음의 순수 함수 세 개(calculateRemainingSeats · buildPeerInviteUrl · formatPeerInviteMessage)는 scripts/smoke-test.js FN_NAMES 가 잘라 가는 함수라 생성기 규칙(유형 F2)대로 index.html 에 남겼다.
 * #TASK-ES-461(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 25275~25281 · 25282~25293 · 25314~25330 · 25331~25354 · 25355~25361 · 25362~25402 · 25403~25476 · 25477~25540줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 25275~25281줄(#TASK-ES-461 생성기 표지) ---- */
  function copyTextToClipboard(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).catch(function(){ fallbackCopyText(text); });
    } else {
      fallbackCopyText(text);
    }
  }
  /* ---- 이전 전 index.html 25282~25293줄(#TASK-ES-461 생성기 표지) ---- */
  function fallbackCopyText(text){
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch(e){}
  }

  /* ---- 이전 전 index.html 25314~25330줄(#TASK-ES-461 생성기 표지) ---- */

  function trackPeerInvite(action, groupId){
    try {
      if(typeof L.track === 'function'){
        L.track('peer_invite_' + action, {
          group_id: groupId,
          user_id: L.state.profile ? L.state.profile.id : null,
          time: L.nowISO()
        });
        if(action === 'share'){
          L.track('invite_sent', { source: 'peer_group', goal_type: null, day_index: L.dayIndexSinceSignup(), group_id: groupId });
        } else if(action === 'view'){
          L.track('invite_opened', { source: 'peer_group', goal_type: null, day_index: L.dayIndexSinceSignup(), group_id: groupId });
        }
      }
    } catch(e){}
  }
  /* ---- 이전 전 index.html 25331~25354줄(#TASK-ES-461 생성기 표지) ---- */

  async function shareGroupToKakao(group){
    var inviteUrl = L.buildPeerInviteUrl(group);
    var senderName = L.state.profile ? L.state.profile.displayName : '친구';
    var textMsg = L.formatPeerInviteMessage(group, senderName, inviteUrl);
    trackPeerInvite('share', group.id);

    if(navigator.share){
      try {
        await navigator.share({
          title: '[아워골] ' + (group.name || '함께 목표') + ' 초대',
          text: textMsg,
          url: inviteUrl
        });
        L.toast('카카오톡 또는 원하는 앱으로 초대장을 전송했어요 💌');
        return;
      } catch(e){
        if(e.name === 'AbortError') return;
      }
    }

    copyTextToClipboard(textMsg);
    L.toast('초대장과 링크가 복사되었어요! 카카오톡 대화방에 붙여넣어 공유하세요 💬');
  }
  /* ---- 이전 전 index.html 25355~25361줄(#TASK-ES-461 생성기 표지) ---- */

  function copyGroupInviteLink(group){
    var inviteUrl = L.buildPeerInviteUrl(group);
    copyTextToClipboard(inviteUrl);
    trackPeerInvite('copy_link', group.id);
    L.toast('초대 링크가 복사되었어요! 카카오톡이나 SNS에 공유하세요 🔗');
  }
  /* ---- 이전 전 index.html 25362~25402줄(#TASK-ES-461 생성기 표지) ---- */

  function openPeerInviteSuccessModal(group){
    var isPair = group.maxMembers === 2;
    var rem = L.calculateRemainingSeats(group, 0);
    L.openModal(
      '<div style="text-align:center;padding:10px 4px 6px;">' +
        '<div style="font-size:2.4rem;margin-bottom:8px;">🎉</div>' +
        '<h3 style="font-size:1.125rem;font-weight:700;margin:0 0 6px;">방이 성공적으로 개설되었어요!</h3>' +
        '<p class="muted" style="font-size:.875rem;line-height:1.5;margin:0 0 16px;">' +
          (isPair ? '친구 1명을 초대해 1:1 페이스메이커로 함께 완주해보세요!' : '5인 소그룹 멤버를 초대해 함께 완주 목표를 시작해보세요.') + '<br>' +
          '<b>앱 설치 없이 웹에서 바로</b> 초대 수락하고 참여할 수 있어요.' +
        '</p>' +
        '<div style="background:var(--card2);border-radius:12px;padding:12px;border:1px solid var(--rule);margin-bottom:14px;text-align:left;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<span style="font-size:1.3rem;">'+group.icon+'</span>' +
            '<b style="font-size:1rem;color:var(--ink);">'+L.escapeHtml(group.name)+'</b>' +
            '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);">'+(isPair ? '1:1 페어' : group.maxMembers+'인 소그룹')+'</span>' +
          '</div>' +
          '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:4px;">'+L.escapeHtml(group.desc)+'</div>' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--sage);">현재 1명 참여 중 · 잔여 '+rem+'자리</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="btn btn-kakao" id="modalKakaoShareBtn" type="button" style="width:100%;padding:11px;font-size:.875rem;justify-content:center;">카카오톡으로 친구 초대하기</button>' +
          '<button class="btn btn-ghost" id="modalCopyLinkBtn" type="button" style="width:100%;padding:10px;font-size:.875rem;justify-content:center;">초대 링크 복사하기</button>' +
          '<button class="mz-btn" id="modalGoRoomBtn" type="button" style="width:100%;margin-top:4px;padding:11px;font-size:.875rem;">방으로 바로 이동</button>' +
        '</div>' +
      '</div>',
      function(sheet){
        var kBtn = sheet.querySelector('#modalKakaoShareBtn');
        if(kBtn) kBtn.onclick = function(){ shareGroupToKakao(group); };
        var cBtn = sheet.querySelector('#modalCopyLinkBtn');
        if(cBtn) cBtn.onclick = function(){ copyGroupInviteLink(group); };
        var gBtn = sheet.querySelector('#modalGoRoomBtn');
        if(gBtn) gBtn.onclick = function(){
          L.closeModal();
          L.state.activeGroupId = group.id;
          L.renderCommGroups(document.getElementById('commBody'));
        };
      }
    );
  }
  /* ---- 이전 전 index.html 25403~25476줄(#TASK-ES-461 생성기 표지) ---- */

  async function acceptPeerInvite(inviteGid, customNickname, roomMeta){
    trackPeerInvite('accept', inviteGid);
    var targetGroup = L.MOCK_GROUPS.find(function(x){ return x.id === inviteGid; });
    if(!targetGroup && roomMeta && roomMeta.name){
      targetGroup = {
        id: inviteGid,
        icon: roomMeta.icon || '🏃',
        name: roomMeta.name,
        topic: roomMeta.topic || 'health/러닝·마라톤',
        region: '온라인',
        members: 1,
        maxMembers: parseInt(roomMeta.max, 10) || 5,
        roomType: roomMeta.type || 'small',
        progress: 20,
        cadence: '주 3회',
        endDate: L.daysFromNow(30),
        desc: roomMeta.desc || '함께 목표를 달성하는 소그룹 방이에요',
        rule: roomMeta.rule || '주 3회 인증샷 또는 기록 남기기',
        weeklyTarget: 15,
        weeklyDone: 3,
        roster: [],
        activity: ['초대 링크를 통해 참여가 시작되었어요'],
        teamGoals: []
      };
      L.MOCK_GROUPS.unshift(targetGroup);
    }

    var nick = (customNickname && customNickname.trim()) ? customNickname.trim() : (L.state.profile ? L.state.profile.displayName : '함께 달리는 러너');

    if(!L.state.profile){
      var guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      L.state.profile = L.defaultProfile(guestId, guestId, nick);
      try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(L.state.profile)); } catch(e){}
    } else {
      if(customNickname && customNickname.trim()) L.state.profile.displayName = nick;
    }

    var gs = L.groupState(inviteGid);
    gs.joined = true;
    if(!gs.myRole) gs.myRole = 'member';

    if(targetGroup){
      if(!targetGroup.roster) targetGroup.roster = [];
      if(!targetGroup.roster.some(function(r){ return r.n === nick; })){
        targetGroup.roster.push({ n: nick, c: 0, me: true });
        targetGroup.members = (targetGroup.members || 1) + 1;
      }
      if(!targetGroup.activity) targetGroup.activity = [];
      targetGroup.activity.unshift(nick + '님이 초대를 수락하고 방에 참여했어요! 🎉');
    }

    await L.saveProfile();
    L.closeModal();

    var landScreen = document.getElementById('landingScreen');
    if(landScreen) landScreen.style.display = 'none';
    var authScreen = document.getElementById('authScreen');
    if(authScreen) authScreen.style.display = 'none';

    await L.enterApp();
    L.switchTab('comm');
    L.state.commSubTab = 'groups';
    L.state.activeGroupId = inviteGid;
    var commBody = document.getElementById('commBody');
    if(commBody) L.renderCommGroups(commBody);

    L.burstConfetti(window.innerWidth / 2, window.innerHeight / 3);
    L.toast('「' + (targetGroup ? targetGroup.name : '함께 목표 방') + '」에 참여했어요! 오늘 첫 인증을 남겨보세요.');

    if(window.history && window.history.replaceState){
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
  /* ---- 이전 전 index.html 25477~25540줄(#TASK-ES-461 생성기 표지) ---- */

  function showPeerInviteLandingModal(inviteGid, roomMeta){
    trackPeerInvite('view', inviteGid);
    var targetGroup = L.MOCK_GROUPS.find(function(x){ return x.id === inviteGid; });
    var roomName = (targetGroup && targetGroup.name) || (roomMeta && roomMeta.name) || '함께 목표 소그룹 방';
    var icon = (targetGroup && targetGroup.icon) || (roomMeta && roomMeta.icon) || '🏃';
    var maxMembers = (targetGroup && targetGroup.maxMembers) || (roomMeta && parseInt(roomMeta.max, 10)) || 5;
    var isPair = maxMembers === 2;
    var desc = (targetGroup && targetGroup.desc) || (roomMeta && roomMeta.desc) || '친구와 함께 서로의 페이스메이커가 되어 목표를 완주해요.';
    var rule = (targetGroup && targetGroup.rule) || (roomMeta && roomMeta.rule) || '주 3회 러닝 또는 목표 기록 인증';
    var curMembers = targetGroup ? targetGroup.members : 1;
    var remaining = Math.max(0, maxMembers - curMembers);
    var defaultNick = L.state.profile ? L.state.profile.displayName : '함께 달리는 러너';

    L.openModal(
      '<div style="text-align:center;padding:8px 4px 6px;">' +
        '<div style="font-size:2.4rem;margin-bottom:8px;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>' +
        '<div class="dday-pill" style="background:var(--sage-soft);color:var(--sage);display:inline-block;margin-bottom:6px;font-weight:700;">Zero-Install Web Onboarding</div>' +
        '<h3 style="font-size:1.2rem;font-weight:700;margin:0 0 6px;">함께 목표 방 초대장이 도착했어요!</h3>' +
        '<p class="muted" style="font-size:.875rem;line-height:1.5;margin:0 0 14px;">' +
          '앱 설치 없이 웹 브라우저에서 바로 수락하고 시작할 수 있어요.' +
        '</p>' +
        '<div style="background:var(--card2);border-radius:12px;padding:14px;border:1px solid var(--rule);margin-bottom:14px;text-align:left;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-size:1.5rem;">'+icon+'</span>' +
            '<b style="font-size:1rem;color:var(--ink);">'+L.escapeHtml(roomName)+'</b>' +
            '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);font-size:.7rem;">'+(isPair ? '1:1 페어 완주' : maxMembers+'인 소그룹')+'</span>' +
          '</div>' +
          '<p style="font-size:.8125rem;color:var(--ink-soft);margin:4px 0 8px;line-height:1.4;">'+L.escapeHtml(desc)+'</p>' +
          '<div style="font-size:.8125rem;color:var(--ink-faint);margin-bottom:6px;">인증 규칙: <b>'+L.escapeHtml(rule)+'</b></div>' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--brand-strong);">현재 '+curMembers+'명 참여 중 · 잔여 '+remaining+'자리</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;text-align:left;">' +
          '<label style="font-size:.8125rem;font-weight:700;color:var(--ink);display:block;margin-bottom:4px;">참여할 닉네임</label>' +
          '<input id="peerInviteNickInput" type="text" value="'+L.escapeHtml(defaultNick)+'" placeholder="닉네임을 입력하세요" style="width:100%;box-sizing:border-box;font-size:.875rem;padding:9px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--card);color:var(--ink);">' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="mz-btn" id="peerInviteAcceptBtn" type="button" style="width:100%;padding:12px;font-size:.9375rem;font-weight:700;">' +
            '초대 수락하고 바로 방 들어가기 (웹 즉시 시작)' +
          '</button>' +
          (!L.state.profile ? '<button class="btn btn-kakao" id="peerInviteKakaoQuickBtn" type="button" style="width:100%;padding:10px;font-size:.875rem;justify-content:center;">카카오로 3초 만에 시작하기</button>' : '') +
          '<button class="btn btn-ghost btn-sm" id="peerInviteDismissBtn" type="button" style="width:100%;margin-top:2px;">둘러보기만 하기</button>' +
        '</div>' +
        '<p class="faint" style="font-size:.6875rem;text-align:center;margin:8px 0 0;">' +
          '별도 다운로드나 앱스토어 설치 없이 이 웹 화면에서 오늘부터 바로 인증할 수 있어요' +
        '</p>' +
      '</div>',
      function(sheet){
        var accBtn = sheet.querySelector('#peerInviteAcceptBtn');
        if(accBtn) accBtn.onclick = function(){
          var nickInput = sheet.querySelector('#peerInviteNickInput');
          var nickVal = nickInput ? nickInput.value.trim() : '';
          acceptPeerInvite(inviteGid, nickVal, roomMeta);
        };
        var kakaoBtn = sheet.querySelector('#peerInviteKakaoQuickBtn');
        if(kakaoBtn) kakaoBtn.onclick = function(){
          L.closeModal();
          L.startOAuthLogin('kakao');
        };
        var dBtn = sheet.querySelector('#peerInviteDismissBtn');
        if(dBtn) dBtn.onclick = L.closeModal;
      }
    );
  }

  K.copyTextToClipboard = copyTextToClipboard;
  K.fallbackCopyText = fallbackCopyText;
  K.trackPeerInvite = trackPeerInvite;
  K.shareGroupToKakao = shareGroupToKakao;
  K.copyGroupInviteLink = copyGroupInviteLink;
  K.openPeerInviteSuccessModal = openPeerInviteSuccessModal;
  K.acceptPeerInvite = acceptPeerInvite;
  K.showPeerInviteLandingModal = showPeerInviteLandingModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
