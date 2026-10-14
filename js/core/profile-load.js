/**
 * OurGoal Profile Load (기관 — 프로필 불러오기·사용자 행 만들기·고유 닉네임 태그·완료 마일스톤 합)
 *
 * 「뱃지 컬렉션 (명예의 전당)」 묶음에 남아 있던 프로필 쪽: 로그인·다시 맞추기 때 서버·이 기기 백업에서 프로필을 불러와 합치기(loadProfile), 서버 users 행이 없으면 만들기(ensureUserRow), 동명이인 고유 태그 붙이기·표시(resolveUniqueDisplayName·formatDisplayNameWithTag), 완료 마일스톤 합(totalCompletedMilestones — smoke 시험지 FN_NAMES, 합본으로 찾는다).
 * 기본 프로필(defaultProfile — 함수 끝 줄에 노출 문이 붙어 있어 옮기면 그 줄이 잘린다)·앱 상태(state)·window 노출 줄은 원래 자리에 그대로 있다.
 * #TASK-ES-522(인라인 3단계 Z1 로그인·계정 2차): index.html 인라인 IIFE 의 구간(이전 전 3555~3559 · 3576~3603 · 3605~3617 · 3619~3650 · 3651~3861줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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
  var loadGeneration = 0;
  async function readForLoad(query){
    try { return await query; } catch(e){ return {data:null,error:{code:'READ_UNCONFIRMED'}}; }
  }
  function ownRows(res, uid){
    return !!res && !res.error && Array.isArray(res.data) && res.data.every(function(row){return row && row.id != null && row.user_id === uid;});
  }

  /* ---- 이전 전 index.html 3555~3559줄(#TASK-ES-522 생성기 표지) ---- */
  function totalCompletedMilestones(p){
    var n = 0;
    p.goals.forEach(function(g){ (g.milestones||[]).forEach(function(m){ if(m.status==='done') n++; }); });
    return n;
  }

  /* ---- 이전 전 index.html 3576~3603줄(#TASK-ES-522 생성기 표지) ---- */

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

  /* ---- 이전 전 index.html 3605~3617줄(#TASK-ES-522 생성기 표지) ---- */

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

  /* ---- 이전 전 index.html 3619~3650줄(#TASK-ES-522 생성기 표지) ---- */

  async function ensureUserRow(userId, username, displayName, extra, checkCurrent){
    var found = null;
    try {
      found = await L.sb.from('users').select('*').eq('id', userId).maybeSingle();
      if(found && !found.error && found.data && found.data.id === userId) return { row: found.data, isNew: false, readState:'read-accepted' };
    } catch(e){}
    if(checkCurrent) checkCurrent();
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
    if(checkCurrent) checkCurrent();
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
    // A failed/empty read cannot authorize overwriting a previously edited account.
    if(!found || found.error || found.data || localProf) return {row:row,isNew:false,readState:'unconfirmed'};
    try {
      var written = await L.sb.from('users').upsert(row).select();
      if(checkCurrent) checkCurrent();
      var confirmed = written && !written.error && Array.isArray(written.data) && written.data.length === 1 && written.data[0].id === userId;
      if(!confirmed) return {row:row,isNew:false,readState:'unconfirmed'};
    } catch(e){return {row:row,isNew:false,readState:'unconfirmed'};}
    return { row: row, isNew: !localProf, readState:'read-accepted' };
  }
  /* ---- 이전 전 index.html 3651~3861줄(#TASK-ES-522 생성기 표지) ---- */

  async function loadProfile(userId, username, newUserExtra, provider){
    var generation = ++loadGeneration, startingProfile = L.state && L.state.profile;
    var readPending=global.OurgoalCapabilities.request('storage.device.pending','core/profile-load'), pending=readPending(userId,localStorage);
    function currentLoad(){
      if(generation !== loadGeneration || L.state && L.state.profile !== startingProfile) throw new Error('profile-load-generation-changed');
      readPending(userId,localStorage,pending.source);
    }
    function entries(kind){return kind==='records'?pending.data.entries:pending.data.kindData && pending.data.kindData[kind] && pending.data.kindData[kind].entries || {};}
    function hasPending(kind){return Object.keys(entries(kind)).length>0;}
    function pendingRows(kind,rows,localRows){
      var changes=entries(kind), owned=window.OurgoalAccountIsolation.ownRecordsOnly(localRows || [],userId), byId=new Map(owned.map(function(r){return [String(r.id),r];}));
      var next=rows.filter(function(row){return !Object.prototype.hasOwnProperty.call(changes,String(row.id));});
      Object.keys(changes).forEach(function(id){
        var row=byId.get(id), payload=changes[id].payload;
        if(!row) row=kind==='records'?window.OurgoalRecordLedger.fromCheckinRow(payload):{id:payload.id,title:payload.title,category:payload.category,dueDate:payload.due_date,visibility:payload.visibility,topic:payload.topic,archivedAt:payload.archived_at,result:payload.result,milestones:payload.milestones};
        next.push(row);
      });
      return next;
    }
    var safeUsername = String(username || (newUserExtra && newUserExtra.display_name) || userId || 'user').trim();
    var defaultDisplayName = (newUserExtra && newUserExtra.display_name) || (safeUsername.indexOf('@') !== -1 ? safeUsername.split('@')[0] : safeUsername);
    var ures = await ensureUserRow(userId, safeUsername, defaultDisplayName, newUserExtra, currentLoad);
    currentLoad();
    var urow = ures.row || {};
    if(hasPending('users')){
      urow=Object.assign({},urow,entries('users')[userId].payload);
      var pendingUserCopy=window.OurgoalAccountIsolation.readOwnCopy('ourgoal_profile_backup_',userId,null);
      if(pendingUserCopy) Object.assign(urow,{display_name:pendingUserCopy.displayName,bio:pendingUserCopy.bio,avatar_url:pendingUserCopy.avatarUrl,interests:pendingUserCopy.interests,region:pendingUserCopy.region,region_public:pendingUserCopy.regionPublic});
      ures.readState='unconfirmed';
    }
    var goalsRes = await readForLoad(L.sb.from('goals').select('*').eq('user_id', userId).order('created_at', {ascending:true}));
    currentLoad();
    var recsRes = await readForLoad(L.sb.from('checkins').select('*').eq('user_id', userId).order('start_at', {ascending:false}));
    currentLoad();
    var loadState = {users:{remote:ures.readState},goals:{remote:ownRows(goalsRes,userId)?'read-accepted':'unconfirmed'},records:{remote:ownRows(recsRes,userId)?'read-accepted':'unconfirmed'}};
    var goals = (ownRows(goalsRes,userId) ? goalsRes.data : []).filter(function(g){ return !g.deleted_at; }).map(function(g){
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
      goals = hasPending('goals')?pendingRows('goals',localCachedGoals,localCachedGoals):localCachedGoals;
      var heldGoals = window.OurgoalLocalKeep && window.OurgoalLocalKeep.preserveUnknown && window.OurgoalLocalKeep.preserveUnknown('goals',userId,goals);
      loadState.goals = {remote:'unconfirmed',reason:'existence-unknown',archiveVerified:!!(heldGoals && heldGoals.ok)};
    } else if(hasPending('goals')){
      goals=pendingRows('goals',goals,localCachedGoals);
      loadState.goals={remote:'unconfirmed',reason:'pending-change'};
    } else if(goals && goals.length > 0){
      /* [#TASK-ES-695] DIR-006 묶음 P0: 기기 백업을 서버 것으로 바꾸기 전에 기기에만 있는 목표를 보관 열쇠로 옮기고 직전 사본을 남긴다(js/core/local-keep.js).
         보관 · 직전 사본을 되읽어 확인하지 못하면 원래 백업을 그대로 둔다. 서버에는 아무것도 더 묻거나 올리지 않는다 */
      if(window.OurgoalLocalKeep && typeof window.OurgoalLocalKeep.commitServerGoals === 'function'){
        currentLoad();
        goals = window.OurgoalLocalKeep.commitServerGoals(userId, goals).goals;
      } else {
        try { localStorage.setItem('ourgoal_goals_backup_' + userId, JSON.stringify(goals)); } catch(e){}
      }
    }

    var records = (ownRows(recsRes,userId) ? recsRes.data : []).filter(function(r){ return !r.deleted_at; }).map(function(r){
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
      if(hasPending('records')) records=pendingRows('records',records,records);
      var heldRecords = window.OurgoalLocalKeep && window.OurgoalLocalKeep.preserveUnknown && window.OurgoalLocalKeep.preserveUnknown('records',userId,records);
      loadState.records = {remote:'unconfirmed',reason:'existence-unknown',archiveVerified:!!(heldRecords && heldRecords.ok)};
    } else if(hasPending('records')){
      records=window.OurgoalLocalKeep.planRecords(userId,records).next;
      records=pendingRows('records',records,localCachedRecords);
      loadState.records={remote:'unconfirmed',reason:'pending-change'};
    } else if(records && records.length > 0){
      /* [#TASK-ES-695] DIR-006 묶음 P0: 기기 백업을 서버 것으로 바꾸기 전에 (i) 서버가 주지 않는 칸(사진 · 피드백 · 에너지 · 집중 등)을 같은 계정 · 같은 id 의 기기 값에서 되붙이고
         (ii) 기기에만 있는 기록은 보관 열쇠로 옮기고 (iii) 직전 사본을 남긴다(js/core/local-keep.js). 되붙인 기록이 화면과 백업에 함께 쓰인다.
         보관 · 직전 사본을 되읽어 확인하지 못하면 원래 백업을 그대로 둔다. 서버에는 아무것도 더 묻거나 올리지 않는다 */
      if(window.OurgoalLocalKeep && typeof window.OurgoalLocalKeep.commitServerRecords === 'function'){
        currentLoad();
        records = window.OurgoalLocalKeep.commitServerRecords(userId, records).records;
      } else {
        try { localStorage.setItem('ourgoal_records_backup_' + userId, JSON.stringify(records)); } catch(e){}
      }
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

    if(!hasPending('users') && (finalBio || finalInterests.length || finalRegion || finalItItems.length)){
      currentLoad();
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
            currentLoad();
            if(sData && sData.records && sData.records.length > 0 && window.OurgoalAccountIsolation.isResponseForUid(sData.targetUserId, userId)){
              records = sData.records;
              /* [#TASK-ES-695] 이 자리도 기기 백업을 받은 것으로 바꾼다 — 같은 순서(보관 → 직전 사본 → 백업)를 지킨다 */
              if(window.OurgoalLocalKeep && typeof window.OurgoalLocalKeep.commitServerRecords === 'function'){
                records = window.OurgoalLocalKeep.commitServerRecords(userId, records).records;
              } else {
                try { localStorage.setItem('ourgoal_records_backup_' + userId, JSON.stringify(records)); } catch(e){}
              }
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

    currentLoad();
    if(loadState.goals.reason === 'existence-unknown' || loadState.records.reason === 'existence-unknown'){
      if(typeof L.toast === 'function') L.toast('기기에 남은 자료는 그대로 두었어요. 반영 여부는 아직 확인되지 않았어요.');
    }

    return {
      id: userId, username: safeUsername, displayName: finalDisplayName,
      bio: finalBio, avatarUrl: finalAvatarUrl, interests: finalInterests,
      region: finalRegion, regionPublic: finalRegionPublic, itItems: finalItItems,
      goals: goals, records: records, settings: settings,
      companions: finalCompanions,
      calendarDayBackgrounds: localCalDayBg,
      _saveLoadState: loadState,
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
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalUiHelpers;
  if (K) R.provide('core/profile-load', {
    ensureUserRow: K.ensureUserRow, formatDisplayNameWithTag: K.formatDisplayNameWithTag, loadProfile: K.loadProfile,
    resolveUniqueDisplayName: K.resolveUniqueDisplayName, totalCompletedMilestones: K.totalCompletedMilestones
  }, { window: [
    'formatDisplayNameWithTag', 'loadProfile', 'resolveUniqueDisplayName'
  ], windowOnly: [
    'formatDisplayNameWithTag', 'resolveUniqueDisplayName'
  ] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
