'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const base='9f161a5bc5c9c234e147ea1b2de8eda39674c22f', head='652e9c6b37ee639537e53a4ae7d2b79c44229819';
const prefix='reports/TASK-ES-080-GOAL-LINK-01a13674/';
const git=(...args)=>cp.execFileSync('git',['-c','core.longpaths=true','-c','core.autocrlf=false',...args]);
const bytes=(ref,file)=>git('show',ref+':'+file), hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function counter(steps){const out=new Map();for(const s of steps.filter(s=>s.expect)){const key=JSON.stringify(s);out.set(key,(out.get(key)||0)+1);}return out;}
const scenarios=['ambiguous','dismiss'].map(name=>{
 const oldPath=prefix+'scenarios/goal-link-'+name+'.json',newPath=prefix+'correction-2/scenarios/goal-link-'+name+'.json';
 const a=JSON.parse(bytes(base,oldPath)),b=JSON.parse(bytes(head,newPath));const ca=counter(a.steps),cb=counter(b.steps);
 return {name,oldPath,newPath,oldSHA256:hash(bytes(base,oldPath)),newSHA256:hash(bytes(head,newPath)),originalUnchanged:bytes(base,oldPath).equals(bytes(head,oldPath)),idUnchanged:a.id===b.id,titleUnchanged:a.title===b.title,viewportUnchanged:JSON.stringify(a.viewport)===JSON.stringify(b.viewport),oldSteps:a.steps.length,newSteps:b.steps.length,oldExpectations:a.steps.filter(s=>s.expect).length,newExpectations:b.steps.filter(s=>s.expect).length,missing:[...ca].filter(([key,n])=>(cb.get(key)||0)<n),newActions:b.steps.filter(s=>s.do).map(s=>s.do),physicalMatches:hash(fs.readFileSync('C:/dev/wt/eGoal080-courtfix-01a13674/'+newPath))===hash(bytes(head,newPath))};
});
const changed=git('diff','--name-only',base,head).toString('utf8').trim().split('\n').filter(Boolean);
const protectedFiles=[prefix+'claims.json',prefix+'scenarios/goal-link-navigation.json','js/tabs/goals/record-link.js','js/core/modal-helper.js','js/tabs/settings/guest-backup-nudge.js','js/tabs/records/checkin-capture.js'];
const protectedPins=protectedFiles.map(file=>({file,sha256:hash(bytes(base,file)),unchanged:bytes(base,file).equals(bytes(head,file))}));
const verdictFile=process.argv[2];const official=verdictFile?{artifact:'PR986 first official verdict.json',sha256:hash(fs.readFileSync(verdictFile)),verdictId:'F7860C3B',runId:'38612643260',source:base,base:'0692dbd255fdacad2a50db9e324dd5486d9769b7'}:null;
const result={at:new Date().toISOString(),base,head,scenarios,protectedPins,changed,productChanges:changed.filter(f=>!f.startsWith('reports/')&&!f.startsWith('.claude/')),official,scope:{sourceOnly:true,browser:false,productWrites:0,network:false,Court:null}};
fs.writeFileSync(__dirname+'/SOURCE-COMPARISON.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify({scenarios:scenarios.map(s=>({name:s.name,steps:s.newSteps,oldExpect:s.oldExpectations,newExpect:s.newExpectations,missing:s.missing.length,physicalMatches:s.physicalMatches})),protectedUnchanged:protectedPins.every(p=>p.unchanged),productChanges:result.productChanges}));
if(scenarios.some(s=>s.missing.length||!s.originalUnchanged||!s.physicalMatches)||protectedPins.some(p=>!p.unchanged)||result.productChanges.length)process.exitCode=1;
