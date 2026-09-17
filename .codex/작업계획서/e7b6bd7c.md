# [E3/INFRA/FIX] #TASK-ES-168 1:1 DM 및 전역 알림(Web Push·ServiceWorker·스마트 폴링·상단바 알림센터) 무결성 전면 고도화 및 결함 개선 작업계획서

**목표**: 1:1 DM 수신 알림 누락, 백그라운드 Web Push 단절, 모바일 ServiceWorker 알림 크래시, 스마트 폴링 부재, 상단바 알림 센터 및 배지 부재 등 알림 전반의 결함을 해결하여 종단간 상호작용 생존성을 완비하고 [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 완결

---

## 1. 문제해결 8원칙 기반 분석
1. **문제 파악**: "아워골 dm 등, 알림이 제대로 작동 안함. 개선해" — 1:1 DM 전송 시 수신자에게 실시간 알림이 도달하지 않고, 앱 종료/백그라운드 전환 시 Web Push가 0% 도달하며, 모바일 Chrome에서 `new Notification` 오류가 발생하고, 상단바에 알림 센터(🔔)가 없어 알림 상태 확인/조회가 불가능함.
2. **본질·원인**:
   - `E3/INFRA/FIX`: DM 전송 시 `/api/push-dispatch` 호출 누락 및 `api/push-dispatch.js` 타깃 푸시 미구현.
   - 모바일 환경에서 `ServiceWorkerRegistration.showNotification()` 대신 `new Notification()`을 호출하여 무음 에러 발생.
   - 웹소켓 단절 시 30초 스마트 폴링 백업 부재 및 상단바 알림 센터 UI 부재.
3. **해결 방식**:
   - `api/push-dispatch.js`: `targetUserId` 타깃 푸시 엔드포인트 구현 (VAPID Web Push 전송).
   - `js/notify-engine.js`: `navigator.serviceWorker.ready`를 통한 모바일 `reg.showNotification()` 최우선 호출 및 AudioContext 자동 unlock.
   - `js/team-invite-comm.js`: DM 발송 시 Web Push 비동기 호출, 30초 주기 스마트 폴링 루프 가동, 활성 대화방 실시간 DOM 동기화.
   - `index.html` & `ui.css`: 상단바 🔔 알림 버튼 및 배지(`topNotifBtn`, `topNotifBadge`), 알림 센터 모달(`openNotificationCenterModal`), 실시간 배지 동기화 함수(`updateTopNotifBadge`) 배선.
   - `sw.js`: `CACHE_NAME` 갱신 (헌법 제14조 제3항 준수).
4. **재검토**:
   - 기존 상단바 UI(활용법, 홈구성, 프로필 칩) 및 320종 페르소나 아바타 데이터 100% 무손실 보존.
   - 푸시 실패 시에도 DM 전송 및 인앱 수신 정상 작동하는 그레이스풀 폴백 보장.
5. **절차**:
   - [ ] 1. `docs/rules/TICKETS.md`에 #TASK-ES-168 정식 등록
   - [ ] 2. `api/push-dispatch.js`에 `targetUserId` 타깃 푸시 발송 분기 탑재
   - [ ] 3. `js/notify-engine.js` 모바일 ServiceWorker showNotification 및 Audio unlock 보강
   - [ ] 4. `js/team-invite-comm.js` DM 푸시 발송 연동, 30초 스마트 폴링, 활성 대화방 실시간 DOM 렌더링
   - [ ] 5. `index.html` 및 `ui.css` 상단바 알림 벨 버튼, 알림 센터 모달, 배지 동기화 배선
   - [ ] 6. `sw.js` `CACHE_NAME` 갱신
   - [ ] 7. `scripts/smoke-test.js` 컴플라이언스 검증 추가 및 `npm test` 전수 통과
   - [ ] 8. `verify-integrity-gate.js` 린터 및 5대 무결성 검증 통과
   - [ ] 9. [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 완결 및 상민님께 실서버 배포 여부 보고
6. **절차 재검증**:
   - `npm test` 308개 이상 전수 통과 및 `verify-integrity-gate.js` ALL PASS 확인.
   - `node C:/dev/command-center/lib/tri-sync.js check`로 3자 동기화 무결성 확인.
7. **단계별 실행**: 위 절차 순차 집행.
8. **막히는 지점 예상**: VAPID 키 미설정 또는 네트워크 단절 시 푸시 API 실패 가능 -> try/catch로 완벽 격리하여 사용자 화면에는 영향 없이 안전 작동하도록 사전 방어.
