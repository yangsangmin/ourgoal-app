# REQ — #TASK-ES-433 갓생 카드 창 진입 단추 복원(홈 「내 성장 자랑하기」 · 기록 「📸 갓생 스토리카드」)

- 근거: 코디네이터 지시(2026-10-05) — 갓생 카드 창(`openMzShareCardModal`)으로 들어가는 단추 두 개가 CSS 은폐 사고로 모든 사용자에게 안 보인다(GUARD_02·제6조 위반 상태). 기능 삭제가 아니라 복원.
- 범위: `ui.css`(4테마 공통 숨김 목록에서 `.home-actions` 4줄 제거), `index.html`(홈 단추 두 개의 누름 처리기를 시작 때 한 벌씩), `js/sanctuary-v3-engine.js`(성소 기록 화면 머리에 스토리카드 단추 — 같은 줄 안에서), `reports/TASK-ES-433/**`, 세포 신고서·기준선·세포지도 재생성.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 홈 `#mzShareBtn`(「내 성장 자랑하기」)이 보이고, 누르면 카드 창만 열리고 탭은 홈 그대로.
2. 기록 탭에 스토리카드 진입 단추가 보이고, 누르면 카드 창이 열린다.
3. 설정 「홈 구성 고르기」의 `mzShareBtn` 스위치가 실제로 보이기/숨기기를 정한다(끄면 사라지고 켜면 보임). `#homeChallengeRoomBtn` 도 같은 처지면 같은 방식으로.
4. 숨김 규칙의 원래 의도(레거시 위젯 수납·중복 머리줄 정리)는 유지. 새 CSS 은폐·새 `!important` 금지, `index.html` 인라인 순증가 0.
5. 증명: 게스트 시나리오(법정이 기준·작업 양쪽 실행) — 지시 항목마다 자기 시나리오. 4개 테마 × 1280·375 실측, tab-check 홈·기록 비교, npm test 동일.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 카드 창 자체는 멀쩡한데 사용자가 그 창에 닿는 길이 0개다(측정: 기준 커밋 4테마 모두 `#mzShareBtn`·`#recStoryCardBtn` 크기 0×0). 「홈 구성」 스위치는 켜져 있다고 보여 주지만 화면은 바뀌지 않는 죽은 설정이다.
- 원인(측정):
  1. 홈 — `ui.css` 「🛑 HIDE CLUNKY LEGACY WIDGETS IN ALL 4 UNIFIED THEMES」 규칙(b2b7918→3ecf8f0)이 4개 테마(이 앱의 테마 전부)에서 `.home-actions` 를 `display: none !important` 로 숨겼다. 그 상자 안에 `#homeChallengeRoomBtn`·`#mzShareBtn` 이 있다. `js/customize.js` 의 스위치는 인라인 `style.display` 만 바꾸므로 `!important` 를 못 이긴다. 같은 파일 뒤쪽 `#screen-home .home-actions { order: 12 }` 는 이 상자가 보이는 것을 전제로 자리를 잡아 두었다.
  2. 홈 처리기 — `#mzShareBtn` 에는 `renderHome` 안의 `mzBtn.onclick = openMzShareCardModal`(목표가 1개 이상일 때만 도달 — 목표 0개면 `renderHome` 이 빈 상태 화면을 그리고 일찍 `return`)과 시작 때 붙는 `addEventListener('click', … setTab('comm'))`(최초 커밋 잔재) 두 벌이 있었다. 측정: 목표 0개 게스트는 누르면 소통 탭으로만 가고 카드 창이 안 열렸다(`onclick` 없음). 목표가 있으면 카드 창 + 소통 탭 이동이 동시에. `#homeChallengeRoomBtn` 의 `onclick` 도 같은 자리라 목표 0개면 죽은 단추였다.
  3. 기록 — `ui.css` `[#TASK-ES-250]` 규칙이 4테마에서 `#screen-records > .screen-head` 를 숨겼고, 그 9일 뒤 #TASK-ES-143(e0cefdc)이 그 숨은 머리줄 안에 `#recStoryCardBtn` 을 만들어 한 번도 보인 적이 없다. ES-250 이후 성소 엔진(`js/sanctuary-v3-engine.js` `renderSanctuaryCalendar`)은 일정 탭의 잠금화면 카드 단추를 자기 머리줄에 새로 만들어 줬지만 기록 탭(`renderSanctuaryRecords`)의 스토리카드는 빠졌다.
- 중심: 보이기/숨기기의 주인은 「홈 구성」 스위치(`js/customize.js` `apply`)다. 테마 CSS 가 같은 요소를 `!important` 로 덮으면 주인이 둘이 된다. 기록 탭의 화면 주인은 성소 엔진의 `#sanctuaryRecordsView` 다.
- 핵심: (홈) 숨김 목록에서 `.home-actions` 만 뺀다 — 다른 레거시 위젯 숨김은 그대로. 처리기는 시작 때 한 벌씩(`#mzShareBtn` = 카드 창만, `#homeChallengeRoomBtn` = 기록 탭). (기록) 성소 기록 화면 모드 줄 바로 아래에 잠금화면 카드 단추와 같은 방식(같은 `btn-ghost` 모양·인라인 `onclick` 으로 `window.openMzShareCardModal`)의 `#sRecStoryCardBtn`.

## 3. [원칙 ③] 해결방식

- `ui.css`: 4테마 숨김 선택자 목록에서 `[data-theme=…] .home-actions` 4줄 삭제(규칙의 `display: none !important;` 줄은 그대로 — 새 `!important` 0). 머리에 사유 주석 1줄.
- `index.html`: `renderHome` 의 `challengeBtn.onclick`·`mzBtn.onclick` 블록을 지우고, 시작 때 도는 자리(`#homeAddGoal` 처리기 바로 아래)의 `#mzShareBtn` 처리기를 `setTab('comm')` → `openMzShareCardModal()` 로 바꾸고, 그 앞에 `challengeBtn.onclick = function(){ setTab('records'); };` 를 옮겨 둔다(smoke-test 가 이 글자를 고정 — 기대값 그대로). 인라인 스크립트 33385 → 33382줄.
- `js/sanctuary-v3-engine.js` `renderSanctuaryRecords`: `modeNav` 를 닫는 줄 끝에 `.s-rec-quick-action-bar` + `#sRecStoryCardBtn` 을 이어 붙인다. 파일은 이미 800줄 초과(1964줄)라 줄 수를 늘리지 않는다(같은 줄 안 수정, 1964 → 1964).
- 대안 비교: (a) 숨김 규칙을 통째로 지우기 — 다른 레거시 위젯(`.home-head-row`·`#todayMissionCard` 등)까지 튀어나옴, 기각. (b) 숨은 `.screen-head` 를 좁혀 `#recStoryCardBtn` 을 살리기 — 그 머리줄은 `#sanctuaryRecordsView` 아래(화면 맨 끝)에 있어 단추가 기록 목록 뒤로 밀림, 기각. (c) 새 세포 파일이 렌더 뒤 단추를 끼워 넣기 — 엔진이 매번 `innerHTML` 을 다시 써서 감시 장치가 필요, 맞물림 길(신호·능력·자리)에 맞는 자리가 정식 목록에 없음(자리 추가는 상민님 결정), 기각. (d) 채택 — 위 셋.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 옛 `#recStoryCardBtn` 마크업은 숨은 머리줄 안에 그대로 남는다(지우는 것은 기능 삭제 판단이라 하지 않음). 기록 탭의 실제 진입은 `#sRecStoryCardBtn`.
- 같은 숨김 규칙의 다른 대상(`#todayGlancePill`·`#todayMissionCard` 등)도 「홈 구성」 스위치가 있지만 보이지 않는다 — 이번 범위 밖(별도 티켓 후보).
- 로그인 사용자 화면·실기기는 재지 않았다. 레이아웃은 PC 자동 브라우저 375·1280 실측까지.
- 기준 커밋에서 기록 탭은 이미 가로 넘침이 있다(`#screen-records` scrollWidth 361/341, `#recQuickDockBar`·`#recThemeFilters`) — 이번 변경과 무관한 기존 상태.

## 5. [원칙 ⑤] 절차

1. 근거 재측정(기준 사본: `git archive` 로 푼 origin/main) → 2. 게스트 시나리오 4개 작성 → 3. 법정 실행기(`court/lib/scenario.js` + `court/lib/static-server.js` + 법정 호스트 이름)로 기준 실패 확인 → 4. 수정 → 5. 시나리오 작업 통과 → 6. 4테마 × 1280·375 실측 → 7. tab-check 홈·기록(기준 2회·작업 1회) → 8. npm test 기준·작업 → 9. module-specs·module-guard·cell-map → 10. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "레거시 위젯이라 숨긴 것이니 다시 보이면 디자인 퇴행이다." → 격파: 숨김 목록의 다른 위젯은 그대로 두고 `.home-actions` 만 뺐다. 이 상자는 이후 홈 재배치(`#screen-home .home-actions { order: 12 }`)가 자리를 잡아 둔 현행 요소이고, 「홈 구성」 화이트리스트(`js/customize.js`)에 두 단추가 사용자 선택 항목으로 올라 있다. 보이기 여부는 사용자가 스위치로 정한다(기본: 자랑하기 켜짐, 확인하기 꺼짐 — 기존 기본값 그대로). 4테마 × 2폭 화면 실측에서 하단 탭에 가리지 않는다.
- 반론 2: "소통 탭 이동 처리기를 지우는 것은 기능 삭제다." → 격파: 단추 이름 「내 성장 자랑하기」·도움말 「인스타·카톡 공유용 고화질 카드」·`title` 「공유용 고화질 성취 카드를 즉시 생성합니다」가 모두 카드 창을 말한다. 소통 탭 이동은 최초 커밋 잔재로, 카드 창과 동시에 일어나 창 뒤 화면을 바꾸는 이중 처리기였다(CELL_SPLIT 6 「처리기는 한 벌」). 소통 탭은 하단 탭으로 그대로 간다. 카드 창 안의 「동반자에게 보내기」·「팀 단체방에 인증」(`js/tabs/comm/story-card-send.js`)이 소통으로 이어지는 길도 그대로다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#mzShareBtn`, `#homeChallengeRoomBtn`, `.home-actions`, `#sRecStoryCardBtn`(새), `#recStoryCardBtn`(옛, 숨은 머리줄), `#sanctuaryRecordsView`, `#sRecModesWrap`, `#modalOverlay`, `#mzStoryCanvasEl`, `#homeLayoutOpenBtn`, `.switch[data-kf1-id="mzShareBtn"]`, `.switch[data-kf1-id="homeChallengeRoomBtn"]`, `#kf1DoneBtn`.
- 함수: `openMzShareCardModal`(index.html, `window.openMzShareCardModal`), `renderHome`(index.html), `renderSanctuaryRecords`(js/sanctuary-v3-engine.js), `apply`·`open`(js/customize.js — 변경 없음).
- 파일: `ui.css`, `index.html`, `js/sanctuary-v3-engine.js`, `reports/TASK-ES-433/**`, `docs/architecture/modules.json`·`module-baseline.json`·`cell-map.json`(생성기 출력).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 `reports/TASK-ES-433/scenario-local.json`·`layout-measure.json`·`test-compare.json`·`tab-compare.json` 을 인용한다.

| 측정 | 방법 | 결과 |
| :-- | :-- | :-- |
| 시나리오 4개 | court/lib/scenario.js 로컬 예비 실행(기준 사본·작업) | 기준: 모두 단추 `visible` 확인 단계에서 실패 · 작업: 4개 통과, 예외 0 |
| 4테마 × 1280·375 | 헤드리스 Chrome, 단추 크기·가운데 점 elementFromPoint·하단 탭 위치·진짜 마우스 클릭 | 16칸 모두 크기>0·적중·하단 탭 위·카드 창 열림·탭 유지 |
| tab-check 홈·기록 | 기준 2회·작업 1회 → tab-compare | 기준끼리 881값 차이 0 · 기준↔작업 차이는 바뀐 칸뿐(홈 높이 +68px·숨은 조작 요소에서 #mzShareBtn 1줄 빠짐·!important 숨김 수 -1, 기록 높이 +52px, 새 단추 2개의 Dead-Click 후보), 설명 안 되는 차이 0, Dead-Click 수 기준과 같음 |
| npm test | 기준·작업 | smoke 443/0 · 무결성 38/38 같음, 둘 다 종료 0 |
