'use strict';
// 인라인 스크립트 세포화 1차(#TASK-ES-423) DOM·저장값·토스트·캔버스 전후 비교. 소통 탭 1차 dom-compare-comm.js(#TASK-ES-379)의 틀을 따랐다:
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 활성 화면 HTML·모달·localStorage·토스트·내려받기·캔버스 해시·콘솔 오류를 기록해 맞댄다.
// 단계는 이번에 옮긴 함수가 불리는 곳을 차례로 누른다:
//   일정 탭 「잠금화면」 단추(#calLockScreenBtn) → 잠금화면 허브 창 → 「잠금화면용 일정 카드 저장」(#btnDownloadLockscreenCard = generateLockScreenScheduleCardImage, 내려받기 이름·이미지 해시)
//   → 전역 window.generateLockScreenCalendarImage(월간 달력 배경화면 — 이 노출은 index.html 에 그대로 있다)를 어두운·밝은 테마로 직접 불러 캔버스 해시(lsDrawRoundRect 포함)
//   기록 탭 「갓생 카드」(#recStoryCardBtn → openMzShareCardModal, index.html 에 남음) → 「동반자에게 보내기」(openSelectCompanionForStoryModal) → 닫기 → 다시 → 첫 동반자 「전송」
//   → 「팀 단체방에 인증」(openSelectTeamForStoryModal) → 닫기 → 다시 → 첫 팀 「인증」(groupState 채팅 낙관적 반영 확인)
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다. 같은 기준 앱 2회로 본질 변동을 먼저 잰다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-inline-split-1.js <baseApp> <afterApp> <out.json>
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
  const port = 5500 + Math.floor(Math.random() * 400);
  return new Promise(r => s.listen(port, () => r({ s, base: 'http://127.0.0.1:' + port })));
}
const click = sel => ({ evalFn: '(function(){ var el = document.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,12); })()' });
const clickIn = sel => ({ evalFn: '(function(){ var root = document.querySelector("#modalOverlay"); var el = root && root.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,12) + "|" + JSON.stringify(el.dataset); })()' });
// 캔버스 해시(FNV-1a 32비트) — 그림 글자 전체를 맞대는 대신 해시·길이를 적는다
const CANVAS_CALL = theme => ({ evalFn: '(async function(){ if(typeof window.generateLockScreenCalendarImage !== "function") return "no-fn"; var s = window.state || {}; var d = new Date(); try { var c = await window.generateLockScreenCalendarImage(d.getFullYear(), d.getMonth(), s.records || [], s.goals || [], { theme: ' + JSON.stringify(theme) + ' }); var u = c.toDataURL("image/png"); var h = 2166136261; for (var i = 0; i < u.length; i++){ h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return "canvas:" + c.width + "x" + c.height + ":len" + u.length + ":h" + h.toString(16); } catch(e){ return "throw:" + String(e).slice(0,80); } })()' });
const typeIn = (txt) => ({ evalFn: '(function(){ var t = document.getElementById("captureInput"); if(!t) return "missing"; t.focus(); t.value = ' + JSON.stringify(txt) + '; t.dispatchEvent(new Event("input", { bubbles: true })); var m = document.getElementById("captureLiveMeta"); var c = document.getElementById("captureCharCount"); return "typed:" + (m ? m.style.display : "-") + ":" + (c ? c.textContent : "-"); })()' });
const recCount = { evalFn: '(function(){ var s = window.state; var r = s && s.profile && s.profile.records; return "records:" + (r ? r.length : "-") + ":" + (r && r[0] ? JSON.stringify({ type: r[0].type, text: r[0].text, theme: r[0].theme, energy: r[0].energy, focus: r[0].focus, hasFb: !!r[0].feedback }) : "-"); })()' };
const STEP_FILE = require(require('path').resolve(process.argv[5]));
const STEPS = STEP_FILE.steps({ click, clickIn, CANVAS_CALL });
const GLOBAL_NAMES = STEP_FILE.globals;
const KIT_NAMES = STEP_FILE.kits;
async function snapshot(page) {
  return page.evaluate((GN, KN) => {
    const scr = document.querySelector('.screen.active');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    return { html: scr ? scr.outerHTML : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: scr ? scr.id : null, downloads: (window.__es423dl || []).splice(0),
      // 옮긴 함수 이름이 window 에 새로 달리지 않았는가(이전 전과 같아야 한다 — 단계 파일 globals 목록)
      globals: GN.reduce(function(o, n){ o[n] = typeof window[n]; return o; }, {}),
      kits: KN.reduce(function(o, n){ o[n] = window[n] ? Object.keys(window[n]).sort().join(",") : null; return o; }, {}) };
  }, GLOBAL_NAMES, KIT_NAMES);
}
const VOL = x => x == null ? x : String(x).replace(/data:image\/png;base64,[A-Za-z0-9+\/=]+/g, () => 'data:image/png;<canvas>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(ms|t|task|g|goal|fc|qr|c)_[a-z0-9]{8,}/g, '$1_<uid>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d(?![:\d])/g, '<dtl>').replace(/(lsSim(?:StatusTime|ClockTime)\\*"[^>]*>)\d{1,2}:\d\d/g, '$1<hh:mm>').replace(/>\d{1,2}:\d\d</g, '><hh:mm><' /* #TASK-ES-439: 기록 카드·최근 기록 줄의 시각(분 단위 지금 시각 — 같은 앱 두 번 실행에서도 바뀐다) */).replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:<port>').replace(/(mnPreviewName\\*"?>)[^<]+/g, '$1<anon>');
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; } return x; }
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(sortKeys(j), (key, x) => (key === 'bonusCraftCredits' || key === 'maxBaseCrafts' /* #TASK-ES-461: 저장 시점이 실행마다 다르다(기준 대 기준에서도 있고 없음이 갈림) */) ? undefined : (key === 'lastStreakAwarded' && x === 0) ? undefined /* #TASK-ES-439: 기본값 0 이 저장되는 시점이 실행마다 다르다(같은 앱 두 번 실행에서도 갈림 — 기준 대 기준·후 대 후 모두 측정) */ : (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string') ? '<hash>' : x); } catch (e) {}
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
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message()); d.dismiss().catch(() => {}); });
  // 내려받기: <a download> 클릭을 가로채 이름과 이미지 해시만 적는다(파일은 만들지 않는다)
  // #TASK-ES-461: 난수 고정(마니또 익명 이름·AI 짝 이름이 Math.random 으로 뽑힌다) — 기준·후 같은 씨앗, 같은 호출 순서면 같은 값
  await page.evaluateOnNewDocument(() => { let s = 20261005; Math.random = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; });
  await page.evaluateOnNewDocument(() => {
    window.__es423dl = [];
    const OA = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { const u = String(this.href || ''); let h = 2166136261; for (let i = 0; i < u.length; i++) { h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } window.__es423dl.push('download|' + this.download + '|len' + u.length + '|h' + h.toString(16)); return; }
      return OA.apply(this, arguments);
    };
  });
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  const bootNote = await boot(page);
  const steps = [];
  for (const [name, act, extra] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (act.evalFn) note = String(await page.evaluate(act.evalFn));
    else if (act.goTab) { const r = await goTab(page, act.goTab); note = 'tab:' + act.goTab + ':' + (r.ok ? 'ok' : r.note); }
    else if (act.closeModal) note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    else if (act.tabRoundTrip) { await goTab(page, 'home'); await goTab(page, 'records'); note = 'roundtrip'; }
    await sleep(900 + (extra || 0));
    const snap = await snapshot(page);
    steps.push({ name, note: VOL(note), dialogs: dialogs.slice(dlgBefore), downloads: snap.downloads, html: VOL(snap.html), modal: VOL(snap.modal), ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, globals: snap.globals, kits: snap.kits, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, bootNote, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  const ra = await run(A, 'base'), ra2 = await run(A, 'base-2'), rb = await run(B, 'after');
  // kits 칸은 이번 이전이 탭 키트에 이름을 더하므로 다르다(의도한 차이) — 맞대지 않고 따로 적는다
  const FIELDS = ['note', 'dialogs', 'downloads', 'html', 'modal', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors'];
  const cmp = (P, Q) => {
    const out = [];
    P.steps.forEach((sa, i) => {
      const sb = Q.steps[i];
      for (const k of FIELDS) {
        const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
        if (x === y) continue;
        // 저장값(ls)은 키마다 맞대어 어느 키가 다른지 적는다(긴 프로필 JSON 앞부분만 잘려 보이지 않게)
        if (k === 'ls') {
          for (const key of [...new Set([...Object.keys(sa.ls || {}), ...Object.keys(sb.ls || {})])].sort()) {
            const p = String((sa.ls || {})[key]), q = String((sb.ls || {})[key]);
            if (p === q) continue;
            let j = 0; while (j < p.length && p[j] === q[j]) j++;
            out.push({ step: sa.name, field: 'ls.' + key, base: p.slice(Math.max(0, j - 80), j + 160), after: q.slice(Math.max(0, j - 80), j + 160) });
          }
          continue;
        }
        let at = 0; while (at < x.length && x[at] === y[at]) at++;
        out.push({ step: sa.name, field: k, base: x.slice(Math.max(0, at - 120), at + 200), after: y.slice(Math.max(0, at - 120), at + 200) });
      }
    });
    return out;
  };
  const diffs = cmp(ra, rb);
  const baseVsBase = cmp(ra, ra2);
  const summary = { env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ' => ' + s.note + ' / ' + rb.steps[i].note),
    comparedFields: ra.steps.length * FIELDS.length,
    digestAfter: rb.steps.map(s => ({ step: s.name, note: s.note, toast: s.toast, downloads: s.downloads, dialogs: s.dialogs, activeScreen: s.activeScreen, modalHead: (s.modal || '').slice(0, 160), newErrors: s.newErrors })),
    differing: diffs.length, diffs, baseVsBaseDiffering: baseVsBase.length, baseVsBase,
    errorsBase: ra.errors, errorsBase2: ra2.errors, errorsAfter: rb.errors, bootBase: ra.bootNote, bootAfter: rb.bootNote,
    kitsBase: ra.steps[0].kits, kitsAfter: rb.steps[0].kits };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'base-vs-base differing', baseVsBase.length, 'errors base/base2/after', ra.errors.length, ra2.errors.length, rb.errors.length);
  console.log(summary.notes.join('\n'));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
  for (const d of baseVsBase.slice(0, 6)) console.log('BB', JSON.stringify(d).slice(0, 400));
})().catch(e => { console.error(e); process.exitCode = 1; });
