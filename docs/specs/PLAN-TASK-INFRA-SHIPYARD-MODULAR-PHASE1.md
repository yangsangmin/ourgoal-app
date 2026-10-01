# [작업계획서 (PLAN)] #TASK-INFRA-SHIPYARD-MODULAR-PHASE1: 조선소 블록 건조 1단계 (공통 기관실·배관망 및 도크 레지스트리 구축)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **작업 목표**:
  - 최고 헌법 제3조 제9항(조선소 블록형 모듈화 규범) 비준에 따라, 38,000줄 거대 모놀리스를 6대 메가블록 및 28대 소블록으로 분리·조립하기 위한 공통 인프라(기관실 `js/core/` 3대 모듈: 이벤트 버스, 레지스트리, 스토어)를 구축하고 `index.html` 도크에 최초 결합.
- **기저 층위 및 영향 범위**:
  - `js/core/event-bus.js`: 전역 이벤트 통신 배관망
  - `js/core/registry.js`: 6대 탭 및 28대 소블록 등록/마운트 도크
  - `js/core/store.js`: 무손실 상태 관리 래퍼
  - `index.html`: 스크립트 로드 및 6대 메가블록 도킹 등록
  - `tests/core-modules.test.js`: 코어 모듈 단위 테스트
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE1/claims.json`: 법정(court) 심사용 5대 청구서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선(Wire) 식별
- **[가목] 본질 (Essence)**:
  - 조선소 공법의 핵심 본질은 **"배관망과 도크의 선행 시공을 통한 완벽한 결함 격리(Fault-Tolerant Watertight Isolation)"**임.
- **[나목] 원인 (Root Cause)**:
  - 기존 코드가 단일 IIFE 내부의 직접 함수 호출로 묶여 있어 한 탭의 수정이 전 탭에 사이드이펙트를 주던 구조적 원인을 해결하기 위해 이벤트 버스 디커플링 구축.
- **[다목] 중심 (Core Flow)**:
  ```text
  [사용자 액션/이벤트] 
       │
       ▼
  OurgoalEvents.emit('event:name', data) 
       │
       ├─► OurgoalStore (상태 갱신 및 localStorage 무손실 보존)
       │
       └─► OurgoalRegistry (도킹된 메가/소블록에 안전한 수밀 렌더링 디스패치)
  ```
- **[라목] 핵심 (Critical Anchor)**:
  - **"유저 데이터 100% 무손실 보존(Zero Data Loss) 및 320종 페르소나/전 기능 무결성"**. 기존 `window.state`의 모든 키(`goals`, `records`, `profile` 등)는 1바이트의 오차도 없이 온전히 유지되어야 함.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `js/core/event-bus.js`: 신규 생성 (약 120줄)
  - `js/core/registry.js`: 신규 생성 (약 180줄)
  - `js/core/store.js`: 신규 생성 (약 150줄)
  - `tests/core-modules.test.js`: 신규 생성 (약 180줄)
  - `index.html`: 약 +40줄 / -5줄 (스크립트 로드 및 6대 메가블록 도킹 배선)
  - `docs/rules/TICKETS.md`: 티켓 추가 (+2줄)
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE1/claims.json`: 신규 생성 (+80줄)
- **4위 1체 배선 명세**:
  - 마크업: `index.html` 내 `<script src="js/core/...">` 3개 배치.
  - 리스너: `OurgoalEvents.on('view:sync', ...)` 전역 리스너 배선.
  - 핸들러: `OurgoalRegistry.mount(megaId)` 도크 마운터 배선.
  - 피드백: 블록 마운트 에러 발생 시 콘솔 로깅 및 안전한 폴백 렌더링 피드백.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- **유저 자산 보존 재검토**:
  - `OurgoalStore`는 기존 `state` 객체를 참조하고 감싸는 프록시 구조이므로 기존의 직접 접근(`state.goals`)과 `OurgoalStore.getState().goals` 양방향 모두 완벽히 호환됨.
- **기존 테스트 100% 보존**:
  - `smoke-test.js`의 440개 테스트 중 단 하나도 수정하지 않고 그대로 통과해야 함.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `js/core/event-bus.js` 구현
   - `class EventBus`, `window.OurgoalEvents = new EventBus()`.
   - Node.js 환경(`module.exports`) 및 브라우저 환경(`window`) 동시 지원.
2. **Step 2**: `js/core/registry.js` 구현
   - `class BlockRegistry`, `window.OurgoalRegistry = new BlockRegistry()`.
   - 수밀 격벽(try/catch) 에러 핸들링 탑재.
3. **Step 3**: `js/core/store.js` 구현
   - `class StateStore`, `window.OurgoalStore = new StateStore()`.
   - 기존 `state`와 자동 양방향 연동.
4. **Step 4**: `tests/core-modules.test.js` 작성 및 Node.js 단위 검증.
5. **Step 5**: `index.html` 상단에 스크립트 3개 로드 추가 및 `boot()` 시점에 6대 메가블록 도크 등록.
6. **Step 6**: `dispatchFullViewPropagation`에 `OurgoalEvents.emit('view:sync')` 발행 연동.
7. **Step 7**: `reports/TASK-INFRA-SHIPYARD-MODULAR-PHASE1/claims.json` 작성.
8. **Step 8**: 전수 테스트 검증 및 법정 심사 청구.

---

## 6. [원칙 ⑥] 실행 절차 재검증 및 반대 논거 검토 (Procedure Re-verification)
- **반대 논거 1**:
  - *비판*: "모듈러 시스템을 도입하면 기존 `window.state` 직접 수정 코드들과 충돌하지 않는가?"
  - *반박 및 수용*: `OurgoalStore`는 `window.state`를 덮어쓰거나 대체하지 않고, 내부적으로 `window.state`를 참조하는 래퍼로 작동함. 따라서 기존 38,000줄의 `state.goals = ...` 코드는 100% 그대로 동작하면서 점진적으로 Store 메서드로 전환될 수 있음.
- **반대 논거 2**:
  - *비판*: "이벤트 버스가 무한 루프를 유발할 가능성은 없는가?"
  - *반박 및 수용*: 이벤트 이름 네임스페이스를 엄격히 규격화하고, 이벤트 발행 시 동일 이벤트의 재귀 호출을 감지하여 방어하는 안전장치(Recursion Guard)를 `OurgoalEvents`에 탑재함.

---

## 7. [원칙 ⑦] 검증 계획 및 합격 기준 (Verification Criteria)
- **검증 명령 및 기준**:
  1. `node tests/core-modules.test.js`: 코어 3모듈 단위 테스트 ALL PASS.
  2. `node scripts/verify-integrity-gate.js`: 38개 헌법 게이트 100% 통과.
  3. `npm test`: 스모크 440개 테스트 100% 통과.
  4. `node scripts/verify-all-clicks.js`: 데드 클릭 0건.
  5. `node court/vault-check.js . origin/main HEAD`: 금고 및 제품 파일 분류 무결성 확인.
  6. `node C:/dev/command-center/lib/tri-sync.js check`: 100% 동기화.

---

## 8. [원칙 ⑧] 롤백 및 영향 완화 대책 (Rollback & Impact Mitigation)
- **비상 롤백 절차**:
  - `git checkout origin/main -- index.html` 및 `rm -rf js/core/` 실행 시 1초 만에 개정 전 상태로 완전 복원.
  - 데이터베이스 스키마나 로컬스토리지 키 변경이 없으므로 데이터 복구 작업 불필요.
