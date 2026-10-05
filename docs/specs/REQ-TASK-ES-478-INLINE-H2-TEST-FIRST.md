# REQ — #TASK-ES-478 시험지 선행: 인라인 어려움 구역 H2(목표 탭 루틴·팀 목표) 시험지가 인라인 합본을 읽음

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 코디네이터 배정(구역 H2) · 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다, retire 금지) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-6.
- 범위: 시험지 7개의 읽는 범위만 바꾼다. 제품 코드 0, 금고 파일 0, 단언 문장·기대값·검사 수 변경 0.

## 1. [원칙 ①] 문제 정확히 파악

구역 H2 의 남은 묶음(「[#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달」·「목표 보관(기록으로 옮기기)」·「개인 목표 200% 활용 가이드 & 템플릿 백과사전」)의 함수를 생성기로 옮긴 모의 사본에서, index.html 한 파일만 읽는 시험지 7개가 실패한다(작업자 측정 `reports/TASK-ES-478/mock-move.json`: 옛 시험지 7개 실패). 법정은 기준 커밋의 시험지로 채점하므로, 이 시험지를 먼저 고쳐 병합하지 않으면 옮기기 PR 이 돌려보내진다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지가 재는 것은 "그 코드가 있다·그 코드가 이렇게 돈다"인데, 읽는 곳이 index.html 한 파일로 묶여 있어 코드가 세포로 옮겨 가면 같은 코드를 못 찾는다.
- **원인**: 7개 시험지가 `fs.readFileSync(index.html)` 만 본다. #TASK-ES-441 의 인라인 합본 도구(`tests/helpers/inline-bundle.js`)를 아직 쓰지 않았다.
- **중심**: 읽는 범위를 「index.html 원문(맨 앞) + js/tabs 의 앱 스코프 통로 세포(생성기 접두 L. 만 뗌)」로 넓히는 것.
- **핵심**: 단언·기대값은 그대로, 읽는 줄 한 줄만 바꾼다. 확인창 시험(core-confirm-es376)의 「기본 확인창은 루틴 삭제 2곳만 남는다」 검사는 합본 전체를 읽으면 이미 세포였던 파일의 확인창까지 세게 되므로(작업자 측정: 5줄 더 잡힘), 그 2곳이 옮겨 갈 파일(`js/tabs/goals/routine-screen.js`, 있을 때만) 하나만 더한다.

## 3. [원칙 ③] 해결방식

| 시험지 | 바꾼 것 |
| :-- | :-- |
| `tests/routine-detail-modal.test.js` · `team-fold-state-es409` · `team-goal-guide-hint` · `team-level-management` · `team-tasks-toggle-es410` · `team-goals-collapse-default` | `const indexHtml = fs.readFileSync(…)` → `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(…))` |
| `tests/core-confirm-es376.test.js` | 「기본 확인창 2곳만」 검사의 읽는 글자 `HTML` → `HTML_ROUTINE`(원문 + `js/tabs/goals/routine-screen.js` 있을 때만, L. 접두 뗌). 19곳 줄 세기·태그 순서 검사는 그대로 |

## 4. [원칙 ④] 재검토 — 한계

- `team-level-accordion-es406` 는 처음 실측에서 깨졌으나, 원인이 `collapseAllTeamGoalAccordions` 를 옮긴 것(시험이 함수 시작~원래 자리 window 노출 줄 사이를 잘라 냄)이라 옮기기 PR 에서 그 함수를 원래 자리에 두기로 했다 — 이 시험지는 바꾸지 않았다(모의 사본에서 옛 시험지 그대로 통과).
- core-confirm 은 옮겨 갈 파일 이름(`routine-screen.js`)을 미리 적는다. 이름이 바뀌면 이 검사는 루틴 2곳을 못 찾아 실패한다 — 옮기기 PR 이 그 이름을 쓴다(구역 H2 생성기 설정).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h2-tf`(origin/main 91d1496) → 모의 사본(같은 커밋 git archive)에 구역 H2 남은 묶음 이전 → 깨지는 시험지 목록 → 읽는 줄만 바꿈 → 작업 트리 npm test·바꾼 시험지 → 모의 사본에서 새 시험지 → REQ·주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본을 읽으면 시험이 더 쉽게 통과한다(다른 세포 글자가 우연히 맞는다)." → 합본 맨 앞이 원문 그대로라 원문에 있는 글자는 원래 자리에서 먼저 찾힌다(`withInlineCells` 가 검사). 세포 글자는 L. 접두만 뗀 옮긴 글자라 같은 코드다. 지금 커밋에서 바꾼 7개 모두 통과(기대값 그대로 — 원문만으로도 통과하던 것).
- 반론 2: "core-confirm 에 미래 파일 이름을 적는 것은 시험이 아니라 예약이다." → 검사 문장은 「인라인 스크립트의 기본 확인창은 루틴 삭제 2곳만」이고, 그 2곳이 옮겨 가도 같은 인라인 코드다. 합본 전체를 쓰면 기대값을 바꿔야 해서(헌법 위반) 옮겨 갈 파일 하나로 범위를 정확히 맞췄다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: 위 3절 표, `tests/helpers/inline-bundle.js`(바꾸지 않음), `reports/TASK-ES-478/mock-move.json`·`test-compare.json`.
- 함수(시험 대상, 옮기지 않음): `openRoutineDetailModal`·`renderRoutineGoalsScreen`·`collapseAllTeamGoalAccordions`·`renderTeamGoalsScreen`·`renderTeamGoalsEmptyGuideHtml`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 |
| :-- | :-- |
| 작업 트리 | npm test 종료 코드 0, smoke 443/0 · 무결성 38/38, 바꾼 시험지 7개 모두 통과 (`test-compare.json`) |
| 모의 이전 사본 | 옛 시험지 7개 실패 → 새 시험지 7개 모두 통과 (`mock-move.json`) |

[4단계: 심사 청구]
