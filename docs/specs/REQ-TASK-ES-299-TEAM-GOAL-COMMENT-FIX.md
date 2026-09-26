# 요구사항 정의서 (REQ) — 팀 목표 댓글 작성 및 전송 기능 먹통 오류 수정

> **문서 ID**: REQ-TASK-ES-299-TEAM-GOAL-COMMENT-FIX  
> **티켓 연계**: #TASK-ES-299  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "팀 목표 댓글 작성 및 전송 기능 먹통 오류 수정" (노션 생각 메모장 DB [49]번)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 팀 목표 화면 내 마일스톤 및 팀 목표 하단 댓글 영역에서 텍스트를 입력하고 '등록' 버튼([data-cmtsend])을 클릭하거나 엔터를 눌렀을 때, 동적으로 렌더링된 요소에 이벤트 바인딩이 누락되거나 그룹 ID(gid) 추적이 실패하여 댓글이 전송되지 않는 먹통 현상 발생.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `[data-cmtsend]` 버튼에 `data-gid` 속성이 명시되어 있지 않아 이벤트 위임이나 동적 아코디언 전환 시 상위 컨테이너 검색에 실패하면 먹통이 발생함.
  - **2층 (구조/프로세스 부재)**: 카드 단위의 개별 리스너에만 의존하여, `OurgoalTeamVisibilityLevels` 등 하위 모듈에서 아코디언이 재렌더링되거나 펼쳐졌을 때 클릭 리스너가 누락될 수 있는 구조적 취약점.
  - **3층 (시스템/유저 체감 괴리)**: 팀원들과 함께 목표를 달성하며 응원과 피드백을 나누는 팀 목표의 핵심 본질(E3)이 댓글 기능 먹통으로 인해 심각하게 훼손됨.
- **사용자 상황 및 페르소나**: 팀원들과 협력하여 프로젝트/운동/스터디를 진행하며 실시간으로 진행 상황에 댓글을 달고 소통하려는 팀 목표 실사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E3 (동류 발견 및 소통) / FIX / UX
- **[본질] (Essence)**: 팀 목표 댓글의 100% 무결한 작성, 즉각적인 전송 피드백 및 영구 보존.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `teamCommentsBlockHtml` 마크업 내 `data-gid` 부재로 인한 상위 그룹 식별 불안정.
  2. **원인 2**: 동적 아코디언 렌더링 후 이벤트 리스너 미부착 가능성.
  3. **원인 3**: 4위 1체(마크업-리스너-로직-피드백) 직통 댓글 전송 제어 체계 부재.
- **[중심] (Core Bottleneck & Anchor)**: 전역 이벤트 위임 및 `sendTeamGoalComment` 직통 함수를 통해 어떤 DOM 상태에서도 댓글 등록 버튼 클릭 시 낙관적 캐싱 + 2중 로컬 영속화 + 서버 전송이 즉시 발동되도록 배선.
- **[핵심] (Critical Safety & Termination)**: 기존 `localTeamComments` 데이터, 댓글 신고/숨김 처리, 팀 목표 마일스톤 데이터의 100% 불파괴 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"팀 목표에 댓글을 작성하고 등록 버튼이나 엔터를 누르는 즉시 12ms 햅틱과 함께 목록에 댓글이 반영되고, 새로고침이나 탭 이동 후에도 완벽히 보존되어 활발한 팀 소통이 이루어진다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 영향 없음.
  - 팀 목표 렌더링: 댓글창 오픈 상태(`lastOpenCommentKey`) 유지로 리렌더링 깜빡임 방지.
  - 4대 뷰 동시 전파: 캘린더, 목표, 홈, 기록 화면 일관성 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 팀 목표 UI 전면 재작성, 불필요한 폴링 타이머 추가, 기존 데이터 구조 변경.
- **해야 할 것 (Action)**:
  1. `teamCommentsBlockHtml` 버튼에 `data-gid="'+gid+'"` 속성 명시.
  2. `js/components.js` 및 `index.html`에 `sendTeamGoalComment(gid, targetId, text)` 직통 함수 및 `handle팀목표_Item49Action` 구현.
  3. `document` 레벨의 전역 위임 클릭 리스너 보강으로 동적 렌더링된 버튼 클릭 누락 0건 달성.
  4. 홈 화면에 `#og-task-49-container` 및 `#og-task-49-action-btn` 마운트.
  5. 12ms 햅틱 진동, `og_task-49_cache` 로컬 캐시 원자적 저장, 4대 뷰 동시 전파.
  6. `ui.css`에 댓글창 및 액션 버튼 44px 터치 타겟과 모바일 375px 0px 오버플로우 방어 스타일 반영.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 상민님 지시를 100% 충족하며 기존 코드를 파괴하지 않고 안전망을 이중화하는 최적의 해법.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `team_comments` 및 `user_interactions` 호환 보존.
- **2호 (스마트 스토리지 분기 설계)**: `og_task-49_cache` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen` 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-cmtsend]` | 팀 목표/마일스톤 댓글창 | 클릭/터치 | 작성된 댓글 낙관적 추가, 2중 영속화, 인풋 초기화, 뷰 갱신 | 12ms 햅틱 + 토스트 '댓글을 남겼어요' |
| `[data-cmtinput]` | 팀 목표/마일스톤 댓글창 | Enter 키 입력 | 등록 버튼 클릭과 동일한 댓글 전송 발동 | 빈 문자열 전송 방지 |
| `og-task-49-action-btn` | 홈 화면 팀댓글 복구 허브 | 클릭/터치 | 팀 댓글 전송 안전망 동기화 및 테스트 댓글 등록 | 12ms 햅틱 + 토스트 알림 |

---

## 4. [원칙 ④] 구현 즉시 완료 (Immediate Completion Plan)
- **코드 수정 범위**:
  - `index.html`: `data-gid` 추가, 전역 위임 리스너 보강, `#og-task-49-container` 마운트
  - `js/components.js`: `handle팀목표_Item49Action`, `sendTeamGoalComment`
  - `ui.css`: `#og-task-49-container`, `#og-task-49-action-btn`, 댓글창 스타일
  - `tests/team-goal-comment-fix.test.js`: 단위 및 통합 단언 검증
  - `scripts/smoke-test.js`: 스모크 단언문 추가
- **완료 정의 (DoD)**:
  1. 팀 목표 댓글 등록 버튼 클릭 및 엔터 키 입력 시 즉각 전송 및 반영.
  2. 리렌더링 후 댓글창 오픈 상태 유지 및 로컬/원격 2중 영속화.
  3. 모든 버튼 dead-click 0건, 44px 터치 규격 만족, 375px 모바일 핏.
  4. smoke-test 및 court 검사 ALL PASS 달성.
