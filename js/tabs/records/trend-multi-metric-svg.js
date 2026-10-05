/**
 * OurGoal Trend Multi Metric SVG (기록 탭 — 실천 추이 차트의 여러 측정지표 선 SVG)
 *
 * 「TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진」 묶음의 renderMultiMetricSvg — 켜진 측정지표(몰입시간·실천횟수·달성률·스트릭)마다 선 하나·점들을 그린 SVG 글자를 만든다(js/tabs/records/trend-metrics-chart.js 의 renderWeekChart 가 부른다).
 * window.TREND_METRICS · window.renderMultiMetricSvg 노출 줄은 index.html 원래 자리에 그대로 있다. 시험지 tests/achievement-graph-multiset.test.js 는 합본 도우미 cutFunctionWithExposure(#TASK-ES-519)로 이 함수 글자와 원래 자리 노출 줄을 읽는다.
 * #TASK-ES-520(인라인 3단계 Z4 — FN_NAMES 묶음(목표 보관·히트맵·표 집계·표 추이·여러 지표 SVG)): index.html 인라인 IIFE 의 구간(이전 전 9820~9875줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 9820~9875줄(#TASK-ES-520 생성기 표지) ---- */

  function renderMultiMetricSvg(items, activeMetrics, activeIdx, metricsMap){
    if(!items || !items.length || !activeMetrics || !activeMetrics.length) return '';
    var mDefMap = metricsMap || L.TREND_METRICS;
    var w = 320;
    var h = 76;
    var padX = 18;
    var padY = 10;
    var innerW = w - padX * 2;
    var innerH = h - padY * 2;
    var n = items.length;
    var stepX = n > 1 ? innerW / (n - 1) : innerW / 2;

    var svgLines = '';
    var svgPoints = '';

    // 활성 인덱스 수직 점선 하이라이트
    var highlightLine = '';
    if(typeof activeIdx === 'number' && activeIdx >= 0 && activeIdx < n){
      var actX = padX + (n > 1 ? activeIdx * stepX : innerW / 2);
      highlightLine = '<line x1="' + actX.toFixed(1) + '" y1="' + padY + '" x2="' + actX.toFixed(1) + '" y2="' + (h - padY) + '" stroke="var(--ink-faint, rgba(255,255,255,0.3))" stroke-dasharray="2,2" stroke-width="1.2" opacity="0.8"/>';
    }

    activeMetrics.forEach(function(mKey){
      var m = mDefMap[mKey];
      if(!m) return;
      var vals = items.map(function(it){ return m.getter(it); });
      var maxVal = Math.max.apply(null, vals.concat([1]));

      var pts = vals.map(function(val, idx){
        var x = padX + (n > 1 ? idx * stepX : innerW / 2);
        var ratio = maxVal > 0 ? (val / maxVal) : 0;
        var y = (h - padY) - (ratio * innerH);
        return { x: x, y: y, val: val, idx: idx };
      });

      var dStr = '';
      pts.forEach(function(p, i){
        dStr += (i === 0 ? 'M ' : ' L ') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      });

      svgLines += '<path d="' + dStr + '" fill="none" stroke="' + m.color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />';

      pts.forEach(function(p){
        var isAct = (p.idx === activeIdx);
        var r = isAct ? 4.2 : 2.6;
        svgPoints += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '" fill="' + (isAct ? '#ffffff' : m.color) + '" stroke="' + m.color + '" stroke-width="' + (isAct ? '2.5' : '1.2') + '"/>';
      });
    });

    return '<svg class="trend-multi-svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:' + h + 'px;display:block;margin:4px 0 6px;overflow:visible;">' +
      highlightLine +
      svgLines +
      svgPoints +
    '</svg>';
  }

  K.renderMultiMetricSvg = renderMultiMetricSvg;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
