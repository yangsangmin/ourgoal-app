// Selected source/VM component checks. Synthetic DOM is not a real account/UI/E2E result.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='C:/dev/wt/eGoal080-01a13674', observations=[]; const cp=require('child_process'),head='dfb6cac74fb336cab496e113f356875fb2da25fc';
function boot(){
 const timers=new Map();let seq=0,modal={active:false,token:null},feedback=false,opened=0,navigated=0,buttons={};
 const scope={state:{profile:null},escapeHtml:s=>String(s),setTab:tab=>{assert.equal(tab,'goals');navigated++;}};
 const context=vm.createContext({console,Map,Set,WeakMap,Number,Promise,Array,Object,String,Math,setTimeout:(fn,ms)=>{timers.set(++seq,{fn,ms});return seq;},clearTimeout:id=>timers.delete(id),OurgoalAppScope:{scope}});
 const load=file=>vm.runInContext(cp.execFileSync('git',['-C',root,'show',head+':'+file],{encoding:'utf8'}),context,{filename:file});
 load('js/core/capabilities.js');load('js/core/event-bus.js');
 const caps=context.OurgoalCapabilities,events=context.OurgoalEvents;
 let focused=true;
 caps.provide('storage.device.focused',()=>focused,{cell:'core/device-save'});
 caps.provide('records.feedback.state',()=>({active:feedback}),{cell:'records/checkin-feedback'});
 const classes=new Set(), overlay={classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const sheet={style:{},innerHTML:'',querySelector:s=>({addEventListener:(type,fn)=>{buttons[s]=fn;}})};
 context.window=context;context.document={getElementById:id=>id==='modalOverlay'?overlay:id==='modalSheet'?sheet:null};
 load('js/core/modal-open.js');load('js/core/modal-helper.js');scope.closeModal=context.OurgoalUiHelpers.closeModal;
 caps.provide('ui.modal.close',scope.closeModal,{cell:'core/modal'});
 caps.provide('ui.modal',context.OurgoalModalOpenKit.openModal,{cell:'core/modal'});
 load('js/tabs/goals/record-link.js');
 let current;
 const goal={id:'goal-component',title:'피아노 연습',category:'음악',result:{unit:'분'},milestones:[{title:'악보 읽기',result:{unit:'분'}}]};
 const profile={id:'component-account',goals:[goal],records:[]};scope.state.profile=profile;
 function input(id='record-component',text='피아노 20분 연습'){
  const record={id,text};profile.records.unshift(record);current=record;
  return {profile,record,saved:{account:profile.id,kind:'records',recordId:id,state:'local',generation:1,changeId:'component-change',types:{records:{device:true}}},current:()=>current===record};
 }
 function step(){const item=timers.entries().next().value;if(item){timers.delete(item[0]);item[1].fn();}}
 return {context,caps,events,scope,profile,goal,input,step,timers,rank:caps.request('goals.record-link.rank'),offer:caps.request('goals.record-link.offer'),get opened(){return opened;},get navigated(){return navigated;},get modal(){return modal;},click:s=>buttons[s](),setFeedback:v=>{feedback=v;events.emit('record-feedback:changed',{state:v?'opened':'closed'});},setModal:v=>{modal={active:v,token:v?{}:null};events.emit('modal:changed',{state:v?'opened':'closed'});},setFocused:v=>{focused=v;},current:record=>{current=record;}};
}

const b=boot(), c=b.input(); const queued=b.offer(c);b.step();const afterOpen=[...b.timers.values()].map(t=>t.ms);b.click('#recordGoalLinkClose');const afterClose=[...b.timers.values()].map(t=>t.ms);b.step();const afterResidual=[...b.timers.values()].map(t=>t.ms);const result={source:head,layer:'actual event-bus/modal-open/modal-helper/record-link source in synthetic DOM/timer VM only',queued,afterOpen,afterClose,afterResidual,actualPC:null,Court:null};fs.writeFileSync(path.join(__dirname,'GOAL-MODAL-TIMER-FIRST.json'),JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(result));
