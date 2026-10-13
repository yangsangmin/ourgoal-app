'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),base='0573f7f8e5d32af7693665d814f60fc62b8d8a87';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=p=>cp.execFileSync('git',['-c','core.longpaths=true','cat-file','blob',base+':'+p],{cwd:root,maxBuffer:32*1024*1024});
const names=['post-failure-retention','frozen-caption-preview','cancel-after-failure'];
const adapter=names.map(name=>{
 const file='reports/TASK-ES-701/scenarios/'+name+'.json',before=git(file),after=fs.readFileSync(path.join(root,file));
 const old=JSON.parse(before),current=JSON.parse(after),expected=JSON.parse(JSON.stringify(old));
 const step=expected.steps[6];step.do='type';step.text=step.value;step.clear=true;delete step.value;
 if(JSON.stringify(expected)!==JSON.stringify(current))throw new Error('단언/리터럴/단계 또는 타 행동 변경');
 return {file,beforeSha256:sha(before),afterSha256:sha(after),step:7,stepsBefore:old.steps.length,stepsAfter:current.steps.length,expectsBefore:old.steps.filter(s=>s.expect).length,expectsAfter:current.steps.filter(s=>s.expect).length,literalSame:old.steps[6].value===current.steps[6].text,allOtherStepsIdentical:true};
});
const observations=names.map(name=>{
 const dirs=fs.readdirSync(path.join(__dirname,'scenario-adapter-observations')).filter(d=>d.startsWith(name+'-'));
 if(dirs.length!==1)throw new Error('각 원시험 실행 1회 범위 불일치');
 const dir=path.join(__dirname,'scenario-adapter-observations',dirs[0]),input=JSON.parse(fs.readFileSync(path.join(dir,'input.json'),'utf8')),result=JSON.parse(fs.readFileSync(path.join(dir,'observation.sanitized.json'),'utf8')),children=JSON.parse(fs.readFileSync(path.join(dir,'children.json'),'utf8'));
 return {name,dir:path.relative(root,dir).replace(/\\/g,'/'),observerPid:input.observerPid,children:children.children,failedStep:result.observation.failedStep,failKind:result.observation.failKind,failReason:result.observation.failReason,toolError:result.observation.toolError,errors:result.observation.errors,stepsObserved:result.observation.steps.length,scope:result.scope};
});
const protectedPins=['js/tabs/records/share-to-feed.js','js/tabs/records/share-feed-save.js','index.html','reports/TASK-ES-701/claims.json','court/lib/scenario.js','court/lib/static-server.js','court/lib/site-host.js','court/lib/chrome.js','court/config.json'];
const unchanged=protectedPins.map(file=>{const before=git(file),after=cp.execFileSync('git',['-c','core.longpaths=true','show',':'+file],{cwd:root,maxBuffer:32*1024*1024});if(!before.equals(after))throw new Error('제품/주장/법정 수정 금지 경계');return {file,sha256:sha(before),gitBlobUnchanged:true};});
const dirs=fs.readdirSync(path.join(__dirname,'raw')).filter(d=>/-typed-scenario-C[245]-/.test(d));
if(dirs.length!==3)throw new Error('원시 attempt 개수 불일치');
const raw=dirs.flatMap(dir=>fs.readdirSync(path.join(__dirname,'raw',dir)).map(name=>{const file='reports/TASK-ES-701/raw/'+dir+'/'+name,b=fs.readFileSync(path.join(root,file));return {file,sha256:sha(b),bytes:b.length};}));
const evidence=observations.flatMap(row=>fs.readdirSync(path.join(root,row.dir)).map(name=>{const file=row.dir+'/'+name,b=fs.readFileSync(path.join(root,file));return {file,sha256:sha(b),bytes:b.length};}));
const scripts=['scenario-adapter-check.cjs','seal-scenario-adapter.cjs','sanitize-adapter-observations.cjs','scenario-adapter-redaction.json','scenario-adapter-initial-seal.json'].map(name=>{const file='reports/TASK-ES-701/'+name,b=fs.readFileSync(path.join(root,file));return {file,sha256:sha(b),bytes:b.length};});
const manifest={taskId:'TASK-ES-701',publicationBase:base,canonicalCorrectionProduct:'fe625f42fab8960629ecc7338c9401ef5547aed1',originalProductOpinion:'f4dd6c834fe30e2cbd1b7ea22791a40c96462c6a',adapter,unchanged,observations,artifacts:[...scripts,...evidence,...raw],secondCourt:{id:'242C845C',runId:'38403161791',returns:2,url:'https://github.com/yangsangmin/ourgoal-app/actions/runs/38403161791',privateLocalReportSha256:'772b2768646233027f7607c092bc23033b0c1f27d29833cfbc7a11b193e0892a',privateLocalVerdictSha256:'410a41a24f6199ea182aacdca7dcb41be7b8ab4f2dc907930e33c9236cb35570',cause:'C2/C4/C5 모두 단계7 textarea fill 어댑터가 지원되지 않음',originalFilesEdited:false,officialScorecardsPublished:false},localProbeMeaning:'같은 0573 제품의 세 입력 어댑터 변경에 대한 작업자 관찰이며 Court 판정/전체 통과/실제 계정 사용 증명이 아니다.',newOriginalPositiveReview:0,productionCodeChanges:0,claimsChanges:0,expectedAssertionsChanged:0,remoteWrites:0,thirdSubmission:'root의 정확 source 검토 전 보류',operatingUse:null};
const file=path.join(__dirname,'scenario-adapter-manifest.json');fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({manifestSha256:sha(fs.readFileSync(file)),adapter,observations,productionCodeChanges:0,claimsChanges:0,thirdSubmission:'보류'}));
