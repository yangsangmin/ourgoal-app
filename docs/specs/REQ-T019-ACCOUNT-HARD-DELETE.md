# REQ-T019 — 계정 삭제 기능(앱 내 + 백엔드 실제 삭제)

- 출처: 아워골 일자별 실행 로드맵 T019 (2026-09-17 · P0 · D0~2 지인 배포) — https://app.notion.com/p/3d5598db9096810f8051f621f3ae392b
- 근거 자료: R08
- 작성: 2026-09-21

## 지시 원문(로드맵 행의 세부 절차·완료 기준 그대로)

1. 설정 → 계정 삭제 → 확인 → Supabase RPC로 users·goals·checkins·messages 연쇄 삭제
2. 삭제 후 로그아웃·로컬 스토리지 초기화
3. /privacy에 삭제 절차 명시
4. 테스트 계정으로 삭제→DB row 0 확인
5. 완료 기준: 삭제 후 DB 조회 0건 스크린샷

## 착수 시 실측 (2026-09-21)

- 앱: [설정] → [회원 탈퇴] 모달(#TASK-ES-158)은 있으나 `submitWithdrawAccount` 는 프로필에 `pendingDeletionAt` 만 찍고 로그아웃한다. 서버 삭제 호출 0건.
- 백엔드: `api/withdraw.js` 에 `purge` 모드가 있으나 ① 클라이언트 호출처 0건 ② 삭제 오류를 검사하지 않음(`{error}` 미확인 — supabase-js 는 실패해도 throw 하지 않는다) ③ 삭제 뒤 잔여 행을 세지 않고 항상 `ok:true` ④ 대상 목록에 운영 DB 에 없는 테이블(`comments`·`feed_likes`)과 `user_id` 컬럼이 없는 `events` 가 들어 있고, 실제 메시지 테이블(`team_pings`·`team_ping_replies`·`team_comments`)은 빠져 있음.
- 운영 스키마(공개 anon 키로 REST 조회): `users`·`goals`·`checkins`·`push_subscriptions`·`feed_posts`·`events`·`team_pings`·`team_ping_replies`·`team_comments`·`content_reports` 존재. `messages` 테이블은 없음(404) — 지시의 "messages" 는 팀 메시지 3종으로 읽는다.

## 설계 결정

| 결정 | 이유 |
| :-- | :-- |
| 연쇄 삭제는 새 RPC 가 아니라 기존 서비스롤 API(`/api/withdraw` purge)로 한다 | RPC 는 SQL Editor 에서 DDL 을 실행해야 하는데 세션이 할 수 없다. auth 사용자 삭제는 어차피 서비스롤이 필요해 RPC 만으로는 끝나지 않는다. 이미 있는 경로를 고치는 것이 가장 작다 |
| 30일 유예 탈퇴는 그대로 두고 "즉시 영구 삭제"를 선택지로 더한다 | 유예·복구는 이미 배포된 기능이다(기존 기능 삭제는 승인선). 기본값은 유예, 즉시 삭제는 체크 + 브라우저 확인 창의 2단계 |
| 서버가 삭제 뒤 같은 조건으로 다시 세어 0건일 때만 `ok:true` | "지웠다"는 선언이 아니라 측정이어야 한다. 못 센 것은 0 이 아니라 `null` 이고 `null` 이면 실패다 |
| 상대가 쓴 글(`receiver_id` 쪽)과 익명 `events` 는 지우지 않는다 | 타인의 데이터이거나 사용자를 식별할 수 없는 기록이다 |

## 범위 밖(이번에 하지 않은 것)

- 30일 유예가 끝난 계정을 자동으로 파기하는 배치. 지금은 없다(실측). 모달은 "30일 뒤 자동 파기"를 안내하고 있어 별도 작업이 필요하다.
