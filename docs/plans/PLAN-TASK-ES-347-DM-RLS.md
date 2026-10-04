# PLAN — #TASK-ES-347 DM 표 공개 읽기 차단 RLS (문제해결 8원칙)

## 1. 목표 정의
team_pings·team_ping_replies 를 anon 키로 읽을 수 없게 하고(1단계), 로그인 사용자도 "그 행을 볼 정당한 사람"만 읽고 본인 이름으로만 쓰게 한다(2단계). 로그인 사용자의 DM·피드 댓글·공개 팀·마니또·팀 채팅 기능은 그대로.

## 2. 현상 분석
- 실측(2026-10-04, 건수 1회): anon 으로 team_pings 39행·team_ping_replies 56행 전부 읽힘.
- 원인 기록: PR #357 "RLS select using(true)", ES-133 설계 문서가 "RLS 전면 개방된 team_pings 활용"을 명시(docs/specs/PLAN-TASK-ES-133-REAL-INTERACTION-BACKEND.md:34).
- 앱 코드 경로 27곳(REQ 1절 표).

## 3. 원인 추정
ES-133 이 게스트(text id)까지 서버 동기화하려고 RLS 를 열어 둔 채 DM(ES-168/169)까지 같은 표에 실었다. 표 하나에 공개 성격(피드 댓글·공개 팀)과 비공개 성격(DM·마니또 응원)이 섞여 있어 표 단위 정책으로는 좁힐 수 없었다.

## 4. 대안 탐색
- A. 기존 select 정책을 drop 하고 새로 만든다 — 기존 정책 이름을 모른다(운영 조회 금지), 되돌리기가 원본 정의에 의존.
- B. `revoke select ... from anon` — anon upsert·Realtime 동작이 불투명하고 정책 체계 밖이라 추적이 어렵다.
- C. **RESTRICTIVE 정책 추가(채택)** — 기존과 AND, 이름 불필요, 되돌리기는 drop 만.
- D. 표 분리(DM 전용 표) — 앱 코드 대수술, 이번 긴급 조치 범위 밖.

## 5. 실행 계획
- [x] docs/sql/2026-10-04-dm-rls-step1.sql — `es347_anon_no_select`(anon select false) ×2
- [x] docs/sql/2026-10-04-dm-rls-step2.sql — `es347_anon_no_access`, `es347_auth_select/insert/update/delete` ×2 표
- [x] 각 rollback.sql, docs/sql/2026-10-04-dm-rls-check.sql(사전 1~5, 사후 1~3), docs/sql/2026-10-04-dm-rls-README.md(`[손 필요]`)
- [x] docs/sql/2026-10-04-dm-rls-test.mjs — PGlite 로컬 시험
- [x] REQ·claims·TICKETS·dev_log

## 6. 절차 재검증 및 반론 격파
- 반론 1: "1단계만으로 로그인 사용자 기능이 깨질 수 있다." → 1단계 정책의 대상 역할은 `anon` 하나다. PGlite 시험에서 로그인 B 의 읽기가 9/9 그대로였다. 깨지는 것은 세션 없는 입장뿐이며, 이들은 이미 feed_posts 를 못 읽는다(2026-09-08-hidden-rls.sql).
- 반론 2: "2단계의 sender=본인 규칙이 DM 대화방 부모 행 upsert 를 깨뜨린다(두 사람이 같은 id 를 번갈아 덮어씀)." → update 정책을 두 당사자에게 열었고, PGlite 에서 C 가 A 의 부모 행 upsert 성공·제3자 B 의 가로채기 upsert 차단을 확인했다. 받는 사람의 읽음 표시 update 도 1행 성공.
- 반론 3: "RLS 가 꺼져 있으면 정책이 무의미하다." → 두 SQL 은 맨 앞에서 relrowsecurity 를 검사해 꺼져 있으면 예외로 전체 중단한다(시험 확인).

## 7. 즉시 실행
PR 생성까지 세션이 수행. 실서버 SQL 실행은 상민님(`[손 필요]`, README 1단계 → 앱 확인 → 2단계).

## 8. 성과 측정
- 로컬(작업자 예비 검사, 판정 아님): PGlite 시험 33/33.
- 실서버(미측정 — 확인 못 함): anon 0건, A 자기 DM 보임, B 에게 A-C DM 0건, 피드 댓글·마니또 동작. check.sql [사후-1~3] + 실계정 2개 앱 확인.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
- [x] [4단계: 심사 청구]
