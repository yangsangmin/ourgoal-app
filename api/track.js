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

// ========================================================
// #TASK-ES-252: 보안 방어선 계층 1 — 호출자 인증 및 소유권 검증 헬퍼
// ========================================================
async function authenticateCaller(sb, req) {
  var authHeader = (req && req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  var token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { ok: false, error: 'Missing bearer authorization token', status: 401 };
  }
  if (!sb) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured', status: 500 };
  }
  try {
    var { data, error } = await sb.auth.getUser(token);
    if (error || !data || !data.user) {
      return { ok: false, error: 'Invalid or expired authentication token', status: 401 };
    }
    return { ok: true, user: data.user, uid: data.user.id };
  } catch (e) {
    return { ok: false, error: e.message || 'Auth verification error', status: 500 };
  }
}

async function handleSyncRecords(sb, body, res, req) {
  var userId = String(body.userId || '').trim();
  var username = String(body.username || '').trim();
  var displayName = String(body.displayName || body.nickname || '').trim();
  var nickname = String(body.nickname || '').trim();
  var backupIds = Array.isArray(body.backupIds) ? body.backupIds.map(String).map(function(s){ return s.trim(); }).filter(Boolean) : [];
  var recordsToSave = Array.isArray(body.recordsToSave) ? body.recordsToSave : null;
  var profileToSave = (body.profileToSave && typeof body.profileToSave === 'object') ? body.profileToSave : null;
  var settingsToSave = (body.settingsToSave && typeof body.settingsToSave === 'object') ? body.settingsToSave : null;

  // #TASK-ES-252: 보안 강화 — 사용자 데이터 조회/동기화 시 본인 인증 필수
  var authRes = await authenticateCaller(sb, req);
  if (!authRes.ok) {
    return res.status(authRes.status || 401).json({
      ok: false,
      error: authRes.error || 'Unauthorized: Token required to sync user records'
    });
  }

  var authUid = authRes.uid;

  // IDOR 방어: 클라이언트가 전달한 userId가 인증된 사용자 UID와 불일치 시 차단
  if (userId && userId !== authUid) {
    return res.status(403).json({
      ok: false,
      error: 'Forbidden: You cannot access or modify another user\'s records'
    });
  }

  // targetUid는 엄격히 인증된 사용자 UID로 고정
  var targetUid = authUid;

  try {
    var matchedUser = null;
    try {
      var uRes = await sb.from('users').select('*').eq('id', targetUid);
      if (uRes.data && uRes.data.length > 0) {
        matchedUser = uRes.data[0];
      }
    } catch (e) {}

    // checkins 테이블 조회 (오직 인증된 본인 UID로만 격리 조회)
    var fetchedRecords = [];
    try {
      var recRes = await sb.from('checkins').select('*').eq('user_id', targetUid).order('start_at', { ascending: false });
      if (recRes.data && recRes.data.length > 0) {
        fetchedRecords = recRes.data;
      }
    } catch (e) {}

    // goals 테이블 조회 (오직 인증된 본인 UID로만 격리 조회)
    var fetchedGoals = [];
    try {
      var gRes = await sb.from('goals').select('*').eq('user_id', targetUid).order('created_at', { ascending: true });
      if (gRes.data && gRes.data.length > 0) {
        fetchedGoals = gRes.data;
      }
    } catch (e) {}

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
        if (profileToSave.savedAvatars && Array.isArray(profileToSave.savedAvatars)) {
          profRow.saved_avatars = profileToSave.savedAvatars;
        }
        await sb.from('users').upsert(profRow);
      } catch (e) {}
    }

    // [#TASK-ES-265] 설정(구글 캘린더 연동 등) 영구 원장 영속화 및 자동 복원
    if (settingsToSave && targetUid) {
      try {
        await sb.from('events').insert({
          sid: null,
          name: 'settings_ledger',
          props: {
            userId: targetUid,
            settings: settingsToSave,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (e) {
        console.warn('[sync_records] settings_ledger write error:', e.message);
      }
    }

    var fetchedSettings = null;
    try {
      var setRes = await sb.from('events')
        .select('props')
        .eq('name', 'settings_ledger')
        .filter('props->>userId', 'eq', targetUid)
        .order('id', { ascending: false })
        .limit(1);
      if (setRes.data && setRes.data.length > 0 && setRes.data[0].props && setRes.data[0].props.settings) {
        fetchedSettings = setRes.data[0].props.settings;
      }
    } catch (e) {}

    res.status(200).json({
      ok: true,
      targetUserId: targetUid,
      matchedUser: matchedUser,
      user: matchedUser,
      settings: fetchedSettings,
      savedAvatars: (matchedUser && matchedUser.saved_avatars) || [],
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

/* #TASK-ES-124: RLS 우회 실제 회원 닉네임 검색 핸들러 (SUPABASE_SERVICE_ROLE_KEY 활용) */
async function handleSearchUsers(sb, body, res) {
  var q = String(body.query || body.p_query || '').trim();
  if (!q || q.length < 1) {
    return res.status(200).json({ ok: true, users: [] });
  }

  try {
    var uRes = await sb.from('users')
      .select('id, username, display_name, avatar_url, bio, interests')
      .or('display_name.ilike.%' + q + '%,username.ilike.%' + q + '%')
      .limit(20);

    if (uRes.error) {
      console.warn('[search_users] DB 조회 경고:', uRes.error);
      return res.status(200).json({ ok: false, error: uRes.error.message, users: [] });
    }

    var list = (uRes.data || []).map(function(u) {
      return {
        id: u.id,
        nickname: u.display_name || u.username || '아워골 회원',
        name: u.display_name || u.username || '아워골 회원',
        avatar: u.avatar_url || '👤',
        intro: u.bio || '함께 실천하는 아워골 회원',
        theme: (Array.isArray(u.interests) && u.interests[0]) || '일반',
        level: 1,
        streak: 1,
        isAiBot: false
      };
    });

    return res.status(200).json({ ok: true, users: list });
  } catch (err) {
    console.warn('[search_users] 예외 발생:', err);
    return res.status(500).json({ ok: false, error: (err && err.message) || '검색 처리 실패', users: [] });
  }
}

// #TASK-ES-129 & #TASK-ES-252: 동반자 데이터 영구 영속화 및 복원 (인증 및 소유권 검증 필수)
async function handleSyncCompanions(sb, body, res, req) {
  var userId = String(body.userId || '').trim();
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId is required', companions: [] });
  }

  // #TASK-ES-252: 본인 토큰 인증 필수
  var authRes = await authenticateCaller(sb, req);
  if (!authRes.ok) {
    return res.status(authRes.status || 401).json({
      ok: false,
      error: authRes.error || 'Unauthorized: Token required to sync companions',
      companions: []
    });
  }
  if (authRes.uid !== userId) {
    return res.status(403).json({
      ok: false,
      error: 'Forbidden: You cannot access or modify another user\'s companions',
      companions: []
    });
  }

  var companionsToSave = Array.isArray(body.companions) ? body.companions : null;

  try {
    // 1. 저장 요청인 경우: events 테이블에 원장 기록 + users 테이블 백업 시도
    if (companionsToSave !== null) {
      try {
        await sb.from('events').insert({
          sid: null,
          name: 'companion_ledger',
          props: {
            userId: userId,
            companions: companionsToSave,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (e) {
        console.warn('[sync_companions] events ledger write warning:', e.message);
      }

      try {
        await sb.from('users').update({ companions: companionsToSave }).eq('id', userId);
      } catch (e) {}

      return res.status(200).json({ ok: true, companions: companionsToSave, saved: true });
    }

    // 2. 조회 요청인 경우: events 원장에서 해당 user의 가장 최신 companion_ledger 조회
    var latestCompanions = [];
    try {
      var evRes = await sb.from('events')
        .select('props')
        .eq('name', 'companion_ledger')
        .filter('props->>userId', 'eq', userId)
        .order('id', { ascending: false })
        .limit(1);

      if (evRes.data && evRes.data.length > 0 && evRes.data[0].props && Array.isArray(evRes.data[0].props.companions)) {
        latestCompanions = evRes.data[0].props.companions;
      }
    } catch (e) {
      console.warn('[sync_companions] events ledger read warning:', e.message);
    }

    // 3. 만약 events에 없으면 users 테이블 조회 시도
    if (!latestCompanions.length) {
      try {
        var uRes = await sb.from('users').select('companions').eq('id', userId).maybeSingle();
        if (uRes.data && Array.isArray(uRes.data.companions)) {
          latestCompanions = uRes.data.companions;
        }
      } catch (e) {}
    }

    return res.status(200).json({ ok: true, companions: latestCompanions, saved: false });
  } catch (err) {
    console.warn('[sync_companions] 예외 발생:', err);
    return res.status(500).json({ ok: false, error: (err && err.message) || '동반자 동기화 실패', companions: [] });
  }
}

// #TASK-ES-123: 1:1 고객 문의 및 오류 제보 접수 (노션 DB + 텔레그램 + Supabase)
var DEFAULT_NOTION_INQUIRIES_DB_ID = '3dd598db-9096-816e-8875-c602c34d251f';
var DEFAULT_TELEGRAM_CHAT_ID = '1260106462';
var TYPE_LABELS = {
  bug: '버그/오류 제보',
  feature: '새로운 기능 제안',
  account: '계정/보안 관련',
  evaluation: '앱 평가/피드백',
  item_report: '잇템 불법/유해 신고',
  other: '기타 문의사항'
};

async function handleInquiry(sb, body, req, res) {
  var isAppEval = body.type === 'app_evaluation' || !!body.evaluation;
  var isItemReport = body.inquiryType === 'item_report' || body.type === 'item_report';
  var evalData = body.evaluation || {};
  var evalScore = (evalData.score !== undefined && evalData.score !== null && !isNaN(evalData.score)) ? Number(evalData.score) : null;
  var evalPros = typeof evalData.pros === 'string' ? evalData.pros.trim() : '';
  var evalCons = typeof evalData.cons === 'string' ? evalData.cons.trim() : '';
  var evalImp = typeof evalData.improvements === 'string' ? evalData.improvements.trim() : '';
  var evalCeo = typeof evalData.ceoMsg === 'string' ? evalData.ceoMsg.trim() : '';

  var content = typeof body.content === 'string' ? body.content.trim() : '';

  // #TASK-ES-154: 아워골 앱 평가 데이터인 경우 5개 항목을 리포트 본문으로 자동 조립
  if (isAppEval) {
    var evalParts = [];
    evalParts.push('[아워골 종합 앱 평가 리포트]');
    if (evalScore !== null) evalParts.push('• 종합 점수: ' + evalScore + '점 / 100점');
    if (evalPros) evalParts.push('• 장점 (좋았던 점): ' + evalPros);
    if (evalCons) evalParts.push('• 단점 (아쉬웠던 점): ' + evalCons);
    if (evalImp) evalParts.push('• 추가 및 개선 요청: ' + evalImp);
    if (evalCeo) evalParts.push('• 대표에게 하고 싶은 말: ' + evalCeo);
    content = evalParts.join('\n');
  }

  // #TASK-ES-179: 잇템 불법/유해 링크 신고 데이터인 경우 리포트 본문 자동 조립
  var repData = body.reportData || {};
  if (isItemReport && repData.itemName) {
    var repParts = [];
    repParts.push('[잇템 불법·유해 링크 신고]');
    repParts.push('• 대상 잇템: ' + (repData.itemName || '-'));
    repParts.push('• 등록 유저: ' + (repData.itemOwner || '-'));
    repParts.push('• 구매 링크: ' + (repData.itemUrl || '-'));
    repParts.push('• 신고 사유: ' + (repData.reasonLabel || repData.reason || '-'));
    if (content) repParts.push('• 상세 설명: ' + content);
    content = repParts.join('\n');
  }

  var inquiryType = isAppEval ? 'evaluation' : (isItemReport ? 'item_report' : (body.inquiryType || 'other'));
  var replyEmail = typeof body.replyEmail === 'string' ? body.replyEmail.trim().slice(0, 100) : '';
  var userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  var userNickname = typeof body.userNickname === 'string' ? body.userNickname.trim() : (typeof body.userName === 'string' ? body.userName.trim() : '익명 유저');
  var userAgent = typeof body.userAgent === 'string' ? body.userAgent.slice(0, 300) : (req.headers && req.headers['user-agent'] ? req.headers['user-agent'].slice(0, 300) : '');
  var appVersion = body.appVersion || 'v1.0.0';

  if (!content) {
    return res.status(400).json({ ok: false, error: '문의 또는 신고 내용을 입력해주세요.' });
  }

  var typeLabel = TYPE_LABELS[inquiryType] || (isAppEval ? '앱 평가/피드백' : (isItemReport ? '잇템 불법/유해 신고' : '기타 문의사항'));
  var nowIso = new Date().toISOString();
  var summaryTitle = isAppEval
    ? ('[앱 평가] ⭐ ' + (evalScore !== null ? evalScore + '점' : '점수미기재') + ' - ' + (evalCeo || evalPros || evalImp || '사용자 평가').slice(0, 20).replace(/[\r\n]+/g, ' ') + ' (' + userNickname + ')')
    : (isItemReport
      ? ('[🚨 잇템 신고] ' + (repData.itemName || '아이템').slice(0, 20) + ' (' + (repData.reasonLabel || '신고') + ') - ' + userNickname)
      : ('[' + typeLabel + '] ' + content.slice(0, 25).replace(/[\r\n]+/g, ' ') + (content.length > 25 ? '...' : '') + ' (' + userNickname + ')'));

  var results = { supabase: false, notion: false, telegram: false };

  // 1. Supabase 적재 (inquiries 테이블)
  if (sb) {
    try {
      var { data: sbData, error: sbErr } = await sb.from('inquiries').insert({
        inquiry_type: inquiryType,
        reply_email: replyEmail || null,
        content: content,
        user_id: userId || null,
        user_nickname: userNickname,
        user_agent: userAgent,
        app_version: appVersion,
        status: '접수',
        created_at: nowIso
      }).select('id').single();

      if (!sbErr && sbData) {
        results.supabase = true;
      } else if (sbErr) {
        console.warn('[Inquiry] Supabase warning:', sbErr.message);
      }
    } catch (e) {
      console.warn('[Inquiry] Supabase exception:', e.message);
    }
  }

  // 2. 노션 '고객 문의 및 오류 제보 원장' DB 적재
  var notionToken = process.env.NOTION_TOKEN;
  var notionDbId = process.env.NOTION_INQUIRIES_DB_ID || DEFAULT_NOTION_INQUIRIES_DB_ID;

  if (notionToken && notionDbId) {
    try {
      var notionPayload = {
        parent: { database_id: notionDbId },
        properties: {
          '제목': {
            title: [{ type: 'text', text: { content: summaryTitle.slice(0, 100) } }]
          },
          '유형': {
            select: { name: typeLabel }
          },
          '상태': {
            select: { name: '접수' }
          },
          '작성자 닉네임': {
            rich_text: [{ type: 'text', text: { content: userNickname.slice(0, 100) } }]
          },
          '작성자 ID': {
            rich_text: [{ type: 'text', text: { content: (userId || '-').slice(0, 100) } }]
          },
          '문의 내용': {
            rich_text: [{ type: 'text', text: { content: content.slice(0, 2000) } }]
          },
          '기기/앱정보': {
            rich_text: [{ type: 'text', text: { content: (appVersion + ' / ' + userAgent).slice(0, 500) } }]
          },
          '접수일시': {
            date: { start: nowIso }
          }
        }
      };

      if (replyEmail) {
        notionPayload.properties['회신 이메일'] = { email: replyEmail };
      }

      var notionRes = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + notionToken,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notionPayload),
        signal: AbortSignal.timeout(5000)
      });

      if (notionRes.ok) {
        results.notion = true;
      } else {
        var nErrText = await notionRes.text();
        console.warn('[Inquiry] Notion warning:', notionRes.status, nErrText);
      }
    } catch (e) {
      console.warn('[Inquiry] Notion exception:', e.message);
    }
  }

  // 3. 상민님 텔레그램 실시간 알림 발송
  var tgToken = process.env.TELEGRAM_BOT_TOKEN;
  var tgChatId = process.env.TELEGRAM_ALLOWED_CHAT_ID || DEFAULT_TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    try {
      var tgText = isAppEval
        ? ('⭐ [아워골 사용자 앱 평가 접수]\n\n' +
           (evalScore !== null ? '• 종합 점수: ' + evalScore + '점 / 100점\n' : '') +
           '• 작성자: ' + userNickname + (userId ? ' (' + userId.slice(0, 8) + '...)' : '') + '\n' +
           '• 앱 버전: ' + appVersion + '\n' +
           '• 접수 시각: ' + nowIso.replace('T', ' ').slice(0, 19) + '\n\n' +
           '[평가 리포트 상세]\n' + content + '\n\n' +
           '👉 노션 원장: https://app.notion.com/p/' + notionDbId.replace(/-/g, ''))
        : (isItemReport
          ? ('🚨 [아워골 잇템 불법/유해 링크 신고 접수]\n\n' +
             '• 대상 아이템: ' + (repData.itemName || '-') + '\n' +
             '• 등록 유저: ' + (repData.itemOwner || '-') + '\n' +
             '• 구매 링크: ' + (repData.itemUrl || '-') + '\n' +
             '• 신고 사유: ' + (repData.reasonLabel || repData.reason || '-') + '\n' +
             '• 상세 사유: ' + (content || '-') + '\n' +
             '• 신고자: ' + userNickname + (userId ? ' (' + userId.slice(0, 8) + '...)' : '') + '\n' +
             '• 회신 이메일: ' + (replyEmail || '미입력(익명)') + '\n' +
             '• 앱 버전: ' + appVersion + '\n' +
             '• 접수 시각: ' + nowIso.replace('T', ' ').slice(0, 19) + '\n\n' +
             '👉 노션 원장: https://app.notion.com/p/' + notionDbId.replace(/-/g, ''))
          : ('📩 [아워골 고객 문의/오류 제보 접수]\n\n' +
             '• 유형: ' + typeLabel + '\n' +
             '• 작성자: ' + userNickname + (userId ? ' (' + userId.slice(0, 8) + '...)' : '') + '\n' +
             '• 회신 이메일: ' + (replyEmail || '미입력(익명)') + '\n' +
             '• 앱 버전: ' + appVersion + '\n' +
             '• 접수 시각: ' + nowIso.replace('T', ' ').slice(0, 19) + '\n\n' +
             '[문의 내용]\n' + content + '\n\n' +
             '👉 노션 원장: https://app.notion.com/p/' + notionDbId.replace(/-/g, '')));

      var tgRes = await fetch('https://api.telegram.org/bot' + tgToken + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: tgText
        }),
        signal: AbortSignal.timeout(4000)
      });

      if (tgRes.ok) {
        results.telegram = true;
      }
    } catch (e) {
      console.warn('[Inquiry] Telegram exception:', e.message);
    }
  }

  return res.status(200).json({
    ok: true,
    message: isAppEval
      ? '소중한 평가가 접수되었습니다. 감사합니다! ⭐'
      : (isItemReport
        ? '신고가 정상 접수되었습니다. 신속히 검토하여 조치하겠습니다.'
        : '문의가 성공적으로 접수되었습니다. 신속히 검토하겠습니다.'),
    results: results
  });
}

// =============================================================================
// #TASK-ES-208: 24/7 Always-On 옴니채널 텔레그램 지휘 웹훅 (Vercel Serverless)
// - 최고 지휘 참모 양비스(Antigravity Omni) 엔드포인트
// - Pro Thinking (2048) 심층 추론 및 Flash 자동 폴백
// - Notion SSOT (commandInbox DB 100턴 복원 & activityLog 실시간 영구 기록)
// - 상민님(ALLOWED_CHAT_ID: 1260106462) 단독 보안 인가 방화벽
// - 3900자 안전 청킹 분할 전송
// =============================================================================

var TG_OMNI_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
var TG_OMNI_ALLOWED_CHAT_ID = 1260106462;
var TG_OMNI_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
var TG_OMNI_GEMINI_KEY = process.env.GEMINI_API_KEY || '';
var TG_OMNI_NOTION_TOKEN = process.env.NOTION_TOKEN || '';
var TG_COMMAND_INBOX_DB = '7f4c892e-9934-4eeb-9576-5d31d39152b5';
var TG_ACTIVITY_LOG_DB = 'ebe4de7d-deb7-4389-aa34-dc57221bba8f';
var TG_OMNI_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
var TG_OMNI_FALLBACK_MODEL = 'gemini-2.5-flash';
var TG_OMNI_THINKING_BUDGET = parseInt(process.env.THINKING_BUDGET || '2048', 10);

async function sendTelegramOmniMessage(chatId, text, replyToMessageId) {
  if (!TG_OMNI_BOT_TOKEN || !chatId) return null;
  var chunks = [];
  var limit = 3900;
  for (var i = 0; i < text.length; i += limit) {
    chunks.push(text.slice(i, i + limit));
  }
  if (!chunks.length) chunks.push('');

  var lastRes = null;
  for (var idx = 0; idx < chunks.length; idx++) {
    var payload = {
      chat_id: chatId,
      text: chunks[idx],
      parse_mode: 'Markdown'
    };
    if (idx === 0 && replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }
    try {
      var resp = await fetch('https://api.telegram.org/bot' + TG_OMNI_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await resp.json();
      if (!data.ok && data.description && data.description.indexOf('can\'t parse entities') !== -1) {
        delete payload.parse_mode;
        var retryResp = await fetch('https://api.telegram.org/bot' + TG_OMNI_BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        lastRes = await retryResp.json();
      } else {
        lastRes = data;
      }
    } catch (e) {
      console.warn('[TelegramOmni] 발송 실패:', e.message);
    }
  }
  return lastRes;
}

async function editTelegramOmniMessage(chatId, messageId, text) {
  if (!TG_OMNI_BOT_TOKEN || !chatId || !messageId) return null;
  var safeText = text.slice(0, 3900);
  var payload = {
    chat_id: chatId,
    message_id: messageId,
    text: safeText,
    parse_mode: 'Markdown'
  };
  try {
    var resp = await fetch('https://api.telegram.org/bot' + TG_OMNI_BOT_TOKEN + '/editMessageText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await resp.json();
    if (!data.ok && data.description && data.description.indexOf('can\'t parse entities') !== -1) {
      delete payload.parse_mode;
      var retryResp = await fetch('https://api.telegram.org/bot' + TG_OMNI_BOT_TOKEN + '/editMessageText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await retryResp.json();
    }
    return data;
  } catch (e) {
    console.warn('[TelegramOmni] 편집 실패:', e.message);
    return null;
  }
}

async function sendTelegramOmniChatAction(chatId, action) {
  if (!TG_OMNI_BOT_TOKEN || !chatId) return;
  try {
    await fetch('https://api.telegram.org/bot' + TG_OMNI_BOT_TOKEN + '/sendChatAction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: action || 'typing' })
    });
  } catch (e) {}
}

async function queryNotionOmniSession(notionToken, dbId, limit) {
  if (!notionToken || !dbId) return [];
  try {
    var resp = await fetch('https://api.notion.com/v1/databases/' + dbId + '/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + notionToken,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: limit || 20,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }]
      })
    });
    if (!resp.ok) return [];
    var data = await resp.json();
    var turns = [];
    var pages = (data.results || []).reverse();
    pages.forEach(function (page) {
      var props = page.properties || {};
      var userText = '';
      var modelText = '';
      if (props['입력'] && props['입력'].title && props['입력'].title[0]) {
        userText = props['입력'].title.map(function (t) { return t.plain_text || ''; }).join('');
      }
      if (props['응답'] && props['응답'].rich_text && props['응답'].rich_text[0]) {
        modelText = props['응답'].rich_text.map(function (t) { return t.plain_text || ''; }).join('');
      }
      if (userText) turns.push({ role: 'user', text: userText });
      if (modelText) turns.push({ role: 'model', text: modelText });
    });
    return turns;
  } catch (e) {
    console.warn('[TelegramOmni] 노션 세션 조회 예외:', e.message);
    return [];
  }
}

async function recordTurnToNotionOmni(notionToken, dbId, userInput, modelResponse) {
  if (!notionToken || !dbId) return null;
  try {
    var payload = {
      parent: { database_id: dbId },
      properties: {
        '입력': {
          title: [{ text: { content: (userInput || '').slice(0, 2000) } }]
        },
        '응답': {
          rich_text: [{ text: { content: (modelResponse || '').slice(0, 2000) } }]
        },
        '대상': {
          select: { name: 'Telegram-Omni' }
        },
        '처리상태': {
          select: { name: '완료' }
        },
        '실행 ID': {
          rich_text: [{ text: { content: 'vercel-' + Date.now() } }]
        }
      }
    };
    var resp = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + notionToken,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await resp.json();
  } catch (e) {
    console.warn('[TelegramOmni] 노션 턴 기록 예외:', e.message);
    return null;
  }
}

async function recordActivityLogOmni(notionToken, dbId, title, details) {
  if (!notionToken || !dbId) return null;
  try {
    var payload = {
      parent: { database_id: dbId },
      properties: {
        '이름': {
          title: [{ text: { content: (title || '').slice(0, 2000) } }]
        },
        '내용': {
          rich_text: [{ text: { content: (details || '').slice(0, 2000) } }]
        }
      }
    };
    var resp = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + notionToken,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await resp.json();
  } catch (e) {
    return null;
  }
}

async function callGeminiOmni(apiKey, userMessage, pastTurns, modelName) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  var targetModel = modelName || TG_OMNI_GEMINI_MODEL;
  var isPro = targetModel.indexOf('pro') !== -1;

  var contents = [];
  (pastTurns || []).slice(-10).forEach(function (turn) {
    contents.push({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text }]
    });
  });
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  var systemPrompt = [
    '당신은 아워골(Ourgoal)과 양비스 관제센터의 최고 지휘 참모 "양비스(Antigravity Omni)"입니다.',
    '상민님의 모바일 텔레그램 지시를 신속하고 엄정하게 수행하며 실시간 보고서를 작성합니다.',
    '',
    '## 핵심 행동 수칙',
    '1. 상민님은 최고 결정권자이십니다.',
    '2. 헌법과 지침을 철저히 준수하며 상태는 선언이 아니라 측정입니다. 못 쟀으면 "확인 못 함"이라고 보고합니다.',
    '3. 모바일 화면에서 빠르게 핵심을 파악할 수 있도록 결론을 맨 앞에 제시하고, 불필요한 인사치레는 생략합니다.',
    '4. 승인선(① 돈 ② 개인정보 ③ 기존 기능 삭제 ④ 되돌릴 수 없는 바깥 행위 ⑤ 규범 변경)에 해당하는 항목은 반드시 [결심 필요]로 보고합니다.',
    '5. 현재 Vercel Serverless 무중단 24/7 Always-On 인프라에서 가동 중입니다.'
  ].join('\n');

  var requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192
    }
  };

  if (isPro) {
    requestBody.generationConfig.thinking_config = {
      thinking_budget: TG_OMNI_THINKING_BUDGET
    };
  }

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + targetModel + ':generateContent?key=' + apiKey;

  try {
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!resp.ok) {
      var errData = await resp.json().catch(function () { return {}; });
      var status = resp.status;
      if ((status === 429 || status === 503 || status === 500) && targetModel !== TG_OMNI_FALLBACK_MODEL) {
        console.warn('[TelegramOmni] Gemini Pro 호출 실패(' + status + '), Flash 모델로 폴백합니다.');
        return await callGeminiOmni(apiKey, userMessage, pastTurns, TG_OMNI_FALLBACK_MODEL);
      }
      throw new Error('Gemini API Error (' + status + '): ' + (errData.error?.message || resp.statusText));
    }
    var data = await resp.json();
    var cand = data.candidates && data.candidates[0];
    if (!cand || !cand.content || !cand.content.parts) {
      throw new Error('Gemini로부터 유효한 응답을 받지 못했습니다.');
    }
    var answer = cand.content.parts.map(function (p) { return p.text || ''; }).join('').trim();
    return { text: answer, model: targetModel };
  } catch (err) {
    if (targetModel !== TG_OMNI_FALLBACK_MODEL) {
      console.warn('[TelegramOmni] Gemini 예외 발생, Flash 폴백 시도:', err.message);
      return await callGeminiOmni(apiKey, userMessage, pastTurns, TG_OMNI_FALLBACK_MODEL);
    }
    throw err;
  }
}

async function handleTelegramHealthCheck(req, res) {
  res.status(200).json({
    ok: true,
    service: 'telegram-omni-webhook',
    runtime: 'Vercel Serverless Function',
    geminiConfigured: !!TG_OMNI_GEMINI_KEY,
    notionConfigured: !!TG_OMNI_NOTION_TOKEN,
    model: TG_OMNI_GEMINI_MODEL,
    thinkingBudget: TG_OMNI_THINKING_BUDGET,
    allowedChatId: TG_OMNI_ALLOWED_CHAT_ID,
    timestamp: new Date().toISOString()
  });
}

async function handleTelegramWebhook(body, req, res) {
  if (TG_OMNI_WEBHOOK_SECRET) {
    var secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (secretHeader !== TG_OMNI_WEBHOOK_SECRET) {
      res.status(401).json({ error: 'Unauthorized webhook secret' });
      return;
    }
  }

  var msg = body.message || body.edited_message;
  if (!msg || !msg.text) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  var chatId = msg.chat?.id;
  var userId = msg.from?.id;
  var userText = (msg.text || '').trim();

  if (chatId !== TG_OMNI_ALLOWED_CHAT_ID && userId !== TG_OMNI_ALLOWED_CHAT_ID) {
    console.warn('[TelegramWebhook] 미승인 접근 차단: chat=' + chatId + ', user=' + userId);
    await sendTelegramOmniMessage(chatId, '⛔ **미승인 접근 차단**\n등록된 최고 결정권자(상민님)만 지휘 사령부를 이용하실 수 있습니다.');
    res.status(200).json({ ok: true, blocked: true });
    return;
  }

  var startTime = Date.now();

  if (userText === '/start' || userText === '/help') {
    var helpMsg = [
      '☀️ **양비스 옴니채널 24/7 Always-On 사령부 (Vercel Cloud)**',
      '',
      '• **인프라**: Vercel Serverless Function (`/api/telegram` -> `api/track.js`)',
      '• **두뇌 엔진**: `' + TG_OMNI_GEMINI_MODEL + '` (Thinking Budget: ' + TG_OMNI_THINKING_BUDGET + ')',
      '• **중앙 원장**: Notion SSOT (`commandInbox` 100턴 복원 & `activityLog` 실시간 보존)',
      '• **가용성**: 데스크탑 PC 전원 OFF 시에도 모바일/맥북에서 24/7 무중단 지휘 가능',
      '',
      '명령이나 질문을 편하게 말씀해 주시면 심층 추론 후 보고합니다.'
    ].join('\n');
    await sendTelegramOmniMessage(chatId, helpMsg, msg.message_id);
    res.status(200).json({ ok: true, command: 'help' });
    return;
  }

  if (userText === '/status') {
    var statusMsg = [
      '📊 **양비스 옴니채널 시스템 상태 진단**',
      '',
      '• **서버리스 런타임**: Vercel Node.js (`https://ourgoal.app/api/telegram`)',
      '• **Gemini API 연동**: ' + (TG_OMNI_GEMINI_KEY ? '정상 연결 (키 등록됨)' : '⚠️ 키 누락'),
      '• **Notion SSOT 연동**: ' + (TG_OMNI_NOTION_TOKEN ? '정상 연결 (DB ' + TG_COMMAND_INBOX_DB.slice(0, 8) + '...)' : '⚠️ 토큰 누락'),
      '• **추론 모델**: `' + TG_OMNI_GEMINI_MODEL + '` (폴백: `' + TG_OMNI_FALLBACK_MODEL + '`)',
      '• **인가 사용자**: 상민님 (`' + TG_OMNI_ALLOWED_CHAT_ID + '`)'
    ].join('\n');
    await sendTelegramOmniMessage(chatId, statusMsg, msg.message_id);
    res.status(200).json({ ok: true, command: 'status' });
    return;
  }

  await sendTelegramOmniChatAction(chatId, 'typing');
  var ackText = '⚡ **지시 접수**: "' + userText.slice(0, 40) + (userText.length > 40 ? '...' : '') + '"\n🧠 양비스 심층 추론(Pro Thinking 2048) 및 노션 SSOT 분석 중...';
  var ackRes = await sendTelegramOmniMessage(chatId, ackText, msg.message_id);
  var ackMsgId = ackRes?.result?.message_id;

  try {
    var pastTurns = await queryNotionOmniSession(TG_OMNI_NOTION_TOKEN, TG_COMMAND_INBOX_DB, 20);
    var geminiResult = await callGeminiOmni(TG_OMNI_GEMINI_KEY, userText, pastTurns, TG_OMNI_GEMINI_MODEL);
    var duration = ((Date.now() - startTime) / 1000).toFixed(1);

    var finalReport = [
      '📋 **[양비스 심층 지휘 보고]** (' + duration + '초 · ' + geminiResult.model + ')',
      '',
      geminiResult.text
    ].join('\n');

    await recordTurnToNotionOmni(TG_OMNI_NOTION_TOKEN, TG_COMMAND_INBOX_DB, userText, geminiResult.text);
    await recordActivityLogOmni(TG_OMNI_NOTION_TOKEN, TG_ACTIVITY_LOG_DB, 'Telegram: ' + userText.slice(0, 40), geminiResult.text.slice(0, 200));

    if (ackMsgId && finalReport.length <= 3900) {
      await editTelegramOmniMessage(chatId, ackMsgId, finalReport);
    } else {
      if (ackMsgId) {
        await editTelegramOmniMessage(chatId, ackMsgId, '📋 **[양비스 심층 지휘 보고]** (' + duration + '초 소요)\n상세 보고서가 아래로 이어집니다.');
      }
      await sendTelegramOmniMessage(chatId, finalReport, msg.message_id);
    }

    res.status(200).json({ ok: true, durationMs: Date.now() - startTime, model: geminiResult.model });
  } catch (err) {
    console.warn('[TelegramWebhook] 처리 중 예외 발생:', err.message);
    var errMsg = '❌ **[양비스 지휘 처리 실패]**\n• 사유: ' + (err.message || '알 수 없는 오류');
    if (ackMsgId) {
      await editTelegramOmniMessage(chatId, ackMsgId, errMsg);
    } else {
      await sendTelegramOmniMessage(chatId, errMsg, msg.message_id);
    }
    res.status(200).json({ ok: false, error: err.message });
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

  if (req.method === 'GET') {
    var isUrlTelegramGet = req.url && req.url.indexOf('/telegram') !== -1;
    if (isUrlTelegramGet) {
      return handleTelegramHealthCheck(req, res);
    }
    return handleShareOg(req, res);
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  // #TASK-ES-208: 24/7 Always-On 옴니채널 텔레그램 지휘 웹훅 (Vercel Serverless)
  var isUrlTelegram = req.url && req.url.indexOf('/telegram') !== -1;
  if (isUrlTelegram || body.update_id || (body.message && body.message.chat)) {
    return handleTelegramWebhook(body, req, res);
  }

  var sb = getSupabase();

  // #TASK-ES-123 & #TASK-ES-154: 1:1 고객 문의, 오류 제보 및 앱 평가 접수 (노션 DB + 텔레그램 + Supabase)
  var isUrlInquiry = req.url && req.url.indexOf('/inquiry') !== -1;
  var isAppEval = body.type === 'app_evaluation' || !!body.evaluation;
  if (body.action === 'inquiry' || isUrlInquiry || isAppEval || (body.content && body.inquiryType)) {
    return handleInquiry(sb, body, req, res);
  }

  // #TASK-ES-036 & #TASK-ES-252: RLS 차단 우회 데이터 동기화 및 복구 처리 (보안 인증 필수)
  if (body.action === 'sync_records' || body.backupIds) {
    return handleSyncRecords(sb, body, res, req);
  }

  // #TASK-ES-129 & #TASK-ES-252: 동반자 데이터 영구 영속화 및 복원 (보안 인증 필수)
  if (body.action === 'sync_companions') {
    return handleSyncCompanions(sb, body, res, req);
  }

  if (!sb) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
    return;
  }

  // #TASK-ES-124: RLS 차단 및 세션 만료 무관 실제 회원 닉네임 검색
  if (body.action === 'search_users') {
    return handleSearchUsers(sb, body, res);
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

module.exports.config = { maxDuration: 60 };
