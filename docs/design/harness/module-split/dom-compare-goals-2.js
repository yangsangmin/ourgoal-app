'use strict';
// 목표 탭 이전 2차(#TASK-ES-375) DOM·저장값·토스트·내보낸 파일 전후 비교. 1차 dom-compare-goals.js(#TASK-ES-370)를 복제했다:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 #screen-goals 의 HTML·모달·목표 상태·localStorage·토스트·콘솔 오류,
// 그리고 내보내기가 만든 파일 내용(Blob 글자)을 기록해 맞댄다.
// 단계는 이번에 옮긴 함수가 그리고 잇는 곳을 차례로 누른다: 결과 입력 모달(openResultModal — 목표·마일스톤·할 일, AI 정리·수동 입력·저장·취소·보관 버튼),
// 내보내기(exportGoalSnapshot·buildGoalSnapshot·goalSnapshotSummary — md·json 두 형식), 보관(archiveGoal — 결과 있음·확인창 거절·확인창 수락 세 경로),
// 완주 인증서(openGoalCertificateModal — 100% 달성 목표 보관).
// 목표를 다시 쓰려고 보관을 되돌리는 단계(restore)는 앱 상태를 직접 고친다 — 두 앱에 같은 조작이다.
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-goals-2.js <baseApp> <afterApp> <out.json>
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
// 단계: [이름, 할 일]
const RESTORE = { evalFn: "(function(){ var st = window.state; st.profile.goals.forEach(function(g){ g.archivedAt = null; }); st.activeGoalId = 'g1'; return 'restored'; })()" };
// 편집 모드 켜기(이미 켜져 있으면 그대로): 할 일 결과 버튼(결과가 없을 때)과 보관 버튼(#goalArchiveBtn)은 편집 모드에서만 그려진다
const EDIT_ON = { evalFn: "(function(){ if(window.state.goalEditMode) return 'already'; var b = document.getElementById('goalEditToggle'); if(!b) return 'missing'; b.click(); return 'toggled'; })()" };
const EDIT_OFF = { evalFn: "(function(){ if(!window.state.goalEditMode) return 'already'; var b = document.getElementById('goalEditToggle'); if(!b) return 'missing'; b.click(); return 'toggled'; })()" };
const STEPS = [
  ['enter', null],
  ['chip-g1', '#goalChipRow [data-chip="g1"]'],
  // 결과 입력 모달 — 목표
  ['goal-result-open', '#goalResultBtn'],
  ['rs-manual-toggle', '#modalOverlay.active #rsManualToggleBtn'],
  ['rs-manual-toggle-2', '#modalOverlay.active #rsManualToggleBtn'],
  ['rs-ai-apply-empty', '#modalOverlay.active #rsAiQuickApplyBtn'],
  ['rs-ai-fill-apply', { fill: [['#modalOverlay.active #rsAiQuickInput', '오늘 10km 1시간 달림 무릎 괜찮음']], click: '#modalOverlay.active #rsAiQuickApplyBtn' }],
  ['rs-save-goal', '#modalOverlay.active #rsSave'],
  // 결과 입력 모달 — 마일스톤(수동 입력 100% → 완료·축하). 모달 안 단추는 열린 모달(#modalOverlay.active) 안에서만 찾는다(닫힌 모달의 지난 글자를 누르지 않게)
  ['ms-result-open', { nth: ['#goalDetailBody [data-msresult]', 0] }],
  ['rs-manual-save-ms', { fill: [['#modalOverlay.active #rsManualTitle', '첫 10km 완주'], ['#modalOverlay.active #rsManualStatus', '완료'], ['#modalOverlay.active #rsManualPct', '100'], ['#modalOverlay.active #rsManualMetric', '10km'], ['#modalOverlay.active #rsManualKeyTakeaway', '페이스 6분']], click: '#modalOverlay.active #rsSave' }],
  ['close-modal-1', { closeModal: true }],
  // 결과 입력 모달 — 할 일(취소)
  ['edit-on-1', EDIT_ON],
  ['task-result-open', { nth: ['#goalDetailBody [data-taskresult]', 0] }],
  ['rs-cancel', '#modalOverlay.active #rsCancel'],
  // 결과 입력 모달 — 할 일(빈 저장 → 안내 토스트, 그다음 AI 글로 저장)
  ['task-result-open-2', { nth: ['#goalDetailBody [data-taskresult]', 0] }],
  ['rs-save-empty', '#modalOverlay.active #rsSave'],
  ['rs-save-task', { fill: [['#modalOverlay.active #rsAiQuickInput', '스트레칭 15분 완료']], click: '#modalOverlay.active #rsSave' }],
  ['close-modal-2', { closeModal: true }],
  // 결과 모달 위 앰비언트 1-Tap 카드: '완료 승인'(바로 저장) — 두 번째 할 일
  ['task-result-open-3', { nth: ['#goalDetailBody [data-taskresult]', 1] }],
  ['ambient-confirm', '#modalOverlay.active #ambientCheckinConfirmBtn'],
  ['close-modal-2b', { closeModal: true }],
  // 목표 결과 다시 열기(이미 값이 있어 미리보기·보관 버튼이 보인다) → 100% 로 저장
  ['edit-off-1', EDIT_OFF],
  ['goal-result-reopen', '#goalResultBtn'],
  ['rs-manual-save-goal-100', { fill: [['#modalOverlay.active #rsManualStatus', '완료'], ['#modalOverlay.active #rsManualPct', '100']], click: '#modalOverlay.active #rsSave' }],
  // 내보내기 — md(기본) 하나·전체, json 하나
  ['export-one-md', '#goalExportBtn'],
  ['export-all-md', '#goalExportAllBtn'],
  ['set-format-json', { evalFn: "(function(){ window.state.profile.settings.exportFormat = 'json'; return 'json'; })()" }],
  ['export-one-json', '#goalExportBtn'],
  ['set-format-back', { evalFn: "(function(){ delete window.state.profile.settings.exportFormat; return 'default'; })()" }],
  // 보관 — 결과 있는 목표(확인창 없음) → 100% 달성이면 완주 인증서
  ['edit-on-2', EDIT_ON],
  ['archive-g1-cert', '#goalArchiveBtn', 2500],
  ['cert-save', '#modalOverlay.active #certSaveBtn'],
  ['close-modal-3', { closeModal: true }],
  ['restore-1', RESTORE],
  ['back-goals-1', { goTab: 'goals' }],
  // 결과 모달의 '보관' 버튼(rsJustArchive) — 이전 전 코드 그대로 옮긴 경로(정의되지 않은 renderGoalDetail 을 부른다 — 두 앱 같은 오류여야 한다)
  ['chip-g1-again', '#goalChipRow [data-chip="g1"]'],
  ['edit-off-2', EDIT_OFF],
  ['goal-result-open-3', '#goalResultBtn'],
  ['rs-just-archive', '#modalOverlay.active #rsJustArchive'],
  // 같은 '보관' 버튼을 마일스톤 결과 모달에서(목표가 넘어오는 경로) — 보관·저장 뒤 정의되지 않은 renderGoalDetail 을 불러 오류가 난다(이전 전 그대로, 고치지 않음)
  ['close-modal-4', { closeModal: true }],
  ['ms-result-open-2', { nth: ['#goalDetailBody [data-msresult]', 0] }],
  ['rs-just-archive-ms', '#modalOverlay.active #rsJustArchive'],
  ['close-modal-5', { closeModal: true }],
  // 앰비언트 카드의 '완료 승인 및 보관'(저장 + 목표 보관) — 마일스톤 결과 모달에서(목표가 넘어온다)
  ['restore-1b', RESTORE],
  ['ms-result-open-3', { nth: ['#goalDetailBody [data-msresult]', 1] }],
  ['ambient-archive', '#modalOverlay.active #ambientCheckinArchiveBtn'],
  ['close-modal-6', { closeModal: true }],
  ['restore-2', RESTORE],
  ['back-goals-2', { goTab: 'goals' }],
  // 보관 — 결과 없는 목표 + 확인창 거절 → 바로 보관
  ['chip-g2', '#goalChipRow [data-chip="g2"]'],
  ['edit-on-3', EDIT_ON],
  ['archive-g2-dismiss', { click: '#goalArchiveBtn', dialog: 'dismiss' }],
  ['back-goals-3', { goTab: 'goals' }],
  // 보관 — 결과 없는 목표 + 확인창 수락 → 결과 입력 모달 → 저장 → 보관
  ['chip-g3', '#goalChipRow [data-chip="g3"]'],
  ['edit-on-4', EDIT_ON],
  ['archive-g3-accept', { click: '#goalArchiveBtn', dialog: 'accept' }],
  ['rs-save-and-archive-g3', { fill: [['#modalOverlay.active #rsAiQuickInput', '이번 달 책 3권 읽음']], click: '#modalOverlay.active #rsSave' }],
  ['back-goals-4', { goTab: 'goals' }],
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
      globals: { renderGoalsScreen: typeof window.renderGoalsScreen, openResultModal: typeof window.openResultModal, exportGoalSnapshot: typeof window.exportGoalSnapshot, buildGoalSnapshot: typeof window.buildGoalSnapshot, goalSnapshotSummary: typeof window.goalSnapshotSummary, archiveGoal: typeof window.archiveGoal, openGoalCertificateModal: typeof window.openGoalCertificateModal },
      blobs: (window.__es375blobs || []).splice(0),
      // 목표 키트(window.OurgoalGoalsKit)는 이번 이전이 만든 키트 객체다(일정 OurgoalCalendarKit 과 같은 틀) — 맞대지 않고 따로 적는다
      kit: typeof window.OurgoalGoalsKit };
  });
}
// 완주 인증서 그림(캔버스 PNG)은 같은 앱 2회 실행에서도 바이트가 달라(글꼴 그리기·워터마크) 내용 대신 자리표만 맞댄다 — 그림을 만든 함수(generateGoalCertificateImage)는 옮기지 않았다
const VOL = x => x == null ? x : String(x).replace(/data:image\/png;base64,[A-Za-z0-9+\/=]+/g, () => 'data:image/png;<canvas>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
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
  // 확인창: 기본은 거절(1차와 같음). 단계가 dialog:'accept' 를 주면 그 단계만 수락한다. 뜬 확인창 글자는 단계 기록에 남긴다.
  let dialogMode = 'dismiss'; const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message()); (dialogMode === 'accept' ? d.accept() : d.dismiss()).catch(() => {}); });
  // 내보내기 파일 내용: download() 가 만드는 Blob 의 글자를 적어 둔다(파일 이름·형식·내용 비교용). Blob 자체는 원래 생성자로 만든다.
  await page.evaluateOnNewDocument(() => {
    const OB = window.Blob; window.__es375blobs = [];
    const W = function (parts, opts) { try { window.__es375blobs.push((opts && opts.type || '') + '|' + (parts || []).map(p => typeof p === 'string' ? p : '[bin]').join('')); } catch (e) {} return new OB(parts, opts); };
    W.prototype = OB.prototype; window.Blob = W;
    const OA = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { (window.__es375blobs = window.__es375blobs || []).push('download|' + this.download); return; } return OA.apply(this, arguments); };
  });
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await boot(page);
  const nav = await goTab(page, 'goals');
  const steps = [];
  for (const [name, act] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    const extra = STEPS.find(x => x[0] === name)[2] || 0;
    dialogMode = (act && act.dialog) || 'dismiss';
    // shots-lib 게스트 시드는 window.confirm 을 늘 true 로 바꿔 둔다. 이 단계에서만 확인창 답을 정하고 물은 글자를 적는다(두 앱 같은 조작).
    if (act && act.dialog) await page.evaluate(mode => { window.confirm = function (m) { (window.__es375dlg = window.__es375dlg || []).push('confirm|' + m); return mode === 'accept'; }; }, act.dialog);
    if (act && act.fill) {
      note = await page.evaluate((pairs) => pairs.map(([sel, v]) => { const el = document.querySelector(sel); if (!el) return 'missing:' + sel; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 'set'; }).join(','), act.fill);
    }
    if (act && act.click) {
      note += (note ? ';' : '') + await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing'; el.click(); return 'clicked'; }, act.click);
    } else if (act && act.evalFn) {
      note = await page.evaluate(act.evalFn);
    } else if (act && act.goTab) {
      // 탭 버튼 진짜 누름이 막히면(보관 직후 기록 탭 위 겹침 등) 앱의 setTab 으로 옮긴다 — 두 앱 같은 조작, 어느 쪽으로 갔는지 note 에 남긴다
      const r = await goTab(page, act.goTab);
      note = 'tab:' + act.goTab + ':' + (r.ok ? 'click' : await page.evaluate(t => { if (typeof window.setTab !== 'function') return 'no-setTab'; window.setTab(t); return 'setTab'; }, act.goTab));
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
      await goTab(page, 'home'); await goTab(page, 'goals'); note = 'roundtrip';
    } else if (act && act.rerender) {
      note = await page.evaluate(() => { if (typeof window.renderGoalsScreen !== 'function') return 'no-fn'; window.renderGoalsScreen(); return 'called'; });
    }
    await sleep(900 + extra);
    const snap = await snapshot(page);
    const stubDialogs = await page.evaluate(() => (window.__es375dlg || []).splice(0));
    if (act && act.dialog) await page.evaluate(() => { window.confirm = () => true; });
    steps.push({ name, note, dialogs: dialogs.slice(dlgBefore).concat(stubDialogs), blobs: (snap.blobs || []).map(VOL), html: VOL(snap.html), modal: VOL(snap.modal), cal: snap.cal ? Object.assign({}, snap.cal, { goals: VOL(snap.cal.goals) }) : null, ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, reg: snap.reg, subs: snap.subs, globals: snap.globals, kit: snap.kit, newErrors: errors.slice(errBefore) });
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
})().catch(e => { console.error(e); process.exit(1); });
