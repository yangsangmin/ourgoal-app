# 엔지니어링 작업계획서 (PLAN) — 일정 탭(screen-calendar) 토스(Toss)식 UI/UX 전면 혁신

> **문서 ID**: PLAN-TASK-ES-214-CALENDAR-TOSS-INNOVATION  
> **요구사항 연계**: [REQ-TASK-ES-214-CALENDAR-TOSS-INNOVATION](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-214-CALENDAR-TOSS-INNOVATION.md)  
> **티켓 연계**: #TASK-ES-214  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity (Toss Head of UI/UX Pair)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  일정 탭(`screen-calendar`) 내 상단 가이드 배너와 퀵바의 시각적 분산을 정돈하고, "오늘의 타임라인 원카드(`.toss-calendar-hero-card`)" 중심의 1화면 1목적 구조와 1터치 쾌속 체크 및 12ms 미세 햅틱 피드백을 도입하여 엄지 영역 중심의 직관적 토스식 모바일 경험을 확립한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-214 티켓 상태 갱신
  - `docs/specs/REQ-TASK-ES-214-CALENDAR-TOSS-INNOVATION.md`: 요구사항 정의서 (기작성)
  - `docs/specs/PLAN-TASK-ES-214-CALENDAR-TOSS-INNOVATION.md`: 본 엔지니어링 작업계획서
  - `reports/TASK-ES-214/claims.json`: GitHub 법정 검증 청구서
  - `ui.css`: 토스 일정 전용 스타일 컴포넌트 (`.toss-calendar-hero-card`, `.toss-timeline-card`, 모바일 375px 여백 및 42~44px 터치 타깃 튜닝)
  - `index.html`: `#screen-calendar` 내부 조형 고도화, `renderCalDayDetail()` 내 원카드 레이아웃 및 12ms 미세 햅틱(`triggerHapticFeedback(12)`) 연동, 38대 헌법 DOM ID 100% 보존
  - `scripts/verify-integrity-gate.js`: 회귀 및 8원칙 린터 정적 검증
  - `dev_log.md`: 개발 로그 기록

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 일정 탭의 기술적 본질은 유저가 지정한 날짜 또는 오늘의 일정을 가장 선명한 단일 원카드로 제시하고, 1터치로 일정 완료를 토글(`toggleScheduleDone`)하여 로컬 상태 및 Supabase에 원장화하고, 12ms 햅틱과 함께 홈/기록/통계/목표 4대 뷰로 즉각 상태를 동기화하는 **"시간 자산 관리 및 실행 엔진(E1 Axis)"**이다.
- **[원인] (Technical Causes)**:
  - 사진일기장 가이드 배너, 잠금화면 실시간 연동 버튼, AI 일정 어시스턴트, 날짜 네비게이션이 분산되어 화면 상단 공간을 지나치게 차지하고, 일정 완료 시 즉각적인 12ms 햅틱 인터랙션이 누락된 것이 기저 원인이다.
- **[중심 배선] (Core Wire & State)**:
  - `state.calSelectedDate`: 선택된 날짜 바인딩 및 타임라인 원카드 동적 리렌더링
  - `[data-togglesched]`: 일정 완료 토글 시 `triggerHapticFeedback(12)` -> `toggleScheduleDone()` -> `dispatchFullViewPropagation()` 배선
  - `calHeadlineSentence`: 선택된 일자의 일정 개수에 따라 문장형 헤드라인 실시간 갱신
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 777개 정적 버튼 dead-click 린터 및 38대 헌법 방화벽 셀렉터(`#calGrid`, `#calDayDetail`, `#calViewToggle`, `#calPrevBtn`, `#calNextBtn`, `#calTodayBtn`, `#calLockScreenBtn`, `#calAgentCard`, `#calPrivacyBadge`, `#sanctuaryCalendarView` 등) 100% 불변 보존.
  - 달력 셀 76px 및 사진 배경(TASK-ES-197, TASK-ES-198) 규격 100% 준수.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[일정 1터치 완료 토글] -> [triggerHapticFeedback(12)] -> [toggleScheduleDone()] -> [Supabase DB 원격 동기화] -> [dispatchFullViewPropagation(캘린더/홈/목표/기록/통계)] -> [타임라인 완료 전환 및 달력 인디케이터 실시간 점등]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 토스 일정 타임라인 원카드 스타일링 | +100줄 | 0줄 | +100줄 | CSS 토큰 준수 |
| `index.html` | 타임라인 원카드 렌더링 및 12ms 햅틱 배선 | +50줄 | -10줄 | +40줄 | 외과수술적 diff |
| `docs/specs/PLAN-TASK-ES-214-CALENDAR-TOSS-INNOVATION.md` | 정본 엔지니어링 작업계획서 | +180줄 | 0줄 | +180줄 | 정본 스펙 |
| `reports/TASK-ES-214/claims.json` | 법정 검증 청구서 | +90줄 | 0줄 | +90줄 | 검증 명세 |
| `docs/rules/TICKETS.md` | 티켓 상태 갱신 | +5줄 | -1줄 | +4줄 | 규칙 관리 |

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase 테이블(`profiles`, `goals`, `app_settings`) DDL 변경 0건 (100% 하위 호환 보장).
- **2호 (스마트 스토리지 분기 설계)**:
  - 사진 배경 에셋 및 일정 데이터는 기존 3계층(Supabase DB / IndexedDB / localStorage 메타) 캐시 파이프라인 유지.
- **3호 (4대 뷰 전파 배선도)**:
  - 일정 상태 갱신 시 `dispatchFullViewPropagation()` 호출을 통해:
    1. `renderCalendarScreen()`: 달력 셀 및 타임라인 원카드 즉시 갱신
    2. `renderHome()`: 오늘의 원카드 및 당일 일정 동기화
    3. `renderRecordsScreen()`: 실천 기록 피드 동기화
    4. `renderStatsScreen()`: 히트맵 당일 성취 셀 즉시 점등

### 3-2. 시각적 IA 및 시맨틱 통합 배선도 명세 (헌법 제2조 제6항 준수)
- **1호 (상하 위계 및 서브뷰 공존 설계)**:
  - **[Zone 1: 상단 헤더 & 문장형 헤드라인]**: 캘린더 타이틀, 공개 배지, 구글 캘린더 미니 배지 + 대화체 문장형 헤드라인 (`#calHeadlineSentence`).
  - **[Zone 2: 슬림 네비게이션 툴바]**: 이전/오늘/다음 이동 버튼 + 월/주/일 세그먼트 토글 (`#calViewToggle`).
  - **[Zone 3: 달력 그리드 / 시간표 뷰]**: 월간 달력 그리드(`#calGrid`), 주간 그리드, 산악 트레일 슬롯.
  - **[Zone 4: 오늘의 타임라인 원카드 (`.toss-calendar-hero-card`)]**: 당일 세부 일정 리스트 (`#calDayDetail`), 1터치 완료 체크 및 12ms 햅틱.
  - **[Zone 5: 하단 스마트 독 & AI 등록]**: 폰 잠금화면 연동 바 + AI 일정 등록 카드 (`#calAgentCard`).
- **2호 (기존 기능 슬롯 1:1 이식 매핑표)**:
  - `#calHeadlineSentence` ➔ 문장형 헤드라인 슬롯 100% 보존
  - `#calGcalMiniBadgeSlot` ➔ 구글 캘린더 미니 배지 슬롯 100% 보존
  - `#calGrid` ➔ 달력 그리드 슬롯 100% 보존
  - `#calDayDetail` ➔ 당일 타임라인 원카드 슬롯 100% 보존
  - `#calAgentCard` ➔ AI 일정 등록 슬롯 100% 보존

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 일정 탭은 월간 뷰, 주간 뷰, 일간 시간표 뷰의 렌더링 로직이 복잡하게 얽혀 있음.
  - 컨테이너나 DOM ID를 무리하게 바꾸면 캘린더 날짜 클릭 이벤트나 일정 추가 모달이 오작동할 위험이 있음.
  - **보완책**: `#calDayDetail` 내부 렌더러에 토스식 원카드 래퍼를 적용하고, `[data-togglesched]` 이벤트에 12ms 햅틱을 외과수술적으로 추가하여 안정성을 100% 보증함.
- **기존 기능과의 충돌 가능성 검토**:
  - `verify-integrity-gate.js` 내의 캘린더 셀 크기(76px) 및 구글 캘린더 미니 배지 린터 통과 보장.
- **엣지 케이스 (Edge Cases)**:
  - **선택된 날짜에 일정이 없는 경우**: 깔끔한 토스식 빈 카드와 함께 "+ 새 일정 추가" 원터치 버튼 표출.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. **[단계 1 - 계획 및 티켓 동기화]**: `docs/rules/TICKETS.md` 상태 갱신.
  2. **[단계 2 - 법정 검증 청구서 수립]**: `reports/TASK-ES-214/claims.json` 작성 (일정 탭 5대 법정 청구 항목).
  3. **[단계 3 - CSS 토스 일정 토큰 배선]**: `ui.css`에 `.toss-calendar-hero-card`, `.toss-timeline-card` 등 모던 스타일 추가.
  4. **[단계 4 - 렌더러 리팩토링 및 햅틱 배선]**: `index.html` 내 `renderCalDayDetail()`에 원카드 레이아웃 및 12ms 햅틱(`triggerHapticFeedback(12)`) 연동.
  5. **[단계 5 - 기계적 무결성 전수 검증]**: 335개 테스트, 38개 헌법 게이트, 777개 정적 버튼 dead-click 전수 통과 확인.
  6. **[단계 6 - PR 생성 및 CI 통과 후 배포]**: PR 생성 및 자동 머지 완료.
- **화면 간 상호연동 전파 규격**:
  - 일정 완료 체크 시 `dispatchFullViewPropagation()` 호출 -> 달력 화면 즉시 갱신 및 홈/목표/기록/통계 동기화.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*

- **단일 실패점 (SPOF) 점검**:
  - 일정 완료 토글 시 구글 캘린더 동기화 에러가 발생할 경우를 대비하여 `try-catch` 및 논블로킹 햅틱 호출을 통해 UI 반응성 100% 유지.
- **가정의 타당성 검증**:
  - 월간/주간/일간 3개 뷰 모드 모두에서 타임라인 카드와 달력이 깨짐 없이 동작하는지 크로스 체크.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 사진일기 가이드 배너의 닫기 버튼(`#btnHideCalDiaryGuide`) 이벤트 핸들러가 재렌더링 시 중복 바인딩되지 않도록 `_bound` 플래그를 유지함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

1. 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Error).
2. 유저 데이터 무손실 검증(10종 페르소나 딥이퀄) 100% PASS.
3. `npm test` 스모크 335개 및 38개 무결성 게이트 전수 ALL PASS (0 failure).
4. `verify-all-clicks.js` 777개 정적 버튼 Zero Dead-Click 100% 통과.
5. 모바일 375px 뷰포트에서 일정 타임라인 원카드 시인성 확보.
6. 직관적 6단계 보고 체계 준수.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커 1 (시간표 슬롯 터치 이벤트 충돌)**:
  - 시간표 슬롯(`timetable-slot`) 클릭 시 일정 추가 모달과 체크박스 클릭 이벤트가 겹칠 우려.  
  ➔ **대책**: 체크박스에 `e.stopPropagation()`을 철저히 유지하여 독립 클릭 보장.
- **예상 블로커 2 (선택 날짜 변경 시 깜빡임)**:
  - 날짜 클릭 시 전체 화면이 리렌더링되어 스크롤이 튀는 현상 방지.  
  ➔ **대책**: `renderCalDayDetail`만 가볍게 갱신하여 쾌속 반응성 유지.
- **재검증 트리거**:
  - 335개 스모크 테스트 또는 38개 무결성 게이트 중 단 1개라도 실패할 경우, 즉시 수정을 중단하고 원칙 ④(재검토)로 회귀하여 셀렉터 정합성을 재검증함.
