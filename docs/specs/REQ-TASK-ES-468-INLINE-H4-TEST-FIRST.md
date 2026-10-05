# REQ — #TASK-ES-468 시험지 인라인 합본 읽기 (인라인 어려움 구역 H4 선행)

- 근거: 헌법 v2026.10.05-CELL 세포골격 절(CELL_SPLIT 3 시험지 선행), 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-6절, 선례 #TASK-ES-441·#TASK-ES-451 — 시험지가 index.html 대신 「인라인 합본」(tests/helpers/inline-bundle.js: index.html 원문 맨 앞 + js/tabs 세포, L. 접두 제거)을 읽는다.
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로" → 어려움 구역 H4 의 「전역 공유 팀 로더 & 렌더링 (#TASK-ES-133)」 묶음은 시험지 선행 실측(`scripts/inline-hard-test-probe.js --only G133`)에서 이 시험지 하나가 깨진다. 시험지 범위만 넓히는 선행 PR.
- 범위: tests/team-creation-clean.test.js 1줄. 단언·기대값·검사 수 그대로, 지운 단언 0, 제품 코드 변경 0.

## 1. [원칙 ①] 문제 정확히 파악
팀 만들기 창(`promptNewGroup`)을 소통 탭 세포로 옮기면 이 시험지의 단언(팀 만들기 안내 문구·무제한 정원 등 기본값 글자)이 index.html 에서 글자를 못 찾아 깨진다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 시험이 "그 코드가 있는가"를 파일 위치에 묶어 두어, 동작 그대로 옮기는 세포화를 막는다.
- **원인**: 시험지가 `fs.readFileSync(index.html)` 한 파일만 읽는다.
- **중심**: 읽는 글자의 범위(index.html → 인라인 합본).
- **핵심**: 다른 시험지와 같은 도우미 `withInlineCells` 로 바꾼다. 원문이 맨 앞이라 아직 인라인에 있는 글자는 같은 자리에서 찾힌다.

## 3. [원칙 ③] 해결방식
`const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');` → `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(indexHtmlPath, 'utf8'))`.

## 4. [원칙 ④] 재검토 — 한계
합본은 js/tabs 세포 전체를 붙이므로, 다른 세포에 같은 글자가 있으면 그것도 찾힌다(includes 단언이 더 느슨해질 수 있음). 부재 단언(`<select id="grpMaxMembers">` 등 5개)은 합본이 더 넓어 오히려 더 엄격해진다. 있음 단언 글자는 팀 만들기 창의 고유 글자다.

## 5. [원칙 ⑤] 절차
origin/main 위 브랜치 → 시험지 1줄 → 모의 이동(main 사본에서 생성기 `gen-inline-hard.js` 로 묶음을 `js/tabs/comm/shared-groups.js` 로 옮김) → 옛·새 시험지 실행 → 기록.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "시험을 약하게 만든다." → 단언 23개·기대값 그대로(`mock-move.json` sameAssertCount), 바뀐 것은 읽는 범위뿐이고 지금 main 에서도 통과한다.
- 반론 2: "옮기지 않았는데 미리 바꿀 이유가 없다." → 모의 이동에서 옛 시험지는 실패(종료 1), 새 시험지는 통과(종료 0) — 다음 세포화 PR 이 시험지 때문에 막히지 않게 하는 선행이다(법정은 기준 커밋의 시험지로 채점한다).

## 7. [원칙 ⑦] 단계별 실행 — 식별자
함수 `promptNewGroup`, `withInlineCells`, 파일 `tests/team-creation-clean.test.js`, `tests/helpers/inline-bundle.js`, `reports/TASK-ES-468/mock-move.json`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 |
| :-- | :-- |
| 모의 이동 뒤 옛 시험지 | 종료 1(「팀 만들기 모달 안내 문구 탑재 확인」) |
| 모의 이동 뒤 새 시험지 | 종료 0 |
| 지금 main 에서 새 시험지 | 종료 0 |
| 단언 수 | 23 → 23 |

[4단계: 심사 청구]
