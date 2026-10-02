# 엔지니어링 작업계획서 (PLAN) — [UI/UX 틀 개편 Phase 4] 목표 탭 노션급 데이터 관리 & 인지순행 IA

> **문서 ID**: PLAN-TASK-UIUX-PHASE4-GOALS  
> **요구사항 연계**: [REQ-TASK-UIUX-PHASE4-GOALS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-PHASE4-GOALS.md)  
> **티켓 연계**: #TASK-UIUX-PHASE4-GOALS  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 목표 탭 노션급 데이터 관리 & 인지순행 IA 8대 과업(#UIUX-33 ~ #UIUX-40) 구현.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 8대 과업 전용 스타일 컴포넌트(Sticky 서브탭바, 인지순행 목표입력기, 위계 카드, DND 핸들, 상세 드로어, 루틴 매트릭스, 40px 통계 버튼).
  - `js/tabs/goals/index.js`: 목표 메가블록 도킹 및 5대 서브탭 전환 제어.
  - `js/tabs/goals/sub-personal.js`: 개인 목표 뷰 및 인지순행 추가 연동.
  - `js/tabs/goals/sub-routine.js`: 루틴 매트릭스 그리드 뷰 연동.
  - `js/tabs/goals/sub-team.js`: 팀 목표 허브 연동.
  - `index.html`: 목표 탭 상단 Sticky 서브탭 마크업 및 핸들러 배선.
  - `reports/TASK-UIUX-PHASE4-GOALS/claims.json`: 법정 판정 청구용 주장 파일.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 복잡한 폼 입력을 인지순행 1줄 텍스트 + 스마트 태그 칩으로 전환하고, 5대 서브탭을 Sticky로 고정하여 탐색 마찰 제로화.
- **[원인] (Technical Causes)**: 목표 관리 UI의 상하 스크롤 탐색 단절 및 입력 시 인지 역행.
- **[중심 배선] (Core Wire & State)**:
  - `state.goals`: 목표 객체 컬렉션 (id, title, category, progress, milestones, order).
  - `state.routines`: 루틴 객체 컬렉션 (id, title, days, streaks).
- **[핵심 안전장치] (Critical Safety & Persistence)**: Local-First `state` 즉시 갱신 + Supabase 비동기 upsert + 4대 뷰 동시 전파.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[목표 탭 진입] -> [Sticky 서브탭 스위칭] -> [인지순행 1줄 목표 생성] -> [state.goals 갱신] -> [4대 뷰 전파] -> [햅틱 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | Phase 4 목표 전용 컴포넌트 스타일 | +150줄 | 0줄 | +150줄 | CSS 토큰 준수 |
| `index.html` | Sticky 서브탭 마크업 & 직통 핸들러 배선 | +100줄 | -10줄 | +90줄 | 외과수술적 diff |
| `js/tabs/goals/index.js` | 서브탭 스위칭 및 메가블록 도킹 배선 | +15줄 | -2줄 | +13줄 | 세포분열 (<800줄) |
| `js/tabs/goals/sub-personal.js` | 인지순행 목표추가 및 DND 배선 | +20줄 | 0줄 | +20줄 | 세포분열 (<800줄) |
| `js/tabs/goals/sub-routine.js` | 루틴 요일별 매트릭스 그리드 배선 | +20줄 | 0줄 | +20줄 | 세포분열 (<800줄) |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업**: 접근성 버튼 `<button id="btnGoalsSubPersonal" ...>`
2. **이벤트 리스너**: `onclick="switchGoalsSubTab('personal')"`
3. **비즈니스 로직**: 실제 뷰 슬롯 표시 및 렌더러 호출 (`renderGoalsPersonalView()`)
4. **피드백**: 활성 탭 밑줄 인디케이터 이동 및 12ms 햅틱

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 목표 목록(`state.goals`) 및 루틴(`state.routines`) 100% 무손실 보존
- [x] 모듈러 파일 라인 수 800줄 이하 엄수 (헌법 제3조 제9항)
- [x] 전수 900+개 버튼 핸들러 누락 제로 (Zero Dead-Click 보증)
- [x] 기존 3대 본질(E1, E2, E3) 루프 무손상 확인

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: Supabase goals/routines 테이블 및 로컬 스토리지 호환성 검증
2. **Step 2 (비즈니스 로직 & 핸들러)**: 인지순행 목표추가, DND 핸들러, 드로어 제어 함수 구현
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**: `ui.css` 컴포넌트 스타일링 및 `index.html` Sticky 서브탭 배치
4. **Step 4 (4위 1체 이벤트 배선)**: 5대 서브탭 버튼 및 스마트 태그 칩 핸들러 연결
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 목표 추가/수정 시 `dispatchFullViewPropagation` 호출 배선

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 5대 서브탭 칩, 1줄 목표 추가 버튼, 4종 추천 태그 칩, 통계 기간 3종 버튼 클릭 시뮬레이션 -> 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 목표/루틴 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인
- **시나리오 D (Full State Propagation)**: 목표 추가 시 홈, 목표, 일정, 기록 4대 뷰 동시 즉각 렌더링 확인
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 모듈러 조선소 아키텍처 검증: `node scripts/test-shipyard-modular.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 심사 청구] GitHub PR 생성 및 법정 심사 청구 완료

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 목표 서브탭 스위칭 시 기존 렌더러와 충돌 가능성.
- **사전 방어 및 우회 로직**: 기존 뷰 컨테이너의 visibility를 토글하는 비파괴 점진 방식 적용.
- **롤백 계획 (Rollback Strategy)**: 변경 브랜치에서 문제 발생 시 `git reset --hard HEAD` 및 메인 브랜치 기준 안전 롤백.
- **재검증 트리거**: 5대 검증 게이트 중 1건이라도 실패 시 3단계 해결방식으로 복귀하여 재설계.
