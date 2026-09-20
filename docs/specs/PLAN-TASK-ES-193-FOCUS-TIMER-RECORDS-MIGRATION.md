# 엔지니어링 작업계획서 (PLAN) — [#TASK-ES-193] 일정 탭 집중 타이머의 기록 탭 이전 및 기록 탭 6종 2열(3×2) 그리드 조형 재정돈

> **문서 ID**: PLAN-TASK-ES-193-FOCUS-TIMER-RECORDS-MIGRATION  
> **요구사항 연계**: [REQ-TASK-ES-193-FOCUS-TIMER-RECORDS-MIGRATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-193-FOCUS-TIMER-RECORDS-MIGRATION.md)  
> **티켓 연계**: #TASK-ES-193  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity (세션 11fcefcf)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 일정 탭에서 `[🧘 집중 타이머]`를 제거하여 `[월간]`, `[주간]`, `[일간 타임라인]` 3개 캘린더 전용 뷰로 정돈.
  - 기록/통계 탭에 `[🧘 집중 타이머]`를 편입하여 6개 서브탭을 구성하고, 모바일(375px)에서 1줄당 3개씩 2줄(3×2 그리드)로 배치하여 은폐 없는 조형과 40px 터치 타겟 보장.
- **영향 받는 파일 목록 전수**:
  - `js/sanctuary-v3-engine.js`:
    - 캘린더 모드 바 3종 단일화 및 timer 분기 제거
    - 기록 탭 서브탭 6종 3×2 그리드 배선 및 timer 렌더링 분기 신설
    - 뽀모도로 타이머 상태 갱신 시 기록 탭 실시간 재렌더링
  - `ui.css`:
    - `.s-cal-modes-wrap`: 3열 균등 그리드 스타일
    - `.s-rec-modes-wrap`: 3×2 그리드 스타일
    - `.s-rec-mode-btn`: 모바일 375px 패딩 및 폰트 크기 최적화
  - `scripts/verify-integrity-gate.js`:
    - [검증 17/17] 서브탭 정돈 및 3×2 그리드 정적 방화벽 게이트
  - `scripts/smoke-test.js`:
    - #TASK-ES-193 회귀 방지 자동화 테스트

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별
- **[본질] (Engineering Essence)**:
  - 아워골 E1(체크인/몰입)과 E2(회고/기록) 루프에서 일정 탭(계획)과 기록 탭(몰입·누적)의 책임을 명확히 분리하고, 모바일 375px 환경에서 6개 핵심 기능의 가시성과 접근성을 극대화하는 조형적 본질 완결.
- **[원인] (Technical Causes)**:
  - 캘린더 타임라인과 가깝다는 이유로 캘린더 모드에 타이머가 혼재되었고, 기록 탭 5개 메뉴가 가로 스크롤로 나열되어 후순위 메뉴가 화면 밖으로 은폐되었던 근본 원인.
- **[중심 배선] (Core Wire & State)**:
  - `engine.activeCalMode` 3종 단일화(`month`, `week`, `timeline`), `engine.activeRecMode` 6종 확장(`heatmap`, `feed`, `timer`, `stats`, `archive`, `recap`) 및 직통 렌더러 연결.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 타이머 세션(`engine.timerSeconds`) 무손실 보존, 기존 외부 호출 `setCalMode('timer')` 시 기록 탭 타이머로 안전 위임하는 하위 호환성 유지.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- `js/sanctuary-v3-engine.js`: +50줄 / -40줄
- `ui.css`: +35줄 / -10줄
- `scripts/verify-integrity-gate.js`: +25줄
- `scripts/smoke-test.js`: +25줄

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Do No Harm)
- 뽀모도로 타이머 로직(시작/정지/리셋/기록 적립) 원형 100% 보존.
- 기존 기록 탭 5개 서브탭(히트맵, 피드, 통계, 보관함, 리캡) 데이터 및 핸들러 100% 보존.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Execution Plan)
1. **[Step 1]**: `js/sanctuary-v3-engine.js` 캘린더 3종 정돈 및 timer 기록 탭 이전
2. **[Step 2]**: `js/sanctuary-v3-engine.js` 기록 탭 6종 3×2 그리드 마크업 및 timer 분기 렌더러 탑재
3. **[Step 3]**: `ui.css` 3열 캘린더 바 및 3×2 기록 바 그리드 스타일 정립
4. **[Step 4]**: 게이트 및 스모크 테스트 추가
5. **[Step 5]**: Chrome CDP 모바일 375px 실측 캡처 및 시각 감사 수행

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)
- **시나리오 A (Zero Dead-Click)**: 일정 탭 3개, 기록 탭 6개 버튼 전수 클릭 100% 뷰 전환
- **시나리오 B (Zero Loss)**: 타이머 완료 시 기록 적립 및 피드/히트맵 실시간 동시 반영
- **시나리오 C (Zero Regression)**: `npm test` 332개 단위 테스트 ALL PASS
- **시나리오 D (Visual Balance)**: 모바일 375px에서 가로 스크롤(오버플로우) 0건 확인
- **시나리오 E (Gatekeeper Verification)**: 32개 무결성 게이트 ALL PASS

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Milestone & Gate Checklist)
- [x] 1단계: 기획·설계 상태 (REQ/PLAN 수립 완료)
- [x] 2단계: 내부 시뮬레이션 상태 (코드 구현 완료)
- [ ] 3단계: 로컬 수동 확인 상태 (모바일 375px CDP 실측)
- [ ] 4단계: 로컬 메인 병합 상태
- [ ] 5단계: Vercel 프리뷰 배포

---

## 8. [원칙 ⑧] 본질 검증 프로토콜 (Live Acceptance Protocol)
- 일정 탭 3종 서브탭 캡처본과 기록 탭 6종 3×2 그리드 캡처본을 바탕으로 4-Block 규격으로 보고한다.
