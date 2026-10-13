'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),q=s=>"'"+s.replaceAll("'","''")+"'";
const r=JSON.parse(fs.readFileSync(path.join(__dirname,'preflight-result.json'),'utf8')),p=JSON.parse(fs.readFileSync(r.priorDefinitionRef,'utf8')).packet,prep=JSON.parse(fs.readFileSync(path.join(__dirname,'prepared-complete.json'),'utf8'));
let sql=fs.readFileSync(path.join(__dirname,'APPLY-PRIVATE-STAGE2.sql'),'utf8');
const tableNames=prep.changedTables.map(q).join(','),functionNames=prep.functions.map(f=>q(f.name)).join(',');
const triggerExpected=p.triggers.filter(t=>prep.changedTables.includes(t.table));
const guard=`
-- owner OIDs are captured inside this actual transaction; historical preflight owner baseline is unknown.
create temporary table __og_feed_owner_frame on commit drop as
 select 'function'::text as kind,p.oid,p.proowner as owner from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (${functionNames})
 union all select 'table',c.oid,c.relowner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in (${tableNames});
do $seams$
declare actual jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid))),'[]'::jsonb) into actual from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in (${tableNames}) and not t.tgisinternal;
 if exists(select value from jsonb_array_elements(actual) except select value from jsonb_array_elements(${q(JSON.stringify(triggerExpected))}::jsonb)) or exists(select value from jsonb_array_elements(${q(JSON.stringify(triggerExpected))}::jsonb) except select value from jsonb_array_elements(actual)) then raise exception 'CURRENT_TRIGGER_CHANGED'; end if;
${p.relatedViews.map(v=>` if (select md5(pg_get_viewdef(c.oid,true)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=${q(v.name)}) is distinct from ${q(crypto.createHash('md5').update(v.definition).digest('hex'))} then raise exception 'CURRENT_RELATED_VIEW_CHANGED'; end if;`).join('\n')}
end;
$seams$;
`;
sql=sql.replace('do $guard$',guard+'\ndo $guard$').replaceAll('set search_path = public','set search_path = pg_catalog, public, pg_temp');
sql=sql.replace('commit;',`do $owner$
begin
 if exists(select 1 from __og_feed_owner_frame f left join pg_proc p on f.kind='function' and p.oid=f.oid left join pg_class c on f.kind='table' and c.oid=f.oid where f.owner is distinct from case when f.kind='function' then p.proowner else c.relowner end) then raise exception 'OWNER_CHANGED_DURING_APPLY'; end if;
end;
$owner$;
commit;`);
const file=path.join(__dirname,'APPLY-PRIVATE-STAGE2-FIXED.sql');fs.writeFileSync(file,sql,{encoding:'utf8',flag:'wx'});
const finalFunctions=[...sql.matchAll(/create or replace function public\.(\w+)\([\s\S]*?as \$fn\$([\s\S]*?)\$fn\$;/g)].map(m=>({name:m[1],bodyMD5:crypto.createHash('md5').update(m[2]).digest('hex'),sqlSHA:sha(m[0])}));
const out={...prep,functions:finalFunctions,sqlFile:path.basename(file),sqlSHA:sha(sql),historicalOwnerBaseline:null,currentOwnerCheckedWithinApplyTransaction:true,firstMetricAlreadyPerformedBySeparateOwner:true,metricRerun:0,afterApplyScope:'changed privacy permission and aggregate compatibility only; no full-use claim until UI labels fixed'};
fs.writeFileSync(path.join(__dirname,'FINAL-PREPARED.json'),JSON.stringify(out,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({fixedSQLSHA:out.sqlSHA,SQLApply:0,metricRerun:0}));
