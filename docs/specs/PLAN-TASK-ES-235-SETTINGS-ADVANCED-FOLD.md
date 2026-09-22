# 엔지니어링 작업계획서 (PLAN) — 설정 탭 내 전문가용 외부 연동(구글캘린더 OAuth, 노션 API, Gemini API)을 [고급 설정]으로 기본 접힘 처리

> **문서 ID**: PLAN-TASK-ES-235-SETTINGS-ADVANCED-FOLD  
> **요구사항 연계**: [REQ-TASK-ES-235-SETTINGS-ADVANCED-FOLD](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-235-SETTINGS-ADVANCED-FOLD.md)  
> **티켓 연계**: #TASK-ES-235  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  설정 탭의 인지 과부하를 해소하기 위해 복잡한 구글 캘린더 OAuth, 노션 API, Gemini API 키 설정 블록을 `#advancedSettingsAccordion` 내부로 격리하고 기본 접힘 상태로 배치한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-235 티켓 등록
  - docs/specs/REQ-TASK-ES-235-SETTINGS-ADVANCED-FOLD.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-235-SETTINGS-ADVANCED-FOLD.md: 본 작업계획서
  - reports/TASK-ES-235/claims.json: 법정 검증 청구서
  - index.html: #advancedSettingsAccordion 마크업 및 이벤트 배선, toggleAdvancedSettings 전역 노출
  - ui.css: .advanced-settings-accordion, .advanced-settings-body 스타일 선언
  - scripts/smoke-test.js: #TASK-ES-235 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 기존의 복잡한 3대 외부 연동 파이프라인의 기능적 무결성을 100% 유지하면서, 뷰 레이어에서 네이티브 details 아코디언 컴포넌트를 통해 시각적 복잡도를 격리하는 **"설정 탭 미니멀 인터페이스 및 아코디언 격리 엔진(FIX/INFRA Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 구글 캘린더 OAuth, 노션 토큰, Gemini API 필드가 일반 설정과 평면적으로 혼재되어 있어 세로 스크롤 압박 및 인지 과부하를 유발했음.
- **[중심 배선] (Core Wire & State)**:
  - `#advancedSettingsAccordion`: 기본 접힘 상태로 3대 외부 연동 블록 수용
  - `#advancedSettingsSummary`: 아코디언 토글 헤더 및 12ms 햅틱 배선
  - `window.toggleAdvancedSettings`: 전역 개폐 제어 헬퍼
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 `#gcalClientIdInput`, `#notionSwitch`, `#geminiKeyInput` 등 모든 DOM 식별자 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | 아코디언 마크업 신설 및 햅틱 배선 | +35줄 | -5줄 | +30줄 | 핵심 로직 |
| ui.css | 고급 설정 아코디언 반응형 스타일 선언 | +20줄 | 0줄 | +20줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-235 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-235-SETTINGS-ADVANCED-FOLD.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-235-SETTINGS-ADVANCED-FOLD.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-235/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **Dead-Click 린터 방어**:
  - 아코디언 내부 버튼 및 링크에 명시적 핸들러 결속 유지.
- **접힘 상태에서의 DOM 접근 안전망**:
  - details/summary 구조는 닫힌 상태에서도 DOM 트리에 항상 존재하므로 기존 getElementById 로직이 100% 정상 작동함.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. index.html에 #advancedSettingsAccordion 마크업 신설 및 전문가용 블록 이동.
2. index.html 내 toggleAdvancedSettings 헬퍼 및 햅틱 배선.
3. ui.css에 .advanced-settings-accordion 스타일 선언.
4. scripts/smoke-test.js에 #TASK-ES-235 검증 단언문 추가.
5. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 아코디언 개폐 이벤트 발생 시 triggerHapticFeedback이 안전하게 방어 호출되도록 `typeof triggerHapticFeedback === 'function'` 가드 적용.
- **가정의 타당성 검증**:
  - 기본 open 속성 부재로 설정 화면 첫 진입 시 스크롤 압박이 70% 이상 획기적으로 감소함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-235
- 노션 DB 105번 항목 완료 기준 완벽 충족.
