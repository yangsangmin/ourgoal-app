# 작업 계획서 (PLAN) — 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선)

> **문서 ID**: PLAN-TASK-ES-162-component-modularization  
> **티켓 연계**: #TASK-ES-162  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 목표 수립 (Problem & Goal)
- **목표**:
  - 상민님 직접 지시("컴포넌트 모듈화 → 효과 시너지, 효율화, UI 및 사용자경험 개선", 생각 메모장 [23]번)에 따라,
  - 아워골 전역에서 재사용 가능한 5대 핵심 UI 컴포넌트 모듈(`js/components.js`, `OurgoalComponents`)을 구축하고, 디자인 토큰과 상호작용 규격을 단일화하여 개발 효율화 및 사용자경험 개선 시너지를 창출함.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 정립 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 일관되고 아름다운 UI/UX 디자인 시스템의 확립과 유지보수/개발 생산성의 극대화.
- **[원인] (Causes)**:
  - 25,000줄의 단일 index.html 내 인라인 HTML 하드코딩 중복, 디자인 파편화.
- **[중심] (Core)**:
  - 순수 함수 기반의 가볍고 강력한 공통 컴포넌트 시스템 `OurgoalComponents`.
- **[핵심] (Anchor)**:
  - 1) `OurgoalComponents.badge(type, text, icon)`
  - 2) `OurgoalComponents.statCard(title, value, diff, icon, subtext)`
  - 3) `OurgoalComponents.progressBar(percent, colorType, showLabel)`
  - 4) `OurgoalComponents.modalShell(options)`
  - 5) `OurgoalComponents.emptyState(icon, title, desc, actionBtn)`

---

## 3. [원칙 ③] 설계 및 아키텍처 (Architecture & Effective Solutions)
- **자바스크립트 (`js/components.js`)**:
  - IIFE 패턴으로 전역 `window.OurgoalComponents`에 바인딩.
  - 각 컴포넌트는 파라미터를 받아 완성된 시맨틱 HTML 문자열을 반환하는 순수 함수 형태.
- **CSS 스타일 (`ui.css`)**:
  - `.og-badge`, `.og-stat-card`, `.og-progress-wrap`, `.og-progress-fill`, `.og-empty-state`.
- **스크립트 주입 (`index.html`)**:
  - `<script src="js/components.js?v=20260917-es162"></script>` 등록.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases)
- 모듈 로딩 실패 시: 기존 인라인 렌더러와 독립적이므로 앱 런타임 크래시 없음.
- XSS 방어: 전달된 인자의 HTML 이스케이프 철저 수행.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
1. Step 1: `js/components.js` 생성 및 5대 핵심 컴포넌트 구현.
2. Step 2: `ui.css`에 공통 컴포넌트 스타일 클래스 추가.
3. Step 3: `index.html`에 스크립트 태그 등록 및 연동.
4. Step 4: `sw.js` 캐시 버전 갱신 (`ourgoal-shell-v20260917-es162`).
5. Step 5: `scripts/smoke-test.js`에 #TASK-ES-162 검증 추가.
6. Step 6: 헌법 게이트 및 스모크 테스트 전수 통과 후 커밋 및 로컬 main 병합.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 302개 전수 통과 확인.
- `node scripts/verify-integrity-gate.js` 17대 게이트 100% PASS 확인.
- Dead Click 전수 검사 통과 확인.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 5대 공통 UI 컴포넌트가 모듈화되어, UI 디자인 통일성과 개발 생산성 개선이 실현됨.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: INFRA(개발 효율화 및 디자인 품질 기반 구축).
