'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),md5=b=>crypto.createHash('md5').update(b).digest('hex'),q=s=>"'"+s.replaceAll("'","''")+"'";
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),result=JSON.parse(read('reports/TASK-OG-FEED-PRIVATE-STAGE2-INSTALL-01a1310c/preflight-result.json'));
const raw=fs.readFileSync(result.priorDefinitionRef);if(sha(raw)!==result.priorDefinitionSHA)throw Error('PRIOR_CHANGED');const packet=JSON.parse(raw).packet;
const targetTables=['content_reactions','helpful_reasons','feed_settings','feed_settings_log'];
for(const t of targetTables)if(!packet.relations.some(r=>r.name===t))throw Error('CURRENT_TABLE_MISSING');
const targetNames=['react_content','unreact_content','moderate_advice','count_content_reactions','my_content_reactions','list_content_advice','poor_reason_breakdown','save_helpful_reason','helpful_reason_summary','feed_settings_get','feed_settings_log_trigger','feed_value_counts','my_helpful_tag_profile'];
const oldRx=read('docs/sql/2026-09-12-content-reactions.sql'),oldReason=read('docs/sql/2026-09-12-helpful-reason.sql'),stage2=read('docs/sql/2026-10-13-feed-settings-and-value.sql');
function extract(source,name){const re=new RegExp('create or replace function public\\.'+name+'\\([\\s\\S]*?\\$fn\\$;','i'),m=source.match(re);if(!m)throw Error('SOURCE_FUNCTION '+name);return m[0];}
function replaceExact(s,a,b){if(!s.includes(a))throw Error('SOURCE_SEAM '+a.slice(0,80));return s.replace(a,b);}
const functions=new Map();
for(const n of ['unreact_content','count_content_reactions','poor_reason_breakdown'])functions.set(n,extract(oldRx,n));
let react=extract(oldRx,'react_content');
react=replaceExact(react,"values\r\n      (p_target_type, p_target_id, v_uid, left(p_reactor_name, 60), p_type,","values\r\n      (p_target_type, p_target_id, v_uid, null, p_type,");
react=replaceExact(react,'reactor_name = coalesce(left(p_reactor_name, 60), reactor_name),','reactor_name = reactor_name, -- 원값 보존; 새 이름 수집 없음');
react=replaceExact(react,"case when p_type = 'advice' then p_advice_visibility else null end)","case when p_type = 'advice' then 'author_only' else null end)");
react=replaceExact(react,"advice_visibility = case when p_type = 'advice' then p_advice_visibility else advice_visibility end","advice_visibility = case when p_type = 'advice' then 'author_only' else advice_visibility end");
react=replaceExact(react,"  select coalesce(u.is_bot, false) into v_bot", "  if p_target_type <> 'feed_post' then raise exception 'unsupported target'; end if;\r\n  if not exists (select 1 from public.feed_posts p where p.id=p_target_id) then raise exception 'target not found'; end if;\r\n  if exists (select 1 from public.feed_posts p join public.users u on u.id=p.user_id where p.id=p_target_id and coalesce(u.is_bot,false)) then raise exception 'bot target'; end if;\r\n  select coalesce(u.is_bot, false) into v_bot");
functions.set('react_content',react);
functions.set('moderate_advice',`create or replace function public.moderate_advice(p_reaction_id bigint, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 if not exists(select 1 from public.content_reactions where id=p_reaction_id and user_id=auth.uid() and type='advice') then raise exception 'forbidden'; end if;
 if p_action='delete' then
  update public.content_reactions set deleted_at=now(),deleted_by='reactor',updated_at=now() where id=p_reaction_id and user_id=auth.uid() and type='advice';
 elsif p_action in ('everyone','author_only') then raise exception 'private advice only';
 else raise exception 'bad action'; end if;
 return jsonb_build_object('ok',true);
end;
$fn$;`);
functions.set('my_content_reactions',extract(oldRx,'my_content_reactions').replace('security definer','security invoker'));
functions.set('list_content_advice',`create or replace function public.list_content_advice(p_target_ids text[])
returns table(id bigint,target_id text,user_id uuid,reactor_name text,advice_text text,
 advice_visibility text,created_at timestamptz,is_owner boolean,is_mine boolean)
language sql stable security invoker set search_path = public as $fn$
 select r.id,r.target_id,r.user_id,null::text,r.advice_text,'author_only'::text,r.created_at,false,true
 from public.content_reactions r
 where r.user_id=auth.uid() and r.target_type='feed_post' and r.type='advice' and r.deleted_at is null and r.target_id=any(p_target_ids)
 order by r.created_at;
$fn$;`);
let save=extract(oldReason,'save_helpful_reason');const start=save.indexOf('  -- 품질 통과 시 공용 원장'),end=save.indexOf("  return jsonb_build_object",start);if(start<0||end<0)throw Error('CREDIT_SEAM');save=save.slice(0,start)+'  -- D22: 기존 원장/값 보존, 이번 저장에서 크레딧 지급 호출 없음.\r\n'+save.slice(end);functions.set('save_helpful_reason',save);
let summary=extract(oldReason,'helpful_reason_summary'),startText=summary.indexOf("  select coalesce(jsonb_agg(jsonb_build_object('tag', h.reason_tag, 'text'"),endText=summary.indexOf("  return jsonb_build_object",startText);if(startText<0||endText<0)throw Error('AUTHOR_RAW_SEAM');summary=summary.slice(0,startText)+"  v_texts := '[]'::jsonb; -- 작성자에게 태그 집계만 반환; 개인 원사유 반환 없음.\r\n\r\n"+summary.slice(endText);functions.set('helpful_reason_summary',summary);
for(const n of ['feed_settings_get','feed_settings_log_trigger','feed_value_counts','my_helpful_tag_profile'])functions.set(n,extract(stage2,n));
const expectedFunctions=packet.functions.filter(r=>targetNames.includes(r.name));if(expectedFunctions.length!==functions.size)throw Error('CURRENT_OVERLOAD_UNSUPPORTED');
const signatures=expectedFunctions.map(f=>'public.'+f.signature),fnExpected=expectedFunctions.map(f=>({signature:'public.'+f.signature,definitionMD5:f.definitionMD5,acl:f.acl,settings:f.settings,securityDefiner:f.securityDefiner,volatility:f.volatility}));
const targetPolicies=packet.policies.filter(p=>targetTables.includes(p.table)),policyExpected=JSON.stringify(targetPolicies),tableExpected=JSON.stringify(packet.relations.filter(r=>targetTables.includes(r.name)));
const guard=`do $guard$
declare expected jsonb := ${q(JSON.stringify(fnExpected))}::jsonb; row jsonb; actual jsonb; policies jsonb;
begin
 for row in select value from jsonb_array_elements(expected) loop
  select jsonb_build_object('definitionMD5',md5(pg_get_functiondef(p.oid)),'acl',p.proacl,'settings',p.proconfig,'securityDefiner',p.prosecdef,'volatility',p.provolatile) into actual from pg_proc p where p.oid=to_regprocedure(row->>'signature');
  if actual is null or actual is distinct from row-'signature' then raise exception 'CURRENT_FUNCTION_CHANGED: %',row->>'signature'; end if;
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('table',tablename,'name',policyname,'command',cmd,'roles',roles,'permissive',permissive,'using',qual,'check',with_check)),'[]'::jsonb) into policies from pg_policies where schemaname='public' and tablename in ('content_reactions','helpful_reasons','feed_settings','feed_settings_log');
 if exists(select value from jsonb_array_elements(policies) except select value from jsonb_array_elements(${q(policyExpected)}::jsonb)) or exists(select value from jsonb_array_elements(${q(policyExpected)}::jsonb) except select value from jsonb_array_elements(policies)) then raise exception 'CURRENT_POLICY_CHANGED'; end if;
 for row in select value from jsonb_array_elements(${q(tableExpected)}::jsonb) loop
  select jsonb_build_object('acl',c.relacl,'rls',c.relrowsecurity,'forcedRls',c.relforcerowsecurity,'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull,'identity',a.attidentity,'default',pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped)) into actual from pg_class c where c.oid=to_regclass('public.'||(row->>'name'));
  if actual is null or actual is distinct from jsonb_build_object('acl',row->'acl','rls',row->'rls','forcedRls',row->'forcedRls','columns',row->'columns') then raise exception 'CURRENT_TABLE_CHANGED: %',row->>'name'; end if;
 end loop;
end;
$guard$;`;
let sql=`-- D22 최소 개인정보 교정. 서버 적용 전 root의 별도 고정 소스 검토 필수.
-- 사전 metadata ${result.priorDefinitionSHA}; 원행/setting/credit 보존. exposure/credit/category/backfill 0.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table public.content_reactions,public.helpful_reasons,public.feed_settings,public.feed_settings_log in share row exclusive mode;
${guard}

-- 본인 원행 읽기만; 원래 RPC 쓰기 입구 유지. private audit는 운영자 기존 역할만.
revoke all on public.content_reactions,public.helpful_reasons,public.feed_settings,public.feed_settings_log from public,anon,authenticated;
grant select on public.content_reactions,public.helpful_reasons to authenticated;
grant select(key,value) on public.feed_settings to anon,authenticated;
drop policy if exists feed_settings_log_read_all on public.feed_settings_log;
${[...functions.values()].join('\n\n')}

-- PUBLIC 기본 EXECUTE를 제거한다. service_role 기존 권한을 보존하며 확장하지 않는다.
${signatures.map(s=>'revoke all on function '+s+' from public,anon,authenticated;').join('\n')}
${signatures.map(s=>'grant execute on function '+s+' to service_role;').join('\n')}
${signatures.filter(s=>!s.includes('feed_settings_log_trigger(')).map(s=>'grant execute on function '+s+' to authenticated;').join('\n')}
grant execute on function public.feed_settings_get(),public.count_content_reactions(text[]) to anon;

-- 적용 중 권한 readback 실패는 전체 transaction을 되돌린다.
do $oracle$
begin
 if has_table_privilege('anon','public.feed_settings_log','SELECT') or has_table_privilege('authenticated','public.feed_settings_log','SELECT') then raise exception 'AUDIT_PUBLIC_PRIVILEGE'; end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='feed_settings_log' and cmd in ('SELECT','ALL') and roles && array['public','anon','authenticated']::name[]) then raise exception 'AUDIT_PUBLIC_POLICY'; end if;
 if has_function_privilege('anon','public.list_content_advice(text[])','EXECUTE') or has_function_privilege('anon','public.save_helpful_reason(text,text,text,text)','EXECUTE') or has_function_privilege('anon','public.feed_value_counts(text[],integer)','EXECUTE') then raise exception 'RAW_OR_PRIVATE_ANON_EXECUTE'; end if;
 if not has_column_privilege('anon','public.feed_settings','value','SELECT') or has_column_privilege('anon','public.feed_settings','updated_at','SELECT') then raise exception 'SETTINGS_PRIVILEGE'; end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='content_reactions' and cmd='SELECT' and qual='(auth.uid() = user_id)') or not exists(select 1 from pg_policies where schemaname='public' and tablename='helpful_reasons' and cmd='SELECT' and qual='(auth.uid() = user_id)') then raise exception 'SELF_POLICY_CHANGED'; end if;
end;
$oracle$;
commit;
`;
sql=sql.replaceAll('\r\n','\n');
if(/public\.award_credit\s*\(/.test(sql)||/create table|drop table|delete from|insert into public\.feed_settings\s*\(/i.test(sql))throw Error('MINIMUM_SCOPE');
const sqlFile=path.join(__dirname,'APPLY-PRIVATE-STAGE2.sql');fs.writeFileSync(sqlFile,sql,{encoding:'utf8',flag:'wx'});
const rollback=[];
for(const old of expectedFunctions)rollback.push(old.definition+';');
rollback.push('drop policy if exists feed_settings_log_read_all on public.feed_settings_log;');
for(const p of targetPolicies.filter(p=>p.table==='feed_settings_log'))rollback.push(`create policy ${p.name} on public.${p.table} as ${p.permissive} for ${p.command} to ${p.roles.map(q).join(',')}${p.using?' using ('+p.using+')':''}${p.check?' with check ('+p.check+')':''};`);
// Exact ACL restore statements remain private and must be generated from captured aclexplode metadata.
const recipe={schema:'feed-private-rollback-recipe/1',priorRef:result.priorDefinitionRef,priorSHA:result.priorDefinitionSHA,restoreDefinitionsAndAuditPolicies:rollback,restoreACLFromPriorPacket:true,automaticExecute:false,requiresCurrentCorrectedSourceAndExclusiveChangeWindow:true,preserveAllRows:true,preserveSettingsValues:true,creditUntouched:true,restoreWouldReopenPriorExposure:true};
const rollbackFile=path.join(path.dirname(result.priorDefinitionRef),'rollback-recipe.private.json');fs.writeFileSync(rollbackFile,JSON.stringify(recipe,null,2)+'\n',{encoding:'utf8',flag:'wx'});
const bodyDigests=[...functions].map(([name,sql])=>({name,bodyMD5:md5(sql.match(/as \$fn\$([\s\S]*)\$fn\$;/)[1]),sqlSHA:sha(sql)}));
const prep={schema:'feed-private-stage2-prepared/1',preflightRef:'preflight-result.json',priorRef:result.priorDefinitionRef,priorSHA:result.priorDefinitionSHA,sqlFile:'APPLY-PRIVATE-STAGE2.sql',sqlSHA:sha(sql),rollbackPrivateRef:rollbackFile,rollbackPrivateSHA:sha(fs.readFileSync(rollbackFile)),rollbackExecutableComplete:false,functions:bodyDigests,changedTables:targetTables,existingCreditPreserved:true,newTables:0,newStoredReactorNames:0,creditPayoutCalls:0,SQLApplied:0,reviewRequired:true};fs.writeFileSync(path.join(__dirname,'prepared.json'),JSON.stringify(prep,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({sqlSHA:prep.sqlSHA,functions:bodyDigests.length,newTables:0,SQLApplied:0,rollbackExecutableComplete:prep.rollbackExecutableComplete}));
