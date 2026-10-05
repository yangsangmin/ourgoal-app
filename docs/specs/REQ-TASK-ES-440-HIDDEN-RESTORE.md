# REQ — #TASK-ES-440 CSS·인라인 숨김에 갇힌 살아 있는 기능 복원 묶음

- 근거: 코디네이터 지시(2026-10-05) — 숨김 전수 실측(늘 숨은 처리기 요소 558개 · 114묶음, 그중 (A) 「보이는 진입로가 0개인 살아 있는 기능」 7개)에서 갓생 카드(#TASK-ES-433, #748 병합)를 뺀 나머지를 복원한다. 헌법 GUARD_02(CSS 은폐 금지)·제6조(죽은 클릭) 위반 상태 해소. 기능 삭제가 아니라 복원.
- 범위: `ui.css`(4테마 숨김 선택자를 홈 첫 화면으로 좁힘 3곳), `js/tabs/home/sub-onescreen.js`(「🎯 오늘 목표」 시트로 위젯 2개 더 옮김·시트 닫기 대상 2개 추가), `js/sanctuary-v3-engine.js`(성소 기록 화면 모드 줄 둘째 줄), `index.html`(성소 종 단추 `onclick` 한 줄), `reports/TASK-ES-440/**`, 세포지도 재생성.
- 범위 밖(바꾸지 않음): 갓생 카드 단추 2개(#TASK-ES-433), 레벨 배지(#levelBadgeRow)·최근 히트맵 요약(#homeGrassSummaryCard) — 아래 원칙 ④의 모순 보고.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 알림 센터: 보이는 성소 종(#sanctuaryBellBtn)이 존재하지 않는 `openNotifyModal` 을 불러 죽은 클릭. 종이 실제 알림 목록(`openNotificationCenterModal`)을 열게 — 보이는 진입로 1개면 충분, 상단바(#topNotifBtn) 전체 노출은 하지 않음.
2. 보관함(보관한 목표 목록 + 다시 진행하기): 성소 기록 화면에서 보이는 진입로.
3. 성소 위클리 리캡 9:16 카드(PNG 저장·카카오 공유): 보이는 진입로. 같은 숨김 칸의 「성취 통계」는 다른 진입로가 있으니 중복을 만들지 않는다.
4. 앱 평가하기(#btnOpenEvalModal): 전역 숨김 해소.
5. 오늘의 카드(#todayMissionCard): 4테마 숨김 해소 — 홈 구성 스위치로 켜면 보이게.
6. 오늘의 3대 퀘스트(#dailyQuestBarWrap): 4테마 숨김이 「게이미피케이션 모드에서 보임」(ui.css 615)까지 덮던 것 해소.
7. 홈 구성 스위치 9개 중 7개 무효 → 스위치가 실제로 보이기/숨기기를 제어하게(4위 1체). 레벨 배지는 바꾸지 말고 모순 보고.
8. 방법: 숨김 규칙의 원래 의도(성소 홈에서 옛 위젯 중복 제거)는 유지하고 보이는 진입로 하나를 성소 화면 안에 두거나 선택자를 좁힌다. 새 `!important`·CSS 은폐 금지. 기본 홈이 갑자기 복잡해지지 않게 홈 구성 기본값(js/customize.js)은 그대로.
9. 증명: 기능마다 처음부터 게스트 화면 시나리오(법정이 기준·작업 양쪽 실행), 4테마 × 1280·375 실측, sweep 재실행으로 (A) 해소, tab-check 6탭 바뀐 칸 외 차이 0, npm test 같음.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 기능 코드는 살아 있는데 사용자가 닿는 길이 0개다. 「홈 구성」 스위치는 켜져 있다고 보여 주지만 화면이 바뀌지 않는 죽은 설정이고, 보이는 종은 눌러도 아무 일이 없는 죽은 클릭이다.
- 원인(측정, 기준 origin/main eb9e6e4):
  1. 성소 테마 개편(b2b7918)이 옛 홈 위젯을 성소 테마에서만 `display:none !important` 로 숨겼고, #TASK-ES-185/186(dc2bad4·3ecf8f0)이 그 규칙을 4테마(이 앱의 테마 전부)로 복사했다 — `#todayMissionCard`·`#todayGlancePill`(ui.css 「🛑 HIDE CLUNKY LEGACY WIDGETS」), `html[data-theme] (body) #dailyQuestBarWrap`. 그 뒤 홈 원스크린(js/tabs/home/sub-onescreen.js)이 오늘의 카드·평가 배너를 「🎯 오늘 목표」 바텀시트로 옮겼지만 선택자가 위치를 가리지 않아 시트 안에서도 숨었다.
  2. 평가 배너는 #TASK-ES-211/132 의 `#screen-home #homeEvalBanner, #homeEvalBanner, .home-eval-banner-box { display:none !important; height:0 … }` 가 전역으로 숨긴다(기능 내림 결정 기록 없음, js/customize.js CORE_IDS 는 「절대 숨길 수 없는 것」으로 지정).
  3. 성소 종(index.html `#sanctuaryBellBtn`)의 `onclick` 이 어디에도 정의되지 않은 `openNotifyModal` 을 부른다. 실제 함수 `openNotificationCenterModal`(index.html, `window.` 노출)을 부르는 단추는 4테마 공통 숨김 상단바(`.topbar`) 안의 `#topNotifBtn` 하나뿐.
  4. 성소 기록 화면(js/sanctuary-v3-engine.js `renderSanctuaryRecords`)이 #TASK-ES-131(bfa9a6e) 「단일 콕핏 정리」 때 「성취 통계·보관함·위클리 리캡」 단추 3개를 인라인 `display:none !important` 칸에 넣었다. 옛 세그먼트바(`#recSegmentBar`)도 4테마 숨김. 보관함·리캡 화면으로 가는 보이는 길이 없다(「성취 통계」는 「📈 히트맵·통계」 모드가 같은 #recViewStats 를 연다 — 실측 B).
- 중심: 홈 위젯의 보이기/숨기기 주인은 「홈 구성」 스위치(js/customize.js `apply` — 인라인 `style.display` 만 바꿈)다. 테마 CSS 가 같은 요소를 위치와 무관하게 `!important` 로 덮으면 주인이 둘이 되고 CSS 가 늘 이긴다. 기록 탭의 화면 주인은 성소 엔진의 `#sanctuaryRecordsView` 다.
- 핵심: (홈) 숨김 선택자를 `#screen-home > #id`(홈 첫 화면 바로 아래)로 좁혀 원래 의도(성소 홈 첫 화면에서 옛 위젯 제거)는 그대로 두고, 위젯은 이미 있는 「🎯 오늘 목표」 시트에서 보이게 한다 — 첫 화면은 그대로(기본 홈이 복잡해지지 않음). (종) `onclick` 을 있는 함수로. (기록) 숨김 칸의 보관함·위클리 리캡을 모드 줄 둘째 줄의 보이는 단추로.

## 3. [원칙 ③] 해결방식

- `ui.css`
  - 「🛑 HIDE CLUNKY LEGACY WIDGETS」: `[data-theme=X] #todayMissionCard` → `[data-theme=X] #screen-home > #todayMissionCard`, `#todayGlancePill` 도 같게(각 4줄 제자리 수정, 규칙의 `display: none !important;` 줄은 그대로 — 새 `!important` 0).
  - `html[data-theme=X] (body) #dailyQuestBarWrap` 8줄 → `… #screen-home > #dailyQuestBarWrap`.
  - 평가 배너 규칙 선택자 3개(`#screen-home #homeEvalBanner, #homeEvalBanner, .home-eval-banner-box`) → `#screen-home > #homeEvalBanner` 하나.
  - 각 규칙 옆에 사유 주석 1줄.
- `js/tabs/home/sub-onescreen.js` `build`: 「🎯 오늘 목표」 시트(#homeSheetPanelQuest)에 노드째 옮기는 목록에 `#todayGlancePill`(맨 위)·`#dailyQuestBarWrap`(오늘의 카드 다음) 추가 — 순서: 오늘 몰입 요약 → 오늘의 카드 → 3대 퀘스트 → 목표 → 평가 배너. `wire`: 시트 안에서 체크인 입력·다른 탭으로 보내는 요소를 누르면 시트를 먼저 닫는 목록에 `#todayGlancePill`·`.daily-quest-item` 추가(체크인 입력이 시트 뒤에 가려지지 않게).
- `js/sanctuary-v3-engine.js` `renderSanctuaryRecords`: 모드 줄(#sRecModesWrap) 인라인 `display:flex` → `display:grid; grid-template-columns:repeat(3,minmax(min-content,1fr))`(윗줄 3개 모양은 기준과 같고, CSS 의 「3×2 그리드」 설계와 맞음). 둘째 줄 `#sRecSubModes` 에 `#sRecArchiveBtn`(🗂️ 보관함)·`#sRecRecapBtn`(🎬 위클리 리캡 카드) — 같은 `.s-rec-mode-btn` 모양(4테마 스타일 재사용)·활성 표시. 숨김 칸에는 「성취 통계」 하나만 남김(줄 수 716 → 718).
- `index.html` 158행 `#sanctuaryBellBtn` `onclick`: `openNotifyModal` → `window.openNotificationCenterModal`(한 줄, 인라인 스크립트 줄 수 변화 0).
- 대안 비교: (a) 숨김 규칙을 통째로 지우기 — 오늘의 카드·퀘스트·요약이 홈 첫 화면(원스크린 콕핏)에 튀어나와 기본 홈이 길어짐, 기각. (b) 상단바(#topNotifBtn) 노출 — 성소 상단 바와 이중, 지시가 [기본값]으로 배제. (c) 숨김 칸 3개를 모두 꺼내기 — 「성취 통계」가 「📈 히트맵·통계」와 같은 화면이라 중복, 기각. 숨김 칸 통째 삭제 — `scripts/smoke-test.js` [#TASK-ES-193] 시험이 `setRecMode('stats')` 글자를 요구(기대값 낮추기 금지), 기각. (d) 새 세포 파일이 시트 조립 뒤 위젯을 옮기기 — 이미 시트 조립 주인(sub-onescreen.js)이 있어 같은 일을 두 곳에서 하게 됨, 기각. (e) 채택 — 위 4파일.

## 4. [원칙 ④] 재검토 — 한계와 모순(정직하게)

- 목표가 0개인 게스트는 「오늘 몰입 요약」·「3대 퀘스트」가 그려지지 않는다: `renderHome` 이 목표 0개면 일찍 `return` 해서 `renderTodayGlancePill`·`renderDailyQuestBar` 까지 가지 않고, 홈 소블록(sub-quest.js)이 부르는 `global.renderDailyQuestBar` 는 전역이 아니다(실측 `typeof` undefined). 오늘의 카드도 목표가 있어야 내용이 생긴다(`renderTodayMissionCard`). 그래서 시나리오는 시트의 시작 목표(👟)를 하나 만든 뒤 잰다. 목표 0개 화면에서 위젯을 그리는 것은 이번 범위 밖(인라인 렌더러 수정 → 인라인 분열 빌더와 충돌).
- **레벨 배지 모순(바꾸지 않음)**: #TASK-ES-140(b5e6655, 상민님 지시 2026-10-02 「아바타 레벨표시 제거」)이 `#levelBadgeRow` 를 4테마 숨김 목록에 둔 기록이 있는데, js/customize.js 는 같은 요소를 `fixed: true`·CORE_IDS(「상단 고정 · 절대 숨길 수 없음」)로 표시한다. 설정의 스위치는 잠금 표시로 「켜짐」인데 화면에는 없다. [기본값] 화면은 그대로 두고 보고한다 — 결정 후보: (1) 홈 구성 목록에서 레벨 배지 줄을 「아바타 카드에 포함」으로 바꿔 적기, (2) 레벨 배지 다시 보이기.
- **최근 히트맵 요약 모순(바꾸지 않음)**: 지시 7의 「히트맵 요약(0×0)」은 CSS 가 아니라 렌더러(`renderHomeGrassSummary`)가 첫 줄에서 `display='none'; innerHTML=''; return` 하는 의도적 비활성(#TASK-ES-139, TICKETS 「홈 히트맵 제거」 — 상민님 직접 지시 2026-10-02) + index.html 인라인 `display:none !important` + ui.css `#homeGrassSummaryCard { display:none !important }`(ES-139) 세 겹이다. 되살리면 상민님 결정을 뒤집게 되어 손대지 않았다. 스위치는 계속 무효 — 결정 후보: (1) 홈 구성 목록에서 이 줄 빼기(설정 항목 삭제라 승인선 ③ 검토), (2) 히트맵 요약 되살리기.
- 같은 숨김 칸의 「성취 통계」 단추는 숨은 채로 남는다(B — 보이는 다른 진입로 「📈 히트맵·통계」).
- 위클리 리캡 카드 화면(js/sanctuary-weekly-recap.js, 이번에 안 바꿈)은 연속 기록이 없으면 `|| 3` 으로 「3일 연속 스트릭」, 레벨을 「Lv.1」 고정으로 그린다 — 진입로를 되살리며 드러난 기존 표시 문제(허상 지표 의심). 이번 범위 밖, 후속 티켓 후보로 보고.
- 기준 커밋에서도 375px 기록 탭 윗줄 3번째 단추(「📝 실천 타임라인」)가 오른쪽으로 넘친다(#screen-records scrollWidth > clientWidth) — 이번 변경 전부터 있던 상태, 윗줄 모양은 그대로.
- 로그인 사용자 화면·실기기는 재지 않았다. 레이아웃은 PC 자동 브라우저 375·1280 실측까지.

## 5. [원칙 ⑤] 절차

1. 근거 재측정(origin/main 분리 worktree) → 2. 게스트 시나리오 8개 → 3. 법정 실행기(`court/lib/scenario.js` + `court/lib/static-server.js` + 법정 호스트 이름)로 기준 실패 확인 → 4. 수정 → 5. 시나리오 작업 통과 → 6. 4테마 × 1280·375 실측 → 7. sweep 재실행(기준·작업) → 8. tab-check 6탭(기준 2회·작업 1회) → 9. npm test 기준·작업 → 10. module-specs·module-guard·cell-map → 11. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "성소 디자인이 일부러 숨긴 옛 위젯을 다시 보이면 디자인 퇴행이다." → 격파: 홈 첫 화면에서는 그대로 숨는다(선택자를 `#screen-home > #id` 로 좁혔을 뿐, 4테마 × 375·1280 홈 첫 화면 캡처·tab-check 홈 기본 상태 차이로 확인). 보이는 곳은 홈 원스크린이 이미 「상세는 시트로」라고 정한 「🎯 오늘 목표」 바텀시트 안이다. 보이기 여부는 사용자가 「홈 구성」 스위치로 정한다(기본값은 js/customize.js 그대로 — 바꾸지 않음).
- 반론 2: "숨김 칸에서 보관함·리캡을 꺼내면 #TASK-ES-131 「단일 콕핏」 결정을 뒤집는 것이다." → 격파: ES-131 은 같은 일을 하는 3중 분산을 없애려 했고, 보관함·리캡은 다른 진입로가 없는 유일한 화면이다(실측 A). 같은 화면을 여는 「성취 통계」는 숨김 칸에 그대로 두어 중복을 만들지 않았다. 목표 상세의 「📦 보관」은 「기록으로 옮겼어요」라며 기록 탭으로 보내는데 거기서 보관한 목표를 볼 곳이 없었다 — 되살릴 곳(「다시 진행하기」)이 사라진 상태가 결함이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#sanctuaryBellBtn`, `#topNotifBtn`(옛, 숨은 상단바), `#modalOverlay`, `#homeCompassQuest`, `#homeDetailSheet`, `#homeSheetPanelQuest`, `#homeDetailClose`, `#todayGlancePill`, `#todayMissionCard`, `#dailyQuestBarWrap`, `#questItemMilestone`, `.daily-quest-item`, `#homeEvalBanner`, `#btnOpenEvalModal`, `#appEvaluationModal`, `.starter-goal-btn[data-starter="workout"]`, `#homeLayoutOpenBtn`, `.switch[data-kf1-id="todayMissionCard"]`, `.switch[data-kf1-id="todayGlancePill"]`, `#kf1DoneBtn`, `#sRecModesWrap`, `#sRecSubModes`(새), `#sRecArchiveBtn`(새), `#sRecRecapBtn`(새), `#sanctuaryRecordsView`, `#sRecapCanvasMock`, `.s-recap-actions`, `#levelBadgeRow`·`#homeGrassSummaryCard`(변경 없음).
- 함수: `openNotificationCenterModal`(index.html), `OurgoalHomeOneScreen.build`·`wire`(js/tabs/home/sub-onescreen.js), `renderSanctuaryRecords`·`setRecMode`(js/sanctuary-v3-engine.js), `renderSanctuaryRecordsArchive`(js/sanctuary-record-feed.js, 변경 없음), `renderSanctuaryRecordsRecap`(js/sanctuary-weekly-recap.js, 변경 없음), `openAppEvaluationModal`·`renderTodayMissionCard`·`renderDailyQuestBar`·`renderTodayGlancePill`·`renderHomeGrassSummary`(index.html, 변경 없음), `apply`(js/customize.js, 변경 없음).
- 파일: `ui.css`, `js/tabs/home/sub-onescreen.js`, `js/sanctuary-v3-engine.js`, `index.html`, `reports/TASK-ES-440/**`, `docs/architecture/cell-map.json`(생성기 출력).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

측정 시점: 4테마 실측·sweep·tab-check 는 origin/main eb9e6e4(ES-433 병합 뒤) 기준으로 쟀고, 그 뒤 main(인라인 분열 #749~#759 — 이 작업 파일과 겹침 없음)을 합친 판에서 시나리오 8개·npm test·세포 검사를 다시 쟀다(기준 3232cc2).

수치는 `reports/TASK-ES-440/scenario-local.json`·`layout-measure.json`·`sweep-compare.json`·`tab-compare.json`·`test-compare.json`·`constraints.json` 을 인용한다.

| 측정 | 방법 | 결과 파일 |
| :-- | :-- | :-- |
| 시나리오 8개 | court/lib/scenario.js 로컬 예비 실행(기준 worktree·작업) | scenario-local.json |
| 4테마 × 1280·375 | 헤드리스 Chrome, 진입로 8곳 크기·가운데 점 elementFromPoint·하단 탭·진짜 마우스 클릭 | layout-measure.json |
| 숨김 전수(sweep) | scratchpad hidden-sweep/sweep.js 4테마 × 6탭 × 17상태, 기준·작업 | sweep-compare.json |
| tab-check 6탭 | 기준 2회·작업 1회 → tab-compare | tab-compare.json |
| npm test | 기준·작업 | test-compare.json |
| 새 `!important`·숨김 패턴 | git diff -U0 추가 줄 | constraints.json |
