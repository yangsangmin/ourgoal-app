-- 2026-10-05 #TASK-ES-421 K-XP1 — EXP 서버 원장 표(user_ledger_docs) 만들기
-- 상민님 결심 원문(2026-10-05): "레벨 서버에 저장해야지" — 승인선 ② 개인정보 수집 확대 승인. 조건: 본인만 읽는 표, 백업 먼저, 이관 확인 뒤 기기 쓰기 중단.
-- 설계: docs/specs/LEDGER-DESIGN-2026-10-04.md 부록 A-2 · docs/specs/REQ-TASK-ES-421-XP-SERVER-LEDGER.md
-- 여러 번 돌려도 안전하다(if not exists · drop policy if exists · create or replace). 데이터를 지우는 문장은 없다.
-- 되돌리기: docs/sql/2026-10-05-xp-ledger-rollback.sql (쓰기 권한만 거두고 표·행은 남긴다)
--
-- 설계서(부록 A-2)와 다른 점과 이유
--   - user_id 형: 설계서는 text 로 가정했으나 운영 users.id 가 uuid(2026-10-05 실측) → uuid.
--   - 접근 경로: 설계서는 "정책 없음 + /api 서비스 롤"이었으나, 결심 조건 "본인만 읽는 표"를 DB 가 직접 지키도록
--     로그인 사용자(authenticated) 본인 행만 select·insert·update 하는 정책 3개를 둔다. delete 정책은 없다(탈퇴 파기는 서비스 롤).
--   - anon 은 표 권한 자체가 없다(revoke all). 정책이 아니라 권한에서 막는다.
--   - 외래키를 두지 않는다: auth.users 를 가리키는 외래키가 생기면 매일 자동 파기 함수가 'UNCOVERED_FK' 로 멈추므로,
--     대신 파기 대상 목록(ourgoal_private.account_purge_targets, api/withdraw.js PURGE_TARGETS)에 이 표를 더한다.
--   - 덮어쓰기 이력 표(user_ledger_docs_history)는 이번에 만들지 않는다: EXP 합치기 규칙이 줄어들지 않는 방향(합집합)이고,
--     기기에 이관 직전 원본(ourgoal_xp_premigration_<uid>)을 남긴다. 이력 표는 다른 문서(prefs 등) 이관 때 다시 판단한다.

begin;

create table if not exists public.user_ledger_docs (
  user_id    uuid        not null,
  doc_key    text        not null,
  data       jsonb       not null default '{}'::jsonb,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now(),
  device_id  text,
  primary key (user_id, doc_key)
);

-- 문서 이름은 소문자·밑줄 32자까지, 문서 크기는 256KB 까지(EXP 이력 200건은 약 20KB).
do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_ledger_docs_doc_key_chk') then
    alter table public.user_ledger_docs add constraint user_ledger_docs_doc_key_chk check (doc_key ~ '^[a-z][a-z0-9_]{0,31}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_ledger_docs_size_chk') then
    alter table public.user_ledger_docs add constraint user_ledger_docs_size_chk check (octet_length(data::text) <= 262144);
  end if;
end
$c$;

-- 판 번호(rev)와 시각은 서버가 매긴다: 갱신할 때마다 rev+1, updated_at=now(). 앱은 "내가 읽은 판"과 같을 때만 갱신한다(동시 쓰기 감지).
create or replace function public.user_ledger_docs_bump()
returns trigger
language plpgsql
set search_path = public
as $f$
begin
  if tg_op = 'UPDATE' then
    new.rev := old.rev + 1;
  else
    new.rev := 1;
  end if;
  new.updated_at := now();
  return new;
end
$f$;

drop trigger if exists user_ledger_docs_bump on public.user_ledger_docs;
create trigger user_ledger_docs_bump
  before insert or update on public.user_ledger_docs
  for each row execute function public.user_ledger_docs_bump();

alter table public.user_ledger_docs enable row level security;

revoke all on public.user_ledger_docs from anon;
revoke all on public.user_ledger_docs from public;
revoke all on public.user_ledger_docs from authenticated;
grant select, insert, update on public.user_ledger_docs to authenticated;

drop policy if exists uld_select_own on public.user_ledger_docs;
create policy uld_select_own on public.user_ledger_docs
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists uld_insert_own on public.user_ledger_docs;
create policy uld_insert_own on public.user_ledger_docs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists uld_update_own on public.user_ledger_docs;
create policy uld_update_own on public.user_ledger_docs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 탈퇴 파기 대상에 이 표를 더한다(설치 SQL docs/sql/2026-10-04-account-purge-install.sql · api/withdraw.js 와 같은 목록).
-- 자동 파기 함수가 운영에 있을 때만 바꾼다.
do $p$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'ourgoal_private' and p.proname = 'account_purge_targets') then
    execute $def$
create or replace function ourgoal_private.account_purge_targets()
returns table(ord int, tbl text, col text)
language sql
immutable
as $targets$
  values
    (1,  'team_ping_replies', 'sender_id'),
    (2,  'team_pings',        'sender_id'),
    (3,  'team_comments',     'user_id'),
    (4,  'content_reports',   'reporter_id'),
    (5,  'content_reactions', 'user_id'),
    (6,  'helpful_reasons',   'user_id'),
    (7,  'user_blocks',       'blocker_id'),
    (8,  'user_blocks',       'blocked_id'),
    (9,  'template_copies',   'copier_user_id'),
    (10, 'credit_ledger',     'user_id'),
    (11, 'push_subscriptions','user_id'),
    (12, 'inquiries',         'user_id'),
    (13, 'app_evaluations',   'user_id'),
    (14, 'user_action_logs',  'user_id'),
    (15, 'user_interactions', 'user_id'),
    (16, 'goals_backup',      'user_id'),
    (17, 'checkins_backup',   'user_id'),
    (18, 'feed_posts',        'user_id'),
    (19, 'checkins',          'user_id'),
    (20, 'goals',             'user_id'),
    (21, 'user_ledger_docs',  'user_id'),
    (22, 'users',             'id')
$targets$;
$def$;
  end if;
end
$p$;

commit;

-- [확인] 정책 수 3, anon 이 보는 행 0, anon 표 권한 0 이면 성공.
select 'uld 정책 수(3 이어야 함)' as 확인, count(*)::text as 값
  from pg_policies where schemaname = 'public' and tablename = 'user_ledger_docs'
union all
select 'anon 표 권한 수(0 이어야 함)', count(*)::text
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'user_ledger_docs' and grantee = 'anon'
union all
select 'RLS 켜짐(true 이어야 함)', c.relrowsecurity::text
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname = 'user_ledger_docs'
union all
select '파기 대상에 포함(1 이어야 함)', count(*)::text
  from ourgoal_private.account_purge_targets() t where t.tbl = 'user_ledger_docs';
