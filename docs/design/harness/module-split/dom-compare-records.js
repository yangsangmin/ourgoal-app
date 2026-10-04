'use strict';
// 기록 탭 DOM·저장값·토스트 전후 비교 (#TASK-ES-358). 설정 시범(#TASK-ES-354 dom-compare-settings.js)과 같은 방식:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 #screen-records 의 HTML·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-records.js <baseApp> <afterApp> <out.json>
const http = require('http'), fs = require('fs'), path = require('path');
const HARN = path.join(__dirname, '..') + '/';
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require(HARN + 'shots-lib.js');
const { boot, goTab, sleep } = require(HARN + 'tab-states.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serve(dir) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 5100 + Math.floor(Math.random() * 400);
  return new Promise(r => s.listen(port, () => r({ s, base: 'http://127.0.0.1:' + port })));
}
// 단계: [이름, 할 일]. 옮긴 함수가 그리는 곳(세그먼트·캐러셀·기간별 AI 피드백 카드)과 다시 그리기(탭 왕복)를 차례로 누른다.
const STEPS = [
  ['enter', null],
  ['seg-stats', '#recSegmentBar [data-recseg="stats"]'],
  ['slide-1', '#recCarouselPills [data-recslide="1"]'],
  ['slide-2', '#recCarouselPills [data-recslide="2"]'],
  ['slide-3', '#recCarouselPills [data-recslide="3"]'],
  ['slide-0', '#recCarouselPills [data-recslide="0"]'],
  ['period-preset-first', '#periodPresetRow button'],
  ['period-ai-request', '#periodAiRequestBtn'],
  ['period-fb-close', '#periodFbCloseBtn'],
  ['seg-archive', '#recSegmentBar [data-recseg="archive"]'],
  ['seg-feed', '#recSegmentBar [data-recseg="feed"]'],
  ['tab-home-and-back', { tabRoundTrip: true }],
  ['rerender-call', { rerender: true }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.getElementById('screen-records');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const reg = window.OurgoalRegistry ? { mega: window.OurgoalRegistry.listMegaBlocks().find(b => b.id === 'records'), errors: window.OurgoalRegistry.getErrorLog().length } : null;
    const subs = window.OurgoalEvents && window.OurgoalEvents.subscriptions ? window.OurgoalEvents.subscriptions().filter(s => s.owner && s.owner.indexOf('records/') === 0).map(s => s.event + '|' + s.owner) : null;
    return { html: scr ? scr.outerHTML : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null, reg, subs,
      globals: { renderRecordsScreen: typeof window.renderRecordsScreen, purge: typeof window.purgeSampleRecordsOneClick, weeklyRecapStats: typeof window.weeklyRecapStats } };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>');
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(j, (key, x) => (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : x); } catch (e) {}
    o[k] = VOL(val);
  }
  return o;
}
async function run(app, label) {
  const { s, base } = await serve(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const ctx = await browser.createBrowserContext();
  const page = await shots.newPage(ctx, true, 'focus-sanctuary');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await boot(page);
  const nav = await goTab(page, 'records');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'records'); note = 'roundtrip';
    } else if (act && act.rerender) {
      note = await page.evaluate(() => { if (typeof window.renderRecordsScreen !== 'function') return 'no-fn'; window.renderRecordsScreen(); return 'called'; });
    }
    await sleep(900);
    const snap = await snapshot(page);
    steps.push({ name, note, html: VOL(snap.html), ls: normLs(snap.ls), toast: snap.toast, activeScreen: snap.activeScreen, reg: snap.reg, subs: snap.subs, globals: snap.globals, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const FIELDS = ['note', 'html', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors', 'reg', 'subs'];
  const diffs = [];
  ra.steps.forEach((sa, i) => {
    const sb = rb.steps[i];
    for (const k of FIELDS) {
      const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
      if (x === y) continue;
      let at = 0; while (at < x.length && x[at] === y[at]) at++;
      diffs.push({ step: sa.name, field: k, base: x.slice(Math.max(0, at - 120), at + 200), after: y.slice(Math.max(0, at - 120), at + 200) });
    }
  });
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note), htmlBytes: ra.steps.map(s => (s.html || '').length),
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, errorsBase: ra.errors, errorsAfter: rb.errors, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
