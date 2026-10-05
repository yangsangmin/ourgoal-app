/**
 * OurGoal Community Cell: DM 대화방 — 시각 표기·메시지 상세·메시지 렌더·DB 로드·실시간 구독·DM 화면(renderCommDM) (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 1048~1089, 1094~1564줄).
 *   formatDmTime · formatDmDetailTime · toggleDmMsgDetail · renderSingleDmMsg · loadDmMessagesFromDb · subscribeRealtimeDm · renderCommDM
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  function formatDmTime(isoOrDate){
    if(!isoOrDate) return '방금';
    try {
      var d = new Date(isoOrDate);
      if(isNaN(d.getTime())) return String(isoOrDate);
      var h = d.getHours();
      var m = d.getMinutes();
      var ampm = h >= 12 ? '오후' : '오전';
      var h12 = h % 12;
      if(h12 === 0) h12 = 12;
      return ampm + ' ' + h12 + ':' + (m < 10 ? '0' : '') + m;
    } catch(e){
      return '방금';
    }
  }

  function formatDmDetailTime(isoOrDate){
    if(!isoOrDate) return '확인 불가';
    try {
      var d = new Date(isoOrDate);
      if(isNaN(d.getTime())) return String(isoOrDate);
      var year = d.getFullYear();
      var month = d.getMonth() + 1;
      var date = d.getDate();
      var h = d.getHours();
      var m = d.getMinutes();
      var s = d.getSeconds();
      var ampm = h >= 12 ? '오후' : '오전';
      var h12 = h % 12;
      if(h12 === 0) h12 = 12;
      return year + '.' + (month < 10 ? '0' : '') + month + '.' + (date < 10 ? '0' : '') + date + ' ' + ampm + ' ' + h12 + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    } catch(e){
      return '방금';
    }
  }

  function toggleDmMsgDetail(detailId){
    if(typeof document === 'undefined') return;
    var el = document.getElementById(detailId);
    if(!el) return;
    el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
  }

  function renderSingleDmMsg(m){
    var isMe = (m.from === 'me');
    var sentAt = m.sentAt || m.createdAt || m.time;
    var deliveredAt = m.deliveredAt || (isMe ? null : sentAt); // #TASK-ES-366: 내 메시지는 받는 기기가 받아 간 시각이 있을 때만 '도착'
    var readAt = m.readAt || (m.read ? (deliveredAt || sentAt) : null);
    var timeStr = formatDmTime(sentAt);

    var sentTimeDetail = formatDmDetailTime(sentAt);
    var deliveredTimeDetail = formatDmDetailTime(deliveredAt);
    var readTimeDetail = m.read ? formatDmDetailTime(readAt) : '상대방 미확인 (안읽음 1)';

    var unreadBadge = (!m.read && isMe) ? '<span class="dm-unread-badge" style="color:#eab308;font-size:0.6875rem;font-weight:800;line-height:1;margin-bottom:2px;" title="카카오톡 방식 미확인(1)">1</span>' : '';
    var statusLabel = isMe ? (m.read ? '<span class="dm-read-label" style="font-size:0.625rem;color:var(--ink-faint);line-height:1;margin-bottom:2px;">읽음</span>' : '') : '';
    var timeSpan = '<span class="dm-msg-time" style="font-size:0.6875rem;color:var(--ink-faint);line-height:1;white-space:nowrap;" title="전송: ' + T.esc(sentTimeDetail) + '">' + T.esc(timeStr) + '</span>';

    var detailId = 'dm_detail_' + (m.id || ('m_' + Math.random().toString(36).slice(2, 7)));

    if(isMe){
      return '<div class="dm-row me" style="display:flex;flex-direction:column;align-items:flex-end;margin:6px 0;">' +
        '<div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:5px;">' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end;gap:2px;">' +
            unreadBadge +
            statusLabel +
            timeSpan +
          '</div>' +
          '<div class="dm-msg me" onclick="window.toggleDmMsgDetail && window.toggleDmMsgDetail(\'' + detailId + '\')" style="cursor:pointer;max-width:72%;padding:9px 13px;border-radius:14px 14px 2px 14px;background:var(--brand-strong);color:#fff;font-size:0.875rem;line-height:1.45;word-break:break-word;box-shadow:0 1px 2px rgba(0,0,0,0.06);">' +
            T.esc(m.text) +
          '</div>' +
        '</div>' +
        '<div id="' + detailId + '" class="dm-msg-detail-box" style="display:none;margin-top:3px;font-size:0.6875rem;color:var(--ink-soft);background:var(--surface-2);padding:4px 8px;border-radius:6px;border:1px solid var(--rule);">' +
          '<span>전송 ' + T.esc(sentTimeDetail) + (deliveredAt ? ' · 도착 ' + T.esc(deliveredTimeDetail) : '') + ' · ' + (m.read ? ('읽음 ' + T.esc(readTimeDetail)) : '<b style="color:#eab308;">미확인 (1)</b>') + '</span>' +
        '</div>' +
      '</div>';
    } else {
      return '<div class="dm-row them" style="display:flex;flex-direction:column;align-items:flex-start;margin:6px 0;">' +
        '<div style="display:flex;justify-content:flex-start;align-items:flex-end;gap:5px;">' +
          '<div class="dm-msg them" onclick="window.toggleDmMsgDetail && window.toggleDmMsgDetail(\'' + detailId + '\')" style="cursor:pointer;max-width:72%;padding:9px 13px;border-radius:14px 14px 14px 2px;background:var(--surface-2);color:var(--ink);border:1px solid var(--rule);font-size:0.875rem;line-height:1.45;word-break:break-word;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
            T.esc(m.text) +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:2px;">' +
            timeSpan +
          '</div>' +
        '</div>' +
        '<div id="' + detailId + '" class="dm-msg-detail-box" style="display:none;margin-top:3px;font-size:0.6875rem;color:var(--ink-soft);background:var(--surface-2);padding:4px 8px;border-radius:6px;border:1px solid var(--rule);">' +
          '<span>수신/도착 ' + T.esc(deliveredTimeDetail) + ' · 전송 ' + T.esc(sentTimeDetail) + '</span>' +
        '</div>' +
      '</div>';
    }
  }

  async function loadDmMessagesFromDb(threadId, person){
    if(!global.sb || !threadId) return;
    try {
      var res = await global.sb.from('team_ping_replies')
        .select('*')
        .eq('ping_id', threadId)
        .order('created_at', { ascending: false })
        .limit(50);
      if(res && res.data){
        var myId = (global.state && global.state.user && global.state.user.id) || (global.state && global.state.profile && global.state.profile.id);
        // #TASK-ES-404: 최신 50건을 받아(위 desc + limit) 화면에는 오래된→최신 순으로 그린다. 예전엔 오름차순 + limit 이라 50건이 넘으면 가장 오래된 50건만 보여 새 메시지가 안 나왔다
        var latestRows = res.data.slice().reverse();
        person._thread = latestRows.map(function(r){
          var isMe = (r.sender_id === myId);
          var isRead = isMe ? (r.is_read === true || r.status === 'read') : true;
          var sentAt = r.sent_at || r.created_at || new Date().toISOString();
          var deliveredAt = r.delivered_at || (isMe ? null : sentAt);
          var readAt = isRead ? (r.read_at || deliveredAt || sentAt) : null;
          var status = isRead ? 'read' : (r.delivered_at ? 'delivered' : 'sent');
          return {
            id: r.id,
            from: (isMe ? 'me' : 'them'),
            text: r.message,
            time: r.created_at,
            createdAt: r.created_at,
            sentAt: sentAt,
            deliveredAt: deliveredAt,
            readAt: readAt,
            status: status,
            read: isRead
          };
        });
      }
    } catch(e){
      console.warn('[DM] DB 메시지 로드 오류:', e);
    }
  }

  function subscribeRealtimeDm(threadId, myId, person, body){
    if(T._activeDmChannel){
      try { T._activeDmChannel.unsubscribe(); } catch(e){}
      T._activeDmChannel = null;
    }
    if(!global.sb || !threadId) return;

    try {
      T._activeDmChannel = global.sb.channel('dm_room_' + threadId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_ping_replies',
          filter: 'ping_id=eq.' + threadId
        }, function(payload){
          var r = payload.new;
          if(!r) return;
          if(r.sender_id !== myId){
            K.markDmThreadAsRead(myId, r.sender_id);
            person.isUnread = false;
            person._thread = person._thread || [];
            // 상대방의 새 메시지가 수신되면 내가 보낸 이전 메시지는 읽음 처리
            person._thread.forEach(function(m){ if(m.from === 'me') m.read = true; });
            if(!person._thread.some(function(m){ return m.id === r.id; })){
              var newThemMsg = {
                id: r.id,
                from: 'them',
                text: r.message,
                time: r.created_at,
                createdAt: r.created_at,
                read: true
              };
              person._thread.push(newThemMsg);
              var msgsEl = document.getElementById('dmMsgs');
              if(msgsEl && document.body.contains(msgsEl)){
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = renderSingleDmMsg(newThemMsg);
                if(tempDiv.firstElementChild){
                  msgsEl.appendChild(tempDiv.firstElementChild);
                  msgsEl.scrollTop = msgsEl.scrollHeight;
                }
              }
            }
          }
        })
        .subscribe();
    } catch(err){
      console.warn('[DM] Realtime 구독 오류:', err);
    }
  }

  function renderCommDM(body){
    body = body || (typeof document !== 'undefined' ? (document.getElementById('commSubBody') || document.getElementById('commBody')) : null);
    if(!body) return;
    var teamMembers = T.getTeamMembersPool();
    var state = global.state || {};
    var myId = (state.user && state.user.id) || (state.profile && state.profile.id);
    var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;

    if(state.dmActiveId){
      var person = T.getDmPerson(state.dmActiveId);
      if(!person){ state.dmActiveId = null; return renderCommDM(body); }

      K.markDmThreadAsRead(myId, person.id);
      person.isUnread = false;

      var threadId = T.getDmThreadId(myId, person.id);
      person._thread = person._thread || [];

      // 실시간 Realtime 채널 구독 배선
      subscribeRealtimeDm(threadId, myId, person, body);

      // 서버 DB에서 실제 메시지 비동기 로드
      if(!person._loadedThreadFromDb && !isGuest){
        person._loadedThreadFromDb = true;
        loadDmMessagesFromDb(threadId, person).then(function(){
          var msgsEl = document.getElementById('dmMsgs');
          if(msgsEl && document.body.contains(msgsEl)){
            msgsEl.innerHTML = (person._thread && person._thread.length) ? person._thread.map(renderSingleDmMsg).join('') : '<div style="text-align:center;padding:24px 10px;font-size:.8125rem;color:var(--ink-faint);">아직 주고받은 메시지가 없습니다.<br>첫 대화를 건네보세요! 👋</div>';
            msgsEl.scrollTop = msgsEl.scrollHeight;
          }
        });
      }

      var subTitle = person.groupName ? ('👥 ' + T.esc(person.groupName) + (person.role ? ' · ' + T.esc(person.role) : '')) : (person.theme ? ('🤝 동반자 · ' + T.esc(person.theme)) : '아워골 회원');
      var isPersonReal = !T.isKnownAiCompanion(person) && (typeof window !== 'undefined' && typeof window.isValidRealUser === 'function' ? window.isValidRealUser(person.id) : (String(person.id).indexOf('guest') !== 0 && String(person.id).indexOf('comp_') !== 0 && String(person.id).indexOf('mem_') !== 0));
      var badgeTag = isPersonReal ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink);margin-left:6px;">실 사용자</span>' : '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);margin-left:6px;">🤖 AI 봇</span>';

      var isMyCompanion = (state.profile && state.profile.companions || []).some(function(c){
        return String(c.id || '').trim().toLowerCase() === String(person.id || '').trim().toLowerCase();
      });
      var canFollowBack = !isMyCompanion && !T.isKnownAiCompanion(person) && String(person.id).indexOf('mem_') !== 0;
      var followBackBannerHtml = canFollowBack ? (
        '<div id="dmFollowBackBanner" style="margin-bottom:12px;padding:10px 14px;background:var(--surface-2);border:1.5px solid var(--brand);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div style="font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:1.1rem;">🤝</span>' +
            '<span><b>' + T.esc(person.nickname || person.name) + '</b>님을 내 동반자로 추가하시겠습니까?</span>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnDmFollowBack" style="font-size:.75rem;padding:6px 12px;border-radius:8px;white-space:nowrap;font-weight:700;cursor:pointer;">+ 맞추가</button>' +
        '</div>'
      ) : '';

      var msgsHtml = (person._thread && person._thread.length) ? person._thread.map(renderSingleDmMsg).join('') : '<div style="text-align:center;padding:24px 10px;font-size:.8125rem;color:var(--ink-faint);">아직 주고받은 메시지가 없습니다.<br>첫 대화를 건네보세요! 👋</div>';

      body.innerHTML = '<span class="dm-back" id="dmBack" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:.875rem;font-weight:700;color:var(--brand-strong);margin-bottom:12px;">‹ 목록으로</span>' +
        followBackBannerHtml +
        '<div class="dm-thread-wrap">' +
          '<div class="dm-thread-head" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-bottom:1px solid var(--rule);">' +
            '<div class="feed-avatar" style="width:40px;height:40px;font-size:1.4rem;display:flex;align-items:center;justify-content:center;background:var(--surface-2);border-radius:50%;overflow:hidden;flex-shrink:0;">' + T.safeAvatarHtml(person.avatar, 40) + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);display:flex;align-items:center;">' +
                '<span>' + T.esc(person.nickname || person.name) + '</span>' +
                badgeTag +
              '</div>' +
              '<div class="faint" style="font-size:.75rem;margin-top:1px;">' + subTitle + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="dm-msgs" id="dmMsgs" style="padding:14px;min-height:240px;max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">' +
            msgsHtml +
          '</div>' +
          '<div class="dm-input-row" style="padding:10px 12px;background:var(--card);border-top:1px solid var(--rule);display:flex;gap:8px;">' +
            '<input id="dmInput" type="text" placeholder="' + (isGuest ? '로그인 후 메시지를 전송할 수 있습니다' : '메시지를 입력하세요 (Enter)') + '" style="flex:1;border:1px solid var(--rule);border-radius:10px;padding:8px 12px;font-size:.875rem;background:var(--surface-2);color:var(--ink);">' +
            '<button class="btn btn-primary btn-sm" id="dmSend" type="button" style="font-weight:700;border-radius:10px;padding:8px 16px;position:relative;z-index:5;touch-action:manipulation;cursor:pointer;flex-shrink:0;">전송</button>' +
          '</div>' +
        '</div>' +
        '<p class="faint" style="margin-top:10px;font-size:.75rem;">💡 실제 사용자 계정 간 서버 DB 원장 및 Realtime 채널로 실시간 송수신됩니다</p>';

      var backBtn = document.getElementById('dmBack');
      if(backBtn) backBtn.addEventListener('click', function(){
        if(T._activeDmChannel){ try{ T._activeDmChannel.unsubscribe(); }catch(e){} T._activeDmChannel = null; }
        state.dmActiveId = null;
        renderCommDM(body);
      });

      var btnFollow = document.getElementById('btnDmFollowBack');
      if(btnFollow){
        btnFollow.addEventListener('click', async function(){
          var comps = (state.profile.companions = state.profile.companions || []);
          var newComp = {
            id: person.id,
            nickname: person.nickname || person.name,
            name: person.name || person.nickname,
            avatar: person.avatar || '👤',
            intro: person.intro || '함께 목표를 실천하는 소중한 동반자',
            theme: person.theme || '전체',
            streak: person.streak || 1,
            level: person.level || 1,
            goals: person.goals || ['목표 실천 중']
          };
          comps.unshift(newComp);
          T._incomingDmRooms = T._incomingDmRooms.filter(function(x){ return x.id !== person.id; });
          try { if(global.saveProfile) await global.saveProfile(); } catch(e){}
          try { T.persistCompanions(comps); } catch(pErr){ console.warn('[동반자] persistCompanions 오류(무시):', pErr); }
          T.showToast(newComp.nickname + '님을 동반자로 추가했습니다! 🎉');
          renderCommDM(body);
        });
      }

      var msgsEl = document.getElementById('dmMsgs');
      if(msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;

      var send = async function(){
        if(isGuest){
          T.showGuestSoftAuthGate('1:1 DM 발송');
          return;
        }
        var input = document.getElementById('dmInput');
        if(!input) return;
        var text = input.value.trim();
        if(!text) return;

        var myName = (state.profile && (state.profile.displayName || state.profile.name)) || (state.user && state.user.email) || '나';
        var myAvatar = (state.profile && state.profile.avatar) || '🏃';
        var replyId = 'reply_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        var nowIso = new Date().toISOString();

        // 1. Optimistic UI 반영 (카카오톡 방식 노란색 1 및 전송 시각)
        var sentAt = nowIso;
        var deliveredAt = null; // #TASK-ES-366: 도착은 받는 기기가 서버에서 받아 갔을 때만(og_dm_mark) — 보내는 쪽이 지어내지 않는다
        var newMeMsg = {
          id: replyId,
          from: 'me',
          text: text,
          time: nowIso,
          createdAt: nowIso,
          sentAt: sentAt,
          deliveredAt: deliveredAt,
          readAt: null,
          status: 'sent',
          read: false
        };
        person._thread.push(newMeMsg);
        T._lastDmMessageMap[person.id] = { text: text, time: nowIso, from: 'me' };
        K.markDmRoomRead(myId, person.id);
        input.value = '';
        var msgsEl = document.getElementById('dmMsgs');
        if(msgsEl){
          var tempWrap = document.createElement('div');
          tempWrap.innerHTML = renderSingleDmMsg(newMeMsg);
          if(tempWrap.firstElementChild){
            msgsEl.appendChild(tempWrap.firstElementChild);
            msgsEl.scrollTop = msgsEl.scrollHeight;
          }
        }

        // 2. 헌법 제19조 의거 Supabase 서버 DB 원장 영속화
        if(global.sb){
          try {
            var threadId = T.getDmThreadId(myId, person.id);
            // 부모 team_pings 대화방 보장
            await global.sb.from('team_pings').upsert({
              id: threadId,
              group_id: 'dm_direct',
              sender_id: myId,
              sender_name: myName,
              sender_avatar: myAvatar,
              receiver_id: person.id,
              target_type: 'dm',
              target_id: person.id,
              target_title: '1:1 다이렉트 메시지',
              ping_type: 'dm',
              message: text,
              status: 'active'
            });

            // 1:1 메시지 레코드 저장 — #TASK-ES-366: 오류를 돌려받아 확인한다(상태 열이 없는 운영 표면 그 열만 빼고 다시 넣는다)
            var insRes = await global.OurgoalDmLedger.insertReply(global.sb, {
              id: replyId,
              ping_id: threadId,
              group_id: 'dm_direct',
              sender_id: myId,
              sender_name: myName,
              sender_role: 'member',
              sender_avatar: myAvatar,
              receiver_id: person.id,
              message: text,
              status: 'sent',
              sent_at: sentAt,
              created_at: nowIso
            });
            if(!insRes.ok){ newMeMsg.status = 'failed'; T.showToast('메시지가 서버에 저장되지 않았어요. 잠시 뒤 다시 보내 주세요.'); return; }
            T.showToast('메시지를 전송했습니다! 💬');

            // [#TASK-ES-168] 상대방에게 Web Push 즉시 비동기 발송 (백그라운드/앱종료 수신 보장)
            // #TASK-ES-397: 로그인 세션 Bearer 를 붙여 보낸다(예전엔 머리글 없이 나가 운영에서 401 — 푸시 0건). 토큰이 없으면 보내지 않는다
            try {
              var dmLedger = global.OurgoalDmLedger;
              Promise.resolve(dmLedger && dmLedger.getAuthToken ? dmLedger.getAuthToken() : null).then(function(pushToken){
                if(!pushToken) return null;
                return fetch('/api/push-dispatch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + pushToken },
                  body: JSON.stringify({
                    targetUserId: person.id,
                    title: '💬 ' + myName + '님의 메시지',
                    body: text,
                    url: '/#comm',
                    tag: 'dm-' + threadId
                  })
                });
              }).catch(function(pErr){
                console.warn('[DM] push dispatch fetch error (graceful):', pErr);
              });
            } catch(fetchErr){}
          } catch(err){
            console.warn('[DM] Supabase 영속화 실패:', err); T.showToast('메시지가 서버에 저장되지 않았어요. 잠시 뒤 다시 보내 주세요.');
          }
        }
      };

      var sendBtn = document.getElementById('dmSend');
      if(sendBtn){
        sendBtn.addEventListener('click', function(e){
          if(e){ e.stopPropagation(); e.preventDefault(); }
          send();
        });
        sendBtn.addEventListener('touchend', function(e){
          if(e){ e.stopPropagation(); e.preventDefault(); }
          send();
        });
      }
      var inputEl = document.getElementById('dmInput');
      if(inputEl){
        // [#TASK-ES-172 / #TASK-ES-279] 상민님 지시 [28]: 타 유저 클릭 시 키보드 자동 팝업 방지 (텍스트창 터치 시에만 오픈)
        if(typeof document !== 'undefined' && document.activeElement === inputEl){
          try { inputEl.blur(); } catch(bErr){}
        }
        inputEl.addEventListener('keydown', function(e){
          if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            send();
          }
        });
      }
    } else {
      if(T._activeDmChannel){ try{ T._activeDmChannel.unsubscribe(); }catch(e){} T._activeDmChannel = null; }

      // 수신된 대화방 목록 비동기 프리로드 (첫 진입 시)
      if(!isGuest && T._incomingDmLoadedForUser !== myId){
        K.loadIncomingDmRooms(myId).then(function(rooms){
          if(rooms && rooms.length > 0 && document.body.contains(body) && !state.dmActiveId && state.commSubTab === 'dm'){
            renderCommDM(body);
          }
        });
      }

      var teamMembersChipsHtml = teamMembers.length > 0 ? teamMembers.map(function(m){
        return '<div class="dm-team-chip" data-openteamdm="' + T.esc(m.id) + '" role="button" tabindex="0" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;width:72px;padding:8px 4px;background:var(--card);border:1px solid var(--rule);border-radius:12px;cursor:pointer;text-align:center;transition:transform 0.15s ease;">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:var(--surface-2);border:1.5px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.25rem;margin-bottom:4px;overflow:hidden;flex-shrink:0;">' + T.safeAvatarHtml(m.avatar, 38) + '</div>' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--ink);width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(m.name) + '</div>' +
          '<span class="faint" style="font-size:.625rem;line-height:1.2;margin-top:2px;">' + (m.role || '팀원') + '</span>' +
        '</div>';
      }).join('') : '<div style="padding:10px 8px;font-size:.8125rem;color:var(--ink-soft);display:flex;align-items:center;gap:6px;">' +
        '<span>🤝</span><span>아직 연결된 실제 팀 동료가 없습니다. 팀 목표를 함께하거나 동료를 초대하면 이곳에 표시됩니다.</span>' +
      '</div>';

      var allDmList = [];
      // 1. 수신 대화 요청 (내 companions에 아직 없는 상대방)
      T._incomingDmRooms.forEach(function(inc){
        allDmList.push(inc);
      });
      // 2. 내 동반자 목록
      var companions = (state.profile && state.profile.companions) || [];
      companions.forEach(function(c){
        if(!allDmList.some(function(x){ return String(x.id || '').trim().toLowerCase() === String(c.id || '').trim().toLowerCase(); })){
          allDmList.push(c);
        }
      });
      // 3. 팀원 목록 (중복 제외)
      teamMembers.forEach(function(m){
        if(!allDmList.some(function(x){ return String(x.id || '').trim().toLowerCase() === String(m.id || '').trim().toLowerCase(); })){
          allDmList.push(m);
        }
      });

      var dmListHtml = allDmList.length > 0 ? allDmList.map(function(p){
        var lastMsgObj = T._lastDmMessageMap[p.id];
        var last = (lastMsgObj && lastMsgObj.text) ? lastMsgObj.text : ((p._thread && p._thread.length) ? p._thread[p._thread.length - 1].text : (p.lastMsg || p.intro || '새로운 대화를 시작해보세요!'));
        var isUnread = !!T._unreadPeerMap[p.id] || p.isIncoming;
        var badgeText = p.isIncoming ? '📩 새 대화 요청' : (p.isAiBot ? 'AI 봇' : (p.groupName ? p.groupName : (p.theme || '동반자')));
        var itemBorder = isUnread ? 'border:1.5px solid var(--brand);background:var(--surface-2);' : 'border:1px solid var(--rule);background:var(--card);';
        var pillStyle = isUnread ? 'font-size:.6875rem;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;font-weight:700;' : 'font-size:.6875rem;';
        var unreadDot = isUnread ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-left:6px;vertical-align:middle;"></span>' : '';

        return '<div class="dm-list-item" data-open="' + T.esc(p.id) + '" style="cursor:pointer;padding:10px 12px;display:flex;align-items:center;gap:12px;' + itemBorder + 'border-radius:12px;margin-bottom:8px;">' +
          '<div class="feed-avatar" style="width:42px;height:42px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex:0 0 auto;overflow:hidden;">' + T.safeAvatarHtml(p.avatar, 42) + '</div>' +
          '<div class="dm-preview" style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
              '<b style="font-size:.875rem;color:var(--ink);display:flex;align-items:center;">' + T.esc(p.nickname || p.name) + unreadDot + '</b>' +
              '<span class="dday-pill" style="' + pillStyle + '">' + T.esc(badgeText) + '</span>' +
            '</div>' +
            '<span style="font-size:.8125rem;color:var(--ink-soft);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(last) + '</span>' +
          '</div>' +
        '</div>';
      }).join('') : '<div style="text-align:center;padding:32px 14px;color:var(--ink-faint);font-size:.875rem;">주고받은 1:1 대화 내역이 없습니다.<br>팀원이나 동반자에게 첫 인사를 건네보세요! 👋</div>';

      body.innerHTML = '<div class="card" style="margin-bottom:14px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="font-weight:700;font-size:.875rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
              '<span>👥</span><span>내 팀 동료에게 바로 DM 보내기</span>' +
            '</div>' +
            '<span class="faint" style="font-size:.75rem;">원클릭 선택</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;">' +
            teamMembersChipsHtml +
          '</div>' +
        '</div>' +
        '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span>💬 대화 목록</span>' +
          '<span class="faint" style="font-size:.75rem;">' + allDmList.length + '개의 대화</span>' +
        '</div>' +
        '<div class="dm-list-wrap">' +
          dmListHtml +
        '</div>';

      body.querySelectorAll('[data-openteamdm]').forEach(function(el){
        el.addEventListener('click', function(){
          state.dmActiveId = el.dataset.openteamdm;
          renderCommDM(body);
        });
      });

      body.querySelectorAll('[data-open]').forEach(function(el){
        el.addEventListener('click', function(){
          state.dmActiveId = el.dataset.open;
          renderCommDM(body);
        });
      });
    }
  }

  K.formatDmTime = formatDmTime;
  K.formatDmDetailTime = formatDmDetailTime;
  K.toggleDmMsgDetail = toggleDmMsgDetail;
  K.renderSingleDmMsg = renderSingleDmMsg;
  K.loadDmMessagesFromDb = loadDmMessagesFromDb;
  K.subscribeRealtimeDm = subscribeRealtimeDm;
  K.renderCommDM = renderCommDM;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
