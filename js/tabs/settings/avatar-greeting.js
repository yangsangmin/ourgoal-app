/**
 * OurGoal Avatar Greeting (설정 탭 — 앱 진입 아바타 인사 창·레벨업 띠)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   openAvatarGreetingPopup — 「#TASK-ES-165: 앱 진입 아바타 인사 팝업」(이전 전 3448~3528줄)
 *   closeAvatarGreetingPopup — 「#TASK-ES-165: 앱 진입 아바타 인사 팝업」(이전 전 3530~3548줄)
 *   showLevelUpBanner — 「#TASK-ES-165: 앱 진입 아바타 인사 팝업」(이전 전 3552~3564줄)
 * 앱 진입 때 내 아바타 인사 창(시간대별 멘트) 열기·닫기, 레벨업 띠 보이기.
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

  function openAvatarGreetingPopup(profile, isPreview){
    try {
      var p = profile || L.state.profile;
      if(!p) return;
      var settings = p.settings || {};
      var conf = settings.avatarGreeting || {};
      
      // 비활성화 설정 시 (미리보기가 아닐 때) 건너뜀
      if(!isPreview && conf.enabled === false) return;
      
      // 일반 실행 시 1회 노출 방어 (세션 기준)
      if(!isPreview){
        var greetedKey = 'ourgoal_avatar_greeted_session';
        try {
          if(sessionStorage.getItem(greetedKey)) return;
          sessionStorage.setItem(greetedKey, '1');
        } catch(e){}
      }

      var modal = document.getElementById('avatarGreetingModal');
      if(!modal) return;

      // 시간대별 멘트 분기 (기본 기준: 오전 4시, 오후 4시)
      var dayStartHour = typeof conf.dayStartHour === 'number' ? conf.dayStartHour : 4;
      var nightStartHour = typeof conf.nightStartHour === 'number' ? conf.nightStartHour : 16;
      var defaultDayMsg = conf.dayGreeting || '오늘은 뭘 할거냐? 내자신';
      var defaultNightMsg = conf.nightGreeting || '오늘은 뭘 했냐? 내자신';

      var curHour = new Date().getHours();
      var isDay = false;
      if(dayStartHour < nightStartHour){
        isDay = (curHour >= dayStartHour && curHour < nightStartHour);
      } else {
        isDay = (curHour >= dayStartHour || curHour < nightStartHour);
      }

      var greetingText = isDay ? defaultDayMsg : defaultNightMsg;
      var textEl = document.getElementById('avatarGreetMessageText');
      if(textEl) textEl.textContent = greetingText;

      // 화면 절반 크기 (높이 ~48vh, 240px) 아바타 렌더링
      var figContainer = document.getElementById('avatarGreetFigureContainer');
      if(figContainer){
        var xpTotal = (settings.xp && settings.xp.total) || 0;
        var curLv = (typeof L.levelForXP === 'function') ? L.levelForXP(xpTotal) : 1;
        var avatarMarkup = '';
        if(window.OurgoalAvatar && typeof window.OurgoalAvatar.renderAvatarHtml === 'function'){
          avatarMarkup = window.OurgoalAvatar.renderAvatarHtml(curLv, p, { size: 240, withRankBg: true });
        } else if(typeof L.avatarHtml === 'function'){
          avatarMarkup = L.avatarHtml(240);
        } else {
          avatarMarkup = '<div style="font-size:120px;">🤖</div>';
        }
        figContainer.innerHTML = avatarMarkup;
      }

      // 기존 타이머 클리어
      if(L.__avatarGreetTimer){
        clearTimeout(L.__avatarGreetTimer);
        L.__avatarGreetTimer = null;
      }

      // 팝업 표시 및 리셋
      modal.classList.remove('fade-out');
      modal.style.display = 'flex';

      // 2.5초(2500ms) 자동 페이드아웃 등록
      L.__avatarGreetTimer = setTimeout(function(){
        closeAvatarGreetingPopup(true);
      }, 2500);

      // 백드롭 클릭 시 즉시 닫힘 (컨텐츠 클릭 제외)
      modal.onclick = function(e){
        if(e.target === modal){
          closeAvatarGreetingPopup(false);
        }
      };
    } catch(err){
      console.warn('openAvatarGreetingPopup error:', err);
    }
  }

  function closeAvatarGreetingPopup(withFade){
    if(L.__avatarGreetTimer){
      clearTimeout(L.__avatarGreetTimer);
      L.__avatarGreetTimer = null;
    }
    var modal = document.getElementById('avatarGreetingModal');
    if(!modal) return;

    if(withFade){
      modal.classList.add('fade-out');
      setTimeout(function(){
        modal.style.display = 'none';
        modal.classList.remove('fade-out');
      }, 350);
    } else {
      modal.style.display = 'none';
      modal.classList.remove('fade-out');
    }
  }

  function showLevelUpBanner(level){
    var slot = document.getElementById('levelUpBannerSlot');
    if(navigator.vibrate) navigator.vibrate([12,40,24]);
    L.burstConfetti(window.innerWidth/2, 80, 14);
    if(slot){
      slot.innerHTML = '<div class="notify-banner levelup"><div class="nb-txt"><b>레벨 업!</b>Lv.'+level+'이 됐어요. 계속 이어가 볼까요?</div><button id="lvBannerClose" type="button">확인</button></div>';
      var closeBtn = document.getElementById('lvBannerClose');
      if(closeBtn) closeBtn.addEventListener('click', function(){ slot.innerHTML = ''; });
      setTimeout(function(){ if(slot.innerHTML) slot.innerHTML = ''; }, 6000);
    }
    // #TASK-ES-150: 레벨업 대형 팝업 자동 오픈
    L.openAvatarLevelUpModal(level);
  }

  K.openAvatarGreetingPopup = openAvatarGreetingPopup;
  K.closeAvatarGreetingPopup = closeAvatarGreetingPopup;
  K.showLevelUpBanner = showLevelUpBanner;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
