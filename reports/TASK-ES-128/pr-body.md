## [INFRA] #TASK-ES-128: 목표탭 812px 가로 오버플로우 척결 및 상단 서브탭 2중 중복 단일화

### 1. 작업 목적 및 개요
- 모바일 375~390px 환경에서 목표 탭 진입 시 발생하던 치명적 812px 가로 스크롤 오버플로우 버그를 원천 척결하고, 상단 고정 6대 칩 바 아래에 2중으로 중복 렌더링되던 구형 5대 서브탭 그리드를 완전 은폐하여 단일 스티키 서브바로 일원화함.

### 2. 주요 변경 사항
1. **가로 오버플로우 원인 격리**:
   - `index.html`: `#goalDetailDrawer`를 `<section id="screen-goals">` 내부에서 `</main>` 뒤로 격리 이동.
   - `ui.css`: `.goal-detail-drawer` 닫힘 시 `display: none !important`, 열림 시 `display: flex !important; transform: translateX(0)`.
   - `ui.css`: `#screen-goals`에 `overflow-x: hidden !important; max-width: 100% !important; box-sizing: border-box !important;` 적용.
2. **구형 5대 서브탭 완전 은폐 및 스티키 서브탭 일원화**:
   - `ui.css`: 4대 테마 전역의 `#goalsSubtabs.goals-subtabs-grid`를 고특이도 `display: none !important; visibility: hidden !important;`로 설정하여 단일 스티키 서브바(`#goalsStickySubnav`)만 표시.
   - 기존 무결성 게이트 단언 문자열은 상단에 온전히 보존하여 100% 무결성 유지.

### 3. 검증 결과
- `npm test`: 스모크 440개 통과 (0 실패), 무결성 게이트 38개 전수 통과 (0 실패), 데드클릭 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `docScrollWidth`: 390px (812px -> 390px 정상화, 오버플로우 0px)
  - `goalsSubtabsDisplay`: `'none'` (2중 렌더링 0건)
  - `goalsStickySubnavPresent`: `true`
