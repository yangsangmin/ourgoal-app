'use strict';
const {path,hashFile,inside,stable}=require('./common');
const {referencedEvent,checkedEnvelope}=require('./feedback-common');
function reviewEvidence(ref,options) {
  const entry=referencedEvent(ref,options),rows=[];
  for(const e of entry.event.evidence||[]) {
    const changed=[],unmeasured=[];
    const binding=e.reuseContract;
    if(!binding||binding.declaredBeforeRun!==true||!Array.isArray(binding.dependencies)||!binding.dependencies.length||!Array.isArray(binding.executors)||!binding.executors.length)unmeasured.push('predeclared-dependencies-and-executors-required');
    const raw=checkedEnvelope(entry,e,options);
    if(!raw.valid)unmeasured.push(raw.reason);
    else if(stable(raw.value.reuseContract)!==stable(binding))unmeasured.push('raw-reuse-contract-mismatch');
    for(const group of ['dependencies','executors'])for(const f of binding?.[group]||[]) {
      try {const currentSha256=hashFile(inside(options.repoRoot,f.path));if(currentSha256!==f.sha256)changed.push({path:f.path,beforeSha256:f.sha256,afterSha256:currentSha256});}
      catch {unmeasured.push('dependency-unavailable:'+f.path);}
    }
    // Full product input remains exact for work-after evidence, even if a dependency list is narrower.
    if(e.scope==='work-after')for(const f of e.inputFiles||[]) {
      try{const currentSha256=hashFile(inside(options.repoRoot,f.path));if(currentSha256!==f.sha256&&!changed.some(c=>c.path===f.path))changed.push({path:f.path,beforeSha256:f.sha256,afterSha256:currentSha256});}
      catch{unmeasured.push('product-input-unavailable:'+f.path);}
    }
    const reusable=raw.valid&&e.status==='measured'&&e.exitCode===0&&!changed.length&&!unmeasured.length;
    rows.push({checkerId:e.checkerId,rawSha256:e.rawSha256,scope:e.scope,sourceTask:e.sourceTask,inputProductSha:e.inputProductSha,
      disposition:reusable?'reuse-candidate':unmeasured.length?'unmeasured':'rerun-recommended',changedFiles:changed,unmeasured,
      permissionGranted:false,validationSkipped:false});
  }
  return {measurementOnly:true,productVerdict:null,ref,rows,changedPaths:[...new Set(rows.flatMap(r=>r.changedFiles.map(f=>f.path)))],automaticExecution:false};
}
module.exports={reviewEvidence};
