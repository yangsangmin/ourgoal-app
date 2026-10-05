# REQ — #TASK-ES-442 index.html 인라인 스크립트 세포화 P0 구역 2차: 시험지가 글자를 잘라 가던 13묶음 30선언을 세포 11개로 이전

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON·CELL_SPLIT·CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`, P0 1차 #TASK-ES-437(#749 — 생성기 `gen-inline-p0.js`), 선행 시험지 #TASK-ES-441(#751 — 시험지 인라인 합본). 상민님 원문(2026-10-05): "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?"
- 범위: P0 구역 중 1차에서 시험지 때문에 미뤘던 10묶음(G023·G024·G025·G026·G036·G039·G048·G054·G068·G074)의 함수 선언 24개 + 상수 글자 var 2개(`TAB_GUIDE_DATA`·`ONBOARDING_AVATARS`), 그리고 smoke-test FN_NAMES 라 1차에서 막혔던 3묶음(G014·G063·G066 일부)의 함수 4개(G018 subscriptionState 는 커밋 훅이 「돈」 승인선 낱말로 표시해 이번에서 뺌)를 세포 11개로 글자 그대로 옮긴다(#751 이 FN_NAMES 추출 원본도 합본으로 넓혔다). 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험지·기대값 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. P0 구역(지도 G007~G074) 담당. 1차(#749)는 시험지가 깨지지 않는 19묶음만 옮겼다. 나머지 10묶음은 시험지 11곳이 index.html 글자에서 함수를 잘라 가서, 선행 PR #751 이 시험지 읽는 범위를 「인라인 합본」으로 넓혔다.
2. 이번 PR 은 #751 병합 뒤의 main 위에서 그 10묶음을 옮긴다. 인라인 줄 순증가 0(줄어야 함).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 로그인 기기·앱 잠금 PIN·게스트 기록 합치기·온보딩·탭 활용법·프롬프트 백과사전·일정 완료 체크 같은 핵심 기능 1,800여 줄이 3만 줄 IIFE 한 스코프에 묶여 있다.
- **원인**: 기능 코드가 인라인에 쌓여 왔고, 시험지가 그 위치(index.html 글자)를 전제로 쓰여 있어 옮기기를 막고 있었다(#751 로 해소).
- **중심**: 1차와 같은 생성기(함수 선언만 옮기고 window 노출·로드 중 문은 제자리) + 이번에 더한 것: 초기값이 상수 글자뿐(리터럴·문자열 이어 붙이기)이고 재대입이 없으며 옮긴 세포 안에서만 쓰는 `var`(탭 활용법 자료 137줄·온보딩 아바타 22줄)는 함께 옮긴다.
- **핵심**: 생성기 `isPureInit` 가 상수 글자임을 검사하고, 검사기가 그 var 도 토큰·줄 단위로 맞댄다.

## 3. [원칙 ③] 해결방식

| 새 세포 | 묶음 | 옮긴 선언 |
| :-- | :-- | :-- |
| `js/tabs/settings/login-devices.js` | G023·G024 | `getRegisteredDevices` · `renderActiveDevicesList` · `openLogoutOtherDevicesConfirmModal` |
| `js/tabs/settings/app-lock-pin.js` | G025 | `isHashedAppLockPin` · `appLockCryptoAvailable` · `sha256HexAppLock` · `hashAppLockPin` · `verifyAppLockPin` · `openTwoFactorSetupModal` · `openTwoFactorDisableModal` · `challengeTwoFactorModal` (`APP_LOCK_PIN_PREFIX`·window 노출 제자리) |
| `js/tabs/settings/dev-debug-gate.js` | G036 | `initDevDebugButtons` (로드 중 등록 `if(document.readyState…)` 제자리) |
| `js/tabs/settings/guest-migration.js` | G039 | `migrateGuestDataToUser` |
| `js/tabs/settings/tab-guide.js` | G048 | `TAB_GUIDE_DATA`(var) · `renderTabGuideContent` · `openTabGuideHubModal` (`tabGuideBtn` 등록 제자리) |
| `js/tabs/settings/onboarding.js` | G054 | `ONBOARDING_AVATARS`(var) · `startOnboarding` |
| `js/tabs/goals/prompt-encyclopedia.js` | G026 | `getUserPrompts` · `getLikedPromptIds` · `getPromptLikesMap` · `openAddUserPromptModal` · `renderPromptEncyclopediaHtml` · `wirePromptEncyclopediaEvents` (`_promptTabState`·`_promptEncyclopediaOpen` 은 인라인에 두고 getter·setter) |
| `js/tabs/goals/notion-record-convert.js` | G068 | `convertTextToNotionDbRecord` |
| `js/tabs/calendar/schedule-done-toggle.js` | G074 | `toggleScheduleDone` |
| `js/tabs/settings/app-defaults.js` | G014 | `defaultSettings` (smoke FN_NAMES — 설정 `allowSmoke`) |
| `js/tabs/goals/goal-math.js` | G063·G066 | `goalProgress` · `msCounts` · `resultPct` (smoke FN_NAMES, `RESULT_UNITS` 는 인라인에 둠) |

- index.html: IIFE 머리 `/* ============ Supabase ============ */` 바로 앞에 이음매(가져오기 + 새 getter 15개), 옮긴 자리마다 표지 주석 한 줄, 새 `<script>` 태그는 그 탭 기존 태그 앞 같은 줄(순증가 0줄). 키트는 기존 `OurgoalSettingsKit`·`OurgoalGoalsKit`·`OurgoalCalendarKit` → 새 전역 0.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 신고서 경고 1건: `goals/prompt-encyclopedia` 가 `ui.confirm` 능력을 부르는데 신고서 requires 에 없다(module-guard 경고, 실패 아님). 신고서 손 칸은 이번에 고치지 않았다(생성기 산출만 — 손 편집 금지 지시).
- 화면 시나리오가 닿지 못한 것: 목표 상세의 프롬프트 백과사전(게스트 목표 탭에서 목표 카드를 눌러 상세로 가는 길을 시나리오 선택자로 못 찾음), 온보딩(첫 가입 때만), 개발 디버그 버튼(법정 주소는 로컬 개발 주소가 아님), 노션 변환·일정 완료 토글(화면 깊은 곳) → 게스트 조작 비교에서 window 노출·앱 스코프 통로·서랍 열기로 두 앱에 같은 조작을 해 맞댔다.
- `migrateGuestDataToUser` 는 로그인 순간에만 불리므로 화면 비교를 하지 않았다 — 시험지(account-switch-isolation·direct-login-guard)가 합본에서 잘라 가짜 Supabase 로 돌린다(기준과 같은 종료 코드).
- 실계정 비교는 하지 않았다(주장에 「확인 못 함」).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-p0`(브랜치 `feat/2026-10-05-task-es-442-inline-p0-2`, origin/main 위) → 설정 `inline-p0-2.json` → 생성 → verify → 시험(#751 시험지 합본 적용 사본으로 tests 108개·npm test) → 게스트 조작 비교 세트 2(기준 2회·후 1회) → 법정 형식 화면 시나리오 3개 기준/후 → 신고서·세포 설명 → 커밋 → PR → 법정 (생성 지도 3종 — 기준선·세포지도·인라인 지도 — 은 코디네이터 규칙대로 main 판 그대로 두고 병합 뒤 세포지도 담당이 갱신).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "var 를 세포로 옮기면 초기화 시점이 IIFE 실행 때에서 세포 파일 로드 때로 앞당겨진다." → 생성기가 초기값이 리터럴·문자열 이어 붙이기뿐(이름·호출 0)이고 재대입 0 인 var 만 옮긴다 — 언제 평가해도 같은 값이다. 두 var 는 옮긴 세포 안에서만 읽힌다(인라인 가져오기 0).
- 반론 2: "PIN 해시·검증처럼 보안 동작을 옮기면 저장값이 달라질 수 있다." → 글자 그대로(토큰 동일) 옮겼고, 게스트 조작 비교가 설정·불일치·저장·잘못된 PIN·맞는 PIN·끄기를 두 앱에 같은 조작으로 해 저장값(localStorage·sessionStorage 확인 표시)·토스트를 맞댔다(해시는 무작위 소금이라 「해시인가」만 비교).
- 반론 3: "시험지가 합본(#751)으로 넓어졌으니 옮긴 함수가 망가져도 시험이 못 잡는다." → 합본은 세포의 실제 글자(L. 만 뗌)를 잘라 가므로 세포 함수가 바뀌면 같은 시험이 잡는다. 옮긴 뒤 L. 통로 동작은 게스트 조작 비교·화면 시나리오가 따로 잰다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#activeDevicesContainer`, `#activeDeviceCountBadge`, `#logoutOtherDevicesBtn`, `#twoFactorSwitch`, `#twoFaPinInput`, `#twoFaPinConfirm`, `#btnSave2Fa`, `#challenge2FaPin`, `#btnVerify2FaChallenge`, `#disable2FaPinInput`, `#btnConfirmDisable2Fa`, `#btnTabGuideHub`, `.guide-tab-nav-btn[data-tabkey]`, `#btnTogglePromptAccordion`, `.btn-prompt-tab`, `#toast`, `#modalOverlay`.
- 함수: 3절 표의 24개 + var 2개, `OurgoalAppScope.expose`.
- 파일: `index.html`, 3절 세포 11개, `docs/design/harness/module-split/gen-inline-p0.js`(`isPureInit` 문자열 이어 붙이기 허용)·`verify-inline-p0.js`·`dom-compare-inline-p0.js`(세트 2)·`inline-p0-2.json`·`inline-p0-2-cells.json`, `docs/architecture/*`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

결과 파일은 `reports/TASK-ES-442/`.

| 항목 | 결과 |
| :-- | :-- |
| 인라인 줄 수 | main 3dcd05a 위에서 index.html 31,593 → 29,757줄(−1,836) |
| 글자 동일(verify-inline-p0) | 30선언 토큰 동일, 28덩어리 줄 단위 동일(1,878줄), 누수 0·미노출 0·남은 정의 0, 새 파일 11개 800줄 이하 |
| 시험 | 기준(main 3dcd05a) 대 작업: tests 108개 종료 코드 같음·npm test smoke 443/0·38/38 — `test-compare.json` |
| 게스트 조작 비교 세트 2 | 39단계 × 10칸 = 390값, 기준 대 후 0 · 기준 대 기준 0(PIN 무작위 소금·저장공간 추정치·아바타 제작권 지갑 칸 lastStreakAwarded·maxBaseCrafts 는 지움 — 기준 앱 2회 사이에서도 로드 순서에 따라 달라짐을 실측), 콘솔 오류 0/0/0 — `dom-compare-inline-p0-2.json` |
| 화면 시나리오(법정 형식) | 3개 기준·후 통과 — `scenario-local.json` |

[4단계: 심사 청구]
