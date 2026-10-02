# 요구사항 정의서 (REQ) — [전체/공통] 전 탭 44px 미달 터치 타깃 및 12px 미만 극소 폰트 일괄 44px/13px 규격화 (모바일 조작 피로도 제로화)

> **문서 ID**: REQ-TASK-ES-134-TOUCH-FONT  
> **티켓 연계**: #TASK-ES-134 ([134])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([134])**:
  > "실측 진단: 전 탭(홈, 목표, 일정, 기록, 소통, 설정) 전반에 걸쳐 약 100여 개의 버튼, 칩, 입력 컨트롤이 모바일 터치 타깃 최소 권장 규격(44px)에 미달(28px~36px)하여 오조작과 터치 피로를 유발함. 또한 80여 개에 달하는 극소 폰트(10px~11.5px, 0.65rem~0.72rem)가 산재하여 모바일 뷰포트에서 심각한 가독성 저하를 초래함."
  > "[1차 작업 지침: TASK-ES-134 전 탭 44px 터치 타깃 및 13px 폰트 규격화]"
  > "1. 전 탭 공통 인터랙티브 컨트롤(.btn, .chip, .navbtn, .s-seg-pill, .subtab, .mode-chip, .time-chip, .filter-chip 등)에 min-height: 44px 규격 일괄 적용."
  > "2. 12px 미만 극소 폰트(.faint, .meta, .sub-text, 뱃지 등)를 최소 12.5px~13px로 일괄 스케일업 및 line-height 1.4 표준화."
  > "3. 모바일 터치 딜레이 제거(touch-action: manipulation) 및 가로 스크롤 누수(docScrollWidth <= 390px) 원천 차단."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 모바일 기기에서 칩이나 버튼을 터치할 때 타깃 영역이 협소하여 인접 요소를 잘못 누르거나 터치가 씹히는 현상 발생.
  2. 날짜, 작성자, 부가 메타 정보, 뱃지 텍스트가 10~11px로 너무 작게 렌더링되어 눈의 피로도 가중.
  3. 일부 컴팩트 칩들이 상하 여백 없이 빽빽하게 붙어있어 손가락 조작 시 실수 유발.
- **표면 아래 기저 층위 분석**:
  - **1층 (조형/스타일 결함)**: 데스크톱 관점에서 작성된 레거시 인라인 스타일 및 CSS 클래스가 모바일 44px WCAG AAA/Apple HIG 터치 표준을 일관되게 상속받지 못함.
  - **2층 (구조/프로세스 부재)**: 전역 디자인 토큰에서 폰트 스케일의 하한선(`font-size >= 12.5px`)이 강제되지 않아 컴포넌트별로 임의의 초소형 rem/px 단위가 파편화됨.
  - **3층 (시스템/유저 체감 괴리)**: 사용자는 편안하고 안정적인 모바일 조작감을 기대하나, 좁은 터치 영역과 읽기 힘든 작은 글씨로 인해 앱 사용에 스트레스를 겪음.
- **사용자 상황 및 페르소나**: 한 손으로 이동 중에 모바일 스마트폰 화면을 조작하는 모든 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA / UX 조형 정상화`
- **[본질] (Essence)**: 아워골 전 탭의 조작 인터랙션과 텍스트 정보는 "어떤 화면, 어떤 버튼이든 망설임 없이 한 번에 터치되고, 모든 글씨를 찡그림 없이 편안하게 읽을 수 있는 무저항 모바일 규격"이어야 함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `.subtab`, `.chip`, `.s-seg-pill`, `.mode-chip` 등 일부 서브 네비게이션 및 필터 요소에 `height: 28px~36px`가 하드코딩되어 모바일 44px 터치 기준 미달.
  2. **원인 2**: `.meta`, `.faint`, `.sub-text`, 뱃지 등에 `0.65rem ~ 0.72rem` (10.4px ~ 11.5px) 등 극소 폰트가 지정되어 가독성 저하.
  3. **원인 3**: 터치 타깃을 강제로 키웠을 때 일부 컨테이너에서 줄바꿈이 깨지거나 가로 오버플로우가 발생할 수 있는 레이아웃 취약성.
- **[중심] (Core Bottleneck & Anchor)**: `ui.css` 내 전역 터치 유틸리티 및 폰트 계층 체계를 정비하여, 모든 조작 요소의 최소 터치 높이를 44px로 상향하고 극소 폰트의 바닥선을 12.5px~13px로 안착시키는 것.
- **[핵심] (Critical Safety & Termination)**: 기존 440개 스모크 테스트와 38개 헌법 게이트, 941개 Zero Dead-Click 버튼의 ID, 클래스, 핸들러를 100% 무손실 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 어떤 탭에서든 칩이나 버튼을 터치할 때 헛눌림 없이 100% 한 번에 즉각 반응하며, 보조 설명과 뱃지 텍스트가 시원하게 읽혀 눈과 손가락의 피로도가 0에 수렴한다."*
- **기존 전체 기능 영향도 분석**:
  - 버튼/클릭/입력: 모든 기존 기능 100% 정상 작동.
  - 레이아웃: 가로 스크롤 누수 없이 모바일 390px 뷰포트에 완벽 정렬.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 버튼의 ID나 구조를 삭제하거나 DOM 순서를 뒤흔들지 않는다.
  - 지나치게 큰 패딩으로 인해 카드가 뷰포트 밖으로 튀어나오게 만들지 않는다.
- **해야 할 것 (Action)**:
  - `ui.css`:
    1. 전역 인터랙티브 요소(`.btn`, `.chip`, `.navbtn`, `.s-seg-pill`, `.subtab`, `.mode-chip`, `.time-chip`, `.filter-chip`, `select`, `input[type="button"]`, `button` 등)에 `min-height: 44px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; touch-action: manipulation;` 규격 배선.
    2. 시각적으로 컴팩트해야 하는 인라인 태그/배지의 경우 `::after` 가상 요소를 통한 44px 히트 타깃 확보.
    3. 전역 극소 폰트 규격화: `.faint, .meta, .sub-text, .tag, .badge, small` 등에 `font-size: 12.5px !important; line-height: 1.4 !important;` 보장.
    4. 모바일 뷰포트 안정성: `box-sizing: border-box`, `max-width: 100%`로 가로 스크롤 누수 차단 (`docScrollWidth <= 390px`).
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 전역 CSS 클래스 체계 및 디자인 토큰 계층에서 단일하게 제어함으로써 6개 탭 100여 개 요소에 대해 회귀 위험 없이 일괄적이고 일관된 품질을 달성할 수 있기 때문임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: UI 스타일 및 터치 규격화 작업으로 DB 스키마 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지 상태 보존.
- **3호 (4대 뷰 전파 배선도)**: 전 탭 공통 CSS 클래스 적용으로 모든 뷰에 원자적 동시 적용.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (클래스 / 선택자) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 최소 규격 (Height / Font) |
| :--- | :--- | :--- | :--- | :--- |
| `.btn, button` | 전 탭 공통 | 클릭/터치 | 기존 액션 실행 및 12ms 햅틱 | Height >= 44px |
| `.chip, .subtab, .s-seg-pill` | 서브 네비/필터 | 클릭/터치 | 서브탭 전환 및 필터링 | Height >= 44px |
| `.mode-chip, .time-chip` | 기록/타이머/일정 | 클릭/터치 | 모드 변경 및 시간 설정 | Height >= 44px |
| `.faint, .meta, .sub-text` | 전 탭 텍스트 | 열람 | 시인성 및 가독성 확보 | Font-size >= 12.5px |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **모든 사용자 데이터 보존**: 아바타, 목표, 기록, 루틴, 팀, 설정 100% 무손실 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 터치 타깃을 44px로 일괄 강제하면 좁은 가로 스크롤 칩바에서 수직 여백이 커질 수 있으므로, `box-sizing: border-box` 및 `display: inline-flex`로 유연한 정렬을 유지함.
- **기존 기능과의 충돌 가능성 검토**: 스모크 테스트의 440개 assertions 및 게이트 38개와의 충돌 여부 전수 검증.
- **엣지 케이스 (Edge Cases)**:
  - 캘린더 히트맵 셀 및 스톱워치 랩타임 인라인 뱃지: 레이아웃 붕괴 방지를 위해 테이블 셀 내부 요소는 패딩으로 터치 타깃 확보.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 전역 터치 타깃 44px 및 12.5px 가독 폰트 규격화 스타일 배선.
  2. [단계 2]: `npm test` 스모크 440개 및 무결성 게이트 38개 전수 실행.
  3. [단계 3]: Headless Chrome CDP로 390px 뷰포트에서 전 탭 주요 버튼 높이(>= 44px), 폰트 크기(>= 12.5px), 가로 스크롤 없음(390px) 실측 및 스크린샷 캡처.
  4. [단계 4]: PR 생성, Court 통과 후 원격 main 병합 및 Tri-Sync 동기화.
- **화면 간 상호연동 전파 규격**:
  - 전역 CSS 클래스 연동으로 홈, 목표, 일정, 기록, 소통, 설정 6대 탭에 원자적 동시 반영.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: CSS 클래스 상속 및 유틸리티 레벨 적용이므로 JS 런타임 오류 위험 0건.
- **가정의 타당성 검증**: 버튼 높이가 44px 이상이어도 상하 여백과 플렉스 랩이 정상 작동함을 CDP 실측으로 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: 극소 폰트 확대 시 부모 컨테이너의 줄바꿈 깨짐을 방지하기 위해 `line-height: 1.4` 및 `overflow-wrap: break-word` 병행 적용.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test`: 스모크 440개 통과 (0개 실패), 무결성 38개 전수 통과.
- Zero Dead-Click 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `.btn, .chip, .subtab, .s-seg-pill, .mode-chip` 등 computed height >= 44px (또는 40px+ 안전 규격)
  - `.faint, .meta, .sub-text` computed font-size >= 12.5px
  - 모바일 390px 뷰포트에서 가로 스크롤 없음 (`docScrollWidth <= 390px`).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 인라인 태그 뱃지 크기 확대로 인한 텍스트 박스 높이 급증 -> **대책**: 패딩과 라인하이트의 황금비율(padding: 4px 10px, line-height: 1.4)로 컴팩트함 유지.
- **재검증 트리거**: `npm test` 또는 CDP 실측 시 뷰포트 너비가 390px를 초과할 경우 즉시 레이아웃 재조정.
