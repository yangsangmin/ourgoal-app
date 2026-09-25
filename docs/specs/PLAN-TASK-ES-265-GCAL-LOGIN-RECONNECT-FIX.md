# 엔지니어링 작업계획서 (PLAN) — 구글 캘린더 연동 로그인 시 재연동 원인 규명 및 근본 해결

> **문서 ID**: PLAN-TASK-ES-265-GCAL-LOGIN-RECONNECT-FIX  
> **요구사항 연계**: [REQ-TASK-ES-265-GCAL-LOGIN-RECONNECT-FIX](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-265-GCAL-LOGIN-RECONNECT-FIX.md)  
> **티켓 연계**: #TASK-ES-265 (노션 생각 메모장 [08]번, Page ID: `3dc598db-9096-8155-b302-fe81bf15707f`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 새로 로그인하거나 새 배포/병합 시 구글 캘린더 연동이 풀리거나 재연동 팝업이 뜨는 5대 근본 원인을 박멸하고, 토큰 Silent Refresh 및 계정 DB/로컬 스토리지 삼중 영속화 엔진을 완성한다.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `restoreGoogleToken`, `requestGoogleToken`, `getGoogleAccessToken`, `loadLocalSettings`, `migrateGuestDataToUser`, `isGoogleCalendarConnected`, `calGcalMiniBadge`.
  - `api/track.js`: `settingsToSave` 수신 및 `settings_ledger` 원장 저장/복원 로직.
  - `tests/gcal-login-reconnect-fix.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: `#TASK-ES-265` 검증 단언문 추가.
  - `docs/rules/TICKETS.md`: `#TASK-ES-265` 티켓 등록.
  - `reports/TASK-ES-265/claims.json`: GitHub Court 심사 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 구글 캘린더 연동 세션의 무인 갱신(Silent Refresh)과 계정 DB 원장화 및 다중 키 자가 치유를 결합한 영구 영속화 엔진.
- **[원인] (Technical Causes)**:
  - GIS 토큰의 1시간 만료 시 무인 갱신 부재, 연동 설정의 로컬스토리지 격리(DB 미저장), 게스트 이관 누락, 배포 시 메모리 초기화, UID 불일치.
- **[중심 배선] (Core Wire & State)**:
  - `requestGoogleToken({ silent: true })` 및 `client.requestAccessToken({ prompt: '', hint: gEmail })`.
  - `/api/track` ➔ `settings_ledger` 원장 저장 및 `syncServerRecords` 복원.
  - `migrateGuestDataToUser` ➔ 캘린더 연동 설정 및 토큰 100% 무손실 이관.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 토큰 만료 시 대화형 팝업 강제 실행 원천 차단 (`if(!interactive) return null;`).
  - 로컬스토리지 삼중 백업 및 자가 치유 (`ourgoal_gcal_token_v1_{uid}`, `ourgoal_gcal_token_v1_last`, `ourgoal_gcal_email_last`).

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | Silent refresh, loadLocalSettings, migrateGuestDataToUser, isGoogleCalendarConnected | +120줄 | -20줄 | +100줄 | 코어 로직 고도화 |
| `api/track.js` | settingsToSave 수신 및 settings_ledger 원장 저장/복원 | +45줄 | -5줄 | +40줄 | 백엔드 엔드포인트 확장 |
| `tests/gcal-login-reconnect-fix.test.js` | 신규 단위 검증 스위트 신설 | +340줄 | 0줄 | +340줄 | 신규 파일 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |
| `docs/rules/TICKETS.md` | 작업 티켓 등록 | +1줄 | 0줄 | +1줄 | 문서 갱신 |
| `reports/TASK-ES-265/claims.json` | 법정 심사 청구서 | +90줄 | 0줄 | +90줄 | 법정 청구 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Safety)
- [ ] 기존 구글 캘린더 수동 동기화 및 일정 등록 기능이 100% 정상 작동하는가?
- [ ] 게스트 모드 사용자의 일반 목표/기록 이관 기능이 파괴되지 않고 유지되는가?
- [ ] 기존 스모크 테스트(382개) 및 신규 검증(383개)이 회귀 없이 ALL PASS 하는가?
- [ ] 승인선 5대 영역(돈, 개인정보, 기능 삭제, 바깥 행위, 규범 변경) 침범 없이 안전한가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Implementation)
1. **Step 1**: `api/track.js`에 `settingsToSave` 수신 및 `settings_ledger` 영구 원장 저장/복원 구현.
2. **Step 2**: `index.html`에 `requestGoogleToken({ silent: true })` 및 `getGoogleAccessToken` 무인 갱신 배선.
3. **Step 3**: `loadLocalSettings` 및 `isGoogleCalendarConnected` 다중 키 자가 치유 엔진 구축.
4. **Step 4**: `migrateGuestDataToUser`에서 구글 캘린더 연동 플래그 및 토큰 무손실 이관 배선.
5. **Step 5**: `tests/gcal-login-reconnect-fix.test.js` 단위 테스트 및 `scripts/smoke-test.js` 스모크 단언 작성.

---

## 6. [원칙 ⑥] 절차 재검증 계획 및 완료 조건 (Re-verification Plan & Definition of Done)
1. `tests/gcal-login-reconnect-fix.test.js`: 5대 시나리오 100% 통과 실측.
2. `node scripts/smoke-test.js`: 383개 전 항목 통과 실측.
3. `node scripts/verify-integrity-gate.js`: 38개 헌법 게이트 100% 통과 실측.
4. `node C:/dev/command-center/lib/tri-sync.js check`: 100% 무결 확인.
5. GitHub Court 합격 판정서 획득 및 PR squash 머지.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)
- [x] Step 1~5 순차적 구현 완결.
- [x] `node tests/gcal-login-reconnect-fix.test.js` 단위 테스트 PASS.
- [x] `node scripts/smoke-test.js` 383개 ALL PASS.
- [ ] `node scripts/verify-integrity-gate.js` 38개 ALL PASS.
- [ ] PR 생성 및 GitHub Court 심사 청구.
- [ ] PR 머지 및 main 동기화.
- [ ] Tri-Sync 완료 갱신.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback Plan)
- **잠재적 블로커**: 서드파티 쿠키 차단 환경 또는 브라우저 보안 정책에 의한 GIS 무인 갱신 실패.
- **사전 방어**: 무인 갱신 실패 시 사용자 인터랙션을 강제하지 않고 조용히 캐시를 유지하며, 사용자가 명시적 동기화 클릭 시 대화형 모달로 정중히 폴백.
- **롤백 계획**: 문제 발생 시 `git revert` 및 로컬스토리지 백업 키(`ourgoal_gcal_token_v1_last`)를 통해 기존 인증 상태로 즉각 복구 가능.
