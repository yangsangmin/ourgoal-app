/**
 * OurGoal App Enter (기관 — 앱 진입·포커스/가시성 복귀·원격 로그아웃 감지·온라인/오프라인 알림)
 *
 * 「Enter app」 묶음: 앱 화면 진입(enterApp)과 로드 중 등록 문 여섯 개 — 창 포커스 복귀(bindFocusResync)·탭 가시성 복귀(bindVisibilityResync)·다른 탭 원격 로그아웃 신호(bindRemoteLogoutStorageListener)·15초 원격 로그아웃 확인(startRemoteSessionPoll)·온라인 복귀 동기화(bindOnlineSync)·오프라인 안내(bindOfflineNotice). 등록 문은 index.html 원래 자리에서 부른다.
 * #TASK-ES-548(인라인 3단계 구역 Z5 표준 2): index.html 인라인 IIFE 의 구간(이전 전 4762~4835 · 4836~4848 · 4849~4861 · 4862~4870 · 4871~4876 · 4877~4884 · 4885~4889줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4762~4835줄(#TASK-ES-548 생성기 표지) ---- */
  /* ============ Enter app ============ */
  async function enterApp(){
    var settings = (L.state.profile && L.state.profile.settings) || {};
    if(settings.twoFactorAuth && settings.twoFactorPin && sessionStorage.getItem('ourgoal_2fa_verified') !== 'true'){
      if(typeof L.challengeTwoFactorModal === 'function'){
        L.challengeTwoFactorModal(function(){
          enterApp();
        });
        return;
      }
    }
    if(typeof L.restoreGoogleToken === 'function') L.restoreGoogleToken();
    document.getElementById('authScreen').style.display = 'none';
    var shell = document.getElementById('appShell');
    shell.classList.add('active');
    document.getElementById('topUserName').textContent = L.state.profile.displayName;
    document.getElementById('homeGreeting').textContent = L.state.profile.displayName + '님, 안녕하세요';
    L.renderProBadge();
    await L.checkStreakFreeze();
    L.renderAll();
    try{ L.updateAppBadge(L.computeStreakDays()); }catch(e){}
    L.setupNotifyTimer();
    if(L.state.profile.settings.notify) L.syncPushSubscription();
    L.setupRealtimeChannelsOnce();
    await L.ensureFeedPostsLoaded();
    L.checkSocialNotifications();
    try {
      if(typeof L.loadSharedGroups === 'function') L.loadSharedGroups();
    } catch(sgErr){}
    // #TASK-ES-165: 앱 진입 시 화면 절반 크기 아바타 인사 팝업
    try {
      setTimeout(function(){
        L.openAvatarGreetingPopup(L.state.profile, false);
      }, 150);
    } catch(greetErr){}
    try {
      if(window.OurgoalTeamInviteComm && L.state.profile && L.state.profile.id && String(L.state.profile.id).indexOf('guest') !== 0){
        if(typeof window.OurgoalTeamInviteComm.initIncomingDmListener === 'function'){
          window.OurgoalTeamInviteComm.initIncomingDmListener(L.state.profile.id);
        }
      }
    } catch(commErr){}
    try {
      if(typeof L.updateTopNotifBadge === 'function') L.updateTopNotifBadge();
    } catch(nbErr){}
    try {
      if(typeof L.syncLockScreenLiveCard === 'function') L.syncLockScreenLiveCard(false);
    } catch(lsErr){}
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var qAction = urlParams.get('action');
      var qTab = urlParams.get('tab');
      if(qAction === 'checkin'){
        setTimeout(function(){
          var capInput = document.getElementById('captureInput');
          if(capInput){
            capInput.focus();
            capInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if(typeof L.openRecordModal === 'function'){
            L.openRecordModal();
          }
        }, 400);
      } else if(qTab === 'calendar'){
        setTimeout(function(){
          if(typeof L.setTab === 'function') L.setTab('calendar');
        }, 200);
      }
    } catch(actErr){}
    try {
      if(typeof L.renderFirstCheckinTutorialBanner === 'function'){
        L.renderFirstCheckinTutorialBanner();
      }
    } catch(tutErr){}
  }
  /* ---- 이전 전 index.html 4836~4848줄(#TASK-ES-548 생성기 표지) ---- */
  function bindFocusResync() { /* [#TASK-ES-548] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  /* PWA 실시간 배지 동기화 및 원격 세션 검사 — 앱 포커스 복귀 및 탭 가시성 전환 시 (TASK-BG-6, Req 1) */
  window.addEventListener('focus', function(){
    if(L.state.profile && L.state.profile.records){
      try{ L.updateAppBadge(L.computeStreakDays()); }catch(e){}
      L.checkRemoteSessionRevoked();
    }
    if(L.state.profile && L.state.profile.id && String(L.state.profile.id).indexOf('guest') !== 0 && window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.initIncomingDmListener === 'function'){
      try{ window.OurgoalTeamInviteComm.initIncomingDmListener(L.state.profile.id); }catch(e){}
    }
    try{ if(typeof L.updateTopNotifBadge === 'function') L.updateTopNotifBadge(); }catch(e){}
    try{ if(typeof L.syncLockScreenLiveCard === 'function') L.syncLockScreenLiveCard(false); }catch(e){}
  });
  } /* bindFocusResync */
  /* ---- 이전 전 index.html 4849~4861줄(#TASK-ES-548 생성기 표지) ---- */
  function bindVisibilityResync() { /* [#TASK-ES-548] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden && L.state.profile && L.state.profile.records){
      try{ L.updateAppBadge(L.computeStreakDays()); }catch(e){}
      L.checkRemoteSessionRevoked();
    }
    if(!document.hidden && L.state.profile && L.state.profile.id && String(L.state.profile.id).indexOf('guest') !== 0 && window.OurgoalTeamInviteComm && typeof window.OurgoalTeamInviteComm.initIncomingDmListener === 'function'){
      try{ window.OurgoalTeamInviteComm.initIncomingDmListener(L.state.profile.id); }catch(e){}
    }
    if(!document.hidden){
      try{ if(typeof L.updateTopNotifBadge === 'function') L.updateTopNotifBadge(); }catch(e){}
      try{ if(typeof L.syncLockScreenLiveCard === 'function') L.syncLockScreenLiveCard(false); }catch(e){}
    }
  });
  } /* bindVisibilityResync */
  /* ---- 이전 전 index.html 4862~4870줄(#TASK-ES-548 생성기 표지) ---- */
  function bindRemoteLogoutStorageListener() { /* [#TASK-ES-548] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.addEventListener('storage', function(e){
    if(e.key === 'ourgoal_remote_logout_trigger' && e.newValue){
      var parts = e.newValue.split('_');
      var keptDev = parts.slice(1).join('_');
      if(keptDev && keptDev !== L.getDeviceId()){
        L.performLogout('다른 기기에서 모든 기기 원격 로그아웃이 실행되어 로그아웃되었습니다.');
      }
    }
  });
  } /* bindRemoteLogoutStorageListener */
  /* ---- 이전 전 index.html 4871~4876줄(#TASK-ES-548 생성기 표지) ---- */
  function startRemoteSessionPoll() { /* [#TASK-ES-548] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  // 15초 주기 백그라운드 원격 로그아웃 감지 폴백
  setInterval(function(){
    if(L.state.profile && L.state.profile.id){
      L.checkRemoteSessionRevoked();
    }
  }, 15000);
  } /* startRemoteSessionPoll */
  /* ---- 이전 전 index.html 4877~4884줄(#TASK-ES-548 생성기 표지) ---- */
  function bindOnlineSync() { /* [#TASK-ES-548] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  /* 오프라인 상태 감지 및 자동 동기화 배너 제어 (가상유저 요청 P5) */
  window.addEventListener('online', function(){
    var b = document.getElementById('offlineNoticeBanner');
    if(b) b.style.display = 'none';
    L.toast('온라인에 다시 연결되었어요. 오프라인 기록을 동기화합니다.');
    L.OfflineSyncManager.syncOnline(); /* [#TASK-ES-490] 처리기 없는 flush() 가 보내지도 않고 큐를 비우던 것 → 저장 성공 뒤에만 비움·실패 시 유지·재시도 */
  });
  } /* bindOnlineSync */
  /* ---- 이전 전 index.html 4885~4889줄(#TASK-ES-548 생성기 표지) ---- */
  function bindOfflineNotice() { /* [#TASK-ES-548] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  window.addEventListener('offline', function(){
    var b = document.getElementById('offlineNoticeBanner');
    if(b) b.style.display = 'block';
    L.toast('오프라인 모드로 전환되었어요. 작성한 기록은 로컬에 안전하게 보관됩니다.');
  });
  } /* bindOfflineNotice */

  K.enterApp = enterApp;
  K.bindFocusResync = bindFocusResync;
  K.bindVisibilityResync = bindVisibilityResync;
  K.bindRemoteLogoutStorageListener = bindRemoteLogoutStorageListener;
  K.startRemoteSessionPoll = startRemoteSessionPoll;
  K.bindOnlineSync = bindOnlineSync;
  K.bindOfflineNotice = bindOfflineNotice;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
