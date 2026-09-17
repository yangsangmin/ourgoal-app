# 엔지니어링 작업계획서 (PLAN) — 1:1 DM 및 전역 알림(Web Push·ServiceWorker·스마트 폴링·상단바 알림센터) 무결성 전면 고도화 및 결함 개선

> **문서 ID**: PLAN-TASK-ES-168-NOTIF-DM-IMPROVE  
> **요구사항 연계**: [REQ-TASK-ES-168-NOTIF-DM-IMPROVE](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-168-NOTIF-DM-IMPROVE.md)  
> **티켓 연계**: #TASK-ES-168  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity (세션 ID: e7b6bd7c)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - DM 수신 알림 및 전역 알림 파이프라인의 5대 결함(백그라운드 Web Push 누락, 모바일 `new Notification` 크래시, 30초 스마트 폴링 부재, 상단바 알림 센터 및 배지 부재, 활성 대화방 실시간 DOM 미반영)을 완전 해결하여, 사용자가 앱을 켜두었든 닫았든 100% 신뢰할 수 있는 상호작용 생존성을 확립함.
- **영향 받는 파일 목록 전수**:
  - `api/push-dispatch.js`: `targetUserId` 타깃 푸시 발송 분기 구현.
  - `js/notify-engine.js`: ServiceWorker `showNotification` 최우선 호출 및 AudioContext unlock 보강.
  - `js/team-invite-comm.js`: DM 전송 시 Web Push 발송 연동, 30초 스마트 폴링 루프, 활성 대화방 실시간 DOM 렌더링.
  - `index.html`: 상단바 알림 버튼(`topNotifBtn`) 및 배지(`topNotifBadge`) 추가, 알림 센터 모달(`openNotificationCenterModal`), 상단바 배지 동기화 함수(`updateTopNotifBadge`).
  - `ui.css`: 상단바 알림 버튼 및 알림 센터 모달 전용 스타일.
  - `sw.js`: `CACHE_NAME` 최신화 (헌법 제14조 제3항 준수).
  - `scripts/smoke-test.js`: #TASK-ES-168 컴플라이언스 검증 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 1:1 메시지 및 상호작용 이벤트가 발생했을 때 클라이언트 상태, 백엔드 서버 푸시, 모바일 Service Worker, 그리고 사용자 인터페이스(상단바 알림 센터)까지 오차 없이 하나로 이어지는 **4위 1체 실시간 알림 파이프라인의 완성**.
- **[원인] (Technical Causes)**:
  - DM 발송 시 클라이언트 DB insert만 실행되고 Web Push 발송 호출이 누락됨.
  - 모바일 환경에서 지원되지 않는 `new Notification` 생성자를 직접 호출하여 무음 에러 발생.
  - 웹소켓 단절 시 복구할 수 있는 주기적 폴링 메커니즘과 알림 히스토리 열람 UI의 부재.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.notifications`: 알림 옵션(피드백 모드, 백그라운드 수신 등) 연계.
  - `state.profile.settings.unreadNotifications`: 미확인 알림 배열(최대 50건) 및 상단 배지 바인딩.
  - `OurgoalNotifyEngine.dispatchGlobalNotification`: 전역 디스패처를 통한 일원화.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - Web Push 발송 실패 시에도 DM 전송 및 로컬 수신에 영향이 없도록 try/catch 분리.
  - `ServiceWorkerRegistration.showNotification()` 호출 시 타임아웃 및 데스크톱 Notification 폴백.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  ```
  [User A: DM 입력 후 전송 클릭]
         │
         ├─► [1. Optimistic UI 즉각 렌더링]
         ├─► [2. Supabase team_ping_replies DB 영속 저장]
         └─► [3. /api/push-dispatch 비동기 호출]
                   │
                   ▼
  [User B 기기 상태에 따른 3중 수신 분기]
         ├─ (앱 켜둠 / 포그라운드):
         │     └─► Realtime 웹소켓 수신 ─► 플로팅 배너 + 소리/진동 + 상단바 🔔 배지 + 활성방 DOM 갱신
         ├─ (앱 백그라운드):
         │     └─► ServiceWorker.showNotification() 시스템 알림 표출 + 진동
         └─ (앱 종료 / 오프라인):
               └─► VAPID Web Push 수신 (sw.js push 이벤트) ─► OS 알림 센터 표출
                   │
                   ▼
  [User B: 알림 또는 상단바 🔔 클릭]
         └─► [알림 센터 모달 오픈 ─► 클릭 시 해당 DM 방으로 즉시 딥링크 이동 ─► 읽음 처리]
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `api/push-dispatch.js` | targetUserId 즉시 푸시 발송 분기 | +35줄 | 0줄 | +35줄 | 기능 추가 |
| `js/notify-engine.js` | 모바일 SW 알림 및 Audio unlock | +25줄 | -5줄 | +20줄 | 결함 수정 |
| `js/team-invite-comm.js` | DM 푸시 호출, 스마트 폴링, DOM 동기화 | +55줄 | -5줄 | +50줄 | 핵심 배선 |
| `index.html` | 상단바 🔔 버튼, 알림 센터 모달, 배지 동기화 | +75줄 | -3줄 | +72줄 | UI/UX 배선 |
| `ui.css` | 알림 센터 모달 및 상단 배지 스타일 | +30줄 | 0줄 | +30줄 | CSS 토큰 준수 |
| `sw.js` | CACHE_NAME 갱신 | +1줄 | -1줄 | 0줄 | 캐시 무효화 |
| `scripts/smoke-test.js` | #TASK-ES-168 컴플라이언스 테스트 | +40줄 | 0줄 | +40줄 | 무결성 검증 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#topNotifBtn`: 상단바 우측에 위치한 알림 벨 아이콘 버튼 (접근성 라벨 `aria-label="알림 센터"` 완비).
   - `#topNotifBadge`: 미확인 알림 건수 뱃지 (미확인 시 레드 뱃지 숫자 표출).
   - `#notificationCenterModal`: 최근 50건 알림 열람 모달 및 `#notifCenterMarkAllRead` 전체 읽음 버튼.
2. **이벤트 리스너 (Listener)**:
   - `#topNotifBtn` 클릭 시 `openNotificationCenterModal()` 호출.
   - `#notifCenterMarkAllRead` 클릭 시 모든 알림 읽음 처리 및 배지 즉각 소등.
   - 알림 항목 클릭 시 해당 DM 대화방으로 즉각 뷰 전환.
3. **비즈니스 로직 (Logic)**:
   - `updateTopNotifBadge()`: `state.profile.settings.unreadNotifications` 중 `read === false` 카운트 집계 후 배지 갱신.
   - `api/push-dispatch.js`: `targetUserId`로 구독 레코드를 조회하여 VAPID Web Push 전송.
4. **피드백 & 예외처리 (Feedback)**:
   - 알림 전송 및 읽음 처리 시 토스트 안내, Web Push 실패 시에도 화면 무중단 보호.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, 상단바 레이아웃(`topHomeGuideBtn`, `topHomeLayoutBtn`, `topUserChip`)을 깨뜨리지 않고 완벽히 계승함.
- [x] 외과수술적 diff를 적용하여 기존 코드 축약 없이 100% 완전한 실행 코드로 작성함.
- [x] 기존 사용자의 아바타(320종 포함), 목표 목록, 기록, 화면 세팅값이 100% 무손실 보존됨.
- [x] 모바일 PWA 환경에서 `new Notification` 오류가 더 이상 발생하지 않도록 `navigator.serviceWorker.ready`를 안전망으로 둠.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`api/push-dispatch.js`)**:
   - `targetUserId` 처리 분기 구현 (VAPID 설정, `push_subscriptions` 조회, `webpush.sendNotification` 루프, 만료 구독 삭제).
2. **Step 2 (`js/notify-engine.js`)**:
   - `dispatchGlobalNotification` 내 모바일 `ServiceWorkerRegistration.showNotification()` 배선.
   - 첫 인터랙션 시 AudioContext `resume()` 이벤트 리스너 추가.
3. **Step 3 (`js/team-invite-comm.js`)**:
   - `send()` 함수 내 비동기 `/api/push-dispatch` 호출 추가.
   - 30초 주기 스마트 폴링 루프(`startSmartDmPolling`) 탑재.
   - `_incomingDmChannel` 및 `subscribeRealtimeDm` 활성 대화방 실시간 DOM 동기화 보강.
4. **Step 4 (`index.html` & `ui.css`)**:
   - 상단바 `#topNotifBtn` 및 `#topNotifBadge` 마크업 배치.
   - `openNotificationCenterModal` 및 `updateTopNotifBadge` 함수 구현.
   - `updateTopBar` 및 알림 수신 시 배지 갱신 연동.
5. **Step 5 (`sw.js`)**:
   - `CACHE_NAME`을 `ourgoal-cache-20260917-es168`로 갱신.
6. **Step 6 (`scripts/smoke-test.js` & 검증)**:
   - #TASK-ES-168 무결성 테스트 추가 및 `npm test`, `verify-integrity-gate.js` 전수 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**:
  - 상단바 알림 벨 버튼 `#topNotifBtn` 클릭 시 알림 센터 모달 정상 호출 및 콘솔 에러 0건 확인.
  - 알림 센터 내 '모두 읽음' 및 각 알림 아이템 클릭 시 런타임 오류 없음 확인.
- **시나리오 B (Zero Data Loss)**:
  - 10종 가상 페르소나 데이터 검증 통과 및 `settings.unreadNotifications` 정상 보존 확인.
- **시나리오 C (Zero UX Regression)**:
  - 게스트 모드 및 소셜 로그인 유지, 기존 1:1 DM 및 소통 탭의 기존 기능 100% 보존.
- **시나리오 D (Full State Propagation)**:
  - 새 메시지 수신 시 상단바 🔔 배지, 소통 탭 배지, DM 서브탭 배지가 실시간 동시 점등되는지 확인.
- **시나리오 E (자동화 게이트 통과)**:
  - `scripts/smoke-test.js` 308개 이상 전수 통과 및 `scripts/verify-integrity-gate.js` PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1: `api/push-dispatch.js` 타깃 푸시 엔드포인트 구현
- [ ] Step 2: `js/notify-engine.js` 모바일 PWA ServiceWorker 알림 및 Audio unlock 구현
- [ ] Step 3: `js/team-invite-comm.js` DM 푸시 발송, 30초 스마트 폴링, 활성방 DOM 동기화 구현
- [ ] Step 4: `index.html` 상단바 🔔 버튼, 알림 센터 모달, 실시간 배지 연동 구현
- [ ] Step 5: `ui.css` 알림 센터 및 배지 스타일링
- [ ] Step 6: `sw.js` 캐시 네임 갱신 (`CACHE_NAME`)
- [ ] Step 7: `scripts/smoke-test.js`에 #TASK-ES-168 검증 추가
- [ ] Step 8: `npm test` 및 `node scripts/verify-integrity-gate.js` 무결성 게이트 100% 통과
- [ ] Step 9: [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 완료 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - 로컬 환경에서 VAPID 환경변수 미설정 시 `/api/push-dispatch` 호출이 실패할 수 있음.
  - **사전 방어 및 우회 로직**:
    - `api/push-dispatch.js`에서 환경변수 부재 시 즉시 에러를 뿜지 않고 개발 환경 경고 후 200 반환.
    - 클라이언트 `team-invite-comm.js`에서 push fetch 실패 시에도 `console.warn`만 남기고 DM 전송 흐름은 정상 완료.
- **롤백 계획 (Rollback Strategy)**:
  - 문제 발생 시 `git reset --hard HEAD~1`로 즉시 복구 가능하도록 커밋을 세분화하고, 기존 DB 스키마는 전혀 수정하지 않아 데이터 롤백 위험 0%.
- **재검증 트리거**:
  - 알림 클릭 시 대화방으로 이동하지 않거나 상단 배지 카운트가 맞지 않을 경우 원칙 ⑤의 Step 4(상단바 배지 동기화 함수)로 즉시 복귀하여 상태값 대조 로직을 재검증함.
