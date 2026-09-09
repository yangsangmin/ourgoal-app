-- 2026-09-10 체크인 5대 테마 분류 스키마 확장 (TASK-OG-001). Supabase SQL Editor에서 1회 실행.
-- 심리상태, 공부기록, 사업기록, 약속기록, 운동기록 등 테마 자동 인식 및 영속화

alter table public.checkins add column if not exists theme text;
alter table public.checkins add column if not exists sub_theme text;
alter table public.checkins add column if not exists theme_confidence numeric;
alter table public.checkins add column if not exists theme_metadata jsonb;

create index if not exists idx_checkins_user_theme on public.checkins(user_id, theme);
