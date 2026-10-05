'use strict';
// #TASK-ES-405 로그인 상태 통계 화면 전후 비교(작업자 보조, 판정 아님) — 2차 real-account-stats-2.js(#TASK-ES-401)와 같은 방식에 3차 단계를 더하고,
// 기준 앱 2회·후 앱 1회를 한 번에 돌려 맞댄다(기준끼리 다른 칸 = 본질 변동으로 따로 셈). 읽기만 한다(가져오기 융합·샘플 로드·저장 버튼은 누르지 않는다).
// 3차 단계: 전체화면 모달 열기·닫기, 차등 분석 기준 설정 모달(공개 API) 열기·닫기(저장 안 누름), 리포트 카드 HTML(공개 API — 해시만), 정제 CSV 내보내기(다운로드 막음 — CSV 글자 해시만).
// (2차 설명)
// 로컬 127.0.0.2 정적 서버(앱 사본) + /api 운영 전달(OG_APP_URL), 테스트 계정 A 이메일 로그인(OG_TEST_A_EMAIL·OG_TEST_A_PASSWORD — Windows 사용자 환경 변수를 자식 프로세스에만).
// 주소·비밀번호·uid·기록 내용은 출력·기록하지 않는다 — 단계마다 #screen-records·#modalOverlay HTML(시각·난수 정규화)의 sha256 과 바이트 수, 콘솔 오류 수만 남긴다.
// 난수는 페이지마다 같은 씨앗으로 고정한다(그래프 id 등). 같은 앱을 두 번 돌린 값끼리 다르면 본질 변동이다.
// 단계: 로그인 → 기록 탭 → 통계 세그먼트 → 렌즈 4종 → 데이터 관리 메뉴 → 가져오기 모달(탭 전환만) → 닫기 → 활용 가이드(공개 API) → 닫기
// 사용(PowerShell 에서 환경 변수를 자식에만): node real-account-stats-3.js <기준 APP_DIR> <후 APP_DIR> <out.json>
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [BASE_APP, AFTER_APP, OUT] = process.argv.slice(2);
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
  // ── 3차(#TASK-ES-405) ──
  ['fs-open', click('#uBtnGraphFullscreen')],
  ['fs-close', click('#uFsCloseBtn')],
  ['diff-cfg-open-api', { evalApi: 'diffcfg' }],
  ['diff-cfg-close', { evalApi: 'close' }],
  ['diff-card-api', { evalApi: 'diffcard' }],
  ['mgmt-menu-2', click('#uHdrMgmtMenuBtn')],
  ['menu-export-csv', click('#uMenuExportCsvBtn')],
  ['csv-content', { evalApi: 'blob' }],
  ['menu-close', { evalApi: 'close' }],
];
async function runOnce(APP, LABEL) {
  const { s, base } = await serve(APP);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'] });
  const out = { label: LABEL, env: 'local 127.0.0.2 static + /api forwarded to production · test account A (address hidden) · read-only steps', steps: [], errors: 0 };
  try {
    const bctx = await browser.createBrowserContext();
    const page = await bctx.newPage();
    await page.evaluateOnNewDocument(() => { let sd = 20261005; Math.random = function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; });
    await page.evaluateOnNewDocument(() => { const o = URL.createObjectURL; URL.createObjectURL = function (b) { (window.__cmpBlobs = window.__cmpBlobs || []).push(b); return o.call(URL, b); }; });
    try { const cdp = await page.target().createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'deny' }); } catch (e) {}
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
      else if (act.evalApi === 'diffcfg') note = await page.evaluate(() => { const U = window.OurgoalUniversalStats; if (!U || typeof U.openDifferentiatedMetricConfigModal !== 'function') return 'no-fn'; U.openDifferentiatedMetricConfigModal({ openModal: window.openModal, closeModal: window.closeModal }); return 'opened'; });
      else if (act.evalApi === 'close') note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
      else if (act.evalApi === 'diffcard') note = 'sha ' + sha(VOL(await page.evaluate(() => { const U = window.OurgoalUniversalStats; if (!U) return 'no-fn'; const ts = [{ label: 'a', value: 80 }, { label: 'b', value: 79.2 }, { label: 'c', value: 78.4 }]; return Object.keys(U.METRIC_DIFFERENTIATED_MODELS).concat(['unknown_metric']).map(k => U.renderDifferentiatedReportCard(k, ts)).join('\n'); })));
      else if (act.evalApi === 'blob') note = 'sha ' + sha(VOL(await page.evaluate(async () => { const bs = window.__cmpBlobs || []; const b = bs[bs.length - 1]; if (!b) return 'no-blob'; return 'blobs ' + bs.length + ' | ' + (await b.text()); })));
      else if (act.evalApi === 'guide') note = await page.evaluate(() => { const U = window.OurgoalUniversalStats; if (!U || typeof U.openGuideModal !== 'function') return 'no-fn'; U.openGuideModal({ openModal: window.openModal, closeModal: window.closeModal }); return 'opened'; });
      await wait(1500);
      const snap = await page.evaluate(() => {
        const o = id => { const el = document.getElementById(id); return el ? el.outerHTML : ''; };
        return { html: o('screen-records'), modal: o('modalOverlay'), active: (document.querySelector('.screen.active') || {}).id || null, statsMounted: !!document.querySelector('.u-lens-btn') };
      });
      const h = VOL(snap.html), m = VOL(snap.modal);
      out.steps.push({ name, note, active: snap.active, statsMounted: snap.statsMounted, htmlBytes: h.length, htmlSha: sha(h), modalBytes: m.length, modalSha: sha(m) });
    }
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 160);
  } finally {
    await browser.close().catch(() => {}); s.close();
    console.log('[real-account-stats-3] ' + LABEL + ' loggedIn ' + out.loggedIn + ' steps ' + out.steps.length + ' errors ' + out.errors + (out.error ? ' error ' + out.error : ''));
    console.log(out.steps.map(x => x.name + ':' + String(x.note).slice(0, 24) + ':' + x.htmlBytes + '/' + x.modalBytes).join(' · '));
  }
  return out;
}
const FIELDS = ['note', 'active', 'statsMounted', 'htmlBytes', 'htmlSha', 'modalBytes', 'modalSha'];
const diff = (a, b) => { const o = []; a.steps.forEach((x, i) => { const y = b.steps[i] || {}; for (const k of FIELDS) if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) o.push(x.name + '|' + k); }); if (a.steps.length !== b.steps.length) o.push('<steps>'); return o; };
(async () => {
  const b1 = await runOnce(BASE_APP, 'base1'), b2 = await runOnce(BASE_APP, 'base2'), af = await runOnce(AFTER_APP, 'after');
  const noise = diff(b1, b2), all = diff(b1, af);
  const real = all.filter(k => !noise.includes(k));
  const ok = b1.loggedIn && b2.loggedIn && af.loggedIn && !b1.error && !b2.error && !af.error;
  const summary = { task: 'TASK-ES-405', env: b1.env, steps: b1.steps.map(x => x.name), comparedFields: b1.steps.length * FIELDS.length, allRunsLoggedIn: ok,
    errors: [b1.errors, b2.errors, af.errors], runErrors: [b1.error || null, b2.error || null, af.error || null],
    baseVsBaseDiffering: noise.length, noise, baseVsAfterDiffering: all.length, differingExcludingNoise: ok ? real.length : null, diffs: real, base1: b1.steps, after: af.steps };
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(summary, null, 1) + '\n', 'utf8');
  console.log('[real-account-stats-3] loggedIn ' + ok + ' compared ' + summary.comparedFields + ' base/base ' + noise.length + ' base/after ' + all.length + ' excl. noise ' + real.length + (real.length ? ' ' + real.join(',') : ''));
  process.exitCode = ok && real.length === 0 ? 0 : 1;
})();
