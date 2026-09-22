# 요구사항 정의서 (REQ) — 목표탭 상단 5개 서브탭 버튼 중앙 정렬 및 시인성·터치 가독성 전면 개선

> **문서 ID**: REQ-TASK-ES-237-GOALS-SUBTABS-ALIGNMENT  
> **티켓 연계**: #TASK-ES-237  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 107번 항목:  
  > **"목표탭 상단 5개 서브탭 버튼 중앙 정렬 및 시인성·터치 가독성 전면 개선"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표 탭 상단 5개 서브탭(개인 목표, 루틴, 팀 연계, 팀 목표, 템플릿)의 중앙 정렬 밸런스가 모바일 기기별(375px~412px)로 미세하게 어긋나 시각적 불안정감 유발.
  2. 비활성 탭과 활성 탭(.active) 간의 시각적 명암 대비 및 입체감(그림자/하이라이트)이 부족하여 현재 선택된 탭을 한눈에 식별하기 어려움.
  3. 탭 터치 시 미세 햅틱 피드백이 누락되어 탭 전환 체감이 밋밋함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 탭 클릭 이벤트에 `triggerHapticFeedback` 결속 누락.
  - **2층 (구조/프로세스 부재)**:
    - CSS 그리드 컨테이너의 명시적 `justify-content: center`, `align-items: center` 및 4대 테마 통합 고대비 스타일링 미흡.
  - **3층 (시스템/유저 체감 괴리)**:
    - 상단 내비게이션은 사용자가 목표 모드를 결정하는 핵심 나침반이나 시각적 위계가 모호하여 인지 부하 발생.
- **사용자 상황 및 페르소나**:
  - 모바일 한 손 조작 환경에서 개인 목표, 루틴, 팀 목표를 오가며 빠르게 할 일을 점검하고 퀘스트를 수행하는 실천형 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1 & FIX (3대 본질 루프 진입로의 시각적 안정성 및 명확한 내비게이션 확립)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"어떤 화면 크기와 테마에서도 흔들림 없는 완벽한 대칭적 균형감과 또렷한 시인성을 제공하여, 사용자가 길을 잃지 않고 경쾌하게 목표 모드를 전환할 수 있도록 지원하는 모바일 최적화 내비게이션 인터페이스"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (그리드 정렬 축 선언 누락)**:
     - 컨테이너에 `justify-content: center` 및 `align-items: center`가 누락되어 비대칭 여백 발생 가능성.
  2. **원인 2 (활성 상태 입체 대비 부족)**:
     - `.active` 상태에서 테마별 배경 및 미세 그림자(`box-shadow: 0 2px 6px rgba(0,0,0,0.12)`)가 부족하여 평면적으로 보임.
  3. **원인 3 (햅틱 피드백 부재)**:
     - 탭 전환 클릭 핸들러에 12ms 햅틱 배선 결여.
- **[중심] (Core Bottleneck & Anchor)**:
  - `#goalsSubtabs.goals-subtabs-grid` 컨테이너에 중앙 대칭 정렬을 선언하고, 활성/비활성 탭의 대비와 그림자를 보강하며 12ms 햅틱을 4위 1체로 완비.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 5열 그리드 규격(`repeat(5, 1fr)`) 및 `sticky` 고정 규격을 100% 보존.
  - `verify-integrity-gate.js` 및 `npm test` 100% ALL PASS.
- **체감 가설 (User Experience Hypothesis)**:
  > *"목표 탭에 들어온 유저가 정중앙에 단정하게 안착한 5개 탭을 보고, 12ms의 기분 좋은 햅틱과 함께 현재 선택된 탭을 한눈에 식별하며 막힘없이 탭을 넘나들게 된다."*
- **기존 전체 기능 영향도 분석**:
  - 목표 탭 서브탭 UI 스타일 및 클릭 햅틱 보강 외 비즈니스 로직 변경 없음.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 5개 탭의 순서나 명칭, 기존 DOM ID(`#goalsSubtabs`) 및 클래스(`.goals-subtabs-grid`)를 변경하지 않는다.
  - 가로 스크롤을 유발하는 무리한 min-width 확장을 피한다.
- **해야 할 것 (Action)**:
  - `#goalsSubtabs.goals-subtabs-grid`에 `justify-content: center !important;`, `align-items: center !important;` 선언.
  - 활성 탭(`.comm-subtab.active`)에 `box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;`, `font-weight: 800 !important;` 부여.
  - 탭 클릭 시 `triggerHapticFeedback(12)` 배선.
  - 375px 모바일 미디어 쿼리 최적화 유지.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: `state.goalsSubTab` 메모리 상태 보존.
- **3호 (4대 뷰 전파 배선도)**: 탭 클릭 시 `renderGoalsScreen()` 즉시 재렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-gsub="personal"]` | 목표 탭 서브탭 | 클릭/터치 | 개인 목표 뷰 전환 & 12ms 햅틱 | 활성 탭 전환 렌더링 |
| `[data-gsub="routine"]` | 목표 탭 서브탭 | 클릭/터치 | 루틴 뷰 전환 & 12ms 햅틱 | 활성 탭 전환 렌더링 |
| `[data-gsub="teamLinked"]` | 목표 탭 서브탭 | 클릭/터치 | 팀 연계 뷰 전환 & 12ms 햅틱 | 활성 탭 전환 렌더링 |
| `[data-gsub="team"]` | 목표 탭 서브탭 | 클릭/터치 | 팀 목표 뷰 전환 & 12ms 햅틱 | 활성 탭 전환 렌더링 |
| `[data-gsub="templateEncyclopedia"]` | 목표 탭 서브탭 | 클릭/터치 | 템플릿 백과사전 전환 & 12ms 햅틱 | 활성 탭 전환 렌더링 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건, 시각 UI 및 인터랙션 고도화.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 375px 초소형 화면에서 '📖 템플릿' 등의 긴 텍스트가 줄바꿈되지 않도록 `white-space: nowrap` 및 `letter-spacing: -0.4px` 방어선 유지.
- **엣지 케이스 (Edge Cases)**:
  - 4대 테마(성소/블랙/화이트/도심) 전환 시 활성 탭 배경과 텍스트의 대비가 4.5:1 이상 유지되도록 테마별 컬러 보존.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css` 내 `#goalsSubtabs.goals-subtabs-grid` 컨테이너에 `justify-content: center`, `align-items: center` 및 그림자/시인성 스타일 보강.
  2. [단계 2]: `index.html` 내 서브탭 클릭 리스너에 `triggerHapticFeedback(12)` 배선.
  3. [단계 3]: `scripts/smoke-test.js`에 #TASK-ES-237 무결성 단언문 추가.
  4. [단계 4]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 그리드 속성은 최신 브라우저 100% 표준 지원되므로 렌더링 실패 가능성 0%.
- **가정의 타당성 검증**:
  - 5열 균등 배분(`repeat(5, 1fr)`)과 중앙 정렬 결합으로 375px 모바일 뷰포트에서 완벽한 대칭 밸런스 달성.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 모든 탭 전환 클릭 시 콘솔 에러 0건.
- `npm test` 337개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.
- Zero Dead-Click 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-237 (본질축: E1/FIX)
- 노션 DB 107번 항목과 완벽히 1:1 일치.
