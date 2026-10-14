// Current capture handler with explicit component ports. No actual storage/auth/network/DOM claims.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),obs=[];
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function boot(first=true){
 const ai=deferred(),saveGate=deferred(),firstGate=deferred(),elements={};let saveMode='ready',count=0,awards=0,firstShown=0,feedback=[],offers=[],sendCalls=0;
 function el(){return {value:'',disabled:false,innerHTML:'기록',textContent:'',style:{},dataset:{},classList:{add(){},remove(){}},listeners:{},addEventListener(n,fn){this.listeners[n]=fn;},getBoundingClientRect(){return {left:0,width:10,top:0};}};}
 ['captureInput','captureSave','captureCardBox','captureSyncStatus','captureSyncAction'].forEach(k=>elements[k]=el());
 const profile={id:'capture-component-account',settings:{},goals:[{id:'g',title:'피아노 연습',category:'음악',milestones:[]}],records:first?[]:[{id:'prior',text:'이전 원문'}],firstCheckinCelebrated:!first};
 const scope={state:{profile},capInput:elements.captureInput,liveMeta:el(),liveCount:el(),pendingCapturePhoto:null,capturePhotoInput:null,newId:()=>String(++count),nowISO:()=>new Date(0).toISOString(),XP_RULES:{checkin:10},
 saveProfile:async function(options){if(saveMode==='waiting')return saveGate.promise;if(saveMode==='fail')return {state:'failed'};return {account:profile.id,kind:'records',recordId:options.recordId,generation:1,changeId:'change',localRevision:1,state:'local',photoStored:true,types:{records:{device:true}}};},
 awardXP:()=>{awards++;return {leveledUp:false};},maybeGrantStreakFreeze:()=>false,maybeGrantAvatarCraftBonus(){},computeStreakDays:()=>1,dayIndexSinceSignup:()=>0,streakBadgeHtml:()=>'',
 triggerFirstCheckinCelebrationModal:(goal,text,done)=>{firstShown++;firstGate.promise.then(done);},requestAIFeedback:()=>ai.promise,showCheckinFeedbackSheet:(record,value)=>feedback.push({record,value}),sendToNotion:()=>{sendCalls++;}};
 ['toast','renderHomeGrassSummary','updateAppBadge','dispatchFullViewPropagation','triggerHapticFeedback','track','triggerFirstCheerResponse','checkGuestBackupNudge','triggerHaptic','burstConfetti','renderFeedbackSlot','renderRecordFeedbackSlot','renderLevelBadge','showLevelUpBanner','renderDailyQuestBar'].forEach(k=>scope[k]=()=>{});
 const document={getElementById:k=>elements[k]||null,querySelectorAll:()=>[]};
 const context=vm.createContext({console,document,Promise,Date,Map,Set,Number,OurgoalAppScope:{scope},setTimeout:()=>1,clearTimeout(){}});context.window=context;
 const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 load('js/core/capabilities.js');load('js/core/event-bus.js');
 context.OurgoalCapabilities.provide('storage.device.message',()=>'',{cell:'core/device-save'});context.OurgoalCapabilities.provide('storage.device.focused',()=>true,{cell:'core/device-save'});context.OurgoalCapabilities.provide('goals.record-link.offer',c=>offers.push(c),{cell:'goals/record-link'});
 load('js/tabs/records/checkin-capture.js');context.OurgoalRecordsKit.bindCaptureLiveMeta();context.OurgoalRecordsKit.bindCaptureSave();
 function type(text){elements.captureInput.value=text;elements.captureInput.listeners.input();}
 function save(){return elements.captureSave.listeners.click();}
 return {scope,profile,ai,firstGate,saveGate,type,save,offers,feedback,get awards(){return awards;},get firstShown(){return firstShown;},get sendCalls(){return sendCalls;},input:elements.captureInput,button:elements.captureSave,mode:x=>{saveMode=x;}};
}
const turn=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
async function check(name,fn){try{await fn();obs.push({name,observed:true});}catch(e){obs.push({name,observed:false,error:e.message});}}
(async()=>{
 await check('save-failure-no-xp-ai-popup-offer-input-kept',async()=>{const b=boot();b.mode('fail');b.type('피아노를 연습했어요');await b.save();assert.equal(b.awards,0);assert.equal(b.firstShown,0);assert.equal(b.offers.length,0);assert.notEqual(b.input.value,'');});
 await check('pending-device-save-blocks-doubleclick-and-followup',async()=>{const b=boot();b.mode('waiting');b.type('피아노를 연습했어요');const task=b.save();await b.save();assert.equal(b.profile.records.length,1);assert.equal(b.firstShown,0);assert.equal(b.awards,0);b.saveGate.resolve({state:'failed'});await task;assert.equal(b.offers.length,0);});
 await check('ai-before-first-dismiss-waits-for-real-dismiss-port',async()=>{const b=boot();b.type('피아노를 연습했어요');const task=b.save();await turn();b.ai.resolve({verdict:'기존 피드백'});await turn();assert.equal(b.feedback.length,0);assert.equal(b.offers.length,0);b.firstGate.resolve('dismissed');await task;assert.equal(b.feedback.length,1);assert.equal(b.offers.length,1);assert.equal(b.offers[0].current(),true);});
 await check('first-dismiss-before-ai-still-shows-existing-feedback',async()=>{const b=boot();b.type('피아노를 연습했어요');const task=b.save();await turn();b.firstGate.resolve('dismissed');await turn();assert.equal(b.offers.length,0);b.ai.resolve({verdict:'기존 피드백'});await task;assert.equal(b.feedback.length,1);assert.equal(b.offers.length,1);});
 await check('new-draft-while-ai-pending-has-no-late-offer',async()=>{const b=boot(false);b.type('피아노를 연습했어요');const task=b.save();await turn();b.type('새 본문');b.ai.resolve({verdict:'원 기록 결과'});await task;assert.equal(b.offers.length,0);assert.equal(b.input.value,'새 본문');});
 await check('new-record-while-old-ai-pending-keeps-only-current-offer',async()=>{const b=boot(false);b.type('피아노 첫 기록');const first=b.save();await turn();b.type('피아노 둘째 기록');const second=b.save();await turn();b.ai.resolve({verdict:'결과'});await Promise.all([first,second]);assert.equal(b.profile.records.length,3);assert.equal(b.offers.length,1);assert.equal(b.offers[0].record.text,'피아노 둘째 기록');});
 await check('profile-replacement-while-ai-pending-no-late-offer',async()=>{const b=boot(false);b.type('피아노를 연습했어요');const task=b.save();await turn();b.scope.state.profile={...b.profile};b.ai.resolve({verdict:'원 계정 결과'});await task;assert.equal(b.offers.length,0);});
 await check('first-popup-replacement-cancels-offer',async()=>{const b=boot();b.type('피아노를 연습했어요');const task=b.save();await turn();b.ai.resolve({verdict:'기존 피드백'});b.firstGate.resolve('replaced');await task;assert.equal(b.offers.length,0);});
 const result={layer:'actual capture source with injected component ports; not actual storage, AI, browser, account or E2E',observations:obs,summary:{count:obs.length,observed:obs.filter(x=>x.observed).length,failed:obs.filter(x=>!x.observed).length}};
 fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(result));if(result.summary.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
