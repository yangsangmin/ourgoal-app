# [INFRA] #TASK-ES-127 feat: 글로벌 셸 하단 FAB 시인성 복원 및 84px 안전 여백 보정

## 1. 개요 및 목적
- **티켓**: #TASK-ES-127 | [127] [글로벌/셸] 하단 탭바 중앙 FAB(+ 빠른 체크인) 시인성 복원 및 뷰포트 하단 84px 안전 여백 일괄 보정
- **근거**: 상민님 직접 지시 (2026-10-02 "진행")
- **목적**: 모듈화 이후 전 탭 실측에서 발견된 셸 레벨 결함(4대 테마 내 FAB 버튼 은폐, 저대비 투명 버그, 24px 하단 여백으로 인한 75px 탭바 요소 가림)을 근본적으로 해결.

## 2. 주요 변경 사항
1. **글로벌 FAB 시인성 및 입체 스타일링 (`ui.css`)**:
   - `.navbtn-fab`: 브랜드 에메랄드 그라디언트(`linear-gradient(135deg, #10B981 0%, #059669 100%)`), 백색 아이콘, 입체 글로우 섀도우, 상단 16px 돌출 플로팅 안착.
   - 375px 모바일 뷰포트 맞춤 44px 스케일링.
2. **4대 테마 전역 노출 (`ui.css`)**:
   - 성소/블랙/화이트/도심 4대 테마에서 `display: none !important` 완전 제거 및 테마별 최적화 액센트 적용.
3. **전 탭 하단 안전 여백 96px+ 보정 (`ui.css`)**:
   - `.screen, #screen-home, #screen-goals, #screen-calendar, #screen-records, #screen-comm, #screen-settings`: `padding-bottom: max(96px, calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 24px) + 32px)) !important` 일괄 적용.
   - 탭바가 최하단 요소를 가리는 문제 원천 차단.
4. **원클릭 빠른 체크인 인터랙션 (`index.html`)**:
   - `#bottomNavFab` 클릭 시 타 탭에서도 홈 화면 전환 후 `#captureInput`에 즉각 스크롤 & 포커스.

## 3. 측정 및 검증 결과 (선언이 아닌 측정)
- `npm test`: 스모크 440개 전수 통과, 헌법 게이트 38개 전수 통과, Zero Dead-Click 941개 전수 통과, 조선소 모듈 5/5 전수 통과.
- Headless Chrome CDP 실측:
  - FAB 크기: 48px × 48px, 가시성: `visible: true`
  - 4대 테마 가시성: 4/4 테마 전부 `visible: true`
  - 6대 전 탭 하단 패딩: `home: 96px`, `goals: 96px`, `calendar: 96px`, `records: 96px`, `comm: 96px`, `settings: 96px` (요구치 84px 초과 달성)
  - FAB 클릭 인터랙션: 타 탭에서 클릭 시 즉시 `screen-home` 전환 및 `captureInput` 포커스 완료.
