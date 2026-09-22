# 엔지니어링 작업계획서 (PLAN) — 소통탭 대표 안내멘트 시인성 개선 및 공간 효율적 간결 문구 재배치

> **문서 ID**: PLAN-TASK-ES-243-COMM-HEADLINE-VISIBILITY  
> **요구사항 연계**: [REQ-TASK-ES-243-COMM-HEADLINE-VISIBILITY](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-243-COMM-HEADLINE-VISIBILITY.md)  
> **티켓 연계**: #TASK-ES-243  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  소통탭 대표 안내멘트(#commHeadlineSentence)의 세로 마진과 타이포그래피를 고밀도 압축하고 요약 원카드와의 간격을 조율하여 375px 모바일 뷰포트 내 핵심 피드의 도달성을 극대화한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-243 티켓 등록
  - docs/specs/REQ-TASK-ES-243-COMM-HEADLINE-VISIBILITY.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-243-COMM-HEADLINE-VISIBILITY.md: 본 작업계획서
  - reports/TASK-ES-243/claims.json: 법정 검증 청구서
  - ui.css: #commHeadlineSentence 압축 및 .toss-community-hero-card 상단 마진 조율
  - index.html: 헤드라인 기본 카피 정돈
  - scripts/smoke-test.js: #TASK-ES-243 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 헤드라인의 세로 점유율을 40% 이상 압축하고 따뜻한 동류 연대형 카피라이팅을 배선하여, 첫 화면 375px 뷰포트에서 동류 소통 요약 원카드와 피드가 즉각 돋보이게 만드는 **"소통탭 헤드라인 공간 압축 및 연대감 렌더링 엔진(E3/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 공통 `.toss-headline`의 상하 마진(10px, 14px)과 `.toss-community-hero-card`의 상단 마진(10px)이 누적되어 첫 뷰포트가 아래로 밀렸음.
- **[중심 배선] (Core Wire & State)**:
  - `#commHeadlineSentence`: `margin: 4px 0 10px 0 !important;`, `font-size: 1.05rem !important;`, `line-height: 1.35 !important;`, `color: var(--ink) !important;`
  - `.toss-community-hero-card`: `margin-top: 6px !important;`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `#commHeadlineSentence`, `#commHeroCard` 등 헌법 필수 ID 및 동류 소통 렌더링 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | #commHeadlineSentence 압축 및 원카드 마진 조율 | +20줄 | 0줄 | +20줄 | 스타일 |
| index.html | 헤드라인 기본 카피 정돈 | +1줄 | -1줄 | 0줄 | 마크업 |
| scripts/smoke-test.js | #TASK-ES-243 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-243-COMM-HEADLINE-VISIBILITY.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-243-COMM-HEADLINE-VISIBILITY.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-243/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 소통 탭 본질 검증 및 뷰 전환 100% 통과 유지.
- **4대 테마 시인성**:
  - `color: var(--ink)`로 모든 테마에서 4.5:1 이상 명암 대비 확보.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 #commHeadlineSentence 및 .toss-community-hero-card 스타일 선언.
2. index.html 내 #commHeadlineSentence 기본 문구 정돈.
3. scripts/smoke-test.js에 #TASK-ES-243 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 순수 CSS 스타일 최적화 및 텍스트 정돈으로 스크립트 장애 위험 0%.
- **가정의 타당성 검증**:
  - 여백 압축을 통해 모바일 375px 해상도에서 동류 소통 요약 원카드가 스크롤 없이 첫 화면에 안착됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-243
- 노션 DB 113번 항목 완료 기준 완벽 충족.
