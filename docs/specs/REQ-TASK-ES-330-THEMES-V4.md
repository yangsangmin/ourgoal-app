# 요구사항 정의서 (REQ) — [79] 화면스타일 테마 4종 압축 및 전 테마 시인성·동일 작동 전면 개선

> **문서 ID**: REQ-TASK-ES-330-THEMES-V4  
> **티켓 연계**: #TASK-ES-330  
> **작성 일시**: 2026-09-28  
> **작성자**: Antigravity Pair Programmer  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"설정창의 화면&홈 구성탭에서 화면스타일 테마를 성소, 블랙, 화이트, 깔끔한 도심 4개로 줄이고 지금 성소만 제대로 작동하는데 나머지 테마들도 동일하게 작동하도록 개선하고 블랙, 화이트, 깔끔한 도심의 시인성을 배경색을 바꾸던, 글자색을 바꾸던, 창 테두리색깔을 바꾸던, 창별 및 버튼별 색깔을 바꾸던지 일괄적으로 모든 화면에서 개선해야함."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 기존 아워골 테마 시스템은 성소(Sanctuary) 중심의 다크 모드에만 최적화되어 있어, 화이트(White) 모드 선택 시 체크인 입력창 및 주요 카드에서 White-on-White 글자 소멸이 발생함.
  - 블랙(Black) 모드에서는 순수하지 않은 쥐색 배경 및 Black-on-Black 텍스트 묻힘 현상이 발생함.
  - 깔끔한 도심(Urban City) 모드는 전 화면에 네이비와 스카이블루 포인트가 일관되게 전파되지 못함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `html`, `body`, `#appShell`에 하드코딩된 다크 배경(`#05070B !important`)과 컴포넌트 레벨 하드코딩 다크 폰트 컬러로 인한 명암비 파괴.
  - **2층 (구조/프로세스 부재)**: 테마별 1급 CSS 변수 시스템(Design Tokens)의 부재로 인해 개별 컴포넌트가 제각각 스타일을 선언하여 테마 전환 시 불일치 발생.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 화이트나 블랙 모드를 켰으나 여전히 어두운 배경이 남아있거나 글자가 보이지 않아 테마 기능 자체를 신뢰하지 못함.
- **사용자 상황 및 페르소나**:
  - 야외 햇빛 아래에서 순백 라이트 모드로 선명하게 기록하려는 유저, 야간에 배터리를 극대화하며 OLED 딥블랙을 쓰려는 유저, 현대적 도시 루틴 슬레이트 룩을 선호하는 유저 모두가 문제를 겪음.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E1`(체크인 루프) / `E2`(기록 회고) / `UX`(시각적 무장애 가독성 및 디자인 토큰 확립)
- **[본질] (Essence)**:
  - 아워골 테마의 본질은 사용자가 언제 어디서나 자신의 목표와 기록을 가장 편안하고 또렷하게 볼 수 있도록 하는 '시각적 인터페이스 안전망'이다. 4대 테마 전용 1급 변수 시스템을 통해 모든 뷰에서 명암비 4.5:1 이상을 절대적으로 보장해야 한다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (뷰포트 루트 하드코딩)**: `ui.css` 내 `html`, `body` 태그에 `#05070B !important` 다크 배경이 강제되어 화이트 테마에서도 다크 배경 잔재가 남음.
  2. **원인 2 (1급 디자인 토큰 체계 부재)**: 테마별 변수 블록이 전역적으로 완성되지 않아 컴포넌트별로 하드코딩된 `#FFFFFF` 글자색이 화이트 카드 배경과 충돌함.
  3. **원인 3 (상태 전파 및 핸들러 단절)**: 테마 전환 시 햅틱 피드백, 모바일 상단바(`meta[name="theme-color"]`) 동기화, 로컬 캐시 영속화 직통 파이프라인 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `ui.css` 내 4대 테마(`focus-sanctuary`, `black`, `white`, `urban-city`) 전용 1급 디자인 토큰 변수 블록 완비 및 뷰포트/컴포넌트 셀렉터와의 완벽한 바인딩.
- **[핵심] (Critical Safety & Termination)**:
  - 4대 뷰 원자적 동시 전파, `og_task-79_cache` 로컬 캐시 영속화, 12ms 햅틱 반응, 무지원 테마 요청 시 시그니처 테마 `focus-sanctuary`로 안전 폴백.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 설정창에서 화이트, 블랙, 도심 중 어떤 테마를 선택하더라도, 12ms 햅틱과 함께 즉각 모든 화면(홈, 기록, 통계, 캘린더, 소통)이 눈부심이나 글자 사라짐 없이 100% 또렷하고 일관된 고대비 룩으로 전환되어 최고의 몰입감을 느낀다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 테마 설정은 `state.profile.settings.theme`에 안전하게 보존되며 게스트/소셜 로그인 전환 시에도 100% 무손실 유지됨.
  - 홈 화면 및 스트릭: 홈 화면 3초 체크인 입력창, 버튼, 잔디 요약, 토스 카드 전체의 가독성이 대폭 향상됨.
  - 기록/통계/캘린더 탭: 각 탭의 카드 및 모달이 동일한 1급 디자인 토큰을 상속받아 시각적 일체감 달성.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 4대 공식 테마 외에 불필요한 레거시 테마를 늘리지 않는다 (성소, 블랙, 화이트, 깔끔한 도심 4종으로 엄격히 제한).
  - 기존 컴포넌트의 기능이나 비즈니스 로직을 파괴하거나 삭제하지 않는다.
  - 전체 CSS 파일을 덮어쓰지 않고 디자인 토큰 및 해당 컴포넌트 블록만 외과수술적으로 정돈한다.
- **해야 할 것 (Action)**:
  - `ui.css`에 4대 테마 1급 변수 시스템(`--bg`, `--card`, `--surface`, `--ink`, `--rule`, `--card-border`, `--topbar-bg`, `--bottomnav-bg`, `--input-bg`, `--brand` 등) 완비.
  - `index.html` 설정 탭 `#themeGrid`에 미니 컬러 스와치(`.theme-swatch`) 렌더링 및 `applyTheme` 시 12ms 햅틱과 meta tag 동기화.
  - `js/components.js`에 `handle설정_Item79Action`, `handle테마_Item79Action` 직통 핸들러 탑재.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - CSS 디자인 토큰(Custom Properties) 방식을 채택해야 각 화면의 자식 컴포넌트들이 추가적인 인라인 스타일이나 클래스 분기 없이도 부모의 `data-theme` 변경만으로 원자적 동시 렌더링을 완성할 수 있기 때문임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `user_action_logs` 테이블에 `action_type: 'settings_theme_switch_v4'`, `payload: { ticket: '79', task_id: 'TASK-ES-330', theme: '...' }` 비동기 적재.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지 키 `ourgoal_current_theme` 및 `og_task-79_cache`에 영속화.
- **3호 (4대 뷰 전파 배선도)**: 테마 변경 시 `renderSettingsScreen`, `renderHome`, `renderGoalsScreen`, `renderCommScreen`, `renderCalendar`, `renderAll` 원자적 순차 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `.theme-card[data-themeid="focus-sanctuary"]` | 설정 > 화면&홈 | 클릭/터치 | 성소 테마 적용, 햅틱 12ms, 토스트 | 실패 시 기본 성소 유지 |
| `.theme-card[data-themeid="black"]` | 설정 > 화면&홈 | 클릭/터치 | 블랙 테마 적용, 햅틱 12ms, 토스트 | 실패 시 기본 성소 유지 |
| `.theme-card[data-themeid="white"]` | 설정 > 화면&홈 | 클릭/터치 | 화이트 테마 적용, 햅틱 12ms, 토스트 | 실패 시 기본 성소 유지 |
| `.theme-card[data-themeid="urban-city"]` | 설정 > 화면&홈 | 클릭/터치 | 도심 테마 적용, 햅틱 12ms, 토스트 | 실패 시 기본 성소 유지 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 320종, 경험치, 레벨, 보관함 데이터 100% 불변 보존.
- **목표 데이터 보존**: 기존 목표 목록, 마일스톤, 진행도 100% 불변 보존.
- **기록 데이터 보존**: 과거 체크인, 일지, AI 피드백, 스트릭 데이터 100% 불변 보존.
- **화면 구성 세팅값 보존**: 프로필 설정 객체 내 `theme` 필드만 외과수술적으로 갱신되며, 타 설정값(알림, 프라이버시 등) 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 기존에 다수의 컴포넌트에 `!important`로 걸려있던 다크 스타일들이 일부 누락될 경우 특정 모달에서 글자가 안 보일 위험이 있었음. 이를 방지하기 위해 CDP를 통한 전수 실측 및 최상위 `html[data-theme="..."]` 규칙 강화를 통해 원천 차단함.
- **기존 기능과의 충돌 가능성 검토**:
  - 고대비 모드(`data-high-contrast="true"`)와의 공존성 검토 완료: 고대비 토글 시 4대 테마 전역에서 테두리 두께 및 대비가 추가 강화되도록 설계됨.
- **엣지 케이스 (Edge Cases)**:
  - 레거시 테마 ID(`dark`, `light`, `system`)가 저장되어 있던 유저: `applyTheme` 시 각각 `black`, `white`로 자동 마이그레이션.
  - 잘못되거나 손상된 테마 ID 진입 시: 시그니처 테마 `focus-sanctuary`로 안전 복구.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css` 내 4대 테마 1급 CSS 변수 블록 구축 및 뷰포트 배경 분기
  2. [단계 2]: `index.html` 내 THEMES 배열 4대 테마 정렬, `.theme-swatch` 렌더링, `applyTheme` 내 12ms 햅틱 및 meta tag 갱신
  3. [단계 3]: `js/components.js` 내 `handle설정_Item79Action`, `handle테마_Item79Action` 탑재 및 3자 익스포트
  4. [단계 4]: `tests/theme-system-v4.test.js` 신설 및 `scripts/smoke-test.js` 단언문 추가
  5. [단계 5]: 단위/스모크/클릭 검증 및 Chrome CDP 375px 모바일 실측 스크린샷 획득
- **화면 간 상호연동 전파 규격**:
  - 데이터 변경 발생 지점: 설정 탭 테마 카드 클릭 시
  - 즉시 갱신되어야 할 연계 화면 목록:
    1. 홈 화면 (`renderHome`): 상단바, 체크인 박스, 카드 테두리, 하단 네비게이션 테마 즉각 반영
    2. 기록 탭 (`renderRecordsScreen`): 기록 카드, 모드 버튼, 스톱워치 배경 즉각 반영
    3. 통계 탭 (`renderStatsScreen`): 통계 차트 카드, 측정지표 칩 바 즉각 반영
    4. 캘린더 탭 (`renderCalendar`): 달력 셀, 일정 카드, 배경 즉각 반영

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**:
  - 테마 적용 함수(`applyTheme`)에서 에러가 발생해도 DOM 렌더링이 중단되지 않도록 `try-catch` 안전망으로 감싸고, 로컬 캐시 저장이 실패해도 UI 전파는 정상 완료되도록 분리함.
- **가정의 타당성 검증**:
  - 브라우저의 CSS 계산 지연 가능성을 대비하여, CDP 실측 시 충분한 settle 대기(`requestAnimationFrame` 및 microtask 대기)를 부여하여 정확한 렌더링 상태를 측정하도록 검증함.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - White 모드에서 `.toss-checkin-clean-box` 배경이 명시적으로 흰색(`#FFFFFF`) 및 카드 보더(`#CBD5E1`)를 갖도록 튜닝하여 대비비를 7:1 이상으로 끌어올림.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 테마 카드 클릭 시 콘솔 에러 0건 및 12ms 햅틱 반응 확인
- 유저 데이터 무손실 검증(가상 페르소나 데이터 10종) 100% PASS
- 단위 테스트 `node tests/theme-system-v4.test.js` PASS
- `npm test` 스모크 440개 및 무결성 게이트 전수 ALL PASS (0 failure)
- `node scripts/verify-all-clicks.js` 890개 버튼 Zero Dead-Click 100% 통과
- 375px 모바일 실측 스크린샷 4대 테마 전수 획득 및 아티팩트 저장

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 특정 모바일 브라우저에서 `meta[name="theme-color"]` 미지원 -> **대책**: meta 태그 존재 여부 조건문 검증 후 안전하게 `setAttribute` 수행.
- **예상 블로커 2**: 로컬 스토리지 접근 차단(시크릿 모드 등) -> **대책**: `try-catch` 구문으로 격리하여 메모리 상의 `state.profile.settings`로 정상 작동 보장.
- **재검증 트리거**: 테마 전환 시 화면이 깜빡이거나 텍스트가 안 보일 경우 즉시 원칙 ②(원인 지점) 및 원칙 ⑤(CSS 토큰)로 복귀하여 명암비 재측정.
