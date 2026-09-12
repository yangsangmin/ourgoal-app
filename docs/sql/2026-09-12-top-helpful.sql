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
