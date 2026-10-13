'use strict';
// Actual Chrome + shipped app DOM/storage. Guest/local and scoped storage/AI faults only.
// No fake auth, no server row arrays, no live database; this is not real-account E2E.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const chrome=require(root+'/court/lib/chrome'),staticServer=require(root+'/court/lib/static-server'),host=require(root+'/court/lib/site-host');
async function run(){
 const server=await staticServer.start(root,['/reports/','/docs/','/court/','/scripts/']);
 const origin=host.siteUrlFor(host.pickSiteHost(),server.port), browser=await chrome.launch({siteOrigin:origin});
 const page=browser.page, errors=[],blocked=[];
 const evalJS=async expression=>{const x=await page.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(x.exceptionDetails)throw Error(x.exceptionDetails.text+' '+JSON.stringify(x.exceptionDetails.exception));return x.result.value;};
 async function wait(expression){for(let i=0;i<80;i++){if(await evalJS(expression))return;await chrome.sleep(100);}const diagnostic=await evalJS("({input:document.getElementById('captureInput')?.value,status:document.getElementById('captureSyncStatus')?.textContent,reason:document.getElementById('captureSyncStatus')?.dataset.syncReason,disabled:document.getElementById('captureSave')?.disabled})");fs.writeFileSync(__dirname+'/chrome-attempt-failure.json',JSON.stringify({expression,diagnostic,errors},null,2)+'\n','utf8');throw Error('wait: '+expression+' '+JSON.stringify(diagnostic));}
 try {
  await page.send('Runtime.enable');await page.send('Page.enable');
  page.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.text));
  await page.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  page.on('Fetch.requestPaused',p=>{
   if(p.request.url.startsWith(origin+'/'))page.send('Fetch.continueRequest',{requestId:p.requestId}).catch(()=>{});
   else if(p.request.url.includes('@supabase/supabase-js@2'))page.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:fs.readFileSync(root+'/court/vendor/supabase-js-2.115.0.umd.js').toString('base64')}).catch(()=>{});
   else {blocked.push({url:new URL(p.request.url).origin,method:p.request.method});page.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'}).catch(()=>{});}
  });
  await page.send('Page.navigate',{url:origin+'/'});
  await wait("document.readyState==='complete' && !!window.OurgoalAppScope && !!OurgoalAppScope.scope.state && !!window.OurgoalSettingsKit");
  await evalJS("document.getElementById('landGuestBtn').click()");
  await wait("!!OurgoalAppScope.scope.state && !!OurgoalAppScope.scope.state.profile && !!document.getElementById('captureInput')");
  // Scope-specific AI failure: existing UI follows its fallback. No request or new AI cost.
  await evalJS("Object.defineProperty(OurgoalAppScope.scope,'requestAIFeedback',{configurable:true,value:async function(){throw Error('local test AI unavailable');}});true");
  const initial=await evalJS("({uid:OurgoalAppScope.scope.state.profile.id,records:OurgoalAppScope.scope.state.profile.records.length,xp:OurgoalAppScope.scope.state.profile.settings.xp})");
  await evalJS("document.getElementById('captureInput').value='A 기기 저장 경계 검증';document.getElementById('captureSave').click();document.getElementById('captureSave').click()");
  await wait("!document.getElementById('captureSave').disabled && document.getElementById('captureInput').value===''");
  const first=await evalJS("(()=>{const p=OurgoalAppScope.scope.state.profile;const rows=JSON.parse(localStorage.getItem('ourgoal_records_backup_'+p.id));const q=JSON.parse(localStorage.getItem('ourgoal_save_pending_'+p.id));return {records:p.records.filter(r=>r.text==='A 기기 저장 경계 검증').map(r=>({id:r.id,text:r.text})),stored:rows.filter(r=>r.text==='A 기기 저장 경계 검증').map(r=>({id:r.id,text:r.text})),pending:Object.values(q.entries).map(e=>({target:e.target,generation:e.generation})),input:document.getElementById('captureInput').value,status:document.getElementById('captureSyncStatus').dataset.syncState};})()");
  assert.equal(first.records.length,1);assert.equal(first.stored.length,1);assert.equal(first.records[0].id,first.stored[0].id);assert.ok(first.pending.some(e=>e.target===first.records[0].id));
  await page.send('Page.reload',{ignoreCache:true});await wait("!!window.OurgoalAppScope && !!OurgoalAppScope.scope.state && !!OurgoalAppScope.scope.state.profile");
  const reopened=await evalJS("OurgoalAppScope.scope.state.profile.records.filter(r=>r.text==='A 기기 저장 경계 검증').map(r=>({id:r.id,text:r.text}))");assert.equal(reopened.length,1);assert.equal(reopened[0].id,first.records[0].id);
  await evalJS("Object.defineProperty(OurgoalAppScope.scope,'requestAIFeedback',{configurable:true,value:async function(){throw Error('local test AI unavailable');}});(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.indexOf('ourgoal_save_pending_')===0)throw new DOMException('Quota exceeded','QuotaExceededError');return native.call(this,k,v);};window.__restoreTestStorage=()=>Storage.prototype.setItem=native;})()");
  await evalJS("document.getElementById('captureInput').value='실패 입력 유지';document.getElementById('captureSave').click()");await wait("!document.getElementById('captureSave').disabled");
  const failed=await evalJS("({input:document.getElementById('captureInput').value,status:document.getElementById('captureSyncStatus').dataset.syncState,memoryCount:OurgoalAppScope.scope.state.profile.records.filter(r=>r.text==='실패 입력 유지').length,xp:JSON.stringify(OurgoalAppScope.scope.state.profile.settings.xp)})");assert.equal(failed.input,'실패 입력 유지');assert.equal(failed.status,'failed');assert.equal(failed.memoryCount,0);
  await evalJS("window.__restoreTestStorage();delete window.__restoreTestStorage;document.getElementById('captureSave').click();document.getElementById('captureSave').click()");await wait("!document.getElementById('captureSave').disabled && document.getElementById('captureInput').value===''");
  const retried=await evalJS("OurgoalAppScope.scope.state.profile.records.filter(r=>r.text==='실패 입력 유지').map(r=>({id:r.id,text:r.text}))");assert.equal(retried.length,1);
  const image=fs.readFileSync(root+'/icons/icon-192.png');
  await evalJS("(()=>{const bytes=Uint8Array.from(atob("+JSON.stringify(image.toString('base64'))+"),c=>c.charCodeAt(0));const dt=new DataTransfer();dt.items.add(new File([bytes],'local-test.png',{type:'image/png'}));const inp=document.getElementById('capturePhotoInput');inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await wait("!!OurgoalAppScope.scope.pendingCapturePhoto");
  await evalJS("(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(String(v).includes('data:image'))throw new DOMException('Quota exceeded','QuotaExceededError');return native.call(this,k,v);};window.__restoreTestStorage=()=>Storage.prototype.setItem=native;})();document.getElementById('captureInput').value='본문만 보관 사진 잔류';document.getElementById('captureSave').click()");
  await wait("!document.getElementById('captureSave').disabled && document.getElementById('captureInput').value===''");
  const partial=await evalJS("(()=>{const p=OurgoalAppScope.scope.state.profile;const r=p.records.find(r=>r.text==='본문만 보관 사진 잔류');return {id:r.id,input:document.getElementById('captureInput').value,pendingPhoto:!!OurgoalAppScope.scope.pendingCapturePhoto,fileCount:document.getElementById('capturePhotoInput').files.length,photoStored:!!JSON.parse(localStorage.getItem('ourgoal_records_backup_'+p.id)).find(x=>x.id===r.id).photo,xpLogs:p.settings.xp.log.filter(x=>x.reason==='체크인').length};})()");
  assert.equal(partial.input,'');assert.equal(partial.pendingPhoto,true);assert.equal(partial.fileCount,1);assert.equal(partial.photoStored,false);
  await evalJS("window.__restoreTestStorage();delete window.__restoreTestStorage;document.getElementById('captureSave').click();document.getElementById('captureSave').click()");
  await wait("!document.getElementById('captureSave').disabled && !OurgoalAppScope.scope.pendingCapturePhoto");
  const photoRetry=await evalJS("(()=>{const p=OurgoalAppScope.scope.state.profile;const rows=p.records.filter(r=>r.text==='본문만 보관 사진 잔류');return {ids:rows.map(r=>r.id),photoStored:!!JSON.parse(localStorage.getItem('ourgoal_records_backup_'+p.id)).find(x=>x.id===rows[0].id).photo,xpLogs:p.settings.xp.log.filter(x=>x.reason==='체크인').length};})()");
  assert.deepEqual(photoRetry.ids,[partial.id]);assert.equal(photoRetry.photoStored,true);assert.equal(photoRetry.xpLogs,partial.xpLogs);
  await evalJS("OurgoalAppScope.scope.openProTemplateRecordModal(null);true");await wait("!!document.getElementById('proGeneralSaveBtn')");
  await evalJS("document.getElementById('proRecMemo').value='전문 모달 기기 저장';document.getElementById('proGeneralSaveBtn').click();document.getElementById('proGeneralSaveBtn').click()");
  await wait("OurgoalAppScope.scope.state.profile.records.some(r=>r.memo==='전문 모달 기기 저장') && !document.getElementById('proGeneralSaveBtn')");
  const professional=await evalJS("(()=>{const p=OurgoalAppScope.scope.state.profile;return {records:p.records.filter(r=>r.memo==='전문 모달 기기 저장').map(r=>({id:r.id,text:r.text})),stored:JSON.parse(localStorage.getItem('ourgoal_records_backup_'+p.id)).filter(r=>r.memo==='전문 모달 기기 저장').map(r=>({id:r.id,text:r.text}))};})()");assert.equal(professional.records.length,1);assert.deepEqual(professional.records,professional.stored);
  await evalJS("(()=>{const pending={};Object.defineProperty(OurgoalAppScope.scope,'requestAIFeedback',{configurable:true,value:function(goal,text){return new Promise(resolve=>pending[text]=resolve);}});window.__resolveTestAI=(text,fb)=>pending[text](fb);})();document.getElementById('captureInput').value='늦은 첫 AI';document.getElementById('captureSave').click()");
  await wait("!document.getElementById('captureSave').disabled && document.getElementById('captureInput').value===''");
  await chrome.sleep(80);
  await evalJS("document.getElementById('captureInput').value='현재 두 번째 AI';document.getElementById('captureSave').click()");await wait("!document.getElementById('captureSave').disabled && document.getElementById('captureInput').value===''");await chrome.sleep(80);
  await evalJS("window.__resolveTestAI('현재 두 번째 AI',{verdict:'현재 응답',fact_insight:'현재 기록 응답',next_action:'현재 기록 다음'});true");
  await wait("OurgoalAppScope.scope.state.lastCapture?.record?.text==='현재 두 번째 AI'");
  await evalJS("window.__resolveTestAI('늦은 첫 AI',{verdict:'늦은 응답',fact_insight:'옛 기록 응답',next_action:'옛 기록 다음'});true");await chrome.sleep(100);
  const lateAI=await evalJS("({current:OurgoalAppScope.scope.state.lastCapture.record.text,firstFeedback:OurgoalAppScope.scope.state.profile.records.find(r=>r.text==='늦은 첫 AI').feedback.verdict,secondFeedback:OurgoalAppScope.scope.state.profile.records.find(r=>r.text==='현재 두 번째 AI').feedback.verdict})");assert.equal(lateAI.current,'현재 두 번째 AI');assert.equal(lateAI.firstFeedback,'늦은 응답');assert.equal(lateAI.secondFeedback,'현재 응답');
  const png=await page.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(__dirname+'/guest-save.png',Buffer.from(png.data,'base64'));
  const result={scope:'actual Chrome shipped app guest/local DOM+storage; scoped outbox/photo quota and AI rejection/defer faults; not real-account E2E',measuredAt:new Date().toISOString(),Chrome:browser.version,initial,first,reopened,failed,retried,partial,photoRetry,professional,lateAI,consoleExceptions:errors,blockedExternalAttempts:blocked,externalRequestsCompleted:0,liveWrites:0,AIRequests:0,operating:null,actualUse:null,effect:null,Court:null};
  fs.writeFileSync(__dirname+'/chrome-result.json',JSON.stringify(result,null,2)+'\n','utf8');console.log(JSON.stringify(result));
 } finally {await browser.close();await server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
