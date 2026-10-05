/**
 * OurGoal Server Records Sync (기관 — 서버 관리자 API 를 통한 기록·프로필 복구)
 *
 * 「서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036)」 묶음: 로그인 세션 토큰으로 /api/track sync_records 를 불러 서버 기록을 이 기기 기록과 합치고 프로필 칸을 채운 뒤 홈을 다시 그린다(syncServerRecords).
 * #TASK-ES-522(인라인 3단계 Z1 로그인·계정 2차): index.html 인라인 IIFE 의 구간(이전 전 3891~4002줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3891~4002줄(#TASK-ES-522 생성기 표지) ---- */
  /* ============ 서버 관리자 API를 통한 기록 및 프로필 복구 (#TASK-ES-036) ============ */
  async function syncServerRecords(forceRefresh){
    if(!L.state.profile || !L.state.profile.id) return false;
    var uid = L.state.profile.id;
    var uname = L.state.profile.username || '';
    var dname = L.state.profile.displayName || '';

    /* [#TASK-ES-365] 현재 uid 만 보낸다(이 기기의 직전 사용자·다른 백업 uid 를 함께 보내던 것 제거) */
    var candidateIds = [uid];

    try {
      var sToken = await L.getSupabaseAuthToken();
      if (!sToken) return false;
      var resp = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sToken
        },
        body: JSON.stringify({
          action: 'sync_records',
          userId: uid,
          username: uname,
          displayName: dname || (L.state.profile && (L.state.profile.nickname || L.state.profile.displayName)) || '',
          nickname: (L.state.profile && (L.state.profile.nickname || L.state.profile.displayName)) || dname || '',
          backupIds: candidateIds,
          settingsToSave: (L.state.profile && L.state.profile.settings && L.state.profile.settings.googleCalendarConnected) ? {
            googleCalendarConnected: true,
            googleCalendarEmail: L.state.profile.settings.googleCalendarEmail || '',
            gcalClientId: L.state.profile.settings.gcalClientId || ''
          } : null
        })
      });
      if(!resp.ok) return false;
      var data = await resp.json();
      if(!data || !data.ok) return false;
      /* [#TASK-ES-365] 응답 주인이 다르거나, 기다리는 사이 로그아웃·계정 전환으로 화면 주인이 바뀌었으면 합치지 않는다 */
      if(!window.OurgoalAccountIsolation.isResponseForUid(data.targetUserId, uid)) return false;
      if(!L.state.profile || L.state.profile.id !== uid) return false;

      var updated = false;

      // [#TASK-ES-265] 서버 원장에서 구글 캘린더 연동 설정 복원
      if(data.settings && data.settings.googleCalendarConnected){
        L.state.profile.settings = L.state.profile.settings || {};
        if(!L.state.profile.settings.googleCalendarConnected){
          L.state.profile.settings.googleCalendarConnected = true;
          if(data.settings.googleCalendarEmail && !L.state.profile.settings.googleCalendarEmail){
            L.state.profile.settings.googleCalendarEmail = data.settings.googleCalendarEmail;
          }
          if(data.settings.gcalClientId && !L.state.profile.settings.gcalClientId){
            L.state.profile.settings.gcalClientId = data.settings.gcalClientId;
          }
          L.saveLocalSettings(uid, L.state.profile.settings);
          updated = true;
        }
      }

      /* [#TASK-ES-344] REC-01: 서버 기록으로 통째 교체하지 않고 id 기준으로 병합한다.
         - 로컬에만 있는 미동기화 기록은 보존, 휴지통으로 지운 기록은 서버에 남아 있어도 되살리지 않는다.
         - 로컬이 비어 있으면 서버 기록 전부가 들어와 기존 '빈 로컬 복구' 동작은 그대로다. */
      if(data.records && data.records.length > 0){
        var mergedRes = window.OurgoalRecordLedger.mergeServerRecords(L.state.profile.records || [], data.records, {
          deletedIds: window.OurgoalRecordLedger.trashRecordIds(L.getTrashList()),
          preferServer: !!forceRefresh
        });
        if(mergedRes.changed){
          L.state.profile.records = mergedRes.records;
          try {
            localStorage.setItem('ourgoal_records_backup_' + uid, JSON.stringify(mergedRes.records));
          } catch(e){}
          updated = true;
        }
      }

      var u = data.user || data.matchedUser;
      if(u){
        if(!L.state.profile.bio && u.bio){ L.state.profile.bio = u.bio; updated = true; }
        if((!L.state.profile.interests || L.state.profile.interests.length === 0) && u.interests && u.interests.length){
          L.state.profile.interests = u.interests;
          updated = true;
        }
        if(!L.state.profile.region && u.region){ L.state.profile.region = u.region; updated = true; }
        if(!L.state.profile.avatarUrl && u.avatar_url){ L.state.profile.avatarUrl = u.avatar_url; updated = true; }
        if(typeof u.region_public !== 'undefined'){ L.state.profile.regionPublic = !!u.region_public; }
        if(!L.state.profile.displayName && u.display_name){ L.state.profile.displayName = u.display_name; updated = true; }
        if(!L.state.profile.nickname && (u.display_name || u.username)){ L.state.profile.nickname = u.display_name || u.username; updated = true; }
      }

      if((!L.state.profile.goals || L.state.profile.goals.length === 0) && data.goals && data.goals.length > 0){
        L.state.profile.goals = data.goals;
        try {
          localStorage.setItem('ourgoal_goals_backup_' + uid, JSON.stringify(data.goals));
        } catch(e){}
        updated = true;
      }

      if(updated){
        try {
          localStorage.setItem('ourgoal_guest_profile', JSON.stringify(L.state.profile));
        } catch(e){}
        if(L.state.activeTab === 'records') L.renderRecordsScreen();
        else if(L.state.activeTab === 'home') L.renderHome(); /* [#TASK-ES-462] 없는 renderHomeScreen 을 부르던 것 → 실제 홈 렌더 함수 */
        else if(L.state.activeTab === 'calendar') L.renderCalendarScreen();
        else if(L.state.activeTab === 'settings') L.renderSettingsScreen();
      }
      return updated;
    } catch(err){
      console.warn('syncServerRecords failed:', err);
      return false;
    }
  }

  K.syncServerRecords = syncServerRecords;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
