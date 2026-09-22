# 엔지니어링 작업계획서 (PLAN) — 목표탭 대표 안내멘트 시인성 개선 및 공간 효율적 간결 문구 재배치

> **문서 ID**: PLAN-TASK-ES-238-GOALS-HEADLINE-VISIBILITY  
> **요구사항 연계**: [REQ-TASK-ES-238-GOALS-HEADLINE-VISIBILITY](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-238-GOALS-HEADLINE-VISIBILITY.md)  
> **티켓 연계**: #TASK-ES-238  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  목표탭 대표 안내멘트(#goalsHeadlineSentence)의 세로 마진 및 타이포그래피를 고밀도 압축하여 세로 점유율을 40% 줄이고 시인성을 높여 마일스톤 카드의 첫 뷰포트 도달성을 극대화한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-238 티켓 등록
  - docs/specs/REQ-TASK-ES-238-GOALS-HEADLINE-VISIBILITY.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-238-GOALS-HEADLINE-VISIBILITY.md: 본 작업계획서
  - reports/TASK-ES-238/claims.json: 법정 검증 청구서
  - ui.css: #goalsHeadlineSentence 압축 스타일 및 반응형 미디어 쿼리 선언
  - index.html: 상단 서브탭과 헤드라인 간 여백 미세 조율
  - scripts/smoke-test.js: #TASK-ES-238 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 뷰포트 세로 공간의 불필요한 공백을 제거하고 타이포그래피 계층을 최적화하여, 첫 화면에서 가장 가치 있는 마일스톤 액션 카드로 사용자의 시선을 집중시키는 **"목표탭 헤드라인 공간 압축 및 고대비 렌더링 엔진(E1/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 공통 `.toss-headline` 스타일(10px 0 14px 0, 1.25rem)이 목표 탭 상단의 5개 서브탭 바로 아래에 위치하면서 수직 여백이 과도하게 누적되어 있었음.
- **[중심 배선] (Core Wire & State)**:
  - `#goalsHeadlineSentence`: `margin: 4px 0 10px 0 !important;`, `padding: 0 !important;`, `line-height: 1.35 !important;`, `font-size: 1.05rem !important;`, `font-weight: 700 !important;`, `color: var(--ink) !important;`
  - 480px 이하 미디어 쿼리: `margin: 4px 0 8px 0 !important;`, `font-size: 1rem !important;`, `line-height: 1.32 !important;`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 `#goalsHeadlineSentence` 고유 ID 및 `renderGoalsScreen` 동적 텍스트 바인딩 100% 불변 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | #goalsHeadlineSentence 압축 및 반응형 스타일 | +20줄 | 0줄 | +20줄 | 스타일 |
| index.html | 서브탭 마진 조율 | +1줄 | -1줄 | 0줄 | 마크업 |
| scripts/smoke-test.js | #TASK-ES-238 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-238-GOALS-HEADLINE-VISIBILITY.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-238-GOALS-HEADLINE-VISIBILITY.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-238/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 `#goalsHeadlineSentence` 존재 확인 단언문 100% 충족.
- **4대 테마 시인성**:
  - `color: var(--ink)`로 다크/화이트 모드 대비율 4.5:1 이상 물리적 보장.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 #goalsHeadlineSentence 스타일 선언.
2. index.html 내 #goalsSubtabs 여백 조율.
3. scripts/smoke-test.js에 #TASK-ES-238 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 순수 CSS 스타일 최적화로 애플리케이션 상태나 파이프라인 손상 위험 0%.
- **가정의 타당성 검증**:
  - 세로 여백 압축을 통해 스크롤 없이 첫 화면에 노출되는 마일스톤 카드 면적 증대.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 338개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-238
- 노션 DB 108번 항목 완료 기준 완벽 충족.
