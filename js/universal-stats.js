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
     [#TASK-ES-405] 3차: js/stats-samples.js · js/stats-sample-fitness.js · js/stats-sample-growth.js · js/stats-ontology.js · js/stats-export.js · js/stats-fullscreen.js · js/stats-differentiated.js 도 같은 이음매로 가져온다(카탈로그 상수는 원본에 두고 getter 로 노출). */
  var _statsKit = root.OurgoalUniversalStatsKit;
  if(!_statsKit && typeof require === 'function'){ require('./stats-taxonomy.js'); require('./stats-data-grid.js'); require('./stats-lenses.js'); require('./stats-metrics.js'); require('./stats-charts.js'); require('./stats-import.js'); require('./stats-data-menu.js'); require('./stats-samples.js'); require('./stats-sample-fitness.js'); require('./stats-sample-growth.js'); require('./stats-ontology.js'); require('./stats-export.js'); require('./stats-fullscreen.js'); require('./stats-differentiated.js'); _statsKit = root.OurgoalUniversalStatsKit; }
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
  var METRIC_CONFIGS = {
    // 1) 체중 / 다이어트
    weight: {
      category: 'weight',
      title: '체중 / 다이어트',
      icon: '⚖️',
      label: '체중',
      unit: 'kg',
      agg: 'latest',
      chartType: 'line',
      color: '#ec4899',
      kpi1: '⚖️ 현재 체중',
      kpi2: '📉 총 감량폭',
      kpi3: '🎯 체중 관리 추세',
      kpi4: '📊 기간 변동률'
    },
    // 2) 독서 / 도서
    reading: {
      category: 'reading',
      title: '독서 / 도서',
      icon: '📖',
      label: '독서량',
      unit: '쪽',
      agg: 'sum',
      chartType: 'bar',
      color: '#8b5cf6',
      kpi1: '🏆 총 읽은 쪽수',
      kpi2: '📚 완독 도서수',
      kpi3: '📖 일일 평균 독서',
      kpi4: '📈 주간 성장률'
    },
    // 3) 수면 / 웰니스
    sleep: {
      category: 'sleep',
      title: '수면 / 웰니스',
      icon: '💤',
      label: '수면시간',
      unit: '시간',
      agg: 'avg',
      chartType: 'line',
      color: '#6366f1',
      kpi1: '🌙 일일 평균 수면',
      kpi2: '⭐ 최고 수면 기록',
      kpi3: '💤 수면 규칙성',
      kpi4: '📉 수면 부채 지수'
    },
    // 4) 재테크 / 자산
    finance: {
      category: 'finance',
      title: '재테크 / 자산',
      icon: '💰',
      label: '저축/투자액',
      unit: '만원',
      agg: 'sum',
      chartType: 'area',
      color: '#10b981',
      kpi1: '🏆 총 누적 저축',
      kpi2: '💎 최고 단일 저축',
      kpi3: '📈 월평균 저축액',
      kpi4: '🎯 자산 목표 진척'
    },
    // 5) 러닝
    running: {
      category: 'running',
      title: '러닝 / 조깅',
      icon: '🏃',
      label: '러닝 거리',
      unit: 'km',
      agg: 'sum',
      chartType: 'area',
      color: '#0ea5e9',
      kpi1: '🏆 총 누적 거리',
      kpi2: '⚡ 최고 페이스',
      kpi3: '🏃 최장 1회 거리',
      kpi4: '📈 전월 대비 성장률'
    },
    // 6) 3대 운동
    big3: {
      category: 'big3',
      title: '3대 운동',
      icon: '🏋️',
      label: '3대 총합 중량',
      unit: 'kg',
      agg: 'max',
      chartType: 'line',
      color: '#f59e0b',
      kpi1: '🏆 3대 총합 (Total)',
      kpi2: '🏋️ 벤치프레스 PR',
      kpi3: '🦵 스쿼트 PR',
      kpi4: '🦍 데드리프트 PR'
    },
    // 7) 공부 / 수험
    study: {
      category: 'study',
      title: '공부 / 몰입',
      icon: '📚',
      label: '순공 시간',
      unit: '분',
      agg: 'sum',
      chartType: 'bar',
      color: '#a855f7',
      kpi1: '🏆 총 순공 시간',
      kpi2: '🎯 총 푼 문제수',
      kpi3: '📖 일일 평균 몰입',
      kpi4: '📈 주간 성장률'
    },
    // 8) 영업 / 비즈니스
    sales: {
      category: 'sales',
      title: '영업 / 성과',
      icon: '💼',
      label: '실적 금액',
      unit: '만원',
      agg: 'sum',
      chartType: 'area',
      color: '#14b8a6',
      kpi1: '🏆 총 누적 실적',
      kpi2: '🤝 총 계약 건수',
      kpi3: '💰 최고 단일 실적',
      kpi4: '📈 목표 달성률'
    },
    // 9) 혈압
    blood_pressure: {
      category: 'blood_pressure',
      title: '혈압 관리',
      icon: '❤️',
      label: '수축기 혈압',
      unit: 'mmHg',
      agg: 'avg',
      chartType: 'line',
      color: '#ef4444',
      kpi1: '❤️ 최근 수축기 혈압',
      kpi2: '💓 최근 이완기 혈압',
      kpi3: '📊 평균 혈압',
      kpi4: '📈 혈압 안정도'
    },
    // 10) 카페인
    caffeine: {
      category: 'caffeine',
      title: '카페인 섭취',
      icon: '☕',
      label: '카페인',
      unit: 'mg',
      agg: 'sum',
      chartType: 'bar',
      color: '#78350f',
      kpi1: '☕ 총 섭취 카페인',
      kpi2: '⚡ 최고 섭취일',
      kpi3: '📊 일평균 섭취량',
      kpi4: '📉 적정 권장선'
    },
    // 11) 골프
    golf: {
      category: 'golf',
      title: '골프 스코어',
      icon: '⛳',
      label: '타수',
      unit: '타',
      agg: 'latest',
      chartType: 'line',
      color: '#059669',
      kpi1: '⛳ 최근 스코어',
      kpi2: '🏆 라베 (최저타)',
      kpi3: '📊 평균 스코어',
      kpi4: '📈 핸디캡 추세'
    },
    // 12) 코딩
    coding: {
      category: 'coding',
      title: '코딩 / 커밋',
      icon: '💻',
      label: '커밋 수',
      unit: '커밋',
      agg: 'sum',
      chartType: 'bar',
      color: '#2563eb',
      kpi1: '💻 총 누적 커밋',
      kpi2: '🔥 1일 최다 커밋',
      kpi3: '📊 일평균 활동량',
      kpi4: '📈 히트맵 연속성'
    },
    // 13) 수분 / 물
    water: {
      category: 'water',
      title: '수분 섭취',
      icon: '💧',
      label: '수분량',
      unit: 'L',
      agg: 'sum',
      chartType: 'bar',
      color: '#06b6d4',
      kpi1: '💧 총 수분 섭취량',
      kpi2: '⭐ 최고 달성일',
      kpi3: '📊 일평균 수분량',
      kpi4: '🎯 목표 달성률'
    },
    // 14) 체지방률
    body_fat: {
      category: 'body_fat',
      title: '체지방률',
      icon: '📉',
      label: '체지방률',
      unit: '%',
      agg: 'latest',
      chartType: 'line',
      color: '#f97316',
      kpi1: '📉 현재 체지방률',
      kpi2: '🏆 최저 체지방률',
      kpi3: '📊 평균 체지방률',
      kpi4: '📈 체조성 변화'
    },
    // 15) 일반 실천시간 (Global Fallback)
    general: {
      category: 'general',
      title: '실천 시간',
      icon: '🔥',
      label: '실천 시간',
      unit: '분',
      agg: 'sum',
      chartType: 'area',
      color: '#3b82f6',
      kpi1: '🏆 총 실천 시간',
      kpi2: '✍️ 총 기록 건수',
      kpi3: '🔥 주간 평균 몰입',
      kpi4: '📈 꾸준함 지수'
    }
  };

  /* [#TASK-ES-401] ensureMetricConfig · extractMetricsFromRecord · discoverActiveMetrics · aggregateMetricTimeSeries → js/stats-metrics.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] renderUniversalSvgChart → js/stats-charts.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 4-9. 추천 샘플 테마별 35종 카탈로그 (#TASK-ES-093) ================= */
  var SAMPLE_THEMES = [
    {
      id: 'workout',
      label: '🏃 운동·피트니스',
      shortLabel: '운동 (7)',
      items: [
        { key: 'hyrox', icon: '🏃', title: '하이록스 (HYROX)', tag: '대세', desc: '8개 스테이션 랩타임 & 페이스 52주', count: 52 },
        { key: 'big3_52w', icon: '🏋️', title: '파워리프팅 (3대 500kg)', tag: '대표', desc: '스쿼트·벤치·데드 주기화 156세션', count: 156 },
        { key: 'yoga', icon: '🧘', title: '요가 & 필라테스', tag: '인기', desc: '코어 정렬 및 체류시간 추적 52주', count: 52 },
        { key: 'running', icon: '🏃', title: '마라톤 & 러닝', tag: '정석', desc: '5km→하프 마라톤 페이스 52주', count: 120 },
        { key: 'crossfit', icon: '⚡', title: '크로스핏 WOD', tag: '고강도', desc: 'AMRAP 라운드 & 타임캡 추이 52주', count: 52 },
        { key: 'swimming', icon: '🏊', title: '수영 랩타임', tag: '유산소', desc: '자유형 50m 랩타임 & 2.5km 52주', count: 52 },
        { key: 'climbing', icon: '🧗', title: '볼더링 클라이밍', tag: '도전', desc: 'V-Grade 난이도 & 완등수 52주', count: 52 }
      ]
    },
    {
      id: 'career',
      label: '💼 업무·커리어',
      shortLabel: '업무 (7)',
      items: [
        { key: 'sales', icon: '💼', title: 'B2B 솔루션 영업', tag: '대표', desc: '주간 수주액 & 계약 체결 52주', count: 52 },
        { key: 'coding', icon: '💻', title: '풀스택 오픈소스 개발', tag: 'IT', desc: 'GitHub 일일 커밋 & PR 머지 52주', count: 52 },
        { key: 'marketing', icon: '📈', title: '퍼포먼스 마케팅', tag: '그로스', desc: '광고 ROAS & 리드 전환율 52주', count: 52 },
        { key: 'design', icon: '🎨', title: 'UI/UX 프로덕트 디자인', tag: '디자인', desc: '화면 설계 & 사용성 점수 52주', count: 52 },
        { key: 'techblog', icon: '✍️', title: '테크 블로그 연재', tag: '브랜딩', desc: '월간 순방문자 & 기술 아티클 52주', count: 52 },
        { key: 'support', icon: '🎧', title: 'CS 고객 경험 케어', tag: '만족도', desc: '티켓 처리 & CSAT 98% 달성 52주', count: 52 },
        { key: 'startup', icon: '🚀', title: '스타트업 지표 추적', tag: '스케일', desc: '주간 WAU 활성도 & 리텐션 52주', count: 52 }
      ]
    },
    {
      id: 'learning',
      label: '📖 공부·학습',
      shortLabel: '공부 (7)',
      items: [
        { key: 'study', icon: '📚', title: '공무원·고시 순공', tag: '대표', desc: '순공시간 & 일일 기출 52주', count: 104 },
        { key: 'toeic', icon: '🎯', title: '토익·어학 시험', tag: '어학', desc: 'LC/RC 모의고사 940점 달성 52주', count: 52 },
        { key: 'codingtest', icon: '💻', title: '알고리즘 코테 준비', tag: '개발', desc: '백준/리트코드 골드 티어 52주', count: 52 },
        { key: 'reading', icon: '📖', title: '주간 독서 습관', tag: '정석', desc: '주 100쪽 누적 5,200쪽 완독 52주', count: 78 },
        { key: 'cert', icon: '📜', title: '기사·전문 자격증', tag: '취득', desc: '오답노트 & 모의고사 86점 52주', count: 52 },
        { key: 'music', icon: '🎹', title: '피아노 악기 연습', tag: '취미', desc: '주간 연습시간 & 12곡 마스터 52주', count: 52 },
        { key: 'thesis', icon: '🎓', title: '대학원 학술 연구', tag: '연구', desc: '논문 작성 & 실험 데이터 분석 52주', count: 52 }
      ]
    },
    {
      id: 'finance',
      label: '💰 재테크·자산',
      shortLabel: '재테크 (7)',
      items: [
        { key: 'finance', icon: '💰', title: '월간 저축 & 적금', tag: '대표', desc: '월 50~150만 누적 1,200만원 52주', count: 52 },
        { key: 'dividend', icon: '💵', title: '미국 배당주 투자', tag: '배당', desc: '월 배당금 수령 & 복리 재투자 52주', count: 52 },
        { key: 'crypto', icon: '🪙', title: '비트코인 적립식 DCA', tag: '크립토', desc: '주간 분할 매수 & 누적 평단 52주', count: 52 },
        { key: 'budget', icon: '📉', title: '가계부 생활비 절감', tag: '절약', desc: '식비·고정비 65만원 절감 52주', count: 52 },
        { key: 'realestate', icon: '🏢', title: '부동산 청약 가점', tag: '청약', desc: '청약 납입 100회 & 가점 관리 52주', count: 52 },
        { key: 'sidehustle', icon: '💡', title: '사이드 프로젝트 수입', tag: '부수입', desc: '디지털 제품 부수입 240만원 52주', count: 52 },
        { key: 'irp', icon: '🛡️', title: '연금저축 & IRP', tag: '절세', desc: '세액공제 한도 적립 900만원 52주', count: 52 }
      ]
    },
    {
      id: 'wellness',
      label: '🧘 웰니스·루틴',
      shortLabel: '웰니스 (7)',
      items: [
        { key: 'sleep', icon: '😴', title: '수면 품질 회복', tag: '회복', desc: '6.1h→7.8h 숙면 & 피로도 케어 52주', count: 52 },
        { key: 'miracle', icon: '🌅', title: '미라클 모닝 루틴', tag: '아침', desc: '05:45 기상 & 주 6일 루틴 52주', count: 52 },
        { key: 'water', icon: '💧', title: '일일 수분 섭취 2L', tag: '건강', desc: '매일 물 2.3L 수분 충전 52주', count: 52 },
        { key: 'meditation', icon: '🧘', title: '마음챙김 명상', tag: '멘탈', desc: '매일 15분 호흡 & 스트레스 케어 52주', count: 52 },
        { key: 'screentime', icon: '📵', title: '디지털 디톡스', tag: '디톡스', desc: '스마트폰 사용 6.5h→2.2h 감소 52주', count: 52 },
        { key: 'walking', icon: '👟', title: '만보 걷기 산책', tag: '활동량', desc: '일일 10,000보 달성률 추적 52주', count: 52 },
        { key: 'gratitude', icon: '📝', title: '3줄 감사일기', tag: '긍정', desc: '매일 감사 노트 & 긍정 점수 52주', count: 52 }
      ]
    }
  ];

  var THEME_METRIC_SPECS = {
    hyrox: { theme: 'workout', sub: '하이록스', pName: '완주시간', pUnit: '분', sName: '페이스', sUnit: '초', pStart: 88, pDelta: -0.38, sStart: 340, sDelta: -1.3, tmpl: '[하이록스] 8개 스테이션 완주 {p}분 (1km 러닝 평균 {s}초)' },
    yoga: { theme: 'workout', sub: '요가', pName: '집중도', pUnit: '점', sName: '수련시간', sUnit: '분', pStart: 68, pDelta: 0.52, sStart: 60, sDelta: 0, tmpl: '[요가] 하타 & 빈야사 수련 60분 (코어 집중도 {p}점)' },
    crossfit: { theme: 'workout', sub: '크로스핏', pName: '라운드', pUnit: 'Rnd', sName: '칼로리', sUnit: 'kcal', pStart: 8, pDelta: 0.19, sStart: 420, sDelta: 4.8, tmpl: '[크로스핏] WOD {p}라운드 완수 ({s}kcal 소모)' },
    swimming: { theme: 'workout', sub: '수영', pName: '총거리', pUnit: 'm', sName: '50m랩', sUnit: '초', pStart: 1000, pDelta: 28.5, sStart: 52, sDelta: -0.3, tmpl: '[수영] 인터벌 완영 {p}m (50m 최고랩 {s}초)' },
    climbing: { theme: 'workout', sub: '클라이밍', pName: '완등수', pUnit: '개', sName: 'V등급', sUnit: 'V', pStart: 10, pDelta: 0.31, sStart: 2, sDelta: 0.08, tmpl: '[클라이밍] 볼더링 V{s} 완등 (세션 총 {p}문제 완등)' },
    marketing: { theme: 'career', sub: '마케팅', pName: 'ROAS', pUnit: '%', sName: '전환수', sUnit: '건', pStart: 280, pDelta: 5.1, sStart: 45, sDelta: 2.8, tmpl: '[마케팅] 캠페인 ROAS {p}% 달성 (신규 전환 {s}건)' },
    design: { theme: 'career', sub: '디자인', pName: '설계화면', pUnit: '개', sName: '사용성점수', sUnit: '점', pStart: 12, pDelta: 0.58, sStart: 72, sDelta: 0.42, tmpl: '[디자인] UI/UX 컴포넌트 {p}개 설계 (사용성 {s}점)' },
    techblog: { theme: 'career', sub: '테크블로그', pName: '주간PV', pUnit: '회', sName: '아티클', sUnit: '편', pStart: 850, pDelta: 220, sStart: 1, sDelta: 0.04, tmpl: '[블로그] 기술 아티클 연재 주간 PV {p}회 ({s}편 발행)' },
    support: { theme: 'career', sub: '고객지원', pName: '티켓해결', pUnit: '건', sName: 'CSAT', sUnit: '%', pStart: 65, pDelta: 2.8, sStart: 89, sDelta: 0.18, tmpl: '[CS] 인바운드 티켓 {p}건 처리 (만족도 {s}%)' },
    startup: { theme: 'career', sub: '스타트업', pName: '주간WAU', pUnit: '명', sName: '리텐션', sUnit: '%', pStart: 1400, pDelta: 430, sStart: 30, sDelta: 0.5, tmpl: '[그로스] 주간 활성 WAU {p}명 (7일 리텐션 {s}%)' },
    toeic: { theme: 'learning', sub: '토익', pName: '모의점수', pUnit: '점', sName: '순공시간', sUnit: 'h', pStart: 650, pDelta: 5.7, sStart: 14, sDelta: 0.2, tmpl: '[토익] 실전 모의고사 {p}점 달성 (주간 학습 {s}시간)' },
    codingtest: { theme: 'learning', sub: '코테', pName: '풀이수', pUnit: '문제', sName: '레이팅', sUnit: '점', pStart: 20, pDelta: 6.2, sStart: 1150, sDelta: 15, tmpl: '[알고리즘] 코테 누적 {p}문제 풀이 (레이팅 {s}점)' },
    cert: { theme: 'learning', sub: '자격증', pName: '모의점수', pUnit: '점', sName: '정답률', sUnit: '%', pStart: 50, pDelta: 0.72, sStart: 52, sDelta: 0.76, tmpl: '[자격증] 전문 기사 모의고사 {p}점 (정답률 {s}%)' },
    music: { theme: 'learning', sub: '악기연습', pName: '연습시간', pUnit: '분', sName: '완주곡', sUnit: '곡', pStart: 120, pDelta: 4.8, sStart: 1, sDelta: 0.21, tmpl: '[피아노] 주간 {p}분 연습 (마스터 곡수 {s}곡)' },
    thesis: { theme: 'learning', sub: '학술연구', pName: '집필페이지', pUnit: '쪽', sName: '분석논문', sUnit: '편', pStart: 3, pDelta: 0.95, sStart: 5, sDelta: 1.5, tmpl: '[대학원] 학술 연구 {p}쪽 집필 (참고 논문 {s}편 분석)' },
    dividend: { theme: 'finance', sub: '배당투자', pName: '월배당금', pUnit: '$', sName: '배당수익률', sUnit: '%', pStart: 40, pDelta: 8.5, sStart: 3.4, sDelta: 0.027, tmpl: '[배당주] 월 배당금 ${p} 수령 (포트폴리오 수익률 {s}%)' },
    crypto: { theme: 'finance', sub: '비트코인', pName: '적립BTC', pUnit: 'mBTC', sName: '수익률', sUnit: '%', pStart: 4, pDelta: 4.2, sStart: -8, sDelta: 1.45, tmpl: '[DCA] 비트코인 정기 적립 누적 {p}mBTC (수익률 {s}%)' },
    budget: { theme: 'finance', sub: '가계부', pName: '절감액', pUnit: '만원', sName: '달성률', sUnit: '%', pStart: 12, pDelta: 1.0, sStart: 74, sDelta: 0.42, tmpl: '[가계부] 생활비 {p}만원 절감 성공 (예산 준수율 {s}%)' },
    realestate: { theme: 'finance', sub: '부동산청약', pName: '청약가점', pUnit: '점', sName: '납입횟수', sUnit: '회', pStart: 30, pDelta: 0.65, sStart: 48, sDelta: 1.0, tmpl: '[청약] 청약통장 {s}회 납입 (인정 가점 {p}점)' },
    sidehustle: { theme: 'finance', sub: '사이드잡', pName: '부수입', pUnit: '만원', sName: '주문건수', sUnit: '건', pStart: 15, pDelta: 4.6, sStart: 3, sDelta: 0.88, tmpl: '[사이드프로젝트] 월 부수입 {p}만원 달성 ({s}건 주문)' },
    irp: { theme: 'finance', sub: '연금저축', pName: '납입원금', pUnit: '만원', sName: '절세환급', sUnit: '만원', pStart: 75, pDelta: 16.5, sStart: 12, sDelta: 2.65, tmpl: '[IRP] 연금저축 누적 {p}만원 납입 (예상 공제 {s}만원)' },
    miracle: { theme: 'wellness', sub: '미라클모닝', pName: '성공일수', pUnit: '일', sName: '기상시각', sUnit: '분', pStart: 2, pDelta: 0.08, sStart: 455, sDelta: -2.1, tmpl: '[미라클모닝] 주 {p}일 05시 기상 성공 (모닝 루틴 완수)' },
    water: { theme: 'wellness', sub: '수분섭취', pName: '음용량', pUnit: 'L', sName: '물잔수', sUnit: '잔', pStart: 1.2, pDelta: 0.022, sStart: 5, sDelta: 0.08, tmpl: '[수분] 하루 물 {p}L 섭취 ({s}잔 완료)' },
    meditation: { theme: 'wellness', sub: '명상', pName: '명상시간', pUnit: '분', sName: '평온지수', sUnit: '점', pStart: 10, pDelta: 0.3, sStart: 64, sDelta: 0.6, tmpl: '[마음챙김] 호흡 명상 {p}분 수행 (평온 지수 {s}점)' },
    screentime: { theme: 'wellness', sub: '스크린타임', pName: '사용시간', pUnit: 'h', sName: '집중시간', sUnit: '분', pStart: 6.2, pDelta: -0.078, sStart: 60, sDelta: 3.5, tmpl: '[디지털디톡스] 스마트폰 {p}시간 제한 (딥워크 {s}분)' },
    walking: { theme: 'wellness', sub: '만보걷기', pName: '일일걸음', pUnit: '보', sName: '거리', sUnit: 'km', pStart: 4800, pDelta: 135, sStart: 3.4, sDelta: 0.098, tmpl: '[만보] 오늘 하루 {p}보 산책 완료 (거리 {s}km)' },
    gratitude: { theme: 'wellness', sub: '감사일기', pName: '긍정점수', pUnit: '점', sName: '감사항목', sUnit: '개', pStart: 62, pDelta: 0.65, sStart: 3, sDelta: 0.04, tmpl: '[감사일기] 3줄 감사 작성 완료 (행복 긍정 점수 {p}점)' }
  };

  /* [#TASK-ES-405] generateDomainSample → js/stats-samples.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] normalizeHistoricalDate → js/stats-import.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 5-1. 52주 3대운동 주기화 156세션 정본 데이터 ================= */
  var RAW_52W_POWERLIFTING_DATA = ["2025-01-06,W01,Hypertrophy,스쿼트,5,100,8,100,8,105,8,105,7,100,8,4095,70,131,75,기본기 점검 및 웜업","2025-01-07,W01,Hypertrophy,벤치프레스,5,55,10,55,10,57.5,8,57.5,8,55,9,2515,70,73,78,테크닉 확인","2025-01-08,W01,Hypertrophy,데드리프트,5,130,6,130,6,135,6,135,5,130,6,3825,70.1,162,80,자세 점검 시작","2025-01-13,W02,Hypertrophy,스쿼트,5,102.5,8,102.5,8,107.5,8,107.5,7,102.5,8,4275,70.2,134,78,컨디션 양호","2025-01-14,W02,Hypertrophy,벤치프레스,5,57.5,10,57.5,9,60,8,60,7,55,10,2505,70.2,76,82,상체 볼륨감 집중","2025-01-15,W02,Hypertrophy,데드리프트,5,132.5,6,132.5,6,137.5,6,137.5,5,132.5,6,3915,70.3,165,82,안정적 수행","2025-01-20,W03,Hypertrophy,스쿼트,5,105,8,105,8,110,8,110,6,105,7,4025,70.4,138,85,하단 반등 집중","2025-01-21,W03,Hypertrophy,벤치프레스,5,60,9,60,8,62.5,7,62.5,6,57.5,8,2475,70.4,78,86,가슴 자극 집중","2025-01-22,W03,Hypertrophy,데드리프트,5,135,6,135,6,140,5,140,5,135,5,3730,70.5,168,88,호흡 유지 집중","2025-01-27,W04,Deload,스쿼트,4,85,6,85,6,85,6,85,6,-,-,2040,70.5,135,50,1주기 디로드","2025-01-28,W04,Deload,벤치프레스,4,47.5,8,47.5,8,47.5,8,47.5,8,-,-,1520,70.5,75,48,관절 피로 해소","2025-01-29,W04,Deload,데드리프트,4,110,5,110,5,110,5,110,5,-,-,2200,70.6,165,52,신경계 회복","2025-02-03,W05,Strength,스쿼트,5,115,5,115,5,120,5,120,5,125,4,2875,70.7,143,82,스트렝스 주기 시작","2025-02-04,W05,Strength,벤치프레스,5,65,6,65,6,67.5,5,67.5,5,70,4,1772.5,70.7,81,84,첫 70kg 터치","2025-02-05,W05,Strength,데드리프트,5,145,5,145,5,150,5,150,4,155,3,2775,70.8,175,85,바벨 속도 안정화","2025-02-10,W06,Strength,스쿼트,5,117.5,5,117.5,5,122.5,5,122.5,5,127.5,4,2950,70.9,146,84,상체 각도 유지","2025-02-11,W06,Strength,벤치프레스,5,67.5,6,67.5,5,70,5,70,5,72.5,3,1812.5,70.9,83,86,어깨 패킹감 일관","2025-02-12,W06,Strength,데드리프트,5,147.5,5,147.5,5,152.5,5,152.5,4,157.5,3,2845,71,178,87,광배근 락킹 강화","2025-02-17,W07,Strength,스쿼트,5,120,5,120,5,125,5,125,4,130,3,2865,71.1,148,88,고중량 적응화","2025-02-18,W07,Strength,벤치프레스,5,70,5,70,5,72.5,5,72.5,4,75,3,1787.5,71.2,85,89,중간 일관 유지","2025-02-19,W07,Strength,데드리프트,5,150,5,150,5,155,4,155,4,160,3,2810,71.2,182,90,락아웃 파워 상승","2025-02-24,W08,Deload,스쿼트,4,90,5,90,5,90,5,90,5,-,-,1800,71.2,145,52,2주기 디로드","2025-02-25,W08,Deload,벤치프레스,4,52.5,6,52.5,6,52.5,6,52.5,6,-,-,1260,71.3,82,50,가벼운 루틴 유지","2025-02-26,W08,Deload,데드리프트,4,115,5,115,5,115,5,115,5,-,-,2300,71.3,180,55,허리 부담 최소화","2025-03-03,W09,Peaking,스쿼트,5,125,3,130,3,135,3,140,2,145,1,1940,71.4,150,89,145kg 1RM 성공","2025-03-04,W09,Peaking,벤치프레스,5,72.5,4,75,3,77.5,3,80,2,82.5,1,1227.5,71.4,85,91,82.5kg PR 달성","2025-03-05,W09,Peaking,데드리프트,5,155,4,160,3,165,3,172.5,2,182.5,1,2125,71.5,188,92,182.5kg PR 달성","2025-03-10,W10,Hypertrophy,스쿼트,5,107.5,8,107.5,8,112.5,8,112.5,7,107.5,8,4325,71.5,142,77,2분기 근비대 주기 시작","2025-03-11,W10,Hypertrophy,벤치프레스,5,60,10,60,9,62.5,8,62.5,8,60,9,2680,71.6,80,80,가슴 볼륨 극대화","2025-03-12,W10,Hypertrophy,데드리프트,5,137.5,6,137.5,6,142.5,6,142.5,5,137.5,6,4035,71.6,172,81,후면사슬 자극 극대화","2025-03-17,W11,Hypertrophy,스쿼트,5,110,8,110,8,115,8,115,7,110,8,4435,71.7,145,80,대퇴사두 펌핑 양호","2025-03-18,W11,Hypertrophy,벤치프레스,5,62.5,9,62.5,9,65,8,65,7,60,10,2662.5,71.7,82,83,삼두근 보조력 상승","2025-03-19,W11,Hypertrophy,데드리프트,5,140,6,140,6,145,6,145,5,140,6,4115,71.8,175,84,악력 및 그립 지구력","2025-03-24,W12,Deload,스쿼트,4,90,6,90,6,90,6,90,6,-,-,2160,71.8,144,50,중간 디로드","2025-03-25,W12,Deload,벤치프레스,4,52.5,8,52.5,8,52.5,8,52.5,8,-,-,1680,71.8,80,48,회전근개 스트레칭","2025-03-26,W12,Deload,데드리프트,4,115,5,115,5,115,5,115,5,-,-,2300,71.9,173,50,기립근 휴식","2025-03-31,W13,Strength,스쿼트,5,122.5,5,122.5,5,127.5,5,127.5,4,132.5,3,2962.5,71.9,152,83,스트렝스 주기 시작","2025-04-01,W13,Strength,벤치프레스,5,70,6,70,5,72.5,5,72.5,5,75,4,1887.5,72,86,85,바벨 밀어내는 파워","2025-04-02,W13,Strength,데드리프트,5,152.5,5,152.5,5,157.5,5,157.5,4,162.5,3,2930,72,185,86,지면 반발력 활용","2025-04-07,W14,Strength,스쿼트,5,125,5,125,5,130,5,130,4,135,3,3030,72.1,154,86,안정적 하강 가속화","2025-04-08,W14,Strength,벤치프레스,5,72.5,5,72.5,5,75,5,75,4,77.5,3,1832.5,72.1,88,88,레그드라이브 강화","2025-04-09,W14,Strength,데드리프트,5,155,5,155,5,160,4,160,4,165,3,2965,72.2,188,88,등 상부 타이트닝","2025-04-14,W15,Strength,스쿼트,5,127.5,5,127.5,5,132.5,4,132.5,4,137.5,3,2985,72.2,156,89,고중량 멘탈 유지","2025-04-15,W15,Strength,벤치프레스,5,75,5,75,5,77.5,4,77.5,4,80,3,1830,72.3,90,90,80kg 3회 성공","2025-04-16,W15,Strength,데드리프트,5,157.5,5,157.5,4,162.5,4,162.5,4,170,3,2985,72.3,192,91,고중량 셋업 집중","2025-04-21,W16,Deload,스쿼트,4,95,5,95,5,95,5,95,5,-,-,1900,72.3,153,52,피로도 관리 집중","2025-04-22,W16,Deload,벤치프레스,4,55,6,55,6,55,6,55,6,-,-,1320,72.4,87,49,가슴 이완 스트레칭","2025-04-23,W16,Deload,데드리프트,4,120,5,120,5,120,5,120,5,-,-,2400,72.4,190,53,요추 회복 집중","2025-04-28,W17,Peaking,스쿼트,5,130,3,135,3,142.5,2,147.5,2,152.5,1,1927.5,72.5,156,92,스쿼트 152.5kg PR","2025-04-29,W17,Peaking,벤치프레스,5,75,3,77.5,3,80,3,83,2,86,1,1211,72.5,89,93,벤치프레스 86kg PR","2025-04-30,W17,Peaking,데드리프트,5,160,3,167.5,3,175,2,182.5,1,190,1,1900,72.6,194,94,데드리프트 190kg PR","2025-05-05,W18,Hypertrophy,스쿼트,5,112.5,8,112.5,8,117.5,7,117.5,7,112.5,7,4237.5,72.6,150,79,3분기 볼륨으로 전환","2025-05-06,W18,Hypertrophy,벤치프레스,5,65,9,65,8,67.5,8,67.5,7,62.5,9,2660,72.7,85,81,가슴 타격 집중","2025-05-07,W18,Hypertrophy,데드리프트,5,142.5,6,142.5,6,147.5,5,147.5,5,142.5,5,3890,72.7,180,82,햄스트링 로드감","2025-05-12,W19,Hypertrophy,스쿼트,5,115,8,115,8,120,7,120,6,115,7,4345,72.8,153,82,반복 일관성 향상","2025-05-13,W19,Hypertrophy,벤치프레스,5,67.5,8,67.5,8,70,7,70,6,65,8,2520,72.8,87,84,피딩 템포 조절","2025-05-14,W19,Hypertrophy,데드리프트,5,145,6,145,6,150,5,150,5,145,5,3965,72.9,183,85,호흡 밸런스 유지","2025-05-19,W20,Deload,스쿼트,4,95,6,95,6,95,6,95,6,-,-,2280,72.9,150,51,하체 디로드","2025-05-20,W20,Deload,벤치프레스,4,55,8,55,8,55,8,55,8,-,-,1760,72.9,85,47,상체 유연성 확보","2025-05-21,W20,Deload,데드리프트,4,120,5,120,5,120,5,120,5,-,-,2400,73,181,50,등 하부 이완","2025-05-26,W21,Strength,스쿼트,5,127.5,5,127.5,5,132.5,5,132.5,4,137.5,3,3032.5,73,157,84,스트렝스 체감 상승","2025-05-27,W21,Strength,벤치프레스,5,72.5,6,72.5,5,75,5,75,4,77.5,4,1882.5,73.1,90,86,안정적 프레스","2025-05-28,W21,Strength,데드리프트,5,157.5,5,157.5,5,162.5,4,162.5,4,167.5,3,2987.5,73.1,194,87,바벨 스피드 증가","2025-06-02,W22,Strength,스쿼트,5,130,5,130,5,135,4,135,4,140,3,3000,73.2,160,87,하단 탈출 속도 상승","2025-06-03,W22,Strength,벤치프레스,5,75,5,75,5,77.5,5,77.5,4,80,4,1917.5,73.2,92,88,80kg 반복수 상승","2025-06-04,W22,Strength,데드리프트,5,160,5,160,4,165,4,165,4,172.5,3,3017.5,73.3,198,89,신경계 몰입도 향상","2025-06-09,W23,Deload,스쿼트,4,100,5,100,5,100,5,100,5,-,-,2000,73.3,157,53,워밍 업 컨디셔닝","2025-06-10,W23,Deload,벤치프레스,4,57.5,6,57.5,6,57.5,6,57.5,6,-,-,1380,73.3,90,48,가슴 탄력 유지","2025-06-11,W23,Deload,데드리프트,4,125,5,125,5,125,5,125,5,-,-,2500,73.4,193,52,자세 완벽 정렬","2025-06-16,W24,Peaking,스쿼트,5,135,3,142.5,3,150,2,155,1,160,1,1897.5,73.4,162,94,스쿼트 160kg 성공","2025-06-17,W24,Peaking,벤치프레스,5,77.5,3,82.5,3,85,2,88,1,91,1,1146.5,73.5,93,95,벤치 91kg 첫 90 돌파","2025-06-18,W24,Peaking,데드리프트,5,165,3,175,2,185,2,192.5,1,200,1,1787.5,73.5,203,96,데드 200kg 달성","2025-06-23,W25,Deload,스쿼트,4,100,6,100,6,100,6,100,6,-,-,2400,73.5,158,50,상반기 마감 디로드","2025-06-24,W25,Deload,벤치프레스,4,60,6,60,6,60,6,60,6,-,-,1440,73.6,90,49,어깨 피로 털기","2025-06-25,W25,Deload,데드리프트,4,125,5,125,5,125,5,125,5,-,-,2500,73.6,195,51,중추신경계 회복","2025-06-30,W26,Hypertrophy,스쿼트,5,115,8,115,8,120,7,120,7,115,8,4375,73.7,155,78,하반기 주기 시작","2025-07-01,W26,Hypertrophy,벤치프레스,5,67.5,8,67.5,8,70,8,70,7,65,9,2615,73.7,89,82,가슴 두께감 집중","2025-07-02,W26,Hypertrophy,데드리프트,5,147.5,6,147.5,6,152.5,5,152.5,5,147.5,5,4030,73.8,188,83,기립근 지구력 향상","2025-07-07,W27,Hypertrophy,스쿼트,5,117.5,8,117.5,8,122.5,7,122.5,6,117.5,7,4345,73.8,157,81,하체 볼륨 유지","2025-07-08,W27,Hypertrophy,벤치프레스,5,70,8,70,8,72.5,7,72.5,6,67.5,8,2587.5,73.9,92,85,바벨 궤적 일치","2025-07-09,W27,Hypertrophy,데드리프트,5,150,6,150,6,155,5,155,5,150,5,4100,73.9,190,86,스트랩 그립 완벽성","2025-07-14,W28,Deload,스쿼트,4,100,6,100,6,100,6,100,6,-,-,2400,74,156,51,여름철 수분/피로 조절","2025-07-15,W28,Deload,벤치프레스,4,60,8,60,8,60,8,60,8,-,-,1920,74,91,48,어깨 스트레칭","2025-07-16,W28,Deload,데드리프트,4,130,5,130,5,130,5,130,5,-,-,2600,74,195,50,안정감 유지","2025-07-21,W29,Strength,스쿼트,5,130,5,130,5,135,5,135,4,140,3,3105,74.1,162,85,중량 적응도 최상","2025-07-22,W29,Strength,벤치프레스,5,75,6,75,5,77.5,5,77.5,4,80,4,1942.5,74.1,93,87,밀기 속도 증가","2025-07-23,W29,Strength,데드리프트,5,160,5,160,5,165,4,165,4,172.5,3,3077.5,74.2,201,88,하체 킥 파워","2025-07-28,W30,Strength,스쿼트,5,132.5,5,132.5,5,137.5,4,137.5,4,142.5,3,3090,74.2,164,88,안정 하강 유지","2025-07-29,W30,Strength,벤치프레스,5,77.5,5,77.5,5,80,4,80,4,82.5,3,1912.5,74.3,95,90,82.5kg 세트 안착","2025-07-30,W30,Strength,데드리프트,5,162.5,5,162.5,4,167.5,4,167.5,4,175,3,3082.5,74.3,203,90,등 중심 완성","2025-08-04,W31,Deload,스쿼트,4,105,5,105,5,105,5,105,5,-,-,2100,74.3,160,52,휴가 디로드","2025-08-05,W31,Deload,벤치프레스,4,60,6,60,6,60,6,60,6,-,-,1440,74.4,92,49,관절 회복","2025-08-06,W31,Deload,데드리프트,4,130,5,130,5,130,5,130,5,-,-,2600,74.4,200,53,안정 유지","2025-08-11,W32,Peaking,스쿼트,5,137.5,3,145,3,152.5,2,157.5,1,162.5,1,1872.5,74.4,165,93,스쿼트 162.5kg PR","2025-08-12,W32,Peaking,벤치프레스,5,80,3,83,3,86,2,90,1,93.5,1,1144.5,74.5,96,94,벤치프레스 93.5kg PR","2025-08-13,W32,Peaking,데드리프트,5,170,3,180,2,190,1,197.5,1,205,1,1772.5,74.5,208,95,데드리프트 205kg PR","2025-08-18,W33,Hypertrophy,스쿼트,5,117.5,8,117.5,8,122.5,7,122.5,7,117.5,8,4437.5,74.5,158,80,볼륨 사이클 재개","2025-08-19,W33,Hypertrophy,벤치프레스,5,70,8,70,8,72.5,8,72.5,7,67.5,9,2682.5,74.6,93,83,정확한 가슴 타격","2025-08-20,W33,Hypertrophy,데드리프트,5,152.5,6,152.5,6,157.5,5,157.5,5,152.5,5,4195,74.6,192,84,둔근 발달 집중","2025-08-25,W34,Hypertrophy,스쿼트,5,120,8,120,8,125,7,125,6,120,7,4460,74.7,160,82,하체 볼륨 4.4톤 돌파","2025-08-26,W34,Hypertrophy,벤치프레스,5,72.5,8,72.5,7,75,7,75,6,70,8,2615,74.7,95,86,밀기 힘 아주 탁월","2025-08-27,W34,Hypertrophy,데드리프트,5,155,6,155,5,160,5,160,5,155,5,4200,74.7,195,86,안정적 락다운","2025-09-01,W35,Deload,스쿼트,4,105,6,105,6,105,6,105,6,-,-,2520,74.8,158,50,디로드 및 식단 점검","2025-09-02,W35,Deload,벤치프레스,4,62.5,8,62.5,8,62.5,8,62.5,8,-,-,2000,74.8,92,48,상체 피로 완화","2025-09-03,W35,Deload,데드리프트,4,135,5,135,5,135,5,135,5,-,-,2700,74.8,198,51,허리 탄력 유지","2025-09-08,W36,Strength,스쿼트,5,132.5,5,132.5,5,137.5,5,137.5,4,142.5,3,3177.5,74.9,166,86,스쿼트 파워 상승","2025-09-09,W36,Strength,벤치프레스,5,77.5,6,77.5,5,80,5,80,4,82.5,4,1987.5,74.9,96,88,바벨 속도감 확보","2025-09-10,W36,Strength,데드리프트,5,165,5,165,5,170,4,170,4,177.5,3,3167.5,74.9,206,89,광배 텐션 극대화","2025-09-15,W37,Strength,스쿼트,5,135,5,135,5,140,4,140,4,145,3,3150,75,168,89,145kg 3회 성공","2025-09-16,W37,Strength,벤치프레스,5,80,5,80,5,82.5,4,82.5,4,85,3,1970,75,98,90,85kg 3회 성공","2025-09-17,W37,Strength,데드리프트,5,167.5,5,167.5,4,172.5,4,172.5,4,180,3,3187.5,75,209,91,안정 폭발 수행","2025-09-22,W38,Deload,스쿼트,4,110,5,110,5,110,5,110,5,-,-,2200,75,165,51,신경계 피로 관리 디로드","2025-09-23,W38,Deload,벤치프레스,4,65,6,65,6,65,6,65,6,-,-,1560,75.1,95,49,가슴 이완","2025-09-24,W38,Deload,데드리프트,4,135,5,135,5,135,5,135,5,-,-,2700,75.1,205,52,하체 스트레칭","2025-09-29,W39,Peaking,스쿼트,5,140,3,147.5,3,155,2,160,1,165,1,1897.5,75.1,168,93,스쿼트 165kg PR 달성","2025-09-30,W39,Peaking,벤치프레스,5,82.5,3,85,3,88,2,92.5,1,96,1,1160,75.2,98,94,벤치 96kg PR 달성","2025-10-01,W39,Peaking,데드리프트,5,175,3,185,2,195,1,202.5,1,210,1,1787.5,75.2,212,95,데드리프트 210kg 달성","2025-10-06,W40,Hypertrophy,스쿼트,5,120,8,120,8,125,7,125,7,120,8,4520,75.2,162,79,4분기 마지막 주기 시작","2025-10-07,W40,Hypertrophy,벤치프레스,5,72.5,8,72.5,8,75,8,75,7,70,9,2745,75.3,96,82,볼륨감 증가","2025-10-08,W40,Hypertrophy,데드리프트,5,155,6,155,6,160,5,160,5,155,5,4255,75.3,198,83,기립근 두께감","2025-10-13,W41,Hypertrophy,스쿼트,5,122.5,8,122.5,8,127.5,7,127.5,6,122.5,7,4460,75.3,165,82,하체 볼륨감 추가","2025-10-14,W41,Hypertrophy,벤치프레스,5,75,8,75,7,77.5,7,77.5,6,72.5,8,2670,75.4,98,85,가슴 자극 피치","2025-10-15,W41,Hypertrophy,데드리프트,5,157.5,6,157.5,6,162.5,5,162.5,5,157.5,5,4290,75.4,200,85,바벨 타이트감","2025-10-20,W42,Deload,스쿼트,4,110,6,110,6,110,6,110,6,-,-,2640,75.4,162,50,관절 및 부담 회복","2025-10-21,W42,Deload,벤치프레스,4,65,8,65,8,65,8,65,8,-,-,2080,75.5,95,47,어깨 스트레칭","2025-10-22,W42,Deload,데드리프트,4,140,5,140,5,140,5,140,5,-,-,2800,75.5,202,52,하체 폼롤러","2025-10-27,W43,Strength,스쿼트,5,135,5,135,5,140,5,140,4,145,4,3070,75.5,170,85,최종 스트렝스 주기","2025-10-28,W43,Strength,벤치프레스,5,80,6,80,5,82.5,5,82.5,4,85,4,2037.5,75.6,99,87,프레스 궤적 안정화","2025-10-29,W43,Strength,데드리프트,5,170,5,170,4,175,4,175,4,182.5,3,3217.5,75.6,211,88,지면 반발력 상승","2025-11-03,W44,Strength,스쿼트,5,137.5,5,137.5,5,142.5,4,142.5,4,147.5,3,3160,75.6,172,88,스쿼트 하단 파워","2025-11-04,W44,Strength,벤치프레스,5,82.5,5,82.5,5,85,4,85,4,87.5,3,2005,75.7,101,89,87.5kg 3회 성공","2025-11-05,W44,Strength,데드리프트,5,172.5,5,172.5,4,177.5,4,177.5,4,185,3,3222.5,75.7,214,90,락아웃 완성도","2025-11-10,W45,Strength,스쿼트,5,140,5,140,4,145,4,145,3,150,3,3125,75.7,174,90,150kg 3회 성공","2025-11-11,W45,Strength,벤치프레스,5,85,5,85,4,87.5,4,87.5,3,90,3,2047.5,75.8,103,91,90kg 세트 안착","2025-11-12,W45,Strength,데드리프트,5,175,4,175,4,180,4,180,3,190,2,3060,75.8,216,92,초고중량 적응","2025-11-17,W46,Deload,스쿼트,4,110,5,110,5,110,5,110,5,-,-,2200,75.8,170,52,피크 전 최종 휴식","2025-11-18,W46,Deload,벤치프레스,4,65,6,65,6,65,6,65,6,-,-,1560,75.9,100,48,중간 이완","2025-11-19,W46,Deload,데드리프트,4,140,5,140,5,140,5,140,5,-,-,2800,75.9,212,50,신경 피로 털기","2025-11-24,W47,Peaking,스쿼트,5,145,3,152.5,3,160,2,165,1,170,1,1927.5,75.9,173,95,스쿼트 170kg 성공","2025-11-25,W47,Peaking,벤치프레스,5,85,3,90,2,93,2,97.5,1,100,1,1218.5,76,102,96,벤치프레스 대망의 100kg 달성!","2025-11-26,W47,Peaking,데드리프트,5,180,3,190,2,200,1,207.5,1,215,1,1802.5,76,218,96,데드리프트 215kg PR","2025-12-01,W48,Deload,스쿼트,4,115,5,115,5,115,5,115,5,-,-,2300,76,170,50,최종 연말 PR 대비 디로드","2025-12-02,W48,Deload,벤치프레스,4,67.5,6,67.5,6,67.5,6,67.5,6,-,-,1620,76,100,47,가슴/어깨 보호","2025-12-03,W48,Deload,데드리프트,4,140,5,140,5,140,5,140,5,-,-,2800,76.1,212,50,기립근 활성 유지","2025-12-08,W49,Tapering,스쿼트,4,130,3,142.5,2,152.5,1,160,1,-,-,1022.5,76.1,172,78,테이퍼링 신경계 정밀","2025-12-09,W49,Tapering,벤치프레스,4,77.5,3,85,2,92.5,1,97.5,1,-,-,695,76.1,102,80,스피드 유지형","2025-12-10,W49,Tapering,데드리프트,4,160,3,175,2,192.5,1,202.5,1,-,-,1225,76.2,216,81,자세 정밀 완료","2025-12-15,W50,Tapering,스쿼트,3,120,3,135,2,150,1,-,-,-,-,780,76.2,172,68,컨디션 조절","2025-12-16,W50,Tapering,벤치프레스,3,70,3,80,2,90,1,-,-,-,-,460,76.2,102,70,바벨감 체득","2025-12-17,W50,Tapering,데드리프트,3,150,3,170,2,190,1,-,-,-,-,980,76.3,216,72,에너지 비축","2025-12-22,W51,Final_PR,스쿼트,5,145,2,157.5,1,165,1,172.5,1,175,1,960,76.3,177,98,1년 결실: 스쿼트 175kg 성공 (초기 +35kg)","2025-12-23,W51,Final_PR,벤치프레스,5,85,2,92.5,1,97.5,1,102.5,1,105,1,567.5,76.3,106,99,1년 결실: 벤치 105kg 성공 (초기 +25kg)","2025-12-24,W51,Final_PR,데드리프트,5,180,2,195,1,205,1,215,1,220,1,1195,76.4,223,99,1년 결실: 데드 220kg 성공 (초기 +40kg)","2025-12-29,W52,Active_Recovery,스쿼트,4,100,5,100,5,100,5,100,5,-,-,2000,76.4,175,45,연말 액티브 회복","2025-12-30,W52,Active_Recovery,벤치프레스,4,60,6,60,6,60,6,60,6,-,-,1440,76.4,105,42,연말 가슴 회복","2025-12-31,W52,Active_Recovery,데드리프트,4,130,5,130,5,130,5,130,5,-,-,2600,76.5,220,44,1년 3대 500kg 달성 축하 루틴"];

  /* [#TASK-ES-405] generate52WeekPowerliftingSample · generate1920sOlympicStrengthSample → js/stats-samples.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* [#TASK-ES-401] parseCsvToUniversalRecords → js/stats-import.js 로 옮김(동작 그대로). 이 IIFE 맨 위에서 같은 이름으로 가져온다. */

  /* ================= 5-3. 기존 아워골 기록 + 외부 데이터 자율 온톨로지 색인 ================= */

  /* ================= 5-3. 8대 도메인 다형성 온톨로지 빌더 ================= */
    var DOMAINS = {
    career: { key: 'career', name: '업무·성과', icon: '💼', color: '#8b5cf6' },
    finance: { key: 'finance', name: '재테크·자산', icon: '💰', color: '#f59e0b' },
    learning: { key: 'learning', name: '학습·독서', icon: '📖', color: '#3b82f6' },
    health: { key: 'health', name: '건강·운동', icon: '🏃', color: '#10b981' },
    mind: { key: 'mind', name: '멘탈·회고', icon: '🧘', color: '#06b6d4' },
    routine: { key: 'routine', name: '일상·루틴', icon: '⏰', color: '#ec4899' },
    hobby: { key: 'hobby', name: '취미·창작', icon: '🎨', color: '#f43f5e' },
    relationship: { key: 'relationship', name: '관계·소통', icon: '🤝', color: '#64748b' },
    general: { key: 'general', name: '일반·데이터', icon: '📊', color: '#6366f1' }
  };

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
  var METRIC_DIFFERENTIATED_MODELS = {
    // 1. 체중/다이어트: 7일 이동평균 & 주간 감량 안전속도
    weight: {
      name: '체중 및 체성분 정밀 분석',
      modelType: 'moving_average_safety',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '체중 데이터 없음', kpis: [], summary: '체중 기록을 추가해보세요.' };
        var latest = points[n - 1].value || 0;
        var first = points[0].value || latest;
        var totalDiff = +(latest - first).toFixed(2);
        
        // 7일 이동평균 계산
        var last7 = points.slice(-7);
        var ma7 = +(last7.reduce(function(a, b){ return a + (b.value||0); }, 0) / (last7.length || 1)).toFixed(2);
        
        // 주간 속도 (최근 7일 기준 감량폭)
        var weeklyDiff = last7.length > 1 ? +(last7[last7.length - 1].value - last7[0].value).toFixed(2) : 0;
        var isSafeVelocity = weeklyDiff >= -1.0 && weeklyDiff <= 0.5;
        var velocityText = weeklyDiff <= 0 ? (Math.abs(weeklyDiff) + 'kg 감량/주') : ('+' + weeklyDiff + 'kg 증량/주');

        return {
          model: 'weight',
          title: '⚖️ 체중 7일 이동평균 & 감량 안전도 정밀 분석',
          kpis: [
            { label: '현재 체중', val: latest + ' kg', badge: '최신 실측' },
            { label: '7일 이동평균 (MA7)', val: ma7 + ' kg', badge: '체수분 보정 정본' },
            { label: '주간 속도', val: velocityText, badge: isSafeVelocity ? '안전 골디락스' : '주의 속도' },
            { label: '총 누적 변동', val: (totalDiff > 0 ? '+' : '') + totalDiff + ' kg', badge: totalDiff <= 0 ? '감량 성공' : '증량' }
          ],
          summary: '체수분 왜곡을 배제한 7일 이동평균은 ' + ma7 + 'kg이며, ' + (isSafeVelocity ? '근손실 없는 안전 감량 궤도를 유지 중입니다.' : '급격한 수분 변화를 주의하고 균형 잡힌 영양을 섭취하세요.')
        };
      }
    },

    // 2. 3대 운동 / 헬스: 에플리 1RM 추정 & 과부하 성장률
    big3: {
      name: '스트렝스 1RM 추정 및 점진적 과부하 분석',
      modelType: 'epley_1rm_overload',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '운동 데이터 없음', kpis: [], summary: '세트/중량 기록을 추가해보세요.' };
        var maxWeight = Math.max.apply(null, points.map(function(p){ return p.value || 0; }));
        var latestWeight = points[n - 1].value || 0;
        // 에플리 공식: 1RM = Weight * (1 + Reps / 30) (5회 기준 1.167)
        var estimated1RM = Math.round(maxWeight * (1 + 5 / 30));
        var first = points[0].value || latestWeight;
        var growthRate = first > 0 ? Math.round(((latestWeight - first) / first) * 100) : 0;
        var totalVolumeTon = +(points.reduce(function(a, b){ return a + (b.value||0); }, 0) * 10 / 1000).toFixed(1);

        return {
          model: 'big3',
          title: '🏋️ 에플리 공식 1RM 추정 & 점진적 과부하 분석',
          kpis: [
            { label: '추정 1RM (Epley)', val: estimated1RM + ' kg', badge: '최대 근력' },
            { label: '최고 수행 중량 (PR)', val: maxWeight + ' kg', badge: '최고 기록' },
            { label: '과부하 성장률', val: (growthRate > 0 ? '+' : '') + growthRate + '%', badge: '점진적 과부하' },
            { label: '추정 누적 볼륨', val: totalVolumeTon + ' 톤', badge: '총 운동량' }
          ],
          summary: '에플리 공식 기준 추정 1RM은 ' + estimated1RM + 'kg이며, 시작 대비 ' + growthRate + '%의 점진적 과부하를 성공적으로 달성했습니다.'
        };
      }
    },

    // 3. 러닝: 페이스존 5단계 & 심폐 마일리지
    running: {
      name: '러닝 페이스존 및 심폐 마일리지 분석',
      modelType: 'pace_zone_cardio',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '러닝 데이터 없음', kpis: [], summary: '러닝 기록을 추가해보세요.' };
        var totalDist = +(points.reduce(function(a, b){ return a + (b.value||0); }, 0)).toFixed(1);
        var avgDist = +(totalDist / n).toFixed(1);
        var maxDist = Math.max.apply(null, points.map(function(p){ return p.value || 0; }));
        var cardioLoad = Math.round(totalDist * 12.5);
        var paceZone = totalDist > 50 ? 'Zone 3 (지구력 향상존)' : 'Zone 2 (유산소 베이스존)';

        return {
          model: 'running',
          title: '🏃 5단계 페이스존 & 심폐 부하 마일리지 분석',
          kpis: [
            { label: '총 누적 거리', val: totalDist + ' km', badge: '총 주행' },
            { label: '평균 1회 주행', val: avgDist + ' km', badge: '평균 거리' },
            { label: '최장 1회 거리', val: maxDist + ' km', badge: '최장 런' },
            { label: '심폐 부하 지수', val: cardioLoad + ' pts', badge: paceZone }
          ],
          summary: '현재 ' + paceZone + ' 훈련을 진행 중이며, 총 ' + totalDist + 'km 주행으로 심폐 부하 지수 ' + cardioLoad + '점을 적립했습니다.'
        };
      }
    },

    // 4. 공부/수험: 순공 분당 몰입 밀도 & 뽀모도로 지속성
    study: {
      name: '학습 몰입 밀도 및 세션 지속 지수',
      modelType: 'focus_density_streak',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '학습 데이터 없음', kpis: [], summary: '공부 기록을 추가해보세요.' };
        var totalMinutes = points.reduce(function(a, b){ return a + (b.value||0); }, 0);
        var totalHours = +(totalMinutes / 60).toFixed(1);
        var avgDailyMin = Math.round(totalMinutes / (n || 1));
        var pomodoroSessions = Math.floor(totalMinutes / 25);
        var focusDensity = avgDailyMin >= 180 ? '최상급 딥워크 (95%)' : (avgDailyMin >= 90 ? '안정적 몰입 (80%)' : '시작 단계 (60%)');

        return {
          model: 'study',
          title: '📚 순공 분당 몰입 밀도 & 뽀모도로 세션 분석',
          kpis: [
            { label: '총 누적 순공', val: totalHours + ' 시간', badge: '총 학습' },
            { label: '일일 평균 몰입', val: avgDailyMin + ' 분', badge: '일평균' },
            { label: '완료 뽀모도로', val: pomodoroSessions + ' 세션', badge: '25분 몰입' },
            { label: '몰입 밀도 등급', val: focusDensity, badge: '집중도' }
          ],
          summary: '총 ' + totalHours + '시간의 순공과 ' + pomodoroSessions + '회의 뽀모도로 세션을 완료하여 ' + focusDensity + ' 수준의 학습 밀도를 입증했습니다.'
        };
      }
    },

    // 5. 재테크/자산: 월간 저축 가속도 & 복리 성장 예측
    finance: {
      name: '자산 누적 가속도 및 복리 달성률',
      modelType: 'compound_saving_velocity',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '자산 데이터 없음', kpis: [], summary: '저축/투자 기록을 추가해보세요.' };
        var totalSaved = points.reduce(function(a, b){ return a + (b.value||0); }, 0);
        var avgMonthly = Math.round(totalSaved / (Math.max(1, Math.ceil(n / 4))));
        var first = points[0].value || 1;
        var latest = points[n - 1].value || first;
        var velocityRate = Math.round(((latest - first) / first) * 100);
        var projectedYearly = Math.round(avgMonthly * 12);

        return {
          model: 'finance',
          title: '💰 월간 저축 가속도 & 연간 자산 누적 예측',
          kpis: [
            { label: '총 누적 저축액', val: totalSaved.toLocaleString() + ' 만원', badge: '총 자산' },
            { label: '월평균 저축액', val: avgMonthly.toLocaleString() + ' 만원', badge: '월 저축력' },
            { label: '저축 가속도', val: (velocityRate > 0 ? '+' : '') + velocityRate + '%', badge: '추세' },
            { label: '연간 예상 누적', val: projectedYearly.toLocaleString() + ' 만원', badge: '1년 전망' }
          ],
          summary: '현재 월평균 ' + avgMonthly.toLocaleString() + '만원의 저축력으로 연간 ' + projectedYearly.toLocaleString() + '만원 자산 형성이 예상됩니다.'
        };
      }
    },

    // 6. 수면/웰니스: 수면 리듬 규칙성 100점 점수 & 수면 부채
    sleep: {
      name: '수면 리듬 규칙성 및 부채 지수',
      modelType: 'sleep_regularity_score',
      analyze: function(points){
        points = Array.isArray(points) ? points : [];
        var n = points.length;
        if(n === 0) return { title: '수면 데이터 없음', kpis: [], summary: '수면 기록을 추가해보세요.' };
        var avgHours = +(points.reduce(function(a, b){ return a + (b.value||0); }, 0) / n).toFixed(1);
        var debt = +(Math.max(0, 7.5 - avgHours) * 7).toFixed(1);
        var variances = points.map(function(p){ return Math.pow((p.value || avgHours) - avgHours, 2); });
        var stdDev = Math.sqrt(variances.reduce(function(a, b){ return a + b; }, 0) / (n || 1));
        var regularityScore = Math.max(50, Math.min(100, Math.round(100 - (stdDev * 20))));

        return {
          model: 'sleep',
          title: '💤 수면 리듬 규칙성 100점 지수 & 수면 부채',
          kpis: [
            { label: '일일 평균 수면', val: avgHours + ' 시간', badge: '평균' },
            { label: '수면 규칙성 점수', val: regularityScore + ' / 100점', badge: regularityScore >= 80 ? '골드 웰니스' : '불규칙 주의' },
            { label: '주간 수면 부채', val: debt + ' 시간', badge: debt <= 2 ? '적정 충전' : '피로 누적' },
            { label: '수면 변동성 (표준편차)', val: '±' + stdDev.toFixed(1) + 'h', badge: '리듬 안정도' }
          ],
          summary: '수면 규칙성 점수는 ' + regularityScore + '점이며, ' + (debt <= 2 ? '최적의 생체 리듬을 유지하고 있습니다.' : '주말 추가 휴식으로 수면 부채를 해소하세요.')
        };
      }
    }
  };
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
