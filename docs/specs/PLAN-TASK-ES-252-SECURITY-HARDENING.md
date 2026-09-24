# #TASK-ES-252 사용자 계정 및 데이터 관리·보관 보안 전수 조치 작업계획서 (PLAN)

## 1. 개요
- 본 계획서는 REQ-TASK-ES-252 명세에 따라 아워골 시스템 전반의 5계층 보안 방어선을 구축하기 위한 구체적인 파일별 수정 및 검증 절차를 기술한다.

---

## 2. 세부 구현 계획

### Step 1: `api/track.js` 인증 모듈 장착 및 IDOR 원천 차단
- `verifyCallerAuth(sb, req, expectedUserId)` 헬퍼 구현:
  - Authorization 헤더(`Bearer <token>`) 추출.
  - `sb.auth.getUser(token)` 호출하여 인증 성공 여부 및 `user.id` 확인.
  - `expectedUserId`가 지정된 경우 소유권(`user.id === expectedUserId`) 일치 확인.
- `handleSyncRecords`:
  - `targetUid`에 대한 토큰 검증 수행. 미인증 시 `401 Unauthorized`, 불일치 시 `403 Forbidden`.
  - 데이터 저장(`recordsToSave`, `profileToSave`) 요청 시 반드시 인증된 사용자 본인의 ID로만 저장되도록 강제.
- `handleSyncCompanions`:
  - `userId`에 대한 토큰 검증 수행. 미인증 시 `401 Unauthorized`.

### Step 2: `api/push-subscribe.js` 캘린더 HMAC 검증 & 푸시 소유권 확인
- 캘린더 요청 처리 시:
  - `qToken` 파싱: `userId` 또는 `userId.signature` 형식 지원.
  - `crypto.createHmac('sha256', HMAC_SECRET)`를 통한 서명 검증.
  - 서명 불일치 시 `403 Forbidden` 차단.
- 푸시 구독(POST/DELETE) 처리 시:
  - 토큰이 제공된 경우 소유자 일치 여부 확인.

### Step 3: `api/push-dispatch.js` Fail-Closed 전환
- `isAuthorized(req, sb)` 함수 내:
  - `if (!cronSecret) return true;` -> 제거.
  - `cronSecret` 및 `cachedDbToken` 둘 다 없을 경우 `return false;` (Fail-Closed).
  - 유효한 Bearer 토큰이 일치하지 않으면 즉시 `401 Unauthorized` 반환.

### Step 4: `api/vision-table.js` 노션 프록시 차단
- `body.apiKey` 또는 `databaseId`가 누락된 경우 서버 환경변수로 폴백하지 않고 `400 Bad Request` 에러 반환.

### Step 5: `index.html` 클라이언트 토큰 전송 연동 및 UI 갱신
- `sync_records` 호출부:
  - 현재 세션 토큰(`sb.auth.getSession()` 또는 `_pendingAuthSession`)이 있으면 `headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }` 전달.
  - 세션이 없는 게스트의 경우 백엔드 호출 대신 로컬 스토리지 데이터만 보존하여 불필요한 401 오류 방지.
- 1차 가짜 UI(`og-task-17-container`) 정리:
  - 실제 계정 보안 점검 상태를 반영하는 실데이터 인디케이터로 단정화.

### Step 6: 보안 감사 단위/침투 테스트 및 스모크 테스트 무결성
- `tests/security-audit.test.js` 침투 테스트 작성 (IDOR, HMAC 변조, Fail-Closed, 프록시 차단).
- `scripts/smoke-test.js`에 TASK-ES-252 검증 케이스 추가.

---

## 3. 검증 계획

### 1) 단위/침투 테스트 (`tests/security-audit.test.js`)
- IDOR 공격 시나리오(인증 없는 요청, 타인 토큰 요청) 401/403 차단 테스트.
- 캘린더 HMAC 서명 위조 시 403 차단 테스트.
- Push Dispatch Fail-Closed 테스트.
- Vercel 보안 헤더 정적 검증 테스트.

### 2) 회귀 검증
- `node scripts/smoke-test.js` 전항목 실행 및 0 failure 통과.

### 3) GitHub Court & Tri-Sync
- PR 발행 -> Court 심사 통과 -> Tri-Sync 100% 확인.
