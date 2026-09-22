# 엔지니어링 작업계획서 (PLAN) — 일정탭 대표 안내멘트 시인성 개선 및 공간 효율적 간결 문구 재배치

> **문서 ID**: PLAN-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY  
> **요구사항 연계**: [REQ-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY.md)  
> **티켓 연계**: #TASK-ES-240  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  일정탭 대표 안내멘트(#calHeadlineSentence)의 세로 마진과 타이포그래피를 고밀도 압축하고 서브 안내 배너(.cal-sub-guide)를 32px 이하 인라인 칩으로 최적화하여 375px 모바일 뷰포트 내 달력 그리드 도달성을 극대화한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-240 티켓 등록
  - docs/specs/REQ-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY.md: 본 작업계획서
  - reports/TASK-ES-240/claims.json: 법정 검증 청구서
  - ui.css: #calHeadlineSentence 압축 및 .cal-sub-guide 32px 스타일 선언
  - index.html: 안내 배너 닫기 버튼 10ms 햅틱 배선
  - scripts/smoke-test.js: #TASK-ES-240 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 상단 헤드라인 및 서브 가이드의 세로 점유율을 50% 이상 압축하여, 모바일 375px 디스플레이에서 유저가 스크롤 없이 달력 전면을 조망하고 일정을 관리할 수 있도록 보장하는 **"일정탭 헤드라인 공간 압축 및 뷰포트 확보 엔진(E1/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - `.toss-headline`의 상하 마진(10px, 14px)과 `.cal-sub-guide`의 여백이 중첩되어 첫 뷰포트에서 달력 하단 셀이 가려졌음.
- **[중심 배선] (Core Wire & State)**:
  - `#calHeadlineSentence`: `margin: 4px 0 8px 0 !important;`, `font-size: 1.05rem !important;`, `line-height: 1.3 !important;`, `color: var(--ink) !important;`
  - `.cal-sub-guide`: `max-height: 32px;`, `padding: 4px 10px;`, `margin: 2px 0 8px 0;`
  - `#btnHideCalDiaryGuide`: 닫기 클릭 시 10ms 햅틱 및 `localStorage` 저장
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `#calHeadlineSentence`, `#btnHideCalDiaryGuide`, `#sanctuaryCalendarView` 등 헌법 필수 ID 불변 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | #calHeadlineSentence 압축 및 .cal-sub-guide 슬림화 | +20줄 | 0줄 | +20줄 | 스타일 |
| index.html | 안내 배너 닫기 버튼 햅틱 배선 | +1줄 | 0줄 | +1줄 | 로직 |
| scripts/smoke-test.js | #TASK-ES-240 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-240/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 캘린더 6대 결함 및 상단 네비게이션 검증 100% 통과 유지.
- **4대 테마 시인성**:
  - `color: var(--ink)`로 모든 테마에서 4.5:1 이상 명암 대비 확보.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 #calHeadlineSentence 및 .cal-sub-guide 슬림화 스타일 선언.
2. index.html 내 #btnHideCalDiaryGuide 클릭 시 10ms 햅틱 배선.
3. scripts/smoke-test.js에 #TASK-ES-240 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 스타일 최적화로 런타임 자바스크립트 크래시 위험 0%.
- **가정의 타당성 검증**:
  - 여백 압축을 통해 모바일 375px 해상도에서 달력 전체가 스크롤 없이 시원하게 첫 뷰포트에 도달.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 338개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-240
- 노션 DB 110번 항목 완료 기준 완벽 충족.
