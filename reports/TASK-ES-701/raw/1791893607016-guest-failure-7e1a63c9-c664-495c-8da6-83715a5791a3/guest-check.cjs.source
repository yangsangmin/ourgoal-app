'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {createRequire}=require('node:module'),{chromium}=createRequire('C:/dev/ourgoal-app/package.json')('playwright');
const root=path.resolve(__dirname,'../..'),run=process.argv[2]||'initial';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),umd='C:/dev/ourgoal-app/node_modules/@supabase/supabase-js/dist/umd/supabase.js';
const server=http.createServer((req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}const type=/\.js$/.test(rel)?'text/javascript':/\.css$/.test(rel)?'text/css':/\.html$/.test(rel)?'text/html':'application/octet-stream';res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(fs.readFileSync(file));});
let browser;const result={run,sourcePins:['index.html','js/tabs/records/share-to-feed.js','js/tabs/records/share-feed-save.js'].map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))})),library:{file:umd,sha256:sha(fs.readFileSync(umd)),kind:'actual-installed-browser-library',operatingCDNVersionVerified:null},checks:[],pageErrors:[],blockedRequests:[],remoteRequests:0,operatingUse:null};
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(15000);
 page.on('pageerror',e=>result.pageErrors.push(e.message.replace(/https?:\/\/\S+/g,'[주소]')));
 await page.route('**/*',async route=>{const req=route.request(),url=req.url();if(url.startsWith(origin))return route.continue();if(url==='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')return route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:fs.readFileSync(umd)});result.blockedRequests.push({origin:new URL(url).origin,method:req.method()});return route.abort();});
 await page.goto(origin+'/index.html');
 if(await page.locator('#captureInput').isVisible()) result.entryMode='actual-anonymous-app-already-visible';
 else { await page.locator('#btnLandingPreviewDirect').click(); result.entryMode='actual-landing-preview-click'; }
 await page.locator('#captureInput').waitFor({state:'visible'});await page.locator('.navbtn[data-tab="comm"]').click();await page.locator('#btnCommPostFeed').click();
 await page.locator('#shareGoalSelect').selectOption('__none__');
 result.checks.push({name:'genuine-guest-default-life',matched:await page.locator('[data-shcat="life"]').evaluate(el=>el.classList.contains('active'))});
 await page.locator('[data-shcat="dev"]').click();await page.locator('#sharePreviewBtn').click();
 result.checks.push({name:'manual-category-preview',matched:(await page.locator('#sharePreviewCardBody').innerText()).includes('개발·기획')});
 result.checks.push({name:'existing-preview-and-control',matched:(await page.locator('#sharePreviewBtn').innerText()).includes('미리보기 닫기')&&await page.locator('#shareConfirmBtn').isVisible()});
 if(run==='failure-path'){
  result.checks=[];
  await page.locator('#shareCaptionInput').fill('격리된 실패 경로 확인 입력');
  await page.locator('#shareConfirmBtn').click();
  await page.waitForFunction(()=>document.querySelector('#shareConfirmBtn')?.textContent.includes('같은 게시물 다시 시도'));
  result.checks.push({name:'actual-network-denial-retains-input',matched:await page.locator('#shareCaptionInput').isVisible()&&(await page.locator('#shareCaptionInput').inputValue())==='격리된 실패 경로 확인 입력'});
  result.checks.push({name:'actual-network-denial-no-draft-claim',matched:(await page.locator('#shareFeedSaveStatus').innerText()).includes('보관되지 않아요')});
 }
 const image='guest-'+run+'.png';await page.screenshot({path:path.join(__dirname,image),fullPage:false});result.screenshot={file:image,sha256:sha(fs.readFileSync(path.join(__dirname,image)))};
 result.total=result.checks.length;result.matched=result.checks.filter(r=>r.matched).length;console.log(JSON.stringify({run,total:result.total,matched:result.matched,pageErrors:result.pageErrors,blockedRequests:result.blockedRequests.length,remoteRequests:0}));if(result.matched!==result.total||result.pageErrors.length)process.exitCode=1;
}
main().catch(e=>{result.error=e.message;console.error(e.stack);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(__dirname,'guest-'+run+'.json'),JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});if(browser)await browser.close();server.close();});
