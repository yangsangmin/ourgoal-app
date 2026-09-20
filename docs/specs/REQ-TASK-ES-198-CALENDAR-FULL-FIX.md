# 요구사항 정의서 (REQ) — #TASK-ES-198 캘린더/일정 탭 6대 결함 전수 일괄 정상화

> **문서 ID**: REQ-TASK-ES-198-CALENDAR-FULL-FIX  
> **티켓 연계**: #TASK-ES-198  
> **작성 일시**: 2026-09-20  
> **작성자**: Session 11fcefcf  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "일정 제대로 작동 안하는 것들 모두 찾아서 보고해" -> 정밀 감찰 보고서 제출 -> "진행" 직접 지시.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 주간(Week) 모드 탭 전환 시 `ReferenceError: weekDays is not defined` 및 `dayDetails is not defined`가 발생하여 런타임 크래시 발생.
  2. 일간 타임라인 모드에서 일정 수정 모달을 열고 수정한 뒤 저장해도 원본 일정 데이터가 전혀 갱신되지 않는 Zero-Save 버그 발생.
  3. AI로 일정 등록 카드(#calAgentCard) 및 폰 잠금화면 바로가기 버튼(#calLockScreenBtn)이 모드/테마 전환 시 은폐되어 사용자가 접근 불가.
  4. 팀 목표 마일스톤 항목의 완료 체크박스 클릭 시 반응이 없고(`toggleScheduleDone` 내 `team_goal` 분기 부재), 수정 버튼 클릭 시 연동 단절.
  5. 일자 허브 모달에서 배경사진 선택 모달 진입 후 취소/저장 시 허브 모달로 복귀하지 않고 모달 전체가 닫혀 사용자 흐름 단절.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `sanctuary-v3-engine.js`의 변수 오타, `openCalendarManualEditModal` 호출 인자 불일치, `toggleScheduleDone`의 `team_goal` 라우팅 누락.
  - **2층 (구조/프로세스 부재)**: 캘린더 다중 모드(월/주/일) 및 외부 모달 간 상태 동기화 및 복귀 파라미터 전달 프로세스 미비.
  - **3층 (시스템/유저 체감 괴리)**: 일정을 열심히 등록하고 수정했는데 반영되지 않거나 화면이 멈추어 서비스 신뢰도 실추.
- **사용자 상황 및 페르소나**: 아워골에서 자신의 목표와 연계된 일정을 월간/주간/일간으로 확인하고 관리하는 모든 능동적 실천자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E2(기록 회고) / FIX(버그·안전)
- **[본질] (Essence)**: 캘린더는 시간 축 위의 실천 궤적을 계획·확인·수정하는 핵심 공간이며, 사용자의 모든 입력과 조작이 즉시 무손실로 반영되고 언제든 중단 없이 전환되어야 한다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 주간 뷰 구현 시 `weekRowsHtml` 문자열을 선언해두고 템플릿 바인딩에서 미정의 변수 `weekDays.join('')` 및 `dayDetails`를 호출함.
  2. **원인 2**: `openScheduleDetail`에서 `openCalendarManualEditModal`의 2번째 인자(`eventItem`) 자리에 문자열 `schedId`를 전달하여 속성 수정이 무효화됨.
  3. **원인 3**: CSS 조건부 가시성 규칙에서 타임라인 모드 진입 시 퀵바와 AI 카드를 일괄 숨겼고, 팀 목표 항목은 캘린더 이벤트 어댑터에서 고유 ID가 누락됨.
- **[중심] (Core Bottleneck & Anchor)**: `sanctuary-v3-engine.js`와 `index.html` 캘린더 모달 엔진 간의 함수 시그니처 및 이벤트 상태 1:1 완벽 직결.
- **[핵심] (Critical Safety & Termination)**: 원본 `customSchedules` 및 `teamGoalDoneEvents` 원장 무손실 보존과 4대 뷰 동시 전파.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 캘린더에서 월간/주간/일간을 자유롭게 넘나들며, 일정을 클릭해 수정하거나 완료를 체크했을 때 즉각 반영되고, AI 등록과 잠금화면 연동을 언제든 편리하게 활용할 수 있어 일정 관리의 완벽한 통제감을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 게스트 및 소셜 세션 무손실 유지.
  - 홈 화면 및 스트릭: 일정 완료 토글 시 스트릭 및 4대 뷰 동시 전파 정상 유지.
  - 기록/통계/캘린더 탭: 기존 데이터 100% 무손실 보존.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 캘린더 디자인 갈아엎기 금지, 불필요한 서드파티 라이브러리 추가 금지, 모달 구조 중복 신설 금지.
- **해야 할 것 (Action)**: 외과수술적 인자 교정, `weekRowsHtml` 및 `dayDetailsHtml` 바인딩 복원, `team_goal` 라우팅 분기 추가, 복귀 플로우 보존.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 기존에 수백 차례 검증된 모달 시스템(`openCalendarManualEditModal`, `openCalendarDayEditHubModal`)의 인터페이스 규격을 정확히 준수하여 회귀 위험 없이 100% 정상화할 수 있는 가장 안전하고 확실한 길이기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `localStorage` (`customSchedules`, `ourgoal_team_goal_done_events`, `ourgoal_cal_day_bg_*`) 원장화.
- **2호 (스마트 스토리지 분기 설계)**: 배경사진 2장 상하 분할 압축 인코딩 및 메타데이터 보존.
- **3호 (4대 뷰 전파 배선도)**: 일정 수정/삭제/완료 시 `renderCalendarScreen`, `renderHome`, `renderRecordsScreen`, `renderStatsScreen` 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `s-cal-mode-btn (주간)` | 캘린더 상단 | 클릭 | 주간 모드로 전환, 주간 7일 행 및 선택일 상세 표출 | 크래시 없이 즉시 렌더링 |
| `s-t-block` | 일간 타임라인 | 클릭 | `openCalendarManualEditModal`에 `editEvent` 객체 전달 오픈 | 기존 제목/시간 완벽 노출 |
| `calEditSaveBtn` | 일정 편집 모달 | 클릭 | 제목/시간/메모/알림 원본 객체 갱신 및 저장 | 성공 토스트 + 4대 뷰 전파 |
| `calLockScreenBtn` | 캘린더 상단 헤더 | 클릭 | `openCalendarLockScreenModal` 팝업 오픈 | 모달 즉각 표출 |
| `data-hubtogglesched` | 일자 허브 모달 | 클릭 | 팀 목표 마일스톤 포함 완료 상태 토글 | 햅틱 피드백 + XP 부여 |
| `calDayBgBackToHubBtn` | 배경사진 모달 | 클릭 | `openCalendarDayEditHubModal`로 복귀 | 허브 모달 원활 전환 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 320종 아바타 및 페르소나 100% 불변 보존.
- **목표 데이터 보존**: 개인/팀 목표, 마일스톤, 태스크 100% 보존.
- **기록 데이터 보존**: 체크인 및 사진형 일기 연동 100% 보존.
- **화면 구성 세팅값 보존**: 테마 및 캘린더 선택 일자 불변 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타, 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `js/sanctuary-v3-engine.js` 주간 모드 `weekRowsHtml` 및 `dayDetailsHtml` 바인딩 복원.
2. **Step 2**: `js/sanctuary-v3-engine.js` `openScheduleDetail` 함수 인자 교정 (`dt, editEvent, kind`).
3. **Step 3**: `js/sanctuary-v3-engine.js` 상단 헤더에 잠금화면 퀵버튼(`s-cal-quick-action-bar`) 배선.
4. **Step 4**: `ui.css` 타임라인 모드 내 `calAgentCard` 및 `cal-quick-bar` 가시성 허용.
5. **Step 5**: `index.html` `calendarItemsByDate` 팀 목표 ID 보강 및 `toggleScheduleDone` `team_goal` 분기 추가.
6. **Step 6**: `index.html` `openCalendarDayBgPickerModal` 상단 뒤로가기 링크 및 복귀 배선.
7. **Step 7**: `sw.js` 최신 캐시 네임 갱신.
8. **Step 8**: `scripts/verify-integrity-gate.js` [검증 22/22] 결속 및 `npm test` 통과.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 주간 탭, 타임라인 일정 카드, 잠금화면 버튼, 허브 체크박스, 배경사진 뒤로가기 전수 클릭 -> 콘솔 에러 0건.
- **시나리오 B (Zero Data-Loss)**: 타임라인에서 일정 제목 수정 후 저장 시 `state.profile.settings.customSchedules` 원본 항목의 `title`이 즉시 갱신됨을 확인.
- **시나리오 C (4대 뷰 동시 전파)**: 일정 완료 토글 시 홈, 기록, 통계, 캘린더에 실시간 상태 반영 확인.
- **시나리오 D (테마 일관성)**: 4대 테마 전환 시 캘린더 및 AI 카드, 잠금화면 버튼 정상 렌더링 확인.
- **시나리오 E (플로우 무결성)**: 허브 모달 -> 배경사진 선택 -> 취소/저장/뒤로가기 시 허브 모달로 매끄럽게 복귀 확인.

---

## 7. [원칙 ⑦] 완전한 실행 (Flawless Execution)
- 외과수술적 diff를 통한 `js/sanctuary-v3-engine.js`, `ui.css`, `index.html`, `sw.js`, `scripts/verify-integrity-gate.js` 변경 완결.
- 가짜 코드(mock, console.log stub) 0건, 실제 비즈니스 로직 100% 구현.

---

## 8. [원칙 ⑧] 최종 검증 및 팩트 보고 (Verification & Fact Reporting)
- `node scripts/verify-integrity-gate.js` 22대 게이트 전수 통과 (38+ ALL PASS).
- `npm test` 335+ 테스트 전수 통과.
- Chrome CDP 375px 모바일 실측 스크린샷 캡처 및 아티팩트 보관.
- 4-Block 양식에 입각한 정직하고 투명한 팩트 보고서 제출.
