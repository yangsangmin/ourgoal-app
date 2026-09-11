/* ============================================================
 * 아워골 — 카테고리별 "도움이 된 글" 상단 슬롯 (KF-4, #TASK-ES-018, 본질 ③)
 *
 * 같은 주제(피드 카테고리 칩)에서 도움돼요를 많이 받은 사람의 최신 글을 그 주제
 * 피드 맨 위에 최대 2개 보여 준다. 규칙:
 *  - '전체' 칩에서는 슬롯을 만들지 않는다(전 카테고리 통합 점수 금지 — 동류성 유지).
 *  - 서버 RPC top_helpful_posts 가 돌려준 실데이터만 쓴다. 결과 0이면 슬롯 자체가 없다.
 *  - 봇·시뮬 글(sim_ 접두)·숨김 글·자기 반응은 RPC 에서 이미 제외된다. 여기서도 한 번 더 거른다.
 *  - 순위 숫자·"N위"·"TOP" 같은 서열 문구는 쓰지 않는다. 라벨은 "이 주제에서 도움이 된 글".
 *  - RPC 가 아직 서버에 없으면(PGRST202/404) 조용히 포기하고 다시 시도하지 않는다.
 *
 * index.html 훅 2곳: renderCommFeed 안에서 arrange(items, curCat, ctx) / 카드 앞 labelHtml().
 * ============================================================ */
(function () {
  'use strict';

  var WINDOW_DAYS = 30;   // 결심 D-1 권장값: 최근 30일 창(영구 상단 방지)
  var SLOT_LIMIT = 2;     // 결심 D-2 권장값: 카테고리당 2개(시간순 피드를 밀어내지 않는 최소)
  var TTL_MS = 5 * 60 * 1000;
  var LABEL = '이 주제에서 도움이 된 글';

  var deps = null;            // { sb }
  var serverOk = null;        // null=미확인, false=RPC 없음(재시도 안 함)
  var byCat = {};             // cat -> { ids:[], at:number, loading:boolean }
  var injected = {};          // 캐시에 우리가 끼워 넣은 글 id → true (다른 카테고리에선 빼 준다)

  function init(d) { deps = d || null; }

  function isSlotCategory(cat) {
    return !!cat && cat !== 'all';
  }

  function missingSchema(err) {
    if (!err) return false;
    var code = String(err.code || '');
    var msg = String(err.message || '');
    return code === 'PGRST202' || code === 'PGRST205' || code === '42883' || code === '42P01' ||
      /Could not find the function|does not exist|schema cache/i.test(msg) || Number(err.status) === 404;
  }

  function isBotItem(it) {
    if (!it) return true;
    if (it.is_ai) return true;
    var id = String(it.id || '');
    return id.indexOf('sim_') === 0;
  }

  /* 서버에서 카테고리별 상단 글을 가져와 캐시. 새 글이 피드 캐시(ctx.posts)에 없으면 끼워 넣고 rerender. */
  function fetchFor(cat, ctx) {
    if (!deps || !deps.sb || serverOk === false) return;
    var entry = byCat[cat] || (byCat[cat] = { ids: [], at: 0, loading: false });
    if (entry.loading) return;
    entry.loading = true;
    var p;
    try {
      p = deps.sb.rpc('top_helpful_posts', { p_category: cat, p_days: WINDOW_DAYS, p_limit: SLOT_LIMIT });
    } catch (e) { entry.loading = false; return; }
    Promise.resolve(p).then(function (res) {
      entry.loading = false;
      if (res && res.error) {
        if (missingSchema(res.error)) serverOk = false;
        entry.at = Date.now();
        return;
      }
      serverOk = true;
      var rows = (res && res.data) || [];
      var ids = [];
      var added = false;
      rows.forEach(function (r) {
        var post = r && r.post;
        if (!post || !post.id) return;
        var id = String(post.id);
        if (id.indexOf('sim_') === 0 || post.hidden) return;
        ids.push(id);
        if (ctx && Array.isArray(ctx.posts)) {
          var exists = ctx.posts.some(function (p) { return p && String(p.id) === id; });
          if (!exists) { ctx.posts.push(post); injected[id] = true; added = true; }
        }
      });
      var changed = ids.join(',') !== entry.ids.join(',');
      entry.ids = ids;
      entry.at = Date.now();
      if ((changed || added) && ctx && typeof ctx.rerender === 'function') {
        try { ctx.rerender(); } catch (e) { /* 렌더 실패는 조용히 */ }
      }
    }).catch(function () { entry.loading = false; entry.at = Date.now(); });
  }

  /* renderCommFeed 훅: 현재 카테고리의 상단 글을 맨 앞으로 옮기고 첫 글에 라벨 표시를 단다.
     결과가 없으면 items 를 그대로(끼워 넣었던 다른 카테고리 글만 제거) 돌려준다. */
  function arrange(items, cat, ctx) {
    var list = (items || []).slice();
    // 우리가 끼워 넣은 글은 그 카테고리 상단 슬롯일 때만 남긴다
    var entry = isSlotCategory(cat) ? byCat[cat] : null;
    var topIds = entry ? entry.ids : [];
    list = list.filter(function (it) {
      var id = String(it && it.id || '');
      if (!injected[id]) return true;
      return topIds.indexOf(id) > -1;
    });
    list.forEach(function (it) { if (it) { delete it._topHelpful; delete it._topHelpfulLabel; } });

    if (!isSlotCategory(cat)) return list;

    if (!entry || (Date.now() - entry.at > TTL_MS && !entry.loading)) fetchFor(cat, ctx);
    if (!topIds.length) return list;

    var top = [];
    var rest = [];
    list.forEach(function (it) {
      var id = String(it && it.id || '');
      if (!isBotItem(it) && topIds.indexOf(id) > -1) top.push(it); else rest.push(it);
    });
    if (!top.length) return list;
    top.sort(function (a, b) { return topIds.indexOf(String(a.id)) - topIds.indexOf(String(b.id)); });
    top = top.slice(0, SLOT_LIMIT);
    top.forEach(function (it, i) { it._topHelpful = true; if (i === 0) it._topHelpfulLabel = true; });
    return top.concat(rest);
  }

  /* 슬롯 라벨(첫 상단 글 바로 위). 서열 문구 없음, 광고 자리와 분리된 독립 블록. */
  function labelHtml() {
    return '<div class="faint" data-top-helpful-label="1" style="display:flex;align-items:center;gap:6px;margin:2px 0 8px;font-size:.78rem;font-weight:700;">' +
      '<span>💡</span><span>' + LABEL + '</span>' +
      '<span style="font-weight:400;opacity:.8;">· 최근 ' + WINDOW_DAYS + '일 도움돼요 기준</span></div>';
  }

  window.OurgoalTopHelpful = {
    LABEL: LABEL, WINDOW_DAYS: WINDOW_DAYS, SLOT_LIMIT: SLOT_LIMIT,
    init: init, arrange: arrange, labelHtml: labelHtml, missingSchema: missingSchema,
    _state: function () { return { serverOk: serverOk, byCat: byCat, injected: injected }; }
  };
})();
