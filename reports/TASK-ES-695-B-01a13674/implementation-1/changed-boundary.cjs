'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),dir=path.join(__dirname,'.private',String(Date.now())),stamp=Date.now(),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
const files=['js/core/device-save.js','js/core/home-cockpit.js','js/core/profile-load.js','js/core/virtual-user-helpers.js','js/core/local-keep.js'];
const base='d326db5e6c7c50255e198d44204241f0c68fc0e8',original=f=>cp.execFileSync('git',['-c','core.longpaths=true','-c','core.autocrlf=false','-C',root,'cat-file','blob',base+':'+f],{encoding:'utf8'});
let envSequence=0;
function environment(baseline=false){
 const folder=path.join(dir,String(++envSequence));fs.mkdirSync(folder,{recursive:true});
 const filename=k=>path.join(folder,encodeURIComponent(k)+'.json');
 const store={getItem:k=>fs.existsSync(filename(k))?fs.readFileSync(filename(k),'utf8'):null,setItem:(k,v)=>fs.writeFileSync(filename(k),String(v),'utf8'),removeItem:k=>{const f=filename(k);assert.ok(f.startsWith(folder+path.sep));if(fs.existsSync(f))fs.unlinkSync(f);}};
 const profile={id:'component-account',username:'component',displayName:'component',records:[{id:'same-target',type:'note',text:'component',startAt:'2026-10-14T00:00:00Z',ownerUid:'component-account'}],goals:[{id:'same-target',title:'component goal',milestones:[]}],settings:{saveSync:{timeoutMs:25,retryMs:300000,maxAttempts:2}}},events=[],calls=[],toasts=[],locks=new Map();let seq=0;
 const L={state:{profile},newId:()=>String(++seq),saveLocalSettings(){},updateAppBadge(){},computeStreakDays(){return 0;},toast:s=>toasts.push(s),loadLocalSettings:()=>({}),getAttribution:()=>({}),track(){}};
 const scope={window:null,module:{exports:{}},console:{warn(){}},localStorage:store,OurgoalAppScope:{scope:L},navigator:{onLine:true,locks:{request:(k,fn)=>{const promise=(locks.get(k)||Promise.resolve()).then(fn);locks.set(k,promise.catch(()=>{}));return promise;}}},setTimeout:(fn,ms)=>ms>=1000?0:setTimeout(fn,ms),clearTimeout,AbortController,Promise,Map,JSON,Date,Math,Number,addEventListener(){},OurgoalEvents:{emit:(name,r)=>events.push({name,r:plain(r)})}};
 scope.window=scope;scope.OurgoalCapabilities={provide:(name,fn)=>scope.capabilities.set(name,fn),request:name=>{assert.ok(scope.capabilities.has(name),name);return scope.capabilities.get(name);},has:()=>false};scope.capabilities=new Map();
 scope.OurgoalAccountIsolation={ownRecordsOnly:(rows,uid)=>rows.filter(r=>(!r.ownerUid||r.ownerUid===uid)&&(!r.user_id||r.user_id===uid)),readOwnCopy:(prefix,uid,fallback)=>JSON.parse(store.getItem(prefix+uid)||JSON.stringify(fallback)),isResponseForUid:(a,b)=>a===b};
 scope.OurgoalRecordLedger=require(root+'/js/record-ledger.js');
 let response=async(table,payload)=>({status:200,data:Array.isArray(payload)?payload:[payload]});
 L.sb={auth:{getSession:async()=>({data:{session:{user:{id:profile.id}}}})},from:table=>({upsert:payload=>{calls.push({table,payload:plain(payload)});const promise=Promise.resolve().then(()=>response(table,payload));promise.select=()=>promise;promise.abortSignal=()=>promise;return promise;}})};
 for(const file of ['js/core/local-keep.js','js/core/device-save.js','js/core/home-cockpit.js'])vm.runInNewContext(baseline?original(file):fs.readFileSync(root+'/'+file,'utf8'),scope,{filename:file});
 const api=scope.capabilities.get('storage.device.save');return{folder,store,profile,L,scope,events,calls,toasts,api,setResponse:fn=>response=fn,core:scope.module.exports,load:file=>vm.runInNewContext(baseline?original(file):fs.readFileSync(root+'/'+file,'utf8'),scope,{filename:file}),pending:()=>JSON.parse(store.getItem('ourgoal_save_pending_'+profile.id)),save:opts=>scope.OurgoalUiHelpers.saveProfile({deviceFirst:true,...opts})};
}
const checks=[],failures=[];
async function check(name,fn){try{const metadata=await fn();checks.push({name,...metadata});}catch(e){failures.push({name,error:e.code||e.name,message:String(e.message).slice(0,300)});throw e;}}
(async()=>{try{
 await check('exact A schema read is byte preserving and metadata survives B bucket append',async()=>{
  const a=environment(true);a.setResponse(async()=>({status:500,error:{message:'component failure'}}));const old=await a.save({recordId:'same-target'});await old.whenSettled;
  const key='ourgoal_save_pending_'+a.profile.id,q=a.pending();q.metadata={retained:'component'};const raw=JSON.stringify(q);a.store.setItem(key,raw);
  const b=environment();b.store.setItem(key,raw);b.setResponse(async()=>({status:500,error:{message:'component failure'}}));const engine=b.scope.capabilities.get('storage.device.save');
  // Read the current exported API without executing another send.
  const moduleScope={...b.scope,module:{exports:{}}};moduleScope.window=moduleScope;vm.runInNewContext(fs.readFileSync(root+'/js/core/device-save.js','utf8'),moduleScope);moduleScope.module.exports.read(b.store,b.profile.id);assert.equal(b.store.getItem(key),raw);
  const result=await b.save({kind:'goals',targetId:'same-target'});await result.whenSettled;const next=b.pending();assert.deepEqual(next.entries,q.entries);assert.deepEqual(next.versions,q.versions);assert.deepEqual(next.confirmed,q.confirmed);assert.deepEqual(next.metadata,q.metadata);assert.ok(next.kindData.goals.entries['same-target']);return{oldSchema:1,rawReadUnchanged:true,oldRecordMetadataRetained:true};
 });
 await check('same target ID kinds settle independently with users ownership',async()=>{
  const e=environment();const goal=await e.save({kind:'goals',targetId:'same-target'}),record=await e.save({recordId:'same-target'}),user=await e.save({kind:'users'});await Promise.all([goal.whenSettled,record.whenSettled,user.whenSettled]);assert.equal(goal.state,'confirmed');assert.equal(record.state,'confirmed');assert.equal(user.state,'confirmed');assert.equal(goal.recordId,null);assert.equal(user.recordId,null);assert.equal(goal.types.records.remote,'not-sent');assert.equal(record.types.goals.remote,'not-sent');assert.equal(e.pending().entries['same-target'],undefined);assert.equal(e.pending().kindData.goals.entries['same-target'],undefined);return{independentKinds:3};
 });
 for(const kind of ['users','goals'])await check(kind+' zero/extra/foreign/mismatched rows remain pending',async()=>{
  for(const mode of ['zero','extra','foreign','changed']){const e=environment();e.setResponse(async(_table,p)=>{const row=Array.isArray(p)?p[0]:p;return{status:200,data:mode==='zero'?[]:mode==='extra'?[row,row]:[{...row,...(mode==='foreign'?(kind==='users'?{id:'foreign'}:{user_id:'foreign'}):kind==='users'?{display_name:'changed'}:{title:'changed'})}]};});const r=await e.save({kind,targetId:kind==='users'?e.profile.id:'same-target'});await r.whenSettled;assert.notEqual(r.state,'confirmed');assert.ok(e.pending().kindData[kind].entries[r.targetId]);}return{modes:4};
 });
 await check('new goal generation survives old acknowledgement and account replacement',async()=>{
  const e=environment();let resolve;const oldTitle=e.profile.goals[0].title;e.setResponse(()=>new Promise(r=>resolve=r));const old=await e.save({kind:'goals',targetId:'same-target'});await new Promise(r=>setTimeout(r,1));e.profile.goals[0].title='next generation';const newer=await e.save({kind:'goals',targetId:'same-target'});resolve({status:200,data:[{...e.calls[0].payload[0],title:oldTitle}]});await old.whenSettled;assert.equal(e.pending().kindData.goals.entries['same-target'].generation,newer.generation);assert.ok(newer.generation>old.generation);
  const count=e.events.length;e.L.state.profile={id:'other',records:[],goals:[],settings:{}};await e.scope.capabilities.get('storage.device.retry')({current:()=>e.L.state.profile,store:e.store},false);assert.ok(e.pending().kindData.goals.entries['same-target']);assert.equal(e.events.length,count);return{oldDoesNotEraseNew:true};
 });
 await check('schema unknown/corrupt typed bucket and quota cause zero writes',async()=>{
  for(const raw of ['{"schema":2,"account":"component-account"}','{"schema":1,"account":"component-account","versions":{},"entries":{},"kindData":null}','{"schema":1,"account":"component-account","versions":{},"entries":{},"kindData":{"other":{}}}']){const e=environment();e.store.setItem('ourgoal_save_pending_'+e.profile.id,raw);const r=await e.save({kind:'goals',targetId:'same-target'});assert.equal(r.state,'failed');assert.equal(e.calls.length,0);assert.equal(e.store.getItem('ourgoal_save_pending_'+e.profile.id),raw);}
  const e=environment(),set=e.store.setItem;e.store.setItem=(k,v)=>{if(k.startsWith('ourgoal_save_pending_'))throw Error('QuotaExceededError');set(k,v);};const r=await e.save({kind:'goals',targetId:'same-target'});assert.equal(r.state,'failed');assert.equal(e.calls.length,0);return{corruptCases:3,quotaSendCount:0};
 });
 await check('user fallback omissions do not confirm or auto resend original payload',async()=>{
  const e=environment();e.setResponse(async(_t,p)=>p.trash!==undefined?{status:400,error:{message:'trash column missing'}}:{status:200,data:[p]});const r=await e.save({kind:'users'});await r.whenSettled;assert.equal(r.state,'local');assert.equal(r.reason,'schema-omission');assert.ok(r.omittedFields.includes('trash'));assert.ok(e.pending().kindData.users.entries[e.profile.id].payload.trash);const n=e.calls.length;await e.scope.OurgoalUiHelpers.saveProfile({deviceFirst:true,retry:true});assert.equal(e.calls.length,n);return{partialNotConfirmed:true};
 });
 await check('user timeout and 403 authentication/permission are separate',async()=>{
  for(const [message,state]of [['JWT token expired','reauth'],['permission denied','rejected']]){const e=environment();e.setResponse(async()=>({status:403,error:{message}}));const r=await e.save({kind:'users'});await r.whenSettled;assert.equal(r.state,state);}
  const e=environment();e.setResponse(()=>new Promise(()=>{}));const r=await e.save({kind:'users'});await r.whenSettled;assert.equal(r.state,'local');assert.equal(r.reason,'unconfirmed');return{statusCases:2,timeout:'unconfirmed'};
 });
 await check('legacy queue remains byte-identical, does not restore foreign/ownerless or flush',async()=>{
  const e=environment();e.load('js/core/virtual-user-helpers.js');const q=[{id:'a',action:{type:'record',data:{id:'owned-old',ownerUid:e.profile.id,text:'component'}}},{id:'b',action:{type:'record',data:{id:'unknown-old',text:'component'}}},{id:'c',action:{type:'record',data:{id:'foreign-old',ownerUid:'other',text:'component'}}}],raw=JSON.stringify(q),key='ourgoal_offline_sync_queue';e.store.setItem(key,raw);
  const before=plain(e.profile.records),r=await e.scope.OurgoalUiHelpers.OfflineSyncManager.syncOnline();assert.equal(r.synced,0);assert.equal(r.queueUnchanged,true);assert.equal(e.store.getItem(key),raw);assert.deepEqual(plain(e.profile.records),before);assert.equal(e.calls.length,0);const kept=JSON.parse(e.store.getItem('ourgoal_records_kept_'+e.profile.id));assert.equal(kept.items.length,1);assert.equal(kept.items[0].item.id,'owned-old');assert.ok(e.toasts.some(t=>t.includes('確認')===false&&t.includes('확인되지')));return{legacyItems:3,ownedArchived:1,serverCalls:0};
 });
 await check('archive failure preserves old queue and original backups',async()=>{
  const e=environment();e.load('js/core/virtual-user-helpers.js');const q=[{id:'old',action:{type:'record',data:{id:'owned-old',ownerUid:e.profile.id,text:'component'}}}],raw=JSON.stringify(q),key='ourgoal_offline_sync_queue';e.store.setItem(key,raw);const set=e.store.setItem;e.store.setItem=(k,v)=>{if(k.startsWith('ourgoal_records_kept_'))throw Error('QuotaExceededError');set(k,v);};const r=await e.scope.OurgoalUiHelpers.OfflineSyncManager.syncOnline();assert.equal(r.archiveVerified,false);assert.equal(e.store.getItem(key),raw);assert.equal(e.calls.length,0);return{archiveVerified:false,queueRetained:true};
 });
 }catch(e){process.exitCode=1;}finally{
 const out={at:new Date().toISOString(),scope:'selected VM + actual private FS components; synthetic values and injected responses only, not auth/DB/browser/E2E',base,files:files.map(file=>({file,sha256:sha(fs.readFileSync(root+'/'+file))})),checks,failures,network:0,realDB:0,auth:0,actualBrowser:null,operating:null,use:null,effect:null,Court:null,ownPID:process.pid};fs.writeFileSync(path.join(__dirname,'component-'+stamp+'.json'),JSON.stringify(out,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(out));
 }
})();
