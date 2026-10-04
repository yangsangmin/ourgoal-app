# 구현 계획서 (PLAN) — TASK-ES-348 실제 사용자 AI 오분류 제거 + AI 표시 없는 가짜 사람 정직화 (COMM-01)

> **문서 ID**: PLAN-TASK-ES-348-REAL-USER-AI-BADGE
> **요구사항**: `docs/specs/REQ-TASK-ES-348-REAL-USER-AI-BADGE.md`
> **작업 일시**: 2026-10-04
> **브랜치**: `feat/2026-10-04-task-es-348-real-user-ai-badge`

## 1. [원칙 ① 목표 정의]

- [x] 실제 회원이 흔한 닉네임 때문에 AI 로 빠지지 않게 하고, 화면의 AI 요소는 배지, 값 없는 수치는 숨김.

## 2. [원칙 ② 현상 분석 — 본질·원인·중심·핵심]

- [x] 본질: 사람 여부를 이름으로 추측. 원인: KNOWN_AI_BOT_NAMES 실명형 항목 + 닉네임 정확 일치 판정 + isAiBot 저장. 중심: isKnownAiCompanion 하나가 동반자·DM·동기화 필터를 결정. 핵심: 데이터에 있는 표식으로 판별.

## 3. [원칙 ③ 원인 추정]

- [x] REQ 3절 1~6(이름 목록, 동류 러너 하드코딩, 마니또 시드 수치, 피드 거짓 라벨, active_real_users 25, 오프라인 예시 회원·가짜 히트맵).

## 4. [원칙 ④ 대안 탐색]

- [x] A(이름 목록 전면 삭제) / B(표식 우선 + 페르소나 핸들 정확 일치 AND 비인증 id) — B 선택. 서버 칸 불필요(서버에 AI 계정 없음) → SQL 미추가.

## 5. [원칙 ⑤ 실행 계획]

- [x] js/team-invite-comm.js: `isKnownAiCompanion`·`hasAiIdMarker`·`isAuthUuid`, 호출부 6곳의 별도 `isAiBot` 검사 제거, 자가 치유 양방향, 팀 영입 검색 'AI 예시' 배지, 영입 시 isAiBot 표식 판정, 연속일수 기본값 1 → 0/숨김, 프로필 히트맵 d%3 제거, active_real_users null, isKnownAiCompanion 내보내기.
- [x] index.html: `getPeerRunnersForCategory`(FEED_POSTS_CACHE 실원장), `#firstCheckinPeerRunners` 0명이면 미렌더, 마니또 시드 달성률·연속일수 제거·게이지 조건부, 받은 응원함·웰컴 응원 AI 배지, 피드 단계 라벨.
- [x] js/components.js: active_real_users null.

## 6. [원칙 ⑥ 절차 재검증 및 반론 격파]

- [x] 반론 1(예전 AI 동반자가 실 사용자로 보임) — 예전 시드는 id 표식이 있다. 반론 2(UUID 의 isAiBot 무시로 진짜 AI 놓침) — AI 는 인증 UUID 가 없고 서버 is_ai 는 그대로 존중. 800줄 상한: js/team-invite-comm.js 4137→4135.

## 7. [원칙 ⑦ 즉시 실행]

- [x] 구현, 하네스 docs/design/harness/comm-ai-identity-check.js, 단위 시험 tests/comm-ai-identity-es348.test.js.

## 8. [원칙 ⑧ 성과 측정]

- [x] 헤드리스 M1~M4·피드 라벨, 단위 시험 5건, npm test 종료코드 — PR 본문·dev_log 인용. 레벨 5(실계정 2개)는 미확인.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.

## 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 코드]
- [x] [4단계: 심사 청구] — PR 생성
