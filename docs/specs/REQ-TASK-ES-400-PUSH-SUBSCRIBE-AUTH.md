# REQ/PLAN — TASK-ES-400 푸시 구독 등록·삭제에 로그인 토큰 필수

> 근거: PR #711(TASK-ES-397, DM 즉시 푸시) 빌더 발견 — `/api/push-subscribe` POST·DELETE 는 토큰이 있을 때만 소유를 대조하고, 앱 두 요청은 토큰을 보내지 않는다. 누구나 남의 `userId` 로 자기 기기를 등록할 수 있어, #711 이 병합되면 그 사람의 DM 알림 문구가 공격자 기기로 갈 수 있다. **이 PR 이 #711 보다 먼저 병합되어야 한다.**
> 금고 파일(court/**·AGENTS.md·CLAUDE.md·.github/workflows/**·scripts/essence-gate.js·scripts/verify-integrity-gate.js·package.json scripts·vercel.json) 변경 0. 기존 구독 행 변경·삭제 0.

## REQ
- 대상 파일·함수
  - `api/push-subscribe.js` `handler` POST·DELETE 분기 + 새 함수 `resolveTokenUser(req, sb)`
  - `index.html` `syncPushSubscription`·`removePushSubscription`(토큰은 같은 스크립트의 `getSupabaseAuthToken`, #TASK-ES-252 — 변경 0)
- 대상 DOM: 설정 알림 켜기·끄기(`js/tabs/settings/sub-notify.js` 의 `L.syncPushSubscription`·`L.removePushSubscription` 호출부) — 마크업·피드백 변경 0
- 이 API 를 부르는 곳: `index.html` 두 함수뿐. `api/push-dispatch.js`(크론·즉시 발송)·`api/withdraw.js` 는 표를 서비스 키로 직접 읽고 쓰므로 이 API 를 거치지 않는다 → 변경 0.
- R1: 서버 POST·DELETE 는 `sb.auth.getUser` 로 검증한 로그인 사용자 토큰이 없으면 401. 등록할 `user_id` 는 토큰 uid 로만 정하고, 본문 `userId` 가 있고 다르면 403. DELETE 는 남의 구독이면 403, 지울 때도 `endpoint` + `user_id = 토큰 uid` 로만 지운다.
- R2: 앱 두 요청은 로그인 세션 Bearer 를 붙이고, 세션이 없으면 요청하지 않는다(게스트는 서버 구독 없음).
- R3: 부품 시험 기준 사본 실패 → 작업 통과, npm test 기준·작업 같음, 실계정 실측 전후 기록. 잘못 등록된 행 확인용 SELECT 만 SQL 파일로.

## 1. [원칙 ①] 목표 정의
푸시 구독 행의 주인을 "로그인해서 토큰을 낸 그 사람"으로만 만든다. 남의 이름으로 기기를 등록·삭제하는 길을 닫아, DM 즉시 푸시(#711)가 켜져도 알림이 본인 기기로만 가게 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 원인: 서버의 소유 대조가 `if (authToken && sb)` 안에만 있다 — 토큰을 안 보내면 대조 자체를 건너뛰고 본문 `userId` 를 그대로 쓴다. 앱은 토큰을 보내지 않으므로 운영 요청 전부가 이 빈틈으로 들어간다. DELETE 도 같다.
- 실측(작업자, 판정 아님 — `reports/TASK-ES-400/live-base.json`, 기준 사본 처리기): 토큰 없이 B 이름 등록 → 200, 행 주인 B / 토큰 없이 B 구독 삭제 → 200, B 행 사라짐 / 앱 등록·해제 요청 Bearer 없음.
- 핵심: 인증을 "있으면 확인"에서 "없으면 거절"로 바꾸고, 대상 사용자를 본문이 아닌 토큰에서 가져온다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- `resolveTokenUser(req, sb)`: `Authorization: Bearer` → `sb.auth.getUser(token)` → uid 또는 null(오류·가짜 토큰도 null).
- POST: uid 없음 401 → 본문 `userId` 가 있고 uid 와 다르면 403 → `upsert({ user_id: uid, ... })`. 본문 `userId` 생략 허용(토큰이 정함).
- DELETE: uid 없음 401 → 그 endpoint 행 주인이 다르면 403 → `.delete().eq('endpoint', endpoint).eq('user_id', uid)`.
- 앱: 두 함수 첫머리에서 `getSupabaseAuthToken()`, 없으면 `return`(해제는 브라우저 쪽 구독 해제는 예전처럼 하고 서버 요청만 생략). 머리글 `'Authorization': 'Bearer ' + pushSubToken`.
- [기본값] index.html 인라인 줄 수 래칫(module-guard ①)을 늘리지 않도록 같은 줄 수로 고친다(34058 그대로).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 앱만 Bearer 를 붙임: 서버가 여전히 토큰 없는 요청을 받으므로 공격자는 그냥 안 붙이면 된다 → 버림.
- B 서버만 필수화: 앱이 토큰을 안 보내 정상 사용자 구독이 모두 401 → 버림.
- C RLS 정책을 열고 클라이언트가 표에 직접 쓰기: 표가 서비스 키 전용(정책 없음)이라는 기존 설계·SQL 적용이 필요 → 범위 밖.
- D 서버 필수화 + 앱 Bearer(선택). 크론·즉시 발송·탈퇴는 이 API 를 안 거쳐 영향 없음.

## 5. [원칙 ⑤] 절차
1) worktree(origin/main) · 기준 사본 git archive 2) 호출부·소비자 목록화(push-dispatch·withdraw 는 직접 표 접근 확인) 3) 서버·앱 수정 4) 부품 시험 기준 5/13 → 작업 13/13 5) npm test 기준·작업 6) 실계정 실측(로컬 처리기 직접 호출) 기준·작업 7) 확인용 SELECT SQL 8) claims·기록·PR·법정.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "토큰을 필수로 하면 지금 로그인 사용자 구독이 끊긴다" → 앱이 같은 PR 에서 세션 Bearer 를 붙인다. 이미 등록된 행은 그대로 두며(크론은 표를 직접 읽음), 다음 앱 시작 때 `enterApp` → `syncPushSubscription` 이 토큰과 함께 다시 upsert 한다. 실측에서 A 세션 등록·해제 200.
- 반론② "게스트 알림이 사라진다" → 게스트 id 는 `guest-…`(uuid 아님)이고 `push_subscriptions.user_id` 는 `uuid not null references public.users(id)` 라 예전에도 서버 upsert 가 들어갈 수 없었다(`docs/sql/2026-09-05-push-subscriptions.sql`). 앱 탭 안 알림(`setupNotifyTimer`)은 서버 구독과 무관해 그대로다. 실측에서 기준은 게스트가 요청 1건을 보냈고(운영 표에서는 형식 오류로 실패했을 행), 작업은 0건.

## 7. [원칙 ⑦] 즉시 실행 — 결과
제품 코드: `api/push-subscribe.js`, `index.html`(두 함수, 줄 수 같음). 시험: 새 `tests/push-subscribe-auth-es400.test.js`, `scripts/test-shipyard-modular.js`(등록 1줄). 실측 도구: `docs/design/harness/real-account-push-subscribe.js`. 확인용 SQL: `docs/sql/2026-10-05-push-subscriptions-owner-check.sql`(SELECT 만, 실행은 상민님).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-400/`:
- 부품 시험: 기준 5/13(실패 8: 토큰 없음 200·가짜 토큰 200·userId 생략 400·토큰 없는 삭제 200·앱 4건) → 작업 13/13.
- npm test: 기준·작업 모두 종료 0, smoke 443·0, 무결성 38/38.
- 실계정(로컬 처리기, 토큰 확인은 진짜 Supabase 인증, 표는 메모리): 기준 — 토큰 없는 B 이름 등록 200(행 주인 B)·토큰 없는 B 삭제 200(B 행 사라짐)·앱 요청 Bearer 없음 / 작업 — 401·401·A 토큰으로 B 이름 403·A 토큰으로 B 삭제 403·앱 등록·해제 Bearer 있음 200·게스트 0건.
- 막히는 지점: ① 운영 배포 뒤 실제 표에 A 행이 A 로 들어가는지는 병합 뒤에만 잴 수 있다(서비스 키가 이 PC 에 없음). ② 남의 이름으로 이미 잘못 등록된 행이 있는지는 표만으로 확정 못 한다 — 확인용 SELECT 로 단서만. ③ (범위 밖) 로그아웃 때 이 기기 구독 행이 이전 사용자 이름으로 남는다 — 다음 사용자가 로그인하면 upsert 로 주인이 바뀌지만, 로그아웃 상태로 두면 이전 사용자 알림이 그 기기에 온다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
