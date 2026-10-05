# REQ — #TASK-ES-475 시험지 선행: achievement-graph-multiset 이 인라인 합본을 읽음(인라인 어려움 구역 H3 #TASK-ES-467 선행)

- 근거: 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다), `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-6, 합본 도구 `tests/helpers/inline-bundle.js`(#TASK-ES-441).
- 범위: `tests/achievement-graph-multiset.test.js` 의 `html` 읽기 줄 1줄. 제품 코드 0, 단언·기대값·검사 수 0 변경, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
구역 H3 의 실천 추이 차트 그리기(`renderWeekChart`)를 `js/tabs/records/trend-metrics-chart.js` 로 옮기면(#TASK-ES-467), 기준 시험지가 index.html 한 파일에서 `trend-metrics-selector-row` 등 글자를 찾다 실패한다. 법정은 기준 커밋 시험지로 채점하므로 시험지를 먼저 병합해야 한다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 시험지가 "코드가 index.html 에 있다"를 가정한다.
- **원인**: 27번째 줄 이후 단언이 `fs.readFileSync(index.html)` 글자만 본다.
- **중심**: 읽기를 인라인 합본(원문 맨 앞 + js/tabs 세포, `L.` 접두 제거)으로 넓힌다.
- **핵심**: 85~89줄은 원문에서 `function renderMultiMetricSvg(` 부터 `window.renderMultiMetricSvg = …` 까지 잘라 실행한다 — 두 글자가 원문에 이어 있어야 하므로 #TASK-ES-467 은 `renderMultiMetricSvg` 를 옮기지 않는다(원문 맨 앞이라 잘라 읽기는 그대로).

## 3. [원칙 ③] 해결방식
19번째 줄 `const html = fs.readFileSync(htmlPath, 'utf8');` → `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(htmlPath, 'utf8'))`.

## 4. [원칙 ④] 재검토 — 한계
합본은 원문을 맨 앞에 둔다 — 원문에 있는 글자는 원래 자리에서 먼저 찾힌다. 세포가 없으면 합본 = 원문(+ 기존 세포 글자)이라 지금 main 에서 결과가 같다.

## 5. [원칙 ⑤] 절차
시험지 1줄 → `real-move-test-h3.js` 로 기준·이동 제품 × 기준·새 시험지 4칸 측정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "합본이면 원래 없어진 글자도 통과시켜 시험이 약해진다" → 세포 글자는 옮긴 원문 글자 그대로이고(`L.` 만 뗌), 단언 대상 글자는 그대로 존재해야 한다. 옮기기 PR 의 verify 가 토큰 동일을 잰다.
- 반론 2 "renderMultiMetricSvg 잘라 읽기가 깨진다" → 그 함수는 원문에 남는다(이동 PR 설정에서 제외). 이동 제품에서 새 시험지 종료 코드 0 을 측정했다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
`tests/achievement-graph-multiset.test.js` 19번째 줄, `tests/helpers/inline-bundle.js` `withInlineCells`, 측정 `docs/design/harness/module-split/real-move-test-h3.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
`reports/TASK-ES-475/real-move.json`: 새 시험지·기준 제품 = 기준 시험지·기준 제품(종료 코드·출력 줄 수·첫 오류 같음), 기준 시험지는 이동 제품에서 깨짐, 새 시험지는 이동 제품에서 기준과 같음. 막힐 지점: 시험지 선행 실측 도구(inline-hard-test-probe)는 이 시험지를 묶음 「측정지표」의 단독 의존으로 잡지 못했다(지도 근사 목록 밖) — 실제 시험 비교로 발견.
