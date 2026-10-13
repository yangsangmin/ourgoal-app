/* ============================================================
 * 아워골 — 소통 피드 서버 상태 읽기 (소통-피드 알고리즘 2단계, #TASK-ES-699, 본질 ③)
 *
 * feed-rank.js(순수 함수)에 넣어 줄 서버 값 세 가지를 받아 둔다. 정렬은 여전히 클라이언트가 한다(같은 식을 두 곳에 두지 않는다).
 *  1 설정 feed_settings_get()          — 가중치·상한·반감기·가드. DEFAULTS 위에 덮어쓴다(규범 6). 10분 캐시
 *  2 유익성 집계 feed_value_counts(ids) — 최근 30일 도움돼요(이유 태그별, 가드 적용)·별로에요·응원·조언. 5분 캐시(글 id 묶음 기준)
 *  3 내 이유 분포 my_helpful_tag_profile() — 개인화 p_u. 10분 캐시
 * 규칙:
 *  - 서버에 RPC 가 아직 없으면(PGRST202/404 등) 조용히 포기하고 다시 시도하지 않는다(1단계 동작 그대로 = DEFAULTS + reactions.js 집계).
 *  - 값이 새로 도착하면 호출 쪽이 준 rerender 를 한 번 부른다(불러온 뒤에만, 같은 묶음에 대해 1회).
 *  - 네트워크·DOM 을 아는 것은 이 파일뿐이다. feed-rank.js 는 이 파일을 모른다.
 * 브라우저 window.OurgoalFeedRankServer, node 시험지 module.exports (sb 를 넘겨 받는다).
 * ============================================================ */
(function (global) {
  'use strict';

  var SETTINGS_TTL = 10 * 60 * 1000;
  var COUNTS_TTL = 5 * 60 * 1000;
  var PROFILE_TTL = 10 * 60 * 1000;

  function missingSchema(err) {
    if (!err) return false;
    var code = String(err.code || '');
    var msg = String(err.message || '');
    return code === 'PGRST202' || code === 'PGRST205' || code === '42883' || code === '42P01' ||
      /Could not find the function|does not exist|schema cache/i.test(msg) || Number(err.status) === 404;
  }

  /* 서버 설정(feed.weights 등 묶음)을 feed-rank.js 의 평평한 settings 로 */
  function flattenSettings(json) {
    if (!json || typeof json !== 'object') return null;
    var out = {};
    ['feed.weights', 'feed.value', 'feed.freshness', 'feed.guards'].forEach(function (k) {
      var v = json[k];
      if (v && typeof v === 'object') Object.keys(v).forEach(function (kk) { out[kk] = v[kk]; });
    });
    var sec = json['feed.sections'];
    if (sec && typeof sec === 'object') {
      out.sections = {};
      ['team', 'help', 'peers', 'widen'].forEach(function (k) { if (typeof sec[k] === 'number') out.sections[k] = sec[k]; });
      ['teamHours', 'dailyCap', 'sameAuthorMax', 'catShareMax', 'coldstartMin'].forEach(function (k) { if (typeof sec[k] === 'number') out[k] = sec[k]; });
    }
    if (json['feed.enabled'] === false) out.enabled = false;
    return out;
  }

  /* feed_value_counts 행 → feed-rank.js value() 가 읽는 모양 */
  function toCounts(rows) {
    var counts = {};
    (rows || []).forEach(function (r) {
      if (!r || !r.target_id) return;
      counts[String(r.target_id)] = {
        helpful: Number(r.helpful) || 0,
        helpfulAdj: Number(r.helpful_adj) || 0,
        helpfulTags: (r.helpful_tags && typeof r.helpful_tags === 'object') ? r.helpful_tags : {},
        poor: Number(r.poor) || 0,
        cheer: Number(r.cheer) || 0,
        advice: Number(r.advice) || 0,
        fromServer: true
      };
    });
    return counts;
  }

  function create(deps) {
    deps = deps || {};
    var sb = deps.sb || null;
    var now = typeof deps.now === 'function' ? deps.now : function () { return Date.now(); };
    var st = {
      serverOk: null,                 // null=미확인 · false=RPC 없음(재시도 안 함) · true
      settings: null, settingsAt: 0, settingsLoading: false,
      counts: {}, countsAt: 0, countsKey: '', countsLoading: false,
      profile: null, profileAt: 0, profileLoading: false
    };

    function rpc(name, args) {
      if (!sb || typeof sb.rpc !== 'function') return Promise.resolve({ error: { message: 'no client' } });
      try { return Promise.resolve(sb.rpc(name, args || {})); } catch (e) { return Promise.resolve({ error: e }); }
    }
    function handleErr(res) {
      if (res && res.error) { if (missingSchema(res.error)) st.serverOk = false; return true; }
      st.serverOk = true;
      return false;
    }

    /* ids 로 묶음 키 — 같은 묶음이면 TTL 안에서 다시 묻지 않는다 */
    function keyOf(ids) { return ids.slice().sort().join(','); }

    /* 현재 가진 값을 바로 돌려주고, 낡았으면 뒤에서 새로 받아 rerender 를 1회 부른다 */
    function state(ids, rerender) {
      ids = (ids || []).map(String).filter(Boolean);
      var t = now();
      var out = { settings: st.settings, counts: st.counts, tagProfile: st.profile, serverOk: st.serverOk };
      if (st.serverOk === false || !sb) return out;
      var pending = [];
      if (!st.settingsLoading && (t - st.settingsAt > SETTINGS_TTL)) {
        st.settingsLoading = true;
        pending.push(rpc('feed_settings_get').then(function (res) {
          st.settingsLoading = false;
          if (handleErr(res)) return false;
          st.settings = flattenSettings(res.data); st.settingsAt = now(); return true;
        }));
      }
      if (ids.length && !st.countsLoading && (keyOf(ids) !== st.countsKey || t - st.countsAt > COUNTS_TTL)) {
        st.countsLoading = true;
        var k = keyOf(ids);
        pending.push(rpc('feed_value_counts', { p_target_ids: ids }).then(function (res) {
          st.countsLoading = false;
          if (handleErr(res)) return false;
          st.counts = toCounts(res.data); st.countsAt = now(); st.countsKey = k; return true;
        }));
      }
      if (!st.profileLoading && (t - st.profileAt > PROFILE_TTL)) {
        st.profileLoading = true;
        pending.push(rpc('my_helpful_tag_profile').then(function (res) {
          st.profileLoading = false;
          if (handleErr(res)) return false;
          st.profile = (res.data && typeof res.data === 'object') ? res.data : {}; st.profileAt = now(); return true;
        }));
      }
      if (pending.length) {
        Promise.all(pending).then(function (flags) {
          if (flags.some(Boolean) && typeof rerender === 'function') rerender();
        }).catch(function () { /* 조용히 */ });
      }
      return out;
    }

    return { state: state, _st: st, missingSchema: missingSchema, flattenSettings: flattenSettings, toCounts: toCounts };
  }

  var api = { create: create, missingSchema: missingSchema, flattenSettings: flattenSettings, toCounts: toCounts, SETTINGS_TTL: SETTINGS_TTL, COUNTS_TTL: COUNTS_TTL, PROFILE_TTL: PROFILE_TTL, _instance: null,
    /* 브라우저용 단일 인스턴스 — feed-list.js 가 부른다 */
    instance: function (deps) { if (!api._instance) api._instance = create(deps); return api._instance; } };
  if (global) global.OurgoalFeedRankServer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
