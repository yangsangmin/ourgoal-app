/**
 * OurGoal Components Cell: 아바타 직통 핸들러 — 레벨업 대사(41)·경험치 축하 팝업(42)·아바타 아이콘 일괄 확대(48, enlargeAvatarIconsBatch) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 781~935, 3104~3213, 3602~3604줄).
 *   handle아바타_Item41Action · handle아바타_Item42Action · handle아바타_Item48Action · enlargeAvatarIconsBatch
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 avatar 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.avatar = KIT.avatar || {};

  /**
   * [TASK-ES-291 / 노션 생각메모장 41번]
   * 레벨업 할 때 아바타가 “진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!” 멘트 하면서 나타나게 해야해
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle아바타_Item41Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-41-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (레벨업 축하 및 배경 변경 도발 대사)
      var syncPayload = {
        ticket: '41',
        updated_at: new Date().toISOString(),
        dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
        event_type: 'levelup_dialogue',
        suggest_background_change: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-41',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-41_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-41_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!', { type: 'success', duration: 2500 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-41] 실행 실패:', err);
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
   * [TASK-ES-292 / 노션 생각메모장 42번]
   * 경험치 획득 시 아바타 축하 팝업 연출("잘했다! 내 자신!") 구현
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle아바타_Item42Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-42-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (경험치 획득 시 아바타 축하 대사)
      var syncPayload = {
        ticket: '42',
        updated_at: new Date().toISOString(),
        dialogue: '잘했다! 내 자신!',
        event_type: 'exp_celebration',
        celebration_active: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-42',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-42_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-42_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('잘했다! 내 자신!', { type: 'success', duration: 2500 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-42] 실행 실패:', err);
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
   * [TASK-ES-298 / 노션 생각메모장 48번]
   * 홈 경험치창·각 탭 우측상단 프로필·설정창 아바타 아이콘 크기 일괄 확대
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle아바타_Item48Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-48-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (아바타 아이콘 크기 일괄 확대)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var currentCache = null;
      if (locStorage && typeof locStorage.getItem === 'function') {
        try {
          var raw = locStorage.getItem('og_task-48_cache');
          if (raw) currentCache = JSON.parse(raw);
        } catch (e) {}
      }

      var isEnlarged = currentCache ? !currentCache.enlarged_all_active : true;

      var syncPayload = {
        ticket: '48',
        updated_at: new Date().toISOString(),
        enlarged_all_active: isEnlarged,
        home_exp_size: isEnlarged ? 76 : 72,
        topbar_size: isEnlarged ? 56 : 52,
        settings_size: isEnlarged ? 76 : 64,
        event_type: 'avatar_icon_enlarge_all',
        state: 'completed'
      };

      // 실제 DOM 내 아바타 크기 반영 (홈 경험치, 상단바, 설정창)
      if (typeof document !== 'undefined') {
        var topAv = document.getElementById('topAvatar');
        if (topAv) {
          topAv.style.width = isEnlarged ? '56px' : '52px';
          topAv.style.height = isEnlarged ? '56px' : '52px';
        }
        var settingsAvWrap = document.querySelector('.toss-settings-avatar-wrap');
        if (settingsAvWrap) {
          settingsAvWrap.style.width = isEnlarged ? '76px' : '64px';
          settingsAvWrap.style.height = isEnlarged ? '76px' : '64px';
        }
        var settingsAvInner = document.querySelector('.toss-settings-avatar-wrap .profile-avatar');
        if (settingsAvInner) {
          settingsAvInner.style.width = isEnlarged ? '76px' : '64px';
          settingsAvInner.style.height = isEnlarged ? '76px' : '64px';
        }
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-48',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-48_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-48_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        var toastMsg = isEnlarged ? '전체 아바타 아이콘 크기가 최적의 비율로 일괄 확대되었습니다!' : '아바타 아이콘 크기가 기본 규격으로 동기화되었습니다.';
        win.showToast(toastMsg, { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderSettingsScreen === 'function') win.renderSettingsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-48] 실행 실패:', err);
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

  function enlargeAvatarIconsBatch(forceEnlarge) {
    return handle아바타_Item48Action();
  }

  K.handle아바타_Item41Action = handle아바타_Item41Action;
  K.handle아바타_Item42Action = handle아바타_Item42Action;
  K.handle아바타_Item48Action = handle아바타_Item48Action;
  K.enlargeAvatarIconsBatch = enlargeAvatarIconsBatch;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
