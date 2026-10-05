/**
 * OurGoal Profile Load (기관 — 프로필 불러오기·사용자 행 만들기·고유 닉네임 태그·완료 마일스톤 합)
 *
 * 「뱃지 컬렉션 (명예의 전당)」 묶음에 남아 있던 프로필 쪽: 로그인·다시 맞추기 때 서버·이 기기 백업에서 프로필을 불러와 합치기(loadProfile), 서버 users 행이 없으면 만들기(ensureUserRow), 동명이인 고유 태그 붙이기·표시(resolveUniqueDisplayName·formatDisplayNameWithTag), 완료 마일스톤 합(totalCompletedMilestones — smoke 시험지 FN_NAMES, 합본으로 찾는다).
 * 기본 프로필(defaultProfile — 함수 끝 줄에 노출 문이 붙어 있어 옮기면 그 줄이 잘린다)·앱 상태(state)·window 노출 줄은 원래 자리에 그대로 있다.
 * #TASK-ES-522(인라인 3단계 Z1 로그인·계정 2차): index.html 인라인 IIFE 의 구간(이전 전 3512~3516 · 3533~3560 · 3562~3574 · 3576~3607 · 3608~3818줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 3512~3516줄(#TASK-ES-522 생성기 표지) ---- */
  function totalCompletedMilestones(p){
    var n = 0;
    p.goals.forEach(function(g){ (g.milestones||[]).forEach(function(m){ if(m.status==='done') n++; }); });
    return n;
  }

  /* ---- 이전 전 index.html 3533~3560줄(#TASK-ES-522 생성기 표지) ---- */

  // [#TASK-ES-320], [69] 카카오 로그인 일원화 동명이인 가입/중복 닉네임 방지 고유 태그 부여
  async function resolveUniqueDisplayName(baseName, userId){
    var cleaned = (baseName || '회원').trim();
    if(!cleaned) cleaned = '회원';
    if(/#\d{4}$/.test(cleaned)) return cleaned;
    try {
      if(typeof L.sb !== 'undefined' && L.sb){
        var dupCheck = await L.sb.from('users').select('id, display_name').eq('display_name', cleaned).limit(2);
        if(dupCheck && dupCheck.data && dupCheck.data.length > 0){
          var isMeOnly = (dupCheck.data.length === 1 && dupCheck.data[0].id === userId);
          if(!isMeOnly){
            // 4자리 고유 식별 태그 충돌 방지 탐색 (최대 5회 시도)
            for(var attempt = 0; attempt < 5; attempt++){
              var tag = '#' + Math.floor(1000 + Math.random() * 9000);
              var candidate = cleaned + tag;
              var candCheck = await L.sb.from('users').select('id').eq('display_name', candidate).limit(1);
              if(!candCheck || !candCheck.data || candCheck.data.length === 0){
                return candidate;
              }
            }
            return cleaned + '#' + Math.floor(1000 + Math.random() * 9000);
          }
        }
      }
    } catch(e){}
    return cleaned;
  }

  /* ---- 이전 전 index.html 3562~3574줄(#TASK-ES-522 생성기 표지) ---- */

  // 닉네임과 고유 태그 분리 렌더러 (거부감 없는 자연스러운 시인성 보장)
  function formatDisplayNameWithTag(name){
    if(!name) return '';
    var str = String(name);
    var m = str.match(/^(.*)(#\d{4})$/);
    if(m){
      var base = (typeof L.escapeHtml === 'function' ? L.escapeHtml(m[1]) : m[1]);
      var tag = (typeof L.escapeHtml === 'function' ? L.escapeHtml(m[2]) : m[2]);
      return '<span class="display-name-base">' + base + '</span><span class="display-name-tag" style="color:var(--muted, #8e8e93);font-size:0.8em;margin-left:3px;font-weight:400;">' + tag + '</span>';
    }
    return '<span class="display-name-base">' + (typeof L.escapeHtml === 'function' ? L.escapeHtml(str) : str) + '</span>';
  }

  /* ---- 이전 전 index.html 3576~3607줄(#TASK-ES-522 생성기 표지) ---- */

  async function ensureUserRow(userId, username, displayName, extra){
    var found = null;
    try {
      found = await L.sb.from('users').select('*').eq('id', userId).maybeSingle();
      if(found && found.data) return { row: found.data, isNew: false };
    } catch(e){}
    // 로컬 백업 확인: 기존에 편집된 프로필이 있다면 그 값을 기본값으로 보존 (데이터 유실 원천 방어)
    var localProf = null;
    try {
      localProf = JSON.parse(localStorage.getItem('ourgoal_profile_backup_' + userId) || 'null');
    } catch(e){}
    var rawName = (localProf && localProf.displayName) || displayName;
    var finalDisplayName = rawName;
    if(!localProf && rawName){
      finalDisplayName = await resolveUniqueDisplayName(rawName, userId);
    }
    var row = {
      id: userId,
      username: username,
      display_name: finalDisplayName,
      bio: (localProf && localProf.bio) || null,
      avatar_url: (extra && extra.avatar_url) || (localProf && localProf.avatarUrl) || null,
      interests: (localProf && localProf.interests) || [],
      region: (localProf && localProf.region) || null,
      region_public: localProf ? !!localProf.regionPublic : false
    };
    try {
      await L.sb.from('users').upsert(row);
    } catch(e){}
    return { row: row, isNew: !localProf };
  }
  /* ---- 이전 전 index.html 3608~3818줄(#TASK-ES-522 생성기 표지) ---- */

  async function loadProfile(userId, username, newUserExtra, provider){
    var safeUsername = String(username || (newUserExtra && newUserExtra.display_name) || userId || 'user').trim();
    var defaultDisplayName = (newUserExtra && newUserExtra.display_name) || (safeUsername.indexOf('@') !== -1 ? safeUsername.split('@')[0] : safeUsername);
    var ures = await ensureUserRow(userId, safeUsername, defaultDisplayName, newUserExtra);
    var urow = ures.row || {};
    var goalsRes = await L.sb.from('goals').select('*').eq('user_id', userId).order('created_at', {ascending:true});
    var recsRes = await L.sb.from('checkins').select('*').eq('user_id', userId).order('start_at', {ascending:false});
    var goals = (goalsRes.data||[]).filter(function(g){ return !g.deleted_at; }).map(function(g){
      if(g.visibility === 'followers') g.visibility = 'team';
      return {
        id:g.id, title:g.title, category:g.category, dueDate:g.due_date, createdAt:g.created_at,
        visibility: g.visibility||'private', topic: g.topic||'', archivedAt: g.archived_at||null,
        result: g.result||null, milestones: g.milestones||[]
      };
    });
    // Supabase 일시 지연 또는 조회 실패 시 로컬 백업 자동 복구 (목표 증발 방지 및 자가 복구)
    var localCachedGoals = [];
    try {
      localCachedGoals = JSON.parse(localStorage.getItem('ourgoal_goals_backup_' + userId) || '[]');
      if(localCachedGoals && localCachedGoals.length > 0){
        localCachedGoals.forEach(function(g){
          if(g && g.visibility === 'followers') g.visibility = 'team';
        });
      }
    } catch(e){}
    if((!goals || goals.length === 0) && localCachedGoals && localCachedGoals.length > 0){
      goals = localCachedGoals;
      try {
        await L.sb.from('goals').upsert(goals.map(function(g){
          return {
            id:g.id, user_id:userId, title:g.title, category:g.category||null, due_date:g.dueDate||null,
            visibility:g.visibility||'private', topic:g.topic||null, archived_at:g.archivedAt||null,
            result:g.result||null, milestones:g.milestones||[]
          };
        }));
      } catch(e){}
    } else if(goals && goals.length > 0){
      try { localStorage.setItem('ourgoal_goals_backup_' + userId, JSON.stringify(goals)); } catch(e){}
    }

    var records = (recsRes.data||[]).filter(function(r){ return !r.deleted_at; }).map(function(r){
      var rec = {
        id:r.id, type:r.type, text:r.text, startAt:r.start_at, endAt:r.end_at, createdAt:r.created_at,
        category: r.category || null,
        theme: r.theme || (typeof L.classifyRecordTheme === 'function' ? L.classifyRecordTheme(r.text, r.category).theme : 'daily'),
        subTheme: r.sub_theme || null,
        themeConfidence: r.theme_confidence || null
      };
      /* [#TASK-ES-344] meta(jsonb)에 보존한 goalId·laps·durationMs 등을 기록 객체로 풀어 넣는다 */
      return window.OurgoalRecordLedger.applyRecordMeta(rec, r.meta);
    });

    // 기록 로컬 백업 자동 복구 및 자가 치유 안전망 (#TASK-ES-035)
    /* [#TASK-ES-365] CORE-09: 이 uid 의 백업만 읽는다. 예전에는 자기 백업이 비면 이 기기의 다른 사람 백업(ourgoal_records_backup_<다른 uid>)을
       골라 새 계정 화면에 띄우고 서버에도 올렸다(RA-CORE-SWITCH 실패 원인). 게스트 -> 회원 이관은 migrateGuestDataToUser 가 따로 한다. */
    var localCachedRecords = window.OurgoalAccountIsolation.readOwnCopy('ourgoal_records_backup_', userId, []);
    if(!Array.isArray(localCachedRecords)) localCachedRecords = [];
    /* [#TASK-ES-344] 마지막 기록을 지우면 saveProfile 이 백업을 갱신하지 않으므로(recs.length 0), 휴지통에 있는 기록은 로컬 백업 복구에서도 뺀다 */
    try {
      var trashedRecIds = window.OurgoalRecordLedger.trashRecordIds(JSON.parse(localStorage.getItem('ourgoal_trash_backup_' + userId) || '[]'));
      if(trashedRecIds.length && Array.isArray(localCachedRecords)){
        localCachedRecords = localCachedRecords.filter(function(r){ return !r || trashedRecIds.indexOf(String(r.id)) === -1; });
      }
    } catch(e){}
    if((!records || records.length === 0) && localCachedRecords && localCachedRecords.length > 0){
      records = window.OurgoalAccountIsolation.ownRecordsOnly(localCachedRecords, userId);
      try {
        if(records.length) await window.OurgoalRecordLedger.upsertCheckinRows(L.sb, records.map(function(r){
          return window.OurgoalRecordLedger.toCheckinRow(r, userId);
        }));
      } catch(e){}
    } else if(records && records.length > 0){
      try { localStorage.setItem('ourgoal_records_backup_' + userId, JSON.stringify(records)); } catch(e){}
    }

    // 프로필 편집 내역(소개, 관심사, 지역, 잇템) 로컬 백업 복원 및 무결성 보장 (#TASK-ES-035)
    /* [#TASK-ES-365] 프로필 백업도 이 uid 것만 — 다른 사람의 소개·관심·지역·잇템을 새 계정에 붙이지 않는다 */
    var localCachedProf = window.OurgoalAccountIsolation.readOwnCopy('ourgoal_profile_backup_', userId, null);
    var finalDisplayName = urow.display_name || (localCachedProf && localCachedProf.displayName) || defaultDisplayName;
    var finalBio = urow.bio || (localCachedProf && localCachedProf.bio) || '';
    var finalAvatarUrl = urow.avatar_url || (localCachedProf && localCachedProf.avatarUrl) || '';
    var finalInterests = (urow.interests && urow.interests.length) ? urow.interests : ((localCachedProf && localCachedProf.interests) || []);
    var finalRegion = urow.region || (localCachedProf && localCachedProf.region) || '';
    var finalRegionPublic = (typeof urow.region_public !== 'undefined') ? !!urow.region_public : (localCachedProf ? !!localCachedProf.regionPublic : false);
    var finalItItems = (localCachedProf && localCachedProf.itItems) || [];

    if(finalBio || finalInterests.length || finalRegion || finalItItems.length){
      try {
        localStorage.setItem('ourgoal_profile_backup_' + userId, JSON.stringify({
          displayName: finalDisplayName, bio: finalBio, avatarUrl: finalAvatarUrl,
          interests: finalInterests, region: finalRegion, regionPublic: finalRegionPublic, itItems: finalItItems
        }));
      } catch(e){}
    }

    // 기존 데이터 존재 여부 정밀 판정: DB 목표, 기록 또는 로컬 백업이 있으면 절대 최초가입 온보딩으로 보내지 않는다
    var hasExistingData = (goals && goals.length > 0) || (records && records.length > 0) || (localCachedGoals && localCachedGoals.length > 0);
    if(localCachedRecords && localCachedRecords.length > 0) hasExistingData = true;
    var isActuallyNew = ures.isNew && !hasExistingData;

    if(isActuallyNew){
      L.track('signup', Object.assign({ method: provider || 'email' }, L.getAttribution()));
      L.track('signup_completed', Object.assign({ source: provider || 'email', day_index: 0 }, L.getAttribution()));
    }
    var settings = L.loadLocalSettings(userId); if(window.OurgoalAvatarParts && window.OurgoalAvatarParts.xp && window.OurgoalAvatarParts.xp.attachLedger) settings = window.OurgoalAvatarParts.xp.attachLedger(userId, settings); /* [#TASK-ES-421] EXP 서버 원장 붙이기(js/avatar/xp.js) */
    var dbSavedAvatars = Array.isArray(urow.saved_avatars) ? urow.saved_avatars : [];
    if(!settings.savedAvatars || settings.savedAvatars.length === 0){
      if(dbSavedAvatars.length > 0){
        settings.savedAvatars = dbSavedAvatars;
      } else {
        var localSavedBackup = null;
        try { localSavedBackup = JSON.parse(localStorage.getItem('ourgoal_saved_avatars_backup_' + userId) || 'null'); } catch(e){}
        if(Array.isArray(localSavedBackup) && localSavedBackup.length > 0){
          settings.savedAvatars = localSavedBackup;
        }
      }
    } else if(dbSavedAvatars.length > 0){
      var aMap = {};
      settings.savedAvatars.forEach(function(a){ if(a && (a.id || a.url)) aMap[a.id || a.url] = true; });
      dbSavedAvatars.forEach(function(da){
        if(da && (da.id || da.url) && !aMap[da.id || da.url]){
          settings.savedAvatars.push(da);
          aMap[da.id || da.url] = true;
        }
      });
      if(settings.savedAvatars.length > 10) settings.savedAvatars = settings.savedAvatars.slice(0, 10);
    }
    if(!settings.customAvatarUrl && finalAvatarUrl && (finalAvatarUrl.indexOf('data:image') === 0 || finalAvatarUrl.indexOf('http') === 0)){
      settings.customAvatarUrl = finalAvatarUrl; if(!settings.avatarType || settings.avatarType === 'robot') settings.avatarType = 'custom';
    }
    L.saveLocalSettings(userId, settings);
    if(hasExistingData && !settings.hasSeenGuide){ settings.hasSeenGuide = true; L.saveLocalSettings(userId, settings);
    }
    if(settings && settings.proTemplateRecords){
      records.forEach(function(rec){
        if(settings.proTemplateRecords[rec.id]){
          var cached = settings.proTemplateRecords[rec.id];
          rec.type = 'template';
          rec.templateId = cached.templateId;
          rec.templateKey = cached.templateKey;
          rec.templateTitle = cached.templateTitle;
          rec.columns = cached.columns;
          rec.rows = cached.rows;
          rec.memo = cached.memo;
          rec.linkedScheduleId = cached.linkedScheduleId;
          rec.photo = cached.photo;
        }
      });
    }

    // 서버 관리자 엔드포인트(/api/track)를 통한 비인증 RLS 차단 우회 및 이전 기록 복원 (#TASK-ES-036)
    if(!records || records.length === 0){
      try {
        /* [#TASK-ES-365] 이 기기의 다른 사람 uid(직전 사용자·다른 백업 키)를 서버에 보내지 않는다. 서버도 인증 uid 로만 조회한다(api/track.js handleSyncRecords) */
        var syncCandIds = [userId];
        var sToken = await L.getSupabaseAuthToken();
        if (sToken) {
          var sRes = await fetch('/api/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + sToken
            },
            body: JSON.stringify({ action: 'sync_records', userId: userId, username: safeUsername, displayName: finalDisplayName, backupIds: syncCandIds })
          });
          if(sRes.ok){
            var sData = await sRes.json();
            if(sData && sData.records && sData.records.length > 0 && window.OurgoalAccountIsolation.isResponseForUid(sData.targetUserId, userId)){
              records = sData.records;
              try { localStorage.setItem('ourgoal_records_backup_' + userId, JSON.stringify(records)); } catch(e){}
              if(sData.user){
                if(!finalBio && sData.user.bio) finalBio = sData.user.bio;
                if((!finalInterests || finalInterests.length === 0) && sData.user.interests) finalInterests = sData.user.interests;
                if(!finalRegion && sData.user.region) finalRegion = sData.user.region;
              }
            }
          }
        }
      } catch(syncErr){}
    }

    // 동반자(companions) 로컬 백업 자동 복구 및 자가 치유 (#TASK-ES-144)
    /* [#TASK-ES-365] 동반자 백업도 이 uid 것만 — 다른 사람의 동반자 목록을 새 계정에 붙이지 않는다 */
    var localCachedCompanions = window.OurgoalAccountIsolation.readOwnCopy('ourgoal_companions_backup_', userId, []);
    var finalCompanions = (Array.isArray(localCachedCompanions) && localCachedCompanions.length > 0) ? localCachedCompanions : [];
    var localCachedTrash = [];
    try { localCachedTrash = JSON.parse(localStorage.getItem('ourgoal_trash_backup_' + userId) || '[]'); } catch(e){}
    var dbTrash = Array.isArray(urow.trash) ? urow.trash : [];
    var finalTrash = (dbTrash && dbTrash.length > 0) ? dbTrash : localCachedTrash;

    // 캘린더 일자별 배경 사진 복원 (#TASK-ES-153)
    var localCalDayBg = {};
    try {
      localCalDayBg = JSON.parse(localStorage.getItem('ourgoal_cal_day_bg_' + userId) || '{}');
      if(!localCalDayBg || typeof localCalDayBg !== 'object') localCalDayBg = {};
    } catch(e){}
    if(Object.keys(localCalDayBg).length === 0 && localCachedProf && localCachedProf.calendarDayBackgrounds){
      localCalDayBg = localCachedProf.calendarDayBackgrounds;
    }

    return {
      id: userId, username: safeUsername, displayName: finalDisplayName,
      bio: finalBio, avatarUrl: finalAvatarUrl, interests: finalInterests,
      region: finalRegion, regionPublic: finalRegionPublic, itItems: finalItItems,
      goals: goals, records: records, settings: settings,
      companions: finalCompanions,
      calendarDayBackgrounds: localCalDayBg,
      _isNewSignup: isActuallyNew
    };
  }

  K.totalCompletedMilestones = totalCompletedMilestones;
  K.resolveUniqueDisplayName = resolveUniqueDisplayName;
  K.formatDisplayNameWithTag = formatDisplayNameWithTag;
  K.ensureUserRow = ensureUserRow;
  K.loadProfile = loadProfile;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
