'use strict';
// #TASK-ES-407 실계정 시간기록 화면 확인(작업자 보조, 판정 아님) — 시간기록 세포 쪼개기로 옮긴 세 묶음(몰입 화면 만들기·버튼 배선 / 구간 메모 패널 / 기록 작성 화면)이
// 로그인한 실계정 화면에서 이전과 같이 그려지고 눌리는가(읽기 위주). real-account-team-3.js 와 같은 틀.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// /api 중 AI 호출(돈·외부 전송)·푸시·탈퇴 경로는 막고(503), /api/track 도 action 이 sync_records·notion_push·inquiry 면 막는다.
// 쓰는 행 0 — 「내 기록에 저장」은 누르지 않는다(측정을 마친 뒤 기록 작성 화면에서 「작성 취소 → 정말 취소」로 닫는다). 그래서 정리할 행이 없다.
// 주소·비밀번호·uid·닉네임·화면 글자는 출력·기록하지 않는다 — 화면 글자는 시각·경과 시간·숫자 시각을 지운 뒤 sha256 앞 16자와 길이만 남긴다.
// 단계: ① 로그인 ② 기록 탭 ③ 기록 탭 빠른 실행 줄 「⏱️ 시간기록」 → 덮개(#timeTrackerOverlay, initDOM) ④ 시작·구간 2회(bindEvents) ⑤ 구간 메모 패널(openLapMemoModal) 열기·취소
//       ⑥ 전체중지 및 기록하기 → 기록 작성 화면(openReviewView) ⑦ 작성 취소 → 정말 취소(닫힘) ⑧ 노출 객체 키 ⑨ 프로필 기록 수 전후 같음(쓴 행 0)
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-time-tracker.js <APP_DIR> <label> <out.json>
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
// 스톱워치 센티초(.37 꼴)는 실행마다 다르다 — 화면 글자 해시 전에 지운다.
const readViewT = async (page, sel) => { const v = await readView(page, sel); if (v) v.text = v.text.replace(/\.\d\d\b/g, '.<cs>'); return v; };
(async () => {
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, env: 'local 127.0.0.2 static + /api/track forwarded to production (AI·push·withdraw paths and sync_records·notion_push·inquiry blocked) · test account A (address hidden) · temporary browser profile · read-only (no save)', steps: [], errors: [] };
  const rec = (name, v, extra) => { const e = Object.assign({ name, present: !!v, visible: v ? v.visible : null, textHash: v ? H(v.text) : null, textLen: v ? v.text.length : null, attrsHash: v ? H(v.attrs) : null }, extra || {}); out.steps.push(e); console.log('  · ' + name + ' ' + JSON.stringify(e)); };
  const recCount = page => page.evaluate(() => { const p = window.state && window.state.profile; return p && Array.isArray(p.records) ? p.records.length : null; });
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
    await clickSel(page, '.navbtn[data-tab="records"]'); await wait(2000);
    const before = await recCount(page);
    rec('② 기록 탭 빠른 실행 줄 「⏱️ 시간기록」 버튼', await readViewT(page, '#recQuickDockBar button[onclick*="OurgoalTimeTracker"]'));
    const opened = await clickSel(page, '#recQuickDockBar button[onclick*="OurgoalTimeTracker"]'); await wait(1200);
    rec('③ 몰입 화면 #timeTrackerOverlay', await readViewT(page, '#timeTrackerOverlay'), { opened });
    await clickSel(page, '#btnTtActionStart'); await wait(1300);
    await clickSel(page, '#btnTtActionLap'); await wait(1100);
    await clickSel(page, '#btnTtActionLap'); await wait(1100);
    rec('④ 측정 중 구간 2개 #ttLapsList', await readViewT(page, '#ttLapsList'));
    rec('④ 측정 중 버튼 #ttControls', await readViewT(page, '#ttControls'));
    const memo = await clickSel(page, '#ttLapsList .tt-lap-item'); await wait(1000);
    rec('⑤ 구간 메모 패널 #ttLapMemoContainer', await readViewT(page, '#ttLapMemoContainer'), { opened: memo });
    await clickSel(page, '#btnTtLapMemoCancel'); await wait(800);
    rec('⑤ 구간 메모 취소 뒤 #ttLapMemoContainer', await readViewT(page, '#ttLapMemoContainer'));
    await clickSel(page, '#btnTtActionStopRecord'); await wait(1200);
    rec('⑥ 기록 작성 화면 #ttReviewView', await readViewT(page, '#ttReviewView'));
    await clickSel(page, '#btnTtCancelReview'); await wait(800);
    rec('⑦ 작성 취소 경고 #ttCancelConfirmDialog', await readViewT(page, '#ttCancelConfirmDialog'));
    await clickSel(page, '#btnTtCancelYes'); await wait(1000);
    const closed = await page.evaluate(() => { const o = document.getElementById('timeTrackerOverlay'); return !!(o && o.classList.contains('hidden')); });
    out.overlayClosedAfterCancel = closed;
    console.log('  ⑦ 정말 취소 뒤 덮개 닫힘 ' + closed);
    const api = await page.evaluate(() => ['OurgoalTimeTracker'].map(n => n + ':' + (window[n] ? Object.keys(window[n]).map(k => k + '/' + typeof window[n][k]).join(',') : 'none')).join(' | '));
    out.apiHash = H(api); out.apiTypesAllDefined = !/\/undefined/.test(api);
    console.log('  ⑧ 노출 객체 키 ' + out.apiHash + ' 모두 정의됨 ' + out.apiTypesAllDefined);
    const after = await recCount(page);
    out.recordsCountUnchanged = before === after; out.rowsWritten = 0;
    console.log('  ⑨ 프로필 기록 수 전후 같음 ' + out.recordsCountUnchanged);
  } catch (e) {
    out.failure = String(e && e.message || e).slice(0, 160);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.api = apiLog;
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-time-tracker] ' + LABEL + ' steps ' + out.steps.length + ' · pageerror ' + out.errors.length + ' · api ' + JSON.stringify(apiLog));
  }
})();
