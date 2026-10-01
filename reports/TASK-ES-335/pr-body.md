## [블록 1] 작업 배경 및 목적 (Problem & Context)
- 티켓: #TASK-ES-335 (결심 7호 이행)
- 상민님 원문 결심 및 지시:
  - 결심 7: "주간·월간 회고 알림 시각 (안 A: 사용자 체크인 시각 따름, 없으면 일요일·말일 저녁 8시)"
  - 2026-10-01 상민님 확정 지시: "진행"
- 배경: 기존 서버 푸시 디스패처(`api/push-dispatch.js`)는 일일 체크인 알림("지금 뭐 하고 있었어요?")만 지원하여, 일요일과 월말에 한 주의 실천을 매듭짓고 다음 주를 향한 자기효능감을 복원하는 핵심 E2(기록 회고) 루프의 연결이 단절되는 결함이 있었습니다. 이에 상민님 결심 7호(안 A)에 따라, 사용자의 기존 체크인 설정 시각 중 최후 시각(없으면 20:00 폴백)에 맞춰 주간(일요일)/월간(말일) 회고 알림을 정밀 발송하고, 일요일/말일 겹침 방지 및 동일 시각 체크인 알림 중복 방지(`sent_slots` 연동)와 방해금지 시간(Quiet Hours)을 엄격히 준수하는 서버 푸시 스케줄러를 구축합니다.

## [블록 2] 주요 변경 내역 (Key Changes)
- `api/push-dispatch.js`:
  - `localNow(timezone)` 확장: 타임존별 요일(`dayOfWeek`), 일요일 여부(`isSunday`), 월말일 여부(`isMonthEnd`) 판별 로직 추가.
  - 회고 대상 시각 계산: 사용자의 `checkin_times` 중 가장 늦은 시각 선정, 미설정 시 기본값 `20:00` 폴백(결심 7호 안 A).
  - 회고 푸시 발송 갈래 신설:
    - 주간 회고(일요일): `title: '아워골 주간 회고'`, `body: '이번 주 한 걸음, 발자국을 돌아보세요 🐾'`, `url: '/#records'`
    - 월간 회고(말일): `title: '아워골 월간 회고'`, `body: '이번 달의 꾸준함, 멋진 결실을 확인해보세요 🌟'`, `url: '/#records'`
    - 일요일/말일 동시 도래 시 월간 회고 단일화 처리로 피로도 차단.
  - 중복 방지 및 안전핀: `sent_slots`에 `dateStr + '_review_' + reviewType` 기록, 회고 시각에 동일 시각 체크인 알림 중복 발송 방지(`continue`), 방해금지 시간(Quiet Hours) 우선 필터링, 감사 이벤트 `review_notification_sent` 로깅.
- `docs/rules/TICKETS.md`: #TASK-ES-335 티켓 등록.
- `docs/specs/REQ-TASK-ES-335-REVIEW-PUSH-DISPATCH.md`: 요구사항 정의서 (8원칙 완비).
- `docs/specs/PLAN-TASK-ES-335-REVIEW-PUSH-DISPATCH.md`: 엔지니어링 작업계획서 (8원칙 완비).
- `reports/TASK-ES-335/claims.json`: 법정 심사용 5대 단언문(C1~C5) 작성.

## [블록 3] 법정 판정서 (GitHub Court)
- (GitHub court 실행 후 업데이트 예정)

## [블록 4] 영향 범위 및 롤백 대책 (Impact & Rollback Plan)
- 영향 범위: `api/push-dispatch.js` 정기 크론 푸시 디스패치 루프.
- 롤백 대책: `git revert` 시 기존 단일 체크인 푸시 코드로 안전하게 복구 가능. 기존 일일 체크인 알림 및 즉시 푸시(DM) 로직은 100% 무손실 보존됨.
