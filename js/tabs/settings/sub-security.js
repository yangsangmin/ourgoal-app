/**
 * OurGoal Settings Sub-Block: Account & Security (계정 표시 · 비밀번호 · 앱 잠금 PIN · 다른 기기 로그아웃)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 38929~39002줄)을 동작 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 그리는 순서와 같은 settings 객체는 renderSettingsScreen(js/tabs/settings/render.js)이 정한다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // 공용 부품은 js/core 두 곳으로만 읽는다(설정 전용 통로 없음).
  //  U = js/core/ui-helpers.js — 여러 탭이 같이 쓰는 순수 헬퍼(escapeHtml·a11ySwitch·download), 코드가 실제로 옮겨 와 있다.
  //  L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var U = global.OurgoalUiHelpers || {};
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 설정 키트: 설정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* 섹션 렌더: renderSettingsScreen 이 원래 순서대로 부른다. settings = state.profile.settings (renderSettingsScreen 이 한 번 읽어 넘긴 같은 객체) */
  function renderSecuritySection(settings){
    // 🔐 계정 및 보안 (Req 10 - [72] 로그인 상태 게스트 오표기 방지 및 안전 표출)
    var emailEl = document.getElementById('setAccountEmail');
    if(emailEl){
      var p = L.state.profile || {};
      var u = L.state.user || {};
      var isRealUser = (u && u.id && String(u.id).indexOf('guest') === -1) ||
                        (p && p.id && String(p.id).indexOf('guest') === -1 && p.isGuest !== true);
      var isGuest = !isRealUser;
      var userEmail = (u && u.email) || p.email;
      if(userEmail && userEmail.indexOf('@kakao.local') === -1 && userEmail.indexOf('@google.local') === -1 && userEmail.indexOf('@guest.local') === -1){
        emailEl.textContent = userEmail + ' (인증 완료)';
      } else if(p.provider === 'kakao' || (u.app_metadata && u.app_metadata.provider === 'kakao')){
        emailEl.textContent = '카카오 계정 연동됨 (' + (p.displayName || p.nickname || '로그인 완료') + ')';
      } else if(p.provider === 'google' || (u.app_metadata && u.app_metadata.provider === 'google')){
        emailEl.textContent = '구글 계정 연동됨 (' + (p.displayName || '로그인 완료') + ')';
      } else if(isRealUser){
        emailEl.textContent = (p.displayName || '정회원') + ' 계정 연동됨 (동기화 활성)';
      } else {
        emailEl.textContent = '게스트 체험 모드 (로컬 안전 보관)';
      }
    }
    var chgPassBtn = document.getElementById('btnChangePassModal');
    if(chgPassBtn){
      var isOAuthUser = (L.state.profile && (L.state.profile.provider === 'kakao' || L.state.profile.provider === 'google')) ||
                        (L.state.user && L.state.user.app_metadata && (L.state.user.app_metadata.provider === 'kakao' || L.state.user.app_metadata.provider === 'google'));
      if(isGuest){
        chgPassBtn.textContent = '🔒 간편 회원가입 / 계정 연동';
        chgPassBtn.onclick = function(){
          if(typeof openAuthModal === 'function') openAuthModal();
          else L.toast('소셜 로그인으로 내 소중한 데이터를 안전하게 보관하세요');
        };
      } else {
        chgPassBtn.textContent = isOAuthUser ? '비밀번호 등록/설정 (소셜 연동)' : '비밀번호 변경';
        chgPassBtn.onclick = function(){
          L.openChangePasswordModal();
        };
      }
    }
    if(typeof window.paintSecurityCard === 'function'){ try { window.paintSecurityCard(); } catch(e){} }
    /* [#TASK-ES-346 SET-01] '로그인 기기 및 세션' 목록은 설정을 열 때 이 기기 한 대를 사실대로 그린다(예전엔 비어 있었다) */
    if(typeof L.renderActiveDevicesList === 'function'){ try { L.renderActiveDevicesList(); } catch(e){} }
    var twoFaSw = document.getElementById('twoFactorSwitch');
    var pinCtrl = document.getElementById('twoFactorPinControls');
    var btnChangePin = document.getElementById('btnChange2FaPin');
    if(twoFaSw){
      var twoFaOn = !!(settings.twoFactorAuth && settings.twoFactorPin);
      twoFaSw.className = 'switch' + (twoFaOn ? ' on' : '');
      U.a11ySwitch(twoFaSw, twoFaOn, '앱 잠금 PIN (이 기기)');
      if(pinCtrl){
        pinCtrl.style.display = twoFaOn ? 'flex' : 'none';
      }
      twoFaSw.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        if(!twoFaOn){
          if(typeof L.openTwoFactorSetupModal === 'function') L.openTwoFactorSetupModal();
        } else {
          if(typeof L.openTwoFactorDisableModal === 'function') L.openTwoFactorDisableModal();
        }
      };
    }
    if(btnChangePin){
      btnChangePin.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        if(typeof L.openTwoFactorSetupModal === 'function') L.openTwoFactorSetupModal();
      };
    }
    var logoutOtherBtn = document.getElementById('logoutOtherDevicesBtn');
    if(logoutOtherBtn){
      logoutOtherBtn.onclick = function(){
        if(typeof L.openLogoutOtherDevicesConfirmModal === 'function'){
          L.openLogoutOtherDevicesConfirmModal();
        }
      };
    }
  }

  var OurgoalSettingsSubSecurity = {
    id: 'security',
    megaBlockId: 'settings',
    name: '계정 및 보안',
    containerId: 'setAccountEmail',

    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */
    render: renderSecuritySection,

    /**
     * 소블록 단독 마운트는 그리지 않고 false('그리지 않음')를 돌려준다.
     * 설정 화면은 섹션끼리 settings 객체·호출 순서를 공유하므로 renderSettingsScreen 이 한 번에 그린다 —
     * 메가블록(index.js)은 이 false 를 보고 이전과 같은 경로(setTab 의 renderSettingsScreen)로 넘긴다. (#TASK-ES-353 '실제로 그렸는가' 판정 유지)
     */
    mount: function(container, state, events) {
      this.dispose(events);
      return false;
    },

    /** 이 소블록이 건 구독 해제(#TASK-ES-353 소유자 키). 설정 섹션은 view:sync 로 다시 그리지 않는다(이전과 같음). */
    dispose: function(events) {
      var ev = events || global.OurgoalEvents;
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/security');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubSecurity;
  }
  global.OurgoalSettingsSubSecurity = OurgoalSettingsSubSecurity;
})(typeof window !== 'undefined' ? window : globalThis);
