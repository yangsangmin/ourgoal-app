#!/usr/bin/env node
'use strict';
// #TASK-ES-649 사진 첨부 경로 탐침(작업자 측정 도구, 판정 아님) — headless Chrome 에서 게스트로 진입한 뒤, 체크인 사진 첨부 경로를 페이지 안에서 실제로 돌린다.
// 사진 대기값 pendingCapturePhoto 를 통로로 **대입**하는 세 자리가 살아 있는지 본다:
//   ① 사진을 고르면(파일 입력칸 change) 줄인 그림이 대기값에 들어가고 미리보기가 뜬다(js/tabs/records/checkin-input-wiring.js)
//   ② 미리보기의 지우기 단추를 누르면 대기값이 null 이 되고 미리보기가 사라진다(같은 파일)
//   ③ 다시 사진을 고르고 기록 단추를 누르면 기록에 그 사진이 실리고 대기값이 null 로 돌아간다(js/tabs/records/checkin-capture.js)
// 파일 고르기 창은 열지 않는다 — 페이지 안에서 작은 그림 파일을 만들어 입력칸에 넣고 change 사건을 보낸다(화면 시나리오가 아니라 페이지 안 평가다).
// 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다. 부팅 순서는 reports/TASK-ES-636/state-probe.cjs 와 같다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-649/photo-probe.cjs <APP_DIR> <out.json>
const fs = require('fs'), path = require('path');
const APP = path.resolve(process.argv[2] || '.'), OUT = process.argv[3];
if (!OUT) { console.error('사용: node photo-probe.cjs <APP_DIR> <out.json>'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..');
const courtLib = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = courtLib('chrome.js');
const server = courtLib('static-server.js'), siteHost = courtLib('site-host.js');
const courtCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));
const VIS = '(function(){function vis(el){if(!el)return false;var rs=el.getClientRects();if(!rs.length)return false;var cs=getComputedStyle(el);' +
  'if(cs.display==="none"||cs.visibility==="hidden"||parseFloat(cs.opacity)<0.01)return false;var b=el.getBoundingClientRect();return b.width>0&&b.height>0;}return vis;})()';
async function evalJson(page, expr, timeoutMs) {
  const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, timeoutMs || 15000);
  if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + (r.exceptionDetails.text || '') + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || ''));
  return r.result && typeof r.result.value === 'string' ? JSON.parse(r.result.value) : null;
}
async function waitVisible(page, selector, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await evalJson(page, 'JSON.stringify((function(){var vis=' + VIS + ';var els=Array.prototype.slice.call(document.querySelectorAll(' + JSON.stringify(selector) + ')).filter(vis);' +
      'if(els.length!==1)return {n:els.length};var b=els[0].getBoundingClientRect();return {n:1,x:b.left+b.width/2,y:b.top+b.height/2};})())');
    if (r && r.n === 1) return r;
    await sleep(150);
  }
  return null;
}
async function realClick(page, pt) {
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
}
const PAGE_FN = '(async function(){' +
  'var S=window.OurgoalAppScope,sc=S.scope,ST=window.OurgoalAppState,out={};' +
  'var acc=function(n){var d=Object.getOwnPropertyDescriptor(sc,n);return {accessor:!d?"(absent)":d.get?(d.set?"get+set":"get"):"data",owner:S.ownerOf?S.ownerOf(n):null,organKind:ST&&ST.kindOf?ST.kindOf(n):null};};' +
  'out.names={pendingCapturePhoto:acc("pendingCapturePhoto"),capturePhotoBtn:acc("capturePhotoBtn"),capturePhotoInput:acc("capturePhotoInput"),capturePhotoPreview:acc("capturePhotoPreview"),qRoutineRow:acc("qRoutineRow")};' +
  'var input=document.getElementById("capturePhotoInput"),prev=document.getElementById("capturePhotoPreview"),B={};' +
  'B.initialNull=(sc.pendingCapturePhoto===null);' +
  'B.sameElements={input:sc.capturePhotoInput===input,preview:sc.capturePhotoPreview===prev,button:sc.capturePhotoBtn===document.getElementById("capturePhotoBtn"),routineRow:sc.qRoutineRow===document.getElementById("quickRoutineRow")};' +
  'B.routineChips=sc.qRoutineRow?sc.qRoutineRow.querySelectorAll("[data-quickroutine]").length:null;' +
  'function attach(){return new Promise(function(res,rej){var c=document.createElement("canvas");c.width=16;c.height=16;var g=c.getContext("2d");g.fillStyle="#3182f6";g.fillRect(0,0,16,16);' +
    'c.toBlob(function(b){try{var f=new File([b],"probe.png",{type:"image/png"});var dt=new DataTransfer();dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));res();}catch(e){rej(e);}},"image/png");});}' +
  'function waitFor(fn,ms){return new Promise(function(res){var t0=Date.now();(function tick(){var ok=false;try{ok=fn();}catch(e){}if(ok)return res(true);if(Date.now()-t0>ms)return res(false);setTimeout(tick,50);})();});}' +
  // ① 사진 고르기
  'await attach();var got=await waitFor(function(){return typeof sc.pendingCapturePhoto==="string";},6000);var v1=sc.pendingCapturePhoto;var img=prev.querySelector(".photo-preview-img");' +
  'B.attach={set:got,isDataUrl:typeof v1==="string"&&v1.indexOf("data:image/")===0,previewDisplay:prev.style.display,imgSrcIsPending:!!img&&img.getAttribute("src")===v1};' +
  // ② 지우기
  'var del=prev.querySelector(".photo-preview-del");if(del)del.click();' +
  'B.remove={clicked:!!del,pendingNull:sc.pendingCapturePhoto===null,previewDisplay:prev.style.display,previewEmpty:prev.innerHTML==="",inputEmpty:input.value===""};' +
  // ③ 다시 고르고 기록
  'await attach();var got2=await waitFor(function(){return typeof sc.pendingCapturePhoto==="string";},6000);var v2=sc.pendingCapturePhoto;' +
  'var recs=sc.state.profile.records,n0=recs.length;document.getElementById("captureInput").value="";document.getElementById("captureSave").click();' +
  'var saved=await waitFor(function(){return sc.state.profile.records.length===n0+1&&sc.pendingCapturePhoto===null;},8000);var r0=sc.state.profile.records[0]||{};' +
  'B.save={attached:got2,saved:saved,recordsAdded:sc.state.profile.records.length-n0,recordPhotoIsPending:typeof v2==="string"&&r0.photo===v2,recordText:r0.text||null,pendingNullAfter:sc.pendingCapturePhoto===null,previewDisplay:prev.style.display,previewEmpty:prev.innerHTML===""};' +
  'out.behavior=B;return JSON.stringify(out);})()';
(async () => {
  const startedAt = new Date().toISOString();
  const srv = await server.start(APP, courtCfg.denyServePrefixes || []);
  const host = siteHost.pickSiteHost(courtCfg), siteUrl = siteHost.siteUrlFor(host, srv.port);
  const exceptions = [], consoleErrors = [], steps = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: courtCfg.allowHosts || [], siteOrigin: siteUrl, locale: courtCfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push((d && d.exception && d.exception.description) || (d && d.text) || 'exception'); });
    page.on('Runtime.consoleAPICalled', p => { if (p && p.type === 'error') consoleErrors.push((p.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ')); });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded;
    for (const f of [{ wait: '#btnLandingPreviewDirect', click: true, timeoutMs: 15000, required: true }, { wait: '#btnAvatarGreetClose', click: true, timeoutMs: 10000, required: false }, { wait: '.navbtn[data-tab="home"]', click: false, timeoutMs: 10000, required: true }]) {
      const pt = await waitVisible(page, f.wait, f.timeoutMs);
      if (!pt) { steps.push({ step: f.wait, ok: false }); if (f.required) throw new Error('게스트 부팅 단계 실패: ' + f.wait); continue; }
      if (f.click) await realClick(page, pt);
      steps.push({ step: f.wait, ok: true }); await sleep(600);
    }
    await sleep(1500);
    result = await evalJson(page, PAGE_FN, 40000);
    await sleep(1500); // 기록 뒤 따라오는 비동기 일(경험치·토스트)에서 나는 예외까지 듣는다
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const out = { tool: 'reports/TASK-ES-649/photo-probe.cjs', type: '작업자 측정, 판정 아님', startedAt, endedAt: new Date().toISOString(), guestBoot: { ok: !error, steps, error, exceptions: exceptions.map(x => String(x).split('\n')[0].slice(0, 200)), consoleErrors: consoleErrors.map(x => String(x).slice(0, 200)) }, names: result ? result.names : null, behavior: result ? result.behavior : null };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', 'utf8');
  console.log(JSON.stringify({ ok: !error, error, exceptions: exceptions.length, consoleErrors: consoleErrors.length, names: out.names, behavior: out.behavior }));
  process.exit(error ? 1 : 0);
})();
