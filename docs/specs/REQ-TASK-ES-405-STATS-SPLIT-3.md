# REQ/PLAN — TASK-ES-405 통계 세포 쪼개기 3차 (js/universal-stats.js 3,283줄 → 1,614줄 + 세포 7개)

> 근거: 코디네이터 지시(2026-10-05) — 2차 #717(TASK-ES-401) REQ 10절 "남은 범위" 중 함수 단위 후보·카탈로그 상수(같은 객체 참조가 유지되는 방식만)·`generateDomainSample` 구획 분할. `renderUniversalStatsDashboard` 는 이번에 손대지 않는다 [기본값]. 전역 노출·호출 순서·동작 그대로, 기능 추가·삭제 0, 새 파일 각 800줄 이하, part1/part2 금지.
> 틀: `docs/specs/MODULE-SPLIT-PROTOCOL.md`(0절 원칙, 2절 섹션 경계 조건), 선례 `docs/specs/REQ-TASK-ES-392-STATS-SPLIT.md`·`docs/specs/REQ-TASK-ES-401-STATS-SPLIT-2.md`.

## REQ
- 대상 파일: `js/universal-stats.js`(1·2차 이음매를 늘림·묶음 삭제), 신규 `js/stats-samples.js`·`js/stats-sample-fitness.js`·`js/stats-sample-growth.js`·`js/stats-ontology.js`·`js/stats-export.js`·`js/stats-fullscreen.js`·`js/stats-differentiated.js`, `index.html`(script 태그 7개 — 2차 태그와 같은 줄), `docs/architecture/modules.json`·`module-baseline.json`
- 대상 함수(옮김, 글자 그대로):
  - 함수 단위: `openStatsFullscreenModal` → `js/stats-fullscreen.js` · `computeDifferentiatedAnalysis`·`renderDifferentiatedReportCard`·`openDifferentiatedMetricConfigModal` → `js/stats-differentiated.js` · `getChosung`·`matchQuery`·`inferDomainKey`·`buildUniversalOntology` → `js/stats-ontology.js` · `exportCleanCsv`·`captureChartSnapshot` → `js/stats-export.js` · `generate52WeekPowerliftingSample`·`generate1920sOlympicStrengthSample` → `js/stats-samples.js`
  - 구획 분할: `generateDomainSample`(970줄) → 조립자(`js/stats-samples.js`)가 사슬 `if(domainKey === …)` 의 큰 구획 6개를 하위 함수로 부른다 — `pushHyroxSample`·`pushRunningSample`·`pushBig3Sample`(`js/stats-sample-fitness.js`), `pushStudySample`·`pushCodingSample`·`pushSalesSample`(`js/stats-sample-growth.js`). 작은 구획(weight·reading·sleep·finance·테마 규격)은 조립자에 그대로.
  - 카탈로그 상수 6개(`METRIC_CONFIGS`·`SAMPLE_THEMES`·`THEME_METRIC_SPECS`·`RAW_52W_POWERLIFTING_DATA`·`DOMAINS`·`METRIC_DIFFERENTIATED_MODELS`)는 **옮기지 않는다** — 4절 B·C, 8절(같은 객체 참조를 지키며 옮기는 방식이 법정 모듈 로드 탐침과 맞지 않음, 실측).
- 통로: 1·2차 키트 `window.OurgoalUniversalStatsKit` 그대로(전역 이름 증가 0). scope getter 15 → 18(더한 3개: `METRIC_DIFFERENTIATED_MODELS`·`RAW_52W_POWERLIFTING_DATA`·`THEME_METRIC_SPECS`, setter 0). 1·2차 getter(예 `getChosung`·`exportCleanCsv`·`generateDomainSample`)는 그대로 두고 가져온 같은 이름을 돌려준다 — 1·2차 부품 7개 글자 변경 0.
- 대상 DOM ID(옮긴 코드가 그리는 것, 그대로): `#uStatsFullscreenModal`·`#uFsRotateBtn`·`#uFsCloseBtn`·`#uFsChartWrapper`(전체화면), `.diff-cfg-open-btn`(리포트 카드 — 문서 위임 클릭은 원본에 남음). 원본에 남은 진입점: `#uBtnGraphFullscreen`, 데이터 관리 메뉴의 `#uMenuExportCsvBtn`·`#uMenuSnapBtn`(2차 부품), 가져오기 모달 `.u-sample-quick-btn`(2차 부품)
- 도구: `docs/design/harness/module-split/gen-stats-split-3.js`(생성기)·`sample-boundary-stats-3.js`(구획 경계 검사기)·`verify-stats-split-3.js`(토큰·누수·실행·상수 동일성·원본 단독 로드·순수 함수 결과)·`test-compare-stats-3.js`·`dom-compare-stats-3.js`(게스트 조작 DOM 비교)·`real-account-stats-3.js`(로그인 상태 읽기 전용 비교)

## 1. [원칙 ①] 목표 정의
`js/universal-stats.js` 를 책임 단위 세포로 나누는 3차. 2차 10절의 함수 단위 후보 전부와 `generateDomainSample` 구획 분할을 옮겨 원본을 최대한 줄인다. `window.OurgoalUniversalStats` 키 37개·순서, `window.*` 이름(새 이름 0), 호출 순서, 화면·저장값이 이전과 같아야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 2차 뒤 원본 3,283줄 중 대시보드 함수(884줄)를 뺀 나머지는 서로 독립인 샘플 생성·온톨로지·차등 분석·전체화면·내보내기 묶음과 카탈로그 데이터다.
- 원인(측정, babel 최상위 문 지도): 원본 800줄 이하를 막는 것은 `renderUniversalStatsDashboard` 884줄(이번 범위 밖)과 카탈로그 상수 519줄(원본이 읽힐 때 바로 쓰는 값).
- 중심: 옮긴 함수는 원본이 부를 때만 쓰이므로(읽힐 때 부르지 않음) 원본은 부품 없이도 이전처럼 읽힌다. 읽힐 때 쓰이는 상수는 원본에 둔다.
- 핵심: 손으로 옮기지 않는다. 생성기가 (가) 구획 본문 → 하위 함수 + 호출 한 줄(토큰 동일, 들여쓰기 2칸만 바뀜) 뒤 (나) 2차와 같은 이동(이름 참조만 `S.`·`K.`)을 한다. 구획 분할은 경계 검사기가 먼저 있고 그것이 통과할 때만 둔다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- [기본값] 위치 `js/` 바로 아래 `js/stats-*.js`(1·2차와 같은 이유 — 시험지 #707 통계 합본이 `stats-` 로 시작하고 `OurgoalUniversalStatsKit` 표식이 있는 파일을 모두 읽는다 → 시험지 수정 0, 기대값 변경 0).
- 구획 분할(틀 2절 경계 조건 — 생성기가 정적으로 검사, 어기면 멈춤):
  ① 경계가 문을 가르지 않는다 — 구획 = `if(domainKey === '<키>'){` 와 `}` 사이 줄 전체.
  ② 공유 변수는 `domainKey`·`now`·`records` 셋뿐이고 재대입 0 — 쓰는 것만 인자로 넘긴다(6구획 모두 `(now, records)`).
  ③ 구획의 지역 `var`(예 hyrox `w`·`weekDate`·`hyroxStationConfigs` …)는 사슬 조건식·머리·꼬리에서 안 쓰이고, 그 이름을 쓰는 갈래마다 그 갈래 안에 선언이 있다 — 갈래끼리 같은 이름(`w`·`weekDate`)을 쓰지만 한 번 부를 때 한 갈래만 돌아 값이 오가지 않는다.
  ④ 구획 안 `return`·`this`·`arguments`·구획 밖으로 나가는 `break`/`continue` 0.
- 원본 이음매(1·2차 것을 늘림): require 줄에 새 파일 7개, 가져오기 13줄(원본에 남은 코드가 실제로 부르는 이름만 — 구획 함수 6개는 조립자만 부르므로 안 가져온다), getter 목록 = 기존 15 ∪ 새 3(이름순).
- index.html: 2차 태그 4개 뒤·원본 태그 바로 앞, 같은 줄에 새 태그 7개(`?v=20261005-es405`). 원본 태그·버전 글자는 그대로.
- 신고서: `module-specs --write` 가 새 세포 7개를 올리고(kind·role·spans 는 신고서의 손 칸 — 2차처럼 hybrid·역할 한 줄·spans records/goals 를 스크립트로 채움), `module-guard --update` 로 기준선 24번째(④ 5 — universal-stats.js 1,614줄로 아직 800 초과).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 상수를 부품 파일 최상위 `var` 로 옮기고 원본이 `_statsKit.X` 를 가져오기: 원본을 다시 읽을 때(require 캐시 비우기 시험) 키트의 옛 객체를 다시 쥐게 돼 `ensureMetricConfig` 로 고친 옛 상태가 이어진다 — 이전과 다르다. 기각.
- B 상수를 공장 함수(`var X = createX();`)로 옮기기: 같은 객체·실행마다 새 객체는 지키지만, 원본이 읽힐 때 공장을 부르므로 부품 없이 원본만 읽으면 멈춘다. 처음에 이 길로 만들었다가 법정 예비 점검(모듈 로드 탐침 `court/probes/module-load.js` — 파일마다 따로 vm 에서 돌림)에서 `TypeError: createMetricConfigs is not a function` 로 "되던 부품이 고장 남" 판정을 받았다(push 전, PR 없음). 기각 — 상수는 원본에 둔다.
- C 상수는 원본에 두기: 원본 519줄이 남지만 이전과 완전히 같다(부품은 getter 로 같은 객체). 선택.
- D `generateDomainSample` 를 함수째 한 파일로: 970줄이라 800 상한을 넘는다. 구획 분할 필요.
- E 모든 구획(작은 것 5개 포함)을 떼기: 조립자 파일이 이미 309줄로 상한과 멀다 — 바꾸는 글자를 줄이려 큰 구획 6개만.
- F 온톨로지를 옮기며 1차 부품 접두를 `S.` → `K.` 로 바꾸기: 1차 부품 글자가 바뀐다 — getter 를 그대로 두는 길(가져온 이름을 돌려줌)이 부품 글자 변경 0.
- 선택: 함수 단위 + 큰 구획 6개 분할, 상수는 원본, 1·2차 이음매 늘리기.

## 5. [원칙 ⑤] 절차
1) 기준 = origin/main(#718·#719·#721 포함) `git archive`(토큰·화면 비교용) + `git worktree --detach`(시험 비교용) → 2) 경계 검사기 `sample-boundary-stats-3.js` 를 먼저 만들고 기준 대 기준 통과 → 3) 생성기 → 4) 경계 검사기 기준 대 후 → 5) `verify-stats-split-3.js`(원본 단독 로드 포함) → 6) `module-specs --write` · `module-guard --update` → 7) `test-compare-stats-3.js`(npm test·tests 105개) → 8) `tab-check.js` 기록·목표 기준 2회·후 1회 → 9) `dom-compare-stats-3.js` 기준 2회·후 1회 → 10) `real-account-stats-3.js` 기준 2회·후 1회 → 11) claims·기록 → 12) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "구획을 함수로 떼면 `var` 끌어올림 범위가 바뀐다 — 다른 갈래가 같은 `w` 를 쓴다" → 생성기 경계 검사 ③: 그 이름을 쓰는 갈래마다 자기 선언이 있고 사슬 밖에서는 안 쓴다. 한 번 부를 때 한 갈래만 돌므로 어느 쪽이든 그 갈래 시작 때 값은 `undefined` 로 같다. 실행으로도 `sample-boundary-stats-3.js` 가 도메인 키 38개(사슬 글자 10 + 테마 규격 키 + 샘플 카드 키 + 없는 키) × 고정 시각 2가지 + 과거 샘플 2종 = 80경우를 `assert.deepStrictEqual` 로 맞댄다(기록 6,056건).
- 반론② "부품이 상수를 읽을 때 원본과 다른 객체를 볼 수 있다" → 상수는 원본에 그대로이고 부품은 getter 로 읽는다. `verify-stats-split-3.js` ③: 상수 6개마다 공개 API 값 === 통로 getter 값, JSON·함수 값 개수가 이전과 같음, 차등 모델 별칭 `strength`·`health` === `big3` 유지, 원본을 한 번 더 돌리면 새 객체이고 통로도 새 객체를 가리킴. 원본만 따로 읽어도(부품 없이) 멈추지 않고 공개 API 를 등록함(`standaloneOk`).
- 반론③ "옮긴 함수를 1차 부품이 `S.getChosung` 로 부르면 `this` 가 S 가 된다" → 옮긴 함수 최상위 `this` 0(생성기가 막음), 통로로 부르는 원본 함수 본문 `this`·`arguments` 0(`bridgeThis`).

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/universal-stats.js` 3,283 → 1,614줄. 새 세포 7개(309·447·446·214·80·223·164줄, 모두 800줄 이하). 생성기 이름 바꿈 21곳.
- 1·2차 부품 7개 글자 변경 0. 기능 추가·삭제 0, 버그 수정 0(옮기기만).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-405/`, 기준은 main 합친 뒤의 origin/main:
- `sample-boundary-stats-3.json`: 80경우 모두 같음(기준 대 기준도 `sample-boundary-stats-3-base-base.json` 80/80).
- `verify-stats-split-3.json`: 토큰 비교 31묶음 동일(옮긴 함수 12·구획 6·조립자 1·원본에 남은 함수 4·상수 6·API·꼬리·별칭), 1·2차 부품 글자 동일, 누수 0, 미노출 0, 안 쓰는 노출 0, 원본에 남은 정의 0, API 키 37개·순서, `window` 이름 동일, 상수 동일성, 원본 단독 로드, 순수 함수 16가지 결과 동일, 부품 `잔디` 0.
- `test-compare.json`: npm test 수치·smoke 제목 487개·tests 105개 종료 코드·정규화 출력 같음.
- 막혔던 지점(해결): 상수 공장 방식이 법정 모듈 로드 탐침에서 원본 단독 로드 실패 → 상수 원본 유지(4절 B·C). 그 뒤 탐침(`probeModules`·`compare`)을 로컬에서 읽기 전용으로 돌려 회귀 0 확인.

## 9. 화면 측정
- `tab-check.js` 기록·목표 기준(git archive) 2회·후 1회 → `tab-compare-base1-base2.json`·`tab-compare-base1-after.json`.
- `dom-compare-stats-3.js` 게스트 조작 69단계(2차 40단계 + 전체화면 열기·회전·닫기, 차등 분석 기준 모달(공개 API)·닫기, 리포트 카드 HTML(공개 API), CSV 내보내기(만든 CSV 글자 — Blob 을 붙잡아 맞댐, 다운로드 막음), 스냅샷(알림 글자), 1초 샘플 로드 hyrox·running·study·coding·sales, 렌즈, 탭 왕복), 단계마다 10칸(2차 9칸 + 알림 창 글자) → `dom-compare-stats-3.json`.
- 로그인 상태: `real-account-stats-3.js` — 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A, 읽기 전용 22단계(2차 13단계 + 전체화면·차등 분석 모달·리포트 카드·CSV 내보내기, 융합·샘플 로드·저장 안 누름) 기준 2회·후 1회, 단계마다 화면·모달 정규화 HTML sha256·바이트 → `real-account-stats.json`(주소·계정·기록 내용 미기록).

## 10. 남은 범위 (4차 이후, `js/universal-stats.js` 1,614줄)
- `renderUniversalStatsDashboard` 884줄 — 지역 변수(`container`·`state`·`callbacks`·`allRecs`·`seriesMap`·필터 상태)를 섹션(헤더·빈 상태·렌즈·차트·KPI·진단·전체화면 바인딩)끼리 공유하므로 틀 2절 ②를 먼저 재야 한다 — 이번 경계 검사기와 같은 꼴로 대시보드 DOM 출력 맞대기 검사기를 먼저 만든다.
- 카탈로그 상수 519줄(`METRIC_CONFIGS` 227·`METRIC_DIFFERENTIATED_MODELS` 179·`SAMPLE_THEMES` 72·`THEME_METRIC_SPECS` 29·`DOMAINS` 11·`RAW_52W_POWERLIFTING_DATA` 1) — 원본이 읽힐 때 쓰는 값이라 옮기려면 법정 모듈 로드 탐침이 원본을 부품과 함께 읽는 방식(법정 쪽 변경 — 금고, 별도 승인)이 먼저 필요하거나, 원본이 읽힐 때 상수를 쓰지 않도록 API 조립을 늦추는 동작 변경(별도 티켓)이 필요하다.
- 대시보드·상수를 빼면 원본은 머리 이음매(가져오기 35줄·getter 18줄)·헬퍼 3개·공개 API·문서 위임 클릭으로 약 200줄.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
