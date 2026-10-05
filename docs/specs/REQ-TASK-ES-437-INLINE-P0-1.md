# REQ — #TASK-ES-437 index.html 인라인 스크립트 세포화 P0 구역 1차: 시험지가 글자로 잘라 가지 않는 19묶음 24선언을 세포 10개로 이전

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON·CELL_SPLIT·CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 1차 선례 #TASK-ES-423(#744 — 지도·생성기·검사기·게스트 비교 틀). 상민님 원문(2026-10-05): "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나? 지금 왜 적극적으로 진행하지 않는것 같지?"
- 범위: 인라인 지도(`docs/architecture/inline-script-map.json`, 기준 main a89ce00)의 **P0 구역**(약 2565~10488행, 36묶음) 중, 옮겨도 기준 시험지(tests 108개·npm test)가 그대로 통과하는 19묶음의 함수 선언 24개를 세포 파일 10개로 글자 그대로 옮긴다. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험지·기대값 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 IIFE(모듈 가드 ① 33,385줄)는 아직 미분화 덩어리다. 병렬 빌더 4명이 구역을 나눠 동시에 세포화한다 — 이 PR 은 P0 구역(G007~G074) 담당.
2. 1차 생성기(#744)는 "묶음 전체가 옮길 함수뿐"인 묶음만 다뤘다. P0 구역 묶음 대부분은 window 노출 줄·로드 중 바로 도는 `if`·`var` 선언이 섞여 있어 그대로는 못 쓴다 → 생성기를 넓혀 **함수 선언만** 옮기고 나머지 문은 원래 자리에 둔다.
3. 시험지 중 index.html 글자에서 함수를 잘라 실행하는 것이 있어, 그 함수를 옮기면 기준 시험지가 깨진다(법정은 기준 커밋 시험지로 채점) → 이번 PR 은 깨지지 않는 묶음만, 깨지는 묶음은 시험지 범위만 넓히는 선행 PR 뒤로 미룬다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 설정·목표·기록 기능 24개가 3만 줄 IIFE 한 스코프에 묻혀 있어, 어느 하나를 고쳐도 같은 파일·같은 스코프를 만진다. 세포로 떼어 책임 단위 파일(800줄 이하)로 만드는 것이 목표다.
- **원인**: 묶음 안에 함수 선언과 로드 중 문(window 노출·`if(document.readyState…)`·`var x = document.getElementById…`)이 섞여 있고, 일부 시험지는 index.html 글자에서 함수 본문을 잘라(`extractFunction`) 가짜 환경에서 실행한다. 이 둘 때문에 묶음을 통째로 옮기는 1차 틀이 P0 구역에 그대로 맞지 않았다.
- **중심**: (가) 함수 선언(앞에 붙은 주석 포함)만 옮기고 문은 제자리 — MODULE-SPLIT-PROTOCOL 3절 (나) 시험지가 잘라 가는 함수 식별 — 구역 전체를 시험 삼아 옮긴 사본(모의 이전)으로 tests 108개를 돌려 깨지는 시험을 측정으로 찾았다.
- **핵심**: 설정 파일로 도는 생성기 `gen-inline-p0.js` + 검사기 `verify-inline-p0.js`. 모의 이전에서 깨진 시험 11개(account-switch-isolation·direct-login-guard·dev-host-gate·device-session-control·logout-scope-es399·two-factor-auth·core-confirm-es376·onboarding-first-checkin·records-tab-rename·schedule-goal-sync·smoke-test 의 convertTextToNotionDbRecord)가 글자를 잘라 가는 함수의 묶음은 이번에서 뺐다.

## 3. [원칙 ③] 해결방식

### 3-1. 생성기 `docs/design/harness/module-split/gen-inline-p0.js` (설정 `inline-p0-1.json`)

- 묶음 = 구획 주석(`/* ============ 제목 ============ */`) 줄 ~ 다음 구획 주석 앞 줄. 묶음의 최상위 문이 모두 옮길 함수면 1차처럼 구획 주석째 통째로(㉮), 아니면 함수 선언과 그 앞에 붙은 주석만(㉯) 옮긴다. window 노출 줄·`if`·`var`·로드 중 문은 원래 자리에 그대로.
- 이름 참조만 `L.<이름>`(js/core/app-scope.js 통로). 같은 세포 안 이름은 그대로. 옮긴 코드가 대입하는 인라인 변수(`__avatarGreetTimer`)만 setter. smoke-test FN_NAMES 함수(`resultPct`)는 옮기지 않음(생성기가 건너뜀). L. 로 부르게 될 인라인 함수가 최상위 `this` 를 쓰면 멈춤(0건).
- index.html: IIFE 머리 `/* ============ Supabase ============ */` 바로 앞에 이음매(가져오기 `var X = _settingsKit.X` 등 21줄 + 새 getter 10개 — 앞선 이음매가 노출하지 않은 것만), 옮긴 자리마다 표지 주석 한 줄(이웃은 합침 — 20줄), 새 `<script>` 태그는 그 탭 기존 태그(`render.js`·`goal-export.js`) 앞 같은 줄(순증가 0줄). 키트는 이미 있는 `OurgoalSettingsKit`·`OurgoalGoalsKit`·`OurgoalRecordsKit` → 새 전역 0.

### 3-2. 옮긴 것 (기준 지도 묶음 → 새 세포)

| 새 세포 | 묶음(기준 지도) | 옮긴 선언 |
| :-- | :-- | :-- |
| `js/tabs/settings/theme-apply.js` | G015 8대 화면 스타일 | `applyTheme` · `applyAppSettings` (THEMES·window 노출은 제자리) |
| `js/tabs/settings/avatar-greeting.js` | G021 앱 진입 아바타 인사 팝업 | `openAvatarGreetingPopup` · `closeAvatarGreetingPopup` · `showLevelUpBanner` |
| `js/tabs/settings/account-entry.js` | G042·G045·G046·G060 | `showLastAuthBadge` · `initRememberedAuthFields` · `openChangePasswordModal` · `checkPendingDeletionRestore` · `showLegalModal` |
| `js/tabs/settings/guest-backup-nudge.js` | G038 게스트 3회 기록 백업 넛지 | `openGuestBackupNudgeModal` · `checkGuestBackupNudge` |
| `js/tabs/settings/notion-sync.js` | G070 Notion 실시간 동기화 | `sendToNotion` |
| `js/tabs/settings/comm-tour.js` | G056 온보딩 직후 소통 투어 | `showCommTourModal` |
| `js/tabs/goals/team-goal-modals.js` | G028·G029 | `openTeamLinkedPersonalGoalModal` · `openTeamInviteModal` |
| `js/tabs/goals/template-quick-import.js` | G027·G040 | `importTemplateInstantly` · `templateMilestones` |
| `js/tabs/goals/result-input.js` | G062·G065·G066·G067 | `gaugeSvg` · `hybridDashboardHtml` · `resultLineHtml` · `openAiResultAssistantModal` |
| `js/tabs/records/checkin-helpers.js` | G053·G030 | `checkStreakFreeze` · `applyQuickCunningText` |

### 3-3. 이번에 뺀 P0 묶음과 이유(다음 PR)

- 시험지가 index.html 글자를 잘라 감(선행 PR 로 시험지 읽는 범위를 index.html + js/tabs 합본으로 넓힌 뒤 옮긴다): G023·G024(`getRegisteredDevices`·`renderActiveDevicesList`·`openLogoutOtherDevicesConfirmModal`), G025(앱 잠금 PIN 8개), G026(프롬프트 백과사전), G036(`initDevDebugButtons`), G039(`migrateGuestDataToUser`), G048(탭 활용법), G054(`startOnboarding`), G068(`convertTextToNotionDbRecord` — smoke-test 가 인라인에서 잘라 실행), G074(`toggleScheduleDone`).
- 옮길 함수 선언 없음: G009(`OURGOAL_CONFIG` var + 노출), G049·G050(로드 중 리스너만). G007 은 1차 이음매 자체(옮기지 않음).
- smoke-test FN_NAMES(시험지가 인라인에서 잘라 실행): G014 `defaultSettings`, G018 `subscriptionState`, G063 `goalProgress`·`msCounts`, G066 `resultPct`.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **부르는 곳이 없는 함수(이전 전부터)**: `hybridDashboardHtml`·`resultLineHtml`·`openAiResultAssistantModal`(G065~G067)은 앱 안 어디서도 부르지 않는다(인라인·js 전체 검색 0). 옮기기는 동작을 바꾸지 않으므로 그대로 옮겼다 — 지울지 여부는 기능 삭제라 별도 결심 안건.
- `showLastAuthBadge` 도 인라인에서 부르는 곳이 없어 가져오기 줄이 없다(세포 키트에만 있다).
- 화면에서 누를 수 있는 길이 없는 함수는 게스트 조작 비교에서 window 노출 이름·앱 스코프 통로로 직접 불러 맞댔다(두 앱 같은 조작): `openGuestBackupNudgeModal`·`checkGuestBackupNudge`·`openTeamLinkedPersonalGoalModal`·`openTeamInviteModal`·`importTemplateInstantly`·`applyQuickCunningText`·`showLevelUpBanner`·`sendToNotion`·`openChangePasswordModal`.
- 실계정 비교는 이번 PR 에서 돌리지 않았다(주장에 「확인 못 함」으로 적음). 게스트 시드·Supabase 목으로 잰 값만 있다.
- 설정 탭 단추 대부분은 접힌 `<details>` 안에 있어, 화면 시나리오는 그 묶음 머리(summary)를 먼저 눌러 펼친 뒤 누른다(사람과 같은 길).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-p0`(브랜치 `feat/2026-10-05-task-es-437-inline-p0-1`, 기준 origin/main a89ce00) → 헌법 세포골격 절·분열 규칙·1차 선례 정독 → 생성기·검사기 일반화 → 구역 전체 모의 이전으로 시험지 의존 측정 → 깨지지 않는 묶음만 설정 → 생성 → verify → 모듈 로드 탐침 → `npm test`·tests 108개 기준/후 → 게스트 조작 비교(기준 2회·후 1회) → 법정 형식 화면 시나리오 4개 기준/후 → 신고서·설명·가드·지도 → 커밋 → 세포지도 재생성 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "함수 선언(끌어올림)이 IIFE 머리의 `var` 가져오기로 바뀌면, 그 줄보다 먼저 부르는 곳이 `undefined` 를 받는다." → 이음매는 Supabase 구획 앞, 즉 IIFE 맨 앞의 이음매들과 테마 초기화 `try` 뒤다. 그 앞에는 getter 정의·키트 가져오기·`data-theme` 초기화뿐이고 옮긴 함수를 부르는 문이 없다(스코프 분석: 옮긴 이름을 부르는 곳은 모두 이음매보다 뒤). 측정: 게스트 조작 비교 콘솔 오류 기준·후 같음, 모듈 로드 탐침 회귀 0.
- 반론 2: "묶음 일부만 옮기면 window 노출 줄이 옮긴 함수보다 먼저 돌아 `undefined` 를 노출한다." → 노출 줄은 원래 자리(이음매보다 뒤)에서 가져온 같은 이름을 읽으므로 같은 함수가 달린다. 측정: 게스트 조작 비교의 `globals` 칸(옮긴 24개 이름의 `typeof window[이름]`)이 기준과 같다.
- 반론 3: "모의 이전으로 고른 '안 깨지는 묶음'도 법정의 기준 시험지에서 깨질 수 있다." → 기준 사본(a89ce00 `git archive`)과 작업 트리에 tests 108개·npm test 를 같은 방식으로 돌려 종료 코드를 맞댔다. 다른 것은 module-guard(기준선 갱신 전 측정 — 갱신 뒤 통과)·cell-map-export(기준 사본에 git 이 없어 기준 쪽만 실패)뿐이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `.theme-card[data-themeid]`, `#btnPreviewAvatarGreeting`, `#avatarGreetingModal`, `#levelUpBannerSlot`, `#setTermsLink`, `#setPrivacyLink`, `#setGroupDataSummary`, `#btnRestartGuide`, `#btnMiniGuideDetail`, `#guideSkip1`, `#tourSkip`, `#tourGo`, `#screen-comm`, `#modalOverlay`, `#toast`.
- 함수: 3-2 표의 24개, `OurgoalAppScope.expose`, `OurgoalSettingsKit`·`OurgoalGoalsKit`·`OurgoalRecordsKit`.
- 파일: `index.html`, 3-2 표의 세포 10개, `docs/design/harness/module-split/gen-inline-p0.js`·`verify-inline-p0.js`·`dom-compare-inline-p0.js`·`cell-desc-add.js`·`inline-p0-1.json`·`inline-p0-1-cells.json`, `docs/architecture/INLINE-SCRIPT-MAP.md`·`inline-script-map.json`·`modules.json`·`cell-descriptions.json`·`cell-map.json`·`module-baseline.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main a89ce00(`git archive` 사본). 결과 파일은 `reports/TASK-ES-437/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 인라인 줄 수 | `module-guard` ① | 33,385 → 32,661 (−724), ② 함수 선언 658 → 630, ③ 282 그대로 |
| 글자 동일 | `verify-inline-p0.js` | 옮긴 24선언 토큰열 동일(L. 접두 제외), 덩어리 23개 줄 단위 동일(주석 포함, 777줄), 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0, 새 파일 10개 모두 800줄 이하 (`verify-inline-p0.json` ok) |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0 (`module-load-probe.json`) |
| 시험 | `npm test` · tests 108개 | smoke 443/0 · 무결성 38/38 기준=후, 108개 종료 코드 같음(다른 것: cell-map-export 는 기준 사본에 git 이 없어 기준 쪽만 실패) — `test-compare.json` |
| 조작 전후(게스트) | `dom-compare-inline-p0.js` 세트 1 | 38단계 × 10칸 = 380값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (`dom-compare-inline-p0-1.json`) |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario 로컬 | 4개 기준·후 모두 통과, 약점 0 — `scenario-local.json` |

[4단계: 심사 청구]
