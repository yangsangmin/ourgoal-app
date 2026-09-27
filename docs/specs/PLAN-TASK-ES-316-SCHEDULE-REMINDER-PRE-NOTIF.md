# [구현 계획서] #TASK-ES-316: [65] 일정 편집 내 사전 알림 설정(울릴 시간 N분 전 지정) 완결

## 1. 개요
- **티켓**: `#TASK-ES-316` (E1/UX / 일정탭 / P1)
- **노션 번호**: [65]번
- **상민님 원문 지시**: *"일정에서 일정편집할 때 이 일정의 알림설정을 선택할 수 있게 기능추가. 그리고 알림의 설정을 해당 일정의 몇분전에 울릴건지도 같이 설정할 수 있게 해."*

## 2. 문서 및 변경 계획
1. `docs/specs/REQ-TASK-ES-316-SCHEDULE-REMINDER-PRE-NOTIF.md` (완료)
2. `docs/specs/PLAN-TASK-ES-316-SCHEDULE-REMINDER-PRE-NOTIF.md` (본 문서)
3. `docs/rules/TICKETS.md`에 `#TASK-ES-316` [진행중] 등록
4. `index.html`:
   - `calendarItemsByDate`: `customSchedules`, `goals`, `ms`, `tasks`, `gcal`에 `notifyEnabled`, `notifyMinutes` 매핑 전달.
   - `openCalendarManualEditModal`: 사전 알림 스위치 및 울릴 시간 선택/직접입력 UI 완비, 저장 로직 영속화.
   - `openCalendarDayEditHubModal` & `renderCalDayDetail`: 일정 카드에 `⏰ N분 전 알림` 배지 렌더링.
   - 앱 초기화 및 탭 전환 시 `OurgoalNotifyEngine.checkScheduleReminders()` 폴러 시작.
5. `js/notify-engine.js`:
   - `checkScheduleReminders()` 구현: 일정 스캔, 울릴 시점 계산, `dispatchGlobalNotification` 호출, 중복 발송 방지.
6. `js/components.js`:
   - `handle일정_Item65Action` 직통 핸들러 구현 (12ms 햅틱, `og_task-65_cache`, Supabase upsert, 4대 뷰 원자적 전파).
7. `tests/schedule-notification-setting.test.js`:
   - 단위 테스트 작성 및 통과.
8. `scripts/smoke-test.js`:
   - `#TASK-ES-316` 검증 단언문 추가 및 434개 전수 통과 (0개 실패).
9. `reports/TASK-ES-316/claims.json`:
   - 법정 주장서 작성 및 정적 타겟 검증.
10. GitHub Actions Court 심사 청구 및 머지.
