# [작업계획서] #TASK-INFRA-SHIPYARD-MODULAR-HARDENING: 조선소 블록 모듈화 하드닝 실행 계획

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Scope Analysis)
- **대상 과업**: `#TASK-INFRA-SHIPYARD-MODULAR-HARDENING`
- **영향 파일 목록**:
  - `index.html`: 더미 마크업 및 핸들러 90줄 삭제 (-88줄 순감소).
  - `js/tabs/home/index.js`: 수밀 가드 탑재 (127줄).
  - `js/tabs/goals/index.js`: 수밀 가드 탑재 (111줄).
  - `js/tabs/calendar/index.js`: 수밀 가드 탑재 (111줄).
  - `js/tabs/records/index.js`: 수밀 가드 탑재 (111줄).
  - `js/tabs/comm/index.js`: 수밀 가드 탑재 (111줄).
  - `js/tabs/settings/index.js`: 수밀 가드 탑재 (111줄).
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-HARDENING/`: 법정 주장서 및 시나리오.
  - `docs/rules/TICKETS.md`: 티켓 대장 등재.

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
  - **이중 렌더링 방어**: `OurgoalRegistry.mount` 호출 시 `mountedCount`를 측정하여 하위 소블록이 성공적으로 마운트되었을 경우 전체 레거시 렌더러를 다시 호출하지 않도록 조건부 분기.
  - **안전 폴백**: 소블록 마운트가 누락되거나 에러가 났을 때만 레거시 렌더러로 폴백하여 점진적 무손실 보장.

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- `index.html`: 삭제 90줄, 추가 2줄 (순감소 88줄).
- `js/tabs/*/index.js`: 파일당 약 15~20줄 변경.
- 총 변경 예산: +88줄 / -133줄 (순감소 45줄 내외).

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Zero Regression Review)
- 기존 6대 탭의 모든 화면과 비즈니스 로직은 소블록의 `render` 함수를 통해 그대로 수행되며, 화면 누락 방지 가드가 결합되어 100% 안전함.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `index.html` 내 `og-task-shipyard-p1-container` 및 `handle조선소_ItemP1Action` 제거.
2. 6대 메가블록 `index.js`에 `mountedCount` 가드 탑재.
3. `npm test` 실행 및 4대 게이트 무결성 확인.
4. 법정 주장서(`claims.json`) 및 시나리오 작성.
5. 로컬 법정 예비 점검(`court/judge.js --quick`) 실행 및 검증.
6. Git 브랜치 푸시 및 PR 생성.

## 6. [원칙 ⑥] 절차 재검증 및 Anti-SPOF (Anti-SPOF & Counterarguments)
- 소블록이 DOM을 그리지 못할 위험(SPOF) 방지: `mountedCount === 0`일 때 레거시 렌더러가 즉시 호출되어 완벽한 2차 안전망 제공.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- 로컬 `npm test` ALL PASS.
- `court/judge.js --quick` 통과.

## 8. [원칙 ⑧] 막히는 지점 예상 및 대응 (Blockers & Triggers)
- 법정 시나리오에서 게스트 진입 화면 렌더링 확인 단계가 정확히 동작하는지 사전 검증.
