## [블록 1] 작업 배경 및 목적 (Problem & Context)
- 티켓: #TASK-ES-334 (결심 8호 이행)
- 상민님 원문 결심 및 지시:
  - 결심 8: "삭제 보호 방식 확정 · 백업 SQL 준비 (소프트삭제 + 백업)"
  - 2026-10-01 상민님 3순위 작업 지시: "진행"
- 배경: 기존 휴지통(`moveToTrash`) 기능은 클라이언트의 `users.trash`에 7일간 사본을 보관하지만, 원격 DB(`goals`, `checkins`)에서는 `.delete()`로 원본 행을 즉시 하드 삭제(Hard Delete)하여 7일이 지나거나 100건 상한 초과 시 영구 소실되는 치명적 취약점이 존재했습니다. 이에 헌법 제15조(유저 자산 원격 원장화 및 수명주기 영속성·비파괴 합집합 보존)를 엄격히 준수하여, 삭제 시 서버 원본을 날리지 않고 `deleted_at` 타임스탬프를 부여하는 소프트 삭제로 전환하고, 복원 시 `deleted_at: null`로 되살리며, 재해 복구용 일일 백업 스냅샷 SQL DDL을 완비합니다.

## [블록 2] 주요 변경 내역 (Key Changes)
- `docs/sql/goals-checkins-softdelete.sql`: `goals` 및 `checkins` 테이블 `deleted_at TIMESTAMPTZ DEFAULT NULL` 컬럼 증설 및 조건부 인덱스 DDL 작성.
- `docs/sql/daily-backup.sql`: `goals_backup`, `checkins_backup` 스냅샷 테이블 및 `execute_daily_backup_snapshot()` 백업 함수 DDL 작성.
- `index.html`:
  - `moveToTrash`: 목표(`goals`) 및 실천기록(`checkins`) 삭제 시 `.delete()` 대신 `.update({ deleted_at: new Date().toISOString() })` 호출.
  - `restoreFromTrash`: 목표 및 실천기록 복원 시 `payload.deleted_at = null` 및 원격 `.update({ deleted_at: null })` 복원 호출 배선.
  - `syncWithSupabase`: 초기 데이터 로드 시 `deleted_at`이 존재하는(삭제된) 항목 제외 필터링 (`!g.deleted_at`, `!r.deleted_at`).
- `docs/rules/TICKETS.md`: #TASK-ES-333 완료 처리 및 #TASK-ES-334 티켓 등록.
- `docs/specs/REQ-TASK-ES-334-SOFT-DELETE-BACKUP-SQL.md`: 요구사항 정의서 (8원칙 완비).
- `docs/specs/PLAN-TASK-ES-334-SOFT-DELETE-BACKUP-SQL.md`: 엔지니어링 작업계획서 (8원칙 완비).
- `reports/TASK-ES-334/claims.json`: 법정 심사용 6대 단언문(C1~C6) 작성.

## [블록 3] 법정 판정서 (GitHub Court)
- (GitHub court 실행 후 업데이트 예정)

## [블록 4] 영향 범위 및 롤백 대책 (Impact & Rollback Plan)
- 영향 범위: 휴지통 이동(`moveToTrash`), 휴지통 복원(`restoreFromTrash`), Supabase 초기 동기화(`syncWithSupabase`).
- 롤백 대책: `git revert` 시 기존 하드 삭제 코드로 즉시 복구 가능. 기존 유저의 `users.trash` 데이터 및 로컬 데이터는 100% 무손실 보존됨.
