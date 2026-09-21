# 엔지니어링 작업계획서 (PLAN) — 치명 버그 24시간 SLA 가동 및 피드백 DB 리드타임 기록

> **문서 ID**: PLAN-T014-FEEDBACK-SLA
> **티켓 연계**: #T014
> **작성 일시**: 2026-09-21
> **작성자**: Claude 세션 ed8d3976
> **규범 준수**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 제2조 2중 8원칙

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**: 기존 노션 문의 원장을 피드백 DB 로 확장하고, 분류·수정 기록·SLA 점검 도구와 런북을 둔다. 앱 런타임 코드는 바꾸지 않는다.
- **영향받는 파일 전수 목록**:
  1. `scripts/feedback-sla.js` (신규): SLA 도구.
  2. `docs/growth/feedback-sla-runbook.md` (신규): 운영 런북.
  3. `docs/specs/REQ-T014-FEEDBACK-SLA.md`, `docs/specs/PLAN-T014-FEEDBACK-SLA.md` (신규).
  4. `docs/rules/TICKETS.md`: #T014 등재.
  5. `dev_log.md`: 작업 기록.
- **저장소 밖 변경**: 노션 원장 data_source `3dd598db-9096-8198-a997-000b70d737e7` 속성 8개·유형 옵션 3개 추가.

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence & Core Wiring)
- **[본질]**: 신고가 고쳐질 때까지 시계가 보이게 한다.
- **[원인]**: 접수 배선에 분류·종결 칸이 없었다.
- **[중심]**: `[/api/inquiry 또는 feedback-sla add] → [노션 원장] → [triage: 심각도] → [resolve: 수정 배포일시·링크] → [수식: 리드타임(시간)·SLA 판정] → [check]`
- **[핵심]**: 운영 API 가 쓰는 속성명·옵션명 불변. 추가만 한다.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
| 파일 | 예산 | 내용 |
| :--- | :--- | :--- |
| `scripts/feedback-sla.js` | 신규 약 260줄 | 외부 의존 없음(Node 내장 fetch). 동적 스키마 검사, 옵션 사전 대조, 429 재시도, 쓰기 후 왕복 대조 |
| `docs/growth/feedback-sla-runbook.md` | 신규 약 80줄 | 기준·절차·문안 |
| `docs/rules/TICKETS.md` | +1줄 | #T014 |
| `dev_log.md` | +1항목 | 규칙 5 |
| `index.html`·`api/*`·`sw.js` | 0줄 | 변경 없음 → PWA 캐시 버전 갱신 불필요 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Non-Destruction)
- 앱 런타임 파일 변경 0 → PWA·다크모드·동기화·캘린더·Web Push 영향 없음.
- 노션 스키마는 추가만 → `/api/inquiry` 의 `Notion-Version 2022-06-28` + `database_id` 부모 쓰기는 data_source 가 1개인 동안 그대로 동작한다.
- 도구는 토큰을 코드에 두지 않는다. 환경변수 또는 지정한 `.env` 에서만 읽는다.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `origin/main` 에서 격리 워크트리·브랜치 `infra/2026-09-21-t014-feedback-sla` 생성.
2. 노션 속성 추가(일반 속성 → 수식 순서. 수식은 참조 속성이 있어야 한다).
3. `scripts/feedback-sla.js` 작성, `node --check`.
4. 실제 원장에 `check` → 점검 행 `add` → `triage` → (PR 발급 후) `resolve`.
5. 문서 4종·dev_log 작성.
6. `npm test` → 커밋 `[INFRA] #T014 ...` → 푸시 → PR(4블록).

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)
- **문법**: `node --check scripts/feedback-sla.js`.
- **스키마 불변**: 추가 전후 속성 목록 대조, 사라짐 0.
- **옵션 가드**: `triage --severity 치명` → 전송 없이 종료코드 2.
- **왕복**: `add` 직후 제목을 되읽어 보낸 값과 대조(한글 NFC).
- **수식**: 점검 행에서 `진행중 → 준수`, 리드타임(시간) 숫자 되읽기.
- **회귀**: `npm test`(스모크·무결성 게이트·클릭 검증) 수치 인용.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)
- [x] 운영 `/api/inquiry` 생존 확인 (HTTP 400 + 한글 오류 문구)
- [x] 노션 속성 추가 및 되읽기 (9 → 17, 사라짐 없음)
- [x] 도구 작성·문법 검사·실원장 `check`
- [x] 점검 행 add → triage(상) → SLA 판정 `진행중`
- [ ] PR 발급 후 resolve → `준수`·리드타임 되읽기
- [ ] `npm test` 수치 기록, PR 4블록

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)
- **롤백(저장소)**: 브랜치 PR 을 되돌리면 끝난다. 런타임 영향 없음.
- **롤백(노션)**: 추가한 속성 8개를 노션에서 삭제하면 원래 9개 구조로 돌아간다. 기존 행 값은 건드리지 않았다.
- **막힘**: `npm test` 가 본 변경과 무관하게 실패하면 main 기준선과 비교해 같은 실패인지 확인하고 그대로 인용한다.
