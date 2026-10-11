#!/usr/bin/env node
'use strict';
// #TASK-ES-636 상태 값 탐침(작업자 측정 도구, 판정 아님) — headless Chrome 에서 게스트로 진입해 부팅을 끝낸 뒤, 이름마다 통로(OurgoalAppScope.scope) 값의 요약과
// 접근자 종류, window 복사의 동일성(window[n] === scope[n])을 잰다. 서로 다른 트리(기준 · 작업 · 모의 이전 사본)의 결과를 이름 단위로 맞대는 데 쓴다.
// 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다(court/** 변경 0). 부팅 순서는 scripts/probes/cell-registry-compare.js 와 같다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-636/state-probe.cjs <APP_DIR> <out.json> --names <이름 배열 또는 { names } JSON> [--eval "<식>"]
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const APP = path.resolve(argv[0] || '.'), OUT = argv[1];
const arg = k => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : null);
const namesFile = arg('--names'), extraEval = arg('--eval');
if (!OUT || !namesFile) { console.error('사용: node state-probe.cjs <APP_DIR> <out.json> --names <names.json> [--eval "<식>"]'); process.exit(2); }
const nj = JSON.parse(fs.readFileSync(path.resolve(namesFile), 'utf8'));
const NAMES = Array.isArray(nj) ? nj : nj.names;
const ROOT = path.resolve(__dirname, '..', '..');
const courtLib = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = courtLib('chrome.js');
const server = courtLib('static-server.js'), siteHost = courtLib('site-host.js');
const courtCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));
const VIS = '(function(){function vis(el){if(!el)return false;var rs=el.getClientRects();if(!rs.length)return false;var cs=getComputedStyle(el);' +
  'if(cs.display==="none"||cs.visibility==="hidden"||parseFloat(cs.opacity)<0.01)return false;var b=el.getBoundingClientRect();return b.width>0&&b.height>0;}return vis;})()';
async function evalJson(page, expr, timeoutMs) {
  const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify(' + expr + ')', returnByValue: true, awaitPromise: true }, timeoutMs || 15000);
  if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + (r.exceptionDetails.text || '') + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || ''));
  return r.result && typeof r.result.value === 'string' ? JSON.parse(r.result.value) : null;
}
async function waitVisible(page, selector, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await evalJson(page, '(function(){var vis=' + VIS + ';var els=Array.prototype.slice.call(document.querySelectorAll(' + JSON.stringify(selector) + ')).filter(vis);' +
      'if(els.length!==1)return {n:els.length};var b=els[0].getBoundingClientRect();return {n:1,x:b.left+b.width/2,y:b.top+b.height/2};})()');
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
// 페이지 안에서 도는 요약 함수: 값의 종류·길이·JSON 가능한 값의 해시(서로 다른 페이지 로드 사이에 맞댈 수 있는 것만)
const PAGE_FN = '(function(NAMES){' +
  'var S=window.OurgoalAppScope,ST=window.OurgoalAppState;' +
  'var hash=function(str){var h=5381;for(var i=0;i<str.length;i++){h=((h<<5)+h+str.charCodeAt(i))|0;}return (h>>>0).toString(16);};' +
  'var js=function(v){try{var t=JSON.stringify(v);return t===undefined?"(undefined)":t.length+":"+hash(t);}catch(e){return "(직렬화 불가)";}};' +
  'var one=function(v){var t=typeof v;if(t==="function"){var src="";try{src=Function.prototype.toString.call(v);}catch(e){src="?";}return "function:"+(v.name||"")+":"+v.length+":"+hash(src);}' +
    'if(v===null)return "null";if(t==="undefined")return "undefined";if(t==="string")return "string:"+v.length+":"+hash(v);if(t!=="object")return t+":"+String(v);' +
    'if(typeof Element!=="undefined"&&v instanceof Element)return "element:"+v.tagName.toLowerCase()+"#"+(v.id||"")+"."+(v.className&&v.className.baseVal===undefined?String(v.className).split(/\\s+/).filter(Boolean).sort().join("."):"");' +
    'if(typeof NodeList!=="undefined"&&v instanceof NodeList)return "nodelist:"+v.length;' +
    'if(Array.isArray(v))return "array:"+v.length+":"+js(v);return "object:"+Object.keys(v).length+":"+js(v);};' +
  'var out={hasScope:!!S,hasOrgan:!!ST,organNames:ST&&ST.names?ST.names():null,names:{}};' +
  'NAMES.forEach(function(n){var r={};try{var d=S?Object.getOwnPropertyDescriptor(S.scope,n):null;r.accessor=!d?"(absent)":d.get?(d.set?"get+set":"get"):"data";r.owner=S&&S.ownerOf?S.ownerOf(n):null;' +
    'var v=S?S.scope[n]:undefined;r.value=one(v);r.onWindow=(n in window);if(r.onWindow){r.windowValue=one(window[n]);r.windowSame=(window[n]===v);}r.organKind=ST&&ST.kindOf?ST.kindOf(n):null;if(r.accessor==="get+set"){var old=S.scope[n],mark={};S.scope[n]=mark;r.writeRoundtrip=(S.scope[n]===mark);S.scope[n]=old;r.restored=(S.scope[n]===old);}}catch(e){r.error=String(e&&e.message||e);}out.names[n]=r;});' +
  // 보조 조작(화면 시나리오가 아니다 — 페이지 안 평가): 체크인 입력칸에 글자를 넣고 input 사건을 보내면 글자 수 칸이 통로의 요소(capInput·liveCount)를 거쳐 갱신되는가
  'out.checks={};try{var ci=document.getElementById("captureInput"),cc=document.getElementById("captureCharCount");if(ci&&cc){var before=cc.textContent;ci.value="오늘 3km 달림";ci.dispatchEvent(new Event("input",{bubbles:true}));out.checks.captureCount={before:before,after:cc.textContent};ci.value="";ci.dispatchEvent(new Event("input",{bubbles:true}));}else{out.checks.captureCount=null;}}catch(e){out.checks.captureCount={error:String(e&&e.message||e)};}' +
  'return out;})';
(async () => {
  const startedAt = new Date().toISOString();
  const srv = await server.start(APP, courtCfg.denyServePrefixes || []);
  const host = siteHost.pickSiteHost(courtCfg), siteUrl = siteHost.siteUrlFor(host, srv.port);
  const exceptions = [], consoleErrors = [], steps = [];
  let browser = null, result = null, extra = null, error = null;
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
    steps.push({ step: 'goto', ok: true });
    const flow = [
      { wait: '#btnLandingPreviewDirect', click: true, timeoutMs: 15000, required: true },
      { wait: '#btnAvatarGreetClose', click: true, timeoutMs: 10000, required: false },
      { wait: '.navbtn[data-tab="home"]', click: false, timeoutMs: 10000, required: true },
    ];
    for (const f of flow) {
      const pt = await waitVisible(page, f.wait, f.timeoutMs);
      if (!pt) { steps.push({ step: f.wait, ok: false, note: '보이는 요소 1개를 기다렸으나 없음' }); if (f.required) throw new Error('게스트 부팅 단계 실패: ' + f.wait); continue; }
      if (f.click) { await realClick(page, pt); steps.push({ step: f.wait, ok: true, clicked: true }); } else steps.push({ step: f.wait, ok: true });
      await sleep(600);
    }
    await sleep(1500);
    result = await evalJson(page, PAGE_FN + '(' + JSON.stringify(NAMES) + ')', 30000);
    if (extraEval) extra = await evalJson(page, '(function(){return (' + extraEval + ');})()', 15000);
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const out = { tool: 'reports/TASK-ES-636/state-probe.cjs', type: '작업자 측정, 판정 아님', startedAt, endedAt: new Date().toISOString(), app: APP, namesFrom: path.resolve(namesFile), namesCount: NAMES.length,
    guestBoot: { ok: !error, steps, error, exceptions, consoleErrors }, hasScope: result && result.hasScope, hasOrgan: result && result.hasOrgan, organNames: result && result.organNames, names: result ? result.names : null, checks: result ? result.checks : null, extra };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', 'utf8');
  console.log(JSON.stringify({ ok: !error, error, exceptions: exceptions.length, firstException: (exceptions[0] || '').split('\n')[0].slice(0, 160), consoleErrors: consoleErrors.length, hasOrgan: out.hasOrgan, organNames: out.organNames ? out.organNames.length : null, names: result ? Object.keys(result.names).length : 0, extra }));
  process.exit(error ? 1 : 0);
})();
