# 요구사항 정의서 (REQ) — 기록탭 대표 안내멘트 시인성 개선 및 공간 효율적 간결 문구 재배치

> **문서 ID**: REQ-TASK-ES-242-RECORDS-HEADLINE-VISIBILITY  
> **티켓 연계**: #TASK-ES-242  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 112번 항목:  
  > **"기록탭의 대표 안내멘트 시인성 개선 및 효과적(공간활용) 문구 배치"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 기록 탭 상단 헤드라인(`#recHeadlineSentence`)이 공통 `.toss-headline` 스타일을 상속받아 상하 마진(10px, 14px)과 큰 폰트로 상단 세로 공간을 과점함.
  2. 하단 이번 주 몰입 요약 원카드(`.toss-record-hero-card`)와의 상하 간격이 10px 이상 벌어져 첫 화면(375px)에서 핵심 지표 카드의 도달성이 지연됨.
  3. 초기 빈 상태 및 기록 상태에서의 안내 문구가 더 따뜻하고 직관적인 성장 중심 카피로 정돈될 필요가 있음.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 기록 탭 전용 헤드라인 세로 압축 스타일 부재.
  - **2층 (구조/프로세스 부재)**:
    - 헤드라인과 요약 원카드 간의 연계 마진 미조율.
  - **3층 (시스템/유저 체감 괴리)**:
    - 사용자는 기록 탭에 들어오자마자 자신의 실천 총량과 이번 주 성취를 한눈에 느끼고 싶어 함.
- **사용자 상황 및 페르소나**:
  - 피트니스/생산성 앱의 기록 대시보드처럼, 군더더기 없는 상단 멘트 아래 펼쳐진 핵심 실천 통계와 피드를 빠르게 확인하고 싶은 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E2 & FIX (E2 기록·회고 루프 첫 화면 몰입감 및 공간 압축)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"상단 헤드라인의 세로 점유율을 40% 이상 압축하고 따뜻한 성취형 1줄 카피를 배치하여, 첫 화면 375px 뷰포트에서 이번 주 몰입 요약 원카드와 누적 성과가 즉시 돋보이게 만드는 고효율 대시보드 헤드라인 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (공통 헤드라인 클래스 과다 여백)**:
     - `.toss-headline`의 마진(10px 0 14px 0)과 폰트 크기(1.25rem)로 인한 세로 낭비.
  2. **원인 2 (요약 원카드와의 간격 미세 조정 누락)**:
     - `.toss-record-hero-card`의 `margin-top: 10px`과 헤드라인 하단 마진 중첩.
  3. **원인 3 (카피라이팅 직관성 고도화 필요)**:
     - "매일의 작은 실천이 큰 성장을 만들어요 📈" 등 직관적인 1줄 문장으로의 통일 필요.
- **[중심] (Core Bottleneck & Anchor)**:
  - `#recHeadlineSentence`에 `margin: 4px 0 10px 0 !important;`, `font-size: 1.05rem !important;`, `line-height: 1.35 !important;`, `color: var(--ink) !important;`를 적용하고 요약 원카드 상단 마진을 6px로 조율.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 `#recHeadlineSentence` 및 동적 카운트 바인딩 로직 100% 보존.
  - 4대 테마 명암 대비 4.5:1 준수 및 `npm test` 100% ALL PASS.
- **체감 가설 (User Experience Hypothesis)**:
  > *"상단 텍스트가 정갈해지고, 이번 주 총 실천 시간과 횟수 카드가 화면 중앙에 시원하게 배치되어 나의 성장 성과를 즉각 확인하고 뿌듯함을 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 기록 탭 상단 타이포그래피 압축 외 비즈니스 로직 변경 0건.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 헤드라인 ID(`#recHeadlineSentence`) 또는 원카드 ID(`#recHeroCard`)를 변경하지 않는다.
  - 텍스트를 두 줄 이상으로 늘려 모바일 뷰포트를 잠식하지 않는다.
- **해야 할 것 (Action)**:
  - `ui.css`에 `#recHeadlineSentence` 압축 스타일 및 480px 미디어 쿼리 선언.
  - `.toss-record-hero-card` 상단 마진을 6px로 조율하여 상단 비주얼 플로우 매끄럽게 연결.
  - 초기 기본 카피를 "매일의 작은 실천이 큰 성장을 만들어요 📈"로 정돈.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 상태 영향 없음.
- **3호 (4대 뷰 전파 배선도)**: `renderRecordsScreen()` 내 기존 갱신 유지.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#recHeadlineSentence` | 기록 탭 상단 | 조회/시각인지 | 1줄 압축 볼드 헤드라인 노출 | 4대 테마 고대비 텍스트 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 총 기록 개수가 많은 경우에도 1줄을 넘지 않도록 `word-break: keep-all`, 적정 폰트 크기 유지.
- **엣지 케이스 (Edge Cases)**:
  - 기록 0건일 때 ("매일의 작은 실천이 큰 성장을 만들어요 📈")
  - 기록 N건일 때 ("총 <b>N개</b>의 소중한 성장이 기록되었어요 📈")
  - 4대 테마 전환 시 `var(--ink)` 대비율 4.5:1 이상 검증.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 `#recHeadlineSentence` 압축 스타일 및 480px 미디어 쿼리 추가.
  2. [단계 2]: `ui.css` 내 `.toss-record-hero-card` 상단 마진(6px) 조율.
  3. [단계 3]: `index.html` 내 `#recHeadlineSentence` 기본 텍스트 및 `renderRecordsScreen` 카피 정돈.
  4. [단계 4]: `scripts/smoke-test.js`에 #TASK-ES-242 무결성 단언문 추가.
  5. [단계 5]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - CSS 스타일 압축 및 카피 정돈으로 런타임 자바스크립트 크래시 위험 0%.
- **가정의 타당성 검증**:
  - 세로 공간 압축을 통해 375px 모바일 뷰포트에서 이번 주 몰입 요약 원카드가 한 화면에 쾌적하게 안착됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- `#recHeadlineSentence` margin: 4px 0 10px 0, font-size: 1.05rem, line-height: 1.35 확립.
- `npm test` 338개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-242 (본질축: E2/FIX)
- 노션 DB 112번 항목과 완벽히 1:1 일치.
