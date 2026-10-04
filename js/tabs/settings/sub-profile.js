/**
 * OurGoal Settings Sub-Block: Profile & Privacy (공개 범위 · 아바타 인사 팝업 · 실시간 활동 상태)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 38792~38928줄)을 동작 그대로 옮겼다.
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
  function renderProfileSection(settings){
    // 🔒 공개 범위 및 프라이버시 (Req 8)
    if(!settings.privacy) settings.privacy = { goals:"private", calendar:"private", records:"private", stats:"private" };
    var privGoalSel = document.getElementById('privGoalSelect');
    if(privGoalSel){
      privGoalSel.value = settings.privacy.goals || 'private';
      privGoalSel.onchange = async function(){
        settings.privacy.goals = privGoalSel.value;
        await L.saveProfile();
        L.updatePrivacyBadges();
        L.toast('목표 기본 공개 범위를 변경했어요');
      };
    }
    var privCalSel = document.getElementById('privCalSelect');
    if(privCalSel){
      privCalSel.value = settings.privacy.calendar || 'private';
      privCalSel.onchange = async function(){
        settings.privacy.calendar = privCalSel.value;
        await L.saveProfile();
        L.updatePrivacyBadges();
        L.toast('일정 공개 범위를 변경했어요');
      };
    }
    var privRecSel = document.getElementById('privRecSelect');
    if(privRecSel){
      privRecSel.value = settings.privacy.records || 'private';
      privRecSel.onchange = async function(){
        settings.privacy.records = privRecSel.value;
        await L.saveProfile();
        L.updatePrivacyBadges();
        L.toast('기록 공개 범위를 변경했어요');
      };
    }
    var privStatsSel = document.getElementById('privStatsSelect');
    if(privStatsSel){
      privStatsSel.value = settings.privacy.stats || 'private';
      privStatsSel.onchange = async function(){
        settings.privacy.stats = privStatsSel.value;
        await L.saveProfile();
        L.toast('통계 공개 범위를 변경했어요');
      };
    }
    // 🤖 아바타 인사 팝업 커스텀 (#TASK-ES-165, #TASK-ES-191)
    if(!settings.avatarGreeting) {
      settings.avatarGreeting = {
        enabled: true,
        dayStartHour: 4,
        nightStartHour: 16,
        dayGreeting: '',
        nightGreeting: ''
      };
    }
    var agConf = settings.avatarGreeting;
    var agSw = document.getElementById('avatarGreetingSwitch');
    if(agSw){
      var isAgOn = agConf.enabled !== false;
      agSw.className = 'switch' + (isAgOn ? ' on' : '');
      U.a11ySwitch(agSw, isAgOn, '아바타 인사 팝업');
      agSw.onclick = async function(){
        agConf.enabled = !isAgOn;
        await L.saveProfile();
        K.renderSettingsScreen();
        L.toast(agConf.enabled ? '아바타 인사 팝업을 켰어요' : '아바타 인사 팝업을 껐어요');
      };
    }
    var agDayHourSel = document.getElementById('avatarGreetingDayHour');
    if(agDayHourSel){
      if(agDayHourSel.options.length === 0){
        for(var h = 0; h < 24; h++){
          var opt = document.createElement('option');
          opt.value = h;
          opt.textContent = (h < 12 ? '오전 ' : '오후 ') + (h === 0 ? 12 : (h > 12 ? h - 12 : h)) + '시 (' + (h < 10 ? '0' + h : h) + ':00)';
          agDayHourSel.appendChild(opt);
        }
      }
      agDayHourSel.value = typeof agConf.dayStartHour === 'number' ? agConf.dayStartHour : 4;
      agDayHourSel.onchange = async function(){
        agConf.dayStartHour = parseInt(agDayHourSel.value, 10);
        await L.saveProfile();
        L.toast('주간 시작 시간을 변경했어요');
      };
    }
    var agNightHourSel = document.getElementById('avatarGreetingNightHour');
    if(agNightHourSel){
      if(agNightHourSel.options.length === 0){
        for(var nh = 0; nh < 24; nh++){
          var nopt = document.createElement('option');
          nopt.value = nh;
          nopt.textContent = (nh < 12 ? '오전 ' : '오후 ') + (nh === 0 ? 12 : (nh > 12 ? nh - 12 : nh)) + '시 (' + (nh < 10 ? '0' + nh : nh) + ':00)';
          agNightHourSel.appendChild(nopt);
        }
      }
      agNightHourSel.value = typeof agConf.nightStartHour === 'number' ? agConf.nightStartHour : 16;
      agNightHourSel.onchange = async function(){
        agConf.nightStartHour = parseInt(agNightHourSel.value, 10);
        await L.saveProfile();
        L.toast('야간 시작 시간을 변경했어요');
      };
    }
    var agDayMsgInput = document.getElementById('avatarGreetingDayMsg');
    if(agDayMsgInput){
      // [#TASK-ES-191] 입력창 지움 피로도 근절: 기본값은 placeholder로만 안내
      agDayMsgInput.value = agConf.dayGreeting || '';
      agDayMsgInput.placeholder = '오늘은 뭘 할거냐? 내자신';
      agDayMsgInput.onchange = async function(){
        agConf.dayGreeting = agDayMsgInput.value.trim();
        await L.saveProfile();
        L.toast('주간 인사 멘트를 저장했어요');
      };
    }
    var agNightMsgInput = document.getElementById('avatarGreetingNightMsg');
    if(agNightMsgInput){
      agNightMsgInput.value = agConf.nightGreeting || '';
      agNightMsgInput.placeholder = '오늘은 뭘 했냐? 내자신';
      agNightMsgInput.onchange = async function(){
        agConf.nightGreeting = agNightMsgInput.value.trim();
        await L.saveProfile();
        L.toast('야간 인사 멘트를 저장했어요');
      };
    }
    var agPreviewBtn = document.getElementById('btnPreviewAvatarGreeting');
    if(agPreviewBtn){
      agPreviewBtn.onclick = function(){
        L.openAvatarGreetingPopup(L.state.profile, true);
      };
    }

    var onlineSw = document.getElementById('onlineStatusSwitch');
    if(onlineSw){
      var isOnline = settings.onlineStatus !== false;
      onlineSw.className = 'switch' + (isOnline ? ' on' : '');
      U.a11ySwitch(onlineSw, isOnline, '실시간 활동 상태 표시');
      onlineSw.onclick = async function(){
        settings.onlineStatus = !isOnline;
        await L.saveProfile();
        K.renderSettingsScreen();
      };
    }
  }

  var OurgoalSettingsSubProfile = {
    id: 'profile',
    megaBlockId: 'settings',
    name: '공개 범위·아바타 인사·활동 상태',
    containerId: 'profileCard',

    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */
    render: renderProfileSection,

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
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/profile');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubProfile;
  }
  global.OurgoalSettingsSubProfile = OurgoalSettingsSubProfile;
})(typeof window !== 'undefined' ? window : globalThis);
