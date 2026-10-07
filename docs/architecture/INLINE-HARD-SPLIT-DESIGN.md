# index.html 인라인 「어려움」 묶음 분열 설계 (#TASK-ES-439)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON · CELL_SPLIT · CELL_SPLIT_PROOF) · `docs/specs/MODULE-SPLIT-PROTOCOL.md` · 1차 지도·생성기 #TASK-ES-423(PR #744).
- 이 문서가 정하는 것: 지도(`docs/architecture/INLINE-SCRIPT-MAP.md`)의 난이도 「어려움」 묶음이 **왜** 어려운지(유형, 도구 집계), 유형마다 **동작 그대로** 옮기는 표준 이음매, 그 이음매를 글자 그대로 만드는 생성기·검사기, 그리고 빌더 여러 명이 동시에 일할 수 있는 처리 순서·병렬 구역.
- 이 문서에 있는 수치는 모두 스크립트 산출이다. 표는 `scripts/inline-hard-types.js --write` 가 갈아 끼운다(손으로 고치지 않는다).

## 1. 왜 어려운가 — 유형별 집계(도구)

도구: `NODE_PATH=<node_modules> node scripts/inline-hard-types.js --write` (지도 `inline-script-map.json` + index.html 재파싱 + 시험지 선행 실측 `inline-hard-test-probe.json`).
한 묶음은 여러 유형에 걸린다. 묶음 수·줄 수는 그 유형에 걸린 묶음의 합이다.

<!-- hard-types:begin -->
> 아래 표는 `NODE_PATH=<node_modules> node scripts/inline-hard-types.js --write` 가 쓴다(손으로 고치지 않는다). 출처 index.html sha256 앞 12자 `097dd682323d`.

어려움 묶음 **17개 · 3093줄**(지도 등급 「어려움」 = 점수 25 초과).

| 유형 | 뜻 | 묶음 수 | 줄 수(묶음 합) | 건수 |
|---|---|--:|--:|--:|
| A1 | 남의 상태 재대입 | 2 | 720 | 24 |
| A2 | 내 상태를 남이 씀·읽음 | 11 | 1145 | 324 |
| B1 | 로드 중 window 노출 | 9 | 516 | 42 |
| B2 | 로드 때 이벤트 등록 | 6 | 1896 | 13 |
| B3 | 로드 중 다른 문 | 10 | 1059 | 52 |
| C | 인라인 on*="이름()" | 1 | 64 | 2 |
| D | 큰 상수(30줄 이상) | 1 | 177 | 1 |
| E | 순환 호출(SCC) | 0 | 0 | 0 |
| F1 | 시험지 단독 의존(근사) | 16 | 3055 | 119 |
| F1m | 시험지 선행 필요(실측) | 0 | 0 | 0 |
| F2 | smoke FN_NAMES | 1 | 101 | 1 |
| G | 800줄 초과 | 1 | 1322 | 1 |
| H | 함수 재대입 | 0 | 0 | 0 |
| I | 공용 부품(들어옴 10+) | 1 | 67 | 1 |
| J | 바깥 파일이 window 이름 씀 | 12 | 644 | 654 |
| K | 최상위 this/arguments | 2 | 113 | 2 |
| L | 통로에 없는 인라인 이름 참조 | 13 | 2622 | 67 |

처리 단계(유형으로 정함): 1단계 1묶음 38줄 · 2단계 12묶음 1519줄 · 3단계 2묶음 1423줄 · 4단계 2묶음 113줄.

묶음 번호(G…)는 이 판에서만 맞다 — 앞 묶음이 옮겨지면 밀린다. 배정·구역은 **제목**으로 찾는다.

| 묶음 | 제목 | 줄 범위 | 줄 | 점수 | 단계 | 유형 | 배정 |
|---|---|---|--:|--:|--:|---|---|
| G010 | [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs/archite | 2539~3220 | 682 | 378 | 2 | A1(22) A2(282) B3(32) F1(34) L(5) |  |
| G015 | [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs/archite | 3380~3417 | 38 | 28 | 2 | A1(2) A2(20) B3(1) F1(1) L(3) |  |
| G019 | Confetti | 3458~3472 | 15 | 224 | 2 | A2(1) B3(2) F1(1) J(212) |  |
| G023 | XP/레벨 시스템 | 3506~3611 | 106 | 95 | 2 | B1(5) B3(1) F1(14) J(19) L(2) |  |
| G024 | [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드 | 3612~3633 | 22 | 41 | 2 | A2(4) B1(2) B2(2) B3(4) F1(1) J(2) L(5) |  |
| G026 | 뱃지 컬렉션 (명예의 전당) | 3642~3655 | 14 | 268 | 2 | A2(1) B1(1) B3(3) F1(2) J(247) L(2) |  |
| G039 | 소셜 로그인 (카카오 / 실제 구글 OAuth 연동) | 3745~4050 | 306 | 31 | 2 | B2(2) F1(4) |  |
| G054 | Modal helper & Android Hardware Back Handler | 4159~4225 | 67 | 172 | 4 | A2(2) B3(2) F1(4) I(1) J(135) K(1) L(3) |  |
| G059 | [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle Bin) 시스템 | 4299~4344 | 46 | 32 | 4 | A2(1) B3(1) F1(1) J(9) K(1) L(1) |  |
| G062 | 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) | 4388~4488 | 101 | 59 | 3 | F1(12) F2(1) | 안티그래비티 몫(2026-10-05 배정) |
| G079 | [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작용 | 4725~4762 | 38 | 64 | 1 | A2(4) B1(9) B2(3) B3(3) J(5) L(8) |  |
| G080 | [#TASK-ES-146] 아워골 평가해주기 90% 팝업 | 4763~4793 | 31 | 46 | 2 | A2(2) B1(3) B2(4) B3(3) F1(1) J(2) L(7) |  |
| G090 | [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저  | 4887~4901 | 15 | 35 | 2 | A2(4) B1(8) F1(1) J(2) L(5) |  |
| G091 | [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA ( | 4902~4965 | 64 | 91 | 2 | B1(11) C(2) F1(11) J(6) L(6) |  |
| G103 | 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) | 5589~6910 | 1322 | 104 | 3 | B2(1) F1(16) G(1) L(19) |  |
| G107 | 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK-ES-252 H | 6962~7138 | 177 | 38 | 2 | A2(3) B1(2) B2(1) D(1) F1(5) J(10) L(1) |  |
| G108 | 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거 및 무해화) | 7139~7187 | 49 | 55 | 2 | B1(1) F1(11) J(5) |  |

#### 덮어쓰는 키트(유형 M) — 이 전역에 세포 이름을 달 때는 그 파일 태그 **뒤**(설정 afterTag)

`OurgoalAuthSafety`(js/auth-safety.js) · `OurgoalCalendarAttachment`(js/calendar-attachment.js) · `OurgoalComponents`(js/components.js) · `OurgoalAppScope`(js/core/app-scope.js) · `OurgoalCapabilities`(js/core/capabilities.js) · `OurgoalEvents`(js/core/event-bus.js) · `OurgoalEventBus`(js/core/event-bus.js) · `OurgoalRegistry`(js/core/registry.js) · `OurgoalBlockRegistry`(js/core/registry.js) · `OurgoalSlots`(js/core/slots.js) · `OurgoalStore`(js/core/store.js) · `OurgoalStateStore`(js/core/store.js) · `OurgoalUiHelpers`(js/core/ui-helpers.js) · `OurgoalGoalEditUX`(js/goal-edit-ux.js) · `OurgoalHelpfulReason`(js/helpful-reason.js) · `OurgoalNotifyEngine`(js/notify-engine.js) · `OurgoalReactions`(js/reactions.js) · `OurgoalSanctuaryV3`(js/sanctuary-v3-engine.js) · `OurgoalStreaks`(js/streaks.js) · `OurgoalCalendarMegaBlock`(js/tabs/calendar/index.js) · `OurgoalCalendarDayDetail`(js/tabs/calendar/sub-day-detail.js) · `OurgoalCalendarMonthView`(js/tabs/calendar/sub-month-view.js) · `OurgoalCalendarPhotoDiary`(js/tabs/calendar/sub-photo-diary.js) · `OurgoalDmLedger`(js/tabs/comm/dm-ledger.js) · `OurgoalCommMegaBlock`(js/tabs/comm/index.js) · `OurgoalCommSubCompanions`(js/tabs/comm/sub-companions.js) · `OurgoalCommSubCrew`(js/tabs/comm/sub-crew.js) · `OurgoalCommSubFeed`(js/tabs/comm/sub-feed.js) · `OurgoalGoalsMegaBlock`(js/tabs/goals/index.js) · `OurgoalGoalsPersonal`(js/tabs/goals/sub-personal.js) · `OurgoalGoalsRoutine`(js/tabs/goals/sub-routine.js) · `OurgoalGoalsTeam`(js/tabs/goals/sub-team.js) · `OurgoalHomeMegaBlock`(js/tabs/home/index.js) · `OurgoalHomeHeatmap`(js/tabs/home/sub-heatmap.js) · `OurgoalHomeOneScreen`(js/tabs/home/sub-onescreen.js) · `OurgoalHomeQuest`(js/tabs/home/sub-quest.js) · `OurgoalHomeToday`(js/tabs/home/sub-today.js) · `OurgoalRecordsMegaBlock`(js/tabs/records/index.js) · `OurgoalRecordsRetrospect`(js/tabs/records/sub-retrospect.js) · `OurgoalRecordsTimeline`(js/tabs/records/sub-timeline.js) · `OurgoalRecordsTimer`(js/tabs/records/sub-timer.js) · `OurgoalSettingsMegaBlock`(js/tabs/settings/index.js) · `OurgoalSettingsSubAppearance`(js/tabs/settings/sub-appearance.js) · `OurgoalSettingsSubData`(js/tabs/settings/sub-data.js) · `OurgoalSettingsSubIntegrations`(js/tabs/settings/sub-integrations.js) · `OurgoalSettingsSubNotify`(js/tabs/settings/sub-notify.js) · `OurgoalSettingsSubProfile`(js/tabs/settings/sub-profile.js) · `OurgoalSettingsSubSecurity`(js/tabs/settings/sub-security.js) · `OurgoalTeamInviteComm`(js/team-invite-comm.js) · `OurgoalTeamLeaderCheck`(js/team-leader-check.js) · `OurgoalTeamLinkedGoals`(js/team-linked-goals.js) · `OurgoalTeamVisibilityLevels`(js/team-visibility-levels.js) · `OurgoalTemplateCredit`(js/template-credit.js) · `OurgoalThemeSystem`(js/theme-system.js) · `OurgoalTimeTracker`(js/time-tracker.js) · `OurgoalTopHelpful`(js/top-helpful.js) · `OurgoalViralSharing`(js/viral-sharing.js)

#### 병렬 구역(줄 구간 겹침 0 — 도구가 검사)

| 구역 | 줄 구간 | 어려움 줄 | 묶음 |
|---|---|--:|---|
| H1 | 2539~3417 | 720 | G010 [#TASK-ES-432] 인라인 스크립트 세포화 2차 이음매 (docs<br>G015 [#TASK-ES-442] 인라인 스크립트 세포화 P0 이음매 (docs |
| H2 | 3458~6910 | 1933 | G019 Confetti<br>G023 XP/레벨 시스템<br>G024 [#TASK-ES-150] 아바타 레벨업 대형 팝업 & 성장 성향 키워드<br>G026 뱃지 컬렉션 (명예의 전당)<br>G039 소셜 로그인 (카카오 / 실제 구글 OAuth 연동)<br>G079 [#TASK-ES-174] 목표 템플릿 백과사전 전체화면 팝업 및 상호작<br>G080 [#TASK-ES-146] 아워골 평가해주기 90% 팝업<br>G090 [#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및<br>G091 [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인<br>G103 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) |
| H3 | 6962~7138 | 177 | G107 캘린더 실시간 구독 URL 생성기 (WebCal Feed & #TASK- |
| H4 | 7139~7187 | 49 | G108 크리에이터 템플릿 (#TASK-ES-315, 64: 구형 창 영구 제거  |
| 배정됨: 안티그래비티 몫(2026-10-05 배정) | 4388~4488 | 101 | G062 5대 테마 온톨로지 & 경량 AI 분류기 (TASK-OG-001) |
| 기관(단계 4, 구역 밖 — 한 빌더가 먼저) | — | 113 | G054 Modal helper & Android Hardware Back Han<br>G059 [#TASK-ES-153] 전역 7일 유예 통합 휴지통 (Recycle  |

#### 권장 처리 순서(단계 → 유형 수 → 줄 수)

1. G079(1단계·38줄·A2B1B2B3JL) · 2. G039(2단계·306줄·B2F1) · 3. G108(2단계·49줄·B1F1J) · 4. G019(2단계·15줄·A2B3F1J) · 5. G090(2단계·15줄·A2B1F1JL) · 6. G015(2단계·38줄·A1A2B3F1L) · 7. G091(2단계·64줄·B1CF1JL) · 8. G023(2단계·106줄·B1B3F1JL) · 9. G010(2단계·682줄·A1A2B3F1L) · 10. G026(2단계·14줄·A2B1B3F1JL) · 11. G024(2단계·22줄·A2B1B2B3F1JL) · 12. G080(2단계·31줄·A2B1B2B3F1JL) · 13. G107(2단계·177줄·A2B1B2DF1JL) · 14. G062(3단계·101줄·F1F2) · 15. G103(3단계·1322줄·B2F1GL) · 16. G059(4단계·46줄·A2B3F1JKL) · 17. G054(4단계·67줄·A2B3F1IJKL)
<!-- hard-types:end -->

기준(origin/main, 시범 전) 집계는 `reports/TASK-ES-439/inline-hard-types-base.json`·`inline-hard-test-probe-base.json` 에 있다(같은 도구, 기준 사본에서 실행).

### 1-1. 유형을 읽는 법 — 무엇이 진짜 막힘인가

| 유형 | 진짜 막힘인가 | 이유 |
|---|---|---|
| A1·A2 상태 재대입·공유 | 아니다(표준 이음매) | getter·setter 통로로 같은 변수를 그대로 읽고 쓴다(2-1) |
| B1 window 노출 | 아니다 | 노출 줄은 원래 자리에 그대로 둔다(2-2) |
| B2·B3 로드 중 문 | 아니다 | 본문만 세포 함수로, 원래 자리에 부르는 한 줄(2-3) |
| C 인라인 onclick | 아니다 | on*="X()" 는 window.X 를 찾는다 — 노출 줄이 그대로이므로 닿는다(2-2) |
| D 큰 상수 | 아니다 | 순수 상수는 옮기고 같은 객체를 가져온다(2-4) |
| E 순환 호출 | 아니다 | 순환은 부를 때 도는 것뿐 — getter 는 늦게 읽으므로 로드 순서와 무관(2-5) |
| **F1m 시험지 선행 필요(실측)** | **그렇다** | 기준 시험지가 index.html 한 파일만 읽어 옮기면 실패한다 → 시험지 선행 PR 이 먼저(2-6) |
| **F2 smoke FN_NAMES** | **그렇다** | 시험지가 인라인에서 함수를 잘라 실행 → 시험지 선행 PR 이 먼저(2-6) |
| **G 800줄 초과** | 설계 필요 | 책임 단위로 둘 이상의 세포로 나눈다(2-7) |
| **I 공용 부품** | 순서 필요 | 들어오는 묶음이 10개 이상 — 기관 세포로 먼저, 한 빌더가(2-8) |
| H 함수 재대입 · K 최상위 this/arguments | 개별 | 생성기가 멈춘다. K 함수는 헌법 CELL_SPLIT 5 때문에 원본에 둔다(2-9) |
| J 바깥 파일이 window 이름 씀 | 아니다 | 노출 줄 그대로 = 덮어쓰기 순서 그대로(2-2) |
| L 통로에 없는 인라인 이름 참조 | 아니다(생성기가 자동) | 옮긴 코드가 쓰는 인라인 이름(예: 「RENDER: HOME」 의 `BADGES`·`badgeContext`)은 스코프 분석으로 뽑아 getter 를 새로 단다(2-10) |
| M 덮어쓰는 키트 | 아니다(태그 자리만) | 키트 전역을 통째로 새로 대입하는 파일(예: `js/tabs/home/index.js` 의 `OurgoalHomeMegaBlock`)이 있으면 세포 태그를 그 파일 **뒤**에 둔다(2-11) |

F1(근사)은 "이름·글자 포함"만 본 넉넉한 근사라 거의 모든 묶음에 걸린다. 실측(F1m)은 묶음을 표준 이음매대로 비운 index.html 로 그 시험지를 실제로 돌려 통과 → 실패만 센다. 막힘은 F1m 이다.

## 2. 표준 이음매 — 유형마다 "동작 그대로" 옮기는 방법

공통 뼈대(선례 #354·#379·#423 와 같다): 세포 파일은 `(function(global){ 'use strict'; var L = OurgoalAppScope.scope; var K = global.<기존 키트> … })` 이고, index.html 은 IIFE 머리에서 `var X = _키트.X;` 로 같은 이름을 가져온다(함수 선언의 끌어올림과 같은 효과 — 그 줄보다 먼저 도는 문이 없다). 세 가지 검사 기준과의 관계:

- **법정 탐침(원본 단독 로드, `court/probes/module-load.js`)**: 세포 파일은 로드할 때 `L`·`K` 를 만들고 함수·순수 상수만 정의한다. DOM·상태를 만지는 코드는 함수 안(부를 때)에만 있다 → 단독 로드에서 예외 0. 로드 중 문을 세포 최상위에 두지 않고 함수로 감싸는 이유다(2-3).
- **생성기(글자 그대로)**: 바꾸는 글자는 이름 참조 접두 `L.` 뿐이다. 세포 파일의 생성기 표지(`/* ---- 이전 전 index.html a~b줄(#TASK-ES-439 생성기 표지) ---- */`)와 감싼 함수의 머리·꼬리 줄 말고는 모두 이전 전 줄이다.
- **verify(`verify-inline-hard.js`)**: ① 옮긴 함수·상수·감싼 문 토큰열 동일 ② 표지 아래 줄 한 줄씩 동일(주석 포함) ③ **남은 글자 동일** — 이전 전 IIFE 토큰열에서 옮긴 구간을 뺀 것 = 새 IIFE 토큰열에서 이번 이음매 줄을 뺀 것(남긴 문이 같은 글자·같은 순서) ④ 누수 0·미노출 0·**setter 빠짐 0**·남은 정의 0·안 가져온 사용 0 ⑤ 함수 최상위 this/arguments 0 ⑥ **이중 처리기 0**(addEventListener·on<이벤트> 대입 수: 이전 전 IIFE = 새 IIFE + 새 세포) ⑦ 감싼 함수를 부르는 줄이 하나씩.

### 2-1. 공유 상태 재대입(A1·A2) → 선언은 원래 자리, 옮긴 코드는 getter·setter 통로

- 상태 변수(재대입이 있거나 초기값이 실행되는 식 — `document.getElementById(…)` 등)의 **선언 문은 옮기지 않는다**. 원래 자리에 그대로 남아 같은 시점에 초기화된다.
- 옮긴 코드의 그 이름은 `L.<이름>` 이 되고, 머리에 `get x(){ return x; }` 를, 옮긴 코드가 대입하면 `set x(v){ x = v; }` 를 단다(`L.x = …` · `L.x++` 모두 setter 로 원래 변수에 들어간다). getter 는 읽을 때마다 살아 있는 값이라 다른 묶음이 다시 대입해도 따라간다.
- 동작 그대로인 이유: 변수는 하나(원래 그 변수)이고, 읽기·쓰기 경로만 접근자를 거친다. `let`/`const` 의 초기화 전 접근(TDZ)도 getter 안에서 같은 오류로 난다.
- 생성기 검사: `const` 에 대입하면 멈춘다. verify ④ 가 `L.x` 대입마다 setter 가 있는지 센다.
- 시범: `pendingCapturePhoto`(체크인 저장 처리기가 `= null` 대입 → setter), `liveMeta`·`liveCount`·`capInput`(실행되는 초기값 → 선언 원래 자리).

### 2-2. window 노출(B1)·인라인 onclick(C)·바깥 파일이 쓰는 이름(J) → 노출 줄은 원래 자리

- `window.X = X;` 는 원래 자리에 글자 그대로 둔다. X 는 머리에서 가져온 같은 함수다 → 같은 순간에 같은 값이 달린다.
- 인라인 `on*="X()"` 는 전역 스코프에서 X 를 찾으므로, 노출 줄이 그대로면 닿는 함수도 그대로다. 바깥 파일이 먼저 단 이름을 index.html 이 나중에 덮어쓰는 순서(MODULE-SPLIT-PROTOCOL 3절)도 그대로다.
- 새 전역 0: 세포는 기존 탭 키트(`OurgoalSettingsKit`·`OurgoalRecordsKit` …)에만 이름을 단다. 옮긴 함수를 window 에 새로 달지 않는다(프로토콜 0절 4).
- 시범: `window.paintSecurityCard`(js/tabs/settings/sub-security.js 가 찾는다)·`window.refreshSecurityStatus`·`window.killDeviceSession`·`window.selectThemeSwatch`(마크업 onclick) — 노출 줄 4개 그대로.

### 2-3. 로드 중 문(B2 이벤트 등록·B3 그 밖) → 본문은 세포 함수, 원래 자리에 부르는 한 줄

- 4줄 이상인 로드 중 문은 앞 주석과 함께 세포 파일의 `function bindXxx() { … }` 안으로 글자 그대로 옮기고, index.html 원래 자리에는 `bindXxx(); /* [#TASK-…] … */` 한 줄을 남긴다. 실행 순서·시점이 같다(같은 자리에서 동기적으로 한 번 부른다).
- 감쌀 수 없으면 그대로 둔다(생성기가 판단): 문 안에 IIFE 로 끌어올려지는 `var` 선언이 있음(감싸면 지역 변수가 된다) · 최상위 `this`/`arguments`(감싸면 값이 바뀐다) · IIFE 최상위 `return`. 3줄 이하 문도 그대로 둔다(옮겨도 줄이 줄지 않는다).
- 이중 처리기 0: 등록 문은 한 곳에만 있다 — verify ⑥ 이 처리기 수 합으로 잰다.
- 법정 탐침: 감싼 함수는 정의만 되고 세포 로드 때 돌지 않는다 → 단독 로드 예외 0.
- 시범: 체크인 입력칸 글자수 힌트 등록(13줄 → `bindCaptureLiveMeta`), 「기록」 단추 저장 처리기 등록(187줄 → `bindCaptureSave`).

### 2-4. 큰 상수(D) → 순수하면 옮기고 같은 객체를 가져온다

- 초기값이 글자·숫자·객체·배열·함수 식뿐(이름 참조·호출·`new`·식이 든 템플릿 0)이고 재대입 0 이면 세포로 옮기고 머리에서 `var X = _키트.X;` 로 가져온다. 같은 객체라 다른 묶음의 `X.push(…)`·속성 변경도 그대로 보인다.
- 순수하지 않으면 2-1 처럼 선언을 원래 자리에 둔다(그 경우 줄이 줄지 않으므로, 데이터 세포는 별도 설계 — 예: 템플릿 데이터 #364 선례처럼 데이터 파일 + 같은 이름 가져오기).

### 2-5. 순환 호출(E) → 문제 아님(getter 는 늦게 읽는다)

- 묶음 그래프의 강한 연결 요소(SCC)에 대부분이 들어 있지만, 서로 부르는 것은 함수가 **불릴 때**다. 옮긴 쪽은 `L.y()` 로, 남은 쪽은 가져온 `x()` 로 부르며 둘 다 그때 값을 읽는다. 로드 중에 순환이 도는 경우만 위험한데, 로드 중 문은 원래 자리에서 같은 순서로 돌므로(2-3) 순서가 바뀌지 않는다.

### 2-6. 시험지 선행(F1m·F2) → 옮기기 전에 시험지 PR

- 기준 시험지가 index.html 한 파일만 읽어 옮긴 글자를 못 찾으면, 법정은 기준 커밋의 시험지로 채점하므로 실패한다. 헌법 CELL_SPLIT 3: **기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 합본(index.html + js/tabs/\*\*/\*.js + js/core/\*.js — smoke-test·verify-integrity-gate 와 같은 합본)으로 넓히는 시험지 선행 PR(제품 코드 0)** 을 먼저 병합한다. retire 금지.
- 실측 도구 `scripts/inline-hard-test-probe.js` 가 묶음별로 깨지는 시험지 목록을 낸다 → 그 목록이 곧 시험지 선행 PR 의 범위다. 같은 시험지가 여러 묶음에 걸리므로 **구역마다 한 번**(그 구역 묶음들의 깨지는 시험지 합집합) 선행 PR 을 낸다.
- 세포 위치는 반드시 `js/tabs/**` 또는 `js/core/*` (합본 읽기 시험지가 그대로 찾는다).
- F2(smoke FN_NAMES)는 생성기가 멈춘다 — smoke-test 의 FN_NAMES 추출을 합본으로 넓히는 선행 PR 뒤에 옮긴다. `scripts/verify-integrity-gate.js` 는 동결 파일이다 — 이 파일이 걸리면 옮기지 않고 남긴다(이번 실측에서는 합본을 읽으므로 걸리지 않았다).

### 2-7. 800줄 초과(G) → 설정의 take 로 책임 단위 분할

- 생성기 설정은 한 묶음을 여러 세포가 나눠 가져갈 수 있다(`take.names` — 이름으로 고름, 겹치면 생성기가 멈춘다). 남는 문은 `keepRest: true` 로 원래 자리에 둔다. 줄 수로 자르지 않는다(`-part1` 금지).
- 시범: 묶음 「[PHASE 6] COMM-SETTINGS FUNCTIONS」 에서 설정 네 함수만 `js/tabs/settings/quick-actions.js` 로, 소통 허브 세 함수는 `keepRest` 로 남겼다(이유: 5절 발견 ①).

### 2-8. 공용 부품(I) → 기관 세포가 먼저, 한 빌더가

- 들어오는 묶음이 10개 이상인 묶음(Utilities·Confetti·Modal helper 등)은 여러 구역이 부르므로, 병렬 구역에 넣지 않고 기관(`js/core/*`) 담당 한 빌더가 먼저 한다. MODULE-SPLIT-PROTOCOL 1절 조건((가)~(라))을 만족하면 `ui-helpers.js` 로, 아니면 이미 있는 app-scope getter 로 둔다. 순수 함수가 아닌 것(`toast` 처럼 다른 함수와 상태를 공유)은 옮기지 않는다.

### 2-9. 함수 재대입(H)·최상위 this/arguments(K)

- H: 생성기가 멈춘다(덮어쓰기는 묶음마다 다르다 — 개별 설계). 지금 어려움 묶음에는 0건.
- K: 헌법 CELL_SPLIT 5 에 따라 옮기지 않는다(take.names 에서 빼고 keepRest). 객체 경유 호출(`L.f()`)로 this 가 바뀌는 위험의 근본 차단이다.

### 2-10. 통로에 없는 인라인 이름 참조(L) → 생성기가 getter 를 새로 단다

- 상황(안티그래비티가 「RENDER: HOME」 에서 막힌 지점): 옮길 코드가 다른 묶음의 인라인 이름 `BADGES`(배지 목록 상수, 「뱃지 컬렉션 (명예의 전당)」 묶음)·`badgeContext`(함수)를 쓰는데, 그 이름이 `OurgoalAppScope.expose` 에 없다.
- 이음매: **그 이름을 옮기지 않는다.** 옮긴 코드의 참조만 `L.BADGES`·`L.badgeContext` 로 바꾸고, 머리 자리 표지 아래 expose 에 `get BADGES(){ return BADGES; }` 를 더한다. 생성기는 "옮긴 코드가 실제로 읽는, IIFE 최상위에 선언된 이름 중 머리에 getter 가 아직 없는 것"을 스코프 분석으로 모두 뽑아 넣는다(시범: 새 getter 22개). 상수를 옮기지 않으므로 원래 묶음의 초기화 시점·다른 읽는 곳은 그대로다.
- 동작 그대로인 이유: getter 는 같은 바인딩을 읽는다(같은 배열 객체). `var` 는 끌어올려져 getter 가 먼저 정의돼도 되고, `const`/`let` 이면 초기화 전 접근만 TDZ 오류 — 이전 전 인라인 참조와 같은 조건이다.
- verify ④ 「미노출 0」: 세포의 `L.<이름>` 마다 머리 어딘가의 expose getter 가 있는지 센다. 손으로 expose 를 고치지 않는다.
- 유형 집계 L 칸은 "지금 getter 가 없는 이름을 쓰는 묶음"이다 — 막힘이 아니라 생성기가 채울 몫의 크기다.

### 2-11. 덮어쓰는 키트(M) → 세포 태그를 덮어쓰는 파일 뒤에

- 상황(안티그래비티가 「RENDER: HOME」 에서 막힌 두 번째 지점): 홈 탭 큰 세포 `js/tabs/home/index.js` 는 `global.OurgoalHomeMegaBlock = OurgoalHomeMegaBlock;` 로 전역을 **통째로 새로 대입**한다(`X = X || {}` 가 아니다). 세포 파일을 그 태그 **앞**에 두고 `K = global.OurgoalHomeMegaBlock = … || {}` 에 함수를 달면, 뒤에 로드되는 index.js 가 객체를 바꿔 끼워 그 함수가 사라진다(가져오기가 `undefined`).
- 이음매: 설정 셀에 `beforeTag` 대신 **`afterTag`: 덮어쓰는 파일의 태그**를 적는다 → 생성기가 세포 태그를 그 태그 **바로 뒤 같은 줄**에 붙인다(순증가 0줄). 세포는 이미 만들어진 객체에 `K.x = x` 로 이름만 더한다(새 전역 0). 인라인 IIFE 는 모든 탭 태그 뒤에 있으므로 머리 가져오기 시점은 그대로다(생성기가 "세포 태그가 IIFE 앞" 을 검사).
- 머리에 그 키트 변수가 없으면(홈은 앞선 이음매에 `_homeKit` 이 없다) 생성기가 자기 자리 표지 아래에 `var _homeKit = window.OurgoalHomeMegaBlock;` 지역 변수를 만든다 — 이미 있는 전역을 읽을 뿐, 전역 이름은 늘지 않는다.
- 안전 장치: 생성기는 키트를 통째로 새로 대입하는 다른 js 파일을 찾아, `afterTag` 없이 그 키트를 쓰려 하면 멈춘다(작업자 측정: 홈 메가블록 키트로 바꾼 설정 → "통째로 새로 대입하는 파일이 있다(js/tabs/home/index.js) — afterTag" 로 멈춤, `afterTag` 를 주면 생성·verify ok·모듈 로드 회귀 0).
- 주의: 큰 세포 객체(메가블록)에 이름을 달 때는 그 객체가 자기 키를 훑지(`Object.keys`·`for…in`) 않는지 먼저 본다 — 훑는다면 그 키트를 쓰지 말고 `X || {}` 꼴의 다른 기존 키트를 고른다. 덮어쓰는 전역 목록은 1절 「덮어쓰는 키트」 표(도구 산출)에 있다.

## 3. 머리 이음매 자리 표지 — 병렬 빌더의 병합 충돌 없애기

- 1차 생성기는 이음매를 "바로 앞 이음매 다음 줄"에 넣었다 → 두 빌더가 같은 자리에 줄을 넣으면 병합 충돌이 난다.
- 이번 PR 이 IIFE 머리(1차 이음매 다음)에 **구역 자리 표지** 6줄을 둔다: `/* [어려움 이음매 자리 H0 시범 #TASK-ES-439] */` · `H1` · `H2` · `H3` · `H4` · `HO 기관`. 생성기 설정의 `slot` 이 그 자리 아래(다음 표지 전)에 가져오기·expose 를 넣는다. 두 PR 이 서로 다른 표지 아래에 줄을 넣으면 그 사이에 바뀌지 않은 표지 줄이 있어 git 이 충돌 없이 합친다(작업자 측정: `git merge-file` 로 인접 표지 아래 각각 삽입 → 종료 코드 0, 두 삽입 모두 남음).
- 표지 주석은 `===` 구획 주석을 쓰지 않는다 — 지도의 묶음 번호가 밀리지 않는다(자리 표지로는 묶음 수가 늘지 않는다).
- 남는 충돌 지점: 같은 탭 `index.js` script 태그 줄(같은 줄 앞에 태그를 붙인다)과 같은 묶음. 구역을 줄 구간으로 나눴으므로 묶음은 겹치지 않고, 태그 줄 충돌은 main 을 합친 뒤 생성기를 다시 돌려(입력 = 합친 뒤의 이전 전 index.html) 해결한다.

## 4. 도구 — 빌더가 그대로 쓰는 것

| 도구 | 하는 일 |
|---|---|
| `scripts/inline-hard-types.js [--write]` | 어려움 유형 집계·처리 단계·병렬 구역(이 문서 1절 표) |
| `scripts/inline-hard-test-probe.js <앱 사본> [--write] [--only G…]` | 묶음별 시험지 선행 필요 실측(F1m) |
| `docs/design/harness/module-split/gen-inline-hard.js <APP> <설정.json> [이전 전 index.html]` | 설정대로 글자 그대로 옮김(2절 분류: move · wrap · keep) |
| `docs/design/harness/module-split/verify-inline-hard.js <이전 전 index.html> <APP> <설정.json>` | 2절 ①~⑦ 검사(생성기 분류를 다시 쓰지 않고 결과만 읽는다) |
| `docs/design/harness/module-split/dom-compare-inline-hard.js <base> <after> <out>` | 게스트 조작 전후 화면·저장값·토스트·콘솔 오류 비교(기준 2회로 본질 변동 거름) — 단계만 바꿔 쓴다 |
| `docs/design/harness/module-split/inline-hard-pilot.json` | 설정 견본 |

설정 형식(`inline-hard-pilot.json`): `task` · `slot`(자기 구역 자리) · `slots`(자리 표지가 없을 때 만들 목록) · `cells[]` = { `key`, `file`(js/tabs/** 또는 js/core/*), `kit`·`kitVar`(기존 키트 — 머리에 변수가 없으면 생성기가 자리 표지 아래에 만든다), `beforeTag`(그 탭 index.js 태그) 또는 `afterTag`(키트를 통째로 새로 대입하는 파일의 태그 — 2-11), `title`·`desc`(파일 머리 설명), `take[]` = { `group`(구획 주석 글자 일부 — 묶음 번호는 밀리므로 쓰지 않는다), `names`(고를 이름) 또는 `all: true`, `wrap`(감쌀 로드 중 문 이름, 순서대로), `keepRest` } }.

### 4-1. 빌더 절차(한 PR)

1. worktree → `inline-hard-types.js` 로 자기 구역 묶음·유형 확인 → 그 구역의 F1m 시험지가 있으면 **시험지 선행 PR** 먼저(읽는 범위만 합본으로, 기대값 0 변경).
2. `git show origin/main:index.html > 이전전.html` → 설정 작성(`slot` = 자기 구역) → 생성기 → verify ok.
3. `court/probes/module-load.js <기준 사본> <작업>` 회귀 0 · 새 파일 `loadOne` ok.
4. `module-specs --write`(손 칸 role) · `cell-descriptions.json`(짧은 이름·하는 일) · `module-guard --update` · `inline-script-map --write` · 커밋 뒤 `cell-map-export`.
5. `npm test` · tests 전부 종료 코드 기준=후 · 게스트 조작 비교(기준 2회·후 1회) · tab-check 해당 탭 기준 2회·후 1회 · 법정 형식 게스트 시나리오(옮긴 세포마다 하나, 같은 시나리오 두 항목 금지) 로컬 기준·작업 통과.
6. 화면 파일(index.html·js 화면 세포) 주장은 게스트 화면 시나리오로, 글자 확인은 config·문서·신고서에만(#745). 게스트로 닿지 않는 화면은 옮기지 않거나(이번 소통 허브), 법정 도구 한계 사유가 정확히 맞을 때만 「확인 못 함」+cannotBecause(#747).

## 5. 시범 결과와 발견

시범(이 PR): 어려움 묶음 2개 — 「체크인 입력 글자수 힌트」(유형 A1·B2: 상태 setter·로드 중 등록 문 감싸기) · 「[PHASE 6] COMM-SETTINGS FUNCTIONS」(유형 A1·B1·C: 노출 줄 원래 자리·인라인 onclick·묶음 나눠 옮기기). 측정값은 `docs/specs/REQ-TASK-ES-439-INLINE-HARD-DESIGN.md` 8절·`reports/TASK-ES-439/`.

발견:
1. 소통 탭 허브(`#commHubGrid` — 하위 탭 전환·응원 칩·안심 DM 단추)는 마크업 인라인 `style="display:none !important;"` 로 숨어 있어 게스트·로그인 누구도 누를 수 없다. 그 단추만 부르는 `switchCommSubTab`·`triggerFloatingReaction`·`openInAppDmSheet` 는 화면 시나리오로 잴 수 없어 이번에 옮기지 않았다. 숨은 UI 는 CSS 은폐 금지(제3조 2항) 대상이며, 지울지·살릴지는 기능 삭제 승인선 ③ 이라 별도 티켓으로 올린다.
2. 지도의 묶음 번호(G…)는 앞 묶음이 통째로 옮겨지면 밀린다(1차 #423 뒤 번호가 바뀌었다). 구역·배정은 **줄 구간 + 구획 주석 제목**으로 식별한다(1절 구역 표에 제목을 같이 싣는다).
3. 「체크인 입력 글자수 힌트」 칸(`#captureLiveMeta`)은 네 테마 모두 CSS 로 숨어 있어 처리기가 `style.display` 를 바꿔도 보이지 않는다(이전 전과 같음 — 옮기기는 고치지 않는다). 시나리오는 인라인 style 값으로 잰다.

## 6. 처리 순서·병렬 구역

1절 표의 「병렬 구역」·「권장 처리 순서」가 도구 산출이다. 규칙:

- 단계 1(표준 이음매만) → 단계 2(시험지 선행 PR 뒤) → 단계 3(FN_NAMES 선행·800줄 분할) → 단계 4(기관·개별 설계, 구역 밖 한 빌더).
- 구역 H1~H4 는 어려움 줄 합이 고르게 되도록 줄 순서로 이어 붙여 나눈 연속 줄 구간이다(구간 겹침 0 — 도구가 검사). 빌더 한 명 = 한 구역 = 한 자리 표지. 구역 안에서는 단계 → 유형 수 → 줄 수 순서.
- 쉬움·보통 빌더(P0·P1·P2)와 2차 빌더의 묶음(어려움 중에서는 「Enter app」·「Render all」), 안티그래비티 배정(「캘린더 날짜 클릭 시 해당 일자 일정 수정/관리 허브 모달」·「RENDER: HOME」·「5대 테마 온톨로지 & 경량 AI 분류기」·「11인 외부 UI/UX 감시 및 개선팀 핵심 기능」·「서버 관리자 API를 통한 기록 및 프로필 복구」)은 구역 목록에 넣지 않았다(1절 묶음 표 「배정」 칸). 배정은 도구(`ASSIGNED`)에 **제목**으로 적는다 — 묶음 번호는 병합마다 밀린다.

## 7. 예상 단계 수(추정 — 근거)

- 추정 근거: 1차(#423) 4묶음 1 PR, 이번 시범 2묶음 1 PR. 표준 이음매 묶음은 PR 하나에 3~5묶음(줄 합 1,000~1,500줄)을 담는다고 가정한다(시범 2묶음 332줄 → 측정 한 벌에 실작업 시간 대부분이 측정이었다 — 묶음 수가 늘어도 측정 한 벌은 같다).
- 구역마다: 시험지 선행 PR 1 + 이전 PR ⌈구역 묶음 수 ÷ 4⌉. 기관 구역: 묶음마다 1 PR(공용 부품은 개별 설계).
- 숫자는 1절 표(구역별 묶음 수)에서 계산해 REQ 8절에 적는다(추정, 측정 아님).
