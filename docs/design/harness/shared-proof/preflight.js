'use strict';
const {sha,digest,isHash,object,equal,fs,safeFile,requiredNegativeCases} = require('./common');
const domains = ['fullDom','featureDom','localStorage','sessionStorage','toasts','consoleErrors','pageerrors','postconditions','functionEntries'];
function preflight(run, adapter, binding, inputRoot) {
  const errors = [], add = (code,field) => errors.push({code,field});
  if(!object(run) || run.schema!=='shared-proof-run/1') return [{code:'RUN_SCHEMA',field:'schema'}];
  for (const field of ['runId','sourceCommit','manifestSha256','harnessSha256','adapterSha256','completed','error','startedAt','endedAt','inputFilesBefore','inputFilesAfter','steps']) {
    if (!Object.hasOwn(run,field)) add('MISSING_FIELD',field);
  }
  if (typeof run.runId !== 'string' || !run.runId) add('RUN_ID','runId');
  if (run.completed !== true || run.error !== null) add('INCOMPLETE_OR_ERROR','completed/error');
  for (const field of ['sourceCommit','manifestSha256','harnessSha256','adapterSha256']) {
    if (run[field] !== binding[field]) add('INPUT_BINDING',field);
  }
  if (!/^[a-f0-9]{40}$/.test(run.sourceCommit || '')) add('COMMIT_FORMAT','sourceCommit');
  for (const f of ['manifestSha256','harnessSha256','adapterSha256']) if (!isHash(run[f])) add('SHA_FORMAT',f);
  if (!Number.isFinite(Date.parse(run.startedAt)) || !Number.isFinite(Date.parse(run.endedAt)) || Date.parse(run.endedAt)<Date.parse(run.startedAt)) add('RUN_TIME','startedAt/endedAt');
  const files = run.inputFilesBefore;
  if (!Array.isArray(files) || !files.length || !equal(files,run.inputFilesAfter)) add('INPUT_CHANGED_OR_MISSING','inputFilesBefore/After');
  else {
    if (digest(files) !== run.manifestSha256) add('MANIFEST_SHA','manifestSha256');
    const seen = new Set();
    for (let i=0;i<files.length;i++) {
      const f = files[i];
      if (!object(f) || seen.has(f.path) || !isHash(f.sha256)) {add('INPUT_FILE_SCHEMA',`inputFilesBefore/${i}`); continue;}
      seen.add(f.path);
      try { if (sha(fs.readFileSync(safeFile(inputRoot,f.path)))!==f.sha256) add('INPUT_FILE_SHA',`inputFilesBefore/${i}`); }
      catch {add('INPUT_FILE_UNAVAILABLE',`inputFilesBefore/${i}`);}
    }
    for(const f of ['harness','adapter']) {
      const entry=files.find(x=>x.path===binding[`${f}Path`]);
      if (!entry || entry.sha256!==run[`${f}Sha256`]) add('EXECUTOR_NOT_IN_MANIFEST',f);
    }
  }
  const steps = Array.isArray(run.steps) ? run.steps : [];
  if (!equal(steps.map(s=>s.id),adapter.steps.map(s=>s.id))) add('REQUIRED_STEP_ORDER','steps');
  steps.forEach((s,i) => {
    if (!object(s)) {add('STEP_SCHEMA',`steps/${i}`); return;}
    for(const d of domains) if (!Object.hasOwn(s,d)) add('MISSING_OBSERVATION',`steps/${i}/${d}`);
    for(const d of ['fullDom','featureDom']) if(typeof s[d] !== 'string' || !s[d]) add('DOM_REQUIRED',`steps/${i}/${d}`);
    if (!isHash(s.fullDomSha256) || sha(s.fullDom||'')!==s.fullDomSha256) add('DOM_SHA',`steps/${i}/fullDom`);
    for(const d of ['localStorage','sessionStorage','postconditions','functionEntries']) if(!object(s[d])) add('OBJECT_REQUIRED',`steps/${i}/${d}`);
    for(const d of ['toasts','consoleErrors','pageerrors']) if(!Array.isArray(s[d])) add('ARRAY_REQUIRED',`steps/${i}/${d}`);
    const spec = adapter.steps[i];
    if (!spec || s.id!==spec.id) return;
    if (spec.action !== 'observe') {
      const c=s.click;
      if (!object(c) || c.method!=='mouse' || c.success!==true || c.target!==spec.target || c.isTargetOrDescendant!==true || c.inViewport!==true || c.nonZero!==true) add('ACTUAL_CLICK_REQUIRED',`steps/${i}/click`);
    }
    for(const [k,v] of Object.entries(spec.postconditions)) if(!object(s.postconditions) || !equal(s.postconditions[k],v)) add('POSTCONDITION',`steps/${i}/postconditions/${k}`);
    for(const [k,min] of Object.entries(spec.functions)) if(!object(s.functionEntries) || !Number.isInteger(s.functionEntries[k]) || s.functionEntries[k]<min) add('FUNCTION_UNOBSERVED',`steps/${i}/functionEntries/${k}`);
  });
  return errors;
}
function adapterErrors(adapter) {
  const e=[];
  if (!object(adapter) || adapter.schema!=='shared-proof-adapter/1' || typeof adapter.taskId!=='string' || !Array.isArray(adapter.steps) || !adapter.steps.length) return [{code:'ADAPTER_SCHEMA',field:'adapter'}];
  const seen=new Set();
  if(adapter.collectionReady!==true) e.push({code:'ADAPTER_COLLECTION_UNMEASURED',field:'collectionReady'});
  adapter.steps.forEach((s,i)=>{
    if(!object(s) || typeof s.id!=='string' || !s.id || seen.has(s.id) || !['observe','click'].includes(s.action) || (s.action==='click' && typeof s.target!=='string') || !object(s.postconditions) || !object(s.functions) || Object.values(s.functions).some(n=>!Number.isInteger(n)||n<1)) e.push({code:'ADAPTER_STEP_SCHEMA',field:`steps/${i}`});
    seen.add(s.id);
  });
  if(!Array.isArray(adapter.dynamicContracts) || !Array.isArray(adapter.negativeCases) || !adapter.negativeCases.length || new Set(adapter.negativeCases).size!==adapter.negativeCases.length) e.push({code:'ADAPTER_CONTRACT_SCHEMA',field:'dynamicContracts/negativeCases'});
  else if(requiredNegativeCases.some(k=>!adapter.negativeCases.includes(k))) e.push({code:'MANDATORY_CANARY_OMITTED',field:'negativeCases'});
  return e;
}
module.exports = {preflight,adapterErrors,domains};
