# [작업계획서] #TASK-INFRA-SHIPYARD-MODULAR-PHASE2: 조선소 블록 건조 2단계 (홈 탭 메가블록 및 소블록 외판 분리 도킹)

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-PHASE2`
- **엔지니어링 목표**:
  - 홈 탭의 단일 모놀리스 로직을 `js/tabs/home/` 하위의 **메가블록 허브 1종 + 기능별 소블록 3종**으로 분리 건조하고, `OurgoalRegistry`에 도킹하여 수밀 격벽(Watertight Boundary) 보호 하에 구동함.
- **영향 파일 전수 목록**:
  1. `js/tabs/home/sub-heatmap.js` (신규 생성: 상단 히트맵 요약 스트릭 소블록)
  2. `js/tabs/home/sub-today.js` (신규 생성: 오늘의 미션 카드 및 1초 콕핏 빠른 체크인 소블록)
  3. `js/tabs/home/sub-quest.js` (신규 생성: 데일리 퀘스트 및 레벨/EXP 배지 소블록)
  4. `js/tabs/home/index.js` (신규 생성: 홈 메가블록 오케스트레이터 허브)
  5. `scripts/test-home-blocks.js` (신규 생성: 홈 블록 5대 영역 단위 테스트)
  6. `index.html` (수정: 스크립트 로드 태그 배치 및 `initShipyardRegistry()` 홈 블록 마운트 연동)
  7. `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE2/claims.json` (신규 생성: 법정 심사 청구서)
  8. `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE2/scenarios/home-dock.json` (신규 생성: 홈 탭 마운트 시나리오)
  9. `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE2/scenarios/home-heatmap.json` (신규 생성: 히트맵 카드 상호작용 시나리오)

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 38,000줄 거대 모놀리스를 침몰하지 않는 구획화된 조립형 선박으로 진화시키는 핵심 공정이며, 홈 화면의 3대 핵심 렌더러를 독립 소블록으로 분리하여 유지보수성과 확장성을 극대화하는 것.
- **원인 (Root Causes)**:
  - 모든 탭 UI 로직이 `index.html`의 거대 IIFE 내에 직접 선언되어 있어 파일 간 격리가 전무했던 아키텍처적 결함.
  - 전역 스코프에 함수들이 산재하여 탭 간 결합도가 높아졌던 문제.
- **중심 (Core Bottleneck)**:
  - 신규 소블록들이 기존 `window.state` 및 이벤트 리스너와 충돌 없이 매끄럽게 통신하고, `OurgoalRegistry.mount('home')` 시점에 오차 없이 렌더링되도록 배선하는 것.
- **핵심 (Critical Anchor)**:
  - **Zero Regression**: 기존 홈 화면의 891개 버튼 인터랙션 및 시각적 조형 100% 불변 보존.
  - **비파괴 점진 전환 (Strangler Fig Pattern)**: 기존 `renderHome()`과의 완전한 공존 및 점진적 위임.

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `js/tabs/home/sub-heatmap.js`: 약 120줄 (추가 120, 삭제 0)
  - `js/tabs/home/sub-today.js`: 약 130줄 (추가 130, 삭제 0)
  - `js/tabs/home/sub-quest.js`: 약 120줄 (추가 120, 삭제 0)
  - `js/tabs/home/index.js`: 약 160줄 (추가 160, 삭제 0)
  - `scripts/test-home-blocks.js`: 약 110줄 (추가 110, 삭제 0)
  - `index.html`: 약 35줄 (추가 35, 삭제 5)
  - 합계: 약 675줄 추가, 5줄 변경 (모든 개별 파일 800줄 이하 엄수)
- **4위 1체 배선 명세**:
  - [HTML]: 각 소블록이 담당 컨테이너 슬롯(`#homeGrassSummaryCard`, `#todayMissionCard`, `#levelBadgeRow`)을 정밀 타겟팅.
  - [리스너]: 슬롯 내의 클릭 액션(스트릭 상세, 체크인 열기, 퀘스트 확인)을 이벤트 버스로 전파.
  - [비즈니스 로직]: `OurgoalStore` 및 `state.profile`을 읽어 순수 함수형으로 뷰 갱신.
  - [피드백]: 햅틱(12ms) 및 시각적 상태 전이 보존.

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Zero-Regression)
- **불파괴 보증**:
  - 기존 `renderHome()` 함수 본문은 그대로 존속하며, 신규 모듈이 마운트될 때 기존 함수를 감싸는 래퍼 방식을 사용하여 기존 전후방 사이드이펙트 발생을 원천 차단함.
  - `window.state`의 원본 구조를 일절 변경하지 않음.
- **스타일 및 IA 보존**:
  - 기존 CSS 클래스(`card`, `toss-card`, `sanctuary-top-bar` 등)를 100% 동일하게 유지하여 375px 모바일 뷰포트에서의 조형 무결성을 엄격히 보장함.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **[단계 1: 소블록 3종 작성]**:
   - `sub-heatmap.js`: `OurgoalHomeHeatmap` 구현 (히트맵 요약 카드 및 스트릭 배지 담당).
   - `sub-today.js`: `OurgoalHomeToday` 구현 (오늘 미션 카드 및 콕핏 빠른 체크인 칩 담당).
   - `sub-quest.js`: `OurgoalHomeQuest` 구현 (레벨 배지 및 피드백 티어 바 담당).
2. **[단계 2: 홈 메가블록 허브 작성]**:
   - `js/tabs/home/index.js`: `OurgoalHomeMegaBlock` 구현.
   - 소블록 3종 자동 등록 및 `mount(container, state, events)` 오케스트레이션.
3. **[단계 3: 단위 테스트 스크립트 작성 및 실행]**:
   - `scripts/test-home-blocks.js`를 작성하여 등록, 마운트, 수밀 격벽, 에러 격리, 이벤트 통신 5대 테스트 통과.
4. **[단계 4: index.html 배선 및 연결]**:
   - `js/tabs/home/sub-*.js` 및 `js/tabs/home/index.js` 로드 태그 배치.
   - `initShipyardRegistry()` 내에서 `OurgoalHomeMegaBlock`을 메가블록으로 공식 등록.
5. **[단계 5: 전수 사전 검증]**:
   - `npm test` (440 스모크, 38 무결성 게이트, 891 버튼 데드클릭) 100% 통과 확인.
6. **[단계 6: 법정 청구 및 PR 생성]**:
   - `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE2/claims.json` 및 시나리오 작성 후 GitHub 초안 PR 제출.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토 (Procedure Verification & Counterarguments)
- **반대 논거 1: 소블록 모듈 간 로드 타이밍 레이스 컨디션**:
  - *"브라우저 네트워크 환경에 따라 sub-heatmap.js가 index.js보다 늦게 다운로드되면 레지스트리 등록이 누락될 수 있다."*
  - **반박 및 수용**:
    - 모든 소블록과 메가블록은 `defer` 없는 동기식 스크립트 태그로 순서대로 배치되며, `OurgoalHomeMegaBlock`은 모듈 로드 즉시가 아닌 `DOMReady` 및 `initShipyardRegistry()` 실행 시점에 하위 블록들을 수집하고 마운트하므로 레이스 컨디션이 원천 차단됨.
- **반대 논거 2: 단일 테스트 통과 후 실 브라우저에서의 이벤트 단절 가능성**:
  - *"Node.js 단위 테스트만으로는 브라우저 DOM 상의 인라인 onclick 핸들러와의 상호작용 단절을 감지하지 못할 수 있다."*
  - **반박 및 수용**:
    - 본 계획은 Node.js 단위 테스트뿐만 아니라 891개 버튼 전수 인터랙션을 검증하는 `Anti-False-Pass Zero Dead-Click` 3중 방화벽과 GitHub Actions 상의 실제 헤드리스 브라우저 법정(Court) 검사를 필수 관문으로 두고 있으므로 실 브라우저 인터랙션 단절이 절대 발생할 수 없음.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **단위 테스트**: `node scripts/test-home-blocks.js` 5개 전수 통과.
- **시스템 검증**: `npm test` (440 smoke, 38 integrity gate, 891 click) 0개 실패.
- **코드 상한 규격**: 분리된 모든 파일이 800줄 이하 (헌법 제3조 제9항 3호).
- **법정 심사**: GitHub Actions Court 심사에서 `success` 판정 획득.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **트리거 1: 기존 렌더러와의 이름 충돌**:
  - 전역 스코프에 동일한 이름의 렌더러가 존재하여 충돌할 경우.
  - **대응**: 모든 신규 모듈은 네임스페이스 객체(`window.OurgoalHomeMegaBlock`, `window.OurgoalHomeHeatmap` 등) 내부에 메서드로 캡슐화함.
- **트리거 2: 상태 비동기 불일치**:
  - 홈 탭에서 체크인 발생 후 소블록이 갱신되지 않는 경우.
  - **대응**: `OurgoalEvents.on('view:sync', ...)`를 수신하여 소블록들이 자동으로 자체 갱신되도록 반응형 배선 완비.
