# 요구사항 정의서 (REQ) — 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화

> **문서 ID**: REQ-TASK-ES-163-differentiated-metric-analysis  
> **티켓 연계**: #TASK-ES-163  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 정의 (Problem Definition)
- **상민님 원문 요구사항**:
  - "측정지표 분석할 항목별로 다르게 지정, 정밀화 고도화" (노션 생각 메모장 [24]번)
- **현상적 결함 및 분석 한계**:
  - 기존 성취통계 및 목표 분석 엔진은 체중, 러닝, 3대 운동, 공부, 수면, 자산 등 서로 완전히 다른 성격을 가진 지표들에 대해 획일적인 단순 누적합이나 단순 평균만을 제공함.
  - 이로 인해 실제 운동인에게 중요한 1RM 추정이나 과부하 분석, 수험생에게 중요한 분당 몰입 밀도, 다이어터에게 중요한 7일 이동평균 수치가 결여되어 분석의 실효성과 유익함이 반감됨.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 분석 (Root Cause & 4 Elements)
- **[본질] (Essence)**:
  - 나의 실천 데이터가 내 인생에 실질적으로 유익한 맞춤형 통찰과 성장의 나침반이 되는 전문적 분석 가치(E2 본질).
- **[원인] (Causes)**:
  - 도메인별 고유 분석 알고리즘(공식)의 부재, 지표별 집계 방식(누적/평균/최고/이동평균)의 하드코딩.
- **[중심] (Core)**:
  - 6대 핵심 도메인별 전문 공식이 결합된 차등 정밀 분석 모델(`METRIC_DIFFERENTIATED_MODELS`) 및 지표 커스텀 집계 기준 제어 시스템 구축.
- **[핵심] (Anchor)**:
  - 1) ⚖️ **체중/다이어트**: 7일 이동평균(체수분 왜곡 배제) & 주간 감량 안전 속도(0.5~1.0kg 권장존) 진단.
  - 2) 🏋️ **헬스/3대 운동**: 에플리(Epley) 공식 기반 추정 1RM(W*(1+R/30)) & 점진적 과부하 달성도.
  - 3) 🏃 **러닝/유산소**: 5단계 페이스존(회복~전력) & 심폐 부하 마일리지 지수.
  - 4) 📚 **공부/몰입**: 순공 분당 몰입 밀도 & 뽀모도로 세션 지속성.
  - 5) 💰 **재테크/자산**: 월간 저축 가속도 & 목표 복리 도달 가속률.
  - 6) 💤 **수면/웰니스**: 취침/기상 시각 표준편차 기반 수면 규칙성 100점 지수.

---

## 3. [원칙 ③] 설계 및 아키텍처 방안 (Design & Architecture)
- **분석 엔진 확장 (`js/universal-stats.js`)**:
  - `computeDifferentiatedAnalysis(metricKey, timeSeriesData)`: 항목별 고유 알고리즘 적용 및 특화 KPI 배지 4종 동적 산출.
  - 각 도메인 전용 심층 인사이트 문구 템플릿(정밀 진단 코멘터리) 탑재.
- **사용자 커스텀 집계 기준 모달 (`index.html`, `ui.css`)**:
  - 사용자가 지표별로 선호하는 집계 기준(누적합 sum / 산술평균 avg / 최고기록 max / 7일이동평균 ma7)을 직접 변경할 수 있는 '지표 분석 설정' 기능 지원.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases & Countermeasures)
- 기록이 0개 또는 1개인 경우: 안전한 샘플/초기 가이드 표시.
- 계산 시 0으로 나누기(Divide by Zero) 및 NaN 철저 방어.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
- Step 1: `js/universal-stats.js`에 6대 차등 분석 모델 및 `computeDifferentiatedAnalysis` 구현.
- Step 2: `index.html`에 지표별 분석 기준 커스텀 선택 및 차등 리포트 렌더링 배선.
- Step 3: `ui.css`에 차등 지표 전용 배지 및 리포트 스타일 추가.
- Step 4: `sw.js` 캐시 갱신 (`ourgoal-shell-v20260917-es162`).
- Step 5: `scripts/smoke-test.js`에 #TASK-ES-163 검증 추가.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 303개 전수 통과 확인.
- `node scripts/verify-integrity-gate.js` 17대 게이트 100% PASS 확인.
- Dead Click 전수 검사 통과.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 운동, 공부, 체중, 러닝, 자산 등 항목별로 본질에 부합하는 차등 지표 분석을 제공함으로써 유저의 기록 동기와 데이터 만족도가 비약적으로 상승함.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: E2(기록 회고 — 내 인생에 유익한 진짜 기록 분석).
