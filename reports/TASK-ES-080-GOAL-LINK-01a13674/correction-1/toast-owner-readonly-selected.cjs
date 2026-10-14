// Explicit VM DOM/computed-style component. Not real pixels; Chrome trace is separate.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),classes=new Set(),listeners={},timers=[],capsMap=new Map(),events=[];let opacity=0,domReady;
const el={textContent:'',classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},getClientRects:()=>[{}],addEventListener:(name,fn)=>{listeners[name]=fn;}};
const context=vm.createContext({console,Number,document:{getElementById:()=>el,addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')domReady=fn;}},OurgoalAppScope:{scope:{}},getComputedStyle:()=>({opacity:String(opacity),display:'block',visibility:'visible'}),setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){}});context.window=context;
vm.runInContext(fs.readFileSync(path.join(root,'js/core/toast-renderer.js'),'utf8'),context,{filename:'js/core/toast-renderer.js'});
assert.equal(capsMap.size,0);context.OurgoalCapabilities={provide:(name,fn)=>capsMap.set(name,fn)};context.OurgoalEvents={emit:(name,value)=>events.push({name,value})};domReady();const read=capsMap.get('ui.toast.state');assert.equal(typeof read,'function');
const observations=[];function record(name){const value=read();observations.push({name,...value});return value;}
assert.equal(record('initial-hidden').active,false);context.OurgoalUiHelpers.toast('component-message');assert.equal(record('show-before-first-paint').active,true);
opacity=1;assert.equal(record('fully-visible').active,true);timers.shift()();opacity=0.4;const fading=record('class-cleared-but-css-fading');assert.equal(fading.shown,false);assert.equal(fading.active,true);
opacity=0;assert.equal(record('fade-ended').active,false);
context.OurgoalUiHelpers.toast('component-replaced-message');opacity=1;el.onclick();opacity=0.2;assert.equal(record('click-dismiss-still-fading').active,true);opacity=0;assert.equal(record('click-fade-ended').active,false);
const result={layer:'production owner in VM with injected computed style; not real Chrome pixel proof',observations,eventCount:events.length,bootstrapBeforeCapabilities:true,newObserverAndTransitionHandlers:false,readCapabilityOnly:true,assertionFailure:null};fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify(result));
