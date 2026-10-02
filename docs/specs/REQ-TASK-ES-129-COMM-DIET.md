# 요구사항 정의서 (REQ) — 소통 탭 7단계 피로층 다이어트 및 최신 피드 1초 직통 노출

> **문서 ID**: REQ-TASK-ES-129-COMM-DIET  
> **티켓 연계**: #TASK-ES-129  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([129])**: "실측 진단: 소통 탭 진입 시 러닝메이트 배너 ➔ 타이틀 ➔ 3대 대형 버튼 ➔ 응원 칩 ➔ 3×2 그리드 ➔ 3개 피드필터 ➔ 19개 카테고리 필터 등 무려 7단계 400px 이상의 피로층이 적재되어 피드 글 하나를 보려면 화면을 한참 스크롤해야 함. 동일 버튼(피드, 팀, 동반자)이 2중 중복 노출됨."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. `#commHubGrid` 3대 대형 카드(`피드`, `동반자`, `팀`)와 `#commBody` 내부의 6대 서브탭(`comm-subtabs-grid`: `피드`, `팀`, `동반자`, `DM`, `마니또`, `공유`)이 위아래로 나란히 2중 렌더링되어 사용자를 극도로 혼란스럽게 함.
  2. 상단 헤드라인, 120px 거대 요약 원카드(`commHeroCard`), 플로팅 응원 바, 2중 서브탭, 2개 필터 바가 세로로 400px 이상을 잠식하여 첫 번째 피드 글이 뷰포트 밖으로 밀려남.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `#commHubGrid`의 `switchCommSubTab('crew')`는 실제 소통 탭 서브탭(`companion`)과 불일치하여 상태 단절을 야기함.
  - **2층 (구조/프로세스 부재)**: 서브 기능(동류 소통 현황, 리액션 칩, 서브탭) 추가 시 기존 컴포넌트를 정돈하지 않고 단순 수직 적재(Stacking)함.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 다른 동료들의 열정적인 인증과 응원을 즉시 보고 힘을 얻으려 소통 탭에 오지만, 거대한 메뉴판과 버튼 숲에 막혀 심각한 인지 피로를 겪고 이탈함.
- **사용자 상황 및 페르소나**: 아워골 사용자가 오늘 체크인을 마치고 동료들의 실시간 실천 피드를 확인하여 동기부여를 받고자 소통 탭에 진입함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E3 (동류 발견 및 소통 루프) & UX`
- **[본질] (Essence)**: 소통 탭의 수직 장벽 400px를 120px 이내로 압축(다이어트)하여, 탭 진입 즉시 1초 만에 최신 피드와 동료들의 온기를 직통으로 마주하게 함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. `#commHubGrid`의 3개 카드와 `comm-subtabs-grid` 6개 칩의 불필요한 기능적/시각적 2중 적재.
  2. `commHeroCard`의 고정 세로 패딩(120px) 과다 및 콤팩트 인라인 IA 부재.
  3. 피드 타입 필터와 카테고리 필터가 상하 2열로 분리되어 피드 진입부를 가로막음.
- **[중심] (Core Bottleneck & Anchor)**: 소통 탭 첫 진입 시 첫 피드 카드(또는 피드 작성창)의 상단 시작 위치(Top Offset)를 220px 이내로 단축.
- **[핵심] (Critical Safety & Termination)**: 기존 6대 서브탭(`feed`, `group`, `companion`, `dm`, `manito`, `share`) 및 동반자 초대/DM 배선 100% 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 소통 탭을 눌렀을 때, 거추장스러운 2중 메뉴와 거대 배너가 깔끔하게 1줄 탭바와 콤팩트 상태바로 정돈되어 1초 만에 최신 동료 피드가 한눈에 들어온다."*
- **기존 전체 기능 영향도 분석**:
  - 피드 작성 모달(`openShareToFeedModal`), DM 대화창(`openInAppDmSheet`), 동반자 초대(`renderCommTopInviteSearch`): 100% 정상 작동 유지.
  - 무공해 리액션(`triggerFloatingReaction`): 콤팩트 독으로 보존.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 헌법 게이트 및 스모크 테스트 검증 항목(`{ key: 'feed', label: '피드'`, `comm-subtabs-grid`, `.comm-subtabs-grid .comm-subtab`) 삭제 금지.
  - DM 알림 배지 및 동반자 검색 배선 손상 금지.
- **해야 할 것 (Action)**:
  1. `ui.css`: `#commHubGrid` 중복 3버튼 그리드를 은폐(`display: none !important`)하고, 정규 6대 서브탭(`comm-subtabs-grid`)을 상단 스티키 슬림 칩바로 단일화.
  2. `commHeroCard` 조형 슬림화: 세로 높이를 120px에서 56px 콤팩트 인라인 바 형태로 다이어트하여 화면 상단 공간 60px 이상 확보.
  3. `commFloatingReactionDock`: 피드 상단에 콤팩트 인라인 칩 형태로 정돈.
  4. 피드 첫 요소(작성 바 또는 첫 피드 카드)가 390px 모바일 화면 한 화면 내(상단 240px 이내)에 즉각 노출되도록 IA 배치 완성.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- 레이아웃 및 UX 다이어트 작업으로 DB 스키마 변경 사항 없음.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnCommPostFeed` | 소통 탭 헤더 | 클릭/터치 | 피드 작성 바텀시트/모달 오픈 | 모달 즉각 팝업 |
| `comm-subtab[feed]` | 6대 서브탭 바 | 클릭/터치 | 피드 리스트 즉각 렌더링 | 12ms 햅틱, active 클래스 동기화 |
| `comm-subtab[group]` | 6대 서브탭 바 | 클릭/터치 | 팀(그룹) 리스트 렌더링 | 12ms 햅틱, active 클래스 동기화 |
| `comm-subtab[companion]` | 6대 서브탭 바 | 클릭/터치 | 동반자 목록 및 검색바 렌더링 | 12ms 햅틱, active 클래스 동기화 |
| `comm-subtab[dm]` | 6대 서브탭 바 | 클릭/터치 | 1:1 안심 DM 목록 렌더링 | 12ms 햅틱, active 클래스 동기화 |
| `comm-subtab[manito]` | 6대 서브탭 바 | 클릭/터치 | 마니또 뷰 렌더링 | 12ms 햅틱, active 클래스 동기화 |
| `comm-subtab[share]` | 6대 서브탭 바 | 클릭/터치 | 외부 SNS 공유 카드 렌더링 | 12ms 햅틱, active 클래스 동기화 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 피드 포스트, 동반자 목록, 팀 데이터, DM 대화 내역 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 6대 서브탭(`comm-subtabs-grid`)을 모바일에서 가로 스크롤 가능한 스티키 바로 정돈할 때 터치 영역이 44px 이상 유지되도록 설계함.
- **기존 기능과의 충돌 가능성 검토**: `OurgoalTeamInviteComm`의 DM 읽음 배지(`#dmSubtabBadge`) 및 상단 동반자 검색바 `#commTopCompanionBar` 조건부 렌더링 무결성 확인.
- **엣지 케이스 (Edge Cases)**:
  - 피드가 0건인 신규 유저 상태: 엠프티 스테이트 컴포넌트 깔끔한 노출.
  - 작은 화면(320px): 서브탭 바 `overflow-x: auto` 및 `scrollbar-width: none`으로 터치 스크롤 지원.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `ui.css`: `#commHubGrid` 고특이도 은폐 및 `commHeroCard` 인라인 콤팩트화 스타일링.
  2. `ui.css`: `.comm-subtabs-grid` 모바일 뷰포트 최적화(단일 스티키 횡스크롤 칩바 조형 보강).
  3. `index.html`: 소통 탭 헤더 및 리액션 바 마진 최적화.
  4. 로컬 테스트 및 CDP 측정: 상단 피로층 높이 실측 및 피드 1초 직통 도달성 검증.
- **화면 간 상호연동 전파 규격**:
  - 서브탭 전환 시: `renderCommScreen()` 및 하위 렌더러가 즉시 갱신되어 해당 서브 콘텐츠 정상 출력.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**: `#commHubGrid` 버튼에 이벤트 리스너가 의존하고 있는지 확인하여, `#commHubGrid`를 DOM에서 삭제하지 않고 CSS로 안전하게 은폐하여 기존 JS 레퍼런스 에러를 방지함.
- **가정의 타당성 검증**: 6대 서브탭 바만으로 피드, 팀, 동반자, DM, 마니또, 공유의 모든 기능을 완벽히 접근할 수 있음을 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: `verify-integrity-gate.js` 검증 18번의 `.comm-subtabs-grid` 및 `.comm-subtabs-grid .comm-subtab` 문자열 보존.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- 소통 탭 첫 진입 시 첫 피드 영역 도달 오프셋이 기존 ~420px에서 240px 이내로 40% 이상 다이어트 달성.
- `npm test` 스모크 440개 및 무결성 게이트 38개 전수 통과 (0 failure).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `.comm-subtabs-grid` 스타일 변경 시 기존 3×2 그리드 테스트 단언문 위반 여부.
- **사전 방어 및 우회 로직**: 기존 CSS 클래스 및 스타일 속성을 보존하면서 반응형 미디어쿼리 또는 고특이도 오버라이드로 슬림화 적용.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout ui.css index.html`로 즉시 원복.
- **재검증 트리거**: CDP 실측에서 서브탭 클릭 미작동 발견 시 원칙 2, 3으로 돌아가 이벤트 핸들러 재점검.
