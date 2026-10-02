# [요구사항 정의서] #TASK-INFRA-SHIPYARD-MODULAR-HARDENING: 조선소 블록 모듈화 하드닝 (검증 마크업 소탕 및 이중 렌더링 방어)

## 1. [원칙 ①] 진짜 문제의 정의 및 명확화 (Root Problem Definition)
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-HARDENING` (조선소 블록 모듈화 하드닝)
- **문제의 본질**:
  - 조선소 1단계 구축 당시 배선 확인용으로 삽입되었던 카드 UI(`og-task-shipyard-p1-container`) 및 테스트 핸들러(`handle조선소_ItemP1Action`)가 프로덕션 운영 화면에 잔존하여 최고 헌법 제4조 제1항 제10호(운영 화면 내 검증 마크업 오염 금지)를 위반하고 있었음.
  - 메가블록 `mount()` 시 하위 소블록들이 정상 마운트되었음에도 레거시 전체 렌더러(`renderHome`, `renderGoalsScreen` 등)를 무조건 중복 호출하여 동일 컴포넌트가 2번씩 다시 그려지는 이중 렌더링(Double Rendering) 성능 병목이 존재했음.
- **성공 지표**:
  - `index.html` 내 테스트용 마크업 및 핸들러 90줄 완전 소탕 (순감소 -88줄 달성).
  - 6대 메가블록(`home`, `goals`, `calendar`, `records`, `comm`, `settings`)에 `mountedCount` 기반 수밀 가드 탑재로 중복 렌더링 차단.
  - `npm test` 38개 무결성 검증, 941개 전수 버튼 Zero Dead-Click 100% 통과 유지.
  - 헌법 제3조 제9항 800줄 이하 엄수 (111~127줄 유지).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 사용자 화면에서 개발/검증용 오염 물질을 100% 걷어내고, 불필요한 DOM 스래싱을 방지하여 매끄럽고 빠른 무공해 성장 환경을 유저에게 보장.
- **원인 (Root Causes)**:
  - 1단계 배선 검증 시 편의상 추가했던 마크업이 이후 단계에서 제때 소탕되지 못하고 방치됨.
  - 메가블록 오케스트레이터가 소블록 렌더링과 레거시 렌더러 간의 실행 조율 없이 둘 다 실행함.
- **중심 (Core Bottleneck)**:
  - 소블록 정상 마운트 여부에 따른 조건부 폴백 가드 부재.
- **핵심 (Critical Anchor)**:
  - **Zero Regression**: 6대 탭 기존 화면 및 유저 데이터 100% 무손실 보존.
  - **Zero Test-Markup**: 프로덕션 화면 내 테스트용 컴포넌트 잔존 0건.

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Guardrails)**:
  - 메가블록/소블록의 외부 인터페이스 및 Pub/Sub 배관망을 파괴하지 않는다.
  - `OurgoalRegistry.mount` 연동 체계를 훼손하지 않는다.
- **할 것 (Actions)**:
  - `index.html` 내 `og-task-shipyard-p1-container` 및 `handle조선소_ItemP1Action` 영구 삭제.
  - 6대 메가블록 `mount()`에 `mountedCount > 0` 수밀 가드 탑재.
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-HARDENING/` 법정 심사 청구서 작성.

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Zero-Regression)
- **불파괴 보증**:
  - 하위 소블록이 없거나 로드 실패 시에만 기존 전체 렌더러를 안전 폴백(Fallback)으로 호출하므로 어떠한 예외 상황에서도 빈 화면이 뜨지 않음.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `index.html` 내 더미 마크업 및 핸들러 삭제.
2. 6대 메가블록 `index.js` 수밀 가드 보강.
3. `npm test` 4대 게이트 전수 통과 확인.
4. 법정 심사 청구서 및 시나리오 작성.
5. `node court/judge.js --quick` 예비 점검 통과.
6. Git 브랜치 푸시 및 초안 PR 제출.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토 (Procedure Verification & Counterarguments)
- **반론**: 더미 버튼 삭제 시 `verify-all-clicks.js`가 깨지지 않는가?
  - 정적 버튼 개수가 942개에서 941개로 정상 감소하고, 남은 941개 전원 엄밀 배선 확인 통과(Pass).

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- `verify-integrity-gate.js` 38/38 통과.
- `verify-all-clicks.js` 941/941 통과.
- `court/judge.js --quick` 판정 통과.
