'use strict';
// #TASK-ES-395 실계정 체크인 EXP 확인(작업자 보조, 판정 아님) — 옮긴 EXP 세포(js/avatar/xp.js)로 실계정 체크인 EXP 가 이전과 같이 오르는가.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// /api 중 AI 호출(돈·외부 전송)·푸시·탈퇴 경로는 막고(503), /api/track 도 action 이 sync_records·notion_push·inquiry 면 막는다.
// 체크인 기록은 saveProfile 이 Supabase checkins 표에 직접 올린다(js/record-ledger.js) — 이번 실행 표식(runTag) 글자로 쓰고 ④ 에서 본인 행만 지운 뒤 0건을 다시 읽어 확인한다.
// EXP(settings.xp)는 원래 기기(localStorage)에만 있다 — 임시 브라우저 프로필이라 닫으면 사라진다.
// 주소·비밀번호·uid·기록 내용은 출력·기록하지 않는다(합계·건수·사유 문구·막은 경로 이름만).
// 단계: ① 로그인 ② 체크인 전 settings.xp 합계·이력 수, 홈 레벨 배지 Lv 글자 ③ #captureInput 입력 → #captureSave → settings.xp 합계 차이·이력 맨 앞 사유·레벨 배지·홈 링
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-avatar-xp.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path');
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
const readXp = page => page.evaluate(() => {
  const cleanBadge = el => el ? String(el.innerText || '').replace(/\s+/g, ' ').trim() : null;
  const st = window.OurgoalAppScope.scope.state;
  const xp = st.profile && st.profile.settings && st.profile.settings.xp;
  const badge = document.getElementById('levelBadgeRow');
  const bt = cleanBadge(badge);
  const lv = bt ? ((/Lv\.\s*\d+\s+\d+\s*\/\s*\d+\s*XP/.exec(bt) || /Lv\.[^X]{0,30}XP/.exec(bt) || [null])[0]) : null;
  const bar = document.getElementById('homeHeroExpBar');
  return { total: xp ? xp.total : null, level: typeof window.levelForXP === 'function' ? window.levelForXP(xp ? xp.total : 0) : null, log: xp && xp.log ? xp.log.map(e => ({ amount: e.amount, reason: e.reason })) : [], logLen: xp && xp.log ? xp.log.length : 0, firstReason: xp && xp.log && xp.log[0] ? xp.log[0].reason : null, firstAmount: xp && xp.log && xp.log[0] ? xp.log[0].amount : null,
    lv, ringNow: bar ? bar.getAttribute('aria-valuenow') : null, records: (st.profile.records || []).length,
    kit: !!(window.OurgoalAvatarParts && window.OurgoalAvatarParts.xp), winFns: ['xpForLevel', 'levelForXP', 'levelProgress', 'triggerAvatarCelebrationPopup', 'notifyXpGained'].every(n => typeof window[n] === 'function') };
});

const OLD_TEXT = 'TASK-ES-395 실계정 EXP 확인'; // 표식 도입 전 첫 시도(기준·작업 각 1회)가 남긴 글자 — 같이 지운다
const cleanup = (page, tag) => page.evaluate(async (tag, old) => {
  const sc = window.OurgoalAppScope.scope; const sb = sc.sb; const uid = sc.state.profile.id;
  const sel = async () => { const r = await sb.from('checkins').select('id,text').eq('user_id', uid); if (r.error) return { error: String(r.error.message || r.error).slice(0, 120) }; return { rows: (r.data || []).filter(x => x.text === old || String(x.text || '').indexOf(tag) === 0 || /^ogtest-es395-/.test(String(x.text || ''))) }; };
  const a = await sel(); if (a.error) return a;
  let deleted = 0;
  for (const row of a.rows) { const d = await sb.from('checkins').delete().eq('id', row.id).eq('user_id', uid); if (!d.error) deleted++; }
  const b = await sel();
  return { found: a.rows.length, deleted, leftover: b.error ? null : b.rows.length, error: b.error || null };
}, tag, OLD_TEXT);
(async () => {
  const runTag = 'ogtest-es395-' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + '-' + Math.random().toString(36).slice(2, 6);
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, env: 'local 127.0.0.2 static + /api/track forwarded to production (AI·push·withdraw paths and sync_records·notion_push·inquiry blocked) · test account A (address hidden) · temporary browser profile', steps: [], errors: 0 };
  const step = (name, ok, evidence) => { out.steps.push({ name, ok: !!ok, evidence }); console.log((ok ? '  ok · ' : '  실패 · ') + name + ' ' + JSON.stringify(evidence)); if (!ok) process.exitCode = 1; };
  try {
    const bctx = await browser.createBrowserContext();
    const page = await bctx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page.on('pageerror', () => { out.errors++; });
    const ok = await login(page, base);
    step('① 로그인(이메일)', ok, { loggedIn: ok });
    if (!ok) throw new Error('로그인 실패');
    await wait(3000);
    await page.evaluate(() => { const b = document.querySelector('.navbtn[data-tab="home"]'); if (b) b.click(); });
    await wait(1500);
    const before = await readXp(page);
    const bShow = Object.assign({}, before, { log: undefined });
    step('② 체크인 전 EXP 읽기(window EXP 함수 5개 있음' + (LABEL === 'after' ? ' · 세포 키트 OurgoalAvatarParts.xp 있음' : '') + ')', before.winFns && (LABEL !== 'after' || before.kit), bShow);
    const typed = await page.evaluate((tag) => { const el = document.getElementById('captureInput'); if (!el) return false; el.focus(); el.value = tag + ' 실계정 EXP 확인'; el.dispatchEvent(new Event('input', { bubbles: true })); return true; }, runTag);
    const clicked = typed && await page.evaluate(() => { const b = document.getElementById('captureSave'); if (!b) return false; b.click(); return true; });
    await wait(4000);
    await page.evaluate(() => { const b = document.querySelector('.navbtn[data-tab="home"]'); if (b) b.click(); });
    await wait(2000);
    const after = await readXp(page);
    const gained = (after.total || 0) - (before.total || 0);
    const newEntries = after.log.slice(0, after.logLen - before.logLen);
    out.measure = { totalBefore: before.total, totalAfter: after.total, gained, levelBefore: before.level, levelAfter: after.level, badgeBefore: before.lv, badgeAfter: after.lv, ringBefore: before.ringNow, ringAfter: after.ringNow, newEntries };
    step('③ 체크인 → settings.xp 에 「체크인」 +10 이 새로 쌓이고 합계 = 새 이력 합', clicked && newEntries.some(e => e.reason === '체크인' && e.amount === 10) && gained === newEntries.reduce((a, e) => a + e.amount, 0), { typed, clicked, gained, newEntries, badgeAfter: after.lv, ringAfter: after.ringNow });
    const cl = await cleanup(page, runTag);
    out.leftover = cl.leftover;
    step('④ 정리: 이번 실행이 Supabase checkins 에 올린 본인 행(표식 글자)을 지우고 다시 읽어 0건', !cl.error && cl.leftover === 0, cl);
  } catch (e) {
    step('실행', false, { error: String(e && e.message || e).slice(0, 160) });
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.api = apiLog;
    out.summary = { ok: out.steps.filter(x => x.ok).length, failed: out.steps.filter(x => !x.ok).length };
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-avatar-xp] ' + LABEL + ' ' + out.summary.ok + ' ok · ' + out.summary.failed + ' failed · pageerror ' + out.errors + ' · api ' + JSON.stringify(apiLog));
  }
})();
