/* ============================================================
 * 아워골 — 소통 피드 묶음·정렬 (소통-피드 알고리즘 1단계, #TASK-ES-698, 본질 ③ 동류 발견·소통)
 *
 * 무엇을 하나: 피드 글을 "이 사람의 목표 전진에 도움이 되는가"로 골라 다섯 묶음으로 보여 준다.
 *   1 내 팀 소식 · 2 내 목표에 도움될 글 · 3 같은 길 가는 사람들 · 4 넓히기 · 5 마감선(그 아래는 예전 최신순)
 * 점수 하나: score = R(관련성) × V(유익성) × F(신선도). 체류시간·조회수·클릭률은 어디에도 없다(피드 노출 규범 1).
 *
 * 규칙(피드 노출 규범 · 정본 「아워골 소통-피드 알고리즘 정립 보고서」 3-1~3-7·4-1·4-2절):
 *  - 카테고리 칩 '전체' · 피드 유형 '전체' 일 때만 묶음을 만든다. 다른 칩에서는 예전 동작(최신순 + KF-4 상단 슬롯) 그대로.
 *  - 추천 묶음(1~4)의 모든 카드에 "왜 보이나요" 사유 라벨 1개. 사유를 못 만드는 글은 추천에 넣지 않는다. 상대 비교 수치는 쓰지 않는다.
 *  - 봇·시뮬 글, 차단한 사람 글, 내 글은 추천 묶음에 넣지 않는다(내 글은 마감선 아래 최신순에 그대로).
 *  - 하루 추천 상한(dailyCap): 오늘 추천으로 보여 준 글 id 를 기기에 적어 두고, 상한을 넘기는 새 글은 추천하지 않는다(마감선 아래로).
 *  - 묶음 2 가 3건 미만이면(콜드스타트) 묶음 2·4 를 숨기고 1·3 만 보여 준다 — "최신순과 똑같다"는 체감을 숨기지 않는다.
 *  - 가중치는 이 파일의 DEFAULTS 한 곳에만 있다(1단계 임시). 2단계에서 서버 설정표 feed_settings 가 덮어쓴다.
 *  - 유익성 V 는 js/reactions.js 가 서버에서 받아 둔 반응 집계(count_content_reactions)만 쓴다. 집계가 없으면 V=1(개인화는 R·F 로만).
 *  - 정렬 키는 score ↓ → createdAt ↓ → id 로 고정(실시간 재렌더에도 순서가 흔들리지 않게).
 *
 * 순수 함수다(DOM·네트워크 없음). 브라우저에서는 window.OurgoalFeedRank, node 시험지에서는 module.exports.
 * ============================================================ */
(function (global) {
  'use strict';

  var DEFAULTS = {
    wGoal: 1.0, wTeam: 1.2, wTopic: 0.3, wComp: 0.7, wStage: 0.3, rMin: 0.2, rMax: 2.0,
    activeDays: 14, activeW: 1.0, idleW: 0.6,
    wH: 0.6, k: 3, poorRatioPenalty: 0.3, poorPenalty: 0.5, adviceBonus: 0.2,
    tau0h: 72, tauMaxMult: 3, tauHelpfulDiv: 5, tauHelpfulCap: 10, staleDays: 30,
    sections: { team: 3, help: 7, peers: 5, widen: 2 }, teamHours: 48,
    dailyCap: 30, sameAuthorMax: 2, catShareMax: 0.6, coldstartMin: 3, vLabelMin: 1.5
  };

  var SECTION_TITLE = {
    team:  { title: '내 팀 소식', sub: '가입한 팀의 최근 실천' },
    help:  { title: '내 목표에 도움될 글', sub: '같은 주제에서 도움이 됐다고 표시된 글' },
    peers: { title: '같은 길 가는 사람들', sub: '내 목표 주제의 최근 실천' },
    widen: { title: '넓히기', sub: '가까운 주제에서 도움이 된 글' }
  };
  var CUTOFF_TEXT = '오늘 볼 글은 여기까지 — 아래는 전체 최신순';

  function num(x, d) { var n = Number(x); return isFinite(n) ? n : d; }
  function hoursBetween(aIso, nowMs) {
    var t = Date.parse(aIso || '');
    if (!isFinite(t)) return null;
    return Math.max(0, (nowMs - t) / 36e5);
  }

  /* ---- 사용자 컨텍스트: 전부 이미 profile 에 있는 것만 쓴다(새 수집 0) ---- */
  function buildContext(profile, deps) {
    deps = deps || {};
    var CM = deps.categoryMap || (global && global.OurgoalCategoryMap) || null;
    var now = num(deps.now, Date.now());
    var ctx = { meId: null, goalCats: {}, goalMajors: {}, goalTopics: [], stageByCat: {}, teamIds: [], teamCats: {}, companionIds: [], blockedIds: [], enabled: false, hasGoals: false };
    if (!profile) return ctx;
    ctx.meId = profile.id || null;
    var settings = profile.settings || {};
    ctx.blockedIds = (settings.blockedUsers || []).map(function (b) { return String((b && (b.id || b.userId)) || b || ''); }).filter(Boolean);
    ctx.companionIds = (profile.companions || []).map(function (c) { return String((c && c.id) || ''); }).filter(Boolean);

    var records = profile.records || [];
    var activeSince = now - DEFAULTS.activeDays * 864e5;
    function goalActive(g) {
      var created = Date.parse(g.createdAt || '');
      if (isFinite(created) && created >= activeSince) return true;
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (!r || r.goalId !== g.id) continue;
        var t = Date.parse(r.createdAt || r.startAt || '');
        if (isFinite(t) && t >= activeSince) return true;
      }
      return false;
    }
    (profile.goals || []).forEach(function (g) {
      if (!g || g.archivedAt) return;
      var key = CM ? CM.fromGoal(g) : null;
      if (!key) return;
      ctx.hasGoals = true;
      var w = goalActive(g) ? DEFAULTS.activeW : DEFAULTS.idleW;
      ctx.goalCats[key] = Math.max(ctx.goalCats[key] || 0, w);
      if (CM && CM.FEED_MAJOR[key]) ctx.goalMajors[CM.FEED_MAJOR[key]] = true;
      if (g.topic) ctx.goalTopics.push(String(g.topic));
      var pct = typeof deps.goalProgress === 'function' ? num(deps.goalProgress(g), null) : null;
      if (pct !== null) ctx.stageByCat[key] = Math.max(ctx.stageByCat[key] || 0, pct);
    });

    var groups = deps.groups || [];
    groups.forEach(function (g) {
      if (!g || !g.id) return;
      var joined = false;
      try { joined = typeof deps.groupState === 'function' ? !!deps.groupState(g.id).joined : false; } catch (e) { joined = false; }
      if (!joined) return;
      ctx.teamIds.push(String(g.id));
      var key = CM && g.topic ? CM.fromTopic(g.topic) : null;
      if (key) ctx.teamCats[key] = true;
      ctx.teamNames = ctx.teamNames || {};
      ctx.teamNames[String(g.id)] = g.name || '';
    });

    ctx.enabled = ctx.hasGoals || ctx.teamIds.length > 0;
    return ctx;
  }

  /* ---- 글 하나의 신호 ---- */
  function majorOfTopic(topic) {
    if (!topic) return null;
    return String(topic).split('/')[0].trim() || null;
  }

  function relevance(it, ctx, s) {
    var terms = [];
    var cat = it.category || null;
    var gw = cat && ctx.goalCats[cat] ? ctx.goalCats[cat] : 0;
    if (gw) terms.push({ key: 'goal', v: s.wGoal * gw });
    var teamHit = it.groupId && ctx.teamIds.indexOf(String(it.groupId)) > -1;
    if (teamHit) terms.push({ key: 'team', v: s.wTeam * 1.0 });
    else if (cat && ctx.teamCats[cat]) terms.push({ key: 'teamCat', v: s.wTeam * 0.6 });
    if (it.topic && ctx.goalTopics.length) {
      if (ctx.goalTopics.indexOf(String(it.topic)) > -1) terms.push({ key: 'topic', v: s.wTopic * 1.0 });
      else if (ctx.goalMajors[majorOfTopic(it.topic)]) terms.push({ key: 'topicMajor', v: s.wTopic * 0.4 });
    }
    if (it.userId && ctx.companionIds.indexOf(String(it.userId)) > -1) terms.push({ key: 'comp', v: s.wComp });
    var myPct = cat && typeof ctx.stageByCat[cat] === 'number' ? ctx.stageByCat[cat] : null;
    var theirPct = typeof it.authorPct === 'number' ? it.authorPct : (typeof it.pct === 'number' ? it.pct : null);
    if (gw && myPct !== null && theirPct !== null) {
      var d = theirPct - myPct;
      if (d >= 25) terms.push({ key: 'ahead', v: s.wStage * 1.0 });
      else if (d > -25) terms.push({ key: 'same', v: s.wStage * 0.6 });
      else terms.push({ key: 'behind', v: s.wStage * 0.2 });
    }
    var sum = 0; terms.forEach(function (t) { sum += t.v; });
    var R = Math.min(s.rMax, Math.max(s.rMin, sum));
    terms.sort(function (a, b) { return b.v - a.v; });
    return { R: R, terms: terms, raw: sum };
  }

  function value(it, counts, s) {
    var c = counts || null;
    if (!c) return { V: 1, helpful: 0, poor: 0 };
    var helpful = num(c.helpful, 0), poor = num(c.poor, 0), cheer = num(c.cheer, 0), advice = num(c.advice, 0);
    var n = helpful + poor + cheer;
    var V = 1 + s.wH * Math.log(1 + helpful) * (n / (n + s.k));
    if (n > 0 && poor / n > s.poorRatioPenalty) V *= s.poorPenalty;
    if (advice > 0) V += s.adviceBonus;
    return { V: V, helpful: helpful, poor: poor };
  }

  function freshness(it, helpful, s, nowMs) {
    var age = hoursBetween(it.createdAt, nowMs);
    if (age === null) return { F: 0.5, ageH: null };   /* 시각 없는 글(내 목표 카드 등)은 중간값 */
    var mult = 1 + Math.min(helpful || 0, s.tauHelpfulCap) / s.tauHelpfulDiv;
    var tau = s.tau0h * Math.min(s.tauMaxMult, mult);
    return { F: Math.exp(-age / tau), ageH: age };
  }

  function score(it, ctx, s, counts, nowMs) {
    var r = relevance(it, ctx, s);
    var v = value(it, counts, s);
    var f = freshness(it, v.helpful, s, nowMs);
    return { score: r.R * v.V * f.F, R: r.R, V: v.V, F: f.F, terms: r.terms, helpful: v.helpful, ageH: f.ageH };
  }

  /* ---- 사유 라벨: R 의 가장 큰 항 하나 + (V 가 크면) 도움돼요 수(실데이터, 0이면 생략) ---- */
  function reasonFor(it, ctx, sc, s) {
    var CM = (global && global.OurgoalCategoryMap) || null;
    var top = sc.terms && sc.terms[0];
    if (!top) return null;
    var catLabel = (CM && it.category && CM.FEED_LABEL[it.category]) || '내 목표';
    var text = null;
    switch (top.key) {
      case 'team': text = '내 팀 「' + ((ctx.teamNames && ctx.teamNames[String(it.groupId)]) || '팀') + '」의 실천'; break;
      case 'teamCat': text = '내 팀과 같은 주제 · ' + catLabel; break;
      case 'goal': text = catLabel + ' 목표와 같은 주제'; break;
      case 'topic': text = '나랑 같은 「' + String(it.topic).split('/').slice(1).join('/') + '」 목표'; break;
      case 'topicMajor': text = catLabel + ' 목표와 가까운 주제'; break;
      case 'comp': text = '동반자 ' + (it.name || '') + '의 새 글'; break;
      case 'ahead': text = '한 걸음 앞서 간 경험 · ' + catLabel; break;
      case 'same': text = '같은 출발선 · ' + catLabel; break;
      case 'behind': text = catLabel + ' 목표와 같은 주제'; break;
      default: return null;
    }
    /* 진행 단계는 보조 사유: 수치 없이 한 마디만(규범 5 — 상대 비교 수치 금지) */
    if (top.key !== 'ahead' && top.key !== 'same' && sc.terms.some(function (t) { return t.key === 'ahead'; })) text += ' · 한 걸음 앞서 간 경험';
    if (sc.V >= s.vLabelMin && sc.helpful > 0) text += ' · 도움돼요 ' + sc.helpful;
    return text;
  }

  /* ---- 하루 추천 상한 상태 ---- */
  function dateKey(nowMs) { var d = new Date(nowMs); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function loadDaily(storage, nowMs) {
    var key = 'feed_daily_' + dateKey(nowMs);
    try {
      var raw = storage && storage.getItem ? storage.getItem(key) : null;
      var obj = raw ? JSON.parse(raw) : null;
      if (obj && Array.isArray(obj.ids)) return { key: key, ids: obj.ids.map(String) };
    } catch (e) { /* 저장소 없음·깨짐 — 빈 상태 */ }
    return { key: key, ids: [] };
  }
  function saveDaily(storage, daily) {
    try { if (storage && storage.setItem) storage.setItem(daily.key, JSON.stringify({ ids: daily.ids })); } catch (e) { /* 무시 */ }
  }

  function isBot(it) { return !!(it && (it.is_ai || /^sim_/.test(String(it.id || '')))); }
  function isMine(it, ctx) { return !!(it && (it.me || it.isMe || (ctx.meId && String(it.userId || '') === String(ctx.meId)))); }
  function isBlocked(it, ctx) { return !!(it && it.userId && ctx.blockedIds.indexOf(String(it.userId)) > -1); }

  function byScoreThenNew(a, b) {
    if (b._sc.score !== a._sc.score) return b._sc.score - a._sc.score;
    var ta = Date.parse(a.createdAt || '') || 0, tb = Date.parse(b.createdAt || '') || 0;
    if (tb !== ta) return tb - ta;
    return String(a.id).localeCompare(String(b.id));
  }
  function byNew(a, b) {
    var ta = Date.parse(a.createdAt || '') || 0, tb = Date.parse(b.createdAt || '') || 0;
    if (tb !== ta) return tb - ta;
    return String(a.id).localeCompare(String(b.id));
  }

  /* ---- 묶음 만들기 ----
   * items: feed-list.js 가 만든 카드 객체들(id·userId·category·groupId·topic·authorPct·createdAt·is_ai·me/isMe …)
   * ctx: buildContext() 결과 · opts: { settings, counts(id→{helpful,poor,cheer,advice}), now, storage }
   * 반환: null(묶음 안 함) 또는 { items(마커 없는 정렬 결과), render(마커 포함), sections:{team,help,peers,widen}, hidden:{help,widen}, daily }
   */
  function arrange(items, ctx, opts) {
    opts = opts || {};
    if (!ctx || !ctx.enabled) return null;
    var s = Object.assign({}, DEFAULTS, opts.settings || {});
    var nowMs = num(opts.now, Date.now());
    var counts = opts.counts || {};
    var CM = (global && global.OurgoalCategoryMap) || null;
    var list = (items || []).slice();

    /* 점수 */
    list.forEach(function (it) {
      it._sc = score(it, ctx, s, counts[String(it.id)] || null, nowMs);
      delete it._feedReason;
    });

    var eligible = list.filter(function (it) { return !isBot(it) && !isMine(it, ctx) && !isBlocked(it, ctx) && it.id; });
    var picked = {};
    function take(it, sectionKey) {
      picked[String(it.id)] = sectionKey;
      it._feedReason = reasonFor(it, ctx, it._sc, s);
      it._feedSection = sectionKey;
    }

    /* 1 내 팀 소식 */
    var team = eligible.filter(function (it) {
      return it.groupId && ctx.teamIds.indexOf(String(it.groupId)) > -1 && it._sc.ageH !== null && it._sc.ageH <= s.teamHours;
    }).sort(byNew).slice(0, s.sections.team);
    team.forEach(function (it) { take(it, 'team'); });

    /* 2 내 목표에 도움될 글 — R 에 실제 항이 있고(하한 0.2 가 아닌 글) 사유를 만들 수 있는 글만 */
    var multiCat = Object.keys(ctx.goalCats).length >= 2;
    var authorCount = {}, catCount = {};
    var help = [];
    var helpCands = eligible.filter(function (it) { return !picked[String(it.id)] && it._sc.terms.length > 0 && (it._sc.ageH === null || it._sc.ageH <= s.staleDays * 24) && !!reasonFor(it, ctx, it._sc, s); })
      .sort(byScoreThenNew);
    /* 1차: 같은 글쓴이 상한 + (목표 2개 이상이면) 한 카테고리 60% 상한 · 2차: 후보가 한 카테고리뿐이라 자리가 남으면 상한 없이 채운다(묶음을 굶기지 않는다) */
    [true, false].forEach(function (withCatCap) {
      helpCands.forEach(function (it) {
        if (help.length >= s.sections.help || help.indexOf(it) > -1) return;
        var a = String(it.userId || ''), c = String(it.category || '');
        if (a && (authorCount[a] || 0) >= s.sameAuthorMax) return;
        if (withCatCap && multiCat && c && help.length >= 2 && ((catCount[c] || 0) + 1) / (help.length + 1) > s.catShareMax) return;
        help.push(it); if (a) authorCount[a] = (authorCount[a] || 0) + 1; if (c) catCount[c] = (catCount[c] || 0) + 1;
      });
    });
    help.sort(byScoreThenNew);
    var coldstart = help.length < s.coldstartMin;
    if (!coldstart) help.forEach(function (it) { take(it, 'help'); }); else help = [];

    /* 3 같은 길 가는 사람들 — 내 카테고리 최신 */
    var peers = eligible.filter(function (it) { return !picked[String(it.id)] && it.category && ctx.goalCats[it.category]; })
      .sort(byNew).slice(0, s.sections.peers);
    peers.forEach(function (it) { take(it, 'peers'); });

    /* 4 넓히기 — 같은 대범위 안 인접 카테고리, 묶음 2 가 찼을 때만(비면 빈 자리 채우기용) */
    var widen = [];
    if (!coldstart && CM) {
      var adj = {};
      Object.keys(ctx.goalCats).forEach(function (k) { CM.adjacent(k).forEach(function (a) { if (!ctx.goalCats[a]) adj[a] = true; }); });
      widen = eligible.filter(function (it) { return !picked[String(it.id)] && it.category && adj[it.category] && it._sc.helpful > 0; })
        .sort(function (a, b) { return (b._sc.V - a._sc.V) || byNew(a, b); }).slice(0, s.sections.widen);
      widen.forEach(function (it) { it._feedReason = ((CM.FEED_LABEL[it.category] || '가까운 주제') + ' · 내 목표와 가까운 주제에서 도움이 된 글 ' + it._sc.helpful); it._feedSection = 'widen'; picked[String(it.id)] = 'widen'; });
    }

    /* 하루 상한: 오늘 이미 추천한 글은 그대로, 새 글은 남은 자리만큼 */
    var daily = loadDaily(opts.storage, nowMs);
    var room = Math.max(0, s.dailyCap - daily.ids.length);
    function capSection(arr) {
      return arr.filter(function (it) {
        var id = String(it.id);
        if (daily.ids.indexOf(id) > -1) return true;
        if (room > 0) { room--; daily.ids.push(id); return true; }
        delete it._feedReason; delete it._feedSection; delete picked[id];
        return false;
      });
    }
    team = capSection(team); help = capSection(help); peers = capSection(peers); widen = capSection(widen);
    saveDaily(opts.storage, daily);

    /* 나머지: 마감선 아래 최신순(내 글·점수 낮은 글·상한 넘은 글 전부) */
    var rest = list.filter(function (it) { return !picked[String(it.id)]; }).sort(byNew);

    var sections = { team: team, help: help, peers: peers, widen: widen };
    var ordered = [].concat(team, help, peers, widen, rest);
    var render = [];
    ['team', 'help', 'peers', 'widen'].forEach(function (key) {
      if (!sections[key].length) return;
      render.push({ _marker: 'head', key: key, title: SECTION_TITLE[key].title, sub: SECTION_TITLE[key].sub, count: sections[key].length });
      render = render.concat(sections[key]);
    });
    var recommended = team.length + help.length + peers.length + widen.length;
    if (recommended > 0) render.push({ _marker: 'cutoff', text: CUTOFF_TEXT });
    render = render.concat(rest);

    return { items: ordered, render: render, sections: sections, hidden: { help: coldstart, widen: coldstart }, daily: { date: daily.key, used: daily.ids.length, cap: s.dailyCap }, recommended: recommended };
  }

  /* ---- 마크업(인라인 스타일 — ui.css 변경 없음) ---- */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function markerHtml(m) {
    if (!m) return '';
    if (m._marker === 'head') {
      return '<div class="feed-section-head" data-feed-section="' + esc(m.key) + '" style="display:flex;align-items:baseline;gap:8px;margin:14px 0 8px;">' +
        '<span style="font-weight:700;font-size:.9375rem;">' + esc(m.title) + '</span>' +
        '<span class="faint" style="font-size:.8125rem;">' + esc(m.sub) + '</span></div>';
    }
    if (m._marker === 'cutoff') {
      return '<div class="feed-cutoff faint" data-feed-cutoff="1" style="display:flex;align-items:center;gap:8px;margin:18px 0 12px;font-size:.8125rem;">' +
        '<span style="flex:1;border-top:1px dashed var(--rule);"></span><span>' + esc(m.text) + '</span><span style="flex:1;border-top:1px dashed var(--rule);"></span></div>';
    }
    return '';
  }
  function reasonHtml(text) {
    if (!text) return '';
    return '<div class="faint" data-feed-reason="1" style="display:flex;align-items:center;gap:6px;margin:2px 0 6px;font-size:.8125rem;"><span>🧭</span><span>' + esc(text) + '</span></div>';
  }

  var api = {
    DEFAULTS: DEFAULTS, SECTION_TITLE: SECTION_TITLE, CUTOFF_TEXT: CUTOFF_TEXT,
    buildContext: buildContext, relevance: relevance, value: value, freshness: freshness, score: score, reasonFor: reasonFor,
    arrange: arrange, markerHtml: markerHtml, reasonHtml: reasonHtml, loadDaily: loadDaily, dateKey: dateKey
  };
  if (global) global.OurgoalFeedRank = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
