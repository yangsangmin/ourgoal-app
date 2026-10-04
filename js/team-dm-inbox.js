/**
 * OurGoal Community Cell: DM 수신함 — 읽음 표시·안읽음 배지·받은 대화방 목록·수신 실시간 구독·30초 스마트 폴링 (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 667~899, 902~924줄).
 *   getDmReadMap · markDmRoomRead · markDmThreadAsRead · updateDmUnreadBadge · getDmUnreadStatus · loadIncomingDmRooms · initIncomingDmListener · startSmartDmPolling
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  function getDmReadMap(myId){
    if(!myId || String(myId).indexOf('guest') === 0) return {};
    try {
      var raw = localStorage.getItem(T.DM_READ_PREFIX + myId);
      return raw ? JSON.parse(raw) : {};
    } catch(e){ return {}; }
  }

  function markDmRoomRead(myId, peerId){
    if(!myId || !peerId || String(myId).indexOf('guest') === 0) return;
    try {
      var pid = String(peerId).trim();
      var map = getDmReadMap(myId);
      map[pid] = Date.now();
      localStorage.setItem(T.DM_READ_PREFIX + myId, JSON.stringify(map));
      delete T._unreadPeerMap[pid];
      var stillUnread = Object.keys(T._unreadPeerMap).some(function(k){ return !!T._unreadPeerMap[k]; });
      updateDmUnreadBadge(stillUnread);
    } catch(e){}
  }

  async function markDmThreadAsRead(myId, peerId){
    markDmRoomRead(myId, peerId);
    if(!global.sb || !myId || !peerId || String(myId).indexOf('guest') === 0) return;
    try {
      // #TASK-ES-366: 받는 사람이 대화를 열면 부른다(전에는 부르는 곳이 없었다). 서버 함수 og_dm_mark → 없으면 직접 update
      var markRes = await global.OurgoalDmLedger.markThreadRead(global.sb, myId, T.getDmThreadId(myId, peerId));
      if(!markRes.ok) console.warn('[DM] 읽음 서버 반영 안 됨:', markRes.error);
      return markRes;
    } catch(err){
      console.warn('[DM] markDmThreadAsRead 서버 업데이트 오류(무시):', err);
    }
  }

  function updateDmUnreadBadge(hasUnread){
    T._hasUnreadDm = !!hasUnread;
    try {
      var commNavBadge = document.getElementById('commNavBadge');
      if(commNavBadge){
        commNavBadge.style.display = T._hasUnreadDm ? 'block' : 'none';
      }
      var dmSubtabBadge = document.getElementById('dmSubtabBadge');
      if(dmSubtabBadge){
        dmSubtabBadge.style.display = T._hasUnreadDm ? 'inline-block' : 'none';
      }
    } catch(e){}
  }

  function getDmUnreadStatus(){
    return T._hasUnreadDm;
  }

  async function loadIncomingDmRooms(myId){
    if(!global.sb || !myId || String(myId).indexOf('guest') === 0) return [];
    try {
      var res = await global.sb.from('team_ping_replies')
        .select('id, ping_id, sender_id, sender_name, sender_avatar, receiver_id, message, created_at')
        .eq('receiver_id', myId)
        .order('created_at', { ascending: false })
        .limit(100);
      if(res && res.data){
        var state = global.state || {};
        var comps = (state.profile && state.profile.companions) || [];
        var readMap = getDmReadMap(myId);
        var seenSenders = {};
        var rooms = [];

        res.data.forEach(function(r){
          if(!r.sender_id || r.sender_id === myId) return;
          var senderId = String(r.sender_id).trim();
          if(r.ping_id && !seenSenders[senderId] && global.OurgoalDmLedger) global.OurgoalDmLedger.markThreadDelivered(global.sb, r.ping_id); // #TASK-ES-366 받는 기기가 받아 감 = 도착

          // 최신 메시지 매핑 (최신 순이므로 첫 번째 발견된 메시지가 가장 최신)
          if(!T._lastDmMessageMap[senderId]){
            T._lastDmMessageMap[senderId] = {
              text: r.message,
              time: r.created_at,
              from: 'them'
            };
          }

          var msgTime = new Date(r.created_at).getTime();
          var lastRead = readMap[senderId] || 0;
          if(msgTime > lastRead){
            T._unreadPeerMap[senderId] = true;
          }

          if(seenSenders[senderId]) return;
          seenSenders[senderId] = true;

          // 동반자 목록에 존재하는지 확인
          var targetComp = comps.find(function(c){
            return String(c.id || '').trim().toLowerCase() === senderId.toLowerCase();
          });

          if(targetComp){
            // 기존 동반자인 경우 최신 메시지 및 미확인 상태 갱신
            targetComp.lastMsg = r.message;
            targetComp.lastTime = r.created_at;
            targetComp.isUnread = !!T._unreadPeerMap[senderId];
            if(!targetComp._thread || targetComp._thread.length === 0){
              targetComp._thread = [{
                id: r.id,
                from: 'them',
                text: r.message,
                time: global.fmtTime ? global.fmtTime(r.created_at) : '최근'
              }];
            }
          } else {
            // 동반자가 아닌 신규 대화 요청
            var roomItem = {
              id: senderId,
              name: r.sender_name || '동반자',
              nickname: r.sender_name || '동반자',
              avatar: r.sender_avatar || '👤',
              intro: r.message,
              isIncoming: true,
              lastMsg: r.message,
              lastTime: r.created_at,
              isUnread: !!T._unreadPeerMap[senderId],
              theme: '새 대화 요청',
              _thread: [{
                id: r.id,
                from: 'them',
                text: r.message,
                time: global.fmtTime ? global.fmtTime(r.created_at) : '최근'
              }]
            };
            rooms.push(roomItem);
            T._userCache[senderId] = roomItem;
          }
        });

        T._incomingDmRooms = rooms;
        T._incomingDmLoadedForUser = myId;

        // 미확인 DM 유무 종합 판정
        var hasUnread = Object.keys(T._unreadPeerMap).some(function(k){ return !!T._unreadPeerMap[k]; });
        updateDmUnreadBadge(hasUnread);

        return rooms;
      }
    } catch(err){
      console.warn('[DM] incoming dm rooms 로드 오류:', err);
    }
    return [];
  }

  function initIncomingDmListener(myId){
    if(!global.sb || !myId || String(myId).indexOf('guest') === 0) return;
    if(T._incomingDmChannel){
      try { T._incomingDmChannel.unsubscribe(); } catch(e){}
      try { if(global.sb.removeChannel) global.sb.removeChannel(T._incomingDmChannel); } catch(e){}
      T._incomingDmChannel = null;
    }
    try {
      T._incomingDmChannel = global.sb.channel('incoming_dm_global_' + myId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_ping_replies',
          filter: 'receiver_id=eq.' + myId
        }, function(payload){
          var r = payload.new;
          if(!r || r.sender_id === myId) return;
          var senderId = String(r.sender_id).trim();

          T._lastDmMessageMap[senderId] = {
            text: r.message,
            time: r.created_at || new Date().toISOString(),
            from: 'them'
          };

          var state = global.state || {};
          var isInThisDm = (state.activeTab === 'comm' && state.commSubTab === 'dm' && state.dmActiveId === senderId);

          if(!isInThisDm){
            T._unreadPeerMap[senderId] = true;
            var senderTitle = r.sender_name || '동반자';
            T.showToast('💬 ' + senderTitle + '님의 새 메시지: ' + (r.message || ''));
            updateDmUnreadBadge(true);
            if(global.OurgoalNotifyEngine && typeof global.OurgoalNotifyEngine.dispatchGlobalNotification === 'function'){
              global.OurgoalNotifyEngine.dispatchGlobalNotification({
                type: 'dm',
                title: '💬 ' + senderTitle,
                body: r.message || '',
                senderName: senderTitle,
                targetTab: 'comm',
                targetDmId: senderId,
                icon: '💬'
              });
            }
          } else {
            markDmThreadAsRead(myId, senderId);
            // [#TASK-ES-168] 활성 채팅방 DOM 실시간 즉각 추가
            var msgsEl = document.getElementById('dmMsgs');
            if(msgsEl && document.body.contains(msgsEl)){
              var existing = msgsEl.querySelector('[data-msgid="' + r.id + '"]');
              if(!existing){
                var div = document.createElement('div');
                div.className = 'dm-msg them';
                div.dataset.msgid = r.id;
                div.textContent = r.message;
                msgsEl.appendChild(div);
                msgsEl.scrollTop = msgsEl.scrollHeight;
              }
            }
          }

          // 수신 목록 및 뷰 갱신
          loadIncomingDmRooms(myId).then(function(){
            if(state.activeTab === 'comm' && state.commSubTab === 'dm' && !state.dmActiveId){
              var subBody = document.getElementById('commSubBody');
              if(subBody && document.body.contains(subBody)){
                K.renderCommDM(subBody);
              }
            }
            if(typeof global.updateTopNotifBadge === 'function'){
              global.updateTopNotifBadge();
            }
          });
        })
        .subscribe();

      // 최초 1회 incoming 대화 목록 로드 & 미확인 확인
      loadIncomingDmRooms(myId);

      // [#TASK-ES-168] 헌법 제13조 제5항 2호 준수: 30초 스마트 폴링(Smart Polling) 백업 루프 가동
      startSmartDmPolling(myId);
    } catch(err){
      console.warn('[DM] 전역 Realtime 리스너 설정 오류:', err);
    }
  }

  function startSmartDmPolling(myId){
    if(!myId || String(myId).indexOf('guest') === 0) return;
    if(T._smartDmPollingTimer){
      clearInterval(T._smartDmPollingTimer);
      T._smartDmPollingTimer = null;
    }
    T._smartDmPollingTimer = setInterval(function(){
      var state = global.state || {};
      var curId = (state.profile && state.profile.id) || myId;
      if(!curId || String(curId).indexOf('guest') === 0) return;
      loadIncomingDmRooms(curId).then(function(rooms){
        if(state.activeTab === 'comm' && state.commSubTab === 'dm' && !state.dmActiveId){
          var subBody = document.getElementById('commSubBody');
          if(subBody && document.body.contains(subBody)){
            K.renderCommDM(subBody);
          }
        }
        if(typeof global.updateTopNotifBadge === 'function'){
          global.updateTopNotifBadge();
        }
      }).catch(function(){});
    }, 30000);
  }

  K.getDmReadMap = getDmReadMap;
  K.markDmRoomRead = markDmRoomRead;
  K.markDmThreadAsRead = markDmThreadAsRead;
  K.updateDmUnreadBadge = updateDmUnreadBadge;
  K.getDmUnreadStatus = getDmUnreadStatus;
  K.loadIncomingDmRooms = loadIncomingDmRooms;
  K.initIncomingDmListener = initIncomingDmListener;
  K.startSmartDmPolling = startSmartDmPolling;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
