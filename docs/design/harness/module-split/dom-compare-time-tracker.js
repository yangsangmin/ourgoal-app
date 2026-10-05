'use strict';
// 시간기록 세포 쪼개기(#TASK-ES-407) DOM·저장값·토스트 전후 비교(dom-compare-team-3.js 와 같은 틀, 단계만 시간기록):
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 시간기록 덮개(#timeTrackerOverlay)·초기화 확인창·기록 화면(#screen-records)·
// localStorage·토스트·확인 바텀시트(#modalSheet)·tracker 상태 요약·콘솔 오류를 기록해 맞댄다.
// 옮긴 묶음 — 몰입 화면 만들기·버튼 배선(initDOM·bindEvents) · 구간 메모 패널(openLapMemoModal) · 기록 작성·저장(openReviewView·handleSaveRecord) — 을
// 기록 탭 빠른 실행 줄의 「⏱️ 시간기록」(#recQuickDockBar, 게스트에게 보이는 입구 — 배너 카드 #recTimeTrackerActionCard 는 숨김)으로 열고 시작·구간·구간 메모·일시중지·계속·초기화·회전·모드 전환·전체중지·기록 작성·저장,
// 타이머(프리셋·시/분/초 조절·완료)·닫기·취소 경로를 차례로 누른다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간(경과 초·센티초)·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-time-tracker.js <baseApp> <afterApp> <out.json> [--twice-base]
const http = require('http'), fs = require('fs'), path = require('path');
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
// 단계: [이름, 할 일] — 문자열 = 클릭할 선택자, { input: [선택자, 값] } = 값 넣고 input·change·blur, { type, click } = 넣고 버튼,
// { js } = evaluate, { key } = 키 누름, { viewport: [w, h] } = 화면 크기, { wait: ms }, { confirmOk/confirmCancel } = 보이는 확인 버튼
const STEPS = [
  ['enter-records', null],
  // ① 몰입 화면 만들기(initDOM) · 스톱워치
  ['open-banner', '#recQuickDockBar button[onclick*="OurgoalTimeTracker"]'],
  ['start', '#btnTtActionStart'],
  ['lap-1', '#btnTtActionLap'],
  ['lap-2', '#btnTtActionLap'],
  // ② 구간 메모 패널(openLapMemoModal)
  ['lap-memo-open', '#ttLapsList .tt-lap-item'],
  ['lap-memo-tag', '#ttLapMemoContainer .btn-quick-lap-tag'],
  ['lap-memo-save', { type: ['#ttLapMemoInput', '비교 구간 메모'], click: '#btnTtLapMemoSave' }],
  ['lap-memo-open-2', '#ttLapsList .tt-lap-item'],
  ['lap-memo-cancel', '#btnTtLapMemoCancel'],
  ['lap-memo-open-3', '#ttLapsList .tt-lap-item'],
  ['lap-memo-esc', { key: 'Escape' }],
  // 측정 제어(원본에 남은 함수) — 이벤트 배선(bindEvents)을 거친다
  ['pause', '#btnTtActionPause'],
  ['resume', '#btnTtActionResume'],
  ['reset-prompt', '#btnTtActionReset'],
  ['reset-no', '#btnTtResetNo'],
  ['rotate', '#btnTtRotateToggle'],
  ['rotate-back', '#btnTtRotateToggle'],
  ['resize-landscape', { viewport: [812, 375] }],
  ['resize-portrait', { viewport: [375, 812] }],
  ['tab-timer-running', '#ttTabTimer'],
  ['tab-timer-running-cancel', { confirmCancel: true }],
  ['close-running', '#btnTtClose'],
  ['close-running-no', '#btnTtCancelNo'],
  // ③ 기록 작성(openReviewView) · 저장(handleSaveRecord)
  ['stop-record', '#btnTtActionStopRecord'],
  ['review-chip', '#ttReviewLapsList .btn-lap-card-tag'],
  ['review-lap-input', { input: ['#ttReviewLapsList .tt-lap-input', '비교 구간 내용'] }],
  ['review-cancel', '#btnTtCancelReview'],
  ['review-cancel-no', '#btnTtCancelNo'],
  ['save-empty-title', { type: ['#ttActivityTitle', ''], click: '#btnTtSaveRecord' }],
  ['save', { type: ['#ttActivityTitle', '비교 스톱워치 활동'], click: '#btnTtSaveRecord' }],
  // 타이머 — 프리셋·조절기·완료 → 기록 저장
  ['open-timer', '#recQuickDockBar button[onclick*="OurgoalTimeTracker"]'],
  ['tab-timer', '#ttTabTimer'],
  ['preset-1500', '#ttTimerSetup [data-tsec="1500"]'],
  ['preset-300', '#ttTimerSetup [data-tsec="300"]'],
  ['hour-up', '#btnTtTimerHourUp'],
  ['hour-down', '#btnTtTimerHourDown'],
  ['min-up', '#btnTtTimerMinUp'],
  ['min-down', '#btnTtTimerMinDown'],
  ['sec-down', '#btnTtTimerSecDown'],
  ['reset-preset', '#btnTtTimerResetPreset'],
  ['sec-up', '#btnTtTimerSecUp'],
  ['timer-start', '#btnTtActionStart'],
  ['timer-lap', '#btnTtActionLap'],
  ['timer-wait-complete', { wait: 11000 }],
  ['timer-finish-record', '#btnTtActionFinishRecord'],
  ['timer-save', { type: ['#ttActivityTitle', '비교 타이머 활동'], click: '#btnTtSaveRecord' }],
  // 취소 경로 — 정말 취소 · 초기화 확인 · 모드 전환 확인
  ['open-cancel', '#recQuickDockBar button[onclick*="OurgoalTimeTracker"]'],
  ['cancel-start', '#btnTtActionStart'],
  ['cancel-lap', '#btnTtActionLap'],
  ['tab-stopwatch-running', '#ttTabStopwatch'],
  ['tab-stopwatch-ok', { confirmOk: true }],
  ['cancel-start-2', '#btnTtActionStart'],
  ['cancel-lap-2', '#btnTtActionLap'],
  ['reset-prompt-2', '#btnTtActionReset'],
  ['reset-yes', '#btnTtResetYes'],
  ['cancel-start-3', '#btnTtActionStart'],
  ['esc-running', { key: 'Escape' }],
  ['cancel-yes', '#btnTtCancelYes'],
  ['open-idle', '#recQuickDockBar button[onclick*="OurgoalTimeTracker"]'],
  ['close-idle', '#btnTtClose'],
  ['api-state', { js: "var s = window.OurgoalTimeTracker.getState(); return [Object.keys(window.OurgoalTimeTracker).join(','), s.isOpen, s.mode, s.state, s.laps.length, s.timerTargetSeconds, Object.keys(s.dom).join(',')].join('|');" }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const ov = document.getElementById('timeTrackerOverlay');
    const rd = document.getElementById('ttResetConfirmDialog');
    const sheet = document.getElementById('modalSheet');
    const mo = document.getElementById('modalOverlay');
    const scr = document.getElementById('screen-records');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const confirmEls = Array.from(document.querySelectorAll('[class*="confirm"],[id*="confirm"],[id*="Confirm"]')).filter(e => e.offsetParent !== null).map(e => (e.id || e.className) + '|' + e.textContent.trim().slice(0, 120));
    let tr = null;
    try { const s = window.OurgoalTimeTracker.getState(); tr = { isOpen: s.isOpen, mode: s.mode, state: s.state, laps: s.laps.map(l => l.lapNum + ':' + l.text), timerTargetSeconds: s.timerTargetSeconds, forcedLandscape: s.forcedLandscape, domKeys: Object.keys(s.dom).length }; } catch (e) { tr = 'err:' + String(e).slice(0, 80); }
    const api = window.OurgoalTimeTracker ? Object.keys(window.OurgoalTimeTracker).join(',') : 'none';
    return { overlay: ov ? ov.outerHTML : null, resetDialog: rd ? rd.outerHTML : null, modal: sheet ? sheet.innerHTML : null, modalOverlay: mo ? (mo.className + '|' + (mo.style.display || '')) : null,
      screen: scr ? scr.outerHTML : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      confirm: confirmEls, activeScreen: (document.querySelector('.screen.active') || {}).id || null, tracker: tr, api };
  });
}
const VOL = x => x == null ? x : String(x).replace(/https?:\/\/127\.0\.0\.1:\d+/g, '<origin>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>').replace(/\b1[789]\d{8}\b/g, '<s>')
  .replace(/rec_tt_<ms>_[0-9a-z]{1,6}/g, 'rec_tt_<ms>_<rnd>')
  .replace(/(post|ping|msg|reply|comp|g|grp|team|lg|tg|ms|t|task|goal|rec|id|l)_[0-9a-z]{6,}/g, '$1_<id>')
  .replace(/rec_tt_<id>_[0-9a-z]{1,6}/g, 'rec_tt_<id>_<rnd>') // 시간기록 id 'rec_tt_<시각>_<난수4>' 의 꼬리 난수
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\d{1,2}:\d\d(:\d\d)?/g, '<hh:mm>').replace(/(오전|오후) ?\d{1,2}:\d\d/g, '<ampm>')
  .replace(/>\.\d\d</g, '>.<cs><') // 스톱워치 센티초(#ttDigitsSub)
  .replace(/(\d+)(분|초) ?(전|동안)/g, '<n>$2 $3').replace(/(총|약) ?\d+(초|분)/g, '$1 <n>$2');
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(j, (key, x) => (/(At|Time|time|_at|updated|ts|Ms|ms|Seconds)$/.test(key) && typeof x !== 'object') ? '<t>' : x); } catch (e) {}
    o[k] = VOL(val);
  }
  return o;
}
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
  await boot(page);
  const nav = await goTab(page, 'records');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.input) {
      note = await page.evaluate((sel, val) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.focus(); el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); return 'input'; }, act.input[0], act.input[1]);
    } else if (act && act.type) {
      note = await page.evaluate((sel, val, btn) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); const b = document.querySelector(btn); if (!b) return 'typed-no-btn'; b.click(); return 'typed-clicked'; }, act.type[0], act.type[1], act.click);
    } else if (act && act.js) {
      note = await page.evaluate(src => { try { const r = new Function(src)(); return 'js:' + String(r).slice(0, 4000); } catch (e) { return 'js-threw:' + String(e).slice(0, 120); } }, act.js);
      note = VOL(note);
    } else if (act && act.key) {
      await page.keyboard.press(act.key); note = 'key:' + act.key;
    } else if (act && act.viewport) {
      await page.setViewport({ width: act.viewport[0], height: act.viewport[1], deviceScaleFactor: 1, isMobile: true, hasTouch: true }); note = 'viewport:' + act.viewport.join('x');
    } else if (act && act.wait) {
      await sleep(act.wait); note = 'wait:' + act.wait;
    } else if (act && (act.confirmOk || act.confirmCancel)) {
      note = await page.evaluate(ok => {
        const vis = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null);
        const want = ok ? /^(확인|삭제|게시|네|예|OK|복사|덮어쓰기|변경)/ : /^(취소|아니요|닫기)/;
        const b = vis.reverse().find(x => want.test(x.textContent.trim()) && !/^btnTt/.test(x.id)); if (!b) return 'no-btn';
        b.click(); return 'clicked:' + b.textContent.trim().slice(0, 10);
      }, !!act.confirmOk);
    }
    await sleep(1100);
    const snap = await snapshot(page);
    steps.push({ name, note, overlay: VOL(snap.overlay), resetDialog: VOL(snap.resetDialog), modal: VOL(snap.modal), modalOverlay: snap.modalOverlay, screen: VOL(snap.screen), ls: normLs(snap.ls),
      toast: VOL(snap.toast), confirm: snap.confirm.map(VOL), activeScreen: snap.activeScreen, tracker: snap.tracker, api: snap.api, newErrors: errors.slice(errBefore), newDialogs: dialogs.slice(dlgBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
const FIELDS = ['note', 'overlay', 'resetDialog', 'modal', 'modalOverlay', 'screen', 'ls', 'toast', 'confirm', 'activeScreen', 'tracker', 'api', 'newErrors', 'newDialogs'];
function compare(ra, rb) {
  const diffs = [];
  ra.steps.forEach((sa, i) => {
    const sb = rb.steps[i];
    for (const k of FIELDS) {
      const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
      if (x === y) continue;
      let at = 0; while (at < x.length && x[at] === y[at]) at++;
      diffs.push({ step: sa.name, field: k, base: x.slice(Math.max(0, at - 120), at + 200), other: y.slice(Math.max(0, at - 120), at + 200) });
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
  const notActed = s => !s.note || /^(missing|no-btn|typed-no-btn)/.test(s.note) || /^js-threw/.test(s.note);
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    stepsActed: ra.steps.filter(s => !notActed(s)).length,
    stepsNotActed: ra.steps.filter(notActed).map(s => s.name + ':' + (s.note || 'enter')),
    overlayBytes: ra.steps.map(s => (s.overlay || '').length),
    comparedValues: ra.steps.length * FIELDS.length, differing: diffs.length, diffs,
    baseVsBase: noise ? { differing: noise.length, diffs: noise } : null,
    errorsBase: ra.errors, errorsAfter: rb.errors, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'acted', summary.stepsActed, 'compared', summary.comparedValues, 'differing', diffs.length, noise ? 'base-vs-base ' + noise.length : '', 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 700));
  if (noise) for (const d of noise.slice(0, 6)) console.log('NOISE', JSON.stringify(d).slice(0, 500));
  process.exitCode = diffs.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
