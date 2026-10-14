'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),foundation=path.join(__dirname,'changed-boundary.cjs'),source=fs.readFileSync(foundation,'utf8'),m=new Module(__filename);m.filename=__filename;m.paths=Module._nodeModulePaths(__dirname);
m._compile(source.slice(0,source.indexOf('const checks=[]'))+'\nmodule.exports={environment,original,root};',__filename);const {environment,root}=m.exports;
const checks=[],failures=[],stamp=Date.now();
async function check(name,fn){try{checks.push({name,...await fn()});}catch(e){failures.push({name,error:e.name,message:String(e.message).slice(0,250)});throw e;}}
function buttonJourney(baseline=false){
 const e=environment(baseline),calls=[],listeners=[];
 e.L.resyncBtn={disabled:false,addEventListener:(event,fn)=>{assert.equal(event,'click');listeners.push(fn);}};
 e.L.syncServerRecords=async()=>calls.push('legacy-sync');
 e.L.renderAll=()=>calls.push('all-render');e.L.renderSettingsScreen=()=>calls.push('settings-render');
 e.L.saveProfile=async options=>{calls.push(options?'typed-retry':'legacy-send');return [];};
 e.L.loadProfile=async()=>({...e.profile,_saveLoadState:{users:{remote:'unconfirmed'},goals:{remote:'unconfirmed'},records:{remote:'unconfirmed'}}});
 e.load('js/tabs/settings/account-actions.js');e.scope.OurgoalSettingsKit.bindResyncAccountDataButton();assert.equal(listeners.length,1);
 return {...e,calls,click:()=>listeners[0]()};
}
(async()=>{try{
 await check('original manual resync dispatches legacy full send and full render',async()=>{
  const e=buttonJourney(true);await e.click();assert.ok(e.calls.includes('legacy-sync'));assert.ok(e.calls.includes('legacy-send'));assert.ok(e.calls.includes('all-render'));return {base:'d326db5e6c7c50255e198d44204241f0c68fc0e8',scope:'source component only'};
 });
 await check('manual unknown keeps original backup and does not send full profile or claim completion',async()=>{
  const e=buttonJourney(),key='ourgoal_records_backup_'+e.profile.id,raw=JSON.stringify(e.profile.records);e.store.setItem(key,raw);await e.click();assert.deepEqual(e.calls,['typed-retry','settings-render']);assert.equal(e.store.getItem(key),raw);assert.equal(e.L.state.profile,e.profile);assert.ok(e.toasts.at(-1).includes('아직 확인되지'));assert.equal(e.L.resyncBtn.disabled,false);return {fullSend:0,backupUnchanged:true,notice:'unconfirmed'};
 });
 await check('manual confirmed pending and empty pending use different truthful notices',async()=>{
  for(const pending of [[],[{state:'confirmed'}]]){const e=buttonJourney();e.L.saveProfile=async opts=>{assert.deepEqual(JSON.parse(JSON.stringify(opts)),{deviceFirst:true,retry:true,manualRetry:true});return pending;};e.L.loadProfile=async()=>({...e.profile,_saveLoadState:Object.fromEntries(['users','goals','records'].map(k=>[k,{remote:'read-accepted'}]))});await e.click();assert.ok(e.toasts.at(-1).includes(pending.length?'이번 요청':'불러온 자료'));assert.ok(!e.toasts.at(-1).includes('동기화 완료'));}return {noticeCases:2};
 });
 await check('manual double click and later same-profile edit do not overwrite or emit old completion',async()=>{
  const e=buttonJourney();let release;e.L.saveProfile=()=>{e.calls.push('typed-retry');return new Promise(r=>release=r);};const p=e.click();await e.click();assert.equal(e.calls.length,1);e.profile.records[0].text='new body';release([]);await p;assert.equal(e.profile.records[0].text,'new body');assert.equal(e.toasts.length,1);assert.equal(e.L.resyncBtn.disabled,false);return {dispatches:1,lateNotice:0};
 });
 await check('manual profile replacement during load prevents adopting old rows or feedback',async()=>{
  const e=buttonJourney();let release;e.L.loadProfile=()=>new Promise(r=>release=r);const p=e.click();while(!release)await new Promise(r=>setTimeout(r,1));e.L.state.profile={id:'other',records:[],goals:[],settings:{}};release({...e.profile});await p;assert.equal(e.L.state.profile.id,'other');assert.deepEqual(e.calls,['typed-retry']);assert.equal(e.toasts.length,1);return {adoptOldRows:0,lateNotice:0};
 });
 await check('invalid users target and B delete operation leave pending untouched and send nothing',async()=>{
  for(const opts of [{kind:'users',targetId:'other'},{kind:'goals',targetId:'same-target',operation:'delete'}]){const e=environment(),r=await e.save(opts);assert.equal(r.state,'failed');assert.equal(e.calls.length,0);assert.equal(e.store.getItem('ourgoal_save_pending_'+e.profile.id),null);}return {invalidCases:2};
 });
 await check('matching payload with 500 status cannot be confirmed',async()=>{
  const e=environment();e.setResponse(async(_t,p)=>({status:500,data:[Array.isArray(p)?p[0]:p]}));const r=await e.save({kind:'goals',targetId:'same-target'});await r.whenSettled;assert.equal(r.state,'local');assert.ok(e.pending().kindData.goals.entries['same-target']);return {pendingRetained:true};
 });
 await check('corrupt pending retry returns failure so manual journey cannot infer empty successful queue',async()=>{
  const e=environment(),key='ourgoal_save_pending_'+e.profile.id,raw='{"schema":2}';e.store.setItem(key,raw);const r=await e.scope.OurgoalUiHelpers.saveProfile({deviceFirst:true,retry:true,manualRetry:true});assert.equal(r.length,1);assert.equal(r[0].state,'failed');assert.equal(r[0].reason,'pending-integrity');assert.equal(e.store.getItem(key),raw);assert.equal(e.calls.length,0);return {typedFailure:true,sendCount:0};
 });
 }catch(e){process.exitCode=1;}finally{
 const out={at:new Date().toISOString(),scope:'source component + private FS, injected local responses; not native UI/auth/DB/E2E',helperSHA256:sha(fs.readFileSync(__filename)),foundationSHA256:sha(fs.readFileSync(foundation)),products:['js/core/device-save.js','js/tabs/settings/account-actions.js'].map(file=>({file,sha256:sha(fs.readFileSync(root+'/'+file))})),checks,failures,network:0,auth:0,realDB:0,operating:null,use:null,effect:null,Court:null,ownPID:process.pid};fs.writeFileSync(path.join(__dirname,'manual-component-'+stamp+'.json'),JSON.stringify(out,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(out));
 }
})();
