# REQ — #TASK-ES-347 DM 표(team_pings·team_ping_replies) 공개 읽기 차단 RLS

- 근거: 2026-10-04 상민님 허가 하 건수 1회 실측(anon 키로 HTTP 200, `Content-Range 0-38/39`·`0-55/56`), PR #357 본문 "RLS `select using(true)`" 부수 발견, 노션 COMM-04(https://app.notion.com/p/3ef598db90968165815ffc64c3b95229).
- 범위: SQL 설계·문서만. 앱 코드 수정 0줄. 실서버 실행은 상민님 `[손 필요]`(docs/sql/2026-10-04-dm-rls-README.md).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 원문(요지)

1. 두 표를 읽고 쓰는 모든 코드 경로 전수 목록화.
2. 인증 방식 확인(auth.uid() 와 sender_id 일치 여부, 게스트 경로, api/** 서비스롤 영향).
3. 행 종류별 RLS 설계 — 1:1 DM 은 두 사람만, 그룹은 구성원만(없으면 authenticated 로 좁히고 한계 기록), 피드 댓글은 로그인 사용자, 마니또 풀은 필요한 범위, 쓰기는 본인 행만. 1단계(anon 차단)·2단계(행 종류별) 두 파일.
4. 각 단계 되돌리기 SQL, 적용 전 정책 확인 쿼리, 적용 후 확인 절차.
5. `[손 필요]` 클릭 단위 실행 안내.
6. REQ·PLAN·claims·TICKETS·dev_log.
7. PR(본문 맨 위에 1단계 SQL).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 — 코드 경로 전수 목록 (origin/main c634fc2 기준)

- 본질: 비공개 대화(DM·마니또 응원)와 공개 콘텐츠(피드 댓글·공개 팀)가 한 표에 섞여 있는데 읽기 정책이 using(true) 하나뿐이다.
- 원인: ES-133 이 게스트 text id 동기화를 위해 RLS 를 열어 둔 채 DM(ES-168/169)까지 같은 표에 실었다.
- 중심: 행마다 "누가 볼 정당한 사람인가"를 행 자신의 칸(group_id·target_type·sender_id·receiver_id)으로 판정할 수 있다.
- 핵심: anon 차단(1단계)만으로 외부 노출은 닫히고, 행 종류별 정책(2단계)으로 로그인 사용자 간 노출을 닫는다.

### team_pings — 22곳

| # | 위치 | 동작 | 칸·필터 | 행 종류 | 누가 봐야 하나 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | index.html:13811 체크인 인증 | insert | group_id=팀id, target_type=`checkin_certification` | H 팀 활동 | 다시 읽는 곳 없음 |
| 2 | index.html:15641 갓생 카드 DM 선물 | insert | group_id=`dm_<a>_<b>`, receiver_id=동반자 | B 1:1 선물 | 두 사람 (읽는 곳 없음) |
| 3 | index.html:15702 팀 단체방 카드 공유 | insert | group_id=팀id, target_type=`team_group` | H | 읽는 곳 없음 |
| 4 | index.html:35777 피드 Realtime | INSERT 구독(필터 없음) | 처리: `feed`/`feed_comment`, `shared_groups`/`team_group` | D·E | 로그인 사용자 |
| 5 | index.html:35817 `loadServerFeedComments` | select | group_id=`feed`, target_type=`feed_comment`, target_id=글id | D 피드 댓글 | 로그인 사용자(feed_posts 와 동일) |
| 6 | index.html:35938 댓글 등록 | insert | sender_id=state.profile.id | D | — |
| 7 | index.html:36385 댓글 삭제 | delete | id, sender_id=본인 | D | 본인 |
| 8 | index.html:36643 `loadSharedGroups` | select | group_id=`shared_groups`, target_type=`team_group` | E 공개 팀 목록 | 로그인 사용자 |
| 9 | index.html:37201 팀 개설 | insert | id=gid, message=팀 JSON | E | — |
| 10 | index.html:37559 마니또 응원 | insert | group_id=`manito`, receiver_id=상대, target_type=`manito_cheer` | C | 두 사람 |
| 11 | index.html:37605 `loadServerManitoData` 풀 | select | group_id=`manito_pool`, sender_id≠나 | F 마니또 풀 | 로그인 사용자(짝 찾기) |
| 12 | index.html:37641 마니또 받은 응원 | select | group_id=`manito`, receiver_id=나 | C | 받는 사람 |
| 13 | index.html:37825 마니또 풀 참가 | upsert | id=`mn_pool_<uid>` | F | 본인 |
| 14 | js/team-invite-comm.js:535 팀 채팅 로드 | select | group_id=팀id, target_type=`team_chat` | G 팀 채팅 | 팀 구성원(서버에 구성원 정보 없음 → 로그인 사용자) |
| 15 | js/team-invite-comm.js:568 팀 채팅 Realtime | INSERT 구독 | filter group_id=팀id | G | 같음 |
| 16 | js/team-invite-comm.js:633 팀 채팅 전송 | insert | target_type=`team_chat` | G | — |
| 17 | js/team-invite-comm.js:896 템플릿 추천 선물 | insert | group_id=`dm_<a>_<b>`, receiver_id | B | 두 사람 (읽는 곳 없음) |
| 18 | js/team-invite-comm.js:1894 DM 대화방 부모 | upsert | id=`getDmThreadId`(두 사람이 같은 id), group_id=`dm_direct` | A | 두 사람 |
| 19 | js/team-invite-comm.js:3381 동반자 DM 공유 | upsert | id=`<a>_<b>`, group_id=`dm_direct` | A | 두 사람 |
| 20 | js/team-invite-comm.js:3455·3584 피드 공유·영입 환영 | insert | target_type=`team_chat` | G | — |
| 21 | js/team-leader-check.js:394·544 팀장 도장·응원 | insert | target_type=`leader_action`·`member_nudge`, receiver_id=**멤버 이름** | H | 읽는 곳 없음 |
| 22 | js/team-leader-check.js:719 팀원 찌르기 | insert | target_type=`member_ping` | H | 읽는 곳 없음 |

### team_ping_replies — 5곳 (전부 js/team-invite-comm.js, 1:1 DM 메시지)

| 위치 | 동작 | 필터 | 누가 |
| :-- | :-- | :-- | :-- |
| 1190 `markDmThreadAsRead` | update is_read·status·read_at | ping_id, receiver_id=나 | 받는 사람 |
| 1225 `loadIncomingDmRooms` | select | receiver_id=나 | 받는 사람 |
| 1329 수신 Realtime | INSERT 구독 | receiver_id=나 | 받는 사람 |
| 1649 `loadDmMessagesFromDb` | select | ping_id=대화방 | 두 사람 |
| 1694 대화방 Realtime | INSERT 구독 | ping_id=대화방 | 두 사람 |
| 1910·3396 메시지 전송 | insert | sender_id=나, receiver_id=상대 | — |

쓰인 칸: team_pings — id, group_id, sender_id, sender_name, sender_avatar, receiver_id, target_type, target_id, target_title, ping_type, message, status, hidden, created_at. team_ping_replies — id, ping_id, group_id, sender_id, sender_name, sender_role, sender_avatar, receiver_id, message, status, is_read, sent_at, delivered_at, read_at, created_at.

api/**: origin/main 의 api 에는 두 표 참조 0건(PR #357 의 withdraw.js 변경은 미병합). 서비스롤 키 경로(api/withdraw.js·push-dispatch.js)는 RLS 를 우회하므로 영향 없음.

### 2-1. 인증 방식

| 입장 경로 | Supabase 세션 | state.profile.id | DB 역할 |
| :-- | :-- | :-- | :-- |
| 카카오 OAuth (`signInWithOAuth` → `restoreSessionAndEnter`, index.html:39654) | 있음 | session.user.id | authenticated, auth.uid()=sender_id |
| 이메일 가입·로그인 (index.html:6182·6247 → onAuthStateChange) | 있음 | session.user.id | authenticated |
| 구글 직접 로그인 (index.html:5550 `loginWithDirectIdentifier`, 직전 `signOut`) | **없음** | 캐시 id 또는 `u_<hash>` | anon |
| 빠른 계정 복구 (`openLoginRescueModal` → `loginWithDirectIdentifier`) | **없음** | 같음 | anon |
| 테스터 B 직통 (index.html:5398 `enterAsTesterB`) | **없음** | `00000000-…-0002` | anon |
| 게스트 (index.html:5385, 37382) | 없음 | `guest-…`/`guest_…` | anon |

게스트도 팀 채팅·체크인 인증·팀장 도장 등은 insert 한다(sender_id `guest-…`/`'guest'`). DM·마니또 풀은 게스트 차단 코드가 있다(team-invite-comm.js:1186·1222·3366, index.html:37782).

## 3. [원칙 ③] 해결방식 — 설계 결정

- 기존 정책은 지우지 않고 **RESTRICTIVE** 정책만 더한다 → 기존 정책 이름을 몰라도 정확히 좁혀지고, 되돌리기는 우리 정책 삭제로 끝난다.
- 정책은 행 자신의 칸과 `auth.uid()` 만 본다(Realtime 부하 없음, 2026-09-08-hidden-rls.sql 관례).
- 비교는 `::text` 로 맞춘다(칸 자료형 text/uuid 어느 쪽이든 동작).
- 1단계: anon select = false. 2단계: anon 전부 false + 행 종류별 select, insert/delete 는 sender 본인, update 는 두 당사자(DM 부모 upsert·읽음 표시 때문).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 팀 구성원 정보가 서버에 없다(`groupState` 는 users 표에 저장되지 않음) → 팀 채팅은 "로그인 사용자 전체"까지만 좁힘. 팀 id 를 알면 다른 로그인 사용자가 읽을 수 있다.
- 마니또 풀 행(익명 이름·목표 제목·최근 기록 3개)은 로그인 사용자 전체에 보인다 — 앱의 짝 찾기에 필요.
- 마니또 응원 행의 sender_id 가 받는 사람에게 보인다(익명성 누출, 기존 설계 — 이번 범위 밖, 별도 작업 필요).
- 세션 없는 입장(구글 직접·복구·테스터 B·게스트)은 1단계 뒤 읽기, 2단계 뒤 쓰기를 잃는다. 근본 해결은 그 입장 경로에 Supabase 세션을 붙이는 것(별도 작업).

## 5. [원칙 ⑤] 해결 절차
1. 상민님: check.sql [사전-1·2] 로 현재 정책·RLS 상태 기록 → step1.sql 실행 → [사후-1] anon 0건.
2. 앱에서 로그인 사용자의 DM·피드 댓글·마니또·팀 채팅 확인.
3. step2.sql 실행 → [사후-3] 으로 A/B 흉내 확인 → 실계정 2개로 앱 확인.
4. 이상 시 해당 단계 rollback.sql(우리 정책만 drop, 기존 정책 무변경).

## 6. [원칙 ⑥] 절차 재검증
- 반론: 1단계가 로그인 사용자에게 영향을 준다 → 정책 대상 역할이 anon 하나뿐. PGlite 에서 로그인 B 9/9 그대로.
- 반론: 2단계가 DM 부모 행 upsert(두 사람이 같은 id)를 깨뜨린다 → update 를 두 당사자에게 허용. PGlite 에서 당사자 upsert 성공, 제3자 가로채기 차단.
- RLS 꺼짐 상태에서 실행 시 → 두 SQL 이 맨 앞에서 예외로 전체 중단.

## 7. [원칙 ⑦] 단계별 실행 기준
- 1단계 성공: anon 으로 두 표 0건, es347_anon_no_select 2개, 로그인 앱 기능 정상.
- 2단계 성공: es347 정책 표당 5개, B 에게 A-C DM 0건, A·C 에게 2건 이상, 피드 댓글·마니또 풀 수 A=B.

## 8. [원칙 ⑧] 막히는 지점 예상
- 세션 없는 입장(구글 직접·복구·테스터 B·게스트) 사용자 불만 → [사전-4] 로 규모 측정, 근본책은 해당 경로에 Supabase 세션 부여(별도 작업).
- 운영 칸 자료형이 예상과 다를 때 → ::text 비교로 흡수, [사전-3] 으로 확인.
- 운영에 예상 밖 행 종류가 있을 때 → [사전-5] 로 확인, 정책 밖 종류는 보낸/받는 사람만 보이게 기본 차단됨.
