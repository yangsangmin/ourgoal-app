# 요구사항 정의서 (REQ) — 일정탭 '주간' 뷰 전환 버튼 클릭 시 비정상 배경색·대비 오류 수정 및 활성 상태 시인성 개선

> **문서 ID**: REQ-TASK-ES-241-CALENDAR-WEEK-THEME-CONTRAST  
> **티켓 연계**: #TASK-ES-241  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 111번 항목:  
  > **"일정탭의 '주간' 버튼 누르면 색상이 이상함. 시인성 개선 조치필요."** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 일정 탭 상단 모드 바에서 [📆 주간] 버튼 클릭 시, 화이트 테마 및 다크 테마에서 활성 배경색과 텍스트 대비가 어긋나 글자가 흐려 보이거나 이질적인 색상으로 렌더링됨.
  2. 주간 달력 카드(`.s-week-cal-card`)가 화이트 테마 오버라이드 목록에서 누락되어, 화이트 모드에서도 어두운 다크 그라데이션으로 표출되는 심각한 테마 불일치 발생.
  3. 주간 행(`.s-week-day-row`) 및 일정 항목 카드(`.s-cal-item`) 내부에 하드코딩된 `rgba(255,255,255,0.04)`로 인해 라이트 테마에서 투명/흰색 뭉개짐 현상 발생.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - `html[data-theme="white"]`에서 `.s-week-cal-card` 배경색 및 테두리 규칙 누락.
  - **2층 (구조/프로세스 부재)**:
    - `.s-cal-mode-btn.active`에 테마별 전용 고대비 토큰 대신 반투명 틴트가 적용되어 가독성 저하.
    - `js/sanctuary-v3-engine.js` 주간 템플릿 내 인라인 하드코딩 색상 잔존.
  - **3층 (시스템/유저 체감 괴리)**:
    - 주간 버튼을 누르는 순간 테마가 깨져 보여 "버그인가?" 하는 심리적 불안감 유발.
- **사용자 상황 및 페르소나**:
  - 주간 단위로 일정을 관리하며 화이트/블랙/성소/도시 모드를 전환하여 사용하는 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1 & FIX (크로스 테마 4.5:1 이상 대비율 확립 및 주간 뷰 색상 무결성 복원)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"4대 테마 전반에서 '주간' 모드 전환 버튼과 주간 캘린더 카드, 일자별 일정 항목이 눈부심이나 글자 묻힘 없이 단정한 브랜드 컬러와 고대비(4.5:1 이상)로 즉각 표출되는 완벽한 크로스 테마 캘린더 렌더링 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (화이트 테마 .s-week-cal-card 셀렉터 누락)**:
     - `.s-month-cal-card`, `.s-timeline-card`만 선언되고 `.s-week-cal-card`가 누락되어 다크 배경 잔존.
  2. **원인 2 (.s-cal-mode-btn.active 대비율 미달)**:
     - 화이트 모드에서 `rgba(5, 150, 105, 0.12)` 반투명 배경에 녹색 글자가 얹혀 시인성 부족.
  3. **원인 3 (주간 뷰 인라인 하드코딩 rgba 색상)**:
     - `.s-cal-item`, `.s-week-day-detail`에 하드코딩된 rgba(255,255,255,...) 인라인 스타일 존재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `html[data-theme="white"] .s-cal-mode-btn.active`를 에메랄드 솔리드(#059669) + 화이트 텍스트(#FFFFFF)로 단일화하고, `.s-week-cal-card` 및 `.s-week-day-row`, `.s-cal-item`을 테마 변수(`var(--card)`, `var(--surface-2)`, `var(--rule)`, `var(--ink)`)로 전면 교정.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 헌법 검증(`.s-cal-mode-btn` 어포던스 및 `s-week-grid` 배선) 100% 보존.
  - WCAG 2.1 AA 4.5:1 이상 명암 대비 확보 및 `npm test` 100% ALL PASS.
- **체감 가설 (User Experience Hypothesis)**:
  > *"'주간' 버튼을 누르면 단정한 브랜드 컬러로 활성화되며, 아래 펼쳐지는 7일간의 주간 일정이 어떤 테마에서도 눈부심이나 색상 왜곡 없이 선명하게 표시된다."*
- **기존 전체 기능 영향도 분석**:
  - 주간 모드 버튼 및 주간 뷰 스타일 정상화 외 일정 로직 변경 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 주간 모드 전환 함수(`OurgoalSanctuaryV3.setCalMode('week')`)나 DOM 구조를 파괴하지 않는다.
  - 비활성 버튼의 기본 어포던스 스타일(`background: rgba(255, 255, 255, 0.05);`)을 훼손하지 않는다.
- **해야 할 것 (Action)**:
  - 화이트 테마: `html[data-theme="white"] .s-cal-mode-btn.active { background: #059669 !important; color: #FFFFFF !important; border-color: #059669 !important; font-weight: 700; }`
  - 성소/블랙 테마: `.s-cal-mode-btn.active { background: var(--brand) !important; color: #FFFFFF !important; border-color: var(--brand) !important; font-weight: 700; }`
  - `html[data-theme="white"] .s-week-cal-card`, `.s-week-day-row`, `.s-cal-item` 고대비 화이트 테마 규칙 완비.
  - `.s-week-day-row.selected`에 선명한 좌측 하이라이트 보더(`border-left: 3px solid var(--brand)`) 배선.
  - `js/sanctuary-v3-engine.js` 내 인라인 하드코딩 rgba 색상을 CSS 테마 변수로 교체.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지 영향 없음.
- **3호 (4대 뷰 전파 배선도)**: 캘린더 모드 전환 이벤트 시 즉시 렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `.s-cal-mode-btn (주간)` | 일정 상단 모드 바 | 클릭/터치 | 주간 뷰 전환 & 선명한 활성 색상 표출 | 10ms 햅틱 및 고대비 버튼 활성화 |
| `.s-week-day-row` | 주간 캘린더 그리드 | 클릭/터치 | 해당 일자 선택 & 좌측 보더 강조 & 하단 상세 갱신 | 3px solid var(--brand) 하이라이트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 화이트 테마와 블랙 테마의 `.s-week-cal-card` 배경이 확실히 분기되는지 정밀 점검.
- **엣지 케이스 (Edge Cases)**:
  - 선택된 날짜(`.s-week-day-row.selected`)와 오늘 날짜(`.s-week-day-badge.today`)가 중첩될 때 번짐 없이 완벽한 시인성 유지.
  - 4대 테마 전반에서 주간 일정 상세 타이틀과 시간 텍스트 명암비 4.5:1 이상 확인.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css` 내 `.s-cal-mode-btn.active` 테마별 고대비 스타일 선언.
  2. [단계 2]: `ui.css` 내 `html[data-theme="white"]`에 `.s-week-cal-card`, `.s-week-day-row`, `.s-cal-item` 테마 규칙 추가.
  3. [단계 3]: `ui.css` 내 `.s-week-day-row.selected` 좌측 하이라이트 보더 선언.
  4. [단계 4]: `js/sanctuary-v3-engine.js` 주간 템플릿 내 하드코딩 인라인 색상을 CSS 테마 변수로 교체.
  5. [단계 5]: `scripts/smoke-test.js`에 #TASK-ES-241 무결성 단언문 추가.
  6. [단계 6]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 우선순위(`!important`)를 테마 규칙에 명확히 부여하여 기존 어포던스 테스트와의 충돌 위험 0%.
- **가정의 타당성 검증**:
  - 테마별 전용 컬러 토큰 바인딩으로 주간 버튼 클릭 시의 비정상 배경색 및 글자 번짐 문제 완벽 해소.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 화이트 테마에서 '주간' 버튼 솔리드 에메랄드(#059669) 및 화이트 텍스트 표출.
- 화이트 테마에서 주간 카드(.s-week-cal-card) 백색 배경(#FFFFFF) 표출.
- `npm test` 338개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-241 (본질축: E1/FIX)
- 노션 DB 111번 항목과 완벽히 1:1 일치.
