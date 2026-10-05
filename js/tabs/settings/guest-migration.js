/**
 * OurGoal Guest Migration (설정 탭 — 게스트 기록을 계정으로 합치기)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   migrateGuestDataToUser — 「[#TASK-ES-224] [생각 메모장 94번] 카카오/소셜/일반 로그인 시」(이전 전 5658~5870줄)
 * 로그인 때 둘러보기(게스트) 기록을 계정 기록과 합집합으로 합쳐 서버에 올린다.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  async function migrateGuestDataToUser(targetUserId, targetProfile){
    if(!targetUserId || !targetProfile) return false;
    var rawGuest = null;
    try {
      rawGuest = localStorage.getItem('ourgoal_guest_profile');
    } catch(e){}
    if(!rawGuest) return false;

    var gData = null;
    try {
      gData = JSON.parse(rawGuest);
    } catch(e){ return false; }

    if(!gData || gData.id === targetUserId) return false;
    /* [#TASK-ES-365] 이 키는 로그인 사용자의 전체 사본으로도 쓰인다(saveProfile). 게스트가 만든 사본만 이관하고,
       다른 로그인 사용자의 사본이면 새 계정으로 옮기지 않고 버린다(계정 전환 유출·오염 차단) */
    if(!window.OurgoalAccountIsolation.canMigrateGuestCopy(gData, targetUserId)){
      window.OurgoalAccountIsolation.dropForeignSessionCopy(targetUserId);
      return false;
    }

    var hasGuestData = (Array.isArray(gData.goals) && gData.goals.length > 0) ||
                       (Array.isArray(gData.records) && gData.records.length > 0) ||
                       (gData.settings && (gData.settings.customAvatarUrl || gData.settings.avatarType === 'custom' || (Array.isArray(gData.settings.savedAvatars) && gData.settings.savedAvatars.length > 0) || gData.settings.googleCalendarConnected)) ||
                       (gData.avatarUrl && gData.avatarUrl.indexOf('data:image') === 0);

    if(!hasGuestData) return false;

    var guestMigrated = false;

    // 1. 설정 및 아바타 병합
    targetProfile.settings = targetProfile.settings || {};
    if(L.state.profile) L.state.profile.settings = L.state.profile.settings || targetProfile.settings;
    if(gData.settings){
      // [#TASK-ES-265] 구글 캘린더 연동 정보 및 토큰 완전 이관
      if(gData.settings.googleCalendarConnected){
        targetProfile.settings.googleCalendarConnected = true;
        if(L.state.profile && L.state.profile.settings) L.state.profile.settings.googleCalendarConnected = true;
        if(gData.settings.googleCalendarEmail){
          targetProfile.settings.googleCalendarEmail = gData.settings.googleCalendarEmail;
          if(L.state.profile && L.state.profile.settings) L.state.profile.settings.googleCalendarEmail = gData.settings.googleCalendarEmail;
        }
        if(gData.settings.gcalClientId){
          targetProfile.settings.gcalClientId = gData.settings.gcalClientId;
          if(L.state.profile && L.state.profile.settings) L.state.profile.settings.gcalClientId = gData.settings.gcalClientId;
        }
        if(gData.settings.gcalSync){
          targetProfile.settings.gcalSync = Object.assign(targetProfile.settings.gcalSync || {}, gData.settings.gcalSync);
          if(L.state.profile && L.state.profile.settings) L.state.profile.settings.gcalSync = targetProfile.settings.gcalSync;
        }
        if(Array.isArray(gData.settings.customSchedules) && gData.settings.customSchedules.length){
          targetProfile.settings.customSchedules = targetProfile.settings.customSchedules || [];
          var csMap = {};
          targetProfile.settings.customSchedules.forEach(function(cs){ if(cs && cs.id) csMap[cs.id] = true; });
          gData.settings.customSchedules.forEach(function(cs){ if(cs && cs.id && !csMap[cs.id]) targetProfile.settings.customSchedules.push(cs); });
          if(L.state.profile && L.state.profile.settings) L.state.profile.settings.customSchedules = targetProfile.settings.customSchedules;
        }
        // [#TASK-ES-345 CAL-02] 유지하는 유일한 예외 경로: 게스트 -> 회원 1회 이전.
        // 이 기기에서 게스트로 구글 캘린더를 연결한 사람이 곧바로 가입·로그인한 경우(같은 사람)에 다시 연결을 강요하지 않기 위해,
        // 이 기기 게스트 프로필의 uid 키(ourgoal_gcal_token_v1_<게스트 id>, 프로필이 없던 때의 ourgoal_gcal_token_v1_guest)만
        // 새 uid 키로 옮긴다. _last 키는 읽지 않고, 새 uid 에 이미 자기 토큰이 있으면 덮어쓰지 않으며,
        // 옮긴 직후 게스트 키를 지워 다음 계정이 같은 토큰을 다시 받지 못하게 한다.
        try {
          var guestTokKeys = ['ourgoal_gcal_token_v1_guest'];
          if(gData.id && String(gData.id).indexOf('guest') === 0) guestTokKeys.unshift('ourgoal_gcal_token_v1_' + gData.id);
          for(var gti = 0; gti < guestTokKeys.length; gti++){
            var gTok = localStorage.getItem(guestTokKeys[gti]);
            if(!gTok || targetUserId === 'guest') continue;
            if(!localStorage.getItem('ourgoal_gcal_token_v1_' + targetUserId)){
              var gTokObj = JSON.parse(gTok);
              if(gTokObj && gTokObj.accessToken){
                gTokObj.ownerUid = targetUserId;
                localStorage.setItem('ourgoal_gcal_token_v1_' + targetUserId, JSON.stringify(gTokObj));
              }
            }
            localStorage.removeItem(guestTokKeys[gti]);
          }
          L.purgeLegacySharedGcalKeys();
        } catch(tErr){}
        guestMigrated = true;
      }
      var guestSaved = Array.isArray(gData.settings.savedAvatars) ? gData.settings.savedAvatars : [];
      if(guestSaved.length > 0){
        var socialSaved = targetProfile.settings.savedAvatars || [];
        if(!socialSaved || socialSaved.length === 0){
          targetProfile.settings.savedAvatars = gData.settings.savedAvatars.slice(0, 10);
          if(L.state.profile && L.state.profile.settings){
            if(gData.settings.savedAvatars) L.state.profile.settings.savedAvatars = gData.settings.savedAvatars;
          }
        } else {
          var sMap = {};
          socialSaved.forEach(function(a){ if(a && (a.id || a.url)) sMap[a.id || a.url] = true; });
          guestSaved.forEach(function(ga){
            if(ga && (ga.id || ga.url) && !sMap[ga.id || ga.url]){
              socialSaved.push(ga);
              sMap[ga.id || ga.url] = true;
            }
          });
          if(socialSaved.length > 10) socialSaved = socialSaved.slice(0, 10);
          targetProfile.settings.savedAvatars = socialSaved;
          if(L.state.profile){
            L.state.profile.settings = L.state.profile.settings || {};
            L.state.profile.settings.savedAvatars = socialSaved;
          }
        }
        guestMigrated = true;
      }
      if(gData.settings.customAvatarUrl && (!targetProfile.settings.customAvatarUrl || targetProfile.settings.avatarType !== 'custom')){
        if(L.state.profile){
          L.state.profile.settings = L.state.profile.settings || {};
          L.state.profile.settings.avatarType = gData.settings.avatarType || 'custom';
          L.state.profile.settings.customAvatarUrl = gData.settings.customAvatarUrl;
          L.state.profile.avatarUrl = gData.settings.customAvatarUrl;
        }
        targetProfile.settings.avatarType = gData.settings.avatarType || 'custom';
        targetProfile.settings.customAvatarUrl = gData.settings.customAvatarUrl;
        if(gData.settings.avatarThemeId) targetProfile.settings.avatarThemeId = gData.settings.avatarThemeId;
        if(gData.settings.avatarCraftCount) targetProfile.settings.avatarCraftCount = gData.settings.avatarCraftCount;
        targetProfile.avatarUrl = gData.settings.customAvatarUrl;
        guestMigrated = true;
      }
    } else if(gData.avatarUrl && !targetProfile.avatarUrl){
      if(L.state.profile) L.state.profile.avatarUrl = gData.avatarUrl;
      targetProfile.avatarUrl = gData.avatarUrl;
      guestMigrated = true;
    }

    // 2. 목표 비파괴 합집합(Union Merge) 이관
    if(Array.isArray(gData.goals) && gData.goals.length > 0){
      targetProfile.goals = targetProfile.goals || [];
      var existingGoalIds = new Set(targetProfile.goals.map(function(eg){ return eg.id; }));
      var goalsToMerge = [];
      gData.goals.forEach(function(g){
        if(!existingGoalIds.has(g.id)){
          var cloned = JSON.parse(JSON.stringify(g));
          cloned.user_id = targetUserId;
          targetProfile.goals.push(cloned);
          goalsToMerge.push(cloned);
          guestMigrated = true;
        }
      });

      if(goalsToMerge.length > 0 && window.sb && typeof L.isValidRealUser === 'function' && L.isValidRealUser(targetUserId)){
        try {
          var goalsPayload = goalsToMerge.map(function(g){
            return {
              id: g.id,
              user_id: targetUserId,
              title: g.title,
              category: g.category || null,
              due_date: g.dueDate || null,
              visibility: g.visibility || 'private',
              topic: g.topic || null,
              archived_at: g.archivedAt || null,
              result: g.result || null,
              milestones: g.milestones || []
            };
          });
          await L.sb.from('goals').upsert(goalsPayload);
        } catch(sbGErr){ console.warn('[migrateGuest] goals upsert fallback:', sbGErr); }
      }
    }

    // 3. 기록 비파괴 합집합(Union Merge) 이관
    if(Array.isArray(gData.records) && gData.records.length > 0){
      targetProfile.records = targetProfile.records || [];
      var existingRecIds = new Set(targetProfile.records.map(function(er){ return er.id; }));
      var recsToMerge = [];
      gData.records.forEach(function(r){
        if(!existingRecIds.has(r.id)){
          var clonedR = JSON.parse(JSON.stringify(r));
          clonedR.user_id = targetUserId;
          targetProfile.records.push(clonedR);
          recsToMerge.push(clonedR);
          guestMigrated = true;
        }
      });

      if(recsToMerge.length > 0 && window.sb && typeof L.isValidRealUser === 'function' && L.isValidRealUser(targetUserId)){
        try {
          var recsPayload = recsToMerge.map(function(r){
            return {
              id: r.id,
              user_id: targetUserId,
              type: r.type || 'note',
              text: r.text || r.content || '',
              start_at: r.startAt || r.start_at || new Date().toISOString(),
              end_at: r.endAt || r.end_at || r.startAt || new Date().toISOString(),
              category: r.category || null,
              theme: r.theme || 'daily',
              sub_theme: r.subTheme || null
            };
          });
          await L.sb.from('checkins').upsert(recsPayload);
        } catch(sbRErr){ console.warn('[migrateGuest] checkins upsert fallback:', sbRErr); }
      }
    }

    // 4. 로컬 스토리지 삼중 백업 갱신
    try {
      if(targetProfile.goals) localStorage.setItem('ourgoal_goals_backup_' + targetUserId, JSON.stringify(targetProfile.goals));
      if(targetProfile.records) localStorage.setItem('ourgoal_records_backup_' + targetUserId, JSON.stringify(targetProfile.records));
      if(targetProfile.settings) localStorage.setItem('ourgoal_settings_' + targetUserId, JSON.stringify(targetProfile.settings));
    } catch(bkErr){}

    if(guestMigrated){
      if(typeof L.saveProfile === 'function') await L.saveProfile();
      try { localStorage.removeItem('ourgoal_guest_profile'); } catch(e){}
      L.toast('게스트 모드에서 작성한 목표와 실천 기록이 안전하게 연동되었어요! 🎉');
    }

    return guestMigrated;
  }

  K.migrateGuestDataToUser = migrateGuestDataToUser;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
