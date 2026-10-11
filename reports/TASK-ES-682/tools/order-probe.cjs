#!/usr/bin/env node
'use strict';
// #TASK-ES-682 시점 탐침(작업자 측정 도구, 판정 아님) — 구역 이전이 옮긴 문들이 「같은 때」에 도는지를 사건의 순서로 잰다.
// 페이지가 뜨기 전에 관측 조각을 심어(제품 파일은 건드리지 않는다) 부팅 동안 일어나는 일을 차례로 적는다:
//   D:<define|defineVar>:<이름>   상태 기관이 이름을 맡는 순간(window.OurgoalAppState.define / defineVar 호출)
//   E:<주인>:<이름 수>            통로에 접근자가 달리는 순간(window.OurgoalAppScope.expose 호출 — 상태 기관이 다는 것 포함)
//   W:<이름>                      window 에 그 이름이 대입되는 순간(shareContent · saveGoogleToken · SHARED_GROUPS_LOADED · MOCK_GROUPS · sb · OURGOAL_CONFIG · state)
//   C:createClient                (--fake-client 일 때만) 가짜 연결 라이브러리의 연결 만들기가 불리는 순간
// 기준 트리와 작업 트리의 사건 줄이 글자 그대로 같으면, 옮긴 정의 줄·window 복사 줄이 다른 모든 정의·노출·대입과의 앞뒤 관계를 그대로 지킨 것이다.
// 사건마다 그 순간 통로에 달려 있던 이름 수도 함께 적는다(scopeNames) — 사건 사이에 낀 것이 없음을 한 번 더 본다.
// 법정의 브라우저·정적 서버·호스트 이름 라이브러리(court/lib/*)는 읽기만 한다. 외부 통신은 법정 브라우저가 막는다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-682/tools/order-probe.cjs <APP_DIR> <out.json> [--fake-client]
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const APP = path.resolve(argv[0] || '.'), OUT = argv[1], FAKE = argv.includes('--fake-client');
if (!OUT) { console.error('사용: node order-probe.cjs <APP_DIR> <out.json> [--fake-client]'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..', '..');
const C = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js'), siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));

function spy(FAKE) { // 페이지가 뜨기 전에 도는 관측 조각
  var ev = window.__o682 = { events: [], errors: [] };
  var scopeObj = null;
  var count = function () { try { return scopeObj ? Object.keys(scopeObj.scope).length : null; } catch (e) { return null; } };
  var log = function (t) { ev.events.push({ e: t, scopeNames: count() }); };
  var stateObj, scopeHolder;
  Object.defineProperty(window, 'OurgoalAppState', { configurable: true, enumerable: true, get: function () { return stateObj; }, set: function (v) {
    stateObj = v;
    try { ['define', 'defineVar'].forEach(function (k) { if (v && typeof v[k] === 'function' && !v[k].__o682) { var o = v[k]; var w = function (name) { log('D:' + k + ':' + name); return o.apply(this, arguments); }; w.__o682 = true; v[k] = w; } }); } catch (e) { ev.errors.push('state:' + (e && e.message)); }
  } });
  Object.defineProperty(window, 'OurgoalAppScope', { configurable: true, enumerable: true, get: function () { return scopeHolder; }, set: function (v) {
    scopeHolder = v; scopeObj = v;
    try { if (v && typeof v.expose === 'function' && !v.expose.__o682) { var o = v.expose; var w = function (owner, obj) { var n = 0; try { n = Object.keys(obj || {}).length; } catch (e) { n = -1; } log('E:' + owner + ':' + n); return o.apply(this, arguments); }; w.__o682 = true; v.expose = w; } } catch (e) { ev.errors.push('scope:' + (e && e.message)); }
  } });
  ['shareContent', 'saveGoogleToken', 'SHARED_GROUPS_LOADED', 'MOCK_GROUPS', 'sb', 'OURGOAL_CONFIG', 'state'].forEach(function (n) { var cur; Object.defineProperty(window, n, { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { log('W:' + n); cur = v; } }); });
  if (FAKE) {
    var mk = function () { var f = function () {}; var p = new Proxy(f, { get: function (t, k) { if (k === 'then' || typeof k !== 'string') return undefined; if (k === 'toJSON') return function () { return null; }; return child; }, apply: function () { return child; }, construct: function () { return child; } }); return p; };
    var child = mk(), client = mk(); ev.fake = client;
    window.supabase = { createClient: function () { log('C:createClient'); return client; } };
  }
}
function read(FAKE) {
  var ev = window.__o682, S = window.OurgoalAppScope && window.OurgoalAppScope.scope, ST = window.OurgoalAppState;
  var first = function (t) { for (var i = 0; i < ev.events.length; i++) if (ev.events[i].e === t) return i; return -1; };
  var out = { events: ev.events.map(function (x) { return x.e; }), scopeNamesAt: ev.events.map(function (x) { return x.scopeNames; }), errors: ev.errors, total: ev.events.length,
    defines: ev.events.filter(function (x) { return x.e.indexOf('D:') === 0; }).map(function (x) { return x.e.slice(2); }),
    windowSets: ev.events.filter(function (x) { return x.e.indexOf('W:') === 0; }).map(function (x) { return x.e.slice(2); }),
    organNames: ST && ST.names ? ST.names().length : null, scopeNamesEnd: S ? Object.keys(S).length : null,
    indexOf: { sb: first('D:define:sb'), btnAvLvClose: first('D:define:btnAvLvClose'), _subtabTplCat: first('D:defineVar:_subtabTplCat'), _subtabTplQuery: first('D:defineVar:_subtabTplQuery'), _subtabTplDomain: first('D:defineVar:_subtabTplDomain'), _subtabTplType: first('D:defineVar:_subtabTplType'), MOCK_GROUPS: first('D:define:MOCK_GROUPS'), shareContent: first('D:define:shareContent'), FEED_POSTS_CACHE: first('D:defineVar:FEED_POSTS_CACHE'), state: first('D:defineVar:state'), windowState: first('W:state'), _promptEncyclopediaOpen: first('D:defineVar:_promptEncyclopediaOpen'), createClient: first('C:createClient') } };
  if (FAKE) out.fake = { scopeSbIsFake: !!S && S.sb === ev.fake, createClientBeforeDefineSb: out.indexOf.createClient >= 0 && out.indexOf.createClient < out.indexOf.sb, eventsBetween: out.indexOf.sb - out.indexOf.createClient - 1 };
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
  const out = { tool: 'reports/TASK-ES-682/tools/order-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님', mode: FAKE ? '가짜 연결 라이브러리(부팅만)' : '부팅만(게스트 진입 전)', startedAt, endedAt: new Date().toISOString(), app: APP,
    limits: '임시 브라우저에서 페이지를 띄우고 3.5초 뒤까지의 사건을 적었다(게스트 진입 단추는 누르지 않는다). 관측 조각은 페이지가 뜨기 전에 window 에 심은 것이고 제품 파일은 그대로다. 외부 통신이 막혀 진짜 서버 연결은 만들어지지 않는다.',
    boot: { ok: !error, error, exceptions }, result };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: !error, error, exceptions: exceptions.length, total: result && result.total, defines: result && result.defines.length, windowSets: result && result.windowSets, indexOf: result && result.indexOf, errors: result && result.errors, fake: result && result.fake }));
  process.exit(error ? 1 : 0);
})();
