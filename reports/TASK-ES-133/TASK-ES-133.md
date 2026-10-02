# [TASK-ES-133] [설정탭] 6대 대형 아코디언 비대화 압축 및 계정/보안/테마 3대 핵심 카드 중심 미니멀 IA 개편 & 불필요 개발자 필드 은폐

- **티켓**: #TASK-ES-133 ([133])
- **브랜치**: `feat/2026-10-02-task-es-133-settings-ia`
- **작성일시**: 2026-10-02

## 1. 개요 및 요구사항
1. 상단 3대 조망 카드(프로필 요약, 화면스타일 4대 테마, 계정 보안 1초 조망)를 메인 대시보드로 정돈.
2. 중복 레거시 테마 스와치 및 개발자 전용 허브(#og-task-23-container) 은폐.
3. 하위 세부 설정 아코디언을 토스식 둥근 카드로 정규화하고 기본 접힘 상태 유지.

## 2. 구현 내역
- `index.html`:
  - 레거시 테마 스와치 카드에 `#legacyThemeSwatchCard` 식별자 부여.
- `ui.css`:
  - `#screen-settings .s-eyebrow, #screen-settings .s-title`: `display: none !important;`
  - `#legacyThemeSwatchCard`: `display: none !important;`
  - `#og-task-23-container`: `display: none !important;`
  - `.settings-group-accordion.toss-settings-group`: 18px 둥근 모서리 및 48px summary 터치 타깃 스타일링.

## 3. 검증 결과
- `npm test`: 440개 smoke test 통과, 38개 integrity gates 통과, 941개 Zero Dead-Click 통과.
- Headless Chrome CDP 390px 실측:
  - `docScrollWidth`: 390px
  - `heroCardVisible`: true
  - `sanctuarySlotVisible`: true
  - `securityCardVisible`: true
  - `legacySwatchDisplay`: 'none'
  - `ogTask23Display`: 'none'
  - `advAccordionOpen`: false
  - `allGroupAccordionsClosed`: true
- 실측 스크린샷: `step3_es133_settings_ia_verified.png`
