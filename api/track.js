var { createClient } = require('@supabase/supabase-js');

var DEFAULT_SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';

/* 서버 경유 계측 및 데이터 복원 엔드포인트 — 서비스워커(알림 클릭), 퍼널 전환, UTM 유입 등 익명 계측 및 RLS 우회 데이터 복원.
   Hobby 12개 서버리스 함수 한도 내에서 이벤트 계측과 기록 복원(sync_records)을 통합 서빙한다. */
var ALLOWED_EVENTS = [
  'notification_clicked',
  'notification_received',
  'funnel_signup',
  'funnel_goal_created',
  'funnel_first_checkin',
  'utm_landing'
];
var MAX_PROPS_LENGTH = 500;

function getSupabase() {
  var url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function handleSyncRecords(sb, body, res) {
  var userId = String(body.userId || '').trim();
  var username = String(body.username || '').trim();
  var displayName = String(body.displayName || body.nickname || '').trim();
  var nickname = String(body.nickname || '').trim();
  var backupIds = Array.isArray(body.backupIds) ? body.backupIds.map(String).map(function(s){ return s.trim(); }).filter(Boolean) : [];
  var recordsToSave = Array.isArray(body.recordsToSave) ? body.recordsToSave : null;
  var profileToSave = (body.profileToSave && typeof body.profileToSave === 'object') ? body.profileToSave : null;

  var candidateIds = [];
  if (userId) candidateIds.push(userId);
  backupIds.forEach(function(id) {
    if (id && candidateIds.indexOf(id) === -1) candidateIds.push(id);
  });

  try {
    var matchedUser = null;
    var targetUid = userId || (candidateIds.length ? candidateIds[0] : null);

    // 1. users 테이블에서 candidateIds 또는 username / displayName 기반 매칭
    if (candidateIds.length) {
      try {
        var uRes = await sb.from('users').select('*').in('id', candidateIds);
        if (uRes.data && uRes.data.length > 0) {
          matchedUser = uRes.data[0];
          targetUid = matchedUser.id;
        }
      } catch (e) {}
    }

    if (!matchedUser && (username || displayName || nickname)) {
      try {
        var searchName = displayName || nickname || username;
        var uNameRes = await sb.from('users').select('*')
          .or('username.ilike.%' + searchName + '%,display_name.ilike.%' + searchName + '%')
          .limit(5);
        if (uNameRes.data && uNameRes.data.length > 0) {
          matchedUser = uNameRes.data[0];
          targetUid = matchedUser.id;
        }
      } catch (e) {}
    }

    // 2. 만약 users 테이블에 없더라도 candidateIds 중 UUID 형식이 있다면 우선 채택
    if (!targetUid || targetUid.indexOf('u_') === 0) {
      var uuidCandidate = candidateIds.find(function(id) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      });
      if (uuidCandidate) targetUid = uuidCandidate;
    }

    // 3. checkins 테이블 조회 (candidateIds 전체 스캔 + targetUid 스캔)
    var allIdsToSearch = [];
    if (targetUid) allIdsToSearch.push(targetUid);
    candidateIds.forEach(function(id) {
      if (id && allIdsToSearch.indexOf(id) === -1) allIdsToSearch.push(id);
    });

    var fetchedRecords = [];
    if (allIdsToSearch.length) {
      try {
        var recRes = await sb.from('checkins').select('*').in('user_id', allIdsToSearch).order('start_at', { ascending: false });
        if (recRes.data && recRes.data.length > 0) {
          fetchedRecords = recRes.data;
        }
      } catch (e) {}
    }

    // 만약 특정 candidateIds로 기록이 0건인데, candidateIds 내 단일 항목별로 순차 재시도
    if (fetchedRecords.length === 0 && candidateIds.length) {
      try {
        for (var i = 0; i < candidateIds.length; i++) {
          var cid = candidateIds[i];
          var singleRecRes = await sb.from('checkins').select('*').eq('user_id', cid).order('start_at', { ascending: false });
          if (singleRecRes.data && singleRecRes.data.length > 0) {
            fetchedRecords = singleRecRes.data;
            targetUid = cid;
            break;
          }
        }
      } catch (e) {}
    }

    // 4. goals 테이블 조회
    var fetchedGoals = [];
    if (targetUid) {
      try {
        var gRes = await sb.from('goals').select('*').eq('user_id', targetUid).order('created_at', { ascending: true });
        if (gRes.data && gRes.data.length > 0) {
          fetchedGoals = gRes.data;
        }
      } catch (e) {}
    }

    // 5. 저장 요청(recordsToSave / profileToSave)이 있는 경우 백엔드에서 안전하게 upsert
    if (recordsToSave && recordsToSave.length && targetUid) {
      try {
        var rows = recordsToSave.map(function(r) {
          return {
            id: r.id,
            user_id: targetUid,
            type: r.type || 'checkin',
            text: r.text || '',
            start_at: r.startAt || r.start_at || new Date().toISOString(),
            end_at: r.endAt || r.end_at || null,
            category: r.category || null,
            theme: r.theme || null,
            sub_theme: r.subTheme || r.sub_theme || null,
            theme_confidence: r.themeConfidence || r.theme_confidence || null
          };
        });
        await sb.from('checkins').upsert(rows);
      } catch (e) {}
    }

    if (profileToSave && targetUid) {
      try {
        var profRow = {
          id: targetUid,
          username: username || targetUid,
          display_name: profileToSave.displayName || displayName || username,
          bio: profileToSave.bio || null,
          avatar_url: profileToSave.avatarUrl || null,
          interests: profileToSave.interests || [],
          region: profileToSave.region || null,
          region_public: !!profileToSave.regionPublic
        };
        await sb.from('users').upsert(profRow);
      } catch (e) {}
    }

    res.status(200).json({
      ok: true,
      targetUserId: targetUid,
      matchedUser: matchedUser,
      user: matchedUser,
      recordsCount: fetchedRecords.length,
      records: fetchedRecords.map(function(r) {
        return {
          id: r.id,
          type: r.type,
          text: r.text,
          startAt: r.start_at,
          endAt: r.end_at,
          createdAt: r.created_at,
          category: r.category || null,
          theme: r.theme || null,
          subTheme: r.sub_theme || null,
          themeConfidence: r.theme_confidence || null
        };
      }),
      goalsCount: fetchedGoals.length,
      goals: fetchedGoals.map(function(g) {
        return {
          id: g.id,
          title: g.title,
          category: g.category,
          dueDate: g.due_date,
          createdAt: g.created_at,
          visibility: g.visibility || 'private',
          topic: g.topic || '',
          archivedAt: g.archived_at || null,
          result: g.result || null,
          milestones: g.milestones || []
        };
      })
    });
  } catch (err) {
    console.error('sync-records handler error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function handleShareOg(req, res) {
  var q = req.query || {};
  var type = String(q.type || '').trim();
  var id = String(q.id || '').trim();
  var title = String(q.title || '').trim();
  var desc = String(q.desc || '').trim();
  var img = String(q.img || '').trim();
  var author = String(q.author || '').trim();

  var host = req.headers['host'] || 'ourgoal-app.vercel.app';
  var proto = req.headers['x-forwarded-proto'] || 'https';
  var baseUrl = proto + '://' + host;

  var defaultOgImg = baseUrl + '/icons/og-image.jpg';
  var ogTitle = '아워골 — 나만의 목표 달성 메이트';
  var ogDesc = '목표를 세우고, 매일 한 줄 기록하고, 성장을 나누는 아워골';
  var ogImg = img || defaultOgImg;
  var targetAppUrl = baseUrl + '/';

  if (type === 'template') {
    ogTitle = '[아워골 템플릿] ' + (title || id || '전문가 목표 템플릿');
    ogDesc = desc || '전문가 4단계 마일스톤 계획을 웹에서 바로 확인하고 내 목표로 시작하세요!';
    targetAppUrl = baseUrl + '/?template=' + encodeURIComponent(id || title);
  } else if (type === 'feed') {
    ogTitle = author ? ('[아워골 피드] ' + author + '님의 실천 기록') : ('[아워골 피드] ' + (title || '오늘의 목표 실천'));
    ogDesc = desc || '함께 달리는 사람들과 실천을 공유하고 따뜻한 응원과 자극을 나누어요!';
    targetAppUrl = baseUrl + '/?feed=' + encodeURIComponent(id) + (author ? '&author=' + encodeURIComponent(author) : '') + (title ? '&title=' + encodeURIComponent(title) : '');
  } else if (type === 'group') {
    ogTitle = '[아워골 모임 초대] ' + (title || '함께 목표 달성방');
    ogDesc = desc || '앱 설치 없이 웹에서 바로 초대 수락하고 함께 완주를 시작할 수 있어요!';
    var grpParams = '?invite_group=' + encodeURIComponent(id) + (title ? '&room_name=' + encodeURIComponent(title) : '');
    if (q.max) grpParams += '&max=' + encodeURIComponent(q.max);
    if (q.type) grpParams += '&type=' + encodeURIComponent(q.type);
    if (q.code) grpParams += '&code=' + encodeURIComponent(q.code);
    targetAppUrl = baseUrl + '/' + grpParams;
  } else if (type === 'goal') {
    ogTitle = '[아워골 완주 축하] ' + (title || '목표') + ' 100% 완주! 🏆';
    ogDesc = desc || '목표를 멋지게 완주했어요! 나만의 목표도 아워골에서 함께 시작해보세요.';
    targetAppUrl = baseUrl + '/?goal=' + encodeURIComponent(id) + (title ? '&title=' + encodeURIComponent(title) : '');
  }

  var canonicalUrl = baseUrl + '/share?type=' + encodeURIComponent(type) + '&id=' + encodeURIComponent(id);

  var html = '<!DOCTYPE html>\n' +
    '<html lang="ko">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + escapeHtml(ogTitle) + '</title>\n' +
    '  <meta property="og:type" content="website">\n' +
    '  <meta property="og:site_name" content="아워골">\n' +
    '  <meta property="og:title" content="' + escapeHtml(ogTitle) + '">\n' +
    '  <meta property="og:description" content="' + escapeHtml(ogDesc) + '">\n' +
    '  <meta property="og:image" content="' + escapeHtml(ogImg) + '">\n' +
    '  <meta property="og:url" content="' + escapeHtml(canonicalUrl) + '">\n' +
    '  <meta name="twitter:card" content="summary_large_image">\n' +
    '  <meta name="twitter:title" content="' + escapeHtml(ogTitle) + '">\n' +
    '  <meta name="twitter:description" content="' + escapeHtml(ogDesc) + '">\n' +
    '  <meta name="twitter:image" content="' + escapeHtml(ogImg) + '">\n' +
    '  <meta http-equiv="refresh" content="0;url=' + escapeHtml(targetAppUrl) + '">\n' +
    '</head>\n' +
    '<body style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;text-align:center;padding:50px 20px;background:#f8f9fa;color:#333;">\n' +
    '  <div style="max-width:420px;margin:0 auto;background:#fff;padding:24px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #eee;">\n' +
    '    <div style="font-size:2.2rem;margin-bottom:12px;">🏃</div>\n' +
    '    <h2 style="font-size:1.15rem;margin:0 0 8px;font-weight:700;">' + escapeHtml(ogTitle) + '</h2>\n' +
    '    <p style="font-size:0.875rem;color:#666;line-height:1.5;margin:0 0 20px;">' + escapeHtml(ogDesc) + '</p>\n' +
    '    <a href="' + escapeHtml(targetAppUrl) + '" style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.9rem;">아워골에서 바로 보기</a>\n' +
    '  </div>\n' +
    '  <script>window.location.replace(' + JSON.stringify(targetAppUrl) + ');</script>\n' +
    '</body>\n' +
    '</html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.status(200).send(html);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return handleShareOg(req, res);
  }

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

  // #TASK-ES-036: RLS 차단 우회 데이터 동기화 및 복구 처리
  if (body.action === 'sync_records' || body.backupIds) {
    return handleSyncRecords(sb, body, res);
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
