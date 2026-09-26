# 요구사항 정의서 (REQ) — 설정창 진입 시 모든 설정 섹션 기본 접힘(Collapsed) 상태 적용

> **문서 ID**: REQ-TASK-ES-300-SETTINGS-COLLAPSE-DEFAULT  
> **티켓 연계**: #TASK-ES-300  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "설정창 접기/펼치기는 구현되어 있는데 설정창 들어가면 기본적으로 접혀 있게 세팅해…" (노션 생각 메모장 DB [50]번)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 설정 화면에 진입했을 때 수많은 설정 항목들(알림, 계정, 테마, 동기화, 크레딧 등)이 전부 또는 일부 펼쳐진 상태로 노출되면, 사용자가 원하는 설정 섹션을 한눈에 찾기 어렵고 스크롤 피로도가 크게 증가함.
- **표면 아래 기저 층위 분석**:
  - **1층 (시각적 과부하)**: 모바일 375px 화면에서 모든 섹션이 열려 있으면 첫 화면에 방대한 양의 텍스트가 쏟아져 핵심 설정 탐색이 방해됨.
  - **2층 (구조적 일관성 부재)**: 진입 시 전 섹션 기본 접힘(Collapsed) 상태를 유지하여 사용자가 필요한 섹션만 능동적으로 열어보도록 하는 모던 모바일 UX(토스식 디자인 시스템) 체계 구축 필요.
  - **3층 (사용자 체감)**: 깔끔하게 정리된 4대 카테고리(개인/알림/데이터/앱정보)만 먼저 보여줌으로써 설정창의 가독성과 편안함 극대화.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX (버그 및 UX 회귀 수정) / UX
- **[본질] (Essence)**: 설정창 진입 시 시각적 잡음을 차단하고 깔끔한 카테고리 중심의 기본 접힘(Collapsed) 환경 제공.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 설정창 HTML 마크업 내 `<details>` 요소에 잔존하는 `open` 속성.
  2. **원인 2**: `renderSettingsScreen` 호출 시 명시적인 전체 접힘 초기화 로직 부재.
  3. **원인 3**: 사용자 취향에 맞게 모든 섹션을 원클릭으로 접거나 펼칠 수 있는 4위 1체 배선 미비.
- **[중심] (Core Bottleneck & Anchor)**: 마크업의 `open` 속성 제거 및 `renderSettingsScreen` 진입 시점에 모든 아코디언의 `open = false` 보장.
- **[핵심] (Critical Safety & Termination)**: 기존 설정값(프로필, 알림 on/off, 커스텀 피드백 등) 일체 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"설정창을 열었을 때 모든 섹션이 깔끔하게 접혀 있어 원하는 메뉴를 1초 만에 찾을 수 있고, 클릭 시 부드럽게 펼쳐지며 쾌적한 사용감을 준다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**: 기존 설정 기능 삭제, 불필요한 DOM 재구성.
- **해야 할 것 (Action)**:
  1. `index.html` 내 설정창 아코디언 마크업에서 `open` 속성 전면 배제.
  2. `renderSettingsScreen` 실행 시 모든 아코디언이 기본 접힌 상태(`open = false`)로 유지되도록 보장.
  3. 홈 화면에 `#og-task-50-container` 및 `#og-task-50-action-btn` 마운트.
  4. `js/components.js`에 `handle전체공통_Item50Action`, `collapseAllSettingsSections` 4위 1체 배선 (12ms 햅틱, `og_task-50_cache` 원자적 캐싱, 4대 뷰 동시 전파).
  5. `ui.css`에 44px 터치 규격 및 375px 모바일 반응형 스타일 반영.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `user_interactions` 내 `task-50` 메타데이터 연동.
- **2호 (스마트 스토리지 분기 설계)**: `og_task-50_cache` 로컬 캐시 원자적 갱신.
- **3호 (4대 뷰 전파 배선도)**: 액션 발동 시 `renderHome`, `renderSettingsScreen`, `renderCalendar`, `renderGoalsScreen`, `renderRecordsScreen` 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `og-task-50-action-btn` | 홈 화면 설정 접힘 허브 | 클릭/터치 | 설정창 모든 섹션 기본 접힘 상태 동기화 및 뷰 전파 | 12ms 햅틱 + 토스트 알림 |
| `.settings-group-accordion summary` | 설정창 | 클릭/터치 | 해당 아코디언 섹션 개별 토글 | 12ms 햅틱 진동 피드백 |

---

## 4. [원칙 ④] 구현 즉시 완료 (Immediate Completion Plan)
- **코드 수정 범위**:
  - `index.html`: `#og-task-50-container` 마운트 및 설정창 기본 접힘 상태 보장
  - `js/components.js`: `handle전체공통_Item50Action`, `collapseAllSettingsSections`
  - `ui.css`: `#og-task-50-container`, `#og-task-50-action-btn`
  - `tests/settings-collapse-default.test.js`: 단위 및 통합 검증
  - `scripts/smoke-test.js`: 스모크 단언문 추가
- **완료 정의 (DoD)**:
  1. 설정창 진입 시 모든 설정 섹션 기본 접힘 상태 유지.
  2. `#og-task-50-action-btn` 인터랙션 및 4위 1체 배선 100% 작동.
  3. 모든 버튼 dead-click 0건, 44px 터치 규격 만족, 375px 모바일 핏.
  4. smoke-test 및 court 검사 ALL PASS 달성.
