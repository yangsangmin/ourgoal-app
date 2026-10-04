# 요구사항 정의서 (REQ) — #TASK-ES-345 구글 캘린더 토큰 계정 격리 (CAL-02)

> **문서 ID**: REQ-TASK-ES-345-GCAL-TOKEN-ISOLATION  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CAL-02 (task_id TASK-ES-345, P0)  
> **근거 원문**: 메모 08 "내가 지금 새로 로그인할때마다 구글 캘린더 연동을 다시 하게끔 되는데 … 원인파악하고 원인과 해결책 결과보고 해" · 메모 17 "사용자 계정 및 데이터 관리, 보관에 보안 취약점이나 해킹가능성이 없는지 확인하고 조치해야함"  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 (CAL-02)

## 지시 원문 (작업 지시서에서 옮김)

- 토큰은 현재 로그인 uid 키만 읽는다. `_last` 키 쓰기·읽기 제거, 아무 키 탐색 제거, 다른 uid 의 gcal 설정 복사 제거.
- 게스트→회원 전환(같은 사람) 경로가 있다면 그 경로는 명시적으로 유지하되 이유를 코드 주석·보고에 적는다(게스트 uid 키 → 새 uid 로의 1회 이전만 허용 등).
- 기존 `_last` 키는 다음 로드 때 지운다(남의 토큰 잔존 제거).
- 토큰 만료·부재 시 사용자에게 1줄 안내 + '다시 연결' 1탭(기존 연결 함수 재사용). 새 정보 수집·서버 저장 금지(서버 refresh token 보관은 상민님 결심 사항이라 범위 밖).
- 측정: ① uid A 토큰 저장 → uid B 로 restoreGoogleToken → null, A 토큰 사용 0 ② uid A 재로그인 시 A 토큰 복원 ③ `_last` 키 정리 확인 ④ 다른 uid 설정 복사 0. `npm test` 종료코드 기록. 실계정 2개 확인(레벨 5)은 못 했다고 정직하게 claims 에 적는다.

## 1. [원칙 ①] 문제 파악

origin/main `c634fc2` 의 `index.html` 에서 직접 확인한 통로:

| 위치 | 결함 |
| :-- | :-- |
| `restoreGoogleToken()` | 내 키 `ourgoal_gcal_token_v1_<uid>` 가 없으면 `ourgoal_gcal_token_v1_last`, 그것도 없으면 `ourgoal_gcal_token_v1_` 로 시작하는 **아무 키**나 읽는다. 메모리의 `state.googleToken` 이 유효하면 주인 확인 없이 그대로 돌려준다 |
| `saveGoogleToken()` | 내 키와 함께 계정 공용 `_last` 키, `ourgoal_gcal_email_last` 에도 쓴다 |
| `loadLocalSettings()` | 연동 설정이 없으면 `ourgoal_settings_guest`·직전 사용자(`ourgoal_current_user`)·`ourgoal_gcal_email_last` 에서 연동 표시·이메일·clientId·gcalSync 를 복사한다(#TASK-ES-265) |
| `isGoogleCalendarConnected()` | 게스트 설정·이메일 `_last`·`_last` 토큰·`localStorage.ourgoal_google_token` 을 근거로 연동됨으로 판정하고 다른 계정 이메일을 붙인다 |
| `migrateGuestDataToUser()` | 게스트 토큰을 `ourgoal_gcal_token_v1_guest || _last` 에서 읽는다(실제 게스트 id 는 `guest_xxxxxxx` 라 사실상 `_last` = 직전 계정 토큰) |
| 일정 캐시 `ourgoal_gcal_events` | uid 접미사 없는 공용 키 — 다른 계정이 불러온 구글 일정이 새 계정 달력에 그대로 그려진다 |
| 로그아웃 없는 계정 전환(`loginWithDirectIdentifier` 등) | 메모리의 `state.googleToken`·`state.gcalEventsCache` 를 비우지 않는다 |

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 한 기기에서 계정을 바꾸면 B 가 A 의 구글 토큰으로 A 의 일정을 읽고, A 의 이메일·일정 캐시가 B 화면에 보인다(타인 데이터 노출).
- **원인**: "재연동을 덜 하게" 하려고(#TASK-ES-265) 계정 경계가 없는 공용 키와 폴백을 만들었다.
- **중심**: 토큰·일정 캐시의 주인을 "현재 로그인 uid" 하나로 고정한다.
- **핵심**: 읽기 경로에서 공용 키·탐색·복사를 없애고, 남아 있는 공용 키는 로드 때 지운다. 재연동 부담은 1탭 '다시 연결'로 낮춘다(갱신 토큰 서버 보관은 범위 밖).

## 3. [원칙 ③] 해결 방식 — 구체 식별자

| 식별자 | 변경 |
| :-- | :-- |
| `GCAL_LEGACY_SHARED_KEYS`, `purgeLegacySharedGcalKeys()` (신규) | `ourgoal_gcal_token_v1_last`·`ourgoal_gcal_email_last`·`ourgoal_gcal_events`·`ourgoal_google_token`(localStorage) 삭제 |
| `gcalCurrentUid()`, `gcalEventsKey()` (신규) | 현재 uid, uid 별 일정 캐시 키 `ourgoal_gcal_events_<uid>` |
| `ensureGcalOwner()` (신규) | `state._gcalOwnerUid` 가 현재 uid 와 다르면 메모리 토큰·만료 토큰·일정 캐시·sessionStorage 토큰을 버린다 |
| `restoreGoogleToken()` | 현재 uid 키만 읽음, `_last`·전체 키 탐색 제거, `ownerUid` 가 다르면 거부, 로드 때 공용 키 삭제 |
| `saveGoogleToken()` | 현재 uid 키에만 저장 + `ownerUid` 기록, `_last`·이메일 `_last` 쓰기 제거 |
| `loadLocalSettings()` | 다른 uid·게스트·이메일 `_last` 에서의 gcal 설정 복사 제거, 공용 키 삭제 |
| `isGoogleCalendarConnected()` | 현재 uid 의 설정·토큰 키만 본다 |
| `migrateGuestDataToUser()` | **유지하는 예외**: 게스트 프로필 uid 키(`ourgoal_gcal_token_v1_<게스트 id>`, 구버전 `_guest`)만 새 uid 키로 1회 이전, 새 uid 에 자기 토큰이 있으면 덮지 않음, 이전 직후 게스트 키 삭제 |
| `gcalTokenStatus()` (신규) | `'valid'|'expired'|'missing'` |
| `#gcalStatusBox` → `#gcalReconnectNotice` + `#gcalReconnectBtn` (설정 > 고급 설정) | 연동돼 있는데 토큰이 없거나 만료면 1줄 안내 + '다시 연결' → `openGoogleCalendarConnectModal()` |
| `#calGcalMiniBadge` (일정 탭) | 같은 조건에서 '다시 연결' 배지(`data-gcal-state`) → `openGoogleCalendarConnectModal()` |
| `getGoogleAccessToken()`, `renderCalendarScreen()` | 시작 시 `ensureGcalOwner()` |
| `ourgoal_gcal_email_last` 쓰기 5곳·읽기 3곳 | 제거(힌트 이메일은 현재 계정 `settings.googleCalendarEmail` 만) |

## 4. [원칙 ④] 재검토

- 서버 경로 `syncServerRecords` → `/api/track` `sync_records` 는 `authenticateCaller` 로 `targetUid = authUid` 고정이라 다른 uid 설정을 내려주지 않는다(확인). 클라이언트가 보내는 `backupIds` 는 서버에서 무시된다. 이번 변경 범위 밖.
- 이미 오염된 사용자는 과거에 다른 계정 이메일이 `settings_ledger` 에 저장됐을 수 있다. 서버 원장 정정은 범위 밖(보고에 적음).

## 5. [원칙 ⑤] 절차

REQ → PLAN → 구현 → 헤드리스 측정(수정 전·후 같은 스크립트) → `npm test` → claims → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1**: "공용 키를 지우면 재연동이 늘어 메모 08 이 악화된다." → 같은 계정은 자기 uid 키에서 그대로 복원된다(측정 M2). 늘어나는 것은 *다른 계정 토큰을 빌려 쓰던* 경우뿐이며, 그것이 결함이다. 대신 만료·부재 시 1탭 '다시 연결'을 붙였다.
- **반론 2**: "게스트→회원 이전도 남의 토큰일 수 있다." → 이전 대상은 이 기기의 현재 게스트 프로필(`ourgoal_guest_profile`)의 uid 키뿐이고, 기존 #TASK-ES-224 게스트 데이터 이전과 같은 전제(같은 사람)다. 1회 이전 후 게스트 키를 지워 다음 계정이 다시 받을 수 없다. `_last` 는 읽지 않는다.

## 7. [원칙 ⑦] 단계별 실행

PLAN 문서 참조.

## 8. [원칙 ⑧] 막히는 지점 예상

- 법정은 로그인을 못 하므로 계정 전환 화면 동작은 `needs-login`/`needs-two-accounts` 로 "확인 못 함" 처리된다.
- 기존 smoke 검사 `[#TASK-ES-265]` 가 제거한 복사 코드의 글자(`candObj.googleCalendarConnected`)를 확인하므로 기준 시험지로는 깨진다 → `retire` 에 사유 기재.
