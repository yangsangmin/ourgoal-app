-- 2026-10-04 기록(checkins) 부가 필드 보존 칸 추가 (TASK-ES-344, 노션 티켓 REC-01). Supabase SQL Editor에서 1회 실행.
-- 비파괴: 칸 추가만 한다. 기존 행은 meta = null 로 남고, 앱은 칸이 없어도 meta 를 빼고 재시도해 저장이 끊기지 않는다.
-- meta 에 담는 것(사용자가 이미 입력한 기록의 일부): goalId, laps, durationMs, durationMinutes, visibility, isSample, title

alter table public.checkins add column if not exists meta jsonb default null;

comment on column public.checkins.meta is '기록 부가 필드(goalId·laps·durationMs·durationMinutes·visibility·isSample·title). 앱 js/record-ledger.js 가 묶고 푼다';

-- 선행 확인: 지운 기록 필터(sync_records 의 deleted_at is null)는 docs/sql/goals-checkins-softdelete.sql 의 checkins.deleted_at 이 있어야 서버에서 걸린다.
-- 칸이 없으면 서버는 필터 없이 읽고 행 단위로 거른다(동작은 같다).
