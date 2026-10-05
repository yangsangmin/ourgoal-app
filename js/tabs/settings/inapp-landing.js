/**
 * OurGoal In-App Browser & Landing Entry (설정 — 카카오톡 인앱 브라우저 감지·첫 화면 진입 단추)
 *
 * 카카오톡 인앱 브라우저 감지·외부 브라우저로 빠져나가기 배너(checkKakaoInAppBrowser·escapeKakaoInAppBrowser)와 첫 화면 단추 처리기(닉네임 빠른 입장·이메일 가입·로그인·둘러보기).
 * 첫 화면 단추 처리기 등록 문 네 개는 bind 함수로 감싸 index.html 원래 자리에서 부른다. checkKakaoInAppBrowser() 호출·window 노출 줄은 원래 자리에 그대로 있다.
 * #TASK-ES-476(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 4018~4072 · 4073~4138 · 4144~4149 · 4150~4155 · 4156~4161 · 4163~4174줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 4018~4072줄(#TASK-ES-476 생성기 표지) ---- */
  function escapeKakaoInAppBrowser(){
    if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
    var u = window.location.href;
    var isAndroid = /Android/i.test(navigator.userAgent);
    if(isAndroid){
      var clean = u.replace(/^https?:\/\//i, '');
      window.location.href = 'intent://' + clean + '#Intent;scheme=https;package=com.android.chrome;end';
      return;
    }
    try {
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(u);
      }
    } catch(e){}
    L.openModal(
      '<div style="text-align:center;padding:18px 14px;">' +
        '<div style="font-size:2.4rem;margin-bottom:10px;">🧭</div>' +
        '<h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:800;color:var(--ink);">Safari(사파리)로 열기 안내</h3>' +
        '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 16px;">' +
          '카카오톡 앱에서는 카카오 자동 로그인 세션이 끊길 수 있어요.<br>' +
          '화면 우측 하단 <b>[···]</b> 또는 상단 <b>[⋮]</b>을 누른 후<br>' +
          '<b style="color:var(--brand);">[Safari로 열기]</b> 또는 <b>[다른 브라우저로 열기]</b>를 선택해주세요!' +
        '</p>' +
        '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:14px;text-align:left;display:flex;flex-direction:column;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;font-size:.8125rem;font-weight:700;color:var(--ink);">' +
            '<span style="background:var(--brand);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;">1</span>' +
            '<span>화면 우측 하단 <b>[···]</b> (또는 상단 <b>[⋮]</b>) 터치</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;font-size:.8125rem;font-weight:700;color:var(--ink);">' +
            '<span style="background:var(--brand);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;">2</span>' +
            '<span><b>[Safari로 열기]</b> 선택 후 간편 로그인 및 홈 화면 추가</span>' +
          '</div>' +
        '</div>' +
        '<div style="background:rgba(99,102,241,0.08);border:1px solid var(--brand-line, rgba(99,102,241,0.25));border-radius:10px;padding:10px;font-size:.78125rem;color:var(--brand);font-weight:600;margin-bottom:14px;">' +
          '✨ 아워골 접속 주소가 클립보드에 자동 복사되었습니다.' +
        '</div>' +
        '<button class="btn btn-primary" id="btnCopyInAppUrlAgain" type="button" style="width:100%;min-height:44px;margin-bottom:8px;padding:12px;font-weight:700;border-radius:12px;background:var(--brand);border:none;">주소 다시 복사하기</button>' +
        '<button class="btn btn-ghost btn-sm" id="btnCloseInAppModal" type="button" style="width:100%;min-height:40px;font-weight:600;border-radius:10px;border:1px solid var(--rule);">닫기</button>' +
      '</div>',
      function(sheet){
        var cBtn = sheet.querySelector('#btnCloseInAppModal');
        if(cBtn) cBtn.onclick = function(){ if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12); L.closeModal(); };
        var cpBtn = sheet.querySelector('#btnCopyInAppUrlAgain');
        if(cpBtn) cpBtn.onclick = function(){
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          try {
            navigator.clipboard.writeText(u);
            L.toast('주소가 복사되었습니다. Safari 주소창에 붙여넣어주세요! ✨');
          } catch(e){
            L.toast('주소: ' + u);
          }
        };
      }
    );
  }
  /* ---- 이전 전 index.html 4073~4138줄(#TASK-ES-476 생성기 표지) ---- */

  function checkKakaoInAppBrowser(force){
    if(typeof navigator === 'undefined' || !navigator.userAgent) return;
    var isKakao = !!force || /KAKAOTALK/i.test(navigator.userAgent) || /[?&](kakao|inapp|debug_inapp)=1/i.test(window.location.search);
    if(!isKakao) return;

    var isAndroid = /Android/i.test(navigator.userAgent);
    var currentUrl = window.location.href;

    // 1. 안드로이드 (Android): intent:// scheme 호출로 1초 만에 Chrome으로 자동 탈출
    if(isAndroid && !force){
      var cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
      window.location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;end';
    }

    // 2. 아이폰 (iOS) 및 기타 웹뷰: 세션 내 닫기 여부 확인 (force 모드 제외)
    try {
      if(!force && sessionStorage.getItem('ourgoal_hide_kakao_escape') === '1') return;
    } catch(e){}

    // 이미 배너가 있으면 중복 생성 방지
    if(document.getElementById('inAppBrowserNotice')) return;

    function insertBanner(){
      if(!document.body || document.getElementById('inAppBrowserNotice')) return;
      var nDiv = document.createElement('div');
      nDiv.id = 'inAppBrowserNotice'; /* id="inAppBrowserNotice" */
      nDiv.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:440px;z-index:999999;background:#10b981;background:linear-gradient(135deg, #059669 0%, #10b981 100%);color:#ffffff;padding:max(10px, env(safe-area-inset-top, 0px)) 14px 10px 14px;font-size:0.8125rem;text-align:center;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:8px;box-shadow:0 4px 14px rgba(16,185,129,0.35);border-bottom:1px solid rgba(255,255,255,0.25);box-sizing:border-box;backdrop-filter:blur(8px);';
      nDiv.innerHTML = '' +
        '<div style="display:flex;align-items:center;gap:8px;flex:1;text-align:left;min-width:0;">' +
          '<span style="font-size:1.15rem;flex-shrink:0;">⚡</span>' +
          '<span style="font-size:.78125rem;line-height:1.4;word-break:keep-all;">' +
            (isAndroid ? '쾌적한 아워골 이용을 위해 <b>Chrome 브라우저</b>로 이동을 권장합니다!' : '더 편리한 사용을 위해 우측 하단 <b>[···]</b> 누르고 <b>[Safari로 열기]</b>를 눌러주세요!') +
          '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
          '<button type="button" id="btnEscapeInAppNotice" style="background:#ffffff;color:#065f46;border:none;padding:6px 12px;min-height:34px;border-radius:8px;font-size:0.75rem;font-weight:800;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.12);">' +
            (isAndroid ? 'Chrome 열기' : 'Safari 열기 안내') +
          '</button>' +
          '<button type="button" id="btnCloseInAppBanner" style="background:rgba(255,255,255,0.2);color:#ffffff;border:none;width:28px;height:28px;border-radius:50%;font-size:0.875rem;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="닫기">' +
            '✕' +
          '</button>' +
        '</div>';

      document.body.insertBefore(nDiv, document.body.firstChild);

      var escBtn = nDiv.querySelector('#btnEscapeInAppNotice');
      if(escBtn) escBtn.addEventListener('click', function(){
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        escapeKakaoInAppBrowser();
      });

      var closeBtn = nDiv.querySelector('#btnCloseInAppBanner');
      if(closeBtn) closeBtn.addEventListener('click', function(){
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        try { sessionStorage.setItem('ourgoal_hide_kakao_escape', '1'); } catch(e){}
        nDiv.remove();
      });
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', insertBanner);
    } else {
      insertBanner();
    }
  }

  /* ---- 이전 전 index.html 4144~4149줄(#TASK-ES-476 생성기 표지) ---- */
  function bindLandNickQuickLink() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.landNickQuickLink){
    L.landNickQuickLink.addEventListener('click', function(e){
      if(e && e.preventDefault) e.preventDefault();
      L.openLoginRescueModal('사용하실 닉네임 또는 이메일을 입력하시면 1초 만에 바로 입장하실 수 있어요!');
    });
  }
  } /* bindLandNickQuickLink */
  /* ---- 이전 전 index.html 4150~4155줄(#TASK-ES-476 생성기 표지) ---- */
  function bindLandStartBtn() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  document.getElementById('landStartBtn').addEventListener('click', function(){
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    if(typeof L.initRememberedAuthFields === 'function') L.initRememberedAuthFields();
    document.querySelector('[data-authtab="signup"]').click();
  });
  } /* bindLandStartBtn */
  /* ---- 이전 전 index.html 4156~4161줄(#TASK-ES-476 생성기 표지) ---- */
  function bindLandLoginLink() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  document.getElementById('landLoginLink').addEventListener('click', function(){
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    if(typeof L.initRememberedAuthFields === 'function') L.initRememberedAuthFields();
    document.querySelector('[data-authtab="login"]').click();
  });
  } /* bindLandLoginLink */

  /* ---- 이전 전 index.html 4163~4174줄(#TASK-ES-476 생성기 표지) ---- */
  function bindLandGuestBtn() { /* [#TASK-ES-476] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.landGuestBtn){
    L.landGuestBtn.addEventListener('click', function(){
      var guestId = 'guest-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      L.state.profile = L.defaultProfile(guestId, guestId, '게스트');
      L.state.profile.isGuest = true;
      try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(L.state.profile)); } catch(e){}
      document.getElementById('landingScreen').style.display = 'none';
      document.getElementById('authScreen').style.display = 'none';
      L.enterApp();
      L.toast('게스트 모드로 시작했어요. 언제든 설정에서 가입할 수 있어요.');
    });
  }
  } /* bindLandGuestBtn */

  K.escapeKakaoInAppBrowser = escapeKakaoInAppBrowser;
  K.checkKakaoInAppBrowser = checkKakaoInAppBrowser;
  K.bindLandNickQuickLink = bindLandNickQuickLink;
  K.bindLandStartBtn = bindLandStartBtn;
  K.bindLandLoginLink = bindLandLoginLink;
  K.bindLandGuestBtn = bindLandGuestBtn;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
