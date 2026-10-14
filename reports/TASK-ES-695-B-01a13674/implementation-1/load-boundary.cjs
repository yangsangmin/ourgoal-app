'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),file=path.join(__dirname,'changed-boundary.cjs'),source=fs.readFileSync(file,'utf8'),moduleRecord=new Module(__filename);moduleRecord.filename=__filename;moduleRecord.paths=Module._nodeModulePaths(__dirname);
moduleRecord._compile(source.slice(0,source.indexOf('const checks=[]'))+'\nmodule.exports={environment,original,root};',__filename);const{environment,root}=moduleRecord.exports;
const checks=[],failures=[],stamp=Date.now();
function queries(e,mode){
 let lookupResolve;
 const users={id:e.profile.id,username:e.profile.username,display_name:'server component'};
 e.L.sb.from=table=>({select:()=>{const query={eq:()=>query,order:()=>{
   if(mode==='deferred'&&table==='goals')return new Promise(r=>lookupResolve=r);
   if(mode==='error')return Promise.resolve({status:500,error:{code:'READ_UNCONFIRMED'},data:null});
   if(mode==='throw')return Promise.reject(Error('component read failure'));
   if(mode==='foreign')return Promise.resolve({status:200,data:[{id:'foreign-row',user_id:'other'}]});
   return Promise.resolve({status:200,data:[]});
 },maybeSingle:()=>Promise.resolve({status:200,data:users})};return query;},upsert:payload=>{e.calls.push({table,payload});const promise=Promise.resolve({status:200,data:[]});promise.select=()=>promise;return promise;}});
 return{release:()=>lookupResolve({status:200,data:[]}),ready:()=>!!lookupResolve};
}
async function check(name,fn){try{checks.push({name,...await fn()});}catch(e){failures.push({name,error:e.name,message:String(e.message).slice(0,220)});throw e;}}
(async()=>{try{
 for(const mode of ['empty','error','throw','foreign'])await check('load '+mode+' response keeps local data and never upserts',async()=>{
  const e=environment();queries(e,mode);e.load('js/core/profile-load.js');const kg='ourgoal_goals_backup_'+e.profile.id,kr='ourgoal_records_backup_'+e.profile.id,g=JSON.stringify(e.profile.goals),r=JSON.stringify(e.profile.records);e.store.setItem(kg,g);e.store.setItem(kr,r);
  const p=await e.scope.OurgoalUiHelpers.loadProfile(e.profile.id,e.profile.username);assert.equal(e.calls.length,0);assert.equal(e.store.getItem(kg),g);assert.equal(e.store.getItem(kr),r);assert.equal(p.goals[0].id,e.profile.goals[0].id);assert.equal(p.records[0].id,e.profile.records[0].id);
  assert.equal(p._saveLoadState.goals.remote,'unconfirmed');assert.equal(p._saveLoadState.records.remote,'unconfirmed');assert.equal(JSON.parse(e.store.getItem('ourgoal_goals_kept_'+e.profile.id)).items.length,1);assert.ok(e.toasts.some(t=>t.includes('아직 확인되지')));return{upserts:0,backupsUnchanged:true,existence:'unknown'};
 });
 await check('exact baseline empty-response automatic whole upsert is reproduced once',async()=>{
  const e=environment(true);queries(e,'empty');e.load('js/core/profile-load.js');e.store.setItem('ourgoal_goals_backup_'+e.profile.id,JSON.stringify(e.profile.goals));e.store.setItem('ourgoal_records_backup_'+e.profile.id,JSON.stringify(e.profile.records));await e.scope.OurgoalUiHelpers.loadProfile(e.profile.id,e.profile.username);assert.ok(e.calls.some(x=>x.table==='goals'));assert.ok(e.calls.some(x=>x.table==='checkins'));return{baseSource:'d326db5e6c7c50255e198d44204241f0c68fc0e8',wholeUpserts:e.calls.length,scope:'injected component only'};
 });
 await check('load archive quota leaves exact original backups and unknown state',async()=>{
  const e=environment();queries(e,'empty');e.load('js/core/profile-load.js');const kg='ourgoal_goals_backup_'+e.profile.id,g=JSON.stringify(e.profile.goals);e.store.setItem(kg,g);e.store.setItem('ourgoal_records_backup_'+e.profile.id,JSON.stringify(e.profile.records));const set=e.store.setItem;e.store.setItem=(k,v)=>{if(k.includes('_kept_'))throw Error('QuotaExceededError');set(k,v);};const p=await e.scope.OurgoalUiHelpers.loadProfile(e.profile.id,e.profile.username);assert.equal(p._saveLoadState.goals.archiveVerified,false);assert.equal(e.store.getItem(kg),g);assert.equal(e.calls.length,0);return{archiveVerified:false,backupRetained:true};
 });
 await check('profile replacement while read is pending rejects stale load before archive/toast',async()=>{
  const e=environment(),q=queries(e,'deferred');e.load('js/core/profile-load.js');const pending=e.scope.OurgoalUiHelpers.loadProfile(e.profile.id,e.profile.username);while(!q.ready())await new Promise(r=>setTimeout(r,1));e.L.state.profile={id:'other',records:[],goals:[],settings:{}};q.release();await assert.rejects(pending,/profile-load-generation-changed/);assert.equal(e.calls.length,0);assert.equal(e.toasts.length,0);return{lateLoadRejected:true};
 });
 await check('user response after profile replacement cannot acknowledge or emit current event',async()=>{
  const e=environment();let release;e.setResponse((_t,p)=>new Promise(r=>release=()=>r({status:200,data:[p]})));const saved=await e.save({kind:'users'});while(!release)await new Promise(r=>setTimeout(r,1));const events=e.events.length;e.L.state.profile={id:'other',records:[],goals:[],settings:{}};release();await saved.whenSettled;assert.ok(e.pending().kindData.users.entries[e.profile.id]);assert.equal(e.events.length,events);return{pendingRetained:true,currentEventCount:0};
 });
 }catch(e){process.exitCode=1;}finally{const out={at:new Date().toISOString(),scope:'source-derived VM + private FS components only; no account auth/live DB/UI/E2E',helperSHA256:sha(fs.readFileSync(__filename)),foundationHelperSHA256:sha(fs.readFileSync(file)),products:['js/core/profile-load.js','js/core/device-save.js','js/core/local-keep.js'].map(file=>({file,sha256:sha(fs.readFileSync(root+'/'+file))})),checks,failures,network:0,realDB:0,auth:0,fixtureDB:0,operating:null,use:null,effect:null,Court:null,ownPID:process.pid};fs.writeFileSync(path.join(__dirname,'load-component-'+stamp+'.json'),JSON.stringify(out,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(out));}})();
