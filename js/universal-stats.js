/**
 * ourgoal - universal-stats.js
 * [TASK-ES-059] 테마 구분 없는 임의 데이터 AI 자율 메트릭 추론 및 다형성 시각화 엔진
 * 
 * 기능:
 * 1. extractMetricsFromRecord: 어떤 데이터(자연어 줄글, 표, CSV, 외부 수치)든 자율 메트릭 추출
 * 2. discoverActiveMetrics: 데이터베이스 내 실존하는 모든 도메인/커스텀 지표 자동 탐색 & 동적 칩 노출
 * 3. aggregateMetricTimeSeries: 1년/6개월/3개월/1주 단위의 다형성 시계열 집계 (sum, avg, max, latest)
 * 4. renderUniversalSvgChart: 지표 특성에 맞춘 다형성 SVG 차트 (면적/꺾은선/막대)
 * 5. generateDomainSample: 체중(78->68kg), 독서(5,200쪽), 수면(6.1->7.8h), 재테크(1,200만), 러닝(120회), 3대(385kg) 등 1년치 실측 데이터 생성
 * 6. renderUniversalStatsDashboard: 성취통계 뷰의 동적 대시보드 및 AI 분석 리포트 장착
 * 7. openUniversalImportModal: CSV/텍스트/추천샘플 3개 탭 통합 가져오기 모달
 */

(function(root){
  'use strict';

  /* ============ [#TASK-ES-392] 통계 세포 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============
     ① 가져오기: js/stats-taxonomy.js · js/stats-data-grid.js · js/stats-lenses.js 로 옮긴 함수를 이 스코프에서 같은 이름으로 부른다(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없다).
     ② 스코프 통로: 옮긴 코드가 읽는 이 스코프의 이름만 OurgoalUniversalStatsKit.scope 에 getter 로 노출한다(목록은 스코프 분석으로 뽑았다).
     [#TASK-ES-401] 2차: js/stats-metrics.js · js/stats-charts.js · js/stats-import.js · js/stats-data-menu.js 도 같은 이음매로 가져온다(require 줄·가져오기 줄·getter 목록에 더했다).
     [#TASK-ES-405] 3차: js/stats-catalog.js · js/stats-samples.js · js/stats-sample-fitness.js · js/stats-sample-growth.js · js/stats-ontology.js · js/stats-export.js · js/stats-fullscreen.js · js/stats-differentiated.js 도 같은 이음매로 가져온다. 카탈로그 상수는 공장 함수(create<이름>)를 이전 자리에서 불러 같은 객체를 쥔다. */
  var _statsKit = root.OurgoalUniversalStatsKit;
  if(!_statsKit && typeof require === 'function'){ require('./stats-taxonomy.js'); require('./stats-data-grid.js'); require('./stats-lenses.js'); require('./stats-metrics.js'); require('./stats-charts.js'); require('./stats-import.js'); require('./stats-data-menu.js'); require('./stats-catalog.js'); require('./stats-samples.js'); require('./stats-sample-fitness.js'); require('./stats-sample-growth.js'); require('./stats-ontology.js'); require('./stats-export.js'); require('./stats-fullscreen.js'); require('./stats-differentiated.js'); _statsKit = root.OurgoalUniversalStatsKit; }
  _statsKit = _statsKit || {};
  var openTaxonomyManagerModal = _statsKit.openTaxonomyManagerModal;
  var openUniversalDataGrid = _statsKit.openUniversalDataGrid;
  var openRowEditModal = _statsKit.openRowEditModal;
  var computeCrossRatioSeries = _statsKit.computeCrossRatioSeries;
  var renderCrossRatioSvg = _statsKit.renderCrossRatioSvg;
  var renderRadarSvg = _statsKit.renderRadarSvg;
  var computeCadenceData = _statsKit.computeCadenceData;
  var renderCadenceSvg = _statsKit.renderCadenceSvg;
  var generateStatisticalDiagnosticReport = _statsKit.generateStatisticalDiagnosticReport;
  var ensureMetricConfig = _statsKit.ensureMetricConfig;
  var extractMetricsFromRecord = _statsKit.extractMetricsFromRecord;
  var discoverActiveMetrics = _statsKit.discoverActiveMetrics;
  var aggregateMetricTimeSeries = _statsKit.aggregateMetricTimeSeries;
  var renderUniversalSvgChart = _statsKit.renderUniversalSvgChart;
  var aggregateMultiSeries = _statsKit.aggregateMultiSeries;
  var calcNiceStep = _statsKit.calcNiceStep;
  var renderMultiSeriesSvg = _statsKit.renderMultiSeriesSvg;
  var normalizeHistoricalDate = _statsKit.normalizeHistoricalDate;
  var parseCsvToUniversalRecords = _statsKit.parseCsvToUniversalRecords;
  var openUniversalImportModal = _statsKit.openUniversalImportModal;
  var openGuideModal = _statsKit.openGuideModal;
  var openDataManagementModal = _statsKit.openDataManagementModal;
  var createMetricConfigs = _statsKit.createMetricConfigs;
  var createSampleThemes = _statsKit.createSampleThemes;
  var createThemeMetricSpecs = _statsKit.createThemeMetricSpecs;
  var createRaw52wPowerliftingData = _statsKit.createRaw52wPowerliftingData;
  var createDomains = _statsKit.createDomains;
  var createMetricDifferentiatedModels = _statsKit.createMetricDifferentiatedModels;
  var generateDomainSample = _statsKit.generateDomainSample;
  var generate52WeekPowerliftingSample = _statsKit.generate52WeekPowerliftingSample;
  var generate1920sOlympicStrengthSample = _statsKit.generate1920sOlympicStrengthSample;
  var getChosung = _statsKit.getChosung;
  var matchQuery = _statsKit.matchQuery;
  var inferDomainKey = _statsKit.inferDomainKey;
  var buildUniversalOntology = _statsKit.buildUniversalOntology;
  var exportCleanCsv = _statsKit.exportCleanCsv;
  var captureChartSnapshot = _statsKit.captureChartSnapshot;
  var openStatsFullscreenModal = _statsKit.openStatsFullscreenModal;
  var computeDifferentiatedAnalysis = _statsKit.computeDifferentiatedAnalysis;
  var renderDifferentiatedReportCard = _statsKit.renderDifferentiatedReportCard;
  var openDifferentiatedMetricConfigModal = _statsKit.openDifferentiatedMetricConfigModal;
  Object.defineProperties(_statsKit.scope || (_statsKit.scope = {}), Object.getOwnPropertyDescriptors({
    get DOMAINS(){ return DOMAINS; },
    get METRIC_CONFIGS(){ return METRIC_CONFIGS; },
    get METRIC_DIFFERENTIATED_MODELS(){ return METRIC_DIFFERENTIATED_MODELS; },
    get RAW_52W_POWERLIFTING_DATA(){ return RAW_52W_POWERLIFTING_DATA; },
    get SAMPLE_THEMES(){ return SAMPLE_THEMES; },
    get THEME_METRIC_SPECS(){ return THEME_METRIC_SPECS; },
    get askConfirm(){ return askConfirm; },
    get buildUniversalOntology(){ return buildUniversalOntology; },
    get captureChartSnapshot(){ return captureChartSnapshot; },
    get dateKey(){ return dateKey; },
    get exportCleanCsv(){ return exportCleanCsv; },
    get generate1920sOlympicStrengthSample(){ return generate1920sOlympicStrengthSample; },
    get generate52WeekPowerliftingSample(){ return generate52WeekPowerliftingSample; },
    get generateDomainSample(){ return generateDomainSample; },
    get getChosung(){ return getChosung; },
    get inferDomainKey(){ return inferDomainKey; },
    get matchQuery(){ return matchQuery; },
    get pad(){ return pad; }
  }));
  var askConfirm = ((typeof OurgoalCapabilities !== 'undefined' && OurgoalCapabilities.has('ui.confirm.bind')) ? OurgoalCapabilities.request('ui.confirm.bind') : typeof require === 'function' ? require('./core/confirm.js').bind : function(get){ return function(m){ var o = get(); return Promise.resolve(typeof o === 'function' ? o(m) : false); }; })(function(){ return null; });
  /* ================= 0. 헬퍼 유틸리티 ================= */
  function pad(n){ return n < 10 ? '0' + n : String(n); }
  function dateKey(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDuration(ms){
    if(!ms || ms <= 0) return '0분';
    var totalMin = Math.round(ms / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if(h > 0 && m > 0) return h + '시간 ' + m + '분';
    if(h > 0) return h + '시간';
    return m + '분';
  }

  /* ================= 1. 표준 메트릭 카탈로그 & 동적 확장 레지스트리 ================= */
  var METRIC_CONFIGS = createMetricConfigs();
  /* [#TASK-ES-405] createMetricConfigs → js/stats-catalog.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] ensureMetricConfig · extractMetricsFromRecord · discoverActiveMetrics · aggregateMetricTimeSeries → js/stats-metrics.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] renderUniversalSvgChart → js/stats-charts.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 4-9. 추천 샘플 테마별 35종 카탈로그 (#TASK-ES-093) ================= */
  var SAMPLE_THEMES = createSampleThemes();
  /* [#TASK-ES-405] createSampleThemes → js/stats-catalog.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  var THEME_METRIC_SPECS = createThemeMetricSpecs();
  /* [#TASK-ES-405] createThemeMetricSpecs → js/stats-catalog.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-405] generateDomainSample → js/stats-samples.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] normalizeHistoricalDate → js/stats-import.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 5-1. 52주 3대운동 주기화 156세션 정본 데이터 ================= */
  var RAW_52W_POWERLIFTING_DATA = createRaw52wPowerliftingData();
  /* [#TASK-ES-405] createRaw52wPowerliftingData → js/stats-catalog.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-405] generate52WeekPowerliftingSample · generate1920sOlympicStrengthSample → js/stats-samples.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] parseCsvToUniversalRecords → js/stats-import.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 5-3. 기존 아워골 기록 + 외부 데이터 자율 온톨로지 색인 ================= */

  /* ================= 5-3. 8대 도메인 다형성 온톨로지 빌더 ================= */
    var DOMAINS = createDomains();
  /* [#TASK-ES-405] createDomains → js/stats-catalog.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-405] getChosung · matchQuery · inferDomainKey · buildUniversalOntology → js/stats-ontology.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] aggregateMultiSeries · calcNiceStep · renderMultiSeriesSvg → js/stats-charts.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-405] exportCleanCsv · captureChartSnapshot → js/stats-export.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] openGuideModal → js/stats-data-menu.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-392] openTaxonomyManagerModal → js/stats-taxonomy.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-392] openUniversalDataGrid · openRowEditModal → js/stats-data-grid.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  
  /* ================= 5-4-B. 4대 다차원 분석 렌즈 엔진 (Cross-Ratio, Radar, Cadence, Diagnostics) ================= */
  
  /* [#TASK-ES-392] computeCrossRatioSeries · renderCrossRatioSvg · renderRadarSvg · computeCadenceData · renderCadenceSvg · generateStatisticalDiagnosticReport → js/stats-lenses.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 9-B. 데이터 관리 및 도구 통합 모달 (#TASK-ES-092) ================= */

  /* [#TASK-ES-401] openDataManagementModal → js/stats-data-menu.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

/* ================= 10. 프로페셔널 데이터 콕핏 메인 렌더러 ================= */
  function renderUniversalStatsDashboard(container, allRecs, state, callbacks){

    if(!container) return;
    callbacks = callbacks || {};
    state = state || {};

    var customSchemas = (state.profile && state.profile.customSchemas) || [];
    var ontology = buildUniversalOntology(allRecs, customSchemas);

    if(ontology.length === 0){
      container.innerHTML = 
        '<div class="card" style="padding:18px 14px;text-align:center;border-radius:14px;background:var(--card);border:1px solid var(--border);">' +
          '<div style="font-size:1.6rem;margin-bottom:6px;">📊</div>' +
          '<div style="font-weight:800;font-size:1rem;color:var(--ink);">자율 다차원 통계 분석기</div>' +
          '<div style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;margin-bottom:14px;line-height:1.5;">영업 실적, 개발 커밋, 수험 공부, 자산, 운동 등 어떤 데이터든 AI가 감지해 다차원으로 분석해요.</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;margin-bottom:12px;">' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="sales" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">💼</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">B2B 영업 실적</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 매출·계약</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="coding" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">💻</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">개발자 활동</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 커밋·PR</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" data-type="study" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">📖</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">수험·공부</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 문제·순공</span>' +
            '</button>' +
            '<button type="button" class="btn btn-ghost btn-sm u-empty-load-btn" id="uEmptyLoadBig3Btn" data-type="big3" style="padding:10px 8px;border-radius:10px;border:1px solid var(--border);background:var(--card2);display:flex;flex-direction:column;align-items:center;gap:4px;height:auto;cursor:pointer;">' +
              '<span style="font-size:1.2rem;">🏃</span>' +
              '<span style="font-weight:700;font-size:.75rem;color:var(--ink);">건강·운동</span>' +
              '<span style="font-size:.65rem;color:var(--ink-soft);">52주 중량·세션</span>' +
            '</button>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm" id="uEmptyImportBtn" style="font-weight:700;padding:8px 16px;"><span>📥 내 데이터 가져오기 (CSV / 직접입력)</span></button>' +
        '</div>';

      container.querySelectorAll('.u-empty-load-btn').forEach(function(btn){
        btn.onclick = function(){
          var sType = btn.dataset.type;
          var sRecs = [];
          if(sType === 'sales') sRecs = generateDomainSample('sales');
          else if(sType === 'coding') sRecs = generateDomainSample('coding');
          else if(sType === 'study') sRecs = generateDomainSample('study');
          else sRecs = generate52WeekPowerliftingSample();

          var cur = (state && state.profile && state.profile.records) || [];
          if(state && state.profile) state.profile.records = cur.concat(sRecs);
          if(callbacks.saveProfile) callbacks.saveProfile();
          if(callbacks.onDone) callbacks.onDone();
          renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || sRecs, state, callbacks);
        };
      });

      var impBtn = container.querySelector('#uEmptyImportBtn');
      if(impBtn){
        impBtn.onclick = function(){
          openUniversalImportModal({
            openModal: callbacks.openModal || window.openModal,
            closeModal: callbacks.closeModal || window.closeModal,
            toast: callbacks.toast || window.toast,
            state: state,
            saveProfile: callbacks.saveProfile,
            onDone: function(){
              if(callbacks.onDone) callbacks.onDone();
              renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || [], state, callbacks);
            }
          });
        };
      }
      return;
    }

    var isExpanded = true;
    try {
      if(typeof localStorage !== 'undefined'){
        var savedExp = localStorage.getItem('ourgoal_uStats_expanded');
        if(savedExp === 'false') isExpanded = false;
      }
    } catch(e){}

    var curLens = state.univLens || 'trend';
    state.univLens = curLens;
        var mode = state.univMode || 'single';
    var selected = state.univSelectedEntities;
    if(!selected || selected.length === 0){
      selected = [ontology[0].name];
      state.univSelectedEntities = selected;
    }

    // 선택된 엔티티가 가진 모든 측정 차원(Metric Dimensions) 동적 수집
    var targetEntityNames = (mode === 'all') ? ontology.map(function(o){ return o.name; }) : selected;
    var availableDims = [];
    var specificDims = [];
    targetEntityNames.forEach(function(name){
      var ent = ontology.find(function(o){ return o.name === name; });
      if(ent && Array.isArray(ent.dimensions)){
        ent.dimensions.forEach(function(d){
          if(d === 'primary' || d === 'secondary' || d === 'primaryUnit' || d === 'secondaryUnit') return;
          if(!specificDims.includes(d)) specificDims.push(d);
        });
      }
    });
    if(specificDims.length > 0){
      availableDims = specificDims;
    } else {
      availableDims = ['primary'];
    }

    var selectedDims = state.univSelectedDimensions;
    if(!Array.isArray(selectedDims) || selectedDims.length === 0){
      var initDim = state.univDimension || availableDims[0];
      if(!availableDims.includes(initDim)) initDim = availableDims[0];
      selectedDims = [initDim];
      state.univSelectedDimensions = selectedDims;
    } else {
      selectedDims = selectedDims.filter(function(d){ return availableDims.includes(d); });
      if(selectedDims.length === 0){
        selectedDims = [availableDims[0]];
      }
      state.univSelectedDimensions = selectedDims;
    }

    var dimension = state.univDimension;
    if(!dimension || !selectedDims.includes(dimension)){
      dimension = selectedDims[0];
      state.univDimension = dimension;
    }

    var hasHistorical = (allRecs || []).some(function(r){
      var yr = parseInt((r.startAt || '').slice(0, 4), 10);
      return !isNaN(yr) && yr < 2025;
    });
    var period = state.univPeriod || (hasHistorical ? 'all' : '1y');
    state.univPeriod = period;

    var scaleMode = state.univScaleMode || 'linear';

    var dimDisplayNames = {
      '1rm': '추정 1RM(kg)',
      'estimated_1rm_kg': '1RM(kg)',
      'volume': '총 볼륨(kg)',
      'daily_volume_kg': '일일 볼륨(kg)',
      'bodyweight': '체중(kg)',
      'bodyweight_kg': '체중(kg)',
      'sets': '세트수',
      'record': '완주기록(초)',
      'pace': '페이스',
      'rpe': '체감강도(RPE)',
      'intensity': '운동강도(%)',
      'distance': '거리(km)',
      'pages': '독서량(쪽)',
      'duration': '소요시간(분)',
      'revenue': '매출액(만원)',
      'contracts': '계약건수(건)',
      'deals': '계약건수(건)',
      'score': '점수(점)',
      'problems': '문제수(개)',
      'commits': '커밋수(개)',
      'prs': 'PR수(개)',
      'reviews': '코드리뷰(건)',
      'meetings': '미팅(회)',
      'proposals': '제안서(건)',
      'savings': '저축액(만원)',
      'hours': '수면(시간)',
      'primary': '1차 지표',
      'secondary': '2차 지표'
    };

    var activeEntityKeys = (mode === 'all') ? ontology.map(function(o){ return o.name; }) : selected;
    var seriesMap = {};
    if(selectedDims.length <= 1){
      seriesMap = aggregateMultiSeries(allRecs, activeEntityKeys, dimension, period, mode);
    } else {
      // 복수 지표 다중 선택 시: 모든 선택된 지표의 시계열을 단일 차트에 오버레이 (#TASK-ES-172)
      selectedDims.forEach(function(d){
        var dLabel = dimDisplayNames[d] || d;
        var subMap = aggregateMultiSeries(allRecs, activeEntityKeys, d, period, mode);
        Object.keys(subMap).forEach(function(entKey){
          var subSeries = subMap[entKey];
          if(subSeries && subSeries.points && subSeries.points.length > 0){
            var combinedKey = (activeEntityKeys.length === 1 && mode !== 'all') ? dLabel : (entKey + ' (' + dLabel + ')');
            var cloned = Object.assign({}, subSeries);
            cloned.entity = combinedKey;
            seriesMap[combinedKey] = cloned;
          }
        });
      });
      if(Object.keys(seriesMap).length === 0){
        seriesMap = aggregateMultiSeries(allRecs, activeEntityKeys, dimension, period, mode);
      }
    }

    // 1. 헤더 (1-Line Compact & Intuitive Header)
    var headerHtml = 
      '<div class="u-cockpit-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-radius:12px;cursor:pointer;user-select:none;border:1px solid var(--border);">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.15rem;">📊</span>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:800;font-size:.9375rem;color:var(--ink);">성취 분석 콕핏</span>' +
              '<span class="badge" style="font-size:.6875rem;padding:2px 6px;border-radius:10px;background:rgba(37,99,235,0.12);color:var(--primary);font-weight:800;font-family:monospace;">' + activeEntityKeys.length + '개 종목</span>' +
            '</div>' +
            '<div style="font-size:.6875rem;color:var(--ink-soft);margin-top:1px;">기록 향상 곡선과 실천 패턴 다각도 분석</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<button type="button" class="btn btn-ghost btn-xs" id="uHdrMgmtMenuBtn" onclick="event.stopPropagation();" style="font-size:.75rem;padding:4px 9px;font-weight:700;border:1px solid var(--border);border-radius:8px;background:var(--card2);cursor:pointer;">' +
            '⚙️ 데이터 관리 ▾' +
          '</button>' +
          '<span id="uAccordionToggleIcon" title="접기/펼치기" style="cursor:pointer;font-size:.75rem;padding:2px 6px;font-weight:800;color:var(--ink-soft);">' + (isExpanded ? '▲' : '▼') + '</span>' +
          '<!-- 하위 호환성 앵커 (스크립트/테스트 참조 보존) -->' +
          '<div style="display:none;">' +
            '<button type="button" id="uHdrGridBtn"></button>' +
            '<button type="button" id="uHdrImportBtn"></button>' +
            '<button type="button" id="uHdrExportCsvBtn"></button>' +
            '<button type="button" id="uHdrSnapBtn"></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 1-B. 3단계 사용법 퀵 가이드
    var quickGuideHtml = 
      '<div class="u-cockpit-quick-guide" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 10px;background:var(--card2);border-radius:8px;margin-bottom:8px;font-size:.75rem;color:var(--ink-soft);flex-wrap:wrap;">' +
        '<span style="font-weight:800;color:var(--primary);display:flex;align-items:center;gap:3px;"><span>💡</span><span>사용법:</span></span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">1</b> 렌즈 선택</span>' +
        '<span style="opacity:0.4;">➔</span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">2</b> 종목 탭</span>' +
        '<span style="opacity:0.4;">➔</span>' +
        '<span style="font-weight:700;color:var(--ink);"><b style="color:var(--primary);">3</b> 성장 분석 확인</span>' +
      '</div>';

    // 2. 컨트롤 바 (기간 & 스케일 알약)
    var periodTabs = [
      { id: 'all', label: '전체 (ALL)' },
      { id: '1y', label: '1Y' },
      { id: '6m', label: '6M' },
      { id: '3m', label: '3M' },
      { id: '1m', label: '1M' },
      { id: '1w', label: '1W' },
      { id: '3d', label: '3D' }
    ];

    var periodHtml = '<div style="display:flex;gap:3px;background:var(--card2);padding:2px;border-radius:8px;">';
    periodTabs.forEach(function(pt){
      var isPAct = (period === pt.id);
      periodHtml += '<button type="button" class="u-period-btn" data-period="' + pt.id + '" style="padding:3px 7px;border:none;border-radius:6px;font-size:.7rem;font-weight:700;font-family:monospace;cursor:pointer;background:' + (isPAct ? 'var(--card)' : 'transparent') + ';color:' + (isPAct ? 'var(--primary)' : 'var(--ink)') + ';box-shadow:' + (isPAct ? '0 1px 2px rgba(0,0,0,0.08)' : 'none') + ';">' + pt.label + '</button>';
    });
    periodHtml += '</div>';

    var scaleToggleHtml = 
      '<div style="display:flex;gap:2px;background:var(--card2);padding:2px;border-radius:6px;">' +
        '<button type="button" class="u-scale-btn" data-scale="linear" style="padding:3px 6px;border:none;border-radius:4px;font-size:.6875rem;font-weight:700;cursor:pointer;background:' + (scaleMode === 'linear' ? 'var(--primary)' : 'transparent') + ';color:' + (scaleMode === 'linear' ? '#fff' : 'var(--ink)') + ';">실제 수치</button>' +
        '<button type="button" class="u-scale-btn" data-scale="normalized" style="padding:3px 6px;border:none;border-radius:4px;font-size:.6875rem;font-weight:700;cursor:pointer;background:' + (scaleMode === 'normalized' ? 'var(--primary)' : 'transparent') + ';color:' + (scaleMode === 'normalized' ? '#fff' : 'var(--ink)') + ';">100% 상대 비교</button>' +
      '</div>';

    // 4대 다차원 분석 렌즈 전환 바 (고밀도 반응형 세그먼트)
    var lenses = [
      { id: 'trend', icon: '📈', label: '성장 추세', sub: '시계열·PR' },
      { id: 'ratio', icon: '⚡', label: '효율 분석', sub: '단가·비율' },
      { id: 'radar', icon: '🎯', label: '균형 레이더', sub: '달성도·방사형' },
      { id: 'cadence', icon: '🗓️', label: '요일 주기', sub: '루틴·밀도' }
    ];
    var lensHtml = '<div class="u-lens-row" style="display:flex;gap:4px;background:var(--card2);padding:3px;border-radius:10px;margin-bottom:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    lenses.forEach(function(l){
      var isLAct = (curLens === l.id);
      var actBg = isLAct ? 'var(--primary, #2563eb)' : 'transparent';
      var actFg = isLAct ? '#ffffff' : 'var(--ink)';
      var actShadow = isLAct ? '0 2px 6px rgba(37,99,235,0.25)' : 'none';
      lensHtml += 
        '<button type="button" class="u-lens-btn" data-lens="' + l.id + '" style="flex:1;min-width:78px;padding:7px 4px;border:none;border-radius:8px;cursor:pointer;background:' + actBg + ';color:' + actFg + ';box-shadow:' + actShadow + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all 0.18s ease;user-select:none;">' +
          '<div style="display:flex;align-items:center;gap:3px;font-size:.75rem;font-weight:800;">' +
            '<span>' + l.icon + '</span><span>' + l.label + '</span>' +
          '</div>' +
          '<span style="font-size:.625rem;opacity:' + (isLAct ? '0.9' : '0.65') + ';font-family:sans-serif;letter-spacing:-0.2px;">' + l.sub + '</span>' +
        '</button>';
    });
    lensHtml += '</div>';

    var lensExplanations = {
      trend: '📈 <b>성장 추세</b>: 선택한 종목의 시간 흐름에 따른 기록 향상 곡선과 역대 최고 기록을 추적합니다.',
      ratio: '⚡ <b>성과 효율 분석</b>: 투자한 시간이나 노력 대비 실질적 성과 비율을 분석합니다.',
      radar: '🎯 <b>균형 레이더</b>: 전체 활동 영역의 비중과 균형도를 방사형 차트로 종합 평가합니다.',
      cadence: '🗓️ <b>요일 주기</b>: 요일별 활동 실천 횟수와 집중 요일을 파악하여 루틴을 점검합니다.'
    };
    var lensExpBannerHtml = 
      '<div class="u-lens-exp-banner" style="font-size:.75rem;color:var(--ink-soft);background:var(--card2);padding:7px 10px;border-radius:8px;margin-bottom:10px;border-left:3px solid var(--primary);line-height:1.4;">' +
        (lensExplanations[curLens] || lensExplanations.trend) +
      '</div>';

    // 3. 엔티티 칩 타이틀 및 목록
    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
    var chipsTitleHtml = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="font-size:.78125rem;font-weight:800;color:var(--ink);">🎯 분석할 항목 (탭하여 선택):</span>' +
        '<div style="display:flex;gap:4px;align-items:center;">' +
          '<button type="button" class="btn btn-xs btn-ghost u-mode-btn" data-mode="' + (mode === 'all' ? 'single' : 'all') + '" style="font-size:.6875rem;padding:2px 7px;border:1px solid var(--border);border-radius:6px;font-weight:700;cursor:pointer;">' +
            (mode === 'all' ? '🎯 개별 선택 모드' : '✨ 전체 모아보기') +
          '</button>' +
        '</div>' +
      '</div>';

    var chipsHtml = '<div class="u-entity-chip-row" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;-webkit-overflow-scrolling:touch;">';
    ontology.forEach(function(o, idx){
      var isSel = (mode === 'all') || selected.includes(o.name);
      var cIdx = selected.indexOf(o.name);
      var cColor = cIdx !== -1 ? colors[cIdx % colors.length] : (isSel ? 'var(--primary)' : 'var(--card2)');
      var bg = isSel ? cColor : 'var(--card2)';
      var fg = isSel ? '#ffffff' : 'var(--ink)';
      var bd = isSel ? 'none' : '1px solid var(--border)';

      chipsHtml += 
        '<button type="button" class="u-entity-chip" data-name="' + o.name + '" style="flex-shrink:0;padding:5px 11px;border-radius:16px;font-size:.75rem;font-weight:700;background:' + bg + ';color:' + fg + ';border:' + bd + ';cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:' + (isSel ? '0 1px 3px rgba(0,0,0,0.12)' : 'none') + ';">' +
          '<span>' + (isSel && mode !== 'all' ? '✓ ' : '') + o.icon + ' ' + o.name + '</span>' +
          '<span style="font-size:.65rem;opacity:0.85;">(' + o.count + ')</span>' +
        '</button>';
    });
    chipsHtml += '</div>';

    // 3-1. 측정 차원(Metric Dimension) 전환 바

    var dimHtml = '<div class="u-dim-selector-row" style="display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;-webkit-overflow-scrolling:touch;align-items:center;">';
    dimHtml += '<span style="font-size:.75rem;font-weight:800;color:var(--ink);flex-shrink:0;margin-right:4px;">📊 측정 기준:</span>';
    availableDims.forEach(function(d){
      var isDAct = (state.univSelectedDimensions || [dimension]).includes(d);
      var dLabel = dimDisplayNames[d] || d;
      dimHtml += 
        '<button type="button" class="u-dim-btn" data-dim="' + d + '" style="flex-shrink:0;padding:4px 10px;border-radius:14px;font-size:.75rem;font-weight:700;cursor:pointer;border:1.5px solid ' + (isDAct ? 'var(--primary, #2563eb)' : 'var(--border, #cbd5e1)') + ';background:' + (isDAct ? 'rgba(37,99,235,0.14)' : 'var(--card2)') + ';color:' + (isDAct ? 'var(--primary, #1d4ed8)' : 'var(--ink)') + ';box-shadow:' + (isDAct ? '0 1px 2px rgba(0,0,0,0.06)' : 'none') + ';transition:all 0.15s ease;">' +
          (isDAct ? '● ' : '○ ') + dLabel +
        '</button>';
    });
    dimHtml += '</div>';

    // 4. 다차원 분석 렌즈별 정밀 데이터 계산 및 인터랙티브 페어 매핑
    var chartObj = renderMultiSeriesSvg(seriesMap, { width: 520, height: 210, scaleMode: scaleMode, period: period });
    var seriesKeys = Object.keys(seriesMap || {});
    var allEntityNames = ontology.map(function(o){ return o.name; });

    // 상관 효율비 동적 페어 선택기 (Interactive Pair Selector)
    var selRatioNum = state.univRatioNum || allEntityNames[0] || '';
    var selRatioDen = state.univRatioDen || (allEntityNames.length > 1 ? allEntityNames[1] : allEntityNames[0]) || '';
    if(!allEntityNames.includes(selRatioNum)) selRatioNum = allEntityNames[0] || '';
    if(!allEntityNames.includes(selRatioDen)) selRatioDen = (allEntityNames.length > 1 ? allEntityNames[1] : allEntityNames[0]) || '';
    state.univRatioNum = selRatioNum;
    state.univRatioDen = selRatioDen;

    var sA = seriesMap[selRatioNum] || (seriesKeys[0] ? seriesMap[seriesKeys[0]] : null);
    var sB = seriesMap[selRatioDen] || (seriesKeys[1] ? seriesMap[seriesKeys[1]] : sA);
    var ratioData = computeCrossRatioSeries(sA, sB);
    var cadenceData = computeCadenceData(allRecs);

    // 범례 (Legend)
    var legendHtml = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;padding:2px 4px;">';
    seriesKeys.forEach(function(k, idx){
      var s = seriesMap[k];
      var col = colors[idx % colors.length];
      legendHtml += 
        '<div style="display:flex;align-items:center;gap:4px;font-size:.7rem;font-weight:700;color:var(--ink);">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + col + ';display:inline-block;"></span>' +
          '<span>' + s.entity + '</span>' +
          '<span style="color:' + col + ';font-family:monospace;">' + (s.latestVal ? (s.latestVal + (s.unit ? (' ' + s.unit) : '')) : '-') + '</span>' +
        '</div>';
    });
    legendHtml += '</div>';

    var mainChartContentHtml = '';
    if(curLens === 'trend'){
      mainChartContentHtml = 
        chartObj.svgHtml +
        '<div id="uFloatingInspector" style="display:none;position:absolute;z-index:30;background:rgba(15,23,42,0.95);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);color:#fff;padding:8px 12px;border-radius:10px;font-size:.75rem;pointer-events:auto;box-shadow:0 12px 28px -4px rgba(0,0,0,0.48);max-width:215px;">' +
          '<div id="uTipDate" style="font-size:.6875rem;color:#94a3b8;font-family:monospace;"></div>' +
          '<div id="uTipVal" style="font-size:.875rem;font-weight:800;color:#38bdf8;margin:2px 0;"></div>' +
          '<div id="uTipDelta" style="font-size:.6875rem;color:#34d399;"></div>' +
          '<div id="uTipMemo" style="font-size:.6875rem;color:#cbd5e1;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>' +
          '<button type="button" class="btn btn-xs btn-ghost" id="uTipEditBtn" style="margin-top:4px;padding:1px 6px;font-size:.65rem;color:#fff;border:1px solid rgba(255,255,255,0.3);width:100%;">✏️ 이 기록 수정</button>' +
        '</div>' +
        legendHtml;
    } else if(curLens === 'ratio'){
      var ratioPairBar = 
        '<div class="u-ratio-pair-bar" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 10px;background:var(--card);border-radius:10px;margin-bottom:10px;border:1px solid var(--border);flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<span style="font-size:.6875rem;font-weight:800;color:var(--primary);font-family:monospace;">분자(A):</span>' +
              '<select id="uRatioNumSelect" style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--ink);border:1px solid var(--border);font-weight:700;cursor:pointer;">' +
                allEntityNames.map(function(n){ return '<option value="' + n + '"' + (n === selRatioNum ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
            '<span style="font-size:1rem;font-weight:900;color:var(--ink-soft);user-select:none;">÷</span>' +
            '<div style="display:flex;align-items:center;gap:4px;">' +
              '<span style="font-size:.6875rem;font-weight:800;color:#10b981;font-family:monospace;">분모(B):</span>' +
              '<select id="uRatioDenSelect" style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:var(--card2);color:var(--ink);border:1px solid var(--border);font-weight:700;cursor:pointer;">' +
                allEntityNames.map(function(n){ return '<option value="' + n + '"' + (n === selRatioDen ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:.6875rem;font-weight:800;color:var(--brand);padding:3px 8px;border-radius:12px;background:rgba(139,92,246,0.12);font-family:monospace;">' +
            '효율단위: ' + (ratioData ? ratioData.unit : '-') +
          '</div>' +
        '</div>';

      mainChartContentHtml = 
        ratioPairBar +
        '<div style="padding:4px 0;">' +
          renderCrossRatioSvg(ratioData, { width: 520, height: 210 }) +
        '</div>';
    } else if(curLens === 'radar'){
      mainChartContentHtml = 
        '<div style="padding:6px 0;display:flex;justify-content:center;">' +
          renderRadarSvg(ontology, seriesMap, { size: 260 }) +
        '</div>';
    } else if(curLens === 'cadence'){
      mainChartContentHtml = 
        '<div style="padding:4px 0;">' +
          renderCadenceSvg(cadenceData, { width: 520, height: 180 }) +
        '</div>';
    }

    // 5. 4대 수학적 정량 KPI 바 (PEAK | LATEST | NET DELTA | VELOCITY)
    var seriesArray = Object.values(seriesMap);
    var peakStr = '-';
    var latestStr = '-';
    var deltaStr = '-';
    var velocityStr = '-';

    if(curLens === 'ratio' && ratioData){
      peakStr = (ratioData.avgRatio > 0 ? (ratioData.avgRatio + ' ' + ratioData.unit) : '-');
      var rPts = ratioData.points || [];
      latestStr = (rPts.length > 0 ? (rPts[rPts.length - 1].val + ' ' + ratioData.unit) : '-');
      deltaStr = rPts.length > 1 ? (Math.round((rPts[rPts.length - 1].val - rPts[0].val)*10)/10 + ' ' + ratioData.unit) : '단일 관측';
      velocityStr = ratioData.label;
    } else if(curLens === 'cadence' && cadenceData){
      var sortedC = cadenceData.slice().sort(function(a,b){ return b.count - a.count; });
      peakStr = sortedC[0].count > 0 ? (sortedC[0].day + '요일 (' + sortedC[0].pct + '%)') : '-';
      var totSess = cadenceData.reduce(function(acc, c){ return acc + c.count; }, 0);
      latestStr = totSess + '회 총 실천';
      deltaStr = '주 7일 분포';
      velocityStr = (Math.round((totSess / 52)*10)/10) + '회/주 평균';
    } else if(seriesArray.length === 1){
      var sSingle = seriesArray[0];
      peakStr = (sSingle.prVal ? (sSingle.prVal.toLocaleString() + ' ' + sSingle.unit) : '-');
      latestStr = (sSingle.latestVal ? (sSingle.latestVal.toLocaleString() + ' ' + sSingle.unit) : '-');
      deltaStr = (sSingle.netDelta !== 0 ? ((sSingle.netDelta > 0 ? '+' : '') + sSingle.netDelta + ' ' + sSingle.unit + ' (' + (sSingle.growthRate > 0 ? '+' : '') + sSingle.growthRate + '%)') : '변동없음');
      velocityStr = (sSingle.velocityPerWeek !== 0 ? ((sSingle.velocityPerWeek > 0 ? '+' : '') + sSingle.velocityPerWeek + ' ' + sSingle.unit + '/주') : '-');
    } else if(seriesArray.length > 1){
      var totalPrSum = 0;
      var totalLatest = 0;
      seriesArray.forEach(function(s){
        if(s.prVal) totalPrSum += s.prVal;
        if(s.latestVal) totalLatest += s.latestVal;
      });
      peakStr = totalPrSum > 0 ? (totalPrSum.toLocaleString() + ' (합계)') : '-';
      latestStr = totalLatest > 0 ? (totalLatest.toLocaleString() + ' (합계)') : '-';
      deltaStr = seriesArray.map(function(s){ return s.entity + ' ' + (s.growthRate > 0 ? '+' : '') + s.growthRate + '%'; }).slice(0, 2).join(' | ');
      velocityStr = seriesArray.length + '개 지표 추적 중';
    }

    // 차트 상단 헤더 (분석 대상 요약 + 기간/스케일 알약)
    var activeEntLabel = (mode === 'all' ? '전체 ' + ontology.length + '개 종목' : activeEntityKeys.join(', '));
    var chartTitleText = '';
    if(curLens === 'trend'){
      chartTitleText = activeEntLabel + ' 성장 곡선';
    } else if(curLens === 'ratio'){
      chartTitleText = selRatioNum + ' / ' + selRatioDen + ' 상관 효율비';
    } else if(curLens === 'radar'){
      chartTitleText = '종목별 활동 균형도 다각도 레이더';
    } else if(curLens === 'cadence'){
      chartTitleText = '요일별 실천 루틴 및 활동 밀도';
    }

    var chartTitleBar = 
      '<div class="u-chart-title-bar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<div style="font-weight:800;font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:5px;">' +
          '<span>📊</span><span>' + chartTitleText + '</span>' +
          '<span style="font-size:.7rem;font-weight:600;color:var(--ink-soft);font-family:monospace;">(' + (period === 'all' ? '전체' : period.toUpperCase()) + ')</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          periodHtml +
          (curLens === 'trend' ? scaleToggleHtml : '') +
          '<button type="button" class="btn btn-ghost btn-xs" id="uBtnGraphFullscreen" title="전체화면(가로) 보기" style="font-size:.75rem;padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:var(--card2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-weight:700;color:var(--ink);">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' +
            '</svg>' +
            '<span>전체화면</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    var kpiHtml = 
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(78px, 1fr));gap:6px;margin-top:10px;">' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#f59e0b;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>🏆</span><span>' + (curLens === 'ratio' ? 'AVG RATIO' : (curLens === 'cadence' ? 'PEAK DAY' : 'PEAK')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.78rem, 2.2vw, 0.9375rem);font-weight:900;color:var(--primary, #2563eb);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + peakStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#0284c7;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>⚡</span><span>' + (curLens === 'ratio' ? 'LATEST RATIO' : (curLens === 'cadence' ? 'SESSIONS' : 'LATEST')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.78rem, 2.2vw, 0.9375rem);font-weight:900;color:var(--ink);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + latestStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#10b981;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>📈</span><span>' + (curLens === 'ratio' ? 'NET SPREAD' : (curLens === 'cadence' ? 'PATTERN' : 'NET DELTA')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.75rem, 2vw, 0.875rem);font-weight:900;color:#10b981;margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + deltaStr + '</div>' +
        '</div>' +
        '<div class="card" style="padding:8px 6px;margin:0;border-radius:10px;background:var(--card);border:1px solid var(--border);text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
          '<div style="font-size:.65rem;font-weight:800;color:#8b5cf6;font-family:monospace;display:flex;align-items:center;justify-content:center;gap:3px;">' +
            '<span>🚀</span><span>' + (curLens === 'ratio' ? 'EFFICIENCY' : (curLens === 'cadence' ? 'CADENCE' : 'VELOCITY')) + '</span>' +
          '</div>' +
          '<div style="font-size:clamp(0.75rem, 2vw, 0.875rem);font-weight:900;color:var(--ink);margin-top:3px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + velocityStr + '</div>' +
        '</div>' +
      '</div>';

    // 6. 자율 통계 진단 리포트 (Visual Executive Briefing Card)
    var diagReportVisual = generateStatisticalDiagnosticReport(seriesMap, cadenceData, (curLens === 'ratio' ? ratioData : null), { asHtml: true });
    var aiReportHtml = 
      '<div class="card u-ai-briefing-card" style="margin-top:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(37,99,235,0.05),rgba(139,92,246,0.06));border:1px solid rgba(139,92,246,0.22);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">' +
          '<div style="font-weight:800;font-size:.8125rem;color:var(--brand);display:flex;align-items:center;gap:6px;">' +
            '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;"></span>' +
            '<span>✨ Gemini 3.1 Flash Lite 자율 다차원 통계 진단 브리핑</span>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:.78125rem;color:var(--ink);line-height:1.6;">' +
          diagReportVisual +
        '</div>' +
      '</div>';

    // 전체 바디 조립 (3단 레이아웃 완비)
    var bodyHtml = 
      '<div id="uCockpitBody" style="display:' + (isExpanded ? 'block' : 'none') + ';padding-top:10px;">' +
        quickGuideHtml +
        lensHtml +
        lensExpBannerHtml +
        chipsTitleHtml +
        chipsHtml +
        (curLens === 'trend' ? dimHtml : '') +
        chartTitleBar +
        '<div id="uChartContainerWrapper" style="position:relative;background:var(--card2);padding:10px 6px;border-radius:10px;border:1px solid var(--border);">' +
          mainChartContentHtml +
        '</div>' +
        kpiHtml +
        aiReportHtml +
      '</div>';

    container.innerHTML = 
      '<div class="card" id="uCockpitMainCard" style="padding:10px 12px;border-radius:14px;background:var(--card);border:1px solid var(--border);margin-bottom:12px;">' +
        headerHtml +
        bodyHtml +
      '</div>';

    // 6. 인터랙션 이벤트 바인딩
    // 아코디언 토글
    var hdrEl = container.querySelector('.u-cockpit-header');
    var bdyEl = container.querySelector('#uCockpitBody');
    var togIco = container.querySelector('#uAccordionToggleIcon');

    if(hdrEl && bdyEl){
      hdrEl.onclick = function(){
        var nowExp = (bdyEl.style.display !== 'none');
        var nextExp = !nowExp;
        bdyEl.style.display = nextExp ? 'block' : 'none';
        if(togIco) togIco.textContent = nextExp ? '▲' : '▼';
        try {
          if(typeof localStorage !== 'undefined'){
            localStorage.setItem('ourgoal_uStats_expanded', nextExp ? 'true' : 'false');
          }
        } catch(e){}

        if(nextExp){
          requestAnimationFrame(function(){
            var w = container.getBoundingClientRect().width;
            if(w > 100){
              renderUniversalStatsDashboard(container, allRecs, state, callbacks);
            }
          });
        }
      };
      if(togIco){
        togIco.onclick = function(e){
          e.stopPropagation();
          hdrEl.click();
        };
      }
    }

    // 데이터 관리 모달 통합 메뉴 버튼
    var mgmtMenuBtn = container.querySelector('#uHdrMgmtMenuBtn');
    if(mgmtMenuBtn){
      mgmtMenuBtn.onclick = function(e){
        e.stopPropagation();
        var curRecs = (state && state.profile && state.profile.records) || allRecs;
        openDataManagementModal({
          allRecs: curRecs,
          state: state,
          callbacks: callbacks,
          onDone: function(){
            var nextRecs = (state && state.profile && state.profile.records) || allRecs;
            renderUniversalStatsDashboard(container, nextRecs, state, callbacks);
          }
        });
      };
    }

    // 하위 호환성 앵커 버튼 (외부 참조 및 기존 스크립트 안전망)
    var gridBtn = container.querySelector('#uHdrGridBtn');
    if(gridBtn){
      gridBtn.onclick = function(e){
        e.stopPropagation();
        openUniversalDataGrid({ allRecs: allRecs, state: state, callbacks: callbacks });
      };
    }

    var impBtn = container.querySelector('#uHdrImportBtn');
    if(impBtn){
      impBtn.onclick = function(e){
        e.stopPropagation();
        openUniversalImportModal({
          openModal: callbacks.openModal || window.openModal,
          closeModal: callbacks.closeModal || window.closeModal,
          toast: callbacks.toast || window.toast,
          state: state,
          saveProfile: callbacks.saveProfile,
          onDone: function(){ renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || [], state, callbacks); }
        });
      };
    }

    var expCsvBtn = container.querySelector('#uHdrExportCsvBtn');
    if(expCsvBtn){
      expCsvBtn.onclick = function(e){
        e.stopPropagation();
        exportCleanCsv(allRecs, 'ourgoal_analytics_export.csv');
      };
    }

    var snapBtn = container.querySelector('#uHdrSnapBtn');
    if(snapBtn){
      snapBtn.onclick = function(e){
        e.stopPropagation();
        var mainCard = container.querySelector('#uCockpitMainCard');
        if(mainCard) captureChartSnapshot(mainCard, 'ourgoal_cockpit');
      };
    }

    // 4대 렌즈 전환 버튼
    container.querySelectorAll('.u-lens-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univLens = btn.dataset.lens;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 상관 효율비 분자/분모 지표 변경 리스너
    var numSel = container.querySelector('#uRatioNumSelect');
    if(numSel){
      numSel.onchange = function(){
        state.univRatioNum = numSel.value;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    }
    var denSel = container.querySelector('#uRatioDenSelect');
    if(denSel){
      denSel.onchange = function(){
        state.univRatioDen = denSel.value;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    }

    // 모드 버튼
    container.querySelectorAll('.u-mode-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univMode = btn.dataset.mode;
        if(state.univMode === 'all'){
          state.univSelectedEntities = ontology.map(function(o){ return o.name; });
        } else if(state.univMode === 'single' && state.univSelectedEntities.length > 1){
          state.univSelectedEntities = [state.univSelectedEntities[0]];
        }
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 7-Tier 기간 버튼
    container.querySelectorAll('.u-period-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univPeriod = btn.dataset.period;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 스케일 모드 버튼
    container.querySelectorAll('.u-scale-btn').forEach(function(btn){
      btn.onclick = function(){
        state.univScaleMode = btn.dataset.scale;
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 3-1. 측정 차원(Dimension) 다중 선택 토글 버튼 (매출액, 계약건수, 커밋수, 1RM 등)
    container.querySelectorAll('.u-dim-btn').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var targetDim = btn.dataset.dim;
        state.univDimension = targetDim;
        var curSelected = (state.univSelectedDimensions || []).slice();
        var idx = curSelected.indexOf(targetDim);
        if(idx !== -1){
          if(curSelected.length > 1){
            curSelected.splice(idx, 1);
            state.univDimension = curSelected[0] || targetDim;
          }
        } else {
          curSelected.push(targetDim);
        }
        state.univSelectedDimensions = curSelected;
        renderUniversalStatsDashboard(container, (state && state.profile && state.profile.records) || allRecs, state, callbacks);
      };
    });

    // 온톨로지 탐색기 오픈
    var taxBtn = container.querySelector('#uTaxonomyOpenBtn');
    if(taxBtn){
      taxBtn.onclick = function(){
        openTaxonomyManagerModal({
          allRecs: allRecs,
          state: state,
          callbacks: {
            openModal: callbacks.openModal,
            closeModal: callbacks.closeModal,
            saveProfile: callbacks.saveProfile,
            toast: callbacks.toast,
            onDone: function(){ renderUniversalStatsDashboard(container, allRecs, state, callbacks); }
          }
        });
      };
    }

    // 엔티티 칩 클릭
    container.querySelectorAll('.u-entity-chip').forEach(function(btn){
      btn.onclick = function(){
        var entName = btn.dataset.name;
        if(state.univMode === 'single' || mode === 'single'){
          state.univSelectedEntities = [entName];
        } else if(state.univMode === 'multi' || mode === 'multi'){
          var curList = state.univSelectedEntities || [];
          if(curList.includes(entName)){
            if(curList.length > 1) state.univSelectedEntities = curList.filter(function(n){ return n !== entName; });
          } else {
            state.univSelectedEntities = curList.concat([entName]);
          }
        }
        renderUniversalStatsDashboard(container, allRecs, state, callbacks);
      };
    });

    // 십자선 & 플로팅 인스펙터 인터랙션 (Crosshair Tracking)
    var captureRect = container.querySelector('#uCrosshairCapture');
    var crossV = container.querySelector('#uCrosshairV');
    var crossH = container.querySelector('#uCrosshairH');
    var crossDot = container.querySelector('#uCrosshairDot');
    var tipBox = container.querySelector('#uFloatingInspector');
    var tipDate = container.querySelector('#uTipDate');
    var tipVal = container.querySelector('#uTipVal');
    var tipDelta = container.querySelector('#uTipDelta');
    var tipMemo = container.querySelector('#uTipMemo');
    var tipEditBtn = container.querySelector('#uTipEditBtn');
    var curHoverRecId = null;

    if(captureRect && chartObj.points.length > 0){
      function handleMove(e){
        var rect = captureRect.getBoundingClientRect();
        var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        var clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        if(!clientX || !clientY) return;

        var svgEl = container.querySelector('#uInteractiveSvgChart');
        if(!svgEl) return;
        var svgRect = svgEl.getBoundingClientRect();
        var svgX = ((clientX - svgRect.left) / svgRect.width) * chartObj.width;
        var svgY = ((clientY - svgRect.top) / svgRect.height) * chartObj.height;

        // 가장 가까운 데이터 포인트 탐색 (반경 35px)
        var nearest = null;
        var minDist = 40;

        chartObj.points.forEach(function(pt){
          var dist = Math.hypot(pt.x - svgX, pt.y - svgY);
          if(dist < minDist){
            minDist = dist;
            nearest = pt;
          }
        });

        if(nearest){
          crossV.setAttribute('x1', nearest.x);
          crossV.setAttribute('x2', nearest.x);
          crossV.style.display = 'block';

          crossH.setAttribute('y1', nearest.y);
          crossH.setAttribute('y2', nearest.y);
          crossH.style.display = 'block';

          crossDot.setAttribute('cx', nearest.x);
          crossDot.setAttribute('cy', nearest.y);
          crossDot.setAttribute('fill', nearest.color);
          crossDot.style.display = 'block';

          if(tipBox){
            tipDate.textContent = nearest.date + ' · ' + nearest.seriesName;
            tipVal.textContent = nearest.val.toLocaleString() + ' ' + nearest.unit + (nearest.isPr ? ' (★ PR)' : '');
            if(nearest.delta !== null){
              tipDelta.textContent = (nearest.delta >= 0 ? '+' : '') + nearest.delta + ' ' + nearest.unit + ' (' + (nearest.deltaPct >= 0 ? '+' : '') + nearest.deltaPct + '%)';
              tipDelta.style.color = (nearest.delta >= 0 ? '#34d399' : '#f87171');
            } else {
              tipDelta.textContent = '첫 관측치';
              tipDelta.style.color = '#94a3b8';
            }
            tipMemo.textContent = nearest.memo || '세션 메모 없음';
            curHoverRecId = nearest.recId;

            var tipLeft = Math.min(rect.width - 160, Math.max(10, ((nearest.x / chartObj.width) * svgRect.width) - 50));
            var tipTop = Math.max(10, ((nearest.y / chartObj.height) * svgRect.height) - 75);
            tipBox.style.left = tipLeft + 'px';
            tipBox.style.top = tipTop + 'px';
            tipBox.style.display = 'block';
          }
        }
      }

      function handleLeave(){
        if(crossV) crossV.style.display = 'none';
        if(crossH) crossH.style.display = 'none';
        if(crossDot) crossDot.style.display = 'none';
        // 툴팁은 마우스 벗어나고 1.5초 후 닫기
        setTimeout(function(){
          if(tipBox && !tipBox.matches(':hover')) tipBox.style.display = 'none';
        }, 1500);
      }

      captureRect.addEventListener('mousemove', handleMove);
      captureRect.addEventListener('touchmove', handleMove, { passive: true });
      captureRect.addEventListener('mouseleave', handleLeave);
    }

    if(tipEditBtn){
      tipEditBtn.onclick = function(){
        if(curHoverRecId){
          var targetRec = allRecs.find(function(r){ return r.id === curHoverRecId; });
          if(targetRec){
            openRowEditModal({
              row: {
                id: targetRec.id,
                date: (targetRec.startAt || targetRec.createdAt || '').slice(0, 10),
                entity: targetRec.subTheme || targetRec.item || targetRec.exercise || '일반',
                primaryVal: targetRec.metrics ? (targetRec.metrics.primary || targetRec.metrics['1rm'] || targetRec.metrics.pages || 0) : 0,
                primaryUnit: targetRec.metrics ? (targetRec.metrics.primaryUnit || '') : '',
                secondaryVal: targetRec.metrics ? (targetRec.metrics.secondary || targetRec.metrics.volume || targetRec.metrics.duration || 0) : 0,
                secondaryUnit: targetRec.metrics ? (targetRec.metrics.secondaryUnit || '') : '',
                memo: targetRec.text || ''
              },
              callbacks: callbacks,
              state: state,
              onSaved: function(){
                renderUniversalStatsDashboard(container, state.profile.records, state, callbacks);
              }
            });
          }
        }
      };
    }
    // 전체화면 (가로 모드) 버튼 바인딩 (#TASK-ES-172)
    var fsBtn = container.querySelector('#uBtnGraphFullscreen');
    if(fsBtn){
      fsBtn.onclick = function(e){
        e.stopPropagation();
        openStatsFullscreenModal(seriesMap, allRecs, state, callbacks);
      };
    }
  }

  /* [#TASK-ES-405] openStatsFullscreenModal → js/stats-fullscreen.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] openUniversalImportModal → js/stats-import.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */


  /* ================= [#TASK-ES-163] 도메인별 측정지표 차등 분석 모델 ================= */
  var METRIC_DIFFERENTIATED_MODELS = createMetricDifferentiatedModels();
  /* [#TASK-ES-405] createMetricDifferentiatedModels → js/stats-catalog.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  METRIC_DIFFERENTIATED_MODELS.strength = METRIC_DIFFERENTIATED_MODELS.big3;
  METRIC_DIFFERENTIATED_MODELS.health = METRIC_DIFFERENTIATED_MODELS.big3;

  /* [#TASK-ES-405] computeDifferentiatedAnalysis · renderDifferentiatedReportCard · openDifferentiatedMetricConfigModal → js/stats-differentiated.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  // 모듈 외부 노출
  var api = {
    METRIC_CONFIGS: METRIC_CONFIGS,
    METRIC_DIFFERENTIATED_MODELS: METRIC_DIFFERENTIATED_MODELS,
    computeDifferentiatedAnalysis: computeDifferentiatedAnalysis,
    renderDifferentiatedReportCard: renderDifferentiatedReportCard,
    openDifferentiatedMetricConfigModal: openDifferentiatedMetricConfigModal,
    DOMAINS: DOMAINS,
    getChosung: getChosung,
    matchQuery: matchQuery,
    ensureMetricConfig: ensureMetricConfig,
    extractMetricsFromRecord: extractMetricsFromRecord,
    discoverActiveMetrics: discoverActiveMetrics,
    aggregateMetricTimeSeries: aggregateMetricTimeSeries,
    renderUniversalSvgChart: renderUniversalSvgChart,
    generateDomainSample: generateDomainSample,
    generate52WeekPowerliftingSample: generate52WeekPowerliftingSample,
    parseCsvToUniversalRecords: parseCsvToUniversalRecords,
    buildUniversalOntology: buildUniversalOntology,
    aggregateMultiSeries: aggregateMultiSeries,
    renderMultiSeriesSvg: renderMultiSeriesSvg,
    renderUniversalStatsDashboard: renderUniversalStatsDashboard,
    openUniversalImportModal: openUniversalImportModal,
    openTaxonomyManagerModal: openTaxonomyManagerModal,
    openUniversalDataGrid: openUniversalDataGrid,
    openGuideModal: openGuideModal,
    exportCleanCsv: exportCleanCsv,
    captureChartSnapshot: captureChartSnapshot,
    normalizeHistoricalDate: normalizeHistoricalDate,
    generate1920sOlympicStrengthSample: generate1920sOlympicStrengthSample,
    computeCrossRatioSeries: computeCrossRatioSeries,
    renderCrossRatioSvg: renderCrossRatioSvg,
    renderRadarSvg: renderRadarSvg,
    computeCadenceData: computeCadenceData,
    renderCadenceSvg: renderCadenceSvg,
    generateStatisticalDiagnosticReport: generateStatisticalDiagnosticReport,
    openDataManagementModal: openDataManagementModal,
    openStatsFullscreenModal: openStatsFullscreenModal,
    SAMPLE_THEMES: SAMPLE_THEMES
  };

  // [.diff-cfg-open-btn] 지표별 차등 분석 기준 설정 클릭 이벤트 전역 위임
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.diff-cfg-open-btn');
      if (btn) {
        openDifferentiatedMetricConfigModal({
          openModal: typeof window !== 'undefined' ? window.openModal : null,
          closeModal: typeof window !== 'undefined' ? window.closeModal : null
        });
      }
    });
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = api;
  }
  root.OurgoalUniversalStats = api;

})(typeof window !== 'undefined' ? window : global);
