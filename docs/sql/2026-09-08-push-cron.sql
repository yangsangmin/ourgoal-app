-- Web Push 발송 트리거: Supabase pg_cron + pg_net (실행계획 순서 14)
-- 왜: GitHub Actions 의 */5 스케줄은 지연·건너뜀이 정상 동작이라(59시간 동안 22회, 간격 중앙값 128분)
--     "설정한 체크인 시각에 도착"을 보장할 수 없었다. DB 안의 pg_cron 은 매분 정확히 돈다.
-- 어떻게: 매분 /api/push-dispatch 를 POST 로 호출한다. 비밀값(CRON_SECRET)은 Vault 에 넣고
--     잡 본문에서 읽으므로 cron.job 테이블에 평문으로 남지 않는다.
-- 실행: Supabase 콘솔 > SQL Editor. <CRON_SECRET> 만 Vercel 의 CRON_SECRET 값으로 바꿔 넣는다.
--     여러 번 돌려도 안전하다(if not exists / 기존 잡·비밀 교체).
-- 되돌리기: select cron.unschedule('push-dispatch-every-minute');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 비밀값: 이미 있으면 갱신, 없으면 생성
do $body$
declare
  sid uuid;
begin
  select id into sid from vault.secrets where name = 'push_dispatch_cron_secret';
  if sid is null then
    perform vault.create_secret('<CRON_SECRET>', 'push_dispatch_cron_secret', 'Bearer token for /api/push-dispatch');
  else
    perform vault.update_secret(sid, '<CRON_SECRET>');
  end if;
end
$body$;

-- 기존 잡이 있으면 지우고 다시 등록
select cron.unschedule(jobid) from cron.job where jobname = 'push-dispatch-every-minute';

select cron.schedule(
  'push-dispatch-every-minute',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://ourgoal-app.vercel.app/api/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'push_dispatch_cron_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $job$
);

-- 확인용(실행 후):
--   select jobid, jobname, schedule, active from cron.job;
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
--   select status_code, content, created from net._http_response order by created desc limit 5;
