# 엔지니어링 작업계획서 (PLAN) — 일정탭 '주간' 뷰 전환 버튼 클릭 시 비정상 배경색·대비 오류 수정 및 활성 상태 시인성 개선

> **문서 ID**: PLAN-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST  
> **요구사항 연계**: [REQ-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST.md)  
> **티켓 연계**: #TASK-ES-241  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  일정탭 상단 [📆 주간] 버튼의 테마별 활성 배경색/대비를 정밀 교정하고, 주간 캘린더 카드(`.s-week-cal-card`) 및 하위 항목(`.s-week-day-row`, `.s-cal-item`)의 크로스 테마 4.5:1 이상 고대비 렌더링을 확립한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-241 티켓 등록
  - docs/specs/REQ-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST.md: 본 작업계획서
  - reports/TASK-ES-241/claims.json: 법정 검증 청구서
  - ui.css: .s-cal-mode-btn.active 테마별 스타일 및 .s-week-cal-card 화이트 테마 선언
  - js/sanctuary-v3-engine.js: 주간 뷰 인라인 하드코딩 rgba 스타일을 테마 변수로 전환
  - scripts/smoke-test.js: #TASK-ES-241 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 CSS 토큰 레이어와 렌더러 템플릿의 하드코딩 색조를 분리하고 시맨틱 CSS 변수로 바인딩하여, 4대 테마 전반에서 주간 내비게이션 및 일정 카드의 대비율을 물리적으로 보장하는 **"크로스 테마 주간 캘린더 렌더링 무결성 엔진(E1/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - `html[data-theme="white"]`에서 `.s-week-cal-card` 오버라이드가 누락되어 다크 그라데이션이 노출되었고, `.s-cal-mode-btn.active`에 저대비 틴트가 적용되었음.
- **[중심 배선] (Core Wire & State)**:
  - `html[data-theme="white"] .s-cal-mode-btn.active`: `background: #059669 !important; color: #FFFFFF !important; border-color: #059669 !important; font-weight: 700;`
  - `html[data-theme="white"] .s-week-cal-card`: `background: #FFFFFF !important; border: 1px solid #CBD5E1 !important;`
  - `.s-week-day-row.selected`: `border-left: 3px solid var(--brand) !important;`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `verify-integrity-gate.js` 내 `.s-cal-mode-btn` 및 `s-week-grid` 단언문 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | 주간 버튼 및 주간 카드 테마별 고대비 스타일 보강 | +35줄 | -4줄 | +31줄 | 스타일 |
| js/sanctuary-v3-engine.js | 주간 뷰 인라인 하드코딩 색상 테마 변수화 | +4줄 | -4줄 | 0줄 | 렌더러 |
| scripts/smoke-test.js | #TASK-ES-241 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-241/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 비활성 버튼 어포던스 검증(`background: rgba(255, 255, 255, 0.05);`) 보존.
- **4대 테마 시인성**:
  - 화이트, 블랙, 성소, 도심 테마에서 '주간' 탭 및 7개 요일 행의 시인성 4.5:1 준수.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 html[data-theme="white"] .s-cal-mode-btn.active 및 .s-week-cal-card 선언.
2. js/sanctuary-v3-engine.js 내 주간 템플릿 인라인 색상 교정.
3. scripts/smoke-test.js에 #TASK-ES-241 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 클래스 규칙 교정이므로 자바스크립트 런타임 오동작 위험 0%.
- **가정의 타당성 검증**:
  - 화이트 테마 누락 셀렉터 추가 및 솔리드 에메랄드 활성 버튼으로 시각적 버그 완벽 소탕.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 338개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-241
- 노션 DB 111번 항목 완료 기준 완벽 충족.
