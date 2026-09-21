# 요구사항 정의서 (REQ) — 아이폰 iOS Safe Area 상단 차폐 및 목표 탭 서브탭·알약 네비게이션 전수 정상화

> **문서 ID**: REQ-TASK-ES-205-IOS-SAFE-AREA-GOALS-TOP-UX  
> **티켓 연계**: #TASK-ES-205  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > "아이폰에서 이렇게 보여서 위에 버튼들 안보이고, 활용도 못해. 원인파악해"
  > (첨부 사진: 아이폰 14/15/16 Pro 캡처 — 상단 상태바(7:49, 다이나믹 아일랜드, 5G, 배터리) 바로 밑에 목표 알약 버튼 `주 4회 헬스장 루틴 정착`, `주 4회 헬스장 방문하기 💪`의 윗부분이 잘려 있고, 그 위에 있어야 할 5개 서브탭 `[개인 목표] [루틴] [팀 연계] [팀 목표] [📖 템플릿]`은 완전히 사라져 보이지 않으며 터치도 불가능한 상태)

- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **목표 탭 상단 5대 서브탭 (`#goalsSubtabs`) 증발**:
     - `[개인 목표] [루틴] [팀 연계] [팀 목표] [📖 템플릿]` 서브탭 5종이 아이폰 화면에서 완전히 시야 밖으로 사라져 보이지 않음.
  2. **목표 선택 알약 버튼 (`.s-goal-pills-wrap`) 상단 짤림**:
     - 서브탭 아래에 위치해야 할 목표 선택 알약(`주 4회 헬스장...`)이 화면 맨 위에 맞닿아 나타나며, 버튼 상단 약 10~15px이 아이폰 상단 상태바 하단과 겹쳐 잘려 나감.
  3. **터치 먹통 및 기능 활용 불가**:
     - 아이폰 iOS Safari 및 홈 화면 PWA에서는 상단 상태표시줄(0~59px) 영역에 걸친 터치 이벤트가 시스템 제스처(스크롤 투 탑 등)로 흡수되거나 노치 데드존에 갇혀 버튼 클릭이 전혀 동작하지 않음.

- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - HTML `<meta name="viewport" content="... viewport-fit=cover">` 및 `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` 선언으로 인해 웹 화면이 노치/다이나믹 아일랜드 최상단(Y=0)부터 전면 렌더링됨.
    - 그러나 본문 컨테이너인 `main.screens`의 상단 패딩이 `padding-top: 4px`로 하드코딩되어 있고 `env(safe-area-inset-top)`가 전혀 누락됨.
    - 그 결과 목표 탭의 첫 요소인 `#goalsSubtabs`의 물리적 Y좌표가 `4px ~ 54px`에 배치되어 아이폰 다이나믹 아일랜드 Safe Area인 `0px ~ 59px` 뒤에 100% 묻혀 시각적으로 완전히 은폐됨.
    - 그 뒤를 잇는 `.s-goal-pills-wrap`이 Y=66px 부근에 오면서 상태바 경계선(59px)에 걸쳐 상단 절반이 잘려 보임.
  - **2층 (구조/프로세스 부재)**:
    - 테마 통일화 시 상단 여백을 감싸주던 레거시 `.topbar`(`padding: calc(8px + env(safe-area-inset-top))`)를 4개 테마 전체에서 `display: none !important;`로 가렸음에도, 각 화면의 상단 안전 여백을 대체 지정하지 않은 채 방치함.
    - 서브탭 Sticky 속성이 `top: 0`으로만 선언되어 있어, 스크롤을 내려도 노치 뒤의 데드존(0px)에 계속 고정되어 유저 눈에 영원히 나타나지 않음.
  - **3층 (시스템/유저 체감 괴리)**:
    - 개발자 PC 브라우저(Headless/DevTools)에서는 상단 상태바나 노치가 없으므로 서브탭이 맨 위에 정상적으로 보였으나, 실제 아이폰 실기기에서는 59px의 거대한 다이나믹 아일랜드가 화면 상단을 덮고 있어 사용자는 "버튼이 사라지고 먹통이 되었다"고 심각한 결함으로 체감함.

- **사용자 상황 및 페르소나**:
  - 아이폰(노치/다이나믹 아일랜드 탑재 전 기종)으로 아워골 PWA에 접속하여 목표 탭에서 루틴, 팀 연계, 템플릿을 탐색하거나 목표를 바꾸려는 모든 실제 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: `FIX & INFRA` (iOS Safe Area 상단 인셋 물리적 결함 복구 및 전 탭 모바일 뷰포트 무결성 확립)
- **[본질] (Essence)**:
  - 겉모습의 착시(PC 크롬 테스트에서는 정상으로 보이는 현상)를 걷어낸 이 문제의 진짜 실체:
  - **"모바일 OS(iOS)의 하드웨어 물리 규격(노치, 다이나믹 아일랜드, 상태표시줄 Safe Area)을 웹 레이아웃 시스템에 완벽히 동기화하지 않아 발생하는 치명적인 하드웨어-소프트웨어 인터랙션 단절"** (헌법 제3조 제6항 위반 상태).
  - **3대 철학 심사 기준 점검**:
    1. **무공해성 (Anti-Pollution)**: 버튼이 잘리거나 안 보여서 생기는 유저의 답답함과 스트레스를 0으로 소탕.
    2. **RPG식 체감 (Immediate Self-Efficacy)**: 목표 탭 진입 즉시 5대 서브탭과 목표 알약이 온전하게 눈에 들어와 즉각적인 조작 효능감 제공.
    3. **동류 연대 (Peer Accompaniment)**: 팀 연계 및 템플릿 서브탭으로의 진입로가 언제나 명확하게 열려 있도록 보장.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (`env(safe-area-inset-top)` 누락)**:
     - `ui.css` 193행의 `main.screens { padding: 4px 20px ... }`에서 `padding-top: 4px`만 주어져 있고, `env(safe-area-inset-top)` 계산식이 완전히 결여됨.
  2. **원인 2 (`.topbar` 은폐 후 대체 상단 패딩 미수립)**:
     - `ui.css` 6039행에서 `html[data-theme] .topbar { display: none !important; }`로 기존 safe-area-inset-top을 책임지던 상단바를 숨겼으나, 본문 뷰포트에 상단 인셋을 보전하지 않음.
  3. **원인 3 (Sticky 오프셋의 Safe Area 미반영)**:
     - `#goalsSubtabs`, `.s-cal-modes-wrap`, `.s-rec-modes-wrap`, `.comm-subtabs`가 `position: sticky; top: 0 !important;`로 선언되어 있어, 스크롤 시에도 아이폰 노치 뒤(Y=0)에 고정되어 가려짐.
- **[중심] (Core Bottleneck & Anchor)**:
  - `.screens` 상단 여백을 `calc(8px + env(safe-area-inset-top, 0px))`로 복원하고, 상단 고정 요소(Sticky)들의 `top` 좌표를 `env(safe-area-inset-top, 0px)`로 정렬하여 모바일 OS와 웹 뷰의 1:1 물리적 결속을 완성하는 것.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 안드로이드/데스크톱 뷰포트(안전 여백이 0px인 환경)에서 불필요한 과대 여백이 생기지 않도록 `env(safe-area-inset-top, 0px)` 폴백을 엄격히 적용하고, 기존 743개 클릭 배선 및 335개 단위 테스트 단 1건도 깨뜨리지 않는 것.
- **체감 가설 (User Experience Hypothesis)**:
  > *"아이폰 사용자가 아워골에 접속했을 때, 상태표시줄과 다이나믹 아일랜드 아래로 5개 서브탭과 목표 알약이 시원하게 노출되며, 손가락 터치 시 100% 즉각 반응하여 모든 기능을 온전히 활용할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 데이터/로직 영향: 0 (순수 레이아웃 및 뷰포트 상단 인셋 정상화).
  - 타 탭(홈, 일정, 기록, 소통, 설정) 영향: 상단 제목 및 모드바가 상태표시줄에 가려지던 현상이 전 탭에서 일괄 해소되어 앱 전체의 심미성과 완성도 대폭 상승.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - `padding-top: 50px` 등 특정 아이폰 기종에만 맞춘 고정 픽셀(px) 하드코딩 금지 (안드로이드 및 데스크톱에서 여백 붕괴 유발).
  - 기존 서브탭 DOM 구조나 클래스명 변경 금지.
- **해야 할 것 (Action)**:
  1. **전역 `.screens` 상단 안전 패딩 선언**:
     ```css
     main.screens, .screens {
       padding-top: calc(8px + env(safe-area-inset-top, 0px)) !important;
     }
     ```
  2. **상단 Sticky 컴포넌트 Safe Area 오프셋 정렬**:
     ```css
     #goalsSubtabs.goals-subtabs-grid,
     .s-cal-modes-wrap,
     .s-rec-modes-wrap,
     #screen-comm .comm-subtabs {
       top: env(safe-area-inset-top, 0px) !important;
     }
     ```
  3. **전 6대 탭 상단 마진 및 뷰포트 정합성 전수 검증**:
     - 홈(`sanctuary-top-bar`), 목표(`goalsSubtabs`), 일정(`screen-head`), 기록(`s-rec-modes-wrap`), 소통(`sanctuaryCommView`), 설정(`screen-head`)의 최상단 Y좌표가 최소 `59px` 이상 확보되는지 CDP로 실측.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: CSS 레이아웃 및 뷰포트 인셋 정상화로 스키마 변경 없음 (N/A).
- **2호 (스마트 스토리지 분기 설계)**: 대용량 미디어 추가 없음 (N/A).
- **3호 (4대 뷰 전파 배선도)**: 레이아웃 조정으로 기존 렌더러 호출 100% 유지.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#goalsSubtabs .comm-subtab` (5종) | 목표 탭 상단 | 클릭/터치 | 서브탭(개인, 루틴, 팀연계, 팀목표, 템플릿) 전환 | 노치 침범 없이 100% 터치 수신 및 화면 전환 |
| `.s-goal-pill` (목표 알약들) | 목표 탭 상단 | 클릭/터치 | 활성 목표 변경 및 마운틴 트레일 카드 갱신 | 알약 잘림 없이 온전히 노출 및 즉시 전환 |
| `#sAddGoalBtn` | 목표 탭 상단 | 클릭/터치 | 새 목표 만들기 모달 호출 | 정상 모달 팝업 |
| `.s-cal-mode-btn` (3종) | 일정 탭 상단 | 클릭/터치 | 캘린더 모드 전환 | 노치 간섭 없이 즉시 모드 전환 |
| `.s-rec-mode-btn` (6종) | 기록 탭 상단 | 클릭/터치 | 기록 모드 전환 | 노치 간섭 없이 즉시 모드 전환 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 자산, 목표 리스트, 마일스톤, 테마 설정 100% 불파괴 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - `env(safe-area-inset-top)`는 Safari/Webkit 및 최신 Chromium 모바일에서 지원되나 구형 브라우저에서는 0px로 평가됨. 이를 방지하기 위해 `calc(8px + env(safe-area-inset-top, 0px))` 형태로 8px의 최소 기본 마진을 보장하여 데스크톱 및 구형 기기에서도 시각적 답답함이 없도록 설계함.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 클래스, ID, JS 핸들러를 일체 수정하지 않고 오직 CSS 패딩 및 Sticky 오프셋만 보정하므로 회귀 결함 가능성 0%.
- **엣지 케이스 (Edge Cases)**:
  - 다이나믹 아일랜드 탑재 아이폰 (Top Inset: 59px): 59px + 8px = 67px 여백으로 완벽 노출.
  - 노치 탑재 구형 아이폰 (Top Inset: 47px): 47px + 8px = 55px 여백으로 완벽 노출.
  - 펀치홀 안드로이드 (Top Inset: 24~36px): 해당 높이만큼 안전하게 밀려나 충돌 없음.
  - 데스크톱 일반 브라우저 (Top Inset: 0px): 8px 깔끔한 여백 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css` 내 `.screens` 및 `main.screens` 상단 패딩에 `calc(8px + env(safe-area-inset-top, 0px)) !important;` 선언.
  2. [단계 2]: `ui.css` 내 `#goalsSubtabs.goals-subtabs-grid`, `.s-cal-modes-wrap`, `.s-rec-modes-wrap`, `#screen-comm .comm-subtabs`의 sticky `top` 좌표를 `env(safe-area-inset-top, 0px) !important;`로 동기화.
  3. [단계 3]: `reports/TASK-ES-205/claims.json` 및 `scenarios/goals-safe-area.json` 작성.
  4. [단계 4]: Chrome CDP 모바일 헤드리스 스크립트를 통해 아이폰 뷰포트(393x852)에서 `#goalsSubtabs`의 `top >= 59px` 여부 및 실제 스크린샷 시각 검증.
  5. [단계 5]: `npm test` 예비 검사 및 로컬 법정(`court/judge.js`) 심사.
  6. [단계 6]: Tri-Sync 동기화 실행.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - `env()` 미지원 환경에서도 `calc(8px + 0px)`로 정상 폴백되므로 레이아웃 깨짐 없음.
- **가정의 타당성 검증**:
  - "상단 패딩을 주면 하단 콘텐츠가 아래로 밀려나 바텀 네비에 가려지지 않는가?"
  - 이미 `.screens`에 `padding-bottom: calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 0px) + 48px) !important;`로 112px 이상의 넉넉한 하단 여백이 확보되어 있어 콘텐츠 차폐 우려 0%.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - Sticky 요소의 `top`이 `0`이면 스크롤 시 여전히 노치 뒤로 빨려 들어갈 수 있으므로, 반드시 Sticky의 `top` 역시 `env(safe-area-inset-top, 0px)`로 맞춰주어야 스크롤 시에도 노치 바로 밑에 고정됨을 확인하고 절차에 반영함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- **측정 가능한 확인 기준**:
  1. 아이폰 뷰포트(393x852)에서 `#goalsSubtabs`의 Bounding Client Rect `top`이 상태바 영역(59px) 이상으로 측정되는가? (예: top >= 60px)
  2. `.s-goal-pills-wrap`이 잘리지 않고 온전한 타원 버튼으로 렌더링되는가?
  3. `npm test` 및 `verify-integrity-gate.js` 전수 통과하는가?

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재 블로커**:
  - 일부 특정 테마 오버라이드에서 `padding-top`을 재정의하여 우선순위에서 밀릴 경우.
- **대응책 및 재검증 트리거**:
  - `html[data-theme] .screens` 조합 셀렉터에 `!important`를 명시하여 테마 전환 시에도 일관된 여백 강제.
- **롤백 계획**:
  - Git 커밋 단위로 `git checkout -- ui.css` 즉시 원복 가능.
