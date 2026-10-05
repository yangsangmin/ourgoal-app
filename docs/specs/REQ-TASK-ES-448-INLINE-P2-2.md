# REQ — #TASK-ES-448 인라인 스크립트 세포화 구역 P2-2: 소통·목표(팀)·설정·기록 묶음 선언 53개를 세포 12개로 이전(동작 그대로)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON·CELL_SPLIT·CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 지도 `docs/architecture/INLINE-SCRIPT-MAP.md`. 선례: 1차 #TASK-ES-423, 구역 P2-1 #TASK-ES-446(#755), 시험지 선행 #TASK-ES-447(#753)·#TASK-ES-441(#751).
- 지시: 코디네이터(2026-10-05) — 상민님 원문 "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나? 지금 왜 적극적으로 진행하지 않는것 같지?" → 구역 P2(배정 시점 main 0719592 지도 G129~G176) 전담. 묶음은 번호가 아니라 구획 주석·선언 이름으로 찾는다(병합마다 지도 번호가 밀림).
- 범위: 아래 표의 선언 53개를 글자 그대로 옮긴다. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0. 코디네이터 [기본값]에 따라 생성 파일(module-baseline.json·cell-map.json·inline-script-map.json·INLINE-SCRIPT-MAP.md)은 커밋하지 않는다(병합 뒤 세포지도 담당이 갱신) — modules.json·cell-descriptions.json 만 갱신.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `index.html` 인라인 IIFE 구역 P2 의 나머지 묶음을 동작 그대로 세포로 떼어 인라인 줄을 줄인다(순증가 0).
2. P2-1 에서 시험지 때문에 뺀 `wireRecordCards`·스톱워치 위젯(G140)·피드 동기화(G158)·위젯 설정 창은 시험지 선행 #753 이 병합되어 이번에 옮긴다.
3. 주장에는 main 이 움직이면 바뀌는 전체 수치(인라인 줄 수·IIFE 줄 수·전체 세포 수)를 쓰지 않는다(#750 교훈) — 옮긴 묶음 자체의 성질과 화면 시나리오만.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 소통·목표(팀)·설정 탭 화면 세포는 떨어져 있는데 그 화면이 부르는 창·그리기·자료가 아직 3만 줄 IIFE 안에 있다.
- **원인**: 이 구역 묶음 대부분에 로드 중 바로 도는 문(`window.X = X`·전역 위임)이나 다른 탭이 쓰는 상수가 섞여 묶음 통째 이전이 안 됐다.
- **중심**: 최상위 선언 단위 이전(P2-1 생성기) + 이번에 더한 세 가지 — ① 다른 탭 키트 세포로 간 이름은 앱 스코프 통로(L.)로 읽기(탭 사이 직접 참조 0) ② 앞선 이음매가 getter 만 노출한 이름을 옮긴 코드가 대입하면 getter+setter 로 다시 노출 ③ 변수 초기값이 로드 중에 부르는 옮긴 함수가 인라인 이름을 읽으면 멈춤.
- **핵심**: ③은 실제로 결함을 막았다 — 첫 시도에서 예시 모임 `MOCK_GROUPS` 초기값이 로드 중 `daysFromNow` → 인라인 `pad` 를 불러, 세포 파일 단독 로드가 `L.pad is not a function` 으로 깨졌다(법정 모듈 로드 탐침으로 발견). 생성기에 검사를 넣고 `MOCK_GROUPS` 는 index.html 에 남겼다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-inline-p2.js` + 설정 `gen-inline-p2-2.config.js`. 키트는 기존 `OurgoalCommKit`·`OurgoalGoalsKit`·`OurgoalSettingsKit`·`OurgoalRecordsKit`(새 전역 0). 새 script 태그는 그 탭 index.js 태그 앞 같은 줄.

| 세포(새 파일) | 옮긴 선언 |
| :-- | :-- |
| `js/tabs/comm/sample-data.js` | AI_DISCLOSURE_NOTICE · SIM_PERSONAS · MOCK_PEOPLE · daysFromNow · EXTERNAL_DATA · CREATOR_TEMPLATES · VISIBILITY_LABELS |
| `js/tabs/goals/topic-region-picker.js` | TOPICS · topicLabel · topicPill · REGIONS · regionPickerHtml · wireRegionPicker · normalizeSubName · customSubsFor · categoryPickerHtml · wireCategoryPicker |
| `js/tabs/comm/share-card.js` | SHARE_PLATFORMS · SHARE_CANVAS_DIMS · SHARE_DOMAIN · drawShareWatermark · buildInviteLinkSuffix · scRoundRect · scWrapLines · scDrawLines · generateShareImage · buildShareText |
| `js/tabs/comm/feed-posts-sync.js` | ensureFeedPostsLoaded · setupFeedPostsRealtime (FEED_POSTS_CACHE 는 남고 통로 setter) |
| `js/tabs/goals/team-state.js` | groupState · groupCheckedToday · groupStreak |
| `js/tabs/goals/team-goal-prompt.js` | promptNewTeamGoal |
| `js/tabs/comm/manito-basics.js` | MANITO_ADJ · MANITO_NOUN · MANITO_EMOJI · MANITO_WELCOME_STAMPS · MANITO_STAMPS · sendManitoWelcomeStamp · hashStr · manitoState · manitoMajors · genAnonName |
| `js/tabs/settings/notify-soft-ask.js` | openNotificationSoftAskModal |
| `js/tabs/settings/support-modals.js` | openCustomerInquiryModal · openItemReportModal · openFaqModal |
| `js/tabs/settings/widget-settings-modal.js` | openWidgetSettingsModal |
| `js/tabs/records/record-card-wire.js` | wireRecordCards |
| `js/tabs/records/table-stopwatch.js` | playTimerBeep · STOPWATCH_STATE · renderStopwatchWidgetHtml · renderLapRowsHtml |

- 남긴 것: smoke FN_NAMES 함수(isWithinDND·generateDynamicNotification·formatStopwatchTime·getAIAnalysisPrompt·buildCSV), 같은 줄에 window 노출이 붙은 `shareContent`·`cloneTemplate`, 재대입되는 `FEED_POSTS_CACHE`·`_lastObservedDateKey`, `MOCK_GROUPS`(위 ②), 로드 중 문 전부.

## 4. [원칙 ④] 재검토 — 한계

- 이번에 안 옮긴 구역 P2 선언(보고 목록): G163 `handleDeepLinkRouting`·`checkAndHandlePeerInviteUrl`, G165 `openUserProfileModal`(OurgoalTeamInviteComm 이 없을 때만 쓰는 예비 경로라 화면에서 닿지 않음), G172 `setupNotifyTimer`·`showNotifyBanner`(알림 시각 시계), G176 `checkAndHandleDateRollover`·`setupDateRolloverWatcher`(자정 경과) — 법정 화면 시나리오로 동작을 보일 길이 없어 미룸. G157 `templatesHtml` 은 부르는 곳이 없는 함수(죽은 코드)이고 `cloneTemplate` 은 같은 줄 window 노출. G174 는 #TASK-ES-432 몫. G148·G170·G171 은 smoke 함수.
- 게스트 조작 비교의 「+ 공동 팀 목표 추가」는 목표 탭 팀목표 칸이 비교 경로에서 열리지 않아 빈 단계였고, 화면 시나리오 `goals-team-goal-add` 로 쟀다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/inline-p2`(브랜치 `feat/2026-10-05-task-es-448-inline-p2-2`, 기준 origin/main f27d63f) → 생성 → verify → 법정 모듈 로드 탐침 → 신고서·설명 → 시험 기준/후 → 게스트 조작 비교(기준 2회·후 1회) → 화면 시나리오 12개 기준/후 → 문서 → origin/main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "다른 탭 세포의 이름(예: 목표 세포가 읽는 소통 세포의 `MOCK_GROUPS`)을 직접 부르면 탭 간 직접 참조가 생긴다." → 다른 키트 이름은 앱 스코프 통로(L.)로만 읽고 index.html 이 가져와 getter 로 노출한다. 측정: 모듈 가드 ⑤ 탭 간 직접 참조 0 그대로, 팀 만들기·팀 목표 추가 시나리오 기준·작업 통과.
- 반론 2: "`FEED_POSTS_CACHE` 를 다시 노출하면 앞선 getter 와 겹쳐 값이 갈라진다." → app-scope expose 는 같은 이름을 configurable 로 다시 정의해 같은 바인딩을 가리키는 getter+setter 로 바뀐다. 측정: 피드·소통 화면 게스트 조작 비교 차이 0, guest-null-client 시험 같음.
- 반론 3: "상수를 옮기면 로드 순서 때문에 초기값이 달라진다." → 초기값이 로드 중 읽는 이름은 같은 세포 안 이름·내장 전역만 허용하고, 부르는 옮긴 함수가 인라인 이름을 읽으면 멈춘다(MOCK_GROUPS 를 실제로 막음). 측정: 새 파일 12개 단독 로드 성공.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#feedbackInquiryBtn`, `#faqAccordionBtn`, `#btnOpenWidgetModal`, `#notifySwitch`, `#btnHeroCreateTeamComm`, `#tplMarathonSmall`, `#gTopicMajor`, `#gTopicSub`, `#grpSave`, `#btnGoalsSubTeam`, `[data-addteamgoal]`, `#homeCompassQuest`, `[data-starter]`, `#sharePreviewBtn`, `#mnPreviewName`, `#mnJoin`, `#importExternalBtn`, `[data-recdel]`, `#recOpenProTemplateBtn`, `#swStartPauseBtn`, `#swLapBtn`, `#commBody [data-sub]`, `#modalOverlay`, `#toast`.
- 함수: 3절 표 53개. 파일: `index.html`, 새 세포 12개, `docs/design/harness/module-split/*inline-p2*`, `docs/architecture/modules.json`·`cell-descriptions.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main f27d63f(`git archive` 사본). 결과 `reports/TASK-ES-448/`.

| 항목 | 결과 |
| :-- | :-- |
| 인라인 줄 수(참고 — 주장 아님) | 모듈 가드 ① 32,147 → 31,096 (−1,051), ② 629 → 586 |
| 글자 동일 | verify: 53개 선언 토큰열·덩어리 53개 줄 동일, 누수 0·미노출 0·남은 정의 0·안 가져온 사용 0, 새 파일 12개 모두 800줄 이하 |
| 원본 단독 로드 | 법정 탐침 회귀 0, 새 파일 12개 단독 로드 성공 |
| 게스트 조작 비교 | 51단계 663값, 기준 대 후 0 · 기준 대 기준 0 (지운 값: 시간·난수·스톱워치 시계·저장소 추정치) |
| 화면 시나리오 | 12개 기준·작업 통과, 약점 0 |
| 시험 | smoke 443/0·무결성 38/38·버튼 943/943 기준과 같음, tests 110개 종료 코드 같음 |

[4단계: 심사 청구]
