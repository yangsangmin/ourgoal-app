/**
 * OurGoal Components Cell: 목표 탭 직통 핸들러 — 일정 배경사진 2장(40)·AI 추천 템플릿 60선 창 제거(64)·목표 템플릿 백과사전(53, openGoalTemplateEncyclopediaModal·copyUserGoalTemplate) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 703~779, 1745~1852, 3610~3706줄).
 *   handle목표탭_Item40Action · handle목표탭_Item64Action · handle목표탭_Item53Action · openGoalTemplateEncyclopediaModal · copyUserGoalTemplate
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 goal 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.goal = KIT.goal || {};

  /**
   * [TASK-ES-290 / 노션 생각메모장 40번]
   * 일정의 배경사진을 최대 2장까지 넣을 수 있게 해서, 1장일 경우는 지금처럼 보여주고, 2장이면 아래위로 2장을 반반씩 보여줌
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle목표탭_Item40Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-40-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (최대 2장, 1장이면 single_full, 2장이면 split_50_50)
      var syncPayload = {
        ticket: '40',
        updated_at: new Date().toISOString(),
        max_backgrounds: 2,
        current_backgrounds: ['bg_sample_1.jpg', 'bg_sample_2.jpg'],
        layout_mode: 'split_50_50',
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-40',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-40_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-40_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('일정 배경사진 최대 2장 및 상하 분할 레이아웃 적용이 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-40] 실행 실패:', err);
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
   * [TASK-ES-315 / 노션 생각메모장 64번]
   * 기존 'AI 추천 목표템플릿 예시 60선' 창 영구 제거 (목표탭·소통탭 템플릿백과사전 일원화) 직통 핸들러
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle목표탭_Item64Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-64-action-btn') : null);
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
      var defaultPayload = {
        ticket: '64',
        task_id: 'TASK-ES-315',
        updated_at: new Date().toISOString(),
        legacy_60_templates_removed: true,
        encyclopedia_unified: true,
        placement: 'goals_and_comm_tab',
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.task64LegacyTemplatesCleaned = true;
      }

      // 목표탭 내 구형 슬롯 완전히 비우기 및 display:none 보장
      if (typeof document !== 'undefined') {
        var tplSlot = document.getElementById('goalsTemplateAccordionSlot');
        if (tplSlot) {
          tplSlot.innerHTML = '';
          tplSlot.style.display = 'none';
        }
      }

      // 템플릿백과사전 열기 옵션이 있을 경우 모달 오픈
      if (syncPayload.openEncyclopedia) {
        if (typeof win.openGoalTemplateEncyclopediaModal === 'function') {
          win.openGoalTemplateEncyclopediaModal();
        } else if (typeof win.openTemplateEncyclopediaModal === 'function') {
          win.openTemplateEncyclopediaModal();
        } else if (typeof document !== 'undefined') {
          var m = document.getElementById('templateEncyclopediaModal');
          if (m) m.style.display = 'flex';
        }
      }

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-64_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-64',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (syncPayload.showToast) {
        if (typeof win.toast === 'function') {
          win.toast('기존 60선 창이 정리되고 템플릿백과사전으로 일원화되었습니다.');
        } else if (typeof win.showToast === 'function') {
          win.showToast('기존 60선 창이 정리되고 템플릿백과사전으로 일원화되었습니다.', { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-315] 실행 실패:', err);
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

  async function handle목표탭_Item53Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-53-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (목표탭 '템플릿백과사전' 전체화면 팝업 신설 및 상호작용 구현)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var syncPayload = {
        ticket: '53',
        updated_at: new Date().toISOString(),
        goal_templates_encyclopedia_active: true,
        event_type: 'goal_templates_encyclopedia_open',
        state: 'completed'
      };

      // 전체화면 템플릿 백과사전 모달 오픈
      if (typeof win.openTemplateEncyclopediaModal === 'function') {
        win.openTemplateEncyclopediaModal();
      } else if (typeof document !== 'undefined') {
        var m = document.getElementById('templateEncyclopediaModal');
        if (m) m.style.display = 'flex';
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-53',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-53_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-53_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      var toastFn = (typeof win.showToast === 'function') ? win.showToast : ((typeof win.toast === 'function') ? win.toast : null);
      if (toastFn) {
        toastFn('목표 템플릿백과사전이 열렸습니다. 실사용 템플릿과 AI 60선 템플릿을 둘러보세요!', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-53] 실행 실패:', err);
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

  function openGoalTemplateEncyclopediaModal() {
    var win = typeof window !== 'undefined' ? window : global;
    if (typeof win.openTemplateEncyclopediaModal === 'function') {
      return win.openTemplateEncyclopediaModal();
    }
    return handle목표탭_Item53Action();
  }

  function copyUserGoalTemplate(tmplId) {
    var win = typeof window !== 'undefined' ? window : global;
    if (typeof win.copyRealUserTemplate === 'function') {
      return win.copyRealUserTemplate(tmplId);
    }
    return handle목표탭_Item53Action();
  }

  K.handle목표탭_Item40Action = handle목표탭_Item40Action;
  K.handle목표탭_Item64Action = handle목표탭_Item64Action;
  K.handle목표탭_Item53Action = handle목표탭_Item53Action;
  K.openGoalTemplateEncyclopediaModal = openGoalTemplateEncyclopediaModal;
  K.copyUserGoalTemplate = copyUserGoalTemplate;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
