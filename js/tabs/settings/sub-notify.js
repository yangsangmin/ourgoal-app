/**
 * OurGoal Settings Sub-Block: Check-in Times & Notifications (체크인 시간 · 알림 센터 · 방해금지 · 유형별 알림)
 *
 * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 39003~39204줄)을 동작 그대로 옮겼다.
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
  function renderNotifySection(settings){
    // 체크인 시간 설정
    var row = document.getElementById('checkinTimesRow');
    var times = (settings && Array.isArray(settings.checkinTimes)) ? settings.checkinTimes : ["10:00","15:00","21:00"];
    if(settings) settings.checkinTimes = times;
    row.innerHTML = times.map(function(t, i){
      return '<div class="time-chip"><input type="time" value="'+t+'" data-timeidx="'+i+'" aria-label="체크인 시간 '+(i+1)+'"><button class="icon-btn" data-timedel="'+i+'" style="margin-left:4px;" aria-label="체크인 시간 삭제">×</button></div>';
    }).join('');
    row.querySelectorAll('[data-timeidx]').forEach(function(inp){
      inp.addEventListener('change', async function(){
        times[+inp.dataset.timeidx] = inp.value;
        await L.saveProfile();
        if(settings.notify) L.syncPushSubscription();
      });
    });
    row.querySelectorAll('[data-timedel]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        times.splice(+btn.dataset.timedel, 1);
        await L.saveProfile(); K.renderSettingsScreen();
        if(settings.notify) L.syncPushSubscription();
      });
    });
    var presetTimesBtn = document.getElementById('presetTimesBtn');
    if(presetTimesBtn){
      presetTimesBtn.onclick = async function(){
        settings.checkinTimes = ['07:15', '12:30', '18:45', '23:15'];
        await L.saveProfile();
        K.renderSettingsScreen();
        if(settings.notify) L.syncPushSubscription();
        L.toast('추천 4회 루틴(아침·점심·퇴근·취침 전)으로 설정했어요');
        L.triggerHaptic(15);
      };
    }
    // 🔔 [#TASK-ES-152] 전역 알림 설정 센터 바인딩
    if(!L.state.profile.settings.notifications){
      L.state.profile.settings.notifications = {
        feedbackMode: 'all',
        privacyLevel: 'detail',
        dmMessages: true,
        teamActivities: true,
        goalReminders: true,
        bgEnabled: true
      };
    }
    var notifConfig = L.state.profile.settings.notifications;

    // 1. 피드백 모드 (소리/진동)
    var fbModeGrid = document.getElementById('notifFeedbackModeGrid');
    if(fbModeGrid){
      fbModeGrid.querySelectorAll('[data-notifmode]').forEach(function(btn){
        var mode = btn.dataset.notifmode;
        btn.classList.toggle('active', (notifConfig.feedbackMode || 'all') === mode);
        btn.onclick = async function(){
          notifConfig.feedbackMode = mode;
          if(mode === 'all' || mode === 'sound'){
            if(window.OurgoalNotifyEngine) window.OurgoalNotifyEngine.playNotificationSound();
          }
          if(mode === 'all' || mode === 'vibrate'){
            if(window.OurgoalNotifyEngine) window.OurgoalNotifyEngine.vibrate([80, 40, 80]);
          }
          await L.saveProfile();
          K.renderSettingsScreen();
          var labels = { all: '소리+진동', sound: '소리만', vibrate: '진동만', silent: '무음' };
          L.toast('알림 피드백을 ' + labels[mode] + '(으)로 설정했어요');
        };
      });
    }

    // 2. 알림 프라이버시 토글
    var privToggle = document.getElementById('notifPrivacyToggle');
    if(privToggle){
      privToggle.querySelectorAll('[data-privacy]').forEach(function(btn){
        var pLevel = btn.dataset.privacy;
        btn.classList.toggle('active', (notifConfig.privacyLevel || 'detail') === pLevel);
        btn.onclick = async function(){
          notifConfig.privacyLevel = pLevel;
          await L.saveProfile();
          K.renderSettingsScreen();
          L.toast(pLevel === 'summary' ? '알림 보안 마스킹(간략형)이 적용되었어요' : '알림 상세 내용 표시가 설정되었어요');
        };
      });
    }

    // 3. 백그라운드 Web Notification 토글
    var bgSw = document.getElementById('notifBgSwitch');
    if(bgSw){
      var isBg = notifConfig.bgEnabled !== false;
      bgSw.className = 'switch' + (isBg ? ' on' : '');
      U.a11ySwitch(bgSw, isBg, '백그라운드 Web Notification 수신');
      bgSw.onclick = async function(){
        notifConfig.bgEnabled = !isBg;
        await L.saveProfile();
        K.renderSettingsScreen();
        L.toast(notifConfig.bgEnabled ? '백그라운드 알림을 켰어요' : '백그라운드 알림을 껐어요');
      };
    }

    // 4. 시스템 권한 상태 및 요청 버튼
    var permLabel = document.getElementById('notifPermStatusLabel');
    var reqPermBtn = document.getElementById('btnReqNotifPerm');
    if(permLabel){
      if(typeof window !== 'undefined' && ('Notification' in window)){
        var pStatus = Notification.permission;
        if(pStatus === 'granted'){
          permLabel.innerHTML = '<span style="color:#10b981;font-weight:700;">✓ 허용됨</span> (백그라운드 알림 가능)';
          if(reqPermBtn) reqPermBtn.style.display = 'none';
        } else if(pStatus === 'denied'){
          permLabel.innerHTML = '<span style="color:var(--brand-strong);font-weight:700;">✗ 차단됨</span> (브라우저 설정에서 허용)';
          if(reqPermBtn){
            reqPermBtn.textContent = '설정 안내';
            reqPermBtn.onclick = function(){ alert('브라우저 주소창 좌측의 사이트 설정 아이콘을 눌러 알림을 [허용]으로 변경해주세요.'); };
          }
        } else {
          permLabel.innerHTML = '<span style="color:#f59e0b;font-weight:700;">미설정</span> (권한 요청 필요)';
          if(reqPermBtn){
            reqPermBtn.textContent = '권한 요청';
            reqPermBtn.onclick = async function(){
              var res = await (window.OurgoalNotifyEngine ? window.OurgoalNotifyEngine.requestPermission() : Notification.requestPermission());
              K.renderSettingsScreen();
              if(res === 'granted') L.toast('시스템 알림 권한이 허용되었어요! 🎉');
              else L.toast('시스템 알림 권한이 거부되었어요');
            };
          }
        }
      } else {
        permLabel.textContent = '현재 브라우저 미지원';
        if(reqPermBtn) reqPermBtn.style.display = 'none';
      }
    }

    var sw = document.getElementById('notifySwitch');
    sw.className = 'switch' + (settings.notify ? ' on' : '');
    U.a11ySwitch(sw, settings.notify, '체크인 시간에 알림 받기 (앱을 꺼도 와요)');
    sw.onclick = async function(){
      if(!settings.notify){
        if('Notification' in window){
          var granted = await L.openNotificationSoftAskModal();
          if(!granted){
            L.toast('알림 권한이 허용되지 않았어요');
            return;
          }
        }
        settings.notify = true;
        L.syncPushSubscription();
      } else {
        settings.notify = false;
        L.removePushSubscription();
      }
      await L.saveProfile();
      K.renderSettingsScreen();
      L.setupNotifyTimer();
    };
    // 🔔 야간 방해금지 및 유형별 알림 제어 (Req 10)
    var qhSw = document.getElementById('quietHoursSwitch');
    var qhRow = document.getElementById('quietHoursRow');
    if(qhSw){
      var qhOn = !!settings.quietHoursEnabled;
      qhSw.className = 'switch' + (qhOn ? ' on' : '');
      U.a11ySwitch(qhSw, qhOn, '야간 방해금지 모드');
      if(qhRow) qhRow.style.display = qhOn ? 'flex' : 'none';
      qhSw.onclick = async function(){
        settings.quietHoursEnabled = !qhOn;
        await L.saveProfile();
        K.renderSettingsScreen();
        L.toast(settings.quietHoursEnabled ? '야간 방해금지 모드가 켜졌어요' : '야간 방해금지 모드가 꺼졌어요');
      };
    }
    var qhStart = document.getElementById('quietStartInput');
    if(qhStart){
      qhStart.value = settings.quietHoursStart || '22:00';
      qhStart.onchange = async function(){
        settings.quietHoursStart = qhStart.value;
        await L.saveProfile();
      };
    }
    var qhEnd = document.getElementById('quietEndInput');
    if(qhEnd){
      qhEnd.value = settings.quietHoursEnd || '08:00';
      qhEnd.onchange = async function(){
        settings.quietHoursEnd = qhEnd.value;
        await L.saveProfile();
      };
    }
    var wireNotifSwitch = function(id, configKey, legacyProp, label){
      var el = document.getElementById(id);
      if(!el) return;
      var currentVal = (notifConfig[configKey] !== false) && (settings[legacyProp] !== false);
      el.className = 'switch' + (currentVal ? ' on' : '');
      U.a11ySwitch(el, currentVal, label);
      el.onclick = async function(){
        var nextVal = !currentVal;
        notifConfig[configKey] = nextVal;
        settings[legacyProp] = nextVal;
        await L.saveProfile();
        K.renderSettingsScreen();
        L.toast(label + (nextVal ? '을(를) 켰어요' : '을(를) 껐어요'));
      };
    };
    wireNotifSwitch('notifDmSwitch', 'dmMessages', 'notifDm', '1:1 DM 및 메시지 수신 알림');
    wireNotifSwitch('notifTeamSwitch', 'teamActivities', 'notifTeamVerify', '팀원 일일 인증 알림');
    wireNotifSwitch('notifCheersSwitch', 'cheerActivities', 'notifCheers', '응원 및 댓글 알림');
    wireNotifSwitch('notifDdaySwitch', 'goalReminders', 'notifDday', '마감 D-day 임박 알림');
    wireNotifSwitch('notifStreakSwitch', 'streakReminders', 'notifStreak', '일일 스트릭 유지 리마인더');
  }

  var OurgoalSettingsSubNotify = {
    id: 'notify',
    megaBlockId: 'settings',
    name: '체크인 시간·알림',
    containerId: 'checkinTimesRow',

    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */
    render: renderNotifySection,

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
      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/notify');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalSettingsSubNotify;
  }
  global.OurgoalSettingsSubNotify = OurgoalSettingsSubNotify;
})(typeof window !== 'undefined' ? window : globalThis);
