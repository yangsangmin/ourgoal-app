# [엔지니어링 작업계획서] #TASK-ES-127: 하단 탭바 중앙 FAB(+ 빠른 체크인) 시인성 복원 및 뷰포트 하단 84px 안전 여백 일괄 보정

## 1. 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**:
  - 하단 탭바 중앙 FAB(`#bottomNavFab`, `.navbtn-fab`)의 테마별 숨김 해제 및 브랜드 에메랄드/액센트 그라디언트 시인성 복원.
  - 전 탭(`#screen-home`, `#screen-goals`, `#screen-calendar`, `#screen-records`, `#screen-comm`, `#screen-settings`) 하단 여백을 `max(96px, calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 24px) + 32px)) !important`로 일괄 확장하여 75px 플로팅 탭바에 최하단 요소가 가려지지 않도록 보장.
  - FAB 클릭 시 홈 탭 전환 후 `#captureInput` 포커스 배선.
- **영향받는 파일 전수 목록**:
  1. `docs/rules/TICKETS.md`: #TASK-ES-127 티켓 등록
  2. `docs/specs/REQ-TASK-ES-127-FAB-CLEARANCE.md`: 요구사항 정의서
  3. `docs/specs/PLAN-TASK-ES-127-FAB-CLEARANCE.md`: 엔지니어링 작업계획서 (본 문서)
  4. `ui.css`:
     - 글로벌 `.navbtn-fab` 에메랄드 그라디언트 및 섀도우 복원, 375px 반응형 적용
     - 4대 테마 오버라이드 내 `display: none` 해제 및 테마별 액센트 스타일링
     - 전 탭 하단 안전 여백 96px+ 보정
  5. `index.html`:
     - `#bottomNavFab` onclick 핸들러의 탭 전환 및 포커스 배선 개선
  6. `reports/TASK-ES-127/claims.json`: 법정 심사용 주장 파일
  7. `reports/TASK-ES-127/TASK-ES-127.md`: 최종 심사 청구서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **INFRA / UX** — 글로벌 셸 및 뷰포트 조형 정상화.
- **[원인] (Technical Causes)**:
  - 4대 테마 셀렉터에서 `#bottomNavFab`이 `display: none !important`로 가려짐.
  - 기본 FAB 배경이 반투명 흰색으로 죽어 있어 시인성 결여.
  - 각 스크린 하단 패딩이 24px로 덮여 75px 탭바가 스크린 맨 아래를 가림.
- **[중심] (Core Wire & State)**:
  - `.navbtn-fab`: `width: 48px`, `height: 48px`, `display: flex !important`, `background: linear-gradient(135deg, #10B981, #059669)`, `z-index: 100`.
  - `.screen, #screen-*`: `padding-bottom: max(96px, calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 24px) + 32px)) !important`.
  - `#bottomNavFab` click: `if(typeof setTab==='function') setTab('home'); ...`
- **[핵심] (Critical Safety & Persistence)**:
  - 기존 6대 탭 버튼(홈, 목표, 일정, 기록/통계, 소통, 설정) 정렬 및 클릭 무결성 100% 보존.
  - 무결성 검증 게이트(Integrity Gate) 문자열 불변 보존.

---

## 3. 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `ui.css`: 추가 약 30줄, 변경 약 15줄 (총 diff 45줄 이내)
  - `index.html`: 변경 1줄
  - `docs/specs/*`: 2개 파일 신규
  - `reports/TASK-ES-127/*`: 2개 파일 신규
- **테스트 및 검증 계획**:
  1. `npm test` 스모크(440) + 게이트(38) + 데드클릭(941) + 조선소(5) 전수 통과 확인.
  2. Headless Chrome CDP로 FAB 크기(48px), 가시성(visible), 4대 테마 일관성, 전 탭 96px 하단 패딩, 클릭 인터랙션 실측.
  3. 실측 스크린샷 캡처 및 아티팩트 보관.
