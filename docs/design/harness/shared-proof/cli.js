'use strict';
const {fs,path,read,equal,isHash,codeHash,object} = require('./common');
const {preflight,adapterErrors} = require('./preflight');
const {checkDynamic} = require('./dynamic-contract');
const {compare} = require('./compare');
function evaluate(request, evidenceRoot, inputRoots) {
  const errors=[], gates={schema:false,input:false,dynamic:false,baseline:false,work:false,sensitivity:false};
  const add=(gate,code,field)=>errors.push({gate,code,field});
  let adapter, runs=[];
  try {
    if(!object(request) || request.schema!=='shared-proof-request/1' || !Array.isArray(request.runs) || request.runs.length!==3 || !equal(request.runs.map(x=>x.role),['base1','base2','after'])) throw Error('REQUEST_SCHEMA');
    adapter=read(evidenceRoot,request.adapter.path,request.adapter.sha256).value;
    const ae=adapterErrors(adapter); ae.forEach(e=>add('schema',e.code,e.field));
    if(ae.length) return result();
    gates.schema=true;
    for(const r of request.runs) {
      const raw=read(evidenceRoot,r.path,r.sha256);
      const re=preflight(raw.value,adapter,{...r.binding,adapterSha256:request.adapter.sha256},inputRoots[r.role]);
      re.forEach(e=>add('input',e.code,`${r.role}/${e.field}`)); runs.push(raw.value);
    }
    if(new Set(runs.map(r=>r.runId)).size!==3) add('input','RUN_ID_DUPLICATE','runId');
    if(runs[0].sourceCommit!==runs[1].sourceCommit || runs[0].manifestSha256!==runs[1].manifestSha256) add('input','BASE_INPUT_MISMATCH','base1/base2');
    gates.input=!errors.some(e=>e.gate==='input');
    const de=checkDynamic(adapter); de.forEach(e=>add('dynamic',e.code,e.field)); gates.dynamic=de.length===0;
    if(gates.input && gates.dynamic) {
      const bd=compare(runs[0],runs[1]); bd.forEach(e=>add('baseline',e.code,e.field)); gates.baseline=!bd.length;
      // Compare against both bases; no base1 OR base2 shortcut.
      const wd=[...compare(runs[0],runs[2]),...compare(runs[1],runs[2])]; wd.forEach(e=>add('work',e.code,e.field)); gates.work=!wd.length;
    }
    if(!request.sensitivity) add('sensitivity','INDEPENDENT_AUDIT_UNMEASURED','sensitivity');
    else {
      const audit=read(evidenceRoot,request.sensitivity.path,request.sensitivity.sha256).value;
      if(!object(audit) || audit.schema!=='shared-proof-sensitivity/1' || audit.independent!==true || audit.coreSha256!==codeHash() || audit.adapterSha256!==request.adapter.sha256 || !equal(audit.inputShas,request.runs.map(r=>r.sha256)) || !Array.isArray(audit.cases) || !equal(audit.cases.map(c=>c.id).sort(),[...adapter.negativeCases].sort())) add('sensitivity','AUDIT_BINDING_OR_CASES','sensitivity');
      else for(const c of audit.cases) {
        if(!Number.isInteger(c.changedExistingValues) || c.changedExistingValues<1 || !Number.isInteger(c.exitCode) || c.exitCode===0 || typeof c.rejectionGate!=='string' || !Object.hasOwn(gates,c.rejectionGate) || !isHash(c.mutatedRawSha256) || !isHash(c.resultSha256)) add('sensitivity','AUDIT_CASE_UNMEASURED',`sensitivity/${c.id}`);
        else {
          const raw=read(evidenceRoot,c.mutatedRawPath,c.mutatedRawSha256);
          const measured=read(evidenceRoot,c.resultPath,c.resultSha256).value;
          const originalShas=request.runs.map(r=>r.sha256);
          const recordedShas=measured.inputShas;
          if(!object(raw.value) || measured.exitCode!==c.exitCode || measured.coreSha256!==codeHash() || measured.adapterSha256!==request.adapter.sha256 || !Array.isArray(recordedShas) || recordedShas.length!==3 || !recordedShas.includes(c.mutatedRawSha256) || recordedShas.some((s,i)=>s!==originalShas[i]&&s!==c.mutatedRawSha256) || !Array.isArray(measured.errors) || !measured.errors.some(e=>e.gate===c.rejectionGate)) add('sensitivity','AUDIT_RAW_RESULT_BINDING',`sensitivity/${c.id}`);
        }
      }
      gates.sensitivity=!errors.some(e=>e.gate==='sensitivity');
    }
  } catch(e) {add('input',String(e.message).match(/^[A-Z_]+$/)?e.message:'INVALID_OR_UNAVAILABLE_INPUT','request');}
  return result();
  function result() {
    const satisfied=Object.values(gates).every(v=>v===true) && errors.length===0;
    return {schema:'shared-proof-result/1',measurementOnly:true,productVerdict:null,effect:null,coreSha256:codeHash(),adapterSha256:request?.adapter?.sha256||null,inputShas:Array.isArray(request?.runs)?request.runs.map(r=>r.sha256):null,gates,errors,allRequiredGatesSatisfied:satisfied,exitCode:satisfied?0:1};
  }
}
function main(argv) {
  const opts={};
  if(argv.length%2) throw Error('ARGUMENT_PAIRS_REQUIRED');
  for(let i=0;i<argv.length;i+=2) {if(!['--request','--evidence-root','--base1-root','--base2-root','--after-root'].includes(argv[i]) || opts[argv[i]]) throw Error('ARGUMENT_UNKNOWN_OR_DUPLICATE'); opts[argv[i]]=argv[i+1];}
  if(Object.keys(opts).length!==5) throw Error('EXPLICIT_ROOTS_REQUIRED');
  const request=JSON.parse(fs.readFileSync(opts['--request'],'utf8'));
  return evaluate(request,opts['--evidence-root'],{base1:opts['--base1-root'],base2:opts['--base2-root'],after:opts['--after-root']});
}
if(require.main===module) {
  try {const r=main(process.argv.slice(2)); console.log(JSON.stringify(r,null,2)); process.exitCode=r.exitCode;}
  catch {console.log(JSON.stringify({measurementOnly:true,productVerdict:null,exitCode:1,errors:[{gate:'schema',code:'CLI_INVALID_INPUT'}]}));process.exitCode=1;}
}
module.exports={evaluate,main};
