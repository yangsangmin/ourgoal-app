#!/usr/bin/env node
'use strict';
// 스크립트 파일 하나가 안 올 때(404) 화면이 어떤 상태인지 적는 탐침(작업자 측정, 판정 아님). 읽기 전용.
// 운영에서 새 index.html 과 캐시된 옛 파일이 어긋나는 순간을 가늠하려는 것이다 — 고치자는 것이 아니라 사실 기록.
// CDP Fetch 로 주소에 <pattern> 이 든 요청 하나만 404 로 돌려준다. 그 뒤: 예외 · 콘솔 오류 · 랜딩 화면이 보이는지 · 「로그인 없이 둘러보기」 단추를 눌렀을 때 앱으로 들어가는지 · 통로/상태 이름 수 · data-theme.
// 사용: NODE_PATH=<node_modules> node missing-file.cjs <법정 코드가 든 트리> <재는 트리> <out.json> [--fail-pattern=<주소 일부>]   (패턴을 안 주면 대조군 — 아무것도 막지 않는다)
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const ROOT = path.resolve(argv[0] || '.'), APP = path.resolve(argv[1] || '.'), OUT = argv[2];
const PATTERN = ((argv.find(a => a.indexOf('--fail-pattern=') === 0) || '').slice(15)) || null;
if (!OUT) { console.error('사용: node missing-file.cjs <법정 트리> <재는 트리> <out.json> [--fail-pattern=…]'); process.exit(2); }
const C = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js'), siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));
function state() {
  var vis = function (sel) { try { var el = document.querySelector(sel); if (!el) return null; var cs = getComputedStyle(el), r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; } catch (e) { return 'err'; } };
  var S = window.OurgoalAppScope && window.OurgoalAppScope.scope, ST = window.OurgoalAppState;
  return { landingVisible: vis('#landingScreen'), authVisible: vis('#authScreen'), previewButtonVisible: vis('#btnLandingPreviewDirect'), homeTabVisible: vis('.navbtn[data-tab="home"]'), greetCloseVisible: vis('#btnAvatarGreetClose'),
    scopeNames: S ? Object.keys(S).length : null, organNames: ST && ST.names ? ST.names().length : null, sbInOrgan: ST && ST.names ? ST.names().indexOf('sb') >= 0 : null,
    typeofServerUrl: typeof window.SUPABASE_URL, typeofServerKey: typeof window.SUPABASE_ANON_KEY, dataTheme: document.documentElement.getAttribute('data-theme'), readyState: document.readyState,
    bodyTextStart: (document.body && document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
}
(async () => {
  const startedAt = new Date().toISOString();
  const srv = await server.start(APP, cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [], consoleErrors = []; let browser = null, result = null, error = null, failed = 0;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push(String((d && d.exception && d.exception.description) || (d && d.text) || 'exception').split('\n')[0].slice(0, 200)); });
    page.on('Runtime.consoleAPICalled', p => { if (p && p.type === 'error') consoleErrors.push(String(((p.args || [])[0] || {}).value || ((p.args || [])[0] || {}).description || '').slice(0, 160)); });
    if (PATTERN) { await page.send('Fetch.enable', { patterns: [{ urlPattern: '*' + PATTERN + '*', requestStage: 'Request' }] }); page.on('Fetch.requestPaused', p => { failed++; page.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 404, responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }], body: Buffer.from('Not Found').toString('base64') }).catch(() => {}); }); }
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; await sleep(2500);
    const ev = async expr => { const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, 20000); if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || '')); return r.result.value; };
    const before = JSON.parse(await ev('JSON.stringify((' + state.toString() + ')())'));
    const exBefore = exceptions.length;
    // 「로그인 없이 둘러보기」를 눌러 본다(있을 때만)
    const clicked = await ev('(function(){ var b = document.querySelector("#btnLandingPreviewDirect"); if (!b) return "없음"; try { b.click(); return "누름"; } catch (e) { return "예외:" + e.message; } })()');
    await sleep(2500);
    const after = JSON.parse(await ev('JSON.stringify((' + state.toString() + ')())'));
    result = { before, clicked, after, exceptionsAtLoad: exBefore, exceptionsAfterClick: exceptions.length - exBefore, enteredApp: after.landingVisible === false && (after.homeTabVisible === true || after.greetCloseVisible === true) };
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const out = { tool: 'reports/TASK-ES-691/tools/missing-file.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님',
    limits: '로컬 정적 서버 · 임시 headless 브라우저 · 게스트. 서비스 워커 캐시는 끼지 않는다(임시 브라우저의 첫 방문이다). 한 파일만 404 로 돌려준 상태를 본 것이며, 운영에서 실제로 그런 순간이 얼마나 생기는지는 재지 않았다.',
    app: APP, failPattern: PATTERN, requestsFailed: failed, startedAt, endedAt: new Date().toISOString(), boot: { ok: !error, error, exceptions, consoleErrors }, result };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: !error, error, pattern: PATTERN, failed, ex: exceptions.length, firstEx: exceptions[0] || null, cerr: consoleErrors.length, before: result && { landing: result.before.landingVisible, scope: result.before.scopeNames, organ: result.before.organNames, theme: result.before.dataTheme, url: result.before.typeofServerUrl }, clicked: result && result.clicked, enteredApp: result && result.enteredApp, after: result && { landing: result.after.landingVisible, home: result.after.homeTabVisible, greet: result.after.greetCloseVisible } }));
  process.exit(error ? 1 : 0);
})();
