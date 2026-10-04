/**
 * OurGoal Community Feed Comments & Reactions (소통 탭 — 피드 댓글·리액션 헬퍼)
 *
 * #TASK-ES-379 (소통 탭 세포 이전 1차): index.html 인라인 IIFE 의 피드 댓글·리액션 헬퍼(#TASK-ES-133 서버 DB 실시간 동기화)를 동작 그대로 옮겼다.
 *   SERVER_FEED_COMMENTS_CACHE(이전 전 33194~33194줄)
 *   loadServerFeedComments(이전 전 33195~33238줄)
 *   getFeedComments(이전 전 33240~33272줄)
 *   setFeedComments(이전 전 33274~33277줄)
 *   handleUserCommentSubmit(이전 전 33279~33327줄)
 *   toggleFeedReaction(이전 전 33329~33358줄)
 * index.html 에 남은 피드 화면(renderCommFeed)과 실시간 구독(setupFeedPostsRealtime)이 IIFE 머리에서 같은 이름으로 가져와 부른다.
 * SERVER_FEED_COMMENTS_CACHE 는 loadServerFeedComments 만 쓰는 빈 객체라 이 파일 안 변수로 같이 옮겼다(키트에 달지 않는다).
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 소통 파일로 간 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트(OurgoalCommKit)의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 선례: 목표 탭 #TASK-ES-370 · #TASK-ES-375. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 소통 키트: 소통 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  var SERVER_FEED_COMMENTS_CACHE = {};
  async function loadServerFeedComments(postId){
    if(!postId) return;
    try {
      var res = await L.sb.from('team_pings').select('*').eq('group_id', 'feed').eq('target_type', 'feed_comment').eq('target_id', postId).order('created_at', { ascending: true });
      if(res.data && res.data.length){
        var localList = getFeedComments(postId), changed = false;
        res.data.forEach(function(row){
          if(!localList.some(function(c){ return c.id === row.id; })){
            localList.push({ id: row.id, userId: row.sender_id, name: row.sender_name || '동료', avatar: row.sender_avatar || '👤', text: row.message, time: L.fmtTime(row.created_at) || '방금', isMe: (row.sender_id === (L.state.profile ? L.state.profile.id : '')), is_ai: false, createdAt: row.created_at });
            changed = true;
          }
        });
        if(changed){
          setFeedComments(postId, localList);
          SERVER_FEED_COMMENTS_CACHE[postId] = localList;
          var subBody = document.getElementById('commSubBody');
          if(subBody && L.state.activeTab === 'comm' && L.state.commSubTab === 'feed'){
            var cListEl = subBody.querySelector('#cpanel_' + postId + ' .feed-comments-list');
            if(cListEl && localList.length){
              cListEl.innerHTML = localList.map(function(c){
                var cIsMe = c.isMe || (c.userId === (L.state.profile ? L.state.profile.id : ''));
                var cBadge = c.is_ai ? '<span class="feed-c-badge badge-ai">AI봇</span>' : (cIsMe ? '<span class="feed-c-badge badge-author">나</span>' : '');
                return '<div class="feed-comment-bubble'+(cIsMe?' me-comment':'')+'">' +
                  '<div class="feed-c-avatar'+(cIsMe?' me':'')+'">'+L.escapeHtml(c.avatar||'👤')+'</div>' +
                  '<div class="feed-c-body">' +
                    '<div class="feed-c-meta">' +
                      '<span class="feed-c-author">'+L.escapeHtml(c.name)+cBadge+'</span>' +
                      '<div style="display:flex;align-items:center;gap:6px;">' +
                        '<span class="feed-c-time">'+L.escapeHtml(c.time||'방금')+'</span>' +
                        (cIsMe ? '<button class="feed-c-del" data-delcomment="'+postId+'" data-cid="'+c.id+'" type="button" title="삭제">×</button>' : '') +
                      '</div>' +
                    '</div>' +
                    '<div class="feed-c-text">'+L.escapeHtml(c.text)+'</div>' +
                  '</div>' +
                '</div>';
              }).join('');
            }
          }
        }
      }
    } catch(e){
      console.warn('[FeedComment] loadServerFeedComments error:', e);
    }
  }

  function getFeedComments(postId){
    if(!L.state.profile.settings.feedComments) L.state.profile.settings.feedComments = {};
    if(!L.state.profile.settings.feedComments[postId]){
      // 대표 가상 페르소나 게시물에 초기 활성 댓글을 시딩하여 생동감 넘치는 커뮤니티 조성
      if(postId === 'sim_p01'){
        L.state.profile.settings.feedComments[postId] = [
          { id:'sc_1', name:'박준서', avatar:'준', text:'토익 900점 꼭 넘기실 겁니다! 도서관 출석 파이팅 🔥', time:'20분 전', is_ai:true },
          { id:'sc_2', name:'김서연', avatar:'서', text:'아침 일찍부터 대단하세요! 오답노트 꼼꼼히 하시면 금방 점수 올라요 👍', time:'10분 전', is_ai:true }
        ];
      } else if(postId === 'sim_p02'){
        L.state.profile.settings.feedComments[postId] = [
          { id:'sc_3', name:'이지민', avatar:'지', text:'DP 골드 문제 진짜 어려운데 점심시간 쪼개서 풀다니 대단해요 💻', time:'45분 전', is_ai:true }
        ];
      } else if(postId === 'sim_p03'){
        L.state.profile.settings.feedComments[postId] = [
          { id:'sc_4', name:'정예린', avatar:'예', text:'MVP 론칭 진심으로 응원합니다! 출시되면 바로 테스트해볼게요 ✨', time:'1시간 전', is_ai:true }
        ];
      } else if(postId === 'sim_p21'){
        L.state.profile.settings.feedComments[postId] = [
          { id:'sc_5', name:'최수빈', avatar:'수', text:'국시 모의고사 점수 상승 축하드려요! 끝까지 컨디션 조절 잘 하세요 👏', time:'15분 전', is_ai:true }
        ];
      } else {
        L.state.profile.settings.feedComments[postId] = [];
      }
    }
    var comments = L.state.profile.settings.feedComments[postId] || [];
    // [#TASK-ES-312, 61] 실 유저 20명 초과 시 AI 댓글 전면 제거 (0건)
    var curRealCount = (L.FEED_POSTS_CACHE || []).length;
    if(curRealCount > 20){
      return comments.filter(function(c){ return !c.is_ai; });
    }
    return comments;
  }

  function setFeedComments(postId, list){
    if(!L.state.profile.settings.feedComments) L.state.profile.settings.feedComments = {};
    L.state.profile.settings.feedComments[postId] = list;
  }

  function handleUserCommentSubmit(postId, text){
    if(!text || !text.trim()) return;
    var trimmed = text.trim();
    var list = getFeedComments(postId);
    var cId = 'fc_' + L.newId();
    list.push({
      id: cId,
      userId: L.state.profile.id,
      name: L.state.profile.displayName || '나',
      avatar: (L.state.profile.displayName || '나').slice(0, 1),
      text: trimmed,
      time: '방금',
      isMe: true,
      is_ai: false,
      createdAt: L.nowISO()
    });
    setFeedComments(postId, list);
    L.state.expandedComments = L.state.expandedComments || {};
    L.state.expandedComments[postId] = true;
    L.saveProfile();
    L.triggerHaptic(10);
    L.toast('댓글을 등록했어요!');

    // Supabase team_pings 서버 실시간 영구 동기화 (#TASK-ES-133)
    var cmtRow = {
      id: cId,
      group_id: 'feed',
      sender_id: L.state.profile.id,
      sender_name: L.state.profile.displayName || '나',
      sender_avatar: (L.state.profile.displayName || '나').slice(0, 1),
      receiver_id: '',
      target_type: 'feed_comment',
      target_id: postId,
      target_title: '피드 게시물',
      ping_type: 'comment',
      message: trimmed,
      status: 'sent',
      hidden: false,
      created_at: L.nowISO()
    };
    L.sb.from('team_pings').insert(cmtRow).then(function(res){
      if(res.error) console.warn('[FeedComment] Supabase insert warn:', res.error.message);
    });

    var subBody = document.getElementById('commSubBody');
    if(subBody && L.state.activeTab === 'comm' && L.state.commSubTab === 'feed') L.renderCommFeed(subBody);

    // [TASK-ES-332] 가짜 봇 즉각 답글 상호작용 완전 제거
  }

  async function toggleFeedReaction(postId, rType, btn){
    var s = L.state.profile.settings;
    if(!s.feedReactions) s.feedReactions = {};
    var rKey = postId + ':' + rType;
    var nowOn = !s.feedReactions[rKey];
    if(nowOn) s.feedReactions[rKey] = true;
    else delete s.feedReactions[rKey];

    // 기존 호환성 유지
    if(nowOn) s.feedReactions[postId] = true;

    if(nowOn){
      L.triggerHaptic(12);
      var rect = btn.getBoundingClientRect();
      L.burstConfetti(rect.left + rect.width / 2, rect.top, 8);
      L.track('cheer_sent', { source: 'feed', goal_type: null, day_index: L.dayIndexSinceSignup(), post_id: postId, reaction: rType });
    }
    await L.saveProfile();

    var post = (L.FEED_POSTS_CACHE || []).find(function(p){ return p.id === postId; });
    if(post){
      var delta = nowOn ? 1 : -1;
      var res = await L.sb.rpc('increment_post_cheers', { p_post_id: postId, p_delta: delta });
      if(!res.error && typeof res.data === 'number') post.cheers_count = res.data;
      else post.cheers_count = Math.max(0, (post.cheers_count || 0) + delta);
    }

    var subBody = document.getElementById('commSubBody');
    if(subBody && L.state.activeTab === 'comm' && L.state.commSubTab === 'feed') L.renderCommFeed(subBody);
  }

  K.loadServerFeedComments = loadServerFeedComments;
  K.getFeedComments = getFeedComments;
  K.setFeedComments = setFeedComments;
  K.handleUserCommentSubmit = handleUserCommentSubmit;
  K.toggleFeedReaction = toggleFeedReaction;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
