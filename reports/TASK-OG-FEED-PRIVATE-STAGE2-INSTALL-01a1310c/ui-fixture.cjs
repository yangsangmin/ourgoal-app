'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');let assertions=0;const check=(v,why)=>{assert.ok(v,why);assertions++;};
const context={window:{},Promise,console};vm.createContext(context);for(const file of ['js/reactions.js','js/helpful-reason.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
let html='';const profile={id:'fixture-own',settings:{feedReactionsV2:{post:{adviceList:[{text:'own local advice',visibility:'everyone',createdAt:'2026-10-13T00:00:00Z'}]}}}};
context.window.OurgoalReactions.init({getProfile:()=>profile,escapeHtml:s=>s});
const bindings={},text={value:'fixture private advice',addEventListener(){}},ok={disabled:false,addEventListener:(e,f)=>{bindings[e]=f}},cancel={addEventListener(){}};
let savedBody=null;
const deps={getProfile:()=>profile,escapeHtml:s=>s,openModal:(s,bind)=>{html=s;if(bind)bind({querySelector:n=>n==='#rxAdvText'?text:n==='#rxAdvOk'?ok:cancel});},closeModal(){},sb:{rpc:(name,input)=>{savedBody={name,input};return Promise.resolve({data:{active:true},error:null});}},rerenderFeed(){},toast(){}};
context.window.OurgoalReactions.init(deps);
const adviceButton={dataset:{rx:'advice',rxid:'post'},disabled:false,addEventListener:(e,f)=>{adviceButton.click=f;}};
const body={querySelectorAll:s=>s==='[data-rx]'?[adviceButton]:[],querySelector:()=>null};
context.window.OurgoalReactions.bind(body,[{id:'post',userId:'fixture-other'}]);
adviceButton.click();
check(html.includes('나만 볼 수 있어요'),'private advice modal text');check(!html.includes('name="rxAdvVis"'),'public visibility choice removed');
bindings.click();
async function main(){
 await new Promise(r=>setImmediate(r));check(savedBody?.name==='react_content','actual public handler still reaches legacy RPC');check(savedBody.input.p_advice_visibility==='author_only','legacy payload preserved');
 let response={tags:[{tag:'how_to',cnt:2}],texts:[{tag:'other',text:'FOREIGN_PRIVATE_FIXTURE_MARKER',created_at:'2026-10-13'}]};
 context.window.OurgoalHelpfulReason.init({getProfile:()=>profile,escapeHtml:s=>s,sb:{rpc:()=>Promise.resolve({data:response,error:null})},openModal:s=>{html=s;}});
 context.window.OurgoalHelpfulReason.openSummary({id:'post'});await new Promise(r=>setImmediate(r));
 check(html.includes('종류별 개수만'),'author summary aggregate explanation');check(html.includes('구체적인 방법'),'aggregate tags render');check(!html.includes('FOREIGN_PRIVATE_FIXTURE_MARKER'),'old response raw texts cannot render');
 const button=context.window.OurgoalHelpfulReason.authorButtonHtml({id:'post'},2);check(button.includes('이유 종류별 개수 보기'),'summary trigger explains aggregate');
 const source=fs.readFileSync(path.join(root,'js/reactions.js'),'utf8');check(!source.includes('모두에게 공개'),'no visibility publication menu');check(!source.includes('이 글을 보는 모두에게 보여요'),'no misleading public choice');
 const result={schema:'feed-private-ui-fixture/1',PID:process.pid,assertions,failures:0,scope:'public methods/handlers in isolated VM; injected SDK response and DOM shim, not browser/server/account use',serverCalls:0,productUse:null};fs.writeFileSync(path.join(__dirname,'ui-fixture-result.json'),JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(result));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
