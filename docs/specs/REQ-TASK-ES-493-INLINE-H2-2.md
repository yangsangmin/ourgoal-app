# REQ — #TASK-ES-493 인라인 「어려움」 구역 H2 2차 (목표 탭 루틴 하위 탭 화면 · 팀 만들기 안내/활용 가이드)

- 근거: 상민님 원문(2026-10-05) "미분화 덩어리 분열 작업을 우선순위로 해야하지 않나?" · 코디네이터 배정(구역 H2) · 헌법 v2026.10.05-CELL(CELL_SPLIT · CELL_SPLIT_PROOF · claims_hygiene) · 설계 `docs/architecture/INLINE-HARD-SPLIT-DESIGN.md` · 시험지 선행 #TASK-ES-488(PR #779, 병합) · 1차 #TASK-ES-481(PR #781, 병합).
- 범위: 묶음 「[#TASK-ES-172] [27] 목표 탭: 데일리 루틴 서브탭 & 편집/상세 모달」(2단계) · 「개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)」(3단계, 1,956줄 — 책임 단위로 일부). 기능 추가·삭제 0, 마크업·CSS 0, 동결 0, 시험 기대값 0, 생성 지도 3종 커밋 0.

## 1. [원칙 ①] 문제 정확히 파악

1. 두 묶음은 index.html 인라인에 남은 목표 탭 화면 코드 중 가장 큰 덩어리다(루틴 하위 탭 약 700줄, 200% 가이드 묶음 약 1,950줄 — 800줄 초과 유형 G).
2. 시험지 7개가 index.html 한 파일만 읽어 옮기면 깨졌다 → #TASK-ES-488 로 읽는 범위를 먼저 넓혔다(병합).
3. 할 일: 게스트 화면에서 잴 수 있는 책임만 세포로 옮긴다(#745 판례 · #762·#781 선례).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 목표 탭 「루틴」 화면과 「팀목표」 빈 안내가 index.html 한 스코프에 묻혀 있어 따로 읽고 고칠 수 없다.
- **원인**: 두 묶음은 window 노출 줄·다른 묶음 이름 참조(`promptNewGroup`·`MOCK_GROUPS`·`openTeamInviteModal` 등)에 기대어 1차 생성기로 옮길 수 없었고, 200% 가이드 묶음은 800줄을 넘어 책임으로 나눠야 했다.
- **중심**: 한 묶음 안에서 무엇을 함께 옮기고 무엇을 남기는가 — 책임 단위(루틴 화면 / 팀 안내)와 게스트 화면으로 잴 수 있는가.
- **핵심**: 옮긴 함수는 같은 이름으로 가져오고, window 노출 줄·남긴 함수는 원래 자리. 다른 묶음 이름은 생성기가 L getter 를 단다.

## 3. [원칙 ③] 해결방식

| 묶음 | 옮긴 것 | 원래 자리에 남긴 것(이유) | 새 세포 |
| :-- | :-- | :-- | :-- |
| 데일리 루틴 서브탭 | `renderRoutineGoalsScreen` · `openAddRoutineModal` | window 노출 줄, `openRoutineDetailModal`(게스트 시드에 루틴이 없어 여는 카드·「수정」 단추가 화면에 없다) | `js/tabs/goals/routine-screen.js`(562줄) |
| 200% 가이드(1,956줄) | `renderTeamCreateHeroCardHtml` · `renderTeamGoalsEmptyGuideHtml` · `wireTeamGoalsGuideEvents` · `getTeamGoalTemplatePreset` | window 노출 줄, `renderPersonalGoalsEmptyGuideHtml`(게스트는 개인 목표가 있어 빈 안내가 안 보임), `isMockGroup`, `getGroupLevelGoals`·`openLevelGroupDetailModal`·`openTeamGoalEditModal`(팀이 있어야 열림 — 게스트는 팀 0개), `collapseAllTeamGoalAccordions`(시험지가 함수 시작~원래 자리 노출 줄을 잘라 읽음), `renderTeamGoalsScreen`(다음 PR — 이 PR 을 1,500줄 안으로) | `js/tabs/goals/team-goals-guide.js`(460줄) |

- 머리 이음매는 `/* [어려움 이음매 자리 H2] */` 아래(가져오기 5줄 · 새 getter 7개). 세포 태그는 목표 탭 `index.js` 태그 바로 앞 같은 줄. 새 전역 0.

## 4. [원칙 ④] 재검토 — 한계

- 팀 목표 화면 본체(`renderTeamGoalsScreen`)는 게스트에게 빈 안내 분기만 보인다 — 팀이 있는 분기는 실계정(팀 소속)이 있어야 잰다. 다음 PR 에서 옮길 때도 게스트 시나리오는 빈 안내 분기만 잰다.
- `openRoutineDetailModal`·`openTeamGoalEditModal`·수준별 목표 창은 게스트 화면에서 여는 길이 없다 — 옮기지 않고 보고한다(고치지 않음).

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/inline-h2`(브랜치 `feat/2026-10-05-task-es-493-inline-h2-2`, origin/main cb0328d) → 게스트 화면 닿음 확인(시나리오 탐침) → 설정 `inline-h2-pr2.json` → 생성기 → verify → 신고서·설명 → 커밋 → 모듈 로드 탐침 · 시나리오 기준/작업 · 조작 비교(기준 2회·후 1회) · 시험 기준/후 → REQ·주장 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "`getTeamGoalTemplatePreset` 은 「팀 목표 편집」 구획에 있었는데 안내 세포로 보내면 책임이 섞인다." → 이 함수가 하는 일은 빠른 템플릿 이름 → 팀 만들기 프리셋 변환이고, 게스트 화면에서 부르는 곳은 안내의 빠른 템플릿 단추뿐이다(`wireTeamGoalsGuideEvents`). 편집 창은 남겼다. 측정: 시나리오 `goals-team-guide` 의 「운동 크루」 → 새 팀 창.
- 반론 2: "`collapseAllTeamGoalAccordions` 를 남기면 묶음이 반쪽이다." → 시험지 두 개(team-fold-state-es409·team-level-accordion-es406)가 함수 시작 글자부터 원래 자리 window 노출 줄까지를 한 덩어리로 잘라 실행한다. 노출 줄은 원래 자리에 두는 것이 표준 이음매라, 함수만 옮기면 기대값을 바꾸지 않고는 시험이 깨진다(#TASK-ES-488 REQ 4절). 남기는 것이 동작 그대로·시험 그대로다.
- 반론 3: "확인창 시험이 `routine-screen.js` 이름에 묶였다." → #TASK-ES-488 에서 그 이름으로 범위를 넓혔고, 이 PR 이 그 이름을 쓴다. 측정: core-confirm-es376 통과(루틴 삭제 2곳 — 하나는 옮긴 화면, 하나는 남긴 상세 창).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `#btnGoalsSubRoutine`, `#routineGoalsView`, `#btnAddRoutineBtn`, `#inRoutineTitle`, `#btnCancelAddRoutine`, `#btnGoalsSubTeam`, `#teamGoalsView`, `[data-tgexampletab]`, `[data-tgtplquick]`, `#modalOverlay`.
- 함수: 3절 표. 파일: `index.html`, `js/tabs/goals/routine-screen.js`, `js/tabs/goals/team-goals-guide.js`, `docs/architecture/modules.json`·`cell-descriptions.json`, `docs/design/harness/module-split/inline-h2-pr2.json`·`dom-steps-inline-h2-pr2.js`, `reports/TASK-ES-493/*`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

기준 = origin/main cb0328d(`git archive` 사본). 그 뒤 main(aa354e2 · c0f5637)을 합쳤다 — index.html 은 main 판을 입력으로 생성기를 다시 돌려 만들었고(손으로 푼 충돌 0), verify·모듈 로드 탐침(회귀 0)·시나리오 2개(기준·작업 통과)를 다시 쟀다. 조작 비교·시험 비교는 cb0328d 기준 값이다.

| 항목 | 도구 | 결과 |
| :-- | :-- | :-- |
| 글자 동일 | `verify-inline-hard.js` | 옮긴 함수 6개 토큰열 동일, 표지 구간 줄 단위 동일, 남은 글자 156,582토큰 동일, 누수·미노출·setter 빠짐·남은 정의·안 가져온 사용·this/arguments 0, 처리기 547 = 518 + 29, 새 파일 562·460줄 (`verify-inline-hard-pr2.json` ok) |
| 줄 수 | 생성기 메타 | index.html −940줄 (`gen-meta-pr2.json`) |
| 원본 단독 로드 | `court/probes/module-load.js` 로컬 | 회귀 0, 새 파일 2개 단독 로드 ok (`module-load-probe-pr2.json`) |
| 화면 시나리오 | `court/lib/scenario.js` 로컬 | `goals-routine-screen`·`goals-team-guide` 기준·작업 통과, 약점 0 (`scenario-local.json`) |
| 조작 전후(게스트) | `dom-compare-inline-h2.js` | 12단계 × 10칸 = 120값, 기준 대 후 0 · 기준 대 기준 0, 콘솔 오류 0/0/0 (`dom-compare-pr2.json`) |
| 시험 | `test-compare-inline-p2.js` | smoke 443/0 기준=후, 작업 npm test 종료 코드 0. tests 종료 코드가 다른 것은 git 이력 없는 기준 사본에서만 실패하는 세포지도 이력 비교 1건 (`test-compare-pr2.json`) |

[4단계: 심사 청구]
