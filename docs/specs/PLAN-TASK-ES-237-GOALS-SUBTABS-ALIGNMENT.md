# 엔지니어링 작업계획서 (PLAN) — 목표탭 상단 5개 서브탭 버튼 중앙 정렬 및 시인성·터치 가독성 전면 개선

> **문서 ID**: PLAN-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT  
> **요구사항 연계**: [REQ-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT.md)  
> **티켓 연계**: #TASK-ES-237  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  목표 탭 상단 5개 서브탭(#goalsSubtabs)에 중앙 정렬을 완비하고, 활성 탭 입체 그림자와 12ms 미세 햅틱을 배선하여 모바일 375px 대칭 안정감과 시인성을 극대화한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-237 티켓 등록
  - docs/specs/REQ-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT.md: 본 작업계획서
  - reports/TASK-ES-237/claims.json: 법정 검증 청구서
  - ui.css: #goalsSubtabs.goals-subtabs-grid 중앙 정렬 및 활성 탭 그림자 선언
  - index.html: 서브탭 클릭 시 12ms 햅틱 배선
  - scripts/smoke-test.js: #TASK-ES-237 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 CSS Grid Level 1 박스 정렬 사양과 하드웨어 햅틱 피드백을 유기적으로 결합하여, 모바일 375px 해상도에서 내비게이션의 조형적 대칭미와 조작 피드백을 완성하는 **"목표 서브탭 고대비 중앙 정렬 엔진(E1/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 컨테이너에 `justify-content: center` 및 `align-items: center`가 명시되지 않아 일부 모바일 뷰포트에서 비대칭 여백이 발생할 소지가 있었음.
- **[중심 배선] (Core Wire & State)**:
  - `#goalsSubtabs.goals-subtabs-grid`: 5열 그리드 중앙 정렬 (`justify-content: center`, `align-items: center`)
  - `.goals-subtabs-grid .comm-subtab.active`: `box-shadow: 0 2px 6px rgba(0,0,0,0.12)` 입체 하이라이트
  - `renderGoalsScreen`: 탭 클릭 시 12ms 미세 햅틱 배선
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 5열 그리드(`repeat(5, 1fr)`) 및 `sticky` 고정 헌법 게이트 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | 중앙 정렬 및 활성 탭 그림자 스타일 보강 | +15줄 | -2줄 | +13줄 | 스타일 |
| index.html | 서브탭 클릭 핸들러 12ms 햅틱 결속 | +2줄 | -1줄 | +1줄 | 핵심 로직 |
| scripts/smoke-test.js | #TASK-ES-237 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-237/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **Dead-Click 린터 방어**:
  - 서브탭 5종 전체에 `data-gsub` 이벤트 리스너가 누락 없이 결속됨.
- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 `.goals-subtabs-grid` 및 `position: sticky !important;` 검증에 부합하도록 기존 셀렉터 원형 보존.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 #goalsSubtabs.goals-subtabs-grid에 justify-content: center, align-items: center 및 그림자 스타일 선언.
2. index.html의 renderGoalsScreen 내 탭 클릭 시 12ms 햅틱 배선.
3. scripts/smoke-test.js에 #TASK-ES-237 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 그리드 중앙 정렬은 네이티브 렌더링에 직접 작용하므로 스크립트 장애 위험 0%.
- **가정의 타당성 검증**:
  - 중앙 정렬을 통해 375px 모바일 화면 좌우 여백의 오차를 0px로 일치시킴.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 337개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-237
- 노션 DB 107번 항목 완료 기준 완벽 충족.
