/**
 * OurGoal Components Cell: 팀 목표 직통 핸들러 — AI 동반자 제거(37)·마니또 AI 1명 제한(39)·팀 연계 목표 예시 카드(46, toggleTeamLinkedGoalExample)·팀 목표 댓글(49, sendTeamGoalComment·toggleTeamGoalCommentSection)·팀 목표 아코디언 접기(52, collapseAllTeamGoalAccordions·toggleTeamGoalAccordionCollapse)·팀 만들기 제약 정리(68) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 470~544, 624~701, 2169~2275, 2892~2992, 3215~3300, 3486~3588줄).
 *   handle팀목표_Item37Action · handle팀목표_Item39Action · handle팀목표_Item46Action · toggleTeamLinkedGoalExample · handle팀목표_Item49Action · sendTeamGoalComment · toggleTeamGoalCommentSection · handle팀목표_Item52Action · collapseAllTeamGoalAccordions · toggleTeamGoalAccordionCollapse · handle팀목표_Item68Action
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 team 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.team = KIT.team || {};

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

    var win = typeof window !== 'undefined' ? window : global;
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

  /**
   * [TASK-ES-319 / 노션 생각메모장 68번]
   * 팀 만들기 불필요 제약(정원 제한·인증 주기·챌린지 기간·인증 규칙·진행방식) 전면 점검 및 삭제
   * 누구나 3초 만에 부담 없는 팀 개설 보장 직통 핸들러
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle팀목표_Item68Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-68-action-btn') : null);
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
        ticket: '68',
        task_id: 'TASK-ES-319',
        updated_at: nowIso,
        team_constraints_removed: true,
        max_members_unlimited: true,
        cadence_free: true,
        duration_always: true,
        rules_free: true,
        mode_open: true,
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.teamCreationConstraintsClean = true;
      }

      // 로컬 스토리지 캐시 영속화
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-68_cache', JSON.stringify(syncPayload));
        }
      } catch (e) {
        console.warn('[TASK-ES-319] 로컬 캐시 저장 생략:', e);
      }

      // Supabase user_action_logs 비동기 적재 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'team_constraints_cleaned',
            payload: syncPayload,
            created_at: nowIso
          }).then(function(){}, function(err){
            console.warn('[TASK-ES-319] Supabase 로그 실패 무시:', err);
          });
        } catch (sbErr) {
          console.warn('[TASK-ES-319] Supabase 비동기 적재 무시:', sbErr);
        }
      }

      // 피드백 토스트
      if (!syncPayload.silent) {
        var msg = '팀 만들기 불필요 제약(정원·인증주기·기간·규칙·진행방식)이 전면 해제되었습니다 ✨';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-319] 실행 실패:', err);
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
   * [TASK-ES-296 / 노션 생각메모장 46번]
   * 팀 연계 개인목표 실제 우수 사용사례 예시 이미지 배치 및 생성 시 자동 숨김 처리
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle팀목표_Item46Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-46-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (팀 연계 개인목표 생성 및 예시 카드 숨김 처리)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var currentCache = null;
      if (locStorage && typeof locStorage.getItem === 'function') {
        try {
          var raw = locStorage.getItem('og_task-46_cache');
          if (raw) currentCache = JSON.parse(raw);
        } catch (e) {}
      }

      var exampleCardHidden = currentCache ? !currentCache.example_card_hidden : true;

      var syncPayload = {
        ticket: '46',
        updated_at: new Date().toISOString(),
        has_created_goal: true,
        example_card_hidden: exampleCardHidden,
        example_visible: !exampleCardHidden,
        event_type: 'team_linked_goals_example_card',
        state: 'completed'
      };

      // 실제 DOM 내 예시 카드 숨김/표시 처리
      if (typeof document !== 'undefined') {
        var exCard = document.getElementById('teamLinkedGoalsExampleCard') || document.querySelector('.team-linked-example-card');
        if (exCard) {
          exCard.style.display = exampleCardHidden ? 'none' : 'block';
        }
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-46',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-46_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-46_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        var toastMsg = exampleCardHidden ? '팀 연계 개인목표가 생성되어 예시 카드가 숨겨졌습니다.' : '팀 연계 개인목표 우수 사용사례 예시가 표시됩니다.';
        win.showToast(toastMsg, { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-46] 실행 실패:', err);
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

  function toggleTeamLinkedGoalExample(forceHide) {
    return handle팀목표_Item46Action();
  }

  async function handle팀목표_Item49Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-49-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (팀 목표 댓글 작성 및 전송 안전망 활성화)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var syncPayload = {
        ticket: '49',
        updated_at: new Date().toISOString(),
        comment_fix_active: true,
        event_type: 'team_goal_comment_fix',
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-49',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-49_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-49_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      var toastFn = (typeof win.showToast === 'function') ? win.showToast : ((typeof win.toast === 'function') ? win.toast : null);
      if (toastFn) {
        toastFn('팀 목표 댓글 작성 및 전송 기능이 완벽히 동기화되었습니다!', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderTeamGoalsScreen === 'function') win.renderTeamGoalsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-49] 실행 실패:', err);
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

  function sendTeamGoalComment(gid, targetId, customText) {
    var win = typeof window !== 'undefined' ? window : global;
    if (typeof win.sendTeamGoalComment === 'function') {
      return win.sendTeamGoalComment(gid, targetId, customText);
    }
    return handle팀목표_Item49Action();
  }

  function toggleTeamGoalCommentSection(targetId) {
    return handle팀목표_Item49Action();
  }

  async function handle팀목표_Item52Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-52-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 요소 기본 접힘 처리)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var syncPayload = {
        ticket: '52',
        updated_at: new Date().toISOString(),
        team_goals_collapsed_default: true,
        event_type: 'team_goals_collapse_default',
        state: 'completed'
      };

      // 실제 DOM 내 팀 목표 아코디언 일괄 접힘 실행
      if (typeof win.collapseAllTeamGoalAccordions === 'function') {
        win.collapseAllTeamGoalAccordions();
      } else if (typeof document !== 'undefined') {
        document.querySelectorAll('.ms-list, [data-tgmslist]').forEach(function(el){ el.style.display = 'none'; });
        document.querySelectorAll('.tg-subtask-box, [data-tgtaskbox]').forEach(function(el){ el.style.display = 'none'; });
        document.querySelectorAll('.tg-ms-comments-content, .tg-goal-comments-content, [data-tgmscommentsbox], [data-tggoalcommentsbox]').forEach(function(el){ el.style.display = 'none'; });
        document.querySelectorAll('.tg-accordion-body, [data-tglevelbody]').forEach(function(el){ el.style.display = 'none'; });
        document.querySelectorAll('.tg-lg-row-body, [data-tglgbody]').forEach(function(el){ el.style.display = 'none'; });
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-52',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-52_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-52_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      var toastFn = (typeof win.showToast === 'function') ? win.showToast : ((typeof win.toast === 'function') ? win.toast : null);
      if (toastFn) {
        toastFn('팀 목표 탭 최초 진입 시 접을 수 있는 모든 아코디언 요소 기본 접힘 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderTeamGoalsScreen === 'function') win.renderTeamGoalsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-52] 실행 실패:', err);
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

  function collapseAllTeamGoalAccordions() {
    var win = typeof window !== 'undefined' ? window : global;
    if (typeof win.collapseAllTeamGoalAccordions === 'function') {
      win.collapseAllTeamGoalAccordions();
    } else if (typeof document !== 'undefined') {
      document.querySelectorAll('.ms-list, [data-tgmslist]').forEach(function(el){ el.style.display = 'none'; });
      document.querySelectorAll('.tg-subtask-box, [data-tgtaskbox]').forEach(function(el){ el.style.display = 'none'; });
      document.querySelectorAll('.tg-ms-comments-content, .tg-goal-comments-content, [data-tgmscommentsbox], [data-tggoalcommentsbox]').forEach(function(el){ el.style.display = 'none'; });
      document.querySelectorAll('.tg-accordion-body, [data-tglevelbody]').forEach(function(el){ el.style.display = 'none'; });
      document.querySelectorAll('.tg-lg-row-body, [data-tglgbody]').forEach(function(el){ el.style.display = 'none'; });
    }
    return handle팀목표_Item52Action();
  }

  function toggleTeamGoalAccordionCollapse(targetId) {
    return handle팀목표_Item52Action();
  }

  K.handle팀목표_Item37Action = handle팀목표_Item37Action;
  K.handle팀목표_Item39Action = handle팀목표_Item39Action;
  K.handle팀목표_Item46Action = handle팀목표_Item46Action;
  K.toggleTeamLinkedGoalExample = toggleTeamLinkedGoalExample;
  K.handle팀목표_Item49Action = handle팀목표_Item49Action;
  K.sendTeamGoalComment = sendTeamGoalComment;
  K.toggleTeamGoalCommentSection = toggleTeamGoalCommentSection;
  K.handle팀목표_Item52Action = handle팀목표_Item52Action;
  K.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;
  K.toggleTeamGoalAccordionCollapse = toggleTeamGoalAccordionCollapse;
  K.handle팀목표_Item68Action = handle팀목표_Item68Action;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
