# PLAN-TASK-ES-284: 오늘의 퀘스트 미션 변경 ('핵심 마일스톤 1개' -> '할일 1개' 실행 및 10EXP 보상 조정) 구현 계획서

- **문서 버전**: v1.0.0
- **작성일시**: 2026-09-26 KST
- **대상 티켓**: `#TASK-ES-284` (노션 생각 메모장 `[33]`번, Page ID: `3de598db-9096-81e2-97e5-fe7e55117aad`)
- **본질 축**: `E1 / RPG / UX` (일일 몰입 루프 진입장벽 완화 및 보상 밸런싱)

---

## 1. [원칙 ①] 구현 목표 및 아키텍처 개요 (Architecture & Objective)
- **핵심 목표**:
  - 오늘의 3대 퀘스트 2번 미션을 '할일 1개 완료'로 명시하고 +10 EXP 보상 지급 로직 완결.
  - `js/components.js`에 직통 액션 핸들러 `handle홈탭_Item33Action(event)`를 구축하고 12ms 햅틱, 디바운스, `og_task-33_cache` 원자적 영속화, 4대 뷰 동시 전파를 배선.
  - `index.html` 홈 화면에 `#og-task-33-container` 및 `#og-task-33-action-btn` 4위 1체 마운트.
  - `ui.css`에 44px 터치 규격 및 375px 모바일 반응형 스타일 배선.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 데일리 퀘스트 난이도 완화(할일 1개)와 +10 EXP 보상 조정을 통한 일일 실천 루프 강화.
- **[원인] (Technical Causes)**: 기존 마일스톤 단위 퀘스트의 높은 허들로 인한 신규/데일리 유저 실천 진입장벽.
- **[중심 배선] (Core Wire & State)**:
  - `handle홈탭_Item33Action`: 직통 트랜잭션 핸들러.
  - `og_task-33_cache`: 로컬 캐시 영속화 키.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 4대 뷰 동시 전파(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`), 12ms 햅틱, 디바운스 버튼 잠금.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[할일 완수/액션 클릭] -> [12ms 햅틱 & 디바운스 락] -> [오늘의 퀘스트 2번 완료] -> [10 EXP 적립 및 캐시 영속화] -> [4대 뷰 동시 전파]`

---

## 3. [원칙 ③] 상태 관리 및 데이터 흐름 (State & Data Flow)
- **로컬 캐시 키**: `og_task-33_cache`
- **저장 페이로드**:
  ```json
  {
    "ticket": "33",
    "updated_at": "ISO8601_TIMESTAMP",
    "quest_target": "todo_1",
    "exp_reward": 10,
    "state": "completed"
  }
  ```
- **전파 경로**: 액션 클릭 ➔ 캐시 원자적 저장 ➔ 성공 토스트 ➔ 4대 뷰(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 동시 호출.

---

## 4. [원칙 ④] 비기능적 구현 가이드라인 (Non-Functional Guidelines)
- 기존 코드 불필요 변경 금지 (하위 호환성 100% 보존).
- 테스트 코드 내 `process.exit(1)` 사용 절대 금지 (`throw err` 패턴 사용).
- `assert.ok` 단언문 엄격성 유지.

---

## 5. [원칙 ⑤] 예외 대응 및 회복 전략 (Error Handling)
- 비동기 에러 발생 시 콘솔 로깅 및 사용자 대상 안내 토스트 표출.
- 로컬 스토리지 예외 시 메모리 폴백 및 디바운스 버튼 잠금 해제(`finally`).

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
1. **단위 테스트**: `node tests/quest-task-exp.test.js` ➔ 정상 종료 (exit 0).
2. **스모크 테스트**: `node scripts/smoke-test.js` ➔ 402개 전수 통과.
3. **헌법 게이트**: `node scripts/verify-integrity-gate.js` ➔ 38대 게이트 ALL PASS.
4. **법정 예비 점검**: `node court/claims.js reports/TASK-ES-284/claims.json` ➔ 0에러 정합성 통과.
5. **로컬 법정 빠른 점검**: `npm run court:quick -- --head HEAD` ➔ 심사 전 막을 이유 없음 통과.

---

## 7. [원칙 ⑦] 배포 및 심사 파이프라인 (Deployment Pipeline)
- Git 커밋 태그: `[E1] #TASK-ES-284 feat: 오늘의 퀘스트 미션 변경 ('핵심 마일스톤 1개' -> '할일 1개' 실행 및 10EXP 보상 조정) 완결`
- 원격 푸시 ➔ GitHub PR 오픈 ➔ GitHub Court 자동 심사 ➔ 통과 확인 ➔ squash 머지.

---

## 8. [원칙 ⑧] 3자 동기화 종결 계획 (Tri-Sync Closure)
- `TICKETS.md` 완료 갱신 PR 머지.
- 노션 DB `[33]`번 `완료` (200 OK) 반영.
- 관제센터 저널 `task_done` 이벤트 적재.
- `node C:/dev/command-center/lib/tri-sync.js check` 무결성 100% 확인.
