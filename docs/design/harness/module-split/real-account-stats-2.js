'use strict';
// #TASK-ES-401 로그인 상태 통계 화면 전후 비교(작업자 보조, 판정 아님) — 읽기만 한다(가져오기 융합·샘플 로드·저장 버튼은 누르지 않는다).
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// 주소·비밀번호·uid·기록 내용은 출력·기록하지 않는다 — 단계마다 #screen-records·#modalOverlay HTML(시각·난수 정규화)의 sha256 과 바이트 수, 콘솔 오류 수만 남긴다.
// 난수는 페이지마다 같은 씨앗으로 고정한다(그래프 id 등). 같은 앱을 두 번 돌린 값끼리 다르면 본질 변동이다.
// 단계: 로그인 → 기록 탭 → 통계 세그먼트 → 렌즈 4종 → 데이터 관리 메뉴 → 가져오기 모달(탭 전환만) → 닫기 → 활용 가이드(공개 API) → 닫기
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-stats-2.js <APP_DIR> <label> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [APP, LABEL, OUT] = process.argv.slice(2);
const env = process.env;
for (const k of ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD']) if (!env[k]) { console.log('계정 없음 — 재생 안 함(' + k + ')'); process.exitCode = 2; return; }
const allow = String(env.OG_TEST_ALLOW || '').split(',').map(s => s.trim()).filter(Boolean);
if (!/ogtest/i.test(env.OG_TEST_A_EMAIL) && !allow.includes(env.OG_TEST_A_EMAIL)) { console.log('테스트 계정 표식 없음 — 접속 안 함'); process.exitCode = 3; return; }
const UPSTREAM = new URL(env.OG_APP_URL.replace(/\/+$/, ''));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn().catch(() => null); if (v) return v; await wait(500); } return null; }
function serve(dir) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) {
      if (/^\/api\/avatar-(face|persona)/.test(p)) { res.writeHead(403); return res.end(); } // 외부 AI 호출은 막는다
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
const VOL = x => x == null ? '' : String(x).replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>');
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const click = sel => ({ click: sel });
const STEPS = [
  ['records', { tab: 'records' }],
  ['seg-stats', click('#recSegmentBar [data-recseg="stats"]')],
  ['lens-ratio', click('.u-lens-btn[data-lens="ratio"]')],
  ['lens-radar', click('.u-lens-btn[data-lens="radar"]')],
  ['lens-cadence', click('.u-lens-btn[data-lens="cadence"]')],
  ['lens-trend', click('.u-lens-btn[data-lens="trend"]')],
  ['mgmt-menu', click('#uHdrMgmtMenuBtn')],
  ['menu-import', click('#uMenuImportBtn')],
  ['imp-tab-csv', click('#uImpTabCsv')],
  ['imp-tab-text', click('#uImpTabText')],
  ['imp-close', click('#uImpCancelBtn')],
  ['guide-open-api', { evalApi: 'guide' }],
  ['guide-close', click('#uGuideCloseBtn')],
];
(async () => {
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, env: 'local 127.0.0.2 static + /api forwarded to production · test account A (address hidden) · read-only steps', steps: [], errors: 0 };
  try {
    const bctx = await browser.createBrowserContext();
    const page = await bctx.newPage();
    await page.evaluateOnNewDocument(() => { let sd = 20261005; Math.random = function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page.on('pageerror', () => { out.errors++; });
    page.on('console', m => { if (m.type() === 'error') out.errors++; });
    const ok = await login(page, base);
    out.loggedIn = ok;
    if (!ok) throw new Error('로그인 실패');
    await wait(3000);
    for (const [name, act] of STEPS) {
      let note = '';
      if (act.tab) note = await page.evaluate(t => { const b = document.querySelector('.navbtn[data-tab="' + t + '"]'); if (!b) return 'missing'; b.click(); return 'clicked'; }, act.tab);
      else if (act.click) note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act.click);
      else if (act.evalApi === 'guide') note = await page.evaluate(() => { const U = window.OurgoalUniversalStats; if (!U || typeof U.openGuideModal !== 'function') return 'no-fn'; U.openGuideModal({ openModal: window.openModal, closeModal: window.closeModal }); return 'opened'; });
      await wait(1500);
      const snap = await page.evaluate(() => {
        const o = id => { const el = document.getElementById(id); return el ? el.outerHTML : ''; };
        return { html: o('screen-records'), modal: o('modalOverlay'), active: (document.querySelector('.screen.active') || {}).id || null, statsMounted: !!document.querySelector('.u-lens-btn') };
      });
      const h = VOL(snap.html), m = VOL(snap.modal);
      out.steps.push({ name, note, active: snap.active, statsMounted: snap.statsMounted, htmlBytes: h.length, htmlSha: sha(h), modalBytes: m.length, modalSha: sha(m) });
      if (OUT) fs.writeFileSync(OUT.replace(/\.json$/, '') + '.raw-' + name + '.txt', h + '\n<<MODAL>>\n' + m, 'utf8'); // 진단용 원문 — 스크래치에만 두고 저장소에 올리지 않는다
    }
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 160);
  } finally {
    await browser.close().catch(() => {}); s.close();
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
    console.log('[real-account-stats-2] ' + LABEL + ' loggedIn ' + out.loggedIn + ' steps ' + out.steps.length + ' errors ' + out.errors + (out.error ? ' error ' + out.error : ''));
    console.log(out.steps.map(x => x.name + ':' + x.note + ':' + x.htmlBytes + '/' + x.modalBytes).join(' · '));
  }
})();
