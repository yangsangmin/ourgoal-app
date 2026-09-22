# 엔지니어링 작업계획서 (PLAN) — 'AI 목표 어시스턴트' 자연어 입력 시 모호한 문장 방어를 위한 [확인 및 단계 선택] 프리뷰 탑재

> **문서 ID**: PLAN-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT  
> **요구사항 연계**: [REQ-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT.md)  
> **티켓 연계**: #TASK-ES-236  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  자연어 목표 입력 시 일방적인 자동 저장을 방어하고, 사용자 주도적인 [✨ 제안된 목표 플랜 확인] 프리뷰 바텀시트에서 제목 인라인 편집, 실천 주기 칩, 마일스톤 단계 On/Off 체크박스를 제공하여 검증된 데이터만 최종 저장 및 4대 뷰에 동시 전파한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-236 티켓 등록
  - docs/specs/REQ-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT.md: 본 작업계획서
  - reports/TASK-ES-236/claims.json: 법정 검증 청구서
  - index.html: showGoalAgentReviewStep 함수 고도화 및 단계 선택·인라인 수정 배선
  - ui.css: .ga-plan-preview-sheet, .ga-ms-card, .goal-freq-chip 스타일 선언
  - scripts/smoke-test.js: #TASK-ES-236 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 생성형 AI가 산출한 원시 JSON 마일스톤 트리를 뷰 레이어의 인터랙티브 폼으로 디하이드레이션(Dehydration)하여 사용자가 선택·가공한 서브트리만을 안전하게 리하이드레이션(Rehydration)하여 프로필 원장에 영속화하는 **"인간 중심 AI 목표 선택 및 무결성 검증 엔진(E1/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 기존 `showGoalAgentReviewStep`이 정적 미리보기에 그치고 각 마일스톤 단계를 토글하거나 인라인으로 제목을 수정할 수 있는 폼 컨트롤이 결여되어 있었음.
- **[중심 배선] (Core Wire & State)**:
  - `showGoalAgentReviewStep`: AI 생성 목표 감지 시 [✨ 제안된 목표 플랜 확인] 인터랙티브 시트 렌더링
  - `#gaGoalTitleInput`: 목표 제목 실시간 인라인 편집
  - `.goal-freq-chip`: 실천 주기(매일/주3회 등) 선택 상태 관리
  - `.ga-ms-check`: 마일스톤 개별 포함/제외 체크박스 바인딩
  - `#gaApplyBtn`: 최종 검증된 마일스톤만 프로필 원장에 저장 및 로드맵 동시 전파
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 체크된 마일스톤이 0개일 경우 경고 토스트로 방어하고 저장 차단.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | 목표 플랜 프리뷰 및 단계 선택 인터랙션 고도화 | +80줄 | -20줄 | +60줄 | 핵심 로직 |
| ui.css | 프리뷰 시트 및 마일스톤 카드, 주기 칩 스타일 선언 | +30줄 | 0줄 | +30줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-236 스모크 테스트 단언문 추가 | +25줄 | 0줄 | +25줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-236-AI-GOAL-PREVIEW-STAGE-SELECT.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-236/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **Dead-Click 린터 방어**:
  - 프리뷰 시트 내 실천 주기 칩, 마일스톤 체크박스, 취소/수정/적용 버튼 전수에 명시적 핸들러 결속.
- **기존 수정/삭제 명령 호환성**:
  - 목표 신규 생성이 아닌 기존 목표 수정(UPDATE)이나 삭제(DELETE) 명령은 기존 프리뷰 뷰를 정상 유지하여 완전한 하위 호환성 보장.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. index.html의 showGoalAgentReviewStep 함수 내 목표 신규 생성 분기 인터랙티브 템플릿 구현.
2. ui.css에 .ga-plan-preview-sheet, .ga-ms-card, .goal-freq-chip 스타일 선언.
3. scripts/smoke-test.js에 #TASK-ES-236 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 사용자가 단계 체크박스를 모두 해제하고 생성을 시도할 경우, '최소 1개 이상의 단계를 선택해주세요' 알림과 함께 안전하게 차단.
- **가정의 타당성 검증**:
  - 사용자는 3단계 마일스톤 중 자신의 현실적인 일정에 맞춰 1~2단계만 골라서 시작할 수 있어 진입 장벽이 대폭 낮아짐.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 337개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-236
- 노션 DB 106번 항목 완료 기준 완벽 충족.
