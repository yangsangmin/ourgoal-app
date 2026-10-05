# REQ/PLAN — TASK-ES-428 통계 세포 쪼개기 4차 (js/universal-stats.js 1,614줄 → 732줄 + 세포 3개)

> 근거: 코디네이터 지시(2026-10-05) — 3차 #725(TASK-ES-405) REQ 10절 "남은 범위": `renderUniversalStatsDashboard`(884줄)는 대시보드 DOM 출력 검사기를 먼저 만들고(기준 대 기준 0) 구획을 하위 함수로 떼되 공유 지역 변수는 하나의 문맥 객체로 넘긴다(동작 그대로). 카탈로그 상수(519줄)는 법정 모듈 로드 탐침(원본 단독 로드)이 깨지지 않는 방식이 없으면 원본에 둔다.
> 틀: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT·CELL_SPLIT_PROOF), `docs/specs/MODULE-SPLIT-PROTOCOL.md` 0절 원칙·2절(섹션 소블록 — 화면 함수는 머리 + 섹션을 원래 순서로 부르는 조립자), 선례 #712·#717·#725.

## REQ
- 대상 파일: `js/universal-stats.js`(1·2·3차 이음매를 늘림·대시보드 함수 삭제), 신규 `js/stats-dashboard.js`(241줄)·`js/stats-dashboard-view.js`(399줄)·`js/stats-dashboard-bind.js`(358줄), `index.html`(script 태그 3개 — 3차 태그와 같은 줄, 순증가 0), `docs/architecture/modules.json`·`module-baseline.json`·`cell-descriptions.json`·`cell-map.json`
- 대상 함수(옮김, 글자 그대로 — 바뀐 글자는 `D.`·`S.`·`K.` 접두와 공유 var 의 `var ` 뿐):
  - 조립자 `renderUniversalStatsDashboard(container, allRecs, state, callbacks)` → `js/stats-dashboard.js`: 머리(인자 기본값·`customSchemas`·`ontology`)는 글자 그대로, 그 뒤 `var D = { container, allRecs, state, callbacks, ontology }`(머리에서 온 공유 이름), 빈 화면이면 `renderStatsEmptyState(D); return;`(이전과 같은 return), 아니면 구획 10개를 원래 순서로 부른다.
  - 구획 함수 11개(이전 함수 본문의 최상위 문 묶음 — 경계는 문 단위):
    `renderStatsEmptyState`(빈 화면 if 블록 본문 — `.u-empty-load-btn`·`#uEmptyImportBtn`)·`prepareStatsDashboardData`(접힘 저장값·렌즈·모드·종목·측정 지표·기간·스케일·시계열) → `js/stats-dashboard.js`;
    `buildStatsHeaderHtml`(머리·사용법)·`buildStatsLensControlsHtml`(기간·스케일·렌즈·렌즈 설명)·`buildStatsEntityChipsHtml`(종목 칩·측정 지표 줄)·`buildStatsChartHtml`(차트·분자/분모·범례)·`buildStatsKpiHtml`(KPI·차트 제목 줄)·`mountStatsDashboardHtml`(진단 리포트·본문 조립·`container.innerHTML`) → `js/stats-dashboard-view.js`;
    `bindStatsHeaderActions`(`.u-cockpit-header`·`#uAccordionToggleIcon`·`#uHdrMgmtMenuBtn`·숨은 앵커 `#uHdrGridBtn`·`#uHdrImportBtn`·`#uHdrExportCsvBtn`·`#uHdrSnapBtn`)·`bindStatsControlActions`(`.u-lens-btn`·`#uRatioNumSelect`·`#uRatioDenSelect`·`.u-mode-btn`·`.u-period-btn`·`.u-scale-btn`·`.u-dim-btn`·`#uTaxonomyOpenBtn`·`.u-entity-chip`)·`bindStatsChartInteractions`(`#uCrosshairCapture`·`#uFloatingInspector`·`#uTipEditBtn`·`#uBtnGraphFullscreen`) → `js/stats-dashboard-bind.js`
  - 문맥 객체 D: 구획끼리(머리 포함) 같이 쓰던 지역 이름 35개(인자 4 + `ontology` + 구획 사이 var 30 — 예 `seriesMap`·`curLens`·`chartObj`·`selRatioNum`·`impBtn`)는 쓰는 곳 모두 `D.<이름>`(405곳), 그 이름만 선언하는 var 문 31개는 `var ` 만 떼어 대입문. 한 구획 안에서만 쓰는 지역 이름(예 `aiReportHtml`·`bodyHtml`·`curHoverRecId`·`handleMove`)은 그 구획 함수의 var·함수 그대로.
- 통로: 1·2·3차 키트 `window.OurgoalUniversalStatsKit` 그대로(전역 이름 증가 0). 원본 가져오기 줄 +1(`renderUniversalStatsDashboard` — 공개 API 가 쓴다), scope getter 18개 그대로(새로 읽는 원본 이름 0 — 대시보드는 키트 함수만 부른다). 1·2·3차 부품 14개 글자 변경 0.
- 카탈로그 상수 6개(519줄)는 **옮기지 않는다** — 4절 B·C [기본값].
- 도구(`docs/design/harness/module-split/`): `dashboard-boundary-stats-4.js`(대시보드 DOM 출력 검사기 — 먼저 만듦)·`gen-stats-split-4.js`(생성기)·`verify-stats-split-4.js`(토큰·누수·단독 로드·순수 함수)·`test-compare-stats-4.js`·`dom-compare-stats-4.js`(게스트 조작 95단계)·`real-account-stats-4.js`(로그인 읽기 전용 39단계)·`scenario-local-stats-4.js`(법정 실행기로 시나리오 로컬 실행)

## 1. [원칙 ①] 목표 정의
`js/universal-stats.js` 를 800줄 이하로 — 남은 가장 큰 덩어리 `renderUniversalStatsDashboard`(884줄)를 책임 단위(빈 화면·데이터 준비·화면 글자·동작 배선) 세포로 나눈다. `window.OurgoalUniversalStats` 키 37개·순서, `window.*` 이름(새 이름 0), 호출 순서, 화면 HTML·이벤트 배선·state·저장값이 이전과 같아야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 3차 뒤 원본 1,614줄 = 대시보드 함수 884 + 카탈로그 상수 519 + 이음매·헬퍼·API 약 210. 800 이하로 가려면 대시보드가 나가야 한다.
- 원인: 대시보드는 한 함수 안에서 섹션(머리·컨트롤·칩·차트·KPI·리포트·배선)이 지역 변수를 공유한다 — 함수 단위 이동(1~3차 방식)이 안 되고, 800줄 상한 때문에 함수째 한 파일로도 못 옮긴다(884줄). 틀 2절 ②(공유 변수 말고는 두 섹션에서 쓰이지 않음)를 이번에는 공유 이름이 35개라 인자 나열로 풀 수 없다.
- 중심: 공유 이름을 문맥 객체 D 의 칸 하나로 모으면, 여러 구획(과 나중에 불리는 닫힘 함수)이 이전에 같은 변수를 읽고 쓰던 것이 그대로 같은 칸을 읽고 쓰는 것이 된다 — 값의 흐름이 이전과 같다. 원본은 읽힐 때 대시보드를 부르지 않으므로(공개 API 에 넣을 뿐) 부품 없이도 이전처럼 읽힌다.
- 핵심: 손으로 옮기지 않는다. 대시보드 DOM 출력 검사기를 먼저 만들어 기준 대 기준 0 을 확인한 뒤에만 생성기를 돌리고, 검사기(실행)와 토큰 검사기(글자 — 기대 토큰열을 검사기가 스스로 만든다) 둘 다로 맞댄다.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자
- [기본값] 위치 `js/` 바로 아래 `js/stats-dashboard*.js`(1~3차와 같은 이유 — 시험지 통계 합본이 `stats-` 로 시작하고 `OurgoalUniversalStatsKit` 표식이 있는 파일을 모두 읽는다 → 시험지 수정 0. 합본은 `S.`·`K.` 접두만 떼므로 `D.` 접두가 단언을 깨는지 먼저 실측: npm test·tests 출력 기준과 같음 → 선행 시험지 PR 불필요).
- [기본값] 문맥 객체 이름 `D`(파일 전체에 그 이름이 없음 — 생성기가 검사). 구획 함수 인자는 `D` 하나.
- 경계 조건(생성기 `gen-stats-split-4.js` 가 정적으로 검사, 어기면 멈춤): ① 구획 경계는 대시보드 본문 최상위 문 단위(앞뒤 문과 줄을 나눠 쓰지 않음) ② 구획 안 `return`·`this`·`arguments` 0(빈 화면 블록의 맨 끝 `return;` 은 조립자에 남김) ③ 공유 var 선언은 초기값 있는 단독 문, 한 선언에 공유·비공유 섞임 0, `for` 머리 0 ④ 머리에서 온 공유 이름(container·allRecs·state·callbacks·ontology)은 구획에서 재대입 0 ⑤ 구획 최상위 함수 선언 0(블록 안 `handleMove`·`handleLeave` 는 엄격 모드 블록 범위라 그 구획에 남음) ⑥ 이름 `D`·구획 함수 이름이 파일 어디에도 없음.
- 원본 이음매(3차 것을 늘림): require 줄에 새 파일 3개, 3차 이음매 주석 다음 4차 한 줄, 가져오기 1줄. index.html: 3차 태그 7개 뒤·원본 태그 바로 앞, 같은 줄에 새 태그 3개(`?v=20261005-es428`). 원본 태그·버전 글자 그대로.
- 신고서: `module-specs --write` 가 새 세포 3개를 올리고 손 칸(kind hybrid·역할 한 줄·spans records/goals — 3차와 같음)을 스크립트로 채움, `module-guard --update`(④ 800줄 초과 js 2 → 1). 세포지도: `cell-descriptions.json` 에 짧은 이름·하는 일 3줄, `cell-map-export` 로 `cell-map.json` 재생성(origin/main #740~#742 합친 뒤 다시 만듦, `--check` 최신).

## 4. [원칙 ④] 재검토 — 다른 길과 비교
- A 카탈로그 상수를 부품 최상위 `var` 로 옮기고 원본이 키트에서 읽기: 원본을 다시 읽으면 옛 객체를 쥐게 되고(3차 실측), 부품 없이 원본만 읽으면 `METRIC_CONFIGS` 가 `undefined` 라 공개 API 객체·별칭 줄(`METRIC_DIFFERENTIATED_MODELS.strength = …`)에서 멈춘다 — 법정 모듈 로드 탐침(파일마다 따로 vm)에서 "되던 부품이 고장 남". 기각.
- B 공장 함수·지연 조립: 3차에서 탐침 실패 실측(`TypeError: createMetricConfigs is not a function`), 헌법 CELL_SPLIT_PROOF 2 가 명시적으로 금지. 기각.
- C 상수를 부품으로 옮기되 원본에도 같은 글자를 두어 부품이 없을 때 만들기: 같은 글자 이중 보관(지시 금지). 기각.
- D [기본값·선택] 상수는 원본에 두고 대시보드만으로 800 이하: 1,614 − 884 + 이음매 2줄 = 732줄. 동결 court 변경 0, 동작 변경 0.
- E 대시보드 섹션을 인자 나열로 넘기기(3차 구획 방식): 공유 이름 35개·구획 사이 재대입(예 `seriesMap`·`selRatioNum`)·나중에 불리는 닫힘 함수가 그 값을 읽음 → 인자 복사로는 값의 흐름이 달라진다. 기각 — 문맥 객체 D 는 칸 하나를 같이 읽고 쓰므로 같다.
- F 대시보드를 원본에 조립자로 남기고 구획만 옮기기: 원본 = 732 + 조립자 약 30줄로 역시 800 이하지만, 조립자는 머리(온톨로지)·빈 화면 분기를 가진 대시보드 그 자체라 대시보드 세포에 두는 편이 책임 단위가 맞다. 원본은 이음매·헬퍼·상수·API 만.
- G 구획을 더 잘게(헤더·가이드 따로 등): 파일·함수 수만 늘고 경계 검사·주장 수가 커진다 — 섹션 주석 단위 11개로.

## 5. [원칙 ⑤] 절차
1) 기준 = origin/main `git archive`(토큰·화면 비교용) + `git worktree --detach`(시험 비교·시나리오용) → 2) `dashboard-boundary-stats-4.js` 를 먼저 만들고 기준 대 기준 0 → 3) 생성기 → 4) 검사기 기준 대 작업 + 일부러 고장 낸 사본(변이)에서 차이가 잡히는지 → 5) `verify-stats-split-4.js` + 법정 모듈 로드 탐침 로컬(읽기만) → 6) `module-specs --write`·`module-guard --update`·세포 설명·`cell-map-export` → 7) 최신 main 합침 → 다시 잼 → 8) `test-compare-stats-4.js` → 9) `tab-check.js` 기록·목표 기준 2회·후 1회 → 10) `dom-compare-stats-4.js` 기준 2회·후 1회 → 11) `real-account-stats-4.js` 기준 2회·후 1회 → 12) 시나리오 로컬 실행 → 13) claims·기록 → 14) PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론① "지역 변수를 객체 칸으로 바꾸면 닫힘 함수가 잡는 값이 달라진다 — 이전엔 변수, 지금은 객체 칸" → 한 번 그릴 때 D 는 하나이고, 이전에 그 변수를 읽고 쓰던 모든 자리(구획 본문·닫힘 함수)가 같은 칸을 읽고 쓴다. 변수가 함수 끝난 뒤 갖는 마지막 값 = 칸의 마지막 값. 다시 그릴 때마다 새 D(이전에도 새 변수). 실측: 검사기가 닫힘 함수가 실제로 도는 조작(렌즈·칩·모드·기간·스케일·지표·분자/분모 change·십자선 → 툴팁 수정 → 저장 onSaved·데이터 관리 → 1초 로드 onDone·숨은 앵커·접기/펼치기 rAF 다시 그리기)까지 30상태 957단계에서 HTML·배선·state·저장값·콜백·알림·Blob 차이 0. 일부러 스케일 처리 한 줄·툴팁 배선 한 줄을 바꾼 사본에서는 2,528칸이 다르게 잡힌다(검사기가 둔하지 않음).
- 반론② "`var` 를 떼면 끌어올림이 사라져 선언 전에 읽던 곳이 ReferenceError 가 된다" → 칸은 없으면 `undefined` 로 읽힌다(이전 var 의 끌어올림 값과 같음). 공유 이름의 선언 문은 모두 초기값 있는 단독 문이고(생성기 검사), `typeof`·`in` 차이도 없다. 토큰 검사기는 이전 전 글자에서 공유 이름을 스스로 세어 "D. 를 넣고 var 를 뺀 기대 토큰열"을 만들어 새 구획과 맞댄다 — 그 밖의 글자 차이 0.
- 반론③ "시험지 합본은 `S.`·`K.` 만 떼므로 `D.` 가 붙은 글자를 찾던 단언이 깨진다" → 실측: npm test smoke 443/443·무결성 38/38·버튼 943/943·smoke 제목 487개 동일, tests 109개 종료 코드·정규화 출력 동일(기준과 같이 실패하는 28개 포함). 선행 시험지 PR 불필요.

## 7. [원칙 ⑦] 즉시 실행 — 결과
- `js/universal-stats.js` 1,614 → 732줄. 새 세포 3개(241·399·358줄, 모두 800줄 이하). 공유 이름 35개 → `D.` 405곳, `var ` 31곳 뗌, 키트 접두(`K.`) 46곳, 새 getter 0.
- 1·2·3차 부품 14개 글자 변경 0. 기능 추가·삭제 0, 버그 수정 0(옮기기만 — 예: 빈 화면 `impBtn` 과 머리 앵커 `impBtn` 이 같은 var 였던 것도 같은 칸 `D.impBtn` 으로 그대로).
- 카탈로그 상수 519줄은 원본에 그대로([기본값], 4절 D).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점
작업자 실측(판정 아님) — `reports/TASK-ES-428/`, 기준은 최신 main 합친 뒤의 origin/main(stats·index.html 은 그 전 기준과 같은 글자):
- `dashboard-boundary-stats-4-base-base.json`: 기준 대 기준 30상태·957단계 차이 0. `dashboard-boundary-stats-4.json`: 기준 대 작업 차이 0(조작 891회 적용, 없는 대상 35회는 양쪽 같음, 배선 기록 73,543줄). `dashboard-boundary-stats-4-mutant.json`: 변이 사본 2,528칸 차이(검사기 민감도).
- `verify-stats-split-4.json`: 토큰 비교 23묶음 동일(구획 11·조립자·원본 남은 함수 4·상수 6·API·별칭), 1·2·3차 부품 글자 동일, 누수 0, 미노출 0, 안 쓰는 노출 0, D 는 구획 인자·조립자 var 로만 묶임, 원본·새 파일 단독 로드 오류 0, API 키 37개·순서, `window` 이름 동일, 순수 함수 16가지 결과 동일, 새 파일 `잔디` 0.
- `module-load-probe.json`: 법정 모듈 로드 탐침(`court/probes/module-load.js` 읽기만) 기준 대 작업 회귀 0, 새 파일 3개 로드 성공.
- `test-compare.json`: npm test 수치 같음(모듈 가드 ④ 2 → 1 만 다름 — 이번 분열로 줄어든 값)·smoke 제목 487개·tests 109개 종료 코드·정규화 출력 같음.
- `scenario-local.json`: 법정 시나리오 `scenarios/stats-cockpit-wiring.json` 을 법정 실행기로 로컬 실행 — 기준·작업 모두 통과.
- 막혔던 지점(해결): 시나리오에서 기록 탭 첫 누름이 화면을 바꾸지 않음(게스트 첫 진입) → 두 번 누름. 성소 테마는 `#recSegmentBar` 를 숨김 → 성소 기록 화면의 「📈 히트맵·통계」로 들어감. 머리 가운데 누름은 머리 안 버튼에 걸릴 수 있음 → 접기 아이콘으로.

## 9. 화면 측정
- `tab-check.js` 기록·목표 기준(git archive) 2회·후 1회 → `tab-compare-base1-base2.json`·`tab-compare-base1-after.json`.
- `dom-compare-stats-4.js` 게스트 조작 95단계(3차 69단계 + 4차 26단계: 기간 3·스케일 2·모드 왕복·종목 칩 2·측정 지표 2·효율 렌즈 분자/분모 change·십자선 → 툴팁 수정 → 저장·숨은 앵커 가져오기/CSV(Blob 글자)/스냅샷(알림 글자)·접기/아이콘 펼치기·탭 왕복) → `dom-compare-stats-4.json`.
- 로그인 상태: `real-account-stats-4.js` — 로컬 127.0.0.2 + /api 운영 전달, 테스트 계정 A, 읽기 전용 39단계(3차 22단계 + 4차 17단계 — 저장·융합·샘플 로드 없음) 기준 2회·후 1회, 단계마다 화면·모달 정규화 HTML sha256·바이트 → `real-account-stats.json`(주소·계정·기록 내용 미기록).

## 10. 남은 범위
- `js/universal-stats.js` 732줄 = 카탈로그 상수 519 + 이음매·헬퍼·공개 API. 800 이하라 더 나눌 의무는 없다. 상수를 옮기려면 법정 모듈 로드 탐침이 원본을 부품과 함께 읽는 방식(법정 쪽 변경 — 금고, 별도 승인) 또는 원본이 읽힐 때 상수를 쓰지 않게 하는 동작 변경(별도 티켓)이 먼저다.
- 800줄 초과 js 파일은 `js/sanctuary-v3-engine.js` 하나 남음(다른 세션 ES-425 성소 쪼개기 진행 중 — 손대지 않음).

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
