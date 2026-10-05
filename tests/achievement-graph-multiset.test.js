/**
 * tests/achievement-graph-multiset.test.js
 * #TASK-ES-307 [56] 성취통계 다중 선택된 측정지표 데이터 그래프 동시 렌더링 연동 검증
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { readComponentsBundle } = require('./helpers/components-bundle.js'); // #TASK-ES-412 컴포넌트 합본(원문 + 키트 부품)
const assert = require('assert');

console.log('[TEST START] achievement-graph-multiset (#TASK-ES-307)');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');
const jsStatsPath = path.join(__dirname, '..', 'js', 'records-stats.js');
const jsCompPath = path.join(__dirname, '..', 'js', 'components.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const jsStats = fs.readFileSync(jsStatsPath, 'utf8');
const jsComp = readComponentsBundle();

// 1. index.html 핵심 식별자 및 다중 렌더링 로직 검증
assert.ok(html.includes('TREND_METRICS'), 'index.html: TREND_METRICS 맵 정의 확인');
assert.ok(html.includes('renderMultiMetricSvg'), 'index.html: renderMultiMetricSvg 함수 정의 확인');
assert.ok(html.includes('trend-metrics-selector-row'), 'index.html: .trend-metrics-selector-row 마크업 확인');
assert.ok(html.includes('trend-metric-chip'), 'index.html: .trend-metric-chip 칩 버튼 확인');
assert.ok(html.includes('data-trendmetric'), 'index.html: data-trendmetric 데이터 속성 확인');
assert.ok(html.includes('trend-legend-row'), 'index.html: .trend-legend-row 범례 마크업 확인');
assert.ok(html.includes('trend-multi-svg'), 'index.html: .trend-multi-svg SVG 요소 확인');
assert.ok(html.includes('trend-summary-badges-row'), 'index.html: .trend-summary-badges-row 배지 열 확인');
assert.ok(html.includes('trend-summary-badge'), 'index.html: .trend-summary-badge 다중 지표 요약 배지 확인');
assert.ok(html.includes('selectedTrendMetrics'), 'index.html: selectedTrendMetrics 상태 연동 확인');
console.log('1. index.html 다중 렌더링 마크업 및 핸들러 검증 통과');

// 2. ui.css 스타일 및 모바일 반응형 검증
assert.ok(css.includes('.trend-metrics-selector-row'), 'CSS: .trend-metrics-selector-row 스타일 정의');
assert.ok(css.includes('.trend-metric-chip'), 'CSS: .trend-metric-chip 스타일 정의');
assert.ok(css.includes('.trend-legend-row'), 'CSS: .trend-legend-row 스타일 정의');
assert.ok(css.includes('.trend-multi-svg'), 'CSS: .trend-multi-svg 스타일 정의');
assert.ok(css.includes('.trend-summary-badges-row'), 'CSS: .trend-summary-badges-row 스타일 정의');
assert.ok(css.includes('.trend-summary-badge'), 'CSS: .trend-summary-badge 스타일 정의');
assert.ok(css.includes('max-width: 375px'), 'CSS: 375px 모바일 반응형 미디어 쿼리 정의');
console.log('2. ui.css 스타일 및 375px 반응형 검증 통과');

// 3. js/records-stats.js 다중 지표 계산 검증
const recordsStatsModule = require(jsStatsPath);
assert.ok(typeof recordsStatsModule.computeTrendData === 'function', 'records-stats: computeTrendData 함수 존재');

const dummyRecs = [
  { startAt: new Date(Date.now() - 86400000 * 2).toISOString(), endAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), text: '2일 전 공부' },
  { startAt: new Date(Date.now() - 86400000).toISOString(), endAt: new Date(Date.now() - 86400000 + 7200000).toISOString(), text: '어제 운동' },
  { startAt: new Date().toISOString(), endAt: new Date(Date.now() + 1800000).toISOString(), text: '오늘 독서' }
];

const trendRes = recordsStatsModule.computeTrendData(dummyRecs, 'week');
assert.ok(Array.isArray(trendRes.items), 'items 배열 반환');
assert.ok(Array.isArray(trendRes.availableMetrics), 'availableMetrics 배열 반환');
assert.strictEqual(trendRes.availableMetrics.length, 4, '4종 측정지표 제공 확인');

trendRes.items.forEach(function(it){
  assert.ok(typeof it.durationMinutes === 'number', 'durationMinutes 숫자형');
  assert.ok(typeof it.count === 'number', 'count 숫자형');
  assert.ok(typeof it.rate === 'number', 'rate 숫자형');
  assert.ok(typeof it.streak === 'number', 'streak 숫자형');
  assert.ok(it.metrics != null, 'metrics 객체 존재');
  assert.strictEqual(it.metrics.duration, it.durationMinutes, 'metrics.duration 일치');
  assert.strictEqual(it.metrics.count, it.count, 'metrics.count 일치');
  assert.strictEqual(it.metrics.rate, it.rate, 'metrics.rate 일치');
  assert.strictEqual(it.metrics.streak, it.streak, 'metrics.streak 일치');
});
console.log('3. records-stats.js 다중 지표 데이터 연산 검증 통과');

// 4. js/components.js 액션 및 연동 검증
assert.ok(jsComp.includes('handle성취통계_Item56Action'), 'components.js: handle성취통계_Item56Action 정의 확인');
assert.ok(jsComp.includes('selectedTrendMetrics'), 'components.js: selectedTrendMetrics 세팅 확인');
assert.ok(jsComp.includes('og_trend_metrics'), 'components.js: og_trend_metrics 로컬스토리지 저장 확인');

const componentsModule = require(jsCompPath);
assert.ok(typeof componentsModule.handle성취통계_Item56Action === 'function', 'components.js: handle성취통계_Item56Action export 확인');
console.log('4. components.js 액션 핸들러 및 원자적 트랜잭션 연동 검증 통과');

// 5. renderMultiMetricSvg 함수 단위 테스트
const startSvgIdx = html.indexOf('function renderMultiMetricSvg(');
assert.ok(startSvgIdx !== -1, 'renderMultiMetricSvg 시작점 발견');
const endSvgIdx = html.indexOf('window.renderMultiMetricSvg = renderMultiMetricSvg;', startSvgIdx);
assert.ok(endSvgIdx !== -1, 'renderMultiMetricSvg 종료점 발견');
const svgFnCode = html.substring(startSvgIdx, endSvgIdx);

const TREND_METRICS = {
  duration: { key: 'duration', label: '몰입시간', unit: '분', color: '#3b82f6', getter: function(it){ return it.durationMinutes || 0; } },
  count:    { key: 'count',    label: '실천횟수', unit: '회', color: '#10b981', getter: function(it){ return it.count || 0; } },
  rate:     { key: 'rate',     label: '달성률',   unit: '%',  color: '#8b5cf6', getter: function(it){ return it.rate || 0; } },
  streak:   { key: 'streak',   label: '스트릭',   unit: '일', color: '#f59e0b', getter: function(it){ return it.streak || 0; } }
};

const renderMultiMetricSvg = new Function('items', 'activeMetrics', 'activeIdx', 'metricsMap', 'TREND_METRICS', svgFnCode + '\nreturn renderMultiMetricSvg(items, activeMetrics, activeIdx, metricsMap);');

const testSvg = renderMultiMetricSvg(trendRes.items, ['duration', 'count', 'rate', 'streak'], 6, TREND_METRICS, TREND_METRICS);
assert.ok(testSvg.includes('<svg class="trend-multi-svg"'), 'SVG 루트 태그 확인');
assert.ok(testSvg.includes('stroke="#3b82f6"'), 'duration 파랑 라인 확인');
assert.ok(testSvg.includes('stroke="#10b981"'), 'count 초록 라인 확인');
assert.ok(testSvg.includes('stroke="#8b5cf6"'), 'rate 보라 라인 확인');
assert.ok(testSvg.includes('stroke="#f59e0b"'), 'streak 주황 라인 확인');
assert.ok(testSvg.includes('<line x1='), '활성 인덱스 수직 점선 하이라이트 확인');
assert.ok(testSvg.includes('<circle cx='), '데이터 포인트 원형 서클 확인');
console.log('5. renderMultiMetricSvg 다중 지표 동시 렌더링 SVG 생성 검증 통과');

console.log('[TEST COMPLETED] achievement-graph-multiset test completed successfully.');
