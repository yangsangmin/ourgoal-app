# 엔지니어링 작업계획서 (PLAN) — [UI/UX 틀 개편 Phase 5] 기록 회고 피로 해소 & 캘린더 공간 융합

> **문서 ID**: PLAN-TASK-UIUX-PHASE5-RECORDS-CALENDAR  
> **요구사항 연계**: [REQ-TASK-UIUX-PHASE5-RECORDS-CALENDAR](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-PHASE5-RECORDS-CALENDAR.md)  
> **티켓 연계**: #TASK-UIUX-PHASE5-RECORDS-CALENDAR  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 기록 회고 피로 해소 & 캘린더 공간 융합 8대 과업(#UIUX-41 ~ #UIUX-48) 완비.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 최신 3건 피드 카드, 융합 스위처, 76px 와이드 캘린더 셀, 2장 분할 사진일기 썸네일 컴포넌트 스타일.
  - `index.html`: 기록/캘린더 융합 스위처 마크업, 최신 3건 뷰, 스톱워치 퀵바 및 전역 핸들러 배선.
  - `js/tabs/records/` & `js/tabs/calendar/`: 모듈러 소블록 연동 및 800줄 이하 엄수.
  - `reports/TASK-UIUX-PHASE5-RECORDS-CALENDAR/claims.json`: 법정 판정 청구용 주장 파일.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 끝없는 스크롤을 최신 3건으로 압축하고, 달력과 기록을 1개의 유기적 공간으로 결합하여 회고 동선 단축.
- **[원인] (Technical Causes)**: 기록 타임라인과 캘린더의 공간적 분리로 인한 잦은 탭 전환 및 피로도 누적.
- **[중심 배선] (Core Wire & State)**:
  - `state.records`: 체크인 및 회고 기록 컬렉션.
  - `state.calendar`: 캘린더 일자별 이벤트 및 사진일기 데이터.
- **[핵심 안전장치] (Critical Safety & Persistence)**: Local-First `state` 보존 + 비동기 원격 I/O + 4대 뷰 동시 전파.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[기록 탭 진입] -> [최신 3건 요약 조망] -> [공간 융합 스위처 클릭] -> [인라인 캘린더/아카이브 확장] -> [12ms 햅틱]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | Phase 5 컴포넌트 스타일링 | +160줄 | 0줄 | +160줄 | CSS 토큰 준수 |
| `index.html` | 융합 스위처 마크업 & 직통 핸들러 배선 | +110줄 | -10줄 | +100줄 | 외과수술적 diff |
| `js/tabs/records/` | 기록 메가블록 도킹 연동 | +10줄 | 0줄 | +10줄 | 세포분열 (<800줄) |
| `js/tabs/calendar/` | 캘린더 메가블록 도킹 연동 | +10줄 | 0줄 | +10줄 | 세포분열 (<800줄) |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업**: 고유 ID 및 접근성 태그 `<button id="btnRecViewSwitchCalendar" ...>`
2. **이벤트 리스너**: `onclick="switchRecFusionMode('calendar')"`
3. **비즈니스 로직**: 실제 캘린더 슬롯 표시 및 렌더러 호출 (`renderCalendarScreen()`)
4. **피드백**: 활성 칩 전환 및 12ms 햅틱

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 기록 목록(`state.records`) 및 캘린더 데이터 100% 무손실 보존
- [x] 모듈러 파일 라인 수 800줄 이하 엄수 (헌법 제3조 제9항)
- [x] 전수 910+개 버튼 핸들러 누락 제로 (Zero Dead-Click 보증)
- [x] showToast 호출 0건 엄수 (오직 toast()만 사용)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: Supabase records 테이블 및 로컬 스토리지 호환성 검증
2. **Step 2 (비즈니스 로직 & 핸들러)**: 공간 융합 스위칭, 최신 3건 슬라이싱, 스톱워치 퀵 체크인 함수 구현
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**: `ui.css` 컴포넌트 스타일링 및 `index.html` 융합 스위처 배치
4. **Step 4 (4위 1체 이벤트 배선)**: 스위처 버튼 및 스톱워치 버튼 전수 핸들러 연결
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 기록 생성/수정 시 `dispatchFullViewPropagation` 호출 배선

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 융합 스위처 2종 버튼, 아카이브 토글 버튼, 스톱워치 가동/저장 버튼 클릭 시뮬레이션 -> 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 기록 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인
- **시나리오 D (Full State Propagation)**: 기록 추가 시 홈, 목표, 일정, 기록 4대 뷰 동시 즉각 렌더링 확인
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 모듈러 조선소 아키텍처 검증: `node scripts/test-shipyard-modular.js` PASS
- [ ] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` PASS
- [ ] [4단계: 심사 청구] GitHub PR 생성 및 법정 심사 청구 완료

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 기록 탭 내에서 캘린더 인라인 호출 시 날짜 셀렉터 충돌 가능성.
- **사전 방어 및 우회 로직**: 기존 캘린더 DOM 슬롯을 분리된 인라인 컨테이너로 안전하게 감싸서 호출.
- **롤백 계획 (Rollback Strategy)**: 변경 브랜치에서 문제 발생 시 `git reset --hard HEAD` 및 메인 브랜치 기준 안전 롤백.
- **재검증 트리거**: 5대 검증 게이트 중 1건이라도 불합격 시 원칙 ③(효과적 해결방식)으로 돌아가 설계 재검토.
