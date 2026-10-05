# REQ — #TASK-ES-407 시간기록 세포 분열: js/time-tracker.js(1,220줄)를 800줄 이하로 (동작 그대로)

- 근거: 코디네이터 지시(2026-10-05) — `js/time-tracker.js`(1,220줄)를 800줄 이하로, 응집된 책임 묶음을 새 파일(각 800줄 이하, 하는 일 이름, part1/part2 금지)로. 선례 #719(TASK-ES-402 팀 3차)·#715(TASK-ES-403 시험지 선행)·#712·#717(통계 1·2차). 선행 시험지 #720(TASK-ES-408, 시간기록 합본 — 병합됨 e0a28a3).
- 범위(책임 단위 3묶음, 함수 5개):
  ① `js/time-tracker-screen.js` — 몰입 화면 만들기·버튼 배선: `initDOM`(전체화면 덮개 `#timeTrackerOverlay` DOM 1회 생성)·`bindEvents`(모드 탭·프리셋·조절기·회전·닫기·취소·저장·ESC·회전 감지)
  ② `js/time-tracker-lap-memo.js` — 구간 메모 패널: `openLapMemoModal`
  ③ `js/time-tracker-review.js` — 기록 작성·내 기록 저장: `openReviewView`·`handleSaveRecord`
- 기능 추가·삭제 0, 버그 수정 0. 전역 노출(`window.OurgoalTimeTracker` 키 `open`·`close`·`switchMode`·`getState` 와 순서)·호출 순서·동작 그대로. 상태(`tracker` 객체)는 원본에 둔다. 새 전역 1개(키트 `window.OurgoalTimeTrackerKit`).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `js/time-tracker.js` 에서 응집된 책임 묶음을 새 파일(각 800줄 이하, 하는 일 이름)로 뗀다. 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 상태 값은 원본에.
2. 선례의 REQ·생성기(글자 그대로, 스코프 이름 접두만)·verify(토큰 동일·누수 0)·dom-compare·tab-check·spec 생성 스크립트 방식을 따른다. index.html 태그는 원본 태그 앞 같은 줄(순증가 0줄).
3. 시험지가 원본 한 파일만 읽어 깨지면 범위만 넓히는 선행 PR 을 먼저 — 모의 이전에서 기준 시험지 440/443 이 나와 #720(TASK-ES-408)을 먼저 올렸고 병합됐다. 그 뒤 origin/main 을 합쳐 이 PR.
4. 증명: `git archive` 기준 사본(stash 금지) 대비 토큰 동일, 기록 탭 tab-check 기준 2회·후 1회 차이 0, 시간 기록 조작 게스트 DOM 비교(시작·정지·랩·기록 저장), npm test 동일, 로그인 화면은 로컬 127.0.0.2 + /api 운영 전달 실계정(읽기 위주).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 한 IIFE 에 "측정 엔진(시작·일시중지·구간·초기화·전체중지·화면 갱신 루프)"과 그 엔진을 쓰는 "화면 세 벌(덮개 골격+배선, 구간 메모 패널, 기록 작성 화면+저장)"이 같이 있다. 쪼개는 단위는 화면 입구가 따로인 큰 함수 묶음 — 같이 바뀌는 코드다. 엔진과 상태는 원본에 남는다.
- 원인(측정): 함수별 줄 수 — `initDOM` 177줄 + `bindEvents` 110줄(이어 붙어 있음, initDOM 끝에서 bindEvents 를 부른다) = 288줄(주석 포함), `openLapMemoModal` 89줄, `openReviewView` 74줄 + `handleSaveRecord` 82줄(이어 붙어 있음) = 157줄(주석 포함). 1,220 → 800 이하에는 420줄 이상이 빠져야 하고, 두 묶음(화면·기록 작성)만으로는 이음매를 더하면 800을 넘는다(생성기로 두 묶음만 옮겨 본 실측 810줄) → 구간 메모 패널까지 세 묶음.
- 중심: 상태는 **원본에 그대로 둔다**. 옮긴 코드는 키트 칸 `OurgoalTimeTrackerKit.<칸>.scope` 의 getter 로 원본 스코프 이름(`tracker`·`askConfirm`·`formatTime`·`renderLapsList`·`closeTrackerOverlay` 등)을 읽는다. 옮긴 코드는 원본 스코프 이름에 대입하지 않아 setter 0개(검사기가 잼). `tracker` 는 객체 하나를 같이 가리킨다(`getState()` = 세 칸의 `scope.tracker` — 검사기 `getStateIsLiveTrackerObject`).
- 핵심 제약: 기준 시험지가 원본 글자를 직접 읽었다(ES-090·ES-174·ES-175) → #720 이 「시간기록 합본」(원본 + `OurgoalTimeTrackerKit` 표식이 있는 `js/time-tracker-*.js`)을 읽게 했다. 부품 머리는 그 표식을 쓴다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-time-tracker.js`: `@babel/traverse` 스코프 분석으로 옮길 함수가 읽는 원본 IIFE 이름을 뽑아 `T.<이름>` 으로 바꾼다(같은 부품 안 호출은 그대로, 다른 부품으로 옮긴 함수는 원본이 가져와 둔 이름을 `T.` 로 읽는다 — `bindEvents` 의 `handleSaveRecord`). 함수 바로 위 붙은 주석 함께, 원본 그 자리에 한 줄 안내 주석.
- 원본 머리 이음매('use strict' 바로 다음): `var _ttKit = global.OurgoalTimeTrackerKit || {};` → 칸마다 `var _ttScreen = _ttKit.screen;`(없으면 node 에서 `require('./time-tracker-screen.js')`) → `var initDOM = _ttScreen.initDOM;` …(함수 선언 끌어올림과 같은 효과 — 이 줄보다 먼저 도는 문이 없고, IIFE 실행 중 옮긴 함수를 부르는 최상위 문은 0개임을 생성기가 확인) → `Object.defineProperties(_ttScreen.scope …)` getter 통로(①11 ②2 ③3개).
- 원본에 남긴 것: 상태 `tracker`, `askConfirm`(공용 확인창 통로 줄), 엔진(`safeRaf`·`safeCaf`·`playTimerBeep`·`formatTime`·`getElapsedMs`·`adjustTimerUnit`·`updateTimerDisplay`·`switchMode`·`handleScreenResize`·`handleCloseAttempt`·`showCancelDialog`·`hideCancelDialog`·`renderControls`·`updateLoop`·`handleTimerComplete`·`startTracker`·`pauseTracker`·`resumeTracker`·`recordLap`·`promptResetConfirm`·`renderLapsList`·`resetTracker`·`stopAndRecord`·`openTrackerOverlay`·`closeTrackerOverlay`), 노출 객체 `global.OurgoalTimeTracker` 와 키 순서 — 자리·순서 그대로.
- `index.html`: 원본 태그 바로 앞 같은 줄에 새 태그 3개(순증가 0줄). 원본 태그 글자 `js/time-tracker.js?v=20260915-es090` 그대로.
- 위치 [기본값]: `js/` 바로 아래(팀·통계 쪼개기와 같은 이유 — `js/tabs/**` 는 #TASK-ES-155 단언, `js/<폴더>/` 는 verify-all-clicks 범위 밖). 이름은 하는 일: screen(화면 만들기·배선)·lap-memo(구간 메모)·review(기록 작성·저장).
- 키트 [기본값]: 함수마다 전역을 두지 않고 `OurgoalTimeTrackerKit` 하나에 칸 셋(`screen`·`lapMemo`·`review`) — 새 전역 1개(팀 3차 `OurgoalTeamGoalsKit` 와 같은 꼴).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 줄 수: `js/time-tracker.js` 1,220 → 730. 새 파일 312·112·181줄. 모듈 가드 ④ 5 → 4.
- 게스트 조작 비교의 시간 값(경과 초·센티초·기록 id 의 시각·꼬리 난수·`durationMs` 등)은 지우고 맞댄다 — 기준 대 기준도 같은 칸만 달라진다(8절).
- 실계정: 「내 기록에 저장」은 누르지 않았다(쓰기 0 — 기록 작성 화면까지 열고 「작성 취소 → 정말 취소」). 저장 경로(`handleSaveRecord`)는 게스트 조작 비교·화면 시나리오에서 눌러 쟀다.
- 기존 결함(고치지 않음): `scripts/test-time-tracker-lifecycle.js` 가 기준에서도 실패한다 — `eval` 로 원본을 돌릴 때 원본 머리의 `require('./core/confirm.js')` 가 `scripts/` 기준으로 풀려 MODULE_NOT_FOUND. 작업에서도 같은 종료 코드(첫 require 가 이음매의 부품 require 로 바뀌어 메시지만 다름 — 정규화 출력 비교 8절).
- `#btnOpenTimeTracker`(기록 탭 머리)는 `display:none !important` 로 숨겨져 있다(기존, 이 PR 과 무관 — 옮긴 코드에 CSS 은폐 0). 배너 카드 `#recTimeTrackerActionCard`(안에 `#btnOpenTimeTrackerBanner`)도 인라인 `display:none` 이라 게스트에게 보이는 입구는 기록 탭 빠른 실행 줄 `#recQuickDockBar` 의 「⏱️ 시간기록」 버튼이다 — 조작 비교·화면 시나리오·실계정 모두 그 버튼으로 연다.

## 5. [원칙 ⑤] 절차

1. 묶음 선정(함수 줄 수·호출 관계·시험 글자) → 2. 생성기 → 3. 모의 이전으로 기준 시험지 실패 확인(440/443) → 시험지 선행 #720(TASK-ES-408) → 병합 뒤 origin/main(e0a28a3) 합침, 기준 사본도 그 커밋 `git archive` 로 바꿔 다시 생성(산출물 글자 같음 확인)·4~8 단계를 그 기준으로 잼 → 4. `verify-time-tracker.js` → 5. `module-specs --write` → `spec-time-tracker.js`(손 칸 kind·role·spans, 원본 세포 값 읽음) → `module-specs --write` → `module-guard --update` → 6. 게스트 조작 비교 `dom-compare-time-tracker.js`(기준 2회·후 1회) + `tab-check.js records,calendar`(기준 2회·후 1회) + 법정 모듈 로드 탐침(로컬) + 화면 시나리오 로컬 실행 → 7. 실계정 `real-account-time-tracker.js`(기준1·작업·기준2) → 8. npm test·tests 기준·작업 → 9. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "키트 전역 하나가 늘었다 — 원칙 4(전역 이름을 늘리지 않는다) 위반 아닌가." → 원칙 4 가 막는 것은 옮긴 함수를 `window` 에 새로 달아 그 이름을 찾던 다른 파일의 분기가 새로 도는 일이다. 옮긴 함수 5개는 window 에 달리지 않고(검사기: window 새 이름 = 키트 1개뿐), 키트 이름은 어느 파일도 찾지 않는다. 팀 `OurgoalTeamGoalsKit`·통계 `OurgoalUniversalStatsKit` 와 같은 꼴이다.
- 반론 2: "구간 메모 패널(89줄)을 따로 뗀 것은 줄 수 맞추기다." → 구간 메모는 측정 중에 구간 항목을 눌러 여는 독립 화면(입구 `renderLapsList` 의 항목 클릭, 자기 DOM `#ttLapMemoContainer` 안에서 퀵 태그·취소·저장)이고 원본에서도 한 함수로 따로 있다. 화면 묶음·기록 작성 묶음 둘만 옮기면 이음매를 더해 810줄(실측)로 800을 넘으므로 하나는 더 옮겨야 하는데, 엔진 함수(`renderControls` 등)를 떼면 상태 대입(setter)이 생기고 엔진이 갈라진다 — 대입 없이 떨어지는 다음 화면 단위가 구간 메모다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- `js/time-tracker-screen.js`(312줄) — `initDOM()`·`bindEvents()`, DOM `#timeTrackerOverlay`·`#ttWrapper`·`#ttMeasureView`·`#ttTabStopwatch`·`#ttTabTimer`·`#ttTimerSetup`·`[data-tsec]`·`#btnTtTimerResetPreset`·`#btnTtTimerHourUp`~`#btnTtTimerSecDown`·`#btnTtRotateToggle`·`#btnTtClose`·`#btnTtCancelReview`·`#btnTtCancelNo`·`#btnTtCancelYes`·`#btnTtSaveRecord`·`#ttCancelConfirmDialog`.
- `js/time-tracker-lap-memo.js`(112줄) — `openLapMemoModal(lap)`, DOM `#ttLapMemoContainer`·`#ttLapMemoInput`·`.btn-quick-lap-tag`·`#btnTtLapMemoCancel`·`#btnTtLapMemoSave`.
- `js/time-tracker-review.js`(181줄) — `openReviewView(elapsedMs)`·`handleSaveRecord()`, DOM `#ttReviewView`·`#ttReviewHeaderTitle`·`#ttReviewTotalTime`·`#ttReviewLapCount`·`#ttActivityTitle`·`#ttReviewLapsGroup`·`#ttReviewLapsList`·`.tt-review-lap-card`·`.btn-lap-card-tag`·`.tt-lap-input`.
- 원본 이음매 `_ttKit`·`_ttScreen`·`_ttLapMemo`·`_ttReview`·`Object.defineProperties(<칸>.scope || (<칸>.scope = {}), …)`.
- 도구: `gen-time-tracker.js`·`verify-time-tracker.js`·`spec-time-tracker.js`·`dom-compare-time-tracker.js`·`real-account-time-tracker.js`·`test-compare-time-tracker.js`(모두 `docs/design/harness/module-split/`).
- 신고서: `docs/architecture/modules.json` 새 세포 3개(hybrid, spans records·calendar — 원본 값), 기준선 `docs/architecture/module-baseline.json` ④ 에서 `js/time-tracker.js` 빠짐.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-time-tracker.js`(기준 = `git archive e0a28a3`) | 5개 함수 토큰열 동일(`T.` 접두·주석 제외), 누수 0·미노출 0·노출됐는데 안 씀 0·setter 0(대입 0)·원본에 남은 정의 0·안 가져온 함수 0, 원본 730·부품 312·112·181줄(모두 800 이하), 부품 `잔디` 0. 실행: `OurgoalTimeTracker` 키·순서 동일(브라우저 순서 vm·키트 없이 node require 둘 다), `getState()` = 세 칸 `scope.tracker` 같은 객체, window 새 이름 = `OurgoalTimeTrackerKit` 1개 — `reports/TASK-ES-407/verify-time-tracker.json` `ok: true` |
| npm test | `NODE_PATH=… npm test` 기준(분리 worktree e0a28a3)·작업 | smoke 443/0(검사 제목·결과 목록 동일) · 무결성 38/38 · 버튼 943/943 같음, 모듈 가드 ④ 5 → 4(이 PR 의 목적) — `reports/TASK-ES-407/test-compare.json` |
| tests 전부 | `tests/*.test.js` 102개 + `scripts/test-time-tracker-lifecycle.js` 기준·작업 | 종료 코드 103/103 같음(28개는 기준에서도 실패 — 기존). 정규화 출력 차이 1개(`test-time-tracker-lifecycle.js` — 양쪽 모두 첫 `require` 에서 MODULE_NOT_FOUND 인데 찾지 못한 이름이 `./core/confirm.js` → `./time-tracker-screen.js` 로 바뀜, 4절 기존 결함) |
| 라이프사이클 시뮬레이션 | 같은 시험을 `js/` 안 임시 사본으로 옮겨(require 가 js/ 기준) 기준·작업 실행 | 양쪽 종료 0, 출력 18줄 글자 같음(스톱워치·타이머 열기·시작·구간·일시중지·재개·전체중지·취소 경고·저장) — `reports/TASK-ES-407/lifecycle-probe.json` |
| 법정 모듈 로드 탐침 | `court/probes/module-load.js`(로컬 호출) | 회귀 0, 새 파일 3개 단독 로드 성공(head 54/53 · base 51/50, 실패 1개는 양쪽 같은 기존 `goal-templates-registry.js`) |
| 조작 전후(게스트) | `dom-compare-time-tracker.js`(기준 2회·후 1회) | 62단계 × 14칸 = 868값(61단계에서 실제로 누름 — 첫 단계는 탭 진입), 기준 대 후 0, 기준 대 기준 0, 콘솔 오류 0/0 — 시작·구간 2회·구간 메모 저장/취소/ESC·일시중지·계속·초기화 취소/확인·회전·화면 회전 감지·모드 전환 확인 취소/확인·닫기·전체중지·기록 작성 칩/입력·작성 취소·빈 제목 저장·스톱워치 저장·타이머(프리셋·시/분/초 조절·완료 11초)·타이머 저장·정말 취소 — `reports/TASK-ES-407/dom-compare-time-tracker.json` |
| 화면 시나리오(게스트, 법정 재실행용) | `reports/TASK-ES-407/scenarios/time-tracker-record.json` 를 법정 실행기(`court/lib/scenario.js` runScenario, 법정 호스트 이름)로 로컬 실행 | 기준·작업 모두 통과 |
| 탭 실측(게스트) | `tab-check.js records,calendar --deadclick off` 기준 2회·후 1회 → `tab-compare.js` | 816값, 기준 대 기준 0 · 기준1 대 작업 0 · 기준2 대 작업 0 |
| 실계정(읽기 위주) | `real-account-time-tracker.js`, 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A | 기준1·작업·기준2 8단계(빠른 실행 버튼·몰입 화면·구간 2개·버튼 줄·구간 메모 열기/취소·기록 작성 화면·작성 취소 경고) 글자 해시·속성 해시·노출 객체 키 해시 같음, 정말 취소 뒤 덮개 닫힘, 프로필 기록 수 전후 같음, pageerror 0, 쓴 행 0(정리할 행 0) — `reports/TASK-ES-407/real-account-time-tracker.json` |
| 모듈 가드 | `node scripts/module-guard.js` | ④ 5 → 4, 기준선 낮춤(`--update`) |

폐기(retire) 청구 없음. 시험 기대값 변경 0. 동결 파일 변경 0. 시험 파일 변경 0(시험지 범위는 #720 에서).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
