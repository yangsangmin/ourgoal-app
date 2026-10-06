'use strict';
const {path,json,inside,hashFile,stable,safeId}=require('./common');
const {object,hash,time,text,referencedEvent,checkedEnvelope}=require('./feedback-common');
const metricNames=['interventionMinutes','qualityDefects','repeatDefects','evidenceMismatches','tokens','progressUnits'];
function validateFeedback(event,options) {
  const errors=[],add=(ok,code)=>{if(!ok)errors.push(code);},f=event.feedback;
  if(f===undefined)return errors;
  if(!object(f))return ['FEEDBACK_SCHEMA'];
  add(f.schema==='learning-feedback/1','FEEDBACK_VERSION');
  add(['in-progress','completed','followup'].includes(f.phase),'FEEDBACK_PHASE');
  add(time(event.createdAt),'FEEDBACK_CREATED_AT');
  add(typeof f.executionRoot==='string'&&path.resolve(f.executionRoot)===path.resolve(options.repoRoot),'FEEDBACK_EXECUTION_ROOT');
  for(const k of ['failures','improvements','metrics'])add(Array.isArray(f[k]),'FEEDBACK_ARRAY_'+k);
  const evidence=(ref)=>event.evidence?.find(e=>e.rawSha256===ref&&e.status==='measured');
  const envelope=e=>{try{return json(inside(options.repoRoot,e.rawPath));}catch{return null;}};
  const failures=Array.isArray(f.failures)?f.failures:[];
  add(new Set(failures.map(x=>x.failureId)).size===failures.length,'FEEDBACK_DUPLICATE_FAILURE');
  for(const failure of failures) {
    add(object(failure)&&text(failure.summary)&&time(failure.observedAt)&&['confirmed','unconfirmed'].includes(failure.confirmation),'FEEDBACK_FAILURE_SCHEMA');
    try{safeId(failure.failureId);safeId(failure.causeId);}catch{errors.push('FEEDBACK_FAILURE_ID');}
    const e=evidence(failure.evidenceSha256),raw=e&&envelope(e);
    add(Boolean(e&&raw&&e.checkerId===failure.checkerId&&e.scope===failure.scope&&e.measuredAt===failure.observedAt),'FEEDBACK_FAILURE_EVIDENCE');
    if(failure.confirmation==='confirmed')add(Boolean(raw?.result?.confirmedFailures?.some(x=>x.failureId===failure.failureId&&x.causeId===failure.causeId)),'FEEDBACK_FAILURE_NOT_CONFIRMED');
    else add(f.phase==='in-progress','FEEDBACK_UNCONFIRMED_PENDING_ONLY');
  }
  const metrics=Array.isArray(f.metrics)?f.metrics:[];
  add(new Set(metrics.map(m=>m.name)).size===metrics.length,'FEEDBACK_DUPLICATE_METRIC');
  for(const m of metrics) {
    add(object(m)&&metricNames.includes(m.name)&&Number.isFinite(m.value)&&m.value>=0&&hash(m.evidenceSha256),'FEEDBACK_METRIC_SCHEMA');
    const e=evidence(m.evidenceSha256),raw=e&&envelope(e);
    add(Boolean(e&&raw&&e.exitCode===0&&raw.result?.metrics?.[m.name]===m.value),'FEEDBACK_METRIC_EVIDENCE');
  }
  if(f.followupOf) {
    try{const origin=referencedEvent(f.followupOf,options);add(origin.event.taskKind===event.taskKind&&origin.event.taskId!==event.taskId,'FEEDBACK_FOLLOWUP_TYPE_OR_TASK');add(Date.parse(event.createdAt)>Date.parse(origin.event.createdAt),'FEEDBACK_FOLLOWUP_TIME');}
    catch(e){errors.push(e.message);}
  }
  const improvements=Array.isArray(f.improvements)?f.improvements:[];
  add(new Set(improvements.map(i=>i.improvementId)).size===improvements.length,'FEEDBACK_DUPLICATE_IMPROVEMENT');
  for(const i of improvements) {
    add(object(i)&&text(i.problem)&&text(i.action)&&time(i.measuredAt)&&['instructed','implemented','verified','applied'].includes(i.status),'FEEDBACK_IMPROVEMENT_SCHEMA');
    try{safeId(i.improvementId);}catch{errors.push('FEEDBACK_IMPROVEMENT_ID');}
    let origin;
    try{
      origin=referencedEvent(i.failureRef,options);
      const linked=origin.event.feedback?.failures?.find(x=>x.failureId===i.failureRef.failureId&&x.confirmation==='confirmed');
      const proof=linked&&origin.event.evidence.find(e=>e.rawSha256===linked.evidenceSha256),raw=proof&&checkedEnvelope(origin,proof,options);
      add(origin.event.taskKind===event.taskKind&&raw?.valid&&raw.value.result?.confirmedFailures?.some(x=>x.failureId===linked.failureId&&x.causeId===linked.causeId),'FEEDBACK_IMPROVEMENT_FAILURE_LINK');
    }
    catch(e){errors.push(e.message);}
    add(Array.isArray(i.evidenceRefs)&&i.evidenceRefs.length>0&&i.evidenceRefs.every(hash),'FEEDBACK_IMPROVEMENT_REFS');
    for(const ref of i.evidenceRefs||[]) {
      const e=evidence(ref),raw=e&&envelope(e);
      add(Boolean(e&&raw),'FEEDBACK_IMPROVEMENT_EVIDENCE');
      if(['verified','applied'].includes(i.status))add(Boolean(e&&e.exitCode===0&&raw?.result?.improvementStatuses?.[i.improvementId]===i.status),'FEEDBACK_IMPROVEMENT_STATUS_EVIDENCE');
    }
  }
  if(f.reviewOf){try{referencedEvent(f.reviewOf,options);}catch(e){errors.push(e.message);}}
  for(const e of event.evidence||[])if(e.reuseContract!==undefined) {
    const c=e.reuseContract,raw=envelope(e);
    add(object(c)&&c.declaredBeforeRun===true&&time(c.declaredAt)&&Date.parse(c.declaredAt)<=Date.parse(e.measuredAt),'REUSE_PREDECLARED_CONTRACT');
    for(const k of ['dependencies','executors']) {
      add(Array.isArray(c?.[k])&&c[k].length>0,'REUSE_ARRAY_'+k);
      add(new Set((c?.[k]||[]).map(x=>x.path)).size===(c?.[k]||[]).length,'REUSE_DUPLICATE_'+k);
      for(const file of c?.[k]||[]) {
        add(object(file)&&typeof file.path==='string'&&hash(file.sha256),'REUSE_FILE_SCHEMA');
        try{add(hashFile(inside(options.repoRoot,file.path))===file.sha256,'REUSE_FILE_SHA');}catch{errors.push('REUSE_FILE_UNAVAILABLE');}
      }
    }
    add(Boolean(raw&&stable(raw.reuseContract)===stable(c)),'REUSE_RAW_CONTRACT');
  }
  return errors;
}
module.exports={validateFeedback,metricNames};
