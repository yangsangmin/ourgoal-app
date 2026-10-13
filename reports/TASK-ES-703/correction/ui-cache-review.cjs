'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),src=fs.readFileSync(path.join(root,'js/reactions.js'),'utf8');
const context={window:{},Promise,console};vm.createContext(context);vm.runInContext(src,context);
let profile={id:'synthetic-account-A',settings:{}};
const marker='SYNTHETIC_ACCOUNT_A_PRIVATE_ADVICE';
const item={id:'synthetic-post',userId:'synthetic-author'};
const body={querySelectorAll:()=>[],querySelector:()=>null};
const api=context.window.OurgoalReactions;
const deps={getProfile:()=>profile,escapeHtml:s=>s,sb:{rpc:name=>Promise.resolve({error:null,data:name==='list_content_advice'?[{id:1,target_id:item.id,user_id:profile.id,advice_text:marker,is_mine:true,created_at:'2026-10-13T00:00:00Z'}]:[]})}};
async function main(){
 api.init(deps);api.bind(body,[item]);await new Promise(r=>setImmediate(r));
 const a=api.advicePanelHtml(item);
 profile={id:'synthetic-account-B',settings:{}};
 api.init({...deps,sb:{rpc:()=>Promise.resolve({error:{code:'42501',message:'synthetic denied'},data:null})}});
 const b=api.advicePanelHtml(item);
 api.bind(body,[item]);await new Promise(r=>setImmediate(r));
 const afterError=api.advicePanelHtml(item);
 // The panel starts collapsed. Count/toggle itself proves former-account row remains in display state.
 const out={sourceSHA:crypto.createHash('sha256').update(src).digest('hex'),scope:'isolated public VM method and synthetic SDK, not actual account E2E',productionCalls:0,accountAOwnPanelCountShown:a.includes('조언 1개'),accountBPreviousAccountPanelCountShown:b.includes('조언 1개'),accountBAfterFailedRefreshPreviousPanelCountShown:afterError.includes('조언 1개'),cacheStateInvalidatedByInit:!b.includes('조언 1개')};
 // Expand through the public bind handler for a definitive raw rendering counterexample.
 let toggle;
 const wrap={querySelector:()=>({addEventListener:(event,fn)=>{toggle=fn}}),querySelectorAll:()=>[],parentNode:body};
 const body2={querySelectorAll:()=>[],querySelector:selector=>selector.startsWith('[data-rxadv=')?wrap:null};
 api.bind(body2,[item]);if(toggle){try{toggle();}catch(e){/* DOM patch requires browser, expanded flag was set first. */}}
 out.accountBPreviousRawMarkerRendered=api.advicePanelHtml(item).includes(marker);
 fs.writeFileSync(path.join(__dirname,'ui-cache-result.json'),JSON.stringify(out,null,2)+'\n','utf8');console.log(JSON.stringify(out));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
