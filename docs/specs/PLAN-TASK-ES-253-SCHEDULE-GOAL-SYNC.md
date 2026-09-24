# 엔지니어링 작업계획서 (PLAN) — 일정 체크 토글 및 목표 양방향 연동 UI/UX 완결

> **문서 ID**: PLAN-TASK-ES-253-SCHEDULE-GOAL-SYNC  
> **요구사항 연계**: [REQ-TASK-ES-253-SCHEDULE-GOAL-SYNC](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-253-SCHEDULE-GOAL-SYNC.md)  
> **티켓 연계**: #TASK-ES-253  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 캘린더 일정 체크 토글 시 연계된 목표의 세부할일(`t.done`) 및 마일스톤(`m.status`)을 실시간 동기화하고, 모달 내 목표/세부할일 동적 선택 UI/UX와 4대 뷰 원자적 전파를 완결한다.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `openCalendarManualEditModal` UI 확장, `toggleScheduleDone` 양방향 동기화, `applyScheduleUpdate` 연동, 목표 탭 `[data-taskcheck]` 연동
  - `ui.css`: `.sched-check`, `.sched-goal-badge` 시각 스타일
  - `tests/schedule-goal-sync.test.js`: 양방향 동기화 단위 검증
  - `scripts/smoke-test.js`: 스모크 테스트 단언문 추가
  - `docs/rules/TICKETS.md`: 티켓 상태 추적

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 실천(일정 완료)이 인생 목표의 마일스톤 게이지 전진으로 직결되는 E1 축 RPG 즉각 체감 파이프라인.
- **[원인] (Technical Causes)**: 기존 `toggleScheduleDone`이 일정 ID만 토글하고 `linkedTaskId`/`linkedGoalId` 조건문이 정밀하지 못했으며, 목표 탭 렌더러가 활성 탭 조건문(`state.activeTab === 'goals'`) 뒤에 숨어 뷰 간 고립이 발생했던 원인.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.customSchedules`: `linkedGoalId`, `linkedGoalTitle`, `linkedMsId`, `linkedTaskId`, `linkedTaskTitle`
  - `state.profile.goals`: `milestones[].status`, `milestones[].tasks[].done`
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `saveLocalSettings` 및 `saveProfile()`로 로컬/원격 원장 영속화
  - 4대 뷰 무조건 원자적 동시 전파 (`renderCalendarScreen`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`)
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[일정 체크 클릭] -> [sched.done 토글] -> [연계 task/ms 상태 갱신] -> [12ms 햅틱 + 10 EXP] -> [원격/로컬 프로필 저장] -> [4대 뷰 원자적 동시 리렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 모달 subtask selector, toggleScheduleDone 고도화 | +120줄 | -40줄 | +80줄 | 외과수술적 diff |
| `ui.css` | 뱃지 및 체크박스 고도화 스타일 | +10줄 | 0줄 | +10줄 | CSS 토큰 준수 |
| `tests/schedule-goal-sync.test.js` | 신규 단위 테스트 | +130줄 | 0줄 | +130줄 | 모듈화 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 | +25줄 | 0줄 | +25줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#calEditLinkedSubtaskField`, `#calEditLinkedSubtask`, `[data-detailtogglesched]`
2. **이벤트 리스너 (Listener)**: `#calEditLinkedGoal` 변경 시 동적 옵션 생성, 서브태스크 선택 시 제목 자동 제안, 체크 클릭 리스너
3. **비즈니스 로직 (Logic)**: `toggleScheduleDone` 양방향 동기화, `applyScheduleUpdate` 외래키 배선, 마일스톤 자동 달성 계산
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱, +10 EXP 지급, 토스트 피드백

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: `customSchedules` 객체에 `linkedGoalId`, `linkedGoalTitle`, `linkedMsId`, `linkedTaskId`, `linkedTaskTitle` 필드 정규화
2. **Step 2 (비즈니스 로직 & 핸들러)**: `toggleScheduleDone` 내 양방향 동기화, 마일스톤 자동 완료/롤백 로직 구현
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**: `openCalendarManualEditModal` 내 동적 서브태스크 셀렉터 및 제목 자동완성 탑재
4. **Step 4 (4위 1체 이벤트 배선)**: 12ms 햅틱(`triggerHapticFeedback(12)`), +10 EXP 지급(`awardXP(10, ...)`), 토스트 피드백
5. **Step 5 (4대 뷰 실시간 동시 전파)**: `renderCalendarScreen()`, `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()` 무조건 호출 배선

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 신규 `#calEditLinkedSubtask` 변경 및 일정 체크 클릭 시뮬레이션 -> 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 목표/일정 완료 토글 후 저장 및 리로드 시뮬레이션 -> 100% 무손실 영속화 대조
- **시나리오 C (Zero UX Regression)**: 목표 탭에서 태스크 체크 시 캘린더 일정 동기화 및 E1 루프 손상 여부 확인
- **시나리오 D (Full State Propagation)**: 일정 완료 즉시 캘린더, 목표(달성률 게이지), 홈(오늘 달성률), 기록 탭 동시 즉각 렌더링 확인
- **시나리오 E (자동화 게이트 통과)**: `tests/schedule-goal-sync.test.js`, `scripts/smoke-test.js` 371개 ALL PASS

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 무결성 게이트 검증: `tests/schedule-goal-sync.test.js` PASS
- [x] 스모크 테스트 전수 검증: `npm test` PASS
- [x] 법정 사전 점검: `node court/judge.js --quick` PASS
- [x] 초안 PR 생성 및 GitHub Court 판정 확보 후 상민님께 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 사용자가 목표명이나 할일명을 사후에 변경하여 제목 기반 매핑이 깨지는 경우
- **사전 방어 및 우회 로직**: 제목뿐만 아니라 불변 고유 ID(`linkedTaskId`, `linkedMsId`, `linkedGoalId`)를 우선 매핑하여 이름 변경에도 100% 연동 유지
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout`으로 외과수술적 diff를 격리하고 원장 데이터 손실 없이 복원
- **재검증 트리거**: 연계 토글 누락 발견 시 2번 중심 배선 및 5번 비즈니스 로직 단계로 복귀하여 재점검
