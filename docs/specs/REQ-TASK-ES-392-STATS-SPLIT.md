# REQ/PLAN — TASK-ES-392 통계 세포 쪼개기 1차 (js/universal-stats.js 6,092줄 → 5,171줄 + 세포 3개)

> 근거: 코디네이터 지시(2026-10-05) — 지금 가장 큰 세포 `js/universal-stats.js`(6,092줄)를 책임 단위로 나눈다. 각 800줄 이하, part1/part2 금지, 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0. 이번 PR 은 2~3 묶음만 떼고 남은 범위를 보고한다.
> 선행: #707(TASK-ES-393, 시험지가 「통계 합본」을 읽음 — 법정 판정 통과 DBE05E05). 틀: `docs/specs/MODULE-SPLIT-PROTOCOL.md`, 선례 #701(ES-382)·#705(ES-387) 팀 세포.

## REQ
- 대상 파일: `js/universal-stats.js`(원본, 이음매 추가·묶음 삭제), `js/stats-taxonomy.js`·`js/stats-data-grid.js`·`js/stats-lenses.js`(신규), `index.html`(script 태그 3개, 같은 줄), `docs/architecture/modules.json`·`module-baseline.json`
- 대상 함수(옮김, 글자 그대로): `openTaxonomyManagerModal` → `js/stats-taxonomy.js` / `openUniversalDataGrid`·`openRowEditModal` → `js/stats-data-grid.js` / `computeCrossRatioSeries`·`renderCrossRatioSvg`·`renderRadarSvg`·`computeCadenceData`·`renderCadenceSvg`·`generateStatisticalDiagnosticReport` → `js/stats-lenses.js`
- 통로: 전역 `window.OurgoalUniversalStatsKit` 1개(키트). `OurgoalUniversalStatsKit.scope` getter 7개 — `DOMAINS`·`askConfirm`·`buildUniversalOntology`·`exportCleanCsv`·`getChosung`·`inferDomainKey`·`matchQuery`(스코프 분석으로 뽑음, setter 0 — 옮긴 코드가 원본 이름에 대입하는 곳 0)
- 대상 DOM ID(옮긴 코드가 그리는 것, 그대로): `#uGridModalContainer`·`#uGridSearchInp`·`#uGridSelectAll`·`#uGridAddRowBtn`·`#uGridBulkDelBtn`·`#uGridExportCleanBtn`·`#uGridLoadMoreBtn`·`#uEditRowSaveBtn`·`#uTaxModalContainer`·`#uTaxSearchInput`·`#uTaxAddSchemaBtn`·`#uTaxNewName`. 원본에 남은 진입점: `#uHdrGridBtn`·`#uHdrMgmtMenuBtn`·`#uMenuGridBtn`·`#uMenuTaxonomyBtn`·`.u-lens-btn[data-lens]`
- 도구: `docs/design/harness/module-split/gen-stats-split.js`(생성기)·`verify-stats-split.js`(토큰·누수·실행 검사)·`dom-compare-stats.js`(조작 DOM 비교)

## 1. [원칙 ①] 목표 정의
`js/universal-stats.js` 를 책임 단위 세포로 나누는 1차. 이번 PR 은 묶음 3개(스키마 편집·데이터 그리드·분석 렌즈, 함수 9개 921줄)를 `js/stats-*.js` 로 동작 그대로 옮긴다. `window.OurgoalUniversalStats` 키 37개·순서, `window.*` 이름(키트 1개 추가 말고), 호출 순서, 화면·저장값이 이전과 같아야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 6,092줄 한 IIFE 에 데이터 가공·샘플 생성·차트·모달·대시보드가 섞여, 고칠 때 영향 범위를 볼 수 없다(모듈 가드 ④ 800줄 초과 파일 9개 중 가장 큼).
- 원인(측정, babel 최상위 문 지도): 800줄을 넘는 함수 2개(`generateDomainSample` 970줄·`renderUniversalStatsDashboard` 884줄) — 이 둘은 함수 안 섹션 분할이 필요해 1차에서 뺀다. 나머지는 함수 단위로 경계가 선다.
- 중심: 옮긴 코드가 원본 스코프 이름을 읽는 길을 하나로(키트 통로 getter) 두고, 원본은 IIFE 맨 위에서 같은 이름으로 가져온다 — 함수 선언 끌어올림과 같은 효과라 호출 순서가 그대로다.
- 핵심: 손으로 옮기지 않는다. 생성기가 글자 그대로 옮기고 이름 참조만 `S.`·`K.` 로 바꾼다. 상태 변수(var)는 하나도 옮기지 않는다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- 묶음 고르기(스코프 분석 `refs` — 원본 이름 의존 수): 분석 렌즈 6개는 원본 이름 의존 0(순수 함수), 그리드 2개는 `getChosung`·`exportCleanCsv`·`askConfirm`·`inferDomainKey`, 스키마 편집 1개는 `buildUniversalOntology`·`matchQuery`·`DOMAINS`·`askConfirm`. 원본 섹션 주석(「8. 패싯 온톨로지 탐색기 & 스키마 CRUD 모달」·「9. 도메인 중립 엔터프라이즈 데이터 그리드 모달」·「5-4-B. 4대 다차원 분석 렌즈 엔진」)과 같은 경계.
- [기본값] 위치 `js/` 바로 아래 `js/stats-*.js`: `js/tabs/**`·`js/core/*` 는 앱 합본 단언(#TASK-ES-155 `showToast(` 없음 등)에 새로 걸리고, `js/<폴더>/` 는 `verify-all-clicks.js` 핸들러 소스 밖이 된다. 팀 세포(`js/team-*.js`)와 같은 자리. `js/records-stats.js` 와 겹치지 않게 `stats-` 로 시작.
- [기본값] 묶음 수 3: 지시 범위(2~3)의 위쪽 — 세 묶음 모두 원본 이름 의존이 4개 이하이고 원본 섹션 경계와 같다.
- 원본 머리 이음매(`'use strict';` 바로 다음): `var _statsKit = root.OurgoalUniversalStatsKit;` → Node 에서는 `require('./stats-taxonomy.js')`·`stats-data-grid.js`·`stats-lenses.js` → `var <함수> = _statsKit.<함수>;` 9줄 → `Object.defineProperties(_statsKit.scope …, { get <이름>(){ return <이름>; } })` 7개.
- 새 파일 꼴: `(function(root){ 'use strict'; var K = root.OurgoalUniversalStatsKit = … || {}; var S = K.scope = K.scope || {}; <옮긴 글자> K.<함수> = <함수>; module.exports = K; })(typeof window !== 'undefined' ? window : global);` — 인자 이름 `root`·실행 대상 식은 원본과 같다.
- index.html: 원본 태그 `<script src="js/universal-stats.js?v=20260914-es061d"></script>` 바로 앞, 같은 줄에 새 태그 3개(원본 태그·버전 글자는 그대로 — 시험이 고정, index.html 순증가 0줄).
- 원본 `api` 객체·`.diff-cfg-open-btn` 전역 클릭 위임·`module.exports`·`root.OurgoalUniversalStats = api` 는 그대로 원본 자리.

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 줄 수로 자르기(part1/part2): 금지(지시·틀 0절 2).
- B 큰 함수 2개(`generateDomainSample`·`renderUniversalStatsDashboard`)부터: 함수 안 섹션이 지역 변수를 공유해 섹션 경계 조건(틀 2절)을 먼저 따져야 한다 — 2차로 미룬다(남은 범위 10절).
- C 옮긴 함수를 `window` 에 새로 단다: 전역 이름 증가 금지(틀 0절 4). 키트 하나로.
- D 상태·상수(`DOMAINS` 등)도 함께 옮긴다: 원본을 다시 읽을 때(시험의 require 캐시 비우기) 상태가 새로 시작되는 동작이 바뀐다 — getter 통로로 원본에 남긴다.
- 선택: 함수 단위 3묶음 + 키트 통로(선례 #701·#705 와 같은 꼴).

## 5. [원칙 ⑤] 절차
1) 시험지 선행 #707 → 2) 기준 `git archive 09f4a99` 사본·분리 작업 폴더 → 3) 생성기 → 4) `verify-stats-split.js`(토큰·누수·실행·렌즈 결과·잔디 글자) → 5) `module-specs --write`(kind hybrid·role·spans 손 칸) · `module-guard --update` → 6) npm test·tests 99개 전후 → 7) `tab-check.js` 기록·목표 기준 2회·후 1회 → 8) `dom-compare-stats.js` 기준 2회·후 1회 → 9) claims·기록 → 10) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "`S.askConfirm(m)` 처럼 통로를 거쳐 부르면 `this` 가 바뀐다" → 생성기가 옮긴 함수 최상위의 `this` 를 막고(0개), 통로로 부르는 7개(`askConfirm`=`js/core/confirm.js` `cellConfirm`, 나머지 원본 함수)의 본문에 `this`·`arguments` 0(grep). 반환값도 같은 함수 객체라 동작 차이 없음.
- 반론② "Node 의 require 경로와 브라우저 script 순서가 다르면 시험만 통과하고 화면은 깨진다" → 브라우저: 새 태그 3개가 원본 태그 바로 앞(같은 줄)이라 원본 IIFE 가 돌 때 키트가 이미 차 있다 — `verify-stats-split.js` ③ 이 브라우저 순서(부품 → 원본)로 vm 실행해 API 키 37개·순서·옮긴 함수 = 키트 함수를 확인하고, `dom-compare-stats.js` 가 실제 Chrome 에서 렌즈·그리드·스키마 편집을 눌러 HTML·저장값을 맞댄다. Node: 원본 머리의 `require` 3줄. `new Function` 실행 경로(#TASK-ES-060)는 #707 이 부품 → 원본 순서로 바꿔 두었다.

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/universal-stats.js` 6,092 → 5,171줄. 새 세포: `js/stats-taxonomy.js` 178줄 · `js/stats-data-grid.js` 473줄 · `js/stats-lenses.js` 370줄(모두 800줄 이하). 생성기 이름 바꿈 12곳(전부 `S.` — `DOMAINS` 4 · `askConfirm` 3 · 나머지 5개 각 1. 그리드 → 행 편집은 같은 파일이라 접두 없음, 새 파일끼리 부르는 곳 0 이라 `K.` 0).
- 기능 추가·삭제 0, 버그 수정 0(옮기기만).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-392/`:
- `verify-stats-split.json`: 함수 9개 토큰열 동일(`S.`·`K.` 접두 제외), 누수 0, 미노출 0, 안 쓰는 노출 0, 원본에 남은 정의 0, API 키 37개·순서 동일, `window` 이름 동일(+`OurgoalUniversalStatsKit`), 렌즈 6개 같은 입력(샘플 big3·running·study 3종 합본) 결과 동일, 부품의 `잔디` 글자 0.
- `test-compare.json`: npm test 기준 443·38/38·943/943·셀 42·모듈 가드 ④ 9 → 후 같음, smoke 검사 제목 443개 동일. tests 99개(tests/*.test.js + test-universal-stats-ux·test-universal-import) 종료 코드·출력 정규화 뒤 같음(28개는 기준에서도 실패 — 기존, 미수정).
- 탭 실측·조작 DOM 비교: 아래 9절.
- 막히는 지점: 금고 `scripts/verify-integrity-gate.js` 의 `잔디` 부재 검사는 `js/universal-stats.js` 한 파일만 본다 — 옮긴 부품은 그 검사 범위 밖(금고라 못 고침). 대신 `verify-stats-split.js` 가 부품 `잔디` 0 을 재고, smoke 합본 시험은 부품까지 읽는다.

## 9. 화면 측정
- `tab-check.js` 기록·목표(통계를 그리는 탭) — 기준(09f4a99 git archive) 2회: 비교한 값 894 · 다른 값 0(본질 변동 0) → `tab-compare-base1-base2.json`. 기준 1회 대 후 1회: 894 · 0 → `tab-compare-base1-after.json`.
- `dom-compare-stats.js` 게스트 조작 24단계(통계 세그먼트 → 렌즈 교차 비율·레이더·요일 리듬·추세 → 그리드 열기·검색·전체 선택·해제·행 추가(행 편집 모달)·닫기 → 데이터 관리 메뉴 → 스키마 편집·검색·새 이름 입력·닫기 → 메뉴에서 그리드 → 탭 왕복), 단계마다 `#screen-records`·`#modalOverlay`·`#uStatsFullscreenModal` HTML·localStorage·토스트·활성 화면·API 키·콘솔 오류 9칸 = 216칸: 기준 2회 차이 0, 기준 대 후 0, 콘솔 오류 0·0·0 → `dom-compare-stats.json`. 옮긴 코드가 실제로 그렸다: 렌즈 단계마다 화면 HTML 크기가 바뀌고(123,192 → 118,069·118,111·117,839 바이트), 그리드 모달 30,972 바이트·스키마 편집 모달 8,613 바이트.
- main(d2e0dbb — #707·#708·#709·#710) 합친 뒤 다시 잼: `js/universal-stats.js` 는 main 에서 안 바뀜. npm test 기준(git archive d2e0dbb) 443·38/38·943/943·셀 42·모듈 가드 ④ 8 → 합친 작업 같음, smoke 제목 동일, verify-stats-split ok, 게스트 조작 비교 216칸 차이 0 → `dom-compare-stats-main.json`. 기준선은 main 판을 받고 `module-guard --update` 로 다시 만듦(④ 8). 기록·목표 tab-check 는 합치기 전(09f4a99 기준)에만 쟀다.
- 실계정: [기본값] 이번엔 돌리지 않음 — 옮긴 함수 9개는 로그인·서버 경로를 직접 부르지 않고(저장은 호출자가 넘긴 `saveProfile` 그대로), 토큰열이 같다. 로그인 화면 비교는 확인 못 함으로 남긴다.

## 10. 남은 범위 (2차 이후, `js/universal-stats.js` 5,171줄)
- 800줄 넘는 함수 2개 — 함수 안 섹션 분할 필요(틀 2절 경계 조건 먼저): `generateDomainSample` 970줄(도메인별 샘플 섹션), `renderUniversalStatsDashboard` 884줄(헤더·렌즈·차트·KPI·진단 섹션).
- 함수 단위로 뗄 수 있는 묶음: 가져오기 모달 `openUniversalImportModal`(332) · 전체화면 `openStatsFullscreenModal`(197) · 데이터 관리 메뉴 `openDataManagementModal`(130) + 가이드 `openGuideModal`(62) · 차등 분석 `computeDifferentiatedAnalysis`·`renderDifferentiatedReportCard`·`openDifferentiatedMetricConfigModal`(약 140, 모델 상수 `METRIC_DIFFERENTIATED_MODELS` 179줄은 상태처럼 원본에 두거나 데이터 세포로) · 다중 시계열 `aggregateMultiSeries`·`calcNiceStep`·`renderMultiSeriesSvg`(438) · 온톨로지 `getChosung`·`matchQuery`·`inferDomainKey`·`buildUniversalOntology`(185) · CSV `parseCsvToUniversalRecords`(129) · 메트릭 추출·집계 `extractMetricsFromRecord`(452)·`discoverActiveMetrics`·`aggregateMetricTimeSeries`(154)·`renderUniversalSvgChart`(101) · 과거 샘플 `normalizeHistoricalDate`·`generate52WeekPowerliftingSample`·`generate1920sOlympicStrengthSample` · 카탈로그 상수 `METRIC_CONFIGS`(227)·`SAMPLE_THEMES`·`THEME_METRIC_SPECS`·`DOMAINS`.
- 이번 PR 의 시험지 합본(#707)이 `js/stats-*.js` 를 모두 읽으므로 2차는 시험지 선행 PR 없이 같은 꼴로 옮길 수 있다(단, 기준 시험지가 함수를 직접 실행하는 #TASK-ES-060 류 경로는 그대로 부품 → 원본 순서).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
