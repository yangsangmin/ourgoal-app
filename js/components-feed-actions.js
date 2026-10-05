/**
 * OurGoal Components Cell: 소통 직통 핸들러 — 공유 대상 선택(57)·사진 첨부(58)·카테고리 다양화(59)·AI 봇 축소(61, blendFeedWithAiBotRule)·기록 다짐 문구(63, generateRecordPledgeMessage)·DM 전송·읽음 표시(67)·피드 글 미리보기(51, openFeedPostPreviewModal·toggleFeedPostPreview) (#TASK-ES-411 · 공통 UI 컴포넌트 세포 쪼개기)
 *
 * js/components.js(3861줄)에서 동작 그대로 옮겼다(이전 전 1116~1358, 1436~1530, 1641~1740, 2062~2167, 3383~3466, 3470~3484줄).
 *   handle소통_Item57Action · handle소통_Item58Action · handle소통_Item59Action · blendFeedWithAiBotRule · handle소통_Item61Action · generateRecordPledgeMessage · handle소통_Item63Action · handle소통_Item67Action · handle소통_Item51Action · openFeedPostPreviewModal · toggleFeedPostPreview
 * 바꾼 글자 없음 — IIFE 인자 이름(window)과 부르는 식이 원본과 같다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.<함수 이름>·OurgoalComponents·module.exports 로 부른다(노출 줄은 원본 js/components.js 에 그대로). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window){
  'use strict';
  // K = 공통 UI 컴포넌트 세포 키트의 feed 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  // root = window 인자(키트 등록 전용 별칭 — 팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalComponentsKit = root.OurgoalComponentsKit || {};
  var K = KIT.feed = KIT.feed || {};

  /**
   * [TASK-ES-308 / 노션 생각메모장 57번]
   * 소통탭 게시 시 공유 대상(목표·기록·AI피드백) 선택형 UI 연동 및 다짐 작성 유지 직통 핸들러 및 원자적 트랜잭션
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle소통_Item57Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' && global.window ? global.window : (typeof global !== 'undefined' ? global : {}));
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-57-action-btn') : null);
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
      var payloadToSet = customPayload || {
        selected_goal_id: (win.state && win.state.shareDraft && win.state.shareDraft.goalId) ? win.state.shareDraft.goalId : '',
        selected_record_id: (win.state && win.state.shareDraft && win.state.shareDraft.recordId) ? win.state.shareDraft.recordId : '',
        selected_feedback_id: (win.state && win.state.shareDraft && win.state.shareDraft.feedbackId) ? win.state.shareDraft.feedbackId : '',
        caption: (win.state && win.state.shareDraft && win.state.shareDraft.caption) ? win.state.shareDraft.caption : ''
      };

      var syncPayload = {
        ticket: '57',
        updated_at: new Date().toISOString(),
        target_selection: payloadToSet,
        caption_preserved: true,
        selectable_chips_enabled: true,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-57_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-57',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('공유 대상이 선택되었습니다. 다짐과 함께 게시할 준비가 완료되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('공유 대상이 선택되었습니다. 다짐과 함께 게시할 준비가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-308] 실행 실패:', err);
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
   * [TASK-ES-309 / 노션 생각메모장 58번]
   * 소통 피드 게시하기 내 사진(이미지) 첨부 기능 연동 및 원자적 트랜잭션
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle소통_Item58Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' && global.window ? global.window : (typeof global !== 'undefined' ? global : {}));
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-58-action-btn') : null);
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
      var photoDataToSet = customPayload || {
        photo: (win.state && win.state.shareDraft && win.state.shareDraft.photo) ? win.state.shareDraft.photo : null,
        caption: (win.state && win.state.shareDraft && win.state.shareDraft.caption) ? win.state.shareDraft.caption : '',
        category: (win.state && win.state.shareDraft && win.state.shareDraft.category) ? win.state.shareDraft.category : 'study'
      };

      var syncPayload = {
        ticket: '58',
        updated_at: new Date().toISOString(),
        photo_upload: photoDataToSet,
        photo_attached: !!(photoDataToSet && photoDataToSet.photo),
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-58_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-58',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('실천 인증 사진 첨부 설정이 완료되었습니다. 피드에 게시할 준비가 되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('실천 인증 사진 첨부 설정이 완료되었습니다. 피드에 게시할 준비가 되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-309] 실행 실패:', err);
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
   * [TASK-ES-310 / 노션 생각메모장 59번]
   * 소통 피드 게시하기 카테고리 분류 다양화(생활·육아 등 보완) 및 가로 스크롤 선택 UI 연동
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle소통_Item59Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' && global.window ? global.window : (typeof global !== 'undefined' ? global : {}));
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-59-action-btn') : null);
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
      var categoryDataToSet = customPayload || {
        category: (win.state && win.state.shareDraft && win.state.shareDraft.category) ? win.state.shareDraft.category : 'study',
        availableCategories: ['study','dev','workout','running','diet','career','sideproject','finance','life','morning','parenting','pet','relation','reading','hobby','mental','clean','travel']
      };

      var syncPayload = {
        ticket: '59',
        updated_at: new Date().toISOString(),
        category_diversity: categoryDataToSet,
        category_count: 18,
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-59_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-59',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('카테고리 분류가 다양하게 적용되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('카테고리 분류가 다양하게 적용되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-310] 실행 실패:', err);
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
   * [TASK-ES-312 / 노션 생각메모장 61번]
   * 피드 내 AI 봇 활동내역 블렌딩 알고리즘
   * - realCount > 20: AI 전면 제거 (0건)
   * - realCount <= 20: 실 유저 글 상단 우선, AI 봇 최대 1건 최하단 보강
   */
  function blendFeedWithAiBotRule(realPosts, aiPersonas, virtualCheerEnabled) {
    var realList = (realPosts || []).slice();
    var realCount = realList.length;
    if (virtualCheerEnabled === false || realCount > 20) {
      return realList;
    }
    var singleAi = (aiPersonas && aiPersonas.length > 0) ? [aiPersonas[0]] : [];
    if (realCount === 0) {
      return singleAi;
    }
    return realList.concat(singleAi);
  }

  /**
   * [TASK-ES-312 / 노션 생각메모장 61번]
   * 피드 내 AI 봇 활동내역 최하단 1개 축소 및 실 유저 20명 초과 시 전면 제거
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle소통_Item61Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' && global.window ? global.window : (typeof global !== 'undefined' ? global : {}));
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-61-action-btn') : null);
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
        ticket: '61',
        updated_at: new Date().toISOString(),
        ai_bot_reduced_to_one: true,
        remove_ai_when_users_over_20: true,
        max_ai_bot_count: 1,
        placement: 'bottom_only',
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-61_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-61',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('피드 내 AI 봇 활동내역이 1개로 축소되고 최하단에 정렬되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('피드 내 AI 봇 활동내역이 1개로 축소되고 최하단에 정렬되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-312] 실행 실패:', err);
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
   * [TASK-ES-314 / 노션 생각메모장 63번]
   * 피드 게시 시 실천기록 맞춤형 한마디/다짐 문구 생성 헬퍼
   */
  function generateRecordPledgeMessage(record, goal) {
    if (!record || (!record.title && !record.text)) {
      if (goal && goal.title) {
        return '"' + goal.title + '" 목표를 향해 꾸준히 달리고 있습니다. 오늘도 파이팅! 💪';
      }
      return '오늘도 목표를 향해 한 걸음 내딛습니다. 모두 함께 힘내요! ✨';
    }

    var rawTitle = (record.title || record.text || '').replace(/\r\n/g, ' ').trim();
    var snippet = rawTitle.slice(0, 40);
    if (rawTitle.length > 40) snippet += '…';

    var dur = record.durationMinutes || record.duration || 0;
    var durStr = dur > 0 ? (dur >= 60 ? Math.floor(dur / 60) + '시간 ' + (dur % 60 ? (dur % 60) + '분 ' : '') : dur + '분 ') : '';

    if (durStr) {
      return '오늘 ' + durStr + '집중 완료! "' + snippet + '" 실천으로 성장하고 있습니다 🔥';
    }
    return '오늘 실천 완료! "' + snippet + '" 꾸준함이 비범함을 만듭니다 ✨';
  }

  /**
   * [TASK-ES-314 / 노션 생각메모장 63번]
   * 피드 게시 시 실천기록 최신순 자동적용 및 기록 맞춤형 AI피드백/다짐 연동 완결
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle소통_Item63Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-63-action-btn') : null);
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
        ticket: '63',
        updated_at: new Date().toISOString(),
        latest_record_auto_select: true,
        record_customized_feedback_and_pledge: true,
        placement: 'share_to_feed_modal',
        state: 'completed'
      };

      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-63_cache', JSON.stringify(syncPayload));
      }

      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-63',
            metadata: syncPayload
          });
        } catch (sbErr) {}
      }

      if (typeof win.toast === 'function') {
        win.toast('실천기록 최신순 자동적용 및 맞춤형 AI피드백·다짐 연동이 활성화되었습니다.');
      } else if (typeof win.showToast === 'function') {
        win.showToast('실천기록 최신순 자동적용 및 맞춤형 AI피드백·다짐 연동이 활성화되었습니다.', { type: 'success', duration: 2000 });
      }

      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-314] 실행 실패:', err);
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
   * [TASK-ES-318 / 노션 생각메모장 67번]
   * DM 전송 상태·읽음 확인(상대방 도착/읽음 표시) 및 전송·수신 시각 상세 표시 (카카오톡 방식) 직통 핸들러
   * 8원칙 & 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
   */
  async function handle소통_Item67Action(event, customPayload) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = (typeof global !== 'undefined' && global.window) ? global.window : (typeof window !== 'undefined' ? window : {});
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-67-action-btn') : null);
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
        ticket: '67',
        task_id: 'TASK-ES-318',
        updated_at: nowIso,
        dm_delivery_receipt_enabled: true,
        kakaotalk_style_badge_enabled: true,
        sent_at: nowIso,
        delivered_at: nowIso,
        read_at: nowIso,
        status: 'read',
        state: 'completed'
      };
      var syncPayload = Object.assign({}, defaultPayload, customPayload || {});

      // 상태 및 설정 영속화
      if (win.state && win.state.profile) {
        if (!win.state.profile.settings) win.state.profile.settings = {};
        win.state.profile.settings.dmReceiptFeaturesEnabled = true;
      }

      // 로컬 스토리지 캐시 영속화
      try {
        var storage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem('og_task-67_cache', JSON.stringify(syncPayload));
        }
      } catch (e) {
        console.warn('[TASK-ES-318] 로컬 캐시 저장 생략:', e);
      }

      // Supabase user_action_logs 비동기 적재 시도
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          var userId = (win.state && win.state.profile && win.state.profile.id) || null;
          win.sb.from('user_action_logs').insert({
            user_id: userId,
            action_type: 'dm_receipt_configured',
            payload: syncPayload,
            created_at: nowIso
          }).then(function(){}, function(err){
            console.warn('[TASK-ES-318] Supabase 로그 실패 무시:', err);
          });
        } catch (sbErr) {
          console.warn('[TASK-ES-318] Supabase 비동기 적재 무시:', sbErr);
        }
      }

      // 피드백 토스트
      if (!syncPayload.silent) {
        var msg = 'DM 카카오톡 방식 전송·도착·읽음 상세 시각이 활성화되었습니다 💬';
        if (typeof win.toast === 'function') {
          win.toast(msg);
        } else if (typeof win.showToast === 'function') {
          win.showToast(msg, { type: 'success', duration: 2000 });
        }
      }

      if (typeof win.renderCommScreen === 'function') win.renderCommScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderAll === 'function') win.renderAll();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-318] 실행 실패:', err);
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

  async function handle소통_Item51Action(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var actionBtn = (event && event.currentTarget) || (typeof document !== 'undefined' ? document.getElementById('og-task-51-action-btn') : null);
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
      // 2. 비즈니스 로직 및 영구 원장 트랜잭션 (피드 게시 모달 내 미리보기 및 사전 렌더링 확인)
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      var syncPayload = {
        ticket: '51',
        updated_at: new Date().toISOString(),
        feed_preview_active: true,
        event_type: 'feed_post_preview_modal',
        state: 'completed'
      };

      // DOM 내 미리보기 실행/토글
      if (typeof win.toggleFeedPostPreview === 'function') {
        win.toggleFeedPostPreview();
      } else if (typeof document !== 'undefined') {
        var previewSlot = document.getElementById('sharePreviewSlot');
        if (previewSlot) {
          previewSlot.style.display = previewSlot.style.display === 'none' ? 'block' : 'none';
        }
      }

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-51',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-51_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-51_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      var toastFn = (typeof win.showToast === 'function') ? win.showToast : ((typeof win.toast === 'function') ? win.toast : null);
      if (toastFn) {
        toastFn('피드 게시 모달 내 미리보기 버튼 및 피드 렌더링 사전 확인 기능이 완벽히 동기화되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();
      if (typeof win.renderFeedScreen === 'function') win.renderFeedScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-51] 실행 실패:', err);
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

  function openFeedPostPreviewModal(caption, goalTitle) {
    var win = typeof window !== 'undefined' ? window : global;
    if (typeof win.toggleFeedPostPreview === 'function') {
      return win.toggleFeedPostPreview(caption, goalTitle);
    }
    return handle소통_Item51Action();
  }

  function toggleFeedPostPreview(caption, goalTitle) {
    var win = typeof window !== 'undefined' ? window : global;
    if (typeof win.toggleFeedPostPreview === 'function') {
      return win.toggleFeedPostPreview(caption, goalTitle);
    }
    return handle소통_Item51Action();
  }

  K.handle소통_Item57Action = handle소통_Item57Action;
  K.handle소통_Item58Action = handle소통_Item58Action;
  K.handle소통_Item59Action = handle소통_Item59Action;
  K.blendFeedWithAiBotRule = blendFeedWithAiBotRule;
  K.handle소통_Item61Action = handle소통_Item61Action;
  K.generateRecordPledgeMessage = generateRecordPledgeMessage;
  K.handle소통_Item63Action = handle소통_Item63Action;
  K.handle소통_Item67Action = handle소통_Item67Action;
  K.handle소통_Item51Action = handle소통_Item51Action;
  K.openFeedPostPreviewModal = openFeedPostPreviewModal;
  K.toggleFeedPostPreview = toggleFeedPostPreview;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
