-- [#TASK-ES-351] 매일 자동 파기 예약 켜기 — check.sql 의 [2] dry-run 결과를 확인한 다음에만 실행한다.
-- 켜면 매일 03:30 KST(18:30 UTC)에 ourgoal_private.account_purge_run('purge', 50, 'cron') 이 돈다.
-- 끄기(되돌리기): 이 파일 맨 아래 주석의 한 줄, 또는 2026-10-04-account-purge-rollback.sql

select cron.alter_job(jobid, active := true)
  from cron.job
 where jobname = 'ourgoal-account-purge-daily';

-- 확인: active = true 한 줄이 나와야 한다
select jobname, schedule, active, command from cron.job where jobname = 'ourgoal-account-purge-daily';

-- 끄기만 하려면(설치는 유지):
--   select cron.alter_job(jobid, active := false) from cron.job where jobname = 'ourgoal-account-purge-daily';
