# [요구사항 정의서] #TASK-INFRA-SHIPYARD-MODULAR-PHASE6: 조선소 블록 건조 6단계 (소통 커뮤니티 탭 메가블록 및 소블록 외판 분리 도킹)

## 1. [원칙 ①] 진짜 문제의 정의 및 명확화 (Root Problem Definition)
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-PHASE6` (소통 커뮤니티 탭 메가블록 및 소블록 외판 분리 도킹)
- **문제의 본질**:
  - 아워골의 다섯 번째 핵심 탭인 소통 커뮤니티 탭(Community Mega-Block)의 피드(Feed) 렌더링, 응원/반응 상호작용, 동반자/러닝메이트/DM, 팀/크루/마니또 및 소셜 공유 모듈 등이 모놀리식 `index.html` 내부에 수천 줄 규모로 결합되어 있어 단일 파일 비대화 및 유지보수 위험도가 높음.
  - 조선소 블록 건조 공법 6단계에 따라 소통 커뮤니티 탭을 독립 메가블록(`js/tabs/comm/`)으로 격리 건조하고, 3대 세부 소블록(`sub-feed.js`, `sub-companions.js`, `sub-crew.js`)으로 외판을 분리하여 자율 도킹을 실현해야 함.
- **성공 지표**:
  - `js/tabs/comm/` 하위 신설 파일 4종 모두 800줄 이하 엄격 준수 (헌법 제3조 제9항).
  - 기존 피드, 동반자, 크루, DM 및 공유 데이터 100% 무손실 보존.
  - 892개 데드클릭 방화벽 및 38개 무결성 게이트 100% 통과 유지.
  - 기관실(`OurgoalRegistry`)에 소통 탭 및 소블록 3종이 결함 없이 도킹 및 초기화.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골의 3대 본질 중 '외롭지 않은 고독 속에서 동류를 발견하고 연대하는' 핵심 엔진인 소통 커뮤니티 탭을 '블록형 모듈러 아키텍처'로 전환하여, 피드·동반자·크루 협동 기능이 독립적으로 진화할 수 있는 안전한 선체 구조를 완성하는 것.
  - **3대 철학 심사**:
    1. **무공해성 (Anti-Pollution)**: 허세와 광고 없는 순수 실천 피드 및 칭찬/응원 중심의 무공해 소통 환경 보존.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 피드 인증 시 즉각적인 레벨업 배지, 칭호, 응원 스탬프 인터랙션 체감.
    3. **동류 연대 (Peer Accompaniment)**: 동반자 매칭, 크루 팀 미션, 마니또를 통한 깊은 유대감과 상호 견인력 극대화.
- **원인 (Root Causes)**:
  - 과거 단일 파일 구조로 인해 소통 화면의 피드 필터링, 댓글/응원 처리, 동반자 추천/검색, 팀 생성/활동 내역 로직이 인라인 전역 스코프에 결합되어 있던 문제.
  - 특정 소통 서브 기능 오류 발생 시 소통 전체 렌더링이 중단될 수 있는 수밀 격벽의 부재.
- **중심 (Core Bottleneck)**:
  - 기존의 `renderCommScreen()`, `renderCommFeed()`, `renderCommCompanions()`, `renderCommGroups()` 등 검증된 렌더러와 892개 버튼 인터랙션을 100% 보존하면서, 신규 `OurgoalCommMegaBlock`이 `OurgoalRegistry`와 `OurgoalEvents`를 통해 독립적으로 마운트 및 동기화되도록 하는 배선 정합.
- **핵심 (Critical Anchor)**:
  - **Zero Data Loss**: 유저의 피드 포스트, 응원 내역, 동반자 목록, 크루 데이터 100% 무손실 보존.
  - **Watertight Boundary**: 소블록 단위 오류 격리 및 Graceful Fallback 유지.
  - **800줄 이하 엄수**: 헌법 제3조 제9항 세포분열 원칙(전 신규 모듈 200줄 이하 설계).

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Guardrails)**:
  - 기존 `renderCommScreen()` 및 인라인 버튼 이벤트 핸들러를 임의 삭제하거나 파괴하지 않는다.
  - 800줄을 초과하는 모듈을 생성하지 않는다 (Cell Division 원칙).
  - 기존 `window.state` 및 `localStorage` 스키마를 변경하지 않는다.
- **할 것 (Actions)**:
  - `js/tabs/comm/` 디렉터리에 4대 블록 파일 구축:
    1. `index.js`: 소통 메가블록 오케스트레이터 허브 (`OurgoalCommMegaBlock`).
    2. `sub-feed.js`: 커뮤니티 피드 및 응원/반응 상호작용 소블록 (`OurgoalCommSubFeed`).
    3. `sub-companions.js`: 러닝메이트 / 동반자 / 칭호 / DM 소블록 (`OurgoalCommSubCompanions`).
    4. `sub-crew.js`: 크루 / 팀 / 챌린지 협동 / 마니또 소블록 (`OurgoalCommSubCrew`).

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Zero-Regression)
- **불파괴 보증 (Zero-Regression Guarantee)**:
  - 기존 `renderCommScreen()` 함수는 원형 그대로 존속하며, 신규 모듈은 선체 레지스트리(`OurgoalRegistry`)에 외판 블록으로 등록되어 보조 렌더링 및 점진적 위임을 안전하게 수행함.
  - 피드 작성/좋아요, 동반자 맺기, 팀 만들기, DM 대화 등 기존 소셜 인터랙션이 100% 완벽히 유지됨.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **[단계 1: 소블록 3종 건조]**:
   - `sub-feed.js`: 피드 목록 렌더링, 카테고리 필터링, 응원 상호작용 구현.
   - `sub-companions.js`: 동반자 랭킹, 동반자 목록, 칭호 연동 구현.
   - `sub-crew.js`: 팀/크루 목록, 그룹 상세, 마니또 연동 구현.
2. **[단계 2: 소통 메가블록 허브 건조]**:
   - `index.js`: 3종 소블록 자동 등록, `OurgoalRegistry` 도킹 및 수밀 격벽(try/catch) 구현.
3. **[단계 3: 단위 테스트 작성 및 전수 통과]**:
   - `scripts/test-comm-blocks.js`를 작성하여 5대 핵심 기능 검증.
4. **[단계 4: index.html 선체 도킹 배선]**:
   - 스크립트 로드 태그 4종 배치 및 `initShipyardRegistry()` 내 배선 연결.
5. **[단계 5: 법정 청구서 및 시나리오 작성]**:
   - `claims.json`, `comm-dock.json`, `comm-subtabs.json` 작성.
6. **[단계 6: 전수 검증 및 PR 심사 청구]**:
   - 무결성 게이트 및 데드클릭 전수 통과 확인 후 커밋, 푸시, PR 생성.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토 (Procedure Verification & Counterarguments)
- **소블록 예외 발생 시 전역 오염 가능성 반론**:
  - 각 소블록 실행부는 `try/catch` 수밀 격벽으로 완벽히 래핑되어 단일 소블록의 렌더링 실패가 타 소블록이나 앱 전체에 전파되지 않도록 설계함.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- `scripts/test-comm-blocks.js` 5/5 통과.
- `scripts/verify-integrity-gate.js` 38/38 ALL PASS.
- `scripts/verify-all-clicks.js` 892개 버튼 Zero Dead-Click PASS.
- 신규 파일 전수 800줄 이하 유지.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- 소통 탭의 6대 서브탭(`feed`, `group`, `companion`, `dm`, `manito`, `share`) 전환 시 이벤트 전파 누락을 방지하기 위해, `OurgoalEvents.on('tab:changed')` 및 `OurgoalEvents.on('comm:subtab')` 이중 방어 트리거를 작동시킴.
