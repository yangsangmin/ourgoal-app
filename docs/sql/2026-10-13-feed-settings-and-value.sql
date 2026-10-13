-- ============================================================
-- 아워골 — 소통-피드 알고리즘 2단계: 설정표 feed_settings(+변경 기록) · 유익성 집계 RPC · 내 도움돼요 이유 분포
-- 2026-10-13 준비. (#TASK-ES-699, 본질 ③ 동류 발견·소통)
--
-- 왜 필요한가:
--  1) 가중치·상한·반감기를 코드 고정값(feed-rank.js DEFAULTS, 1단계 임시)이 아니라 서버 설정표에서 바꾸고,
--     바꾼 기록(누가·언제·전후값)을 남긴다 — 피드 노출 규범 6.
--  2) 유익성 V 의 입력(최근 30일 도움돼요 + 이유 태그 + 별로에요·조언)을 서버가 한 번에 집계해 준다.
--     content_reactions·helpful_reasons 는 RLS 로 본인 행만 보이므로 집계는 SECURITY DEFINER RPC 로만 가능.
--     가드(규범 8): 글쓴이 본인 반응 제외 · 봇 제외 · 가입 7일 미만 계정 반응 0.5 · 상호 맞주고받기(두 사람 사이 도움돼요가
--     반응자가 준 전체 도움돼요의 50% 초과) 제외.
--  3) 개인화 p_u: 내가 과거에 누른 도움돼요 이유 태그 분포(본인 행만, RLS 그대로).
--
-- 선행: docs/sql/2026-09-12-content-reactions.sql · 2026-09-12-helpful-reason.sql · 2026-10-13-feed-posts-category-columns.sql
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 전부 멱등. [손 필요]
-- 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 3-2·5-1절.
-- ============================================================

-- 1) 설정표 — 값은 jsonb. 읽기는 모두(설정은 비밀이 아니다), 쓰기는 service_role(SQL Editor)만.
create table if not exists public.feed_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.feed_settings enable row level security;
drop policy if exists feed_settings_read_all on public.feed_settings;
create policy feed_settings_read_all on public.feed_settings for select using (true);
-- insert/update/delete 정책 없음 → authenticated/anon 은 못 쓴다. service_role 만.

insert into public.feed_settings (key, value) values
  ('feed.enabled',   'true'::jsonb),
  ('feed.weights',   '{"wGoal":1.0,"wTeam":1.2,"wTopic":0.3,"wComp":0.7,"wStage":0.3,"rMin":0.2,"rMax":2.0,"activeDays":14,"activeW":1.0,"idleW":0.6}'::jsonb),
  ('feed.value',     '{"wH":0.6,"k":3,"a":0.5,"tagW":{"how_to":1.0,"new_info":1.0,"same_situation":0.8,"motivation":0.8,"other":0.5},"poorRatioPenalty":0.3,"poorPenalty":0.5,"adviceBonus":0.2,"vLabelMin":1.5}'::jsonb),
  ('feed.freshness', '{"tau0h":72,"tauMaxMult":3,"tauHelpfulDiv":5,"tauHelpfulCap":10,"staleDays":30}'::jsonb),
  ('feed.sections',  '{"team":3,"help":7,"peers":5,"widen":2,"teamHours":48,"dailyCap":30,"sameAuthorMax":2,"catShareMax":0.6,"coldstartMin":3}'::jsonb),
  ('feed.guards',    '{"newAccountDays":7,"newAccountW":0.5,"reciprocalMax":0.5,"windowDays":30}'::jsonb)
on conflict (key) do nothing;

-- 2) 변경 기록 — 설정표가 바뀔 때마다 트리거가 1행 남긴다(누가·언제·전후값). 지우지 않는다.
create table if not exists public.feed_settings_log (
  id         bigint generated always as identity primary key,
  key        text not null,
  before     jsonb,
  after      jsonb,
  changed_by text,
  reason     text,
  changed_at timestamptz not null default now()
);
alter table public.feed_settings_log enable row level security;
drop policy if exists feed_settings_log_read_all on public.feed_settings_log;
create policy feed_settings_log_read_all on public.feed_settings_log for select using (true);

create or replace function public.feed_settings_log_trigger()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    insert into public.feed_settings_log(key, before, after, changed_by, reason)
    values (new.key, null, new.value, coalesce(auth.uid()::text, current_user), current_setting('feed.change_reason', true));
    return new;
  elsif tg_op = 'UPDATE' then
    if new.value is distinct from old.value then
      insert into public.feed_settings_log(key, before, after, changed_by, reason)
      values (new.key, old.value, new.value, coalesce(auth.uid()::text, current_user), current_setting('feed.change_reason', true));
      new.updated_at := now();
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.feed_settings_log(key, before, after, changed_by, reason)
    values (old.key, old.value, null, coalesce(auth.uid()::text, current_user), current_setting('feed.change_reason', true));
    return old;
  end if;
  return null;
end;
$fn$;
drop trigger if exists trg_feed_settings_log on public.feed_settings;
create trigger trg_feed_settings_log
  before insert or update or delete on public.feed_settings
  for each row execute function public.feed_settings_log_trigger();

-- 설정을 바꿀 때(SQL Editor, service_role) 사유를 같이 남기는 법:
--   select set_config('feed.change_reason', '주간 리뷰: 도움돼요 비율 하락으로 wTeam 1.2→1.0', true);
--   update public.feed_settings set value = value || '{"wTeam":1.0}' where key = 'feed.weights';
-- 되돌리기: feed_settings_log 의 before 값을 다시 update 한다(그 변경도 기록된다).

-- 3) 설정 읽기 RPC — 한 번에 전부. 클라이언트는 10분에 한 번 읽어 feed-rank.js DEFAULTS 위에 덮어쓴다.
create or replace function public.feed_settings_get()
returns jsonb language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.feed_settings;
$fn$;
grant execute on function public.feed_settings_get() to authenticated, anon;

-- 4) 유익성 집계 RPC — 글 id 묶음에 대해 최근 p_days 일의 도움돼요(이유 태그별)·별로에요·응원·조언 수.
--    가드: 글쓴이 본인 반응 제외 · 봇 제외 · 가입 7일 미만 계정 반응은 0.5 · 상호 맞주고받기 제외.
--    helpful = 가드 전 실제 건수(라벨 표시용 실데이터), helpful_adj = 가드 적용 가중 합(점수용),
--    helpful_tags = {tag: 가드 적용 가중 합} (이유 없이 누른 것은 other).
create or replace function public.feed_value_counts(p_target_ids text[], p_days int default null)
returns table(target_id text, helpful int, helpful_adj numeric, helpful_tags jsonb, poor int, cheer int, advice int)
language sql stable security definer set search_path = public as $fn$
  with g as (
    select coalesce((select (value->>'newAccountDays')::int from public.feed_settings where key = 'feed.guards'), 7) as new_days,
           coalesce((select (value->>'newAccountW')::numeric from public.feed_settings where key = 'feed.guards'), 0.5) as new_w,
           coalesce((select (value->>'reciprocalMax')::numeric from public.feed_settings where key = 'feed.guards'), 0.5) as recip_max,
           coalesce(p_days, (select (value->>'windowDays')::int from public.feed_settings where key = 'feed.guards'), 30) as days
  ),
  rx as (
    select r.target_id, r.user_id as reactor, p.user_id as author, r.type, r.created_at,
           case when au.created_at > now() - make_interval(days => (select new_days from g)) then (select new_w from g) else 1.0 end as w
      from public.content_reactions r
      join public.feed_posts p on p.id = r.target_id
      left join public.users u on u.id = r.user_id
      left join auth.users au on au.id = r.user_id
     where r.target_id = any(p_target_ids)
       and r.target_type = 'feed_post'
       and r.deleted_at is null
       and r.created_at >= now() - make_interval(days => (select days from g))
       and r.target_id not like 'sim\_%' escape '\'
       and coalesce(u.is_bot, false) = false
       and r.user_id <> p.user_id                       -- 글쓴이 본인 반응 제외
  ),
  given as (                                            -- 반응자가 창 안에 준 도움돼요 전체(상호성 분모)
    select r.user_id as reactor, count(*)::numeric as total
      from public.content_reactions r
     where r.type = 'helpful' and r.deleted_at is null
       and r.created_at >= now() - make_interval(days => (select days from g))
     group by r.user_id
  ),
  pair as (                                             -- 반응자 → 글쓴이 도움돼요 수 + 글쓴이 → 반응자 도움돼요 수
    select a.reactor, a.author,
           count(*)::numeric as a_to_b,
           (select count(*) from public.content_reactions r2 join public.feed_posts p2 on p2.id = r2.target_id
             where r2.type = 'helpful' and r2.deleted_at is null and r2.user_id = a.author and p2.user_id = a.reactor
               and r2.created_at >= now() - make_interval(days => (select days from g)))::numeric as b_to_a
      from rx a where a.type = 'helpful'
     group by a.reactor, a.author
  ),
  recip as (                                            -- 상호 맞주고받기: 둘 다 주고받았고, 이 쌍이 반응자 전체의 recip_max 초과
    select p.reactor, p.author
      from pair p join given gv on gv.reactor = p.reactor
     where p.b_to_a > 0 and (p.a_to_b / nullif(gv.total, 0)) > (select recip_max from g)
  ),
  hx as (
    select x.target_id, x.reactor, x.w,
           coalesce(h.reason_tag, 'other') as tag,
           case when exists (select 1 from recip rc where rc.reactor = x.reactor and rc.author = x.author) then 0 else 1 end as keep
      from rx x
      left join public.helpful_reasons h on h.target_type = 'feed_post' and h.target_id = x.target_id and h.user_id = x.reactor and h.deleted_at is null
     where x.type = 'helpful'
  ),
  tags as (
    select target_id, jsonb_object_agg(tag, s) as helpful_tags
      from (select target_id, tag, sum(w * keep) as s from hx group by target_id, tag) t
     group by target_id
  )
  select ids.id as target_id,
         (select count(*)::int from hx where hx.target_id = ids.id) as helpful,
         coalesce((select sum(w * keep) from hx where hx.target_id = ids.id), 0)::numeric as helpful_adj,
         coalesce((select helpful_tags from tags where tags.target_id = ids.id), '{}'::jsonb) as helpful_tags,
         (select count(*)::int from rx where rx.target_id = ids.id and rx.type = 'poor') as poor,
         (select count(*)::int from rx where rx.target_id = ids.id and rx.type = 'cheer') as cheer,
         (select count(*)::int from rx where rx.target_id = ids.id and rx.type = 'advice') as advice
    from unnest(p_target_ids) as ids(id);
$fn$;
grant execute on function public.feed_value_counts(text[], int) to authenticated;

-- 5) 내 도움돼요 이유 분포(개인화 p_u) — 본인 행만(RLS), 비율 0~1. 누른 적 없으면 {}.
create or replace function public.my_helpful_tag_profile()
returns jsonb language sql stable security invoker set search_path = public as $fn$
  with mine as (
    select reason_tag, count(*)::numeric as n
      from public.helpful_reasons
     where user_id = auth.uid() and deleted_at is null
     group by reason_tag
  ), tot as (select sum(n) as t from mine)
  select coalesce((select jsonb_object_agg(reason_tag, round(n / nullif((select t from tot), 0), 3)) from mine), '{}'::jsonb);
$fn$;
grant execute on function public.my_helpful_tag_profile() to authenticated;

-- 확인용(선택):
-- select public.feed_settings_get();
-- select * from public.feed_value_counts(array[(select id from public.feed_posts order by created_at desc limit 1)]);
-- select public.my_helpful_tag_profile();
-- select * from public.feed_settings_log order by changed_at desc limit 5;
