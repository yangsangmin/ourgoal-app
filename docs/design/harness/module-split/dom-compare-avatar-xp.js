'use strict';
// #TASK-ES-395 EXP 세포 이전(아바타·EXP 쪼개기 PR-5) 화면 DOM·저장값 전후 비교 — dom-compare-avatar-logic.js(#TASK-ES-389)를 EXP 경로로 바꿨다.
// 이전 전(base)과 후(after) 앱을 같은 순서로 조작하고 단계마다 홈 레벨 배지(#levelBadgeRow)·홈 링(#homeHeroExpBar·#homeHeroExpGain)·
// 축하 팝업(#avatarCelebrationToast)·settings.xp(total·log, 시각 지움)·홈 화면·localStorage·토스트·window EXP 함수 5개·콘솔 오류를 맞댄다.
// 누르는 곳(게스트): 홈 → #captureInput 입력 → #captureSave(체크인) → 다시 입력('스톱워치 25분 집중 시간기록') → #captureSave
//   → 목표 탭 → 마일스톤 m2 상태 [data-cyclestatus] 누름(doing→done) → 홈
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음, /api 는 {"ok":true}). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-avatar-xp.js <baseApp> <afterApp> <out.json>
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
const STEPS = [
  ['home-enter', null],
  ['checkin-1-type', { type: '#captureInput', text: '오늘 아침 5km 러닝 완료' }],
  ['checkin-1-save', { click: '#captureSave', wait: 2500 }],
  ['home-after-1', { tab: 'home' }],
  ['checkin-2-type', { type: '#captureInput', text: '스톱워치 25분 집중 시간기록' }],
  ['checkin-2-save', { click: '#captureSave', wait: 2500 }],
  ['home-after-2', { tab: 'home' }],
  ['goals-enter', { tab: 'goals' }],
  ['goal-open-g1', { click: '[data-chip="g1"]' }],
  ['ms-m2-done', { click: '.ms-row[data-msid="m2"] [data-cyclestatus]', wait: 2000 }],
  ['home-final', { tab: 'home' }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const H = id => { const e = document.getElementById(id); return e ? e.innerHTML : null; };
    const O = id => { const e = document.getElementById(id); return e ? e.outerHTML : null; };
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const act = document.querySelector('.screen.active');
    const sc = window.OurgoalAppScope && window.OurgoalAppScope.scope;
    const st = sc && sc.state;
    const xp = st && st.profile && st.profile.settings ? st.profile.settings.xp : undefined;
    return { levelBadgeRow: H('levelBadgeRow'), ringBar: O('homeHeroExpBar'), ringGain: O('homeHeroExpGain'), popup: O('avatarCelebrationToast'),
      xp: xp === undefined ? 'undefined' : JSON.stringify(xp), home: H('screen-home'), ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: act ? act.id : null, winFns: ['xpForLevel', 'levelForXP', 'levelProgress', 'triggerAvatarCelebrationPopup', 'notifyXpGained'].map(n => n + ':' + typeof window[n]).join(',') };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(g|ms|t|task|goal|ava)_[a-z0-9]{6,}/g, '$1_<uid>')
  .replace(/\b(dyn_[a-z0-9_]+?)_\d{1,4}_clip\b/g, '$1_<rnd>_clip'); // getDynamicAvatarSvg 의 Math.random() 클립 id(난수 — 기준끼리도 다르다)
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue;
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(j, (key, x) => (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string' ? '<hash>' : x)); } catch (e) {}
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
  const navs = [await goTab(page, 'home')];
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && act.type) {
      note = await page.evaluate((sel, text) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.focus(); el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); return 'typed:' + text.length; }, act.type, act.text);
    } else if (act && act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked:' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24); }, act.click);
    } else if (act && act.tab) {
      // goTab('home') 은 누르지 않고 지금 화면만 확인한다 — 홈으로 돌아갈 때는 하단 홈 버튼을 진짜로 누른다
      if (act.tab === 'home') { await page.click('.navbtn[data-tab="home"]').catch(() => {}); await sleep(900); }
      const n = await goTab(page, act.tab); navs.push(n); note = 'tab:' + act.tab + ':' + (n && n.ok !== false ? 'ok' : 'fail');
    }
    await sleep((act && act.wait) || 900);
    const snap = await snapshot(page);
    steps.push({ name, note, levelBadgeRow: VOL(snap.levelBadgeRow), ringBar: VOL(snap.ringBar), ringGain: VOL(snap.ringGain), popup: VOL(snap.popup), xp: VOL(snap.xp), home: VOL(snap.home),
      ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, winFns: snap.winFns, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, navs, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const FIELDS = ['note', 'levelBadgeRow', 'ringBar', 'ringGain', 'popup', 'xp', 'home', 'ls', 'toast', 'activeScreen', 'winFns', 'newErrors'];
  const diffs = [];
  ra.steps.forEach((sa, i) => {
    const sb = rb.steps[i];
    for (const k of FIELDS) {
      const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
      if (x === y) continue;
      let at = 0; while (at < x.length && x[at] === y[at]) at++;
      diffs.push({ step: sa.name, field: k, base: String(x).slice(Math.max(0, at - 120), at + 200), after: String(y).slice(Math.max(0, at - 120), at + 200) });
    }
  });
  const xpTotal = r => r.steps.map(s => { try { const j = JSON.parse(s.xp); return s.name + ':' + (j && j.total) + '/' + (j && j.log ? j.log.length : 0); } catch (e) { return s.name + ':' + s.xp; } });
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    xpTotals: { base: xpTotal(ra), after: xpTotal(rb) },
    toasts: ra.steps.map((s, i) => s.name + ':' + s.toast + '/' + rb.steps[i].toast).filter(t => !/:null\/null$/.test(t)),
    winFns: { base: ra.steps[0].winFns, after: rb.steps[0].winFns },
    present: Object.fromEntries(['levelBadgeRow', 'ringBar', 'ringGain', 'popup'].map(k => [k, ra.steps.filter(s => s[k] != null && s[k] !== '').length + '/' + ra.steps.length])),
    levelBadgeSample: String(ra.steps[ra.steps.length - 1].levelBadgeRow || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
    ringSample: String(ra.steps[ra.steps.length - 1].ringBar || '').slice(0, 300),
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, errorsBase: ra.errors, errorsAfter: rb.errors, navsBase: ra.navs, navsAfter: rb.navs };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  console.log('xp base', summary.xpTotals.base.join(' '), '\nxp after', summary.xpTotals.after.join(' '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
