# [작업계획서] #TASK-INFRA-SHIPYARD-MODULAR-PHASE3: 조선소 블록 건조 3단계 (목표 탭 메가블록 및 소블록 외판 분리 도킹)

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-PHASE3`
- **엔지니어링 목표**:
  - 목표 탭의 단일 모놀리스 로직을 `js/tabs/goals/` 하위의 **메가블록 허브 1종 + 기능별 소블록 3종**으로 분리 건조하고, `OurgoalRegistry`에 도킹하여 수밀 격벽(Watertight Boundary) 보호 하에 구동함.
- **영향 파일 전수 목록**:
  1. `js/tabs/goals/sub-personal.js` (신규 생성: 개인 목표 및 세부 마일스톤/할일 소블록)
  2. `js/tabs/goals/sub-routine.js` (신규 생성: 루틴 목표 콕핏 소블록)
  3. `js/tabs/goals/sub-team.js` (신규 생성: 팀 목표 및 팀 연계 목표 소블록)
  4. `js/tabs/goals/index.js` (신규 생성: 목표 메가블록 오케스트레이터 허브)
  5. `scripts/test-goals-blocks.js` (신규 생성: 목표 블록 5대 영역 단위 테스트)
  6. `index.html` (수정: 스크립트 로드 태그 배치 및 `initShipyardRegistry()` 목표 블록 마운트 연동)
  7. `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE3/claims.json` (신규 생성: 법정 심사 청구서)
  8. `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE3/scenarios/goals-dock.json` (신규 생성: 목표 탭 마운트 시나리오)
  9. `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE3/scenarios/goals-interaction.json` (신규 생성: 목표 탭 상호작용 시나리오)

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골의 두 번째 핵심 탭인 목표 탭을 '블록형 모듈러 아키텍처'로 전환하여, 개인 목표·루틴·팀 연계가 독립적으로 진화할 수 있는 안전한 선체 구조를 완성하는 것.
- **원인 (Root Causes)**:
  - `renderGoalsScreen()`(라인 23053~) 거대 함수 내에 5대 서브탭 분기 및 렌더링 로직이 단일 스크립트로 엉켜 있던 구조적 결함.
  - 특정 서브탭 실패 시 전체 목표 화면이 렌더링되지 못하는 취약점.
- **중심 (Core Bottleneck)**:
  - 신규 소블록들이 기존 `window.state`, `renderGoalsScreen()`, `renderRoutineGoalsScreen()`, `renderTeamGoalsScreen()`과 충돌 없이 매끄럽게 통신하고, `OurgoalRegistry.mount('goals')` 시점에 오차 없이 렌더링되도록 배선하는 것.
- **핵심 (Critical Anchor)**:
  - **Zero Regression**: 기존 목표 화면의 892개 버튼 인터랙션 및 시각적 조형 100% 불변 보존.
  - **비파괴 점진 전환 (Strangler Fig Pattern)**: 기존 `renderGoalsScreen()`과의 완전한 공존 및 점진적 위임.
  - **세포분열 원칙**: 모든 신규 모듈 800줄 이하 엄수 (각 파일 70~120줄 내외 설계).

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `js/tabs/goals/sub-personal.js`: 약 90줄 (추가 90, 삭제 0)
  - `js/tabs/goals/sub-routine.js`: 약 80줄 (추가 80, 삭제 0)
  - `js/tabs/goals/sub-team.js`: 약 85줄 (추가 85, 삭제 0)
  - `js/tabs/goals/index.js`: 약 130줄 (추가 130, 삭제 0)
  - `scripts/test-goals-blocks.js`: 약 100줄 (추가 100, 삭제 0)
  - `index.html`: 약 25줄 (추가 25, 삭제 2)
  - 합계: 약 510줄 추가, 2줄 변경 (모든 개별 파일 800줄 이하 엄수)
- **4위 1체 배선 명세**:
  - [HTML]: 각 소블록이 담당 컨테이너 슬롯(`#personalGoalsView`, `#routineGoalsView`, `#teamGoalsView`, `#teamLinkedGoalsView`)을 정밀 타겟팅.
  - [리스너]: 슬롯 내의 서브탭 전환, 새 목표 추가, 편집 모드 토글을 이벤트 버스로 전파.
  - [비즈니스 로직]: `OurgoalStore` 및 `state.profile.goals`를 읽어 순수 함수형으로 뷰 갱신.
  - [피드백]: 햅틱(12ms) 및 시각적 상태 전이 보존.

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Zero-Regression)
- **불파괴 보증**:
  - 기존 `renderGoalsScreen()` 함수 본문은 그대로 존속하며, 신규 모듈이 마운트될 때 기존 함수를 감싸는 래퍼 방식을 사용하여 기존 전후방 사이드이펙트 발생을 원천 차단함.
  - `window.state.profile.goals` 및 `window.state.goalsSubTab`의 원본 구조를 일절 변경하지 않음.
- **스타일 및 IA 보존**:
  - 기존 CSS 클래스(`goals-subtabs-grid`, `toss-quest-board`, `agent-card` 등)를 100% 동일하게 유지하여 375px 모바일 뷰포트에서의 조형 무결성을 엄격히 보장함.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **[단계 1: 소블록 3종 작성]**:
   - `sub-personal.js`: `OurgoalGoalsPersonal` 구현 (개인 목표 및 세부 마일스톤 뷰 담당).
   - `sub-routine.js`: `OurgoalGoalsRoutine` 구현 (루틴 목표 뷰 담당).
   - `sub-team.js`: `OurgoalGoalsTeam` 구현 (팀 목표 및 팀 연계 뷰 담당).
2. **[단계 2: 목표 메가블록 허브 작성]**:
   - `js/tabs/goals/index.js`: `OurgoalGoalsMegaBlock` 구현.
   - 소블록 3종 자동 등록 및 `mount(container, state, events)` 오케스트레이션.
3. **[단계 3: 단위 테스트 스크립트 작성 및 실행]**:
   - `scripts/test-goals-blocks.js` 작성: 메타데이터, 마운트, 이벤트 반응, 에러 격벽, view:sync 5대 검증.
4. **[단계 4: 도크(index.html) 배선]**:
   - 스크립트 태그 4종 순서대로 배치.
   - `initShipyardRegistry()` 내에 `OurgoalGoalsMegaBlock.init()` 연동.
5. **[단계 5: 전수 검증 및 사전 브라우저 탐침]**:
   - `node scripts/test-goals-blocks.js`, `npm test`, `node court/selftest/run.js --unit-only`.
   - `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE3/claims.json` 및 시나리오 작성 후 `runScenario` 로컬 탐침.
6. **[단계 6: 커밋 및 푸시, PR 생성 및 법정 심사 청구]**:
   - 브랜치 푸시, PR 생성, GitHub Actions Court 검사 통과 및 4-Line 판정서 보고.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토 (Procedure Verification & Counterarguments)
- **반대 논거 1: 소블록 모듈 간 로드 타이밍 레이스 컨디션**:
  - *"브라우저 네트워크 환경에 따라 sub-personal.js가 index.js보다 늦게 다운로드되면 레지스트리 등록이 누락될 수 있다."*
  - **반박 및 수용**:
    - 모든 소블록과 메가블록은 `defer` 없는 동기식 스크립트 태그로 순서대로 배치되며, `OurgoalGoalsMegaBlock`은 모듈 로드 즉시가 아닌 `DOMReady` 및 `initShipyardRegistry()` 실행 시점에 하위 블록들을 수집하고 마운트하므로 레이스 컨디션이 원천 차단됨.
- **반대 논거 2: 단일 테스트 통과 후 실 브라우저에서의 이벤트 단절 가능성**:
  - *"Node.js 단위 테스트만으로는 브라우저 DOM 상의 인라인 onclick 핸들러와의 상호작용 단절을 감지하지 못할 수 있다."*
  - **반박 및 수용**:
    - 본 계획은 Node.js 단위 테스트뿐만 아니라 892개 버튼 전수 인터랙션을 검증하는 `Anti-False-Pass Zero Dead-Click` 3중 방화벽과 GitHub Actions 상의 실제 헤드리스 브라우저 법정(Court) 검사를 필수 관문으로 두고 있으므로 실 브라우저 인터랙션 단절이 절대 발생할 수 없음.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **단위 테스트**: `node scripts/test-goals-blocks.js` 5개 전수 통과.
- **시스템 검증**: `npm test` (440 smoke, 38 integrity gate, 892 click) 0개 실패.
- **코드 상한 규격**: 분리된 모든 파일이 800줄 이하 (헌법 제3조 제9항 3호).
- **법정 심사**: GitHub Actions Court 심사에서 `success` 판정 획득.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **트리거 1: 기존 렌더러와의 이름 충돌**:
  - 전역 스코프에 동일한 이름의 렌더러가 존재하여 충돌할 경우.
  - **대응**: 모든 신규 모듈은 네임스페이스 객체(`window.OurgoalGoalsMegaBlock`, `window.OurgoalGoalsPersonal` 등) 내부에 메서드로 캡슐화함.
- **트리거 2: 상태 비동기 불일치**:
  - 목표 서브탭 전환 또는 목표 추가 후 소블록이 갱신되지 않는 경우.
  - **대응**: `OurgoalEvents.on('view:sync', ...)` 및 `OurgoalEvents.on('goal:updated', ...)`를 수신하여 소블록들이 자동으로 자체 갱신되도록 반응형 배선 완비.
