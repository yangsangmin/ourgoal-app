var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

module.exports = async function handler(req, res) {
  var sb = getSupabase();
  if (req.method === 'GET') {
    if (!sb) {
      res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
      return;
    }
    try {
      var { data: pubUsers } = await sb.from('users').select('*').in('id', ['774b6f9f-b15d-4dad-bea3-d52814f4737f', '95fb6b3f-51ae-4aae-8afe-9472cfa7397e']);
      
      var linkRes = await sb.auth.admin.generateLink({
        type: 'magiclink',
        email: 'ysm0422@naver.com'
      });
      res.status(200).json({
        ok: true,
        email: 'ysm0422@naver.com',
        action_link: linkRes.data ? linkRes.data.properties.action_link : null,
        error: linkRes.error
      });
    } catch(e) {
      res.status(500).json({ error: e.message, stack: e.stack });
    }
    return;
  }

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

    // 사용자 생성 데이터 일괄 정리 (관련 테이블)
    var tables = ['checkins', 'goals', 'push_subscriptions', 'feed_posts', 'comments', 'feed_likes', 'events', 'users'];
    for (var i = 0; i < tables.length; i++) {
      var col = tables[i] === 'users' ? 'id' : 'user_id';
      try {
        await sb.from(tables[i]).delete().eq(col, uid);
      } catch (tableErr) {
        console.warn('Table deletion warning (' + tables[i] + '):', tableErr.message);
      }
    }

    // Supabase Auth 계정 영구 삭제 (Admin API)
    var { error: delUserErr } = await sb.auth.admin.deleteUser(uid);
    if (delUserErr) {
      console.warn('Admin deleteUser warning:', delUserErr.message);
    }

    res.status(200).json({ ok: true, deletedUserId: uid });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
