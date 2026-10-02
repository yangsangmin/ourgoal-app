# 요구사항 정의서 (REQ) — [설정탭] 6대 대형 아코디언 비대화 압축 및 계정/보안/테마 3대 핵심 카드 중심 미니멀 IA 개편 & 불필요 개발자 필드 은폐

> **문서 ID**: REQ-TASK-ES-133-SETTINGS-IA  
> **티켓 연계**: #TASK-ES-133 ([133])  
> **작성 일시**: 2026-10-02  
> **작성자**: antigravity-session-75840bfe  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([133])**:
  > "실측 진단: 설정 탭 진입 시 상단 요약 카드 아래에 6개의 대형 아코디언이 수백 줄에 걸쳐 나열되어 스크롤 피로도 극심. 프로필 편집 버튼이 중복 존재하며, Google OAuth Client ID, 노션 DB ID 등 일반 사용자에게 불필요한 개발자 필드가 노출됨."
  > "[1차 작업 지침: TASK-ES-133 설정 탭 미니멀 IA 개편 및 3대 핵심 조망 카드 완성]"
  > "1. 상단 3대 조망 카드(프로필 요약, 화면스타일 4대 테마, 계정 보안 1초 조망)를 메인 대시보드로 정돈."
  > "2. 하위 세부 설정은 [알림 센터], [데이터 관리/백업], [고객지원 & 정보] 3대 그룹 메뉴로 간결화."
  > "3. 전문가용 외부 연동(OAuth, 노션 API)은 개발자 전용 [고급 설정] 딥링크로 분리하여 기본 화면에서 100% 은폐."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 설정 탭 진입 시 상단 헤더 바로 아래에 중복 타이틀(`설정`)과 중복 테마 스와치 카드가 렌더링되어 정보 과밀 발생.
  2. 하위 4대 아코디언 내부에 방대한 양의 폼 필드가 펼쳐져 스크롤 길이가 수천 픽셀에 달함.
  3. 일반 사용자에게 무의미한 개발자 전용 허브(`#og-task-23-container`) 및 API 키 필드가 하단에 노출되어 UX 시각적 완성도 저해.
- **표면 아래 기저 층위 분석**:
  - **1층 (조형/스타일 결함)**: 상단에 레거시 4대 테마 프리뷰 스와치와 성소 4대 테마 카드가 동시 렌더링되고, 개발자용 모듈화 컨테이너가 일반 화면에 노출됨.
  - **2층 (구조/프로세스 부재)**: 일반 사용자를 위한 핵심 조망 카드(프로필, 테마, 보안)와 전문가용 API 연동 간의 계층적 위계 분리가 미흡함.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 간단한 테마 변경이나 프로필 확인을 위해 설정에 들어왔으나, 복잡한 개발자 연동 폼과 장문의 아코디언으로 인해 심리적 진입 장벽을 느낌.
- **사용자 상황 및 페르소나**: 모바일에서 설정을 열람하는 유저가 불필요한 개발자 옵션과 중복 위젯에 방해받지 않고 1초 만에 계정 보안과 테마를 조망하고 필요한 설정을 제어하고자 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA / UX 조형 정상화`
- **[본질] (Essence)**: 설정 탭의 본질은 "나의 계정 상태, 현재 테마, 보안 수준을 1초 만에 파악(조망)하고, 원하는 옵션에 직관적으로 접근하는 미니멀 컨트롤 타워"여야 함.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 레거시 테마 스와치 카드(`themeSwatchGrid`)가 성소 테마 카드(`sanctuarySettingsSlot`)와 중복 노출되어 상단 조망 구획이 분산됨.
  2. **원인 2**: 컴포넌트 모듈화 허브(`#og-task-23-container`) 등 개발/테스트용 카드가 일반 설정 하단에 정적으로 남아있음.
  3. **원인 3**: 하위 아코디언 그룹의 시각적 경계가 모호하여 설정 화면 전체가 하나의 거대한 긴 스크롤로 체감됨.
- **[중심] (Core Bottleneck & Anchor)**: 상단 3대 조망 카드(프로필 요약 원카드 `#settingsHeroCard`, 화면스타일 4대 테마 `#sanctuarySettingsSlot`, 계정 보안 1초 조망 `#settingsSecurityCard`)를 단정하게 완성하고, 중복 테마 스와치 및 `#og-task-23-container`를 은폐하며, 아코디언을 깔끔한 토스식 둥근 카드로 정규화.
- **[핵심] (Critical Safety & Termination)**: 기존 스모크 테스트와 헌법 검증에서 사용하는 모든 DOM ID(`settingsHeroCard`, `settingsSecurityCard`, `themeGrid`, `advancedSettingsAccordion`, `gcalClientIdInput`, `notionSwitch`, `geminiKeyInput`, `og-task-23-container`)를 DOM에서 100% 무손실 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 설정 탭에 들어왔을 때, 상단 3대 조망 카드([프로필 | 4대 테마 | 계정 보안])가 시원하게 눈에 들어오며, 하위 아코디언들이 깔끔하게 접혀 있어 스크롤 피로 없이 원하는 설정만 펼쳐볼 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 세션, 기기 차단, 2단계 인증 로직 100% 정상 작동.
  - 홈 및 다른 탭: 영향 없음.
  - 설정 탭: 스크롤 길이 대폭 감소, 시각적 조형 완성도 토스급 극대화.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - `index.html`에서 `og-task-23-container`나 `advancedSettingsAccordion` 등 테스트 필수 요소를 삭제하지 않는다.
  - 아코디언 내부의 설정 저장 로직(알림, 프라이버시, 테마, 백업)을 훼손하지 않는다.
  - `advancedSettingsAccordion`에 `open` 속성을 부여하지 않는다 (스모크 테스트 불변식 준수).
- **해야 할 것 (Action)**:
  - `ui.css`:
    1. 중복 레거시 테마 스와치 카드(`#themeSwatchGrid` 컨테이너) 완전 은폐 (`display: none !important;`).
    2. 개발자 전용 모듈화 허브(`#og-task-23-container`) 완전 은폐 (`display: none !important;`).
    3. `#screen-settings .s-eyebrow, #screen-settings .s-title` 등 중복 상단 타이틀 소거 (`display: none !important;`).
    4. `.settings-group-accordion.toss-settings-group` 아코디언 카드의 둥근 모서리, 패딩, 테두리, summary 터치 영역(44px) 규격화.
    5. `#advancedSettingsAccordion` 개발자 고급 설정 구역의 명확한 서브 격리 스타일 배선.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - DOM 파괴 없이 CSS 박스 모델 및 선택자 제어로 100% 비파괴(Non-destructive) 미니멀 IA를 달성할 수 있으며 회귀 위험이 0%이기 때문임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 설정 IA 스타일 개선 작업으로 DB 스키마 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 스토리지 테마, 알림, 아코디언 상태 보존.
- **3호 (4대 뷰 전파 배선도)**: 테마 변경 시 `OurgoalSanctuaryV3.switchTheme`을 통해 전 탭에 실시간 적용.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnSettingsQuickAvatar` | 프로필 요약 카드 | 클릭/터치 | 아바타/프로필 편집 모달 호출 | 모달 안전 오픈 |
| `btnOpenDynamicAlbum` | 프로필 요약 카드 | 클릭/터치 | 아바타 도감 모달 호출 | 도감 렌더링 |
| `btnDeviceKillSwitch` | 계정 보안 카드 | 클릭/터치 | 원격 기기 차단 실행 | 토스트 안내 |
| `btnSettingsSecurityRefresh` | 계정 보안 카드 | 클릭/터치 | 보안 상태 점검 갱신 | 햅틱 피드백 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 이미지, 보관함, 레벨 100% 보존.
- **계정/세팅 보존**: 사용자 닉네임, 알림 설정, 백업 데이터 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**: 전문가용 외부 연동 필드가 은폐되어 접근하기 어려울 수 있으므로, [고급 설정] summary 타이틀에 "구글 캘린더 OAuth, 노션 DB 연동, Gemini API" 안내 문구를 유지하여 필요 시 언제든 탭하여 펼칠 수 있도록 보장함.
- **기존 기능과의 충돌 가능성 검토**: 스모크 테스트의 `toss-settings-hero-*`, `advancedSettingsAccordion`, `og-task-23-container` 어설션과 100% 일치 확인.
- **엣지 케이스 (Edge Cases)**:
  - 게스트 모드 진입 시: 프로필 카드에 "게스트 새싹 러너" 정상 렌더링.
  - 소셜 로그인 계정 진입 시: 이메일 및 2단계 인증 배지 정상 렌더링.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 중복 테마 스와치 및 `#og-task-23-container` 은폐 선언, 상단 3대 조망 카드 강조 스타일 및 아코디언 카드 조형 정규화 배선.
  2. [단계 2]: `npm test` 스모크 440개 및 무결성 게이트 38개 전수 실행.
  3. [단계 3]: Headless Chrome CDP로 390px 뷰포트에서 상단 3대 조망 카드, 아코디언 접힘 상태, `#og-task-23-container` 은폐 실측 및 스크린샷 캡처.
  4. [단계 4]: PR 생성, Court 통과 후 원격 main 병합 및 Tri-Sync 동기화.
- **화면 간 상호연동 전파 규격**:
  - 테마 스위치 시 `data-theme` 속성이 즉각 갱신되어 홈/목표/일정/기록/소통 전 탭에 일괄 반영.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: 비파괴 CSS 정돈 방식으로 JS 런타임 의존성이 없어 화이트스크린 발생 위험 0건.
- **가정의 타당성 검증**: 스모크 테스트 `[#TASK-ES-218]`, `[#TASK-ES-235]`, `[#TASK-ES-275]`가 요구하는 클래스 및 ID가 온전히 유지됨을 사전 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: `#themeSwatchGrid` DOM 요소 자체는 보존하되 외곽 카드 래퍼를 은폐하여 상단 조망 카드 3종이 완벽한 시각적 위계를 갖추도록 정돈.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test`: 스모크 440개 통과 (0개 실패), 무결성 38개 전수 통과.
- Zero Dead-Click 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `#settingsHeroCard` computed `display` !== 'none'
  - `#sanctuarySettingsSlot` computed `display` !== 'none'
  - `#settingsSecurityCard` computed `display` !== 'none'
  - `#og-task-23-container` computed `display` === 'none'
  - `#advancedSettingsAccordion` computed `open` === false
  - 모바일 390px 뷰포트에서 가로 스크롤 없음 (`docScrollWidth <= 390px`).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: `sanctuarySettingsSlot` 내부의 테마 카드와 `#themeSwatchGrid` 간의 클래스 간섭 -> **대책**: `#themeSwatchGrid` 상위 카드에 고유 ID `#legacyThemeSwatchCard` 부여 또는 선택자 정밀화로 개별 제어.
- **재검증 트리거**: `npm test` 실행 시 `advancedSettingsAccordion` 관련 단언이 실패할 경우 `open` 속성 및 부재 여부 재검증.
