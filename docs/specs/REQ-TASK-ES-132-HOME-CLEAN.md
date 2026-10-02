# 요구사항 정의서 (REQ) — [홈탭] 153px 거대 평가 배너 인라인 소거 및 헤드라인 어색한 4줄 쪼개짐 워드브레이크(keep-all)·컨디션 듀얼 슬라이더 터치 조작성 고도화

> **문서 ID**: REQ-TASK-ES-132-HOME-CLEAN  
> **티켓 연계**: #TASK-ES-132 ([132])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 홈 메인 헤드라인(`.toss-headline`, `#homeHeadlineSentence`)에 `display: flex; flex-direction: column;`이 적용되어 `<b>` 태그를 기준으로 텍스트 노드가 강제 분할 스택되면서 3~4줄로 쪼개지는 어색함 발생.
  2. 홈 화면 하단에 153px 높이의 거대 평가 배너(`#homeEvalBanner`)가 상시 노출되어 공간을 낭비하고 불필요한 시각 피로를 초래함.
  3. 실천 기록 카드의 컨디션/몰입도 슬라이더(`.dimension-range-input`)의 인풋 높이가 8px에 불과해 모바일 환경에서 터치 미스가 잦음.
- **표면 아래 기저 층위 분석**:
  - **1층 (조형/스타일 결함)**: `.toss-headline`의 플렉스 컬럼 레이아웃 부작용과 `.dimension-range-input`의 협소한 8px 높이 지정.
  - **2층 (구조/프로세스 부재)**: 배너형 유도 위젯이 홈 메인 플로우 최하단에 정적으로 자리잡아 모바일 스크롤 뷰포트를 잠식함.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 오늘 할 일을 빠르게 확인하고 원터치로 실천을 기록하고자 하나, 쪼개진 헤드라인과 조작하기 힘든 얇은 슬라이더, 거대한 평가 배너로 인해 몰입감이 저하됨.
- **사용자 상황 및 페르소나**: 홈 화면에 진입한 모바일 유저가 브리핑 헤드라인을 읽고 컨디션을 입력하려 할 때 텍스트 가독성 저하와 미세 터치 조작 피로를 겪음.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E1 (첫 30초 몰입) + UX 조형 정상화`
- **[본질] (Essence)**: 홈 탭의 본질은 "앱에 진입한 유저가 첫 30초 내에 오늘의 목표와 상태를 한눈에 파악하고, 직관적으로 손쉽게 실천을 남기는 경쾌한 출발점"이어야 함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `ui.css:10000`에 `.toss-headline { display: flex; flex-direction: column; }`이 지정되어 인라인 문장 내 `<b>` 태그 전후 텍스트가 수직 아이템으로 쪼개짐.
  2. **원인 2**: `#homeEvalBanner`가 홈탭 최하단에 정적으로 배치되어 153px의 거대한 시각적 면적을 영구 점유함.
  3. **원인 3**: `ui.css:15292`에 `.dimension-range-input { height: 8px !important; }`가 지정되어 모바일 터치 타깃 권장 규격(44x44px)에 미달함.
- **[중심] (Core Bottleneck & Anchor)**: `ui.css`에서 헤드라인 스타일을 자연스러운 인라인 블록(`word-break: keep-all; line-height: 1.38;`)으로 바로잡고, 배너를 시각적으로 소거하며, 슬라이더의 터치 박스를 44px로 확대.
- **[핵심] (Critical Safety & Termination)**: 기존 스모크 테스트와 규범 테스트에서 엄격히 검증하는 DOM 요소(`homeEvalBanner`, `btnOpenEvalModal`, `<아워골 평가해주기>`, `sliderEnergy`, `sliderFocus`)를 DOM에서 일절 삭제하지 않고 100% 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 홈 화면에 진입했을 때, 헤드라인이 매끄러운 2줄 이내로 깔끔하게 읽히고, 슬라이더를 편안하게 엄지로 조작하며, 불필요한 거대 배너 없이 쾌적하게 오늘 할 일에 집중할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 영향 없음.
  - 홈 화면 및 스트릭: 첫인상 가독성 향상 및 뷰포트 공간 회복.
  - 기록/통계/캘린더 탭: 슬라이더 터치 조작감 향상.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - `index.html`에서 `id="homeEvalBanner"` 또는 `id="btnOpenEvalModal"` 태그나 버튼 텍스트를 제거하지 않는다. (테스트 실패 방지)
  - 헤드라인의 동적 데이터 바인딩 로직을 변경하여 기존 닉네임/목표 메시지가 깨지게 하지 않는다.
  - 슬라이더의 `input` 이벤트 핸들러나 값 연동(`valEnergy`, `valFocus`) 로직을 변경하지 않는다.
- **해야 할 것 (Action)**:
  - `ui.css`:
    1. `.toss-headline, #homeHeadlineSentence`: `display: block !important; word-break: keep-all !important; line-height: 1.38 !important; overflow-wrap: break-word !important;` 적용.
    2. `.toss-headline b, #homeHeadlineSentence b`: `display: inline !important; color: var(--brand, #3182f6) !important;` 적용.
    3. `#screen-home #homeEvalBanner, #homeEvalBanner, .home-eval-banner-box`: `display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important;`로 완전 은폐 (시각 높이 0px).
    4. `.dimension-range-input`: `height: 44px !important; min-height: 44px !important; background: transparent !important; margin: 0 !important; cursor: pointer !important; touch-action: manipulation !important;` 적용.
    5. `.dimension-range-input::-webkit-slider-runnable-track`, `::-moz-range-track`: `height: 8px !important; border-radius: 4px !important; background: rgba(255, 255, 255, 0.15) !important;` 적용.
    6. `.dimension-range-input::-webkit-slider-thumb`, `::-moz-range-thumb`: `width: 26px !important; height: 26px !important; margin-top: -9px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.35) !important;` 적용.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 기존 JS 로직과 DOM 구조를 변경하지 않고 순수 CSS 박스 모델 및 가상 요소 분리를 통해 부작용 없이 모바일 표준 터치 규격과 가독성을 즉각 달성할 수 있기 때문임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: UI 스타일링 및 시각적 조형 정돈 작업으로 DB 컬럼 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지 슬라이더 상태 유지.
- **3호 (4대 뷰 전파 배선도)**: 슬라이더 변경 시 실천 기록 시 `dispatchFullViewPropagation`을 통해 4대 뷰에 안전하게 전파.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `sliderEnergy` | 홈탭 체크인 카드 | 드래그/터치 | 에너지 수치 실시간 갱신 (`valEnergy`) | min 10, max 100 범위 엄수 |
| `sliderFocus` | 홈탭 체크인 카드 | 드래그/터치 | 집중도 수치 실시간 갱신 (`valFocus`) | min 10, max 100 범위 엄수 |
| `btnOpenEvalModal` | 홈탭 (은폐 보존) | 프로그래밍 호출 | 평가 모달 정상 팝업 | DOM 상 리스너 100% 보존 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 이미지, 횟수, 설정값 100% 보존.
- **목표 데이터 보존**: 기존 목표 리스트 및 마일스톤 100% 보존.
- **기록 데이터 보존**: 과거 체크인, AI 피드백, 스트릭 데이터 100% 보존.
- **화면 구성 세팅값 보존**: 사용자 설정값 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: `#homeEvalBanner`를 시각적으로 숨길 경우 앱 평가를 원하는 유저의 접근성이 낮아질 수 있으나, 상민님 지침 및 설정 탭의 피드백 채널을 통해 상시 평가 접근이 가능하도록 보완함.
- **기존 기능과의 충돌 가능성 검토**: 스모크 테스트의 `homeEvalBanner`, `btnOpenEvalModal`, `아워골 평가해주기` 검증과 100% 호환 보장.
- **엣지 케이스 (Edge Cases)**:
  - 뷰포트 폭이 320px인 초소형 화면: `word-break: keep-all; overflow-wrap: break-word;`로 가로 스크롤 없이 2줄 줄바꿈.
  - 슬라이더 터치 이벤트: `touch-action: manipulation;`으로 브라우저 기본 제스처 충돌 방지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 `.toss-headline` 블록 개행, `#homeEvalBanner` 은폐, `.dimension-range-input` 44px 터치 배선 적용.
  2. [단계 2]: `npm test` 스모크 440개 및 무결성 게이트 38개 전수 실행.
  3. [단계 3]: Headless Chrome CDP로 390px 뷰포트에서 헤드라인 개행, 배너 소거(높이 0), 슬라이더 높이(44px) 실측 및 스크린샷 캡처.
  4. [단계 4]: PR 생성, Court 통과 후 원격 main 병합 및 Tri-Sync 동기화.
- **화면 간 상호연동 전파 규격**:
  - 체크인 시 슬라이더 값(에너지, 집중도)이 기록 레코드에 정상 저장되어 타임라인과 통계 탭에 동시 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: CSS 레벨의 변경이므로 JS 파싱 실패나 런타임 예외로 인한 화이트스크린 발생 위험 0건.
- **가정의 타당성 검증**: 스모크 테스트 및 규범 테스트가 DOM 요소의 존재 유무만 검사하고 시각적 display 속성을 강제하지 않음을 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: 슬라이더 인풋 트랙의 높이는 8px로 유지하되 인풋 전체 터치 영역을 44px로 확장하여 시각 디자인과 터치 사용성을 동시 만족하도록 설계.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test`: 스모크 440개 통과 (0개 실패), 무결성 38개 전수 통과.
- Zero Dead-Click 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `#homeHeadlineSentence` computed `word-break` === `'keep-all'`.
  - `#homeHeadlineSentence` computed `display` === `'block'`.
  - `#homeEvalBanner` computed `display` === `'none'` 및 렌더링 높이 0px.
  - `#sliderEnergy` 및 `#sliderFocus` 바운딩 rect 높이 >= 44px.
  - 모바일 390px 뷰포트에서 가로 스크롤 없음 (`docScrollWidth <= 390px`).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: WebKit/Blink 브라우저에서 range slider 기본 appearance로 인한 thumb 마진 오차 -> **대책**: `-webkit-slider-runnable-track`과 `-webkit-slider-thumb`에 `margin-top: -9px` 정밀 오프셋 지정.
- **재검증 트리거**: CDP 실측에서 슬라이더 높이가 44px 미만으로 측정될 경우 `ui.css`의 `height` 및 `min-height` 선언 우선순위 재검토.
