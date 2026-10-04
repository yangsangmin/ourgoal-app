-- [#TASK-ES-351] 탈퇴 신청 30일 후 계정·데이터 영구 파기 — 설치 (예약은 꺼진 채로 설치된다)
--
-- 무엇을 만드나
--   1) 비공개 스키마 ourgoal_private (API·anon·authenticated 에 노출하지 않음)
--   2) 실행 기록 표 ourgoal_private.account_purge_runs — 누가(cron/manual)·언제·몇 건만. 사용자 id·이메일은 남기지 않는다
--   3) 파기 함수 ourgoal_private.account_purge_run(p_mode, p_limit, p_run_by)
--        p_mode = 'dry-run' : 대상 계정 수·표별 행 수만 센다. 아무것도 지우지 않는다
--        p_mode = 'purge'   : 대상 계정을 한 계정씩(계정 단위 원자적) 지우고, 끝난 뒤 같은 조건으로 다시 세어
--                             잔여 0건·실패 0건일 때만 ok=true. 못 센 것은 null(=실패)
--      대상 조건: auth.users.raw_app_meta_data->>'deletion_requested_at' 이 지금보다 30일 이상 전인 계정만.
--      (이 칸은 서비스롤만 쓸 수 있다 — api/withdraw.js 의 request 모드가 쓰고 restore 모드가 지운다)
--      한 번에 최대 50계정. 50 보다 큰 값을 줘도 50 으로 묶인다.
--   4) pg_cron 예약 'ourgoal-account-purge-daily' (매일 03:30 KST = 18:30 UTC) — **꺼진 상태(active=false)로** 만든다.
--      켜기는 dry-run 결과를 확인한 뒤 2026-10-04-account-purge-enable.sql 로 한다.
--
-- 되돌리기: 2026-10-04-account-purge-rollback.sql
-- 확인 쿼리: 2026-10-04-account-purge-check.sql
-- 로컬 시험: 2026-10-04-account-purge-test.mjs (PGlite — 실서버 아님)

begin;

create extension if not exists pg_cron;

create schema if not exists ourgoal_private;
revoke all on schema ourgoal_private from public;
do $grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema ourgoal_private from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema ourgoal_private from authenticated';
  end if;
end
$grants$;

-- 실행 기록: 건수만. 사용자 id·이메일·오류 상세 문구(키 값이 들어갈 수 있음)는 남기지 않고 SQLSTATE 코드만 남긴다.
create table if not exists ourgoal_private.account_purge_runs (
  id            bigserial primary key,
  ran_at        timestamptz not null default now(),
  run_by        text not null,
  db_user       text not null default current_user,
  mode          text not null,
  batch_limit   int not null,
  due_total     int,
  processed     int not null default 0,
  purged        int not null default 0,
  skipped       int not null default 0,
  failed        int not null default 0,
  rows_by_table jsonb not null default '{}'::jsonb,
  remaining_total bigint,
  uncovered     jsonb not null default '[]'::jsonb,
  legacy_pending int,
  error_codes   text[] not null default '{}',
  ok            boolean not null default false
);
revoke all on ourgoal_private.account_purge_runs from public;

-- 파기 대상 표·칸 (자식 → 부모). api/withdraw.js 의 PURGE_TARGETS 와 같은 목록이다(scripts/test-account-purge.js 가 대조).
-- 운영에 없는 표·칸은 실행 때 건너뛰고(rows_by_table 에 나오지 않음), 이 목록에 없는 '사용자 참조 외래키'가 있으면 purge 를 거부한다.
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
    (21, 'users',             'id')
$targets$;

-- 잘못된 시각 문자열은 오류로 전체를 멈추지 않고 null(=대상 아님)로 읽는다.
create or replace function ourgoal_private.try_ts(p text)
returns timestamptz
language plpgsql
stable
as $tryts$
begin
  return p::timestamptz;
exception when others then
  return null;
end;
$tryts$;

-- 대상 표·칸이 실제로 있는지
create or replace function ourgoal_private.target_exists(p_tbl text, p_col text)
returns boolean
language sql
stable
as $texists$
  select exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = p_tbl and column_name = p_col
  )
$texists$;

-- 사용자 칸 대신 jsonb 안에 사용자 id 를 담는 표: events 의 settings_ledger·companion_ledger 행(api/track.js 가 props.userId 로 씀).
-- 익명 행(props 에 userId 없음)은 건드리지 않는다. api/withdraw.js 의 PURGE_JSON_TARGETS 와 같은 목록이다.
create or replace function ourgoal_private.account_purge_json_targets()
returns table(ord int, tbl text, col text, json_key text)
language sql
immutable
as $jtargets$
  values
    (1, 'events', 'props', 'userId'),
    (2, 'events', 'props', 'user_id')
$jtargets$;

-- 한 계정의 대상 표 행 수(잔여 측정). 표가 없으면 그 표는 세지 않는다.
create or replace function ourgoal_private.account_rows_left(p_uid uuid)
returns bigint
language plpgsql
stable
set search_path = pg_catalog, public
as $rowsleft$
declare
  t record;
  n bigint;
  total bigint := 0;
begin
  for t in select * from ourgoal_private.account_purge_targets() order by ord loop
    if ourgoal_private.target_exists(t.tbl, t.col) then
      execute format('select count(*) from public.%I where %I::text = $1', t.tbl, t.col) into n using p_uid::text;
      total := total + n;
    end if;
  end loop;
  for t in select * from ourgoal_private.account_purge_json_targets() order by ord loop
    if ourgoal_private.target_exists(t.tbl, t.col) then
      execute format('select count(*) from public.%I where %I->>%L = $1', t.tbl, t.col, t.json_key) into n using p_uid::text;
      total := total + n;
    end if;
  end loop;
  select total + count(*) into total from auth.users where id = p_uid;
  if to_regclass('auth.audit_log_entries') is not null then
    execute 'select count(*) from auth.audit_log_entries where payload->>''actor_id'' = $1' into n using p_uid::text;
    total := total + n;
  end if;
  return total;
end;
$rowsleft$;

create or replace function ourgoal_private.account_purge_run(
  p_mode   text default 'dry-run',
  p_limit  int  default 50,
  p_run_by text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $purge$
declare
  v_limit      int := least(greatest(coalesce(p_limit, 50), 1), 50);
  v_cutoff     timestamptz := now() - interval '30 days';
  v_due_total  int;
  v_legacy     int;
  v_uncovered  jsonb;
  v_uid        uuid;
  v_uids       uuid[] := '{}';
  t            record;
  n            bigint;
  v_rows       jsonb := '{}'::jsonb;
  v_acc        jsonb;
  v_key        text;
  v_left       bigint;
  v_remaining  bigint := 0;
  v_processed  int := 0;
  v_purged     int := 0;
  v_skipped    int := 0;
  v_failed     int := 0;
  v_codes      text[] := '{}';
  v_ok         boolean;
  v_run_id     bigint;
begin
  if p_mode is null or p_mode not in ('dry-run', 'purge') then
    raise exception 'p_mode must be dry-run or purge';
  end if;
  if p_run_by is null or p_run_by not in ('manual', 'cron') then
    raise exception 'p_run_by must be manual or cron';
  end if;

  -- 기한 지난 전체 계정 수(상한과 무관)와, 서버 기록 없이 옛 방식(user_metadata)으로만 신청된 계정 수(대상 아님, 건수만)
  select count(*) into v_due_total
    from auth.users u
   where ourgoal_private.try_ts(u.raw_app_meta_data->>'deletion_requested_at') <= v_cutoff;
  select count(*) into v_legacy
    from auth.users u
   where u.raw_user_meta_data->>'account_status' = 'pending_deletion'
     and ourgoal_private.try_ts(u.raw_app_meta_data->>'deletion_requested_at') is null;

  -- 이 목록에 없는 '사용자를 가리키는 외래키 칸'이 public 에 있으면 purge 하지 않는다(지우다 만 계정을 막는다)
  select coalesce(jsonb_agg(distinct x.tbl || '.' || x.col), '[]'::jsonb) into v_uncovered
    from (
      select cl.relname::text as tbl, a.attname::text as col
        from pg_constraint c
        join pg_class cl on cl.oid = c.conrelid
        join pg_namespace ns on ns.oid = cl.relnamespace
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
       where c.contype = 'f'
         and ns.nspname = 'public'
         and (c.confrelid = to_regclass('auth.users') or c.confrelid = to_regclass('public.users'))
    ) x
   where not exists (
     select 1 from ourgoal_private.account_purge_targets() tg where tg.tbl = x.tbl and tg.col = x.col
   );

  if p_mode = 'purge' and jsonb_array_length(v_uncovered) > 0 then
    insert into ourgoal_private.account_purge_runs
      (run_by, mode, batch_limit, due_total, uncovered, legacy_pending, error_codes, ok, remaining_total)
    values (p_run_by, p_mode, v_limit, v_due_total, v_uncovered, v_legacy, array['UNCOVERED_FK'], false, null)
    returning id into v_run_id;
    return jsonb_build_object('ok', false, 'run_id', v_run_id, 'mode', p_mode, 'due_total', v_due_total,
      'processed', 0, 'uncovered', v_uncovered, 'error', 'uncovered foreign keys — purge refused');
  end if;

  for v_uid in
    select u.id
      from auth.users u
     where ourgoal_private.try_ts(u.raw_app_meta_data->>'deletion_requested_at') <= v_cutoff
     order by ourgoal_private.try_ts(u.raw_app_meta_data->>'deletion_requested_at'), u.id
     limit v_limit
  loop
    v_processed := v_processed + 1;

    if p_mode = 'dry-run' then
      for t in select * from ourgoal_private.account_purge_targets() order by ord loop
        if ourgoal_private.target_exists(t.tbl, t.col) then
          v_key := t.tbl || '.' || t.col;
          execute format('select count(*) from public.%I where %I::text = $1', t.tbl, t.col) into n using v_uid::text;
          v_rows := jsonb_set(v_rows, array[v_key], to_jsonb(coalesce((v_rows->>v_key)::bigint, 0) + n));
        end if;
      end loop;
      for t in select * from ourgoal_private.account_purge_json_targets() order by ord loop
        if ourgoal_private.target_exists(t.tbl, t.col) then
          v_key := t.tbl || '.' || t.col || '.' || t.json_key;
          execute format('select count(*) from public.%I where %I->>%L = $1', t.tbl, t.col, t.json_key) into n using v_uid::text;
          v_rows := jsonb_set(v_rows, array[v_key], to_jsonb(coalesce((v_rows->>v_key)::bigint, 0) + n));
        end if;
      end loop;
      v_rows := jsonb_set(v_rows, array['auth.users'], to_jsonb(coalesce((v_rows->>'auth.users')::bigint, 0) + 1));
      continue;
    end if;

    -- purge: 계정 하나를 한 묶음(하위 트랜잭션)으로 지운다. 중간에 실패하면 그 계정은 하나도 지워지지 않는다.
    begin
      -- 그 사이 복구(기록 삭제)됐으면 건너뛴다
      perform 1 from auth.users u
        where u.id = v_uid
          and ourgoal_private.try_ts(u.raw_app_meta_data->>'deletion_requested_at') <= v_cutoff
        for update;
      if not found then
        v_skipped := v_skipped + 1;
        continue;
      end if;

      v_acc := '{}'::jsonb;
      for t in select * from ourgoal_private.account_purge_targets() order by ord loop
        if ourgoal_private.target_exists(t.tbl, t.col) then
          execute format('delete from public.%I where %I::text = $1', t.tbl, t.col) using v_uid::text;
          get diagnostics n = row_count;
          v_acc := jsonb_set(v_acc, array[t.tbl || '.' || t.col], to_jsonb(n));
        end if;
      end loop;
      for t in select * from ourgoal_private.account_purge_json_targets() order by ord loop
        if ourgoal_private.target_exists(t.tbl, t.col) then
          execute format('delete from public.%I where %I->>%L = $1', t.tbl, t.col, t.json_key) using v_uid::text;
          get diagnostics n = row_count;
          v_acc := jsonb_set(v_acc, array[t.tbl || '.' || t.col || '.' || t.json_key], to_jsonb(n));
        end if;
      end loop;
      if to_regclass('auth.audit_log_entries') is not null then
        execute 'delete from auth.audit_log_entries where payload->>''actor_id'' = $1' using v_uid::text;
        get diagnostics n = row_count;
        v_acc := jsonb_set(v_acc, array['auth.audit_log_entries'], to_jsonb(n));
      end if;
      delete from auth.users where id = v_uid;
      get diagnostics n = row_count;
      if n <> 1 then
        raise exception 'auth user not deleted' using errcode = 'P0002';
      end if;
      v_acc := jsonb_set(v_acc, array['auth.users'], to_jsonb(n));

      -- 같은 계정을 같은 조건으로 다시 센다. 0 이 아니면 이 계정 삭제 전체를 되돌린다.
      v_left := ourgoal_private.account_rows_left(v_uid);
      if v_left is null or v_left <> 0 then
        raise exception 'rows remain after purge' using errcode = 'P0003';
      end if;

      for v_key in select jsonb_object_keys(v_acc) loop
        v_rows := jsonb_set(v_rows, array[v_key], to_jsonb(coalesce((v_rows->>v_key)::bigint, 0) + (v_acc->>v_key)::bigint));
      end loop;
      v_purged := v_purged + 1;
      v_uids := array_append(v_uids, v_uid);
    exception when others then
      v_failed := v_failed + 1;
      v_codes := array_append(v_codes, sqlstate);
      v_uids := array_append(v_uids, v_uid);
    end;
  end loop;

  -- 실행이 끝난 뒤, 처리한 계정 전부를 같은 조건으로 다시 잰다. 못 재면 null(=실패).
  if p_mode = 'purge' then
    begin
      v_remaining := 0;
      foreach v_uid in array v_uids loop
        v_remaining := v_remaining + ourgoal_private.account_rows_left(v_uid);
      end loop;
    exception when others then
      v_remaining := null;
      v_codes := array_append(v_codes, sqlstate);
    end;
    v_ok := v_failed = 0 and v_remaining is not null and v_remaining = 0;
  else
    v_remaining := null;
    v_ok := true;
  end if;

  insert into ourgoal_private.account_purge_runs
    (run_by, mode, batch_limit, due_total, processed, purged, skipped, failed, rows_by_table,
     remaining_total, uncovered, legacy_pending, error_codes, ok)
  values
    (p_run_by, p_mode, v_limit, v_due_total, v_processed, v_purged, v_skipped, v_failed, v_rows,
     v_remaining, v_uncovered, v_legacy, v_codes, v_ok)
  returning id into v_run_id;

  return jsonb_build_object(
    'ok', v_ok, 'run_id', v_run_id, 'mode', p_mode, 'batch_limit', v_limit,
    'due_total', v_due_total, 'processed', v_processed, 'purged', v_purged,
    'skipped', v_skipped, 'failed', v_failed, 'rows_by_table', v_rows,
    'remaining_total', v_remaining, 'uncovered', v_uncovered,
    'legacy_pending', v_legacy, 'error_codes', to_jsonb(v_codes)
  );
end;
$purge$;

-- 아무도 API(PostgREST)로 부를 수 없게 한다. pg_cron(postgres)과 SQL Editor(postgres)만 부른다.
revoke all on function ourgoal_private.account_purge_run(text, int, text) from public;
revoke all on function ourgoal_private.account_rows_left(uuid) from public;
do $revoke$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function ourgoal_private.account_purge_run(text, int, text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on function ourgoal_private.account_purge_run(text, int, text) from authenticated';
  end if;
end
$revoke$;

-- 매일 03:30 KST(18:30 UTC) 예약 — 같은 트랜잭션 안에서 만들자마자 끈다(active=false). 켜기는 enable.sql.
do $cronjob$
declare
  v_job bigint;
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'ourgoal-account-purge-daily';
  v_job := cron.schedule(
    'ourgoal-account-purge-daily',
    '30 18 * * *',
    $cmd$select ourgoal_private.account_purge_run('purge', 50, 'cron')$cmd$
  );
  perform cron.alter_job(v_job, active := false);
end
$cronjob$;

commit;

-- 설치 확인(같이 실행됨): 예약이 꺼져 있어야 한다 → active = false
select jobname, schedule, active from cron.job where jobname = 'ourgoal-account-purge-daily';
