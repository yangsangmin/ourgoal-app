# 엔지니어링 작업계획서 (PLAN) — 오늘의 미션 및 AI 피드백 조건부 호출 최적화 (API 낭비 방지)

> **문서 ID**: PLAN-TASK-ES-264-AI-CONDITIONAL-CALL-OPTIMIZATION  
> **요구사항 연계**: [REQ-TASK-ES-264-AI-CONDITIONAL-CALL-OPTIMIZATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-264-AI-CONDITIONAL-CALL-OPTIMIZATION.md)  
> **티켓 연계**: #TASK-ES-264 (노션 생각 메모장 [07]번, Page ID: `3dc598db-9096-81cc-8791-d6712eedec15`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 목표/기록 변동이 없을 때 앱 새로고침 시 `/api/todaymission` 및 `/api/goalstatus` 불필요 API 호출 100% 억제 및 로컬 캐시 즉시 렌더링.
  - 날짜 변동(한국시간 KST 00:00 자정 기준, 해외 사용자는 해당 국가 표준시 자정 기준) 시 신규 날짜 미션/조언 재호출 허용.
  - 목표 변동(목표 수정, 마일스톤 완료/수정, 세부할일 체크) 및 기록 변동 발생 시 즉시 캐시 무효화 및 새 목표 상태를 반영한 미션/피드백 재호출.
  - 앱 실행 중 자정 경과 또는 백그라운드 복귀(`visibilitychange`, `focus`) 시 날짜 롤오버 능동 감지 및 자동 동기화.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `getEffectiveStandardDateKey`, `renderTodayMissionCard`, `refreshGoalStatusSummary`, 자정 롤오버 감지기 배선.
  - `docs/rules/TICKETS.md`: `#TASK-ES-264` 티켓 등록.
  - `tests/ai-conditional-call-optimization.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: `#TASK-ES-264` 검증 단언문 추가.
  - `reports/TASK-ES-264/claims.json`: GitHub Court 심사 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 낭비 0%와 최신성 100%를 양립시키는 결정론적(Deterministic) 캐시 무효화 및 글로벌 표준 시간대 연동 엔진.
- **[원인] (Technical Causes)**:
  - 캐시가 목표 상태 해시를 결속하지 않아 목표 변경 시 무효화되지 않고, 날짜 계산이 로컬 시간에만 의존하여 KST/해외 표준시 자정 기준이 일관되지 못함.
- **[중심 배선] (Core Wire & State)**:
  - `getEffectiveStandardDateKey(nowISO())` ➔ 날짜 일치 여부 확인.
  - `computeGoalStatusHash(goal)` ➔ 목표 변경 여부 확인.
  - `m.date === today && m.hash === currentGoalHash && m.text` ➔ 캐시 완벽 적중 시 API 차단.
  - 불일치 시 ➔ `requestTodayMission(goal)` 호출 ➔ 캐시 갱신 및 4대 뷰 원자적 전파.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 오프라인 상태나 API 장애 시 로컬 룰베이스 미션 및 조언으로 100% 자가 치유.
  - 중복 호출 방지를 위한 `state.todayMissionPending[goal.id]` 및 `state.goalStatusPending[goal.id]` 락.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | getEffectiveStandardDateKey 및 조건부 호출 캐시 최적화 | +45줄 | -10줄 | +35줄 | 코어 로직 고도화 |
| `tests/ai-conditional-call-optimization.test.js` | 신규 단위 검증 스위트 신설 | +120줄 | 0줄 | +120줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서 갱신 |
| `reports/TASK-ES-264/claims.json` | 법정 심사 청구서 | +90줄 | 0줄 | +90줄 | 법정 청구 |

---

## 4. [원칙 ④] 세부 계획 수립 및 헌법 8원칙 준수 (Detailed Planning)
- 승인선 5대 영역 해당 없음 (기존 기능 삭제 없음, 비파괴 호환).
- 헌법 제3조 제2항 가짜 실제구현 영구 금지 (실제 캐시 및 타임존 계산).
- 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.

---

## 5. [원칙 ⑤] 리스크 검토 및 회귀 방지 (Risk Analysis & Regression Prevention)
- **리스크**: 기존 `state.profile.settings.todayMissions`에 `hash`가 없는 과거 데이터 호환성.
  - **대응**: `m.hash`가 없는 경우 최초 1회 해시를 부여하거나 유효 텍스트가 있으면 안전하게 재활용하여 불필요 호출을 방지.

---

## 6. [원칙 ⑥] 절차 재검증 계획 및 완료 조건 (Re-verification Plan & Definition of Done)
1. `tests/ai-conditional-call-optimization.test.js`:
   - 무변경 새로고침 시뮬레이션: API 호출 0회 확인.
   - 목표 변경 시뮬레이션: 해시 변동 감지 및 API 호출 트리거 확인.
   - 자정 롤오버 시뮬레이션: 날짜 변동 감지 및 API 호출 트리거 확인.
   - 타임존 계산 검증: KST 및 주요 해외 타임존(NY, London 등) 00:00 자정 날짜 정확성 검증.
2. `node scripts/smoke-test.js`: 382개 검사 ALL PASS.
3. `node scripts/verify-integrity-gate.js`: 38개 헌법 게이트 ALL PASS.
4. `node C:/dev/command-center/lib/tri-sync.js check`: 100% 무결 확인.

---

## 7. [원칙 ⑦] 구현 파일 범위 및 회귀 방지 (Target Files & Safety)
- `index.html`: `getEffectiveStandardDateKey`, `renderTodayMissionCard`, `refreshGoalStatusSummary`, `setupDateRolloverWatcher`.
- `tests/ai-conditional-call-optimization.test.js`: 신규 단위 테스트 스위트.
- `scripts/smoke-test.js`: `#TASK-ES-264` 준수 검증 추가.
- `docs/rules/TICKETS.md`: `#TASK-ES-264` 티켓 등록.
- `reports/TASK-ES-264/claims.json`: 법정 주장서.

---

## 8. [원칙 ⑧] 본질 측정 및 사후 모니터링 (Essence Metrics & Review)
- 무변경 새로고침 시 API 호출 절감률: 100% (낭비 0건).
- 날짜 변동(KST 00:00 / 로컬 00:00) 시 새 미션 정상 호출율: 100%.
- 목표 변동(마일스톤/할일) 시 해시 불일치 감지 및 갱신 성공률: 100%.
- `smoke-test.js` 382개 검증 통과율: 100%.

