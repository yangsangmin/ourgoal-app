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

  // [T-P3-05] 소통 피드 N+1 쿼리 제거 및 커서 기반 페이지네이션 (LIMIT 20)
  var FEED_PAGE_LIMIT = 20;

  async function batchHydrateFeedComments(postIds) {
    if (!L.sb || !Array.isArray(postIds) || postIds.length === 0) return {};
    try {
      var q = L.sb.from('team_pings').select('*').eq('group_id', 'feed').eq('target_type', 'feed_comment').in('target_id', postIds).order('created_at', { ascending: true });
      var res = await q;
      var byPost = {};
      ((res && res.data) || []).forEach(function (row) {
        if (!row || !row.target_id) return;
        byPost[row.target_id] = byPost[row.target_id] || [];
        byPost[row.target_id].push(row);
      });
      return byPost;
    } catch (_) {
      return {};
    }
  }

  async function loadFeedPostsPage(cursorCreatedAt, limit) {
    var pageSize = Math.min(50, Math.max(1, Number(limit) || FEED_PAGE_LIMIT));
    if (!L.sb) return { items: [], nextCursor: null, limit: pageSize };
    var query = L.sb.from('feed_posts').select('*').order('created_at', { ascending: false });
    if (cursorCreatedAt && typeof query.lt === 'function') {
      query = query.lt('created_at', cursorCreatedAt);
    }
    var res = await query.limit(pageSize);
    var items = (res && res.data) || [];
    var postIds = items.map(function (p) { return p && p.id; }).filter(Boolean);
    var commentsMap = await batchHydrateFeedComments(postIds);
    items.forEach(function (item) {
      if (item && item.id && commentsMap[item.id]) {
        item._hydratedComments = commentsMap[item.id];
      }
    });
    var nextCursor = items.length === pageSize ? (items[items.length - 1].created_at || null) : null;
    L.FEED_NEXT_CURSOR = nextCursor;
    return { items: items, nextCursor: nextCursor, limit: pageSize };
  }

  async function ensureFeedPostsLoaded(){
    if(L.FEED_POSTS_CACHE) return;
    L.FEED_POSTS_CACHE = []; if(!L.sb) return;
    var res = await L.sb.from('feed_posts').select('*').order('created_at', { ascending:false }).limit(FEED_PAGE_LIMIT);
    L.FEED_POSTS_CACHE = res.data || [];
    /* #TASK-ES-696 소통-피드 0단계: 최신 50건만으로는 내 목표 카테고리 글이 거의 안 잡힌다(독립 검토 B1).
       내 활성 목표의 피드 카테고리 글을 따로 50건 더 받아 합친다. category 칸이 아직 없는 서버면(SQL 미실행) 조용히 건너뛴다. */
    try {
      var CM = global.OurgoalCategoryMap;
      var goals = (L.state && L.state.profile && L.state.profile.goals) || [];
      var cats = [];
      if(CM) goals.forEach(function(g){ if(g && !g.archivedAt){ var k = CM.fromGoal(g); if(k && cats.indexOf(k) === -1) cats.push(k); } });
      if(cats.length){
        var res2 = await L.sb.from('feed_posts').select('*').in('category', cats).order('created_at', { ascending:false }).limit(FEED_PAGE_LIMIT);
        if(res2 && !res2.error && res2.data){
          var seen = {};
          L.FEED_POSTS_CACHE.forEach(function(p){ if(p && p.id) seen[p.id] = true; });
          res2.data.forEach(function(p){ if(p && p.id && !seen[p.id]){ seen[p.id] = true; L.FEED_POSTS_CACHE.push(p); } });
          L.FEED_POSTS_CACHE.sort(function(a,b){ return String(b.created_at||'').localeCompare(String(a.created_at||'')); });
        }
      }
    } catch(e){ /* 칸 없음·네트워크 — 기본 50건으로 간다 */ }
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

  K.FEED_PAGE_LIMIT = FEED_PAGE_LIMIT;
  K.loadFeedPostsPage = loadFeedPostsPage;
  K.batchHydrateFeedComments = batchHydrateFeedComments;
  K.ensureFeedPostsLoaded = ensureFeedPostsLoaded;
  K.setupFeedPostsRealtime = setupFeedPostsRealtime;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalCommKit;
  if (K) R.provide('comm/feed-posts-sync', {
    ensureFeedPostsLoaded: K.ensureFeedPostsLoaded, setupFeedPostsRealtime: K.setupFeedPostsRealtime
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
