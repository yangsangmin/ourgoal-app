-- ============================================================
-- 아워골 — 소통-피드 알고리즘 0단계: feed_posts 메타 칸 · 카테고리 함수 · 채우기 RPC
-- 2026-10-13 준비. (#TASK-ES-696, 본질 ③ 동류 발견·소통)
--
-- 왜 필요한가: 피드가 "이 글이 이 사람의 목표에 도움이 되는가"를 판단하려면 글에
-- 카테고리·바탕 목표·팀·글 유형·진행률이 서버 컬럼으로 있어야 한다. 지금은 extra.category 하나뿐이고
-- 그 값도 목표 사전(6 대범위/35 중범위)과 피드 사전(18키)이 달라 대부분 'study' 로 떨어져 있다.
--
-- 이 파일의 매핑표는 js/data/category-map.js 와 내용이 같아야 한다(tests/feed-category-map.test.js 가 대조).
--
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 전부 멱등(if not exists / or replace). [손 필요]
-- 실행 뒤: select * from public.feed_posts_backfill_category(500); 를 remaining 이 0 이 될 때까지 반복.
-- 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 3-4·3-5·4절 (Claude Docs, 2026-10-13).
-- ============================================================

-- 1) feed_posts 메타 칸 7개 (전부 nullable — 과거 글은 채우기 RPC 가 메운다, 못 찾으면 null 그대로)
alter table public.feed_posts add column if not exists category text
  check (category is null or category in ('study','dev','workout','running','diet','career','sideproject','finance','life','morning','parenting','pet','relation','reading','hobby','mental','clean','travel'));
alter table public.feed_posts add column if not exists goal_id text;
alter table public.feed_posts add column if not exists group_id text;
alter table public.feed_posts add column if not exists content_type text
  check (content_type is null or content_type in ('record','howto','question','milestone','team_done'));
alter table public.feed_posts add column if not exists author_pct int
  check (author_pct is null or (author_pct >= 0 and author_pct <= 100));
alter table public.feed_posts add column if not exists topic text;
alter table public.feed_posts add column if not exists goal_visibility text
  check (goal_visibility is null or goal_visibility in ('public','theme','team','private','followers'));

create index if not exists idx_feed_posts_category_created on public.feed_posts(category, created_at desc) where coalesce(hidden, false) = false;
create index if not exists idx_feed_posts_group_created    on public.feed_posts(group_id, created_at desc) where group_id is not null;

-- 2) 연결 출처 칸 — 피드에서 시작된 동반자 추가·팀 초대를 셀 수 있게 (지표 "피드에서 시작된 연결 수")
alter table public.team_pings add column if not exists source text;

-- 3) 매핑표 — 목표 대범위/중범위 → 피드 키 (js/data/category-map.js TOPIC_MAP 과 같은 35행)
create table if not exists public.feed_topic_map (
  major text not null,
  sub   text not null,
  feed_key text not null,
  primary key (major, sub)
);
insert into public.feed_topic_map(major, sub, feed_key) values
  ('health', '헬스·근력', 'workout'), ('health', '러닝·마라톤', 'running'), ('health', '다이어트', 'diet'), ('health', '요가·필라테스', 'workout'),
  ('health', '등산·아웃도어', 'travel'), ('health', '식단·영양', 'diet'), ('health', '구기·라켓', 'workout'),
  ('study', '어학', 'study'), ('study', '자격증·시험', 'study'), ('study', '대학·입시', 'study'), ('study', '코딩·개발', 'dev'), ('study', '독서', 'reading'), ('study', '대학원·연구', 'study'),
  ('career', '이직·취업', 'career'), ('career', '창업·사업', 'sideproject'), ('career', '사이드 프로젝트', 'sideproject'), ('career', '재테크·투자', 'finance'), ('career', '절약·가계부', 'finance'),
  ('hobby', '글쓰기', 'hobby'), ('hobby', '음악·악기', 'hobby'), ('hobby', '그림·디자인', 'hobby'), ('hobby', '사진·영상', 'hobby'), ('hobby', '요리·베이킹', 'hobby'), ('hobby', '공예·DIY', 'hobby'),
  ('mind', '명상·멘탈케어', 'mental'), ('mind', '기상·수면', 'morning'), ('mind', '금연·금주', 'life'), ('mind', '미니멀·정리', 'clean'), ('mind', '일기·회고', 'mental'),
  ('relation', '육아', 'parenting'), ('relation', '반려동물', 'pet'), ('relation', '연애·결혼', 'relation'), ('relation', '가족', 'relation'), ('relation', '봉사·커뮤니티', 'relation'), ('relation', '여행', 'travel')
on conflict (major, sub) do update set feed_key = excluded.feed_key;

-- 4) 대범위 정규화 — goal.category 에 들어오는 한글 라벨·영문 키 → 대범위 (category-map.js LABEL_TO_MAJOR)
create or replace function public.feed_major_of(p_value text)
returns text language sql immutable as $fn$
  select case trim(coalesce(p_value, ''))
    when 'health' then 'health' when 'study' then 'study' when 'career' then 'career'
    when 'hobby' then 'hobby' when 'mind' then 'mind' when 'relation' then 'relation'
    when '운동/건강' then 'health' when '운동·건강' then 'health'
    when '학습/성장' then 'study' when '학습·자격' then 'study'
    when '커리어' then 'career' when '커리어/머니' then 'career' when '커리어·머니' then 'career'
    when '습관/루틴' then 'mind' when '마음·습관' then 'mind'
    when '취미·창작' then 'hobby'
    when '관계·생활' then 'relation' when '관계/생활' then 'relation'
    else null end;
$fn$;

-- 5) 대범위 기본값 (category-map.js TOPIC_MAP[major].default)
create or replace function public.feed_major_default(p_major text)
returns text language sql immutable as $fn$
  select case p_major
    when 'health' then 'workout'
    when 'study' then 'study'
    when 'career' then 'career'
    when 'hobby' then 'hobby'
    when 'mind' then 'mental'
    when 'relation' then 'relation'
    else null end;
$fn$;

-- 6) 제목·본문 정규식 — category-map.js TEXT_RULES 와 같은 순서(좁은 키 먼저)
create or replace function public.feed_text_category(p_text text)
returns text language sql immutable as $fn$
  select case
    when p_text is null or trim(p_text) = '' then null
    when p_text ~* '러닝|달리기|마라톤|조깅|페이스트레이닝|10k|하프마라톤|풀코스' then 'running'
    when p_text ~* '식단|다이어트|칼로리|단백질|클린식단|간헐적단식|체중|샐러드' then 'diet'
    when p_text ~* '운동|헬스|체력|바디프로필|웨이트|필라테스|테니스|수영|인터벌|근력' then 'workout'
    when p_text ~* '개발|코딩|깃허브|알고리즘|오픈소스|백준|디자인|ui|ux|saas|프론트|백엔드' then 'dev'
    when p_text ~* '독서|서평|인문|독서모임|완독|필사|리딩' then 'reading'
    when p_text ~* '토익|공부|시험|자격증|수험|독서실|회독|강의|leet|cpa|노무사|간호|국시|기출' then 'study'
    when p_text ~* '사이드프로젝트|창업|수익화|bm|출시|런칭' then 'sideproject'
    when p_text ~* '재테크|투자|주식|저축|가계부|부동산|예금|펀드|자산' then 'finance'
    when p_text ~* '취업|인턴|이직|매출|사업|마케터|세일즈|영업|스타트업|hr|포트폴리오|이력서|면접|직무|승진' then 'career'
    when p_text ~* '기상|모닝루틴|미라클모닝|새벽기상|기상인증|아침시간|수면패턴' then 'morning'
    when p_text ~* '정리|청소|미니멀|비우기|청결|방청소|분리수거' then 'clean'
    when p_text ~* '멘탈|마인드|명상|일기|감사|회고|스트레스|휴식|힐링|마음' then 'mental'
    when p_text ~* '육아|자녀|아이|등하원|이유식|부모|어린이집|유치원' then 'parenting'
    when p_text ~* '반려동물|강아지|고양이|반려견|반려묘|펫' then 'pet'
    when p_text ~* '여행|아웃도어|등산|캠핑|트레킹|나들이|휴가' then 'travel'
    when p_text ~* '인간관계|가족|친구|연애|결혼|소통|대화|부부' then 'relation'
    when p_text ~* '음악|그림|공연|웹툰|댄스|사진|자작곡|뮤지컬|베이커리|로스팅|공예' then 'hobby'
    when p_text ~* '생활|습관|루틴|일상|규칙|절제|라이프|하루' then 'life'
    else null end;
$fn$;

-- 7) 한 글의 피드 카테고리 — 입력 우선순위: topic(대범위/중범위) → 이미 피드 키 → category 라벨 → 제목·본문 정규식 → null
--    (category-map.js resolve() 와 같다. life 로 메우지 않는다.)
create or replace function public.feed_category_of(p_topic text, p_category text, p_title text, p_caption text)
returns text language plpgsql immutable as $fn$
declare
  v_major text;
  v_sub   text;
  v_key   text;
begin
  if p_topic is not null and trim(p_topic) <> '' then
    v_major := trim(split_part(p_topic, '/', 1));
    v_sub   := trim(substring(p_topic from position('/' in p_topic) + 1));
    if position('/' in p_topic) = 0 then v_sub := ''; end if;
    if public.feed_major_default(v_major) is null then v_major := public.feed_major_of(v_major); end if;
    if v_major is not null then
      select m.feed_key into v_key from public.feed_topic_map m where m.major = v_major and m.sub = v_sub;
      if v_key is not null then return v_key; end if;
      return public.feed_major_default(v_major);
    end if;
  end if;
  if p_category in ('study','dev','workout','running','diet','career','sideproject','finance','life','morning','parenting','pet','relation','reading','hobby','mental','clean','travel') then
    return p_category;
  end if;
  v_major := public.feed_major_of(p_category);
  if v_major is not null then return public.feed_major_default(v_major); end if;
  return public.feed_text_category(coalesce(p_title, '') || ' ' || coalesce(p_caption, ''));
end;
$fn$;

-- 8) 과거 글 채우기 — feed_posts 에 UPDATE 정책이 없어(select/insert/delete 만) SECURITY DEFINER RPC 로만 한다.
--    extra 에 남아 있는 category/topic/goalId/groupId/contentType/goalPct/goalVisibility 를 먼저 쓰고, 없으면 함수로 추정.
--    팀 완주 글의 extra.category='team' 은 피드 키가 아니므로 topic·제목으로 다시 판정한다.
--    권한: service_role(SQL Editor) 전용. 결과는 (updated, remaining, still_null).
create or replace function public.feed_posts_backfill_category(p_limit int default 500)
returns table(updated int, remaining int, still_null int)
language plpgsql security definer set search_path = public as $fn$
declare
  v_updated int := 0;
begin
  with cand as (
    select id from public.feed_posts
     where category is null
       and coalesce(extra->>'_catTried', '') <> '1'
     order by created_at desc
     limit greatest(1, least(p_limit, 5000))
  ), upd as (
    update public.feed_posts p
       set category = public.feed_category_of(coalesce(p.topic, p.extra->>'topic'), p.extra->>'category', p.goal_title, p.caption),
           topic = coalesce(p.topic, nullif(p.extra->>'topic', '')),
           goal_id = coalesce(p.goal_id, nullif(p.extra->>'goalId', '')),
           group_id = coalesce(p.group_id, nullif(p.extra->>'groupId', '')),
           content_type = coalesce(p.content_type,
             case when p.extra->>'contentType' in ('record','howto','question','milestone','team_done') then p.extra->>'contentType'
                  when coalesce(p.extra->>'isTeamCompletion', 'false') = 'true' then 'team_done'
                  else 'record' end),
           author_pct = coalesce(p.author_pct,
             case when (p.extra->>'goalPct') ~ '^[0-9]+(\.[0-9]+)?$' then least(100, greatest(0, round((p.extra->>'goalPct')::numeric)))::int else null end),
           goal_visibility = coalesce(p.goal_visibility,
             case when p.extra->>'goalVisibility' in ('public','theme','team','private','followers') then p.extra->>'goalVisibility' else null end),
           extra = coalesce(p.extra, '{}'::jsonb) || jsonb_build_object('_catTried', '1')
      from cand
     where p.id = cand.id
    returning 1
  )
  select count(*) into v_updated from upd;

  return query
    select v_updated,
           (select count(*)::int from public.feed_posts where category is null and coalesce(extra->>'_catTried', '') <> '1'),
           (select count(*)::int from public.feed_posts where category is null and coalesce(extra->>'_catTried', '') = '1');
end;
$fn$;
revoke execute on function public.feed_posts_backfill_category(int) from public, anon, authenticated;

-- 9) 글쓴이가 자기 글 카테고리를 고친다 (UPDATE 정책이 없으므로 RPC). 남의 글은 거절.
create or replace function public.feed_post_set_category(p_post_id text, p_category text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_category not in ('study','dev','workout','running','diet','career','sideproject','finance','life','morning','parenting','pet','relation','reading','hobby','mental','clean','travel') then
    raise exception 'bad category';
  end if;
  select user_id into v_owner from public.feed_posts where id = p_post_id;
  if v_owner is null then raise exception 'no such post'; end if;
  if v_owner <> v_uid then raise exception 'not the author'; end if;
  update public.feed_posts
     set category = p_category,
         extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('category', p_category)
   where id = p_post_id;
  return jsonb_build_object('ok', true, 'id', p_post_id, 'category', p_category);
end;
$fn$;
grant execute on function public.feed_post_set_category(text, text) to authenticated;

-- 확인용(선택):
-- select category, count(*) from public.feed_posts group by 1 order by 2 desc;
-- select public.feed_category_of('health/러닝·마라톤', 'health', null, null);   -- running
-- select public.feed_category_of(null, '운동/건강', null, null);                -- workout
-- select public.feed_category_of(null, '일반', '정체불명', '');                 -- null
