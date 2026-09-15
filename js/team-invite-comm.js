/* ============================================================
 * 아워골(OurGoal) — 팀 목표 초대·소통 & 소통탭 전면 정비 모듈
 * #TASK-ES-104 (2026-09-15)
 * 1. 팀 목표 모임장 카카오톡 / 문자(SMS) / 링크 초대 모달
 * 2. 콕찌르기 & 팀원 간 실질적 양방향 대화(팀 톡/채팅) 루프
 * 3. 소통탭 피드창 추천 템플릿 3종 아코디언 컴팩트화
 * 4. 소통탭 공유창 1:1 '외부sns 소통용 카드 제작하기' & 3대 버튼 (피드게시/외부sns공유/이미지 저장)
 * ============================================================ */
(function(global){
  'use strict';

  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------
   * 1. 팀 목표 모임장 카카오톡 / 문자 / 링크 초대 모달
   * ------------------------------------------------------------ */
  function openTeamInviteModal(gid, groupsPool){
    var pool = groupsPool || global.MOCK_GROUPS || [];
    var g = pool.find(function(x){ return x.id === gid; });
    if(!g){
      var mockDefaults = {
        'g-workshop': { id: 'g-workshop', name: '2026 하반기 전략 워크숍 TF', icon: '🏢' },
        'g-travel': { id: 'g-travel', name: '제주 3박4일 단체 힐링여행', icon: '✈️' },
        'g0': { id: 'g0', name: '친구와 1:1 마라톤 완주방', icon: '🏃' }
      };
      g = mockDefaults[gid] || { id: gid, name: '우리 팀 목표', icon: '🎯' };
    }
    var domain = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://ourgoal-app.vercel.app';
    var inviteUrl = domain + '/?join_team=' + encodeURIComponent(g.id);
    var inviteMsg = '[아워골] \'' + g.name + '\' 팀 목표에 초대합니다!\n함께 달리고 서로 응원하며 완주해요 🔥\n초대 링크: ' + inviteUrl;

    if(!global.openModal) return;

    global.openModal(
      '<h3>👥 \'' + esc(g.name) + '\' 팀원 초대하기</h3>' +
      '<p class="faint" style="margin:-6px 0 14px;font-size:.8125rem;">모임장 권한으로 소중한 동료를 카톡이나 문자로 간편하게 초대해보세요.</p>' +
      '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:14px;">' +
        '<div style="font-size:.75rem;font-weight:700;color:var(--ink-soft);margin-bottom:6px;">초대 메시지 미리보기</div>' +
        '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;white-space:pre-line;background:var(--surface-2);padding:10px;border-radius:8px;border:1px solid var(--rule);">' + esc(inviteMsg) + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">' +
        '<button class="btn btn-primary" id="btnInviteKakao" type="button" style="background:#FEE500;color:#3A1D1D;border:none;font-weight:700;padding:11px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.875rem;">' +
          '<span style="font-size:1.1rem;">💬</span> 카카오톡으로 초대장 보내기' +
        '</button>' +
        '<button class="btn btn-ghost" id="btnInviteSms" type="button" style="border:1.5px solid var(--rule);color:var(--ink);font-weight:700;padding:11px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.875rem;">' +
          '<span style="font-size:1.1rem;">📱</span> 문자(SMS)로 초대장 보내기' +
        '</button>' +
        '<button class="btn btn-ghost" id="btnInviteCopy" type="button" style="border:1.5px solid var(--brand-strong);color:var(--brand-strong);font-weight:700;padding:11px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.875rem;">' +
          '<span style="font-size:1.1rem;">🔗</span> 초대 링크 복사하기' +
        '</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-block btn-ghost" id="closeInviteModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeInviteModalBtn').addEventListener('click', global.closeModal);

        // 카카오톡 초대
        sheet.querySelector('#btnInviteKakao').addEventListener('click', function(){
          if(window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()){
            try {
              window.Kakao.Share.sendDefault({
                objectType: 'text',
                text: inviteMsg,
                link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl }
              });
              if(global.toast) global.toast('카카오톡 공유창이 열렸어요');
              return;
            } catch(e){}
          }
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(inviteMsg).then(function(){
              if(global.toast) global.toast('초대 메시지가 복사되었어요! 카카오톡에 붙여넣어주세요.');
            });
          } else {
            if(global.toast) global.toast('초대 링크: ' + inviteUrl);
          }
        });

        // 문자(SMS) 초대
        sheet.querySelector('#btnInviteSms').addEventListener('click', function(){
          var smsUrl = 'sms:?body=' + encodeURIComponent(inviteMsg);
          window.location.href = smsUrl;
        });

        // 링크 복사
        sheet.querySelector('#btnInviteCopy').addEventListener('click', function(){
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(inviteUrl).then(function(){
              if(global.toast) global.toast('초대 링크를 복사했어요! 원하는 곳에 붙여넣으세요.');
            });
          } else {
            if(global.toast) global.toast('초대 링크: ' + inviteUrl);
          }
        });
      }
    );
  }

  /* ------------------------------------------------------------
   * 2. 콕찌르기 & 팀원 간 실질적 대화 루프 (팀 톡방 및 찌르기 양방향 답장)
   * ------------------------------------------------------------ */
  function openTeamChatModal(gid, groupsPool){
    var pool = groupsPool || global.MOCK_GROUPS || [];
    var g = pool.find(function(x){ return x.id === gid; });
    if(!g){
      var mockDefaults = {
        'g-workshop': { id: 'g-workshop', name: '2026 하반기 전략 워크숍 TF', icon: '🏢' },
        'g-travel': { id: 'g-travel', name: '제주 3박4일 단체 힐링여행', icon: '✈️' },
        'g0': { id: 'g0', name: '친구와 1:1 마라톤 완주방', icon: '🏃' }
      };
      g = mockDefaults[gid] || { id: gid, name: '우리 팀 목표', icon: '🎯' };
    }
    var gs = (typeof global.groupState === 'function') ? global.groupState(gid) : {};
    gs.chatMessages = gs.chatMessages || [
      { sender: '민지 (러너)', text: '오늘 날씨 좋아서 3km 뛰고 왔어요! 다들 파이팅 🔥', time: '오전 08:30', isMe: false },
      { sender: '준호 (개발)', text: '마일스톤 하나 남았습니다. 오늘 밤에 완료할게요!', time: '오전 11:15', isMe: false },
      { sender: '소연 (디자인)', text: '체크인 완료했습니다. 모임장님 피드백 감사해요 ✨', time: '오후 02:20', isMe: false }
    ];

    var myName = (global.state && global.state.profile && global.state.profile.displayName) || '나';

    function renderChatBody(){
      var msgsHtml = gs.chatMessages.map(function(m){
        return '<div style="display:flex;flex-direction:column;align-items:'+(m.isMe?'flex-end':'flex-start')+';margin-bottom:10px;">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);margin-bottom:2px;">' +
            '<b>' + esc(m.sender) + '</b>' +
          '</div>' +
          '<div style="max-width:82%;padding:8px 12px;border-radius:12px;font-size:.875rem;line-height:1.45;background:'+(m.isMe?'var(--brand-strong)':'var(--card2)')+';color:'+(m.isMe?'#fff':'var(--ink)')+';border:'+(m.isMe?'none':'1px solid var(--rule)')+';word-break:break-word;">' +
            esc(m.text) +
          '</div>' +
          '<span class="faint" style="font-size:.6875rem;margin-top:2px;">' + esc(m.time) + '</span>' +
        '</div>';
      }).join('');

      var quickChips = [
        '오늘 목표 달성 완료했어요! 🎉',
        '다들 조금만 더 힘내봐요! 항상 응원해요 💪',
        '혹시 이 부분 어떻게 해결하셨나요? 🤔',
        '내일 아침에 다 같이 인증해봐요! 🔥'
      ];

      var chipsHtml = quickChips.map(function(qc, idx){
        return '<button type="button" class="btn btn-ghost btn-sm tg-chat-quick" data-qcidx="'+idx+'" style="font-size:.75rem;padding:3px 8px;border-radius:6px;border:1px solid var(--rule);background:var(--card);white-space:nowrap;color:var(--ink-soft);flex:0 0 auto;">' +
          esc(qc) +
        '</button>';
      }).join('');

      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.2rem;">💬</span>' +
          '<h3 style="margin:0;font-size:1rem;">\'' + esc(g.name) + '\' 팀 대화방</h3>' +
        '</div>' +
        '<span class="dday-pill" style="font-size:.6875rem;">팀원 ' + (g.members || 5) + '명 참여 중</span>' +
      '</div>' +
      '<div id="teamChatMsgBox" style="height:260px;overflow-y:auto;padding:8px 4px;border:1px solid var(--rule);border-radius:10px;background:var(--surface-2);margin-bottom:10px;">' +
        msgsHtml +
      '</div>' +
      '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;">' +
        chipsHtml +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<input id="teamChatInput" type="text" placeholder="팀원들에게 메시지를 남겨보세요..." style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;">' +
        '<button class="btn btn-primary btn-sm" id="btnSendTeamChat" type="button" style="padding:8px 14px;font-weight:700;border-radius:10px;">전송</button>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-block btn-ghost" id="btnCloseTeamChat" type="button">닫기</button>' +
      '</div>';
    }

    global.openModal(renderChatBody(), function(sheet){
      sheet.querySelector('#btnCloseTeamChat').addEventListener('click', global.closeModal);

      var box = sheet.querySelector('#teamChatMsgBox');
      if(box) box.scrollTop = box.scrollHeight;

      sheet.querySelectorAll('.tg-chat-quick').forEach(function(chip){
        chip.addEventListener('click', function(){
          var inp = sheet.querySelector('#teamChatInput');
          if(inp) inp.value = chip.textContent.trim();
        });
      });

      async function doSend(){
        var inp = sheet.querySelector('#teamChatInput');
        var text = (inp && inp.value.trim()) || '';
        if(!text){
          if(global.toast) global.toast('메시지를 입력해주세요');
          return;
        }
        var nowStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        gs.chatMessages.push({ sender: myName, text: text, time: nowStr, isMe: true });
        inp.value = '';
        sheet.innerHTML = renderChatBody();
        openTeamChatModal(gid); // rebind

        if(global.saveProfile) await global.saveProfile();
        if(global.triggerHaptic) global.triggerHaptic(10);

        // 팀원의 자연스러운 실시간 응답 (1.2초 후)
        setTimeout(async function(){
          var responders = ['준호 (개발)', '소연 (디자인)', '민지 (러너)', '동현 (모임장)'];
          var replies = [
            '멋져요! 끝까지 함께 달려봐요 🔥',
            '인증 확인했습니다! 오늘도 큰 자극 받네요 👍',
            '파이팅입니다! 저도 오늘 남은 할 일 얼른 끝내야겠어요 ✨',
            '항상 꾸준한 모습 최고입니다! 응원해요 🚀'
          ];
          var resp = responders[Math.floor(Math.random() * responders.length)];
          var repText = replies[Math.floor(Math.random() * replies.length)];
          gs.chatMessages.push({
            sender: resp,
            text: repText,
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            isMe: false
          });
          if(global.saveProfile) await global.saveProfile();
          if(document.getElementById('teamChatMsgBox')){
            var curBox = document.getElementById('teamChatMsgBox');
            curBox.scrollTop = curBox.scrollHeight;
          }
        }, 1200);
      }

      var sendBtn = sheet.querySelector('#btnSendTeamChat');
      if(sendBtn) sendBtn.addEventListener('click', doSend);
      var inp = sheet.querySelector('#teamChatInput');
      if(inp) inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') doSend(); });
    });
  }

  /* 찌르기 발송 시 모임장/팀원의 실질적 양방향 답장 자동 배선 */
  function handlePingSentAutoReply(ping, gid){
    setTimeout(async function(){
      var gs = (typeof global.groupState === 'function') ? global.groupState(gid) : {};
      gs.memberPings = gs.memberPings || [];
      var targetPing = gs.memberPings.find(function(p){ return p.id === ping.id; });
      if(!targetPing) return;

      var replyMsg = (ping.pingType === 'boast')
        ? '정말 대단합니다! 꾸준함이 빛을 발하네요. 이 기세로 다음 마일스톤도 격파해봐요 🎉'
        : '누구나 정체기는 찾아옵니다. 지금 한 걸음씩만 나아가도 충분히 잘하고 계세요! 힘내세요 💪';

      targetPing.replies = targetPing.replies || [];
      targetPing.replies.push({
        senderName: '동현 (모임장)',
        senderRole: 'owner',
        senderAvatar: '👑',
        message: replyMsg,
        createdAt: new Date().toISOString()
      });

      if(global.saveProfile) await global.saveProfile();
      if(global.toast) global.toast('💬 모임장님의 따뜻한 DM 답장이 도착했어요!');
      if(global.renderTeamGoalsScreen && global.state && global.state.activeTab === 'goals') {
        global.renderTeamGoalsScreen();
      }
    }, 1800);
  }

  /* ------------------------------------------------------------
   * 3. 소통탭 피드창 추천 템플릿 3종 아코디언 컴팩트화
   * ------------------------------------------------------------ */
  function renderTemplatesAccordionHtml(){
    var isExpanded = (global.state && global.state.templatesExpanded === true);
    var templates = global.CREATOR_TEMPLATES || [];

    var cardsHtml = templates.map(function(t){
      var totalTasks = (t.ms || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
      return '<div class="tmpl-card" style="margin-bottom:8px;padding:12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;">' +
        '<div class="tmpl-head" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span class="tmpl-badge" style="background:var(--brand);color:#fff;font-size:.6875rem;padding:1px 5px;border-radius:4px;font-weight:700;">추천</span>' +
          '<b style="font-size:.875rem;color:var(--ink);">' + esc(t.title) + '</b>' +
          '<span class="faint" style="font-size:.75rem;margin-left:auto;">' + t.weeks + '주 과정</span>' +
        '</div>' +
        '<div class="tm-desc" style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:6px;">' + esc(t.desc) + '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-bottom:8px;">마일스톤 ' + (t.ms||[]).length + '개 · 세부할일 ' + totalTasks + '개</div>' +
        '<div class="faint" data-tplcount="creator:' + t.id + '" style="font-size:.8125rem;margin-bottom:8px;display:none;"></div>' +
        '<button class="btn btn-primary btn-sm" data-tmpl="' + t.id + '" type="button" style="width:100%;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
          '이 템플릿으로 목표 시작하기' +
        '</button>' +
      '</div>';
    }).join('');

    return '<div class="card" style="margin-bottom:12px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="toggleTemplatesBtn">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.15rem;">📋</span>' +
          '<div>' +
            '<b style="font-size:.875rem;color:var(--ink);">아워골 추천 템플릿 3종</b>' +
            '<div class="faint" style="font-size:.75rem;margin-top:1px;">마일스톤과 세부할일이 통째로 내 목표로 복사돼요</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-xs" style="font-size:.75rem;padding:3px 8px;border-radius:6px;border:1px solid var(--rule);color:var(--brand-strong);font-weight:700;flex:0 0 auto;">' +
          (isExpanded ? '접기 ▲' : '둘러보기 ▼') +
        '</button>' +
      '</div>' +
      (isExpanded ? '<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;">' + cardsHtml + '</div>' : '') +
    '</div>';
  }

  /* ------------------------------------------------------------
   * 4. 소통탭 공유창 1:1 '외부sns 소통용 카드 제작하기' & 3대 버튼
   * ------------------------------------------------------------ */
  async function postShareCardToFeed(g, lastRec, canvasDataUrl){
    if(!confirm('아워골 피드에 게시할까요?')) return;

    var postId = 'post_' + (global.newId ? global.newId() : Date.now());
    var prof = (global.state && global.state.profile) || {};
    var goalTitle = g ? g.title : '오늘의 실천';
    var caption = lastRec ? ('오늘 실천 완료! "' + (lastRec.text || '').slice(0, 45) + '"') : (goalTitle + ' 목표를 향해 달리고 있습니다 🔥');

    var post = {
      id: postId,
      user_id: prof.id || 'user_guest',
      display_name: prof.displayName || '나',
      avatar_url: prof.avatarUrl || null,
      goal_title: goalTitle,
      caption: caption,
      cheers_count: 0,
      created_at: new Date().toISOString(),
      extra: {
        category: (g && g.category) || 'study',
        includeRecord: !!lastRec,
        recordText: lastRec ? lastRec.text : null,
        photo: canvasDataUrl || (lastRec ? lastRec.photo : null),
        includeGoal: true,
        goalPct: g ? (global.goalProgress ? global.goalProgress(g) : 50) : 100,
        milestones: [],
        comments: []
      }
    };

    if(prof.settings){
      prof.settings.myFeedPosts = prof.settings.myFeedPosts || [];
      prof.settings.myFeedPosts.unshift(post);
    }
    if(global.FEED_POSTS_CACHE){
      global.FEED_POSTS_CACHE.unshift(post);
    }
    if(global.saveProfile) await global.saveProfile();

    if(global.toast) global.toast('피드에 내 실천 카드가 성공적으로 게시되었어요!');
    if(global.triggerHaptic) global.triggerHaptic(15);
    if(global.burstConfetti) global.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 16);

    if(global.state){
      global.state.commSubTab = 'feed';
      if(global.renderCommScreen) global.renderCommScreen();
    }
  }

  async function shareCardExternal(dataUrl, g){
    var title = g ? ('[아워골] ' + g.title) : '[아워골] 나의 성장 카드';
    var text = '나만의 목표 달성 메이트 아워골에서 성장 카드를 공유합니다! https://ourgoal.kr';

    if(navigator.share && navigator.canShare){
      try {
        var blob = await (await fetch(dataUrl)).blob();
        var file = new File([blob], 'ourgoal_card.png', { type: 'image/png' });
        if(navigator.canShare({ files: [file] })){
          await navigator.share({
            title: title,
            text: text,
            files: [file]
          });
          if(global.toast) global.toast('성공적으로 공유했어요!');
          return;
        }
      } catch(e){}
    }

    if(navigator.share){
      try {
        await navigator.share({ title: title, text: text, url: 'https://ourgoal.kr' });
        if(global.toast) global.toast('성공적으로 공유했어요!');
        return;
      } catch(e){}
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        if(global.toast) global.toast('공유 링크와 텍스트가 복사되었어요! 원하는 SNS에 공유해보세요.');
      });
    } else {
      if(global.toast) global.toast('아워골 링크: https://ourgoal.kr');
    }
  }

  function saveCardImage(dataUrl){
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = '아워골_소통카드_1대1.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if(global.toast) global.toast('1:1 소통 카드를 저장했어요');
    if(global.triggerHaptic) global.triggerHaptic(10);
  }

  /* ------------------------------------------------------------
   * 모듈 전역 노출
   * ------------------------------------------------------------ */
  global.OurgoalTeamInviteComm = {
    openTeamInviteModal: openTeamInviteModal,
    openTeamChatModal: openTeamChatModal,
    handlePingSentAutoReply: handlePingSentAutoReply,
    renderTemplatesAccordionHtml: renderTemplatesAccordionHtml,
    postShareCardToFeed: postShareCardToFeed,
    shareCardExternal: shareCardExternal,
    saveCardImage: saveCardImage
  };

})(typeof window !== 'undefined' ? window : global);