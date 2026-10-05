/**
 * OurGoal Components Cell: 인증 직통 핸들러 — 중복 닉네임 방지 고유 태그(69)·로그인 기기 목록·세션 제어(70)·2단계 인증(71) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 2277~2600줄).
 *   handle인증_Item69Action · handle인증_Item70Action · handle인증_Item71Action
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 auth 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.auth = KIT.auth || {};

  /**
   * [TASK-ES-320 / 노션 생각메모장 69번]
   * 카카오 로그인 일원화 동명이인 가입/중복 닉네임 방지 고유 태그 부여 및 동반자 핀포인트 매칭 완결
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle인증_Item69Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-69-action-btn') : null);
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

    try {
      var nowIso = new Date().toISOString();
      var defaultPayload = {
        ticket: '69',
        task_id: 'TASK-ES-320',
        updated_at: nowIso,
        unique_display_name_guaranteed: true,
        tag_collision_guard_active: true,
        companion_matching_enhanced: true,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.uniqueDisplayNameGuaranteed = true;
      }

      // 로컬 스토리지 캐시 영속화
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-69_cache', JSON.stringify(syncPayload));
        }
      } catch (e) {
        console.warn('[TASK-ES-320] 로컬 캐시 저장 생략:', e);
      }

      // Supabase user_action_logs 비동기 적재 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'unique_display_name_guaranteed',
            payload: syncPayload,
            created_at: nowIso
          }).then(function(){}, function(err){
            console.warn('[TASK-ES-320] Supabase 로그 실패 무시:', err);
          });
        } catch (sbErr) {
          console.warn('[TASK-ES-320] Supabase 비동기 적재 무시:', sbErr);
        }
      }

      // 피드백 토스트
      if (!syncPayload.silent) {
        var msg = '동명이인 가입 방지 고유 태그 및 동반자 핀포인트 매칭이 완벽히 동기화되었습니다 ✨';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-320] 실행 실패:', err);
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

  /**
   * [TASK-ES-321 / 노션 생각메모장 70번]
   * 원격 로그아웃 전 로그인 기기 목록 확인 및 개별 세션 제어 기능 구현
   * 기기 5대 식별 앵커·실시간 끄기 시각적 피드백·일괄 로그아웃 전 사전 2중 확인 모달·양방향 원자적 상태 전이 완결
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle인증_Item70Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-70-action-btn') : null);
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

    try {
      var nowIso = new Date().toISOString();
      var defaultPayload = {
        ticket: '70',
        task_id: 'TASK-ES-321',
        updated_at: nowIso,
        device_session_control_active: true,
        remote_session_control_active: true,
        device_list_inspection_enabled: true,
        device_list_precheck_enforced: true,
        realtime_revoke_feedback_guaranteed: true,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.deviceSessionControlActive = true;
      }

      // 로컬 스토리지 캐시 영속화
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-70_cache', JSON.stringify(syncPayload));
        }
      } catch (e) {
        console.warn('[TASK-ES-321] 로컬 캐시 저장 생략:', e);
      }

      // Supabase user_action_logs 비동기 적재 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'device_session_control_active',
            payload: syncPayload,
            created_at: nowIso
          }).then(function(){}, function(err){
            console.warn('[TASK-ES-321] Supabase 로그 실패 무시:', err);
          });
        } catch (sbErr) {
          console.warn('[TASK-ES-321] Supabase 비동기 적재 무시:', sbErr);
        }
      }

      // 기기 목록 화면이 열려 있다면 즉시 리렌더링
      if (typeof win.renderActiveDevicesList === 'function') {
        win.renderActiveDevicesList();
      }

      // 피드백 토스트
      if (!syncPayload.silent) {
        var msg = '로그인 기기 목록 확인 및 개별 세션 제어 기능이 완벽히 동기화되었습니다 ✨';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderSettingsScreen === 'function') win.renderSettingsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-321] 실행 실패:', err);
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

  /**
   * [TASK-ES-322 / 노션 생각메모장 71번]
   * 2단계 인증(2FA) 실질적 보안 작동 및 무결성 복구
   * 설정 스위치-PIN 모달 직접 연동·해제 시 기존 PIN 검증 2중 보안·PIN 변경 지원·앱 진입 시 챌린지 락 및 우회 원천 차단 완결
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle인증_Item71Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-71-action-btn') : null);
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

    try {
      var nowIso = new Date().toISOString();
      var defaultPayload = {
        ticket: '71',
        task_id: 'TASK-ES-322',
        updated_at: nowIso,
        two_factor_auth_active: true,
        two_factor_pin_enforced: true,
        app_entry_challenge_guaranteed: true,
        disable_pin_verification_active: true,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.twoFactorAuth = true;
        if (syncPayload.pin) {
          win.state.profile.settings.twoFactorPin = syncPayload.pin;
        }
      }

      // 로컬 스토리지 캐시 영속화
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-71_cache', JSON.stringify(syncPayload));
        }
      } catch (e) {
        console.warn('[TASK-ES-322] 로컬 캐시 저장 생략:', e);
      }

      // Supabase user_action_logs 비동기 적재 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'two_factor_auth_active',
            payload: syncPayload,
            created_at: nowIso
          }).then(function(){}, function(err){
            console.warn('[TASK-ES-322] Supabase 로그 실패 무시:', err);
          });
        } catch (sbErr) {
          console.warn('[TASK-ES-322] Supabase 비동기 적재 무시:', sbErr);
        }
      }

      // 피드백 토스트
      if (!syncPayload.silent) {
        var msg = '2단계 인증(2FA) 실질적 보안 작동 및 무결성이 복구되었습니다 🔐';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderSettingsScreen === 'function') win.renderSettingsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-322] 실행 실패:', err);
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

  K.handle인증_Item69Action = handle인증_Item69Action;
  K.handle인증_Item70Action = handle인증_Item70Action;
  K.handle인증_Item71Action = handle인증_Item71Action;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
