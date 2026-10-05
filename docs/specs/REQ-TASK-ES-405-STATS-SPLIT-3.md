# REQ/PLAN — TASK-ES-405 통계 세포 쪼개기 3차 (js/universal-stats.js 3,283줄 → 1,114줄 + 세포 8개)

> 근거: 코디네이터 지시(2026-10-05) — 2차 #717(TASK-ES-401) REQ 10절 "남은 범위" 중 함수 단위 후보·카탈로그 상수·`generateDomainSample` 구획 분할. `renderUniversalStatsDashboard` 는 이번에 손대지 않는다 [기본값]. 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 새 파일 각 800줄 이하, part1/part2 금지.
> 틀: `docs/specs/MODULE-SPLIT-PROTOCOL.md`(0절 원칙, 2절 섹션 경계 조건), 선례 `docs/specs/REQ-TASK-ES-392-STATS-SPLIT.md`·`docs/specs/REQ-TASK-ES-401-STATS-SPLIT-2.md`.

## REQ
- 대상 파일: `js/universal-stats.js`(1·2차 이음매를 늘림·묶음 삭제), 신규 `js/stats-catalog.js`·`js/stats-samples.js`·`js/stats-sample-fitness.js`·`js/stats-sample-growth.js`·`js/stats-ontology.js`·`js/stats-export.js`·`js/stats-fullscreen.js`·`js/stats-differentiated.js`, `index.html`(script 태그 8개 — 2차 태그와 같은 줄), `docs/architecture/modules.json`·`module-baseline.json`
- 대상 함수(옮김, 글자 그대로):
  - 함수 단위: `openStatsFullscreenModal` → `js/stats-fullscreen.js` · `computeDifferentiatedAnalysis`·`renderDifferentiatedReportCard`·`openDifferentiatedMetricConfigModal` → `js/stats-differentiated.js` · `getChosung`·`matchQuery`·`inferDomainKey`·`buildUniversalOntology` → `js/stats-ontology.js` · `exportCleanCsv`·`captureChartSnapshot` → `js/stats-export.js` · `generate52WeekPowerliftingSample`·`generate1920sOlympicStrengthSample` → `js/stats-samples.js`
  - 카탈로그 상수 6개 → 공장 함수(`js/stats-catalog.js`): `METRIC_CONFIGS`→`createMetricConfigs` · `SAMPLE_THEMES`→`createSampleThemes` · `THEME_METRIC_SPECS`→`createThemeMetricSpecs` · `RAW_52W_POWERLIFTING_DATA`→`createRaw52wPowerliftingData` · `DOMAINS`→`createDomains` · `METRIC_DIFFERENTIATED_MODELS`→`createMetricDifferentiatedModels`
  - 구획 분할: `generateDomainSample`(970줄) → 조립자(`js/stats-samples.js`)가 사슬 `if(domainKey === …)` 의 큰 구획 6개를 하위 함수로 부른다 — `pushHyroxSample`·`pushRunningSample`·`pushBig3Sample`(`js/stats-sample-fitness.js`), `pushStudySample`·`pushCodingSample`·`pushSalesSample`(`js/stats-sample-growth.js`). 작은 구획(weight·reading·sleep·finance·테마 규격)은 조립자에 그대로.
- 통로: 1·2차 키트 `window.OurgoalUniversalStatsKit` 그대로(전역 이름 증가 0). scope getter 15 → 18(더한 3개: `METRIC_DIFFERENTIATED_MODELS`·`RAW_52W_POWERLIFTING_DATA`·`THEME_METRIC_SPECS`, setter 0). 1·2차 getter(예 `getChosung`·`exportCleanCsv`·`generateDomainSample`)는 그대로 두고 가져온 같은 이름을 돌려준다 — 1·2차 부품 7개 글자 변경 0.
- 대상 DOM ID(옮긴 코드가 그리는 것, 그대로): `#uStatsFullscreenModal`·`#uFsRotateBtn`·`#uFsCloseBtn`·`#uFsChartWrapper`(전체화면), `.diff-cfg-open-btn`(리포트 카드 — 원본의 문서 위임 클릭은 원본에 남음). 원본에 남은 진입점: `#uBtnGraphFullscreen`, 데이터 관리 메뉴의 `#uMenuExportCsvBtn`·`#uMenuSnapBtn`(2차 부품), 가져오기 모달 `.u-sample-quick-btn`(2차 부품)
- 도구: `docs/design/harness/module-split/gen-stats-split-3.js`(생성기)·`sample-boundary-stats-3.js`(구획 경계 검사기)·`verify-stats-split-3.js`(토큰·누수·실행·상수 동일성·순수 함수 결과)·`test-compare-stats-3.js`·`dom-compare-stats-3.js`(게스트 조작 DOM 비교)·`real-account-stats-3.js`(로그인 상태 읽기 전용 비교)

## 1. [원칙 ①] 목표 정의
`js/universal-stats.js` 를 책임 단위 세포로 나누는 3차. 2차 10절의 함수 단위 후보 전부, 카탈로그 상수, `generateDomainSample` 구획 분할을 옮겨 원본을 최대한 줄인다. `window.OurgoalUniversalStats` 키 37개·순서, `window.*` 이름(새 이름 0), 호출 순서, 화면·저장값이 이전과 같아야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 2차 뒤 원본 3,283줄 중 대시보드 함수(884줄)를 뺀 나머지는 서로 독립인 샘플 생성·카탈로그 데이터·온톨로지·차등 분석·전체화면·내보내기 묶음이다.
- 원인(측정, babel 최상위 문 지도): 원본 800줄 이하를 막는 것은 `renderUniversalStatsDashboard` 884줄(이번 범위 밖) — 다른 것을 다 떼도 원본은 대시보드 + 머리 이음매 + 공개 API 로 1,114줄이 남는다.
- 중심: 상수를 옮겨도 "원본 IIFE 실행마다 새 객체 하나를 원본 변수가 쥐고, 부품은 getter 로 바로 그 객체를 읽는다"를 지킨다 — 공장 함수를 이전 선언 자리에서 부른다(`var METRIC_CONFIGS = createMetricConfigs();`).
- 핵심: 손으로 옮기지 않는다. 생성기가 (가) 글자 변형(상수 → 공장, 구획 본문 → 하위 함수 + 호출 한 줄, 들여쓰기 2칸만 바뀜) 뒤 (나) 2차와 같은 이동(이름 참조만 `S.`·`K.`)을 한다. 구획 분할은 경계 검사기가 먼저 있고 그것이 통과할 때만 둔다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- [기본값] 위치 `js/` 바로 아래 `js/stats-*.js`(1·2차와 같은 이유 — 시험지 #707 통계 합본이 `stats-` 로 시작하고 `OurgoalUniversalStatsKit` 표식이 있는 파일을 모두 읽는다 → 시험지 수정 0, 기대값 변경 0).
- 상수 공장: `var X = <값>;` → `var X = createX();` + `function createX(){ return <값>; }`. 값 안 원본 스코프 이름은 `S.` 로 읽는데, 공장은 이전 선언 자리에서 불리므로 읽는 시점도 이전과 같다. 원본에서 `X` 재대입 0(생성기 검사). 차등 모델 별칭 두 줄(`METRIC_DIFFERENTIATED_MODELS.strength = …big3` 등)은 원본에 그대로.
- 구획 분할(틀 2절 경계 조건 — 생성기가 정적으로 검사, 어기면 멈춤):
  ① 경계가 문을 가르지 않는다 — 구획 = `if(domainKey === '<키>'){` 와 `}` 사이 줄 전체.
  ② 공유 변수는 `domainKey`·`now`·`records` 셋뿐이고 재대입 0 — 쓰는 것만 인자로 넘긴다(6구획 모두 `(now, records)`).
  ③ 구획의 지역 `var`(예 hyrox `w`·`weekDate`·`hyroxStationConfigs` …)는 사슬 조건식·머리·꼬리에서 안 쓰이고, 그 이름을 쓰는 갈래마다 그 갈래 안에 선언이 있다 — 갈래끼리 같은 이름(`w`·`weekDate`)을 쓰지만 한 번 부를 때 한 갈래만 돌아 값이 오가지 않는다.
  ④ 구획 안 `return`·`this`·`arguments`·구획 밖으로 나가는 `break`/`continue` 0.
- 원본 이음매(1·2차 것을 늘림): require 줄에 새 파일 8개, 가져오기 19줄(원본에 남은 코드가 실제로 부르는 이름만 — 구획 함수 6개는 조립자만 부르므로 안 가져온다), getter 목록 = 기존 15 ∪ 새 3(이름순).
- index.html: 2차 태그 4개 뒤·원본 태그 바로 앞, 같은 줄에 새 태그 8개(`?v=20261005-es405`). 원본 태그·버전 글자는 그대로.
- 신고서: `module-specs --write` 가 새 세포 8개를 올리고(kind·role·spans 는 신고서의 손 칸 — 2차처럼 hybrid·역할 한 줄·spans records/goals 를 스크립트로 채움), `module-guard --update` 로 기준선 23번째(④ 8 — universal-stats.js 1,114줄로 아직 800 초과라 수는 그대로).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 상수를 부품 파일 최상위 `var` 로 옮기고 원본이 `_statsKit.X` 를 가져오기: 원본을 다시 읽을 때(require 캐시 비우기 시험) 키트의 옛 객체를 다시 쥐게 돼 `ensureMetricConfig` 로 고친 옛 상태가 이어진다 — 이전과 다르다. 기각.
- B 상수는 원본에 두기: 안전하지만 원본 518줄이 남는다. 공장 함수가 A 의 문제 없이 같은 동작을 주므로 B 대신 공장.
- C `generateDomainSample` 를 함수째 한 파일로: 970줄이라 800 상한을 넘는다. 구획 분할 필요.
- D 모든 구획(작은 것 5개 포함)을 떼기: 조립자가 더 짧아지지만 지금도 조립자 파일 309줄로 상한과 멀다 — 바꾸는 글자를 줄이려 큰 구획 6개만.
- E 온톨로지를 옮기며 1차 부품 접두를 `S.` → `K.` 로 바꾸기: 1차 부품 글자가 바뀐다 — getter 를 그대로 두는 길(가져온 이름을 돌려줌)이 부품 글자 변경 0.
- 선택: 함수 단위 + 상수 공장 + 큰 구획 6개 분할, 1·2차 이음매 늘리기.

## 5. [원칙 ⑤] 절차
1) 기준 = origin/main 84df4a2 `git archive`(토큰·화면 비교용) + `git worktree --detach`(시험 비교용) → 2) 경계 검사기 `sample-boundary-stats-3.js` 를 먼저 만들고 기준 대 기준 통과 → 3) 생성기 → 4) 경계 검사기 기준 대 후 → 5) `verify-stats-split-3.js` → 6) `module-specs --write` · `module-guard --update` → 7) `test-compare-stats-3.js`(npm test·tests 103개) → 8) `tab-check.js` 기록·목표 기준 2회·후 1회 → 9) `dom-compare-stats-3.js` 기준 2회·후 1회 → 10) `real-account-stats-3.js` 기준 2회·후 1회 → 11) claims·기록 → 12) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "구획을 함수로 떼면 `var` 끌어올림 범위가 바뀐다 — 다른 갈래가 같은 `w` 를 쓴다" → 생성기 경계 검사 ③: 그 이름을 쓰는 갈래마다 자기 선언이 있고 사슬 밖에서는 안 쓴다. 한 번 부를 때 한 갈래만 돌므로 어느 쪽이든 그 갈래 시작 때 값은 `undefined` 로 같다. 실행으로도 `sample-boundary-stats-3.js` 가 도메인 키 38개(사슬 글자 10 + 테마 규격 키 + 샘플 카드 키 + 없는 키) × 고정 시각 2가지 + 과거 샘플 2종 = 80경우를 `assert.deepStrictEqual` 로 맞댄다(기록 6,056건).
- 반론② "상수를 옮기면 대시보드·부품·공개 API 가 서로 다른 객체를 볼 수 있다" → `verify-stats-split-3.js` ③: 상수 6개마다 공개 API 값 === 통로 getter 값(같은 객체), JSON·함수 값 개수가 이전과 같음, 차등 모델 별칭 `strength`·`health` === `big3` 유지, 원본을 한 번 더 돌리면 새 객체(이전처럼 실행마다 새 객체)이고 통로도 새 객체를 가리킴.
- 반론③ "옮긴 함수를 1차 부품이 `S.getChosung` 로 부르면 `this` 가 S 가 된다" → 옮긴 함수 최상위 `this` 0(생성기가 막음), 통로로 부르는 원본 함수 본문 `this`·`arguments` 0(`bridgeThis`).

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/universal-stats.js` 3,283 → 1,114줄. 새 세포 8개(564·309·447·446·214·80·223·164줄, 모두 800줄 이하). 생성기 이름 바꿈 21곳.
- 1·2차 부품 7개 글자 변경 0. 기능 추가·삭제 0, 버그 수정 0(옮기기만).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-405/`:
- `sample-boundary-stats-3.json`: 80경우 모두 같음(기준 대 기준도 `sample-boundary-stats-3-base-base.json` 80/80).
- `verify-stats-split-3.json`: 토큰 비교 37묶음 동일(함수 12·상수 6+원본 선언 6·구획 6·조립자 1·원본에 남은 함수 4·API·꼬리·별칭), 1·2차 부품 글자 동일, 누수 0, 미노출 0, 안 쓰는 노출 0, 원본에 남은 정의 0, API 키 37개·순서, `window` 이름 동일, 상수 동일성, 순수 함수 16가지 결과 동일, 부품 `잔디` 0.
- `test-compare.json`: npm test 수치·smoke 제목 487개·tests 103개 종료 코드·정규화 출력 같음.
- 막히는 지점: 부품 파일이 하나라도 안 읽히면 이전(2차까지)은 그 기능만 죽었지만, 이제 원본이 머리에서 공장 함수를 부르므로 원본 IIFE 가 멈춘다(브라우저 태그·Node require 줄 모두 부품을 먼저 읽어 실제로는 생기지 않음 — 새 결함 아님, 위험 기록). `generateDomainSample` 내부 텍스트를 찾는 시험은 없다(시험지 수정 0).

## 9. 화면 측정
- `tab-check.js` 기록·목표 기준(git archive) 2회·후 1회 → `tab-compare-base1-base2.json`·`tab-compare-base1-after.json`.
- `dom-compare-stats-3.js` 게스트 조작 69단계(2차 40단계 + 전체화면 열기·회전·닫기, 차등 분석 기준 모달(공개 API)·닫기, 리포트 카드 HTML(공개 API), CSV 내보내기(만든 CSV 글자 — Blob 을 붙잡아 맞댐, 다운로드 막음), 스냅샷(알림 글자), 1초 샘플 로드 hyrox·running·study·coding·sales, 렌즈, 탭 왕복), 단계마다 10칸(2차 9칸 + 알림 창 글자) → `dom-compare-stats-3.json`.
- 로그인 상태: `real-account-stats-3.js` — 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A, 읽기 전용 22단계(2차 13단계 + 전체화면·차등 분석 모달·리포트 카드·CSV 내보내기, 융합·샘플 로드·저장 안 누름) 기준 2회·후 1회, 단계마다 화면·모달 정규화 HTML sha256·바이트 → `real-account-stats.json`(주소·계정·기록 내용 미기록).

## 10. 남은 범위 (4차 이후, `js/universal-stats.js` 1,114줄)
- `renderUniversalStatsDashboard` 884줄 — 원본 800줄 이하에 꼭 필요. 지역 변수(`container`·`state`·`callbacks`·`allRecs`·`seriesMap`·필터 상태)를 섹션(헤더·빈 상태·렌즈·차트·KPI·진단·전체화면 바인딩)끼리 공유하므로 틀 2절 ②(공유 변수 재대입 0)를 먼저 재야 한다 — 이번 경계 검사기와 같은 꼴로 대시보드 DOM 출력 맞대기 검사기를 먼저 만든다.
- 원본에 남은 나머지(약 230줄): 머리 이음매(가져오기 41줄·getter 18줄)·헬퍼 3개·상수 공장 호출 6줄·공개 API·문서 위임 클릭 — 대시보드를 떼면 원본은 이음매 + API 조립자로 800줄 이하가 된다.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
