# 요구사항 정의서 (REQ) — 전 탭 ‘이 페이지 활용법’ 우측 최상단 이름 왼쪽 배치

> **문서 ID**: REQ-TASK-ES-266-TOP-PAGE-GUIDE-REPOSITION  
> **티켓 연계**: #TASK-ES-266 (노션 생각 메모장 [09]번, Page ID: `3de598db-9096-819f-8451-dd1d6eba7531`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: FIX / UX (탑바 정보 구조 및 가이드 접근성 혁신)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"모든 탭의 ‘이 페이지 활용법’들을 우측 최상단의 이름 표시 왼쪽에 위치시켜."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 현재 최상단 고정 탑바(Topbar) 우측 영역(`topbar-right`)에서 활용법 버튼은 `topbar-actions` 내부의 `topHomeGuideBtn`으로 좌측 구석에 있고, 그 중간에 알림 버튼(`topNotifBtn`)이 끼어 있으며, 우측 끝에 유저 칩(`topUserChip`: `#topUserName` + `#topAvatar`)이 위치하여 **이름 표시 바로 왼쪽에 가이드 버튼이 위치하지 않는 구조적 단절**이 존재함.
  2. 버튼 텍스트가 축약형인 `💡 활용법`으로만 표시되어 있어, 사용자가 "이 버튼이 현재 탭/페이지의 활용법인지, 앱 전체의 일반 설명인지" 직관적으로 인지하기 어려움.
  3. 모바일 375px 환경에서 사용자 이름(`topUserName`)의 글자 수가 길어질 경우 가로 넘침이 발생할 수 있는 맹점 방어 미비.
- **표면 아래 기저 층위 분석**:
  - **1층 (배치 순서 및 시각 위계 결함)**: 알림 벨(🔔)이 가이드 버튼과 유저 이름 사이에 끼어 있어, 상민님이 의도하신 "우측 최상단 이름 표시 바로 왼쪽"이라는 직관적 인지 앵커가 깨져 있음.
  - **2층 (명칭 명확성 부재)**: 단순 `활용법` 대신 상민님이 지정하신 `이 페이지 활용법`이라는 맥락형 레이블이 적용되지 않아 페이지 특화 기능 안내로서의 정체성 결여.
  - **3층 (전 탭 동적 연동성 강화 필요)**: 탭 전환(`setTab`) 시 현재 탭의 한국어 명칭과 연계된 툴팁/접근성 피드백을 제공하여 6대 탭(홈·목표·일정·기록·소통·설정) 어디서든 일관된 사용성을 제공해야 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX / UX (상단 네비게이션 공간 질서 확립 및 사용자 길잡이 접근성 극대화)
- **[본질] (Essence)**:
  - 아워골에 접속한 사용자가 6대 탭(홈, 목표, 일정, 기록/통계, 소통, 설정) 중 어느 탭을 탐색하더라도, 화면 우측 최상단에 있는 자신의 이름 바로 왼쪽에서 항상 단정하고 또렷하게 빛나는 `이 페이지 활용법`을 원터치로 누를 수 있어야 하며, 누르는 즉시 해당 탭의 100% 활용법 모달이 즉각 호출되는 완벽한 0ms 반응성과 인체공학적 조형 질서를 제공하는 것이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `topbar-right`의 DOM 순서가 `topbarActions` ➔ `topNotifBtn` ➔ `topUserChip` 순으로 배치되어 알림 벨 아이콘이 가이드 버튼과 유저 이름 사이에 위치함.
  2. **원인 2**: 버튼 레이블이 상민님 지정 규격인 `이 페이지 활용법`이 아닌 `💡 활용법`으로 축약되어 있었음.
  3. **원인 3**: 375px 실기기 모바일 뷰포트에서 이름 표시(`topUserName`)에 대한 명시적 `text-overflow: ellipsis` 가드가 누락되어 긴 닉네임 시 레이아웃 왜곡 위험이 상존함.
- **[중심] (Core Bottleneck & Anchor)**:
  - `topbar-right` 내 요소 순서 재배치: `[알림 벨 (#topNotifBtn)]` ➔ `[💡 이 페이지 활용법 (#topHomeGuideBtn)]` ➔ `[이름 표시 (#topUserName)] [아바타 (#topAvatar)]`.
  - 버튼 클릭 시 현재 `state.activeTab` 기준 `showTabUsageGuide(activeTab)` 직통 호출.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 `#topHomeGuideBtn` ID 및 `showTabUsageGuide` 바인딩 100% 보존 (스모크 테스트 383개 불파괴).
  - 375px 모바일 뷰포트에서 가로 스크롤(오버플로우) 0px 절대 보증.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 어떤 탭을 보다가도 우측 최상단의 자기 이름 바로 왼쪽에 있는 '이 페이지 활용법' 버튼을 1초 만에 발견하고 가볍게 탭하면, 지금 보고 있는 페이지의 꿀팁과 가이드가 번개처럼 나타나 앱 사용의 즐거움과 확신을 즉각 체감한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존에 배선된 `#topHomeGuideBtn` ID를 임의로 변경하여 기존 테스트 및 회귀 방지선을 깨뜨리는 행위 금지.
  - 각 화면 본문에 중복 가이드 버튼을 난립시키는 편의주의적 UI 오염 금지 (전역 탑바 단일 배치 원칙 엄수).
  - 모바일 375px 화면에서 버튼이 줄바꿈되거나 탑바 높이를 왜곡하는 CSS 방치 금지.
- **해야 할 것 (Action)**:
  1. `index.html` 내 `topbar-right`의 DOM 구조를 재배치하여 `#topNotifBtn` 다음에 `#topHomeGuideBtn`를 위치시키고, 바로 그 우측에 `#topUserChip`(`topUserName`)이 밀착되도록 배치.
  2. 버튼 텍스트를 상민님 지시 원문 그대로 **`💡 이 페이지 활용법`**으로 정직하게 표기.
  3. `setTab(tab)` 전환 시 버튼의 title 툴팁을 `이 페이지 활용법 (현재탭)`으로 동적 갱신하여 맥락 인지 강화.
  4. 클릭 시 12ms 미세 햅틱 피드백 제공 및 `showTabUsageGuide(activeTab)` 호출.
  5. `ui.css`에 `.topbar-guide-btn` 및 `#topUserName` 말줄임(`ellipsis`) 규칙을 추가하여 375px 가로 스크롤 완벽 차단.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: UI 레이아웃 순서 및 안내 버튼 재배치 작업으로 별도 DDL 변경 불요.
- **2호 (스마트 스토리지 분기 설계)**: 최근 확인한 가이드 탭 키는 클라이언트 메모리(`state.activeTab`)를 기준으로 즉시 평가.
- **3호 (4대 뷰 전파 배선도)**: 탭 전환 시 `setTab` 함수 내에서 `#topHomeGuideBtn`의 접근성 속성 및 툴팁이 원자적으로 동기화됨.

### 3-2. 전수 인터랙션 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#topHomeGuideBtn` | 최상단 탑바 우측 (이름 왼쪽) | 클릭 / 터치 | 12ms 햅틱 + 현재 활성 탭(`state.activeTab`) 가이드 허브 모달 즉시 팝업 | 미정의 탭일 경우 'home' 가이드 안전 폴백 |

---

## 4. [원칙 ④] 스티브 잡스 디테일 및 UX 무결성 (Steve Jobs Details & UX Integrity)
- **자연스러운 시선 이동**: 유저가 우측 최상단 자신의 아바타와 이름을 확인할 때, 바로 그 시선 동선(왼쪽 4px)에 정갈한 연보라빛 배지 형태의 `💡 이 페이지 활용법`이 위치하여 가장 자연스럽고 무자각적인 탭 경험을 제공.
- **모바일 375px 단정함**: 작은 화면에서도 닉네임과 버튼이 한 줄로 우아하게 공존하도록 정밀한 폰트/패딩/말줄임을 설계.

---

## 5. [원칙 ⑤] 리스크 검토 및 회귀 방지 (Risk Analysis & Regression Prevention)
- **리스크**: 닉네임이 10자 이상 긴 사용자 접속 시 탑바 가로 폭 초과 위험.
  - **대응**: `#topUserName`에 `max-width: 72px`(375px 이하에서는 `56px`), `overflow: hidden`, `text-overflow: ellipsis` 적용으로 1px의 밀림도 원천 차단.

---

## 6. [원칙 ⑥] 완료 조건 정의 및 절차 재검증 (Definition of Done & Re-verification)
1. `#topHomeGuideBtn`이 `#topUserName` 바로 왼쪽에 물리적으로 배치되어 있음을 DOM 및 CSS로 검증.
2. 버튼 텍스트가 `💡 이 페이지 활용법`으로 일치함을 검증.
3. 클릭 시 `showTabUsageGuide`가 현재 활성 탭(`state.activeTab`)을 인자로 호출함을 검증.
4. 단위 테스트 `tests/top-page-guide-reposition.test.js` 100% PASS.
5. 스모크 테스트 `scripts/smoke-test.js` 384개 ALL PASS.
6. 헌법 게이트 `scripts/verify-integrity-gate.js` 38개 ALL PASS.
7. Tri-Sync 100% 무결 확인 및 GitHub Court 통과.

---

## 7. [원칙 ⑦] 구현 파일 범위 및 회귀 방지 (Target Files & Safety)
- `index.html`: 탑바 우측 구조 재배치, 버튼 텍스트 갱신, 탭 전환 연동.
- `ui.css`: `.topbar-guide-btn`, `#topUserName` 반응형 스타일링.
- `tests/top-page-guide-reposition.test.js`: 신규 단위 테스트.
- `scripts/smoke-test.js`: `#TASK-ES-266` 단언문 추가.
- `docs/rules/TICKETS.md`: 티켓 대장 갱신.
- `reports/TASK-ES-266/claims.json`: 법정 청구서.

---

## 8. [원칙 ⑧] 본질 측정 및 사후 모니터링 (Essence Metrics & Review)
- 전 6대 탭 진입 시 '이 페이지 활용법' 버튼 가시성: 100%.
- 이름 표시 바로 왼쪽 배치 정합도: 100%.
- 클릭 시 활성 탭 가이드 호출 정확도: 100%.
- 375px 모바일 뷰포트 가로 오버플로우: 0px.
