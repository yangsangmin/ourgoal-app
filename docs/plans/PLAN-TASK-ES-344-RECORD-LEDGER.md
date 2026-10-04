# 작업계획서 (PLAN) — #TASK-ES-344 기록 원장: 지운 기록 부활 차단 + 서버 필드 보존

> **문서 ID**: PLAN-TASK-ES-344-RECORD-LEDGER  
> **요구사항 연계**: [REQ-TASK-ES-344-RECORD-LEDGER](../specs/REQ-TASK-ES-344-RECORD-LEDGER.md)  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 REC-01  
> **작성 일시**: 2026-10-04  

## 1. 변경 범위

| 파일 | 변경 |
| :-- | :-- |
| `js/record-ledger.js` | 신규 공용 모듈(800줄 상한 이내) |
| `api/track.js` | `handleSyncRecords` 조회 필터·저장·응답 변환을 모듈로 |
| `index.html` | 스크립트 태그 1줄, `loadProfile`·`saveProfile`·`syncServerRecords` |
| `docs/sql/2026-10-04-checkins-meta.sql` | 신규(비파괴 ADD COLUMN, 실서버 미실행) |
| `tests/record-ledger-sync.test.js` | 신규 시험 |
| `docs/specs/REQ-…`, `docs/plans/PLAN-…`, `reports/TASK-ES-344/claims.json`, `docs/rules/TICKETS.md`, `dev_log.md` | 문서 |

손대지 않는 것: `court/**`, `AGENTS.md`, `CLAUDE.md`, `.github/workflows/**`, `scripts/essence-gate.js`, `scripts/verify-integrity-gate.js`, `package.json` scripts, `vercel.json`.

## 2. 문제해결 8원칙 체크리스트

- [x] 1. 목표 정의: 지운 기록은 어떤 복원 경로로도 돌아오지 않고, 기록 필드 7개(`goalId`·`laps`·`durationMs`·`durationMinutes`·`visibility`·`isSample`·`title`)가 서버 왕복 뒤 그대로 남는다.
- [x] 2. 현상 분석: `api/track.js` checkins 조회에 deleted_at 조건 없음, `syncServerRecords` 가 `state.profile.records = data.records` 로 교체, `saveProfile` upsert 칸 9개뿐, `loadProfile` 백업 복구가 휴지통 기록을 모름.
- [x] 3. 원인 추정: 행 변환 코드가 4곳에 복제되어 칸 목록이 어긋나고, 병합 규칙이 없어 "건수 비교 후 교체"로 대신하고 있었다.
- [x] 4. 대안 탐색: (A) 칸 7개 추가 — 재시도 조합 증가·SQL 7줄. (B) jsonb `meta` 1칸 — 채택(REQ 3절). 병합: (A) 서버 우선 교체 유지 + 삭제 필터만 — 미동기화 기록 손실 남음. (B) id 병합 + 휴지통 id 제외 — 채택.
- [x] 5. 실행 계획: 모듈 작성 → 서버 → 클라이언트 4곳 → SQL → 시험 → npm test → 문서 → PR.
- [x] 6. 절차 재검증 및 반론 격파:
  - 반론 1 "실서버에 meta·deleted_at 칸이 없으면 이번 변경이 오히려 저장/조회를 깨뜨린다" → `upsertCheckinRows` 가 오류 문구에 meta/theme/category 가 있으면 그 칸을 빼고 최대 3번 재시도하고, `sync_records` 는 deleted_at 오류면 필터 없이 다시 읽어 행 단위로 거른다. 두 경우 모두 시험(② 보강·① 보강)으로 돌렸다.
  - 반론 2 "병합으로 바꾸면 강제 새로고침이 다른 기기의 수정을 못 가져온다" → `preferServer: forceRefresh` 로 강제 새로고침 때는 서버 값이 우선하고, 로컬에만 있는 칸·기록만 지킨다. 일반 동기화는 로컬 우선·빈 칸만 서버로 채운다.
- [x] 7. 즉시 실행: 위 순서대로 구현, 시험 9건 실행.
- [x] 8. 성과 측정: 시험 9/9(기준 커밋의 `api/track.js` 로 돌리면 5/9 — 지운 기록 1건 부활, meta 7칸 중 7칸 불일치), `npm test` 종료코드 0.

## 3. 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 구현]
- [x] [4단계: 심사 청구]

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
