# REQ — #TASK-ES-444 인라인 스크립트 세포화 P1 구역 2차: 일정·소통·기록·설정 13묶음 세포 이전

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON·CELL_SPLIT·CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`. 선례: #TASK-ES-423(#744), P1 1차 #TASK-ES-436(#752, 부분 묶음 생성기).
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나? 지금 왜 적극적으로 진행하지 않는것 같지?" → P1 구역(지도 G075~G125) 22묶음을 PR 을 연달아 내며 옮긴다. 이 PR 은 두 번째.
- 범위: P1 구역 중 13묶음(G075·G078·G081·G083·G084·G087·G091·G095·G097·G103·G125 — 지도 id 는 origin/main 판)의 함수 선언 22개를 세포 파일 9개로 글자 그대로 옮김. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0.
- 도구는 #TASK-ES-436 과 같은 파일(`gen-inline-p1.js`·`verify-inline-p1.js`·`register-inline-p1.js`·`dom-compare-inline-p1.js` — 이 PR 은 origin/main 위라 같은 글자로 함께 싣는다, dom-compare 는 포트를 운영체제가 고르게 한 줄 고침) + 설정 `inline-p1-444.json`·단계 `dom-steps-inline-p1-444.js`.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 IIFE 의 P1 구역 묶음을 세포로 옮겨 미분화 덩어리를 줄인다(속도 우선, 묶음 여러 개를 한 PR 에).
2. 생성기로 글자 그대로(이름 참조 `L.`·`K.` 접두만), 원본 결함도 그대로. 인라인 줄 순증가 0.
3. 매 PR: verify, npm test, 옮긴 묶음 위주 게스트 조작 비교, 화면 동작은 법정 형식 게스트 시나리오. 새 세포 등록(cell-descriptions·modules·baseline·cell-map·inline-script-map). 주장에는 main 이 움직이면 바뀌는 전체 수치를 쓰지 않는다(옮긴 묶음 자체의 성질과 화면 시나리오만).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 일정 배경 사진·잠금화면 라이브 카드·챌린지 룸·첫 응원·피드 미리보기·사진 인증·히트맵 요약·적응형 화면 모드·설치 안내가 3만 줄 IIFE 한 스코프에 있어 각 기능의 경계가 보이지 않는다.
- **원인**: 이 묶음들은 대부분 window 노출·이벤트 등록·최상위 변수(`capturePhotoBtn` 등)·시험지가 index.html 한 파일에서 세는 확인창 줄을 함께 갖고 있어 통째로 옮길 수 없었다.
- **중심**: 함수 선언만 옮기고 로드 중 문·변수는 그 자리에 두는 부분 묶음 옮기기(#TASK-ES-436 생성기).
- **핵심**: 시험지가 index.html 한 파일에서 글자를 찾는 함수(`openCalendarDayBgPickerModal` — tests/core-confirm-es376 이 그 안의 `ui.confirm` 줄을 센다)는 남기고, 나머지 함수만 옮긴다.

## 3. [원칙 ③] 해결방식

| 묶음 | 옮긴 함수 | 남긴 것(이유) | 새 세포 |
| :-- | :-- | :-- | :-- |
| G075 일자별 배경 사진 창 | `compressCalendarBgImage` | `openCalendarDayBgPickerModal`(시험지 core-confirm-es376), window 노출 if | `js/tabs/calendar/day-bg-image.js` |
| G078 잠금화면 라이브 서비스(통째) | `buildLockScreenCardPayload` · `syncLockScreenLiveCard` · `closeLockScreenLiveCard` | — | `js/tabs/calendar/lockscreen-live.js` |
| G091 소규모 챌린지 룸(통째) | `openChallengeRoomModal` | — | `js/tabs/comm/challenge-room.js` |
| G097 첫 맞춤 응원(통째) | `triggerFirstCheerResponse` · `scheduleCheerDelivery` | — | `js/tabs/comm/first-cheer.js` |
| G103 피드 게시 미리보기 | `toggleFeedPostPreview` | window 노출 | `js/tabs/comm/feed-post-preview.js` |
| G095 사진 인증 & 뷰어 | `openPhotoViewerModal` · `compressImage` | `pendingCapturePhoto`·`capturePhoto*` 변수, 등록 if | `js/tabs/records/photo-proof.js` |
| G087 최근 히트맵 요약(통째) | `renderHomeGrassSummary` | — | `js/tabs/records/heatmap-summary.js` |
| G081 Adaptive UX Mode · G083 UX Telemetry | `getUxMode` · `switchUxMode` · `renderAdaptiveModeBar` · `_recordHesitation` | window 노출, `_uxTelemetry` 변수, 등록 if | `js/tabs/settings/adaptive-ux.js` |
| G084 iOS 홈 화면 배너 · G125 모바일 하드닝 | `renderIosPwaBanner` · `openIosPwaInstallGuideModal` · `initKeyboardShield` · `openPwaInstallGuideModal` · `closePwaInstallGuideModal` · `switchPwaOsTab` · `confirmPwaInstall` | window 노출 6줄, 키보드 가림 방지 등록 if | `js/tabs/settings/pwa-install.js` |

- 건너뜀: G085(갓생 스타터 — 함수가 smoke FN_NAMES `quickCreateStarterGoal` 뿐), G089(MZ 스토리 캔버스 — `generateMzStoryCanvas` smoke FN_NAMES 뿐), G120(최상위 변수 2개뿐, 옮길 함수 없음).
- 키트: 기존 `OurgoalCalendarKit`·`OurgoalCommKit`·`OurgoalRecordsKit`·`OurgoalSettingsKit`(새 전역 0). 이음매는 IIFE 머리 [#TASK-ES-379] 소통 이음매 expose 바로 다음(1차 #TASK-ES-436·P0·P2 빌더가 쓰는 자리와 겹치지 않게). 새 getter 3개(`SIM_PERSONAS`·`_uxTelemetry`·`announceToA11y`).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **숨은 기능**: `openChallengeRoomModal`(소규모 챌린지 룸 창)은 앱 어디에서도 부르지 않고 window 에도 없다 — 화면에서 열 길이 없다(옮기기만 했다, 지우지 않음).
- **원본 결함(그대로 옮김)**: 설치 안내 창의 OS 탭 전환(`switchPwaOsTab`)은 단추 활성만 바꾸고 iOS·Android 단계 묶음(`#pwaGuideIosSteps`·`#pwaGuideAndroidSteps`)은 둘 다 계속 보인다. iOS 배너(`renderIosPwaBanner`)는 iOS 가 아닌 브라우저에서는 그리지 않아 PC 화면에서 볼 수 없다.
- 설정 탭 화면 모드 칩(`#btnModeGamified` 등)은 390×844 법정 화면에서 진짜 마우스로 닿지 않았다(스크롤 뒤에도 그 점에 요소 없음) → 법정 시나리오로 내지 않고 게스트 조작 비교로 쟀다.
- 게스트 조작 비교에서 같은 기준 앱 두 번 사이에 체크인 기록의 `metrics.duration` 값(30/0)이 갈렸다(26값, 기준 앱 자체의 흔들림 — 옮긴 함수와 무관한 체크인 지표 파서). 기준 대 후는 0 이다.
- 사진·배경 사진은 브라우저 안에서 같은 캔버스 그림 파일을 만들어 입력에 넣었다(파일 선택 창은 법정 도구 한계 — 시나리오로 내지 않음).

## 5. [원칙 ⑤] 절차

origin/main eb9e6e4 위 새 브랜치(같은 워크트리 `C:/dev/wt/inline-p1`) → 설정 → 생성기(기준 = `git archive` 사본 index.html) → verify → 시험(깨진 시험지는 그 함수를 남김) → 등록 도구 → 커밋 → 시험 비교(같은 커밋의 분리 워크트리 `C:/dev/wt/inline-p1-base`) → 게스트 조작 비교(기준 2회·후 1회) → 법정 형식 시나리오 로컬 기준/후 → 문서 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "`window.switchUxMode = switchUxMode;` 같은 노출 줄이 옮긴 함수보다 먼저 돌던 끌어올림을 잃는다." → 노출 줄은 원래 자리(IIFE 가운데)에 그대로 있고 이름은 IIFE 머리 이음매에서 이미 가져온 뒤라 같은 함수 값을 단다. 측정: 게스트 조작 34단계 window 종류 23개 기준과 같음, 콘솔 오류 0/0/0, 마크업의 `onclick="switchUxMode(…)"`·`openPwaInstallGuideModal()` 단추가 기준과 같은 결과.
- 반론 2: "`openCalendarDayBgPickerModal` 은 남고 그 안에서 부르는 `compressCalendarBgImage` 만 옮기면 호출이 끊긴다." → 남은 함수가 부르는 이름은 이음매가 같은 이름으로 가져온다(verify 「안 가져온 사용 0」). 측정: 같은 그림 파일을 배경 사진 입력에 넣은 단계의 모달·저장값이 기준과 같다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#btnPwaInstallGuide`, `#modalPwaInstallGuide`, `#btnPwaOsAndroid`, `#btnPwaOsIos`, `#btnClosePwaGuide`, `#btnConfirmPwaInstall`, `#btnModeGamified`·`#btnModeAnalyst`·`#btnModeMinimal`, `#btnCommPostFeed`, `#sharePreviewBtn`, `#sharePreviewSlot`, `#capturePhotoInput`, `#capturePhotoPreview`, `#calDayBgFileInput`, `#homeGrassSummaryCard`, `#captureSave`.
- 함수: 위 표 22개 + 남김 `openCalendarDayBgPickerModal`, `OurgoalAppScope.expose`.
- 파일: `index.html`, 새 세포 9개, `docs/design/harness/module-split/inline-p1-444.json`·`dom-steps-inline-p1-444.js`, `docs/architecture/*`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main eb9e6e4. 결과 파일은 `reports/TASK-ES-444/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 옮긴 양 | 생성기 메타 | 함수 22개, 덩어리 16개 784줄이 index.html 에서 빠지고 표지 주석으로 바뀜(같은 main 기준 인라인 −740줄) |
| 글자 동일 | `verify-inline-p1.js` | 22개 함수 토큰 동일, 덩어리 16개 줄 단위 동일, index.html 나머지 그대로, 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0, 새 파일 64~272줄 |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0 |
| 조작 전후(게스트) | `dom-compare-inline-p1.js` | 34단계 × 10칸 = 340값, 기준 대 후 0, 콘솔 오류 0/0/0 (기준 대 기준 26값은 4절) |
| 화면 시나리오(법정 형식) | runScenario 로컬 | 설치 안내 창·피드 게시 미리보기 2개 기준·후 통과 |
| 시험 | `npm test` · tests 108개 | npm test 종료 0/0, smoke 443/0, 108개 종료 코드·정규화 출력 같음 |

[4단계: 심사 청구]
