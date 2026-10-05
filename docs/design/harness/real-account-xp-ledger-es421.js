'use strict';
// #TASK-ES-421 K-XP1 실계정 EXP 서버 원장 확인(작업자 보조, 판정 아님) — 헌법 E4 수명주기 4단계 + 본인만 읽기(RLS) 실측.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A·B 이메일 로그인(Windows 사용자 환경 변수를 자식 프로세스에만).
// /api 중 AI 호출(돈·외부 전송)·푸시·탈퇴 경로는 막고(503), /api/track 도 action 이 sync_records·notion_push·inquiry 면 막는다.
// 주소·비밀번호·uid·기록 내용은 출력·기록하지 않는다(합계·건수·판 번호·참거짓만).
// 단계: ① 생성(A 로그인 → 이관 확인 → #captureInput 체크인 → 서버 원장 합계가 오를 때까지) ② 기기 캐시 파기(localStorage·sessionStorage 전부)
//       ③ 리로드(+다시 로그인) ④ 서버에서 복원: 메모리 판 = 파기 전 서버 판 = 지금 서버 판 (assert.deepStrictEqual)
//       ⑤ B 세션으로 A 원장 읽기 0행·고치기 0행·A 이름으로 넣기 거부, A 판 그대로 ⑥ 로그인 없는(anon) 읽기 0행 ⑦ 체크인 표식 행 정리
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-xp-ledger-es421.js <APP_DIR> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), assert = require('assert');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [APP, OUT] = process.argv.slice(2);
const env = process.env;
for (const k of ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD', 'OG_TEST_B_EMAIL', 'OG_TEST_B_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const isTest = e => /ogtest/i.test(e) || allow.includes(String(e).trim().toLowerCase());
if (!isTest(env.OG_TEST_A_EMAIL) || !isTest(env.OG_TEST_B_EMAIL) || env.OG_TEST_A_EMAIL.trim().toLowerCase() === env.OG_TEST_B_EMAIL.trim().toLowerCase()) { console.log('테스트 계정 조건 위반 — 접속 안 함'); process.exitCode = 3; return; }
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
async function login(page, base, email, pass, reload) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  else await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const first = await until(async () => (await loggedIn(page)) ? 'in' : await page.evaluate(() => {
    const a = document.getElementById('authScreen'); if (a && getComputedStyle(a).display !== 'none') return 'auth';
    const l = document.getElementById('landingScreen'); if (l && getComputedStyle(l).display !== 'none' && l.offsetParent !== null) return 'landing';
    return null;
  }), 30000);
  if (first === 'landing') { await page.click('#landLoginLink').catch(() => {}); await until(() => page.evaluate(() => { const a = document.getElementById('authScreen'); return !!(a && getComputedStyle(a).display !== 'none'); }), 8000); }
  if (first !== 'in') {
    await page.type('#loginUser', email);
    await page.type('#loginPass', pass);
    await page.click('#loginSubmit');
  }
  return !!(await until(() => loggedIn(page), 30000));
}
const status = page => page.evaluate(() => window.OurgoalAvatarParts.xp.ledger.status());
// 메모리 판(settings.xp 가 가리키는 것)과 지금 서버 판. uid 는 페이지 안에서만 쓴다.
const snap = page => page.evaluate(async () => {
  const sc = window.OurgoalAppScope.scope; const uid = sc.state.profile.id;
  const r = await sc.sb.from('user_ledger_docs').select('data,rev').eq('user_id', uid).eq('doc_key', 'xp').maybeSingle();
  const s = sc.state.profile.settings;
  const d = Object.getOwnPropertyDescriptor(s, 'xp');
  let lsSettingsHasXp = null, guestCopyHasXp = null, cacheKeys = 0, backupKeys = 0;
  try { const raw = localStorage.getItem('ourgoal_settings_' + uid); lsSettingsHasXp = raw ? Object.prototype.hasOwnProperty.call(JSON.parse(raw), 'xp') : false; } catch (e) {}
  try { const g = localStorage.getItem('ourgoal_guest_profile'); guestCopyHasXp = g ? !!(JSON.parse(g).settings || {}).hasOwnProperty('xp') : false; } catch (e) {}
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ''; if (k.indexOf('ourgoal_ledger_cache_') === 0) cacheKeys++; if (k.indexOf('ourgoal_xp_premigration_') === 0) backupKeys++; }
  const badge = document.getElementById('levelBadgeRow');
  return { server: r.error ? { error: String(r.error.message || r.error).slice(0, 120) } : (r.data ? { data: r.data.data, rev: r.data.rev } : null),
    mem: s.xp ? JSON.parse(JSON.stringify(s.xp)) : null, xpEnumerable: d ? !!d.enumerable : null, lsSettingsHasXp, guestCopyHasXp, cacheKeys, backupKeys,
    level: typeof window.levelForXP === 'function' && s.xp ? window.levelForXP(s.xp.total) : null,
    badgeLv: badge ? ((/Lv\.\d+/.exec(String(badge.innerText || '')) || [null])[0]) : null };
});
const cleanup = (page, tag) => page.evaluate(async (tag) => {
  const sc = window.OurgoalAppScope.scope; const sb = sc.sb; const uid = sc.state.profile.id;
  const sel = async () => { const r = await sb.from('checkins').select('id,text').eq('user_id', uid); if (r.error) return { error: String(r.error.message || r.error).slice(0, 120) }; return { rows: (r.data || []).filter(x => String(x.text || '').indexOf(tag) === 0 || /^ogtest-es421-/.test(String(x.text || ''))) }; };
  const a = await sel(); if (a.error) return a;
  let deleted = 0;
  for (const row of a.rows) { const d = await sb.from('checkins').delete().eq('id', row.id).eq('user_id', uid); if (!d.error) deleted++; }
  const b = await sel();
  return { found: a.rows.length, deleted, leftover: b.error ? null : b.rows.length, error: b.error || null };
}, tag);
const brief = s => s && { serverTotal: s.server && s.server.data ? s.server.data.total : null, serverRev: s.server ? s.server.rev : null, serverLog: s.server && s.server.data ? s.server.data.log.length : null, memTotal: s.mem ? s.mem.total : null, memLog: s.mem ? s.mem.log.length : null, xpEnumerable: s.xpEnumerable, lsSettingsHasXp: s.lsSettingsHasXp, guestCopyHasXp: s.guestCopyHasXp, cacheKeys: s.cacheKeys, backupKeys: s.backupKeys, level: s.level, badgeLv: s.badgeLv };

(async () => {
  const runTag = 'ogtest-es421-' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + '-' + Math.random().toString(36).slice(2, 6);
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { env: 'local 127.0.0.2 static + /api/track forwarded to production (AI·push·withdraw paths and sync_records·notion_push·inquiry blocked) · Supabase production · test accounts A·B (addresses hidden) · temporary browser profiles', steps: [], errors: 0 };
  const step = (name, ok, evidence) => { out.steps.push({ name, ok: !!ok, evidence }); console.log((ok ? '  ok · ' : '  실패 · ') + name + ' ' + JSON.stringify(evidence)); if (!ok) process.exitCode = 1; };
  const newPage = async () => { const ctx = await browser.createBrowserContext(); const page = await ctx.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); page.on('dialog', d => d.dismiss().catch(() => {})); page.on('pageerror', () => { out.errors++; }); return page; };
  let pageA = null;
  try {
    pageA = await newPage();
    const okA = await login(pageA, base, env.OG_TEST_A_EMAIL.trim(), env.OG_TEST_A_PASSWORD);
    if (!okA) throw new Error('A 로그인 실패');
    const act0 = await until(async () => { const st = await status(pageA); return st.active ? st : null; }, 40000);
    const s0 = await snap(pageA);
    step('① 생성 준비: A 로그인 → 이관 확인(원장 활성) · 메모리 판 = 서버 판', !!act0 && !!(s0.server && s0.server.data) && (() => { try { assert.deepStrictEqual(s0.mem, s0.server.data); return true; } catch (e) { return false; } })(), Object.assign({ status: act0 && { mode: act0.mode, active: act0.active, pending: act0.pending } }, brief(s0)));
    await pageA.evaluate(() => { const b = document.querySelector('.navbtn[data-tab="home"]'); if (b) b.click(); });
    await wait(1000);
    const typed = await pageA.evaluate((tag) => { const el = document.getElementById('captureInput'); if (!el) return false; el.focus(); el.value = tag + ' 원장 확인'; el.dispatchEvent(new Event('input', { bubbles: true })); return true; }, runTag);
    const clicked = typed && await pageA.evaluate(() => { const b = document.getElementById('captureSave'); if (!b) return false; b.click(); return true; });
    const t0 = s0.server && s0.server.data ? s0.server.data.total : 0;
    const s1 = await until(async () => { const st = await status(pageA); if (st.pending) return null; const x = await snap(pageA); return (x.server && x.server.data && x.server.data.total > t0 && x.mem && x.mem.total === x.server.data.total) ? x : null; }, 40000);
    const gained = s1 ? s1.server.data.total - t0 : null;
    step('① 생성: 체크인(#captureSave) → 서버 원장 합계가 오르고 메모리 판 = 서버 판, 기기 설정·전체 사본에 xp 없음(쓰기 중단)', !!clicked && !!s1 && gained > 0 && s1.lsSettingsHasXp === false && s1.guestCopyHasXp === false && s1.xpEnumerable === false && (() => { try { assert.deepStrictEqual(s1.mem, s1.server.data); return true; } catch (e) { return false; } })(), Object.assign({ typed, clicked, gained, firstReason: s1 && s1.server.data.log[0] ? s1.server.data.log[0].reason : null }, brief(s1)));
    if (!s1) throw new Error('생성 단계 실패');
    // ② 파기
    const wiped = await pageA.evaluate(() => { const before = localStorage.length; localStorage.clear(); sessionStorage.clear(); return { before, after: localStorage.length }; });
    step('② 기기 캐시 파기: localStorage·sessionStorage 전부 지움(원장 사본·이관 백업·로그인 세션 포함)', wiped.after === 0 && wiped.before > 0, wiped);
    // ③ 리로드
    const okA2 = await login(pageA, base, env.OG_TEST_A_EMAIL.trim(), env.OG_TEST_A_PASSWORD, true);
    step('③ 리로드 + 다시 로그인', okA2, { loggedIn: okA2 });
    // ④ 복원
    const act2 = await until(async () => { const st = await status(pageA); return st.active ? st : null; }, 40000);
    await wait(1500);
    const s2 = await snap(pageA);
    let deepOk = false, deepErr = null;
    try { assert.deepStrictEqual(s2.mem, s1.server.data); assert.deepStrictEqual(s2.server.data, s1.server.data); deepOk = true; } catch (e) { deepErr = String(e.message).slice(0, 200); }
    step('④ 서버에서 복원: 메모리 판 deepStrictEqual 파기 전 서버 판, 지금 서버 판도 같음(판 번호 그대로 = 덮어쓰기 없음), 레벨·홈 레벨 배지 글자 같음', !!act2 && deepOk && s2.server.rev === s1.server.rev && s2.level === s1.level && !!s2.badgeLv && s2.badgeLv === s1.badgeLv, Object.assign({ deepStrictEqual: deepOk, deepErr, revBefore: s1.server.rev }, brief(s2)));
    // ⑤ B 세션으로 A 원장
    const aUidHolder = await pageA.evaluateHandle(() => window.OurgoalAppScope.scope.state.profile.id);
    const aUid = await aUidHolder.jsonValue();
    const pageB = await newPage();
    const okB = await login(pageB, base, env.OG_TEST_B_EMAIL.trim(), env.OG_TEST_B_PASSWORD);
    if (!okB) throw new Error('B 로그인 실패');
    const bres = await pageB.evaluate(async (aUid) => {
      const sc = window.OurgoalAppScope.scope; const sb = sc.sb; const me = sc.state.profile.id;
      const r1 = await sb.from('user_ledger_docs').select('user_id,doc_key,rev').eq('user_id', aUid);
      const r2 = await sb.from('user_ledger_docs').select('user_id');
      const r3 = await sb.from('user_ledger_docs').update({ data: { v: 1, total: 999999, log: [], seen: [] } }).eq('user_id', aUid).eq('doc_key', 'xp').select('rev');
      const r4 = await sb.from('user_ledger_docs').insert({ user_id: aUid, doc_key: 'xp_probe', data: {} }).select('rev');
      return { sameAccount: me === aUid, readARows: r1.error ? 'error' : (r1.data || []).length, othersVisible: r2.error ? 'error' : (r2.data || []).filter(x => x.user_id !== me).length,
        updateARows: r3.error ? 'error' : (r3.data || []).length, insertAsA: r4.error ? ('거부 ' + (r4.error.code || '')) : '허용됨' };
    }, aUid);
    const s3 = await snap(pageA);
    step('⑤ B 세션: A 원장 읽기 0행 · 남의 행 0 · A 행 고치기 0행 · A 이름으로 넣기 거부 · A 서버 판 그대로', !bres.sameAccount && bres.readARows === 0 && bres.othersVisible === 0 && bres.updateARows === 0 && /^거부/.test(bres.insertAsA) && s3.server.rev === s1.server.rev && s3.server.data.total === s1.server.data.total, Object.assign({}, bres, { aRevAfter: s3.server.rev, aTotalAfter: s3.server.data.total }));
    // ⑥ anon
    const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
    const SUPA = /var SUPABASE_URL = '([^']+)'/.exec(html)[1]; const ANON = /var SUPABASE_ANON_KEY = '([^']+)'/.exec(html)[1];
    const anon = await new Promise((resolve) => {
      https.get(SUPA + '/rest/v1/user_ledger_docs?select=user_id', { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON } }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { let rows = null; try { const j = JSON.parse(b); rows = Array.isArray(j) ? j.length : null; } catch (e) {} resolve({ http: r.statusCode, rows, code: (/"code"\s*:\s*"([^"]+)"/.exec(b) || [null, null])[1] }); }); }).on('error', e => resolve({ error: e.message }));
    });
    step('⑥ 로그인 없는(anon) 읽기: 행 0(권한 거부 또는 빈 목록)', anon.rows === 0 || anon.http === 401 || anon.code === '42501', anon);
    const cl = await cleanup(pageA, runTag);
    step('⑦ 정리: 이번 실행이 checkins 에 올린 본인 표식 행을 지우고 다시 읽어 0건(EXP 원장은 남김)', !cl.error && cl.leftover === 0, cl);
  } catch (e) {
    step('실행', false, { error: String(e && e.message || e).slice(0, 160) });
    if (pageA) { const cl = await cleanup(pageA, runTag).catch(() => null); if (cl) out.cleanupAfterError = cl; }
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.api = apiLog;
    out.summary = { ok: out.steps.filter(x => x.ok).length, failed: out.steps.filter(x => !x.ok).length };
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-xp-ledger-es421] ' + out.summary.ok + ' ok · ' + out.summary.failed + ' failed · pageerror ' + out.errors + ' · api ' + JSON.stringify(apiLog));
  }
})();
