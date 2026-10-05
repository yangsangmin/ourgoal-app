'use strict';
// #TASK-ES-423 실계정 화면 확인(작업자 보조, 판정 아님) — 인라인 스크립트 세포화 1차로 옮긴 잠금화면 이미지 그리기(js/tabs/calendar/lockscreen-image.js)와
// 갓생 카드 보내기 창(js/tabs/comm/story-card-send.js)이 로그인한 실계정 화면에서 이전과 같이 그려지는가(읽기 전용). real-account-components.js(#TASK-ES-411)와 같은 틀.
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// /api 중 AI 호출(돈·외부 전송)·푸시·탈퇴 경로는 막고(503), /api/track 도 action 이 sync_records·notion_push·inquiry 면 막는다.
// 쓰는 행 0 — 갓생 카드 「전송」·「인증」(team_pings insert)은 누르지 않는다. 창은 열고 「닫기」로 닫는다. 잠금화면 카드 「저장」은 브라우저 안 캔버스 그리기라 누르되 내려받기는 가로채 파일을 만들지 않는다.
// 주소·비밀번호·uid·닉네임·화면 글자는 출력·기록하지 않는다 — 화면 글자는 시각·숫자 시각을 지운 뒤 sha256 앞 16자와 길이만 남긴다.
// 단계: ① 로그인 ② 옮긴 이름의 window 종류 ③ 일정 탭 「잠금화면」 허브 창 ④ 「잠금화면용 일정 카드 저장」 → 내려받기 이름·이미지 해시·토스트
//       ⑤ window.generateLockScreenCalendarImage(이번 달, 어두운·밝은) 캔버스 해시 ⑥ 기록 탭 갓생 카드 창 → 「동반자에게 보내기」 창 → 닫기 ⑦ 「팀 단체방에 인증」 창 → 닫기 ⑧ 프로필 기록 수 전후 같음(쓴 행 0)
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-inline-split-1.js <APP_DIR> <label> <out.json>
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
  const port = 5900 + Math.floor(Math.random() * 300);
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
const MOVED = ['lsDrawRoundRect', 'generateLockScreenCalendarImage', 'generateLockScreenScheduleCardImage', 'openSelectCompanionForStoryModal', 'openSelectTeamForStoryModal'];
const CANVAS = theme => '(async function(){ if(typeof window.generateLockScreenCalendarImage !== "function") return "no-fn"; var s = window.state || {}; var d = new Date(); try { var c = await window.generateLockScreenCalendarImage(d.getFullYear(), d.getMonth(), s.records || [], s.goals || [], { theme: "' + theme + '" }); var u = c.toDataURL("image/png"); var h = 2166136261; for (var i = 0; i < u.length; i++){ h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return c.width + "x" + c.height + ":len" + u.length + ":h" + h.toString(16); } catch(e){ return "throw:" + String(e).slice(0,60); } })()';
const modalOpen = page => page.evaluate(() => { const o = document.getElementById('modalOverlay'); return !!(o && o.classList.contains('active')); });
const toastText = page => page.evaluate(() => { const t = document.querySelector('#toast'); return t ? t.textContent.trim() : null; });
(async () => {
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, env: 'local 127.0.0.2 static + /api/track forwarded to production (AI·push·withdraw paths and sync_records·notion_push·inquiry blocked) · test account A (address hidden) · temporary browser profile · read-only (no send/certify buttons; download intercepted)', steps: [], errors: [] };
  const rec = (name, v, extra) => { const e = Object.assign({ name, present: !!v, visible: v ? v.visible : null, textHash: v ? H(v.text) : null, textLen: v ? v.text.length : null, attrsHash: v ? H(v.attrs) : null }, extra || {}); out.steps.push(e); console.log('  · ' + name + ' ' + JSON.stringify(e)); };
  const recCount = page => page.evaluate(() => { const p = window.state && window.state.profile; return p && Array.isArray(p.records) ? p.records.length : null; });
  try {
    const bctx = await browser.createBrowserContext();
    const page = await bctx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page.on('pageerror', e => { out.errors.push(String(e && e.message || e).replace(/https?:\/\/[^\s)]+/g, '<url>').slice(0, 120)); });
    // 내려받기: <a download> 클릭을 가로채 이름(날짜 지움)·이미지 길이·해시만 적는다(파일을 만들지 않는다)
    await page.evaluateOnNewDocument(() => {
      window.__es423dl = [];
      const OA = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download) { const u = String(this.href || ''); let h = 2166136261; for (let i = 0; i < u.length; i++) { h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } window.__es423dl.push(this.download.replace(/\d{4}-\d\d-\d\d/, '<d>') + '|len' + u.length + '|h' + h.toString(16)); return; }
        return OA.apply(this, arguments);
      };
    });
    const ok = await login(page, base);
    out.loggedIn = ok;
    console.log('  ① 로그인 ' + ok);
    if (!ok) throw new Error('로그인 실패');
    await wait(3000);
    const before = await recCount(page);
    out.globals = await page.evaluate(list => list.map(k => k + '/' + typeof window[k]).join(','), MOVED);
    console.log('  ② window 종류 ' + out.globals);
    await clickSel(page, '.navbtn[data-tab="calendar"]'); await wait(2500);
    const hub = await clickSel(page, '#calLockScreenBtn'); await wait(1500);
    rec('③ 잠금화면 허브 창 #modalSheet', await readView(page, '#modalSheet'), { opened: hub });
    const dl = await clickSel(page, '#modalOverlay #btnDownloadLockscreenCard'); await wait(4000);
    out.lockCardDownload = await page.evaluate(() => (window.__es423dl || []).splice(0));
    out.lockCardToastHash = H(await toastText(page));
    console.log('  ④ 일정 카드 저장 ' + dl + ' ' + JSON.stringify(out.lockCardDownload) + ' 토스트 ' + out.lockCardToastHash);
    out.calImageDark = await page.evaluate(CANVAS('dark')); await wait(1000);
    out.calImageLight = await page.evaluate(CANVAS('light'));
    console.log('  ⑤ 월간 달력 이미지 ' + out.calImageDark + ' / ' + out.calImageLight);
    await page.evaluate(() => { if (typeof window.closeModal === 'function') window.closeModal(); }); await wait(1000);
    await clickSel(page, '.navbtn[data-tab="records"]'); await wait(2500);
    const story = await clickSel(page, '#recStoryCardBtn'); await wait(2500);
    rec('⑥ 갓생 카드 창 #modalSheet', await readView(page, '#modalSheet'), { opened: story });
    const comp = await clickSel(page, '#modalOverlay #btnShareStoryToCompanion'); await wait(1500);
    rec('⑥ 동반자에게 보내기 창 #modalSheet', await readView(page, '#modalSheet'), { clicked: comp, sendButtons: await page.evaluate(() => document.querySelectorAll('#modalOverlay [data-sendcompstory]').length), toastHash: H(await toastText(page)) });
    await clickSel(page, '#modalOverlay #closeCompStoryModalBtn'); await wait(1000);
    out.compClosed = !(await modalOpen(page));
    await clickSel(page, '#recStoryCardBtn'); await wait(2500);
    const team = await clickSel(page, '#modalOverlay #btnShareStoryToTeam'); await wait(1500);
    rec('⑦ 팀 단체방에 인증 창 #modalSheet', await readView(page, '#modalSheet'), { clicked: team, sendButtons: await page.evaluate(() => document.querySelectorAll('#modalOverlay [data-sendteamstory]').length), toastHash: H(await toastText(page)) });
    await clickSel(page, '#modalOverlay #closeTeamStoryModalBtn'); await wait(500);
    await page.evaluate(() => { if (typeof window.closeModal === 'function') window.closeModal(); }); await wait(800);
    out.teamClosed = !(await modalOpen(page));
    const after = await recCount(page);
    out.recordsCountUnchanged = before === after; out.rowsWritten = 0;
    console.log('  ⑧ 프로필 기록 수 전후 같음 ' + out.recordsCountUnchanged + ' · 닫힘 ' + out.compClosed + '/' + out.teamClosed);
  } catch (e) {
    out.failure = String(e && e.message || e).slice(0, 160);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {}); s.close();
    out.api = apiLog;
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-inline-split-1] ' + LABEL + ' steps ' + out.steps.length + ' · pageerror ' + out.errors.length + ' · api ' + JSON.stringify(apiLog));
  }
})();
