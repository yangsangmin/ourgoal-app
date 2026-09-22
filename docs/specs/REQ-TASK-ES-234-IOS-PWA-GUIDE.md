# 요구사항 정의서 (REQ) — 아이폰(iOS Safari) 접속 시 '홈 화면에 추가(PWA)' 및 푸시 알림 100% 활성화 가이드 상시 탑재

> **문서 ID**: REQ-TASK-ES-234-IOS-PWA-GUIDE  
> **티켓 연계**: #TASK-ES-234  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다"*  
  > ➔ 노션 '💡 아워골 생각 메모장 (명령대기 & 아이디어 DB)' 104번 항목:  
  > **"아이폰(iOS Safari) 접속 시 '홈 화면에 추가(PWA)' 및 푸시 알림 100% 활성화 가이드 상시 탑재"** 착수.
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **iOS 사파리 사용자의 잦은 세션 끊김 및 PWA 설치 안내 부족**:
     - 아이폰 사파리 브라우저로 접속한 사용자는 하단 주소창으로 인해 화면 몰입도가 떨어지고, 탭이 닫히면 앱 재진입이 번거로움.
     - 기존 PWA 배너는 텍스트 위주로 간략히만 작성되어 직관적인 3단계 시각적 안내(공유 ➔ 홈 화면에 추가 ➔ 추가 완료)가 부족함.
  2. **iOS 16.4+ Web Push 알림 활성화 연계 미비**:
     - iOS 환경에서는 PWA로 홈 화면에 설치되어야만 Web Push 알림이 100% 동작하지만, 이에 대한 설명과 원클릭 권한 요청 가이드가 부재함.
  3. **가이드 재열람(상시 접근성) 부재**:
     - 사용자가 배너를 닫아버리면 다시 PWA 설치 및 푸시 알림 가이드를 열어볼 수 있는 상시 진입로가 결여됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
     - 3단계 비주얼 카드 및 상세 모달(`openIosPwaInstallGuideModal`) 결여.
  - **2층 (구조/프로세스 부재)**:
     - iOS 웹앱 환경과 Web Push 지원 조건(iOS 16.4+ PWA 필수)을 유저에게 친절하게 교육하는 온보딩 파이프라인 부재.
  - **3층 (시스템/유저 체감 괴리)**:
     - 유저는 앱스토어 앱과 같은 편리함을 원하지만 브라우저 탭으로만 사용하다가 이탈하는 문제 발생.
- **사용자 상황 및 페르소나**:
  - 아이폰(Safari)을 통해 아워골에 접속하여 매일 아침/저녁 리마인더 푸시를 받고 앱스토어 앱처럼 홈 화면에서 빠르게 실행하고 싶은 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: INFRA & FIX (iOS PWA 온보딩 및 모바일 하드웨어 OS 인터랙션 완비)
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"애플 WebKit의 특성을 꿰뚫어 사파리 주소창의 한계를 극복하고, 3단계 직관적 비주얼 가이드와 iOS 16.4+ Web Push 알림을 10초 만에 완비하여 네이티브 앱 이상의 쾌적한 몰입감을 선사하는 iOS 온보딩 엔진"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (텍스트 위주 배너의 낮은 주목도)**:
     - 사파리 하단 공유 버튼(⎋)과 [홈 화면에 추가] 단계가 시각적으로 분리되어 있지 않아 가독성이 떨어짐.
  2. **원인 2 (Web Push 알림 조건 안내 부재)**:
     - iOS에서 푸시 알림을 받으려면 홈 화면 추가가 필수라는 핵심 정보를 사용자에게 명확히 전달하지 못함.
  3. **원인 3 (상시 가이드 허브 부재)**:
     - 배너 닫힘 후에도 언제든 다시 열어볼 수 있는 상세 모달 및 버튼 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - iOS Safari 접속 시 3단계 비주얼 가이드 배너(`renderIosPwaBanner`)를 노출하고, 상세 모달(`openIosPwaInstallGuideModal`) 및 푸시 권한 요청 버튼을 4위 1체로 완벽 배선.
  - standalone 모드 실행 시 가이드 배너를 자동으로 소거하여 군더더기 없는 풀스크린 제공.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 `renderIosPwaBanner` 및 `.ios-pwa-banner` DOM 구조와 하위 호환성을 100% 보존.
  - `verify-all-clicks.js` 100% ALL PASS 보장.
- **체감 가설 (User Experience Hypothesis)**:
  > *"아이폰 사파리로 접속한 유저가 상단의 산뜻한 3단계 비주얼 가이드를 보고 10초 만에 홈 화면에 아워골을 추가한 후, 주소창 없는 전체화면 앱으로 매일 아침 리마인더 푸시를 받으며 완벽한 네이티브 앱 경험을 누리게 된다."*
- **기존 전체 기능 영향도 분석**:
  - 홈 화면: 상단 슬롯(#iosPwaSlot) 렌더링 개선 외 타 탭 무영향.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - 이미 홈 화면 앱(standalone)으로 접속한 유저에게 불필요한 배너를 노출하지 않는다.
  - 안드로이드나 데스크톱 유저에게 iOS 전용 배너가 뜨지 않도록 정밀 UserAgent 및 standalone 판정을 유지한다.
- **해야 할 것 (Action)**:
  - 3단계 비주얼 스텝(1️⃣ 하단 [공유] 탭 ➔ 2️⃣ [홈 화면에 추가] ➔ 3️⃣ 앱 실행 후 알림 허용) 그리드 렌더링.
  - `openIosPwaInstallGuideModal()` 상세 안내 모달 탑재 및 전역 노출.
  - `#btnOpenIosPwaGuideModal` 및 `#btnRequestIosPushPermission` 배선.
  - 15ms 미세 햅틱 피드백 적용.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**: `localStorage.getItem('ios_pwa_dismissed')` 배너 닫힘 영속화.
- **3호 (4대 뷰 전파 배선도)**: 홈 화면 진입 시 자동 렌더링.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#iosPwaDismissBtn` | iOS PWA 배너 | 클릭/터치 | 배너 닫기 및 `ios_pwa_dismissed` 저장 | 슬롯 즉시 비움 |
| `#btnOpenIosPwaGuideModal` | iOS PWA 배너 | 클릭/터치 | 상세 가이드 모달 팝업 및 15ms 햅틱 | 모달 즉시 노출 |
| `#btnRequestIosPushPermission` | 상세 모달 내부 | 클릭/터치 | Notification.requestPermission() 호출 | 권한 결과에 따른 토스트 안내 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 프로필 및 설정 데이터 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)

- **비판적 자기 검토 및 약점/한계 인정**:
  - standalone 모드에서는 배너가 불필요하지만, 만약 푸시 알림 설정이 필요한 경우 설정 탭에서도 안내를 확인할 수 있도록 배려.
- **엣지 케이스 (Edge Cases)**:
  - iOS Safari가 아닌 카카오톡 인앱 브라우저로 진입한 경우: 92번 항목에서 구축된 사파리 탈출 안내 배너가 우선적으로 동작하여 충돌 방지.
  - iPadOS 환경: navigator.userAgent 및 maxTouchPoints 감지로 아이패드에서도 동일하게 정상 작동.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)

- **구체적 실행 시퀀스**:
  1. [단계 1]: `index.html` 내 `renderIosPwaBanner` 3단계 비주얼 카드 및 `openIosPwaInstallGuideModal` 구현.
  2. [단계 2]: `ui.css`에 모바일 375px PWA 배너 및 스텝 카드 스타일 추가.
  3. [단계 3]: `scripts/smoke-test.js`에 #TASK-ES-234 검증 단언문 4종 추가.
  4. [단계 4]: `npm test` 실행 및 38개 헌법 게이트, Zero Dead-Click 100% PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - `Notification` API가 없는 구형 환경에서도 크래시 없이 안전하게 동작하도록 `typeof Notification !== 'undefined'` 방어 로직 완비.
- **가정의 타당성 검증**:
  - iOS 16.4 이상부터 PWA Web Push가 공식 지원되므로, 홈 화면 추가와 푸시 알림 연계는 필수적이고 완벽한 조합임.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건.
- `npm test` 336개 이상 전체 PASS (0 failure).
- 헌법 무결성 5대 게이트 38개 전수 ALL PASS.
- Zero Dead-Click 100% ALL PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 연계 티켓: #TASK-ES-234 (본질축: INFRA/FIX)
- 노션 DB 104번 항목과 완벽히 1:1 일치.
