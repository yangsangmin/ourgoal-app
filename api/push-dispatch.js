var { createClient } = require('@supabase/supabase-js');
var webpush = require('web-push');
var crypto = require('crypto');

module.exports.config = { maxDuration: 30 };

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';
var MATCH_TOLERANCE_MIN = 4; // 트리거(Supabase pg_cron, 매분)가 지연·건너뛰어도 체크인 시각 후 4분까지는 발송한다. 정각 이전에는 보내지 않는다(sent_slots 가 같은 슬롯 중복을 막는다)
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

function sameToken(a, b) {
  var ba = Buffer.from(String(a || ''));
  var bb = Buffer.from(String(b || ''));
  return ba.length > 0 && ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// 호출자 인증. 두 경로를 허용한다:
//  (1) Vercel env CRON_SECRET — 수동 점검(GitHub Actions workflow_dispatch)용
//  (2) Supabase Vault 토큰(public.push_dispatch_token(), docs/sql/2026-09-08-push-cron.sql) —
//      pg_cron 발송 트리거용. 토큰은 DB 안에서 생성돼 사람·코드·저장소 어디에도 옮겨 적히지 않는다.
// #TASK-ES-252: CRON_SECRET 이나 DB 토큰이 없거나 불일치 시 절대 통과시키지 않는다 (Fail-Closed).
var cachedDbToken = null;
async function isAuthorized(req, sb) {
  var cronSecret = process.env.CRON_SECRET;
  var authHeader = req.headers['authorization'] || '';
  var token = authHeader.indexOf('Bearer ') === 0 ? authHeader.slice(7) : '';
  if (!token) return false;
  if (cronSecret && sameToken(token, cronSecret)) return true;
  if (cachedDbToken && sameToken(token, cachedDbToken)) return true;
  try {
    var rpc = await sb.rpc('push_dispatch_token');
    if (!rpc.error && rpc.data) cachedDbToken = rpc.data;
  } catch (e) { /* 토큰 조회 실패는 인증 실패로 취급 */ }
  return !!(cachedDbToken && sameToken(token, cachedDbToken));
}

module.exports = async function handler(req, res) {
  // #TASK-ES-252: 호출자 인증 우선 검사 (인증 토큰 부재 시 즉시 401 Fail-Closed 차단)
  var authHeader = (req && req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  var token = authHeader.indexOf('Bearer ') === 0 ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'unauthorized: missing bearer token' });
    return;
  }

  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var vapidPublic = process.env.VAPID_PUBLIC_KEY;
  var vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!supabaseKey || !vapidPublic || !vapidPrivate) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY is not configured' });
    return;
  }

  var sb = createClient(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL, supabaseKey);

  // #TASK-ES-252: 모든 발송 분기(인스턴트 및 정기 크론) 진입 전 엄격한 토큰 유효성 검증 강제
  if (!(await isAuthorized(req, sb))) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // [#TASK-ES-168] 특정 대상 유저 1:1 DM 및 전역 알림 즉시 푸시 발송 분기
  if (req.method === 'POST' && req.body && req.body.targetUserId) {
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'admin@ourgoal.app'),
      vapidPublic,
      vapidPrivate
    );
    try {
      var targetUserId = String(req.body.targetUserId).trim();
      var subRes = await sb.from('push_subscriptions').select('*').eq('user_id', targetUserId);
      if (subRes.error) throw subRes.error;
      var subs = subRes.data || [];
      var sentCount = 0;
      var payload = JSON.stringify({
        title: req.body.title || '아워골 알림',
        body: req.body.body || '',
        icon: req.body.icon || '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        url: req.body.url || '/#comm',
        tag: req.body.tag || ('dm-' + Date.now()),
        timestamp: Date.now()
      });

      for (var s = 0; s < subs.length; s++) {
        var sub = subs[s];
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (err) {
          var sc = err && err.statusCode;
          if (sc === 410 || sc === 404) {
            await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
      res.status(200).json({ ok: true, sent: sentCount, targetUserId: targetUserId });
      return;
    } catch (err) {
      res.status(500).json({ error: err.message || 'instant push failed' });
      return;
    }
  }

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

      if (row.quiet_hours_enabled) {
        var qhStart = minutesSinceMidnight(row.quiet_hours_start || '22:00');
        var qhEnd = minutesSinceMidnight(row.quiet_hours_end || '08:00');
        var isQuiet = qhStart < qhEnd ? (nowMin >= qhStart && nowMin < qhEnd) : (nowMin >= qhStart || nowMin < qhEnd);
        if (isQuiet) continue;
      }

      var matchedTime = null;
      for (var t = 0; t < checkinTimes.length; t++) {
        var lateMin = nowMin - minutesSinceMidnight(checkinTimes[t]);
        if (lateMin >= 0 && lateMin <= MATCH_TOLERANCE_MIN) {
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
        /* 알림 발송 계측(클릭률 분모) — sent_slots 기록 뒤에 두어 타임아웃 시 중복 발송 창을 넓히지 않음. 실패해도 발송 흐름에 영향 없음 */
        try { await sb.from('events').insert({ sid: null, name: 'notification_sent', props: { channel: 'push', body_type: 'fixed' } }); } catch (evErr) { /* ignore */ }
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
