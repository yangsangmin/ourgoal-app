'use strict';
// Task-specific worker measurement; product and Court verdicts are not produced.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),source='C:/dev/agent-knowledge';
const report=__dirname,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=f=>sha(fs.readFileSync(f)),json=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n','utf8');};
function command(name,cmd,args){const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',env:process.env,maxBuffer:64*1024*1024});const record={command:cmd,args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,measuredAt:new Date().toISOString()};write(path.join(report,name+'.raw.json'),record);if(r.status!==0)throw Error(name+': '+r.stdout+r.stderr);return r.stdout;}
const base=command('base-commit','git',['rev-parse','origin/main']).trim();
const oldReference=spawnSync('git',['show',base+':docs/agents/WORK-REFERENCE.md'],{cwd:root}).stdout;
const oldPr=Number((oldReference.toString('utf8').match(/기준 PR #(\d+)/)||[])[1]);
const history=[];
for(const name of ['lessons.json','WORK-REFERENCE.md','reference-meta.json']){
  const r=spawnSync('git',['show',base+':docs/agents/'+name],{cwd:root});
  if(r.status!==0){history.push({name,present:false});continue;}
  const target='docs/agents/history/'+oldPr+'-'+name;fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});
  fs.writeFileSync(path.join(root,target),r.stdout);history.push({name,present:true,sourceCommit:base,gitByteSha256:sha(r.stdout),historyPath:target,historySha256:hash(path.join(root,target)),sameBytes:fs.readFileSync(path.join(root,target)).equals(r.stdout)});
}
const copied=[];
for(const name of ['lessons.json','WORK-REFERENCE.md','reference-meta.json']){
  const file=path.join(source,name),before=hash(file),bytes=fs.readFileSync(file);const target=path.join(root,'docs/agents',name);
  fs.writeFileSync(target,bytes);if(hash(file)!==before)throw Error('SOURCE_CAS_CHANGED: '+name);
  copied.push({name,sourceSha256:before,targetSha256:hash(target),sameBytes:fs.readFileSync(target).equals(bytes)});
}
const sourceLessons=json(path.join(source,'lessons.json')),targetLessons=json(path.join(root,'docs/agents/lessons.json'));
const oldLessons=JSON.parse(spawnSync('git',['show',base+':docs/agents/lessons.json'],{cwd:root}).stdout.toString('utf8'));
const ids=new Map(targetLessons.map(l=>[l.id,l]));
const idChecks=sourceLessons.map(l=>({id:l.id,versionHash:sha(stable(l)),targetVersionHash:sha(stable(ids.get(l.id))),same:stable(l)===stable(ids.get(l.id)),sourcePRs:l['출처PR'],confirmationCount:l['확인횟수']}));
const missingOldIds=oldLessons.filter(l=>!ids.has(l.id)).map(l=>l.id);
const text=fs.readFileSync(path.join(root,'docs/agents/WORK-REFERENCE.md'),'utf8');const meta=json(path.join(root,'docs/agents/reference-meta.json'));
const headerPr=Number((text.match(/기준 PR #(\d+)/)||[])[1]),headerCount=Number((text.match(/경험칙 (\d+)개/)||[])[1]);
const entry='C:/dev/agent-knowledge/shared-learning.js';
const readme=path.join(root,'docs/agents/README.md');
const marker='<!-- TASK-ES-586 shared-learning-discovery -->';
if(!fs.readFileSync(readme,'utf8').includes(marker))fs.appendFileSync(readme,'\n'+marker+'\n## 공통 학습 연결 도구 발견\n\n현재 PC의 고정 절대 entry: `'+entry+'`. 어느 프로젝트/새 세션에서든 자기 실제 작업트리를 명시한다.\n\n```powershell\nnode '+entry+' bootstrap --repo-root <자기실제전용작업트리> --participants <명시참여계약.json> --task-id <TASK> --task-kind <유형> --out <자기트리/학습진입.json> --brief <자기트리/학습지침.md>\n```\n\n[공통 연결 사용법](shared-learning/README.md)과 WORK-REFERENCE 전체읽기를 함께 사용한다. 절대 entry 설치가 없는 다른 PC/클라우드는 저장소 `docs/design/harness/shared-learning/cli.js`에 `--repo-root`·`--registry-root docs/agents/shared-learning`을 명시해 같은 CLI를 사용한다. canonical 원천이 없으면 저장소 사본을 읽고 fallback/기준PR/실제원장수를 확인한다. 권한은 명시한 참여계약에서 확인하며 도구명으로 넓히지 않는다. 기존 규범·승격정책은 그대로이고, 새 의무를 이 안내에서 만들지 않는다.\n<!-- /TASK-ES-586 shared-learning-discovery -->\n','utf8');
const registryRoot=path.join(report,'fallback-registry');fs.mkdirSync(registryRoot,{recursive:true});
const installed=path.join(source,'shared-learning-runtime',meta.commit,'docs/agents/shared-learning');
for(const name of ['registry.json','core.md','adapters'])fs.cpSync(path.join(installed,name),path.join(registryRoot,name),{recursive:true});
const registry=json(path.join(registryRoot,'registry.json'));registry.sources.canonicalRoot=path.join(report,'canonical-intentionally-unavailable');write(path.join(registryRoot,'registry.json'),registry);
write(path.join(report,'participants.json'),[{tool:'unknown-generic',role:'fallback-worker',worktree:root,owns:['reports/TASK-ES-586/**'],allowedActions:['read','bootstrap']}]);
command('fallback-bootstrap',process.execPath,[entry,'bootstrap','--repo-root',root,'--registry-root',registryRoot,'--participants',path.join(report,'participants.json'),'--task-id','TASK-ES-586','--task-kind','fallback-sync','--out',path.join(report,'fallback-bootstrap.json'),'--brief',path.join(report,'fallback-brief.md')]);
const boot=json(path.join(report,'fallback-bootstrap.json'));
const receipt=boot.readReceipt.find(r=>r.sourcePath===path.join(root,'docs/agents/WORK-REFERENCE.md'));
const proof={measurementOnly:true,productVerdict:null,baseCommit:base,history,copied,originalCount:oldLessons.length,canonicalCount:sourceLessons.length,fallbackCount:targetLessons.length,idChecks,missingOldIds,header:{basePr:headerPr,count:headerCount,metaBasePr:meta.basePr,metaCount:meta.lessons,countsMatch:headerCount===targetLessons.length&&meta.lessons===targetLessons.length,prMatch:headerPr===meta.basePr},absoluteEntryPresent:text.includes(entry)&&fs.readFileSync(readme,'utf8').includes(entry),fallback:{selected:boot.sourceSelection.fallback,root:boot.sourceSelection.selectedRoot,actualCount:boot.source.actualCount,headerCountMatches:boot.source.headerCountMatches,fullReferenceReceipt:receipt,receiptMatches:receipt?.sha256===hash(path.join(root,'docs/agents/WORK-REFERENCE.md')),commandsExecuted:0},canonicalLedgerAfterSha256:hash(path.join(source,'lessons.json')),effectImprovement:null,measuredAt:new Date().toISOString()};
write(path.join(report,'sync-proof.json'),proof);console.log(JSON.stringify({missingOldIds,allVersionsSame:idChecks.every(l=>l.same),countsMatch:proof.header.countsMatch,prMatch:proof.header.prMatch,absoluteEntryPresent:proof.absoluteEntryPresent,fallbackSelected:proof.fallback.selected,fallbackReceiptMatches:proof.fallback.receiptMatches,historyPreserved:history.filter(h=>h.present).every(h=>h.sameBytes)},null,2));
if(missingOldIds.length||!idChecks.every(l=>l.same)||!proof.header.countsMatch||!proof.header.prMatch||!proof.absoluteEntryPresent||!proof.fallback.selected||!proof.fallback.receiptMatches)process.exitCode=2;
