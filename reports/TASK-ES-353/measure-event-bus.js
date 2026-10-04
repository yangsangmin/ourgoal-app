'use strict';
/* TASK-ES-353 (CORE-04) 변경 이벤트 계측 — 작업자 측정 도구(판정 아님).
 * 사용: node measure-event-bus.js <APP_DIR> <out.json>
 * 로컬 정적 서버 + 헤드리스 Chrome + 게스트 시드 + Supabase 목(docs/design/harness/shots-lib.js newPage).
 * 계측: 서버가 index.html 을 내줄 때만 렌더 함수 첫 줄에 호출 카운터를 끼운다(저장소 파일은 그대로).
 * 순서: 기록·캘린더·설정·목표 탭을 각 10회 오감 → 홈 → 카운터 0 → 체크인 1회 → 렌더 호출 수.
 *       그 뒤 목표 탭에서 할 일 1개 체크 → 4개 탭 DOM 값(텍스트) 변화.
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const APP_DIR = path.resolve(process.argv[2] || '.');
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const shots = require(path.join(APP_DIR, 'docs/design/harness/shots-lib.js'));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FNS = ['renderRecordsScreen', 'renderCalendarScreen', 'renderSettingsScreen', 'renderProfileCard', 'renderGoalsScreen', 'renderHome', 'updatePrivacyBadges', 'triggerHaptic'];
const TRACE = process.env.TRACE || '';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function instrument(src) {
  let n = 0;
  for (const f of FNS) {
    src = src.replace(new RegExp('function ' + f + '\\s*\\(([^)]*)\\)\\s*\\{', 'g'), (m) => { n++; return m + "(window.__rc=window.__rc||{})['" + f + "']=((window.__rc['" + f + "'])||0)+1;" + (TRACE === f ? "(window.__tr=window.__tr||[]).push(String(new Error().stack).split(String.fromCharCode(10)).slice(2,6).map(function(x){return x.trim().split('localhost:').pop();}).join(' < '));" : ''); });
  }
  return { src, n };
}

function startServer(port) {
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    const f = path.join(APP_DIR, p);
    if (!f.startsWith(APP_DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (p === '/index.html') return res.end(instrument(fs.readFileSync(f, 'utf8')).src);
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

/* 정적: 소블록이 구독하는 이벤트 vs 제품 코드에서 발행하는 이벤트, 미정의 renderCalendar 호출 */
function staticEvents() {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const tabFiles = walk(path.join(APP_DIR, 'js/tabs')).filter(f => f.endsWith('.js'));
  const prodFiles = [path.join(APP_DIR, 'index.html'), ...walk(path.join(APP_DIR, 'js')).filter(f => f.endsWith('.js'))];
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
  const busFile = path.join(APP_DIR, 'js/core/event-bus.js');
  const busSrc = fs.readFileSync(busFile, 'utf8');
  const constVal = {};
  for (const m of busSrc.matchAll(/([A-Z_]+):\s*'([\w:-]+)'/g)) constVal[m[1]] = m[2];
  const subs = new Set(), emits = new Set();
  for (const f of tabFiles) {
    const s = strip(fs.readFileSync(f, 'utf8'));
    for (const m of s.matchAll(/\.on\(\s*['"]([\w:-]+)['"]/g)) subs.add(m[1]);
    for (const m of s.matchAll(/\.on\(\s*[\w.]*EVENTS\.([A-Z_]+)/g)) subs.add(constVal[m[1]] || ('EVENTS.' + m[1]));
  }
  for (const f of prodFiles) {
    const s = strip(fs.readFileSync(f, 'utf8'));
    for (const m of s.matchAll(/\.emit\(\s*['"]([\w:-]+)['"]/g)) emits.add(m[1]);
    for (const m of s.matchAll(/\.emit\(\s*[\w.]*EVENTS\.([A-Z_]+)/g)) emits.add(constVal[m[1]] || ('EVENTS.' + m[1]));
  }
  let rc = 0; const rcSites = [];
  for (const f of prodFiles) {
    strip(fs.readFileSync(f, 'utf8')).split('\n').forEach((l, i) => { if (/\brenderCalendar\s*\(/.test(l)) { rc++; rcSites.push(path.relative(APP_DIR, f).replace(/\\/g, '/') + ':' + (i + 1)); } });
  }
  return { subscribed: [...subs].sort(), emitted: [...emits].sort(), ghost: [...subs].filter(e => !emits.has(e)).sort(), renderCalendarCalls: rc, renderCalendarSites: rcSites };
}

async function closeBoot(page) {
  await page.evaluate(() => { const o = document.getElementById('modalOverlay'); if (o) o.classList.remove('active'); });
  const greet = await page.evaluate(() => { const g = document.getElementById('avatarGreetingModal'); return !!(g && getComputedStyle(g).display !== 'none'); });
  if (greet) { await page.click('#btnAvatarGreetClose').catch(() => {}); await sleep(600); }
}
async function tab(page, t) { await page.click('.navbtn[data-tab="' + t + '"]'); await sleep(400); }
const snap = (page) => page.evaluate(() => {
  const g = (id) => { const el = document.getElementById(id); return el ? { text: el.textContent.replace(/\s+/g, ' '), html: el.innerHTML } : { text: '', html: '' }; };
  return { home: g('screen-home'), goals: g('screen-goals'), records: g('screen-records'), calendar: g('screen-calendar') };
});
const listenerStats = (page) => page.evaluate(() => {
  const ev = window.OurgoalEvents; const out = { total: 0, byEvent: {} };
  if (!ev || !ev._listeners) return out;
  ev._listeners.forEach((list, name) => { out.byEvent[name] = list.length; out.total += list.length; });
  return out;
});

async function main() {
  const port = 5200 + Math.floor(Math.random() * 300);
  const server = await startServer(port);
  const injected = instrument(fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8')).n;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const result = { tool: 'reports/TASK-ES-353/measure-event-bus.js', appDir: path.basename(APP_DIR), measuredAt: new Date().toISOString(), env: 'local static server + headless Chrome + guest seed + Supabase mock', instrumentedDefinitions: injected, static: staticEvents() };
  try {
    const page = await shots.newPage(browser, true, 'white');
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    await page.goto('http://localhost:' + port + '/', { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500); await closeBoot(page);
    await page.evaluate(() => {
      window.__emitted = {};
      const ev = window.OurgoalEvents; if (!ev) return;
      const orig = ev.emit.bind(ev);
      ev.emit = function (name, p) { window.__emitted[name] = (window.__emitted[name] || 0) + 1; return orig(name, p); };
    });
    result.listenersBeforeVisits = await listenerStats(page);
    result.subBlockRenderersOnWindow = await page.evaluate(() => Object.fromEntries(['renderRecordsScreen', 'renderTimerWidget', 'syncRealtimeAiFeedbackSlot', 'renderCalendarScreen', 'renderCalendarDayDetail', 'renderCalendarPhotoThumbnails', 'renderGoalsScreen', 'renderRoutineGoalsScreen', 'renderTeamGoalsScreen', 'renderProfileCard', 'updateTwoFactorStatusUI', 'updatePrivacyBadges', 'renderSettingsScreen'].map(n => [n, typeof window[n] === 'function'])));
    await page.evaluate(() => { window.__rc = {}; });
    for (let i = 0; i < 10; i++) for (const t of ['records', 'calendar', 'settings', 'goals']) await tab(page, t);
    await tab(page, 'home'); await sleep(500); await closeBoot(page);
    result.listenersAfter10Visits = await listenerStats(page);
    result.visitRenderCalls = await page.evaluate(() => Object.assign({}, window.__rc));

    // ① 체크인 1회
    const before = await snap(page);
    await page.evaluate(() => { window.__rc = {}; window.__tr = []; window.__hasState = !!(window.state && window.state.profile); });
    const text = 'CORE04 계측 체크인 ' + Date.now().toString(36);
    await page.evaluate((t) => { const i = document.getElementById('captureInput'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); }, text);
    result.checkinClickMode = await page.evaluate(() => { const b = document.getElementById('captureSave'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? 'mouse' : 'dom'; });
    if (result.checkinClickMode === 'mouse') { try { await page.click('#captureSave'); } catch (e) { result.checkinClickMode = 'dom'; } }
    if (result.checkinClickMode === 'dom') await page.evaluate(() => document.getElementById('captureSave').click());
    await sleep(2500);
    result.checkin = { text, renderCalls: await page.evaluate(() => Object.assign({}, window.__rc)), trace: await page.evaluate(() => window.__tr || null) };
    const after = await snap(page);
    result.checkin.reflected = Object.fromEntries(Object.keys(after).map(k => [k, { domChanged: before[k].html !== after[k].html, textChanged: before[k].text !== after[k].text, containsText: after[k].text.includes(text) }]));

    // ④ 할 일 체크 1회 (목표 탭) — 새로고침 없이 4개 탭 DOM 변화
    await closeBoot(page);
    await tab(page, 'goals'); await sleep(500);
    let handles = await page.$$('[data-taskcheck]');
    let visible = null;
    for (const h of handles) { if (await h.boundingBox()) { visible = h; break; } }
    if (!visible) {
      const card = await page.$('#screen-goals [data-goal-id], #screen-goals [data-gid], #screen-goals .goal-card');
      if (card) { await card.click().catch(() => {}); await sleep(800); }
      handles = await page.$$('[data-taskcheck]');
      for (const h of handles) { if (await h.boundingBox()) { visible = h; break; } }
    }
    if (visible) {
      const b2 = await snap(page);
      await page.evaluate(() => { window.__rc = {}; window.__tr = []; });
      await visible.click();
      await sleep(2000);
      const a2 = await snap(page);
      result.todo = { clicked: true, trace: await page.evaluate(() => window.__tr || null), renderCalls: await page.evaluate(() => Object.assign({}, window.__rc)), changed: Object.fromEntries(Object.keys(a2).map(k => [k, { domChanged: b2[k].html !== a2[k].html, textChanged: b2[k].text !== a2[k].text }])) };
    } else result.todo = { clicked: false, note: '보이는 [data-taskcheck] 를 찾지 못함', count: handles.length };

    result.runtime = { emitted: await page.evaluate(() => window.__emitted), listenersEnd: await listenerStats(page) };
    result.runtime.subscribedNeverEmittedThisSession = Object.keys(result.runtime.listenersEnd.byEvent).filter(e => !result.runtime.emitted[e]);
    result.runtime.subscriptions = await page.evaluate(() => (window.OurgoalEvents && typeof window.OurgoalEvents.subscriptions === 'function') ? window.OurgoalEvents.subscriptions() : null);
    result.consoleErrors = errors.length; result.consoleErrorSamples = errors.slice(0, 5);
    await page.close();
  } finally { await browser.close(); server.close(); }
  const s = JSON.stringify(result, null, 2);
  if (OUT) fs.writeFileSync(OUT, s + '\n', 'utf8');
  console.log(s);
}
main().catch(e => { console.error(e); process.exit(1); });
