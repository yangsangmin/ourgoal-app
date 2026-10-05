/**
 * OurGoal Settings Quick Actions (설정 탭 — 보안 카드·테마 견본 빠른 동작)
 *
 * 설정 탭 보안 카드 칠하기(paintSecurityCard) · 보안 상태 점검(refreshSecurityStatus) · 다른 기기 로그아웃 확인 창 열기(killDeviceSession) · 테마 견본 고르기(selectThemeSwatch).
 * window.paintSecurityCard 는 js/tabs/settings/sub-security.js 가 찾는다 — 노출 줄은 index.html 원래 자리에 그대로 있다.
 * 같은 묶음의 소통 허브 세 함수(switchCommSubTab·triggerFloatingReaction·openInAppDmSheet)는 옮기지 않았다 — 그 단추를 담은 #commHubGrid 가 마크업 인라인 은폐 스타일로 숨어 있어 게스트 화면에서 잴 수 없다(별도 티켓).
 * #TASK-ES-439(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 17724~17742 · 17744~17749 · 17751~17756 · 17758~17782줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 17724~17742줄(#TASK-ES-439 생성기 표지) ---- */

  /* [#TASK-ES-346 SET-01] 보안 카드는 실제 상태만 보여 준다.
     배지: 이 기기에 앱 잠금 PIN 이 설정돼 있을 때만 '설정됨'. 서버 2단계 인증은 없으므로 그런 표시를 하지 않는다. */
  function paintSecurityCard(){
    var settings = (L.state.profile && L.state.profile.settings) || {};
    var pinOn = !!(settings.twoFactorAuth && settings.twoFactorPin);
    var b = document.getElementById('badge2faStatus');
    if(b){
      b.textContent = pinOn ? '🔐 앱 잠금 PIN 설정됨 (이 기기)' : '앱 잠금 PIN 꺼짐';
      b.setAttribute('data-applock', pinOn ? 'on' : 'off');
    }
    var nameEl = document.getElementById('securityCardDeviceName');
    if(nameEl){
      var dev = null;
      try { dev = (typeof L.getRegisteredDevices === 'function') ? L.getRegisteredDevices()[0] : null; } catch(e){}
      nameEl.textContent = '이 기기 (지금 사용 중)' + (dev && dev.name ? ' · ' + dev.name : '');
    }
    return pinOn;
  }

  /* ---- 이전 전 index.html 17744~17749줄(#TASK-ES-439 생성기 표지) ---- */

  function refreshSecurityStatus(){
    L.triggerHapticFeedback(12);
    var pinOn = paintSecurityCard();
    if(typeof L.toast === 'function') L.toast(pinOn ? '이 기기에 앱 잠금 PIN 이 설정돼 있어요.' : '이 기기에 앱 잠금 PIN 이 꺼져 있어요. 설정 > 계정 및 보안에서 켤 수 있어요.');
  }

  /* ---- 이전 전 index.html 17751~17756줄(#TASK-ES-439 생성기 표지) ---- */

  /* 예전 판은 '원격 기기 세션이 차단되었습니다' 토스트만 띄웠다. 실제로 되는 '다른 기기 모두 로그아웃'으로 연결한다. */
  function killDeviceSession(){
    L.triggerHapticFeedback(12);
    if(typeof L.openLogoutOtherDevicesConfirmModal === 'function') L.openLogoutOtherDevicesConfirmModal();
  }

  /* ---- 이전 전 index.html 17758~17782줄(#TASK-ES-439 생성기 표지) ---- */

  function selectThemeSwatch(themeId){
    L.triggerHapticFeedback(12);
    var swatches = ['btnThemeSwatchDark', 'btnThemeSwatchLight', 'btnThemeSwatchMidnight', 'btnThemeSwatchWarm'];
    swatches.forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.classList.remove('active');
    });
    var map = {
      'dark': 'btnThemeSwatchDark',
      'light': 'btnThemeSwatchLight',
      'midnight': 'btnThemeSwatchMidnight',
      'warm': 'btnThemeSwatchWarm'
    };
    var activeEl = document.getElementById(map[themeId]);
    if(activeEl) activeEl.classList.add('active');

    if(typeof setTheme === 'function') setTheme(themeId);
    else document.documentElement.setAttribute('data-theme', themeId);

    if(typeof L.toast === 'function') {
      var names = { 'dark':'다크', 'light':'라이트', 'midnight':'미드나잇', 'warm':'웜' };
      L.toast((names[themeId] || themeId) + ' 테마가 적용되었습니다 🎨');
    }
  }

  K.paintSecurityCard = paintSecurityCard;
  K.refreshSecurityStatus = refreshSecurityStatus;
  K.killDeviceSession = killDeviceSession;
  K.selectThemeSwatch = selectThemeSwatch;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
