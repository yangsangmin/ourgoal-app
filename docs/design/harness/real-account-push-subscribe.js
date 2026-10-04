'use strict';
// #TASK-ES-400 실계정 푸시 구독 등록·삭제 인증 실측(작업자 보조, 판정 아님).
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api/push-subscribe 는 운영이 아니라 그 사본의 api/push-subscribe.js 처리기를 이 노드 프로세스에서 직접 부른다
// (서버 수정이 아직 운영에 없으므로). 처리기의 토큰 확인(auth.getUser)은 진짜 Supabase 인증 서버에 묻고(공개 anon 키),
// push_subscriptions 표 읽기·쓰기만 이 프로세스 메모리 기록장으로 바꾼다 — 운영 DB 에는 한 줄도 쓰지 않는다.
// 다른 /api/* 는 OG_APP_URL(운영)로 넘긴다(로그인 흐름 유지용).
// 재는 것: ① 앱 syncPushSubscription(진짜 함수·진짜 로그인 세션, 브라우저 푸시 배관만 대역) 요청의 Bearer 유무·응답 코드·기록된 행 주인이 A 인지
//   ② A 페이지에서 직접 보낸 공격 요청: 토큰 없이 B 이름 등록 / A 토큰으로 B 이름 등록 / 토큰 없이 B 구독 삭제 / A 토큰으로 B 구독 삭제
//   ③ 앱 removePushSubscription 요청 ④ 게스트(세션 없음) syncPushSubscription 요청 건수.
// 주소·비밀번호·토큰·uid 는 출력·기록하지 않는다(참거짓만). signOut 은 부르지 않는다(다른 기기 세션 보호).
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-push-subscribe.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), Module = require('module');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [APP, LABEL, OUT] = process.argv.slice(2);
const env = process.env;
for (const k of ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD', 'OG_TEST_B_EMAIL', 'OG_TEST_B_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const isTest = (a) => /ogtest/i.test(a) || allow.includes(String(a).trim().toLowerCase());
if (!isTest(env.OG_TEST_A_EMAIL) || !isTest(env.OG_TEST_B_EMAIL) || env.OG_TEST_A_EMAIL.trim().toLowerCase() === env.OG_TEST_B_EMAIL.trim().toLowerCase()) { console.log('테스트 계정 조건 위반 — 접속 안 함'); process.exitCode = 3; return; }
const UPSTREAM = new URL(env.OG_APP_URL.replace(/\/+$/, ''));
const APPDIR = path.resolve(APP);
const html = fs.readFileSync(path.join(APPDIR, 'index.html'), 'utf8');
const SB_URL = (/var SUPABASE_URL = '([^']+)'/.exec(html) || [])[1];
const SB_ANON = (/var SUPABASE_ANON_KEY = '([^']+)'/.exec(html) || [])[1];
if (!SB_URL || !SB_ANON) { console.log('앱 사본에서 Supabase 공개 설정을 못 읽음'); process.exitCode = 4; return; }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn().catch(() => null); if (v) return v; await wait(500); } return null; }

/* ---------- 로컬 처리기: 토큰 확인은 진짜 인증 서버, 표는 메모리 ---------- */
const memDb = { push_subscriptions: [] };
function realGetUser(token) {
  return new Promise((resolve) => {
    const u = new URL(SB_URL.replace(/\/+$/, '') + '/auth/v1/user');
    const r = https.request({ hostname: u.hostname, port: 443, path: u.pathname, method: 'GET', headers: { apikey: SB_ANON, Authorization: 'Bearer ' + token } }, (resp) => {
      const c = []; resp.on('data', d => c.push(d)); resp.on('end', () => {
        let j = null; try { j = JSON.parse(Buffer.concat(c).toString('utf8')); } catch (e) {}
        if (resp.statusCode === 200 && j && j.id) resolve({ data: { user: { id: j.id } }, error: null });
        else resolve({ data: { user: null }, error: { message: 'auth ' + resp.statusCode } });
      });
    });
    r.on('error', () => resolve({ data: { user: null }, error: { message: 'auth network' } }));
    r.end();
  });
}
function memClient() {
  return {
    auth: { getUser: realGetUser },
    from: function (t) {
      const filters = []; let mode = 'select'; let limitN = null;
      const q = {
        select: function () { return q; },
        eq: function (k, v) { filters.push(r => String(r[k]) === String(v)); return q; },
        limit: function (n) { limitN = n; return q; },
        delete: function () { mode = 'delete'; return q; },
        upsert: async function (row) { const l = memDb[t] = memDb[t] || []; const i = l.findIndex(r => r.endpoint === row.endpoint); if (i >= 0) l[i] = Object.assign({}, l[i], row); else l.push(Object.assign({}, row)); return { error: null }; },
        then: function (res, rej) {
          const l = memDb[t] || []; const hit = l.filter(r => filters.every(f => f(r)));
          if (mode === 'delete') { memDb[t] = l.filter(r => hit.indexOf(r) < 0); return Promise.resolve({ data: null, error: null }).then(res, rej); }
          return Promise.resolve({ data: (limitN != null ? hit.slice(0, limitN) : hit).map(r => Object.assign({}, r)), error: null }).then(res, rej);
        }
      };
      return q;
    }
  };
}
function loadHandler() {
  const file = path.join(APPDIR, 'api', 'push-subscribe.js');
  const orig = Module._load;
  Module._load = function (request) { if (request === '@supabase/supabase-js') return { createClient: memClient }; return orig.apply(this, arguments); };
  try { return require(file); } finally { Module._load = orig; }
}
env.SUPABASE_SERVICE_ROLE_KEY = 'local-harness-placeholder';
const handler = loadHandler();

let uidA = null, uidB = null;
const ownerTag = (uid) => uid == null ? null : uid === uidA ? 'A' : uid === uidB ? 'B' : 'other';
const subLog = [];
function serve(dir) {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        const raw = Buffer.concat(chunks);
        if (p === '/api/push-subscribe' && (req.method === 'POST' || req.method === 'DELETE')) {
          let body = null; try { body = JSON.parse(raw.toString('utf8') || 'null'); } catch (e) {}
          const auth = String(req.headers['authorization'] || '');
          const entry = { method: req.method, hasBearer: auth.indexOf('Bearer ') === 0 && auth.length > 7, bodyUserIdIs: body ? ownerTag(body.userId) : null, endpointMark: body ? String((body.subscription && body.subscription.endpoint) || body.endpoint || '').split('/').pop().slice(0, 40) : null, status: null, error: null };
          subLog.push(entry);
          const r = { statusCode: 200, body: null, headers: {} };
          r.status = c => { r.statusCode = c; return r; }; r.json = b => { r.body = b; return r; }; r.send = b => { r.body = b; return r; }; r.setHeader = (k, v) => { r.headers[k] = v; };
          try { await handler({ method: req.method, url: req.url, headers: req.headers, body: body, query: {} }, r); } catch (e) { r.statusCode = 'handler-throw'; }
          entry.status = r.statusCode;
          entry.error = r.body && typeof r.body.error === 'string' ? r.body.error.slice(0, 80) : null;
          res.writeHead(typeof r.statusCode === 'number' ? r.statusCode : 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(r.body || {}));
          return;
        }
        const up = https.request({ hostname: UPSTREAM.hostname, port: 443, path: req.url, method: req.method, headers: Object.assign({}, req.headers, { host: UPSTREAM.hostname }) }, r => {
          const rc = []; r.on('data', c => rc.push(c)); r.on('end', () => { const buf = Buffer.concat(rc); const h = Object.assign({}, r.headers); delete h['content-encoding']; delete h['transfer-encoding']; h['content-length'] = buf.length; res.writeHead(r.statusCode, h); res.end(buf); });
        });
        up.on('error', () => { res.writeHead(502); res.end(); });
        up.end(raw);
      });
      return;
    }
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 5600 + Math.floor(Math.random() * 300);
  return new Promise(r => s.listen(port, '127.0.0.2', () => r({ s, base: 'http://127.0.0.2:' + port })));
}
const loggedIn = page => page.evaluate(() => { const shell = document.getElementById('appShell'); const p = window.state && window.state.profile; return !!(shell && shell.classList.contains('active') && p && /^[0-9a-f-]{36}$/i.test(String(p.id || ''))); });
async function login(page, base, email, pass) {
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const first = await until(async () => (await loggedIn(page)) ? 'in' : await page.evaluate(() => {
    const a = document.getElementById('authScreen'); if (a && getComputedStyle(a).display !== 'none') return 'auth';
    const l = document.getElementById('landingScreen'); if (l && getComputedStyle(l).display !== 'none' && l.offsetParent !== null) return 'landing';
    return null;
  }), 30000);
  if (first === 'landing') { await page.click('#landLoginLink').catch(() => {}); await until(() => page.evaluate(() => { const a = document.getElementById('authScreen'); return !!(a && getComputedStyle(a).display !== 'none'); }), 8000); }
  if (first !== 'in') { await page.type('#loginUser', email); await page.type('#loginPass', pass); await page.click('#loginSubmit'); }
  return !!(await until(() => loggedIn(page), 30000));
}
async function newPage(browser, base) {
  const bctx = await browser.createBrowserContext();
  await bctx.overridePermissions(base, ['notifications']).catch(() => {});
  const page = await bctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.on('dialog', d => d.accept().catch(() => {}));
  return { bctx, page };
}
/* 브라우저 푸시 배관(서비스워커 ready·pushManager)만 대역으로 바꾼다 — 헤드리스 크롬은 진짜 푸시 서비스 구독을 만들 수 없다. 앱 함수·세션은 진짜. */
async function stubPushPlumbing(page, mark) {
  await page.evaluate((mark) => {
    const sub = { endpoint: 'https://push.example.invalid/' + mark, toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'harness-p256dh', auth: 'harness-auth' } }; }, unsubscribe: async () => true };
    const pm = { getSubscription: async () => sub, subscribe: async () => sub };
    try { Object.defineProperty(navigator.serviceWorker, 'ready', { configurable: true, get: () => Promise.resolve({ pushManager: pm }) }); } catch (e) {}
  }, mark);
}
const appCall = (page, name) => page.evaluate(async (name) => { const sc = window.OurgoalAppScope && window.OurgoalAppScope.scope; const fn = sc && sc[name]; if (typeof fn !== 'function') return 'no-fn'; await fn(); return 'called'; }, name).catch(e => 'error ' + String(e && e.message || e).slice(0, 80));
const probe = (page, method, body, withToken) => page.evaluate(async (method, body, withToken) => {
  const h = { 'Content-Type': 'application/json' };
  if (withToken) { const s = await window.sb.auth.getSession(); const t = s && s.data && s.data.session && s.data.session.access_token; if (t) h.Authorization = 'Bearer ' + t; }
  const r = await fetch('/api/push-subscribe', { method, headers: h, body: JSON.stringify(body) }).catch(() => null);
  return r ? r.status : null;
}, method, body, withToken);
const rowOwner = (mark) => { const r = memDb.push_subscriptions.find(x => String(x.endpoint).endsWith('/' + mark)); return r ? ownerTag(r.user_id) : null; };

(async () => {
  const runTag = 'ogtest-es400-' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + '-' + Math.random().toString(36).slice(2, 6);
  const { s, base } = await serve(APPDIR);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, runTag, env: 'local 127.0.0.2 static + /api/push-subscribe = local handler of this copy (auth.getUser real Supabase, table in memory) · other /api forwarded to production · test accounts A·B (addresses hidden)', steps: [] };
  const step = (name, ok, evidence) => { out.steps.push({ name, ok: !!ok, evidence }); console.log((ok ? '  ok · ' : '  다름 · ') + name + ' ' + JSON.stringify(evidence)); };
  try {
    const b = await newPage(browser, base);
    const bOk = await login(b.page, base, env.OG_TEST_B_EMAIL.trim(), env.OG_TEST_B_PASSWORD);
    if (bOk) uidB = await b.page.evaluate(() => String(window.state.profile.id));
    await b.page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await b.bctx.close().catch(() => {});
    step('B 로그인(uid 읽기)', bOk && !!uidB, { loggedIn: bOk });
    if (!uidB) throw new Error('B 로그인 실패');
    const markB = runTag + '-b-seed';
    memDb.push_subscriptions.push({ endpoint: 'https://push.example.invalid/' + markB, user_id: uidB, p256dh: 'x', auth: 'x' });

    const a = await newPage(browser, base);
    const aOk = await login(a.page, base, env.OG_TEST_A_EMAIL.trim(), env.OG_TEST_A_PASSWORD);
    if (aOk) uidA = await a.page.evaluate(() => String(window.state.profile.id));
    step('A 로그인', aOk && !!uidA, { loggedIn: aOk });
    if (!uidA) throw new Error('A 로그인 실패');
    await wait(2500);

    // ① 앱 syncPushSubscription
    const markA = runTag + '-a';
    await stubPushPlumbing(a.page, markA);
    let from = subLog.length;
    const c1 = await appCall(a.page, 'syncPushSubscription');
    await wait(1500);
    const r1 = subLog.slice(from).filter(e => e.endpointMark === markA);
    step('① 앱 구독 등록 요청', true, { call: c1, count: r1.length, requests: r1, rowOwner: rowOwner(markA) });

    // ② 공격 요청 4가지(A 페이지에서)
    const atkMark = runTag + '-atk';
    const p1 = await probe(a.page, 'POST', { userId: uidB, subscription: { endpoint: 'https://push.example.invalid/' + atkMark + '-1', keys: { p256dh: 'x', auth: 'x' } } }, false);
    step('②-1 토큰 없이 B 이름으로 등록', true, { status: p1, rowOwner: rowOwner(atkMark + '-1') });
    const p2 = await probe(a.page, 'POST', { userId: uidB, subscription: { endpoint: 'https://push.example.invalid/' + atkMark + '-2', keys: { p256dh: 'x', auth: 'x' } } }, true);
    step('②-2 A 토큰으로 B 이름 등록', true, { status: p2, rowOwner: rowOwner(atkMark + '-2') });
    const p3 = await probe(a.page, 'DELETE', { endpoint: 'https://push.example.invalid/' + markB }, true);
    step('②-3 A 토큰으로 B 구독 삭제', true, { status: p3, bRowLeft: rowOwner(markB) === 'B' });
    const p4 = await probe(a.page, 'DELETE', { endpoint: 'https://push.example.invalid/' + markB }, false);
    step('②-4 토큰 없이 B 구독 삭제', true, { status: p4, bRowLeft: rowOwner(markB) === 'B' });

    // ③ 앱 removePushSubscription
    from = subLog.length;
    const c3 = await appCall(a.page, 'removePushSubscription');
    await wait(1500);
    const r3 = subLog.slice(from).filter(e => e.endpointMark === markA);
    step('③ 앱 구독 해제 요청', true, { call: c3, count: r3.length, requests: r3, rowLeft: rowOwner(markA) });
    await a.page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await a.bctx.close().catch(() => {});

    // ④ 게스트(세션 없음)
    const g = await newPage(browser, base);
    await g.page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
    const land = await until(() => g.page.evaluate(() => !!document.getElementById('landGuestBtn')), 20000);
    if (land) await g.page.evaluate(() => document.getElementById('landGuestBtn').click()).catch(() => {});
    const gIn = await until(() => g.page.evaluate(() => { const p = window.state && window.state.profile; return !!(p && String(p.id || '').indexOf('guest') === 0); }), 20000);
    const markG = runTag + '-g';
    await stubPushPlumbing(g.page, markG);
    from = subLog.length;
    const c4 = await appCall(g.page, 'syncPushSubscription');
    await wait(1500);
    const r4 = subLog.slice(from).filter(e => e.endpointMark === markG);
    step('④ 게스트 구독 등록 요청', true, { guestEntered: !!gIn, call: c4, count: r4.length, requests: r4 });
    await g.page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await g.bctx.close().catch(() => {});
  } catch (e) {
    step('실행', false, { error: String(e && e.message || e).slice(0, 160) });
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.memRowsAtEnd = memDb.push_subscriptions.map(r => ({ owner: ownerTag(r.user_id), mark: String(r.endpoint).split('/').pop().replace(runTag, '<run>') }));
    if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
    console.log('[real-account-push-subscribe] ' + LABEL + ' 단계 ' + out.steps.length);
  }
})();
