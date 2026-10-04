/**
 * OurGoal Community Cell: 프로필 모달·동반자 초대 링크 — openUserProfileModal·copyCompanionInviteLink (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 1765~1953줄).
 *   openUserProfileModal · copyCompanionInviteLink
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  function openUserProfileModal(user){
    if(!user) return;
    var state = global.state || {};
    var isAiBot = T.isKnownAiCompanion(user);
    if(isAiBot) user.isAiBot = true;

    var goalsHtml = (user.goals && user.goals.length ? user.goals : ['진행 중인 목표 1개']).map(function(g){
      return '<div style="padding:8px 12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--rule);font-size:.8125rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="color:var(--ink);font-weight:600;">🎯 ' + T.esc(g) + '</span>' +
        '<span class="dday-pill" style="font-size:.6875rem;background:var(--card);">진행 중</span>' +
      '</div>';
    }).join('');

    var heatmapCubes = '';
    for(var d = 13; d >= 0; d--){
      var hasCheckin = Array.isArray(user.recentCheckinDays) && user.recentCheckinDays.indexOf(d) !== -1; // [#TASK-ES-348] 예전 d%3 가짜 무늬 제거, 데이터 없으면 빈 칸
      var bg = hasCheckin ? 'var(--brand)' : 'var(--rule)';
      heatmapCubes += '<div style="flex:1;aspect-ratio:1/1;background:' + bg + ';border-radius:3px;" title="' + d + '일 전 실천"></div>';
    }

    var isMyCompanion = (state.profile && state.profile.companions && state.profile.companions.some(function(c){ return String(c.id || '').trim().toLowerCase() === String(user.id || '').trim().toLowerCase(); }));

    var modalHtml = '<h3>' + T.esc(user.nickname || user.name) + '님의 프로필</h3>' +
      '<div style="text-align:center;padding:12px 0 10px;">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:var(--surface-2);border:2px solid var(--brand);display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 10px;box-shadow:0 4px 12px rgba(0,0,0,0.06);overflow:hidden;flex-shrink:0;">' +
          T.safeAvatarHtml(user.avatar, 72) +
        '</div>' +
        '<div style="font-weight:700;font-size:1.1rem;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">' +
          '<span>' + T.esc(user.nickname || user.name) + '</span>' +
          (isAiBot ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 동반자</span>' : ((typeof window !== 'undefined' && typeof window.isValidRealUser === 'function' ? window.isValidRealUser(user.id) : (String(user.id).indexOf('guest') !== 0 && String(user.id).indexOf('comp_') !== 0 && String(user.id).indexOf('mem_') !== 0)) ? '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--ink-soft);">실 사용자</span>' : '<span class="dday-pill" style="font-size:.6875rem;background:var(--surface-2);color:var(--brand-strong);border:1px solid rgba(108,92,231,0.3);font-weight:700;">🤖 AI 동반자</span>')) +
        '</div>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:2px;">' + T.esc(user.theme || (isAiBot ? 'AI 목표 동반자' : '아워골 동반자')) + '</div>' +
        '<div style="display:flex;justify-content:center;gap:6px;margin-top:8px;">' +
          '<span class="dday-pill" style="font-size:.75rem;">Lv.' + (user.level || 1) + '</span>' +
          (user.streak > 0 ? '<span class="dday-pill" style="font-size:.75rem;background:var(--red-soft);color:var(--brand-strong);">🔥 ' + user.streak + '일 연속 실천</span>' : '') +
        '</div>' +
      '</div>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:14px;font-size:.8125rem;color:var(--ink);line-height:1.5;text-align:center;">' +
        '“ ' + T.esc(user.intro || (isAiBot ? '초기 활동을 함께 응원하는 AI 동반자입니다.' : '함께 목표를 향해 달리는 든든한 동반자입니다.')) + ' ”' +
      '</div>' +
      (isAiBot ? '<div style="font-size:.75rem;color:var(--brand-strong);margin-top:-6px;margin-bottom:12px;text-align:center;font-weight:600;">💡 목표 도전을 함께 응원하는 AI 동반자입니다.</div>' : '') +
      '<div style="margin-bottom:14px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">도전 중인 목표</div>' +
        goalsHtml +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);">최근 14일 실천 히트맵</span>' +
          '<span class="faint" style="font-size:.75rem;">' + (user.streak > 0 ? user.streak + '일 연속 달성 중' : '공개된 실천 기록 없음') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px;padding:8px 10px;background:var(--card);border:1px solid var(--rule);border-radius:10px;">' +
          heatmapCubes +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="userProfCloseBtn" type="button">닫기</button>' +
        (isMyCompanion ? '' : '<button class="btn btn-ghost" id="userProfAddCompBtn" type="button" style="color:var(--brand-strong);border-color:var(--brand);">+ 동반자 추가</button>') +
        '<button class="btn btn-primary" id="userProfDmBtn" type="button" style="font-weight:700;padding:8px 20px;">💬 1:1 DM 보내기</button>' +
      '</div>';

    if(global.openModal){
      global.openModal(modalHtml, function(sheet){
        var closeBtn = sheet.querySelector('#userProfCloseBtn');
        if(closeBtn) closeBtn.onclick = global.closeModal;

        var addCompBtn = sheet.querySelector('#userProfAddCompBtn');
        if(addCompBtn){
          addCompBtn.onclick = async function(){
            var isGuest = !state.profile || !state.profile.id || String(state.profile.id).indexOf('guest') === 0;
            if(isGuest){
              if(global.closeModal) global.closeModal();
              T.showGuestSoftAuthGate('동반자 추가');
              return;
            }
            var comps = T.ensureDefaultCompanions();
            var targetId = String(user.id || '').trim().toLowerCase();
            if(!comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === targetId; })){
              addCompBtn.disabled = true;
              addCompBtn.textContent = '✓ 추가됨';
              comps.unshift({
                id: user.id,
                nickname: user.nickname || user.name,
                name: user.name,
                avatar: user.avatar,
                level: user.level || 1,
                streak: user.streak || 1,
                theme: user.theme || '동반자',
                intro: user.intro || '',
                goals: user.goals || [],
                isAiBot: isAiBot,
                createdAt: new Date().toISOString()
              });
              // saveProfile() 실패가 추가 자체를 막지 않도록 격리
              try { if(global.saveProfile) await global.saveProfile(); } catch(err){ console.warn('[동반자] saveProfile 오류(무시하고 계속):', err); }
              try { T.persistCompanions(); } catch(pErr){ console.warn('[동반자] persistCompanions 오류(무시):', pErr); }
              T.showToast((user.nickname || user.name) + '님을 동반자로 추가했어요! 🎉');
              if(global.closeModal) global.closeModal();
              if(state.activeTab === 'comm' && state.commSubTab === 'companion'){
                if(global.renderCommScreen) global.renderCommScreen();
              }
            } else {
              T.showToast('이미 등록된 동반자입니다.');
              if(global.closeModal) global.closeModal();
            }
          };
        }

        var dmBtn = sheet.querySelector('#userProfDmBtn');
        if(dmBtn){
          dmBtn.onclick = function(){
            if(global.closeModal) global.closeModal();
            state.commSubTab = 'dm';
            state.dmActiveId = user.id;
            if(global.setTab) global.setTab('comm');
            if(global.renderCommScreen) global.renderCommScreen();
          };
        }
      });
    }
  }

  /* ------------------------------------------------------------
   * 7-0. 동반자 전용 초대 링크 복사 및 Web Share 공유
   * #TASK-ES-231 [생각 메모장 101번]
   * ------------------------------------------------------------ */
  async function copyCompanionInviteLink(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    if(typeof triggerHapticFeedback === 'function'){
      triggerHapticFeedback(15);
    }
    var state = global.state || {};
    var myName = (state.profile && (state.profile.displayName || state.profile.name || state.profile.nickname)) || 'mate';
    var inviteUrl = 'https://ourgoal-app.vercel.app?ref=' + encodeURIComponent(myName);

    var copyFallback = function(text){
      var copied = false;
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch(err){
        console.warn('[초대 링크 복사 fallback 오류]:', err);
      }
      return copied;
    };

    var didShare = false;
    if(navigator.share){
      try {
        await navigator.share({
          title: '아워골 목표 동반자 초대',
          text: myName + '님과 함께 매일 실천하는 목표 동반자가 되어주세요! 🤝',
          url: inviteUrl
        });
        didShare = true;
        T.showToast('초대 링크를 전송했어요! 💌');
      } catch(sErr){
        if(sErr && sErr.name === 'AbortError'){
          return;
        }
      }
    }

    if(!didShare){
      var clipOk = false;
      if(navigator.clipboard && navigator.clipboard.writeText){
        try {
          await navigator.clipboard.writeText(inviteUrl);
          clipOk = true;
        } catch(cErr){
          clipOk = copyFallback(inviteUrl);
        }
      } else {
        clipOk = copyFallback(inviteUrl);
      }

      if(clipOk){
        T.showToast('초대 링크가 복사되었어요! 친구에게 공유해보세요 💌');
      } else {
        T.showToast('초대 링크: ' + inviteUrl);
      }
    }
  }

  K.openUserProfileModal = openUserProfileModal;
  K.copyCompanionInviteLink = copyCompanionInviteLink;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
