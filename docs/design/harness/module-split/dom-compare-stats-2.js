'use strict';
// 통계 세포 쪼개기 2차(#TASK-ES-401) 조작 DOM·저장값·토스트 전후 비교 — 1차 dom-compare-stats.js(#TASK-ES-392)의 24단계를 그대로 두고 2차에 옮긴 함수가 그리는 단계를 덧붙였다.
// 2차에 옮긴 것: 메트릭 추출·집계(stats-metrics)·SVG 차트(stats-charts — 대시보드를 그릴 때마다 돈다), 가져오기 모달·CSV 인제스터(stats-import — #uMenuImportBtn → 테마 탭·샘플 카드·CSV/텍스트 탭·텍스트 붙여넣기·융합),
// 데이터 관리 메뉴(stats-data-menu — #uHdrMgmtMenuBtn)·활용 가이드 모달(화면 진입 버튼은 #TASK-ES-126 에서 빠졌다 — 공개 API OurgoalUniversalStats.openGuideModal 로 연다).
// 난수(Math.random)는 페이지마다 같은 씨앗으로 고정한다(샘플 융합 뒤 id·그래프 id 가 실행마다 달라 비교가 가려지지 않도록 — 시각은 1차와 같이 지운다).
// 아래는 1차 설명 그대로. 기록 탭 비교(dom-compare-records.js)와 같은 방식:
// 이전 전(base) 앱을 2번, 이전 후(after) 앱을 1번 같은 순서로 조작하고, 단계마다 #screen-records·#modalOverlay·#uStatsFullscreenModal 의 HTML·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// base1 대 base2 차이 = 본질 변동(시간·난수) — 그 칸은 base1 대 after 비교에서 따로 표시한다(지우지 않고 noise 로 분류).
// 옮긴 함수가 그리는 곳: 분석 렌즈 4종(.u-lens-btn — 교차 비율·레이더·요일 리듬 차트, 통계 진단 리포트), 데이터 그리드(#uHdrGridBtn → 검색·전체 선택·행 추가 = 행 편집 모달),
// 스키마 편집(#uHdrMgmtMenuBtn → #uMenuTaxonomyBtn → 검색·새 스키마 입력). 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-stats-2.js <baseApp> <afterApp> <out.json>
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
const click = sel => ({ click: sel });
const type = (sel, text) => ({ type: sel, text });
const STEPS = [
  ['enter', null],
  ['seg-stats', click('#recSegmentBar [data-recseg="stats"]')],
  ['load-big3-if-empty', click('#uEmptyLoadBig3Btn')],
  ['lens-ratio', click('.u-lens-btn[data-lens="ratio"]')],
  ['lens-radar', click('.u-lens-btn[data-lens="radar"]')],
  ['lens-cadence', click('.u-lens-btn[data-lens="cadence"]')],
  ['lens-trend', click('.u-lens-btn[data-lens="trend"]')],
  ['grid-open', click('#uHdrGridBtn')],
  ['grid-search', type('#uGridSearchInp', 'ㅂ')],
  ['grid-search-clear', type('#uGridSearchInp', '')],
  ['grid-select-all', click('#uGridSelectAll')],
  ['grid-select-none', click('#uGridSelectAll')],
  ['grid-add-row', click('#uGridAddRowBtn')],
  ['row-edit-close', { closeModal: true }],
  ['mgmt-menu', click('#uHdrMgmtMenuBtn')],
  ['menu-taxonomy', click('#uMenuTaxonomyBtn')],
  ['tax-search', type('#uTaxSearchInput', '파워')],
  ['tax-search-clear', type('#uTaxSearchInput', '')],
  ['tax-new-name', type('#uTaxNewName', '새지표')],
  ['tax-close', { closeModal: true }],
  ['mgmt-menu-2', click('#uHdrMgmtMenuBtn')],
  ['menu-grid', click('#uMenuGridBtn')],
  ['grid-close', { closeModal: true }],
  ['tab-home-and-back', { tabRoundTrip: true }],
  // ── 2차(#TASK-ES-401) 덧붙인 단계 ──
  ['mgmt-menu-3', click('#uHdrMgmtMenuBtn')],
  ['menu-import', click('#uMenuImportBtn')],
  ['imp-theme-tab-career', click('#uSampleThemeTabRow .u-theme-tab-btn[data-theme="career"]')],
  ['imp-sample-card', click('.u-sample-card-grid[data-theme-panel="career"] .u-sample-card')],
  ['imp-tab-csv', click('#uImpTabCsv')],
  ['imp-tab-text', click('#uImpTabText')],
  ['imp-text-paste', type('#uImpTextInput', '2025-05-10\t콜 25건\t미팅 4건\t수주 1200만원\n2025-05-11\t콜 30건\t미팅 5건\t수주 800만원\n2025-05-12\t콜 18건\t미팅 2건\t수주 300만원')],
  ['imp-apply', click('#uImpApplyBtn')],
  ['after-import-lens-trend', click('.u-lens-btn[data-lens="trend"]')],
  ['after-import-lens-radar', click('.u-lens-btn[data-lens="radar"]')],
  ['mgmt-menu-4', click('#uHdrMgmtMenuBtn')],
  ['menu-import-2', click('#uMenuImportBtn')],
  ['imp-quick-sample', click('.u-sample-quick-btn')],
  ['guide-open-api', { evalApi: 'guide' }],
  ['guide-close', click('#uGuideCloseBtn')],
  ['tab-home-and-back-2', { tabRoundTrip: true }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const out = (id) => { const el = document.getElementById(id); return el ? el.outerHTML : null; };
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    return { html: out('screen-records'), modal: out('modalOverlay'), fs: out('uStatsFullscreenModal'), ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null,
      api: window.OurgoalUniversalStats ? Object.keys(window.OurgoalUniversalStats).join(',') : null };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  // 2차: 1초 샘플 로드는 지금 시각으로 기록을 만든다 — 화면에 글자로만 찍힌 시:분(>HH:MM<)도 지운다(기준 2회에서 실측한 본질 변동 4칸)
  .replace(/>\d\d:\d\d</g, '><hm><');
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
  await page.evaluateOnNewDocument(() => { let s = 20261005; Math.random = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; });
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await boot(page);
  const nav = await goTab(page, 'records');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length;
    let note = '';
    if (act && act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act.click);
    } else if (act && act.type) {
      note = await page.evaluate((sel, text) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('keyup', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 'typed'; }, act.type, act.text);
    } else if (act && act.closeModal) {
      note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    } else if (act && act.evalApi === 'guide') {
      note = await page.evaluate(() => { const U = window.OurgoalUniversalStats; if (!U || typeof U.openGuideModal !== 'function') return 'no-fn'; U.openGuideModal({ openModal: window.openModal, closeModal: window.closeModal }); return 'opened'; });
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'records'); note = 'roundtrip';
    }
    await sleep(900);
    const snap = await snapshot(page);
    steps.push({ name, note, html: VOL(snap.html), modal: VOL(snap.modal), fs: VOL(snap.fs), ls: normLs(snap.ls), toast: snap.toast, activeScreen: snap.activeScreen, api: snap.api, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
const FIELDS = ['note', 'html', 'modal', 'fs', 'ls', 'toast', 'activeScreen', 'api', 'newErrors'];
function compare(ra, rb) {
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
  return diffs;
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const b1 = await run(A, 'base1'), b2 = await run(A, 'base2'), af = await run(B, 'after');
  const noise = compare(b1, b2);
  const noiseKeys = new Set(noise.map(d => d.step + '|' + d.field));
  const all = compare(b1, af);
  const real = all.filter(d => !noiseKeys.has(d.step + '|' + d.field));
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: b1.steps.map(s => s.name), notes: b1.steps.map((s, i) => s.name + ':' + s.note + '/' + af.steps[i].note),
    htmlBytes: b1.steps.map(s => (s.html || '').length), modalBytes: b1.steps.map(s => (s.modal || '').length),
    comparedFields: b1.steps.length * FIELDS.length, baseVsBaseDiffering: noise.length, noise, baseVsAfterDiffering: all.length, differingExcludingNoise: real.length, diffs: real, noiseInAfter: all.filter(d => noiseKeys.has(d.step + '|' + d.field)).map(d => d.step + '|' + d.field),
    errorsBase1: b1.errors, errorsBase2: b2.errors, errorsAfter: af.errors, navBase: b1.nav, navAfter: af.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', b1.steps.length, 'compared', summary.comparedFields, 'base/base', noise.length, 'base/after', all.length, 'excl. noise', real.length, 'errors', b1.errors.length, b2.errors.length, af.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of real.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
  process.exitCode = real.length === 0 ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
