'use strict';
/* #TASK-ES-699 소통-피드 2단계 — 서버 설정표·유익성 집계·내 이유 분포 읽기(feed-rank-server.js) + feed-rank.js 태그 가중 시험지
 * 가짜 supabase 클라이언트(rpc 가 값을 바로 돌려줌)로: 설정 덮어쓰기 · 집계 변환 · RPC 없음 → 1단계 그대로 · TTL · rerender 1회 · feed.enabled=false
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'feed-rank-server';
const ROOT = path.resolve(__dirname, '..');
require(path.join(ROOT, 'js', 'data', 'category-map.js'));
const FR = require(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-rank.js'));
const FS = require(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-rank-server.js'));

function fakeSb(answers, log) {
  return { rpc: (name, args) => { (log || []).push([name, args]); const a = answers[name]; return typeof a === 'function' ? a(args) : (a || { error: { code: 'PGRST202', message: 'Could not find the function' } }); } };
}

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  // 1. 설정 평평하게: feed.* 묶음 → feed-rank settings 키
  const flat = FS.flattenSettings({ 'feed.enabled': true, 'feed.weights': { wGoal: 2, wTeam: 1.5 }, 'feed.value': { wH: 0.9, tagW: { how_to: 1.2 } }, 'feed.sections': { team: 1, help: 4, dailyCap: 10 } });
  assert.strictEqual(flat.wGoal, 2); assert.strictEqual(flat.wH, 0.9); assert.deepStrictEqual(flat.sections, { team: 1, help: 4 }); assert.strictEqual(flat.dailyCap, 10);
  assert.strictEqual(FS.flattenSettings({ 'feed.enabled': false }).enabled, false);
  assert.strictEqual(FS.flattenSettings(null), null);

  // 2. 집계 변환
  const counts = FS.toCounts([{ target_id: 'p1', helpful: 3, helpful_adj: '2.5', helpful_tags: { how_to: 2, other: 0.5 }, poor: 0, cheer: 1, advice: 0 }]);
  assert.strictEqual(counts.p1.helpful, 3); assert.strictEqual(counts.p1.helpfulAdj, 2.5); assert.deepStrictEqual(counts.p1.helpfulTags, { how_to: 2, other: 0.5 }); assert.strictEqual(counts.p1.fromServer, true);

  // 3. feed-rank value(): 태그 가중 + 개인화 p_u. 라벨용 helpful 은 가드 전 실데이터
  const s = FR.DEFAULTS;
  const base = FR.value(null, { helpful: 4, poor: 0, cheer: 0, advice: 0 }, s);
  const tagged = FR.value(null, { helpful: 4, poor: 0, cheer: 0, advice: 0, helpfulTags: { how_to: 4 } }, s);
  const other = FR.value(null, { helpful: 4, poor: 0, cheer: 0, advice: 0, helpfulTags: { other: 4 } }, s);
  assert.ok(Math.abs(tagged.V - base.V) < 1e-9, 'how_to 가중 1.0 = 태그 없는 식과 같다');
  assert.ok(other.V < tagged.V, 'other 가중 0.5 는 낮다');
  const personalized = FR.value(null, { helpful: 4, poor: 0, cheer: 0, advice: 0, helpfulTags: { how_to: 4 } }, s, { how_to: 1.0 });
  assert.ok(personalized.V > tagged.V, '내가 노하우를 주로 찾으면 노하우 글 V 가 오른다');
  assert.strictEqual(personalized.helpful, 4, '라벨 숫자는 실데이터');
  const guarded = FR.value(null, { helpful: 4, poor: 0, cheer: 0, advice: 0, helpfulAdj: 2 }, s);
  assert.ok(guarded.V < base.V, '가드로 줄어든 가중 합(helpfulAdj)이 점수에 반영');

  // 4. arrange(): 서버 설정이 DEFAULTS 를 덮고, feed.enabled=false 면 null
  const NOW = Date.parse('2026-10-13T09:00:00+09:00');
  const ctx = FR.buildContext({ id: 'me', goals: [{ id: 'g1', title: '5km', topic: 'health/러닝·마라톤', createdAt: new Date(NOW - 864e5).toISOString() }], records: [], companions: [], settings: {} }, { groups: [], groupState: () => ({ joined: false }), now: NOW });
  const items = []; for (let i = 0; i < 6; i++) items.push({ id: 'r' + i, userId: 'u' + i, category: 'running', createdAt: new Date(NOW - (i + 1) * 36e5).toISOString(), authorPct: 40 });
  const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };
  const outDefault = FR.arrange(items, ctx, { now: NOW, storage: mem() });
  assert.strictEqual(outDefault.sections.help.length, 6);
  const outCapped = FR.arrange(items, ctx, { now: NOW, storage: mem(), settings: { sections: { help: 2 }, coldstartMin: 1 } });
  assert.strictEqual(outCapped.sections.help.length, 2, '서버 설정 sections.help=2 가 DEFAULTS 7 을 덮는다');
  assert.strictEqual(FR.arrange(items, ctx, { now: NOW, storage: mem(), settings: { enabled: false } }), null, 'feed.enabled=false → 예전 동작');

  // 5. 서버 읽기: 세 RPC 를 부르고 값이 오면 rerender 1회, TTL 안에서는 다시 묻지 않는다
  {
    let t = 10 * 60 * 60 * 1000; const log = [];   /* 가짜 시계: TTL 보다 큰 값에서 시작(첫 호출이 전부 낡은 상태) */
    const sb = fakeSb({
      feed_settings_get: { data: { 'feed.weights': { wGoal: 3 } }, error: null },
      feed_value_counts: (a) => ({ data: a.p_target_ids.map(id => ({ target_id: id, helpful: 1, helpful_adj: 1, helpful_tags: { other: 1 }, poor: 0, cheer: 0, advice: 0 })), error: null }),
      my_helpful_tag_profile: { data: { how_to: 0.7, other: 0.3 }, error: null }
    }, log);
    const srv = FS.create({ sb, now: () => t });
    let rerenders = 0;
    const first = srv.state(['a', 'b'], () => { rerenders++; });
    assert.strictEqual(first.settings, null, '첫 호출은 아직 값 없음');
    return Promise.resolve().then(() => new Promise(r => setTimeout(r, 0))).then(() => {
      assert.strictEqual(rerenders, 1, '값 도착 → rerender 1회');
      assert.strictEqual(log.length, 3, 'RPC 3종 호출');
      const second = srv.state(['b', 'a'], () => { rerenders++; });
      assert.strictEqual(second.settings.wGoal, 3);
      assert.strictEqual(second.counts.a.helpful, 1);
      assert.deepStrictEqual(second.tagProfile, { how_to: 0.7, other: 0.3 });
      return new Promise(r => setTimeout(r, 0)).then(() => {
        assert.strictEqual(log.length, 3, '같은 묶음·TTL 안 → 다시 묻지 않음');
        assert.strictEqual(rerenders, 1);
        t += FS.COUNTS_TTL + 1;
        srv.state(['a', 'b'], () => { rerenders++; });
        return new Promise(r => setTimeout(r, 0));
      }).then(() => {
        assert.strictEqual(log.length, 4, 'TTL 지나면 집계만 다시');
        // 6. RPC 가 없는 서버: 한 번 실패하면 다시 시도하지 않고 1단계 그대로
        const log2 = []; let rr = 0;
        const srv2 = FS.create({ sb: fakeSb({}, log2) });
        srv2.state(['x'], () => { rr++; });
        return new Promise(r => setTimeout(r, 0)).then(() => {
          assert.strictEqual(srv2._st.serverOk, false);
          srv2.state(['x'], () => { rr++; });
          return new Promise(r => setTimeout(r, 0)).then(() => {
            assert.strictEqual(log2.length, 3, '실패 뒤 재시도 0');
            assert.strictEqual(rr, 0, '값이 없으면 rerender 없음');
            // 7. SQL 사본: 설정 기본값이 DEFAULTS 와 같다 (한 곳의 숫자가 다른 곳과 어긋나지 않게)
            const sql = fs.readFileSync(path.join(ROOT, 'docs', 'sql', '2026-10-13-feed-settings-and-value.sql'), 'utf8');
            const m = sql.match(/\('feed\.weights',\s*'(\{[^']+\})'::jsonb\)/); assert.ok(m, 'SQL feed.weights 행');
            const w = JSON.parse(m[1]); ['wGoal', 'wTeam', 'wTopic', 'wComp', 'wStage', 'rMin', 'rMax'].forEach(k => assert.strictEqual(w[k], FR.DEFAULTS[k], 'SQL feed.weights.' + k + ' = DEFAULTS'));
            const v = JSON.parse(sql.match(/\('feed\.value',\s*'(\{[^']+\})'::jsonb\)/)[1]); assert.deepStrictEqual(v.tagW, FR.DEFAULTS.tagW); assert.strictEqual(v.wH, FR.DEFAULTS.wH); assert.strictEqual(v.k, FR.DEFAULTS.k);
            const f = JSON.parse(sql.match(/\('feed\.freshness',\s*'(\{[^']+\})'::jsonb\)/)[1]); assert.strictEqual(f.tau0h, FR.DEFAULTS.tau0h);
            const sec = JSON.parse(sql.match(/\('feed\.sections',\s*'(\{[^']+\})'::jsonb\)/)[1]); assert.deepStrictEqual({ team: sec.team, help: sec.help, peers: sec.peers, widen: sec.widen }, FR.DEFAULTS.sections); assert.strictEqual(sec.dailyCap, FR.DEFAULTS.dailyCap);
            assert.ok(sql.includes('create trigger trg_feed_settings_log'), '변경 기록 트리거');
            assert.ok(sql.includes('r.user_id <> p.user_id'), '글쓴이 본인 반응 제외');
            assert.ok(sql.includes("coalesce(u.is_bot, false) = false"), '봇 제외');
            // 8. 배선: feed-list 가 서버 상태를 주입, index.html 순서
            const fl = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-list.js'), 'utf8');
            assert.ok(fl.includes('OurgoalFeedRankServer.instance({ sb: L.sb }).state('), 'feed-list 가 서버 상태를 읽는다');
            assert.ok(fl.includes('settings: srv.settings || null, tagProfile: srv.tagProfile || null'), '설정·이유 분포 주입');
            const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
            assert.ok(html.indexOf('js/tabs/comm/feed-rank-server.js') > html.indexOf('js/tabs/comm/feed-rank.js') && html.indexOf('js/tabs/comm/feed-rank-server.js') < html.indexOf('js/tabs/comm/feed-list.js'));
            console.log(`[TEST PASS] ${SUITE_NAME}`);
          });
        });
      });
    });
  }
}

if (require.main === module) {
  const r = runTests();
  if (r && typeof r.catch === 'function') r.catch(e => { console.error(`[TEST FAIL] ${SUITE_NAME}`); console.error(e); process.exitCode = 1; });
}
module.exports = { runTests };
