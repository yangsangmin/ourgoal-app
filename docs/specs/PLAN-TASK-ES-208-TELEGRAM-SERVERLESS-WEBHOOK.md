# 엔지니어링 작업계획서 (PLAN) — 양비스 옴니채널 24/7 Vercel Serverless Webhook 엔드포인트

> **문서 ID**: PLAN-TASK-ES-208-TELEGRAM-SERVERLESS-WEBHOOK  
> **요구사항 연계**: [REQ-TASK-ES-208-TELEGRAM-SERVERLESS-WEBHOOK](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-208-TELEGRAM-SERVERLESS-WEBHOOK.md)  
> **티켓 연계**: #TASK-ES-208  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity Omnichannel Session  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 데스크탑 전원 여부와 무관하게 24시간 365일 무중단으로 동작하는 Vercel Serverless 기반 텔레그램 Webhook 엔드포인트(`api/telegram.js`)를 신설하여, 안티그래비티급 Pro Thinking(2048) 심층 추론 및 노션 SSOT 100턴 연동을 보장한다.
- **영향 받는 파일 목록 전수**:
  - `api/telegram.js`: [신설] Vercel Serverless Webhook 핸들러 (Node.js).
  - `docs/specs/REQ-TASK-ES-208-TELEGRAM-SERVERLESS-WEBHOOK.md`: [신설] 요구사항 정의서.
  - `docs/specs/PLAN-TASK-ES-208-TELEGRAM-SERVERLESS-WEBHOOK.md`: [신설] 엔지니어링 작업계획서.
  - `reports/TASK-ES-208/claims.json`: [신설] 법정 심사 청구 주장 파일.
  - `test/test-telegram-webhook.js`: [신설] 웹훅 엔드포인트 모의 요청 단위 테스트.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 로컬 프로세스에 종속되지 않는 고가용성(99.99%) 클라우드 서버리스 런타임 상에서 노션 중앙 원장(SSOT)과 Gemini 3.1 Pro Thinking 추론 엔진을 완전 결속하는 인프라 아키텍처.
- **[원인] (Technical Causes)**: 기존 텔레그램 데몬은 로컬 Windows PC에서 실행되어 PC 종료 시 프로세스가 함께 종료되었으며, Vercel 상에 공식 웹훅 리시버가 부재했던 구조적 원인.
- **[중심 배선] (Core Wire & State)**:
  - 노션 `commandInbox` DB (`7f4c892e-9934-4eeb-9576-5d31d39152b5`): 무상태 서버리스 환경에서 100턴 대화 문맥의 영구 복원 및 갱신.
  - 노션 `activityLog` DB (`ebe4de7d-deb7-4389-aa34-dc57221bba8f`): 작업 내역 실시간 1행 기록.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 단독 인가(Chat ID 1260106462) 방화벽, Gemini API 타임아웃 40초 방어 및 Flash 자동 폴백, 텔레그램 메시지 3900자 청킹 안전 분할.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[Telegram Webhook POST] -> [보안 Chat ID 검증] -> [Notion SSOT 100턴 이력 조회] -> [Gemini 3.1 Pro Thinking (2048)] -> [Notion 원장 저장] -> [Telegram 청킹 회신]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `vercel.json` | `/api/telegram` rewrite 라우팅 추가 (12함수 엄수) | +4줄 | 0줄 | +4줄 | 라우팅 설정 |
| `api/track.js` | Telegram Omni Webhook 핸들러 및 Pro Thinking 연동 | +410줄 | 0줄 | +410줄 | 서버리스 핸들러 |
| `reports/TASK-ES-208/claims.json` | 법정 청구 주장 파일 | +45줄 | 0줄 | +45줄 | 법정 규격 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup / Protocol)**: HTTP POST / GET 지원 및 Telegram Bot Webhook 사양 완전 준수.
2. **이벤트 리스너 (Listener / Handler)**: `req.body.message` 파싱 및 비동기 처리 파이프라인.
3. **비즈니스 로직 (Logic)**: Notion DB 쿼리/기록 + Gemini Pro Thinking 추론 (빈 stub 0건).
4. **피드백 & 예외처리 (Feedback)**: 인플레이스 Thinking 알림 회신 및 에러 발생 시 상세 한국어 안내.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 아워골 앱 웹 화면(HTML/CSS/JS) 코드를 일절 건드리지 않아 회귀 위험 0건인가?
- [x] Vercel Serverless Function 배포 규격(Node.js runtime, maxDuration 60)을 준수했는가?
- [x] 노션 SSOT의 기존 데이터 구조(`Telegram-Omni`)와 100% 호환되는가?
- [x] 법정 금고 파일(`.github/*`, `court/*`)을 제품 코드와 분리하여 건드리지 않았는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (엔드포인트 구현)**: `api/telegram.js` 작성 (보안 검증, Gemini Pro Thinking, Notion SSOT, Telegram 청킹 전송).
2. **Step 2 (단위 테스트 작성 및 실행)**: `test/test-telegram-webhook.js` 작성 및 로컬 모의 호출 성공 확인.
3. **Step 3 (법정 주장 파일 작성)**: `reports/TASK-ES-208/claims.json` 작성 (R1~R2, C1~C2 배선).
4. **Step 4 (로컬 통합 무결성 검증)**: `npm test` 실행하여 38개 무결성 게이트 전수 통과 확인.
5. **Step 5 (PR 발의 및 법정 심사 청구)**: 헌법 제6조 제3항 준수 `--reviewer yangsangmin --assignee yangsangmin` 지정 후 Draft PR 생성.
6. **Step 6 (GitHub court 판정 수령)**: `node court/chat.js <PR번호>`로 판정서 확인 및 상민님 보고.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (보안 차단 검증)**: 인가되지 않은 Chat ID(예: 999999)로 요청 시 즉시 차단 메시지 반환 확인.
- **시나리오 B (GET 핑 헬스체크 검증)**: GET 요청 시 `{ ok: true, status: 'alive' }` 정상 응답 확인.
- **시나리오 C (Gemini 폴백 검증)**: Pro 모델 에러 모의 시 Flash 모델 자동 스위칭 확인.
- **시나리오 D (장문 청킹 분할 검증)**: 4000자 초과 응답 시 텔레그램 메시지 분할 전송 로직 검증.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 심사 청구 모드] 초안 PR 발의 및 GitHub 법정(court) 판정서 수령 후 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: Vercel Serverless 실행 시간 60초 초과 위험.
- **사전 방어 및 우회 로직**: Gemini API 타임아웃 40초 강제 및 초과 시 고속 Flash 모델로 자동 폴백하여 60초 이내 무조건 완결.
- **롤백 계획 (Rollback Strategy)**: 단독 신설 엔드포인트이므로 문제 발생 시 브랜치 revert 또는 Vercel 환경변수 제거로 0초 롤백 가능.
- **재검증 트리거**: 단위 테스트 실패 또는 법정 판정 돌려보냄 시 원칙 ①~⑤로 복귀하여 코드 및 설계 즉각 보정.
