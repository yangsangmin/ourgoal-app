var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

module.exports = async function handler(req, res) {
  var sb = getSupabase();
  if (!sb) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
    return;
  }

  if (req.method === 'POST') {
    var body = req.body || {};
    var userId = body.userId;
    var subscription = body.subscription;
    var checkinTimes = Array.isArray(body.checkinTimes) ? body.checkinTimes : [];
    var timezone = body.timezone || 'Asia/Seoul';
    if (!userId || !subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ error: 'userId and subscription are required' });
      return;
    }
    try {
      var { error } = await sb.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        user_id: userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        checkin_times: checkinTimes,
        timezone: timezone,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message || 'unknown error' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    var delBody = req.body || {};
    var endpoint = delBody.endpoint;
    if (!endpoint) {
      res.status(400).json({ error: 'endpoint is required' });
      return;
    }
    try {
      var delRes = await sb.from('push_subscriptions').delete().eq('endpoint', endpoint);
      if (delRes.error) throw delRes.error;
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message || 'unknown error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
