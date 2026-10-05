/**
 * OurGoal Components Cell: 성취 통계 직통 핸들러 — 측정지표 다중 선택(43, toggleAchievementMetricFilter)·다중 지표 그래프(56)·껍데기 버튼 정리(60)·데이터 관리 접기 토글(45, toggleDataManagementSection) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 937~1114, 1360~1434, 2790~2890, 3606~3608줄).
 *   toggleAchievementMetricFilter · handle성취통계_Item43Action · handle성취통계_Item56Action · handle성취통계_Item60Action · handle성취통계_Item45Action · toggleDataManagementSection
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 stats 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.stats = KIT.stats || {};

  /**
   * [TASK-ES-293 / 노션 생각메모장 43번]
   * 성취통계 측정지표 다중선택 필터링 기능 구현
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  function toggleAchievementMetricFilter(metricKey, currentSelected) {
    var selected = Array.isArray(currentSelected) ? currentSelected.slice() : ['rate', 'streak'];
    var idx = selected.indexOf(metricKey);
    if (idx > -1) {
      if (selected.length > 1) {
        selected.splice(idx, 1);
      }
    } else {
      selected.push(metricKey);
    }
    return selected;
  }

  async function handle성취통계_Item43Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-43-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (측정지표 다중선택 필터링 갱신)
      var syncPayload = {
        ticket: '43',
        updated_at: new Date().toISOString(),
        selected_metrics: ['rate', 'streak', 'focus_time'],
        filter_mode: 'multi',
        event_type: 'achievement_metrics_multiselect',
        state: 'completed'
      };

      // TASK-ES-307: 상태 및 로컬스토리지에 다중 선택 지표 세팅
      if (win.state) {
        win.state.selectedTrendMetrics = ['duration', 'count', 'rate', 'streak'];
      }
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_trend_metrics', JSON.stringify(['duration', 'count', 'rate', 'streak']));
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-43',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-43_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-43_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('성취통계 측정지표 다중선택 필터가 적용되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-43] 실행 실패:', err);
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
   * [TASK-ES-307 / 노션 생각메모장 56번]
   * 성취통계 다중 선택된 측정지표 데이터 그래프 동시 렌더링 연동 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle성취통계_Item56Action(event, customMetrics) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-56-action-btn') : null);
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
      var metricsToSet = (Array.isArray(customMetrics) && customMetrics.length)
        ? customMetrics
        : ['duration', 'count', 'rate', 'streak'];

      var syncPayload = {
        ticket: '56',
        updated_at: new Date().toISOString(),
        selected_metrics: metricsToSet,
        chart_sync: true,
        renderer: 'multi_dataset_svg',
        state: 'completed'
      };

      if (win.state) {
        win.state.selectedTrendMetrics = metricsToSet.slice();
      }

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_trend_metrics', JSON.stringify(metricsToSet));
        locStorage.setItem('og_task-56_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-56',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.showToast === 'function') {
        win.showToast('성취통계 다중 측정지표 그래프 동시 렌더링이 적용되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-307] 실행 실패:', err);
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
   * [TASK-ES-311 / 노션 생각메모장 60번]
   * 성취통계 메뉴 내 미작동 껍데기 버튼(목표연계·캘린더 등록) 영구 삭제 및 Zero Dead Click 완결
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle성취통계_Item60Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' && global.window ? global.window : (typeof global !== 'undefined' ? global : {}));
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-60-action-btn') : null);
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
      var syncPayload = {
        ticket: '60',
        updated_at: new Date().toISOString(),
        no_dead_click: true,
        removed_buttons: ['uLinkGoalBtn', 'uRegCalendarBtn'],
        stats_clean_state: true,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-60_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-60',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('성취통계 미작동 버튼이 완전히 정리되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('성취통계 미작동 버튼이 완전히 정리되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-311] 실행 실패:', err);
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
   * [TASK-ES-295 / 노션 생각메모장 45번]
   * 성취통계 데이터 관리 옆 접기토글 작동 안함 오류 수정
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle성취통계_Item45Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-45-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (데이터 관리 접기토글 상태 토글 및 갱신)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var currentCache = null;
      if (locStorage && typeof locStorage.getItem === 'function') {
        try {
          var raw = locStorage.getItem('og_task-45_cache');
          if (raw) currentCache = JSON.parse(raw);
        } catch (e) {}
      }

      var isCollapsed = currentCache ? !currentCache.is_collapsed : true;

      var syncPayload = {
        ticket: '45',
        updated_at: new Date().toISOString(),
        is_collapsed: isCollapsed,
        collapse_toggle_active: true,
        data_management_visible: !isCollapsed,
        event_type: 'achievement_collapse_toggle_fix',
        state: 'completed'
      };

      // 실제 DOM 내 데이터 관리 섹션 토글 처리 연동
      if (typeof document !== 'undefined') {
        var dataMgmtSec = document.getElementById('dataManagementSection') || document.querySelector('.data-management-section') || document.getElementById('achievementDataMgmtSection');
        if (dataMgmtSec) {
          dataMgmtSec.style.display = isCollapsed ? 'none' : 'block';
        }
        var toggleIcon = document.getElementById('dataMgmtToggleIcon') || document.querySelector('.data-mgmt-toggle-icon');
        if (toggleIcon) {
          toggleIcon.textContent = isCollapsed ? '▶' : '▼';
        }
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-45',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-45_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-45_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        var toastMsg = isCollapsed ? '데이터 관리 섹션이 접혔습니다.' : '데이터 관리 섹션이 펼쳐졌습니다.';
        win.showToast(toastMsg, { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-45] 실행 실패:', err);
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

  function toggleDataManagementSection(forceState) {
    return handle성취통계_Item45Action();
  }

  K.toggleAchievementMetricFilter = toggleAchievementMetricFilter;
  K.handle성취통계_Item43Action = handle성취통계_Item43Action;
  K.handle성취통계_Item56Action = handle성취통계_Item56Action;
  K.handle성취통계_Item60Action = handle성취통계_Item60Action;
  K.handle성취통계_Item45Action = handle성취통계_Item45Action;
  K.toggleDataManagementSection = toggleDataManagementSection;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
