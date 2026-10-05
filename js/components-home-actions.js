/**
 * OurGoal Components Cell: 홈 탭 직통 핸들러 — 오늘의 퀘스트 할일 미션(33)·홈 목표현황판 지표 정리(34)·평가 상시 안내 문구(66) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 234~384, 1955~2060줄).
 *   handle홈탭_Item33Action · handle홈탭_Item34Action · handle홈탭_Item66Action
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 home 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.home = KIT.home || {};

  /**
   * [TASK-ES-AUTO-33 / #TASK-ES-284] 오늘의 퀘스트 미션 변경 ('핵심 마일스톤 1개' -> '할일 1개' 실행 및 10EXP 보상 조정) 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle홈탭_Item33Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-33-action-btn') : null;
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
        ticket: '33',
        updated_at: new Date().toISOString(),
        quest_target: 'todo_1',
        exp_reward: 10,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-33',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-33_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-33_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('오늘의 퀘스트: 할일 1개 완료 (+10 EXP) 보상 조정이 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-33] 실행 실패:', err);
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
   * [TASK-ES-AUTO-34] 홈 목표현황판 불필요 지표(진행중 목표·평균달성률·병행분야) 삭제 및 인터페이스 최적화 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle홈탭_Item34Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var doc = typeof document !== 'undefined' ? document : null;
    var actionBtn = doc ? doc.getElementById('og-task-34-action-btn') : null;
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
        ticket: '34',
        updated_at: new Date().toISOString(),
        goal_board_cleanup: true,
        removed_metrics: ['in_progress_goals', 'average_rate', 'parallel_categories'],
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-34',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-34_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-34_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('홈 목표현황판 불필요 지표 삭제 및 인터페이스 최적화가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-34] 실행 실패:', err);
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
   * [TASK-ES-317 / 노션 생각메모장 66번]
   * 아워골 평가해주기 창 밑에 '언제 얼마든지 평가해주실 수 있습니다' 문구 추가 (평가 1회성 오해 해소 및 상시 평가 보장)
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle홈탭_Item66Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-66-action-btn') : null);
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
        ticket: '66',
        task_id: 'TASK-ES-317',
        updated_at: new Date().toISOString(),
        evaluation_notice_added: true,
        notice_text: '언제 얼마든지 평가해주실 수 있습니다',
        recurring_evaluation_guaranteed: true,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.appEvaluationAlwaysNotice = true;
      }

      // 로컬 스토리지 캐시 영속화
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-66_cache', JSON.stringify(syncPayload));
        }
      } catch (e) {
        console.warn('[TASK-ES-317] 로컬 캐시 저장 생략:', e);
      }

      // Supabase audit_logs/sync_events upsert 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'app_evaluation_notice_view',
            payload: syncPayload,
            created_at: new Date().toISOString()
          }).then(function(){}, function(err){
            console.warn('[TASK-ES-317] Supabase 로그 실패 무시:', err);
          });
        } catch (sbErr) {
          console.warn('[TASK-ES-317] Supabase 비동기 적재 무시:', sbErr);
        }
      }

      // 모달 열기 요청이 있으면 열기
      if (syncPayload.openModal && typeof win.openAppEvaluationModal === 'function') {
        win.openAppEvaluationModal();
      }

      // 피드백 토스트
      if (!syncPayload.silent) {
        var msg = '언제 얼마든지 평가해주실 수 있습니다! 소중한 의견을 들려주세요 ⭐';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-317] 실행 실패:', err);
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

  K.handle홈탭_Item33Action = handle홈탭_Item33Action;
  K.handle홈탭_Item34Action = handle홈탭_Item34Action;
  K.handle홈탭_Item66Action = handle홈탭_Item66Action;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
