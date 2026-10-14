'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), cp = require('node:child_process');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..'), base = '87b7fbd0f8530fabe76413757d577da746406471';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const product = 'js/tabs/goals/new-goal-modal.js', confetti = 'js/core/confetti.js';
const original = file => cp.execFileSync('git', ['-c','core.longpaths=true','-c','core.autocrlf=false','-C',root,'show',base + ':' + file], {encoding:'utf8'});
const sourceFiles = ['js/core/ui-helpers.js','js/core/capabilities.js','js/account-isolation.js','js/core/local-keep.js','js/core/device-save.js','js/core/home-cockpit.js',confetti,product];
const plain = value => JSON.parse(JSON.stringify(value));
const checks = [], failures = [];
function element(id, value = '') {
  const events = {}, classes = new Set();
  return {id,value,checked:false,disabled:false,isConnected:true,innerHTML:'',textContent:'',dataset:{},
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
    addEventListener:(event, fn)=>{(events[event] ||= []).push(fn);},
    fire:async(event, extra = {})=>{for(const fn of events[event] || []) await fn(extra);},
    focus(){}, querySelector(){return null;}, events};
}
function environment(mode, baseline = false) {
  const data = new Map(), calls = [], toasts = [], tracked = [], views = [], locks = new Map();
  let sequence = 0, localGate = null, response = async payload=>({status:200,data:payload}), quota = false;
  const profile = {id:'synthetic-account',username:'synthetic',displayName:'synthetic',records:[],goals:[],settings:{saveSync:{timeoutMs:25,retryMs:300000,maxAttempts:1}}};
  const sheet = element('modalSheet'), overlay = element('modalOverlay'), toast = element('toast'), undo = element('btnUndoThemePrivacy');
  const nodes = new Map([['modalSheet',sheet],['modalOverlay',overlay],['toast',toast]]);
  toast.querySelector = selector=>selector === '#btnUndoThemePrivacy' ? undo : null;
  const L = {state:{profile}, newId:()=> 'draft-' + (++sequence), uid:prefix=>prefix + '-' + (++sequence), nowISO:()=> '2026-10-14T07:00:00Z',
    TOPICS:{study:{icon:'',label:'study'}},GOAL_TEMPLATES:{etc:{icon:'',label:'etc'}}, templateMilestones:()=>[],
    categoryPickerHtml:()=>'',wireCategoryPicker(_s,_id,ref){ref.value='study/local';},dDay:()=>'',isModalDismissCooldown:()=>false,
    fbBotBubbleHtml:s=>s,toast:s=>toasts.push(s),trackGoalCreated:(_goal,source)=>tracked.push(source),
    saveLocalSettings(){},loadLocalSettings:()=>({}),getAttribution:()=>({}),track(){},
    dispatchFullViewPropagation:(_event,{goalId})=>views.push(goalId),renderAll:()=>views.push('all')};
  const store = {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{if(quota && k.startsWith('ourgoal_goals_backup_'))throw Error('QuotaExceededError');data.set(k,String(v));},removeItem:k=>data.delete(k)};
  const scope = {window:null,module:{exports:{}},console:{warn(){},error(){}},OurgoalAppScope:{scope:L},localStorage:store,
    document:{getElementById:id=>nodes.get(id)||null},navigator:{onLine:true,locks:{request:(name, fn)=>{
      const p=(locks.get(name)||Promise.resolve()).then(async()=>{if(name.startsWith('ourgoal-save-') && localGate){const gate=localGate;localGate=null;await gate;}return fn();});locks.set(name,p.catch(()=>{}));return p;
    }}},setTimeout:(fn,ms)=>ms>=1000?0:setTimeout(fn,ms),clearTimeout,AbortController,Promise,Map,WeakMap,Set,JSON,Date,Math,Number,
    addEventListener(){},OurgoalEvents:{emit(){}},OurgoalSanctuaryV3:{render:tab=>views.push(tab)}};
  scope.window=scope;
  const context=vm.createContext(scope);
  function load(file, old = false){vm.runInContext(old?original(file):fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
  for(const file of sourceFiles.slice(0,6))load(file);
  L.escapeHtml=scope.OurgoalUiHelpers.escapeHtml;
  L.sb={auth:{getSession:async()=>({data:{session:{user:{id:profile.id}}}})},from:table=>({upsert:payload=>{
    calls.push({table});const promise=Promise.resolve().then(()=>response(plain(payload)));promise.select=()=>promise;promise.abortSignal=()=>promise;return promise;
  }})};
  const typedSave=scope.OurgoalUiHelpers.saveProfile;
  const submissions=[],results=[];
  L.saveProfile=async opts=>{submissions.push(opts);const saved=await typedSave(opts);results.push(saved);return saved;};
  L.openModal=(html, mount)=>{
    overlay.classList.add('active');sheet.innerHTML=html;sheet.fields=[];sheet.children=new Map();
    for(const match of html.matchAll(/<(input|textarea|select)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
      const raw=match[0],node=element(match[2],(/value="([^"]*)"/.exec(raw)||[])[1]||'');
      if(node.id==='mGoalVis')node.value='theme';sheet.fields.push(node);sheet.children.set('#'+node.id,node);
    }
    for(const match of html.matchAll(/<button\b[^>]*\bid="([^"]+)"[^>]*>/g))sheet.children.set('#'+match[1],element(match[1]));
    for(const match of html.matchAll(/\bid="([^"]+)"/g))if(!sheet.children.has('#'+match[1]))sheet.children.set('#'+match[1],element(match[1]));
    sheet.querySelector=selector=>sheet.children.get(selector)||null;
    sheet.querySelectorAll=selector=>selector==='input,textarea,select'?sheet.fields:[];
    if(mount)mount(sheet);
  };
  L.closeModal=()=>{overlay.classList.remove('active');};
  load(confetti,baseline);L.showUndoPrivacyToast=scope.OurgoalUiHelpers.showUndoPrivacyToast;
  load(product,baseline);
  const show=()=>{if(mode==='manual')scope.OurgoalGoalsKit.showNewGoalManualForm();else scope.OurgoalGoalsKit.showNewGoalReviewStep({title:'synthetic goal',topicMajor:'study',topicMinor:'local',milestones:[]});};
  show();
  if(mode==='manual')sheet.querySelector('#mGoalTitle').value='synthetic goal';
  const selector=mode==='manual'?'#mSave':'#ngApplyBtn';
  const title=()=>sheet.querySelector(mode==='manual'?'#mGoalTitle':'#ngTitle');
  return {L,scope,profile,sheet,overlay,toast,undo,data,calls,toasts,tracked,views,submissions,results,show,title,
    click:()=>sheet.querySelector(selector).fire('click'),button:()=>sheet.querySelector(selector),
    blockLocal(){let release;localGate=new Promise(r=>release=r);return release;},quota:value=>quota=value,
    response:fn=>response=fn,settle:async()=>{await Promise.all(results.map(r=>r.whenSettled));},
    replaceWindow:()=>L.openModal('<input id="other"><button id="otherSave"></button>',null)};
}
async function check(name, fn){try {checks.push({name,...await fn()});}catch(error){failures.push({name,error:error.name,message:error.message});throw error;}}
(async()=>{try{
  await check('original two consumers close and track despite returned failed result', async()=>{
    for(const mode of ['manual','template']){const e=environment(mode,true);e.L.saveProfile=async()=>({state:'failed',types:{goals:{device:false}}});await e.click();assert.equal(e.overlay.classList.contains('active'),false);assert.equal(e.tracked.length,1);}
    return {modes:2,source:base,scope:'original consumer source with injected failure; not core/native'};
  });
  for(const mode of ['manual','template']){
    await check(mode+' actual typed quota failure preserves input/window and retries same ID with one pending target',async()=>{
      const e=environment(mode),raw=e.title().value;e.quota(true);await e.click();assert.equal(e.results[0].state,'failed');assert.equal(e.overlay.classList.contains('active'),true);assert.equal(e.title().value,raw);assert.equal(e.button().disabled,false);assert.equal(e.calls.length,0);assert.equal(e.tracked.length,0);assert.equal(e.views.length,0);
      const id=e.profile.goals[0].id;e.quota(false);e.response(async()=>({status:500,error:{message:'synthetic temporary'}}));await e.click();await e.settle();assert.equal(e.profile.goals.length,1);assert.equal(e.profile.goals[0].id,id);assert.equal(e.submissions[0].targetId,id);assert.equal(e.submissions[1].targetId,id);assert.equal(e.submissions[1].kind,'goals');assert.equal(e.overlay.classList.contains('active'),false);assert.equal(e.tracked.length,1);assert.equal(JSON.parse(e.data.get('ourgoal_save_pending_'+e.profile.id)).kindData.goals.entries[id].generation,1);
      const notice=mode==='manual'?e.toast.innerHTML:e.toasts.at(-1);assert.ok(/보관|올리는 중/.test(notice));if(mode==='manual')assert.equal(typeof e.undo.onclick,'function');
      return {failedInputPreserved:true,stableID:true,targets:1,undo:mode==='manual'?true:null,realHTTP:null};
    });
  }
  await check('duplicate click locks before local confirmation and closes without waiting for remote result',async()=>{
    const e=environment('manual'),release=e.blockLocal();e.response(()=>new Promise(()=>{}));const first=e.click();assert.equal(e.button().disabled,true);await e.click();assert.equal(e.submissions.length,1);assert.equal(e.overlay.classList.contains('active'),true);release();await first;assert.equal(e.button().disabled,false);assert.equal(e.overlay.classList.contains('active'),false);assert.equal(e.results[0].types.goals.device,true);assert.notEqual(e.results[0].state,'confirmed');await e.settle();return {submissions:1,deviceBeforeRemote:true};
  });
  await check('profile replacement and in-place account change suppress old completion',async()=>{
    for(const mutation of ['replace','id']){const e=environment('manual'),release=e.blockLocal(),p=e.click();if(mutation==='replace')e.L.state.profile={id:'other-synthetic',goals:[],records:[],settings:{}};else e.profile.id='other-synthetic';release();await p;assert.equal(e.tracked.length,0);assert.equal(e.toasts.length,0);assert.equal(e.views.length,0);assert.equal(e.overlay.classList.contains('active'),true);await e.settle();}
    return {variants:2,oldCompletion:0};
  });
  await check('reused modal sheet with replaced button and dismissed overlay reject late closure',async()=>{
    for(const mutation of ['replace','dismiss']){const e=environment('template'),release=e.blockLocal(),p=e.click();if(mutation==='replace')e.replaceWindow();else e.overlay.classList.remove('active');release();await p;await e.settle();assert.equal(e.tracked.length,0);assert.equal(e.toasts.length,0);assert.equal(e.views.length,0);if(mutation==='replace')assert.equal(e.overlay.classList.contains('active'),true);}
    return {variants:2,oldClosure:0};
  });
  await check('edited draft stays open and same window updates its stable target on next save',async()=>{
    const e=environment('template'),release=e.blockLocal(),p=e.click();e.title().value='new synthetic input';await e.sheet.fire('input');release();await p;await e.settle();assert.equal(e.overlay.classList.contains('active'),true);assert.equal(e.title().value,'new synthetic input');assert.equal(e.tracked.length,1);const id=e.profile.goals[0].id;await e.click();await e.settle();assert.equal(e.submissions[1].operation,'update');assert.equal(e.profile.goals.length,1);assert.equal(e.profile.goals[0].id,id);assert.equal(e.profile.goals[0].title,'new synthetic input');assert.equal(e.tracked.length,1);assert.equal(e.overlay.classList.contains('active'),false);return {stableID:true,creationTracking:1};
  });
  await check('legacy/foreign result and newer local revision cannot trigger current success',async()=>{
    for(const variant of ['legacy','foreign','revision']){const e=environment('manual'),save=e.L.saveProfile;e.L.saveProfile=async opts=>{const r=await save(opts);if(variant==='legacy')return undefined;if(variant==='foreign')return {...r,account:'other-synthetic'};const status=e.scope.OurgoalCapabilities.request('storage.device.status')(r.account,r.targetId,'goals');return {...r,localRevision:status.localRevision-1};};await e.click();await e.settle();assert.equal(e.overlay.classList.contains('active'),true);assert.equal(e.tracked.length,0);assert.equal(e.views.length,0);assert.equal(e.title().value,'synthetic goal');assert.ok(e.toasts.at(-1).includes('저장하지 못했어요'));}
    return {variants:3,falseCompletion:0};
  });
  await check('privacy optional message escapes text and leaves original undo/default and confirmed goal path',async()=>{
    const e=environment('manual');e.L.showUndoPrivacyToast('absent','<script>synthetic</script>');assert.ok(e.toast.innerHTML.includes('&lt;script&gt;'));assert.ok(!e.toast.innerHTML.includes('<script>'));assert.equal(typeof e.undo.onclick,'function');e.L.showUndoPrivacyToast('absent');assert.ok(e.toast.innerHTML.includes('🏷️ 같은 테마 러너에게만 공유돼요'));await e.click();await e.settle();const saved=e.results[0];assert.equal(saved.state,'confirmed');assert.equal(e.scope.OurgoalCapabilities.request('storage.device.message')(saved,'목표를 만들었어요'),'목표를 만들었어요 · 반영됐어요');assert.equal(e.profile.goals[0].visibility,'theme');return {escape:true,defaultPreserved:true,syntheticReturnedRowsConfirmed:true};
  });
}catch(error){process.exitCode=1;}finally{
  const result={at:new Date().toISOString(),base,scope:'actual product IIFEs and typed device/core providers; synthetic DOM, memory storage, account and SDK responses only; no browser/auth/HTTP/DB/E2E',sourceFiles:sourceFiles.map(file=>({file,SHA256:sha(fs.readFileSync(path.join(root,file)))})),helperSHA256:sha(fs.readFileSync(__filename)),checks,failures,API:0,auth:0,HTTP:0,realDB:0,browser:0,operating:null,use:null,effect:null,Court:null,ownPID:process.pid};
  const file=path.join(__dirname,'selected-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({file,SHA256:sha(fs.readFileSync(file)),checks:checks.length,failures:failures.length,ownPID:process.pid}));
}})();
