/**
 * OurGoal Device Session (설정 — 이 기기 식별·로그인 시각·로그아웃·원격 로그아웃 감지)
 *
 * 「디바이스 세션 & 원격 로그아웃 유틸 (Req 1)」 묶음 전체: 이 기기 id(getDeviceId)·로그인 시각 읽기/쓰기(getDeviceLoginTime·setDeviceLoginTime)·이 기기 로그아웃(performLogout)·다른 기기에서 실행한 원격 로그아웃 감지(checkRemoteSessionRevoked), 그리고 이메일 가입 단추 처리기 등록 문(bindSignupSubmit — index.html 원래 자리에서 부른다).
 * setDeviceLoginTime·performLogout 은 로그인한 뒤에만 도는 경로라 게스트 화면으로 잴 수 없다 — 테스트 계정 실계정 하네스(docs/design/harness/module-split/real-account-split-check.js)로 기준·작업을 읽기 전용으로 맞댔다(#TASK-ES-513 시범).
 * #TASK-ES-513(인라인 3단계 시범 — 게스트로 못 재는 묶음(실계정 하네스)): index.html 인라인 IIFE 의 구간(이전 전 4402~4414 · 4415~4420 · 4421~4427 · 4428~4447 · 4448~4486 · 4487~4512줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 4402~4414줄(#TASK-ES-513 생성기 표지) ---- */
  /* ============ 디바이스 세션 & 원격 로그아웃 유틸 (Req 1) ============ */
  function getDeviceId(){
    try{
      var id = localStorage.getItem('ourgoal_device_id');
      if(!id){
        id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('ourgoal_device_id', id);
      }
      return id;
    }catch(e){
      return 'dev_fallback';
    }
  }
  /* ---- 이전 전 index.html 4415~4420줄(#TASK-ES-513 생성기 표지) ---- */
  function getDeviceLoginTime(){
    try{
      var t = parseInt(sessionStorage.getItem('ourgoal_login_at') || localStorage.getItem('ourgoal_login_at') || '0', 10);
      return t || Date.now();
    }catch(e){ return Date.now(); }
  }
  /* ---- 이전 전 index.html 4421~4427줄(#TASK-ES-513 생성기 표지) ---- */
  function setDeviceLoginTime(ts){
    try{
      var val = String(ts || Date.now());
      sessionStorage.setItem('ourgoal_login_at', val);
      localStorage.setItem('ourgoal_login_at', val);
    }catch(e){}
  }
  /* ---- 이전 전 index.html 4428~4447줄(#TASK-ES-513 생성기 표지) ---- */
  async function performLogout(reasonMsg){
    try { L.updateAppBadge(0); } catch(e){} try { if(typeof L.removePushSubscription === 'function') await Promise.race([L.removePushSubscription(), new Promise(function(r){ setTimeout(r, 3000); })]); } catch(e){} /* #TASK-ES-399 로그아웃 전(세션 있을 때) 이 기기 푸시 구독을 서버에서 해제 — 남으면 로그아웃한 기기로 이전 사용자 알림이 온다. 서비스 워커가 없으면 3초 뒤 그대로 진행 */
    try { await L.sb.auth.signOut({ scope: 'local' }); } catch(e){} /* #TASK-ES-399 이 기기만 — 기본값 global 은 같은 계정의 다른 기기까지 끊는다. 다른 기기는 openLogoutOtherDevicesConfirmModal(others) */
    try { L.state.googleToken = null; sessionStorage.removeItem('ourgoal_google_token'); } catch(e){}
    try { if(window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch(e){}
    try {
      localStorage.removeItem('ourgoal_guest_profile');
      localStorage.removeItem('ourgoal_current_user');
      /* [#TASK-ES-365] 계정 공용 키(전체 사본·직전 사용자·uid 없는 오프라인 대기열)를 정리한다. uid 별 백업은 그 주인만 읽으므로 남긴다 */
      window.OurgoalAccountIsolation.clearSharedSessionCopies();
    } catch(e){}
    L.state.profile = null;
    var shell = document.getElementById('appShell');
    if(shell) shell.classList.remove('active');
    var authScreen = document.getElementById('authScreen');
    if(authScreen) authScreen.style.display = 'flex';
    if(typeof L.initRememberedAuthFields === 'function') L.initRememberedAuthFields();
    if(L.state.notifyTimer){ clearInterval(L.state.notifyTimer); L.state.notifyTimer = null; }
    if(reasonMsg) L.toast(reasonMsg);
  }
  /* ---- 이전 전 index.html 4448~4486줄(#TASK-ES-513 생성기 표지) ---- */
  async function checkRemoteSessionRevoked(){
    if(!L.state.profile || !L.state.profile.id) return false;
    try{
      var myDev = getDeviceId();
      var myLogin = getDeviceLoginTime();

      // 방금 로그인한 직후(60초 이내)에는 토큰 동기화 및 일시적 지연으로 인한 세션 튕김 오탐 방어
      if(Date.now() - myLogin < 60000) return false;

      // 1. Supabase Auth 사용자 세션 유효성 검사 (명백한 JWT 무효/만료·서버가 세션을 지운 'Auth session missing!'·401 일 때만 로그아웃 — #TASK-ES-399)
      var uRes = await L.sb.auth.getUser();
      if(uRes && uRes.error){
        var eMsg = String(uRes.error.message || '').toLowerCase();
        if(eMsg.indexOf('jwt') !== -1 || eMsg.indexOf('invalid') !== -1 || eMsg.indexOf('expired') !== -1 || eMsg.indexOf('session missing') !== -1 || Number(uRes.error.status) === 401){
          await performLogout('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
          return true;
        }
        return false;
      }

      // 2. Auth 메타데이터의 원격 로그아웃 타임스탬프 대조
      var meta = uRes && uRes.data && uRes.data.user && uRes.data.user.user_metadata;
      var remoteLogoutAt = meta && meta.remote_logout_at ? Number(meta.remote_logout_at) : 0;
      var keptDevId = (meta && meta.remote_logout_device_id) || '';
      if(remoteLogoutAt && remoteLogoutAt > myLogin && keptDevId !== myDev){
        await performLogout('다른 기기에서 모든 기기 원격 로그아웃이 실행되어 로그아웃되었습니다.');
        return true;
      }

      // 3. 프로필 설정의 타임스탬프 폴백 대조
      var sRemoteTs = L.state.profile.settings && L.state.profile.settings.remoteLogoutTimestamp;
      var sKeptDev = L.state.profile.settings && L.state.profile.settings.remoteLogoutDeviceId;
      if(sRemoteTs && Number(sRemoteTs) > myLogin && sKeptDev !== myDev){
        await performLogout('다른 기기에서 모든 기기 원격 로그아웃이 실행되어 로그아웃되었습니다.');
        return true;
      }
    }catch(e){}
    return false;
  }
  /* ---- 이전 전 index.html 4487~4512줄(#TASK-ES-513 생성기 표지) ---- */
  function bindSignupSubmit() { /* [#TASK-ES-513] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.getElementById('signupSubmit').addEventListener('click', async function(){
    var u = document.getElementById('suUser').value.trim();
    var name = document.getElementById('suName').value.trim();
    var p1 = document.getElementById('suPass').value;
    var p2 = document.getElementById('suPass2').value;
    var errEl = document.getElementById('signupError');
    errEl.textContent = '';
    if(!u || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)){ errEl.textContent = '아이디 자리에 이메일 주소를 입력해주세요.'; return; }
    if(!name){ errEl.textContent = '닉네임을 입력해주세요.'; return; }
    if(!p1 || p1.length<4){ errEl.textContent = '비밀번호는 4자 이상으로 입력해주세요.'; return; }
    if(p1!==p2){ errEl.textContent = '비밀번호가 서로 달라요.'; return; }

    var res = await L.sb.auth.signUp({ email: u, password: p1 });
    if(res.error){ errEl.textContent = res.error.message; return; }
    if(!res.data.session){ errEl.textContent = '가입 확인 메일을 보냈어요. 메일함에서 확인 후 로그인해주세요.'; return; }

    setDeviceLoginTime(Date.now());
    await L.ensureUserRow(res.data.user.id, u, name);
    L.track('signup', Object.assign({ method: 'email' }, L.getAttribution())); /* 즉시 세션 경로는 loadProfile을 거치지 않으므로 여기서 기록 */
    L.track('signup_completed', Object.assign({ source: 'email', day_index: 0 }, L.getAttribution()));
    L.state.profile = L.defaultProfile(res.data.user.id, u, name);
    await L.saveProfile();
    document.getElementById('authScreen').style.display = 'none';
    L.startOnboarding();
  });
  } /* bindSignupSubmit */

  K.getDeviceId = getDeviceId;
  K.getDeviceLoginTime = getDeviceLoginTime;
  K.setDeviceLoginTime = setDeviceLoginTime;
  K.performLogout = performLogout;
  K.checkRemoteSessionRevoked = checkRemoteSessionRevoked;
  K.bindSignupSubmit = bindSignupSubmit;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
