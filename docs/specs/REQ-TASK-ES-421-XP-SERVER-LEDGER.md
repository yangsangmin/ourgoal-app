# REQ/PLAN — TASK-ES-421 K-XP1 EXP(레벨)를 서버 원장으로 이관

> 상민님 결심 원문(2026-10-05): **"레벨 서버에 저장해야지"** — 승인선 ② 개인정보 수집 확대 승인. 권장안 조건 그대로: **본인만 읽는 표, 백업 먼저, 이관 확인 뒤 기기 쓰기 중단.**
> 설계 정본: `docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md` §8-3 K-XP1 · `docs/specs/LEDGER-DESIGN-2026-10-04.md` M01·2-5·2-6·부록 A-2.
> 범위: 표 SQL(+되돌리기) · `js/avatar/xp.js` 저장 어댑터 · `index.html` loadProfile 한 줄(줄 수 변화 0) · 탈퇴 파기 목록(`api/withdraw.js`·퍼지 설치 SQL) · 부품 시험 · 실계정 하네스 · 이 REQ · claims · dev_log · TICKETS. 지급 규칙(XP_RULES·지급 호출처 21곳)·레벨 계산(xpForLevel·levelForXP) 변경 0.

## 1. [원칙 ①] 문제 정확히 파악

- EXP 합계·이력은 `state.profile.settings.xp = { total, log[최근 200] }` 에만 있고, 이 값은 기기 localStorage(`ourgoal_settings_<uid>`, 전체 사본 `ourgoal_guest_profile`)에만 저장된다. 서버 왕복 없음(원장 설계서 M01).
- 결과: 폰을 바꾸거나 브라우저 데이터를 지우면 레벨이 1로 돌아간다. 같은 사람이 두 기기를 쓰면 기기마다 레벨이 다르다.
- 운영 실측(2026-10-05, 관리 토큰 집계): `user_ledger_docs` 표 없음(0), `users.id` 형 uuid, 자동 파기 목록 함수 `ourgoal_private.account_purge_targets` 있음, users 30행·auth.users 44행.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 사용자가 쌓은 성장 기록(EXP)은 사용자의 자산이다 — 기기가 아니라 서버 원장에 있어야 한다(헌법 E4·ARTICLE_15 Server-First).
- **원인**: EXP 저장이 처음부터 `settings`(기기 설정 묶음) 안에 들어갔고, 서버에 둘 표가 없었다.
- **중심**: 저장 위치를 아는 곳은 `js/avatar/xp.js` 의 어댑터 `xpStore` 하나다(#TASK-ES-395 가 미리 모아 둠). 읽는 곳 13곳은 `settings.xp.total` 글자를 직접 읽는다.
- **핵심**: 읽는 곳 13곳·지급 호출처 21곳을 건드리지 않고, ① 서버에 본인만 읽는 문서 1개, ② 첫 로그인 때 합쳐 올리고 되읽어 확인, ③ 확인 뒤에만 기기 설정 저장에서 xp 를 뺀다.

## 3. [원칙 ③] 해결방식

### 3-1. 서버 표 (`docs/sql/2026-10-05-xp-ledger.sql`)
- `public.user_ledger_docs(user_id uuid, doc_key text, data jsonb, rev bigint, updated_at timestamptz, device_id text, PK(user_id, doc_key))` — 문서 이름 검사(`^[a-z][a-z0-9_]{0,31}$`), 크기 256KB 상한.
- 트리거 `user_ledger_docs_bump`: insert 면 rev=1, update 면 rev=이전+1, updated_at=now() — 앱은 「읽은 판(rev)과 같을 때만」 갱신한다(동시 쓰기 감지).
- RLS 켬. 정책 3개(authenticated 만): `uld_select_own`·`uld_insert_own`·`uld_update_own` = `user_id = auth.uid()`. delete 정책 없음. **anon 은 표 권한 자체를 회수**(`revoke all … from anon`).
- 외래키 없음(있으면 자동 파기가 UNCOVERED_FK 로 멈춤) → 대신 파기 목록에 추가: `ourgoal_private.account_purge_targets()` 21번(users 앞), `api/withdraw.js` PURGE_TARGETS, 설치 SQL `2026-10-04-account-purge-install.sql`(세 곳 같은 목록 — `scripts/test-account-purge.js` 가 대조).
- 반복 실행 안전, 지우는 문장 없음. 되돌리기 `docs/sql/2026-10-05-xp-ledger-rollback.sql` = 정책·권한만 거둠(표·행 보존 — 표 삭제는 승인선 ③ 이라 넣지 않음).

### 3-2. 문서 모양 `user_ledger_docs['xp'].data`
`{ v:1, total:number, log:[{ id, amount, reason, at }] (최신순 200건), seen:[id…] (최근 2000개, 이미 반영한 지급 id) }`

### 3-3. 이관 규칙 (기기별 1회 · `migrateXp`)
1. **대상**: Supabase 로그인 세션이 있고 세션 사용자 id = 지금 프로필 id 인 사람. 게스트·세션 없는 로그인(구글 직접·빠른 복구 등)은 지금처럼 기기 `settings.xp`.
2. **백업 먼저**: 기기 `settings.xp` 원문을 `ourgoal_xp_premigration_<uid>` 에 한 번 남긴다(이미 있으면 덮지 않음). 백업 실패면 이관하지 않는다.
3. **옛 이력 id**: 2단계 전 항목은 id 가 없으므로 `l:<시각>|<양>|<사유>`(같은 글자가 여럿이면 오래된 것부터 `#2`,`#3`).
4. **서버에 없으면** 기기 값 그대로 올린다(insert).
5. **서버에 이미 있으면 합친다** (`mergeXpDocs(서버 S, 기기 C)`):
   - 이력 = S 이력 ∪ (C 이력 중 S 가 본 적 없는 id) — 시각 최신순, 200건.
   - 합계 = S.total + (새로 더한 이력 합) + max(0, C 의 이력 밖 몫 − S 의 이력 밖 몫). 이력 밖 몫 = 합계 − 이력 합(200건 넘어 잘린 것, 이력 없는 첫 체크인 +5 등).
   - 따라서 **합계는 두 합계 중 큰 쪽 이상**이고(덮어쓰기 없음), 같은 판을 다시 합쳐도 늘지 않는다(멱등). 두 기기의 서로 다른 지급은 모두 남는다.
6. **이관 확인**: 쓴 뒤 서버를 다시 읽어 합친 판과 같을 때만(키 순서 무관 비교 `sameXpDoc`) 확인 시각을 기기 사본에 적는다. 다르면 확인하지 않고 기기 모드로 계속(다음에 재시도).
7. **확인 뒤 기기 쓰기 중단**: `settings.xp` 를 원장 메모리 판을 가리키는 **열거되지 않는 칸**으로 바꾼다 → 읽는 곳 13곳은 같은 글자로 합계를 읽고, `saveLocalSettings`·`saveProfile`(전체 사본)의 JSON 에는 xp 가 빠진다. 옛 `ourgoal_settings_<uid>` 안의 xp 는 지우지 않고(다음 저장 때 자연히 빠짐) 다시 읽히면 합치기 대기열로 넣는다(멱등이라 늘지 않음).

### 3-4. 확인 뒤 지급·동기화 (`ledgerRecord` · `pushXp`)
- `awardXP` 는 지금과 같은 글자로 메모리 판에 더한 뒤 `ledgerRecord` 로 이력 항목에 id 를 달고 대기열(pending)에 넣는다.
- 동기화: 서버 판을 읽어 → (대기 중인 합치기) → 대기열을 id 중복 없이 얹고 → `rev` 가 같을 때만 갱신. 0행이면(다른 기기가 먼저 씀) 다시 읽어 3번까지 재시도.
- 실패·오프라인: 기기 사본 `ourgoal_ledger_cache_<uid>` = `{ xp: { doc, pending, importQ, rev, confirmedAt } }` 에 보관하고 5초 점검·`online` 이벤트에 다시 보낸다(실패 뒤 30초 쉼).
- 다시 열기: `loadProfile` 한 줄에서 `attachLedger` 가 기기 사본으로 **동기적으로** 붙여 첫 화면부터 합계가 맞고, 서버 맞추기는 뒤에서 한다.
- 이력 없이 합계만 바꾸는 우회(`triggerFirstCheckinCelebrationModal` 의 `settings.xp.total += 5`)는 다음 점검에서 차이를 `log:false` 대기 항목으로 바꿔 잃지 않는다(이력 모양은 그대로).
- 합계가 바뀌면 홈 링(`notifyXpGained(0, total)`)·상단(`window.updateTopBar`)·레벨 배지(`L.renderLevelBadge`)를 다시 그린다.

## 4. [원칙 ④] 재검토

- **설계서와 다른 점**: 설계서 부록 A-2 는 user_id text·정책 없음·`/api/track sync_ledger` 경유였다. 운영 users.id 가 uuid 이고, 결심 조건 「본인만 읽는 표」를 DB 가 직접 지키도록 RLS 본인 정책으로 했다(서버 함수 추가 없이 앱 → Supabase 직접, 다른 표와 같은 길).
- **이력 표(user_ledger_docs_history)** 는 이번에 만들지 않는다: EXP 합치기가 줄어들지 않는 방향이고 기기에 이관 직전 원문을 남긴다. 다른 문서(prefs 등) 이관 때 다시 판단.
- **게스트 → 회원 전환 때 게스트 EXP 이관**(설계서 위험 6)은 `migrateGuestDataToUser` 범위라 이번에 바꾸지 않았다(지금과 같음).
- **남의 레벨 표시(K4)** 는 별도 결심 — 이 표는 본인만 읽으므로 남의 레벨을 공개하지 않는다.

## 5. [원칙 ⑤] 절차

1. Step 0: 지시함·직전 커밋·설계서 정독, 운영 사전 집계(표 0·uuid·파기 함수 1).
2. SQL 작성 → 운영 적용(관리 토큰, 세션 직접) → 2회 실행(반복 안전) → 정책 3·anon 권한 0·RLS 켬·파기 목록 포함 확인.
3. `js/avatar/xp.js` 어댑터 + 원장 부분, `index.html` loadProfile 같은 줄 연결, 파기 목록 3곳.
4. 부품 시험 `tests/xp-server-ledger-es421.test.js`(npm test 경로 `scripts/test-shipyard-modular.js`).
5. 신고서 `module-specs --write` → `module-guard --update` → 세포지도 `cell-map-export`.
6. 실계정 하네스 `docs/design/harness/real-account-xp-ledger-es421.js`(수명주기 4단계 + B→A + anon).
7. 기준(git archive 사본) 대 작업 npm test, 커밋, PR, 법정 판정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: 「`settings.xp` 를 숨은 칸(접근자)으로 바꾸는 것은 꼼수다. 읽는 13곳을 `xp.read` 로 고쳐야 한다.」 → 13곳을 고치면 index.html 인라인 줄·호출처를 대량으로 만지게 되고(#TASK-ES-395 가 피하려던 「두 번 만지기」), 지급·표시 동작의 전후 0 증명이 어려워진다. 접근자는 저장 위치만 바꾸고 읽는 글자는 그대로라 화면 결과가 같다. 숨기는 것은 CSS 은폐가 아니라 **기기 JSON 직렬화에서 빼는 것**(= 결심 조건 「기기 쓰기 중단」 그 자체)이며, 부품 시험·실계정 하네스가 `ourgoal_settings_<uid>`·전체 사본에 xp 가 없음을 잰다.
- **반론 2**: 「합계를 '큰 쪽'으로만 하면 두 기기의 지급 중 하나를 잃는다. 반대로 단순 합이면 같은 기록이 두 번 더해진다.」 → 이력은 id 합집합으로 더하고(같은 지급은 한 번), 이력 밖 몫만 큰 쪽을 쓴다. 그래서 결과는 항상 두 합계 이상이면서 같은 판 재합치기에 늘지 않는다 — 부품 시험이 「60+35(이력 밖 5) → 95」, 「재합치기 불변」, 「200건 초과 합계 보존」, 「판 충돌 뒤 양쪽 지급 모두 남음」을 잰다.
- **반론 3**: 「세션 없는 로그인 사용자는 계속 기기에만 있다.」 → RLS 가 auth.uid() 로 본인을 가리므로 세션 없는 요청은 표를 읽을 수 없다(서비스 롤 API 를 새로 열면 본인 확인 통로를 따로 만들어야 함). 이들은 지금과 똑같이 동작하고(손실 없음), 세션 로그인을 하는 순간 이관된다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

| 종류 | 식별자 |
| :-- | :-- |
| 파일 | `js/avatar/xp.js`, `index.html`(loadProfile 1줄·스크립트 버전), `docs/sql/2026-10-05-xp-ledger.sql`, `docs/sql/2026-10-05-xp-ledger-rollback.sql`, `docs/sql/2026-10-04-account-purge-install.sql`, `api/withdraw.js`, `tests/xp-server-ledger-es421.test.js`, `scripts/test-shipyard-modular.js`, `docs/design/harness/real-account-xp-ledger-es421.js` |
| 함수 | `xpStore`, `awardXP`, `attachLedger`, `ensureLedger`, `migrateXp`, `pushXp`, `syncLedger`, `mergeXpDocs`, `applyXpOps`, `normalizeXpDoc`, `sameXpDoc`, `installLedgerView`, `captureDrift`, `ledgerRecord`, `refreshXpViews`, `backupBeforeMigration` |
| 표·정책 | `public.user_ledger_docs`, `uld_select_own`·`uld_insert_own`·`uld_update_own`, 트리거 `user_ledger_docs_bump`, `ourgoal_private.account_purge_targets` |
| 기기 키 | `ourgoal_ledger_cache_<uid>`, `ourgoal_xp_premigration_<uid>` |
| DOM | `#levelBadgeRow`, `#homeHeroExpBar`, `#captureInput`, `#captureSave`, `#avatarCelebrationToast` |
| 공개 키트 | `OurgoalAvatarParts.xp.attachLedger`, `OurgoalAvatarParts.xp.ledger.{sync,tick,status,…}` |

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

- 막힐 지점: ① 부품 시험이 index.html 함수를 잘라 돌릴 때 `_xp` 가 없음 → 연결 줄을 `window.OurgoalAvatarParts.xp` 확인형으로(실측으로 발견·해결). ② 새 기기 복원 때 레벨 배지가 0 으로 남음 → 합계 변화 시 `renderLevelBadge` 호출(실계정 하네스에서 발견·해결). ③ 법정 PC 화면은 로그인을 못 함 → 로그인 동작은 unverified(needs-login), 게스트 불변은 시나리오.
- 측정(작업자, 판정 아님): `reports/TASK-ES-421/` 의 운영 SQL 결과·부품 시험·실계정 하네스 JSON.

* **진행 단계**: [4단계: 심사 청구]
