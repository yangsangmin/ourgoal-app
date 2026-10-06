'use strict';
const {fs,path,receipt,stable}=require('./common');
const {loadEvents,checkedEnvelope}=require('./feedback-common');
const {metricNames}=require('./feedback-validate');
const {reviewEvidence}=require('./review');
function feedbackView(options) {
  const entries=loadEvents(options),matching=entries.filter(x=>x.event.feedback&&(!options.taskKind||x.event.taskKind===options.taskKind));
  const failures=new Map(),improvements=new Map(),effectCache=new Map(),readReceipt=[];
  const byId=new Map(entries.map(x=>[stable([x.event.taskId,x.event.eventId,x.eventSha256]),x]));
  const key=ref=>stable([ref.taskId,ref.eventId,ref.eventSha256]);
  function metric(entry,name) {
    const m=entry.event.feedback?.metrics?.find(x=>x.name===name);
    if(!m)return null;
    const e=entry.event.evidence.find(e=>e.rawSha256===m.evidenceSha256),raw=e&&checkedEnvelope(entry,e,options);
    return raw?.valid&&raw.value.exitCode===0&&raw.value.result?.metrics?.[name]===m.value ? {value:m.value,evidenceSha256:m.evidenceSha256,taskId:entry.event.taskId,eventId:entry.event.eventId,eventSha256:entry.eventSha256}:null;
  }
  function effect(origin) {
    if(effectCache.has(origin.eventSha256))return effectCache.get(origin.eventSha256);
    const selected=new Map();
    const candidates=matching.filter(e=>e.event.feedback.followupOf&&key(e.event.feedback.followupOf)===key({taskId:origin.event.taskId,eventId:origin.event.eventId,eventSha256:origin.eventSha256})&&e.event.taskId!==origin.event.taskId&&e.event.taskKind===origin.event.taskKind)
      .sort((a,b)=>Date.parse(a.event.createdAt)-Date.parse(b.event.createdAt)||a.event.eventId.localeCompare(b.event.eventId));
    // Task order comes from its first follow-up; later immutable records can add measurements.
    for(const e of candidates)selected.set(e.event.taskId,e);
    const samples=[...selected.values()].slice(0,origin.event.effectFollowup.nextMatchingTasks),complete=samples.length===5;
    const metrics={};
    for(const name of metricNames) {
      const before=metric(origin,name),observed=samples.map(e=>metric(e,name));
      const after=complete&&observed.every(Boolean)?observed.reduce((sum,m)=>sum+m.value,0)/observed.length:null;
      metrics[name]={before:before?.value??null,after,delta:before&&after!==null?after-before.value:null,
        beforeSource:before,afterSources:observed.filter(Boolean)};
    }
    const sum=name=>complete&&samples.every(e=>metric(e,name))?samples.reduce((s,e)=>s+metric(e,name).value,0):null;
    const repeatDefects=sum('repeatDefects'),evidenceMismatches=sum('evidenceMismatches');
    const measured=Object.values(metrics).some(m=>m.after!==null)||repeatDefects!==null||evidenceMismatches!==null;
    const result={disposition:complete&&measured?'measured-samples':'pending-unmeasured',requiredMatchingTasks:5,observedMatchingTasks:samples.length,
      samples:samples.map(e=>({taskId:e.event.taskId,eventId:e.event.eventId,eventSha256:e.eventSha256})),repeatDefects,evidenceMismatches,
      repeatDefectsTargetMet:repeatDefects===null?null:repeatDefects===0,evidenceMismatchTargetMet:evidenceMismatches===null?null:evidenceMismatches===0,
      metrics,modelProgress:null,tokenSavings:null,improvementConclusion:null,productVerdict:null};
    effectCache.set(origin.eventSha256,result);return result;
  }
  for(const entry of matching) {
    const event=entry.event,f=event.feedback;
    readReceipt.push(receipt(entry.file,null));
    for(const failure of f.failures||[]) {
      const groupKey=stable([event.taskKind,failure.causeId]);
      if(!failures.has(groupKey))failures.set(groupKey,{taskKind:event.taskKind,causeId:failure.causeId,observations:new Map()});
      const observationKey=stable([event.taskId,event.inputProductSha,failure.evidenceSha256,failure.scope,failure.checkerId]);
      const e=event.evidence.find(e=>e.rawSha256===failure.evidenceSha256),raw=e&&checkedEnvelope(entry,e,options);
      const valid=raw?.valid&&(e.exitCode!==0||raw.value.result?.confirmedFailures?.some(x=>x.failureId===failure.failureId&&x.causeId===failure.causeId));
      failures.get(groupKey).observations.set(observationKey,{failureId:failure.failureId,taskId:event.taskId,eventId:event.eventId,eventSha256:entry.eventSha256,evidenceSha256:failure.evidenceSha256,
        observedAt:failure.observedAt,summary:failure.summary,evidenceValidity:valid?'current-hash-checked':raw?.reason||'unmeasured',confirmedAtCollection:true,currentlyMeasured:Boolean(valid)});
    }
    for(const i of f.improvements||[]) {
      const origin=byId.get(key(i.failureRef));
      if(!origin)continue;
      const improvementKey=stable([key(i.failureRef),i.failureRef.failureId,i.improvementId]);
      const previous=improvements.get(improvementKey);
      if(previous&&(Date.parse(previous.measuredAt)>Date.parse(i.measuredAt)||(previous.measuredAt===i.measuredAt&&previous.eventId>=event.eventId)))continue;
      const validity=i.evidenceRefs.every(ref=>{
        const e=event.evidence.find(e=>e.rawSha256===ref),raw=e&&checkedEnvelope(entry,e,options);
        return raw?.valid&&(!['verified','applied'].includes(i.status)||(e.exitCode===0&&raw.value.result?.improvementStatuses?.[i.improvementId]===i.status));
      });
      improvements.set(improvementKey,{improvementId:i.improvementId,problem:i.problem,action:i.action,status:i.status,
        statusBasis:'collected worker record; not Court verdict',evidenceValidity:validity?'current-hash-checked':'unmeasured-or-changed',
        effect:effect(origin),evidenceRefs:i.evidenceRefs,measuredAt:i.measuredAt,taskId:event.taskId,eventId:event.eventId,eventSha256:entry.eventSha256,failureRef:i.failureRef});
    }
  }
  const failureGroups=[...failures.values()].map(g=>{
    const observations=[...g.observations.values()],measured=observations.filter(o=>o.currentlyMeasured);
    return {taskKind:g.taskKind,causeId:g.causeId,uniqueConfirmedAtCollection:observations.length,currentlyMeasured:measured.length,observations,
      recommendation:measured.length>1?{action:'담당 또는 방법을 재검토해 전환을 권고',basis:'같은 원인의 고유 실측 증거 반복',automaticReassignment:false,permissionExpansion:false,policyPromotion:false}:null};
  });
  const recent3=[...improvements.values()].sort((a,b)=>Date.parse(b.measuredAt)-Date.parse(a.measuredAt)||b.eventId.localeCompare(a.eventId)).slice(0,3);
  const registry=require('./common').json(path.join(options.registryRoot,'registry.json'));
  return {schema:'learning-feedback-view/1',measurementOnly:true,productVerdict:null,failureGroups,recent3,
    readReceipt,review:options.reviewRef?reviewEvidence(options.reviewRef,options):null,
    promotionPolicy:{automatic:false,commonObservedThreshold:registry.promotion.commonObservedThreshold,adapterObservedThreshold:registry.promotion.adapterObservedThreshold,conflictDisposition:registry.promotion.conflictDisposition},
    modelProgress:null,tokenSavings:null,automaticExecution:false,storeWrites:0};
}
module.exports={feedbackView};
