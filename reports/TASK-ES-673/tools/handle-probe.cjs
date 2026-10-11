#!/usr/bin/env node
'use strict';
// #TASK-ES-673 손잡이 탐침(작업자 측정 도구, 판정 아님) — 상태 이전 3차가 옮긴 이름 가운데 상태 탐침(reports/TASK-ES-636/state-probe.cjs)만으로는 모자란 넷을 페이지 안에서 더 잰다.
//   sb            서버 연결 객체. 통로 접근자 종류 · 주인 · 값의 종류 · window.sb 와 같은 것인지 · 템플릿 부품 초기화가 건네받은 것과 같은 것인지 · 엄격 모드 대입 시도의 결과.
//                 --fake-client 를 주면 페이지가 뜨기 전에 가짜 연결 라이브러리(window.supabase)를 심어 「연결 객체가 null 이 아닐 때」 같은 객체가 통로·window·부품에 닿는지 잰다(진짜 서버가 아니다).
//   shareContent  공유 함수. 함수의 name 을 읽는 순간을 잡는 덫(name 을 원래 값을 돌려주는 getter 로 바꿔 읽힌 횟수와 호출 자리를 적는다)을 window.shareContent 대입 순간에 건다.
//                 공유 엔진(OurgoalViralSharing.shareContent)을 기록용 대역으로 잠깐 바꿔 통로·window 로 부른 호출이 같은 인자를 넘기고 엔진의 반환값을 그대로 돌려주는지 잰다(공유 창·복사·서버 호출 없음).
//                 템플릿 장터 미리보기의 공유 단추(L.shareContent 를 부르는 세포 자리)도 같은 대역으로 눌러 본다.
//   MOCK_GROUPS   배열. 통로로 두 번 읽어 같은 배열인지 · 제자리 변경(끝에 하나 넣었다 뺌)이 통로로 보이는지 · 엄격 모드 대입 시도의 결과.
//   btnAvLvClose  DOM 요소. 문서의 그 요소와 같은 것인지 · 엄격 모드 대입 시도의 결과.
// 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다. 외부 통신은 법정 브라우저가 막는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-673/tools/handle-probe.cjs <APP_DIR> <out.json> [--fake-client]
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const APP = path.resolve(argv[0] || '.'), OUT = argv[1], FAKE = argv.includes('--fake-client');
if (!OUT) { console.error('사용: node handle-probe.cjs <APP_DIR> <out.json> [--fake-client]'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..', '..');
const C = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js'), siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));

function spy(FAKE) { // 페이지가 뜨기 전에 도는 관측 조각(제품 파일은 건드리지 않는다)
  var rec = window.__h673 = { nameReads: [], fns: [], fnSets: 0, initCalls: [], createCalls: [], fake: null, fakeGets: {} };
  var cur, realPart;
  Object.defineProperty(window, 'shareContent', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) {
    rec.fnSets++;
    if (typeof v === 'function' && !v.__nameTrap) {
      var orig = v.name, idx = rec.fns.length;
      try {
        Object.defineProperty(v, '__nameTrap', { value: { orig: orig, idx: idx } });
        Object.defineProperty(v, 'name', { configurable: true, get: function () { var st = ''; try { st = String(new Error().stack).split('\n').slice(2, 4).join(' | ').replace(/https?:\/\/[^\/]+/g, ''); } catch (e) { st = '?'; } rec.nameReads.push({ fn: idx, at: st }); return orig; } });
        rec.fns.push({ idx: idx, orig: orig, length: v.length });
      } catch (e) { rec.trapError = String(e && e.message || e); }
    }
    cur = v;
  } });
  Object.defineProperty(window, 'OurgoalTemplateCredit', { configurable: true, enumerable: true, get: function () { return realPart; }, set: function (v) {
    realPart = v;
    if (v && typeof v.init === 'function' && !v.__spied) { var o = v.init; v.init = function (d) { rec.initCalls.push({ d: d }); return o.apply(this, arguments); }; v.__spied = true; }
  } });
  if (FAKE) {
    var mk = function (top) { var f = function () {}; var p = new Proxy(f, {
      get: function (t, k) { if (k === 'then') return undefined; if (typeof k !== 'string') return undefined; if (top) rec.fakeGets[k] = (rec.fakeGets[k] || 0) + 1; if (k === 'toJSON') return function () { return null; }; return child; },
      apply: function () { return child; }, construct: function () { return child; } }); return p; };
    var child = mk(false), client = mk(true);
    rec.fake = client;
    window.supabase = { createClient: function (u, k) { rec.createCalls.push({ argc: arguments.length, urlType: typeof u, urlLength: String(u).length, keyType: typeof k, keyLength: String(k).length }); return client; } };
  }
}
function read(FAKE) { // 부팅이 끝난 뒤 읽는다
  var A = window.OurgoalAppScope, S = A.scope, ST = window.OurgoalAppState, rec = window.__h673, out = {};
  var hash = function (str) { var h = 5381; for (var i = 0; i < str.length; i++) { h = ((h << 5) + h + str.charCodeAt(i)) | 0; } return (h >>> 0).toString(16); };
  var acc = function (n) { var d = Object.getOwnPropertyDescriptor(S, n); return !d ? '(absent)' : d.get ? (d.set ? 'get+set' : 'get') : 'data'; };
  var meta = function (n) { return { accessor: acc(n), owner: A.ownerOf ? A.ownerOf(n) : null, organKind: ST && ST.kindOf ? ST.kindOf(n) : null }; };
  var tryWrite = function (n) { 'use strict'; var before = S[n], mark = {}; try { S[n] = mark; } catch (e) { return { threw: (e && e.name) || 'error', unchanged: S[n] === before }; } var changed = S[n] === mark; if (changed) S[n] = before; return { threw: null, unchanged: !changed, restored: S[n] === before }; };
  var guard = function (f) { try { return f(); } catch (e) { return { error: String(e && e.message || e) }; } };
  // sb
  out.sb = guard(function () { var v = S.sb, c = rec.initCalls, d = c[0] && c[0].d;
    var r = Object.assign(meta('sb'), { valueKind: v === null ? 'null' : typeof v, sameOnReread: S.sb === v, windowHas: 'sb' in window, windowSame: window.sb === v, partInitCalls: c.length, partInitGotScopeSb: d ? d.sb === v : null, write: tryWrite('sb') });
    if (FAKE) r.fake = { createCalls: rec.createCalls, scopeIsFakeClient: v === rec.fake, windowIsFakeClient: window.sb === rec.fake, partInitGotFakeClient: d ? d.sb === rec.fake : null, topLevelKeysRead: Object.keys(rec.fakeGets).sort(), topLevelReads: Object.keys(rec.fakeGets).sort().map(function (k) { return k + ':' + rec.fakeGets[k]; }) };
    return r; });
  // shareContent
  out.shareContent = guard(function () { var f = S.shareContent, r = Object.assign(meta('shareContent'), { type: typeof f });
    if (typeof f !== 'function') return r;
    r.length = f.length; r.sourceHash = hash(Function.prototype.toString.call(f)); r.trapped = !!f.__nameTrap; r.nameSeenAtAssign = f.__nameTrap ? f.__nameTrap.orig : null;
    r.windowSame = window.shareContent === f; r.windowAssignments = rec.fnSets; r.functionsTrapped = rec.fns.map(function (x) { return { name: x.orig, length: x.length, isScopeFunction: x.idx === (f.__nameTrap ? f.__nameTrap.idx : -1) }; });
    r.nameReadsAfterBoot = rec.nameReads.length; r.write = tryWrite('shareContent');
    var eng = window.OurgoalViralSharing, fw = { engineType: typeof eng };
    if (eng && typeof eng.shareContent === 'function') {
      var origFn = eng.shareContent, calls = [], sentinel = Promise.resolve('h673');
      eng.shareContent = function (o) { calls.push({ o: o, self: this === eng, argc: arguments.length }); return sentinel; };
      fw.stubbed = eng.shareContent !== origFn;
      try {
        var o1 = { type: 'app', id: 'h673-a' }, r1 = S.shareContent(o1);
        fw.viaScope = { engineCalls: calls.length, sameOptsObject: !!calls[0] && calls[0].o === o1, thisIsEngine: !!calls[0] && calls[0].self, argc: calls[0] ? calls[0].argc : null, returnsEngineResult: r1 === sentinel };
        var o2 = { type: 'app', id: 'h673-b' }, r2 = window.shareContent(o2);
        fw.viaWindow = { engineCalls: calls.length, sameOptsObject: !!calls[1] && calls[1].o === o2, thisIsEngine: !!calls[1] && calls[1].self, argc: calls[1] ? calls[1].argc : null, returnsEngineResult: r2 === sentinel };
        // 템플릿 장터 미리보기의 공유 단추(L.shareContent 를 부르는 세포 자리) — 대역이 걸린 동안만
        var mk = { openerType: typeof S.openTemplateMarketModal };
        if (typeof S.openTemplateMarketModal === 'function') {
          var n0 = calls.length; S.openTemplateMarketModal(function () {});
          var pv = document.querySelectorAll('.mkt-preview-btn'); mk.previewButtons = pv.length;
          if (pv.length) { var key = pv[0].getAttribute('data-mktkey'); pv[0].click(); var sb = document.getElementById('mktPreviewShareBtn'); mk.shareButton = !!sb;
            if (sb) { sb.click(); var c = calls[n0]; mk.engineCallsByClick = calls.length - n0; mk.optsType = c && c.o ? c.o.type : null; mk.optsIdIsTemplateKey = !!(c && c.o) && c.o.id === key; mk.optsKeys = c && c.o ? Object.keys(c.o).sort().join(',') : null; } }
          try { if (typeof S.closeModal === 'function') S.closeModal(); mk.closed = true; } catch (e) { mk.closed = false; }
        }
        fw.marketPreviewShare = mk;
      } finally { eng.shareContent = origFn; }
      fw.restored = eng.shareContent === origFn;
    }
    // 엔진이 없을 때의 갈래(Promise.resolve())
    var keep = window.OurgoalViralSharing;
    try { window.OurgoalViralSharing = null; if (window.OurgoalViralSharing === null) { var r3 = S.shareContent({}); fw.noEngine = { returnsPromise: r3 instanceof Promise }; } else fw.noEngine = { skipped: '전역을 비울 수 없음' }; } finally { window.OurgoalViralSharing = keep; }
    fw.engineRestored = window.OurgoalViralSharing === keep;
    r.forward = fw; r.nameReadsAfterCalls = rec.nameReads.length; r.nameReadSites = rec.nameReads.slice(0, 10); r.trapError = rec.trapError || null;
    return r; });
  // MOCK_GROUPS
  out.MOCK_GROUPS = guard(function () { var v = S.MOCK_GROUPS, r = Object.assign(meta('MOCK_GROUPS'), { isArray: Array.isArray(v) });
    if (!Array.isArray(v)) return r;
    var t = JSON.stringify(v); r.length = v.length; r.jsonLength = t.length; r.jsonHash = hash(t); r.sameOnReread = S.MOCK_GROUPS === v;
    var mark = { id: 'h673-mark' }; v.push(mark); r.inPlaceChangeVisible = S.MOCK_GROUPS[S.MOCK_GROUPS.length - 1] === mark; v.pop(); r.restoredLength = S.MOCK_GROUPS.length === r.length && JSON.stringify(S.MOCK_GROUPS) === t;
    r.windowHas = 'MOCK_GROUPS' in window; r.write = tryWrite('MOCK_GROUPS'); return r; });
  // btnAvLvClose
  out.btnAvLvClose = guard(function () { var v = S.btnAvLvClose, el = document.getElementById('btnAvatarLevelUpClose');
    var r = Object.assign(meta('btnAvLvClose'), { valueKind: v === null ? 'null' : (v instanceof Element ? 'element:' + v.tagName.toLowerCase() + '#' + v.id : typeof v), sameAsDocumentElement: v === el, write: tryWrite('btnAvLvClose') });
    // 그 단추에 걸린 닫기 배선이 도는가: 레벨업 창을 열고(화면만 바뀜 — 저장 없음) 통로의 그 요소를 눌러 닫히는지 본다
    var m = document.getElementById('avatarLevelUpModal');
    if (m && v && typeof S.openAvatarLevelUpModal === 'function') { S.openAvatarLevelUpModal(2); var opened = m.style.display; v.click(); r.closeWiring = { displayAfterOpen: opened, displayAfterClick: m.style.display }; } else r.closeWiring = { skipped: true };
    return r; });
  // 템플릿 하위 탭 넷 · 피드 캐시: 종류와 쓰기 왕복(상태 탐침과 같은 것을 한 번 더)
  out.vars = {};
  ['_subtabTplCat', '_subtabTplQuery', '_subtabTplDomain', '_subtabTplType', 'FEED_POSTS_CACHE'].forEach(function (n) { out.vars[n] = guard(function () { var v = S[n]; return Object.assign(meta(n), { valueKind: v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v, value: typeof v === 'string' ? v : undefined, windowHas: n in window, windowSame: n in window ? window[n] === v : null, write: tryWrite(n) }); }); });
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
  const exceptions = [], consoleErrors = [], steps = [];
  let browser = null, result = null, tabs = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push(String((d && d.exception && d.exception.description) || (d && d.text) || 'exception').split('\n')[0].slice(0, 200)); });
    page.on('Runtime.consoleAPICalled', p => { if (p && p.type === 'error') consoleErrors.push((p.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ').slice(0, 200)); });
    await page.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + spy.toString() + ')(' + JSON.stringify(FAKE) + ');' });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; steps.push({ step: 'goto', ok: true });
    if (!FAKE) {
      const flow = [{ wait: '#btnLandingPreviewDirect', click: true, timeoutMs: 15000, required: true }, { wait: '#btnAvatarGreetClose', click: true, timeoutMs: 10000, required: false }, { wait: '.navbtn[data-tab="home"]', click: false, timeoutMs: 10000, required: true }];
      for (const f of flow) {
        const pt = await waitVisible(page, f.wait, f.timeoutMs);
        if (!pt) { steps.push({ step: f.wait, ok: false }); if (f.required) throw new Error('게스트 부팅 단계 실패: ' + f.wait); continue; }
        if (f.click) await realClick(page, pt);
        steps.push({ step: f.wait, ok: true }); await sleep(600);
      }
      // 여섯 탭을 차례로 눌러 본다(덫에 걸리는 name 읽기가 있는지 보려는 것)
      tabs = await evalJson(page, '(function(){return Array.prototype.map.call(document.querySelectorAll(".navbtn[data-tab]"),function(b){return b.getAttribute("data-tab");});})()');
      for (const t of tabs) { const pt = await waitVisible(page, '.navbtn[data-tab="' + t + '"]', 5000); if (pt) { await realClick(page, pt); await sleep(500); } steps.push({ step: 'tab:' + t, ok: !!pt }); }
      const home = await waitVisible(page, '.navbtn[data-tab="home"]', 5000); if (home) { await realClick(page, home); await sleep(400); }
    } else { await sleep(4000); }
    await sleep(1200);
    result = await evalJson(page, '(' + read.toString() + ')(' + JSON.stringify(FAKE) + ')', 30000);
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const out = { tool: 'reports/TASK-ES-673/tools/handle-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님', mode: FAKE ? '가짜 연결 라이브러리(부팅만 — 게스트 진입 단계 없음)' : '게스트 부팅 + 여섯 탭', startedAt, endedAt: new Date().toISOString(), app: APP,
    limits: '임시 브라우저에서 쟀다. 관측 조각은 페이지가 뜨기 전에 window 에 심은 것이고 제품 파일은 그대로다. 법정 브라우저가 외부 통신을 막아 진짜 서버 연결은 만들어지지 않는다 — 가짜 연결 라이브러리 방식은 「null 이 아닌 값이 같은 길로 닿는가」만 보여 주고 서버 동작은 재지 못한다.',
    boot: { ok: !error, error, steps, tabs, exceptions, consoleErrors: consoleErrors.length }, result };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: !error, error, exceptions: exceptions.length, consoleErrors: consoleErrors.length, sb: result && result.sb && { accessor: result.sb.accessor, kind: result.sb.valueKind, write: result.sb.write }, share: result && result.shareContent && { name: result.shareContent.nameSeenAtAssign, reads: result.shareContent.nameReadsAfterCalls, err: result.shareContent.error } }));
  process.exit(error ? 1 : 0);
})();
