'use strict';
// 일정 탭 DOM·저장값·토스트 전후 비교 (#TASK-ES-360). 기록 탭 dom-compare-records.js(#TASK-ES-358)를 복제했다:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 #screen-calendar 의 HTML·모달·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-calendar.js <baseApp> <afterApp> <out.json>
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
// 단계: [이름, 할 일]. 옮긴 함수가 그리는 곳(월 그리드·날짜 칸·이동·보기 전환·선택한 날 상세·AI 일정 비서)과 다시 그리기(탭 왕복)를 차례로 누른다.
const STEPS = [
  ['enter', null],
  ['next-month', '#calNextBtn'],
  ['next-month-2', '#calNextBtn'],
  ['prev-month', '#calPrevBtn'],
  ['today', '#calTodayBtn'],
  ['select-date-10', { nth: ['#calGrid [data-caldate]', 10] }],
  ['select-date-20', { nth: ['#calGrid [data-caldate]', 20] }],
  ['view-week', '#calViewToggle [data-calview="week"]'],
  ['week-next', '#calNextBtn'],
  ['view-day', '#calViewToggle [data-calview="day"]'],
  ['day-prev', '#calPrevBtn'],
  ['view-month', '#calViewToggle [data-calview="month"]'],
  ['v3-mode-week', { nth: ['#screen-calendar .s-cal-mode-btn', 1] }],
  ['v3-mode-month', { nth: ['#screen-calendar .s-cal-mode-btn', 0] }],
  ['add-manual-open', '#calAddManualBtn'],
  ['add-manual-close', { closeModal: true }],
  ['agent-schedule', { agent: '내일 오후 3시 치과 예약' }],
  ['calshift-global', { evalFn: 'calShift' }],
  ['tab-home-and-back', { tabRoundTrip: true }],
  ['rerender-call', { rerender: true }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.getElementById('screen-calendar');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const reg = window.OurgoalRegistry ? { mega: window.OurgoalRegistry.listMegaBlocks().find(b => b.id === 'calendar'), errors: window.OurgoalRegistry.getErrorLog().length } : null;
    const subs = window.OurgoalEvents && window.OurgoalEvents.subscriptions ? window.OurgoalEvents.subscriptions().filter(s => s.owner && s.owner.indexOf('calendar/') === 0).map(s => s.event + '|' + s.owner) : null;
    const st = window.state || null;
    return { html: scr ? scr.outerHTML : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      cal: st ? { calDate: st.calDate || null, calView: st.calView || null, calSelectedDate: st.calSelectedDate || null } : null,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null, reg, subs,
      globals: { renderCalendarScreen: typeof window.renderCalendarScreen, calShift: typeof window.calShift, renderCalDayDetail: typeof window.renderCalDayDetail, calendarItemsByDate: typeof window.calendarItemsByDate } };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\bsched_[a-z0-9]{6,}/g, 'sched_<uid>'); // uid('sched') = 시각+난수(AI 일정 비서가 만든 일정 id)
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
  const nav = await goTab(page, 'calendar');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.nth) {
      note = await page.evaluate(([sel, i]) => { const el = document.querySelectorAll(sel)[i]; if (!el) return 'missing'; el.click(); return 'clicked:' + (el.dataset.caldate || el.textContent.trim().slice(0, 10)); }, act.nth);
    } else if (act && act.closeModal) {
      note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    } else if (act && act.agent) {
      note = await page.evaluate(t => { const i = document.getElementById('calAgentInput'), b = document.getElementById('calAgentSendBtn'); if (!i || !b) return 'missing'; i.value = t; b.click(); return 'sent'; }, act.agent);
    } else if (act && act.evalFn) {
      note = await page.evaluate(fn => { if (typeof window[fn] !== 'function') return 'no-fn'; window[fn](1); return 'called'; }, act.evalFn);
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'calendar'); note = 'roundtrip';
    } else if (act && act.rerender) {
      note = await page.evaluate(() => { if (typeof window.renderCalendarScreen !== 'function') return 'no-fn'; window.renderCalendarScreen(); return 'called'; });
    }
    await sleep(900);
    const snap = await snapshot(page);
    steps.push({ name, note, html: VOL(snap.html), modal: VOL(snap.modal), cal: snap.cal, ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, reg: snap.reg, subs: snap.subs, globals: snap.globals, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const FIELDS = ['note', 'html', 'modal', 'cal', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors', 'reg', 'subs'];
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
