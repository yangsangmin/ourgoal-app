/**
 * OurGoal Pro Record Trend Chart (기록 — 전문 템플릿 기록 창의 성장 추이 차트)
 *
 * bindProRecTrendChart — 성장 추이 차트의 점 설명 · 기간 칩 · 다시 그리기를 연결하고, 차트를 다시 그리는 함수를 꾸러미(ctx)에 등록한다.
 * 본문은 이전 전 글자 그대로다(#TASK-ES-646 에서 나눈 꼴).
 * #TASK-ES-672(전문 템플릿 기록 창 조각 여섯을 세포로 글자 그대로 이전 — 진입점 · 표 편집 · 도구 단추 · 성장 추이 차트 · 스톱워치·인터벌 타이머 · 저장·닫기 (지시함 DIR-004 (라) A안 ③)): index.html 인라인 IIFE 의 구간(이전 전 3176~3222줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3176~3222줄(#TASK-ES-672 생성기 표지) ---- */
  function bindProRecTrendChart(ctx){ /* [#TASK-ES-646] 전문 템플릿 기록 창 조각 — 성장 추이 차트: 점 설명 · 기간 칩 · 다시 그리기. 꾸러미(ctx)는 openProTemplateRecordModal 가 만든다 */
      ctx.updateTrendChart = updateTrendChart;
      // 📈 표 기록 기반 일자별 자동 성장 추이 차트 제어
      var curChartPeriod = '7';
      function bindChartEvents(){
        var chartWrap = ctx.sheet.querySelector('#proTrendChartWrap');
        if(!chartWrap) return;

        var tip = chartWrap.querySelector('#trendTooltip');
        chartWrap.querySelectorAll('.trend-pt-group').forEach(function(g){
          g.onmouseenter = function(){
            if(!tip) return;
            tip.textContent = (g.dataset.val || '') + ' (' + (g.dataset.date || '') + ')';
            tip.style.display = 'block';
            var rect = g.getBoundingClientRect();
            var wrapRect = chartWrap.getBoundingClientRect();
            tip.style.left = (rect.left - wrapRect.left) + 'px';
            tip.style.top = (rect.top - wrapRect.top - 24) + 'px';
          };
          g.onmouseleave = function(){
            if(tip) tip.style.display = 'none';
          };
        });

        chartWrap.querySelectorAll('.pro-trend-filter-chip').forEach(function(btn){
          btn.onclick = function(){
            curChartPeriod = btn.dataset.period || '7';
            updateTrendChart();
          };
        });
      }

      function updateTrendChart(){
        var chartWrap = ctx.sheet.querySelector('#proTrendChartWrap');
        if(!chartWrap) return;
        var cData = L.computeTrendChartData(ctx.curTpl.key, (L.state.profile && L.state.profile.records) || [], curChartPeriod);
        chartWrap.innerHTML = L.renderTrendSvgChart(cData);
        var activeBtn = chartWrap.querySelector('.pro-trend-filter-chip[data-period="'+curChartPeriod+'"]');
        if(activeBtn){
          chartWrap.querySelectorAll('.pro-trend-filter-chip').forEach(function(b){ b.classList.remove('active'); });
          activeBtn.classList.add('active');
        }
        bindChartEvents();
      }

      bindChartEvents();
  }

  K.bindProRecTrendChart = bindProRecTrendChart;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 시작 · gen-cell-provide.js] 이 세포가 키트에 단 이름을 등록 기관(js/core/cell-registry.js)에 스스로 등록한다 — 대조(compare) 전용, 동작 변화 0. 생성기 산출이므로 손으로 고치지 않는다. ==== */
(function (g) {
  var R = g.OurgoalCellRegistry;
  if (!R) return;
  var K = g.OurgoalRecordsKit;
  if (K) R.provide('records/pro-record-trend-chart', {
    bindProRecTrendChart: K.bindProRecTrendChart
  }, { window: [] });
})(typeof window !== 'undefined' ? window : globalThis);
/* ==== [세포 등록 끝] ==== */
