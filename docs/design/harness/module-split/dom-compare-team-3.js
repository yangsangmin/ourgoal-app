'use strict';
// 팀 세포 쪼개기 3차(#TASK-ES-402) DOM·저장값·토스트 전후 비교(2차 dom-compare-team-2.js 와 같은 틀, 단계만 3차 묶음):
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 모달(#modalSheet)·목표 화면(#screen-goals)·localStorage·토스트·확인창·콘솔 오류를 기록해 맞댄다.
// 3차로 옮긴 묶음 — 수준별 조 상세 모달(openLevelGroupDetailModal) · 팀원 점검 모달 2개(openLeaderStampSelectModal·openMemberProgressDetailModal) ·
// 팀 연계 워크스페이스 화면(renderTeamLinkedGoalsScreen) — 을 화면의 입구(목표 탭 서브탭 버튼, 팀 카드·대시보드·모달 안 버튼)로 열고 안의 버튼을 차례로 누른다.
// 게스트는 처음에 팀이 없어 [체험 팀 시작](#tgQuickJoinSampleBtn)으로 들어가고, 팀장 대시보드는 그 팀의 내 역할을 owner 로 바꿔(양쪽 같은 조작) 그린다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-team-3.js <baseApp> <afterApp> <out.json> [--twice-base]
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
const GID = "var c=document.querySelector('#teamGoalsView [data-teamid]'); var gid=c&&c.getAttribute('data-teamid');";
// 단계: [이름, 할 일] — 문자열 = 클릭할 선택자, { input: [선택자, 값] } = 값 넣고 input·change·blur, { type, click } = 넣고 버튼, { js } = evaluate, { gsub } = 목표 서브탭, { confirmOk/confirmCancel }
const STEPS = [
  ['enter-goals', null],
  ['sub-team', { gsub: 'team' }],
  ['join-sample', '#tgQuickJoinSampleBtn'],
  // ① 수준별 조 상세 모달(openLevelGroupDetailModal — js/team-level-group-modal.js)
  ['add-level-group', '#teamGoalsView [data-addlevelgroup]'],
  ['add-level-group-save', { type: ['#modalSheet #newLgNameInput', '비교 새 조'], click: '#modalSheet #saveNewLgBtn' }],
  ['open-level-detail', '#teamGoalsView [data-openleveldetail]'],
  ['lg-add-goal', '#modalSheet #modalAddLgGoalBtn'],
  ['lg-add-ms', '#modalSheet [data-lgaddms]'],
  ['lg-add-task', '#modalSheet [data-lgaddtask]'],
  ['lg-toggle-task', '#modalSheet [data-lgtoggletask]'],
  ['lg-cycle-status', '#modalSheet [data-lgcyclestatus]'],
  ['lg-cycle-prio', '#modalSheet [data-lgcyclestatusprio]'],
  ['lg-goal-title', { input: ['#modalSheet [data-lggoaltitle]', '비교 수준 목표'] }],
  ['lg-goal-due', { input: ['#modalSheet [data-lggoaldue]', '2026-12-31'] }],
  ['lg-ms-title', { input: ['#modalSheet [data-lgmtitle]', '비교 마일스톤'] }],
  ['lg-task-title', { input: ['#modalSheet [data-lgtasktitle]', '비교 할 일'] }],
  ['lg-name-save', { type: ['#modalSheet #modalLgNameInput', '비교 조'], click: '#modalSheet #modalSaveLgNameBtn' }],
  ['open-level-detail-2', '#teamGoalsView [data-openleveldetail]'],
  ['lg-del-task', '#modalSheet [data-lgdeltask]'],
  ['lg-del-task-ok', { confirmOk: true }],
  ['lg-del-ms', '#modalSheet [data-lgdelms]'],
  ['lg-del-ms-ok', { confirmOk: true }],
  ['lg-close', '#modalSheet #modalCloseLgBtn'],
  // 목표별 수준관리(tgid 경로)
  ['level-mode-goal', '#teamGoalsView [data-tglevelmode$=":goal"]'],
  ['copy-team-levels', '#teamGoalsView [data-tgcopyteamlevels]'],
  ['copy-team-levels-ok', { confirmOk: true }],
  ['open-level-detail-goal', '#teamGoalsView [data-openleveldetail]'],
  ['lg-goal-add-goal', '#modalSheet #modalAddLgGoalBtn'],
  ['lg-goal-del-goal', '#modalSheet [data-lgdelgoal]'],
  ['lg-goal-del-goal-ok', { confirmOk: true }],
  ['lg-goal-close', '#modalSheet #modalCloseLgBtn'],
  ['level-mode-team', '#teamGoalsView [data-tglevelmode$=":team"]'],
  ['open-level-detail-3', '#teamGoalsView [data-openleveldetail]'],
  ['lg-delete-group', '#modalSheet #modalDelLgBtn'],
  ['lg-delete-group-cancel', { confirmCancel: true }],
  ['open-level-detail-4', '#teamGoalsView [data-openleveldetail]'],
  ['lg-delete-group-2', '#modalSheet #modalDelLgBtn'],
  ['lg-delete-group-ok', { confirmOk: true }],
  ['lg-api-direct', { js: GID + " if(!gid) return 'no-gid'; window.OurgoalTeamVisibilityLevels.openLevelGroupDetailModal(gid, 'no_such_lg'); return 'called:' + typeof window.OurgoalTeamVisibilityLevels.openLevelGroupDetailModal;" }],
  // ② 팀장 점검 모달 2개(js/team-member-review.js) — 이 팀의 내 역할을 owner 로(양쪽 같은 조작)
  ['make-owner', { js: GID + " if(!gid) return 'no-gid'; var gs = window.groupState ? window.groupState(gid) : null; if(!gs) return 'no-groupState'; gs.myRole='owner'; return 'owner:' + gid;" }],
  ['sub-team-owner', { gsub: 'team' }],
  ['stamp-member', '#teamGoalsView [data-stampmember]'],
  ['stamp-select', '#modalSheet [data-selectstamp]'],
  ['stamp-member-2', '#teamGoalsView [data-stampmember]'],
  ['stamp-close', '#modalSheet #closeStampModalBtn'],
  ['detail-member', '#teamGoalsView [data-detailmember]'],
  ['detail-feedback', { type: ['#modalSheet #leaderFbInput', '비교 피드백'], click: '#modalSheet #sendLeaderFbBtn' }],
  ['detail-member-2', '#teamGoalsView [data-detailmember]'],
  ['detail-stamp', '#modalSheet #btnStampInDetail'],
  ['detail-stamp-select', '#modalSheet [data-selectstamp]'],
  ['detail-member-3', '#teamGoalsView [data-detailmember]'],
  ['detail-nudge', '#modalSheet #btnNudgeMemberInDetail'],
  ['detail-member-4', '#teamGoalsView [data-detailmember]'],
  ['detail-add-companion', '#modalSheet #btnAddCompanionInDetail'],
  ['detail-member-5', '#teamGoalsView [data-detailmember]'],
  ['detail-close', '#modalSheet #closeDetailModalBtn'],
  ['detail-member-6', '#teamGoalsView [data-detailmember]'],
  ['detail-dm', '#modalSheet #btnDmMemberInDetail'],
  ['back-goals-team', { tabThenGsub: 'team' }],
  ['make-member', { js: GID + " if(!gid) return 'no-gid'; window.groupState(gid).myRole='member'; return 'member';" }],
  ['sub-team-member', { gsub: 'team' }],
  // ③ 팀 연계 워크스페이스 화면(renderTeamLinkedGoalsScreen — js/team-linked-goals-screen.js)
  ['sub-team-linked-empty', { gsub: 'teamLinked' }],
  ['tl-explore-empty', '#teamLinkedGoalsView #btnGoToTeamGoalsExplore'],
  ['sub-team-2', { gsub: 'team' }],
  ['copy-team-goal', '#teamGoalsView [data-copyteamgoal]'],
  ['sub-team-linked', { gsub: 'teamLinked' }],
  ['tl-chip', '#teamLinkedGoalsView [data-tlchip]'],
  ['tl-toggle-task', '#teamLinkedGoalsView [data-tltoggletask]'],
  ['tl-cycle-ms', '#teamLinkedGoalsView [data-tlcyclems]'],
  ['tl-toggle-edit', '#teamLinkedGoalsView #btnToggleTlEdit'],
  ['tl-goal-title', { input: ['#teamLinkedGoalsView #tlGoalTitleInput', '비교 연계 목표'] }],
  ['tl-ms-title', { input: ['#teamLinkedGoalsView [data-tlmstitle]', '비교 연계 마일스톤'] }],
  ['tl-task-title', { input: ['#teamLinkedGoalsView [data-tltasktitle]', '비교 연계 할 일'] }],
  ['tl-add-task', { type: ['#teamLinkedGoalsView [data-tlminput]', '비교 새 할 일'], click: '#teamLinkedGoalsView [data-tladdtask]' }],
  ['tl-add-ms', '#teamLinkedGoalsView #btnAddTlMs'],
  ['tl-del-task', '#teamLinkedGoalsView [data-tldeltask]'],
  ['tl-del-task-ok', { confirmOk: true }],
  ['tl-ms-del', '#teamLinkedGoalsView [data-tlmsdel]'],
  ['tl-ms-del-ok', { confirmOk: true }],
  ['tl-done-inline', '#teamLinkedGoalsView #btnTlDoneInline'],
  ['tl-explore-more', '#teamLinkedGoalsView #btnExploreMoreTeamGoals'],
  ['sub-team-linked-2', { gsub: 'teamLinked' }],
  ['tl-go-origin', '#teamLinkedGoalsView #btnGoToTeamOrigin'],
  ['sub-team-linked-3', { gsub: 'teamLinked' }],
  ['tl-toggle-edit-2', '#teamLinkedGoalsView #btnToggleTlEdit'],
  ['tl-delete-goal', '#teamLinkedGoalsView #btnDeleteTlGoal'],
  ['tl-delete-goal-cancel', { confirmCancel: true }],
  ['tl-delete-goal-2', '#teamLinkedGoalsView #btnDeleteTlGoal'],
  ['tl-delete-goal-ok', { confirmOk: true }],
  ['tl-api-direct', { js: "var v=document.createElement('div'); v.id='cmpTlView'; document.body.appendChild(v); window.OurgoalTeamLinkedGoals.renderTeamLinkedGoalsScreen(v); var h=v.innerHTML; v.remove(); return h;" }],
  ['goals-rerender', { tabThenGsub: 'teamLinked' }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const sheet = document.getElementById('modalSheet');
    const ov = document.getElementById('modalOverlay');
    const scr = document.getElementById('screen-goals');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const confirmEls = Array.from(document.querySelectorAll('[class*="confirm"],[id*="confirm"],[id*="Confirm"]')).filter(e => e.offsetParent !== null).map(e => (e.id || e.className) + '|' + e.textContent.trim().slice(0, 120));
    const st = window.state || {};
    const api = ['OurgoalTeamVisibilityLevels', 'OurgoalTeamLeaderCheck', 'OurgoalTeamLinkedGoals'].map(n => n + ':' + (window[n] ? Object.keys(window[n]).join(',') : 'none')).join(' | ');
    return { modal: sheet ? sheet.innerHTML : null, overlay: ov ? (ov.className + '|' + (ov.style.display || '')) : null,
      screen: scr ? scr.outerHTML : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      confirm: confirmEls, activeScreen: (document.querySelector('.screen.active') || {}).id || null,
      goalsSubTab: st.goalsSubTab || null, api };
  });
}
const VOL = x => x == null ? x : String(x).replace(/https?:\/\/127\.0\.0\.1:\d+/g, '<origin>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>').replace(/\b1[789]\d{8}\b/g, '<s>')
  .replace(/tchat_\d+_[a-z0-9]+/g, 'tchat_<id>')
  .replace(/(post|ping|msg|reply|comp|g|grp|team|lg|tg|ms|t|task|goal|lgg|lgm|lgt|tl|tlm|tlt|m|id|l)_[0-9a-z]{6,}/g, '$1_<id>')
  .replace(/(_<id>(?:_\d+)?)_[0-9a-z]{4,6}\b/g, '$1_<rnd>') // 'goal_tl_<시각>_<난수5>'·'ms_tl_<시각>_<번호>_<난수4>' 꼴의 꼬리 난수 — 3차 추가
  .replace(/(\W)seed(\W*):\d+/g,'$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\d{1,2}:\d\d(:\d\d)?/g, '<hh:mm>').replace(/(오전|오후) ?\d{1,2}:\d\d/g, '<ampm>');
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
async function gsub(page, sub) {
  return page.evaluate(s => { const b = document.querySelector('[data-gsub="' + s + '"]'); if (!b) return 'no-sub'; b.click(); return 'gsub'; }, sub);
}
async function run(app, label) {
  const { s, base } = await serve(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
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
  const nav = await goTab(page, 'goals');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.gsub) {
      note = await gsub(page, act.gsub);
    } else if (act && act.tabThenGsub) {
      await goTab(page, 'home'); await goTab(page, 'goals'); note = await gsub(page, act.tabThenGsub);
    } else if (act && act.input) {
      note = await page.evaluate((sel, val) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.focus(); el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); return 'input'; }, act.input[0], act.input[1]);
    } else if (act && act.type) {
      note = await page.evaluate((sel, val, btn) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); const b = document.querySelector(btn); if (!b) return 'typed-no-btn'; b.click(); return 'typed-clicked'; }, act.type[0], act.type[1], act.click);
    } else if (act && act.js) {
      note = await page.evaluate(src => { try { const r = new Function(src)(); return 'js:' + String(r).slice(0, 4000); } catch (e) { return 'js-threw:' + String(e).slice(0, 120); } }, act.js);
      note = VOL(note);
    } else if (act && (act.confirmOk || act.confirmCancel)) {
      note = await page.evaluate(ok => {
        const vis = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null);
        const want = ok ? /^(확인|삭제|게시|네|예|OK|복사|덮어쓰기)/ : /^(취소|아니요|닫기)/;
        const b = vis.reverse().find(x => want.test(x.textContent.trim())); if (!b) return 'no-btn';
        b.click(); return 'clicked:' + b.textContent.trim().slice(0, 10);
      }, !!act.confirmOk);
    }
    await sleep(1100);
    const snap = await snapshot(page);
    steps.push({ name, note, modal: VOL(snap.modal), overlay: snap.overlay, screen: VOL(snap.screen), ls: normLs(snap.ls), toast: VOL(snap.toast), confirm: snap.confirm.map(VOL),
      activeScreen: snap.activeScreen, goalsSubTab: snap.goalsSubTab, api: snap.api, newErrors: errors.slice(errBefore), newDialogs: dialogs.slice(dlgBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
const FIELDS = ['note', 'modal', 'overlay', 'screen', 'ls', 'toast', 'confirm', 'activeScreen', 'goalsSubTab', 'api', 'newErrors', 'newDialogs'];
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
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ':' + s.note + '/' + rb.steps[i].note),
    stepsActed: ra.steps.filter(s => s.note && !/^(missing|no-btn|no-sub|typed-no-btn)/.test(s.note) && !/^js:no-/.test(s.note)).length,
    stepsNotActed: ra.steps.filter(s => !s.note || /^(missing|no-btn|no-sub|typed-no-btn)/.test(s.note) || /^js:no-/.test(s.note)).map(s => s.name + ':' + (s.note || 'enter')),
    modalBytes: ra.steps.map(s => (s.modal || '').length),
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
