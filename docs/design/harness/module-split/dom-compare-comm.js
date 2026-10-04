'use strict';
// 소통 탭 이전 1차(#TASK-ES-379) DOM·저장값·토스트 전후 비교. 목표 탭 2차 dom-compare-goals-2.js(#TASK-ES-375)를 복제했다:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 #screen-comm 의 HTML·모달·소통 상태·localStorage·토스트·콘솔 오류를 기록해 맞댄다.
// 단계는 이번에 옮긴 함수가 그리고 잇는 곳을 차례로 누른다: 소통 메인 렌더(renderCommScreen — 요약 카드 숫자·서브탭 칩 6개·서브탭 분기, DM·동반자 위임 renderCommDM·renderCommCompanions),
// 피드 화면(renderCommFeed — 이번에는 옮기지 않았다)이 부르는 댓글·리액션 헬퍼(getFeedComments·setFeedComments·handleUserCommentSubmit·toggleFeedReaction·loadServerFeedComments)
// — 응원·반응 종류·댓글 펼치기·빈 댓글·댓글 등록·빠른 답글·댓글 삭제(확인창 거절·수락), 그리고 피드 화면의 나머지 단추(프로필·DM·동반자·신고·차단·공유·템플릿)도 같이 누른다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-comm.js <baseApp> <afterApp> <out.json>
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
// 단계: [이름, 할 일, 더 기다릴 ms]
const FEED = { evalFn: "(function(){ var t = document.querySelector('#commBody [data-sub=\"feed\"]'); if(!t) return 'missing'; t.click(); return 'feed'; })()" };
// 공용 확인창(ui.confirm 바텀시트)이 떠 있으면 단추를 누른다 — which: 'ok' | 'cancel'. 시트가 없으면(기본 확인창 경로) 'no-sheet'
const SHEET = which => ({ evalFn: "(function(){ var root = document.querySelector('#modalOverlay.active'); if(!root) return 'no-sheet'; var bs = Array.prototype.slice.call(root.querySelectorAll('button')); var want = " + JSON.stringify(which) + "; var b = bs.filter(function(x){ var t = (x.textContent||'').trim(); return want === 'ok' ? /^(확인|삭제|진행|예|네|차단)/.test(t) : /^(취소|아니요|닫기)/.test(t); })[0]; if(!b) return 'no-sheet'; b.click(); return want + ':' + (b.textContent||'').trim().slice(0,8); })()" });
const STEPS = [
  ['enter', null],
  ['sub-feed', '#commBody [data-sub="feed"]'],
  ['feedcat-1', { nth: ['#commSubBody [data-feedcat]', 1] }],
  ['feedcat-0', { nth: ['#commSubBody [data-feedcat]', 0] }],
  ['feedtype-1', { nth: ['#commSubBody [data-feedtype]', 1] }],
  ['feedtype-0', { nth: ['#commSubBody [data-feedtype]', 0] }],
  // 반응 단추: js/reactions.js(OurgoalReactions)가 있으면 그 모듈의 4종 단추를 그리고, 없을 때만 예전 이모지 단추([data-reacttype] → toggleFeedReaction)를 그린다.
  // 옮긴 toggleFeedReaction 을 실제로 돌리려고 두 앱 모두 같은 조작으로 OurgoalReactions 를 잠시 떼었다가 되돌린다(앱 코드는 그대로).
  ['reactions-module-btn-0', { nth: ['#commSubBody .feed-react-group button', 0] }, 600],
  ['reactions-off', { evalFn: "(function(){ window.__es379rx = window.OurgoalReactions; window.OurgoalReactions = undefined; var t = document.querySelector('#commBody [data-sub=\"feed\"]'); if(t) t.click(); return 'off'; })()" }],
  ['reacttype-0', { nth: ['#commSubBody [data-reacttype]', 0] }, 600],
  ['reacttype-1', { nth: ['#commSubBody [data-reacttype]', 1] }, 600],
  ['reacttype-0-again', { nth: ['#commSubBody [data-reacttype]', 0] }, 600],
  ['reacttype-3', { nth: ['#commSubBody [data-reacttype]', 3] }, 600],
  ['reactions-on', { evalFn: "(function(){ window.OurgoalReactions = window.__es379rx; var t = document.querySelector('#commBody [data-sub=\"feed\"]'); if(t) t.click(); return 'on'; })()" }],
  ['togglecomments-0', { nth: ['#commSubBody [data-togglecomments]', 0] }],
  ['comment-empty', { nth: ['#commSubBody [data-sendcomment]', 0] }],
  ['comment-send', { fillNth: [['#commSubBody [data-cinput]', 0, '전후 비교 댓글입니다']], nth: ['#commSubBody [data-sendcomment]', 0] }],
  ['quickreply-0', { nth: ['#commSubBody [data-quickreply]', 0] }],
  ['delcomment-0', { nth: ['#commSubBody [data-delcomment]', 0], dialog: 'dismiss' }],
  ['delcomment-0-sheet-cancel', SHEET('cancel')],
  ['delcomment-0-again', { nth: ['#commSubBody [data-delcomment]', 0], dialog: 'accept' }],
  ['delcomment-0-sheet-ok', SHEET('ok')],
  ['close-modal-0', { closeModal: true }],
  ['feedprof-0', { nth: ['#commSubBody [data-feedprof]', 0] }],
  ['close-modal-1', { closeModal: true }],
  ['feeddm-0', { nth: ['#commSubBody [data-feeddm]', 0] }],
  ['back-feed-1', FEED],
  ['feedcomp-0', { nth: ['#commSubBody [data-feedcomp]', 0] }],
  ['close-modal-2', { closeModal: true }],
  ['back-feed-2', FEED],
  ['reportpost-0', { nth: ['#commSubBody [data-reportpost]', 0] }],
  ['reportpost-sheet-cancel', SHEET('cancel')],
  ['close-modal-3', { closeModal: true }],
  ['blockuser-0', { nth: ['#commSubBody [data-blockuser]', 0], dialog: 'dismiss' }],
  ['blockuser-sheet-cancel', SHEET('cancel')],
  ['close-modal-4', { closeModal: true }],
  ['sharefeed-0', { nth: ['#commSubBody [data-sharefeed]', 0] }],
  ['close-modal-5', { closeModal: true }],
  ['feedscout-0', { nth: ['#commSubBody [data-feedscout]', 0] }],
  ['close-modal-6', { closeModal: true }],
  ['back-feed-3', FEED],
  ['tmpl-0', { nth: ['#commSubBody [data-tmpl]', 0] }],
  ['close-modal-7', { closeModal: true }],
  ['back-feed-4', FEED],
  ['sub-group', '#commBody [data-sub="group"]'],
  ['sub-companion', '#commBody [data-sub="companion"]'],
  ['sub-dm', '#commBody [data-sub="dm"]'],
  ['sub-manito', '#commBody [data-sub="manito"]'],
  ['sub-share', '#commBody [data-sub="share"]'],
  ['sub-feed-2', '#commBody [data-sub="feed"]'],
  ['tab-roundtrip', { tabRoundTrip: true }],
];
async function snapshot(page) {
  return page.evaluate(() => {
    const scr = document.getElementById('screen-comm');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    const reg = window.OurgoalRegistry ? { mega: window.OurgoalRegistry.listMegaBlocks().find(b => b.id === 'comm'), errors: window.OurgoalRegistry.getErrorLog().length } : null;
    const subs = window.OurgoalEvents && window.OurgoalEvents.subscriptions ? window.OurgoalEvents.subscriptions().filter(s => s.owner && s.owner.indexOf('comm/') === 0).map(s => s.event + '|' + s.owner) : null;
    const st = window.state || null;
    const pick = o => o == null ? null : JSON.stringify(o);
    const set = st && st.profile && st.profile.settings;
    return { html: scr ? scr.outerHTML : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      cal: st ? { activeTab: st.activeTab || null, commSubTab: st.commSubTab || null, feedCategory: st.feedCategory || null, commFeedType: st.commFeedType || null, expandedComments: pick(st.expandedComments), templatesExpanded: pick(st.templatesExpanded),
        activeGroupId: st.activeGroupId || null, dmActiveId: st.dmActiveId || null, manitoDm: pick(st.manitoDm), activeDmPeer: st.activeDmPeer || null,
        feedComments: set ? pick(set.feedComments) : null, feedReactions: set ? pick(set.feedReactions) : null, contentReports: set ? pick(set.contentReports) : null } : null,
      activeScreen: (document.querySelector('.screen.active') || {}).id || null, reg, subs,
      // 옮긴 함수 이름이 window 에 새로 달리지 않았는가(이전 전에도 undefined 여야 같다)
      globals: { renderCommScreen: typeof window.renderCommScreen, renderCommDM: typeof window.renderCommDM, renderCommCompanions: typeof window.renderCommCompanions, getFeedComments: typeof window.getFeedComments, setFeedComments: typeof window.setFeedComments, handleUserCommentSubmit: typeof window.handleUserCommentSubmit, toggleFeedReaction: typeof window.toggleFeedReaction, loadServerFeedComments: typeof window.loadServerFeedComments, SERVER_FEED_COMMENTS_CACHE: typeof window.SERVER_FEED_COMMENTS_CACHE },
      blobs: [],
      // 소통 키트(window.OurgoalCommKit)는 이번 이전이 만든 키트 객체다(목표 OurgoalGoalsKit 과 같은 틀) — 맞대지 않고 따로 적는다
      kit: typeof window.OurgoalCommKit };
  });
}
const VOL = x => x == null ? x : String(x).replace(/data:image\/png;base64,[A-Za-z0-9+\/=]+/g, () => 'data:image/png;<canvas>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(ms|t|task|g|goal|fc|qr|c)_[a-z0-9]{8,}/g, '$1_<uid>') // uid()·newId() = 시각+난수(댓글 등록이 만든 fc_ id 등)
  // 기록 입력 창의 datetime-local 기본값(분 단위 지금 시각)·마니또 미리보기 익명 이름(난수) — 같은 기준 앱 2회 실행에서도 달랐다(#TASK-ES-379 실측)
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d(?![:\d])/g, '<dtl>').replace(/(mnPreviewName\\*"?>)[^<]+/g, '$1<anon>');
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; } return x; }
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    // 객체 키는 정렬해 적는다: 오늘의 미션 캐시처럼 비동기 응답이 도착한 순서대로 키가 쌓이는 값은 실행마다 키 순서가 달라진다(같은 앱 2회 실행에서도 — 아래 base-vs-base 로 확인)
    try { const j = JSON.parse(v); val = JSON.stringify(sortKeys(j), (key, x) => key === 'bonusCraftCredits' ? undefined : (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string') ? '<hash>' : x); } catch (e) {}
    // bonusCraftCredits(js/avatar-system.js 가 기본값을 채우는 설정 칸)는 첫 저장 전에는 부팅 속도에 따라 저장값에 있기도 없기도 하다 — 같은 기준 앱 2회 실행에서 처음 7단계가 달랐다(#TASK-ES-375 실측). 옮긴 코드와 무관한 칸이라 뺀다.
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
  // 확인창: 기본은 거절(1차와 같음). 단계가 dialog:'accept' 를 주면 그 단계만 수락한다. 뜬 확인창 글자는 단계 기록에 남긴다.
  let dialogMode = 'dismiss'; const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message()); (dialogMode === 'accept' ? d.accept() : d.dismiss()).catch(() => {}); });
  // 내보내기 파일 내용: download() 가 만드는 Blob 의 글자를 적어 둔다(파일 이름·형식·내용 비교용). Blob 자체는 원래 생성자로 만든다.
  await page.evaluateOnNewDocument(() => {
    const OB = window.Blob; window.__es379blobs = [];
    const W = function (parts, opts) { try { window.__es379blobs.push((opts && opts.type || '') + '|' + (parts || []).map(p => typeof p === 'string' ? p : '[bin]').join('')); } catch (e) {} return new OB(parts, opts); };
    W.prototype = OB.prototype; window.Blob = W;
    const OA = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { (window.__es379blobs = window.__es379blobs || []).push('download|' + this.download); return; } return OA.apply(this, arguments); };
  });
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await boot(page);
  const nav = await goTab(page, 'comm');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    const extra = STEPS.find(x => x[0] === name)[2] || 0;
    dialogMode = (act && act.dialog) || 'dismiss';
    // shots-lib 게스트 시드는 window.confirm 을 늘 true 로 바꿔 둔다. 이 단계에서만 확인창 답을 정하고 물은 글자를 적는다(두 앱 같은 조작).
    if (act && act.dialog) await page.evaluate(mode => { window.confirm = function (m) { (window.__es379dlg = window.__es379dlg || []).push('confirm|' + m); return mode === 'accept'; }; }, act.dialog);
    if (act && act.fill) {
      note = await page.evaluate((pairs) => pairs.map(([sel, v]) => { const el = document.querySelector(sel); if (!el) return 'missing:' + sel; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 'set'; }).join(','), act.fill);
    }
    if (act && act.fillNth) {
      note = await page.evaluate((triples) => triples.map(([sel, i, v]) => { const el = document.querySelectorAll(sel)[i]; if (!el) return 'missing:' + sel; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); return 'set'; }).join(','), act.fillNth) + ';';
    }
    if (act && act.click) {
      note += (note ? ';' : '') + await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act.click);
    } else if (act && act.evalFn) {
      note = await page.evaluate(act.evalFn);
    } else if (act && act.goTab) {
      // 탭 버튼 진짜 누름이 막히면(보관 직후 기록 탭 위 겹침 등) 앱의 setTab 으로 옮긴다 — 두 앱 같은 조작, 어느 쪽으로 갔는지 note 에 남긴다
      const r = await goTab(page, act.goTab);
      note = 'tab:' + act.goTab + ':' + (r.ok ? 'click' : await page.evaluate(t => { if (typeof window.setTab !== 'function') return 'no-setTab'; window.setTab(t); return 'setTab'; }, act.goTab));
    } else if (act && act.nth) {
      note += await page.evaluate(([sel, i]) => { const el = document.querySelectorAll(sel)[i]; if (!el) return 'missing'; el.click(); return 'clicked:' + (el.textContent.trim().slice(0, 10)); }, act.nth);
    } else if (act && act.fill) {
      // 채우기만
    } else if (act && typeof act === 'string') {
      note = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act);
    } else if (act && act.nth) {
      note = await page.evaluate(([sel, i]) => { const el = document.querySelectorAll(sel)[i]; if (!el) return 'missing'; el.click(); return 'clicked:' + (el.textContent.trim().slice(0, 10)); }, act.nth);
    } else if (act && act.closeModal) {
      note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    } else if (act && act.setInput) {
      note = await page.evaluate(([sel, v]) => { const el = document.querySelector(sel); if (!el) return 'missing'; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); return 'changed'; }, act.setInput);
    } else if (act && act.tabRoundTrip) {
      await goTab(page, 'home'); await goTab(page, 'comm'); note = 'roundtrip';
    } else if (act && act.rerender) {
      note = await page.evaluate(() => { if (typeof window.renderGoalsScreen !== 'function') return 'no-fn'; window.renderGoalsScreen(); return 'called'; });
    }
    await sleep(900 + extra);
    const snap = await snapshot(page);
    const stubDialogs = await page.evaluate(() => (window.__es379dlg || []).splice(0));
    if (act && act.dialog) await page.evaluate(() => { window.confirm = () => true; });
    steps.push({ name, note, dialogs: dialogs.slice(dlgBefore).concat(stubDialogs), blobs: (snap.blobs || []).map(VOL), html: VOL(snap.html), modal: VOL(snap.modal), cal: snap.cal ? JSON.parse(VOL(JSON.stringify(snap.cal))) : null, ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, reg: snap.reg, subs: snap.subs, globals: snap.globals, kit: snap.kit, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, nav, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  // 같은 기준 앱을 두 번 돌려(본질적 변동 확인) 이전 후 앱과 맞댄다
  const ra = await run(A, 'base'), ra2 = await run(A, 'base-2'), rb = await run(B, 'after');
  const FIELDS = ['note', 'dialogs', 'blobs', 'html', 'modal', 'cal', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors', 'reg', 'subs'];
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
    comparedFields: ra.steps.length * FIELDS.length,
    // 단계별 요지(이전 후 실행): 토스트·확인창·내보낸 파일(앞 160자와 길이)·새 콘솔 오류 — 무엇을 맞댔는지 보이게 남긴다
    digestAfter: rb.steps.map(s => ({ step: s.name, toast: s.toast, dialogs: s.dialogs, blobs: (s.blobs || []).map(b => ({ len: b.length, head: b.slice(0, 160) })), activeScreen: s.activeScreen, newErrors: s.newErrors })), differing: diffs.length, diffs, baseVsBaseDiffering: baseVsBase.length, baseVsBase, errorsBase2: ra2.errors, errorsBase: ra.errors, errorsAfter: rb.errors, kitBase: ra.steps[0].kit, kitAfter: rb.steps[0].kit, navBase: ra.nav, navAfter: rb.nav };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'base-vs-base differing', baseVsBase.length, 'errors base/base2/after', ra.errors.length, ra2.errors.length, rb.errors.length);
  console.log(summary.notes.join(' · '));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
})().catch(e => { console.error(e); process.exitCode = 1; });
