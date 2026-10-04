'use strict';
// 아바타 모달 「320종 MBTI 페르소나 도감」 화면 DOM·저장값·토스트 전후 비교 (#TASK-ES-386 페르소나 데이터 파일 분리).
// dom-compare-templates.js(#TASK-ES-364)를 복제했다.
// 분리 전(base)과 분리 후(after) 앱을 같은 순서로 조작하고 단계마다 도감 카드 영역·모달 시트·#modalOverlay·localStorage·토스트·콘솔 오류를 맞댄다.
// 누르는 곳: 설정 탭 #btnSettingsQuickAvatar → 아바타 모달 → 만화형(#avatarTypeToggle [data-avatartype=custom], 도감이 이 칸 안에 있다) → #btnToggle320PersonaCatalog(펼치기)
//            → #persona320GroupTabs [data-group] 5개 → #inputSearchPersona320 검색 4가지 → .persona-theme-card 선택 2번 → 접기·다시 펼치기 → #btnCancelAvatarModal
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-avatar-personas.js <baseApp> <afterApp> <out.json>
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
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
const GROUPS = ['NT', 'NF', 'SJ', 'SP'];
const STEPS = [
  ['settings-enter', null],
  ['modal-open', { click: '#btnSettingsQuickAvatar' }],
  ['type-custom', { click: '#avatarTypeToggle [data-avatartype="custom"]' }],
  ['catalog-open', { click: '#btnToggle320PersonaCatalog' }],
  ...GROUPS.map(g => ['group-' + g, { click: '#persona320GroupTabs [data-group="' + g + '"]' }]),
  ['pick-320', { click: '#persona320ItemsContainer .persona-theme-card[data-tid="320"]' }],
  ['group-ALL', { click: '#persona320GroupTabs [data-group="ALL"]' }],
  ['pick-1', { click: '#persona320ItemsContainer .persona-theme-card[data-tid="1"]' }],
  ['search-INTJ', { type: 'INTJ' }],
  ['search-체스', { type: '체스' }],
  ['search-esfp', { type: 'esfp' }],
  ['search-none', { type: '없는키워드zz' }],
  ['search-clear', { type: '' }],
  ['catalog-close', { click: '#btnToggle320PersonaCatalog' }],
  ['catalog-reopen', { click: '#btnToggle320PersonaCatalog' }],
  ['modal-cancel', { click: '#btnCancelAvatarModal' }]
];
async function snapshot(page) {
  return page.evaluate(() => {
    const items = document.getElementById('persona320ItemsContainer');
    const slot = document.getElementById('persona320CatalogSlot');
    const tabs = document.getElementById('persona320GroupTabs');
    const arrow = document.getElementById('toggle320Arrow');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const av = window.OurgoalAvatar;
    const list = av && av.BODY_THEMES_320;
    return { items: items ? items.innerHTML : null, cards: items ? items.querySelectorAll('.persona-theme-card').length : null,
      slot: slot ? slot.style.display : null, tabs: tabs ? tabs.innerHTML : null, arrow: arrow ? arrow.textContent : null,
      modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null,
      api: list ? { n: list.length, json: JSON.stringify(list), keys: Object.keys(av).join(','), parts: window.OurgoalAvatarPersonaParts ? Object.keys(window.OurgoalAvatarPersonaParts).join(',') : null } : null };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(g|ms|t|task|goal)_[a-z0-9]{6,}/g, '$1_<uid>');
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
  const nav = await goTab(page, 'settings');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked:' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24); }, act.click);
    } else if (act && typeof act.type === 'string') {
      note = await page.evaluate(q => { const el = document.getElementById('inputSearchPersona320'); if (!el) return 'missing'; el.value = q; el.dispatchEvent(new Event('input', { bubbles: true })); return 'typed:' + q; }, act.type);
    }
    await sleep(900);
    const snap = await snapshot(page);
    const api = snap.api ? { n: snap.api.n, sha256: crypto.createHash('sha256').update(snap.api.json).digest('hex'), keys: snap.api.keys, parts: snap.api.parts } : null;
    steps.push({ name, note, items: VOL(snap.items), cards: snap.cards, slot: snap.slot, tabs: VOL(snap.tabs), arrow: snap.arrow, modal: VOL(snap.modal), ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, api, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  // api.parts 는 분리 후에만 생기는 데이터 묶음 이름(의도한 차이) — 비교에서 빼고 따로 적는다
  const FIELDS = ['note', 'items', 'cards', 'slot', 'tabs', 'arrow', 'modal', 'ls', 'toast', 'activeScreen', 'apiCore', 'newErrors'];
  const pick = (s, k) => k === 'apiCore' ? (s.api ? { n: s.api.n, sha256: s.api.sha256, keys: s.api.keys } : null) : s[k];
  const diffs = [];
  ra.steps.forEach((sa, i) => {
    const sb = rb.steps[i];
    for (const k of FIELDS) {
      const x = JSON.stringify(pick(sa, k)), y = JSON.stringify(pick(sb, k));
      if (x === y) continue;
      let at = 0; while (at < x.length && x[at] === y[at]) at++;
      diffs.push({ step: sa.name, field: k, base: String(x).slice(Math.max(0, at - 120), at + 200), after: String(y).slice(Math.max(0, at - 120), at + 200) });
    }
  });
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    cards: ra.steps.map((s, i) => s.name + ':' + s.cards + '/' + rb.steps[i].cards),
    itemsBytes: ra.steps.map(s => (s.items || '').length), modalBytes: ra.steps.map(s => (s.modal || '').length),
    api: { base: ra.steps[0].api, after: rb.steps[0].api },
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, errorsBase: ra.errors, errorsAfter: rb.errors, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  console.log('cards', summary.cards.join(' · '));
  console.log('api', JSON.stringify(summary.api));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
