/**
 * OurGoal Story Card Send (소통 탭 — 갓생 카드 보내기 창)
 *
 * #TASK-ES-423 (인라인 스크립트 세포화 1차): index.html 인라인 IIFE 의 MZ 갓생 카드 보내기 두 묶음을 동작 그대로 옮겼다.
 *   openSelectCompanionForStoryModal(이전 전 14971~15033줄)
 *   openSelectTeamForStoryModal(이전 전 15035~15105줄)
 * 갓생 카드 창(openMzShareCardModal — 아직 index.html)의 「동반자에게 보내기」(#btnShareStoryToCompanion)·「팀 단체방에 인증」(#btnShareStoryToTeam)이 부른다.
 * 묶음을 통째로(구획 주석 포함) 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ============ MZ 갓생 카드: 동반자 1:1 DM 전송 모달 ============ */
  function openSelectCompanionForStoryModal(compList, streak, userName, quote, canvasEl){
    var listHtml = compList.map(function(c){
      var cName = c.nickname || c.name || '동반자';
      var cAvatar = c.avatar || '👤';
      return '<div class="user-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-radius:10px;border:1px solid var(--rule);margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:1.6rem;">' + cAvatar + '</span>' +
          '<div>' +
            '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">' + L.escapeHtml(cName) + '</div>' +
            '<div class="faint" style="font-size:.75rem;">나의 아워골 동반자</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" data-sendcompstory="' + L.escapeHtml(c.id || cName) + '" data-compname="' + L.escapeHtml(cName) + '" type="button" style="font-size:.8125rem;padding:5px 12px;font-weight:700;">전송</button>' +
      '</div>';
    }).join('');

    L.openModal(
      '<h3>🤝 동반자에게 갓생 카드 보내기</h3>' +
      '<p class="faint" style="margin:-6px 0 14px;font-size:.8125rem;">나의 ' + streak + '일 연속 몰입 갓생 카드를 보낼 동반자를 선택하세요.</p>' +
      '<div style="max-height:45vh;overflow-y:auto;margin-bottom:14px;">' + listHtml + '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-block" id="closeCompStoryModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeCompStoryModalBtn').onclick = L.closeModal;
        sheet.querySelectorAll('[data-sendcompstory]').forEach(function(btn){
          btn.onclick = async function(){
            var compId = btn.dataset.sendcompstory;
            var compName = btn.dataset.compname;
            L.triggerHaptic(20);
            try {
              var dataUrl = canvasEl ? canvasEl.toDataURL('image/png') : null;
              var myId = (L.state.profile && L.state.profile.id) || 'guest';
              var myName = (L.state.profile && (L.state.profile.displayName || L.state.profile.name)) || userName || '나';
              var pingPayload = {
                id: 'ping_story_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                group_id: 'dm_' + [myId, compId].sort().join('_'),
                sender_id: myId,
                sender_name: myName,
                receiver_id: compId,
                target_type: 'story_card',
                target_id: 'story_' + Date.now(),
                target_title: streak + '일 연속 몰입 갓생 카드',
                ping_type: 'story_card',
                message: '✨ [' + myName + '님의 ' + streak + '일 연속 몰입 갓생 카드]\n"' + quote + '"',
                status: 'active',
                created_at: new Date().toISOString()
              };
              if(window.sb){
                await window.sb.from('team_pings').insert(pingPayload).catch(function(e){ console.warn(e); });
              }
              L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 25);
              L.toast('"' + compName + '"님에게 갓생 카드를 성공적으로 보냈어요! 💌');
              L.closeModal();
            } catch(e){
              L.toast('전송 중 오류가 발생했습니다.');
            }
          };
        });
      }
    );
  }

  /* ============ MZ 갓생 카드: 팀 단체방 인증 전송 모달 ============ */
  function openSelectTeamForStoryModal(myTeams, streak, userName, quote, canvasEl){
    var listHtml = myTeams.map(function(tg){
      return '<div class="team-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-radius:10px;border:1px solid var(--rule);margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">' +
          '<span style="font-size:1.6rem;">' + tg.icon + '</span>' +
          '<div style="min-width:0;">' +
            '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + L.escapeHtml(tg.name) + '</div>' +
            '<div class="faint" style="font-size:.75rem;">팀원 ' + (tg.members || 1) + '명 참여 중</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" data-sendteamstory="' + L.escapeHtml(tg.id) + '" data-teamname="' + L.escapeHtml(tg.name) + '" type="button" style="font-size:.8125rem;padding:5px 12px;font-weight:700;flex:0 0 auto;">인증하기</button>' +
      '</div>';
    }).join('');

    L.openModal(
      '<h3>👥 팀 단체방에 갓생 카드 인증</h3>' +
      '<p class="faint" style="margin:-6px 0 14px;font-size:.8125rem;">오늘의 ' + streak + '일 연속 몰입 카드로 인증할 팀 단체방을 선택하세요.</p>' +
      '<div style="max-height:45vh;overflow-y:auto;margin-bottom:14px;">' + listHtml + '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-block" id="closeTeamStoryModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeTeamStoryModalBtn').onclick = L.closeModal;
        sheet.querySelectorAll('[data-sendteamstory]').forEach(function(btn){
          btn.onclick = async function(){
            var teamId = btn.dataset.sendteamstory;
            var teamName = btn.dataset.teamname;
            L.triggerHaptic(25);
            try {
              var myId = (L.state.profile && L.state.profile.id) || 'guest';
              var myName = (L.state.profile && (L.state.profile.displayName || L.state.profile.name)) || userName || '팀원';
              var pingPayload = {
                id: 'ping_team_story_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                group_id: teamId,
                sender_id: myId,
                sender_name: myName,
                receiver_id: null,
                target_type: 'team_group',
                target_id: teamId,
                target_title: teamName,
                ping_type: 'story_card_share',
                message: '🌟 [팀원 인증] ' + myName + '님이 ' + streak + '일 연속 몰입 갓생 카드를 공유했습니다!\n"' + quote + '"',
                status: 'active',
                created_at: new Date().toISOString()
              };
              if(window.sb){
                await window.sb.from('team_pings').insert(pingPayload).catch(function(e){ console.warn(e); });
              }
              // 로컬 팀 채팅방 낙관적 반영
              if(typeof L.groupState === 'function'){
                var gs = L.groupState(teamId);
                gs.chatMessages = gs.chatMessages || [];
                gs.chatMessages.push({
                  sender: myName,
                  text: '🌟 ' + streak + '일 연속 몰입 갓생 카드를 공유했습니다!\n"' + quote + '"',
                  time: '방금',
                  isMe: true
                });
              }
              L.burstConfetti(window.innerWidth/2, window.innerHeight/3, 30);
              L.toast('"' + teamName + '" 팀 단체방에 인증 카드를 공유했어요! 👥');
              L.closeModal();
            } catch(e){
              L.toast('인증 공유 중 오류가 발생했습니다.');
            }
          };
        });
      }
    );
  }

  K.openSelectCompanionForStoryModal = openSelectCompanionForStoryModal;
  K.openSelectTeamForStoryModal = openSelectTeamForStoryModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
