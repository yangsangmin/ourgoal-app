# 엔지니어링 작업계획서 (PLAN) — #TASK-ES-198 캘린더/일정 탭 6대 결함 전수 일괄 정상화

> **문서 ID**: PLAN-TASK-ES-198-CALENDAR-FULL-FIX  
> **요구사항 연계**: [REQ-TASK-ES-198-CALENDAR-FULL-FIX](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-198-CALENDAR-FULL-FIX.md)  
> **티켓 연계**: #TASK-ES-198  
> **작성 일시**: 2026-09-20  
> **작성자**: Session 11fcefcf  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 캘린더/일정 탭 6대 결함(주간 크래시, 타임라인 수정 미반영, AI 등록 및 잠금화면 은폐, 팀 목표 토글 미구현, 배경사진 모달 복귀 단절)을 일괄 전수 정상화.
- **영향 받는 파일 목록 전수**:
  - `js/sanctuary-v3-engine.js`: 주간 뷰 그리드 및 상세 렌더러 복원, `openScheduleDetail` 인자 교정, 상단 잠금화면 퀵액션 바 배선.
  - `ui.css`: 타임라인 모드 내 `calAgentCard` 및 `cal-quick-bar` 가시성 허용 규칙 정돈.
  - `index.html`: `calendarItemsByDate` 팀 목표 ID 보강, `toggleScheduleDone` 내 `team_goal` 분기 추가, `data-hubedit` 팀 목표 연결, 배경사진 모달 뒤로가기 링크 배선.
  - `sw.js`: PWA 캐시 네임 당일 최신화 (`ourgoal-shell-v20260920-task-es198-cal-full-fix`).
  - `scripts/verify-integrity-gate.js`: [검증 22/22] 캘린더 6대 결함 정적 방화벽 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 캘린더 엔진의 데이터 어댑터(`calendarItemsByDate`)와 뷰 계층(`sanctuary-v3-engine.js`), 모달 계층(`openCalendarManualEditModal`, `openCalendarDayEditHubModal`), 액션 디스패처(`toggleScheduleDone`) 간 4위 1체 데이터 인터페이스 무결성 확립.
- **[원인] (Technical Causes)**:
  - 템플릿 변수 바인딩 불일치 (`weekDays` vs `weekRowsHtml`, 미정의 `dayDetails`).
  - 모달 호출 인자 순서 불일치 (`dt, schedId, kind, found` vs `(selectedDate, eventItem, kind, draft)`).
  - 조건부 CSS의 광범위한 `display: none !important;` 오버라이드.
  - 액션 디스패처 내 `kind === 'team_goal'` 처리 분기 부재.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.customSchedules`: 커스텀 일정 원본 배열 유지 및 필드 갱신.
  - `state.profile.settings.teamGoalDoneEvents`: 팀 목표 마일스톤 완료 상태 로컬 영속화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 원장 수정 즉시 `saveProfile()` 및 4대 뷰 동시 전파.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[타임라인 일정 클릭] -> [openScheduleDetail] -> [openCalendarManualEditModal(dt, editEvent, kind)] -> [사용자 수정 후 저장] -> [eventItem 필드 갱신] -> [saveProfile] -> [4대 뷰 리렌더링] -> [토스트 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/sanctuary-v3-engine.js` | 주간 뷰 복원, 수정 인자 교정, 잠금화면 바 | +40줄 | -10줄 | +30줄 | 외과수술적 diff |
| `ui.css` | 타임라인 모드 퀵바/AI 카드 가시성 허용 | +5줄 | -2줄 | +3줄 | CSS 토큰 준수 |
| `index.html` | 팀목표 토글/수정 배선, 배경사진 뒤로가기 | +35줄 | -5줄 | +30줄 | 외과수술적 diff |
| `sw.js` | 캐시 네임 갱신 | +1줄 | -1줄 | 0줄 | 캐시 무효화 |
| `scripts/verify-integrity-gate.js` | [검증 22/22] 정적 방화벽 배선 | +28줄 | 0줄 | +28줄 | 검증 단언 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `.s-week-grid`, `.s-cal-quick-action-bar`, `#calDayBgBackToHubBtn` 고유 요소 배치.
2. **이벤트 리스너 (Listener)**: 주간 일자 클릭, 타임라인 수정 클릭, 뒤로가기 클릭 바인딩.
3. **비즈니스 로직 (Logic)**: `window.OurgoalSanctuaryV3.openScheduleDetail`, `toggleScheduleDone`, `openCalendarDayEditHubModal` 실제 함수 호출.
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동, 토스트 안내, 모달 간 즉각 전환.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (주간 모드 크래시 해결)**: `js/sanctuary-v3-engine.js` 내 `weekRowsHtml` 삽입 및 `dayDetailsHtml` 계산 렌더링.
2. **Step 2 (타임라인 수정 Zero-Save 버그 교정)**: `js/sanctuary-v3-engine.js` `openScheduleDetail`에서 `openCalendarManualEditModal(dt, editEvent || null, kind || 'custom')` 전달.
3. **Step 3 (잠금화면 바로가기 배선)**: `js/sanctuary-v3-engine.js` 상단 헤더에 `s-cal-quick-action-bar` 추가.
4. **Step 4 (CSS 가시성 조정)**: `ui.css` 타임라인 모드 내 `calAgentCard` 및 `cal-quick-bar` 숨김 해제.
5. **Step 5 (팀 목표 마일스톤 토글/수정)**: `index.html` `calendarItemsByDate`, `toggleScheduleDone`, `data-hubedit` 배선.
6. **Step 6 (배경사진 모달 복귀 플로우)**: `index.html` `openCalendarDayBgPickerModal` 상단 뒤로가기 링크 및 복귀 배선.
7. **Step 7 (캐시 및 게이트 갱신)**: `sw.js` 및 `scripts/verify-integrity-gate.js` 결속.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 주간 탭, 타임라인 일정 카드, 폰 잠금화면 버튼, 허브 체크박스 클릭 시 크래시 없이 반응.
- **시나리오 B (Zero Data-Loss)**: 타임라인에서 일정 제목 수정 후 저장 시 `state.profile.settings.customSchedules` 원본 항목의 `title`이 즉시 갱신됨을 확인.
- **시나리오 C (4대 뷰 동시 전파)**: 일정 완료 토글 시 홈, 기록, 통계, 캘린더에 실시간 상태 반영 확인.
- **시나리오 D (테마 일관성)**: 4대 테마 전환 시 캘린더 슬롯 가시성 유지 확인.
- **시나리오 E (플로우 무결성)**: 배경사진 선택 모달에서 취소/저장/뒤로가기 시 허브 모달로 매끄럽게 복귀 확인.

---

## 7. [원칙 ⑦] 완전한 실행 (Flawless Execution)
- 설계된 모든 diff가 누락 없이 적용되었으며 가짜 구현(mock, stub) 0건임을 확인.
- `js/sanctuary-v3-engine.js`, `ui.css`, `index.html`, `sw.js`, `scripts/verify-integrity-gate.js` 정합성 완비.

---

## 8. [원칙 ⑧] 최종 검증 및 팩트 보고 (Verification & Fact Reporting)
- `node scripts/verify-integrity-gate.js` 실행 -> 22대 게이트 전수 통과.
- `npm test` 실행 -> 335+ 테스트 전수 통과.
- Chrome CDP 375px 모바일 실측 스크린샷 캡처 (주간 모드, 타임라인 수정 반영, AI 등록 & 잠금화면).
- 4-Block 양식에 입각한 정직하고 투명한 팩트 보고서 작성.
