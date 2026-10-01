# [요구사항 정의서] #TASK-INFRA-SHIPYARD-MODULAR-PHASE7: 조선소 블록 건조 7단계 (설정 탭 메가블록 및 소블록 외판 분리 도킹 — 전 탭 모듈화 완결)

## 1. [원칙 ①] 진짜 문제의 정의 및 명확화 (Root Problem Definition)
- **과업명**: `#TASK-INFRA-SHIPYARD-MODULAR-PHASE7` (설정 탭 메가블록 및 소블록 외판 분리 도킹 — 전 탭 모듈화 완결)
- **문제의 본질**:
  - 아워골의 6대 핵심 탭 중 마지막 기틀인 설정 탭(Settings Mega-Block)의 프로필 편집, 아바타 보관함 연동, 2단계 인증(2FA), 원격 기기 제어, 화면 스타일 테마 4종(성소·블랙·화이트·도심), 알림/위젯 및 프라이버시 공개범위 등이 모놀리식 `index.html` 내부에 수천 줄 규모로 결합되어 있어 단일 파일 비대화 및 유지보수 위험도가 높음.
  - 조선소 블록 건조 공법 7단계에 따라 설정 탭을 독립 메가블록(`js/tabs/settings/`)으로 격리 건조하고, 3대 세부 소블록(`sub-profile.js`, `sub-security.js`, `sub-appearance.js`)으로 외판을 분리하여 자율 도킹을 실현하고, 전 탭 모듈화를 완결해야 함.
- **성공 지표**:
  - `js/tabs/settings/` 하위 신설 파일 4종 모두 800줄 이하 엄격 준수 (헌법 제3조 제9항).
  - 기존 유저 프로필, 보안 설정(2FA/PIN), 테마 설정, 백업 데이터 100% 무손실 보존.
  - 892개 데드클릭 방화벽 및 38개 무결성 게이트 100% 통과 유지.
  - 기관실(`OurgoalRegistry`)에 설정 탭 및 소블록 3종이 결함 없이 도킹 및 초기화.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Essence, Causes, Core & Anchor)
- **본질 (Essence)**:
  - 아워골의 3대 본질을 뒷받침하는 최종 통제소인 설정 탭을 '블록형 모듈러 아키텍처'로 전환하여, 프로필·보안·화면테마 기능이 독립적으로 진화할 수 있는 안전한 선체 구조를 완성하는 것.
  - **3대 철학 심사**:
    1. **무공해성 (Anti-Pollution)**: 광고 없는 순수 환경 유지, 선택적 크레딧 옵트인, 불필요한 알림 차단.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 테마 변경(성소/블랙/화이트/도심) 즉각 체감 및 아바타 320종 보관함 실시간 반영.
    3. **동류 연대 (Peer Accompaniment)**: 프라이버시 공개범위 및 디스코드 방식 태그(#1000~#9999) 관리로 안전한 동류 소통 보장.
- **원인 (Root Causes)**:
  - 과거 단일 파일 구조로 인해 설정 화면의 프로필 카드, 계정 보안 토글, 테마 칩 바, 위젯 설정 로직이 인라인 전역 스코프에 결합되어 있던 문제.
  - 특정 설정 서브 기능 오류 발생 시 설정 전체 렌더링이 중단될 수 있는 수밀 격벽의 부재.
- **중심 (Core Bottleneck)**:
  - 기존의 `renderSettingsScreen()`, `renderProfileCard()`, `collapseAllSettingsSections()` 등 검증된 렌더러와 892개 버튼 인터랙션을 100% 보존하면서, 신규 `OurgoalSettingsMegaBlock`이 `OurgoalRegistry`와 `OurgoalEvents`를 통해 독립적으로 마운트 및 동기화되도록 하는 배선 정합.
- **핵심 (Critical Anchor)**:
  - **Zero Data Loss**: 유저의 계정 정보, PIN, 2FA 토글, 테마 선택값 100% 무손실 보존.
  - **Watertight Boundary**: 소블록 단위 오류 격리 및 Graceful Fallback 유지.
  - **800줄 이하 엄수**: 헌법 제3조 제9항 세포분열 원칙(전 신규 모듈 200줄 이하 설계).

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Guardrails)**:
  - 기존 `renderSettingsScreen()` 및 인라인 버튼 이벤트 핸들러를 임의 삭제하거나 파괴하지 않는다.
  - 800줄을 초과하는 모듈을 생성하지 않는다 (Cell Division 원칙).
  - 기존 `window.state.profile.settings` 스키마를 변경하지 않는다.
- **할 것 (Actions)**:
  - `js/tabs/settings/` 디렉터리에 4대 블록 파일 구축:
    1. `index.js`: 설정 메가블록 오케스트레이터 허브 (`OurgoalSettingsMegaBlock`).
    2. `sub-profile.js`: 프로필 편집, 닉네임/태그, 아바타 보관함 연동 소블록 (`OurgoalSettingsSubProfile`).
    3. `sub-security.js`: 계정 보안, 2FA, 기기 세션 관리, 데이터 백업 소블록 (`OurgoalSettingsSubSecurity`).
    4. `sub-appearance.js`: 화면 스타일 테마 4종, 알림/위젯, 프라이버시 소블록 (`OurgoalSettingsSubAppearance`).

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Zero-Regression)
- **불파괴 보증 (Zero-Regression Guarantee)**:
  - 기존 `renderSettingsScreen()` 함수는 원형 그대로 존속하며, 신규 모듈은 선체 레지스트리(`OurgoalRegistry`)에 외판 블록으로 등록되어 보조 렌더링 및 점진적 위임을 안전하게 수행함.
  - 테마 전환, 프로필 저장, 2FA PIN 검증 등 기존 설정 인터랙션이 100% 완벽히 유지됨.

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **[단계 1: 소블록 3종 건조]**:
   - `sub-profile.js`: 프로필 카드 렌더링 및 닉네임/태그 관리 구현.
   - `sub-security.js`: 2FA 스위치, 기기 목록, 백업/복원 연동 구현.
   - `sub-appearance.js`: 4대 테마 토글, 위젯 미리보기, 프라이버시 선택자 구현.
2. **[단계 2: 설정 메가블록 허브 건조]**:
   - `index.js`: 3종 소블록 자동 등록, `OurgoalRegistry` 도킹 및 수밀 격벽(try/catch) 구현.
3. **[단계 3: 단위 테스트 작성 및 전수 통과]**:
   - `scripts/test-settings-blocks.js`를 작성하여 5대 핵심 기능 검증.
4. **[단계 4: index.html 선체 도킹 배선]**:
   - 스크립트 로드 태그 4종 배치 및 `initShipyardRegistry()` 내 배선 연결.
5. **[단계 5: 법정 청구서 및 시나리오 작성]**:
   - `claims.json`, `settings-dock.json`, `settings-subtabs.json` 작성.
6. **[단계 6: 전수 검증 및 PR 심사 청구]**:
   - 무결성 게이트 및 데드클릭 전수 통과 확인 후 커밋, 푸시, PR 생성.

## 6. [원칙 ⑥] 절차 재검증 및 반론 검토 (Procedure Verification & Counterarguments)
- **소블록 예외 발생 시 전역 오염 가능성 반론**:
  - 각 소블록 실행부는 `try/catch` 수밀 격벽으로 완벽히 래핑되어 단일 소블록의 렌더링 실패가 타 소블록이나 앱 전체에 전파되지 않도록 설계함.

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- `scripts/test-settings-blocks.js` 5/5 통과.
- `scripts/verify-integrity-gate.js` 38/38 ALL PASS.
- `scripts/verify-all-clicks.js` 892개 버튼 Zero Dead-Click PASS.
- 신규 파일 전수 800줄 이하 유지.

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- 테마 실시간 전환(`setTheme`) 및 아바타 변경 시 뷰포트 미반영 위험을 방지하기 위해, `OurgoalEvents.on('theme:changed')` 및 `OurgoalEvents.on('profile:updated')` 양방향 반응형 배선을 구축함.
