# 요구사항 정의서 (REQ) — 템플릿 백과사전 원클릭 둘러보기/이식 연동 및 마일스톤 D-day 직통 캘린더 연계 UX 완결

> **문서 ID**: REQ-TASK-ES-135-TEMPLATE-MILESTONE-DDAY  
> **티켓 연계**: #TASK-ES-135 ([135])  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Agent  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해" (노션 티켓 [135]: [목표탭/연동] 템플릿 백과사전 원클릭 둘러보기/이식 연동 및 마일스톤 D-day 직통 캘린더 연계 UX 완결 (지식기반 정체 [80],[87],[106] 결합))
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표 탭 진입 시 등록된 목표가 없는 신규 유저에게 텍스트 안내만 덩그러니 노출되어, 검증된 60대 목표 템플릿의 원클릭 탐색 및 즉각 이식(내 목표 담기) 어포던스가 단절되어 있음.
  2. 목표 카드 내 마일스톤에 마감일/시작일이 설정되어 있어도 헤더에 D-day 뱃지(`ddayBadge`)가 정상 노출되지 않거나, `[📅 일정 설정]` 버튼의 시각적 어포던스 및 클릭 시 인앱 캘린더(`customSchedules`)와의 즉각 연계가 매끄럽지 못함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 마일스톤 렌더링 코드 내 `var ddayBadge = '';`가 선언만 되고 마감일 기반 뱃지로 채워지지 않았으며, 일정 버튼에 명확한 아이콘/라벨 어포던스가 부족했음.
  - **2층 (구조/프로세스 부재)**: 템플릿 백과사전은 존재하나 엠프티 스테이트 및 목표 상단에서 1클릭으로 바로 담을 수 있는 퀵 어답트(Quick-Adopt) 컴포넌트가 부재하여 인지 순행 마찰 유발.
  - **3층 (시스템/유저 체감 괴리)**: 목표를 세우고도 달력에 언제까지 해야 하는지 직관적으로 연결되지 않아 목표 탭과 캘린더 탭이 따로 노는 느낌 발생.
- **사용자 상황 및 페르소나**:
  - 새로 가입했거나 새로운 도전을 시작하려는 유저가 백지 상태의 막막함을 느끼지 않고, 추천 템플릿(마라톤, 자격증, 미라클모닝)을 1초 만에 담고 마일스톤 일정 D-day를 달력과 동기화하여 실천 루프로 직결되길 원하는 상황.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1(체크인 루프) / UX / INFRA
- **[본질] (Essence)**: 목표 진입 장벽의 제로화(Zero-Friction Goal Inception)와 마일스톤 시한의 달력 공간 실체화(D-day Calendar Anchoring).
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. 목표 탭 빈 화면에 정적 텍스트 가이드만 존재하고 실제 즉시 담을 수 있는 템플릿 퀵 카드 연결 부재.
  2. 마일스톤 뷰에서 D-day 뱃지 산출 로직이 조건부 누락되어 시각적 긴장감 및 달성 시한 체감 저하.
  3. 마일스톤 일정 설정 모달 완료 시 캘린더/홈/기록 4대 뷰 원자적 전파가 UI 뱃지와 완벽히 일치하도록 앵커링 필요.
- **[중심] (Core Bottleneck & Anchor)**: 목표 템플릿 1초 자동 이식(`adoptTemplateAsMyGoal`)과 마일스톤 일정 설정(`openScheduleSetupModal` -> `applyScheduleUpdate` -> `customSchedules`).
- **[핵심] (Critical Safety & Termination)**: 유저 기존 프로필 목표 무손실 보존(`state.profile.goals`), 캘린더 커스텀 일정 동기화 무결성.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭에서 추천 템플릿 카드를 누르면 1초 만에 내 목표로 이식되고, 마일스톤의 [📅 일정 설정]을 누르면 즉시 D-day 뱃지가 갱신되고 캘린더에 반영되어 목표 완주를 위한 시간 관리가 한눈에 잡힌다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 무영향 (로컬/소셜 계정 프로필 goals 정상 유지).
  - 홈 화면: 목표 추가 시 홈 퀘스트/커닝페이퍼 슬롯에 실시간 전파.
  - 캘린더/기록 탭: 마일스톤 일정 추가 시 캘린더 셀 76px 및 아젠다 리스트에 자동 인입.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 60대 템플릿 레지스트리 데이터를 임의 파괴하거나 불필요하게 비대화하는 행위 금지.
  - 기존 목표 마일스톤 편집/삭제/DND 기능을 훼손하는 구조 변경 금지.
- **해야 할 것 (Action)**:
  - 목표 탭 상단 및 엠프티 스테이트 슬롯에 `#goalTemplateHeroCard` 탑재 (인기 3대 템플릿 1클릭 담기 & 전체 둘러보기 직통).
  - 마일스톤 헤더에 `m.dueDate` 기반 실시간 `ddayBadge` 노출 및 `.schedule-pill-btn` 어포던스 `[📅 일정 설정]` 고도화.
  - 마일스톤 일정 저장 시 인앱 캘린더(`state.profile.settings.customSchedules`) 완벽 동기화 및 4대 뷰 동시 전파.

### 3-1. 스토리지 원장화 3대 명세
- **1호 (원격 DB 스키마 명세)**: `users.profile` jsonb 내 `goals` 및 `settings.customSchedules` 필드 유지 및 무손실 업데이트.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시(`state.profile.goals`) 즉시 반영 후 `saveProfile()` 비동기 영속화.
- **3호 (4대 뷰 전파 배선도)**: 템플릿 이식 및 마일스톤 일정 설정 시 `renderGoalsScreen()`, `renderCalendarScreen()`, `renderHome()`, `renderRecordsScreen()` 동시 호출.

### 3-2. 전수 인터랙션 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `.btn-quick-adopt-goal` | 목표 탭 템플릿 카드 | 클릭 | `adoptTemplateAsMyGoal` 호출하여 1초 만에 내 목표에 추가 | 토스트 안내 + 목표 탭 즉각 렌더링 |
| `#btnOpenFullTemplateEncyclopedia` | 목표 탭 템플릿 카드 | 클릭 | `switchGoalsSubTab('templateEncyclopedia')` 호출하여 백과사전 전환 | 서브탭 전환 및 템플릿 60선 뷰 노출 |
| `.schedule-pill-btn` | 목표 마일스톤 행 | 클릭 | `openScheduleSetupModal('ms', goal.id, m.id)` 호출 | 일정 선택 모달 팝업 |
| `#schedSaveBtn` | 일정 설정 모달 | 클릭 | `applyScheduleUpdate` 실행 및 D-day 뱃지 캘린더 반영 | 날짜 미선택 시 경고 토스트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격
- 기존 유저 목표 리스트(`state.profile.goals`) 및 기존 마일스톤 진행 상태(todo/doing/done) 100% 무손실 보존.

---

## 4. [원칙 ④] 구현 범위 및 기술 규격
- 파일 변경:
  1. `index.html`: 목표 탭 상단/엠프티 템플릿 히어로 카드(`#goalTemplateHeroCard`) 추가, 마일스톤 D-day 뱃지 계산 활성화, 일정 버튼 어포던스 표준화.
  2. `ui.css`: `.goal-template-hero-card`, `.template-quick-card`, `.schedule-pill-btn` 시각적 고도화 및 44px 터치 규격 유지.

---

## 5. [원칙 ⑤] 측정 및 검증 기준 (선언이 아닌 측정)
- `npm test`: 스모크 440개 + 무결성 게이트 38개 + 941개 Zero Dead-Click 전원 통과.
- Headless Chrome CDP:
  - `#goalTemplateHeroCard` 가시성 확인 (`visible === true`).
  - `.btn-quick-adopt-goal` 클릭 시 목표 카운트 증가 및 마일스톤 D-day 뱃지/일정 설정 버튼 렌더링 확인.
  - 모바일 뷰포트 너비 안정성: `docScrollWidth === 390px`.
