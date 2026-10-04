// #TASK-ES-347 RLS 정책 로컬 시험 — PGlite(WASM Postgres)에 운영과 같은 모양의 두 표 + using(true) 정책을 만들고
// 1단계·2단계·되돌리기 SQL 파일을 그대로 실행해 anon/로그인 A·B·C 별로 읽기·쓰기를 잰다. 실서버에는 접속하지 않는다.
// 실행: 빈 폴더에서 npm i @electric-sql/pglite@0.2 후  node <이 파일 경로>  (저장소 의존성에 넣지 않았다)
// 한계: 운영의 실제 정책·자료형·Realtime 은 재현하지 않는다(docs/sql/2026-10-04-dm-rls-check.sql 로 실서버에서 확인).
import { createRequire } from 'node:module';
const req = createRequire(path.join(process.cwd(), 'x.js'));
const { PGlite } = req('@electric-sql/pglite');
import fs from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const D = path.dirname(fileURLToPath(import.meta.url)) + '/';
const rd = f => fs.readFileSync(D + f, 'utf8');
const db = new PGlite();
const A='aaaaaaaa-0000-4000-a000-000000000001', B='bbbbbbbb-0000-4000-a000-000000000002', C='cccccccc-0000-4000-a000-000000000003';
await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth; create table auth.users(id uuid primary key);
insert into auth.users values ('${A}'),('${B}'),('${C}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')), '')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
create table public.team_pings(id text primary key, group_id text, sender_id text, sender_name text, sender_avatar text, receiver_id text, target_type text, target_id text, target_title text, ping_type text, message text, status text, hidden boolean default false, created_at timestamptz default now());
create table public.team_ping_replies(id text primary key, ping_id text, group_id text, sender_id text, sender_name text, sender_role text, sender_avatar text, receiver_id text, message text, status text, is_read boolean, sent_at timestamptz, delivered_at timestamptz, read_at timestamptz, created_at timestamptz default now());
alter table team_pings enable row level security; alter table team_ping_replies enable row level security;
create policy "open select" on team_pings for select using (true);
create policy "open insert" on team_pings for insert with check (true);
create policy "open update" on team_pings for update using (true);
create policy "open delete" on team_pings for delete using (true);
create policy "open select" on team_ping_replies for select using (true);
create policy "open insert" on team_ping_replies for insert with check (true);
create policy "open update" on team_ping_replies for update using (true);
grant select, insert, update, delete on team_pings, team_ping_replies to anon, authenticated;
insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values
 ('dm_${A}_${C}','dm_direct','${A}','${C}','dm','hi C'),
 ('gift1','dm_x_y','${A}','${C}','story_card','gift'),
 ('mc1','manito','${A}','${C}','manito_cheer','cheer'),
 ('fc1','feed','${C}','','feed_comment','comment'),
 ('g1','shared_groups','${C}','','team_group','{}'),
 ('mn_pool_${C}','manito_pool','${C}','','manito_member','{}'),
 ('tc1','team_42','${C}','','team_chat','team msg'),
 ('cert1','team_42','${C}',null,'checkin_certification','cert'),
 ('guestrow','team_42','guest-abc','','team_chat','guest msg');
insert into team_ping_replies(id,ping_id,group_id,sender_id,receiver_id,message,status) values
 ('r1','dm_${A}_${C}','dm_direct','${A}','${C}','m1','delivered'),
 ('r2','dm_${A}_${C}','dm_direct','${C}','${A}','m2','delivered');
`);
let fails = 0, total = 0;
async function as(role, uid, sql){
  const claims = uid ? `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);` : `select set_config('request.jwt.claims', '', true);`;
  await db.exec('begin;'); await db.exec(claims); await db.exec(`set local role ${role};`);
  try { const r = await db.query(sql); await db.exec('rollback;'); return { rows: r.rows, n: r.affectedRows }; }
  catch(e){ await db.exec('rollback;'); return { err: e.message }; }
}
function ok(name, cond, got){ total++; console.log((cond?'PASS ':'FAIL ')+name+(got!==null&&got!==undefined?'  -> '+JSON.stringify(got):'')); if(!cond) fails++; }
const cnt = async (role, uid, where, t='team_pings') => { const r = await as(role, uid, `select count(*)::int c from ${t} ${where||''}`); return r.err ? r.err : r.rows[0].c; };

ok('기준: anon 이 team_pings 전부 읽음(9)', await cnt('anon',null)===9, await cnt('anon',null));
await db.exec(rd('2026-10-04-dm-rls-step1.sql'));
ok('1단계: anon team_pings 0', await cnt('anon',null)===0, await cnt('anon',null));
ok('1단계: anon replies 0', await cnt('anon',null,'','team_ping_replies')===0);
let r = await as('anon', null, `insert into team_pings(id,group_id,sender_id,target_type) values ('gx','team_1','guest-1','team_chat')`);
ok('1단계: anon insert(반환 없음) 유지', !r.err, r);
ok('1단계: 로그인 B 는 여전히 전부(9)', await cnt('authenticated',B)===9, await cnt('authenticated',B));

await db.exec(rd('2026-10-04-dm-rls-step2.sql'));
ok('2단계: anon 0', await cnt('anon',null)===0);
r = await as('anon', null, `insert into team_pings(id,group_id,sender_id,target_type) values ('gy','team_1','guest-1','team_chat')`);
ok('2단계: anon insert 차단', !!r.err, r);
ok('2단계: A 는 A-C DM 메시지 2', await cnt('authenticated',A,'','team_ping_replies')===2);
ok('2단계: C 는 A-C DM 메시지 2', await cnt('authenticated',C,'','team_ping_replies')===2);
ok('2단계: B 는 A-C DM 메시지 0', await cnt('authenticated',B,'','team_ping_replies')===0);
ok('2단계: B 는 DM 부모·선물·마니또응원 0', await cnt('authenticated',B,`where id in ('dm_${A}_${C}','gift1','mc1')`)===0);
ok('2단계: C 는 DM 부모·선물·마니또응원 3', await cnt('authenticated',C,`where id in ('dm_${A}_${C}','gift1','mc1')`)===3);
ok('2단계: B 피드댓글·공개팀·마니또풀·팀채팅 보임(5)', await cnt('authenticated',B,`where id in ('fc1','g1','mn_pool_${C}','tc1','guestrow')`)===5, await cnt('authenticated',B,`where id in ('fc1','g1','mn_pool_${C}','tc1','guestrow')`));
ok('2단계: B 는 남의 체크인 인증 행 못 봄', await cnt('authenticated',B,"where id='cert1'")===0);
ok('2단계: C 는 자기 체크인 인증 행 봄', await cnt('authenticated',C,"where id='cert1'")===1);
r = await as('authenticated', B, `insert into team_pings(id,group_id,sender_id,target_type,message) values ('fake','feed','${A}','feed_comment','spoof')`);
ok('2단계: B 가 A 이름으로 insert 차단', !!r.err, r);
r = await as('authenticated', B, `insert into team_pings(id,group_id,sender_id,target_type,message) values ('fc2','feed','${B}','feed_comment','mine')`);
ok('2단계: B 자기 댓글 insert', !r.err, r);
r = await as('authenticated', C, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('dm_${A}_${C}','dm_direct','${C}','${A}','dm','reply') on conflict (id) do update set sender_id=excluded.sender_id, receiver_id=excluded.receiver_id, message=excluded.message`);
ok('2단계: C 가 A 가 만든 DM 부모 행 upsert', !r.err, r);
r = await as('authenticated', B, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('dm_${A}_${C}','dm_direct','${B}','${A}','dm','hijack') on conflict (id) do update set sender_id=excluded.sender_id, receiver_id=excluded.receiver_id`);
ok('2단계: 제3자 B 의 DM 부모 행 가로채기 upsert 차단', !!r.err, r);
r = await as('authenticated', C, `update team_ping_replies set is_read=true, status='read', read_at=now() where ping_id='dm_${A}_${C}' and receiver_id='${C}' and status<>'read'`);
ok('2단계: 받는 사람 C 의 읽음 표시 1행', !r.err && r.n===1, r);
r = await as('authenticated', B, `update team_ping_replies set status='read' where ping_id='dm_${A}_${C}'`);
ok('2단계: B 의 남의 DM 읽음 표시 0행', !r.err && r.n===0, r);
r = await as('authenticated', B, `delete from team_pings where id='fc1' and sender_id='${C}'`);
ok('2단계: B 가 C 의 댓글 삭제 0행', !r.err && r.n===0, r);
r = await as('authenticated', C, `delete from team_pings where id='fc1' and sender_id='${C}'`);
ok('2단계: C 자기 댓글 삭제 1행', !r.err && r.n===1, r);
r = await as('authenticated', C, `insert into team_ping_replies(id,ping_id,group_id,sender_id,receiver_id,message) values ('r3','dm_${A}_${C}','dm_direct','${C}','${A}','m3')`);
ok('2단계: C 의 DM 메시지 insert', !r.err, r);
r = await as('authenticated', C, `insert into team_ping_replies(id,ping_id,group_id,sender_id,receiver_id,message) values ('r4','dm_${A}_${C}','dm_direct','${A}','${C}','spoof')`);
ok('2단계: C 가 A 이름으로 DM insert 차단', !!r.err, r);
r = await as('authenticated', C, `insert into team_pings(id,group_id,sender_id,target_type,message) values ('mn_pool_${C}','manito_pool','${C}','manito_member','{"v":2}') on conflict (id) do update set message=excluded.message`);
ok('2단계: C 마니또 풀 자기 행 upsert', !r.err, r);

await db.exec(rd('2026-10-04-dm-rls-step2-rollback.sql'));
ok('2단계 되돌림 뒤: anon 여전히 0(1단계 유지)', await cnt('anon',null)===0);
ok('2단계 되돌림 뒤: B 다시 A-C DM 봄(2)', await cnt('authenticated',B,'','team_ping_replies')===2);
await db.exec(rd('2026-10-04-dm-rls-step1-rollback.sql'));
ok('1단계 되돌림 뒤: anon 다시 전부(9)', await cnt('anon',null)===9, await cnt('anon',null));
const pol = await db.query(`select count(*)::int c from pg_policies where policyname like 'es347%'`);
ok('되돌림 뒤 es347 정책 0', pol.rows[0].c===0, pol.rows);

let chk = rd('2026-10-04-dm-rls-check.sql').replaceAll('<A_ID>',A).replaceAll('<B_ID>',B).replaceAll('<C_ID>',C);
try { await db.exec(chk); ok('확인 쿼리 파일 전체 실행 오류 없음', true); } catch(e){ ok('확인 쿼리 파일 실행', false, e.message); }
try {
  await db.exec(rd('2026-10-04-dm-rls-step1.sql')); await db.exec(rd('2026-10-04-dm-rls-step1.sql'));
  await db.exec(rd('2026-10-04-dm-rls-step2.sql')); await db.exec(rd('2026-10-04-dm-rls-step2.sql'));
  ok('1·2단계 두 번씩 실행해도 오류 없음', true);
} catch(e){ ok('재실행', false, e.message); }
// RLS 꺼진 표면 중단되는지
await db.exec('alter table team_ping_replies disable row level security;');
try { await db.exec(rd('2026-10-04-dm-rls-step1.sql')); ok('RLS 꺼진 표면 1단계 중단', false); } catch(e){ ok('RLS 꺼진 표면 1단계 중단', /RLS/.test(e.message), e.message); }
console.log('RESULT', total - fails, '/', total);
