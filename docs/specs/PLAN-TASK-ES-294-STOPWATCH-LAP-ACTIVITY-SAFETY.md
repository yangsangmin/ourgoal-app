# PLAN-TASK-ES-294: 스톱워치 실시간 구간별 활동기록 팝업·상세 연동 및 초기화 2중 확인 안전장치 구축

## 1. 아키텍처 및 설계 원칙
- **원칙**: 헌법 제2조 2중 8원칙 (마크업 - 리스너 - 로직 - 피드백 4위 1체 배선) 및 헌법 제7조 제8항 (375px 모바일 시각 규격).
- **대상 파일**:
  - `index.html`: `#og-task-44-container` 및 `#og-task-44-action-btn` 마크업 마운트.
  - `js/components.js`: `handle기록스톱워치_Item44Action(event)` 구현 및 4대 뷰 동시 전파.
  - `ui.css`: 44px 최소 터치 영역, 375px 0px 오버플로우 방어 스타일 정의.
  - `tests/stopwatch-lap-activity-safety.test.js`: 단위 테스트 작성.
  - `scripts/smoke-test.js`: 스모크 테스트 단언문 추가.
  - `reports/TASK-ES-294/claims.json`: GitHub 법정 claims 작성.

---

## 2. 세부 실행 계획 (5단계)

### 단계 1: UI 마크업 마운트 (`index.html`)
- 기록/스톱워치 섹션에 `#og-task-44-container` 및 `#og-task-44-action-btn` 마운트.
- 상태 배지(`#og-task-44-container-badge`) 및 구간 기록 팝업 연동 표시.

### 단계 2: 비즈니스 로직 및 4위 1체 배선 (`js/components.js`)
- `handle기록스톱워치_Item44Action(event)` 직통 핸들러 구현.
- 12ms 햅틱, 디바운스, 로컬 캐시 `og_task-44_cache` 원자적 갱신 (`lap_activity_modal: true`, `safety_reset_guard: true`).
- 4대 뷰 동시 전파: `renderCalendar()`, `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()`.

### 단계 3: 스타일링 및 반응형 (`ui.css`)
- `#og-task-44-container`: 카드형 스타일, `box-sizing: border-box`, `max-width: 100%`.
- `#og-task-44-action-btn`: `min-height: 44px`, `min-width: 44px`, 13px 고대비 폰트, 모바일 터치 피드백.
- `.lap-activity-safety-badge`: 안전장치 전용 고대비 배지 스타일.

### 단계 4: 검증 및 테스트
- 단위 테스트 `tests/stopwatch-lap-activity-safety.test.js` 작성 및 통과 검증.
- `scripts/smoke-test.js`에 단언문 추가 후 412개 전수 ALL PASS 확인.

### 단계 5: GitHub Court 심사 청구 및 머지
- `reports/TASK-ES-294/claims.json` 작성 (정확한 규격).
- 사전 점검(`npm run court:quick`), git commit & push, PR 생성, court 심사 통과 후 squash 머지.
