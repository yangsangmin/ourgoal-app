# 요구사항 정의서 (REQ) — 목표탭 가로 오버플로우 척결 및 상단 서브탭 2중 중복 단일화

> **문서 ID**: REQ-TASK-ES-128-GOALS-OVERFLOW  
> **티켓 연계**: #TASK-ES-128  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([128])**: "실측 진단: 목표 탭 진입 시 화면 너비가 812px로 터져 나와 우측으로 회색 블록이 삐져나오며 좌우로 흔들리는 치명적 레이아웃 파손 발생. 또한 상단 고정 6대 칩 바 아래에 구형 5대 칩 바가 위아래로 2중 중복 렌더링되어 상단 180px를 낭비함."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표 탭(`#screen-goals`) 진입 시 `scrollWidth`가 712~812px로 터져 나와, 모바일 375~390px 뷰포트 우측으로 회색/다크 블록이 돌출되고 화면이 좌우로 흔들림.
  2. 최신 상단 고정 스티키 서브탭 바(`#goalsStickySubnav`: 🎯 개인, 🔄 루틴, 🔗 팀연계, 👥 팀목표, 📖 템플릿, 📊 성취통계) 바로 아래에 구형 5대 서브탭 그리드(`#goalsSubtabs`: 루틴, 개인, 팀연계, 팀목표, 템플릿)가 2중 중복 적재되어 화면 상단 180px 이상을 낭비하고 조잡함을 극대화함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - `#goalDetailDrawer`가 `#screen-goals` 내부에 배치되어 있고 `right: -100% !important;`로 설정되어 있어, 비활성(닫힘) 상태임에도 `#screen-goals`의 레이아웃 박스를 348px 이상 우측으로 팽창시켜 전체 가로 스크롤 폭을 712~812px로 폭발시킴.
    - `ui.css`의 4대 테마 오버라이드(`html[data-theme] #goalsSubtabs.goals-subtabs-grid`)에 `display: grid !important;`가 선언되어 있어, `index.html` 인라인의 `display: none;`을 무력화하고 구형 서브탭을 강제 노출시킴.
  - **2층 (구조/프로세스 부재)**: 서브탭 모듈 개편 시 구형 그리드를 완전 은폐/폐기하지 않고 두 규칙이 병존하게 둠.
  - **3층 (시스템/유저 체감 괴리)**: 사용자가 목표를 확인하려 할 때 화면이 좌우로 덜컹거리고, 서브탭이 2개씩 떠서 무엇을 눌러야 할지 극심한 인지 피로를 느낌.
- **사용자 상황 및 페르소나**: 아워골 모바일 앱 사용자가 목표 탭에 들어와 흔들림 없는 390px 단일 화면에서 깔끔한 서브탭(개인/루틴/팀 등)을 터치하고 내 목표와 마일스톤에 집중하고자 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA/UX` (목표 탭 조형 무결성 및 인지순행 IA 정돈)
- **[본질] (Essence)**: 모바일 뷰포트(375~430px) 가로 오버플로우 0px 완전 척결 및 단일 스티키 서브탭 네비게이션 복원.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. `ui.css:15608` `.goal-detail-drawer`에 `right: -100% !important;` 선언 및 `#screen-goals` 내부 배치로 인한 812px 뷰포트 팽창.
  2. `ui.css:9277-9303` `html[data-theme] #goalsSubtabs.goals-subtabs-grid`의 `display: grid !important;`로 인한 서브탭 2중 노출.
  3. `#screen-goals`에 `overflow-x: hidden` 누락으로 인한 가로 스크롤 발생.
- **[중심] (Core Bottleneck & Anchor)**: `#screen-goals` 가로 폭 실측 390px 엄수 (`docScrollWidth === 390`, `goalsScrollWidth <= 390`).
- **[핵심] (Critical Safety & Termination)**: 기존 목표/루틴/팀연계/팀목표/템플릿/성취통계 6대 서브탭 전환 및 `switchGoalsSubTab` 기능 100% 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 목표 탭에 진입했을 때 좌우 흔들림이 100% 사라지고, 상단에 세련된 단일 스티키 칩 바(6종)만 배치되어 원하는 목표 영역으로 1초 만에 쾌적하게 전환할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 목표 탭 핵심 기능(개인 목표, 루틴 매트릭스, 팀연계, 팀목표, 템플릿백과사전, 성취통계): 100% 정상 작동 보존.
  - 목표 추가 파이프라인 및 모듈화 허브: 영향 없음 (마운트 로직 완벽 연동).

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 헌법 게이트 검증(`verify-integrity-gate.js`)에서 요구하는 `.goals-subtabs-grid`, `grid-template-columns: repeat(5, 1fr)`, `['teamLinked','팀 연계']`, `['templateEncyclopedia','📖 템플릿']` 문자열을 삭제하여 테스트를 깨뜨리는 행위 엄격 금지.
  - 목표 추가, 마일스톤 완료, 드로어 상세 보기 등 기존 비즈니스 로직 삭제 금지.
- **해야 할 것 (Action)**:
  1. `ui.css` 내 `#goalsSubtabs` 관련 셀렉터를 고특이도(high-specificity) `display: none !important;`로 완전 은폐하여 스티키 서브탭 바 단일화.
  2. `.goal-detail-drawer`를 닫힘 상태에서 `display: none !important;` (또는 `transform: translateX(105%)`와 `visibility: hidden`) 처리하여 레이아웃 팽창 원천 차단.
  3. `#screen-goals`에 `overflow-x: hidden !important; max-width: 100% !important; box-sizing: border-box !important;` 적용.
  4. `.goals-sticky-subnav`에 `box-sizing: border-box !important; max-width: 100vw !important;` 적용.
  5. `#goalDetailDrawer`를 `</main>` 뒤로 이동 배치하여 스크롤 컨테이너로부터 완전 격리.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- 레이아웃 및 CSS/HTML 보정 작업으로 DB 스키마 변경 사항 없음.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnGoalsSubPersonal` | 목표탭 스티키 서브바 | 클릭/터치 | `switchGoalsSubTab('personal')`, 12ms 햅틱, 개인 목표 뷰 전환 | 정상 렌더링 유지 |
| `btnGoalsSubRoutine` | 목표탭 스티키 서브바 | 클릭/터치 | `switchGoalsSubTab('routine')`, 12ms 햅틱, 루틴 매트릭스 뷰 전환 | 정상 렌더링 유지 |
| `btnGoalsSubTeamLinked` | 목표탭 스티키 서브바 | 클릭/터치 | `switchGoalsSubTab('teamLinked')`, 12ms 햅틱, 팀연계 뷰 전환 | 정상 렌더링 유지 |
| `btnGoalsSubTeam` | 목표탭 스티키 서브바 | 클릭/터치 | `switchGoalsSubTab('team')`, 12ms 햅틱, 팀목표 뷰 전환 | 정상 렌더링 유지 |
| `btnGoalsSubTemplate` | 목표탭 스티키 서브바 | 클릭/터치 | `switchGoalsSubTab('templateEncyclopedia')`, 12ms 햅틱, 템플릿백과사전 뷰 전환 | 정상 렌더링 유지 |
| `btnGoalsSubStats` | 목표탭 스티키 서브바 | 클릭/터치 | `switchGoalsSubTab('stats')`, 12ms 햅틱, 성취통계 뷰 전환 | 정상 렌더링 유지 |
| `btnGoalDrawerClose` | 목표 상세 드로어 | 클릭/터치 | `closeGoalDetailDrawer()`, 드로어 닫힘 및 화면 복귀 | 닫힘 시 레이아웃 침범 0 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 없음 (목표, 마일스톤, 루틴, 팀 데이터 100% 보존).

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 드로어가 `</main>` 밖으로 이동할 때 특정 z-index 레이어에서 기존 모달과 겹칠 수 있으므로 `z-index: 150`을 엄수함.
- **기존 기능과의 충돌 가능성 검토**: 기존 스모크 테스트의 `.goals-subtabs-grid` 및 5열 그리드 규격 검증 문자열을 그대로 보존하여 충돌을 방지함.
- **엣지 케이스 (Edge Cases)**:
  - 320px 극초소형 화면: 스티키 칩 바의 가로 스크롤(`overflow-x: auto`) 정상 작동 확인.
  - 드로어가 열린 상태에서 가로 회전(Landscape): `max-width: 100vw`로 오버플로우 방지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `ui.css`: 드로어 `display: none` 전환 및 `#screen-goals` 가로 스크롤 방화벽 속성 적용.
  2. `index.html`: `#goalDetailDrawer` 위치 이동 및 `#goalsSubtabs` 은폐 보완.
  3. 로컬 테스트 및 CDP 측정: 390px 뷰포트 내 `scrollWidth` 및 단일 서브탭 검증.
- **화면 간 상호연동 전파 규격**:
  - 서브탭 전환 시: `renderGoalsScreen()` 연계 뷰가 즉시 갱신되어 목표 리스트 정상 출력.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: `#goalsSubtabs`를 완전히 삭제할 경우 구 테스트 코드가 깨질 수 있으므로, 삭제하지 않고 CSS 고특이도 셀렉터로 `display: none !important;` 은폐 처리함.
- **가정의 타당성 검증**: 드로어가 `</main>` 뒤로 이동해도 `getElementById('goalDetailDrawer')`를 호출하는 JS 로직은 완벽히 정상 동작함을 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: `verify-integrity-gate.js` 내 정적 문자열 단언을 100% 충족하도록 기존 그리드 선언을 상단에 온전히 보존.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- `docScrollWidth === 390` 및 `goalsScrollWidth <= 390` 실측 100% 달성.
- `npm test` 스모크 440개 및 무결성 게이트 38개 전수 통과 (0 failure).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 사파리 등에서 100vw 계산 시 스크롤바 너비 포함 문제.
- **사전 방어 및 우회 로직**: `max-width: 100% !important; box-sizing: border-box !important;`로 이중 방어.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout index.html ui.css`로 즉시 원복.
- **재검증 트리거**: CDP 실측에서 가로 스크롤 발생 시 즉시 원칙 2, 3으로 돌아가 컨테이너 CSS 재조정.
