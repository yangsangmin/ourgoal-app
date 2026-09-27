# [요구사항 정의서] #TASK-ES-316: [65] 일정 편집 내 사전 알림 설정(울릴 시간 N분 전 지정) 기능 완결

## 1. 개요 및 배경
- **티켓 ID**: `#TASK-ES-316`
- **본질 축**: E1(체크인 루프) / UX(사용자 경험 고도화)
- **노션 원문 번호**: [65]번
- **상민님 원문 지시**:
  > *"일정에서 일정편집할 때 이 일정의 알림설정을 선택할 수 있게 기능추가. 그리고 알림의 설정을 해당 일정의 몇분전에 울릴건지도 같이 설정할 수 있게 해."*

## 2. 핵심 요구사항

### 1) 일정 수동 편집 모달 (`openCalendarManualEditModal`) 알림 제어 완비
- 일정 추가 및 편집 시 **'⏰ 사전 알림 받기'** 토글 스위치 제공.
- 사전 알림 활성화 시 **'울릴 시간 (사전 알림)'** 설정 영역 노출.
- 사전 알림 옵션:
  - 0분: 정시 (일정 시작 시각)
  - 5분: 5분 전
  - 10분: 10분 전 (기본값)
  - 15분: 15분 전
  - 30분: 30분 전
  - 60분: 1시간 전
  - 120분: 2시간 전
  - 1440분: 1일 전
  - custom: 직접 입력(분 단위)
- 저장 시 모든 일정 유형(`custom`, `goal`, `ms`, `task`, `gcal`)에 `notifyEnabled: boolean`, `notifyMinutes: number` 영속화.

### 2) 캘린더 일정 목록 내 시각화 알림 배지 표출
- 일정 허브 모달(`openCalendarDayEditHubModal`) 및 일간 상세(`renderCalDayDetail`) 목록에서 `notifyEnabled === true`인 일정 카드에 알림 배지 표출:
  - 예: `<span class="sched-notify-badge">⏰ 10분 전 알림</span>` 또는 `⏰ 정시 알림`
- 사용자가 일정을 열어보지 않아도 해당 일정에 알림이 설정되어 있음을 즉시 시각적으로 확인 가능.

### 3) 실시간 사전 알림 엔진 (`OurgoalNotifyEngine.checkScheduleReminders`) 탑재
- `js/notify-engine.js`에 `checkScheduleReminders()` 엔진 구현.
- 1분 주기로 주기적 스캔을 수행하여 현재 시각과 비교해 `notifyEnabled === true`인 일정이 시작 전 `notifyMinutes` 시점에 도달하면 `OurgoalNotifyEngine.dispatchGlobalNotification()` 호출.
- 포그라운드 플로팅 배너, 브라우저 알림/푸시, 사운드, 진동 트리거.
- 중복 알림 방지 캐시(`ourgoal_notified_scheds`) 탑재.

### 4) 직통 액션 핸들러 구현 (`js/components.js`)
- `handle일정_Item65Action`:
  - 12ms 미세 햅틱 피드백 (`triggerHapticFeedback(12)`)
  - 로컬 스토리지 캐시 `og_task-65_cache` 영속화
  - `profile.settings.scheduleNotificationEnabled = true` 저장 및 Supabase upsert
  - 4대 뷰 원자적 동시 전파 (`renderCalendarScreen`, `renderHome`, `renderGoalsScreen`, `renderRecordsScreen`)
  - 일정 편집 모달 브릿지 지원

### 5) 무결성 및 하위 호환성 엄수
- 기존 캘린더 기능, 토글, 목표 연동, 참고자료 첨부 등 기존 동작 100% 무손실 보존.
- 단위 테스트 및 434개 스모크 테스트 무결점 전수 통과.
- GitHub Court 법정 심사 청구 및 통과.
