# [요구사항 정의서] #TASK-ES-334: 목표·체크인 소프트 삭제(deleted_at) 전환 및 복원 연동 & 일일 백업 SQL 스크립트 완비

## 1. 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  - 결심 8: "삭제 보호 방식 확정 · 백업 SQL 준비 (소프트삭제 + 백업)"
  - 2026-10-01 상민님 마인드맵 결심 안 A(소프트삭제 + 일일 백업) 승인 및 "진행"
- **현상 및 기저 층위 심층 분석**:
  - **1층 (표면적 현상)**: 앱 내에서 목표나 실천 기록을 삭제하면 7일 유예 통합 휴지통(`users.trash`)에 스냅샷 사본이 남지만, Supabase 원격 DB(`goals`, `checkins`)에서는 `sb.from('goals').delete()` 및 `sb.from('checkins').delete()`로 원본 행이 물리적으로 즉시 영구 삭제(Hard Delete)됨.
  - **2층 (구조적 취약점)**: 휴지통 보관 기간(7일)이 지나거나 100건 상한선에 도달하여 자동 정리가 실행되면, 서버 원본이 이미 삭제되어 있어 유저의 소중한 목표와 실천 기록이 복구 불가능하게 영구 소실됨. 이는 헌법 제15조(유저 자산 원격 원장화 및 수명주기 영속성·비파괴 합집합 보존)에 위배됨.
  - **3층 (백업 인프라 부재)**: 전체 데이터의 일일 스냅샷 백업 테이블 및 백업 실행 함수가 SQL 스크립트로 정리되어 있지 않아, 대규모 장애나 실수에 대비한 이중 방어선이 결여됨.
- **대상 사용자 페르소나 및 상황**:
  - 수개월간 아워골에서 꾸준히 목표를 세우고 매일 체크인 기록을 쌓아왔으나, 실수로 삭제 버튼을 눌렀거나 휴지통 7일이 경과한 뒤 소중한 기록을 되찾고자 하는 모든 진성 러너.

## 2. 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 귀속**: **FIX / INFRA (안전성 및 유저 자산 영속성 보존)**
- **체감 가설**: 삭제 시 서버 원본을 즉시 하드 삭제하지 않고 `deleted_at` 타임스탬프를 부여하는 소프트 삭제로 전환하고, 복원 시 `deleted_at: null`로 활성화하며, 일일 백업 SQL을 완비하면 유저는 데이터 영구 소실에 대한 불안 없이 100% 안전하게 자산을 보존할 수 있다.
- **[가목] 본질 (Essence) - 3대 철학 심사**:
  1. **무공해성 (Anti-Pollution)**: 유저가 정성스레 쌓아올린 실천 궤적이 어떠한 시스템 결함이나 실수로도 영구 파괴되지 않는 비파괴적 안전 공간 유지.
  2. **RPG식 체감 (Immediate Self-Efficacy)**: 실수로 지웠더라도 휴지통 또는 관리자 지원을 통해 온전히 복원 가능한 신뢰감 제공.
  3. **동류 연대 (Peer Accompaniment)**: 지속적인 기록의 연속성을 보장하여 러너의 정체성과 누적 히스토리 보존.
- **[나목] 원인 (Root Causes)**:
  1. `index.html`의 `moveToTrash` 함수 내 8435행 및 8447행에서 Supabase `.delete()`를 직접 호출하여 원본을 날림.
  2. `restoreFromTrash` 함수 내에서 로컬 배열에는 복원하지만 Supabase `goals`/`checkins` 테이블의 원격 복원 배선이 누락됨.
  3. `deleted_at` 컬럼 및 일일 백업 스냅샷을 생성하는 공식 SQL DDL 스크립트가 리포지토리에 미준비 상태였음.
- **[다목] 중심 (Core Bottleneck)**:
  - `moveToTrash()` 및 `restoreFromTrash()` 함수의 원자적 상태 변경과 Supabase `deleted_at` 업데이트 호출의 에러 방어(graceful degradation).
- **[라목] 핵심 (Critical Anchor)**:
  - 100% 무손실 보존: 기존 유저의 휴지통 UX(7일 보관, 100건 롤링, 복원 토스트)는 한 치의 오차도 없이 100% 보존하면서, 서버 측 데이터베이스 처리만 하드 삭제에서 소프트 삭제(`deleted_at`)로 완벽 승화.

## 3. 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **할 것 (DO)**:
  1. `docs/sql/goals-checkins-softdelete.sql`: `goals` 및 `checkins` 테이블에 `deleted_at TIMESTAMPTZ DEFAULT NULL` 컬럼 증설 및 조건부 인덱스 DDL 작성.
  2. `docs/sql/daily-backup.sql`: `goals_backup`, `checkins_backup` 스냅샷 테이블 및 `execute_daily_backup_snapshot()` 백업 함수 DDL 작성.
  3. `index.html` 내 `moveToTrash`:
     - `entityType === 'goal'` 시 `.delete()` 대신 `.update({ deleted_at: new Date().toISOString() })` 호출.
     - `entityType === 'record'` 시 `.delete()` 대신 `.update({ deleted_at: new Date().toISOString() })` 호출.
  4. `index.html` 내 `restoreFromTrash`:
     - 복원 항목에 대해 `payload.deleted_at = null;` 설정.
     - Supabase 원격에 `.update({ deleted_at: null })` 호출하여 원본 행 완벽 부활.
  5. `index.html` 내 초기 동기화(`syncWithSupabase`):
     - `goals` 및 `checkins` 로드 시 `deleted_at`이 존재하는(삭제된) 행은 활성 프로필 배열에 유입되지 않도록 안전 필터링 (`!row.deleted_at`).
- **하지 말 것 (DO NOT)**:
  1. 기존의 `users.trash` 기반 7일 휴지통 클라이언트 UI 및 사용자 조작 경험을 파괴하지 않는다.
  2. `deleted_at` 컬럼이 아직 DB에 반영되지 않은 환경에서도 에러로 앱이 멈추지 않도록 예외 처리를 철저히 한다 (`try { ... } catch(e) {}`).
- **스토리지 원장화 3대 명세 (Storage Blueprint)**:
  - **1호 (원격 DB 스키마 명세)**: Supabase `goals` 및 `checkins` 테이블에 `deleted_at TIMESTAMPTZ` 추가, `goals_backup` 및 `checkins_backup` 테이블 신설.
  - **2호 (스마트 스토리지 분기 설계)**: 로컬스토리지 `ourgoal_trash_backup_*`과 `users.trash` JSONB는 그대로 유지하면서 서버 원격 행의 생명주기를 영속화.
  - **3호 (4대 뷰 전파 배선도)**: 휴지통 이동 및 복원 시 `renderHome()`, `renderRecordsScreen()`, `renderStatsScreen()`, `renderCalendarScreen()` 4대 뷰 원자적 동시 전파.

## 4. 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- **오프라인 및 게스트 모드**:
  - 게스트 모드나 네트워크 오프라인 상태에서도 로컬 휴지통 및 로컬스토리지 백업이 기존과 동일하게 완벽 작동.
- **DB 스키마 지연 반영 엣지 케이스**:
  - 상민님이 Supabase SQL Editor에서 스크립트를 실행하기 전이라도, `update({ deleted_at: ... })` 호출은 `try-catch`로 감싸져 있어 기존 앱 동작에 0.001%의 장애도 유발하지 않음.
- **다시 삭제 및 재복원 엣지 케이스**:
  - 한 번 복원된 항목을 다시 삭제하거나, 여러 번 반복 삭제/복원하더라도 `deleted_at` 타임스탬프가 정확히 갱신/초기화됨.

## 5. 해결 절차 정리 (Implementation Procedure)
1. `docs/sql/goals-checkins-softdelete.sql` 및 `docs/sql/daily-backup.sql` 파일 작성.
2. `index.html` 내 `moveToTrash` 함수 수정 (하드 삭제 `.delete()` -> 소프트 삭제 `.update({ deleted_at: nowISO() })`).
3. `index.html` 내 `restoreFromTrash` 함수 수정 (원격 `.update({ deleted_at: null })` 복원 호출 배선).
4. `index.html` 내 `syncWithSupabase` 함수에서 `deleted_at` 필터링 보강.
5. 로컬 무결성 게이트(`verify-integrity-gate.js`) 및 `npm test` 전수 검증.
6. 단언문(`claims.json`) 및 PR 본문 작성 후 심사 청구.

## 6. 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점(SPOF) 검증**:
  - Supabase 네트워크 연결 끊김이나 RLS 차단 발생 시에도 로컬 `state.profile.trash` 및 `state.profile.goals`/`records`는 100% 정상 작동하며 토스트 알림이 정상 표출됨.
- **강력한 반대 논거 2가지 및 반박/수용**:
  - **반론 1**: 소프트 삭제를 적용하면 테이블에 지워진 데이터가 계속 쌓여 용량과 쿼리 성능이 저하되지 않는가?
    - **반박 및 수용**: 아워골의 유저당 목표 및 기록 규모는 수천 건 수준으로 PostgreSQL 스토리지 기준 수 메가바이트(MB)에 불과하며, 조건부 인덱스(`WHERE deleted_at IS NULL`)를 적용하므로 실서비스 조회 성능 저하는 0%에 수렴한다. 오히려 데이터 영구 소실 방지와 감사(Audit) 복원력의 가치가 압도적으로 크다.
  - **반론 2**: 일일 백업 함수(`execute_daily_backup_snapshot`)를 매일 돌리면 중복 데이터가 기하급수적으로 늘어날 수 있다.
    - **반박 및 수용**: 백업 테이블 `goals_backup`과 `checkins_backup`은 스냅샷 시점(`backed_up_at`) 단위로 저장되므로 파티셔닝 또는 30일 경과 백업 데이터 자동 정리 정책을 추후 스케줄러에 추가할 수 있어 유지관리가 용이하다.

## 7. 단계별 실행 기준 (Success Metrics & Criteria)
- **C1**: `docs/sql/goals-checkins-softdelete.sql` 파일이 존재하고 `deleted_at` DDL 및 조건부 인덱스가 정의되어 있다.
- **C2**: `docs/sql/daily-backup.sql` 파일이 존재하고 백업 스냅샷 테이블 및 `execute_daily_backup_snapshot` 함수가 정의되어 있다.
- **C3**: `index.html` 내 `moveToTrash` 함수에서 목표 삭제 시 하드 삭제 대신 `goals`의 `deleted_at`을 갱신하는 코드가 존재한다.
- **C4**: `index.html` 내 `moveToTrash` 함수에서 기록 삭제 시 하드 삭제 대신 `checkins`의 `deleted_at`을 갱신하는 코드가 존재한다.
- **C5**: `index.html` 내 `restoreFromTrash` 함수에서 목표/기록 복원 시 `deleted_at: null`을 갱신하는 코드가 존재한다.
- **C6**: `verify-integrity-gate.js` 38개 검증 및 `npm test` 440개 테스트 100% PASS.

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 기존 스모크 테스트 중 `moveToTrash` 또는 휴지통 관련 단위 테스트가 존재할 경우 파라미터나 비동기 처리 타이밍 충돌 가능성.
- **재검증 트리거**: `npm test` 실행 시 실패하는 검사가 발생하면 즉시 실패 원인을 확인하고, 원칙 4(기존 기능과의 충돌 여부)로 되돌아가 `moveToTrash`의 반환값과 동기/비동기 시그니처를 기존과 완벽히 일치시킨다.
