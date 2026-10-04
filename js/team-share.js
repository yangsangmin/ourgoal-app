/**
 * OurGoal Community Cell: 공유 — 외부 SNS 공유 카드 3대 버튼 + 피드 글 공유 모달 (#TASK-ES-382 · 팀 세포 쪼개기 1차)
 *
 * js/team-invite-comm.js(이전 전 4,105줄)에서 "기록·피드 글을 밖으로 내보내는" 코드를 동작 그대로 옮겼다.
 *   postShareCardToFeed · shareCardExternal · saveCardImage — 공유 카드 피드 게시 / 외부 SNS 공유 / 이미지 저장(이전 전 1025~1143줄)
 *   openFeedShareModal(post) — 소통 피드 글을 동반자 DM·팀 채팅·외부로 공유하는 모달(이전 전 3240~3450줄)
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태(esc·showToast·ensureDefaultCompanions …)를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  /* ------------------------------------------------------------
   * 4. 소통탭 공유창 1:1 '외부sns 소통용 카드 제작하기' & 3대 버튼
   * ------------------------------------------------------------ */
  async function postShareCardToFeed(g, lastRec, canvasDataUrl){
    if(!(await T.askConfirm('아워골 피드에 게시할까요?'))) return;

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

    if(global.sb && prof.id && String(prof.id).indexOf('guest') !== 0){
      try {
        await global.sb.from('feed_posts').insert({
          id: postId,
          user_id: prof.id,
          display_name: prof.displayName || prof.name || '나',
          avatar_url: prof.avatarUrl || null,
          goal_title: goalTitle,
          caption: caption,
          cheers_count: 0,
          created_at: post.created_at,
          extra: post.extra
        });
      } catch(e){
        console.warn('Feed post Supabase insert fallback:', e);
      }
    }

    if(global.saveProfile) await global.saveProfile();

    T.showToast('피드에 내 실천 카드가 성공적으로 게시되었어요!');
    if(global.triggerHaptic) global.triggerHaptic(15);
    if(global.burstConfetti) global.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 16);

    if(global.state){
      global.state.commSubTab = 'feed';
      if(global.renderCommScreen) global.renderCommScreen();
    }
  }

  async function shareCardExternal(dataUrl, g){
    var origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://ourgoal-app.vercel.app';
    var title = g ? ('[아워골] ' + g.title) : '[아워골] 나의 성장 카드';
    var shareUrl = origin + '/';
    var text = '나만의 목표 달성 메이트 아워골에서 성장 카드를 공유합니다! ' + shareUrl;

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
          T.showToast('성공적으로 공유했어요!');
          return;
        }
      } catch(e){}
    }

    if(navigator.share){
      try {
        await navigator.share({ title: title, text: text, url: shareUrl });
        T.showToast('성공적으로 공유했어요!');
        return;
      } catch(e){}
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        T.showToast('공유 링크와 텍스트가 복사되었어요! 원하는 SNS에 공유해보세요.');
      });
    } else {
      T.showToast('아워골 링크: ' + shareUrl);
    }
  }

  function saveCardImage(dataUrl){
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = '아워골_소통카드_1대1.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    T.showToast('1:1 소통 카드를 저장했어요');
    if(global.triggerHaptic) global.triggerHaptic(10);
  }

  /* ------------------------------------------------------------
   * 8. 소통 피드 전용 인앱/외부 통합 공유 모달 (openFeedShareModal)
   * #TASK-COMM-FEED-SOCIAL-BRIDGE
   * ------------------------------------------------------------ */
  function openFeedShareModal(post){
    if(!post) return;
    var state = global.state || {};
    var comps = T.ensureDefaultCompanions();
    var pTitle = post.goal ? ('"' + post.goal + '" 실천 기록') : (post.action || '목표 실천 기록');
    var authorName = post.name || post.display_name || '동료';
    var postDesc = post.action || post.caption || (post.recordText ? post.recordText.slice(0, 80) : '아워골에서 함께 응원하고 성장해요!');

    var mockGroups = (typeof global.MOCK_GROUPS !== 'undefined') ? global.MOCK_GROUPS : [];
    var groupStateFn = global.groupState || function(gid){
      return (state.profile && state.profile.groupStates && state.profile.groupStates[gid]) || {};
    };
    var myTeams = mockGroups.filter(function(g){ return groupStateFn(g.id).joined; });

    var modalHtml = '<h3>🌟 피드 글 공유하기</h3>' +
      '<div style="background:var(--card2);border-radius:12px;padding:12px;border:1px solid var(--rule);margin:10px 0 14px;">' +
        '<div style="font-size:.75rem;color:var(--brand-strong);font-weight:700;margin-bottom:4px;">📌 ' + T.esc(authorName) + '님의 실천</div>' +
        '<div style="font-size:.875rem;font-weight:700;color:var(--ink);line-height:1.4;">' + T.esc(pTitle) + '</div>' +
        '<div style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;line-height:1.4;">' + T.esc(postDesc) + '</div>' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
          '<span>🤝</span> <span>내 동반자에게 1:1 DM으로 공유</span>' +
        '</div>' +
        (comps.length === 0 ? '<p class="faint" style="font-size:.8125rem;margin:4px 0 8px;">등록된 동반자가 없습니다. 피드에서 동반자를 먼저 추가해보세요!</p>' :
        '<div style="display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto;padding-right:4px;">' +
          comps.map(function(c){
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);">' +
              '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
                '<span style="font-size:1.2rem;">' + (c.avatar || '👤') + '</span>' +
                '<span style="font-weight:700;font-size:.8125rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(c.nickname || c.name) + '</span>' +
              '</div>' +
              '<button class="btn btn-ghost btn-sm" data-sharecompdm="' + T.esc(c.id) + '" type="button" style="padding:3px 8px;font-size:.75rem;color:var(--brand);border-color:var(--brand);font-weight:700;">전송 ✉️</button>' +
            '</div>';
          }).join('') +
        '</div>') +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
          '<span>👥</span> <span>우리 팀 목표 단체방에 자랑하기</span>' +
        '</div>' +
        (myTeams.length === 0 ? '<p class="faint" style="font-size:.8125rem;margin:4px 0 8px;">참여 중인 팀 목표가 없습니다.</p>' :
        '<div style="display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto;padding-right:4px;">' +
          myTeams.map(function(t){
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);">' +
              '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
                '<span style="font-size:1.2rem;">' + (t.icon || '🏃‍♂️') + '</span>' +
                '<span style="font-weight:700;font-size:.8125rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(t.title || t.name) + '</span>' +
              '</div>' +
              '<button class="btn btn-ghost btn-sm" data-shareteamchat="' + T.esc(t.id) + '" type="button" style="padding:3px 8px;font-size:.75rem;color:var(--teal);border-color:var(--teal);font-weight:700;">공유 💬</button>' +
            '</div>';
          }).join('') +
        '</div>') +
      '</div>' +
      '<div class="modal-actions" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary btn-block" id="btnShareExternalSNS" type="button" style="width:100%;font-weight:700;padding:10px 14px;border-radius:10px;">🔗 외부 SNS 공유 및 링크 복사</button>' +
        '<button class="btn btn-ghost btn-block" id="btnCloseFeedShareModal" type="button" style="width:100%;">닫기</button>' +
      '</div>';

    if(global.openModal){
      global.openModal(modalHtml, function(sheet){
        var closeBtn = sheet.querySelector('#btnCloseFeedShareModal');
        if(closeBtn) closeBtn.onclick = global.closeModal;

        var extBtn = sheet.querySelector('#btnShareExternalSNS');
        if(extBtn){
          extBtn.onclick = function(){
            if(global.closeModal) global.closeModal();
            if(typeof global.shareContent === 'function'){
              global.shareContent({
                type: 'feed',
                id: post.id,
                title: pTitle,
                author: authorName,
                desc: postDesc,
                text: '[아워골 피드] ' + authorName + '님의 실천: "' + pTitle + '" 🔥'
              });
            }
          };
        }

        sheet.querySelectorAll('[data-sharecompdm]').forEach(function(btn){
          btn.onclick = async function(){
            var compId = btn.getAttribute('data-sharecompdm');
            var comp = comps.find(function(c){ return String(c.id) === String(compId); });
            if(!comp) return;

            var shareMsg = '🌟 [아워골 피드 공유] ' + authorName + '님의 실천: "' + pTitle + '"\r\n\r\n💬 ' + postDesc;
            try {
              var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
              if(isGuest){
                T.showGuestSoftAuthGate('동반자 DM 전송');
                return;
              }

              var myId = state.profile.id;
              var peerId = comp.id;
              var myNick = state.profile.displayName || state.profile.name || '나';
              var myAvatar = (state.profile && (state.profile.avatar || state.profile.avatarUrl)) || '🌱';

              if(global.sb){
                var threadId = [myId, peerId].sort().join('_');
                var replyId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

                await global.sb.from('team_pings').upsert({
                  id: threadId,
                  group_id: 'dm_direct',
                  sender_id: myId,
                  sender_name: myNick,
                  sender_avatar: myAvatar,
                  receiver_id: peerId,
                  target_type: 'dm',
                  target_id: peerId,
                  target_title: '1:1 다이렉트 메시지',
                  ping_type: 'dm',
                  message: shareMsg,
                  status: 'active'
                });

                await global.sb.from('team_ping_replies').insert({
                  id: replyId,
                  ping_id: threadId,
                  group_id: 'dm_direct',
                  sender_id: myId,
                  sender_name: myNick,
                  sender_role: 'member',
                  sender_avatar: myAvatar,
                  receiver_id: peerId,
                  message: shareMsg,
                  created_at: new Date().toISOString()
                });

                try {
                  fetch('/api/push-dispatch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      receiver_id: peerId,
                      sender_name: myNick,
                      title: '1:1 DM (피드 공유)',
                      body: shareMsg.slice(0, 80),
                      tag: 'dm_' + threadId
                    })
                  }).catch(function(){});
                } catch(pe){}
              }

              btn.disabled = true;
              btn.textContent = '✓ 전송됨';
              T.showToast((comp.nickname || comp.name) + '님에게 피드 글을 공유했어요! ✉️');
            } catch(e){
              console.error('Share to DM error:', e);
              T.showToast('메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
          };
        });

        sheet.querySelectorAll('[data-shareteamchat]').forEach(function(btn){
          btn.onclick = async function(){
            var tid = btn.getAttribute('data-shareteamchat');
            var targetTeam = myTeams.find(function(t){ return String(t.id) === String(tid); });
            if(!targetTeam) return;

            var myNick = (state.profile && (state.profile.displayName || state.profile.name)) || '팀원';
            var teamMsg = '🌟 [피드 공유] ' + authorName + '님의 실천: "' + pTitle + '"\r\n"' + postDesc + '"';

            try {
              var gs = groupStateFn(tid);
              gs.chatMessages = gs.chatMessages || [];
              gs.chatMessages.push({
                id: 'cmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                sender: myNick,
                text: teamMsg,
                createdAt: new Date().toISOString(),
                isMe: true
              });

              if(global.sb){
                await global.sb.from('team_pings').insert({
                  id: 'tchat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                  group_id: String(tid),
                  sender_id: (state.profile && state.profile.id) || 'user_me',
                  sender_name: myNick,
                  sender_avatar: (state.profile && (state.profile.avatar || state.profile.avatarUrl)) || '🌱',
                  target_type: 'team_chat',
                  target_id: String(tid),
                  target_title: targetTeam.title || targetTeam.name || '팀 채팅',
                  ping_type: 'chat',
                  message: teamMsg,
                  status: 'active',
                  created_at: new Date().toISOString()
                });
              }

              if(global.saveProfile) await global.saveProfile();
              btn.disabled = true;
              btn.textContent = '✓ 공유됨';
              T.showToast('"' + (targetTeam.title || targetTeam.name) + '" 팀 단체방에 공유했어요! 💬');
            } catch(err){
              console.error('Share to team chat error:', err);
              T.showToast('팀 톡방 공유 중 오류가 발생했습니다.');
            }
          };
        });
      });
    }
  }

  K.postShareCardToFeed = postShareCardToFeed;
  K.shareCardExternal = shareCardExternal;
  K.saveCardImage = saveCardImage;
  K.openFeedShareModal = openFeedShareModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
