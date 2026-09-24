# #TASK-ES-252 사용자 계정 및 데이터 관리·보관 보안 전수 조치 요구사항 정의서 (REQ)

## 1. 개요 및 배경
- **요청자**: 상민님 직접 지시 (노션 생각 메모장 `[17]`번 / 2026-09-24 승인)
- **지시 내용**: *"사용자 계정 및 데이터 관리, 보관에 보안 취약점이나 해킹가능성이 없는지 확인하고 조치해야함"*
- **목적**: 아워골 전수 보안 감사에서 발견된 6대 치명적 침해 경로(IDOR 무인증 데이터 탈취, 캘린더 피드 유출, 푸시 가로채기, Fail-Open Cron 취약점, 노션 프록시 남용, HTTP 보안 헤더 부재)를 완벽히 차단하고, 금융권 수준의 5계층 프로덕션 방어선을 구축한다.

---

## 2. 요구사항 명세

### REQ-1: `api/track.js` 무인증 IDOR 차단 및 JWT Bearer 인증 강제
- `action === 'sync_records'` 호출 시:
  - Authorization 헤더 내 Supabase JWT(`Bearer <token>`) 검증을 거친다 (`sb.auth.getUser(token)`).
  - 인증된 사용자의 `user.id`가 요청의 `targetUid`(또는 본인의 ID)와 일치하는 경우에만 Service Role 조회를 허용한다.
  - 토큰이 없거나, 다른 사용자의 데이터를 조회/수정하려 시도할 경우 즉시 `401 Unauthorized` 또는 `403 Forbidden`을 반환하고 차단한다.
  - 게스트 모드(비로그인 로컬 사용자)의 경우 서버 동기화를 생략하고 로컬 스토리지에만 보관하도록 클라이언트와 연동한다.
- `action === 'sync_companions'` 호출 시:
  - 호출자의 JWT가 `body.userId`와 일치할 때만 동반자 원장 조회 및 저장을 허용한다. 미일치 시 `401/403` 차단.

### REQ-2: `api/push-subscribe.js` 캘린더 iCal 피드 무인증 유출 차단 (HMAC 서명 토큰)
- 단순 공개 `userId` 파라미터로 타인의 캘린더를 다운로드할 수 있는 취약점을 차단한다.
- 캘린더 구독 URL의 `token` 파라미터는 `userId.hmacSignature` 형식으로 서명 검증을 수행한다.
- HMAC 검증에 실패한 위조 토큰 요청은 `403 Forbidden` 처리하여 타인의 비공개 일정 및 목표 유출을 원천 방어한다.

### REQ-3: `api/push-subscribe.js` 푸시 구독 변조 방어
- `POST` 및 `DELETE` 구독 변경 요청 시, 로그인 세션 토큰이 제공된 경우 소유권(`user.id === req.body.userId`)을 교차 검증한다.

### REQ-4: `api/push-dispatch.js` Fail-Closed 전환
- `CRON_SECRET` 및 DB 토큰 검증에서 시크릿이 누락된 경우 통과(Fail-Open)시키던 취약점(`if (!cronSecret) return true;`)을 즉시 폐기하고, 시크릿 검증 실패 시 반드시 `401 Unauthorized`로 거절(Fail-Closed)한다.

### REQ-5: `api/vision-table.js` 서버 API Key 대리 남용 차단
- `action === 'notion_push'` 요청 시 클라이언트가 제공한 API Key/DB ID가 없으면 서버의 `NOTION_API_KEY`를 대리 사용하지 않고 `400 Bad Request`로 거절한다.

### REQ-6: `index.html` 클라이언트 토큰 연동 및 보안 가시성
- 클라이언트 `sync_records` 호출부에 현재 세션 토큰(`session.access_token`)을 Bearer 헤더로 실어 보내도록 배선.
- 비로그인 게스트 사용자는 로컬 저장소 우선으로 안전하게 동작.
- 1차 가짜 UI(`og-task-17-container`)를 제거하고, 실제 계정 보안 상태(인증 모드, 토큰 상태)를 검증 가능한 정상 UI로 갱신.

### REQ-7: 침투 및 방어 단위 테스트와 회귀 스모크 테스트 무결성
- `tests/security-audit.test.js` 침투 테스트 시나리오를 통해 401/403/Fail-Closed/오픈프록시 차단을 자동 검증한다.
- `scripts/smoke-test.js` 전수 검사를 0 failure로 통과해야 한다.
- (참고: `vercel.json` HTTP 보안 헤더는 헌법 제7조 제10항 3호 금고 규정에 따라 제품 코드와 분리하여 단독 PR로 처리한다)

---

## 3. 검증 기준 (Definition of Done)
1. 침투 테스트(`tests/security-audit.test.js`) 7개 시나리오 100% PASS.
2. 기존 스모크 테스트(`scripts/smoke-test.js`) 0 failure 무결성 유지.
3. GitHub Court 검사 PASS.
4. Tri-Sync(노션·옵시디언·관제센터) 동기화율 100%.
