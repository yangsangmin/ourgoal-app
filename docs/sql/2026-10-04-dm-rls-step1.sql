-- 2026-10-04 #TASK-ES-347 1단계 — team_pings·team_ping_replies 의 로그인 없는(anon) 읽기 차단
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
-- 되돌리기: docs/sql/2026-10-04-dm-rls-step1-rollback.sql
--
-- 왜 필요한가
--   2026-10-04 실측: 공개 anon 키만으로 team_pings 39행·team_ping_replies 56행이 전부 읽혔다
--   (HTTP 200, Content-Range 0-38/39 · 0-55/56). 현재 select 정책이 using(true) 이기 때문이다(PR #357 기록).
--   이 두 표에는 1:1 DM 본문, 마니또 익명 응원(보낸 사람 id 포함), 팀 채팅이 들어 있다.
--
-- 무엇을 하나
--   기존 정책은 하나도 지우거나 고치지 않는다. 대신 "anon 역할의 select 는 항상 거짓"인
--   RESTRICTIVE 정책을 하나씩 더한다. RESTRICTIVE 는 기존 허용(permissive) 정책과 AND 로 묶이므로
--   기존 정책 이름을 몰라도 anon 읽기만 정확히 막힌다. 로그인 사용자(authenticated)는 지금과 똑같다.
--
-- 바뀌지 않는 것
--   - 로그인 사용자의 읽기·쓰기 전부(정책 추가 대상이 anon 뿐)
--   - anon 의 insert(앱의 insert 는 결과를 돌려받지 않으므로 select 정책을 타지 않는다)
--   - 서비스 롤 API(api/**) — RLS 를 우회한다
--
-- 바뀌는 것(의도된 영향)
--   - Supabase 로그인 세션이 없는 사용자는 이 두 표를 더는 읽지 못한다:
--     게스트, 구글 직접 로그인(loginWithDirectIdentifier), 빠른 계정 복구 입장, 테스터 B 직통 입장.
--     이들은 이미 feed_posts 도 못 읽는다(2026-09-08-hidden-rls.sql 의 authenticated 조건).
--   - 같은 사용자들의 upsert(DM 대화방 부모 행·마니또 풀)는 기존 행과 충돌하면 실패할 수 있다
--     (ON CONFLICT DO UPDATE 는 기존 행에 select 정책을 적용한다). 앱은 오류를 경고로만 남긴다.

begin;

-- [0] RLS 가 켜져 있는지 먼저 확인. 꺼져 있으면 정책이 아무 효과가 없으므로 중단한다.
do $guard$
begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'team_pings' and c.relrowsecurity) then
    raise exception 'team_pings 의 RLS 가 꺼져 있습니다. 이 스크립트를 멈춥니다(세션에 알려 주세요).';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'team_ping_replies' and c.relrowsecurity) then
    raise exception 'team_ping_replies 의 RLS 가 꺼져 있습니다. 이 스크립트를 멈춥니다(세션에 알려 주세요).';
  end if;
end
$guard$;

-- [1] anon 읽기 차단
drop policy if exists es347_anon_no_select on public.team_pings;
create policy es347_anon_no_select on public.team_pings
  as restrictive for select to anon using (false);

drop policy if exists es347_anon_no_select on public.team_ping_replies;
create policy es347_anon_no_select on public.team_ping_replies
  as restrictive for select to anon using (false);

commit;

-- [확인] 아래 결과가 "anon 으로 보이는 행 수" 0, 0 이면 성공.
-- (set local role 은 이 확인 블록 안에서만 anon 으로 바꿔 본다. 끝나면 원래 역할로 돌아온다)
begin;
set local role anon;
select 'team_pings (anon 으로 보이는 행 수)' as 확인, count(*) as 수 from public.team_pings
union all
select 'team_ping_replies (anon 으로 보이는 행 수)', count(*) from public.team_ping_replies;
rollback;

select 'es347 1단계 정책 수(2 이어야 함)' as 확인, count(*) as 수
  from pg_policies
 where schemaname = 'public' and policyname = 'es347_anon_no_select'
   and tablename in ('team_pings', 'team_ping_replies');
