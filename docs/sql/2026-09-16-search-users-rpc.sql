-- 2026-09-16 동반자 닉네임 검색용 공개 조회 RPC (TASK-ES-104 후속 결함 수정)
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다(create or replace).
--
-- 왜 필요한가
--   js/team-invite-comm.js 의 "실제 사용자 닉네임 검색"이 클라이언트 anon/authenticated 키로
--   public.users 테이블을 직접 select 하는데, 이 테이블의 RLS는 2026-09-03부터
--   "auth.uid() = 본인 id" 행만 허용한다(users/goals/checkins 공통, dev_log.md 2026-09-03/09-10).
--   그래서 검색어가 정확히 일치해도 타인의 행은 DB 단에서 걸러져 항상 0건이 나온다.
--
--   RLS 정책 자체를 완화(예: for select using (true))하면 bio·interests·region 등
--   users 테이블 전체 컬럼이 모든 로그인 사용자에게 열려버려 노출 범위가 과도해진다.
--   대신 이 저장소의 기존 패턴(report_content, save_helpful_reason 등)과 동일하게
--   SECURITY DEFINER RPC 하나만 열어, 검색에 꼭 필요한 컬럼만 반환한다.
--   본인 행만 허용하는 기존 RLS 정책은 그대로 둔다 — 직접 select 경로는 계속 잠겨 있다.

create or replace function public.search_users_by_nickname(p_query text)
returns table (
  id uuid,
  nickname text,
  avatar_url text,
  bio text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select u.id,
         coalesce(u.display_name, u.username) as nickname,
         u.avatar_url,
         u.bio
  from public.users u
  where auth.uid() is not null
    and u.id <> auth.uid()                       -- 검색자 본인 제외: RLS가 아니라 필터로 막아야 의미가 있다
    and length(coalesce(trim(p_query), '')) >= 1  -- 빈 검색어로 전체 테이블 훑는 것 방지
    and (
      u.display_name ilike ('%' || p_query || '%')
      or u.username ilike ('%' || p_query || '%')
    )
  limit 20;
$fn$;

-- anon(비로그인)은 아예 실행 권한이 없다 → 게스트가 검색을 시도하면
-- 클라이언트가 permission-denied 에러를 받아 "결과 없음"이 아니라 "로그인이 필요합니다"로
-- 구분해서 보여줄 수 있다 (기존에는 RLS가 조용히 0건을 반환해 구분 자체가 불가능했다).
revoke execute on function public.search_users_by_nickname(text) from public;
revoke execute on function public.search_users_by_nickname(text) from anon;
grant  execute on function public.search_users_by_nickname(text) to authenticated;

-- [확인] 아래 행이 나오면 성공
select 'search_users_by_nickname 함수' as 확인, count(*) as 수 from pg_proc
  where proname = 'search_users_by_nickname';
