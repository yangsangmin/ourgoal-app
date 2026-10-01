# [요구사항 정의서] #TASK-CHORE-SHIPYARD-MODULAR-CONSTITUTION: 조선소 블록형 모듈화 및 진화형 아키텍처 헌법 개정 및 전면 정비

> **문서 상태**: [정본] 상민님 최종 승인 완료 (승인선 5: 규범 변경)  
> **적용 규격**: 아워골 최고 헌법 제2조(2중 8원칙 헌법) 제1항 및 제5항 100% 준수  
> **분류 축**: `[INFRA / 아키텍처 거버넌스]`

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "헌법에 추가만 하지말고 기존 헌법을 수정해야하는 점은 없나? 문제해결 8원칙 적용해서 재검토하고 최종 헌법 수정안(삭제, 수정, 추가, 개선, 보완 모두 포함)보고해." ➔ "이 최종 헌법 수정안을 승인한다"
- **현상 및 다층위 분석**:
  - **1층 (표면적 결함)**: `index.html`이 38,468줄, `ui.css`가 14,109줄에 달하는 극단적 모놀리스로 비대화되어, 특정 탭 UI/UX 하나만 수정하려 해도 전체 파일을 열어야 하고 Git 병합 충돌과 화면 간 사이드이펙트가 빈번하게 발생함.
  - **2층 (구조적 원인)**: 헌법 제4조 제1항 7호가 프로덕션 코드베이스를 `index.html`, `ui.css`, `ui.js`, `js/`로만 협소하게 정의하고, 제15조 제6항 3호가 4대 뷰 동시 전파를 직접 함수 체이닝(`renderHome()`, `renderGoalsScreen()`)으로 강제하여 탭 간 강결합을 유도해 옴.
  - **3층 (거버넌스 및 족쇄)**: 과거 에이전트들이 코드 삭제 방지용으로 걸어둔 `TECH-RULE-01 (lines >= 20000)` 하한선 족쇄가 폐기되지 않고 방치되어, 이후 작업한 AI들이 코드를 모듈로 분리하지 못하고 `index.html`에 계속 욱여넣도록 만드는 제도적 함정이 되었음.
- **대상 범위**:
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`
  - `docs/rules/CONSTITUTION_VERSIONS.md`
  - `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
  - `scripts/verify-integrity-gate.js`

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **귀속 축**: `INFRA (기반 인프라 및 아키텍처 거버넌스)`
- **[가목] 본질 (Essence)**:
  - 아워골 아키텍처의 본질은 **"소프트웨어 선박의 완벽한 수밀 격벽(Watertight Compartment)"**임. 선박이 암초에 부딪혀도 한 구획만 격리되면 배 전체가 침몰하지 않듯, 6대 탭 중 한 곳에 결함이 발생해도 다른 탭과 전체 앱이 100% 무사하도록 물리적으로 격리하는 것임.
  - 3대 철학 점검:
    1. *무공해성 (Anti-Pollution)*: 38,000줄 코드 늪으로 인한 개발 피로를 원천 제거하고 지속 가능한 성장 쉼터 제공.
    2. *RPG식 체감 (Immediate Self-Efficacy)*: 개발자와 AI에게도 각 기능이 명확한 28대 소블록 부품으로 보여 즉각적인 개발 효능감 제공.
    3. *동류 연대 (Peer Accompaniment)*: 향후 모든 AI 세션과 개발자가 헌법을 단일한 지침으로 삼아 조화롭게 협업.
- **[나목] 원인 (Root Causes 3가지)**:
  1. *원인 1*: 헌법 제4조 1항 7호의 프로덕션 범위 축소 표기 (`js/core/`, `js/tabs/` 미포함).
  2. *원인 2*: 헌법 제15조 6항 3호의 4대 뷰 직접 함수 체이닝 강제로 인한 탭 간 물리적 종속.
  3. *원인 3*: `smoke-test.js`에 하드코딩된 `lines >= 20000` (TECH-RULE-01) 하한선 족쇄 미폐기.
- **[다목] 중심 (Core Bottleneck)**:
  - 신설 조항과 기존 조항 간의 **법적 무모순성(Legal Consistency)**. 헌법 내 15대 조문 단일 위계를 보존하면서, 제3조 제9항으로 블록 규범을 융화시키는 통합 배선.
- **[라목] 핵심 (Critical Anchor)**:
  - **"유저 데이터 100% 무손실 보존(Zero Data Loss) 및 320종 기능 무결성"**. 헌법을 개정하고 향후 블록으로 분리하더라도 사용자의 세션(`ourgoal_profile`), 목표(`goals`), 기록(`checkins`)은 1바이트도 유실되지 않아야 함.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말 것 (Negative Rules)**:
  - 기존 헌법의 15대 조문 단일 위계를 깨고 조 번호를 임의 난립시키는 행위 금지 (제3조 제9항으로 융화).
  - 헌법 개정과 제품 코드(JS/CSS)를 단일 PR에 혼합하는 위헌 행위 금지 (금고 단독 PR 원칙 준수).
- **할 것 (Positive Actions)**:
  - [삭제]: 과거 2만 줄 하한선 족쇄(`TECH-RULE-01`) 영구 폐기, `ui.css` 단일 파일 집중 문구 삭제.
  - [수정]: 프로덕션 코드베이스에 `js/core/`, `js/tabs/`, `css/tabs/` 편입, 4대 뷰 Event Bus 전환, 게이트키퍼 스캔 범위 확장.
  - [신설]: 제3조 제9항 [조선소 블록형 모듈화 및 진화형 아키텍처 규범] (1호 3계층 도크-메가-소블록, 2호 진화형 레지스트리, 3호 800줄 상한 자가분열 및 Anti-Pasting, 4호 Core 통신).
  - [스토리지 원장화 3대 명세]:
    1. 원격 DB 스키마: 변경 없음 (Supabase `users`, `goals`, `checkins` 원장 100% 불변).
    2. 스마트 스토리지 분기: 메가블록 내 미디어 로직은 기존 3계층(DB/IndexedDB/localStorage) 유지.
    3. 4대 뷰 전파 배선도: `core-state.js`의 `OurgoalState.emit('record:changed')` ➔ `renderHome`, `renderGoalsScreen`, `renderCalendarScreen`, `renderRecordsScreen` 수신 렌더링.
  - [Zero-Dead-Click 명세]: `#bottomNavFab`, `.navbtn`, `#modalOverlay`, `btn-save` 등 전수 인터랙티브 요소 브릿지 유지.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **비판적 맹점 검토**:
  - *맹점 1*: `scripts/verify-integrity-gate.js` line 401이 `!rulesContent.includes('제16조 (')`를 단언함.
  - *보완책*: 독립 조항 제16조 대신 **제3조 제9항**으로 정합 편입하여, 15대 조문 위계를 온전히 지키고 베이스 테스트 통과 보장.
  - *맹점 2*: PWA 서비스워커(`sw.js`) 캐시 갱신 누락 시 오프라인 모듈 로딩 단절 가능성.
  - *보완책*: 제14조 제3항의 캐시 갱신 대상에 `js/core/**`, `js/tabs/**`, `css/tabs/**`를 전수 명시.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
- **실행 주체**: Antigravity 에이전트
- **소요 시간**: 약 20분
- **순차적 구현 시퀀스**:
  1. `docs/rules/archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.10.02_STAGE_TRANSITION.md` 비파괴 아카이브 백업 생성.
  2. `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 본문 개정 (제3조 제9항 신설 및 기존 5대 조항 수정).
  3. `docs/rules/CONSTITUTION_VERSIONS.md` 버전 대장 갱신 (`v2026.10.02-SUPREME-15-ARTICLES-SHIPYARD-MODULAR-ARCHITECTURE`).
  4. 전역 정본 `C:/Users/HP/AGENTS.md` 및 `CLAUDE.md`, `GEMINI.md` 동시 정합 갱신.
  5. `scripts/verify-integrity-gate.js` 헌법 무결성 린터 실행 및 전수 통과 확인.
  6. Tri-Sync 상태 검증 (`node C:/dev/command-center/lib/tri-sync.js check`).

---

## 6. [원칙 ⑥] 절차 재검증: 강력한 반론 2가지 및 격파 (Anti-SPOF)
- **반론 1 (단일 파일 유지론)**:  
  *"하나의 파일에 모든 코드가 있으면 Ctrl+F 검색이 편한데, 28개 파일로 쪼개면 파일 찾기가 번거롭지 않은가?"*
  - **반박 및 수용**: 38,000줄 파일은 에디터와 AI의 토큰 컨텍스트를 과도하게 잠식하고 랙을 유발함. 조선소 블록화 시 `js/tabs/goals/sub-personal.js`처럼 파일명과 디렉터리가 목적을 정확히 드러내므로, 검색할 필요도 없이 해당 파일로 0.1초 만에 직행 가능함.
- **반론 2 (라인 수 족쇄 폐기 불안론)**:  
  *"2만 줄 하한선을 없애면 AI가 기존 기능이나 코드를 슬그머니 지워도 모르게 되지 않는가?"*
  - **반박 및 수용**: 2만 줄 족쇄는 더미 주석만 채워도 통과되는 무의미한 껍데기 검사였음. 헌법 제3조 제7항의 `COMPONENT_INVENTORY.json`과 `verify-all-clicks.js`가 실제 DOM 320종 부품과 클릭 핸들러의 살아있음을 물리적으로 감시하므로 기능 보호는 훨씬 정밀하고 단단해짐.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
1. **측정 1**: `node scripts/verify-integrity-gate.js` 실행 시 5대 핵심 게이트 100% PASS (0 Failure).
2. **측정 2**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 내 제1조부터 제15조까지 조 번호 누락 및 불법 조문 0건 확인.
3. **측정 3**: `node C:/dev/command-center/lib/tri-sync.js check` 실행 시 ok: true, rate: 100% 무결성 확인.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: `verify-integrity-gate.js`의 헌법 린터가 15대 조문 위계 검사에서 특정 정규식 불일치를 띄울 경우.
- **재검증 트리거**: 원칙 ⑤의 2단계로 되돌아가, 조문 헤더 표기(`### 제9항`, `## 제3조`)의 공백 및 괄호 형식을 정밀 대조하여 단 1글자의 오차도 없이 일치시킨 뒤 재검증.
