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
