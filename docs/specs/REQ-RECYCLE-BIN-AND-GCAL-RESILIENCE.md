# [REQ] 구글 캘린더 연동 정상화 및 전역 7일 유예 통합 휴지통(Recycle Bin) 구축

**문서 ID**: REQ-RECYCLE-BIN-AND-GCAL-RESILIENCE
**작성 일자**: 2026-09-17
**귀속 축**: [E1 (체크인/목표 루프) & INFRA (데이터 보존/동기화 인프라) & FIX (연동 버그 복구)]
**헌법 준수**: 최고 헌법 제2조(2중 8원칙 및 3대 스토리지 명세), 제4조(파괴적 삭제 금지), 제10조('히트맵' 단일 표기), 제14조(E2E 무결성), 제15조(유저 자산 원격 원장화 및 4대 뷰 전파)

---

## 1. 문제해결 8원칙 1회차 적용 (요구사항 정의)

### ① 문제 정확히 파악 (Problem Definition)
1. **구글 캘린더 연동 9대 결함**:
   - One-Tap 로그인 시 accessToken 부재 상태에서 connected = true 로 가짜 연동 발생.
   - effectiveGcalClientId()의 하드코딩 앱 상수로 인해 사용자 입력 Client ID 100% 무시.
   - 스코프에 email 누락으로 유저 이메일 조회 불가 및 `(연동 완료)` 대체어 노출.
   - 구글에서 불러온 일정(imported)이 중복 제외 목록(ourEvIds)에서 빠져 달력에 2개씩 쌍둥이로 겹침.
   - 전 일정 무조건 직렬 순차 Push로 인한 수십 초 화면 프리징.
   - 구글에서 삭제된 일정에 대한 PATCH 404/410 자가치유 부재로 영구 동기화 실패.
   - 시간 지정 일정의 UTC vs KST 로컬 날짜 슬라이스 불일치로 하루 밀림 버그.
   - 일자 허브 모달 내 구글 일정 체크박스 클릭 핸들러 누락(Dead Interaction).
   - 서드파티 쿠키 차단 환경의 prompt: '' 무음 갱신 실패 시 폴백 부재.
2. **비파괴 데이터 안전망 부재 (휴지통 부재)**:
   - 목표, 일정, 기록 삭제 시 즉각 파괴적 삭제(Hard Delete)되어 실수 시 영구 유실.
   - 구글 캘린더에서 삭제된 일정이 아워골에서 감지 및 안전 유예되지 못함.
   - 실수 방지를 위한 '원복(Restore)' 및 7일 유예 기간 체계 부재.

### ② 본질·원인·핵심 파악 (Root Cause Analysis)
- 토큰 라이프사이클 및 에러 처리 결여로 인한 캘린더 연동 불완전.
- 파괴적 삭제(Hard Delete)를 금지하고 7일 유예 및 100% 원복을 보장하는 최고 헌법 제4조 제2호 및 제15조의 물리적 집행 필요.

### ③ 해결방식 결정 및 스토리지 원장화 3대 명세 (Storage Blueprint Mandate)
1. **1호 (원격 DB 스키마 명세)**:
   - Supabase `users` 테이블 내 `trash` JSONB 컬럼 승계 및 `settings` 스키마 확장.
   - DDL 경로: `docs/sql/migration_20260917_recycle_bin.sql`
2. **2호 (스마트 스토리지 3계층 분기 설계)**:
   - 1계층: Supabase `users.trash` JSONB 원격 보존.
   - 2계층: `localStorage.getItem('ourgoal_trash_backup_' + uid)` 로컬 격리 백업.
   - 3계층: `settings.trashCount` 메타데이터 분기.
3. **3호 (4대 뷰 동시 전파 배선도)**:
   - `renderHome()`, `renderRecordsScreen()`, `renderStatsScreen()`, `renderCalendar()` 동시 호출.

### ④ 1~3 재검토·보완 (Critical Reviews & Edge Cases)
1. 구글 삭제 감지: showDeleted=true 또는 Diff 비교로 구글 삭제 감지 시 아워골 휴지통 보관.
2. 구글 일정 원복 시 양방향 복구: 아워골 캘린더 복원과 동시에 구글 캘린더 API에 신규 POST 재생성.
3. 고아(Orphan) 일정 방어: 부모 목표가 영구 삭제된 후 원복 시 '일반 일정(목표 미연계)'으로 자동 격하 복원.
4. 부모 목표 번들 보관: 하위 마일스톤/태스크 통째 보존.
5. D-Day 가시화: D-7 ~ D-1 잔여 기간 표기.
6. 7일 자동 청소: Date.now() > expiresAt 만료 항목 자동 영구 삭제.

### ⑤ 절차 정리 (Step-by-Step Procedure)
1. 구글 OAuth Client ID 우선순위 보정 및 openid email profile 스코프 확장.
2. 구글 연동 토큰 검증, 이메일 표출 정상화, 타임존 로컬 일자 파싱.
3. 구글 imported 중복 제거 필터링 및 PATCH 404 자가치유 분기 신설.
4. 통합 휴지통 데이터 구조 및 백업 스토리지 엔진 구축.
5. 엔티티별 휴지통 이동(Soft Delete) 및 원복(Restore) 파이프라인 구현.
6. 7일 카운트다운 D-Day 및 자동 청소 탑재.
7. 휴지통 관리 모달 UI 및 설정 메뉴 진입로 탑재.
8. 4대 뷰 동시 전파 및 스모크 테스트 통과.

### ⑥ 절차 재검증 (Verification)
- verify-integrity-gate.js 및 smoke-test.js 전수 통과 확인.

### ⑦ 단계별 실행 기준 (Milestone Gates)
- 1단계(기획·설계) -> 2단계(내부 시뮬레이션) -> 3단계(로컬 수동 확인) -> 4단계(로컬 메인 병합 및 5A 프리뷰).

### ⑧ 막히는 지점 예상 (Potential Blockers)
- 구글 토큰 만료 시 휴지통 원복 과정의 네트워크 실패 -> 내부 복원 선행 후 재인증 가이드.
- 대용량 누적 -> 최대 100건 상한 및 7일 자동 청소.
