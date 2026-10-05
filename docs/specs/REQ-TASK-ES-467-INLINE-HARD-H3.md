# REQ — #TASK-ES-467 인라인 어려움 구역 H3: 측정지표 추이 차트·전문 템플릿 묶음을 기록 탭 세포 3개로 이전(동작 그대로)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SKELETON·CELL_SPLIT·CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md`(#TASK-ES-439, PR #762) 2절 표준 이음매·3절 자리 표지·4-1 빌더 절차, `docs/specs/MODULE-SPLIT-PROTOCOL.md`.
- 지시: 오케스트레이터(2026-10-05) — 상민님 원문 "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" → 어려움 구역 H3 전담. 묶음은 번호가 아니라 구획 주석 제목으로 찾는다.
- 범위: 구역 H3 의 「TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진」 · 「전문적(내 전용 템플릿) 기록하기 & 일정 연동」. 같은 구역의 「템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013)」은 광고·돈(승인선 ①)에 닿아 손대지 않는다. 기능 추가·삭제 0, 마크업·CSS 이동 0, 동결 파일 0, 시험 기대값 변경 0, retire 0, 생성 지도 3종 커밋 0(오케스트레이터 일괄 갱신).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 구역 H3 의 어려움 묶음을 표준 이음매(생성기 `gen-inline-hard.js`)로 글자 그대로 세포에 옮긴다. 머리 이음매는 자리 표지 `H3` 아래에만 넣는다(병렬 빌더 충돌 0).
2. 800줄 넘는 묶음(「전문적(내 전용 템플릿) 기록하기 & 일정 연동」 850줄)은 줄 수가 아니라 책임 단위로 나눈다.
3. 주장에는 main 이 움직이면 바뀌는 전체 수치를 쓰지 않는다 — 옮긴 묶음 자체의 성질과 게스트 화면 시나리오(세포마다 하나)만.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 기록 탭의 실천 추이 차트와 전문 템플릿(목록·해석·창)이 아직 index.html 인라인 IIFE 안에 있어 기록 탭 세포가 그 함수를 통로로만 부른다.
- **원인**: 두 묶음이 「어려움」으로 분류된 이유 — 측정지표 묶음은 로드 중 `window.TREND_METRICS`·`window.renderMultiMetricSvg` 노출 줄(B1)과 인라인 onclick 이름(C), 템플릿 묶음은 800줄 초과(G)·큰 상수(D)·smoke 시험지 FN_NAMES 함수 3개(F2: `fmtYYMMDD`·`parseNaturalLanguageTemplateSpec`·`recommendTemplateFromAI`).
- **중심**: 표준 이음매 — 노출 줄은 원래 자리, 순수 상수는 옮기고 같은 객체를 가져옴, 묶음은 설정 `take.names` 로 책임 단위 두 세포에 나눔.
- **핵심**: F2 는 실제 막힘이 아니었다 — `scripts/smoke-test.js` 는 #TASK-ES-441(#751)부터 FN_NAMES 를 인라인 합본(`tests/helpers/inline-bundle.js` withInlineCells, js/tabs/** 세포의 `L.` 접두 제거)에서 뽑는다. 생성기의 F2 정지를 "smoke 가 합본을 읽고 세포가 js/tabs/**(합본이 기관 칸도 읽으면 js/core) 일 때는 막지 않음"으로 좁혔다(`smokeUsesBundle`·`bundleCoversCore`·`smokeReadsCell` — 기관 빌더 #TASK-ES-471 작업 트리와 글자가 같은 줄로 맞춰 두 PR 이 git 에서 충돌 없이 합쳐진다, `git merge-file` 측정 충돌 0). 시험지 선행 실측(`scripts/inline-hard-test-probe.js --only`)도 두 묶음 모두 깨지는 시험지 0.

## 3. [원칙 ③] 해결방식

| 새 세포 | 옮긴 것 | 원래 자리에 남긴 것 |
|---|---|---|
| `js/tabs/records/trend-metrics-chart.js` | `TREND_METRICS`(순수 상수) · `renderWeekChart` | `window.TREND_METRICS = TREND_METRICS;` · `renderMultiMetricSvg` 함수와 `window.renderMultiMetricSvg = renderMultiMetricSvg;`(시험지 `tests/achievement-graph-multiset.test.js` 가 원문에서 그 함수부터 노출 줄까지 잘라 실행 — 합본으로도 이어지는 구간이 끊겨 남김, 설정 `keepRest`) |
| `js/tabs/records/pro-templates.js` | `DEFAULT_PRO_TEMPLATES`(순수 상수) · `getAllProTemplates` · `getProTemplateByKey` · `fmtYYMMDD` · `parseNaturalLanguageTemplateSpec` · `recommendTemplateFromAI` | — |
| `js/tabs/records/pro-template-modals.js` | `openCreateCustomTemplateModal` · `openTemplateColumnEditModal` | — |

- 키트: 셋 다 기존 `OurgoalRecordsKit`(`_recordsKit`), 태그는 `js/tabs/records/index.js` 태그 바로 앞 같은 줄(순증가 0줄). 새 전역 0.
- 시험지 선행: 이 PR 의 첫 이전 시도에서 tests 전부 비교가 `tests/achievement-graph-multiset.test.js`(index.html 한 파일에서 차트 마크업 글자를 찾음) 종료 코드 차이를 잡았다 → 시험지 선행 #TASK-ES-475(PR #771, 읽기 1줄 withInlineCells) 병합 뒤 이 PR 을 올린다.
- 머리 이음매(자리 `H3` 아래): 가져오기 9개, 통로 getter 3개(`parseNaturalLanguageTemplateSpec`·`recommendTemplateFromAI` — 모달 세포가 다른 세포 이름을 `L.` 로 읽음).
- 설정: `docs/design/harness/module-split/inline-h3-467.json`. 생성기 한 군데 수정(F2 정지 범위, 위 핵심).

## 4. [원칙 ④] 재검토 — 한계

- 게스트 화면·로컬 정적 서버·Supabase 목으로 잰다. 로그인 뒤에만 닿는 경로(서버 동기화)는 이 묶음에 없다.
- `/api/customtemplate` 호출은 법정·로컬 모두 실서버가 없어 대체 경로(`parseNaturalLanguageTemplateSpec`)가 돈다 — 이전 전과 같은 조건.

## 5. [원칙 ⑤] 절차

1. `git archive origin/main` 기준 사본 → `inline-hard-test-probe.js --only` 로 시험지 선행 필요 실측(0).
2. 설정 → 생성기(입력 = origin/main index.html) → `verify-inline-hard.js` ok.
3. `court/probes/module-load.js` 기준 대 작업 회귀 0 · 새 파일 3개 단독 로드.
4. `module-specs --write`(손 칸 role) · `cell-descriptions.json` · `module-guard` 통과(기준선 파일은 커밋하지 않음).
5. 게스트 시나리오 3개 로컬 기준·작업 통과, 게스트 조작 비교(기준 2회·후 1회), `npm test`·tests 전부 기준=후.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "smoke FN_NAMES 함수를 옮기면 법정(기준 커밋 시험지)이 함수를 못 뽑아 smoke 가 죽는다" → 기준 커밋(origin/main)의 smoke-test 가 이미 `fnSource = mainScript + … + INLINE_CELLS_SRC` 로 js/tabs/** 세포 글자를 붙여 읽는다. 작업 트리에서 smoke 통과·실패 수가 기준과 같은지를 test-compare 로 잰다.
- 반론 2 "850줄 묶음을 두 파일로 나누면 줄 수 분할이다" → 나눈 경계는 책임(자료·해석 함수 대 화면 창)이며 `-part1` 꼴 이름이 없다. 두 창은 자료 쪽 이름을 통로 getter 로만 읽는다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `index.html`(머리 자리 `/* [어려움 이음매 자리 H3] */` 아래, 묶음 자리 표지 5줄), `js/tabs/records/trend-metrics-chart.js`·`pro-templates.js`·`pro-template-modals.js`, `docs/design/harness/module-split/gen-inline-hard.js`(`smokeReadsCell`), `docs/design/harness/module-split/inline-h3-467.json`, `docs/design/harness/module-split/dom-compare-inline-h3.js`.
- DOM: `#chartContainer [data-trendmetric]`·`[data-trendseg]`(차트), `#recOpenProTemplateBtn`·`#proTplSelect`·`#proTable`(전문 템플릿 기록 창), `#proEditColsBtn`·`#colEditList`·`#colEditConfirm`(열 편집 창), `#recCreateCustomTplQuickBtn`·`#customTplAiBtn`·`#customTplCancel`(만들기 창).

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

- 막힐 지점(예상대로였던 것): 실천 추이 차트는 기록 탭 첫 화면에 없고 「📈 히트맵·통계」 → 「📊 실천추이」 슬라이드에서만 보인다(캐러셀 이동 전에는 화면 밖 — 시나리오에 슬라이드 단추를 넣음).
- 측정 파일(`reports/TASK-ES-467/`): `verify-inline-hard.json`(ok) · `module-load-probe.json`(회귀 0, 새 파일 단독 로드 ok) · `scenario-local.json`(3개 기준·작업 통과) · `dom-compare-inline-h3.json`(기준 대 후 차이 0, 기준 대 기준 차이 0) · `test-compare.json`.
- 옮기다 발견한 결함(고치지 않음, 그대로 옮김): ① 전문 템플릿 기록 창에서 「표 속성 편집」 → 「표에 적용」을 누르면 토스트만 뜨고 기록 창 전체가 닫혀(열 편집 창이 같은 모달 자리를 덮어씀) 바꾼 열을 볼 수 없다 ② 전문 템플릿 기록 창의 「+ 새 템플릿」(`#proCreateTplBtn`) 처리기도 같은 이유로 열 편집 뒤에는 사라진다 ③ 기록 탭 「+ 템플릿 만들기」(`#recCreateCustomTplQuickBtn`)에 처리기가 두 벌(js/tabs/records/render.js 의 onclick 대입 + index.html 문서 위임) 걸려 한 번 누르면 만들기 창 열기가 두 번 불린다(코드 읽기 — index.html 문서 click 위임 `#recCreateCustomTplQuickBtn` 분기. 화면에서 두 번째 창이 첫 창을 덮는지는 재지 않음). ①은 게스트 조작 비교 단계 `cols-after`(기준·후 모두 `proSheet:false`)로 잼.
