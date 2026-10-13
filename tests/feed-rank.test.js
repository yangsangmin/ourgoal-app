'use strict';
/* #TASK-ES-698 소통-피드 알고리즘 1단계 — 묶음·정렬·사유 라벨 시험지 (순수 함수, DOM 없음)
 * 정본: 「아워골 소통-피드 알고리즘 정립 보고서」 3-1~3-7·4-1·4-2절. 피드 노출 규범(ESSENCE ③)을 코드로 잰다:
 *  러닝 사용자에게 running 글이 study 글보다 위 · 팀 글은 묶음 1 · 목표 0개면 묶음 없음(null) · 봇 0 · 사유 라벨 없는 추천 0 ·
 *  상대 비교 수치 없음 · 하루 상한 · 콜드스타트 · 정렬 안정 · 체류시간류 변수 0
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'feed-rank';
const ROOT = path.resolve(__dirname, '..');
const CM = require(path.join(ROOT, 'js', 'data', 'category-map.js'));
const FR = require(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-rank.js'));

const NOW = Date.parse('2026-10-13T09:00:00+09:00');
const h = (hoursAgo) => new Date(NOW - hoursAgo * 36e5).toISOString();
function mem() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; }

function runnerProfile() {
  return {
    id: 'me',
    goals: [
      { id: 'g1', title: '매일 5km', topic: 'health/러닝·마라톤', category: 'health', createdAt: h(24 * 3), visibility: 'theme' },
      { id: 'g2', title: '토익 900', topic: 'study/어학', category: 'study', createdAt: h(24 * 60) }   // 활동 없음 → 0.6
    ],
    records: [{ id: 'r1', goalId: 'g1', createdAt: h(5) }],
    companions: [{ id: 'u-comp', name: '동반자' }],
    settings: { blockedUsers: ['u-blocked'] }
  };
}
const GROUPS = [{ id: 'g-run', name: '새벽 러너', topic: 'health/러닝·마라톤' }, { id: 'g-other', name: '다른 팀', topic: 'study/어학' }];
const groupState = (gid) => ({ joined: gid === 'g-run' });
const goalProgress = (g) => (g.id === 'g1' ? 23 : 50);

function post(id, over) {
  return Object.assign({ id, userId: 'u-' + id, name: '사람' + id, category: 'running', createdAt: h(6), authorPct: 30, goal: '목표', action: '실천' }, over || {});
}

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  // 0. 규범 1: 체류시간·조회수류 변수가 코드에 없다 (rules.json FEED_DWELL_SIGNALS 와 같은 정규식)
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-rank.js'), 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    assert.ok(!/dwell|watchTime|timeSpent|timeOnFeed|viewCount|view_count|impressionCount|scrollDepth|clickRate|\bctr\b|체류시간|조회수/.test(line), `feed-rank.js ${i + 1}행에 체류시간류 신호`);
  });

  // 1. 컨텍스트: 목표 → 피드 카테고리·활동 가중, 팀, 동반자, 차단
  const ctx = FR.buildContext(runnerProfile(), { groups: GROUPS, groupState, goalProgress, categoryMap: CM, now: NOW });
  assert.strictEqual(ctx.enabled, true);
  assert.strictEqual(ctx.goalCats.running, 1.0, '14일 안 기록 있는 목표 = 1.0');
  assert.strictEqual(ctx.goalCats.study, 0.6, '기록 없는 오래된 목표 = 0.6');
  assert.deepStrictEqual(ctx.teamIds, ['g-run']);
  assert.strictEqual(ctx.teamCats.running, true);
  assert.deepStrictEqual(ctx.companionIds, ['u-comp']);
  assert.deepStrictEqual(ctx.blockedIds, ['u-blocked']);
  assert.strictEqual(ctx.stageByCat.running, 23);

  // 2. 목표 0개·팀 0개 → 묶음 없음 (예전 최신순 그대로)
  const emptyCtx = FR.buildContext({ id: 'me', goals: [], companions: [], settings: {} }, { groups: GROUPS, groupState: () => ({ joined: false }), categoryMap: CM, now: NOW });
  assert.strictEqual(emptyCtx.enabled, false);
  assert.strictEqual(FR.arrange([post('a')], emptyCtx, { now: NOW, storage: mem() }), null);

  // 3. 러닝 사용자: running 글이 study 글보다 위, 같은 시각이면 id 순으로 안정
  {
    const items = [post('s1', { category: 'study' }), post('r1', { category: 'running' }), post('s2', { category: 'study' })];
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem() });
    assert.ok(out, '묶음이 만들어진다');
    const order = out.items.map(i => i.id);
    assert.ok(order.indexOf('r1') < order.indexOf('s1'), 'running 이 study 보다 위');
    const again = FR.arrange(items.slice().reverse(), ctx, { now: NOW, storage: mem() }).items.map(i => i.id);
    assert.deepStrictEqual(again, order, '입력 순서가 달라도 결과 순서는 같다(정렬 안정)');
  }

  // 4. 팀 글은 묶음 1, 48시간 넘은 팀 글은 아님
  {
    const items = [post('t1', { groupId: 'g-run', createdAt: h(3) }), post('t2', { groupId: 'g-run', createdAt: h(80) }), post('o1', { groupId: 'g-other', createdAt: h(1) })];
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem() });
    assert.deepStrictEqual(out.sections.team.map(i => i.id), ['t1']);
    assert.ok(out.sections.team[0]._feedReason.indexOf('새벽 러너') > -1, '팀 이름이 사유에');
  }

  // 5. 봇·내 글·차단 글은 추천 묶음에 없다. 내 글은 마감선 아래에 남는다
  {
    const items = [post('b1', { is_ai: true }), post('sim_1'), post('m1', { userId: 'me' }), post('bl', { userId: 'u-blocked' }), post('ok1'), post('ok2'), post('ok3')];
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem() });
    const rec = [].concat(out.sections.team, out.sections.help, out.sections.peers, out.sections.widen).map(i => i.id);
    ['b1', 'sim_1', 'm1', 'bl'].forEach(id => assert.ok(rec.indexOf(id) === -1, id + ' 는 추천에 없어야 함'));
    assert.ok(out.items.map(i => i.id).indexOf('m1') > -1, '내 글은 목록에는 남는다');
  }

  // 6. 모든 추천 카드에 사유 라벨이 있고, 라벨에 상대 비교 수치(% 앞서)가 없다
  {
    const items = [];
    for (let i = 0; i < 12; i++) items.push(post('p' + i, { category: i % 3 === 0 ? 'study' : 'running', authorPct: i * 8, userId: 'u' + i, createdAt: h(i + 1) }));
    items.push(post('c1', { userId: 'u-comp', category: 'diet' }));
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem() });
    const rec = [].concat(out.sections.team, out.sections.help, out.sections.peers, out.sections.widen);
    assert.ok(rec.length > 0);
    rec.forEach(it => {
      assert.ok(typeof it._feedReason === 'string' && it._feedReason.length > 3, it.id + ' 사유 라벨 누락');
      assert.ok(!/\d+%\s*앞서|나보다/.test(it._feedReason), it.id + ' 라벨에 상대 비교 수치');
    });
    assert.ok(out.sections.help.length <= FR.DEFAULTS.sections.help);
    const authors = {}; out.sections.help.forEach(it => { authors[it.userId] = (authors[it.userId] || 0) + 1; assert.ok(authors[it.userId] <= FR.DEFAULTS.sameAuthorMax); });
    assert.ok(out.render.some(m => m._marker === 'cutoff'), '마감선이 있다');
    assert.ok(out.render.some(m => m._marker === 'head' && m.key === 'help'));
    const ahead = rec.find(it => it.authorPct >= 23 + 25 && it.category === 'running' && it._feedReason.indexOf('한 걸음') > -1);
    assert.ok(ahead, '한 걸음 앞서 간 경험 라벨(수치 없음)');
  }

  // 7. 유익성 V: 도움돼요가 많은 글이 위로, 별로에요 비율 높으면 감점, 라벨에 도움돼요 수(실데이터)만
  {
    const items = [post('h0'), post('h9'), post('poor')];
    const counts = { h9: { helpful: 9, poor: 0, cheer: 2, advice: 0 }, poor: { helpful: 9, poor: 8, cheer: 0, advice: 0 }, h0: { helpful: 0, poor: 0, cheer: 0, advice: 0 } };
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem(), counts });
    const order = out.items.map(i => i.id);
    assert.ok(order.indexOf('h9') < order.indexOf('h0'), '도움돼요 9 가 0 보다 위');
    assert.ok(order.indexOf('h9') < order.indexOf('poor'), '별로에요 비율 높은 글은 감점');
    const h9 = out.items.find(i => i.id === 'h9');
    assert.ok(h9._feedReason.indexOf('도움돼요 9') > -1, '라벨에 실데이터 도움돼요 수');
    const h0 = out.items.find(i => i.id === 'h0');
    assert.ok(h0._feedReason.indexOf('도움돼요') === -1, '0 이면 숫자 숨김');
    assert.ok(FR.value(null, { helpful: 1, poor: 0, cheer: 0 }, FR.DEFAULTS).V < FR.value(null, { helpful: 1, poor: 0, cheer: 5 }, FR.DEFAULTS).V, '베이즈 축소: 반응 적으면 덜 오른다');
  }

  // 8. 신선도 F: 72시간 반감, 도움돼요 많으면 느리게
  assert.ok(Math.abs(FR.freshness({ createdAt: h(72) }, 0, FR.DEFAULTS, NOW).F - Math.exp(-1)) < 1e-9);
  assert.ok(FR.freshness({ createdAt: h(72) }, 10, FR.DEFAULTS, NOW).F > FR.freshness({ createdAt: h(72) }, 0, FR.DEFAULTS, NOW).F);
  assert.strictEqual(FR.freshness({}, 0, FR.DEFAULTS, NOW).F, 0.5, '시각 없는 글은 중간값');

  // 9. 콜드스타트: 묶음 2 가 3건 미만이면 묶음 2·4 숨김, 1·3 만
  {
    const items = [post('x1'), post('x2')];
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem() });
    assert.strictEqual(out.hidden.help, true);
    assert.strictEqual(out.sections.help.length, 0);
    assert.strictEqual(out.sections.widen.length, 0);
    assert.strictEqual(out.sections.peers.length, 2, '같은 길 묶음은 남는다');
  }

  // 10. 하루 상한: 오늘 추천한 글 id 를 기기에 적고, 상한을 넘기는 새 글은 추천하지 않는다 (같은 날 재렌더는 그대로)
  {
    const storage = mem();
    const many = []; for (let i = 0; i < 40; i++) many.push(post('m' + i, { userId: 'u' + i, createdAt: h(i + 1) }));
    const out1 = FR.arrange(many, ctx, { now: NOW, storage, settings: { dailyCap: 5 } });
    assert.strictEqual(out1.recommended, 5, '상한 5 → 추천 5');
    const saved = JSON.parse(storage.getItem('feed_daily_' + FR.dateKey(NOW)));
    assert.strictEqual(saved.ids.length, 5);
    const out2 = FR.arrange(many.slice().reverse(), ctx, { now: NOW, storage, settings: { dailyCap: 5 } });
    assert.deepStrictEqual(out2.render.filter(m => !m._marker).slice(0, 5).map(i => i.id).sort(), saved.ids.slice().sort(), '재렌더에도 같은 5건');
    assert.strictEqual(FR.loadDaily(null, NOW).ids.length, 0, '저장소 없어도 깨지지 않음');
  }

  // 11. 넓히기는 같은 대범위 인접(diet·workout)에서 도움돼요 있는 글만, 묶음 2 가 찼을 때만
  {
    const items = [];
    for (let i = 0; i < 5; i++) items.push(post('r' + i, { userId: 'u' + i, createdAt: h(i + 1) }));
    items.push(post('d1', { category: 'diet', userId: 'ud' }), post('d2', { category: 'diet', userId: 'ud2' }), post('tr', { category: 'travel', userId: 'ut' }));
    const counts = { d1: { helpful: 3, poor: 0, cheer: 0, advice: 0 }, tr: { helpful: 9, poor: 0, cheer: 0, advice: 0 } };
    const out = FR.arrange(items, ctx, { now: NOW, storage: mem(), counts });
    assert.deepStrictEqual(out.sections.widen.map(i => i.id), ['d1'], '도움돼요 있는 인접(diet)만, travel(relation 대범위)은 아님');
    assert.ok(out.sections.widen[0]._feedReason.indexOf('가까운 주제') > -1);
  }

  // 12. 마크업: 마커·사유 라벨에 이스케이프, 가중치 숫자는 이 파일 DEFAULTS 에만(규범 6)
  assert.ok(FR.markerHtml({ _marker: 'head', key: 'help', title: '<b>', sub: 's', count: 1 }).indexOf('&lt;b&gt;') > -1);
  assert.ok(FR.markerHtml({ _marker: 'cutoff', text: FR.CUTOFF_TEXT }).indexOf('여기까지') > -1);
  assert.strictEqual(FR.reasonHtml(''), '');
  const feedList = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-list.js'), 'utf8');
  feedList.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    assert.ok(!/\bw(Goal|Team|Topic|Comp|Stage|H)\s*[:=]\s*[0-9.]+|tau0h\s*[:=]\s*[0-9]+|dailyCap\s*[:=]\s*[0-9]+/.test(line), `feed-list.js ${i + 1}행에 가중치 숫자`);
  });
  assert.ok(feedList.includes('OurgoalFeedRank.arrange('), 'feed-list.js 가 arrange 를 부른다');
  assert.ok(feedList.includes("curCat === 'all' && feedType === 'all'"), "묶음은 '전체' 칩·'전체' 피드일 때만");
  assert.ok(feedList.includes('OurgoalFeedRank.reasonHtml('), '카드 위 사유 라벨');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/tabs/comm/feed-rank.js') > -1 && html.indexOf('js/tabs/comm/feed-rank.js') < html.indexOf('js/tabs/comm/feed-list.js'), 'feed-rank.js 가 feed-list.js 보다 먼저');

  console.log(`[TEST PASS] ${SUITE_NAME}`);
}

if (require.main === module) runTests();
module.exports = { runTests };
