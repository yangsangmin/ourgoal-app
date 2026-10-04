# 요구사항 정의서 (REQ) — #TASK-ES-365 계정 전환 시 이전 사용자 로컬 데이터 유출·오염 차단

> **문서 ID**: REQ-TASK-ES-365-ACCOUNT-SWITCH
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-09 (P0 개인정보)
> **작성 일시**: 2026-10-04
> **작성자**: Claude Code 세션 (CORE-09 빌더)
> **기준 커밋**: origin/main e88fba6

## 지시 원문 (작업 지시서에서 옮김)

- 실측된 결함(2026-10-04 23:21 실계정 하네스, 실서버): 시나리오 RA-CORE-SWITCH 실패 — 같은 브라우저에서 계정 A 로그아웃 → 계정 B 로그인 후, B 프로필 상태(profileIsB:true)인데 A 가 남긴 기록 글자가 B 화면에 1건 보임(aTextOnB:1). 가짜 서버 시험(PR #665)에서는 그 기록이 B 소유로 덮어써져 서버에 올라가기도 했다.
- 목표: 로그아웃·계정 전환 때 이전 사용자의 로컬 데이터(기록·목표·설정 사본, localStorage ourgoal_* 등)를 정리하거나 사용자 id 로 분리하고, 서버 동기화(syncServerRecords 등)는 현재 로그인 uid 의 데이터만 올리게 한다. 게스트→로그인 첫 전환 시 게스트 데이터 이관 등 기존 의도된 흐름은 깨지 않는다(코드에서 의도 확인, 애매하면 보고).
- 부품 시험(tests/, npm test 경로)으로 A→로그아웃→B 시 B 화면·업로드 대상에 A 데이터 0건 증명. 법정 게스트 화면 주장이 가능하면 추가.
- 사용자 데이터를 지우는 동작은 "이전 사용자의 로컬 사본 정리"로 한정하고 서버 원장은 지우지 않는다. 화면에서 기능이 사라지면 멈추고 보고.
- 실계정 확인은 claims 에 unverified(needs-two-accounts)로 적고 작업자 실측 결과는 REQ 에 기록.

## 1. [원칙 ①] 문제 파악

- 실계정 재현(수정 전, 운영 앱, 작업자 실측 2026-10-04 23:27, runTag `ogtest-202610042327-uuus`): `RA-CORE-SWITCH` **실패**, `profileIsB: true`, `aTextOnB: 1`, 실패 단계 "B 기록 탭 — A 의 표식 기록 1건 보임". 정리(cleanup)는 A 소유 checkins 1행 삭제, 남은 것 0.
- 가짜 서버 재현(수정 전 origin/main, `--mock`): 같은 실패(`aTextOnB: 1`).
- 테스트 계정 B 의 서버 checkins: 재현 직후 B 소유 행 **0건**(작업자가 B 세션으로 자기 행만 건수 조회). 실서버에서는 B 세션의 A 기록 업로드가 RLS(남의 id 행 갱신 불가)로 거절된 것으로 보인다. 단, 업로드 **시도** 자체는 일어났다(부품 시험 수정 전 측정 `bUploadsWithA: 2`).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 이 기기에 남은 사본은 그 사본 주인에게만 돌아가야 한다. 다른 사람 데이터가 내 화면에 보이거나(유출) 내 이름으로 서버에 올라가면(오염) 안 된다.
- **원인(파일·함수)** — 모두 `index.html`:
  1. `loadProfile` 기록 복구: 서버 기록과 자기 백업(`ourgoal_records_backup_<uid>`)이 둘 다 비면 **localStorage 의 아무 `ourgoal_records_backup_*` 키**를 골라 `records` 로 쓰고 `upsertCheckinRows(sb, … toCheckinRow(r, userId))` 로 **새 uid 이름으로 서버에 올렸다**(#TASK-ES-035 "자가 치유"). 테스트 계정 B 는 기록이 0건이라 바로 이 길로 A 기록을 받았다 — RA-CORE-SWITCH 의 직접 원인.
  2. `loadProfile` 프로필 백업·동반자 백업: 같은 방식으로 다른 사람의 소개·관심·지역·잇템(`ourgoal_profile_backup_*`)과 동반자 목록(`ourgoal_companions_backup_*`)을 빌려 왔다.
  3. `loadProfile`·`syncServerRecords` 의 `/api/track sync_records` 요청: 이 기기의 다른 uid(직전 사용자 `ourgoal_current_user`, 다른 백업 키 접미사)를 `backupIds` 로 서버에 보냈다(서버 `api/track.js handleSyncRecords` 는 이미 인증 uid 로만 조회해 무시하지만, 다른 사람 uid 를 보내는 것 자체가 불필요한 전송).
  4. `migrateGuestDataToUser`: `ourgoal_guest_profile` 은 `saveProfile` 이 **로그인 사용자의 전체 사본**으로도 쓴다. 이관 조건이 `gData.id !== targetUserId` 뿐이라 로그아웃 없이 계정이 바뀌면 A 의 목표·기록이 B 로 이관·업로드됐다.
  5. 부팅 게스트 복구(`boot` 5단계): 게스트 사본에 기록이 없으면 다른 사람 기록·프로필 백업을 훑어 붙였다(새 게스트가 이전 사용자 기록을 봄).
  6. `syncServerRecords`: 응답을 기다리는 사이 계정이 바뀌어도 응답을 지금 화면 프로필에 합쳤다.
- **중심**: "사본 주인 판정" 규칙을 한 세포 `js/account-isolation.js` 로 모은다.
- **핵심**: 다른 uid 키를 훑는 경로를 없애고(정확히 그 uid 키만), 전체 사본은 게스트 id 일 때만 이관한다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자

| 항목 | 식별자 |
| :-- | :-- |
| 새 세포 | `js/account-isolation.js` (`window.OurgoalAccountIsolation`) — `isGuestId`, `readOwnCopy(prefix, uid, fallback)`, `canMigrateGuestCopy(copy, targetUid)`, `dropForeignSessionCopy(targetUid)`, `clearSharedSessionCopies()`, `ownRecordsOnly(records, uid)`, `isResponseForUid(responseUid, uid)` |
| 스크립트 태그 | `<script src="js/account-isolation.js?v=20261004-es365">` (record-ledger.js 다음) |
| `loadProfile` | 기록·프로필·동반자 백업을 `readOwnCopy` 로 이 uid 것만, 백업 재업로드는 `ownRecordsOnly`, `sync_records` 요청 `backupIds: [userId]`, 응답 `isResponseForUid` 확인 |
| `saveProfile` | checkins 업로드 행을 `ownRecordsOnly(recs, uidVal)` 로 거름 |
| `syncServerRecords` | `candidateIds = [uid]`, 응답 주인 확인 + 기다리는 사이 `state.profile.id` 가 바뀌었으면 합치지 않음, 다른 uid 백업 키 쓰기 제거 |
| `migrateGuestDataToUser` | `canMigrateGuestCopy` — 게스트 id 사본만 이관, 다른 로그인 사용자 사본은 `dropForeignSessionCopy` 로 버림 |
| `performLogout` | 기존 두 키 삭제 + `clearSharedSessionCopies()`(전체 사본·직전 사용자·uid 없는 `ourgoal_offline_sync_queue`) |
| `restoreSessionAndEnter` | `loadProfile` 전에 `dropForeignSessionCopy(session.user.id)`, 메모리 `state.profile` 이 다른 로그인 사용자면 비움 |
| 부팅 게스트 복구 | `readOwnCopy('ourgoal_records_backup_', gp.id)`·`readOwnCopy('ourgoal_profile_backup_', gp.id)` |
| 시험 | `tests/account-switch-isolation.test.js` (index.html 실제 함수 6개를 잘라 가짜 브라우저·RLS 흉내 가짜 Supabase·api/track.js 실제 처리기로 실행) + `scripts/test-shipyard-modular.js`(npm test 마지막 단계)에서 실행 |
| 세포 신고서 | `docs/architecture/modules.json` `account-isolation`(organ) |

## 4. [원칙 ④] 재검토 — 다른 길과 비교

- **로그아웃 때 모든 `ourgoal_*` 를 지우기**: 가장 단순하지만 서버에 아직 못 올린 A 기록(오프라인 저장분)이 사라진다(데이터 손실, 헌법 GUARD_03). 기기 전용 키(구글 토큰 uid 키·잠금 PIN 등)도 함께 날아간다. → 택하지 않음.
- **uid 별 분리 + 다른 uid 읽기 금지(택함)**: uid 키는 이미 분리되어 있었고, 문제는 "남의 키를 빌려 읽는" 경로였다. 읽는 쪽을 막으면 A 의 미동기화 백업은 A 가 다시 로그인할 때 돌아오고, B 에게는 보이지 않는다. 계정 공용 키(전체 사본·직전 사용자·uid 없는 대기열)만 로그아웃 때 지운다.

## 5. [원칙 ⑤] 절차

1. 운영에서 수정 전 재현(완료, 1절).
2. `js/account-isolation.js` 작성, `index.html` 7곳 연결.
3. 부품 시험 작성 → 수정 전(origin/main index.html)·수정 후 둘 다 실행해 차이 측정.
4. `npm test`, 모의 하네스(`--mock`) 수정 전/후.
5. PR → Vercel 미리보기에서 `--only RA-CORE-SWITCH` 실계정 재생.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1: "#TASK-ES-035·#TASK-ES-036 의 자가 치유(다른 백업 키에서 복원)는 같은 사람이 id 가 바뀐 경우를 살리려던 것인데, 막으면 그 사람 데이터가 안 돌아온다."**
  격파: 한 기기에서 "id 가 바뀐 같은 사람"과 "다른 사람"을 로컬 키만으로는 구별할 수 없다. 구별 못 하는 채로 빌려 오면 이번처럼 남의 기록이 보이고 업로드된다. 같은 사람의 정당한 이관 경로는 둘 다 남아 있다: (가) 게스트 → 회원은 `migrateGuestDataToUser`(게스트 id 사본) 그대로, (나) 같은 uid 의 백업은 그대로 읽는다. 서버 원장(`checkins`)은 uid 로 묶여 있어 정상 로그인이면 서버에서 돌아온다. 남는 영향은 아래 "기본값" 1건이다.
- **반론 2: "로그아웃 때 uid 별 백업을 남기면 공용 기기에서 A 데이터가 기기에 남는다 — 정리가 덜 됐다."**
  격파: 남은 키는 A 의 uid 로만 읽히고 B·게스트 화면·업로드 어디에도 쓰이지 않는다(시험 ①②③). 지우면 A 의 미동기화 기록이 사라지는 손실이 생긴다. 공용 기기 완전 삭제는 이미 있는 "로그인 유지 해제" 경로(`js/auth-safety.js` pagehide 세션 토큰 삭제)와 별개의 정책 결정이라 이번 범위 밖으로 둔다.
- **[기본값]** 직접 입장(`loginWithDirectIdentifier`, 빠른 복구·테스터 B)으로 만든 `u_…` 같은 비게스트 id 의 전체 사본은 이제 다른 계정으로 이관하지 않는다(다른 사람 사본과 구별 불가). 화면 기능(버튼·탭)은 사라지지 않는다.

## 7. [원칙 ⑦] 즉시 실행 — 결과

- 부품 시험 `tests/account-switch-isolation.test.js`:
  - 수정 후: **6/6 통과**. 측정값 `aTextOnB 0`, `aBioOnB 0`, `aCompanionOnB 0`, `bUploadsWithA 0`, `bLocalCopiesWithA 0`, `offlineATextOnB 0`, `noLogoutATextOnB 0`, `syncIdsOtherThanB 0`, `aBackRestored 1`(A 재로그인 때 자기 백업 복원), `guestRecMigrated 1`·`guestGoalMigrated 1`·`guestRecOnServerAsB 1`(게스트 이관 유지), `sharedKeysLeft []`, `serverAKept true`.
  - 수정 전(origin/main index.html 을 `--html` 로): **1/6 통과**(게스트 이관 ⑤만). `aTextOnB 1`, `aBioOnB 1`, `aCompanionOnB 1`, `bUploadsWithA 2`, `bLocalCopiesWithA 1`, `syncIdsOtherThanB 1`.
- `npm test`(NODE_PATH 지정): 종료 코드 0, smoke 443 통과 0 실패, 무결성 38/38, 모듈 가드 통과, test-shipyard-modular 안 계정 전환 격리 시험 6/6.
- 모의 하네스 `--mock --only RA-CORE-SWITCH`: 수정 전(origin/main) **실패** `aTextOnB 1` → 수정 후 **통과** `aTextOnB 0`, `profileIsB true`.
- 실계정 하네스(작업자 실측, 판정 아님): 수정 전 운영 **실패**(1절). 수정 후 — 8절.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점

- 수정 후 실계정 재생: PR 의 Vercel 미리보기 주소로 `OG_APP_URL` 만 바꿔 `--only RA-CORE-SWITCH`. 결과는 아래에 적는다.
- 막히는 지점: 미리보기가 Vercel 로그인 보호로 막히면 실계정 재생을 못 한다 → 그때는 모의 하네스 결과로 배선만 확인했다고 적는다. 미리보기는 `index.html` 의 `SUPABASE_URL` 이 하드코딩이라 운영 Supabase 를 쓴다(테스트 계정 데이터만 만들고 지운다).
- 법정 게스트 화면 주장: 금고(`court/fixtures`)에 `guest-fresh` 하나뿐이라 "다른 사람 백업이 남은 기기" 상태를 시작 상태로 줄 수 없고, 미리보기 환경은 같은 게스트 id(`guest-preview-sanctuary`)를 다시 써서 화면 조작만으로 그 상태를 만들 수 없다. fixture 추가는 `court/**` 동결이라 이번에 하지 않는다.

### 수정 후 실계정 재생 결과

- (PR 생성 뒤 기록)

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
