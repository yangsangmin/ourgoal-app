# REQ — #TASK-ES-519 시험지 선행: 「함수 시작 ~ 원래 자리 노출 줄」 구간 절단 시험지 3개가 세포 이전 뒤에도 같은 함수를 읽음 (인라인 3단계 Z4 선행)

- 근거: 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다), `docs/architecture/INLINE-STAGE3-DESIGN.md` 4절 표 「TASK-ES-307: 측정지표 다중 선택」 줄(합본으로 안 풀림 — 함수는 합본에서, 노출 줄은 index.html 에서) · 6절 Z4 선행, 합본 도구 `tests/helpers/inline-bundle.js`(#TASK-ES-441·#TASK-ES-465), 작업참고 기준 PR #802(L021).
- 범위: `tests/achievement-graph-multiset.test.js`(renderMultiMetricSvg) · `tests/team-fold-state-es409.test.js` · `tests/team-level-accordion-es406.test.js`(collapseAllTeamGoalAccordions) 의 잘라 읽기 원본만 바꾼다. 합본 도구에 함수 `cutFunctionWithExposure` 하나를 더한다. 제품 코드 0, 단언 문장·기대값·검사 수 0 변경, retire 0.
- 작업 유형(SNOWBALL): (가) 표준 — L021 시험지 선행과 #TASK-ES-489(괄호 짝 잘라 읽기를 합본으로) 방식. 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
세 시험지는 index.html 에서 `function X(` 부터 원래 자리 `window.X = X;` 노출 줄 앞까지를 잘라 `new Function` 으로 실행한다. 생성기(`gen-inline-hard.js`)로 함수를 세포로 옮기면 노출 줄은 index.html 원래 자리에 남고(노출 순서 보존) 함수 글자는 세포 파일로 간다. 그러면 원문만 읽는 시험지(es406)는 「원문이 있다」 단언으로, 합본을 읽는 시험지(multiset·es409)는 합본에서 함수가 노출 줄 **뒤**에 놓여 「종료점 발견」·「원문이 있다」 단언으로 실패한다(4칸 실측, 8절). 법정은 기준 커밋 시험지로 채점하므로 이 선행을 먼저 병합해야 Z4(측정지표 다중 렌더)와 Z2(개인 목표 200% 활용 가이드) 이동이 가능하다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 시험지가 「함수와 노출 줄이 한 파일 안에서 붙어 있다」를 가정한다.
- **원인**: 구간 끝을 노출 줄 위치로 잡는다 — 합본(원문 맨 앞 + 세포)으로 넓혀도 함수가 노출 줄 뒤로 가서 구간이 끊긴다(#467 에서 renderMultiMetricSvg 를 옮기지 못한 이유).
- **중심**: 함수 글자를 찾는 곳과 노출 줄을 찾는 곳을 나눈다 — 함수는 합본(세포 쪽)에서 괄호 짝으로, 노출 줄은 index.html 원문에서.
- **핵심**: 아직 원래 자리면 원문을 그대로 돌려줘 잘라 읽는 글자가 한 글자도 다르지 않게 하고, 노출 줄이 원문에서 사라지면 결과 글자에서도 빠져 기존 「종료점 발견」 단언이 그대로 실패를 알리게 한다(검사를 약하게 하지 않는다).

## 3. [원칙 ③] 해결방식
- `tests/helpers/inline-bundle.js` 에 `cutFunctionWithExposure(html, head, exposure)` 추가: 원문에 head 와 그 뒤 exposure 가 있으면 원문 그대로 반환. 아니면 `withInlineCells(html)` 의 세포 쪽(원문 길이 뒤)에서 head 를 찾아 괄호 짝(문자열·주석 건너뜀 — #TASK-ES-489 `sliceFunction` 과 같은 규칙)으로 자르고 `'\n' + 함수 + '\n' + (원문에 exposure 가 있으면 exposure)` 반환.
- 세 시험지: 잘라 읽는 원본 이름만 그 반환값(`svgSrc`·`fnSrc`)으로 바꾼다(각 3줄 + 설명 주석). 단언 줄(`assert.ok(...)`)의 글자는 그대로다.

## 4. [원칙 ④] 재검토 — 한계
- 괄호 짝 절단은 정규식 리터럴 안 괄호·따옴표를 모른다 — 두 함수에는 정규식 리터럴이 없다(글자 확인). 잘못 자르면 `new Function` 이 구문 오류로 실패하므로 조용히 통과하는 길은 없다.
- 이동 뒤에는 노출 줄 「위치」(함수 바로 뒤)를 더는 확인하지 않고 「원문에 있다」만 확인한다. 노출 줄을 원래 자리에 두는 것은 생성기 표준이고, 이동 PR 의 verify(남은 글자 동일)가 위치를 지킨다.

## 5. [원칙 ⑤] 절차
도우미 추가 → 시험지 3개 읽는 줄 교체 → 모의 이동 제품(`git archive origin/main` 사본에 `gen-inline-hard.js` + `docs/design/harness/module-split/mock-move-z4-519.json`, 커밋 안 함) → `docs/design/harness/module-split/real-move-test-z4-519.js` 로 4칸 + 노출 줄 지운 이동 제품 1칸 측정 → `npm test`.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "합본·괄호 짝으로 바꾸면 시험이 느슨해진다" → 원래 자리일 때는 원문 그대로라 잘라 읽는 글자가 같다(기준 제품에서 새 시험지 = 기준 시험지, 출력 줄 수까지 같음). 이동 뒤에는 노출 줄을 지운 제품에서 새 시험지가 「종료점 발견」·「원문이 있다」로 실패함을 쟀다(`newTestPassesWithoutExposure` = []).
- 반론 2 "도우미를 바꾸면 이 도우미를 쓰는 다른 시험지가 바뀐다" → 기존 export(`withInlineCells`·`inlineCellFiles`·`readCell`)는 한 글자도 바꾸지 않고 함수 하나만 더했다. `npm test` 종료 0.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
`tests/helpers/inline-bundle.js` `cutFunctionWithExposure` · `tests/achievement-graph-multiset.test.js` `svgSrc`·`startSvgIdx`·`endSvgIdx`·`svgFnCode` · `tests/team-fold-state-es409.test.js`·`tests/team-level-accordion-es406.test.js` `loadCollapseAll`·`fnSrc` · 측정 `docs/design/harness/module-split/real-move-test-z4-519.js`·`mock-move-z4-519.json` · 결과 `reports/TASK-ES-519/real-move.json`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
- `reports/TASK-ES-519/real-move.json`: 기준 제품에서 새 시험지 = 기준 시험지(3/3, 종료 코드·출력 줄 수·첫 오류) · 기준 시험지는 모의 이동 제품에서 3개 모두 깨짐 · 새 시험지는 모의 이동 제품에서 기준과 같음 · 노출 줄을 지운 이동 제품에서 새 시험지 3개 모두 실패.
- collapseAllTeamGoalAccordions 는 Z2 구역(「개인 목표 200% 활용 가이드」) 묶음이다 — 이 선행은 Z2 이동도 연다(오케스트레이터에 알림, Z2 는 이 두 시험지를 고치지 않는다). `team-goal-guide-hint` 는 Z2 몫으로 남긴다.
