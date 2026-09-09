-- 2026-09-10 커뮤니티 악성 사용자 차단 및 상호 격리 체계 (TASK-CB-004)
create table if not exists public.user_blocks (
  id bigint generated always as identity primary key,
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;

create policy user_blocks_select on public.user_blocks for select using (auth.uid() = blocker_id);
create policy user_blocks_insert on public.user_blocks for insert with check (auth.uid() = blocker_id and auth.uid() <> blocked_id);
create policy user_blocks_delete on public.user_blocks for delete using (auth.uid() = blocker_id);
