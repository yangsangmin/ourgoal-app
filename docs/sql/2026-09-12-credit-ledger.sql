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
