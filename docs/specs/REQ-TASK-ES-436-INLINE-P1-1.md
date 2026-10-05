# REQ — #TASK-ES-436 인라인 스크립트 세포화 P1 구역 1차: 목표 AI·일정 설정 · 기록 AI 피드백 8묶음 세포 이전

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON — `index.html` 인라인 스크립트는 미분화 덩어리, 분열 절차 CELL_SPLIT, 증명 CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`. 선례: 인라인 세포화 1차 #TASK-ES-423(#744, 지도·생성기·하네스).
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나? 지금 왜 적극적으로 진행하지 않는것 같지?" → 지도(`docs/architecture/inline-script-map.json`)의 index.html 약 10489~23037행 구간 22묶음(P1 구역)을 병렬 빌더 한 명이 PR 을 연달아 내며 옮긴다. 이 PR 은 그 첫 번째.
- 범위: P1 구역 중 8묶음(G098·G099·G108·G111·G113·G114·G116·G117)의 함수 선언 28개를 세포 파일 5개로 글자 그대로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 IIFE(기준 origin/main a89ce00 에서 모듈 가드 ① 33,385줄)는 아직 미분화 덩어리다. P1 구역 22묶음(약 3,000줄)을 세포 파일로 옮겨 인라인을 줄인다 — 속도 우선, PR 을 연달아.
2. 옮기기는 생성기로 글자 그대로(이름 참조 `L.`·`K.` 접두만), 원본 결함도 그대로 옮기고 보고한다. 인라인 줄 순증가 0(줄어야 함).
3. 매 PR: verify(토큰 동일·누수 0·원본 단독 로드), npm test, 옮긴 묶음 위주의 게스트 조작 DOM 비교, 쓰이는 탭 tab-check, 화면 동작 주장은 법정 형식 게스트 화면 시나리오. 새 세포마다 cell-descriptions.json 짧은 이름·하는 일 + modules.json(module-specs --write)·module-baseline.json(module-guard --update)·cell-map.json·inline-script-map 재생성.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 목표 탭 AI(대화로 목표 관리·AI 생성 미리보기·종합상황 요약·오늘의 미션·마일스톤 축하)와 3계층 일정 설정, 기록 AI 피드백(프롬프트·공급자 요청·로컬 대체)이 3만 줄 IIFE 한 스코프에 흩어져 있어, 이 기능을 고칠 때마다 index.html 전체를 만진다.
- **원인**: 1차 생성기(gen-inline-split-1.js)는 묶음 안의 모든 최상위 문이 옮길 함수일 때만(통째) 옮길 수 있었다. P1 구역 묶음 대부분은 로드 중 바로 도는 문(`window.X = X` 노출·이벤트 등록·if 블록), 최상위 변수(`GeminiQuotaDispatcher` 등), smoke-test 가 인라인에서 잘라 가는 함수(`localTodayMission`·`localNextActionSuggestion`)가 함수와 섞여 있다.
- **중심**: 함수 선언만 떼어 내고 나머지 문은 원래 자리에 그대로 두는 「부분 묶음」 옮기기 — 남는 문이 옮긴 함수를 부르면 IIFE 머리에서 같은 이름으로 가져온 것을 부른다.
- **핵심**: 생성기를 일반화(`gen-inline-p1.js` + 작업별 설정 `inline-p1-436.json`)하고, 검사기(`verify-inline-p1.js`)가 토큰·덩어리 줄뿐 아니라 「index.html 나머지가 한 줄도 안 바뀌었는가」까지 맞댄다.

## 3. [원칙 ③] 해결방식

| 묶음(기준 지도) | 옮긴 함수 | 남긴 것(이유) | 새 세포 |
| :-- | :-- | :-- | :-- |
| G108 대화로 목표 관리(56줄, 통째) | `goalAgentSnapshot` · `requestGoalAgentDiff` · `sanitizeAttachments` | — | `js/tabs/goals/ai-agent.js` |
| G111 목표 AI 생성 미리보기(458줄) | `renderGoalOpsFullPreviewHtml` · `showGoalAgentLoadingStep` · `showGoalAgentReviewStep` · `sendGoalAgentMessage` | window 노출·`toggleAgentBtn` 변수·이벤트 등록(로드 중 문) | 〃 |
| G113 현재 종합상황(98줄) | `computeGoalStatusHash` · `localGoalStatusSummary` · `generateGoalStatusSummary` | `refreshGoalStatusSummary`(tests/ai-conditional-call-optimization 이 index.html 한 파일에서 그 가드 글자를 찾음) | `js/tabs/goals/ai-status.js` |
| G114 오늘의 미션(26줄) | `milestonesForMission` · `requestTodayMission` | `localTodayMission`(smoke FN_NAMES) | 〃 |
| G116 마일스톤 완료 축하(58줄) | `requestNextActionSuggestion` · `celebrateMilestoneDone` | `localNextActionSuggestion`(smoke FN_NAMES) | 〃 |
| G117 3계층 일정설정(240줄) | `formatSchedulePillHtml` · `openScheduleSetupModal` · `applyScheduleUpdate` | window 노출 if 블록 | `js/tabs/goals/schedule-setup.js` |
| G098 AI feedback(270줄) | `milestonesForAI` · `getUpcomingSchedulesForAI` · `getRecentCheckinsForAI` · `getLastFeedbackAdvice` · `initFeedbackTierBar` · `buildFeedbackPrompt` · `parseFeedbackJSON` · `requestAIFeedback` | `THEME_FEEDBACK_PROMPTS` 변수 | `js/tabs/records/ai-feedback.js` |
| G099 Gemini 쿼터 방어(321줄) | `requestServerAIFeedback` · `requestGeminiFeedback` · `localFeedback` | `PREMIUM_FEEDBACK_CATALOG`·`GeminiQuotaDispatcher`·`requestClaudeFeedback`·`DONE_KEYWORDS` 변수, window 노출 2줄 | `js/tabs/records/ai-feedback-providers.js` |

- 생성기 `docs/design/harness/module-split/gen-inline-p1.js`: 묶음을 구획 주석 글자로 찾고(지도 id 는 옮길 때마다 바뀐다), 모든 문이 옮길 함수면 구획 주석째(통째), 아니면 함수 선언과 바로 앞 자기 주석만(부분) 옮긴다. 인라인 스코프 이름은 `L.<이름>`(app-scope getter), 같은 키트의 다른 세포 함수는 `K.<이름>`, 다른 키트 세포 함수는 `L.<이름>`(IIFE 머리에서 가져온 이름을 getter 로 노출 — 이번에는 `milestonesForAI` 1개: 목표 세포가 기록 세포의 것을 부른다). 멈추는 검사: smoke FN_NAMES 이동 · 재대입 · 옮길 함수의 최상위 this/arguments · `L.` 로 부를 인라인 함수의 최상위 this · 옮길 코드 안 `L`/`K`/`global` 이름 · 덩어리가 문을 가름.
- 키트는 이미 있는 `OurgoalGoalsKit`(`_goalsKit`)·`OurgoalRecordsKit`(`_recordsKit`) → 새 전역 0. 새 script 태그는 그 탭 `index.js` 태그 앞 같은 줄(순증가 0줄).
- index.html: IIFE 머리 #TASK-ES-423 이음매 바로 다음에 이번 이음매(가져오기 15줄 + 새 getter 13개 — 다른 구역 빌더가 쓰는 자리와 겹치지 않게), 옮긴 자리마다 표지 주석 한 줄(같은 세포 이웃은 합침).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- `refreshGoalStatusSummary` 는 시험지가 index.html 한 파일에서 글자로 찾아 이번에 옮기지 않았다(시험지 범위만 넓히는 선행 PR 이 있어야 옮길 수 있다). `localTodayMission`·`localNextActionSuggestion` 은 smoke-test 가 인라인에서 잘라 실행해 남겼다.
- 옮긴 `applyScheduleUpdate` 는 IIFE 스코프에 없는 전역 이름 `renderStatsScreen` 을 `typeof` 가드로 읽는다(이전 전과 같은 전역 조회 — 바뀐 것 없음, 이름만 기록).
- 법정 환경(외부 차단·/api 404·시드 없는 게스트)에서는 목표가 없어 화면 시나리오가 「10km 마라톤 완주 로드맵」 템플릿을 먼저 담는다. 그 빈 화면의 템플릿 카드 `#goalTemplateHeroCard` 가 같은 id 로 두 번 그려진다(기존 결함, 이번에 고치지 않음).
- 홈 AI 피드백 단계 막대(`#checkinFeedbackTierBar`)는 390×844 법정 화면에서 아래쪽 홈 나침반 단추(`#homeCompassCrew`)에 가려 진짜 마우스로 누를 수 없었다 → 법정 시나리오로 내지 않고 게스트 조작 비교(단추 `.click()`)로 쟀다. 사람이 스크롤로 닿는지는 확인하지 못했다.
- 실계정 읽기 비교는 이번 PR 에서 하지 않았다(옮긴 함수는 AI·일정 화면 로직이고 계정별 서버 데이터 경로를 새로 만들지 않는다).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-p1`(브랜치 `feat/2026-10-05-task-es-436-inline-p1-1`, 기준 origin/main a89ce00) → 1차 REQ·하네스·법정 판례 정독 → 생성기·검사기 일반화 → 설정 → 기준 사본 `git archive a89ce00` → 생성기 → verify → 법정 모듈 로드 탐침 → 시험 비교(시험지가 깨진 함수는 남김) → 등록 도구(`register-inline-p1.js`: cell-descriptions → module-specs --write → module-guard --update → inline-script-map --write → cell-map-export) → 게스트 조작 비교(기준 2회·후 1회) → 법정 형식 화면 시나리오 기준/후 → tab-check(기준 2회는 같은 main 커밋에서 재사용, 후는 홈·목표·기록) → 문서 → 커밋 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "함수 선언(끌어올림)이 IIFE 머리 `var X = _kit.X` 로 바뀌어, 그 줄보다 먼저 부르는 곳이 있으면 undefined 다." → 이음매는 IIFE 머리(앞선 이음매들 바로 다음)이고 그 앞에는 키트 변수·getter 정의뿐이다. 로드 중 옮긴 함수를 읽는 남은 문(`var requestClaudeFeedback = requestServerAIFeedback;`, window 노출 if 블록, `goalAgentSendBtn` 이벤트 등록)은 모두 그 뒤에 실행된다. 측정: 게스트 조작 25단계 콘솔 오류 기준·기준·후 0/0/0, window 종류 16개 기준과 같음.
- 반론 2: "부분 묶음은 구획 주석과 함수가 갈라져 글자 그대로가 아니다." → 검사기가 덩어리 13개를 줄 단위로(주석 포함) 원본과 맞대고, 새 index.html 에서 이음매·새 태그 글자를 뺀 나머지가 「원본에서 덩어리만 표지 주석 한 줄로 바꾼 것」과 한 줄도 다르지 않음을 확인한다(남긴 문은 글자·자리 그대로).
- 반론 3: "목표 세포가 기록 세포 함수를 `L.` 로 부르면 키트 사이 결합이 생긴다." → 이전 전에도 같은 스코프에서 부르던 관계이며, 이음매가 그 이름을 가져와 getter 로 노출하는 것은 인라인에 남은 공용 함수를 부르는 통로와 같다(새 전역 0).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `button.schedule-pill-btn[data-setschedule]`, `#schedPresetTomorrow`, `#schedPreset1W`, `#schedSaveBtn`, `#schedCancelBtn`, `#btnToggleGoalAgent`, `#goalAgentInput`, `#goalAgentSendBtn`, `.ms-status[data-cyclestatus]`, `#checkinFeedbackTierBar [data-fbtier]`, `#captureInput`, `#captureSave`, `#modalOverlay`, `#toast`, `#sanctuaryGoalsView .btn-quick-adopt-goal`.
- 함수: 위 표 28개 + 남김 `refreshGoalStatusSummary`·`localTodayMission`·`localNextActionSuggestion`, `OurgoalAppScope.expose`, `OurgoalGoalsKit`, `OurgoalRecordsKit`.
- 파일: `index.html`, `js/tabs/goals/ai-agent.js`·`ai-status.js`·`schedule-setup.js`, `js/tabs/records/ai-feedback.js`·`ai-feedback-providers.js`, `docs/design/harness/module-split/gen-inline-p1.js`·`verify-inline-p1.js`·`register-inline-p1.js`·`dom-compare-inline-p1.js`·`dom-steps-inline-p1-436.js`·`inline-p1-436.json`, `docs/architecture/*`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main a89ce00(생성기·verify·조작 비교·시나리오는 `git archive` 사본, 시험 비교는 git 이력이 필요한 시험이 있어 같은 커밋의 분리 워크트리 `C:/dev/wt/inline-p1-base`). 결과 파일은 `reports/TASK-ES-436/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 인라인 줄 수 | `module-guard` ① | 33,385 → 32,150 (−1,235), ② 658 → 629, ③ 282 그대로, ④ 1 그대로 |
| 글자 동일 | `verify-inline-p1.js` | 28개 함수 토큰열 동일(L./K. 접두 제외), 덩어리 13개(1,282줄) 줄 단위 동일, index.html 나머지 그대로, 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0, 새 파일 526·161·256·293·211줄 |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0 |
| 조작 전후(게스트) | `dom-compare-inline-p1.js` | 25단계 × 10칸 = 250값, 기준 대 후 0, 기준 대 기준 0, 콘솔 오류 0/0/0 |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario 로컬 | 4개(일정 저장·AI 어시스턴트 전송·마일스톤 축하·체크인 AI 피드백) 기준·후 모두 통과 |
| 시험 | `npm test` · tests 108개 | npm test 종료 0/0, smoke 443/0 · 무결성 38/38 · 버튼 943/943 기준=후, 108개 종료 코드 같음·정규화 출력 차이 0 — `test-compare.json` |
| 탭 실측 | `tab-check.js` | `tab-compare-*.json` (아래 주장) |

[4단계: 심사 청구]
