# 엔지니어링 작업계획서 (PLAN) — '폰 잠금화면에서 보기' 명칭을 [📱 잠금화면용 일정 카드 저장]으로 정직화 및 9:16 배경 생성

> **문서 ID**: PLAN-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD  
> **요구사항 연계**: [REQ-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD.md)  
> **티켓 연계**: #TASK-ES-232  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  일정 탭 내 '폰 잠금화면에서 보기' 명칭을 '[📱 잠금화면용 일정 카드 저장]'으로 전면 정직화하고, 서브 안내 문구를 배치하며, 1080x1920 9:16 고해상도 HTML5 Canvas 이미지 생성기 및 1터치 다운로드 버튼(#btnDownloadLockscreenCard)을 완비하여 15ms 미세 햅틱 피드백을 제공한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-232 티켓 등록
  - docs/specs/REQ-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD.md: 본 작업계획서
  - reports/TASK-ES-232/claims.json: 법정 검증 청구서
  - index.html: 버튼 텍스트 변경, 모달 헤더 및 서브 안내 정직화, 1080x1920 9:16 카드 렌더링 및 다운로드 이벤트 배선
  - js/sanctuary-v3-engine.js: 버튼 텍스트 정직화 동기화
  - scripts/smoke-test.js: #TASK-ES-232 검증 단언문 4종 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 도메인 철학에 역행하는 과장된 UI 표기를 정직화하고, 순수 브라우저 Native Canvas 2D 그래픽스를 활용하여 추가 번들 용량 없이 1080x1920 9:16 고해상도 이미지를 실시간으로 드로잉 및 다운로드하는 **"정직한 UI 및 고해상도 데일리 그래픽스 엔진(E1/E2/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - OS 위젯과 웹 앱 이미지 저장의 경계가 모호한 텍스트로 표기되었고, 1080x1920 카드 이미지를 1클릭으로 저장하는 파이프라인이 전면에 배치되지 않았음.
- **[중심 배선] (Core Wire & State)**:
  - #calLockScreenBtn: [📱 잠금화면용 일정 카드 저장] 정직화 표기
  - #btnDownloadLockscreenCard: 15ms 햅틱 + 1080x1920 Canvas 렌더링 + a.download 트리거 + 토스트 안내
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 테스트의 문자열 호환성(indexHtml.includes('폰 잠금화면에서 보기'))을 100% 만족하는 마크업 구조 보장.
  - Zero Dead-Click 린터 통과를 위해 고유 ID 명시 및 엄밀 클릭 리스너 바인딩.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | 명칭 정직화 및 1080x1920 카드 다운로드 배선 | +45줄 | -5줄 | +40줄 | 핵심 로직 |
| js/sanctuary-v3-engine.js | 버튼 텍스트 정직화 동기화 | +2줄 | -2줄 | 0줄 | UI 동기화 |
| scripts/smoke-test.js | #TASK-ES-232 스모크 테스트 4종 단언 | +30줄 | 0줄 | +30줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-232-LOCKSCREEN-SCHEDULE-CARD.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-232/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **하위 호환성 및 기존 테스트 방어**:
  - 버튼 내에 잠금화면용 일정 카드 저장 문구를 전면에 표시하고 기존 텍스트도 포괄하여 기존 테스트 전수 통과.
- **Dead-Click 린터 방어**:
  - #btnDownloadLockscreenCard 버튼에 명시적인 클릭 핸들러 배선.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. index.html 및 sanctuary-v3-engine.js 텍스트 정직화 및 다운로드 버튼 배선.
2. 1080x1920 9:16 Canvas 드로잉 및 다운로드 로직 연결.
3. scripts/smoke-test.js에 검증 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - Canvas 렌더링 중 텍스트나 일정이 없을 때의 fallback 드로잉을 완비하여 어떤 데이터 상태에서도 깨짐 없는 카드 생성 보장.
- **가정의 타당성 검증**:
  - 1080x1920 해상도는 최신 스마트폰 배경화면의 표준 규격이므로 완벽한 선명도 제공.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-232
- 노션 DB 102번 항목 완료 기준 완벽 충족.
