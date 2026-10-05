# REQ/PLAN — TASK-ES-401 통계 세포 쪼개기 2차 (js/universal-stats.js 5,171줄 → 3,283줄 + 세포 4개)

> 근거: 코디네이터 지시(2026-10-05) — 1차 #712(TASK-ES-392)·시험지 선행 #707(TASK-ES-393)과 같은 위치 규칙·같은 키트 방식으로 남은 책임 묶음을 더 떼어 낸다. 목표 원본 800줄 이하, 못 하면 이번 PR 은 3~4묶음 + 남은 범위 보고. 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 새 파일 각 800줄 이하, part1/part2 금지.
> 틀: `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 선례 `docs/specs/REQ-TASK-ES-392-STATS-SPLIT.md`.

## REQ
- 대상 파일: `js/universal-stats.js`(1차 이음매를 늘림·묶음 삭제), `js/stats-metrics.js`·`js/stats-charts.js`·`js/stats-import.js`·`js/stats-data-menu.js`(신규), `index.html`(script 태그 4개, 1차 태그와 같은 줄), `docs/architecture/modules.json`·`module-baseline.json`
- 대상 함수(옮김, 글자 그대로):
  - `ensureMetricConfig`·`extractMetricsFromRecord`·`discoverActiveMetrics`·`aggregateMetricTimeSeries` → `js/stats-metrics.js`(708줄)
  - `renderUniversalSvgChart`·`aggregateMultiSeries`·`calcNiceStep`·`renderMultiSeriesSvg` → `js/stats-charts.js`(570줄)
  - `normalizeHistoricalDate`·`parseCsvToUniversalRecords`·`openUniversalImportModal` → `js/stats-import.js`(524줄)
  - `openGuideModal`·`openDataManagementModal` → `js/stats-data-menu.js`(217줄)
- 통로: 1차 키트 `window.OurgoalUniversalStatsKit` 그대로(전역 이름 증가 0). `OurgoalUniversalStatsKit.scope` getter 7개 → 15개(이번에 더한 8개: `METRIC_CONFIGS`·`SAMPLE_THEMES`·`captureChartSnapshot`·`dateKey`·`generate1920sOlympicStrengthSample`·`generate52WeekPowerliftingSample`·`generateDomainSample`·`pad` — 스코프 분석으로 뽑음, setter 0)
- 대상 DOM ID(옮긴 코드가 그리는 것, 그대로): `#uMenuImportBtn`·`#uMenuGridBtn`·`#uMenuTaxonomyBtn`·`#uMenuExportCsvBtn`·`#uMenuSnapBtn`·`#uGuideCloseBtn`·`#uImpTabSamples`·`#uImpTabCsv`·`#uImpTabText`·`#uImpTextInput`·`#uImpCsvFileInput`·`#uImpApplyBtn`·`#uImpCancelBtn`·`#uSampleThemeTabRow`·`#uSampleCardContainer`·`#uPurgeSampleBtn`. 원본에 남은 진입점: `#uHdrMgmtMenuBtn`·`#uHdrImportBtn`·index.html 위임 `#recImportBannerBtn, [data-uimport], #uQuickImportBtn`
- 도구: `docs/design/harness/module-split/gen-stats-split-2.js`(생성기)·`verify-stats-split-2.js`(토큰·누수·실행·순수 함수 결과)·`dom-compare-stats-2.js`(게스트 조작 DOM 비교)·`real-account-stats-2.js`(로그인 상태 읽기 전용 비교)·`test-compare-stats-2.js`(npm test·tests 전후 비교)

## 1. [원칙 ①] 목표 정의
`js/universal-stats.js` 를 책임 단위 세포로 나누는 2차. 이번 PR 은 묶음 4개(메트릭 추출·집계, SVG 차트, 데이터 가져오기, 데이터 관리 메뉴·가이드 — 함수 13개)를 `js/stats-*.js` 로 동작 그대로 옮긴다. `window.OurgoalUniversalStats` 키 37개·순서, `window.*` 이름(1차 키트 말고 새 이름 0), 호출 순서, 화면·저장값이 이전과 같아야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 1차 뒤에도 5,171줄 한 IIFE 에 메트릭 엔진·샘플 생성·차트·가져오기·대시보드가 섞여 있다(모듈 가드 ④ 800줄 초과 파일 중 2번째).
- 원인(측정, babel 최상위 문 지도): 원본 800줄 이하는 이번에 불가 — 800줄을 넘는 단일 함수 2개(`generateDomainSample` 970줄·`renderUniversalStatsDashboard` 884줄 = 1,854줄)는 함수째 옮기면 새 파일도 800줄을 넘고, 함수 안 섹션 분할은 지역 변수 공유 경계 조건(틀 2절)을 먼저 따져야 한다. 그래서 지시대로 4묶음.
- 중심: 1차 이음매(키트 가져오기 + scope getter)를 하나 더 만들지 않고 늘린다 — require 줄·가져오기 줄·getter 목록에 더할 뿐이다.
- 핵심: 손으로 옮기지 않는다. 생성기가 글자 그대로 옮기고 이름 참조만 `S.`(원본 스코프)·`K.`(다른 통계 세포 함수 — 이번 것과 1차에 옮긴 것) 로 바꾼다. 상태·상수(`METRIC_CONFIGS`·`SAMPLE_THEMES`·`DOMAINS`·`RAW_52W_POWERLIFTING_DATA`·`METRIC_DIFFERENTIATED_MODELS`)는 하나도 옮기지 않는다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 묶음 고르기(원본 섹션 주석 경계와 같음): 「1~3. 메트릭 추출·탐색·시계열 집계」, 「4. 다형성 SVG 차트」+「5-4. 7-Tier 정밀 시계열 집계 엔진」, 「5-0. 과거 일자 정규화」+「5-2. CSV 인제스터」+ 가져오기 모달, 「7. 활용 가이드 모달」+「9-B. 데이터 관리 통합 모달」.
- [기본값] 위치 `js/` 바로 아래 `js/stats-*.js`(1차와 같은 이유 — `js/tabs/**`·`js/core/*` 는 앱 합본 단언에 새로 걸리고, `js/<폴더>/` 는 `verify-all-clicks.js` 범위 밖).
- [기본값] 묶음 4개(지시 범위 3~4의 위쪽): 4묶음 합계 1,917줄이 원본에서 빠진다. `captureChartSnapshot`·`exportCleanCsv`(섹션 6)는 대시보드·그리드도 쓰는 공용이라 원본에 남겨 통로로 읽는다.
- 생성기 블록 규칙(1차와 같음) + 하나 더: 같은 파일로 가는 두 함수 사이에 1차 안내 주석(`[#TASK-ES-392]`)이 있으면 블록을 끊는다 — 1차 안내 주석은 원본에 그대로 남는다.
- 원본 이음매(1차 것을 늘림): require 줄에 새 파일 4개를 1차 3개 뒤에, `var <함수> = _statsKit.<함수>;` 13줄을 1차 9줄 뒤에, getter 목록 = 1차 7개 ∪ 이번 8개(이름순). 1차 이음매 주석 아래에 2차 한 줄.
- index.html: 1차 태그 3개 뒤·원본 태그 바로 앞, 같은 줄에 새 태그 4개(`?v=20261005-es401`). 원본 태그·버전 글자는 그대로(시험이 고정), index.html 순증가 0줄.
- 시험지: #707 통계 합본이 `stats-` 로 시작하고 `OurgoalUniversalStatsKit` 표식이 있는 js/ 바로 아래 파일을 모두 읽으므로 이번에는 시험지 선행 PR 이 필요 없었다(시험지 수정 0, 기대값 변경 0).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 줄 수로 자르기(part1/part2): 금지.
- B `generateDomainSample`·`renderUniversalStatsDashboard` 를 이번에 함수 안 섹션으로 나누기: 원본 800줄 이하에 꼭 필요하지만, 대시보드 함수는 지역 변수(`container`·`state`·`callbacks`·필터 상태)를 섹션끼리 공유해 틀 2절 경계 조건 검사기가 먼저 필요하다 — 3차로 미룬다(10절).
- C 상수(`METRIC_CONFIGS`·`SAMPLE_THEMES`)까지 옮기기: 시험이 `require` 캐시를 비우고 다시 읽을 때 원본 쪽 새 상수와 부품 쪽 옛 상수가 갈라질 수 있다 — getter 통로로 원본에 남긴다(1차 D 와 같음).
- D 새 키트를 하나 더 만들기: 전역 이름 증가 — 1차 키트를 같이 쓴다.
- 선택: 함수 단위 4묶음 + 1차 이음매 늘리기.

## 5. [원칙 ⑤] 절차
1) 기준 = origin/main `git archive`(토큰·화면 비교용) + `git worktree --detach`(git 을 읽는 시험 줄 대조용) → 2) 생성기 → 3) `verify-stats-split-2.js` → 4) `module-specs --write`(kind hybrid·role·spans 손 칸) · `module-guard --update` → 5) `test-compare-stats-2.js`(npm test·tests 100개) → 6) `tab-check.js` 기록·목표 기준 2회·후 1회 → 7) `dom-compare-stats-2.js` 기준 2회·후 1회 → 8) `real-account-stats-2.js` 기준 2회·후 1회 → 9) claims·기록 → 10) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "통로로 부르는 원본 함수(`S.pad(n)`·`S.generateDomainSample(k)` …)는 `this` 가 S 가 된다" → `verify-stats-split-2.js` 가 getter 로 노출한 원본 함수 11개 본문 최상위의 `this`·`arguments` 를 세어 0 을 확인한다(`bridgeThis`). 옮긴 함수 최상위 `this` 는 생성기가 막는다(0개).
- 반론② "`ensureMetricConfig` 는 `METRIC_CONFIGS` 를 고친다 — 부품이 다른 객체를 고치면 대시보드가 새 지표를 못 본다" → 부품은 `S.METRIC_CONFIGS` getter 로 원본 IIFE 의 바로 그 객체를 읽고 속성만 고친다(이름 재대입 0 — 생성기가 대입을 만나면 멈춘다). `verify-stats-split-2.js` ④ 가 등록 뒤 `Object.keys(OurgoalUniversalStats.METRIC_CONFIGS).length` 까지 이전 전과 같은지 맞대고, 게스트 조작 비교가 텍스트 붙여넣기·융합 뒤 화면을 맞댄다.
- 반론③ "브라우저 순서와 Node require 순서가 다르다" → 브라우저: 새 태그가 원본 태그 바로 앞(같은 줄). Node: 원본 머리 require 줄. `verify-stats-split-2.js` ③ 이 브라우저 순서(1차 부품 3 → 2차 부품 4 → 원본)로 vm 실행, smoke #TASK-ES-060 경로는 #707 이 부품 이름순 → 원본으로 돌린다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/universal-stats.js` 5,171 → 3,283줄. 새 세포 4개(708·570·524·217줄, 모두 800줄 이하). 생성기 이름 바꿈 41곳(`S.` — 원본 이름 10개, `K.` — `openUniversalImportModal`·`openUniversalDataGrid`·`openTaxonomyManagerModal`).
- 1차 부품 3개 글자 변경 0. 기능 추가·삭제 0, 버그 수정 0(옮기기만).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-401/`:
- `verify-stats-split-2.json`: 함수 13개 토큰열 동일(`S.`·`K.` 접두 제외), 1차 부품 글자 동일, 누수 0, 미노출 0, 안 쓰는 노출 0, 원본에 남은 정의 0, 통로 함수 `this`·`arguments` 0, API 키 37개·순서 동일, `window` 이름 동일(새 이름 0), 순수 함수 10가지 호출(난수·시각 고정, 샘플·온톨로지도 맞댐) 결과 동일, 부품 `잔디` 0.
- `test-compare.json`: npm test 기준 대 후 같은 수치(smoke·무결성·버튼·셀·모듈 가드 — 값은 파일), smoke 제목 동일, tests 100개 종료 코드·정규화 출력 같음(기준에서도 실패하던 28개 그대로 — 기존, 미수정).
- 막히는 지점: 금고 `scripts/verify-integrity-gate.js` 의 `잔디` 부재 검사는 원본 한 파일만 본다 — 부품은 `verify-stats-split-2.js` 가 잰다. `tab-check.js` 는 앱 사본에 .git 이 없으면 `fatal: not a git repository` 한 줄을 찍는다(기준·후 같음, 측정값 아님).

## 9. 화면 측정
- `tab-check.js` 기록·목표 기준(git archive) 2회·후 1회 → `tab-compare-base1-base2.json`·`tab-compare-base1-after.json`.
- `dom-compare-stats-2.js` 게스트 조작 40단계(1차 24단계 + 데이터 관리 메뉴 → 가져오기 모달 → 테마 탭·샘플 카드·CSV/텍스트 탭·텍스트 붙여넣기·융합 → 렌즈 → 1초 샘플 로드 → 활용 가이드(공개 API, 화면 버튼은 #TASK-ES-126 에서 빠짐)·닫기 → 탭 왕복), 단계마다 9칸 = 360칸 → `dom-compare-stats-2.json`. 난수는 같은 씨앗으로 고정, 화면 글자 시:분(`>HH:MM<`)은 지움(기준 2회에서 4칸 실측한 본질 변동).
- main(#711·#713·#714·#715·#716) 합친 뒤 다시 잼: `js/universal-stats.js`·`js/stats-*.js` 는 main 에서 안 바뀜. 기준선은 main 판을 받고 `module-specs --write`·`module-guard --update` 로 다시 만듦(④ 8). 그 기준(main git archive·detach 트리) 대 합친 트리: `verify-stats-split-2-main.json`·`test-compare-main.json`(tests 103개)·`dom-compare-stats-2-main.json`. tab-check·로그인 비교는 합치기 전 기준에서만 쟀다.
- 로그인 상태: `real-account-stats-2.js` — 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A, 읽기 전용 13단계(융합·샘플 로드·저장 안 누름) 단계마다 화면·모달 정규화 HTML sha256·바이트 → `real-account-stats.json`(주소·계정·기록 내용 미기록).

## 10. 남은 범위 (3차 이후, `js/universal-stats.js` 3,283줄)
- 800줄 넘는 함수 2개 — 함수 안 섹션 분할 필요(틀 2절 경계 조건 검사 먼저): `generateDomainSample` 970줄(도메인별 샘플 섹션 — 지역 변수 공유가 적어 먼저 할 만함), `renderUniversalStatsDashboard` 884줄(헤더·렌즈·차트·KPI·진단 섹션).
- 함수 단위로 뗄 수 있는 묶음: 전체화면 `openStatsFullscreenModal`(197) · 차등 분석 `computeDifferentiatedAnalysis`·`renderDifferentiatedReportCard`·`openDifferentiatedMetricConfigModal`(약 140, 모델 상수 179줄은 원본 또는 데이터 세포) · 온톨로지 `getChosung`·`matchQuery`·`inferDomainKey`·`buildUniversalOntology`(185 — 1차 부품이 `S.` 로 읽는 이름이라 옮기면 1차 부품의 접두를 `K.` 로 바꾸거나 getter 를 유지) · 과거 샘플 `generate52WeekPowerliftingSample`·`generate1920sOlympicStrengthSample`(+ 원시 데이터 1줄) · 내보내기 `exportCleanCsv`·`captureChartSnapshot` · 카탈로그 상수 `METRIC_CONFIGS`(227)·`SAMPLE_THEMES`·`THEME_METRIC_SPECS`·`DOMAINS`(데이터 세포 후보).
- 위를 다 떼도 두 큰 함수(1,854줄)가 남으므로 원본 800줄 이하는 섹션 분할이 끝나야 닿는다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
