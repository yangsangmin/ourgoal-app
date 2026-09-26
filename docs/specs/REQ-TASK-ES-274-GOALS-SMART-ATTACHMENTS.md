# 요구사항 정의서 (REQ) — 목표탭 참고자료 첨부 효과적·효율적 UI/UX 고도화 및 실제 UI 검증

> **문서 ID**: REQ-TASK-ES-274-GOALS-SMART-ATTACHMENTS  
> **티켓 연계**: #TASK-ES-274  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "참고자료 첨부 더 효과적, 효율적으로 사용하면서 ui 와 사용자경험을 개선시켜줄 방법과 실제 구현(ui)상태 눈으로 직접 보고 난 뒤 작업"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표 탭에서 마일스톤에는 `+참고` 버튼이 존재하나, 세부 할 일(Task) 행에는 참고자료를 등록할 수 있는 `+참고` 버튼이 마크업에서 누락되어 있음.
  2. 마일스톤 및 할 일에 첨부된 참고자료가 있을 때 단순 텍스트 `📎1`로만 축약 표출되어 어떤 형태의 자료(유튜브 영상인지, 공식 문서인지, 이미지인지, 메모인지)인지 전혀 알 수 없고, 클릭 시 즉시 뷰어로 연결되지 않음.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 세부 할 일 행(`renderSingleTaskRow`)에 `[data-addatttask]` 버튼 생성 마크업이 누락되어 이벤트 리스너가 연결되지 못하는 Dead Markup 상태.
  - **2층 (구조/프로세스 부재)**: 인라인 행에 최적화된 시각적 미니 칩 렌더러 부재로 단순 텍스트 스니펫에 의존.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 할 일을 하면서 운동 영상이나 기술 레퍼런스를 바로 보며 실천하고 싶으나, 참고자료를 등록하거나 열어보는 과정이 단절되어 있음.
- **사용자 상황 및 페르소나**: 목표를 실천하는 유저가 세부 할 일(예: 딥스쿼트 5세트, 노션 API 연동)에 유튜브 폼 가이드 영상이나 공식 문서를 등록해두고 실천 직전에 1초 만에 열람하고자 하는 상황.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E1` (체크인 루프 및 목표 실천력 강화)
- **[본질] (Essence)**: 유저가 목표와 세부 할 일을 실행할 때 필요한 시각적·기술적 참고자료를 1초 만에 직관적으로 확인하고 바로 열람하여 실천력을 극대화하는 인라인 인터랙티브 시스템.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `renderSingleTaskRow`의 `task-meta-inline` 마크업 내 `data-addatttask` 버튼 누락.
  2. **원인 2**: 첨부 목록을 시각적으로 표현하는 `.att-chip-mini` 인라인 렌더러 함수 부재.
  3. **원인 3**: 첨부된 칩을 탭했을 때 즉각 `openAttachmentViewer`로 연결하는 클릭 위임 미연결.
- **[중심] (Core Bottleneck & Anchor)**: 마일스톤 및 할 일 인라인 행에서 375px 모바일 뷰포트 넘침 없이 시각 칩과 첨부 버튼이 자연스럽게 공존하는 최적의 조형.
- **[핵심] (Critical Safety & Termination)**: 첨부 등록/삭제 시 `saveProfile()` 영속화 완료 및 4대 뷰 원자적 동시 전파.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭에서 마일스톤이나 세부 할 일 옆의 `+참고` 버튼을 눌러 유튜브 영상 링크나 문서를 등록하면, 타입별 아이콘(🎥, 🖼️, 📝, 🔗)이 달린 예쁜 미니 칩이 생성되고, 탭 한 번으로 바로 재생/열람되어 실천 몰입도가 2배 상승한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜)에 미치는 영향: 기존 `state.profile.goals` 데이터 구조 100% 무손실 계승.
  - 홈 화면 및 스트릭에 미치는 영향: 영향 없음.
  - 기록/통계/캘린더 탭에 미치는 영향: 캘린더 및 기록 탭의 기존 `attachments` 배열과 완벽 호환.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 `openAddAttachmentModal` 및 `openAttachmentViewer` 모듈을 파괴하거나 재작성하지 말고 완벽히 재사용.
- **해야 할 것 (Action)**: `renderInlineAttachmentChips` 인라인 미니 칩 렌더러 신설, 할 일 행에 `+참고` 버튼 추가, 12ms 햅틱 및 375px 반응형 스타일 완결.
- **왜 이 방식이어야만 하는가 (Why this approach)**: 이미 검증된 `openAddAttachmentModal`(스마트 링크 판별, 클립보드 연동, 4대 실천 퀵 프리셋)을 그대로 상속하면서, 시각적 표출(인라인 미니 칩)과 접근성(+참고 버튼)만 고도화하는 것이 가장 안전하고 효과적임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `user_profiles.data.goals[].milestones[].attachments` 및 `milestones[].tasks[].attachments` JSONB 배열 필드 그대로 보존.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시(`localStorage`) 및 원격 Supabase DB 동시 적재.
- **3호 (4대 뷰 전파 배선도)**: 첨부 추가/삭제 시 `saveProfile()` ➔ `renderGoalsScreen()`, `renderCalendar()`, `renderHome()`, `renderRecordsScreen()` 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-addatttask]` | 목표탭 할 일 행 | 클릭/터치 | `openAddAttachmentModal(task, ...)` 호출 | 12ms 햅틱, 저장 시 프로필 영속화 |
| `[data-addattms]` | 목표탭 마일스톤 행 | 클릭/터치 | `openAddAttachmentModal(ms, ...)` 호출 | 12ms 햅틱, 저장 시 프로필 영속화 |
| `[data-openatt]` (.att-chip-mini) | 마일스톤/할일 칩 | 클릭/터치 | `openAttachmentViewer(att, ...)` 팝업 표출 | 12ms 햅틱, 팝업에서 보기/삭제 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 아바타 및 EXP 데이터 100% 불변 보존.
- **목표 데이터 보존**: 기존 목표, 마일스톤, 할일, 완료 상태, 기존 첨부자료 100% 무손실 보존.
- **기록 데이터 보존**: 체크인 및 피드백 기록 100% 보존.
- **화면 구성 세팅값 보존**: 접힘/펼침 상태 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 세부 할 일 행은 좁은 가로 폭(375px)을 가지므로 텍스트가 긴 경우 오버플로우가 발생할 수 있음 ➔ `.att-chip-mini-text`에 `max-width: 60px; overflow: hidden; text-overflow: ellipsis;` 적용 및 flex-wrap 처리로 완벽 방어.
- **기존 기능과의 충돌 가능성 검토**: 기존 `.att-chip[data-openatt]` 셀렉터를 그대로 사용하여 `wireAttachmentChipClicks`와의 100% 호환성 확보.
- **엣지 케이스 (Edge Cases)**:
  - 네트워크 단절/오프라인 상태: 로컬 스토리지에 무손실 저장 및 Optimistic UI 렌더링.
  - 첨부 제목이 없는 경우: 기본값 '참고자료'로 fallback 안전 처리.
  - 게스트 모드: 로컬 스토리지에 정상 저장되고 카카오/구글 연동 시 무손실 이관.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `index.html`에 `renderInlineAttachmentChips` 함수 정의 및 `window` 객체 노출 (1분)
  2. [단계 2]: `renderSingleTaskRow`에 `renderInlineAttachmentChips` 및 `+참고` 버튼 마크업 탑재 (1분)
  3. [단계 3]: 마일스톤 메타 영역의 `attSnippet`을 `renderInlineAttachmentChips`로 교체 (1분)
  4. [단계 4]: `ui.css`에 `.att-chips-inline`, `.att-chip-mini`, `.compact-att-btn` 스타일 추가 (1분)
  5. [단계 5]: 단위 테스트, 스모크 테스트, 헌법 게이트 및 CDP 검증 (2분)
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: 참고자료 추가 또는 삭제
  - 즉시 갱신되어야 할 연계 화면 목록:
    1. 홈 화면 (`renderHome`): 목표 진행 상태 연계
    2. 기록 탭 (`renderRecordsScreen`): 상태 동기화
    3. 통계 탭 (`renderStatsScreen`): 상태 동기화
    4. 캘린더 탭 (`renderCalendar`): 일정 연계 참고자료 동기화

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: `window.openAddAttachmentModal` 미로드 시 클릭 무시 방지 ➔ 인라인 함수 및 `window`에 명시적 노출로 단일 실패점 완전 해소.
- **가정의 타당성 검증**: 마일스톤/할 일에 첨부가 없는 경우 칩 영역은 빈 문자열(`''`)을 반환하여 UI에 어떠한 공백이나 왜곡도 주지 않음.
- **재검증 결과 도출된 절차 수정/보완사항**: `data-addatttask` 및 `data-addattms` 핸들러에서 12ms 햅틱 피드백을 추가하여 터치 반응성을 한 단계 높임.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건
- 유저 데이터 무손실 검증(10종 페르소나 딥이퀄) 100% PASS
- npm test 스모크(392개) 및 무결성 게이트(38개) 전수 ALL PASS (0 failure)
- GitHub Court claims 100% 통과

---

## 8. [원칙 ⑧] 피드백 루프 및 사후 관리
- 유저가 목표 탭에서 할 일 실행 시 참고자료를 손쉽게 열어볼 수 있도록 상시 뷰어 상태 유지.
- 피드백 수집 및 추가 개선사항 도출.
