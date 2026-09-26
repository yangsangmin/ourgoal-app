# PLAN-TASK-ES-289: 마니또 AI 동반자 1명 제한 및 실 유저 20명 초과 시 AI 동반자 전원 자동 삭제

## 1. 아키텍처 및 설계 원칙
- **원칙**: 헌법 제2조 2중 8원칙 (마크업 - 리스너 - 로직 - 피드백 4위 1체 배선) 및 헌법 제7조 제8항 (375px 모바일 시각 규격).
- **대상 파일**:
  - `index.html`: `#og-task-39-container` 및 `#og-task-39-action-btn` 마크업 마운트.
  - `js/components.js`: `handle팀목표_Item39Action(event)` 구현 및 4대 뷰 동시 전파.
  - `js/team-invite-comm.js`: `handle팀목표_Item39Action` 연결 및 export 바인딩.
  - `ui.css`: 44px 최소 터치 영역, 375px 0px 오버플로우 방어.
  - `tests/manito-ai-limit.test.js`: 단위 테스트 작성.
  - `scripts/smoke-test.js`: 스모크 테스트 단언문 추가.
  - `reports/TASK-ES-289/claims.json`: GitHub 법정 claims 작성.

---

## 2. 세부 실행 계획 (5단계)

### 단계 1: UI 마크업 마운트 (`index.html`)
- 동반자/팀목표 섹션에 `#og-task-39-container` 및 `#og-task-39-action-btn` 마운트.
- 마니또 풀 내 AI 1명 제한 및 20명 초과 시 전원 삭제 최적화 상태 배지(`#og-task-39-container-badge`) 포함.

### 단계 2: 비즈니스 로직 및 4위 1체 배선 (`js/components.js` & `js/team-invite-comm.js`)
- `handle팀목표_Item39Action(event)` 직통 핸들러 구현.
- 12ms 햅틱, 디바운스, 로컬 캐시 `og_task-39_cache` 원자적 갱신.
- 4대 뷰 동시 전파: `renderCalendar()`, `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()`.

### 단계 3: 스타일링 및 반응형 (`ui.css`)
- `#og-task-39-container`: 카드형 스타일, `box-sizing: border-box`, `max-width: 100%`.
- `#og-task-39-action-btn`: `min-height: 44px`, `min-width: 44px`, 13px 고대비 폰트, 모바일 터치 피드백.

### 단계 4: 검증 및 테스트
- 단위 테스트 `tests/manito-ai-limit.test.js` 작성 및 통과 검증.
- `scripts/smoke-test.js`에 단언문 추가 후 407개 전수 ALL PASS 확인.

### 단계 5: GitHub Court 심사 청구 및 머지
- `reports/TASK-ES-289/claims.json` 작성 (정확한 규격).
- 사전 점검(`npm run court:quick`), git commit & push, PR 생성, court 심사 통과 후 squash 머지.
