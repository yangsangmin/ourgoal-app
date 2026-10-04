# 작업계획서 (PLAN) — 탈퇴 신청 30일 후 계정·데이터 영구 파기

> **문서 ID**: PLAN-TASK-ES-351-ACCOUNT-PURGE
> **티켓 연계**: #TASK-ES-351
> **요구사항**: docs/specs/REQ-TASK-ES-351-ACCOUNT-PURGE.md
> **작성 일시**: 2026-10-04

---

## 1. [원칙 ①] 목표 정의
- [x] 탈퇴 신청 30일 뒤 계정·데이터가 서버에서 실제로 파기되고, 앱·방침·약관이 그 동작과 문장별로 같다.

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심
- [x] 본질: 서버 기록·매일 실행기·재조회 검증이 없음. 원인: 기기 표시·user_metadata 만 기록, purge 무검증·호출처 0, 복구 창 기기 의존, 고지 과장. 중심: app_metadata `deletion_requested_at` 한 칸. 핵심: 꺼진 예약·dry-run·계정 단위 원자적·재조회 0·상한 50·목록 밖 외래키 거부·API 호출 불가·기록에 개인정보 없음.

## 3. [원칙 ③] 원인 추정
- [x] `submitWithdrawAccount`(index.html), `checkPendingDeletionRestore`(js/auth-safety.js), `api/withdraw.js` purge 분기, vercel.json 크론 없음(동결).

## 4. [원칙 ④] 대안 탐색
- [x] A안 pg_cron + pg_net → API purge: 비밀값 2곳, HTTP 중간 실패 시 반쯤 삭제 — 기각. B안 SQL 함수(SECURITY DEFINER) + pg_cron: 계정 단위 트랜잭션, 외부 통신 0 — 채택.

## 5. [원칙 ⑤] 실행 계획
- [x] `api/withdraw.js` request/restore(재조회 확인)·purge(#357)·대상 목록.
- [x] `index.html` `submitWithdrawAccount`·탈퇴 창 문구·`showLegalModal`; `js/auth-safety.js` 서버 기록 기준 복구 판정.
- [x] `docs/sql/2026-10-04-account-purge-*.sql`·README·PGlite 시험.
- [x] `docs/legal/privacy.md`·`terms.md`.
- [x] `scripts/test-account-purge.js`·`scripts/smoke-test.js`·`tests/account-withdrawal-modal.test.js`.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- [x] 반론 1 "옛 신청자도 지워진다" → app_metadata 만 대상, PGlite [2] `legacy_pending` 건수만.
- [x] 반론 2 "반쯤 지워진다" → 하위 트랜잭션, PGlite [4]·[5].

## 7. [원칙 ⑦] 즉시 실행
- [x] 구현 · `node scripts/test-account-purge.js` 13/13 · PGlite 39/39 · `npm test`.

## 8. [원칙 ⑧] 성과 측정
- [x] 측정값은 dev_log.md 와 PR 본문(판정 아님).
- [x] [4단계: 심사 청구] PR 생성 및 법정 실행 기록.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
