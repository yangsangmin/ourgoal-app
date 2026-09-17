# 작업 계획서 (PLAN) — 측정지표 분석할 항목별 차등 지정 및 정밀화·고도화

> **문서 ID**: PLAN-TASK-ES-163-differentiated-metric-analysis  
> **티켓 연계**: #TASK-ES-163  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 목표 수립 (Problem & Goal)
- **목표**:
  - 상민님 직접 지시("측정지표 분석할 항목별로 다르게 지정, 정밀화 고도화", 생각 메모장 [24]번)에 따라,
  - 6대 핵심 도메인(체중, 헬스, 러닝, 공부, 자산, 수면)별 전문 분석 공식을 차등 적용하고, 유저가 지표별 집계 기준을 직접 차등 지정할 수 있는 정밀 분석 고도화 시스템을 구축함.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 정립 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 도메인 특성에 100% 부합하는 과학적 지표 분석으로 실질적인 성장 피드백 제공 (E2 회고 본질).
- **[원인] (Causes)**:
  - 모든 지표에 단순 합계/평균만을 일률 적용하여 종목별 핵심 성취 지표(1RM, 이동평균, 페이스존, 수면규칙성) 파악 불가.
- **[중심] (Core)**:
  - `computeDifferentiatedAnalysis` 차등 엔진 및 항목별 커스텀 집계 기준 UI.
- **[핵심] (Anchor)**:
  - 1) 체중: 7일 이동평균 & 주간 감량 안전도.
  - 2) 헬스/3대: 에플리 공식 추정 1RM & 과부하 달성도.
  - 3) 러닝: 5단계 페이스존 & 심폐 마일리지.
  - 4) 공부: 분당 몰입 밀도 & 뽀모도로 세션 지속성.
  - 5) 자산: 월간 저축 가속도 & 복리 성장률.
  - 6) 수면: 취침/기상 변동성 수면 규칙성 100점 점수.

---

## 3. [원칙 ③] 설계 및 아키텍처 (Architecture & Effective Solutions)
- **자바스크립트 엔진 (`js/universal-stats.js`)**:
  - `METRIC_DIFFERENTIATED_MODELS`: 6대 도메인별 고유 연산자 및 계산 함수 매핑.
  - `computeDifferentiatedAnalysis(key, records, customAgg)`: 실제 기록 배열을 받아 차등 지표 및 전문 인사이트 리포트 객체 반환.
- **UI 및 인터랙션 (`index.html`, `ui.css`)**:
  - 통계 뷰 상단에 [⚙️ 지표별 분석 기준 설정] 버튼 배치.
  - 지표 분석 기준 선택 모달: 각 지표별로 '누적합(sum)', '평균(avg)', '최고기록(max)', '7일이동평균(ma7)' 라디오/셀렉터 제공.
- **PWA 서비스워커 (`sw.js`)**:
  - `ourgoal-shell-v20260917-es163` 캐시 갱신.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases)
- 기록 데이터 결측치 처리: 안전한 기본값(0 또는 직전값) 폴백.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
1. Step 1: `js/universal-stats.js`에 차등 분석 모델 및 계산 엔진 탑재.
2. Step 2: `index.html`에 지표별 분석 기준 커스텀 설정 모달 및 차등 리포트 렌더링 연결.
3. Step 3: `ui.css`에 차등 지표 배지 및 설정 UI 스타일 추가.
4. Step 4: `sw.js` 캐시 버전 갱신 (`ourgoal-shell-v20260917-es163`).
5. Step 5: `scripts/smoke-test.js`에 #TASK-ES-163 검증 추가.
6. Step 6: 헌법 게이트 및 스모크 테스트 전수 통과 후 커밋 및 로컬 main 병합.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 303개 전수 통과 확인.
- `node scripts/verify-integrity-gate.js` 17대 게이트 100% PASS 확인.
- Dead Click 전수 검사 통과.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 도메인별 특화 분석을 통해 체중/운동/러닝/공부/자산/수면 전 영역에서 정밀한 성취감과 동기부여를 제공함.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: E2(기록 회고 — 내 삶을 발전시키는 전문 지표 분석).
