'use strict';
// New-tool unit contract data only. No product E2E or real-account fixture.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const root=path.resolve(__dirname,'../..'),core=path.join(root,'docs/design/harness/shared-proof');
const {sha,digest,requiredNegativeCases}=require(path.join(core,'common'));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'shared-proof-unit-'));
const out=__dirname,write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const adapter={schema:'shared-proof-adapter/1',taskId:'unit-contract',collectionReady:true,steps:[{id:'observed',action:'click',target:'#unit-button',postconditions:{open:true},functions:{unitEntry:1}}],dynamicContracts:[],negativeCases:requiredNegativeCases};
write(path.join(scratch,'adapter.json'),adapter);fs.writeFileSync(path.join(scratch,'collector.js'),'// unit contract input\n','utf8');
const files=['adapter.json','collector.js'].map(p=>({path:p,sha256:sha(fs.readFileSync(path.join(scratch,p)))}));
const make=(id)=>({schema:'shared-proof-run/1',runId:id,sourceCommit:'a'.repeat(40),manifestSha256:digest(files),harnessSha256:files[1].sha256,adapterSha256:files[0].sha256,completed:true,error:null,startedAt:'2026-10-07T00:00:00Z',endedAt:'2026-10-07T00:00:01Z',inputFilesBefore:files,inputFilesAfter:files,
  steps:[{id:'observed',fullDom:'<body><button id="unit-button">unit</button></body>',fullDomSha256:sha('<body><button id="unit-button">unit</button></body>'),featureDom:'<button>unit</button>',localStorage:{unit:'original'},sessionStorage:{unit:'session'},toasts:[],consoleErrors:[],pageerrors:[],postconditions:{open:true},functionEntries:{unitEntry:1},click:{method:'mouse',target:'#unit-button',success:true,isTargetOrDescendant:true,inViewport:true,nonZero:true}}]});
const cases=[
 ['original-independent-audit-unmeasured',()=>{},'sensitivity','INDEPENDENT_AUDIT_UNMEASURED'],
 ['incomplete',r=>r[2].completed=false,'input','INCOMPLETE_OR_ERROR'],
 ['error',r=>r[2].error='unit failure','input','INCOMPLETE_OR_ERROR'],
 ['same-step-omitted-all',r=>r.forEach(x=>x.steps=[]),'input','REQUIRED_STEP_ORDER'],
 ['input-file-sha',r=>r[2].inputFilesAfter=[],'input','INPUT_CHANGED_OR_MISSING'],
 ['dom-sha',r=>r[2].steps[0].fullDom+='x','input','DOM_SHA'],
 ['full-dom',r=>{r[2].steps[0].fullDom+='x';r[2].steps[0].fullDomSha256=sha(r[2].steps[0].fullDom);},'work','DOMAIN_DIFFERENCE'],
 ['feature-dom',r=>r[2].steps[0].featureDom+='x','work','DOMAIN_DIFFERENCE'],
 ['ls-value',r=>r[2].steps[0].localStorage.unit='different','work','DOMAIN_DIFFERENCE'],
 ['ls-key-add',r=>r[2].steps[0].localStorage.extra='x','work','DOMAIN_DIFFERENCE'],
 ['ls-key-delete',r=>delete r[2].steps[0].localStorage.unit,'work','DOMAIN_DIFFERENCE'],
 ['ss-value',r=>r[2].steps[0].sessionStorage.unit='different','work','DOMAIN_DIFFERENCE'],
 ['pageerror',r=>r[2].steps[0].pageerrors=['unit error'],'work','DOMAIN_DIFFERENCE'],
 ['console-content',r=>{r[0].steps[0].consoleErrors=['first'];r[1].steps[0].consoleErrors=['first'];r[2].steps[0].consoleErrors=['other'];},'work','DOMAIN_DIFFERENCE'],
 ['toast',r=>r[2].steps[0].toasts=['different'],'work','DOMAIN_DIFFERENCE'],
 ['base2-only',r=>r[1].steps[0].localStorage.unit='different','baseline','DOMAIN_DIFFERENCE'],
 ['function-unobserved',r=>r[2].steps[0].functionEntries.unitEntry=0,'input','FUNCTION_UNOBSERVED'],
 ['postcondition',r=>r[2].steps[0].postconditions.open=false,'input','POSTCONDITION'],
 ['non-mouse',r=>r[2].steps[0].click.method='evaluate','input','ACTUAL_CLICK_REQUIRED'],
 ['missing-ss',r=>delete r[2].steps[0].sessionStorage,'input','MISSING_OBSERVATION'],
 ['raw-tamper',()=>{},'input','RAW_SHA_MISMATCH']
];
const results=[];
for(const [name,mutate,gate,code]of cases) {
 const runs=['base1','base2','after'].map(make);mutate(runs);
 const req={schema:'shared-proof-request/1',adapter:{path:'adapter.json',sha256:files[0].sha256},runs:runs.map((v,i)=>{
   const p=['base1','base2','after'][i]+'.json';write(path.join(scratch,p),v);
   return {role:['base1','base2','after'][i],path:p,sha256:sha(fs.readFileSync(path.join(scratch,p))),binding:{sourceCommit:'a'.repeat(40),manifestSha256:digest(files),harnessSha256:files[1].sha256,harnessPath:'collector.js',adapterPath:'adapter.json'}};
 })};
 if(name==='raw-tamper')fs.appendFileSync(path.join(scratch,'after.json'),' ','utf8');
 write(path.join(scratch,'request.json'),req);
 const args=[path.join(core,'cli.js'),'--request',path.join(scratch,'request.json'),'--evidence-root',scratch,'--base1-root',scratch,'--base2-root',scratch,'--after-root',scratch];
 const measured=cp.spawnSync(process.execPath,args,{encoding:'utf8'});
 const raw={command:'node',args:args.map(a=>a.startsWith(scratch)?'<private-unit-scratch>/'+path.basename(a):a),exitCode:measured.status,stdout:measured.stdout,stderr:measured.stderr};
 write(path.join(out,name+'.raw.json'),raw);
 const result=JSON.parse(measured.stdout);
 results.push({name,expectedGate:gate,expectedCode:code,actualExitCode:measured.status,expectedObserved:measured.status!==0&&result.errors.some(e=>e.gate===gate&&e.code===code),gates:result.gates,rawSha256:sha(fs.readFileSync(path.join(out,name+'.raw.json')))});
}
write(path.join(out,'measurement.json'),{measurementOnly:true,productVerdict:null,fixtureScope:'new CLI unit contract, not product E2E',measuredAt:new Date().toISOString(),cases:results,expectedObservations:results.length,observed:results.filter(r=>r.expectedObserved).length,effect:null});
console.log(JSON.stringify({cases:results.length,observed:results.filter(r=>r.expectedObserved).length,measurementOnly:true}));
process.exitCode=results.every(r=>r.expectedObserved)?0:1;
