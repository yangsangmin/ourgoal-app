/**
 * OurGoal Google Calendar Token (기관 — 구글 캘린더 토큰·일정 캐시 계정 격리)
 *
 * 구글 캘린더 토큰·일정 캐시를 계정(uid)별로 나눠 두는 도우미(#TASK-ES-345 CAL-02 묶음).
 * #TASK-ES-471(인라인 어려움 기관 묶음 이전 1차): index.html 인라인 IIFE 의 구간(이전 전 3308~3308 · 3309~3313 · 3314~3316 · 3317~3319 · 3320~3331 · 3337~3350 · 3351~3353줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3308~3308줄(#TASK-ES-471 생성기 표지) ---- */
  var GCAL_LEGACY_SHARED_KEYS = ['ourgoal_gcal_token_v1_last', 'ourgoal_gcal_email_last', 'ourgoal_gcal_events', 'ourgoal_google_token'];
  /* ---- 이전 전 index.html 3309~3313줄(#TASK-ES-471 생성기 표지) ---- */
  function purgeLegacySharedGcalKeys(){
    try {
      for(var li = 0; li < GCAL_LEGACY_SHARED_KEYS.length; li++) localStorage.removeItem(GCAL_LEGACY_SHARED_KEYS[li]);
    } catch(e){}
  }
  /* ---- 이전 전 index.html 3314~3316줄(#TASK-ES-471 생성기 표지) ---- */
  function gcalCurrentUid(){
    return (L.state.profile && L.state.profile.id) || 'guest';
  }
  /* ---- 이전 전 index.html 3317~3319줄(#TASK-ES-471 생성기 표지) ---- */
  function gcalEventsKey(){
    return 'ourgoal_gcal_events_' + gcalCurrentUid();
  }
  /* ---- 이전 전 index.html 3320~3331줄(#TASK-ES-471 생성기 표지) ---- */
  // 메모리에 남은 토큰·일정 캐시가 다른 계정 것이면 버린다(로그아웃 없이 계정을 바꾼 경우 포함).
  function ensureGcalOwner(){
    var uid = gcalCurrentUid();
    if(L.state._gcalOwnerUid !== uid){
      L.state.googleToken = null;
      L.state._lastExpiredGoogleToken = null;
      L.state.gcalEventsCache = null;
      try { sessionStorage.removeItem('ourgoal_google_token'); } catch(e){}
      L.state._gcalOwnerUid = uid;
    }
    return uid;
  }

  /* ---- 이전 전 index.html 3337~3350줄(#TASK-ES-471 생성기 표지) ---- */
  function loadLocalSettings(userId){
    try{
      var raw = localStorage.getItem('ourgoal_settings_'+userId);
      var s = raw ? Object.assign(L.defaultSettings(), JSON.parse(raw)) : L.defaultSettings();
      // [#TASK-ES-345 CAL-02] 예전에는 연동 설정이 없으면 게스트·직전 사용자(ourgoal_current_user)·이메일 _last 에서
      // 구글 캘린더 연동 설정을 복사해 왔다(#TASK-ES-265). 다른 계정의 연동 정보를 새 계정에 붙이는 통로라 제거한다.
      // 게스트 -> 회원 전환은 migrateGuestDataToUser 가 명시적으로 처리한다.
      purgeLegacySharedGcalKeys();
      if(!s.privacy) s.privacy = { goals:"private", calendar:"private", records:"private", stats:"private" };
      if(!s.customSchedules) s.customSchedules = [];
      L.applyAppSettings(s);
      return s;
    } catch(e){ return L.defaultSettings(); }
  }
  /* ---- 이전 전 index.html 3351~3353줄(#TASK-ES-471 생성기 표지) ---- */
  function saveLocalSettings(userId, settings){
    try{ localStorage.setItem('ourgoal_settings_'+userId, JSON.stringify(settings)); L.applyAppSettings(settings); } catch(e){}
  }

  K.GCAL_LEGACY_SHARED_KEYS = GCAL_LEGACY_SHARED_KEYS;
  K.purgeLegacySharedGcalKeys = purgeLegacySharedGcalKeys;
  K.gcalCurrentUid = gcalCurrentUid;
  K.gcalEventsKey = gcalEventsKey;
  K.ensureGcalOwner = ensureGcalOwner;
  K.loadLocalSettings = loadLocalSettings;
  K.saveLocalSettings = saveLocalSettings;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
