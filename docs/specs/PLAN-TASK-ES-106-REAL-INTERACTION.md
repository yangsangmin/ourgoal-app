# [작업계획서] #TASK-ES-106: 헌법 제19조 의거 실 사용자 계정 상호 연동(Real Inter-Account Interaction) DM 및 동반자 시스템 완결

> **문서 ID**: PLAN-TASK-ES-106-REAL-INTERACTION  
> **작성일**: 2026-09-16  
> **작성자**: Antigravity (Gemini)  
> **티켓 번호**: #TASK-ES-106  
> **상태**: 수립 완료 (4단계 상한선 준수)

---

## 1. 중심 배선(Wire) 식별 (문제해결 8원칙 ②)
- **Supabase DB & Realtime Wire**:
  - `team_ping_replies` 또는 `direct_messages` 테이블을 활용하여 `sender_id`, `receiver_id`, `message` 저장 및 실시간 `sb.channel` 구독.
  - 대화방 진입 시: 이전 대화 목록 SELECT (`sender_id`, `receiver_id`).
  - 메시지 전송 시: DB INSERT 및 Optimistic UI 렌더링.
  - 상대방 화면: Realtime `postgres_changes` 이벤트 수신 즉시 대화창에 append 및 읽음 처리.
- **실제 사용자 검색 Wire**:
  - `sb.from('users').select('id, nickname, avatar, theme, streak, intro')` 실제 회원 검색.
  - 검색 결과에서 '동반자 요청' 시 내 `profile.companions`에 영속화.
- **가짜 실제구현 척결 Wire**:
  - `ALL_SEARCHABLE_USERS` 하드코딩 제거 및 실제 가입자 조회로 전환.
  - `setTimeout` 가짜 자동답장 완전 제거.

---

## 2. 파일별 Before/After 및 변경 예산 (문제해결 8원칙 ③)
- `js/team-invite-comm.js`:
  - Before: `ALL_SEARCHABLE_USERS` 하드코딩 필터링, `setTimeout` 700ms 가짜 자동답장, 로컬스토리지 자가 루프.
  - After: 실제 Supabase DB 원장 연동(INSERT/SELECT), Realtime 구독(`sb.channel`), 실제 회원 검색, 게스트 소프트 게이트, AI 봇 투명 뱃지.
  - 변경 예산: 약 150줄 수정/보강.
- `scripts/verify-integrity-gate.js`:
  - 헌법 제19조 검증기 통과 유지.
- `scripts/smoke-test.js`:
  - 실 사용자 계정 간 상호 연동(송신자 -> DB -> 수신자) E2E 테스트 케이스 추가.

---

## 3. 체크리스트 (문제해결 8원칙 ⑦)
- [ ] 1. REQ/PLAN 수립 및 TICKETS.md 등록, Tri-Sync 동기화
- [ ] 2. 브랜치 `feat/task-es-106-real-companion-dm` 생성
- [ ] 3. `js/team-invite-comm.js` 내 가짜 자동답장(`setTimeout`) 제거 및 Supabase DB 원장 / Realtime 연동
- [ ] 4. 실제 사용자 닉네임 검색 및 동반자 관리 로직 배선
- [ ] 5. 게스트 소프트 게이트 및 투명한 AI 봇 뱃지 적용
- [ ] 6. smoke-test.js 실 계정 연동 테스트 추가 및 npm test 전수 통과
- [ ] 7. 로컬 main 병합 및 5A 프리뷰 배포

---

## 4. 5대 무결성 검증 시나리오 (문제해결 8원칙 ⑥)
1. **제1검증(Zero Dead-Click)**: DM 전송, 뒤로가기, 닉네임 검색, 동반자 추가/삭제, 프로필 보기 클릭 시 0 에러.
2. **제2검증(Zero UX Regression)**: 게스트/로그인 상태 모두에서 화면 깨짐 없이 우아하게 동작.
3. **제3검증(Zero Data Loss)**: 기존 사용자 데이터 및 동반자 목록 100% 무손실 보존.
4. **제4검증(Full State Propagation)**: 메시지 전송 시 상대방 화면에 즉시 실시간 반영.
5. **제5검증(기술 규격 통과)**: 249개 이상 스모크 테스트 + 13대 무결성 게이트 100% ALL PASS.
