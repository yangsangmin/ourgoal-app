/**
 * OurGoal Feed Posts Sync (소통 탭 — 피드 글 불러오기·실시간 동기화)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G158.
 *   옮긴 선언(이전 전 줄): ensureFeedPostsLoaded(31106~31111) · setupFeedPostsRealtime(31112~31165)
 * ensureFeedPostsLoaded = Supabase feed_posts 를 한 번 불러와 캐시(FEED_POSTS_CACHE — 여러 곳이 다시 대입하므로 index.html 에 남고 통로로 읽고 쓴다), setupFeedPostsRealtime = 실시간 구독(팀 댓글·피드·사용자 세션 채널).
 * 시험지 guest-null-client-es377 은 #TASK-ES-447 로 인라인 합본을 읽는다.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  async function ensureFeedPostsLoaded(){
    if(L.FEED_POSTS_CACHE) return;
    L.FEED_POSTS_CACHE = []; if(!L.sb) return;
    var res = await L.sb.from('feed_posts').select('*').order('created_at', { ascending:false }).limit(50);
    L.FEED_POSTS_CACHE = res.data || [];
  }

  function setupFeedPostsRealtime(){ if(!L.sb || typeof L.sb.channel !== 'function') return;
    function rerenderIfFeedVisible(){
      if(L.state.activeTab!=='comm' || L.state.commSubTab!=='feed') return;
      var subBody = document.getElementById('commSubBody');
      if(subBody) L.renderCommFeed(subBody);
    }
    L.sb.channel('feed_posts_channel')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'feed_posts' }, function(payload){
        if(!L.FEED_POSTS_CACHE) return;
        if(L.FEED_POSTS_CACHE.some(function(p){ return p.id===payload.new.id; })) return;
        L.FEED_POSTS_CACHE.unshift(payload.new);
        rerenderIfFeedVisible();
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'feed_posts' }, function(payload){
        if(!L.FEED_POSTS_CACHE) return;
        var idx = L.FEED_POSTS_CACHE.findIndex(function(p){ return p.id===payload.new.id; });
        if(idx>-1) L.FEED_POSTS_CACHE[idx] = payload.new;
        rerenderIfFeedVisible();
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'team_pings' }, function(payload){
        var row = payload.new;
        if(row && row.group_id === 'feed' && row.target_type === 'feed_comment'){
          var pid = row.target_id;
          var curList = L.getFeedComments(pid);
          if(!curList.some(function(c){ return c.id === row.id; })){
            curList.push({
              id: row.id,
              userId: row.sender_id,
              name: row.sender_name || '동료',
              avatar: row.sender_avatar || '👤',
              text: row.message,
              time: '방금',
              isMe: (row.sender_id === (L.state.profile ? L.state.profile.id : '')),
              is_ai: false,
              createdAt: row.created_at
            });
            L.setFeedComments(pid, curList);
            rerenderIfFeedVisible();
          }
        } else if(row && row.group_id === 'shared_groups' && row.target_type === 'team_group'){
          try {
            var g = typeof row.message === 'string' ? JSON.parse(row.message) : row.message;
            if(g && g.id && !L.MOCK_GROUPS.some(function(x){ return x.id === g.id; })){
              L.MOCK_GROUPS.unshift(g);
              if(L.state.activeTab === 'comm' && L.state.commSubTab === 'group'){
                var commBody = document.getElementById('commSubBody');
                if(commBody && !L.state.activeGroupId) L.renderCommGroups(commBody);
              }
            }
          } catch(e){}
        }
      })
      .subscribe();
  }

  K.ensureFeedPostsLoaded = ensureFeedPostsLoaded;
  K.setupFeedPostsRealtime = setupFeedPostsRealtime;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
