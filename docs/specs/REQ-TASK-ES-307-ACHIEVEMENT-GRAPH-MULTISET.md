# REQ-TASK-ES-307: 성취통계 다중 선택된 측정지표 데이터 그래프 동시 렌더링 연동

## 1. 개요 및 상민님 지시 원문
- **티켓 ID**: `#TASK-ES-307` (노션 생각 메모장 `[56]`번)
- **노션 Page ID**: `3de598db-9096-81b5-a490-fe066fccc769`
- **상민님 지시 원문**:
  > *"성취통계 그냥 다중선택 가능하게만 바뀌었고 실제 그래프에 적용 안되네. 그래프에서 누른 측정지표들을 한번에 볼 수 있게 적용시켜야지"*
- **비고 (지시 상세)**:
  > *"체크박스/태그로 선택된 복수 측정지표들을 Chart.js / SVG 라인에 다중 데이터셋(Dataset)으로 바인딩하여 동시 표출"*
- **본질 축**: `E2 / 기록 회고 루프 / UX` (성취 통계의 복합 지표 시계열 교차 동시 분석 및 직관적 시각화)

---

## 2. 8원칙 충족 분석 (본질·원인·중심·핵심)

### ① 본질 (Essence)
- 성취통계(기록/통계 탭)에서 사용자가 선택한 복수의 측정지표(몰입시간, 실천횟수, 달성률, 스트릭 등)가 그래프 상에 분리되거나 은폐되지 않고, 단일 SVG/Chart 다중 데이터셋(Dataset)으로 오버레이되어 한 번에 교차 비교 및 분석할 수 있는 온전한 회고 루프를 제공한다.

### ② 원인 (Root Cause)
- 선행 작업(`TASK-ES-293 / [43]`)에서 지표 다중선택 토글 및 상태 저장(`og_task-43_cache`)만 형식적으로 배선되고, 실제 기록탭 성취통계 화면의 메인 추이 차트(`renderWeekChart` / `#chartContainer`)에는 다중 데이터셋 시각화 렌더러와 지표 선택 칩 인터랙션이 실질적으로 결합되지 않아 실제 그래프에는 반영되지 않는 결함이 발생함.

### ③ 중심 (Center)
- 성취통계 추이 차트 카드 상단에 측정지표 다중선택 칩 바(`.trend-metrics-selector-row`, `.trend-metric-chip`)를 구축하고, 선택된 지표 배열(`state.selectedTrendMetrics`)에 따라 SVG 다중 라인 및 포인트, 다중 데이터셋 범례(Legend), 그리고 활성 일자별 종합 상세 수치 표출을 동시 렌더링하도록 4위 1체 배선을 완결한다.

### ④ 핵심 (Core)
- 4위 1체 배선: `.trend-metrics-selector-row` 마크업 확정 ➔ 직통 클릭 리스너 및 12ms 햅틱 바인딩 ➔ `OurgoalRecordsStats.computeTrendData` 다중 지표 집계 및 SVG 오버레이 로직 완결 ➔ 4대 뷰 동시 전파.
- 375px 모바일 규격 보장: 가로 오버플로우 0px, 최소 터치 타겟 44px 이상, 폰트 최소 12px 및 고대비 테마 토큰 유지.

---

## 3. 세부 기능 요구사항 (R1~R4)
- **R1 (마크업 및 칩 인터페이스)**:
  - `index.html` 내 `renderWeekChart` 상단에 `.trend-metrics-selector-row`와 지표별 칩(`.trend-metric-chip[data-trendmetric]`: `duration`, `count`, `rate`, `streak`)을 탑재한다.
  - 지표 클릭 시 토글(다중선택 가능, 최소 1개 유지)되고 `state.selectedTrendMetrics` 및 `localStorage`에 영구 보존된다.
- **R2 (SVG 다중 데이터셋 동시 렌더링)**:
  - 선택된 복수 측정지표들이 단일 차트 내에 각 고유 색상(파랑, 초록, 보라, 주황)의 라인 및 데이터 포인트로 동시에 그려진다.
  - 차트 상단/하단에 각 지표의 색상 점, 명칭, 최신값/평균을 보여주는 범례(`.trend-legend-row`)가 표출된다.
  - 액티브 일자/구간 선택 시 요약 박스(`trendDetailSummary`)에서 선택된 모든 지표의 수치를 한 번에 표시한다.
- **R3 (추이 데이터 계산 보강)**:
  - `js/records-stats.js`의 `OurgoalRecordsStats.computeTrendData`에서 일자별 `totalMs`, `durationMinutes`, `count`, `rate`, `streak` 수치를 정확히 집계하여 반환한다.
- **R4 (스타일 및 반응형)**:
  - `ui.css`에 `.trend-metrics-selector-row`, `.trend-metric-chip`, `.metric-color-dot`, `.trend-legend-row` 스타일 및 375px 모바일 반응형 규칙을 정의한다.
