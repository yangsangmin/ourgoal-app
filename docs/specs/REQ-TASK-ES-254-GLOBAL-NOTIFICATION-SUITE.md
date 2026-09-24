# 요구사항 정의서 (REQ) — 백그라운드·앱종료·미확인 전역 알림(DM 포함) 전수 구현 및 세부 알림 설정창 구축

> **문서 ID**: REQ-TASK-ES-254-GLOBAL-NOTIFICATION-SUITE  
> **티켓 연계**: #TASK-ES-254  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  *"모든 알림(앱을 꺼뒀을 때나, 백그라운드 실행되고 있을 때, 또는 지금 내가 보는창(모든 탭,팝업효과 등 포함)에서 확인 안되는 사항)이 필요한 사항들에 대해 지금 알림기능이 구현이 안되어 있는 것들(예를 들어 DM) 모두 확인하고 그것들을 모두 구현하고, 설정창에서 각 모든 알림을 앱이 꺼져있을때나 백그라운드로 실행중일 때 받을지 안받을지, 진동으로 받을지, 소리로 받을지, 알림을 받을거면 어떤 알림인지만 표현할지, 세부내용까지 표현할지를 모두 선택할 수 있게끔 해줘야해."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 사용자가 다른 탭(홈, 목표, 일정, 기록, 설정)을 이용 중이거나 모달 창이 열려 있을 때, 1:1 대화(DM), 응원(Cheers), 팀 활동 등이 도착해도 즉각적인 시각/청각 피드백 없이 지나치게 되는 소통 단절 현상.
  - 응원(Cheers) 수신 시 전역 알림 엔진(`OurgoalNotifyEngine`)을 거치지 않고 단순 `new Notification`만 호출되어 포그라운드 배너 및 사운드/진동 피드백이 누락됨.
  - 설정창의 스위치(`notifTeamSwitch`, `notifCheersSwitch` 등)가 저장하는 프로퍼티와 `OurgoalNotifyEngine`이 참조하는 `settings.notifications` 객체 간 키 구조 불일치로 인해 설정 변경이 엔진에 온전히 전달되지 않는 결함.
  - 백그라운드 및 앱 종료 상태에서 알림 수신 시 사용자 프라이버시(간략형 vs 상세형) 및 피드백 방식(소리/진동/무음)이 개별적·일관적으로 반영되지 못했던 점.
- **기저 층위 심층 분석**:
  - **1층 (미작동/단절 결함)**: 응원/댓글 및 팀원 인증 발생 시 전역 알림 디스패치 파이프라인 미배선.
  - **2층 (구조/프로세스 부재)**: 설정창 UI 컨트롤러와 `OurgoalNotifyEngine`의 데이터 모델(`settings.notifications`) 간 1:1 원자적 결속 부재.
  - **3층 (시스템 괴리)**: 백그라운드 Web Notification 및 Service Worker 알림에서 프라이버시 설정(요약 vs 상세)이 분기되지 않고 하드코딩 노출될 위험.
- **대상 사용자 페르소나 및 발생 상황**:
  - 앱을 백그라운드로 내려두고 일상 업무를 보거나, 아워골 내 다른 화면(목표 작성, 캘린더 확인, 통계 열람 등)에 몰입해 있는 모든 활성 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `FIX/INFRA` & `E3` (소통과 동류 연대의 실시간 연결성 및 무중단 전달성 보장)
- **[가목] 본질 (Essence)**:
  - 1. **무공해성 (Anti-Pollution)**: 스팸성 광고 알림이 아닌, 유저의 실질적 동반자 소통(DM), 동류의 응원, 자신의 목표/일정 마감만을 엄선하여 전달하는 정갈한 알림 경험.
  - 2. **RPG식 체감 (Immediate Self-Efficacy)**: 상대방의 응원이나 내 일정 리마인더가 적시에 도달하여 다음 행동을 즉시 촉발하는 효능감.
  - 3. **동류 연대 (Peer Accompaniment)**: 타 화면 이용 중이거나 백그라운드 상태에서도 나와 연결된 동반자들의 소식을 놓치지 않는 무공해 연대감 형성.
- **[나목] 원인 (Root Causes - 기저 원인 3가지)**:
  - **원인 1**: 응원/댓글 및 팀 활동 알림 발송부가 `OurgoalNotifyEngine.dispatchGlobalNotification`으로 일원화되지 않고 분산되어 있었던 점.
  - **원인 2**: 설정창의 유형별 알림 스위치(`settings.notifCheers`, `settings.notifTeamVerify`)와 알림 엔진 설정(`settings.notifications.teamActivities`, `settings.notifications.cheerActivities`) 간의 데이터 경로 불일치.
  - **원인 3**: 백그라운드 Service Worker 알림 옵션 생성 시 프라이버시 수준(`summary` vs `detail`) 마스킹 로직이 체계적으로 연동되지 못했던 점.
- **[다목] 중심 (Core Bottleneck)**:
  - 모든 알림 이벤트(DM, 응원, 팀, 일정)의 진입점을 `OurgoalNotifyEngine.dispatchGlobalNotification` 단일 관문으로 통일하고, 설정창 5대 제어 항목(수신 방식, 프라이버시 노출도, 백그라운드 여부, 유형별 On/Off, 실시간 테스트)을 원자적으로 완결하는 것.
- **[라목] 핵심 (Critical Anchor)**:
  - 알림 수신 시 4위 1체(포그라운드 상단 배너 + 사운드/진동 + 미확인 큐 저장 + 상단바 알림 배지 갱신) 배선 및 4대 뷰 무조건 원자적 동시 전파.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 어떤 화면을 보고 있든, 혹은 앱을 내려놓았든, 동반자의 DM과 소중한 응원이 사용자가 설정한 피드백 방식(소리/진동)과 프라이버시 수준(요약/상세)에 맞추어 정확하고 깔끔하게 전달되어 결코 소통이 단절되지 않는 신뢰를 얻는다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 불필요한 서드파티 상용 푸시 라이브러리 추가 도입 금지 (기존 순수 Web Notification 및 Service Worker 아키텍처 극대화).
  - 기존 `unreadNotifications` 데이터 구조 파괴 금지 (합집합 비파괴 보존).
- **해야 할 것 (Action)**:
  - 알림 이벤트 전수 일원화: DM, 응원(Cheers), 팀 활동, 일정/목표 리마인더 전수 `dispatchGlobalNotification` 연계.
  - 설정 탭 세부 알림 제어 센터 UI 완비: 피드백 방식(소리+진동/소리만/진동만/무음), 프라이버시(상세/간략형), 백그라운드 수신 토글, 유형별 5종 스위치 완전 배선.
  - 즉시 체감용 '전역 알림 실시간 테스트 울리기' 핸들러를 고도화하여 현재 설정값(소리/진동/간략형 등)이 즉각 반영되는 샌드박스 제공.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `profiles.settings.notifications` JSONB 내에 아래 5대 제어 스키마 영속화:
  - `feedbackMode`: `'all'` | `'sound'` | `'vibrate'` | `'silent'`
  - `privacyLevel`: `'detail'` | `'summary'`
  - `bgEnabled`: `true` | `false`
  - `dmMessages`: `true` | `false`
  - `teamActivities`: `true` | `false`
  - `cheerActivities`: `true` | `false`
  - `goalReminders`: `true` | `false`
  - `streakReminders`: `true` | `false`
  - `unreadNotifications`: 최대 50건 보존 큐 (`id`, `type`, `title`, `body`, `targetTab`, `targetDmId`, `createdAt`, `read`)
- **2호 (스마트 스토리지 분기 설계)**: 로컬 캐시(`localStorage.ourgoal_profile`) 및 Supabase 원격 DB(`users.settings`) 동시 원자적 트랜잭션.
- **3호 (4대 뷰 전파 배선도)**: 알림 발생 및 읽음 처리 시 `renderSettingsScreen()`, `renderHome()`, `renderCommScreen()`, `updateTopNotifBadge()` 원자적 동시 호출.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-notifmode]` (4종) | 설정 탭 > 알림 센터 | 클릭 | 피드백 모드(소리+진동/소리만/진동만/무음) 즉시 전환 및 샘플 사운드/진동 재생 | 선택 모드 즉각 토스트 및 12ms 햅틱 |
| `[data-privacy]` (2종) | 설정 탭 > 알림 센터 | 클릭 | 알림 노출 수준(상세 내용 vs 간략형 보안 마스킹) 전환 및 설정 저장 | 변경 완료 토스트 안내 |
| `#notifBgSwitch` | 설정 탭 > 알림 센터 | 클릭 | 백그라운드 Web Notification 수신 On/Off 토글 | 켜짐/꺼짐 즉각 토스트 |
| `#btnReqNotifPerm` | 설정 탭 > 알림 센터 | 클릭 | 브라우저 시스템 알림 권한(`Notification.requestPermission`) 요청 | 허용/거부 상태 라벨 갱신 및 토스트 |
| `#notifDmSwitch` | 설정 탭 > 알림 센터 | 클릭 | 1:1 DM 및 메시지 수신 알림 On/Off 토글 | On/Off 토스트 |
| `#notifTeamSwitch` | 설정 탭 > 알림 센터 | 클릭 | 팀원 일일 인증 및 활동 알림 On/Off 토글 | On/Off 토스트 |
| `#notifCheersSwitch` | 설정 탭 > 알림 센터 | 클릭 | 응원 및 댓글 알림 On/Off 토글 | On/Off 토스트 |
| `#notifDdaySwitch` | 설정 탭 > 알림 센터 | 클릭 | 마감 D-day 및 캘린더 리마인더 On/Off 토글 | On/Off 토스트 |
| `#notifStreakSwitch` | 설정 탭 > 알림 센터 | 클릭 | 일일 스트릭 유지 리마인더 On/Off 토글 | On/Off 토스트 |
| `#testNotifyBtn` | 설정 탭 > 알림 센터 | 클릭 | 설정된 피드백 모드/프라이버시 기반 실시간 테스트 알림 발송 | 플로팅 배너 표출, 벨 배지 +1, 토스트 |
| `#topNotifBtn` | 상단 네비게이션 바 | 클릭 | 전역 알림 센터 모달(`openNotificationCenterModal`) 오픈 | 미확인 알림 목록 표출 |
| `.notify-banner-close` | 포그라운드 플로팅 배너 | 클릭 | 배너 즉시 닫기 | 배너 애니메이션 페이드아웃 |
| `#globalNotifyBanner` | 포그라운드 플로팅 배너 | 본문 클릭 | 해당 알림의 대상 탭(`targetTab`) 및 DM방/목표로 직통 네비게이션 | 탭 전환 및 배너 자동 닫힘 |

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **오프라인/네트워크 단절 환경**: 로컬 스토리지에 미확인 알림 큐를 안전하게 적재하여 네트워크 복구 시에도 알림 내역이 유실되지 않도록 보장.
- **브라우저 알림 권한 거부(`denied`) 엣지 케이스**: 브라우저 알림이 차단되어도 앱 내 포그라운드 플로팅 배너 및 사운드/진동, 상단 알림 배지는 100% 정상 작동하도록 폴백 분기.
- **야간 방해금지 모드(Quiet Hours)**: 사용자가 설정한 방해금지 시간대에는 소리/진동 및 Web Notification을 침묵시키되, 미확인 알림 센터 큐에는 조용히 기록하여 기상 후 확인할 수 있도록 배려.
- **기존 코드와의 완벽한 하위 호환**: `settings.notifCheers`, `settings.notifTeamVerify` 등 과거 플래그도 양방향 미러링하여 기존 유저 설정값이 1바이트도 유실되지 않도록 방어.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
1. **1단계 (엔진 고도화)**: `js/notify-engine.js` 내 설정 키 매핑 보강, 프라이버시 마스킹 강화, 유형별 필터(`cheerActivities`, `streakReminders` 등) 완전 지원.
2. **2단계 (알림 발송지 전수 통합)**:
   - `index.html` 내 응원(Cheers) 수신 시 `OurgoalNotifyEngine.dispatchGlobalNotification` 연결.
   - 팀 목표 인증 및 캘린더 리마인더 이벤트 발생 시 `dispatchGlobalNotification` 연결.
3. **3단계 (설정창 UI/UX 동기화)**:
   - `index.html` 내 `renderSettingsScreen`의 알림 제어 스위치 5종을 `notifConfig` 객체와 1:1 완벽 양방향 바인딩.
   - `testNotifyBtn` 테스트 발송 로직을 실제 유저 설정(소리/진동/간략형)과 100% 연동.
4. **4단계 (서비스워커 및 백그라운드 점검)**: `sw.js`의 푸시/알림 수신 파이프라인 무결성 확인.
5. **5단계 (검증 및 전파)**:
   - 단위 테스트 작성 (`tests/global-notification-suite.test.js`).
   - 스모크 테스트 및 헌법 5대 검증 게이트 100% 통과 확인.
   - 4대 뷰 원자적 동시 전파.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점(SPOF) 검증**:
  - `AudioContext`가 모바일 브라우저의 사용자 제스처 정책으로 인해 차단될 경우, 사운드 재생 실패가 전체 알림 파이프라인(배너/저장)을 중단시키지 않도록 `try-catch` 완전 방어.
  - `Notification` API가 미지원되거나 차단된 인앱 브라우저(카카오톡, 인스타그램 등)에서도 포그라운드 플로팅 배너와 진동은 정상 동작함을 확인.
- **재검증으로 인한 절차 수정**:
  - `OurgoalNotifyEngine` 내부 설정 읽기 시 `state.profile.settings.notifications`뿐 아니라 기존 레거시 `settings.notifCheers` 등도 함께 폴백으로 읽어들이는 듀얼 리더(Dual Reader) 구조 적용.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- **측정 기준 (Metrics)**:
  - 1. 설정창에서 피드백 모드 4종(소리+진동/소리만/진동만/무음) 클릭 시 설정 객체 및 즉각 피드백 정상 작동.
  - 2. 알림 프라이버시(상세 vs 간략형) 토글 시 알림 메시지 본문 마스킹 정상 적용.
  - 3. 유형별 알림 스위치 5종 조작 시 `notifConfig`와 `settings`가 실시간 동기화되어 저장.
  - 4. 테스트 알림 버튼 클릭 시 플로팅 배너, 상단 알림 배지 카운트 증가, 사운드/진동이 설정대로 작동.
  - 5. 응원(Cheers) 수신 시 전역 알림 엔진을 통해 배너와 알림 센터 큐에 정상 적재.
  - 6. 단위 테스트 `tests/global-notification-suite.test.js` 100% 통과.
  - 7. 스모크 테스트 및 헌법 5대 검증 게이트 38개 ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 모바일 Safari에서 오디오 자동 재생 차단 정책.
  - 대응: 최초 사용자 터치 이벤트(`touchstart`, `click`) 시 `unlockAudioContext`를 선제 트리거하여 세션을 활성화.
- **예상 블로커 2**: 백그라운드 상태에서 Service Worker `showNotification`과 윈도우 `new Notification` 간 중복 발송.
  - 대응: `navigator.serviceWorker.ready`가 유효할 때는 Service Worker로만 발송하고 fallback 분기 처리하여 중복 수신 원천 차단.
- **재검증 트리거**:
  - 알림 설정 변경 후 새로고침 시 설정값이 초기화되면 ➔ [원칙 ③-1] 스토리지 원장화 명세로 복귀하여 `saveProfile()` 및 직렬화 검증.
