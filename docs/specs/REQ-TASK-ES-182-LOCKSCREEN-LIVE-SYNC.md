---
notion_id: "3dc598db-9096-81ef-8ee0-cf8c1c126795"
---

# 요구사항 정의서 (REQ) — 폰 잠금화면 실시간 정보 연동 라이브 서비스 구축

> **문서 ID**: REQ-TASK-ES-182-LOCKSCREEN-LIVE-SYNC  
> **티켓 연계**: #TASK-ES-182  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / INFRA (체크인 루프 강화, 실시간 PWA/ServiceWorker 잠금화면 백그라운드 연동 인프라)  
> **진행 상태**: 1단계(기획·설계 상태)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 1회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 원문 지시사항**:
  - *"이해했는지만 답해. 잠금화면 저렇게 이미지가 아니라 실시간으로 정보가 연동되는 서비스를 해야해."* ➔ *"진행"*
- **문제의 3개 층위 심층 분석**:
  - **1층 (표면적 결함/미작동)**: 기존 잠금화면 모달은 Canvas로 정적 이미지를 생성해 다운로드받아 수동 배경화면으로 등록하는 방식에 치중되어 있음. 이로 인해 목표를 실천하거나 일정이 변경되어도 잠금화면의 내용이 자동으로 바뀌지 않아 유저가 실시간성을 전혀 체감할 수 없음.
  - **2층 (구조/프로세스 부재)**: 모바일 및 브라우저 런타임에서 스마트폰을 켜는 순간(잠금화면/AOD/상단바) 항상 최신 상태를 유지할 수 있는 백그라운드 실시간 알림 카드(Live Lock Screen Card) 및 원클릭 인터랙션 파이프라인이 미배선되어 있었음.
  - **3층 (시스템 괴리)**: 아워골의 3대 본질 중 'E1 체크인 루프'는 유저가 앱을 켜지 않더라도 매 순간 목표와 일정을 자각하고 실천을 유도하는 것인데, 1회성 이미지 다운로드 기능에 머물러 실제 유저 리텐션과 실시간 실천 동기부여를 만들어내지 못했음.
- **대상 사용자 페르소나 및 발생 상황**:
  - 이동 중이거나 바쁜 일상 속에서 스마트폰 화면만 켜서(잠금화면) 오늘 해야 할 목표와 다음 일정을 1초 만에 확인하고 바로 체크인하려는 모든 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 사용자가 앱을 열지 않고도 스마트폰 잠금화면을 보는 것만으로 오늘의 목표 달성률, 다음 일정, D-Day, 스트릭이 항상 최신 데이터로 살아 움직이며(Live Sync), 잠금화면 알림에서 원클릭으로 빠른 체크인과 캘린더 확인까지 완결되는 '실시간 상주형 라이브 연동 서비스'를 제공함.
- **[원인] (Root Causes)**:
  1. *정적 캔버스 이미지 다운로드에 치중*: 배경화면을 수동으로 교체해야 하므로 실시간 데이터 변경 시 낡은 과거 정보가 방치됨.
  2. *잠금화면 상주형 알림 카드 엔진의 부재*: Web Notification API의 tag 'ourgoal-lockscreen-live', silent true, renotify false를 활용한 실시간 카드 갱신 아키텍처가 구축되지 않았음.
  3. *데이터 상태 변경과의 실시간 전파 단절*: 체크인 완료, 목표 수정, 일정 토글 시 잠금화면 알림을 무음으로 자동 최신화하는 트리거 배선이 누락됨.
- **[중심] (Core Bottleneck)**:
  - PWA Service Worker 및 브라우저 환경에서 유저에게 불필요한 알림 소리나 진동 피로감 없이(Silent Background Sync), 잠금화면의 카드 내용만 0.1초 만에 최신 데이터로 교체하는 '실시간 라이브 알림 동기화 엔진(syncLockScreenLiveCard)'과 이를 직관적으로 제어하는 허브 모달 UI의 결합.
- **[핵심] (Critical Anchor)**:
  - 100% 동작하는 4위 1체 배선: [실시간 켜기/끄기 스위치 + 잠금화면 시뮬레이터 실물 렌더링 + ServiceWorker showNotification 실제 발행 + 데이터 변경 시 자동 무음 갱신].
  - 헌법 제10조 용어 헌법 준수 ('잔디' 영구 배제 ➔ '히트맵', '320종' 페르소나).

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말 것 (Don'ts)
- 모바일 OS 네이티브 앱(Kotlin/Swift) 전용 복잡한 라이브러리를 웹에 억지로 흉내 내며 불안정한 외부 스크립트를 추가하지 않는다.
- 데이터가 갱신될 때마다 폰을 시끄럽게 울리거나 진동시켜 유저에게 스팸 피로감을 주지 않는다 (silent true 및 renotify false 엄수).
- 기존의 배경화면 이미지 생성 기능을 파괴적 삭제하지 않고 보조 기능(탭 2)으로 안전 격리 보존한다.
- '잔디'라는 금지 단어를 절대 사용하지 않고 '히트맵'으로만 표기한다.

### 3-2. 할 것 (Do's) & 최선의 대안
1. **잠금화면 허브 모달 1순위 메인 탭 전면 개편**:
   - 기존의 '월간 달력 배경화면' 탭을 뒤로 물리고, **"⚡ 실시간 잠금화면 라이브 (실시간 자동 갱신)"**을 1순위 메인 탭으로 전면 승격.
2. **실시간 잠금화면 시뮬레이터 (Live Phone Simulator)**:
   - 스마트폰 잠금화면 그래픽(상단 시계, 배터리, 날짜)과 함께, 내 오늘의 실제 목표 달성률, 다음 일정, 스트릭이 반영된 실시간 알림 카드 목업을 실시간 렌더링.
3. **원터치 실시간 라이브 연동 엔진 (syncLockScreenLiveCard)**:
   - Notification.requestPermission() ➔ ServiceWorker registration.showNotification을 통해 실제 스마트폰 잠금화면에 상주형 브리핑 카드를 생성.
   - 알림 구조:
     - Title: [아워골 라이브] 오늘 목표 N/M 완료 (P%) 🔥 S일 연속
     - Body: 🕒 다음: [시각] [일정명] · 🎯 [진행중 목표명] · ⏳ [D-Day]
     - Actions: [⚡ 빠른 체크인] (action-checkin), [📅 일정 확인] (action-calendar)
4. **전 수명주기 실시간 자동 갱신 배선**:
   - 체크인 저장(captureSave), 목표 추가/수정(saveGoal, updateGoal), 일정 완료 토글(toggleScheduleDone) 시 syncLockScreenLiveCard()가 자동 호출되어 잠금화면 내용이 무음으로 즉시 갱신됨.
5. **PWA Service Worker 인터랙티브 액션 라우팅 (sw.js)**:
   - 잠금화면 알림의 action-checkin 클릭 시 앱을 열고 즉시 체크인 모달 호출.
   - action-calendar 클릭 시 앱을 열고 캘린더 탭으로 바로 이동.

### 3-3. 기획 단계 스토리지 원장화 3대 명세 (헌법 제2조 제4항)
1. **원격 DB 스키마 명세**:
   - 설정 정보(lockScreenLive: { enabled, showGoals, showSchedules, showDday, showStreak, lastSyncAt })는 Supabase users.settings JSONB 컬럼 및 로컬 ourgoal_lockscreen_live_v1 스토리지에 무손실 저장.
2. **스마트 스토리지 분기 설계**:
   - 클라이언트 localStorage의 ourgoal_lockscreen_live_v1을 primary cache로 활용하며, state.profile.settings.lockScreenLive와 양방향 동기화.
3. **4대 뷰 전파 배선도**:
   - 잠금화면 실시간 설정 변경 및 알림 발행 시 연계 뷰: renderCalendarScreen, renderHome, renderRecordsScreen, renderStatsScreen 동시 전파 보장.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **비판적 재검토**:
  - iOS Safari(PWA)에서의 알림 제약: iOS 16.4 이상부터 PWA 홈 화면 추가 시 Web Push 지원. 브라우저 단독 탭에서는 권한 거부가 발생할 수 있으므로, '홈 화면에 아워골 추가 시 잠금화면 실시간 연동 100% 지원' 가이드와 함께 WebCal 캘린더 구독 위젯 폴백을 병행 제공.
  - 알림 권한 차단(Denied) 사용자: 권한이 거부되었을 때 먹통이 되지 않고 브라우저 설정 변경 가이드 및 친절한 토스트 안내 제공.
  - 목표/일정이 0개인 콜드스타트 상태: 빈 알림 카드가 아니라 "오늘의 첫 목표를 설정해보세요! 🎯"라는 따뜻한 기본 안내 텍스트로 자연스럽게 폴백.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. **1단계 (문서 및 브랜치)**:
   - REQ/PLAN 작성, TICKETS.md 등록, 커맨드센터 저널 적재.
2. **2단계 (Service Worker & 스토리지 고도화)**:
   - sw.js의 CACHE_NAME 최신화(ourgoal-shell-v20260918-es182-lockscreen-live-sync), notification action 클릭 라우팅 핸들러 배선.
3. **3단계 (실시간 잠금화면 엔진 배선)**:
   - index.html 내 syncLockScreenLiveCard(), buildLockScreenCardPayload() 함수 구현.
   - captureSave, saveGoal, updateGoal, toggleScheduleDone, initApp에 자동 동기화 훅 배선.
4. **4단계 (잠금화면 허브 모달 UI 전면 개편)**:
   - 1번 탭을 "⚡ 실시간 잠금화면 라이브"로 배치하고 실물 크기 스마트폰 잠금화면 시뮬레이터 및 실시간 갱신 토글 스위치 구축.
5. **5단계 (자동화 테스트 및 무결성 검증)**:
   - scripts/smoke-test.js에 TASK-ES-182 전용 컴플라이언스 테스트 추가.
   - npm test 및 node scripts/verify-integrity-gate.js (20/20 PASS).
6. **6단계 (로컬 4단계 메인 병합 및 프리뷰 배포)**:
   - 브랜치를 로컬 main에 병합하고 5A 프리뷰 배포 실행 후 상민님께 보고.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점(SPOF) 점검**:
  - 알림 API가 지원되지 않는 구형 브라우저(!'Notification' in window): 런타임 크래시 없이 즉시 WebCal/위젯 탭으로 안내하고 "이 기기에서는 실시간 캘린더 위젯 구독 방식을 권장해요" 안내.
  - 서비스워커 등록 지연/실패: navigator.serviceWorker.ready 타임아웃(3초) 폴백을 두어 일반 브라우저 new Notification()으로 안전 다운그레이드 전송.
- **재검증에 따른 절차 보완사항**:
  - 알림 카드 발행 시 앱이 포그라운드에 있을 때도 잠금화면 카드를 갱신할 수 있도록 registration.showNotification 단일 파이프라인으로 통일.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

- **정량적 통과 기준**:
  1. npm test 318개 이상의 테스트 100% ALL PASS (0 failure).
  2. node scripts/verify-integrity-gate.js 20개 게이트 100% 통과.
  3. 콘솔 런타임 에러 0건 유지.
  4. '잔디' 금지어 0건, 아바타 페르소나 '320종' 단일 표기 준수.
  5. 잠금화면 모달 내 실시간 켜기/끄기, 정보 선택 스위치, 시뮬레이터 렌더링, 액션 버튼의 Zero-Dead-Click 100% 달성.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커**:
  - Service Worker 캐시 충돌로 구버전 sw.js가 알림 클릭 액션을 삼키는 현상.
  - 대응 및 트리거: sw.js의 CACHE_NAME을 신규 버전으로 명시적 변경하고, self.skipWaiting() 및 self.clients.claim()을 통해 즉시 활성화.
- **재검증 트리거**:
  - 만약 잠금화면 알림 클릭 시 앱 화면 이동이 불발될 경우 ➔ 원칙 ③-2 및 ⑤-2의 sw.js notificationclick 라우팅 로직으로 되돌아가 재검증.
