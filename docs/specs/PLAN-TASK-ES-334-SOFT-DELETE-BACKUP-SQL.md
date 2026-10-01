# [엔지니어링 작업계획서] #TASK-ES-334: 목표·체크인 소프트 삭제(deleted_at) 전환 및 복원 연동 & 일일 백업 SQL 스크립트 완비

## 1. 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**:
  - 목표 및 실천기록 삭제 시 서버 원본을 즉시 하드 삭제(`.delete()`)하던 로직을 `deleted_at: nowISO()` 소프트 삭제(`.update()`)로 전환.
  - 휴지통 복원(`restoreFromTrash`) 시 서버 원본의 `deleted_at: null` 복원 호출 연동.
  - `docs/sql/goals-checkins-softdelete.sql`: `goals` 및 `checkins` 테이블의 `deleted_at` 컬럼 증설 및 조건부 인덱스 DDL 작성.
  - `docs/sql/daily-backup.sql`: 일일 백업 스냅샷 테이블 및 `execute_daily_backup_snapshot()` 백업 함수 DDL 작성.
- **영향받는 파일 전수 목록**:
  1. `docs/rules/TICKETS.md`: #TASK-ES-334 티켓 등록 (수정 완료)
  2. `docs/specs/REQ-TASK-ES-334-SOFT-DELETE-BACKUP-SQL.md`: 요구사항 정의서 (작성 완료)
  3. `docs/specs/PLAN-TASK-ES-334-SOFT-DELETE-BACKUP-SQL.md`: 엔지니어링 작업계획서 (본 문서)
  4. `docs/sql/goals-checkins-softdelete.sql`: 소프트삭제 DDL (작성 완료)
  5. `docs/sql/daily-backup.sql`: 일일 백업 DDL (작성 완료)
  6. `reports/TASK-ES-334/claims.json`: 법정 심사용 주장 파일
  7. `reports/TASK-ES-334/pr-body.md`: 초안 PR 설명문
  8. `index.html`:
     - `moveToTrash` 함수 (8407행 부근): `goals` 및 `checkins`에 대해 `.delete()` 대신 `.update({ deleted_at: new Date().toISOString() })` 호출.
     - `restoreFromTrash` 함수 (8468행 부근): 복원 시 `payload.deleted_at = null` 및 원격 `.update({ deleted_at: null })` 호출 배선.
     - `syncWithSupabase` 함수 (3190행 부근): 초기 로드 시 `deleted_at`이 존재하는(삭제된) 항목 제외 필터링.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **FIX / INFRA (유저 자산 영속성 보존)** — 헌법 제15조(비파괴 합집합 보존)에 따라 사용자의 소중한 실천 궤적이 어떠한 경우에도 서버에서 영구 파괴되지 않는 비파괴적 안전 아키텍처 수립.
- **[원인] (Technical Causes)**:
  - `moveToTrash` 함수 내 8435행 및 8447행에서 `sb.from('goals').delete()` 및 `sb.from('checkins').delete()`를 직접 호출하여 원격 DB 원본을 즉시 날림.
  - `restoreFromTrash` 시 클라이언트 로컬 배열에는 복원하지만 원격 DB에 복원 플래그를 갱신하는 배선이 부재했음.
- **[중심] (Core Wire & State)**:
  - `moveToTrash(entityType, entityId, payload, source, title)`:
    - `entityType === 'goal'` -> `sb.from('goals').update({ deleted_at: nowISO() }).eq('id', entityId)`
    - `entityType === 'record'` -> `sb.from('checkins').update({ deleted_at: nowISO() }).eq('id', entityId)`
  - `restoreFromTrash(trashId)`:
    - `item.entityType === 'goal'` -> `sb.from('goals').update({ deleted_at: null }).eq('id', payload.id)`
    - `item.entityType === 'record'` -> `sb.from('checkins').update({ deleted_at: null }).eq('id', payload.id)`
- **[핵심] (Critical Safety & Persistence)**:
  - 기존 7일 유예 휴지통(`users.trash` 및 `ourgoal_trash_backup_*`) 클라이언트 UX 100% 무손실 보존.
  - DB에 `deleted_at` 컬럼이 아직 미적용된 구형 스키마에서도 예외가 잡혀(`try-catch`) 클라이언트 앱이 절대 멈추지 않는 점진적 자가 치유(Graceful Degradation) 안전핀 구축.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [유저 항목 삭제 클릭]
        │
        ▼
  moveToTrash(entityType, entityId, ...)
        │
        ├─► state.profile.trash.unshift(trashItem)
        │
        ├─► (서버 소프트 삭제 배선)
        │     sb.from('goals'/'checkins').update({ deleted_at: nowISO() })
        │
        ├─► saveProfile() -> localStorage 백업
        │
        └─► 4대 뷰 원자적 전파 (renderHome, renderRecords, renderStats, renderCalendar)
  
  [휴지통 복원 클릭]
        │
        ▼
  restoreFromTrash(trashId)
        │
        ├─► payload.deleted_at = null
        │
        ├─► state.profile.goals.push(payload) / records.unshift(payload)
        │
        ├─► (서버 원본 복원 배선)
        │     sb.from('goals'/'checkins').update({ deleted_at: null })
        │
        ├─► saveProfile() -> localStorage 백업
        │
        └─► 4대 뷰 원자적 전파
  ```

## 3. 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `index.html`: 추가 약 25줄, 변경 약 10줄 (총 diff 35줄 이내)
  - `docs/sql/goals-checkins-softdelete.sql`: 신규 생성 (약 25줄)
  - `docs/sql/daily-backup.sql`: 신규 생성 (약 65줄)
  - `docs/specs/*`: 신규 생성 2개 파일
  - `reports/TASK-ES-334/*`: 신규 생성 2개 파일
- **4위 1체 배선 명세**:
  - **HTML/UI**: 기존 휴지통 모달 `#trashModal` 및 토스트 되돌리기 완벽 연동.
  - **리스너**: 복원 버튼 및 토스트 복원 클릭 시 `restoreFromTrash` 직통 배선.
  - **상태 관리**: `state.profile.trash` 및 `state.profile.goals`/`records` 로컬 백업.
  - **원격 동기화**: Supabase `goals`/`checkins` 테이블의 `deleted_at` 원자적 갱신.

## 4. 기존 코드와의 조화 및 리팩터링 안전핀 (Integration & Safety)
- `moveToTrash`와 `restoreFromTrash`의 시그니처 및 반환값은 100% 동일하게 유지.
- `syncWithSupabase`에서 `deleted_at`이 존재하는 행은 활성 배열에서 제외하여, 서버에서 소프트 삭제된 행이 앱 재실행 시 다시 부활하는 유령 현상 방지.

## 5. 단계별 구현 절차 (Implementation Steps)
1. `docs/sql/goals-checkins-softdelete.sql` 및 `docs/sql/daily-backup.sql` 파일 완비.
2. `index.html` 내 `moveToTrash` 함수에서 `sb.from('goals').delete()` -> `sb.from('goals').update({ deleted_at: new Date().toISOString() })`로 변경.
3. `index.html` 내 `moveToTrash` 함수에서 `sb.from('checkins').delete()` -> `sb.from('checkins').update({ deleted_at: new Date().toISOString() })`로 변경.
4. `index.html` 내 `restoreFromTrash` 함수에서 목표 및 기록 복원 시 `deleted_at: null` 원격 업데이트 추가.
5. `index.html` 내 `syncWithSupabase` 함수에서 `deleted_at` 필터링 (`!g.deleted_at`, `!r.deleted_at`) 보강.
6. `verify-integrity-gate.js` 및 `npm test` 무결성 검증.
7. `reports/TASK-ES-334/claims.json` 및 `pr-body.md` 작성.

## 6. 절차 재검증: 법정 주장(claims) 설계 (Claims Design & Anti-SPOF)
- **법정 심사용 정적 단언문 설계 (claims.json)**:
  - **C1**: `docs/sql/goals-checkins-softdelete.sql`에 `deleted_at` 컬럼 및 인덱스 DDL 포함.
  - **C2**: `docs/sql/daily-backup.sql`에 백업 스냅샷 테이블 및 백업 함수 DDL 포함.
  - **C3**: `index.html` 내 `moveToTrash` 함수에 목표 소프트 삭제(`.update({ deleted_at:`) 배선 포함.
  - **C4**: `index.html` 내 `moveToTrash` 함수에 기록 소프트 삭제(`.update({ deleted_at:`) 배선 포함.
  - **C5**: `index.html` 내 `restoreFromTrash` 함수에 복원 시 `deleted_at: null` 배선 포함.
- **Anti-SPOF 재검증**:
  - Supabase 네트워크 실패나 스키마 불일치 시 `try-catch`로 방어되어 클라이언트 휴지통 및 로컬 저장은 100% 무중단 정상 작동.

## 7. 단계별 실행 체크리스트 (Execution Checklist)
- [ ] 1. `docs/rules/TICKETS.md` 티켓 등록 (완료)
- [ ] 2. `docs/specs/REQ-TASK-ES-334-SOFT-DELETE-BACKUP-SQL.md` 작성 (완료)
- [ ] 3. `docs/specs/PLAN-TASK-ES-334-SOFT-DELETE-BACKUP-SQL.md` 작성 (완료)
- [ ] 4. `docs/sql/goals-checkins-softdelete.sql` 및 `docs/sql/daily-backup.sql` 완비 (완료)
- [ ] 5. `index.html` 내 `moveToTrash` 및 `restoreFromTrash` 소프트 삭제 배선
- [ ] 6. `reports/TASK-ES-334/claims.json` 및 `pr-body.md` 작성
- [ ] 7. 무결성 게이트 및 테스트 통과 후 심사 청구

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: `moveToTrash` 또는 휴지통 관련 기존 스모크 테스트가 있을 경우 함수 파라미터나 동작 변경으로 인한 테스트 실패.
- **재검증 트리거**: `npm test` 실패 시 즉시 원칙 4(기존 기능과의 충돌 여부)로 되돌아가 `moveToTrash` 반환값 및 동기/비동기 시그니처 정합성 유지.
