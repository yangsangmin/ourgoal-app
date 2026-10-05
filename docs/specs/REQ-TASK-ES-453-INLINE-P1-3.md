# REQ — #TASK-ES-453 인라인 스크립트 세포화 P1 구역 3차: 목표 종합상황 새로 고침 세포 이전

- 근거: 헌법 v2026.10.05-CELL 세포골격 절, `docs/specs/MODULE-SPLIT-PROTOCOL.md`. 선례: P1 1차 #TASK-ES-436(#752)·2차 #TASK-ES-444(#756), 시험지 선행 #TASK-ES-451(#757).
- 지시(2026-10-05, 상민님): "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" → P1 구역에서 마지막으로 남은 함수 `refreshGoalStatusSummary` 를 옮긴다.
- 범위: 함수 1개(구획 「현재 종합상황 (AI 요약)」 통째, 48줄) → `js/tabs/goals/ai-status-refresh.js`(73줄). 기능 추가·삭제 0, 동결 파일 0, 시험 기대값 변경 0.
- 코디네이터 공지 반영: 기준선(module-baseline)·세포지도(cell-map)·인라인 지도(inline-script-map)는 커밋하지 않고(main 판 그대로) 주장에도 걸지 않는다. main 이 움직이면 바뀌는 전체 수치는 주장에 쓰지 않는다.

## 1. [원칙 ①] 문제 정확히 파악
#TASK-ES-436 에서 tests/ai-conditional-call-optimization 이 index.html 한 파일에서 이 함수의 가드 글자 2개를 찾아 옮기지 못했다. #TASK-ES-451 이 그 시험지를 인라인 합본 읽기로 바꿨다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 목표 종합상황 요약(AI 호출 절약 가드 포함)이 3만 줄 IIFE 에 남아, 같은 묶음의 다른 함수(1차에서 `js/tabs/goals/ai-status.js` 로 옮김)와 떨어져 있었다.
- **원인**: 시험지의 파일 위치 의존.
- **중심**: 시험지 범위(#757)와 이 함수의 이동.
- **핵심**: 같은 생성기로 구획째 옮기고, #757 과 같은 시험지 줄을 같은 글자로 함께 실어 병합 순서와 무관하게 깨지지 않게 한다.

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-p1-453.json`, 이음매는 IIFE 머리 [#TASK-ES-370] 목표 탭 이음매 다음(가져오기 1줄 + getter 1개). 묶음의 다른 함수는 이미 세포에 있어 이번에는 구획 주석까지 통째로 옮겨졌다.

## 4. [원칙 ④] 재검토 — 한계
- 종합상황 요약 칸(`#goalStatusText`)은 「현재 종합상황」 막대를 펼쳐야 보인다(기본 접힘). 시나리오는 펼친 뒤 확인한다.
- 게스트 조작 비교에서 부팅 직후 저장 시점에 따라 같은 앱에서도 `lastStreakAwarded` 칸이 있다 없다 해서(기준 대 기준 3값) 그 칸만 맞대지 않게 했다(`dom-compare-inline-p1.js`).

## 5. [원칙 ⑤] 절차
origin/main 위 브랜치 → 설정 → 생성기 → verify → 등록(cell-descriptions·modules 만) → main(#756·#757) 합치고 다시 생성 → 시험 비교·게스트 조작 비교·시나리오 → 문서 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "목표 상세 렌더 세포(goal-detail-events.js)가 `L.refreshGoalStatusSummary` 로 부르는데 이제 세포 함수다." → app-scope getter 가 IIFE 머리에서 가져온 같은 함수 값을 돌려준다(이전 getter 그대로). 측정: 템플릿 담기 → 요약 칸이 기준과 같은 글로 채워짐(시나리오), 게스트 조작 90값 차이 0.
- 반론 2: "#757 과 같은 줄을 두 PR 이 고치면 충돌한다." → 같은 글자라 git 이 깨끗이 합친다(이미 #757 병합 뒤 main 을 합쳐 차이 0).

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#goalStatusToggleBtn`·`#goalStatusText`·`.ms-status`, 함수 `refreshGoalStatusSummary`·`computeGoalStatusHash`·`generateGoalStatusSummary`, 파일 `index.html`·`js/tabs/goals/ai-status-refresh.js`·`tests/ai-conditional-call-optimization.test.js`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 |
| :-- | :-- |
| verify | 토큰 동일, 덩어리 48줄 줄 단위 동일, index.html 나머지 그대로, 누수 0 |
| 모듈 로드 탐침 | 회귀 0 |
| 게스트 조작 | 9단계 90값, 기준 대 후 0, 기준 대 기준 0 |
| 시나리오 | goals-status-summary-refresh 기준·후 통과 |
| 시험 | npm test 0/0, tests 종료 코드·출력 같음 |

[4단계: 심사 청구]
