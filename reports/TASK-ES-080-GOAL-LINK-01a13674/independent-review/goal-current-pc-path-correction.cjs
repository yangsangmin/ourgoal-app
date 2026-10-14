'use strict';
// One normal guest flow, no injected profile/app calls/SDK or server response fixture.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('C:/dev/ourgoal-app/node_modules/playwright');
const root=path.resolve('C:/dev/wt/eGoal080-01a13674'),base='dfb6cac74fb336cab496e113f356875fb2da25fc',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const product=['index.html','js/core/modal-open.js','js/core/modal-helper.js','js/tabs/records/checkin-capture.js','js/tabs/records/checkin-feedback.js','js/tabs/records/first-checkin-tutorial.js','js/tabs/goals/record-link.js'];
const expected='기록이 목표와 연관된 내용으로 판단됩니다. 목표탭으로 이동할까요?';
const git=(...a)=>cp.execFileSync('git',['-c','core.longpaths=true','-c','core.autocrlf=false','-C',root,...a]);
const tracked=new Map(git('ls-tree','-r','-z','--full-tree',base).toString('utf8').split('\0').filter(Boolean).map(v=>{const [head,file]=v.split('\t');return [file,head.split(' ')[2]];}));
const overlay=new Map(product.map(f=>[f,git('show',base+':'+f)]));
const out=path.join(__dirname,'goal-pc-2');fs.mkdirSync(out);
const durable=(name,v)=>fs.writeFileSync(path.join(out,name),JSON.stringify(v,null,2)+'\n',{encoding:'utf8',flag:'wx'});
const append=(name,v)=>{const fd=fs.openSync(path.join(out,name),'a');try{fs.writeSync(fd,JSON.stringify(v)+'\n',null,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
durable('START.json',{at:new Date().toISOString(),base,ownNodePID:process.pid,driverSHA256:sha(fs.readFileSync(__filename)),expected,overlay:product.map(f=>({file:f,SHA256:sha(overlay.get(f))})),execution:'new own guest local source overlay, not public production/cache verification'});
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const served=[],network=[],steps=[],pageErrors=[];let server,browser,context,page,chrome,profile,stage='setup';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cleanError(e){return {name:e.name,message:String(e.message).replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/ig,'[ID omitted]').replace(/https?:\/\/\S+/g,'[URL omitted]').slice(0,1800)};}
async function startServer(){server=http.createServer((req,res)=>{
 let file;try{file=decodeURIComponent(new URL(req.url,'http://local.invalid').pathname);if(file==='/')file='/index.html';}catch{res.writeHead(400);res.end();return;}
 const rel=file.slice(1),absolute=path.resolve(root,rel);let bytes,status=404,baselineMatch=null;
 if(req.method!=='GET'||!absolute.startsWith(root+path.sep)||(!tracked.has(rel)&&!overlay.has(rel))||/^(?:api|reports|docs|court|scripts|\.git|\.claude)(?:\/|$)/.test(rel)){res.writeHead(403);res.end('blocked');return;}
 try{bytes=overlay.get(rel)||git('show',base+':'+rel);baselineMatch=overlay.has(rel)?null:crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')===tracked.get(rel);status=overlay.has(rel)||baselineMatch?200:409;}catch{}
 const record={path:file,status,overlay:overlay.has(rel),SHA256:bytes?sha(bytes):null,baselineGitBlobMatch:baselineMatch};served.push(record);append('served.jsonl',record);
 res.writeHead(status,{'Content-Type':MIME[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(status===200?bytes:'source unavailable');
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return server.address().port;}
async function click(selector){stage='click '+selector;append('actions.jsonl',{stage,at:new Date().toISOString()});await page.locator(selector).click({timeout:15000});}
async function transition(){await page.waitForFunction(()=>!document.documentElement.matches(':active-view-transition')&&!document.getAnimations().some(a=>a.playState==='running'&&(String(a.animationName).includes('view-transition')||String(a.effect?.pseudoElement).includes('view-transition'))),{},{timeout:15000});}
async function observation(){return page.evaluate(expected=>{
 const L=window.OurgoalAppScope?.scope,p=L?.state?.profile,rec=p?.records?.find(r=>r.text==='피아노를 20분 연습했어요');
 const backdrop=document.querySelector('#checkinAiSheetBackdrop'),overlay=document.querySelector('#modalOverlay');
 let backup=null,q=null;try{backup=JSON.parse(localStorage.getItem('ourgoal_records_backup_'+p?.id));q=JSON.parse(localStorage.getItem('ourgoal_save_pending_'+p?.id));}catch{}
 const proposed=document.querySelector('#recordGoalLinkSuggestion');
 const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
 return {normalGuest:p?.isGuest===true,sbNull:L?.sb===null,SDKPresent:!!window.supabase,activeTab:L?.state?.activeTab,
 goalCount:p?.goals?.length??null,ownGoalCount:p?.goals?.filter(g=>g.title==='피아노 연습').length??null,ownRecordCount:p?.records?.filter(r=>r.text==='피아노를 20분 연습했어요').length??null,
 inputLength:document.querySelector('#captureInput')?.value.length??null,syncState:document.querySelector('#captureSyncStatus')?.dataset.syncState??null,
 backupMatchesRecord:!!rec&&Array.isArray(backup)&&backup.some(r=>r.id===rec.id&&r.text===rec.text),pendingOwn:!!rec&&q?.account===p?.id&&!!q?.entries?.[rec.id],
 automaticGoalIdOnRecord:rec?Object.prototype.hasOwnProperty.call(rec,'goalId'):null,
 modalActive:overlay?.classList.contains('active')??null,firstCelebration:visible(document.querySelector('#firstCheckinDoneBtn')),
 feedbackVisible:visible(backdrop),feedbackClosing:backdrop?.classList.contains('closing')??null,proposalVisible:visible(proposed),proposalTextMatches:proposed?.textContent.includes(expected)??null,
 closedLabel:document.querySelector('#recordGoalLinkClose')?.textContent??null,goLabel:document.querySelector('#recordGoalLinkGo')?.textContent??null,
 targetTitle:document.querySelector('#recordGoalLinkTarget')?.textContent??null,targetTitleVisible:visible(document.querySelector('#recordGoalLinkTarget')),targetTitleUncovered:(()=>{const el=document.querySelector('#recordGoalLinkTarget');if(!el)return null;const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!top&&(el===top||el.contains(top));})(),actualAccount:null,remoteConfirmed:null,productionSourceVerified:null};
 },expected);}
async function capture(name){const value=await observation();const png=path.join(out,name+'.png');await page.screenshot({path:png,fullPage:false});const item={name,at:new Date().toISOString(),observation:value,PNG:name+'.png',PNG_SHA256:sha(fs.readFileSync(png))};steps.push(item);durable(name+'.json',item);return value;}
(async()=>{let error=null,chromeExited=null,serverClosed=null;
 try{
 const port=await startServer(),host='ourgoal-goal-link.test',origin='http://'+host+':'+port;profile=fs.mkdtempSync(path.join(out,'own-browser-profile-'));
 chrome=cp.spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','--disable-gpu','--no-proxy-server','--host-resolver-rules=MAP '+host+' 127.0.0.1, MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--unsafely-treat-insecure-origin-as-secure='+origin,'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
 let debugPort;for(let n=0;n<100&&chrome.exitCode===null;n++){try{const v=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();if(/^\d+$/.test(v)){debugPort=Number(v);break;}}catch{}await sleep(100);}if(!debugPort)throw Error('own Chrome debug port unavailable');
 browser=await chromium.connectOverCDP('http://127.0.0.1:'+debugPort);context=await browser.newContext({viewport:{width:1280,height:900},locale:'ko-KR',serviceWorkers:'block'});
 await context.route('**/*',route=>{const q=route.request(),u=new URL(q.url()),local=u.hostname===host&&Number(u.port)===port,allow=local&&q.method()==='GET'&&!u.pathname.startsWith('/api/');const record={at:new Date().toISOString(),method:q.method(),routeClass:local?(u.pathname.startsWith('/api/')?'localAPI':'localStatic'):'external',path:local&&!u.pathname.startsWith('/api/')?u.pathname:null,allowed:allow};network.push(record);append('network.jsonl',record);return allow?route.continue():route.abort('blockedbyclient');});
 page=await context.newPage();page.on('pageerror',e=>{const record={stage,...cleanError(e)};pageErrors.push(record);append('page-errors.jsonl',record);});
 stage='normal landing';await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:45000});await click('#btnLandingPreviewDirect');await page.locator('#appShell.active').waitFor({state:'visible',timeout:15000});
 stage='normal greeting';await page.waitForFunction(()=>sessionStorage.getItem('ourgoal_avatar_greeted_session')==='1',{},{timeout:15000});await page.locator('#avatarGreetingModal').waitFor({state:'hidden',timeout:15000});await transition();
 const initial=await capture('00-normal-guest');if(!initial.normalGuest||!initial.sbNull||initial.SDKPresent)throw Error('normal guest/no SDK differs');
 await click('.navbtn[data-tab="goals"]');await page.locator('#screen-goals.active').waitFor({state:'visible',timeout:15000});await transition();await click('#sAddGoalBtn');await click('#ngManualBtn');
 stage='own goal title';await page.locator('#mGoalTitle').fill('피아노 연습');await page.locator('#mGoalVis').selectOption('private');await click('#mSave');await page.locator('#modalOverlay.active').waitFor({state:'hidden',timeout:15000});
 await click('.navbtn[data-tab="home"]');await page.locator('#screen-home.active').waitFor({state:'visible',timeout:15000});await transition();
 stage='own practice memo';await page.locator('#captureInput').fill('피아노를 20분 연습했어요');await click('#captureSave');await page.waitForFunction(()=>document.querySelector('#captureInput')?.value===''&&document.querySelector('#captureSyncStatus')?.dataset.syncState==='local',{},{timeout:20000});
 const saved=await capture('01-device-before-celebration-close');if(!saved.backupMatchesRecord||!saved.pendingOwn||saved.ownRecordCount!==1||saved.proposalVisible)throw Error('device receipt/order differs');
 await page.locator('#firstCheckinDoneBtn').waitFor({state:'visible',timeout:15000});await click('#firstCheckinDoneBtn');await page.locator('#checkinAiSheetBackdrop:not(.closing) #btnCheckinAiClose').waitFor({state:'visible',timeout:20000});
 const feedback=await capture('02-feedback-before-proposal');if(!feedback.feedbackVisible||feedback.proposalVisible)throw Error('feedback/proposal order differs');
 await click('#btnCheckinAiClose');await page.locator('#recordGoalLinkSuggestion').waitFor({state:'visible',timeout:15000});
 const proposal=await capture('03-goal-link-proposal');if(!proposal.targetTitleVisible||!proposal.targetTitleUncovered||proposal.targetTitle!=='관련 목표: 피아노 연습'||!proposal.proposalTextMatches||proposal.feedbackVisible||proposal.automaticGoalIdOnRecord)throw Error('proposal content/assignment differs');
 await click('#recordGoalLinkGo');await page.locator('#screen-goals.active').waitFor({state:'visible',timeout:15000});await transition();
 const moved=await capture('04-goals-navigation');if(moved.activeTab!=='goals'||moved.ownRecordCount!==1||moved.automaticGoalIdOnRecord)throw Error('explicit navigation differs');
 }catch(e){error={stage,...cleanError(e)};durable('FIRST-FAILURE.json',error);if(page)try{await capture('99-failure');}catch{} }
 finally{
 if(context)try{await context.close();}catch{}if(browser)try{await browser.close();}catch{}
 if(chrome){for(let n=0;n<30&&chrome.exitCode===null;n++)await sleep(100);if(chrome.exitCode===null){chrome.kill();for(let n=0;n<30&&chrome.exitCode===null;n++)await sleep(100);}chromeExited=chrome.exitCode!==null||chrome.signalCode!==null;}
 if(server){server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));serverClosed=!server.listening;}
 // Own ephemeral profile remains untracked; no delete.
 const result={base,overlay:product.map(f=>({file:f,SHA256:sha(overlay.get(f)),stillSame:sha(overlay.get(f))===sha(git('show',base+':'+f))})),steps,error,pageErrors,measured:{captureCount:steps.length,servedCount:served.length,servedBaselineMismatchCount:served.filter(s=>s.status===409).length,nonGETForwarded:network.filter(n=>n.allowed&&n.method!=='GET').length,APIForwarded:network.filter(n=>n.allowed&&n.routeClass==='localAPI').length,externalForwarded:network.filter(n=>n.allowed&&n.routeClass==='external').length,blockedAPI:network.filter(n=>!n.allowed&&n.routeClass==='localAPI').length},cleanup:{ownNodePID:process.pid,ownChromePID:chrome?.pid??null,chromeExited,serverClosed,ownProfileRemoved:profile?!fs.existsSync(profile):null},scope:{newOwnGuest:true,appFunctionOrProfileInjection:false,SDKExecuted:false,newAICallBudget:0,productionSourceVerified:null,realAccount:null,remoteConfirmed:null,operating:null,use:null,effect:null,Court:null}};
 durable('FIRST.json',result);console.log(JSON.stringify({FIRST:path.join(out,'FIRST.json'),SHA256:sha(fs.readFileSync(path.join(out,'FIRST.json'))),error,measured:result.measured,cleanup:result.cleanup}));if(error)process.exitCode=1;
 }
})().catch(e=>{console.error(cleanError(e));process.exitCode=1;});
