# REQ — #TASK-ES-366 실계정 확인 실패 3건(RA-COMM-03·04A·04B) 원인 조사·수정 (노션 COMM-03 · COMM-04)

- 근거: 2026-10-04 23:21 실계정 하네스(`docs/design/harness/real-account-check.js --only RA-COMM-03,RA-COMM-04A,RA-COMM-04B`, 실서버, 작업자 측정)에서 3건 실패.
- 추가 범위(코디네이터 2026-10-04): 동반자 복원이 자기 키가 비면 다른 계정의 `ourgoal_companions_backup_*` 를 훑어 가져오는 계정 간 유출 — `js/team-invite-comm.js` `ensureDefaultCompanions` 를 자기 uid 키만 읽게.
- 범위: `js/team-invite-comm.js`(동반자 저장·복원, DM 전송·읽음·표시) · 새 세포 `js/tabs/comm/dm-ledger.js` · `index.html` 스크립트 태그 1개 · 하네스 대기 1줄 · `docs/sql/2026-10-04-dm-read-columns*.sql`.
- 손대지 않음: index.html 의 `loadProfile`·`migrateGuestDataToUser`·`syncServerRecords`·`performLogout`(#678 CORE-09 담당), `js/record-ledger.js`, 동결 파일 전부. 기능 삭제 0.

## 1. [원칙 ①] 문제 정확히 파악

| 시나리오 | 실측(수정 전, 실서버 23:29) |
| :-- | :-- |
| RA-COMM-03 | A 가 B 를 동반자로 추가 → 같은 기기 `listedNow`·`afterReload` true, 다른 기기(같은 계정 새 브라우저) `otherDevice` **false** |
| RA-COMM-04A | A→B DM 이 B 화면에 45초 안에 0건(`arrivedOnB` null) |
| RA-COMM-04B | B 가 꺼진 동안 A 화면에 이미 "도착 … · 미확인 (1)"(도착을 지어냄) · B 가 대화를 못 엶(`bOpened` false) |

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 (테스트 계정 A·B 로그인 세션으로 직접 잼, 건수·열 이름만)

1. **COMM-03 — RLS 아님. 앱이 토큰 없이 서버를 부른다.** `persistCompanions`·`syncCompanionsFromDb`(js/team-invite-comm.js)가 `/api/track` `sync_companions` 를 `Authorization` 없이 보냄 → `api/track.js` `handleSyncCompanions` 의 `authenticateCaller`(#TASK-ES-252)가 **401 "Missing bearer authorization token"**. 같은 요청에 본인 토큰을 붙이면 200·저장·되읽기 성공(n=1, B 포함 → 원복 n=0). 3순위 경로 `sb.from('users').update({companions})` 는 운영에 **`users.companions` 열이 없어**("column users.companions does not exist", `docs/sql/2026-09-16-users-companions-column.sql` 미적용) 조용히 실패. → 같은 기기는 localStorage 사본으로만 보였다.
2. **COMM-04A — RLS 아님. 앱이 운영 표에 없는 열을 넣는다.** `team_ping_replies` 에 `status·sent_at·delivered_at·read_at·is_read` 5열이 없다(각 열 select 오류). `renderCommDM` 의 `send()` 가 이 열을 넣어 insert 가 **PGRST204 "Could not find the 'delivered_at' column"** 로 통째 실패, supabase-js 는 throw 하지 않아 오류가 버려지고 화면에는 "전송했습니다" 토스트. #TASK-ES-318(2026-09-27 e4b706f)이 코드에만 열을 넣고 표를 만들지 않은 뒤로 1:1 DM 은 모두 저장되지 않았다. 열을 빼고 넣으면 성공하고 B 세션이 그 행을 읽는다(1건) — 1단계 RLS(anon 읽기 차단)는 로그인 세션 요청에 영향 없음(앱 DM 요청은 `window.sb` 로그인 세션).
3. **COMM-04B — 04A 와 같은 원인 + 두 가지 더.** ① 읽음 표시 `markDmThreadAsRead` 는 정의·내보내기만 있고 **호출부 0**. ② 받는 사람(B)이 A→B 행을 update 하면 **0행**(운영에 받는 사람 update 허용 정책 없음), 게다가 읽음 열 자체가 없다 → 읽음은 SQL 없이는 저장할 곳이 없다. ③ 보낸 쪽이 `deliveredAt = now + 150ms` 로 도착을 지어내 상대가 꺼져 있어도 "도착"을 썼다. ④ 동반자 사본에 `_thread`·`_loadedThreadFromDb`(서버에서 이미 불러옴 표식)가 같이 저장돼 새로고침 뒤 서버를 다시 읽지 않을 수 있었고, DM 본문(`_thread`·`lastMsg`)이 localStorage·서버 events 원장으로 복제됐다.
4. **추가 — 계정 간 유출.** `ensureDefaultCompanions` 가 자기 키 `ourgoal_companions_backup_<uid>` 가 비면 같은 기기의 다른 계정 키를 훑어 가져왔다.

- **중심**: 서버와 주고받는 세 통로(동반자 저장·DM 저장·읽음)가 실패를 돌려받지 않아, 화면은 성공처럼 보이고 서버에는 없었다.
- **핵심**: 통로를 한 세포로 모아 ① 토큰을 붙이고 ② 오류를 돌려받아 확인하고 ③ 없는 열은 빼고라도 메시지를 도착시키며 ④ 읽음은 받는 사람 본인 행의 읽음 열만 바꾸는 서버 함수로 연다.

## 3. [원칙 ③] 해결방식

- 새 세포 `js/tabs/comm/dm-ledger.js`(`global.OurgoalDmLedger`, 화면 없음): `getAuthToken`·`trackPost`(Bearer 토큰, 없으면 보내지 않음)·`storageCopy`(`_*`·`lastMsg`·`lastTime`·`isUnread` 제거)·`insertReply`(PGRST204/42703 이면 5열 빼고 재시도, 결과 `{ok,error,withoutStatusColumns}`)·`markThreadRead`(rpc `og_dm_mark(p_ping_id, true)` → 없으면 받는 사람 본인 행 직접 update, 결과 `{ok,rows,via,error}`)·`markThreadDelivered`(rpc `og_dm_mark(p_ping_id, false)`).
- `js/team-invite-comm.js`
  - `syncCompanionsFromDb`·`persistCompanions` → `OurgoalDmLedger.trackPost`. localStorage·서버로 가는 목록은 `storageCopyOf`(사본).
  - `ensureDefaultCompanions` → 다른 계정 키 훑기 제거(자기 uid 키만).
  - `renderCommDM` `send()` → `insertReply` 결과 확인, 실패면 "메시지가 서버에 저장되지 않았어요" 토스트(성공 토스트는 저장 뒤로 이동). 보낼 때 `status:'sent'`, `deliveredAt` null(지어내지 않음).
  - `markDmThreadAsRead` → `markThreadRead` 사용, 반환값 돌려줌. 호출: 대화를 열 때(`renderCommDM` 의 `markDmRoomRead` 자리), 열린 대화에 새 메시지가 올 때(두 Realtime 처리기).
  - `loadIncomingDmRooms` → 받는 기기가 서버에서 받아 간 대화마다 `markThreadDelivered`.
  - `renderSingleDmMsg`·`loadDmMessagesFromDb` → 내 메시지는 `delivered_at` 이 있을 때만 "도착 …".
  - 줄 수 4131 → 4105(모듈 가드 기준선 낮춤).
- `index.html`: `<script src="js/tabs/comm/dm-ledger.js?v=20261004-es366">` 를 `team-invite-comm.js` 앞에 1개(인라인 스크립트 변경 0, 기존 캐시 태그 `es131` 은 smoke 시험지가 글자로 찾으므로 유지).
- `docs/sql/2026-10-04-dm-read-columns.sql`(+ 되돌리기 · PGlite 시험 20/20): 5열 추가(기존 행 null, 새 행 `is_read` 기본 false) + `og_dm_mark` security definer 함수(조건 `receiver_id = auth.uid()` 고정, 읽음·도착 열만 변경, anon 실행 불가). **대시보드 실행은 상민님 몫.**
- 하네스 `real-account-steps.js` RA-COMM-03: 다른 기기 목록 확인을 서버 응답 뒤 다시 그리기까지 최대 12초 기다림(기대값 "B 가 보인다"는 그대로).

## 4. [원칙 ④] 재검토

- SQL 적용 전: 메시지 전송·도착(04A)은 된다. 읽음(04B 마지막 단계)은 저장할 열·권한이 없어 계속 실패 — 지어내지 않는다.
- SQL 적용 후: 같은 코드가 5열을 그대로 넣고(재시도 없음) `og_dm_mark` 로 읽음·도착을 기록. 앱 배포와 SQL 실행 순서는 상관없다.
- 받는 사람에게 update 정책을 열지 않은 이유: RLS 는 열 단위로 막지 못해 본문(message)까지 고칠 수 있게 된다. 함수는 읽음 열만 바꾼다(PGlite: B 의 본문 update 0행 유지).
- 2단계 RLS(`2026-10-04-dm-rls-step2.sql`)의 "받는 사람은 읽음 표시(update) 가능" 은 restrictive 정책뿐이라 운영에서는 허용 정책이 없어 성립하지 않는다(실측 0행). 이번 함수가 그 자리를 대신한다.
- `users.companions` 열은 만들지 않았다 — 서버 경로(events 원장 `companion_ledger`)가 토큰만 붙이면 동작하므로 필요 없다. 클라이언트의 `users.update({companions})` 3순위는 그대로 두었다(열이 생기면 동작, 없으면 무해).

## 5. [원칙 ⑤] 절차

1. 직전 3커밋·하네스 코드 정독 → 2. 테스트 계정 A·B 세션으로 열·정책·API 응답을 건수·열 이름만 측정(scratchpad 스크립트, 주소·비밀번호·uid 출력 없음) → 3. 수정 → 4. 부품 시험·PGlite 시험 → 5. 작업 트리를 정적 서버로 띄우고 `/api/*` 만 실서버로 넘겨 실계정 하네스 재생(대조: 같은 방식으로 origin/main 코드) → 6. module-specs·guard·npm test.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 — "다른 기기 12초 대기는 기대값 낮추기다."** → 기대값(다른 기기 목록에 B 가 있음)은 그대로다. 같은 대기를 넣은 하네스로 origin/main 코드를 재생하면 여전히 `otherDevice false`(401 때문)로 실패했다. 대기는 비동기 서버 응답을 기다릴 뿐 실패를 통과로 바꾸지 않는다. 같은 하네스의 정리 단계(CLEAN 기기)도 이미 4초를 기다려 버튼을 찾는다.
- **반론 2 — "열을 빼고 재시도하면 SQL 적용 뒤에도 상태가 빠질 수 있다."** → 재시도는 오류가 '없는 열'(PGRST204·42703·column)일 때만이다. 열이 생기면 첫 insert 가 성공해 재시도하지 않는다(부품 시험 "열이 다 있으면 한 번에"). 권한 오류 등은 재시도 없이 실패 토스트.

## 7. [원칙 ⑦] 즉시 실행 — 결과(작업자 측정, 판정 아님)

| 시나리오 | 수정 전 실서버(23:29) | 대조: origin/main 코드 + 실서버 API(23:44, 대기 포함 하네스) | 수정 후 작업 트리 + 실서버 API(23:42) |
| :-- | :-- | :-- | :-- |
| RA-COMM-03 | 실패(otherDevice false) | 실패(otherDevice false) | **통과**(listedNow·afterReload·otherDevice true) |
| RA-COMM-04A | 실패(arrivedOnB null) | 실패 | **통과**(arrivedOnB 1) |
| RA-COMM-04B | 실패(B 꺼짐 동안 "도착" 표시) | 실패(같음) | 실패 — "B 열람 뒤 읽음"(SQL 미적용). B 꺼짐 동안 "도착" 없음 ✓, B 대화 열림(bOpened true) ✓ |

- 게스트 화면(작업 트리): `window.OurgoalDmLedger` 로드, 소통 > 동반자 검색칸·DM 목록 그려짐, 페이지 오류 0.
- 부품 시험 `tests/comm-dm-ledger-es366.test.js` 10/10, PGlite `docs/sql/2026-10-04-dm-read-columns-test.mjs` 20/20, `npm test` 0 실패.

## 8. [원칙 ⑧] 성과 측정 · 막힐 지점

- 남은 것: 04B 읽음은 `docs/sql/2026-10-04-dm-read-columns.sql` 대시보드 실행 뒤 하네스 재생으로 잰다. 배포본(실서버 정적 파일)은 병합·배포 전이라 수정 전 상태.
- 남은 테스트 데이터: DM 행은 보낸 사람도 지울 수 없다(운영에 delete 허용 정책 없음, 실측 0행) — 이번 측정으로 A 의 표식 붙은 `team_ping_replies` 약 5행·`team_pings` 1행(대화방 부모)이 테스트 계정 A·B 사이에만 남음.
- 새로 발견(이 PR 범위 밖): ① index.html `loadProfile` 의 동반자 복원(3879줄 부근)도 다른 계정 `ourgoal_companions_backup_*` 를 훑는다 — #678 담당 함수라 손대지 않음. ② 운영 `team_ping_replies` 에 보낸 사람 delete 허용 정책이 없어 하네스 정리가 DM 을 못 지운다. ③ 동반자 삭제가 다른 기기에 반영되지 않는다(`syncCompanionsFromDb` 는 서버 목록을 더하기만 함).
