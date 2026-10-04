-- 2026-10-04 #TASK-ES-347 1단계 되돌리기 — anon 읽기 차단 정책을 지워 실행 전 상태로 복원
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
--
-- 1단계는 기존 정책을 건드리지 않고 RESTRICTIVE 정책만 더했으므로, 그것을 지우면 원래 상태(select using(true))로 돌아간다.
-- 2단계를 이미 실행했다면 먼저 2026-10-04-dm-rls-step2-rollback.sql 을 실행한다.

begin;
drop policy if exists es347_anon_no_select on public.team_pings;
drop policy if exists es347_anon_no_select on public.team_ping_replies;

-- 안전망: 누군가 기존 허용 select 정책을 지운 상태라면, 실행 전과 같은 using(true) 허용 정책을 다시 만든다.
-- 기존 허용 정책이 남아 있으면 아무것도 하지 않는다.
do $restore$
declare t text;
begin
  foreach t in array array['team_pings', 'team_ping_replies'] loop
    if not exists (select 1 from pg_policies
                    where schemaname = 'public' and tablename = t
                      and permissive = 'PERMISSIVE' and cmd in ('SELECT', 'ALL')) then
      execute format('create policy es347_restore_select_all on public.%I for select using (true)', t);
      raise notice '% 에 허용 select 정책이 없어 es347_restore_select_all(using true)을 만들었습니다', t;
    end if;
  end loop;
end
$restore$;
commit;

-- [확인] 0 이 나오면 1단계 정책이 모두 지워진 것이다.
select 'es347 1단계 정책 남은 수(0 이어야 함)' as 확인, count(*) as 수
  from pg_policies
 where schemaname = 'public' and policyname = 'es347_anon_no_select';
