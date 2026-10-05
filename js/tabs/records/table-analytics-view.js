/**
 * OurGoal Table Analytics View (기록 탭 — 표 기록 집계·일자별 추이 차트 그림)
 *
 * #TASK-ES-446 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G138·G139.
 *   옮긴 선언(이전 전 줄): renderAnalyticsHtml(26317~26330) · renderTrendSvgChart(26441~26521)
 * renderAnalyticsHtml = 전문 템플릿 자동 집계 결과 HTML(집계 computeTableAnalytics 는 index.html 에 남음), renderTrendSvgChart = 일자별 성장 추이 SVG(자료 computeTrendChartData 는 남음),
 * (표 안 스톱워치 위젯 G140 은 시험지 stopwatch-lap-inputs·stopwatch-table-hint 가 index.html 글자로 읽어 남음 — 시험지 선행 뒤 옮김)
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  function renderAnalyticsHtml(tpl, cols, rList){
    var a = L.computeTableAnalytics(tpl, cols, rList);
    if(!a.stats || !a.stats.length) return '';
    return '<div class="pro-analytics-banner" id="proAnalyticsBanner">' +
      '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-right:2px;display:flex;align-items:center;gap:4px;white-space:nowrap;"><span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V10"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></svg></span><span>실시간 분석</span></div>' +
      a.stats.map(function(s){
        return '<div class="pro-stat-chip'+(s.highlight?' highlight':'')+'">' +
          '<span class="pro-stat-label">'+L.escapeHtml(s.label)+'</span>' +
          '<span class="pro-stat-value">'+L.escapeHtml(s.value)+'</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  function renderTrendSvgChart(chartData){
    if(!chartData || !chartData.points || !chartData.points.length){
      return '<div class="faint" style="text-align:center;padding:20px;">표시할 추이 데이터가 없습니다.</div>';
    }

    var pts = chartData.points;
    var w = 500;
    var h = 155;
    var padLeft = 45;
    var padRight = 20;
    var padTop = 16;
    var padBottom = 26;

    var min = chartData.min;
    var max = chartData.max;
    var range = (max - min) || 1;

    var coords = pts.map(function(p, i){
      var x = padLeft + (i / Math.max(1, pts.length - 1)) * (w - padLeft - padRight);
      var y = h - padBottom - ((p.value - min) / range) * (h - padTop - padBottom);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, p: p };
    });

    var linePath = 'M ' + coords.map(function(c){ return c.x + ' ' + c.y; }).join(' L ');
    var areaPath = linePath + ' L ' + coords[coords.length - 1].x + ' ' + (h - padBottom) + ' L ' + coords[0].x + ' ' + (h - padBottom) + ' Z';
    var midVal = Math.round((max + min) / 2);
    var gradId = 'trendGrad_' + String(chartData.templateKey || 'tpl').replace(/[^a-zA-Z0-9]/g, '_');

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" class="pro-trend-svg" style="width:100%;height:auto;display:block;">' +
      '<defs>' +
        '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="var(--violet)" stop-opacity="0.25"/>' +
          '<stop offset="100%" stop-color="var(--violet)" stop-opacity="0.0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<line x1="' + padLeft + '" y1="' + padTop + '" x2="' + (w - padRight) + '" y2="' + padTop + '" stroke="var(--rule)" stroke-dasharray="3,3" stroke-width="1"/>' +
      '<text x="' + (padLeft - 6) + '" y="' + (padTop + 4) + '" text-anchor="end" font-size="10" fill="var(--ink-faint)">' + max + '</text>' +
      '<line x1="' + padLeft + '" y1="' + Math.round((padTop + h - padBottom)/2) + '" x2="' + (w - padRight) + '" y2="' + Math.round((padTop + h - padBottom)/2) + '" stroke="var(--rule)" stroke-dasharray="3,3" stroke-width="1"/>' +
      '<text x="' + (padLeft - 6) + '" y="' + (Math.round((padTop + h - padBottom)/2) + 4) + '" text-anchor="end" font-size="10" fill="var(--ink-faint)">' + midVal + '</text>' +
      '<line x1="' + padLeft + '" y1="' + (h - padBottom) + '" x2="' + (w - padRight) + '" y2="' + (h - padBottom) + '" stroke="var(--rule)" stroke-width="1.2"/>' +
      '<text x="' + (padLeft - 6) + '" y="' + (h - padBottom + 4) + '" text-anchor="end" font-size="10" fill="var(--ink-faint)">' + min + '</text>' +
      '<path d="' + areaPath + '" fill="url(#' + gradId + ')"/>' +
      '<path d="' + linePath + '" fill="none" stroke="var(--violet)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      coords.map(function(c){
        var pt = c.p;
        return '<g class="trend-pt-group" data-val="' + L.escapeHtml(pt.label) + '" data-date="' + L.escapeHtml(pt.fullDate) + '">' +
          '<circle cx="' + c.x + '" cy="' + c.y + '" r="4" fill="var(--card)" stroke="var(--violet)" stroke-width="2.2" style="cursor:pointer;"/>' +
          '<text x="' + c.x + '" y="' + (h - padBottom + 16) + '" text-anchor="middle" font-size="10" fill="var(--ink-soft)" font-weight="600">' + pt.date + '</text>' +
        '</g>';
      }).join('') +
    '</svg>';

    var growthBadgeClass = chartData.growthRate >= 0 ? 'up' : 'down';
    var growthIcon = chartData.growthRate >= 0 ? '▲' : '▼';
    var growthSign = chartData.growthRate >= 0 ? '+' : '';

    return '<div class="pro-trend-chart-card" id="trendChartCard">' +
      '<div class="pro-trend-header">' +
        '<div class="pro-trend-title">' +
          '<span>' + L.escapeHtml(chartData.metricName) + ' 성장 추이</span>' +
          (chartData.isSample ? '<span style="font-size:.6875rem;font-weight:400;color:var(--ink-faint);">(초기 시뮬레이션)</span>' : '') +
        '</div>' +
        '<div class="pro-trend-filters" id="trendPeriodFilters">' +
          '<button class="pro-trend-filter-chip active" data-period="7" type="button">7회</button>' +
          '<button class="pro-trend-filter-chip" data-period="30" type="button">30일</button>' +
          '<button class="pro-trend-filter-chip" data-period="all" type="button">전체</button>' +
        '</div>' +
      '</div>' +
      '<div class="pro-trend-svg-wrap" style="position:relative;">' +
        svg +
        '<div class="trend-tooltip" id="trendTooltip"></div>' +
      '</div>' +
      '<div class="pro-trend-kpi-row">' +
        '<div class="pro-trend-kpi-pill">최고: <b>' + chartData.max.toLocaleString() + chartData.unit + '</b></div>' +
        '<div class="pro-trend-kpi-pill">평균: <b>' + chartData.avg.toLocaleString() + chartData.unit + '</b></div>' +
        '<div class="pro-trend-kpi-pill">최근: <b>' + chartData.latest.toLocaleString() + chartData.unit + '</b></div>' +
        '<div class="pro-trend-kpi-pill">성장률: <span class="pro-trend-growth-badge ' + growthBadgeClass + '">' + growthIcon + ' ' + growthSign + chartData.growthRate + '%</span></div>' +
      '</div>' +
    '</div>';
  }

  K.renderAnalyticsHtml = renderAnalyticsHtml;
  K.renderTrendSvgChart = renderTrendSvgChart;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
