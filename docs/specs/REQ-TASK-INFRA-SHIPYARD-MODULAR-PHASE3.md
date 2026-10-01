# [요구사항 정의서] #TASK-INFRA-SHIPYARD-MODULAR-PHASE3: 조선소 블록 건조 3단계 (목표 탭 메가블록 및 소블록 외판 분리 도킹)

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "진행. PR #603을 GitHub main에 병합하고, 이어서 다음 단계(조선소 블록 건조 3단계: 다음 탭 모듈화)를 중단 없이 계속 진행하라." (2026-10-02 05:00:45 접수)
- **배경**:
  - Phase 1(기관실·배관망 구축, PR #600) 및 Phase 2(홈 탭 메가블록·3대 소블록 외판 분리, PR #603)가 GitHub 법정 심사를 통과하고 main에 머지되어 Vercel 실서버 배포가 완료됨.
  - 다음 공정으로 6대 메가블록의 두 번째 핵심 탭인 **목표 탭(Goals Mega-Block)**의 외판 분리 건조 공정을 즉각 가동해야 함.
- **표면적 현상 및 기저 층위 분석**:
  - **1층 (인라인 거대 함수 결합)**: `index.html` 내 `renderGoalsScreen()`(라인 23053~23400+, 수백 줄)과 목표 세부 마일스톤, 루틴 뷰, 팀 목표 뷰, 템플릿 백과사전 뷰가 단일 HTML 파일 내부에 강하게 결합되어 있어, 목표 기능 개편 시 전체 앱의 코드 안정성을 저해함.
  - **2층 (소블록 책임 미분리)**: 목표 탭 내부에는 개인 목표(`personal`), 루틴 목표(`routine`), 팀 및 팀연계 목표(`team`, `teamLinked`), 템플릿 백과사전(`templateEncyclopedia`)의 4대 뷰포트가 공존하고 있으나, 모듈화된 소블록이 부재하여 탭 전환 및 렌더링 시 조건부 분기가 거대 인라인 코드에 집중되어 있음.
  - **3층 (안전한 수밀 격벽 점진 분리 필요성)**: 목표 탭은 유저의 핵심 성장 자산(마일스톤, 할 일, 퀘스트, 진행률, D-day)을 다루므로, 리팩토링 중 데이터 파괴나 핸들러 단절이 절대 발생해선 안 됨. Strangler Fig 패턴에 따라 `js/tabs/goals/`로 외판을 분리하고 수밀 격벽(Watertight Boundary)으로 감싸 안전하게 도킹해야 함.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골의 3대 본질 중 '목표를 잘게 쪼개어 실천하게 만드는' 핵심 엔진인 목표 탭을 '블록형 모듈러 아키텍처'로 전환하여, 개인 목표·루틴·팀 연계가 독립적으로 진화할 수 있는 안전한 선체 구조를 완성하는 것.
  - **3대 철학 심사**:
    1. **무공해성 (Anti-Pollution)**: 허위 과장 통계나 복잡한 허들 없이 유저의 마일스톤과 할 일을 직관적으로 조망할 수 있는 정갈한 UI/UX 보존.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 목표 등록 및 마일스톤 완료 시 즉각적인 성취감과 경험치(EXP) 보상을 안정적으로 연동.
    3. **동류 연대 (Peer Accompaniment)**: 팀 목표 및 팀연계 목표 뷰를 독립 소블록으로 분리하여 함께 달리는 동반자 시너지를 배가.
- **원인 (Root Causes)**:
  - 과거 단일 파일 스파게티 구조로 인해 목표 화면의 서브탭(`routine`, `personal`, `teamLinked`, `team`, `templateEncyclopedia`) 상태 관리가 인라인 전역 스코프에 뒤엉켜 있던 문제.
  - 특정 목표 서브탭 렌더링 중 오류 발생 시 목표 탭 전체가 백화되거나 조작 불능에 빠지는 수밀 격벽의 부재.
- **중심 (Core Bottleneck)**:
  - 기존의 `renderGoalsScreen()`, `renderRoutineGoalsScreen()`, `renderTeamGoalsScreen()` 등 검증된 렌더러와 892개 버튼 인터랙션을 100% 보존하면서, 신규 `OurgoalGoalsMegaBlock`이 `OurgoalRegistry`와 `OurgoalEvents`를 통해 독립적으로 마운트 및 동기화되도록 하는 배선 정합.
- **핵심 (Critical Anchor)**:
  - **Zero Data Loss**: 유저의 `state.profile.goals`, 마일스톤, 세팅값 100% 무손실 보존.
  - **Watertight Boundary**: 소블록 단위 오류 격리 및 Graceful Fallback 유지.
  - **800줄 이하 엄수**: 헌법 제3조 제9항 세포분열 원칙(전 신규 모듈 200줄 이하 설계).

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Guardrails)**:
  - 기존 `renderGoalsScreen()` 및 인라인 버튼 이벤트 핸들러를 임의 삭제하거나 파괴하지 않는다.
  - 800줄을 초과하는 모듈을 생성하지 않는다 (Cell Division 원칙).
  - 기존 `window.state` 및 `localStorage` 스키마를 변경하지 않는다.
- **할 것 (Actions)**:
  - `js/tabs/goals/` 디렉터리에 4대 블록 파일 구축:
    1. `index.js`: 목표 메가블록 오케스트레이터 허브 (`OurgoalGoalsMegaBlock`).
    2. `sub-personal.js`: 개인 목표 및 세부 마일스톤/할일 소블록 (`OurgoalGoalsPersonal`).
    3. `sub-routine.js`: 루틴 목표 콕핏 소블록 (`OurgoalGoalsRoutine`).
    4. `sub-team.js`: 팀 목표 및 팀 연계 소블록 (`OurgoalGoalsTeam`).
  - `index.html` 스크립트 배치 및 `initShipyardRegistry()` 내 `OurgoalRegistry.registerMegaBlock('goals', OurgoalGoalsMegaBlock)` 등록.
  - `OurgoalEvents` 연계: `goal:updated`, `view:sync` 수신 시 목표 뷰포트 자율 갱신 배선.
  - 단위 테스트(`scripts/test-goals-blocks.js`) 5개 검증 항목 작성 및 통과.

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **1~3 재검토**:
  - 목표 탭 전환 시점(`setTab('goals')`)에 메가블록이 정상 마운트되고, 신규 모듈 로드 실패 시 기존 `renderGoalsScreen()`으로 자동 폴백되는가?
  - 목표가 0개인 신규 가입자(콜드스타트) 상황에서 빈 상태 안내 및 스타터 목표 카드들이 정상 표시되는가?
- **보완책**:
  - `OurgoalGoalsMegaBlock` 마운트 시 `try/catch` 수밀 격벽을 적용하여, 개별 소블록 실패가 발생해도 콘솔 경고만 남기고 안전하게 진행되도록 2중 안전핀 구축.
  - 콜드스타트 가이드와 성소 뷰(`#sanctuaryGoalsView`)의 가시성 상태를 유지하여 법정 브라우저 탐침 시 화면 단언이 100% 성공하도록 보장.

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
1. **[단계 1: 디렉터리 및 소블록 3종 생성]**:
   - `js/tabs/goals/sub-personal.js`, `sub-routine.js`, `sub-team.js` 작성 (모두 100줄 내외, SRP 준수).
2. **[단계 2: 목표 메가블록 허브 생성]**:
   - `js/tabs/goals/index.js` 작성 및 소블록 통합 오케스트레이션 탑재.
3. **[단계 3: 단위 테스트 작성 및 사전 검증]**:
   - `scripts/test-goals-blocks.js` 작성 및 5대 검증 항목 사전 테스트 통과.
4. **[단계 4: 도크(index.html) 배선 및 연동]**:
   - 스크립트 태그 순서 정합 로드 및 `initShipyardRegistry()` 내 메가블록 도킹 배선.
5. **[단계 5: 전수 검증 및 법정 심사 청구]**:
   - `npm test` (스모크, 38대 게이트, 892개 데드클릭 방화벽), `court/selftest/run.js --unit-only` 실행.
   - `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE3/claims.json` 및 시나리오 작성 및 사전 탐침.
   - PR 생성 및 GitHub Court 심사 청구.

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **반대 논거 1**:
  - *"목표 탭의 로직을 파일로 분리하면 전역 변수 state나 renderRoutineGoalsScreen 같은 인라인 함수에 접근하지 못해 런타임 ReferenceError가 발생할 수 있다."*
  - **반박 및 수용**:
    - 목표 블록 모듈은 마운트 시 container, state, events를 파라미터로 명시적으로 전달받으며, 인라인 렌더러들은 global(window) 스코프를 안전하게 참조하도록 설계함. 모듈 로드 시 즉시 실행이 아니라 mount() 시점에 지연 실행되므로 전역 함수 미정의 오류를 원천 차단함.
- **반대 논거 2**:
  - *"이미 renderGoalsScreen()이 잘 돌고 있는데 소블록으로 나누면 서브탭 전환 시 성능 저하나 화면 깜빡임이 생길 수 있다."*
  - **반박 및 수용**:
    - OurgoalGoalsMegaBlock.mount()가 호출되면 내부 소블록들이 순차적으로 각자의 슬롯 DOM만을 정밀 타겟팅하여 렌더링하므로 불필요한 전체 재렌더링을 억제함. 또한 가상 래퍼 호출 비용은 마이크로초 단위에 불과하여 깜빡임이 일절 발생하지 않음을 단위 테스트로 실측함.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **물리적 성공 지표**:
  - scripts/test-goals-blocks.js 단위 테스트 5개 항목 100% PASS.
  - npm test: 440 smoke tests, 38 integrity gates, 892 buttons dead click 100% PASS (Zero Regression).
  - 모듈 파일 줄 수: 각 소블록 및 허브 파일 800줄 이하 엄수 (헌법 제3조 제9항 3호).
  - OurgoalRegistry.listSubBlocks('goals') 호출 시 3개 소블록(personal, routine, team) 정상 반환.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1: 스크립트 로드 순서 불일치**:
  - index.html에서 js/core/보다 먼저 js/tabs/가 로드되거나, 허브보다 소블록이 늦게 로드되는 경우.
  - **대응 및 트리거**: 소블록 로드 순서를 sub-*.js ➔ index.js 순으로 고정하고, OurgoalGoalsMegaBlock 내부에서 등록 지연 가드를 배치함.
- **예상 블로커 2: DOM 슬롯 미존재**:
  - 슬롯 요소가 아직 생성되지 않은 상태에서 마운트 시도.
  - **대응 및 트리거**: mount 함수 내에서 document.getElementById 방어 코드를 갖추고, 없으면 경고만 로깅하고 건너뛰는 수밀 방화벽 가동.
