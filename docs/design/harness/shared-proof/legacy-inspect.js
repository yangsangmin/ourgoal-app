'use strict';
const {fs,sha} = require('./common');
const {domains} = require('./preflight');
function inspect(file) {
  const bytes=fs.readFileSync(file),run=JSON.parse(bytes.toString('utf8'));
  const required=['runId','sourceCommit','manifestSha256','harnessSha256','adapterSha256','completed','error','startedAt','endedAt','inputFilesBefore','inputFilesAfter','steps'];
  const steps=run.steps||run.snapshots||[];
  return {measurementOnly:true,productVerdict:null,rawSha256:sha(bytes),bytes:bytes.length,
    missingRunFields:required.filter(k=>!Object.hasOwn(run,k)),
    steps:steps.map((s,i)=>({index:i,id:s.id||s.step||s.stepName||null,missingFields:[...domains,'fullDomSha256','id'].filter(k=>!Object.hasOwn(s,k))})),
    adapterCollectionReady:false,effect:null};
}
if(require.main===module) {try{console.log(JSON.stringify(inspect(process.argv[2]),null,2));process.exitCode=1;}catch{console.log(JSON.stringify({measurementOnly:true,error:'LEGACY_INPUT_UNAVAILABLE'}));process.exitCode=1;}}
module.exports={inspect};
