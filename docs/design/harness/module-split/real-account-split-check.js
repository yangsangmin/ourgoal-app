'use strict';
// #TASK-ES-513 실계정 분열 확인 표준 도구(작업자 보조, 판정 아님) — 게스트로 닿지 않는 인라인 묶음(로그인·팀·보관·차단 등)을 옮길 때
// 기준 사본·작업 사본을 같은 테스트 계정으로 읽기만 하며 단계별 화면을 맞댄다. real-account-team-3.js(#TASK-ES-402)·real-account-inline-split-2.js(#TASK-ES-432)의 틀을
// 묶음마다 새로 쓰지 않도록 단계(steps)를 설정 파일로 뺀 것이다.
//
// 환경: 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL). /api 중 /api/track 밖(AI·푸시·탈퇴 등)은 503, /api/track 도 sync_records·notion_push·inquiry 면 503.
// 쓰기 0 강제(이 도구가 더한 것): 브라우저에서 Supabase 로 가는 요청 중 /rest/v1·/storage/v1 의 GET·HEAD 밖(POST·PATCH·PUT·DELETE — upsert·rpc 포함)은 보내지 않고 끊는다.
//   로그인(/auth/v1)과 실시간 연결은 그대로 둔다. 끊은 요청 수는 결과의 writesBlocked 에 경로 이름(쿼리 없이)별로 남는다 — 기준·작업 양쪽이 같은 조건이다.
// 계정: --guest 면 로그인하지 않고 「로그인 없이 둘러보기」로 들어간다(게스트로 닿는지 재는 용도). 아니면 테스트 계정 A 이메일 로그인
//   (OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수, 주소에 ogtest 가 있거나 OG_TEST_ALLOW 에 정확히 같은 주소일 때만).
// 주소·비밀번호·uid·닉네임·화면 글자는 출력·기록하지 않는다 — 화면 글자는 날짜·시각·「N분 전」을 지운 뒤 sha256 앞 16자와 길이만 남긴다.
// --count 이름,이름: 사본의 index.html 에서 그 이름의 함수 선언 본문 맨 앞에 호출 수 세기 한 문장을 넣고(사본만 고친다 — 저장소 파일은 건드리지 않는다)
//   단계마다 누적 호출 수를 남긴다. 그 함수가 이 단계들에서 실제로 불리는지(게스트로 닿는지·실계정으로 닿는지)를 재는 용도이며, 비교용 실행에는 쓰지 않는다.
//
// 설정(JSON): { "moved": [window 종류를 볼 이름], "steps": [ { "name", "tab"(navbtn data-tab), "gsub"(목표 하위 탭 data-gsub),
//   "click"(선택자 — 하나만 누른다, 없으면 opened:false), "sub"(소통 하위 탭 data-sub), "wait"(ms), "read"(읽을 선택자), "count": {이름: 선택자} } ] }
// 사용: node real-account-split-check.js <APP_DIR> <설정.json> <label> <out.json> [--guest] [--count a,b]
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = process.env.OG_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const COUNT = argv.includes('--count') ? String(argv[argv.indexOf('--count') + 1] || '').split(',').filter(Boolean) : [];
const pos = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--count');
const [APP, CONF, LABEL, OUT] = pos;
const GUEST = flags.has('--guest');
const conf = JSON.parse(fs.readFileSync(CONF, 'utf8'));
const env = process.env;
if (!env.OG_APP_URL) { console.log('계정 없음 — 재생 안 함(OG_APP_URL)'); process.exitCode = 2; return; }
if (!GUEST) {
  for (const k of ['OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
  const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!/ogtest/i.test(env.OG_TEST_A_EMAIL) && !allow.includes(env.OG_TEST_A_EMAIL.trim().toLowerCase())) { console.log('테스트 계정 표식 없음 — 접속 안 함'); process.exitCode = 3; return; }
}
const UPSTREAM = new URL(env.OG_APP_URL.replace(/\/+$/, ''));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp' };
const BLOCK_ACTIONS = ['sync_records', 'notion_push', 'inquiry'];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn().catch(() => null); if (v) return v; await wait(500); } return null; }
const apiLog = { forwarded: {}, blocked: {} };
const writesBlocked = {};
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

// --count: 사본의 index.html 에만 호출 수 세기 문장을 넣는다(함수 선언 「function 이름(…){」 바로 뒤).
function instrumentedHtml(dir) {
  let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const missing = [];
  for (const n of COUNT) {
    const re = new RegExp('(function\\s+' + n + '\\s*\\([^)]*\\)\\s*\\{)');
    if (!re.test(html)) { missing.push(n); continue; }
    html = html.replace(re, '$1 (window.__ogCalls = window.__ogCalls || {})["' + n + '"] = (window.__ogCalls["' + n + '"] || 0) + 1;');
  }
  return { html, missing };
}

function serve(dir, htmlOverride) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks);
        let action = null; try { action = JSON.parse(body.toString('utf8') || '{}').action || null; } catch (e) {}
        const key = p + (action ? '#' + action : '');
        if (p !== '/api/track' || BLOCK_ACTIONS.includes(action)) { bump(apiLog.blocked, key); res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{"error":"blocked in local test"}'); }
        bump(apiLog.forwarded, key);
        const headers = Object.assign({}, req.headers, { host: UPSTREAM.hostname, 'content-length': body.length });
        const up = https.request({ hostname: UPSTREAM.hostname, port: 443, path: req.url, method: req.method, headers }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
        up.on('error', () => { res.writeHead(502); res.end(); });
        up.end(body);
      });
      return;
    }
    if (p === '/index.html' && htmlOverride != null) { res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' }); return res.end(htmlOverride); }
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 6100 + Math.floor(Math.random() * 300);
  return new Promise(r => s.listen(port, '127.0.0.2', () => r({ s, base: 'http://127.0.0.2:' + port })));
}
const loggedIn = page => page.evaluate(() => { const shell = document.getElementById('appShell'); const p = window.state && window.state.profile; return !!(shell && shell.classList.contains('active') && p && /^[0-9a-f-]{36}$/i.test(String(p.id || ''))); });
const inApp = page => page.evaluate(() => { const shell = document.getElementById('appShell'); return !!(shell && shell.classList.contains('active')); });
async function enter(page, base) {
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (GUEST) {
    await until(() => page.evaluate(() => !!document.getElementById('btnLandingPreviewDirect')), 20000);
    await page.evaluate(() => { const b = document.getElementById('btnLandingPreviewDirect'); if (b) b.click(); });
    return !!(await until(() => inApp(page), 30000));
  }
  const first = await until(async () => (await loggedIn(page)) ? 'in' : await page.evaluate(() => {
    const a = document.getElementById('authScreen'); if (a && getComputedStyle(a).display !== 'none') return 'auth';
    const l = document.getElementById('landingScreen'); if (l && getComputedStyle(l).display !== 'none' && l.offsetParent !== null) return 'landing';
    return null;
  }), 30000);
  if (first === 'landing') { await page.click('#landLoginLink').catch(() => {}); await until(() => page.evaluate(() => { const a = document.getElementById('authScreen'); return !!(a && getComputedStyle(a).display !== 'none'); }), 8000); }
  if (first !== 'in') {
    await page.type('#loginUser', env.OG_TEST_A_EMAIL);
    await page.type('#loginPass', env.OG_TEST_A_PASSWORD);
    await page.click('#loginSubmit');
  }
  return !!(await until(() => loggedIn(page), 30000));
}
const H = t => t == null ? null : crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const readView = (page, sel) => page.evaluate(sel => {
  const el = document.querySelector(sel); if (!el) return null;
  const vis = !!(el.offsetParent !== null || (el.getClientRects && el.getClientRects().length));
  const text = String(el.innerText || '').replace(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/g, '<d>').replace(/(오전|오후)?\s?\d{1,2}:\d\d(:\d\d)?/g, '<t>').replace(/\d+\s?(초|분|시간|일) 전/g, '<ago>').replace(/D[-+]\d+/g, 'D<n>').replace(/\s+/g, ' ').trim();
  const attrs = {}; el.querySelectorAll('*').forEach(e => { for (const a of e.attributes) if (a.name.startsWith('data-') || a.name === 'id') { const k = a.name === 'id' ? '#' + a.value.replace(/[0-9a-z]{8,}/g, '<x>') : a.name; attrs[k] = (attrs[k] || 0) + 1; } });
  return { visible: vis, text, attrs: Object.keys(attrs).sort().map(k => k + '=' + attrs[k]).join(',') };
}, sel);
const clickSel = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; e.click(); return true; }, sel);
(async () => {
  const inst = COUNT.length ? instrumentedHtml(APP) : null;
  const { s, base } = await serve(APP, inst ? inst.html : null);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { tool: 'docs/design/harness/module-split/real-account-split-check.js', label: LABEL, mode: GUEST ? 'guest' : 'test-account-A',
    env: 'local 127.0.0.2 static + /api/track forwarded to production (other /api and sync_records·notion_push·inquiry blocked) · Supabase rest/storage writes aborted · ' + (GUEST ? 'guest (no login)' : 'test account A (address hidden)') + ' · temporary browser profile · read-only',
    countNames: COUNT, countMissing: inst ? inst.missing : [], steps: [], errors: [] };
  const rec = (name, v, extra) => { const e = Object.assign({ name, present: !!v, visible: v ? v.visible : null, textHash: v ? H(v.text) : null, textLen: v ? v.text.length : null, attrsHash: v ? H(v.attrs) : null }, extra || {}); out.steps.push(e); console.log('  · ' + name + ' ' + JSON.stringify(e)); };
  const recCount = page => page.evaluate(() => { const p = window.state && window.state.profile; return p && Array.isArray(p.records) ? p.records.length : null; });
  try {
    const bctx = await browser.createBrowserContext();
    const page = await bctx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', req => {
      let u; try { u = new URL(req.url()); } catch (e) { return req.continue(); }
      const m = req.method();
      if (/supabase\.co$/i.test(u.hostname) && /^\/(rest|storage)\/v1\//.test(u.pathname) && m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS') {
        bump(writesBlocked, m + ' ' + u.pathname.replace(/\/[0-9a-f-]{36}/gi, '/<id>'));
        return req.abort('blockedbyclient');
      }
      return req.continue();
    });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page.on('pageerror', e => { out.errors.push(String(e && e.message || e).replace(/https?:\/\/[^\s)]+/g, '<url>').slice(0, 120)); });
    const ok = await enter(page, base);
    out.loggedIn = GUEST ? false : ok; out.entered = ok;
    console.log('  ① ' + (GUEST ? '게스트 입장 ' : '로그인 ') + ok);
    if (!ok) throw new Error(GUEST ? '게스트 입장 실패' : '로그인 실패');
    await wait(3000);
    const before = await recCount(page);
    out.globals = await page.evaluate(list => list.map(k => k + '/' + typeof window[k]).join(','), conf.moved || []);
    for (const st of conf.steps) {
      if (st.tab) { await clickSel(page, '.navbtn[data-tab="' + st.tab + '"]'); await wait(1800); }
      if (st.gsub) { await clickSel(page, '[data-gsub="' + st.gsub + '"]'); await wait(2000); }
      if (st.sub) { await clickSel(page, '#commBody [data-sub="' + st.sub + '"]'); await wait(2000); }
      let opened = null;
      if (st.click) { opened = await clickSel(page, st.click); await wait(st.wait || 1500); } else if (st.wait) await wait(st.wait);
      const counts = {};
      for (const [k, sel] of Object.entries(st.count || {})) counts[k] = await page.evaluate(sel => document.querySelectorAll(sel).length, sel);
      const calls = COUNT.length ? await page.evaluate(() => Object.assign({}, window.__ogCalls || {})) : undefined;
      rec(st.name, st.read ? await readView(page, st.read) : null, Object.assign({ opened }, Object.keys(counts).length ? { counts } : {}, calls ? { calls } : {}));
      if (st.close) { await clickSel(page, st.close); await wait(1000); }
    }
    const after = await recCount(page);
    out.recordsCountUnchanged = before === after; out.rowsWritten = 0;
  } catch (e) {
    out.failure = String(e && e.message || e).slice(0, 160);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.api = apiLog; out.writesBlocked = writesBlocked;
    if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
    console.log('[real-account-split-check] ' + LABEL + ' ' + out.mode + ' steps ' + out.steps.length + ' · pageerror ' + out.errors.length + ' · writesBlocked ' + JSON.stringify(writesBlocked));
  }
})();
