'use strict';
/* #TASK-ES-700 소통-피드 3단계 — 주간 유익함 지표 시험지 (가짜 행, 순수 계산)
 * 잰다: 봇·글쓴이 본인 반응 제외 · 비율 계산 · 분모 0 → null(0 으로 메우지 않음) · 경보 5종 · 체류시간류 변수 0 · 자격 없으면 measured=false
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SUITE_NAME = 'feed-weekly-metrics';
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'scripts', 'feed-weekly-metrics.js'));

const NOW = Date.parse('2026-10-13T09:00:00+09:00');
const d = (daysAgo) => new Date(NOW - daysAgo * 864e5).toISOString();

function rows() {
  return {
    users: [{ id: 'bot1', is_bot: true }],
    posts: [
      { id: 'p1', user_id: 'a1', category: 'running', created_at: d(1) },
      { id: 'p2', user_id: 'a2', category: 'study', created_at: d(2) },
      { id: 'p3', user_id: 'a3', category: 'running', created_at: d(3) },
      { id: 'sim_x', user_id: 'bot1', category: 'running', created_at: d(1) },
      { id: 'old', user_id: 'a1', category: 'running', created_at: d(10) }
    ],
    reactions: [
      { target_id: 'p1', user_id: 'u1', type: 'helpful', reason_tag: null, created_at: d(1) },
      { target_id: 'p1', user_id: 'u2', type: 'cheer', reason_tag: null, created_at: d(1) },
      { target_id: 'p2', user_id: 'u1', type: 'poor', reason_tag: 'off_topic', created_at: d(2) },
      { target_id: 'p1', user_id: 'a1', type: 'helpful', reason_tag: null, created_at: d(1) },   // 글쓴이 본인 → 제외
      { target_id: 'p3', user_id: 'bot1', type: 'helpful', reason_tag: null, created_at: d(1) }, // 봇 → 제외
      { target_id: 'sim_x', user_id: 'u1', type: 'helpful', reason_tag: null, created_at: d(1) }, // 시뮬 글 → 제외
      { target_id: 'old', user_id: 'u1', type: 'helpful', reason_tag: null, created_at: d(10) }  // 지난주 창
    ],
    reasons: [
      { target_id: 'p1', user_id: 'u1', reason_tag: 'how_to', created_at: d(1) },
      { target_id: 'old', user_id: 'u1', reason_tag: 'motivation', created_at: d(10) }
    ],
    goals: [
      { user_id: 'u1', topic: 'health/러닝·마라톤', category: 'health', title: '5km', archived_at: null },
      { user_id: 'u2', topic: 'study/어학', category: 'study', title: '토익', archived_at: null }
    ],
    pings: [{ source: 'feed', created_at: d(1) }, { source: null, created_at: d(1) }, { source: 'feed', created_at: d(9) }],
    settings: [{ key: 'feed.enabled', value: true, updated_at: d(1) }],
    settingsLog: [{ key: 'feed.weights', before: { wTeam: 1.2 }, after: { wTeam: 1.0 }, reason: '시험', changed_at: d(1) }]
  };
}

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  // 0. 체류시간류 변수 없음(규범 1)
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'feed-weekly-metrics.js'), 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    assert.ok(!/dwell|watchTime|timeSpent|timeOnFeed|viewCount|view_count|impressionCount|scrollDepth|clickRate|\bctr\b|체류시간|조회수/.test(line), `${i + 1}행 체류시간류 신호`);
  });

  // 1. 이번 주 창
  const r = M.compute(rows(), { now: NOW, days: 7 });
  const c = r.current;
  assert.strictEqual(r.measured, true);
  assert.strictEqual(c.posts, 3, '시뮬 글·지난주 글 제외');
  assert.deepStrictEqual(c.reactions, { helpful: 1, cheer: 1, poor: 1, advice: 0, total: 3 }, '본인·봇·시뮬 반응 제외');
  assert.strictEqual(c.helpfulRatio, 0.333);
  assert.strictEqual(c.howtoShare, 1, '이유 1건이 how_to');
  assert.strictEqual(c.sameCategoryRate, 0.333, 'u1(running)→p1 같음, u2(study)→p1 다름, u1→p2(study) 다름');
  assert.strictEqual(c.offTopicShare, 1);
  assert.strictEqual(c.reach, 0.333, '3글 중 1글만 도움돼요');
  assert.strictEqual(c.connectionsFromFeed.teamInvites, 1);
  assert.strictEqual(c.connectionsFromFeed.companions, null, '동반자는 측정불가 → null');
  assert.deepStrictEqual(r.settings, { 'feed.enabled': true });
  assert.strictEqual(r.settingsLog.length, 1);

  // 2. 지난주 창 + 분모 0 은 null
  const p = r.previous;
  assert.strictEqual(p.posts, 1);
  assert.strictEqual(p.helpfulRatio, 1);
  assert.strictEqual(p.howtoShare, 0, '이유 1건이 motivation');
  assert.strictEqual(p.offTopicShare, null, '별로에요 0 → null');
  const empty = M.compute({ posts: [], reactions: [], reasons: [], goals: [], pings: [], users: [] }, { now: NOW });
  assert.strictEqual(empty.current.helpfulRatio, null);
  assert.strictEqual(empty.current.reach, null);
  assert.strictEqual(empty.settings, null);
  assert.deepStrictEqual(empty.alerts, [], '분모 0 이면 경보 없음(없는 것을 나쁘다고 하지 않음)');

  // 3. 경보: 도움돼요 비율 20% 넘게 하락(1 → 0.333), 노하우 비율은 1 이라 경보 없음, 같은 카테고리 0.333 < 0.5, 도달 0.333 ≥ 0.2
  const keys = r.alerts.map(a => a.key);
  assert.ok(keys.includes('helpfulRatio'));
  assert.ok(keys.includes('sameCategoryRate'));
  assert.ok(!keys.includes('howtoShare'));
  assert.ok(!keys.includes('reach'));
  assert.ok(keys.includes('offTopicShare') === false, '지난주 별로에요 0(null) → 상승 판정 안 함');

  // 4. 자격 없으면 측정불가(0 으로 메우지 않음) — loadCreds 는 env 만 본다
  const saved = { u: process.env.SUPABASE_URL, k: process.env.SUPABASE_SERVICE_ROLE_KEY };
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creds = M.loadCreds();
  if (saved.u !== undefined) process.env.SUPABASE_URL = saved.u; if (saved.k !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = saved.k;
  assert.ok(creds && ('url' in creds) && ('key' in creds));
  assert.strictEqual(M.weekLabel(NOW).slice(0, 6), '2026-W');

  // 5. 배선: 동반자 추가·팀 영입 userObj 에 source:'feed', 팀 초대 insert 가 source 를 싣는다
  const fl = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-list.js'), 'utf8');
  assert.strictEqual((fl.match(/source: 'feed'/g) || []).length, 2, 'feed-list 동반자·영입 두 곳');
  const tr = fs.readFileSync(path.join(ROOT, 'js', 'team-recruit.js'), 'utf8');
  assert.ok(tr.includes('source: (targetUser && targetUser.source) || null'), 'team-recruit 초대 insert 에 source');

  console.log(`[TEST PASS] ${SUITE_NAME}`);
}

if (require.main === module) runTests();
module.exports = { runTests };
