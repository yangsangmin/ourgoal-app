#!/usr/bin/env node
'use strict';
// 전 구간 대조 2회차 — 「돌아온 로그인 사용자」 부팅 탐침(작업자 측정, 판정 아님). 읽기 전용.
// 왜: 화면 시나리오·법정 탐침은 외부 통신이 막혀 연결 라이브러리가 없다(sb = null). 그래서 「연결 만들기 → 인증 수신기 걸기」 사이에
//     스크립트 경계가 새로 생겼을 때 진짜 라이브러리가 그 사이에 무엇을 하는지는 보이지 않는다. 이 탐침은 저장소에 설치된 진짜 연결 라이브러리
//     (node_modules/@supabase/supabase-js/dist/umd/supabase.js — 페이지가 뜨기 전에 심는다. 제품 파일은 건드리지 않는다)와
//     임시 브라우저의 저장소에 넣은 가짜 세션(만료 전, 통신 없이 복구되는 길)으로 부팅을 재서, 인증 사건이 누구에게 언제 전달되는지를 적는다.
// 사건:
//   CREATE                     연결 만들기(createClient)가 불린 순간
//   REG:<n>                    인증 수신기가 걸린 순간(n 번째) — 건 스크립트
//   NOTIFY:<사건>:subs=<수>:<queued|direct>   라이브러리가 수신기들에게 알리려는 순간 — 그때 걸려 있던 수신기 수, 초기화 중 대기열에 넣었는지
//   EV:<사건>:listener<n>:<session|null>      수신기 n 이 사건을 받은 순간
//   INITDONE                   라이브러리 초기화 약속이 끝난 순간
//   CALL:restoreSessionAndEnter 세션 복원 진입 함수가 불린 순간
// 사용: NODE_PATH=<node_modules> node auth-race.cjs <법정 코드가 든 트리> <재는 트리> <out.json> [--no-session] [--wait=ms] [--lib=<브라우저용 묶음 파일>]
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
const ROOT = path.resolve(argv[0] || '.'), APP = path.resolve(argv[1] || '.'), OUT = argv[2], NOSESSION = argv.includes('--no-session');
const WAIT = Number((argv.find(a => a.indexOf('--wait=') === 0) || '--wait=6000').slice(7));
if (!OUT) { console.error('사용: node auth-race.cjs <법정 트리> <재는 트리> <out.json> [--no-session]'); process.exit(2); }
const C = p => require(path.join(ROOT, 'court', 'lib', p));
const { launch, sleep } = C('chrome.js');
const server = C('static-server.js'), siteHost = C('site-host.js');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'court', 'config.json'), 'utf8'));
const LIBARG = (argv.find(x => x.indexOf('--lib=') === 0) || '').slice(6);
const UMD = LIBARG ? path.resolve(LIBARG) : path.join(ROOT, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js');
const umdSrc = fs.readFileSync(UMD, 'utf8');
const libVersion = LIBARG ? ((umdSrc.slice(0, 600).match(/supabase-js@([0-9.]+)/) || [])[1] || path.basename(LIBARG)) + ' (CDN 에서 내려받은 파일)' : JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', '@supabase', 'supabase-js', 'package.json'), 'utf8')).version + ' (node_modules)';
// 저장 열쇠 이름을 만들 프로젝트 이름(서버 주소의 첫 마디) — 값은 결과 파일에 적지 않는다
const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const hostM = html.match(/SUPABASE_URL\s*=\s*['"]https?:\/\/([0-9a-z-]+)\./);
const REF = hostM ? hostM[1] : null;

function spy(REF, SEED) {
  var ev = window.__ar = { events: [], errors: [], t0: performance.now() };
  var cur = function () { try { var s = document.currentScript; if (!s) return 'none'; var src = s.getAttribute('src'); return src ? src : 'inline'; } catch (e) { return 'err'; } };
  var log = function (t, more) { var o = { e: t, script: cur(), ms: Math.round((performance.now() - ev.t0) * 10) / 10 }; if (more) for (var k in more) o[k] = more[k]; ev.events.push(o); };
  ev.log = log;
  if (SEED && REF) {
    try {
      var b64 = function (o) { return btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
      var now = Math.floor(Date.now() / 1000);
      var uid = '00000000-0000-4000-8000-000000000001';
      var tok = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: uid, aud: 'authenticated', role: 'authenticated', exp: now + 86400, iat: now, email: 'probe@example.invalid' }) + '.' + 'c2lnbmF0dXJlLW5vdC1yZWFs';
      var sess = { access_token: tok, token_type: 'bearer', expires_in: 86400, expires_at: now + 86400, refresh_token: 'probe-refresh-token', user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'probe@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() } };
      localStorage.setItem('sb-' + REF + '-auth-token', JSON.stringify(sess));
      ev.seeded = true;
    } catch (e) { ev.errors.push('seed:' + (e && e.message)); }
  }
  // 키트 — restoreSessionAndEnter 호출을 적는다(읽을 때 감싼 함수를 준다)
  var wraps = new WeakMap(), callN = 0;
  var WATCH = { restoreSessionAndEnter: 1, runAppBoot: 1 };
  ['OurgoalUiHelpers', 'OurgoalSettingsKit'].forEach(function (kitName) {
    var kitProxy;
    Object.defineProperty(window, kitName, { configurable: true, enumerable: true, get: function () { return kitProxy; }, set: function (v) {
      if (v === kitProxy) return;
      kitProxy = (v && typeof v === 'object') ? new Proxy(v, { get: function (t, k) { var val = Reflect.get(t, k, t); if (typeof k === 'string' && WATCH[k] && typeof val === 'function') { var w = wraps.get(val); if (!w) { w = function () { var a0 = arguments[0]; var n = ++callN; var S = window.OurgoalAppScope && window.OurgoalAppScope.scope; var entering = null; try { entering = S ? !!S._isEnteringApp : null; } catch (e) {} log('CALL:' + k + '#' + n, { hasSession: !!(a0 && a0.user), enteringBefore: entering }); var r = val.apply(this, arguments); if (r && typeof r.then === 'function') r.then(function (x) { log('RET:' + k + '#' + n + ':' + String(x)); }, function (e) { log('THROW:' + k + '#' + n + ':' + String(e && e.message).slice(0, 80)); }); return r; }; wraps.set(val, w); } return w; } return val; } }) : v;
    } });
  });
}
function afterLib() { // 진짜 라이브러리가 window.supabase 를 만든 직후 — 연결 만들기를 감싼다
  var ev = window.__ar, log = ev.log;
  try {
    var sup = window.supabase; if (!sup || typeof sup.createClient !== 'function') { ev.errors.push('no-lib'); return; }
    var orig = sup.createClient; var regN = 0;
    var wrapped = function () {
      log('CREATE', { args: arguments.length });
      var client = orig.apply(this, arguments);
      try {
        var auth = client.auth; ev.client = client;
        var oReg = auth.onAuthStateChange, oNotify = auth._notifyAllSubscribers;
        auth.onAuthStateChange = function (cb) { var n = ++regN; log('REG:' + n, { subsBefore: auth.stateChangeEmitters ? auth.stateChangeEmitters.size : null, initQueueOpen: auth._pendingInitNotifications !== null && auth._pendingInitNotifications !== undefined });
          return oReg.call(auth, function (event, session) { log('EV:' + event + ':listener' + n + ':' + (session && session.user ? 'session' : 'null')); return cb.apply(this, arguments); }); };
        if (typeof oNotify === 'function') auth._notifyAllSubscribers = function (event, session, broadcast) { var q = auth._pendingInitNotifications !== null && auth._pendingInitNotifications !== undefined && broadcast !== false; log('NOTIFY:' + event + ':subs=' + (auth.stateChangeEmitters ? auth.stateChangeEmitters.size : '?') + ':' + (q ? 'queued' : 'direct')); return oNotify.apply(auth, arguments); };
        else ev.errors.push('no-_notifyAllSubscribers');
        if (auth.initializePromise && auth.initializePromise.then) auth.initializePromise.then(function () { log('INITDONE', { subs: auth.stateChangeEmitters ? auth.stateChangeEmitters.size : null }); });
        ev.lockMode = auth.lock == null ? 'lockless' : (auth.lock && auth.lock.name) || 'custom';
      } catch (e) { ev.errors.push('wrap:' + (e && e.message)); }
      return client;
    };
    sup.createClient = wrapped;
  } catch (e) { ev.errors.push('afterLib:' + (e && e.message)); }
}
function read() {
  var ev = window.__ar, S = window.OurgoalAppScope && window.OurgoalAppScope.scope;
  var vis = function (sel) { try { var el = document.querySelector(sel); if (!el) return null; var r = el.getBoundingClientRect(); var cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; } catch (e) { return 'err'; } };
  var out = { events: ev.events, errors: ev.errors, seeded: !!ev.seeded, lockMode: ev.lockMode || null };
  try { out.end = { pendingAuthSession: S ? (S._pendingAuthSession ? (S._pendingAuthSession.user ? 'session' : 'object') : String(S._pendingAuthSession)) : null,
    profile: S && S.state ? (S.state.profile ? (S.state.profile.id ? 'profile:id' : 'profile') : String(S.state.profile)) : null,
    landingVisible: vis('#landingScreen'), authVisible: vis('#authScreen'), profileIsProbeUser: !!(S && S.state && S.state.profile && S.state.profile.id === '00000000-0000-4000-8000-000000000001'), entering: S ? !!S._isEnteringApp : null, navVisible: vis('.navbtn[data-tab="home"]'), bodyClass: document.body.className.slice(0, 120),
    openModals: Array.prototype.slice.call(document.querySelectorAll('.modal.open, .modal.show, .modal-backdrop.open, [role="dialog"]')).filter(function (m) { try { return getComputedStyle(m).display !== 'none'; } catch (e) { return false; } }).map(function (m) { return m.id || m.className.slice(0, 40); }).slice(0, 8),
    toasts: Array.prototype.slice.call(document.querySelectorAll('.toast, #toast')).map(function (t) { return (t.textContent || '').trim().slice(0, 60); }).filter(Boolean).slice(0, 5),
    storageHasSession: (function () { try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) return true; } return false; } catch (e) { return 'err'; } })() }; } catch (e) { out.endError = e && e.message; }
  return out;
}
(async () => {
  const startedAt = new Date().toISOString();
  const srv = await server.start(APP, cfg.denyServePrefixes || []);
  const siteUrl = siteHost.siteUrlFor(siteHost.pickSiteHost(cfg), srv.port);
  const exceptions = [], consoleErrors = [];
  let browser = null, result = null, error = null;
  try {
    browser = await launch({ allowHosts: cfg.allowHosts || [], siteOrigin: siteUrl, locale: cfg.locale, viewport: { width: 430, height: 932 } });
    const page = browser.page;
    await page.send('Page.enable'); await page.send('Runtime.enable');
    page.on('Runtime.exceptionThrown', p => { const d = p && p.exceptionDetails; exceptions.push(String((d && d.exception && d.exception.description) || (d && d.text) || 'exception').split('\n')[0].slice(0, 200)); });
    page.on('Runtime.consoleAPICalled', p => { if (p && p.type === 'error') consoleErrors.push(String(((p.args || [])[0] || {}).value || ((p.args || [])[0] || {}).description || '').slice(0, 160)); });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: 'if (window.top === window) { (' + spy.toString() + ')(' + JSON.stringify(REF) + ',' + JSON.stringify(!NOSESSION) + ');\n' + umdSrc + '\n;(' + afterLib.toString() + ')(); }' });
    const loaded = new Promise(res => { page.on('Page.loadEventFired', () => res()); setTimeout(res, 20000); });
    await page.send('Page.navigate', { url: siteUrl + '/index.html' });
    await loaded; await sleep(WAIT);
    const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify((' + read.toString() + ')())', returnByValue: true, awaitPromise: true }, 20000);
    if (r.exceptionDetails) throw new Error('페이지 평가 오류: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || ''));
    result = JSON.parse(r.result.value);
  } catch (e) { error = (e && e.message) || String(e); }
  finally { if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패 무시 */ } } try { await srv.close(); } catch (_) { /* 무시 */ } }
  let summary = null;
  if (result) {
    const E = result.events; const idx = t => E.findIndex(x => x.e.indexOf(t) === 0);
    const firstNotifySignedIn = E.find(x => x.e.indexOf('NOTIFY:SIGNED_IN') === 0 && /:direct$/.test(x.e));
    summary = { line: E.map(x => x.e), scripts: E.map(x => x.script),
      regs: E.filter(x => x.e.indexOf('REG:') === 0).map(x => ({ e: x.e, script: x.script, initQueueOpen: x.initQueueOpen })),
      index: { create: idx('CREATE'), reg1: idx('REG:1'), reg2: idx('REG:2'), initDone: idx('INITDONE'), firstSignedInDelivery: firstNotifySignedIn ? E.indexOf(firstNotifySignedIn) : -1 },
      signedInDeliveredWithSubs: firstNotifySignedIn ? Number((firstNotifySignedIn.e.match(/subs=(\d+)/) || [])[1]) : null,
      received: E.filter(x => x.e.indexOf('EV:') === 0).map(x => x.e.slice(3)),
      receivedSignedIn: E.filter(x => x.e.indexOf('EV:SIGNED_IN') === 0).length,
      restoreCalls: E.filter(x => x.e.indexOf('CALL:restoreSessionAndEnter') === 0).length, restoreCallDetail: E.filter(x => /^(CALL|RET|THROW):restoreSessionAndEnter/.test(x.e)).map(x => x.e + (x.enteringBefore === undefined ? '' : ':enteringBefore=' + x.enteringBefore) + '@' + x.script),
      initDoneBeforeReg1: idx('INITDONE') >= 0 && idx('REG:1') >= 0 && idx('INITDONE') < idx('REG:1'),
      end: result.end, seeded: result.seeded, lockMode: result.lockMode, spyErrors: result.errors };
  }
  const out = { tool: 'whole-run/run2/tools/auth-race.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 측정, 판정 아님',
    mode: NOSESSION ? '저장된 세션 없음(대조군)' : '저장된 가짜 세션 있음(만료 전 — 통신 없이 복구되는 길)',
    limits: '진짜 서버와는 통신하지 않는다(법정 브라우저가 외부 통신을 막는다). 연결 라이브러리는 저장소에 설치된 판(' + libVersion + ')을 페이지가 뜨기 전에 심었다 — 운영 화면이 CDN 에서 받는 판과 같은지는 재지 않았다. 세션은 가짜라서 그 뒤의 서버 조회는 모두 실패한다(두 트리 같은 조건). 그래서 이 탐침이 재는 것은 「인증 사건이 누구에게 전달되는가 · 복원 진입 함수가 몇 번 불리는가」까지다.',
    app: APP, libVersion, startedAt, endedAt: new Date().toISOString(), waitMs: WAIT, boot: { ok: !error, error, exceptions, consoleErrors }, summary, events: result && result.events };
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
  console.log(JSON.stringify({ ok: !error, error, lib: libVersion, exceptions: exceptions.length, consoleErrors: consoleErrors.length, seeded: summary && summary.seeded, lockMode: summary && summary.lockMode, line: summary && summary.line, regScripts: summary && summary.regs.map(r => r.script), index: summary && summary.index, signedInDeliveredWithSubs: summary && summary.signedInDeliveredWithSubs, receivedSignedIn: summary && summary.receivedSignedIn, restoreCalls: summary && summary.restoreCalls, restoreCallDetail: summary && summary.restoreCallDetail, end: summary && summary.end, spyErrors: summary && summary.spyErrors }));
  process.exit(error ? 1 : 0);
})();
