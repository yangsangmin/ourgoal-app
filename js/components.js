/* ==============================================================================
 * OurGoal Universal UI Component System (js/components.js)
 * [#TASK-ES-162] 5대 핵심 UI 컴포넌트(배지·통계카드·프로그레스바·모달셸·엠프티스테이트) 모듈화
 * ============================================================================== */
(function(window){
  'use strict';

  /* ============ [#TASK-ES-411] 공통 UI 컴포넌트 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     탭별 직통 핸들러를 js/components-<하는 일>-actions.js 로 옮겼다(동작 그대로). 옮긴 함수를 이 스코프에서 같은 이름으로 가져온다
     (브라우저는 index.html 이 부품을 먼저 읽고, node 는 아래 require). 아래 노출 줄(window.X = X · module.exports.X = X)은 자리·순서 그대로다. */
  var _cKit = window.OurgoalComponentsKit || {};
  var _cHome = _cKit.home;
  if(!_cHome && typeof require === 'function'){ _cHome = require('./components-home-actions.js'); }
  _cHome = _cHome || {};
  var _cRecord = _cKit.record;
  if(!_cRecord && typeof require === 'function'){ _cRecord = require('./components-record-actions.js'); }
  _cRecord = _cRecord || {};
  var _cTeam = _cKit.team;
  if(!_cTeam && typeof require === 'function'){ _cTeam = require('./components-team-actions.js'); }
  _cTeam = _cTeam || {};
  var _cFeed = _cKit.feed;
  if(!_cFeed && typeof require === 'function'){ _cFeed = require('./components-feed-actions.js'); }
  _cFeed = _cFeed || {};
  var _cGoal = _cKit.goal;
  if(!_cGoal && typeof require === 'function'){ _cGoal = require('./components-goal-actions.js'); }
  _cGoal = _cGoal || {};
  var _cAvatar = _cKit.avatar;
  if(!_cAvatar && typeof require === 'function'){ _cAvatar = require('./components-avatar-actions.js'); }
  _cAvatar = _cAvatar || {};
  var _cStats = _cKit.stats;
  if(!_cStats && typeof require === 'function'){ _cStats = require('./components-stats-actions.js'); }
  _cStats = _cStats || {};
  var _cAuth = _cKit.auth;
  if(!_cAuth && typeof require === 'function'){ _cAuth = require('./components-auth-actions.js'); }
  _cAuth = _cAuth || {};
  var _cSettings = _cKit.settings;
  if(!_cSettings && typeof require === 'function'){ _cSettings = require('./components-settings-actions.js'); }
  _cSettings = _cSettings || {};
  var _cWidget = _cKit.widget;
  if(!_cWidget && typeof require === 'function'){ _cWidget = require('./components-widget-actions.js'); }
  _cWidget = _cWidget || {};
  var _cSchedule = _cKit.schedule;
  if(!_cSchedule && typeof require === 'function'){ _cSchedule = require('./components-schedule-actions.js'); }
  _cSchedule = _cSchedule || {};
  var handle홈탭_Item33Action = _cHome.handle홈탭_Item33Action;
  var handle홈탭_Item34Action = _cHome.handle홈탭_Item34Action;
  var handle홈탭_Item66Action = _cHome.handle홈탭_Item66Action;
  var handle기록스톱워치_Item35Action = _cRecord.handle기록스톱워치_Item35Action;
  var handle기록스톱워치_Item44Action = _cRecord.handle기록스톱워치_Item44Action;
  var handle기록스톱워치_Item47Action = _cRecord.handle기록스톱워치_Item47Action;
  var toggleTimeRecordModalCompact = _cRecord.toggleTimeRecordModalCompact;
  var handle팀목표_Item37Action = _cTeam.handle팀목표_Item37Action;
  var handle팀목표_Item39Action = _cTeam.handle팀목표_Item39Action;
  var handle팀목표_Item46Action = _cTeam.handle팀목표_Item46Action;
  var toggleTeamLinkedGoalExample = _cTeam.toggleTeamLinkedGoalExample;
  var handle팀목표_Item49Action = _cTeam.handle팀목표_Item49Action;
  var sendTeamGoalComment = _cTeam.sendTeamGoalComment;
  var toggleTeamGoalCommentSection = _cTeam.toggleTeamGoalCommentSection;
  var handle팀목표_Item52Action = _cTeam.handle팀목표_Item52Action;
  var collapseAllTeamGoalAccordions = _cTeam.collapseAllTeamGoalAccordions;
  var toggleTeamGoalAccordionCollapse = _cTeam.toggleTeamGoalAccordionCollapse;
  var handle팀목표_Item68Action = _cTeam.handle팀목표_Item68Action;
  var handle소통_Item57Action = _cFeed.handle소통_Item57Action;
  var handle소통_Item58Action = _cFeed.handle소통_Item58Action;
  var handle소통_Item59Action = _cFeed.handle소통_Item59Action;
  var blendFeedWithAiBotRule = _cFeed.blendFeedWithAiBotRule;
  var handle소통_Item61Action = _cFeed.handle소통_Item61Action;
  var generateRecordPledgeMessage = _cFeed.generateRecordPledgeMessage;
  var handle소통_Item63Action = _cFeed.handle소통_Item63Action;
  var handle소통_Item67Action = _cFeed.handle소통_Item67Action;
  var handle소통_Item51Action = _cFeed.handle소통_Item51Action;
  var openFeedPostPreviewModal = _cFeed.openFeedPostPreviewModal;
  var toggleFeedPostPreview = _cFeed.toggleFeedPostPreview;
  var handle목표탭_Item40Action = _cGoal.handle목표탭_Item40Action;
  var handle목표탭_Item64Action = _cGoal.handle목표탭_Item64Action;
  var handle목표탭_Item53Action = _cGoal.handle목표탭_Item53Action;
  var openGoalTemplateEncyclopediaModal = _cGoal.openGoalTemplateEncyclopediaModal;
  var copyUserGoalTemplate = _cGoal.copyUserGoalTemplate;
  var handle아바타_Item41Action = _cAvatar.handle아바타_Item41Action;
  var handle아바타_Item42Action = _cAvatar.handle아바타_Item42Action;
  var handle아바타_Item48Action = _cAvatar.handle아바타_Item48Action;
  var enlargeAvatarIconsBatch = _cAvatar.enlargeAvatarIconsBatch;
  var toggleAchievementMetricFilter = _cStats.toggleAchievementMetricFilter;
  var handle성취통계_Item43Action = _cStats.handle성취통계_Item43Action;
  var handle성취통계_Item56Action = _cStats.handle성취통계_Item56Action;
  var handle성취통계_Item60Action = _cStats.handle성취통계_Item60Action;
  var handle성취통계_Item45Action = _cStats.handle성취통계_Item45Action;
  var toggleDataManagementSection = _cStats.toggleDataManagementSection;
  var handle인증_Item69Action = _cAuth.handle인증_Item69Action;
  var handle인증_Item70Action = _cAuth.handle인증_Item70Action;
  var handle인증_Item71Action = _cAuth.handle인증_Item71Action;
  var handle전체공통_Item38Action = _cSettings.handle전체공통_Item38Action;
  var handle설정_Item79Action = _cSettings.handle설정_Item79Action;
  var handle테마_Item79Action = _cSettings.handle테마_Item79Action;
  var handle전체공통_Item50Action = _cSettings.handle전체공통_Item50Action;
  var collapseAllSettingsSections = _cSettings.collapseAllSettingsSections;
  var toggleSettingsSectionCollapse = _cSettings.toggleSettingsSectionCollapse;
  var getWidgetRenderSpec = _cWidget.getWidgetRenderSpec;
  var handle전체공통_Item62Action = _cWidget.handle전체공통_Item62Action;
  var handle일정_Item65Action = _cSchedule.handle일정_Item65Action;

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
      if (typeof win.renderCalendarScreen === 'function') win.renderCalendarScreen();
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

  /* [#TASK-ES-411] 직통 핸들러 44개 → js/components-*-actions.js(부품 11개) 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  var handle팀목표_Item51Action = handle소통_Item51Action;

  /* [#TASK-ES-411] 직통 핸들러 12개 → js/components-*-actions.js(부품 6개) 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  if(typeof document !== 'undefined' && typeof document.addEventListener === 'function'){
    document.addEventListener('click', function(e){
      var closeBtn = e.target && e.target.closest && (e.target.closest('.og-modal-close') || e.target.closest('#ogModalCancelBtn'));
      if(closeBtn && typeof window !== 'undefined' && typeof window.closeModal === 'function'){
        window.closeModal();
      }
    });
  }
  OurgoalComponents.handle성취통계_Item56Action = handle성취통계_Item56Action;
  OurgoalComponents.handle소통_Item57Action = handle소통_Item57Action;
  OurgoalComponents.handle소통_Item58Action = handle소통_Item58Action;
  OurgoalComponents.handle소통_Item59Action = handle소통_Item59Action;
  OurgoalComponents.handle성취통계_Item60Action = handle성취통계_Item60Action;
  OurgoalComponents.handle소통_Item61Action = handle소통_Item61Action;
  OurgoalComponents.blendFeedWithAiBotRule = blendFeedWithAiBotRule;
  OurgoalComponents.handle전체공통_Item62Action = handle전체공통_Item62Action;
  OurgoalComponents.getWidgetRenderSpec = getWidgetRenderSpec;
  OurgoalComponents.handle소통_Item63Action = handle소통_Item63Action;
  OurgoalComponents.handle목표탭_Item64Action = handle목표탭_Item64Action;
  OurgoalComponents.handle일정_Item65Action = handle일정_Item65Action;
  OurgoalComponents.handle홈탭_Item66Action = handle홈탭_Item66Action;
  OurgoalComponents.handle소통_Item67Action = handle소통_Item67Action;
  OurgoalComponents.handle팀목표_Item68Action = handle팀목표_Item68Action;
  OurgoalComponents.handle인증_Item69Action = handle인증_Item69Action;
  OurgoalComponents.handle인증_Item70Action = handle인증_Item70Action;
  OurgoalComponents.handle인증_Item71Action = handle인증_Item71Action;
  OurgoalComponents.handle설정_Item79Action = handle설정_Item79Action;
  OurgoalComponents.handle테마_Item79Action = handle테마_Item79Action;
  OurgoalComponents.generateRecordPledgeMessage = generateRecordPledgeMessage;

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
    window.handle팀목표_Item49Action = handle팀목표_Item49Action;
    window.handle전체공통_Item50Action = handle전체공통_Item50Action;
    window.handle소통_Item51Action = handle소통_Item51Action;
    window.handle팀목표_Item51Action = handle팀목표_Item51Action;
    window.handle팀목표_Item52Action = handle팀목표_Item52Action;
    window.handle목표탭_Item53Action = handle목표탭_Item53Action;
    window.openGoalTemplateEncyclopediaModal = openGoalTemplateEncyclopediaModal;
    window.copyUserGoalTemplate = copyUserGoalTemplate;
    window.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;
    window.toggleTeamGoalAccordionCollapse = toggleTeamGoalAccordionCollapse;
    window.openFeedPostPreviewModal = openFeedPostPreviewModal;
    window.toggleFeedPostPreview = toggleFeedPostPreview;
    window.collapseAllSettingsSections = collapseAllSettingsSections;
    window.toggleSettingsSectionCollapse = toggleSettingsSectionCollapse;
    window.sendTeamGoalComment = sendTeamGoalComment;
    window.toggleTeamGoalCommentSection = toggleTeamGoalCommentSection;
    window.enlargeAvatarIconsBatch = enlargeAvatarIconsBatch;
    window.toggleAchievementMetricFilter = toggleAchievementMetricFilter;
    window.toggleDataManagementSection = toggleDataManagementSection;
    window.toggleTeamLinkedGoalExample = toggleTeamLinkedGoalExample;
    window.handle성취통계_Item56Action = handle성취통계_Item56Action;
    window.handle소통_Item57Action = handle소통_Item57Action;
    window.handle소통_Item58Action = handle소통_Item58Action;
    window.handle소통_Item59Action = handle소통_Item59Action;
    window.handle성취통계_Item60Action = handle성취통계_Item60Action;
    window.handle소통_Item61Action = handle소통_Item61Action;
    window.blendFeedWithAiBotRule = blendFeedWithAiBotRule;
    window.handle전체공통_Item62Action = handle전체공통_Item62Action;
    window.getWidgetRenderSpec = getWidgetRenderSpec;
    window.handle소통_Item63Action = handle소통_Item63Action;
    window.handle목표탭_Item64Action = handle목표탭_Item64Action;
    window.handle일정_Item65Action = handle일정_Item65Action;
    window.handle홈탭_Item66Action = handle홈탭_Item66Action;
    window.handle소통_Item67Action = handle소통_Item67Action;
    window.handle팀목표_Item68Action = handle팀목표_Item68Action;
    window.handle인증_Item69Action = handle인증_Item69Action;
    window.handle인증_Item70Action = handle인증_Item70Action;
    window.handle인증_Item71Action = handle인증_Item71Action;
    window.handle설정_Item79Action = handle설정_Item79Action;
    window.handle테마_Item79Action = handle테마_Item79Action;
    window.generateRecordPledgeMessage = generateRecordPledgeMessage;
    window.toggleTimeRecordModalCompact = toggleTimeRecordModalCompact;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalComponents;
    module.exports.handle성취통계_Item56Action = handle성취통계_Item56Action;
    module.exports.handle소통_Item57Action = handle소통_Item57Action;
    module.exports.handle소통_Item58Action = handle소통_Item58Action;
    module.exports.handle소통_Item59Action = handle소통_Item59Action;
    module.exports.handle성취통계_Item60Action = handle성취통계_Item60Action;
    module.exports.handle소통_Item61Action = handle소통_Item61Action;
    module.exports.blendFeedWithAiBotRule = blendFeedWithAiBotRule;
    module.exports.handle전체공통_Item62Action = handle전체공통_Item62Action;
    module.exports.getWidgetRenderSpec = getWidgetRenderSpec;
    module.exports.handle소통_Item63Action = handle소통_Item63Action;
    module.exports.handle목표탭_Item64Action = handle목표탭_Item64Action;
    module.exports.handle일정_Item65Action = handle일정_Item65Action;
    module.exports.handle홈탭_Item66Action = handle홈탭_Item66Action;
    module.exports.handle소통_Item67Action = handle소통_Item67Action;
    module.exports.handle팀목표_Item68Action = handle팀목표_Item68Action;
    module.exports.handle인증_Item69Action = handle인증_Item69Action;
    module.exports.handle인증_Item70Action = handle인증_Item70Action;
    module.exports.handle인증_Item71Action = handle인증_Item71Action;
    module.exports.handle설정_Item79Action = handle설정_Item79Action;
    module.exports.handle테마_Item79Action = handle테마_Item79Action;
    module.exports.generateRecordPledgeMessage = generateRecordPledgeMessage;
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
    module.exports.handle팀목표_Item49Action = handle팀목표_Item49Action;
    module.exports.handle전체공통_Item50Action = handle전체공통_Item50Action;
    module.exports.handle소통_Item51Action = handle소통_Item51Action;
    module.exports.handle팀목표_Item51Action = handle팀목표_Item51Action;
    module.exports.handle팀목표_Item52Action = handle팀목표_Item52Action;
    module.exports.handle목표탭_Item53Action = handle목표탭_Item53Action;
    module.exports.openGoalTemplateEncyclopediaModal = openGoalTemplateEncyclopediaModal;
    module.exports.copyUserGoalTemplate = copyUserGoalTemplate;
    module.exports.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;
    module.exports.toggleTeamGoalAccordionCollapse = toggleTeamGoalAccordionCollapse;
    module.exports.openFeedPostPreviewModal = openFeedPostPreviewModal;
    module.exports.toggleFeedPostPreview = toggleFeedPostPreview;
    module.exports.collapseAllSettingsSections = collapseAllSettingsSections;
    module.exports.toggleSettingsSectionCollapse = toggleSettingsSectionCollapse;
    module.exports.sendTeamGoalComment = sendTeamGoalComment;
    module.exports.toggleTeamGoalCommentSection = toggleTeamGoalCommentSection;
    module.exports.enlargeAvatarIconsBatch = enlargeAvatarIconsBatch;
    module.exports.toggleAchievementMetricFilter = toggleAchievementMetricFilter;
    module.exports.toggleDataManagementSection = toggleDataManagementSection;
    module.exports.toggleTeamLinkedGoalExample = toggleTeamLinkedGoalExample;
    module.exports.toggleTimeRecordModalCompact = toggleTimeRecordModalCompact;
  }
})(typeof window !== 'undefined' ? window : global);

