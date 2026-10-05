# REQ — #TASK-ES-497 인라인 「어려움」 구역 H2 3차 (목표 탭 「팀목표」 하위 탭 화면)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 코디네이터 배정(구역 H2) · 헌법 v2026.10.05-CELL(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` 2-7 · 시험지 선행 #TASK-ES-488(PR #779) · 2차 #TASK-ES-493(PR #786).
- 범위: 묶음 「개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)」의 팀 목표 화면 함수 `renderTeamGoalsScreen` 하나(771줄). 기능 추가·삭제 0, 마크업·CSS 0, 동결 0, 시험 기대값 0, 생성 지도 3종 커밋 0.

## 1. [원칙 ①] 문제 정확히 파악

1. `renderTeamGoalsScreen` 은 index.html 인라인에 남은 가장 큰 함수 중 하나다(771줄 — 같은 묶음 1,956줄은 800줄 초과 유형 G).
2. 2차(#786)에서 이 묶음의 팀 만들기 안내·활용 가이드를 먼저 옮겼고, 화면 본체는 PR 크기(1,500줄 안)를 맞추려 이번으로 넘겼다.
3. 게스트는 팀이 0개라 이 함수의 빈 안내 분기만 화면에서 잴 수 있다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 목표 탭 「팀목표」 화면 전체가 index.html 한 스코프 안에 있어 그 화면만 따로 읽고 고칠 수 없다.
- **원인**: 함수가 다른 묶음 이름 수십 개(`state`·`MOCK_GROUPS`·`canManageTeamGoals`·`teamCommentsBlockHtml`·`collapseAllTeamGoalAccordions` 등)를 직접 쓰고, window 노출 줄로 다른 파일이 찾는다.
- **중심**: 함수 하나를 글자 그대로 옮기고, 쓰는 인라인 이름은 생성기가 L getter 로 이어 주는 것.
- **핵심**: window 노출 줄·일괄 접기 함수는 원래 자리. 새 파일은 800줄 이하(798줄)이고 줄 수가 아니라 「팀목표 화면」 책임 하나다.

## 3. [원칙 ③] 해결방식

| 묶음 | 옮긴 것 | 원래 자리에 남긴 것 | 새 세포 |
| :-- | :-- | :-- | :-- |
| 200% 가이드 | `renderTeamGoalsScreen` | window 노출 줄, `collapseAllTeamGoalAccordions`(시험지가 원래 자리 노출 줄까지 잘라 읽음), `renderPersonalGoalsEmptyGuideHtml`·`isMockGroup`·`getGroupLevelGoals`·`openLevelGroupDetailModal`·`openTeamGoalEditModal`(게스트 화면으로 못 잼) | `js/tabs/goals/team-goals-screen.js`(798줄, `OurgoalGoalsKit`) |

## 4. [원칙 ④] 재검토 — 한계

- 게스트(팀 0개) 시나리오·조작 비교는 빈 안내 분기만 잰다. 팀이 있는 분기(팀 필터 칩·팀 목표 카드·마일스톤·할 일·댓글)는 글자 그대로 옮김(verify 토큰 동일)으로만 보증하고, 화면 비교는 실계정 팀 소속이 있어야 한다 — 운영 실계정으로 팀을 만들면 운영 DB 에 쓰므로(되돌리기 어려운 바깥 행위) 하지 않았다.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h2`(브랜치 `feat/2026-10-05-task-es-497-inline-h2-3`) → 설정 `inline-h2-pr3.json` → 생성기 → verify → 신고서·설명 → 커밋 → main(2차 병합 뒤) 합치고 재생성 → 모듈 로드 탐침 · 시나리오 기준/작업 · 조작 비교(기준 2회·후 1회) · 시험 기준/후 → 주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "771줄 함수를 통째로 옮기면 800줄 상한에 걸린다." → 머리 설명·통로 줄을 더해도 798줄(verify ④ 800줄 이하). 함수 하나가 한 책임(팀목표 화면)이라 줄 수로 자르지 않는다(헌법 CELL_SPLIT 7, -part 분할 금지).
- 반론 2: "게스트가 빈 안내만 보므로 옮긴 코드 대부분을 화면으로 안 쟀다." → 맞다(4절). 대신 옮긴 글자 전부의 토큰열이 같고(verify ①②), 남은 글자도 같으며(③), 함수가 쓰는 인라인 이름은 모두 getter 가 있다(④ 미노출 0). 팀 분기를 지우거나 바꾼 것이 없다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#btnGoalsSubTeam`·`#btnGoalsSubPersonal`, `#teamGoalsView`, `[data-tgexampletab]`, `[data-tgtplquick]`, `#tgFilterChipRow`(팀 있을 때).
- 함수: `renderTeamGoalsScreen`, `collapseAllTeamGoalAccordions`(남김). 파일: `index.html`, `js/tabs/goals/team-goals-screen.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-h2-pr3.json`·`dom-steps-inline-h2-pr3.js`, `reports/TASK-ES-497/*`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main 2192c35(`git archive` 사본). 2차·측정기 수정 두 건(#786·#792·#794)이 병합된 뒤 main 을 합쳐 생성기를 다시 돌렸다(손으로 푼 충돌 0). 그 뒤 main(89254e4 — #793)을 한 번 더 합쳐 재생성하고 verify·모듈 로드 탐침(회귀 0)·시나리오(기준·작업 통과)를 다시 쟀다(조작 비교·시험 비교는 2192c35 기준 값).

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-inline-hard.js` | 옮긴 함수 1개 토큰열 동일, 표지 구간 줄 단위 동일, 남은 글자 96307토큰 동일, 누수·미노출·setter 빠짐·남은 정의·안 가져온 사용·this/arguments 0, 처리기 333 = 290 + 43, 새 파일 798줄 (`verify-inline-hard-pr3.json` ok — 마지막 합침 89254e4 기준 값) |
| 줄 수 | 생성기 메타 | index.html −753줄 (`gen-meta-pr3.json`) |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 단독 로드 ok (`module-load-probe-pr3.json`) |
| 화면 시나리오 | `court/lib/scenario.js` 로컬 | `goals-team-screen` 기준·작업 통과, 약점 0 (`scenario-local.json`) |
| 조작 전후(게스트) | `dom-compare-inline-h2.js` | 10단계 × 10칸 = 100값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (`dom-compare-pr3.json`) |
| 시험 | `test-compare-inline-p2.js` | smoke 443/0 기준=후, 작업 npm test 종료 코드 0, 모듈 가드 ⑤ 0(측정기 수정 #792·#794 뒤). tests 종료 코드가 다른 것은 git 이력 없는 기준 사본에서만 실패하는 세포지도 이력 비교 1건 (`test-compare-pr3.json`) |

[4단계: 심사 청구]
