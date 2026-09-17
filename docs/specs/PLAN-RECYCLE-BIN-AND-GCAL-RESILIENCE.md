# [PLAN] 구글 캘린더 연동 정상화 및 전역 7일 유예 통합 휴지통(Recycle Bin) 구축 작업계획서

**문서 ID**: PLAN-RECYCLE-BIN-AND-GCAL-RESILIENCE
**작성 일자**: 2026-09-17
**귀속 축**: [E1 & INFRA & FIX]
**헌법 준수**: 최고 헌법 제2조(문제해결 8원칙 2회차), 제3조(4위 1체 배선), 제4조(파괴적 삭제 금지), 제7조(5대 무결성 검증), 제9조(4단계 로컬 메인 병합 상한선), 제15조(스토리지 수명주기)

---

## 1. 문제해결 8원칙 2회차 적용 (작업계획 수립)

### ① 파악 (Scope & Architecture)
- 구글 캘린더 9대 연동 결함 전면 해소.
- 목표, 일정, 기록, 구글 삭제 일정에 대한 7일 유예 통합 휴지통 및 100% 원복 배선.

### ② 중심 배선 (Core Wire Identification)
1. **gcalWire**:
   - effectiveGcalClientId -> settings.gcalClientId 우선.
   - ensureGoogleTokenClient -> openid email profile 스코프.
   - fetchGoogleCalendarEvents -> ourEvIds에 sync.imported 포함, KST 로컬 dayKey.
   - pushCalendarEvent -> 404/410 시 ID 리셋 후 신규 POST.
   - toggleScheduleDone -> kind === 'gcal' 완료 상태 영속화.
2. **trashWire**:
   - moveToTrash(entityType, entityId, payload, source) -> state.profile.trash unshift -> 4대 뷰 전파.
   - restoreFromTrash(trashId) -> 원본 배열 복구 + 고아 일정 방어 + 구글 재생성 -> 4대 뷰 전파.
   - autoPurgeExpiredTrash() -> 7일 만료 자동 영구 삭제.
   - openTrashModal() -> 항목 리스트, D-Day 배지, 원복, 영구 삭제, 전체 비우기.

### ③ 파일별 Before/After 및 변경 예산 (File Changes)
- index.html:
  - 구글 연동 함수 8곳 보정.
  - 통합 휴지통 함수 5개 신설 (moveToTrash, restoreFromTrash, autoPurgeExpiredTrash, openTrashModal, emptyTrash).
  - 기존 deleteGoal, deleteSchedule, deleteRecord 호출부를 moveToTrash로 안전 래핑.
  - 설정 화면에 휴지통 진입로 및 스낵바 토스트 취소선 배선.
- docs/sql/migration_20260917_recycle_bin.sql:
  - users.trash JSONB 컬럼 DDL 신설.
- scripts/smoke-test.js:
  - 휴지통 수명주기 4단계 E2E 및 구글 캘린더 연동 검증 테스트 추가.

### ④ 재검토 (Safety Guard)
- 비파괴 합집합 원칙 엄수.
- 7일 만료 전까지는 원본 데이터의 필드(메타데이터, 첨부파일) 단 1바이트도 손실 없음 보장.

### ⑤ 구현 상세 순서 (Implementation Order)
1. docs/sql 마이그레이션 DDL 작성.
2. index.html 내 구글 연동 결함 8종 보정.
3. index.html 내 통합 휴지통 데이터 모델 및 CRUD 함수 탑재.
4. 목표/일정/기록 삭제 핸들러를 Soft Delete(휴지통)로 치환.
5. 설정 화면 진입로 및 휴지통 관리 모달 UI 탑재.
6. 4대 뷰 동시 전파 배선.
7. 스모크 테스트 및 verify-integrity-gate.js 실행.

### ⑥ 5대 무결성 검증 시나리오 (Verification Scenarios)
1. Zero Dead-Click: 휴지통 모달 내 원복, 삭제, 비우기 버튼 전수 클릭 검증.
2. Zero UX Regression: 기존 목표/일정/기록/소통 기능 100% 정상 작동.
3. Zero Data Loss: 휴지통 이동 -> 브라우저 새로고침 -> 휴지통에서 원복 -> 데이터 100% 동일 입증.
4. Full State Propagation: 원복 즉시 홈, 기록, 통계, 캘린더 4대 뷰 실시간 동시 반영.
5. Gatekeeper Pass: npm test 및 verify-integrity-gate.js 100% ALL PASS.

### ⑦ 체크리스트 (Checklist - 제9조 제3항 준수: 4단계 마감 상한선)
- [ ] [1단계] REQ 및 PLAN 문서 작성
- [ ] [2단계] 구글 연동 9대 결함 보정 및 휴지통 엔진 탑재 (단위 테스트 PASS)
- [ ] [3단계] localhost:8000 로컬 화면 수동 확인
- [ ] [4단계] 로컬 main 병합 및 Vercel 프리뷰 배포 (5A)

### ⑧ 블로커 대책 (Blocker Mitigations)
- 4대 뷰 전파 누락 방지를 위해 executeSave 및 saveProfile 내부에 휴지통 전파 가드 배선.
