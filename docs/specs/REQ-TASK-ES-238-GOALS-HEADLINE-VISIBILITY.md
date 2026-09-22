# 요구사항 정의서 (REQ) — 목표탭 대표 안내멘트 시인성 개선 및 공간 효율적 간결 문구 재배치

> **문서 ID**: REQ-TASK-ES-238-GOALS-HEADLINE-VISIBILITY  
> **티켓 연계**: #TASK-ES-238  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 108번 항목:  
  > **"목표탭의 대표 안내멘트 시인성 개선 및 효과적(공간활용) 문구 배치"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 목표 탭 상단 헤드라인(`#goalsHeadlineSentence`)이 공통 `.toss-headline` 스타일(기본 font-size 1.25rem, margin 10px 0 14px 0)을 그대로 상속받아 모바일 상단 세로 공간을 과도하게 점유함.
  2. 서브탭과 하위 퀘스트 보드/마일스톤 카드 사이의 수직 여백이 벌어져 첫 뷰포트 내 핵심 실천 액션 카드 도달이 지연됨.
  3. 모바일(375px) 화면에서 폰트 크기와 여백으로 인해 시각적 무게감이 과중해질 우려가 존재함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 상단 서브탭 컨테이너와 헤드라인 간의 여백이 개별 최적화 없이 인라인/공통 스타일에 의존.
  - **2층 (구조/프로세스 부재)**:
    - 목표 탭 전용 헤드라인 타이포그래피(`#goalsHeadlineSentence`) 명시적 스타일 규칙 누락.
  - **3층 (시스템/유저 체감 괴리)**:
    - 사용자는 앱 진입 즉시 실천할 마일스톤을 확인하고자 하나, 상단 헤드라인의 공간 점유로 스크롤 없이 볼 수 있는 정보량이 감소.
- **사용자 상황 및 페르소나**:
  - 토스(Toss), 애플(Apple) 식의 군더더기 없는 미니멀 UI를 선호하며, 앱을 켜자마자 내 목표와 당일 퀘스트에 직관적으로 시선을 집중하고 싶은 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1 & FIX (E1 체크인·목표 루프 첫 뷰포트 공간 최적화 및 시인성 극대화)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"상단 헤드라인의 세로 점유율을 40% 이상 압축하면서도 타이포그래피의 선명한 대비(var(--ink))를 구축하여, 불필요한 스크롤 없이 첫 뷰포트에서 마일스톤과 퀘스트에 온전히 몰입하게 만드는 초슬림 고대비 헤드라인 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (공통 헤드라인 클래스 과다 여백)**:
     - `.toss-headline`의 상하 마진(10px, 14px) 및 font-size(1.25rem)가 탭 상단 밀도에 비해 넓음.
  2. **원인 2 (서브탭과 헤드라인 간 인라인 마진 간섭)**:
     - `#goalsSubtabs`의 인라인 마진(14px)과 헤드라인 마진의 중첩으로 비효율적 공백 발생.
  3. **원인 3 (모바일 375px 전용 타이포그래피 부재)**:
     - 480px 이하 모바일 전용 압축 규칙이 공통 클래스에만 존재하고 목표 헤드라인 고유 규칙이 없음.
- **[중심] (Core Bottleneck & Anchor)**:
  - `#goalsHeadlineSentence`에 `margin: 4px 0 10px 0 !important;`, `padding: 0 !important;`, `line-height: 1.35 !important;`, `font-size: 1.05rem !important;`, `font-weight: 700 !important;`, `color: var(--ink) !important;`를 적용하여 세로 높이를 획기적으로 축소.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 문장형 헤드라인 슬롯(`#goalsHeadlineSentence`) 및 동적 JS 연동(남은 퀘스트 수, 달성 축하, 빈 상태) 100% 보존.
  - 4대 테마 명암 대비 4.5:1 준수 및 `npm test` 100% ALL PASS.
- **체감 가설 (User Experience Hypothesis)**:
  > *"상단 헤드라인이 군더더기 없이 단정해지고 아래의 마일스톤 카드가 한 뼘 더 위로 올라와 시원하게 보이며, 스크롤을 내리지 않고도 내 목표와 퀘스트가 한눈에 파악된다."*
- **기존 전체 기능 영향도 분석**:
  - 목표 탭 상단 레이아웃 압축 외 타 기능 영향도 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 문장형 헤드라인 DOM ID(`#goalsHeadlineSentence`)를 변경하거나 삭제하지 않는다.
  - 헤드라인 텍스트를 장황한 설명조로 늘리지 않는다.
- **해야 할 것 (Action)**:
  - `ui.css`에 `#goalsHeadlineSentence` 전용 압축 스타일 및 미디어 쿼리(480px) 명시.
  - `index.html` 내 `#goalsSubtabs` 인라인 마진을 최적화(8px)하여 상단 비주얼 플로우 매끄럽게 연결.
  - 모바일 375px 뷰포트에서 헤드라인 텍스트가 단 1줄로 단정하게 렌더링되도록 확인.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 상태 영향 없음.
- **3호 (4대 뷰 전파 배선도)**: `renderGoalsScreen()` 내 기존 헤드라인 갱신 파이프라인 유지.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#goalsHeadlineSentence` | 목표 탭 상단 | 조회/시각인지 | 압축된 1줄 볼드 헤드라인 노출 | 4대 테마별 고대비 텍스트 표시 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 퀘스트 개수가 2자리 이상(예: 99개)일 때도 1줄을 넘지 않도록 `word-break: keep-all`, 적정 폰트 크기(1.05rem / 모바일 1rem) 유지.
- **엣지 케이스 (Edge Cases)**:
  - 목표 0건일 때 ("새로운 목표를 세우고 첫 발걸음을 딛어보세요 🌱")
  - 진행 중인 퀘스트 있을 때 ("정상까지 <b>N개</b>의 퀘스트가 남았어요 🏔️")
  - 목표 달성 시 ("목표를 멋지게 달성하셨어요! 축하드려요 🎉")
  - 4대 테마 전환 시 `var(--ink)` 및 `var(--brand)` 대비율 검증.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 `#goalsHeadlineSentence` 압축 스타일 및 반응형 미디어 쿼리 추가.
  2. [단계 2]: `index.html` 내 `#goalsSubtabs` 마진 조율 및 자연스러운 시각 플로우 확립.
  3. [단계 3]: `scripts/smoke-test.js`에 #TASK-ES-238 무결성 단언문 추가.
  4. [단계 4]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 스타일 재정의이므로 런타임 자바스크립트 크래시 위험 0%.
- **가정의 타당성 검증**:
  - 세로 마진과 폰트 크기 조율로 세로 점유율이 40% 축소되어 첫 화면 마일스톤 노출 영역이 즉각 확장됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- `#goalsHeadlineSentence`의 세로 마진 4px 0 10px 0, 패딩 0, 행간 1.35, 폰트 1.05rem 확립.
- `npm test` 통과 (338개 이상 테스트 PASS, 0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-238 (본질축: E1/FIX)
- 노션 DB 108번 항목과 완벽히 1:1 일치.
