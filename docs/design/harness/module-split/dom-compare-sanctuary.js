'use strict';
// 포커스 성소 엔진 세포 쪼개기(#TASK-ES-429) DOM·저장값·토스트 전후 비교(dom-compare-components.js 와 같은 틀, 단계만 성소 화면):
// 이전 전(base)과 이전 후(after) 앱을 포커스 성소 테마(focus-sanctuary)로 같은 순서로 조작하고 단계마다 활성 화면(HTML 해시·길이)·성소 슬롯 6곳
// (#sanctuaryHomeSlot·#sanctuaryGoalsView·#sanctuaryCalendarView·#sanctuaryRecordsView·#sanctuaryCommView·#sanctuarySettingsSlot) HTML·모달 시트(#modalSheet)·
// 모달 덮개·떠 있는 대화상자·테마 속성·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 옮긴 코드(js/sanctuary-*.js 7개 — 레이더 함수 4·분기 본문 7·메서드 28)를 앱이 부르는 길 그대로 부른다:
//   ① 하단 탭 진짜 누름(성소 화면 그리기 = 라우터 renderSanctuaryV3 → 분기 본문)
//   ② 성소 화면의 onclick 이 부르는 이름 그대로 window.OurgoalSanctuaryV3.<메서드>(…)(this = 공개 객체) — 모드 바꾸기·달력 이동·창 열기·토글·타이머·리캡·피드 쪽
//   ③ 게스트 시드에 없는 동반자·일정은 같은 값으로 state 에 넣고(두 앱 같은 값) 레이더·달력을 다시 그린다
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-sanctuary.js <baseApp> <afterApp> <out.json> [--twice-base]
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
const api = (name, args, label) => [label || ('api-' + name), { api: name, args: args || [] }];
const js = (label, code) => [label, { js: code }];
// 단계: [이름, 할 일] — { tab } = 하단 탭 진짜 누름, { click } = element.click(), { api, args } = window.OurgoalSanctuaryV3[이름](...args) 를 기다려 돌려준 값(this = 공개 객체),
// { js } = 페이지에서 함수 글자를 돌려 돌려준 값, { tidy: true } = 열린 모달·덮개 닫기(closeModal + Escape)
const STEPS = [
  ['enter-home', { tab: 'home' }],
  // 목표 탭: 마운틴 트레일(분기 본문 renderSanctuaryGoalTrail) · 마일스톤·할 일 토글 · 체크인 연결 · 샘플 루틴 담기
  ['enter-goals', { tab: 'goals' }],
  js('goal-ids', "var g=(window.state&&state.profile&&state.profile.goals)||[];return g.map(function(x){return [(x.milestones||[]).length,(((x.milestones||[])[0]||{}).tasks||[]).length];});"),
  js('toggle-milestone', "var g=state.profile.goals[0];if(!g||!g.milestones||!g.milestones[0])return 'no-ms';return window.OurgoalSanctuaryV3.toggleMilestone(g.id,g.milestones[0].id).then(function(){return 'ok';});"),
  js('toggle-milestone-2', "var g=state.profile.goals[0];if(!g||!g.milestones||!g.milestones[0])return 'no-ms';return window.OurgoalSanctuaryV3.toggleMilestone(g.id,g.milestones[0].id).then(function(){return 'ok';});"),
  js('toggle-task', "var g=state.profile.goals[0];var m=g&&g.milestones&&g.milestones.find(function(x){return x.tasks&&x.tasks.length;});if(!m)return 'no-task';return window.OurgoalSanctuaryV3.toggleTask(g.id,m.id,m.tasks[0].id).then(function(){return 'ok';});"),
  api('toggleMilestone', ['nope', 'nope']), api('toggleTask', ['nope', 'nope', 'nope']),
  api('transplantSampleRoutine', []),
  api('render', ['goals'], 'render-goals'),
  js('toggle-milestone-transplanted', "var g=state.profile.goals[0];return window.OurgoalSanctuaryV3.toggleMilestone(g.id,'ms_t2').then(function(){return g.progress;});"),
  js('toggle-task-transplanted', "var g=state.profile.goals[0];return window.OurgoalSanctuaryV3.toggleTask(g.id,'ms_t1','tk_t1').then(function(){return 'ok';});"),
  api('openMilestoneCheckin', ['5km 논스톱 달리기']),
  ['enter-goals-again', { tab: 'goals' }],
  // 일정 탭: 월간(분기 본문 renderSanctuaryCalendarMonth) · 주간(원본) · 일간 타임라인(분기 본문 renderSanctuaryCalendarTimeline) · 이동·선택 · 창 열기 · 완료 토글
  ['enter-calendar', { tab: 'calendar' }],
  js('seed-schedule', "var s=state.profile.settings=state.profile.settings||{};s.customSchedules=s.customSchedules||[];var d=new Date();var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');s.customSchedules.push({id:'cs_dom_1',title:'성소 비교 일정',date:k+'T09:30',note:'',done:false,attachments:[]});window.OurgoalSanctuaryV3.render('calendar');return s.customSchedules.length;"),
  api('setCalMode', ['month']), api('shiftCal', [1]), api('shiftCal', [-1], 'api-shiftCal-back'), api('selectToday', []),
  js('select-first-day', "var d=new Date();var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';window.OurgoalSanctuaryV3.selectCalDay(k);return k.length;"),
  api('selectToday', [], 'api-selectToday-2'),
  api('toggleScheduleItem', ['cs_dom_1', 'custom']), api('toggleScheduleItem', ['cs_dom_1', 'custom'], 'api-toggleScheduleItem-back'),
  api('openAddScheduleModal', []), ['tidy-add', { tidy: true }],
  api('openDayHubModal', []), ['tidy-hub', { tidy: true }],
  api('openBgPickerModal', [null, false]), ['tidy-bg', { tidy: true }],
  api('openScheduleDetail', [null, 'cs_dom_1', 'custom']), ['tidy-detail', { tidy: true }],
  api('setCalMode', ['week'], 'api-setCalMode-week'), api('shiftWeek', [1]), api('shiftWeek', [-1], 'api-shiftWeek-back'),
  api('setCalMode', ['timeline'], 'api-setCalMode-timeline'), api('shiftTimelineDay', [1]), api('shiftTimelineDay', [-1], 'api-shiftTimelineDay-back'),
  api('setCalMode', ['month'], 'api-setCalMode-month-2'),
  // 기록 탭: 히트맵(원본) · 피드·보관함(분기 본문) · 리캡(분기 본문 + 리캡 창) · 타이머(분기 본문 + 시작·멈춤·초기화·완료)
  ['enter-records', { tab: 'records' }],
  api('setRecMode', ['heatmap']), api('setHeatFilter', ['week']),
  api('setRecMode', ['feed'], 'api-setRecMode-feed'), api('setFeedPeriod', ['week']), api('setFeedPeriod', ['all'], 'api-setFeedPeriod-all'), api('setFeedPage', [2]), api('setFeedPage', [1], 'api-setFeedPage-1'),
  api('setFeedPeriod', ['custom'], 'api-setFeedPeriod-custom'), api('applyFeedCustomDate', []),
  api('setRecMode', ['archive'], 'api-setRecMode-archive'), api('setArchivePeriod', ['month']), api('setArchivePeriod', ['all'], 'api-setArchivePeriod-all'), api('setArchivePage', [1]),
  api('setRecMode', ['stats'], 'api-setRecMode-stats'),
  api('setRecMode', ['recap'], 'api-setRecMode-recap'), api('openWeeklyRecapModal', []), ['tidy-recap', { tidy: true }],
  js('recap-image-fn', "return typeof window.OurgoalSanctuaryV3.downloadRecapImage;"),
  api('setRecMode', ['timer'], 'api-setRecMode-timer'), api('togglePomodoro', []), api('togglePomodoro', [], 'api-togglePomodoro-pause'), api('resetPomodoro', []),
  api('finishPomodoroSession', []),
  api('setRecMode', ['feed'], 'api-setRecMode-feed-2'),
  api('setRecMode', ['heatmap'], 'api-setRecMode-heatmap-2'),
  // 소통 탭: 동반자 레이더(옮긴 함수) — 빈 레이더 · 접기 · 동반자 1명 넣고 다시 그리기 · 상호작용 · DM · 응원 · 새로고침 · 동반자 찾기
  ['enter-comm', { tab: 'comm' }],
  api('renderRadar', []), api('toggleRadarCollapse', []), api('toggleRadarCollapse', [], 'api-toggleRadarCollapse-2'),
  js('seed-companion', "var p=state.profile;p.companions=(p.companions||[]).concat([{id:'peer_dom_1',name:'비교동반자',goal:'아침 달리기',avatar:'🏃'}]);window.OurgoalSanctuaryV3.renderRadar();return p.companions.length;"),
  api('openPeerInteraction', ['peer_dom_1']), ['tidy-peer', { tidy: true }],
  ['enter-comm-2', { tab: 'comm' }],
  api('openPeerDm', ['비교동반자', '아침 달리기']), ['enter-comm-3', { tab: 'comm' }],
  js('cheer-post', "var b=document.createElement('button');document.body.appendChild(b);window.OurgoalSanctuaryV3.cheerPost(b,'👏');var r=b.className;b.remove();return r;"),
  js('refresh-radar', "var b=document.querySelector('.s-radar-refresh-btn');window.OurgoalSanctuaryV3.refreshRadar(b||null);return new Promise(function(r){setTimeout(function(){r(!!b);},600);});"),
  api('gotoCompanions', []),
  // 라우터·설정·홈(원본) 대조
  api('render', ['records'], 'render-records'), api('render', ['calendar'], 'render-calendar'), api('render', ['comm'], 'render-comm'),
  ['enter-settings', { tab: 'settings' }],
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
    const slots = {}; ['sanctuaryHomeSlot', 'sanctuaryGoalsView', 'sanctuaryCalendarView', 'sanctuaryRecordsView', 'sanctuaryCommView', 'sanctuarySettingsSlot'].forEach(id => { const el = document.getElementById(id); slots[id] = el ? el.innerHTML : null; });
    const cap = document.getElementById('shareCaptionInput');
    const de = document.documentElement;
    return { screenId: scr ? scr.id : null, screen: scr ? scr.outerHTML : '', modal: sheet ? sheet.innerHTML : null, modalOverlay: mo ? (mo.className + '|' + (mo.style.display || '')) : null,
      dialogs, slots, caption: cap ? (cap.value + '|' + (cap.getAttribute('placeholder') || '')) : null,
      theme: (de.getAttribute('data-theme') || '') + '|' + de.className + '|' + document.body.className, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null };
  });
}
const VOL = x => x == null ? x : String(x).replace(/_1[789]\d{11}\b/g, '_<ms>').replace(/https?:\/\/127\.0\.0\.1:\d+/g, '<origin>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
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
  const loaded = await page.evaluate(() => ({ kit: Object.keys(window.OurgoalSanctuaryV3Kit || {}).join(','), api: Object.keys(window.OurgoalSanctuaryV3 || {}).length, theme: document.documentElement.getAttribute('data-theme') }));
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (act.tab) {
      const r = await goTab(page, act.tab); note = 'tab:' + (r.ok ? 'ok' : 'fail ' + r.note);
    } else if (act.click) {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act.click);
    } else if (act.api) {
      note = await page.evaluate(async (nm, args) => {
        const o = window.OurgoalSanctuaryV3; const fn = o && o[nm]; if (typeof fn !== 'function') return 'missing:' + typeof fn;
        try { const r = await fn.apply(o, args); return 'ret:' + JSON.stringify(r === undefined ? '<undefined>' : r).slice(0, 3000); } catch (e) { return 'threw:' + String(e).slice(0, 160); }
      }, act.api, act.args);
      note = VOL(note);
    } else if (act.js) {
      note = await page.evaluate(async (code) => { try { const r = await (new Function(code))(); return 'ret:' + JSON.stringify(r === undefined ? '<undefined>' : r).slice(0, 3000); } catch (e) { return 'threw:' + String(e).slice(0, 160); } }, act.js);
      note = VOL(note);
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
    steps.push({ name, note, screenId: snap.screenId, screenHash: H(scr), screenLen: scr.length, slots: Object.fromEntries(Object.entries(snap.slots).map(([k, v]) => [k, H(VOL(v))])), modal: VOL(snap.modal), modalOverlay: snap.modalOverlay, dialogs: snap.dialogs.map(VOL),
      caption: VOL(snap.caption), theme: snap.theme, ls: normLs(snap.ls), toast: VOL(snap.toast), newErrors: errors.slice(errBefore), newDialogs: dialogs.slice(dlgBefore), _screen: scr });
  }
  await browser.close(); s.close();
  return { label, bootNotes, loaded, steps, errors };
}
const FIELDS = ['note', 'screenId', 'screenHash', 'screenLen', 'slots', 'modal', 'modalOverlay', 'dialogs', 'caption', 'theme', 'ls', 'toast', 'newErrors', 'newDialogs'];
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
