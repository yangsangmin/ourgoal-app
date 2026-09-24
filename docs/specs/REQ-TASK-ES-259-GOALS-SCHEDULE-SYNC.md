# 요구사항 정의서 (REQ) — 목표탭 구글 캘린더 일정 설정 버튼 및 디데이(기간) 표시 연동

> **문서 ID**: REQ-TASK-ES-259-GOALS-SCHEDULE-SYNC  
> **티켓 연계**: #TASK-ES-259  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"목표탭의 목표와 마일스톤, 세부할일별 달력표시가 구글달력과 연동시키는건데, 목표와 마일스톤, 세부할일에 대한 일정을 설정할 버튼자체가 지금 화면에 없어 달력버튼의 왼쪽에 일정을 설정하기 전에는 ‘일정설정’ 일정을 설정하고 난 후에는 디데이를 표시하도록 해. 일정이 날짜가 하루가 아니라 몇일부터 몇일까지 뭐 이런식으로 길게 잡혀 있으면 ‘(년).(월.(일).~(년).(월.(일)’ 이렇게 표시해줘 그리고 모든 내용이 실제로 구현되도록 반영해."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표(Goal) 카드 메타 영역(`metaStrip`)에 구글 캘린더 연동 버튼(`data-calsyncgoal`)이 아예 존재하지 않고, 마감일이 설정된 경우 일정 버튼(`formatSchedulePillHtml`)이 제거되어 정적 텍스트로만 표시됨.
  2. 세부할일(Task) 행에서 일정 버튼(`formatSchedulePillHtml`)과 달력 버튼(`data-calsynctask`) 사이에 마감 태그(`taskDueHtml`), 첨부 배지 등이 끼어들어 있어 버튼 간 일체감이 떨어지고 중복 마감 텍스트가 노출됨.
  3. 마일스톤(Milestone)에서도 일정 버튼과 달력 버튼의 어포던스가 일관되지 않고, 구글 OAuth 미설정 시 버튼이 숨겨져 사용자가 연동 시도 자체를 할 수 없음.
  4. 기간 일정(복수일자)이 지정되었을 때 상민님 지정 형식(`(년).(월.(일).~(년).(월.(일)`)과 다르게 표시되거나 trailing dot 누락 및 모바일 375px 화면에서 줄바꿈되는 결함 발생 가능.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 목표 헤더에 달력 아이콘 버튼 누락, `goalDetailBody` 내 `[data-calsyncgoal]` 클릭 이벤트 미배선.
  - **2층 (구조/프로세스 부재)**: 3계층(목표, 마일스톤, 할일)의 '일정 버튼 + 달력 버튼' 일체형 컴포넌트 표준 부재.
  - **3층 (시스템/유저 체감 괴리)**: 화면에 달력 아이콘만 보이거나 아예 안 보여, 일정을 어디서 잡고 구글 캘린더로 어떻게 보내야 할지 모르는 인터랙션 단절감.
- **사용자 상황 및 페르소나**:
  - 목표, 마일스톤, 할 일을 등록하고 구글 캘린더 및 내부 캘린더와 유기적으로 일정을 동기화하여 인생 청사진을 관리하려는 모든 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프 및 인생 청사진 직결 RPG)
- **[본질] (Essence)**: 생각한 목표와 실행 계획을 시간의 축(캘린더/디데이) 위에 마찰 없이 배치하고 구글 캘린더와 실시간 동기화하여 실행력을 극대화하는 시간 관리 엔진.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 목표(Goal) 헤더 렌더러에 달력 아이콘 및 일정 편집 진입 버튼 누락.
  2. **원인 2**: 세부할일 렌더러의 버튼 배치 순서 분산 및 중복 태그 노출.
  3. **원인 3**: 구글 캘린더 연동 함수(`quickSyncToCalendar`)에 목표 동기화 클릭 이벤트 미결속.
- **[중심] (Core Bottleneck & Anchor)**: 목표·마일스톤·할일 3계층 공통 '일정설정/디데이 버튼 + 구글달력 연동 버튼' 2련 콤비네이션 구조의 완전 통일.
- **[핵심] (Critical Safety & Termination)**: 일정 저장 시 `state.profile.settings.customSchedules` 및 `goal/ms/task` 양방향 원자적 갱신, `saveProfile()` 영구 원장 보존 및 4대 뷰 동시 전파.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭에서 어떤 목표/마일스톤/할일을 보더라도 달력 버튼 바로 왼쪽의 [일정설정] 또는 [디데이/기간] 버튼을 한 번 터치하여 일정을 잡고, 바로 옆 달력 버튼을 눌러 구글 캘린더에 즉시 연동되는 완결된 흐름을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 기존 세션 유지 무손실.
  - 홈 화면: `renderHome()` 연동으로 오늘 할 일 및 디데이 실시간 동기화.
  - 캘린더/기록/통계 탭: `customSchedules` 갱신을 통해 캘린더 탭에 완벽 반영.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 마일스톤 및 할 일의 드래그앤드롭(DnD), 체크 토글, 메모, 첨부 등 기존 기능 훼손 금지.
  - 서드파티 캘린더 라이브러리 추가 도입 금지 (기존 네이티브 모달 및 Google OAuth 파이프라인 100% 재활용).
- **해야 할 것 (Action)**:
  - 목표, 마일스톤, 할 일 3계층 모두 `[일정 버튼] [달력 버튼]` 2련 배치 확립.
  - 일정 미설정 시 `일정설정`, 단일일자 시 `D-Day`/`D-N`/`D+N`, 기간형 시 `${sYear}.${sMonth}.${sDay}.~${dYear}.${dMonth}.${dDay}.` 포맷 준수.
  - `openScheduleSetupModal` 3계층 완전 지원 및 시작일/종료일/마감시간/프리셋/삭제 완비.
  - 375px 모바일 수평 오버플로우 0px, 44px 터치 영역 보장.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `profiles.settings.customSchedules` JSONB 배열 및 `profiles.goals` 내부 `startDate`, `dueDate` 필드.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시(`state.profile`) 즉시 반영 후 `saveProfile()` 원격 DB/로컬스토리지 듀얼 세이브.
- **3호 (4대 뷰 전파 배선도)**: 일정 저장 및 삭제 시 `renderGoalsScreen()`, `renderCalendarScreen()`, `renderHome()`, `renderRecordsScreen()` 4대 뷰 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-setschedule]` (목표) | 목표 헤더 metaStrip | 클릭/터치 | `openScheduleSetupModal('goal', gid)` 오픈 | 모달 즉시 렌더링, 기존 일정 채움 |
| `[data-calsyncgoal]` | 목표 헤더 metaStrip | 클릭/터치 | `quickSyncToCalendar('goal', gid)` 실행 | 미설정 시 일정 모달 안내, 성공 시 토스트 |
| `[data-setschedule]` (마일스톤) | 마일스톤 서브메타 | 클릭/터치 | `openScheduleSetupModal('ms', gid, mid)` 오픈 | 모달 즉시 렌더링, 기존 일정 채움 |
| `[data-calsyncms]` | 마일스톤 서브메타 | 클릭/터치 | `quickSyncToCalendar('ms', gid, mid)` 실행 | 미설정 시 일정 모달 안내, 성공 시 토스트 |
| `[data-setschedule]` (할일) | 할일 행 우측 | 클릭/터치 | `openScheduleSetupModal('task', gid, mid, tid)` 오픈 | 모달 즉시 렌더링, 기존 일정 채움 |
| `[data-calsynctask]` | 할일 행 우측 | 클릭/터치 | `quickSyncToCalendar('task', gid, mid, tid)` 실행 | 미설정 시 일정 모달 안내, 성공 시 토스트 |
| `#schedSaveBtn` | 일정 설정 모달 | 클릭/터치 | `applyScheduleUpdate` 실행 및 4대 뷰 갱신 | 시작일>종료일 자동 보정, 모달 닫힘 |
| `#schedDeleteBtn` | 일정 설정 모달 | 클릭/터치 | 일정 삭제 처리 및 4대 뷰 갱신 | 확인 토스트 표시 및 모달 닫힘 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 정보 불변 보존.
- **목표 데이터 보존**: 기존 목표, 마일스톤, 할일 100% 무손실 보존 및 `startDate`, `dueDate` 필드만 안전하게 갱신.
- **기록 데이터 보존**: 체크인 및 기존 기록 전혀 영향 없음.
- **화면 구성 세팅값 보존**: `state.profile.settings` 내 타 설정값 100% 불변 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 목표 카드의 metaStrip에 버튼이 추가되면서 375px 모바일 화면에서 줄바꿈이 일어날 수 있음 -> `.meta-strip`의 `flex-wrap: wrap`, `.schedule-pill-btn`의 컴팩트 패딩(2px 8px) 및 터치 영역 가상 확장(`min-height: 32px`) 적용.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 `taskDueHtml`의 중복 텍스트는 뷰 모드에서만 정리하고 편집 모드에서의 `<input type="datetime-local">` 편집 기능은 그대로 보존.
- **엣지 케이스 (Edge Cases)**:
  - **시작일만 있고 마감일이 없는 경우**: 시작일을 단일 마감일로 취급하여 `D-Day` 산출.
  - **시작일이 마감일보다 늦은 경우**: `applyScheduleUpdate`에서 자동 스왑(Swap)하여 정상 기간 처리.
  - **구글 OAuth 인증 미완료 상태에서 달력 버튼 클릭**: 에러로 터지지 않고 `getGoogleAccessToken()` 요청 또는 친절한 토스트 안내.
  - **네트워크 단절 상태**: `customSchedules` 및 로컬 상태는 즉시 저장되어 앱 내 캘린더에 100% 반영.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. **단계 1 (`index.html`)**:
   - `formatSchedulePillHtml`의 기간 렌더링 포맷을 상민님 지시 규격(`${sYear}.${sMonth}.${sDay}.~${dYear}.${dMonth}.${dDay}.`)으로 정밀화.
   - 목표 카드 `metaStrip`에 `formatSchedulePillHtml` 및 `data-calsyncgoal` 버튼 상시 렌더링.
   - 세부할일 행에서 `formatSchedulePillHtml`을 `data-calsynctask` 바로 왼쪽으로 위치 재조정 및 중복 태그 정돈.
   - `goalDetailBody` 이벤트 리스너에 `[data-calsyncgoal]` 클릭 시 `quickSyncToCalendar('goal', gid)` 직통 바인딩.
2. **단계 2 (`ui.css`)**:
   - `.schedule-pill-btn`의 375px 모바일 반응형 규격, 최소 터치 영역, 4대 테마 고대비 색상 보장.
3. **단계 3 (`tests/` 및 `scripts/`)**:
   - 단위 테스트 `tests/goals-schedule-sync.test.js` 작성.
   - `scripts/smoke-test.js`에 검증 단언문 추가.
   - `scripts/verify-integrity-gate.js` 38개 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - 구글 API 실패가 로컬 일정 저장에 영향을 주지 않도록 로컬 원장(`saveProfile`) 저장을 먼저 완결하고, 구글 캘린더 동기화는 비동기 독립 트랜잭션으로 격리.
- **가정의 타당성 검증**:
  - `state.profile.settings.customSchedules`가 비어있거나 null이어도 빈 배열로 안전 초기화되므로 크래시 없음.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 날짜가 아직 설정되지 않은 상태에서 사용자가 달력 아이콘 버튼을 먼저 클릭한 경우, 즉시 일정 설정 모달을 자동으로 띄워주도록 `quickSyncToCalendar` 내 사용자 편의 폴백 추가.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 목표, 마일스톤, 할일 3계층 모두 달력 아이콘 왼쪽 [일정설정]/[디데이/기간] 버튼 100% 렌더링.
- 단일일자 클릭 시 D-Day 산출, 기간일자 클릭 시 `YYYY.MM.DD.~YYYY.MM.DD.` 표시.
- 모달에서 일정 저장 시 4대 뷰 즉시 반영 및 새로고침 후에도 유지.
- 375px 모바일 수평 오버플로우 0px, 44px 터치 타깃 보장.
- 스모크 테스트 및 무결성 게이트 전수 ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 기존 `smoke-test.js`의 이전 검사 단언문 충돌 여부 -> 기확인 결과 이전 검사는 자체 로컬 함수를 가지고 있어 충돌 0건.
- **예상 블로커 2**: 375px 모바일에서 긴 기간 텍스트 줄바꿈 -> CSS `white-space: nowrap`, `font-size: 0.6875rem`, `overflow: hidden`, `text-overflow: ellipsis`로 완벽 방어.
- **재검증 트리거**: 4대 뷰 리렌더링 중 목표 화면이 갱신되지 않을 경우 즉시 원칙 ⑤의 이벤트 위임 지점으로 회귀하여 핸들러 재검증.
