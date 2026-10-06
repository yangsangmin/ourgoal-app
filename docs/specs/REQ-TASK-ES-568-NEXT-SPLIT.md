# REQ — TASK-ES-568 잔여 책임 분열

근거: 헌법 CELL_SPLIT·CELL_SPLIT_PROOF, 작업참고 기준 PR #827, 유형 (가) 표준(L015·L016·L019·L009·L010·L026·L046·L047). 최종 입력은 #824 병합 뒤 origin/main이다. 구현 책임은 builder_827 한 명이다.

## 1. [원칙 ①] 문제 정확히 파악
인라인의 교대근무 루틴·성장 차트·홈 오늘 요약 책임이 남아 있다. 후보 전체가 아니라 게스트 실제 조작으로 도달한 함수만 옮긴다. `guest-reach.json`·`guest-reach2.json`에 기준 호출 수와 보임을 기록한다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
본질은 같은 동작을 책임별 세포에 두는 것이다. 원인은 인라인 함수와 상수 결합이다. 중심은 기존 키트와 app-scope 이음매이며 핵심은 토큰·남은 글자 동일, 로드 회귀 0, 화면 차이 0이다. 데이터를 새로 수집하거나 기능을 삭제하지 않는다.

## 3. [원칙 ③] 해결방식
`inline-next568.json`을 `gen-inline-hard.js`에 넣는다. 목표 `shift-routines.js`는 `OurgoalGoalsKit`, 기록 `growth-chart.js`는 `OurgoalRecordsKit`, 홈 `quest-summary.js`는 `OurgoalHomeMegaBlock`에 단다. 홈은 큰 세포 태그 뒤, 가져오기는 HO에 둔다. window 노출·상태는 원래 자리다.

## 4. [원칙 ④] 재검토
`announceToA11y`·`openThemePickerModal`은 후보 탐침에서 호출되지 않아 이번 범위에서 제외한다(keepRest, 삭제 0). `buildCheckinRecord`가 든 온톨로지 묶음과 비용 API가 든 비전은 제외한다. 홈 요약·퀘스트는 첫 화면 직계 숨김이 있으나 목표 시트 안에서 실제 보였다(#440 보호 동작). 성장 차트 `lifeBalanceBox`는 숨은 슬라이드 사본이라 `recFeedColdstartRadarSlot` 실제 피드로 검증한다.

## 5. [원칙 ⑤] 절차
번호 예약 → 기준 git archive → 게스트 호출 탐침 → 생성기 → 기존 전체 시험 전후 탐침 → 필요한 시험지 선행 여부 보고 → 신고서 → verify·seam·module-load → 게스트 시나리오 → tab 기준 2회·작업 1회 및 조작 비교 → #824 main 입력으로 재생성 → 전체 시험 → claims → 커밋 → 부모에게 push 인계.

## 6. [원칙 ⑥] 절차 재검증 · 반론
반론 1: 홈 키트가 덮어써져 함수가 사라질 수 있다. 기존 큰 세포 태그 뒤 삽입과 HO 순서 검사·화면 시나리오로 확인한다.
반론 2: 교대 루틴 적용은 기존 루틴을 교체하므로 이동 과정에서 데이터 동작이 달라질 수 있다. 기존 적용 함수 토큰을 그대로 옮기고 개인 루틴 보존 로직을 바꾸지 않는다. 기준·작업의 같은 게스트 조작을 비교하며 원격 쓰기는 하네스가 차단한다.

## 7. [원칙 ⑦] 식별자별 실행
함수: `applyShiftWorkRoutines`·`openShiftWorkCustomModal`·`openShiftCycleModal`·`renderColdstartRadarPreviewSvg`·`renderLifeBalanceWheel`·`renderRecordThemeFilters`·`renderTodayGlancePill`·`renderDailyQuestBar`. 상수 `SHIFT_WORK_PRESETS`.
DOM: `#btnOpenShiftRoutineModal`·`#shiftWorkCustomModalContent`·`#btnShiftModalCycleLink`·`#btnShiftNight`·`#routineGoalsView`·`#recFeedColdstartRadarSlot`·`#recThemeFilters`·`#homeCompassQuest`·`#todayGlancePill`·`#dailyQuestBarWrap`·`#questItemMilestone`.
제품 파일: `index.html`·`js/tabs/goals/shift-routines.js`·`js/tabs/records/growth-chart.js`·`js/tabs/home/quest-summary.js`。신고서 `docs/architecture/modules.json`.

## 8. [원칙 ⑧] 실패 예상 · 측정
시나리오의 탭 전환·모달 닫기 선택자가 맞지 않으면 기준에서도 실패한다. 실측으로 수정한 뒤 양쪽에 같은 시나리오를 적용한다. 전체 시험에서 새로운 실패가 나오면 제품 0·단언 0 변경 시험지 선행을 부모에게 보고한다. main 이동은 입력 재생성으로 처리한다. 측정 정본은 `reports/TASK-ES-568/`의 verify·seam·module-load·scenario-local·guest-compare·test-compare·snapshot 파일이다. 작업자 측정이며 판정은 독립 법정이다.

- [ ] [4단계: 심사 청구] 부모가 push·PR·독립 법정 실행 후 기록

측정 해석: 전체 실행기는 tests/*.test.js 113개와 별도 helper 스크립트 2개를 합쳐 115개 실행을 기록한다. 기준 archive의 Git 이력 시험 차이는 회귀와 구분한다. 원본의 공백 글자도 그대로 이동하므로 diff --check에 원본에서 옮긴 공백줄이 남을 수 있다.
