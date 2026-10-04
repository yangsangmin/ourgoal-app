-- 2026-10-04 #TASK-ES-366 — DM 상태 열 5개 + 읽음·도착 표시 서버 함수 og_dm_mark
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
-- 되돌리기: docs/sql/2026-10-04-dm-read-columns-rollback.sql
--
-- 왜 필요한가 (2026-10-04 23:2x 작업자 실측, 테스트 계정 A·B 로그인 세션)
--   - team_ping_replies 에 status·sent_at·delivered_at·read_at·is_read 열이 없다
--     (select 시 "column ... does not exist", insert 시 PGRST204 "Could not find the 'delivered_at' column").
--     #TASK-ES-318(2026-09-27)이 앱 코드에만 이 열을 넣고 표에는 만들지 않아, 그 뒤 모든 1:1 DM insert 가 통째로 실패했다.
--     → 앱은 이번 PR 에서 그 열을 빼고 다시 넣도록 고쳐 메시지는 도착한다. 그러나 '읽음'은 저장할 곳이 없다.
--   - 받는 사람(B)이 A→B 행을 update 하면 0행(현재 허용 정책 없음). 그래서 읽음 표시를 직접 update 로는 못 한다.
--     받는 사람에게 update 권한을 통째로 주면 본문(message)까지 고칠 수 있으므로, 읽음·도착 열만 바꾸는 함수로 연다.
--
-- 무엇을 하나
--   [1] 열 5개 추가(기존 행은 null — 지어낸 '읽음/안읽음' 값을 채우지 않는다. 새 행의 is_read 기본값만 false)
--   [2] og_dm_mark(p_ping_id, p_read): 로그인한 본인이 '받는 사람'인 행만, delivered_at(+ p_read 면 is_read·status·read_at)만 바꾼다.
--       security definer 라 RLS 를 거치지 않지만, 조건이 receiver_id = auth.uid() 로 고정이라 남의 행·본문은 못 바꾼다.
--   기존 정책·행·열은 하나도 지우거나 고치지 않는다. 1단계·2단계 RLS(2026-10-04-dm-rls-*)와 독립이며 순서 상관없다.

begin;

-- [1] 상태 열
alter table public.team_ping_replies add column if not exists status text;
alter table public.team_ping_replies add column if not exists sent_at timestamptz;
alter table public.team_ping_replies add column if not exists delivered_at timestamptz;
alter table public.team_ping_replies add column if not exists read_at timestamptz;
alter table public.team_ping_replies add column if not exists is_read boolean;
alter table public.team_ping_replies alter column is_read set default false;

-- [2] 읽음·도착 표시 함수 (받는 사람 본인 행만)
create or replace function public.og_dm_mark(p_ping_id text, p_read boolean default true)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid text := (select auth.uid())::text;
  v_n integer := 0;
begin
  if v_uid is null or p_ping_id is null then
    return 0;
  end if;
  if p_read then
    update public.team_ping_replies
       set is_read = true,
           status = 'read',
           read_at = coalesce(read_at, now()),
           delivered_at = coalesce(delivered_at, now())
     where ping_id = p_ping_id
       and receiver_id::text = v_uid
       and coalesce(is_read, false) = false;
  else
    update public.team_ping_replies
       set delivered_at = now(),
           status = case when coalesce(status, 'sent') = 'sent' then 'delivered' else status end
     where ping_id = p_ping_id
       and receiver_id::text = v_uid
       and delivered_at is null;
  end if;
  get diagnostics v_n = row_count;
  return v_n;
end
$fn$;

revoke all on function public.og_dm_mark(text, boolean) from public;
revoke all on function public.og_dm_mark(text, boolean) from anon;
grant execute on function public.og_dm_mark(text, boolean) to authenticated;

commit;

-- PostgREST 가 새 열·함수를 바로 보게 스키마 캐시를 다시 읽힌다
notify pgrst, 'reload schema';

-- [확인] 아래 두 줄이 '열 5', '함수 1' 이면 성공
select '열 5' as 확인, count(*) as 수 from information_schema.columns
 where table_schema = 'public' and table_name = 'team_ping_replies'
   and column_name in ('status', 'sent_at', 'delivered_at', 'read_at', 'is_read')
union all
select '함수 1', count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'og_dm_mark';
