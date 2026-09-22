# 요구사항 정의서 (REQ) — 일정탭 대표 안내멘트 시인성 개선 및 공간 효율적 간결 문구 재배치

> **문서 ID**: REQ-TASK-ES-240-CALENDAR-HEADLINE-VISIBILITY  
> **티켓 연계**: #TASK-ES-240  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 110번 항목:  
  > **"일정탭의 대표 안내멘트 시인성 개선 및 효과적(공간활용) 문구 배치"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 일정 탭 상단 헤드라인(`#calHeadlineSentence`)이 공통 `.toss-headline` 스타일을 상속받아 상하 마진(10px, 14px)과 폰트 크기(1.25rem)로 인해 세로 영역을 과도하게 차지함.
  2. 하단 서브 안내 배너(`.cal-sub-guide`)의 마진과 중첩되어 캘린더 그리드 상단 여백이 비대해지고, 모바일 375px 해상도에서 달력 하단 셀이 화면 밖으로 밀려 스크롤이 강제됨.
  3. 헤드라인과 사진일기 안내 칩 간의 시각적 위계 및 조화가 미흡하여 첫 뷰포트 인지 속도가 저하됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 안내 배너 닫기 시 미세 햅틱 피드백 부재.
  - **2층 (구조/프로세스 부재)**:
    - 일정 탭 전용 헤드라인 및 서브 가이드의 세로 압축 스타일 규칙 미선언.
  - **3층 (시스템/유저 체감 괴리)**:
    - 사용자는 일정 탭에 들어왔을 때 즉시 이번 달/이번 주의 날짜와 도트를 한눈에 보고 싶은데, 상단 멘트가 캘린더 뷰포트를 잠식.
- **사용자 상황 및 페르소나**:
  - 구글 캘린더, 타임트리처럼 스크롤 없이 한 화면에서 월간 일정을 시원하게 조망하고 싶은 모바일 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1 & FIX (캘린더 진입 시 375px 무스크롤 달력 뷰포트 확보 및 시인성 극대화)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"상단 헤드라인과 서브 안내의 높이를 32px 이하로 초밀축하여, 모바일 375px 화면에서 스크롤 없이 5~6주 달력 전체가 시원하게 첫 뷰포트에 100% 안착되도록 만드는 고효율 캘린더 뷰포트 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (공통 헤드라인 클래스 과다 여백)**:
     - `.toss-headline`의 마진(10px 0 14px)과 폰트 크기(1.25rem)가 캘린더 뷰포트를 아래로 밀어냄.
  2. **원인 2 (서브 안내 배너 높이 과다)**:
     - `.cal-sub-guide`의 패딩과 마진이 압축되지 않아 상단 여백 누적.
  3. **원인 3 (모바일 375px 전용 규칙 부재)**:
     - 모바일 미디어 쿼리에서 캘린더 헤드라인 전용 컴팩트 규칙 누락.
- **[중심] (Core Bottleneck & Anchor)**:
  - `#calHeadlineSentence`에 `margin: 4px 0 8px 0 !important;`, `font-size: 1.05rem !important;`, `line-height: 1.3 !important;`, `color: var(--ink) !important;`를 적용하고, `.cal-sub-guide`를 높이 32px 이하로 인라인 압축.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 `#calHeadlineSentence` 및 `#sanctuaryCalendarView`, `#btnHideCalDiaryGuide` 100% 보존.
  - 4대 테마 명암 대비 4.5:1 준수 및 `npm test` 100% ALL PASS.
- **체감 가설 (User Experience Hypothesis)**:
  > *"상단이 한결 깔끔해지고, 달력의 날짜 칸과 이벤트 도트들이 첫 화면에 한눈에 시원하게 들어와 오늘과 이번 주의 일정을 즉시 확인한다."*
- **기존 전체 기능 영향도 분석**:
  - 일정 탭 상단 타이포그래피 및 여백 압축 외 타 기능 영향도 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 헤드라인 ID(`#calHeadlineSentence`) 또는 배너 ID(`#btnHideCalDiaryGuide`)를 변경하지 않는다.
  - 달력 그리드 자체의 기능이나 날짜 셀 크기를 축소하지 않는다.
- **해야 할 것 (Action)**:
  - `ui.css`에 `#calHeadlineSentence` 압축 스타일 및 480px 미디어 쿼리 선언.
  - `.cal-sub-guide`를 높이 32px 이하의 콤팩트 인라인 칩 스타일로 다듬기.
  - `btnHideCalDiaryGuide` 클릭 시 10ms 햅틱 배선.
  - 모바일 375px 해상도에서 1줄 노출 및 달력 가시 뷰포트 확보.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: `ourgoal_hide_diary_guide` 로컬스토리지 유지.
- **3호 (4대 뷰 전파 배선도)**: `renderCalendar()` 갱신 유지.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#calHeadlineSentence` | 일정 탭 상단 | 조회/시각인지 | 1줄 압축 볼드 헤드라인 노출 | 4대 테마 고대비 텍스트 |
| `#btnHideCalDiaryGuide` | 서브 가이드 우측 | 클릭/터치 | 사진일기 안내 배너 닫기 & 10ms 햅틱 | 화면에서 즉시 닫힘 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 안내 배너가 닫힌 상태에서도 상단 헤드라인과 캘린더 본체 간 여백이 자연스럽게 이어지도록 `margin-bottom: 8px` 방어선 구축.
- **엣지 케이스 (Edge Cases)**:
  - 월간/주간/일간 뷰 전환 시 헤드라인 시인성 유지.
  - 4대 테마(성소/블랙/화이트/도심) 전환 시 `var(--ink)` 대비율 4.5:1 이상 검증.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 `#calHeadlineSentence` 압축 스타일 및 480px 미디어 쿼리 추가.
  2. [단계 2]: `ui.css` 내 `.cal-sub-guide` 높이 32px 이하 인라인 칩 스타일 다듬기.
  3. [단계 3]: `index.html` 내 `#btnHideCalDiaryGuide` 클릭 리스너에 10ms 햅틱 추가.
  4. [단계 4]: `scripts/smoke-test.js`에 #TASK-ES-240 무결성 단언문 추가.
  5. [단계 5]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - 순수 CSS 스타일 압축 및 이벤트 강화이므로 스크립트 장애 위험 0%.
- **가정의 타당성 검증**:
  - 세로 공간 압축을 통해 375px 모바일 뷰포트에서 달력 날짜 그리드가 첫 화면에 시원하게 확보됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- `#calHeadlineSentence` margin: 4px 0 8px 0, font-size: 1.05rem, line-height: 1.3 확립.
- `.cal-sub-guide` max-height 32px 콤팩트 인라인 칩 확립.
- `npm test` 338개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-240 (본질축: E1/FIX)
- 노션 DB 110번 항목과 완벽히 1:1 일치.
