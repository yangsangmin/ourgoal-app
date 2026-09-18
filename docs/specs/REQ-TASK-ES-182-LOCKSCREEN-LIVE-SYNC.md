---
notion_id: "3dc598db-9096-81ef-8ee0-cf8c1c126795"
---

# 요구사항 정의서 (REQ) — 폰 잠금화면 실시간 정보 연동 라이브 서비스 구축

> **문서 ID**: REQ-TASK-ES-182-LOCKSCREEN-LIVE-SYNC  
> **티켓 연계**: #TASK-ES-182  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / INFRA (체크인 루프 강화, 실시간 PWA/ServiceWorker 잠금화면 백그라운드 연동 인프라)  
> **진행 상태**: 6단계(실서버 프로덕션 배포 완료 — PR #307 머지 bd471b4, 라이브: https://ourgoal-app.vercel.app)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 1회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 원문 지시사항**:
  - *"이해했는지만 답해. 잠금화면 저렇게 이미지가 아니라 실시간으로 정보가 연동되는 서비스를 해야해."* ➔ *"진행"*
  - *"이해했는지 대답해. 달력 배경화면 다운로드는 필요 없다니까. 삭제하고 실시간 라이브에서 지금 너가 만든 것도 좋은데 진짜 월 달력을 폰 화면비에 맞춰서 볼 수 있게 선택할 수 있어야지. 달력도되고, 달력과 함께 목표달성률, 오늘의 다음 일정 3개 한줄씩 (길면 줄바꿈 금지, ...으로 표시) 등등 선택의 폭을 넓혀. 모두 개별적으로 선택했을때 각각 설정하기 전에 그 화면에서 미리보기로 볼 수 있어야 하고."* ➔ *"진행"*
- **문제의 3개 층위 심층 분석**:
  - **1층 (표면적 결함/미작동)**: 필요 없는 정적 달력 배경화면 다운로드 기능이 잔존해 있었고, 실시간 라이브 뷰에서 스마트폰 화면비에 최적화된 실제 월간 달력 그리드와 오늘 예정 일정 3개(한 줄 말줄임표 ...) 등 유저 선택의 폭이 제한적이었으며, 체크 옵션을 변경했을 때 설정 전에 즉각 미리보기(Live Preview)가 완벽히 연동되지 않았음.
  - **2층 (구조/프로세스 부재)**: 모바일 폰 화면비(9:19.5/9:16)에 맞춘 실시간 월 달력 렌더러와 오늘 일정 3선(Line-clamp/Ellipsis) 컴포넌트, 개별 선택 시 0ms 즉각 반응하는 양방향 시뮬레이터 파이프라인의 부재.
  - **3층 (시스템 괴리)**: 아워골의 3대 본질 중 'E1 체크인 루프'는 유저가 앱을 켜지 않더라도 매 순간 목표와 일정을 자각하고 실천을 유도하는 것인데, 1회성 이미지 다운로드 기능에 머물러 실제 유저 리텐션과 실시간 실천 동기부여를 만들어내지 못했음.
- **대상 사용자 페르소나 및 발생 상황**:
  - 스마트폰 화면만 켜서 잠금화면에서 이번 달 월 달력 그리드와 오늘의 목표 달성률, 다음 일정 3개를 한눈에 파악하고 즉각 체크인하려는 모든 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 사용자가 앱을 열지 않고도 스마트폰 잠금화면을 보는 것만으로 이번 달 월 달력, 오늘의 목표 달성률, 다음 일정 최대 3개(말줄임표), D-Day, 스트릭이 항상 최신 데이터로 살아 움직이며(Live Sync), 설정 전 실시간 시뮬레이터에서 0ms로 즉각 미리보며 원하는 항목만 개별 조합할 수 있는 '실시간 상주형 라이브 연동 서비스'를 완벽 제공함.
- **[원인] (Root Causes)**:
  1. *불필요한 정적 배경화면 다운로드 잔존*: 유저가 원치 않는 정적 파일 다운로드 UI가 공간과 초점을 분산시킴.
  2. *폰 화면비 월 달력 그리드 및 일정 3선 컴포넌트 부재*: 스마트폰 잠금화면 비율에 최적화된 미니멀 월 달력과 긴 일정 줄바꿈 방지(...) 렌더러 부재.
  3. *설정 전 즉각 미리보기 인터랙션 결여*: 체크박스를 누를 때 시뮬레이터 목업에 즉각 0ms 반영되는 리액티브 프리뷰 루프 미완성.
- **[중심] (Core Bottleneck)**:
  - 폰 화면비에 맞춘 실시간 월 달력 그리드 + 한 줄 일정 3선 + 목표 달성률 게이지를 개별 토글할 때 시뮬레이터와 백그라운드 Service Worker 알림에 완벽히 상호 반영되는 리액티브 엔진(syncLockScreenLiveCard) 구축.
- **[핵심] (Critical Anchor)**:
  - 정적 배경화면 다운로드 기능 100% 완전 삭제.
  - 5종 개별 선택 체크박스 [월 달력 그리드, 목표 달성률, 오늘의 다음 일정 3개(...), 스트릭, D-Day].
  - 일정 3선: 길어도 줄바꿈 절대 금지(`white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;`).
  - 체크박스 클릭 즉시 0ms 시뮬레이터 실시간 반영 (미리보기).
  - 헌법 제10조 용어 헌법 준수 ('잔디' 영구 배제 ➔ '히트맵', '320종' 페르소나).

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말 것 (Don'ts)
- 불필요한 '달력 배경화면 다운로드' 탭이나 캔버스 이미지 다운로드 버튼을 남겨두지 않는다 (완전 삭제).
- 오늘의 다음 일정 텍스트가 길다고 해서 2줄 이상으로 줄바꿈하지 않는다 (줄바꿈 절대 금지, `...` 한 줄 처리 엄수).
- 체크박스를 눌렀을 때 저장 버튼을 누를 때까지 시뮬레이터가 멈춰있지 않도록 한다 (클릭 즉시 0ms 반응 필수).
- '잔디'라는 금지 단어를 절대 사용하지 않고 '히트맵'으로만 표기한다.

### 3-2. 할 것 (Do's) & 최선의 대안
1. **불필요한 달력 배경화면 다운로드 기능 완전 삭제**:
   - `#lsPaneWallpaper`, `🖼️ 달력 배경화면` 탭 버튼 및 관련 캔버스 다운로드 로직을 완전 제거하여 실시간 라이브 기능에 온전히 집중.
2. **폰 화면비 최적화 실시간 월 달력 그리드 (Phone Ratio Month Calendar)**:
   - 스마트폰 화면비(너비 대비 세로)에 최적화된 7열 미니멀 캘린더 그리드를 시뮬레이터 및 브리핑에 제공 (일요일 빨강, 토요일 파랑, 오늘 날짜 하이라이트 배지, 일정 있는 날 인디케이터 점).
3. **오늘의 다음 일정 최대 3개 한 줄씩 표시 (`...` 말줄임표)**:
   - 미완료 일정 중 시작 시각 기준 최대 3개를 추출하여 `🕒 [14:00] 일정 제목...` 형태로 한 줄 표시. `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;` 스타일 엄수.
4. **개별 선택 체크박스 5종 구축**:
   - `lsOptMonthGrid`: 📅 이번 달 월 달력 보기
   - `lsOptGoalRate`: 🎯 목표 달성률 게이지 보기
   - `lsOptSchedules`: 🕒 오늘의 다음 일정 최대 3개 (줄바꿈 없이 한 줄씩)
   - `lsOptStreak`: 🔥 연속 실천 스트릭 표시
   - `lsOptDday`: ⏳ 핵심 목표 D-Day 표시
5. **설정 전 0ms 실시간 미리보기 (Live Simulator Reactive Preview)**:
   - 5개 체크박스 클릭 시 즉시 `updateLiveSim()`을 호출하여 시뮬레이터 목업이 0ms로 실시간 전환되도록 보장.
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
