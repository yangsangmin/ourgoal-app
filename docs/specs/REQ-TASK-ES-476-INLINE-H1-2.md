# REQ — #TASK-ES-476 인라인 어려움 구역 H1 2차 — 네 묶음(아바타 레벨업 팝업·카카오톡 인앱 브라우저 감지·첫 체크인 튜토리얼·AI 초집중 모드)을 세포 4개로 이전(동작 그대로)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(#TASK-ES-439) · 구역 H1 1차 #TASK-ES-466(#772 병합) · 시험지 선행 #TASK-ES-469(#768 병합).
- 범위: 구역 H1 어려움 묶음 네 개를 #762 생성기 `gen-inline-hard.js` 로 글자 그대로 옮긴다. 이름 참조만 `L.` 접두, 기존 탭 키트(`OurgoalSettingsKit`·`OurgoalRecordsKit`·`OurgoalGoalsKit`)에 이름을 단다(새 전역 0). 머리 이음매는 자리 표지 `H1` 아래(1차 이음매 다음)에만 넣는다. 생성 지도 3종은 커밋하지 않는다(main 판 그대로).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

| 묶음(구획 주석 제목) | 새 세포 | 옮긴 것 |
| :-- | :-- | :-- |
| [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | `js/tabs/settings/avatar-levelup-modal.js` | `filterHarmfulWords`·`openAvatarLevelUpModal`·`closeAvatarLevelUpModal` + 로드 중 문 4개 감쌈(`bindAvatarLevelUpBackdrop`·`bindAvatarGrowthPromptSave`·`bindAvatarLevelUpShare`·`bindAvatarLevelUpSaveImage`) |
| [#TASK-ES-222] [생각 메모장 92번] 카카오톡 인앱 브라우저 감지 및 Android … | `js/tabs/settings/inapp-landing.js` | `checkKakaoInAppBrowser`·`escapeKakaoInAppBrowser` + 첫 화면 단추 등록 4개 감쌈(`bindLandNickQuickLink`·`bindLandStartBtn`·`bindLandLoginLink`·`bindLandGuestBtn`) |
| 3단계: 첫 체크인 튜토리얼 가이드 및 축하 연출 | `js/tabs/records/first-checkin-tutorial.js` | 함수 7개(`renderFirstCheckinTutorialBanner`·`triggerFirstCheckinCelebrationModal`·`sendFirstCheckinWelcomeStamps`·`getPeerRunnersForCategory`·`peerCategoryKey`·`canSendFirstCheckinWelcome`·`firstCheckinWelcomeSentToday`) |
| 1순위 대표 목표 AI 초집중 모드 (Focus Auto-Pilot) | `js/tabs/goals/focus-autopilot.js` | `openFocusAutoPilotModal`·`openMzShareCardModal` (타이머 상태 변수 3개는 원래 자리, `FEED_POSTS_CACHE` 대입은 setter) |

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 미분화 덩어리(index.html 인라인 IIFE)에서 책임 단위 세포를 떼어 내되 동작은 하나도 바꾸지 않는다.
- **원인**: 네 묶음은 「어려움」 유형(B1 window 노출 · B2/B3 로드 중 등록 문 · A1 남의 상태 재대입 · C 인라인 onclick · L 통로에 없는 이름 · F1m 시험지 단독 의존)이라 1차 생성기로 옮길 수 없었다. F1m(레벨업 팝업 묶음)은 실제 생성기로 옮기면 가져오기 줄이 이름을 남겨 시험지가 깨지지 않음을 #768 모의 이전으로 쟀다.
- **중심**: 표준 이음매(설계 2절) — 함수 이동·같은 이름 가져오기, 상태 변수·노출 줄·3줄 이하 문은 원래 자리, 4줄 이상 로드 중 문은 bind 함수로 감싸 원래 자리에서 부름, getter·setter 통로.
- **핵심**: 설정 `inline-hard-h1-476.json` 한 장으로 생성기가 만든다(손으로 옮긴 글자 0).

## 3. [원칙 ③] 해결방식

- 설정 → `gen-inline-hard.js`(입력 = origin/main 7ffdfd6 index.html) → `verify-inline-hard.js` → 단독 로드 탐침 → 신고서·설명 → 시험 → 게스트 조작 비교(`dom-compare-inline-h1.js` + `dom-steps-inline-h1-476.js`) → 법정 형식 시나리오 4개(세포마다 하나).

## 4. [원칙 ④] 재검토 — 한계와 발견

- 레벨업 팝업은 게스트가 경험치 100(Lv.2)에 닿을 때 뜬다 → 시나리오는 기록 0건 게스트로 체크인을 일곱 번 남긴다(첫 체크인 축하 창·AI 피드백 시트·세 번째의 게스트 백업 안내를 차례로 닫음). 47단계.
- 첫 화면 단추 처리기 네 개는 게스트로 들어간 뒤에는 누를 수 없어, 조작 비교가 아니라 시나리오(「로그인」 → 로그인 화면)로 잰다. 이메일 가입·닉네임 빠른 입장·둘러보기 단추는 감싼 문 글자 동일·처리기 수 동일(verify)로 잰다 — 이메일 가입(`#landStartWrap`)·둘러보기(`#landGuestBtn` 부모)는 마크업에서 `display:none` 이라 사용자가 누를 수 없다(이전 전과 같음, 발견으로 적음).
- 조작 비교의 마지막 「홈 콕핏 둘러보기」 단계는 시드 게스트가 기록이 있어 첫 체크인 축하가 뜨지 않으므로 양쪽 모두 `missing` 이다(같은 값) — 첫 체크인 축하는 시나리오 first-checkin-celebration 이 잰다.
- 목표 템플릿 백과사전 전체화면 팝업 묶음은 이번에 넣지 않았다: 게스트가 그 창을 여는 단추(`#btnGoalTemplateEncyclopedia`·`#og-task-53-action-btn`)가 숨은 부모 안에 있고, 팀 목표 만들기 창 경로(`#btnOpenEncyclopediaFromTeam`)는 게스트 화면에 팀 카드가 없어 닿지 않는다(작업자 탐색) → 다음 PR 에서 진입로를 다시 찾거나 남긴다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h1-b`(브랜치 `feat/2026-10-05-task-es-476-inline-h1-2`, #772 위에서 시작 → 병합 뒤 origin/main 7ffdfd6 으로 빨리 감기, 생성기 다시 돌림) → 설정·생성 → verify → 단독 로드 → 신고서·설명·가드 → 시험 126개 기준/작업 → 게스트 조작 비교(기준 2회·작업 1회) → 시나리오 4개 기준/작업 → 문서·주장 → 커밋 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "첫 화면 단추 등록(둘러보기 단추 포함)을 함수로 감싸면 로드 순서가 바뀌어 첫 화면이 죽는다." → bind 함수는 index.html 원래 자리에서 같은 순서로 한 번씩 불린다(verify ⑦ 부르는 줄 하나씩, ③ 남은 글자 동일, ⑥ 처리기 619 = 588 + 31). 시나리오 landing-login-link 와 게스트 진입(모든 시나리오의 첫 단계)이 기준·작업 모두 통과.
- 반론 2: "레벨업 팝업 시나리오가 47단계라 흔들린다." → 기준·작업 각각 로컬 법정 실행기로 통과했고, 단계마다 waitFor 로 뜨는 창을 기다린다. 흔들리면 그 주장은 「안 됨」이 아니라 같은 시나리오 기준 쪽도 실패로 드러난다(기준·작업 대칭).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#avatarLevelUpModal`·`#avatarLevelUpTitle`·`#btnConfirmLevelUpClose`·`#btnSaveGrowthPrompt`·`#avatarGrowthPromptInput`, `#landLoginLink`·`#landingScreen`·`#authScreen`·`#landNickQuickLink`·`#landStartBtn`·`#landGuestBtn`, `#captureInput`·`#captureSave`·`#firstCheckinDoneBtn`·`#btnCheckinAiClose`·`#btnGuestBackupLater`·`#modalOverlay`, `#mzShareBtn`·`#mzRatioLabel`·`#mzCardCloseBtn`.
- 함수: 1절 표 + `OurgoalAppScope.expose` 새 getter 18개(`avLvModalElem`·`btnSaveGrowth`·`btnSaveLvImg`·`btnShareLv`·`enterApp`·`filterFeedByCategory`·`focusTimerInterval`·`focusTimerRunning`·`focusTimerSeconds`·`generateMzStoryCanvas`·`initRememberedAuthFields`·`isValidRealUser`·`landGuestBtn`·`landNickQuickLink`·`notifyXpGained`·`openLoginRescueModal`·`openSelectCompanionForStoryModal`·`openSelectTeamForStoryModal`).
- 파일: `index.html`, 새 세포 4개, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-hard-h1-476.json`·`dom-steps-inline-h1-476.js`, `reports/TASK-ES-476/*`.

## 8. [원칙 ⑧] 막히는 지점 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-inline-hard.js` | ok — 토큰·덩어리 줄·남은 글자 동일, 누수·미노출·setter 빠짐·남은 정의·안 가져온 사용·this/arguments 0, 처리기 619 = 588 + 31 (`verify-inline-hard.json`) |
| 새 파일 줄 수 | 생성기 | avatar-levelup-modal 191 · inapp-landing 196 · first-checkin-tutorial 278 · focus-autopilot 517 |
| index.html | 생성기 | 이 PR 의 이전 전 26,939줄 → 25,970줄(−969) |
| 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 4개 단독 로드 ok·기존 키트 하나씩 (`module-load-probe.json`) |
| 시험 | tests·scripts 126개 + npm test 구성 | 종료 코드 기준 = 작업 126/126(기준 원래 실패 31 같음), smoke 443/0 (`test-compare.json`) |
| 모듈 가드 | `module-guard.js` | 통과(탭 간 직접 참조 0) |
| 게스트 조작 비교 | `dom-compare-inline-h1.js` | 12단계 × 10칸 = 120값, 기준 대 작업 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (`dom-compare.json`) |
| 화면 시나리오 | `court/lib/scenario.js` 로컬 | 4개 기준·작업 모두 통과, 약점 0 (`scenario-local.json`) |

[4단계: 심사 청구]
