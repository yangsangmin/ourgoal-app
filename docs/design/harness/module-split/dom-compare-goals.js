'use strict';
// 목표 탭 DOM·저장값·토스트 전후 비교 (#TASK-ES-370). 일정 탭 dom-compare-calendar.js(#TASK-ES-360)를 복제했다:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 #screen-goals 의 HTML·모달·목표 상태·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 단계는 옮긴 renderGoalsScreen 세 구간(머리·상세 마크업·상세 이벤트)이 그리고 잇는 곳을 차례로 누른다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-goals.js <baseApp> <afterApp> <out.json>
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
// 단계: [이름, 할 일]. 머리(서브탭·목표 칩·편집 토글) → 상세 마크업(필터·보기·접기·밀도·상태 요약) → 상세 이벤트(할 일 체크·선택·마감일·공개 범위·마일스톤 추가·결과·내보내기) → 다시 그리기.
const STEPS = [
  ['enter', null],
  ['chip-g2', '#goalChipRow [data-chip="g2"]'],
  ['chip-g1', '#goalChipRow [data-chip="g1"]'],
  ['ms-filter', '#msFilterToggle'],
  ['ms-filter-2', '#msFilterToggle'],
  ['ms-view', '#msViewToggle'],
  ['ms-view-back', '#msViewToggle'],
  ['collapse-all', '#msCollapseAllBtn'],
  ['expand-all', '#msCollapseAllBtn'],
  ['density', '#msDensityToggleBtn'],
  ['status-toggle', '#goalStatusToggleBtn'],
  ['toggle-done-tasks', { nth: ['#goalDetailBody [data-toggledonetasks]', 0] }],
  ['task-check', { nth: ['#goalDetailBody [data-taskcheck]', 1] }],
  ['ms-row-click', { nth: ['#goalDetailBody .ms-row', 1] }],
  ['close-modal-1', { closeModal: true }],
  ['result-open', '#goalResultBtn'],
  ['close-modal-2', { closeModal: true }],
  ['edit-on', '#goalEditToggle'],
  ['shift-right', '#goalChipRow [data-shiftright="g1"]'],
  ['sel-ms', { nth: ['#goalDetailBody [data-selms]', 0] }],
  ['sel-all', '#selAllBtn'],
  ['due-change', { setInput: ['#goalDueInput', '2027-01-15T09:30'] }],
  ['vis-change', { setInput: ['#goalVisInput', 'public'] }],
  ['add-ms', '#addMsBtn'],
  ['edit-off', '#goalEditToggle'],
  ['export-one', '#goalExportBtn'],
  ['chip-add', '#chipAdd'],
  ['close-modal-3', { closeModal: true }],
  ['sub-routine', '#goalsSubtabs [data-gsub="routine"]'],
  ['sub-stats', '#btnGoalsSubStats'],
  ['sub-teamlinked', '#goalsSubtabs [data-gsub="teamLinked"]'],
  ['sub-team', '#goalsSubtabs [data-gsub="team"]'],
  ['sub-template', '#goalsSubtabs [data-gsub="templateEncyclopedia"]'],
  ['sub-personal', '#goalsSubtabs [data-gsub="personal"]'],
  ['tab-home-and-back', { tabRoundTrip: true }],
  ['rerender-call', { rerender: true }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.getElementById('screen-goals');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const reg = window.OurgoalRegistry ? { mega: window.OurgoalRegistry.listMegaBlocks().find(b => b.id === 'goals'), errors: window.OurgoalRegistry.getErrorLog().length } : null;
    const subs = window.OurgoalEvents && window.OurgoalEvents.subscriptions ? window.OurgoalEvents.subscriptions().filter(s => s.owner && s.owner.indexOf('goals/') === 0).map(s => s.event + '|' + s.owner) : null;
    const st = window.state || null;
    return { html: scr ? scr.outerHTML : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      cal: st ? { activeGoalId: st.activeGoalId || null, goalsSubTab: st.goalsSubTab || null, goalEditMode: !!st.goalEditMode, msFilter: st.msFilter || null, goalViewMode: st.goalViewMode || null, msDensity: st.msDensity || null,
        goalStatusExpanded: !!st.goalStatusExpanded, msSel: st.msSel || null, taskSel: st.taskSel || null, collapsedMilestones: st.collapsedMilestones || null,
        goals: st.profile && st.profile.goals ? JSON.stringify(st.profile.goals) : null } : null,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null, reg, subs,
      globals: { renderGoalsScreen: typeof window.renderGoalsScreen, resultBadgeHtml: typeof window.resultBadgeHtml, formatDateTimeBadge: typeof window.formatDateTimeBadge, renderGoalDetailBody: typeof window.renderGoalDetailBody, wireGoalDetailEvents: typeof window.wireGoalDetailEvents },
      // 목표 키트(window.OurgoalGoalsKit)는 이번 이전이 만든 키트 객체다(일정 OurgoalCalendarKit 과 같은 틀) — 맞대지 않고 따로 적는다
      kit: typeof window.OurgoalGoalsKit };
  });
}
const VOL = x => x == null ? x : String(x).replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(ms|t|task|g|goal)_[a-z0-9]{8,}/g, '$1_<uid>'); // uid('ms') 등 = 시각+난수(마일스톤 추가가 만든 id)
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; } return x; }
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    // 객체 키는 정렬해 적는다: 오늘의 미션 캐시처럼 비동기 응답이 도착한 순서대로 키가 쌓이는 값은 실행마다 키 순서가 달라진다(같은 앱 2회 실행에서도 — 아래 base-vs-base 로 확인)
    try { const j = JSON.parse(v); val = JSON.stringify(sortKeys(j), (key, x) => (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string') ? '<hash>' : x); } catch (e) {}
    // hash(목표 상태 요약 캐시의 computeGoalStatusHash 값)는 마일스톤 id 를 섞어 만든다 — 마일스톤 추가가 만든 id 가 시각+난수라 실행마다 다르다. 목표 내용 자체는 cal.goals 칸에서 id 만 지우고 맞댄다.
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
    if (act && typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.nth) {
      note = await page.evaluate(([sel, i]) => { const el = document.querySelectorAll(sel)[i]; if (!el) return 'missing'; el.click(); return 'clicked:' + (el.textContent.trim().slice(0, 10)); }, act.nth);
    } else if (act && act.closeModal) {
      note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    } else if (act && act.setInput) {
      note = await page.evaluate(([sel, v]) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return 'changed'; }, act.setInput);
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'goals'); note = 'roundtrip';
    } else if (act && act.rerender) {
      note = await page.evaluate(() => { if (typeof window.renderGoalsScreen !== 'function') return 'no-fn'; window.renderGoalsScreen(); return 'called'; });
    }
    await sleep(900);
    const snap = await snapshot(page);
    steps.push({ name, note, html: VOL(snap.html), modal: VOL(snap.modal), cal: snap.cal ? Object.assign({}, snap.cal, { goals: VOL(snap.cal.goals) }) : null, ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, reg: snap.reg, subs: snap.subs, globals: snap.globals, kit: snap.kit, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  // 같은 기준 앱을 두 번 돌려(본질적 변동 확인) 이전 후 앱과 맞댄다
  const ra = await run(A, 'base'), ra2 = await run(A, 'base-2'), rb = await run(B, 'after');
  const FIELDS = ['note', 'html', 'modal', 'cal', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors', 'reg', 'subs'];
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
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note), htmlBytes: ra.steps.map(s => (s.html || '').length),
    comparedFields: ra.steps.length * FIELDS.length, differing: diffs.length, diffs, baseVsBaseDiffering: baseVsBase.length, baseVsBase, errorsBase2: ra2.errors, errorsBase: ra.errors, errorsAfter: rb.errors, kitBase: ra.steps[0].kit, kitAfter: rb.steps[0].kit, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'base-vs-base differing', baseVsBase.length, 'errors base/base2/after', ra.errors.length, ra2.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exit(1); });
