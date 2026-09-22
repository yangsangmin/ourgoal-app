var { createClient } = require('@supabase/supabase-js');
var webpush = require('web-push');
var crypto = require('crypto');

module.exports.config = { maxDuration: 30 };

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';
var MATCH_TOLERANCE_MIN = 4; // 트리거(Supabase pg_cron, 매분)가 지연·건너뛰어도 체크인 시각 후 4분까지는 발송한다. 정각 이전에는 보내지 않는다(sent_slots 가 같은 슬롯 중복을 막는다)
var SENT_SLOTS_KEEP = 30;
var DAY_MS = 24 * 60 * 60 * 1000;
var CRM_LOG_KEEP = 20;
var STREAK_WARN_TIME = '20:00'; // 스트릭유지 저니 경고 발송 시각(로컬)

// [T045] CRM 캘린더 — 온보딩 저니(첫 체크인 기준 경과일). D0=발송 즉시 허용, minDay 는 "첫 체크인 이후 며칠 지나야" 조건
var ONBOARDING_STEPS = [
  { key: 'd0', minDay: 0, kind: 'behavioral', title: '첫 체크인 완료!', body: '오늘 첫걸음을 남겼어요. 내일도 같은 시간에 만나요', url: '/' },
  { key: 'd1', minDay: 1, kind: 'behavioral', title: '응원이 도착했을 수도 있어요', body: '어제 남긴 기록을 다시 열어보세요', url: '/' },
  { key: 'd3', minDay: 3, kind: 'non_transactional', title: '3일째, 목표가 자라고 있어요', body: '지금까지의 기록을 돌아보고 다음 걸음을 정해보세요', url: '/' },
  { key: 'd7', minDay: 7, kind: 'non_transactional', title: '7일 연속 기록 달성!', body: '스트릭 뱃지를 확인하러 가볼까요?', url: '/' }
];

// [T045] CRM 캘린더 — 윈백 저니(마지막 체크인 이후 비활성 경과일). 재활성(최근 3일 내 체크인) 시 초기화된다
var WINBACK_STEPS = [
  { key: 'd3', minDay: 3, kind: 'non_transactional', title: '요즘 어떻게 지내세요?', body: '3일째 소식이 없어요. 짧게라도 오늘 기록해볼까요?', url: '/?action=checkin' },
  { key: 'd7', minDay: 7, kind: 'non_transactional', title: '아워골이 도와드릴 수 있어요', body: '목표를 향한 작은 진척도 여기서 함께 쌓을 수 있어요', url: '/?action=checkin' },
  { key: 'd14', minDay: 14, kind: 'non_transactional', title: '다시 시작할 준비 되셨나요?', body: '돌아오면 새로운 배지 도전이 기다리고 있어요', url: '/?action=checkin' }
];

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

// 임의 시각(Date)을 특정 timezone 기준 'YYYY-MM-DD' 로 변환(온보딩/윈백 경과일 계산용)
function dateKeyInTz(d, timezone) {
  var fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
  });
  var parts = {};
  fmt.formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
  return parts.year + '-' + parts.month + '-' + parts.day;
}

// 'YYYY-MM-DD' 두 날짜 키의 차이(일). DST 없는 한국 기준 근사(기존 js/streaks.js daysAgoKey 와 동일한 근사 방식)
function daysBetweenKeys(fromKey, toKey) {
  var a = new Date(fromKey + 'T00:00:00Z').getTime();
  var b = new Date(toKey + 'T00:00:00Z').getTime();
  return Math.round((b - a) / DAY_MS);
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
// CRON_SECRET 이 비어 있으면 종전처럼 인증을 요구하지 않는다.
var cachedDbToken = null;
async function isAuthorized(req, sb) {
  var cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  var authHeader = req.headers['authorization'] || '';
  var token = authHeader.indexOf('Bearer ') === 0 ? authHeader.slice(7) : '';
  if (!token) return false;
  if (sameToken(token, cronSecret)) return true;
  if (cachedDbToken && sameToken(token, cachedDbToken)) return true;
  try {
    var rpc = await sb.rpc('push_dispatch_token');
    if (!rpc.error && rpc.data) cachedDbToken = rpc.data;
  } catch (e) { /* 토큰 조회 실패는 인증 실패로 취급 */ }
  return !!(cachedDbToken && sameToken(token, cachedDbToken));
}

// [T045] 빈도상한: 비트랜잭션(non_transactional) 합산 3회/24h, 행동형(behavioral) 2회/24h + 최소 4시간 간격.
// row.crm_notif_log(최근 CRM_LOG_KEEP건)를 근거로 판정 — events 테이블에는 user_id 를 저장하지 않는 기존 설계(2026-09-06-events.sql)를 지키기 위해
// 판정 로그는 push_subscriptions 행(이미 user_id 보유, service_role 전용) 쪽에 둔다. 기존 체크인 리마인더는 이 로그에 남기지 않아 상한 대상이 아니다.
function crmCanSend(row, kind) {
  var log = Array.isArray(row.crm_notif_log) ? row.crm_notif_log : [];
  var now = Date.now();
  var last24h = log.filter(function (e) { return e && e.at && (now - new Date(e.at).getTime()) < DAY_MS; });
  if (last24h.length >= 3) return false;
  if (kind === 'behavioral') {
    var behavioral24h = last24h.filter(function (e) { return e.kind === 'behavioral'; });
    if (behavioral24h.length >= 2) return false;
    var hasRecentBehavioral = log.some(function (e) {
      return e && e.at && e.kind === 'behavioral' && (now - new Date(e.at).getTime()) < 4 * 60 * 60 * 1000;
    });
    if (hasRecentBehavioral) return false;
  }
  return true;
}

function crmLogSend(log, kind) {
  var next = (Array.isArray(log) ? log : []).concat([{ at: new Date().toISOString(), kind: kind }]);
  return next.slice(-CRM_LOG_KEEP);
}

// CRM 저니 알림 1건 발송 + 발송 계측(익명 태그만, user_id 없음)
async function crmSend(sb, row, step, journey) {
  var payload = JSON.stringify({
    title: step.title,
    body: step.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'crm-' + journey + '-' + step.key,
    timestamp: Date.now(),
    data: { url: step.url || '/', journey: journey, step: step.key }
  });
  await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload);
  try { await sb.from('events').insert({ sid: null, name: 'notification_sent', props: { channel: 'push', journey: journey, step: step.key } }); } catch (evErr) { /* ignore */ }
}

// 구독 만료(404/410)면 삭제하고 true(이 행은 더 이상 처리하지 않음)를 돌려준다. 그 외 오류는 카운트만 하고 false.
async function crmHandleSendFailure(sb, row, sendErr, result) {
  var sc = sendErr && sendErr.statusCode;
  if (sc === 404 || sc === 410) {
    try { await sb.from('push_subscriptions').delete().eq('endpoint', row.endpoint); } catch (e) { /* ignore */ }
    result.removed = (result.removed || 0) + 1;
    return true;
  }
  result.errors = (result.errors || 0) + 1;
  return false;
}

// [T045] 온보딩·윈백·스트릭유지 3개 저니 디스패치. row 는 push_subscriptions 1행, ck 는 해당 user_id 의 { first, last } 체크인 시각(ISO)
async function dispatchCrmJourneys(sb, row, ck, tz, now, nowMin, todayDone, throughYesterday, result) {
  var rowGone = false;

  // ---- 온보딩 저니: 첫 체크인 기준 D0/D1/D3/D7 ----
  var firstKey = dateKeyInTz(new Date(ck.first), tz);
  var daysSinceFirst = daysBetweenKeys(firstKey, now.dateStr);
  var onboardingSent = Array.isArray(row.crm_onboarding_sent) ? row.crm_onboarding_sent.slice() : [];
  var onboardingChanged = false;
  for (var oi = 0; oi < ONBOARDING_STEPS.length && !rowGone; oi++) {
    var os = ONBOARDING_STEPS[oi];
    if (onboardingSent.indexOf(os.key) !== -1) continue;
    if (daysSinceFirst < os.minDay) continue;
    if (!crmCanSend(row, os.kind)) break;
    try {
      await crmSend(sb, row, os, 'onboarding');
      onboardingSent.push(os.key);
      onboardingChanged = true;
      row.crm_notif_log = crmLogSend(row.crm_notif_log, os.kind);
      result.sent++;
      result.crmSent = (result.crmSent || 0) + 1;
    } catch (sendErr) {
      rowGone = await crmHandleSendFailure(sb, row, sendErr, result);
    }
  }
  if (onboardingChanged && !rowGone) {
    await sb.from('push_subscriptions').update({ crm_onboarding_sent: onboardingSent, crm_notif_log: row.crm_notif_log }).eq('endpoint', row.endpoint);
    row.crm_onboarding_sent = onboardingSent;
  }
  if (rowGone) return;

  // ---- 윈백 저니: 마지막 체크인 기준 비활성 D3/D7/D14, 최근 3일 내 체크인이면 재활성으로 보고 초기화 ----
  var lastKey = dateKeyInTz(new Date(ck.last), tz);
  var daysSinceLast = daysBetweenKeys(lastKey, now.dateStr);
  var winbackSent = Array.isArray(row.crm_winback_sent) ? row.crm_winback_sent.slice() : [];
  if (daysSinceLast < 3 && winbackSent.length) {
    winbackSent = [];
    await sb.from('push_subscriptions').update({ crm_winback_sent: winbackSent }).eq('endpoint', row.endpoint);
    row.crm_winback_sent = winbackSent;
  }
  var winbackChanged = false;
  for (var wi = 0; wi < WINBACK_STEPS.length && !rowGone; wi++) {
    var ws = WINBACK_STEPS[wi];
    if (winbackSent.indexOf(ws.key) !== -1) continue;
    if (daysSinceLast < ws.minDay) continue;
    if (!crmCanSend(row, ws.kind)) break;
    try {
      await crmSend(sb, row, ws, 'winback');
      winbackSent.push(ws.key);
      winbackChanged = true;
      row.crm_notif_log = crmLogSend(row.crm_notif_log, ws.kind);
      result.sent++;
      result.crmSent = (result.crmSent || 0) + 1;
    } catch (sendErr) {
      rowGone = await crmHandleSendFailure(sb, row, sendErr, result);
    }
  }
  if (winbackChanged && !rowGone) {
    await sb.from('push_subscriptions').update({ crm_winback_sent: winbackSent, crm_notif_log: row.crm_notif_log }).eq('endpoint', row.endpoint);
    row.crm_winback_sent = winbackSent;
  }
  if (rowGone) return;

  // ---- 스트릭유지 저니: 당일 미체크인 + 20시(±4분) + 어제까지 이어진 스트릭 있음 + 오늘 아직 경고 안 보냄 ----
  var warnMin = minutesSinceMidnight(STREAK_WARN_TIME);
  var lateMin = nowMin - warnMin;
  var dueForWarning = !todayDone && throughYesterday > 0 && row.crm_streak_last_warned !== now.dateStr && lateMin >= 0 && lateMin <= MATCH_TOLERANCE_MIN;
  if (dueForWarning && crmCanSend(row, 'behavioral')) {
    var freezeNote = row.crm_freeze_available !== false ? '(프리즈 1회 남음)' : '';
    var step = {
      key: 'd0_warning',
      title: '아워골',
      body: '오늘 안 하면 ' + throughYesterday + '일 스트릭 끊겨요' + freezeNote,
      url: '/?action=checkin'
    };
    try {
      await crmSend(sb, row, step, 'streak_retention');
      row.crm_notif_log = crmLogSend(row.crm_notif_log, 'behavioral');
      await sb.from('push_subscriptions').update({ crm_streak_last_warned: now.dateStr, crm_notif_log: row.crm_notif_log }).eq('endpoint', row.endpoint);
      row.crm_streak_last_warned = now.dateStr;
      result.sent++;
      result.crmSent = (result.crmSent || 0) + 1;
    } catch (sendErr) {
      await crmHandleSendFailure(sb, row, sendErr, result);
    }
  }
}

module.exports = async function handler(req, res) {
  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  var vapidPublic = process.env.VAPID_PUBLIC_KEY;
  var vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!supabaseKey || !vapidPublic || !vapidPrivate) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY is not configured' });
    return;
  }

  var sb = createClient(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL, supabaseKey);

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

  if (!(await isAuthorized(req, sb))) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'admin@ourgoal.app'),
    vapidPublic,
    vapidPrivate
  );

  var result = { checked: 0, sent: 0, removed: 0, errors: 0, crmSent: 0 };
  try {
    var rowsRes = await sb.from('push_subscriptions').select('*');
    if (rowsRes.error) throw rowsRes.error;
    var rows = rowsRes.data || [];
    result.checked = rows.length;

    // [T045] CRM 저니용 배치 조회: 이번 실행 대상 구독자들의 체크인 시각만(전체 레코드 아님) 1회 조회.
    // checkins 테이블에 crm_onboarding_sent 같은 컬럼이 아직 없어도(SQL 미실행) 이 조회 자체는 항상 가능하다.
    var userIds = rows.map(function (r) { return r.user_id; }).filter(Boolean);
    var checkinsByUser = {};
    var dateKeysByUser = {};
    if (userIds.length) {
      var ckRes = await sb.from('checkins').select('user_id,start_at').in('user_id', userIds).order('start_at', { ascending: true });
      if (!ckRes.error) {
        (ckRes.data || []).forEach(function (c) {
          if (!c.user_id || !c.start_at) return;
          if (!checkinsByUser[c.user_id]) checkinsByUser[c.user_id] = { first: c.start_at, last: c.start_at };
          checkinsByUser[c.user_id].last = c.start_at; // 오름차순 조회이므로 마지막 대입이 최댓값
          if (!dateKeysByUser[c.user_id]) dateKeysByUser[c.user_id] = [];
          dateKeysByUser[c.user_id].push(c.start_at);
        });
      }
    }

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

      // ---- 기존 체크인 리마인더(T020) — checkin_times 설정된 구독만 ----
      if (checkinTimes.length) {
        var matchedTime = null;
        for (var t = 0; t < checkinTimes.length; t++) {
          var lateMinReminder = nowMin - minutesSinceMidnight(checkinTimes[t]);
          if (lateMinReminder >= 0 && lateMinReminder <= MATCH_TOLERANCE_MIN) {
            matchedTime = checkinTimes[t];
            break;
          }
        }

        if (matchedTime) {
          var slotKey = now.dateStr + '_' + matchedTime;
          var sentSlots = Array.isArray(row.sent_slots) ? row.sent_slots : [];
          if (sentSlots.indexOf(slotKey) === -1) {
            try {
              await webpush.sendNotification(
                { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
                JSON.stringify({ title: '아워골', body: '지금 뭐 하고 있었어요?' })
              );
              result.sent++;
              var nextSlots = sentSlots.concat([slotKey]).slice(-SENT_SLOTS_KEEP);
              await sb.from('push_subscriptions').update({ sent_slots: nextSlots }).eq('endpoint', row.endpoint);
              row.sent_slots = nextSlots;
              /* 알림 발송 계측(클릭률 분모) — sent_slots 기록 뒤에 두어 타임아웃 시 중복 발송 창을 넓히지 않음. 실패해도 발송 흐름에 영향 없음 */
              try { await sb.from('events').insert({ sid: null, name: 'notification_sent', props: { channel: 'push', body_type: 'fixed' } }); } catch (evErr) { /* ignore */ }
            } catch (sendErr) {
              var statusCode = sendErr && sendErr.statusCode;
              if (statusCode === 404 || statusCode === 410) {
                await sb.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
                result.removed++;
                continue; // 구독 삭제됨 — 이 행의 CRM 저니 처리도 건너뜀
              } else {
                result.errors++;
              }
            }
          }
        }
      }

      // ---- [T045] CRM 저니(온보딩·윈백·스트릭유지) — 체크인 이력이 있는 구독자만 ----
      var ck = row.user_id ? checkinsByUser[row.user_id] : null;
      if (ck) {
        var dateKeys = {};
        (dateKeysByUser[row.user_id] || []).forEach(function (ts) { dateKeys[dateKeyInTz(new Date(ts), tz)] = true; });
        var todayDone = !!dateKeys[now.dateStr];
        var throughYesterday = 0;
        for (var d = 1; d <= 400; d++) {
          var probeKey = dateKeyInTz(new Date(Date.now() - d * DAY_MS), tz);
          if (!dateKeys[probeKey]) break;
          throughYesterday++;
        }
        try {
          await dispatchCrmJourneys(sb, row, ck, tz, now, nowMin, todayDone, throughYesterday, result);
        } catch (crmErr) {
          result.errors++;
        }
      }
    }
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};

// 스모크 테스트(scripts/crm-journey-smoke.js)가 실DB 없이 순수 함수만 검증할 수 있도록 노출한다. 런타임 동작에는 영향 없음.
module.exports.__test = {
  dateKeyInTz: dateKeyInTz,
  daysBetweenKeys: daysBetweenKeys,
  crmCanSend: crmCanSend,
  crmLogSend: crmLogSend,
  ONBOARDING_STEPS: ONBOARDING_STEPS,
  WINBACK_STEPS: WINBACK_STEPS
};
