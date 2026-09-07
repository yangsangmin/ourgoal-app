-- 2026-09-06 계측 이벤트 테이블 (성장 백로그 P0 ①온보딩 퍼널 ②유입 채널 UTM/ref ③알림 클릭률)
-- Supabase SQL Editor에서 1회 실행. 실행 전에는 클라이언트 계측이 조용히 실패(404)할 뿐 앱 동작에는 영향 없음.

create table if not exists public.events (
  id         bigint generated always as identity primary key,
  sid        text,                                   -- 기기별 익명 세션 id (서버 발생 이벤트는 null). user_id는 저장하지 않는다
  name       text not null,                          -- landing_view · signup · goal_created · checkin · notification_sent · notification_clicked · content_reported
  props      jsonb not null default '{}'::jsonb,     -- 작은 속성만 (utm_source/utm_medium/utm_campaign/ref, source, first, channel ...)
  created_at timestamptz not null default now()
);

create index if not exists events_name_created_idx on public.events (name, created_at desc);
create index if not exists events_sid_idx on public.events (sid);

alter table public.events enable row level security;

-- 클라이언트(anon/authenticated)는 삽입만 가능하고 조회는 불가. 조회·집계는 대시보드(service_role)에서만.
drop policy if exists events_insert_client on public.events;
create policy events_insert_client on public.events
  for insert to anon, authenticated
  with check (true);

-- 퍼널 확인용 예시 쿼리 (SQL Editor에서):
-- select name, count(*) from public.events where created_at > now() - interval '7 days' group by name order by 2 desc;
-- select props->>'utm_source' as src, count(distinct sid) from public.events where name='landing_view' group by 1 order by 2 desc;
-- select (select count(*) from public.events where name='notification_clicked')::float
--      / nullif((select count(*) from public.events where name='notification_sent'),0) as push_ctr;
