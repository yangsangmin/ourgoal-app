# 엔지니어링 작업계획서 (PLAN) — 화이트 테마 렌더링 먹통 버그 근본 척결 및 성소 외 3대 테마(화이트·블랙·도심) 시인성·대비 전면 고도화

> **문서 ID**: PLAN-TASK-ES-185-THEME-VISIBILITY  
> **요구사항 연계**: [REQ-TASK-ES-185-THEME-VISIBILITY](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-185-THEME-VISIBILITY.md)  
> **티켓 연계**: #TASK-ES-185  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity Pair Programmer  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 화이트 테마 선택 시 성소로 강제 치환되던 결함을 제거하고, 화이트·블랙·도심 3대 테마의 CSS 토큰 및 컴포넌트 시인성을 전면 고도화하며, 성소 테마는 1바이트도 수정 없이 100% 보존한다.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `_initTh === 'white'` 및 `th === 'white'` 강제 치환 제거, `applyTheme` 메타 컬러 및 테마 속성 연동 정비
  - `ui.css`: 화이트, 블랙, 도심 3대 테마 전용 토큰 및 텍스트/카드/보더/입력창 고시인성 스타일 주입 (성소 100% 보존)
  - `scripts/smoke-test.js`: 테마 전환 및 화이트/블랙/도심 토큰 단언문 추가
  - `scripts/verify-integrity-gate.js`: 회귀 검증

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 사용자가 선택한 화면 테마가 런타임에 손실이나 왜곡 없이 즉각 반영되어, 어떤 조명 환경에서도 시각적 피로 없이 최상의 가독성과 대비를 누리게 하는 엔지니어링 무결성 확보.
- **[원인] (Technical Causes)**: `index.html` 내 `if(th === 'white') th = 'focus-sanctuary'` 강제 치환 코드와 `ui.css` 내 `[data-theme="white"]` 라이트 모드 전용 토큰 누락.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.theme`: 테마 설정값 영속화
  - `document.documentElement.setAttribute('data-theme', themeId)`: 실시간 CSS 테마 바인딩
  - `localStorage.setItem('ourgoal_current_theme', themeId)`: 초기 렌더링 깜빡임 방지 캐시
- **[핵심 안전장치] (Critical Safety & Persistence)**: 성소(`focus-sanctuary`) 테마 100% 무변경 격리 보존, 테마 변경 즉시 `saveProfile()` 저장 및 fallback 안전망.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[설정창 테마 카드 클릭] -> [applyTheme(tid) 호출] -> [html[data-theme] 속성 갱신] -> [meta theme-color 갱신] -> [localStorage 캐시 및 state.profile 저장] -> [4대 뷰 및 전 컴포넌트 즉각 테마 반영]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 강제 치환 제거 및 메타 컬러 보정 | +10줄 | -10줄 | 0줄 | 외과수술적 diff |
| `ui.css` | 화이트/블랙/도심 토큰 및 시인성 고도화 | +120줄 | -10줄 | +110줄 | CSS 토큰 준수 |
| `scripts/smoke-test.js` | 4대 테마 무결성 단언문 추가 | +25줄 | 0줄 | +25줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `div.theme-card[data-themeid="white|black|urban-city|focus-sanctuary"]`
2. **이벤트 리스너 (Listener)**: 테마 카드 클릭 시 `applyTheme(tid)` 즉시 트리거
3. **비즈니스 로직 (Logic)**: `document.documentElement.setAttribute('data-theme', tid)`, `saveProfile()`
4. **피드백 & 예외처리 (Feedback)**: 카드 테두리 활성화 표시, 성공 시 토스트 및 즉각 색상 전환

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 성소(`focus-sanctuary`) 테마의 모든 CSS 변수와 스타일을 1바이트도 수정하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하나 깜빡임(FOUC) 없이 즉시 전환되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (index.html 치환 로직 수술)**: `_initTh === 'white'` 및 `th === 'white'` 강제 성소 치환 코드 영구 제거.
2. **Step 2 (ui.css 화이트 테마 풀 라이트 토큰 주입)**: `--bg: #F8FAFC`, `--card: #FFFFFF`, `--ink: #0F172A`, `--rule: #E2E8F0` 등 완비.
3. **Step 3 (ui.css 블랙 테마 OLED 순수 블랙 토큰 주입)**: `--bg: #000000`, `--card: #0D0D0E`, `--ink: #FFFFFF` 등 고대비 완비.
4. **Step 4 (ui.css 도심 테마 쿨 슬레이트 토큰 주입)**: `--bg: #0B0F19`, `--card: #141D30`, `--brand: #0EA5E9` 등 메트로폴리탄 시인성 완비.
5. **Step 5 (스모크 테스트 및 무결성 게이트 검증)**: `scripts/smoke-test.js` 보강 및 `npm test` 통과.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 설정창 테마 카드 4종 클릭 시 즉각 `applyTheme` 발동 및 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 테마 변경 시 `state.profile.settings.theme` 정상 영속화 및 10종 페르소나 데이터 무손실 확인
- **시나리오 C (Zero UX Regression)**: 성소 테마 선택 시 기존 디자인 100% 보존 확인
- **시나리오 D (Full State Propagation)**: 테마 전환 즉시 홈, 목표, 일정, 기록, 소통 전 탭에 실시간 색채 전파 확인
- **시나리오 E (자동화 게이트 통과)**: `npm test` 323개 이상 ALL PASS 및 무결성 게이트 22/22 ALL PASS

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] Chrome Headless CDP를 통한 4종 테마 실기기 스크린샷 캡처 및 시각 자가감사 수행

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 인라인 스타일로 `color: #fff`가 하드코딩된 요소가 화이트 테마에서 글자가 안 보이는 현상
- **사전 방어 및 우회 로직**: `ui.css` 내 `[data-theme="white"]` 스코프 하에서 텍스트 색상을 `var(--ink)`로 강제 바인딩하는 CSS 방어 규칙 추가
- **롤백 계획 (Rollback Strategy)**: 변경 파일 원복 (`git checkout main`) 및 이전 커밋 `c75900e`로 즉각 원복
- **재검증 트리거**: 테마 변경 시 배경색이 변하지 않거나 텍스트가 묻히는 경우 원칙 ②의 CSS 토큰 및 선택자 우선순위 재검토
