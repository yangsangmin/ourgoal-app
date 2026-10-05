/**
 * OurGoal Components Cell: 기록·스톱워치 직통 핸들러 — 갓생 스토리카드 다각화(35)·스톱워치 구간 활동기록·초기화 2중 확인(44)·시간기록 모달 간소화(47, toggleTimeRecordModalCompact) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 386~468, 2711~2788, 2994~3102줄).
 *   handle기록스톱워치_Item35Action · handle기록스톱워치_Item44Action · handle기록스톱워치_Item47Action · toggleTimeRecordModalCompact
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 record 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.record = KIT.record || {};

  /**
   * [TASK-ES-AUTO-35] 갓생 스토리카드 다각화(1:1·3:4·9:16 비율 및 항목 선택) 및 피드 즉시 게시 기능 구현 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle기록스톱워치_Item35Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var doc = typeof document !== 'undefined' ? document : null;
    var actionBtn = doc ? doc.getElementById('og-task-35-action-btn') : null;
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
        ticket: '35',
        updated_at: new Date().toISOString(),
        story_card_aspect_ratios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
        available_elements: ['goal', 'avatar', 'record', 'ai_feedback'],
        feed_share_instant: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-35',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-35_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-35_cache', JSON.stringify(syncPayload));
      }

      // 실질적 갓생 스토리카드 모달 오픈 연동
      if (typeof win.openMzShareCardModal === 'function') {
        win.openMzShareCardModal();
      } else if (typeof openMzShareCardModal === 'function') {
        openMzShareCardModal();
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('갓생 스토리카드 다각화 및 피드 게시가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-35] 실행 실패:', err);
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
   * [TASK-ES-294 / 노션 생각메모장 44번]
   * 스톱워치 실시간 구간별 활동기록 팝업·상세 연동 및 초기화 2중 확인 안전장치 구축
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle기록스톱워치_Item44Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-44-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (구간별 활동기록 및 초기화 2중 안전장치)
      var syncPayload = {
        ticket: '44',
        updated_at: new Date().toISOString(),
        lap_activity_modal: true,
        safety_reset_guard: true,
        typing_active_on_finish: true,
        event_type: 'stopwatch_lap_activity_safety',
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-44',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-44_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-44_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('스톱워치 실시간 구간기록 및 2중 안전장치가 활성화되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-44] 실행 실패:', err);
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
   * [TASK-ES-297 / 노션 생각메모장 47번]
   * 시간기록 모달창 세부설명 간소화('시간별로 세부 내용을 작성할 수 있어요') 및 창 크기 축소
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle기록스톱워치_Item47Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-47-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (시간기록 모달창 세부설명 간소화 및 창 크기 축소)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var currentCache = null;
      if (locStorage && typeof locStorage.getItem === 'function') {
        try {
          var raw = locStorage.getItem('og_task-47_cache');
          if (raw) currentCache = JSON.parse(raw);
        } catch (e) {}
      }

      var isCompact = currentCache ? !currentCache.compact_modal_active : true;

      var syncPayload = {
        ticket: '47',
        updated_at: new Date().toISOString(),
        compact_modal_active: isCompact,
        description_simplified: true,
        simplified_text: '시간별로 세부 내용을 작성할 수 있어요',
        event_type: 'time_record_modal_compact',
        state: 'completed'
      };

      // 실제 DOM 내 시간기록 모달 설명 및 크기 축소 클래스 반영
      if (typeof document !== 'undefined') {
        var modalDesc = document.getElementById('timeRecordModalDesc') || document.querySelector('.time-record-modal-desc');
        if (modalDesc) {
          modalDesc.textContent = '시간별로 세부 내용을 작성할 수 있어요';
        }
        var recordModals = document.querySelectorAll('.time-record-modal, #timeRecordModal, .record-modal-box');
        recordModals.forEach(function(m) {
          if (isCompact) {
            m.classList.add('time-record-modal-compact');
          } else {
            m.classList.remove('time-record-modal-compact');
          }
        });
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-47',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-47_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-47_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        var toastMsg = isCompact ? '시간기록 모달이 슬림하게 축소되고 세부설명이 간소화되었습니다.' : '시간기록 모달 기본 규격으로 복원되었습니다.';
        win.showToast(toastMsg, { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-47] 실행 실패:', err);
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

  function toggleTimeRecordModalCompact(forceCompact) {
    return handle기록스톱워치_Item47Action();
  }

  K.handle기록스톱워치_Item35Action = handle기록스톱워치_Item35Action;
  K.handle기록스톱워치_Item44Action = handle기록스톱워치_Item44Action;
  K.handle기록스톱워치_Item47Action = handle기록스톱워치_Item47Action;
  K.toggleTimeRecordModalCompact = toggleTimeRecordModalCompact;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
