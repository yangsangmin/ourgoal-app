# 요구사항 정의서 (REQ) — 컴포넌트 모듈화 (효과 시너지, 개발 효율화, UI 및 사용자경험 개선)

> **문서 ID**: REQ-TASK-ES-162-component-modularization  
> **티켓 연계**: #TASK-ES-162  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 정의 (Problem Definition)
- **상민님 원문 요구사항**:
  - "컴포넌트 모듈화 → 효과 시너지, 효율화, UI 및 사용자경험 개선" (노션 생각 메모장 [23]번)
- **현상적 결함 및 구조적 비효율**:
  - 아워골은 단일 거대 파일(`index.html`) 내에 모달 셸, 통계 지표 카드, 프로그레스 바, 배지, 빈 화면(Empty State) 등의 UI 마크업이 각 화면과 함수마다 인라인 문자열로 하드코딩되어 파편화되어 있음.
  - 이로 인해 디자인 토큰의 불일치, 코드 중복, 유지보수 비용 급증, 스타일 변경 시 산발적 결함 위험이 상존함.
  - 신규 기능 추가 시마다 동일한 UI 패턴을 재작성해야 하여 생산성 저하 발생.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 분석 (Root Cause & 4 Elements)
- **[본질] (Essence)**:
  - 일관되고 아름다운 UI 디자인 시스템과 확장성 있는 개발 생산성의 시너지 구축.
- **[원인] (Causes)**:
  - 공통 UI 컴포넌트 팩토리 모듈의 부재로 인해 각 탭/기능 개발자마다 인라인 HTML 문자열을 각자 조립해옴.
- **[중심] (Core)**:
  - 경량 전역 모듈 `js/components.js` (`OurgoalComponents`)를 구축하여 5대 공통 UI 요소를 순수 함수 기반으로 캡슐화하고 어디서나 1줄로 재사용 가능하게 표준화.
- **[핵심] (Anchor)**:
  - 1) `badge(type, text, icon)`: 디자인 토큰 일치형 배지 컴포넌트.
  - 2) `statCard(title, value, diff, icon, subtext)`: 성장/통계 대시보드 공통 카드 컴포넌트.
  - 3) `progressBar(percent, colorType, showLabel)`: 부드러운 애니메이션 게이지바 컴포넌트.
  - 4) `modalShell(options)`: 헤더, 바디, 액션바를 표준화한 안전 모달 셸 템플릿.
  - 5) `emptyState(icon, title, desc, actionBtn)`: 감성적 안내와 원클릭 액션을 제공하는 빈 화면 컴포넌트.

---

## 3. [원칙 ③] 설계 및 아키텍처 방안 (Design & Architecture)
- **모듈 격리**: `js/components.js` 독립 파일로 분리, 브라우저 환경에서 `window.OurgoalComponents`로 안전 노출.
- **XSS 방어**: 모든 텍스트 인자에 자체 `escapeHtml` 또는 글로벌 `escapeHtml` 방어벽 적용.
- **점진적 연동**: 기존 인라인 HTML과의 완벽한 하위 호환성을 유지하며, 홈/목표/설정/가이드 등에서 공통 컴포넌트 API 호출 가능하도록 배선.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases & Countermeasures)
- 잘못된 파라미터(null, undefined, 음수 퍼센트 등) 전달 시 기본값 방어.
- CSS 클래스 충돌 방지: `og-comp-*` 접두사를 활용하거나 기존 디자인 시스템 클래스와 100% 호환.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
- Step 1: `js/components.js`에 `OurgoalComponents` 5대 핵심 컴포넌트 구현.
- Step 2: `ui.css`에 공통 컴포넌트 전용 반응형 스타일 추가.
- Step 3: `index.html`에 `<script src="js/components.js">` 등록 및 공통 컴포넌트 바인딩.
- Step 4: `sw.js` 캐시 갱신 (`ourgoal-shell-v20260917-es162`).
- Step 5: `scripts/smoke-test.js`에 #TASK-ES-162 검증 추가.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 302개 전수 ALL PASS.
- 헌법 게이트 17종 ALL PASS.
- Zero Dead Click 전수 검사 통과.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 컴포넌트 모듈화를 통해 코드 재사용성과 UI 통일성이 대폭 향상되며 향후 기능 개발 속도가 배가됨.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: INFRA(기반 인프라 및 UI 일관성 확립).
