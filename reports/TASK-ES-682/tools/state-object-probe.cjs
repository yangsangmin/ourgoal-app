#!/usr/bin/env node
'use strict';
// #TASK-ES-682 상태 객체 탐침(작업자 측정 도구, 판정 아님 — #TASK-ES-679 의 것을 그대로 본뜸) — 구역 이전 3차가 정의 줄을 옮기는 두 이름을 페이지 안에서 잰다. 상태 탐침(reports/TASK-ES-636/state-probe.cjs)이 재는 것(값 요약 · 접근자 · 쓰기 왕복)에 더해:
//   state                    앱의 중심 상태 객체.
//     · 통로 접근자 종류 · 주인 · 기관 종류 · 열쇠 수와 열쇠 이름 해시 · 두 번 읽어 같은 객체인지
//     · window.state(구역 함수가 로드 중에 단 복사)와 같은 객체인지
//     · 템플릿 부품 초기화가 건네받은 getState() 가 돌려주는 것이 통로의 state 와 같은 객체인지(페이지가 뜨기 전에 초기화 호출을 엿보는 조각을 심는다)
//     · 제자리 변경(속성 하나를 달았다 뗌)이 window.state · getState() 로 보이는지
//     · 통째로 다시 대입(쓰기 왕복): 통로에 새 객체를 쓰면 통로 · getState() 가 그 객체를 돌려주고, window.state 는 예전 객체 그대로인지(복사는 로드 때 한 번뿐) → 되돌림
//     · 화면 조작이 같은 객체를 바꾸는지: 목표 탭을 누른 뒤 통로 · window · getState() 의 activeTab 이 모두 'goals' 인지
//   _promptEncyclopediaOpen  프롬프트 백과사전 서랍의 접힘 상태(참/거짓).
//     · 통로 접근자 종류 · 주인 · 기관 종류 · 값 · 쓰기 왕복
//     · 그 값을 읽는 세포 함수(renderPromptEncyclopediaHtml)가 값에 따라 서랍을 접힌 꼴/펼친 꼴로 그리는지(거짓 → display:none, 참 → display:block)
//     · 그 값을 쓰는 세포의 단추 처리기: 그린 글을 문서 밖 요소에 넣고 머리 줄(#btnTogglePromptAccordion)을 누르면 값이 뒤집히는지 → 되돌림
// 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다. 외부 통신은 법정 브라우저가 막는다. 저장되는 조작은 하지 않는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-682/tools/state-object-probe.cjs <APP_DIR> <out.json>
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const APP = path.resolve(argv[0] || '.'), OUT = argv[1];
if (!OUT) { console.error('사용: node state-object-probe.cjs <APP_DIR> <out.json>'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..', '..');
const C = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js'), siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));

function spy() { // 페이지가 뜨기 전에 도는 관측 조각(제품 파일은 건드리지 않는다)
  var rec = window.__s682 = { initCalls: [] }, realPart;
  Object.defineProperty(window, 'OurgoalTemplateCredit', { configurable: true, enumerable: true, get: function () { return realPart; }, set: function (v) {
    realPart = v;
    if (v && typeof v.init === 'function' && !v.__spied) { var o = v.init; v.init = function (d) { rec.initCalls.push({ d: d }); return o.apply(this, arguments); }; v.__spied = true; }
  } });
}
function read(PHASE) {
  var A = window.OurgoalAppScope, S = A.scope, ST = window.OurgoalAppState, rec = window.__s682, out = {};
  var hash = function (str) { var h = 5381; for (var i = 0; i < str.length; i++) { h = ((h << 5) + h + str.charCodeAt(i)) | 0; } return (h >>> 0).toString(16); };
  var meta = function (n) { var d = Object.getOwnPropertyDescriptor(S, n); return { accessor: !d ? '(absent)' : d.get ? (d.set ? 'get+set' : 'get') : 'data', owner: A.ownerOf ? A.ownerOf(n) : null, organKind: ST && ST.kindOf ? ST.kindOf(n) : null }; };
  var guard = function (f) { try { return f(); } catch (e) { return { error: String(e && e.message || e) }; } };
  var c = rec.initCalls, d = c[0] && c[0].d, getState = d && typeof d.getState === 'function' ? d.getState : null;
  if (PHASE === 'afterGoalsTab') return guard(function () { return { scopeActiveTab: S.state.activeTab, windowActiveTab: window.state && window.state.activeTab, getStateActiveTab: getState ? getState().activeTab : null }; });
  out.state = guard(function () { var v = S.state, keys = Object.keys(v).sort(), r = Object.assign(meta('state'), { type: v === null ? 'null' : typeof v, keys: keys.length, keysHash: hash(keys.join(',')), sameOnReread: S.state === v });
    r.windowHas = 'state' in window; r.windowSame = window.state === v;
    r.partInitCalls = c.length; r.getStateType = typeof getState; r.getStateSame = getState ? getState() === v : null;
    v.__probe682 = 1; r.inPlaceVisibleOnWindow = !!window.state && window.state.__probe682 === 1; r.inPlaceVisibleViaGetState = getState ? getState().__probe682 === 1 : null; delete v.__probe682; r.inPlaceRemoved = !('__probe682' in S.state);
    var mark = { __mark682: true }; S.state = mark;
    r.reassign = { scopeReturnsNew: S.state === mark, getStateReturnsNew: getState ? getState() === mark : null, windowStillOld: window.state === v };
    S.state = v; r.reassign.restored = S.state === v && (getState ? getState() === v : true);
    return r; });
  out.promptOpen = guard(function () { var n = '_promptEncyclopediaOpen', v = S[n], r = Object.assign(meta(n), { type: typeof v, value: v, windowHas: n in window });
    S[n] = true; r.writeTrue = S[n] === true; S[n] = v; r.restored = S[n] === v;
    var render = S.renderPromptEncyclopediaHtml, wire = S.wirePromptEncyclopediaEvents; r.renderType = typeof render; r.wireType = typeof wire;
    if (typeof render === 'function') { var drawer = function (h) { var m = /<div id="promptEncyclopediaDrawer" style="([^"]*)"/.exec(h); return m ? (/display:none/.test(m[1]) ? 'none' : /display:block/.test(m[1]) ? 'block' : m[1]) : '(서랍 없음)'; };
      var hClosed = render('goals'); r.drawerWhenFalse = drawer(hClosed); S[n] = true; r.drawerWhenTrue = drawer(render('goals')); S[n] = v; r.restoredAfterRender = S[n] === v;
      if (typeof wire === 'function') { var host = document.createElement('div'); host.innerHTML = hClosed; var btn = host.querySelector('#btnTogglePromptAccordion'); r.toggleButton = !!btn;
        if (btn) { wire(host); var before = S[n]; btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); r.toggledByButton = S[n] === !before; S[n] = v; r.restoredAfterToggle = S[n] === v; } } }
    return r; });
  out.organNames = ST && ST.names ? ST.names().length : null;
  return out;
}
const VIS = '(function(){function vis(el){if(!el)return false;var rs=el.getClientRects();if(!rs.length)return false;var cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden"||parseFloat(cs.opacity)<0.01)return false;var b=el.getBoundingClientRect();return b.width>0&&b.height>0;}return vis;})()';
async function evalJson(page, expr, timeoutMs) {
  const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify(' + expr + ')', returnByValue: true, awaitPromise: true }, timeoutMs || 15000);
  if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + (r.exceptionDetails.text || '') + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || ''));
  return r.result && typeof r.result.value === 'string' ? JSON.parse(r.result.value) : null;
}
async function waitVisible(page, selector, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await evalJson(page, '(function(){var vis=' + VIS + ';var els=Array.prototype.slice.call(document.querySelectorAll(' + JSON.stringify(selector) + ')).filter(vis);if(els.length!==1)return {n:els.length};var b=els[0].getBoundingClientRect();return {n:1,x:b.left+b.width/2,y:b.top+b.height/2};})()');
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
(async () => {
  const startedAt = new Date().toISOString();
  const srv = await server.start(APP, cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [], steps = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push(String((d && d.exception && d.exception.description) || (d && d.text) || 'exception').split('\n')[0].slice(0, 200)); });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + spy.toString() + ')();' });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; steps.push({ step: 'goto', ok: true });
    for (const f of [{ wait: '#btnLandingPreviewDirect', click: true, timeoutMs: 15000, required: true }, { wait: '#btnAvatarGreetClose', click: true, timeoutMs: 10000, required: false }, { wait: '.navbtn[data-tab="home"]', click: false, timeoutMs: 10000, required: true }]) {
      const pt = await waitVisible(page, f.wait, f.timeoutMs);
      if (!pt) { steps.push({ step: f.wait, ok: false }); if (f.required) throw new Error('게스트 부팅 단계 실패: ' + f.wait); continue; }
      if (f.click) await realClick(page, pt);
      steps.push({ step: f.wait, ok: true }); await sleep(600);
    }
    await sleep(1200);
    result = await evalJson(page, '(' + read.toString() + ')("main")', 30000);
    const pt = await waitVisible(page, '.navbtn[data-tab="goals"]', 5000);
    if (pt) { await realClick(page, pt); await sleep(700); result.afterGoalsTab = await evalJson(page, '(' + read.toString() + ')("afterGoalsTab")', 15000); }
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const out = { tool: 'reports/TASK-ES-682/tools/state-object-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님', startedAt, endedAt: new Date().toISOString(), app: APP,
    limits: '게스트로 부팅한 임시 브라우저에서 쟀다. 관측 조각은 페이지가 뜨기 전에 window 에 심은 것이고 제품 파일은 그대로다. 통째로 다시 대입한 값과 달았던 속성은 재고 나서 되돌렸다. 저장되는 조작은 하지 않았다.',
    boot: { ok: !error, error, steps, exceptions }, result };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: !error, error, exceptions: exceptions.length, state: result && result.state, prompt: result && result.promptOpen, after: result && result.afterGoalsTab }));
  process.exit(error ? 1 : 0);
})();
