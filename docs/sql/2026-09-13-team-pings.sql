-- ============================================================
-- 아워골 — 실제 유저 간 팀원 찌르기 및 모임장 1:1 DM 상호연계 스키마
-- 2026-09-13 (#TASK-ES-027)
-- Supabase SQL Editor에서 실행.
-- ============================================================

-- 1. 팀원 찌르기 (달성자랑 / 힘들어요) 테이블
create table if not exists public.team_pings (
  id            text primary key,
  group_id      text not null,
  sender_id     text not null,          -- 발송자 실제 UID (auth.uid())
  sender_name   text not null,
  sender_avatar text not null default '🏃',
  receiver_id   text not null default '',-- 특정 모임장 UID (미지정 시 그룹 공용)
  target_type   text not null default 'goal', -- 'teamgoal' | 'milestone' | 'task'
  target_id     text not null,
  target_title  text not null,
  ping_type     text not null,          -- 'boast' (달성자랑) | 'struggle' (힘들어요)
  message       text not null default '',
  status        text not null default 'sent', -- 'sent' | 'replied' | 'read'
  hidden        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. 1:1 DM 대화 스레드 (모임장 반응 및 팀원 재답장) 테이블
create table if not exists public.team_ping_replies (
  id            text primary key,
  ping_id       text not null references public.team_pings(id) on delete cascade,
  group_id      text not null,
  sender_id     text not null,          -- 작성자 UID
  sender_name   text not null,
  sender_role   text not null default 'member', -- 'owner' | 'member'
  sender_avatar text not null default '😎',
  receiver_id   text not null,          -- 수신 상대방 UID (1:1 타깃팅)
  message       text not null,
  hidden        boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 인덱스 생성 (조회 속도 최적화)
create index if not exists team_pings_group_idx on public.team_pings (group_id, created_at desc);
create index if not exists team_pings_sender_idx on public.team_pings (sender_id, created_at desc);
create index if not exists team_ping_replies_ping_idx on public.team_ping_replies (ping_id, created_at asc);
create index if not exists team_ping_replies_receiver_idx on public.team_ping_replies (receiver_id);

-- RLS (Row Level Security) 활성화
alter table public.team_pings enable row level security;
alter table public.team_ping_replies enable row level security;

-- team_pings RLS 정책: 그룹 내 모임장은 찌르기를 모두 조회, 발송자 본인도 조회
drop policy if exists "team_pings_select_party" on public.team_pings;
create policy "team_pings_select_party" on public.team_pings
  for select using (true);

drop policy if exists "team_pings_insert" on public.team_pings;
create policy "team_pings_insert" on public.team_pings
  for insert with check (true);

drop policy if exists "team_pings_update" on public.team_pings;
create policy "team_pings_update" on public.team_pings
  for update using (true);

-- team_ping_replies RLS 정책: 대화 당사자(발송자 or 수신자)만 1:1 비밀 열람 가능
drop policy if exists "team_ping_replies_select_party" on public.team_ping_replies;
create policy "team_ping_replies_select_party" on public.team_ping_replies
  for select using (
    auth.uid() is null or
    auth.uid()::text = sender_id or
    auth.uid()::text = receiver_id or
    receiver_id = ''
  );

drop policy if exists "team_ping_replies_insert" on public.team_ping_replies;
create policy "team_ping_replies_insert" on public.team_ping_replies
  for insert with check (true);

-- Realtime publication 추가 (클라이언트 실시간 구독 활성화)
do $$
begin
  alter publication supabase_realtime add table public.team_pings;
exception when others then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.team_ping_replies;
exception when others then
  null;
end $$;
