# 요구사항 정의서 (REQ) — 1:1 DM 및 전역 알림(Web Push·ServiceWorker·스마트 폴링·상단바 알림센터) 무결성 전면 고도화 및 결함 개선

> **문서 ID**: REQ-TASK-ES-168-NOTIF-DM-IMPROVE  
> **티켓 연계**: #TASK-ES-168  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity (세션 ID: e7b6bd7c)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "아워골 dm 등, 알림이 제대로 작동 안함. 개선해"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 1:1 DM을 상대방이 보냈을 때 수신자에게 실시간 알림이 제대로 도달하지 않음.
  2. 앱을 닫았거나 백그라운드로 전환했을 때 푸시 알림(Web Push)이 전혀 오지 않음.
  3. 모바일 환경(Chrome on Android, PWA)에서 시스템 알림이 런타임 오류로 무음 실패함.
  4. 알림이 발생해도 상단바(Header)에 알림 벨 아이콘이나 알림 센터가 없어, 지나간 알림 내역을 다시 확인할 수 없고 미확인 배지도 눈에 띄지 않음.
  5. 네트워크 상태나 절전 모드로 웹소켓(Supabase Realtime)이 끊기면 새로고침 전까지 새 메시지를 알 수 없는 단절 현상 발생.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**:
    - DM 발송 시 (`team-invite-comm.js:send()`) Supabase DB `team_ping_replies`에만 insert하고, 수신자의 실제 기기로 푸시를 쏘는 `/api/push-dispatch` 호출이 완전히 누락되어 있음.
    - `api/push-dispatch.js`에 대상 유저 타깃팅(`targetUserId`) 분기가 누락되어 서버 푸시 발송 파이프라인이 단절됨.
    - `js/notify-engine.js`에서 모바일 브라우저에서 차단된 `new Notification()`을 무조건 호출하여 `Illegal constructor` 예외가 발생하고 catch문에서 삼켜짐 (`navigator.serviceWorker.ready.then(reg => reg.showNotification())` 누락).
  - **2층 (구조/프로세스 부재)**:
    - 헌법 제13조 제5항 2호에 명시된 "30초 스마트 폴링(Smart Polling) 백업"이 `team-invite-comm.js`에 구현되어 있지 않아 실시간 웹소켓 단절 시 복구 장치가 전무함.
    - 상단 네비게이션 바(`topbar-right`)에 알림 센터 진입점(🔔 아이콘 및 배지)이 누락되어, 유저가 미확인 알림(`settings.unreadNotifications`)을 조회하거나 관리할 수 있는 UI 창구가 차단됨.
  - **3층 (시스템/유저 체감 괴리)**:
    - 소통형 앱에서 메시지가 도착해도 알림이 오지 않아 동반자 간 소통이 단절되고 "앱이 먹통이다", "DM 기능이 가짜다"라는 깊은 불신감 초래.
- **사용자 상황 및 페르소나**:
  - 동반자나 팀원에게 DM을 보내고 일상 업무/공부를 위해 화면을 끄거나 다른 탭으로 이동한 모든 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E3` (동류 소통 루프) 및 `INFRA/FIX` (알림 인프라 결함 수정)
- **[본질] (Essence)**:
  - 1:1 DM 및 앱 내 상호작용이 발신자 화면의 자가 렌더링에만 머무르지 않고, 수신자의 온/오프라인 상태와 무관하게(앱 사용 중 포그라운드 플로팅 배너·소리·진동, 백그라운드 ServiceWorker 알림, 앱 종료 시 VAPID Web Push) 100% 확실하게 도달하는 **종단간(E2E) 상호작용 생존성 및 알림 센터 허브의 완성**.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (Web Push 발송 누락 및 API 엔드포인트 미배선)**: DM 전송 시 `api/push-dispatch` 호출이 누락되었고, `api/push-dispatch.js`에 `targetUserId` 즉시 발송 분기가 누락되어 백그라운드 푸시가 0% 도달함.
  2. **원인 2 (모바일 ServiceWorker showNotification 누락)**: `OurgoalNotifyEngine`이 모바일에서 사용 불가능한 `new Notification()`만 호출하여 모바일 PWA 환경에서 시스템 알림이 크래시됨.
  3. **원인 3 (스마트 폴링 백업 및 상단 알림 허브 부재)**: 웹소켓 단절 시 30초 주기 폴링 백업이 없고, 상단바에 알림 벨 아이콘 및 미확인 알림 센터 모달이 없어 알림 수신 상태를 확인/제어할 수 없음.
- **[중심] (Core Bottleneck & Anchor)**:
  - 메시지 생성부터 상대방 기기의 물리적 진동/소리/배너/푸시 및 알림 센터 도달까지 이어지는 단절 없는 4위 1체 발송-수신-표출 파이프라인.
- **[핵심] (Critical Safety & Termination)**:
  - 수신자 권한 거부나 오프라인 시에도 앱 먹통이 발생하지 않는 그레이스풀 폴백(Graceful Fallback), 그리고 수신자가 언제든 열어볼 수 있는 상단바 알림 센터 영속성.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 아워골을 켜두었든 화면을 껐든, 동반자에게 DM이나 응원이 오면 즉각 진동·소리·푸시로 인지하고, 상단바의 🔔 빨간 배지를 눌러 알림 센터에서 바로 대화방으로 이동할 수 있어 소통의 즉시성과 신뢰를 체감한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 게스트 모드에서는 소프트 가이드 유지, 로그인 유저는 `state.profile.id` 기준 푸시 및 실시간 수신 100% 정상 가동.
  - 홈 및 타 탭: 상단바 🔔 아이콘이 모든 화면에서 통일되게 노출되며 배지 카운트 실시간 연동.
  - 기존 데이터: `settings.notifications` 및 `settings.unreadNotifications` 무손실 유지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 외부 푸시 유료 솔루션 도입 금지 (기존 VAPID Web Push 및 Supabase Realtime 100% 활용).
  - 기존 UI 레이아웃 깨뜨리기 금지 (`topbar-right` 내 기존 버튼들 완벽 보존하며 🔔 버튼 자연스럽게 배치).
  - 무단 축약 코드(`// ...`) 작성 영구 금지.
- **해야 할 것 (Action)**:
  1. `api/push-dispatch.js`: `POST` 요청 시 `targetUserId` 분기 추가하여 수신자 푸시 구독(`push_subscriptions`) 대상 즉시 `webpush.sendNotification` 발송.
  2. `js/team-invite-comm.js`:
     - DM 전송(`send()`) 시 `fetch('/api/push-dispatch')` 비동기 발송 결합.
     - 30초 주기 스마트 폴링(`setInterval`) 배선하여 웹소켓 끊김 시에도 새 DM 자동 감지 및 배지 점등.
     - 대화방 열람 중 새 메시지 수신 시 DOM 즉각 추가 및 스크롤 배선.
  3. `js/notify-engine.js`:
     - 모바일 브라우저 대응: `navigator.serviceWorker.ready`를 통한 `reg.showNotification()` 최우선 호출 및 데스크톱 폴백.
     - 오디오 제약 대응: 첫 터치/클릭 시 AudioContext 자동 unlock 리스너 추가.
  4. `index.html`:
     - 상단바 우측에 알림 벨 버튼(`topNotifBtn`) 및 배지(`topNotifBadge`) 추가.
     - 알림 센터 모달(`openNotificationCenterModal`) 구축 (최근 알림 리스트, 클릭 시 해당 DM/소통 화면 이동, 전체 읽음 처리).
     - `sw.js`의 `CACHE_NAME` 갱신 (헌법 제14조 제3항 준수).

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase `team_pings`, `team_ping_replies`, `push_subscriptions` 테이블 활용 (기존 스키마 100% 호환, 신규 DDL 불필요).
- **2호 (스마트 스토리지 분기 설계)**:
  - 미확인 알림 목록은 `state.profile.settings.unreadNotifications` (최대 50건)에 저장되고 `saveProfile()`을 통해 Supabase `users.settings` 원격 영속화 및 `localStorage` 3중 백업.
- **3호 (4대 뷰 전파 배선도)**:
  - 알림 수신 및 읽음 처리 시 `updateTopBar()`와 함께 상단 알림 배지 동시 갱신, DM 상태 변동 시 `renderCommScreen()` 연계.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#topNotifBtn` | 상단바 우측 | 클릭/터치 | 알림 센터 모달(`openNotificationCenterModal`) 호출 | 알림 없어도 빈 안내 렌더링 |
| `#notifCenterMarkAllRead` | 알림 센터 모달 | 클릭/터치 | 모든 미확인 알림 읽음 처리 및 배지 제거 | 성공 토스트 안내 |
| `.notif-item` | 알림 센터 모달 | 클릭/터치 | 해당 알림 대상(DM 채팅방 또는 탭)으로 즉시 이동 후 모달 닫기 | 이동 실패 시 홈 탭으로 안전 이동 |
| `#dmSend` | 소통 > DM 화면 | 클릭/터치 | DB 영속화 + Web Push 비동기 발송 + 낙관적 UI 표출 | 공백 입력 시 방어, 실패 시 안내 |
| `#testNotifyBtn` | 설정 > 알림 센터 | 클릭/터치 | 통합 알림 엔진(배너+소리+진동+시스템알림) 즉시 테스트 발송 | 권한 상태에 따른 적절한 피드백 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 320종 페르소나, 커스텀 아바타, 보관함 데이터 100% 보존.
- **목표 데이터 보존**: 기존 목표 목록, 마일스톤 상태 100% 불변.
- **기록 데이터 보존**: 체크인 및 회고 기록 원형 유지.
- **화면 구성 세팅값 보존**: 테마, 폰트, 알림 설정 옵션 100% 보존.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - Web Push 발송은 유저가 푸시 권한을 허용하고 `push_subscriptions`에 등록된 경우에만 작동한다. 따라서 권한이 없거나 미등록된 유저를 위해 인앱 포그라운드 플로팅 배너, 30초 스마트 폴링, 상단바 알림 센터의 3중 방어망을 필수로 함께 가동해야 한다.
- **기존 기능과의 충돌 가능성 검토**:
  - `topbar-right`에 알림 벨 버튼을 추가할 때 기존 '💡 활용법', '⚙️ 홈구성', '프로필 칩'의 간격과 모바일 반응형 뷰포트가 깨지지 않도록 컴팩트한 flex 배치 적용.
- **엣지 케이스 (Edge Cases)**:
  - 게스트 모드: 알림 센터 모달은 정상 작동하되 "로그인하면 동료들과 실시간 DM과 푸시 알림을 받을 수 있어요" 안내 제공.
  - 네트워크 단절: 스마트 폴링 실행 시 조용히 catch하여 콘솔 에러 발생 방지.
  - 알림 과다: `unreadNotifications`는 최대 50개로 제한하여 메모리/스토리지 낭비 방지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `api/push-dispatch.js`: `targetUserId` 푸시 발송 로직 추가 및 문법 검증.
  2. `js/notify-engine.js`: 모바일 ServiceWorker `showNotification` 및 AudioContext unlock 보강.
  3. `js/team-invite-comm.js`: DM 전송 시 Web Push 발송 연동, 30초 스마트 폴링 루프 탑재, 활성 대화방 실시간 DOM 동기화 보강.
  4. `index.html` & `ui.css`: 상단바 🔔 알림 버튼 및 배지 마크업, 알림 센터 모달(`openNotificationCenterModal`) 구현, 배지 동기화 함수 배선.
  5. `sw.js`: `CACHE_NAME` 최신 티켓 버전으로 갱신.
  6. 검증: 단위 테스트 및 `npm test`, `verify-integrity-gate.js` 전수 실행.
- **화면 간 상호연동 전파 규격**:
  - 새 알림 수신 시: 상단바 🔔 배지(`topNotifBadge`), 하단 소통 탭 배지, DM 서브탭 배지가 실시간 동시 점등.
  - 알림 센터 열람 또는 대화방 진입 시: 해당 알림 즉시 읽음 처리 및 배지 동시 소등.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - Web Push 발송 API(`/api/push-dispatch`)가 서버 오류(500)나 네트워크 문제로 실패하더라도, 발신자의 DM 전송 자체는 성공해야 하며 수신자의 인앱 실시간 웹소켓/스마트 폴링에는 아무 영향이 없도록 try/catch로 완벽 격리함.
- **가정의 타당성 검증**:
  - 모바일 브라우저에서 Service Worker가 아직 준비되지 않은 경우(`navigator.serviceWorker.ready` 지연) Promise 타임아웃 또는 일반 브라우저 알림으로 우아하게 폴백하도록 설계함.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 상단바 알림 벨 버튼 클릭 시 단순히 알림 목록만 보여주는 것이 아니라, 알림 항목을 누르면 해당 DM 대화방(`state.commSubTab = 'dm'`, `state.dmActiveId = senderId`)으로 직접 라우팅되어 원터치로 답장할 수 있도록 액션 흐름을 직결 배선함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 콘솔 에러 0건 유지.
- `api/push-dispatch.js` 타깃 푸시 발송 기능 정상 구동.
- `OurgoalNotifyEngine` 모바일 PWA 환경 크래시 방지 및 알림 발송 정상.
- 상단바 알림 버튼 클릭 시 알림 센터 모달 정상 호출 및 읽음 처리 동작.
- `npm test` 및 `verify-integrity-gate.js` 100% ALL PASS (0 failure).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: VAPID 키나 Push Subscription 환경변수 부재 시 API 500 에러 가능성 -> **대책**: 서버리스 함수 내 환경변수 부재 시 그레이스풀하게 200 반환 및 클라이언트 무중단 보호.
- **예상 블로커 2**: 상단바 뷰포트 좁음으로 인한 모바일 줄바꿈 현상 -> **대책**: 아이콘 버튼 32x32px 콤팩트 규격 적용.
- **재검증 트리거**: 알림 배지가 갱신되지 않거나 클릭 시 반응이 없으면 원칙 ⑤의 상호연동 전파 배선으로 즉시 회귀하여 DOM ID와 이벤트 리스너를 재검증함.
