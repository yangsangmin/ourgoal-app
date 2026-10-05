# REQ — #TASK-ES-456 인라인 G076 「캘린더 날짜 클릭 일정 수정/관리 허브 모달」을 js/tabs/calendar/day-edit-hub.js 세포로 이동(동작 그대로) — 안티그래비티 분열 커밋 검수·마무리

- **역할: 코드 이동은 안티그래비티(agentapi, 원 커밋 760c7ec·cbb7908), 검수·수정·서류는 Claude.** 이 PR 의 첫 커밋(작성자 Antigravity)이 이동, 둘째 커밋이 Claude 검수 수정이다.
- 근거: 헌법 CELL_SPLIT, 선례 #TASK-ES-423(#744 — 인라인 세포화 1차, 검사기 verify-inline-split-1.js)·#TASK-ES-436(#752). 시험지 선행 #TASK-ES-454(#758 — tests/schedule-notification-setting.test.js 가 인라인 합본을 읽음).
- 범위: 인라인 IIFE 의 `openCalendarDayEditHubModal`(지도 G076, 구획 주석 포함 177줄)을 새 세포로 옮김. 기능 추가·삭제 0. 새 규칙대로 module-baseline·cell-map·inline-script-map(.md) 은 커밋하지 않고 main 판 그대로(병합 뒤 일괄 갱신).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 안티그래비티가 만든 분열 커밋 2개를 정식 번호로 법정 PR 에 올린다. 안티그래비티 자기 보고는 근거로 쓰지 않고 직접 잰다.
2. 재는 것: #744 하네스로 기준 사본 대비 토큰 동일·누수 0·원본/새 세포 단독 로드, npm test·tests 기준=작업, 달력 탭 tab-check 기준 대 작업 0, 게스트 조작 DOM 비교, 화면 동작은 게스트 화면 시나리오.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: "글자를 그대로 옮겼다"가 "같은 동작을 한다"를 보장하지 않는다. 이음매(키트 이름)·문자열 안 글자·로드 중 문 자리까지 맞아야 같은 앱이다.
- **원인**: 안티그래비티 판은 (가) 세포가 새 전역 `global._calendarKit` 에 함수를 달아, index.html 이음매(`_calendarKit = window.OurgoalCalendarKit`)가 `undefined` 를 가져와 날짜 허브 창이 아예 안 떴고(시나리오 단계 12 실패로 확인), (나) 이름 앞에 `L.` 을 붙이는 치환이 문자열 `class="empty-state"` 까지 `empty-L.state` 로 바꿨고, (다) `window.openCalendarDayEditHubModal =` 노출(로드 중 문)을 세포로 끌고 갔다. 오케스트레이터 대조는 `L.` 을 걷고 비교해 (나)를 놓쳤다.
- **중심**: `js/tabs/calendar/day-edit-hub.js` 머리(K·L 통로)와 index.html 이음매 한 줄·원래 자리.
- **핵심**: 키트는 기존 `OurgoalCalendarKit`, 통로는 다른 세포와 같은 `OurgoalAppScope.scope`, 문자열은 원래 글자, 노출 줄은 index.html 원래 자리 — 그리고 토큰 대조(문자열 토큰 포함)와 실제 화면 시나리오로 확인.

## 3. [원칙 ③] 해결방식

- 커밋 1(안티그래비티): 이동. 커밋 2(Claude): 위 (가)~(다) 수정, 이음매 들여쓰기·안내 주석·임시 번호(#TASK-ES-G076-AGY) 정리, cell-descriptions 문장, 검사기 `docs/design/harness/module-split/verify-inline-g076-456.js`(#744 검사기 복제 — MOVED 만 바꾸고 CR 줄 끝만 맞춤). 커밋 3: 신고서 `modules.json` 재생성(module-specs --write).
- 측정 도구: `dom-steps-g076-456.js`(게스트 조작 단계), `dom-compare-g076-456.js`(#436 비교기 복제 — 일정 id `sched_<난수>` 만 더 지움).

## 4. [원칙 ④] 재검토 — 한계

- 새 세포 `requires` 에 `ui.confirm` 이 없다는 smoke 경고(⚠, 실패 아님)가 하나 생긴다 — 원래 인라인 코드가 `OurgoalCapabilities.call('ui.confirm', …)` 을 부르던 것을 그대로 옮긴 결과이고 신고서 생성기가 정한다. 이번에 고치지 않는다.
- 실계정(레벨 5) 확인은 하지 않았다 — 이 창은 게스트 로컬 일정만 다룬다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/agy-g076-pr`(브랜치 `feat/2026-10-05-task-es-456-agy-g076`, 기준 origin/main) → 두 커밋 cherry-pick → 검수 수정 → 신고서 재생성 → 기준 사본·작업 사본 `git archive` → 검사기·탐침·시험 비교·tab-check·DOM 비교·시나리오 → 서류 → push 직전 main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "토큰이 같으니 동작도 같다." → 안티그래비티 판도 함수 본문 토큰은 문자열 하나 빼고 같았지만 키트 이름이 달라 창이 안 떴다. 그래서 단독 로드(등록 전역)·게스트 시나리오·DOM 비교를 따로 쟀다: 작업 판은 기존 키트 하나만 등록, 시나리오 2개 기준·작업 통과, DOM 비교 차이 0.
- 반론 2: "window 노출 줄을 index.html 에 되돌리면 인라인 줄이 덜 준다." → 로드 중 문은 원래 자리에 둔다는 #423 관례이며, 세포를 먼저 실은 뒤 IIFE 가 같은 함수를 다시 노출하므로 동작 차이가 없다. 줄 수보다 실행 순서 보존이 우선이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `js/tabs/calendar/day-edit-hub.js`(새 세포), `index.html`(script 태그 — `js/tabs/calendar/index.js` 앞, #423 이음매 `var openCalendarDayEditHubModal = _calendarKit.openCalendarDayEditHubModal;`, 원래 자리 window 노출), `docs/architecture/cell-descriptions.json`, `docs/architecture/modules.json`.
- 함수: `openCalendarDayEditHubModal`. DOM: `#hubAddNewBtn`·`#hubAddProRecBtn`·`#hubCloseBtn`·`#hubDayBgBtn`·`[data-hubedit]`·`[data-hubtogglesched]`, 진입 `.s-cal-day-cell.today` → 「📅 허브」(`window.OurgoalSanctuaryV3.openDayHubModal`).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 | 기록 |
| :-- | :-- | :-- |
| 토큰·덩어리 줄·누수 | 1788토큰 동일, 177줄 차이 0, 누수·미노출·남은 정의 0 | `reports/TASK-ES-456/verify-inline-g076-456.json` |
| 원본 단독 로드 | 회귀 0 | `module-load-probe.json` |
| 새 세포 단독 로드 | 기존 일정 키트 하나만 등록(안티그래비티 원판은 `_calendarKit`·`openCalendarDayEditHubModal` 새 전역) | `cell-load-probe.json` |
| npm test·tests | smoke 443/0·무결성 38/38·버튼 943/943 같음, tests 108개 종료 코드 차이 0 | `test-compare.json` |
| 달력 tab-check | 447값 기준 대 작업 차이 0(기준 대 기준 0) | `tab-compare-*.json` |
| 게스트 조작 DOM 비교 | 14단계×10칸 차이 0(기준 대 기준 0) | `dom-compare-g076.json` |
| 게스트 화면 시나리오 | 2개 기준·작업 통과 | `scenario-local.json` |

[4단계: 심사 청구]
