'use strict';
// 아바타 설정 모달 섹션 이전(#TASK-ES-390, 아바타·EXP 쪼개기 PR-4) 화면 DOM·저장값·토스트·외부 호출 전후 비교.
// dom-compare-avatar-logic.js(#TASK-ES-389)를 넓혔다 — 모달 섹션 7개(조립자·markup·bind-period·bind-deck·bind-craft·bind-persona·bind-save)를 모두 지난다.
// 이전 전(base)과 후(after) 앱을 같은 순서로 조작하고 단계마다 #modalOverlay·홈·설정·localStorage·토스트·콘솔 오류·OurgoalAvatar 공개 이름·/api 호출 기록을 맞댄다.
// 사진 업로드·제작 실행: /api/avatar-face·/api/avatar-persona 는 이 스크립트의 로컬 서버가 목으로 답한다(실제 Gemini 호출 0 — 돈·외부 전송 없음).
//   avatar-face 1번째 = { ok, fallback }(실패 경로: 횟수 되돌림·안내) · 2번째 = { ok, avatarUrl }(AI 그림 경로) · 3번째 = { ok, features }(캔버스 합성 경로)
//   avatar-persona = { persona: { mbti: 'INTJ', motto } } (페르소나 → 320종 MBTI 테마 고르기)
// Math.random 은 페이지마다 같은 씨앗의 수열로 바꾼다(테마 추첨·클립 id 를 기준·작업이 같게). 시간 값만 지운다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-avatar-modal.js <baseApp> <afterApp> <out.json>
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const HARN = path.join(__dirname, '..') + '/';
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require(HARN + 'shots-lib.js');
const { boot, goTab, sleep } = require(HARN + 'tab-states.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const PNG = 'data:image/png;base64,' + PNG_B64;
const PHOTO = path.join(os.tmpdir(), 'es390-photo.png');
fs.writeFileSync(PHOTO, Buffer.from(PNG_B64, 'base64'));
function serve(dir) {
  dir = path.resolve(dir);
  const calls = [];
  let face = 0;
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        let j = null; try { j = JSON.parse(body); } catch (e) {}
        let out = { ok: true };
        if (p === '/api/avatar-face') {
          face++;
          out = face === 1 ? { ok: true, fallback: true } : face === 2 ? { ok: true, avatarUrl: PNG } : { ok: true, features: { glasses: true, hairStyle: 'dandy', expression: 'bright_smile', skin: '#F5D0B5', hair: '#2B1B10' } };
          calls.push(p + '#' + face + ' theme=' + (j && j.theme ? j.theme.id : '?') + ' image=' + (j && j.image ? String(j.image).slice(0, 22) : '?'));
        } else if (p === '/api/avatar-persona') {
          out = { ok: true, persona: { mbti: 'INTJ', motto: '계획대로 간다' } };
          calls.push(p + ' ' + (j && j.summaryText ? String(j.summaryText).slice(0, 60) : ''));
        } else calls.push(p);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      });
      return;
    }
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 5100 + Math.floor(Math.random() * 400);
  return new Promise(r => s.listen(port, () => r({ s, base: 'http://127.0.0.1:' + port, calls })));
}
const OPEN = { click: '#btnSettingsQuickAvatar' };
// [단계 이름, 동작, 섹션]
const STEPS = [
  ['home-enter', null, 'boot'],
  ['seed', { seed: true }, 'boot'],
  ['settings-enter', { tab: 'settings' }, 'boot'],
  ['modal-open', OPEN, 'index+markup'],
  ['type-robot', { click: '#avatarTypeToggle [data-avatartype="robot"]' }, 'deck'],
  ['type-custom', { click: '#avatarTypeToggle [data-avatartype="custom"]' }, 'deck'],
  ['period-7', { click: '.avatar-period-chip[data-days="7"]' }, 'period'],
  ['period-90', { click: '.avatar-period-chip[data-days="90"]' }, 'period'],
  ['period-all', { click: '.avatar-period-chip[data-days="all"]' }, 'period'],
  ['period-set-open', { click: '#btnSetAvatarPeriod' }, 'period'],
  ['period-input-bad', { input: [['#avatarPeriodStartInput', '2026-09-30'], ['#avatarPeriodEndInput', '2026-09-01']] }, 'period'],
  ['period-input-ok', { input: [['#avatarPeriodStartInput', '2026-01-01'], ['#avatarPeriodEndInput', '2026-12-31']] }, 'period'],
  ['period-30', { click: '.avatar-period-chip[data-days="30"]' }, 'period'],
  ['period-set-close', { click: '#btnSetAvatarPeriod' }, 'period'],
  ['deck-pick-2', { click: '#savedAvatarsDeckSlot .saved-avatar-card[data-ava-id="ava_seed_2"]' }, 'deck'],
  ['growth-chip', { click: '.avatar-growth-chip[data-chip="지적으로"]' }, 'deck'],
  ['growth-save-dirty', { input: [['#avatarModalGrowthPromptInput', '바보 말고 카리스마']], then: '#btnSaveModalGrowthPrompt' }, 'deck'],
  ['deck-pick-1', { click: '#savedAvatarsDeckSlot .saved-avatar-card[data-ava-id="ava_seed_1"]' }, 'deck'],
  ['deck-empty', { click: '#savedAvatarsDeckSlot .empty-avatar-slot' }, 'deck'],
  ['deck-del-cancel', { click: '#savedAvatarsDeckSlot .btn-del-saved-avatar[data-ava-id="ava_seed_2"]', confirm: '#btnSheetConfirmCancel' }, 'deck'],
  ['craft-before-photo', { click: '#btnRunCraftAvatar' }, 'craft'],
  ['upload-legal', { click: '#btnUploadAvatarPhoto' }, 'craft'],
  ['upload-agree-photo', { agreeUpload: true }, 'craft'],
  ['craft-1-fallback', { click: '#btnRunCraftAvatar', wait: 2500 }, 'craft'],
  ['craft-2-ai-url', { click: '#btnRunCraftAvatar', wait: 3000 }, 'craft+deck'],
  ['craft-3-features', { click: '#btnRunCraftAvatar', wait: 3500 }, 'craft+deck'],
  ['catalog-open', { click: '#btnToggle320PersonaCatalog' }, 'persona'],
  ['catalog-group-nf', { click: '.btn-group-tab[data-group="NF"]' }, 'persona'],
  ['catalog-search', { input: [['#inputSearchPersona320', 'enfp']], event: 'input' }, 'persona'],
  ['catalog-pick', { click: '#persona320ItemsContainer .persona-theme-card' }, 'persona+deck'],
  ['catalog-close', { click: '#btnToggle320PersonaCatalog' }, 'persona'],
  ['modal-save', { click: '#btnSaveAvatarModal', wait: 1500 }, 'save'],
  ['home-after-save', { tab: 'home' }, 'save'],
  ['settings-again', { tab: 'settings' }, 'boot'],
  ['modal-open-2', OPEN, 'index+markup+restore'],
  ['deck-del-ok', { click: '#savedAvatarsDeckSlot .btn-del-saved-avatar', confirm: '#btnSheetConfirmOk' }, 'deck'],
  ['modal-reopen-3', OPEN, 'index+markup'],
  ['type-robot-save', { click: '#avatarTypeToggle [data-avatartype="robot"]' }, 'deck'],
  ['modal-save-robot', { click: '#btnSaveAvatarModal', wait: 1500 }, 'save'],
  ['modal-open-4', OPEN, 'index+markup'],
  ['modal-cancel', { click: '#btnCancelAvatarModal' }, 'index'],
  ['home-final', { tab: 'home' }, 'boot'],
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
    const legal = document.getElementById('modalAvatarLegalNotice');
    const sc = window.OurgoalAppScope && window.OurgoalAppScope.scope;
    const st = sc && sc.state && sc.state.profile && sc.state.profile.settings;
    const pick = st ? JSON.stringify({ avatarType: st.avatarType, customAvatarUrl: st.customAvatarUrl, avatarThemeId: st.avatarThemeId, avatarCraftCount: st.avatarCraftCount, avatarGrowthPrompt: st.avatarGrowthPrompt, hasAgreedAvatarLegalNotice: st.hasAgreedAvatarLegalNotice, savedAvatars: st.savedAvatars }) : null;
    return { topAvatar: H('topAvatar'), levelBadgeRow: H('levelBadgeRow'), home: H('screen-home'), settings: H('screen-settings'),
      modal: mo ? (mo.className + '|' + mo.innerHTML) : null, legal: legal ? legal.innerHTML : null, ls, state: pick,
      toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: act ? act.id : null, apiKeys: av ? Object.keys(av).join(',') : null,
      apiFns: av ? Object.keys(av).filter(k => typeof av[k] === 'function').length : null };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(g|ms|t|task|goal|ava)_[a-z0-9]{6,}/g, '$1_<uid>');
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
  const { s, base, calls } = await serve(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const ctx = await browser.createBrowserContext();
  const page = await shots.newPage(ctx, true, 'focus-sanctuary');
  await page.evaluateOnNewDocument(() => {
    let a = 20261005;
    Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  });
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await boot(page);
  const navs = [await goTab(page, 'home')];
  await sleep(4000); // 부팅 직후 비동기 저장(제작권 칸 maxBaseCrafts 등)이 끝날 때까지 — 기준끼리 비교에서 저장 시점 경쟁을 없앤다
  const steps = [];
  for (const [name, act, sec] of STEPS) {
    const errBefore = errors.length, callsBefore = calls.length;
    let note = '';
    if (act && act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked:' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24); }, act.click);
      if (act.confirm) { await sleep(700); note += ' / ' + await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'confirm-missing'; el.click(); return 'confirm:' + el.textContent.trim(); }, act.confirm); }
    } else if (act && act.input) {
      note = await page.evaluate((pairs, ev, then) => {
        const o = [];
        for (const [sel, v] of pairs) { const el = document.querySelector(sel); if (!el) { o.push('missing ' + sel); continue; } el.value = v; el.dispatchEvent(new Event(ev || 'change', { bubbles: true })); if (!ev && typeof el.onchange === 'function') {} o.push('set ' + sel); }
        if (then) { const b = document.querySelector(then); if (b) { b.click(); o.push('clicked ' + then); } else o.push('missing ' + then); }
        return o.join(',');
      }, act.input, act.event || null, act.then || null);
    } else if (act && act.agreeUpload) {
      try {
        const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 6000 }), page.click('#btnLegalNoticeAgree')]);
        await chooser.accept([PHOTO]);
        note = 'chooser-accepted';
      } catch (e) { note = 'chooser-fail:' + String(e.message).slice(0, 60); }
      await sleep(1200);
    } else if (act && act.tab) {
      if (act.tab === 'home') { await page.click('.navbtn[data-tab="home"]').catch(() => {}); await sleep(900); }
      const n = await goTab(page, act.tab); navs.push(n); note = 'tab:' + act.tab + ':' + (n && n.ok !== false ? 'ok' : 'fail');
    } else if (act && act.seed) {
      note = await page.evaluate(png => {
        const sc = window.OurgoalAppScope && window.OurgoalAppScope.scope;
        const st = sc && sc.state;
        if (!st || !st.profile) return 'no-state';
        st.profile.settings = st.profile.settings || {};
        st.profile.settings.avatarType = 'custom';
        st.profile.settings.customAvatarUrl = png;
        st.profile.settings.savedAvatars = [
          { id: 'ava_seed_1', url: png, themeId: 1, themeName: '열정 러너', growthPrompt: '더 강하게', mbti: 'ENFP', motto: '오늘도 한 걸음' },
          { id: 'ava_seed_2', url: png + '#2', themeId: 2, themeName: '덤벨 마스터', growthPrompt: '카리스마' }
        ];
        st.profile.goals = st.profile.goals || [];
        st.profile.goals.push({ id: 'g_es390seed', title: '아침 운동 30분', createdAt: new Date().toISOString(), milestones: [] });
        return 'seeded:saved2,goal1';
      }, PNG);
    }
    await sleep(act && act.wait ? act.wait : 900);
    const snap = await snapshot(page);
    steps.push({ name, sec, note, topAvatar: VOL(snap.topAvatar), levelBadgeRow: VOL(snap.levelBadgeRow), home: VOL(snap.home), settings: VOL(snap.settings), modal: VOL(snap.modal), legal: VOL(snap.legal),
      state: VOL(snap.state), ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, api: snap.apiKeys + '#' + snap.apiFns, newErrors: errors.slice(errBefore), apiCalls: calls.slice(callsBefore).map(VOL) });
  }
  await browser.close(); s.close();
  return { label, navs, steps, errors, calls };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const FIELDS = ['note', 'topAvatar', 'levelBadgeRow', 'home', 'settings', 'modal', 'legal', 'state', 'ls', 'toast', 'activeScreen', 'api', 'newErrors', 'apiCalls'];
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
  const sections = {};
  for (const s of ra.steps) for (const k of s.sec.split('+')) sections[k] = (sections[k] || 0) + 1;
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock + /api 목(원격·실계정·실제 Gemini 호출 없음) + Math.random 씨앗 고정',
    steps: ra.steps.map(s => s.name), stepsPerSection: sections, notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    bytes: { modal: bytes(ra, 'modal'), settings: bytes(ra, 'settings'), home: bytes(ra, 'home') },
    toasts: ra.steps.map((s, i) => s.name + ':' + s.toast + '/' + rb.steps[i].toast).filter(t => !/:null\/null$/.test(t)),
    apiCalls: { base: ra.calls.map(VOL), after: rb.calls.map(VOL) },
    api: { base: ra.steps[0].api, after: rb.steps[0].api },
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, errorsBase: ra.errors, errorsAfter: rb.errors, navsBase: ra.navs, navsAfter: rb.navs };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  console.log('api calls base', JSON.stringify(summary.apiCalls.base));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
