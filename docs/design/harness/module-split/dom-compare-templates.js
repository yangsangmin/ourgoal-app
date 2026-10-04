'use strict';
// 목표 템플릿 화면 DOM·저장값·토스트 전후 비교 (#TASK-ES-364 데이터 파일 분리). dom-compare-calendar.js(#TASK-ES-360)를 복제했다.
// 분리 전(base)과 분리 후(after) 앱을 같은 순서로 조작하고 단계마다 템플릿 화면 HTML·백과사전 모달·#modalOverlay·localStorage·토스트·목표 제목·콘솔 오류를 맞댄다.
// 두 곳을 누른다: ① 목표 탭 「템플릿」 서브탭(#templateEncyclopediaView — 카테고리 7칩·둘러보기·이식)
//                ② 📖 템플릿백과사전 모달(#templateEncyclopediaModal — AI 탭·카테고리 6칩·이 템플릿으로 시작)
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-templates.js <baseApp> <afterApp> <out.json>
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
const CATS = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
const STEPS = [
  ['goals-enter', null],
  ['sub-template', { click: '#btnGoalsSubTemplate' }],
  ...CATS.map(c => ['sub-cat-' + c, { click: '#templateEncyclopediaView [data-subtcat="' + c + '"]' }]),
  ['sub-cat-all', { click: '#templateEncyclopediaView [data-subtcat="all"]' }],
  ['sub-preview-mnd05', { click: '#templateEncyclopediaView [data-subtpl-prev="tpl_mnd_05"]' }],
  ['sub-preview-close', { closeAll: true }],
  ['sub-clone-hlt02', { click: '#templateEncyclopediaView [data-subtpl-clone="tpl_hlt_02"]' }],
  ['modal-open', { openEncyclopedia: true }],
  ['modal-ai-tab', { click: '#tabTplOurgoalAi' }],
  ...CATS.map(c => ['modal-cat-' + c, { click: '#tplAiCategoryChips [data-encycl-cat="' + c + '"]' }]),
  ['modal-start-rel10', { click: '#tplAiCardsList [data-ai-start="tpl_rel_10"]' }],
  ['tab-home-and-back', { tabRoundTrip: true }]
];
async function snapshot(page) {
  return page.evaluate(() => {
    const tev = document.getElementById('templateEncyclopediaView');
    const em = document.getElementById('templateEncyclopediaModal');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const st = window.state || null;
    const goals = st && Array.isArray(st.goals) ? st.goals.map(g => (g.title || '') + '|' + ((g.milestones || g.ms || []).length)) : null;
    const tpl = window.OURGOAL_60_TEMPLATES;
    // 게스트 주장 확인용: 템플릿 제목이 템플릿 화면·백과사전 모달·목표 탭·저장값에 몇 번 나오는가
    const TITLES = { hlt02: '풀코스 마라톤 Sub-4', rel10: '비폭력대화(NVC) 4단계', mnd05: '모닝 페이지(Morning Pages)' };
    const lsAll = Object.values(ls).join('\n');
    const goalsScr = document.getElementById('screen-goals');
    const seen = {};
    for (const [k, t] of Object.entries(TITLES)) seen[k] = { ls: lsAll.split(t).length - 1, goalsScreen: goalsScr ? goalsScr.textContent.split(t).length - 1 : null, tev: tev ? tev.textContent.split(t).length - 1 : null, em: em ? em.textContent.split(t).length - 1 : null };
    return { tev: tev ? (tev.style.display + '|' + tev.innerHTML) : null, em: em ? (em.style.display + '|' + em.innerHTML) : null,
      modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null, goals,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null, seen,
      tplApi: tpl ? { n: tpl.list.length, keys: Object.keys(tpl).sort().join(','), firstTitle: tpl.list[0] && tpl.list[0].title, lastId: tpl.list[tpl.list.length - 1].id } : null };
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
    // hash: 오늘 미션 캐시 지문(computeTodayMissionHash) — 이식한 목표의 무작위 id 로 매번 달라진다. 기준 대 기준 2회 실행에서 11단계 모두 이 값만 달랐다(본질적 변동).
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
  const nav = await goTab(page, 'goals');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked:' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24); }, act.click);
    } else if (act && act.closeAll) {
      note = await page.evaluate(() => {
        const out = [];
        if (typeof window.closeModal === 'function') { window.closeModal(); out.push('closeModal'); }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); out.push('esc');
        return out.join('+');
      });
    } else if (act && act.openEncyclopedia) {
      await goTab(page, 'goals');
      note = await page.evaluate(() => {
        const b = document.getElementById('btnGoalTemplateEncyclopedia');
        if (b && b.offsetParent) { b.click(); return 'clicked:#btnGoalTemplateEncyclopedia'; }
        if (typeof window.openTemplateEncyclopediaModal === 'function') { window.openTemplateEncyclopediaModal(); return 'called:openTemplateEncyclopediaModal'; }
        return 'missing';
      });
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'goals'); note = 'roundtrip';
    }
    await sleep(1100);
    const snap = await snapshot(page);
    steps.push({ name, note, tev: VOL(snap.tev), em: VOL(snap.em), modal: VOL(snap.modal), ls: normLs(snap.ls), toast: VOL(snap.toast), goals: snap.goals, seen: snap.seen, activeScreen: snap.activeScreen, tplApi: snap.tplApi, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), rb = await run(B, 'after');
  const FIELDS = ['note', 'tev', 'em', 'modal', 'ls', 'toast', 'goals', 'seen', 'activeScreen', 'tplApi', 'newErrors'];
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
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    tevBytes: ra.steps.map(s => (s.tev || '').length), emBytes: ra.steps.map(s => (s.em || '').length),
    seen: ra.steps.map((s, i) => ({ step: s.name, base: s.seen, after: rb.steps[i].seen })),
    tplApi: { base: ra.steps[0].tplApi, after: rb.steps[0].tplApi },
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, errorsBase: ra.errors, errorsAfter: rb.errors, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  console.log('tplApi', JSON.stringify(summary.tplApi));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
