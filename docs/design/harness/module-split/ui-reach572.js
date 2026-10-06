'use strict';
// TASK-ES-572 준비 탐침: 실제 UI 이벤트만 사용한다. 함수 직접 호출·상태 배열 주입·타이머/Date 교체는 하지 않는다.
const fs = require('fs'), path = require('path'), http = require('http');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const [APP, OUT, MODE = 'both'] = process.argv.slice(2);
const root = path.resolve(APP), count = process.argv.includes('--count');
const names = ['isWithinDND', 'generateDynamicNotification', 'openGoalDetailDrawer', 'closeGoalDetailDrawer', 'toggleMilestoneInDrawer'];
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (count) for (const n of names) html = html.replace(new RegExp('(function\\s+' + n + '\\s*\\([^)]*\\)\\s*\\{)'), '$1 (window.__reach572=window.__reach572||{})["' + n + '"]=(window.__reach572["' + n + '"]||0)+1;');
const out = { task: 'TASK-ES-572', measurementMethod: '실제 UI만 사용; 함수 직접 호출/상태주입 없음', preparationOnly: false, mode: MODE, count, rowsWrittenRemote: 0, blockedWrites: 0, pageerrors: [], steps: [] };
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn(); if (v) return v; await wait(250); } throw Error('wait timeout'); };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/api/')) { res.writeHead(503); return res.end('{}'); }
  if (p === '/') p = '/index.html';
  if (p === '/index.html') { res.setHeader('Content-Type', 'text/html;charset=utf-8'); return res.end(html); }
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  if(count && path.extname(f)==='.js'){let text=fs.readFileSync(f,'utf8');for(const n of names)text=text.replace(new RegExp('(function\\s+'+n+'\\s*\\([^)]*\\)\\s*\\{)'), '$1 (window.__reach572=window.__reach572||{})["'+n+'"]=(window.__reach572["'+n+'"]||0)+1;');res.setHeader('Content-Type','application/javascript');return res.end(text);}
  res.setHeader('Content-Type', { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.2', r));
  const base = 'http://127.0.0.2:' + server.address().port;
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const context = await browser.createBrowserContext();
  await context.overridePermissions(base, ['notifications']);
  const page = await context.newPage();
  try {
    await page.setViewport({ width: 430, height: 1800, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', r => { const u = new URL(r.url()); if (/supabase\.co$/i.test(u.hostname) && /^\/(rest|storage)\/v1/.test(u.pathname) && !['GET', 'HEAD', 'OPTIONS'].includes(r.method())) { out.blockedWrites++; return r.abort(); } r.continue(); });
    page.on('pageerror', e => out.pageerrors.push(e.message)); page.on('dialog', d => d.dismiss());
    const click = async sel => {
      out.lastSelector = sel;
      await page.waitForSelector(sel);
      const summaries = await page.evaluate(sel => { const el = document.querySelector(sel); const a = []; let p = el && el.parentElement; while (p) { if (p.tagName === 'DETAILS' && !p.open) { const s = p.querySelector(':scope > summary'); if (s) { if (!s.id) s.id = 'probe572summary' + a.length; a.unshift('#' + s.id); } } p = p.parentElement; } return a; }, sel);
      for (const s of summaries) await page.click(s);
      await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel);
      await wait(300); await page.click(sel); await wait(700);
    };
    const snapshot = async name => out.steps.push(await page.evaluate(name => ({ name, calls: { ...window.__reach572 }, notify: window.state?.profile?.settings?.notify, times: window.state?.profile?.settings?.checkinTimes, banner: document.querySelector('#notifyBannerSlot')?.innerHTML, drawerOpen: document.querySelector('#goalDetailDrawer')?.classList.contains('open'), drawer: document.querySelector('#goalDrawerBody')?.innerHTML, goals: window.state?.profile?.goals?.map(g => ({ title: g.title, progress: g.progress, milestones: g.milestones?.map(m => ({ title: m.title, status: m.status })) })), toast: document.querySelector('#toast')?.textContent, quiet: {enabled:window.state?.profile?.settings?.quietHoursEnabled,start:window.state?.profile?.settings?.quietHoursStart,end:window.state?.profile?.settings?.quietHoursEnd}, saved: Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('profile'))), permission: Notification.permission }), name));
    await page.goto(base, { waitUntil: 'domcontentloaded' }); await click('#btnLandingPreviewDirect');
    await until(() => page.evaluate(() => document.querySelector('#appShell')?.classList.contains('active'))); await wait(2000);
    if (MODE !== 'drawer') {
      await click('.navbtn[data-tab="settings"]');
      await click('#checkinTimesRow input[data-timeidx="0"]');
      out.timeInput = await page.evaluate(() => { const now = new Date(); if (now.getSeconds() > 35) now.setMinutes(now.getMinutes() + 1); const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'); const input = document.querySelector('#checkinTimesRow input[data-timeidx="0"]'); input.value = hhmm; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); return { value: hhmm, method: 'time input value and real change event; existing handler writes settings' }; });
      await wait(700);
      const on = await page.$eval('#notifySwitch', e => e.classList.contains('on'));
      if (!on) await click('#notifySwitch');
      await click('#quietHoursSwitch');
      for(const [sel,val] of [['#quietStartInput','00:00'],['#quietEndInput','00:01']]){await page.$eval(sel,(e,v)=>{e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},val);await wait(500);}
      await snapshot('notify enabled by UI');
      const start = Date.now(); await until(() => page.evaluate(() => !!document.querySelector('#notifyBannerSlot .notify-banner')), 45000);
      out.notificationWaitMs = Date.now() - start; await snapshot('timer delivered notification');
    }
    if (MODE !== 'notify') {
      await click('.navbtn[data-tab="goals"]');
      await click('#sanctuaryGoalsView .template-quick-card:first-child .btn-quick-adopt-goal');
      await until(() => page.evaluate(() => !!document.querySelector('#sGoalDetailBtn')));
      await click('#sGoalDetailBtn'); await snapshot('drawer opened');
      await click('#goalDrawerBody > div:nth-child(2) > div:nth-child(2) > span[onclick]'); await snapshot('drawer milestone toggled');
      await click('#btnGoalDrawerClose'); await snapshot('drawer closed');
    }
    out.completed = true;
  } catch (e) { out.failure = e.message; process.exitCode = 1; }
  finally { await browser.close(); server.close(); fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8'); console.log(JSON.stringify({ completed: out.completed, failure: out.failure, lastSelector: out.lastSelector, notificationWaitMs: out.notificationWaitMs, steps: out.steps.map(s => ({ name: s.name, calls: s.calls, drawerOpen: s.drawerOpen, notify: s.notify, bannerPresent: !!s.banner })), pageerrors: out.pageerrors })); }
})();
