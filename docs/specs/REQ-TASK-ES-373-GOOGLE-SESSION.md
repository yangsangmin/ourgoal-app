# 요구사항 정의서 (REQ) — #TASK-ES-373 구글 로그인이 서명 검증 없는 자격증명의 이메일로 세션 없이 들어가던 결함

> **문서 ID**: REQ-TASK-ES-373-GOOGLE-SESSION
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-14 (P0 보안) · 앞선 작업 CORE-13(#TASK-ES-368, 빠른 복구 잠금)
> **작성 일시**: 2026-10-05
> **작성자**: Claude Code 세션 (CORE-14 빌더)
> **기준 커밋**: origin/main 46f8157 (#684 병합 뒤)
> **상민님 결정(2026-10-05)**: 선택지 A — "지금 병합해 구멍만 막고, 구글 로그인을 살릴지는 나중에 결정". 구글 공급자 켜기·예전 u_ 사용자 연결(3-2)은 하지 않는다. 따라서 병합 뒤 구글 로그인은 서버 검증 실패 → 정식 로그인 안내로 간다(입장 0, 데이터 삭제 0). 4절의 대시보드 절차는 나중에 살리기로 결정할 때 쓴다.

## 지시 원문 (작업 지시서에서 옮김)

- 결함: 구글 One-Tap(GIS) 로그인이 Supabase 세션 없이 들어오고, 자격증명 JWT 를 서명 검증 없이 클라이언트에서 해석해 이메일을 믿는다(index.html 구글 GIS 콜백 → loginWithDirectIdentifier, js/direct-login-guard.js 의 구글 경로: 이메일 → u_+sha256 앞 16자 uid). 이메일만 알면 그 uid 로 입장 가능.
- 목표: ① 현재 구글 로그인 흐름 전부를 코드에서 정리 ② GIS 자격증명을 `supabase.auth.signInWithIdToken({provider:'google', token})` 으로 넘겨 서버 검증 세션을 받는다. 대시보드 구글 공급자 필요 여부 판단, 기존 u_ 사용자 연결 선택지 2~3개와 권장안. 데이터 이관·삭제가 필요한 안이면 구현하지 말고 보고 ③ 승인선에 걸리지 않는 범위에서 구현: 서명 검증 안 된 자격증명으로는 입장하지 않게(서버 검증 실패 시 정식 로그인 안내). 구글 로그인 버튼은 남긴다.

## 1. [원칙 ①] 문제 파악

현재(origin/main 46f8157) 구글 로그인 경로는 세 갈래다. 셋 다 Supabase 세션을 만들지 않았다.

| 갈래 | 진입 | 신원 근거 | 입장 uid |
| :-- | :-- | :-- | :-- |
| A. 토큰 클라이언트(실제로 쓰이는 주 경로) | `#landGoogleBtn`·`#authGoogleBtn` → `startOAuthLogin('google')` → `startGoogleLogin()` → `getGoogleTokenClient()`(`google.accounts.oauth2.initTokenClient`, 캘린더 범위 포함) → 액세스 토큰으로 `https://www.googleapis.com/oauth2/v3/userinfo` 를 브라우저가 조회 → `handleGoogleUserSuccess(googleUser, accessToken)` | 브라우저가 받은 userinfo 이메일 | 미로그인이면 `sb.auth.signOut()` 후 안내 창 → `#continueGoogleDirectBtn` → `loginWithDirectIdentifier(email, {provider:'google', email})` → `js/direct-login-guard.js resolveDirectLoginTarget` 의 `google-verified-email` 갈래 → `'u_' + sha256Hex('ourgoal_user_' + 이메일).slice(0,16)` |
| B. One-Tap(GIS ID 토큰) | `initGoogleOneTap()` → `google.accounts.id.initialize({callback})` → 콜백에서 `parseJwtPayload(response.credential)` (base64 해석만, 서명·aud·만료 검증 없음) → `handleGoogleUserSuccess(payload, null)` | JWT 본문 이메일(무서명이어도 통과) | A 와 같다(안내 창 → u_ uid) |
| C. Supabase OAuth(`sb.auth.signInWithOAuth`) | `startOAuthLogin(provider)` 의 카카오 경로. 구글은 맨 앞에서 `startGoogleLogin()` 으로 빠져 **이 경로를 쓰지 않는다** | Supabase 서버 | 세션 uid(uuid) — 카카오만 |

- `initGoogleOneTap()` 은 GIS 스크립트를 동적으로 다시 불러올 때(`startGoogleLogin` 의 `s.onload`)만 불린다. index.html 이 `<script src="https://accounts.google.com/gsi/client">` 를 미리 싣기 때문에 평소에는 A 가 주 경로이고, B 는 드물게 열린다.
- **두 구글 버튼은 #TASK-ES-108(2026-09-16, 카카오 단일화) 이후 `style="display:none;" aria-hidden="true"` 로 숨겨져 있다**(index.html 68·89행, `scripts/smoke-test.js` 가 숨김을 단언). 클릭 배선(`['landGoogleBtn','authGoogleBtn'].forEach … startGoogleLogin()`)은 살아 있다. 즉 지금 운영 화면에는 구글 로그인 입구가 보이지 않고, 이 PR 도 숨김을 바꾸지 않는다(버튼 유지·노출 여부는 ES-108 결정 그대로).
- 영향 범위: 메인 스크립트는 `(function(){ "use strict"; … })()` 안이라 `handleGoogleUserSuccess` 는 전역이 아니다. 그래도 숨은 버튼은 개발자 도구에서 누를 수 있고, 브라우저 코드는 본인 기기에서 얼마든지 바꿀 수 있어 "남의 이메일 → 그 u_ uid 입장" 은 막히지 않았다. 다만 아래 측정대로 u_ 데이터는 서버 핵심 표에 저장될 수 없어, 남의 기기 로컬 기록까지 읽히지는 않는다(피해는 그 u_ 이름으로의 화면 입장·text 칸 표 쓰기 시도).
- 그 뒤 `loginWithDirectIdentifier` 는 `loadProfile(u_…)` 로 프로필을 만들고 `enterApp()` 한다. 이메일 문자열만 알면 누구나 같은 u_ uid 를 계산할 수 있다(개발자 도구에서 `handleGoogleUserSuccess({email:'남의@메일'})` 한 줄, 또는 무서명 JWT 를 B 콜백에 넣기).
- **u_ uid 와 서버·RLS 의 관계(2026-10-05 작업자 측정, 운영 Supabase, anon 키 읽기 전용 요청 — 존재하지 않는 id 로만 조회)**:
  - `users?id=eq.u_0000000000000000` → `22P02 invalid input syntax for type uuid` · `goals?user_id=eq.u_…`·`checkins?user_id=eq.u_…` 도 같은 22P02. 즉 핵심 표 `users.id`·`goals.user_id`·`checkins.user_id` 는 uuid 칸이라 **u_ uid 행은 서버에 저장될 수 없다.** u_ 사용자의 목표·기록은 이 기기의 `ourgoal_goals_backup_u_…`·`ourgoal_records_backup_u_…`·`ourgoal_profile_backup_u_…` 로컬 키에만 있었다(서버 원장 0).
  - `team_pings` 등 text 칸 표에는 'u_…' 가 들어갈 수 있다(docs/sql/2026-10-04-dm-rls-step2.sql 10행 주석). RLS 2단계(#TASK-ES-347)는 anon 쓰기를 막으므로 세션 없는 u_ 사용자의 서버 쓰기는 이미 실패한다.
  - `api/track.js`·`api/withdraw.js`·`api/push-subscribe.js` 는 `sb.auth.getUser(Bearer 토큰)` 으로 uid 를 정한다. u_ 사용자는 토큰이 없어 401 이다(u_ uid 를 믿는 서버 API 는 없다).
  - 운영 `/auth/v1/settings` 의 `external.google = false`, `external.kakao = true`, `email = true`. **Supabase 구글 공급자가 꺼져 있다.**

## 2. [원칙 ②] 본질·원인·중심·핵심

- 본질: **신원의 근거가 "브라우저가 읽은 이메일 문자열"이었다.** 서명 검증도, 서버 세션도 없었다. 이메일은 비밀이 아니므로 신원 증명이 될 수 없다.
- 원인: 구글 로그인을 Supabase 를 거치지 않고 GIS 만으로 붙이면서(#TASK-ES-033 무렵), 세션 대신 "이메일 → 결정적 uid" 를 만들어 썼다. #TASK-ES-368 은 기기 백업을 훑는 길을 막았지만 이 갈래는 입장 방법을 지키려고 남겼다.
- 중심: `js/direct-login-guard.js resolveDirectLoginTarget` 의 `google-verified-email` 갈래와 index.html `loginWithDirectIdentifier` 의 `'u_' + h.slice(0, 16)` 줄. 이 둘이 사라지면 세션 없는 구글 입장은 0 이 된다.
- 핵심: 구글 신원을 서버(Supabase)가 검증하게 한다 — ID 토큰은 `signInWithIdToken`, 액세스 토큰만 있는 경로는 `signInWithOAuth` 리다이렉트. 입장 uid 는 세션 user.id 하나뿐.

## 3. [원칙 ③] 해결 방식

### 3-1. 입장 경로 (구현함)

- 새 세포 `js/google-session-guard.js`(`window.OurgoalGoogleSessionGuard`):
  - `verifyGoogleCredential(sb, credential, rawNonce)` — JWT 모양이 아니면 서버에 보내지도 않고 거절. 맞으면 `sb.auth.signInWithIdToken({ provider:'google', token, nonce })`. 돌려받은 `data.session.user.id` 와 `access_token` 이 있어야만 `ok`. 브라우저에서 JWT 본문을 해석하지 않는다.
  - `createNonce()` — 무작위 raw 와 sha256 hex(hashed). GIS `initialize({nonce: hashed})`, Supabase 에는 raw(서버가 sha256(raw) 와 토큰 nonce 를 대조, 재사용 방지).
  - `enterWithCredential(d)` — 검증 성공 시 index.html `restoreSessionAndEnter(session)`(카카오·이메일과 같은 정식 진입). 실패 시 `guideFailure` → `OurgoalDirectLoginGuard.guideToFormalLogin` + `#loginError` 에 `GOOGLE_FAILED_MESSAGE`.
  - `startOAuthOrGuide(d)` — 토큰 클라이언트 경로용. `sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo, queryParams:{ prompt:'select_account', login_hint } } })`. 시작 실패(공급자 꺼짐 등)면 `guideFailure`.
- index.html:
  - `initGoogleOneTap()` 콜백: 미로그인이면 `enterWithCredential` 로만 간다. 이미 로그인한 상태의 캘린더 연동 표시(기존 [보호 1])는 그대로.
  - `handleGoogleUserSuccess` 의 `#continueGoogleDirectBtn`: `loginWithDirectIdentifier(email, {provider:'google'})` → `startOAuthOrGuide`. 버튼·안내 창·카카오 연동 버튼은 그대로.
  - `loginWithDirectIdentifier`: 이메일 → u_ uid 줄 삭제. `js/direct-login-guard.js`: `google-verified-email` 갈래 삭제.
- 래칫: index.html 인라인 줄 35,820 → 35,820, 함수 선언 691 → 691(scripts/module-guard.js 산출). 세포 신고서 `docs/architecture/modules.json` 에 google-session-guard(organ) 추가.

### 3-2. 기존 구글 사용자(u_ uid) 연결 — 선택지 (구현하지 않음, 결심 필요)

1절 측정대로 u_ 사용자의 목표·기록은 서버 핵심 표에 없고 **그 기기의 로컬 백업 키에만** 있다. 새 구글 로그인은 Supabase 가 새 uuid 를 준다. 이 PR 은 로컬 u_ 백업 키를 지우지 않는다(삭제 0, `account-isolation.dropForeignSessionCopy` 는 공용 사본 `ourgoal_guest_profile` 만 다루고 `ourgoal_*_backup_u_…` 는 건드리지 않음). 다만 병합 후 그 기록은 새 계정 화면에 자동으로 보이지 않는다.

| 선택지 | 방법 | 장점 | 단점 | 승인선 |
| :-- | :-- | :-- | :-- | :-- |
| **A. 기기 백업 이어받기(권장)** | 검증 세션이 생긴 뒤 `session.user.email`(서버가 검증한 이메일)로 u_ uid 를 계산해, 이 기기에 `ourgoal_*_backup_<u_uid>` 가 있으면 "이 기기에 남은 예전 구글 기록을 이 계정으로 옮길까요?" 한 번 묻고 `migrateGuestDataToUser` 와 같은 방식으로 새 uuid 로 복사(원본 키는 남김) | 서버 검증된 이메일만 근거라 이번 결함이 되살아나지 않음. 서버 핵심 표에 처음으로 원장화(GUARD_03). 매핑 표·SQL 불필요 | 다른 기기에만 있던 u_ 기록은 그 기기에서 로그인해야 이어짐 | 데이터 이관 → **상민님 결심** |
| B. 매핑 표 | `google_legacy_links(auth_uid uuid, legacy_uid text)` 표를 만들고 서버 API 가 검증 세션의 이메일로 legacy uid 를 기록. text 칸 표(team_pings 등)의 u_ 행을 새 uid 와 함께 조회 | 서버 쪽 text 칸 행(DM·팀 채팅 발신자 표시)까지 이어짐 | 핵심 데이터(목표·기록)는 서버에 없어 매핑으로 살아나지 않음. 표·RLS·API 신설, 조회 코드 전부에 OR 조건 | 스키마 신설·대시보드 SQL 실행 → 상민님 손 작업 |
| C. 잇지 않음 | 아무것도 하지 않음. u_ 백업 키는 기기에 그대로 남음 | 가장 단순, 이관 0 | 기존 구글 사용자가 새 계정에서 예전 기록을 못 봄(지워지지는 않음) | 없음(이 PR 의 현재 상태) |

권장: **A**. 근거 — 잃을 수 있는 데이터가 로컬 백업뿐이고, A 는 그것을 서버 검증 이메일로만 열어 새 uuid 원장으로 올린다. B 는 서버에 없는 데이터를 잇지 못한다. 실제 u_ 사용자 수는 측정불가(u_ 행이 핵심 표에 저장될 수 없고, 로컬 키는 각자 기기에만 있음).

## 4. [원칙 ④] 재검토

- 대시보드 설정이 필요한가 → **필요하다.** 측정: `/auth/v1/settings` `external.google = false`. `signInWithIdToken`·`signInWithOAuth` 둘 다 구글 공급자가 켜져 있어야 한다. 끈 채로 병합하면 구글 로그인은 서버 검증 실패 → 정식 로그인 안내로 간다(입장 0, 데이터 삭제 0). 그래서 PR 은 [확인 대기]로 두고 병합 전에 켠다.
  - [손 필요] Supabase 대시보드 로그인이 필요해 세션이 못 한다. 할 일: Authentication → Sign In / Providers → Google → Enable → Client IDs 에 `441950547594-brg1nvritlb3hlucoktq11ga6vtn943a.apps.googleusercontent.com`(index.html `GOOGLE_OAUTH_CLIENT_ID`, 공개값) → Client Secret 에 같은 GCP OAuth 클라이언트의 보안 비밀(GCP 콘솔 → API 및 서비스 → 사용자 인증 정보) → Save. GCP 콘솔의 같은 클라이언트 "승인된 리디렉션 URI" 에 `https://dvqosviqbciohcywkzbq.supabase.co/auth/v1/callback` 추가(토큰 클라이언트 경로의 OAuth 리다이렉트용).
- 이 수정이 입장 방법을 없애는가 → 버튼·안내 창·One-Tap 은 그대로다. 공급자를 켜면 구글 로그인은 오히려 정식 세션(서버 API 401 해소)이 된다.
- 다른 갈래가 남는가 → `loginWithDirectIdentifier` 의 `explicitUid`(개발용 테스터 B, 운영 화면에서 버튼 없음)는 이번 범위 밖이라 그대로. 이미 로그인한 상태의 One-Tap 은 캘린더 이메일 표시만 하고 입장 uid 를 바꾸지 않는다.

## 5. [원칙 ⑤] 절차

1. 흐름 전수 정리·운영 설정 측정(1절).
2. 새 세포 `js/google-session-guard.js` 작성, index.html 배선(One-Tap 콜백·`#continueGoogleDirectBtn`·`loginWithDirectIdentifier`), `js/direct-login-guard.js` 구글 갈래 삭제.
3. 부품 시험 `tests/google-session-guard.test.js` 신설, `tests/direct-login-guard.test.js` ④ 를 바뀐 규칙(세션 없는 구글 이메일 입장 0)으로 바꿈, `scripts/test-shipyard-modular.js` 에 등록.
4. 래칫·신고서(`scripts/module-guard.js`, `scripts/module-specs.js --write`), `npm test`.
5. claims(`reports/TASK-ES-373/claims.json`), dev_log·TICKETS, 커밋, PR([확인 대기], 병합 안 함).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "공급자가 꺼져 있는데 병합하면 구글 로그인이 통째로 막힌다 — 사실상 기능 삭제 아닌가."
  격파: 병합을 상민님 확인 뒤로 묶었고(제목 [확인 대기]), 확인 절차 1번이 공급자 켜기다. 코드상 버튼·창은 남고, 켠 뒤에는 같은 버튼으로 정식 세션 로그인이 된다. 지금 구글 입장은 "이메일만 알면 누구나"였으므로 그대로 두는 것이 더 큰 위험이다.
- 반론 2: "토큰 클라이언트 경로는 구글이 직접 준 액세스 토큰으로 userinfo 를 읽으니 이미 안전하지 않나."
  격파: 그 이메일은 브라우저 안의 값이고 `handleGoogleUserSuccess` 는 전역 함수라 누구나 남의 이메일로 부를 수 있다. 서버가 토큰을 확인한 기록(세션)이 없으면 신원 근거가 아니다. 그래서 이 경로도 `signInWithOAuth` 로 서버 세션을 받게 했다. 액세스 토큰은 `signInWithIdToken` 이 받지 않는다(id_token 필요).
- 재검증: 기존 시험 `scripts/smoke-test.js` 의 #TASK-ES-033 단언(`continueGoogleDirectBtn`·`isAccountConflict`·`기존 카카오 가입 계정 안내`·`function initGoogleOneTap(`·`function handleGoogleUserSuccess(`)과 #TASK-ES-035 단언(`var backupPrefixes = [...]`)은 글자 그대로 남아 통과한다.

## 7. [원칙 ⑦] 즉시 실행 — 바뀐 것

- `js/google-session-guard.js`(새 세포, 119줄): `verifyGoogleCredential`·`createNonce`·`enterWithCredential`·`startOAuthOrGuide`·`guideFailure`·`startGoogleOAuthSession`.
- `index.html`: 스크립트 태그 1개 추가, `initGoogleOneTap`(async, nonce, 미로그인 콜백 → 검증 경로), `#continueGoogleDirectBtn` onclick → `startOAuthOrGuide`, `loginWithDirectIdentifier` u_ 계산 줄 삭제.
- `js/direct-login-guard.js`: `google-verified-email` 갈래 삭제(주석 갱신).
- `tests/google-session-guard.test.js`(신설), `tests/direct-login-guard.test.js` ④, `scripts/test-shipyard-modular.js` 등록, `docs/architecture/modules.json` 신고서.

## 8. [원칙 ⑧] 성과 측정

- 부품 시험 `tests/google-session-guard.test.js`(가짜 Supabase 가 RS256 서명·aud·만료·nonce 를 검증): 수정 전(origin/main 46f8157 index.html·guard) 1/6, 수정 후 6/6. 측정값(수정 후): `forgedEntered 0`(무서명·다른 키·다른 aud·만료·JWT 아님 5종), `forgedGuided 5`, `goodProfile server-uid`, `goodIdTokenCalls 1`, `replayEntered 0`, `tokenPathDirectCalls 0`, `tokenPathOAuth ["google"]`, `disabledEnterApp 0`.
- `tests/direct-login-guard.test.js`: 수정 전 코드에 바뀐 시험지 5/6(④ 실패: 세션 없는 구글 이메일로 u_ 입장), 수정 후 6/6.
- `npm test`(NODE_PATH=C:/dev/ourgoal-app/node_modules): 종료 코드 0, smoke 443개 통과 0개 실패, verify-integrity-gate 38/38, module-guard ① 35820 · ② 691(기준선과 같음).
- 측정 못 한 것: 실제 구글 계정 로그인(지시로 시도 금지, 공급자 꺼짐), 실기기. → claims C14·C15 unverified(needs-login).
- 진행 단계: [4단계: 심사 청구].
