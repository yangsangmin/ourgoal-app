# REQ/PLAN — TASK-ES-396 피드 공유 DM 푸시 꼬리표를 DM 화면 전송과 같은 형식으로

> 근거: #701(TASK-ES-382) 빌더 발견 — 피드 공유 DM 의 대화방 id 를 `getDmThreadId`('dm_' 접두)로 바꾼 뒤, 같은 함수의 푸시 꼬리표 `'dm_' + threadId` 가 `dm_dm_…` 로 접두가 겹친다. 코디네이터 지시(2026-10-05).
> 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일: `js/team-share.js` (함수 `openFeedShareModal` 안 `[data-sharecompdm]` 버튼 `onclick` 의 `/api/push-dispatch` 요청 본문 `tag`)
- 비교 기준: `js/team-dm-room.js` DM 화면 전송의 `tag: 'dm-' + threadId`
- 새 시험: `tests/feed-share-dm-push-tag-es396.test.js`
- 대상 DOM: `[data-sharecompdm]`(피드 공유 모달의 동반자 DM 버튼) — 마크업·피드백 변경 0
- R1: 피드 공유 DM 푸시 꼬리표를 `'dm-' + threadId` 로(DM 화면 전송과 같은 형식). 대화방 id·행 저장·버튼/토스트 피드백 변경 0.
- R2: 부품 시험으로 기준 사본 실패 → 작업 통과를 보인다. npm test 결과 기준과 같음.

## 1. [원칙 ①] 목표 정의
같은 1:1 대화방의 푸시 알림이 어느 경로(DM 화면 전송·피드 공유)로 보내든 같은 꼬리표를 갖게 한다. 꼬리표는 브라우저 알림을 묶는 열쇠(Notification tag)라, 형식이 다르면 같은 대화방 알림이 따로 쌓이거나 서로 덮지 못한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 꼬리표 형식이 두 곳에 따로 적혀 있다.
- 원인(측정): `js/team-share.js` 283줄 `tag: 'dm_' + threadId` — threadId 가 이미 `dm_<작은 id>_<큰 id>` 라 `dm_dm_…`. DM 화면(`js/team-dm-room.js` 398줄)은 `tag: 'dm-' + threadId` → `dm-dm_…`.
- 중심: 서버 `api/push-dispatch.js` 는 `req.body.tag` 를 그대로 알림 꼬리표로 쓴다(없으면 `'dm-' + Date.now()`).
- 핵심: 피드 공유 쪽 한 글자(`_` → `-`)를 DM 화면 형식에 맞춘다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- `js/team-share.js` `openFeedShareModal` → `[data-sharecompdm]` `btn.onclick` → `fetch('/api/push-dispatch', …)` 본문 `tag: 'dm-' + threadId`.
- [기본값] 꼬리표 형식은 DM 화면 쪽(`'dm-'`)을 정본으로 따른다 — 사용자가 가장 많이 쓰는 전송 경로이고 서버 기본값도 `'dm-'` 접두다.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A DM 화면 쪽을 `'dm_'` 로 바꿈: 더 자주 쓰는 경로·서버 기본값을 바꾸게 되어 영향이 크다 → 버림.
- B 꼬리표 생성 함수를 키트에 새로 둠: 두 줄짜리 문자열에 새 통로는 과함, 이번 범위(한 줄)를 넘는다 → 버림.
- C 피드 공유 한 줄만 맞춤 → 선택.

## 5. [원칙 ⑤] 절차
1) 기준 `git archive origin/main`(4cf66f0) 스크래치 사본 → 2) 부품 시험 작성, 기준 사본 실행(실패 기록) → 3) `js/team-share.js` 한 줄 수정 → 4) 작업 트리 실행(통과 기록) → 5) npm test 기준·작업 비교 → 6) claims·기록 → 7) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "`dm-dm_…` 도 접두가 두 번 보이니 고친 게 아니다" → 목표는 두 전송 경로의 꼬리표가 같은 것(같은 대화방 알림 묶음)이다. 시험이 DM 화면 쪽 형식(팀 합본의 `tag: 'dm-' + threadId`)과 피드 공유 실제 요청 본문을 함께 재므로, 어느 한쪽만 바뀌면 실패한다. 형식 자체를 바꾸는 일은 두 곳을 같이 바꾸는 별도 작업이다.
- 반론② "가짜 fetch 로 잰 것은 실제 푸시가 아니다" → 이번 변경은 요청 본문 글자 하나이고, 서버는 그 값을 그대로 쓴다(`api/push-dispatch.js` `tag: req.body.tag || …`). 실기기 알림 묶음은 미측정(UNCHECKED)으로 claims 에 남긴다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
`js/team-share.js` 1줄(+1 −1), 새 시험 1개, 기록 파일. 다른 제품 코드 0.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-396/`:
- 부품 시험: 기준 사본 3/5(꼬리표 2건 실패, 실제 값 `dm_dm_…`) → 작업 트리 5/5.
- npm test: 기준 사본·작업 트리 모두 smoke 443개 통과·0개 실패, 종료 0. 로그 차이는 기준 사본에 .git 이 없어 생기는 줄뿐.
- 막히는 지점(발견, 이번 범위 밖): 피드 공유 푸시 요청은 받는 사람을 `receiver_id` 로 보내는데 서버 즉시 발송 분기는 `req.body.targetUserId` 만 본다 — 꼬리표와 별개로 이 요청은 즉시 발송 분기에 들어가지 않는다. 또 서버는 모든 요청에 `Authorization: Bearer <CRON_SECRET 또는 push_dispatch_token>` 를 요구하는데(`isAuthorized`), DM 화면·피드 공유 두 클라이언트 요청 모두 이 머리글을 보내지 않는다(코드 읽기, 실서버 미측정). 별도 작업으로 넘긴다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
