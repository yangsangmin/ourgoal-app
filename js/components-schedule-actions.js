/**
 * OurGoal Components Cell: 일정 직통 핸들러 — 일정 편집 사전 알림 설정(65) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 1854~1953줄).
 *   handle일정_Item65Action
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 schedule 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.schedule = KIT.schedule || {};

  /**
   * [TASK-ES-316 / 노션 생각메모장 65번]
   * 일정 편집 내 사전 알림 설정(울릴 시간 N분 전 지정) 직통 핸들러
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle일정_Item65Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-65-action-btn') : null);
    if (actionBtn) {
      if (actionBtn.disabled) return;
      actionBtn.disabled = true;
    }

    // 1. 12ms 햅틱 피드백
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }
    if (typeof win.triggerHapticFeedback === 'function') {
      try {
        win.triggerHapticFeedback(12);
      } catch (e) {}
    }

    try {
      var defaultPayload = {
        ticket: '65',
        task_id: 'TASK-ES-316',
        updated_at: new Date().toISOString(),
        schedule_notification_configured: true,
        notifyEnabled: true,
        notifyMinutes: 10,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.scheduleNotificationEnabled = syncPayload.notifyEnabled;
        win.state.profile.settings.defaultScheduleNotifyMinutes = syncPayload.notifyMinutes;
      }

      // 알림 엔진 즉시 체크 실행
      if (win.OurgoalNotifyEngine && typeof win.OurgoalNotifyEngine.checkScheduleReminders === 'function') {
        try { win.OurgoalNotifyEngine.checkScheduleReminders(); } catch (e) {}
      }

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-65_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-65',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (syncPayload.showToast) {
        var timingStr = (syncPayload.notifyMinutes === 0 ? '정시' : syncPayload.notifyMinutes + '분 전');
        var msg = '일정 사전 알림이 설정되었습니다 (' + timingStr + ').';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-316] 실행 실패:', err);
      if (typeof win.toast === 'function') {
        win.toast('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  K.handle일정_Item65Action = handle일정_Item65Action;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
