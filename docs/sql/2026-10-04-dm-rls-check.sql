-- 2026-10-04 #TASK-ES-347 확인 쿼리 모음 — 읽기 전용(아무것도 바꾸지 않는다)
-- Supabase SQL Editor 에서 필요한 블록만 골라 붙여넣고 Run. 결과는 건수·정책 정의·id 만 나오고 메시지 본문은 나오지 않는다.

-- ============================================================
-- [사전-1] 지금 정책 — 1단계 실행 전에 결과를 캡처해 둔다(되돌릴 때 대조용)
-- ============================================================
select tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename in ('team_pings', 'team_ping_replies')
 order by tablename, policyname;

-- ============================================================
-- [사전-2] RLS 가 켜져 있는가(둘 다 true 여야 1·2단계가 효과가 있다)
-- ============================================================
select c.relname as 표, c.relrowsecurity as rls_켜짐, c.relforcerowsecurity as rls_강제
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname in ('team_pings', 'team_ping_replies');

-- ============================================================
-- [사전-3] id 칸의 자료형(text 인지 uuid 인지) — 정책은 둘 다 ::text 로 맞춰 비교하므로 어느 쪽이든 동작한다
-- ============================================================
select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name in ('team_pings', 'team_ping_replies')
   and column_name in ('id', 'group_id', 'sender_id', 'receiver_id', 'ping_id', 'target_type')
 order by table_name, column_name;

-- ============================================================
-- [사전-4] 영향 받는 사람 수 — 행을 쓴 사람 중 Supabase 로그인 계정(auth.users)이 없는 사람
--          (게스트·구글 직접 로그인·빠른 복구 입장). 이 사람들은 1단계 뒤 두 표를 못 읽고, 2단계 뒤 못 쓴다.
-- ============================================================
select '세션 없는 작성자 수(team_pings)' as 구분, count(distinct p.sender_id) as 수
  from public.team_pings p
 where not exists (select 1 from auth.users u where u.id::text = p.sender_id::text)
union all
select '세션 있는 작성자 수(team_pings)', count(distinct p.sender_id)
  from public.team_pings p
 where exists (select 1 from auth.users u where u.id::text = p.sender_id::text)
union all
select '세션 없는 작성자 수(team_ping_replies)', count(distinct r.sender_id)
  from public.team_ping_replies r
 where not exists (select 1 from auth.users u where u.id::text = r.sender_id::text);

-- ============================================================
-- [사전-5] 행 종류별 건수 — 2단계 정책의 A~H 분류와 대조
-- ============================================================
select group_id ~ '^dm_' as dm_계열, case when group_id in ('feed','shared_groups','manito','manito_pool','dm_direct') then group_id else '(팀 id 등)' end as 그룹,
       target_type, count(*) as 수
  from public.team_pings
 group by 1, 2, 3 order by 2, 3;

-- ============================================================
-- [사후-1] anon 으로 보이는 행 수 — 1단계 뒤, 2단계 뒤 모두 0, 0
-- ============================================================
begin;
set local role anon;
select 'team_pings (anon)' as 확인, count(*) as 수 from public.team_pings
union all
select 'team_ping_replies (anon)', count(*) from public.team_ping_replies;
rollback;

-- ============================================================
-- [사후-2] 확인에 쓸 사람 고르기 — DM 을 주고받은 짝(id 만)
--   A = sender_id, C = receiver_id 인 짝을 하나 고르고, B 는 이 짝에 없는 다른 로그인 계정 id 로 한다.
-- ============================================================
select sender_id, receiver_id, count(*) as 메시지_수
  from public.team_ping_replies
 group by 1, 2 order by 3 desc limit 5;

-- ============================================================
-- [사후-3] 로그인 사용자로 흉내 내어 보기 — 2단계 뒤에 실행
--   아래 두 곳의 <A_ID>, <C_ID>, <B_ID> 를 [사후-2] 결과의 id 로 바꾼다(작은따옴표 안).
--   기대: A 는 A-C DM 이 1건 이상, B 는 A-C DM 이 0건, A·B 모두 피드 댓글·공개 팀·마니또 풀은 전체 건수와 같게 보인다.
-- ============================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '<A_ID>', 'role', 'authenticated')::text, true);
set local role authenticated;
select 'A 가 보는 A-C DM 메시지' as 확인, count(*) as 수 from public.team_ping_replies
 where (sender_id::text = '<A_ID>' and receiver_id::text = '<C_ID>') or (sender_id::text = '<C_ID>' and receiver_id::text = '<A_ID>')
union all
select 'A 가 보는 피드 댓글', count(*) from public.team_pings where group_id = 'feed' and target_type = 'feed_comment'
union all
select 'A 가 보는 공개 팀', count(*) from public.team_pings where group_id = 'shared_groups' and target_type = 'team_group'
union all
select 'A 가 보는 마니또 풀', count(*) from public.team_pings where group_id = 'manito_pool';
rollback;

begin;
select set_config('request.jwt.claims', json_build_object('sub', '<B_ID>', 'role', 'authenticated')::text, true);
set local role authenticated;
select 'B 가 보는 A-C DM 메시지(0 이어야 함)' as 확인, count(*) as 수 from public.team_ping_replies
 where (sender_id::text = '<A_ID>' and receiver_id::text = '<C_ID>') or (sender_id::text = '<C_ID>' and receiver_id::text = '<A_ID>')
union all
select 'B 가 보는 A-C DM 대화방 부모 행(0 이어야 함)', count(*) from public.team_pings
 where group_id = 'dm_direct' and ((sender_id::text = '<A_ID>' and receiver_id::text = '<C_ID>') or (sender_id::text = '<C_ID>' and receiver_id::text = '<A_ID>'))
union all
select 'B 가 보는 피드 댓글', count(*) from public.team_pings where group_id = 'feed' and target_type = 'feed_comment'
union all
select 'B 가 보는 마니또 풀', count(*) from public.team_pings where group_id = 'manito_pool';
rollback;

-- ============================================================
-- [사전-6] #TASK-ES-381 — 2단계 직전 확인: og_dm_mark 가 있고(1), security definer(true)이며,
--          두 표의 rls_강제 가 false 여야 2단계 뒤에도 읽음 표시가 된다(강제가 true 면 함수가 0행이 된다)
-- ============================================================
select 'og_dm_mark 수(1)' as 확인, count(*)::text as 값 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'og_dm_mark'
union all
select 'og_dm_mark security definer(true)', coalesce(bool_and(p.prosecdef)::text, '함수 없음') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'og_dm_mark'
union all
select c.relname || ' rls_강제(false)', c.relforcerowsecurity::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname in ('team_pings', 'team_ping_replies');

-- ============================================================
-- [사전-7] #TASK-ES-381 — 2단계의 id 규칙에 안 맞는 기존 행 수(건수만). 0 이 아니어도 2단계 실행은 안전하다
--          (기존 행은 지우거나 고치지 않는다). 그 행들은 같은 id 로 다시 upsert 할 때만 막힌다 — 수를 기록해 둔다.
-- ============================================================
select '대화방 id 규칙 밖 DM 메시지(team_ping_replies)' as 확인, count(*) as 수
  from public.team_ping_replies r
 where r.ping_id::text not in (
         'dm_' || least(r.sender_id::text collate "C", r.receiver_id::text collate "C") || '_' || greatest(r.sender_id::text collate "C", r.receiver_id::text collate "C"),
         least(r.sender_id::text collate "C", r.receiver_id::text collate "C") || '_' || greatest(r.sender_id::text collate "C", r.receiver_id::text collate "C"))
    or r.ping_id is null or r.sender_id is null or r.receiver_id is null
union all
select '대화방 id 규칙 밖 대화방 부모 행(team_pings dm_direct)', count(*)
  from public.team_pings p
 where p.group_id = 'dm_direct'
   and (p.id::text not in (
         'dm_' || least(p.sender_id::text collate "C", p.receiver_id::text collate "C") || '_' || greatest(p.sender_id::text collate "C", p.receiver_id::text collate "C"),
         least(p.sender_id::text collate "C", p.receiver_id::text collate "C") || '_' || greatest(p.sender_id::text collate "C", p.receiver_id::text collate "C"))
        or p.sender_id is null or p.receiver_id is null)
union all
select '본인 풀 id 가 아닌 마니또 풀 행(team_pings manito_pool)', count(*)
  from public.team_pings p
 where p.group_id = 'manito_pool' and p.id::text is distinct from 'mn_pool_' || p.sender_id::text;
