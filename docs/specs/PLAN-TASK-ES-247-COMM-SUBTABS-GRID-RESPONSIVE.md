# 엔지니어링 작업계획서 (PLAN) — 소통탭 상단 6대 서브탭 버튼 가로너비 균등 비율 및 글자 크기·패딩 반응형 최적화

> **문서 ID**: PLAN-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE  
> **요구사항 연계**: [REQ-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE.md)  
> **티켓 연계**: #TASK-ES-247  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  소통탭 상단 6대 서브탭 버튼의 가로너비를 3열 균등 분배(repeat(3, 1fr))로 정밀 교정하고 글자 크기, 패딩 및 반응형 미디어 쿼리를 튜닝하여 모바일 화면에서 완벽한 균형미와 터치 편의성을 보장한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-247 티켓 등록
  - docs/specs/REQ-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE.md: 본 작업계획서
  - reports/TASK-ES-247/claims.json: 법정 검증 청구서
  - ui.css: .comm-subtabs-clean.comm-subtabs-grid 및 반응형 스타일 선언
  - scripts/smoke-test.js: #TASK-ES-247 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 3열 2행의 6대 서브탭 버튼을 가로너비 33.33% 균등 비율로 엄밀히 동기화하고 반응형 폰트와 패딩을 적용하여 360px~430px 전 모바일 뷰포트에서 터치 쾌적성을 극대화하는 **"소통탭 6대 서브탭 정밀 그리드 렌더링 엔진(UI/UX & E3 Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 뷰포트 너비 변화에 따른 버튼 내부 여백과 폰트 크기 미세 단계 조정이 부족했음.
- **[중심 배선] (Core Wire & State)**:
  - `.comm-subtabs-clean.comm-subtabs-grid`: `grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px;`
  - `.comm-subtab`: `min-height: 38px;`, `padding: 0 6px;`, `font-size: 0.8125rem;`, `white-space: nowrap;`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 6대 서브탭 클릭 이벤트 위임 및 `comm-subtabs-grid` 헌법 게이트 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | 3열 그리드 및 반응형 폰트/패딩 선언 | +40줄 | 0줄 | +40줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-247 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-247-COMM-SUBTABS-GRID-RESPONSIVE.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-247/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js` 내 소통 탭 서브탭 게이트 및 sticky 검증 100% 통과 유지.
- **4대 테마 시인성**:
  - 다크, 블랙, 화이트, 도심 테마에서 활성 버튼의 보더 및 배경 고대비 유지.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 .comm-subtabs-clean.comm-subtabs-grid 및 버튼 스타일 선언.
2. 480px, 375px 모바일 반응형 규칙 추가.
3. scripts/smoke-test.js에 #TASK-ES-247 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 순수 CSS 레이아웃 규칙 강화로 런타임 스크립트 충돌 제로.
- **가정의 타당성 검증**:
  - repeat(3, 1fr) 균등 배분으로 화면 크기에 관계없이 6개 버튼이 3열 2행으로 단정하게 유지됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- repeat(3, 1fr) 및 13px/12px 반응형 폰트 확립.
- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-247
- 노션 DB 117번 항목 완료 기준 완벽 충족.
