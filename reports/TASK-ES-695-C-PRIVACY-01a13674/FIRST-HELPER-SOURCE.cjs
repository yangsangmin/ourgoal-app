'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),root=path.resolve(__dirname,'../..');
const base='7ce400ad0c883d522a76b18556aedc269356d011',foundationFile=path.join(root,'reports/TASK-ES-695-C-GOAL-01a13674/goal-save-selected.cjs');
const foundation=fs.readFileSync(foundationFile,'utf8'),anchor='async function check(name, fn)';
if(foundation.indexOf(anchor)<0)throw Error('FOUNDATION_BOUNDARY_CHANGED');
const oldBase="base = '87b7fbd0f8530fabe76413757d577da746406471'";
const prefix=foundation.slice(0,foundation.indexOf(anchor));
if(prefix.split(oldBase).length!==2)throw Error('FOUNDATION_BASE_ANCHOR_CHANGED');
const m=new Module(__filename);m.filename=__filename;m.paths=Module._nodeModulePaths(__dirname);
m._compile(prefix.replace(oldBase,"base = '"+base+"'")+ '\nmodule.exports={environment,element};',__filename);
const {environment,element}=m.exports;
const checks=[],failures=[];
function setup(baseline=false){
  const e=environment('manual',baseline),goal={id:'existing-non-uuid-goal',title:'synthetic original',visibility:'theme',category:'etc',milestones:[],createdAt:'2026-10-14T00:00:00Z'};
  e.profile.isGuest=true;e.profile.goals.push(goal);e.L.sb=null;
  const key='ourgoal_goals_backup_'+e.profile.id;e.data.set(key,JSON.stringify([goal]));
  let html='',label=null,button=null;
  Object.defineProperty(e.toast,'innerHTML',{configurable:true,get:()=>html,set:value=>{
    html=value;label=element('privacy-label');label.textContent=value.slice(0,value.indexOf('</span>')).replace(/<[^>]*>/g,'');button=element('btnUndoThemePrivacy');
  }});
  e.toast.ownerDocument=e.scope.document;
  e.toast.querySelector=selector=>selector==='span'?label:selector==='#btnUndoThemePrivacy'?button:null;
  e.L.showUndoPrivacyToast(goal.id);
  const btn=()=>e.toast.querySelector('#btnUndoThemePrivacy'),text=()=>e.toast.querySelector('span').textContent;
  return {...e,goal,key,btn,text,click:()=>btn().onclick({stopPropagation(){}}),stored:()=>JSON.parse(e.data.get(key))[0]};
}
async function check(name,fn){try{checks.push({name,...await fn()});}catch(error){failures.push({name,error:error.name,message:error.message});throw error;}}
(async()=>{try{
  await check('original C1-base privacy path with null SDK changes memory but not existing device goal',async()=>{
    const e=setup(true);await e.click();assert.equal(e.goal.visibility,'private');assert.equal(e.stored().visibility,'theme');assert.equal(e.submissions[0],undefined);assert.ok(e.toasts.at(-1).includes('변경되었어요'));return{source:base,memoryPrivate:true,storedPrivate:false,scope:'actual old callback/core with synthetic guest memory and sb=null'};
  });
  await check('typed guest update with null SDK keeps exact old ID and device privacy without waiting for remote',async()=>{
    const e=setup();await e.click();await e.settle();assert.equal(e.stored().visibility,'private');assert.equal(e.stored().id,e.goal.id);assert.equal(e.profile.goals.length,1);assert.equal(e.submissions.length,1);assert.deepEqual(JSON.parse(JSON.stringify(e.submissions[0])),{deviceFirst:true,kind:'goals',targetId:e.goal.id,operation:'update'});assert.equal(e.results[0].types.goals.device,true);assert.equal(e.results[0].state,'local');assert.equal(e.calls.length,0);assert.ok(e.text().includes('기기에 보관했어요'));assert.ok(!e.text().includes('반영됐어요'));assert.equal(e.btn().disabled,true);assert.equal(e.views.length,1);await e.click();assert.equal(e.submissions.length,1);return{sameID:true,typedUpdate:true,devicePrivate:true,syntheticSDKCalls:0};
  });
  await check('real typed quota failure keeps private choice and same retry button then writes same goal',async()=>{
    const e=setup(),button=e.btn();e.quota(true);await e.click();assert.equal(e.results[0].state,'failed');assert.equal(e.goal.visibility,'private');assert.equal(e.stored().visibility,'theme');assert.equal(e.btn(),button);assert.equal(button.disabled,false);assert.ok(e.text().includes('다시 시도'));assert.ok(!e.text().includes('설정했어요'));assert.equal(e.views.length,0);e.quota(false);await e.click();await e.settle();assert.equal(e.stored().visibility,'private');assert.equal(e.stored().id,e.goal.id);assert.equal(e.profile.goals.length,1);assert.equal(e.submissions.length,2);assert.equal(e.submissions[0].targetId,e.submissions[1].targetId);assert.equal(e.views.length,1);return{failureChoicePreserved:true,retrySameID:true,successOnlyAfterDevice:true};
  });
  await check('duplicate undo while local write pending has one request and no early success',async()=>{
    const e=setup(),before=e.text(),release=e.blockLocal(),p=e.click();assert.equal(e.btn().disabled,true);await e.click();assert.equal(e.submissions.length,1);assert.equal(e.stored().visibility,'theme');assert.equal(e.text(),before);assert.equal(e.views.length,0);release();await p;await e.settle();assert.equal(e.stored().visibility,'private');assert.equal(e.views.length,1);return{requests:1,earlySuccess:0};
  });
  await check('late profile replacement or in-place account mutation suppresses toast and render completion',async()=>{
    for(const mutation of ['profile','account']){const e=setup(),before=e.text(),release=e.blockLocal(),p=e.click();if(mutation==='profile')e.L.state.profile={id:e.profile.id,goals:[],records:[],settings:{}};else e.profile.id='different-synthetic-account';release();await p;await e.settle();assert.equal(e.text(),before);assert.equal(e.toasts.length,0);assert.equal(e.views.length,0);assert.equal(e.btn().disabled,false);}
    return{variants:2,lateUICompletion:0,coreWholeAccountAuthority:null};
  });
  await check('new toast button and dismissed toast are never revived by old undo response',async()=>{
    for(const mutation of ['new-toast','dismissed']){const e=setup(),old=e.btn(),release=e.blockLocal(),p=e.click();let before;if(mutation==='new-toast'){const other={id:'another-existing-goal',title:'other synthetic',visibility:'theme',milestones:[]};e.profile.goals.push(other);e.L.showUndoPrivacyToast(other.id);before=e.text();assert.notEqual(e.btn(),old);}else{e.toast.classList.remove('show');before=e.text();}release();await p;await e.settle();assert.equal(e.text(),before);assert.equal(e.toasts.length,0);assert.equal(e.views.length,0);if(mutation==='new-toast')assert.equal(e.btn().disabled,false);else assert.equal(e.toast.classList.contains('show'),false);}
    return{variants:2,newToastOverwritten:0,toastRevived:0};
  });
  await check('replaced goal object or edited goal while pending does not receive stale success',async()=>{
    for(const mutation of ['object','body']){const e=setup(),before=e.text(),release=e.blockLocal(),p=e.click();if(mutation==='object')e.profile.goals[0]={...e.goal,title:'new object'};else e.goal.title='newer unsaved edit';release();await p;await e.settle();assert.equal(e.text(),before);assert.equal(e.views.length,0);assert.equal(e.toasts.length,0);assert.equal(e.profile.goals[0].title,mutation==='object'?'new object':'newer unsaved edit');}
    return{variants:2,staleSuccess:0};
  });
  await check('missing status support and legacy result stay unconfirmed; stale typed revision has no UI authority',async()=>{
    for(const mutation of ['unsupported','legacy','stale','foreign']){const e=setup(),before=e.text(),save=e.L.saveProfile;if(mutation==='unsupported'){const request=e.scope.OurgoalCapabilities.request.bind(e.scope.OurgoalCapabilities);e.scope.OurgoalCapabilities.request=(name,...args)=>{if(name==='storage.device.status')throw Error('unsupported');return request(name,...args);};}else e.L.saveProfile=async opts=>{const result=await save(opts);if(mutation==='legacy')return undefined;if(mutation==='stale')return{...result,localRevision:result.localRevision-1};return{...result,account:'foreign-synthetic'};};await e.click();await e.settle();assert.equal(e.btn().disabled,false);assert.equal(e.views.length,0);assert.equal(e.goal.visibility,'private');if(mutation==='stale')assert.equal(e.text(),before);else{assert.ok(e.text().includes('확인하지 못'));assert.ok(e.text().includes('다시 시도'));}assert.ok(!e.text().includes('설정했어요'));}
    return{variants:4,falseSuccess:0,unsupportedNotice:'unconfirmed-retry'};
  });
}catch(error){process.exitCode=1;}finally{
  const result={at:new Date().toISOString(),base,scope:'actual old/current confetti + actual typed core/providers; synthetic DOM/memory/guest values, sb=null; no browser/auth/API/DB/E2E',foundation:{file:path.relative(root,foundationFile).replace(/\\/g,'/'),SHA256:sha(Buffer.from(foundation)),execution:'setup prefix only; original C1 check runner never executed; exact single base substitution87→7ce'},helperSHA256:sha(fs.readFileSync(__filename)),productSHA256:sha(fs.readFileSync(path.join(root,'js/core/confetti.js'))),checks,failures,API:0,auth:0,DB:0,browser:0,originalC1ChecksRepeated:0,operating:null,use:null,effect:null,Court:null,ownPID:process.pid};
  const file=path.join(__dirname,'selected-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({file,SHA256:sha(fs.readFileSync(file)),checks:checks.length,failures:failures.length,ownPID:process.pid}));
}})();
