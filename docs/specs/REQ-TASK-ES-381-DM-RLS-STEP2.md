# REQ — TASK-ES-381 DM 공개 차단 2단계 SQL 재확정

- 상민님 지시(2026-10-05): 아직 운영 미적용인 `docs/sql/2026-10-04-dm-rls-step2.sql` 을 #680(TASK-ES-366) 뒤의 앱 요청·`og_dm_mark` 와 대조해 다시 확정. 운영 DB 에 SQL 실행 금지(파일·분석만).
- 대상 파일: `docs/sql/2026-10-04-dm-rls-step2.sql`(갱신), `docs/sql/2026-10-04-dm-rls-step2-rollback.sql`(머리말), `docs/sql/2026-10-04-dm-rls-check.sql`([사전-6]·[사전-7] 추가), `docs/sql/2026-10-04-dm-rls-README.md`(2단계 절차), `docs/sql/2026-10-05-dm-rls-step2-recheck-test.mjs`(새 로컬 시험), `docs/sql/2026-10-04-dm-rls-test.mjs`(84행 기대 1줄 — 의도된 정책 변경).
- 앱 코드(js·html)는 바꾸지 않는다.

## 1. [원칙 ①] 문제 정확히 파악

2단계 SQL 은 2026-10-04(#656, TASK-ES-347)에 만들어졌고, 그 뒤 #680 이 DM 저장·읽음 방식을 바꿨다.
- `js/tabs/comm/dm-ledger.js` `insertReply`: 상태 열(status·sent_at)을 넣어 insert, 열이 없으면 빼고 다시 insert.
- `markThreadRead`: 먼저 `sb.rpc('og_dm_mark', { p_ping_id, p_read: true })`, 실패 시 직접 update(예비).
- `markThreadDelivered`: `og_dm_mark(p_read=false)`.
- `docs/sql/2026-10-04-dm-read-columns.sql`(운영 적용됨): 열 5개 + security definer 함수 `public.og_dm_mark`.
#680 빌더 보고: 2단계 주석 "받는 사람은 읽음 표시(update) 가능" 은 운영에 허용 update 정책이 없어 사실이 아니다. 운영 `team_ping_replies` 에 delete 허용 정책도 없다.
질문: 지금 2단계를 그대로 돌리면 앱의 실제 요청이 깨지는가, 그리고 2단계가 막겠다던 "남의 이름 위조"를 실제로 다 막는가.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

앱 요청 전수(`team_pings`·`team_ping_replies`·`og_dm_mark` 를 부르는 곳 전부, `scripts/`·하네스 제외).

### team_ping_replies (1:1 DM 메시지)
| 위치 | 요청 | 보내는 값 | 2단계 규칙과의 관계 |
| :-- | :-- | :-- | :-- |
| js/team-invite-comm.js 1885행 부근 → js/tabs/comm/dm-ledger.js `insertReply` | insert | sender_id=myId, receiver_id=person.id, ping_id=`getDmThreadId`(='dm_'+작은id+'_'+큰id), status·sent_at | 통과(보낸 사람=본인, 대화방 id 일치) |
| js/team-invite-comm.js 3363행 부근 피드 공유 DM | insert | ping_id=`[myId, peerId].sort().join('_')`(접두사 'dm_' 없음) | 옛 형식도 허용해 통과. 단 대화방 화면은 'dm_…' 로 읽어 이 메시지는 대화방 안에 안 보인다(앱 결함, 범위 밖 — 아래 ⑧) |
| js/team-invite-comm.js `loadIncomingDmRooms` 1214행 | select receiver_id=나 | — | 통과 |
| js/team-invite-comm.js `loadDmMessagesFromDb` 1639행 | select ping_id=대화방 | — | 두 사람만 보임 |
| js/team-invite-comm.js 1319·1684행 Realtime INSERT 구독 | receiver_id·ping_id 필터 | — | select 정책이 행 칸만 봐서 Realtime 그대로 |
| dm-ledger.js `markThreadRead`·`markThreadDelivered` | rpc og_dm_mark | p_ping_id=대화방 id | 함수 주인 권한 → 2단계 정책(to anon/authenticated) 영향 없음 |
| dm-ledger.js `markThreadRead` 예비 경로 | 받는 사람이 직접 update | is_read·status·read_at | 운영엔 허용 update 정책이 원래 없어 0행(2단계 전후 같음) |
| api/withdraw.js | delete sender_id=탈퇴자 | 서비스 키 | RLS 우회, 영향 없음 |

### team_pings
| 위치 | 행 종류 | id·sender·receiver | 2단계 |
| :-- | :-- | :-- | :-- |
| team-invite-comm.js 1882·3348행 upsert | A 대화방 부모(dm_direct) | id=대화방 id(두 형식), sender=나, receiver=상대 | 통과 — 두 사람이 번갈아 upsert(충돌 → update) |
| team-invite-comm.js 892행, index.html 15005행 | B 선물(group 'dm_'+정렬) | sender=나, receiver=상대 | 통과 |
| index.html 7446·34817행 | C 마니또 응원 | sender=나, receiver=상대 | 통과, 제3자 0 |
| index.html 33196·33643행 | D 피드 댓글 insert·delete(eq sender_id) | receiver '' | 통과 |
| index.html 34459·33901행 | E 공개 팀 insert·select | id=팀 id | 통과 |
| index.html 35089·34863행 | F 마니또 풀 upsert·select | id='mn_pool_'+나 | 통과 |
| team-invite-comm.js 629·3422·3551행, 531·564행 | G 팀 채팅 insert·select·Realtime | receiver ''/null | 통과 |
| index.html 13180·15079행, js/team-leader-check.js 394·544·719행 | H 쓰기 전용 기록 | sender=나 | 통과(본인만 읽음) |

### og_dm_mark 안전성(security definer = RLS 를 거치지 않음)
- 조건이 `receiver_id::text = auth.uid()::text` 로 고정 → 남의 행은 0행(시험: 제3자 C 0행).
- 바꾸는 열은 is_read·status·read_at·delivered_at 뿐 → 본문·보낸 사람·대화방은 못 바꾼다.
- auth.uid() 가 null(anon)이면 0, anon·public 실행 권한 회수 → anon 호출은 권한 오류(시험 확인).
- `set search_path = public` 이지만 표는 `public.team_ping_replies` 로, 함수는 `auth.uid()` 로 모두 스키마를 붙여 써서 경로 끼어들기 여지가 없다.
- 의존 조건 1개: 표에 FORCE ROW LEVEL SECURITY 가 켜지면 주인도 정책을 받아 함수가 0행이 된다(시험으로 재현). → check.sql [사전-6] 에서 `rls_강제=false` 확인을 실행 전 단계에 넣었다.

### 찾은 충돌·구멍 (2026-10-04 판)
1. **주석 불일치**: "받는 사람은 읽음 표시(update) 가능" — restrictive 만 더하므로 허용 정책 없는 운영에선 성립하지 않음. 동작 충돌은 아님(og_dm_mark 가 대신).
2. **대화방 끼워 넣기(위조)**: insert 규칙이 sender_id 만 봐서, B 가 `sender=B, receiver=A, ping_id='dm_A_C'` 로 넣으면 A 의 C 대화방(`loadDmMessagesFromDb` 는 ping_id 로만 읽음)에 C 가 쓴 것처럼 보였다. 시험: 2026-10-04 판 「1행」(뚫림).
3. **받는 사람 본문 수정 여지**: update 규칙이 "보낸 사람·받는 사람" 이라, 나중에 누가 허용 update 정책을 더하면 받는 사람이 본문까지 고칠 수 있다.
4. **대화방·마니또 풀 id 선점**: B 가 `id='dm_A_C'`(sender=B, receiver=A) 나 `id='mn_pool_C'` 를 먼저 insert 하면, C 의 upsert 는 충돌 → update 경로에서 기존 행의 보낸/받는 사람이 아니라 막힌다(마니또 참여 불가). 시험: 2026-10-04 판 「1행」(뚫림).

## 3. [원칙 ③] 해결방식

정책 이름 10개는 그대로 두고 식만 좁힌다(되돌리기 파일이 그대로 통함). 모두 restrictive 라 지금 허용된 것을 더 좁히기만 한다.
- `team_ping_replies` insert: `sender_id = auth.uid()` **and** `ping_id` 가 (sender, receiver) 의 대화방 id(`'dm_'||least||'_'||greatest` 또는 접두사 없는 옛 형식). 정렬은 `collate "C"`(JS `<` 와 같은 바이트 순).
- `team_ping_replies` update: 보낸 사람만 + 바꾼 뒤에도 대화방 id 규칙 유지. 읽음은 og_dm_mark 로만.
- `team_pings` insert·update(with check): `group_id='dm_direct'` 면 id 가 대화방 id, `group_id='manito_pool'` 이면 id='mn_pool_'||sender_id. null 이 섞여도 `is distinct from` 으로 판정.
- check.sql: [사전-6](og_dm_mark·security definer·FORCE 꺼짐), [사전-7](규칙 밖 기존 행 수 — 기록용, 읽기 전용) 추가.
- 로컬 시험 새 파일: 운영 모양(답장 표 update/delete 허용 없음, 비슈퍼유저 주인)에서 1단계+읽음 열+2단계를 차례로 적용.

## 4. [원칙 ④] 재검토

- 대안 A "SQL 그대로 두고 주석만 고침": 구멍 2·4 가 남는다 — 2단계의 목적(위조 차단)을 못 채움. 기각.
- 대안 B "부모 행·답장 쓰기를 security definer 함수로 옮김": 앱 코드(js) 수정이 필요해 범위·위험이 커짐. 지금은 정책 식으로 충분. 기각.
- 대안 C(채택) "정책 식만 좁힘": 앱 변경 0, 이름 그대로라 되돌리기 동일, 기존 행 손대지 않음.
- 기존 행 영향: 정책은 새로 쓰는/고치는 행에만 with check 가 걸린다. 규칙 밖 옛 행은 그대로 읽히고, 같은 id 로 다시 upsert 할 때만 막힌다([사전-7] 로 수 기록).

## 5. [원칙 ⑤] 절차

1. 코드 전수 → 2. step2.sql 식 수정 → 3. rollback 머리말·check 블록 → 4. PGlite 시험(2단계 전 / 2026-10-04 판 / 재확정판 나란히) → 5. 옛 시험(2026-10-04-dm-rls-test.mjs) 재실행 → 6. README·REQ·claims·dev_log·TICKETS → 7. npm test → 8. PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- 반론 1 "id 규칙을 정책에 넣으면 앱이 id 형식을 바꾸는 순간 DM 이 조용히 끊긴다." → 형식은 `getDmThreadId` 와 피드 공유 경로 두 가지뿐이고 둘 다 허용했다. 앱이 형식을 바꾸면 supabase-js 가 insert 오류를 돌려주고 `insertReply` 가 「메시지가 서버에 저장되지 않았어요」 토스트를 띄운다(#680) — 조용히 끊기지 않는다. 그리고 2단계 뒤 RA-COMM-04A 가 바로 잡는다.
- 반론 2 "받는 사람 update 를 막으면 og_dm_mark 가 없는 환경에서 읽음이 안 된다." → og_dm_mark 는 운영 적용됨(2026-10-05 상민님 실행, RA-COMM-04B 통과). 운영엔 원래 받는 사람 update 허용 정책이 없어 예비 경로는 이미 0행이었다 — 바뀌는 동작이 없다. 함수가 지워지는 경우는 check [사전-6] 이 실행 전에 잡는다.
- 반론 3 "collate \"C\" 정렬이 JS 정렬과 다를 수 있다." → id 는 ASCII(uuid·'u_…'·'guest-…')이고 ASCII 에서 바이트 순 = UTF-16 코드 단위 순. 시험에서 앱 식(`tid`)으로 만든 id 가 통과.

## 7. [원칙 ⑦] 즉시 실행 — 결과(작업자 측정, 판정 아님)

로컬 시험 `node docs/sql/2026-10-05-dm-rls-step2-recheck-test.mjs <2026-10-04 판 경로>`(PGlite 0.2.17): **52/52**, 종료 코드 0. 옛 시험 `2026-10-04-dm-rls-test.mjs` 33/33(84행 기대를 "직접 update 0행"으로 — 의도된 변경), `2026-10-04-dm-read-columns-test.mjs` 20/20.

| 시나리오 | 2단계 전(1단계+읽음열) | 고치기 전 2단계(2026-10-04 판) | 2단계 뒤 | 기대 |
| :-- | :-- | :-- | :-- | :-- |
| A→B DM: 대화방 부모 upsert(새로 만듦) | 1행 | 1행 | 1행 | ok |
| A→B DM: 메시지 insert(dm-ledger insertReply 열 그대로) | 1행 | 1행 | 1행 | ok |
| B 답장: 같은 부모 upsert(충돌 → update 경로) | 1행 | 1행 | 1행 | ok |
| B 답장: 메시지 insert | 1행 | 1행 | 1행 | ok |
| B 받은 목록(receiver_id=B) 건수 | 1 | 1 | 1 | 1 |
| B 대화방 읽기(ping_id=A-B) 건수 | 2 | 2 | 2 | 2 |
| 제3자 C 가 A-B 대화방 읽기 건수 | 2 | 0 | 0 | 0 |
| 제3자 C 가 A-B 부모 행 읽기 건수 | 1 | 0 | 0 | 0 |
| B og_dm_mark(도착) 바뀐 행 | 1 | 1 | 1 | 1 |
| B og_dm_mark(읽음) 바뀐 행 | 1 | 1 | 1 | 1 |
| A 가 보는 자기 메시지 is_read | true | true | true | true |
| 제3자 C og_dm_mark(A-B) 바뀐 행 | 0 | 0 | 0 | 0 |
| anon og_dm_mark 실행 | 거절(실행 권한 없음) | 거절(실행 권한 없음) | 거절(실행 권한 없음) | 거절 |
| B 직접 update 로 읽음(markThreadRead 예비 경로) 행 | 0행 | 0행 | 0행 | 0 |
| B 가 받은 메시지 본문 고치기 행 | 0행 | 0행 | 0행 | 0 |
| 피드 공유 DM(옛 대화방 id A_B) 메시지 insert | 1행 | 1행 | 1행 | ok |
| 피드 공유 DM 부모 upsert(옛 id) | 1행 | 1행 | 1행 | ok |
| 선물(group dm_A_B, 템플릿 추천) insert | 1행 | 1행 | 1행 | ok |
| B 가 받은 선물 읽기 건수 | 1 | 1 | 1 | 1 |
| A 피드 댓글 insert | 1행 | 1행 | 1행 | ok |
| B 가 보는 피드 댓글 건수 | 2 | 2 | 2 | 2 |
| B 가 A 의 댓글 지우기 행 | 1행 | 0행 | 0행 | 0 |
| A 가 자기 댓글 지우기 행 | 0행 | 1행 | 1행 | 1 |
| 팀 채팅 A insert / B 읽기 건수 | 1 | 1 | 1 | 1 |
| 마니또 응원 A→B insert / C 읽기 건수 | 1 | 0 | 0 | 0 |
| B 마니또 받은 함 건수 | 1 | 1 | 1 | 1 |
| C 마니또 풀 참여 upsert(mn_pool_C) | 1행 | 1행 | 1행 | ok |
| C 마니또 풀 재참여 upsert(충돌 → update) | 1행 | 1행 | 1행 | ok |
| [위조] B 가 A 이름(sender_id=A)으로 DM insert | 1행 | 거절(RLS es347_auth_insert) | 거절(RLS es347_auth_insert) | 거절 |
| [위조] B 가 A 이름으로 피드 댓글 insert | 1행 | 거절(RLS es347_auth_insert) | 거절(RLS es347_auth_insert) | 거절 |
| [위조] B 가 A-C 대화방(ping_id)에 A 에게 끼워 넣기 | 1행 | 1행 | 거절(RLS es347_auth_insert) | 거절 |
| [위조] B 가 A-C 부모 행 가로채기 upsert | 1행 | 거절(RLS es347_auth_update) | 거절(RLS es347_auth_insert) | 거절 |
| [위조] B 가 B→A 부모를 규칙 밖 id 로 새로 만들기 | 1행 | 1행 | 거절(RLS es347_auth_insert) | 거절 |
| [위조] B 가 아직 참여 안 한 D 의 마니또 풀 id 선점 | 1행 | 1행 | 거절(RLS es347_auth_insert) | 거절 |
| [위조] B 가 보낸 메시지의 보낸 사람을 A 로 바꾸기 | 0행 | 0행 | 0행 | 거절 |
| [위조] B 가 자기 메시지를 A-C 대화방으로 옮기기 | 0행 | 0행 | 0행 | 거절 |
| [위조] anon 이 팀 채팅 insert | 1행 | 거절(RLS es347_anon_no_access) | 거절(RLS es347_anon_no_access) | 거절 |
| anon 이 보는 DM 메시지 건수 | 0 | 0 | 0 | 0 |

그 밖에 같은 시험에서: 2단계 두 번 실행 오류 없음 · 정책 수 5·5 · check.sql 전체 실행 오류 없음 · [사전-7] 0·0·0 · 허용 update 정책을 일부러 더해도 받는 사람 본문 수정 0행·대화방 옮기기 거절·보낸 사람 바꾸기 거절·본인 본문 수정 1행 · FORCE RLS 켜면 og_dm_mark 0행 / 끄면 1행 · 되돌리기 뒤 2단계 정책 0, 1단계 유지(anon 0), og_dm_mark 동작.
한계: PGlite 는 운영의 실제 허용 정책 목록·자료형·Realtime·PostgREST 를 재현하지 않는다. team_pings 허용 정책은 "모두 열림"(가장 넓은 경우)으로 가정했다.

## 8. [원칙 ⑧] 성과 측정 · 막힐 지점

- 성과 측정(운영, 상민님 실행 뒤): check [사후-1] 0·0, [사후-3] B 가 보는 A-C DM 0, 실계정 하네스 RA-COMM-03·04A·04B·04C·04D.
- 막힐 지점: ① [사전-1] 에 `es347_anon_no_select` 가 없으면 1단계 미적용 → 1단계부터. ② [사전-6] 의 rls_강제 true → 실행 보류, 세션에 알림. ③ team_pings 에 허용 update 정책이 운영에 없다면 대화방 부모 upsert 의 두 번째 사람 쪽은 2단계 전부터 실패 중이다(부모 행은 앱이 다시 읽지 않아 화면 영향 없음, 메시지 insert 는 따로 성공) — 2단계가 만든 문제가 아님.
- 범위 밖 발견(다음 작업 후보): 피드 공유 DM(js/team-invite-comm.js 3346행 부근)이 대화방 id 를 'dm_' 없이 만들어 그 메시지가 대화방 화면·읽음 표시에서 빠진다 — `getDmThreadId(myId, peerId)` 로 바꾸는 1줄 수정. 표시 이름(sender_name)은 아무 글자나 넣을 수 있다(신원은 sender_id).

## 상민님 실행 절차 (check → step2 → check, 문제 시 rollback)

`docs/sql/2026-10-04-dm-rls-README.md` 「2단계 — #TASK-ES-381 재확정판」과 같은 내용.

### 2단계 — #TASK-ES-381 재확정판 (1단계·읽음 열 SQL 뒤에)

왜 손이 필요한가: 정책(RLS)은 Supabase 대시보드 SQL Editor 에서만 바꿀 수 있고, 세션에는 관리자 로그인이 없다.
걸리는 시간: 약 10분. 실행 전후 어느 단계든 이상하면 맨 아래 **되돌리기** 한 번으로 2단계 직전 상태가 된다(행·열·og_dm_mark 는 건드리지 않음).

#### A. 실행 전 확인 (check)
1. 브라우저에서 https://supabase.com/dashboard 로그인 → **아워골 프로젝트** 클릭.
2. 왼쪽 메뉴 **SQL Editor** → 오른쪽 위 **+ New query**.
3. `docs/sql/2026-10-04-dm-rls-check.sql` 의 **[사전-1]** 블록(select 한 문장)을 붙여넣고 **Run** → 나온 표를 캡처(지금 정책 기록, 되돌릴 때 대조용). `policyname` 에 `es347_anon_no_select` 가 두 표 모두 있어야 한다 — 없으면 1단계가 아직이므로 위 「1단계」부터 한다.
4. 창을 비우고 **[사전-6]** 블록 붙여넣고 **Run**. 정상: `og_dm_mark 수(1)` = **1**, `og_dm_mark security definer(true)` = **true**, `team_pings rls_강제(false)`·`team_ping_replies rls_강제(false)` = **false**.
   - 하나라도 다르면 **여기서 멈추고** 세션에 결과 캡처를 준다(2단계를 돌리면 읽음 표시가 멈출 수 있음).
5. 창을 비우고 **[사전-7]** 블록 붙여넣고 **Run** → 세 숫자를 캡처(규칙 밖 기존 행 수). 0 이 아니어도 실행해도 된다 — 기존 행은 지우거나 고치지 않는다.

#### B. 2단계 실행 (step2)
6. 창을 비우고 `docs/sql/2026-10-04-dm-rls-step2.sql` **전체**를 붙여넣고 **Run** 1번.
7. 정상 결과(맨 아래 두 표):
   - `es347_2단계_정책_수`: `team_ping_replies` **5**, `team_pings` **5**
   - `team_pings (anon)` **0**, `team_ping_replies (anon)` **0**
   - 오류 `RLS 가 꺼진 표가 있습니다` 가 나오면 아무것도 바뀌지 않은 것이다 → 세션에 알린다.

#### C. 실행 후 확인 (check)
8. 창을 비우고 check.sql **[사후-2]** 를 **Run** → 첫 줄의 `sender_id` 를 A, `receiver_id` 를 C 로 적는다. B 는 그 둘이 아닌 다른 로그인 계정 id(예: 테스트 계정 B).
9. **[사후-3]** 두 블록의 `<A_ID>`·`<B_ID>`·`<C_ID>` 를 8번 id 로 바꿔 **Run**. 정상: A 가 보는 A-C DM **1 이상**, B 가 보는 A-C DM **0**, B 가 보는 A-C 부모 행 **0**, 피드 댓글·마니또 풀 수는 A·B 가 같다.
10. 앱 확인(실계정 2개, 또는 세션에 "실계정 하네스 소통 돌려" 한 마디 — RA-COMM-03·04A·04B·04C·04D):
    - A→B DM 보내기 → B 화면 도착, B 가 열면 A 화면 「읽음」
    - 피드 댓글 쓰기·지우기, 마니또 참여·응원, 팀 채팅 보내기
    - RA-COMM-04D(B 세션으로 A→C DM 조회 0건)가 이번 단계로 처음 통과해야 한다(하네스에 계정 C 가 있어야 돌아감 — 없으면 「못 함」)

#### 문제 시 되돌리기 (rollback)
- SQL Editor → **+ New query** → `docs/sql/2026-10-04-dm-rls-step2-rollback.sql` **전체** 붙여넣고 **Run**.
- 정상: `es347 2단계 정책 남은 수(0 이어야 함)` = **0**. 1단계(anon 읽기 차단)·읽음 열·og_dm_mark 는 그대로 남는다.
