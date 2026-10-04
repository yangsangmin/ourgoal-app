/**
 * OurGoal Community Cell: 자동 생성 직통 핸들러 5개(소통·팀목표 Item25·28·30·37·39) (#TASK-ES-387 · 팀 세포 쪼개기 2차)
 *
 * js/team-invite-comm.js(1차 뒤 3,276줄)에서 동작 그대로 옮겼다(이전 전 2804~2876, 2889~2963, 2976~3087, 3100~3174, 3186~3263줄).
 *   handle팀목표_Item25Action · handle소통_Item28Action · handle소통_Item30Action · handle팀목표_Item37Action · handle팀목표_Item39Action
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>, 다른 팀 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTeamInviteComm.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/team-invite-comm.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·상태를 getter(대입하는 상태는 setter 도)로 읽고 쓴다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 팀 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = global.OurgoalTeamCommKit = global.OurgoalTeamCommKit || {};
  var T = K.scope = K.scope || {};

  /**
   * [TASK-ES-AUTO-25 / #TASK-ES-277] 소통창 화면정리 (피드·소통 UI 시인성 및 피로도 개선) 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle팀목표_Item25Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-25-action-btn') : null;
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
        ticket: '25',
        updated_at: new Date().toISOString(),
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-25',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-25_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-25_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('소통창 화면정리 (피드·소통 UI 시인성 및 피로도 개선) 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-25] 실행 실패:', err);
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
   * [TASK-ES-AUTO-28 / #TASK-ES-279] DM창 타 유저 클릭 시 키보드 자동 팝업 방지 및 텍스트창 터치 시 오픈으로 변경 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle소통_Item28Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-28-action-btn') : null;
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
        ticket: '28',
        updated_at: new Date().toISOString(),
        autofocus_disabled: true,
        touch_open_keyboard: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-28',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-28_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-28_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('DM창 키보드 자동 팝업 방지 및 터치 오픈 모드가 적용되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-28] 실행 실패:', err);
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
   * [TASK-ES-AUTO-30 / #TASK-ES-281] 소통탭 게시하기 버튼 먹통 오류 수정 및 정상 동작 복구 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle소통_Item30Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-30-action-btn') : null;
    var postBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('btnCommPostFeed') : null;
    if (actionBtn) {
      actionBtn.disabled = true;
    }
    if (postBtn) {
      postBtn.disabled = true;
    }

    // 1. [햅틱 진동 피드백] (12ms 체감 인터랙션)
    var nav = win.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(12);
      } catch (e) {}
    }

    try {
      // 2. 피드 모달 안전 오픈 (Dead-Click 방지 및 스마트 폴백)
      var modalOpened = false;
      if (typeof win.openShareToFeedModal === 'function') {
        try {
          win.openShareToFeedModal();
          modalOpened = true;
        } catch (mErr) {
          console.warn('[TASK-ES-AUTO-30] openShareToFeedModal 호출 실패, 폴백 시도:', mErr);
        }
      }

      if (!modalOpened && typeof win.renderShareToFeedModal === 'function') {
        try {
          win.renderShareToFeedModal();
          modalOpened = true;
        } catch (rErr) {}
      }

      // 모달 DOM 직접 활성화 폴백
      if (!modalOpened && doc) {
        var modalEl = doc.getElementById('modalShareToFeed') || doc.getElementById('feedModal') || (typeof doc.querySelector === 'function' ? doc.querySelector('.modal-share-feed') : null);
        if (modalEl) {
          if (modalEl.style) modalEl.style.display = 'block';
          if (modalEl.classList && typeof modalEl.classList.add === 'function') {
            modalEl.classList.add('active', 'show', 'open');
          }
          modalOpened = true;
        }
      }

      // 3. 비즈니스 로직 및 영구 원장 트랜잭션
      var syncPayload = {
        ticket: '30',
        updated_at: new Date().toISOString(),
        modal_opened: modalOpened,
        action: 'comm_post_feed',
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-30',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-30_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-30_cache', JSON.stringify(syncPayload));
      }

      // 4. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('소통 피드 게시하기 모달이 정상 연결되었습니다.', { type: 'success', duration: 2000 });
      }

      // 5. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-30] 실행 실패:', err);
      if (typeof win.showToast === 'function') {
        win.showToast('처리 중 오류가 발생했습니다. 다시 시도해주세요.', { type: 'error' });
      }
      throw err;
    } finally {
      if (actionBtn) {
        actionBtn.disabled = false;
      }
      if (postBtn) {
        postBtn.disabled = false;
      }
    }
  }

  /**
   * [TASK-ES-AUTO-37] 동반자 탭 내 AI 동반자 전면 제거 (실 사용자 중심 전환) 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle팀목표_Item37Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var doc = typeof document !== 'undefined' ? document : null;
    var actionBtn = doc ? doc.getElementById('og-task-37-action-btn') : null;
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
        ticket: '37',
        updated_at: new Date().toISOString(),
        remove_ai_companions: true,
        real_user_only: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-37',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-37_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-37_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('동반자 탭 내 AI 동반자 전면 제거 (실 사용자 중심 전환) 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-37] 실행 실패:', err);
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
   * [TASK-ES-AUTO-39] 마니또 AI 동반자 1명 제한 및 실 유저 20명 초과 시 AI 동반자 전원 자동 삭제 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle팀목표_Item39Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = win.document || (typeof document !== 'undefined' ? document : null);
    var container = doc ? doc.getElementById('og-task-39-container') : null;
    var actionBtn = doc ? doc.getElementById('og-task-39-action-btn') : null;
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
        ticket: '39',
        updated_at: new Date().toISOString(),
        ai_limit: 1,
        purge_ai_threshold: 20,
        active_real_users: null, // [#TASK-ES-348] 측정하지 않은 수치는 null(이전 25 는 하드코딩)
        ai_purged: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-39',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-39_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-39_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('마니또 AI 동반자 1명 제한 및 20명 초과 삭제 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-39] 실행 실패:', err);
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

  K.handle팀목표_Item25Action = handle팀목표_Item25Action;
  K.handle소통_Item28Action = handle소통_Item28Action;
  K.handle소통_Item30Action = handle소통_Item30Action;
  K.handle팀목표_Item37Action = handle팀목표_Item37Action;
  K.handle팀목표_Item39Action = handle팀목표_Item39Action;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
