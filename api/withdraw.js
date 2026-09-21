var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// 영구 파기 대상: 사용자 소유 테이블과 소유 컬럼 (#T019, 2026-09-21 운영 스키마 실측 기준).
// 자식 → 부모 순서. events 는 user_id 를 저장하지 않는 익명 세션 로그라 대상이 아니다.
// team_ping_replies·team_pings 의 receiver_id 쪽은 상대방이 쓴 글이라 지우지 않는다.
var PURGE_TARGETS = [
  { table: 'team_ping_replies', col: 'sender_id' },
  { table: 'team_pings', col: 'sender_id' },
  { table: 'team_comments', col: 'user_id' },
  { table: 'content_reports', col: 'reporter_id' },
  { table: 'content_reactions', col: 'user_id' },
  { table: 'helpful_reasons', col: 'user_id' },
  { table: 'user_blocks', col: 'blocker_id' },
  { table: 'user_blocks', col: 'blocked_id' },
  { table: 'push_subscriptions', col: 'user_id' },
  { table: 'feed_posts', col: 'user_id' },
  { table: 'checkins', col: 'user_id' },
  { table: 'goals', col: 'user_id' },
  { table: 'users', col: 'id' }
];
var PURGE_CONFIRM = 'PERMANENT_DELETE';

// 운영 DB 에 아직 없는 테이블(PGRST205·42P01)은 오류가 아니라 '없음'으로 건너뛴다.
function isMissingTable(error) {
  var code = error && error.code;
  return code === 'PGRST205' || code === '42P01';
}

// 삭제하고 → auth 사용자를 지우고 → 같은 조건으로 다시 세어 0건인지 잰다.
// 못 잰 것은 0 이 아니라 null 이고, null·잔여·오류가 하나라도 있으면 ok 는 false 다.
async function purgeUserData(sb, uid) {
  var deleted = {}, remaining = {}, skipped = [], errors = [];
  var i, t, key, r;

  for (i = 0; i < PURGE_TARGETS.length; i++) {
    t = PURGE_TARGETS[i];
    key = t.table + '.' + t.col;
    try {
      r = await sb.from(t.table).delete({ count: 'exact' }).eq(t.col, uid);
      if (r.error) {
        if (isMissingTable(r.error)) { skipped.push(key); continue; }
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

  for (i = 0; i < PURGE_TARGETS.length; i++) {
    t = PURGE_TARGETS[i];
    key = t.table + '.' + t.col;
    if (skipped.indexOf(key) !== -1) continue;
    try {
      r = await sb.from(t.table).select('*', { count: 'exact', head: true }).eq(t.col, uid);
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  var sb = getSupabase();
  if (!sb) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured', fallback: true });
    return;
  }

  var authHeader = req.headers.authorization || '';
  var token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Missing bearer authorization token' });
    return;
  }

  try {
    // 토큰 소유자 본인 확인
    var { data: userData, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !userData || !userData.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    var uid = userData.user.id;
    var mode = req.body && req.body.mode; // 'grace_period' (기본), 'restore', 'purge'
    var nowMs = Date.now();
    var graceDays = 30;
    var purgeAt = new Date(nowMs + graceDays * 86400000).toISOString();

    // 1. 탈퇴 철회 및 계정 복구 모드
    if (mode === 'restore') {
      await sb.auth.admin.updateUserById(uid, {
        user_metadata: { account_status: 'active', withdrawal_requested_at: null, withdrawal_purge_at: null }
      });
      res.status(200).json({ ok: true, status: 'active', message: '계정이 성공적으로 복구되었습니다.' });
      return;
    }

    // 2. 즉시 완전 영구 파기 모드 (명시적 purge 요청 시에만)
    if (mode === 'purge') {
      if (!req.body || req.body.confirm !== PURGE_CONFIRM) {
        res.status(400).json({ ok: false, error: 'purge requires confirm: ' + PURGE_CONFIRM });
        return;
      }
      var result = await purgeUserData(sb, uid);
      if (!result.ok) console.error('Purge incomplete (' + uid + '):', JSON.stringify(result.errors));
      res.status(result.ok ? 200 : 500).json({
        ok: result.ok,
        status: result.ok ? 'purged' : 'purge_incomplete',
        deletedUserId: uid,
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

    // 3. 표준 모드: 30일 탈퇴 유예 안전망 (grace_period) 적용
    await sb.auth.admin.updateUserById(uid, {
      user_metadata: {
        account_status: 'pending_deletion',
        withdrawal_requested_at: new Date(nowMs).toISOString(),
        withdrawal_purge_at: purgeAt
      }
    });

    res.status(200).json({
      ok: true,
      status: 'grace_period',
      graceDays: graceDays,
      purgeAt: purgeAt,
      message: '탈퇴 신청이 접수되었습니다. 30일 이내에 로그인하시면 언제든 100% 무손실 복구하실 수 있습니다.'
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

module.exports.purgeUserData = purgeUserData;
module.exports.PURGE_TARGETS = PURGE_TARGETS;
