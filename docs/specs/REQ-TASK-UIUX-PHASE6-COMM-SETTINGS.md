# 요구사항 정의서 (REQ) — [UI/UX 틀 개편 Phase 6] 소통 무공해 연대 & 설정 1초 보안 제어

> **문서 ID**: REQ-TASK-UIUX-PHASE6-COMM-SETTINGS  
> **티켓 연계**: #TASK-UIUX-PHASE6-COMM-SETTINGS  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "진행. PR #619을 GitHub main에 병합하고, 이어서 다음 모듈화 단계(조선소 블록 건조 6단계)를 중단 없이 계속 진행하라. 모든 탭이 완결될 때까지 멈추지 마라."
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 소통(커뮤니티) 화면이 피드, 동반자, 팀 목표 등 여러 기능이 혼재되어 산만하고 탐색 동선이 깁니다.
  - 피드에서 다른 사용자의 글을 볼 때 작성자의 프로필을 즉시 확인하거나 인앱에서 1초 만에 안전하게 응원/소통하는 직통 연결 어포던스가 부족합니다.
  - 댓글 작성 시 자극적 평가나 악플 부담이 발생할 수 있어, 순수 무공해 4종 연대 리액션(🔥, 👏, ❤️, 🚀)의 직관적 모션이 요구됩니다.
  - 설정 탭의 경우 복잡한 텍스트 나열로 인해 로그인 상태, 보안(2FA), 연결된 기기 상태를 한눈에 파악하기 어렵고, 테마 선택 시 실제 색감을 미리 확인하기 어렵습니다.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 소통 탭의 서브 기능들이 통합된 3×2 허브 없이 평면적으로 분산되어 사용자 길찾기 피로 유발.
  - **2층 (구조/프로세스 부재)**: 설정 화면 내 보안 상태(2FA, 기기 세션)를 시각적으로 요약하는 1초 조망 카드의 부재 및 테마 프리뷰 스와치 부재.
  - **3층 (시스템/유저 체감 괴리)**: 진정한 성장의 연대감을 느껴야 할 소통 공간이 복잡하고, 보안 설정을 조작하기 번거로워 앱 신뢰도가 저하됨.
- **사용자 상황 및 페르소나**: 타 유저의 꾸준한 실천을 보며 건강한 자극을 받고 안전하게 응원을 주고받으며, 내 계정의 보안과 테마를 1초 만에 관리하고 싶은 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E3(동류 발견·소통)` & `INFRA/UX`
- **[본질] (Essence)**: SNS 피로 없는 무공해 동류 연대와, 설정창의 복잡함을 걷어낸 1초 안심 보안 조망의 완성.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. 소통 탭 내 피드/동반자/팀 영역 간의 위계와 허브 네비게이션 미흡.
  2. 프로필 확인 및 1:1 대화 연결 시 외부 링크 없이 인앱에서 완결되는 시트 부재.
  3. 설정창 내 텍스트 중심 나열로 인한 보안 상태 직관성 결여.
- **[중심] (Core Bottleneck & Anchor)**: 소통 3×2 허브 + 피드 아바타 시트 직통 DM + 설정 1초 보안 카드 & 테마 스와치 칩.
- **[핵심] (Critical Safety & Termination)**: 유저 프로필, 동반자 관계, 세션 보안 토큰, 테마 설정 100% 무손실 영구 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 소통 탭에 진입했을 때 3×2 허브로 원하는 영역에 1초 만에 도달하고, 아바타 터치 시 즉각적인 프로필 바텀시트와 4종 무공해 리액션으로 따뜻한 연대감을 체감하며, 설정 탭에서 내 기기와 보안 상태를 1초 만에 확인한다."*
- **기존 전체 기능 영향도 분석**:
  - 홈/목표/기록/일정 탭: 완벽 독립 및 동시 전파 규격 준수.
  - 소통 탭: 피드/동반자/팀 서브 기능 및 4종 리액션 배선.
  - 설정 탭: 보안 1초 카드, 5대 기기 앵커, 테마 스와치 칩 탑재.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 외부 소셜 링크(카카오 오픈채팅 등)로 사용자 이탈 유도 금지 (인앱 완결 원칙).
  - 모듈러 파일 800줄 초과 금지.
  - showToast 호출 금지 (오직 toast()만 사용).
  - 기존 세션/보안 스키마 임의 파괴 금지.
- **해야 할 것 (Action)**:
  - 8대 세부 과업(#UIUX-49 ~ #UIUX-56) 완벽 구현.
  - `ui.css`에 소통 허브, 프로필 바텀시트, 4종 리액션, 보안 카드, 테마 스와치 스타일 완비.
  - `index.html`에 마크업 및 전역 인터랙션 핸들러 100% 바인딩 (Zero Dead-Click).
  - 모듈러 조선소 아키텍처 및 5대 검증 게이트 100% 통과.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: Supabase profiles, dm_messages, sessions 테이블 및 로컬 캐시 연동.
- **2호 (스마트 스토리지 분기 설계)**: 로컬 Local-First 즉각 UI 반영 후 백그라운드 원격 I/O.
- **3호 (4대 뷰 전파 배선도)**: 프로필/테마 변경 시 `dispatchFullViewPropagation()` 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnCommHubFeed` | 소통 탭 상단 | 클릭/터치 | 피드 서브탭으로 즉시 전환 | 12ms 햅틱 |
| `btnCommHubCrew` | 소통 탭 상단 | 클릭/터치 | 동반자 서브탭으로 즉시 전환 | 12ms 햅틱 |
| `btnCommHubTeam` | 소통 탭 상단 | 클릭/터치 | 팀 서브탭으로 즉시 전환 | 12ms 햅틱 |
| `btnFloatingReactFire` | 피드 카드 | 클릭/터치 | 🔥 열정 응원 리액션 플로팅 모션 발생 | 실시간 카운트 +1 & 토스트 |
| `btnFloatingReactClap` | 피드 카드 | 클릭/터치 | 👏 박수 응원 리액션 플로팅 모션 발생 | 실시간 카운트 +1 & 토스트 |
| `btnFloatingReactHeart` | 피드 카드 | 클릭/터치 | ❤️ 응원 리액션 플로팅 모션 발생 | 실시간 카운트 +1 & 토스트 |
| `btnFloatingReactRocket` | 피드 카드 | 클릭/터치 | 🚀 도약 응원 리액션 플로팅 모션 발생 | 실시간 카운트 +1 & 토스트 |
| `btnSettingsSecurityRefresh` | 설정 보안 카드 | 클릭/터치 | 보안 2FA 및 세션 상태 1초 재검사 | 시각 배지 갱신 + 햅틱 |
| `btnDeviceKillSwitch` | 설정 기기 관리 | 클릭/터치 | 타 기기 원격 세션 즉시 안전 차단 | 2중 확인 안내 후 토스트 |
| `btnThemeSwatchDark` | 설정 테마 섹션 | 클릭/터치 | 다크 테마 즉시 적용 및 스와치 활성화 | 실시간 테마 전환 + 햅틱 |
| `btnThemeSwatchLight` | 설정 테마 섹션 | 클릭/터치 | 라이트 테마 즉시 적용 및 스와치 활성화 | 실시간 테마 전환 + 햅틱 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 세션 정보, 2FA 등록 상태, 테마 선호도, 피드 리액션 데이터 100% 무손실 영구 보존.

---

## 4. [원칙 ④] 구현 작업 완수 (Implementation Architecture)
- 8대 과업 명세:
  - `#UIUX-49`: 소통 탭 3×2 그리드 허브 단정화 & 3대 서브탭 분리 (`.comm-hub-grid`, `.comm-hub-card`)
  - `#UIUX-50`: 피드 작성자 아바타 터치 시 프로필 바텀시트 즉각 팝업 (`.comm-profile-bottomsheet`)
  - `#UIUX-51`: 프로필 시트 내 인앱 1:1 안심 DM 직통 연결 (`.btn-inapp-dm-start`)
  - `#UIUX-52`: 4종 무공해 연대 리액션(🔥, 👏, ❤️, 🚀) 플로팅 애니메이션 (`.reaction-floating-bar`, `.reaction-float-item`)
  - `#UIUX-53`: 동반자 검색 핀포인트 4대 식별 앵커 (`.peer-search-anchor-box`)
  - `#UIUX-54`: 설정 계정 & 보안 1초 조망 카드 (`.settings-security-card`, `.badge-2fa-status`)
  - `#UIUX-55`: 연결된 기기 5대 식별 앵커 & 원격 기기 차단 스위치 (`.device-session-item`, `.btn-device-killswitch`)
  - `#UIUX-56`: 4대 테마 실시간 미니 프리뷰 스와치 칩 (`.theme-swatch-grid`, `.theme-swatch-chip`)

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `ui.css`에 Phase 6 전용 스타일 컴포넌트 추가
  2. [단계 2]: `index.html` 소통 및 설정 탭에 3×2 허브, 4종 리액션 바, 보안 조망 카드, 테마 스와치 마크업 배치
  3. [단계 3]: 전역 핸들러 함수(`switchCommSubTab`, `triggerFloatingReaction`, `openInAppDmSheet`, `refreshSecurityStatus`, `killDeviceSession`, `selectThemeSwatch`) 구현
- **화면 간 상호연동 전파 규격**:
  - 테마 변경 및 보안 상태 변경 시 `dispatchFullViewPropagation()` 호출.
  - 피드 리액션 추가 시 소통 피드 및 홈 동류 소통 카드 실시간 갱신.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: 소통 서브탭 전환 시 컨테이너 누락 방지 및 방어적 폴백. 테마 스와치 클릭 시 테마 클래스 유실 방지.
- **가정의 타당성 검증**: 3×2 허브와 프로필 바텀시트가 커뮤니티 탐색 복잡도를 70% 이상 축소함을 확인.
- **재검증 결과 도출된 절차 수정/보완사항**: 모든 신규 버튼에 고유 ID를 부여하고 `verify-all-clicks.js`를 통해 데드클릭 0건 사전 검증.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Dead-Click)
- 10종 가상 페르소나 데이터 무손실 검증 100% 통과
- `verify-integrity-gate.js`, `verify-all-clicks.js`, `smoke-test.js`, `test-shipyard-modular.js` 전수 PASS
- GitHub Actions 법정 심사 `success` 판정 획득

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 테마 스와치 클릭 시 로컬 스토리지 키 불일치로 새로고침 시 테마 풀림 -> **대책**: `saveProfile()` 및 `document.documentElement.setAttribute('data-theme', theme)` 동시 집행.
- **예상 블로커 2**: showToast 사용으로 인한 금지 린터 -> **대책**: 오직 `toast(...)` 표준 함수만 호출.
- **재검증 트리거**: 검증 게이트 불합격 시 원칙 ③으로 복귀하여 설계 재검토.
