'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {PGlite}=require(process.env.OG_703_PGLITE_MODULE || '@electric-sql/pglite');
const root=path.resolve(__dirname,'../../..'), privateDir=path.dirname(JSON.parse(fs.readFileSync(path.join(__dirname,'bundle.json'),'utf8')).priorRef);
const catalog=JSON.parse(fs.readFileSync(path.join(privateDir,'prior-definitions.private.json'),'utf8')).packet;
const source=cp.execFileSync('git',['show',':docs/sql/2026-10-13-feed-private-stage2.sql'],{cwd:root,encoding:'utf8',windowsHide:true});
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),ident=s=>'"'+s.replaceAll('"','""')+'"';
const result={schema:'builder-corrective-postgresql-review/1',sourceSHA:sha(source),sourceMethod:'git show :docs/sql/2026-10-13-feed-private-stage2.sql',worktreeSHA:sha(fs.readFileSync(path.join(root,'docs/sql/2026-10-13-feed-private-stage2.sql'))),productionCalls:0,engine:'PGlite PostgreSQL WASM',limitations:['Local synthetic schema/account IDs; no production-user or Court verdict','Historical metadata recreated, not exact server state'],checks:[]};
const db=new PGlite();
const scenario=process.argv[2]||'baseline';result.scenario=scenario;
const run=async(name,fn)=>{try{const value=await fn();result.checks.push({name,ok:true,value});return value;}catch(e){result.checks.push({name,ok:false,code:e.code||null,message:e.message});return null;}};
async function main(){
 await db.waitReady;
 result.version=(await db.query('select version() as v')).rows[0].v;
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,created_at timestamptz default now());create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to public;`);
 const core=['content_reactions','helpful_reasons','feed_settings','feed_settings_log'];
 for(const r of catalog.relations){
  const cols=r.columns.map(c=>ident(c.name)+' '+c.type+(c.identity?' generated '+(c.identity==='a'?'always':'by default')+' as identity':'')+(c.default&&!c.identity&&core.includes(r.name)?' default '+c.default:'')+(c.notNull?' not null':''));
  await db.exec('create table public.'+ident(r.name)+'('+cols.join(',')+');');
 }
 for(const r of catalog.relations.filter(r=>core.includes(r.name))){
  for(const c of r.constraints)await db.exec('alter table public.'+ident(r.name)+' add constraint '+ident(c.name)+' '+c.definition);
  for(const i of r.indexes)if(!/USING btree \(id\)$|CREATE UNIQUE INDEX .*_(pkey|user_id_target_type_target_id(_type)?_key)/.test(i))await db.exec(i);
  if(r.rls)await db.exec('alter table public.'+ident(r.name)+' enable row level security;');
  await db.exec('grant all on public.'+ident(r.name)+' to anon,authenticated,service_role;');
 }
 for(const f of catalog.functions){await db.exec(f.definition);await db.exec('grant execute on function '+f.signature+' to anon,authenticated,service_role;');}
 for(const p of catalog.policies.filter(p=>core.includes(p.table))){await db.exec('create policy '+ident(p.name)+' on public.'+ident(p.table)+' as '+p.permissive+' for '+p.command+' to '+p.roles.map(x=>x==='public'?'public':ident(x)).join(',')+(p.using?' using ('+p.using+')':'')+(p.check?' with check ('+p.check+')':''));}
 for(const v of catalog.relatedViews)await db.exec('create view public.'+ident(v.name)+' as '+v.definition);
 for(const t of catalog.triggers)await db.exec(t.definition);
 const existingTargetSQL=`begin;insert into auth.users(id) values('00000000-0000-4000-8000-000000000003');select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);select public.react_content('checkin','synthetic-checkin','cheer');rollback;`;
 if(scenario==='baseline')await run('existing checkin reaction before apply',()=>db.exec(existingTargetSQL).then(()=>({accepted:true,rowsPersisted:0})));
 const mutations={
  overload:`create function public.list_content_advice(p_target_ids text[],extra boolean) returns table(advice_text text) language sql security definer as $$select advice_text from public.content_reactions$$;`,
  columnACL:`grant select(reason) on public.feed_settings_log to authenticated;`,
  indexDrift:`create index review_new_idx on public.content_reactions(reason_text);`,
  functionDrift:`alter function public.list_content_advice(text[]) volatile;`,
  ownerDrift:`alter function public.list_content_advice(text[]) owner to service_role;`
 };
 if(mutations[scenario])await db.exec(mutations[scenario]);
 if(scenario.startsWith('namedOverload-')){const name=scenario.slice('namedOverload-'.length);if(!catalog.functions.some(f=>f.name===name))throw Error('UNKNOWN_RPC');await db.exec('create function public.'+ident(name)+'(p_review boolean) returns integer language sql as $$select 1$$');}
 if(scenario==='missingSignature')await db.exec('drop function public.list_content_advice(text[]);');
 await run('exact source full SQL + DO-body compilation',()=>db.exec(source).then(()=>({transactionCommitted:true})));
 await db.exec('rollback;');
 if(scenario!=='baseline'){
  await run('post-apply drift visibility',async()=>({columnReasonSelect:(await db.query(`select has_column_privilege('authenticated','public.feed_settings_log','reason','select') as yes`)).rows[0].yes,overloadAnonExecute:(await db.query(`select case when to_regprocedure('public.list_content_advice(text[],boolean)') is null then false else has_function_privilege('anon','public.list_content_advice(text[],boolean)','execute') end as yes`)).rows[0].yes}));
  fs.writeFileSync(path.join(__dirname,'pg-result-'+scenario+'.json'),JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify(result));await db.close();return;
 }
 // If reconstructed catalog differs, test the implementation body with guard stages omitted explicitly.
 const implementation=source.slice(source.indexOf('-- 본인 원행 읽기만;'));
 await run('implementation compilation + ACL oracle (catalog guards deliberately omitted)',()=>db.exec('begin;'+implementation.replace(/do \$owner\$[\s\S]*?\$owner\$;/,'' )).then(()=>({transactionCommitted:true})));
 await run('same existing checkin reaction after apply',()=>db.exec(existingTargetSQL).then(()=>({accepted:true,rowsPersisted:0})));
 await db.exec('rollback;');
 await run('goal_template reaction after apply',()=>db.exec(existingTargetSQL.replaceAll('synthetic-checkin','synthetic-template').replaceAll("'checkin'","'goal_template'")).then(()=>({accepted:true,rowsPersisted:0})));
 await db.exec('rollback;');
 const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 await db.exec(`insert into auth.users(id) values('${a}'),('${b}');`);
 const template=fs.readFileSync(path.join(root,'reports/TASK-OG-FEED-PRIVATE-STAGE2-INSTALL-01a1310c/PRIVILEGE-TEST-TEMPLATE.sql'),'utf8').replaceAll('TEST_A_UUID',a).replaceAll('TEST_B_UUID',b);
 await run('exact privilege template with synthetic UUIDs',()=>db.exec(template).then(r=>r.filter(x=>x.rows.length).map(x=>x.rows)));
 await db.exec('rollback;');
 await run('function execution ACL',async()=>({rows:(await db.query(`select p.proname,has_function_privilege('anon',p.oid,'execute') as anon,has_function_privilege('authenticated',p.oid,'execute') as authenticated,exists(select 1 from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE') as public_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('list_content_advice','save_helpful_reason','react_content','helpful_reason_summary','my_helpful_tag_profile','feed_value_counts','feed_settings_get','count_content_reactions') order by p.proname`)).rows}));
 await run('helpful_reason_summary blocks foreign owner / returns aggregate only',async()=>{
  await db.exec(`insert into public.feed_posts(id,user_id,display_name,caption,created_at,cheers_count,hidden) values('review-post','${b}','reviewB','review',now(),0,false);insert into public.users(id,username,display_name,created_at,is_bot,region_public,saved_avatars) values('${a}','reviewA','reviewA',now(),false,false,'{}'),('${b}','reviewB','reviewB',now(),false,false,'{}');insert into public.helpful_reasons(target_type,target_id,user_id,reason_tag,reason_text) values('feed_post','review-post','${a}','how_to','PRIVATE_SYNTHETIC_MARKER');select set_config('request.jwt.claim.sub','${b}',false);set role authenticated;`);
  const rows=(await db.query(`select public.helpful_reason_summary('feed_post','review-post') as summary`)).rows;
  await db.exec('reset role;');
  return {tags:rows[0].summary.tags,texts:rows[0].summary.texts,privateMarkerReturned:JSON.stringify(rows).includes('PRIVATE_SYNTHETIC_MARKER')};
 });
 await db.exec('reset role;');
 await run('foreign owner summary denied',async()=>{await db.exec(`select set_config('request.jwt.claim.sub','${a}',false);set role authenticated;`);try{await db.query(`select public.helpful_reason_summary('feed_post','review-post')`);return {denied:false};}catch(e){return {denied:true,code:e.code,message:e.message};}finally{await db.exec('reset role;');}});
 await run('anon private RPC denial',async()=>{await db.exec('set role anon;');try{await db.query(`select * from public.list_content_advice(array['review-post']);`);return {denied:false};}catch(e){return {denied:true,code:e.code};}finally{await db.exec('reset role;');}});
 await run('public view raw-field scan',async()=>({viewColumns:(await db.query(`select column_name from information_schema.columns where table_schema='public' and table_name='helpful_reason_stats'`)).rows.map(x=>x.column_name)}));
 await run('exact private rollback execution (local only; restores legacy exposure)',()=>db.exec(fs.readFileSync(path.join(privateDir,'rollback-703-correction.private.sql'),'utf8')).then(()=>({committed:true})));
 fs.writeFileSync(path.join(__dirname,'pg-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
 console.log(JSON.stringify(result));await db.close();
}
main().catch(async e=>{result.fatal={code:e.code||null,message:e.message};fs.writeFileSync(path.join(__dirname,'pg-result.json'),JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify({fatal:result.fatal}));await db.close();process.exitCode=1;});
