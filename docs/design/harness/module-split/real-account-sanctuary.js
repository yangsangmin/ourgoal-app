'use strict';
// #TASK-ES-429 실계정 화면 확인(작업자 보조, 판정 아님) — 포커스 성소 엔진 세포 쪼개기로 옮긴 코드(js/sanctuary-*.js: 레이더 함수·렌더 분기 본문·공개 객체 메서드)가
// 로그인한 실계정 데이터로 이전과 같이 그려지는가(읽기 전용). real-account-components.js 와 같은 틀.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// /api 중 AI 호출(돈·외부 전송)·푸시·탈퇴 경로는 막고(503), /api/track 도 action 이 sync_records·notion_push·inquiry 면 막는다.
// 쓰는 행 0 — 저장하는 메서드(토글·타이머·샘플 루틴·리캡 이미지)는 부르지 않는다. 테마는 문서 속성만 focus-sanctuary 로 두고 저장하지 않는다.
// 부르는 것: 라우터 render(탭)·renderRadar, 모드만 바꾸는 setCalMode(month·timeline)·setRecMode(feed·archive·recap·timer·heatmap) — 메모리 상태와 화면만 바뀐다.
// 주소·비밀번호·uid·닉네임·화면 글자는 출력·기록하지 않는다 — 화면 글자는 날짜·시각을 지운 뒤 sha256 앞 16자와 길이만 남긴다.
// 단계: ① 로그인 ② OurgoalSanctuaryV3 키·종류·함수 글자(T. 접두를 뗀 글자) 해시 ③ 목표 트레일 ④ 일정 월간·타임라인 ⑤ 기록 피드·보관함·리캡·타이머 ⑥ 소통 레이더 ⑦ 프로필 기록·목표 수 전후 같음(쓴 행 0)
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-sanctuary.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [APP, LABEL, OUT] = process.argv.slice(2);
const env = process.env;
for (const k of ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim()).filter(Boolean);
if (!/ogtest/i.test(env.OG_TEST_A_EMAIL) && !allow.includes(env.OG_TEST_A_EMAIL)) { console.log('테스트 계정 표식 없음 — 접속 안 함'); process.exitCode = 3; return; }
const UPSTREAM = new URL(env.OG_APP_URL.replace(/\/+$/, ''));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp' };
const BLOCK_ACTIONS = ['sync_records', 'notion_push', 'inquiry'];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn().catch(() => null); if (v) return v; await wait(500); } return null; }
const apiLog = { forwarded: {}, blocked: {} };
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

function serve(dir) {
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
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 5600 + Math.floor(Math.random() * 300);
  return new Promise(r => s.listen(port, '127.0.0.2', () => r({ s, base: 'http://127.0.0.2:' + port })));
}
const loggedIn = page => page.evaluate(() => { const shell = document.getElementById('appShell'); const p = window.state && window.state.profile; return !!(shell && shell.classList.contains('active') && p && /^[0-9a-f-]{36}$/i.test(String(p.id || ''))); });
async function login(page, base) {
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
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
const gsub = (page, s) => clickSel(page, '[data-gsub="' + s + '"]');
(async () => {
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, env: 'local 127.0.0.2 static + /api/track forwarded to production (AI·push·withdraw paths and sync_records·notion_push·inquiry blocked) · test account A (address hidden) · temporary browser profile · read-only (render/mode only, no toggles/timer/save)', steps: [], errors: [] };
  const rec = (name, v, extra) => { const e = Object.assign({ name, present: !!v, visible: v ? v.visible : null, textHash: v ? H(v.text) : null, textLen: v ? v.text.length : null, attrsHash: v ? H(v.attrs) : null }, extra || {}); out.steps.push(e); console.log('  · ' + name + ' ' + JSON.stringify(e)); };
  const counts = page => page.evaluate(() => { const p = window.state && window.state.profile; return p ? [Array.isArray(p.records) ? p.records.length : null, Array.isArray(p.goals) ? p.goals.length : null].join('/') : null; });
  const V3 = (page, m, args) => page.evaluate((m, args) => { const o = window.OurgoalSanctuaryV3; try { o[m].apply(o, args); return 'ok'; } catch (e) { return 'threw'; } }, m, args || []);
  try {
    const bctx = await browser.createBrowserContext();
    const page = await bctx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page.on('pageerror', e => { out.errors.push(String(e && e.message || e).replace(/https?:\/\/[^\s)]+/g, '<url>').slice(0, 120)); });
    const ok = await login(page, base);
    out.loggedIn = ok;
    console.log('  ① 로그인 ' + ok);
    if (!ok) throw new Error('로그인 실패');
    await wait(3000);
    const before = await counts(page);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'focus-sanctuary'));
    const api = await page.evaluate(() => {
      const o = window.OurgoalSanctuaryV3 || {};
      const fnText = v => typeof v === 'function' ? Function.prototype.toString.call(v).replace(/\r\n/g, '\n').replace(/(^|[^A-Za-z0-9_$.])T\.(?=[A-Za-z_$])/g, '$1') : typeof v;
      return { keys: Object.keys(o).map(k => k + '/' + typeof o[k] + '/' + (typeof o[k] === 'function' ? o[k].name : '')).join(','), texts: Object.keys(o).map(k => fnText(o[k])).join('\n--\n') };
    });
    out.apiKeys = api.keys.split(',').length; out.apiKeysHash = H(api.keys); out.apiFnTextHash = H(api.texts);
    console.log('  ② OurgoalSanctuaryV3 ' + out.apiKeys + ' ' + out.apiKeysHash + ' 글자 ' + out.apiFnTextHash);
    const calls = [];
    await clickSel(page, '.navbtn[data-tab="goals"]'); await wait(2500);
    calls.push(await V3(page, 'render', ['goals'])); await wait(1200);
    rec('③ 목표 트레일 #sanctuaryGoalsView', await readView(page, '#sanctuaryGoalsView'));
    await clickSel(page, '.navbtn[data-tab="calendar"]'); await wait(2500);
    calls.push(await V3(page, 'setCalMode', ['month'])); await wait(1200);
    rec('④ 일정 월간 #sanctuaryCalendarView', await readView(page, '#sanctuaryCalendarView'));
    calls.push(await V3(page, 'setCalMode', ['timeline'])); await wait(1200);
    rec('④ 일정 타임라인 #sanctuaryCalendarView', await readView(page, '#sanctuaryCalendarView'));
    calls.push(await V3(page, 'setCalMode', ['month'])); await wait(800);
    await clickSel(page, '.navbtn[data-tab="records"]'); await wait(2500);
    for (const m of ['feed', 'archive', 'recap', 'timer']) {
      calls.push(await V3(page, 'setRecMode', [m])); await wait(1200);
      rec('⑤ 기록 ' + m + ' #sanctuaryRecordsView', await readView(page, '#sanctuaryRecordsView'));
    }
    calls.push(await V3(page, 'setRecMode', ['heatmap'])); await wait(800);
    await clickSel(page, '.navbtn[data-tab="comm"]'); await wait(2500);
    calls.push(await V3(page, 'renderRadar', [])); await wait(1200);
    rec('⑥ 소통 레이더 #sanctuaryCommView', await readView(page, '#sanctuaryCommView'));
    out.callsThrew = calls.filter(x => x !== 'ok').length;
    await clickSel(page, '.navbtn[data-tab="home"]'); await wait(1500);
    const after = await counts(page);
    out.countsUnchanged = before === after; out.rowsWritten = 0;
    console.log('  ⑦ 프로필 기록·목표 수 전후 같음 ' + out.countsUnchanged + ' · 부른 메서드 던짐 ' + out.callsThrew);
  } catch (e) {
    out.failure = String(e && e.message || e).slice(0, 160);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.api = apiLog;
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-sanctuary] ' + LABEL + ' steps ' + out.steps.length + ' · pageerror ' + out.errors.length + ' · api ' + JSON.stringify(apiLog));
  }
})();
