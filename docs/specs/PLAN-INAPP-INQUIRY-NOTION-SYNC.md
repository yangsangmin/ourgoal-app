# 구현 계획서 (PLAN) — 아워골 인앱 1:1 고객 문의·오류 제보 접수 시스템 완결 및 노션 DB·텔레그램 실시간 자동 연동

> **문서 ID**: PLAN-INAPP-INQUIRY-NOTION-SYNC  
> **티켓 연계**: #TASK-ES-123  
> **기준 REQ**: [REQ-INAPP-INQUIRY-NOTION-SYNC](file:///C:/dev/ourgoal-app/docs/specs/REQ-INAPP-INQUIRY-NOTION-SYNC.md)  
> **작성 일시**: 2026-09-16  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수  

---

## 1. [원칙 ①] 파악 (Architecture & Scope)
- **대상 파일**:
  1. `api/inquiry.js` [신규]: Vercel 서버리스 API 엔드포인트
  2. `docs/sql/2026-09-16-inquiries.sql` [신규]: Supabase inquiries DDL
  3. `index.html` [수정]: 1:1 문의 모달 4위 1체 배선 연결
  4. `scripts/smoke-test.js` [수정]: 스모크 테스트 및 단언문 추가
  5. 노션 아워골 마스터 페이지: 신규 DB '아워골 고객 문의 및 제보 관리' 생성

---

## 2. [원칙 ②] 중심 배선 (Core Wire)
- **트리거**: 유저가 설정 탭 고객지원에서 [1:1 문의 및 오류 제보] 클릭 ➔ 모달 입력 ➔ [문의 접수] 클릭
- **백엔드 라우트**: `POST /api/inquiry`
- **전파 경로 (3-Way Dispatch)**:
  ```mermaid
  graph TD
    User([유저 모달 제출]) --> API["/api/inquiry"]
    API --> Supabase[(Supabase inquiries 테이블)]
    API --> Notion[(노션 고객문의 DB)]
    API --> Telegram[상민님 텔레그램 알림]
  ```

---

## 3. [원칙 ③] 파일별 Before / After 및 변경 예산

### 3-1. `api/inquiry.js` [신규 생성]
- Supabase REST API 호출: `process.env.SUPABASE_URL`, `process.env.SUPABASE_SERVICE_ROLE_KEY`
- 노션 API 호출: `process.env.NOTION_TOKEN` (미설정 시 커맨드센터 토큰 폴백)
- 텔레그램 Bot API 호출: `process.env.TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_ID` (1260106462)

### 3-2. `index.html` [L20818~L20853 `openCustomerInquiryModal`]
- **Before**:
  ```javascript
  sheet.querySelector('#inquirySubmit').onclick = function(){
    var content = (sheet.querySelector('#inquiryContent').value || '').trim();
    if(!content){ toast('문의 내용을 입력해주세요'); return; }
    closeModal();
    toast('문의가 성공적으로 접수되었습니다. 검토 후 이메일로 답변드리겠습니다.');
  };
  ```
- **After**:
  - 버튼 `disabled` 및 `접수 중...` 처리
  - `fetch('/api/inquiry', { method: 'POST', body: JSON.stringify({...}) })` 비동기 통신
  - 성공 시 `toast('문의가 접수되었습니다. 소중한 의견 감사합니다.')` 후 모달 닫기
  - 실패 시 버튼 복원 및 에러 안내

---

## 4. [원칙 ④] 재검토 (Edge Cases & Fault Tolerance)
- 노션 토큰이 없거나 텔레그램 API 오류가 발생해도 Supabase 저장은 독립적으로 완료되어 데이터 손실이 없어야 함.
- 만약 Supabase DB 접속이 실패하면 노션에 우선 적재하고 텔레그램을 쏘는 Graceful Fallback 유지.

---

## 5. [원칙 ⑤] 구현 상세 순서
1. **[Step 1: 노션 DB 생성]**: Notion MCP / API를 통해 아워골 마스터 페이지(`3d4598db-9096-815f-8653-d99eb9ea5703`) 하위에 데이터베이스 구축.
2. **[Step 2: DDL 스크립트 작성]**: `docs/sql/2026-09-16-inquiries.sql` 작성.
3. **[Step 3: `/api/inquiry.js` 구현]**: 서버리스 핸들러 구현 및 로컬 모의 테스트.
4. **[Step 4: `index.html` 배선]**: 모달 핸들러 실제 호출 연동.
5. **[Step 5: 테스트 작성 및 전체 패스]**: `scripts/smoke-test.js` 검증 추가 및 `npm test` 통과.
6. **[Step 6: Tri-Sync 동기화 및 컨트롤타워 갱신]**: `task-link.js` 동기화.

---

## 6. [원칙 ⑥] 5대 무결성 검증 시나리오
- 전수 클릭: 문의 모달 열기, 닫기, 내용 검증, 제출 클릭 동작.
- 스모크 테스트: `npm test` 기존 249개+ 테스트 100% 통과.
- 데이터 무결성: `scripts/verify-integrity-gate.js` 100% 통과.

---

## 7. [원칙 ⑦] 체크리스트
- [ ] 노션 DB 신설 및 ID 확인
- [ ] `docs/sql/2026-09-16-inquiries.sql` 생성
- [ ] `api/inquiry.js` 구현
- [ ] `index.html` 4위 1체 배선
- [ ] `scripts/smoke-test.js` 테스트 추가 및 통과
- [ ] 로컬 메인 병합

---

## 8. [원칙 ⑧] 블로커 대책
- 노션 API Rate Limit 대비 재시도 로직 내장.
- 텔레그램 알림 타임아웃 3초 설정으로 유저 응답 지연 방지.
