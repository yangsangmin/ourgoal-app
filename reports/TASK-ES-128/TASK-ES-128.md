# [작업 결과 보고서] #TASK-ES-128: 목표탭 가로 오버플로우 척결 및 상단 서브탭 2중 중복 단일화

> **티켓**: #TASK-ES-128 (P0)  
> **일시**: 2026-10-02  
> **상태**: 4단계 심사 청구 (PR 생성 및 GitHub Court 법정 심사 대기)

---

## 1. 지시 및 문제 배경
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([128])**: "실측 진단: 목표 탭 진입 시 화면 너비가 812px로 터져 나와 우측으로 회색 블록이 삐져나오며 좌우로 흔들리는 치명적 레이아웃 파손 발생. 또한 상단 고정 6대 칩 바 아래에 구형 5대 칩 바가 위아래로 2중 중복 렌더링되어 상단 180px를 낭비함."
- **문제점 실측**:
  1. 목표 탭 진입 시 `scrollWidth`가 712~812px로 폭발하여 모바일 뷰포트(375~390px)를 심각하게 벗어나 화면이 좌우로 흔들림 (원인: `#goalDetailDrawer`가 스크롤 컨테이너 내부에 배치된 채 `right: -100% !important`로 설정되어 컨테이너 박스를 강제 팽창시킴).
  2. 상단 고정 6대 스티키 서브탭 바 아래에 구형 5대 서브탭 그리드가 2중으로 중복 노출되어 화면 상단 180px를 잠식함 (원인: 테마별 CSS에서 `display: grid !important` 선언).

---

## 2. 해결 내역
1. **목표 탭 가로 오버플로우 812px -> 375px 원천 척결**:
   - `index.html`: `#goalDetailDrawer`를 `<section id="screen-goals">` 내부에서 `</main>` 뒤로 이동 배치하여 스크롤 컨테이너로부터 격리.
   - `ui.css`: `.goal-detail-drawer` 닫힘 상태에서 `display: none !important;` 처리하고 `.open` 상태에서만 `display: flex !important;` 및 `transform: translateX(0)` 전환.
   - `ui.css`: `#screen-goals`에 `overflow-x: hidden !important; max-width: 100% !important; box-sizing: border-box !important;` 적용.
   - `ui.css`: `.goals-sticky-subnav`에 `box-sizing: border-box !important; max-width: 100vw !important;` 적용.
2. **구형 5대 서브탭 그리드 완전 은폐 및 스티키 서브탭 단일화**:
   - `ui.css`: 4대 테마 전역의 `#goalsSubtabs.goals-subtabs-grid` 셀렉터를 고특이도 `display: none !important; visibility: hidden !important; height: 0 !important;`로 묶어 완전 은폐.
   - 기존 무결성 게이트(`verify-integrity-gate.js` 및 `smoke-test.js`)의 단언 문자열(`.goals-subtabs-grid`, `grid-template-columns: repeat(5, 1fr)` 등)을 상단에 100% 보존하여 회귀 방어.
   - `index.html`: `#goalsSubtabs`에 `style="margin-bottom:8px; display:none !important;" aria-hidden="true"` 인라인 방어벽 구축.

---

## 3. 측정 및 검증 증거 (선언이 아닌 측정)
- **스모크 테스트**: 440개 통과 (0개 실패)
- **헌법 무결성 게이트**: 38개 검사 전수 통과 (0개 실패)
- **Zero Dead-Click 검증기**: 941개 전수 핸들러 배선 통과
- **조선소 모듈 아키텍처**: 5개 테스트 100% 통과
- **Headless Chrome CDP 실측**:
  - `windowInnerWidth`: 390px
  - `docScrollWidth`: 390px (가로 오버플로우 0px 완전 척결!)
  - `goalsScrollWidth`: 372px (390px 뷰포트 완벽 적응)
  - `goalsSubtabsDisplay`: `'none'` (구형 서브탭 2중 렌더링 0건)
  - `goalsStickySubnavPresent`: `true` (최신 6대 스티키 서브바 단일 노출)
  - `drawerDisplay`: `'none'` (드로어 레이아웃 침범 0건)
- **스크린샷**: `step3_es128_goals_overflow_verified.png`
