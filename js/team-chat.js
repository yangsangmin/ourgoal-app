/**
 * OurGoal Community Cell: 팀 톡방 — 팀 목표 팀원 대화 모달·찌르기 뒤 자동 답장 (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 58~286줄).
 *   openTeamChatModal · handlePingSentAutoReply
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

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
      { sender: '소연 (디자인)', text: '체크인 완료했습니다. 팀장님 피드백 감사해요 ✨', time: '오후 02:20', isMe: false }
    ];

    var myName = (global.state && global.state.profile && (global.state.profile.displayName || global.state.profile.name)) || '나';
    var myId = (global.state && global.state.profile && global.state.profile.id) || 'guest';
    var myAvatar = (global.state && global.state.profile && global.state.profile.avatar) || '🏃';

    function renderChatMessagesHtml(list){
      if(!list || !list.length){
        return '<div style="text-align:center;padding:30px 10px;font-size:.8125rem;color:var(--ink-faint);">팀 대화방에 첫 메시지를 남겨보세요! 👋</div>';
      }
      return list.map(function(m){
        var isMe = !!m.isMe || (m.sender_id === myId);
        return '<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';margin-bottom:10px;">' +
          '<div style="font-size:.75rem;color:var(--ink-soft);margin-bottom:2px;display:flex;align-items:center;gap:4px;">' +
            (m.avatar ? '<span>' + T.esc(m.avatar) + '</span>' : '') +
            '<b>' + T.esc(m.sender || m.sender_name || '팀원') + '</b>' +
          '</div>' +
          '<div style="max-width:82%;padding:8px 12px;border-radius:12px;font-size:.875rem;line-height:1.45;background:'+(isMe?'var(--brand-strong)':'var(--card2)')+';color:'+(isMe?'#fff':'var(--ink)')+';border:'+(isMe?'none':'1px solid var(--rule)')+';word-break:break-word;">' +
            T.esc(m.text || m.message || '') +
          '</div>' +
          '<span class="faint" style="font-size:.6875rem;margin-top:2px;">' + T.esc(m.time || (m.created_at ? (global.fmtTime ? global.fmtTime(m.created_at) : '최근') : '방금')) + '</span>' +
        '</div>';
      }).join('');
    }

    function renderChatBody(){
      var msgsHtml = renderChatMessagesHtml(gs.chatMessages);

      var quickChips = [
        '오늘 목표 달성 완료했어요! 🎉',
        '다들 조금만 더 힘내봐요! 항상 응원해요 💪',
        '혹시 이 부분 어떻게 해결하셨나요? 🤔',
        '내일 아침에 다 같이 인증해봐요! 🔥'
      ];

      var chipsHtml = quickChips.map(function(qc, idx){
        return '<button type="button" class="btn btn-ghost btn-sm tg-chat-quick" data-qcidx="'+idx+'" style="font-size:.75rem;padding:3px 8px;border-radius:6px;border:1px solid var(--rule);background:var(--card);white-space:nowrap;color:var(--ink-soft);flex:0 0 auto;">' +
          T.esc(qc) +
        '</button>';
      }).join('');

      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:1.2rem;">💬</span>' +
          '<h3 style="margin:0;font-size:1rem;">\'' + T.esc(g.name) + '\' 팀 대화방</h3>' +
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
      var teamChatChannel = null;
      var closeBtn = sheet.querySelector('#btnCloseTeamChat');
      if(closeBtn){
        closeBtn.addEventListener('click', function(){
          if(teamChatChannel && global.sb && global.sb.removeChannel){
            try { teamChatChannel.unsubscribe(); global.sb.removeChannel(teamChatChannel); } catch(e){}
          }
          global.closeModal();
        });
      }

      var box = sheet.querySelector('#teamChatMsgBox');
      if(box) box.scrollTop = box.scrollHeight;

      // 1. Supabase 서버에서 실제 팀 채팅 메시지 로드 (#TASK-ES-169)
      if(global.sb){
        global.sb.from('team_pings')
          .select('id, sender_id, sender_name, sender_avatar, message, created_at')
          .eq('group_id', gid)
          .eq('target_type', 'team_chat')
          .order('created_at', { ascending: false })
          .limit(100)
          .then(function(res){
            if(res && res.data && res.data.length){
              // #TASK-ES-404: 최신 100건을 받아(위 desc + limit) 오래된→최신 순으로 그린다. 예전엔 오름차순 + limit 이라 100건이 넘으면 새 메시지가 안 나왔다
              gs.chatMessages = res.data.slice().reverse().map(function(r){
                return {
                  id: r.id,
                  sender: r.sender_name || '팀원',
                  sender_id: r.sender_id,
                  avatar: r.sender_avatar || '👤',
                  text: r.message,
                  time: global.fmtTime ? global.fmtTime(r.created_at) : '최근',
                  isMe: r.sender_id === myId
                };
              });
              var curBox = document.getElementById('teamChatMsgBox');
              if(curBox){
                curBox.innerHTML = renderChatMessagesHtml(gs.chatMessages);
                curBox.scrollTop = curBox.scrollHeight;
              }
            }
          }).catch(function(){});

        // 2. 실시간 Realtime 채널 배선 (양방향 실시간 동기화)
        try {
          teamChatChannel = global.sb.channel('team_chat_room_' + gid)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'team_pings',
              filter: 'group_id=eq.' + gid
            }, function(payload){
              var r = payload.new;
              if(!r || r.target_type !== 'team_chat') return;
              if(r.sender_id === myId) return; // 자가 발송 제외

              var newMsg = {
                id: r.id,
                sender: r.sender_name || '팀원',
                sender_id: r.sender_id,
                avatar: r.sender_avatar || '👤',
                text: r.message,
                time: global.fmtTime ? global.fmtTime(r.created_at) : '방금',
                isMe: false
              };
              gs.chatMessages = gs.chatMessages || [];
              if(!gs.chatMessages.some(function(m){ return m.id === r.id; })){
                gs.chatMessages.push(newMsg);
                var curBox = document.getElementById('teamChatMsgBox');
                if(curBox){
                  curBox.innerHTML = renderChatMessagesHtml(gs.chatMessages);
                  curBox.scrollTop = curBox.scrollHeight;
                }
              }
            })
            .subscribe();
        } catch(subErr){
          console.warn('[팀 톡] Realtime 채널 오류:', subErr);
        }
      }

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
          T.showToast('메시지를 입력해주세요');
          return;
        }

        var msgId = 'tchat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        var nowStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        var msgObj = { id: msgId, sender: myName, sender_id: myId, avatar: myAvatar, text: text, time: nowStr, isMe: true };
        gs.chatMessages.push(msgObj);
        inp.value = '';

        var curBox = sheet.querySelector('#teamChatMsgBox');
        if(curBox){
          curBox.innerHTML = renderChatMessagesHtml(gs.chatMessages);
          curBox.scrollTop = curBox.scrollHeight;
        }

        if(global.saveProfile) await global.saveProfile();
        if(global.triggerHaptic) global.triggerHaptic(10);

        // 3. Supabase team_pings 실서버 영구 저장 (헌법 제13조 실 사용자 연동 준수)
        if(global.sb){
          try {
            await global.sb.from('team_pings').insert({
              id: msgId,
              group_id: gid,
              sender_id: myId,
              sender_name: myName,
              sender_avatar: myAvatar,
              receiver_id: '',
              target_type: 'team_chat',
              target_id: gid,
              target_title: g.name,
              ping_type: 'team_chat',
              message: text,
              status: 'active',
              created_at: new Date().toISOString()
            });
          } catch(err){
            console.warn('[팀 톡] 메시지 DB 저장 실패(오프라인 유지):', err);
          }
        }
      }

      var sendBtn = sheet.querySelector('#btnSendTeamChat');
      if(sendBtn) sendBtn.addEventListener('click', doSend);
      var inp = sheet.querySelector('#teamChatInput');
      if(inp) inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') doSend(); });
    });
  }

  /* 찌르기 발송 시 실제 팀 알림 등록 (#TASK-ES-169 가짜 setTimeout 자동답장 제거) */
  function handlePingSentAutoReply(ping, gid){
    T.showToast('💬 팀원들에게 응원 찌르기를 보냈어요! 팀원이 확인하면 1:1 대화로 이어집니다 🔥');
  }

  K.openTeamChatModal = openTeamChatModal;
  K.handlePingSentAutoReply = handlePingSentAutoReply;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
