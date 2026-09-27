# PLAN-TASK-ES-307: 성취통계 다중 선택된 측정지표 데이터 그래프 동시 렌더링 연동

## 1. 작업 계획 개요
- **티켓**: `#TASK-ES-307`
- **목표**: 기록탭 성취통계 화면의 메인 추이 차트(`renderWeekChart` / `#chartContainer`)에 다중 측정지표 선택 칩 바 및 SVG 다중 데이터셋 동시 렌더러를 구축하여, 상민님 지시대로 선택된 지표들을 한 그래프에서 동시에 조망할 수 있도록 완결.

---

## 2. 파일별 변경 계획

### 1) `js/records-stats.js`
- `OurgoalRecordsStats.computeTrendData(allRecs, periodKey)`:
  - 각 아이템에 `durationMinutes = Math.round(it.totalMs / 60000)`
  - `rate`: 기간 내 실천율 (`it.count > 0 ? Math.min(100, Math.round((it.count / 2) * 100)) : 0`)
  - `streak`: 포커스 연속 실천일 산출
  - `metrics: { duration, count, rate, streak }` 객체 바인딩.

### 2) `index.html`
- `TREND_METRICS` 맵 정의 (duration, count, rate, streak - 고유 컬러 및 단위).
- `renderWeekChart(recs)`:
  - `.trend-metrics-selector-row` 마크업 생성.
  - 선택된 복수 지표들에 대한 다중 데이터셋 SVG 차트 생성 (정규화 상대 비교 or 듀얼 스케일 라인/포인트).
  - 지표 범례(`.trend-legend-row`) 렌더링.
  - `trendDetailSummary`에 선택된 복수 지표 수치 동시 표출.
  - 지표 칩 클릭 이벤트 리스너(토글, 12ms 햅틱, `localStorage` 저장, 리렌더링) 연결.
- `renderMultiMetricSvg(items, selectedMetricKeys)` 헬퍼 함수 정의 및 window export.

### 3) `js/components.js`
- `handle성취통계_Item43Action`:
  - `state.selectedTrendMetrics`를 실시간 갱신하고 `renderRecordsScreen()`을 호출하도록 보강.

### 4) `ui.css`
- `.trend-metrics-selector-row`: 수평 스크롤, 패딩, 갭.
- `.trend-metric-chip`: 모던 칩 보더, 배경, 활성 테두리/배경.
- `.metric-color-dot`: 지표별 고유 색상 점.
- `.trend-legend-row`: 범례 컨테이너 및 뱃지 스타일.
- 375px 모바일 미디어 쿼리 (`@media (max-width:420px)`).

### 5) 테스트 및 법정 클레임
- `tests/achievement-graph-multiset.test.js`: 마크업, 다중 데이터셋 SVG 생성, 칩 토글 순수 로직, 다크테마/반응형 스타일 검증.
- `scripts/smoke-test.js`: `TASK-ES-307` 검증 블록 추가 (425개 전수 통과).
- `reports/TASK-ES-307/claims.json`: 정적/동적 불변식 4종 작성.
