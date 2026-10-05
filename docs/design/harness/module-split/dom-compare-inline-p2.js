'use strict';
// 인라인 스크립트 세포화 구역 P2(#TASK-ES-438 ~) DOM·저장값·토스트 전후 비교. 2차 dom-compare-inline-split-2.js(#TASK-ES-432)·1차(#TASK-ES-423)의 틀을 따랐다:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 활성 화면 HTML·홈 시트·모달·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 빈 게스트(시드 없음)로 「로그인 없이 둘러보기」를 눌러 들어가고, 두 앱에 같은 조작으로 기록을 넣은 뒤 이번에 옮긴 선언이 불리는 곳을 차례로 누른다.
// 단계 묶음은 PR 마다 다르다(넷째 인자 1 = #TASK-ES-438 기록 탭 묶음, 2 = 다음 PR). 로컬 정적 서버 + 헤드리스 Chrome + shots-lib Supabase 목(원격·실계정 없음).
// 시간·난수 값만 지운다(스톱워치 시계 글자 포함). 같은 기준 앱 2회로 본질 변동을 먼저 잰다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-inline-p2.js <baseApp> <afterApp> <out.json> <단계 묶음 1|2>
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
  const port = 5500 + Math.floor(Math.random() * 400);
  return new Promise(r => s.listen(port, () => r({ s, base: 'http://127.0.0.1:' + port })));
}
const click = sel => ({ evalFn: '(function(){ var els = Array.prototype.slice.call(document.querySelectorAll(' + JSON.stringify(sel) + ')); var el = els.filter(function(e){ return e.offsetParent !== null || getComputedStyle(e).position === "fixed"; })[0] || els[0]; if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,16); })()' });
// 두 앱에 같은 조작으로 기록을 넣는다(앱 코드는 그대로 — app-scope 통로의 state·saveProfile 을 쓴다). daysAgo 마다 그날 정오 기록 1건.
const seedRecords = (tag, list) => ({ evalFn: '(async function(){ var L = window.OurgoalAppScope && window.OurgoalAppScope.scope; if(!L || !L.state || !L.state.profile) return "no-scope"; var list = ' + JSON.stringify(list) + '; list.forEach(function(x, i){ var t = new Date(); t.setHours(x.h || 12, 0, 0, 0); t.setDate(t.getDate() - x.d); var iso = t.toISOString(); var e = new Date(t.getTime() + (x.min || 0) * 60000).toISOString(); L.state.profile.records.push({ id: "p2-' + tag + '-" + i, type: x.type || "note", text: x.text || ("비교용 기록 " + x.d + "일 전"), startAt: iso, endAt: x.min ? e : iso, durationMinutes: x.min || 0, createdAt: iso, category: x.category || null, visibility: "private", theme: x.theme || "daily", subTheme: "", themeConfidence: 0.5 }); }); await L.saveProfile(); return "seeded:" + L.state.profile.records.length; })()' });
const closeModal = () => ({ evalFn: '(function(){ var L = window.OurgoalAppScope && window.OurgoalAppScope.scope; if(L && typeof L.closeModal === "function"){ L.closeModal(); return "closed"; } var mo = document.getElementById("modalOverlay"); if(mo){ mo.click(); return "overlay"; } return "none"; })()' });
const STEP_SETS = require('./dom-compare-inline-p2-steps.js')({ click, seedRecords, closeModal });
const STEPS = STEP_SETS[process.argv[5] || '1'];
if (!STEPS) throw new Error('단계 묶음 없음');
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.querySelector('.screen.active');
    const mo = document.getElementById('modalOverlay');
    const sheet = document.getElementById('homeDetailSheet');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const slot = document.getElementById('socialNotifySlot');
    const guide = document.getElementById('miniGuideOverlay');
    const L = window.OurgoalAppScope && window.OurgoalAppScope.scope;
    return { html: scr ? scr.outerHTML : null, homeSheet: sheet ? (sheet.className + '|' + sheet.innerHTML) : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls,
      toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null, cheerSlot: slot ? slot.innerHTML : null, guide: guide ? guide.innerHTML : null,
      activeScreen: scr ? scr.id : null, commSubTab: L && L.state ? L.state.commSubTab : null,
      // 옮긴 함수 이름이 window 에 새로 달리지 않았는가(이전 전과 같아야 한다 — 원래부터 window 에 없다)
      globals: (function(){ var o = {}; (window.__P2_GLOBALS || []).forEach(function(n){ o[n] = typeof window[n]; }); return o; })(),
      kits: ['OurgoalCommKit','OurgoalRecordsKit','OurgoalGoalsKit','OurgoalSettingsKit','OurgoalCalendarKit'].map(function(k){ return k + ':' + (window[k] ? Object.keys(window[k]).length : null); }).join(' ') };
  });
}
// 지금 시각(실행 시작 −70분 ~ +20분의 HH:MM — 「1시간 전부터 지금까지」 기록 포함)은 실행마다 다르다 — 대화형 기록처럼 "지금" 으로 저장되는 값. 실행마다 다시 만든다.
let NOW_RE = null;
function setNowRe() { const t0 = Date.now(); const pad = n => String(n).padStart(2, "0"); const set = []; for (let m = -70; m <= 20; m++) { const d = new Date(t0 + m * 60000); set.push(pad(d.getHours()) + ":" + pad(d.getMinutes())); } NOW_RE = new RegExp("\\b(" + set.join("|") + ")\\b", "g"); }
const VOL = x => x == null ? x : String(x).replace(/data:image\/png;base64,[A-Za-z0-9+\/=]+/g, () => 'data:image/png;<canvas>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(ms|t|task|g|goal|fc|qr|c|guest)_[a-z0-9]{8,}/g, '$1_<uid>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d(?![:\d])/g, '<dtl>').replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:<port>')
  .replace(/(mnPreviewName\\*"?>)[^<]+/g, '$1<anon>').replace(/(anonName\\*"\s*:\s*\\*")[^"\\]+/g, '$1<anon>').replace(/(러너|탐험가|도전자|여행자|꿈나무) #\d+/g, '$1 #<n>').replace(/guest-[a-z0-9]{6,}/g, 'guest-<id>').replace(/\d\d:\d\d\.\d/g, '<sw>').replace(NOW_RE || /(?!)/g, '<now>')
  // 브라우저 저장소 추정치(navigator.storage.estimate — 내려받은 스크립트 캐시 크기에 따라 달라진다, #TASK-ES-448 추가)
  .replace(/약 [\d.]+ ?(B|KB|MB|GB) 사용 중/g, '약 <n> 사용 중');
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; } return x; }
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls).sort((a, b) => VOL(a[0]) < VOL(b[0]) ? -1 : 1)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(sortKeys(j), (key, x) => key === 'bonusCraftCredits' ? undefined : (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string') ? '<hash>' : x); } catch (e) {}
    o[VOL(k)] = VOL(val);
  }
  return o;
}
async function newPage(ctx) {
  const page = await ctx.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (/supabase-js/.test(u)) return req.respond({ status: 200, contentType: 'text/javascript', body: shots.MOCK_SUPABASE });
    if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/gh\/orioncactus/.test(u)) return req.continue();
    if (/supabase\.co|accounts\.google\.com|googleapis\.com|gstatic\.com|kakao|pagead|googlesyndication|doubleclick|posthog/.test(u)) return req.respond({ status: 204, body: '' });
    req.continue();
  });
  // 첫 문서에서만 저장소를 비운다(다시 열 때는 앱이 저장한 게스트 프로필을 그대로 둔다)
  await page.evaluateOnNewDocument((G) => {
    // 난수 고정: 두 앱이 같은 순서로 같은 값을 받게 문서마다 같은 씨앗으로 시작한다(게스트 id·마니또 씨앗·익명 이름이 실행마다 달라 맞대지 못하던 것을 없앤다)
    (function () { let x = 0x2f6b1d; Math.random = function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return (x >>> 0) / 4294967296; }; })();
    try { if (!sessionStorage.getItem('__p2_init')) { localStorage.clear(); localStorage.setItem('ourgoal_current_theme', 'focus-sanctuary'); sessionStorage.setItem('__p2_init', '1'); } } catch (e) {}
    window.__P2_GLOBALS = G; window.confirm = () => true; window.alert = () => {}; window.prompt = () => null;
    if (navigator.vibrate) navigator.vibrate = () => true;
  });
  return page;
}
async function run(app, label) {
  setNowRe();
  const { s, base } = await serve(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const ctx = await browser.createBrowserContext();
  const page = await newPage(ctx);
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message()); d.dismiss().catch(() => {}); });
  await page.goto(base + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#btnLandingPreviewDirect', { timeout: 30000 });
  await sleep(1500);
  const bootNotes = [];
  const steps = [];
  for (const [name, act, extra] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (act.evalFn) note = String(await page.evaluate(act.evalFn));
    else if (act.enter) { note = await page.evaluate(() => { const b = document.getElementById('btnLandingPreviewDirect'); if (!b) return 'missing'; b.click(); return 'clicked'; }); await sleep(2500); bootNotes.push(name + ':' + JSON.stringify(await boot(page))); }
    else if (act.reload) { await page.reload({ waitUntil: 'load', timeout: 60000 }); await sleep(4000); note = 'reloaded:' + (await page.evaluate(() => (document.querySelector('.screen.active') || {}).id || null)); bootNotes.push(name + ':' + JSON.stringify(await boot(page))); }
    else if (act.goTab) { const r = await goTab(page, act.goTab); note = 'tab:' + act.goTab + ':' + (r.ok ? 'ok' : r.note); }
    else if (act.tabRoundTrip) { await goTab(page, 'home'); await goTab(page, 'records'); await goTab(page, 'comm'); note = 'roundtrip'; }
    await sleep(900 + (extra || 0));
    const snap = await snapshot(page);
    steps.push({ name, note: VOL(note), dialogs: dialogs.slice(dlgBefore), html: VOL(snap.html), homeSheet: VOL(snap.homeSheet), modal: VOL(snap.modal), ls: normLs(snap.ls), toast: VOL(snap.toast), cheerSlot: VOL(snap.cheerSlot), guide: VOL(snap.guide), activeScreen: snap.activeScreen, commSubTab: snap.commSubTab, globals: snap.globals, kits: snap.kits, newErrors: errors.slice(errBefore).map(VOL) });
  }
  await browser.close(); s.close();
  return { label, bootNotes, steps, errors: errors.map(VOL) };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), ra2 = await run(A, 'base-2'), rb = await run(B, 'after');
  // kits 칸은 이번 이전이 소통·기록 키트에 이름을 더하므로 다르다(의도한 차이) — 맞대지 않고 따로 적는다
  const FIELDS = ['note', 'dialogs', 'html', 'homeSheet', 'modal', 'ls', 'toast', 'cheerSlot', 'guide', 'activeScreen', 'commSubTab', 'globals', 'newErrors'];
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
  const summary = { env: 'local static server + headless Chrome + empty guest (landing 「로그인 없이 둘러보기」) + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ' => ' + s.note + ' / ' + rb.steps[i].note),
    comparedFields: ra.steps.length * FIELDS.length,
    digestAfter: rb.steps.map(s => ({ step: s.name, note: s.note, toast: s.toast, cheerSlot: s.cheerSlot, dialogs: s.dialogs, activeScreen: s.activeScreen, commSubTab: s.commSubTab, modalHead: (s.modal || '').slice(0, 160), newErrors: s.newErrors })),
    differing: diffs.length, diffs, baseVsBaseDiffering: baseVsBase.length, baseVsBase,
    errorsBase: ra.errors, errorsBase2: ra2.errors, errorsAfter: rb.errors, bootBase: ra.bootNotes, bootAfter: rb.bootNotes,
    kitsBase: ra.steps[0].kits, kitsAfter: rb.steps[0].kits };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'base-vs-base differing', baseVsBase.length, 'errors base/base2/after', ra.errors.length, ra2.errors.length, rb.errors.length);
  console.log(summary.notes.join('\n'));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
  for (const d of baseVsBase.slice(0, 6)) console.log('BB', JSON.stringify(d).slice(0, 400));
})().catch(e => { console.error(e); process.exitCode = 1; });
