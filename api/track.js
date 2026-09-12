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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
