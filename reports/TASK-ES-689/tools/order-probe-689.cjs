#!/usr/bin/env node
'use strict';
// #TASK-ES-689 시점 탐침(작업자 측정 도구, 판정 아님) — 인라인 IIFE 의 시동 문을 부팅 파일로 옮긴 뒤에도 「같은 차례」로 도는지를 사건의 순서로 잰다.
// reports/TASK-ES-682/tools/order-probe.cjs 를 본떠 한 가지를 더했다: 구역 함수(키트의 boot… 함수)가 불리는 순간.
// 페이지가 뜨기 전에 관측 조각을 심어(제품 파일은 건드리지 않는다) 부팅 동안 일어나는 일을 차례로 적는다:
//   B:<구역 함수 이름>            구역 함수가 불리는 순간(키트 window.OurgoalUiHelpers 의 boot… 속성을 읽어 간 쪽이 부를 때)
//   D:<define|defineVar>:<이름>   상태 기관이 이름을 맡는 순간(window.OurgoalAppState.define / defineVar 호출)
//   E:<주인>:<이름 수>            통로에 접근자가 달리는 순간(window.OurgoalAppScope.expose 호출 — 상태 기관이 다는 것 포함)
//   W:<이름>                      window 에 그 이름이 대입되는 순간
//   C:createClient                (--fake-client 일 때만) 가짜 연결 라이브러리의 연결 만들기가 불리는 순간
// (script 태그의 실행 경계는 사건으로 넣지 않는다 — 작업 트리에만 있는 사건이 생기면 맞댈 수 없다.)
// 기준 트리와 작업 트리의 사건 줄이 글자 그대로 같으면, 테마 적용 → 서버 연결 세 문 → 나머지 구역 함수 호출의 차례와 그 사이의 모든 정의·노출·대입의 앞뒤가 그대로다.
// 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다. 외부 통신은 법정 브라우저가 막는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-689/tools/order-probe-689.cjs <APP_DIR> <out.json> [--fake-client]
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const APP = path.resolve(argv[0] || '.'), OUT = argv[1], FAKE = argv.includes('--fake-client');
if (!OUT) { console.error('사용: node order-probe-689.cjs <APP_DIR> <out.json> [--fake-client]'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..', '..');
const C = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js'), siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));

function spy(FAKE) { // 페이지가 뜨기 전에 도는 관측 조각
  var ev = window.__o689 = { events: [], errors: [] };
  var scopeObj = null;
  var count = function () { try { return scopeObj ? Object.keys(scopeObj.scope).length : null; } catch (e) { return null; } };
  var log = function (t) { ev.events.push({ e: t, scopeNames: count() }); };
  var stateObj, scopeHolder, kitRaw, kitProxy, wrappers = {};
  Object.defineProperty(window, 'OurgoalAppState', { configurable: true, enumerable: true, get: function () { return stateObj; }, set: function (v) {
    stateObj = v;
    try { ['define', 'defineVar'].forEach(function (k) { if (v && typeof v[k] === 'function' && !v[k].__o689) { var o = v[k]; var w = function (name) { log('D:' + k + ':' + name); return o.apply(this, arguments); }; w.__o689 = true; v[k] = w; } }); } catch (e) { ev.errors.push('state:' + (e && e.message)); }
  } });
  Object.defineProperty(window, 'OurgoalAppScope', { configurable: true, enumerable: true, get: function () { return scopeHolder; }, set: function (v) {
    scopeHolder = v; scopeObj = v;
    try { if (v && typeof v.expose === 'function' && !v.expose.__o689) { var o = v.expose; var w = function (owner, obj) { var n = 0; try { n = Object.keys(obj || {}).length; } catch (e) { n = -1; } log('E:' + owner + ':' + n); return o.apply(this, arguments); }; w.__o689 = true; v.expose = w; } } catch (e) { ev.errors.push('scope:' + (e && e.message)); }
  } });
  // 키트: boot… 속성을 읽어 가면 「불릴 때 적는」 겉함수를 준다(값은 원래 함수가 그대로 돌려준다). 다른 속성은 그대로다.
  Object.defineProperty(window, 'OurgoalUiHelpers', { configurable: true, enumerable: true, get: function () { return kitProxy; }, set: function (v) {
    if (v === kitProxy) return;
    kitRaw = v;
    try { kitProxy = (v && typeof v === 'object') ? new Proxy(v, { get: function (t, k, r) { var val = Reflect.get(t, k, t);
      if (typeof k === 'string' && k.indexOf('boot') === 0 && typeof val === 'function') { if (!wrappers[k] || wrappers[k].__of !== val) { var w = function () { log('B:' + k); return val.apply(this, arguments); }; w.__of = val; wrappers[k] = w; } return wrappers[k]; }
      return val; } }) : v; } catch (e) { ev.errors.push('kit:' + (e && e.message)); kitProxy = v; }
  } });
  ['shareContent', 'saveGoogleToken', 'SHARED_GROUPS_LOADED', 'MOCK_GROUPS', 'sb', 'OURGOAL_CONFIG', 'state'].forEach(function (n) { var cur; Object.defineProperty(window, n, { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { log('W:' + n); cur = v; } }); });
  if (FAKE) {
    var mk = function () { var f = function () {}; var p = new Proxy(f, { get: function (t, k) { if (k === 'then' || typeof k !== 'string') return undefined; if (k === 'toJSON') return function () { return null; }; return child; }, apply: function () { return child; }, construct: function () { return child; } }); return p; };
    var child = mk(), client = mk(); ev.fake = client;
    window.supabase = { createClient: function () { log('C:createClient'); return client; } };
  }
}
function read(FAKE) {
  var ev = window.__o689, S = window.OurgoalAppScope && window.OurgoalAppScope.scope, ST = window.OurgoalAppState;
  var first = function (t) { for (var i = 0; i < ev.events.length; i++) if (ev.events[i].e === t) return i; return -1; };
  var names = ev.events.map(function (x) { return x.e; });
  var boots = names.filter(function (e) { return e.indexOf('B:') === 0; }).map(function (e) { return e.slice(2); });
  var iTheme = first('B:bootApplySavedTheme'), iSb = first('D:define:sb'), nextBootAfterSb = -1;
  for (var i = iSb + 1; iSb >= 0 && i < names.length; i++) if (names[i].indexOf('B:') === 0) { nextBootAfterSb = i; break; }
  var out = { events: names, scopeNamesAt: ev.events.map(function (x) { return x.scopeNames; }), errors: ev.errors, total: names.length,
    bootCalls: boots, bootCallCount: boots.length,
    defines: names.filter(function (e) { return e.indexOf('D:') === 0; }).map(function (e) { return e.slice(2); }),
    windowSets: names.filter(function (e) { return e.indexOf('W:') === 0; }).map(function (e) { return e.slice(2); }),
    organNames: ST && ST.names ? ST.names().length : null, scopeNamesEnd: S ? Object.keys(S).length : null,
    serverLink: { themeCallIndex: iTheme, defineSbIndex: iSb, windowSbIndex: first('W:sb'), createClientIndex: first('C:createClient'), nextBootCallIndex: nextBootAfterSb, nextBootCall: nextBootAfterSb >= 0 ? names[nextBootAfterSb].slice(2) : null,
      bootCallsBeforeDefineSb: names.slice(0, Math.max(iSb, 0)).filter(function (e) { return e.indexOf('B:') === 0; }).map(function (e) { return e.slice(2); }),
      themeThenSbThenRest: iTheme >= 0 && iSb > iTheme && nextBootAfterSb > iSb } };
  if (FAKE) out.fake = { scopeSbIsFake: !!S && S.sb === ev.fake, createClientBeforeDefineSb: out.serverLink.createClientIndex >= 0 && out.serverLink.createClientIndex < iSb, eventsBetween: iSb - out.serverLink.createClientIndex - 1 };
  return out;
}
(async () => {
  const startedAt = new Date().toISOString();
  const srv = await server.start(APP, cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push(String((d && d.exception && d.exception.description) || (d && d.text) || 'exception').split('\n')[0].slice(0, 200)); });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + spy.toString() + ')(' + JSON.stringify(FAKE) + ');' });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; await sleep(3500);
    const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify((' + read.toString() + ')(' + JSON.stringify(FAKE) + '))', returnByValue: true, awaitPromise: true }, 20000);
    if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || ''));
    result = JSON.parse(r.result.value);
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  const out = { tool: 'reports/TASK-ES-689/tools/order-probe-689.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님', mode: FAKE ? '가짜 연결 라이브러리(부팅만)' : '부팅만(게스트 진입 전)', startedAt, endedAt: new Date().toISOString(), app: APP,
    limits: '임시 브라우저에서 페이지를 띄우고 3.5초 뒤까지의 사건을 적었다(게스트 진입 단추는 누르지 않는다). 관측 조각은 페이지가 뜨기 전에 window 에 심은 것이고 제품 파일은 그대로다. 구역 함수 호출은 키트 객체를 감싼 겉객체로 적는다 — 키트에서 boot… 속성을 읽어 간 쪽이 부를 때만 잡힌다(세포 안에서 지역 이름으로 직접 부르는 것은 잡지 않는다 — 기준·작업이 같은 조건이다). 외부 통신이 막혀 진짜 서버 연결은 만들어지지 않는다.',
    boot: { ok: !error, error, exceptions }, result };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: !error, error, exceptions: exceptions.length, total: result && result.total, bootCalls: result && result.bootCallCount, defines: result && result.defines.length, serverLink: result && result.serverLink, errors: result && result.errors, fake: result && result.fake }));
  process.exit(error ? 1 : 0);
})();
