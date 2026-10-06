# 오늘 미션 후속 분열 — 시험지 선행 필요성 좁은 확인

기준: origin/main f91b0979072b48fda91ac9bbd38bc30d530ec22b. 읽기만 수행했다. 제품·시험 변경, 새 TASK 예약, 생성기 실행, UI 촬영, 전체 시험 실행은 없다.

## 결론
현재 소스 읽기 경로 기준으로 computeTodayMissionHash·renderTodayMissionCard 책임 분열을 위해 필요한 시험지 선행 파일 목록은 **빈 목록**이다. 과거 지도 G085의 testIndexOnly에는 5개가 있지만, 직접 관련된 today-mission-card-guide.test.js는 이미 inline-bundle을 읽는다. 최종 분열 후 전체 종료코드 비교가 이 결론을 확인해야 하며, 현재는 실제 생성·시험 전의 읽기 분석이다.

## 현재 함수와 책임
- index.html:5365 computeTodayMissionHash(g): 목표 상태 해시와 관련 최신 기록 ID·시각을 결합한다. window.computeTodayMissionHash 노출은 원래 자리로 보존한다.
- index.html:5375 renderTodayMissionCard(): 활성 목표 필터, 날짜·해시 캐시 판별, 미션 카드/더보기 UI 렌더, 토글 onclick, pending 중복 억제, requestTodayMission 비동기 후 settings.todayMissions 저장·saveProfile·홈 재렌더.
- 실제 호출: js/tabs/home/home-render.js:27(L.renderTodayMissionCard), js/core/date-rollover.js:29(자정 갱신), js/tabs/home/sub-today.js:50~51(있을 때 global 호출). 인라인 자신 재렌더는 toggle 및 비동기 응답 뒤다. localTodayMission/requestTodayMission/computeGoalStatusHash는 기존 세포의 다른 책임이며 함께 옮길 필요가 없다.

## 보이는 UI 경로(소스상 설계, 실측 아님)
#todayMissionCard 슬롯은 js/tabs/home/sub-onescreen.js에서 #homeSheetPanelQuest로 노드째 이동한다. 홈 #homeCompassQuest가 오늘 목표 #homeDetailSheet를 연다. ui.css:5517~5531의 display:none !important는 #screen-home 직접 자식에만 적용되어 이동된 슬롯을 영구 숨기는 규칙이 아니다. .mission-card 자체는 ui.css:569 display:block이다.
활성 목표가 없으면 renderTodayMissionCard가 빈 innerHTML을 쓰므로 실제 추천 목표 '+담기'로 목표를 만들어야 한다. 목표2개 이상이면 #btnToggleMissionAccordion과 #missionRestList 펼침/접기를 실제 누르고 카드·저장값·토스트·오류를 재야 한다. 시험 분석 결과를 UI 도달 성공으로 주장하지 않는다. 함수 직접호출·가짜 상태주입 없이 실제 UI 도달을 최종 단계에서 먼저 측정한다.

## 직접 관련 검사 파일의 현재 읽기 경로
1. tests/ai-conditional-call-optimization.test.js:17 — require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(indexPath,'utf8')). function computeTodayMissionHash·window 노출·캐시/날짜 억제 가드 단언은 그대로 새 세포까지 읽을 수 있다.
2. tests/today-mission-card-guide.test.js:13 — 같은 inline-bundle. mission-card·today-card-guide-hint·문구·renderTodayMissionCard 단언과 CSS 검사는 그대로 유지한다.
3. scripts/smoke-test.js — 소스 글자 APP_SRC는 index+js/tabs 재귀+js/core 합본. 3160~3164/3225~3229의 아코디언·헤더는 html 합본, 8598 및8638의 미션 가드는 APP_SRC를 indexHtml로 사용한다. FN_NAMES에 이 두 함수는 없으며 fnSource:244~246도 inline-bundle 지원이 있다.
4. scripts/verify-all-clicks.js — index 읽기에 더해 allJs가 JS를 합쳐 배선을 검사한다. 오늘 미션 함수 본문만 인라인에 있어야 한다는 고정 검사는 검색되지 않았다. 전역 노출/슬롯 마크업은 원래 자리에 두는 생성 방식이다.

## 지도의 testIndexOnly 5개 대조
- tests/today-mission-card-guide.test.js: 위와 같이 이미 합본이므로 지도 정보가 오래됐다.
- tests/record-ledger-sync.test.js: 현재 실제 html 읽기는 inline-bundle(#TASK-ES-465). 지도 정보가 오래됐다.
- tests/home-customizer-auto-sync.test.js: index 단독 읽기가 맞지만 검사 대상은 todayMissionCard 등 선언적 data-home-widget/슬롯과 customize.js다. 슬롯 마크업은 이동하지 않는다.
- tests/hide-home-debug-cards.test.js: index 단독 읽기가 맞지만 #todayMissionCard 등 ID 슬롯을 검사한다. 미션 함수 본문 이동과 무관하다.
- tests/goals-schedule-sync.test.js: index 단독 읽기가 맞지만 목표/마일스톤 일정 설정·구글 동기화 배선/다른 함수가 검사 대상이다. computeTodayMissionHash/renderTodayMissionCard/mission-card 본문 검사0이므로 이번 책임 이동을 위해 읽기 범위를 넓힐 이유가 없다.

## 보존선과 후속 검증
선행 PR 필요 없음은 현재 읽기 분석 결론이며 판정이 아니다. 최종 분열에서는 원문 토큰/남은 글자/독립 로드·실제 오늘 목표 시트/UI 조작·원격 쓰기 차단·전후 전체 실행 비교를 수행한다. 새 검사 오류가 확인되면 그 검사 파일의 읽는 범위만 넓히는 제품0 선행 PR로 분리하며 기대값·단언·검사 수·폐기0을 유지한다. TASK575 최종 입력 대기는 그대로다.
