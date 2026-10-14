'use strict';
// New L1 VM boundaries only. In-memory component input; no genuine auth, HTTP or DB fixture.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['js/core/local-keep.js','js/core/device-save.js','js/core/home-cockpit.js','js/core/profile-load.js','js/account-isolation.js'];
function environment(){
 const memory=new Map(),store={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)},cap=new Map(),calls=[];
 const profile={id:'component-owner',username:'component-name',displayName:'component-name',records:[],goals:[],settings:{saveSync:{timeoutMs:100,retryMs:300000,maxAttempts:2}}};
 const L={state:{profile},newId:()=>crypto.randomUUID(),toast(){},saveLocalSettings(){},loadLocalSettings:()=>({}),getAttribution:()=>({}),getSupabaseAuthToken:async()=>null,track(){},computeStreakDays:()=>0,updateAppBadge(){}};
 const g={window:null,module:{exports:{}},console:{warn(){}},localStorage:store,OurgoalAppScope:{scope:L},OurgoalCapabilities:{provide:(n,f)=>cap.set(n,f),request:n=>{if(!cap.has(n))throw Error('COMPONENT_CAPABILITY_MISSING');return cap.get(n);},has:()=>false},navigator:{onLine:true,locks:{request:(_n,f)=>Promise.resolve().then(f)}},addEventListener(){},setTimeout:(f,m)=>m<1000?setTimeout(f,m):0,clearTimeout,AbortController,Map,Promise,Date,Math,JSON,Number};g.window=g;
 vm.createContext(g);for(const file of ['js/account-isolation.js','js/core/local-keep.js','js/core/device-save.js','js/core/home-cockpit.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),g,{filename:file});
 return {g,L,profile,store,cap,calls,load:()=>vm.runInContext(fs.readFileSync(path.join(root,'js/core/profile-load.js'),'utf8'),g,{filename:'js/core/profile-load.js'})};
}
function base(uid){return {schema:1,account:uid,versions:{},entries:{},confirmed:{},kindData:{}};}
(async()=>{const conditions=[];
 // Typed bucket has valid owner/version/body but corrupt retry metadata not covered by whole suites.
 const a=environment(),uid=a.profile.id,payload={id:'component-goal',user_id:uid,title:'component-value'},q=base(uid);
 q.kindData.goals={versions:{'component-goal':1},confirmed:{},entries:{'component-goal':{account:uid,kind:'goals',target:'component-goal',generation:1,changeId:'component-change',payload,operation:'update',attempts:'invalid',lastFailure:null}}};a.store.setItem('ourgoal_save_pending_'+uid,JSON.stringify(q));
 let strictReadRejected=false;try{a.cap.get('storage.device.pending')(uid,a.store);}catch{strictReadRejected=true;}
 a.L.sb={auth:{getSession:async()=>({data:{session:{user:{id:uid}}}})},from:table=>({upsert:_payload=>{a.calls.push({kind:table});const p=Promise.resolve({status:500,error:{code:'LOCAL_COMPONENT_UNCONFIRMED'}});p.select=()=>p;p.abortSignal=()=>p;return p;}})};
 for(let n=0;n<3;n++)await a.g.OurgoalUiHelpers.saveProfile({deviceFirst:true,retry:true});
 const aq=JSON.parse(a.store.getItem('ourgoal_save_pending_'+uid));conditions.push({condition:'손상된 typed attempts의 strict reader와 자동 retry 상한',strictReadRejected,mockSendCount:a.calls.length,configuredMaxAttempts:a.profile.settings.saveSync.maxAttempts,limitExceeded:a.calls.length>a.profile.settings.saveSync.maxAttempts,attemptsType:typeof aq.kindData.goals.entries['component-goal'].attempts,entryPreserved:!!aq.kindData.goals.entries['component-goal'],realAuth:0,realDB:0});
 // Existing own users pending proves local change even when its separate profile backup is absent.
 const b=environment(),bid=b.profile.id,bq=base(bid),pendingUser={id:bid,username:'component-name',display_name:'component-pending-value',bio:'component-pending-body'};
 bq.kindData.users={versions:{[bid]:1},confirmed:{},entries:{[bid]:{account:bid,kind:'users',target:bid,generation:1,changeId:'component-user-change',payload:pendingUser,operation:'update',attempts:0,lastFailure:null}}};const pendingRaw=JSON.stringify(bq);b.store.setItem('ourgoal_save_pending_'+bid,pendingRaw);
 b.L.sb={from:table=>{
   const query={eq:()=>query,order:()=>query,limit:()=>query,maybeSingle:()=>Promise.resolve({data:null,error:null}),then:resolve=>Promise.resolve({data:[],error:null}).then(resolve)};
   return {select:()=>query,upsert:payload=>{
     b.calls.push({kind:table,payloadSHA256:sha(Buffer.from(JSON.stringify(payload)))});
     return {select:()=>Promise.resolve({data:[payload],error:null})};
   }};
 }};b.load();
 const loaded=await b.g.OurgoalUiHelpers.loadProfile(bid,b.profile.username);
 conditions.push({condition:'users pending 존재·별도 backup 부재·빈 서버 읽기',profileBackupInitiallyAbsent:true,pendingPresent:true,mockReadInducedUpsertCount:b.calls.length,onlyUsersUpsert:b.calls.every(r=>r.kind==='users'),pendingBytesUnchanged:b.store.getItem('ourgoal_save_pending_'+bid)===pendingRaw,displayPendingValue:loaded.displayName===pendingUser.display_name,readState:loaded._saveLoadState.users.remote,newSignupFlag:loaded._isNewSignup,realAuth:0,realDB:0});
 const out={schema:'K18B-independent-selected-critical/1',at:new Date().toISOString(),ownPID:process.pid,scope:'L1 product VM · in-memory component inputs and mocked SDK only; no real E2E',conditions,productPins:files.map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))})),realAuth:0,realHTTP:0,realDB:0,DBFixtureWrites:0,productChanges:0,originalSuitesRepeated:0,Court:null,use:null,effect:null};const file=__dirname+'/selected-critical-raw.json',text=JSON.stringify(out,null,2)+'\n';fs.writeFileSync(file,text,{encoding:'utf8',flag:'wx'});if(fs.readFileSync(file,'utf8')!==text)throw Error('READBACK_FAILED');console.log(JSON.stringify({file,sha256:sha(Buffer.from(text)),ownPID:process.pid,conditions}));
})().catch(e=>{console.error(JSON.stringify({enum:'OWN_COMPONENT_ERROR',errorName:e.name,messageSHA256:sha(Buffer.from(String(e.message))),realAuth:0,realDB:0}));process.exitCode=1;});
