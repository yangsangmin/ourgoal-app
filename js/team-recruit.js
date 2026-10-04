/**
 * OurGoal Community Cell: 팀 초대·영입 모달 (#TASK-ES-382 · 팀 세포 쪼개기 1차)
 *
 * js/team-invite-comm.js(이전 전 4,105줄)에서 "사람을 팀 목표로 데려오는" 두 모달을 동작 그대로 옮겼다.
 *   openTeamInviteModal(gid, groupsPool) — 팀장이 팀 화면에서 동반자 원탭 초대·닉네임 검색 영입·외부 공유(이전 전 31~430줄)
 *   openScoutToTeamModal(targetUser)     — 피드에서 본 유저를 내가 이끄는 팀 목표로 영입(이전 전 3452~3579줄)
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.openTeamInviteModal / openScoutToTeamModal 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태(esc·showToast·ensureDefaultCompanions …)를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  /* ------------------------------------------------------------
   * 1. 팀 목표 팀원 초대 모달 (동반자 원탭 초대 + 지인 닉네임 검색·영입 + 외부 공유)
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
    var inviteUrl = domain + '/share?type=group&id=' + encodeURIComponent(g.id) + '&title=' + encodeURIComponent(g.name);
    var inviteMsg = '[아워골] \'' + g.name + '\' 모임에 초대합니다!\n함께 달리고 서로 응원하며 완주해요 🔥\n초대 링크: ' + inviteUrl;

    if(!global.openModal) return;

    var state = global.state || {};
    var companions = T.ensureDefaultCompanions();

    function isMemberOfGroup(person){
      if(!person) return false;
      var pId = String(person.id || '').trim().toLowerCase();
      var pName = String(person.nickname || person.name || '').trim().toLowerCase();
      if(Array.isArray(g.roster) && g.roster.some(function(r){
        return (r.n && String(r.n).trim().toLowerCase() === pName) || (r.id && String(r.id).trim().toLowerCase() === pId);
      })) return true;
      if(Array.isArray(g.membersList) && g.membersList.some(function(m){
        return (m.id && String(m.id).trim().toLowerCase() === pId) || (m.name && String(m.name).trim().toLowerCase() === pName);
      })) return true;
      var gs = (typeof global.groupState === 'function') ? global.groupState(g.id) : {};
      if(Array.isArray(gs.membersList) && gs.membersList.some(function(m){
        return (m.id && String(m.id).trim().toLowerCase() === pId) || (m.name && String(m.name).trim().toLowerCase() === pName);
      })) return true;
      return false;
    }

    function addMemberToTeam(group, userObj){
      group.members = (group.members || 0) + 1;
      group.roster = group.roster || [];
      var uName = userObj.nickname || userObj.name || '동반자';
      if(!group.roster.some(function(r){ return (r.n && r.n === uName) || (r.id && r.id === userObj.id); })){
        group.roster.push({ n: uName, id: userObj.id, c: 1 });
      }
      group.membersList = group.membersList || [];
      if(!group.membersList.some(function(m){ return m.id === userObj.id; })){
        group.membersList.push({ id: userObj.id, name: uName, avatar: userObj.avatar || '👤', role: 'member' });
      }
      var gs = (typeof global.groupState === 'function') ? global.groupState(group.id) : {};
      gs.membersList = gs.membersList || [];
      if(!gs.membersList.some(function(m){ return m.id === userObj.id; })){
        gs.membersList.push({ id: userObj.id, name: uName, avatar: userObj.avatar || '👤', role: 'member' });
      }
      var myName = (state.profile && (state.profile.nickname || state.profile.name)) || '팀장';
      gs.chatMessages = gs.chatMessages || [];
      gs.chatMessages.push({
        sender: '시스템',
        text: '🎉 ' + myName + '님이 ' + uName + '님을 새 팀원으로 초대했습니다!',
        time: '방금',
        isMe: false
      });
    }

    var companionsHtml = '';
    if(!companions.length){
      companionsHtml = '<div style="padding:16px;text-align:center;color:var(--ink-soft);font-size:.8125rem;background:var(--surface-2);border-radius:10px;">아직 등록된 목표 동반자가 없어요. 아래에서 지인을 검색해보세요!</div>';
    } else {
      companionsHtml = companions.map(function(c){
        var isMem = isMemberOfGroup(c);
        var isAi = T.isKnownAiCompanion(c);
        var badgeHtml = isAi ?
          '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 동반자</span>' :
          '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>';
        var actionBtn = isMem ?
          '<span class="faint" style="font-size:.75rem;padding:5px 9px;background:var(--surface-2);border-radius:8px;font-weight:700;color:var(--ink-soft);border:1px solid var(--rule);flex-shrink:0;">✓ 참여 중</span>' :
          '<button type="button" class="btn btn-primary btn-xs btn-invite-comp" data-compid="' + T.esc(c.id) + '" data-compname="' + T.esc(c.nickname || c.name) + '" data-compavatar="' + T.esc(c.avatar || '👤') + '" style="font-size:.75rem;padding:5px 12px;border-radius:8px;font-weight:700;flex-shrink:0;">+ 팀 초대</button>';

        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;margin-bottom:8px;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">' +
            '<div style="width:38px;height:38px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.3rem;overflow:hidden;flex-shrink:0;border:1.5px solid var(--brand);">' +
              T.safeAvatarHtml(c.avatar, 38) +
            '</div>' +
            '<div style="min-width:0;flex:1;">' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                '<span style="font-weight:700;font-size:.875rem;color:var(--ink);">' + T.esc(c.nickname || c.name) + '</span>' +
                badgeHtml +
              '</div>' +
              '<div class="faint" style="font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(c.intro || c.bio || '목표를 향해 함께 달리는 동반자') + '</div>' +
            '</div>' +
          '</div>' +
          actionBtn +
        '</div>';
      }).join('');
    }

    var modalHtml = 
      '<h3>👥 \'' + T.esc(g.name) + '\' 팀원 초대하기</h3>' +
      '<p class="faint" style="margin:-6px 0 12px;font-size:.8125rem;">내 동반자를 원탭으로 초대하거나 지인을 검색해 바로 팀원으로 영입하세요.</p>' +
      '<div style="display:flex;background:var(--surface-2);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--rule);gap:4px;">' +
        '<button type="button" id="tabTeamInviteInner" class="btn btn-sm" style="flex:1;border-radius:8px;font-weight:700;font-size:.8125rem;border:none;background:var(--brand);color:#fff;padding:8px 6px;cursor:pointer;">👥 아워골 친구·지인 초대</button>' +
        '<button type="button" id="tabTeamInviteOuter" class="btn btn-sm btn-ghost" style="flex:1;border-radius:8px;font-weight:700;font-size:.8125rem;border:none;background:transparent;color:var(--ink-soft);padding:8px 6px;cursor:pointer;">🔗 외부 공유 (카톡·문자·링크)</button>' +
      '</div>' +

      // 1번 뷰: 아워골 내부 초대 (동반자 목록 + 지인 검색)
      '<div id="viewTeamInviteInner">' +
        // 섹션 A: 내 동반자 빠른 초대
        '<div style="margin-bottom:16px;">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">' +
            '<span>🤝 내 목표 동반자 (' + companions.length + '명)</span>' +
            '<span class="faint" style="font-size:.72rem;">원탭으로 팀원에 추가</span>' +
          '</div>' +
          '<div style="max-height:180px;overflow-y:auto;padding-right:2px;">' +
            companionsHtml +
          '</div>' +
        '</div>' +

        // 섹션 B: 아워골 가입 지인 실시간 검색 & 영입
        '<div style="border-top:1px solid var(--rule);padding-top:14px;margin-bottom:14px;">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:4px;display:flex;align-items:center;gap:6px;">' +
            '<span>🔍 아워골 가입 지인 실시간 검색</span>' +
          '</div>' +
          '<p class="faint" style="margin:0 0 8px;font-size:.75rem;">동반자가 아닌 지인도 닉네임으로 바로 찾아 팀원으로 영입할 수 있어요.</p>' +
          '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
            '<input type="text" id="teamInviteSearchInput" placeholder="지인 닉네임 검색 (예: 러너, 도현, 민지, 수아)" style="flex:1;border:1px solid var(--rule);border-radius:10px;padding:8px 12px;font-size:.875rem;background:var(--surface-2);color:var(--ink);">' +
            '<button class="btn btn-primary btn-sm" id="teamInviteSearchBtn" type="button" style="font-weight:700;padding:0 14px;border-radius:10px;white-space:nowrap;">검색</button>' +
          '</div>' +
          '<div id="teamInviteSearchResults"></div>' +
        '</div>' +
      '</div>' +

      // 2번 뷰: 외부 공유 (카톡·문자·링크)
      '<div id="viewTeamInviteOuter" style="display:none;">' +
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:14px;">' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--ink-soft);margin-bottom:6px;">초대 메시지 미리보기</div>' +
          '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;white-space:pre-line;background:var(--surface-2);padding:10px;border-radius:8px;border:1px solid var(--rule);">' + T.esc(inviteMsg) + '</div>' +
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
      '</div>' +

      '<div class="modal-actions">' +
        '<button class="btn btn-block btn-ghost" id="closeInviteModalBtn" type="button">닫기</button>' +
      '</div>';

    global.openModal(modalHtml, function(sheet){
      var closeBtn = sheet.querySelector('#closeInviteModalBtn');
      if(closeBtn){
        closeBtn.addEventListener('click', function(){
          global.closeModal();
          if(global.renderTeamGoalsScreen) global.renderTeamGoalsScreen();
        });
      }

      // 탭 전환 배선
      var tabInner = sheet.querySelector('#tabTeamInviteInner');
      var tabOuter = sheet.querySelector('#tabTeamInviteOuter');
      var viewInner = sheet.querySelector('#viewTeamInviteInner');
      var viewOuter = sheet.querySelector('#viewTeamInviteOuter');

      if(tabInner && tabOuter && viewInner && viewOuter){
        tabInner.addEventListener('click', function(){
          tabInner.style.background = 'var(--brand)';
          tabInner.style.color = '#fff';
          tabOuter.style.background = 'transparent';
          tabOuter.style.color = 'var(--ink-soft)';
          viewInner.style.display = 'block';
          viewOuter.style.display = 'none';
        });
        tabOuter.addEventListener('click', function(){
          tabOuter.style.background = 'var(--brand)';
          tabOuter.style.color = '#fff';
          tabInner.style.background = 'transparent';
          tabInner.style.color = 'var(--ink-soft)';
          viewInner.style.display = 'none';
          viewOuter.style.display = 'block';
        });
      }

      // 동반자 팀 초대 버튼 배선
      sheet.querySelectorAll('.btn-invite-comp').forEach(function(btn){
        btn.addEventListener('click', function(){
          var compId = btn.dataset.compid;
          var compName = btn.dataset.compname;
          var compAvatar = btn.dataset.compavatar || '👤';

          addMemberToTeam(g, { id: compId, name: compName, nickname: compName, avatar: compAvatar, role: 'member' });

          btn.outerHTML = '<span class="faint" style="font-size:.75rem;padding:5px 9px;background:var(--surface-2);border-radius:8px;font-weight:700;color:var(--ink-soft);border:1px solid var(--rule);flex-shrink:0;">✓ 참여 중</span>';

          T.showToast('🎉 ' + compName + '님을 \'' + g.name + '\' 팀원으로 초대했습니다!');
          if(global.renderTeamGoalsScreen) global.renderTeamGoalsScreen();
        });
      });

      // 지인 닉네임 실시간 검색 및 팀원 영입 배선
      var sInput = sheet.querySelector('#teamInviteSearchInput');
      var sBtn = sheet.querySelector('#teamInviteSearchBtn');
      var sResults = sheet.querySelector('#teamInviteSearchResults');

      var doSearch = async function(){
        if(!sInput || !sResults) return;
        var q = (sInput.value || '').trim();
        if(!q){
          sResults.innerHTML = '<div style="padding:12px;font-size:.8125rem;color:var(--ink-soft);text-align:center;">검색할 지인의 닉네임을 입력해주세요.</div>';
          return;
        }
        sResults.innerHTML = '<div style="padding:12px;font-size:.8125rem;color:var(--ink-soft);text-align:center;">회원 데이터베이스에서 지인을 검색하고 있습니다... 🔍</div>';

        var matched = [];

        // 1순위: /api/track Vercel 서버리스 파이프라인
        try {
          var apiRes = await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'search_users', query: q })
          });
          if(apiRes.ok){
            var apiData = await apiRes.json();
            if(apiData && apiData.ok && Array.isArray(apiData.users) && apiData.users.length){
              matched = apiData.users.map(function(u){
                var obj = {
                  id: u.id,
                  nickname: u.nickname || u.name,
                  name: u.name || u.nickname,
                  avatar: u.avatar || '👤',
                  intro: u.intro || '함께 실천하는 아워골 회원',
                  isAiBot: false
                };
                T._userCache[u.id] = obj;
                return obj;
              });
            }
          }
        } catch(e){}

        // 2순위: Supabase RPC 파이프라인
        if(!matched.length && global.sb){
          try {
            var rpcRes = await global.sb.rpc('search_users_by_nickname', { p_query: q });
            if(rpcRes && Array.isArray(rpcRes.data) && rpcRes.data.length){
              matched = rpcRes.data.map(function(u){
                var obj = {
                  id: u.id,
                  nickname: u.nickname,
                  name: u.nickname,
                  avatar: u.avatar_url || '👤',
                  intro: u.bio || '함께 실천하는 아워골 회원',
                  isAiBot: false
                };
                T._userCache[u.id] = obj;
                return obj;
              });
            }
          } catch(e){}
        }

        // 3순위: 로컬/오프라인 가입자 풀 폴백
        if(!matched.length){
          var localKnownUsers = [
            { id: 'user-runner-sm', nickname: '러너상민', name: '러너상민', avatar: '🏃', intro: '풀코스 마라톤 완주 도전 중 🔥' },
            { id: 'user-early-reader', nickname: '새벽독서가', name: '새벽독서가', avatar: '📚', intro: '미라클 모닝 100일차 성공!' },
            { id: 'user-clean-coder', nickname: '클린코더', name: '클린코더', avatar: '💻', intro: '매일 1커밋 실천하는 개발자' },
            { id: 'user-minji-runner', nickname: '새벽러너_민지', name: '새벽러너_민지', avatar: '🏃‍♀️', intro: '하루 5km 꾸준히 달립니다' },
            { id: 'user-dohyun-dev', nickname: '코드장인_도현', name: '코드장인_도현', avatar: '🧑‍💻', intro: '성장하는 풀스택 엔지니어' },
            { id: 'user-sua-god', nickname: '갓생사는_수아', name: '갓생사는_수아', avatar: '✨', intro: '오늘도 알찬 하루를 위해!' }
          ];
          matched = localKnownUsers.filter(function(u){
            return u.nickname.toLowerCase().indexOf(q.toLowerCase()) !== -1 || u.name.toLowerCase().indexOf(q.toLowerCase()) !== -1;
          });
        }

        if(!matched.length){
          sResults.innerHTML = '<div style="padding:14px 10px;text-align:center;font-size:.8125rem;color:var(--ink-soft);background:var(--surface-2);border-radius:10px;">“' + T.esc(q) + '” 닉네임을 가진 회원을 찾지 못했습니다.<br>정확한 닉네임으로 다시 검색해보세요.</div>';
          return;
        }

        var resHtml = '<div style="background:var(--surface-2);border-radius:12px;padding:10px;border:1px solid var(--rule);max-height:200px;overflow-y:auto;">' +
          '<div style="font-size:.75rem;font-weight:700;color:var(--brand-strong);margin-bottom:6px;">검색 결과 (' + matched.length + '명)</div>' +
          matched.map(function(u){
            var isMem = isMemberOfGroup(u);
            var actionBtn = isMem ?
              '<span class="faint" style="font-size:.75rem;padding:4px 8px;background:var(--card);border-radius:8px;font-weight:700;color:var(--ink-soft);border:1px solid var(--rule);flex-shrink:0;">✓ 참여 중</span>' :
              '<button type="button" class="btn btn-primary btn-xs btn-recruit-user" data-uid="' + T.esc(u.id) + '" data-uname="' + T.esc(u.nickname || u.name) + '" data-uavatar="' + T.esc(u.avatar || '👤') + '" data-uintro="' + T.esc(u.intro || '') + '" style="font-size:.75rem;padding:4px 10px;border-radius:8px;font-weight:700;flex-shrink:0;">+ 팀원으로 영입</button>';

            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--card);border:1px solid var(--rule);border-radius:10px;margin-bottom:6px;gap:8px;">' +
              '<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">' +
                '<div style="width:34px;height:34px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;overflow:hidden;flex-shrink:0;">' +
                  T.safeAvatarHtml(u.avatar, 34) +
                '</div>' +
                '<div style="min-width:0;flex:1;">' +
                  '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                    '<div style="font-weight:700;font-size:.8125rem;color:var(--ink);">' + (typeof formatDisplayNameWithTag === 'function' ? formatDisplayNameWithTag(u.nickname || u.name) : T.esc(u.nickname || u.name)) + '</div>' +
                    (T.isKnownAiCompanion(u) ? '<span class="dday-pill badge-ai" style="font-size:.625rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 예시</span>' : '<span class="dday-pill" style="font-size:.625rem;background:var(--surface-2);color:var(--brand-strong);">' + T.esc(u.theme || '실천') + '</span>') +
                  '</div>' +
                  '<div class="faint" style="font-size:.72rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + T.esc(u.intro || '아워골 회원') + '</div>' +
                '</div>' +
              '</div>' +
              actionBtn +
            '</div>';
          }).join('') +
        '</div>';

        sResults.innerHTML = resHtml;

        sResults.querySelectorAll('.btn-recruit-user').forEach(function(btn){
          btn.addEventListener('click', async function(){
            var uid = btn.dataset.uid;
            var uname = btn.dataset.uname;
            var uavatar = btn.dataset.uavatar;
            var uintro = btn.dataset.uintro;

            var targetUser = {
              id: uid,
              nickname: uname,
              name: uname,
              avatar: uavatar,
              intro: uintro,
              level: 1,
              streak: 0,
              theme: '동반자',
              isAiBot: T.isKnownAiCompanion({ id: uid, nickname: uname }),
              createdAt: new Date().toISOString()
            };

            // 1. 팀원으로 영입
            addMemberToTeam(g, targetUser);

            // 2. 동시에 내 동반자 목록으로도 스마트 자동 연동
            var comps = T.ensureDefaultCompanions();
            if(!comps.some(function(x){ return String(x.id).toLowerCase() === String(uid).toLowerCase(); })){
              comps.unshift(targetUser);
              try { T.persistCompanions(); } catch(e){}
              try { if(global.saveProfile) await global.saveProfile(); } catch(e){}
            }

            // 3. UI 갱신
            btn.outerHTML = '<span class="faint" style="font-size:.75rem;padding:4px 8px;background:var(--card);border-radius:8px;font-weight:700;color:var(--ink-soft);border:1px solid var(--rule);flex-shrink:0;">✓ 참여 중</span>';

            T.showToast('🎉 ' + uname + '님을 팀원으로 영입하고 동반자로 자동 등록했습니다!');
            if(global.renderTeamGoalsScreen) global.renderTeamGoalsScreen();
          });
        });
      };

      if(sBtn) sBtn.addEventListener('click', doSearch);
      if(sInput) sInput.addEventListener('keydown', function(e){ if(e.key === 'Enter') doSearch(); });

      // 카카오톡 초대
      sheet.querySelector('#btnInviteKakao').addEventListener('click', function(){
        if(window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()){
          try {
            window.Kakao.Share.sendDefault({
              objectType: 'text',
              text: inviteMsg,
              link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl }
            });
            T.showToast('카카오톡 공유창이 열렸어요');
            return;
          } catch(e){}
        }
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(inviteMsg).then(function(){
            T.showToast('초대 메시지가 복사되었어요! 카카오톡에 붙여넣어주세요.');
          });
        } else {
          T.showToast('초대 링크: ' + inviteUrl);
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
            T.showToast('초대 링크를 복사했어요! 원하는 곳에 붙여넣으세요.');
          });
        } else {
          T.showToast('초대 링크: ' + inviteUrl);
        }
      });
    });
  }

  /* ------------------------------------------------------------
   * 9. 피드 유저 팀 목표 영입/초대 모달 (openScoutToTeamModal)
   * #TASK-COMM-FEED-SOCIAL-BRIDGE
   * ------------------------------------------------------------ */
  function openScoutToTeamModal(targetUser){
    if(!targetUser) return;
    var state = global.state || {};
    var userName = targetUser.nickname || targetUser.name || '동료 러너';
    var mockGroups = (typeof global.MOCK_GROUPS !== 'undefined') ? global.MOCK_GROUPS : [];
    var canManageFn = global.canManageTeamGoals || function(gid){
      var g = mockGroups.find(function(x){ return x.id === gid; });
      return g && g.ownerId && state.profile && (g.ownerId === state.profile.id || g.ownerId === 'user_me');
    };
    var myLeadTeams = mockGroups.filter(function(g){ return canManageFn(g.id); });

    var modalHtml = '<h3>👑 팀 목표로 영입하기</h3>' +
      '<div style="text-align:center;padding:12px 0 10px;">' +
        '<div style="width:60px;height:60px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 8px;">' +
          T.safeAvatarHtml(targetUser.avatar, 60) +
        '</div>' +
        '<b style="font-size:1rem;color:var(--ink);">' + T.esc(userName) + '님을 팀원으로 영입할까요?</b>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:2px;">내가 운영 중인 팀 목표로 초대장을 발송합니다.</div>' +
      '</div>' +
      '<div style="margin:10px 0 14px;">' +
        (myLeadTeams.length === 0 ?
          '<div style="padding:14px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);text-align:center;">' +
            '<p style="font-size:.875rem;color:var(--ink);margin:0 0 8px;font-weight:600;">내가 모임장(팀장)인 팀 목표가 없습니다.</p>' +
            '<p class="faint" style="font-size:.8125rem;margin:0 0 10px;">팀 목표 탭에서 먼저 새 팀을 개설해보세요!</p>' +
            '<button class="btn btn-primary btn-sm" id="btnGoCreateTeamGoal" type="button">팀 목표 개설하러 가기 ➔</button>' +
          '</div>' :
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:8px;">영입할 팀 목표 선택</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;">' +
            myLeadTeams.map(function(t){
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);">' +
                '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
                  '<span style="font-size:1.3rem;">' + (t.icon || '🎯') + '</span>' +
                  '<div>' +
                    '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">' + T.esc(t.title || t.name) + '</div>' +
                    '<div class="faint" style="font-size:.75rem;">' + T.esc(t.topic || '목표') + '</div>' +
                  '</div>' +
                '</div>' +
                '<button class="btn btn-primary btn-sm" data-scoutteamid="' + T.esc(t.id) + '" type="button" style="font-weight:700;padding:4px 10px;font-size:.8125rem;">영입 초대 ✨</button>' +
              '</div>';
            }).join('') +
          '</div>'
        ) +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-block" id="btnCloseScoutModal" type="button">닫기</button>' +
      '</div>';

    if(global.openModal){
      global.openModal(modalHtml, function(sheet){
        var closeBtn = sheet.querySelector('#btnCloseScoutModal');
        if(closeBtn) closeBtn.onclick = global.closeModal;

        var goCreateBtn = sheet.querySelector('#btnGoCreateTeamGoal');
        if(goCreateBtn){
          goCreateBtn.onclick = function(){
            if(global.closeModal) global.closeModal();
            state.activeTab = 'goals';
            state.goalsSubTab = 'team';
            if(typeof global.renderGoalsScreen === 'function') global.renderGoalsScreen();
          };
        }

        sheet.querySelectorAll('[data-scoutteamid]').forEach(function(btn){
          btn.onclick = async function(){
            var tid = btn.getAttribute('data-scoutteamid');
            var team = myLeadTeams.find(function(t){ return String(t.id) === String(tid); });
            if(!team) return;

            btn.disabled = true;
            btn.textContent = '✓ 영입 완료';

            team.roster = team.roster || [];
            var rawName = targetUser.nickname || targetUser.name;
            if(!team.roster.some(function(r){ return r.n === rawName; })){
              team.roster.push({ n: rawName, c: targetUser.streak || 1 });
            }

            var myNick = (state.profile && (state.profile.displayName || state.profile.name)) || '팀장';
            var welcomeMsg = '👑 [영입 공지] ' + myNick + ' 팀장님이 열정 러너 ' + rawName + '님을 새 팀원으로 영입 초대했습니다! 모두 환영해주세요 🎉';

            var groupStateFn = global.groupState || function(gid){
              return (state.profile && state.profile.groupStates && state.profile.groupStates[gid]) || {};
            };
            var gs = groupStateFn(tid);
            gs.chatMessages = gs.chatMessages || [];
            gs.chatMessages.push({
              id: 'cmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              sender: '시스템 알림',
              text: welcomeMsg,
              createdAt: new Date().toISOString(),
              isSystem: true
            });

            if(global.sb){
              try {
                await global.sb.from('team_pings').insert({
                  id: 'scout_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                  group_id: String(tid),
                  sender_id: (state.profile && state.profile.id) || 'system',
                  sender_name: myNick,
                  sender_avatar: (state.profile && (state.profile.avatar || state.profile.avatarUrl)) || '👑',
                  target_type: 'team_chat',
                  target_id: String(tid),
                  target_title: team.title || team.name || '팀 채팅',
                  ping_type: 'chat',
                  message: welcomeMsg,
                  status: 'active',
                  created_at: new Date().toISOString()
                });
              } catch(e){
                console.warn('Scout team ping insert warning:', e);
              }
            }

            if(global.saveProfile) await global.saveProfile();
            T.showToast(userName + '님을 "' + (team.title || team.name) + '" 팀원으로 영입 초대했어요! 🎉');
            setTimeout(function(){
              if(global.closeModal) global.closeModal();
            }, 1200);
          };
        });
      });
    }
  }

  K.openTeamInviteModal = openTeamInviteModal;
  K.openScoutToTeamModal = openScoutToTeamModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
