// #TASK-ES-381 2단계 재확정 로컬 시험 — PGlite(WASM Postgres)에 "지금 운영 모양"을 만들고
//   1단계 → 읽음 열·og_dm_mark → 2단계 SQL 파일을 그대로 실행한 뒤, 사용자 A·B·C·anon 역할로 앱이 실제로 보내는 요청과 위조 시도를 잰다.
// 운영 모양(가정·실측 근거)
//   - team_ping_replies: 허용 정책은 select·insert 뿐(update·delete 허용 정책 없음 — #680 실측 0행)
//   - team_pings: 허용 정책이 select·insert·update·delete 모두 열려 있다고 본다(가장 넓은 경우 — 2단계가 좁히는지 보려고)
//   - 표·함수 주인은 슈퍼유저가 아닌 역할(운영의 postgres 와 같이 표 주인이라 FORCE 가 꺼져 있으면 RLS 를 받지 않음)
// 실서버에는 접속하지 않는다. 실행: 빈 폴더에서 npm i @electric-sql/pglite@0.2 후 그 폴더에서  node <이 파일 경로> [비교할 2단계 SQL 경로]
//   두 번째 인자를 주면 그 파일(예: 고치기 전 2단계)로도 같은 시나리오를 돌려 결과만 나란히 보여 준다(기대값 판정은 이 저장소 2단계 파일만).
// 한계: 운영의 실제 정책 목록·자료형·Realtime·PostgREST 는 재현하지 않는다(docs/sql/2026-10-04-dm-rls-check.sql 로 실서버에서 확인).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const req = createRequire(path.join(process.cwd(), 'x.js'));
const { PGlite } = req('@electric-sql/pglite');
const D = path.dirname(fileURLToPath(import.meta.url)) + '/';
const rd = f => fs.readFileSync(D + f, 'utf8');
const A = 'aaaaaaaa-0000-4000-a000-000000000001', B = 'bbbbbbbb-0000-4000-a000-000000000002', C = 'cccccccc-0000-4000-a000-000000000003';
const tid = (x, y) => 'dm_' + (x < y ? x + '_' + y : y + '_' + x);   // js/team-invite-comm.js getDmThreadId 와 같은 식
const legacyTid = (x, y) => [x, y].sort().join('_');                 // 피드 공유 DM 경로(team-invite-comm.js 3346행 부근)와 같은 식
const AB = tid(A, B), AC = tid(A, C);

async function makeDb() {
  const db = new PGlite();
  await db.exec(`
create role anon nologin; create role authenticated nologin; create role tblowner nologin;
create schema auth; create table auth.users(id uuid primary key);
insert into auth.users values ('${A}'),('${B}'),('${C}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')), '')::uuid $$;
grant usage on schema auth to anon, authenticated, tblowner; grant execute on function auth.uid() to anon, authenticated, tblowner;
grant create, usage on schema public to tblowner;
set role tblowner;
create table public.team_pings(id text primary key, group_id text, sender_id text, sender_name text, sender_avatar text, receiver_id text, target_type text, target_id text, target_title text, ping_type text, message text, status text, created_at timestamptz default now());
create table public.team_ping_replies(id text primary key, ping_id text, group_id text, sender_id text, sender_name text, sender_role text, sender_avatar text, receiver_id text, message text, created_at timestamptz default now());
alter table team_pings enable row level security; alter table team_ping_replies enable row level security;
create policy "open select" on team_pings for select using (true);
create policy "open insert" on team_pings for insert with check (true);
create policy "open update" on team_pings for update using (true);
create policy "open delete" on team_pings for delete using (true);
create policy "auth select" on team_ping_replies for select using (true);
create policy "auth insert" on team_ping_replies for insert to authenticated with check (true);
grant select, insert, update, delete on team_pings, team_ping_replies to anon, authenticated;
insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values
 ('${AC}','dm_direct','${A}','${C}','dm','hi C'),
 ('fc_c','feed','${C}','','feed_comment','C comment');
insert into team_ping_replies(id,ping_id,group_id,sender_id,receiver_id,message) values
 ('r_ac1','${AC}','dm_direct','${A}','${C}','A to C'),
 ('r_ca1','${AC}','dm_direct','${C}','${A}','C to A');
reset role;
`);
  return db;
}
async function asOwner(db, sql) { await db.exec('set role tblowner;'); try { await db.exec(sql); } finally { await db.exec('reset role;'); } }
async function as(db, role, uid, sql) {
  const claims = uid ? `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);` : `select set_config('request.jwt.claims', '', true);`;
  await db.exec('begin;'); await db.exec(claims); await db.exec(`set local role ${role};`);
  try { const r = await db.query(sql); await db.exec('commit;'); return { rows: r.rows, n: r.affectedRows }; }
  catch (e) { await db.exec('rollback;'); return { err: e.message }; }
}
const show = r => r.err ? '거절(' + r.err.slice(0, 60) + ')' : (r.rows && r.rows.length && r.rows[0].v !== undefined ? String(r.rows[0].v) : (r.n === undefined ? 'ok' : r.n + '행'));
const upsertParent = (me, peer, id) => `insert into team_pings(id,group_id,sender_id,sender_name,receiver_id,target_type,target_id,target_title,ping_type,message,status) values ('${id}','dm_direct','${me}','n','${peer}','dm','${peer}','1:1','dm','m','active') on conflict (id) do update set group_id=excluded.group_id, sender_id=excluded.sender_id, receiver_id=excluded.receiver_id, message=excluded.message, status=excluded.status`;
const insReply = (rid, ping, me, peer, extra = true) => `insert into team_ping_replies(id,ping_id,group_id,sender_id,sender_name,sender_role,sender_avatar,receiver_id,message${extra ? ',status,sent_at' : ''},created_at) values ('${rid}','${ping}','dm_direct','${me}','n','member','a','${peer}','hello'${extra ? ",'sent',now()" : ''},now())`;

// 시나리오 — [이름, 기대(2단계 뒤), 함수(db) → 결과]. 기대: 'ok' | '거절' | 숫자(행 수/값)
const S = [
  ['A→B DM: 대화방 부모 upsert(새로 만듦)', 'ok', db => as(db, 'authenticated', A, upsertParent(A, B, AB))],
  ['A→B DM: 메시지 insert(dm-ledger insertReply 열 그대로)', 'ok', db => as(db, 'authenticated', A, insReply('r1', AB, A, B))],
  ['B 답장: 같은 부모 upsert(충돌 → update 경로)', 'ok', db => as(db, 'authenticated', B, upsertParent(B, A, AB))],
  ['B 답장: 메시지 insert', 'ok', db => as(db, 'authenticated', B, insReply('r2', AB, B, A))],
  ['B 받은 목록(receiver_id=B) 건수', 1, db => as(db, 'authenticated', B, `select count(*)::int v from team_ping_replies where receiver_id='${B}'`)],
  ['B 대화방 읽기(ping_id=A-B) 건수', 2, db => as(db, 'authenticated', B, `select count(*)::int v from team_ping_replies where ping_id='${AB}'`)],
  ['제3자 C 가 A-B 대화방 읽기 건수', 0, db => as(db, 'authenticated', C, `select count(*)::int v from team_ping_replies where ping_id='${AB}'`)],
  ['제3자 C 가 A-B 부모 행 읽기 건수', 0, db => as(db, 'authenticated', C, `select count(*)::int v from team_pings where id='${AB}'`)],
  ['B og_dm_mark(도착) 바뀐 행', 1, db => as(db, 'authenticated', B, `select public.og_dm_mark('${AB}', false) as v`)],
  ['B og_dm_mark(읽음) 바뀐 행', 1, db => as(db, 'authenticated', B, `select public.og_dm_mark('${AB}', true) as v`)],
  ['A 가 보는 자기 메시지 is_read', 'true', db => as(db, 'authenticated', A, `select is_read::text v from team_ping_replies where id='r1'`)],
  ['제3자 C og_dm_mark(A-B) 바뀐 행', 0, db => as(db, 'authenticated', C, `select public.og_dm_mark('${AB}', true) as v`)],
  ['anon og_dm_mark 실행', '거절', db => as(db, 'anon', null, `select public.og_dm_mark('${AB}', true) as v`)],
  ['B 직접 update 로 읽음(markThreadRead 예비 경로) 행', 0, db => as(db, 'authenticated', B, `update team_ping_replies set is_read=true where ping_id='${AB}' and receiver_id='${B}'`)],
  ['B 가 받은 메시지 본문 고치기 행', 0, db => as(db, 'authenticated', B, `update team_ping_replies set message='edited' where id='r1'`)],
  ['피드 공유 DM(옛 대화방 id A_B) 메시지 insert', 'ok', db => as(db, 'authenticated', A, insReply('r3', legacyTid(A, B), A, B, false))],
  ['피드 공유 DM 부모 upsert(옛 id)', 'ok', db => as(db, 'authenticated', A, upsertParent(A, B, legacyTid(A, B)))],
  ['선물(group dm_A_B, 템플릿 추천) insert', 'ok', db => as(db, 'authenticated', A, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('gift1','${AB}','${A}','${B}','template_recommend','g')`)],
  ['B 가 받은 선물 읽기 건수', 1, db => as(db, 'authenticated', B, `select count(*)::int v from team_pings where id='gift1'`)],
  ['A 피드 댓글 insert', 'ok', db => as(db, 'authenticated', A, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,target_id,message) values ('fc_a','feed','${A}','','feed_comment','post1','c')`)],
  ['B 가 보는 피드 댓글 건수', 2, db => as(db, 'authenticated', B, `select count(*)::int v from team_pings where group_id='feed' and target_type='feed_comment'`)],
  ['B 가 A 의 댓글 지우기 행', 0, db => as(db, 'authenticated', B, `delete from team_pings where id='fc_a'`)],
  ['A 가 자기 댓글 지우기 행', 1, db => as(db, 'authenticated', A, `delete from team_pings where id='fc_a' and sender_id='${A}'`)],
  ['팀 채팅 A insert / B 읽기 건수', 1, async db => { const r = await as(db, 'authenticated', A, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('tc1','team_42','${A}','','team_chat','hi')`); return r.err ? r : as(db, 'authenticated', B, `select count(*)::int v from team_pings where group_id='team_42' and target_type='team_chat'`); }],
  ['마니또 응원 A→B insert / C 읽기 건수', 0, async db => { const r = await as(db, 'authenticated', A, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('mc1','manito','${A}','${B}','manito_cheer','go')`); return r.err ? r : as(db, 'authenticated', C, `select count(*)::int v from team_pings where id='mc1'`); }],
  ['B 마니또 받은 함 건수', 1, db => as(db, 'authenticated', B, `select count(*)::int v from team_pings where group_id='manito' and receiver_id='${B}'`)],
  ['C 마니또 풀 참여 upsert(mn_pool_C)', 'ok', db => as(db, 'authenticated', C, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('mn_pool_${C}','manito_pool','${C}','','manito_member','{}') on conflict (id) do update set message=excluded.message`)],
  ['C 마니또 풀 재참여 upsert(충돌 → update)', 'ok', db => as(db, 'authenticated', C, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('mn_pool_${C}','manito_pool','${C}','','manito_member','{"v":2}') on conflict (id) do update set message=excluded.message`)],
  // ---- 위조 시도 ----
  ['[위조] B 가 A 이름(sender_id=A)으로 DM insert', '거절', db => as(db, 'authenticated', B, insReply('f1', AB, A, B))],
  ['[위조] B 가 A 이름으로 피드 댓글 insert', '거절', db => as(db, 'authenticated', B, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('f2','feed','${A}','','feed_comment','x')`)],
  ['[위조] B 가 A-C 대화방(ping_id)에 A 에게 끼워 넣기', '거절', db => as(db, 'authenticated', B, insReply('f3', AC, B, A))],
  ['[위조] B 가 A-C 부모 행 가로채기 upsert', '거절', db => as(db, 'authenticated', B, upsertParent(B, A, AC))],
  ['[위조] B 가 B→A 부모를 규칙 밖 id 로 새로 만들기', '거절', db => as(db, 'authenticated', B, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('dm_x_${A}','dm_direct','${B}','${A}','dm','x')`)],
  ['[위조] B 가 아직 참여 안 한 D 의 마니또 풀 id 선점', '거절', db => as(db, 'authenticated', B, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('mn_pool_dddddddd-0000-4000-a000-000000000004','manito_pool','${B}','','manito_member','{}')`)],
  ['[위조] B 가 보낸 메시지의 보낸 사람을 A 로 바꾸기', '거절', db => as(db, 'authenticated', B, `update team_ping_replies set sender_id='${A}' where id='r2'`)],
  ['[위조] B 가 자기 메시지를 A-C 대화방으로 옮기기', '거절', db => as(db, 'authenticated', B, `update team_ping_replies set ping_id='${AC}' where id='r2'`)],
  ['[위조] anon 이 팀 채팅 insert', '거절', db => as(db, 'anon', null, `insert into team_pings(id,group_id,sender_id,receiver_id,target_type,message) values ('f6','team_1','guest-1','','team_chat','x')`)],
  ['anon 이 보는 DM 메시지 건수', 0, db => as(db, 'anon', null, `select count(*)::int v from team_ping_replies`)]
];
function judge(expect, r) {
  if (expect === 'ok') return !r.err;
  if (expect === '거절') return !!r.err || r.n === 0;
  if (r.err) return false;
  const got = r.rows && r.rows.length && r.rows[0].v !== undefined ? r.rows[0].v : r.n;
  return String(got) === String(expect);
}
async function runAll(step2Sql) {
  const db = await makeDb();
  await asOwner(db, rd('2026-10-04-dm-rls-step1.sql'));
  await asOwner(db, rd('2026-10-04-dm-read-columns.sql'));
  if (step2Sql) await asOwner(db, step2Sql);
  const out = [];
  for (const [name, expect, fn] of S) out.push({ name, expect, r: await fn(db) });
  return { db, out };
}

let total = 0, fails = 0;
function ok(name, cond, got) { total++; if (!cond) fails++; console.log((cond ? '맞음 ' : '틀림 ') + name + (got !== undefined ? '  -> ' + got : '')); }

const before = await runAll(null);
const after = await runAll(rd('2026-10-04-dm-rls-step2.sql'));
const cmpPath = process.argv[2];
const cmp = cmpPath ? await runAll(fs.readFileSync(cmpPath, 'utf8')) : null;
console.log('| 시나리오 | 2단계 전(1단계+읽음열) |' + (cmp ? ' 비교 파일 |' : '') + ' 2단계 뒤 | 기대 |');
console.log('| :-- | :-- |' + (cmp ? ' :-- |' : '') + ' :-- | :-- |');
for (let i = 0; i < S.length; i++) {
  console.log('| ' + S[i][0] + ' | ' + show(before.out[i].r) + ' |' + (cmp ? ' ' + show(cmp.out[i].r) + ' |' : '') + ' ' + show(after.out[i].r) + ' | ' + S[i][1] + ' |');
}
for (const o of after.out) ok('2단계 뒤: ' + o.name, judge(o.expect, o.r), show(o.r));

// 재실행 안전·되돌리기·FORCE RLS 의존
const db = after.db;
try { await asOwner(db, rd('2026-10-04-dm-rls-step2.sql')); ok('2단계 두 번째 실행 오류 없음', true); } catch (e) { ok('2단계 두 번째 실행', false, e.message); }
const pol = await db.query(`select tablename, count(*)::int c from pg_policies where policyname in ('es347_anon_no_access','es347_auth_select','es347_auth_insert','es347_auth_update','es347_auth_delete') group by 1 order by 1`);
ok('정책 수 team_pings 5 · team_ping_replies 5', JSON.stringify(pol.rows) === JSON.stringify([{ tablename: 'team_ping_replies', c: 5 }, { tablename: 'team_pings', c: 5 }]), JSON.stringify(pol.rows));
let chk = rd('2026-10-04-dm-rls-check.sql').replaceAll('<A_ID>', A).replaceAll('<B_ID>', B).replaceAll('<C_ID>', C);
try { await db.exec(chk); ok('확인 쿼리 파일 전체 실행 오류 없음([사전-6]·[사전-7] 포함, 대시보드처럼 관리자 권한)', true); } catch (e) { ok('확인 쿼리 파일 실행', false, e.message); }
const s7 = await db.query(rd('2026-10-04-dm-rls-check.sql').split('-- [사전-7]')[1].split('\n').slice(1).filter(l => !l.trim().startsWith('--')).join('\n'));
ok('[사전-7] 규칙 밖 행 수 0·0·0(시험 데이터 기준)', s7.rows.every(r => Number(r['수']) === 0), JSON.stringify(s7.rows.map(r => Number(r['수']))));
// 나중에 누가 team_ping_replies 에 update 허용 정책을 더해도 2단계 update 규칙(보낸 사람만·대화방 유지)이 막는지
await asOwner(db, `create policy "future open update" on team_ping_replies for update to authenticated using (true) with check (true)`);
let fu = await as(db, 'authenticated', B, `update team_ping_replies set message='edited' where id='r1'`);
ok('[허용 update 가 생겨도] 받는 사람 B 가 본문 고치기 0행', !fu.err && fu.n === 0, show(fu));
fu = await as(db, 'authenticated', A, `update team_ping_replies set ping_id='${AC}' where id='r1'`);
ok('[허용 update 가 생겨도] 보낸 사람 A 가 메시지를 A-C 대화방으로 옮기기 거절', !!fu.err, show(fu));
fu = await as(db, 'authenticated', A, `update team_ping_replies set sender_id='${C}' where id='r1'`);
ok('[허용 update 가 생겨도] 보낸 사람 A 가 보낸 사람을 C 로 바꾸기 거절', !!fu.err, show(fu));
fu = await as(db, 'authenticated', A, `update team_ping_replies set message='fixed' where id='r1'`);
ok('[허용 update 가 생겨도] 보낸 사람 A 가 자기 본문 고치기 1행', !fu.err && fu.n === 1, show(fu));
await asOwner(db, `drop policy "future open update" on team_ping_replies`);
await db.exec('alter table team_ping_replies force row level security;');
await as(db, 'authenticated', A, insReply('r9', AB, A, B));
let fr = await as(db, 'authenticated', B, `select public.og_dm_mark('${AB}', true) as v`);
ok('FORCE RLS 켜면 og_dm_mark 0행(그래서 [사전-6] 에서 rls_강제=false 확인)', !fr.err && fr.rows[0].v === 0, show(fr));
await db.exec('alter table team_ping_replies no force row level security;');
fr = await as(db, 'authenticated', B, `select public.og_dm_mark('${AB}', true) as v`);
ok('FORCE 끄면 og_dm_mark 다시 1행', !fr.err && fr.rows[0].v === 1, show(fr));
await asOwner(db, rd('2026-10-04-dm-rls-step2-rollback.sql'));
const left = await db.query(`select count(*)::int c from pg_policies where policyname in ('es347_anon_no_access','es347_auth_select','es347_auth_insert','es347_auth_update','es347_auth_delete')`);
ok('되돌리기 뒤 2단계 정책 0', left.rows[0].c === 0, left.rows[0].c);
let rb = await as(db, 'authenticated', C, `select count(*)::int v from team_ping_replies where ping_id='${AB}'`);
ok('되돌리기 뒤 C 가 다시 A-B 대화 읽음(1단계 직후로 복귀)', !rb.err && rb.rows[0].v > 0, show(rb));
rb = await as(db, 'anon', null, `select count(*)::int v from team_ping_replies`);
ok('되돌리기 뒤에도 anon 0(1단계 유지)', !rb.err && rb.rows[0].v === 0, show(rb));
await as(db, 'authenticated', A, insReply('r10', AB, A, B));
rb = await as(db, 'authenticated', B, `select public.og_dm_mark('${AB}', true) as v`);
ok('되돌리기 뒤에도 og_dm_mark 동작(1행)', !rb.err && rb.rows[0].v === 1, show(rb));

console.log('결과', total - fails, '/', total);
process.exitCode = fails ? 1 : 0;
