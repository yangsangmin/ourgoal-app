'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {createRequire}=require('node:module'),{chromium}=createRequire('C:/dev/ourgoal-app/package.json')('playwright');
const root=path.resolve(__dirname,'../..'),run=process.argv[2]||'product-feedback';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),umd='C:/dev/ourgoal-app/node_modules/@supabase/supabase-js/dist/umd/supabase.js';
const server=http.createServer((req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}const type=/\.js$/.test(rel)?'text/javascript':/\.css$/.test(rel)?'text/css':/\.html$/.test(rel)?'text/html':'application/octet-stream';res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(fs.readFileSync(file));});
let browser;const result={run,sourcePins:['index.html','js/tabs/records/share-to-feed.js','js/tabs/records/share-feed-save.js'].map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))})),library:{file:umd,sha256:sha(fs.readFileSync(umd)),kind:'actual-installed-browser-library',operatingCDNVersionVerified:null},checks:[],pageErrors:[],blockedRequests:[],remoteRequests:0,operatingUse:null};
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(15000);
 page.on('pageerror',e=>result.pageErrors.push(e.message.replace(/https?:\/\/\S+/g,'[주소]')));
 await page.route('**/*',async route=>{const req=route.request(),url=req.url();if(url.startsWith(origin))return route.continue();if(url==='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')return route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:fs.readFileSync(umd)});result.blockedRequests.push({origin:new URL(url).origin,method:req.method(),feedWrite:new URL(url).pathname==='/rest/v1/feed_posts'&&req.method()==='POST'});return route.abort();});
 await page.goto(origin+'/index.html');
 if(await page.locator('#captureInput').isVisible()) result.entryMode='actual-anonymous-app-already-visible';
 else { await page.locator('#btnLandingPreviewDirect').click(); result.entryMode='actual-landing-preview-click'; }
 await page.locator('#captureInput').waitFor({state:'visible'});await page.locator('.navbtn[data-tab="comm"]').click();await page.locator('#btnCommPostFeed').click();
 result.ownerApi=await page.evaluate(()=>({scopeHas:typeof OurgoalAppScope.scope.saveLocalSettings==='function',kitHas:typeof OurgoalUiHelpers.saveLocalSettings==='function',sameFunction:OurgoalAppScope.scope.saveLocalSettings===OurgoalUiHelpers.saveLocalSettings,registeredOwner:typeof OurgoalAppScope.ownerOf==='function'?OurgoalAppScope.ownerOf('saveLocalSettings'):null}));
 result.checks.push({name:'actual-registered-owner-api-identity',matched:result.ownerApi.scopeHas&&result.ownerApi.kitHas&&result.ownerApi.sameFunction});
  const originalCaption='처음 준비한 게시 문구';
  await page.locator('#shareCaptionInput').fill(originalCaption);
  await page.locator('#shareConfirmBtn').click();
  await page.waitForFunction(()=>document.querySelector('#shareConfirmBtn')?.textContent.includes('같은 게시물 다시 시도'));
  const rect=await page.locator('#shareCaptionInput').boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);await page.keyboard.type('키보드로 바꾸려는 문구');
  result.checks.push({name:'SP10-01-actual-keyboard-lock',matched:await page.locator('#shareCaptionInput').isDisabled()&&(await page.locator('#shareCaptionInput').inputValue())===originalCaption});
  await page.locator('#sharePreviewBtn').click();
  result.checks.push({name:'SP10-01-preview-first-prepared-text',matched:(await page.locator('#sharePreviewCardBody').innerText()).includes(originalCaption)&&!(await page.locator('#sharePreviewCardBody').innerText()).includes('키보드로 바꾸려는 문구')});
  result.checks.push({name:'SP10-01-explicit-lock-status',matched:(await page.locator('#shareFeedSaveStatus').innerText()).includes('처음 준비한 문구와 선택이 고정')});
  const beforeCancel=result.blockedRequests.filter(r=>r.feedWrite).length;
  const cancelEnabled=await page.locator('#shareCancelBtn').isEnabled();await page.locator('#shareCancelBtn').click();await page.waitForTimeout(100);
  result.checks.push({name:'SP10-02-actual-cancel-closure',matched:cancelEnabled&&!(await page.locator('#modalOverlay').isVisible())});
  result.checks.push({name:'SP10-02-no-added-feed-attempt',matched:result.blockedRequests.filter(r=>r.feedWrite).length===beforeCancel});
 const image='guest-'+run+'.png';await page.screenshot({path:path.join(__dirname,image),fullPage:false});result.screenshot={file:image,sha256:sha(fs.readFileSync(path.join(__dirname,image)))};
 result.total=result.checks.length;result.matched=result.checks.filter(r=>r.matched).length;console.log(JSON.stringify({run,total:result.total,matched:result.matched,pageErrors:result.pageErrors,blockedRequests:result.blockedRequests.length,remoteRequests:0}));if(result.matched!==result.total||result.pageErrors.length)process.exitCode=1;
}
main().catch(e=>{result.error=e.message;console.error(e.stack);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(__dirname,'guest-'+run+'.json'),JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});if(browser)await browser.close();server.close();});
