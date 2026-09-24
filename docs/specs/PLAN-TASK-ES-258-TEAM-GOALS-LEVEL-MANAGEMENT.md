# 엔지니어링 작업계획서 (PLAN) — 팀목표 시인성 개선, 아코디언 및 통합/목표별 수준관리 분리

> **문서 ID**: PLAN-TASK-ES-258-TEAM-GOALS-LEVEL-MANAGEMENT  
> **요구사항 연계**: [REQ-TASK-ES-258-TEAM-GOALS-LEVEL-MANAGEMENT](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-258-TEAM-GOALS-LEVEL-MANAGEMENT.md)  
> **티켓 연계**: #TASK-ES-258  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **상민님 지시 원문**:
  > *"팀 목표 시인성을 개선해야해. 한개 팀 목표에서 한번에 노출되는 정보량이 너무 많아. 팀 수준별 목표관리도 아코디언으로 하고, 공동 팀 목표도 최초 목표탭 진입시 팀별 한개만 노출되게해. 그리고 팀 수준별 목표관리는 동일 팀의 목표가 여러개면 그 목표에 따라 수준이 다를 수 있으니 팀의 목표별로 수준관리를 따로 할 수 있게 해야해. ‘팀 통합 수준관리’와 ‘목표별 수준관리’로 나눠서 작동하게 하고 시인성, 피로감까지 고려해서 정착시켜야해. 작업 시작 전에 구체적인 구현방법 보고해봐."*
- **영향 받는 파일 목록 전수**:
  - `js/team-visibility-levels.js`: 목표 스위처 칩 바, 대표 1개 목표 선별, 2계층 아코디언, 팀 통합 vs 목표별 듀얼 모드 분리, 팀 통합 수준 복사(`copyTeamLevelsToGoal`), 375px 모바일 반응형 방어 로직 완비.
  - `index.html`: `data-tgfoldlist`의 `state.profile.settings.unfoldMsList` 영구 저장 결속, `OurgoalTeamVisibilityLevels` 모듈 연계 무결성 유지.
  - `ui.css`: `.tg-goal-switcher`, `.tg-goal-chip`, `.tg-compact-goal-card`, `.tg-accordion-section`, `.tg-level-dual-tabs`, `.tg-lg-accordion-row` 375px 모바일 터치 및 고대비 토큰 검증.
  - `tests/team-level-management.test.js`: 신규 독립 단위 테스트 스위트 작성.
  - `scripts/smoke-test.js`: #TASK-ES-258 회귀 방지 검증 단언문 추가 (376개 테스트 ALL PASS).
  - `docs/rules/TICKETS.md`: #TASK-ES-258 티켓 등록.
  - `reports/TASK-ES-258/claims.json`: 법정 심사 클레임 문서 작성.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: `[E3]` (팀 목표 화면의 인지 과부하를 원천 제거하고, 1개 대표 목표 집중 및 목표별 맞춤형 수준관리 체계 완성).
- **[원인] (Technical Causes)**:
  - 복수 목표가 무조건 전체 나열되는 뷰 구조로 인해 스크롤 과다 및 피로감 유발.
  - 목표별 수준관리 데이터 격리 구조 및 원터치 복사 브리지의 정식 단위 테스트 및 영구 원장화 부재.
- **[중심 배선] (Core Wire & State)**:
  - `renderTeamCardContent(g, canManage, state)`: 대표 1개 목표 선별 렌더링 및 칩 스위처, 2계층 아코디언 출력.
  - `copyTeamLevelsToGoal(gid, tgid)`: 팀 통합 수준을 특정 목표의 전용 수준으로 딥 카피 및 고유 ID 재부여.
  - `state.profile.settings.unfoldMsList[tgid]`: 마일스톤 펼침 상태 영속성.
  - `state.profile.settings.foldLevelSection[gid]`: 수준별 섹션 접힘 상태 영속성.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `window.OurgoalTeamVisibilityLevels` 안전 폴백 배선으로 모듈 이상 시에도 기본 렌더링 보장.
  - `saveProfile()` 원자적 트랜잭션으로 유저 설정 유실 0건 보장.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/team-visibility-levels.js` | 칩 스위처 렌더링 무결성, 아코디언 및 듀얼 모드 분리, 복사 엔진 및 모바일 최적화 | +20줄 | -5줄 | +15줄 | 로직 보강 |
| `index.html` | `data-tgfoldlist`의 `unfoldMsList` 영구 저장 배선 및 `OurgoalTeamVisibilityLevels` 노출 보장 | +8줄 | -2줄 | +6줄 | 외과수술적 diff |
| `tests/team-level-management.test.js` | 신규 독립 단위 테스트 스위트 | +140줄 | 0줄 | +140줄 | 단위 테스트 |
| `scripts/smoke-test.js` | #TASK-ES-258 검증 단언문 추가 | +20줄 | 0줄 | +20줄 | 스모크 테스트 |
| `docs/rules/TICKETS.md` | 티켓 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `reports/TASK-ES-258/claims.json` | 법정 심사 클레임 | +35줄 | 0줄 | +35줄 | 심사 문서 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 팀 목표 및 마일스톤 데이터(`teamGoals`, `milestones`, `tasks`)가 100% 무손실 보존되는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 375px 모바일 뷰포트에서 가로 스크롤 오버플로우가 0px인가?
- [x] 팀 연계 개인목표, 팀원 초대, 팀 대화 등 연계 기능 버튼이 정상 동작하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 내 `data-tgfoldlist` 클릭 핸들러에 `state.profile.settings.unfoldMsList` 저장 로직 추가 및 `saveProfile()` 호출 배선.
2. **Step 2**: `js/team-visibility-levels.js`의 `copyTeamLevelsToGoal`, `renderTeamCardContent`, `bindEvents` 로직 무결성 점검 및 375px 반응형 방어 보강.
3. **Step 3**: `tests/team-level-management.test.js` 단위 테스트 스위트 작성 및 실행 (`node tests/team-level-management.test.js`).
4. **Step 4**: `scripts/smoke-test.js`에 #TASK-ES-258 검증 단언문 추가 및 376개 테스트 ALL PASS 확인.
5. **Step 5**: `scripts/verify-integrity-gate.js` 38개 헌법 게이트 통과 확인.
6. **Step 6**: `docs/rules/TICKETS.md`에 #TASK-ES-258 등록.
7. **Step 7**: `reports/TASK-ES-258/claims.json` 작성, 커밋, 푸시, Draft PR 생성 및 Court 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**:
  - 상단 칩 탭, 마일스톤 접기/펼치기, 수준관리 섹션 아코디언, 조별 인라인 아코디언, 듀얼 모드 전환 탭, 팀 통합 수준 복사 버튼의 전수 클릭 시 동작 완결.
- **시나리오 B (Zero Data Loss)**:
  - 수준별 조 생성/삭제, 팀 수준 복사 시 `groupLevelGoals`와 `goalLevelGoals`가 독립적으로 격리되어 데이터 덮어쓰기나 유실 없음 확인.
- **시나리오 C (Zero UX Regression)**:
  - 375px 모바일 화면에서 칩 스위처가 줄바꿈되지 않고 가로 스크롤되며 가로 오버플로우 0px 유지.
- **시나리오 D (Full State Propagation)**:
  - 목표 전환 시 대표 카드가 즉각 전환되고 마일스톤 및 수준관리 뷰가 동기화됨 확인.
- **시나리오 E (자동화 게이트 통과)**:
  - `scripts/smoke-test.js` 376개 및 `verify-integrity-gate.js` 38개 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1 REQ/PLAN 명세서 작성 완료.
- [ ] Step 2 `index.html` 및 `js/team-visibility-levels.js` 배선 보강.
- [ ] Step 3 단위 테스트 `node tests/team-level-management.test.js` ALL PASS.
- [ ] Step 4 스모크 테스트 376개 ALL PASS.
- [ ] Step 5 헌법 38대 게이트 통과.
- [ ] Step 6 초안 PR 개설 및 GitHub Court 법정 심사 청구.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 복사된 조의 마일스톤 및 할 일 ID 충돌 가능성.
- **사전 방어**: `copyTeamLevelsToGoal`에서 `uid('lg_')`, `uid('lgg_')`, `uid('lgm_')`, `uid('lgt_')` 기반의 신규 고유 ID를 부여하여 완벽 격리.
- **롤백 계획 (Rollback Strategy)**: 변경 파일 `git checkout -- js/team-visibility-levels.js index.html`로 즉시 원상 복구 가능.
- **재검증 트리거**: 칩 전환 후 아코디언 토글 시 이전 목표 데이터가 잔존할 경우 `renderTeamCardContent`의 상태 바인딩부 재점검.
