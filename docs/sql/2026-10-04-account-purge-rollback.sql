-- [#TASK-ES-351] 자동 파기 되돌리기 — 예약을 지우고 파기 함수를 없앤다.
-- 이미 파기된 계정은 되돌릴 수 없다(영구 삭제). 이 파일은 앞으로의 파기를 멈추는 것만 한다.
-- 실행 기록 표(ourgoal_private.account_purge_runs)는 건수 기록이라 남긴다. 표까지 지우려면 맨 아래 주석 두 줄을 실행한다.

begin;

select cron.unschedule(jobid) from cron.job where jobname = 'ourgoal-account-purge-daily';

drop function if exists ourgoal_private.account_purge_run(text, int, text);
drop function if exists ourgoal_private.account_rows_left(uuid);
drop function if exists ourgoal_private.target_exists(text, text);
drop function if exists ourgoal_private.try_ts(text);
drop function if exists ourgoal_private.account_purge_targets();
drop function if exists ourgoal_private.account_purge_json_targets();

commit;

-- 확인: 0 이 나와야 한다
select count(*) as purge_jobs_left from cron.job where jobname = 'ourgoal-account-purge-daily';

-- 실행 기록까지 지우려면:
--   drop table if exists ourgoal_private.account_purge_runs;
--   drop schema if exists ourgoal_private;
