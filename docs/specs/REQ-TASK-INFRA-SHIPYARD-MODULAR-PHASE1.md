# [요구사항 정의서 (REQ)] #TASK-INFRA-SHIPYARD-MODULAR-PHASE1: 조선소 블록 건조 1단계 (공통 기관실·배관망 및 도크 레지스트리 구축)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > "이제 진짜 모듈화 진행해야지?" (2026-10-02 02:43 KST)
- **표면적 현상**:
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`에 제3조 제9항 [조선소 블록형 모듈화 및 진화형 아키텍처 규범]이 법적으로 비준되었으나, 아직 물리적인 공통 기관실(`js/core/`)과 레지스트리 도크가 구현되지 않아 코드가 단일 `index.html`(38,468줄)에 묶여 있음.
- **기저 층위 심층 분석**:
  - *1층 (물리적 기반 부재)*: 블록들이 상호 통신할 표준화된 이벤트 버스(`OurgoalEvents`)와 블록들을 탑재할 도크 레지스트리(`OurgoalRegistry`)가 디스크에 물리적으로 존재하지 않음.
  - *2층 (상태 동기화 단절 위험)*: 각 탭이 분리될 때 전역 상태(`state`)와 로컬스토리지에 단일 원장으로 접근할 수 있는 표준 래퍼(`OurgoalStore`)가 필요함.
  - *3층 (단계적 전환 공법 부재)*: 한 번에 모든 탭을 쪼개면 38,000줄 규모의 런타임 충돌이 발생할 수 있으므로, 헌법 제3조 제9항 제5호에 명시된 **Strangler Fig Pattern(교살자 무중단 점진 전환 공법)**을 위한 도크를 가동해야 함.
- **대상 사용자 및 페르소나**:
  - 아워골 전체 320종 페르소나 및 향후 코드를 분리·유지보수할 모든 AI 세션과 개발자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **귀속 축**: `INFRA (기반 인프라 및 아키텍처 공법)`
- **[가목] 본질 (Essence)**:
  - 아워골 조선소 공법의 본질은 **"소프트웨어 선박의 공통 배관망(Piping Network) 및 모듈 장착 도크(Modular Dock)의 완벽한 수밀 결함 격리(Watertight Isolation)"**임.
  - 배관망(`js/core/event-bus.js`)이 먼저 설치되어야 엔진(메가블록)과 선실(소블록)이 독립적으로 장착되고 상호 결합도 없이 신호를 주고받을 수 있음.
- **[나목] 원인 (Root Causes 3가지)**:
  1. *원인 1*: 38,000줄 단일 IIFE 함수 내부에서 탭 간 데이터 전파가 직접 함수 호출(`renderHome`, `renderGoalsScreen`, `dispatchFullViewPropagation`)로 강하게 결합되어 있어 물리적 파일 분리가 불가능했던 구조.
  2. *원인 2*: 블록을 독립된 파일로 뺐을 때 안전하게 등록하고 렌더링을 위임할 동적 레지스트리 아키텍처의 부재.
  3. *원인 3*: 검증기(`smoke-test.js`)에 과거 족쇄인 `lines >= 20000`가 남아 있어 블록 분리 시도시 테스트가 깨질 위험.
- **[다목] 중심 (Core Bottleneck)**:
  - **"무중단 점진 이관(Strangler Fig Pattern) 보장"**: `index.html` 내 기존 기능이 100% 정상 작동하는 상태에서 `OurgoalRegistry`와 `OurgoalEvents`를 선(先) 배선하고, 6대 탭이 순차적으로 도크에 결합될 수 있는 안전한 인터페이스를 확립하는 것.
- **[라목] 핵심 (Critical Anchor)**:
  - **"유저 데이터 100% 무손실 보존(Zero Data Loss) 및 440개 스모크/38개 무결성 게이트 0개 실패"**. `js/core/` 도입 시 기존 `window.state` 및 `localStorage`(`ourgoal_profile`, `goals`, `checkins`) 원장이 단 1바이트도 손상되지 않아야 함.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **해결 방식**:
  1. **`js/core/event-bus.js` 구축**:
     - 발행/구독(Pub/Sub) 패턴의 경량 이벤트 버스 (`OurgoalEvents` / `window.OurgoalEvents`).
     - 메서드: `on(event, handler)`, `emit(event, payload)`, `off(event, handler)`, `once(event, handler)`.
     - 표준 이벤트: `goal:created`, `goal:updated`, `record:saved`, `profile:updated`, `tab:changed`, `view:sync`.
  2. **`js/core/registry.js` 구축**:
     - 6대 메가블록 및 28대 소블록을 관리하는 조선소 레지스트리 (`OurgoalRegistry` / `window.OurgoalRegistry`).
     - 메서드: `registerMegaBlock(id, config)`, `registerSubBlock(megaId, subId, config)`, `mount(megaId, containerEl)`, `getBlock(megaId, subId)`.
     - 각 블록 렌더링 시 try/catch 수밀 격벽(Watertight Boundary) 탑재: 특정 블록의 에러가 다른 블록이나 전체 앱에 전파되지 않도록 완벽 격리.
  3. **`js/core/store.js` 구축**:
     - 전역 상태 접근 및 변경 래퍼 (`OurgoalStore` / `window.OurgoalStore`).
     - 기존 `window.state`와 양방향 100% 미러 동기화 및 변경 시 `OurgoalEvents.emit('state:changed', ...)` 자동 트리거.
  4. **`index.html` 도크 연결**:
     - `<script src="js/core/event-bus.js"></script>`, `<script src="js/core/registry.js"></script>`, `<script src="js/core/store.js"></script>` 추가.
     - 6대 메가블록(`home`, `goals`, `calendar`, `records`, `comm`, `settings`) 기본 뼈대 도크 등록.
     - `dispatchFullViewPropagation` 실행 시 `OurgoalEvents.emit('view:sync')` 동시 발행 배선.
- **하지 말 것 (Negative Constraints)**:
  - 기존 `index.html` 내 비즈니스 로직을 성급하게 일괄 삭제하는 파괴적 리팩토링 금지 (Phase 1은 인프라 및 도크 안착이 목적).
  - 전역 스코프 오염 방지: `OurgoalEvents`, `OurgoalRegistry`, `OurgoalStore` 외에 불필요한 전역 변수 생성 금지.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Zero Regression)
- **유저 자산 보존 검토**:
  - `OurgoalStore`는 기존 `state` 객체와 로컬스토리지를 감싸는 프록시/래퍼 역할을 수행하므로 기존 키 구조와 데이터는 단 1바이트도 변경되지 않음.
- **기존 440개 테스트 보존 검토**:
  - 기존 탭 렌더링 함수(`renderHome()`, `renderGoalsScreen()` 등)는 그대로 존속하며 레지스트리가 이를 호출하도록 위임하므로 모든 기존 스모크 단언 100% 통과 보장.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `docs/rules/TICKETS.md`에 `#TASK-INFRA-SHIPYARD-MODULAR-PHASE1` 티켓 등록.
2. **Step 2**: `js/core/` 디렉터리 생성 및 3대 코어 모듈 파일 작성:
   - `js/core/event-bus.js`
   - `js/core/registry.js`
   - `js/core/store.js`
3. **Step 3**: `tests/core-modules.test.js` 단위 테스트 작성 및 독립 검증.
4. **Step 4**: `index.html` 상단에 3대 코어 스크립트 로드 태그 배치 및 `boot()` 시점에 6대 메가블록 도킹 초기화.
5. **Step 5**: `dispatchFullViewPropagation` 내에 `OurgoalEvents.emit('view:sync')` 이벤트 버스 연계 배선.
6. **Step 6**: 전수 무결성 검증 (`node scripts/verify-integrity-gate.js`, `npm test`, `verify-all-clicks.js`).

---

## 6. [원칙 ⑥] 실행 절차 재검증 및 반대 논거 검토 (Procedure Re-verification)
- **반대 논거 1**:
  - *비판*: "굳이 `js/core/`를 먼저 만들지 말고, 설정 탭(settings)부터 바로 파일로 잘라내면 안 되는가?"
  - *반박 및 수용*: 배관망(이벤트 버스)과 도크(레지스트리)가 없는 상태에서 파일만 분리하면, 다른 탭과의 전역 통신(`dispatchFullViewPropagation` 등)이 끊겨 회귀 결함이 발생함. 선박 건조에서도 배관과 도크가 먼저 있어야 블록을 조립할 수 있으므로 `js/core/` 우선 건조가 가장 안전한 필수 공정임.
- **반대 논거 2**:
  - *비판*: "새로운 스크립트 파일 3개가 추가되면 네트워크 요청이 늘어나 성능이 저하되지 않는가?"
  - *반박 및 수용*: 3개 파일의 총 용량은 수 KB에 불과하며 로컬/PWA 캐시에 즉각 캐싱됨. 38,000줄 단일 거대 파일을 읽고 파싱하는 비용보다 훨씬 경량화되며, 모듈 분할로 인한 점진적 로딩 이점이 압도적임.

---

## 7. [원칙 ⑦] 검증 계획 및 합격 기준 (Verification Criteria)
- **합격 기준 (PASS Criteria)**:
  1. `tests/core-modules.test.js` 신설 및 3대 코어(이벤트 버스, 레지스트리, 스토어) 단위 테스트 전수 통과.
  2. `node scripts/verify-integrity-gate.js` 38개 무결성 검사 100% ALL PASS.
  3. `npm test` 기존 440개 스모크 테스트 0개 실패.
  4. 데드 클릭 0건 (`scripts/verify-all-clicks.js`).
  5. Tri-Sync 무결성 100% (`node C:/dev/command-center/lib/tri-sync.js check`).

---

## 8. [원칙 ⑧] 롤백 및 영향 완화 대책 (Rollback & Impact Mitigation)
- **롤백 절차**:
  - 문제 발생 시 `index.html`에서 `<script src="js/core/...">` 태그를 제거하고 기존 직접 호출 구조로 즉시 롤백 가능.
  - `git revert` 시 `js/core/` 디렉터리 및 추가 파일만 제거되므로 기존 제품 코드에 어떠한 영구적 손상도 남기지 않음.
