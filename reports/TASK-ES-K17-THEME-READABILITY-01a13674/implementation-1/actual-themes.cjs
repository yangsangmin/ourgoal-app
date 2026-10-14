'use strict';
// One normal guest flow, no injected profile/app calls/SDK or server response fixture.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('C:/dev/ourgoal-app/node_modules/playwright');
const root=path.resolve(__dirname,'../../..'),base='e176ccb986723d6b8ba323b9f9d7df8b3a46b48b',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const product=['index.html','ui.css','js/tabs/records/first-checkin-tutorial.js','js/tabs/records/checkin-capture.js','js/tabs/records/checkin-helpers.js'];
const expected='기록하고 나의 역사데이터를 만들어요.';
const boot=fs.readFileSync(path.join(root,'js/core/boot-early-state.js'),'utf8');
const themes=[...boot.split("define('THEMES', [")[1].split(']);')[0].matchAll(/\bid:\s*'([^']+)'/g)].map(x=>x[1]);
const git=(...a)=>cp.execFileSync('git',['-c','core.longpaths=true','-c','core.autocrlf=false','-C',root,...a]);
const tracked=new Map(git('ls-tree','-r','-z','--full-tree',base).toString('utf8').split('\0').filter(Boolean).map(v=>{const [head,file]=v.split('\t');return [file,head.split(' ')[2]];}));
const overlay=new Map(product.map(f=>[f,fs.readFileSync(path.join(root,f))]));
const out=path.join(__dirname,'actual-1');fs.mkdirSync(out);
const durable=(name,v)=>fs.writeFileSync(path.join(out,name),JSON.stringify(v,null,2)+'\n',{encoding:'utf8',flag:'wx'});
const append=(name,v)=>{const fd=fs.openSync(path.join(out,name),'a');try{fs.writeSync(fd,JSON.stringify(v)+'\n',null,'utf8');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
durable('START.json',{at:new Date().toISOString(),base,ownNodePID:process.pid,driverSHA256:sha(fs.readFileSync(__filename)),themes,expected,overlay:product.map(f=>({file:f,SHA256:sha(overlay.get(f))})),execution:'new own guest local source overlay, not public production/cache verification'});
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const served=[],network=[],steps=[],pageErrors=[];let server,browser,context,page,chrome,profile,stage='setup';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cleanError(e){return {name:e.name,message:String(e.message).replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/ig,'[ID omitted]').replace(/https?:\/\/\S+/g,'[URL omitted]').slice(0,1800)};}
async function startServer(){server=http.createServer((req,res)=>{
 let file;try{file=decodeURIComponent(new URL(req.url,'http://local.invalid').pathname);if(file==='/')file='/index.html';}catch{res.writeHead(400);res.end();return;}
 const rel=file.slice(1),absolute=path.resolve(root,rel);let bytes,status=404,baselineMatch=null;
 if(req.method!=='GET'||!absolute.startsWith(root+path.sep)||!tracked.has(rel)||/^(?:api|reports|docs|court|scripts|\.git|\.claude)(?:\/|$)/.test(rel)){res.writeHead(403);res.end('blocked');return;}
 try{bytes=overlay.get(rel)||fs.readFileSync(absolute);baselineMatch=overlay.has(rel)?null:crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')===tracked.get(rel);status=overlay.has(rel)||baselineMatch?200:409;}catch{}
 const record={path:file,status,overlay:overlay.has(rel),SHA256:bytes?sha(bytes):null,baselineGitBlobMatch:baselineMatch};served.push(record);append('served.jsonl',record);
 res.writeHead(status,{'Content-Type':MIME[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(status===200?bytes:'source unavailable');
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return server.address().port;}
async function click(selector){stage='click '+selector;append('actions.jsonl',{stage,at:new Date().toISOString()});await page.locator(selector).click({timeout:15000});}
async function transition(){await page.waitForFunction(()=>!document.documentElement.matches(':active-view-transition')&&!document.getAnimations().some(a=>a.playState==='running'&&(String(a.animationName).includes('view-transition')||String(a.effect?.pseudoElement).includes('view-transition'))),{},{timeout:15000});}
async function observation(){return page.evaluate(expected=>{
 const el=document.querySelector('#captureInput'),pseudo=el?getComputedStyle(el,'::placeholder'):null,style=el?getComputedStyle(el):null;
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 const stack=[];for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);stack.push({tag:e.tagName,id:e.id||null,color:s.color,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,opacity:s.opacity,filter:s.filter,backdropFilter:s.backdropFilter,display:s.display,visibility:s.visibility});}
 const p=window.OurgoalAppScope?.scope?.state?.profile,scope=window.OurgoalAppScope?.scope;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(ctx&&pseudo)ctx.font=pseudo.font;
 const contentWidth=el?el.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight):null;
 return {theme:document.documentElement.getAttribute('data-theme'),normalGuest:p?.isGuest===true&&typeof p.id==='string'&&p.id.startsWith('guest-'),sbNull:scope?.sb===null,SDKPresent:!!window.supabase,
  expectedLiteral:expected,placeholder:el?.getAttribute('placeholder')??null,literalMatches:el?.getAttribute('placeholder')===expected,valueLength:el?.value.length??null,
  placeholderShown:el?.matches(':placeholder-shown')??null,focused:document.activeElement===el,elementRect:el?rect(el):null,
  visible:!!el&&el.getClientRects().length>0&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0,
  font: pseudo?{size:pseudo.fontSize,family:pseudo.fontFamily,weight:pseudo.fontWeight,lineHeight:pseudo.lineHeight,color:pseudo.color,opacity:pseudo.opacity}:null,
  contentWidth,textWidth:ctx?ctx.measureText(expected).width:null,inputClient:el?{width:el.clientWidth,height:el.clientHeight,scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight}:null,
  backgroundStack:stack,captureSub:{display:getComputedStyle(document.querySelector('#captureCardBox .capture-sub')).display},
  activeTab:scope?.state?.activeTab,recordCount:p?.records?.length??null,productionServedSource:null,realAccount:null};
 },expected);}
async function capture(name){const value=await observation();const png=path.join(out,name+'.png');await page.screenshot({path:png,fullPage:false});
 const item={name,at:new Date().toISOString(),observation:value,PNG:name+'.png',PNG_SHA256:sha(fs.readFileSync(png))};steps.push(item);durable(name+'.json',item);return value;}
(async()=>{let error=null,chromeExited=null,serverClosed=null;
 try{
  const port=await startServer(),host='ourgoal-k17-theme.test',origin='http://'+host+':'+port;profile=fs.mkdtempSync(path.join(out,'own-browser-profile-'));
  chrome=cp.spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','--disable-gpu','--no-proxy-server','--host-resolver-rules=MAP '+host+' 127.0.0.1, MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--unsafely-treat-insecure-origin-as-secure='+origin,'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
  let debugPort;for(let n=0;n<100&&chrome.exitCode===null;n++){try{const v=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();if(/^\d+$/.test(v)){debugPort=Number(v);break;}}catch{}await sleep(100);}
  if(!debugPort)throw Error('own Chrome debug port unavailable');
  browser=await chromium.connectOverCDP('http://127.0.0.1:'+debugPort);context=await browser.newContext({viewport:{width:1280,height:900},locale:'ko-KR',serviceWorkers:'block'});
  await context.route('**/*',route=>{const q=route.request(),u=new URL(q.url()),isLocal=u.hostname===host&&Number(u.port)===port;
   const allow=isLocal&&q.method()==='GET'&&!u.pathname.startsWith('/api/');const record={at:new Date().toISOString(),method:q.method(),routeClass:isLocal?(u.pathname.startsWith('/api/')?'localAPI':'localStatic'):'external',path:isLocal&&!u.pathname.startsWith('/api/')?u.pathname:null,allowed:allow};network.push(record);append('network.jsonl',record);return allow?route.continue():route.abort('blockedbyclient');});
  page=await context.newPage();page.on('pageerror',e=>{const record={stage,...cleanError(e)};pageErrors.push(record);append('page-errors.jsonl',record);});
  stage='normal landing';await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:45000});
  await click('#btnLandingPreviewDirect');await page.locator('#appShell.active').waitFor({state:'visible',timeout:15000});
  stage='normal greeting wait';await page.waitForFunction(()=>sessionStorage.getItem('ourgoal_avatar_greeted_session')==='1',{},{timeout:15000});await page.locator('#avatarGreetingModal').waitFor({state:'hidden',timeout:15000});await transition();
  const initial=await capture('00-normal-guest');if(!initial.normalGuest||!initial.sbNull||initial.SDKPresent)throw Error('fresh normal guest/no SDK precondition differs');
  for(let i=0;i<themes.length;i++){
   const theme=themes[i];await click('.navbtn[data-tab="settings"]');await page.locator('#screen-settings.active').waitFor({state:'visible',timeout:15000});await transition();
   const summary='details.settings-group-accordion:has(#themeGrid) > summary';await click(summary);
   await click('#themeGrid .theme-card[data-themeid="'+theme+'"]');await page.waitForFunction(t=>document.documentElement.getAttribute('data-theme')===t,theme,{timeout:15000});
   await click('.navbtn[data-tab="home"]');await page.locator('#screen-home.active').waitFor({state:'visible',timeout:15000});await transition();await page.locator('#captureInput').scrollIntoViewIfNeeded();
   stage='measure '+theme;const empty=await capture(String(i+1).padStart(2,'0')+'-'+theme+'-empty');
   await click('#captureInput');await page.keyboard.type('가');const typed=await observation();durable(String(i+1).padStart(2,'0')+'-'+theme+'-typed.json',{theme,valueLength:typed.valueLength,placeholderShown:typed.placeholderShown,literalMatches:typed.literalMatches,recordCount:typed.recordCount});
   await page.keyboard.press('Control+A');await page.keyboard.press('Backspace');
   const erased=await observation();durable(String(i+1).padStart(2,'0')+'-'+theme+'-erased.json',{theme,valueLength:erased.valueLength,placeholderShown:erased.placeholderShown,literalMatches:erased.literalMatches,recordCount:erased.recordCount});
   if(!empty.literalMatches||!empty.visible||!typed.literalMatches||typed.placeholderShown||typed.valueLength!==1||erased.valueLength!==0||!erased.placeholderShown)throw Error('observed placeholder condition differs for '+theme);
  }
 }catch(e){error={stage,...cleanError(e)};durable('FIRST-FAILURE.json',error);if(page)try{await capture('99-failure');}catch{} }
 finally{
  if(context)try{await context.close();}catch{}if(browser)try{await browser.close();}catch{}
  if(chrome){for(let n=0;n<30&&chrome.exitCode===null;n++)await sleep(100);if(chrome.exitCode===null){chrome.kill();for(let n=0;n<30&&chrome.exitCode===null;n++)await sleep(100);}chromeExited=chrome.exitCode!==null||chrome.signalCode!==null;}
  if(server){server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));serverClosed=!server.listening;}
  if(profile&&chromeExited){const resolved=path.resolve(profile),prefix=path.resolve(out)+path.sep+'own-browser-profile-';if(!resolved.startsWith(prefix))throw Error('profile cleanup outside own output');fs.rmSync(resolved,{recursive:true,force:true});}
  const result={base,overlay:product.map(f=>({file:f,SHA256:sha(overlay.get(f)),stillSame:sha(overlay.get(f))===sha(fs.readFileSync(path.join(root,f)))})),themes,steps,error,pageErrors,
   measured:{themeEmptyCaptureCount:steps.filter(s=>s.name.endsWith('-empty')).length,servedCount:served.length,servedBaselineMismatchCount:served.filter(s=>s.status===409).length,
    nonGETForwarded:network.filter(n=>n.allowed&&n.method!=='GET').length,APIForwarded:network.filter(n=>n.allowed&&n.routeClass==='localAPI').length,externalForwarded:network.filter(n=>n.allowed&&n.routeClass==='external').length,
    blockedExternalRequests:network.filter(n=>!n.allowed&&n.routeClass==='external').length,submitClicks:0},
   cleanup:{ownNodePID:process.pid,ownChromePID:chrome?.pid??null,chromeExited,serverClosed,ownProfileRemoved:profile?!fs.existsSync(profile):null},
   scope:{newOwnGuest:true,appFunctionOrProfileInjection:false,SDKExecuted:false,productionSourceVerified:null,productionCacheVerified:null,realAccount:null,operating:null,use:null,effect:null,Court:null}};
  durable('FIRST.json',result);console.log(JSON.stringify({FIRST:path.join(out,'FIRST.json'),SHA256:sha(fs.readFileSync(path.join(out,'FIRST.json'))),error,measured:result.measured,cleanup:result.cleanup}));if(error)process.exitCode=1;
 }
})().catch(e=>{console.error(cleanError(e));process.exitCode=1;});
