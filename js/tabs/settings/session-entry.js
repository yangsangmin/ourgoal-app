/**
 * OurGoal Session Entry (설정 — 세션 복구·직접 로그인·로그인 빠른 복구 창)
 *
 * 세션 복구 뒤 앱 입장(restoreSessionAndEnter) · 아이디 직접 로그인(loginWithDirectIdentifier) · 로그인 빠른 복구 창(openLoginRescueModal · rescueLoginSession).
 * 랜딩·로그인 화면의 「로그인이 잘 안 되시나요?」·「로그인 문제 해결」 링크 처리기 등록 문은 bindLoginRescueButtons 로 감싸 index.html 원래 자리에서 부른다(등록 순서 보존, 이중 처리기 0).
 * 입장 중 표시(_isEnteringApp)는 index.html 에 그대로 있고 L getter·setter 로 읽고 쓴다.
 * #TASK-ES-461(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 26332~26393 · 26394~26481 · 26482~26531 · 26532~26556 · 26557~26563줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 26332~26393줄(#TASK-ES-461 생성기 표지) ---- */
  async function restoreSessionAndEnter(session){
    if(!session || !session.user) return false;
    if(L._isEnteringApp) return true;
    L._isEnteringApp = true;
    try {
      var um = session.user.user_metadata || {};
      var newExtra = {};
      if(um.avatar_url || um.picture) newExtra.avatar_url = um.avatar_url || um.picture;
      if(um.full_name || um.name || um.nickname) newExtra.display_name = um.full_name || um.name || um.nickname;
      var userEmail = session.user.email || um.email || (newExtra.display_name ? (newExtra.display_name + '@kakao.local') : (session.user.id.slice(0, 8) + '@kakao.local'));
      L.setDeviceLoginTime(Date.now());
      /* [#TASK-ES-365] 다른 로그인 사용자의 전체 사본·메모리 프로필이 남아 있으면 새 계정에 이어 붙이지 않는다(게스트 사본은 이관용으로 둔다) */
      window.OurgoalAccountIsolation.dropForeignSessionCopy(session.user.id);
      if(L.state.profile && L.state.profile.id !== session.user.id && !window.OurgoalAccountIsolation.isGuestId(L.state.profile.id)) L.state.profile = null;
      try {
        L.state.profile = await L.loadProfile(session.user.id, userEmail, newExtra, (session.user.app_metadata && session.user.app_metadata.provider) || null);
      } catch(lpErr){
        console.warn('loadProfile 지연 또는 일시 오류, defaultProfile로 진입 보장:', lpErr);
        if(!L.state.profile){
          L.state.profile = L.defaultProfile(session.user.id, userEmail, newExtra.display_name || userEmail.split('@')[0]);
        }
      }
      if(!L.state.profile){
        L.state.profile = L.defaultProfile(session.user.id, userEmail, newExtra.display_name || userEmail.split('@')[0]);
      }
      // 게스트 세션 데이터 새 소셜 계정으로 자동 마이그레이션 (#TASK-ES-043, #TASK-ES-224)
      try {
        if(typeof L.migrateGuestDataToUser === 'function' && session && session.user){
          await L.migrateGuestDataToUser(session.user.id, L.state.profile);
        }
      } catch(mErr){ console.warn('게스트 데이터 병합 예외 (무시):', mErr); }
      var ls = document.getElementById('landingScreen');
      if(ls) ls.style.display = 'none';
      var as = document.getElementById('authScreen');
      if(as) as.style.display = 'none';
      // P0: 회원 탈퇴 30일 유예(소프트 삭제) 복구 체크 (소셜 로그인 및 자동 복구 세션)
      var cancelled = await L.checkPendingDeletionRestore();
      if(cancelled){
        L._isEnteringApp = false;
        return false;
      }
      if(L.state.profile._isNewSignup && (!L.state.profile.goals || L.state.profile.goals.length === 0) && (!L.state.profile.records || L.state.profile.records.length === 0)){
        L.startOnboarding();
      } else {
        L.enterApp();
      }
      L.checkAndHandlePeerInviteUrl();
      return true;
    } catch(err){
      console.warn('세션 복원 중 예외 발생, 안전 강제 진입 폴백:', err);
      try {
        var ls2 = document.getElementById('landingScreen');
        if(ls2) ls2.style.display = 'none';
        var as2 = document.getElementById('authScreen');
        if(as2) as2.style.display = 'none';
        L.enterApp();
      } catch(e){}
      return true;
    } finally {
      L._isEnteringApp = false;
    }
  }
  /* ---- 이전 전 index.html 26394~26481줄(#TASK-ES-461 생성기 표지) ---- */
  async function loginWithDirectIdentifier(rawId, extraOpt){
    var idVal = String(rawId || '').trim();
    if(!idVal){
      L.toast('닉네임 또는 이메일을 입력해주세요.');
      return false;
    }
    /* [#TASK-ES-368·373] 입력값·구글 이메일은 신원 증명이 아니다 — 정식 세션 uid(또는 개발용 테스터 uid)로만 들어간다 */
    var directSessionUid = null;
    try {
      var directSessRes = await L.sb.auth.getSession();
      var directSess = directSessRes && directSessRes.data && directSessRes.data.session;
      if(directSess && directSess.user && directSess.user.id) directSessionUid = directSess.user.id;
    } catch(sessErr){ directSessionUid = null; }
    var directTarget = window.OurgoalDirectLoginGuard.resolveDirectLoginTarget({
      sessionUid: directSessionUid,
      provider: extraOpt && extraOpt.provider,
      verifiedEmail: extraOpt && extraOpt.email,
      explicitUid: extraOpt && extraOpt.userId,
      devHost: window.OurgoalDirectLoginGuard.isLocalDevHost(typeof location !== 'undefined' ? location.hostname : '')
    });
    if(!directTarget.allow){
      window.OurgoalDirectLoginGuard.guideToFormalLogin(document, L.toast, typeof L.initRememberedAuthFields === 'function' ? L.initRememberedAuthFields : null);
      return false;
    }
    L.toast('계정 기록을 확인하고 입장 중입니다…');
    try {
      L.setDeviceLoginTime(Date.now());
      var targetUserId = directTarget.uid;
      var targetUsername = idVal;
      var targetDisplayName = (extraOpt && extraOpt.displayName) || (idVal.indexOf('@') !== -1 ? idVal.split('@')[0] : idVal);
      var newExtra = {
        display_name: targetDisplayName,
        avatar_url: (extraOpt && extraOpt.avatarUrl) || ''
      };
      // 2. 이 기기에 남은 "이 uid 의" 백업만 확인한다 (#TASK-ES-035 의 다중 백업 접두사, 다른 uid 키는 보지 않음)
      var backupPrefixes = ['ourgoal_goals_backup_', 'ourgoal_records_backup_', 'ourgoal_profile_backup_', 'ourgoal_settings_'];
      var ownBackupCount = backupPrefixes.filter(function(pfx){ return localStorage.getItem(pfx + targetUserId) !== null; }).length;
      // 3. 프로필 로드 (loadProfile은 내부에서 users 행 보장, goals/checkins 조회 및 로컬 백업 자동 복원 수행)
      var p = null;
      try {
        p = await L.loadProfile(targetUserId, targetUsername, newExtra, (extraOpt && extraOpt.provider) || 'direct_rescue');
      } catch(lpErr){
        console.warn('loadProfile direct rescue fallback:', lpErr);
      }
      if(!p) p = L.defaultProfile(targetUserId, targetUsername, targetDisplayName);
      if(extraOpt && extraOpt.avatarUrl && !p.avatarUrl) p.avatarUrl = extraOpt.avatarUrl;
      L.state.profile = p;
      if(extraOpt && extraOpt.accessToken){
        L.state.googleToken = { accessToken: extraOpt.accessToken, expiresAt: Date.now() + 3500 * 1000 };
        var gEmailToSet = (extraOpt && extraOpt.email) || (targetUsername && targetUsername.indexOf('@') !== -1 ? targetUsername : '');
        if(typeof L.saveGoogleToken === 'function') L.saveGoogleToken(L.state.googleToken, gEmailToSet);
        try { sessionStorage.setItem('ourgoal_google_token', extraOpt.accessToken); } catch(e){}
        if(p.settings){
          p.settings.googleCalendarConnected = true;
          if(gEmailToSet) p.settings.googleCalendarEmail = gEmailToSet;
        }
      } else if(typeof L.restoreGoogleToken === 'function') {
        var restoredTok = L.restoreGoogleToken();
        if(restoredTok && p.settings){
          p.settings.googleCalendarConnected = true;
          if(restoredTok.email && !p.settings.googleCalendarEmail) p.settings.googleCalendarEmail = restoredTok.email;
        }
      }
      // 3.5. 게스트 세션 데이터 새 계정으로 자동 마이그레이션 (#TASK-ES-224)
      try {
        if(typeof L.migrateGuestDataToUser === 'function'){
          await L.migrateGuestDataToUser(targetUserId, p);
        }
      } catch(mErr){ console.warn('[loginWithDirectIdentifier] migrateGuestDataToUser error:', mErr); }
      // 4. 로컬 세션 보존 (재접속 시 자동 로그인)
      try {
        localStorage.setItem('ourgoal_guest_profile', JSON.stringify(p));
        localStorage.setItem('ourgoal_current_user', targetUserId);
      } catch(e){}
      // 5. 화면 전환 및 진입
      var ls = document.getElementById('landingScreen');
      if(ls) ls.style.display = 'none';
      var as = document.getElementById('authScreen');
      if(as) as.style.display = 'none';
      L.enterApp();
      L.toast(targetDisplayName + '님, 환영합니다!' + (ownBackupCount > 0 ? ' 이 기기에 남은 내 기록도 확인했어요.' : ''));
      return true;
    } catch(err){
      console.warn('직통 로그인 실패:', err);
      L.toast('입장 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      return false;
    }
  }
  /* ---- 이전 전 index.html 26482~26531줄(#TASK-ES-461 생성기 표지) ---- */
  function openLoginRescueModal(customNotice){
    try {
      L.sb.auth.signOut({ scope: 'local' });
      for(var ki = localStorage.length - 1; ki >= 0; ki--){
        var lk = localStorage.key(ki);
        if(lk && (lk.indexOf('sb-') === 0 || lk === 'ourgoal_guest_profile')) localStorage.removeItem(lk);
      }
    } catch(e){}
    L.openModal(
      '<div style="text-align:center;padding:16px 8px;">' +
        '<div style="font-size:2.5rem;margin-bottom:12px;">🛟</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;">빠른 계정 복구 및 입장</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.6;margin:0 0 16px;">' +
          L.escapeHtml(customNotice || '카카오 로그인 연동 지연 시에도 사용하시던 닉네임이나 이메일을 입력하시면 기존 목표와 기록을 즉시 불러와 입장하실 수 있습니다!') +
        '</p>' +
        '<p id="rescueLoginRequiredNote" style="font-size:.78rem;color:var(--ink-faint);line-height:1.5;margin:0 0 14px;">' +
          L.escapeHtml('내 기록은 카카오·구글·이메일로 로그인한 계정으로만 열려요. 로그인 전이면 로그인 화면으로 안내해 드려요.') +
        '</p>' +
        '<div style="margin-bottom:14px;text-align:left;">' +
          '<label style="font-size:.8rem;font-weight:600;color:var(--ink-soft);margin-bottom:4px;display:block;">카카오 닉네임 또는 이메일</label>' +
          '<input type="text" id="rescueIdentifierInput" class="input" placeholder="예: 상민 또는 카카오 이메일" style="width:100%;padding:10px 12px;box-sizing:border-box;border-radius:10px;border:1px solid var(--border);font-size:.95rem;">' +
        '</div>' +
        '<button class="btn btn-primary" id="rescueDirectEnterBtn" style="width:100%;padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;margin-bottom:8px;">' +
          '내 데이터 불러오고 바로 입장' +
        '</button>' +
        '<div style="display:flex;gap:8px;margin-top:8px;">' +
          '<button class="btn btn-ghost btn-sm" id="rescueResetSessionBtn" style="flex:1;font-size:.8rem;color:var(--danger, #e53e3e);">처음부터 다시 시도</button>' +
          '<button class="btn btn-ghost btn-sm" id="rescueModalCloseBtn" style="flex:1;font-size:.8rem;">닫기</button>' +
        '</div>' +
      '</div>',
      function(sheet){
        var inp = sheet.querySelector('#rescueIdentifierInput');
        if(inp) inp.focus();
        var enterBtn = sheet.querySelector('#rescueDirectEnterBtn');
        if(enterBtn) enterBtn.onclick = async function(){
          var val = (inp && inp.value || '').trim();
          if(!val){ L.toast('닉네임 또는 이메일을 입력해주세요.'); return; }
          L.closeModal();
          await loginWithDirectIdentifier(val);
        };
        var rBtn = sheet.querySelector('#rescueResetSessionBtn');
        if(rBtn) rBtn.onclick = function(){
          L.closeModal();
          rescueLoginSession();
        };
        var cBtn = sheet.querySelector('#rescueModalCloseBtn');
        if(cBtn) cBtn.onclick = L.closeModal;
      }
    );
  }
  /* ---- 이전 전 index.html 26532~26556줄(#TASK-ES-461 생성기 표지) ---- */
  async function rescueLoginSession(){
    try {
      L.toast('로그인 상태를 깨끗이 정리하고 재시도 중입니다…');
      await L.sb.auth.signOut({ scope: 'local' });
    } catch(e){}
    try {
      sessionStorage.clear();
      var toRemove = [];
      for(var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        if(k && (k.indexOf('sb-') === 0 || k === 'ourgoal_sid' || k === 'ourgoal_login_at' || k === 'ourgoal_guest_profile')){
          toRemove.push(k);
        }
      }
      toRemove.forEach(function(k){ localStorage.removeItem(k); });
    } catch(e){}
    L.state.profile = null;
    L.toast('세션을 깨끗하게 초기화했습니다. 카카오 또는 이메일로 다시 로그인해주세요.');
    setTimeout(function(){
      if(window.history && window.history.replaceState){
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.location.reload();
    }, 600);
  }
  /* ---- 이전 전 index.html 26557~26563줄(#TASK-ES-461 생성기 표지) ---- */
  function bindLoginRescueButtons() { /* [#TASK-ES-461] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  ['landRescueBtn', 'authRescueBtn'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      openLoginRescueModal();
    });
  });
  } /* bindLoginRescueButtons */

  K.restoreSessionAndEnter = restoreSessionAndEnter;
  K.loginWithDirectIdentifier = loginWithDirectIdentifier;
  K.openLoginRescueModal = openLoginRescueModal;
  K.rescueLoginSession = rescueLoginSession;
  K.bindLoginRescueButtons = bindLoginRescueButtons;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
