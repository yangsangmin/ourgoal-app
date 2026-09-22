# 엔지니어링 작업계획서 (PLAN) — 동시 접속 급증 대비 Gemini API 분당 쿼터(Rate Limit 429) 방어 및 백오프 큐 구축

> **문서 ID**: PLAN-TASK-ES-225-GEMINI-QUOTA-BACKOFF  
> **요구사항 연계**: [REQ-TASK-ES-225-GEMINI-QUOTA-BACKOFF](REQ-TASK-ES-225-GEMINI-QUOTA-BACKOFF.md)  
> **티켓 연계**: #TASK-ES-225  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity 분산 시스템 서킷 브레이커 & 고가용성 API 엔지니어  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - Gemini API의 분당 호출 한도(429 Too Many Requests) 및 트래픽 폭주에 대비하여, 요청 큐, 지수 백오프(1초->2초->4초) 재시도 및 30종 맞춤 프리미엄 로컬 폴백 엔진을 구축하여 0.3초 무중단 응답을 보장함.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-225 등록 및 상태 갱신
  - `docs/specs/REQ-TASK-ES-225-GEMINI-QUOTA-BACKOFF.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-225-GEMINI-QUOTA-BACKOFF.md`: 작업계획서
  - `reports/TASK-ES-225/claims.json`: 법정 5대 검증 청구서
  - `index.html`:
    - `GeminiQuotaDispatcher` 구축 (지수 백오프, RPM 관리, 30종 프리미엄 로컬 풀)
    - `requestGeminiFeedback` 및 `requestServerAIFeedback` 연동
  - `api/feedback.js`: 429 감지 및 백오프/스마트 폴백 안전망
  - `scripts/smoke-test.js`: TASK-ES-225 회귀 방지 검증 단언문

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 외부 인프라의 일시적 장애나 쿼터 제한(429)이 발생하더라도 클라이언트 경험을 100% 무중단으로 수호하는 서킷 브레이커 및 프리미엄 로컬 AI 엔진.
- **[원인] (Technical Causes)**:
  - 기존에는 429 상태코드에 대한 지수 백오프 스케줄러가 없고 단순 에러로 처리되어 유저에게 안내가 부족했음.
- **[중심 배선] (Core Wire & State)**:
  - `GeminiQuotaDispatcher.execute`: API 호출 가로채기 및 상태코드 감시
  - `PREMIUM_FEEDBACK_CATALOG`: 30종 상황별 정밀 피드백 풀 (운동, 공부, 사업, 멘탈, 루틴 등)
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 429 감지 시 지수 백오프(1s -> 2s -> 4s, 최대 3회) 후 쿼터 회복 시 정상 반환, 지속 실패 시 즉시 30종 프리미엄 로컬 피드백으로 0.3초 내 전환 및 토스트 안내.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[체크인 AI 요청] -> [GeminiQuotaDispatcher] -> [API 호출] -> [429 감지?] --(Yes)--> [1s/2s 백오프 재시도] --(실패 시)--> [30종 프리미엄 로컬 피드백 0.3초 렌더링 & 토스트 안내]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | #TASK-ES-225 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `index.html` | GeminiQuotaDispatcher 및 30종 카탈로그 구축 | +120줄 | -5줄 | +115줄 | 서킷 브레이커 |
| `api/feedback.js` | 429 백오프 안전망 보강 | +25줄 | -2줄 | +23줄 | 서버 안전망 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 | +25줄 | 0줄 | +25줄 | 테스트 보강 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - AI 코칭 카드 및 피드백 슬롯 고유 클래스 완벽 유지.
2. **이벤트 리스너 (Listener)**:
   - 체크인 및 AI 요청 디스패처 완전 바인딩.
3. **비즈니스 로직 (Logic)**:
   - `GeminiQuotaDispatcher` 지수 백오프 스케줄러 및 30종 프리미엄 카탈로그.
4. **피드백 & 예외처리 (Feedback)**:
   - 429 발생 시 "AI 응답량이 많아 고품질 추천 엔진으로 즉시 보답해 드렸습니다 ✨" 토스트 및 0.3초 렌더링.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 정상적인 Gemini 응답은 100% 동일하게 통과하는가?
- [x] 429 모의 에러 시에도 무중단으로 피드백이 생성되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `docs/rules/TICKETS.md`에 #TASK-ES-225 등록.
2. **Step 2**: `reports/TASK-ES-225/claims.json` C1~C5 작성.
3. **Step 3**: `index.html`에 `GeminiQuotaDispatcher` 및 30종 프리미엄 카탈로그 구축.
4. **Step 4**: `requestGeminiFeedback` 및 `requestServerAIFeedback`에 429 백오프 디스패처 배선.
5. **Step 5**: `api/feedback.js`에 429 안전망 보강.
6. **Step 6**: `scripts/smoke-test.js` 단언문 추가 및 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 모든 피드백 수신 버튼 정상 작동.
- **시나리오 B (Zero Data Loss)**: 생성된 피드백이 체크인 레코드 원장에 100% 영구 보존.
- **시나리오 C (Zero UX Regression)**: 정상 환경에서는 고품질 Gemini 피드백 표출.
- **시나리오 D (Full State Propagation)**: 피드백 생성 즉시 홈 및 기록 화면에 동시 전파.
- **시나리오 E (자동화 게이트 통과)**: 429 모의 주입 시 0.3초 무중단 렌더링 및 `npm test` ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~6 순차적 완결
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] PR 생성 및 Notion [95] 완료 갱신

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 과도한 백오프로 인한 타임아웃 -> **대책**: 클라이언트 1회 백오프(1초) 후 여전히 429일 경우 지체 없이 프리미엄 로컬 엔진으로 0.3초 즉시 전환.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html api/feedback.js` 즉시 원복.
- **재검증 트리거**: 429 발생 시 빈 객체 반환이나 멈춤 현상 발생 시 즉시 원칙 ⑤로 회귀.
