# [엔지니어링 작업계획서] #TASK-ES-335: 주간·월간 회고 알림 서버 푸시 갈래 신설 및 사용자 맞춤 발송 스케줄러 구축

## 1. 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**:
  - `api/push-dispatch.js`에 주간(일요일)/월간(말일) 회고 알림 발송 갈래 신설.
  - 회고 시각: 사용자의 `checkin_times` 중 가장 늦은 시각 (없으면 20:00 폴백).
  - 방해금지 시간(Quiet Hours) 준수 및 중복 방지(`sent_slots`에 `dateStr + '_review_' + ...` 기록).
  - 푸시 클릭 시 `/#records` 탭 직통 연결.
- **영향받는 파일 전수 목록**:
  1. `docs/rules/TICKETS.md`: #TASK-ES-335 티켓 등록 (완료)
  2. `docs/specs/REQ-TASK-ES-335-REVIEW-PUSH-DISPATCH.md`: 요구사항 정의서 (완료)
  3. `docs/specs/PLAN-TASK-ES-335-REVIEW-PUSH-DISPATCH.md`: 엔지니어링 작업계획서 (본 문서)
  4. `reports/TASK-ES-335/claims.json`: 법정 심사용 주장 파일
  5. `reports/TASK-ES-335/pr-body.md`: 초안 PR 설명문
  6. `api/push-dispatch.js`:
     - 타임존 날짜 상세 헬퍼 `localDateDetails(timezone)` 구현
     - 정기 크론 루프 내 회고 알림 판별 및 푸시 발송 분기 추가
     - 중복 방지 슬롯 및 감사 이벤트 로깅 연동

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **E2 (기록 회고 루프) / INFRA** — 한 주의 실천을 매듭짓고 다음 주를 향한 자기효능감을 복원하는 결정적 순간(회고)으로 유저를 안내하는 지능형 스케줄러 구축.
- **[원인] (Technical Causes)**:
  - `api/push-dispatch.js`에 체크인 알림("지금 뭐 하고 있었어요?") 단일 갈래만 존재하고, 요일(일요일) 및 월말일을 감지하여 회고 알림을 발송하는 분기가 누락됨.
- **[중심] (Core Wire & State)**:
  - `localDateDetails(timezone)`: `{ dateStr, hh, mm, dayOfWeek, isMonthEnd }`
  - 회고 발송 시각: `checkinTimes.length ? checkinTimes.sort(...).pop() : '20:00'`
  - `slotKey`: `now.dateStr + '_review_' + reviewType`
- **[핵심] (Critical Safety & Persistence)**:
  - 기존 일일 체크인 알림 발송 로직 100% 무손실 보존.
  - 일요일/말일에 체크인 알림과 회고 알림이 동일 시각에 중복으로 2번 울리지 않도록 회고 알림 우선 단일화 처리.
  - 방해금지 시간(Quiet Hours) 엄격 준수.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [pg_cron 매분 트리거] -> /api/push-dispatch
        │
        ▼ (토큰 인증 통과)
  push_subscriptions 테이블 순회
        │
        ├─► 타임존 기준 nowMin, dayOfWeek, isMonthEnd 계산
        ├─► quiet_hours_enabled 검사 (방해금지 시 continue)
        │
        ├─► [회고 분기 판정] (일요일 또는 월말일인가?)
        │     ├─► YES:
        │     │     회고 대상 시각(checkinTimes 중 최후 시각 or 20:00) 매칭 검사
        │     │     매칭 시: 주간/월간 회고 푸시 발송
        │     │     sent_slots에 [dateStr + '_review_...'] 추가
        │     │     (체크인 알림 중복 발송 생략)
        │     │
        │     └─► NO:
        │           일반 체크인 알림 매칭 및 발송 (기존 유지)
        │
        └─► 결과 응답 { checked, sent, removed, errors }
  ```

## 3. 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `api/push-dispatch.js`: 추가 약 45줄, 변경 약 10줄 (총 diff 55줄 이내)
  - `docs/specs/*`: 신규 생성 2개 파일
  - `reports/TASK-ES-335/*`: 신규 생성 2개 파일
- **알림 페이로드 규격**:
  - 주간 회고: `{ title: '아워골 주간 회고', body: '이번 주 한 걸음, 발자국을 돌아보세요 🐾', url: '/#records', tag: 'weekly-review-' + dateStr }`
  - 월간 회고: `{ title: '아워골 월간 회고', body: '이번 달의 꾸준함, 멋진 결실을 확인해보세요 🌟', url: '/#records', tag: 'monthly-review-' + dateStr }`

## 4. 기존 코드와의 조화 및 리팩터링 안전핀 (Integration & Safety)
- 기존의 핸들러 시그니처 `handler(req, res)` 및 반환 포맷 `{ checked, sent, removed, errors }` 100% 동일 유지.
- 인스턴트 푸시(DM 발송 분기) 및 보안 토큰 인증(Fail-Closed) 로직 100% 무손실 보존.

## 5. 단계별 구현 절차 (Implementation Steps)
1. `api/push-dispatch.js`에 `localDateDetails(timezone)` 헬퍼 작성.
2. `api/push-dispatch.js`의 `for (var i = 0; i < rows.length; i++)` 루프 내에 회고 알림 조건 판별 및 발송 로직 추가.
3. `reports/TASK-ES-335/claims.json` 및 `pr-body.md` 작성.
4. 로컬 무결성 게이트 및 `npm test` 전수 검증.
5. 심사 청구 및 판정서 확인.

## 6. 절차 재검증: 법정 주장(claims) 설계 (Claims Design & Anti-SPOF)
- **법정 심사용 정적 단언문 설계 (claims.json)**:
  - **C1**: `api/push-dispatch.js` 내에 타임존 기반 날짜 판별 로직(요일 및 월말일)이 존재한다.
  - **C2**: `api/push-dispatch.js` 내에 회고 발송 시각 계산(최후 시각 또는 20:00 폴백) 로직이 존재한다.
  - **C3**: `api/push-dispatch.js` 내에 주간 회고 메시지("아워골 주간 회고") 발송 코드가 존재한다.
  - **C4**: `api/push-dispatch.js` 내에 월간 회고 메시지("아워골 월간 회고") 발송 코드가 존재한다.
  - **C5**: `api/push-dispatch.js` 내에 회고 슬롯 중복 방지(`_review_`) 키 배선이 존재한다.
- **Anti-SPOF 재검증**:
  - `webpush.sendNotification` 실패 시 기존과 동일하게 404/410은 구독 삭제(`removed++`), 기타는 `errors++`로 격리 처리되어 전체 루프가 절대 다운되지 않음.

## 7. 단계별 실행 체크리스트 (Execution Checklist)
- [ ] 1. `docs/rules/TICKETS.md` 티켓 등록 (완료)
- [ ] 2. `docs/specs/REQ-TASK-ES-335-REVIEW-PUSH-DISPATCH.md` 작성 (완료)
- [ ] 3. `docs/specs/PLAN-TASK-ES-335-REVIEW-PUSH-DISPATCH.md` 작성 (완료)
- [ ] 4. `api/push-dispatch.js` 회고 알림 분기 구현
- [ ] 5. `reports/TASK-ES-335/claims.json` 및 `pr-body.md` 작성
- [ ] 6. 무결성 게이트 및 단위 테스트 통과
- [ ] 7. Draft PR 생성 및 GitHub 법정 심사 청구

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: `tests/security-audit.test.js` 또는 기존 스모크 테스트와의 정합성.
- **재검증 트리거**: `npm test` 실패 시 즉시 원칙 4(기존 기능과의 충돌 여부)로 되돌아가 `api/push-dispatch.js`의 요청 처리 흐름 및 응답 포맷을 검수한다.
