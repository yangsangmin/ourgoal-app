# 엔지니어링 작업계획서 (PLAN) — 백그라운드·앱종료·미확인 전역 알림(DM 포함) 전수 구현 및 세부 알림 설정창 구축

> **문서 ID**: PLAN-TASK-ES-254-GLOBAL-NOTIFICATION-SUITE  
> **요구사항 연계**: [REQ-TASK-ES-254-GLOBAL-NOTIFICATION-SUITE](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-254-GLOBAL-NOTIFICATION-SUITE.md)  
> **티켓 연계**: #TASK-ES-254  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 앱 사용 중(타 화면/모달 열림) 및 백그라운드/앱 미사용 시 DM, 응원(Cheers), 팀 활동, 일정 알림을 단일 전역 알림 엔진(`OurgoalNotifyEngine`)으로 통합.
  - 설정창 알림 제어 센터에서 피드백 방식(소리/진동/무음), 프라이버시 수준(상세 vs 간략형), 백그라운드 Web Notification 수신, 유형별 5종 스위치(DM, 팀, 응원, 마감, 스트릭)를 1:1 완벽 양방향 동기화.
- **영향 받는 파일 목록 전수**:
  - `js/notify-engine.js`: 알림 엔진 설정 키 완비, 프라이버시 마스킹 강화, 유형별 필터링 완결.
  - `index.html`: 설정 탭 알림 제어 센터 UI 동기화, 응원/댓글 수신 시 `dispatchGlobalNotification` 일원화, 테스트 알림 버튼 실시간 설정 반영.
  - `tests/global-notification-suite.test.js`: 신규 단위 테스트.
  - `scripts/smoke-test.js`: 스모크 테스트 단언문 추가.
  - `docs/rules/TICKETS.md`: 티켓 상태 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 타 화면/백그라운드 상태에서도 동반자 DM과 응원을 놓치지 않으며, 사용자가 원하는 피드백(소리/진동/간략형)으로 안전하게 제어하는 무마찰 소통 인프라.
- **[원인] (Technical Causes)**:
  - 설정창의 스위치 바인딩이 `settings.notifCheers` 같은 분산 플래그에 쓰면서 `OurgoalNotifyEngine`의 `settings.notifications`와 분리되어 있던 결함.
  - 응원 수신부에서 `OurgoalNotifyEngine` 대신 `new Notification`만 호출하여 포그라운드 배너 및 사운드/진동이 동작하지 않던 결함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.notifications`: `{ feedbackMode, privacyLevel, bgEnabled, dmMessages, teamActivities, cheerActivities, goalReminders, streakReminders, unreadNotifications }`
  - `OurgoalNotifyEngine.dispatchGlobalNotification(opts)`: 단일 알림 디스패치 파이프라인.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `saveLocalSettings` 및 `saveProfile()`로 로컬/원격 원장 영속화.
  - `updateTopNotifBadge()` 및 `openNotificationCenterModal()`로 상단 알림 배지 및 센터 동기화.
  - 4대 뷰 무조건 원자적 동시 전파 (`renderSettingsScreen`, `renderHome`, `renderCommScreen`, `updateTopNotifBadge`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[알림 이벤트 발생 (DM/응원/팀/일정)] -> [OurgoalNotifyEngine.dispatchGlobalNotification] -> [사용자 설정 검증 (유형/방해금지/프라이버시)] -> [피드백 재생 (소리/진동)] -> [포그라운드 플로팅 배너 or 백그라운드 Notification] -> [unreadNotifications 큐 적재] -> [상단바 배지 실시간 갱신]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/notify-engine.js` | 알림 유형별 필터 및 프라이버시 마스킹 강화 | +45줄 | -15줄 | +30줄 | 엔진 고도화 |
| `index.html` | 설정창 스위치 5종 양방향 동기화, 응원 알림 일원화, 테스트 버튼 연동 | +80줄 | -30줄 | +50줄 | 외과수술적 diff |
| `tests/global-notification-suite.test.js` | 신규 단위 테스트 | +140줄 | 0줄 | +140줄 | 단위 테스트 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 | +30줄 | 0줄 | +30줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 티켓 등재 | +3줄 | 0줄 | +3줄 | 규칙 정합성 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#notifFeedbackModeGrid [data-notifmode]`, `#notifPrivacyToggle [data-privacy]`, `#notifBgSwitch`, `#notifDmSwitch`, `#notifTeamSwitch`, `#notifCheersSwitch`, `#notifDdaySwitch`, `#notifStreakSwitch`, `#testNotifyBtn`
2. **이벤트 리스너 (Listener)**: 클릭 시 실시간 설정값 변경, 12ms 햅틱, 피드백 사운드/진동 샘플 재생, 즉각 토스트
3. **비즈니스 로직 (Logic)**: `OurgoalNotifyEngine.dispatchGlobalNotification` 내 유형별 필터링, 프라이버시 마스킹, 방해금지 시간 판정, 백그라운드 Service Worker 연동
4. **피드백 & 예외처리 (Feedback)**: 토스트 알림, 상단 알림 배지 숫자 카운트, 플로팅 배너 애니메이션

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?
- [x] 레거시 설정 키(`settings.notifCheers` 등)와 신규 `settings.notifications` 간 듀얼 리더/라이터로 하위 호환성을 완벽 보장하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1: TICKETS.md 공식 등재**: `#TASK-ES-254` 추가 및 상태 `진행중` 명시.
2. **Step 2: `js/notify-engine.js` 고도화**:
   - `getNotifConfig()` 내에 5대 유형(`dmMessages`, `teamActivities`, `cheerActivities`, `goalReminders`, `streakReminders`) 및 `feedbackMode`, `privacyLevel`, `bgEnabled` 완전 정규화.
   - 프라이버시 `summary` 모드 시 DM, 응원, 팀, 일정 알림별 정갈한 마스킹 메시지 분기.
   - 피드백 모드 분기 (`all`: 소리+진동, `sound`: 소리만, `vibrate`: 진동만, `silent`: 무음).
3. **Step 3: `index.html` 설정 탭 UI 동기화**:
   - `renderSettingsScreen` 내 알림 스위치 바인딩 시 `notifConfig`와 `settings`를 동시 갱신하는 양방향 동기화 배선.
   - `testNotifyBtn` 클릭 시 현재 설정된 피드백 모드/프라이버시 수준에 맞추어 테스트 알림 디스패치.
   - `index.html` 내 응원(Cheers) 수신부를 `OurgoalNotifyEngine.dispatchGlobalNotification`으로 연결.
4. **Step 4: 단위 테스트 작성 및 실행**:
   - `tests/global-notification-suite.test.js` 작성 및 100% 통과 검증.
5. **Step 5: 스모크 테스트 및 헌법 5대 검증 게이트 통과**:
   - `scripts/smoke-test.js`에 검증문 추가 및 370+개 스모크 검사 전체 통과.
   - `scripts/verify-integrity-gate.js` 38개 검사 100% ALL PASS.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Claims & Verification)
- **R1 (피드백 모드 선택)**: 설정 탭에서 피드백 모드(소리+진동, 소리만, 진동만, 무음) 변경 시 `settings.notifications.feedbackMode`에 즉각 영속화.
- **R2 (프라이버시 수준 선택)**: 프라이버시 토글(상세 vs 간략형) 변경 시 `settings.notifications.privacyLevel`에 즉각 영속화.
- **R3 (백그라운드 수신 토글)**: 백그라운드 Web Notification 수신 스위치 토글 시 `settings.notifications.bgEnabled`에 즉각 영속화.
- **R4 (유형별 알림 5종 제어)**: DM, 팀 활동, 응원, 마감 D-day, 스트릭 알림 스위치 조작 시 각각의 필터 플래그가 독립적으로 제어 및 영속화.
- **R5 (응원 알림 전역 엔진 연계)**: 응원(Cheers) 수신 시 `OurgoalNotifyEngine.dispatchGlobalNotification`이 호출되어 플로팅 배너 및 알림 센터 큐에 적재.
- **R6 (테스트 알림 실시간 발송)**: `testNotifyBtn` 클릭 시 설정된 모드에 따라 플로팅 배너와 상단 배지가 정상 동작.
- **R7 (단위 및 스모크 테스트 무결성)**: `tests/global-notification-suite.test.js` 및 스모크 테스트 100% 무결성 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 4단계 마감 상한선 준수)
- [x] [1단계: 기획·설계 상태]: REQ 및 PLAN 문서 작성 완결.
- [ ] [2단계: 내부 시뮬레이션 상태]:
  - [ ] TICKETS.md 등재
  - [ ] `js/notify-engine.js` 고도화
  - [ ] `index.html` 설정창 스위치 양방향 배선 및 응원 알림 연계
  - [ ] `tests/global-notification-suite.test.js` 작성 및 통과
  - [ ] 스모크 테스트 및 헌법 5대 검증 게이트 38개 ALL PASS
- [ ] [3단계: 로컬 수동 확인 상태]: Zero Dead-Click 및 로컬 법정 사전 검증 통과.
- [ ] [4단계: 심사 청구 상태]: 작업 브랜치 푸시, 초안 PR 개설, GitHub Court 법정 판정 획득 (`상민님이 하실 일: 배포를 결정하실 수 있습니다`).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 위험**: `unreadNotifications` 큐가 무한 증식하여 로컬 스토리지 용량을 차지할 위험.
  - 방어책: `settings.unreadNotifications.slice(-50)`으로 최대 50건 슬라이딩 윈도우 유지.
- **오디오 재생 거부 방어**: 브라우저 오토플레이 정책으로 `playNotificationSound` 에러 발생 시 콘솔 경고 없이 조용히 무시하여 UI 렌더링에 영향 없도록 가드.
- **롤백 절차**: 문제 발생 시 `git checkout main` 및 `git branch -D feat/2026-09-24-task-es-254-global-notifications`를 통한 100% 무손실 원상복구.
