/**
 * OurGoal Components Cell: 바탕화면 위젯 직통 핸들러 — 일정·목표·기록 3종 위젯(62, getWidgetRenderSpec) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 1532~1639줄).
 *   getWidgetRenderSpec · handle전체공통_Item62Action
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 widget 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.widget = KIT.widget || {};

  /**
   * [TASK-ES-313 / 노션 생각메모장 62번]
   * 기기 바탕화면용 위젯 3종(일정·목표·기록) × 3구성(compact/standard/detail) 렌더링 스펙 반환
   */
  function getWidgetRenderSpec(type, size) {
    var validTypes = ['calendar', 'goals', 'records'];
    var validSizes = ['compact', 'standard', 'detail'];

    var t = validTypes.indexOf(type) !== -1 ? type : 'calendar';
    var s = validSizes.indexOf(size) !== -1 ? size : 'standard';

    var specs = {
      calendar: {
        compact: { title: '오늘 다음 일정', width: 170, height: 170, link: '/#calendar', description: '오늘의 최우선 다음 일정 1개 및 시간 요약' },
        standard: { title: '오늘의 일정 목록', width: 360, height: 180, link: '/#calendar', description: '오늘 일정 최대 3개 및 완료 여부' },
        detail: { title: '오늘의 24시간 타임라인', width: 360, height: 360, link: '/#calendar', description: '24시간 타임라인 전체 일정 및 진행 현황' }
      },
      goals: {
        compact: { title: '최우선 핵심 목표', width: 170, height: 170, link: '/#goals', description: '최우선 목표 1개 및 달성률 게이지' },
        standard: { title: '핵심 실천 목표 3선', width: 360, height: 180, link: '/#goals', description: '주요 활성 목표 3개 및 진척도 프로그레스' },
        detail: { title: '3계층 목표 & 마일스톤 현황', width: 360, height: 360, link: '/#goals', description: '전체 목표 및 마일스톤 완료율 종합 현황' }
      },
      records: {
        compact: { title: '오늘의 실천 요약', width: 170, height: 170, link: '/#records', description: '오늘 실천 시간 및 원터치 빠른 기록' },
        standard: { title: '최근 실천 기록 & 스톱워치', width: 360, height: 180, link: '/#records', description: '최근 실천 3건 및 빠른 기록 직행' },
        detail: { title: '실천 통계 & 타임로그', width: 360, height: 360, link: '/#records', description: '누적 실천 통계 및 최근 실천 타임로그 리스트' }
      }
    };

    return Object.assign({ type: t, size: s }, specs[t][s]);
  }

  /**
   * [TASK-ES-313 / 노션 생각메모장 62번]
   * 기기 바탕화면용 위젯 기능(일정·목표·기록 3종 × 3가지 구성) 완결
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle전체공통_Item62Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-62-action-btn') : null);
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
      var syncPayload = customPayload || {
        ticket: '62',
        updated_at: new Date().toISOString(),
        widget_suite_enabled: true,
        widget_types: ['calendar', 'goals', 'records'],
        widget_sizes: ['compact', 'standard', 'detail'],
        placement: 'device_desktop_widget',
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-62_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-62',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('기기 바탕화면용 위젯(일정·목표·기록 3종 × 3구성)이 활성화되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('기기 바탕화면용 위젯(일정·목표·기록 3종 × 3구성)이 활성화되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-313] 실행 실패:', err);
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

  K.getWidgetRenderSpec = getWidgetRenderSpec;
  K.handle전체공통_Item62Action = handle전체공통_Item62Action;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
