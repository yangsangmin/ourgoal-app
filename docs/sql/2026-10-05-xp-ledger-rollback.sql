-- 2026-10-05 #TASK-ES-421 K-XP1 되돌리기 — docs/sql/2026-10-05-xp-ledger.sql 을 거둔다.
-- 데이터를 지우지 않는다: 표와 행(사용자 EXP)은 남기고, 로그인 사용자의 읽기·쓰기 권한과 정책만 거둔다.
-- 앱은 서버 읽기·쓰기가 실패하면 기기 사본(ourgoal_ledger_cache_<uid>)으로 계속 동작하고 대기열에 쌓는다(js/avatar/xp-ledger.js).
-- 표 자체를 지우는 것(drop table)은 데이터 삭제라 이 파일에 넣지 않는다 — 필요하면 상민님 결심(승인선 ③) 뒤 별도 SQL.
-- 여러 번 돌려도 안전하다.

begin;

drop policy if exists uld_select_own on public.user_ledger_docs;
drop policy if exists uld_insert_own on public.user_ledger_docs;
drop policy if exists uld_update_own on public.user_ledger_docs;
do $r$
begin
  if to_regclass('public.user_ledger_docs') is not null then
    execute 'revoke all on public.user_ledger_docs from authenticated';
    execute 'revoke all on public.user_ledger_docs from anon';
  end if;
end
$r$;

-- 파기 대상 목록은 그대로 둔다: 표에 행이 남아 있는 동안 탈퇴한 사람의 EXP 도 지워져야 하므로(되돌려도 개인정보 파기는 유지).

commit;

select 'uld 정책 남은 수(0 이어야 함)' as 확인, count(*) as 수
  from pg_policies where schemaname = 'public' and tablename = 'user_ledger_docs';
