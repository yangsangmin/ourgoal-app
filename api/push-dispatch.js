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

// timezone별 오늘 날짜(YYYY-MM-DD), 현재 시각(HH:mm), 요일, 월말일 여부를 구한다.
function localNow(timezone) {
  var d = new Date();
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
  });
  var parts = {};
  fmt.formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
  var dateStr = parts.year + '-' + parts.month + '-' + parts.day;
  var isSunday = (parts.weekday === 'Sun');
  var lastDayOfMonth = new Date(+parts.year, +parts.month, 0).getDate();
  var isMonthEnd = (+parts.day === lastDayOfMonth);
  return {
    dateStr: dateStr,
    hh: parts.hour,
    mm: parts.minute,
    dayOfWeek: parts.weekday,
    isSunday: isSunday,
    isMonthEnd: isMonthEnd
  };
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

// #TASK-ES-397: 앱의 DM 즉시 푸시(대화방 전송·피드 공유)는 로그인한 사용자가 직접 부른다. 그 사용자는 위 두 비밀값을 갖지 않으므로
// 즉시 발송 분기에 한해 Supabase 로그인 세션 토큰도 받는다. 받는 조건(모두 만족해야 통과, 하나라도 어긋나면 거절):
//  ① 토큰이 Supabase 가 확인한 실제 사용자 토큰(sb.auth.getUser)
//  ② 받는 사람이 본인이 아님
//  ③ 그 사용자가 방금(DM_PROOF_WINDOW_MIN 분 안) 받는 사람에게 보낸 DM 행이 team_ping_replies 에 실제로 있음 — DM 을 보낸 사람만 그 상대에게 알림을 보낸다
// 정기 발송(크론) 분기는 여전히 위 두 비밀값만 받는다. 사용자 토큰으로는 그 분기에 들어가지 못한다.
var DM_PROOF_WINDOW_MIN = 10;
var DM_TITLE_MAX = 80;
var DM_BODY_MAX = 200;
async function authorizeDmSender(sb, token, targetUserId) {
  if (!token || !targetUserId) return { ok: false, status: 401, error: 'unauthorized' };
  var userId = null;
  try {
    var u = await sb.auth.getUser(token);
    userId = (!u.error && u.data && u.data.user && u.data.user.id) ? String(u.data.user.id) : null;
  } catch (e) { userId = null; }
  if (!userId) return { ok: false, status: 401, error: 'unauthorized' };
  if (userId === targetUserId) return { ok: false, status: 403, error: 'forbidden: self target' };
  var since = new Date(Date.now() - DM_PROOF_WINDOW_MIN * 60000).toISOString();
  try {
    var proof = await sb.from('team_ping_replies').select('id')
      .eq('sender_id', userId).eq('receiver_id', targetUserId).gte('created_at', since).limit(1);
    if (proof.error || !Array.isArray(proof.data) || proof.data.length === 0) {
      return { ok: false, status: 403, error: 'forbidden: no recent dm to target' };
    }
  } catch (e) {
    return { ok: false, status: 403, error: 'forbidden: no recent dm to target' };
  }
  return { ok: true, userId: userId };
}

function clip(v, max) { return String(v == null ? '' : v).slice(0, max); }
// 사용자 호출은 앱 안 경로만 연다(바깥 주소로 이끄는 알림 금지)
function safeAppPath(u) { var s = String(u || ''); return /^\/(?![\/\\])/.test(s) ? s : '/#comm'; }

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
  var isInstant = !!(req.method === 'POST' && req.body && req.body.targetUserId);
  var dmSender = null; // 사용자 토큰으로 들어온 DM 발신자(비밀값 호출이면 null)
  if (!(await isAuthorized(req, sb))) {
    // #TASK-ES-397: 비밀값이 아니면 즉시 발송 분기에서만 로그인 사용자 + 최근 DM 증거를 본다. 정기 발송은 그대로 401.
    if (!isInstant) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    var dmAuth = await authorizeDmSender(sb, token, String(req.body.targetUserId).trim());
    if (!dmAuth.ok) {
      res.status(dmAuth.status).json({ error: dmAuth.error });
      return;
    }
    dmSender = dmAuth.userId;
  }

  // [#TASK-ES-168] 특정 대상 유저 1:1 DM 및 전역 알림 즉시 푸시 발송 분기
  if (isInstant) {
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
      var payload = JSON.stringify(dmSender ? {
        // 사용자 호출: 글자 길이 제한·아이콘 고정·앱 안 경로만
        title: clip(req.body.title || '아워골 알림', DM_TITLE_MAX),
        body: clip(req.body.body || '', DM_BODY_MAX),
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        url: safeAppPath(req.body.url || '/#comm'),
        tag: clip(req.body.tag || ('dm-' + Date.now()), 120),
        timestamp: Date.now()
      } : {
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

      var sentSlots = Array.isArray(row.sent_slots) ? row.sent_slots : [];

      // [#TASK-ES-335] 주간(일요일)/월간(말일) 회고 알림 발송 갈래
      var isReviewDay = !!(now.isSunday || now.isMonthEnd);
      if (isReviewDay) {
        // 회고 알림 시각: 사용자의 체크인 시각 중 가장 늦은 시각, 없으면 '20:00' 폴백 (결심 7호 안 A)
        var reviewTargetTime = '20:00';
        if (checkinTimes.length > 0) {
          var maxMin = -1;
          for (var ct = 0; ct < checkinTimes.length; ct++) {
            var m = minutesSinceMidnight(checkinTimes[ct]);
            if (m > maxMin) {
              maxMin = m;
              reviewTargetTime = checkinTimes[ct];
            }
          }
        }

        var reviewLateMin = nowMin - minutesSinceMidnight(reviewTargetTime);
        if (reviewLateMin >= 0 && reviewLateMin <= MATCH_TOLERANCE_MIN) {
          // 월말 우선 (일요일과 월말 동시 도래 시 월간 회고로 단일화하여 연속 알림 방지)
          var reviewType = now.isMonthEnd ? 'monthly' : 'weekly';
          var reviewSlotKey = now.dateStr + '_review_' + reviewType;

          if (sentSlots.indexOf(reviewSlotKey) === -1) {
            var reviewPayload = reviewType === 'monthly'
              ? {
                  title: '아워골 월간 회고',
                  body: '이번 달의 꾸준함, 멋진 결실을 확인해보세요 🌟',
                  icon: '/icons/icon-192.png',
                  badge: '/icons/badge-72.png',
                  url: '/#records',
                  tag: 'monthly-review-' + now.dateStr
                }
              : {
                  title: '아워골 주간 회고',
                  body: '이번 주 한 걸음, 발자국을 돌아보세요 🐾',
                  icon: '/icons/icon-192.png',
                  badge: '/icons/badge-72.png',
                  url: '/#records',
                  tag: 'weekly-review-' + now.dateStr
                };

            try {
              await webpush.sendNotification(
                { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
                JSON.stringify(reviewPayload)
              );
              result.sent++;
              var nextReviewSlots = sentSlots.concat([reviewSlotKey]).slice(-SENT_SLOTS_KEEP);
              await sb.from('push_subscriptions').update({ sent_slots: nextReviewSlots }).eq('endpoint', row.endpoint);
              try {
                await sb.from('events').insert({
                  sid: null,
                  name: 'review_notification_sent',
                  props: { channel: 'push', type: reviewType, date: now.dateStr }
                });
              } catch (evErr) { /* ignore */ }
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
          // 회고 알림 대상 시각인 경우 동일 시각 체크인 알림 중복 발송을 방지하고 다음 구독으로 이동
          continue;
        }
      }

      if (!checkinTimes.length) continue;

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

module.exports.localNow = localNow;
module.exports.minutesSinceMidnight = minutesSinceMidnight;
