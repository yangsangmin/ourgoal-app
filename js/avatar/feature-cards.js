/**
 * OurGoal Avatar Cell: 자동 생성 기능 카드 핸들러 4개(26·32·41·42) · 레벨업/EXP 대사 2개 (#TASK-ES-390 · 아바타·EXP 쪼개기 PR-4)
 *
 * js/avatar-system.js(이전 전 1448줄)에서 이 책임 묶음의 선언을 동작 그대로 옮겼다(이전 전 줄: 1098~1170, 1179~1254, 1263~1343, 1355~1435).
 *   handle아바타_Item26Action · handle아바타_Item32Action · triggerAvatarLevelUpDialogue · handle아바타_Item41Action · triggerExpCelebrationPopup · handle아바타_Item42Action
 * window.handle아바타_* 대입 if 문·api.<이름> = … 줄은 avatar-system.js 원래 자리에 남았다(js/components.js 가 41·42 를 나중에 덮어쓰는 순서 보존).
 * 바꾼 글자 없음(바깥 이름을 읽지 않는다). 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalAvatar.<이름> 으로 부른다(avatar-system.js 가 같은 이름으로 가져와 api 에 담는다).
 * 브라우저: index.html 이 avatar-system.js 보다 먼저 읽어 OurgoalAvatarParts 에 담는다. Node: avatar-system.js 가 require 해서 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
  } else {
    factory(root.OurgoalAvatarParts = root.OurgoalAvatarParts || {});
  }
}(typeof self !== 'undefined' ? self : this, function (AV) {
  'use strict';

  /**
   * [TASK-ES-AUTO-26 / #TASK-ES-278] 앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 구현 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle아바타_Item26Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-26-action-btn') : null;
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
        ticket: '26',
        updated_at: new Date().toISOString(),
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-26',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-26_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-26_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀 구현 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-26] 실행 실패:', err);
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
   * [TASK-ES-AUTO-32 / #TASK-ES-283] 홈 및 전 탭 우측 상단 아바타 아이콘 크기 확대 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle아바타_Item32Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-32-action-btn') : null;
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
        ticket: '32',
        updated_at: new Date().toISOString(),
        avatar_scale: 'enlarged',
        home_badge_size: 72,
        topbar_size: 52,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-32',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-32_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-32_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('아바타 아이콘이 확대되어 시인성이 강화되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-32] 실행 실패:', err);
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
   * [TASK-ES-291 / 노션 생각메모장 41번]
   * 레벨업 시 아바타 연출 멘트 및 상태 반환
   */
  function triggerAvatarLevelUpDialogue(level) {
    return {
      dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
      level: level || 2,
      suggest_background_change: true,
      timestamp: new Date().toISOString()
    };
  }

  async function handle아바타_Item41Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-41-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      var syncPayload = {
        ticket: '41',
        updated_at: new Date().toISOString(),
        dialogue: '진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!',
        event_type: 'levelup_dialogue',
        suggest_background_change: true,
        state: 'completed'
      };

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

      if (typeof win.showToast === 'function') {
        win.showToast('진짜 잘했다! 내자신! 내 뒤의 배경좀 바꿔줘라 지겹다!', { type: 'success', duration: 2500 });
      }

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
   */
  function triggerExpCelebrationPopup(expGained) {
    return {
      dialogue: '잘했다! 내 자신!',
      exp_gained: expGained || 10,
      celebration_active: true,
      timestamp: new Date().toISOString()
    };
  }

  async function handle아바타_Item42Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-42-action-btn') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }

    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      var syncPayload = {
        ticket: '42',
        updated_at: new Date().toISOString(),
        dialogue: '잘했다! 내 자신!',
        event_type: 'exp_celebration',
        celebration_active: true,
        state: 'completed'
      };

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

      if (typeof win.showToast === 'function') {
        win.showToast('잘했다! 내 자신!', { type: 'success', duration: 2500 });
      }

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

  AV.handle아바타_Item26Action = handle아바타_Item26Action;
  AV.handle아바타_Item32Action = handle아바타_Item32Action;
  AV.triggerAvatarLevelUpDialogue = triggerAvatarLevelUpDialogue;
  AV.handle아바타_Item41Action = handle아바타_Item41Action;
  AV.triggerExpCelebrationPopup = triggerExpCelebrationPopup;
  AV.handle아바타_Item42Action = handle아바타_Item42Action;
}));
