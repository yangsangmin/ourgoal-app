/**
 * OurGoal Social Login (설정 — 카카오 OAuth 시작·구글 로그인(토큰 클라이언트·One-Tap)·로그인 단추 처리기)
 *
 * 「소셜 로그인 (카카오 / 실제 구글 OAuth 연동)」 묶음: 카카오 OAuth 시작(startOAuthLogin — Supabase signInWithOAuth 로 카카오 동의 화면으로 넘어간다), 구글 로그인(startGoogleLogin·getGoogleTokenClient·initGoogleOneTap·handleGoogleUserSuccess·parseJwtPayload — 구글 단추는 #TASK-ES-108 카카오 단일화로 화면에서 숨겨져 있다), sha256Hex(이 묶음 안에서 부르는 곳 없음 — 그대로 옮김),
 * 랜딩·로그인 화면의 카카오·구글 단추 처리기 등록 문(bindKakaoLoginButtons·bindGoogleLoginButtons — index.html 원래 자리에서 부른다). 구글 토큰 클라이언트(_googleTokenClient)·One-Tap nonce(_googleOneTapNonce) 상태 변수는 원래 자리에 그대로 있다.
 * #TASK-ES-525(인라인 3단계 Z1 로그인·계정 3차): index.html 인라인 IIFE 의 구간(이전 전 4029~4047 · 4048~4061 · 4062~4139 · 4142~4179 · 4180~4230 · 4233~4266 · 4267~4324 · 4325~4328 · 4329~4332줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4029~4047줄(#TASK-ES-525 생성기 표지) ---- */
  async function sha256Hex(str){
    try {
      if(window.crypto && window.crypto.subtle && window.TextEncoder){
        var enc = new TextEncoder();
        var buf = await window.crypto.subtle.digest('SHA-256', enc.encode(str));
        return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2, '0'); }).join('');
      }
    } catch(e){}
    var h = 0, h2 = 0;
    for(var i = 0; i < str.length; i++){
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
      h2 = ((h2 << 7) - h2) + str.charCodeAt(i);
      h2 |= 0;
    }
    var hex1 = Math.abs(h).toString(16).padStart(8, '0');
    var hex2 = Math.abs(h2).toString(16).padStart(8, '0');
    return (hex1 + hex2 + hex1 + hex2 + hex1 + hex2 + hex1 + hex2).slice(0, 64);
  }
  /* ---- 이전 전 index.html 4048~4061줄(#TASK-ES-525 생성기 표지) ---- */

  function parseJwtPayload(token){
    try {
      var base64Url = (token || '').split('.')[1];
      if(!base64Url) return null;
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch(e){
      return null;
    }
  }
  /* ---- 이전 전 index.html 4062~4139줄(#TASK-ES-525 생성기 표지) ---- */

  async function handleGoogleUserSuccess(googleUser, accessToken){
    if(!googleUser || !googleUser.email){
      L.toast('구글 계정 정보를 확인할 수 없습니다.');
      return;
    }
    var email = (googleUser.email || '').trim().toLowerCase();
    var sub = googleUser.sub || googleUser.id || '';
    var name = googleUser.name || googleUser.given_name || email.split('@')[0];
    var picture = googleUser.picture || googleUser.avatar_url || '';

    // [보호 1] 이미 로그인된 상태(카카오 등 기존 세션)에서 구글 연동을 시도한 경우:
    // 기존 카카오 세션을 절대 끊거나 파괴하지 않고, 캘린더 연동 정보만 안전하게 보관
    if(L.state.profile && L.state.profile.id){
      if(accessToken){
        L.state.googleToken = {
          accessToken: accessToken,
          expiresAt: Date.now() + 3500 * 1000
        };
        if(typeof L.saveGoogleToken === 'function') L.saveGoogleToken(L.state.googleToken, email);
        try { sessionStorage.setItem('ourgoal_google_token', accessToken); } catch(e){}
      }
      if(!L.state.profile.settings) L.state.profile.settings = {};
      L.state.profile.settings.googleCalendarEmail = email;
      L.state.profile.settings.googleCalendarConnected = true;
      if(picture && !L.state.profile.avatarUrl) L.state.profile.avatarUrl = picture;
      await L.saveProfile();
      L.toast('Google 계정 및 캘린더가 안전하게 연동되었습니다!');
      return;
    }

    // [보호 2] 미로그인 상태에서 구글 로그인 시도:
    // 기존 카카오 계정 오염 및 세션 파괴를 원천 차단하고, 구글 직접 진입 및 카카오 데이터 연동 듀얼 옵션 제공
    var isAccountConflict = true;
    try { await L.sb.auth.signOut({ scope: 'local' }); } catch(e){}

    L.openModal(
      '<div style="text-align:center;padding:16px 8px;">' +
        '<div style="font-size:2.5rem;margin-bottom:12px;">✨</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;">기존 카카오 가입 계정 안내</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.6;margin:0 0 16px;">' +
          'Google 계정(<b>' + L.escapeHtml(email) + '</b>) 인증을 완료했습니다.<br>' +
          'Google 계정으로 바로 시작하시거나, 기존 카카오 기록을 불러와 안전하게 이어가실 수 있습니다.' +
        '</p>' +
        '<button class="btn btn-primary" id="continueGoogleDirectBtn" style="width:100%;margin-bottom:8px;padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">' +
          'Google 계정으로 바로 시작하기' +
        '</button>' +
        '<button class="btn btn-block btn-kakao" id="conflictKakaoLoginBtn" style="width:100%;margin-bottom:8px;padding:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.72L5.5 21.5c-.08.3.24.54.5.38l4.42-2.93c.52.05 1.05.08 1.58.08 5.52 0 10-3.58 10-8S17.52 3 12 3z"/></svg>' +
          '<span>기존 카카오 데이터 연동/복구</span>' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm" id="conflictCloseBtn" style="width:100%;">이메일/다른 방법으로 시작</button>' +
      '</div>',
      function(sheet){
        var gBtn = sheet.querySelector('#continueGoogleDirectBtn');
        if(gBtn) gBtn.onclick = async function(){
          L.closeModal();
          /* [#TASK-ES-373] 액세스 토큰·userinfo 이메일은 검증 세션이 아니다 — Supabase 구글 OAuth 로 검증 세션을 받아 그 uid 로만 입장 */
          await window.OurgoalGoogleSessionGuard.startOAuthOrGuide({ sb: L.sb, redirectTo: window.location.origin, loginHint: email, doc: document, toast: L.toast, initFields: typeof L.initRememberedAuthFields === 'function' ? L.initRememberedAuthFields : null, storage: localStorage, markLogin: L.setDeviceLoginTime });
        };
        var kBtn = sheet.querySelector('#conflictKakaoLoginBtn');
        if(kBtn) kBtn.onclick = function(){
          L.closeModal();
          L.openLoginRescueModal('기존 카카오 계정의 닉네임이나 이메일을 입력하시면 방금 인증하신 Google 계정과 안전하게 연동해 드립니다!');
        };
        var cBtn = sheet.querySelector('#conflictCloseBtn');
        if(cBtn) cBtn.onclick = function(){
          L.closeModal();
          var authScreen = document.getElementById('authScreen');
          var landScreen = document.getElementById('landingScreen');
          if(landScreen) landScreen.style.display = 'none';
          if(authScreen) authScreen.style.display = 'flex';
          var lUser = document.getElementById('loginUser');
          if(lUser){ lUser.value = email; lUser.focus(); }
        };
      }
    );
  }

  /* ---- 이전 전 index.html 4142~4179줄(#TASK-ES-525 생성기 표지) ---- */
  function getGoogleTokenClient(){
    if(!L._googleTokenClient && window.google && google.accounts && google.accounts.oauth2){
      var clientId = (L.GOOGLE_OAUTH_CLIENT_ID || '').trim();
      if(!clientId) return null;
      try {
        L._googleTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
          prompt: 'select_account',
          callback: async function(tokenResponse){
            if(tokenResponse && tokenResponse.error){
              console.warn('Google OAuth token error:', tokenResponse);
              if(tokenResponse.error !== 'popup_closed_by_user'){
                L.toast('Google 로그인 실패: ' + (tokenResponse.error_description || tokenResponse.error));
              }
              return;
            }
            if(tokenResponse && tokenResponse.access_token){
              try {
                var userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
                });
                if(!userRes.ok) throw new Error('사용자 정보를 가져올 수 없습니다. (' + userRes.status + ')');
                var googleUser = await userRes.json();
                await handleGoogleUserSuccess(googleUser, tokenResponse.access_token);
              } catch(fetchErr){
                console.error('Google userinfo fetch failed:', fetchErr);
                L.toast('구글 계정 정보 조회 실패: ' + fetchErr.message);
              }
            }
          }
        });
      } catch(e){
        console.warn('initTokenClient 실패:', e);
      }
    }
    return L._googleTokenClient;
  }
  /* ---- 이전 전 index.html 4180~4230줄(#TASK-ES-525 생성기 표지) ---- */

  function startGoogleLogin(){
    if(!window.google || !google.accounts){
      L.toast('Google 인증 모듈을 불러오는 중입니다...');
      var existing = document.getElementById('googleGsiScript');
      if(!existing){
        var s = document.createElement('script');
        s.id = 'googleGsiScript';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = function(){
          initGoogleOneTap();
          var client = getGoogleTokenClient();
          if(client){
            try { client.requestAccessToken(); } catch(e){}
          }
        };
        s.onerror = function(){
          if(typeof L.openLoginRescueModal === 'function'){
            L.openLoginRescueModal('Google 인증 모듈 연결이 원활하지 않습니다. 카카오 3초 시작 또는 닉네임으로 즉시 입장하실 수 있습니다!');
          } else {
            L.toast('Google 인증 서버 연결 실패. 카카오 로그인을 이용해주세요.');
          }
        };
        document.head.appendChild(s);
      } else {
        if(typeof L.openLoginRescueModal === 'function'){
          L.openLoginRescueModal('Google 로그인 연결 중입니다. 닉네임 또는 카카오로 1초 만에 바로 입장하실 수 있어요!');
        }
      }
      return;
    }
    var client = getGoogleTokenClient();
    if(client){
      try {
        client.requestAccessToken();
      } catch(e){
        console.warn('requestAccessToken 실패, One-Tap 폴백 시도:', e);
        if(google.accounts && google.accounts.id) google.accounts.id.prompt();
      }
    } else if(google.accounts && google.accounts.id){
      google.accounts.id.prompt();
    } else {
      if(typeof L.openLoginRescueModal === 'function'){
        L.openLoginRescueModal('Google 클라이언트를 초기화할 수 없습니다. 닉네임 또는 카카오로 바로 시작하세요!');
      } else {
        L.toast('카카오 또는 닉네임으로 바로 입장해주세요.');
      }
    }
  }

  /* ---- 이전 전 index.html 4233~4266줄(#TASK-ES-525 생성기 표지) ---- */
  async function initGoogleOneTap(){
    if(window.google && google.accounts && google.accounts.id && L.GOOGLE_OAUTH_CLIENT_ID){
      try {
        L._googleOneTapNonce = await window.OurgoalGoogleSessionGuard.createNonce(); /* [#TASK-ES-373] GIS 에는 hashed, Supabase 에는 raw */
        google.accounts.id.initialize({
          client_id: L.GOOGLE_OAUTH_CLIENT_ID,
          nonce: L._googleOneTapNonce ? L._googleOneTapNonce.hashed : undefined,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async function(response){
            /* [#TASK-ES-373] 미로그인: 자격증명을 브라우저에서 풀어 믿지 않고 Supabase signInWithIdToken 검증 세션 uid 로만 입장(실패 시 정식 로그인 안내) */
            if(response && response.credential && !(L.state.profile && L.state.profile.id)) return window.OurgoalGoogleSessionGuard.enterWithCredential({ sb: L.sb, credential: response.credential, rawNonce: L._googleOneTapNonce && L._googleOneTapNonce.raw, restore: L.restoreSessionAndEnter, getProfileId: function(){ return L.state.profile && L.state.profile.id; }, doc: document, toast: L.toast, initFields: typeof L.initRememberedAuthFields === 'function' ? L.initRememberedAuthFields : null, storage: localStorage, markLogin: L.setDeviceLoginTime });
            if(response && response.credential){ /* 이미 로그인한 상태: 기존처럼 캘린더 연동 표시만(입장 uid 를 바꾸지 않는다) */
              var payload = parseJwtPayload(response.credential);
              if(payload && payload.email){
                await handleGoogleUserSuccess({
                  email: payload.email,
                  sub: payload.sub,
                  name: payload.name || payload.given_name || payload.email.split('@')[0],
                  picture: payload.picture || ''
                }, null);
              }
            }
          }
        });
        var shell = document.getElementById('appShell');
        if(!shell || !shell.classList.contains('active')){
          google.accounts.id.prompt();
        }
      } catch(e){
        console.warn('Google OneTap init failed:', e);
      }
    }
  }
  /* ---- 이전 전 index.html 4267~4324줄(#TASK-ES-525 생성기 표지) ---- */

  async function startOAuthLogin(provider){
    if(provider === 'google'){
      startGoogleLogin();
      return;
    }
    try {
      // 카카오 OAuth 진입 전 오염 세션을 정리하여 Supabase Identity 계정 충돌 원천 방어
      try {
        var existingSession = await L.sb.auth.getSession();
        if(existingSession && existingSession.data && existingSession.data.session){
          await L.sb.auth.signOut({ scope: 'local' });
        }
      } catch(e){}
      L.setDeviceLoginTime(Date.now());
      try { localStorage.setItem('ourgoal_last_auth_provider', provider); } catch(e){}
      // PKCE code_verifier 2중 안전 백업 (카카오톡 인앱 브라우저 localStorage 유실 방어)
      try {
        for(var si = 0; si < localStorage.length; si++){
          var sk = localStorage.key(si);
          if(sk && sk.indexOf('-code-verifier') !== -1) sessionStorage.setItem(sk, localStorage.getItem(sk));
        }
      } catch(e){}
      var res = await L.sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: window.location.origin } });
      if(res && res.error) throw res.error;
    } catch(err){
      console.warn('OAuth 시작 실패:', err);
      var msg = err && err.message ? String(err.message) : '';
      if(/unsupported provider|provider is not enabled|not enabled/i.test(msg)){
        L.openModal(
          '<div style="text-align:center;padding:12px 6px;">' +
            '<div style="font-size:2.2rem;margin-bottom:8px;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>' +
            '<h3 style="margin:0 0 8px;font-size:1.1rem;font-weight:700;">' + (provider === 'kakao' ? '카카오' : '구글') + ' 로그인 심사 준비 중</h3>' +
            '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 16px;">공식 비즈니스 앱 콘솔 심사 대기 중입니다.<br><b>이메일 또는 닉네임으로 1초 만에</b> 바로 시작하실 수 있어요!</p>' +
            '<button class="btn btn-primary" id="fallbackQuickAuthBtn" style="width:100%;padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">1초 빠른 시작하기</button>' +
            '<button class="btn btn-ghost btn-sm" id="fallbackQuickAuthClose" style="width:100%;margin-top:8px;">닫기</button>' +
          '</div>',
          function(sheet){
            var cBtn = sheet.querySelector('#fallbackQuickAuthClose');
            if(cBtn) cBtn.onclick = L.closeModal;
            var qBtn = sheet.querySelector('#fallbackQuickAuthBtn');
            if(qBtn) qBtn.onclick = function(){
              L.closeModal();
              var landNick = document.getElementById('landNick');
              if(landNick){
                landNick.focus();
                landNick.scrollIntoView({ behavior: 'smooth' });
              } else if(typeof L.openLoginRescueModal === 'function'){
                L.openLoginRescueModal('사용하실 닉네임 또는 이메일을 입력하시면 1초 만에 바로 입장하실 수 있어요!');
              }
            };
          }
        );
      } else {
        L.toast((provider === 'kakao' ? '카카오' : '구글') + ' 로그인 시작에 실패했어요: ' + (msg || '잠시 후 다시 시도해주세요'));
      }
    }
  }
  /* ---- 이전 전 index.html 4325~4328줄(#TASK-ES-525 생성기 표지) ---- */
  function bindKakaoLoginButtons() { /* [#TASK-ES-525] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  ['landKakaoBtn','authKakaoBtn'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(){ startOAuthLogin('kakao'); });
  });
  } /* bindKakaoLoginButtons */
  /* ---- 이전 전 index.html 4329~4332줄(#TASK-ES-525 생성기 표지) ---- */
  function bindGoogleLoginButtons() { /* [#TASK-ES-525] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  ['landGoogleBtn','authGoogleBtn'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(){ startGoogleLogin(); });
  });
  } /* bindGoogleLoginButtons */

  K.sha256Hex = sha256Hex;
  K.parseJwtPayload = parseJwtPayload;
  K.handleGoogleUserSuccess = handleGoogleUserSuccess;
  K.getGoogleTokenClient = getGoogleTokenClient;
  K.startGoogleLogin = startGoogleLogin;
  K.initGoogleOneTap = initGoogleOneTap;
  K.startOAuthLogin = startOAuthLogin;
  K.bindKakaoLoginButtons = bindKakaoLoginButtons;
  K.bindGoogleLoginButtons = bindGoogleLoginButtons;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
