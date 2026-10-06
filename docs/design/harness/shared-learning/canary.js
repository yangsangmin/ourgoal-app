#!/usr/bin/env node
'use strict';
const { fs, path, json, hashFile, write } = require('./common');
const { spawnSync } = require('node:child_process');
const repo=path.resolve(__dirname,'../../../..');
const source=process.argv[2];
if(!source)throw Error('historical-evidence read-only directory required');
const destination=path.join(repo,'reports/TASK-ES-584/canary',String(Date.now()));
const names=['582-original-copied-tab-after.json','581-measured-tab-after.json','582-original-manifest.json'];
fs.mkdirSync(destination,{recursive:true});
const receipts=[];
for(const name of names){
  const file=path.join(source,name);const bytes=fs.readFileSync(file);const out=path.join(destination,name);
  fs.writeFileSync(out,bytes,{flag:'wx'});
  receipts.push({sourceLabel:name,sourceSha256:hashFile(file),snapshotPath:path.relative(repo,out),snapshotSha256:hashFile(out)});
}
const manifest=json(path.join(destination,names[2]));
const items=manifest.requiredItems || manifest.items || [];
const task582Index=items.flatMap(i=>i.inputFiles||[]).find(i=>i.path==='index.html')?.sha256;
const task581Index='cad25d67075dce510e975379243e5da22c4d3b896d1879341101c441c036f5d1';
const original=json(path.join(repo,'reports/TASK-ES-584/learning-event.json'));
const event=JSON.parse(JSON.stringify(original));
event.taskId='TASK-ES-582';event.eventId='historical-canary';event.inputProductSha=task582Index;
event.evidence[0].sourceTask='TASK-ES-581';event.evidence[0].scope='work-after';event.evidence[0].inputProductSha=task581Index;
event.evidence[0].rawPath=path.relative(repo,path.join(destination,names[0]));event.evidence[0].rawSha256=receipts[0].snapshotSha256;
event.evidence[0].publishedPath=event.evidence[0].rawPath;event.evidence[0].publishedSha256=event.evidence[0].rawSha256;
const eventFile=path.join(destination,'misused-event.json');write(eventFile,event);
const args=['docs/design/harness/shared-learning/cli.js','validate','--event',eventFile,'--source-root','C:/dev/agent-knowledge','--repo-root',repo,'--read-roots','reports/TASK-ES-584/read-roots.json'];
const run=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8'});
const result=JSON.parse(run.stdout);
const observed={measurementOnly:true,productVerdict:null,scope:'historical-source-input-integrity-only',
  sourceCommits:{task582:'9c75dcbbb6e4b73cb7ff4a68a8fc62375d4a9046',task581:'318864ed51527c8e05aac99316d2beb3d1862220'},
  receipts,sameAfterBytes:receipts[0].sourceSha256===receipts[1].sourceSha256,
  task582IndexSha256:task582Index,task581IndexSha256:task581Index,differentProductInputs:task582Index!==task581Index,
  command:process.execPath,args,exitCode:run.status,stdout:run.stdout,stderr:run.stderr,
  inputBoundaryRejected:result.errors.includes('INPUT_PRODUCT_MISMATCH'),scopeBoundaryRejected:result.errors.includes('CROSS_TASK_AFTER'),
  originalExecutionTruthProven:false,measuredAt:new Date().toISOString()};
write(path.join(destination,'check.json'),observed);
write(path.join(repo,'reports/TASK-ES-584/canary-summary.json'),observed);
console.log(JSON.stringify(observed,null,2));
if(run.status!==2||!observed.sameAfterBytes||!observed.differentProductInputs||!observed.inputBoundaryRejected||!observed.scopeBoundaryRejected)process.exitCode=2;
