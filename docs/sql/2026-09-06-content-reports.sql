-- 2026-09-06 커뮤니티 신고/자동 숨김 (성장 백로그 P0 5). Supabase SQL Editor에서 1회 실행.
alter table public.feed_posts    add column if not exists hidden boolean not null default false;
alter table public.team_comments add column if not exists hidden boolean not null default false;

create table if not exists public.content_reports (
  id          bigint generated always as identity primary key,
  target_type text not null check (target_type in ('feed_post','team_comment')),
  target_id   text not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null default '' check (char_length(reason) <= 200),
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, reporter_id)      -- 같은 사람의 중복 신고는 1건으로
);
alter table public.content_reports enable row level security;
-- 클라이언트 정책 없음: 신고는 아래 RPC로만 들어가고, 조회·검토는 service_role(대시보드)만.

create or replace function public.report_content(p_target_type text, p_target_id text, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_count int;
  v_ins int;              -- 이번 호출로 실제 추가된 신고 행 수(0이면 중복 신고)
  v_recent int;           -- 신고자의 최근 1시간 신고 수(남용 완화)
  v_hidden boolean := false;
  v_threshold int := 3;   -- 자동 숨김 임계치(사람 검토 전 최소 안전망)
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  -- for update: 같은 대상의 동시 신고를 직렬화해 임계치 판정이 어긋나지 않게 한다
  if p_target_type = 'feed_post' then
    select user_id into v_owner from feed_posts where id = p_target_id for update;
  elsif p_target_type = 'team_comment' then
    select user_id into v_owner from team_comments where id = p_target_id for update;
  else
    raise exception 'bad target type';
  end if;
  if v_owner is null then raise exception 'target not found'; end if;
  if v_owner = v_uid then raise exception 'cannot report own content'; end if;

  -- 남용 완화: 한 계정이 1시간에 20건 넘게 신고하면 거부
  select count(*) into v_recent from content_reports
    where reporter_id = v_uid and created_at > now() - interval '1 hour';
  if v_recent >= 20 then raise exception 'too many reports'; end if;

  insert into content_reports(target_type, target_id, reporter_id, reason)
    values (p_target_type, p_target_id, v_uid, left(coalesce(p_reason, ''), 200))
    on conflict (target_type, target_id, reporter_id) do nothing;
  get diagnostics v_ins = row_count;

  select count(*) into v_count from content_reports
    where target_type = p_target_type and target_id = p_target_id;

  -- 새 신고가 아니면(같은 사람의 재신고) 임계치를 다시 평가하지 않는다 → 관리자가 hidden=false로 되돌린 뒤 재숨김되지 않음
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
$$;
-- Postgres는 새 함수에 PUBLIC EXECUTE를 기본 부여하므로 먼저 회수한 뒤 authenticated에만 허용
revoke execute on function public.report_content(text, text, text) from public, anon;
grant execute on function public.report_content(text, text, text) to authenticated;

-- 검토 후 되돌리기(관리자, SQL Editor): hidden을 풀 때는 해당 신고 행도 함께 지워야 재신고 시 즉시 다시 숨겨지지 않는다
-- update public.feed_posts set hidden = false where id = '<post id>';
-- delete from public.content_reports where target_type = 'feed_post' and target_id = '<post id>';
