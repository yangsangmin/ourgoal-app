-- 2026-09-08 숨김 처리된 게시물·댓글의 REST 노출 차단 (실행계획 순서 36)
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
--
-- 왜 필요한가
--   PR #52 가 신고/자동 숨김을 구현했지만 서버 쪽 스키마가 한 번도 적용되지 않았다
--   (2026-09-08 실측: hidden 컬럼 없음, content_reports 테이블 없음, report_content RPC 404).
--   그래서 지금 신고 버튼은 실패 토스트만 띄우고 아무것도 숨기지 못한다.
--
--   그리고 숨김이 동작하더라도 그것만으로는 부족하다. 클라이언트의 filterHidden() 은
--   화면에서만 걸러낼 뿐이라, REST 를 직접 부르면 숨긴 글이 그대로 읽힌다.
--   숨김은 '보기 싫은 것을 가리는 기능'이 아니라 '신고 누적으로 차단된 것'이므로
--   차단은 반드시 서버(RLS)에서 이뤄져야 한다.
--
-- [1] 은 docs/sql/2026-09-06-content-reports.sql 과 같은 내용이다(미실행분).
-- [2] 가 순서 36 에서 새로 추가하는 부분이다.

-- ============================================================
-- [1] 신고 / 자동 숨김 스키마 (2026-09-06 작성, 미실행)
-- ============================================================

alter table public.feed_posts    add column if not exists hidden boolean not null default false;
alter table public.team_comments add column if not exists hidden boolean not null default false;

create table if not exists public.content_reports (
  id          bigint generated always as identity primary key,
  target_type text not null check (target_type in ('feed_post','team_comment')),
  target_id   text not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null default '' check (char_length(reason) <= 200),
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, reporter_id)
);
alter table public.content_reports enable row level security;

create or replace function public.report_content(p_target_type text, p_target_id text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_count int;
  v_ins int;
  v_recent int;
  v_hidden boolean := false;
  v_threshold int := 3;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type = 'feed_post' then
    select user_id into v_owner from feed_posts where id = p_target_id for update;
  elsif p_target_type = 'team_comment' then
    select user_id into v_owner from team_comments where id = p_target_id for update;
  else
    raise exception 'bad target type';
  end if;
  if v_owner is null then raise exception 'target not found'; end if;
  if v_owner = v_uid then raise exception 'cannot report own content'; end if;

  select count(*) into v_recent from content_reports
    where reporter_id = v_uid and created_at > now() - interval '1 hour';
  if v_recent >= 20 then raise exception 'too many reports'; end if;

  insert into content_reports(target_type, target_id, reporter_id, reason)
    values (p_target_type, p_target_id, v_uid, left(coalesce(p_reason, ''), 200))
    on conflict (target_type, target_id, reporter_id) do nothing;
  get diagnostics v_ins = row_count;

  select count(*) into v_count from content_reports
    where target_type = p_target_type and target_id = p_target_id;

  if v_ins = 0 then
    return jsonb_build_object('count', v_count, 'hidden', false);
  end if;

  if v_count >= v_threshold then
    if p_target_type = 'feed_post' then
      update feed_posts set hidden = true where id = p_target_id;
    else
      update team_comments set hidden = true where id = p_target_id;
    end if;
    v_hidden := true;
  end if;
  return jsonb_build_object('count', v_count, 'hidden', v_hidden);
end;
$fn$;

revoke execute on function public.report_content(text, text, text) from public;
revoke execute on function public.report_content(text, text, text) from anon;
grant  execute on function public.report_content(text, text, text) to authenticated;

-- ============================================================
-- [2] 순서 36 — 숨긴 행을 REST select 에서 제외
-- ============================================================
--
-- 정책은 그 행 자신의 컬럼과 auth.uid() 만 참조한다.
-- 다른 테이블을 조회하는 정책을 쓰면 Realtime 이 변경 이벤트마다 그 조회를 수행해야 해서
-- 구독이 느려지거나 끊긴다. 여기서는 hidden 과 user_id 만 보므로 Realtime 이 그대로 동작한다.
--
-- 글쓴이 본인에게는 계속 보인다. 자기 글이 조용히 사라지면 신고당한 사실조차 알 수 없다.

drop policy if exists "feed_posts_select_all" on public.feed_posts;
drop policy if exists "feed_posts_select_visible" on public.feed_posts;
create policy "feed_posts_select_visible" on public.feed_posts
  for select using (
    auth.role() = 'authenticated'
    and (hidden is not true or auth.uid() = user_id)
  );

drop policy if exists "team_comments_select_all" on public.team_comments;
drop policy if exists "team_comments_select_visible" on public.team_comments;
create policy "team_comments_select_visible" on public.team_comments
  for select using (
    auth.role() = 'authenticated'
    and (hidden is not true or auth.uid() = user_id)
  );

-- ============================================================
-- [확인] 아래 4줄이 나오면 성공
-- ============================================================
select 'feed_posts.hidden 컬럼'    as 확인, count(*) as 수 from information_schema.columns
  where table_schema='public' and table_name='feed_posts' and column_name='hidden'
union all
select 'team_comments.hidden 컬럼', count(*) from information_schema.columns
  where table_schema='public' and table_name='team_comments' and column_name='hidden'
union all
select 'content_reports 테이블', count(*) from information_schema.tables
  where table_schema='public' and table_name='content_reports'
union all
select 'select 정책(hidden 제외)', count(*) from pg_policies
  where schemaname='public' and policyname in ('feed_posts_select_visible','team_comments_select_visible');
