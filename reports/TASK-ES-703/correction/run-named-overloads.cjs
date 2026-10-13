'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const bundle=JSON.parse(fs.readFileSync(path.join(__dirname,'bundle.json'),'utf8')),checks=[];
for(const f of bundle.functions){
 const run=cp.spawnSync(process.execPath,[path.join(__dirname,'pg-review.cjs'),'namedOverload-'+f.name],{encoding:'utf8',windowsHide:true});
 assert.equal(run.status,0,run.stderr);const value=JSON.parse(run.stdout.trim());
 const check=value.checks.find(c=>c.name==='exact source full SQL + DO-body compilation');
 assert.equal(check.ok,false);assert.equal(check.message,'CURRENT_FUNCTION_SIGNATURE_SET_CHANGED');assert.equal(value.sourceSHA,bundle.sqlSHA);
 checks.push({name:f.name,rejectedBeforeReplace:true,error:check.message,sourceSHA:value.sourceSHA});
}
const result={schema:'703-all-named-overloads/1',productionCalls:0,scope:'local synthetic PostgreSQL schema',checks};
fs.writeFileSync(path.join(__dirname,'all-named-overloads.json'),JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify({overloadsRejected:checks.length,sourceSHA:bundle.sqlSHA,productionCalls:0}));
