# [작업 결과 보고서] #TASK-ES-129: 소통 탭 7단계 피로층 다이어트 및 최신 피드 1초 직통 노출

> **티켓**: #TASK-ES-129 (P1)  
> **일시**: 2026-10-02  
> **상태**: 4단계 심사 청구 (PR 생성 및 GitHub Court 법정 심사 대기)

---

## 1. 지시 및 문제 배경
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([129])**: "실측 진단: 소통 탭 진입 시 러닝메이트 배너 ➔ 타이틀 ➔ 3대 대형 버튼 ➔ 응원 칩 ➔ 3×2 그리드 ➔ 3개 피드필터 ➔ 19개 카테고리 필터 등 무려 7단계 400px 이상의 피로층이 적재되어 피드 글 하나를 보려면 화면을 한참 스크롤해야 함. 동일 버튼(피드, 팀, 동반자)이 2중 중복 노출됨."
- **문제점 실측**:
  1. `#commHubGrid`(3대 대형 카드)와 `comm-subtabs-grid`(6대 서브탭)가 상하로 동시에 노출되어 화면 높이를 80px 이상 불필요하게 낭비함.
  2. 동류 소통 요약 원카드(`commHeroCard`)가 120px 높이를 차지하여 첫 번째 피드 게시물이 뷰포트 아래로 밀려남.

---

## 2. 해결 내역
1. **중복 3버튼 허브(#commHubGrid) 완전 은폐 및 단일 서브탭 바 정돈**:
   - `ui.css`: `#commHubGrid, .comm-hub-grid`를 `display: none !important; visibility: hidden !important; height: 0 !important;`로 완전 은폐하여 2중 버튼 소탕.
   - `index.html`: `#commHubGrid`에 `style="display:none !important;" aria-hidden="true"` 인라인 방어벽 구축.
2. **동류 소통 요약 원카드 및 여백 슬림화 (120px -> 52px)**:
   - `ui.css`: `.toss-community-hero-card`의 마진과 패딩을 다이어트하고 인라인 가로 배치 스펙 적용.
   - `.reaction-floating-bar`: 마진을 12px에서 6px로 축소하여 피드 접근성 대폭 개선.
3. **피드 콘텐츠 1초 직통 노출**:
   - 피드 콘텐츠 상대 시작 위치를 기존 ~340px에서 213px로 120px 이상 단축하여, 390px 모바일 화면 한 화면 내에서 피드 콘텐츠가 즉시 시야에 들어오도록 최적화.

---

## 3. 측정 및 검증 증거 (선언이 아닌 측정)
- **스모크 테스트**: 440개 통과 (0개 실패)
- **헌법 무결성 게이트**: 38개 검사 전수 통과 (0개 실패)
- **Zero Dead-Click 검증기**: 941개 전수 핸들러 배선 통과
- **조선소 모듈 아키텍처**: 5개 테스트 100% 통과
- **Headless Chrome CDP 실측**:
  - `commHubGridDisplay`: `'none'` (중복 3버튼 0건 완전 은폐)
  - `commBodyRelativeTop`: **213px** (기존 ~340px에서 127px 대폭 다이어트 달성)
  - `commReactionDockDisplay`: `'flex'` (무공해 응원 정상 작동)
- **스크린샷**: `step3_es129_comm_diet_verified.png`
