'use strict';
// #TASK-ES-672 — 사진 첨부 · Notion 자동 전송 본문 탐침. PR #936 독립 검토자가 쓴 탐침(c6-probe.cjs)을 경로만 인자로 받게 바꿔 옮겼다(재는 내용은 그대로).
// 작업자 PC 측정 — 판정이 아니다. 사용: node photo-notion-probe.cjs <기준 트리> <작업 트리> <out.json>
// 시나리오 어휘 밖 탐침. 법정의 Chrome 실행기·정적 서버만 빌려 쓴다(읽기·실행).
//  P1 사진 첨부: 파일 입력에 PNG 를 넣음 → 미리보기 → 일반저장 → 저장값의 photo → 수정으로 다시 열어 미리보기 → 수정 저장 뒤에도 photo 유지
//  P2 Notion 자동 전송: 게스트 설정에 가짜 키·DB id·자동 전송을 심고 새로 고침 → 템플릿을 공부로 바꾼 뒤 저장 → /api/notion-push 로 나가는 요청 본문(같은 출처의 로컬 정적 서버로만 간다. 외부 통신은 전부 막혀 있다)
// 기준: base 와 head 의 관측값이 같은가.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const BASE = path.resolve(process.argv[2]), HEAD = path.resolve(process.argv[3]), OUT = process.argv[4];
const COURT = path.join(HEAD, 'court');
const { launch, sleep } = require(path.join(COURT, 'lib', 'chrome.js'));
const server = require(path.join(COURT, 'lib', 'static-server.js'));
const siteHostLib = require(path.join(COURT, 'lib', 'site-host.js'));
const cfg = JSON.parse(fs.readFileSync(path.join(COURT, 'config.json'), 'utf8'));
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);
// #TASK-ES-672 에서 더함: 같은 출처로 나간 요청 기록 전체(AI 피드백 요청 등)에도 실행마다 다른 기록 ID·시각이 들어 있어, 맞대기 전에 그 꼴만 가린다(처음 실행에서 이 칸이 기록 UUID 하나로 갈렸다).
const scrubRun = s => (s === null || s === undefined ? s : String(s).replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?/g, '<ISO>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<UUID>').replace(/sched_[a-z0-9]{8,}/g, '<SCHED>').replace(/guest-[a-z0-9]{6,}/g, '<GUEST>').replace(/(?<![0-9])1[6-9]\d{11}(?![0-9])/g, '<EPOCH>'));
const PNG = path.join(fs.mkdtempSync(path.join(require('os').tmpdir(), 'es672-probe-')), 'probe.png'); // 저장소 밖 임시 파일
fs.writeFileSync(PNG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFklEQVR4nGP8z4AdMOEQH5UYlRgkEgAsAQIPbRzhIAAAAABJRU5ErkJggg==', 'base64'));

async function session(dir, label, fn) {
  const srv = await server.start(path.resolve(dir), cfg.denyServePrefixes);
  const host = siteHostLib.pickSiteHost(cfg); const site = siteHostLib.siteUrlFor(host, srv.port);
  const b = await launch({ viewport: { width: 430, height: 932 }, allowHosts: [], siteOrigin: site, locale: cfg.locale });
  const p = b.page; const log = { exceptions: [], consoleErrors: [], warns: [], requests: [] };
  try {
    p.on('Runtime.exceptionThrown', x => { const d = x.exceptionDetails || {}; log.exceptions.push(String(d.exception && d.exception.description ? d.exception.description.split('\n')[0] : d.text)); });
    p.on('Runtime.consoleAPICalled', x => { const t = (x.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ').slice(0, 200); if (x.type === 'error') log.consoleErrors.push(t); if (x.type === 'warning' || x.type === 'log') if (/Notion|ProTemplate/.test(t)) log.warns.push(x.type + ': ' + t.replace(site, '<SITE>')); });
    p.on('Network.requestWillBeSent', x => { const r = x.request || {}; if (String(r.url).startsWith(site + '/api/')) log.requests.push({ url: r.url.slice(site.length), method: r.method, body: r.postData || null }); });
    p.on('Page.javascriptDialogOpening', () => { p.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); });
    await p.send('Page.enable'); await p.send('Runtime.enable'); await p.send('Network.enable'); await p.send('DOM.enable');
    await p.send('Network.setBypassServiceWorker', { bypass: true });
    await p.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    try { await p.send('Emulation.setTimezoneOverride', { timezoneId: cfg.timezone || 'Asia/Seoul' }); } catch (_) {}
    try { await p.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{Object.defineProperty(Navigator.prototype,"webdriver",{get:function(){return false;},configurable:true});}catch(e){}' }); } catch (_) {}
    try { const r0 = await p.send('Runtime.evaluate', { expression: 'navigator.userAgent', returnByValue: true }); const ua = String(r0.result.value).replace(/HeadlessChrome/g, 'Chrome'); await p.send('Network.setUserAgentOverride', { userAgent: ua, acceptLanguage: 'ko-KR,ko' }); } catch (_) {}
    const stubs = (cfg.stubs || []).map(st => ({ urlPattern: st.urlPattern, re: new RegExp('^' + st.urlPattern.split('*').map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'), contentType: st.contentType, body: fs.readFileSync(path.resolve(COURT, st.file)).toString('base64') }));
    p.on('Fetch.requestPaused', x => { const st = stubs.find(s => s.re.test(x.request.url)); if (st) p.send('Fetch.fulfillRequest', { requestId: x.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: st.contentType }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: st.body }).catch(() => {}); else p.send('Fetch.continueRequest', { requestId: x.requestId }).catch(() => {}); });
    if (stubs.length) await p.send('Fetch.enable', { patterns: stubs.map(s => ({ urlPattern: s.urlPattern })) });
    const ev = async expr => { const r = await p.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error('조회식 오류: ' + JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result ? r.result.value : undefined; };
    const visible = sel => ev('(function(){var e=document.querySelectorAll(' + JSON.stringify(sel) + ');var n=0;for(var i=0;i<e.length;i++){var r=e[i].getBoundingClientRect();var s=getComputedStyle(e[i]);if(r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none")n++;}return n;})()');
    const waitFor = async (sel, ms) => { const t = Date.now() + (ms || 15000); while (Date.now() < t) { if (await visible(sel) > 0) return; await sleep(100); } throw new Error(label + ': 보이지 않음 ' + sel); };
    const waitGone = async (sel, ms) => { const t = Date.now() + (ms || 8000); while (Date.now() < t) { if (await visible(sel) === 0) return; await sleep(100); } throw new Error(label + ': 사라지지 않음 ' + sel); };
    const click = async sel => { await waitFor(sel); const r = JSON.parse(await ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');e.scrollIntoView({block:"center"});var r=e.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()')); await sleep(80); await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await sleep(250); };
    const setVal = async (sel, v) => { await waitFor(sel); await ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');e.focus();e.value=' + JSON.stringify(v) + ';e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));})()'); await sleep(120); };
    const goto = async () => { const loaded = new Promise(res => { let d = false; p.on('Page.loadEventFired', () => { if (!d) { d = true; res(); } }); setTimeout(() => { if (!d) { d = true; res(); } }, 20000); }); await p.send('Page.navigate', { url: site + '/index.html' }); await loaded; await sleep(1200); };
    const ls = async () => JSON.parse(await ev('JSON.stringify(localStorage)'));
    const api = { p, ev, visible, waitFor, waitGone, click, setVal, goto, ls, log, site, sleep };
    const res = await fn(api);
    return Object.assign({ label }, res, { exceptions: log.exceptions, consoleErrorKinds: Array.from(new Set(log.consoleErrors.map(t => t.replace(site, '<SITE>').replace(/eyJ[A-Za-z0-9_.-]+/g, '<JWT>').slice(0, 120)))).sort(), warns: log.warns, requests: log.requests.map(r => ({ url: r.url, method: r.method, body: scrubRun(r.body) })) });
  } finally { try { await b.close(); } catch (_) {} try { await srv.close(); } catch (_) {} }
}
async function enterGuestOpenModal(a) {
  await a.goto(); await a.click('#btnLandingPreviewDirect'); await a.click('#btnAvatarGreetClose'); await a.waitGone('#btnAvatarGreetClose');
  await a.click('.navbtn[data-tab="records"]'); await a.sleep(1200); for (let i = 0; i < 4; i++) { await a.click('#recQuickDockBar > button:nth-child(4)'); await a.sleep(500); if (await a.visible('#recOpenProTemplateBtn') > 0) break; } await a.sleep(300); await a.click('#recOpenProTemplateBtn'); await a.waitFor('#proTable');
}
const settingsOf = store => { const k = Object.keys(store).find(x => /^ourgoal_settings_guest-/.test(x)); return k ? JSON.parse(store[k]) : null; };
const recs = store => { const s = settingsOf(store); return s && s.proTemplateRecords ? Object.values(s.proTemplateRecords) : []; };
const profRecs = store => { try { return (JSON.parse(store.ourgoal_guest_profile).records || []).filter(r => r.type === 'template'); } catch (_) { return []; } };
const strip = r => { const o = Object.assign({}, r); for (const k of ['id', 'createdAt', 'startAt']) delete o[k]; if (o.photo) o.photo = 'sha:' + sha(o.photo) + ' len:' + o.photo.length; return o; };

async function P1(a) {
  await enterGuestOpenModal(a);
  const doc = await a.p.send('DOM.getDocument', {}); const node = await a.p.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#proFileInput' });
  await a.p.send('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [PNG] });
  await a.waitFor('#proPhotoPreview img', 8000);
  const previewSrc1 = await a.ev('document.querySelector("#proPhotoPreview img").getAttribute("src")');
  await a.setVal('.pro-tpl-cell-input[data-row="0"][data-col="1"]', '사진탐침');
  await a.click('#proGeneralSaveBtn'); await a.waitGone('#proTable'); await a.sleep(600);
  const s1 = await a.ls(); const r1 = recs(s1), p1 = profRecs(s1);
  await a.click('.rec-card [data-recedit]'); await a.waitFor('#proTable');
  const previewHtml2 = await a.ev('(document.querySelector("#proPhotoPreview")||{}).innerHTML||""');
  await a.setVal('#proRecMemo', '사진 수정 저장');
  await a.click('#proGeneralSaveBtn'); await a.waitGone('#proTable'); await a.sleep(600);
  const s2 = await a.ls(); const r2 = recs(s2), p2 = profRecs(s2);
  return { preview1: 'sha:' + sha(previewSrc1) + ' len:' + String(previewSrc1).length, afterSave: { settingsRecords: r1.map(strip), profileRecords: p1.map(strip), sameIdInBoth: r1.length === 1 && p1.length === 1 && r1[0].id === p1[0].id },
    reopenPreviewHasImg: /<img/.test(previewHtml2), reopenPreview: 'sha:' + sha(previewHtml2), afterEditSave: { settingsRecords: r2.map(strip), profileRecords: p2.map(strip), idKept: r1[0] && r2[0] && r1[0].id === r2[0].id, createdAtKept: r1[0] && r2[0] && r1[0].createdAt === r2[0].createdAt, count: [r2.length, p2.length] } };
}
async function P2(a) {
  await a.goto(); await a.click('#btnLandingPreviewDirect'); await a.click('#btnAvatarGreetClose'); await a.waitGone('#btnAvatarGreetClose'); await a.sleep(500);
  // 게스트 설정에 자동 전송을 심는다(가짜 값 — 요청은 같은 출처의 로컬 정적 서버 /api/notion-push 로만 간다)
  const seeded = await a.ev('(function(){var n=0;var keys=Object.keys(localStorage);for(var i=0;i<keys.length;i++){var k=keys[i];if(/^ourgoal_settings_guest-/.test(k)){var s=JSON.parse(localStorage.getItem(k));s.notionAutoPush=true;s.notionApiKey="REVIEW-FAKE-KEY";s.notionDatabaseId="REVIEW-FAKE-DB";localStorage.setItem(k,JSON.stringify(s));n++;}}try{var g=JSON.parse(localStorage.getItem("ourgoal_guest_profile"));if(g&&g.settings){g.settings.notionAutoPush=true;g.settings.notionApiKey="REVIEW-FAKE-KEY";g.settings.notionDatabaseId="REVIEW-FAKE-DB";localStorage.setItem("ourgoal_guest_profile",JSON.stringify(g));n+=10;}}catch(e){}return n;})()');
  await a.goto(); await a.waitFor('.navbtn[data-tab="records"]', 20000);
  await a.click('.navbtn[data-tab="records"]'); await a.sleep(1200); for (let i = 0; i < 4; i++) { await a.click('#recQuickDockBar > button:nth-child(4)'); await a.sleep(500); if (await a.visible('#recOpenProTemplateBtn') > 0) break; } await a.sleep(300); await a.click('#recOpenProTemplateBtn'); await a.waitFor('#proTable');
  // 저장 전에 템플릿을 바꾼다(도구 조각이 ctx.curTpl·ctx.columns·ctx.rows 를 바꾸고, 저장 조각이 await 뒤에 그것을 읽는다)
  await a.ev('(function(){var s=document.querySelector("#proTplSelect");s.value="study";s.dispatchEvent(new Event("change",{bubbles:true}));})()'); await a.sleep(200);
  await a.setVal('.pro-tpl-cell-input[data-row="0"][data-col="1"]', '노션탐침');
  await a.setVal('#proRecMemo', '자동 전송 탐침');
  await a.click('#proCalendarSaveBtn'); await a.waitGone('#proTable'); await a.sleep(1500);
  const st = await a.ls(); const set = settingsOf(st);
  const norm = s => String(s).replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?/g, '<ISO>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<UUID>').replace(/sched_[a-z0-9]{8,}/g, '<SCHED>').replace(/\d{4}-\d{2}-\d{2}/g, '<DATE>').replace(/\b\d{6}(?=[^\d])/g, '<YYMMDD>');
  return { seeded, settingsHasAutoPush: !!(set && set.notionAutoPush), notionRequests: a.log.requests.filter(r => /notion/.test(r.url)).map(r => ({ url: r.url, method: r.method, body: norm(r.body) })),
    records: recs(st).map(strip).map(r => JSON.parse(norm(JSON.stringify(r)))), schedules: ((set && set.customSchedules) || []).map(s => JSON.parse(norm(JSON.stringify(s)))) };
}
(async () => {
  const out = {};
  for (const [name, fn] of [['P1-photo-attach', P1], ['P2-notion-autopush', P2]]) {
    const b = await session(BASE, 'base', fn).catch(e => ({ error: String(e && e.message || e) }));
    const h = await session(HEAD, 'head', fn).catch(e => ({ error: String(e && e.message || e) }));
    const jb = JSON.stringify(Object.assign({}, b, { label: 0 })), jh = JSON.stringify(Object.assign({}, h, { label: 0 }));
    out[name] = { same: jb === jh, base: b, head: h };
    console.log(name, 'base==head:', jb === jh, '| base 예외', (b.exceptions || []).length, 'head 예외', (h.exceptions || []).length, b.error ? '| base 오류 ' + b.error : '', h.error ? '| head 오류 ' + h.error : '');
  }
  const res = { tool: 'reports/TASK-ES-672/tools/photo-notion-probe.cjs (court/lib/chrome.js · static-server.js · site-host.js 읽기 전용)', type: '작업자 PC 측정 — 판정 아님', measuredAt: new Date().toISOString(),
    note: 'P1 은 파일 입력에 8×8 PNG 를 넣어 미리보기·저장값의 photo·다시 열기·수정 저장을 본다. P2 는 게스트 설정에 가짜 키와 자동 전송을 심어 저장할 때 같은 출처의 로컬 정적 서버 /api/notion-push 로 나가는 요청 본문을 본다(외부 통신은 막혀 있다 — 바깥으로 나간 것은 없다).',
    allSame: Object.values(out).every(x => x.same === true), errors: Object.entries(out).filter(([, x]) => (x.base && x.base.error) || (x.head && x.head.error)).map(([k]) => k), results: out };
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1) + '\n', { encoding: 'utf8' });
  try { fs.rmSync(path.dirname(PNG), { recursive: true, force: true }); } catch (_) { /* 무시 */ }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(2); });
