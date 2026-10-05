# REQ — #TASK-ES-481 index.html 인라인 「어려움」 구역 H2 분열 (1차: 목표 탭 IA 동작 · 템플릿 백과사전 · 기록 아카이브 펼치기)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 코디네이터 배정(구역 H2 빌더) · 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON · CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(#TASK-ES-439, PR #762) · `docs/specs/MODULE-SPLIT-PROTOCOL.md`.
- 범위(이 PR): 구역 H2 7묶음 중 1단계 3묶음 — 「[UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA」 · 「[#TASK-ES-189] 템플릿 백과사전 3대 분류(개인·루틴·팀) 및 AI/실유저 2원화 이식 시스템」 · 「[PHASE 5] #TASK-UIUX-PHASE5-RECORDS-CALENDAR FUNCTIONS」. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종 커밋 0(main 판 그대로 — 일괄 갱신은 코디네이터).
- 건드리지 않은 것: 다른 구역(H1·H3·H4·기관)과 배정 묶음. 같은 구역의 2·3단계 묶음(데일리 루틴 서브탭·목표 보관·팀 목표·200% 활용 가이드)은 다음 PR.

## 1. [원칙 ①] 문제 정확히 파악

1. 구역 H2(목표 탭 쪽 인라인 15205~20026줄, 설계 문서 1절 표의 #762 판 줄 번호)는 어려움 묶음 7개다. 그중 1단계(표준 이음매만으로 옮길 수 있는) 묶음은 위 3개다.
2. 세 묶음은 모두 window 노출(B1)·인라인 onclick(C)·바깥 파일이 window 이름을 씀(J)이 걸려 있고, 템플릿 백과사전은 큰 상수(D)와 분류 상태 변수 재대입(A2), PHASE 5 는 `state` 재대입(A1)이 걸려 있다.
3. 할 일: 생성기(`gen-inline-hard.js`)·설정(`inline-h2-pr1.json`, 자리 H2)으로 글자 그대로 옮기고, 게스트 화면에서 잴 수 있는 함수만 옮긴다(#745 판례·#762 선례 — 게스트 화면으로 닿지 않는 함수는 남긴다).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 목표 탭의 화면 동작(하위 탭·통계·템플릿)과 기록 탭 아카이브 동작이 index.html 한 스코프 안에 섞여 있어, 그 책임만 따로 고치거나 읽을 수 없다.
- **원인**: 이 묶음들은 window 노출 줄·상태 변수 재대입에 기대어 1차 생성기로는 옮길 수 없었다.
- **중심**: 원래 자리에 남길 것(window 노출 줄·상태 변수 선언·게스트 화면으로 못 재는 함수)과 옮길 것(잴 수 있는 함수·순수 상수)의 분류.
- **핵심**: 노출 줄과 상태 변수는 원래 자리, 함수·순수 템플릿 상수는 세포로 옮겨 같은 이름으로 가져온다. 상태 변수(`_subtabTplDomain`·`_subtabTplType`·`_subtabTplCat`·`_subtabTplQuery`)는 L getter·setter 로 읽고 쓴다.

## 3. [원칙 ③] 해결방식

| 묶음 | 옮긴 것 | 원래 자리에 남긴 것 | 새 세포 |
| :-- | :-- | :-- | :-- |
| Phase 4 목표 탭 IA | `switchGoalsSubTab` · `switchGoalStatPeriod` · `renderGoalStatsChart` · `adoptTemplateAsMyGoal` | window 노출 줄 전부(`window.selectedGoalSmartTag`·`window.currentGoalStatPeriod` 초기값 포함), `selectSmartTag`·`handleGoalFastAddSubmit`·`openGoalDetailDrawer`·`closeGoalDetailDrawer`·`toggleMilestoneInDrawer`·`renderRoutineMatrixGrid`·`toggleRoutineStamp`(keepRest — 4절) | `js/tabs/goals/goals-ia-actions.js`(118줄, `OurgoalGoalsKit`) |
| 템플릿 백과사전 3대 분류 | `renderTemplateEncyclopediaScreen` · 상수 `ROUTINE_TEMPLATES_AI`·`ROUTINE_TEMPLATES_REAL`·`TEAM_TEMPLATES_AI`·`TEAM_TEMPLATES_REAL`·`PERSONAL_TEMPLATES_REAL` | 분류 상태 변수 4개, window 노출 8줄 | `js/tabs/goals/template-encyclopedia.js`(765줄, `OurgoalGoalsKit`) |
| PHASE 5 기록·일정 | `toggleRecordArchive` | window 노출 줄·스톱워치 상태 초기값, `switchRecFusionMode`·`handleQuickStopwatchToggle`·`handleQuickStopwatchSaveRecord`·`exportRecordsCsv`(keepRest — 4절) | `js/tabs/records/archive-toggle.js`(49줄, `OurgoalRecordsKit`) |

- 머리 이음매는 자리 표지 `/* [어려움 이음매 자리 H2] */` 아래에만 넣었다(가져오기 12줄, 새 getter 6개 — 분류 상태 변수 4개는 setter 포함, `cloneTemplate`·`importTemplateInstantly`). 세포 태그는 각 탭 `index.js` 태그 바로 앞 같은 줄(순증가 0줄). 새 전역 0(기존 키트에 이름만 단다).
- 조작 비교 하네스 `docs/design/harness/module-split/dom-compare-inline-h2.js`(#439 하네스와 같은 틀, 단계만 `dom-steps-inline-h2-*.js` 에서 읽음).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **게스트 화면에서 보이지 않아 남긴 함수**(작업자 측정: 법정 형식 시나리오 `visible` — 기준 사본에서도 보이는 요소 0개): 빠른 목표 추가 입력칸 `#goalFastAddInput`·스마트 태그 칩 `#chipTagStudy`, 루틴 매트릭스 `#routineMatrixGrid`(루틴 하위 탭에서도 보이지 않음), 기록 탭 달력 융합 칩 `#recCalFuseSwitcher`·빠른 스톱워치 `#quickStopwatchBar`(ui.css `#screen-records #quickStopwatchBar, #screen-records #recCalFuseSwitcher { display:none !important }`). `openGoalDetailDrawer` 는 window 노출 말고 부르는 곳이 없다(진입로 0). 고치지 않고 그대로 두었다 — 살릴지 지울지는 승인선 ③ 별도 티켓.
- **CSV 내보내기(`exportRecordsCsv`)는 남겼다**: 단추는 보이고 토스트 요소에 `show` 가 붙지만, 내려받기 뒤 토스트 글자를 법정 형식 시나리오(`textContains`)로 기준 사본에서도 확인하지 못했다(보이는 글자 0개). 잴 수 없는 것을 옮기지 않는다.
- 기준 사본(`git archive`)은 git 이력이 없어 일부 시험(세포지도 이력 비교 등)이 기준에서만 실패하거나 건너뛴다 — 종료 코드 비교는 같다(8절).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h2`(브랜치 `feat/2026-10-05-task-es-462-inline-h2`, origin/main 8472bbc) → 지시함·헌법·설계 문서·프로토콜 정독 → 지도 재생성(로컬, 커밋 안 함)·유형 집계 → 게스트 화면 닿음 확인 → 설정 `inline-h2-pr1.json` → 생성기 → verify → 모듈 로드 탐침 → 신고서·설명 → 시험 기준/후 → 게스트 조작 비교(기준 2회·후 1회) → 법정 형식 시나리오 기준/작업 → REQ·주장 → 커밋 → PR → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "템플릿 상수를 세포로 옮기면 window 노출 줄(`window.ROUTINE_TEMPLATES_AI = ROUTINE_TEMPLATES_AI`)이 다른 객체를 달 수 있다." → 머리에서 `var ROUTINE_TEMPLATES_AI = _goalsKit.ROUTINE_TEMPLATES_AI` 로 같은 배열 객체를 가져오고, 노출 줄은 원래 자리에서 그 같은 객체를 단다. 상수는 재대입 0·순수 초기값(생성기 `isPureInit`)이라 옮겨도 초기화 시점 차이가 없다. 측정: verify ① 토큰 동일, 조작 비교에서 루틴·팀·개인 도메인 화면 HTML 차이 0.
- 반론 2: "분류 상태 변수를 getter·setter 로 읽고 쓰면 도메인 단추가 바꾼 값이 원래 변수에 안 들어간다." → 옮긴 코드의 `L._subtabTplDomain = 'routine'` 은 setter 로 원래 변수에 들어간다. verify ④ setter 빠짐 0, 시나리오 `goals-template-encyclopedia` 에서 루틴 → 실사용자 전환 뒤에도 루틴 도메인 단추가 켜져 있다(두 상태가 각각 원래 변수에 남음).
- 반론 3: "보이지 않는 함수를 남기면 묶음이 반쪽이 된다." → 묶음 단위가 아니라 책임 단위로 옮긴다(설계 2-7 `keepRest`). 남긴 함수는 게스트 화면으로 잴 수 없어 옮기면 「잴 수 있는데 재지 않음」이 아니라 「잴 수 없는 것을 옮김」이 된다 — #762 소통 허브와 같은 처리.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#btnGoalsSubPersonal`·`#btnGoalsSubStats`·`#btnGoalsSubTemplate`, `#btnGoalPeriodWeek`·`Month`·`Year`, `#goalsStatChartContent`, `.btn-quick-adopt-goal`, `#templateEncyclopediaView`, `#encyclDomainPersonal`·`Routine`·`Team`, `#subtabTplBtnAi`·`Real`, `#btnRecViewAllArchive`, `#toast`. 남김: `#goalFastAddInput`·`.smart-tag-chip`·`#routineMatrixGrid`·`#goalDetailDrawer`·`#recCalFuseSwitcher`·`#quickStopwatchBar`·`#btnExportRecordsCsv`.
- 함수: 3절 표. `OurgoalAppScope.expose`, `OurgoalGoalsKit`, `OurgoalRecordsKit`.
- 파일: `index.html`, `js/tabs/goals/goals-ia-actions.js`, `js/tabs/goals/template-encyclopedia.js`, `js/tabs/records/archive-toggle.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-h2-pr1.json`·`dom-compare-inline-h2.js`·`dom-steps-inline-h2-pr1.js`, `reports/TASK-ES-481/*`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main(`git archive` 사본). 작업 번호: 처음 TASK-ES-462 로 잡았으나 #767 이 같은 번호로 먼저 병합되어 TASK-ES-481 로 바꿨다. main 을 네 번 합쳤고 그때마다 index.html 은 main 판을 입력으로 생성기를 다시 돌려 만들었다(손으로 푼 충돌 0). 조작 비교·시험 비교는 origin/main 91d1496 기준, 마지막 합침(ffb98c9 — #773·#774·#776·#777) 뒤에는 verify·모듈 로드 탐침(회귀 0)·시나리오 3개(기준·작업 통과)를 다시 쟀다. 측정 파일은 `reports/TASK-ES-481/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-inline-hard.js` | 옮긴 함수 6·상수 5 토큰열 동일, 표지 구간 줄 단위 동일, 남은 글자 197,160토큰 동일, 누수·미노출·setter 빠짐·남은 정의·안 가져온 사용·this/arguments 0, 처리기 657 = 642 + 15, 새 파일 118·765·49줄 (`verify-inline-hard-pr1.json` ok) |
| 줄 수 | 생성기 메타 | index.html −812줄(이번 판 줄 수는 `gen-meta-pr1.json` — main 이 움직이면 바뀐다) |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 3개 단독 로드 ok(전역 = 기존 키트 1개씩) (`module-load-probe.json`) |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` 로컬 | `goals-ia-actions`·`goals-template-encyclopedia`·`records-archive-toggle` 기준·작업 모두 통과, 약점 0 (`scenario-local.json`) |
| 조작 전후(게스트) | `dom-compare-inline-h2.js` | 19단계 × 10칸 = 190값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (`dom-compare-pr1.json`). 순서 바꿔(후 2회·기준 1회) 후 대 기준 0, 후 대 후 3칸(첫 3단계 저장값의 `maxBaseCrafts` 저장 시점 — 같은 앱 두 번 실행에서 갈리는 본질 변동, `dom-compare-pr1-reversed.json`) → 하네스가 그 키를 지우고 다시 잼. 하네스 시드에는 추천 템플릿 카드가 없어 담기는 `window.adoptTemplateAsMyGoal` 직접 호출(마크업 onclick 과 같은 경로)로 잼 |
| 시험 | `test-compare-inline-p2.js` | smoke 443/0 · 무결성 38/38 · 버튼 943/943 기준=후, 작업 npm test 종료 코드 0(기준 사본은 git 이력이 없어 세포지도 이력 비교 시험이 실패해 1). tests 111개 중 종료 코드가 다른 것은 그 1건뿐, 출력이 다른 3건은 git 이력이 있어야 도는 원본 대조 검사가 작업 쪽에서 더 돈 것(`test-compare-pr1.json`) |

[4단계: 심사 청구]
