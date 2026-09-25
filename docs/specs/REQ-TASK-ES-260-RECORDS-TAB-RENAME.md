# 요구사항 정의서 (REQ) — 기록탭 명칭 '기록/통계'로 변경 2차 초정밀 완결

> **문서 ID**: REQ-TASK-ES-260-RECORDS-TAB-RENAME  
> **티켓 연계**: #TASK-ES-260 (노션 생각 메모장 [36]번)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"기록탭을 기록/통계 로 바꿔"*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 하단 네비게이션 바 및 화면 타이틀에는 `기록/통계`가 부분 반영되었으나, 앱 내 연계 서브 모달(`tabGuideHubModal`, `openPrivacyPickerModal` 등)에서는 여전히 `기록` 단독으로 표기되어 네이밍 불일치 발생.
  2. 하단 네비게이션 버튼(`.navbtn[data-tab="records"]`)에 명시적인 `aria-label` 속성이 누락되어 시각 보조 기술(Screen Reader) 및 접근성 감사에서 탭 기능 인지가 모호함.
  3. 375px 협소 모바일 화면에서 5대 탭 버튼 중 4글자(`기록/통계`)가 줄바꿈(`wrap`)되어 레이아웃이 밀리거나, 44px 터치 타겟이 불안정해질 수 있는 시각적 방어 CSS 누락.
  4. GitHub Court(법정) 검사 체계에 해당 명칭 변경과 접근성/모바일 뷰포트 규격을 입증하는 `claims.json` 및 자동화 테스트가 미완비 상태임.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/불일치 결함)**: 가이드 모달, 공개범위 설정 모달 등 탭 명칭을 참조하는 2차 화면과의 텍스트 불일치.
  - **2층 (구조/규격 부재)**: 4글자 탭 명칭 변경 시 모바일 375px 반응형 CSS(nowrap, font-size, letter-spacing, touch target) 방어 구조 부재.
  - **3층 (시스템/유저 체감 괴리)**: 하단 바에서는 '기록/통계'를 보고 들어갔으나 설정이나 가이드에서는 '기록'으로 보여 유저가 통계/분석 기능이 어디 있는지 헷갈리는 경험.
- **사용자 상황 및 페르소나**:
  - 일상의 실천을 기록하고, 이를 차트와 통계로 분석하여 동기부여를 얻고자 하는 모든 아워골 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E2 (기록 회고 루프 및 실존적 데이터 자산화)
- **[본질] (Essence)**: 사용자가 매일 쌓은 시간과 실천 데이터를 단순 메모가 아닌 '통계와 시각적 데이터 자산'으로 즉각 인지할 수 있도록 명확한 탭 브랜딩을 제공함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 1차 선행 작업 시 하단 네비게이션 바 HTML 텍스트만 일부 교체되고 앱 내 연계 모달 및 렌더러 파이프라인의 명칭 일괄 검증 누락.
  2. **원인 2**: 375px 모바일 5대 탭 환경에서 4글자 라벨의 줄바꿈 방지 스타일 명시 누락.
  3. **원인 3**: GitHub Court 단언문 및 회귀 방지 자동화 테스트 미구축.
- **[중심] (Core Bottleneck & Anchor)**: 내부 탭 식별자(`records`)의 로직 무결성을 100% 보존하면서 사용자 대면 모든 텍스트/접근성 레이블을 '기록/통계'로 4위 1체 통일.
- **[핵심] (Critical Safety & Termination)**: 내부 스토리지 키, 라우팅, CSS 선택자, 이벤트 리스너의 키를 절대 변경하지 않아 기존 기능 훼손 제로 달성.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 하단 바, 화면 타이틀, 가이드 허브, 공개 범위 모달 어디에서 보더라도 일관된 '기록/통계' 명칭을 접함으로써, 기록과 분석이 하나로 결합된 효능감을 체감한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 내부 상태 키 `records`, `state.activeTab = 'records'`, `screen-records` 등 핵심 엔진 ID 변경 절대 금지 (기존 기능 훼손 방지).
  - 탭 아이콘 SVG나 레이아웃 순서 변경 금지.
- **해야 할 것 (Action)**:
  - 하단 네비게이션 버튼: 텍스트 `기록/통계`, `aria-label="기록/통계"` 확립.
  - 화면 상단 타이틀: `기록/통계` 유지 및 ARIA 속성 점검.
  - 가이드 허브 모달(`tabGuideHubModal`): `tabs` 배열 내 `records` 라벨을 `기록/통계`로 갱신.
  - 공개 범위 설정 모달(`openPrivacyPickerModal`): `records` 탭명을 `기록/통계`로 갱신.
  - CSS 모바일 방어: `.bottom-nav .navbtn`에 `white-space: nowrap`, `letter-spacing: -0.2px`, 375px 미디어 쿼리 반응형 패딩 및 44px 터치 영역 보장.
  - 테스트 및 Court 단언문 작성: Claim 1~5 완비.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase `profiles.settings.privacy.records` 유지.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시(`state.profile.settings`) 및 원격 DB와 무충돌 연동.
- **3호 (4대 뷰 전파 배선도)**: 탭 전환 시 `renderRecordsScreen()` 및 기존 4대 뷰 상태 완전 보존.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `.navbtn[data-tab="records"]` | 하단 네비게이션 | 클릭/터치 | `switchTab('records')` 및 `renderRecordsScreen()` 호출 | 탭 활성화 및 화면 즉시 전환 |
| `#recHeadlineSentence` | 기록 화면 상단 | 뷰 | 문장형 헤드라인 노출 | 시각적 영감 제공 |
| `h2.s-title` | 기록 화면 헤더 | 뷰 | `기록/통계` 타이틀 표출 | 직관적 화면 인지 |
| `.guide-tab-nav-btn[data-tabkey="records"]` | 가이드 허브 모달 | 클릭/터치 | 기록/통계 가이드 콘텐츠 노출 | 탭 활성화 및 내용 갱신 |
| `.ms-row` (records) | 공개 범위 설정 모달 | 클릭/터치 | 기록/통계 공개범위 설정 변경 | 선택 상태 변경 및 저장 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 기록(`records`), 통계 설정, 목표, 캘린더 데이터 100% 불변 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 네비게이션 바의 글자 수가 2글자에서 4글자(`기록/통계`)로 늘어나 375px 소형 모바일에서 텍스트 줄바꿈이 발생할 수 있음 -> `white-space: nowrap;` 및 `font-size: 0.625rem`, `letter-spacing: -0.4px`로 완전 방어.
- **기존 기능과의 충돌 가능성 검토**:
  - `records` 키는 그대로 유지하므로 라우팅, 스토리지, API 호출 충돌 가능성 0%.
- **엣지 케이스 (Edge Cases)**:
  - 시스템 글꼴 크기를 최대로 키운 모바일 기기에서도 글자가 겹치거나 화면 밖으로 튀어나가지 않도록 `letter-spacing` 및 패딩 압축 적용.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. **단계 1 (`index.html`)**:
   - 하단 네비게이션 버튼에 `aria-label="기록/통계"` 추가.
   - `tabGuideHubModal` 내 `records` 라벨을 `기록/통계`로 갱신.
   - `openPrivacyPickerModal` 내 `records` tabName을 `기록/통계`로 갱신.
2. **단계 2 (`ui.css`)**:
   - `.navbtn`에 `white-space: nowrap; letter-spacing: -0.2px;` 적용.
   - 375px 모바일 미디어 쿼리 방어 추가.
3. **단계 3 (`tests/` 및 `scripts/`)**:
   - 단위 테스트 `tests/records-tab-rename.test.js` 작성.
   - `scripts/smoke-test.js`에 검증 단언문 추가.
   - `scripts/verify-integrity-gate.js` 38개 헌법 게이트 통과 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - UI 레이블 변경이 내부 자바스크립트 변수명이나 객체 키를 건드리지 않으므로 로직 중단 위험 없음.
- **가정의 타당성 검증**:
  - 모달 렌더러와 네비게이션 렌더러에서 텍스트 노드만 변경되었으므로 기존 이벤트 바인딩과 100% 호환됨.
- **재검증 결과 도출된 보완사항**:
  - 스크린 리더 지원을 위해 `aria-label="기록/통계"`를 네비게이션 버튼에 명시하여 접근성 보강.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 하단 네비게이션 버튼 텍스트가 `기록/통계`로 표시되고 `aria-label="기록/통계"`를 포함함.
- 기록 화면 헤더가 `기록/통계`로 일관되게 표시됨.
- 가이드 허브 모달 및 공개 범위 설정 모달의 탭 레이블이 `기록/통계`로 표시됨.
- 375px 모바일 뷰포트에서 수평 오버플로우 0px 및 줄바꿈 없음.
- 38개 헌법 게이트 및 378개 스모크 테스트 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 모바일 375px 화면에서 7개 탭 요소 간격 압축 시 겹침 -> `flex: 1`, `padding: 6px 1px 4px`로 균등 분할.
- **재검증 트리거**: 탭 전환 시 기록 화면이 정상 렌더링되지 않거나 빈 화면이 노출될 경우 즉시 `switchTab` 핸들러 및 DOM 식별자 무결성 재점검.
