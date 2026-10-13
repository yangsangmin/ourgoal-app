'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {createRequire}=require('node:module'),{chromium}=createRequire('C:/dev/ourgoal-app/package.json')('playwright');
const root=path.resolve(__dirname,'../..'),files=['js/core/capabilities.js','js/data/category-map.js','js/core/gcal-token.js','js/tabs/records/share-feed-save.js','js/tabs/records/share-to-feed.js'],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const assets=new Map(files.map(f=>[f,fs.readFileSync(path.join(root,f))])),checks=[];let browser;
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':assets.has(req.url.slice(1))?'text/javascript; charset=utf-8':'text/html; charset=utf-8'});res.end(assets.get(req.url.slice(1))||'<html><body></body></html>');});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true});
 for(const mode of ['success','swap-after-intent','swap-after-owner','owner-absent','pending-retry','concurrent']){
  const page=await browser.newPage();page.setDefaultTimeout(3000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
  await page.evaluate(mode=>{
   window.metrics={requests:[],ownerWrites:[],profileCalls:0,closed:0,toasts:[],cache:[],idCount:0};
   const goal={id:'fixture-A-goal',title:'원 목표',topic:'health/러닝·마라톤',category:'health',pct:42,milestones:[]};
   const A={id:'fixture-A',displayName:'격리 입력',settings:{keep:'A-settings',myFeedPosts:[{id:'old-extra',extra:{category:'study',keep:'이전 정보'}}],virtualCheerEnabled:false},goals:[goal],records:[]};
   window.fixtureB={id:'fixture-B',displayName:'다른 격리 입력',settings:{keep:'B-settings'},goals:[{id:'B-goal'}],records:[]};
   const L={state:{profile:A,lastCapture:null},newId:()=> String(++metrics.idCount),nowISO:()=> '2026-10-13T00:00:00Z',goalProgress:g=>g.pct,escapeHtml:s=>String(s||''),md:s=>s,avatarHtml:()=>'',triggerHaptic:()=>{},burstConfetti:()=>{},setTab:()=>{},renderCommScreen:()=>{},applyAppSettings:()=>{},toast:s=>metrics.toasts.push(s),closeModal:()=>metrics.closed++,saveProfile:async()=>{metrics.profileCalls++;throw Error('금지한 broad owner call');},openModal:(html,bind)=>{document.body.innerHTML='<main id="modal">'+html+'</main>';bind(document.querySelector('#modal'));},sb:{from:table=>({insert:async post=>{metrics.requests.push({table,post:JSON.parse(JSON.stringify(post))});if(mode==='concurrent')await new Promise(r=>metrics.release=r);return {error:mode==='pending-retry'&&metrics.requests.length===1?{code:'42501',message:'격리 거절'}:null};}})}};
   window.fixtureScope=L;window.OurgoalAppScope={scope:L};window.fixtureMode=mode;
  },mode);
  for(const f of files)await page.addScriptTag({url:origin+'/'+f});
  await page.evaluate(()=>{
   const actual=OurgoalUiHelpers.saveLocalSettings;
   if(fixtureMode!=='owner-absent')fixtureScope.saveLocalSettings=(account,snapshot)=>{metrics.ownerWrites.push({account,snapshot:JSON.parse(JSON.stringify(snapshot))});actual(account,snapshot);if(fixtureMode==='swap-after-owner')fixtureScope.state.profile=fixtureB;};
   const factory=OurgoalCapabilities.request('records.share-feed-intent');
   if(fixtureMode==='swap-after-intent')OurgoalCapabilities.provide('records.share-feed-intent',L=>{const intent=factory(L),submit=intent.submit;intent.submit=async post=>{const result=await submit(post);L.state.profile=fixtureB;return result;};return intent;},{cell:'records/share-feed-save',sideEffect:'server'});
   OurgoalRecordsKit.openShareToFeedModal();
  });
  await page.locator('#shareCaptionInput').fill('captured own input');await page.locator('#shareConfirmBtn').click();await page.waitForTimeout(80);
  if(mode==='pending-retry'){await page.locator('#shareConfirmBtn').click();await page.waitForTimeout(80);}
  if(mode==='concurrent'){const rect=await page.locator('#shareConfirmBtn').boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);await page.evaluate(()=>metrics.release());await page.waitForTimeout(80);}
  const actual=await page.evaluate(()=>({requests:metrics.requests,ownerWrites:metrics.ownerWrites,profileCalls:metrics.profileCalls,closed:metrics.closed,idCount:metrics.idCount,currentAccount:fixtureScope.state.profile.id,currentSettings:fixtureScope.state.profile.settings,cache:fixtureScope.FEED_POSTS_CACHE||[],aReadback:localStorage.getItem('ourgoal_settings_fixture-A'),bReadback:localStorage.getItem('ourgoal_settings_fixture-B')}));
  let matched;
  if(mode==='success')matched=actual.requests.length===1&&actual.requests[0].table==='feed_posts'&&actual.ownerWrites.length===1&&actual.ownerWrites[0].account==='fixture-A'&&JSON.parse(actual.aReadback).keep==='A-settings'&&JSON.parse(actual.aReadback).myFeedPosts[1].extra.keep==='이전 정보'&&actual.closed===1&&actual.cache.length===1;
  if(mode==='swap-after-intent')matched=actual.requests.length===1&&actual.ownerWrites.length===0&&actual.aReadback===null&&actual.bReadback===null&&actual.cache.length===0&&actual.closed===0&&actual.currentSettings.keep==='B-settings';
  if(mode==='swap-after-owner')matched=actual.requests.length===1&&actual.ownerWrites.length===1&&JSON.parse(actual.aReadback).keep==='A-settings'&&actual.bReadback===null&&actual.cache.length===0&&actual.closed===0&&actual.currentSettings.keep==='B-settings';
  if(mode==='owner-absent')matched=actual.requests.length===0&&actual.ownerWrites.length===0&&actual.closed===0;
  if(mode==='pending-retry')matched=actual.requests.length===2&&actual.idCount===1&&JSON.stringify(actual.requests[0].post)===JSON.stringify(actual.requests[1].post)&&actual.ownerWrites.length===1&&actual.closed===1;
  if(mode==='concurrent')matched=actual.requests.length===1&&actual.idCount===1&&actual.ownerWrites.length===1&&actual.closed===1;
  checks.push({mode,matched:!!matched&&actual.profileCalls===0&&!errors.length,actual,errors,componentOnly:true,remoteRequests:0});await page.close();
 }
 const report={sourcePins:[...assets].map(([file,b])=>({file,sha256:sha(b)})),checks,total:checks.length,matched:checks.filter(c=>c.matched).length,remoteRequests:0,genuineAccountAuthority:false};
 fs.writeFileSync(path.join(__dirname,'owner-boundary-with-replay.json'),JSON.stringify(report,null,2)+'\n',{encoding:'utf8',flag:'wx'});console.log(JSON.stringify({total:report.total,matched:report.matched,remoteRequests:0}));if(report.matched!==report.total)process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
