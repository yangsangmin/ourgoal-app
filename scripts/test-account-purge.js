// [#TASK-ES-351] 탈퇴 신청 서버 기록·복구·본인 즉시 삭제 검증 (모의 Supabase, 네트워크 없음)
// 1~7 은 PR #357(#T019) 의 purge 시험을 가져온 것이고, 8 이후가 이번 작업의 신청·복구·대상 목록 대조다.
// 매일 자동 파기 SQL 함수 자체는 docs/sql/2026-10-04-account-purge-test.mjs(PGlite)가 잰다.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 끝까지 가지 못하고(대기 중인 약속이 풀리지 않아) 이벤트 루프가 비면 통과로 끝나지 않게 한다
let finished = false;
process.on('exit', function (code) { if (!finished && code === 0) { console.error('❌ 시험이 끝까지 실행되지 않았다'); process.exit(1); } });

console.log('🧪 [테스트] 계정 파기·탈퇴 신청 서버 기록 검증 (#TASK-ES-351, #T019) 시작...');

const withdraw = require(path.join(__dirname, '..', 'api', 'withdraw.js'));
const { purgeUserData, recordDeletionRequest, clearDeletionRequest, deletionStatus, PURGE_TARGETS, DELETION_KEY, GRACE_DAYS } = withdraw;
assert.strictEqual(typeof purgeUserData, 'function', 'purgeUserData 가 노출되어야 함');

const UID = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const DAY = 86400000;

// 메모리 DB 로 흉내 낸 Supabase 클라이언트. opts 로 장애를 주입한다.
function makeMockSb(db, opts) {
  opts = opts || {};
  const users = opts.users || {};
  return {
    from: function (table) {
      function run(kind) {
        function exec(match) {
            if (!(table in db)) return { error: { code: 'PGRST205', message: 'Could not find the table' }, count: null };
            if (kind === 'delete' && opts.failDelete === table) return { error: { code: '42501', message: 'permission denied' }, count: null };
            if (kind === 'count' && opts.failCount === table) return { error: { code: '57014', message: 'timeout' }, count: null };
            const hit = db[table].filter(match);
            if (kind === 'delete') {
              if (opts.stickyTable === table) return { error: null, count: 0 };
              db[table] = db[table].filter(function (row) { return !match(row); });
            }
            return { error: null, count: hit.length };
        }
        return {
          eq: async function (col, val) { return exec(function (row) { return row[col] === val; }); },
          filter: async function (pathExpr, op, val) {
            const m = /^([a-z_]+)->>([A-Za-z_]+)$/.exec(pathExpr);
            assert.ok(m && op === 'eq', 'filter 형식: ' + pathExpr);
            return exec(function (row) { return row[m[1]] && String(row[m[1]][m[2]]) === val; });
          }
        };
      }
      return {
        delete: function () { return run('delete'); },
        select: function () { return run('count'); }
      };
    },
    auth: {
      getUser: async function (token) {
        if (token !== 'tok-' + UID) return { data: null, error: { message: 'bad token' } };
        return { data: { user: { id: UID } }, error: null };
      },
      admin: {
        deleteUser: async function () {
          return opts.failAuth ? { error: { message: 'auth delete failed' } } : { error: null };
        },
        // GoTrue 처럼 app_metadata·user_metadata 는 키 단위로 합치고, null 값은 키를 지운다
        updateUserById: async function (id, attrs) {
          if (opts.failUpdate) return { data: null, error: { message: 'update failed' } };
          const u = users[id] || (users[id] = { id: id, app_metadata: {}, user_metadata: {} });
          if (opts.ignoreWrites) return { data: { user: u }, error: null };
          ['app_metadata', 'user_metadata'].forEach(function (k) {
            Object.keys((attrs && attrs[k]) || {}).forEach(function (key) {
              if (attrs[k][key] === null) delete u[k][key]; else u[k][key] = attrs[k][key];
            });
          });
          return { data: { user: u }, error: null };
        },
        getUserById: async function (id) {
          if (opts.failRead) return { data: null, error: { message: 'read failed' } };
          return users[id] ? { data: { user: users[id] }, error: null } : { data: null, error: { message: 'not found' } };
        }
      }
    }
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
    content_reports: [{ id: 1, reporter_id: UID }],
    credit_ledger: [{ id: 1, user_id: UID }],
    checkins_backup: [{ id: 'c1', user_id: UID }],
    events: [
      { id: 1, sid: null, name: 'settings_ledger', props: { userId: UID, settings: {} } },
      { id: 2, sid: null, name: 'companion_ledger', props: { userId: OTHER } },
      { id: 3, sid: 'anon', name: 'checkin', props: {} }
    ]
    // 나머지 표는 운영처럼 '없는 테이블'로 둔다
  };
}

function fakeRes() {
  const r = { code: null, body: null };
  r.status = function (s) { r.code = s; return { json: function (b) { r.body = b; } }; };
  return r;
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
  assert.strictEqual(out.deleted['credit_ledger.user_id'], 1);
  assert.strictEqual(out.deleted['events.props.userId'], 1, 'events 의 내 설정 원장 행 삭제');
  assert.strictEqual(db.events.length, 2, '타인 원장·익명 이벤트는 남음');
  assert.ok(out.skipped.indexOf('content_reactions.user_id') !== -1, '없는 표는 skipped 에 이름이 남는다');
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
  ['goals', 'checkins', 'team_pings', 'team_ping_replies', 'team_comments', 'credit_ledger', 'goals_backup', 'checkins_backup'].forEach(function (n) {
    assert.ok(names.indexOf(n) !== -1, n + ' 가 대상에 있어야 함');
  });
  console.log('  ✓ 6. 대상 목록: users·goals·checkins·메시지 3종·백업 표 포함, users 가 마지막');

  // 7. 핸들러: POST 외 메서드는 405, 확인 문구 없는 purge 는 400
  let res = fakeRes();
  await withdraw({ method: 'GET', headers: {} }, res);
  assert.strictEqual(res.code, 405);
  withdraw._client = makeMockSb(seed(), { users: {} });
  res = fakeRes();
  await withdraw({ method: 'POST', headers: { authorization: 'Bearer tok-' + UID }, body: { mode: 'purge' } }, res);
  assert.strictEqual(res.code, 400, '확인 문구 없는 purge 는 거부');
  console.log('  ✓ 7. 핸들러: POST 외 405 · 확인 문구 없는 purge 400');

  // 8. 탈퇴 신청: 서버(app_metadata)에 시각을 쓰고 다시 읽어 확인한다
  let users = {};
  const now = Date.parse('2026-10-04T00:00:00.000Z');
  let rec = await recordDeletionRequest(makeMockSb({}, { users: users }), UID, now);
  assert.strictEqual(rec.ok, true);
  assert.strictEqual(users[UID].app_metadata[DELETION_KEY], '2026-10-04T00:00:00.000Z', 'app_metadata 에 신청 시각');
  assert.strictEqual(rec.purgeAfter, '2026-11-03T00:00:00.000Z', '파기 가능 시각 = 신청 + 30일');
  assert.strictEqual(users[UID].user_metadata.account_status, 'pending_deletion');
  rec = await recordDeletionRequest(makeMockSb({}, { users: {}, ignoreWrites: true }), UID, now);
  assert.strictEqual(rec.ok, false, '써지지 않았으면(재조회에 없음) ok=false');
  rec = await recordDeletionRequest(makeMockSb({}, { users: {}, failUpdate: true }), UID, now);
  assert.strictEqual(rec.ok, false, '쓰기 오류면 ok=false');
  console.log('  ✓ 8. 신청: app_metadata 기록·재조회 확인, 실패는 ok=false');

  // 9. 29일 계정은 대상 아님 · 31일 계정은 대상 (서버 기록 기준 계산)
  const reqAt = { id: UID, app_metadata: {} };
  reqAt.app_metadata[DELETION_KEY] = new Date(now).toISOString();
  let st = deletionStatus(reqAt, now + 29 * DAY);
  assert.strictEqual(st.pending, true);
  assert.strictEqual(st.due, false, '29일: 대상 아님');
  assert.strictEqual(st.remainDays, 1);
  st = deletionStatus(reqAt, now + 31 * DAY);
  assert.strictEqual(st.due, true, '31일: 대상');
  assert.strictEqual(st.remainDays, 0);
  assert.strictEqual(deletionStatus({ app_metadata: {} }, now).pending, false, '기록 없음: 신청 아님');
  assert.strictEqual(deletionStatus({ user_metadata: { account_status: 'pending_deletion' } }, now).pending, false, 'user_metadata(사용자가 쓸 수 있는 칸)는 근거가 아님');
  assert.strictEqual(deletionStatus({ app_metadata: { deletion_requested_at: 'x' } }, now).invalid, true, '잘못된 시각은 invalid');
  assert.strictEqual(GRACE_DAYS, 30);
  console.log('  ✓ 9. 29일 대상 아님 · 31일 대상 · 사용자 메타데이터는 근거 아님');

  // 10. 복구: 서버 기록을 지우고 다시 읽어 비었는지 확인
  users = {};
  await recordDeletionRequest(makeMockSb({}, { users: users }), UID, now);
  let cl = await clearDeletionRequest(makeMockSb({}, { users: users }), UID);
  assert.strictEqual(cl.ok, true);
  assert.ok(!(DELETION_KEY in users[UID].app_metadata), '복구 뒤 서버 기록 없음');
  assert.strictEqual(users[UID].user_metadata.account_status, 'active');
  users = {};
  await recordDeletionRequest(makeMockSb({}, { users: users }), UID, now);
  cl = await clearDeletionRequest(makeMockSb({}, { users: users, ignoreWrites: true }), UID);
  assert.strictEqual(cl.ok, false, '기록이 남아 있으면 복구 ok=false');
  console.log('  ✓ 10. 복구: 서버 기록 삭제·재조회 확인, 남아 있으면 ok=false');

  // 11. 핸들러 왕복: request → restore (토큰 주인 계정에만)
  users = {};
  withdraw._client = makeMockSb({}, { users: users });
  res = fakeRes();
  await withdraw({ method: 'POST', headers: { authorization: 'Bearer tok-' + UID }, body: { mode: 'request' } }, res);
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.body.status, 'pending_deletion');
  assert.ok(users[UID].app_metadata[DELETION_KEY], '요청 모드가 서버 기록을 남김');
  res = fakeRes();
  await withdraw({ method: 'POST', headers: { authorization: 'Bearer tok-' + UID }, body: {} }, res);
  assert.strictEqual(res.body.status, 'pending_deletion', 'mode 없으면 요청 모드');
  res = fakeRes();
  await withdraw({ method: 'POST', headers: { authorization: 'Bearer tok-' + UID }, body: { mode: 'restore' } }, res);
  assert.strictEqual(res.code, 200);
  assert.ok(!(DELETION_KEY in users[UID].app_metadata), '복구 모드가 서버 기록을 지움');
  res = fakeRes();
  await withdraw({ method: 'POST', headers: { authorization: 'Bearer wrong' }, body: { mode: 'request' } }, res);
  assert.strictEqual(res.code, 401, '남의/잘못된 토큰은 401');
  withdraw._client = makeMockSb({}, { users: {}, failUpdate: true });
  res = fakeRes();
  await withdraw({ method: 'POST', headers: { authorization: 'Bearer tok-' + UID }, body: { mode: 'request' } }, res);
  assert.strictEqual(res.code, 500);
  assert.strictEqual(res.body.ok, false, '서버 기록 실패는 ok=false 로 화면에 알린다');
  withdraw._client = null;
  console.log('  ✓ 11. 핸들러: 신청·복구 왕복, 잘못된 토큰 401, 기록 실패 500');

  // 12. 자동 파기 SQL 함수의 대상 목록 = PURGE_TARGETS (두 곳이 어긋나지 않게)
  const sql = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sql', '2026-10-04-account-purge-install.sql'), 'utf8');
  const block = sql.slice(sql.indexOf('$targets$') + 9, sql.lastIndexOf('$targets$'));
  const sqlTargets = [...block.matchAll(/\(\s*\d+,\s*'([a-z_]+)',\s*'([a-z_]+)'\)/g)].map(function (m) { return m[1] + '.' + m[2]; });
  assert.deepStrictEqual(sqlTargets, PURGE_TARGETS.map(function (t) { return t.table + '.' + t.col; }), 'SQL 대상 목록과 API 대상 목록이 같아야 함');
  const jblock = sql.slice(sql.indexOf('$jtargets$') + 10, sql.lastIndexOf('$jtargets$'));
  const sqlJson = [...jblock.matchAll(/\(\s*\d+,\s*'([a-z_]+)',\s*'([a-z_]+)',\s*'([A-Za-z_]+)'\)/g)].map(function (m) { return m[1] + '.' + m[2] + '.' + m[3]; });
  assert.deepStrictEqual(sqlJson, withdraw.PURGE_JSON_TARGETS.map(function (t) { return t.table + '.' + t.col + '.' + t.key; }), 'SQL json 대상과 API json 대상이 같아야 함');
  assert.ok(sql.includes("interval '30 days'"), 'SQL 대상 조건 30일');
  assert.ok(sql.includes("raw_app_meta_data->>'deletion_requested_at'"), 'SQL 이 API 와 같은 서버 기록 칸을 읽음');
  assert.ok(sql.includes('least(greatest(coalesce(p_limit, 50), 1), 50)'), 'SQL 처리 상한 50');
  assert.ok(sql.includes('perform cron.alter_job(v_job, active := false);'), '예약은 꺼진 채 설치');
  console.log('  ✓ 12. SQL 대상 목록·30일·상한 50·꺼진 예약이 API 와 일치');

  // 13. 로그인 시 복구 판정(js/auth-safety.js) — 서버 기록 기준, 복구는 서버 restore 성공 때만
  const vm = require('vm');
  const authSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth-safety.js'), 'utf8');
  async function runCheck(o) {
    const calls = { fetch: [], logout: [], modal: null, saved: 0 };
    let sheetButtons = {};
    const win = {
      console: console,
      fetch: async function (url, init) { calls.fetch.push({ url: url, body: JSON.parse(init.body) }); return { ok: o.restoreOk, status: o.restoreOk ? 200 : 500, json: async function () { return { ok: o.restoreOk }; } }; },
      addEventListener: function () {}, localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }, sessionStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      document: { getElementById: function () { return null; }, addEventListener: function () {}, readyState: 'complete', querySelector: function () { return null; } }
    };
    win.window = win;
    vm.runInNewContext(authSrc, win);
    const api = win.OurgoalAuthSafety;
    const state = { profile: { id: UID, settings: o.localMark ? { pendingDeletionAt: o.localMark } : {} } };
    const sb = { auth: {
      getUser: async function () { return o.getUserFails ? { data: null, error: { message: 'x' } } : { data: { user: { id: UID, app_metadata: o.appMeta || {} } }, error: null }; },
      getSession: async function () { return { data: { session: { access_token: 'tok', user: { id: UID, app_metadata: o.sessionMeta || {} } } } }; }
    } };
    api.init({ sb: sb, state: state, toast: function () {}, performLogout: async function (m) { calls.logout.push(m); },
      saveProfile: async function () { calls.saved++; }, closeModal: function () {},
      openModal: function (htmlStr, cb) {
        calls.modal = htmlStr;
        const mk = function (id) { return sheetButtons[id] = { id: id, onclick: null, disabled: false }; };
        cb({ querySelector: function (sel) { return mk(sel.slice(1)); } });
      } });
    const p = api.checkPendingDeletionRestore();
    await new Promise(function (r) { setTimeout(r, 0); });
    if (o.click && sheetButtons[o.click]) await sheetButtons[o.click].onclick();
    const result = await p;
    return { result: result, calls: calls, state: state };
  }
  const iso = function (daysAgo) { return new Date(Date.now() - daysAgo * DAY).toISOString(); };
  let rc = await runCheck({ appMeta: {} });
  assert.strictEqual(rc.result, false, '서버 기록·이 기기 표시 둘 다 없으면 그냥 진입');
  assert.strictEqual(rc.calls.modal, null);
  rc = await runCheck({ appMeta: { deletion_requested_at: iso(10) }, click: 'btnRestoreAccount', restoreOk: true });
  assert.ok(rc.calls.modal.includes('영구 파기까지 20일'), '다른 기기(이 기기 표시 없음)에서도 서버 기록으로 복구 창: ' + rc.calls.modal);
  assert.strictEqual(rc.calls.fetch.length, 1);
  assert.strictEqual(rc.calls.fetch[0].url, '/api/withdraw');
  assert.strictEqual(rc.calls.fetch[0].body.mode, 'restore', '복구 버튼이 서버 restore 호출');
  assert.strictEqual(rc.result, false, '복구 성공 → 앱 진입');
  rc = await runCheck({ appMeta: { deletion_requested_at: iso(10) }, click: 'btnRestoreAccount', restoreOk: false });
  assert.strictEqual(rc.result, true, '서버 복구 실패 → 앱에 들여보내지 않음');
  assert.strictEqual(rc.calls.logout.length, 1);
  rc = await runCheck({ appMeta: { deletion_requested_at: iso(31) } });
  assert.strictEqual(rc.result, true, '30일 지남 → 로그아웃(파기 대기)');
  assert.strictEqual(rc.calls.modal, null);
  rc = await runCheck({ getUserFails: true, sessionMeta: { deletion_requested_at: iso(5) }, click: 'btnCancelRestore' });
  assert.strictEqual(rc.result, true, '로그아웃(탈퇴 신청 유지) 선택 → 진입 안 함');
  assert.ok(rc.calls.modal && rc.calls.modal.includes('영구 파기까지 25일'), 'getUser 실패 시 세션 app_metadata 로 판정');
  rc = await runCheck({ appMeta: {}, localMark: Date.now() - 3 * DAY, click: 'btnRestoreAccount', restoreOk: true });
  assert.ok(rc.calls.modal.includes('자동 파기 대상이 아니며'), '서버 기록 없는 옛 신청은 사실대로 안내');
  assert.strictEqual(rc.calls.fetch.length, 0, '옛 신청 복구는 서버 호출 없이 표시만 지움');
  assert.ok(!('pendingDeletionAt' in rc.state.profile.settings), '이 기기 표시 삭제');
  console.log('  ✓ 13. 로그인 복구 판정: 서버 기록 기준·다른 기기·복구 실패 시 진입 차단·30일 경과 로그아웃·옛 신청 정직 안내');

  finished = true;
  console.log('🎉 계정 파기·탈퇴 신청 검증 13/13 통과');
})().catch(function (err) {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
