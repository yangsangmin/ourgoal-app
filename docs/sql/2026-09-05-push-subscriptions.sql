-- Web Push 구독 테이블 (PR #34에서 안내된 SQL을 저장소에 보존 + RLS 추가)
-- 2026-09-06 21:00 프로덕션 Supabase에 실행 완료. 새 환경을 만들 때 1회 실행.
-- 접근 주체는 서버(service_role: api/push-subscribe.js, api/push-dispatch.js)뿐이므로
-- RLS를 켜고 클라이언트(anon/authenticated) 정책은 두지 않는다.

create table if not exists public.push_subscriptions (
  endpoint      text primary key,
  user_id       uuid not null references public.users(id) on delete cascade,
  p256dh        text not null,
  auth          text not null,
  checkin_times jsonb not null default '[]'::jsonb,   -- ["09:00","21:30"] 사용자 체크인 시각
  timezone      text not null default 'Asia/Seoul',
  sent_slots    jsonb not null default '[]'::jsonb,   -- "YYYY-MM-DD_HH:MM" 중복 발송 방지 슬롯(최근 N개)
  updated_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- 필요한 Vercel 환경변수(Production): SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET
-- GitHub Actions: Secret CRON_SECRET(위와 동일 값), Variable PUSH_DISPATCH_URL=https://ourgoal-app.vercel.app/api/push-dispatch
