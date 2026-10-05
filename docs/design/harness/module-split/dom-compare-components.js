'use strict';
// 공통 UI 컴포넌트 세포 쪼개기(#TASK-ES-411) DOM·저장값·토스트 전후 비교(dom-compare-time-tracker.js 와 같은 틀, 단계만 직통 핸들러):
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 활성 화면(HTML 해시·길이)·모달 시트(#modalSheet)·모달 덮개·떠 있는 대화상자·
// 게시 모달 캡션(#shareCaptionInput 값·placeholder)·테마 속성·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 옮긴 함수(js/components-*-actions.js 11개, 56개)를 앱이 부르는 길 그대로 부른다:
//   ① 숨은 배선 칸(#ogTaskWireSlot, display:none)의 직통 버튼 #og-task-NN-action-btn 을 element.click() — onclick="handle<탭>_ItemNNAction(event)" 경로(23·33~53)
//   ② 버튼 없는 직통 핸들러(56~71·79)와 작은 함수는 window.<이름>(…) 로 부르고(앱의 다른 코드가 부르는 이름 그대로) 돌려준 값을 맞댄다
//   ③ 게스트에게 보이는 길: 소통 탭 「게시하기」(#btnCommPostFeed) → 게시 모달의 기본 캡션(generateRecordPledgeMessage) · 설정·목표·기록·일정 탭 진입
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-components.js <baseApp> <afterApp> <out.json> [--twice-base]
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const HARN = path.join(__dirname, '..') + '/';
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require(HARN + 'shots-lib.js');
const { boot, goTab, sleep } = require(HARN + 'tab-states.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
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
const wire = n => ['wire-' + n, { click: '#og-task-' + n + '-action-btn' }];
const call = (name, args) => ['call-' + name.replace(/^handle/, ''), { call: name, args: args || [] }];
// 단계: [이름, 할 일] — { tab } = 하단 탭 진짜 누름, { click } = element.click(), { call, args } = window[이름](...args) 를 기다려 돌려준 값,
// { key } = 키 누름, { tidy: true } = 열린 모달·덮개 닫기(closeModal + Escape)
const STEPS = [
  ['enter-home', { tab: 'home' }],
  // ① 숨은 배선 칸의 직통 버튼(23 은 원본에 남은 핸들러 — 대조용)
  wire(23), wire(33), wire(34), wire(35), ['tidy-35', { tidy: true }], wire(37), wire(38), ['tidy-38', { tidy: true }], wire(39), wire(40), ['tidy-40', { tidy: true }],
  wire(41), ['tidy-41', { tidy: true }], wire(42), ['tidy-42', { tidy: true }], wire(43), wire(44), ['tidy-44', { tidy: true }], wire(45), wire(46), wire(47), ['tidy-47', { tidy: true }],
  wire(48), wire(49), ['tidy-49', { tidy: true }], wire(50), wire(51), ['tidy-51', { tidy: true }], wire(52), wire(53), ['tidy-53', { tidy: true }],
  // ② 버튼 없는 직통 핸들러(window 이름으로)
  call('handle성취통계_Item56Action', [null]), call('handle소통_Item57Action', [null]), call('handle소통_Item58Action', [null]), call('handle소통_Item59Action', [null]),
  call('handle성취통계_Item60Action', [null]), call('handle소통_Item61Action', [null]), call('handle전체공통_Item62Action', [null]), call('handle소통_Item63Action', [null]),
  call('handle목표탭_Item64Action', [null]), call('handle일정_Item65Action', [null]), call('handle홈탭_Item66Action', [null]), call('handle소통_Item67Action', [null]),
  call('handle팀목표_Item68Action', [null]), call('handle인증_Item69Action', [null]), call('handle인증_Item70Action', [null]), call('handle인증_Item71Action', [null]),
  ['tidy-71', { tidy: true }],
  call('handle설정_Item79Action', [null, { theme: 'focus-sanctuary' }]), call('handle테마_Item79Action', [null, { theme: 'focus-sanctuary' }]),
  call('handle팀목표_Item51Action', [null]), ['tidy-alias51', { tidy: true }],
  // 작은 함수(순수 계산 · 접기 토글)
  call('blendFeedWithAiBotRule', [[{ id: 'p1', text: '실천 1' }, { id: 'p2', text: '실천 2' }], [{ id: 'ai1', text: 'AI 응원' }, { id: 'ai2', text: 'AI 응원 2' }], true]),
  call('blendFeedWithAiBotRule', [[{ id: 'p1' }], [{ id: 'ai1' }], false]),
  call('getWidgetRenderSpec', ['goals', 'detail']), call('getWidgetRenderSpec', ['records', 'compact']), call('getWidgetRenderSpec', ['nope', 'nope']),
  call('generateRecordPledgeMessage', [{ title: '러닝 5km 완주', durationMinutes: 75 }, null]), call('generateRecordPledgeMessage', [{ text: '독서 30쪽' }, null]),
  call('generateRecordPledgeMessage', [null, { title: '마라톤 완주' }]), call('generateRecordPledgeMessage', [null, null]),
  call('toggleAchievementMetricFilter', ['rate', ['rate', 'streak']]), call('toggleAchievementMetricFilter', ['minutes', ['rate']]),
  call('toggleTeamLinkedGoalExample', []), call('toggleTimeRecordModalCompact', []), ['tidy-compact', { tidy: true }], call('toggleTeamGoalCommentSection', []), ['tidy-comment', { tidy: true }],
  call('toggleTeamGoalAccordionCollapse', []), call('toggleSettingsSectionCollapse', []), call('enlargeAvatarIconsBatch', []), call('toggleDataManagementSection', []),
  call('openFeedPostPreviewModal', []), ['tidy-preview', { tidy: true }],
  // ③ 게스트에게 보이는 길
  ['enter-comm', { tab: 'comm' }],
  ['comm-post-feed', { click: '#btnCommPostFeed' }],
  ['comm-post-feed-close', { tidy: true }],
  ['enter-settings', { tab: 'settings' }],
  ['enter-goals', { tab: 'goals' }],
  ['enter-records', { tab: 'records' }],
  ['enter-calendar', { tab: 'calendar' }],
  ['enter-home-again', { click: '.navbtn[data-tab="home"]' }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.querySelector('.screen.active');
    const sheet = document.getElementById('modalSheet');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"],[id$="Modal"],[id$="modal"],[id$="Overlay"],[class*="og-modal"],[class*="popup"]')).filter(vis)
      .map(e => (e.id || e.className).toString().slice(0, 60) + '|' + e.textContent.replace(/\s+/g, ' ').trim().slice(0, 300));
    const cap = document.getElementById('shareCaptionInput');
    const de = document.documentElement;
    return { screenId: scr ? scr.id : null, screen: scr ? scr.outerHTML : '', modal: sheet ? sheet.innerHTML : null, modalOverlay: mo ? (mo.className + '|' + (mo.style.display || '')) : null,
      dialogs, caption: cap ? (cap.value + '|' + (cap.getAttribute('placeholder') || '')) : null,
      theme: (de.getAttribute('data-theme') || '') + '|' + de.className + '|' + document.body.className, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null };
  });
}
const VOL = x => x == null ? x : String(x).replace(/https?:\/\/127\.0\.0\.1:\d+/g, '<origin>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>').replace(/\b1[789]\d{8}\b/g, '<s>')
  .replace(/(post|ping|msg|reply|comp|g|grp|team|lg|tg|ms|t|task|goal|rec|id|l|sess|dev|fb|fbg|tmpl|w)_[0-9a-z]{6,}/g, '$1_<id>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\d{1,2}:\d\d(:\d\d)?/g, '<hh:mm>').replace(/(오전|오후) ?\d{1,2}:\d\d/g, '<ampm>')
  .replace(/(\d+)(분|초|시간) ?(전|동안)/g, '<n>$2 $3');
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(j, (key, x) => (/(At|Time|time|_at|updated|ts|Ms|ms|Seconds|stamp)$/.test(key) && typeof x !== 'object') ? '<t>' : x); } catch (e) {}
    o[k] = VOL(val);
  }
  return o;
}
const H = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 16);
async function run(app, label) {
  const { s, base } = await serve(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.createBrowserContext();
  const page = await shots.newPage(ctx, true, 'focus-sanctuary');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = []; const dialogs = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(VOL(m.text().slice(0, 200))); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + VOL(String(e).slice(0, 200))));
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message().slice(0, 120)); d.dismiss().catch(() => {}); });
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  const bootNotes = await boot(page);
  const loaded = await page.evaluate(() => ({ kit: Object.keys(window.OurgoalComponentsKit || {}).join(','), api: Object.keys(window.OurgoalComponents || {}).length,
    handlers: Object.keys(window).filter(k => /^handle.+_Item\d+Action$/.test(k) && typeof window[k] === 'function').length }));
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (act.tab) {
      const r = await goTab(page, act.tab); note = 'tab:' + (r.ok ? 'ok' : 'fail ' + r.note);
    } else if (act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act.click);
    } else if (act.call) {
      note = await page.evaluate(async (nm, args) => {
        const fn = window[nm]; if (typeof fn !== 'function') return 'missing:' + typeof fn;
        try { const r = await fn.apply(window, args); return 'ret:' + JSON.stringify(r === undefined ? '<undefined>' : r).slice(0, 3000); } catch (e) { return 'threw:' + String(e).slice(0, 160); }
      }, act.call, act.args);
      note = VOL(note);
    } else if (act.key) {
      await page.keyboard.press(act.key); note = 'key:' + act.key;
    } else if (act.tidy) {
      note = await page.evaluate(() => { const r = []; try { if (typeof window.closeModal === 'function') { window.closeModal(); r.push('closeModal'); } } catch (e) { r.push('closeModal-threw'); } return r.join(',') || 'none'; });
      await page.keyboard.press('Escape'); note += '+Escape';
    }
    await sleep(1100);
    const snap = await snapshot(page);
    const scr = VOL(snap.screen);
    steps.push({ name, note, screenId: snap.screenId, screenHash: H(scr), screenLen: scr.length, modal: VOL(snap.modal), modalOverlay: snap.modalOverlay, dialogs: snap.dialogs.map(VOL),
      caption: VOL(snap.caption), theme: snap.theme, ls: normLs(snap.ls), toast: VOL(snap.toast), newErrors: errors.slice(errBefore), newDialogs: dialogs.slice(dlgBefore), _screen: scr });
  }
  await browser.close(); s.close();
  return { label, bootNotes, loaded, steps, errors };
}
const FIELDS = ['note', 'screenId', 'screenHash', 'screenLen', 'modal', 'modalOverlay', 'dialogs', 'caption', 'theme', 'ls', 'toast', 'newErrors', 'newDialogs'];
function compare(ra, rb) {
  const diffs = [];
  ra.steps.forEach((sa, i) => {
    const sb = rb.steps[i];
    for (const k of FIELDS) {
      const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
      if (x === y) continue;
      const xs = k === 'screenHash' ? sa._screen : x, ys = k === 'screenHash' ? sb._screen : y;
      let at = 0; while (at < xs.length && xs[at] === ys[at]) at++;
      diffs.push({ step: sa.name, field: k, base: xs.slice(Math.max(0, at - 120), at + 200), other: ys.slice(Math.max(0, at - 120), at + 200) });
    }
  });
  return diffs;
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const twice = process.argv.includes('--twice-base');
  const ra = await run(A, 'base');
  const ra2 = twice ? await run(A, 'base2') : null;
  const rb = await run(B, 'after');
  const diffs = compare(ra, rb);
  const noise = ra2 ? compare(ra, ra2) : null;
  const notActed = s => !s.note || /^(missing|tab:fail)/.test(s.note) || /^threw/.test(s.note);
  // 저장 크기: 단계별 값은 지문(sha1 앞 16자)으로만 남긴다(전체 글자는 비교에만 쓴다). note·screenId·caption·theme·toast 는 짧아 그대로.
  const strip = r => r.steps.map(s => { const o = {}; for (const k of FIELDS) o[k] = ['note', 'screenId', 'screenHash', 'screenLen', 'caption', 'theme', 'toast'].includes(k) ? s[k] : H(JSON.stringify(s[k])); o.name = s.name; return o; });
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    loadedBase: ra.loaded, loadedAfter: rb.loaded, bootBase: ra.bootNotes, bootAfter: rb.bootNotes,
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + String(s.note).slice(0, 80) + ' / ' + String(rb.steps[i].note).slice(0, 80)),
    stepsActed: ra.steps.filter(s => !notActed(s)).length,
    stepsNotActed: ra.steps.filter(notActed).map(s => s.name + ':' + (s.note || 'none')),
    comparedValues: ra.steps.length * FIELDS.length, differing: diffs.length, diffs,
    baseVsBase: noise ? { differing: noise.length, diffs: noise } : null,
    errorsBase: ra.errors, errorsAfter: rb.errors, stepsBase: strip(ra), stepsAfter: strip(rb) };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('loaded base', JSON.stringify(ra.loaded), 'after', JSON.stringify(rb.loaded));
  console.log('steps', ra.steps.length, 'acted', summary.stepsActed, 'compared', summary.comparedValues, 'differing', diffs.length, noise ? 'base-vs-base ' + noise.length : '', 'errors base/after', ra.errors.length, rb.errors.length);
  console.log('not acted:', summary.stepsNotActed.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 700));
  if (noise) for (const d of noise.slice(0, 6)) console.log('NOISE', JSON.stringify(d).slice(0, 500));
  process.exitCode = diffs.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
