'use strict';
// 대상 DOM·실제 게스트 저장값·토스트·오류의 기준2/작업1 비교. 독립 실제 클릭 시나리오는 별도로 실행한다.
// 기존 shots-lib 게스트 화면 시드/외부 요청 차단을 재사용한다. 원격·실계정 E2E를 주장하지 않는다.
// 사용: node dom-compare-theme-toast-569.js <기준> <작업> <out.json>
const fs=require('fs'),path=require('path'),http=require('http');
const puppeteer=require('C:/dev/command-center/node_modules/puppeteer-core'),shots=require('../shots-lib'),{boot,sleep}=require('../tab-states');
const [BASE,WORK,OUT]=process.argv.slice(2);
function serve(root){root=path.resolve(root);const s=http.createServer((q,r)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f==='/')f='/index.html';if(f.startsWith('/api/')){r.setHeader('Content-Type','application/json');return r.end('{}');}f=path.join(root,f);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.statusCode=404;return r.end();}r.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'application/javascript; charset=utf-8':f.endsWith('.css')?'text/css':'application/octet-stream');fs.createReadStream(f).pipe(r);});return new Promise(resolve=>s.listen(0,'127.0.0.1',()=>resolve({s,url:'http://127.0.0.1:'+s.address().port})));}
const normalize=x=>JSON.parse(JSON.stringify(x).replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/g,'<iso>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,'<uuid>').replace(/\b1[789]\d{11}\b/g,'<ms>').replace(/127\.0\.0\.1:\d+/g,'127.0.0.1:<port>'));
async function snapshot(page){return normalize(await page.evaluate(()=>{
 const scope=window.OurgoalAppScope&&window.OurgoalAppScope.scope,p=scope&&scope.state&&scope.state.profile;
 const project=x=>x?{records:(x.records||[]).map(r=>({text:r.text,type:r.type,theme:r.theme,subTheme:r.subTheme,themeConfidence:r.themeConfidence})),goals:(x.goals||[]).map(g=>({title:g.title,visibility:g.visibility}))}:null;
 const t=document.getElementById('toast'),picker=document.getElementById('themePickList');
 let saved=null;try{saved=project(JSON.parse(localStorage.getItem('ourgoal_guest_profile')));}catch{}
 return {chips:[...document.querySelectorAll('[data-rectheme]')].map(e=>e.outerHTML),picker:picker?picker.outerHTML:null,toast:t?{class:t.className,html:t.innerHTML}:null,state:project(p),saved,undo:!!document.getElementById('btnUndoThemePrivacy')};
}));}
async function run(root,label){const {s,url}=await serve(root),browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--disable-gpu','--lang=ko-KR']});const rows=[],errors=[];
 try{const ctx=await browser.createBrowserContext(),page=await shots.newPage(ctx,true,'focus-sanctuary');await page.setViewport({width:430,height:3200});page.on('pageerror',e=>errors.push(String(e.message).replace(/https?:\/\/\S+/g,'<url>')));
  await page.evaluateOnNewDocument(()=>{let n=569;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);});
  await page.goto(url+'/index.html',{waitUntil:'networkidle2',timeout:60000});await sleep(1500);await boot(page);
  const save=async name=>{rows.push({name,snapshot:await snapshot(page),errors:[...errors]});};
  const click=async (sel,wait=600)=>{const el=await page.$(sel);if(!el)throw Error('대상 없음 '+sel);const visible=await el.evaluate(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width>0&&b.height>0&&s.display!=='none'&&s.visibility!=='hidden';});if(!visible)throw Error('숨김 대상 '+sel);await el.click();await sleep(wait);};
  await click('.navbtn[data-tab="records"]');await save('기록 테마 칩');
  await click('[data-rectheme]');await save('테마 여섯 선택지');
  await click('#themePickList [data-picktheme="workout"]');await save('운동기록 저장·토스트');
  await click('#toast',100);await save('일반 토스트 클릭 닫기');
  await click('.navbtn[data-tab="goals"]');await click('#btnPersonalAddGoalInline');await click('#ngManualBtn');
  await page.type('#mGoalTitle','분열 비교 독서 목표');await page.select('#mGoalVis','theme');await click('#mSave',350);await save('공개 범위 Undo 표시');
  await sleep(2500);await save('기본 소멸 시간 뒤 Undo 표시 유지');
  await click('#btnUndoThemePrivacy',350);await save('Undo 실제 저장·일반 토스트 교체');
  await sleep(2400);await save('일반 토스트 자동 소멸');
  return {label,rows,errors};
 }finally{await browser.close();await new Promise(r=>s.close(r));}
}
const cmp=(a,b)=>{const diffs=[];let count=0;for(let i=0;i<a.rows.length;i++)for(const k of ['snapshot','errors']){count++;if(JSON.stringify(a.rows[i][k])!==JSON.stringify(b.rows[i][k]))diffs.push({step:a.rows[i].name,field:k,a:a.rows[i][k],b:b.rows[i][k]});}return {compared:count,differing:diffs.length,diffs};};
(async()=>{
 if(process.argv.includes('--prepare-probe')){const r=await run(WORK,'preparation-only');fs.writeFileSync(OUT,JSON.stringify({preparationProbe:true,run:r},null,1)+'\n','utf8');console.log(JSON.stringify({preparationProbe:true,steps:r.rows.length,errors:r.errors.length}));return;}
 const b1=await run(BASE,'base1'),b2=await run(BASE,'base2'),after=await run(WORK,'after');
 const r={tool:'dom-compare-theme-toast-569.js',normalization:'ISO datetime·UUID·epoch ms·server port only; same seed; guest profile stored outcomes preserved',base1VsBase2:cmp(b1,b2),base1VsAfter:cmp(b1,after),runs:{base1:b1,base2:b2,after}};
 fs.writeFileSync(OUT,JSON.stringify(r,null,1)+'\n','utf8');console.log(JSON.stringify({base:r.base1VsBase2.differing,after:r.base1VsAfter.differing}));if(r.base1VsBase2.differing||r.base1VsAfter.differing)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
