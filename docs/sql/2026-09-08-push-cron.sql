-- Web Push 발송 트리거: Supabase pg_cron + pg_net (실행계획 순서 14)
-- 왜: GitHub Actions 의 */5 스케줄은 지연·건너뜀이 정상 동작이라(59시간 동안 22회, 간격 중앙값 128분)
--     "설정한 체크인 시각에 도착"을 보장할 수 없었다. DB 안의 pg_cron 은 매분 정확히 돈다.
-- 어떻게: 매분 /api/push-dispatch 를 POST 로 호출한다. 인증 토큰은 이 DB 의 Vault 안에서 생성돼
--     잡 본문이 Vault 에서 읽어 헤더에 싣고, 서버(api/push-dispatch.js)는 service_role 로
--     public.push_dispatch_token() 을 호출해 대조한다. 사람·코드·저장소 어디에도 토큰을 옮겨 적지 않는다.
-- 실행: Supabase 콘솔 > SQL Editor 에 그대로 붙여넣고 Run. 바꿔 넣을 값 없음.
--     여러 번 돌려도 안전하다(if not exists / or replace / 기존 잡 교체).
-- 되돌리기: select cron.unschedule('push-dispatch-every-minute');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1) 토큰: 없을 때만 생성(64자 hex). 있으면 그대로 둔다.
do $body$
begin
  if not exists (select 1 from vault.secrets where name = 'push_dispatch_cron_secret') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'push_dispatch_cron_secret',
      'Bearer token for /api/push-dispatch (pg_cron)'
    );
  end if;
end
$body$;

-- 2) 서버가 토큰을 읽는 함수. service_role 만 실행 가능.
create or replace function public.push_dispatch_token()
returns text
language sql
security definer
set search_path = ''
as $fn$
  select decrypted_secret from vault.decrypted_secrets where name = 'push_dispatch_cron_secret' limit 1
$fn$;
revoke all on function public.push_dispatch_token() from public;
revoke all on function public.push_dispatch_token() from anon;
revoke all on function public.push_dispatch_token() from authenticated;
grant execute on function public.push_dispatch_token() to service_role;

-- 3) 기존 잡이 있으면 지우고 다시 등록
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
--   (서버 코드 배포 전에는 401, 배포 후에는 200 {checked,sent,...} 가 매분 쌓여야 한다)
