-- RUN-ME-2026-09-12-kf.sql — 상민 직접입력 핵심기능 KF-1~7 서버 스키마 통합본 (멱등, 위에서 아래로 한 번에 실행)
-- 실행 위치: Supabase 대시보드 › SQL Editor › New query › 전체 붙여넣기 › Run
-- 선행: 2026-09-12-count-same-theme-checkins.sql(users.is_bot·checkins.is_bot)이 이미 적용돼 있어야 한다. 안 됐으면 그 파일을 먼저 실행.
-- 순서 근거: 원장(credit_ledger) → 반응(content_reactions) → 도움돼요 이유(helpful_reasons, 위 둘 참조) → 상단 슬롯 RPC(반응 참조) → 템플릿 복제(원장 참조)
-- 모든 DDL은 IF NOT EXISTS / CREATE OR REPLACE. DROP·TRUNCATE·하드 DELETE 없음. 두 번 실행해도 안전.


-- ======================================================================
-- ▶ 2026-09-12-credit-ledger.sql
-- ======================================================================
-- ============================================================
-- 아워골 — 공용 크레딧 원장(credit_ledger) · 관리자 설정(credit_settings) · RPC
-- 2026-09-12 준비. (#TASK-ES-015, INFRA)
--
-- 왜 필요한가: 수익화 정본 「아워골 수익화 모델(정립/구현)」 §2 "원장" —
-- 서버 credit_ledger 하나를 KF-2(템플릿 복사)·KF-5(도움돼요 이유)·KF-7(조언해요)이
-- 공유한다. 클라이언트 로컬 저장 금지. 크레딧은 앱 내 전용이며 현금·상품권과
-- 교환하지 않는다(정본 §2 "성격"·"현금화").
--
-- 원칙 6 "되돌릴 수 있게": 지급 규칙은 전부 credit_settings 값이다. 코드 고정값 없음.
-- 기본값 enabled=false — M1(유저 5천 명) 게이트 전까지 어떤 적립도 일어나지 않는다.
-- 액수·상한·최소 글자 수는 null(미정) — 유저 50명 이후 실데이터를 보고 정한다.
--
-- append-only: 클라이언트는 원장을 읽기만 한다(본인 행). 쓰기는 SECURITY DEFINER RPC
-- award_credit 한 곳뿐이며 UPDATE·DELETE 정책은 만들지 않는다.
-- 전부 if not exists / or replace / on conflict do nothing 구문으로 여러 번 실행해도 안전하다.
-- ============================================================

-- 1) 원장 (append-only)
create table if not exists public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  event_type text not null,
  ref_type text,
  ref_id text,
  amount int not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user_created on public.credit_ledger(user_id, created_at desc);

alter table public.credit_ledger enable row level security;

drop policy if exists credit_ledger_select_own on public.credit_ledger;
create policy credit_ledger_select_own on public.credit_ledger
  for select using (auth.uid() = user_id);
-- insert/update/delete 정책 없음 = 클라이언트 쓰기 불가. 쓰기는 award_credit RPC만.

-- 2) 관리자 설정값 (전원 읽기, 쓰기 불가 — 관리자는 Supabase 콘솔에서 바꾼다)
create table if not exists public.credit_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

alter table public.credit_settings enable row level security;

drop policy if exists credit_settings_select_all on public.credit_settings;
create policy credit_settings_select_all on public.credit_settings
  for select using (true);

-- 기본 행: 숫자는 비워 둔다(유저 50명 이후 결정). enabled=false 가 M1 전 상태.
insert into public.credit_settings (key, value) values
  ('enabled', 'false'::jsonb),
  ('helpful_reason_amount', 'null'::jsonb),
  ('template_copy_tiers', 'null'::jsonb),
  ('advice_written_amount', 'null'::jsonb),
  ('daily_cap', 'null'::jsonb),
  ('min_reason_chars', 'null'::jsonb)
on conflict (key) do nothing;

-- 3) 설정 조회 RPC — 공개 가능한 설정 전체를 한 번에
create or replace function public.credit_policy()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.credit_settings;
$$;

grant execute on function public.credit_policy() to authenticated, anon;

-- 4) 잔액 RPC — 본인 원장 합계
create or replace function public.my_credit_balance()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::int from public.credit_ledger where user_id = auth.uid();
$$;

grant execute on function public.my_credit_balance() to authenticated;

-- 5) 적립 RPC — 게이트를 전부 통과했을 때만 1행 insert, 아니면 0
--    게이트 순서: 로그인 → enabled → 봇 아님 → 이벤트별 설정 amount 존재 → 멱등 키 미사용 → 하루 상한
create or replace function public.award_credit(
  p_event_type text,
  p_ref_type text,
  p_ref_id text,
  p_idempotency_key text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_enabled boolean;
  v_is_bot boolean;
  v_amount int;
  v_cap int;
  v_today int;
begin
  if v_uid is null then return 0; end if;
  if p_event_type is null or trim(p_event_type) = '' or p_idempotency_key is null or trim(p_idempotency_key) = '' then
    return 0;
  end if;

  select coalesce((value)::boolean, false) into v_enabled from public.credit_settings where key = 'enabled';
  if not coalesce(v_enabled, false) then return 0; end if;

  select coalesce(u.is_bot, false) into v_is_bot from public.users u where u.id = v_uid;
  if coalesce(v_is_bot, false) then return 0; end if;

  -- 이벤트별 액수: helpful_reason → helpful_reason_amount, advice_written → advice_written_amount,
  -- template_copied → template_copy_tiers 의 "amount" (구간 판정은 호출 측 RPC가 한다)
  select case
           when jsonb_typeof(value) = 'number' then (value)::int
           when jsonb_typeof(value) = 'object' and (value ? 'amount') then (value->>'amount')::int
           else null
         end
    into v_amount
    from public.credit_settings
   where key = case p_event_type
                 when 'template_copied' then 'template_copy_tiers'
                 else p_event_type || '_amount'
               end;
  if v_amount is null or v_amount <= 0 then return 0; end if;

  if exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then return 0; end if;

  select case when jsonb_typeof(value) = 'number' then (value)::int else null end
    into v_cap from public.credit_settings where key = 'daily_cap';
  if v_cap is not null then
    select coalesce(sum(amount), 0) into v_today
      from public.credit_ledger
     where user_id = v_uid
       and amount > 0
       and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date;
    if coalesce(v_today, 0) + v_amount > v_cap then return 0; end if;
  end if;

  insert into public.credit_ledger (user_id, event_type, ref_type, ref_id, amount, idempotency_key)
  values (v_uid, p_event_type, p_ref_type, p_ref_id, v_amount, p_idempotency_key)
  on conflict (idempotency_key) do nothing;

  return v_amount;
end;
$$;

grant execute on function public.award_credit(text, text, text, text) to authenticated;

-- ────────────────────────────────────────────────
-- [확인] 아래 쿼리가 에러 없이 돌면 성공. enabled=false 상태라 award_credit 은 0 을 돌려준다.
-- ────────────────────────────────────────────────
-- select credit_policy();
-- select my_credit_balance();
-- select award_credit('helpful_reason', 'feed_post', 'sample', 'helpful_reason:sample:test');

-- ======================================================================
-- ▶ 2026-09-12-content-reactions.sql
-- ======================================================================
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

-- ======================================================================
-- ▶ 2026-09-12-helpful-reason.sql
-- ======================================================================
-- ============================================================
-- 아워골 — 도움돼요 이유 작성 + 크레딧 (KF-5, #TASK-ES-016, 본질 ③ 동류 발견·소통)
-- 2026-09-12 준비.
--
-- 왜 필요한가: 도움돼요 한 번으로는 "왜 도움이 됐는지"가 남지 않는다. 이유 한 줄이
-- 붙으면 글쓴이는 구체적 피드백을 받고, 이유 데이터는 KF-4(상단 노출)·KF-6(활용 계획)의
-- 원천이 된다. 이유 작성은 "다른 사람에게 유익한 기여"라 크레딧 대상이다(수익화 정본 §1-2).
--
-- 선행: docs/sql/2026-09-12-content-reactions.sql (도움돼요 반응 행)
--       docs/sql/2026-09-12-credit-ledger.sql   (credit_settings · award_credit)
-- 크레딧은 credit_settings.enabled=true 이고 helpful_reason_amount 가 숫자일 때만 적립된다.
-- 지금 기본값은 enabled=false 라 이유만 저장되고 적립은 일어나지 않는다.
--
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 전부 if not exists / or replace /
-- on conflict do nothing 구문이라 여러 번 실행해도 안전하다. 하드 삭제 없음(소프트 삭제).
-- ============================================================

-- 0) 설정 테이블이 아직 없으면 만든다(원장 SQL과 같은 정의, 멱등)
create table if not exists public.credit_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- 이유 태그 5종은 코드 고정값이 아니라 설정값이다(관리자가 콘솔에서 바꾼다).
insert into public.credit_settings (key, value) values
  ('min_reason_chars', 'null'::jsonb),
  ('helpful_reason_tags', '[
     {"code":"how_to","label":"구체적인 방법을 알려줘요"},
     {"code":"same_situation","label":"내 상황과 같아요"},
     {"code":"motivation","label":"동기부여가 됐어요"},
     {"code":"new_info","label":"몰랐던 정보예요"},
     {"code":"other","label":"기타"}
   ]'::jsonb)
on conflict (key) do nothing;

-- 1) 이유 테이블 (한 사람이 한 글에 이유 1건)
create table if not exists public.helpful_reasons (
  id             bigint generated always as identity primary key,
  target_type    text not null default 'feed_post' check (target_type in ('feed_post','checkin','goal_template')),
  target_id      text not null,
  user_id        uuid not null references auth.users(id) on delete cascade,
  reason_tag     text not null check (reason_tag in ('how_to','same_situation','motivation','new_info','other')),
  reason_text    text null check (reason_text is null or char_length(reason_text) <= 300),
  quality_pass   boolean not null default false,
  credit_granted int not null default 0,
  deleted_at     timestamptz null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists idx_helpful_reasons_target on public.helpful_reasons(target_type, target_id) where deleted_at is null;
create index if not exists idx_helpful_reasons_user   on public.helpful_reasons(user_id) where deleted_at is null;

alter table public.helpful_reasons enable row level security;

-- RLS: 직접 읽기는 본인 행만. 글쓴이용 집계·쓰기는 아래 SECURITY DEFINER RPC 로만.
drop policy if exists helpful_reasons_select_own on public.helpful_reasons;
create policy helpful_reasons_select_own on public.helpful_reasons
  for select using (auth.uid() = user_id);

-- 2) 이유 저장 (품질 게이트 통과 시 크레딧 적립까지 한 번에)
--    게이트: 로그인 → 시뮬 글 아님 → 봇 아님 → 내 글 아님 → 도움돼요를 실제로 눌렀음
--    품질: 최소 글자 수(설정 min_reason_chars, null 이면 기본값 10) 이상 · 같은 문장 복붙 아님
create or replace function public.save_helpful_reason(
  p_target_type text, p_target_id text, p_reason_tag text, p_reason_text text default null
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_bot boolean := false;
  v_min int;
  v_text text := nullif(trim(coalesce(p_reason_text, '')), '');
  v_pass boolean := false;
  v_dup boolean := false;
  v_id bigint;
  v_granted int := 0;
  v_prev_granted int := 0;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type is null or p_target_id is null or trim(p_target_id) = '' then raise exception 'bad target'; end if;
  if p_target_id like 'sim\_%' escape '\' then raise exception 'bot target'; end if;
  if p_reason_tag not in ('how_to','same_situation','motivation','new_info','other') then raise exception 'bad tag'; end if;

  select coalesce(u.is_bot, false) into v_bot from public.users u where u.id = v_uid;
  if v_bot then raise exception 'bot reactor'; end if;

  if p_target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = p_target_id;
    if v_owner is not null and v_owner = v_uid then raise exception 'cannot rate own content'; end if;
  end if;

  -- 도움돼요를 누른 사람만 이유를 남길 수 있다
  if not exists (
    select 1 from public.content_reactions r
     where r.user_id = v_uid and r.target_type = p_target_type and r.target_id = p_target_id
       and r.type = 'helpful' and r.deleted_at is null
  ) then raise exception 'helpful reaction required'; end if;

  -- 최소 글자 수: 설정값, 없으면 기본값 10
  select case when jsonb_typeof(value) = 'number' then (value)::int else null end
    into v_min from public.credit_settings where key = 'min_reason_chars';
  v_min := coalesce(v_min, 10);

  if v_text is not null then
    v_text := left(v_text, 300);
    -- 같은 사람이 최근 30일 안에 같은 문장을 다른 글에 또 적으면 복붙으로 본다
    select exists (
      select 1 from public.helpful_reasons h
       where h.user_id = v_uid and h.deleted_at is null
         and not (h.target_type = p_target_type and h.target_id = p_target_id)
         and h.created_at > now() - interval '30 days'
         and lower(regexp_replace(coalesce(h.reason_text,''), '\s+', '', 'g')) = lower(regexp_replace(v_text, '\s+', '', 'g'))
    ) into v_dup;
    v_pass := (char_length(v_text) >= v_min) and not v_dup;
  end if;

  select id, credit_granted into v_id, v_prev_granted
    from public.helpful_reasons
   where user_id = v_uid and target_type = p_target_type and target_id = p_target_id;

  if v_id is null then
    insert into public.helpful_reasons (target_type, target_id, user_id, reason_tag, reason_text, quality_pass)
    values (p_target_type, p_target_id, v_uid, p_reason_tag, v_text, v_pass)
    returning id into v_id;
  else
    update public.helpful_reasons
       set reason_tag = p_reason_tag, reason_text = v_text, quality_pass = v_pass,
           deleted_at = null, updated_at = now()
     where id = v_id;
  end if;

  -- 품질 통과 시 공용 원장에 적립(enabled=false 면 0). 멱등 키로 같은 글에 두 번 주지 않는다.
  if v_pass and coalesce(v_prev_granted, 0) = 0 and to_regprocedure('public.award_credit(text,text,text,text)') is not null then
    v_granted := public.award_credit('helpful_reason', p_target_type, p_target_id,
                                     'helpful_reason:' || v_uid::text || ':' || p_target_id);
    if coalesce(v_granted, 0) > 0 then
      update public.helpful_reasons set credit_granted = v_granted, updated_at = now() where id = v_id;
    end if;
  end if;

  return jsonb_build_object('id', v_id, 'quality_pass', v_pass, 'duplicate', v_dup,
                            'min_chars', v_min, 'credit_granted', coalesce(v_granted, 0));
end;
$fn$;

-- 3) 글쓴이용 요약: 태그별 개수 + 텍스트 목록 (원작자에게만, 누가 적었는지는 반환하지 않는다)
create or replace function public.helpful_reason_summary(p_target_type text, p_target_id text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_tags jsonb;
  v_texts jsonb;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = p_target_id;
  end if;
  if v_owner is null or v_owner <> v_uid then raise exception 'forbidden'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('tag', t.reason_tag, 'cnt', t.cnt) order by t.cnt desc), '[]'::jsonb)
    into v_tags
    from (
      select h.reason_tag, count(*)::int as cnt
        from public.helpful_reasons h
        left join public.users u on u.id = h.user_id
       where h.target_type = p_target_type and h.target_id = p_target_id and h.deleted_at is null
         and coalesce(u.is_bot, false) = false
       group by h.reason_tag
    ) t;

  select coalesce(jsonb_agg(jsonb_build_object('tag', h.reason_tag, 'text', h.reason_text, 'created_at', h.created_at) order by h.created_at desc), '[]'::jsonb)
    into v_texts
    from public.helpful_reasons h
    left join public.users u on u.id = h.user_id
   where h.target_type = p_target_type and h.target_id = p_target_id and h.deleted_at is null
     and h.reason_text is not null
     and coalesce(u.is_bot, false) = false;

  return jsonb_build_object('tags', v_tags, 'texts', v_texts);
end;
$fn$;

-- 4) KF-6용 집계 뷰(개인 식별 없음): 글·태그별 개수만
create or replace view public.helpful_reason_stats as
  select h.target_type, h.target_id, h.reason_tag, count(*)::int as cnt,
         sum(case when h.quality_pass then 1 else 0 end)::int as quality_cnt
    from public.helpful_reasons h
    left join public.users u on u.id = h.user_id
   where h.deleted_at is null and coalesce(u.is_bot, false) = false
   group by h.target_type, h.target_id, h.reason_tag;

grant execute on function public.save_helpful_reason(text,text,text,text) to authenticated;
grant execute on function public.helpful_reason_summary(text,text) to authenticated;
grant select on public.helpful_reason_stats to authenticated;

-- ────────────────────────────────────────────────
-- [확인] 실행 후 아래가 에러 없이 돌아오면 성공
-- ────────────────────────────────────────────────
-- select value from public.credit_settings where key = 'helpful_reason_tags';

-- ======================================================================
-- ▶ 2026-09-12-top-helpful.sql
-- ======================================================================
-- ============================================================
-- 아워골 — 카테고리별 "도움이 된 글" 상단 슬롯 집계 RPC
-- 2026-09-12 준비. (KF-4, #TASK-ES-018, 본질 ③ 동류 발견·소통)
--
-- 왜 필요한가: 같은 주제(카테고리)에서 도움돼요를 많이 받은 사람의 글이 그 주제 피드
-- 상단에 실데이터로 보여야 "유익함"이 체감된다. 전 카테고리 통합 점수는 동류성을
-- 깨므로 금지 — 반드시 카테고리 안에서만 센다. 봇·시뮬 글·자기 반응·숨김 글은 제외.
-- 값이 없으면 빈 결과를 돌려주고 클라이언트는 슬롯 자체를 그리지 않는다(위조 금지).
--
-- 선행: docs/sql/2026-09-12-content-reactions.sql (content_reactions 테이블, KF-7)
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 전부 멱등(if not exists / or replace).
-- ============================================================

-- 0) 숨김 컬럼이 아직 없는 환경 대비(2026-09-06/08 SQL 과 동일한 멱등 선언)
alter table public.feed_posts add column if not exists hidden boolean not null default false;

-- 1) 카테고리 판정 — 클라이언트 filterFeedByCategory 와 같은 기준(저장된 extra.category 우선, 없으면 문구 정규식)
create or replace function public.feed_post_matches_category(p_post public.feed_posts, p_key text)
returns boolean language sql immutable as $fn$
  select case
    when p_key is null or p_key = '' or p_key = 'all' then false  -- '전체'에서는 슬롯을 만들지 않는다(통합 점수 금지)
    when coalesce(p_post.extra->>'category', '') = p_key then true
    when p_key = 'study'   then (coalesce(p_post.goal_title,'') || ' ' || coalesce(p_post.caption,'')) ~* '토익|공부|시험|자격증|수험|독서실|회독|강의|leet|cpa|노무사|간호|국시|기출'
    when p_key = 'dev'     then (coalesce(p_post.goal_title,'') || ' ' || coalesce(p_post.caption,'')) ~* '개발|코딩|깃허브|알고리즘|오픈소스|백준|디자인|ui|ux|saas|프론트|백엔드'
    when p_key = 'workout' then (coalesce(p_post.goal_title,'') || ' ' || coalesce(p_post.caption,'')) ~* '운동|헬스|러닝|체력|바디프로필|웨이트|필라테스|테니스|수영|인터벌'
    when p_key = 'career'  then (coalesce(p_post.goal_title,'') || ' ' || coalesce(p_post.caption,'')) ~* '취업|인턴|이직|창업|매출|사업|마케터|세일즈|영업|스타트업|hr'
    when p_key = 'hobby'   then (coalesce(p_post.goal_title,'') || ' ' || coalesce(p_post.caption,'')) ~* '음악|그림|공연|웹툰|댄스|사진|자작곡|뮤지컬|베이커리|로스팅'
    else false
  end;
$fn$;

-- 2) 카테고리별 도움이 된 글 — 최근 p_days 일 안의 도움돼요(실사용자, 자기 반응 제외)를
--    글쓴이별로 세어 상위 p_limit 명의 최신 공개 글 1개씩 반환. 결과가 없으면 0행.
create or replace function public.top_helpful_posts(p_category text, p_days int default 30, p_limit int default 2)
returns table(post jsonb, helpful_count int, author_id uuid)
language sql stable security definer set search_path = public as $fn$
  with helpful as (
    select p.user_id as author, count(*)::int as cnt
      from public.content_reactions r
      join public.feed_posts p on p.id = r.target_id
      left join public.users u on u.id = r.user_id
     where r.target_type = 'feed_post'
       and r.type = 'helpful'
       and r.deleted_at is null
       and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 30), 1))
       and coalesce(u.is_bot, false) = false
       and r.user_id <> p.user_id
       and p.id not like 'sim\_%' escape '\'
       and coalesce(p.hidden, false) = false
       and public.feed_post_matches_category(p, p_category)
     group by p.user_id
  ),
  top_authors as (
    select author, cnt from helpful
     order by cnt desc, author
     limit greatest(least(coalesce(p_limit, 2), 5), 1)
  )
  select to_jsonb(lp.*) as post, ta.cnt as helpful_count, ta.author as author_id
    from top_authors ta
    join lateral (
      select p2.* from public.feed_posts p2
       where p2.user_id = ta.author
         and coalesce(p2.hidden, false) = false
         and p2.id not like 'sim\_%' escape '\'
         and public.feed_post_matches_category(p2, p_category)
       order by p2.created_at desc
       limit 1
    ) lp on true
   order by ta.cnt desc, ta.author;
$fn$;

grant execute on function public.feed_post_matches_category(public.feed_posts, text) to anon, authenticated;
grant execute on function public.top_helpful_posts(text, int, int) to anon, authenticated;

-- 확인용
-- select (post->>'id') as id, helpful_count from public.top_helpful_posts('study', 30, 2);

-- ======================================================================
-- ▶ 2026-09-12-template-copies.sql
-- ======================================================================
-- ────────────────────────────────────────────────────────────────
-- KF-2 #TASK-ES-017 (E3) — 템플릿 복제 실이벤트 원장 + 원작자 크레딧 구간 적립
--
-- 규격: 「아워골 수익화 모델(정립/구현)」 §1·§2·§3, KF-2 요구사항정의서 v2 REQ-11·12·14·16·20·22.
--   - 복제 수는 실데이터(서버 행)만. 화면은 이 집계값만 쓰고, 값이 없으면 숨긴다.
--   - 같은 사람이 같은 템플릿을 여러 번 복제해도 1회만 센다. 자기 템플릿 자기 복제는 세지 않는다. 봇은 제외.
--   - 크레딧 구간 판정·적립은 이 파일의 RPC(security definer) 안에서만. 클라이언트는 액수를 보내지 않는다.
--   - 정책값은 credit_settings.template_copy_tiers 한 곳(관리자 설정값). null 이면 적립 0(현재 기본).
--   - 하드 삭제·테이블 제거 없음. 여러 번 실행해도 안전(멱등).
--
-- 선행: docs/sql/2026-09-12-credit-ledger.sql (credit_ledger · credit_settings · is_bot) 이 먼저 실행돼 있어야 한다.
--
-- template_copy_tiers 값 형식(둘 중 하나, 예시 — 확정값 아님):
--   {"tiers": [{"at": 500, "amount": 10}, {"at": 1000, "amount": 20}]}
--   {"thresholds": [500, 1000, 5000], "amount": 10}
-- ────────────────────────────────────────────────────────────────

-- 1) 복제 이벤트 원장 (누가 · 어떤 템플릿을 · 언제)
create table if not exists public.template_copies (
  id bigserial primary key,
  template_id text not null,
  owner_user_id uuid null,
  copier_user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint template_copies_once unique (template_id, copier_user_id)
);

create index if not exists idx_template_copies_template on public.template_copies (template_id);
create index if not exists idx_template_copies_owner on public.template_copies (owner_user_id);

alter table public.template_copies enable row level security;

-- 본인이 복제한 행만 읽고 쓸 수 있다. 집계는 아래 RPC 가 security definer 로 돈다.
drop policy if exists template_copies_select_own on public.template_copies;
create policy template_copies_select_own on public.template_copies
  for select using (copier_user_id = auth.uid());

drop policy if exists template_copies_insert_own on public.template_copies;
create policy template_copies_insert_own on public.template_copies
  for insert with check (copier_user_id = auth.uid());

-- 2) 선택형 광고 적립 설정 키(값은 비워 둔다 — 유저 50명 후 결정, null 이면 0)
insert into public.credit_settings (key, value) values
  ('ad_watched_amount', 'null'::jsonb)
on conflict (key) do nothing;

-- 3) 집계 RPC — 템플릿별 서로 다른 실사용자 복제 수(봇 제외)
create or replace function public.template_copy_counts(p_template_ids text[])
returns table (template_id text, copies int)
language sql
stable
security definer
set search_path = public
as $$
  select c.template_id, count(distinct c.copier_user_id)::int as copies
    from public.template_copies c
    left join public.users u on u.id = c.copier_user_id
   where c.template_id = any (coalesce(p_template_ids, array[]::text[]))
     and coalesce(u.is_bot, false) = false
   group by c.template_id;
$$;

grant execute on function public.template_copy_counts(text[]) to authenticated, anon;

-- 4) 복제 기록 + 원작자 구간 적립 RPC
--    게이트: 로그인 → 봇 아님 → 자기 템플릿 아님 → (중복은 무시) → 집계 → 설정값 있으면 구간 판정 → 원작자 원장 insert(멱등)
create or replace function public.record_template_copy(p_template_id text, p_owner_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_bot boolean;
  v_owner_bot boolean;
  v_recorded boolean := false;
  v_count int := 0;
  v_enabled boolean;
  v_tiers jsonb;
  v_tier jsonb;
  v_at int;
  v_amount int;
  v_default_amount int;
  v_cap int;
  v_today int;
  v_awarded int := 0;
  v_key text;
begin
  if p_template_id is null or trim(p_template_id) = '' then
    return jsonb_build_object('count', null, 'recorded', false, 'awarded', 0);
  end if;

  if v_uid is not null then
    select coalesce(u.is_bot, false) into v_is_bot from public.users u where u.id = v_uid;
    if not coalesce(v_is_bot, false) and (p_owner_user_id is null or p_owner_user_id <> v_uid) then
      insert into public.template_copies (template_id, owner_user_id, copier_user_id)
      values (p_template_id, p_owner_user_id, v_uid)
      on conflict (template_id, copier_user_id) do nothing;
      v_recorded := found;
    end if;
  end if;

  select coalesce(count(distinct c.copier_user_id), 0)::int into v_count
    from public.template_copies c
    left join public.users u on u.id = c.copier_user_id
   where c.template_id = p_template_id
     and coalesce(u.is_bot, false) = false;

  -- 구간 적립: 원작자가 있고, 크레딧이 켜져 있고, 설정값이 있을 때만
  if p_owner_user_id is null or v_recorded = false then
    return jsonb_build_object('count', v_count, 'recorded', v_recorded, 'awarded', 0);
  end if;

  select coalesce((value)::boolean, false) into v_enabled from public.credit_settings where key = 'enabled';
  if not coalesce(v_enabled, false) then
    return jsonb_build_object('count', v_count, 'recorded', v_recorded, 'awarded', 0);
  end if;

  select coalesce(u.is_bot, false) into v_owner_bot from public.users u where u.id = p_owner_user_id;
  if coalesce(v_owner_bot, false) then
    return jsonb_build_object('count', v_count, 'recorded', v_recorded, 'awarded', 0);
  end if;

  select value into v_tiers from public.credit_settings where key = 'template_copy_tiers';
  if v_tiers is null or jsonb_typeof(v_tiers) <> 'object' then
    return jsonb_build_object('count', v_count, 'recorded', v_recorded, 'awarded', 0);
  end if;

  select case when jsonb_typeof(value) = 'number' then (value)::int else null end
    into v_cap from public.credit_settings where key = 'daily_cap';

  v_default_amount := case when v_tiers ? 'amount' and jsonb_typeof(v_tiers->'amount') = 'number'
                           then (v_tiers->>'amount')::int else null end;

  -- 형식 A: {"tiers":[{"at":N,"amount":M}, ...]}  ·  형식 B: {"thresholds":[N, ...], "amount":M}
  for v_tier in
    select x.value from jsonb_array_elements(
      case
        when v_tiers ? 'tiers' and jsonb_typeof(v_tiers->'tiers') = 'array' then v_tiers->'tiers'
        when v_tiers ? 'thresholds' and jsonb_typeof(v_tiers->'thresholds') = 'array'
          then (select coalesce(jsonb_agg(jsonb_build_object('at', th.value)), '[]'::jsonb) from jsonb_array_elements(v_tiers->'thresholds') as th)
        else '[]'::jsonb
      end
    ) as x
  loop
    v_at := case when jsonb_typeof(v_tier->'at') = 'number' then (v_tier->>'at')::int else null end;
    v_amount := case when v_tier ? 'amount' and jsonb_typeof(v_tier->'amount') = 'number'
                     then (v_tier->>'amount')::int else v_default_amount end;
    if v_at is null or v_amount is null or v_amount <= 0 or v_count < v_at then
      continue;
    end if;

    v_key := 'tier:' || p_template_id || ':' || v_at::text;
    if exists (select 1 from public.credit_ledger where idempotency_key = v_key) then
      continue;
    end if;

    if v_cap is not null then
      select coalesce(sum(amount), 0) into v_today
        from public.credit_ledger
       where user_id = p_owner_user_id
         and amount > 0
         and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date;
      if coalesce(v_today, 0) + v_amount > v_cap then
        continue;
      end if;
    end if;

    insert into public.credit_ledger (user_id, event_type, ref_type, ref_id, amount, idempotency_key)
    values (p_owner_user_id, 'template_copied', 'template', p_template_id, v_amount, v_key)
    on conflict (idempotency_key) do nothing;
    if found then
      v_awarded := v_awarded + v_amount;
    end if;
  end loop;

  return jsonb_build_object('count', v_count, 'recorded', v_recorded, 'awarded', v_awarded);
end;
$$;

grant execute on function public.record_template_copy(text, uuid) to authenticated;

-- ────────────────────────────────────────────────
-- [확인] 아래가 에러 없이 돌면 성공. 설정값이 비어 있어 적립은 0 이고 복제 수만 기록된다.
-- ────────────────────────────────────────────────
-- select record_template_copy('mkt_sample', null);
-- select * from template_copy_counts(array['mkt_sample']);

-- ======================================================================
-- 적용 확인 (SQL Editor에서 실행)
-- select to_regclass('public.credit_ledger'), to_regclass('public.credit_settings'), to_regclass('public.content_reactions'), to_regclass('public.helpful_reasons'), to_regclass('public.template_copies');
-- select proname from pg_proc where proname in ('award_credit','my_credit_balance','credit_policy','count_content_reactions','save_helpful_reason','top_helpful_posts','record_template_copy','template_copy_counts');
