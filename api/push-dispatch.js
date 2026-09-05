var { createClient } = require('@supabase/supabase-js');
var webpush = require('web-push');

module.exports.config = { maxDuration: 30 };

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';
var MATCH_TOLERANCE_MIN = 4; // GitHub Actions 스케줄 실행은 부하 상황에 따라 지연될 수 있어 여유를 둔다
var SENT_SLOTS_KEEP = 30;

function minutesSinceMidnight(hhmm) {
  var parts = String(hhmm).split(':');
  return (+parts[0] || 0) * 60 + (+parts[1] || 0);
}

// timezone별 오늘 날짜(YYYY-MM-DD)와 현재 시각(HH:mm)을 구한다.
function localNow(timezone) {
  var fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  var parts = {};
  fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
  return { dateStr: parts.year + '-' + parts.month + '-' + parts.day, hh: parts.hour, mm: parts.minute };
}

module.exports = async function handler(req, res) {
  var cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    var authHeader = req.headers['authorization'] || '';
    if (authHeader !== 'Bearer ' + cronSecret) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
  }

  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var vapidPublic = process.env.VAPID_PUBLIC_KEY;
  var vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!supabaseKey || !vapidPublic || !vapidPrivate) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY is not configured' });
    return;
  }

  var sb = createClient(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL, supabaseKey);
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'admin@ourgoal.app'),
    vapidPublic,
    vapidPrivate
  );

  var result = { checked: 0, sent: 0, removed: 0, errors: 0 };
  try {
    var rowsRes = await sb.from('push_subscriptions').select('*');
    if (rowsRes.error) throw rowsRes.error;
    var rows = rowsRes.data || [];
    result.checked = rows.length;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var checkinTimes = Array.isArray(row.checkin_times) ? row.checkin_times : [];
      if (!checkinTimes.length) continue;

      var tz = row.timezone || 'Asia/Seoul';
      var now;
      try { now = localNow(tz); } catch (e) { now = localNow('Asia/Seoul'); }
      var nowMin = minutesSinceMidnight(now.hh + ':' + now.mm);

      var matchedTime = null;
      for (var t = 0; t < checkinTimes.length; t++) {
        if (Math.abs(minutesSinceMidnight(checkinTimes[t]) - nowMin) <= MATCH_TOLERANCE_MIN) {
          matchedTime = checkinTimes[t];
          break;
        }
      }
      if (!matchedTime) continue;

      var slotKey = now.dateStr + '_' + matchedTime;
      var sentSlots = Array.isArray(row.sent_slots) ? row.sent_slots : [];
      if (sentSlots.indexOf(slotKey) !== -1) continue;

      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify({ title: '아워골', body: '지금 뭐 하고 있었어요?' })
        );
        result.sent++;
        var nextSlots = sentSlots.concat([slotKey]).slice(-SENT_SLOTS_KEEP);
        await sb.from('push_subscriptions').update({ sent_slots: nextSlots }).eq('endpoint', row.endpoint);
      } catch (sendErr) {
        var statusCode = sendErr && sendErr.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
          result.removed++;
        } else {
          result.errors++;
        }
      }
    }
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
