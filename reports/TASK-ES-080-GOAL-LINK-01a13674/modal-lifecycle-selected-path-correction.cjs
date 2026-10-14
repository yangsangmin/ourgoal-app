// Newly added modal lifecycle boundary only. Minimal DOM/VM layer, no browser/API.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),list=[];
function boot(){
 const classes=new Set(),sheet={style:{},innerHTML:''},overlay={classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const nodes={modalOverlay:overlay,modalSheet:sheet};const scope={_modalHistoryPushed:false};
 const context=vm.createContext({console:{warn(){},error(){}},Date,Map,Set,Promise,document:{getElementById:k=>nodes[k],addEventListener(){}},history:{pushState(){},back(){}},OurgoalAppScope:{scope}});context.window=context;
 const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 load('js/core/capabilities.js');load('js/core/event-bus.js');load('js/core/modal-open.js');load('js/core/modal-helper.js');scope.closeModal=context.OurgoalUiHelpers.closeModal;
 const changes=[];context.OurgoalEvents.on('modal:changed',change=>changes.push({state:change.state,reason:change.reason??null,token:change.token}));
 return {context,scope,sheet,overlay,changes,open:context.OurgoalModalOpenKit.openModal,close:scope.closeModal,state:context.OurgoalCapabilities.request('ui.modal.state')};
}
function check(name,fn){try{fn();list.push({name,observed:true});}catch(e){list.push({name,observed:false,error:e.message});}}
check('replacement-observes-old-token-then-new-and-double-close-is-noop',()=>{const b=boot();b.open('one');const first=b.state().token;b.open('two');assert.equal(b.changes[1].token,first);assert.equal(b.changes[1].reason,'replaced');assert.notEqual(b.state().token,first);b.close();b.close();assert.equal(b.changes.length,4);assert.equal(b.state().active,false);});
check('mount-exception-still-active-and-observable-close',()=>{const b=boot();b.open('one',()=>{throw Error('selected-mount-failure');});assert.equal(b.state().active,true);b.close();assert.equal(b.state().active,false);assert.equal(b.changes.at(-1).reason,'dismissed');});
check('outside-close-and-popstate-use-same-owner-boundary',()=>{const b=boot();let popstate; b.context.addEventListener=(event,fn)=>{if(event==='popstate')popstate=fn;};b.context.OurgoalUiHelpers.bindModalPopstateBack();b.open('one');b.overlay.onclick({target:b.overlay,preventDefault(){},stopPropagation(){}});assert.equal(b.state().active,false);b.open('two');popstate({});assert.equal(b.state().active,false);assert.equal(b.changes.filter(c=>c.state==='closed').length,2);});
const result={layer:'production modal-open/helper in minimal VM DOM, not real UI/E2E',observations:list,summary:{count:list.length,observed:list.filter(x=>x.observed).length,failed:list.filter(x=>!x.observed).length}};fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(result));if(result.summary.failed)process.exitCode=1;
