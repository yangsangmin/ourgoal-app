# REQ — #TASK-ES-563 시험지 선행: 확인창 시험의 「처리기는 confirm.js 뒤」 검사가 인라인 합본을 읽음(인라인 3단계 Z2 2차 선행)

- 근거: 오케스트레이터 배정(2026-10-06, 구역 Z2 팀·소통) · 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수 0 변경, retire 금지) · 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L021).
- 범위: `tests/core-confirm-es376.test.js` 한 줄의 읽는 범위만 바꾼다. 제품 코드 0, 금고 0, 단언 문장·기대값·검사 수 0 변경.
- 작업 유형(SNOWBALL): (가) 표준 — L021.

## 1. [원칙 ①] 문제 정확히 파악

#TASK-ES-552(PR #824 — 「개인 목표 200% 활용 가이드」 묶음 이전)를 origin/main eb80540 위에 다시 생성하자, 시험지 종료 코드 비교에서 `tests/core-confirm-es376.test.js` 가 기준 통과 → 작업 실패로 바뀌었다(작업자 측정 `reports/TASK-ES-563/mock-move.json`). 실패 단언은 「처리기는 confirm.js 뒤」 — index.html 원문에서 `if(!(await OurgoalCapabilities.call('ui.confirm', ` 첫 위치를 찾는다. #822(TASK-ES-545)가 blockUser 쪽을 세포로 옮긴 뒤 index.html 에 남은 이 글자는 2곳이고, 둘 다 #824 가 옮기는 openLevelGroupDetailModal·openTeamGoalEditModal 안이다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 검사는 「공용 확인창 통로(confirm.js)를 쓰는 처리기 글자가 통로보다 뒤에 있다」를 본다. 처리기가 세포로 옮겨 가도 같은 처리기 글자다.
- **원인**: 그 한 줄만 index.html 원문(`HTML`)을 읽는다. 같은 시험지의 19곳 줄 세기는 이미 인라인 합본(`HTML_CELLS`, #TASK-ES-441)을 읽는다.
- **중심**: 그 한 줄의 읽는 범위를 같은 시험지에 이미 있는 `HTML_CELLS` 로 넓힌다.
- **핵심**: 단언·기대값 그대로. 합본 맨 앞이 원문이라 원문에 글자가 있으면 같은 위치를 찾는다(지금 커밋에서 값이 같다).

## 3. [원칙 ③] 해결방식

| 시험지 | 바꾼 것 |
| :-- | :-- |
| `tests/core-confirm-es376.test.js` | `const inline0 = HTML.indexOf(…)` → `HTML_CELLS.indexOf(…)` |

## 4. [원칙 ④] 재검토 — 한계

- 처리기가 모두 세포로 옮겨 가면 그 위치는 합본의 세포 쪽(원문 길이 뒤)이 되어 confirm.js 태그 위치보다 항상 뒤다 — 검사는 「처리기 글자가 어딘가에 있다」 쪽으로 넓어진다. 세포 파일 태그 순서(confirm.js → 세포)는 이 시험이 아니라 index.html 태그 순서·법정 모듈 로드 탐침이 본다. 단언은 바꾸지 않았고, 글자가 아예 없으면(-1) 여전히 실패한다.

## 5. [원칙 ⑤] 절차

origin/main eb80540 위 브랜치 → #824 생성기 결과 사본에서 옛/새 시험지 실행 → 한 줄 바꿈 → 작업 트리 시험지 → REQ·주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: 「합본을 읽으면 검사가 약해진다.」 → 같은 시험지의 다른 검사가 이미 합본을 읽는 표준(#TASK-ES-441·#488)이다. 글자가 사라지면 -1 이라 단언이 실패한다 — 제거·약화가 아니라 읽는 곳만 넓힘.
- 반론 2: 「#824 에서 두 함수를 원래 자리에 두면 선행이 필요 없다.」 → 두 함수는 그 묶음의 핵심(팀 수준별 조 창·팀 목표 편집 창)이고, 남기면 다음 이전 때 같은 선행이 다시 필요하다. 한 줄 선행이 더 작은 변경이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `tests/core-confirm-es376.test.js`(`inline0`) · `tests/helpers/inline-bundle.js`(바꾸지 않음) · `reports/TASK-ES-563/mock-move.json` · `reports/TASK-ES-563/test-compare.json`.
- 함수(시험 대상, 이 PR 에서 옮기지 않음): `openLevelGroupDetailModal` · `openTeamGoalEditModal`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (출처) |
| :-- | :-- |
| 작업 트리 | 바꾼 시험지 종료 0 (`test-compare.json`) |
| 모의 이전 사본(#824 생성기 결과) | 옛 시험지 실패 → 새 시험지 통과 (`mock-move.json`) |

[4단계: 심사 청구]
