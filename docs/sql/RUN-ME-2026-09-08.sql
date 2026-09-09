-- ============================================================
--  아워골 — 아직 실행 안 된 Supabase SQL 두 건을 하나로 묶음
--  2026-09-08 준비. Supabase 콘솔 > SQL Editor 에 전체 붙여넣고 Run 한 번.
--
--  왜 필요한가: 코드는 이미 프로덕션에 배포돼 있는데(2026-09-07 확인)
--  이 SQL이 없어서 아래 세 기능이 화면에만 있고 실제로 동작하지 않는다.
--    - 응원 카운트(다른 사람 글에 응원)          → increment_post_cheers 없음
--    - 팀 목표/마일스톤 댓글                     → team_comments 테이블 없음
--    - 체크인 분야(category) 저장·복원           → checkins.category 컬럼 없음
--
--  전부 if not exists / or replace 라서 여러 번 돌려도 안전하다.
--  실행 후 아워골 진행률이 70% -> 78% 로 올라간다(미검증 4건 중 3건 해소).
-- ============================================================


-- ────────────────────────────────────────────────
-- [1] TASK-04 — 팀 댓글 · 소통 피드 (PR #41)
-- ────────────────────────────────────────────────

-- 1) team_comments: 팀 목표/마일스톤 댓글
create table if not exists team_comments (
  id text primary key,
  group_id text not null,
  user_id uuid not null references auth.users(id),
  display_name text not null,
  target_id text not null,
  text text not null,
  created_at timestamptz not null default now()
);
alter table team_comments enable row level security;

drop policy if exists "team_comments_select_all" on team_comments;
create policy "team_comments_select_all" on team_comments
  for select using (auth.role() = 'authenticated');

drop policy if exists "team_comments_insert_own" on team_comments;
create policy "team_comments_insert_own" on team_comments
  for insert with check (auth.uid() = user_id);


-- 2) feed_posts: 소통 피드 게시물
create table if not exists feed_posts (
  id text primary key,
  user_id uuid not null references auth.users(id),
  display_name text not null,
  avatar_url text,
  goal_title text,
  caption text not null,
  cheers_count int not null default 0,
  extra jsonb,
  created_at timestamptz not null default now()
);
alter table feed_posts enable row level security;

drop policy if exists "feed_posts_select_all" on feed_posts;
create policy "feed_posts_select_all" on feed_posts
  for select using (auth.role() = 'authenticated');

drop policy if exists "feed_posts_insert_own" on feed_posts;
create policy "feed_posts_insert_own" on feed_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "feed_posts_delete_own" on feed_posts;
create policy "feed_posts_delete_own" on feed_posts
  for delete using (auth.uid() = user_id);


-- 3) 응원 수 원자적 증감 RPC
--    다른 사람 글의 cheers_count 만 안전하게 바꾸기 위해 security definer 로 둔다.
create or replace function increment_post_cheers(p_post_id text, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update feed_posts set cheers_count = greatest(0, cheers_count + p_delta)
  where id = p_post_id
  returning cheers_count into new_count;
  return new_count;
end;
$$;
grant execute on function increment_post_cheers(text, int) to authenticated;


-- 4) Realtime 활성화 (Database > Replication 토글과 같은 효과)
--    이미 추가돼 있으면 오류가 나므로 감싼다.
do $$
begin
  begin
    alter publication supabase_realtime add table team_comments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table feed_posts;
  exception when duplicate_object then null;
  end;
end $$;


-- ────────────────────────────────────────────────
-- [2] AUD-5 — 체크인 분야(category) 영속화
-- ────────────────────────────────────────────────
-- 기록 카드에서 고른 분야가 클라이언트 메모리에만 있어서
-- 새로고침·다른 기기에서 사라지고 분야별 리포트·CSV가 부정확했다.

alter table public.checkins add column if not exists category text;


-- ────────────────────────────────────────────────
-- [확인] 아래 세 줄의 결과가 나오면 성공
-- ────────────────────────────────────────────────
select 'team_comments' as 확인, count(*) as 행수 from team_comments
union all
select 'feed_posts', count(*) from feed_posts
union all
select 'checkins.category 컬럼', count(*) from information_schema.columns
  where table_schema = 'public' and table_name = 'checkins' and column_name = 'category';
