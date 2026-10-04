# 구현 계획서 (PLAN) — TASK-ES-352 첫 체크인 축하 창 '웰컴 응원 스탬프' 실제 발송 (COMM-05)

> **문서 ID**: PLAN-TASK-ES-352-WELCOME-STAMP-SEND
> **요구사항**: `docs/specs/REQ-TASK-ES-352-WELCOME-STAMP-SEND.md`
> **작업 일시**: 2026-10-04
> **브랜치**: `feat/2026-10-04-task-es-352-welcome-stamp`

## 1. [원칙 ① 목표 정의]

- [x] `#firstCheckinCommBtn` 이 실제 동류 회원에게 응원을 보내고 보낸 수를 말한다. 못 보내면 거짓 없이 소통 탭 안내.

## 2. [원칙 ② 현상 분석 — 본질·원인·중심·핵심]

- [x] 본질: 껍데기 버튼 + 거짓 토스트 + 공짜 EXP. 원인: 클릭 처리기에 발송 코드 없음. 중심: PR #659 로 보낼 실제 대상이 생김. 핵심: 기존 마니또 응원 형식·기존 받은 응원함에 싣는다.

## 3. [원칙 ③ 원인 추정]

- [x] REQ 3절 1~4(발송 코드 없음, receiver_id 로 응원을 읽는 화면은 마니또 받은 응원함뿐, 마니또 미시작자는 볼 곳 없음, manitoMajors TOPICS 미검증 오류).

## 4. [원칙 ④ 대안 탐색]

- [x] A(DM) / B(마니또 응원 형식 + 시작 전 화면에 받은 응원함) — B 선택. 하루 1회는 결정적 행 id(서버 중복 거절) + 기기 기록.

## 5. [원칙 ⑤ 실행 계획]

- [x] index.html: `canSendFirstCheckinWelcome`·`firstCheckinWelcomeSentToday`·`sendFirstCheckinWelcomeStamps` 신설, `triggerFirstCheckinCelebrationModal` 클릭 처리기·버튼 글자, `renderCommManito` 시작 전 `#manitoPreJoinInbox`, `manitoMajors` TOPICS 거름.
- [x] tests/trio-es143-es145.test.js 거짓 토스트 검사 → 사실 문구 검사.

## 6. [원칙 ⑥ 절차 재검증 및 반론 격파]

- [x] 반론 1(익명 마니또 화면에 실명 응원) — 행 sender_name 을 그대로 보여 주는 기존 화면, 문구로 출처를 밝힘, ping_type·id 접두로 구분. 반론 2(서버 중복 거절 불확실) — 기기 기록이 먼저 막고 23505 는 '이미 보냄'·EXP 없음.

## 7. [원칙 ⑦ 즉시 실행]

- [x] 구현, 측정 도구 docs/design/harness/welcome-stamp-check.js, 법정 시나리오 1개.

## 8. [원칙 ⑧ 성과 측정]

- [x] 헤드리스 M1~M4(origin/main 대조), npm test 종료코드 — PR 본문·dev_log 인용. 레벨 5(실계정 2개)는 미확인.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 코드]
- [x] [4단계: 심사 청구] — PR 생성

## 제안 (축 미확정 — 구현 금지)
- (없음)
