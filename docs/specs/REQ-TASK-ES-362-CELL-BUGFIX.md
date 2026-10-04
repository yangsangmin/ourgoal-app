# REQ — #TASK-ES-362 세포 이전 중 발견된 기존 버그 3건 수정 (노션 SET-08 · CAL-03 · CAL-04)

- 근거: 설정 탭 시범 이전 #TASK-ES-354(PR #666)·일정 탭 이전 #TASK-ES-360(PR #673)이 "버그도 그대로 옮긴다"(`docs/specs/MODULE-SPLIT-PROTOCOL.md` 0절 1)에 따라 옮기기만 하고 별도 티켓으로 남긴 결함. 이 PR 이 그 별도 티켓이다.
- 범위: `js/tabs/settings/sub-integrations.js` · `js/tabs/calendar/natural-schedule.js` · `js/tabs/calendar/day-detail.js` · `js/tabs/calendar/sub-day-detail.js` · `js/sanctuary-v3-engine.js`(날짜 선택·이동 6곳). index.html·CSS·마크업 변경 0. 기능 삭제 0.
- 동결 파일(court/**, AGENTS.md, CLAUDE.md, .github/workflows/**, scripts/essence-gate.js, scripts/verify-integrity-gate.js, package.json scripts, vercel.json) 변경 0. 토스트 관련 파일(js/auth-safety.js, helpful-reason, reactions, team-*) 변경 0.

## 1. [원칙 ①] 문제 정확히 파악

1. **SET-08**: 설정 > 고급 > 구글 캘린더 연동의 "목표·일정 변경 시 자동 동기화" 스위치(`#gcalAutoSyncSwitch`)가 노션 자동 전송 값으로 뒤집힌다.
2. **CAL-03**: 일정 탭 AI 일정 비서(`#calAgentInput` → `#calAgentSendBtn`)에 "내일 오후 3시 치과 예약" → 제목 "내 치과 예약", 날짜 오늘(일요일) 15:00 으로 등록된다.
3. **CAL-04**: 보이는 V3 달력(`OurgoalSanctuaryV3.selectCalDay`)에서 다른 날을 누르면 `state.calSelectedDate` 는 바뀌는데 아래 상세 칸 `#calDayDetail` 은 이전 날짜를 계속 보여 준다. 소블록 `js/tabs/calendar/sub-day-detail.js` 는 어디에도 없는 `window.renderCalendarDayDetail` 을 찾는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **SET-08 원인**: `renderIntegrationsSection(settings)` 한 함수 안에서 구글 캘린더 스위치와 노션 자동 전송 스위치(`#notionAutoPushSwitch`)가 같은 이름 `var isAuto` 를 썼다. `var` 는 함수 단위로 하나라서, 그릴 때(`className`·`aria-checked`)는 그 순간 값으로 맞게 보이지만, 구글 스위치의 `onclick` 이 누를 때 읽는 `isAuto` 는 마지막에 대입된 노션 값이다. 결과: 노션 자동 전송이 꺼져 있으면(기본값) 자동 동기화 스위치를 눌러도 `gcalAutoSync = !false = true` — **끌 수 없다**. 노션이 켜져 있으면 반대로 켤 수 없다. (지시문의 "표시가 뒤집힘"은 누른 뒤 다시 그려진 표시다.)
- **CAL-03 원인**: `parseNaturalScheduleText` 의 `\b오늘\b`·`\b내일\b` 등은 JS 정규식의 단어 경계(`\b`)가 영문·숫자 기준이라 한글 사이에서 늘 거짓 → "내일"이 날짜로 읽히지 않았다. 그 다음 요일 패턴 `([월화수목금토일])(?:요일)?` 이 아무 글자나 요일로 잡아 "내일"의 "일"을 일요일로 해석하고 그 글자만 지웠다(→ 제목 "내 …", 날짜는 다가오는 일요일 — 오늘이 일요일이면 오늘). 같은 원인으로 "10월 15일"(월 → 월요일로 먼저 먹힘), "수학 공부"(수 → 수요일, 제목 "학 공부")도 깨져 있었다.
- **CAL-04 원인**: `js/sanctuary-v3-engine.js` 의 `selectCalDay`·`shiftCal`·`selectToday`·`shiftWeek`·`shiftTimelineDay`·`setCalMode('month')` 6곳이 `window.renderCalDayDetail` 을 찾는데, 그 함수는 index.html IIFE 안(지금은 `js/tabs/calendar/day-detail.js` 의 `K.renderCalDayDetail`)에만 있고 전역에 달린 적이 없다 → 늘 건너뜀. `sub-day-detail.js` 도 같은 식으로 없는 `window.renderCalendarDayDetail` 을 찾아 그리지 않았다.
- **중심**: 세 결함 모두 "이름이 가리키는 것이 실제와 다르다"(같은 이름 두 변수 / 한글에 안 맞는 경계 / 없는 전역 이름).
- **핵심**: 이름을 실제와 맞춘다 — 변수는 용도별 이름, 날짜 경계는 한글 기준, 상세 칸 다시 그리기는 일정 키트(`window.OurgoalCalendarKit`, 이미 있는 통로)의 실제 함수. 전역 이름을 새로 늘리지 않는다(MODULE-SPLIT-PROTOCOL 0절 4).

## 3. [원칙 ③] 해결방식

- **SET-08**: `js/tabs/settings/sub-integrations.js` — `isAuto` 두 개를 `isGcalAutoSync`·`isNotionAutoPush` 로 나눔(10줄).
- **CAL-03**: `js/tabs/calendar/natural-schedule.js` `parseNaturalScheduleText(text, nowOverride)`
  - 한글 경계 `KO_BEFORE = (^|[^가-힣])`, `KO_AFTER = (조사 에·은·는·엔·까지·부터)?(?=$|[^가-힣])`.
  - 해석 순서: ① 명시 날짜(YYYY-MM-DD·YYYY년 M월 D일·M월 D일·M/D) ② N일 후/뒤 ③ 오늘·내일·모레·내일모레·글피 ④ 요일 — "요일"을 붙였거나 "이번 주·다음 주·담주"를 앞에 둔 경우만. 찾은 표현은 조사까지 제목에서 통째로 지운다. 요일의 날짜 계산(이번 주 지난 요일 → 다음 주, 다음 주 +7)은 이전과 같다.
  - 시간 뒤 조사 "에"도 시간 표현으로 함께 지운다("오후 3시에 치과" → "치과").
  - `nowOverride`(두 번째 인자)는 시험에서 기준일을 고정하는 용도. 호출부 `executeCalAgentNaturalSchedule` 은 그대로 인자 1개.
- **CAL-04**:
  - `js/tabs/calendar/day-detail.js` 에 `K.refreshCalDayDetail()` — `#calDayDetail`·프로필이 있을 때만 `renderCalDayDetail()` 을 부르고 그렸는지(true/false)를 돌려준다(예외는 경고 후 false).
  - `js/sanctuary-v3-engine.js` — 엔진 안 지역 함수 `renderCalDayDetail()` 가 일정 키트의 `refreshCalDayDetail` 을 부르게 하고, 6곳의 `if (typeof window.renderCalDayDetail === 'function') {…}` 를 그 한 줄로 바꿨다(1969 → 1964줄, 모듈 가드 기준선 낮춤). 기준 시험지 smoke `TASK-CALENDAR-TAB-RESTORATION`(엔진에 `renderCalDayDetail()` 호출 글자)도 그대로 통과.
  - `js/tabs/calendar/sub-day-detail.js` — 없는 `global.renderCalendarDayDetail` 대신 `OurgoalCalendarKit.refreshCalDayDetail()`. 그 결과(true/false)를 '실제로 그렸는가'로 돌려준다.
- **숨은 고전 그리드(`#calGrid`) 헛그리기 정리 — 하지 않음**: `#calGrid` 는 `display:none` 이지만 index.html 기록 탭의 "융합 달력"(`#recInlineCalGridSlot`, 23871줄 부근)이 `calGrid.innerHTML` 을 복사해 화면에 보여 준다. 그리기를 멈추면 그 화면에서 달력이 사라지므로 손대지 않았다.

## 4. [원칙 ④] 재검토

- 요일을 "요일"이 붙은 경우로 좁혀 "다음 주 금"(접두 있음)은 계속 되지만 "금 회식"처럼 접두도 "요일"도 없는 한 글자 요일은 더는 요일로 읽지 않는다. 이전에 그 형태는 "수학"·"토익"·"월간"·"10월" 같은 낱말을 깨뜨리던 바로 그 경로라 되살릴 수 없다(부품 시험에 낱말 보존 단언).
- `sub-day-detail` 이 실제로 그리게 되면서 이 소블록의 기존 `view:sync` 구독(#TASK-ES-353)이 처음으로 상세 칸을 다시 그린다. 같은 신호에 `sub-month-view` 가 `renderCalendarScreen`(상세 칸 포함)을 이미 다시 그리므로 결과 화면은 같고, 상세 칸이 없거나 로그인 전이면 그리지 않는다.
- V3 엔진(하이브리드 세포)이 일정 키트(`OurgoalCalendarKit`)를 직접 읽는다 — 신고서 `dependsOn` 에 올라간다. 청사진의 정식 길은 능력 등록부(`calendar.day-detail` 같은 능력)지만 `capabilities.js` 가 아직 index.html 에 붙지 않아 이번에는 기존 키트 통로를 썼다(새 전역 0).
- SET-08 스위치는 구글 캘린더가 연동된 계정에서만 보인다(`#gcalSyncRow` 가 `display:none`). 법정은 외부 통신을 막고 금고 fixture 추가는 금고 변경이라, 게스트 화면 시나리오로 누를 수 없다 → 부품 시험 + `unverified(needs-login)`.

## 5. [원칙 ⑤] 절차

1. 정독: MODULE-SPLIT-PROTOCOL·MODULE-BLUEPRINT·대상 파일 직전 3커밋·PR #666·#673 본문.
2. 기준 커밋(origin/main 41605c3)에서 결함 재현 — 로컬 정적 서버 + 법정 `court/lib/scenario.js` `runScenario` 로 화면 시나리오 3건, 부품 시험 2건.
3. 수정 → 같은 시나리오·시험을 작업 트리에서 통과 확인.
4. `node scripts/module-specs.js --write` · `node scripts/module-guard.js` · `--update`(기준선 낮춤) · `npm test`.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 — "CAL-03 을 고치며 기존에 되던 입력이 깨질 수 있다."** → 기존 화면 시나리오 `reports/TASK-ES-360/scenarios/calendar-agent-schedule.json`("오후 3시 치과 예약")이 작업 트리에서 통과하고, 부품 시험 `tests/calendar-natural-schedule.test.js` 에 이전에 되던 형태 6종(시간만·YYYY-MM-DD HH:mm·M/D·N시 M분·새벽 12시·제목만)을 같은 기대값으로 단언했다. 이전에 깨져 있던 형태(10월 15일·2026년 11월 3일·수학)는 단언을 "고쳐진 값"으로 둔다.
- **반론 2 — "날짜에 따라 법정 시나리오가 기준에서도 통과하거나 작업에서 실패할 수 있다."** → 시나리오는 날짜 글자를 쓰지 않는다. CAL-03 은 제목 `textEquals "치과 예약"`(기준은 요일과 무관하게 "내 치과 예약")과 D-day 표시 `D-1`, CAL-04 는 `:nth-child(1 of .s-cal-day-cell:not(.empty):not(.today):not(.active))`(일정 없는 다른 날 첫 칸 — 한 달은 최소 28칸이라 늘 있다)와 빈 상태 칸, 월 화살표는 "D-day 가 사라짐 + 1일" 으로 잰다.

## 7. [원칙 ⑦] 즉시 실행 — 결과(작업자 측정, 판정 아님)

| 버그 | 법정 화면 시나리오 | 기준 41605c3 | 작업 트리 |
| :-- | :-- | :-- | :-- |
| CAL-03 | `calendar-agent-tomorrow` | 실패 — 단계 9 제목 "내 치과 예약" | 통과 |
| CAL-04 | `calendar-select-day-detail` | 실패 — 단계 11 빈 상태 칸 0개(상세가 오늘에 머묾) | 통과 |
| CAL-04(이동 5곳) | `calendar-month-arrow-detail` | 실패 — 단계 8 다음 달로 옮겨도 "D-day" 그대로 | 통과 |
| SET-08 | (게스트로 못 누름) 부품 시험 `tests/settings-gcal-autosync-switch.test.js` | 실패 — "켜진 자동 동기화 스위치를 누르면 꺼진다" | 통과 3건 |
| CAL-03 | 부품 시험 `tests/calendar-natural-schedule.test.js` | 실패 — "CAL-03 원문 — 제목" | 통과 32건 |

- 회귀: `reports/TASK-ES-360/scenarios/*`(2) · `reports/TASK-ES-354/scenarios/*`(4) 작업 트리 통과. 시나리오별 콘솔 오류 수 기준·작업 같음(외부 차단 등 환경 오류).
- `npm test` 0 실패: smoke 443/443 · integrity 38/38 · verify-all-clicks 957/957 · shipyard(모듈 가드 + 새 부품 시험 2건) 통과.

## 8. [원칙 ⑧] 성과 측정 · 막힐 지점

- 성과: 위 표의 기준 실패 → 작업 통과 5건. 법정 판정은 `node court/chat.js <PR>`.
- 확인 못 함: 구글 캘린더 연동 실계정의 자동 동기화 스위치 화면(L5), 실제 폰(L6).
- 새로 발견(고치지 않음): ① 제목 불용어 제거 `\b(등록해줘|…|일정)\b` 도 같은 `\b` 문제로 한 번도 동작하지 않았다("치과 예약 등록해줘" → 제목 그대로). 고치면 "일정"이 든 제목이 바뀌므로 별도 티켓. ② "1.5시간 공부" 같은 소수가 M.D 날짜(1월 5일)로 읽힌다(이전과 같음).
