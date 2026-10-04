'use strict';
// #TASK-ES-390 실계정 아바타 설정 모달 왕복 확인(작업자 보조, 판정 아님) — 옮긴 모달 섹션(bind-deck·bind-save)이 화면 조작으로 서버 원장 users.avatar_url 을 이전처럼 바꾸는가.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// 주소·비밀번호·uid·아바타 주소 값은 출력·기록하지 않는다(참거짓·건수·이번 실행 표식 일치 여부만).
// 단계: ① 로그인 → 서버 users.avatar_url 원래 값 기억(메모리만)
//       ② 화면 상태 보관함에 표식 항목 1개(이 실행 표식이 붙은 그림 주소)를 넣고 설정 탭 → #btnSettingsQuickAvatar(모달 열기) → 만화형 → 표식 카드 선택 → #btnSaveAvatarModal
//          → state.profile.avatarUrl = 표식 · 서버 users.avatar_url = 표식 (토스트 문구·#avatarTypeToggle 사라짐은 참고값으로만 적는다)
//       ③ 기기 사본 파기(ourgoal_settings_<uid>·ourgoal_guest_profile) → 새로고침 → 서버에서 avatarUrl 이 표식으로 되살아남
//       ④ 정리: 원래 avatarUrl·설정 칸(avatarType·customAvatarUrl·avatarThemeId)·보관함으로 되돌리고 saveProfile → 서버 users.avatar_url = 원래 값
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-avatar-modal.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path');
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
      if (/^\/api\/avatar-(face|persona)/.test(p)) { res.writeHead(403); return res.end(); } // 외부 AI 호출은 막는다(이 시험은 누르지 않음)
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
const readServerUrl = page => page.evaluate(async () => {
  const sc = window.OurgoalAppScope.scope; const uid = sc.state.profile.id;
  const r = await sc.sb.from('users').select('avatar_url').eq('id', uid).maybeSingle();
  if (r.error) return { error: String(r.error.message || r.error).slice(0, 120) };
  return { url: (r.data && r.data.avatar_url) || null };
});
(async () => {
  const runTag = 'ogtest-es390-' + new Date().toISOString().replace(/\D/g, '').slice(0, 12) + '-' + Math.random().toString(36).slice(2, 6);
  const TAGGED_URL = PNG + '#' + runTag;
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, runTag, env: 'local 127.0.0.2 static + /api forwarded to production (avatar-face·persona blocked) · test account A (address hidden)', steps: [], errors: 0 };
  const step = (name, ok, evidence) => { out.steps.push({ name, ok: !!ok, evidence }); console.log((ok ? '  ok · ' : '  실패 · ') + name + ' ' + JSON.stringify(evidence)); if (!ok) process.exitCode = 1; };
  let page, original = null;
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
    const before = await readServerUrl(page);
    original = await page.evaluate(() => { const p = window.state.profile; const st = p.settings || {}; return { avatarUrl: p.avatarUrl || null, avatarType: st.avatarType, customAvatarUrl: st.customAvatarUrl, avatarThemeId: st.avatarThemeId, savedAvatars: JSON.parse(JSON.stringify(st.savedAvatars || [])) }; });
    original.serverUrl = before.url;
    step('① 서버 users.avatar_url 읽기(값은 기록 안 함)', !before.error, { hasValue: !!before.url, error: before.error || null });
    // ② 모달 화면 조작
    await page.evaluate((url, tag) => { const st = window.state.profile.settings = window.state.profile.settings || {}; st.savedAvatars = (st.savedAvatars || []).concat([{ id: 'ava_' + tag.replace(/[^a-z0-9]/g, ''), url: url, themeId: 7, themeName: '표식', growthPrompt: tag }]); }, TAGGED_URL, runTag);
    await page.evaluate(() => { const b = document.querySelector('.navbtn[data-tab="settings"]'); if (b) b.click(); });
    await wait(1500);
    const opened = await page.evaluate(() => { const b = document.getElementById('btnSettingsQuickAvatar'); if (!b) return 'no-button'; b.click(); return 'clicked'; });
    const modalUp = await until(() => page.evaluate(() => !!document.querySelector('#avatarTypeToggle')), 8000);
    step('② 설정 → #btnSettingsQuickAvatar → 모달 열림', modalUp, { button: opened, modal: !!modalUp });
    const picked = await page.evaluate((tag) => {
      const t = document.querySelector('#avatarTypeToggle [data-avatartype="custom"]'); if (t) t.click();
      const id = 'ava_' + tag.replace(/[^a-z0-9]/g, '');
      const card = document.querySelector('#savedAvatarsDeckSlot .saved-avatar-card[data-ava-id="' + id + '"]');
      if (!card) return 'no-card';
      card.click();
      const s = document.getElementById('btnSaveAvatarModal'); if (!s) return 'no-save';
      s.click();
      return 'saved';
    }, runTag);
    await wait(4000);
    const afterSave = await page.evaluate((url) => {
      const toast = document.querySelector('#toast'); const p = window.state.profile;
      return { toastOk: !!(toast && /성공적으로 적용/.test(toast.textContent || '')), modalClosed: !document.querySelector('#avatarTypeToggle'), stateIsTag: p.avatarUrl === url, typeCustom: (p.settings || {}).avatarType === 'custom' };
    }, TAGGED_URL);
    const srv = await readServerUrl(page);
    step('② 만화형 → 표식 카드 → 적용하기 → state·서버 users.avatar_url = 표식 (토스트·#avatarTypeToggle 사라짐은 참고값)', picked === 'saved' && afterSave.stateIsTag && srv.url === TAGGED_URL, Object.assign({ action: picked, serverIsTag: srv.url === TAGGED_URL, serverError: srv.error || null }, afterSave));
    // ③ 기기 사본 파기 → 새로고침
    await page.evaluate(() => { const uid = window.state.profile.id; ['ourgoal_settings_' + uid, 'ourgoal_guest_profile'].forEach(k => localStorage.removeItem(k)); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const back = await until(() => loggedIn(page), 30000);
    await wait(3500);
    const restored = await page.evaluate((url) => window.state.profile.avatarUrl === url, TAGGED_URL);
    step('③ 기기 사본 파기 → 새로고침 → state.profile.avatarUrl 이 서버에서 표식으로 되살아남', back && restored, { reloggedIn: !!back, restoredIsTag: restored });
  } catch (e) {
    step('실행', false, { error: String(e && e.message || e).slice(0, 160) });
  } finally {
    // ④ 정리
    try {
      if (page && original) {
        await page.evaluate(async (o) => {
          const sc = window.OurgoalAppScope.scope; const p = sc.state.profile; p.settings = p.settings || {};
          p.avatarUrl = o.serverUrl || o.avatarUrl || null;
          ['avatarType', 'customAvatarUrl', 'avatarThemeId'].forEach(k => { if (o[k] === undefined) delete p.settings[k]; else p.settings[k] = o[k]; });
          p.settings.savedAvatars = o.savedAvatars;
          await sc.saveProfile();
        }, original);
        await wait(3000);
        const fin = await readServerUrl(page);
        step('④ 정리: 원래 값으로 되돌림 → 서버 users.avatar_url = 원래 값', !fin.error && fin.url === original.serverUrl, { sameAsOriginal: fin.url === original.serverUrl, error: fin.error || null });
        out.leftover = fin.url === original.serverUrl ? 0 : 1;
      }
    } catch (e) { step('④ 정리', false, { error: String(e && e.message || e).slice(0, 160) }); }
    await browser.close().catch(() => {}); s.close();
    out.summary = { ok: out.steps.filter(x => x.ok).length, failed: out.steps.filter(x => !x.ok).length };
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-avatar-modal] ' + LABEL + ' ' + out.summary.ok + ' ok · ' + out.summary.failed + ' failed · pageerror ' + out.errors);
  }
})();
