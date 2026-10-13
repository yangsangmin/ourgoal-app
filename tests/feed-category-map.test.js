'use strict';
/* #TASK-ES-696 소통-피드 알고리즘 0단계 — 목표 주제 ↔ 피드 카테고리 매핑표 시험지
 * 정본: 「아워골 소통-피드 알고리즘 정립 보고서」 3-4·3-5절. 독립 검토(2026-10-13) 지적 반영:
 *  - 입력은 goal.topic, category 는 라벨 정규화, 테스트 41건(중범위 35 + 대범위 기본 6)
 *  - JS 표와 SQL feed_category_of() 의 내용 일치
 *  - 넓히기 인접은 같은 대범위 안
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_NAME = 'feed-category-map';
const ROOT = path.resolve(__dirname, '..');
const CM = require(path.join(ROOT, 'js', 'data', 'category-map.js'));

function runTests() {
  console.log(`[TEST START] ${SUITE_NAME}`);

  // 0. 피드 18키 = feed-list.js 칩 = share-to-feed.js 선택지
  assert.strictEqual(CM.FEED_KEYS.length, 18, '피드 카테고리는 18키');
  const feedList = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-list.js'), 'utf8');
  const shareToFeed = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'records', 'share-to-feed.js'), 'utf8');
  CM.FEED_KEYS.forEach(k => {
    assert.ok(feedList.includes(`key: '${k}'`), `feed-list.js 칩에 ${k} 있어야 함`);
    assert.ok(shareToFeed.includes(`{k:'${k}'`), `share-to-feed.js 선택지에 ${k} 있어야 함`);
  });

  // 1. 중범위 35 → 피드 키 (topic-region-picker.js TOPICS 와 같은 목록)
  const picker = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'goals', 'topic-region-picker.js'), 'utf8');
  let subCount = 0;
  Object.keys(CM.TOPIC_MAP).forEach(major => {
    const subs = Object.keys(CM.TOPIC_MAP[major].subs);
    subs.forEach(sub => {
      assert.ok(picker.includes(`'${sub}'`), `topic-region-picker.js 에 중범위 '${sub}' 가 있어야 함 (${major})`);
      const key = CM.fromTopic(`${major}/${sub}`);
      assert.ok(CM.isFeedKey(key), `${major}/${sub} → 피드 키여야 함 (got ${key})`);
      assert.strictEqual(key, CM.TOPIC_MAP[major].subs[sub]);
      subCount++;
    });
  });
  assert.strictEqual(subCount, 35, '중범위 매핑은 35건');

  // 2. 대범위 기본값 6
  const majorDefaults = { health: 'workout', study: 'study', career: 'career', hobby: 'hobby', mind: 'mental', relation: 'relation' };
  Object.keys(majorDefaults).forEach(major => {
    assert.strictEqual(CM.fromTopic(major), majorDefaults[major], `${major} 단독 → ${majorDefaults[major]}`);
    assert.strictEqual(CM.fromTopic(`${major}/표에 없는 중범위`), majorDefaults[major], `${major}/모르는 중범위 → 대범위 기본값`);
  });
  assert.strictEqual(Object.keys(majorDefaults).length, 6);

  // 3. 대표 사례: 운동·마음 목표가 더는 study 로 떨어지지 않는다 (share-to-feed 103~106행 결함)
  assert.strictEqual(CM.fromGoal({ title: '매일 5km', topic: 'health/러닝·마라톤', category: 'health' }), 'running');
  assert.strictEqual(CM.fromGoal({ title: '명상 10분', topic: 'mind/명상·멘탈케어', category: 'mind' }), 'mental');
  assert.strictEqual(CM.fromGoal({ title: '빠른 목표', topic: '', category: '운동/건강' }), 'workout', '한글 라벨 정규화(goal-fast-add)');
  assert.strictEqual(CM.fromGoal({ title: '빠른 목표', topic: '', category: '학습/성장' }), 'study');
  assert.strictEqual(CM.fromGoal({ title: '빠른 목표', topic: '', category: '습관/루틴' }), 'mental');
  assert.strictEqual(CM.fromGoal({ title: '빠른 목표', topic: '', category: '커리어' }), 'career');
  assert.strictEqual(CM.fromGoal({ title: '정체불명', topic: '', category: '일반' }), null, "'일반' 라벨은 정규식도 안 걸리면 null (life 로 메우지 않음)");
  assert.strictEqual(CM.fromGoal({ title: '토익 900', topic: '', category: 'etc' }), 'study', 'etc 는 제목 정규식으로');
  assert.strictEqual(CM.fromGoal({ title: '아침 6시 기상', topic: '', category: 'etc' }), 'morning');
  assert.strictEqual(CM.resolve({ category: 'running' }), 'running', '이미 피드 키면 그대로');
  assert.strictEqual(CM.resolve({ topic: 'health/러닝·마라톤', category: 'study' }), 'running', 'topic 이 category 라벨보다 우선');
  assert.strictEqual(CM.resolve({}), null);

  // 4. 팀(모임) topic 도 같은 표를 탄다 (boot-comm-seeds.js 의 group.topic 형식)
  assert.strictEqual(CM.fromTopic('health/크로스핏·피트니스'), 'workout', '표 밖 중범위 → 대범위 기본값');
  assert.strictEqual(CM.fromTopic('career/기획·전략'), 'career');
  assert.strictEqual(CM.fromTopic('hobby/여행·캠핑'), 'hobby');

  // 5. 넓히기 인접은 같은 대범위 안에서만
  assert.deepStrictEqual(CM.adjacent('running').sort(), ['diet', 'workout']);
  assert.deepStrictEqual(CM.adjacent('study').sort(), ['dev', 'reading']);
  assert.ok(CM.adjacent('travel').indexOf('workout') === -1, 'travel↔workout 같은 대범위 아님');
  assert.ok(CM.adjacent('hobby').length === 0, 'hobby 는 혼자');
  CM.FEED_KEYS.forEach(k => CM.adjacent(k).forEach(a => assert.strictEqual(CM.FEED_MAJOR[a], CM.FEED_MAJOR[k])));

  // 6. 글 메타 7칸
  const meta = CM.feedPostMeta({ id: 'g1', title: '매일 5km', topic: 'health/러닝·마라톤', category: 'health', visibility: 'theme' }, null, { pct: 23.6, contentType: 'record' });
  assert.deepStrictEqual(meta, { category: 'running', goal_id: 'g1', group_id: null, content_type: 'record', author_pct: 24, topic: 'health/러닝·마라톤', goal_visibility: 'theme' });
  const tmeta = CM.feedPostMeta(null, { id: 'g-run', name: '새벽 러너', topic: 'health/러닝·마라톤' }, { pct: 100 });
  assert.strictEqual(tmeta.content_type, 'team_done');
  assert.strictEqual(tmeta.group_id, 'g-run');
  assert.strictEqual(tmeta.category, 'running');
  assert.strictEqual(CM.feedPostMeta({ id: 'g2', title: '???', topic: '', category: '일반' }, null, {}).category, 'life', '새 글은 못 찾으면 life (사용자가 칩으로 고침)');
  assert.strictEqual(CM.feedPostMeta({ id: 'g2', title: 'x' }, null, { categoryOverride: 'dev' }).category, 'dev', '사용자가 고른 칩이 우선');
  const post = CM.withMeta({ id: 'p1', extra: { photo: null } }, meta);
  assert.strictEqual(post.category, 'running');
  assert.strictEqual(post.extra.category, 'running');
  assert.strictEqual(post.extra.goalId, 'g1');
  assert.strictEqual(post.extra.goalPct, 24);
  assert.strictEqual(post.extra.photo, null, '기존 extra 유지');
  const stripped = CM.stripMeta(post);
  CM.META_COLUMNS.forEach(c => assert.ok(!(c in stripped), `${c} 는 떼어져야 함`));
  assert.ok('extra' in stripped && 'id' in stripped);
  assert.ok(CM.isMissingColumn({ code: 'PGRST204', message: "Could not find the 'category' column of 'feed_posts'" }));
  assert.ok(!CM.isMissingColumn({ code: '23505', message: 'duplicate key' }));

  // 7. 칸이 없는 서버에서는 메타를 떼고 재시도한다 (가짜 클라이언트는 값을 바로 돌려주므로 동기로 검사)
  {
    const calls = [];
    const fakeSb = { from: () => ({ insert: (p) => { calls.push(p); return calls.length === 1 ? { error: { code: 'PGRST204', message: "Could not find the 'topic' column" } } : { error: null }; } }) };
    const r = CM.insertFeedPost(fakeSb, post);
    assert.strictEqual(calls.length, 2, '첫 insert 거절 → 메타 떼고 1회 재시도');
    assert.ok(!('category' in calls[1]) && 'extra' in calls[1]);
    assert.strictEqual(r.metaStripped, true);
    const okSb = { from: () => ({ insert: (p) => ({ error: null, data: [p] }) }) };
    const r2 = CM.insertFeedPost(okSb, post);
    assert.ok(!r2.metaStripped && !r2.error);
    const teamCalls = [];
    const teamSb = { from: () => ({ insert: (p) => { teamCalls.push(p); return { error: null }; } }) };
    CM.insertTeamDonePost(teamSb, { id: 'p9', caption: '완주', extra: {} }, { id: 'g-run', name: '새벽 러너', topic: 'health/러닝·마라톤' });
    assert.strictEqual(teamCalls[0].category, 'running');
    assert.strictEqual(teamCalls[0].content_type, 'team_done');
    assert.strictEqual(teamCalls[0].extra.badge, '팀 완주 🏆');

    // 8. SQL 사본과 내용 일치 (docs/sql/2026-10-13-feed-posts-category-columns.sql)
    const sql = fs.readFileSync(path.join(ROOT, 'docs', 'sql', '2026-10-13-feed-posts-category-columns.sql'), 'utf8');
    Object.keys(CM.TOPIC_MAP).forEach(major => {
      Object.keys(CM.TOPIC_MAP[major].subs).forEach(sub => {
        const key = CM.TOPIC_MAP[major].subs[sub];
        assert.ok(sql.includes(`('${major}', '${sub}', '${key}')`), `SQL 매핑표에 ('${major}', '${sub}', '${key}') 행이 있어야 함`);
      });
      assert.ok(sql.includes(`when '${major}' then '${CM.TOPIC_MAP[major].default}'`), `SQL 대범위 기본값 ${major}`);
    });
    CM.FEED_KEYS.forEach(k => assert.ok(sql.includes(`'${k}'`), `SQL check 제약에 ${k}`));
    Object.keys(CM.LABEL_TO_MAJOR).forEach(label => {
      if (CM.TOPIC_MAP[label]) return; // 영문 키는 대범위 자체
      assert.ok(sql.includes(`'${label}'`), `SQL 라벨 정규화에 '${label}'`);
    });
    CM.META_COLUMNS.forEach(c => assert.ok(sql.includes(`add column if not exists ${c} `), `SQL 에 ${c} 칸 추가`));
    assert.ok(sql.includes('add column if not exists source text'), 'team_pings.source 칸');
    assert.ok(sql.includes('feed_posts_backfill_category'), '채우기 RPC');
    assert.ok(sql.includes('feed_post_set_category'), '글쓴이 카테고리 수정 RPC');
    assert.ok(!/\bdefault\s+'life'/i.test(sql), '채우기는 life 로 메우지 않는다');

    // 9. index.html 이 모듈을 피드 코드보다 먼저 싣는다
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const tagAt = html.indexOf('js/data/category-map.js');
    assert.ok(tagAt > -1, 'index.html 에 category-map.js script 태그');
    assert.ok(tagAt < html.indexOf('js/tabs/comm/feed-posts-sync.js'), 'feed-posts-sync.js 보다 먼저');
    assert.ok(tagAt < html.indexOf('js/tabs/records/checkin-feedback.js'), 'checkin-feedback.js 보다 먼저');

    // 10. 글 생성 3곳이 메타를 기록한다 (share-to-feed.js 는 DIR-006 담당 — 이 PR 범위 밖)
    ['js/tabs/records/checkin-feedback.js', 'js/tabs/goals/focus-autopilot.js', 'js/tabs/goals/team-goals-screen.js'].forEach(f => {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      assert.ok(src.includes('OurgoalCategoryMap'), `${f} 가 OurgoalCategoryMap 으로 메타를 붙여야 함`);
      assert.ok(/insert(TeamDone|Feed)Post\(/.test(src), `${f} 가 insertFeedPost/insertTeamDonePost 로 넣어야 함(칸 없을 때 재시도)`);
    });
    const sync = fs.readFileSync(path.join(ROOT, 'js', 'tabs', 'comm', 'feed-posts-sync.js'), 'utf8');
    assert.ok(sync.includes("in('category'"), 'feed-posts-sync.js 가 내 카테고리 글을 추가 조회');

    console.log(`[TEST PASS] ${SUITE_NAME}`);
  }
}

if (require.main === module) runTests();
module.exports = { runTests };
