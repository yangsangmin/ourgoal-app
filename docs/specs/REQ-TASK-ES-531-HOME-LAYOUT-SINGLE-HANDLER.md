# REQ — #TASK-ES-531 「나만의 홈 구성」 단추(#btnCustomHomeLayout) 이중 처리기 → 한 벌

- 근거: 코디네이터 지시(2026-10-06, 세션 f747dcaa) 2번 — 숨김 기능 조사에서 「한 번 눌러 OurgoalCustomize.open 2회 호출」. #TASK-ES-514(PR #807)에서 분리(그 REQ 이탈 기록 ②). 기준 작업참고 PR #801.
- 유형 분류: (가) 표준 — 결함 수정. 단 대상 단추가 숨김에 갇혀 있어 아래 이탈 기록을 둔다.
- 승인선: 다섯 가지에 걸리지 않음(기능 삭제 0 — 단추·숨김 그대로, 시험 단언 변경 0).
- 범위: `index.html`(addEventListener 한 줄 → 주석), `js/customize.js`(`handle홈_Item31Action` 이 의존성 없이 부르던 `OurgoalCustomize.open()` → 앱 스코프 의존성 `appScopeDeps()`), `reports/TASK-ES-531/**`.

## 1. [원칙 ①] 문제 정확히 파악
- `#btnCustomHomeLayout`(index.html 홈 머리줄)에 처리기 두 벌: 인라인 `onclick="… handle홈_Item31Action(event) …"` + index.html `btnCustomHome.addEventListener('click', openHomeCustomizer)`.
- 작업자 측정(기준 7bf4c368, 측정용으로만 숨김을 풀고 진짜 누름): 한 번 누르면 `OurgoalCustomize.open` 2회 호출, 그중 1회는 예외(삼켜짐). 창 열림·토스트 「나만의 홈 구성으로 단일화되었습니다.」.
- 화면 사실: 이 단추는 ui.css `#btnCustomHomeLayout, #screen-home .home-head-row span, #offlineNoticeBanner { display:none !important }` 와 4테마 `.home-head-row` 숨김에 갇혀 사용자 화면에 보이지 않는다(숨김 게이트 허용 목록 `#btnCustomHomeLayout` 항목).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 같은 요소·같은 이벤트에 손잡이 두 개(CELL_SPLIT 6항 위반).
- 원인: addEventListener 는 b82bcca3(#TASK-ES-118, 2026-09-16), 인라인 onclick 은 2917b145(#TASK-ES-282 노션 31, 2026-09-26)가 붙였고 나중 것이 앞의 것을 지우지 않음(git log -S 실측). 그런데 `handle홈_Item31Action`(js/customize.js)은 `window.openHomeCustomizer` 를 찾는데, 그 이름은 index.html IIFE 안 지역 변수라 window 에 없다 → 대안 경로 `OurgoalCustomize.open()` 을 의존성 없이 불러 `deps.state` 에서 예외. 창은 addEventListener 쪽이 열고 있었다.
- 중심: 인라인 처리기(토스트·4개 화면 갱신·상호작용 기록까지 하는 쪽)를 남기면 창 열기가 실패하고, addEventListener 를 남기면 토스트가 사라진다 — 어느 쪽을 지워도 동작이 달라진다.
- 핵심: 인라인 한 벌을 남기고, 그 처리기가 창을 직접 제대로 열게(의존성을 앱 스코프 통로에서) 고친다.

## 3. [원칙 ③] 해결방식
- index.html: `var btnCustomHome = …addEventListener('click', openHomeCustomizer);` 줄을 사유 주석으로 바꿈(순증가 0줄). `#topHomeLayoutBtn` 의 addEventListener 는 그대로(smoke 고정).
- js/customize.js: `appScopeDeps()` 추가 — `OurgoalAppScope.scope` 의 state·saveProfile·toast·openModal·closeModal·track(js/tabs/records/external-import.js `openHomeCustomizer` 가 넘기는 것과 같은 6개). `handle홈_Item31Action` 의 대안 경로가 `OurgoalCustomize.open(appScopeDeps())` 로 연다. 새 전역 0(module-guard ③ 그대로).

## 4. [원칙 ④] 재검토
- 부수 효과: 같은 처리기를 쓰는 숨은 `#og-task-31-action-btn`(검증 전용 배선 카드, ui.css 숨김)도 이제 창을 연다(전에는 토스트만). 숨은 카드라 사용자 영향 0.
- `tests/remove-duplicate-home-layout-button.test.js` 는 `window.openHomeCustomizer` 를 가짜로 주므로 첫 경로를 그대로 탄다. 이 시험은 기준에서도 `renderCalendar must be called`(제품은 #TASK-ES-353 이후 renderCalendarScreen)로 실패하며 작업도 같다 — 시험 안 고침(보고).

## 5. [원칙 ⑤] 절차
1. 작업자 하네스(es514/measure.js)로 기준·작업 측정: 숨긴 단추와 `.home-head-row` 를 측정용으로만 인라인 !important 로 보이게 → 진짜 마우스 누름 → `OurgoalCustomize.open` 호출 수·예외 수·창·토스트, CDP getEventListeners 로 click 처리기 수.
2. 보이는 진입로(설정 「홈 구성 고르기」 #homeLayoutOpenBtn) 회귀 시나리오 기준·작업.
3. npm test·tests 종료 코드 비교·모듈 가드.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "숨은 단추는 고치지 말고 결심 목록에 올려야 한다(L042)." → 격파: L042 는 숨김을 풀지 지울지(승인선 ③)의 결정을 대신하지 말라는 것이다. 이 변경은 숨김·단추를 그대로 두고 처리기 배선만 한 벌로 줄인다 — 삭제도 복원도 아니다. 지시가 명시했다.
- 반론 2: "addEventListener 만 남기는 편이 한 파일로 끝나 간단하다." → 격파: 그러면 토스트·화면 갱신·상호작용 기록이 사라져 동작이 달라진다(지시: 어느 쪽을 지우든 동작 동일). 측정에서 작업 커밋의 창·토스트가 기준과 같음을 확인했다.

## 7. [원칙 ⑦] 측정(작업자, 판정 아님) — `reports/TASK-ES-531/constraints.json`
- 기준: click 처리기 2벌 · open 호출 2회(예외 1회) · 창 열림 · 위젯 목록 보임 · 토스트 같음.
- 작업: click 처리기 1벌 · open 호출 1회(예외 0회) · 창 열림 · 위젯 목록 보임 · 토스트 같음.
- 회귀 시나리오 `settings-home-layout-open`: 기준·작업 통과(콘솔 예외 0).

## 8. [원칙 ⑧] 막히는 지점 · 성과 측정
- 법정은 숨은 단추를 누를 수 없다 — R2 자체는 작업자 측정 기록(글자 확인)과 보이는 진입로 회귀 시나리오로만 낸다. 「확인됨」은 나오지 않는다.

## 이탈 기록 (작업참고 0-1 (나))
- ① 규칙: 「화면 파일 주장은 게스트 시나리오」(L001)·결함 PR 의 「기준 실패·작업 통과 시나리오」. 왜 안 맞나(사실): 대상 단추가 ui.css `display:none !important` 와 4테마 `.home-head-row` 숨김에 갇혀 게스트 화면에서 누를 수 없다(법정 실행기는 보이는 요소만 누른다). 대신 한 것: 숨김을 측정용으로만 푼 작업자 하네스 실측(호출 2→1, 예외 1→0, 창·토스트 동일)을 기록 파일로 내고 그 기록을 글자 확인으로 주장, 바꾼 화면 파일(index.html·js/customize.js)은 보이는 진입로 회귀 시나리오로 주장. 검증 수준: 숨은 단추 동작은 작업자 측정(판정 아님)이라 법정 기준으로는 낮다 — 판정서에서 그대로 드러난다.
