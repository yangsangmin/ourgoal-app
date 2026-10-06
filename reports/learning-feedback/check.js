'use strict';
// Tool-contract fixtures only; these records never represent product E2E or effects.
const {fs,path,write,json,sha,stable,hashFile}=require('../../docs/design/harness/shared-learning/common');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../..'),cli=path.join(repo,'docs/design/harness/shared-learning/cli.js');
const root=path.join(__dirname,'raw',String(Date.now())),source=path.join(root,'source'),registry=path.join(root,'registry'),store=path.join(root,'store');
fs.mkdirSync(root,{recursive:true});fs.cpSync(path.join(repo,'docs/agents/shared-learning'),registry,{recursive:true});
write(path.join(source,'lessons.json'),[{id:'L001',분야:'보고',규칙:'증거를 연결한다.',어떻게:'SHA 대조',출처PR:[844],대상:['codex']}]);
write(path.join(source,'WORK-REFERENCE.md'),'# 기준 PR #844 · 경험칙 1개\n**L001. 증거를 연결한다.**\n');
const reg=json(path.join(registry,'registry.json'));reg.sharedStoreRoot=store;reg.sources.canonicalRoot=source;write(path.join(registry,'registry.json'),reg);
const participants=[{tool:'codex',role:'worker',worktree:repo,owns:['reports/learning-feedback/**'],allowedActions:['read','unit-check']}];
const pf=path.join(root,'participants.json'),rr=path.join(root,'read-roots.json');write(pf,participants);write(rr,[repo,reg.sources.playbookRoot]);
const common=['--repo-root',repo,'--source-root',source,'--registry-root',registry,'--read-roots',rr];let seq=0;const results=[];
function run(name,args,expected=0){const r=spawnSync(process.execPath,[cli,...args,...common],{cwd:repo,encoding:'utf8'});write(path.join(root,++seq+'-'+name+'.json'),{command:process.execPath,args:[cli,...args,...common],exitCode:r.status,stdout:r.stdout,stderr:r.stderr,expected});results.push({name,exitCode:r.status,expected,matched:r.status===expected});if(r.status!==expected)throw Error(name+': '+r.stdout+r.stderr);return JSON.parse(r.stdout);}
function assert(name,condition){results.push({name,matched:Boolean(condition)});if(!condition)throw Error(name);}
const bootFile=path.join(root,'bootstrap.json'),brief=path.join(root,'brief.md');
function boot(name){run(name,['bootstrap','--participants',pf,'--task-id','UNIT-FEEDBACK','--task-kind','feedback-unit','--out',bootFile,'--brief',brief]);return json(bootFile);}
let booted=boot('initial-bootstrap');
const inputs=[{path:'reports/learning-feedback/check.js',sha256:hashFile(__filename)}],inputProductSha=sha(stable(inputs));
function event(id,task='UNIT-FEEDBACK',exitCode=1,result={}){
 if(exitCode!==0&&!result.confirmedFailures)result={...result,confirmedFailures:[{failureId:'failure-one',causeId:'same-cause'}]};
 const measuredAt=new Date().toISOString(),raw=path.join(root,id+'-raw.json');
 const envelope={command:process.execPath,args:[cli,'unit-contract-fixture'],inputProductSha,exitCode,scope:'tool-unit',sourceTask:task,measuredAt,result};write(raw,envelope);
 const e={...envelope,checkerId:'submission-integrity',inputFiles:inputs,rawPath:path.relative(repo,raw),rawSha256:hashFile(raw),publishedPath:path.relative(repo,raw),publishedSha256:hashFile(raw),redaction:{mode:'none',transforms:[]},status:'measured'};
 return {eventId:id,taskId:task,taskKind:'feedback-unit',participants,readReceipt:booted.readReceipt,appliedLessons:booted.appliedLessons,evidence:[e],outcome:{courtUrl:null,measurementOnly:true,unmeasured:[],regressions:[]},lessonCandidates:[],effectFollowup:booted.effectFollowup,requiredChecks:['submission-integrity'],inputProductSha,briefPath:path.relative(repo,brief),createdAt:measuredAt,feedback:{schema:'learning-feedback/1',phase:'in-progress',executionRoot:repo,failures:exitCode?[{failureId:'failure-one',causeId:'same-cause',summary:'단위 계약에서 확인한 실패',observedAt:measuredAt,confirmation:'confirmed',evidenceSha256:e.rawSha256,checkerId:e.checkerId,scope:e.scope}]:[],improvements:[],metrics:[]}};
}
function collect(e,name){const file=path.join(root,name+'-event.json');write(file,e);run(name,['collect','--event',file,'--expected-source-hash',hashFile(path.join(source,'lessons.json'))]);return {taskId:e.taskId,eventId:e.eventId,eventSha256:hashFile(path.join(store,e.taskId,e.eventId+'.json')),failureId:'failure-one'};}
function report(name){return run(name,['report','--task-kind','feedback-unit']);}
try{
 const first=event('failure-a');const ref=collect(first,'failure-during-work');
 booted=boot('next-bootstrap');assert('failure-reaches-next-bootstrap',booted.feedback.failureGroups.length===1);
 assert('failure-still-pending-no-policy',booted.feedback.failureGroups[0].recommendation===null);
 collect(event('failure-b','UNIT-SECOND'),'same-cause-second-task');
 assert('repeat-recommends-method-only',report('repeat-report').failureGroups[0].recommendation.automaticReassignment===false);
 for(let i=0;i<4;i++){
  const status=['instructed','implemented','verified','applied'][i],id='improvement-'+i;
  const e=event('improvement-event-'+i,'UNIT-FEEDBACK',0,{improvementStatuses:{[id]:status}});
  e.feedback.improvements=[{improvementId:id,problem:'확인된 실패',action:'계약 연결 보완 '+i,status,measuredAt:e.createdAt,failureRef:ref,evidenceRefs:[e.evidence[0].rawSha256]}];collect(e,'collect-improvement-'+i);
 }
 const a=report('recent3-first'),b=report('recent3-unchanged');
 assert('recent3-rolling',a.recent3.length===3&&!a.recent3.some(x=>x.improvementId==='improvement-0'));
 assert('no-new-event-keeps-three',stable(a.recent3)===stable(b.recent3));
 assert('effect-remains-null',a.recent3.every(x=>x.effect.metrics.tokens.after===null&&x.effect.improvementConclusion===null));
 const dep=path.join(root,'dependency.txt'),executor=path.join(root,'executor.txt');write(dep,'dependency before');write(executor,'executor before');
 const reusable=event('reusable-evidence','UNIT-FEEDBACK',0),ev=reusable.evidence[0];
 const contract={declaredBeforeRun:true,declaredAt:ev.measuredAt,dependencies:[{path:path.relative(repo,dep),sha256:hashFile(dep)}],executors:[{path:path.relative(repo,executor),sha256:hashFile(executor)}]};
 const rp=path.resolve(repo,ev.rawPath),renv=json(rp);renv.reuseContract=contract;write(rp,renv);ev.reuseContract=contract;ev.rawSha256=hashFile(rp);ev.publishedSha256=ev.rawSha256;
 const reuseRef=collect(reusable,'collect-reuse-contract'),rf=path.join(root,'review-ref.json');write(rf,reuseRef);
 let view=run('review-unchanged',['report','--review-ref',rf]);assert('unchanged-reuse-candidate',view.review.rows[0].disposition==='reuse-candidate');
 write(path.join(root,'unrelated.txt'),'unrelated change');view=run('review-unrelated-change',['report','--review-ref',rf]);assert('unrelated-change-preserves-candidate',view.review.rows[0].disposition==='reuse-candidate');
 write(executor,'executor changed');view=run('review-executor-change',['report','--review-ref',rf]);assert('executor-change-rerun',view.review.rows[0].disposition==='rerun-recommended');
 const actualMetrics={qualityDefects:0,repeatDefects:0,evidenceMismatches:0};
 for(let i=0;i<5;i++){
  const follow=event('followup-'+i,'UNIT-FOLLOW-'+i,0,{metrics:actualMetrics});follow.feedback.phase='followup';follow.feedback.followupOf=ref;
  follow.feedback.metrics=Object.entries(actualMetrics).map(([name,value])=>({name,value,evidenceSha256:follow.evidence[0].rawSha256}));collect(follow,'collect-followup-'+i);
 }
 const measured=report('followup-derived-view').recent3[0].effect;
 assert('five-unique-linked-task-samples',measured.observedMatchingTasks===5&&measured.metrics.qualityDefects.after===0);
 assert('absent-before-not-invented',measured.metrics.qualityDefects.before===null&&measured.metrics.qualityDefects.delta===null);
 assert('absent-model-token-observations-null',measured.modelProgress===null&&measured.tokenSavings===null&&measured.metrics.tokens.after===null);
 assert('fixture-no-improvement-claim',measured.improvementConclusion===null&&measured.productVerdict===null);
 const rejectFile=path.join(root,'independent-counterexample.json');
 function reject(name,e){write(rejectFile,e);run(name,['validate','--event',rejectFile],2);}
 const invented=JSON.parse(JSON.stringify(first));invented.feedback.failures[0].causeId='invented-cause';invented.feedback.failures[0].failureId='never-observed';reject('invented-failure-cause-rejected',invented);
 const unknown=JSON.parse(JSON.stringify(first));unknown.evidence[0].checkerId='self-invented-checker';unknown.feedback.failures[0].checkerId='self-invented-checker';unknown.requiredChecks=['self-invented-checker'];reject('unknown-required-checker-rejected',unknown);
 const fabricated=event('fabricated-effect','UNIT-FEEDBACK',0);fabricated.effectFollowup={...fabricated.effectFollowup,interventionBefore:123,samples:{interventionBefore:['not-an-evidence']}};reject('fabricated-effect-samples-rejected',fabricated);
 const unconfirmed=event('pending-observation');unconfirmed.feedback.failures[0].confirmation='unconfirmed';unconfirmed.feedback.failures[0].causeId='unconfirmed-cause';collect(unconfirmed,'collect-pending-observation');
 assert('observation-is-not-confirmed',report('pending-observation-report').failureGroups.find(g=>g.causeId==='unconfirmed-cause').uniqueConfirmedAtCollection===0);
 const bad=event('unconfirmed',undefined,0);bad.feedback.failures=first.feedback.failures;const bf=path.join(root,'bad.json');write(bf,bad);run('unconfirmed-failure-rejected',['validate','--event',bf],2);
 const changed=event('changed-raw');changed.evidence[0].rawSha256='0'.repeat(64);write(bf,changed);run('changed-raw-rejected',['validate','--event',bf],2);
 write(path.join(__dirname,'check-result.json'),{measurementOnly:true,productVerdict:null,fixtureScope:'new tool contract only',effect:null,results,rawRoot:root});
 console.log(JSON.stringify({results,rawRoot:root,productVerdict:null,effect:null},null,2));
}catch(e){write(path.join(__dirname,'check-result.json'),{results,error:e.message,rawRoot:root,productVerdict:null,effect:null});console.error(e.stack);process.exitCode=1;}
