'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),files=['js/reactions.js','js/helpful-reason.js'];
const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
const tick=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const result={schema:'703-viewer-generation-fixture/1',sourceSHA:hashes,productionCalls:0,scope:'public API in VM with synthetic SDK/accounts, not actual account E2E',checks:[]};
function setup(){
 const ctx={window:{},Promise,console};vm.createContext(ctx);files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
 let profile={id:'account-A',settings:{}},modal=0,closed=0,toasts=0,saves=0,bindModal;
 const deps={getProfile:()=>profile,escapeHtml:s=>s,toast:()=>toasts++,saveProfile:()=>saves++,closeModal:()=>closed++,openModal:(html,fn)=>{modal++;bindModal=fn;}};
 return {ctx,deps,setProfile:p=>{profile=p;},snapshot:()=>({modal,closed,toasts,saves,settings:profile.settings}),bindModal:()=>bindModal};
}
const item={id:'post',userId:'author'},body={querySelectorAll:()=>[],querySelector:()=>null};
function expand(api){let click;const wrap={querySelector:s=>s==='[data-rxadvtoggle]'?{addEventListener:(e,f)=>{click=f;}}:null,querySelectorAll:()=>[],parentNode:body};api.bind({querySelectorAll:()=>[],querySelector:s=>s.startsWith('[data-rxadv=')?wrap:null},[item]);try{click();}catch(e){if(!/document is not defined/.test(e.message))throw e;}}
async function check(name,fn){await fn();result.checks.push({name,observed:true});}
async function main(){
 await check('own advice preserved; foreign row is filtered; transition without init clears raw/count/mine',async()=>{
  const f=setup(),api=f.ctx.window.OurgoalReactions;
  f.deps.sb={rpc:name=>Promise.resolve({data:name==='list_content_advice'?[{target_id:'post',user_id:'account-A',advice_text:'OWN_MARKER'},{target_id:'post',user_id:'foreign',is_mine:true,advice_text:'FOREIGN_MARKER'}]:name==='my_content_reactions'?[{target_id:'post',type:'cheer'}]:[]})};
  api.init(f.deps);api.bind(body,[item]);await tick();expand(api);
  assert.ok(api.advicePanelHtml(item).includes('OWN_MARKER'));assert.ok(!api.advicePanelHtml(item).includes('FOREIGN_MARKER'));
  f.setProfile({id:'account-B',settings:{}});
  assert.ok(!api.advicePanelHtml(item).includes('OWN_MARKER'));assert.equal(Object.keys(api._state().mine).length,0);
 });
 await check('late previous-viewer refresh cannot refill cache even if new-viewer fetch fails',async()=>{
  const f=setup(),api=f.ctx.window.OurgoalReactions,d=deferred();
  f.deps.sb={rpc:name=>name==='list_content_advice'?d.promise:Promise.resolve({data:[]})};api.init(f.deps);api.bind(body,[item]);
  f.setProfile({id:'account-B',settings:{}});api.advicePanelHtml(item);
  f.deps.sb={rpc:()=>Promise.resolve({error:{code:'42501',message:'synthetic new-viewer failure'}})};api.bind(body,[item]);await tick();
  d.resolve({data:[{target_id:'post',user_id:'account-A',advice_text:'LATE_MARKER'}]});await tick();
  assert.equal(api._state().serverOk,null);assert.ok(!api.advicePanelHtml(item).includes('조언 1개'));
 });
 await check('latest refresh generation wins within the same viewer',async()=>{
  const f=setup(),api=f.ctx.window.OurgoalReactions,old=deferred();let calls=0;
  f.deps.sb={rpc:name=>name==='list_content_advice'?(calls++===0?old.promise:Promise.resolve({data:[]})):Promise.resolve({data:[]})};
  api.init(f.deps);api.bind(body,[item]);api.bind(body,[item]);await tick();old.resolve({data:[{target_id:'post',user_id:'account-A',advice_text:'OLD_MARKER'}]});await tick();
  assert.ok(!api.advicePanelHtml(item).includes('조언 1개'));
 });
 await check('late reaction mutation does not alter new-viewer cache or open helpful sheet',async()=>{
  const f=setup(),api=f.ctx.window.OurgoalReactions,d=deferred();let click,opened=0;
  f.ctx.window.OurgoalHelpfulReason.openSheet=()=>opened++;
  f.deps.sb={rpc:name=>name==='react_content'?d.promise:Promise.resolve({data:[]})};api.init(f.deps);
  const btn={dataset:{rx:'helpful',rxid:'post'},addEventListener:(e,fn)=>{click=fn;}};
  api.bind({querySelectorAll:s=>s==='[data-rx]'?[btn]:[],querySelector:()=>null},[item]);await tick();click();f.setProfile({id:'account-B',settings:{}});
  d.resolve({data:{ok:true}});await tick();assert.equal(opened,0);assert.equal(Object.keys(api._state().mine).length,0);
 });
 await check('late summary success and failure cannot open a new-viewer modal',async()=>{
  for(const fail of [false,true]){const f=setup(),api=f.ctx.window.OurgoalHelpfulReason,d=deferred();f.deps.sb={rpc:()=>d.promise};api.init(f.deps);api.openSummary(item);f.setProfile({id:'account-B',settings:{}});if(fail)d.reject(Error('synthetic failure'));else d.resolve({data:{tags:[{tag:'how_to',cnt:1}]}});await tick();assert.equal(f.snapshot().modal,0);assert.equal(api._state().serverOk,null);}
 });
 await check('late save success/schema failure/rejection cannot save fallback or toast/close another viewer',async()=>{
  for(const mode of ['success','schema','reject']){
   const f=setup(),api=f.ctx.window.OurgoalHelpfulReason,d=deferred();f.deps.sb={rpc:()=>d.promise};api.init(f.deps);api.openSheet(item);await tick();let submit;
   const input={value:'private synthetic reason',addEventListener(){}},button={addEventListener:(e,fn)=>{submit=fn;}};
   f.bindModal()({querySelector:s=>s==='#hrOk'?button:s==='#hrText'?input:s==='#hrHint'?{}:s.startsWith('input')?{value:'how_to'}:{addEventListener(){}},querySelectorAll:()=>[]});submit();
   f.setProfile({id:'account-B',settings:{}});if(mode==='reject')d.reject(Error('synthetic failure'));else d.resolve(mode==='schema'?{error:{code:'PGRST202'}}:{data:{quality_pass:true}});await tick();
   assert.equal(f.snapshot().closed,0);assert.equal(f.snapshot().toasts,0);assert.equal(f.snapshot().saves,0);assert.deepEqual(f.snapshot().settings,{});
  }
 });
 await check('delayed sheet initialization cannot open after a viewer transition',async()=>{
  const f=setup(),api=f.ctx.window.OurgoalHelpfulReason;api.init(f.deps);api.openSheet(item);f.setProfile({id:'account-B',settings:{}});await tick();assert.equal(f.snapshot().modal,0);
 });
 fs.writeFileSync(path.join(__dirname,'ui-account-result.json'),JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify(result));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
