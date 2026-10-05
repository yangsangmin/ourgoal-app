# REQ — #TASK-ES-517 시험지 선행: 인라인 3단계 구역 Z2(팀·소통) — 팀 목표 댓글 시험이 인라인 합본을 읽음

- 근거: 오케스트레이터 배정(2026-10-06, 구역 Z2 팀·소통) · 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 6절(Z2 선행: 시험지 선행 1) · 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다, retire 금지) · 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L021).
- 범위: 시험지 1개의 읽는 줄 1줄만 바꾼다. 제품 코드 0, 금고 파일 0, 단언 문장·기대값·검사 수 변경 0.
- 작업 유형(SNOWBALL): (가) 표준 — L021 시험지 선행.
- 오케스트레이터 조율(2026-10-06): 같은 모의 이전에서 깨지는 `collapseAllTeamGoalAccordions` 구간 절단 시험지 2개(`tests/team-fold-state-es409.test.js`·`tests/team-level-accordion-es406.test.js`)는 Z4 빌더의 #803(#TASK-ES-519)이 고친다 — 이 PR 은 두 파일을 건드리지 않는다. Z2 옮기기 PR 은 이 PR 과 #803 이 병합된 main 위에서 낸다.

## 1. [원칙 ①] 문제 정확히 파악

구역 Z2 의 묶음 「RENDER: 팀 목표 (팀장·매니저만 추가/수정/삭제, 팀원은 보기만)」·「개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)」를 생성기(`docs/design/harness/module-split/gen-inline-hard.js`)로 옮긴 모의 사본에서 시험지 113개 종료 코드를 기준 사본과 비교하면 통과 → 실패로 바뀌는 것이 `team-goal-comment-fix` · `team-fold-state-es409` · `team-level-accordion-es406` (그리고 신고서 갱신으로 풀리는 `module-guard`)이다. 앞 둘 중 구간 절단 2개는 #803 몫이고, 이 PR 은 `tests/team-goal-comment-fix.test.js` 하나를 맡는다 — index.html 한 파일만 읽어 `teamCommentsBlockHtml` 의 `data-cmtsend`·`data-gid` 글자와 `ensureTeamCommentsLoaded` 의 `state.profile.settings.localTeamComments[gid]` 글자를 찾는다(작업자 측정 `reports/TASK-ES-517/mock-move.json`: 옛 시험지 1개 실패).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 시험지가 재는 것은 "팀 목표 댓글 전송 단추가 gid 를 묶고, 로컬 댓글이 무손실 병합된다"는 글자인데, 읽는 곳이 index.html 한 파일로 묶여 있다.
- **원인**: `fs.readFileSync(index.html)` 만 본다 — #TASK-ES-441 인라인 합본 도구(`tests/helpers/inline-bundle.js`)를 쓰지 않는다.
- **중심**: 읽는 범위를 「index.html 원문(맨 앞) + js/tabs 앱 스코프 통로 세포(생성기 접두 L. 만 뗌)」로 넓힌다.
- **핵심**: 단언·기대값은 그대로, 읽는 줄 한 줄만 바꾼다.

## 3. [원칙 ③] 해결방식

| 시험지 | 바꾼 것 |
| :-- | :-- |
| `tests/team-goal-comment-fix.test.js` | `const indexHtml = fs.readFileSync(…)` → `require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(…))` |

## 4. [원칙 ④] 재검토 — 한계

- 설계 3절 표는 Z2 선행으로 `team-goal-guide-hint` 를 들었다. 실측(모의 이전 뒤 113개 종료 코드 비교)에서 그 시험지는 이미 합본을 읽어(#TASK-ES-488) 통과했고, 대신 `team-goal-comment-fix` 가 깨졌다 — 실측을 따랐다.
- 이 시험지는 `js/components.js` 글자도 읽는다(`readComponentsBundle`) — 바꾸지 않았다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/stage3-z2`(origin/main 7bf4c36) → 모의 사본(같은 커밋 git archive)에 Z2 두 묶음 생성기 이전 → 113개 시험지 종료 코드 기준 대비 → 이 PR 몫 1개의 읽는 줄만 바꿈 → 작업 트리·모의 사본에서 옛/새 시험지 → npm test → REQ·주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "합본을 읽으면 다른 세포 글자로 우연히 통과한다." → 합본 맨 앞이 원문 그대로라(`withInlineCells` 가 검사) 원문에 있는 글자는 원래 자리에서 먼저 찾힌다. 세포 쪽은 생성기가 L. 만 붙여 옮긴 같은 글자다. 지금 커밋에서 원문만으로도 통과하던 시험이고 기대값은 그대로다.
- 반론 2: "깨지는 시험지 셋을 한 PR 에서 다 고쳐야 옮기기가 열린다." → 구간 절단 둘은 #803 이 같은 함수로 이미 고치고 있다. 같은 파일을 두 세션이 고치면 충돌이다(전역 지침 세션 간 조율) — 나눠 맡고 옮기기는 둘 다 병합된 main 위에서 한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `tests/team-goal-comment-fix.test.js` · `tests/helpers/inline-bundle.js`(바꾸지 않음) · `reports/TASK-ES-517/mock-move.json` · `reports/TASK-ES-517/test-compare.json`.
- 함수(시험 대상, 이 PR 에서 옮기지 않음): `teamCommentsBlockHtml` · `ensureTeamCommentsLoaded`, 전역 `window.sendTeamGoalComment`(옮기지 않는 묶음).

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (출처) |
| :-- | :-- |
| 작업 트리 | 바꾼 시험지 종료 0 (`test-compare.json`) · npm test 종료 0 |
| 모의 이전 사본 | 옛 시험지 실패 → 새 시험지 통과 (`mock-move.json`) |
| 막힐 지점 | #803 병합 순서(옮기기 PR 은 둘 다 병합 뒤) · main 이동(L010) |

[4단계: 심사 청구]
