# [손 필요] 탈퇴 30일 후 자동 영구 파기 — 실행 안내 (#TASK-ES-351)

왜 손이 필요한가: 파기 함수와 매일 예약(pg_cron)은 Supabase 대시보드의 SQL Editor 에서만 설치할 수 있고, 세션에는 그 권한(관리자 로그인)이 없다. vercel.json 크론·GitHub 워크플로는 동결이라 예약을 DB 안에 둔다.

**되돌릴 수 없는 삭제다.** 예약을 켠 뒤 30일이 지난 탈퇴 신청 계정은 다음 03:30(KST) 실행에서 영구 삭제되고 복구할 수 없다.

| 파일 | 하는 일 | 되돌리기 |
| :-- | :-- | :-- |
| `2026-10-04-account-purge-install.sql` | 파기 함수·실행 기록 표·매일 예약을 만든다. **예약은 꺼진 채로** 만들어진다 | `2026-10-04-account-purge-rollback.sql` |
| `2026-10-04-account-purge-check.sql` | 블록별 확인 쿼리. [2] 가 dry-run(삭제 0, 건수만) | 해당 없음 |
| `2026-10-04-account-purge-enable.sql` | 예약 켜기 | 같은 파일 맨 아래 주석 한 줄(끄기) 또는 rollback |
| `2026-10-04-account-purge-rollback.sql` | 예약 삭제·함수 삭제(앞으로의 파기를 멈춤. 이미 파기된 것은 못 돌린다) | install 을 다시 실행 |
| `2026-10-04-account-purge-test.mjs` | 세션이 로컬 Postgres(PGlite)로 위 SQL 을 돌려 본 시험(43/43). 실서버 확인이 아니다 | — |

## 언제 하나

- 앱 변경(PR)이 병합·배포된 뒤부터 탈퇴 신청이 서버에 기록된다. 그 전에 신청한 계정(서버 기록 없음)은 자동 파기 대상이 아니다.
- 가장 이른 파기 대상은 **배포일 + 30일**이다. 그러니 아래 1~3번을 **배포 후 30일 안에** 끝내면 앱 안내("30일 후 서버에서 영구 파기")가 처음부터 사실과 맞는다. 배포 전에 미리 해 두어도 된다(대상 0건이라 아무것도 지우지 않는다).

## 1) 설치 (예약은 꺼진 채)

1. 브라우저에서 https://supabase.com/dashboard 에 로그인한다.
2. 아워골 프로젝트를 누른다.
3. 왼쪽 메뉴에서 **SQL Editor** 를 누른다.
4. 오른쪽 위 **+ New query** 를 누른다.
5. `2026-10-04-account-purge-install.sql` **전체**를 붙여넣고 **Run**.
6. 맨 아래 결과에 `ourgoal-account-purge-daily | 30 18 * * * | false` 한 줄이 나오면 성공(꺼진 예약).
   - `extension "pg_cron" is not available` 같은 오류면: 왼쪽 **Database** → **Extensions** → 검색창에 `pg_cron` → 스위치를 켠다 → 5번부터 다시.

## 2) dry-run 결과 확인 (아무것도 지우지 않는다)

1. SQL Editor → **+ New query** → `2026-10-04-account-purge-check.sql` 의 **[1]** 두 줄을 붙여넣고 **Run** → `active` 가 `false`, `purge_function_installed` 가 `1`.
2. 창을 비우고 **[2]** 한 줄(`select ourgoal_private.account_purge_run('dry-run', 50, 'manual');`)을 **Run**. 나온 JSON 에서:
   - `"ok": true`
   - `"uncovered": []` — **비어 있지 않으면 멈추고 세션에 알린다**(목록에 없는 사용자 표가 있다는 뜻. 이 상태에서는 purge 가 스스로 거부된다)
   - `"due_total"` — 지금 파기 대상 계정 수. 배포 직후에는 0 이 정상
   - `"rows_by_table"` — 대상 계정의 표별 행 수(지울 예정인 양)
   - `"legacy_pending"` — 서버 기록 없이 옛 방식으로 신청된 계정 수(자동 파기 대상 아님. 숫자만 기록해 둔다)
3. 창을 비우고 **[3]** 을 **Run** → **결과 0행이 정상.** 행이 나오면 멈추고 세션에 알린다(삭제할 때 다른 표로 복사하는 트리거가 있다는 뜻).

## 3) 예약 켜기

1. SQL Editor → **+ New query** → `2026-10-04-account-purge-enable.sql` **전체**를 붙여넣고 **Run**.
2. 결과에 `active` 가 `true` 인 한 줄이 나오면 끝. 이제 매일 03:30(KST)에 최대 50계정씩 파기한다.

## 다음 날 확인

- `check.sql` 의 **[4]** → 맨 위 줄 `run_by = cron`, `ok = true`, `failed = 0`.
- `check.sql` 의 **[5]** → `status = succeeded`.
- `ok = false` 면: `error_codes` 를 세션에 알린다. 실패한 계정은 한 행도 지워지지 않은 채로 남고 다음 날 다시 시도된다.

## 멈추기·되돌리기

- 잠깐 멈추기: `enable.sql` 맨 아래 주석의 `active := false` 한 줄을 실행.
- 완전히 없애기: `2026-10-04-account-purge-rollback.sql` 전체 실행 → 결과 `purge_jobs_left = 0`.
