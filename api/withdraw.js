var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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
      var tables = ['checkins', 'goals', 'push_subscriptions', 'feed_posts', 'comments', 'feed_likes', 'events', 'users'];
      for (var i = 0; i < tables.length; i++) {
        var col = tables[i] === 'users' ? 'id' : 'user_id';
        try {
          await sb.from(tables[i]).delete().eq(col, uid);
        } catch (tableErr) {
          console.warn('Table deletion warning (' + tables[i] + '):', tableErr.message);
        }
      }
      var { error: delUserErr } = await sb.auth.admin.deleteUser(uid);
      if (delUserErr) console.warn('Admin deleteUser warning:', delUserErr.message);
      res.status(200).json({ ok: true, status: 'purged', deletedUserId: uid });
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
