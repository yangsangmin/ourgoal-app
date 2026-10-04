-- #TASK-ES-400 확인용 SELECT 만 (읽기 전용 — 아무것도 바꾸거나 지우지 않는다). 실행은 상민님 손(Supabase SQL Editor).
-- 배경: 수정 전 /api/push-subscribe 는 토큰 없이도 본문 userId 로 구독을 등록할 수 있었다.
-- 남의 이름으로 잘못 등록된 행은 표만 보고 확정할 수 없다(기기 주인을 표가 모른다). 아래는 의심 행을 좁히는 단서다.

-- 1) 전체 규모: 구독 행 수 · 구독이 있는 사용자 수
select count(*) as rows_total, count(distinct user_id) as users_with_subscription
from public.push_subscriptions;

-- 2) 사용자별 구독 기기 수와 푸시 서비스 종류 (한 사람에게 기기가 비정상적으로 많으면 의심)
select user_id,
       count(*) as endpoints,
       array_agg(distinct split_part(split_part(endpoint, '://', 2), '/', 1)) as push_hosts,
       min(updated_at) as first_updated,
       max(updated_at) as last_updated
from public.push_subscriptions
group by user_id
order by endpoints desc, last_updated desc
limit 50;

-- 3) 구독 갱신 시각이 그 사용자의 어떤 로그인 세션 기록보다도 이른 행 (세션 기록 없이 등록된 흔적 — 단서일 뿐 확정 아님)
select ps.user_id, split_part(split_part(ps.endpoint, '://', 2), '/', 1) as push_host, ps.updated_at,
       (select min(s.created_at) from auth.sessions s where s.user_id = ps.user_id) as first_session_at,
       (select count(*) from auth.sessions s where s.user_id = ps.user_id) as session_count
from public.push_subscriptions ps
where not exists (
  select 1 from auth.sessions s
  where s.user_id = ps.user_id and s.created_at <= ps.updated_at
)
order by ps.updated_at desc
limit 50;
