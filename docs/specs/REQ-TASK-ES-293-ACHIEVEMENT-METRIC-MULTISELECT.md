# REQ-TASK-ES-293: 성취통계 측정지표 다중선택 필터링 기능 구현

## 1. 개요 및 상민님 지시 원문
- **티켓 ID**: `#TASK-ES-293` (노션 생각 메모장 `[43]`번)
- **노션 Page ID**: `3de598db-9096-813b-80f8-ec164f714bc5`
- **상민님 지시 원문**:
  > *"성취통계의 측정지표도 다중선택이 가능해야함"*
- **본질 축**: `E2 / 기록 회고 루프 / UX` (성취 통계의 복합 지표 교차 비교 및 심층 회고 지원)

---

## 2. 8원칙 충족 분석 (본질·원인·중심·핵심)

### ① 본질 (Essence)
- 성취통계(기록/통계 탭)에서 사용자가 자신의 루틴 실천, 목표 달성률, 체크인 기록 등 다양한 측정지표를 2개 이상 동시 선택(다중선택)하여 교차 분석하고 한눈에 비교 회고할 수 있는 분석 루프를 제공한다.

### ② 원인 (Root Cause)
- 기존에는 한 번에 1개의 지표만 단일 라디오/버튼 형태로 선택 가능하여, 상관관계가 있는 지표들(예: 달성률과 실천시간, 스트릭과 완료건수 등)을 복합적으로 비교하기 어려워 회고의 깊이가 제한되었음.

### ③ 중심 (Center)
- 성취통계 측정지표 다중선택 토글 및 상태 관리(`selected_metrics`)를 지원하고, 직통 핸들러 `handle성취통계_Item43Action(event)` 및 다중선택 헬퍼 `toggleAchievementMetricFilter(metricKey, currentSelected)`를 통해 4위 1체 배선을 완결한다.
- `#og-task-43-container` 및 `#og-task-43-action-btn`을 마운트하여 다중선택 필터링 파이프라인 및 상태 원장 저장을 4위 1체로 제공한다.

### ④ 핵심 (Core)
- 4위 1체 배선: `#og-task-43-container` 마크업 확정 ➔ 직통 `handle성취통계_Item43Action` 이벤트 리스너 바인딩 ➔ 로컬 캐시 및 영구 원장 트랜잭션(`og_task-43_cache`) ➔ 12ms 햅틱 및 시각 토스트 피드백 완결.
- 4대 뷰 동시 전파: 측정지표 다중선택 필터링 갱신 시 `renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen` 원자적 호출.
- 375px 모바일 규격 보장: 가로 오버플로우 0px, 최소 터치 타겟 44px 이상, 폰트 최소 12px 고대비 유지.

---

## 3. 세부 기능 요구사항 (R1~R5)
- **R1**: `index.html` 내에 `#og-task-43-container`와 `#og-task-43-action-btn` 4위 1체 마크업 마운트.
- **R2**: `js/components.js`에 `handle성취통계_Item43Action(event)` 직통 핸들러 구현 및 export (`window.handle성취통계_Item43Action`, `module.exports.handle성취통계_Item43Action`).
- **R3**: 12ms 햅틱 피드백(`navigator.vibrate(12)`), 디바운스, `og_task-43_cache` 원자적 저장 및 4대 뷰 동시 전파 연동.
- **R4**: `ui.css`에 44px 이상 터치 규격 및 375px 모바일 뷰포트 0px 오버플로우 방어 스타일 적용.
- **R5**: 단위 테스트(`tests/achievement-metric-multiselect.test.js`) 및 스모크 테스트 단언문 전수 ALL PASS.
