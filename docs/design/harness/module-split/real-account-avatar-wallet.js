'use strict';
// #TASK-ES-389 실계정 보관함 왕복 확인(작업자 보조, 판정 아님) — 옮긴 wallet 세포(addSavedAvatar·removeSavedAvatar)가 서버 원장 users.saved_avatars 와 이전처럼 오가는가.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// 주소·비밀번호·uid·다른 보관함 항목 내용은 출력·기록하지 않는다(건수·참거짓·이번 실행 표식 항목의 칸 이름만).
// 단계: ① 로그인 → 서버 보관함 건수 ② OurgoalAvatar.addSavedAvatar(state.profile, 표식 항목) + saveProfile → 서버에 표식 항목이 같은 값으로 있는가
//       ③ 기기 사본 파기(ourgoal_settings_<uid>·ourgoal_saved_avatars_backup_<uid>·ourgoal_guest_profile 삭제) → 새로고침 → 화면 상태에 표식 항목이 서버에서 되살아났는가(deepStrictEqual)
//       ④ 정리: removeSavedAvatar + saveProfile → 서버에서 표식 항목 0, 건수 = ① 의 건수
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-avatar-wallet.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), assert = require('assert');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [APP, LABEL, OUT] = process.argv.slice(2);
const env = process.env;
for (const k of ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim()).filter(Boolean);
if (!/ogtest/i.test(env.OG_TEST_A_EMAIL) && !allow.includes(env.OG_TEST_A_EMAIL)) { console.log('테스트 계정 표식 없음 — 접속 안 함'); process.exitCode = 3; return; }
const UPSTREAM = new URL(env.OG_APP_URL.replace(/\/+$/, ''));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn().catch(() => null); if (v) return v; await wait(500); } return null; }

function serve(dir) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) {
      const up = https.request({ hostname: UPSTREAM.hostname, port: 443, path: req.url, method: req.method, headers: Object.assign({}, req.headers, { host: UPSTREAM.hostname }) }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
      up.on('error', () => { res.writeHead(502); res.end(); });
      return req.pipe(up);
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
// 서버 보관함 읽기 — 본인 행만, 표식 항목만 꺼내고 나머지는 건수만
const readServer = (page, tag) => page.evaluate(async (tag) => {
  const sc = window.OurgoalAppScope.scope; const sb = sc.sb; const uid = sc.state.profile.id;
  const r = await sb.from('users').select('saved_avatars').eq('id', uid).maybeSingle();
  if (r.error) return { error: String(r.error.message || r.error).slice(0, 120) };
  const list = Array.isArray(r.data && r.data.saved_avatars) ? r.data.saved_avatars : [];
  return { count: list.length, tagged: list.filter(a => a && a.growthPrompt === tag) };
}, tag);
const readLocal = (page, tag) => page.evaluate((tag) => {
  const list = (window.state.profile.settings || {}).savedAvatars || [];
  return { count: list.length, tagged: list.filter(a => a && a.growthPrompt === tag) };
}, tag);

(async () => {
  const runTag = 'ogtest-es389-' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + '-' + Math.random().toString(36).slice(2, 6);
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, runTag, env: 'local 127.0.0.2 static + /api forwarded to production · test account A (address hidden)', steps: [], errors: 0 };
  const step = (name, ok, evidence) => { out.steps.push({ name, ok: !!ok, evidence }); console.log((ok ? '  ok · ' : '  실패 · ') + name + ' ' + JSON.stringify(evidence)); if (!ok) process.exitCode = 1; };
  let page;
  try {
    const bctx = await browser.createBrowserContext();
    page = await bctx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.on('dialog', d => d.accept().catch(() => {}));
    page.on('pageerror', () => { out.errors++; });
    const ok = await login(page, base);
    step('① 로그인(이메일)', ok, { loggedIn: ok });
    if (!ok) throw new Error('로그인 실패');
    await wait(2500);
    const before = await readServer(page, runTag);
    step('① 서버 보관함 읽기', !before.error, { count: before.count, tagged: before.tagged && before.tagged.length, error: before.error || null });
    const added = await page.evaluate(async (png, tag) => {
      const sc = window.OurgoalAppScope.scope;
      const list = window.OurgoalAvatar.addSavedAvatar(sc.state.profile, { url: png, themeId: 7, growthPrompt: tag });
      await sc.saveProfile();
      const it = list.filter(a => a.growthPrompt === tag)[0];
      return { localCount: list.length, item: it };
    }, PNG, runTag);
    await wait(3000);
    const afterAdd = await readServer(page, runTag);
    const keys = added.item ? Object.keys(added.item).sort() : [];
    let same = false; try { assert.deepStrictEqual(afterAdd.tagged[0], added.item); same = true; } catch (e) {}
    step('② addSavedAvatar + saveProfile → 서버 users.saved_avatars 에 표식 항목 1건, 값 같음', afterAdd.tagged && afterAdd.tagged.length === 1 && same, { serverCount: afterAdd.count, localCount: added.localCount, tagged: afterAdd.tagged && afterAdd.tagged.length, sameValue: same, fields: keys });
    // ③ 기기 사본 파기 → 새로고침 → 서버에서 복원
    await page.evaluate(() => { const uid = window.state.profile.id; ['ourgoal_settings_' + uid, 'ourgoal_saved_avatars_backup_' + uid, 'ourgoal_guest_profile'].forEach(k => localStorage.removeItem(k)); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const back = await until(() => loggedIn(page), 30000);
    await wait(3500);
    const restored = await readLocal(page, runTag);
    let same2 = false; try { assert.deepStrictEqual(restored.tagged[0], added.item); same2 = true; } catch (e) {}
    step('③ 기기 사본 파기 → 새로고침 → 화면 상태에 서버에서 되살아남(deepStrictEqual)', back && restored.tagged.length === 1 && same2, { reloggedIn: !!back, localCount: restored.count, tagged: restored.tagged.length, sameValue: same2 });
    // ④ 정리
    const removed = await page.evaluate(async (tag) => {
      const sc = window.OurgoalAppScope.scope;
      const list = (sc.state.profile.settings.savedAvatars || []).filter(a => a.growthPrompt === tag);
      let r = null; for (const a of list) r = window.OurgoalAvatar.removeSavedAvatar(sc.state.profile, a.id);
      await sc.saveProfile();
      return { removeReturned: r, tries: list.length };
    }, runTag);
    await wait(3000);
    const afterRm = await readServer(page, runTag);
    step('④ removeSavedAvatar + saveProfile → 서버 표식 항목 0, 건수 = 처음', afterRm.tagged && afterRm.tagged.length === 0 && afterRm.count === before.count, { removeReturned: removed.removeReturned, serverCount: afterRm.count, beforeCount: before.count, tagged: afterRm.tagged && afterRm.tagged.length });
    out.leftover = afterRm.tagged ? afterRm.tagged.length : null;
  } catch (e) {
    step('실행', false, { error: String(e && e.message || e).slice(0, 160) });
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.summary = { ok: out.steps.filter(x => x.ok).length, failed: out.steps.filter(x => !x.ok).length };
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-avatar-wallet] ' + LABEL + ' ' + out.summary.ok + ' ok · ' + out.summary.failed + ' failed · pageerror ' + out.errors);
  }
})();
