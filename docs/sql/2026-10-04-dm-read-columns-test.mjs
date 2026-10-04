// #TASK-ES-366 로컬 시험 — PGlite(WASM Postgres)에 2026-10-04 실측과 같은 모양의 team_ping_replies
// (상태 열 5개 없음 · 로그인 사용자 select/insert 허용 · update 허용 정책 없음)를 만들고
// 2026-10-04-dm-read-columns.sql · 되돌리기 SQL 을 그대로 실행해 A·B·C·anon 별로 잰다. 실서버에는 접속하지 않는다.
// 실행: 빈 폴더에서 npm i @electric-sql/pglite@0.2 후 그 폴더에서  node <이 파일 경로>  (저장소 의존성에 넣지 않았다)
// 한계: 운영의 실제 정책 전체·Realtime·PostgREST 스키마 캐시는 재현하지 않는다.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const req = createRequire(path.join(process.cwd(), 'x.js'));
const { PGlite } = req('@electric-sql/pglite');
const D = path.dirname(fileURLToPath(import.meta.url)) + '/';
const rd = f => fs.readFileSync(D + f, 'utf8');
const db = new PGlite();
const A='aaaaaaaa-0000-4000-a000-000000000001', B='bbbbbbbb-0000-4000-a000-000000000002', C='cccccccc-0000-4000-a000-000000000003';
const T = `dm_${A}_${B}`;
await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')), '')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
create table public.team_ping_replies(id text primary key, ping_id text, group_id text, sender_id text, sender_name text, sender_role text, sender_avatar text, receiver_id text, message text, created_at timestamptz default now());
alter table team_ping_replies enable row level security;
create policy "auth select" on team_ping_replies for select to authenticated using (true);
create policy "auth insert" on team_ping_replies for insert to authenticated with check (true);
grant select, insert, update, delete on team_ping_replies to anon, authenticated;
insert into team_ping_replies(id,ping_id,group_id,sender_id,receiver_id,message) values
 ('old1','${T}','dm_direct','${A}','${B}','old message A to B'),
 ('old2','${T}','dm_direct','${B}','${A}','old message B to A');
`);
let total = 0, fails = 0;
async function as(role, uid, sql){
  const claims = uid ? `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);` : `select set_config('request.jwt.claims', '', true);`;
  await db.exec('begin;'); await db.exec(claims); await db.exec(`set local role ${role};`);
  try { const r = await db.query(sql); await db.exec('commit;'); return { rows: r.rows, n: r.affectedRows }; }
  catch(e){ await db.exec('rollback;'); return { err: e.message }; }
}
function ok(name, cond, got){ total++; console.log((cond?'PASS ':'FAIL ')+name+(got!==null&&got!==undefined?'  -> '+JSON.stringify(got):'')); if(!cond) fails++; }
const row = async (id) => (await db.query(`select * from team_ping_replies where id='${id}'`)).rows[0];

// 적용 전: 운영과 같은 증상
let r = await as('authenticated', A, `insert into team_ping_replies(id,ping_id,sender_id,receiver_id,message,status,delivered_at) values ('x1','${T}','${A}','${B}','m','sent',now())`);
ok('적용 전: 상태 열을 넣는 insert 는 실패(운영 PGRST204 와 같은 원인)', !!r.err, r.err);
r = await as('authenticated', B, `update team_ping_replies set sender_role='member' where id='old1' returning id`);
ok('적용 전: 받는 사람 B 의 update 는 0행(운영 실측과 같음)', !r.err && r.rows.length === 0, r.err || r.rows.length);

// 적용(두 번 — 재실행 안전)
try { await db.exec(rd('2026-10-04-dm-read-columns.sql')); await db.exec(rd('2026-10-04-dm-read-columns.sql')); ok('SQL 두 번 실행 오류 없음', true); }
catch(e){ ok('SQL 실행', false, e.message); }
const o1 = await row('old1');
ok('기존 행의 is_read·status 는 null(지어낸 값 없음)', o1.is_read === null && o1.status === null, { is_read: o1.is_read, status: o1.status });

r = await as('authenticated', A, `insert into team_ping_replies(id,ping_id,group_id,sender_id,receiver_id,message,status,sent_at,created_at) values ('new1','${T}','dm_direct','${A}','${B}','new message','sent',now(),now())`);
ok('적용 후: 앱과 같은 열로 insert 성공', !r.err, r.err);
ok('새 행 is_read 기본값 false', (await row('new1')).is_read === false, (await row('new1')).is_read);

r = await as('anon', null, `select public.og_dm_mark('${T}', true)`);
ok('anon 은 og_dm_mark 실행 불가', !!r.err, r.err);
r = await as('authenticated', C, `select public.og_dm_mark('${T}', true) as n`);
ok('남(C)이 부르면 0행', !r.err && r.rows[0].n === 0, r.err || r.rows[0].n);
r = await as('authenticated', A, `select public.og_dm_mark('${T}', false) as n`);
ok('보낸 사람 A 가 도착 표시를 불러도 A 가 받은 old2 만(1행)', !r.err && r.rows[0].n === 1, r.err || r.rows[0].n);
ok('A 가 부른 뒤에도 A→B new1 의 delivered_at 은 비어 있음', (await row('new1')).delivered_at === null, (await row('new1')).delivered_at);

r = await as('authenticated', B, `select public.og_dm_mark('${T}', false) as n`);
ok('B 도착 표시: A→B 2행(old1·new1)', !r.err && r.rows[0].n === 2, r.err || r.rows[0].n);
const n1 = await row('new1');
ok('도착 뒤 new1 status=delivered, is_read=false', n1.status === 'delivered' && n1.is_read === false && !!n1.delivered_at, { status: n1.status, is_read: n1.is_read });
r = await as('authenticated', B, `select public.og_dm_mark('${T}', true) as n`);
ok('B 읽음 표시: A→B 2행', !r.err && r.rows[0].n === 2, r.err || r.rows[0].n);
const n2 = await row('new1');
ok('읽음 뒤 new1 is_read=true·status=read·read_at 있음·본문 그대로', n2.is_read === true && n2.status === 'read' && !!n2.read_at && n2.message === 'new message', { is_read: n2.is_read, status: n2.status, message: n2.message });
ok('B→A old2 는 B 의 읽음 호출로 바뀌지 않음', (await row('old2')).is_read === null, (await row('old2')).is_read);
r = await as('authenticated', B, `select public.og_dm_mark('${T}', true) as n`);
ok('다시 부르면 0행(이미 읽음)', !r.err && r.rows[0].n === 0, r.err || r.rows[0].n);
r = await as('authenticated', B, `update team_ping_replies set message='tampered' where id='new1' returning id`);
ok('B 는 여전히 본문을 update 못 함(0행)', !r.err && r.rows.length === 0, r.err || r.rows.length);

// 되돌리기
try { await db.exec(rd('2026-10-04-dm-read-columns-rollback.sql')); ok('되돌리기 SQL 오류 없음', true); } catch(e){ ok('되돌리기', false, e.message); }
const cols = await db.query(`select count(*)::int c from information_schema.columns where table_name='team_ping_replies' and column_name in ('status','sent_at','delivered_at','read_at','is_read')`);
const fn = await db.query(`select count(*)::int c from pg_proc where proname='og_dm_mark'`);
ok('되돌린 뒤 열 0·함수 0', cols.rows[0].c === 0 && fn.rows[0].c === 0, { cols: cols.rows[0].c, fn: fn.rows[0].c });
ok('되돌린 뒤 메시지 행 3건 그대로', (await db.query(`select count(*)::int c from team_ping_replies`)).rows[0].c === 3);
console.log('RESULT', total - fails, '/', total);
