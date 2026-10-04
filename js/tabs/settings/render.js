/**
 * OurGoal Settings Screen Renderer (설정 화면 렌더 — 화면 단위 조립)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 IIFE 에 있던 설정 탭 렌더 코드를 동작 그대로 옮겼다.
 *   renderSettingsHeroCard · collapseAllSettingsSections · toggleAdvancedSettings · formatStorageBytes · paintCacheUsage ·
 *   renderSettingsScreen(머리 + 소블록 6개를 원래 순서로 호출) · 설정 아코디언 햅틱 위임 · 설정 화면 정적 버튼 바인딩
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다.
 * index.html 은 IIFE 맨 위에서 이 키트(window.OurgoalSettingsKit)의 함수를 같은 이름으로 가져와 부른다 — 호출하는 쪽 20여 곳은 그대로다.
 * renderSettingsScreen 은 window 에 새로 노출하지 않는다(노출하면 js/components.js 의 win.renderSettingsScreen 분기가 새로 돌아 동작이 바뀐다).
 * 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
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

  function renderSettingsHeroCard(){
    var card = document.getElementById('settingsHeroCard');
    if(!card) return;
    var p = L.state.profile || {};
    var u = L.state.user || {};
    var nickEl = document.getElementById('settingsHeroNickname');
    if(nickEl) nickEl.textContent = p.displayName || '사용자';
    var rankEl = document.getElementById('settingsHeroRank');
    if(rankEl){
      var activeG = (p.goals || []).filter(function(g){ return !g.archivedAt; }).length;
      var rText = activeG >= 5 ? '열정 마스터' : (activeG >= 1 ? '성장 러너' : '새싹 러너');
      rankEl.textContent = rText;
    }
    // #TASK-ES-248 & #TASK-ES-298: 76px 대형 아바타 링 및 Lv.N 뱃지 오버레이
    var avatarSlot = document.getElementById('settingsHeroAvatarSlot');
    if(avatarSlot && typeof L.avatarHtml === 'function'){
      var xpTotal = (p.settings && p.settings.xp && p.settings.xp.total) || 0;
      var curLv = (typeof L.levelForXP === 'function') ? L.levelForXP(xpTotal) : 1;
      avatarSlot.innerHTML =
        '<div class="toss-settings-avatar-wrap">' +
          L.avatarHtml(76) + /* #TASK-ES-298: 76px 확대 (구 avatarHtml(64) 구 avatarHtml(58)) */
          '<span class="toss-settings-level-badge">Lv.' + curLv + '</span>' +
        '</div>';
    }
    // #TASK-ES-248: 계정 연동 상태(카카오 / 구글 / 회원 / 게스트) 아이콘 표출
    var statusEl = document.getElementById('settingsHeroStatusDesc');
    if(statusEl){
      var isGuest = (!u || !u.id) && (String(p.id || '').indexOf('guest') === 0);
      if(p.provider === 'kakao' || (u.app_metadata && u.app_metadata.provider === 'kakao')){
        statusEl.innerHTML = '<span style="color:#eab308;font-weight:600;white-space:nowrap;">🟡 카카오 계정 연동</span> <span style="white-space:nowrap;">· 5계층 보안 방어선 보호 중</span>';
      } else if(p.provider === 'google' || (u.app_metadata && u.app_metadata.provider === 'google')){
        statusEl.innerHTML = '<span style="color:#3b82f6;font-weight:600;white-space:nowrap;">🔵 구글 계정 연동</span> <span style="white-space:nowrap;">· 5계층 보안 방어선 보호 중</span>';
      } else if(!isGuest && (p.id || u.id)){
        statusEl.innerHTML = '<span style="color:#10b981;font-weight:600;white-space:nowrap;">🟢 회원 계정 연동</span> <span style="white-space:nowrap;">· 5계층 보안 방어선 보호 중</span>';
      } else {
        statusEl.innerHTML = '<span style="color:var(--ink-soft);font-weight:600;white-space:nowrap;">👤 게스트 체험 모드</span> <span style="white-space:nowrap;">· 로컬 샌드박스 안전 보관</span>';
      }
    }
    var goalsEl = document.getElementById('settingsHeroGoalsCount');
    if(goalsEl){
      var activeGoals = (p.goals || []).filter(function(g){ return !g.archivedAt; });
      goalsEl.textContent = activeGoals.length;
    }
    var recordsEl = document.getElementById('settingsHeroRecordsCount');
    if(recordsEl){
      recordsEl.textContent = (p.records || []).length;
    }
    var streakEl = document.getElementById('settingsHeroStreakCount');
    if(streakEl){
      streakEl.textContent = (typeof L.computeStreakDays === 'function' ? L.computeStreakDays() : 0) + '일';
    }
    var btnQuickAv = document.getElementById('btnSettingsQuickAvatar');
    if(btnQuickAv){
      btnQuickAv.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        if(window.OurgoalAvatar && window.OurgoalAvatar.openAvatarModal){
          window.OurgoalAvatar.openAvatarModal({ profile: L.state.profile, state: L.state, saveProfile: L.saveProfile, toast: L.toast, openModal: L.openModal, closeModal: L.closeModal });
        } else {
          var b = document.getElementById('btnOpenAvatarModal');
          if(b) b.click();
        }
      };
    }
    var btnOpenDynamic = document.getElementById('btnOpenDynamicAlbum');
    if(btnOpenDynamic){
      btnOpenDynamic.onclick = function(){
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        if(window.OurgoalAvatar && window.OurgoalAvatar.openDynamicAlbumModal){
          window.OurgoalAvatar.openDynamicAlbumModal({
            profile: L.state.profile,
            state: L.state,
            saveProfile: L.saveProfile,
            toast: L.toast,
            openModal: L.openModal,
            closeModal: L.closeModal,
            renderHome: L.renderHome,
            renderSettingsScreen: renderSettingsScreen
          });
        } else {
          L.toast('아바타 도감을 불러오는 중입니다.');
        }
      };
    }
  }

  /* 이전 전에는 IIFE 실행 중 이 자리에서 바로 등록됐다. 등록 순서를 지키려고 index.html 이 같은 자리에서 이 함수를 부른다. */
  function bindSettingsHapticDelegate(){
    // 설정 아코디언 인터랙션 12ms 햅틱 배선 (#TASK-ES-218)
    document.addEventListener('click', function(e){
      if(e.target && e.target.closest && e.target.closest('.toss-settings-group summary')){
        if(typeof L.triggerHapticFeedback === 'function'){
          L.triggerHapticFeedback(12);
        }
      }
    });
  }

  /* [#TASK-ES-300] 설정창 진입 시 모든 설정 섹션 기본 접힘(Collapsed) 헬퍼 */
  function collapseAllSettingsSections(){
    var accordions = document.querySelectorAll('.settings-group-accordion, .toss-settings-group details, #advancedSettingsAccordion');
    accordions.forEach(function(acc){ acc.open = false; });
  }

  function toggleAdvancedSettings(open){
    var adv = document.getElementById('advancedSettingsAccordion');
    if(adv){
      adv.open = (open !== undefined) ? !!open : !adv.open;
      if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
    }
  }

  /* [#TASK-ES-346 SET-01] 저장공간 표시는 navigator.storage.estimate() 실측값. 못 재면 '측정 불가'. */
  function formatStorageBytes(n){
    if(!(n >= 0)) return null;
    if(n < 1024) return n + ' B';
    if(n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }
  async function paintCacheUsage(){
    var el = document.getElementById('cacheSizeText');
    if(!el) return null;
    var usage = null;
    try {
      if(navigator.storage && typeof navigator.storage.estimate === 'function'){
        var est = await navigator.storage.estimate();
        if(est && typeof est.usage === 'number') usage = est.usage;
      }
    } catch(e){ usage = null; }
    var txt = formatStorageBytes(usage);
    el.textContent = txt ? ('약 ' + txt + ' 사용 중 (브라우저 추정치)') : '사용량 측정 불가';
    el.setAttribute('data-measured', txt ? 'estimate' : 'unavailable');
    return usage;
  }

  function renderSettingsScreen(){
    if(typeof L.triggerHapticFeedback === 'function'){
      L.triggerHapticFeedback(12);
    }
    collapseAllSettingsSections();
    renderSettingsHeroCard();
    L.refreshCustomFeedbackButtons();
    L.renderProfileCard();
    if(typeof OurgoalCredits !== 'undefined'){ OurgoalCredits.renderSettingsSection(document.getElementById('settingsCreditsBlock')).then(function(){ if(window.OurgoalTemplateCredit) window.OurgoalTemplateCredit.renderAdOptIn(document.getElementById('settingsCreditsBlock')); }); } // KF-2 #TASK-ES-017: 선택형 "광고 보고 크레딧 받기"

    var settings = L.state.profile.settings;
    // 🧩 앱을 내맘대로! (#TASK-ES-020) — 로직은 js/customize.js
    var homeLayoutBtn = document.getElementById('homeLayoutOpenBtn');
    if(homeLayoutBtn) homeLayoutBtn.onclick = function(){
      if(!window.OurgoalCustomize){ L.toast('잠시 후 다시 시도해 주세요'); return; }
      OurgoalCustomize.open({ state: L.state, saveProfile: L.saveProfile, toast: L.toast, openModal: L.openModal, closeModal: L.closeModal, track: L.track });
    };

    // 📱 [#TASK-ES-180], [62] 기기 바탕화면 위젯 설정 & 미리보기 모달
    var btnOpenWidget = document.getElementById('btnOpenWidgetModal');
    if(btnOpenWidget){
      btnOpenWidget.onclick = L.openWidgetSettingsModal;
    }
    // [#TASK-ES-354] 여기부터는 소블록 파일로 옮긴 구간이다. 원래 순서 그대로, 위에서 읽은 같은 settings 객체를 넘긴다.
    global.OurgoalSettingsSubProfile.render(settings);
    global.OurgoalSettingsSubSecurity.render(settings);
    global.OurgoalSettingsSubNotify.render(settings);
    global.OurgoalSettingsSubAppearance.render(settings);
    global.OurgoalSettingsSubIntegrations.render(settings);
    global.OurgoalSettingsSubData.render(settings);
  }

  /* 이전 전에는 renderSettingsScreen 바로 뒤에서 IIFE 실행 중 등록됐다. index.html 이 같은 자리에서 이 함수를 부른다. */
  function bindSettingsStaticHandlers(){
    document.getElementById('addTimeBtn').addEventListener('click', async function(){
      L.state.profile.settings.checkinTimes.push('12:00');
      await L.saveProfile(); renderSettingsScreen();
      if(L.state.profile.settings.notify) L.syncPushSubscription();
    });
    document.getElementById('testNotifyBtn').addEventListener('click', function(){
      if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
      if(window.OurgoalNotifyEngine){
        window.OurgoalNotifyEngine.dispatchGlobalNotification({
          type: 'system',
          title: '🔔 아워골 알림 센터',
          body: '전역 알림(사운드·진동·포그라운드 배너·백그라운드)이 완벽하게 연동되었습니다! ✨',
          icon: '🔔'
        });
      } else {
        var msg = L.generateDynamicNotification(L.state.profile);
        L.setTab('home');
        L.showNotifyBanner(msg);
        if('Notification' in window && Notification.permission==='granted'){
          new Notification('아워골', { body: msg });
        }
      }
      L.toast('테스트 알림을 발송했어요! 🔔');
    });
    document.getElementById('settingsExportCheckins').addEventListener('click', L.exportAllCheckins);
    document.getElementById('settingsExportAll').addEventListener('click', function(){
      U.download('아워골_백업_'+L.state.profile.username+'.json', JSON.stringify(L.state.profile, null, 2), 'application/json');
      L.toast('전체 데이터를 내보냈어요');
    });
    document.getElementById('settingsImportAll').addEventListener('click', function(){
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function(e){
      var file = e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = async function(){
        try{
          var data = JSON.parse(reader.result);
          if(!data.username) throw new Error('bad file');
          data.id = L.state.profile.id; // keep current Supabase user id
          data.username = L.state.profile.username;
          L.state.profile = data;
          await L.saveProfile();
          L.renderAll();
          L.toast('가져왔어요');
        } catch(err){
          L.toast('파일을 읽을 수 없어요');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  K.renderSettingsHeroCard = renderSettingsHeroCard;
  K.bindSettingsHapticDelegate = bindSettingsHapticDelegate;
  K.collapseAllSettingsSections = collapseAllSettingsSections;
  K.toggleAdvancedSettings = toggleAdvancedSettings;
  K.formatStorageBytes = formatStorageBytes;
  K.paintCacheUsage = paintCacheUsage;
  K.renderSettingsScreen = renderSettingsScreen;
  K.bindSettingsStaticHandlers = bindSettingsStaticHandlers;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
