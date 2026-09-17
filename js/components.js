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
    }
  };

  if(typeof window !== 'undefined'){
    window.OurgoalComponents = OurgoalComponents;
  }
  if(typeof module !== 'undefined' && module.exports){
    module.exports = OurgoalComponents;
  }
})(typeof window !== 'undefined' ? window : global);
