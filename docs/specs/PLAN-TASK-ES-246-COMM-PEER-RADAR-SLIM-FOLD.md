# 엔지니어링 작업계획서 (PLAN) — 소통탭 실시간 러닝메이트 레이더 영역 슬림화 및 접이식 콤팩트 카드 전환으로 피드 집중도 극대화

> **문서 ID**: PLAN-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD  
> **요구사항 연계**: [REQ-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD.md)  
> **티켓 연계**: #TASK-ES-246  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  소통탭 상단의 러닝메이트 레이더(.s-peer-radar-card)의 세로 면적을 50% 이상 슬림화(가로 1줄 56px 스토리 스트립)하고 아코디언 토글 버튼을 추가하여 첫 화면에서 소통 피드가 즉각 돋보이도록 개선한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-246 티켓 등록
  - docs/specs/REQ-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD.md: 본 작업계획서
  - reports/TASK-ES-246/claims.json: 법정 검증 청구서
  - js/sanctuary-v3-engine.js: renderSanctuaryComm 토글 및 슬림 스트립 반영, toggleRadarCollapse 함수 추가
  - ui.css: .s-peer-radar-card 슬림화 및 .s-r-goal 숨김 규칙
  - scripts/smoke-test.js: #TASK-ES-246 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 과도한 세로 면적을 점유하던 레이더 카드를 가로 1줄 콤팩트 스토리 스트립으로 압축하고 접이식 토글 제어권을 제공하여, 375px 모바일 뷰포트에서 피드 카드의 가시성을 극대화하는 **"러닝메이트 레이더 슬림화 및 피드 중심 소통 렌더링 엔진(E3/FIX Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 레이더 카드 내 16px 패딩, 54px 아바타 서클, 2줄 텍스트로 인해 높이가 140px 이상 달해 피드가 아래로 밀렸음.
- **[중심 배선] (Core Wire & State)**:
  - `#peerRadarToggleBtn`: 레이더 접기/펼치기 토글.
  - `window.OurgoalSanctuaryV3.toggleRadarCollapse`: 슬롯 상태 토글 및 햅틱 피드백.
  - `ui.css`: `.s-peer-radar-card` 상하 패딩(10px) 및 `.s-r-goal { display: none !important; }` 적용.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 피어 클릭 시 `openPeerInteraction` 핸들러 및 새로고침 버튼 100% 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| js/sanctuary-v3-engine.js | 토글 버튼, toggleRadarCollapse 구현 및 바인딩 | +25줄 | -4줄 | +21줄 | 로직 |
| ui.css | 레이더 슬림화 및 목표 텍스트 은폐 규칙 | +30줄 | 0줄 | +30줄 | 스타일 |
| scripts/smoke-test.js | #TASK-ES-246 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-246-COMM-PEER-RADAR-SLIM-FOLD.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-246/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **기존 헌법 검증 유지**:
  - `verify-integrity-gate.js`의 소통 탭 본질 검증 및 뷰 전환 100% 통과 유지.
- **4대 테마 시인성**:
  - 다크, 블랙, 화이트, 도심 4대 테마 전수에서 레이더 헤더 및 아바타 링 색상 일관성 확보.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. js/sanctuary-v3-engine.js 내 renderSanctuaryComm 수정 및 toggleRadarCollapse 추가.
2. ui.css 내 레이더 카드 슬림화 및 접힌 상태 스타일 정의.
3. scripts/smoke-test.js에 #TASK-ES-246 검증 단언문 추가.
4. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 순수 DOM 데이터 속성 기반 접기/펼치기로 외부 상태 오염 위험 0%.
- **가정의 타당성 검증**:
  - 레이더 높이 50% 축소로 모바일 375px 해상도에서 소통 피드가 스크롤 없이 첫 화면에 안착됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 레이더 높이 56px 수준 슬림화 확인.
- 접기/펼치기 토글 정상 동작 확인.
- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-246
- 노션 DB 116번 항목 완료 기준 완벽 충족.
