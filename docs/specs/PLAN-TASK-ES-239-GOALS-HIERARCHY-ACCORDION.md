# 엔지니어링 작업계획서 (PLAN) — 목표탭 마일스톤·세부 할일 다건 등록 시 계층형 시인성 개선 및 접이식 관리 편의성 극대화

> **문서 ID**: PLAN-TASK-ES-239-GOALS-HIERARCHY-ACCORDION  
> **요구사항 연계**: [REQ-TASK-ES-239-GOALS-HIERARCHY-ACCORDION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-239-GOALS-HIERARCHY-ACCORDION.md)  
> **티켓 연계**: #TASK-ES-239  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  목표탭 마일스톤/세부 할 일 뷰에 아코디언 컴포넌트([▼ / ▲] 토글, 완료 N/전체 N 뱃지, 미니 진행률 바), 완료 할 일 1줄 접이식 그룹핑, 세로 계층 가이드 라인, 상단 [모두 접기/모두 펼치기] 컨트롤을 구축한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-239 티켓 등록
  - docs/specs/REQ-TASK-ES-239-GOALS-HIERARCHY-ACCORDION.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-239-GOALS-HIERARCHY-ACCORDION.md: 본 작업계획서
  - reports/TASK-ES-239/claims.json: 법정 검증 청구서
  - ui.css: .task-list 세로 가이드 라인 및 아코디언/접기 스타일 선언
  - index.html: renderGoalsScreen 마일스톤/할 일 아코디언 및 이벤트 배선
  - scripts/smoke-test.js: #TASK-ES-239 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 마일스톤과 태스크 간의 부모-자식 트리 구조를 시각적 계층과 상태 접힘 인터랙션으로 추상화하여, 방대한 할 일 속에서도 사용자 인지 과부하를 원천 차단하는 **"계층형 태스크 아코디언 및 인텔리전트 완료 그룹핑 엔진(E1/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 완료된 할 일과 미완료 할 일이 단일 플랫 리스트로 렌더링되어 태스크 개수 증가 시 화면이 비대해지고 집중도가 분산되었음.
- **[중심 배선] (Core Wire & State)**:
  - `data-mstoggle`: 마일스톤 할 일 목록 접기/펼침 (`state.collapsedMilestones[m.id]`)
  - `data-toggledonetasks`: 완료된 할 일 목록 접기/펼침 (`state.expandedDoneTasks[m.id]`)
  - `#msCollapseAllBtn`: 전체 마일스톤 일괄 접기/펼치기
  - `data-taskcheck`: 할 일 완료 체크 시 상위 마일스톤 `doneTasks` 즉시 갱신
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `data-taskcheck` 토글 시 캘린더 연동 및 프로필 저장을 온전히 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| ui.css | 세로 가이드 라인 및 접이식 컴포넌트 스타일 | +25줄 | 0줄 | +25줄 | 스타일 |
| index.html | 마일스톤 아코디언/진행 바/완료 그룹화 배선 | +40줄 | -10줄 | +30줄 | 핵심 로직 |
| scripts/smoke-test.js | #TASK-ES-239 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-239-GOALS-HIERARCHY-ACCORDION.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-239-GOALS-HIERARCHY-ACCORDION.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-239/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `#personalGoalsView`, `[data-taskcheck]`, `[data-mstoggle]` 등 필수 앵커 100% 보존.
- **모바일 375px 호환성**:
  - 아코디언 토글 버튼 및 접기 바는 최소 44px 터치 타깃을 충족.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. ui.css 내 .task-list 세로 가이드 라인 및 접이식 바 스타일 선언.
2. index.html의 renderGoalsScreen 내 아코디언, 진행률 뱃지/바, 완료 그룹화 로직 구현.
3. scripts/smoke-test.js에 #TASK-ES-239 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 완료 할 일 접기 상태는 `state.expandedDoneTasks` 객체로 방어 처리되어 키가 없더라도 에러 없이 기본 접힘 동작.
- **가정의 타당성 검증**:
  - 완료된 할 일을 기본 접힘 처리함으로써 화면 당 태스크 시각 점유율이 대폭 감소하고 핵심 할 일에 집중 가능.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 337개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-239
- 노션 DB 109번 항목 완료 기준 완벽 충족.
