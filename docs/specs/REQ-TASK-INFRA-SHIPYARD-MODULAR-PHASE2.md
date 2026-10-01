# [요구사항 정의서] #TASK-INFRA-SHIPYARD-MODULAR-PHASE2: 조선소 블록 건조 2단계 (홈 탭 메가블록 및 소블록 외판 분리 도킹)

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "진행" (2026-10-02 04:08:19 접수)
- **배경**:
  - Phase 1에서 공통 기관실/배관망(`js/core/event-bus.js`, `js/core/registry.js`, `js/core/store.js`) 구축 및 Vercel 실운영 배포가 100% 성공함.
  - 다음 공정으로 홈 탭(Home Mega-Block)의 1차 외판 분리 건조를 진행해야 함.
- **표면적 현상 및 기저 층위 분석**:
  - **1층 (모놀리스 결합도)**: `index.html` 내 `renderHome()` 함수(약 300줄)와 홈 관련 렌더러들(`renderTodayMissionCard`, `renderHomeGrassSummary`, `renderLevelBadge`, `renderQuickCheckinGuideChips`)이 단일 파일 인라인 스크립트로 엉켜 있어, 홈 화면 수정 시 타 영역 사이드이펙트 및 병합 충돌 위험이 상존함.
  - **2층 (구조적 분리 부재)**: 최고 헌법 제3조 제9항이 선언한 [경량 선체 도크 ➔ 6대 메가블록 ➔ 28대 소블록] 3계층 중, 홈 탭이 아직 물리적 파일(`js/tabs/home/`)로 분리되지 않은 채 도크 레지스트리에서 인라인 함수를 단순 호출하고 있음.
  - **3층 (안전한 점진 전환 필요성)**: 한 번에 모든 홈 마크업과 비즈니스 로직을 통째로 들어내면 891개 버튼의 핸들러 및 기존 로컬스토리지 상태 전파가 손상될 위험이 있음. 따라서 3대 핵심 소블록(히트맵 요약, 오늘 미션/콕핏, 데일리 퀘스트/레벨 배지)을 우선 추출하고 수밀 격벽(Watertight Boundary)으로 감싸는 Strangler Fig 점진 전환 공법이 요구됨.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골 앱에 처음 진입했을 때 유저가 마주하는 가장 중요한 관문인 홈 화면의 인프라를 '블록형 조립 선박' 구조로 전환하여, 향후 UI/UX 개선이나 기능 확장이 다른 탭에 영향을 주지 않도록 완벽히 구획화하는 것.
  - **3대 철학 심사**:
    1. **무공해성 (Anti-Pollution)**: 자극적 알림이나 허위 통계 없이, 유저의 본질적 목표와 실천 현황을 투명하게 안내하는 무공해 쉼터 유지.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 홈의 레벨 배지, EXP 바, 오늘의 미션 카드를 통해 실천 즉시 경험치가 축적되는 RPG 쾌감을 무손실 유지.
    3. **동류 연대 (Peer Accompaniment)**: 타인과의 과시가 아닌 나만의 올바른 방향성에 집중할 수 있는 1초 콕핏 환경 조성.
- **원인 (Root Causes)**:
  - 과거 단일 파일 스파게티 구조에서 비롯된 전역 스코프 의존성과 레거시 렌더러 간의 순환 호출.
  - 소블록 단위의 책임 분리가 없어 작은 UI 수정도 거대 파일 전체를 건드려야 했던 구조적 결함.
  - 에러 발생 시 홈 화면 전체가 하얗게 질리는(White-out) 결함 전파 취약점.
- **중심 (Core Bottleneck)**:
  - 기존 `renderHome()` 호출 체계 및 891개 버튼 이벤트 위임 체계를 100% 무손실로 보존하면서, 신규 `js/tabs/home/` 모듈들이 `OurgoalRegistry` 및 `OurgoalEvents` 배관을 통해 자율적·안전하게 구동되도록 도킹하는 것.
- **핵심 (Critical Anchor)**:
  - **Zero Data Loss**: 유저의 프로필, 목표, 기록, 스트릭 데이터 단 1바이트도 유실 없음.
  - **Watertight Boundary**: 소블록 하나가 실패해도 홈 화면 및 타 블록은 정상 렌더링 유지.

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Guardrails)**:
  - `renderHome()` 및 관련 기존 함수를 무단 삭제하거나 인라인 핸들러를 파괴하지 않는다 (합집합 보존 원칙).
  - 800줄을 초과하는 거대 파일을 생성하지 않는다 (Cell Division 원칙).
  - 전역 스코프를 오염시키는 신규 글로벌 변수를 남발하지 않고 `window.OurgoalHomeMegaBlock` 및 네임스페이스로 격리한다.
- **할 것 (Actions)**:
  - `js/tabs/home/` 디렉터리에 4대 블록 파일 구축:
    1. `index.js`: 홈 메가블록 오케스트레이터 허브.
    2. `sub-heatmap.js`: 상단 히트맵 요약 스트릭 소블록.
    3. `sub-today.js`: 오늘의 미션 및 1초 콕핏 빠른 체크인 소블록.
    4. `sub-quest.js`: 데일리 퀘스트 및 레벨/EXP 배지 소블록.
  - `index.html`의 `initShipyardRegistry()`에서 홈 메가블록을 `OurgoalRegistry`에 등록하고 위임 마운트 배선.
  - 단위 테스트(`scripts/test-home-blocks.js`)를 통해 5개 검증 항목 사전 완비.

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **1~3 재검토**:
  - 홈 화면은 앱의 첫 진입점(`setTab('home')` 및 초기화)이므로, 스크립트 로드 순서가 어긋나거나 모듈이 미정의되었을 때의 폴백이 필수적임.
- **보완책**:
  - `js/tabs/home/*.js`가 로드되지 않더라도 기존 인라인 `renderHome()`이 자동으로 실행되도록 하는 안전한 2중 방화벽(Graceful Fallback)을 구축함.
  - 게스트 모드, 목표 0개 콜드스타트, 네트워크 오프라인 상태에서도 완벽히 렌더링되도록 엣지 케이스 방어.

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
1. **[단계 1: 디렉터리 및 소블록 3종 생성]**:
   - `js/tabs/home/sub-heatmap.js`, `js/tabs/home/sub-today.js`, `js/tabs/home/sub-quest.js` 작성.
2. **[단계 2: 홈 메가블록 허브 생성]**:
   - `js/tabs/home/index.js` 작성 및 소블록 통합 오케스트레이션 배선.
3. **[단계 3: 단위 테스트 작성 및 사전 검증]**:
   - `scripts/test-home-blocks.js` 작성 및 Node.js 단위 테스트 통과 확인.
4. **[단계 4: 도크(index.html) 배선]**:
   - 스크립트 태그 배치 및 `initShipyardRegistry()` 위임 로직 결합.
5. **[단계 5: 전수 검증 및 법정 심사 청구]**:
   - `npm test` (스모크, 무결성 게이트, 전수 클릭) 전수 통과 확인.
   - `claims.json` 및 시나리오 작성 후 GitHub PR 생성.

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **반대 논거 1**:
  - *"홈 탭의 로직을 파일로 분리하면 전역 변수 `state`나 `escapeHtml`, `computeStreakDays` 같은 인라인 유틸리티 함수에 접근하지 못해 런타임 ReferenceError가 발생할 수 있다."*
  - **반박 및 수용**:
    - 홈 블록 모듈은 마운트 시 `container`, `state`, `events`를 파라미터로 명시적으로 전달받으며, 인라인 헬퍼 함수들은 `window` 스코프 또는 주입된 컨텍스트를 안전하게 참조하도록 설계함. 모듈 로드 시 즉시 실행이 아니라 `mount()` 시점에 지연 실행되므로 전역 함수 미정의 오류를 원천 차단함.
- **반대 논거 2**:
  - *"이미 `renderHome()`이 잘 돌고 있는데 소블록으로 나누면 렌더링 호출 횟수가 2배가 되어 성능 저하나 화면 깜빡임이 생길 수 있다."*
  - **반박 및 수용**:
    - `OurgoalHomeMegaBlock.mount()`가 호출되면 내부 소블록들이 순차적으로 각자의 슬롯 DOM만을 정밀 타겟팅하여 렌더링하므로 불필요한 전체 재렌더링을 억제함. 또한 가상 래퍼 호출 비용은 마이크로초 단위에 불과하여 깜빡임이 일절 발생하지 않음을 단위 테스트로 실측함.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **물리적 성공 지표**:
  - `scripts/test-home-blocks.js` 단위 테스트 5개 항목 100% PASS.
  - `npm test`: 440 smoke tests, 38 integrity gates, 891 buttons dead click 100% PASS (Zero Regression).
  - 모듈 파일 줄 수: 각 소블록 및 허브 파일 800줄 이하 엄수 (헌법 제3조 제9항 3호).
  - `OurgoalRegistry.listSubBlocks('home')` 호출 시 3개 소블록(`heatmap`, `today`, `quest`) 정상 반환.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1: 스크립트 로드 순서 불일치**:
  - `index.html`에서 `js/core/`보다 먼저 `js/tabs/`가 로드되거나, 허브보다 소블록이 늦게 로드되는 경우.
  - **대응 및 트리거**: 소블록 로드 순서를 `sub-*.js` ➔ `index.js` 순으로 고정하고, `OurgoalHomeMegaBlock` 내부에서 등록 지연 가드를 배치함.
- **예상 블로커 2: DOM 슬롯 미존재**:
  - 슬롯 요소가 아직 생성되지 않은 상태에서 마운트 시도.
  - **대응 및 트리거**: `mount` 함수 내에서 `document.getElementById` 방어 코드를 갖추고, 없으면 경고만 로깅하고 건너뛰는 수밀 방화벽 가동.
