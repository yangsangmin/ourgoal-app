/**
 * OurGoal Comm Feed List (소통 탭 — 피드 글 카드 HTML·피드 목록 그리기)
 *
 * 피드 글 한 장의 HTML(feedPostHtml — 지금 부르는 곳 0, 그대로 옮김) · 소통 탭 피드 목록 그리기와 그 안의 칸·단추 처리(renderCommFeed).
 * index.html 「피드 상호소통 댓글 & 리액션 헬퍼」 묶음에 남아 있던 두 함수를 옮겼다(댓글·응원 저장 헬퍼는 #TASK-ES-379 가 js/tabs/comm/feed-comments.js 로 먼저 옮겼고, 숨은 빠른 게시 띠는 #TASK-ES-495 가 지웠다).
 * #TASK-ES-496(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 13417~13448 · 13449~14039줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 13417~13448줄(#TASK-ES-496 생성기 표지) ---- */
  /* ============ 피드 상호소통 댓글 & 리액션 헬퍼 (#TASK-ES-133 서버 DB 실시간 동기화) ============ */
  /* [#TASK-ES-379] SERVER_FEED_COMMENTS_CACHE · loadServerFeedComments · getFeedComments · setFeedComments · handleUserCommentSubmit · toggleFeedReaction → js/tabs/comm/feed-comments.js 로 옮김(소통 탭 세포 1차) */

  function feedPostHtml(p){
    var ex = p.extra || {};
    var reacted = !!L.state.profile.settings.feedReactions[p.id];
    var isMe = p.user_id === L.state.profile.id;
    var reported = !!((L.state.profile.settings.contentReports||{})['feed_post:'+p.id]);
    return '<div class="feed-item">' +
      '<div class="feed-avatar'+(isMe?' me':'')+'" data-feedprof="'+p.id+'" style="cursor:pointer;" title="프로필 보기">'+L.escapeHtml((p.display_name||'').slice(0,1))+'</div>' +
      '<div class="feed-body">' +
        '<div class="feed-head"><span class="feed-name" data-feedprof="'+p.id+'" style="cursor:pointer;" title="프로필 보기">'+L.escapeHtml(p.display_name)+'</span>' +
          (ex.includeGoal ? '<span class="feed-goal">'+L.escapeHtml(p.goal_title)+' · '+ex.goalPct+'%</span>' : '') +
        '</div>' +
        '<div class="feed-action">'+L.escapeHtml(p.caption)+'</div>' +
        (ex.includeRecord && ex.recordText ? '<div class="faint" style="font-size:.8125rem;background:var(--card2);border-radius:12px;padding:8px 10px;margin-top:8px;">'+L.escapeHtml(ex.recordText)+'</div>' : '') +
        (ex.includeFeedback && ex.feedback ? '<div class="fb-card '+L.verdictClass(ex.feedback.verdict)+'" style="margin:8px 0 0;padding:10px 12px;box-shadow:none;">' +
          '<div class="fb-verdict" style="font-size:.8125rem;">'+L.escapeHtml(ex.feedback.verdict)+'</div>' +
          '<div class="fb-row" style="font-size:.8125rem;margin-top:2px;">'+L.escapeHtml(ex.feedback.comment)+'</div>' +
        '</div>' : '') +
        (ex.milestones && ex.milestones.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">' +
          ex.milestones.map(function(m){ return '<span class="topic-pill">'+(m.status==='done'?'✅ ':(m.status==='doing'?'🔥 ':'· '))+L.escapeHtml(m.title)+'</span>'; }).join('') +
        '</div>' : '') +
        '<div class="feed-foot"><span class="feed-time">'+L.timeAgoStr(p.created_at)+'</span>' +
          '<button class="pill-react'+(reacted?' active':'')+'" data-react="'+p.id+'" type="button">응원 '+(p.cheers_count||0)+'</button>' +
          (isMe ? '<button data-delpost="'+p.id+'" type="button" style="margin-left:8px;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">삭제</button>' : '') +
          (!isMe ? '<button data-reportpost="'+p.id+'" type="button"'+(reported?' disabled':'')+' style="margin-left:8px;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">'+(reported?'신고됨':'신고')+'</button>' +
            (p.user_id ? '<button data-blockuser="'+p.user_id+'" data-blockname="'+L.escapeHtml(p.display_name||'사용자')+'" type="button" style="margin-left:8px;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">차단</button>' : '') : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }
  /* ---- 이전 전 index.html 13449~14039줄(#TASK-ES-496 생성기 표지) ---- */

  function renderCommFeed(body){
    if(!body) return;
    if(!L.FEED_POSTS_CACHE){
      L.ensureFeedPostsLoaded().then(function(){
        if(L.state.activeTab==='comm' && L.state.commSubTab==='feed') renderCommFeed(body);
      });
    }
    var prof = L.state.profile || {}, profSettings = prof.settings || {};
    var goals = (prof.goals || []).filter(function(g){ return !g.archivedAt; });
    var sharedGoals = goals.filter(function(g){ return (g.visibility||'private') !== 'private'; });
    var hiddenCount = goals.length - sharedGoals.length;
    var myRecentPhoto = ((prof.records || []).find(function(r){ return r && r.photo; }) || {}).photo || null;
    var myItems = sharedGoals.map(function(g){
      var pct = L.goalProgress(g);
      return { id:'me_'+g.id, userId: prof.id, name: prof.displayName, avatar: (prof.displayName||'나').slice(0,1), goal:g.title, pct:pct, action: '"'+g.title+'" 목표를 향해 가는 중', time:'방금', cheers:0, me:true, vis:(g.visibility||'private'), is_ai:false, photo: myRecentPhoto };
    });

    // Merge myFeedPosts if any exist in profile settings
    var cached = (L.FEED_POSTS_CACHE || []).slice();
    var myLocalPosts = profSettings.myFeedPosts || [];
    myLocalPosts.forEach(function(lp){
      if(!cached.some(function(cp){ return cp.id === lp.id; })){
        cached.unshift(lp);
      }
    });

    var posts = L.filterHidden(cached);
    var virtualCheerEnabled = profSettings.virtualCheerEnabled !== false;
    var realCombined = myItems.concat(posts.map(function(p){
      var ex = p.extra || {};
      return {
        id: p.id,
        userId: p.user_id,
        name: p.display_name,
        avatar: (p.display_name||'').slice(0,1),
        goal: p.goal_title,
        category: ex.category || null,
        pct: ex.goalPct || 0,
        action: p.caption,
        recordText: ex.includeRecord ? ex.recordText : null,
        photo: ex.photo || p.photo || null,
        feedback: ex.includeFeedback ? ex.feedback : null,
        milestones: ex.milestones || [],
        time: L.timeAgoStr(p.created_at),
        cheers: p.cheers_count || 0,
        isMe: p.user_id === L.state.profile.id,
        is_ai: false
      };
    }));

    var blockedList = (L.state.profile && L.state.profile.settings && L.state.profile.settings.blockedUsers) || [];
    realCombined = L.filterBlockedPosts(realCombined, blockedList);

    // Dynamic Blended Feed ([#TASK-ES-180], [61], [#TASK-ES-332])
    // 실 유저 20명 초과 시 AI 전면 제거, 20명 이하 시 실제 유저 우선 & AI 봇 1개만 최하단에 보강
    var realCount = realCombined.length;
    var blendedItems = [];

    if(!virtualCheerEnabled || realCount > 20){
      blendedItems = realCombined;
    } else {
      var singleAiGuide = (typeof L.SIM_PERSONAS !== 'undefined' && L.SIM_PERSONAS.length > 0) ? [L.SIM_PERSONAS[0]] : [];
      blendedItems = realCombined; // [TASK-ES-332] 가짜 봇 주입 배제 (blendedItems = singleAiGuide 배제)
    }

    var stageLabel = !virtualCheerEnabled ? ' · 실시간 활동 피드' :
      (realCount > 20 ? ' · 🌟 실유저 중심 피드 (실사용자 100%)' :
      (realCount === 0 ? ' · 아직 공유된 실천이 없어요' : ' · 👥 실시간 활동 피드'));

    var categories = [
      { key: 'all', label: '전체' },
      { key: 'study', label: '📚 공부·수험' },
      { key: 'dev', label: '💻 개발·기획' },
      { key: 'workout', label: '💪 운동·헬스' },
      { key: 'running', label: '🏃 러닝·마라톤' },
      { key: 'diet', label: '🥗 다이어트·식단' },
      { key: 'career', label: '💼 커리어·취업' },
      { key: 'sideproject', label: '🚀 창업·사이드' },
      { key: 'finance', label: '💰 재테크·투자' },
      { key: 'life', label: '☀️ 생활·루틴' },
      { key: 'morning', label: '⏰ 기상·모닝루틴' },
      { key: 'parenting', label: '👶 육아·가족' },
      { key: 'pet', label: '🐾 반려동물' },
      { key: 'relation', label: '🤝 관계·소통' },
      { key: 'reading', label: '📖 독서·인문' },
      { key: 'hobby', label: '🎨 취미·창작' },
      { key: 'mental', label: '🧘 멘탈·마인드' },
      { key: 'clean', label: '🧹 정리·미니멀' },
      { key: 'travel', label: '✈️ 여행·아웃도어' }
    ];
    var curCat = L.state.feedCategory || 'all';
    var catChipsHtml = '<div class="feed-filter-bar" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch;white-space:nowrap;">'
      + categories.map(function(c){
        return '<button type="button" class="feed-filter-chip' + (curCat === c.key ? ' active' : '') + '" data-feedcat="' + c.key + '" style="flex:0 0 auto;">' + c.label + '</button>';
      }).join('')
      + '</div>';

    blendedItems = L.filterFeedByCategory(blendedItems, curCat);
    /* KF-4 #TASK-ES-018: 이 주제에서 도움이 된 글을 맨 위로(실데이터·'전체' 제외). 로직은 js/top-helpful.js */
    if(window.OurgoalTopHelpful){
      blendedItems = window.OurgoalTopHelpful.arrange(blendedItems, curCat, { posts: L.FEED_POSTS_CACHE, rerender: function(){ if(L.state.activeTab==='comm' && L.state.commSubTab==='feed') renderCommFeed(body); } });
    }

    var feedType = L.state.commFeedType || 'all';
    var typeFilterHtml = '<div class="comm-feed-type-bar">' +
      '<button type="button" class="comm-type-pill' + (feedType === 'all' ? ' active' : '') + '" data-feedtype="all">전체 피드</button>' +
      '<button type="button" class="comm-type-pill' + (feedType === 'mine' ? ' active' : '') + '" data-feedtype="mine">내 소통</button>' +
      '<button type="button" class="comm-type-pill' + (feedType === 'photo' ? ' active' : '') + '" data-feedtype="photo">📸 사진인증만</button>' +
    '</div>';

    var AI_PHOTO_VERIFICATIONS = [
      {
        id: 'ai_photo_01',
        name: '민혁 (AI 가이드)',
        avatar: '🏃',
        goal: '새벽 러닝 10km 완주',
        pct: 70,
        action: '오늘 아침 10km 페이스 4분 50초 지속주 완료! 사진 인증합니다 🏃',
        recordText: '[기록] 아침 러닝 10.02km / 48분 20초 / 610kcal 소모',
        photo: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop&q=80',
        time: '오늘 07:10',
        cheers: 12,
        is_ai: true,
        ai_notice: 'AI 가이드 사진인증'
      },
      {
        id: 'ai_photo_02',
        name: '지우 (AI 가이드)',
        avatar: '🏋️‍♀️',
        goal: '바디프로필 & 3대 300 달성',
        pct: 65,
        action: '오늘 하체 루틴 및 스쿼트 80kg 5세트 완료! 득근하는 하루 되세요 💪',
        recordText: '[기록] 스쿼트 80kg 5x5 / 레그프레스 160kg 4세트',
        photo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
        time: '오늘 08:30',
        cheers: 15,
        is_ai: true,
        ai_notice: 'AI 가이드 사진인증'
      },
      {
        id: 'ai_photo_03',
        name: '서연 (AI 가이드)',
        avatar: '📝',
        goal: '기출문제 10회독 & 자격증 취득',
        pct: 80,
        action: '도서관에서 3시간 순공 완료! 오답노트 작성 및 파트별 복습 마쳤습니다 💼',
        recordText: '[기록] 순공 3시간 15분 / 기출 40제 풀이 및 오답 정리',
        photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&auto=format&fit=crop&q=80',
        time: '오늘 10:30',
        cheers: 18,
        is_ai: true,
        ai_notice: 'AI 가이드 사진인증'
      }
    ];

    if(feedType === 'mine'){
      blendedItems = blendedItems.filter(function(it){ return it.me || it.isMe; });
    } else if(feedType === 'photo'){
      var realPhotoItems = blendedItems.filter(function(it){ return !!it.photo && !it.is_ai; });
      // [#TASK-ES-312, 61] 실 유저 20명 초과 시 AI 사진인증 0건 전면 제거, 20명 이하 시 최대 1건만 최하단 보강
      if(!virtualCheerEnabled || realCount > 20){
        blendedItems = realPhotoItems;
      } else {
        var singleAiPhoto = (AI_PHOTO_VERIFICATIONS && AI_PHOTO_VERIFICATIONS.length > 0) ? [AI_PHOTO_VERIFICATIONS[0]] : [];
        blendedItems = realPhotoItems.concat(singleAiPhoto);
      }
    }

    body.innerHTML =
      typeFilterHtml +
      catChipsHtml +
      '<p class="faint" style="margin:0 0 14px;">같은 목표를 향해 가는 사람들' + stageLabel +
      (hiddenCount ? ' · 🔒 나만 보기 '+hiddenCount+'개는 피드에 노출되지 않아요' : '') + '</p>' +
      (blendedItems.length === 0 ? (typeof OurgoalComponents !== 'undefined' && OurgoalComponents.emptyState ? OurgoalComponents.emptyState({ icon: '💬', title: '표시할 소통 글이 없어요', desc: '해당 필터에 등록된 피드가 없습니다. 첫 실천을 공유해보세요!' }) : '<div class="faint" style="text-align:center;padding:40px 0;">해당 카테고리에 공유된 피드가 없어요. 첫 목표나 체크인을 공유해보세요!</div>') : '') +
      blendedItems.map(function(it){
        var reactions = (L.state.profile && L.state.profile.settings && L.state.profile.settings.feedReactions) || {};
        var isMe = it.me || it.isMe;
        var aiTagHtml = it.is_ai ? ('<span class="feed-ai-tag' + (it.photo ? ' ai-photo-tag' : '') + '">' + (it.photo ? '🤖 AI 사진인증' : 'AI 봇') + '</span>') : '';
        var aiNoticeHtml = it.is_ai ?
          '<div class="ai-badge-notice ai-badge-notice-clean" title="초기 앱 활용을 돕는 가상 동료입니다">' +
            '<span class="ai-icon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M12 3v3"/><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M2 12h2M20 12h2"/></svg></span>' +
            '<span>AI 가이드</span>' +
          '</div>' : '';

        var hasFire = !!reactions[it.id + ':fire'] || (!reactions[it.id + ':fire'] && !reactions[it.id + ':clap'] && !reactions[it.id + ':heart'] && !reactions[it.id + ':sparkle'] && !!reactions[it.id]);
        var hasClap = !!reactions[it.id + ':clap'];
        var hasHeart = !!reactions[it.id + ':heart'];
        var hasSparkle = !!reactions[it.id + ':sparkle'];

        var fireCount = (it.cheers || 0) + (hasFire ? 1 : 0);
        var clapCount = (it.clapCount || 0) + (hasClap ? 1 : 0);
        var heartCount = (it.heartCount || 0) + (hasHeart ? 1 : 0);
        var sparkleCount = (it.sparkleCount || 0) + (hasSparkle ? 1 : 0);

        var comments = L.getFeedComments(it.id);
        var isExpanded = !!(L.state.expandedComments && L.state.expandedComments[it.id]);

        return (it._topHelpfulLabel && window.OurgoalTopHelpful ? window.OurgoalTopHelpful.labelHtml() : '') +
          '<div class="feed-item">' +
          '<div class="feed-avatar'+(isMe?' me':'')+'" data-feedprof="'+it.id+'" style="cursor:pointer;" title="프로필 보기">'+L.escapeHtml(it.avatar)+'</div>' +
          '<div class="feed-body">' +
            '<div class="feed-head">' +
              '<span class="feed-name" data-feedprof="'+it.id+'" style="cursor:pointer;" title="프로필 보기">'+L.escapeHtml(it.name)+aiTagHtml+(it.vis==='theme'?' 🏷️':(it.vis==='followers'?' 👥':''))+'</span>' +
              (it.goal ? '<span class="feed-goal">'+L.escapeHtml(it.goal)+' · '+it.pct+'%</span>' : '') +
            '</div>' +
            '<div class="feed-action">'+L.escapeHtml(it.action)+'</div>' +
            ((it.recordText && isMe) ? '<div class="faint" style="font-size:.8125rem;background:var(--card2);border-radius:12px;padding:8px 10px;margin-top:8px;">'+L.escapeHtml(it.recordText)+'</div>' : '') +
            (it.photo ? '<div style="position:relative;display:inline-block;margin-top:8px;"><img src="'+it.photo+'" class="checkin-photo-thumb" data-feedphoto="'+it.id+'" style="max-height:140px;max-width:200px;border-radius:10px;border:1px solid var(--rule);cursor:pointer;object-fit:cover;" />' + (it.is_ai ? '<span style="position:absolute;top:6px;left:6px;background:rgba(15,23,42,0.8);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;box-shadow:0 1px 4px rgba(0,0,0,0.3);">🤖 AI 인증</span>' : '') + '</div>' : '') +
            ((it.feedback && isMe) ? '<div class="fb-card '+L.verdictClass(it.feedback.verdict)+'" style="margin:8px 0 0;padding:10px 12px;box-shadow:none;">' +
              '<div class="fb-verdict" style="font-size:.8125rem;">'+L.escapeHtml(it.feedback.verdict)+'</div>' +
              '<div class="fb-row" style="font-size:.8125rem;margin-top:2px;">'+L.escapeHtml(it.feedback.comment)+'</div>' +
            '</div>' : '') +
            (it.milestones && it.milestones.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">' +
              it.milestones.map(function(m){ return '<span class="topic-pill">'+(m.status==='done'?'✅ ':(m.status==='doing'?'🔥 ':'· '))+L.escapeHtml(m.title)+'</span>'; }).join('') +
            '</div>' : '') +
            '<div class="feed-foot" style="margin-top:10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<span class="feed-time">'+it.time+'</span>' +
              '<div class="feed-react-group">' +
                /* KF-7 #TASK-ES-014: 반응 4종(응원해요·도움돼요·별로에요·조언해요). js/reactions.js 가 없으면 예전 이모지 버튼으로 표시 */
                (window.OurgoalReactions ? window.OurgoalReactions.buttonsHtml(it, { isMe: isMe }) :
                '<button class="feed-react-btn'+(hasFire?' active active-fire':'')+'" data-reacttype="fire" data-pid="'+it.id+'" type="button" title="파이팅">'+fireCount+'</button>' +
                '<button class="feed-react-btn'+(hasClap?' active active-clap':'')+'" data-reacttype="clap" data-pid="'+it.id+'" type="button" title="대단해요">'+(clapCount > 0 ? clapCount : '')+'</button>' +
                '<button class="feed-react-btn'+(hasHeart?' active active-heart':'')+'" data-reacttype="heart" data-pid="'+it.id+'" type="button" title="응원해요">'+(heartCount > 0 ? heartCount : '')+'</button>' +
                '<button class="feed-react-btn'+(hasSparkle?' active active-sparkle':'')+'" data-reacttype="sparkle" data-pid="'+it.id+'" type="button" title="자극받아요">'+(sparkleCount > 0 ? sparkleCount : '')+'</button>') +
                '<button class="feed-comm-toggle'+(comments.length?' has-comments':'')+'" data-togglecomments="'+it.id+'" type="button">댓글 '+(comments.length || 0)+'</button>' +
                '<button class="feed-share-btn" data-sharefeed="'+it.id+'" type="button" title="피드 글 공유 (동반자 DM · 팀 톡방 · 외부 SNS)" style="background:none;border:1px solid var(--rule);border-radius:12px;padding:3px 8px;font-size:.75rem;color:var(--ink-soft);cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-left:2px;">🔗 공유</button>' +
                (!isMe ?
                  '<button class="feed-social-btn" data-feedcomp="'+it.id+'" type="button" title="동반자로 추가" style="background:none;border:1px solid var(--brand-line);border-radius:12px;padding:3px 8px;font-size:.75rem;color:var(--brand);cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-left:2px;font-weight:600;">+ 동반자</button>' +
                  '<button class="feed-social-btn" data-feeddm="'+it.id+'" type="button" title="1:1 응원 DM" style="background:none;border:1px solid var(--rule);border-radius:12px;padding:3px 8px;font-size:.75rem;color:var(--teal);cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-left:2px;font-weight:600;">✉️ DM</button>' +
                  '<button class="feed-social-btn" data-feedscout="'+it.id+'" type="button" title="내 팀 목표로 영입 초대" style="background:none;border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:3px 8px;font-size:.75rem;color:var(--gold);cursor:pointer;display:inline-flex;align-items:center;gap:3px;margin-left:2px;font-weight:600;">👑 영입</button>' : '') +
              '</div>' +
              (window.OurgoalReactions ? window.OurgoalReactions.advicePanelHtml(it) : '') +
              (isMe && !it.is_ai ? '<button data-delpost="'+it.id+'" type="button" style="margin-left:auto;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">삭제</button>' : '') +
              (!isMe && !it.is_ai ? '<button data-reportpost="'+it.id+'" type="button" style="margin-left:auto;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">신고</button>' +
                (it.userId ? '<button data-blockuser="'+it.userId+'" data-blockname="'+L.escapeHtml(it.name||'사용자')+'" type="button" style="margin-left:6px;background:none;border:none;color:var(--ink-faint);font-size:.8125rem;cursor:pointer;">차단</button>' : '') : '') +
            '</div>' +
            '<div class="feed-comments-panel" id="cpanel_'+it.id+'" style="display:'+(isExpanded ? 'block' : 'none')+';">' +
              '<div class="feed-comments-list">' +
                (comments.length === 0 ? '<div class="faint" style="font-size:.8125rem;padding:4px 0;">아직 댓글이 없어요. 따뜻한 응원의 한마디를 남겨보세요!</div>' : '') +
                comments.map(function(c){
                  var cIsMe = c.isMe || (c.userId === L.state.profile.id);
                  var cBadge = c.is_ai ? '<span class="feed-c-badge badge-ai">AI봇</span>' : (cIsMe ? '<span class="feed-c-badge badge-author">나</span>' : '');
                  return '<div class="feed-comment-bubble'+(cIsMe?' me-comment':'')+'">' +
                    '<div class="feed-c-avatar'+(cIsMe?' me':'')+'">'+L.escapeHtml(c.avatar||'👤')+'</div>' +
                    '<div class="feed-c-body">' +
                      '<div class="feed-c-meta">' +
                        '<span class="feed-c-author">'+L.escapeHtml(c.name)+cBadge+'</span>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                          '<span class="feed-c-time">'+L.escapeHtml(c.time||'방금')+'</span>' +
                          (cIsMe ? '<button class="feed-c-del" data-delcomment="'+it.id+'" data-cid="'+c.id+'" type="button" title="삭제">×</button>' : '') +
                        '</div>' +
                      '</div>' +
                      '<div class="feed-c-text">'+L.escapeHtml(c.text)+'</div>' +
                    '</div>' +
                  '</div>';
                }).join('') +
              '</div>' +
              '<div class="feed-quick-chips-row">' +
                '<button type="button" class="feed-quick-chip" data-quickreply="'+it.id+'" data-qtext="🔥 오늘 하루도 파이팅!">오늘 하루도 파이팅!</button>' +
                '<button type="button" class="feed-quick-chip" data-quickreply="'+it.id+'" data-qtext="👏 멋진 실천 대단해요!">멋진 실천 대단해요!</button>' +
                '<button type="button" class="feed-quick-chip" data-quickreply="'+it.id+'" data-qtext="💪 끝까지 함께 완주해요!">끝까지 함께 완주해요!</button>' +
                '<button type="button" class="feed-quick-chip" data-quickreply="'+it.id+'" data-qtext="✨ 좋은 자극 받고 갑니다!">좋은 자극 받고 갑니다!</button>' +
              '</div>' +
              '<div class="feed-input-row">' +
                '<input type="text" class="feed-c-input" data-cinput="'+it.id+'" placeholder="따뜻한 응원이나 질문을 남겨보세요..." />' +
                '<button class="btn btn-primary btn-sm" data-sendcomment="'+it.id+'" type="button" style="padding:6px 12px;font-size:.8125rem;font-weight:700;white-space:nowrap;">등록</button>' +
              '</div>' +
            '</div>' +
            aiNoticeHtml +
          '</div>' +
        '</div>';
      }).join('');

    body.querySelectorAll('[data-feedcat]').forEach(function(chip){
      chip.addEventListener('click', function(){
        L.state.feedCategory = chip.dataset.feedcat;
        L.triggerHaptic(8);
        renderCommFeed(body);
      });
    });

    body.querySelectorAll('[data-feedtype]').forEach(function(pill){
      pill.addEventListener('click', function(){
        L.state.commFeedType = pill.dataset.feedtype;
        L.triggerHaptic(8);
        renderCommFeed(body);
      });
    });

    body.querySelectorAll('[data-feedphoto]').forEach(function(img){
      img.addEventListener('click', function(){
        var pItem = blendedItems.find(function(x){ return x.id === img.dataset.feedphoto; });
        if(pItem && pItem.photo) L.openPhotoViewerModal(pItem.photo);
      });
    });

    // Multi-reactions
    body.querySelectorAll('[data-reacttype]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.toggleFeedReaction(btn.dataset.pid, btn.dataset.reacttype, btn);
      });
    });
    /* KF-7 #TASK-ES-014: 반응 4종 버튼·조언 패널 바인딩 + 서버 집계 갱신 */
    if(window.OurgoalReactions) window.OurgoalReactions.bind(body, blendedItems);

    // Toggle comments panel (#TASK-ES-133 서버 동기화 연동)
    body.querySelectorAll('[data-togglecomments]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var pid = btn.dataset.togglecomments;
        L.state.expandedComments = L.state.expandedComments || {};
        L.state.expandedComments[pid] = !L.state.expandedComments[pid];
        var panel = document.getElementById('cpanel_' + pid);
        if(panel){
          panel.style.display = L.state.expandedComments[pid] ? 'block' : 'none';
          if(L.state.expandedComments[pid]){
            L.loadServerFeedComments(pid);
            var inp = panel.querySelector('[data-cinput]');
            if(inp) inp.focus();
          }
        }
      });
    });

    // Quick replies
    body.querySelectorAll('[data-quickreply]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var pid = btn.dataset.quickreply;
        var qtext = btn.dataset.qtext;
        L.handleUserCommentSubmit(pid, qtext);
      });
    });

    // Send comment
    body.querySelectorAll('[data-sendcomment]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var pid = btn.dataset.sendcomment;
        var inp = body.querySelector('[data-cinput="'+pid+'"]');
        if(inp && inp.value.trim()){
          L.handleUserCommentSubmit(pid, inp.value.trim());
          inp.value = '';
        }
      });
    });

    // Enter key to send comment
    body.querySelectorAll('[data-cinput]').forEach(function(inp){
      inp.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          var pid = inp.dataset.cinput;
          if(inp.value.trim()){
            L.handleUserCommentSubmit(pid, inp.value.trim());
            inp.value = '';
          }
        }
      });
    });

    // Delete comment (#TASK-ES-133 Supabase 서버 동기 삭제)
    body.querySelectorAll('[data-delcomment]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var pid = btn.dataset.delcomment;
        var cid = btn.dataset.cid;
        var comments = L.getFeedComments(pid).filter(function(c){ return c.id !== cid; });
        L.setFeedComments(pid, comments);
        L.saveProfile();
        L.sb.from('team_pings').delete().eq('id', cid).eq('sender_id', L.state.profile.id).then(function(){});
        L.toast('댓글을 삭제했어요');
        renderCommFeed(body);
      });
    });

    // 피드 작성자 아바타/닉네임 클릭 -> 프로필 모달 조회 (#TASK-COMM-FEED-SOCIAL-BRIDGE)
    body.querySelectorAll('[data-feedprof]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var pid = el.dataset.feedprof;
        var post = blendedItems.find(function(x){ return x.id === pid; });
        if(!post && L.FEED_POSTS_CACHE){ post = L.FEED_POSTS_CACHE.find(function(x){ return x.id === pid; }); }
        if(!post) return;
        var pName = post.name || post.display_name || '아워골 메이커';
        var pAvatar = post.avatar || (pName ? pName.slice(0, 1) : '👤');
        var userObj = {
          id: post.userId || post.user_id || ('user_' + pName),
          nickname: pName,
          name: pName,
          avatar: pAvatar,
          goals: post.goal ? [post.goal] : (post.goal_title ? [post.goal_title] : ['아워골 목표 실천 중']),
          streak: 7,
          level: 2,
          theme: post.category || '목표 달성',
          intro: post.action || post.caption || (post.recordText ? post.recordText.slice(0, 80) : '매일 꾸준히 목표를 향해 나아가는 중입니다.'),
          isAiBot: !!post.is_ai
        };
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openUserProfileModal){
          window.OurgoalTeamInviteComm.openUserProfileModal(userObj);
        } else if(typeof L.openUserProfileModal === 'function'){
          L.openUserProfileModal(userObj);
        }
      });
    });

    // 피드 카드 내 동반자 추가 원탭 배선
    body.querySelectorAll('[data-feedcomp]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.stopPropagation();
        var pid = btn.dataset.feedcomp;
        var post = blendedItems.find(function(x){ return x.id === pid; });
        if(!post) return;
        var pName = post.name || post.display_name || '동반자';
        var userObj = {
          id: post.userId || post.user_id || ('user_' + pName),
          nickname: pName,
          name: pName,
          avatar: post.avatar || (pName ? pName.slice(0, 1) : '👤'),
          goals: post.goal ? [post.goal] : ['아워골 목표 실천 중'],
          streak: 7,
          level: 2,
          theme: post.category || '목표 달성',
          intro: post.action || '아워골 러닝메이트',
          isAiBot: !!post.is_ai
        };
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.ensureDefaultCompanions){
          var comps = window.OurgoalTeamInviteComm.ensureDefaultCompanions();
          var targetId = String(userObj.id || '').trim().toLowerCase();
          if(!comps.some(function(x){ return String(x.id || '').trim().toLowerCase() === targetId; })){
            comps.unshift(userObj);
            try { if(window.saveProfile) await window.saveProfile(); } catch(err){}
            if(window.OurgoalTeamInviteComm.persistCompanions) window.OurgoalTeamInviteComm.persistCompanions();
            btn.disabled = true;
            btn.textContent = '✓ 동반자';
            L.toast((userObj.nickname || userObj.name) + '님을 동반자로 추가했어요! 🎉');
          } else {
            L.toast('이미 등록된 동반자입니다.');
          }
        }
      });
    });

    // 피드 카드 내 1:1 응원 DM 원탭 배선
    body.querySelectorAll('[data-feeddm]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var pid = btn.dataset.feeddm;
        var post = blendedItems.find(function(x){ return x.id === pid; });
        if(!post) return;
        var pName = post.name || post.display_name || '동료';
        var pUid = post.userId || post.user_id || ('user_' + pName);
        L.state.activeTab = 'comm';
        L.state.commSubTab = 'dm';
        L.state.activeDmPeer = pUid;
        L.state.activeDmPeerName = pName;
        L.state.activeDmPeerAvatar = post.avatar || (pName ? pName.slice(0, 1) : '👤');
        if(typeof L.renderCommScreen === 'function') L.renderCommScreen();
      });
    });

    // 피드 카드 내 팀 목표 영입 초대 배선
    body.querySelectorAll('[data-feedscout]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var pid = btn.dataset.feedscout;
        var post = blendedItems.find(function(x){ return x.id === pid; });
        if(!post) return;
        var pName = post.name || post.display_name || '동료';
        var userObj = {
          id: post.userId || post.user_id || ('user_' + pName),
          nickname: pName,
          name: pName,
          avatar: post.avatar || (pName ? pName.slice(0, 1) : '👤'),
          streak: 7,
          isAiBot: !!post.is_ai
        };
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openScoutToTeamModal){
          window.OurgoalTeamInviteComm.openScoutToTeamModal(userObj);
        }
      });
    });

    // 피드 글 인앱 통합 공유 (동반자 DM · 팀 톡방 · 외부 SNS)
    body.querySelectorAll('[data-sharefeed]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var pid = btn.dataset.sharefeed;
        var post = blendedItems.find(function(x){ return x.id === pid; });
        if(!post) return;
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openFeedShareModal){
          window.OurgoalTeamInviteComm.openFeedShareModal(post);
        } else {
          var pTitle = post.goal ? ('"' + post.goal + '" 실천 기록') : (post.action || '목표 실천 기록');
          var pDesc = post.action || (post.recordText ? post.recordText.slice(0, 80) : '아워골에서 함께 응원하고 성장해요!');
          L.shareContent({ type: 'feed', id: post.id, title: pTitle, author: post.name || '동료', desc: pDesc, text: '[아워골 피드] ' + (post.name || '동료') + '님의 실천: "' + pTitle + '" 🔥' });
        }
      });
    });
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.wireTemplatesAccordionEvents){
      window.OurgoalTeamInviteComm.wireTemplatesAccordionEvents(body, function(){ renderCommFeed(body); });
    } else {
      var toggleTmplBtn = body.querySelector('#toggleTemplatesBtn');
      var toggleTmplBtnInner = body.querySelector('#toggleTemplatesBtnInner');
      function doToggleTemplates(e){
        if(e) e.stopPropagation();
        L.state.templatesExpanded = !L.state.templatesExpanded;
        renderCommFeed(body);
      }
      if(toggleTmplBtn) toggleTmplBtn.onclick = doToggleTemplates;
      if(toggleTmplBtnInner) toggleTmplBtnInner.onclick = doToggleTemplates;
      body.querySelectorAll('[data-tmpl]').forEach(function(btn){ btn.onclick = function(){ L.cloneTemplate(btn.dataset.tmpl, function(){ renderCommFeed(body); }); }; });
    }


    body.querySelectorAll('[data-react]').forEach(function(btn){
      btn.addEventListener('click', async function(e){
        e.preventDefault();
        e.stopPropagation();
        var id = btn.dataset.react;
        if(!id) return;
        if(!L.state.profile.settings.feedReactions) L.state.profile.settings.feedReactions = {};
        var wasReacted = !!L.state.profile.settings.feedReactions[id];
        L.state.profile.settings.feedReactions[id] = !wasReacted;
        var curPost = (L.FEED_POSTS_CACHE||[]).find(function(p){ return p.id === id; });
        if(curPost){
          curPost.cheers_count = Math.max(0, (curPost.cheers_count || 0) + (wasReacted ? -1 : 1));
        }
        btn.classList.toggle('active', !wasReacted);
        btn.textContent = '응원 ' + ((curPost && curPost.cheers_count) || 0);
        if(!wasReacted){
          if(navigator.vibrate) navigator.vibrate(15);
          L.toast('따뜻한 응원을 보냈어요! 🔥');
          try {
            await L.sb.rpc('increment_post_cheers', { p_post_id: id });
          } catch(err){}
        }
        await L.saveProfile();
      });
    });

    body.querySelectorAll('[data-delpost]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var id = btn.dataset.delpost;
        var res = await L.sb.from('feed_posts').delete().eq('id', id);
        if(res.error){
          // Offline delete fallback
        }
        L.FEED_POSTS_CACHE = (L.FEED_POSTS_CACHE||[]).filter(function(p){ return p.id!==id; });
        if(L.state.profile.settings.myFeedPosts){
          L.state.profile.settings.myFeedPosts = L.state.profile.settings.myFeedPosts.filter(function(p){ return p.id!==id; });
        }
        await L.saveProfile();
        L.toast('삭제했어요');
        renderCommFeed(body);
      });
    });

    body.querySelectorAll('[data-reportpost]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var id = btn.dataset.reportpost;
        if(!(await OurgoalCapabilities.call('ui.confirm', '이 게시물을 신고할까요? 신고가 여러 건 쌓이면 자동으로 숨겨져요.'))) return;
        btn.disabled = true;
        var res = await L.sb.rpc('report_content', { p_target_type: 'feed_post', p_target_id: id, p_reason: '' });
        if(res.error){
          if(!L.state.profile.settings.contentReports) L.state.profile.settings.contentReports = {};
          var localCount = (L.state.profile.settings.contentReports['local_rep_count:'+id] || 0) + 1;
          L.state.profile.settings.contentReports['local_rep_count:'+id] = localCount;
          L.state.profile.settings.contentReports['feed_post:'+id] = L.nowISO();
          if(localCount >= 3 && L.FEED_POSTS_CACHE){
            L.FEED_POSTS_CACHE.forEach(function(p){ if(p.id===id) p.hidden = true; });
          }
          L.toast(localCount >= 3 ? '신고가 누적되어 게시물이 숨겨졌어요' : '신고가 접수되었어요');
          await L.saveProfile();
          renderCommFeed(body);
          return;
        }
        if(!L.state.profile.settings.contentReports) L.state.profile.settings.contentReports = {};
        L.state.profile.settings.contentReports['feed_post:'+id] = L.nowISO();
        var hidden = !!(res.data && res.data.hidden);
        if(hidden && L.FEED_POSTS_CACHE){ L.FEED_POSTS_CACHE.forEach(function(p){ if(p.id===id) p.hidden = true; }); }
        L.track('content_reported', { target: 'feed_post', auto_hidden: hidden });
        L.toast(hidden ? '신고가 접수됐고 게시물이 숨겨졌어요' : '신고가 접수됐어요. 확인 후 조치할게요');
        await L.saveProfile();
        renderCommFeed(body);
      });
    });

    body.querySelectorAll('[data-blockuser]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.blockUser(btn.dataset.blockuser, btn.dataset.blockname);
      });
    });
  }

  K.feedPostHtml = feedPostHtml;
  K.renderCommFeed = renderCommFeed;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
