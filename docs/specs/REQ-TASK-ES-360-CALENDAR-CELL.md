# REQ — #TASK-ES-360 일정(캘린더) 탭 렌더를 js/tabs/calendar/ 세포로 옮기기 (동작 그대로)

- 근거: `docs/architecture/MODULE-BLUEPRINT.md` 8절 쪼개는 순서 3번(기록·일정)의 두 번째 단계. 선례 기록 탭 #TASK-ES-358(PR #671), 틀 `docs/specs/MODULE-SPLIT-PROTOCOL.md`(설정 시범 #TASK-ES-354, PR #666 — 이 작업 도중 main 에 병합됨, 6c2430c 위에서 다시 생성).
- 범위: `index.html` 인라인 IIFE 의 일정 탭 렌더 함수와 그것만 쓰는 헬퍼 7개 → `js/tabs/calendar/render.js`·`day-detail.js`·`natural-schedule.js`. 통로는 기존 `js/core/app-scope.js`(바꾸지 않음). 설정 탭 코드·`js/tabs/settings/**`·`js/core/ui-helpers.js` 는 건드리지 않았다.
- 기능 추가·삭제 0. 마크업(HTML)·CSS 는 옮기지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. index.html 인라인 스크립트 안의 일정 탭 렌더 함수와 그것만 쓰는 헬퍼를 `js/tabs/calendar/` 로 옮긴다. 화면 결과 전후 차이 0.
2. 신고서(`modules.json`)는 `node scripts/module-specs.js --write` 로 반영, 자리는 정식 15곳 중 `calendar.source` 만(실제로 꽂지 않으므로 `planned.contributes`). 모듈 가드 통과.
3. 공용 토스트·모달·시트를 새로 만들지 않는다. 새 js 800줄 이하(책임 단위). index.html 인라인 줄 수 감소.
4. 실측: `docs/design/harness/tab-check.js` 일정 탭 base 2회·after 비교 차이 0, 조작별 DOM 비교, 토큰 동일 검사.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 일정 탭이 그려지는 코드가 3만 8천 줄짜리 index.html 한 덩어리 안에 있어, 일정 탭을 고칠 때마다 다른 탭과 같은 파일·같은 스코프를 만진다(충돌·회귀의 원천).
- **원인**: 일정 탭 껍데기 세포(`js/tabs/calendar/sub-*.js`)는 `window.renderCalendarScreen` 에 위임만 하고, 실제 렌더 코드는 IIFE 지역 스코프 이름(state·toast·isoDate·calendarItemsByDate … 34개)에 묶여 있어 그냥 잘라 낼 수 없었다.
- **중심**: `renderCalendarScreen`(이전 전 index.html 11914~12156, 243줄)과 그것만 부르는 `renderCalDayDetail`·`executeCalAgentNaturalSchedule`(→`parseNaturalScheduleText`)·`calWeekStart`·`WEEKDAYS_KR`, 그리고 월·주·일 이동 `calShift`.
- **핵심**: 글자 그대로 옮기고, 지역 스코프 이름만 `L.<이름>`(app-scope getter 통로)로, 옮긴 파일끼리의 호출만 `K.<이름>`(일정 키트 `OurgoalCalendarKit`)으로 바꾼다. index.html 은 IIFE 맨 위에서 `renderCalendarScreen`·`calShift` 를 같은 이름으로 가져와 호출처 30여 곳을 그대로 둔다.

## 3. [원칙 ③] 해결방식

- 생성기 `docs/design/harness/module-split/gen-calendar.js`: 기록 탭 `gen-records.js` 를 복제해 두 가지를 일반화했다 — ① 옮기는 문이 한 구간이 아니라 여러 덩어리(이전 전 10314 · 10316 · 10660~10668 · 11766~12296)라 덩어리마다 지우고 한 줄 표지 주석을 남긴다 ② 함수 선언 외에 `var WEEKDAYS_KR` 도 옮긴다. 손으로 옮긴 글자 0.
  - `js/tabs/calendar/render.js`(283줄): `WEEKDAYS_KR` · `calWeekStart` · `calShift` · `renderCalendarScreen`
  - `js/tabs/calendar/day-detail.js`(162줄): `renderCalDayDetail`
  - `js/tabs/calendar/natural-schedule.js`(169줄): `parseNaturalScheduleText` · `executeCalAgentNaturalSchedule`
- 나눈 기준은 책임(화면 렌더 / 선택한 날 상세 / AI 일정 비서).
- index.html IIFE 머리: 설정(#TASK-ES-354)·기록(#TASK-ES-358) 이음매 다음에 일정 이음매 — `var _calendarKit = window.OurgoalCalendarKit; var renderCalendarScreen = …; var calShift = …;` + `window.OurgoalAppScope.expose('index.html', { getter 20개 })`. 옮긴 코드가 쓰는 34개 이름 중 14개는 앞 이음매가 이미 노출해 다시 달지 않았다(다시 달면 앞에서 단 setter — `state` 등 — 를 getter 만으로 덮어쓴다. 생성기가 검사). 옮긴 코드가 대입하는 인라인 이름은 0 → 새 setter 없음.
- `window.renderCalendarScreen = renderCalendarScreen`(두 곳)·`window.calShift = calShift` 노출 줄은 원래 자리 그대로.
- `<script>`: 일정 파일 3개는 `sub-photo-diary.js` 다음·`js/tabs/calendar/index.js` 앞(인라인 IIFE 보다 먼저 읽힘). `js/core/app-scope.js` 는 바꾸지 않았다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- **`calCellHtml`(날짜 칸) 은 옮기지 않았다**: 일정 렌더 전용 헬퍼지만, 동결 시험지 `scripts/verify-integrity-gate.js` `[검증 21/21] #TASK-ES-197` 이 index.html 한 파일에서 그 함수 안의 글자(`cal-photo-diary-bg`·`cal-photo-badge`)를 찾는다(합본을 읽지 않음). 처음 생성에서 옮겼더니 그 검사 1개가 실패해(37/38) 되돌렸다. 기대값·시험지는 바꾸지 않았다. 옮긴 코드는 `L.calCellHtml` 로 부른다. 옮기려면 그 시험지가 합본을 읽게 고치는 선행 PR(동결 파일 변경 = 상민님 결심)이 먼저다.
- 화면에 실제로 보이는 월 달력은 `js/sanctuary-v3-engine.js`(OurgoalSanctuaryV3)가 그린다. 옮긴 `renderCalendarScreen` 이 그리는 고전 그리드(`#calGrid`·`#calPrevBtn`·`#calNextBtn`·`#calViewToggle`)는 화면에서 숨겨져 있다(이전 전과 같다). 화면에 보이는 옮긴 코드 산출물은 선택한 날 상세(`#calDayDetail`)·AI 일정 비서(`#calAgentCard`)·구글 미니 배지(`#calGcalMiniBadgeSlot`)·잠금화면 버튼이다. 숨은 그리드도 조작 비교에서 함수로 직접 눌러 전후를 맞댔다.
- 공용 헬퍼를 `js/core/ui-helpers.js` 로 옮기는 단계(틀 4절 (1))는 하지 않았다 — 지시 범위(일정 탭 렌더와 그것만 쓰는 헬퍼) 밖이고 `ui-helpers.js` 는 설정 시범 몫. `isoDate`·`pad` 등은 app-scope getter 로 읽는다.
- 소블록(`sub-month-view`·`sub-day-detail`)은 여전히 `window.renderCalendarScreen`·`window.renderCalendarDayDetail` 에 위임하는 껍데기다(구조는 바꾸지 않음).

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/calendar-cell`(브랜치 `feat/2026-10-04-task-es-360-calendar-cell`) → 대상 확정(바인딩 참조 분석: 옮길 이름의 바깥 참조 수) → 기준 앱 풀기(`git archive 6c2430c`) → 생성기 → 글자·누수 검사 → 기준 2회·후 1회 실측 → 조작 비교 → 신고서·가드 기준선 → `npm test` → 화면 시나리오 기준·후 실행 → 문서 → PR → 법정. 도중 #666 병합(6c2430c)을 받아 origin/main 위에서 생성기를 다시 돌렸다(생성물은 손대지 않고 통째로 다시 만듦).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "`var WEEKDAYS_KR` 를 옮기면 IIFE 실행 순서상 값이 생기는 시점이 바뀐다." → 이 값은 상수 배열이고 옮긴 `renderCalendarScreen` 만 읽는다(생성기가 바깥 참조 0 을 검사). 일정 파일은 인라인 IIFE 보다 먼저 읽혀, 값은 오히려 더 일찍 생긴다 — 이전 전에도 IIFE 실행 중 `renderCalendarScreen` 이 그 줄보다 먼저 불리는 경로는 없었다(첫 렌더는 탭 진입 뒤).
- 반론 2: "두 번째 `expose` 가 같은 이름을 다시 달면 앞의 setter 가 사라진다." → 생성기가 앞 이음매(설정·기록)의 노출 목록을 읽어 이미 있는 14개는 빼고 20개만 더한다. 옮긴 코드가 대입하는 이름이 이미 노출돼 있는데 setter 가 없으면 멈추게 했다(이번 대상은 대입 0).
- 반론 3: "글자가 같아도 전역으로 새는 이름이 있으면 다른 값을 읽는다." → `verify-calendar.js` 가 옮긴 파일의 자유 변수 중 IIFE 스코프 이름 0(누수 0), `L.` 로 쓴 이름이 모두 노출됨(미노출 0), index.html 이 아직 부르는 옮긴 이름이 모두 키트에서 가져와짐을 검사한다. 남는 자유 변수 `renderStatsScreen` 은 이전 전에도 IIFE 밖 전역(typeof 검사)이었다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM(옮긴 코드가 그리는 곳, 마크업 자체는 index.html 그대로): `#screen-calendar`, `#calGrid`, `#calPeriodLabel`, `#calPrevBtn`·`#calNextBtn`·`#calTodayBtn`, `#calViewToggle [data-calview]`, `#calDayDetail`, `#calAddManualBtn`, `#calAgentInput`·`#calAgentSendBtn`, `#calGcalMiniBadgeSlot`, `#calLockScreenBtn`.
- 함수: `renderCalendarScreen`, `renderCalDayDetail`, `calShift`, `calWeekStart`, `parseNaturalScheduleText`, `executeCalAgentNaturalSchedule`, 상수 `WEEKDAYS_KR`, `OurgoalAppScope.expose`, `OurgoalCalendarKit`.
- 파일: `index.html`, `js/tabs/calendar/render.js`·`day-detail.js`·`natural-schedule.js`, `docs/architecture/modules.json`, `docs/architecture/module-baseline.json`, `docs/design/harness/module-split/gen-calendar.js`·`verify-calendar.js`·`dom-compare-calendar.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

모두 로컬 정적 서버 + 헤드리스 Chrome + 게스트 시드 + Supabase 목(원격·실계정 없음). 기준 = origin/main 6c2430c. 결과 파일은 `reports/TASK-ES-360/`.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-calendar.js` | 옮긴 7개 전부 토큰열 동일(L./K. 접두 제외) — renderCalendarScreen 2,183 · renderCalDayDetail 1,799 · parseNaturalScheduleText 929 · executeCalAgentNaturalSchedule 317 · calShift 99 · calWeekStart 52 · WEEKDAYS_KR 19 토큰. 누수 0 · 미노출 0 · 남은 정의 0 · 안 가져온 사용 0 (`verify-calendar.json` `ok: true`) |
| 기준 재현성 | `tab-check.js … calendar` 2회(6c2430c 를 git archive 로 푼 기준 앱) → `tab-compare.js` | 일정 탭 24장(4테마×2화면×3상태: 기본·주간 보기·일정 추가 시트)+Dead-Click, 비교한 값 447 · 다른 값 0 (`tab-compare-base-run1-vs-run2.json`) |
| 화면 전후 | 같은 도구, base run1·run2 각각 대 after(작업 트리 사본) | 비교한 값 447 · 다른 값 0 (`tab-compare-base-run1-vs-after.json`·`run2-vs-after.json`), 콘솔 오류 24장 모두 0. 두 앱 모두 git 폴더가 아니라 요약의 commit 칸은 null(그래서 sameCommit 이 true 로 찍힘 — 실제로는 기준 6c2430c 대 이 변경) |
| 조작 전후 | `dom-compare-calendar.js` | 20단계(진입·다음 달 2·이전 달·오늘·날짜 칸 2·주 보기·주 이동·일 보기·일 이동·월 보기·V3 주간·V3 월간·일정 추가 시트 열기·닫기·AI 일정 비서 등록·window.calShift·탭 왕복·다시 그리기 호출) × 11칸(#screen-calendar HTML·모달·달력 상태·localStorage·토스트·활성 화면·전역·새 콘솔 오류·레지스트리·구독·조작 결과) = 220 값, 다른 값 0, 콘솔 오류 base 0 / after 0. 단계마다 HTML 크기가 바뀐다(23,721 → 주 보기 20,396 → 일 보기 32,111 → AI 일정 등록 뒤 26,550 바이트) — 빈 비교가 아니다. 지운 값: 시간·난수, AI 일정 비서가 만든 일정 id(`uid('sched')` = 시각+난수) (`dom-compare-calendar.json`) |
| 화면 시나리오(법정 형식) | `court/lib/scenario.js` runScenario, 법정 정적 서버·무작위 호스트 | `calendar-day-detail-add`·`calendar-agent-schedule` 기준·후 모두 통과, 약점 0 |
| 모듈 가드 | `node scripts/module-guard.js` | ① 인라인 스크립트 36,414 → 35,905(-509) · ② 함수 선언 697 → 691(-6) · ③ 282 그대로 · ④ 12 그대로 · ⑤ 0. 기준선 낮춤(`--update`) |
| index.html 전체 줄 | wc -l | 38,783 → 38,277 |
| 새 파일 줄 수 | wc -l | render.js 283 · day-detail.js 162 · natural-schedule.js 169 (모두 800 이하) |
| npm test | `NODE_PATH=… npm test` | 0 실패 — smoke-test 443/443 · verify-integrity-gate 38/38 · verify-all-clicks 957/957 · test-shipyard-modular 통과 |

폐기(retire) 청구 없음. 시험 기대값 변경 0.

확인 못 함: 실제 폰(레벨 6), 실계정 로그인·구글 캘린더 연동 상태의 일정 탭(레벨 5 — 게스트 시드만 잼, 구글 토큰이 있을 때 도는 `fetchGoogleCalendarEvents` 경로는 전후 모두 안 돎), 다른 5개 탭 전후 tab-check 비교(일정 탭만 잼 — 옮긴 함수는 일정 탭 렌더 전용, 다른 탭 호출처는 가져온 같은 함수를 부른다).
