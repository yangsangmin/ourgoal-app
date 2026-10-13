'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),q=s=>"'"+s.replaceAll("'","''")+"'";
const r=JSON.parse(fs.readFileSync(path.join(__dirname,'preflight-result.json'),'utf8')),p=JSON.parse(fs.readFileSync(r.priorDefinitionRef,'utf8')).packet,prepared=JSON.parse(fs.readFileSync(path.join(__dirname,'prepared.json'),'utf8'));
if(sha(fs.readFileSync(r.priorDefinitionRef))!==r.priorDefinitionSHA)throw Error('PRIOR_CHANGED');
const names=prepared.functions.map(f=>f.name),targets=prepared.changedTables;
const policy=p.policies.find(x=>x.table==='feed_settings_log'&&x.name==='feed_settings_log_read_all');if(!policy)throw Error('ORIGINAL_POLICY_MISSING');
function aclSQL(kind,target,acl){return `do $acl$
declare a record; who text;
begin
 for a in select * from aclexplode(${acl===null?`acldefault('${kind==='function'?'f':'r'}',(select ${kind==='function'?'proowner from pg_proc where oid=to_regprocedure('+q(target)+')':'relowner from pg_class where oid=to_regclass('+q(target)+')'}))`:`${q('{'+acl.map(s=>'"'+s.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"').join(',')+'}')}::aclitem[]`}) loop
  who:=case when a.grantee=0 then 'PUBLIC' else (select quote_ident(rolname) from pg_roles where oid=a.grantee) end;
  if who is null then raise exception 'ORIGINAL_GRANTEE_MISSING'; end if;
  execute 'grant '||a.privilege_type||' on ${kind} ${target} to '||who||case when a.is_grantable then ' with grant option' else '' end;
 end loop;
end;
$acl$;`;}
let sql=`-- OWNER-LOCAL PRIVATE prior restoration. Transaction failure uses ROLLBACK automatically, not this script.
-- POST-COMMIT use can reopen the old wider exposure. Root must decide while writers remain held;
-- never blindly run after private new user writes or restore data rows.
begin;
set local lock_timeout='5s'; set local statement_timeout='30s';
lock table public.content_reactions,public.helpful_reasons,public.feed_settings,public.feed_settings_log in share row exclusive mode;
do $cas$
begin
${prepared.functions.map(f=>` if (select md5(prosrc) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=${q(f.name)}) is distinct from ${q(f.bodyMD5)} then raise exception 'CORRECTED_SOURCE_CHANGED: ${f.name}'; end if;`).join('\n')}
end;
$cas$;
${p.functions.filter(f=>names.includes(f.name)).map(f=>f.definition+';').join('\n\n')}
drop policy if exists feed_settings_log_read_all on public.feed_settings_log;
create policy ${policy.name} on public.${policy.table} as ${policy.permissive} for ${policy.command} to ${policy.roles.map(s=>s==='public'?'public':'"'+s.replaceAll('"','""')+'"').join(',')} using (${policy.using});
${targets.map(t=>'revoke all on table public.'+t+' from public,anon,authenticated,service_role;').join('\n')}
revoke select(key,value) on public.feed_settings from anon,authenticated;
${p.relations.filter(t=>targets.includes(t.name)).map(t=>aclSQL('table','public.'+t.name,t.acl)).join('\n')}
${p.functions.filter(f=>names.includes(f.name)).map(f=>'revoke all on function public.'+f.signature+' from public,anon,authenticated,service_role;\n'+aclSQL('function','public.'+f.signature,f.acl)).join('\n')}
commit;
`;
const file=path.join(path.dirname(r.priorDefinitionRef),'rollback.private.sql');fs.writeFileSync(file,sql,{encoding:'utf8',flag:'wx'});
const out={...prepared,rollbackPrivateRef:file,rollbackPrivateSHA:sha(fs.readFileSync(file)),rollbackExecutableComplete:true,rollbackSQLRun:0,rollbackReopensPriorExposure:true,restoreDataRows:0,restoreNewerSettingsRows:0,ownerBaselineCaptured:false,ownerChangeProtection:'no-owner-edit; apply-transaction must capture and compare its start/end actual owner OIDs; preflight owner prior unknown'};
fs.writeFileSync(path.join(__dirname,'prepared-complete.json'),JSON.stringify(out,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({rollbackExecutableComplete:true,rollbackSHA:out.rollbackPrivateSHA,SQLRun:0}));
