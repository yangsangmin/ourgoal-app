// Selected source/VM component checks. Synthetic DOM is not a real account/UI/E2E result.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), observations=[];
function boot(){
 const timers=new Map();let seq=0,modal={active:false,token:null},feedback=false,toast=false,opened=0,navigated=0,buttons={};
 const scope={state:{profile:null},escapeHtml:s=>String(s),setTab:tab=>{assert.equal(tab,'goals');navigated++;}};
 const context=vm.createContext({console,Map,Set,WeakMap,Number,Promise,Array,Object,String,Math,setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),OurgoalAppScope:{scope}});
 const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 load('js/core/capabilities.js');load('js/core/event-bus.js');
 const caps=context.OurgoalCapabilities,events=context.OurgoalEvents;
 let focused=true;
 caps.provide('storage.device.focused',()=>focused,{cell:'core/device-save'});
 caps.provide('ui.toast.state',()=>({active:toast}),{cell:'core/toast-renderer'});
 caps.provide('records.feedback.state',()=>({active:feedback}),{cell:'records/checkin-feedback'});
 caps.provide('ui.modal.state',()=>modal,{cell:'core/modal-open'});
 caps.provide('ui.modal.close',()=>{const token=modal.token;modal={active:false,token:null};events.emit('modal:changed',{state:'closed',token,reason:'dismissed'});},{cell:'core/modal'});
 caps.provide('ui.modal',(html,mount)=>{opened++;modal={active:true,token:{}};buttons={};mount({querySelector:s=>({addEventListener:(type,fn)=>{buttons[s]=fn;}})});},{cell:'core/modal'});
 load('js/tabs/goals/record-link.js');
 let current;
 const goal={id:'goal-component',title:'피아노 연습',category:'음악',result:{unit:'분'},milestones:[{title:'악보 읽기',result:{unit:'분'}}]};
 const profile={id:'component-account',goals:[goal],records:[]};scope.state.profile=profile;
 function input(id='record-component',text='피아노 20분 연습'){
  const record={id,text};profile.records.unshift(record);current=record;
  return {profile,record,saved:{account:profile.id,kind:'records',recordId:id,state:'local',generation:1,changeId:'component-change',types:{records:{device:true}}},current:()=>current===record};
 }
 function step(){const item=timers.entries().next().value;if(item){timers.delete(item[0]);item[1]();}}
 return {context,caps,events,scope,profile,goal,input,step,rank:caps.request('goals.record-link.rank'),offer:caps.request('goals.record-link.offer'),get opened(){return opened;},get navigated(){return navigated;},get modal(){return modal;},click:s=>buttons[s](),setToast:v=>{toast=v;events.emit('toast:changed',{active:v});},setFeedback:v=>{feedback=v;events.emit('record-feedback:changed',{state:v?'opened':'closed'});},setModal:v=>{modal={active:v,token:v?{}:null};events.emit('modal:changed',{state:v?'opened':'closed'});},setFocused:v=>{focused=v;},current:record=>{current=record;}};
}
function check(name,fn){if(process.argv[3] && name!==process.argv[3])return;try{const data=fn();observations.push({name,observed:true,data:data??null});}catch(error){observations.push({name,observed:false,error:{name:error.name,message:error.message}});}}
check('title-and-declared-unit',()=>{const b=boot(),c=b.input();const r=b.rank(b.profile,c.record);assert.equal(r.goal,b.goal);assert.equal(r.evidence.unit,true);return r.evidence;});
check('milestone-plus-unit',()=>{const b=boot(),c=b.input('r','악보 20분');const r=b.rank(b.profile,c.record);assert.equal(r.goal,b.goal);assert.equal(r.evidence.title,0);assert.equal(r.evidence.milestone,1);return r.evidence;});
check('category-unit-alone-no-offer',()=>{const b=boot(),c=b.input('r','음악 20분');assert.equal(b.rank(b.profile,c.record),null);});
check('equal-goals-ambiguous',()=>{const b=boot(),c=b.input();b.profile.goals.push({...b.goal,id:'other'});assert.equal(b.rank(b.profile,c.record),null);});
check('recent-explicit-goal-only-supports-current-words',()=>{const b=boot();b.profile.records.push({id:'old',goalId:b.goal.id,text:'피아노 10분'});const c=b.input(),r=b.rank(b.profile,c.record);assert.equal(r.evidence.recent,true);assert.equal(b.rank(b.profile,{text:'좋은 하루'}),null);return r.evidence;});
check('device-failure-and-foreign-receipt-no-queue',()=>{const b=boot(),c=b.input();c.saved.types.records.device=false;assert.equal(b.offer(c).reason,'device-unverified');c.saved.types.records.device=true;c.saved.account='different';assert.equal(b.offer(c).reason,'device-unverified');b.step();assert.equal(b.opened,0);});
check('duplicate-and-both-popup-owners',()=>{const b=boot(),c=b.input();b.setFeedback(true);b.setModal(true);assert.equal(b.offer(c).offered,true);assert.equal(b.offer(c).reason,'duplicate');b.step();assert.equal(b.opened,0);b.setModal(false);b.step();assert.equal(b.opened,0);b.setFeedback(false);b.step();assert.equal(b.opened,1);});
check('repeat-dismiss-skips-next-distinct-records',()=>{const b=boot();b.offer(b.input('r0'));b.step();b.click('#recordGoalLinkClose');assert.equal(b.offer(b.input('r1')).reason,'dismissed-recently');assert.equal(b.offer(b.input('r2')).reason,'dismissed-recently');assert.equal(b.offer(b.input('r3')).offered,true);b.step();assert.equal(b.opened,2);});
check('account-replaced-before-opening',()=>{const b=boot();b.offer(b.input());b.scope.state.profile={...b.profile};b.step();assert.equal(b.opened,0);});
check('record-replaced-before-opening',()=>{const b=boot(),c=b.input();b.offer(c);b.profile.records[0]={...c.record};b.step();assert.equal(b.opened,0);});
check('draft-currentness-changed-before-opening',()=>{const b=boot();b.offer(b.input());b.current(null);b.step();assert.equal(b.opened,0);});
check('focus-replaced-before-navigation',()=>{const b=boot();b.offer(b.input());b.step();b.setFocused(false);b.click('#recordGoalLinkGo');assert.equal(b.navigated,0);b.step();assert.equal(b.modal.active,false);});
check('explicit-navigation-does-not-assign-or-mutate',()=>{const b=boot(),c=b.input(),before=JSON.stringify(b.profile);b.offer(c);b.step();b.click('#recordGoalLinkGo');assert.equal(b.navigated,1);assert.equal(JSON.stringify(b.profile),before);assert.equal(b.offer(b.input('r-next')).offered,true);});
check('goal-replaced-before-display',()=>{const b=boot();b.offer(b.input());b.profile.goals[0]={...b.goal};b.step();assert.equal(b.opened,0);});
check('copied-record-category-does-not-imply-relevance',()=>{const b=boot(),c=b.input('r','장보기');c.record.category=b.goal.category;assert.equal(b.rank(b.profile,c.record),null);});
check('shared-unit-goals-and-short-common-word-stay-ambiguous',()=>{const b=boot(),c=b.input('r','오늘 10분 실천 완료');b.profile.goals=[{id:'g1',title:'오늘 운동',result:{unit:'분'}},{id:'g2',title:'매일 독서',result:{unit:'분'}}];assert.equal(b.rank(b.profile,c.record),null);});
check('korean-substring-is-not-a-word-match',()=>{const b=boot();b.profile.goals=[{id:'g',title:'운동',category:'운동'}];assert.equal(b.rank(b.profile,{text:'운동화 샀다'}),null);b.profile.goals[0].title='독서';assert.equal(b.rank(b.profile,{text:'독서실 청소'}),null);});
check('korean-particle-keeps-clear-match',()=>{const b=boot(),c=b.input('r','피아노를 연습했어요');assert.equal(b.rank(b.profile,c.record).goal,b.goal);});
check('goal-title-change-and-unsafe-title-are-not-current-target',()=>{const b=boot();b.offer(b.input());b.goal.title='다른 목표';b.step();assert.equal(b.opened,0);b.goal.title={};assert.equal(b.rank(b.profile,{text:'피아노'}),null);});
check('toast-owner-busy-blocks-until-visible-and-fade-end',()=>{const b=boot(),c=b.input();b.setToast(true);b.offer(c);b.step();assert.equal(b.opened,0);b.events.emit('toast:changed',{active:true,shown:false,opacity:0.2});b.step();assert.equal(b.opened,0);b.setToast(false);b.step();assert.equal(b.opened,1);});
const result={layer:'selected production source in VM; synthetic view/storage identities; not guest UI, account, server, or E2E',observations,summary:{count:observations.length,observed:observations.filter(x=>x.observed).length,failed:observations.filter(x=>!x.observed).length}};
const out=process.argv[2];if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(result));if(result.summary.failed)process.exitCode=1;
