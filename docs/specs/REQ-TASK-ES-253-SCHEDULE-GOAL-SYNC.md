# 요구사항 정의서 (REQ) — 일정 체크 토글 및 목표 양방향 연동 UI/UX 완결

> **문서 ID**: REQ-TASK-ES-253-SCHEDULE-GOAL-SYNC  
> **티켓 연계**: #TASK-ES-253  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  *"일정에서 내가 추가한 각 일정들 왼쪽의 체크버튼으로 마일스톤처럼 완료처리, 다시 누르면 미완료로 다시 바뀌게 이것들이 목표의 내용과도 연동되게(사용자가 그 일정을 목표와 연동되게 했으면) 지금 일정과 목표의 연계, 그리고 그 기능을 사용자가 편리하게 가동할 수 있는 ui/ux가 배치되어 있지 않으면 그것도 같이 구현해."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 캘린더 일정 체크 토글 시 일정 완료 상태만 변경되고 목표 화면의 마일스톤 및 세부할일 진행률이 갱신되지 않는 결함
  - 일정 추가/수정 모달에서 목표를 선택해도 하위 마일스톤이나 세부할일을 구체적으로 지정할 수 있는 UI/UX 부재
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `toggleScheduleDone`의 매핑 로직이 타이틀 일치에만 의존하여 ID 기반 양방향 연동이 불완전했음
  - **2층 (구조/프로세스 부재)**: 일정과 목표 간의 외래키(`linkedGoalId`, `linkedMsId`, `linkedTaskId`) 구조가 캘린더 모달에서 미지원
  - **3층 (시스템/유저 체감 괴리)**: 일정을 열심히 체크해도 목표 달성 게이지가 움직이지 않아 E1 루프(성취감)가 단절됨
- **사용자 상황 및 페르소나**: 일정을 통해 목표를 매일 실천하는 계획형/습관형 사용자

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E1` (체크인 루프: 실천 ➔ 인생 청사진 직결 RPG 즉각 체감)
- **[본질] (Essence)**: 실천(일정 완료)이 인생 목표의 마일스톤 게이지 전진으로 직결되는 E1 축 RPG 즉각 체감 파이프라인.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 캘린더 수동 편집 모달에 목표 하위 마일스톤/세부할일을 선택할 수 있는 셀렉터 및 배선 부재.
  2. **원인 2**: `toggleScheduleDone`에서 `linkedTaskId`/`linkedGoalId`가 누락되거나 ID 매핑이 정밀하지 못했던 점.
  3. **원인 3**: 캘린더에서 체크 시 4대 뷰 원자적 전파가 누락되어 목표 화면 전환 전까지 데이터가 미동기화되었던 점.
- **[중심] (Core Bottleneck & Anchor)**: 일정 체크 토글 시 연계된 목표의 세부할일(`t.done`) 및 마일스톤(`m.status`) 상태를 원자적으로 동기화하고 달성률 게이지를 즉각 전진/후퇴시키는 상태 전파 엔진.
- **[핵심] (Critical Safety & Termination)**: 원장 영속화(`saveProfile`, `saveLocalSettings`) 및 4대 뷰 무조건 원자적 동시 전파.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 캘린더에서 일정을 완료 체크했을 때, 12ms 미세 햅틱과 함께 +10 EXP를 획득하고 연계된 목표의 마일스톤 게이지가 실시간으로 차오르는 것을 보며 강한 성취감과 지속 동기를 얻는다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 영향 없음 (순수 비즈니스 로직 및 UI 연계)
  - 홈 화면 및 스트릭에 미치는 영향: 목표 달성률 갱신으로 홈 탭 진행도 동시 연동
  - 기록/통계/캘린더 탭에 미치는 영향: 4대 뷰 원자적 동시 갱신으로 실시간 무결성 보장

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 스키마를 파괴하거나 기존 일정을 초기화하는 행위 금지, 불필요한 전체 페이지 새로고침 금지
- **해야 할 것 (Action)**: 일정-목표 양방향 연동 완결, 동적 서브태스크 선택 UI 탑재, 12ms 햅틱 및 +10 EXP 보상, 4대 뷰 원자적 전파
- **왜 이 방식이어야만 하는가 (Why this approach)**: 사용자가 목표 탭과 캘린더 탭 어디서든 자유롭게 실천을 기록할 수 있어야 진정한 올인원 목표 달성 앱의 가치가 완성되기 때문.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `profiles.settings.customSchedules` JSONB 내 `linkedGoalId`, `linkedGoalTitle`, `linkedMsId`, `linkedTaskId`, `linkedTaskTitle` 필드 보존
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지(`ourgoal_profile`) 및 Supabase 원격 DB 원자적 동시 저장
- **3호 (4대 뷰 전파 배선도)**: 토글 즉시 `renderCalendarScreen()`, `renderGoalsScreen()`, `renderHome()`, `renderRecordsScreen()` 동시 호출

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-hubtogglesched]` | 일자 허브 모달 | 클릭 | `toggleScheduleDone` 호출 및 목표 상태 동기화 | 12ms 햅틱, +10 EXP 토스트 |
| `[data-togglesched]` | 일간 타임라인 | 클릭 | `toggleScheduleDone` 호출 및 목표 상태 동기화 | 12ms 햅틱, +10 EXP 토스트 |
| `[data-detailtogglesched]` | 캘린더 피드 목록 | 클릭 | `toggleScheduleDone` 호출 및 목표 상태 동기화 | 12ms 햅틱, +10 EXP 토스트 |
| `#calEditLinkedGoal` | 일정 등록/수정 모달 | 변경 | 선택된 목표의 마일스톤/세부할일 목록 동적 생성 | 미선택 시 하위 셀렉터 숨김 |
| `#calEditLinkedSubtask` | 일정 등록/수정 모달 | 변경 | 연계 세부할일 선택 및 제목 자동 제안 | 선택 시 `#calEditTitle` 자동완성 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 설정 100% 불변 보존
- **목표 데이터 보존**: 기존 목표, 마일스톤, 태스크 데이터 무손실 보존 및 상태값 동기화
- **기록 데이터 보존**: 과거 체크인 기록 및 스트릭 100% 보존
- **화면 구성 세팅값 보존**: 캘린더 뷰, 날짜 선택값 무손실 보존

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 목표에 마일스톤이나 할 일이 없는 경우에도 연동이 유연하게 작동하도록 '목표 전체 연계' 기본값을 제공함
- **기존 기능과의 충돌 가능성 검토**: 기존 구글 캘린더 일정(gcal) 및 팀 목표(team_goal) 토글 로직과 충돌 없이 custom 분기만 정밀 확장
- **엣지 케이스 (Edge Cases)**:
  - 마일스톤 내 모든 할 일이 완료되었을 때: 상위 마일스톤 `status = 'done'` 자동 전진
  - 완료된 할 일 중 하나를 미완료로 해제했을 때: 상위 마일스톤 `status = 'todo'` 자동 롤백
  - 목표가 삭제된 일정의 경우: 일반 일정으로 안전하게 fallback 동작

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. 일정 모달 내 `calEditLinkedSubtaskField` 컨테이너 및 동적 옵션 생성기 배선
  2. `toggleScheduleDone` 내 양방향 동기화 및 마일스톤 상태 계산기 구현
  3. 목표 탭 `[data-taskcheck]` 핸들러 내 캘린더 일정 역방향 동기화 구현
  4. 캘린더 뷰 내 `🎯 [목표명]` 뱃지 표출 강화
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: 일정 체크 버튼 클릭 또는 목표 할일 체크 클릭
  - 즉시 갱신되어야 할 연계 화면 목록:
    1. 홈 화면 (`renderHome`): 오늘의 목표 달성률 및 스트릭 최신화
    2. 목표 탭 (`renderGoalsScreen`): 마일스톤 진행률 바 및 할일 체크박스 최신화
    3. 캘린더 탭 (`renderCalendarScreen`): 타임라인 및 일자 허브 체크박스 최신화
    4. 기록 탭 (`renderRecordsScreen`): 통계 및 기록 목록 동기화

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: 특정 목표 ID가 존재하지 않더라도 `find` 결과가 `null`일 때 안전하게 early return하여 앱 멈춤 방지
- **가정의 타당성 검증**: 사용자가 일정 제목과 할 일 제목을 다르게 등록하더라도 `linkedTaskId` 불변 ID로 정확하게 매핑됨을 검증
- **재검증 결과 도출된 절차 수정/보완사항**: `applyScheduleUpdate`에서도 `linkedGoalId`, `linkedMsId`, `linkedTaskId`를 즉시 생성하도록 보완

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 일정 체크 버튼 클릭 시 콘솔 에러 0건
- 유저 데이터 무손실 검증 100% PASS
- `tests/schedule-goal-sync.test.js` 100% ALL PASS
- `npm test` 스모크 및 무결성 게이트 전수 ALL PASS (0 failure)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 탭 전환 시 화면이 리렌더링되지 않는 현상 -> **대책**: 4대 뷰 무조건 원자적 동시 호출
- **예상 블로커 2**: 목표 진행률이 정수로 딱 떨어지지 않는 경우 -> **대책**: 기존 `goalProgress`의 `Math.round` 로직 계승
- **재검증 트리거**: 마일스톤 상태가 자동으로 안 바뀔 경우 원칙 ②의 중심 배선 로직으로 돌아가 재검증
