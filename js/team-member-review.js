/**
 * OurGoal Team Cell: 팀장의 팀원 점검 모달 — 확인 도장 선택·팀원 달성도 상세 점검 바텀시트 (#TASK-ES-402 · 팀 세포 쪼개기 3차)
 *
 * js/team-leader-check.js(975줄)에서 동작 그대로 옮겼다(이전 전 351~612줄).
 *   openLeaderStampSelectModal · openMemberProgressDetailModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamLeaderCheck.openLeaderStampSelectModal · openMemberProgressDetailModal 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-leader-check.js 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태를 getter(대입하는 상태는 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 목표 세포 키트의 leaderCheck 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var KIT = global.OurgoalTeamGoalsKit = global.OurgoalTeamGoalsKit || {};
  var K = KIT.leaderCheck = KIT.leaderCheck || {};
  var T = K.scope = K.scope || {};

  function openLeaderStampSelectModal(gid, memberName, deps){
    var gs = deps.getGroupState(gid);
    gs.leaderStamps = gs.leaderStamps || {};
    var currentStamp = gs.leaderStamps[memberName] || null;

    var stampsHtml = Object.keys(T.LEADER_STAMPS).map(function(key){
      var s = T.LEADER_STAMPS[key];
      var isSelected = currentStamp && currentStamp.type === key;
      return '<button class="btn btn-ghost" data-selectstamp="'+key+'" type="button" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:1.5px solid '+(isSelected?'var(--brand-strong)':'var(--rule)')+';background:'+(isSelected?'var(--card2)':'var(--card)')+';text-align:left;width:100%;">' +
        '<span style="font-size:1.6rem;">'+s.icon+'</span>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">'+s.label+'</div>' +
          '<div class="faint" style="font-size:.75rem;margin-top:2px;">팀원의 오늘 기록에 격려와 인정을 전합니다</div>' +
        '</div>' +
        (isSelected ? '<span style="color:var(--brand-strong);font-weight:700;">✓ 선택됨</span>' : '') +
      '</button>';
    }).join('');

    deps.openModal(
      '<h3>👑 확인 도장 찍기</h3>' +
      '<p class="faint" style="font-size:.875rem;margin:4px 0 14px;"><b>'+T.esc(memberName)+'</b>님의 오늘 체크인 기록을 확인하고 도장을 찍어주세요.</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">' + stampsHtml + '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="closeStampModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeStampModalBtn').addEventListener('click', deps.closeModal);
        sheet.querySelectorAll('[data-selectstamp]').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var stampKey = btn.dataset.selectstamp;
            var stampObj = T.LEADER_STAMPS[stampKey];
            gs.leaderStamps[memberName] = {
              type: stampKey,
              label: stampObj.label,
              icon: stampObj.icon,
              stampedAt: new Date().toISOString()
            };
            await deps.saveProfile();
            if(window.sb){
              try {
                var p = (typeof deps.getProfile === 'function') ? deps.getProfile() : null;
                var myId = (p && p.id) || 'guest';
                var myName = (p && p.displayName) || '팀장';
                window.sb.from('team_pings').insert({
                  id: 'stamp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                  group_id: gid,
                  sender_id: myId,
                  sender_name: myName,
                  receiver_id: memberName,
                  target_type: 'leader_action',
                  target_id: gid,
                  target_title: memberName,
                  ping_type: 'stamp',
                  message: JSON.stringify(gs.leaderStamps[memberName]),
                  status: 'active',
                  created_at: new Date().toISOString()
                }).then(function(){});
              } catch(e){}
            }
            if(deps.haptic) deps.haptic('success');
            deps.toast('"' + memberName + '"님에게 ' + stampObj.icon + ' ' + stampObj.label + ' 도장을 찍었어요!');
            deps.closeModal();
            if(deps.onRefresh) deps.onRefresh();
          });
        });
      }
    );
  }

  function openMemberProgressDetailModal(gid, memberName, deps){
    var progressData = T.calcGroupMembersProgress(gid, deps.mockGroups, deps.getGroupState, deps.getProfile, deps.getLevelGoals);
    var m = progressData.members.find(function(item){ return item.name === memberName; });
    if(!m) return;
    var gs = deps.getGroupState(gid);
    var canManage = deps.canManage(gid);

    var stampInfo = m.stamp ?
      '<div style="display:inline-flex;align-items:center;gap:6px;background:var(--card2);padding:4px 10px;border-radius:999px;border:1px solid var(--rule);font-size:.8125rem;font-weight:700;color:var(--ink);">' +
        '<span>'+m.stamp.icon+'</span> <span>팀장 확인 도장: '+T.esc(m.stamp.label)+'</span>' +
      '</div>' :
      '<span class="faint" style="font-size:.8125rem;">아직 팀장 확인 도장이 없습니다</span>';

    var photoHtml = m.photoUrl ?
      '<div style="margin:10px 0;border-radius:12px;overflow:hidden;border:1px solid var(--rule);max-height:220px;">' +
        '<img src="'+m.photoUrl+'" alt="인증사진" style="width:100%;height:auto;display:block;object-fit:cover;">' +
      '</div>' : '';

    var noteHtml = m.note ?
      '<div style="background:var(--card2);padding:10px 12px;border-radius:10px;border:1px solid var(--rule);font-size:.875rem;color:var(--ink);margin:8px 0;line-height:1.5;">' +
        '💬 "' + T.esc(m.note) + '"' +
      '</div>' : '<p class="faint" style="font-size:.8125rem;margin:6px 0;">작성된 인증 일지가 없습니다.</p>';

    var feedbackListHtml = (m.feedback && m.feedback.length) ?
      m.feedback.map(function(fb){
        return '<div style="background:var(--card2);border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:.8125rem;">' +
          '<div style="display:flex;justify-content:space-between;color:var(--ink-soft);font-size:.75rem;margin-bottom:2px;">' +
            '<b>👑 팀장 피드백</b> <span>'+new Date(fb.createdAt).toLocaleDateString()+'</span>' +
          '</div>' +
          '<div style="color:var(--ink);">'+T.esc(fb.message)+'</div>' +
        '</div>';
      }).join('') : '<p class="faint" style="font-size:.8125rem;">아직 팀장 피드백이 없습니다.</p>';

    var manageActionsHtml = canManage ?
      '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--rule);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<b style="font-size:.875rem;color:var(--ink);">👑 팀장 체크 액션</b>' +
          '<button class="btn btn-primary btn-sm" id="btnStampInDetail" type="button" style="font-size:.8125rem;padding:4px 10px;">' +
            (m.stamp ? '도장 변경' : '확인 도장 찍기') +
          '</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;">' +
          '<input id="leaderFbInput" type="text" placeholder="팀원에게 격려와 피드백을 남겨보세요" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);font-size:.875rem;">' +
          '<button class="btn btn-ghost btn-sm" id="sendLeaderFbBtn" type="button" style="flex:0 0 auto;font-weight:700;">전송</button>' +
        '</div>' +
      '</div>' : '';

    var isSelf = m.isMe || (deps.getProfile && deps.getProfile() && (deps.getProfile().displayName === memberName || deps.getProfile().id === m.id));

    var memberInteractionHtml = !isSelf ?
      '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--rule);">' +
        '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;">🤝 팀원 소통 & 응원 액션</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary btn-sm" id="btnNudgeMemberInDetail" type="button" style="flex:1;font-weight:700;padding:8px 10px;font-size:.8125rem;">👏 1초 응원 찌르기</button>' +
          '<button class="btn btn-ghost btn-sm" id="btnDmMemberInDetail" type="button" style="flex:1;font-weight:700;border:1.5px solid var(--brand);color:var(--brand);padding:8px 10px;font-size:.8125rem;">✉️ 1:1 DM 보내기</button>' +
          '<button class="btn btn-ghost btn-sm" id="btnAddCompanionInDetail" type="button" style="font-weight:700;border:1px solid var(--rule);padding:8px 10px;font-size:.8125rem;">+ 동반자</button>' +
        '</div>' +
      '</div>' : '';

    deps.openModal(
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:2rem;">'+m.avatar+'</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<h3 style="margin:0;font-size:1.125rem;">'+T.esc(m.name)+(m.levelGroup ? ' <span class="faint" style="font-size:.8125rem;font-weight:normal;">('+T.esc(m.levelGroup)+')</span>' : '')+'</h3>' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' +
            '<span class="streak-pill" style="font-size:.6875rem;">🔥 '+m.streak+'일 연속</span>' +
            '<span class="faint" style="font-size:.8125rem;">목표 진행률 '+m.progressPct+'%</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:12px;">' + stampInfo + '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<b style="font-size:.875rem;color:var(--ink-soft);">📸 오늘 인증 및 일지</b>' +
        photoHtml +
        noteHtml +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<b style="font-size:.875rem;color:var(--ink-soft);">💬 팀장 피드백 내역</b>' +
        '<div style="margin-top:6px;">' + feedbackListHtml + '</div>' +
      '</div>' +
      manageActionsHtml +
      memberInteractionHtml +
      '<div class="modal-actions" style="margin-top:14px;">' +
        '<button class="btn btn-block btn-ghost" id="closeDetailModalBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeDetailModalBtn').addEventListener('click', deps.closeModal);
        var stampBtn = sheet.querySelector('#btnStampInDetail');
        if(stampBtn){
          stampBtn.addEventListener('click', function(){
            deps.closeModal();
            openLeaderStampSelectModal(gid, memberName, deps);
          });
        }
        var sendFbBtn = sheet.querySelector('#sendLeaderFbBtn');
        if(sendFbBtn){
          sendFbBtn.addEventListener('click', async function(){
            var inp = sheet.querySelector('#leaderFbInput');
            var msg = (inp && inp.value.trim()) || '';
            if(!msg) return;
            gs.leaderFeedback = gs.leaderFeedback || {};
            gs.leaderFeedback[memberName] = gs.leaderFeedback[memberName] || [];
            gs.leaderFeedback[memberName].push({
              message: msg,
              createdAt: new Date().toISOString()
            });
            await deps.saveProfile();
            deps.toast('"' + memberName + '"님에게 피드백을 전달했어요!');
            deps.closeModal();
            if(deps.onRefresh) deps.onRefresh();
          });
        }

        // 👏 1초 응원 찌르기 핸들러 (#TASK-TEAM-MEMBER-INTERACTION)
        var nudgeBtn = sheet.querySelector('#btnNudgeMemberInDetail');
        if(nudgeBtn){
          nudgeBtn.addEventListener('click', async function(){
            var myProfile = deps.getProfile ? deps.getProfile() : null;
            var myName = (myProfile && (myProfile.displayName || myProfile.name)) || '팀원';
            var myId = (myProfile && myProfile.id) || 'guest';
            gs.nudges = gs.nudges || {};
            gs.nudges[memberName] = { time: '방금', text: '👏 ' + myName + '님이 보낸 힘찬 응원!' };
            if(window.sb){
              try {
                await window.sb.from('team_pings').insert({
                  id: 'nudge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                  group_id: gid,
                  sender_id: myId,
                  sender_name: myName,
                  receiver_id: memberName,
                  target_type: 'member_nudge',
                  target_id: gid,
                  target_title: memberName,
                  ping_type: 'nudge',
                  message: '👏 ' + myName + '님이 ' + memberName + '님을 힘차게 응원했습니다! 오늘도 파이팅!',
                  status: 'active',
                  created_at: new Date().toISOString()
                });
              } catch(e){}
            }
            if(deps.haptic) deps.haptic('success');
            deps.toast('"' + memberName + '"님에게 힘찬 응원 찌르기를 보냈어요! 👏');
            deps.closeModal();
            if(deps.onRefresh) deps.onRefresh();
          });
        }

        // ✉️ 1:1 DM 보내기 핸들러 (#TASK-TEAM-MEMBER-INTERACTION)
        var dmBtn = sheet.querySelector('#btnDmMemberInDetail');
        if(dmBtn){
          dmBtn.addEventListener('click', function(){
            deps.closeModal();
            if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.renderCommDM){
              var state = (global.state || {});
              state.commSubTab = 'dm';
              if(typeof global.setTab === 'function') global.setTab('comm');
              if(typeof global.renderCommScreen === 'function') global.renderCommScreen();
              setTimeout(function(){
                var personObj = { id: m.id || ('user_' + memberName), name: memberName, avatar: m.avatar || '👤' };
                window.OurgoalTeamInviteComm.renderCommDM(personObj);
              }, 100);
            } else {
              deps.toast('"' + memberName + '"님과의 1:1 대화방을 열었습니다.');
            }
          });
        }

        // + 동반자 추가 핸들러 (#TASK-TEAM-MEMBER-INTERACTION)
        var compBtn = sheet.querySelector('#btnAddCompanionInDetail');
        if(compBtn){
          compBtn.addEventListener('click', async function(){
            var p = deps.getProfile ? deps.getProfile() : null;
            if(p){
              p.settings = p.settings || {};
              p.settings.companions = p.settings.companions || [];
              if(!p.settings.companions.some(function(c){ return (c.name === memberName || c.id === m.id); })){
                p.settings.companions.push({
                  id: m.id || ('comp_' + Date.now()),
                  name: memberName,
                  avatar: m.avatar || '👤',
                  addedAt: new Date().toISOString()
                });
                await deps.saveProfile();
                deps.toast('"' + memberName + '"님이 나의 동반자로 추가되었어요! 🤝');
              } else {
                deps.toast('이미 등록된 동반자입니다.');
              }
            }
          });
        }
      }
    );
  }

  K.openLeaderStampSelectModal = openLeaderStampSelectModal;
  K.openMemberProgressDetailModal = openMemberProgressDetailModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
