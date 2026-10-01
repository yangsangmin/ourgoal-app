# [작업계획서] #TASK-INFRA-SHIPYARD-MODULAR-FINALE: 조선소 블록 건조 완결 (전 탭 모듈화 도크 통합 종합 검증 및 대장 정합)

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-FINALE` (전 탭 모듈화 도크 통합 종합 검증 및 대장 정합)
- **변경 영향 범위**:
  - `scripts/test-shipyard-modular.js`: 신설 (마스터 통합 테스트 스위트)
  - `package.json`: 수정 (`npm test`에 마스터 테스트 스위트 결합)
  - `docs/rules/TICKETS.md`: 수정 (Phase 7 머지 완료 처리 및 FINALE 티켓 등록)
  - `docs/specs/REQ-TASK-INFRA-SHIPYARD-MODULAR-FINALE.md`: 신설 (요구사항 정의서)
  - `docs/specs/PLAN-TASK-INFRA-SHIPYARD-MODULAR-FINALE.md`: 신설 (작업계획서)
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-FINALE/claims.json`: 신설 (법정 주장)
  - `reports/TASK-INFRA-SHIPYARD-MODULAR-FINALE/scenarios/shipyard-all-tabs.json`: 신설 (법정 시나리오)

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골의 6대 핵심 탭과 18대 소블록의 전면 모듈화 완결 상태를 단일 마스터 러너(`test-shipyard-modular.js`)를 통해 영구 검증 자산화하고, 헌법 제3조 제9항 세포분열 800줄 이하 규범을 시스템적으로 수호하는 것.
- **원인 (Root Causes)**:
  - 6대 탭 개별 분리 건조 완료 후, 24개 모듈 전체의 라인 수와 블록 레지스트리 도킹 상태를 한 번에 검증하는 통합 자동화 러너의 부재.
- **중심 (Core Bottleneck)**:
  - 6대 메가블록 간의 `OurgoalEvents` 크로스 방송 및 4대 뷰 동시 전파가 통합 환경에서 단절 없이 작동함을 입증하는 것.
- **핵심 (Critical Anchor)**:
  - **Zero Regression**: 440개 스모크 및 38개 무결성 게이트, 892개 데드클릭 제로 보존.
  - **세포분열 원칙**: 24개 모듈 파일 전수 800줄 이하 엄수.
  - **수밀 격벽(Watertight Boundary)**: 단일 소블록 결함 시 앱 전체 전파 차단 보증.

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- `scripts/test-shipyard-modular.js`: +150 줄
- `package.json`: +1 / -1 줄
- `docs/rules/TICKETS.md`: +15 / -5 줄
- 총 추가 줄 수: 약 200줄 내외 (초경량 무결성 정합)

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- 기존 런타임 코드 및 HTML 마크업에 어떠한 파괴적 수정도 가하지 않음.
- 440개 스모크 테스트, 38개 무결성 게이트, 892개 데드클릭 제로 100% 무손실 유지.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `scripts/test-shipyard-modular.js` 마스터 테스트 작성 및 실행.
2. `package.json`의 `test` 스크립트에 러너 등록.
3. `docs/rules/TICKETS.md` 대장에 FINALE 등록.
4. `reports/TASK-INFRA-SHIPYARD-MODULAR-FINALE/` 법정 청구서 완비.
5. 로컬 테스트 및 예비 점검(`node court/judge.js --quick`) 수행.
6. Git 커밋 및 브랜치 푸시, PR 생성.
7. GitHub Actions Court 판정 확인.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토
- **반론**: 이미 Phase 1~7이 머지되었는데 FINALE PR이 필요한가?
  - 마스터 통합 러너 `test-shipyard-modular.js`가 CI에 공식 등록되어 지속적으로 24개 모듈의 라인 수(800줄 이하)와 메가블록 등록을 영구 보증하도록 하는 안전핀이 필요함.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- `node scripts/test-shipyard-modular.js` 100% PASS.
- `npm test` ALL PASS.
- `node court/judge.js --quick` 통과.
- PR 생성 후 법정 판정서 획득.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거
- 법정 시나리오 실행 시 `waitFor` 셀렉터가 누락되지 않도록 `shipyard-all-tabs.json`에 명시적 단계별 셀렉터 확인을 배치함.
