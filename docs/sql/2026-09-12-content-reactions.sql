-- ============================================================
-- 아워골 — 컨텐츠 반응 4종(응원해요·도움돼요·별로에요·조언해요) 서버 저장
-- 2026-09-12 준비. (KF-7, #TASK-ES-014, 본질 ③ 동류 발견·소통)
--
-- 왜 필요한가: 지금 피드 반응은 이모지 4종을 기기(localStorage)에만 저장하고
-- 서버에는 feed_posts.cheers_count 하나만 남는다. 반응에 "의미"와 "텍스트"
-- (별로에요 이유·조언 팁)를 붙여 서버에 남겨야 KF-4(상단 노출)·KF-5(이유 크레딧)·
-- KF-6(활용 계획)이 성립한다. 삭제는 전부 소프트 삭제(deleted_at)다.
--
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 전부 if not exists / or replace
-- 구문이라 여러 번 실행해도 안전하다. 봇·시뮬 글(sim_ 접두)에는 반응을 받지 않는다.
-- ============================================================

-- 1) 반응 테이블 (한 사람이 한 글에 같은 종류 반응은 1회)
create table if not exists public.content_reactions (
  id                bigint generated always as identity primary key,
  target_type       text not null default 'feed_post' check (target_type in ('feed_post','checkin','goal_template')),
  target_id         text not null,
  user_id           uuid not null references auth.users(id) on delete cascade,
  reactor_name      text null check (reactor_name is null or char_length(reactor_name) <= 60),
  type              text not null check (type in ('cheer','helpful','poor','advice')),
  reason_tag        text null check (reason_tag is null or reason_tag in ('ai_suspect','wrong_info','ad','off_topic','other')),
  reason_text       text null check (reason_text is null or char_length(reason_text) <= 300),
  advice_text       text null check (advice_text is null or char_length(advice_text) <= 600),
  advice_visibility text null check (advice_visibility is null or advice_visibility in ('author_only','everyone')),
  hidden_by_owner   boolean not null default false,
  deleted_at        timestamptz null,
  deleted_by        text null check (deleted_by is null or deleted_by in ('author','reactor','system')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, target_type, target_id, type),
  -- 별로에요는 이유 필수, 조언해요는 팁+공개범위 필수, 나머지는 텍스트 없음
  constraint content_reactions_shape check (
    (type = 'poor'   and reason_tag is not null and advice_text is null and advice_visibility is null) or
    (type = 'advice' and advice_text is not null and advice_visibility is not null and reason_tag is null) or
    (type in ('cheer','helpful') and reason_tag is null and reason_text is null and advice_text is null and advice_visibility is null)
  )
);

create index if not exists idx_content_reactions_target on public.content_reactions(target_type, target_id) where deleted_at is null;
create index if not exists idx_content_reactions_user   on public.content_reactions(user_id) where deleted_at is null;

alter table public.content_reactions enable row level security;

-- RLS: 직접 읽기는 본인 행만. 집계·조언 열람·쓰기는 전부 아래 SECURITY DEFINER RPC 로만 한다.
drop policy if exists content_reactions_select_own on public.content_reactions;
create policy content_reactions_select_own on public.content_reactions
  for select using (auth.uid() = user_id);

-- 2) 봇·시뮬 글 판별: 클라이언트 시뮬 글은 id 가 sim_ 로 시작한다 → 아래 RPC 들이 전부 거부·제외한다.

-- 3) 반응 등록/갱신 (같은 종류가 이미 있으면 되살리고 텍스트를 갱신한다)
create or replace function public.react_content(
  p_target_type text, p_target_id text, p_type text,
  p_reason_tag text default null, p_reason_text text default null,
  p_advice_text text default null, p_advice_visibility text default null,
  p_reactor_name text default null
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_id bigint;
  v_was_active boolean := false;
  v_bot boolean := false;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type is null or p_target_id is null or trim(p_target_id) = '' then raise exception 'bad target'; end if;
  if p_type not in ('cheer','helpful','poor','advice') then raise exception 'bad type'; end if;
  if p_target_id like 'sim\_%' escape '\' then raise exception 'bot target'; end if;
  if p_type = 'poor' and (p_reason_tag is null or p_reason_tag = '') then raise exception 'reason required'; end if;
  if p_type = 'advice' and (p_advice_text is null or trim(p_advice_text) = '') then raise exception 'advice required'; end if;
  if p_type = 'advice' and coalesce(p_advice_visibility,'') not in ('author_only','everyone') then raise exception 'visibility required'; end if;

  select coalesce(u.is_bot, false) into v_bot from public.users u where u.id = v_uid;
  if v_bot then raise exception 'bot reactor'; end if;

  if p_target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = p_target_id;
    if v_owner is not null and v_owner = v_uid and p_type in ('helpful','poor') then
      raise exception 'cannot rate own content';
    end if;
  end if;

  select id, (deleted_at is null) into v_id, v_was_active
    from public.content_reactions
   where user_id = v_uid and target_type = p_target_type and target_id = p_target_id and type = p_type;

  if v_id is null then
    insert into public.content_reactions
      (target_type, target_id, user_id, reactor_name, type, reason_tag, reason_text, advice_text, advice_visibility)
    values
      (p_target_type, p_target_id, v_uid, left(p_reactor_name, 60), p_type,
       case when p_type = 'poor' then p_reason_tag else null end,
       case when p_type = 'poor' then left(p_reason_text, 300) else null end,
       case when p_type = 'advice' then left(p_advice_text, 600) else null end,
       case when p_type = 'advice' then p_advice_visibility else null end)
    returning id into v_id;
  else
    update public.content_reactions
       set deleted_at = null, deleted_by = null, hidden_by_owner = false, updated_at = now(),
           reactor_name = coalesce(left(p_reactor_name, 60), reactor_name),
           reason_tag = case when p_type = 'poor' then p_reason_tag else null end,
           reason_text = case when p_type = 'poor' then left(p_reason_text, 300) else null end,
           advice_text = case when p_type = 'advice' then left(p_advice_text, 600) else advice_text end,
           advice_visibility = case when p_type = 'advice' then p_advice_visibility else advice_visibility end
     where id = v_id;
  end if;

  -- 응원해요는 기존 feed_posts.cheers_count 와 호환(새로 활성화될 때만 +1)
  if p_type = 'cheer' and p_target_type = 'feed_post' and not coalesce(v_was_active, false) then
    update public.feed_posts set cheers_count = coalesce(cheers_count, 0) + 1 where id = p_target_id;
  end if;

  return jsonb_build_object('id', v_id, 'active', true);
end;
$fn$;

-- 4) 반응 취소 (본인 행 소프트 삭제)
create or replace function public.unreact_content(p_target_type text, p_target_id text, p_type text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_n int;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  update public.content_reactions
     set deleted_at = now(), deleted_by = 'reactor', updated_at = now()
   where user_id = v_uid and target_type = p_target_type and target_id = p_target_id and type = p_type
     and deleted_at is null;
  get diagnostics v_n = row_count;
  if v_n > 0 and p_type = 'cheer' and p_target_type = 'feed_post' then
    update public.feed_posts set cheers_count = greatest(0, coalesce(cheers_count, 0) - 1) where id = p_target_id;
  end if;
  return jsonb_build_object('active', false, 'changed', v_n);
end;
$fn$;

-- 5) 조언 관리: 원작자는 공개범위 변경·삭제, 조언자는 삭제만
create or replace function public.moderate_advice(p_reaction_id bigint, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  r record;
  v_owner uuid;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  select * into r from public.content_reactions where id = p_reaction_id and type = 'advice';
  if r.id is null then raise exception 'not found'; end if;
  if r.target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = r.target_id;
  end if;

  if p_action = 'delete' then
    if v_uid = r.user_id then
      update public.content_reactions set deleted_at = now(), deleted_by = 'reactor', updated_at = now() where id = r.id;
    elsif v_owner is not null and v_uid = v_owner then
      update public.content_reactions set deleted_at = now(), deleted_by = 'author', updated_at = now() where id = r.id;
    else
      raise exception 'forbidden';
    end if;
  elsif p_action in ('everyone','author_only') then
    if v_owner is null or v_uid <> v_owner then raise exception 'only author can change visibility'; end if;
    update public.content_reactions set advice_visibility = p_action, updated_at = now() where id = r.id;
  else
    raise exception 'bad action';
  end if;
  return jsonb_build_object('ok', true);
end;
$fn$;

-- 6) 종류별 집계 (봇 반응·삭제 행 제외, 시뮬 글 제외). 값이 0인 조합은 반환하지 않는다.
create or replace function public.count_content_reactions(p_target_ids text[])
returns table(target_id text, type text, cnt int)
language sql stable security definer set search_path = public as $fn$
  select r.target_id, r.type, count(*)::int
    from public.content_reactions r
    left join public.users u on u.id = r.user_id
   where r.target_id = any(p_target_ids)
     and r.deleted_at is null
     and r.target_id not like 'sim\_%' escape '\'
     and coalesce(u.is_bot, false) = false
   group by r.target_id, r.type;
$fn$;

-- 7) 내 반응 상태 (버튼 활성 표시용)
create or replace function public.my_content_reactions(p_target_ids text[])
returns table(target_id text, type text, reason_tag text)
language sql stable security definer set search_path = public as $fn$
  select r.target_id, r.type, r.reason_tag
    from public.content_reactions r
   where r.user_id = auth.uid()
     and r.target_id = any(p_target_ids)
     and r.deleted_at is null;
$fn$;

-- 8) 조언 목록: 모두 공개 조언은 전원, 원작자만 공개 조언은 원작자·조언자만
create or replace function public.list_content_advice(p_target_ids text[])
returns table(id bigint, target_id text, user_id uuid, reactor_name text, advice_text text,
              advice_visibility text, created_at timestamptz, is_owner boolean, is_mine boolean)
language sql stable security definer set search_path = public as $fn$
  select r.id, r.target_id, r.user_id, r.reactor_name, r.advice_text, r.advice_visibility, r.created_at,
         (p.user_id = auth.uid()) as is_owner,
         (r.user_id = auth.uid()) as is_mine
    from public.content_reactions r
    left join public.feed_posts p on p.id = r.target_id and r.target_type = 'feed_post'
    left join public.users u on u.id = r.user_id
   where r.type = 'advice'
     and r.deleted_at is null
     and r.target_id = any(p_target_ids)
     and coalesce(u.is_bot, false) = false
     and (r.advice_visibility = 'everyone' or r.user_id = auth.uid() or p.user_id = auth.uid())
   order by r.created_at asc;
$fn$;

-- 9) 별로에요 이유 분포 (원작자에게만, 누가 눌렀는지는 반환하지 않는다)
create or replace function public.poor_reason_breakdown(p_target_id text)
returns table(reason_tag text, cnt int)
language sql stable security definer set search_path = public as $fn$
  select r.reason_tag, count(*)::int
    from public.content_reactions r
    join public.feed_posts p on p.id = r.target_id and r.target_type = 'feed_post'
   where r.type = 'poor' and r.deleted_at is null and r.target_id = p_target_id
     and p.user_id = auth.uid()
   group by r.reason_tag;
$fn$;

grant execute on function public.react_content(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.unreact_content(text,text,text) to authenticated;
grant execute on function public.moderate_advice(bigint,text) to authenticated;
grant execute on function public.count_content_reactions(text[]) to authenticated, anon;
grant execute on function public.my_content_reactions(text[]) to authenticated;
grant execute on function public.list_content_advice(text[]) to authenticated;
grant execute on function public.poor_reason_breakdown(text) to authenticated;

-- ────────────────────────────────────────────────
-- [확인] 실행 후 아래가 에러 없이 돌아오면 성공
-- ────────────────────────────────────────────────
-- select * from count_content_reactions(array['no-such-id']);
