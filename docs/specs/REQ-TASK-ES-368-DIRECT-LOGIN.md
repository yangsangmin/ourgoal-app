# 요구사항 정의서 (REQ) — #TASK-ES-368 빠른 복구·닉네임 입장이 남의 백업 uid 로 인증 없이 들어가던 결함

> **문서 ID**: REQ-TASK-ES-368-DIRECT-LOGIN
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-13 (P0 개인정보) · 같은 뿌리 COMM-11(세션 없는 로그인 경로)
> **작성 일시**: 2026-10-05
> **작성자**: Claude Code 세션 (CORE-13 빌더)
> **기준 커밋**: origin/main a0ad802 (#680 병합 뒤)

## 지시 원문 (작업 지시서에서 옮김)

- 결함(PR #678 빌더 발견): index.html `loginWithDirectIdentifier`(빠른 복구·닉네임 입장)가 입력값과 상관없이 이 기기의 첫 `ourgoal_records_backup_*` uid 로 인증 없이 입장한다. 공용 기기에서 다른 사람 데이터로 들어갈 수 있다. 노션 COMM-11(세션 없는 로그인 경로)과 같은 뿌리.
- 상민님 승인된 방향(2026-10-04 "끝난 뒤 지침이 필요한 일들 모두 세션권장대로 진행해"): 빠른 복구는 정식 Supabase 로그인 세션이 있을 때만 허용한다(세션 uid 와 같은 uid 의 자기 백업만 연다). 세션이 없으면 정식 로그인(카카오·구글·이메일)으로 안내한다. 이 과정에서 화면의 입장 방법(버튼·입력칸)이 사라지게 되면 그 부분은 하지 말고 멈춰서 보고(기능 삭제는 재확인 필요). 버튼은 남기고 동작만 안전하게 바꾸는 것이 기본.
- 상민님 승인(2026-10-05 "결심필요 안건 3건에 모두 승인"): 빠른 복구를 안전하게 만들 수 없으면 버튼은 남기고 누르면 정식 로그인 안내가 뜨게 하는 방식으로 마무리해도 된다. 추가 범위: index.html loadProfile 이 자기 키가 비면 다른 사람 `ourgoal_companions_backup_*` 를 훑는다(같은 계정 간 유출, #680 빌더 발견) — js/account-isolation.js readOwnCopy 로 자기 uid 키만 읽게 함께 고쳐라. 부품 시험 1건 추가.
- 부품 시험(npm test 경로): A 백업이 있는 기기에서 세션 없이/B 세션으로 빠른 복구 시 A 데이터 0.

## 1. [원칙 ①] 문제 파악

- 코드 확인(origin/main): `loginWithDirectIdentifier(rawId, extraOpt)` 의 "1. 로컬 스토리지에 캐시된 ID 우선 검색"이 `ourgoal_goals_backup_`·`ourgoal_records_backup_`·`ourgoal_profile_backup_`·`ourgoal_settings_` 접두사로 localStorage 를 훑어 **처음 걸린 키의 uid** 를 `targetUserId` 로 쓰고, 없으면 직전 사용자 `ourgoal_current_user` 를 쓴다. 입력한 닉네임·이메일은 uid 결정에 쓰이지 않는다. 세션 확인이 없다.
- 호출처 4곳: ① 빠른 복구 모달 `#rescueDirectEnterBtn`(첫 화면 `#landRescueBtn`·`#landNickQuickLink`, 로그인 화면 `#authRescueBtn`, 카카오 인앱 지연·구글 모듈 실패 때 자동으로 열림) ② 구글 GIS 인증 뒤 `#continueGoogleDirectBtn` ③ 개발용 테스터 B `enterAsTesterB`(운영 화면에서는 버튼 제거, `?debug=true` 때만 보임) ④ 없음(그 밖에 직접 부르는 곳 없음).
- 부품 재현(수정 전 origin/main index.html 을 `tests/direct-login-guard.test.js --html` 로): 세션 없이 아무 닉네임으로 복구 → **입장 성공, A 데이터 3건(A uid·A 소개·A 표식 기록)**, B 세션에서 복구 → **A 로 입장**, B 세션 업로드에 A 표식 1건, 구글 인증 이메일 입장도 A 로 입장. 1/5 통과.
- 실서버 재현(작업자 실측 2026-10-05, 이 PC 로컬 정적 서버 127.0.0.2 + 앱에 하드코딩된 운영 Supabase + 테스트 계정 A, runTag `ogtest-202610041503-1mzw`): A 이메일 로그인 → 기록(표식) 저장 → 로그아웃 상당(세션·공용 키 정리, uid 백업은 남음) → 첫 화면 빠른 복구에 **다른 닉네임** 입력 → `enteredApp true`, `profileIsA true`, `aMarkInProfile 1`. 결함 실재.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 입력한 닉네임·이메일은 신원 증명이 아니다. 누구의 데이터를 열지는 인증(정식 세션)이 정해야 한다.
- **원인**: `loginWithDirectIdentifier` 가 uid 를 "이 기기에 남은 아무 백업 키"에서 골랐다(#TASK-ES-035 의 자가 복구 의도가 공용 기기에서는 남의 계정 열기가 됨). #678(ES-365)은 loadProfile 이 남의 백업을 빌리는 길을 막았지만, 이 함수는 **uid 자체를 남의 것으로** 정하므로 loadProfile 이 그 uid 의 "자기 백업"으로 A 데이터를 그대로 열었다.
- **중심**: uid 결정 규칙을 한 세포 `js/direct-login-guard.js`(`window.OurgoalDirectLoginGuard.resolveDirectLoginTarget`)로 모은다.
- **핵심**: 세션 uid 가 있으면 그것만, 없으면 열지 않고 정식 로그인 안내. 기기 백업 훑기 제거.

## 3. [원칙 ③] 해결 방식

| 갈래 | 수정 전 uid | 수정 후 |
| :-- | :-- | :-- |
| 정식 Supabase 세션 있음 | 기기의 첫 백업 uid | **세션 uid**(입력값·호출자가 넘긴 다른 uid 무시) — loadProfile 은 #678 대로 그 uid 의 자기 백업만 읽음 |
| 세션 없음 + 닉네임·이메일 입력(빠른 복구·닉네임 입장) | 기기의 첫 백업 uid, 없으면 입력값 해시 | **열지 않음** → 정식 로그인 화면(`#authScreen`, 카카오 `#authKakaoBtn`·이메일 칸) + `#loginError` 안내 문구 + 토스트 |
| 구글 GIS 인증 이메일(`provider:'google'`) | 기기의 첫 백업 uid | **그 이메일에서 결정되는 uid**(`'u_' + sha256('ourgoal_user_' + email)` 앞 16자 — 새 기기에서 원래 받던 것과 같은 값). 기기 백업 훑지 않음 |
| 개발용 테스터 B(호출자가 uid 명시) | 명시 uid | 그대로(세션이 있으면 세션 uid 우선) |

- 화면: 버튼·입력칸은 하나도 지우지 않는다. 빠른 복구 모달에 한 줄 안내 `#rescueLoginRequiredNote` 를 더했다("내 기록은 카카오·구글·이메일로 로그인한 계정으로만 열려요…").
- 추가 범위(#680 발견, companions): origin/main 의 index.html `loadProfile` 은 #678 에서 이미 `readOwnCopy('ourgoal_companions_backup_', userId, [])` 로 고쳐져 있다(현재 3842줄). 지시받은 "약 3879줄" 의 훑기는 #678 이전 판이다. 그래서 index.html 은 그대로 두고, 그것을 지키는 **부품 시험 1건(⑥)** 을 더했다 — 수정 전(#678 이전 a2c593f) 판에서는 실패("B 프로필에 A 동반자 1건"), 지금은 통과. 같은 훑기가 남은 곳은 `js/team-invite-comm.js ensureDefaultCompanions`(COMPANIONS_STORAGE_PREFIX 반복문)이며, js/team-* 는 comm-fix(TASK-ES-366) 담당이고 그 반복문은 PR #680 병합(a0ad802)으로 main 에서 이미 제거되어 이 PR 에서는 건드리지 않았다.

## 4. [원칙 ④] 재검토

- 구글 GIS 갈래에 세션을 강제하면 구글 입장이 통째로 막힌다(앱의 구글 로그인은 Supabase OAuth 가 아니라 GIS → 이 함수). 지시대로 입장 방법이 사라지는 쪽은 하지 않았다 [기본값]. 대신 남의 백업 uid 를 고르는 길만 끊었다.
- 빠른 복구 모달은 열릴 때 `sb.auth.signOut()` 으로 꼬인 세션을 지운다(기존 방어 코드, Step 0 보존). 그래서 화면 경로에서는 사실상 항상 "세션 없음 → 로그인 안내"로 간다. "세션 있을 때 자기 백업 열기"는 함수 수준에서 지켜지며 부품 시험 ②③⑤ 로 잰다. 2026-10-05 승인("버튼은 남기고 누르면 정식 로그인 안내")과 맞는다.

## 5. [원칙 ⑤] 절차

1. `js/direct-login-guard.js` 작성(`resolveDirectLoginTarget`, `ownBackupKeys`, `guideToFormalLogin`, `NEEDS_LOGIN_MESSAGE`), `index.html` 에 `<script src="js/direct-login-guard.js?v=20261005-es368">`(account-isolation.js 다음).
2. `index.html loginWithDirectIdentifier`: `sb.auth.getSession()` → `resolveDirectLoginTarget` → 막히면 `guideToFormalLogin` 후 `false`. 백업 훑기·`ourgoal_current_user` 폴백 제거. `backupPrefixes` 는 **이 uid 의 키 존재 확인**에만 쓴다(환영 토스트 문구).
3. `openLoginRescueModal` 에 `#rescueLoginRequiredNote` 한 줄.
4. `tests/direct-login-guard.test.js` 6건 + `scripts/test-shipyard-modular.js` 에 연결.
5. 법정 화면 시나리오 `reports/TASK-ES-368/scenarios/rescue-needs-login.json`.
6. `docs/architecture/modules.json` 세포 `direct-login-guard`(organ) — `node scripts/module-specs.js --write`.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: "닉네임으로 1초 시작"(`#landNickQuickLink`)은 새 사용자가 계정 없이 시작하던 입장 방법이다. 그것을 막으면 기능 삭제 아닌가? → 링크·입력칸·버튼은 그대로이고 누르면 정식 로그인 안내가 뜬다(2026-10-04·10-05 승인 방향 그대로). 또 "닉네임 해시 uid" 는 같은 닉네임을 넣은 다른 사람이 그 서버 데이터를 여는 길이라 그 자체가 같은 결함이다. 계정 없이 쓰는 길은 "로그인 없이 둘러보기"(`#btnLandingPreviewDirect`)로 남아 있다.
- **반론 2**: 구글 갈래를 이메일 결정 uid 로 바꾸면, 이 기기에서 다른 uid 로 쓰던 구글 사용자가 자기 데이터를 잃는가? → 구글 사용자는 처음 기기(백업 없음)에서 이미 그 이메일 결정 uid 를 받았고 그 뒤 백업도 그 uid 로 저장됐다. 다른 uid 로 들어가던 경우는 이 기기에 남의 백업이 먼저 있던 경우뿐이며 그것이 고칠 결함이다. 서버 원장은 지우지 않는다.
- **반론 3**: 함수에 세션 갈래를 넣었는데 화면 경로에선 안 쓰인다(죽은 코드)? → 지시가 "세션이 있을 때만 허용"이고, 모달 밖에서 부를 때(구글 연동 뒤 등)와 앞으로 모달의 signOut 을 조정할 때를 위한 규칙이다. 부품 시험으로 돈다.

## 7. [원칙 ⑦] 즉시 실행 — 바뀐 것

- `js/direct-login-guard.js`(새 세포), `index.html`(스크립트 태그·loginWithDirectIdentifier·모달 안내 한 줄), `tests/direct-login-guard.test.js`, `scripts/test-shipyard-modular.js`(한 줄), `docs/architecture/modules.json`, `reports/TASK-ES-368/*`, `dev_log.md`, `docs/rules/TICKETS.md`.
- 화면 입장 방법 변화: **버튼·입력칸 삭제 0개.** 동작 변화 — 로그인하지 않은 상태의 빠른 복구·닉네임 입장은 앱에 들어가지 않고 정식 로그인 화면으로 간다.

## 8. [원칙 ⑧] 성과 측정

- 부품 시험 `NODE_PATH=C:/dev/ourgoal-app/node_modules node tests/direct-login-guard.test.js`
  - 수정 후: **6/6 통과**. `noSessionResult [false,false]`, `noSessionAOnScreen 0`, `noSessionEnterApp 0`, `noSessionAuthScreen flex`, `bSessionProfile B`, `bSessionAOnScreen 0`, `bSessionUploadsWithA 0`, `bSessionExplicitAProfile B`, `googleOk true`, `googleAOnScreen 0`, `ownBackupRestored 1`, `bCompanionsFromA 0`, `aCompanionsOwn 1`.
  - 수정 전 origin/main 판(a0ad802): **2/6**(⑤·⑥ 만 통과 — 결함 경로 ①~④ 실패) — `noSessionAOnScreen 3`, `bSessionProfile A`, `bSessionUploadsWithA 1`, `googleAOnScreen 3`. ⑥ 은 #678 이전 판(a2c593f)에서 실패 `bCompanionsFromA 1`.
- `npm test`(NODE_PATH 지정) 전체 통과: smoke 443/443, 클릭 38/38, 모듈 가드 통과.
- 실서버 재생(작업자 실측 2026-10-05, 로컬 정적 서버 + 운영 Supabase + 테스트 계정 A — 주소·비밀번호는 기록하지 않음):
  - 수정 전(origin/main 사본, runTag `ogtest-202610041503-1mzw`): `enteredApp true`, `profileIsA true`, `aMarkInProfile 1`.
  - 수정 후(이 브랜치, runTag `ogtest-202610041503-rhq8`): `enteredApp false`, `authScreenShown true`, `profileIsA false`, `aMarkInProfile 0`, 안내 문구 표시.
  - 정리: 두 runTag 의 A 소유 checkins 를 A 세션으로 지움 — 최종 남은 0건(첫 정리 직후 앱 저장이 1건을 다시 올려 한 번 더 지움).
- 확인 못 한 것: 정식 세션이 있는 상태로 빠른 복구 함수를 화면에서 부르는 경로(모달이 먼저 signOut 함), 구글 GIS 실로그인(외부 화면), 운영 주소 재생(병합·배포 뒤).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
