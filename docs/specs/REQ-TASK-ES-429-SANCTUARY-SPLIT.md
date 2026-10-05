# REQ — #TASK-ES-429 포커스 성소 엔진 세포 분열: js/sanctuary-v3-engine.js(1,964줄) → 715줄 (동작 그대로)

- 근거: 코디네이터 지시(2026-10-05) — `js/sanctuary-v3-engine.js`(1,964줄)를 800줄 이하로. 응집된 책임 묶음을 새 세포 파일(각 800줄 이하, 하는 일 이름, part1/part2 금지)로, 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 상태·로드 시점 상수는 원본에. 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT·CELL_SPLIT_PROOF·claims_hygiene). 선례 #732(ES-411)·#726(ES-412 시험지 선행)·#722·#720(시간기록)·#725(통계).
- 시험지 선행: 모의 이전에서 기준 시험지 smoke 440/443(3개 실패) → #741(TASK-ES-426, 성소 합본)을 먼저 올렸다. 이 브랜치는 그 커밋 위에 있다.
- #745 대체: 같은 분열을 #745 로 올렸으나 돌려보냄 2회(044AE1CE·62E148FA) — 화면 파일 `js/sanctuary-v3-engine.js` 의 이음매 줄을 글자 확인(config) 주장으로 내 「안 됨」을 받았고, 같은 PR 에서는 철회·종류 변경으로 풀 수 없었다. 상민님 결심 "포커스 성소 분열 A안으로 진행"(2026-10-05)에 따라 최신 main(b9e33ff) 위에서 생성기로 다시 만들고, 주장은 처음부터 화면 파일 동작을 전부 게스트 화면 시나리오로 잰다(글자 확인은 신고서·세포지도·도구·문서에만).
- 작업 번호: 처음 TASK-ES-425 로 시작했으나 같은 번호를 다른 세션(#739 전문가 목표 템플릿 분열)이 먼저 병합해 TASK-ES-429 로 옮겼다. #741 본문·기록의 「ES-425」는 이 성소 분열(지금 ES-429)을 가리킨다.
- 범위(새 세포 7개 — 옮긴 것: 레이더 함수 4 · 렌더 분기 본문 7 · 공개 객체 메서드 28):
  ① `js/sanctuary-peer-radar.js` — 동반자 레이더: `renderPeerAvatarHtml`·`getRealRunningMates`·`toggleRadarCollapse`·`renderSanctuaryComm` + 메서드 `cheerPost`·`openPeerDm`(첫째)·`openPeerInteraction`·`refreshRadar`·`gotoCompanions`
  ② `js/sanctuary-calendar-views.js` — 성소 달력 그리기: `renderSanctuaryCalendar` 의 월간 분기 본문(`renderSanctuaryCalendarMonth`)·타임라인 분기 본문(`renderSanctuaryCalendarTimeline`)
  ③ `js/sanctuary-calendar-actions.js` — 성소 달력 이동·일정 열기: 메서드 `shiftCal`·`selectToday`·`shiftWeek`·`shiftTimelineDay`·`selectCalDay`·`openAddScheduleModal`·`openDayHubModal`·`openBgPickerModal`·`toggleScheduleItem`
  ④ `js/sanctuary-goal-trail.js` — 목표 마운틴 트레일: `renderSanctuaryGoals` 의 「목표 있음」(else) 분기 본문(`renderSanctuaryGoalTrail`) + 메서드 `toggleMilestone`·`toggleTask`·`openMilestoneCheckin`·`transplantSampleRoutine`
  ⑤ `js/sanctuary-record-feed.js` — 성소 기록 피드·보관함: `renderSanctuaryRecords` 의 feed·archive 분기 본문(`renderSanctuaryRecordsFeed`·`renderSanctuaryRecordsArchive`) + 메서드 `setFeedPeriod`·`setFeedPage`·`applyFeedCustomDate`·`setArchivePeriod`·`setArchivePage`
  ⑥ `js/sanctuary-weekly-recap.js` — 위클리 리캡: recap 분기 본문(`renderSanctuaryRecordsRecap`) + 메서드 `downloadRecapImage`·`openWeeklyRecapModal`
  ⑦ `js/sanctuary-focus-timer.js` — 뽀모도로 타이머: timer 분기 본문(`renderSanctuaryRecordsTimer`) + 메서드 `togglePomodoro`·`resetPomodoro`·`finishPomodoroSession`
- 기능 추가·삭제 0, 버그 수정 0(예: `openScheduleDetail` 의 선언 안 된 `found` 참조, 같은 키 `openPeerDm` 두 번 정의 — 그대로). 전역 노출(`window.OurgoalSanctuaryV3` 키 41개와 순서·함수 이름·글자)·호출 순서·동작 그대로. 새 전역 1개(키트 `window.OurgoalSanctuaryV3Kit`).

## 책임 묶음 지도 (이전 전 js/sanctuary-v3-engine.js, 1,964줄)

| 줄 | 묶음 | 이번 처리 |
| :-- | :-- | :-- |
| 9~28 | `engine` 상태 객체(모드·달력 위치·타이머·피드 쪽) | 원본에 둠(상태). 옮긴 코드는 `T.engine` getter 로 같은 객체를 읽는다 |
| 30~59 | 공용 도우미 `isFocusSanctuary`·`escapeHtml`·`renderCalDayDetail`·`getTodayStr` | 원본에 둠(여러 세포가 씀 — `T.` 로 읽음) |
| 68~128 | 홈·설정 성소 렌더 | 원본에 둠(작고 동결 게이트·라우터와 한 짝) |
| 130~296 | 목표 `renderSanctuaryGoals` — 머리·알약(`s-goal-pills-wrap empty`)·목표 0건 분기(`window.promptNewGoal()`) | 원본에 둠(동결 게이트 글자) |
| 218~283 | 그 안 「목표 있음」 분기 본문(마운틴 트레일) | ④ 로 옮김 |
| 301~659 | 일정 `renderSanctuaryCalendar` — 머리·모드 바(`setCalMode(\'month\'…)`·`s-cal-quick-action-bar`·`폰 잠금화면에서 보기`)·주간 분기(`s-week-grid`·`dayDetailsHtml`) | 원본에 둠(동결 게이트 글자) |
| 341~508 · 602~655 | 월간·타임라인 분기 본문 | ② 로 옮김 |
| 664~1174 | 기록 `renderSanctuaryRecords` — 머리·모드 바(`setRecMode(\'…\')`)·히트맵 분기(`setRecMode(\'feed\')`)·통계 분기·if 사슬(`engine.activeRecMode === 'timer'`) | 원본에 둠(동결 게이트 글자) |
| 782~972 · 986~1107 · 1109~1133 · 1135~1170 | feed·archive·recap·timer 분기 본문 | ⑤·⑥·⑦ 로 옮김 |
| 1176~1317 | 소통 레이더 함수 4개 | ① 로 옮김 |
| 1322~1345 | 라우터 `renderSanctuaryV3` | 원본에 둠 |
| 1347~1953 | `window.OurgoalSanctuaryV3 = { … }` 공개 객체(메서드 41키) | 객체 대입문은 원본(로드 시점). 메서드 28개는 이어진 덩어리 9개로 ①③④⑤⑥⑦ 에 옮기고 원본 객체의 같은 자리에서 펼침(`...`). `this` 를 쓰는 `setCalMode`·`openPeerDm`(둘째)과 동결 게이트 글자가 있는 `openScheduleDetail`, 모드·히트맵 메서드는 원본에 둠 |
| 1955~1962 | `DOMContentLoaded` 등록 | 원본에 둠(로드 시점 등록) |

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 원본 1,964줄을 800줄 이하로. 책임 단위 새 세포(각 800줄 이하, 하는 일 이름). 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 상태·로드 시점 상수는 원본에.
2. 법정 모듈 로드 탐침(`court/probes/module-load.js`)은 js 파일을 하나씩 따로 vm 에 로드한다 — 원본이 부품 없이도 로드되어야 한다(standaloneOk).
3. 시험지가 원본 한 파일만 읽어 깨지면 범위만 넓히는 선행 PR(지운 단언 0) — #741(ES-426).
4. 동결 무결성 게이트(`scripts/verify-integrity-gate.js`, 금고 — 수정 금지)도 원본 한 파일을 읽는다 → 그 게이트가 찾는 글자 20개가 있는 구간은 원본에 남겨야 한다.
5. 증명: `git archive` 기준 사본 대비 토큰 동일·누수 0·standaloneOk, tab-check 기준 2회·후 1회 차이 0, 게스트 조작 DOM 비교 0, npm test 동일, 로그인 화면 읽기 전용 비교.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 한 IIFE 에 성소 6개 탭 화면 그리기와 공개 객체 메서드 41개가 탭 구분 없이 쌓여 1,964줄이 됐다. 같이 바뀌는 단위는 「화면 하나」(레이더·달력 그리기·달력 조작·목표 트레일·기록 피드·리캡·타이머)다.
- 원인(측정): 큰 렌더 함수 셋(목표 167줄·일정 359줄·기록 511줄)과 공개 객체(607줄)가 전체의 83%. 객체만 원본에 둬도 800줄을 넘기 때문에 함수 선언 단위 이전(선례 방식)만으로는 목표에 닿지 않는다. 또 동결 게이트가 렌더 함수의 머리(모드 바)·주간 분기·목표 0건 분기 글자를 원본에서 찾으므로 렌더 함수를 통째로 옮길 수 없다.
- 중심: **상태·도우미·라우터·렌더 함수의 머리와 if 사슬·객체 대입문은 원본에 그대로**. 옮기는 것은 (가) 서로만 부르는 레이더 함수 4개 (나) if 사슬의 분기 본문 7개 — 본문이 바꾸는 렌더 함수 지역 변수가 하나(`contentHtml`·`trailHtml`)뿐이라 「인자로 받고 돌려준다」로 동작이 같다 (다) `this` 를 쓰지 않는 메서드 28개 — 객체 리터럴의 같은 자리에서 펼치면 키·순서·값이 같다.
- 핵심: 바꾸는 글자는 원본 스코프 이름 앞 `T.` 접두뿐이고(토큰 검사), 이음매(가져오기·펼침·분기 호출 한 줄)는 생성기가 쓴다. 손으로 옮긴 글자 0.

## 3. [원칙 ③] 해결방식 — 구체적 식별자

- 생성기 `docs/design/harness/module-split/gen-sanctuary.js` + 묶음 정의 `sanctuary-cells.js`. 세 모양:
  - fns: 최상위 함수 선언(바로 위 붙은 주석 포함) → 세포로. 원본 IIFE 맨 위('use strict' 바로 다음)에서 `var renderSanctuaryComm = _sRadar.renderSanctuaryComm;` 처럼 같은 이름으로 가져온다(이 줄보다 먼저 도는 문 없음 = 함수 선언 끌어올림과 같은 값). 원본 최상위 문이 옮긴 함수를 로드 중에 부르는 곳 0(검사) — `renderRadar: renderSanctuaryComm` 은 값 읽기.
  - methods: 공개 객체의 이어진 메서드 속성 → 세포의 `K.methodsFrom_<첫 키> = { …글자 그대로… };`, 원본 객체의 그 자리에 `..._s<칸>.methodsFrom_<첫 키>,` 한 줄. 메서드 최상위 `this`·`arguments` 0(검사). 같은 키 `openPeerDm` 은 첫째만 옮기고(펼침 자리 = 첫 정의 자리), `this` 를 쓰는 둘째는 원본에 남아 값을 덮는다 — 이전과 같은 키 자리·같은 최종 값.
  - sections: if 사슬 분기 본문 → 세포의 `function renderSanctuaryRecordsFeed(records, contentHtml) { …본문… return contentHtml; }`, 원본 분기는 `contentHtml = renderSanctuaryRecordsFeed(records, contentHtml);` 한 줄. 검사: 본문이 바꾸는 렌더 함수 지역 변수 ≤ 1 · 본문 안 `var` 를 if 사슬 밖에서 안 씀(같은 사슬 다른 분기가 같은 이름을 쓰면 그 분기도 자기 선언이 있어야 함 — `pFilter` 가 feed·archive 둘 다 선언) · 인자 변수가 분기 뒤에 다시 대입되지 않음 · 바뀌는 변수를 안쪽 함수가 잡지 않음 · 본문 최상위 return·this·arguments·바깥 break/continue 0.
- 키트: 새 전역 1개 `window.OurgoalSanctuaryV3Kit`(칸 7개: `peerRadar`·`calendarViews`·`calendarActions`·`goalTrail`·`recordFeed`·`weeklyRecap`·`focusTimer`). 세포 IIFE 인자 이름·부르는 식은 원본과 같은 `(function(window){ … })(window)`, 키트 등록은 `var root = window; root.OurgoalSanctuaryV3Kit = …`(모듈 가드 ③ 전역 직접 대입 수 불변 — 선례 components 와 같은 꼴).
- 스코프 통로: 옮긴 코드가 읽는 원본 이름만(스코프 분석) 칸별 `scope` 에 getter — `engine`·`escapeHtml`·`getTodayStr`·`renderCalDayDetail`·`renderSanctuaryCalendar`·`renderSanctuaryGoals`·`renderSanctuaryRecords`. 대입하는 이름 0(setter 0).
- `index.html`: 원본 태그 `<script src="js/sanctuary-v3-engine.js?v=20260928-prod-renewal-final"></script>` 바로 앞 같은 줄에 세포 태그 7개(순증가 0줄, 원본 태그 글자 그대로).
- 신고서: `node scripts/module-specs.js --write` → `spec-sanctuary.js`(kind·spans 는 원본 세포 값 그대로, role 은 묶음 설명) → `module-specs --write` → `module-guard --update`(④ 800줄 초과 js 1 → 0(main #743 합친 뒤)). 세포지도: `docs/architecture/cell-descriptions.json` 에 이름·하는 일 7줄 + `node scripts/cell-map-export.js` 재생성.
- 대상 DOM ID(그리는 자리, 바뀌지 않음): `#sanctuaryGoalsView`·`#sanctuaryCalendarView`·`#sanctuaryRecordsView`·`#sanctuaryCommView`·`#sPeerRadarCard`·`#sPomodoroDisplay`·`#sFeedPastArchiveCard`·`#sArchivePastCard`.

## 4. [원칙 ④] 재검토 — 다른 길과 비교

- A 함수 선언만 옮김(선례 방식): 레이더 4개만 해당 → 1,823줄. 목표 미달.
- B 렌더 함수 통째로 옮김: 동결 게이트(원본 한 파일 읽음, 수정 금지)의 글자 20개 중 17개가 렌더 함수 안 → 게이트 실패. 불가.
- C 게이트 글자를 원본에 주석으로 남김: 가짜 흔적 — 금지.
- D 분기 본문·메서드 덩어리를 생성기 이음매로 옮김: 게이트 글자 구간은 원본에 그대로 남고 715줄. 모든 이음매가 기계 검사(토큰·스코프·실행) 대상 → D 선택.
- 공장 함수·지연 조립(원본 단독 로드를 깨는 방식)은 쓰지 않았다: 원본 단독 로드에서 가져온 이름은 `undefined`, 펼침 대상 `undefined` 는 건너뛰어 던지지 않는다(법정 탐침 실측 성공).

## 5. [원칙 ⑤] 절차

1) 기준 = origin/main b9e33ff `git archive` 사본(스크래치 git init — 추적 파일만 읽는 시험 때문) → 2) 모의 이전으로 시험지 영향 측정 → #741 선행 → 3) 이 브랜치에 #741 커밋을 얹고 생성기 실행 → 4) `verify-sanctuary.js`(토큰·누수·실행·standaloneOk·동결 게이트 글자) → 5) 법정 모듈 로드 탐침 로컬 → 6) tab-check 기준 2회·후 1회 + tab-compare → 7) 게스트 조작 DOM 비교(`dom-compare-sanctuary.js`, 기준 2회로 본질 변동 거름) → 8) npm test 전후(`test-compare-sanctuary.js`) → 9) 실계정 읽기 전용(`real-account-sanctuary.js` 기준1·작업·기준2) → 10) 신고서·세포지도 → 11) claims·기록 → 12) PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "분기 본문을 함수로 빼면 지역 변수 공유가 바뀐다" → 본문이 바꾸는 바깥 변수는 `contentHtml`/`trailHtml` 하나이고 값으로 넘겨 돌려받는다. 본문이 읽는 바깥 변수(`records`·`itemsByDate`·`activeGoal`)는 분기 뒤 재대입 0(생성기 검사). 본문 안 `var` 는 호출마다 한 분기만 도는 if 사슬 안에서만 쓰인다(검사). 실측: 게스트 조작 DOM 비교에서 피드·보관함·리캡·타이머·월간·타임라인·트레일 화면 HTML 이 같다(8절).
- 반론 2 "객체 리터럴에 펼침(...)을 넣으면 키 순서·함수 이름·this 가 바뀐다" → 펼침은 그 자리에서 키를 순서대로 정의한다(같은 키 둘은 첫 자리·마지막 값 — 이전과 같음). 메서드 함수는 세포의 객체 리터럴 속성으로 정의돼 이름 추론(`name`)이 같고, `window.OurgoalSanctuaryV3.x()` 로 불러 `this` 도 같다. 실측: `OurgoalSanctuaryV3` 키 41개·순서·종류·이름·함수 글자(`T.` 접두 뗀) 같음, 옮긴 메서드 28개 === 키트 함수(검사기 ③).

## 7. [원칙 ⑦] 단계별 실행 — 결과

- `js/sanctuary-v3-engine.js` 1,964 → 715줄. 새 세포 7개: peer-radar 241 · calendar-views 256 · calendar-actions 156 · goal-trail 183 · record-feed 382 · weekly-recap 173 · focus-timer 139줄(모두 800 이하).
- `index.html` 순증가 0줄(같은 줄에 태그 7개). 동결 파일 0, 시험 파일 0(시험지 선행은 #741), retire 0, 기대값 변경 0.

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점

작업자 실측(판정 아님) — `reports/TASK-ES-429/*.json`:
- `verify-sanctuary.json`: 토큰 동일(함수 4·메서드 28·분기 본문 7 전부), 누수 0, 원본에 남은 정의 0, window 이름 같음(+키트 1), `OurgoalSanctuaryV3` 키 41·순서·이름·글자 같음, standaloneOk(원본 단독 로드 성공·등록 전역 같음, 세포 7개 각각 단독 로드 성공), 동결 게이트 글자 20개 원본에 남음.
- `module-load-probe.json`: 법정 탐침 로컬 실행 회귀 0.
- 아래 「측정 결과」.
- 막히는 지점: 동결 게이트가 합본을 읽지 않으므로 다음 성소 분열도 게이트 글자 구간(모드 바·주간 분기·목표 0건 분기·openScheduleDetail)은 원본에 남겨야 한다. 시험지 선행 #741 이 병합되기 전에는 이 PR 의 법정 smoke 가 3개 실패한다(기준 시험지).

### 측정 결과
- 기준: origin/main b9e33ff `git archive` 사본(스크래치 git init) 과 분리 worktree. `js/sanctuary-v3-engine.js`·성소 태그는 f020065 이후 main 에서 바뀌지 않았다(`git diff` 0).
- `verify-sanctuary.json`: ok·standaloneOk·integrityGateOk 모두 참, 원본 715줄, 함수 4·메서드 28·분기 본문 7 토큰 동일.
- `module-load-probe.json`: 법정 탐침 로컬 회귀 0, 새 세포 7개 단독 로드 성공.
- 화면 시나리오 6개(법정 실행기 로컬, 기준·작업 모두 통과, `scenario-local-*.json`) — 주장마다 자기 시나리오: 기록 피드 `records-feed-past-archive` · 목표 트레일 `goals-mountain-trail`(목표 직접 만들기) · 다음 달 이동 `calendar-month-shift` · 타임라인 `calendar-timeline-view` · 레이더 접기·펼치기 `comm-peer-radar-toggle` · 몰입 타이머 `records-focus-timer-card`.
- 위클리 리캡(`js/sanctuary-weekly-recap.js`)은 게스트가 누를 수 있는 길이 없다(성소 리캡 모드 버튼은 원본 모드 바의 `display:none !important` 숨김 칸 안, 보이는 「🐾 이번 주 리캡」은 index.html 의 다른 함수) — 「확인 못 함(tool-cannot-measure)」 주장으로 두고, 작업자 게스트 조작 비교의 `api-setRecMode-recap`·`api-openWeeklyRecapModal` 단계로 기준·작업을 맞댔다.
- 게스트 조작 비교(`dom-compare-sanctuary.json`): 83단계 중 82단계 실행(설정 탭 진입 1단계는 기준·후 모두 탭 전환 실패 — 하네스 한계), 1,162값 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0.
- npm test(`test-compare.json`, 기준 = b9e33ff 분리 worktree): smoke 443/0 · 무결성 38/38 · 버튼 943/943, smoke 제목·결과 같음, tests 종료 코드 같음.
- tab-check 6탭 전체 2,520값: 기준1 대 기준2 0 · 기준1 대 후 0 · 기준2 대 후 0(#745 때 측정 재사용 — 기준 9a33acc, 후 = 같은 생성기 산출물. 이후 main 변화는 성소 코드·태그를 바꾸지 않음).
- 실계정(`real-account-sanctuary.json`, #745 때 측정 재사용, 테스트 계정 A, 로컬 127.0.0.2 + /api 운영 전달, 읽기 전용): 기준1·작업·기준2 화면 8곳·공개 객체 해시 같음, pageerror 0, 쓴 행 0.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
