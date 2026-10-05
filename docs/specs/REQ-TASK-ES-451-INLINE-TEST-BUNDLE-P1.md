# REQ — #TASK-ES-451 시험지 인라인 합본 읽기 (인라인 세포화 P1 구역 선행)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절, 선례 #TASK-ES-441(#751)·#TASK-ES-447(#753) — 시험지가 index.html 대신 「인라인 합본」(tests/helpers/inline-bundle.js: index.html 원문 맨 앞 + js/tabs 세포, L. 접두 제거)을 읽는다.
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로" → P1 구역 1차(#752)에서 `refreshGoalStatusSummary` 는 이 시험지가 index.html 한 파일에서 가드 글자를 찾아 옮기지 못했다. 시험지 범위만 넓히는 선행 PR.
- 범위: tests/ai-conditional-call-optimization.test.js 1줄. 단언·기대값·검사 수 그대로, 지운 단언 0, 제품 코드 변경 0.

## 1. [원칙 ①] 문제 정확히 파악
`refreshGoalStatusSummary`(목표 종합상황 AI 요약 새로 고침)를 세포로 옮기면 이 시험지의 단언 2개(멱등성 가드·날짜 변동 가드 글자)가 index.html 에서 글자를 못 찾아 깨진다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 시험이 "그 코드가 있는가"를 파일 위치에 묶어 두어, 동작 그대로 옮기는 세포화를 막는다.
- **원인**: 시험지가 `fs.readFileSync(index.html)` 한 파일만 읽는다.
- **중심**: 읽는 글자의 범위(index.html → 인라인 합본).
- **핵심**: 다른 시험지와 같은 도우미 `withInlineCells` 로 바꾼다. 원문이 맨 앞이라 아직 인라인에 있는 글자는 같은 자리에서 찾힌다.

## 3. [원칙 ③] 해결방식
`const indexHtml = fs.readFileSync(indexPath, 'utf8');` → `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(indexPath, 'utf8'))`.

## 4. [원칙 ④] 재검토 — 한계
합본은 js/tabs 세포 전체를 붙이므로, 다른 세포에 같은 글자가 있으면 그것도 찾힌다(includes 단언이 더 느슨해질 수 있음). 지금 찾는 글자 8개는 각각 한 함수의 고유 글자다.

## 5. [원칙 ⑤] 절차
origin/main 위 브랜치 → 시험지 1줄 → 모의 이동(main 사본에서 생성기로 `refreshGoalStatusSummary` 를 세포로 옮김) → 옛·새 시험지 실행 → 기록.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "시험을 약하게 만든다." → 단언 35개·기대값 그대로(`mock-move.json` sameAssertCount), 바뀐 것은 읽는 범위뿐이고 지금 main 에서도 통과한다.
- 반론 2: "옮기지 않았는데 미리 바꿀 이유가 없다." → 모의 이동에서 옛 시험지는 실패(종료 1), 새 시험지는 통과(종료 0) — 다음 세포화 PR 이 시험지 때문에 막히지 않게 하는 선행이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
함수 `refreshGoalStatusSummary`, `withInlineCells`, 파일 `tests/ai-conditional-call-optimization.test.js`, `tests/helpers/inline-bundle.js`, `reports/TASK-ES-451/mock-move.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 |
| :-- | :-- |
| 모의 이동 뒤 옛 시험지 | 종료 1(「refreshGoalStatusSummary 기존 멱등성 가드 보존 확인」) |
| 모의 이동 뒤 새 시험지 | 종료 0 |
| 지금 main 에서 새 시험지 | 종료 0 |
| 단언 수 | 35 → 35 |

[4단계: 심사 청구]
