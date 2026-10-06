'use strict';
// Actual claims-format failure and repair; no product measurement or Court verdict.
const {fs,path,json,write,sha,stable,hashFile}=require('../../docs/design/harness/shared-learning/common');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),cli=path.join(repo,'docs/design/harness/shared-learning/cli.js');
const runRoot=path.join(__dirname,'submit-feedback',String(Date.now()));fs.mkdirSync(runRoot,{recursive:true});
const taskId='OURGOAL-AGY-SPLIT-RUN-20261006',taskKind='submission-preflight';
const participants=[{tool:'codex',role:'worker',worktree:repo,owns:['docs/design/harness/shared-learning/**','reports/learning-feedback/**'],allowedActions:['read','measure','collect-proposal']}];
const participantFile=path.join(runRoot,'participants.json'),brief=path.join(runRoot,'brief.md'),bootFile=path.join(runRoot,'bootstrap.json');write(participantFile,participants);
const registry=path.join(repo,'docs/agents/shared-learning'),common=['--repo-root',repo,'--registry-root',registry];
function run(name,args,expected=0){const r=spawnSync(process.execPath,[cli,...args,...common],{cwd:repo,encoding:'utf8'});write(path.join(runRoot,name+'.json'),{command:process.execPath,args:[cli,...args,...common],exitCode:r.status,stdout:r.stdout,stderr:r.stderr});if(r.status!==expected)throw Error(name+': '+r.stdout+r.stderr);return JSON.parse(r.stdout);}
const bootstrapArgs=['bootstrap','--task-id',taskId,'--task-kind',taskKind,'--participants',participantFile,'--out',bootFile,'--brief',brief];run('initial-bootstrap',bootstrapArgs);const boot=json(bootFile);
function measure(file,fixed){
 const failureId='claims-format-required-fields',causeId='submission-schema-not-checked';
 const code="const fs=require('fs');const errors=require(process.argv[1]).validateClaims(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));console.log(JSON.stringify({errors,confirmedFailures:errors.length?[{failureId:'claims-format-required-fields',causeId:'submission-schema-not-checked'}]:[],improvementStatuses:errors.length?{}:{'claims-format-repair':'verified'}}));process.exitCode=errors.length?1:0;";
 const args=['-e',code,path.join(repo,'court/claims.js'),file],r=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8'});
 if(r.status!==(fixed?0:1))throw Error('Unexpected actual format-probe exit: '+r.stdout+r.stderr);
 const inputs=[file,path.join(repo,'court/claims.js')].map(p=>({path:path.relative(repo,p).replaceAll('\\','/'),sha256:hashFile(p)})).sort((a,b)=>a.path.localeCompare(b.path));
 const measuredAt=new Date().toISOString(),rawPath=path.join(runRoot,fixed?'fixed-raw.json':'failure-raw.json');
 const envelope={command:process.execPath,args,inputProductSha:sha(stable(inputs)),exitCode:r.status,scope:'tool-unit',sourceTask:taskId,measuredAt,result:JSON.parse(r.stdout)};write(rawPath,envelope);
 const evidence={...envelope,checkerId:'explicit-contract',inputFiles:inputs,rawPath:path.relative(repo,rawPath),rawSha256:hashFile(rawPath),publishedPath:path.relative(repo,rawPath),publishedSha256:hashFile(rawPath),redaction:{mode:'none',transforms:[]},status:'measured'};
 const event={eventId:'learning-feedback-claims-'+(fixed?'fixed':'failure')+'-'+path.basename(runRoot),taskId,taskKind,participants,readReceipt:boot.readReceipt,appliedLessons:boot.appliedLessons,evidence:[evidence],outcome:{courtUrl:null,measurementOnly:true,unmeasured:[],regressions:[]},lessonCandidates:[{id:'submit-format-preflight',proposal:'제출 전에 공식 claims schema와 REQ 형식을 검사하고 측정 요약 파일을 공식 claims와 구분한다.'}],effectFollowup:boot.effectFollowup,requiredChecks:['explicit-contract'],inputProductSha:envelope.inputProductSha,briefPath:path.relative(repo,brief),createdAt:measuredAt,feedback:{schema:'learning-feedback/1',phase:'in-progress',executionRoot:repo,failures:fixed?[]:[{failureId,causeId,summary:'측정 요약을 공식 claims로 제출해 필수 task/requirements/claims 형식이 누락됐다.',observedAt:measuredAt,confirmation:'confirmed',evidenceSha256:evidence.rawSha256,checkerId:evidence.checkerId,scope:evidence.scope}],improvements:[],metrics:[]}};
 return event;
}
function collect(name,event){const file=path.join(runRoot,name+'-event.json');write(file,event);const result=run(name,['collect','--event',file,'--expected-source-hash',boot.source.ledgerSha256]);return {taskId,eventId:event.eventId,eventSha256:result.eventSha256,failureId:'claims-format-required-fields'};}
const failed=measure(path.join(__dirname,'measurement-summary.json'),false),ref=collect('collect-failure',failed);
const repaired=measure(path.join(__dirname,'claims.json'),true);repaired.feedback.improvements=[{improvementId:'claims-format-repair',problem:'공식 claims 필수 구조 누락',action:'측정 요약 원문을 별도 파일로 보존하고 공식 claims schema를 검사한 제출 파일을 생성한다.',status:'verified',measuredAt:repaired.createdAt,failureRef:ref,evidenceRefs:[repaired.evidence[0].rawSha256]}];collect('collect-repair',repaired);
run('next-bootstrap',bootstrapArgs);const next=json(bootFile);
const linked=next.feedback.recent3.some(i=>i.improvementId==='claims-format-repair'&&i.failureRef.eventSha256===ref.eventSha256);
if(!linked)throw Error('Repair not linked into next bootstrap');
write(path.join(__dirname,'submit-feedback-result.json'),{measurementOnly:true,productVerdict:null,effect:null,failureEvent:ref,actualFailureExit:failed.evidence[0].exitCode,actualRepairExit:repaired.evidence[0].exitCode,nextBootstrapLinked:linked,readOnlyCanonicalSourceHash:boot.source.ledgerSha256,canonicalUnchanged:hashFile(path.join(boot.source.root,'lessons.json'))===boot.source.ledgerSha256,rawRoot:runRoot});
console.log(JSON.stringify({nextBootstrapLinked:linked,measurementOnly:true,productVerdict:null,effect:null}));
