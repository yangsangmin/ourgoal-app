'use strict';
// 아바타 로직 세포 이전(#TASK-ES-389, 아바타·EXP 쪼개기 PR-3) 화면 DOM·저장값·토스트 전후 비교.
// dom-compare-avatar-personas.js(#TASK-ES-386)를 넓혔다 — 옮긴 5세포(themes·render·craft-engine·wallet·dynamic-album)가 그리는 곳을 모두 지난다.
// 이전 전(base)과 후(after) 앱을 같은 순서로 조작하고 단계마다 홈 아바타(#topAvatar·#levelBadgeRow·홈 화면), 설정 화면, #modalOverlay(아바타 모달·다이나믹 앨범),
// localStorage, 토스트, 콘솔 오류, OurgoalAvatar 공개 이름을 맞댄다.
// 누르는 곳: 홈 → (보관함 2칸 시드: OurgoalAppScope.scope.state.profile.settings.savedAvatars) → 설정 #btnSettingsQuickAvatar → #avatarTypeToggle 로봇/만화형
//   → .avatar-period-chip[data-days] 7·90·all·30 → #btnSetAvatarPeriod → 보관함 .saved-avatar-card 선택·.empty-avatar-slot → #btnToggle320PersonaCatalog → 카드 선택
//   → 로봇 → #btnSaveAvatarModal(적용) → 홈 → 설정 #btnOpenDynamicAlbum → .btn-equip-dynamic-avatar 착용 → #btnCloseDynamicAlbumModal → 홈
// 사진 업로드·제작 실행(#btnUploadAvatarPhoto·#btnRunCraftAvatar)은 누르지 않는다 — 외부 AI 호출(/api/avatar-face)이 돈·외부 전송이고, 모달 섹션(PR-4) 몫이다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-avatar-logic.js <baseApp> <afterApp> <out.json>
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
// 1x1 PNG(보관함 시드용 그림 — 외부 호출 없음)
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const STEPS = [
  ['home-enter', null],
  ['seed-saved', { seed: true }],
  ['settings-enter', { tab: 'settings' }],
  ['modal-open', { click: '#btnSettingsQuickAvatar' }],
  ['type-robot', { click: '#avatarTypeToggle [data-avatartype="robot"]' }],
  ['type-custom', { click: '#avatarTypeToggle [data-avatartype="custom"]' }],
  ['period-7', { click: '.avatar-period-chip[data-days="7"]' }],
  ['period-90', { click: '.avatar-period-chip[data-days="90"]' }],
  ['period-all', { click: '.avatar-period-chip[data-days="all"]' }],
  ['period-30', { click: '.avatar-period-chip[data-days="30"]' }],
  ['period-set', { click: '#btnSetAvatarPeriod' }],
  ['deck-pick-2', { click: '#savedAvatarsDeckSlot .saved-avatar-card[data-ava-id="ava_seed_2"]' }],
  ['deck-pick-1', { click: '#savedAvatarsDeckSlot .saved-avatar-card[data-ava-id="ava_seed_1"]' }],
  ['deck-empty', { click: '#savedAvatarsDeckSlot .empty-avatar-slot' }],
  ['catalog-open', { click: '#btnToggle320PersonaCatalog' }],
  ['catalog-pick-5', { click: '#persona320ItemsContainer .persona-theme-card[data-tid="5"]' }],
  ['type-robot-2', { click: '#avatarTypeToggle [data-avatartype="robot"]' }],
  ['modal-save', { click: '#btnSaveAvatarModal' }],
  ['home-after-save', { tab: 'home' }],
  ['settings-again', { tab: 'settings' }],
  ['album-open', { click: '#btnOpenDynamicAlbum' }],
  ['album-equip', { click: '.btn-equip-dynamic-avatar:not([disabled])' }],
  ['album-close', { click: '#btnCloseDynamicAlbumModal' }],
  ['home-final', { tab: 'home' }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const H = id => { const e = document.getElementById(id); return e ? e.innerHTML : null; };
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const av = window.OurgoalAvatar;
    const act = document.querySelector('.screen.active');
    return { topAvatar: H('topAvatar'), levelBadgeRow: H('levelBadgeRow'), home: H('screen-home'), settings: H('screen-settings'),
      modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: act ? act.id : null, apiKeys: av ? Object.keys(av).join(',') : null,
      apiFns: av ? Object.keys(av).filter(k => typeof av[k] === 'function').length : null };
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
    if (act && act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked:' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24); }, act.click);
    } else if (act && act.tab) {
      // goTab('home') 은 누르지 않고 지금 화면만 확인한다 — 홈으로 돌아갈 때는 하단 홈 버튼을 진짜로 누른다
      if (act.tab === 'home') { await page.click('.navbtn[data-tab="home"]').catch(() => {}); await sleep(900); }
      const n = await goTab(page, act.tab); navs.push(n); note = 'tab:' + act.tab + ':' + (n && n.ok !== false ? 'ok' : 'fail');
    } else if (act && act.seed) {
      note = await page.evaluate(png => {
        const sc = window.OurgoalAppScope && window.OurgoalAppScope.scope;
        const st = sc && sc.state;
        if (!st || !st.profile) return 'no-state';
        st.profile.settings = st.profile.settings || {};
        st.profile.settings.customAvatarUrl = png;
        st.profile.settings.savedAvatars = [
          { id: 'ava_seed_1', url: png, themeId: 1, themeName: '열정 러너', growthPrompt: '더 강하게' },
          { id: 'ava_seed_2', url: png, themeId: 2, themeName: '덤벨 마스터', growthPrompt: '카리스마' }
        ];
        return 'seeded:2';
      }, PNG);
    }
    await sleep(900);
    const snap = await snapshot(page);
    steps.push({ name, note, topAvatar: VOL(snap.topAvatar), levelBadgeRow: VOL(snap.levelBadgeRow), home: VOL(snap.home), settings: VOL(snap.settings), modal: VOL(snap.modal),
      ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, api: snap.apiKeys + '#' + snap.apiFns, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, navs, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const FIELDS = ['note', 'topAvatar', 'levelBadgeRow', 'home', 'settings', 'modal', 'ls', 'toast', 'activeScreen', 'api', 'newErrors'];
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
  const bytes = (r, k) => r.steps.map(s => (s[k] || '').length);
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    bytes: { home: bytes(ra, 'home'), settings: bytes(ra, 'settings'), modal: bytes(ra, 'modal'), topAvatar: bytes(ra, 'topAvatar') },
    toasts: ra.steps.map((s, i) => s.name + ':' + s.toast + '/' + rb.steps[i].toast).filter(t => !/:null\/null$/.test(t)),
    api: { base: ra.steps[0].api, after: rb.steps[0].api },
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, errorsBase: ra.errors, errorsAfter: rb.errors, navsBase: ra.navs, navsAfter: rb.navs };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
