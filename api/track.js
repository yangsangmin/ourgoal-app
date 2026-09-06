var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

/* 서버 경유 계측 엔드포인트 — 서비스워커(알림 클릭)처럼 supabase 클라이언트가 없는 곳에서 사용.
   허용 이벤트만 받고, sid/user_id는 저장하지 않는다(익명). 성장 백로그 P0 ③ 알림 클릭률. */
var ALLOWED_EVENTS = ['notification_clicked'];
var MAX_PROPS_LENGTH = 500;

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var sb = getSupabase();
  if (!sb) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
    return;
  }

  var body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  var name = String(body.name || '');
  if (ALLOWED_EVENTS.indexOf(name) === -1) {
    res.status(400).json({ error: 'unsupported event' });
    return;
  }
  var props = (body.props && typeof body.props === 'object' && !Array.isArray(body.props)) ? body.props : {};
  if (JSON.stringify(props).length > MAX_PROPS_LENGTH) {
    res.status(400).json({ error: 'props too large' });
    return;
  }

  try {
    var ins = await sb.from('events').insert({ sid: null, name: name, props: props });
    if (ins.error) throw ins.error;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'insert failed' }); /* DB 에러 원문은 노출하지 않음 */
  }
};
