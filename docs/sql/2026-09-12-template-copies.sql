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
