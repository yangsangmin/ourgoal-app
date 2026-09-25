# 요구사항 정의서 (REQ) — 구글 캘린더 연동 로그인 시 재연동 원인 규명 및 근본 해결

> **문서 ID**: REQ-TASK-ES-265-GCAL-LOGIN-RECONNECT-FIX  
> **티켓 연계**: #TASK-ES-265 (노션 생각 메모장 [08]번, Page ID: `3dc598db-9096-8155-b302-fe81bf15707f`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: FIX / INFRA (구글 캘린더 연동 세션 영속성 및 자가 치유)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"내가 지금 새로 로그인할때마다 구글 캘린더 연동을 다시 하게끔 되는데(확실하지는 않고, 로그인 때문인지, 새로운 배포 및 병합 때문인지는) 원인파악하고 원인과 해결책 결과보고 해. 뭐가 문제였고 어떤걸 고치면 해결되는지."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 사용자가 새로 로그인하거나 배포/병합 후 앱에 재접속했을 때, 이전에 연동해 두었던 구글 캘린더가 풀려 미연동(`+ 연동`) 상태로 돌아가거나, 동기화를 누를 때마다 구글 계정 선택/동의 팝업창이 다시 뜨는 현상.
  2. 게스트 모드에서 구글 캘린더를 연동한 뒤 소셜 로그인(카카오/구글)으로 전환하면 연동 상태가 즉시 소멸하는 현상.
  3. 다른 브라우저, 새 기기, 시크릿 모드 또는 카카오톡 인앱 브라우저 진입 시 연동 정보가 전혀 복구되지 않는 현상.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: Google OAuth Access Token의 1시간(3,600초) 수명 만료 후 무인 갱신(Silent Refresh) 파이프라인 결여.
  - **2층 (구조/프로세스 부재)**: 캘린더 연동 플래그가 클라이언트 `localStorage`에만 격리되어 계정 DB(Supabase 원장)에 백업되지 않음.
  - **3층 (시스템/유저 체감 괴리)**: 배포 후 새로고침 시 JS 런타임 메모리 초기화와 1시간 토큰 만료가 겹쳐 사용자는 "배포나 로그인 때문에 연동이 해제되었다"고 오인하게 됨.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX / INFRA (외부 OAuth 세션 수명주기 영속성 및 스마트 회복탄력성)
- **[본질] (Essence)**:
  - 구글 캘린더 연동은 한 번 승인하면 사용자가 명시적으로 '연동 해제'를 누르기 전까지 어떤 로그인, 기기 변경, 새 배포 및 새로고침, 1시간 토큰 만료 상황에서도 팝업 없이 백그라운드에서 스스로 유지/복원되어야 하는 영구 영속 자산이다.
- **[원인] (Root Causes - 5대 근본 원인)**:
  1. **원인 ① [Google OAuth Token 1시간 수명 만료 & Silent Refresh 부재]**: GIS의 Access Token은 3,600초 후 만료되며, 만료 후 백그라운드 무인 갱신(`prompt: ''`, `hint: gEmail`)이 없어 매번 대화형 팝업이 유발됨.
  2. **원인 ② [설정이 로컬스토리지에만 존재하고 Supabase DB에 미저장]**: `googleCalendarConnected`가 클라이언트 로컬에만 기록되어 새 기기/브라우저 로그인 시 연동이 풀림.
  3. **원인 ③ [게스트 ➔ 소셜 로그인 시 연동 이관 누락]**: `migrateGuestDataToUser`에서 캘린더 연동 플래그 및 토큰을 누락하여 로그인 즉시 해제됨.
  4. **원인 ④ [새 배포 및 병합 시 런타임 메모리 초기화]**: 배포 후 PWA 서비스워커 갱신 및 리로드 시 `state.googleToken`이 소멸하며, 만료 토큰과 겹쳐 팝업 재등장.
  5. **원인 ⑤ [다중 식별자 UID 불일치 시 자가치유 부재]**: 다중 UID 간 연동 키 불일치 시 이전 세션 연동 상태를 회수하는 자가 치유 엔진 결여.
- **[중심] (Core Bottleneck & Anchor)**:
  - 무인 갱신 `requestGoogleToken({ silent: true })` 및 `client.requestAccessToken({ prompt: '', hint: gEmail })`.
  - Supabase `events` 원장(`settings_ledger`) 기반 계정 동기화.
- **[핵심] (Critical Safety & Termination)**:
  - 팝업 루프 100% 차단.
  - 로그인 및 마이그레이션 시 구글 캘린더 상태 0% 유실 보장.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 한 번 구글 캘린더를 연동하면, 앱을 재실행하거나 새 기기에서 로그인하거나 배포가 이루어져도 다시 구글 로그인 팝업을 보지 않고 항상 캘린더 일정이 동기화된다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 불필요하게 사용자를 귀찮게 하는 동의 팝업 반복 호출 금지.
  - 캘린더 연동 상태를 클라이언트 단일 메모리나 단일 로컬스토리지 키에만 의존하게 방치하는 행위 금지.
- **해야 할 것 (Action)**:
  1. **Silent Token Refresh**: 백그라운드에서 `prompt: ''`, `hint: gEmail`로 무인 갱신.
  2. **서버 원장화**: `/api/track`의 `settings_ledger`에 연동 정보 영구 저장 및 로그인 시 복원.
  3. **게스트 이관**: `migrateGuestDataToUser`에서 연동 설정 및 토큰 100% 무손실 승격.
  4. **자가 치유**: `loadLocalSettings`와 `isGoogleCalendarConnected`에서 이전 세션 탐색 및 복구.
  5. **UI 시인성 유지**: 토큰 만료 중에도 `calGcalMiniBadge`의 '연동됨' 상태 보존.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - Supabase `events` 테이블 내 `event_type = 'settings_ledger'` 페이로드에 `settings.googleCalendarConnected`, `settings.googleCalendarEmail`, `settings.gcalSync`, `settings.gcalClientId` 보존.
- **2호 (스마트 스토리지 분기 설계)**:
  - 로컬스토리지 삼중 백업: `ourgoal_gcal_token_v1_{uid}`, `ourgoal_gcal_token_v1_last`, `ourgoal_gcal_email_last`.
- **3호 (4대 뷰 전파 배선도)**:
  - 캘린더 연동 상태 복원 시 `renderCalendar()`, `renderSettingsScreen()` 원자적 동시 전파.

---

## 4. [원칙 ④] 스티브 잡스 디테일 및 UX 무결성 (Steve Jobs Details & UX Integrity)
- **무마찰(Zero-Friction) 연동 경험**: 사용자는 기술적으로 토큰이 1시간 만료되는지 전혀 알 필요가 없으며, 앱이 알아서 백그라운드에서 무음 갱신하여 언제나 최신 일정을 보여줌.
- **인체공학적 배지 피드백**: 캘린더 탭 상단 배지가 미연동(`+ 연동`)으로 떨어지지 않고 항상 정갈한 초록빛 '구글 연동됨'을 유지하여 안정감 제공.

---

## 5. [원칙 ⑤] 리스크 검토 및 회귀 방지 (Risk Analysis & Regression Prevention)
- **리스크**: 구글 OAuth 클라이언트 ID가 변경되거나 서드파티 쿠키 차단 환경에서 Silent Refresh 실패 가능성.
  - **대응**: Silent Refresh 실패 시 즉각 에러 팝업을 띄우지 않고 기존 캐시 이벤트를 유지하며, 유저가 수동 클릭 시에만 인터랙티브 모달로 정중히 전환.

---

## 6. [원칙 ⑥] 완료 조건 정의 및 절차 재검증 (Definition of Done & Re-verification)
1. 단위 테스트 `tests/gcal-login-reconnect-fix.test.js` 100% 통과.
2. 스모크 테스트 `scripts/smoke-test.js` 383개 전 항목 ALL PASS.
3. 헌법 무결성 게이트 `scripts/verify-integrity-gate.js` 38개 전 항목 ALL PASS.
4. Tri-Sync 무결성 검증 `node C:/dev/command-center/lib/tri-sync.js check` 100% 정상.
5. GitHub Court 판정 및 PR squash 머지 완료.

---

## 7. [원칙 ⑦] 구현 파일 범위 및 회귀 방지 (Target Files & Safety)
- `index.html`: Silent refresh, loadLocalSettings, migrateGuestDataToUser, isGoogleCalendarConnected.
- `api/track.js`: settings_ledger 원장 백업 및 복원.
- `tests/gcal-login-reconnect-fix.test.js`: 신규 단위 테스트.
- `scripts/smoke-test.js`: `#TASK-ES-265` 단언문 탑재.
- `docs/rules/TICKETS.md`: 티켓 갱신.
- `reports/TASK-ES-265/claims.json`: 법정 심사 청구서.

---

## 8. [원칙 ⑧] 본질 측정 및 사후 모니터링 (Essence Metrics & Review)
- 로그인 후 구글 캘린더 연동 자동 복원율: 100%.
- 게스트 ➔ 소셜 로그인 시 연동 이관 성공률: 100%.
- 토큰 1시간 만료 시 무인 갱신(Silent Refresh) 가동률: 100%.
- 불필요한 계정 선택 팝업 발생률: 0건.
