/* ============================================================
 * 아워골(OurGoal) — 외부 SNS 바이럴 공유 & 통합 딥링크 게이트웨이 모듈
 * #TASK-ES-121 (2026-09-16)
 * 1. 범용 SNS 공유 엔진 (Web Share API + 카카오톡 + 클립보드 fallback)
 * 2. 통합 딥링크 게이트웨이 (피드·모임·템플릿·완주)
 * 3. 비회원 전용 게스트 소프트 뷰어 3종 (피드, 템플릿, 완주축하 Zero-Install 온보딩)
 * ============================================================ */
(function(global){
  'use strict';

  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getOrigin(){
    return (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://ourgoal-app.vercel.app';
  }

  /* ------------------------------------------------------------
   * 1. 범용 SNS 공유 엔진 (shareContent)
   * ------------------------------------------------------------ */
  async function shareContent(opts){
    opts = opts || {};
    var origin = getOrigin();
    var type = opts.type || 'app';
    var id = opts.id || '';
    var title = opts.title || '아워골';
    var text = opts.text || '나만의 목표 달성 메이트 아워골에서 성장을 나눠요!';

    var shareUrl = origin + '/share?type=' + encodeURIComponent(type) + (id ? '&id=' + encodeURIComponent(id) : '');
    if(opts.title) shareUrl += '&title=' + encodeURIComponent(opts.title);
    if(opts.author) shareUrl += '&author=' + encodeURIComponent(opts.author);
    if(opts.desc) shareUrl += '&desc=' + encodeURIComponent(opts.desc);

    var fullShareText = text + '\r\n👉 웹에서 바로보기: ' + shareUrl;

    if(navigator.share){
      try {
        await navigator.share({
          title: title,
          text: fullShareText,
          url: shareUrl
        });
        if(global.toast) global.toast('성공적으로 공유했어요! ✨');
        if(typeof global.triggerHaptic === 'function') global.triggerHaptic(15);
        return true;
      } catch(err){
        if(err && err.name === 'AbortError') return false;
      }
    }

    if(navigator.clipboard && navigator.clipboard.writeText){
      try {
        await navigator.clipboard.writeText(fullShareText);
        if(global.toast) global.toast('공유 링크와 안내 문구가 복사되었어요! 카카오톡이나 SNS에 붙여넣어 공유하세요 🔗');
        if(typeof global.triggerHaptic === 'function') global.triggerHaptic(15);
        return true;
      } catch(e){}
    }

    window.prompt('아래 링크를 복사하여 카카오톡이나 SNS에 공유하세요:', shareUrl);
    return true;
  }

  /* ------------------------------------------------------------
   * 2. 게스트 소프트 뷰어 1: 피드 단독 딥링크 뷰어
   * ------------------------------------------------------------ */
  function showFeedGuestViewerModal(feedId){
    var state = global.state || {};
    var cached = (global.FEED_POSTS_CACHE || []).slice();
    var myLocalPosts = (state.profile && state.profile.settings && state.profile.settings.myFeedPosts) || [];
    var allPosts = myLocalPosts.concat(cached);
    var post = allPosts.find(function(p){ return p && (p.id === feedId || String(p.id) === String(feedId)); });

    if(!post && typeof global.SIM_PERSONAS !== 'undefined'){
      post = global.SIM_PERSONAS.find(function(p){ return p && p.id === feedId; });
    }

    var authorName = post ? (post.display_name || post.name || '동료') : '아워골 러너';
    var goalTitle = post ? (post.goal_title || post.goal || '목표 실천') : '꾸준한 목표 실천';
    var caption = post ? (post.caption || post.action || '오늘도 한 걸음 내딛었습니다!') : '오늘의 실천 기록';
    var photo = post ? (post.photo || (post.extra && post.extra.photo)) : null;
    var recordText = post ? (post.recordText || (post.extra && post.extra.recordText)) : null;
    var time = post ? (post.time || (post.created_at && global.timeAgoStr ? global.timeAgoStr(post.created_at) : '최근')) : '최근';

    if(!global.openModal) return;

    global.openModal(
      '<div style="text-align:center;padding:8px 4px 6px;">' +
        '<div style="font-size:2.4rem;margin-bottom:6px;">📢</div>' +
        '<div class="dday-pill" style="background:var(--brand-soft,#EDE9FE);color:var(--brand-strong,#6C5CE7);display:inline-block;margin-bottom:6px;font-weight:700;">아워골 피드 실천 공유</div>' +
        '<h3 style="font-size:1.15rem;font-weight:700;margin:0 0 6px;">' + esc(authorName) + '님의 실천 기록</h3>' +
        '<p class="muted" style="font-size:.84rem;line-height:1.4;margin:0 0 12px;">' +
          '함께 목표를 세우고 매일 한 줄 기록하는 동료의 실천입니다.' +
        '</p>' +
        '<div style="background:var(--card2);border-radius:14px;padding:14px;border:1px solid var(--rule);margin-bottom:14px;text-align:left;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-size:1.4rem;">🎯</span>' +
            '<b style="font-size:.95rem;color:var(--ink);">' + esc(goalTitle) + '</b>' +
          '</div>' +
          '<p style="font-size:.875rem;color:var(--ink);margin:6px 0 8px;font-weight:600;line-height:1.4;">' + esc(caption) + '</p>' +
          (recordText ? '<div style="font-size:.8125rem;background:var(--surface-2);border:1px solid var(--rule);border-radius:8px;padding:8px 10px;margin:8px 0;color:var(--ink-soft);">' + esc(recordText) + '</div>' : '') +
          (photo ? '<div style="margin-top:8px;text-align:center;"><img src="' + photo + '" style="max-height:180px;max-width:100%;border-radius:10px;object-fit:cover;border:1px solid var(--rule);" /></div>' : '') +
          '<div style="font-size:.75rem;color:var(--ink-faint);margin-top:8px;text-align:right;">' + time + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="btn btn-primary" id="feedGuestCheerBtn" type="button" style="width:100%;padding:12px;font-size:.9rem;font-weight:700;">' +
            '✨ 나도 응원 남기고 피드 둘러보기' +
          '</button>' +
          '<button class="btn btn-ghost btn-sm" id="feedGuestDismissBtn" type="button" style="width:100%;">닫기</button>' +
        '</div>' +
      '</div>',
      function(sheet){
        var cheerBtn = sheet.querySelector('#feedGuestCheerBtn');
        if(cheerBtn) cheerBtn.onclick = async function(){
          if(global.closeModal) global.closeModal();
          if(!state.profile){
            var guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
            state.profile = global.defaultProfile ? global.defaultProfile(guestId, guestId, '새로운 러너') : { id: guestId, displayName: '새로운 러너', goals:[], records:[], settings:{} };
            try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(state.profile)); } catch(e){}
          }
          var landScreen = document.getElementById('landingScreen');
          if(landScreen) landScreen.style.display = 'none';
          if(global.enterApp) await global.enterApp();
          if(global.switchTab) global.switchTab('comm');
          state.commSubTab = 'feed';
          if(global.renderCommScreen) global.renderCommScreen();
          if(global.toast) global.toast('피드로 이동했어요! 따뜻한 응원을 남겨보세요 🔥');
        };
        var dismissBtn = sheet.querySelector('#feedGuestDismissBtn');
        if(dismissBtn && global.closeModal) dismissBtn.onclick = global.closeModal;
      }
    );
  }

  /* ------------------------------------------------------------
   * 3. 게스트 소프트 뷰어 2: 템플릿 딥링크 뷰어
   * ------------------------------------------------------------ */
  function showTemplateGuestViewerModal(templateId){
    var tmplId = templateId;
    var t = null;
    if(global.OURGOAL_60_TEMPLATES && typeof global.OURGOAL_60_TEMPLATES.getById === 'function'){
      t = global.OURGOAL_60_TEMPLATES.getById(tmplId);
    }
    if(!t && global.OURGOAL_60_TEMPLATES && typeof global.OURGOAL_60_TEMPLATES.getAll === 'function'){
      var all = global.OURGOAL_60_TEMPLATES.getAll();
      t = all.find(function(x){ return x.id === tmplId || x.title === tmplId; });
    }
    if(!t && typeof global.CREATOR_TEMPLATES !== 'undefined'){
      t = global.CREATOR_TEMPLATES.find(function(x){ return x.id === tmplId || x.title === tmplId; });
    }
    if(!t && typeof global.CURATED_MARKET_TEMPLATES !== 'undefined'){
      t = global.CURATED_MARKET_TEMPLATES.find(function(x){ return x.key === tmplId || x.id === tmplId; });
    }

    if(t && global.OurgoalTeamInviteComm && global.OurgoalTeamInviteComm.openTemplatePreviewModal){
      global.OurgoalTeamInviteComm.openTemplatePreviewModal(t.id || t.key || tmplId);
      return;
    }

    var title = t ? t.title : (tmplId || '목표 템플릿');
    var desc = t ? t.desc : '검증된 단계별 마일스톤 로드맵입니다.';

    if(!global.openModal) return;

    global.openModal(
      '<div style="text-align:center;padding:8px 4px 6px;">' +
        '<div style="font-size:2.4rem;margin-bottom:6px;">📋</div>' +
        '<div class="dday-pill" style="background:var(--brand-soft,#EDE9FE);color:var(--brand-strong,#6C5CE7);display:inline-block;margin-bottom:6px;font-weight:700;">목표 템플릿 둘러보기</div>' +
        '<h3 style="font-size:1.15rem;font-weight:700;margin:0 0 6px;">' + esc(title) + '</h3>' +
        '<p class="muted" style="font-size:.84rem;line-height:1.4;margin:0 0 12px;">' + esc(desc) + '</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="btn btn-primary" id="tplGuestStartBtn" type="button" style="width:100%;padding:12px;font-weight:700;">✨ 이 템플릿으로 내 목표 시작</button>' +
          '<button class="btn btn-ghost btn-sm" id="tplGuestDismissBtn" type="button" style="width:100%;">닫기</button>' +
        '</div>' +
      '</div>',
      function(sheet){
        var startBtn = sheet.querySelector('#tplGuestStartBtn');
        if(startBtn) startBtn.onclick = async function(){
          if(global.closeModal) global.closeModal();
          var state = global.state || {};
          if(!state.profile){
            var guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
            state.profile = global.defaultProfile ? global.defaultProfile(guestId, guestId, '새로운 러너') : { id: guestId, displayName: '새로운 러너', goals:[], records:[], settings:{} };
            try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(state.profile)); } catch(e){}
          }
          var landScreen = document.getElementById('landingScreen');
          if(landScreen) landScreen.style.display = 'none';
          if(global.enterApp) await global.enterApp();
          if(typeof global.cloneTemplate === 'function'){
            global.cloneTemplate(t ? (t.id || t.key) : tmplId, function(){
              if(global.switchTab) global.switchTab('home');
              if(global.renderAll) global.renderAll();
            });
          }
        };
        var dismissBtn = sheet.querySelector('#tplGuestDismissBtn');
        if(dismissBtn && global.closeModal) dismissBtn.onclick = global.closeModal;
      }
    );
  }

  /* ------------------------------------------------------------
   * 4. 게스트 소프트 뷰어 3: 완주 인증서 딥링크 뷰어
   * ------------------------------------------------------------ */
  function showGoalCertGuestViewerModal(goalId, meta){
    var goalTitle = (typeof meta === 'string' ? meta : (meta && meta.title)) || '목표';
    if(!global.openModal) return;

    global.openModal(
      '<div style="text-align:center;padding:12px 6px 8px;">' +
        '<div style="font-size:2.6rem;margin-bottom:8px;">🏆</div>' +
        '<div class="dday-pill" style="background:var(--gold-soft,#FEF3C7);color:var(--gold-strong,#B45309);display:inline-block;margin-bottom:6px;font-weight:700;">목표 완주 축하 카드</div>' +
        '<h3 style="font-size:1.2rem;font-weight:700;margin:0 0 6px;">"' + esc(goalTitle) + '" 100% 완주!</h3>' +
        '<p class="muted" style="font-size:.875rem;line-height:1.5;margin:0 0 16px;">' +
          '동료가 목표를 멋지게 달성했습니다! 👏<br>' +
          '나만의 목표도 아워골에서 10초 만에 세우고 함께 도전해보세요.' +
        '</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="btn btn-primary" id="goalCertGuestStartBtn" type="button" style="width:100%;padding:12px;font-weight:700;">' +
            '🔥 나도 목표 세우고 완주 도전하기' +
          '</button>' +
          '<button class="btn btn-ghost btn-sm" id="goalCertGuestDismissBtn" type="button" style="width:100%;">둘러보기만 하기</button>' +
        '</div>' +
      '</div>',
      function(sheet){
        var startBtn = sheet.querySelector('#goalCertGuestStartBtn');
        if(startBtn) startBtn.onclick = async function(){
          if(global.closeModal) global.closeModal();
          var state = global.state || {};
          if(!state.profile){
            var guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
            state.profile = global.defaultProfile ? global.defaultProfile(guestId, guestId, '새로운 도전자') : { id: guestId, displayName: '새로운 도전자', goals:[], records:[], settings:{} };
            try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(state.profile)); } catch(e){}
          }
          var landScreen = document.getElementById('landingScreen');
          if(landScreen) landScreen.style.display = 'none';
          if(global.enterApp) await global.enterApp();
          if(global.switchTab) global.switchTab('home');
          if(global.renderAll) global.renderAll();
          if(typeof global.openAddGoalModal === 'function') global.openAddGoalModal();
        };
        var dismissBtn = sheet.querySelector('#goalCertGuestDismissBtn');
        if(dismissBtn && global.closeModal) dismissBtn.onclick = global.closeModal;
      }
    );
  }

  /* ------------------------------------------------------------
   * 5. 통합 딥링크 게이트웨이 (handleDeepLinkRouting)
   * ------------------------------------------------------------ */
  function handleDeepLinkRouting(){
    try {
      var searchParams = new URLSearchParams(window.location.search);

      // 1. 모임 초대 (?invite_group=, ?invite=, ?join_team= 복구)
      var inviteGid = searchParams.get('invite_group') || searchParams.get('invite') || searchParams.get('join_team');
      if(inviteGid){
        var roomMeta = {
          name: searchParams.get('room_name') || searchParams.get('name') || '',
          max: searchParams.get('max') || '5',
          type: searchParams.get('type') || 'small',
          code: searchParams.get('code') || ''
        };
        setTimeout(function(){
          if(typeof global.showPeerInviteLandingModal === 'function'){
            global.showPeerInviteLandingModal(inviteGid, roomMeta);
          }
        }, 350);
        return;
      }

      // 2. 피드 상세 딥링크 (?feed=, ?post=, ?feed_id=)
      var feedId = searchParams.get('feed') || searchParams.get('post') || searchParams.get('feed_id');
      if(feedId){
        setTimeout(function(){
          showFeedGuestViewerModal(feedId);
        }, 350);
        return;
      }

      // 3. 템플릿 상세 딥링크 (?template=, ?tpl=, ?template_id=)
      var tmplId = searchParams.get('template') || searchParams.get('tpl') || searchParams.get('template_id');
      if(tmplId){
        setTimeout(function(){
          showTemplateGuestViewerModal(tmplId);
        }, 350);
        return;
      }

      // 4. 완주 인증서 딥링크 (?goal=)
      var goalId = searchParams.get('goal');
      if(goalId){
        var goalTitle = searchParams.get('title') || '목표';
        setTimeout(function(){
          showGoalCertGuestViewerModal(goalId, goalTitle);
        }, 350);
        return;
      }
    } catch(e){
      console.warn('handleDeepLinkRouting 실패:', e);
    }
  }

  global.OurgoalViralSharing = {
    shareContent: shareContent,
    showFeedGuestViewerModal: showFeedGuestViewerModal,
    showTemplateGuestViewerModal: showTemplateGuestViewerModal,
    showGoalCertGuestViewerModal: showGoalCertGuestViewerModal,
    handleDeepLinkRouting: handleDeepLinkRouting
  };
  global.shareContent = shareContent;
  global.handleDeepLinkRouting = handleDeepLinkRouting;
  global.checkAndHandlePeerInviteUrl = handleDeepLinkRouting;

  if(typeof module !== 'undefined' && module.exports){
    module.exports = global.OurgoalViralSharing;
  }

})(typeof window !== 'undefined' ? window : global);