const assert = require('assert');
const path = require('path');

console.log('🧪 [테스트] 계정 영구 삭제(purge) 연쇄 삭제·잔여 0건 검증 (#T019) 시작...');

const withdraw = require(path.join(__dirname, '..', 'api', 'withdraw.js'));
const purgeUserData = withdraw.purgeUserData;
const PURGE_TARGETS = withdraw.PURGE_TARGETS;
assert.strictEqual(typeof purgeUserData, 'function', 'purgeUserData 가 노출되어야 함');

const UID = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

// 메모리 DB 로 흉내 낸 Supabase 클라이언트. opts 로 장애를 주입한다.
function makeMockSb(db, opts) {
  opts = opts || {};
  return {
    from: function (table) {
      function run(kind) {
        return {
          eq: async function (col, val) {
            if (!(table in db)) return { error: { code: 'PGRST205', message: 'Could not find the table' }, count: null };
            if (kind === 'delete' && opts.failDelete === table) return { error: { code: '42501', message: 'permission denied' }, count: null };
            if (kind === 'count' && opts.failCount === table) return { error: { code: '57014', message: 'timeout' }, count: null };
            const hit = db[table].filter(function (row) { return row[col] === val; });
            if (kind === 'delete') {
              if (opts.stickyTable === table) return { error: null, count: 0 };
              db[table] = db[table].filter(function (row) { return row[col] !== val; });
            }
            return { error: null, count: hit.length };
          }
        };
      }
      return {
        delete: function () { return run('delete'); },
        select: function () { return run('count'); }
      };
    },
    auth: { admin: { deleteUser: async function () {
      return opts.failAuth ? { error: { message: 'auth delete failed' } } : { error: null };
    } } }
  };
}

function seed() {
  return {
    users: [{ id: UID }, { id: OTHER }],
    goals: [{ id: 'g1', user_id: UID }, { id: 'g2', user_id: UID }, { id: 'g3', user_id: OTHER }],
    checkins: [{ id: 'c1', user_id: UID }, { id: 'c2', user_id: OTHER }],
    feed_posts: [{ id: 'f1', user_id: UID }],
    push_subscriptions: [{ id: 'p1', user_id: UID }],
    team_comments: [{ id: 't1', user_id: UID }],
    team_pings: [{ id: 'tp1', sender_id: UID, receiver_id: OTHER }, { id: 'tp2', sender_id: OTHER, receiver_id: UID }],
    team_ping_replies: [{ id: 'r1', sender_id: UID }, { id: 'r2', sender_id: OTHER }],
    content_reports: [{ id: 1, reporter_id: UID }]
    // content_reactions · helpful_reasons · user_blocks 는 운영처럼 '없는 테이블'로 둔다
  };
}

(async function () {
  // 1. 정상 경로
  let db = seed();
  let out = await purgeUserData(makeMockSb(db), UID);
  assert.strictEqual(out.ok, true, '정상 경로는 ok');
  assert.strictEqual(out.remainingTotal, 0, '잔여 0건');
  assert.strictEqual(out.authUserDeleted, true);
  assert.strictEqual(out.deleted['goals.user_id'], 2);
  assert.strictEqual(out.deleted['users.id'], 1);
  assert.deepStrictEqual(out.skipped.sort(), ['content_reactions.user_id', 'helpful_reasons.user_id', 'user_blocks.blocked_id', 'user_blocks.blocker_id']);
  assert.strictEqual(db.goals.length, 1, '다른 사용자의 목표는 남아야 함');
  assert.strictEqual(db.users.length, 1, '다른 사용자는 남아야 함');
  assert.strictEqual(db.team_pings.length, 1, '상대가 보낸 찌르기는 남아야 함');
  assert.strictEqual(db.team_ping_replies.length, 1, '상대가 쓴 답장은 남아야 함');
  console.log('  ✓ 1. 정상 경로: 본인 행 전부 삭제·잔여 0·타인 데이터 보존');

  // 2. 삭제 오류는 삼키지 않는다
  db = seed();
  out = await purgeUserData(makeMockSb(db, { failDelete: 'goals' }), UID);
  assert.strictEqual(out.ok, false, '삭제 오류가 있으면 ok 는 false');
  assert.strictEqual(out.deleted['goals.user_id'], null, '못 지운 곳의 삭제 수는 0 이 아니라 null');
  assert.strictEqual(out.remaining['goals.user_id'], 2, '잔여 행이 그대로 보고되어야 함');
  assert.ok(out.errors.some(function (e) { return e.step === 'delete' && e.target === 'goals.user_id'; }));
  console.log('  ✓ 2. 삭제 오류: ok=false · 잔여 2건 보고');

  // 3. 오류 없이 행이 남은 경우(RLS·조용한 실패)도 잡는다
  db = seed();
  out = await purgeUserData(makeMockSb(db, { stickyTable: 'checkins' }), UID);
  assert.strictEqual(out.ok, false, '잔여 행이 있으면 ok 는 false');
  assert.strictEqual(out.remaining['checkins.user_id'], 1);
  assert.strictEqual(out.errors.length, 0, '오류는 없었지만 잔여로 실패 판정');
  console.log('  ✓ 3. 조용한 실패: 오류 0건이어도 잔여 1건이면 ok=false');

  // 4. 잔여를 못 재면 null, 0 으로 채우지 않는다
  db = seed();
  out = await purgeUserData(makeMockSb(db, { failCount: 'feed_posts' }), UID);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.remaining['feed_posts.user_id'], null);
  assert.strictEqual(out.remainingTotal, null, '하나라도 못 쟀으면 합계도 null');
  console.log('  ✓ 4. 측정 실패: 잔여=null · 합계=null · ok=false');

  // 5. auth 사용자 삭제 실패
  db = seed();
  out = await purgeUserData(makeMockSb(db, { failAuth: true }), UID);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.authUserDeleted, false);
  console.log('  ✓ 5. auth 삭제 실패: ok=false');

  // 6. 대상 목록 불변식
  const names = PURGE_TARGETS.map(function (t) { return t.table; });
  assert.strictEqual(names[names.length - 1], 'users', 'users 는 마지막(부모)이어야 함');
  assert.strictEqual(names.indexOf('events'), -1, 'events 는 user_id 가 없는 익명 로그라 대상이 아님');
  ['goals', 'checkins', 'team_pings', 'team_ping_replies', 'team_comments'].forEach(function (n) {
    assert.ok(names.indexOf(n) !== -1, n + ' 가 대상에 있어야 함');
  });
  console.log('  ✓ 6. 대상 목록: users·goals·checkins·메시지 3종 포함, users 가 마지막');

  // 7. 핸들러: POST 외 메서드는 405
  const handler = withdraw;
  process.env.SUPABASE_SERVICE_ROLE_KEY = '';
  let status = null;
  await handler({ method: 'GET', headers: {} }, { status: function (s) { status = s; return { json: function () {} }; } });
  assert.strictEqual(status, 405);
  console.log('  ✓ 7. 핸들러: POST 외 메서드 405');

  console.log('🎉 계정 영구 삭제 검증 7/7 통과');
})().catch(function (err) {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
