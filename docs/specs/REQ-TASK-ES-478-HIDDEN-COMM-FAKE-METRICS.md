# REQ — #TASK-ES-478 소통 숨김 진입로 판정 · 남은 허상지표 제거 · 위젯 시험 픽스처

- 근거: 코디네이터 지시(2026-10-05, #TASK-ES-462 #767 병합 뒤 2차).
- 범위(바꾼 파일): `js/tabs/records/trend-metrics-chart.js`(통계 요약 카드 — main 합칠 때 #TASK-ES-467 이 renderWeekChart 를 이 세포로 옮겨 같은 수정을 세포에서 다시 얹음, index.html 변경 0), `js/sanctuary-weekly-recap.js`, `tests/desktop-widget-suite.test.js`(가짜 window 이름 1줄), `reports/TASK-ES-478/**`.
- 범위 밖(보고만 — 코드 변경 0): 소통 허브 `#commHubGrid` 복원, 소통 피드 빠른 게시 띠 복원, 무공해 응원 바·프로필 시트의 가짜 전송.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 소통 허브 `#commHubGrid`(index.html 인라인 `display:none !important`) — `switchCommSubTab`·`triggerFloatingReaction`·`openInAppDmSheet` 가 실제로 동작하면 숨김을 풀어 보이는 진입로로 복원, 가짜 데이터·가짜 봇이면 보고만.
2. `renderCommFeed` 안 빠른 게시 띠(`.comm-quick-strip` 인라인 `display:none !important`) — 같은 방식으로 판단, 다른 진입로와 중복이면 보고.
3. 인라인 통계 요약 카드 `state.profile.streak || 3`, 위클리 리캡 `durationMinutes || 25` 허상지표 제거(값 없으면 표시 생략).
4. `tests/desktop-widget-suite.test.js` 낡은 가짜 window — 단언·기대값은 그대로 두고 픽스처만 고치는 것이 규칙상 허용되는지 판단.
5. 숨김 게이트 허용 목록에서 복원한 항목은 `--update` 로 줄인다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 숨은 진입로를 되살릴지는 "그 뒤의 기능이 진짜인가, 보이는 다른 길이 있는가"로 정한다. 숫자는 측정값만 싣는다.
- 원인(측정, 기준 origin/main 91d1496):
  - 1: 허브 단추 3개는 `switchCommSubTab('feed'|'crew'|'team')` 만 부른다. 보이는 소통 서브탭 칩(js/tabs/comm/render.js `subtabsList`)의 키는 `feed`·`group`·`companion` 이라 `crew`·`team` 은 없는 키다. 함수가 부르는 `renderFeedList`·`renderCrewScreen`·`renderTeamScreen` 은 저장소 어디에도 정의가 없어 `renderCommScreen` 으로 떨어지고, 이때 서브탭 분기에 맞는 키가 없어 본문이 비고 「팀 탭으로 전환되었습니다」 토스트만 뜬다. 피드·동반자·팀은 보이는 칩으로 이미 열린다(게스트 화면 실측: 서브탭 칩 6개 보임). 숨김 게이트 허용 목록(docs/architecture/hidden-entry-baseline.json)도 이 묶음을 「보이는 진입로: .comm-subtab」(B 분류)으로 적었다.
  - 1(같은 묶음의 나머지 둘): `triggerFloatingReaction`(보이는 `#commFloatingReactionDock`)은 숫자를 메모리(`window._commReactionCounts`)에만 올리고 아무 데도 보내지 않으면서 「따뜻한 응원을 전송했습니다」라고 알린다. `openInAppDmSheet` 는 코드에 박힌 「🦁 성장 러너 · 매일 아침 6시 런닝」 프로필 시트를 열고 닫으며 「1:1 대화방이 연결되었습니다」라고 알린다 — 둘 다 허브 안에 있지 않고, 실제 전송·연결이 없다.
  - 2: 띠의 「게시하기」(`#feedQuickPostBtn`)는 `openShareToFeedModal()` 을 연다. 같은 화면 머리의 보이는 `#btnCommPostFeed` 「게시하기」도 `handle소통_Item30Action` → `openShareToFeedModal` 로 같은 창을 연다(게스트 실측: 보이는 게시 단추 1개 = #btnCommPostFeed). 중복이다.
  - 3: `profile.streak` 는 어디서도 채우지 않는 칸이라 `|| 3` 이 늘 이긴다(기록 0건에도 「3일 연속 🔥」). 체크인 기록은 `durationMinutes`·`endAt` 이 없어 `|| 25` 가 기록마다 25분을 지어 「누적 0.4시간 몰입 완주!」를 만든다.
  - 4: 제품(`js/components-widget-actions.js handle전체공통_Item62Action`)은 #TASK-ES-353(28f75b6)부터 `renderCalendarScreen` 을 부른다. 시험의 가짜 window 는 아직 `renderCalendar` 만 줘서 3 !== 4.
- 중심: 소통 서브탭의 주인은 js/tabs/comm/render.js 칩, 피드 게시의 주인은 `openShareToFeedModal`, 스트릭은 `computeStreakDays`, 시간은 `durationMinutes` 또는 `endAt - startAt`.
- 핵심: 중복·고장 진입로는 되살리지 않고 근거를 남긴다. 숫자는 실제 함수 값만, 없으면 칸·줄을 뺀다. 시험은 단언을 건드리지 않고 가짜 이름만 제품과 맞춘다.

## 3. [원칙 ③] 해결방식

- index.html `renderWeekChart` 요약 카드: `streakVal = computeStreakDays()`, 0 이면 「포커스 스트릭」 칸을 빼고 격자를 2칸으로.
- js/sanctuary-weekly-recap.js: `realDurationMs(r)`(durationMinutes > 0 → 분, 아니면 endAt-startAt > 0, 아니면 0). 리캡 카드는 합이 0 이면 「누적 N시간」 줄 생략, PNG 는 「기록 시작」.
- tests/desktop-widget-suite.test.js: 가짜 window 의 `renderCalendar` → `renderCalendarScreen` 한 줄. 단언 줄 변경 0, 기대값 4 그대로.
- 숨김 게이트: 복원한 항목이 없어 `--update` 할 것이 없다(허용 목록 그대로, 게이트 통과).
- 대안: (1) 허브를 풀고 키를 고쳐 살리기 — 보이는 칩과 같은 일을 하는 두 번째 줄이 생기고(제11조 정리 방향과 반대), 함수 수정은 H4 구간 인라인 본문을 건드린다 → 기각, 보고. (2) 띠를 풀기 — 같은 화면에 같은 창을 여는 「게시하기」 두 개 → 기각, 보고.

## 4. [원칙 ④] 재검토 — 한계와 모순(정직하게)

- 무공해 응원 바(보이는 상태)는 보내지 않는 「전송」이다(GUARD_02 껍데기 의심). 고치려면 실제 응원 저장 배선이 필요하거나(설계 필요), 단추를 내리면 승인선 ③(기능 삭제)이다. 이번엔 손대지 않고 보고한다.
- 시험 파일 수정이 「시험지를 약하게 만드는 변경」인지 검토: 단언·기대값·검사 수 변경 0이고, 고친 뒤 시험이 실제 제품 함수가 달력 렌더를 부르는지 재게 되므로 강해진 쪽이다. 기준 시험지로 채점하는 법정에서는 이 시험이 기준에서도 실패하던 것이라 새로 깨지는 검사가 없다.
- 로그인 화면·실기기는 재지 않았다.

## 5. [원칙 ⑤] 절차

1. 게스트 화면 실측(보이는 진입로·함수 정의 존재) → 2. 판정(복원/보고) → 3. 허상지표 수정 → 4. 시나리오 3개 기준 실패·작업 통과(로컬 법정 실행기) → 5. 시험 기준·작업 종료 코드 → 6. npm test·module-guard·hidden-entry-guard → 7. REQ·claims·dev_log·TICKETS → 8. main 합치기·push·PR·판정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "지시가 「동작하면 복원」인데 함수가 예외 없이 돈다 — 동작하는 것 아닌가." → 격파: 「동반자」·「팀」 단추는 없는 키를 넣어 빈 본문을 만든다(서브탭 분기에 crew·team 없음). 「피드」 하나만 맞지만 보이는 칩 「📰 피드」와 같은 일이다. 되살리면 고장 난 단추 2개와 중복 단추 1개가 생긴다.
- 반론 2: "스트릭 칸을 빼면 카드 모양이 바뀐다." → 격파: 가짜 숫자보다 빈 자리 없는 2칸이 사실이다. 스트릭이 1일 이상이면 칸이 돌아온다(시나리오 records-stats-real-streak).

## 7. [원칙 ⑦] 단계별 실행 — 측정(작업자, 판정 아님)

- 시나리오 3개: 기준 모두 증상 단계 실패, 작업 모두 통과(`reports/TASK-ES-478/scenario-local.json`).
- desktop-widget-suite: 기준 종료 코드 1, 작업 0(`reports/TASK-ES-478/test-compare.json`).
- 새 `!important`·숨김 패턴 0, 가짜 지표 3곳 제거·0 추가(`reports/TASK-ES-478/constraints.json`).

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

- H4 빌더와 index.html 을 같이 고친다 — 이번 인라인 변경은 통계 카드 4줄뿐이고 소통 피드 구간은 손대지 않았다.
- 성과: 시나리오 3개 「확인됨」, 시험 1개 기준 실패→작업 통과.
