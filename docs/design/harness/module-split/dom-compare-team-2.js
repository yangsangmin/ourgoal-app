'use strict';
// 팀 세포 쪼개기 2차(#TASK-ES-387) DOM·저장값·토스트 전후 비교(1차 dom-compare-team.js 와 같은 틀, 단계만 2차 묶음). dom-compare-records.js 와 같은 방식:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 모달(#modalSheet)·소통 화면·localStorage·토스트·확인창·콘솔 오류를 기록해 맞댄다.
// 2차로 옮긴 묶음(동반자 탭·검색 바·프로필 모달·DM 화면·수신함·팀 톡방·추천 템플릿·자동 생성 핸들러 5개)을
// 화면이 부르는 입구(소통 탭 서브탭 버튼, window.OurgoalTeamInviteComm.<함수>, window.handle…)로 열고 안의 버튼을 차례로 누른다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-team-2.js <baseApp> <afterApp> <out.json> [--twice-base]
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
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const POST = { id: 'post_cmp_1', name: '비교동료', goal: '아침 달리기', action: '5km 달리기 완료', recordText: '오늘도 완주' };
const USER = { id: 'user_cmp_1', nickname: '비교유저', avatar: '🙂' };
// 단계: [이름, 페이지 안에서 할 일(문자열 = 클릭할 선택자, 함수 = evaluate)]
const call = (fn, args) => ({ call: fn, args });
const STEPS = [
  ['enter-comm', null],
  // 동반자 탭: renderCommTopInviteSearch(상단 바) + renderCommCompanions
  ['sub-companion', '#commBody [data-sub="companion"]'],
  ['companion-search', { type: ['#companionNicknameSearchInput', '비교'], click: '#companionSearchBtn' }],
  ['companion-search-reset', '#companionSearchResetBtn'],
  ['companion-invite-link', '#btnCopyCompanionInviteLink'],
  ['companion-view-profile-first', '#commBody [data-viewprof]'],
  ['profile-close', '#modalSheet #userProfCloseBtn'],
  ['profile-open', call('openUserProfileModal', [USER])],
  ['profile-add-comp', '#modalSheet #userProfAddCompBtn'],
  ['profile-open-2', call('openUserProfileModal', [USER])],
  ['profile-dm', '#modalSheet #userProfDmBtn'],
  ['back-comm', { tab: 'comm' }],
  // DM 탭: renderCommDM + 수신함 배지
  ['sub-dm', '#commBody [data-sub="dm"]'],
  ['dm-open-first', '#commBody [data-open]'],
  ['dm-type-send', { type: ['#dmInput', '비교 메시지'], click: '#dmSend' }],
  ['dm-back', '#dmBack'],
  ['dm-unread-status', { js: "var a=window.OurgoalTeamInviteComm; return JSON.stringify([a.getDmUnreadStatus(), Object.keys(a.getDmReadMap('guest')||{}).length]);" }],
  ['dm-badge-on', call('updateDmUnreadBadge', [true])],
  ['dm-badge-off', call('updateDmUnreadBadge', [false])],
  ['dm-mark-room-read', call('markDmRoomRead', ['peer_cmp_1'])],
  ['dm-render-msg', { js: "var a=window.OurgoalTeamInviteComm; return a.renderSingleDmMsg({ id: 'm1', from: 'me', text: '안녕', sentAt: '2026-10-05T01:02:03Z', deliveredAt: '2026-10-05T01:02:04Z', readAt: '2026-10-05T01:03:00Z' }) + '|' + a.renderSingleDmMsg({ id: 'm2', from: 'peer', text: '반가워' }) + '|' + a.formatDmDetailTime('2026-10-05T01:02:03Z');" }],
  ['dm-detail-toggle', { js: "if(typeof window.toggleDmMsgDetail!=='function') return 'no-fn'; var d=document.createElement('div'); d.id='cmpDetail'; d.style.display='none'; document.body.appendChild(d); window.toggleDmMsgDetail('cmpDetail'); var r=d.style.display; d.remove(); return r;" }],
  ['dm-load-incoming', { js: "var r=window.OurgoalTeamInviteComm.loadIncomingDmRooms('guest_cmp'); return r && typeof r.then==='function' ? 'promise' : String(r);" }],
  ['back-comm-2', { tab: 'comm' }],
  // 팀 톡방
  ['teamchat-open', call('openTeamChatModal', ['g0', '__MOCK_GROUPS__'])],
  ['teamchat-quick-first', '#modalSheet [data-qcidx]'],
  ['teamchat-type-send', { type: ['#modalSheet #teamChatInput', '비교 팀 메시지'], click: '#modalSheet #btnSendTeamChat' }],
  ['teamchat-close', '#modalSheet #btnCloseTeamChat'],
  ['teamchat-auto-reply', call('handlePingSentAutoReply', [{ id: 'ping_cmp_1', from: 'me', text: '찌름' }, 'g0'])],
  // 추천 템플릿
  ['tpl-preview-open', { js: "var a=window.OurgoalTeamInviteComm; var t=(window.CREATOR_TEMPLATES||[])[0]; var id=t&&t.id; if(!id&&window.OURGOAL_60_TEMPLATES&&window.OURGOAL_60_TEMPLATES.list){ var l=window.OURGOAL_60_TEMPLATES.list(); id=l&&l[0]&&l[0].id; } if(!id) return 'no-tpl'; a.openTemplatePreviewModal(id); return 'opened:'+id;" }],
  ['tpl-preview-gift', '#modalSheet #tplPreviewGiftBtn'],
  ['tpl-recom-close', '#modalSheet #closeRecomModalBtn'],
  ['tpl-preview-open-2', { js: "var a=window.OurgoalTeamInviteComm; var t=(window.CREATOR_TEMPLATES||[])[0]; if(!t) return 'no-tpl'; a.openTemplatePreviewModal(t.id); return 'opened';" }],
  ['tpl-preview-close', '#modalSheet #tplPreviewCloseBtn'],
  ['tpl-accordion-off', { js: "return JSON.stringify(window.OurgoalTeamInviteComm.renderTemplatesAccordionHtml());" }],
  ['tpl-accordion-legacy', { js: "window.__FORCE_LEGACY_TPL_ACCORDION=true; var d=document.createElement('div'); d.id='cmpTplAcc'; document.getElementById('commBody').appendChild(d); d.innerHTML=window.OurgoalTeamInviteComm.renderTemplatesAccordionHtml(); window.OurgoalTeamInviteComm.wireTemplatesAccordionEvents(d, function(){ d.setAttribute('data-rerendered','1'); }); return String(d.innerHTML.length);" }],
  ['tpl-accordion-toggle', '#cmpTplAcc #toggleTemplatesBtn'],
  ['tpl-accordion-cat', '#cmpTplAcc [data-tmplcat]'],
  ['tpl-accordion-preview-first', '#cmpTplAcc [data-preview-tmpl]'],
  ['tpl-accordion-cleanup', { js: "window.__FORCE_LEGACY_TPL_ACCORDION=false; if(window.closeModal) window.closeModal(); var d=document.getElementById('cmpTplAcc'); if(d) d.remove(); return 'ok';" }],
  // 자동 생성 직통 핸들러 5개(화면의 버튼이 부르는 window 이름 그대로)
  ['auto-25', { js: "return window.handle팀목표_Item25Action ? (window.handle팀목표_Item25Action(null), 'called') : 'no-fn';" }],
  ['auto-28', { js: "return window.handle소통_Item28Action ? (window.handle소통_Item28Action(null), 'called') : 'no-fn';" }],
  ['auto-30', { js: "return window.handle소통_Item30Action ? (window.handle소통_Item30Action(null), 'called') : 'no-fn';" }],
  ['auto-37', { js: "return window.handle팀목표_Item37Action ? (window.handle팀목표_Item37Action(null), 'called') : 'no-fn';" }],
  ['auto-39', { js: "return window.handle팀목표_Item39Action ? (window.handle팀목표_Item39Action(null), 'called') : 'no-fn';" }],
  ['comm-rerender', { tab: 'comm' }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const sheet = document.getElementById('modalSheet');
    const ov = document.getElementById('modalOverlay');
    const scr = document.getElementById('screen-comm');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const confirmEls = Array.from(document.querySelectorAll('[class*="confirm"],[id*="confirm"],[id*="Confirm"]')).filter(e => e.offsetParent !== null).map(e => (e.id || e.className) + '|' + e.textContent.trim().slice(0, 120));
    const st = window.state || {};
    return { modal: sheet ? sheet.innerHTML : null, overlay: ov ? (ov.className + '|' + (ov.style.display || '')) : null,
      comm: scr ? scr.outerHTML : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      confirm: confirmEls, activeScreen: (document.querySelector('.screen.active') || {}).id || null,
      feedCache: Array.isArray(window.FEED_POSTS_CACHE) ? window.FEED_POSTS_CACHE.length : null,
      goalsSubTab: st.goalsSubTab || null,
      api: window.OurgoalTeamInviteComm ? Object.keys(window.OurgoalTeamInviteComm).join(',') : null };
  });
}
const VOL = x => x == null ? x : String(x).replace(/https?:\/\/127\.0\.0\.1:\d+/g, '<origin>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>').replace(/\b1[789]\d{8}\b/g, '<s>')
  .replace(/tchat_\d+_[a-z0-9]+/g, 'tchat_<id>') // 팀 톡방 메시지 id(시각_난수) — 2차 추가
  .replace(/(post|ping|msg|reply|comp|g|grp|team)_[0-9a-z]{6,}/g, '$1_<id>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
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
  const nav = await goTab(page, 'comm');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.call) {
      note = await page.evaluate((fn, args) => {
        const api = window.OurgoalTeamInviteComm; if (!api || typeof api[fn] !== 'function') return 'no-fn';
        const real = args.map(a => a === '__MOCK_GROUPS__' ? (typeof MOCK_GROUPS !== 'undefined' ? MOCK_GROUPS : (window.MOCK_GROUPS || [])) : a);
        try { const r = api[fn].apply(api, real); if (r && typeof r.then === 'function') r.catch(() => {}); return 'called'; } catch (e) { return 'threw:' + String(e).slice(0, 80); }
      }, act.call, act.args);
    } else if (act && act.type) {
      note = await page.evaluate((sel, val, btn) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); const b = document.querySelector(btn); if (!b) return 'typed-no-btn'; b.click(); return 'typed-clicked'; }, act.type[0], act.type[1], act.click);
    } else if (act && act.js) {
      note = await page.evaluate(src => { try { const r = new Function(src)(); return 'js:' + String(r).slice(0, 4000); } catch (e) { return 'js-threw:' + String(e).slice(0, 120); } }, act.js);
      note = VOL(note);
    } else if (act && act.tab) {
      await goTab(page, 'home'); await goTab(page, act.tab); note = 'roundtrip';
    } else if (act && (act.confirmOk || act.confirmCancel)) {
      note = await page.evaluate(ok => {
        const vis = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null);
        const want = ok ? /^(확인|게시|네|예|OK)/ : /^(취소|아니요|닫기)/;
        const b = vis.reverse().find(x => want.test(x.textContent.trim())); if (!b) return 'no-btn';
        b.click(); return 'clicked:' + b.textContent.trim().slice(0, 10);
      }, !!act.confirmOk);
    }
    await sleep(1100);
    const snap = await snapshot(page);
    steps.push({ name, note, modal: VOL(snap.modal), overlay: snap.overlay, comm: VOL(snap.comm), ls: normLs(snap.ls), toast: VOL(snap.toast), confirm: snap.confirm.map(VOL),
      activeScreen: snap.activeScreen, feedCache: snap.feedCache, goalsSubTab: snap.goalsSubTab, api: snap.api, newErrors: errors.slice(errBefore), newDialogs: dialogs.slice(dlgBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
const FIELDS = ['note', 'modal', 'overlay', 'comm', 'ls', 'toast', 'confirm', 'activeScreen', 'feedCache', 'goalsSubTab', 'api', 'newErrors', 'newDialogs'];
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
    modalBytes: ra.steps.map(s => (s.modal || '').length),
    comparedValues: ra.steps.length * FIELDS.length, differing: diffs.length, diffs,
    baseVsBase: noise ? { differing: noise.length, diffs: noise } : null,
    errorsBase: ra.errors, errorsAfter: rb.errors, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedValues, 'differing', diffs.length, noise ? 'base-vs-base ' + noise.length : '', 'errors base/after', ra.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 700));
  process.exitCode = diffs.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
