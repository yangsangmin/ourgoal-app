# 엔지니어링 작업계획서 (PLAN) — [설정탭] 6대 대형 아코디언 비대화 압축 및 계정/보안/테마 3대 핵심 카드 중심 미니멀 IA 개편 & 불필요 개발자 필드 은폐

> **문서 ID**: PLAN-TASK-ES-133-SETTINGS-IA  
> **요구사항 연계**: [REQ-TASK-ES-133-SETTINGS-IA](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-133-SETTINGS-IA.md)  
> **티켓 연계**: #TASK-ES-133 ([133])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  1. 상단 3대 조망 카드(프로필 요약 `#settingsHeroCard`, 성소 4대 테마 `#sanctuarySettingsSlot`, 계정 보안 1초 조망 `#settingsSecurityCard`)를 메인 대시보드로 정돈하고, 중복 레거시 테마 스와치 및 상단 중복 타이틀 은폐.
  2. 하위 세부 설정 아코디언 컴팩트화(기본 접힘, 토스식 둥근 카드 조형, 터치 타깃 44px 이상).
  3. 개발자 전용 모듈화 허브(`#og-task-23-container`) 완전 은폐 및 외부 연동 API 필드를 `advancedSettingsAccordion` 내부로 안전 격리.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 설정 탭 조망 카드 위계, 중복 위젯 은폐, 아코디언 조형 정규화 스타일 배선.
  - `index.html`: 레거시 테마 스와치 카드에 식별자(`#legacyThemeSwatchCard`) 보강.
  - `docs/rules/TICKETS.md`: 티켓 상태 관리.
  - `dev_log.md`: 작업 로그 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 미니멀 정보 아키텍처(IA) 구축 및 3대 조망 카드 중심의 단정한 통제 센터 완성.
- **[원인] (Technical Causes)**: 중복 타이틀/테마 렌더러와 불필요한 개발자 전용 컨테이너의 화면 노출로 인한 스크롤 과밀.
- **[중심 배선] (Core Wire & State)**:
  - `#screen-settings .s-eyebrow, #screen-settings .s-title`: `display: none !important;`
  - `#legacyThemeSwatchCard, #og-task-23-container`: `display: none !important;`
  - `#settingsHeroCard, #sanctuarySettingsSlot, #settingsSecurityCard`: 상단 3대 조망 카드 위계 강화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 스모크 테스트와 규범 게이트가 요구하는 모든 DOM ID 및 요소는 100% 무손실 보존.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 레거시 테마 스와치 카드에 `#legacyThemeSwatchCard` ID 추가 | +2줄 | -1줄 | +1줄 | 마크업 |
| `ui.css` | 중복 위젯 은폐 및 3대 조망 카드·아코디언 토스 조형 스타일 | +30줄 | 0줄 | +30줄 | 스타일링 |
| `dev_log.md` | 작업 단계 및 실측 기록 | +30줄 | 0줄 | +30줄 | 문서 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 스모크 테스트 및 법정 테스트의 assertion 조건을 100% 만족하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html`)**:
   - `<!-- [#UIUX-56] [THEME-SWATCHES] -->` 하위 카드에 `id="legacyThemeSwatchCard"` 부여.
2. **Step 2 (`ui.css`)**:
   - `#screen-settings .s-eyebrow, #screen-settings .s-title` 중복 타이틀 은폐.
   - `#legacyThemeSwatchCard, #og-task-23-container`에 `display: none !important;` 선언.
   - `.settings-group-accordion.toss-settings-group` 아코디언 카드 조형 정돈.
3. **Step 3 (단위/통합 테스트)**:
   - `npm test`로 440개 smoke test 및 38개 gates 전수 통과 확인.
4. **Step 4 (CDP 실측 및 스크린샷)**:
   - `scratch/verify_es133_cdp.js`를 작성 및 실행하여 모바일 390px 뷰포트에서 상단 3대 조망 카드, 중복 위젯 은폐, 아코디언 조형 실측 및 스크린샷 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 프로필 편집, 아바타 도감, 4대 테마 전환, 보안 점검 버튼 클릭 시 콘솔 에러 0건.
- **시나리오 B (Zero Data Loss)**: 유저 세팅 및 프로필 데이터 100% 무손실 보존.
- **시나리오 C (Zero UX Regression)**: 상단 3대 조망 카드 선명 표출, 중복 타이틀/테마 소거, 컴포넌트 모듈화 허브 은폐.
- **시나리오 D (Full State Propagation)**: 테마 전환 시 4대 뷰 전역 동시 갱신 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] `index.html` 및 `ui.css` 외과수술적 수정 적용
- [ ] `npm test` 통과 (0개 실패)
- [ ] Headless Chrome CDP 실측 스크립트 작성 및 스크린샷 캡처
- [ ] 법정 claims.json 및 시나리오 작성

---

## 8. [원칙 ⑧] 롤백 계획 및 지속적 피드백 수렴
- **롤백 계획**: 문제 발생 시 `git checkout index.html ui.css`로 즉각 원상 복구 가능.
- **피드백 수렴**: 설정 탭 첫인상 및 조작 편의성 모니터링 후 추가 개선 반영.
