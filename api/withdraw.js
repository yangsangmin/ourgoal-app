var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// [#TASK-ES-351] 탈퇴 신청 시각은 auth 사용자의 app_metadata 에 둔다.
// app_metadata 는 서비스롤만 쓸 수 있어 사용자가 sb.auth.updateUser 로 지우거나 앞당길 수 없고,
// 어느 기기에서 로그인해도 getUser() 로 읽히며, 매일 도는 파기 함수(docs/sql/2026-10-04-account-purge-install.sql)가
// auth.users.raw_app_meta_data 에서 같은 칸을 읽는다. 계정이 파기되면 이 기록도 auth 사용자와 함께 사라진다.
var DELETION_KEY = 'deletion_requested_at';
var GRACE_DAYS = 30;
var DAY_MS = 86400000;

// 영구 파기 대상: 사용자 소유 테이블과 소유 컬럼 (#T019 PR #357 운영 스키마 실측 목록을 가져와 #TASK-ES-351 에서 보탬).
// 자식 → 부모 순서. events 는 user_id 를 저장하지 않는 익명 세션 로그라 대상이 아니다.
// team_ping_replies·team_pings 의 receiver_id 쪽은 상대방이 쓴 글이라 지우지 않는다.
// 매일 자동 파기 SQL 함수(ourgoal_private.account_purge_targets)도 같은 목록이다 — scripts/test-account-purge.js 가 둘을 대조한다.
var PURGE_TARGETS = [
  { table: 'team_ping_replies', col: 'sender_id' },
  { table: 'team_pings', col: 'sender_id' },
  { table: 'team_comments', col: 'user_id' },
  { table: 'content_reports', col: 'reporter_id' },
  { table: 'content_reactions', col: 'user_id' },
  { table: 'helpful_reasons', col: 'user_id' },
  { table: 'user_blocks', col: 'blocker_id' },
  { table: 'user_blocks', col: 'blocked_id' },
  { table: 'template_copies', col: 'copier_user_id' },
  { table: 'credit_ledger', col: 'user_id' },
  { table: 'push_subscriptions', col: 'user_id' },
  { table: 'inquiries', col: 'user_id' },
  { table: 'app_evaluations', col: 'user_id' },
  { table: 'user_action_logs', col: 'user_id' },
  { table: 'user_interactions', col: 'user_id' },
  { table: 'goals_backup', col: 'user_id' },
  { table: 'checkins_backup', col: 'user_id' },
  { table: 'feed_posts', col: 'user_id' },
  { table: 'checkins', col: 'user_id' },
  { table: 'goals', col: 'user_id' },
  { table: 'user_ledger_docs', col: 'user_id' },
  { table: 'users', col: 'id' }
];
// 사용자 칸 대신 jsonb 안에 사용자 id 를 담는 행: events 의 settings_ledger·companion_ledger(api/track.js 가 props.userId 로 씀).
// 익명 이벤트(props 에 userId 없음)는 건드리지 않는다. SQL 의 ourgoal_private.account_purge_json_targets 와 같은 목록이다.
var PURGE_JSON_TARGETS = [
  { table: 'events', col: 'props', key: 'userId' },
  { table: 'events', col: 'props', key: 'user_id' }
];
var PURGE_CONFIRM = 'PERMANENT_DELETE';

// 칸 대상은 .eq(칸, uid), json 대상은 .filter('props->>userId', 'eq', uid)
function allPurgeTargets() {
  var list = PURGE_TARGETS.map(function (t) {
    return { key: t.table + '.' + t.col, table: t.table, apply: function (q, uid) { return q.eq(t.col, uid); } };
  });
  PURGE_JSON_TARGETS.forEach(function (t) {
    var path = t.col + '->>' + t.key;
    list.push({ key: t.table + '.' + t.col + '.' + t.key, table: t.table, apply: function (q, uid) { return q.filter(path, 'eq', uid); } });
  });
  return list;
}

// 운영 DB 에 아직 없는 테이블(PGRST205·42P01)·컬럼(42703·PGRST204)은 오류가 아니라 '없음'으로 건너뛰고 skipped 에 이름을 남긴다.
function isMissingRelation(error) {
  var code = error && error.code;
  return code === 'PGRST205' || code === '42P01' || code === '42703' || code === 'PGRST204';
}

// 탈퇴 신청 상태 계산 — 서버 기록(app_metadata)만 본다. 못 읽은 시각은 '신청 없음'이 아니라 invalid 로 돌려준다.
function deletionStatus(user, nowMs) {
  var meta = (user && user.app_metadata) || {};
  var raw = meta[DELETION_KEY];
  if (raw === undefined || raw === null || raw === '') return { pending: false };
  var t = Date.parse(raw);
  if (!isFinite(t)) return { pending: true, invalid: true, requestedAt: String(raw) };
  var purgeAfterMs = t + GRACE_DAYS * DAY_MS;
  var now = typeof nowMs === 'number' ? nowMs : Date.now();
  return {
    pending: true,
    requestedAt: new Date(t).toISOString(),
    purgeAfter: new Date(purgeAfterMs).toISOString(),
    remainDays: Math.max(0, Math.ceil((purgeAfterMs - now) / DAY_MS)),
    due: now >= purgeAfterMs
  };
}

async function readUser(sb, uid) {
  var r = await sb.auth.admin.getUserById(uid);
  if (!r || r.error || !r.data || !r.data.user) return { error: (r && r.error && r.error.message) || 'user not found' };
  return { user: r.data.user };
}

// 탈퇴 신청: 서버에 시각을 쓰고, 다시 읽어 그 값이 실제로 저장됐을 때만 ok.
async function recordDeletionRequest(sb, uid, nowMs) {
  var now = typeof nowMs === 'number' ? nowMs : Date.now();
  var iso = new Date(now).toISOString();
  var purgeAfter = new Date(now + GRACE_DAYS * DAY_MS).toISOString();
  var appMeta = {};
  appMeta[DELETION_KEY] = iso;
  var w = await sb.auth.admin.updateUserById(uid, {
    app_metadata: appMeta,
    user_metadata: { account_status: 'pending_deletion', withdrawal_requested_at: iso, withdrawal_purge_at: purgeAfter }
  });
  if (w && w.error) return { ok: false, error: w.error.message, step: 'write' };
  var rd = await readUser(sb, uid);
  if (rd.error) return { ok: false, error: rd.error, step: 'verify' };
  var saved = (rd.user.app_metadata || {})[DELETION_KEY];
  if (saved !== iso) return { ok: false, error: 'server record not found after write', step: 'verify' };
  return { ok: true, requestedAt: iso, purgeAfter: purgeAfter, graceDays: GRACE_DAYS };
}

// 복구: 서버 기록을 지우고, 다시 읽어 칸이 비었을 때만 ok.
async function clearDeletionRequest(sb, uid) {
  var appMeta = {};
  appMeta[DELETION_KEY] = null;
  var w = await sb.auth.admin.updateUserById(uid, {
    app_metadata: appMeta,
    user_metadata: { account_status: 'active', withdrawal_requested_at: null, withdrawal_purge_at: null, deleted_at: null }
  });
  if (w && w.error) return { ok: false, error: w.error.message, step: 'write' };
  var rd = await readUser(sb, uid);
  if (rd.error) return { ok: false, error: rd.error, step: 'verify' };
  var left = (rd.user.app_metadata || {})[DELETION_KEY];
  if (left !== undefined && left !== null && left !== '') return { ok: false, error: 'server record still present after restore', step: 'verify' };
  return { ok: true };
}

// 삭제하고 → auth 사용자를 지우고 → 같은 조건으로 다시 세어 0건인지 잰다. (#T019 PR #357 설계 그대로)
// 못 잰 것은 0 이 아니라 null 이고, null·잔여·오류가 하나라도 있으면 ok 는 false 다.
async function purgeUserData(sb, uid) {
  var deleted = {}, remaining = {}, skipped = [], errors = [];
  var i, t, key, r;
  var targets = allPurgeTargets();

  for (i = 0; i < targets.length; i++) {
    t = targets[i];
    key = t.key;
    try {
      r = await t.apply(sb.from(t.table).delete({ count: 'exact' }), uid);
      if (r.error) {
        if (isMissingRelation(r.error)) { skipped.push(key); continue; }
        deleted[key] = null;
        errors.push({ step: 'delete', target: key, message: r.error.message });
      } else {
        deleted[key] = typeof r.count === 'number' ? r.count : null;
      }
    } catch (e) {
      deleted[key] = null;
      errors.push({ step: 'delete', target: key, message: e.message });
    }
  }

  var authUserDeleted = false;
  try {
    r = await sb.auth.admin.deleteUser(uid);
    if (r.error) errors.push({ step: 'auth', target: 'auth.users', message: r.error.message });
    else authUserDeleted = true;
  } catch (e) {
    errors.push({ step: 'auth', target: 'auth.users', message: e.message });
  }

  for (i = 0; i < targets.length; i++) {
    t = targets[i];
    key = t.key;
    if (skipped.indexOf(key) !== -1) continue;
    try {
      r = await t.apply(sb.from(t.table).select('*', { count: 'exact', head: true }), uid);
      if (r.error) {
        remaining[key] = null;
        errors.push({ step: 'verify', target: key, message: r.error.message });
      } else {
        remaining[key] = typeof r.count === 'number' ? r.count : null;
      }
    } catch (e) {
      remaining[key] = null;
      errors.push({ step: 'verify', target: key, message: e.message });
    }
  }

  var remainingTotal = 0;
  Object.keys(remaining).forEach(function (k) {
    if (remaining[k] === null) remainingTotal = null;
    else if (remainingTotal !== null) remainingTotal += remaining[k];
  });

  return {
    ok: errors.length === 0 && authUserDeleted && remainingTotal === 0,
    deleted: deleted,
    remaining: remaining,
    remainingTotal: remainingTotal,
    authUserDeleted: authUserDeleted,
    skipped: skipped,
    errors: errors
  };
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  var sb = handler._client || getSupabase();
  if (!sb) {
    res.status(500).json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured', fallback: true });
    return;
  }

  var authHeader = (req.headers && req.headers.authorization) || '';
  var token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ ok: false, error: 'Missing bearer authorization token' });
    return;
  }

  try {
    // 토큰 소유자 본인 확인 — 신청·복구·즉시 삭제 모두 토큰 주인의 계정에만 작동한다
    var { data: userData, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !userData || !userData.user) {
      res.status(401).json({ ok: false, error: 'Invalid or expired token' });
      return;
    }

    var uid = userData.user.id;
    var mode = (req.body && req.body.mode) || 'request'; // 'request'(기본, 구 이름 grace_period), 'restore', 'purge'

    // 1. 탈퇴 철회 및 계정 복구 — 서버 기록을 지우고 비었는지 다시 읽어 확인한다
    if (mode === 'restore') {
      var cleared = await clearDeletionRequest(sb, uid);
      if (!cleared.ok) console.error('Restore not verified (' + cleared.step + '):', cleared.error);
      res.status(cleared.ok ? 200 : 500).json(cleared.ok
        ? { ok: true, status: 'active', message: '계정이 복구되었습니다. 서버의 탈퇴 신청 기록을 지웠습니다.' }
        : { ok: false, status: 'restore_unverified', error: cleared.error });
      return;
    }

    // 2. 본인 즉시 영구 삭제 (확인 문구가 있을 때만) — 화면에서는 호출하지 않는다
    if (mode === 'purge') {
      if (!req.body || req.body.confirm !== PURGE_CONFIRM) {
        res.status(400).json({ ok: false, error: 'purge requires confirm: ' + PURGE_CONFIRM });
        return;
      }
      var result = await purgeUserData(sb, uid);
      if (!result.ok) console.error('Purge incomplete:', JSON.stringify(result.errors));
      res.status(result.ok ? 200 : 500).json({
        ok: result.ok,
        status: result.ok ? 'purged' : 'purge_incomplete',
        deleted: result.deleted,
        remaining: result.remaining,
        remainingTotal: result.remainingTotal,
        authUserDeleted: result.authUserDeleted,
        skipped: result.skipped,
        errors: result.errors,
        verifiedAt: new Date().toISOString()
      });
      return;
    }

    if (mode !== 'request' && mode !== 'grace_period') {
      res.status(400).json({ ok: false, error: 'unknown mode' });
      return;
    }

    // 3. 탈퇴 신청: 서버(app_metadata.deletion_requested_at)에 시각을 기록하고 다시 읽어 확인한다.
    //    이 시각 + 30일이 지난 계정만 매일 파기 함수(ourgoal_private.account_purge_run)의 대상이 된다.
    var rec = await recordDeletionRequest(sb, uid, Date.now());
    if (!rec.ok) {
      console.error('Deletion request not recorded (' + rec.step + '):', rec.error);
      res.status(500).json({ ok: false, status: 'request_unverified', error: rec.error });
      return;
    }
    res.status(200).json({
      ok: true,
      status: 'pending_deletion',
      requestedAt: rec.requestedAt,
      purgeAfter: rec.purgeAfter,
      graceDays: rec.graceDays,
      message: '탈퇴 신청을 서버에 기록했습니다. 30일이 지나면 계정과 데이터가 영구 파기되고, 그 전에 다시 로그인하면 복구할 수 있습니다.'
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
  }
}

module.exports = handler;
module.exports.purgeUserData = purgeUserData;
module.exports.recordDeletionRequest = recordDeletionRequest;
module.exports.clearDeletionRequest = clearDeletionRequest;
module.exports.deletionStatus = deletionStatus;
module.exports.PURGE_TARGETS = PURGE_TARGETS;
module.exports.PURGE_JSON_TARGETS = PURGE_JSON_TARGETS;
module.exports.DELETION_KEY = DELETION_KEY;
module.exports.GRACE_DAYS = GRACE_DAYS;
