---
notion_id: "3dc598db-9096-81ef-8ee0-cf8c1c126795"
---

# 작업계획서 (PLAN) — 폰 잠금화면 실시간 정보 연동 라이브 서비스 구축

> **문서 ID**: PLAN-TASK-ES-182-LOCKSCREEN-LIVE-SYNC  
> **티켓 연계**: #TASK-ES-182  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / INFRA (체크인 루프 강화, 실시간 PWA/ServiceWorker 잠금화면 백그라운드 연동 인프라)  
> **진행 상태**: 6단계(실서버 프로덕션 배포 완료 — PR #307 머지 bd471b4, 라이브: https://ourgoal-app.vercel.app)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**: 불필요한 정적 달력 배경화면 다운로드 기능을 전면 삭제하고, 실시간 정보가 연동되는 라이브 서비스에 완전 집중. 스마트폰 화면비(9:19.5)에 맞춘 실제 월 달력 그리드, 목표 달성률 게이지 바, 오늘의 다음 일정 최대 3개(길면 줄바꿈 금지, `...` 한 줄 처리), 스트릭, D-Day 등 5종 선택의 폭을 넓히고, 설정 전 화면 시뮬레이터에서 0ms 실시간 미리보기를 제공.
- **영향받는 파일 전수 목록**:
  1. `docs/rules/TICKETS.md`: #TASK-ES-182 승인 티켓 등록
  2. `sw.js`: CACHE_NAME 버전 범프 및 notificationclick 인터랙티브 액션(action-checkin, action-calendar) 라우팅 핸들러 추가
  3. `index.html`:
     - 정적 달력 배경화면 다운로드 탭(#lsPaneWallpaper 및 버튼) 완전 삭제
     - 잠금화면 실시간 알림 엔진 (`syncLockScreenLiveCard`, `buildLockScreenCardPayload`) 고도화 (월 달력 그리드 데이터, 오늘 일정 최대 3선 한 줄 추출)
     - 실시간 자동 동기화 트리거 배선 (`captureSave`, `saveGoal`, `updateGoal`, `toggleScheduleDone`, `initApp`)
     - 폰 잠금화면 허브 모달 (`openLockScreenHubModal`): 스마트폰 화면비 시뮬레이터, 5종 정보 선택 체크박스, 체크박스 클릭 즉시 0ms 반응하는 `updateLiveSim()` 미리보기 루프, 원터치 즉시 갱신 버튼
  4. `scripts/smoke-test.js`: 구버전 배경화면 다운로드 검증 제거, 5종 옵션 및 시뮬레이터 월 달력/일정 3선 말줄임표 컴플라이언스 테스트 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선(Wire) 식별

- **[본질] (Essence)**:
  - 잠금화면에서 사용자가 앱을 열지 않고도 살아있는 최신 월 달력·목표 달성률·다음 일정 3선·스트릭을 체감하도록 실시간 상주형 라이브 알림 카드와 개별 옵션 선택 시 0ms 즉각 반응하는 시뮬레이터 미리보기 파이프라인을 구축함.
- **[원인] (Root Causes)**:
  - 불필요한 정적 캔버스 배경화면 다운로드 기능이 남아 유저의 요구와 어긋났으며, 폰 화면비 월 달력과 일정 3선(줄바꿈 금지, ...)의 개별 선택지 및 설정 전 리액티브 미리보기가 결여되었음.
- **[중심] (Core Bottleneck)**:
  - 폰 화면비에 맞춘 실시간 월 달력 그리드 + 한 줄 일정 3선 + 목표 달성률 게이지를 개별 토글할 때 시뮬레이터와 백그라운드 Service Worker 알림에 완벽히 상호 반영되는 리액티브 엔진(syncLockScreenLiveCard) 구축.
- **[핵심] (Critical Anchor)**:
  - 정적 배경화면 다운로드 100% 완전 삭제.
  - 5종 개별 선택 체크박스 및 체크박스 변경 시 0ms 즉시 시뮬레이터 갱신.
  - 일정 3선: 길어도 줄바꿈 절대 금지(`white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;`).
  - 100% 동작하는 4위 1체 배선 및 잠금화면 알림 액션(빠른 체크인/일정 확인) 원클릭 라우팅.

- **전역 상태(`state`) 영향 분석**:
  - `state.profile.settings.lockScreenLive = { enabled: true/false, showMonthGrid: true/false, showGoalRate: true/false, showSchedules: true/false, showDday: true/false, showStreak: true/false, lastSyncAt: string }`
- **종단간 데이터 흐름 다이어그램**:
  ```
  [유저 동작 / 상태 변경]
    ├─ 체크박스 토글 (5종) ──> 0ms 즉시 updateLiveSim() (시뮬레이터 미리보기)
    ├─ 체크인 완료 (captureSave)
    ├─ 목표 변경 (saveGoal / updateGoal)
    └─ 일정 완료 토글 (toggleScheduleDone)
          │
          ▼
  [syncLockScreenLiveCard()]
          │
          ├─ state 및 로컬스토리지 최신 데이터 집계 (buildLockScreenCardPayload)
          │    - 이번 달 월 달력 그리드 (Phone Ratio Grid)
          │    - 오늘 목표 완료/전체 (목표 달성률 게이지%)
          │    - 오늘의 다음 일정 최대 3개 (한 줄 말줄임표 ...)
          │    - 스트릭 (🔥 연속일)
          │    - 핵심 D-Day
          │
          ▼
  [Service Worker registration.showNotification]
          │ (tag: 'ourgoal-lockscreen-live', silent: true, renotify: false)
          ▼
  [스마트폰 잠금화면 / AOD / 상단 알림창]
          │ (실시간 라이브 브리핑 카드 즉시 갱신)
          ▼
  [잠금화면 버튼 클릭]
          ├─ [⚡ 빠른 체크인] ➔ 앱 오픈 + 체크인 모달 자동 팝업
          └─ [📅 일정 확인]   ➔ 앱 오픈 + 캘린더 탭 자동 이동
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **파일별 변경 예산**:
  - `sw.js`: ~25줄 추가 / 2줄 수정 (Notificationclick action routing)
  - `index.html`: ~260줄 추가 / ~80줄 삭제/수정 (배경화면 다운로드 완전 삭제, 폰 화면비 월 달력 그리드, 일정 3선 말줄임표, 5종 체크박스 및 0ms 프리뷰)
  - `scripts/smoke-test.js`: ~40줄 수정
  - `docs/rules/TICKETS.md`: 1줄 추가
- **4위 1체 배선 명세**:
  - **마크업**: 잠금화면 실시간 연동 제어 패널, 폰 화면비(9:19.5) 시뮬레이터(시계, 월 달력 그리드, 목표 달성률 바, 한 줄 일정 3선), 5종 정보 선택 체크박스, 원터치 [지금 바로 잠금화면에 띄우기/갱신] 버튼.
  - **리스너**: 체크박스 5종 change 이벤트 (즉시 `updateLiveSim()`), 즉시 갱신 click 이벤트, 권한 요청 click 이벤트.
  - **로직**: `syncLockScreenLiveCard()`, `buildLockScreenCardPayload()`, ServiceWorker showNotification 발행, 데이터 수명주기 훅.
  - **피드백**: 권한 상태 배지(허용됨/차단됨/대기중), 0ms 실시간 목업 반응, 갱신 성공 토스트, 권한 거부 시 브라우저 설정 안내.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- **기존 기능 불파괴 검증**:
  - 상민님의 명시적 지시에 따라 불필요한 '달력 배경화면 다운로드' 탭은 완전 삭제(승인선 ③ 규범 준수).
  - 기존 캘린더 WebCal 및 모닝 알림 기능 100% 호환 보존.
  - 기존 318개 스모크 테스트와 20개 무결성 게이트 불파괴 확인.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. `docs/rules/TICKETS.md`에 #TASK-ES-182 티켓 등록.
2. `sw.js`에 `notificationclick` action 처리 로직(`action-checkin`, `action-calendar`) 배선 및 `CACHE_NAME` 갱신.
3. `index.html`에 `syncLockScreenLiveCard()` 및 `buildLockScreenCardPayload()` 함수 구현.
4. `captureSave`, `saveGoal`, `updateGoal`, `toggleScheduleDone`에 `syncLockScreenLiveCard()` 자동 호출 배선.
5. `openLockScreenHubModal()` 1번 탭을 "⚡ 실시간 잠금화면 라이브"로 교체하고 시뮬레이터 및 토글 UI 구축.
6. `scripts/smoke-test.js`에 TASK-ES-182 검증 로직 추가 및 실행.
7. `node scripts/verify-integrity-gate.js` 실행하여 무결성 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계

- **A. Dead-Click 0**: 잠금화면 모달 내 모든 스위치, 탭 전환, 갱신 버튼 클릭 시 에러 없음 검증.
- **B. Data Loss 0**: 사용자 기존 목표, 일정, 체크인 데이터 1바이트도 유실 없음 검증.
- **C. UX Regression 0**: 캘린더 화면 렌더링 및 모달 팝업 회귀 없음 검증.
- **D. Full State Propagation**: 체크인 완료 시 잠금화면 실시간 알림 페이로드가 즉시 갱신되는지 검증.
- **E. Automated Gate**: 318개 이상의 테스트 및 게이트 20개 전원 통과 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트

- [ ] 1단계: REQ / PLAN / TICKETS.md 등록 및 커맨드센터 저널 연동
- [ ] 2단계: Service Worker 알림 액션 라우팅 배선 (`sw.js`)
- [ ] 3단계: 실시간 잠금화면 엔진 및 전 수명주기 훅 배선 (`index.html`)
- [ ] 4단계: 잠금화면 허브 모달 1순위 실시간 탭 및 시뮬레이터 구축 (`index.html`)
- [ ] 5단계: 스모크 테스트 및 무결성 게이트 100% 통과
- [ ] 6단계: 로컬 main 브랜치 병합 및 5A 프리뷰 배포 (상민님 결심 대기)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **잠재 오류**: 브라우저 알림 권한이 비활성화된 시크릿 모드 또는 PWA 미설치 상태에서의 권한 거부.
- **우회 및 롤백 대책**:
  - 알림 권한 상태를 사전 체크(`Notification.permission`)하여 '거부됨'일 때 에러를 뱉지 않고 설정 가이드 UI 표출.
  - 문제 발생 시 `git checkout feat/2026-09-18-task-es-182-lockscreen-live-sync` 단위로 안전 격리.
