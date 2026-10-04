# REQ/PLAN — TASK-ES-367 열 수 없는 테마 선택 창 제거 (노션 SET-09)

> 상위: [UI-COMPONENTS.md](../architecture/UI-COMPONENTS.md) 2-2절 "새로 찾은 결함"(TASK-ES-363, PR #677 빌더 보고).
> 숫자는 `node scripts/module-metrics.js` 와 `docs/design/harness/tab-check.js` 산출이다(손으로 옮긴 수치 없음).

## 승인 원문 (기능 삭제 승인선 — 상민님 결정 완료)

- 상민님(2026-10-04): "결심필요 - 사용자가 열 수 없는 테마 선택 창 권장대로 진행해"
- 권장안 A: 테마 선택 창과 CSS 로 숨겨진 입구를 제거한다. 테마 변경은 설정 탭 테마 카드 4개(`#themeGrid .theme-card`)로 계속 된다.

## 지시 원문(작업 지시서 그대로)

- "입구 두 곳: `#captureLiveMeta` 안의 `#captureLiveTheme`, `#captureThemeQuickBar` 안의 `#btnOpenThemeModal` — ui.css 5824·5955 줄 규칙으로 앱 테마 4종 모두에서 `display:none !important`(헌법 GUARD_02 CSS 은폐 위반)."
- "창: `#themeSelectorModal`, js/theme-system.js 의 `openThemeSelector`/`closeThemeSelector`(PR #677 에서 이름 바꿈), 밖에서 부르는 `themeUI.openModal`."
- "제거 범위는 '사용자가 열 수 없는 테마 선택 창과 그 입구, 그것만 쓰는 CSS·코드'로 한정. theme-system.js 의 체크인 테마 분류 등 다른 기능, 설정 탭 테마 카드, 저장된 테마 정규화는 그대로."
- "법정 화면 주장: 설정 탭 → 테마 카드(화이트)를 눌러 선택되고 화면 테마가 바뀐다(테마 변경 길이 살아 있음 증명), 그리고 index.html 에 display:none !important 로 숨긴 #captureLiveTheme·#btnOpenThemeModal 이 없음(codeNotContains). module-metrics·UI 지표 변화 측정."

## REQ

- 대상 DOM ID(삭제): `#themeSelectorModal`(·`#themeModalTitle`·`#themeModalCloseBtn`·`#tabThemeCustom`·`#tabThemeBrowse`·`#panelThemeCustom`·`#panelThemeBrowse`·`#customThemeInput`·`#customThemeEmojiPicker`·`#customThemeMajorSelect`·`#customThemeFavCheck`·`#btnCreateCustomTheme`·`#themeSearchInput`·`#themeSearchResults`·`#themeTreeContainer`) · 입구 `#captureLiveTheme` · `#captureThemeQuickBar`(그 안에 그려지던 `#btnOpenThemeModal`·`.theme-fav-chip`) · 퀵바 안내 문구 `.theme-guide-microcopy`
- 대상 DOM ID(유지): `#captureLiveMeta`·`#captureCharCount`(글자수 힌트) · `#themeGrid .theme-card`(설정 탭 화면 테마 카드 4종)
- 대상 함수(삭제): `OurgoalThemeSystem.initUI`(js/theme-system.js — 안의 `renderQuickBar`·`openThemeSelector`·`closeThemeSelector`·`renderTree` 와 창 버튼 배선) · index.html 인라인 `updateLiveThemeBadge`·`themeUI` 초기화·`liveTheme.onclick`·입력 중 `suggestTheme` 호출(배지에만 쓰임)
- 대상 함수(유지): `getThemeSettings`·`searchThemes`·`suggestTheme`·`addCustomTheme`·`toggleFavorite`·`buildCheckinThemePayload`·`THEME_ONTOLOGY`(js/theme-system.js) · `applyTheme`(index.html, 저장된 테마 정규화) · `js/tabs/settings/sub-appearance.js` 의 테마 카드 클릭 처리
- 수정 파일: `index.html` · `js/theme-system.js` · `ui.css` · `scripts/smoke-test.js` · `tests/core-modal-es363.test.js` · `docs/architecture/module-baseline.json`(래칫 낮춤) · `docs/architecture/UI-COMPONENTS.md` · `dev_log.md` · `docs/rules/TICKETS.md`

## PLAN — 문제해결 8원칙

## 1. 목표 정의

- [x] 사용자가 어떤 앱 테마에서도 열 수 없는 `#themeSelectorModal` 과 CSS 로 숨긴 입구 두 곳, 그것만 쓰는 코드·CSS 를 지운다. 테마 변경(설정 탭 테마 카드)·체크인 저장·저장된 테마 정규화는 그대로 동작한다.

## 2. 현상 분석

- [x] 기준 커밋 a2c593f: `#captureLiveMeta`(입구 `#captureLiveTheme` 포함)는 ui.css 5824~5827, `#captureThemeQuickBar`(입구 `#btnOpenThemeModal` 포함)는 5955~5958 규칙으로 `[data-theme]` 4종 모두에서 `display:none !important`. `applyTheme` 는 4종 밖 값을 `focus-sanctuary` 로 정규화하므로 입구가 보이는 상태가 없다. `themeUI.openModal` 을 부르는 곳은 index.html `liveTheme.onclick` 한 곳뿐이고(그 요소가 숨어 있음), `OurgoalThemeSystem.initUI` 를 부르는 곳도 index.html 한 곳뿐이다(grep).

## 3. 원인 추정

- [x] 홈 화면 단순화(테마 4종 공통 숨김 규칙) 때 입구만 CSS 로 덮고 창·배선·스타일은 남겼다 — 헌법 GUARD_02 의 CSS 은폐 형태. 창은 살아 있는 코드처럼 보이지만 도달 경로가 없다.

## 4. 대안 탐색

- [x] A) 창·입구·전용 코드·CSS 제거(상민님 승인안). B) 숨김 규칙을 풀어 입구를 되살림 — 상민님이 고르지 않은 안이며 홈 화면 구성이 바뀐다. C) 그대로 둠 — CSS 은폐 위반이 남는다. → **A**. 범위는 창과 입구, 그것만 쓰는 것으로 한정: 같은 숨김 규칙 안의 다른 요소(`#captureLiveMeta` 의 글자수 힌트, `.home-actions` 등)는 손대지 않는다.

## 5. 실행 계획

- [x] index.html: `#captureLiveTheme` span, 퀵바 `#captureThemeQuickBar`·안내 문구, `#themeSelectorModal` 블록(65줄), 인라인 테마 UI 연동 블록(배지·`themeUI`·클릭)을 지우고 저장 경로는 `buildCheckinThemePayload(null)`·`themeConfidence: 0.5` 로 고정(고르는 창이 없어 `selectedCaptureTheme` 는 원래 늘 null 이었다 — 동작 불변).
- [x] js/theme-system.js: `initUI` 와 그 내보내기만 제거(197줄). 분류·데이터 함수는 그대로.
- [x] ui.css: 퀵바·칩·배지·창 전용 규칙(24절 222줄, #TASK-ES-045 시인성 54줄), `.theme-guide-microcopy` 규칙, 4종 숨김 규칙 중 지운 요소 선택자, 안전 영역 규칙의 `.theme-modal-sheet` 선택자 제거.
- [x] 시험: 지운 기능의 존재를 재던 단언 5곳을 "없음" 단언으로 바꾸고 `retire` 에 승인 원문과 사유를 적는다.

## 6. 절차 재검증 및 반론 격파

- [x] 반론 1 — "체크인 테마를 사용자가 고르는 기능이 사라진다." → 기준 커밋에서도 입구 두 곳이 4종 모두 숨어 있어 고를 수 없었다. 저장되는 테마는 지금도 `buildCheckinThemePayload(null)` 결과(일상)와 같다. 프로필의 `themeSettings`(즐겨찾기·커스텀) 데이터는 지우지 않으므로 손실이 없다.
- [x] 반론 2 — "승인안은 '설정 탭 테마 카드로 테마 변경이 계속 된다'인데, 지운 창은 화면 테마가 아니라 체크인 활동 테마(건강·학습…)를 고르는 창이다." → 맞다. 창의 제목은 "🎯 활동 테마 선택"이고 설정 탭 카드는 화면 테마를 바꾼다 — 두 기능은 다르다. 다만 승인 대상은 "사용자가 열 수 없는 테마 선택 창"(`#themeSelectorModal`)으로 특정되어 있고, 그 창은 어느 화면에서도 열 수 없으므로 사용자에게서 빠지는 동작은 없다. 이 차이는 보고서에 따로 적는다. 화면 테마 변경 길은 법정 화면 시나리오로 증명한다.

## 7. 즉시 실행

- [x] 위 5절 그대로 실행. `NODE_PATH=C:/dev/ourgoal-app/node_modules npm test` 443개 통과·0개 실패, `node scripts/module-guard.js --update` 로 래칫 낮춤(theme-system.js 800줄 이하), `node scripts/module-specs.js --write` 실행(신고서 내용 변화 없음).

## 8. 성과 측정

- [x] `module-metrics`(기준 a2c593f → 작업): 미분화 덩어리(index.html 인라인 스크립트) 35905 → 35846 · 800줄 넘는 세포 12 → 11(js/theme-system.js 804 → 606) · index.html 함수 선언 691 → 690 · index.html 38280 → 38152줄 · 전역 직접 연결 282 → 282 · 중복 세포 불변.
- [x] origin/main(24f105b, #678·#679 병합) 을 합친 뒤 다시 잰 값(기준 24f105b → 작업): 미분화 덩어리 35822 → 35763(-59) · 800줄 넘는 세포 11 → 10(js/theme-system.js 빠짐) · index.html 함수 선언 691 → 690 · index.html 38198 → 38070줄 · 전역 직접 연결 282 → 282 · 데이터 중복 16 → 16 · 중복 세포 불변. 모듈 가드 기준선은 합친 뒤 `module-guard --update` 로 다시 낮춤.
- [x] ui.css 17216 → 16921줄.
- [x] `docs/design/harness/tab-check.js home --deadclick off`(테마 4종 × 375×667·375×812 × 상태 3 = 24장, 게스트 시드·Supabase 목, 기준은 a2c593f 스냅샷): 홈 영역 `!important` display:none 요소 장당 43 → 41(24장 합 1020 → 972) · 문서 전체 75 → 73(합 1764 → 1716) · 숨은 조작 요소 장당 46 → 40(합 1144 → 1000, `#btnOpenThemeModal`·`.theme-fav-chip` 5개 빠짐) · 숨김 목록 속 테마 입구 언급 24 → 0 · 44px 미만 요소 240 → 240 · 콘솔 오류 0 → 0.
- [ ] [4단계: 심사 청구] — 판정은 법정(`node court/chat.js <PR>`)만 낸다.
