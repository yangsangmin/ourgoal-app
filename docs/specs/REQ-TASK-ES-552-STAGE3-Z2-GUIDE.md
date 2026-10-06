# REQ — #TASK-ES-552 인라인 3단계 Z2(팀·소통) 2차: 「개인 목표 200% 활용 가이드 & 템플릿 백과사전」 묶음 옮기기

- 근거: 오케스트레이터 배정(2026-10-06, 구역 Z2 팀·소통) · 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 2절 (가)·3절·4절·6절 · 헌법 v2026.10.06-SNOWBALL CELL_SPLIT·CELL_SPLIT_PROOF·claims_hygiene · 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L001·L002·L006·L015·L016·L018·L045·L046·L047).
- 선행: #803(#TASK-ES-519) — `collapseAllTeamGoalAccordions` 를 잘라 읽는 시험지 2개(team-fold-state-es409·team-level-accordion-es406)가 합본에서 같은 함수를 찾는다. · #828(#TASK-ES-567) — core-confirm-es376 의 「처리기는 confirm.js 뒤」 검사가 합본을 읽는다(index.html 에 남은 ui.confirm 처리기 2곳이 모두 이 PR 이 옮기는 openLevelGroupDetailModal·openTeamGoalEditModal 안이라, 생성 뒤 시험지 비교에서 실측으로 찾음).
- 작업 유형(SNOWBALL): (가) 표준 — 생성기 이음매(L016)·게스트 시나리오(L001). 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악

index.html 인라인 IIFE 에 「개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)」 묶음(함수 6 — 설계 2절 (가): 팀 · 시험지 구간 절단)이 남아 있다. 설계는 팀 경로(getGroupLevelGoals·openLevelGroupDetailModal·openTeamGoalEditModal)를 「테스트 계정 A 도 팀 0 — 고정 테스트 팀 필요」로 보았으나, 실측에서 게스트가 ① 예시 팀 「체험」으로 팀목표 화면(수준별 목표·일괄 접기)에, ② 「이 템플릿으로 팀 개설」로 팀장이 되어 「편집」→ 팀 목표 상세 편집 창에 닿았다(`reports/TASK-ES-552/real-account-reach-guest-base.json`·탐색 기록). 고정 테스트 팀(운영 쓰기)은 필요 없었다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 개인 목표 가이드 HTML·팀 화면 도우미·팀 목표 편집 창이 인라인 덩어리에 섞여 있다(761줄).
- **원인**: 앞 단계는 시험지 구간 절단(collapseAllTeamGoalAccordions)과 「게스트로 팀에 못 닿는다」는 가정 때문에 남겼다(#493·#497). 시험지는 #803 이 풀었고, 게스트 도달은 실측으로 확인했다.
- **중심**: 책임 단위 3세포(개인 목표 가이드 / 팀 수준별 목표·판별·일괄 접기 / 팀 목표 편집 창)로 생성기가 글자 그대로 옮기고, 세포마다 게스트 시나리오를 낸다.
- **핵심**: 손으로 옮긴 글자 0 · 동작 0 변경 · index.html 순증가 0 · window 노출 줄은 원래 자리 · 주장은 옮긴 묶음의 성질만(L002).

## 3. [원칙 ③] 해결방식

생성기 `docs/design/harness/module-split/gen-inline-hard.js` · 설정 `docs/design/harness/module-split/inline-stage3-z2-552.json`(자리 H2).

| 새 세포 | 옮긴 것 |
| :-- | :-- |
| `js/tabs/goals/personal-goals-guide.js` | renderPersonalGoalsEmptyGuideHtml |
| `js/tabs/goals/team-level-goals.js` | isMockGroup · getGroupLevelGoals · openLevelGroupDetailModal · collapseAllTeamGoalAccordions |
| `js/tabs/goals/team-goal-edit-modal.js` | openTeamGoalEditModal |

원래 자리에 남긴 것: window 노출 문 4개(isMockGroup · renderTeamGoalsEmptyGuideHtml · collapseAllTeamGoalAccordions · renderTeamGoalsScreen).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- `openLevelGroupDetailModal` 은 예비 경로다 — `js/tabs/goals/team-goals-screen.js` 가 `OurgoalTeamVisibilityLevels.openLevelGroupDetailModal` 이 있으면 그쪽을 부른다. 화면으로 닿지 않아 verify(토큰 동일)로만 낸다.
- 개인 목표 「활용가이드」 단추(#btnShowPersonalGuideModal)는 목표가 0개면 보이지 않는다(작업자 실측) — 시나리오는 추천 템플릿 하나를 담은 뒤 누른다.
- 로그인 뒤에만 다른 분기는 이 묶음에 따로 없다(팀 수준별 목표·편집은 프로필 settings 에 저장 — 로그인이면 saveProfile 이 서버로). 그래서 `needs-login` 동작 주장은 두지 않고, 테스트 계정 기준1→작업→기준2 읽기 전용 비교는 측정 기록 항목으로만 남긴다(쓰기는 도구가 끊음).
- 생성기 결함 2(L047 — 뒤쪽 getter-only 노출이 H 자리 setter 를 덮음): 이 묶음의 옮긴 코드가 대입하는 인라인 이름은 0 개다(verify `assignedL` 빈 목록) — 해당 없음.

## 5. [원칙 ⑤] 절차

worktree `C:/dev/wt/stage3-z2`(처음 origin/main 03dcb6b, #803 포함 — 이후 main 을 합치고 index.html 은 main 판을 입력으로 생성기 재실행, L010) → 게스트 탐색(체험·팀 개설·편집 창) → 설정 → 생성기 → verify(assignedL 0 확인) → 신고서(module-specs --write · cell-descriptions 관련 세포 옆 · ui.confirm requires) → module-guard → 원본 단독 로드 → 게스트 시나리오 3개 기준·작업 → 113개 시험지 종료 코드 기준 대비 → 테스트 계정·게스트 기준1/작업/기준2 비교 → main 합치기 → PR → 판정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: 「팀 편집 창은 팀장 계정이 있어야 잰다 — 게스트 팀 개설은 진짜 팀이 아니다.」 → 편집 창을 여는 코드 경로(`[data-tgeditmodal]` → openTeamGoalEditModal(gid, tgid) → MOCK_GROUPS 에서 팀 찾기)는 게스트로 만든 팀과 같은 경로다. 법정이 직접 재는 게스트 시나리오가 작업자 파일보다 강한 증거이고, 운영 쓰기는 0 이다.
- 반론 2: 「collapseAllTeamGoalAccordions 를 옮기면 그 시험지가 깨진다(#488 이 원래 자리에 둔 이유).」 → #803 이 읽는 범위를 합본으로 넓혔다. 작업자 측정: 113개 시험지 종료 코드 기준 = 작업(`tests-compare.json` differing 0).

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `.btn-quick-adopt-goal` · `#btnShowPersonalGuideModal` · `#modalSheet` · `[data-join="g-workshop"]` · `#btnGoalsSubTeam` · `[data-tgleavepreview]` · `[data-tgfoldlist]` · `[data-tplgroup-create]` · `#grpSave` · `#teamGoalEditToggle` · `[data-tgeditmodal]`.
- 함수: 3절 표.
- 파일: `index.html` · 새 세포 3개 · `docs/design/harness/module-split/inline-stage3-z2-552.json` · `docs/design/harness/module-split/real-account-stage3-z2-552-steps.json` · `docs/design/harness/module-split/module-load-stage3-z2.js` · `docs/architecture/modules.json` · `docs/architecture/cell-descriptions.json` · `reports/TASK-ES-552/**`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 · 옮긴 코드의 인라인 이름 대입 0 (`reports/TASK-ES-552/verify-inline-hard.json`) |
| 원본 단독 로드 | 회귀 0 · 새 세포 3개 단독 로드 ok (`module-load-probe.json`) |
| 게스트 시나리오 | 3개 기준·작업 통과 (`scenario-local.json`) |
| tests 전후 | 113개 종료 코드 기준 = 작업 (`tests-compare.json`) |
| 게스트·실계정 조작 비교 | 6단계 기준1/작업/기준2 차이 0 (`guest-compare.json` · `real-account-compare.json`) — 기준 사본은 origin/main 03dcb6b 판, 작업은 그 위에 생성한 판. 이후 main 을 합쳐 다시 생성한 판은 verify·단독 로드·시나리오·시험지 비교를 다시 쟀다 |
| 막힐 지점 | 같은 H2 자리를 쓰는 #TASK-ES-545 와 머리 이음매 충돌(L010 생성기 재실행) · main 이동 |

[4단계: 심사 청구]

## Codex 인계 재측정 (작업참고 기준 PR #827)

최신 origin/main 3ced3a46 입력으로 생성기를 재실행했다. reports/TASK-ES-552/snapshot-resume.json이 현재 수치 정본이며 previous-measurements.json은 기존 측정 보존본이다. 위 초기 기준 설명보다 재측정 파일을 우선 읽는다. 최신 기준 게스트·실계정·탭은 기준2회/작업1회로 다시 측정하며 시험은 git 이력을 가진 동일 main 사본과 종료 코드를 맞댄다. 주장·기대값·검사 수 변경 0.

탭 비교는 화면 측정용 --deadclick off로 목표 탭 기준2회·작업1회를 실행한다. deadclick rep의 개별 단추 재부팅 반복은 별도 조작 시나리오 3개와 게스트·실계정 단계 비교가 이미 수행하여 화면 차이 검사에는 사용하지 않는다. 하네스와 기대값 변경 0.

기준 archive의 전체텍스트 출처 확인은 baseline-provenance.json으로 증명한다(EOL 정규화 동일). tab-check commit 칸은 내부 archive가 부모 작업트리의 git 메타를 상속한 값이므로 content sourceTreeRef를 함께 본다.
