# 요구사항 정의서 (REQ) — 설정 탭 내 전문가용 외부 연동(구글캘린더 OAuth, 노션 API, Gemini API)을 [고급 설정]으로 기본 접힘 처리

> **문서 ID**: REQ-TASK-ES-235-SETTINGS-ADVANCED-FOLD  
> **티켓 연계**: #TASK-ES-235  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 105번 항목:  
  > **"설정 탭 내 전문가용 외부 연동(구글캘린더 OAuth, 노션 API)을 [고급 설정]으로 기본 접힘 처리"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 일반 사용자가 설정 탭에 들어왔을 때 복잡한 구글 캘린더 OAuth, Gemini API 키, 노션 토큰 입력 등 전문가용 외부 연동 필드로 인해 인지 과부하를 겪음.
  2. 설정 탭 네 번째 그룹(데이터 & 외부 연동)의 세로 스크롤 압박이 과도하여 중요한 데이터 백업이나 고객지원 메뉴 도달이 지연됨.
  3. 전문가용 기능과 일반 유저 설정 간의 시각적 위계 구분이 모호하여 심리적 장벽 형성.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - 외부 연동 도구들이 기본 펼침 상태로 일반 데이터 관리와 무차별 혼재됨.
  - **2층 (구조/프로세스 부재)**:
    - 스티브 잡스식 단순함(Simplicity) 원칙에 입각한 [고급 설정] 아코디언 격리 구조 부재.
  - **3층 (시스템/유저 체감 괴리)**:
    - 일반 유저는 평온한 목표 안식처를 원하지만 시스템 개발자용 엔지니어링 필드를 마주치며 피로감을 느낌.
- **사용자 상황 및 페르소나**:
  - 일상적인 알림과 테마를 심플하게 설정하고 싶은 대다수의 일반 사용자 및 필요한 순간에만 외부 캘린더/노션 연동을 설정하는 파워 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: FIX & INFRA (설정 탭 시각적 위계 정돈 및 인지 과부하 해소)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"복잡한 시스템 엔지니어링을 보이지 않는 곳에 정돈하여 사용자에게 극도의 평온함을 선사하는 미니멀 인터페이스 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (전문가용 필드의 무조건적 노출)**:
     - 구글 캘린더 Client ID, GCP 콘솔 링크, 노션 시크릿 토큰, DB ID 필드가 상시 노출되어 화면을 과밀하게 만듦.
  2. **원인 2 (데이터 그룹 내 시각 위계 미흡)**:
     - 데이터 안심 휴지통이나 고객지원과 같은 일상 메뉴와 전문 API 설정이 평면적으로 나열됨.
  3. **원인 3 (접이식 컴포넌트 부재)**:
     - 전문가용 도구만을 선별적으로 감출 수 있는 전용 아코디언 컴포넌트 결여.
- **[중심] (Core Bottleneck & Anchor)**:
  - 설정 탭 내 `#advancedSettingsAccordion` (`.advanced-settings-accordion`) 컴포넌트를 신설하여 전문가용 외부 연동 섹션을 기본 접힘(collapsed)으로 격리.
  - 아코디언 토글 시 12ms 미세 햅틱과 부드러운 전개 애니메이션 부여.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 구글 캘린더, 노션, Gemini API 등 런타임 연동 로직의 단 1줄도 훼손하지 않고 DOM ID 100% 보존.
  - `npm test` 336개 이상 및 헌법 38개 검증 게이트 100% 통과.
- **체감 가설 (User Experience Hypothesis)**:
  > *"설정 탭에 진입한 일반 유저는 군더더기 없는 단정한 화면에서 평온함을 느끼고, 외부 연동이 필요한 고급 유저는 [고급 설정 ⚙️]을 원클릭하여 필요한 API 설정을 안전하게 완료한다."*
- **기존 전체 기능 영향도 분석**:
  - 설정 탭의 렌더링 배치만 격리되며, 기존 저장 데이터 및 API 연동 파이프라인은 완벽히 보존됨.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 기존 구글 캘린더/노션 연동 기능이나 DOM 요소를 임의로 삭제하지 않는다.
  - 기본 상태로 아코디언을 펼쳐두지 않는다 (기본 접힘 `isExpanded = false` 엄수).
- **해야 할 것 (Action)**:
  - `<details id="advancedSettingsAccordion" class="advanced-settings-accordion">` 신설.
  - 구글 캘린더, Gemini AI, Notion 동기화 블록을 `.advanced-settings-body`로 이동.
  - 12ms 미세 햅틱 및 `window.toggleAdvancedSettings` 전역 헬퍼 제공.
  - 모바일 375px 반응형 패딩 적용.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음 (기존 프로필 설정 유지).
- **2호 (스마트 스토리지 분기 설계)**: `state.profile.settings` 기존 필드 100% 유지.
- **3호 (4대 뷰 전파 배선도)**: 설정 탭 진입 시 자동 렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#advancedSettingsSummary` | 설정 탭 | 클릭/터치 | 아코디언 개폐 및 12ms 미세 햅틱 | 토글 상태 즉각 반영 |
| `#advancedSettingsAccordion` | 설정 탭 | toggle 이벤트 | `triggerHapticFeedback(12)` 트리거 | 햅틱 피드백 전달 |
| `#gcalQuickConnectBtn` | 고급 설정 내부 | 클릭 | 구글 캘린더 연동 모달 팝업 | 정상 모달 표출 |
| `#notionSwitch` | 고급 설정 내부 | 클릭 | 노션 동기화 토글 | 프로필 저장 및 뷰 갱신 |
| `#geminiKeyInput` | 고급 설정 내부 | 입력/변경 | Gemini API 키 저장 | 로컬 저장소 영속화 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 프로필 설정 데이터 100% 무손실 불변 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - 아코디언 내부에 필드가 숨겨지더라도 유저가 이미 구글이나 노션에 연동된 경우 요약 헤더에서 연동 상태를 쉽게 인지할 수 있도록 서브타이틀 제공.
- **엣지 케이스 (Edge Cases)**:
  - 캘린더 탭 등 외부에서 구글 캘린더 모달을 열거나 설정 변경을 요청할 때: 전역 함수 호출을 통해 완벽하게 연동 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `index.html` 내 `#advancedSettingsAccordion` 마크업 신설 및 전문가용 3대 블록 격리 이동.
  2. [단계 2]: `index.html` 내 `toggleAdvancedSettings` 및 12ms 햅틱 이벤트 리스너 배선.
  3. [단계 3]: `ui.css`에 `.advanced-settings-accordion`, `.advanced-settings-body` 스타일 선언.
  4. [단계 4]: `scripts/smoke-test.js`에 #TASK-ES-235 무결성 단언문 추가.
  5. [단계 5]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - `advancedSettingsAccordion`이 닫혀 있어도 `document.getElementById`로 모든 자식 폼 요소를 조회할 수 있으므로 기존 스크립트 실행에 단 1건의 사이드이펙트도 없음.
- **가정의 타당성 검증**:
  - HTML5 표준 `<details>` 태그는 모바일 사파리 및 안드로이드 크롬에서 네이티브로 완벽히 지원됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 모든 아코디언 토글 클릭 시 콘솔 에러 0건.
- `npm test` 336개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.
- Zero Dead-Click 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-235 (본질축: FIX/INFRA)
- 노션 DB 105번 항목과 완벽히 1:1 일치.
