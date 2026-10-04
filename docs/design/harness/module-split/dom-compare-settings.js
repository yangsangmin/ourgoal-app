'use strict';
// 설정 탭 DOM·저장값·토스트 전후 비교 (TASK-ES-354). 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 기록해 비교한다.
// 사용: node dom-compare-settings.js <baseApp> <afterApp> <out.json>
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
// 단계: [이름, 페이지에서 할 일]
const STEPS = [
  ['enter', null],
  ['avatarGreetingSwitch', '#avatarGreetingSwitch'],
  ['onlineStatusSwitch', '#onlineStatusSwitch'],
  ['notifMode-vibrate', '#notifFeedbackModeGrid [data-notifmode="vibrate"]'],
  ['notifPrivacy-summary', '#notifPrivacyToggle [data-privacy="summary"]'],
  ['notifBgSwitch', '#notifBgSwitch'],
  ['quietHoursSwitch', '#quietHoursSwitch'],
  ['notifDmSwitch', '#notifDmSwitch'],
  ['presetTimesBtn', '#presetTimesBtn'],
  ['addTimeBtn', '#addTimeBtn'],
  ['timedel-0', '#checkinTimesRow [data-timedel="0"]'],
  ['theme-white', '#themeGrid [data-themeid="white"]'],
  ['highContrastSwitch', '#highContrastSwitch'],
  ['fontSize-large', '#fontSizeToggle [data-fs="large"]'],
  ['dataSaverSwitch', '#dataSaverSwitch'],
  ['gcalAutoSyncSwitch', '#gcalAutoSyncSwitch'],
  ['virtualCheerSwitch', '#virtualCheerSwitch'],
  ['notionSwitch', '#notionSwitch'],
  ['notionAutoPushSwitch', '#notionAutoPushSwitch'],
  ['autoUpdateSwitch', '#autoUpdateSwitch'],
  ['format-csv', '#formatToggle [data-fmt="csv"]'],
  ['privGoalSelect', { select: '#privGoalSelect', value: 'public' }],
  ['avatarGreetingDayHour', { select: '#avatarGreetingDayHour', value: '6' }],
  ['tab-home-and-back', { tabRoundTrip: true }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.getElementById('screen-settings');
    // 시간 의존 값은 따로 떼어 둔다(캐시 추정치는 브라우저 저장 사용량에 따라 바뀐다)
    const html = scr ? scr.outerHTML : null;
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80) + ' @ ' + location.href; }
    const toastEl = document.querySelector('.toast, #toast');
    const reg = window.OurgoalRegistry ? { mega: window.OurgoalRegistry.listMegaBlocks().find(b => b.id === 'settings'), errors: window.OurgoalRegistry.getErrorLog().length } : null;
    const subs = window.OurgoalEvents && window.OurgoalEvents.subscriptions ? window.OurgoalEvents.subscriptions().filter(s => s.owner && s.owner.indexOf('settings/') === 0) : null;
    return { html, ls, toast: toastEl ? toastEl.textContent.trim() : null, theme: document.documentElement.getAttribute('data-theme'), cls: document.documentElement.className + '|' + document.body.className, activeScreen: (document.querySelector('.screen.active') || {}).id || null, reg, subs,
      globals: { renderSettingsScreen: typeof window.renderSettingsScreen, collapse: typeof window.collapseAllSettingsSections, toggleAdv: typeof window.toggleAdvancedSettings, paint: typeof window.paintCacheUsage } };
  });
}
const VOLATILE_LS = /time|ts|At$|last|session|_seen|visit|posthog|ph_/i;
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
// 실행마다 바뀌는 값: 이 기기 등록 id(dev_<시각>_<난수>)와 첫 로그인·마지막 활동 시각
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>');
function normHtml(h) {
  return h == null ? h : VOL(h).replace(/약 [0-9.]+ (B|KB|MB) 사용 중 \(브라우저 추정치\)/g, '약 <n> 사용 중 (브라우저 추정치)');
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
  const nav = await goTab(page, 'settings');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && typeof act === 'string') {
      const ok = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; el.click(); return true; }, act);
      note = ok ? 'clicked' : 'missing';
    } else if (act && act.select) {
      note = await page.evaluate((sel, v) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return 'changed'; }, act.select, act.value);
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'settings'); note = 'roundtrip';
    }
    await sleep(700);
    const snap = await snapshot(page);
    steps.push({ name, note, html: normHtml(snap.html), ls: normLs(snap.ls), toast: snap.toast, theme: snap.theme, cls: snap.cls, activeScreen: snap.activeScreen, reg: snap.reg, subs: snap.subs, globals: snap.globals, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const diffs = [];
  ra.steps.forEach((sa, i) => {
    const sb = rb.steps[i];
    for (const k of ['note', 'html', 'ls', 'toast', 'theme', 'cls', 'activeScreen', 'globals', 'newErrors', 'reg', 'subs']) {
      const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
      if (x !== y && k === 'ls') {
        const keys = [...new Set([...Object.keys(sa.ls), ...Object.keys(sb.ls)])].filter(q => sa.ls[q] !== sb.ls[q]);
        for (const q of keys) { const u = String(sa.ls[q]), v = String(sb.ls[q]); let at = 0; while (at < u.length && u[at] === v[at]) at++;
          diffs.push({ structural: false, step: sa.name, field: 'ls:' + q, base: u.slice(Math.max(0, at - 80), at + 120), after: v.slice(Math.max(0, at - 80), at + 120) }); }
        continue;
      }
      if (x !== y) {
        let at = 0; while (at < x.length && x[at] === y[at]) at++;
        diffs.push({ structural: k === 'reg' || k === 'subs', step: sa.name, field: k, base: x.slice(Math.max(0, at - 120), at + 200), after: y.slice(Math.max(0, at - 120), at + 200) });
      }
    }
  });
  const summary = { steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note), htmlBytes: ra.steps.map(s => (s.html || '').length), comparedFields: ra.steps.length * 11, differing: diffs.length, differingBehavior: diffs.filter(d => !d.structural).length, differingStructural: diffs.filter(d => d.structural).length, diffs,
    errorsBase: ra.errors, errorsAfter: rb.errors, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'differing', diffs.length, 'behavior', diffs.filter(d => !d.structural).length, 'structural', diffs.filter(d => d.structural).length, 'errors base/after', ra.errors.length, rb.errors.length);
  for (const d of diffs.filter(d => !d.structural).slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
