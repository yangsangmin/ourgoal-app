# REQ/PLAN — TASK-ES-397 DM 즉시 푸시 요청이 서버에서 401 로 막히던 결함

> 근거: PR #709(TASK-ES-396) 빌더가 코드 읽기로 남긴 의심 두 가지 — ① 피드 공유 DM 푸시는 받는 사람을 `receiver_id` 로 보내는데 서버 즉시 발송 분기는 `targetUserId` 만 읽는다 ② 서버 `isAuthorized` 는 `Authorization: Bearer` 를 요구하는데 두 앱 요청 모두 이 머리글이 없다. 코디네이터 지시(2026-10-05): 먼저 실측, 맞으면 고친다.
> 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0.

## REQ
- 대상 파일·함수
  - `js/team-dm-room.js` `renderCommDM` 안 `send()` — `#dmSend` 전송 뒤 `/api/push-dispatch` 요청
  - `js/team-share.js` `openFeedShareModal` → `[data-sharecompdm]` `btn.onclick` — 피드 공유 DM 뒤 `/api/push-dispatch` 요청
  - `api/push-dispatch.js` `handler` 즉시 발송 분기 + 새 함수 `authorizeDmSender`·`clip`·`safeAppPath`
  - 토큰 통로: `js/tabs/comm/dm-ledger.js` `OurgoalDmLedger.getAuthToken`(#680·TASK-ES-366 `trackPost` 선례, 이미 공개된 함수 — 변경 0)
- 대상 DOM: `#dmInput`·`#dmSend`(대화방 전송), `[data-sharecompdm]`(피드 공유 모달 동반자 DM 버튼) — 마크업·토스트 피드백 변경 0
- 새 시험: `tests/dm-push-auth-es397.test.js`(npm test 경로 `scripts/test-shipyard-modular.js` Test 6 에 등록)
- 실측 도구: `docs/design/harness/real-account-dm-push.js`
- R1: 두 앱 요청 모두 로그인 세션 Bearer 를 붙이고, 받는 사람 칸은 서버가 읽는 `targetUserId` 하나로 보낸다. 토큰이 없으면 보내지 않는다.
- R2: 서버 즉시 발송 분기가 로그인 사용자 요청을 받되 인증을 약화하지 않는다 — 실제 사용자 토큰 + 방금(10분) 그 상대에게 보낸 DM 행이 있을 때만 발송, 자기 자신·가짜 토큰·토큰 없음은 거절, 정기 발송(크론) 분기는 예전처럼 비밀값만.
- R3: 부품 시험으로 기준 사본 실패 → 작업 통과, npm test 결과 기준과 같음. 실계정 실측 전후 기록.

## 1. [원칙 ①] 목표 정의
A 가 B 에게 DM(대화방 전송·피드 공유)을 보내면 B 의 구독 기기로 푸시가 실제로 나가게 한다. 지금은 B 가 앱을 열어야만 메시지를 안다.

## 2. [원칙 ②] 본질·원인·중심·핵심
실측(로컬 127.0.0.2 앱 사본 + /api 운영 전달, 테스트 계정 A·B, `reports/TASK-ES-397/live-base.json`):
- 대화방 전송 요청: Authorization 없음, 본문 `targetUserId` = B → **401** `unauthorized: missing bearer token`
- 피드 공유 요청: Authorization 없음, 본문 `receiver_id` = B(`targetUserId` 없음) → **401** `unauthorized: missing bearer token`
- 참고 요청(로그인 세션 토큰을 붙이고 `targetUserId` = B): **401** `unauthorized`
- 원인 셋: ① 앱 두 요청에 머리글이 없다 ② 피드 공유는 서버가 읽지 않는 칸 이름을 쓴다 ③ 머리글을 붙여도 서버 `isAuthorized` 는 크론 비밀값(`CRON_SECRET`)·DB 토큰(`push_dispatch_token()`)만 받는다 — 사용자 토큰은 원래 받는 길이 없었다(의심에 없던 세 번째 원인).
- 핵심: 앱만 고치면 여전히 401 이다. 서버가 "이 사용자가 이 상대에게 DM 을 보낸 사람인가"를 확인하는 길이 있어야 한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 앱: `global.OurgoalDmLedger.getAuthToken()` 으로 토큰을 받아 `'Authorization': 'Bearer ' + pushToken` 를 붙이고, 토큰이 없으면 요청하지 않는다. 피드 공유 본문은 `targetUserId: peerId`(+ `url: '/#comm'`), 쓰이지 않던 `sender_name` 칸은 뺀다.
- 서버 `api/push-dispatch.js`: 비밀값 인증이 실패하면 즉시 발송 분기(`POST` + `targetUserId`)에서만 `authorizeDmSender(sb, token, targetUserId)` —
  `sb.auth.getUser(token)` 로 실제 사용자 확인 → 자기 자신이면 403 → `team_ping_replies` 에 `sender_id = 사용자, receiver_id = 상대, created_at ≥ 10분 전` 행이 없으면 403. 통과한 사용자 호출의 알림은 제목 80자·본문 200자·꼬리표 120자로 자르고, 아이콘 고정, 주소는 앱 안 경로(`/` 로 시작, `//` 아님)만.
- 정기 발송 분기는 그대로(사용자 토큰이면 401).
- [기본값] 확인 창(10분): DM 저장(insert) 직후 푸시를 부르므로 몇 초면 충분하나, 기기 시계 차이를 견디도록 10분.
- 캐시: `index.html` 의 `team-share.js`·`team-dm-room.js` 버전 꼬리 `?v=20261005-es397`.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 서버가 사용자 토큰만 확인(관계 확인 없음): 로그인만 하면 아무에게나 임의 문구 푸시 가능 → 인증 약화, 버림.
- B 비밀값을 앱에 넣음: 비밀값 유출 → 버림.
- C 서버가 DM 행 저장 시점(DB 트리거·pg_net)에 직접 발송: 사용자 요청이 필요 없어 가장 깔끔하나 SQL 적용·운영 설정(대시보드)이 필요하고 범위가 크다 → 다음 단계 후보로 보고.
- D 사용자 토큰 + 최근 DM 행 증거 → 선택(앱 두 곳 + 서버 한 분기, 크론 무변경).

## 5. [원칙 ⑤] 절차
1) worktree(origin/main d2e0dbb), 기준 사본 `git archive d2e0dbb` → `C:/dev/wt/dm-push-base` 2) 실측 도구 작성·기준 실측 3) 원인 확정 4) 앱·서버 수정 5) 부품 시험 기준(4/12)·작업(12/12) 6) npm test 기준·작업 7) 수정 후 실측(운영 /api) 8) 다른 푸시 경로 목록 9) claims·기록·PR·법정.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "서버가 사용자 요청을 받게 되면 인증이 약해진 것이다" → 예전에도 즉시 발송은 비밀값 가진 쪽만 됐고 그건 그대로다. 새 길은 Supabase 가 서명을 확인한 사용자 토큰 + 그 사용자가 방금 그 상대에게 보낸 DM 행(RLS 상 본인만 sender_id 로 넣을 수 있는 표)이 함께 있어야 열린다. DM 을 보낼 수 있는 사람은 이미 상대에게 글을 전달할 수 있으므로 새로 생기는 권한은 "자기가 보낸 DM 의 알림"뿐이다. 정기 발송·가짜 토큰·토큰 없음·자기 자신은 부품 시험에서 401/403 으로 잰다.
- 반론② "운영 서버로 잰 수정 후 실측이 여전히 401 이니 고친 게 아니다" → 서버 변경은 병합·배포 전이라 운영 /api 에 없다. 수정 후 실측은 앱 쪽 두 요청이 Bearer + `targetUserId` 로 바뀐 것을 운영 실계정으로 확인했고(응답은 예전 서버의 `unauthorized`), 서버 쪽은 처리기를 그대로 불러 가짜 Supabase 로 200/401/403 을 잰다. 배포 뒤 같은 도구로 2xx 를 재는 일은 unverified(needs-login)로 남긴다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
제품 코드: `api/push-dispatch.js`, `js/team-dm-room.js`, `js/team-share.js`, `index.html`(버전 꼬리 2개). 시험: 새 `tests/dm-push-auth-es397.test.js`, `tests/feed-share-dm-push-tag-es396.test.js`(픽스처만 — 로그인 세션 1개와 브라우저와 같은 순서로 `dm-ledger.js` 를 읽게 함, 단언·기대값 변경 0), `scripts/test-shipyard-modular.js`(등록 1줄).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-397/`:
- 실측 전: 두 요청 모두 401(머리글 없음), 피드 공유는 `receiver_id`.
- 부품 시험: 기준 4/12 → 작업 12/12. ES-396 시험: 기준·작업 5/5.
- npm test: 기준·작업 모두 종료 0. 차이는 기준 사본에 .git 이 없어 생기는 줄과 새 시험 출력뿐.
- 수정 후 실측(운영 /api): 두 요청 모두 Bearer 있음·`targetUserId` = B, 응답 401 `unauthorized`(서버 변경 미배포).
- 막히는 지점: ① 운영 2xx 는 병합·배포 뒤에만 잴 수 있다. ② (이번 범위 밖, 위험) `/api/push-subscribe` POST·DELETE 는 토큰이 없어도 아무 `userId` 로 구독을 등록·삭제할 수 있다(토큰이 있을 때만 대조). DM 푸시가 실제로 나가게 되면 남의 `userId` 로 자기 기기를 등록한 사람이 그 사람의 DM 알림 문구를 받을 수 있다 — 별도 작업으로 구독 등록에 로그인 세션 필수화가 필요하다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
