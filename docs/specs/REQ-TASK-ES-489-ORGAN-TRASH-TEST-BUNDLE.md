# REQ — #TASK-ES-489 시험지 선행: core-confirm-es376 의 함수 잘라 읽기가 인라인 합본을 읽음(인라인 어려움 기관 묶음 #TASK-ES-482 선행)

- 근거: 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다), `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-6, 합본 도구 `tests/helpers/inline-bundle.js`(#TASK-ES-441·#TASK-ES-465 — js/core 이전 세포 포함).
- 범위: `tests/core-confirm-es376.test.js` 의 `sliceFunction` 이 잘라 오는 원본 이름 `HTML` → `HTML_CELLS`(같은 파일 13번째 줄에 이미 있는 합본). 제품 코드 0, 단언·기대값·검사 수 0 변경, retire 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
「전역 7일 유예 통합 휴지통」 함수(`permanentDeleteFromTrash`·`emptyTrash`)를 기관 세포 `js/core/trash-bin.js` 로 옮기면(#TASK-ES-482), 이 시험지가 index.html 글자에서 그 함수를 잘라 실행하다 "index.html 에 … 가 있다" 단언으로 실패한다. 법정은 기준 커밋 시험지로 채점하므로 시험지를 먼저 병합해야 한다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 시험지가 "함수가 index.html 에 있다"를 가정한다.
- **원인**: `sliceFunction` 만 원문(`HTML`)을 읽고, 같은 파일의 다른 검사는 이미 합본(`HTML_CELLS`)을 읽는다.
- **중심**: 잘라 오는 원본을 같은 파일의 합본으로 바꾼다.
- **핵심**: 합본은 원문을 맨 앞에 두고 세포 글자의 `L.` 접두만 뗀다 — 아직 인라인에 있는 함수(`blockUser`·`purgeSampleRecordsOneClick`)는 원래 자리에서 먼저 찾히고, 옮긴 함수는 이전 전 글자 그대로 찾힌다.

## 3. [원칙 ③] 해결방식
`sliceFunction` 몸통의 `HTML` 8곳 → `HTML_CELLS`, 설명 주석 1줄.

## 4. [원칙 ④] 재검토 — 한계
「한 곳뿐이다」 단언은 합본 전체에서 센다 — 옮긴 함수가 원문과 세포에 둘 다 있으면 실패하므로 오히려 이중 정의를 막는다.

## 5. [원칙 ⑤] 절차
시험지 → `real-move-test-organ-482.js` 로 기준·이동 제품 × 기준·새 시험지 4칸 측정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "합본이면 시험이 느슨해진다" → 단언 문장·기대값·검사 수가 그대로이고, 세포 글자는 옮긴 원문 글자 그대로다(옮기기 PR verify 가 토큰 동일을 잰다).
- 반론 2 "다른 잘라 읽기 대상이 바뀐다" → 원문이 맨 앞이라 인라인에 남은 함수는 원래 자리에서 찾힌다. 기준 제품에서 새 시험지 결과가 기준 시험지와 같음을 쟀다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
`tests/core-confirm-es376.test.js` `sliceFunction`·`HTML_CELLS`, 측정 `docs/design/harness/module-split/real-move-test-organ-482.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
`reports/TASK-ES-489/real-move.json`: 새 시험지·기준 제품 = 기준 시험지·기준 제품, 기준 시험지는 이동 제품에서 깨짐, 새 시험지는 이동 제품에서 기준과 같음. 이 시험지는 #TASK-ES-465 의 기관 선행 실측 때 휴지통 묶음이 모의 이전에 들어 있지 않아 빠졌다 — 이동 뒤 tests 전부 비교에서 발견.
