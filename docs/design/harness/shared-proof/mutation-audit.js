'use strict';
// Independent offline audit. Unit collector contracts only; no product verdict.
const cp=require('child_process');
const {fs,path,sha,read,codeHash}=require('./common');
function main(argv) {
  const opts={};
  for(let i=0;i<argv.length;i+=2) {
    if(!['--request','--evidence-root','--base1-root','--base2-root','--after-root','--out'].includes(argv[i])||opts[argv[i]]||!argv[i+1]) throw Error('EXPLICIT_ARGUMENT_PAIRS_REQUIRED');
    opts[argv[i]]=argv[i+1];
  }
  if(Object.keys(opts).length!==6) throw Error('EXPLICIT_ROOTS_AND_OUT_REQUIRED');
  const evidence=path.resolve(opts['--evidence-root']),request=JSON.parse(fs.readFileSync(opts['--request'],'utf8'));
  const adapter=read(evidence,request.adapter.path,request.adapter.sha256).value;
  const originals=request.runs.map(r=>read(evidence,r.path,r.sha256));
  const lockedCore=codeHash(),clone=v=>JSON.parse(JSON.stringify(v));
  const relative=path.join('independent-audit',Date.now()+'-'+process.pid);
  fs.mkdirSync(path.join(evidence,relative),{recursive:true});
  const write=(rel,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';fs.writeFileSync(path.join(evidence,rel),bytes,'utf8');return sha(bytes);};
  function execute(req,rel) {
    const reqPath=path.join(relative,rel+'.request.json');write(reqPath,req);
    const args=[path.join(__dirname,'cli.js'),'--request',path.join(evidence,reqPath),'--evidence-root',evidence];
    for(const role of ['base1','base2','after'])args.push('--'+role+'-root',opts['--'+role+'-root']);
    const result=cp.spawnSync(process.execPath,args,{encoding:'utf8',timeout:30000});
    if(result.status===null)throw Error('CLI_UNMEASURED');
    const measured=JSON.parse(result.stdout);
    if(measured.exitCode!==result.status)throw Error('EXIT_DISAGREEMENT');
    const resultPath=path.join(relative,rel+'.result.json'),resultSha256=write(resultPath,measured);
    return {measured,exitCode:result.status,resultPath,resultSha256};
  }
  const plain=clone(request);delete plain.sensitivity;
  const original=execute(plain,'original');
  if(!['schema','input','dynamic','baseline','work'].every(g=>original.measured.gates[g]===true))throw Error('ORIGINAL_CONTRACT_UNMEASURED');
  function mutate(id,run) {
    const s=run.steps[0];let gate='work';
    const changeText=dom=>{let changed=false;const out=dom.replace(/>([^<>]*\S[^<>]*)</,(m,text)=>{changed=true;return '>'+text+'-independent-change<';});if(!changed)throw Error('EXISTING_DOM_TEXT_REQUIRED');return out;};
    switch(id) {
      case 'full-dom':s.fullDom=changeText(s.fullDom);s.fullDomSha256=sha(s.fullDom);break;
      case 'feature-dom':s.featureDom=changeText(s.featureDom);break;
      case 'ls-value': {const k=Object.keys(s.localStorage)[0];if(!k)throw Error('EXISTING_STORAGE_REQUIRED');s.localStorage[k]=String(s.localStorage[k])+'-changed';break;}
      case 'ls-added':s.localStorage.independentExtraKey='new-value';break;
      case 'ls-deleted': {const k=Object.keys(s.localStorage)[0];if(!k)throw Error('EXISTING_STORAGE_REQUIRED');delete s.localStorage[k];break;}
      case 'ss-value': {const k=Object.keys(s.sessionStorage)[0];if(!k)throw Error('EXISTING_SESSION_REQUIRED');s.sessionStorage[k]=String(s.sessionStorage[k])+'-changed';break;}
      case 'pageerror':s.pageerrors.push('independent-new-pageerror');break;
      case 'console-content':if(!s.consoleErrors.length||typeof s.consoleErrors[0]!=='string')throw Error('EXISTING_CONSOLE_ERROR_REQUIRED');s.consoleErrors[0]+='-independent-change';break;
      case 'toast':if(!s.toasts.length||typeof s.toasts[0]!=='string')throw Error('EXISTING_TOAST_REQUIRED');s.toasts[0]+='-independent-change';break;
      case 'completion':run.completed=false;gate='input';break;
      case 'required-step':run.steps.pop();gate='input';break;
      case 'base2-only': {const k=Object.keys(s.localStorage)[0];if(!k)throw Error('EXISTING_STORAGE_REQUIRED');s.localStorage[k]=String(s.localStorage[k])+'-baseline-change';gate='baseline';break;}
      case 'function-entry': {const spec=adapter.steps.find(x=>Object.keys(x.functions).length),i=adapter.steps.indexOf(spec);if(!spec)throw Error('FUNCTION_CONTRACT_REQUIRED');run.steps[i].functionEntries[Object.keys(spec.functions)[0]]=0;gate='input';break;}
      case 'postcondition': {const spec=adapter.steps.find(x=>Object.keys(x.postconditions).length),i=adapter.steps.indexOf(spec);if(!spec)throw Error('POSTCONDITION_REQUIRED');delete run.steps[i].postconditions[Object.keys(spec.postconditions)[0]];gate='input';break;}
      case 'raw-sha':gate='input';break;
      default:throw Error('CANARY_UNSUPPORTED_OR_UNMEASURED');
    }
    return gate;
  }
  const cases=[];
  function changedLeaves(a,b) {
    if(JSON.stringify(a)===JSON.stringify(b))return 0;
    if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return 1;
    return [...new Set([...Object.keys(a),...Object.keys(b)])].reduce((n,k)=>n+changedLeaves(a[k],b[k]),0);
  }
  for(const id of adapter.negativeCases) {
    const index=id==='base2-only'?1:2,run=clone(originals[index].value),req=clone(plain);
    const gate=mutate(id,run),mutatedRawPath=path.join(relative,id+'.raw.json');
    const changedExistingValues=id==='raw-sha'?1:changedLeaves(originals[index].value,run);
    if(changedExistingValues<1)throw Error('NO_ACTUAL_MUTATION');
    let mutatedRawSha256;
    if(id==='raw-sha') {
      const originalBytes=fs.readFileSync(path.join(evidence,request.runs[index].path));
      const bytes=Buffer.concat([originalBytes,Buffer.from(' ')]);
      fs.writeFileSync(path.join(evidence,mutatedRawPath),bytes);mutatedRawSha256=sha(bytes);
    } else mutatedRawSha256=write(mutatedRawPath,run);
    req.runs[index].path=mutatedRawPath;
    if(id!=='raw-sha')req.runs[index].sha256=mutatedRawSha256;
    const executed=execute(req,id);
    if(executed.exitCode===0||!executed.measured.errors.some(e=>e.gate===gate)||!executed.measured.actualReadInputShas.includes(mutatedRawSha256))throw Error('CANARY_NOT_REJECTED_AT_REQUIRED_GATE');
    cases.push({id,changedExistingValues,mutationUnit:id==='raw-sha'?'existing-raw-byte':'observed-leaf',exitCode:executed.exitCode,rejectionGate:gate,mutatedRawPath,mutatedRawSha256,resultPath:executed.resultPath,resultSha256:executed.resultSha256});
  }
  if(codeHash()!==lockedCore)throw Error('CORE_CHANGED_DURING_AUDIT');
  const audit={schema:'shared-proof-sensitivity/1',independent:true,measurementOnly:true,productVerdict:null,fixtureScope:'new-tool contract; not product E2E',coreSha256:lockedCore,adapterSha256:request.adapter.sha256,inputShas:request.runs.map(r=>r.sha256),cases};
  const out=opts['--out'];if(path.isAbsolute(out)||path.relative(evidence,path.resolve(evidence,out)).startsWith('..'))throw Error('RELATIVE_OUTPUT_REQUIRED');
  const auditSha=write(out,audit),complete=clone(request);complete.sensitivity={path:out,sha256:auditSha};
  const accepted=execute(complete,'with-independent-audit');
  console.log(JSON.stringify({measurementOnly:true,productVerdict:null,coreSha256:lockedCore,negativeCases:cases.length,allNegativeCasesRejected:true,positiveExitCode:accepted.exitCode,audit:{path:out,sha256:auditSha},resultPath:accepted.resultPath}));
  return accepted.exitCode;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2));}catch(e){console.log(JSON.stringify({measurementOnly:true,productVerdict:null,exitCode:1,error:/^[A-Z_]+$/.test(e.message)?e.message:'AUDIT_UNAVAILABLE'}));process.exitCode=1;}}
module.exports={main};
