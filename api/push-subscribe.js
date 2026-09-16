var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

module.exports = async function handler(req, res) {
  // 1. VAPID 공개키 조회 요청 (GET이며 캘린더 요청이 아닌 경우 - Supabase 불필요)
  if (req.method === 'GET') {
    var parsedUrl = null;
    try { parsedUrl = new URL(req.url, 'http://localhost'); } catch (e) {}
    var qToken = (req.query && req.query.token) || (parsedUrl && parsedUrl.searchParams.get('token')) || '';
    var isCalendarReq = Boolean(qToken) || (req.url && req.url.indexOf('/calendar') !== -1) || (req.headers && req.headers['accept'] && req.headers['accept'].indexOf('text/calendar') !== -1);

    if (!isCalendarReq) {
      var key = process.env.VAPID_PUBLIC_KEY;
      if (!key) {
        res.status(500).json({ error: 'VAPID_PUBLIC_KEY is not configured' });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).json({ publicKey: key });
      return;
    }
  }

  // 2. Supabase DB가 필요한 작업 (POST 구독, DELETE 구독취소, GET 캘린더 생성)
  var sb = getSupabase();
  if (!sb && !isCalendarReq) {
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

  if (req.method === 'GET') {
    var parsedUrl = null;
    try { parsedUrl = new URL(req.url, 'http://localhost'); } catch (e) {}
    var qToken = (req.query && req.query.token) || (parsedUrl && parsedUrl.searchParams.get('token')) || '';
    var isCalendarReq = Boolean(qToken) || (req.url && req.url.indexOf('/calendar') !== -1) || (req.headers && req.headers['accept'] && req.headers['accept'].indexOf('text/calendar') !== -1);

    if (isCalendarReq) {
      try {
        var goals = [];
        var checkins = [];
        if (sb && qToken && qToken !== 'demo') {
          var goalsRes = await sb.from('goals').select('*').eq('user_id', qToken);
          var checkinsRes = await sb.from('checkins').select('*').eq('user_id', qToken).order('start_at', { ascending: false }).limit(200);
          goals = goalsRes.data || [];
          checkins = checkinsRes.data || [];
        }

        var lines = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//OurGoal//KR',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'X-WR-CALNAME:아워골(OurGoal) 성장 캘린더',
          'X-WR-TIMEZONE:Asia/Seoul'
        ];

        goals.forEach(function(g, i) {
          if (g.due_date) {
            var cleanDue = String(g.due_date).replace(/-/g, '').slice(0, 8);
            lines.push('BEGIN:VEVENT');
            lines.push('UID:ourgoal-goal-' + (g.id || i) + '@ourgoal.app');
            lines.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
            lines.push('DTSTART;VALUE=DATE:' + cleanDue);
            lines.push('SUMMARY:[목표 D-day] ' + String(g.title || '목표').replace(/\r?\n/g, ' '));
            lines.push('DESCRIPTION:카테고리: ' + (g.category || '기본'));
            lines.push('STATUS:CONFIRMED');
            lines.push('END:VEVENT');
          }
          // 마일스톤 마감일 VEVENT 추가 (#TASK-ES-127)
          var msList = Array.isArray(g.milestones) ? g.milestones : [];
          msList.forEach(function(m, mi) {
            var mDue = m.dueDate || m.due_date;
            if (!mDue) return;
            var cleanMDue = String(mDue).replace(/-/g, '').slice(0, 8);
            lines.push('BEGIN:VEVENT');
            lines.push('UID:ourgoal-ms-' + (m.id || (g.id + '-' + mi)) + '@ourgoal.app');
            lines.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
            lines.push('DTSTART;VALUE=DATE:' + cleanMDue);
            lines.push('SUMMARY:[마일스톤 마감] ' + String(g.title || '') + ' > ' + String(m.title || '마일스톤'));
            lines.push('STATUS:' + (m.status === 'done' ? 'COMPLETED' : 'CONFIRMED'));
            lines.push('END:VEVENT');
          });
        });

        checkins.forEach(function(c, i) {
          if (!c.start_at) return;
          var sDate = new Date(c.start_at);
          if (isNaN(sDate.getTime())) return;
          var eDate = c.end_at ? new Date(c.end_at) : new Date(sDate.getTime() + 30 * 60000);
          var sStr = sDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          var eStr = eDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          var matchedGoal = goals.find(function(g) { return g.id === c.goal_id; });
          var gTitle = matchedGoal ? matchedGoal.title : '';
          var summary = '[기록' + (c.theme ? ' - ' + c.theme : '') + '] ' + (gTitle ? gTitle + ' : ' : '') + (c.text || '체크인');
          summary = summary.replace(/\r?\n/g, ' ').slice(0, 70);

          lines.push('BEGIN:VEVENT');
          lines.push('UID:ourgoal-rec-' + (c.id || i) + '@ourgoal.app');
          lines.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
          lines.push('DTSTART:' + sStr);
          lines.push('DTEND:' + eStr);
          lines.push('SUMMARY:' + summary);
          lines.push('DESCRIPTION:' + String(c.text || '').replace(/\r?\n/g, '\\n'));
          lines.push('CATEGORIES:' + (c.theme || '기록'));
          lines.push('END:VEVENT');
        });

        if (goals.length === 0 && checkins.length === 0) {
          lines.push('BEGIN:VEVENT');
          lines.push('UID:ourgoal-welcome@ourgoal.app');
          lines.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
          lines.push('DTSTART;VALUE=DATE:' + new Date().toISOString().slice(0, 10).replace(/-/g, ''));
          lines.push('SUMMARY:[아워골] 캘린더 실시간 구독이 성공적으로 연결되었습니다');
          lines.push('DESCRIPTION:아워골에서 목표 마일스톤과 일정을 등록하면 자동으로 이 캘린더에 동기화됩니다.');
          lines.push('STATUS:CONFIRMED');
          lines.push('END:VEVENT');
        }

        lines.push('END:VCALENDAR');

        var icsBody = lines.join('\r\n');
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="ourgoal_feed.ics"');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.status(200).send(icsBody);
        return;
      } catch (ce) {
        res.status(500).json({ error: ce.message || 'calendar generation error' });
        return;
      }
    }

    var key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
      res.status(500).json({ error: 'VAPID_PUBLIC_KEY is not configured' });
      return;
    }
    res.status(200).json({ publicKey: key });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
