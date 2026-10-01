# [요구사항 정의서] #TASK-INFRA-SHIPYARD-MODULAR-FINALE: 조선소 블록 건조 완결 (전 탭 모듈화 도크 통합 종합 검증 및 대장 정합)

## 1. [원칙 ①] 진짜 문제의 정의 및 명확화 (Root Problem Definition)
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-FINALE` (전 탭 모듈화 도크 통합 종합 검증 및 대장 정합)
- **문제의 본질**:
  - 조선소 블록 건조 1단계부터 7단계까지(코어 엔진, 홈, 목표, 기록, 캘린더, 소통, 설정) 6대 핵심 탭과 18개 세부 소블록이 모두 성공적으로 외판 분리 및 도킹 완료되었음.
  - 이제 전체 24개 모듈형 파일의 세포 분열 원칙(헌법 제3조 제9항: 800줄 이하) 전수 충족 여부와, 6대 메가블록 간의 양방향 이벤트 버스 및 상태 동기화가 통합 도크 수준에서 물리적으로 완벽히 연동되는지를 보증하는 마스터 종합 테스트 러너(`test-shipyard-modular.js`)를 영구 자산화하고, `TICKETS.md` 본질 승인 대장에 전 단계 완결 정합을 반영해야 함.
- **성공 지표**:
  - 24개 전 모듈 파일 라인 수 800줄 이하 100% 충족 (실측 68~118줄).
  - 마스터 통합 테스트 러너 `scripts/test-shipyard-modular.js` 5대 시험 100% PASS 및 `package.json`의 `npm test` 스크립트 결합.
  - 440개 스모크 테스트, 38개 무결성 게이트, 892개 데드클릭 제로 100% 통과 유지.
  - `TICKETS.md` 대장에 Phase 7 머지 완료 및 FINALE 완료 등록.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골 전체 프론트엔드가 모놀리식 단일 파일 결속에서 벗어나, 독립적으로 확장·수정 가능한 현대적 진화형 아키텍처(조선소 블록 조립 공법)로의 완전 전환을 선포하고 무결성을 확정하는 것.
  - **3대 철학 심사**:
    1. **무공해성 (Anti-Pollution)**: 거대 파일 엉킴으로 인한 불필요한 번아웃과 충돌을 원천 차단.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 각 탭과 컴포넌트가 독립 모듈로서 즉각적인 이벤트 반응과 뷰 동기화를 실현.
    3. **동류 연대 (Peer Accompaniment)**: 다중 작업자/다중 에이전트가 충돌 없이 동시에 탭별 기능을 개발·개선할 수 있는 기반 확보.
- **원인 (Root Causes)**:
  - 과거 단일 파일(`index.html`) 집중으로 인해 38,000줄 모놀리스가 형성되었던 역사를 단절하고, 각 탭별 독립 메가블록과 소블록 체계로의 안전한 전환을 마침표 찍는 단계.
- **중심 (Core Bottleneck)**:
  - 6대 메가블록과 18개 소블록이 `OurgoalRegistry`와 `OurgoalEvents`를 통해 누락 없이 연결되어 있는지 검증하는 단일 마스터 러너의 부재를 해결.
- **핵심 (Critical Anchor)**:
  - **Zero Regression**: 6대 탭의 모든 기존 화면, 버튼, 유저 데이터 100% 무손실 보존.
  - **Watertight Boundary**: 개별 소블록의 예외가 전체 앱으로 번지지 않는 격벽 검증.
  - **헌법 제3조 제9항 800줄 이하**: 24개 파일 전수 800줄 이하 유지 보증.

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Guardrails)**:
  - 이미 검증 완료된 6대 메가블록 및 18개 소블록의 인터페이스를 변경하거나 파괴하지 않는다.
  - 기존 38개 무결성 검증과 892개 데드클릭 검증을 약화시키지 않는다.
- **할 것 (Actions)**:
  - `scripts/test-shipyard-modular.js` 마스터 통합 테스트 스위트 영구 구축.
  - `package.json`의 `test` 스크립트에 마스터 러너 연동.
  - `docs/rules/TICKETS.md` 대장에 Phase 7 완료 반영 및 FINALE 승인 티켓 등록.
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-FINALE/` 법정 심사 청구서 완비.

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Zero-Regression)
- **불파괴 보증 (Zero-Regression Guarantee)**:
  - 모든 탭의 렌더러와 인라인 인터랙션이 100% 보존되며, 마스터 테스트 러너는 순수 정적/단위 검증 계층으로 동작하므로 프로덕션 런타임에 부작용이 전혀 없음.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **[단계 1]**: 마스터 테스트 러너 `scripts/test-shipyard-modular.js` 작성 및 로컬 검증.
2. **[단계 2]**: `package.json` `scripts.test`에 마스터 테스트 스위트 결합.
3. **[단계 3]**: `docs/rules/TICKETS.md` 대장 최신 상태 갱신.
4. **[단계 4]**: `reports/TASK-INFRA-SHIPYARD-MODULAR-FINALE/claims.json` 및 시나리오 작성.
5. **[단계 5]**: `npm test` 및 `node court/judge.js --quick` 로컬 전수 검증.
6. **[단계 6]**: Git 커밋, 원격 푸시, PR 생성 및 GitHub 법정 심사 청구.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토 (Procedure Verification & Counterarguments)
- **반론**: 마스터 러너 추가로 CI/테스트 실행 시간이 지나치게 늘어나는가?
  - 마스터 러너는 150ms 이내에 순수 JS로 24개 파일과 6대 메가블록의 등록 및 이벤트를 검증하므로 실행 지연이 사실상 0에 수렴함.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- `scripts/test-shipyard-modular.js` 5대 시험 100% 통과.
- `npm test` (스모크 440 + 무결성 38 + 데드클릭 892 + 모듈러 마스터 5) ALL PASS.
- `court/judge.js --quick` 예비 점검 통과.
- PR 생성 후 GitHub 법정 심사 `success` 달성.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- 법정 실행 시 시나리오에서 탭 전환 타이밍 이슈가 발생할 경우, 각 탭 이동 단계에 `#screen-[tab]` 가시성 대기(waitFor)를 보강하여 안정성을 확보함.
