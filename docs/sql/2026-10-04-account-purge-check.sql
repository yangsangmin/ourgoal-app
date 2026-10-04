-- [#TASK-ES-351] 자동 파기 확인 쿼리 — 블록 하나씩 붙여넣어 실행한다.
-- [2] dry-run 은 아무것도 지우지 않는다(실행 기록 표에 건수 한 줄만 남긴다). 사용자 id·이메일은 결과에 나오지 않는다.

-- [1] 설치 확인: 예약이 있고 꺼져 있는지(active = false), 함수가 있는지
select jobname, schedule, active from cron.job where jobname = 'ourgoal-account-purge-daily';
select count(*) as purge_function_installed from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'ourgoal_private' and p.proname = 'account_purge_run';

-- [2] dry-run: 대상 계정 수·표별 행 수만 센다(삭제 0)
--   due_total = 신청 후 30일 지난 계정 수, processed = 이번에 처리할 수(최대 50)
--   uncovered 가 [] 가 아니면 purge 는 거부된다 → 켜지 말고 세션에 알린다
--   legacy_pending = 옛 방식(서버 기록 없이)으로 신청된 계정 수 — 자동 파기 대상이 아니다
select ourgoal_private.account_purge_run('dry-run', 50, 'manual');

-- [3] 대상 표에 걸린 삭제 트리거(있으면 파기 때 다른 표로 복사될 수 있다 → 세션에 알린다)
select event_object_table as table_name, trigger_name, action_timing, event_manipulation
  from information_schema.triggers
 where event_object_schema = 'public'
   and event_manipulation = 'DELETE'
   and event_object_table in (select tbl from ourgoal_private.account_purge_targets());

-- [4] 실행 기록(최근 10건): 누가(run_by)·언제·몇 건·ok
select id, ran_at, run_by, mode, due_total, processed, purged, skipped, failed,
       remaining_total, ok, error_codes, rows_by_table
  from ourgoal_private.account_purge_runs
 order by id desc
 limit 10;

-- [5] 예약 실행 결과(켠 뒤 다음 날)
select status, return_message, start_time, end_time
  from cron.job_run_details
 where jobid = (select jobid from cron.job where jobname = 'ourgoal-account-purge-daily')
 order by start_time desc
 limit 5;

-- [6] 신청 대기 중인 계정 수(30일 전·후 나눠 건수만)
select
  count(*) filter (where ourgoal_private.try_ts(raw_app_meta_data->>'deletion_requested_at') >  now() - interval '30 days') as waiting_under_30d,
  count(*) filter (where ourgoal_private.try_ts(raw_app_meta_data->>'deletion_requested_at') <= now() - interval '30 days') as due_now
  from auth.users;
