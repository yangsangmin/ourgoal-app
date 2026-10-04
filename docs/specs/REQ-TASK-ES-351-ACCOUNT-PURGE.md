# 요구사항 정의서 (REQ) — 탈퇴 신청 30일 후 계정·데이터 영구 파기

> **문서 ID**: REQ-TASK-ES-351-ACCOUNT-PURGE
> **티켓 연계**: #TASK-ES-351 (노션 「아워골 UI/UX 대개편 작업 티켓 DB」 SET-02 · 생각 메모장 16 · PR #357(#T019) 설계 흡수)
> **작성 일시**: 2026-10-04
> **작성자**: Claude Code 세션 (오케스트레이터 지시 위임)
> **규범 준수**: AGENTS.md(헌법) · court/README.md 4절(claims 형식)

---

## 0. 5단 추론 블록 (MODE_0)
- **이해**: 상민님 결정 원문 "탈퇴 후 영구파기로 진행해"(2026-10-04). 탈퇴 신청 30일 뒤 계정과 데이터를 서버에서 실제로 지운다. 되돌릴 수 없는 삭제라 안전장치가 본체다.
- **분류**: INFRA + FIX(고지 정정). 서버 API·클라이언트 2곳·SQL(설치·확인·켜기·되돌리기)·법률 문서. 병합·실서버 실행은 하지 않는다.
- **예측**: 신청 시각이 기기(localStorage)에만 있으면 서버 작업이 대상을 알 수 없다 → 서버 기록이 먼저다. 파기 실행은 vercel.json 크론·워크플로가 동결이라 DB 안(pg_cron)에서 돈다.
- **반론 1**: "사용자 메타데이터(user_metadata)에 이미 account_status 가 있으니 그걸 쓰면 된다." → 격파: user_metadata 는 사용자가 `sb.auth.updateUser` 로 마음대로 쓸 수 있어 남이 아닌 본인이라도 시각을 앞당기거나 지울 수 있다. 파기 근거는 서비스롤만 쓰는 app_metadata 여야 한다.
- **반론 2**: "pg_cron + pg_net 으로 기존 API(purge)를 부르는 편이 코드 재사용이다." → 격파: 그 경로는 비밀 토큰을 DB 금고와 Vercel 양쪽에 두고, 계정별 삭제가 HTTP 여러 번으로 쪼개져 중간 실패 시 반쯤 지워진 계정이 남는다. SQL 함수는 계정 하나를 한 트랜잭션(하위 트랜잭션)으로 지워 실패하면 통째로 되돌리고, 밖으로 나가는 통신·비밀값이 없다.
- **선택**: 서버 기록 = auth app_metadata `deletion_requested_at`, 파기 = `ourgoal_private.account_purge_run` SQL 함수(SECURITY DEFINER, 비공개 스키마) + pg_cron 매일 예약(꺼진 채 설치).

---

## 1. [원칙 ①] 문제 정확히 파악 — 지시 원문(요지)
- R1 탈퇴 버튼이 `api/withdraw.js` 요청 모드를 불러 신청 시각을 **서버에** 기록(기기 의존 제거). 30일 안 재로그인 시 어느 기기에서든 복구 안내, 복구하면 서버 기록 삭제.
- R2 파기 실행: 서버 기록 + 30일 지난 계정만. `dry-run`(대상 계정 수·표별 행 수만, 삭제 없음)과 `purge`(삭제 후 같은 조건 재조회로 잔여 0·오류 0일 때만 ok, 못 센 것은 null=실패). auth 사용자 삭제 포함. 한 번 상한(50계정), 실행 기록(누가·언제·몇 건, 개인정보 없이).
- R3 매일 자동 실행을 Supabase 안에서(pg_cron 또는 SQL 함수). SQL 파일(설치·되돌리기·확인)과 [손 필요] 클릭 단위 안내(설치 → dry-run 확인 → 예약 켜기). 예약은 꺼진 채 설치.
- R4 고지 정정: 앱 탈퇴 팝업·docs/legal/privacy.md·약관을 실제 구현과 문장별 일치. 법정 보존 기록은 실제로 보관하는지 코드로 확인해 사실대로.
- R5 시험: 모의 Supabase 로 ① 29일 대상 아님·31일 대상 ② dry-run 삭제 0 ③ purge 잔여 0, 오류 시 ok:false ④ 복구 시 서버 기록 삭제 ⑤ 처리 상한. `npm test` 종료코드 0. 실서버·레벨 5 는 못 했다고 정직하게.
- R6 문서: REQ/PLAN, claims.json, TICKETS 1줄, dev_log.
- R7 커밋·push·PR(본문 맨 위 '되돌릴 수 없는 삭제 — 안전장치 목록'), 법정 판정 기록.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **[본질]**: "30일 후 파기"는 시각을 아는 서버와, 그 시각을 매일 보는 실행기, 지운 것을 다시 세는 검증 셋이 있어야 사실이 된다. 지금은 셋 다 없다.
- **[원인]**:
  1. 신청 시각이 `state.profile.settings.pendingDeletionAt`(이 기기)과 사용자가 쓸 수 있는 user_metadata 에만 있다(`submitWithdrawAccount`, index.html).
  2. `api/withdraw.js` purge 모드는 호출처 0·오류 미검사·잔여 미측정·대상 표가 운영과 다름(PR #357 실측). 크론 없음.
  3. 복구 창(`checkPendingDeletionRestore`, js/auth-safety.js)이 이 기기 표시만 본다.
  4. privacy.md·약관·앱 안 방침이 "즉시 파기"·"법정 기간 보관"을 말하지만 그런 처리가 없다.
- **[중심]**: 서버 기록 칸 하나(`auth.users.raw_app_meta_data->>'deletion_requested_at'`)를 API·SQL·클라이언트가 똑같이 읽는다.
- **[핵심]**: 되돌릴 수 없으므로 — 꺼진 예약, dry-run 먼저, 계정 단위 원자적 삭제, 재조회 0 검증, 상한 50, 목록 밖 사용자 외래키가 있으면 거부, API 로 호출 불가, 실행 기록에 개인정보 없음.

### 2-1. 보존 의무 기록 실측 (R4)
| 법령 | 보관 대상 | 코드 실측 | 고지 |
| :-- | :-- | :-- | :-- |
| 전자상거래법(3년) | 계약·결제·분쟁 처리 기록 | 결제·주문 코드 0(`index.html`·`api/**` 에 결제 API 없음). `credit_ledger` 는 무상 크레딧 | 보존할 기록 없음 |
| 통신비밀보호법(3개월) | 접속 기록 | 앱 DB 는 `events`(user_id 없음, 익명 sid)뿐. 별도 접속 로그 표 없음 | 따로 보관하지 않음 |
| (참고) 문의 사본 | `api/track.js` 가 문의를 `inquiries` + 노션 DB + 텔레그램으로 보냄 | `inquiries` 는 파기, 노션·텔레그램 사본은 파기 범위 밖 | "파기되지 않는 것"에 명시, 이메일 요청 시 삭제 |

## 3. [원칙 ③] 해결방식 — 설계 결정
| 결정 | 이유 |
| :-- | :-- |
| 서버 기록 = auth app_metadata `deletion_requested_at` (새 칸·DDL 없음) | 서비스롤만 쓸 수 있고, `getUser()` 로 어느 기기에서나 읽히며, SQL 이 `auth.users` 에서 바로 읽고, 계정 파기 때 함께 사라진다 |
| `api/withdraw.js` `recordDeletionRequest`·`clearDeletionRequest` 는 쓴 뒤 `getUserById` 로 다시 읽어 확인될 때만 ok | "기록했다"는 선언이 아니라 측정. 실패하면 화면은 로그아웃하지 않고 오류를 알린다 |
| 파기 = SQL 함수 `ourgoal_private.account_purge_run(p_mode, p_limit, p_run_by)` + pg_cron `ourgoal-account-purge-daily`(18:30 UTC) | 동결(vercel.json·워크플로)을 피하고, 비밀값·외부 통신 없이 계정 단위 트랜잭션으로 지운다(반론 2) |
| 대상 표 목록은 PR #357 의 운영 실측 목록 + `credit_ledger`(auth.users 외래키, cascade 없음 — 빠지면 auth 삭제가 막힘)·`template_copies`·`inquiries`·`app_evaluations`·`user_action_logs`·`user_interactions`·`goals_backup`·`checkins_backup` | 화면 코드가 쓰는 표(`sb.from(...)`)와 docs/sql 의 `create table` 전수에서 사용자 칸을 가진 표. 없는 표·칸은 건너뛴다 |
| API `PURGE_TARGETS` 와 SQL `account_purge_targets()` 는 같은 목록, 시험이 대조 | 두 곳이 어긋나는 것을 막는다 |
| 옛 방식 신청(서버 기록 없음)은 자동 파기 대상이 아니다. 로그인 시 "서버에 기록되지 않아 자동 파기 대상이 아님"을 사실대로 안내 | #658 이 그 사용자들에게 "자동 파기 안 함"이라고 고지했다. 조용히 지우면 고지와 어긋난다 |
| 본인 즉시 삭제(`mode:'purge'`)는 PR #357 코드(확인 문구·재조회)로 교체만, 화면 연결은 안 함 | 기존 무검증 경로를 안전하게 고치되 범위를 늘리지 않는다 |

### 3-1. 전수 인터랙션 명세표
| UI 요소 | 위치 | 액션 | 기대 동작 | 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#withdrawConfirmBtn` | 탈퇴 창 | 클릭 | `submitWithdrawAccount()` → `fetch('/api/withdraw', {mode:'request'})` → ok 면 이 기기 표시 저장·`sb.auth.signOut()` | 성공 토스트 / 실패 시 로그아웃 없이 오류 토스트·버튼 복구 |
| `#btnRestoreAccount` | 로그인 직후 복구 창 | 클릭 | `checkPendingDeletionRestore()` 안에서 `callWithdrawApi(sb,'restore')` → ok 면 진입 | 성공 토스트 / 실패 시 로그아웃(앱 진입 차단) |
| `#btnCancelRestore` | 복구 창 | 클릭 | 로그아웃, 신청 유지 | 로그아웃 안내 |

### 3-2. 문장 ↔ 실제 동작 대조표 (R4)
| 고지 문장(새) | 실제 코드 |
| :--- | :--- |
| 신청 시각이 서버에 기록되고 이 기기에서 로그아웃 | `submitWithdrawAccount` → `recordDeletionRequest`(app_metadata) → 재조회 확인 → `signOut` |
| 서버에 기록되지 않으면 탈퇴 신청이 되지 않고 오류 | `wBody.ok !== true` 면 throw, 로그아웃 전 |
| 30일 안에 어느 기기에서든 다시 로그인하면 복구 안내, 복구는 서버 기록 삭제 | `readServerDeletionRequest`(getUser → 세션) → 복구 창 → `clearDeletionRequest` + 재조회 |
| 30일이 지나면 복구 불가·앱 진입 불가 | `remainDays <= 0` → `logoutFn` |
| 매일 한 번 서버 파기 작업이 차례대로(하루 최대 50계정) 삭제 | pg_cron `30 18 * * *` → `account_purge_run('purge', 50, 'cron')`, `order by` 신청 시각 |
| 파기되는 것: 목표·체크인과 백업·프로필·피드 글·보낸 메시지·신고·알림 구독·문의 원장·로그인 계정·인증 감사 로그 | `account_purge_targets()` 21개 칸 + `auth.audit_log_entries`(actor_id) + `auth.users` |
| 파기되지 않는 것: 받은 메시지, 익명 통계, 노션·텔레그램 사본, 위탁사 로그·백업 | `receiver_id` 미대상, `events` 미대상, `api/track.js` 외부 전송 |
| 법령 보존 기록 없음 | 2-1 실측 |

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- 실서버에서 아무것도 실행하지 않았다. postgres 역할의 `delete from auth.users` 권한, pg_cron 존재, 운영 트리거는 dry-run·check.sql [3] 으로 확인해야 한다.
- 운영 표의 실제 칸 이름은 docs/sql·화면 코드 기준이다. 없거나 다르면 건너뛰며(`target_exists`), 빠진 사용자 외래키는 `uncovered` 로 잡혀 purge 가 거부된다. 외래키 없이 사용자 id 를 담는 새 표는 이 방어선에 안 걸린다(목록 갱신 필요).
- Vercel `SUPABASE_SERVICE_ROLE_KEY` 가 없으면 탈퇴 신청이 실패로 표시된다(조용히 성공한 척하지 않음).
- Supabase 플랫폼 백업·노션·텔레그램 사본은 지우지 못한다 — 고지에 적었다.

## 5. [원칙 ⑤] 해결 절차
1. `api/withdraw.js`: `DELETION_KEY`·`recordDeletionRequest`·`clearDeletionRequest`·`deletionStatus`·`purgeUserData`(#357)·`PURGE_TARGETS`.
2. `index.html` `submitWithdrawAccount`·`openWithdrawModal` 문구·`showLegalModal` 제3·4·5조. `js/auth-safety.js` `readServerDeletionRequest`·`callWithdrawApi`·`checkPendingDeletionRestore`.
3. `docs/sql/2026-10-04-account-purge-{install,check,enable,rollback}.sql` + README + PGlite 시험.
4. `docs/legal/privacy.md` 제3·4·6조, `docs/legal/terms.md` 제5조.
5. `scripts/test-account-purge.js`(13건), `scripts/smoke-test.js` 새 검사 2개·고정 문구 2곳 교체, `tests/account-withdrawal-modal.test.js`.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론 1 "예약을 켠 순간 옛 신청자까지 지워진다" → 대상 조건은 app_metadata 칸뿐. PGlite 시험 [2] 에서 user_metadata 만 있는 계정은 `legacy_pending` 건수로만 나오고 처리 0.
- 반론 2 "삭제 중간에 실패하면 반쯤 지워진 계정이 남는다" → 계정마다 하위 트랜잭션. 시험 [4] 에서 실패 계정의 행 수가 실행 전과 같고, [5] 에서 삭제 뒤 다시 생긴 행도 실패로 잡아 통째로 되돌림.
- 반론 3 "누구나 RPC 로 파기 함수를 부를 수 있다" → 비공개 스키마 + `revoke`. 시험 [8] 에서 anon·authenticated 거부.

## 7. [원칙 ⑦] 단계별 실행 기준
- 각 파일 수정 뒤 `node scripts/test-account-purge.js`, SQL 수정 뒤 PGlite 시험, 마지막에 `npm test` 종료코드 0.

## 8. [원칙 ⑧] 막히는 지점 예상
- 법정은 로그인 뒤 화면(탈퇴 창·복구 창)을 못 연다 → `needs-login` 으로 낸다.
- 기준 커밋의 smoke 검사 2개(ES-158·ES-271)가 옛 고정 문구로 깨진다 → `retire` 에 사유.
- 실서버 확인은 [손 필요](README) — 설치·dry-run·켜기.
