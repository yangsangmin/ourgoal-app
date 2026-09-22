# 엔지니어링 작업계획서 (PLAN) — 기록탭 샘플 데이터 1초 체험 후 원클릭 완전 삭제/초기화 기능 구현 및 신규 유저 편의성 제고

> **문서 ID**: PLAN-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE  
> **요구사항 연계**: [REQ-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE.md)  
> **티켓 연계**: #TASK-ES-245  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  기록탭 내 샘플 데이터(isSample === true)를 능동 감지하여 상단에 원클릭 정화 배너를 노출하고, 사용자의 진짜 기록은 100% 보존하면서 샘플 데이터만 1초 만에 일괄 삭제 및 화면 즉시 리프레시를 완결한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-245 티켓 등록
  - docs/specs/REQ-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE.md: 본 작업계획서
  - reports/TASK-ES-245/claims.json: 법정 검증 청구서
  - index.html: #recSamplePurgeBanner 슬롯, purgeSampleRecordsOneClick() 함수 및 renderRecordsScreen 바인딩
  - ui.css: .rec-sample-purge-box 스타일 선언
  - scripts/smoke-test.js: #TASK-ES-245 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 기록 탭 상단에서 샘플 데이터의 개수를 실시간 감지하여 직관적인 정화 배너를 렌더링하고, 실제 사용자 기록은 100% 무손실 보존한 채 샘플만 선별 격리 삭제하는 **"샘플 데이터 능동 감지 및 원클릭 자가 정화 엔진(E2/DATA Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 샘플 데이터 정화 버튼이 가져오기 팝업 내부 깊숙이 위치하여 기록 메인 화면에서 신규 유저가 쉽게 찾지 못했음.
- **[중심 배선] (Core Wire & State)**:
  - `#recSamplePurgeBanner`: `sampleCount > 0`일 때만 활성화되는 콤팩트 원터치 배너.
  - `purgeSampleRecordsOneClick()`: `confirm` 확인 후 `state.profile.records = records.filter(r => !r.isSample)`, `saveProfile()`, `dispatchFullViewPropagation()`, `renderRecordsScreen()` 순차 호출.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `r.isSample !== true` 항목은 일절 건드리지 않는 무손실 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | 배너 슬롯, 정화 함수 및 렌더링 바인딩 | +45줄 | -2줄 | +43줄 | 로직/마크업 |
| ui.css | 배너 디자인 및 테마 고대비 스타일 | +15줄 | 0줄 | +15줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-245 스모크 테스트 단언문 추가 | +25줄 | 0줄 | +25줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-245-RECORDS-SAMPLE-DATA-PURGE.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-245/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 기록 탭 본질 검증 및 유저 데이터 무손실 검사 100% 통과 유지.
- **4대 테마 시인성**:
  - 다크/블랙/포커스 테마에서 붉은색 알림 톤이 눈에 편안하면서도 직관적으로 대비(4.5:1 이상) 확보.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. index.html 내 #recSamplePurgeBanner 슬롯 추가 및 purgeSampleRecordsOneClick 함수 구현.
2. renderRecordsScreen 내 sampleCount 실시간 감지 및 배너 바인딩.
3. ui.css 내 .rec-sample-purge-box 스타일 선언.
4. scripts/smoke-test.js에 #TASK-ES-245 검증 단언문 추가.
5. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 정화 도중 취소하거나 에러가 발생해도 사용자 기록은 안전하게 보존됨.
- **가정의 타당성 검증**:
  - 샘플 데이터 로드 후 1초 만에 원클릭 정화가 작동함을 브라우저 및 단위 테스트로 교차 검증.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- sampleCount > 0 일 때 배너 노출, 0일 때 자동 은폐.
- purgeSampleRecordsOneClick 실행 시 샘플 100% 삭제 및 실 유저 데이터 보존.
- npm test 337개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-245
- 노션 DB 115번 항목 완료 기준 완벽 충족.
