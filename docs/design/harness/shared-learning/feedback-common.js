'use strict';
const {fs,path,json,hashFile,inside,safeId,stable}=require('./common');
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const text=v=>typeof v==='string'&&v.trim().length>0&&v.length<=512;
function storeRoot(options) {
  const registry=json(path.join(options.registryRoot,'registry.json'));
  const root=path.resolve(options.eventsRoot||options.storeRoot||registry.sharedStoreRoot);
  const rel=path.relative(path.resolve(options.repoRoot),root);
  const local=rel!=='..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel);
  if(!local&&path.relative(path.resolve(registry.sharedStoreRoot),root)!=='')throw Error('FEEDBACK_STORE_OUTSIDE_ALLOWED_ROOT');
  if(fs.existsSync(root)&&path.relative(root,fs.realpathSync(root))!=='')throw Error('FEEDBACK_STORE_SYMLINK');
  return root;
}
function loadEvents(options) {
  const root=storeRoot(options),entries=[];
  if(!fs.existsSync(root))return entries;
  if(fs.existsSync(path.join(root,'.collect.lock')))throw Error('FEEDBACK_STORE_WRITING_RETRY');
  for(const task of fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory())) {
    const folder=inside(root,path.join(root,task.name));
    for(const name of fs.readdirSync(folder).filter(n=>n.endsWith('.json')&&!n.endsWith('.pending.json'))) {
      const file=inside(root,path.join(folder,name));
      if(fs.lstatSync(path.join(folder,name)).isSymbolicLink())throw Error('FEEDBACK_STORE_SYMLINK');
      const event=json(file),eventSha256=hashFile(file);
      if(!event.eventId||!event.taskId||!Array.isArray(event.lessonCandidates))continue;
      const pending=path.join(folder,safeId(event.eventId)+'.pending.json');
      // Legacy events stay discoverable; typed feedback must have its collect receipt.
      if(event.feedback&&(!fs.existsSync(pending)||json(inside(root,pending)).eventSha256!==eventSha256))throw Error('FEEDBACK_EVENT_RECEIPT_MISMATCH');
      entries.push({file,event,eventSha256});
    }
  }
  if(fs.existsSync(path.join(root,'.collect.lock')))throw Error('FEEDBACK_STORE_WRITING_RETRY');
  return entries;
}
function referencedEvent(ref,options) {
  if(!object(ref)||!hash(ref.eventSha256))throw Error('FEEDBACK_EVENT_REF_REQUIRED');
  const root=storeRoot(options),file=inside(root,path.join(root,safeId(ref.taskId),safeId(ref.eventId)+'.json'));
  if(hashFile(file)!==ref.eventSha256)throw Error('FEEDBACK_EVENT_REF_SHA');
  const event=json(file);
  if(event.taskId!==ref.taskId||event.eventId!==ref.eventId)throw Error('FEEDBACK_EVENT_REF_ID');
  const pending=json(inside(root,path.join(root,safeId(ref.taskId),safeId(ref.eventId)+'.pending.json')));
  if(event.feedback&&pending.eventSha256!==ref.eventSha256)throw Error('FEEDBACK_EVENT_RECEIPT_MISMATCH');
  return {file,event,eventSha256:ref.eventSha256};
}
function checkedEnvelope(entry,e,options) {
  try {
    const executionRoot=entry.event.feedback?.executionRoot;
    if(!executionRoot||(options.readRoots||[options.repoRoot]).every(r=>{try{inside(r,executionRoot);return false;}catch{return true;}}))return {valid:false,reason:'origin-read-root-unavailable'};
    if(e.status!=='measured'||!hash(e.rawSha256))return {valid:false,reason:'unmeasured'};
    const file=inside(executionRoot,e.rawPath);
    if(hashFile(file)!==e.rawSha256)return {valid:false,reason:'raw-sha-changed'};
    const value=json(file);
    if(value.command!==e.command||stable(value.args)!==stable(e.args)||value.inputProductSha!==e.inputProductSha||value.exitCode!==e.exitCode||value.scope!==e.scope||value.sourceTask!==e.sourceTask||value.measuredAt!==e.measuredAt)return {valid:false,reason:'raw-input-binding-changed'};
    return {valid:true,value};
  }catch{return {valid:false,reason:'raw-unavailable'};}
}
module.exports={object,hash,time,text,storeRoot,loadEvents,referencedEvent,checkedEnvelope};
