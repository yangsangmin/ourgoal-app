# 엔지니어링 작업계획서 (PLAN) — 가입 첫날 신규 유저(기록 0~2개)를 위한 '3일 실천 완성 레이더 차트 미리보기' 인포그래픽

> **문서 ID**: PLAN-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW  
> **요구사항 연계**: [REQ-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW.md)  
> **티켓 연계**: #TASK-ES-233  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  기록 탭의 라이프 밸런스 차트 영역에 누적 기록 0~2개인 콜드스타트 유저를 감지하여 텅 빈 공백 대신 [💡 3일 뒤 완성될 나의 6각 성장 차트] SVG 비전 인포그래픽과 실천 진척도(0/3, 1/3, 2/3)를 렌더링하고, 3회 달성 즉시 실데이터 차트로 자동 승격시키는 온보딩 데이터 시각화 파이프라인을 구축한다.
- **영향 받는 파일 목록 전수**:
  - docs/rules/TICKETS.md: #TASK-ES-233 티켓 등록
  - docs/specs/REQ-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW.md: 요구사항 정의서
  - docs/specs/PLAN-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW.md: 본 작업계획서
  - reports/TASK-ES-233/claims.json: 법정 검증 청구서
  - index.html: renderColdstartRadarPreviewSvg 함수 신설 및 renderLifeBalanceWheel 콜드스타트 조건부 분기 배선
  - scripts/smoke-test.js: #TASK-ES-233 검증 단언문 4종 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 콜드스타트 구간(기록 0~2개)에서 발생하는 시각적 공백 및 레이아웃 찌그러짐을 방어하고, 브라우저 Native SVG 렌더링으로 6대 성장 축의 균형 잡힌 목표 비전을 제시하는 **"콜드스타트 방어 및 성장 비전 렌더링 엔진(E2 Axis)"**이다.
- **[원인] (Technical Causes)**:
  - allRecs.length가 0일 때 innerHTML을 빈 문자열로 비워버려 밸런스 휠 슬라이드가 텅 비고, 1~2개일 때 온전한 다각 차트를 그리지 못했음.
- **[중심 배선] (Core Wire & State)**:
  - `allRecs.length < 3`: renderColdstartRadarPreviewSvg(allRecs.length) 렌더링
  - `allRecs.length >= 3`: 기존 OurgoalRecordsStats.renderLifeBalancePieSvg 실데이터 차트 렌더링
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 3회 이상 헤비 유저의 파이 휠 렌더링 및 테마 필터링 기능 100% 무손실 보존.
  - Zero Dead-Click 린터 및 38대 헌법 게이트 완전 통과.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| index.html | renderColdstartRadarPreviewSvg 및 분기 배선 | +75줄 | -4줄 | +71줄 | 핵심 로직 |
| scripts/smoke-test.js | #TASK-ES-233 스모크 테스트 4종 단언 | +30줄 | 0줄 | +30줄 | 검증 단언 |
| docs/specs/REQ-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW.md | 정본 REQ | +120줄 | 0줄 | +120줄 | 정본 스펙 |
| docs/specs/PLAN-TASK-ES-233-RADAR-CHART-COLDSTART-PREVIEW.md | 정본 PLAN | +100줄 | 0줄 | +100줄 | 정본 스펙 |
| reports/TASK-ES-233/claims.json | 법정 검증 청구서 | +80줄 | 0줄 | +80줄 | 검증 청구서 |
| docs/rules/TICKETS.md | 티켓 등록 | +2줄 | 0줄 | +2줄 | 규칙 관리 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **헤비 유저 회귀 방어**:
  - allRecs.length >= 3일 때 기존 파이 차트 코드가 100% 동일하게 실행되도록 철저히 가드.
- **SVG 반응형 안전 대책**:
  - viewBox="0 0 320 240"과 style="width:100%;max-width:320px;height:auto;margin:0 auto;display:block;"로 모바일 375px 완벽 적응.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. index.html 내 renderColdstartRadarPreviewSvg 함수 구현 및 renderLifeBalanceWheel 배선.
2. scripts/smoke-test.js에 검증 추가.
3. npm test로 38개 헌법 게이트 및 Zero Dead-Click 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - allRecs가 null 또는 undefined일 때도 안전하게 빈 배열([])로 기본 처리되어 0건 프리뷰가 정상 렌더링되도록 방어.
- **가정의 타당성 검증**:
  - 3일 실천 로드맵은 아워골의 3일 스트릭 온보딩 철학과 완벽히 일치함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- npm test 336개 이상 전체 PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Dead-Click 검사 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-233
- 노션 DB 103번 항목 완료 기준 완벽 충족.
