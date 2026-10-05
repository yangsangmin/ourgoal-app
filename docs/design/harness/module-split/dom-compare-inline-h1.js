'use strict';
// #TASK-ES-466 구역 H1: dom-compare-inline-p1.js 복제 — 저장값 비교에서 maxBaseCrafts 도 맞대지 않는다(부팅 직후 저장 시점에 따라 같은 기준 앱 두 번 실행에서도 있다 없다 함 — reports/TASK-ES-466/dom-compare-p1-raw.json 기준 대 기준 15칸). 그 밖은 원본과 같다.
// 인라인 스크립트 세포화 P1(#TASK-ES-436~) DOM·저장값·토스트 전후 비교 — 1차 dom-compare-inline-split-1.js(#TASK-ES-423)를 복제하고 단계 목록·전역 목록만 설정 파일(dom-steps-inline-p1-<작업>.js)에서 읽게 했다.
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 활성 화면 HTML·모달·localStorage·토스트·내려받기·콘솔 오류·옮긴 이름의 window 종류를 기록해 맞댄다. 같은 기준 앱 2회로 본질 변동을 먼저 잰다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-inline-p1.js <baseApp> <afterApp> <out.json> <단계 설정 .js>
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
  // 빈 포트를 운영체제가 고른다(같은 PC 에서 다른 측정이 돌아도 포트가 부딪치지 않게)
  return new Promise(r => s.listen(0, '127.0.0.1', () => r({ s, base: 'http://127.0.0.1:' + s.address().port })));
}
const click = sel => ({ evalFn: '(function(){ var el = document.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,12); })()' });
const clickIn = sel => ({ evalFn: '(function(){ var root = document.querySelector("#modalOverlay"); var el = root && root.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,12) + "|" + JSON.stringify(el.dataset); })()' });
const STEP_FILE = process.argv[5];
const STEPDEF = require(path.resolve(STEP_FILE));
const STEPS = STEPDEF.steps({ click, clickIn });
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.querySelector('.screen.active');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    return { html: scr ? scr.outerHTML : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: scr ? scr.id : null, downloads: (window.__es423dl || []).splice(0),
      // 옮긴 함수 이름이 window 에 새로 달리지 않았는가(이전 전과 같아야 한다 — generateLockScreenCalendarImage 만 원래부터 window 에 있다)
      globals: Object.fromEntries((window.__p1globals || []).map(n => [n, typeof window[n]])),
      kits: Object.fromEntries(['OurgoalCalendarKit', 'OurgoalCommKit', 'OurgoalGoalsKit', 'OurgoalRecordsKit', 'OurgoalSettingsKit'].map(k => [k, window[k] ? Object.keys(window[k]).sort().join(',') : null])) };
  });
}
const VOL = x => x == null ? x : String(x).replace(/data:image\/png;base64,[A-Za-z0-9+\/=]+/g, () => 'data:image/png;<canvas>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(ms|t|task|g|goal|fc|qr|c)_[a-z0-9]{8,}/g, '$1_<uid>')
  .replace(/(cacheSizeText\\*"[^>]*>)약 [\d.]+ ?[KMG]?B/g, '$1약 <size>') // 브라우저 저장소 추정치(navigator.storage.estimate — 실행마다 다름)
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d(?![:\d])/g, '<dtl>').replace(/(lsSim(?:StatusTime|ClockTime)\\*"[^>]*>)\d{1,2}:\d\d/g, '$1<hh:mm>').replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:<port>').replace(/(rec-time\\*"?>)\d{1,2}:\d\d/g, '$1<hh:mm>').replace(/>\d{1,2}:\d\d<\/span>/g, '><hh:mm></span>').replace(/(mnPreviewName\\*"?>)[^<]+/g, '$1<anon>');
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; } return x; }
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    // lastStreakAwarded: 부팅 직후 저장 시점에 따라 같은 앱에서도 있다 없다 한다(기준 대 기준에서 확인) — 맞대지 않는다
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(sortKeys(j), (key, x) => (key === 'bonusCraftCredits' || key === 'lastStreakAwarded' || key === 'maxBaseCrafts') ? undefined : (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string') ? '<hash>' : x); } catch (e) {}
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
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message()); d.dismiss().catch(() => {}); });
  // 내려받기: <a download> 클릭을 가로채 이름과 이미지 해시만 적는다(파일은 만들지 않는다)
  await page.evaluateOnNewDocument(() => {
    window.__es423dl = [];
    const OA = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { const u = String(this.href || ''); let h = 2166136261; for (let i = 0; i < u.length; i++) { h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } window.__es423dl.push('download|' + this.download + '|len' + u.length + '|h' + h.toString(16)); return; }
      return OA.apply(this, arguments);
    };
  });
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  const bootNote = await boot(page);
  const steps = [];
  for (const [name, act, extra] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (act.evalFn) note = String(await page.evaluate(act.evalFn));
    else if (act.goTab) { const r = await goTab(page, act.goTab); note = 'tab:' + act.goTab + ':' + (r.ok ? 'ok' : r.note); }
    else if (act.closeModal) note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    else if (act.tabRoundTrip) { await goTab(page, 'home'); await goTab(page, 'records'); note = 'roundtrip'; }
    await sleep(900 + (extra || 0));
    const snap = await snapshot(page);
    steps.push({ name, note: VOL(note), dialogs: dialogs.slice(dlgBefore), downloads: snap.downloads, html: VOL(snap.html), modal: VOL(snap.modal), ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, globals: snap.globals, kits: snap.kits, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, bootNote, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2, 5);
  const ra = await run(A, 'base'), ra2 = await run(A, 'base-2'), rb = await run(B, 'after');
  // kits 칸은 이번 이전이 일정·소통 키트에 이름을 더하므로 다르다(의도한 차이) — 맞대지 않고 따로 적는다
  const FIELDS = ['note', 'dialogs', 'downloads', 'html', 'modal', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors'];
  const cmp = (P, Q) => {
    const out = [];
    P.steps.forEach((sa, i) => {
      const sb = Q.steps[i];
      for (const k of FIELDS) {
        const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
        if (x === y) continue;
        let at = 0; while (at < x.length && x[at] === y[at]) at++;
        out.push({ step: sa.name, field: k, base: x.slice(Math.max(0, at - 120), at + 200), after: y.slice(Math.max(0, at - 120), at + 200) });
      }
    });
    return out;
  };
  const diffs = cmp(ra, rb);
  const baseVsBase = cmp(ra, ra2);
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ' => ' + s.note + ' / ' + rb.steps[i].note),
    comparedFields: ra.steps.length * FIELDS.length,
    digestAfter: rb.steps.map(s => ({ step: s.name, note: s.note, toast: s.toast, downloads: s.downloads, dialogs: s.dialogs, activeScreen: s.activeScreen, modalHead: (s.modal || '').slice(0, 160), newErrors: s.newErrors })),
    differing: diffs.length, diffs, baseVsBaseDiffering: baseVsBase.length, baseVsBase,
    errorsBase: ra.errors, errorsBase2: ra2.errors, errorsAfter: rb.errors, bootBase: ra.bootNote, bootAfter: rb.bootNote,
    kitsBase: ra.steps[0].kits, kitsAfter: rb.steps[0].kits };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'base-vs-base differing', baseVsBase.length, 'errors base/base2/after', ra.errors.length, ra2.errors.length, rb.errors.length);
  console.log(summary.notes.join('\n'));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
  for (const d of baseVsBase.slice(0, 6)) console.log('BB', JSON.stringify(d).slice(0, 400));
})().catch(e => { console.error(e); process.exitCode = 1; });
