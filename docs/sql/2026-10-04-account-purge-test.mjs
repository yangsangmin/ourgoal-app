// #TASK-ES-351 자동 파기 SQL 로컬 시험 — PGlite(WASM Postgres)에 운영과 같은 모양의 auth·public 표를 만들고
// 2026-10-04-account-purge-install.sql·rollback.sql 을 그대로 실행해 dry-run·purge·상한·실패 되돌림·권한을 잰다. 실서버에는 접속하지 않는다.
// 실행: 빈 폴더에서 npm i @electric-sql/pglite@0.2 후 그 폴더에서  node <이 파일 경로>  (저장소 의존성에 넣지 않았다)
// 한계: pg_cron 은 PGlite 에 없어 cron 스키마를 흉내 낸 함수로 대신한다. 운영의 실제 표·트리거·권한(postgres 의 auth.users 삭제)은
//       재현하지 않는다 — 운영 확인은 2026-10-04-account-purge-check.sql 의 dry-run 으로 한다.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const req = createRequire(path.join(process.cwd(), 'x.js'));
const { PGlite } = req('@electric-sql/pglite');
const D = path.dirname(fileURLToPath(import.meta.url)) + '/';
const rd = f => fs.readFileSync(D + f, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ✓ ' + label); } else { fail++; console.log('  ✗ ' + label); }
}
const uid = n => '00000000-0000-4000-a000-' + String(n).padStart(12, '0');
const days = d => `now() - interval '${d} days'`;

async function fresh() {
  const db = new PGlite();
  await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb default '{}'::jsonb, raw_user_meta_data jsonb default '{}'::jsonb);
create table auth.identities(id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade);
create table auth.audit_log_entries(id bigserial primary key, payload json);
create schema cron;
create table cron.job(jobid bigserial primary key, jobname text, schedule text, command text, active boolean default true);
create function cron.schedule(p_name text, p_sched text, p_cmd text) returns bigint language sql as $$ insert into cron.job(jobname, schedule, command) values (p_name, p_sched, p_cmd) returning jobid $$;
create function cron.unschedule(p_job bigint) returns boolean language sql as $$ delete from cron.job where jobid = p_job returning true $$;
create function cron.alter_job(job_id bigint, schedule text default null, command text default null, database text default null, username text default null, active boolean default null) returns void language sql as $$ update cron.job set active = coalesce(alter_job.active, cron.job.active) where jobid = job_id $$;
create table public.users(id uuid primary key references auth.users(id) on delete cascade, nickname text);
create table public.goals(id text primary key, user_id uuid not null references public.users(id) on delete cascade, title text);
create table public.checkins(id text primary key, user_id uuid not null, text text, deleted_at timestamptz, meta jsonb);
create table public.feed_posts(id text primary key, user_id uuid not null references auth.users(id), body text);
create table public.team_comments(id text primary key, user_id uuid not null references auth.users(id), body text);
create table public.team_pings(id text primary key, sender_id text, receiver_id text, message text);
create table public.team_ping_replies(id text primary key, sender_id text, receiver_id text, message text);
create table public.push_subscriptions(id bigserial primary key, user_id uuid not null references public.users(id) on delete cascade);
create table public.credit_ledger(id bigserial primary key, user_id uuid not null references auth.users(id), amount int);
create table public.content_reports(id bigserial primary key, reporter_id uuid not null references auth.users(id) on delete cascade);
create table public.inquiries(id bigserial primary key, user_id text, content text);
create table public.checkins_backup(id text, user_id text not null);
create table public.events(id bigserial primary key, sid text, name text, props jsonb not null default '{}'::jsonb);
`);
  // 운영처럼 pg_cron 확장 생성 줄만 빼고 설치 파일 그대로 실행
  await db.exec(rd('2026-10-04-account-purge-install.sql').replace('create extension if not exists pg_cron;', ''));
  return db;
}

async function seedUser(db, n, opts = {}) {
  const id = uid(n);
  const app = opts.requestedDaysAgo != null ? `jsonb_build_object('deletion_requested_at', to_char((${days(opts.requestedDaysAgo)}) at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))` : `'{}'::jsonb`;
  const um = opts.legacy ? `'{"account_status":"pending_deletion"}'::jsonb` : `'{}'::jsonb`;
  await db.exec(`
insert into auth.users(id, email, raw_app_meta_data, raw_user_meta_data) values ('${id}', 'u${n}@test.local', ${app}, ${um});
insert into auth.identities(user_id) values ('${id}');
insert into auth.audit_log_entries(payload) values (json_build_object('actor_id', '${id}', 'action', 'login'));
insert into public.users(id, nickname) values ('${id}', 'n${n}');
insert into public.goals values ('g${n}a', '${id}', 'goal'), ('g${n}b', '${id}', 'goal2');
insert into public.checkins(id, user_id, text) values ('c${n}', '${id}', 'hi');
insert into public.feed_posts values ('f${n}', '${id}', 'post');
insert into public.team_comments values ('t${n}', '${id}', 'c');
insert into public.team_pings values ('p${n}', '${id}', '${uid(999)}', 'dm');
insert into public.team_ping_replies values ('r${n}', '${id}', '${uid(999)}', 're');
insert into public.push_subscriptions(user_id) values ('${id}');
insert into public.credit_ledger(user_id, amount) values ('${id}', 1);
insert into public.content_reports(reporter_id) values ('${id}');
insert into public.inquiries(user_id, content) values ('${id}', 'q');
insert into public.checkins_backup values ('c${n}', '${id}');
insert into public.events(sid, name, props) values (null, 'settings_ledger', json_build_object('userId', '${id}', 'settings', json_build_object('geminiKey', 'k')));
insert into public.events(sid, name, props) values ('anon-sid-${n}', 'checkin', '{}'::jsonb);
`);
  return id;
}
const one = async (db, sql) => (await db.query(sql)).rows[0];
const left = async (db, id) => Number((await one(db, `select ourgoal_private.account_rows_left('${id}') as n`)).n);
const run = async (db, mode, limit = 50, by = 'manual') => (await one(db, `select ourgoal_private.account_purge_run('${mode}', ${limit}, '${by}') as r`)).r;
const totalRows = async db => Number((await one(db, `select (select count(*) from public.goals)+(select count(*) from public.checkins)+(select count(*) from public.feed_posts)+(select count(*) from auth.users)+(select count(*) from public.inquiries)+(select count(*) from public.checkins_backup) as n`)).n);

console.log('[1] 설치: 예약은 꺼진 채로 만들어진다');
{
  const db = await fresh();
  const job = await one(db, `select jobname, schedule, active, command from cron.job where jobname = 'ourgoal-account-purge-daily'`);
  ok(job && job.active === false, '예약 ourgoal-account-purge-daily 가 있고 active=false');
  ok(job && job.schedule === '30 18 * * *', '매일 18:30 UTC(03:30 KST)');
  ok(job && job.command.includes("account_purge_run('purge', 50, 'cron')"), '예약 명령은 purge·50·cron');
  await db.exec(rd('2026-10-04-account-purge-install.sql').replace('create extension if not exists pg_cron;', ''));
  const cnt = await one(db, `select count(*)::int as n from cron.job where jobname = 'ourgoal-account-purge-daily'`);
  ok(cnt.n === 1, '설치를 두 번 해도 예약은 1개');
}

console.log('[2] 29일 계정은 대상 아님·31일 계정은 대상, dry-run 은 삭제 0');
{
  const db = await fresh();
  const a31 = await seedUser(db, 1, { requestedDaysAgo: 31 });
  const b29 = await seedUser(db, 2, { requestedDaysAgo: 29 });
  const c0 = await seedUser(db, 3);
  await seedUser(db, 4, { legacy: true });
  await db.exec(`update auth.users set raw_app_meta_data = '{"deletion_requested_at":"not-a-date"}' where id = '${uid(3)}'`);
  const before = await totalRows(db);
  const r = await run(db, 'dry-run');
  ok(r.ok === true && r.mode === 'dry-run', 'dry-run ok');
  ok(r.due_total === 1 && r.processed === 1, '대상 1계정(31일)만 — 29일·기록 없음·잘못된 시각은 대상 아님');
  ok(r.rows_by_table['goals.user_id'] === 2 && r.rows_by_table['auth.users'] === 1, '표별 행 수: goals 2, auth.users 1');
  ok(r.rows_by_table['events.props.userId'] === 1, 'events 의 props.userId 행(설정 원장)도 센다');
  ok(r.legacy_pending === 1, '옛 방식 신청 1계정은 건수로만 보고(대상 아님)');
  ok((await totalRows(db)) === before, 'dry-run 뒤 행 수 변화 0');
  ok((await left(db, a31)) > 0 && (await left(db, b29)) > 0 && (await left(db, c0)) > 0, '세 계정 모두 그대로');
  const log = await one(db, `select count(*)::int as n from ourgoal_private.account_purge_runs where mode = 'dry-run'`);
  ok(log.n === 1, '실행 기록 1줄');
}

console.log('[3] purge 후 잔여 0, 다른 계정·상대가 보낸 글은 보존, 기록에 개인정보 없음');
{
  const db = await fresh();
  const a31 = await seedUser(db, 1, { requestedDaysAgo: 31 });
  const b29 = await seedUser(db, 2, { requestedDaysAgo: 29 });
  await db.exec(`insert into public.team_pings values ('incoming', '${uid(2)}', '${a31}', 'to A')`);
  const r = await run(db, 'purge');
  ok(r.ok === true && r.purged === 1 && r.failed === 0, 'ok·purged 1·failed 0');
  ok(r.remaining_total === 0, '같은 조건 재조회 잔여 0');
  ok((await left(db, a31)) === 0, 'A 의 행 0(auth.users·audit 포함)');
  ok(Number((await one(db, `select count(*) from auth.identities where user_id = '${a31}'`)).count) === 0, 'auth.identities 도 연쇄 삭제');
  ok((await left(db, b29)) > 0, '29일 계정 B 는 그대로');
  ok(Number((await one(db, `select count(*) from public.events where props->>'userId' = '${a31}'`)).count) === 0, 'A 의 설정 원장(events props.userId) 삭제');
  ok(Number((await one(db, `select count(*) from public.events where sid = 'anon-sid-1'`)).count) === 1, '익명 이벤트는 남음');
  ok(Number((await one(db, `select count(*) from public.events where props->>'userId' = '${b29}'`)).count) === 1, 'B 의 설정 원장은 남음');
  ok(Number((await one(db, `select count(*) from public.team_pings where id = 'incoming'`)).count) === 1, 'B 가 A 에게 보낸 DM 은 남음(상대의 글)');
  const logText = JSON.stringify((await db.query(`select * from ourgoal_private.account_purge_runs`)).rows);
  ok(!logText.includes(a31) && !logText.includes('u1@test.local'), '실행 기록에 사용자 id·이메일 없음');
  const r2 = await run(db, 'purge');
  ok(r2.ok === true && r2.processed === 0, '다시 돌리면 대상 0');
}

console.log('[4] 실패는 그 계정 전체를 되돌리고 ok=false');
{
  const db = await fresh();
  const a = await seedUser(db, 1, { requestedDaysAgo: 40 });
  const b = await seedUser(db, 2, { requestedDaysAgo: 35 });
  await db.exec(`
create function public.block_delete() returns trigger language plpgsql as $$ begin if old.user_id = '${b}' then raise exception 'blocked'; end if; return old; end; $$;
create trigger t_block before delete on public.goals for each row execute function public.block_delete();`);
  const beforeB = await left(db, b);
  const r = await run(db, 'purge');
  ok(r.ok === false && r.purged === 1 && r.failed === 1, '한 계정 실패 → ok=false, 다른 계정은 파기');
  ok((await left(db, a)) === 0, '성공한 계정 A 잔여 0');
  ok((await left(db, b)) === beforeB, '실패한 계정 B 는 한 행도 안 지워짐(계정 단위 원자적)');
  ok(r.remaining_total > 0, '재조회 잔여가 0 이 아니라고 보고');
  ok(Array.isArray(r.error_codes) && r.error_codes.length === 1, '오류 코드 1건 기록');
}

console.log('[5] 조용한 잔여(삭제 뒤 다시 생긴 행)도 실패로 잡는다');
{
  const db = await fresh();
  const a = await seedUser(db, 1, { requestedDaysAgo: 31 });
  await db.exec(`
create function public.resurrect() returns trigger language plpgsql as $$ begin insert into public.inquiries(user_id, content) values (old.user_id::text, 'copy'); return old; end; $$;
create trigger t_res after delete on public.checkins for each row execute function public.resurrect();`);
  const r = await run(db, 'purge');
  ok(r.ok === false && r.failed === 1 && r.purged === 0, '잔여가 생기면 그 계정 실패');
  ok((await left(db, a)) > 0 && Number((await one(db, `select count(*) from auth.users where id = '${a}'`)).count) === 1, '계정은 통째로 남는다');
}

console.log('[6] 한 번 처리 상한 50');
{
  const db = await fresh();
  for (let i = 1; i <= 55; i++) await seedUser(db, i, { requestedDaysAgo: 31 + (i % 3) });
  const r = await run(db, 'purge', 500);
  ok(r.batch_limit === 50 && r.processed === 50 && r.purged === 50, '500 을 줘도 50 계정만');
  ok(r.due_total === 55, '전체 대상 수는 55 로 보고');
  const r2 = await run(db, 'purge', 50);
  ok(r2.processed === 5 && r2.ok === true, '다음 실행에서 나머지 5');
}

console.log('[7] 목록에 없는 사용자 참조 외래키가 있으면 purge 거부');
{
  const db = await fresh();
  const a = await seedUser(db, 1, { requestedDaysAgo: 31 });
  await db.exec(`create table public.new_feature(id bigserial primary key, owner uuid references auth.users(id)); insert into public.new_feature(owner) values ('${a}');`);
  const d = await run(db, 'dry-run');
  ok(JSON.stringify(d.uncovered) === JSON.stringify(['new_feature.owner']), 'dry-run 이 빠진 칸을 알려 준다');
  const before = await left(db, a);
  const r = await run(db, 'purge');
  ok(r.ok === false && r.processed === 0, 'purge 거부(처리 0)');
  ok((await left(db, a)) === before, '아무것도 안 지워짐');
}

console.log('[8] 권한: anon·authenticated 는 파기 함수를 부를 수 없다');
{
  const db = await fresh();
  for (const role of ['anon', 'authenticated']) {
    let denied = false;
    try { await db.exec(`set role ${role}; select ourgoal_private.account_purge_run('dry-run', 50, 'manual');`); } catch (e) { denied = /permission denied/i.test(e.message); }
    await db.exec('reset role;');
    ok(denied, role + ' 실행 거부');
  }
  let bad = false;
  try { await run(db, 'delete-all'); } catch (e) { bad = /p_mode/.test(e.message); }
  ok(bad, "모드는 'dry-run'·'purge' 둘뿐");
}

console.log('[9] 복구된 계정(기록 삭제)은 대상에서 빠지고, 되돌리기 SQL 은 예약·함수를 없앤다');
{
  const db = await fresh();
  const a = await seedUser(db, 1, { requestedDaysAgo: 31 });
  await db.exec(`update auth.users set raw_app_meta_data = raw_app_meta_data - 'deletion_requested_at' where id = '${a}'`);
  const r = await run(db, 'purge');
  ok(r.processed === 0 && (await left(db, a)) > 0, '복구 뒤에는 대상 아님');
  await db.exec(rd('2026-10-04-account-purge-enable.sql'));
  ok((await one(db, `select active from cron.job where jobname = 'ourgoal-account-purge-daily'`)).active === true, 'enable.sql 로 켜짐');
  await db.exec(rd('2026-10-04-account-purge-rollback.sql'));
  ok(Number((await one(db, `select count(*) from cron.job`)).count) === 0, '되돌리기 뒤 예약 0');
  ok(Number((await one(db, `select count(*) from pg_proc where proname = 'account_purge_run'`)).count) === 0, '되돌리기 뒤 함수 0');
}

console.log(`\n${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
