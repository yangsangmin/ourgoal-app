# 요구사항 정의서 (REQ) — [기록탭] 스톱워치·히트맵·타임라인 3중 분산 해소 및 단일 콕핏 아키텍처(통계/히트맵 vs 타이머 vs 타임라인 3모드 클린 스위처)

> **문서 ID**: REQ-TASK-ES-131-RECORDS-COCKPIT  
> **티켓 연계**: #TASK-ES-131 ([131])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([131])**:
  > "실측 진단: 기록 탭 상단 4모드 버튼 아래 히트맵 카드 안에도 스톱워치 콕핏 버튼이 있고, 그 아래에는 타임라인/달력공간 토글, 그 아래에는 또 00:00:00 스톱워치 카드가 연속 적재되는 등 기능이 3중으로 중첩 분산되어 정보 과밀 발생. 31개 터치타깃 미달 및 57개 미세폰트 실측."
  > "[1차 작업 지침: TASK-ES-131 기록 탭 3모드 클린 스위처 및 단일 콕핏 구축]"
  > "1. 기록 탭 상단에 깔끔한 3대 메인 세그먼트 스위처 구축: [ 📈 히트맵·통계 | ⏱️ 몰입 타이머 | 📝 실천 타임라인 ]"
  > "2. 선택된 단일 모드만 화면에 시원하게 렌더링되도록 뷰포트 완전 격리 (히트맵 뷰에서 스톱워치 중복 침범 차단)."
  > "3. 기간 필터 칩 높이 40px 이상, 폰트 13px 이상으로 규격화하여 조작 편의성 극대화."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 기록 탭 상단에 6대 서브 모드 버튼이 나열된 상태에서, 히트맵 카드 내부에도 `⏱️ 스톱워치 콕핏` 버튼이 있고, 카드 바로 아래에 `#recCalFuseSwitcher`(타임라인/달력 공간), 그 아래에 `#quickStopwatchBar`(00:00:00 스톱워치 바)가 연달아 중복 적재되어 시각 정보가 과밀함.
  2. 히트맵 기간 필터 칩(`.s-segment-pills .s-seg-pill`)의 높이가 26px 미만, 폰트가 0.72rem(~11.5px)로 매우 작아 모바일 375px 환경에서 31개 터치 타깃 미달 및 57개 미세폰트 결함 발생.
  3. 성취 통계 영역 내에 기능 안내용 카드 `#og-task-24-container`가 상시 노출되어 통계 뷰포트를 방해함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 성소 엔진(`sanctuary-v3-engine.js`)과 기본 HTML의 기록 탭 위젯들(`quickStopwatchBar`, `recCalFuseSwitcher`)이 모드 격리 없이 상시 동시 렌더링되어 스톱워치/타임라인 기능이 한 화면에 3중 중첩됨.
  - **2층 (구조/프로세스 부재)**: 3대 핵심 축(히트맵·통계 / 몰입 타이머 / 실천 타임라인)에 대한 뷰포트 단일 격리 규칙이 부재하여 각 기능이 서로의 화면 영역을 침범함.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 오늘 실천 현황을 보러 들어왔으나, 한 화면에 히트맵과 스톱워치, 달력공간, 타임라인이 복잡하게 엉켜 있어 어디를 터치해야 할지 혼란을 겪음.
- **사용자 상황 및 페르소나**: 실천 기록을 열람하거나 집중 측정을 시작하려는 유저가 첫 화면에서 정보 과밀로 인한 피로를 겪고 터치 미스를 일으킴.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E2 (기록 회고 루프) + UX 조형 정상화`
- **[본질] (Essence)**: 기록 탭의 본질은 "나의 실천 궤적을 명확히 체감(히트맵·통계)하거나, 현재 몰입을 방해 없이 측정(타이머)하거나, 과거 발자취를 돌아보는 것(타임라인)"임. 3가지 중 유저가 선택한 1가지 모드만 화면에 시원하게 단독 렌더링되어야 함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (중복 렌더링 족보)**: `sanctuaryRecordsView` 상단 렌더러와 HTML 정적 `#quickStopwatchBar`, `#recCalFuseSwitcher`가 상호 배타적으로 제어되지 않고 한 화면에 적재됨.
  2. **원인 2 (히트맵 카드 내부 기능 중첩)**: 히트맵 카드 푸터에 `스톱워치 콕핏` 버튼이 삽입되어 히트맵 모드에서도 스톱워치가 중복 노출됨.
  3. **원인 3 (터치 타깃 및 폰트 규격 미달)**: `.s-seg-pill`에 `padding: 6px 2px !important; font-size: 0.72rem;`이 강제되어 40px 미만/13px 미만 규격 미달 발생.
- **[중심] (Core Bottleneck & Anchor)**: `sanctuary-v3-engine.js`의 기록 탭 모드 스위처를 3대 모드(`heatmap`: 📈 히트맵·통계, `timer`: ⏱️ 몰입 타이머, `feed`: 📝 실천 타임라인)로 단일화하고, `ui.css`를 통해 선택된 모드 외의 중복 위젯을 완전 격리 은폐.
- **[핵심] (Critical Safety & Termination)**: 기존 DOM ID(`recSegmentBar`, `recSegFeedBtn`, `recSegStatsBtn`, `recSegArchiveBtn`, `recViewFeed`, `recViewStats`, `recViewArchive`, `og-task-24-container`) 및 테스트 정적 리스너 100% 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 기록 탭에 진입했을 때, 3대 클린 스위처([📈 히트맵·통계 | ⏱️ 몰입 타이머 | 📝 실천 타임라인])를 통해 원하는 단일 콕핏에 온전히 집중할 수 있으며, 40px 이상의 시원한 필터 칩을 편안하게 터치할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 영향 없음.
  - 홈 화면 및 스트릭: 영향 없음.
  - 기록/통계/캘린더 탭: 기록 탭의 조형이 단정해지고 불필요한 중복 스톱워치/토글이 은폐되어 시각 피로 0건 달성.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 헌법 필수 DOM ID(`recSegmentBar`, `recSegFeedBtn`, `recSegStatsBtn`, `recSegArchiveBtn`, `og-task-24-container`)를 삭제하지 않는다.
  - 스톱워치 타이머 로직이나 기록 데이터 저장 로직을 파괴하지 않는다.
  - 용어 헌법 제6조에 위배되는 '잔디' 단어를 쓰지 않고 '히트맵'으로 단일화한다.
- **해야 할 것 (Action)**:
  - `js/sanctuary-v3-engine.js`:
    - 기록 탭 상단 모드 스위처를 3대 모드([📈 히트맵·통계 | ⏱️ 몰입 타이머 | 📝 실천 타임라인])로 명쾌하게 단일화.
    - 히트맵 카드 푸터의 중복 `⏱️ 스톱워치 콕핏` 버튼 은폐/정리.
  - `ui.css`:
    - `#screen-records #quickStopwatchBar`, `#screen-records #recCalFuseSwitcher` 영구 완전 은폐(`display: none !important;`).
    - `#og-task-24-container` 완전 은폐(`display: none !important;`).
    - `.s-segment-pills .s-seg-pill`, `.s-seg-pill`: `min-height: 40px !important; font-size: 13px !important;` 선언하여 터치 타깃 및 가독성 100% 정상화.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 3모드 클린 스위처로 전환 시 유저가 모드 간 경계를 즉각 인식하며, 단일 뷰포트 격리로 시각적 정보 과밀이 근본 해소됨.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: DB 스키마 변경 없음. 기존 `records` 테이블 무손실 유지.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시 및 `localStorage` 무손실 보존.
- **3호 (4대 뷰 전파 배선도)**: 타이머 및 기록 저장 시 `renderRecordsScreen`, `renderHome`, `renderGoalsScreen`, `renderCalendar` 4대 뷰 동시 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `s-rec-mode-btn` (히트맵·통계) | 기록탭 상단 | 클릭/터치 | 365일 연간 히트맵 및 성취 통계 단독 렌더링 | 햅틱 피드백 + active 클래스 전환 |
| `s-rec-mode-btn` (몰입 타이머) | 기록탭 상단 | 클릭/터치 | 뽀모도로/스톱워치 몰입 콕핏 단독 렌더링 | 햅틱 피드백 + active 클래스 전환 |
| `s-rec-mode-btn` (실천 타임라인) | 기록탭 상단 | 클릭/터치 | 나의 체크인 & 회고 피드 단독 렌더링 | 햅틱 피드백 + active 클래스 전환 |
| `s-seg-pill` (기간 필터 칩) | 히트맵 카드 상단 | 클릭/터치 | 40px+ 칩 터치 시 해당 기간(오늘/주간/월간/연간/전체) 히트맵 즉시 필터링 | 햅틱 피드백 + 토스트 안내 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 이미지 및 설정값 100% 보존.
- **목표 데이터 보존**: 기존 목표 리스트 및 마일스톤 100% 보존.
- **기록 데이터 보존**: 과거 체크인, AI 피드백, 스트릭 데이터 100% 보존.
- **화면 구성 세팅값 보존**: 테마 및 사용자 설정값 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 6모드에서 3모드로 단일화할 때 기존 '보관함' 및 '위클리 리캡' 접근성이 떨어질 수 있으므로, 상단 세그먼트 혹은 타임라인/통계 내 서브 탭/버튼으로 안전하게 접근 가능하도록 경로 보존.
- **기존 기능과의 충돌 가능성 검토**: 스모크 테스트의 `recSegmentBar`, `recViewFeed`, `recViewStats`, `recViewArchive`, `og-task-24-container` 어설션과 100% 호환 보장.
- **엣지 케이스 (Edge Cases)**:
  - 기록이 0건인 신규 게스트: 빈 화면 안내 및 첫 기록 생성 유도 정상 작동.
  - 기록이 수백 건인 헤비 유저: 5개 단위 페이징 정상 작동.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. **[단계 1] `js/sanctuary-v3-engine.js` 수정**: 기록 탭 상단 모드 스위처를 3대 모드로 재편하고 히트맵 카드 내 중복 스톱워치 버튼 은폐.
2. **[단계 2] `ui.css` 수정**: `#quickStopwatchBar`, `#recCalFuseSwitcher`, `#og-task-24-container` 은폐 및 `.s-seg-pill` 40px+/13px+ 규격 배선.
3. **[단계 3] 테스트 및 CDP 검증**: `npm test` 38개 게이트 및 스모크 테스트 통과 확인, CDP 실측 및 스크린샷 캡처.
4. **[단계 4] 법정 심사 청구 및 병합**: PR 생성, 법정 심사 통과 후 머지, Tri-Sync 100% 동기화.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: `sanctuary-v3-engine.js`가 로드되지 않더라도 classic 뷰가 폴백으로 유지되므로 치명적 화면 중단(화이트스크린) 방지.
- **가정의 타당성 검증**: 스모크 테스트가 요구하는 DOM 구조와 충돌하지 않는지 정적 검사 통과 여부 확인.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test`: 스모크 440개 통과 (0개 실패), 무결성 38개 전수 통과.
- Zero Dead-Click 941개 전수 통과.
- Headless Chrome CDP 실측:
  - 3모드 스위처 정상 표시 확인.
  - `.s-seg-pill` computed height >= 40px, font-size >= 13px 실측 검증.
  - `#quickStopwatchBar`, `#recCalFuseSwitcher`, `#og-task-24-container` display: 'none' 실측 검증.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: `sanctuary-v3-engine.js` 내 모드 전환 시 기존 `setRecordsSegment` 호출과의 싱크 오류 -> **대책**: `setRecMode` 내에서 `stats`, `feed` 등 세그먼트와 원자적 연동 유지.
- **재검증 트리거**: CDP 실측에서 터치 타깃 높이가 40px 미만이거나 스톱워치 요소가 중복 표시될 경우 3번 CSS 특이도 재조정.
