/**
 * OurGoal Components Cell: 설정 직통 핸들러 — 설정창 개편(38)·테마 4종(79, handle테마_Item79Action)·설정 섹션 접기(50, collapseAllSettingsSections·toggleSettingsSectionCollapse) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 546~622, 2602~2709, 3302~3381, 3590~3600줄).
 *   handle전체공통_Item38Action · handle설정_Item79Action · handle테마_Item79Action · handle전체공통_Item50Action · collapseAllSettingsSections · toggleSettingsSectionCollapse
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 settings 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.settings = KIT.settings || {};

  /**
   * [TASK-ES-AUTO-38] 설정창 전면 개편 (기능 그룹화 및 인터페이스 간소화·압축) 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle전체공통_Item38Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var doc = win.document || (typeof document !== 'undefined' ? document : null);
    var container = doc ? doc.getElementById('og-task-38-container') : null;
    var actionBtn = doc ? doc.getElementById('og-task-38-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '38',
        updated_at: new Date().toISOString(),
        settings_reorg: true,
        grouped: true,
        compact_mode: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-38',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-38_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-38_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('설정창 전면 개편 (기능 그룹화 및 인터페이스 간소화·압축) 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-38] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
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
   * [TASK-ES-330 / 노션 생각메모장 79번]
   * 설정 화면&홈 구성 화면스타일 테마 4종(focus-sanctuary, black, white, urban-city) 압축 및 시인성·동일 작동 전면 개선
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle설정_Item79Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-79-action-btn') : null);
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
      var requestedTheme = (customPayload && customPayload.theme) || (event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.themeid) || 'focus-sanctuary';
      if (requestedTheme === 'dark') requestedTheme = 'black';
      if (requestedTheme === 'light' || requestedTheme === 'system') requestedTheme = 'white';
      if (['focus-sanctuary', 'black', 'white', 'urban-city'].indexOf(requestedTheme) === -1) {
        requestedTheme = 'focus-sanctuary';
      }

      var nowIso = new Date().toISOString();
      var defaultPayload = {
        ticket: '79',
        task_id: 'TASK-ES-330',
        updated_at: nowIso,
        theme: requestedTheme,
        themes_v4_supported: ['focus-sanctuary', 'black', 'white', 'urban-city'],
        contrast_boost_active: true,
        high_visibility_active: true,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.theme = requestedTheme;
      }

      // 로컬 스토리지 캐시 영속화 (og_task-79_cache 및 ourgoal_current_theme)
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-79_cache', JSON.stringify(syncPayload));
          storage.setItem('ourgoal_current_theme', requestedTheme);
        }
      } catch (e) {
        console.warn('[TASK-ES-330] 로컬 캐시 저장 생략:', e);
      }

      // 테마 직접 전파
      if (typeof win.applyTheme === 'function') {
        win.applyTheme(requestedTheme);
      } else if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', requestedTheme);
      }

      // Supabase user_action_logs 비동기 적재 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'settings_theme_switch_v4',
            payload: syncPayload,
            created_at: nowIso
          }).then(function(){}).catch(function(){});
        } catch (e) {}
      }

      // 4대 뷰 원자적 동시 전파
      if (typeof win.renderSettingsScreen === 'function') win.renderSettingsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-330] 실행 실패:', err);
      if (typeof win.toast === 'function') {
        win.toast('테마 적용 중 오류가 발생했습니다.');
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  async function handle테마_Item79Action(event, customPayload) {
    return handle설정_Item79Action(event, customPayload);
  }

  async function handle전체공통_Item50Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-50-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (설정창 진입 시 모든 섹션 기본 접힘 상태 적용)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var syncPayload = {
        ticket: '50',
        updated_at: new Date().toISOString(),
        settings_collapsed_default: true,
        event_type: 'settings_collapse_default',
        state: 'completed'
      };

      // 실제 DOM 내 설정 아코디언 일괄 접힘 실행
      if (typeof document !== 'undefined') {
        var accordions = document.querySelectorAll('.settings-group-accordion, .toss-settings-group details, #advancedSettingsAccordion');
        accordions.forEach(function(acc){ acc.open = false; });
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-50',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-50_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-50_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      var toastFn = (typeof win.showToast === 'function') ? win.showToast : ((typeof win.toast === 'function') ? win.toast : null);
      if (toastFn) {
        toastFn('설정창 진입 시 모든 설정 섹션 기본 접힘(Collapsed) 상태 적용 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderSettingsScreen === 'function') win.renderSettingsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-50] 실행 실패:', err);
      var errToast = (typeof win.showToast === 'function') ? win.showToast : ((typeof win.toast === 'function') ? win.toast : null);
      if (errToast) {
        errToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
    }
  }

  function collapseAllSettingsSections() {
    if (typeof document !== 'undefined') {
      var accordions = document.querySelectorAll('.settings-group-accordion, .toss-settings-group details, #advancedSettingsAccordion');
      accordions.forEach(function(acc){ acc.open = false; });
    }
    return handle전체공통_Item50Action();
  }

  function toggleSettingsSectionCollapse(sectionId) {
    return handle전체공통_Item50Action();
  }

  K.handle전체공통_Item38Action = handle전체공통_Item38Action;
  K.handle설정_Item79Action = handle설정_Item79Action;
  K.handle테마_Item79Action = handle테마_Item79Action;
  K.handle전체공통_Item50Action = handle전체공통_Item50Action;
  K.collapseAllSettingsSections = collapseAllSettingsSections;
  K.toggleSettingsSectionCollapse = toggleSettingsSectionCollapse;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
