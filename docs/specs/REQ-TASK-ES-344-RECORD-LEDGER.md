# 요구사항 정의서 (REQ) — #TASK-ES-344 기록 원장: 지운 기록 부활 차단 + 서버 필드 보존

> **문서 ID**: REQ-TASK-ES-344-RECORD-LEDGER  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 REC-01 (데이터 손실)  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 (REC-01 빌더)  
> **기준 커밋**: origin/main c634fc2 (결함 확인은 7b082db 기준, 해당 코드 변화 없음)

## 지시 원문 (작업 지시서에서 옮김)

- (1) sync_records 조회에 deleted_at IS NULL 조건 추가. 클라이언트 전체 교체 대신 id 기준 병합(로컬에만 있는 미동기화 기록은 보존, 로컬에서 지운 기록은 되살리지 않음)으로 바꾸되, 기존 동작(서버 복원으로 빈 로컬 복구)은 유지.
- (2) 손실 필드를 서버에 보존. Supabase 스키마 변경이 필요하면 저장소 마이그레이션 관례를 따르고, 새 컬럼 추가는 비파괴(ADD COLUMN IF NOT EXISTS, 기본값 null)로 SQL 파일만 추가한다 — 실서버에 실행하지 말 것. 컬럼이 아직 없을 때도 저장이 끊기지 않게 기존 재시도 패턴 유지. 개인정보 성격의 새 칸은 추가하지 않는다. 한 jsonb 컬럼(예: meta)에 담는 방식도 검토해 더 단순한 쪽을 택하고 이유를 적어라.
- 클라이언트 복원 시 그 필드들을 다시 기록 객체로 풀어 넣는다.
- 측정: 로컬에서 재현 가능한 시험 스크립트로 ① 기록 생성→삭제→sync 복원→삭제 기록 0건 ② laps·durationMs·goalId 가 upsert payload 에 들어가고 복원 시 동일 ③ 로컬 미동기화 기록이 병합 후 보존. Supabase 는 실서버 대신 mock 을 쓰되 '부품만 돌려 봄' 수준임을 claims 에 정직하게 적는다. `npm test` 종료코드도 기록.

## 1. [원칙 ①] 문제 파악

- **지운 기록이 되살아남**: 휴지통 삭제(`moveToTrash`, index.html)는 `checkins.deleted_at` 소프트 삭제다. 그런데 `api/track.js` `handleSyncRecords` 의 checkins 조회(`sb.from('checkins').select('*').eq('user_id', targetUid)`)에 deleted_at 조건이 없고, 클라이언트 `syncServerRecords(forceRefresh)` 는 서버 건수가 많거나 `forceRefresh` 면 `state.profile.records = data.records` 로 통째 교체한다. 결과: "이전 기록 전체 불러오기"(`#recAutoRestoreBtn`)·"계정 데이터 재동기화"(`#resyncAccountDataBtn`) 한 번에 지운 기록이 돌아오고, 로컬에만 있던 미동기화 기록은 사라진다.
- **서버에 반만 저장**: `saveProfile` 의 checkins upsert 는 id/type/text/start_at/end_at/category/theme/sub_theme/theme_confidence 만 보낸다. `goalId`·`laps`·`durationMs`·`durationMinutes`·`visibility`·`isSample`·`title` 은 서버 복원(`loadProfile`·`sync_records`) 뒤 사라진다(예: `js/time-tracker.js` 시간 기록의 구간 기록·몰입 시간).
- **추가 발견**: 마지막 기록을 지우면 `saveProfile` 이 `recs.length` 0 이라 로컬 백업(`ourgoal_records_backup_<uid>`)을 갱신하지 않아, `loadProfile` 의 로컬 백업 복구가 지운 기록을 되살릴 수 있다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 사용자가 지운 것은 지운 채로, 입력한 것은 입력한 그대로 서버 원장에 남아야 한다(헌법 제7조 2항·제15조).
- **원인**: (가) 서버 조회가 삭제 표시를 무시, (나) 클라이언트가 병합이 아니라 교체, (다) 행 변환 코드가 4곳(saveProfile·loadProfile 백업 복구·sync_records 저장·sync_records 응답)에 복제돼 칸 목록이 따로 논다.
- **중심**: 행 변환·병합 규칙을 한 모듈 `js/record-ledger.js`(브라우저 `window.OurgoalRecordLedger`, 서버 `require('../js/record-ledger')`)로 모은다.
- **핵심**: `mergeServerRecords(local, server, {deletedIds, preferServer})` 와 `meta` jsonb 묶기/풀기.

## 3. [원칙 ③] 해결 방식 — 구체적 식별자

| 항목 | 식별자 |
| :-- | :-- |
| 새 모듈 | `js/record-ledger.js` — `META_FIELDS`, `buildRecordMeta`, `applyRecordMeta`, `toCheckinRow`, `fromCheckinRow`, `isLiveRow`, `upsertCheckinRows`, `mergeServerRecords`, `trashRecordIds` |
| 서버 | `api/track.js` `handleSyncRecords` — `.is('deleted_at', null)` + 칸 없을 때 폴백 조회 + `isLiveRow` 행 필터, `recordsToSave` 저장은 `toCheckinRow`+`upsertCheckinRows`, 응답은 `fromCheckinRow` |
| 클라이언트 | `index.html` `loadProfile`(meta 풀기·휴지통 기록 백업 복구 제외·백업 재업로드), `saveProfile`(meta 포함 upsert), `syncServerRecords`(id 병합) |
| 스크립트 태그 | `<script src="js/record-ledger.js?v=20261004-es344">` (time-tracker.js 다음, 본 인라인 스크립트 전) |
| 스키마 | `docs/sql/2026-10-04-checkins-meta.sql` — `alter table public.checkins add column if not exists meta jsonb default null;` |
| 시험 | `tests/record-ledger-sync.test.js` (가짜 Supabase, 부품만 돌려 봄) |

### 스키마 선택: 칸 7개 대신 jsonb `meta` 하나

- **택한 것**: `checkins.meta jsonb` 한 칸.
- **이유**: (1) SQL 한 줄·재시도 분기 하나(`/meta/` 오류면 meta 만 빼고 재시도)로 끝나 칸이 없는 DB 대비가 단순하다. 칸 7개면 칸마다 없을 수 있어 재시도 조합이 늘어난다. (2) `laps` 는 원래 배열 객체라 어차피 jsonb 다. (3) 이 칸들은 서버에서 검색·집계하지 않고 복원용으로만 쓴다. (4) 기존 관례(`theme_metadata jsonb`, 2026-09-10-checkins-theme.sql)와 같다.
- **버린 것**: 칸별 컬럼(`goal_id uuid`·`duration_ms bigint` …). 서버 집계가 필요해지면 그때 meta 에서 승격한다.

### 개인정보 판단

- meta 에 담는 7개는 사용자가 이미 앱에 입력·생성해 로컬과 서버 기록에 있던 기록의 일부(어느 목표의 기록인지, 몰입 시간, 구간, 공개 범위, 예시 여부, 제목)다. 새 종류의 개인정보(연락처·위치·식별자 등)를 새로 모으지 않으므로 수집 확대가 아니라고 판단했다. 사진(`photo`)·컨디션(`energy`) 등 META_FIELDS 밖의 칸은 이번에 서버로 보내지 않는다.

## 4. [원칙 ④] 재검토

- 서버 필터만 넣고 교체를 유지하면: 서버 소프트 삭제가 실패한 경우(오프라인 등)와 로컬 미동기화 기록 손실이 남는다 → 병합 + 휴지통 id 제외까지 한다.
- 병합만 하고 서버 필터를 빼면: 다른 기기에서 지운 기록이 이 기기로 돌아온다 → 서버 필터도 둔다(양쪽 방어).
- 칸이 없는 DB(실서버 SQL 미적용)에서 깨지지 않아야 한다 → 저장은 재시도, 조회는 폴백.

## 5. [원칙 ⑤] 절차

1. `js/record-ledger.js` 작성 → 2. `api/track.js` → 3. `index.html` 4곳 + 스크립트 태그 → 4. `docs/sql/2026-10-04-checkins-meta.sql` → 5. `tests/record-ledger-sync.test.js` → 6. `npm test` → 7. 문서·claims → 8. PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **반론 1**: "실서버에 meta·deleted_at 칸이 없으면 이번 변경이 저장·조회를 깨뜨린다." → `upsertCheckinRows` 가 오류 문구에 meta/theme/category 가 있으면 그 칸을 빼고 최대 3번 재시도하고, `sync_records` 는 deleted_at 오류면 필터 없이 다시 읽어 `isLiveRow` 로 거른다. 두 경우 모두 시험으로 돌린다.
- **반론 2**: "병합으로 바꾸면 강제 새로고침이 다른 기기의 수정을 못 가져온다." → `preferServer: forceRefresh` 로 강제 새로고침은 서버 값 우선(로컬 전용 칸·기록만 보존), 일반 동기화는 로컬 우선·빈 칸만 서버로 채운다.

## 7. [원칙 ⑦] 즉시 실행

- 위 절차대로 한 PR 에 구현한다. 실서버 SQL 실행은 하지 않는다(상민님/별도 절차).

## 8. [원칙 ⑧] 성과 측정 · 막히는 지점

- **수용 기준**: ① 기록 2건 생성 → 1건 휴지통 삭제 → `sync_records` 응답에 지운 기록 0건, 클라이언트 병합 후에도 0건. ② META_FIELDS 7개가 upsert payload 의 `meta` 에 있고 `sync_records` 복원 결과가 원본과 deepStrictEqual. ③ 로컬에만 있는 기록이 병합 뒤 남고, 로컬이 비어 있으면 서버 기록 전부로 복구. meta·deleted_at 칸이 없는 DB 에서도 저장·조회가 끊기지 않음. `npm test` 종료코드 0.
- **확인 수준**: 메모리 가짜 Supabase 로 돌린 **부품만 돌려 봄(레벨 3)**. 실서버 왕복(레벨 5)은 SQL 적용 뒤 실계정으로 따로 확인해야 한다.
- **막히는 지점**: 실서버 `checkins.id` 가 uuid 형이면 `rec_tt_…` 같은 비-uuid id 기록은 이번 변경과 무관하게 upsert 가 거부될 수 있다(미확인). 휴지통 보관 기간(7일)이 지난 뒤에는 휴지통 id 제외가 사라지므로, 서버 소프트 삭제가 실패한 기록은 그 뒤 되살아날 수 있다.
