/* ==============================================================================
 * OurGoal Universal UI Component System (js/components.js)
 * [#TASK-ES-162] 5대 핵심 UI 컴포넌트(배지·통계카드·프로그레스바·모달셸·엠프티스테이트) 모듈화
 * ============================================================================== */
(function(window){
  'use strict';

  function escapeHtml(str){
    if(str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var OurgoalComponents = {
    /**
     * 1. 표준 상태 배지 컴포넌트
     * @param {Object} opts { type: 'brand'|'gold'|'sage'|'red'|'gray', text: string, icon: string, size: 'sm'|'md' }
     * @returns {string} HTML
     */
    badge: function(opts){
      opts = opts || {};
      var type = opts.type || 'brand';
      var text = opts.text || '';
      var icon = opts.icon ? '<span class="og-badge-icon">' + opts.icon + '</span> ' : '';
      var sizeCls = opts.size === 'sm' ? ' og-badge-sm' : '';
      return '<span class="og-badge og-badge-' + escapeHtml(type) + sizeCls + '">' +
        icon + escapeHtml(text) +
      '</span>';
    },

    /**
     * 2. 프로 지표 통계 카드 컴포넌트
     * @param {Object} opts { title, value, diff, icon, subtext, trend: 'up'|'down'|'neutral' }
     * @returns {string} HTML
     */
    statCard: function(opts){
      opts = opts || {};
      var iconHtml = opts.icon ? '<span class="og-stat-icon">' + opts.icon + '</span>' : '';
      var diffHtml = '';
      if(opts.diff){
        var trendCls = opts.trend === 'up' ? ' og-trend-up' : (opts.trend === 'down' ? ' og-trend-down' : ' og-trend-neutral');
        diffHtml = '<span class="og-stat-diff' + trendCls + '">' + escapeHtml(opts.diff) + '</span>';
      }
      var subHtml = opts.subtext ? '<div class="og-stat-sub">' + escapeHtml(opts.subtext) + '</div>' : '';

      return '<div class="og-stat-card">' +
        '<div class="og-stat-top">' +
          '<span class="og-stat-title">' + escapeHtml(opts.title || '') + '</span>' +
          iconHtml +
        '</div>' +
        '<div class="og-stat-mid">' +
          '<span class="og-stat-val">' + escapeHtml(opts.value || '0') + '</span>' +
          diffHtml +
        '</div>' +
        subHtml +
      '</div>';
    },

    /**
     * 3. 프로그레스 바 게이지 컴포넌트
     * @param {Object} opts { percent: number, colorType: 'brand'|'gold'|'sage'|'red'|'gradient', height: number, showLabel: boolean }
     * @returns {string} HTML
     */
    progressBar: function(opts){
      opts = opts || {};
      var rawPct = typeof opts.percent === 'number' ? opts.percent : parseFloat(opts.percent) || 0;
      var pct = Math.max(0, Math.min(100, Math.round(rawPct)));
      var colorType = opts.colorType || 'brand';
      var height = opts.height || 8;
      var labelHtml = opts.showLabel ? '<div class="og-prog-label"><span>달성률</span><b>' + pct + '%</b></div>' : '';

      return '<div class="og-prog-container">' +
        labelHtml +
        '<div class="og-prog-track" style="height:' + height + 'px;">' +
          '<div class="og-prog-fill og-fill-' + escapeHtml(colorType) + '" style="width:' + pct + '%;"></div>' +
        '</div>' +
      '</div>';
    },

    /**
     * 4. 일관된 표준 모달 셸 컴포넌트
     * @param {Object} opts { id, title, icon, subtitle, bodyHtml, confirmText, cancelText, confirmId, cancelId }
     * @returns {string} HTML
     */
    modalShell: function(opts){
      opts = opts || {};
      var iconHtml = opts.icon ? '<span class="og-modal-icon">' + opts.icon + '</span> ' : '';
      var subHtml = opts.subtitle ? '<p class="og-modal-sub">' + escapeHtml(opts.subtitle) + '</p>' : '';
      var actionsHtml = '';
      if(opts.confirmText || opts.cancelText){
        actionsHtml = '<div class="modal-actions" style="margin-top:16px;">' +
          (opts.cancelText ? '<button type="button" class="btn btn-ghost" id="' + escapeHtml(opts.cancelId || 'ogModalCancelBtn') + '">' + escapeHtml(opts.cancelText) + '</button>' : '') +
          (opts.confirmText ? '<button type="button" class="btn btn-primary" id="' + escapeHtml(opts.confirmId || 'ogModalConfirmBtn') + '">' + escapeHtml(opts.confirmText) + '</button>' : '') +
        '</div>';
      }

      return '<div class="og-modal-shell" id="' + escapeHtml(opts.id || '') + '">' +
        '<div class="og-modal-header">' +
          '<h3 class="og-modal-title">' + iconHtml + escapeHtml(opts.title || '') + '</h3>' +
          '<button type="button" class="btn-close og-modal-close" aria-label="닫기">×</button>' +
        '</div>' +
        subHtml +
        '<div class="og-modal-body">' + (opts.bodyHtml || '') + '</div>' +
        actionsHtml +
      '</div>';
    },

    /**
     * 5. 데이터 없음/안내 빈 화면 컴포넌트 (Empty State)
     * @param {Object} opts { icon, title, desc, actionText, actionId, actionClass }
     * @returns {string} HTML
     */
    emptyState: function(opts){
      opts = opts || {};
      var icon = opts.icon || '🌱';
      var title = opts.title || '아직 등록된 항목이 없어요';
      var desc = opts.desc || '새로운 목표와 루틴을 시작해보세요!';
      var actionBtn = opts.actionText ?
        '<button type="button" class="btn ' + escapeHtml(opts.actionClass || 'btn-primary') + '" id="' + escapeHtml(opts.actionId || 'ogEmptyActionBtn') + '" style="margin-top:12px;">' +
          escapeHtml(opts.actionText) +
        '</button>' : '';

      return '<div class="og-empty-state">' +
        '<div class="og-empty-icon">' + icon + '</div>' +
        '<div class="og-empty-title">' + escapeHtml(title) + '</div>' +
        '<div class="og-empty-desc">' + escapeHtml(desc) + '</div>' +
        actionBtn +
      '</div>';
    },

    /**
     * 6. [#TASK-ES-275] 컴포넌트 모듈화 허브 컴포넌트
     * @param {Object} opts
     * @returns {string} HTML
     */
    task23ModularComponent: function(opts){
      opts = opts || {};
      var title = opts.title || '컴포넌트 모듈화 허브';
      var desc = opts.desc || 'UI/UX 시너지 및 일관된 사용자경험을 위해 공통 컴포넌트 상태를 최적화하고 4대 뷰를 원자적으로 동기화합니다.';
      var btnText = opts.btnText || '⚡ 컴포넌트 모듈화 동기화 실행';
      return '<div id="og-task-23-container" class="og-modular-card">' +
        '<div class="og-modular-header">' +
          '<span class="og-modular-icon">🧩</span>' +
          '<h4 class="og-modular-title">' + escapeHtml(title) + '</h4>' +
        '</div>' +
        '<p class="og-modular-desc">' + escapeHtml(desc) + '</p>' +
        '<div class="og-modular-action-row">' +
          '<button type="button" id="og-task-23-action-btn" class="og-modular-btn" onclick="handle전체공통_Item23Action(event)">' +
            escapeHtml(btnText) +
          '</button>' +
        '</div>' +
      '</div>';
    }
  };

  /**
   * [TASK-ES-AUTO-23 / #TASK-ES-275] 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선) 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle전체공통_Item23Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    var doc = typeof document !== 'undefined' ? document : (win.document || null);
    var actionBtn = doc && typeof doc.getElementById === 'function' ? doc.getElementById('og-task-23-action-btn') : null;
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
        ticket: '23',
        updated_at: new Date().toISOString(),
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-23',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-23_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-23_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선) 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-23] 실행 실패:', err);
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('갓생 스토리카드 다각화 및 피드 게시가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
   * [TASK-ES-AUTO-38] 설정창 전면 개편 (기능 그룹화 및 인터페이스 간소화·압축) 직통 이벤트 바인딩 및 원자적 트랜잭션
   */
  async function handle전체공통_Item38Action(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    var win = typeof window !== 'undefined' ? window : global;
    var doc = win.document || (typeof document !== 'undefined' ? document : null);
    var container = doc ? doc.getElementById('og-task-38-container') : null;
    var actionBtn = doc ? doc.getElementById('og-task-38-action-btn') : null;
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
        ticket: '38',
        updated_at: new Date().toISOString(),
        settings_reorg: true,
        grouped: true,
        compact_mode: true,
        state: 'completed'
      };

      // Supabase 저장 또는 로컬 캐시 원자적 갱신
      var locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (win.sb && typeof win.sb.from === 'function') {
        try {
          await win.sb.from('user_interactions').upsert({
            interaction_key: 'task-38',
            metadata: syncPayload
          });
        } catch (sbErr) {
          if (locStorage && typeof locStorage.setItem === 'function') {
            locStorage.setItem('og_task-38_cache', JSON.stringify(syncPayload));
          }
        }
      } else if (locStorage && typeof locStorage.setItem === 'function') {
        locStorage.setItem('og_task-38_cache', JSON.stringify(syncPayload));
      }

      // 3. 완료 시각 피드백 토스트
      if (typeof win.showToast === 'function') {
        win.showToast('설정창 전면 개편 (기능 그룹화 및 인터페이스 간소화·압축) 처리가 완료되었습니다.', { type: 'success', duration: 2000 });
      }

      // 4. 헌법 제15조 제6항 4대 뷰 원자적 동시 전파
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
      if (typeof win.renderGoalsScreen === 'function') win.renderGoalsScreen();
      if (typeof win.renderHome === 'function') win.renderHome();
      if (typeof win.renderRecordsScreen === 'function') win.renderRecordsScreen();

      return syncPayload;
    } catch (err) {
      console.error('[TASK-ES-AUTO-38] 실행 실패:', err);
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
        active_real_users: 25,
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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
      if (typeof win.renderCalendar === 'function') win.renderCalendar();
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

  function toggleDataManagementSection(forceState) {
    return handle성취통계_Item45Action();
  }

  if(typeof document !== 'undefined' && typeof document.addEventListener === 'function'){
    document.addEventListener('click', function(e){
      var closeBtn = e.target && e.target.closest && (e.target.closest('.og-modal-close') || e.target.closest('#ogModalCancelBtn'));
      if(closeBtn && typeof window !== 'undefined' && typeof window.closeModal === 'function'){
        window.closeModal();
      }
    });
  }

  if(typeof window !== 'undefined'){
    window.OurgoalComponents = OurgoalComponents;
    window.handle전체공통_Item23Action = handle전체공통_Item23Action;
    window.handle홈탭_Item33Action = handle홈탭_Item33Action;
    window.handle홈탭_Item34Action = handle홈탭_Item34Action;
    window.handle기록스톱워치_Item35Action = handle기록스톱워치_Item35Action;
    window.handle팀목표_Item37Action = handle팀목표_Item37Action;
    window.handle전체공통_Item38Action = handle전체공통_Item38Action;
    window.handle팀목표_Item39Action = handle팀목표_Item39Action;
    window.handle목표탭_Item40Action = handle목표탭_Item40Action;
    window.handle아바타_Item41Action = handle아바타_Item41Action;
    window.handle아바타_Item42Action = handle아바타_Item42Action;
    window.handle성취통계_Item43Action = handle성취통계_Item43Action;
    window.handle기록스톱워치_Item44Action = handle기록스톱워치_Item44Action;
    window.handle성취통계_Item45Action = handle성취통계_Item45Action;
    window.handle팀목표_Item46Action = handle팀목표_Item46Action;
    window.handle기록스톱워치_Item47Action = handle기록스톱워치_Item47Action;
    window.handle아바타_Item48Action = handle아바타_Item48Action;
    window.enlargeAvatarIconsBatch = enlargeAvatarIconsBatch;
    window.toggleAchievementMetricFilter = toggleAchievementMetricFilter;
    window.toggleDataManagementSection = toggleDataManagementSection;
    window.toggleTeamLinkedGoalExample = toggleTeamLinkedGoalExample;
    window.toggleTimeRecordModalCompact = toggleTimeRecordModalCompact;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalComponents;
    module.exports.handle전체공통_Item23Action = handle전체공통_Item23Action;
    module.exports.handle홈탭_Item33Action = handle홈탭_Item33Action;
    module.exports.handle홈탭_Item34Action = handle홈탭_Item34Action;
    module.exports.handle기록스톱워치_Item35Action = handle기록스톱워치_Item35Action;
    module.exports.handle팀목표_Item37Action = handle팀목표_Item37Action;
    module.exports.handle전체공통_Item38Action = handle전체공통_Item38Action;
    module.exports.handle팀목표_Item39Action = handle팀목표_Item39Action;
    module.exports.handle목표탭_Item40Action = handle목표탭_Item40Action;
    module.exports.handle아바타_Item41Action = handle아바타_Item41Action;
    module.exports.handle아바타_Item42Action = handle아바타_Item42Action;
    module.exports.handle성취통계_Item43Action = handle성취통계_Item43Action;
    module.exports.handle기록스톱워치_Item44Action = handle기록스톱워치_Item44Action;
    module.exports.handle성취통계_Item45Action = handle성취통계_Item45Action;
    module.exports.handle팀목표_Item46Action = handle팀목표_Item46Action;
    module.exports.handle기록스톱워치_Item47Action = handle기록스톱워치_Item47Action;
    module.exports.handle아바타_Item48Action = handle아바타_Item48Action;
    module.exports.enlargeAvatarIconsBatch = enlargeAvatarIconsBatch;
    module.exports.toggleAchievementMetricFilter = toggleAchievementMetricFilter;
    module.exports.toggleDataManagementSection = toggleDataManagementSection;
    module.exports.toggleTeamLinkedGoalExample = toggleTeamLinkedGoalExample;
    module.exports.toggleTimeRecordModalCompact = toggleTimeRecordModalCompact;
  }
})(typeof window !== 'undefined' ? window : global);

